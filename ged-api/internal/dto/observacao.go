package dto

import "time"

// --- Request DTOs ---

// CreateObservacaoRequest é o body JSON para criar uma observação.
type CreateObservacaoRequest struct {
	Content     string `json:"content" binding:"required,max=2000"`
	IsImportant bool   `json:"is_important"`
}

// UpdateObservacaoRequest é o body JSON para editar uma observação.
type UpdateObservacaoRequest struct {
	Content string `json:"content" binding:"required,max=2000"`
}

// --- Response DTOs ---

// ObservacaoItem é o DTO de resposta para uma observação.
type ObservacaoItem struct {
	ID             string     `json:"id"`
	ProtocolID     int        `json:"protocol_id"`
	ProtocolSource string     `json:"protocol_source"`
	Content        string     `json:"content"`
	IsImportant    bool       `json:"is_important"`
	CreatedByEmail string     `json:"created_by_email"`
	CreatedByName  string     `json:"created_by_name"`
	CreatedBySector string    `json:"created_by_sector"`
	CreatedAt      *time.Time `json:"created_at"`
	UpdatedAt      *time.Time `json:"updated_at"`
	CanEdit        bool       `json:"can_edit"`
	CanDelete      bool       `json:"can_delete"`
}

// ListObservacoesResponse é a resposta de listagem de observações.
type ListObservacoesResponse struct {
	Data      []ObservacaoItem `json:"data"`
	Total     int              `json:"total"`
	HasRecent bool             `json:"has_recent"`
}
