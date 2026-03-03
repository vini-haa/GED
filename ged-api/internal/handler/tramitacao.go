package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/service"
)

// TramitacaoHandler lida com endpoints de tramitação de protocolos SAGI.
type TramitacaoHandler struct {
	svc *service.TramitacaoService
}

// NewTramitacaoHandler cria uma instância do TramitacaoHandler.
func NewTramitacaoHandler(svc *service.TramitacaoService) *TramitacaoHandler {
	return &TramitacaoHandler{svc: svc}
}

// GetByProtocol godoc
// GET /api/protocolos/:source/:id/tramitacao
func (h *TramitacaoHandler) GetByProtocol(c *gin.Context) {
	source := c.Param("source")
	idStr := c.Param("id")

	if source != "sagi" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "tramitação disponível apenas para protocolos SAGI"},
		})
		return
	}

	protocolID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "ID de protocolo inválido"},
		})
		return
	}

	resp, err := h.svc.GetByProtocolo(c.Request.Context(), protocolID)
	if err != nil {
		log.Error().Err(err).Int("protocol_id", protocolID).Msg("erro ao buscar tramitação")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "SERVICE_UNAVAILABLE", "message": "Erro ao buscar tramitação do SAGI"},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}
