package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/config"
	"github.com/fadex/ged-api/internal/database"
	"github.com/fadex/ged-api/internal/handler"
	"github.com/fadex/ged-api/internal/middleware"
)

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("erro ao carregar configuração")
	}

	gin.SetMode(cfg.GinMode)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// PostgreSQL (obrigatório)
	pg, err := database.ConnectPostgres(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal().Err(err).Msg("erro ao conectar PostgreSQL")
	}
	defer pg.Close()

	// SAGI SQL Server (opcional)
	sagi, err := database.ConnectSAGI(ctx, cfg.SAGIConnectionString())
	if err != nil {
		log.Warn().Err(err).Msg("SAGI (SQL Server) indisponível — continuando sem conexão")
	} else {
		defer sagi.Close()
	}

	// Router
	r := gin.New()
	r.Use(middleware.CORS(cfg.CORSOrigin))
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// Handlers
	healthHandler := handler.NewHealthHandler(pg, sagi)

	// Rotas públicas
	api := r.Group("/api")
	api.GET("/health", healthHandler.Check)

	// Shutdown graceful
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		addr := fmt.Sprintf(":%s", cfg.Port)
		log.Info().Str("port", cfg.Port).Msg("servidor iniciado")
		if err := r.Run(addr); err != nil {
			log.Fatal().Err(err).Msg("erro ao iniciar servidor")
		}
	}()

	<-quit
	log.Info().Msg("desligando servidor...")
}
