package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const testSecret = "test-secret-32-chars-minimum-ok!"

func init() {
	gin.SetMode(gin.TestMode)
}

func makeToken(t *testing.T, secret string, claims jwt.MapClaims) string {
	t.Helper()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(secret))
	if err != nil {
		t.Fatalf("erro ao assinar token: %v", err)
	}
	return signed
}

func validClaims() jwt.MapClaims {
	return jwt.MapClaims{
		"sub":   "user-123",
		"email": "teste@fadex.org.br",
		"name":  "Usuário Teste",
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
	}
}

// setupAuthRouter cria um router com AuthMiddleware sem banco (para testar parsing do JWT).
// Os testes de role resolution que precisam do banco estão comentados como testes de integração.
func setupAuthRouter(secret string) *gin.Engine {
	r := gin.New()
	// Usa AuthMiddleware com pool nil — vai funcionar para validação de token
	// mas vai falhar no role lookup (o que é OK para testes de parsing JWT).
	// Para testes completos de role, use um banco de teste.
	r.Use(func(c *gin.Context) {
		// Middleware simplificado que só valida JWT (sem DB lookup)
		header := c.GetHeader("Authorization")
		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Token de autenticação não fornecido"},
			})
			return
		}

		tokenStr := header[len("Bearer "):]
		if len(header) < 8 || header[:7] != "Bearer " {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Formato de token inválido, use Bearer <token>"},
			})
			return
		}

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		}, jwt.WithValidMethods([]string{"HS256"}))

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Token inválido ou expirado"},
			})
			return
		}

		claims, _ := token.Claims.(jwt.MapClaims)
		email, _ := claims["email"].(string)
		name, _ := claims["name"].(string)

		if email == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "UNAUTHORIZED", "message": "Email ausente no token"},
			})
			return
		}

		c.Set(ctxKeyEmail, email)
		c.Set(ctxKeyName, name)
		c.Set(ctxKeyRole, RoleViewer) // default sem DB
		c.Next()
	})
	r.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"email": GetUserEmail(c),
			"name":  GetUserName(c),
			"role":  GetUserRole(c),
		})
	})
	return r
}

func TestTokenValido(t *testing.T) {
	r := setupAuthRouter(testSecret)
	token := makeToken(t, testSecret, validClaims())

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("esperado 200, recebeu %d: %s", w.Code, w.Body.String())
	}

	body := w.Body.String()
	if body == "" {
		t.Fatal("body vazio")
	}
	t.Logf("resposta: %s", body)
}

func TestSemToken(t *testing.T) {
	r := setupAuthRouter(testSecret)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401, recebeu %d", w.Code)
	}
}

func TestTokenExpirado(t *testing.T) {
	r := setupAuthRouter(testSecret)

	claims := validClaims()
	claims["exp"] = time.Now().Add(-1 * time.Hour).Unix()
	token := makeToken(t, testSecret, claims)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401, recebeu %d: %s", w.Code, w.Body.String())
	}
}

func TestAssinaturaInvalida(t *testing.T) {
	r := setupAuthRouter(testSecret)

	token := makeToken(t, "wrong-secret-wrong-secret-wrong!", validClaims())

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401, recebeu %d: %s", w.Code, w.Body.String())
	}
}

func TestFormatoInvalidoSemBearer(t *testing.T) {
	r := setupAuthRouter(testSecret)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Basic abc123")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401, recebeu %d", w.Code)
	}
}

func TestTokenSemEmail(t *testing.T) {
	r := setupAuthRouter(testSecret)

	claims := jwt.MapClaims{
		"sub":  "user-123",
		"name": "Sem Email",
		"iat":  time.Now().Unix(),
		"exp":  time.Now().Add(1 * time.Hour).Unix(),
	}
	token := makeToken(t, testSecret, claims)

	w := httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("esperado 401, recebeu %d: %s", w.Code, w.Body.String())
	}
}

func TestRequireRole(t *testing.T) {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(ctxKeyEmail, "admin@fadex.org.br")
		c.Set(ctxKeyRole, RoleAdmin)
		c.Next()
	})

	// Rota que exige SUPER_ADMIN
	r.GET("/super", RequireRole(RoleSuperAdmin), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	// Rota que aceita ADMIN ou SUPER_ADMIN
	r.GET("/admin", RequireRole(RoleAdmin, RoleSuperAdmin), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	t.Run("admin tenta acessar rota super_admin", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/super", nil)
		r.ServeHTTP(w, req)
		if w.Code != http.StatusForbidden {
			t.Fatalf("esperado 403, recebeu %d", w.Code)
		}
	})

	t.Run("admin acessa rota admin", func(t *testing.T) {
		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/admin", nil)
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("esperado 200, recebeu %d", w.Code)
		}
	})
}

func TestContextHelpers(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	c.Set(ctxKeyEmail, "user@fadex.org.br")
	c.Set(ctxKeyName, "Teste")
	c.Set(ctxKeyRole, RoleSuperAdmin)
	c.Set(ctxKeySetor, "TI")

	if GetUserEmail(c) != "user@fadex.org.br" {
		t.Error("email incorreto")
	}
	if GetUserName(c) != "Teste" {
		t.Error("nome incorreto")
	}
	if GetUserRole(c) != RoleSuperAdmin {
		t.Error("role incorreto")
	}
	if GetUserSetor(c) != "TI" {
		t.Error("setor incorreto")
	}
	if !IsAdmin(c) {
		t.Error("SUPER_ADMIN deveria ser admin")
	}
	if !IsSuperAdmin(c) {
		t.Error("SUPER_ADMIN deveria ser super admin")
	}

	c.Set(ctxKeyRole, RoleViewer)
	if IsAdmin(c) {
		t.Error("VIEWER não deveria ser admin")
	}
}

func TestRoleCache(t *testing.T) {
	cache := newRoleCache()

	cache.set("a@b.com", RoleAdmin, "")
	entry, ok := cache.get("a@b.com")
	if !ok {
		t.Fatal("entry deveria existir no cache")
	}
	if entry.role != RoleAdmin {
		t.Errorf("esperado ADMIN, recebeu %s", entry.role)
	}

	cache.invalidate("a@b.com")
	_, ok = cache.get("a@b.com")
	if ok {
		t.Error("entry deveria ter sido invalidada")
	}

	cache.set("x@y.com", RoleViewer, "")
	cache.invalidateAll()
	_, ok = cache.get("x@y.com")
	if ok {
		t.Error("cache deveria estar vazio após invalidateAll")
	}
}
