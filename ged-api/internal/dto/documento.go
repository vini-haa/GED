package dto

import "time"

// --- Request DTOs ---

// UploadDocumentoForm é o binding para multipart upload.
type UploadDocumentoForm struct {
	TipoDocumentoID string `form:"tipo_documento_id"`
	Descricao       string `form:"descricao"`
}

// UpdateDocumentoRequest é o body JSON para editar metadados.
type UpdateDocumentoRequest struct {
	Descricao       *string `json:"descricao"`
	TipoDocumentoID *string `json:"tipo_documento_id"`
}

// DeleteDocumentoRequest é o body JSON para soft delete.
type DeleteDocumentoRequest struct {
	MotivoExclusao string `json:"motivo_exclusao" binding:"required,min=3"`
}

// --- Response DTOs ---

// DocumentoItem é o DTO de resposta para um documento.
type DocumentoItem struct {
	ID                   string     `json:"id"`
	ProtocoloSagi        string     `json:"protocolo_sagi"`
	TipoDocumentoID      *string    `json:"tipo_documento_id"`
	TipoDocumentoNome    string     `json:"tipo_documento_nome"`
	NomeArquivo          string     `json:"nome_arquivo"`
	Descricao            string     `json:"descricao"`
	DriveFileURL         string     `json:"drive_file_url"`
	TamanhoBytes         int64      `json:"tamanho_bytes"`
	MimeType             string     `json:"mime_type"`
	UploadedBy           string     `json:"uploaded_by"`
	UploadedByName       string     `json:"uploaded_by_name"`
	UploadedAt           *time.Time `json:"uploaded_at"`
	CanEdit              bool       `json:"can_edit"`
	CanDelete            bool       `json:"can_delete"`
}

// ListDocumentosResponse é a resposta de listagem de documentos.
type ListDocumentosResponse struct {
	Data  []DocumentoItem `json:"data"`
	Total int64           `json:"total"`
}

// ProtocoloDetalheResponse é a resposta detalhada de um protocolo.
type ProtocoloDetalheResponse struct {
	ID                    int        `json:"id"`
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
	IsInternal            bool       `json:"is_internal"`
	DocCount              int64      `json:"doc_count"`
	ObservationCount      int64      `json:"observation_count"`
	HasRecentObservations bool       `json:"has_recent_observations"`
	TramitacaoCount       int64      `json:"tramitacao_count"`
}
