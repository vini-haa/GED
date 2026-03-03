package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

// ObservacaoService gerencia operações com observações de protocolos.
type ObservacaoService struct {
	queries    *db.Queries
	sagiRepo   *repository.SAGIProtocoloRepository
	activitySvc *ActivityLogService
}

// NewObservacaoService cria uma instância do ObservacaoService.
func NewObservacaoService(queries *db.Queries, sagiRepo *repository.SAGIProtocoloRepository, activitySvc *ActivityLogService) *ObservacaoService {
	return &ObservacaoService{
		queries:    queries,
		sagiRepo:   sagiRepo,
		activitySvc: activitySvc,
	}
}

// List retorna observações de um protocolo (importantes no topo).
func (s *ObservacaoService) List(ctx context.Context, protocolID int, source, userEmail string, isAdmin bool) (*dto.ListObservacoesResponse, error) {
	obs, err := s.queries.ListObservacoesByProtocol(ctx, db.ListObservacoesByProtocolParams{
		ProtocolID:     pgtype.Int4{Int32: int32(protocolID), Valid: true},
		ProtocolSource: pgtype.Text{String: source, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("erro ao listar observações: %w", err)
	}

	recentCount, err := s.queries.CountRecentObservacoes(ctx, db.CountRecentObservacoesParams{
		ProtocolID:     pgtype.Int4{Int32: int32(protocolID), Valid: true},
		ProtocolSource: pgtype.Text{String: source, Valid: true},
	})
	if err != nil {
		recentCount = 0
	}

	items := make([]dto.ObservacaoItem, len(obs))
	for i, o := range obs {
		items[i] = observacaoToItem(o, userEmail, isAdmin)
	}

	return &dto.ListObservacoesResponse{
		Data:      items,
		Total:     len(items),
		HasRecent: recentCount > 0,
	}, nil
}

// Create cria uma nova observação, buscando o setor do autor no SAGI.
func (s *ObservacaoService) Create(ctx context.Context, protocolID int, protocolNumber, source string, req dto.CreateObservacaoRequest, userEmail, userName string) (*dto.ObservacaoItem, error) {
	// Buscar setor do autor no SAGI
	setor := s.resolveUserSector(ctx, userEmail)

	obs, err := s.queries.CreateObservacao(ctx, db.CreateObservacaoParams{
		ProtocoloSagi:  protocolNumber,
		ProtocolID:     pgtype.Int4{Int32: int32(protocolID), Valid: true},
		ProtocolSource: pgtype.Text{String: source, Valid: true},
		Texto:          req.Content,
		IsImportant:    pgtype.Bool{Bool: req.IsImportant, Valid: true},
		AutorEmail:     userEmail,
		AutorNome:      userName,
		AutorSetor:     pgtype.Text{String: setor, Valid: setor != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("erro ao criar observação: %w", err)
	}

	// Activity log
	s.activitySvc.Log(ActivityLogEntry{
		Action:         "observation_create",
		EntityType:     "observation",
		EntityID:       obs.ID.String(),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     protocolID,
		ProtocolNumber: protocolNumber,
		ProtocolSource: source,
	})

	item := observacaoToItem(obs, userEmail, false)
	return &item, nil
}

// Update edita o conteúdo de uma observação (somente autor).
func (s *ObservacaoService) Update(ctx context.Context, obsID uuid.UUID, req dto.UpdateObservacaoRequest, userEmail, userName string) (*dto.ObservacaoItem, error) {
	existing, err := s.queries.GetObservacaoByID(ctx, obsID)
	if err != nil {
		return nil, fmt.Errorf("observação não encontrada: %w", err)
	}

	if existing.AutorEmail != userEmail {
		return nil, fmt.Errorf("sem permissão para editar esta observação")
	}

	updated, err := s.queries.UpdateObservacaoContent(ctx, db.UpdateObservacaoContentParams{
		ID:    obsID,
		Texto: req.Content,
	})
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar observação: %w", err)
	}

	// Activity log
	protocolID := 0
	if updated.ProtocolID.Valid {
		protocolID = int(updated.ProtocolID.Int32)
	}
	s.activitySvc.Log(ActivityLogEntry{
		Action:         "observation_edit",
		EntityType:     "observation",
		EntityID:       obsID.String(),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     protocolID,
		ProtocolNumber: updated.ProtocoloSagi,
		ProtocolSource: updated.ProtocolSource.String,
	})

	item := observacaoToItem(updated, userEmail, false)
	return &item, nil
}

// ToggleImportant inverte o flag is_important (somente autor).
func (s *ObservacaoService) ToggleImportant(ctx context.Context, obsID uuid.UUID, userEmail string) (*dto.ObservacaoItem, error) {
	existing, err := s.queries.GetObservacaoByID(ctx, obsID)
	if err != nil {
		return nil, fmt.Errorf("observação não encontrada: %w", err)
	}

	if existing.AutorEmail != userEmail {
		return nil, fmt.Errorf("sem permissão para alterar esta observação")
	}

	updated, err := s.queries.ToggleObservacaoImportant(ctx, obsID)
	if err != nil {
		return nil, fmt.Errorf("erro ao alternar importância: %w", err)
	}

	item := observacaoToItem(updated, userEmail, false)
	return &item, nil
}

// SoftDelete faz soft delete de uma observação (autor ou admin).
func (s *ObservacaoService) SoftDelete(ctx context.Context, obsID uuid.UUID, userEmail, userName string, isAdmin bool) error {
	existing, err := s.queries.GetObservacaoByID(ctx, obsID)
	if err != nil {
		return fmt.Errorf("observação não encontrada: %w", err)
	}

	if existing.AutorEmail != userEmail && !isAdmin {
		return fmt.Errorf("sem permissão para excluir esta observação")
	}

	_, err = s.queries.SoftDeleteObservacao(ctx, db.SoftDeleteObservacaoParams{
		ID:        obsID,
		DeletedBy: pgtype.Text{String: userEmail, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("erro ao excluir observação: %w", err)
	}

	// Activity log
	protocolID := 0
	if existing.ProtocolID.Valid {
		protocolID = int(existing.ProtocolID.Int32)
	}
	s.activitySvc.Log(ActivityLogEntry{
		Action:         "observation_delete",
		EntityType:     "observation",
		EntityID:       obsID.String(),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     protocolID,
		ProtocolNumber: existing.ProtocoloSagi,
		ProtocolSource: existing.ProtocolSource.String,
	})

	return nil
}

// ResolveProtocolInfo resolve protocol_id e protocol_number a partir de source e id string.
func (s *ObservacaoService) ResolveProtocolInfo(ctx context.Context, source, idStr string) (protocolID int, protocolNumber string, err error) {
	switch source {
	case "sagi":
		protocolID, err = strconv.Atoi(idStr)
		if err != nil {
			return 0, "", fmt.Errorf("ID inválido: %s", idStr)
		}
		if s.sagiRepo == nil {
			return 0, "", fmt.Errorf("SAGI indisponível")
		}
		proto, err := s.sagiRepo.GetProtocoloByID(ctx, protocolID)
		if err != nil {
			return 0, "", err
		}
		return protocolID, proto.NumeroProtocolo, nil

	case "interno":
		idInt, err := strconv.Atoi(idStr)
		if err != nil {
			return 0, "", fmt.Errorf("ID de protocolo interno inválido: %w", err)
		}
		proto, err := s.queries.GetInternalProtocolByID(ctx, int32(idInt))
		if err != nil {
			return 0, "", fmt.Errorf("protocolo interno não encontrado: %w", err)
		}
		return 0, proto.ProtocolNumber, nil

	default:
		return 0, "", fmt.Errorf("source inválido: %s", source)
	}
}

// resolveUserSector busca o setor do usuário no SAGI.
func (s *ObservacaoService) resolveUserSector(ctx context.Context, email string) string {
	if s.sagiRepo == nil {
		return "Administração GED"
	}

	setor, err := s.sagiRepo.GetUserSectorByEmail(ctx, email)
	if err != nil || setor == "" {
		return "Administração GED"
	}
	return setor
}

// observacaoToItem converte db.Observaco para dto.ObservacaoItem.
func observacaoToItem(o db.Observaco, userEmail string, isAdmin bool) dto.ObservacaoItem {
	var criadoEm, editadoEm *time.Time
	if o.CriadoEm.Valid {
		criadoEm = &o.CriadoEm.Time
	}
	if o.EditadoEm.Valid {
		editadoEm = &o.EditadoEm.Time
	}

	protocolID := 0
	if o.ProtocolID.Valid {
		protocolID = int(o.ProtocolID.Int32)
	}

	isAuthor := o.AutorEmail == userEmail

	return dto.ObservacaoItem{
		ID:              o.ID.String(),
		ProtocolID:      protocolID,
		ProtocolSource:  o.ProtocolSource.String,
		Content:         o.Texto,
		IsImportant:     o.IsImportant.Valid && o.IsImportant.Bool,
		CreatedByEmail:  o.AutorEmail,
		CreatedByName:   o.AutorNome,
		CreatedBySector: o.AutorSetor.String,
		CreatedAt:       criadoEm,
		UpdatedAt:       editadoEm,
		CanEdit:         isAuthor,
		CanDelete:       isAuthor || isAdmin,
	}
}
