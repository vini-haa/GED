package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/service"
)

type DashboardHandler struct {
	svc *service.DashboardService
}

func NewDashboardHandler(svc *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

func (h *DashboardHandler) parseQuery(c *gin.Context) dto.DashboardQuery {
	return dto.DashboardQuery{
		Periodo: c.DefaultQuery("periodo", "30d"),
		Setor:   c.DefaultQuery("setor", "all"),
		Projeto: c.DefaultQuery("projeto", "all"),
	}
}

// KPIs godoc
// GET /api/dashboard/kpis
func (h *DashboardHandler) KPIs(c *gin.Context) {
	q := h.parseQuery(c)

	kpis, err := h.svc.KPIs(c.Request.Context(), q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao calcular KPIs")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao calcular KPIs do dashboard",
			},
		})
		return
	}

	c.JSON(http.StatusOK, kpis)
}

// UploadsPeriodo godoc
// GET /api/dashboard/uploads-periodo
func (h *DashboardHandler) UploadsPeriodo(c *gin.Context) {
	q := h.parseQuery(c)

	items, err := h.svc.UploadsPorPeriodo(c.Request.Context(), q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao buscar uploads por período")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar uploads por período",
			},
		})
		return
	}

	c.JSON(http.StatusOK, items)
}

// DocsPorTipo godoc
// GET /api/dashboard/docs-por-tipo
func (h *DashboardHandler) DocsPorTipo(c *gin.Context) {
	q := h.parseQuery(c)

	items, err := h.svc.DocsPorTipo(c.Request.Context(), q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao buscar docs por tipo")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar documentos por tipo",
			},
		})
		return
	}

	c.JSON(http.StatusOK, items)
}

// TramitacaoPorSetor godoc
// GET /api/dashboard/tramitacao-por-setor
func (h *DashboardHandler) TramitacaoPorSetor(c *gin.Context) {
	q := h.parseQuery(c)

	items, err := h.svc.TramitacaoPorSetor(c.Request.Context(), q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao buscar tramitação por setor")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar tramitação por setor",
			},
		})
		return
	}

	c.JSON(http.StatusOK, items)
}

// RankingUploads godoc
// GET /api/dashboard/ranking-uploads
func (h *DashboardHandler) RankingUploads(c *gin.Context) {
	q := h.parseQuery(c)

	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	items, err := h.svc.RankingUploads(c.Request.Context(), q, limit)
	if err != nil {
		log.Error().Err(err).Msg("erro ao buscar ranking de uploads")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar ranking de uploads",
			},
		})
		return
	}

	c.JSON(http.StatusOK, items)
}

// SemDocumentos godoc
// GET /api/dashboard/sem-documentos
func (h *DashboardHandler) SemDocumentos(c *gin.Context) {
	q := h.parseQuery(c)

	page := 1
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	items, err := h.svc.ProtocolosSemDocumentos(c.Request.Context(), q, page, limit)
	if err != nil {
		log.Error().Err(err).Msg("erro ao buscar protocolos sem documentos")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar protocolos sem documentos",
			},
		})
		return
	}

	c.JSON(http.StatusOK, items)
}
