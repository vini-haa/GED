package main

import (
	"context"
	"flag"
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
	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/handler"
	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/repository"
	"github.com/fadex/ged-api/internal/service"
)

func main() {
	runMigrations := flag.Bool("migrate", false, "Executar migrations antes de iniciar o servidor")
	flag.Parse()

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339})

	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("erro ao carregar configuração")
	}

	if cfg.NextAuthSecret == "" {
		log.Fatal().Msg("NEXTAUTH_SECRET é obrigatória")
	}

	gin.SetMode(cfg.GinMode)

	// Migrations (opcional via --migrate)
	if *runMigrations {
		if err := database.RunMigrations(cfg.DatabaseURL, "migrations"); err != nil {
			log.Fatal().Err(err).Msg("erro ao executar migrations")
		}
	}

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

	// Dependências
	queries := db.New(pg)

	var sagiProtocoloRepo *repository.SAGIProtocoloRepository
	if sagi != nil {
		sagiProtocoloRepo = repository.NewSAGIProtocoloRepository(sagi)
	}

	protocoloService := service.NewProtocoloService(sagiProtocoloRepo, queries)
	searchService := service.NewSearchService(sagiProtocoloRepo, queries)

	// Google Drive (opcional)
	var driveSvc *service.DriveService
	if cfg.GoogleDriveRootFolder != "" {
		driveSvc, err = service.NewDriveService(cfg.GoogleCredentialsFile, cfg.GoogleDriveRootFolder, cfg.GoogleSharedDriveID)
		if err != nil {
			log.Warn().Err(err).Msg("Google Drive indisponível — uploads desabilitados")
			driveSvc = nil
		}
	}

	documentoService := service.NewDocumentoService(queries, driveSvc, sagiProtocoloRepo, cfg.MaxFileSizeMB)

	// Activity Log
	activityLogService := service.NewActivityLogService(queries)

	// Observações
	observacaoService := service.NewObservacaoService(queries, sagiProtocoloRepo, activityLogService)

	// Tramitação SAGI
	var sagiTramitacaoRepo *repository.SAGITramitacaoRepository
	if sagi != nil {
		sagiTramitacaoRepo = repository.NewSAGITramitacaoRepository(sagi)
	}
	tramitacaoService := service.NewTramitacaoService(sagiTramitacaoRepo)

	// Setores SAGI (com cache)
	var setorRepo *repository.SAGISetorRepository
	if sagi != nil {
		setorRepo = repository.NewSAGISetorRepository(sagi)
	}

	// Projetos SAGI (com cache)
	var projetoRepo *repository.SAGIProjetoRepository
	if sagi != nil {
		projetoRepo = repository.NewSAGIProjetoRepository(sagi)
	}

	// Protocolos Internos
	internalProtocolService := service.NewInternalProtocolService(pg, queries, setorRepo, activityLogService)

	// Dashboard
	dashboardService := service.NewDashboardService(queries, sagi, setorRepo)

	// Download em Lote e Dossiê
	downloadService := service.NewDownloadService(queries, driveSvc, documentoService, protocoloService, observacaoService, tramitacaoService, internalProtocolService, activityLogService)

	// Router
	r := gin.New()
	r.Use(middleware.CORS(cfg.CORSOrigin))
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// Handlers
	healthHandler := handler.NewHealthHandler(pg, sagi)
	meHandler := handler.NewMeHandler()
	protocoloHandler := handler.NewProtocoloHandler(protocoloService)
	searchHandler := handler.NewSearchHandler(searchService)
	documentoHandler := handler.NewDocumentoHandler(documentoService, activityLogService)
	observacaoHandler := handler.NewObservacaoHandler(observacaoService)
	tramitacaoHandler := handler.NewTramitacaoHandler(tramitacaoService)
	intProtoHandler := handler.NewProtocoloInternoHandler(internalProtocolService)

	projetoHandler := handler.NewProjetoHandler(projetoRepo)
	dashboardHandler := handler.NewDashboardHandler(dashboardService)
	dashboardExportHandler := handler.NewDashboardExportHandler(dashboardService, activityLogService)
	downloadHandler := handler.NewDownloadHandler(downloadService)

	// Admin handlers
	adminHandler := handler.NewAdminHandler(queries, setorRepo, activityLogService)
	tipoDocHandler := handler.NewTipoDocumentoHandler(queries, activityLogService)
	activityLogHandler := handler.NewActivityLogHandler(queries, setorRepo)

	// Handlers de autenticação
	authHandler := handler.NewAuthHandler(cfg.NextAuthSecret)

	// Rotas públicas
	api := r.Group("/api")
	api.GET("/health", healthHandler.Check)
	api.POST("/auth/login", authHandler.Login)

	// Rotas autenticadas
	auth := api.Group("")
	auth.Use(middleware.AuthMiddleware(pg, cfg.NextAuthSecret))
	auth.Use(middleware.RateLimit(60, 10)) // 60 req/min, burst 10
	auth.GET("/me", meHandler.Me)
	auth.GET("/protocolos", protocoloHandler.List)
	auth.GET("/protocolos/contadores", protocoloHandler.Counters)
	auth.GET("/search", searchHandler.Search)
	auth.GET("/user/recentes", protocoloHandler.Recent)

	// Setores
	auth.GET("/setores", intProtoHandler.ListSetores)

	// Projetos SAGI
	auth.GET("/projetos", projetoHandler.Search)

	// Dashboard
	auth.GET("/dashboard/kpis", dashboardHandler.KPIs)
	auth.GET("/dashboard/uploads-periodo", dashboardHandler.UploadsPeriodo)
	auth.GET("/dashboard/docs-por-tipo", dashboardHandler.DocsPorTipo)
	auth.GET("/dashboard/tramitacao-por-setor", dashboardHandler.TramitacaoPorSetor)
	auth.GET("/dashboard/ranking-uploads", dashboardHandler.RankingUploads)
	auth.GET("/dashboard/sem-documentos", dashboardHandler.SemDocumentos)
	auth.GET("/dashboard/export/pdf", dashboardExportHandler.ExportPDF)
	auth.GET("/dashboard/export/excel", dashboardExportHandler.ExportExcel)

	// Tipos de Documento
	auth.GET("/tipos-documento", tipoDocHandler.List)
	auth.POST("/tipos-documento", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), tipoDocHandler.Create)
	auth.PATCH("/tipos-documento/:id", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), tipoDocHandler.Update)
	auth.PATCH("/tipos-documento/:id/toggle", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), tipoDocHandler.Toggle)

	// Admin (SUPER_ADMIN only)
	auth.GET("/admin/admins", middleware.RequireRole(middleware.RoleSuperAdmin), adminHandler.List)
	auth.POST("/admin/admins", middleware.RequireRole(middleware.RoleSuperAdmin), adminHandler.Create)
	auth.PATCH("/admin/admins/:id", middleware.RequireRole(middleware.RoleSuperAdmin), adminHandler.Update)
	auth.PATCH("/admin/admins/:id/toggle", middleware.RequireRole(middleware.RoleSuperAdmin), adminHandler.Toggle)
	auth.DELETE("/admin/admins/:id", middleware.RequireRole(middleware.RoleSuperAdmin), adminHandler.Delete)

	// Activity Logs (ADMIN+)
	auth.GET("/admin/logs", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), activityLogHandler.List)
	auth.GET("/admin/logs/:id", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), activityLogHandler.GetByID)

	// Rotas de detalhes e documentos (parametrizadas — após as literais)
	auth.GET("/protocolos/:source/:id", protocoloHandler.GetByID)
	auth.POST("/protocolos/:source/:id/documentos", documentoHandler.Upload)
	auth.GET("/protocolos/:source/:id/documentos", documentoHandler.List)
	auth.GET("/documentos/:id/download", documentoHandler.Download)
	auth.GET("/documentos/:id/preview", documentoHandler.Preview)
	auth.PATCH("/documentos/:id", documentoHandler.Update)
	auth.POST("/documentos/:id/delete", documentoHandler.Delete)

	// Download em Lote e Dossiê
	auth.POST("/protocolos/:source/:id/documentos/download-zip", downloadHandler.DownloadZip)
	auth.POST("/protocolos/:source/:id/documentos/download-selected", downloadHandler.DownloadSelected)
	auth.POST("/protocolos/:source/:id/dossie/export", downloadHandler.ExportDossie)

	// Observações
	auth.GET("/protocolos/:source/:id/observacoes", observacaoHandler.List)
	auth.POST("/protocolos/:source/:id/observacoes", observacaoHandler.Create)
	auth.PATCH("/observacoes/:id", observacaoHandler.Update)
	auth.PATCH("/observacoes/:id/importante", observacaoHandler.ToggleImportant)
	auth.DELETE("/observacoes/:id", observacaoHandler.Delete)

	// Tramitação SAGI
	auth.GET("/protocolos/:source/:id/tramitacao", tramitacaoHandler.GetByProtocol)

	// Protocolos Internos
	auth.GET("/protocolos-internos", intProtoHandler.List)
	auth.POST("/protocolos-internos", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), intProtoHandler.Create)
	auth.GET("/protocolos-internos/:id", intProtoHandler.GetByID)
	auth.PATCH("/protocolos-internos/:id", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), intProtoHandler.Update)
	auth.PATCH("/protocolos-internos/:id/status", intProtoHandler.ChangeStatus)
	auth.POST("/protocolos-internos/:id/tramitar", intProtoHandler.Dispatch)
	auth.GET("/protocolos-internos/:id/tramitacao", intProtoHandler.History)
	auth.DELETE("/protocolos-internos/:id", middleware.RequireRole(middleware.RoleSuperAdmin, middleware.RoleAdmin), intProtoHandler.Delete)

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
