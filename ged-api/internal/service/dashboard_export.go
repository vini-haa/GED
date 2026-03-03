package service

import (
	"bytes"
	"fmt"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/xuri/excelize/v2"

	"github.com/fadex/ged-api/internal/dto"
)

// DashboardExportData agrega todos os dados do dashboard para exportação.
type DashboardExportData struct {
	Query       dto.DashboardQuery
	KPIs        []dto.DashboardKpi
	Uploads     []dto.UploadsPeriodoItem
	DocsPorTipo []dto.DocsPorTipoItem
	Tramitacao  []dto.TramitacaoSetorItem
	Ranking     []dto.RankingUploadItem
	SemDocs     []dto.ProtocoloSemDocs
}

// periodoLabel retorna texto legível do período.
func periodoLabel(periodo string) string {
	switch periodo {
	case "7d":
		return "Últimos 7 dias"
	case "30d":
		return "Últimos 30 dias"
	case "90d":
		return "Últimos 90 dias"
	case "1y":
		return "Último ano"
	default:
		return periodo
	}
}

// filtrosTexto retorna um texto resumindo os filtros aplicados.
func filtrosTexto(q dto.DashboardQuery) string {
	s := periodoLabel(q.Periodo)
	if sf := q.SetorFilter(); sf != "" {
		s += " | Setor: " + sf
	}
	if q.Projeto != "" && q.Projeto != "all" {
		s += " | Projeto: " + q.Projeto
	}
	return s
}

// GenerateDashboardPDF gera o relatório PDF do dashboard.
func GenerateDashboardPDF(data DashboardExportData) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	now := time.Now()

	// Cabeçalho
	pdf.SetFont("Helvetica", "B", 16)
	pdf.CellFormat(0, 10, lat1("GED FADEX — Relatório do Dashboard"), "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 9)
	pdf.CellFormat(0, 5, lat1(fmt.Sprintf("Gerado em %s", now.Format("02/01/2006 às 15:04"))), "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "I", 9)
	pdf.CellFormat(0, 5, lat1("Filtros: "+filtrosTexto(data.Query)), "", 1, "C", false, 0, "")
	pdf.Ln(6)

	// Seção 1 — KPIs
	pdfSection(pdf, "1. Indicadores (KPIs)")
	if len(data.KPIs) > 0 {
		colW := []float64{80, 50, 60}
		pdfTableHeader(pdf, colW, []string{"Indicador", "Valor", "Variação (%)"})
		pdf.SetFont("Helvetica", "", 9)
		for _, k := range data.KPIs {
			variacao := fmt.Sprintf("%.1f%%", k.Variacao)
			if k.Variacao > 0 {
				variacao = "+" + variacao
			}
			pdf.CellFormat(colW[0], 6, lat1(k.Label), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[1], 6, fmt.Sprintf("%d", k.Valor), "1", 0, "R", false, 0, "")
			pdf.CellFormat(colW[2], 6, variacao, "1", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
	} else {
		pdf.SetFont("Helvetica", "I", 9)
		pdf.CellFormat(0, 6, lat1("Nenhum dado disponível"), "", 1, "L", false, 0, "")
	}
	pdf.Ln(6)

	// Seção 2 — Uploads por Período
	pdfSection(pdf, "2. Uploads por Período")
	if len(data.Uploads) > 0 {
		colW := []float64{60, 50, 50}
		maxRows := 30
		if len(data.Uploads) < maxRows {
			maxRows = len(data.Uploads)
		}
		pdfTableHeader(pdf, colW, []string{"Data", "Uploads", "Protocolos"})
		pdf.SetFont("Helvetica", "", 9)
		for i := 0; i < maxRows; i++ {
			u := data.Uploads[i]
			pdf.CellFormat(colW[0], 6, u.Data, "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[1], 6, fmt.Sprintf("%d", u.Uploads), "1", 0, "R", false, 0, "")
			pdf.CellFormat(colW[2], 6, fmt.Sprintf("%d", u.Protocolos), "1", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
		if len(data.Uploads) > maxRows {
			pdf.SetFont("Helvetica", "I", 8)
			pdf.CellFormat(0, 5, lat1(fmt.Sprintf("... e mais %d registros", len(data.Uploads)-maxRows)), "", 1, "L", false, 0, "")
		}
	} else {
		pdf.SetFont("Helvetica", "I", 9)
		pdf.CellFormat(0, 6, lat1("Nenhum dado disponível"), "", 1, "L", false, 0, "")
	}
	pdf.Ln(6)

	// Seção 3 — Documentos por Tipo
	pdfSection(pdf, "3. Documentos por Tipo")
	if len(data.DocsPorTipo) > 0 {
		colW := []float64{120, 50}
		pdfTableHeader(pdf, colW, []string{"Tipo", "Quantidade"})
		pdf.SetFont("Helvetica", "", 9)
		for _, d := range data.DocsPorTipo {
			pdf.CellFormat(colW[0], 6, lat1(d.Tipo), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[1], 6, fmt.Sprintf("%d", d.Quantidade), "1", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
	} else {
		pdf.SetFont("Helvetica", "I", 9)
		pdf.CellFormat(0, 6, lat1("Nenhum dado disponível"), "", 1, "L", false, 0, "")
	}
	pdf.Ln(6)

	// Seção 4 — Tramitação por Setor
	pdfSection(pdf, "4. Tramitação por Setor")
	if len(data.Tramitacao) > 0 {
		colW := []float64{110, 40, 40}
		pdfTableHeader(pdf, colW, []string{"Setor", "Média (dias)", "Acima da média"})
		pdf.SetFont("Helvetica", "", 9)
		for _, t := range data.Tramitacao {
			acima := "Não"
			if t.AcimaDaMedia {
				acima = "Sim"
			}
			pdf.CellFormat(colW[0], 6, lat1(truncStr(t.Setor, 55)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[1], 6, fmt.Sprintf("%.1f", t.TempoMedioDias), "1", 0, "R", false, 0, "")
			pdf.CellFormat(colW[2], 6, acima, "1", 0, "C", false, 0, "")
			pdf.Ln(-1)
		}
	} else {
		pdf.SetFont("Helvetica", "I", 9)
		pdf.CellFormat(0, 6, lat1("Nenhum dado disponível"), "", 1, "L", false, 0, "")
	}
	pdf.Ln(6)

	// Seção 5 — Ranking de Uploads
	pdfSection(pdf, "5. Ranking de Uploads (Top 10)")
	if len(data.Ranking) > 0 {
		colW := []float64{15, 70, 60, 45}
		pdfTableHeader(pdf, colW, []string{"#", "Nome", "Setor", "Uploads"})
		pdf.SetFont("Helvetica", "", 9)
		for _, r := range data.Ranking {
			pdf.CellFormat(colW[0], 6, fmt.Sprintf("%d", r.Posicao), "1", 0, "C", false, 0, "")
			pdf.CellFormat(colW[1], 6, lat1(truncStr(r.Nome, 35)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[2], 6, lat1(truncStr(r.Setor, 30)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[3], 6, fmt.Sprintf("%d", r.Uploads), "1", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
	} else {
		pdf.SetFont("Helvetica", "I", 9)
		pdf.CellFormat(0, 6, lat1("Nenhum dado disponível"), "", 1, "L", false, 0, "")
	}
	pdf.Ln(6)

	// Seção 6 — Protocolos sem Documentos
	pdfSection(pdf, "6. Protocolos sem Documentos")
	if len(data.SemDocs) > 0 {
		colW := []float64{40, 65, 50, 35}
		pdfTableHeader(pdf, colW, []string{"Número", "Assunto", "Setor", "Dias"})
		pdf.SetFont("Helvetica", "", 8)
		maxRows := 50
		if len(data.SemDocs) < maxRows {
			maxRows = len(data.SemDocs)
		}
		for i := 0; i < maxRows; i++ {
			p := data.SemDocs[i]
			pdf.CellFormat(colW[0], 5, lat1(truncStr(p.Numero, 20)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[1], 5, lat1(truncStr(p.Assunto, 33)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[2], 5, lat1(truncStr(p.SetorDestino, 25)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colW[3], 5, fmt.Sprintf("%d", p.DiasSemDocumento), "1", 0, "R", false, 0, "")
			pdf.Ln(-1)
		}
		if len(data.SemDocs) > maxRows {
			pdf.SetFont("Helvetica", "I", 8)
			pdf.CellFormat(0, 5, lat1(fmt.Sprintf("... e mais %d protocolos", len(data.SemDocs)-maxRows)), "", 1, "L", false, 0, "")
		}
	} else {
		pdf.SetFont("Helvetica", "I", 9)
		pdf.CellFormat(0, 6, lat1("Nenhum protocolo sem documentos encontrado"), "", 1, "L", false, 0, "")
	}

	// Rodapé
	pdf.Ln(10)
	pdf.SetFont("Helvetica", "I", 7)
	pdf.CellFormat(0, 4, lat1(fmt.Sprintf("Gerado em %s — GED FADEX", now.Format("02/01/2006 às 15:04"))), "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("erro ao gerar PDF: %w", err)
	}
	return buf.Bytes(), nil
}

// GenerateDashboardExcel gera a planilha Excel do dashboard.
func GenerateDashboardExcel(data DashboardExportData) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 10, Color: "#FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#2563EB"}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "#D0D0D0", Style: 1},
			{Type: "right", Color: "#D0D0D0", Style: 1},
			{Type: "top", Color: "#D0D0D0", Style: 1},
			{Type: "bottom", Color: "#D0D0D0", Style: 1},
		},
	})

	cellStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Size: 10},
		Border: []excelize.Border{
			{Type: "left", Color: "#D0D0D0", Style: 1},
			{Type: "right", Color: "#D0D0D0", Style: 1},
			{Type: "top", Color: "#D0D0D0", Style: 1},
			{Type: "bottom", Color: "#D0D0D0", Style: 1},
		},
	})

	titleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14},
		Alignment: &excelize.Alignment{Horizontal: "left"},
	})

	subtitleStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 10, Italic: true, Color: "#666666"},
		Alignment: &excelize.Alignment{Horizontal: "left"},
	})

	// Aba 1 — KPIs
	sheet1 := "KPIs"
	f.SetSheetName("Sheet1", sheet1)
	f.SetCellValue(sheet1, "A1", "GED FADEX — Relatório do Dashboard")
	f.SetCellStyle(sheet1, "A1", "A1", titleStyle)
	f.SetCellValue(sheet1, "A2", fmt.Sprintf("Filtros: %s | Gerado em: %s", filtrosTexto(data.Query), time.Now().Format("02/01/2006 15:04")))
	f.SetCellStyle(sheet1, "A2", "A2", subtitleStyle)

	headers := []string{"Indicador", "Valor", "Variação (%)"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 4)
		f.SetCellValue(sheet1, cell, h)
		f.SetCellStyle(sheet1, cell, cell, headerStyle)
	}
	for i, k := range data.KPIs {
		row := i + 5
		f.SetCellValue(sheet1, cellName(1, row), k.Label)
		f.SetCellValue(sheet1, cellName(2, row), k.Valor)
		f.SetCellValue(sheet1, cellName(3, row), k.Variacao)
		f.SetCellStyle(sheet1, cellName(1, row), cellName(3, row), cellStyle)
	}
	f.SetColWidth(sheet1, "A", "A", 25)
	f.SetColWidth(sheet1, "B", "B", 15)
	f.SetColWidth(sheet1, "C", "C", 15)

	// Aba 2 — Uploads
	sheet2 := "Uploads"
	f.NewSheet(sheet2)
	uploadsHeaders := []string{"Data", "Uploads", "Protocolos"}
	for i, h := range uploadsHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet2, cell, h)
		f.SetCellStyle(sheet2, cell, cell, headerStyle)
	}
	for i, u := range data.Uploads {
		row := i + 2
		f.SetCellValue(sheet2, cellName(1, row), u.Data)
		f.SetCellValue(sheet2, cellName(2, row), u.Uploads)
		f.SetCellValue(sheet2, cellName(3, row), u.Protocolos)
		f.SetCellStyle(sheet2, cellName(1, row), cellName(3, row), cellStyle)
	}
	f.SetColWidth(sheet2, "A", "A", 15)
	f.SetColWidth(sheet2, "B", "C", 12)

	// Aba 3 — Docs por Tipo
	sheet3 := "Docs por Tipo"
	f.NewSheet(sheet3)
	tipoHeaders := []string{"Tipo", "Quantidade"}
	for i, h := range tipoHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet3, cell, h)
		f.SetCellStyle(sheet3, cell, cell, headerStyle)
	}
	for i, d := range data.DocsPorTipo {
		row := i + 2
		f.SetCellValue(sheet3, cellName(1, row), d.Tipo)
		f.SetCellValue(sheet3, cellName(2, row), d.Quantidade)
		f.SetCellStyle(sheet3, cellName(1, row), cellName(2, row), cellStyle)
	}
	f.SetColWidth(sheet3, "A", "A", 30)
	f.SetColWidth(sheet3, "B", "B", 15)

	// Aba 4 — Tramitação
	sheet4 := "Tramitação"
	f.NewSheet(sheet4)
	tramHeaders := []string{"Setor", "Média (dias)", "Acima da média"}
	for i, h := range tramHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet4, cell, h)
		f.SetCellStyle(sheet4, cell, cell, headerStyle)
	}
	for i, t := range data.Tramitacao {
		row := i + 2
		acima := "Não"
		if t.AcimaDaMedia {
			acima = "Sim"
		}
		f.SetCellValue(sheet4, cellName(1, row), t.Setor)
		f.SetCellValue(sheet4, cellName(2, row), t.TempoMedioDias)
		f.SetCellValue(sheet4, cellName(3, row), acima)
		f.SetCellStyle(sheet4, cellName(1, row), cellName(3, row), cellStyle)
	}
	f.SetColWidth(sheet4, "A", "A", 35)
	f.SetColWidth(sheet4, "B", "B", 15)
	f.SetColWidth(sheet4, "C", "C", 18)

	// Aba 5 — Ranking
	sheet5 := "Ranking"
	f.NewSheet(sheet5)
	rankHeaders := []string{"Posição", "Nome", "Setor", "Uploads"}
	for i, h := range rankHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet5, cell, h)
		f.SetCellStyle(sheet5, cell, cell, headerStyle)
	}
	for i, r := range data.Ranking {
		row := i + 2
		f.SetCellValue(sheet5, cellName(1, row), r.Posicao)
		f.SetCellValue(sheet5, cellName(2, row), r.Nome)
		f.SetCellValue(sheet5, cellName(3, row), r.Setor)
		f.SetCellValue(sheet5, cellName(4, row), r.Uploads)
		f.SetCellStyle(sheet5, cellName(1, row), cellName(4, row), cellStyle)
	}
	f.SetColWidth(sheet5, "A", "A", 10)
	f.SetColWidth(sheet5, "B", "B", 30)
	f.SetColWidth(sheet5, "C", "C", 25)
	f.SetColWidth(sheet5, "D", "D", 12)

	// Aba 6 — Sem Documentos
	sheet6 := "Sem Documentos"
	f.NewSheet(sheet6)
	semHeaders := []string{"Número", "Assunto", "Setor Atual", "Dias sem Documento"}
	for i, h := range semHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet6, cell, h)
		f.SetCellStyle(sheet6, cell, cell, headerStyle)
	}
	for i, p := range data.SemDocs {
		row := i + 2
		f.SetCellValue(sheet6, cellName(1, row), p.Numero)
		f.SetCellValue(sheet6, cellName(2, row), p.Assunto)
		f.SetCellValue(sheet6, cellName(3, row), p.SetorDestino)
		f.SetCellValue(sheet6, cellName(4, row), p.DiasSemDocumento)
		f.SetCellStyle(sheet6, cellName(1, row), cellName(4, row), cellStyle)
	}
	f.SetColWidth(sheet6, "A", "A", 22)
	f.SetColWidth(sheet6, "B", "B", 40)
	f.SetColWidth(sheet6, "C", "C", 25)
	f.SetColWidth(sheet6, "D", "D", 20)

	// Ativar primeira aba
	idx, _ := f.GetSheetIndex(sheet1)
	f.SetActiveSheet(idx)

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, fmt.Errorf("erro ao gerar Excel: %w", err)
	}
	return buf.Bytes(), nil
}

// --- Helpers ---

// lat1 converte UTF-8 para ISO-8859-1 (best-effort para fpdf).
func lat1(s string) string {
	var buf bytes.Buffer
	for _, r := range s {
		if r < 256 {
			buf.WriteRune(r)
		} else {
			buf.WriteByte('?')
		}
	}
	return buf.String()
}

// truncStr trunca string para exibição.
func truncStr(s string, max int) string {
	runes := []rune(s)
	if len(runes) <= max {
		return s
	}
	return string(runes[:max-3]) + "..."
}

// pdfSection adiciona um título de seção no PDF.
func pdfSection(pdf *fpdf.Fpdf, title string) {
	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 8, lat1(title), "", 1, "L", false, 0, "")
	pdf.SetDrawColor(0, 102, 204)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(3)
}

// pdfTableHeader adiciona cabeçalho de tabela no PDF.
func pdfTableHeader(pdf *fpdf.Fpdf, colWidths []float64, headers []string) {
	pdf.SetFont("Helvetica", "B", 9)
	pdf.SetFillColor(37, 99, 235)
	pdf.SetTextColor(255, 255, 255)
	for i, h := range headers {
		align := "C"
		pdf.CellFormat(colWidths[i], 6, lat1(h), "1", 0, align, true, 0, "")
	}
	pdf.Ln(-1)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFillColor(255, 255, 255)
}

// cellName converte coordenadas (col, row) em nome de célula Excel.
func cellName(col, row int) string {
	name, _ := excelize.CoordinatesToCellName(col, row)
	return name
}
