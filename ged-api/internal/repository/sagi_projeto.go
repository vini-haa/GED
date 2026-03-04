package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
)

// Projeto representa um projeto/convênio do SAGI.
type Projeto struct {
	NumConv    int    `json:"numconv"`
	Titulo     string `json:"titulo"`
	NumOficial string `json:"num_oficial"`
}

// SAGIProjetoRepository acessa projetos do SAGI (SQL Server) com cache.
type SAGIProjetoRepository struct {
	db *sql.DB

	mu       sync.RWMutex
	cache    []Projeto
	cacheAt  time.Time
	cacheTTL time.Duration
}

// NewSAGIProjetoRepository cria uma instância do repository.
func NewSAGIProjetoRepository(db *sql.DB) *SAGIProjetoRepository {
	return &SAGIProjetoRepository{
		db:       db,
		cacheTTL: 1 * time.Hour,
	}
}

// SearchProjetos busca projetos pelo título, usando cache.
func (r *SAGIProjetoRepository) SearchProjetos(ctx context.Context, search string) ([]Projeto, error) {
	all, err := r.getAllProjetos(ctx)
	if err != nil {
		return nil, err
	}

	if search == "" {
		return all, nil
	}

	searchLower := strings.ToLower(search)
	var result []Projeto
	for _, p := range all {
		if strings.Contains(strings.ToLower(p.Titulo), searchLower) ||
			strings.Contains(strings.ToLower(p.NumOficial), searchLower) {
			result = append(result, p)
		}
	}
	return result, nil
}

func (r *SAGIProjetoRepository) getAllProjetos(ctx context.Context) ([]Projeto, error) {
	r.mu.RLock()
	if r.cache != nil && time.Since(r.cacheAt) < r.cacheTTL {
		result := r.cache
		r.mu.RUnlock()
		return result, nil
	}
	r.mu.RUnlock()

	return r.refreshCache(ctx)
}

func (r *SAGIProjetoRepository) refreshCache(ctx context.Context) ([]Projeto, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT
    c.NUMCONV,
    ISNULL(c.Titulo, '') COLLATE Latin1_General_CI_AI AS titulo,
    ISNULL(c.numOficial, '') COLLATE Latin1_General_CI_AI AS num_oficial
FROM CONVENIO c
WHERE c.Titulo IS NOT NULL
  AND c.Titulo <> ''
  AND c.Deletado IS NULL
ORDER BY c.Titulo`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar projetos do SAGI: %w", err)
	}
	defer rows.Close()

	var projetos []Projeto
	for rows.Next() {
		var p Projeto
		if err := rows.Scan(&p.NumConv, &p.Titulo, &p.NumOficial); err != nil {
			log.Warn().Err(err).Msg("erro ao scanear projeto SAGI")
			continue
		}
		projetos = append(projetos, p)
	}

	r.mu.Lock()
	r.cache = projetos
	r.cacheAt = time.Now()
	r.mu.Unlock()

	log.Info().Int("total", len(projetos)).Msg("cache de projetos SAGI atualizado")
	return projetos, nil
}
