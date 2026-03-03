package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/service"
)

// DownloadHandler lida com endpoints de download em lote e dossiê.
type DownloadHandler struct {
	svc *service.DownloadService
}

// NewDownloadHandler cria uma instância do DownloadHandler.
func NewDownloadHandler(svc *service.DownloadService) *DownloadHandler {
	return &DownloadHandler{svc: svc}
}

func validateSourceParam(c *gin.Context) (string, string, bool) {
	source := c.Param("source")
	id := c.Param("id")
	if source != "sagi" && source != "interno" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "source deve ser 'sagi' ou 'interno'"},
		})
		return "", "", false
	}
	return source, id, true
}

// DownloadZip godoc
// POST /api/protocolos/:source/:id/documentos/download-zip
func (h *DownloadHandler) DownloadZip(c *gin.Context) {
	source, id, ok := validateSourceParam(c)
	if !ok {
		return
	}

	// Validar antes de enviar headers de streaming
	protocoloSagi, err := h.svc.ValidateDownloadZip(c.Request.Context(), source, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "DOWNLOAD_ERROR", "message": err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	fileName := sanitizeZipName(protocoloSagi) + "_documentos.zip"
	c.Writer.Header().Set("Content-Type", "application/zip")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Writer.WriteHeader(http.StatusOK)

	_, _, err = h.svc.DownloadZip(
		c.Request.Context(), source, id, c.Writer,
		email, nome, c.ClientIP(), c.Request.UserAgent(),
	)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", id).Msg("erro no download ZIP em lote")
	}
}

// DownloadSelected godoc
// POST /api/protocolos/:source/:id/documentos/download-selected
func (h *DownloadHandler) DownloadSelected(c *gin.Context) {
	source, id, ok := validateSourceParam(c)
	if !ok {
		return
	}

	var req struct {
		DocumentoIDs []string `json:"documento_ids" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "documento_ids é obrigatório (array de UUIDs)"},
		})
		return
	}

	// Validar antes de enviar headers de streaming
	protocoloSagi, err := h.svc.ValidateDownloadSelected(c.Request.Context(), source, id, req.DocumentoIDs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "DOWNLOAD_ERROR", "message": err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	fileName := sanitizeZipName(protocoloSagi) + "_selecionados.zip"
	c.Writer.Header().Set("Content-Type", "application/zip")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Writer.WriteHeader(http.StatusOK)

	_, _, err = h.svc.DownloadSelected(
		c.Request.Context(), source, id, req.DocumentoIDs, c.Writer,
		email, nome, c.ClientIP(), c.Request.UserAgent(),
	)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", id).Msg("erro no download selecionado")
	}
}

// ExportDossie godoc
// POST /api/protocolos/:source/:id/dossie/export
func (h *DownloadHandler) ExportDossie(c *gin.Context) {
	source, id, ok := validateSourceParam(c)
	if !ok {
		return
	}

	// Validar antes de enviar headers de streaming
	protocoloSagi, err := h.svc.ValidateDossie(c.Request.Context(), source, id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "DOSSIE_ERROR", "message": err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	fileName := "dossie_" + sanitizeZipName(protocoloSagi) + ".zip"
	c.Writer.Header().Set("Content-Type", "application/zip")
	c.Writer.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Writer.WriteHeader(http.StatusOK)

	_, err = h.svc.GenerateDossie(
		c.Request.Context(), source, id, c.Writer,
		email, nome, c.ClientIP(), c.Request.UserAgent(),
	)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", id).Msg("erro ao gerar dossiê")
	}
}

// sanitizeZipName remove caracteres problemáticos para nomes de arquivo ZIP.
func sanitizeZipName(s string) string {
	replacer := strings.NewReplacer(
		"/", "_", "\\", "_", ":", "_", "*", "_",
		"?", "_", "\"", "_", "<", "_", ">", "_",
		"|", "_", " ", "_",
	)
	return replacer.Replace(s)
}
