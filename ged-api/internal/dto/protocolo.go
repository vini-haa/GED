package dto

import "time"

// --- Request DTOs ---

type ListProtocolosQuery struct {
	Page       int    `form:"page"`
	PageSize   int    `form:"page_size"`
	Setor      *int   `form:"setor"`
	Status     string `form:"status"`
	Search     string `form:"search"`
	DataInicio string `form:"data_inicio"`
	DataFim    string `form:"data_fim"`
	Tab        string `form:"tab"`
	Ordenacao  string `form:"ordenacao"` // "data_criacao" ou "data_chegada_setor"
	Projeto    string `form:"projeto"`
}

func (q *ListProtocolosQuery) Defaults() {
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = 20
	}
	if q.PageSize > 100 {
		q.PageSize = 100
	}
	if q.Tab == "" {
		q.Tab = "todos"
	}
}

func (q *ListProtocolosQuery) Offset() int {
	return (q.Page - 1) * q.PageSize
}

type ContadoresQuery struct {
	Setor int `form:"setor" binding:"required"`
}

type SearchQuery struct {
	Q     string `form:"q" binding:"required,min=3"`
	Scope string `form:"scope"`
	Setor *int   `form:"setor"`
	Limit int    `form:"limit"`
}

func (q *SearchQuery) Defaults() {
	if q.Scope == "" {
		q.Scope = "todos"
	}
	if q.Limit <= 0 {
		q.Limit = 5
	}
	if q.Limit > 20 {
		q.Limit = 20
	}
}

type RecentQuery struct {
	Limit int `form:"limit"`
}

func (q *RecentQuery) Defaults() {
	if q.Limit <= 0 {
		q.Limit = 10
	}
	if q.Limit > 50 {
		q.Limit = 50
	}
}

// --- Response DTOs ---

type ProtocoloItem struct {
	ID                    int        `json:"id"`
	InternalID            string     `json:"internal_id,omitempty"`
	NumeroProtocolo       string     `json:"numero_protocolo"`
	DataCriacao           *time.Time `json:"data_criacao"`
	Assunto               string     `json:"assunto"`
	NomeProjeto           string     `json:"nome_projeto"`
	CodigoConvenio        string     `json:"codigo_convenio"`
	NomeInteressado       string     `json:"nome_interessado"`
	NomeSetorAtual        string     `json:"nome_setor_atual"`
	CodSetorAtual         int        `json:"cod_setor_atual"`
	DataChegadaSetor      *time.Time `json:"data_chegada_setor"`
	Status                string     `json:"status"`
	DocCount              int64      `json:"doc_count"`
	IsNew                 bool       `json:"is_new"`
	HasRecentObservations bool       `json:"has_recent_observations"`
	IsInternal            bool       `json:"is_internal"`
}

type ProtocoloInternoItem struct {
	ID             string     `json:"id"`
	NumeroProtocolo string    `json:"numero_protocolo"`
	DataCriacao    *time.Time `json:"data_criacao"`
	Assunto        string     `json:"assunto"`
	NomeProjeto    string     `json:"nome_projeto"`
	CodigoConvenio string     `json:"codigo_convenio"`
	NomeInteressado string   `json:"nome_interessado"`
	NomeSetorAtual string     `json:"nome_setor_atual"`
	CodSetorAtual  int        `json:"cod_setor_atual"`
	DataChegadaSetor *time.Time `json:"data_chegada_setor"`
	Status         string     `json:"status"`
	DocCount       int64      `json:"doc_count"`
	IsNew          bool       `json:"is_new"`
	HasRecentObservations bool `json:"has_recent_observations"`
	IsInternal     bool       `json:"is_internal"`
}

type Pagination struct {
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
	Total      int64 `json:"total"`
	TotalPages int64 `json:"total_pages"`
}

type ListProtocolosResponse struct {
	Data       []ProtocoloItem `json:"data"`
	Pagination Pagination      `json:"pagination"`
}

type ContadoresResponse struct {
	TotalProtocolos int64 `json:"total_protocolos"`
	SemDocumentos   int64 `json:"sem_documentos"`
	DocsAnexados    int64 `json:"docs_anexados"`
}

type SearchResultItem struct {
	ID              int    `json:"id"`
	NumeroProtocolo string `json:"numero_protocolo"`
	Assunto         string `json:"assunto"`
	NomeProjeto     string `json:"nome_projeto"`
	NomeInteressado string `json:"nome_interessado"`
	Tipo            string `json:"tipo"`
	Highlight       string `json:"highlight"`
}

type SearchResponse struct {
	Results    []SearchResultItem `json:"results"`
	TotalSetor int64              `json:"total_setor"`
	TotalTodos int64              `json:"total_todos"`
}

func CalcTotalPages(total int64, pageSize int) int64 {
	pages := total / int64(pageSize)
	if total%int64(pageSize) > 0 {
		pages++
	}
	return pages
}
