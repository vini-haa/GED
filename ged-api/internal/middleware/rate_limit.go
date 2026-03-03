package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

type rateLimitEntry struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

// RateLimit retorna um middleware Gin que aplica rate limiting por email do usuário.
// ratePerMin = taxa sustentada por minuto, burst = pico permitido.
func RateLimit(ratePerMin int, burst int) gin.HandlerFunc {
	var mu sync.Mutex
	entries := make(map[string]*rateLimitEntry)

	// Goroutine para limpar entradas inativas a cada 5 minutos
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			mu.Lock()
			for email, entry := range entries {
				if time.Since(entry.lastSeen) > 10*time.Minute {
					delete(entries, email)
				}
			}
			mu.Unlock()
		}
	}()

	r := rate.Limit(float64(ratePerMin) / 60.0) // converte de por-minuto para por-segundo

	return func(c *gin.Context) {
		email := GetUserEmail(c)
		if email == "" {
			c.Next()
			return
		}

		mu.Lock()
		entry, exists := entries[email]
		if !exists {
			entry = &rateLimitEntry{
				limiter: rate.NewLimiter(r, burst),
			}
			entries[email] = entry
		}
		entry.lastSeen = time.Now()
		mu.Unlock()

		if !entry.limiter.Allow() {
			resetTime := time.Now().Add(time.Minute).Unix()

			c.Header("X-RateLimit-Limit", strconv.Itoa(ratePerMin))
			c.Header("X-RateLimit-Remaining", "0")
			c.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime, 10))

			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{
					"code":    "RATE_LIMIT_EXCEEDED",
					"message": "Limite de requisições excedido. Tente novamente em alguns segundos.",
				},
			})
			return
		}

		// Adicionar headers informativos
		remaining := int(entry.limiter.Tokens())
		c.Header("X-RateLimit-Limit", strconv.Itoa(ratePerMin))
		c.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))

		c.Next()
	}
}
