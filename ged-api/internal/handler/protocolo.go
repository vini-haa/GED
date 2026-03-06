package handler

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/service"
)

type ProtocoloHandler struct {
	svc *service.ProtocoloService
}

func NewProtocoloHandler(svc *service.ProtocoloService) *ProtocoloHandler {
	return &ProtocoloHandler{svc: svc}
}

// List godoc
// GET /api/protocolos
func (h *ProtocoloHandler) List(c *gin.Context) {
	var q dto.ListProtocolosQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Parâmetros inválidos: " + err.Error(),
			},
		})
		return
	}

	// Se tab=meu_setor e setor não informado, usar setor do contexto
	if q.Tab == "meu_setor" && q.Setor == nil {
		setorStr := middleware.GetUserSetor(c)
		if setorStr != "" {
			setor, err := strconv.Atoi(setorStr)
			if err == nil {
				q.Setor = &setor
			}
		}
	}

	resp, err := h.svc.List(c.Request.Context(), q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao listar protocolos")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "SERVICE_UNAVAILABLE",
				"message": "Não foi possível listar protocolos. O SAGI pode estar indisponível.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Counters godoc
// GET /api/protocolos/contadores
func (h *ProtocoloHandler) Counters(c *gin.Context) {
	setorStr := c.Query("setor")
	if setorStr == "" {
		// Tentar do contexto
		setorStr = middleware.GetUserSetor(c)
	}

	var setor int
	if setorStr != "" {
		var err error
		setor, err = strconv.Atoi(setorStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Parâmetro 'setor' deve ser um número inteiro",
				},
			})
			return
		}
	}

	// setor=0 significa global (para admins sem setor vinculado)
	resp, err := h.svc.Counters(c.Request.Context(), setor)
	if err != nil {
		log.Error().Err(err).Int("setor", setor).Msg("erro ao obter contadores")
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{
				"code":    "SERVICE_UNAVAILABLE",
				"message": "Não foi possível obter contadores. O SAGI pode estar indisponível.",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// GetByID godoc
// GET /api/protocolos/:source/:id
func (h *ProtocoloHandler) GetByID(c *gin.Context) {
	source := c.Param("source")
	id := c.Param("id")

	if source != "sagi" && source != "interno" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "source deve ser 'sagi' ou 'interno'",
			},
		})
		return
	}

	resp, err := h.svc.GetByID(c.Request.Context(), source, id)
	if err != nil {
		log.Error().Err(err).Str("source", source).Str("id", id).Msg("erro ao buscar detalhe do protocolo")
		status := http.StatusNotFound
		if source == "sagi" {
			status = http.StatusServiceUnavailable
		}
		c.JSON(status, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": err.Error(),
			},
		})
		return
	}

	// Registrar acesso recente (fire-and-forget)
	email := middleware.GetUserEmail(c)
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if trackErr := h.svc.TrackRecentView(ctx, email, id, source); trackErr != nil {
			log.Error().Err(trackErr).Str("email", email).Msg("erro ao registrar acesso recente")
		}
	}()

	c.JSON(http.StatusOK, gin.H{"data": resp})
}

// Recent godoc
// GET /api/user/recentes
func (h *ProtocoloHandler) Recent(c *gin.Context) {
	var q dto.RecentQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Parâmetros inválidos: " + err.Error(),
			},
		})
		return
	}
	q.Defaults()

	email := middleware.GetUserEmail(c)
	resp, err := h.svc.Recent(c.Request.Context(), email, q.Limit)
	if err != nil {
		log.Error().Err(err).Str("email", email).Msg("erro ao listar protocolos recentes")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao listar protocolos recentes",
			},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}
