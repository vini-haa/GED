package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

// ProtocoloDocumento representa um protocolo da tabela documento do SAGI.
type ProtocoloDocumento struct {
	ID                   int        `json:"id"`
	NumeroProtocolo      string     `json:"numero_protocolo"`
	DataCriacao          *time.Time `json:"data_criacao"`
	Assunto              string     `json:"assunto"`
	NomeProjeto          string     `json:"nome_projeto"`
	CodigoConvenio       string     `json:"codigo_convenio"`
	NomeInteressado      string     `json:"nome_interessado"`
	NomeSetorAtual       string     `json:"nome_setor_atual"`
	CodSetorAtual        int        `json:"cod_setor_atual"`
	DataChegadaSetor     *time.Time `json:"data_chegada_setor"`
	Status               string     `json:"status"`
	Interessado          string     `json:"interessado"`
	Observacao           string     `json:"observacao"`
	UsuarioCadastro      string     `json:"usuario_cadastro"`
	ContaCorrente          string     `json:"conta_corrente"`
	DiasUltimaMovimentacao int        `json:"dias_ultima_movimentacao"`
	Situacao               string     `json:"situacao"`
}

// ProtocoloListFilters encapsula filtros para listagem de protocolos.
type ProtocoloListFilters struct {
	Setor      *int
	Status     string
	Search     string
	DataInicio string
	DataFim    string
	Offset     int
	Limit      int
	Ordenacao  string // "data_criacao" (padrão) ou "data_chegada_setor"
	Projeto    string
}

// SAGIProtocoloRepository acessa protocolos do SAGI (SQL Server) via tabela `documento`.
type SAGIProtocoloRepository struct {
	db *sql.DB
}

func NewSAGIProtocoloRepository(db *sql.DB) *SAGIProtocoloRepository {
	return &SAGIProtocoloRepository{db: db}
}

const protocoloDocSelectCols = `
	d.Codigo AS id,
	d.Numero AS numero_protocolo,
	d.data AS data_criacao,
	ISNULL(d.Assunto, '') AS assunto,
	ISNULL(c.Titulo, '') AS nome_projeto,
	ISNULL(c.numOficial, ISNULL(CAST(c.NUMCONV AS VARCHAR), '')) AS codigo_convenio,
	COALESCE(p.descricao COLLATE Latin1_General_CI_AI, d.Interessado COLLATE Latin1_General_CI_AI, d.remetente COLLATE Latin1_General_CI_AI, '') AS nome_interessado,
	ISNULL(CASE WHEN setor.DESCR LIKE '- %' THEN SUBSTRING(setor.DESCR, 3, LEN(setor.DESCR)) ELSE setor.DESCR END, '') AS nome_setor_atual,
	ISNULL(sm.codSetorDestino, 0) AS cod_setor_atual,
	sm.data AS data_chegada_setor,
	CASE
		WHEN sm.codSituacaoProt = 60 THEN 'Arquivado' COLLATE Latin1_General_CI_AI
		WHEN sm.codSituacaoProt = 64 THEN 'Cancelado' COLLATE Latin1_General_CI_AI
		WHEN sm.codSituacaoProt = 57 THEN 'Finalizado' COLLATE Latin1_General_CI_AI
		WHEN sm.codSituacaoProt = 66 THEN 'Em Análise' COLLATE Latin1_General_CI_AI
		WHEN setor.DESCR LIKE '%ARQUIVO%' THEN 'Arquivado' COLLATE Latin1_General_CI_AI
		ELSE 'Em Tramitação' COLLATE Latin1_General_CI_AI
	END AS status_protocolo,
	ISNULL(d.Interessado COLLATE Latin1_General_CI_AI, '') AS interessado,
	ISNULL(d.obs COLLATE Latin1_General_CI_AI, '') AS observacao,
	ISNULL(u_cad.Nome COLLATE Latin1_General_CI_AI, '') AS usuario_cadastro,
	ISNULL(cc.cc, '') AS conta_corrente,
	CASE WHEN sm.data IS NOT NULL THEN DATEDIFF(DAY, sm.data, GETDATE()) ELSE 0 END AS dias_ultima_movimentacao,
	ISNULL(sp.descricao COLLATE Latin1_General_CI_AI,
		CASE
			WHEN sm.codSituacaoProt = 60 THEN 'Protocolo Arquivado' COLLATE Latin1_General_CI_AI
			WHEN sm.codSituacaoProt = 64 THEN 'Cancelado' COLLATE Latin1_General_CI_AI
			WHEN sm.codSituacaoProt = 57 THEN 'Finalizado' COLLATE Latin1_General_CI_AI
			WHEN sm.codSituacaoProt = 66 THEN 'Em Análise' COLLATE Latin1_General_CI_AI
			WHEN setor.DESCR LIKE '%ARQUIVO%' THEN 'Protocolo Arquivado' COLLATE Latin1_General_CI_AI
			ELSE 'Em Tramitação' COLLATE Latin1_General_CI_AI
		END
	) AS situacao`

const protocoloDocFromJoins = `
FROM documento d
LEFT JOIN scd_movimentacao sm ON sm.CodProt = d.Codigo AND sm.RegAtual = 1
LEFT JOIN SETOR setor ON setor.CODIGO = sm.codSetorDestino
LEFT JOIN CONVENIO c ON c.NumConv = d.NumConv
LEFT JOIN PESSOAS p ON p.codigo = d.CodFornec
LEFT JOIN Usuario u_cad ON u_cad.Codigo = d.codUsuario
LEFT JOIN conv_cc ccc ON c.NumConv = ccc.NumConv AND ccc.deletado IS NULL AND ccc.principal = 1
LEFT JOIN cc ON cc.codigo = ccc.CodCC AND cc.DELETADO IS NULL
LEFT JOIN situacaoProtocolo sp ON sp.codigo = sm.codSituacaoProt`

// buildProtocoloWhere monta WHERE dinâmico com parâmetros nomeados do SQL Server.
func buildProtocoloWhere(f ProtocoloListFilters) (string, []interface{}) {
	conditions := []string{"(d.deletado IS NULL OR d.deletado = 0)"}
	var args []interface{}
	argIdx := 1

	if f.Setor != nil {
		conditions = append(conditions, fmt.Sprintf("sm.codSetorDestino = @p%d", argIdx))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), *f.Setor))
		argIdx++
	}

	if f.Status != "" {
		statusCond := mapStatusToCondition(f.Status, argIdx)
		if statusCond != "" {
			conditions = append(conditions, statusCond)
		}
	}

	if f.Search != "" {
		searchParam := "%" + f.Search + "%"
		conditions = append(conditions, fmt.Sprintf(
			"(d.Numero LIKE @p%d OR d.Assunto LIKE @p%d OR COALESCE(p.descricao COLLATE Latin1_General_CI_AI, d.Interessado COLLATE Latin1_General_CI_AI, '') LIKE @p%d OR ISNULL(c.Titulo, '') LIKE @p%d)",
			argIdx, argIdx, argIdx, argIdx,
		))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), searchParam))
		argIdx++
	}

	if f.DataInicio != "" {
		conditions = append(conditions, fmt.Sprintf("d.data >= @p%d", argIdx))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), f.DataInicio))
		argIdx++
	}

	if f.DataFim != "" {
		conditions = append(conditions, fmt.Sprintf("d.data <= @p%d", argIdx))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), f.DataFim))
		argIdx++
	}

	if f.Projeto != "" {
		projetoParam := "%" + f.Projeto + "%"
		conditions = append(conditions, fmt.Sprintf("ISNULL(c.Titulo, '') LIKE @p%d", argIdx))
		args = append(args, sql.Named(fmt.Sprintf("p%d", argIdx), projetoParam))
		argIdx++
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	return where, args
}

// mapStatusToCondition converte o status da API para condição SQL.
func mapStatusToCondition(status string, _ int) string {
	switch strings.ToLower(status) {
	case "em_tramitacao":
		return "(sm.codSituacaoProt NOT IN (57, 60, 64, 66) AND (setor.DESCR IS NULL OR setor.DESCR NOT LIKE '%ARQUIVO%'))"
	case "em_analise":
		return "sm.codSituacaoProt = 66"
	case "arquivado":
		return "(sm.codSituacaoProt = 60 OR setor.DESCR LIKE '%ARQUIVO%')"
	case "cancelado":
		return "sm.codSituacaoProt = 64"
	case "finalizado":
		return "sm.codSituacaoProt = 57"
	}
	return ""
}

func scanProtocoloDoc(scanner interface{ Scan(...interface{}) error }) (ProtocoloDocumento, error) {
	var p ProtocoloDocumento
	err := scanner.Scan(
		&p.ID,
		&p.NumeroProtocolo,
		&p.DataCriacao,
		&p.Assunto,
		&p.NomeProjeto,
		&p.CodigoConvenio,
		&p.NomeInteressado,
		&p.NomeSetorAtual,
		&p.CodSetorAtual,
		&p.DataChegadaSetor,
		&p.Status,
		&p.Interessado,
		&p.Observacao,
		&p.UsuarioCadastro,
		&p.ContaCorrente,
		&p.DiasUltimaMovimentacao,
		&p.Situacao,
	)
	return p, err
}

// ListProtocolos retorna protocolos paginados do SAGI.
func (r *SAGIProtocoloRepository) ListProtocolos(ctx context.Context, f ProtocoloListFilters) ([]ProtocoloDocumento, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	where, args := buildProtocoloWhere(f)

	orderBy := "d.data DESC"
	if f.Ordenacao == "data_chegada_setor" {
		orderBy = "sm.data DESC"
	}

	query := fmt.Sprintf(`SELECT %s %s %s
ORDER BY %s
OFFSET @pOffset ROWS FETCH NEXT @pLimit ROWS ONLY`,
		protocoloDocSelectCols, protocoloDocFromJoins, where, orderBy,
	)

	args = append(args,
		sql.Named("pOffset", f.Offset),
		sql.Named("pLimit", f.Limit),
	)

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query, args...)
	dur := time.Since(start)
	logSlowQuery("ListProtocolos", dur, f)

	if err != nil {
		return nil, fmt.Errorf("erro ao listar protocolos SAGI: %w", err)
	}
	defer rows.Close()

	var result []ProtocoloDocumento
	for rows.Next() {
		p, err := scanProtocoloDoc(rows)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear protocolo: %w", err)
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// CountProtocolos retorna total de protocolos com os mesmos filtros.
func (r *SAGIProtocoloRepository) CountProtocolos(ctx context.Context, f ProtocoloListFilters) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	where, args := buildProtocoloWhere(f)
	query := fmt.Sprintf(`SELECT COUNT(*) %s %s`, protocoloDocFromJoins, where)

	start := time.Now()
	var count int64
	err := r.db.QueryRowContext(ctx, query, args...).Scan(&count)
	dur := time.Since(start)
	logSlowQuery("CountProtocolos", dur, f)

	if err != nil {
		return 0, fmt.Errorf("erro ao contar protocolos SAGI: %w", err)
	}
	return count, nil
}

// ListProtocoloIDs retorna apenas os IDs dos protocolos no setor (para cross-check com PostgreSQL).
func (r *SAGIProtocoloRepository) ListProtocoloIDs(ctx context.Context, codSetor int) ([]string, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT CAST(d.Codigo AS VARCHAR)
FROM documento d
LEFT JOIN scd_movimentacao sm ON sm.CodProt = d.Codigo AND sm.RegAtual = 1
WHERE (d.deletado IS NULL OR d.deletado = 0)
  AND sm.codSetorDestino = @pSetor`

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query, sql.Named("pSetor", codSetor))
	dur := time.Since(start)
	logSlowQuery("ListProtocoloIDs", dur, codSetor)

	if err != nil {
		return nil, fmt.Errorf("erro ao listar IDs de protocolos: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// SearchProtocolos busca protocolos por texto livre.
func (r *SAGIProtocoloRepository) SearchProtocolos(ctx context.Context, query string, setor *int, limit int) ([]ProtocoloDocumento, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	searchParam := "%" + query + "%"
	conditions := []string{
		"(d.deletado IS NULL OR d.deletado = 0)",
		"(d.Numero LIKE @pSearch OR d.Assunto LIKE @pSearch OR COALESCE(p.descricao COLLATE Latin1_General_CI_AI, d.Interessado COLLATE Latin1_General_CI_AI, '') LIKE @pSearch OR ISNULL(c.Titulo, '') LIKE @pSearch)",
	}
	args := []interface{}{sql.Named("pSearch", searchParam)}

	if setor != nil {
		conditions = append(conditions, "sm.codSetorDestino = @pSetor")
		args = append(args, sql.Named("pSetor", *setor))
	}

	where := "WHERE " + strings.Join(conditions, " AND ")

	sqlStr := fmt.Sprintf(`SELECT TOP(@pLimit) %s %s %s ORDER BY d.data DESC`,
		protocoloDocSelectCols, protocoloDocFromJoins, where,
	)
	args = append(args, sql.Named("pLimit", limit))

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, sqlStr, args...)
	dur := time.Since(start)
	logSlowQuery("SearchProtocolos", dur, query, setor)

	if err != nil {
		return nil, fmt.Errorf("erro ao buscar protocolos SAGI: %w", err)
	}
	defer rows.Close()

	var result []ProtocoloDocumento
	for rows.Next() {
		p, err := scanProtocoloDoc(rows)
		if err != nil {
			return nil, fmt.Errorf("erro ao escanear protocolo: %w", err)
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// CountSearch retorna contagem de resultados da busca.
func (r *SAGIProtocoloRepository) CountSearch(ctx context.Context, query string, setor *int) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	searchParam := "%" + query + "%"
	conditions := []string{
		"(d.deletado IS NULL OR d.deletado = 0)",
		"(d.Numero LIKE @pSearch OR d.Assunto LIKE @pSearch OR COALESCE(p.descricao COLLATE Latin1_General_CI_AI, d.Interessado COLLATE Latin1_General_CI_AI, '') LIKE @pSearch OR ISNULL(c.Titulo, '') LIKE @pSearch)",
	}
	args := []interface{}{sql.Named("pSearch", searchParam)}

	if setor != nil {
		conditions = append(conditions, "sm.codSetorDestino = @pSetor")
		args = append(args, sql.Named("pSetor", *setor))
	}

	where := "WHERE " + strings.Join(conditions, " AND ")
	sqlStr := fmt.Sprintf(`SELECT COUNT(*) %s %s`, protocoloDocFromJoins, where)

	start := time.Now()
	var count int64
	err := r.db.QueryRowContext(ctx, sqlStr, args...).Scan(&count)
	dur := time.Since(start)
	logSlowQuery("CountSearch", dur, query, setor)

	if err != nil {
		return 0, fmt.Errorf("erro ao contar busca SAGI: %w", err)
	}
	return count, nil
}

// GetProtocolosByIDs busca protocolos por lista de IDs (para enriquecer recentes).
func (r *SAGIProtocoloRepository) GetProtocolosByIDs(ctx context.Context, ids []int) ([]ProtocoloDocumento, error) {
	if len(ids) == 0 {
		return nil, nil
	}

	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		name := fmt.Sprintf("p%d", i)
		placeholders[i] = "@" + name
		args[i] = sql.Named(name, id)
	}

	query := fmt.Sprintf(`SELECT %s %s WHERE d.Codigo IN (%s)`,
		protocoloDocSelectCols, protocoloDocFromJoins, strings.Join(placeholders, ", "),
	)

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query, args...)
	dur := time.Since(start)
	logSlowQuery("GetProtocolosByIDs", dur, ids)

	if err != nil {
		return nil, fmt.Errorf("erro ao buscar protocolos por IDs: %w", err)
	}
	defer rows.Close()

	var result []ProtocoloDocumento
	for rows.Next() {
		p, err := scanProtocoloDoc(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

// CountProtocolosNoSetor retorna total de protocolos no setor.
func (r *SAGIProtocoloRepository) CountProtocolosNoSetor(ctx context.Context, codSetor int) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT COUNT(*)
FROM documento d
LEFT JOIN scd_movimentacao sm ON sm.CodProt = d.Codigo AND sm.RegAtual = 1
WHERE (d.deletado IS NULL OR d.deletado = 0)
  AND sm.codSetorDestino = @pSetor`

	start := time.Now()
	var count int64
	err := r.db.QueryRowContext(ctx, query, sql.Named("pSetor", codSetor)).Scan(&count)
	dur := time.Since(start)
	logSlowQuery("CountProtocolosNoSetor", dur, codSetor)

	if err != nil {
		return 0, fmt.Errorf("erro ao contar protocolos no setor: %w", err)
	}
	return count, nil
}

// ListProtocoloNumerosBySetor retorna os números (como string do Codigo) dos protocolos no setor.
func (r *SAGIProtocoloRepository) ListProtocoloNumerosBySetor(ctx context.Context, codSetor int) ([]string, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT d.Numero
FROM documento d
LEFT JOIN scd_movimentacao sm ON sm.CodProt = d.Codigo AND sm.RegAtual = 1
WHERE (d.deletado IS NULL OR d.deletado = 0)
  AND sm.codSetorDestino = @pSetor`

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query, sql.Named("pSetor", codSetor))
	dur := time.Since(start)
	logSlowQuery("ListProtocoloNumerosBySetor", dur, codSetor)

	if err != nil {
		return nil, fmt.Errorf("erro ao listar números de protocolos: %w", err)
	}
	defer rows.Close()

	var nums []string
	for rows.Next() {
		var n string
		if err := rows.Scan(&n); err != nil {
			return nil, err
		}
		nums = append(nums, n)
	}
	return nums, rows.Err()
}

// CountProtocolosGlobal retorna total de protocolos ativos (sem filtro de setor).
func (r *SAGIProtocoloRepository) CountProtocolosGlobal(ctx context.Context) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT COUNT(*)
FROM documento d
WHERE (d.deletado IS NULL OR d.deletado = 0)`

	start := time.Now()
	var count int64
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	dur := time.Since(start)
	logSlowQuery("CountProtocolosGlobal", dur, 0)

	if err != nil {
		return 0, fmt.Errorf("erro ao contar protocolos globais: %w", err)
	}
	return count, nil
}

// GetProtocoloByID busca um protocolo SAGI pelo Codigo (ID inteiro).
func (r *SAGIProtocoloRepository) GetProtocoloByID(ctx context.Context, id int) (ProtocoloDocumento, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := fmt.Sprintf(`SELECT %s %s WHERE (d.deletado IS NULL OR d.deletado = 0) AND d.Codigo = @pID`,
		protocoloDocSelectCols, protocoloDocFromJoins,
	)

	start := time.Now()
	row := r.db.QueryRowContext(ctx, query, sql.Named("pID", id))
	dur := time.Since(start)
	logSlowQuery("GetProtocoloByID", dur, id)

	p, err := scanProtocoloDoc(row)
	if err != nil {
		if err == sql.ErrNoRows {
			return ProtocoloDocumento{}, fmt.Errorf("protocolo %d não encontrado no SAGI", id)
		}
		return ProtocoloDocumento{}, fmt.Errorf("erro ao buscar protocolo SAGI por ID: %w", err)
	}
	return p, nil
}

// CountTramitacoesByProtocolo conta movimentações de um protocolo SAGI.
func (r *SAGIProtocoloRepository) CountTramitacoesByProtocolo(ctx context.Context, codProt int) (int64, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `SELECT COUNT(*) FROM scd_movimentacao WHERE CodProt = @pCodProt AND (Deletado IS NULL OR Deletado = 0)`

	start := time.Now()
	var count int64
	err := r.db.QueryRowContext(ctx, query, sql.Named("pCodProt", codProt)).Scan(&count)
	dur := time.Since(start)
	logSlowQuery("CountTramitacoesByProtocolo", dur, codProt)

	if err != nil {
		return 0, fmt.Errorf("erro ao contar tramitações: %w", err)
	}
	return count, nil
}

// GetUserSectorByEmail busca o setor do usuário pelo email na tabela USUARIO do SAGI.
func (r *SAGIProtocoloRepository) GetUserSectorByEmail(ctx context.Context, email string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT s.DESCR COLLATE Latin1_General_CI_AI AS setor_nome
FROM USUARIO u
JOIN SETOR s ON s.CODIGO = u.CODSETOR
WHERE u.EMAIL = @pEmail COLLATE Latin1_General_CI_AI`

	start := time.Now()
	var setor string
	err := r.db.QueryRowContext(ctx, query, sql.Named("pEmail", email)).Scan(&setor)
	dur := time.Since(start)
	logSlowQuery("GetUserSectorByEmail", dur, email)

	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", fmt.Errorf("erro ao buscar setor do usuário: %w", err)
	}
	setor = strings.TrimPrefix(setor, "- ")
	return setor, nil
}

// Ignore unused log import
var _ = log.Info
