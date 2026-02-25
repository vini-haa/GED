package handler

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	pg   *pgxpool.Pool
	sagi *sql.DB
}

func NewHealthHandler(pg *pgxpool.Pool, sagi *sql.DB) *HealthHandler {
	return &HealthHandler{pg: pg, sagi: sagi}
}

func (h *HealthHandler) Check(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	pgStatus := "ok"
	if err := h.pg.Ping(ctx); err != nil {
		pgStatus = "error: " + err.Error()
	}

	sagiStatus := "ok"
	if h.sagi != nil {
		if err := h.sagi.PingContext(ctx); err != nil {
			sagiStatus = "error: " + err.Error()
		}
	} else {
		sagiStatus = "not_configured"
	}

	status := http.StatusOK
	if pgStatus != "ok" {
		status = http.StatusServiceUnavailable
	}

	c.JSON(status, gin.H{
		"status":    "running",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"databases": gin.H{
			"postgres": pgStatus,
			"sagi":     sagiStatus,
		},
	})
}
