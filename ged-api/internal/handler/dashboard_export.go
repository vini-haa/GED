package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/middleware"
	"github.com/fadex/ged-api/internal/service"
)

// DashboardExportHandler lida com exportação do dashboard em PDF e Excel.
type DashboardExportHandler struct {
	dashSvc    *service.DashboardService
	activitySvc *service.ActivityLogService
}

// NewDashboardExportHandler cria uma instância do handler.
func NewDashboardExportHandler(dashSvc *service.DashboardService, activitySvc *service.ActivityLogService) *DashboardExportHandler {
	return &DashboardExportHandler{dashSvc: dashSvc, activitySvc: activitySvc}
}

func (h *DashboardExportHandler) parseQuery(c *gin.Context) dto.DashboardQuery {
	return dto.DashboardQuery{
		Periodo: c.DefaultQuery("periodo", "30d"),
		Setor:   c.DefaultQuery("setor", "all"),
		Projeto: c.DefaultQuery("projeto", "all"),
	}
}

// collectData busca todos os dados do dashboard para exportação.
func (h *DashboardExportHandler) collectData(c *gin.Context, q dto.DashboardQuery) (*service.DashboardExportData, error) {
	ctx := c.Request.Context()

	kpis, err := h.dashSvc.KPIs(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("KPIs: %w", err)
	}

	uploads, err := h.dashSvc.UploadsPorPeriodo(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("uploads: %w", err)
	}

	docsPorTipo, err := h.dashSvc.DocsPorTipo(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("docs por tipo: %w", err)
	}

	tramitacao, err := h.dashSvc.TramitacaoPorSetor(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("tramitação: %w", err)
	}

	ranking, err := h.dashSvc.RankingUploads(ctx, q, 10)
	if err != nil {
		return nil, fmt.Errorf("ranking: %w", err)
	}

	semDocs, err := h.dashSvc.ProtocolosSemDocumentos(ctx, q, 1, 100)
	if err != nil {
		return nil, fmt.Errorf("sem documentos: %w", err)
	}

	return &service.DashboardExportData{
		Query:       q,
		KPIs:        kpis,
		Uploads:     uploads,
		DocsPorTipo: docsPorTipo,
		Tramitacao:  tramitacao,
		Ranking:     ranking,
		SemDocs:     semDocs,
	}, nil
}

// ExportPDF godoc
// GET /api/dashboard/export/pdf
func (h *DashboardExportHandler) ExportPDF(c *gin.Context) {
	q := h.parseQuery(c)

	data, err := h.collectData(c, q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao coletar dados para export PDF")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "EXPORT_ERROR",
				"message": "Erro ao coletar dados do dashboard",
			},
		})
		return
	}

	pdfBytes, err := service.GenerateDashboardPDF(*data)
	if err != nil {
		log.Error().Err(err).Msg("erro ao gerar PDF do dashboard")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "EXPORT_ERROR",
				"message": "Erro ao gerar relatório PDF",
			},
		})
		return
	}

	fileName := fmt.Sprintf("dashboard_ged_%s.pdf", time.Now().Format("20060102_150405"))

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))
	c.Header("Content-Length", fmt.Sprintf("%d", len(pdfBytes)))
	c.Data(http.StatusOK, "application/pdf", pdfBytes)

	// Activity log fire-and-forget
	h.activitySvc.Log(service.ActivityLogEntry{
		Action:     "export_dashboard_pdf",
		EntityType: "dashboard",
		EntityID:   "export",
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
		Details: map[string]interface{}{
			"formato":  "pdf",
			"periodo":  q.Periodo,
			"setor":    q.Setor,
			"projeto":  q.Projeto,
			"tamanho":  len(pdfBytes),
			"filename": fileName,
		},
	})
}

// ExportExcel godoc
// GET /api/dashboard/export/excel
func (h *DashboardExportHandler) ExportExcel(c *gin.Context) {
	q := h.parseQuery(c)

	data, err := h.collectData(c, q)
	if err != nil {
		log.Error().Err(err).Msg("erro ao coletar dados para export Excel")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "EXPORT_ERROR",
				"message": "Erro ao coletar dados do dashboard",
			},
		})
		return
	}

	xlsxBytes, err := service.GenerateDashboardExcel(*data)
	if err != nil {
		log.Error().Err(err).Msg("erro ao gerar Excel do dashboard")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "EXPORT_ERROR",
				"message": "Erro ao gerar planilha Excel",
			},
		})
		return
	}

	fileName := fmt.Sprintf("dashboard_ged_%s.xlsx", time.Now().Format("20060102_150405"))

	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, fileName))
	c.Header("Content-Length", fmt.Sprintf("%d", len(xlsxBytes)))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xlsxBytes)

	// Activity log fire-and-forget
	h.activitySvc.Log(service.ActivityLogEntry{
		Action:     "export_dashboard_excel",
		EntityType: "dashboard",
		EntityID:   "export",
		UserEmail:  middleware.GetUserEmail(c),
		UserName:   middleware.GetUserName(c),
		IPAddress:  c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
		Details: map[string]interface{}{
			"formato":  "excel",
			"periodo":  q.Periodo,
			"setor":    q.Setor,
			"projeto":  q.Projeto,
			"tamanho":  len(xlsxBytes),
			"filename": fileName,
		},
	})
}
