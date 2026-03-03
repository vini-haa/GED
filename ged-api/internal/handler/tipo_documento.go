package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/service"
)

type TipoDocumentoHandler struct {
	queries     *db.Queries
	activityLog *service.ActivityLogService
}

func NewTipoDocumentoHandler(queries *db.Queries, activityLog *service.ActivityLogService) *TipoDocumentoHandler {
	return &TipoDocumentoHandler{
		queries:     queries,
		activityLog: activityLog,
	}
}

// List godoc
// GET /api/tipos-documento
func (h *TipoDocumentoHandler) List(c *gin.Context) {
	// Admin vê todos (ativos + inativos), usuário normal vê só ativos
	var tipos []db.TiposDocumento
	var err error

	if middleware.IsAdmin(c) {
		tipos, err = h.queries.ListAllTiposDocumento(c.Request.Context())
	} else {
		tipos, err = h.queries.ListTiposDocumento(c.Request.Context())
	}

	if err != nil {
		log.Error().Err(err).Msg("erro ao listar tipos de documento")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao listar tipos de documento",
			},
		})
		return
	}

	items := make([]dto.DocumentTypeResponse, len(tipos))
	for i, td := range tipos {
		items[i] = dto.DocumentTypeFromDB(td)
	}

	c.JSON(http.StatusOK, items)
}

// Create godoc
// POST /api/tipos-documento
func (h *TipoDocumentoHandler) Create(c *gin.Context) {
	var req dto.CreateDocTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Dados inválidos: " + err.Error(),
			},
		})
		return
	}

	td, err := h.queries.CreateTipoDocumento(c.Request.Context(), db.CreateTipoDocumentoParams{
		Nome:      req.Name,
		Descricao: pgtype.Text{String: req.Description, Valid: req.Description != ""},
	})
	if err != nil {
		log.Error().Err(err).Str("nome", req.Name).Msg("erro ao criar tipo de documento")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao criar tipo de documento",
			},
		})
		return
	}

	h.activityLog.Log(service.ActivityLogEntry{
		Action:     "CREATE",
		EntityType: "tipo_documento",
		EntityID:   td.ID.String(),
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		Details: map[string]interface{}{
			"nome":      req.Name,
			"descricao": req.Description,
		},
	})

	c.JSON(http.StatusCreated, dto.DocumentTypeFromDB(td))
}

// Update godoc
// PATCH /api/tipos-documento/:id
func (h *TipoDocumentoHandler) Update(c *gin.Context) {
	id, err := dto.UUIDFromString(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "ID inválido",
			},
		})
		return
	}

	var req dto.UpdateDocTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Dados inválidos: " + err.Error(),
			},
		})
		return
	}

	// Verificar se existe
	_, err = h.queries.GetTipoDocumentoByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Tipo de documento não encontrado",
				},
			})
			return
		}
		log.Error().Err(err).Msg("erro ao buscar tipo de documento")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar tipo de documento",
			},
		})
		return
	}

	err = h.queries.UpdateTipoDocumento(c.Request.Context(), db.UpdateTipoDocumentoParams{
		ID:        id,
		Nome:      req.Name,
		Descricao: pgtype.Text{String: req.Description, Valid: req.Description != ""},
	})
	if err != nil {
		log.Error().Err(err).Msg("erro ao atualizar tipo de documento")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao atualizar tipo de documento",
			},
		})
		return
	}

	// Recarregar
	td, _ := h.queries.GetTipoDocumentoByID(c.Request.Context(), id)

	h.activityLog.Log(service.ActivityLogEntry{
		Action:     "EDIT",
		EntityType: "tipo_documento",
		EntityID:   id.String(),
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		Details: map[string]interface{}{
			"nome":      req.Name,
			"descricao": req.Description,
		},
	})

	c.JSON(http.StatusOK, dto.DocumentTypeFromDB(td))
}

// Toggle godoc
// PATCH /api/tipos-documento/:id/toggle
func (h *TipoDocumentoHandler) Toggle(c *gin.Context) {
	id, err := dto.UUIDFromString(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "ID inválido",
			},
		})
		return
	}

	td, err := h.queries.GetTipoDocumentoByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Tipo de documento não encontrado",
				},
			})
			return
		}
		log.Error().Err(err).Msg("erro ao buscar tipo de documento")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar tipo de documento",
			},
		})
		return
	}

	isActive := td.Ativo.Valid && td.Ativo.Bool
	if isActive {
		err = h.queries.DeactivateTipoDocumento(c.Request.Context(), id)
	} else {
		err = h.queries.ActivateTipoDocumento(c.Request.Context(), id)
	}
	if err != nil {
		log.Error().Err(err).Msg("erro ao alternar tipo de documento")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao alterar status do tipo de documento",
			},
		})
		return
	}

	// Recarregar
	td, _ = h.queries.GetTipoDocumentoByID(c.Request.Context(), id)

	h.activityLog.Log(service.ActivityLogEntry{
		Action:     "EDIT",
		EntityType: "tipo_documento",
		EntityID:   id.String(),
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		Details: map[string]interface{}{
			"acao":  "toggle_ativo",
			"nome":  td.Nome,
			"ativo": !isActive,
		},
	})

	c.JSON(http.StatusOK, dto.DocumentTypeFromDB(td))
}
