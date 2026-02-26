package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

// RequireRole retorna 403 se o role do usuário não está na lista permitida.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}

	return func(c *gin.Context) {
		role := GetUserRole(c)
		if _, ok := allowed[role]; !ok {
			log.Warn().
				Str("email", GetUserEmail(c)).
				Str("role", role).
				Str("ip", c.ClientIP()).
				Str("path", c.Request.URL.Path).
				Strs("required", roles).
				Msg("rbac: acesso negado")

			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": gin.H{
					"code":    "FORBIDDEN",
					"message": "Acesso negado para este recurso",
				},
			})
			return
		}

		c.Next()
	}
}
