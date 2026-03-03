package dto

import "time"

// --- Request DTOs ---

// DashboardQuery são os filtros globais aplicados a todos os endpoints de dashboard.
type DashboardQuery struct {
	Periodo string `form:"periodo"` // 7d, 30d, 90d, 1y
	Setor   string `form:"setor"`   // nome do setor ou vazio/all
	Projeto string `form:"projeto"` // nome do projeto ou vazio/all
}

// PeriodoDays retorna a quantidade de dias do período selecionado.
func (q *DashboardQuery) PeriodoDays() int {
	switch q.Periodo {
	case "7d":
		return 7
	case "30d":
		return 30
	case "90d":
		return 90
	case "1y":
		return 365
	default:
		return 30
	}
}

// DataInicio retorna a data de início com base no período.
func (q *DashboardQuery) DataInicio() time.Time {
	return time.Now().AddDate(0, 0, -q.PeriodoDays())
}

// DataInicioPeriodoAnterior retorna o início do período anterior (para cálculo de variação).
func (q *DashboardQuery) DataInicioPeriodoAnterior() time.Time {
	return time.Now().AddDate(0, 0, -2*q.PeriodoDays())
}

// SetorFilter retorna o setor como filtro, ou vazio se "all".
func (q *DashboardQuery) SetorFilter() string {
	if q.Setor == "" || q.Setor == "all" {
		return ""
	}
	return q.Setor
}

// --- Response DTOs ---

// DashboardKpi representa um card KPI no dashboard.
type DashboardKpi struct {
	Label    string  `json:"label"`
	Valor    int64   `json:"valor"`
	Variacao float64 `json:"variacao"`
	Formato  string  `json:"formato"` // "numero" ou "dias"
}

// UploadsPeriodoItem representa um ponto no gráfico de uploads por período.
type UploadsPeriodoItem struct {
	Data       string `json:"data"`
	Uploads    int64  `json:"uploads"`
	Protocolos int64  `json:"protocolos"`
}

// DocsPorTipoItem representa um segmento no gráfico de pizza por tipo de documento.
type DocsPorTipoItem struct {
	Tipo       string `json:"tipo"`
	Quantidade int64  `json:"quantidade"`
	Cor        string `json:"cor"`
}

// TramitacaoSetorItem representa uma barra no gráfico de tramitação por setor.
type TramitacaoSetorItem struct {
	Setor         string  `json:"setor"`
	TempoMedioDias float64 `json:"tempoMedioDias"`
	AcimaDaMedia  bool    `json:"acimaDaMedia"`
}

// RankingUploadItem representa um item no ranking de uploaders.
type RankingUploadItem struct {
	Posicao int    `json:"posicao"`
	Nome    string `json:"nome"`
	Setor   string `json:"setor"`
	Uploads int64  `json:"uploads"`
}

// ProtocoloSemDocs representa um protocolo SAGI que não tem documentos no GED.
type ProtocoloSemDocs struct {
	ID               string `json:"id"`
	Numero           string `json:"numero"`
	Assunto          string `json:"assunto"`
	SetorDestino     string `json:"setorDestino"`
	DiasSemDocumento int    `json:"diasSemDocumento"`
}
