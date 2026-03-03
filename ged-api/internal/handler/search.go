package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/service"
)

type SearchHandler struct {
	svc *service.SearchService
}

func NewSearchHandler(svc *service.SearchService) *SearchHandler {
	return &SearchHandler{svc: svc}
}

// Search godoc
// GET /api/search
func (h *SearchHandler) Search(c *gin.Context) {
	var q dto.SearchQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Parâmetro 'q' é obrigatório (mínimo 3 caracteres)",
			},
		})
		return
	}

	if len(q.Q) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Parâmetro 'q' deve ter no mínimo 3 caracteres",
			},
		})
		return
	}

	resp, err := h.svc.Search(c.Request.Context(), q)
	if err != nil {
		log.Error().Err(err).Str("q", q.Q).Msg("erro na busca global")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao realizar busca",
			},
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}
