package dto

import "time"

// --- Request DTOs ---

// CreateInternalProtocolRequest é o body JSON para criar um protocolo interno.
type CreateInternalProtocolRequest struct {
	Subject      string `json:"subject" binding:"required,max=500"`
	Interested   string `json:"interested" binding:"max=200"`
	Sender       string `json:"sender" binding:"max=200"`
	ProjectName  string `json:"project_name" binding:"max=300"`
	Observations string `json:"observations" binding:"max=5000"`
	SectorCode   *int   `json:"sector_code,omitempty"`
}

// UpdateInternalProtocolRequest é o body JSON para editar um protocolo interno.
type UpdateInternalProtocolRequest struct {
	Subject      *string `json:"subject"`
	Interested   *string `json:"interested"`
	Sender       *string `json:"sender"`
	ProjectName  *string `json:"project_name"`
	Observations *string `json:"observations"`
}

// ChangeStatusRequest é o body JSON para alterar o status de um protocolo interno.
type ChangeStatusRequest struct {
	Status       string `json:"status" binding:"required"`
	CancelReason string `json:"cancel_reason"`
}

// DispatchRequest é o body JSON para tramitar um protocolo interno.
type DispatchRequest struct {
	ToSectorCode int    `json:"to_sector_code" binding:"required"`
	DispatchNote string `json:"dispatch_note" binding:"required,min=10,max=2000"`
}

// DeleteInternalProtocolRequest é o body JSON para soft delete de protocolo.
type DeleteInternalProtocolRequest struct {
	Reason string `json:"reason" binding:"required,min=10"`
}

// ListInternalProtocolsQuery são os query params para listar protocolos internos.
type ListInternalProtocolsQuery struct {
	Page    int    `form:"page"`
	PerPage int    `form:"per_page"`
	Setor   *int   `form:"setor"`
	Status  string `form:"status"`
	Search  string `form:"search"`
	Projeto string `form:"projeto"`
}

// Defaults aplica valores padrão.
func (q *ListInternalProtocolsQuery) Defaults() {
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PerPage <= 0 {
		q.PerPage = 20
	}
	if q.PerPage > 100 {
		q.PerPage = 100
	}
}

// Offset retorna o offset para paginação.
func (q *ListInternalProtocolsQuery) Offset() int {
	return (q.Page - 1) * q.PerPage
}

// --- Response DTOs ---

// InternalProtocolItem é o DTO de resposta para listagem.
type InternalProtocolItem struct {
	ID                int32      `json:"id"`
	ProtocolNumber    string     `json:"protocol_number"`
	Subject           string     `json:"subject"`
	Interested        string     `json:"interested"`
	Sender            string     `json:"sender"`
	ProjectName       string     `json:"project_name"`
	Observations      string     `json:"observations"`
	CurrentSectorName string     `json:"current_sector_name"`
	CurrentSectorCode int32      `json:"current_sector_code"`
	Status            string     `json:"status"`
	CreatedByName     string     `json:"created_by_name"`
	CreatedByEmail    string     `json:"created_by_email"`
	CreatedAt         *time.Time `json:"created_at"`
	DocCount          int64      `json:"doc_count"`
	ObsCount          int64      `json:"obs_count"`
}

// InternalProtocolDetail é o DTO de resposta para detalhes.
type InternalProtocolDetail struct {
	ID                int32      `json:"id"`
	ProtocolNumber    string     `json:"protocol_number"`
	Subject           string     `json:"subject"`
	Interested        string     `json:"interested"`
	Sender            string     `json:"sender"`
	ProjectName       string     `json:"project_name"`
	Observations      string     `json:"observations"`
	CurrentSectorName string     `json:"current_sector_name"`
	CurrentSectorCode int32      `json:"current_sector_code"`
	Status            string     `json:"status"`
	CancelReason      string     `json:"cancel_reason,omitempty"`
	CreatedByName     string     `json:"created_by_name"`
	CreatedByEmail    string     `json:"created_by_email"`
	CreatedAt         *time.Time `json:"created_at"`
	UpdatedAt         *time.Time `json:"updated_at"`
	DocCount          int64      `json:"doc_count"`
	ObsCount          int64      `json:"obs_count"`
	TramitacaoCount   int64      `json:"tramitacao_count"`
}

// ListInternalProtocolsResponse é a resposta paginada.
type ListInternalProtocolsResponse struct {
	Data       []InternalProtocolItem `json:"data"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	PerPage    int                    `json:"per_page"`
	TotalPages int64                  `json:"total_pages"`
}

// MovementItem é o DTO de resposta para uma movimentação interna.
type MovementItem struct {
	ID             int32      `json:"id"`
	Sequence       int32      `json:"sequence"`
	FromSectorName string     `json:"from_sector_name"`
	ToSectorName   string     `json:"to_sector_name"`
	DispatchNote   string     `json:"dispatch_note"`
	MovedByName    string     `json:"moved_by_name"`
	MovedByEmail   string     `json:"moved_by_email"`
	MovedAt        *time.Time `json:"moved_at"`
	IsCurrent      bool       `json:"is_current"`
	Permanencia    int        `json:"permanencia_dias"`
}

// MovementResumo é o resumo estatístico da tramitação interna.
type MovementResumo struct {
	TempoTotalDias     int    `json:"tempo_total_dias"`
	TotalSetores       int    `json:"total_setores"`
	SetorMaisLongo     string `json:"setor_mais_longo"`
	DiasSetorMaisLongo int    `json:"dias_setor_mais_longo"`
}

// MovementHistoryResponse é a resposta do endpoint de histórico de tramitação.
type MovementHistoryResponse struct {
	Data   []MovementItem `json:"data"`
	Total  int            `json:"total"`
	Resumo MovementResumo `json:"resumo"`
}

// SetorItem é o DTO de resposta para um setor.
type SetorItem struct {
	Codigo    int    `json:"codigo"`
	Descricao string `json:"descricao"`
}
