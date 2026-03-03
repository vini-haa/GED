package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/service"
)

// ProtocoloInternoHandler lida com endpoints de protocolos internos do GED.
type ProtocoloInternoHandler struct {
	svc *service.InternalProtocolService
}

// NewProtocoloInternoHandler cria uma instância do handler.
func NewProtocoloInternoHandler(svc *service.InternalProtocolService) *ProtocoloInternoHandler {
	return &ProtocoloInternoHandler{svc: svc}
}

// List godoc
// GET /api/protocolos-internos
func (h *ProtocoloInternoHandler) List(c *gin.Context) {
	var q dto.ListInternalProtocolsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Parâmetros inválidos: " + err.Error()},
		})
		return
	}

	resp, err := h.svc.List(c.Request.Context(), q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao listar protocolos internos")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Erro ao listar protocolos internos"},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Create godoc
// POST /api/protocolos-internos
func (h *ProtocoloInternoHandler) Create(c *gin.Context) {
	var req dto.CreateInternalProtocolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Dados inválidos: " + err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)
	setor := middleware.GetUserSetor(c)

	detail, err := h.svc.Create(c.Request.Context(), req, email, nome, setor)
	if err != nil {
		log.Error().Err(err).Msg("erro ao criar protocolo interno")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "CREATE_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": detail})
}

// GetByID godoc
// GET /api/protocolos-internos/:id
func (h *ProtocoloInternoHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID inválido"},
		})
		return
	}

	detail, err := h.svc.GetByID(c.Request.Context(), int32(id))
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("erro ao buscar protocolo interno")
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Protocolo interno não encontrado"},
		})
		return
	}

	// Registrar acesso recente (fire-and-forget)
	email := middleware.GetUserEmail(c)
	h.svc.TrackRecentView(c.Request.Context(), email, int32(id))

	c.JSON(http.StatusOK, gin.H{"data": detail})
}

// Update godoc
// PATCH /api/protocolos-internos/:id
func (h *ProtocoloInternoHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID inválido"},
		})
		return
	}

	var req dto.UpdateInternalProtocolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Dados inválidos: " + err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	detail, err := h.svc.Update(c.Request.Context(), int32(id), req, email, nome)
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("erro ao atualizar protocolo interno")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "UPDATE_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": detail})
}

// ChangeStatus godoc
// PATCH /api/protocolos-internos/:id/status
func (h *ProtocoloInternoHandler) ChangeStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID inválido"},
		})
		return
	}

	var req dto.ChangeStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Dados inválidos: " + err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)
	role := middleware.GetUserRole(c)
	setor := middleware.GetUserSetor(c)

	detail, err := h.svc.ChangeStatus(c.Request.Context(), int32(id), req, email, nome, role, setor)
	if err != nil {
		log.Error().Err(err).Int("id", id).Str("status", req.Status).Msg("erro ao alterar status")
		code := http.StatusBadRequest
		errMsg := err.Error()
		if errMsg == "apenas administradores podem realizar esta operação" || errMsg == "apenas usuários do setor atual podem realizar esta operação" {
			code = http.StatusForbidden
		}
		c.JSON(code, gin.H{
			"error": gin.H{"code": "STATUS_ERROR", "message": errMsg},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": detail})
}

// Dispatch godoc
// POST /api/protocolos-internos/:id/tramitar
func (h *ProtocoloInternoHandler) Dispatch(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID inválido"},
		})
		return
	}

	var req dto.DispatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Dados inválidos: " + err.Error()},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)
	role := middleware.GetUserRole(c)
	setor := middleware.GetUserSetor(c)

	movement, err := h.svc.Dispatch(c.Request.Context(), int32(id), req, email, nome, role, setor)
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("erro ao tramitar protocolo interno")
		code := http.StatusBadRequest
		errMsg := err.Error()
		if errMsg == "apenas usuários do setor atual ou administradores podem tramitar" {
			code = http.StatusForbidden
		}
		c.JSON(code, gin.H{
			"error": gin.H{"code": "DISPATCH_ERROR", "message": errMsg},
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": movement})
}

// History godoc
// GET /api/protocolos-internos/:id/tramitacao
func (h *ProtocoloInternoHandler) History(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID inválido"},
		})
		return
	}

	resp, err := h.svc.History(c.Request.Context(), int32(id))
	if err != nil {
		log.Error().Err(err).Int("id", id).Msg("erro ao buscar histórico de tramitação interna")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Erro ao buscar histórico de tramitação"},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Delete godoc
// DELETE /api/protocolos-internos/:id
func (h *ProtocoloInternoHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID inválido"},
		})
		return
	}

	var req dto.DeleteInternalProtocolRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Motivo da exclusão é obrigatório (mínimo 10 caracteres)"},
		})
		return
	}

	email := middleware.GetUserEmail(c)
	nome := middleware.GetUserName(c)

	if err := h.svc.SoftDelete(c.Request.Context(), int32(id), req.Reason, email, nome); err != nil {
		log.Error().Err(err).Int("id", id).Msg("erro ao excluir protocolo interno")
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "DELETE_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Protocolo excluído com sucesso"})
}

// ListSetores godoc
// GET /api/setores
func (h *ProtocoloInternoHandler) ListSetores(c *gin.Context) {
	setores, err := h.svc.ListSetores(c.Request.Context())
	if err != nil {
		log.Error().Err(err).Msg("erro ao listar setores")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "SERVICE_UNAVAILABLE", "message": "Não foi possível listar setores. O SAGI pode estar indisponível."},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": setores})
}
