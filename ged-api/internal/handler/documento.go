package handler

import (
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/service"
)

// DocumentoHandler lida com endpoints de documentos anexados.
type DocumentoHandler struct {
	svc         *service.DocumentoService
	activitySvc *service.ActivityLogService
}

// NewDocumentoHandler cria uma instância do DocumentoHandler.
func NewDocumentoHandler(svc *service.DocumentoService, activitySvc *service.ActivityLogService) *DocumentoHandler {
	return &DocumentoHandler{svc: svc, activitySvc: activitySvc}
}

// Upload godoc
// POST /api/protocolos/:source/:id/documentos
func (h *DocumentoHandler) Upload(c *gin.Context) {
	source := c.Param("source")
	id := c.Param("id")

	if source != "sagi" && source != "interno" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "source deve ser 'sagi' ou 'interno'"},
		})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "campo 'file' é obrigatório"},
		})
		return
	}
	defer file.Close()

	var form dto.UploadDocumentoForm
	form.TipoDocumentoID = c.PostForm("tipo_documento_id")
	form.Descricao = c.PostForm("descricao")

	// Resolver protocolo_sagi (número string)
	protocoloSagi, err := h.svc.ResolveProtocoloSagi(c.Request.Context(), source, id)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", id).Msg("erro ao resolver protocolo")
		status := http.StatusNotFound
		if source == "sagi" {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Protocolo não encontrado: " + err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	item, err := h.svc.Upload(c.Request.Context(), protocoloSagi, file, header, form.TipoDocumentoID, form.Descricao, email, nome)
	if err != nil {
		log.Error().Err(err).Str("protocolo", protocoloSagi).Msg("erro no upload de documento")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "UPLOAD_ERROR", "message": err.Error()},
		})
		return
	}

	idInt, _ := strconv.Atoi(id)
	h.activitySvc.Log(service.ActivityLogEntry{
		Action:         "document_upload",
		EntityType:     "document",
		EntityID:       item.ID,
		UserEmail:      email,
		UserName:       nome,
		IPAddress:      c.ClientIP(),
		UserAgent:      c.Request.UserAgent(),
		ProtocolID:     idInt,
		ProtocolNumber: protocoloSagi,
		ProtocolSource: source,
		Details:        map[string]interface{}{"file_name": item.NomeArquivo, "size_bytes": item.TamanhoBytes},
	})

	c.JSON(http.StatusCreated, gin.H{"data": item})
}

// List godoc
// GET /api/protocolos/:source/:id/documentos
func (h *DocumentoHandler) List(c *gin.Context) {
	source := c.Param("source")
	id := c.Param("id")

	if source != "sagi" && source != "interno" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "source deve ser 'sagi' ou 'interno'"},
		})
		return
	}

	protocoloSagi, err := h.svc.ResolveProtocoloSagi(c.Request.Context(), source, id)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", id).Msg("erro ao resolver protocolo para listagem")
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Protocolo não encontrado"},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	isAdmin := middleware.IsAdmin(c)

	resp, err := h.svc.ListByProtocolo(c.Request.Context(), protocoloSagi, email, isAdmin)
	if err != nil {
		log.Error().Err(err).Str("protocolo", protocoloSagi).Msg("erro ao listar documentos")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Erro ao listar documentos"},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Download godoc
// GET /api/documentos/:id/download
func (h *DocumentoHandler) Download(c *gin.Context) {
	idStr := c.Param("id")
	docID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de documento inválido"},
		})
		return
	}

	reader, fileName, mimeType, size, err := h.svc.Download(c.Request.Context(), docID)
	if err != nil {
		log.Error().Err(err).Str("doc_id", idStr).Msg("erro no download de documento")
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": err.Error()},
		})
		return
	}
	defer reader.Close()

	c.Header("Content-Disposition", "attachment; filename=\""+fileName+"\"")
	c.Header("Content-Type", mimeType)
	if size > 0 {
		c.Header("Content-Length", strconv.FormatInt(size, 10))
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)
	h.activitySvc.Log(service.ActivityLogEntry{
		Action:     "document_download",
		EntityType: "document",
		EntityID:   idStr,
		UserEmail:  email,
		UserName:   nome,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
		Details:    map[string]interface{}{"file_name": fileName},
	})

	c.Status(http.StatusOK)
	if _, err := io.Copy(c.Writer, reader); err != nil {
		log.Error().Err(err).Str("doc_id", idStr).Msg("erro ao transmitir download")
	}
}

// Preview godoc
// GET /api/documentos/:id/preview
func (h *DocumentoHandler) Preview(c *gin.Context) {
	idStr := c.Param("id")
	docID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de documento inválido"},
		})
		return
	}

	reader, fileName, mimeType, size, err := h.svc.Download(c.Request.Context(), docID)
	if err != nil {
		log.Error().Err(err).Str("doc_id", idStr).Msg("erro no preview de documento")
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": err.Error()},
		})
		return
	}
	defer reader.Close()

	c.Header("Content-Disposition", "inline; filename=\""+fileName+"\"")
	c.Header("Content-Type", mimeType)
	if size > 0 {
		c.Header("Content-Length", strconv.FormatInt(size, 10))
	}
	c.Header("Cache-Control", "private, max-age=300")

	c.Status(http.StatusOK)
	if _, err := io.Copy(c.Writer, reader); err != nil {
		log.Error().Err(err).Str("doc_id", idStr).Msg("erro ao transmitir preview")
	}
}

// Update godoc
// PATCH /api/documentos/:id
func (h *DocumentoHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	docID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de documento inválido"},
		})
		return
	}

	var req dto.UpdateDocumentoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Dados inválidos: " + err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	isAdmin := middleware.IsAdmin(c)

	nome := middleware.GetUserName(c)

	item, err := h.svc.Update(c.Request.Context(), docID, req, email, isAdmin)
	if err != nil {
		log.Error().Err(err).Str("doc_id", idStr).Msg("erro ao atualizar documento")
		code := http.StatusBadRequest
		if err.Error() == "sem permissão para editar este documento" {
			code = http.StatusForbidden
		}
		c.JSON(code, gin.H{
			"error": gin.H{"code": "UPDATE_ERROR", "message": err.Error()},
		})
		return
	}

	h.activitySvc.Log(service.ActivityLogEntry{
		Action:     "document_edit",
		EntityType: "document",
		EntityID:   idStr,
		UserEmail:  email,
		UserName:   nome,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
	})

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// Delete godoc
// POST /api/documentos/:id/delete
func (h *DocumentoHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	docID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de documento inválido"},
		})
		return
	}

	var req dto.DeleteDocumentoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "motivo_exclusao é obrigatório (mínimo 3 caracteres)"},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	isAdmin := middleware.IsAdmin(c)

	nome := middleware.GetUserName(c)

	if err := h.svc.SoftDelete(c.Request.Context(), docID, req.MotivoExclusao, email, isAdmin); err != nil {
		log.Error().Err(err).Str("doc_id", idStr).Msg("erro ao excluir documento")
		code := http.StatusBadRequest
		if err.Error() == "sem permissão para excluir este documento" {
			code = http.StatusForbidden
		}
		c.JSON(code, gin.H{
			"error": gin.H{"code": "DELETE_ERROR", "message": err.Error()},
		})
		return
	}

	h.activitySvc.Log(service.ActivityLogEntry{
		Action:     "document_delete",
		EntityType: "document",
		EntityID:   idStr,
		UserEmail:  email,
		UserName:   nome,
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
		Details:    map[string]interface{}{"motivo": req.MotivoExclusao},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Documento excluído com sucesso"})
}
