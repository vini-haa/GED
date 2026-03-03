package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

type SearchService struct {
	sagiRepo *repository.SAGIProtocoloRepository
	queries  *db.Queries
}

func NewSearchService(sagiRepo *repository.SAGIProtocoloRepository, queries *db.Queries) *SearchService {
	return &SearchService{
		sagiRepo: sagiRepo,
		queries:  queries,
	}
}

// Search realiza busca global em protocolos SAGI e internos.
func (s *SearchService) Search(ctx context.Context, q dto.SearchQuery) (*dto.SearchResponse, error) {
	q.Defaults()

	var results []dto.SearchResultItem
	var totalSetor, totalTodos int64

	// Busca no SAGI
	if s.sagiRepo != nil {
		sagiResults, err := s.searchSAGI(ctx, q)
		if err != nil {
			log.Error().Err(err).Msg("erro na busca SAGI")
		} else {
			results = append(results, sagiResults...)
		}

		// Contar totais
		todosCount, err := s.sagiRepo.CountSearch(ctx, q.Q, nil)
		if err == nil {
			totalTodos = todosCount
		}

		if q.Setor != nil {
			setorCount, err := s.sagiRepo.CountSearch(ctx, q.Q, q.Setor)
			if err == nil {
				totalSetor = setorCount
			}
		}
	}

	// Busca nos protocolos internos
	internosResults, internosCount, err := s.searchInternos(ctx, q)
	if err != nil {
		log.Error().Err(err).Msg("erro na busca de protocolos internos")
	} else {
		results = append(results, internosResults...)
		totalTodos += internosCount
		totalSetor += internosCount // Internos sempre contam para o setor
	}

	// Limitar total de resultados
	if len(results) > q.Limit {
		results = results[:q.Limit]
	}

	return &dto.SearchResponse{
		Results:    results,
		TotalSetor: totalSetor,
		TotalTodos: totalTodos,
	}, nil
}

func (s *SearchService) searchSAGI(ctx context.Context, q dto.SearchQuery) ([]dto.SearchResultItem, error) {
	var setor *int
	if q.Scope == "setor" && q.Setor != nil {
		setor = q.Setor
	}

	protos, err := s.sagiRepo.SearchProtocolos(ctx, q.Q, setor, q.Limit)
	if err != nil {
		return nil, err
	}

	items := make([]dto.SearchResultItem, len(protos))
	for i, p := range protos {
		items[i] = dto.SearchResultItem{
			ID:              p.ID,
			NumeroProtocolo: p.NumeroProtocolo,
			Assunto:         p.Assunto,
			NomeProjeto:     p.NomeProjeto,
			NomeInteressado: p.NomeInteressado,
			Tipo:            "sagi",
			Highlight:       findHighlight(q.Q, p),
		}
	}
	return items, nil
}

func (s *SearchService) searchInternos(ctx context.Context, q dto.SearchQuery) ([]dto.SearchResultItem, int64, error) {
	internos, err := s.queries.SearchProtocolosInternos(ctx, db.SearchProtocolosInternosParams{
		Column1: pgtype.Text{String: q.Q, Valid: true},
		Limit:   int32(q.Limit),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("erro ao buscar protocolos internos: %w", err)
	}

	items := make([]dto.SearchResultItem, len(internos))
	for i, p := range internos {
		highlight := p.Numero
		if strings.Contains(strings.ToLower(p.Assunto), strings.ToLower(q.Q)) {
			highlight = p.Assunto
		}
		items[i] = dto.SearchResultItem{
			NumeroProtocolo: p.Numero,
			Assunto:         p.Assunto,
			NomeInteressado: p.CriadoPorNome,
			Tipo:            "interno",
			Highlight:       highlight,
		}
	}

	return items, int64(len(internos)), nil
}

// findHighlight retorna o campo que deu match na busca.
func findHighlight(query string, p repository.ProtocoloDocumento) string {
	q := strings.ToLower(query)

	if strings.Contains(strings.ToLower(p.NumeroProtocolo), q) {
		return p.NumeroProtocolo
	}
	if strings.Contains(strings.ToLower(p.Assunto), q) {
		return p.Assunto
	}
	if strings.Contains(strings.ToLower(p.NomeInteressado), q) {
		return p.NomeInteressado
	}
	if strings.Contains(strings.ToLower(p.NomeProjeto), q) {
		return p.NomeProjeto
	}

	return p.Assunto
}
