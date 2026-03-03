package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/service"
)

// ObservacaoHandler lida com endpoints de observações de protocolos.
type ObservacaoHandler struct {
	svc *service.ObservacaoService
}

// NewObservacaoHandler cria uma instância do ObservacaoHandler.
func NewObservacaoHandler(svc *service.ObservacaoService) *ObservacaoHandler {
	return &ObservacaoHandler{svc: svc}
}

// List godoc
// GET /api/protocolos/:source/:id/observacoes
func (h *ObservacaoHandler) List(c *gin.Context) {
	source := c.Param("source")
	idStr := c.Param("id")

	if source != "sagi" && source != "interno" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "source deve ser 'sagi' ou 'interno'"},
		})
		return
	}

	protocolID, _, err := h.svc.ResolveProtocolInfo(c.Request.Context(), source, idStr)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", idStr).Msg("erro ao resolver protocolo para observações")
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Protocolo não encontrado"},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	isAdmin := middleware.IsAdmin(c)

	resp, err := h.svc.List(c.Request.Context(), protocolID, source, email, isAdmin)
	if err != nil {
		log.Error().Err(err).Int("protocol_id", protocolID).Msg("erro ao listar observações")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Erro ao listar observações"},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Create godoc
// POST /api/protocolos/:source/:id/observacoes
func (h *ObservacaoHandler) Create(c *gin.Context) {
	source := c.Param("source")
	idStr := c.Param("id")

	if source != "sagi" && source != "interno" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "source deve ser 'sagi' ou 'interno'"},
		})
		return
	}

	var req dto.CreateObservacaoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "content é obrigatório (máximo 2000 caracteres)"},
		})
		return
	}

	protocolID, protocolNumber, err := h.svc.ResolveProtocolInfo(c.Request.Context(), source, idStr)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", idStr).Msg("erro ao resolver protocolo para criação de observação")
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Protocolo não encontrado"},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	item, err := h.svc.Create(c.Request.Context(), protocolID, protocolNumber, source, req, email, nome)
	if err != nil {
		log.Error().Err(err).Int("protocol_id", protocolID).Msg("erro ao criar observação")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "CREATE_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": item})
}

// Update godoc
// PATCH /api/observacoes/:id
func (h *ObservacaoHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	obsID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de observação inválido"},
		})
		return
	}

	var req dto.UpdateObservacaoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "content é obrigatório (máximo 2000 caracteres)"},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	item, err := h.svc.Update(c.Request.Context(), obsID, req, email, nome)
	if err != nil {
		log.Error().Err(err).Str("obs_id", idStr).Msg("erro ao atualizar observação")
		code := http.StatusBadRequest
		if err.Error() == "sem permissão para editar esta observação" {
			code = http.StatusForbidden
		}
		c.JSON(code, gin.H{
			"error": gin.H{"code": "UPDATE_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// ToggleImportant godoc
// PATCH /api/observacoes/:id/importante
func (h *ObservacaoHandler) ToggleImportant(c *gin.Context) {
	idStr := c.Param("id")
	obsID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de observação inválido"},
		})
		return
	}

	email := middleware.GetUserEmail(c)

	item, err := h.svc.ToggleImportant(c.Request.Context(), obsID, email)
	if err != nil {
		log.Error().Err(err).Str("obs_id", idStr).Msg("erro ao alternar importância")
		code := http.StatusBadRequest
		if err.Error() == "sem permissão para alterar esta observação" {
			code = http.StatusForbidden
		}
		c.JSON(code, gin.H{
			"error": gin.H{"code": "UPDATE_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": item})
}

// Delete godoc
// DELETE /api/observacoes/:id
func (h *ObservacaoHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	obsID, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de observação inválido"},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)
	isAdmin := middleware.IsAdmin(c)

	if err := h.svc.SoftDelete(c.Request.Context(), obsID, email, nome, isAdmin); err != nil {
		log.Error().Err(err).Str("obs_id", idStr).Msg("erro ao excluir observação")
		code := http.StatusBadRequest
		if err.Error() == "sem permissão para excluir esta observação" {
			code = http.StatusForbidden
		}
		c.JSON(code, gin.H{
			"error": gin.H{"code": "DELETE_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Observação excluída com sucesso"})
}
