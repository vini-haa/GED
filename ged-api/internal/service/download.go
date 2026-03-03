package service

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
)

const maxZipDocs = 50

// DownloadService gerencia download em lote e geração de dossiê.
type DownloadService struct {
	queries      *db.Queries
	driveSvc     *DriveService
	docSvc       *DocumentoService
	protocoloSvc *ProtocoloService
	observacaoSvc *ObservacaoService
	tramitacaoSvc *TramitacaoService
	activitySvc  *ActivityLogService
}

// NewDownloadService cria uma instância do DownloadService.
func NewDownloadService(
	queries *db.Queries,
	driveSvc *DriveService,
	docSvc *DocumentoService,
	protocoloSvc *ProtocoloService,
	observacaoSvc *ObservacaoService,
	tramitacaoSvc *TramitacaoService,
	activitySvc *ActivityLogService,
) *DownloadService {
	return &DownloadService{
		queries:       queries,
		driveSvc:      driveSvc,
		docSvc:        docSvc,
		protocoloSvc:  protocoloSvc,
		observacaoSvc: observacaoSvc,
		tramitacaoSvc: tramitacaoSvc,
		activitySvc:   activitySvc,
	}
}

// ValidateDownloadZip valida se o download ZIP pode ser feito (chamar antes de setar headers).
func (s *DownloadService) ValidateDownloadZip(ctx context.Context, source, id string) (string, error) {
	protocoloSagi, err := s.docSvc.ResolveProtocoloSagi(ctx, source, id)
	if err != nil {
		return "", fmt.Errorf("protocolo não encontrado: %w", err)
	}

	docs, err := s.queries.ListDocumentosByProtocoloWithType(ctx, protocoloSagi)
	if err != nil {
		return "", fmt.Errorf("erro ao listar documentos: %w", err)
	}

	if len(docs) == 0 {
		return "", fmt.Errorf("nenhum documento encontrado para este protocolo")
	}

	if len(docs) > maxZipDocs {
		return "", fmt.Errorf("limite de %d documentos excedido (%d encontrados)", maxZipDocs, len(docs))
	}

	if s.driveSvc == nil {
		return "", fmt.Errorf("serviço de armazenamento indisponível")
	}

	return protocoloSagi, nil
}

// ValidateDownloadSelected valida se o download selecionado pode ser feito.
func (s *DownloadService) ValidateDownloadSelected(ctx context.Context, source, id string, docIDs []string) (string, error) {
	if len(docIDs) == 0 {
		return "", fmt.Errorf("nenhum documento selecionado")
	}

	if len(docIDs) > maxZipDocs {
		return "", fmt.Errorf("limite de %d documentos excedido (%d selecionados)", maxZipDocs, len(docIDs))
	}

	protocoloSagi, err := s.docSvc.ResolveProtocoloSagi(ctx, source, id)
	if err != nil {
		return "", fmt.Errorf("protocolo não encontrado: %w", err)
	}

	if s.driveSvc == nil {
		return "", fmt.Errorf("serviço de armazenamento indisponível")
	}

	return protocoloSagi, nil
}

// ValidateDossie valida se o dossiê pode ser gerado.
func (s *DownloadService) ValidateDossie(ctx context.Context, source, id string) (string, error) {
	protocoloSagi, err := s.docSvc.ResolveProtocoloSagi(ctx, source, id)
	if err != nil {
		return "", fmt.Errorf("protocolo não encontrado: %w", err)
	}

	return protocoloSagi, nil
}

// DownloadZip cria um ZIP com todos os documentos de um protocolo e escreve no writer.
// Chamar ValidateDownloadZip antes para validar.
func (s *DownloadService) DownloadZip(ctx context.Context, source, id string, w io.Writer, userEmail, userName, ip, userAgent string) (string, int, error) {
	protocoloSagi, err := s.docSvc.ResolveProtocoloSagi(ctx, source, id)
	if err != nil {
		return "", 0, fmt.Errorf("protocolo não encontrado: %w", err)
	}

	docs, err := s.queries.ListDocumentosByProtocoloWithType(ctx, protocoloSagi)
	if err != nil {
		return "", 0, fmt.Errorf("erro ao listar documentos: %w", err)
	}

	if len(docs) == 0 {
		return "", 0, fmt.Errorf("nenhum documento encontrado para este protocolo")
	}

	if s.driveSvc == nil {
		return "", 0, fmt.Errorf("serviço de armazenamento indisponível")
	}

	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	count := 0
	usedNames := make(map[string]int)

	for _, doc := range docs {
		if !doc.DriveFileID.Valid || doc.DriveFileID.String == "" {
			continue
		}

		reader, _, _, err := s.driveSvc.Download(ctx, doc.DriveFileID.String)
		if err != nil {
			log.Warn().Err(err).Str("doc_id", doc.ID.String()).Msg("falha ao baixar documento do Drive, pulando")
			continue
		}

		fileName := uniqueFileName(doc.NomeArquivo, usedNames)

		entry, err := zipWriter.Create(fileName)
		if err != nil {
			reader.Close()
			log.Warn().Err(err).Str("file", fileName).Msg("falha ao criar entrada no ZIP")
			continue
		}

		if _, err := io.Copy(entry, reader); err != nil {
			reader.Close()
			log.Warn().Err(err).Str("file", fileName).Msg("falha ao copiar conteúdo para ZIP")
			continue
		}

		reader.Close()
		count++
	}

	if count == 0 {
		return "", 0, fmt.Errorf("nenhum documento pôde ser baixado")
	}

	// Activity log
	protocolID, _ := parseIntID(id)
	s.activitySvc.Log(ActivityLogEntry{
		Action:         "batch_download",
		EntityType:     "protocol",
		EntityID:       id,
		UserEmail:      userEmail,
		UserName:       userName,
		IPAddress:      ip,
		UserAgent:      userAgent,
		ProtocolID:     protocolID,
		ProtocolNumber: protocoloSagi,
		ProtocolSource: source,
		Details:        map[string]interface{}{"doc_count": count, "format": "zip"},
	})

	return protocoloSagi, count, nil
}

// DownloadSelected cria um ZIP com documentos selecionados por IDs.
func (s *DownloadService) DownloadSelected(ctx context.Context, source, id string, docIDs []string, w io.Writer, userEmail, userName, ip, userAgent string) (string, int, error) {
	if len(docIDs) == 0 {
		return "", 0, fmt.Errorf("nenhum documento selecionado")
	}

	if len(docIDs) > maxZipDocs {
		return "", 0, fmt.Errorf("limite de %d documentos excedido (%d selecionados)", maxZipDocs, len(docIDs))
	}

	protocoloSagi, err := s.docSvc.ResolveProtocoloSagi(ctx, source, id)
	if err != nil {
		return "", 0, fmt.Errorf("protocolo não encontrado: %w", err)
	}

	if s.driveSvc == nil {
		return "", 0, fmt.Errorf("serviço de armazenamento indisponível")
	}

	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	count := 0
	usedNames := make(map[string]int)

	for _, docIDStr := range docIDs {
		docID, err := uuid.Parse(docIDStr)
		if err != nil {
			log.Warn().Str("doc_id", docIDStr).Msg("ID de documento inválido, pulando")
			continue
		}

		reader, fileName, _, _, err := s.docSvc.Download(ctx, docID)
		if err != nil {
			log.Warn().Err(err).Str("doc_id", docIDStr).Msg("falha ao baixar documento, pulando")
			continue
		}

		uniqueName := uniqueFileName(fileName, usedNames)

		entry, err := zipWriter.Create(uniqueName)
		if err != nil {
			reader.Close()
			continue
		}

		if _, err := io.Copy(entry, reader); err != nil {
			reader.Close()
			continue
		}

		reader.Close()
		count++
	}

	if count == 0 {
		return "", 0, fmt.Errorf("nenhum documento pôde ser baixado")
	}

	protocolID, _ := parseIntID(id)
	s.activitySvc.Log(ActivityLogEntry{
		Action:         "batch_download",
		EntityType:     "protocol",
		EntityID:       id,
		UserEmail:      userEmail,
		UserName:       userName,
		IPAddress:      ip,
		UserAgent:      userAgent,
		ProtocolID:     protocolID,
		ProtocolNumber: protocoloSagi,
		ProtocolSource: source,
		Details:        map[string]interface{}{"doc_count": count, "selected_ids": docIDs, "format": "zip"},
	})

	return protocoloSagi, count, nil
}

// GenerateDossie gera o dossiê completo (PDF resumo + documentos) como ZIP.
func (s *DownloadService) GenerateDossie(ctx context.Context, source, id string, w io.Writer, userEmail, userName, ip, userAgent string) (string, error) {
	protocoloSagi, err := s.docSvc.ResolveProtocoloSagi(ctx, source, id)
	if err != nil {
		return "", fmt.Errorf("protocolo não encontrado: %w", err)
	}

	// Buscar dados do protocolo
	protocolo, err := s.protocoloSvc.GetByID(ctx, source, id)
	if err != nil {
		return "", fmt.Errorf("erro ao buscar dados do protocolo: %w", err)
	}

	// Buscar observações
	protocolID, _ := parseIntID(id)
	var observacoes *dto.ListObservacoesResponse
	observacoes, err = s.observacaoSvc.List(ctx, protocolID, source, userEmail, true)
	if err != nil {
		log.Warn().Err(err).Msg("erro ao buscar observações para dossiê, continuando sem")
		observacoes = &dto.ListObservacoesResponse{Data: []dto.ObservacaoItem{}}
	}

	// Buscar tramitação (apenas SAGI)
	var tramitacao *dto.TramitacaoResponse
	if source == "sagi" && protocolID > 0 {
		tramitacao, err = s.tramitacaoSvc.GetByProtocolo(ctx, protocolID)
		if err != nil {
			log.Warn().Err(err).Msg("erro ao buscar tramitação para dossiê, continuando sem")
			tramitacao = &dto.TramitacaoResponse{Data: []dto.TramitacaoItem{}}
		}
	}

	// Buscar documentos
	docs, err := s.queries.ListDocumentosByProtocoloWithType(ctx, protocoloSagi)
	if err != nil {
		return "", fmt.Errorf("erro ao listar documentos: %w", err)
	}

	// Gerar PDF resumo
	pdfBuf, err := s.generateSummaryPDF(protocolo, observacoes, tramitacao, docs)
	if err != nil {
		return "", fmt.Errorf("erro ao gerar PDF resumo: %w", err)
	}

	// Criar ZIP com PDF + documentos
	zipWriter := zip.NewWriter(w)
	defer zipWriter.Close()

	// Adicionar PDF resumo
	pdfEntry, err := zipWriter.Create("00_resumo_protocolo.pdf")
	if err != nil {
		return "", fmt.Errorf("erro ao criar entrada PDF no ZIP: %w", err)
	}
	if _, err := io.Copy(pdfEntry, bytes.NewReader(pdfBuf)); err != nil {
		return "", fmt.Errorf("erro ao escrever PDF no ZIP: %w", err)
	}

	// Adicionar documentos
	if s.driveSvc != nil {
		usedNames := make(map[string]int)
		for i, doc := range docs {
			if !doc.DriveFileID.Valid || doc.DriveFileID.String == "" {
				continue
			}

			reader, _, _, err := s.driveSvc.Download(ctx, doc.DriveFileID.String)
			if err != nil {
				log.Warn().Err(err).Str("doc_id", doc.ID.String()).Msg("falha ao baixar documento para dossiê")
				continue
			}

			// Prefixo numérico para ordenação
			prefix := fmt.Sprintf("%02d_", i+1)
			fileName := prefix + uniqueFileName(doc.NomeArquivo, usedNames)

			entry, err := zipWriter.Create(fileName)
			if err != nil {
				reader.Close()
				continue
			}

			if _, err := io.Copy(entry, reader); err != nil {
				reader.Close()
				continue
			}

			reader.Close()
		}
	}

	// Activity log
	s.activitySvc.Log(ActivityLogEntry{
		Action:         "dossie_export",
		EntityType:     "protocol",
		EntityID:       id,
		UserEmail:      userEmail,
		UserName:       userName,
		IPAddress:      ip,
		UserAgent:      userAgent,
		ProtocolID:     protocolID,
		ProtocolNumber: protocoloSagi,
		ProtocolSource: source,
		Details:        map[string]interface{}{"doc_count": len(docs), "format": "dossie_zip"},
	})

	return protocoloSagi, nil
}

// generateSummaryPDF gera o PDF de resumo do protocolo.
func (s *DownloadService) generateSummaryPDF(
	proto *dto.ProtocoloDetalheResponse,
	obs *dto.ListObservacoesResponse,
	tram *dto.TramitacaoResponse,
	docs []db.ListDocumentosByProtocoloWithTypeRow,
) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	// Cabeçalho
	pdf.SetFont("Helvetica", "B", 16)
	pdf.CellFormat(0, 10, encode("Dossiê do Protocolo"), "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, encode(fmt.Sprintf("Gerado em: %s", time.Now().Format("02/01/2006 15:04"))), "", 1, "C", false, 0, "")
	pdf.Ln(8)

	// Dados do protocolo
	pdf.SetFont("Helvetica", "B", 13)
	pdf.CellFormat(0, 8, encode("Dados do Protocolo"), "", 1, "L", false, 0, "")
	pdf.SetDrawColor(0, 102, 204)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(4)

	addField(pdf, "Número:", proto.NumeroProtocolo)
	if proto.DataCriacao != nil {
		addField(pdf, "Data de Criação:", proto.DataCriacao.Format("02/01/2006"))
	}
	addField(pdf, "Assunto:", proto.Assunto)
	if proto.NomeProjeto != "" {
		addField(pdf, "Projeto:", proto.NomeProjeto)
	}
	if proto.CodigoConvenio != "" {
		addField(pdf, "Convênio:", proto.CodigoConvenio)
	}
	addField(pdf, "Interessado:", proto.NomeInteressado)
	addField(pdf, "Setor Atual:", proto.NomeSetorAtual)
	addField(pdf, "Status:", proto.Status)
	addField(pdf, "Documentos:", fmt.Sprintf("%d", proto.DocCount))
	addField(pdf, "Observações:", fmt.Sprintf("%d", proto.ObservationCount))
	if proto.TramitacaoCount > 0 {
		addField(pdf, "Tramitações:", fmt.Sprintf("%d", proto.TramitacaoCount))
	}
	pdf.Ln(6)

	// Lista de documentos
	if len(docs) > 0 {
		pdf.SetFont("Helvetica", "B", 13)
		pdf.CellFormat(0, 8, encode("Documentos Anexados"), "", 1, "L", false, 0, "")
		pdf.SetDrawColor(0, 102, 204)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(4)

		for i, doc := range docs {
			pdf.SetFont("Helvetica", "B", 9)
			pdf.CellFormat(0, 5, encode(fmt.Sprintf("%d. %s", i+1, doc.NomeArquivo)), "", 1, "L", false, 0, "")

			pdf.SetFont("Helvetica", "", 8)
			tipoNome := doc.TipoDocumentoNome
			if tipoNome == "" {
				tipoNome = "Sem tipo"
			}
			desc := doc.Descricao.String
			if desc == "" {
				desc = "-"
			}
			size := formatFileSize(doc.TamanhoBytes.Int64)
			uploadDate := ""
			if doc.UploadedAt.Valid {
				uploadDate = doc.UploadedAt.Time.Format("02/01/2006 15:04")
			}
			uploaderName := doc.UploadedByName.String
			if uploaderName == "" {
				uploaderName = doc.UploadedBy
			}

			info := fmt.Sprintf("   Tipo: %s | Tamanho: %s | Enviado por: %s", tipoNome, size, uploaderName)
			if uploadDate != "" {
				info += fmt.Sprintf(" em %s", uploadDate)
			}
			pdf.CellFormat(0, 4, encode(info), "", 1, "L", false, 0, "")

			if desc != "-" {
				pdf.CellFormat(0, 4, encode(fmt.Sprintf("   Descrição: %s", desc)), "", 1, "L", false, 0, "")
			}
			pdf.Ln(2)
		}
		pdf.Ln(4)
	}

	// Observações
	if obs != nil && len(obs.Data) > 0 {
		pdf.SetFont("Helvetica", "B", 13)
		pdf.CellFormat(0, 8, encode("Observações"), "", 1, "L", false, 0, "")
		pdf.SetDrawColor(0, 102, 204)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(4)

		for _, o := range obs.Data {
			marker := ""
			if o.IsImportant {
				marker = "[IMPORTANTE] "
			}

			pdf.SetFont("Helvetica", "B", 9)
			header := fmt.Sprintf("%s%s — %s", marker, o.CreatedByName, o.CreatedBySector)
			if o.CreatedAt != nil {
				header += fmt.Sprintf(" (%s)", o.CreatedAt.Format("02/01/2006 15:04"))
			}
			pdf.CellFormat(0, 5, encode(header), "", 1, "L", false, 0, "")

			pdf.SetFont("Helvetica", "", 9)
			// Multiline content
			pdf.MultiCell(0, 4, encode(o.Content), "", "L", false)
			pdf.Ln(3)
		}
		pdf.Ln(4)
	}

	// Tramitação
	if tram != nil && len(tram.Data) > 0 {
		pdf.SetFont("Helvetica", "B", 13)
		pdf.CellFormat(0, 8, encode("Histórico de Tramitação"), "", 1, "L", false, 0, "")
		pdf.SetDrawColor(0, 102, 204)
		pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
		pdf.Ln(4)

		// Resumo
		pdf.SetFont("Helvetica", "", 9)
		pdf.CellFormat(0, 5, encode(fmt.Sprintf("Tempo total: %d dias | Setores: %d | Setor com mais tempo: %s (%d dias)",
			tram.Resumo.TempoTotalDias, tram.Resumo.TotalSetores,
			tram.Resumo.SetorMaisLongo, tram.Resumo.DiasSetorMaisLongo)), "", 1, "L", false, 0, "")
		pdf.Ln(3)

		// Tabela de tramitação
		pdf.SetFont("Helvetica", "B", 8)
		colWidths := []float64{12, 30, 50, 50, 30, 18}
		headers := []string{"Seq", "Data", "Setor Origem", "Setor Destino", "Situação", "Dias"}
		for i, h := range headers {
			pdf.CellFormat(colWidths[i], 6, encode(h), "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)

		pdf.SetFont("Helvetica", "", 7)
		for _, t := range tram.Data {
			dataStr := ""
			if t.DataMovimentacao != nil {
				dataStr = t.DataMovimentacao.Format("02/01/2006")
			}
			pdf.CellFormat(colWidths[0], 5, fmt.Sprintf("%d", t.Sequencia), "1", 0, "C", false, 0, "")
			pdf.CellFormat(colWidths[1], 5, dataStr, "1", 0, "C", false, 0, "")
			pdf.CellFormat(colWidths[2], 5, encode(truncate(t.SetorOrigem, 30)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colWidths[3], 5, encode(truncate(t.SetorDestino, 30)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colWidths[4], 5, encode(truncate(t.Situacao, 18)), "1", 0, "L", false, 0, "")
			pdf.CellFormat(colWidths[5], 5, fmt.Sprintf("%d", t.PermanenciaDias), "1", 0, "C", false, 0, "")
			pdf.Ln(-1)
		}
	}

	// Rodapé
	pdf.Ln(10)
	pdf.SetFont("Helvetica", "I", 7)
	pdf.CellFormat(0, 4, encode("GED FADEX — Sistema de Gestão Eletrônica de Documentos"), "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("erro ao gerar PDF: %w", err)
	}

	return buf.Bytes(), nil
}

// --- Helpers ---

// encode converte string UTF-8 para ISO-8859-1 (Latin1) para o fpdf.
func encode(s string) string {
	// fpdf usa ISO-8859-1 por padrão. Fazemos best-effort de conversão.
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

// uniqueFileName garante nomes únicos no ZIP adicionando sufixo numérico.
func uniqueFileName(name string, used map[string]int) string {
	if _, ok := used[name]; !ok {
		used[name] = 1
		return name
	}
	used[name]++
	ext := ""
	base := name
	if idx := strings.LastIndex(name, "."); idx != -1 {
		ext = name[idx:]
		base = name[:idx]
	}
	return fmt.Sprintf("%s_%d%s", base, used[name], ext)
}

// formatFileSize formata tamanho em bytes para exibição humana.
func formatFileSize(bytes int64) string {
	if bytes < 1024 {
		return fmt.Sprintf("%d B", bytes)
	}
	kb := float64(bytes) / 1024
	if kb < 1024 {
		return fmt.Sprintf("%.1f KB", kb)
	}
	mb := kb / 1024
	return fmt.Sprintf("%.1f MB", mb)
}

// truncate trunca uma string para um tamanho máximo.
func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

// addField adiciona um par label/valor ao PDF.
func addField(pdf *fpdf.Fpdf, label, value string) {
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(40, 6, encode(label), "", 0, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, encode(value), "", 1, "L", false, 0, "")
}
