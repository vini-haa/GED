package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

const (
	sagiQueryTimeout    = 30 * time.Second
	sagiSlowQueryThresh = 2 * time.Second
)

// ProtocoloSAGI representa um protocolo retornado do sistema SAGI (SQL Server).
type ProtocoloSAGI struct {
	NumeroProtocolo     int        `json:"numero_protocolo"`
	AnoProtocolo        int        `json:"ano_protocolo"`
	DataProtocolo       time.Time  `json:"data_protocolo"`
	CodigoOrigem        int        `json:"codigo_origem"`
	SetorOrigem         *string    `json:"setor_origem"`
	CodigoDestino       int        `json:"codigo_destino"`
	SetorDestino        *string    `json:"setor_destino"`
	Assunto             *string    `json:"assunto"`
	Situacao            *string    `json:"situacao"`
	ProjetoDescricao    *string    `json:"projeto_descricao"`
	NumeroConvenio      *string    `json:"numero_convenio"`
	ConvenioObjeto      *string    `json:"convenio_objeto"`
	ConvenioValorGlobal *float64   `json:"convenio_valor_global"`
	ConvenioInicioVig   *time.Time `json:"convenio_inicio_vigencia"`
	ConvenioFimVig      *time.Time `json:"convenio_fim_vigencia"`
	UsuarioNome         *string    `json:"usuario_nome"`
	UsuarioEmail        *string    `json:"usuario_email"`
}

// SetorSAGI representa um setor do sistema SAGI.
type SetorSAGI struct {
	Codigo int    `json:"codigo"`
	Nome   string `json:"nome"`
}

// ProtocoloFiltros define os filtros para listagem de protocolos.
type ProtocoloFiltros struct {
	Situacao *string
	Setor    *int
	Busca    *string
	Limit    int
	Offset   int
}

// SAGIRepository fornece acesso somente-leitura ao banco SAGI (SQL Server).
type SAGIRepository struct {
	db *sql.DB
}

// NewSAGIRepository cria um novo repository para consultas ao SAGI.
func NewSAGIRepository(db *sql.DB) *SAGIRepository {
	return &SAGIRepository{db: db}
}

// logSlowQuery registra queries que excedem o threshold de 2s.
func logSlowQuery(queryName string, duration time.Duration, args ...interface{}) {
	if duration >= sagiSlowQueryThresh {
		log.Warn().
			Str("query", queryName).
			Dur("duration", duration).
			Interface("args", args).
			Msg("query SAGI lenta detectada")
	}
}

const protocoloSelectColumns = `
	p.NUMPRO AS numero_protocolo,
	p.ANOPRO AS ano_protocolo,
	p.DATPRO AS data_protocolo,
	p.CODORI AS codigo_origem,
	s.NOMSET AS setor_origem,
	p.CODDST AS codigo_destino,
	sd.NOMSET AS setor_destino,
	p.ASSUNTO AS assunto,
	p.SITUACAO AS situacao,
	pr.DESCRICAO AS projeto_descricao,
	pr.NUMCONV AS numero_convenio,
	c.OBJETO AS convenio_objeto,
	c.VALOR_GLOBAL AS convenio_valor_global,
	c.INICIO_VIGENCIA AS convenio_inicio_vigencia,
	c.FIM_VIGENCIA AS convenio_fim_vigencia,
	u.NOME AS usuario_nome,
	u.EMAIL AS usuario_email`

const protocoloFromJoins = `
FROM PROTOCOLO p
LEFT JOIN SETOR s ON p.CODORI = s.CODSET
LEFT JOIN SETOR sd ON p.CODDST = sd.CODSET
LEFT JOIN PROJETO pr ON p.CODPRO = pr.CODPRO
LEFT JOIN CONVENIO c ON pr.NUMCONV = c.NUMCONV
LEFT JOIN USUARIO u ON p.CODUSU = u.CODUSU`

// buildWhere constrói a cláusula WHERE dinâmica para protocolos.
func buildWhere(filtros ProtocoloFiltros) (string, []interface{}) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	if filtros.Situacao != nil {
		conditions = append(conditions, fmt.Sprintf("p.SITUACAO = @p%d", argIdx))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), *filtros.Situacao))
		argIdx++
	}

	if filtros.Setor != nil {
		conditions = append(conditions, fmt.Sprintf("(s.CODSET = @p%d OR sd.CODSET = @p%d)", argIdx, argIdx))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), *filtros.Setor))
		argIdx++
	}

	if filtros.Busca != nil {
		conditions = append(conditions, fmt.Sprintf(
			"(p.ASSUNTO LIKE @p%d OR CAST(p.NUMPRO AS VARCHAR) LIKE @p%d)", argIdx, argIdx,
		))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), "%"+*filtros.Busca+"%"))
		argIdx++
	}

	where := "WHERE 1=1"
	if len(conditions) > 0 {
		where += " AND " + strings.Join(conditions, " AND ")
	}

	return where, args
}

// scanProtocolo faz o scan de uma row para ProtocoloSAGI.
func scanProtocolo(scanner interface{ Scan(...interface{}) error }) (ProtocoloSAGI, error) {
	var p ProtocoloSAGI
	err := scanner.Scan(
		&p.NumeroProtocolo,
		&p.AnoProtocolo,
		&p.DataProtocolo,
		&p.CodigoOrigem,
		&p.SetorOrigem,
		&p.CodigoDestino,
		&p.SetorDestino,
		&p.Assunto,
		&p.Situacao,
		&p.ProjetoDescricao,
		&p.NumeroConvenio,
		&p.ConvenioObjeto,
		&p.ConvenioValorGlobal,
		&p.ConvenioInicioVig,
		&p.ConvenioFimVig,
		&p.UsuarioNome,
		&p.UsuarioEmail,
	)
	return p, err
}

// ListProtocolos retorna protocolos do SAGI com filtros dinâmicos e paginação.
func (r *SAGIRepository) ListProtocolos(ctx context.Context, filtros ProtocoloFiltros) ([]ProtocoloSAGI, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	if filtros.Limit <= 0 {
		filtros.Limit = 20
	}
	if filtros.Limit > 100 {
		filtros.Limit = 100
	}

	where, args := buildWhere(filtros)

	query := fmt.Sprintf(`SELECT %s %s %s
ORDER BY p.DATPRO DESC
OFFSET @pOffset ROWS FETCH NEXT @pLimit ROWS ONLY`,
		protocoloSelectColumns, protocoloFromJoins, where,
	)

	args = append(args,
		sql.Named("pOffset", filtros.Offset),
		sql.Named("pLimit", filtros.Limit),
	)

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query, args...)
	duration := time.Since(start)
	logSlowQuery("ListProtocolos", duration, filtros)

	if err != nil {
		return nil, fmt.Errorf("erro ao listar protocolos SAGI: %w", err)
	}
	defer rows.Close()

	var protocolos []ProtocoloSAGI
	for rows.Next() {
		p, err := scanProtocolo(rows)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear protocolo SAGI: %w", err)
		}
		protocolos = append(protocolos, p)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro ao iterar protocolos SAGI: %w", err)
	}

	return protocolos, nil
}

// CountProtocolos retorna a contagem de protocolos com os mesmos filtros (para paginação).
func (r *SAGIRepository) CountProtocolos(ctx context.Context, filtros ProtocoloFiltros) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	where, args := buildWhere(filtros)

	query := fmt.Sprintf(`SELECT COUNT(*) %s %s`, protocoloFromJoins, where)

	start := time.Now()
	var count int64
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&count)
	duration := time.Since(start)
	logSlowQuery("CountProtocolos", duration, filtros)

	if err != nil {
		return 0, fmt.Errorf("erro ao contar protocolos SAGI: %w", err)
	}

	return count, nil
}

// GetProtocoloByNumeroAno busca um protocolo específico por número e ano.
func (r *SAGIRepository) GetProtocoloByNumeroAno(ctx context.Context, numero, ano int) (ProtocoloSAGI, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := fmt.Sprintf(`SELECT %s %s
WHERE p.NUMPRO = @pNumero AND p.ANOPRO = @pAno`,
		protocoloSelectColumns, protocoloFromJoins,
	)

	start := time.Now()
	row := r.db.QueryRowContext(ctx, query,
		sql.Named("pNumero", numero),
		sql.Named("pAno", ano),
	)
	duration := time.Since(start)
	logSlowQuery("GetProtocoloByNumeroAno", duration, numero, ano)

	p, err := scanProtocolo(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return ProtocoloSAGI{}, fmt.Errorf("protocolo %d/%d não encontrado no SAGI", numero, ano)
		}
		return ProtocoloSAGI{}, fmt.Errorf("erro ao buscar protocolo SAGI: %w", err)
	}

	return p, nil
}

// GetSetoresByEmail busca setores vinculados a um email de usuário no SAGI.
func (r *SAGIRepository) GetSetoresByEmail(ctx context.Context, email string) ([]SetorSAGI, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT DISTINCT s.CODSET, s.NOMSET
FROM USUARIO u
INNER JOIN USUARIO_SETOR us ON u.CODUSU = us.CODUSU
INNER JOIN SETOR s ON us.CODSET = s.CODSET
WHERE u.EMAIL = @pEmail
ORDER BY s.NOMSET`

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query, sql.Named("pEmail", email))
	duration := time.Since(start)
	logSlowQuery("GetSetoresByEmail", duration, email)

	if err != nil {
		return nil, fmt.Errorf("erro ao buscar setores por email SAGI: %w", err)
	}
	defer rows.Close()

	var setores []SetorSAGI
	for rows.Next() {
		var s SetorSAGI
		if err := rows.Scan(&s.Codigo, &s.Nome); err != nil {
			return nil, fmt.Errorf("erro ao escanear setor SAGI: %w", err)
		}
		setores = append(setores, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro ao iterar setores SAGI: %w", err)
	}

	return setores, nil
}

// ListSetores retorna todos os setores ativos do SAGI.
func (r *SAGIRepository) ListSetores(ctx context.Context) ([]SetorSAGI, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT CODSET, NOMSET
FROM SETOR
WHERE ATIVO = 1
ORDER BY NOMSET`

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query)
	duration := time.Since(start)
	logSlowQuery("ListSetores", duration)

	if err != nil {
		return nil, fmt.Errorf("erro ao listar setores SAGI: %w", err)
	}
	defer rows.Close()

	var setores []SetorSAGI
	for rows.Next() {
		var s SetorSAGI
		if err := rows.Scan(&s.Codigo, &s.Nome); err != nil {
			return nil, fmt.Errorf("erro ao escanear setor SAGI: %w", err)
		}
		setores = append(setores, s)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro ao iterar setores SAGI: %w", err)
	}

	return setores, nil
}
