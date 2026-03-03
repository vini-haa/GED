package dto

import "time"

// TramitacaoItem é o DTO de resposta para uma movimentação/tramitação SAGI.
type TramitacaoItem struct {
	Sequencia        int        `json:"sequencia"`
	DataMovimentacao *time.Time `json:"data_movimentacao"`
	SetorOrigem      string     `json:"setor_origem"`
	SetorDestino     string     `json:"setor_destino"`
	Situacao         string     `json:"situacao"`
	RegAtual         bool       `json:"reg_atual"`
	PermanenciaDias  int        `json:"permanencia_dias"`
}

// TramitacaoResumo é o resumo estatístico da tramitação.
type TramitacaoResumo struct {
	TempoTotalDias      int    `json:"tempo_total_dias"`
	TotalSetores        int    `json:"total_setores"`
	SetorMaisLongo      string `json:"setor_mais_longo"`
	DiasSetorMaisLongo  int    `json:"dias_setor_mais_longo"`
}

// TramitacaoResponse é a resposta completa do endpoint de tramitação.
type TramitacaoResponse struct {
	Data    []TramitacaoItem `json:"data"`
	Total   int              `json:"total"`
	Resumo  TramitacaoResumo `json:"resumo"`
}
