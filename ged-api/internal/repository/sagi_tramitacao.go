package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

// TramitacaoSAGI representa uma movimentação/tramitação do SAGI.
type TramitacaoSAGI struct {
	Sequencia        int
	DataMovimentacao *time.Time
	SetorOrigem      string
	SetorDestino     string
	Situacao         string
	RegAtual         bool
}

// SAGITramitacaoRepository acessa tramitações/movimentações do SAGI.
type SAGITramitacaoRepository struct {
	db *sql.DB
}

// NewSAGITramitacaoRepository cria uma instância do repository.
func NewSAGITramitacaoRepository(db *sql.DB) *SAGITramitacaoRepository {
	return &SAGITramitacaoRepository{db: db}
}

// ListByProtocolo retorna todas as tramitações de um protocolo SAGI.
func (r *SAGITramitacaoRepository) ListByProtocolo(ctx context.Context, protocolID int) ([]TramitacaoSAGI, error) {
	ctx, cancel := context.WithTimeout(ctx, sagiQueryTimeout)
	defer cancel()

	query := `
SELECT
    sm.codigo,
    sm.data AS data_movimentacao,
    ISNULL(CASE WHEN setor_origem.DESCR LIKE '- %' THEN SUBSTRING(setor_origem.DESCR, 3, LEN(setor_origem.DESCR)) ELSE setor_origem.DESCR END, '') COLLATE Latin1_General_CI_AI AS setor_origem,
    ISNULL(CASE WHEN setor_destino.DESCR LIKE '- %' THEN SUBSTRING(setor_destino.DESCR, 3, LEN(setor_destino.DESCR)) ELSE setor_destino.DESCR END, '') COLLATE Latin1_General_CI_AI AS setor_destino,
    ISNULL(sp.Descricao, '') COLLATE Latin1_General_CI_AI AS situacao,
    ISNULL(sm.RegAtual, 0) AS reg_atual
FROM scd_movimentacao sm
LEFT JOIN SETOR setor_origem ON setor_origem.CODIGO = sm.codSetorOrigem
LEFT JOIN SETOR setor_destino ON setor_destino.CODIGO = sm.codSetorDestino
LEFT JOIN SituacaoProtocolo sp ON sp.Codigo = sm.codSituacaoProt
WHERE sm.CodProt = @pProtocolID
  AND (sm.Deletado IS NULL OR sm.Deletado = 0)
ORDER BY sm.codigo DESC`

	start := time.Now()
	rows, err := r.db.QueryContext(ctx, query, sql.Named("pProtocolID", protocolID))
	dur := time.Since(start)
	logSlowQuery("ListTramitacoesByProtocolo", dur, protocolID)

	if err != nil {
		return nil, fmt.Errorf("erro ao listar tramitações SAGI: %w", err)
	}
	defer rows.Close()

	var result []TramitacaoSAGI
	for rows.Next() {
		var t TramitacaoSAGI
		if err := rows.Scan(
			&t.Sequencia,
			&t.DataMovimentacao,
			&t.SetorOrigem,
			&t.SetorDestino,
			&t.Situacao,
			&t.RegAtual,
		); err != nil {
			return nil, fmt.Errorf("erro ao escanear tramitação: %w", err)
		}
		result = append(result, t)
	}
	return result, rows.Err()
}
