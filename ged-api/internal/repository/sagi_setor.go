package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"sync"
	"time"
)

// Setor representa um setor do SAGI.
type Setor struct {
	Codigo    int    `json:"codigo"`
	Descricao string `json:"descricao"`
}

// SAGISetorRepository acessa setores do SAGI (SQL Server) com cache em memória.
type SAGISetorRepository struct {
	db *sql.DB

	mu        sync.RWMutex
	cache     []Setor
	cacheMap  map[int]Setor
	cacheAt   time.Time
	cacheTTL  time.Duration
}

// NewSAGISetorRepository cria uma instância do repository.
func NewSAGISetorRepository(db *sql.DB) *SAGISetorRepository {
	return &SAGISetorRepository{
		db:       db,
		cacheMap: make(map[int]Setor),
		cacheTTL: 1 * time.Hour,
	}
}

// ListSetores retorna todos os setores ativos do SAGI, com cache de 1h.
func (r *SAGISetorRepository) ListSetores(ctx context.Context) ([]Setor, error) {
	r.mu.RLock()
	if r.cache != nil && time.Since(r.cacheAt) < r.cacheTTL {
		result := r.cache
		r.mu.RUnlock()
		return result, nil
	}
	r.mu.RUnlock()

	return r.refreshCache(ctx)
}

// GetSetorByCode retorna um setor pelo código, usando o cache.
func (r *SAGISetorRepository) GetSetorByCode(ctx context.Context, code int) (Setor, error) {
	r.mu.RLock()
	if r.cacheMap != nil && time.Since(r.cacheAt) < r.cacheTTL {
		if s, ok := r.cacheMap[code]; ok {
			r.mu.RUnlock()
			return s, nil
		}
		r.mu.RUnlock()
		return Setor{}, fmt.Errorf("setor %d não encontrado", code)
	}
	r.mu.RUnlock()

	// Cache expirado, recarregar
	if _, err := r.refreshCache(ctx); err != nil {
		return Setor{}, err
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	if s, ok := r.cacheMap[code]; ok {
		return s, nil
	}
	return Setor{}, fmt.Errorf("setor %d não encontrado", code)
}

// GetSetorByCodeDirect busca um setor diretamente no SAGI (sem filtro de ativos).
// Usado como fallback quando GetSetorByCode não encontra no cache de setores ativos.
func (r *SAGISetorRepository) GetSetorByCodeDirect(ctx context.Context, code int) (Setor, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT CODIGO, DESCR COLLATE Latin1_General_CI_AI AS descricao
FROM SETOR
WHERE CODIGO = @pCodigo`

	var s Setor
	err := r.db.QueryRowContext(ctx, query, sql.Named("pCodigo", code)).Scan(&s.Codigo, &s.Descricao)
	if err != nil {
		if err == sql.ErrNoRows {
			return Setor{}, fmt.Errorf("setor %d não encontrado", code)
		}
		return Setor{}, fmt.Errorf("erro ao buscar setor %d: %w", code, err)
	}
	s.Descricao = strings.TrimPrefix(s.Descricao, "- ")
	return s, nil
}

// GetUserSectorCode busca o código do setor do usuário no SAGI pelo email.
func (r *SAGISetorRepository) GetUserSectorCode(ctx context.Context, email string) (int, string, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT u.CODSETOR, s.DESCR COLLATE Latin1_General_CI_AI AS setor_nome
FROM USUARIO u
JOIN SETOR s ON s.CODIGO = u.CODSETOR
WHERE u.EMAIL = @pEmail COLLATE Latin1_General_CI_AI`

	start := time.Now()
	var code int
	var name string
	err := r.db.QueryRowContext(ctx, query, sql.Named("pEmail", email)).Scan(&code, &name)
	dur := time.Since(start)
	logSlowQuery("GetUserSectorCode", dur, email)

	if err != nil {
		if err == sql.ErrNoRows {
			return 0, "", fmt.Errorf("setor do usuário não encontrado para %s", email)
		}
		return 0, "", fmt.Errorf("erro ao buscar setor do usuário: %w", err)
	}
	name = strings.TrimPrefix(name, "- ")
	return code, name, nil
}

// refreshCache recarrega a lista de setores do SAGI.
func (r *SAGISetorRepository) refreshCache(ctx context.Context) ([]Setor, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	// Setores ativos no SAGI começam com "- " (ex: "- GERÊNCIA DE PROJETOS").
	// Filtramos apenas esses e removemos o prefixo ao retornar.
	query := `
SELECT CODIGO, DESCR COLLATE Latin1_General_CI_AI AS descricao
FROM SETOR
WHERE CODIGO > 0 AND DESCR LIKE '- %'
ORDER BY DESCR`

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query)
	dur := time.Since(start)
	logSlowQuery("ListSetores", dur)

	if err != nil {
		return nil, fmt.Errorf("erro ao listar setores SAGI: %w", err)
	}
	defer rows.Close()

	var setores []Setor
	setorMap := make(map[int]Setor)
	for rows.Next() {
		var s Setor
		if err := rows.Scan(&s.Codigo, &s.Descricao); err != nil {
			return nil, fmt.Errorf("erro ao escanear setor: %w", err)
		}
		// Remove o prefixo "- " dos setores ativos
		s.Descricao = strings.TrimPrefix(s.Descricao, "- ")
		setores = append(setores, s)
		setorMap[s.Codigo] = s
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro ao iterar setores: %w", err)
	}

	r.mu.Lock()
	r.cache = setores
	r.cacheMap = setorMap
	r.cacheAt = time.Now()
	r.mu.Unlock()

	return setores, nil
}
