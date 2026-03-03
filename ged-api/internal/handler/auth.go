package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthHandler lida com autenticação (login para desenvolvimento).
type AuthHandler struct {
	jwtSecret []byte
}

// NewAuthHandler cria uma instância do handler de autenticação.
func NewAuthHandler(jwtSecret string) *AuthHandler {
	return &AuthHandler{jwtSecret: []byte(jwtSecret)}
}

type loginRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// Login gera um JWT HS256 para o email informado.
// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Email inválido ou não fornecido"},
		})
		return
	}

	email := strings.TrimSpace(strings.ToLower(req.Email))
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Email é obrigatório"},
		})
		return
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"email": email,
		"name":  nameFromEmail(email),
		"sub":   email,
		"iat":   now.Unix(),
		"exp":   now.Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(h.jwtSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "TOKEN_ERROR", "message": "Erro ao gerar token"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      signed,
		"expires_at": now.Add(24 * time.Hour).Format(time.RFC3339),
	})
}

// nameFromEmail extrai um nome legível a partir do email.
func nameFromEmail(email string) string {
	parts := strings.SplitN(email, "@", 2)
	if len(parts) == 0 {
		return email
	}
	name := parts[0]
	name = strings.ReplaceAll(name, ".", " ")
	name = strings.ReplaceAll(name, "_", " ")
	name = strings.Title(name)
	return name
}
