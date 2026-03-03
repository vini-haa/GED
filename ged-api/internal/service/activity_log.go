package service

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
)

// ActivityLogEntry contém os dados para registrar um log de atividade.
type ActivityLogEntry struct {
	Action         string
	EntityType     string
	EntityID       string
	UserEmail      string
	UserName       string
	IPAddress      string
	UserAgent      string
	ProtocolID     int
	ProtocolNumber string
	ProtocolSource string
	Details        map[string]interface{}
}

// ActivityLogService registra logs de atividade de forma assíncrona.
type ActivityLogService struct {
	queries *db.Queries
}

// NewActivityLogService cria uma instância do ActivityLogService.
func NewActivityLogService(queries *db.Queries) *ActivityLogService {
	return &ActivityLogService{queries: queries}
}

// Log registra uma atividade de forma fire-and-forget (goroutine).
func (s *ActivityLogService) Log(entry ActivityLogEntry) {
	go func() {
		ctx := context.Background()

		var detailsJSON json.RawMessage
		if entry.Details != nil {
			if b, err := json.Marshal(entry.Details); err == nil {
				detailsJSON = b
			}
		}

		err := s.queries.CreateActivityLog(ctx, db.CreateActivityLogParams{
			Acao:           entry.Action,
			Entidade:       entry.EntityType,
			EntidadeID:     pgtype.Text{String: entry.EntityID, Valid: entry.EntityID != ""},
			Detalhes:       detailsJSON,
			UsuarioEmail:   entry.UserEmail,
			UsuarioNome:    entry.UserName,
			IpAddress:      pgtype.Text{String: entry.IPAddress, Valid: entry.IPAddress != ""},
			UserAgent:      pgtype.Text{String: entry.UserAgent, Valid: entry.UserAgent != ""},
			ProtocolID:     pgtype.Int4{Int32: int32(entry.ProtocolID), Valid: entry.ProtocolID != 0},
			ProtocolNumber: pgtype.Text{String: entry.ProtocolNumber, Valid: entry.ProtocolNumber != ""},
			ProtocolSource: pgtype.Text{String: entry.ProtocolSource, Valid: entry.ProtocolSource != ""},
		})
		if err != nil {
			log.Error().Err(err).Str("action", entry.Action).Str("entity", entry.EntityType).Msg("erro ao registrar activity log")
		}
	}()
}
