package dto

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"github.com/fadex/ged-api/internal/db"
)

// --- Admin DTOs ---

type AdminResponse struct {
	ID           string `json:"id"`
	Nome         string `json:"nome"`
	Email        string `json:"email"`
	Setor        string `json:"setor"`
	GedRole      string `json:"gedRole"`
	Ativo        bool   `json:"ativo"`
	AdicionadoEm string `json:"adicionadoEm"`
	AdicionadoPor string `json:"adicionadoPor"`
}

func AdminFromDB(a db.Admin, setor string) AdminResponse {
	adicionadoPor := ""
	if a.CriadoPor.Valid {
		adicionadoPor = a.CriadoPor.String
	}
	adicionadoEm := ""
	if a.CriadoEm.Valid {
		adicionadoEm = a.CriadoEm.Time.Format(time.RFC3339)
	}
	role := a.Role
	if role == "SUPER_ADMIN" {
		role = "super_admin"
	} else if role == "ADMIN" {
		role = "admin"
	}
	ativo := false
	if a.Ativo.Valid {
		ativo = a.Ativo.Bool
	}

	return AdminResponse{
		ID:            a.ID.String(),
		Nome:          a.Nome,
		Email:         a.Email,
		Setor:         setor,
		GedRole:       role,
		Ativo:         ativo,
		AdicionadoEm:  adicionadoEm,
		AdicionadoPor: adicionadoPor,
	}
}

type CreateAdminRequest struct {
	Email string `json:"email" binding:"required,email"`
	Nome  string `json:"nome" binding:"required,min=3,max=100"`
	Setor string `json:"setor"`
}

type UpdateAdminRequest struct {
	Role  *string `json:"role"`
	Ativo *bool   `json:"ativo"`
}

// --- Activity Log DTOs ---

type ActivityLogResponse struct {
	ID           string                 `json:"id"`
	Acao         string                 `json:"acao"`
	Descricao    string                 `json:"descricao"`
	UsuarioNome  string                 `json:"usuarioNome"`
	UsuarioEmail string                 `json:"usuarioEmail"`
	Setor        string                 `json:"setor"`
	Recurso      *string                `json:"recurso"`
	RecursoId    *string                `json:"recursoId"`
	Detalhes     map[string]string      `json:"detalhes"`
	IP           *string                `json:"ip"`
	CriadoEm     string                `json:"criadoEm"`
}

func ActivityLogFromDB(log db.ActivityLog) ActivityLogResponse {
	criadoEm := ""
	if log.CriadoEm.Valid {
		criadoEm = log.CriadoEm.Time.Format(time.RFC3339)
	}

	var recurso *string
	if log.Entidade != "" {
		recurso = &log.Entidade
	}

	var recursoId *string
	if log.EntidadeID.Valid {
		recursoId = &log.EntidadeID.String
	}

	var ip *string
	if log.IpAddress.Valid {
		ip = &log.IpAddress.String
	}

	var detalhes map[string]string
	if len(log.Detalhes) > 0 {
		var raw map[string]interface{}
		if err := json.Unmarshal(log.Detalhes, &raw); err == nil {
			detalhes = make(map[string]string, len(raw))
			for k, v := range raw {
				switch val := v.(type) {
				case string:
					detalhes[k] = val
				default:
					b, _ := json.Marshal(val)
					detalhes[k] = string(b)
				}
			}
		}
	}

	acaoNormalizada := normalizeAction(log.Acao)
	descricao := buildLogDescription(log.Acao, log.Entidade, detalhes)

	return ActivityLogResponse{
		ID:           log.ID.String(),
		Acao:         acaoNormalizada,
		Descricao:    descricao,
		UsuarioNome:  log.UsuarioNome,
		UsuarioEmail: log.UsuarioEmail,
		Setor:        "",
		Recurso:      recurso,
		RecursoId:    recursoId,
		Detalhes:     detalhes,
		IP:           ip,
		CriadoEm:     criadoEm,
	}
}

// normalizeAction mapeia as ações internas (snake_case) para as categorias
// que o frontend exibe nos badges (uppercase).
func normalizeAction(acao string) string {
	switch acao {
	// Já normalizadas
	case "LOGIN", "UPLOAD", "DELETE", "EDIT", "CREATE", "TRAMITAR", "EXPORT", "ADMIN_CHANGE", "DOWNLOAD":
		return acao

	// Documentos
	case "document_upload":
		return "UPLOAD"
	case "document_download", "batch_download":
		return "DOWNLOAD"
	case "document_edit":
		return "EDIT"
	case "document_delete":
		return "DELETE"

	// Observações
	case "observation_create":
		return "CREATE"
	case "observation_edit":
		return "EDIT"
	case "observation_delete":
		return "DELETE"

	// Protocolos internos
	case "internal_protocol_create":
		return "CREATE"
	case "internal_protocol_edit":
		return "EDIT"
	case "internal_protocol_delete":
		return "DELETE"
	case "internal_protocol_dispatch":
		return "TRAMITAR"
	case "internal_protocol_status_change":
		return "EDIT"

	// Exportações
	case "export_dashboard_pdf", "export_dashboard_excel", "dossie_export":
		return "EXPORT"

	default:
		return acao
	}
}

// buildLogDescription gera uma descrição legível a partir da ação original
// e dos detalhes do log.
func buildLogDescription(acao, entidade string, detalhes map[string]string) string {
	// Tentar extrair contexto dos detalhes
	protocolo := detalhes["protocolo"]
	filename := detalhes["filename"]
	assunto := detalhes["assunto"]

	sufixo := ""
	if protocolo != "" {
		sufixo = " — " + protocolo
	}

	switch acao {
	case "document_upload", "UPLOAD":
		if filename != "" {
			return "Documento enviado: " + filename + sufixo
		}
		return "Documento enviado" + sufixo
	case "document_download", "DOWNLOAD":
		if filename != "" {
			return "Documento baixado: " + filename + sufixo
		}
		return "Documento baixado" + sufixo
	case "batch_download":
		return "Download em lote" + sufixo
	case "document_edit", "EDIT":
		if entidade == "documento" {
			return "Documento editado" + sufixo
		}
		return "Recurso editado" + sufixo
	case "document_delete":
		if filename != "" {
			return "Documento excluído: " + filename + sufixo
		}
		return "Documento excluído" + sufixo

	case "observation_create":
		return "Observação adicionada" + sufixo
	case "observation_edit":
		return "Observação editada" + sufixo
	case "observation_delete":
		return "Observação excluída" + sufixo

	case "internal_protocol_create":
		if assunto != "" {
			return "Protocolo interno criado: " + assunto
		}
		return "Protocolo interno criado" + sufixo
	case "internal_protocol_edit":
		return "Protocolo interno editado" + sufixo
	case "internal_protocol_delete":
		return "Protocolo interno excluído" + sufixo
	case "internal_protocol_dispatch":
		destino := detalhes["to_sector"]
		if destino != "" {
			return "Protocolo tramitado para " + destino + sufixo
		}
		return "Protocolo tramitado" + sufixo
	case "internal_protocol_status_change":
		novoStatus := detalhes["new_status"]
		if novoStatus != "" {
			return "Status alterado para " + novoStatus + sufixo
		}
		return "Status do protocolo alterado" + sufixo

	case "export_dashboard_pdf":
		return "Dashboard exportado em PDF"
	case "export_dashboard_excel":
		return "Dashboard exportado em Excel"
	case "dossie_export":
		return "Dossiê exportado" + sufixo

	case "DELETE":
		return "Recurso excluído" + sufixo
	case "CREATE":
		return "Recurso criado" + sufixo
	case "TRAMITAR":
		return "Protocolo tramitado" + sufixo
	case "LOGIN":
		return "Login realizado"
	case "ADMIN_CHANGE":
		return "Alteração administrativa"
	case "EXPORT":
		return "Exportação realizada"

	default:
		return acao
	}
}

type ListLogsQuery struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size"`
	Limit    int    `form:"limit"`
	Acao     string `form:"acao"`
	Action   string `form:"action"`
	Usuario  string `form:"usuario"`
	UserID   string `form:"userId"`
	Entidade string `form:"entidade"`
	EntityType string `form:"entityType"`
	Desde    string `form:"desde"`
	Ate      string `form:"ate"`
	StartDate string `form:"startDate"`
	EndDate   string `form:"endDate"`
}

// Normalize aplica aliases de query params para manter compatibilidade.
func (q *ListLogsQuery) Normalize() {
	if q.Action != "" && q.Acao == "" {
		q.Acao = q.Action
	}
	if q.UserID != "" && q.Usuario == "" {
		q.Usuario = q.UserID
	}
	if q.EntityType != "" && q.Entidade == "" {
		q.Entidade = q.EntityType
	}
	if q.StartDate != "" && q.Desde == "" {
		q.Desde = q.StartDate
	}
	if q.EndDate != "" && q.Ate == "" {
		q.Ate = q.EndDate
	}
	if q.Limit > 0 && q.PageSize <= 0 {
		q.PageSize = q.Limit
	}
}

func (q *ListLogsQuery) Defaults() {
	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = 50
	}
	if q.PageSize > 100 {
		q.PageSize = 100
	}
}

func (q *ListLogsQuery) Offset() int {
	return (q.Page - 1) * q.PageSize
}

// --- Document Type DTOs ---

type DocumentTypeResponse struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Active      bool   `json:"active"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

func DocumentTypeFromDB(td db.TiposDocumento) DocumentTypeResponse {
	active := false
	if td.Ativo.Valid {
		active = td.Ativo.Bool
	}
	createdAt := ""
	if td.CriadoEm.Valid {
		createdAt = td.CriadoEm.Time.Format(time.RFC3339)
	}
	desc := ""
	if td.Descricao.Valid {
		desc = td.Descricao.String
	}

	return DocumentTypeResponse{
		ID:          td.ID.String(),
		Name:        td.Nome,
		Description: desc,
		Active:      active,
		CreatedAt:   createdAt,
		UpdatedAt:   createdAt,
	}
}

type CreateDocTypeRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Description string `json:"description"`
}

type UpdateDocTypeRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Description string `json:"description"`
}

// --- Helpers ---

func UUIDFromString(s string) (uuid.UUID, error) {
	return uuid.Parse(s)
}
