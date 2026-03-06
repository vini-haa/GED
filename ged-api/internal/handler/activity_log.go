package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

type ActivityLogHandler struct {
	queries   *db.Queries
	setorRepo *repository.SAGISetorRepository
}

func NewActivityLogHandler(queries *db.Queries, setorRepo *repository.SAGISetorRepository) *ActivityLogHandler {
	return &ActivityLogHandler{queries: queries, setorRepo: setorRepo}
}

func (h *ActivityLogHandler) resolveSetorByEmail(c *gin.Context, email string) string {
	if h.setorRepo != nil {
		_, nome, err := h.setorRepo.GetUserSectorCode(c.Request.Context(), email)
		if err == nil {
			return nome
		}
	}
	return ""
}

// List godoc
// GET /api/admin/logs
func (h *ActivityLogHandler) List(c *gin.Context) {
	var q dto.ListLogsQuery
	if err := c.ShouldBindQuery(&q); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Parâmetros inválidos: " + err.Error(),
			},
		})
		return
	}
	q.Normalize()
	q.Defaults()

	params := db.ListActivityLogsParams{
		Limit:  int32(q.PageSize),
		Offset: int32(q.Offset()),
	}
	countParams := db.CountActivityLogsParams{}

	if q.Entidade != "" {
		params.Entidade = pgtype.Text{String: q.Entidade, Valid: true}
		countParams.Entidade = pgtype.Text{String: q.Entidade, Valid: true}
	}
	if q.Usuario != "" {
		params.UsuarioEmail = pgtype.Text{String: q.Usuario, Valid: true}
		countParams.UsuarioEmail = pgtype.Text{String: q.Usuario, Valid: true}
	}
	if q.Acao != "" {
		params.Acao = pgtype.Text{String: q.Acao, Valid: true}
		countParams.Acao = pgtype.Text{String: q.Acao, Valid: true}
	}
	if q.Desde != "" {
		if t, err := time.Parse("2006-01-02", q.Desde); err == nil {
			ts := pgtype.Timestamp{Time: t, Valid: true}
			params.Desde = ts
			countParams.Desde = ts
		}
	}
	if q.Ate != "" {
		if t, err := time.Parse("2006-01-02", q.Ate); err == nil {
			// Fim do dia
			t = t.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			ts := pgtype.Timestamp{Time: t, Valid: true}
			params.Ate = ts
			countParams.Ate = ts
		}
	}

	logs, err := h.queries.ListActivityLogs(c.Request.Context(), params)
	if err != nil {
		log.Error().Err(err).Msg("erro ao listar activity logs")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao listar logs de atividade",
			},
		})
		return
	}

	total, _ := h.queries.CountActivityLogs(c.Request.Context(), countParams)

	// Cache de email→setor para evitar queries repetidas ao SAGI
	setorCache := make(map[string]string)
	items := make([]dto.ActivityLogResponse, len(logs))
	for i, l := range logs {
		item := dto.ActivityLogFromDB(l)
		if setor, ok := setorCache[l.UsuarioEmail]; ok {
			item.Setor = setor
		} else {
			setor = h.resolveSetorByEmail(c, l.UsuarioEmail)
			setorCache[l.UsuarioEmail] = setor
			item.Setor = setor
		}
		items[i] = item
	}

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"pagination": dto.Pagination{
			Page:       q.Page,
			PageSize:   q.PageSize,
			Total:      total,
			TotalPages: dto.CalcTotalPages(total, q.PageSize),
		},
	})
}

// GetByID godoc
// GET /api/admin/logs/:id
func (h *ActivityLogHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")

	id, err := dto.UUIDFromString(idStr)
	if err != nil {
		// Tentar como int (caso venha como número)
		if _, parseErr := strconv.Atoi(idStr); parseErr == nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "ID deve ser um UUID válido",
				},
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "ID inválido",
			},
		})
		return
	}

	actLog, err := h.queries.GetActivityLogByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Log não encontrado",
				},
			})
			return
		}
		log.Error().Err(err).Msg("erro ao buscar activity log")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar log de atividade",
			},
		})
		return
	}

	c.JSON(http.StatusOK, dto.ActivityLogFromDB(actLog))
}
