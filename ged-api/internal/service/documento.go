package service

import (
	"context"
	"crypto/sha256"
	"fmt"
	"io"
	"mime/multipart"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

var allowedMIME = map[string]bool{
	"application/pdf":          true,
	"application/msword":       true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	"application/vnd.ms-excel": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":      true,
	"application/vnd.ms-powerpoint":                                          true,
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": true,
	"image/jpeg":  true,
	"image/png":   true,
	"image/gif":   true,
	"image/webp":  true,
	"text/plain":  true,
}

// DocumentoService gerencia operações com documentos anexados.
type DocumentoService struct {
	queries     *db.Queries
	driveSvc    *DriveService
	sagiRepo    *repository.SAGIProtocoloRepository
	maxFileSize int64 // em bytes
}

// NewDocumentoService cria uma instância do DocumentoService.
func NewDocumentoService(queries *db.Queries, driveSvc *DriveService, sagiRepo *repository.SAGIProtocoloRepository, maxFileSizeMB int) *DocumentoService {
	return &DocumentoService{
		queries:     queries,
		driveSvc:    driveSvc,
		sagiRepo:    sagiRepo,
		maxFileSize: int64(maxFileSizeMB) * 1024 * 1024,
	}
}

// Upload faz upload de um arquivo no Google Drive e registra no PostgreSQL.
func (s *DocumentoService) Upload(
	ctx context.Context,
	protocoloSagi string,
	file multipart.File,
	header *multipart.FileHeader,
	tipoDocID string,
	descricao string,
	email string,
	nome string,
) (*dto.DocumentoItem, error) {
	// Validar tamanho
	if header.Size > s.maxFileSize {
		return nil, fmt.Errorf("arquivo excede o tamanho máximo de %d MB", s.maxFileSize/(1024*1024))
	}

	// Validar MIME type
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}
	// Normalizar: pegar só o tipo base (sem charset etc.)
	if idx := strings.Index(mimeType, ";"); idx != -1 {
		mimeType = strings.TrimSpace(mimeType[:idx])
	}
	if !allowedMIME[mimeType] {
		return nil, fmt.Errorf("tipo de arquivo não permitido: %s", mimeType)
	}

	if s.driveSvc == nil {
		return nil, fmt.Errorf("serviço de armazenamento (Google Drive) não configurado")
	}

	// Calcular SHA256 enquanto faz upload (TeeReader)
	hasher := sha256.New()
	teeReader := io.TeeReader(file, hasher)

	fileName := sanitizeFileName(header.Filename)

	// Upload para Drive
	fileID, webURL, folderID, err := s.driveSvc.Upload(ctx, protocoloSagi, fileName, mimeType, teeReader)
	if err != nil {
		return nil, fmt.Errorf("erro no upload: %w", err)
	}

	hashStr := fmt.Sprintf("%x", hasher.Sum(nil))

	// Preparar tipo_documento_id
	var tipoDocUUID pgtype.UUID
	if tipoDocID != "" {
		parsed, err := uuid.Parse(tipoDocID)
		if err != nil {
			// Compensar: deletar do Drive
			if delErr := s.driveSvc.Delete(ctx, fileID); delErr != nil {
				log.Error().Err(delErr).Str("fileID", fileID).Msg("falha ao compensar upload no Drive")
			}
			return nil, fmt.Errorf("tipo_documento_id inválido: %w", err)
		}
		tipoDocUUID = pgtype.UUID{Bytes: parsed, Valid: true}
	}

	// INSERT no PostgreSQL
	doc, err := s.queries.CreateDocumento(ctx, db.CreateDocumentoParams{
		ProtocoloSagi:   protocoloSagi,
		TipoDocumentoID: tipoDocUUID,
		NomeArquivo:     fileName,
		DriveFileID:     pgtype.Text{String: fileID, Valid: true},
		DriveFileUrl:    pgtype.Text{String: webURL, Valid: true},
		TamanhoBytes:    pgtype.Int8{Int64: header.Size, Valid: true},
		MimeType:        pgtype.Text{String: mimeType, Valid: true},
		HashSha256:      pgtype.Text{String: hashStr, Valid: true},
		UploadedBy:      email,
		Descricao:       pgtype.Text{String: descricao, Valid: descricao != ""},
		UploadedByName:  pgtype.Text{String: nome, Valid: nome != ""},
		GoogleDriveFolderID: pgtype.Text{String: folderID, Valid: true},
	})
	if err != nil {
		// Compensar: deletar do Drive se INSERT falhar
		if delErr := s.driveSvc.Delete(ctx, fileID); delErr != nil {
			log.Error().Err(delErr).Str("fileID", fileID).Msg("falha ao compensar upload no Drive após erro no PostgreSQL")
		}
		return nil, fmt.Errorf("erro ao salvar documento no banco: %w", err)
	}

	item := documentoToItem(doc, "", email, false)
	return &item, nil
}

// ListByProtocolo lista documentos de um protocolo com tipo.
func (s *DocumentoService) ListByProtocolo(ctx context.Context, protocoloSagi, userEmail string, isAdmin bool) (*dto.ListDocumentosResponse, error) {
	docs, err := s.queries.ListDocumentosByProtocoloWithType(ctx, protocoloSagi)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar documentos: %w", err)
	}

	total, err := s.queries.CountDocumentosByProtocolo(ctx, protocoloSagi)
	if err != nil {
		total = int64(len(docs))
	}

	items := make([]dto.DocumentoItem, len(docs))
	for i, d := range docs {
		items[i] = documentoWithTypeToItem(d, userEmail, isAdmin)
	}

	return &dto.ListDocumentosResponse{
		Data:  items,
		Total: total,
	}, nil
}

// Download baixa um documento do Google Drive.
func (s *DocumentoService) Download(ctx context.Context, docID uuid.UUID) (io.ReadCloser, string, string, int64, error) {
	doc, err := s.queries.GetDocumentoByID(ctx, docID)
	if err != nil {
		return nil, "", "", 0, fmt.Errorf("documento não encontrado: %w", err)
	}

	if !doc.DriveFileID.Valid || doc.DriveFileID.String == "" {
		return nil, "", "", 0, fmt.Errorf("documento sem arquivo no Drive")
	}

	if s.driveSvc == nil {
		return nil, "", "", 0, fmt.Errorf("serviço de armazenamento indisponível")
	}

	reader, _, size, err := s.driveSvc.Download(ctx, doc.DriveFileID.String)
	if err != nil {
		return nil, "", "", 0, fmt.Errorf("erro ao baixar do Drive: %w", err)
	}

	mimeType := ""
	if doc.MimeType.Valid {
		mimeType = doc.MimeType.String
	}

	return reader, doc.NomeArquivo, mimeType, size, nil
}

// Update atualiza metadados de um documento (descrição e/ou tipo).
func (s *DocumentoService) Update(ctx context.Context, docID uuid.UUID, req dto.UpdateDocumentoRequest, email string, isAdmin bool) (*dto.DocumentoItem, error) {
	// Verificar existência e permissão
	doc, err := s.queries.GetDocumentoByID(ctx, docID)
	if err != nil {
		return nil, fmt.Errorf("documento não encontrado: %w", err)
	}

	if doc.UploadedBy != email && !isAdmin {
		return nil, fmt.Errorf("sem permissão para editar este documento")
	}

	params := db.UpdateDocumentoMetadataParams{
		ID: docID,
	}

	if req.Descricao != nil {
		params.Descricao = pgtype.Text{String: *req.Descricao, Valid: true}
	}
	if req.TipoDocumentoID != nil {
		parsed, err := uuid.Parse(*req.TipoDocumentoID)
		if err != nil {
			return nil, fmt.Errorf("tipo_documento_id inválido: %w", err)
		}
		params.TipoDocumentoID = pgtype.UUID{Bytes: parsed, Valid: true}
	}

	if err := s.queries.UpdateDocumentoMetadata(ctx, params); err != nil {
		return nil, fmt.Errorf("erro ao atualizar documento: %w", err)
	}

	// Recarregar com tipo
	updated, err := s.queries.GetDocumentoByIDWithType(ctx, docID)
	if err != nil {
		return nil, fmt.Errorf("erro ao recarregar documento: %w", err)
	}

	item := documentoWithTypeToItem(db.ListDocumentosByProtocoloWithTypeRow(updated), email, isAdmin)
	return &item, nil
}

// SoftDelete faz soft delete de um documento.
func (s *DocumentoService) SoftDelete(ctx context.Context, docID uuid.UUID, motivo, email string, isAdmin bool) error {
	doc, err := s.queries.GetDocumentoByID(ctx, docID)
	if err != nil {
		return fmt.Errorf("documento não encontrado: %w", err)
	}

	if doc.UploadedBy != email && !isAdmin {
		return fmt.Errorf("sem permissão para excluir este documento")
	}

	return s.queries.SoftDeleteDocumento(ctx, db.SoftDeleteDocumentoParams{
		ID:             docID,
		DeletedBy:      pgtype.Text{String: email, Valid: true},
		MotivoExclusao: pgtype.Text{String: motivo, Valid: true},
	})
}

// ResolveProtocoloSagi resolve o número do protocolo (string) a partir de source + id.
func (s *DocumentoService) ResolveProtocoloSagi(ctx context.Context, source, id string) (string, error) {
	switch source {
	case "sagi":
		idInt, err := parseIntID(id)
		if err != nil {
			return "", err
		}
		if s.sagiRepo == nil {
			return "", fmt.Errorf("SAGI indisponível")
		}
		proto, err := s.sagiRepo.GetProtocoloByID(ctx, idInt)
		if err != nil {
			return "", err
		}
		return proto.NumeroProtocolo, nil

	case "interno":
		idInt, err := parseIntID(id)
		if err != nil {
			return "", fmt.Errorf("ID de protocolo interno inválido: %w", err)
		}
		proto, err := s.queries.GetInternalProtocolByID(ctx, int32(idInt))
		if err != nil {
			return "", fmt.Errorf("protocolo interno não encontrado: %w", err)
		}
		return proto.ProtocolNumber, nil

	default:
		return "", fmt.Errorf("source inválido: %s", source)
	}
}

// parseIntID converte string para int (helper).
func parseIntID(s string) (int, error) {
	var id int
	_, err := fmt.Sscanf(s, "%d", &id)
	if err != nil {
		return 0, fmt.Errorf("ID inválido: %s", s)
	}
	return id, nil
}

// documentoToItem converte um db.Documento para dto.DocumentoItem.
func documentoToItem(d db.Documento, tipoNome, userEmail string, isAdmin bool) dto.DocumentoItem {
	var uploadedAt *time.Time
	if d.UploadedAt.Valid {
		uploadedAt = &d.UploadedAt.Time
	}

	var tipoDocID *string
	if d.TipoDocumentoID.Valid {
		s := uuid.UUID(d.TipoDocumentoID.Bytes).String()
		tipoDocID = &s
	}

	canModify := d.UploadedBy == userEmail || isAdmin

	return dto.DocumentoItem{
		ID:                d.ID.String(),
		ProtocoloSagi:     d.ProtocoloSagi,
		TipoDocumentoID:   tipoDocID,
		TipoDocumentoNome: tipoNome,
		NomeArquivo:       d.NomeArquivo,
		Descricao:         d.Descricao.String,
		DriveFileURL:      d.DriveFileUrl.String,
		TamanhoBytes:      d.TamanhoBytes.Int64,
		MimeType:          d.MimeType.String,
		UploadedBy:        d.UploadedBy,
		UploadedByName:    d.UploadedByName.String,
		UploadedAt:        uploadedAt,
		CanEdit:           canModify,
		CanDelete:         canModify,
	}
}

// documentoWithTypeToItem converte um row com JOIN para dto.DocumentoItem.
func documentoWithTypeToItem(d db.ListDocumentosByProtocoloWithTypeRow, userEmail string, isAdmin bool) dto.DocumentoItem {
	var uploadedAt *time.Time
	if d.UploadedAt.Valid {
		uploadedAt = &d.UploadedAt.Time
	}

	var tipoDocID *string
	if d.TipoDocumentoID.Valid {
		s := uuid.UUID(d.TipoDocumentoID.Bytes).String()
		tipoDocID = &s
	}

	canModify := d.UploadedBy == userEmail || isAdmin

	return dto.DocumentoItem{
		ID:                d.ID.String(),
		ProtocoloSagi:     d.ProtocoloSagi,
		TipoDocumentoID:   tipoDocID,
		TipoDocumentoNome: d.TipoDocumentoNome,
		NomeArquivo:       d.NomeArquivo,
		Descricao:         d.Descricao.String,
		DriveFileURL:      d.DriveFileUrl.String,
		TamanhoBytes:      d.TamanhoBytes.Int64,
		MimeType:          d.MimeType.String,
		UploadedBy:        d.UploadedBy,
		UploadedByName:    d.UploadedByName.String,
		UploadedAt:        uploadedAt,
		CanEdit:           canModify,
		CanDelete:         canModify,
	}
}
