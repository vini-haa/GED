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
	"github.com/fadex/ged-api/internal/repository"
	"github.com/fadex/ged-api/internal/service"
)

const protectedAdminEmail = "suporteti@fadex.org.br"

type AdminHandler struct {
	queries     *db.Queries
	setorRepo   *repository.SAGISetorRepository
	activityLog *service.ActivityLogService
}

func NewAdminHandler(queries *db.Queries, setorRepo *repository.SAGISetorRepository, activityLog *service.ActivityLogService) *AdminHandler {
	return &AdminHandler{
		queries:     queries,
		setorRepo:   setorRepo,
		activityLog: activityLog,
	}
}

func (h *AdminHandler) resolveSetor(c *gin.Context, email string) string {
	if h.setorRepo != nil {
		_, nome, err := h.setorRepo.GetUserSectorCode(c.Request.Context(), email)
		if err == nil {
			return nome
		}
	}
	return ""
}

// List godoc
// GET /api/admin/admins
func (h *AdminHandler) List(c *gin.Context) {
	admins, err := h.queries.ListAdmins(c.Request.Context(), db.ListAdminsParams{
		Limit:  1000,
		Offset: 0,
	})
	if err != nil {
		log.Error().Err(err).Msg("erro ao listar admins")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao listar administradores",
			},
		})
		return
	}

	items := make([]dto.AdminResponse, len(admins))
	for i, a := range admins {
		items[i] = dto.AdminFromDB(a, h.resolveSetor(c, a.Email))
	}

	c.JSON(http.StatusOK, items)
}

// Create godoc
// POST /api/admin/admins
func (h *AdminHandler) Create(c *gin.Context) {
	var req dto.CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Dados inválidos: " + err.Error(),
			},
		})
		return
	}

	// Verificar se email já existe (incluindo inativos)
	existing, err := h.queries.GetAdminByEmailAny(c.Request.Context(), req.Email)
	if err == nil {
		// Já existe — se estiver inativo, reativar
		isActive := existing.Ativo.Valid && existing.Ativo.Bool
		if isActive {
			c.JSON(http.StatusConflict, gin.H{
				"error": gin.H{
					"code":    "CONFLICT",
					"message": "E-mail já cadastrado como administrador",
				},
			})
			return
		}
		// Reativar admin existente
		if err := h.queries.ActivateAdmin(c.Request.Context(), existing.ID); err != nil {
			log.Error().Err(err).Msg("erro ao reativar admin")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{
					"code":    "INTERNAL_ERROR",
					"message": "Erro ao reativar administrador",
				},
			})
			return
		}
		reactivated, _ := h.queries.GetAdminByID(c.Request.Context(), existing.ID)

		h.activityLog.Log(service.ActivityLogEntry{
			Action:     "ADMIN_CHANGE",
			EntityType: "admin",
			EntityID:   reactivated.ID.String(),
			UserEmail:  middleware.GetUserEmail(c),
			UserName:   middleware.GetUserName(c),
			IPAddress:  c.ClientIP(),
			Details: map[string]interface{}{
				"acao":  "reativar_admin",
				"email": req.Email,
			},
		})

		c.JSON(http.StatusCreated, dto.AdminFromDB(reactivated, h.resolveSetor(c, reactivated.Email)))
		return
	}

	creatorEmail := middleware.GetUserEmail(c)

	admin, err := h.queries.CreateAdmin(c.Request.Context(), db.CreateAdminParams{
		Email:     req.Email,
		Nome:      req.Nome,
		Role:      "ADMIN",
		CriadoPor: pgtype.Text{String: creatorEmail, Valid: true},
	})
	if err != nil {
		log.Error().Err(err).Str("email", req.Email).Msg("erro ao criar admin")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao criar administrador",
			},
		})
		return
	}

	h.activityLog.Log(service.ActivityLogEntry{
		Action:     "ADMIN_CHANGE",
		EntityType: "admin",
		EntityID:   admin.ID.String(),
		UserEmail:  creatorEmail,
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		Details: map[string]interface{}{
			"acao":  "criar_admin",
			"email": req.Email,
			"nome":  req.Nome,
		},
	})

	c.JSON(http.StatusCreated, dto.AdminFromDB(admin, req.Setor))
}

// Update godoc
// PATCH /api/admin/admins/:id — alterar role e/ou ativar/desativar
func (h *AdminHandler) Update(c *gin.Context) {
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

	admin, err := h.queries.GetAdminByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Administrador não encontrado",
				},
			})
			return
		}
		log.Error().Err(err).Msg("erro ao buscar admin")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar administrador",
			},
		})
		return
	}

	// Proteção: suporteti@fadex.org.br não pode ser rebaixado nem desativado
	if admin.Email == protectedAdminEmail {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "PROTECTED_ADMIN",
				"message": "Este administrador não pode ser alterado",
			},
		})
		return
	}

	var req dto.UpdateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": "Dados inválidos: " + err.Error(),
			},
		})
		return
	}

	details := map[string]interface{}{
		"email": admin.Email,
	}

	// Atualizar role se fornecido
	if req.Role != nil {
		role := *req.Role
		if role != "ADMIN" && role != "SUPER_ADMIN" && role != "admin" && role != "super_admin" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": gin.H{
					"code":    "VALIDATION_ERROR",
					"message": "Role deve ser 'admin' ou 'super_admin'",
				},
			})
			return
		}
		// Normalizar para uppercase (banco armazena ADMIN/SUPER_ADMIN)
		dbRole := "ADMIN"
		if role == "super_admin" || role == "SUPER_ADMIN" {
			dbRole = "SUPER_ADMIN"
		}
		if err := h.queries.UpdateAdminRole(c.Request.Context(), db.UpdateAdminRoleParams{
			ID:   id,
			Role: dbRole,
		}); err != nil {
			log.Error().Err(err).Msg("erro ao atualizar role do admin")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{
					"code":    "INTERNAL_ERROR",
					"message": "Erro ao atualizar role do administrador",
				},
			})
			return
		}
		details["role_anterior"] = admin.Role
		details["role_novo"] = dbRole
	}

	// Atualizar ativo se fornecido
	if req.Ativo != nil {
		if *req.Ativo {
			err = h.queries.ActivateAdmin(c.Request.Context(), id)
		} else {
			err = h.queries.DeactivateAdmin(c.Request.Context(), id)
		}
		if err != nil {
			log.Error().Err(err).Msg("erro ao alterar status do admin")
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{
					"code":    "INTERNAL_ERROR",
					"message": "Erro ao alterar status do administrador",
				},
			})
			return
		}
		details["ativo"] = *req.Ativo
	}

	h.activityLog.Log(service.ActivityLogEntry{
		Action:     "ADMIN_CHANGE",
		EntityType: "admin",
		EntityID:   admin.ID.String(),
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		Details:    details,
	})

	// Recarregar para retornar estado atualizado
	admin, _ = h.queries.GetAdminByID(c.Request.Context(), id)
	c.JSON(http.StatusOK, dto.AdminFromDB(admin, h.resolveSetor(c, admin.Email)))
}

// Toggle godoc
// PATCH /api/admin/admins/:id/toggle
func (h *AdminHandler) Toggle(c *gin.Context) {
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

	admin, err := h.queries.GetAdminByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Administrador não encontrado",
				},
			})
			return
		}
		log.Error().Err(err).Msg("erro ao buscar admin")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar administrador",
			},
		})
		return
	}

	// Proteção: suporteti@fadex.org.br não pode ser desativado
	if admin.Email == protectedAdminEmail {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "PROTECTED_ADMIN",
				"message": "Este administrador não pode ser desativado",
			},
		})
		return
	}

	isActive := admin.Ativo.Valid && admin.Ativo.Bool
	if isActive {
		err = h.queries.DeactivateAdmin(c.Request.Context(), id)
	} else {
		err = h.queries.ActivateAdmin(c.Request.Context(), id)
	}
	if err != nil {
		log.Error().Err(err).Msg("erro ao alternar status do admin")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao alterar status do administrador",
			},
		})
		return
	}

	admin, _ = h.queries.GetAdminByID(c.Request.Context(), id)

	h.activityLog.Log(service.ActivityLogEntry{
		Action:     "ADMIN_CHANGE",
		EntityType: "admin",
		EntityID:   admin.ID.String(),
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		Details: map[string]interface{}{
			"acao":  "toggle_admin",
			"email": admin.Email,
			"ativo": !isActive,
		},
	})

	c.JSON(http.StatusOK, dto.AdminFromDB(admin, h.resolveSetor(c, admin.Email)))
}

// Delete godoc
// DELETE /api/admin/admins/:id
func (h *AdminHandler) Delete(c *gin.Context) {
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

	admin, err := h.queries.GetAdminByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{
				"error": gin.H{
					"code":    "NOT_FOUND",
					"message": "Administrador não encontrado",
				},
			})
			return
		}
		log.Error().Err(err).Msg("erro ao buscar admin para exclusão")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao buscar administrador",
			},
		})
		return
	}

	// Proteção: suporteti@fadex.org.br não pode ser removido
	if admin.Email == protectedAdminEmail {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "PROTECTED_ADMIN",
				"message": "Este administrador não pode ser removido",
			},
		})
		return
	}

	// Não permitir deletar a si mesmo
	if admin.Email == middleware.GetUserEmail(c) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"code":    "SELF_DELETE",
				"message": "Não é possível remover a si mesmo",
			},
		})
		return
	}

	if err := h.queries.DeactivateAdmin(c.Request.Context(), id); err != nil {
		log.Error().Err(err).Msg("erro ao desativar admin")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Erro ao remover administrador",
			},
		})
		return
	}

	h.activityLog.Log(service.ActivityLogEntry{
		Action:     "ADMIN_CHANGE",
		EntityType: "admin",
		EntityID:   admin.ID.String(),
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		Details: map[string]interface{}{
			"acao":  "remover_admin",
			"email": admin.Email,
			"nome":  admin.Nome,
		},
	})

	c.Status(http.StatusNoContent)
}
