package service

import (
	"context"
	"fmt"
	"math"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

// Transições de status válidas.
var validTransitions = map[string][]string{
	"aberto":     {"em_analise", "cancelado"},
	"em_analise": {"finalizado", "arquivado", "cancelado"},
	"finalizado": {"arquivado"},
	"arquivado":  {},
	"cancelado":  {},
}

// InternalProtocolService gerencia protocolos internos do GED.
type InternalProtocolService struct {
	pool        *pgxpool.Pool
	queries     *db.Queries
	setorRepo   *repository.SAGISetorRepository
	activitySvc *ActivityLogService
}

// NewInternalProtocolService cria uma instância do service.
func NewInternalProtocolService(
	pool *pgxpool.Pool,
	queries *db.Queries,
	setorRepo *repository.SAGISetorRepository,
	activitySvc *ActivityLogService,
) *InternalProtocolService {
	return &InternalProtocolService{
		pool:        pool,
		queries:     queries,
		setorRepo:   setorRepo,
		activitySvc: activitySvc,
	}
}

// Create cria um novo protocolo interno com número gerado atomicamente.
func (s *InternalProtocolService) Create(ctx context.Context, req dto.CreateInternalProtocolRequest, userEmail, userName, userSetor string) (*dto.InternalProtocolDetail, error) {
	// Obter setor do usuário no SAGI
	sectorCode, sectorName, err := s.setorRepo.GetUserSectorCode(ctx, userEmail)
	if err != nil {
		// Fallback: usar setor do token JWT (middleware) ou sector_code do request
		fallbackCode := 0
		if userSetor != "" {
			fallbackCode, _ = strconv.Atoi(userSetor)
		}
		if fallbackCode == 0 && req.SectorCode != nil {
			fallbackCode = *req.SectorCode
		}
		if fallbackCode > 0 {
			// Busca direta no SAGI (sem filtro de ativos)
			setor, lookupErr := s.setorRepo.GetSetorByCodeDirect(ctx, fallbackCode)
			if lookupErr == nil {
				sectorCode = setor.Codigo
				sectorName = setor.Descricao
				err = nil
			}
		}
		if err != nil {
			return nil, fmt.Errorf("não foi possível determinar seu setor: %w", err)
		}
	}

	// Gerar número atômico via transação
	var proto db.InternalProtocol
	var movement db.InternalProtocolMovement

	err = pgx.BeginTxFunc(ctx, s.pool, pgx.TxOptions{}, func(tx pgx.Tx) error {
		qtx := s.queries.WithTx(tx)

		year := int32(time.Now().Year())
		nextSeq, err := qtx.GetNextSequence(ctx, year)
		if err != nil {
			return fmt.Errorf("erro ao obter próxima sequência: %w", err)
		}

		number := fmt.Sprintf("GED-%d-%04d", year, nextSeq)

		proto, err = qtx.CreateInternalProtocol(ctx, db.CreateInternalProtocolParams{
			ProtocolNumber:    number,
			Year:              year,
			Sequence:          nextSeq,
			Subject:           req.Subject,
			Interested:        req.Interested,
			Sender:            req.Sender,
			ProjectName:       req.ProjectName,
			CurrentSectorCode: int32(sectorCode),
			CurrentSectorName: sectorName,
			CreatedByID:       userEmail,
			CreatedByEmail:    userEmail,
			CreatedByName:     pgtype.Text{String: userName, Valid: userName != ""},
			Observations:      req.Observations,
		})
		if err != nil {
			return fmt.Errorf("erro ao criar protocolo: %w", err)
		}

		// Movimento inicial (abertura)
		movement, err = qtx.CreateMovement(ctx, db.CreateMovementParams{
			ProtocolID:   proto.ID,
			Sequence:     1,
			ToSectorCode: int32(sectorCode),
			ToSectorName: sectorName,
			DispatchNote: "Protocolo criado",
			MovedByID:    userEmail,
			MovedByEmail: userEmail,
			MovedByName:  pgtype.Text{String: userName, Valid: userName != ""},
		})
		if err != nil {
			return fmt.Errorf("erro ao criar movimento inicial: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	_ = movement // Usado na transação

	// Activity log (fire-and-forget)
	s.activitySvc.Log(ActivityLogEntry{
		Action:         "internal_protocol_create",
		EntityType:     "internal_protocol",
		EntityID:       strconv.Itoa(int(proto.ID)),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     int(proto.ID),
		ProtocolNumber: proto.ProtocolNumber,
		ProtocolSource: "ged_interno",
	})

	return s.protocolToDetail(proto, 0, 0, 1), nil
}

// List retorna protocolos internos paginados com enriquecimento.
func (s *InternalProtocolService) List(ctx context.Context, q dto.ListInternalProtocolsQuery) (*dto.ListInternalProtocolsResponse, error) {
	q.Defaults()

	params := db.ListInternalProtocolsParams{
		Limit:  int32(q.PerPage),
		Offset: int32(q.Offset()),
	}
	if q.Setor != nil {
		params.SectorCode = pgtype.Int4{Int32: int32(*q.Setor), Valid: true}
	}
	if q.Status != "" {
		params.Status = pgtype.Text{String: q.Status, Valid: true}
	}
	if q.Search != "" {
		params.Search = pgtype.Text{String: q.Search, Valid: true}
	}
	if q.Projeto != "" {
		params.ProjectName = pgtype.Text{String: q.Projeto, Valid: true}
	}

	protocols, err := s.queries.ListInternalProtocols(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar protocolos internos: %w", err)
	}

	countParams := db.CountInternalProtocolsParams{
		SectorCode:  params.SectorCode,
		Status:      params.Status,
		Search:      params.Search,
		ProjectName: params.ProjectName,
	}
	total, err := s.queries.CountInternalProtocols(ctx, countParams)
	if err != nil {
		total = int64(len(protocols))
	}

	// Enriquecer com doc_count e obs_count
	protoNumbers := make([]string, len(protocols))
	for i, p := range protocols {
		protoNumbers[i] = p.ProtocolNumber
	}

	docCounts, obsCounts := s.enrichCounts(ctx, protoNumbers)

	items := make([]dto.InternalProtocolItem, len(protocols))
	for i, p := range protocols {
		var createdAt *time.Time
		if p.CreatedAt.Valid {
			createdAt = &p.CreatedAt.Time
		}

		items[i] = dto.InternalProtocolItem{
			ID:                p.ID,
			ProtocolNumber:    p.ProtocolNumber,
			Subject:           p.Subject,
			Interested:        p.Interested,
			Sender:            p.Sender,
			ProjectName:       p.ProjectName,
			Observations:      p.Observations,
			CurrentSectorName: p.CurrentSectorName,
			CurrentSectorCode: p.CurrentSectorCode,
			Status:            p.Status,
			CreatedByName:     p.CreatedByName.String,
			CreatedByEmail:    p.CreatedByEmail,
			CreatedAt:         createdAt,
			DocCount:          docCounts[p.ProtocolNumber],
			ObsCount:          obsCounts[p.ProtocolNumber],
		}
	}

	return &dto.ListInternalProtocolsResponse{
		Data:       items,
		Total:      total,
		Page:       q.Page,
		PerPage:    q.PerPage,
		TotalPages: dto.CalcTotalPages(total, q.PerPage),
	}, nil
}

// GetByID retorna detalhes completos de um protocolo interno.
func (s *InternalProtocolService) GetByID(ctx context.Context, id int32) (*dto.InternalProtocolDetail, error) {
	proto, err := s.queries.GetInternalProtocolByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("protocolo interno não encontrado: %w", err)
	}

	docCount, _ := s.queries.CountDocumentosByProtocolo(ctx, proto.ProtocolNumber)
	obsCount, _ := s.queries.CountObservacoesByProtocolo(ctx, proto.ProtocolNumber)
	tramCount, _ := s.queries.CountMovementsByProtocolID(ctx, proto.ID)

	return s.protocolToDetail(proto, docCount, obsCount, tramCount), nil
}

// Update edita campos do protocolo interno.
func (s *InternalProtocolService) Update(ctx context.Context, id int32, req dto.UpdateInternalProtocolRequest, userEmail, userName string) (*dto.InternalProtocolDetail, error) {
	// Verificar que pelo menos 1 campo foi enviado
	if req.Subject == nil && req.Interested == nil && req.Sender == nil && req.ProjectName == nil && req.Observations == nil {
		return nil, fmt.Errorf("pelo menos um campo deve ser informado para atualização")
	}

	// Validar tamanhos
	if req.Subject != nil && len(*req.Subject) > 500 {
		return nil, fmt.Errorf("subject deve ter no máximo 500 caracteres")
	}
	if req.Interested != nil && len(*req.Interested) > 200 {
		return nil, fmt.Errorf("interested deve ter no máximo 200 caracteres")
	}
	if req.Sender != nil && len(*req.Sender) > 200 {
		return nil, fmt.Errorf("sender deve ter no máximo 200 caracteres")
	}
	if req.ProjectName != nil && len(*req.ProjectName) > 300 {
		return nil, fmt.Errorf("project_name deve ter no máximo 300 caracteres")
	}
	if req.Observations != nil && len(*req.Observations) > 5000 {
		return nil, fmt.Errorf("observations deve ter no máximo 5000 caracteres")
	}

	params := db.UpdateInternalProtocolParams{ID: id}
	if req.Subject != nil {
		params.Subject = pgtype.Text{String: *req.Subject, Valid: true}
	}
	if req.Interested != nil {
		params.Interested = pgtype.Text{String: *req.Interested, Valid: true}
	}
	if req.Sender != nil {
		params.Sender = pgtype.Text{String: *req.Sender, Valid: true}
	}
	if req.ProjectName != nil {
		params.ProjectName = pgtype.Text{String: *req.ProjectName, Valid: true}
	}
	if req.Observations != nil {
		params.Observations = pgtype.Text{String: *req.Observations, Valid: true}
	}

	proto, err := s.queries.UpdateInternalProtocol(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar protocolo: %w", err)
	}

	s.activitySvc.Log(ActivityLogEntry{
		Action:         "internal_protocol_edit",
		EntityType:     "internal_protocol",
		EntityID:       strconv.Itoa(int(proto.ID)),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     int(proto.ID),
		ProtocolNumber: proto.ProtocolNumber,
		ProtocolSource: "ged_interno",
	})

	docCount, _ := s.queries.CountDocumentosByProtocolo(ctx, proto.ProtocolNumber)
	obsCount, _ := s.queries.CountObservacoesByProtocolo(ctx, proto.ProtocolNumber)
	tramCount, _ := s.queries.CountMovementsByProtocolID(ctx, proto.ID)

	return s.protocolToDetail(proto, docCount, obsCount, tramCount), nil
}

// ChangeStatus altera o status do protocolo com validação de transição.
func (s *InternalProtocolService) ChangeStatus(ctx context.Context, id int32, req dto.ChangeStatusRequest, userEmail, userName, userRole, userSetor string) (*dto.InternalProtocolDetail, error) {
	proto, err := s.queries.GetInternalProtocolByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("protocolo não encontrado: %w", err)
	}

	// Validar transição
	allowed, ok := validTransitions[proto.Status]
	if !ok {
		return nil, fmt.Errorf("status atual '%s' não permite transições", proto.Status)
	}

	validTarget := false
	for _, s := range allowed {
		if s == req.Status {
			validTarget = true
			break
		}
	}
	if !validTarget {
		return nil, fmt.Errorf("transição de '%s' para '%s' não permitida", proto.Status, req.Status)
	}

	// Verificar permissão
	isAdmin := userRole == "SUPER_ADMIN" || userRole == "ADMIN"

	switch req.Status {
	case "em_analise", "finalizado":
		// Operador+ do setor atual
		if !isAdmin {
			userSectorCode, _ := strconv.Atoi(userSetor)
			if int32(userSectorCode) != proto.CurrentSectorCode {
				return nil, fmt.Errorf("apenas usuários do setor atual podem realizar esta operação")
			}
		}
	case "arquivado", "cancelado":
		if !isAdmin {
			return nil, fmt.Errorf("apenas administradores podem realizar esta operação")
		}
	}

	// Cancelamento requer justificativa
	if req.Status == "cancelado" {
		if len(req.CancelReason) < 10 {
			return nil, fmt.Errorf("motivo do cancelamento é obrigatório (mínimo 10 caracteres)")
		}
	}

	updated, err := s.queries.UpdateInternalProtocolStatus(ctx, db.UpdateInternalProtocolStatusParams{
		ID:           id,
		Status:       req.Status,
		CancelReason: pgtype.Text{String: req.CancelReason, Valid: req.CancelReason != ""},
	})
	if err != nil {
		return nil, fmt.Errorf("erro ao atualizar status: %w", err)
	}

	s.activitySvc.Log(ActivityLogEntry{
		Action:         "internal_protocol_status_change",
		EntityType:     "internal_protocol",
		EntityID:       strconv.Itoa(int(updated.ID)),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     int(updated.ID),
		ProtocolNumber: updated.ProtocolNumber,
		ProtocolSource: "ged_interno",
		Details: map[string]interface{}{
			"from_status":   proto.Status,
			"to_status":     req.Status,
			"cancel_reason": req.CancelReason,
		},
	})

	docCount, _ := s.queries.CountDocumentosByProtocolo(ctx, updated.ProtocolNumber)
	obsCount, _ := s.queries.CountObservacoesByProtocolo(ctx, updated.ProtocolNumber)
	tramCount, _ := s.queries.CountMovementsByProtocolID(ctx, updated.ID)

	return s.protocolToDetail(updated, docCount, obsCount, tramCount), nil
}

// Dispatch tramita o protocolo para outro setor.
func (s *InternalProtocolService) Dispatch(ctx context.Context, id int32, req dto.DispatchRequest, userEmail, userName, userRole, userSetor string) (*dto.MovementItem, error) {
	proto, err := s.queries.GetInternalProtocolByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("protocolo não encontrado: %w", err)
	}

	// Verificar que protocolo não está em status terminal
	if proto.Status == "arquivado" || proto.Status == "cancelado" {
		return nil, fmt.Errorf("não é possível tramitar protocolo com status '%s'", proto.Status)
	}

	// Verificar setor do usuário
	isAdmin := userRole == "SUPER_ADMIN" || userRole == "ADMIN"
	if !isAdmin {
		userSectorCode, _ := strconv.Atoi(userSetor)
		if int32(userSectorCode) != proto.CurrentSectorCode {
			return nil, fmt.Errorf("apenas usuários do setor atual ou administradores podem tramitar")
		}
	}

	// Verificar que destino != origem
	if int32(req.ToSectorCode) == proto.CurrentSectorCode {
		return nil, fmt.Errorf("setor de destino deve ser diferente do setor atual")
	}

	// Buscar nome do setor de destino no cache SAGI
	destSetor, err := s.setorRepo.GetSetorByCode(ctx, req.ToSectorCode)
	if err != nil {
		return nil, fmt.Errorf("setor de destino inválido: %w", err)
	}

	var movement db.InternalProtocolMovement

	err = pgx.BeginTxFunc(ctx, s.pool, pgx.TxOptions{}, func(tx pgx.Tx) error {
		qtx := s.queries.WithTx(tx)

		// Limpar flag is_current dos movimentos anteriores
		if err := qtx.ClearCurrentFlag(ctx, proto.ID); err != nil {
			return fmt.Errorf("erro ao limpar flag atual: %w", err)
		}

		// Obter próxima sequência
		nextSeq, err := qtx.GetNextMovementSequence(ctx, proto.ID)
		if err != nil {
			return fmt.Errorf("erro ao obter próxima sequência: %w", err)
		}

		// Criar movimento
		movement, err = qtx.CreateMovement(ctx, db.CreateMovementParams{
			ProtocolID:     proto.ID,
			Sequence:       nextSeq,
			FromSectorCode: pgtype.Int4{Int32: proto.CurrentSectorCode, Valid: true},
			FromSectorName: pgtype.Text{String: proto.CurrentSectorName, Valid: true},
			ToSectorCode:   int32(req.ToSectorCode),
			ToSectorName:   destSetor.Descricao,
			DispatchNote:   req.DispatchNote,
			MovedByID:      userEmail,
			MovedByEmail:   userEmail,
			MovedByName:    pgtype.Text{String: userName, Valid: userName != ""},
		})
		if err != nil {
			return fmt.Errorf("erro ao criar movimento: %w", err)
		}

		// Atualizar setor atual do protocolo
		if err := qtx.UpdateInternalProtocolSector(ctx, db.UpdateInternalProtocolSectorParams{
			ID:                proto.ID,
			CurrentSectorCode: int32(req.ToSectorCode),
			CurrentSectorName: destSetor.Descricao,
		}); err != nil {
			return fmt.Errorf("erro ao atualizar setor do protocolo: %w", err)
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	s.activitySvc.Log(ActivityLogEntry{
		Action:         "internal_protocol_dispatch",
		EntityType:     "internal_protocol",
		EntityID:       strconv.Itoa(int(proto.ID)),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     int(proto.ID),
		ProtocolNumber: proto.ProtocolNumber,
		ProtocolSource: "ged_interno",
		Details: map[string]interface{}{
			"from_sector": proto.CurrentSectorName,
			"to_sector":   destSetor.Descricao,
		},
	})

	var movedAt *time.Time
	if movement.MovedAt.Valid {
		movedAt = &movement.MovedAt.Time
	}

	return &dto.MovementItem{
		ID:             movement.ID,
		Sequence:       movement.Sequence,
		FromSectorName: movement.FromSectorName.String,
		ToSectorName:   movement.ToSectorName,
		DispatchNote:   movement.DispatchNote,
		MovedByName:    movement.MovedByName.String,
		MovedByEmail:   movement.MovedByEmail,
		MovedAt:        movedAt,
		IsCurrent:      movement.IsCurrent.Valid && movement.IsCurrent.Bool,
		Permanencia:    0,
	}, nil
}

// History retorna o histórico de tramitação com cálculo de permanência.
func (s *InternalProtocolService) History(ctx context.Context, protocolID int32) (*dto.MovementHistoryResponse, error) {
	movements, err := s.queries.ListMovementsByProtocol(ctx, protocolID)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar movimentações: %w", err)
	}

	now := time.Now()
	items := make([]dto.MovementItem, len(movements))
	setorDias := make(map[string]int)
	setoresUnicos := make(map[string]bool)
	var primeiraData, ultimaData *time.Time

	for i, m := range movements {
		permanencia := 0
		var movedAt *time.Time
		if m.MovedAt.Valid {
			movedAt = &m.MovedAt.Time

			isCurrent := m.IsCurrent.Valid && m.IsCurrent.Bool
			if isCurrent {
				permanencia = movementDaysBetween(*movedAt, now)
			} else if i > 0 && movements[i-1].MovedAt.Valid {
				permanencia = movementDaysBetween(*movedAt, movements[i-1].MovedAt.Time)
			}

			if primeiraData == nil || movedAt.Before(*primeiraData) {
				primeiraData = movedAt
			}
			if ultimaData == nil || movedAt.After(*ultimaData) {
				ultimaData = movedAt
			}
		}

		if m.ToSectorName != "" {
			setoresUnicos[m.ToSectorName] = true
			setorDias[m.ToSectorName] += permanencia
		}

		items[i] = dto.MovementItem{
			ID:             m.ID,
			Sequence:       m.Sequence,
			FromSectorName: m.FromSectorName.String,
			ToSectorName:   m.ToSectorName,
			DispatchNote:   m.DispatchNote,
			MovedByName:    m.MovedByName.String,
			MovedByEmail:   m.MovedByEmail,
			MovedAt:        movedAt,
			IsCurrent:      m.IsCurrent.Valid && m.IsCurrent.Bool,
			Permanencia:    permanencia,
		}
	}

	resumo := dto.MovementResumo{
		TotalSetores: len(setoresUnicos),
	}
	if primeiraData != nil {
		resumo.TempoTotalDias = movementDaysBetween(*primeiraData, now)
	}

	maxDias := 0
	for setor, dias := range setorDias {
		if dias > maxDias {
			maxDias = dias
			resumo.SetorMaisLongo = setor
			resumo.DiasSetorMaisLongo = dias
		}
	}

	return &dto.MovementHistoryResponse{
		Data:   items,
		Total:  len(items),
		Resumo: resumo,
	}, nil
}

// SoftDelete faz soft delete de um protocolo interno.
func (s *InternalProtocolService) SoftDelete(ctx context.Context, id int32, reason, userEmail, userName string) error {
	_, err := s.queries.SoftDeleteInternalProtocol(ctx, db.SoftDeleteInternalProtocolParams{
		ID:             id,
		DeletedByEmail: pgtype.Text{String: userEmail, Valid: true},
		DeleteReason:   pgtype.Text{String: reason, Valid: true},
	})
	if err != nil {
		return fmt.Errorf("erro ao excluir protocolo: %w", err)
	}

	s.activitySvc.Log(ActivityLogEntry{
		Action:         "internal_protocol_delete",
		EntityType:     "internal_protocol",
		EntityID:       strconv.Itoa(int(id)),
		UserEmail:      userEmail,
		UserName:       userName,
		ProtocolID:     int(id),
		ProtocolSource: "ged_interno",
		Details: map[string]interface{}{
			"reason": reason,
		},
	})

	return nil
}

// ListSetores retorna todos os setores do SAGI.
func (s *InternalProtocolService) ListSetores(ctx context.Context) ([]dto.SetorItem, error) {
	setores, err := s.setorRepo.ListSetores(ctx)
	if err != nil {
		return nil, err
	}

	items := make([]dto.SetorItem, len(setores))
	for i, s := range setores {
		items[i] = dto.SetorItem{
			Codigo:    s.Codigo,
			Descricao: s.Descricao,
		}
	}
	return items, nil
}

// TrackRecentView registra que o usuário visualizou um protocolo interno.
func (s *InternalProtocolService) TrackRecentView(ctx context.Context, email string, protocolID int32) {
	go func() {
		bgCtx := context.Background()
		err := s.queries.UpsertRecentProtocol(bgCtx, db.UpsertRecentProtocolParams{
			UserEmail:    email,
			ProtocolID:   strconv.Itoa(int(protocolID)),
			ProtocolType: "ged_interno",
		})
		if err != nil {
			log.Error().Err(err).Int32("protocol_id", protocolID).Msg("erro ao registrar acesso recente interno")
		}
	}()
}

// --- Helpers ---

func (s *InternalProtocolService) protocolToDetail(p db.InternalProtocol, docCount, obsCount, tramCount int64) *dto.InternalProtocolDetail {
	var createdAt, updatedAt *time.Time
	if p.CreatedAt.Valid {
		createdAt = &p.CreatedAt.Time
	}
	if p.UpdatedAt.Valid {
		updatedAt = &p.UpdatedAt.Time
	}

	return &dto.InternalProtocolDetail{
		ID:                p.ID,
		ProtocolNumber:    p.ProtocolNumber,
		Subject:           p.Subject,
		Interested:        p.Interested,
		Sender:            p.Sender,
		ProjectName:       p.ProjectName,
		Observations:      p.Observations,
		CurrentSectorName: p.CurrentSectorName,
		CurrentSectorCode: p.CurrentSectorCode,
		Status:            p.Status,
		CancelReason:      p.CancelReason.String,
		CreatedByName:     p.CreatedByName.String,
		CreatedByEmail:    p.CreatedByEmail,
		CreatedAt:         createdAt,
		UpdatedAt:         updatedAt,
		DocCount:          docCount,
		ObsCount:          obsCount,
		TramitacaoCount:   tramCount,
	}
}

func (s *InternalProtocolService) enrichCounts(ctx context.Context, protoNumbers []string) (docCounts map[string]int64, obsCounts map[string]int64) {
	docCounts = make(map[string]int64)
	obsCounts = make(map[string]int64)

	if len(protoNumbers) == 0 {
		return
	}

	docs, err := s.queries.CountDocsByInternalProtocolIDs(ctx, protoNumbers)
	if err != nil {
		log.Error().Err(err).Msg("erro ao enriquecer doc_count internos")
	} else {
		for _, d := range docs {
			docCounts[d.ProtocoloSagi] = d.DocCount
		}
	}

	obs, err := s.queries.CountObsByInternalProtocolIDs(ctx, protoNumbers)
	if err != nil {
		log.Error().Err(err).Msg("erro ao enriquecer obs_count internos")
	} else {
		for _, o := range obs {
			obsCounts[o.ProtocoloSagi] = o.ObsCount
		}
	}

	return
}

func movementDaysBetween(start, end time.Time) int {
	diff := end.Sub(start)
	days := diff.Hours() / 24
	return int(math.Ceil(days))
}
