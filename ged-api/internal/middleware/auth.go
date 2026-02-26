package middleware

import (
	"errors"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
)

const roleCacheTTL = 5 * time.Minute

type cachedRole struct {
	role  string
	setor string
	at    time.Time
}

type roleCache struct {
	mu    sync.RWMutex
	items map[string]cachedRole
}

func newRoleCache() *roleCache {
	return &roleCache{items: make(map[string]cachedRole)}
}

func (rc *roleCache) get(email string) (cachedRole, bool) {
	rc.mu.RLock()
	defer rc.mu.RUnlock()
	entry, ok := rc.items[email]
	if !ok || time.Since(entry.at) > roleCacheTTL {
		return cachedRole{}, false
	}
	return entry, true
}

func (rc *roleCache) set(email, role, setor string) {
	rc.mu.Lock()
	defer rc.mu.Unlock()
	rc.items[email] = cachedRole{role: role, setor: setor, at: time.Now()}
}

func (rc *roleCache) invalidate(email string) {
	rc.mu.Lock()
	defer rc.mu.Unlock()
	delete(rc.items, email)
}

func (rc *roleCache) invalidateAll() {
	rc.mu.Lock()
	defer rc.mu.Unlock()
	rc.items = make(map[string]cachedRole)
}

// RoleCache é exposto para permitir invalidação externa (ex: ao criar/remover admin).
var RoleCache = newRoleCache()

func authError(c *gin.Context, message string) {
	log.Warn().
		Str("ip", c.ClientIP()).
		Str("path", c.Request.URL.Path).
		Str("method", c.Request.Method).
		Msg("auth: " + message)

	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"error": gin.H{
			"code":    "UNAUTHORIZED",
			"message": message,
		},
	})
}

// AuthMiddleware valida o JWT HS256, resolve o role do usuário e injeta os dados no contexto.
func AuthMiddleware(pool *pgxpool.Pool, secret string) gin.HandlerFunc {
	secretBytes := []byte(secret)
	queries := db.New(pool)

	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			authError(c, "Token de autenticação não fornecido")
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		if tokenStr == header {
			authError(c, "Formato de token inválido, use Bearer <token>")
			return
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secretBytes, nil
		}, jwt.WithValidMethods([]string{"HS256"}))

		if err != nil || !token.Valid {
			authError(c, "Token inválido ou expirado")
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			authError(c, "Claims do token inválidos")
			return
		}

		email, _ := claims["email"].(string)
		name, _ := claims["name"].(string)

		if email == "" {
			authError(c, "Email ausente no token")
			return
		}

		// Resolver role (com cache)
		role, setor := resolveRole(c, queries, email)

		c.Set(ctxKeyEmail, email)
		c.Set(ctxKeyName, name)
		c.Set(ctxKeyRole, role)
		c.Set(ctxKeySetor, setor)

		c.Next()
	}
}

// resolveRole determina o role e setor do usuário consultando o banco.
func resolveRole(c *gin.Context, queries *db.Queries, email string) (string, string) {
	if cached, ok := RoleCache.get(email); ok {
		return cached.role, cached.setor
	}

	// 1. Verificar tabela admins
	admin, err := queries.GetAdminByEmail(c.Request.Context(), email)
	if err == nil {
		RoleCache.set(email, admin.Role, "")
		return admin.Role, ""
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		log.Error().Err(err).Str("email", email).Msg("auth: erro ao consultar admins")
	}

	// 2. Verificar cache_email_setor
	cache, err := queries.GetSetorByEmail(c.Request.Context(), email)
	if err == nil {
		RoleCache.set(email, RoleUserSetor, cache.Setor)
		return RoleUserSetor, cache.Setor
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		log.Error().Err(err).Str("email", email).Msg("auth: erro ao consultar cache_email_setor")
	}

	// 3. Fallback: VIEWER
	RoleCache.set(email, RoleViewer, "")
	return RoleViewer, ""
}
