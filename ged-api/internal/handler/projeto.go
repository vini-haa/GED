package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/repository"
)

// ProjetoHandler lida com endpoints de projetos do SAGI.
type ProjetoHandler struct {
	repo *repository.SAGIProjetoRepository
}

// NewProjetoHandler cria uma instância do handler.
func NewProjetoHandler(repo *repository.SAGIProjetoRepository) *ProjetoHandler {
	return &ProjetoHandler{repo: repo}
}

// Search godoc
// GET /api/projetos?search=termo
func (h *ProjetoHandler) Search(c *gin.Context) {
	if h.repo == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "SAGI_UNAVAILABLE", "message": "Banco SAGI indisponível"},
		})
		return
	}

	search := c.Query("search")

	projetos, err := h.repo.SearchProjetos(c.Request.Context(), search)
	if err != nil {
		log.Error().Err(err).Msg("erro ao buscar projetos")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Erro ao buscar projetos"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": projetos})
}
