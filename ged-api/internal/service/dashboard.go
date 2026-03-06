package service

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

// Cores para o gráfico de pizza (docsPorTipo).
var tipoCores = []string{
	"#2563eb", "#7c3aed", "#0891b2", "#059669",
	"#d97706", "#dc2626", "#4f46e5", "#0d9488",
	"#c026d3", "#ea580c", "#65a30d", "#9333ea",
}

type DashboardService struct {
	queries  *db.Queries
	sagiDB   *sql.DB
	setorRepo *repository.SAGISetorRepository
}

func NewDashboardService(queries *db.Queries, sagiDB *sql.DB, setorRepo *repository.SAGISetorRepository) *DashboardService {
	return &DashboardService{
		queries:   queries,
		sagiDB:    sagiDB,
		setorRepo: setorRepo,
	}
}

// KPIs retorna os 4 KPIs do dashboard com variação percentual vs período anterior.
func (s *DashboardService) KPIs(ctx context.Context, q dto.DashboardQuery) ([]dto.DashboardKpi, error) {
	dataInicio := q.DataInicio()
	dataAnterior := q.DataInicioPeriodoAnterior()

	tsInicio := pgtype.Timestamp{Time: dataInicio, Valid: true}
	tsAnterior := pgtype.Timestamp{Time: dataAnterior, Valid: true}
	tsNull := pgtype.Timestamp{Valid: false}

	// 1. Total de protocolos no SAGI (setor do período)
	totalProtos, totalProtosAnterior := int64(0), int64(0)
	if s.sagiDB != nil {
		setorFilter := q.SetorFilter()
		var err error
		totalProtos, err = s.countProtocolosSAGI(ctx, dataInicio, setorFilter)
		if err != nil {
			log.Error().Err(err).Msg("dashboard: erro ao contar protocolos SAGI")
		}
		totalProtosAnterior, err = s.countProtocolosSAGI(ctx, dataAnterior, setorFilter)
		if err != nil {
			log.Error().Err(err).Msg("dashboard: erro ao contar protocolos anteriores SAGI")
		}
		// O anterior inclui o período atual, então subtrair
		totalProtosAnterior = totalProtosAnterior - totalProtos
	}

	// 2. Total de documentos
	totalDocs, _ := s.queries.DashboardCountDocumentos(ctx, db.DashboardCountDocumentosParams{
		Column1: tsInicio,
		Column2: "",
	})
	totalDocsAnterior, _ := s.queries.DashboardCountDocumentos(ctx, db.DashboardCountDocumentosParams{
		Column1: tsAnterior,
		Column2: "",
	})
	totalDocsAnterior = totalDocsAnterior - totalDocs

	// 3. Total de observações
	totalObs, _ := s.queries.DashboardCountObservacoes(ctx, tsInicio)
	totalObsAnterior, _ := s.queries.DashboardCountObservacoes(ctx, tsAnterior)
	totalObsAnterior = totalObsAnterior - totalObs

	// 4. Protocolos sem documentos (do setor, se filtrado)
	semDocs := int64(0)
	semDocsAnterior := int64(0)
	if s.sagiDB != nil {
		setorFilter := q.SetorFilter()
		totalSetorAtual, _ := s.countProtocolosSAGI(ctx, dataInicio, setorFilter)
		comDocs, _ := s.countProtocolosComDocs(ctx, tsNull)
		semDocs = totalSetorAtual - comDocs
		if semDocs < 0 {
			semDocs = 0
		}

		totalSetorAnterior, _ := s.countProtocolosSAGI(ctx, dataAnterior, setorFilter)
		semDocsAnterior = totalSetorAnterior - totalSetorAtual - comDocs
		if semDocsAnterior < 0 {
			semDocsAnterior = 0
		}
	}

	kpis := []dto.DashboardKpi{
		{
			Label:    "Total de Protocolos",
			Valor:    totalProtos,
			Variacao: calcVariacao(totalProtos, totalProtosAnterior),
			Formato:  "numero",
		},
		{
			Label:    "Documentos Anexados",
			Valor:    totalDocs,
			Variacao: calcVariacao(totalDocs, totalDocsAnterior),
			Formato:  "numero",
		},
		{
			Label:    "Protocolos sem Docs",
			Valor:    semDocs,
			Variacao: calcVariacao(semDocs, semDocsAnterior),
			Formato:  "numero",
		},
		{
			Label:    "Total de Observações",
			Valor:    totalObs,
			Variacao: calcVariacao(totalObs, totalObsAnterior),
			Formato:  "numero",
		},
	}

	return kpis, nil
}

// UploadsPorPeriodo retorna os dados para o gráfico de linha (uploads + protocolos criados por dia).
func (s *DashboardService) UploadsPorPeriodo(ctx context.Context, q dto.DashboardQuery) ([]dto.UploadsPeriodoItem, error) {
	dataInicio := q.DataInicio()
	ts := pgtype.Timestamp{Time: dataInicio, Valid: true}

	// Mapa dia -> item agregado
	dayMap := make(map[string]*dto.UploadsPeriodoItem)

	// 1. Uploads de documentos (PostgreSQL)
	uploadRows, err := s.queries.DashboardUploadsPorDia(ctx, ts)
	if err != nil {
		log.Error().Err(err).Msg("dashboard: erro ao buscar uploads por dia")
	} else {
		for _, r := range uploadRows {
			if _, ok := dayMap[r.Data]; !ok {
				dayMap[r.Data] = &dto.UploadsPeriodoItem{Data: r.Data}
			}
			dayMap[r.Data].Uploads = r.Total
		}
	}

	// 2. Protocolos internos criados (PostgreSQL)
	tstz := pgtype.Timestamptz{Time: dataInicio, Valid: true}
	internosRows, err := s.queries.DashboardProtocolosInternosPorDia(ctx, tstz)
	if err != nil {
		log.Error().Err(err).Msg("dashboard: erro ao buscar protocolos internos por dia")
	} else {
		for _, r := range internosRows {
			if _, ok := dayMap[r.Data]; !ok {
				dayMap[r.Data] = &dto.UploadsPeriodoItem{Data: r.Data}
			}
			dayMap[r.Data].ProtocolosInternos = r.Total
		}
	}

	// 3. Protocolos SAGI criados (SQL Server)
	if s.sagiDB != nil {
		sagiRows, err := s.protocolosSAGIPorDia(ctx, dataInicio)
		if err != nil {
			log.Error().Err(err).Msg("dashboard: erro ao buscar protocolos SAGI por dia")
		} else {
			for _, r := range sagiRows {
				if _, ok := dayMap[r.data]; !ok {
					dayMap[r.data] = &dto.UploadsPeriodoItem{Data: r.data}
				}
				dayMap[r.data].ProtocolosExternos = r.total
			}
		}
	}

	// Gerar série completa de dias (preencher dias sem dados com zeros)
	dias := q.PeriodoDays()
	dailyItems := make([]dto.UploadsPeriodoItem, 0, dias)
	for i := dias - 1; i >= 0; i-- {
		d := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
		if entry, ok := dayMap[d]; ok {
			dailyItems = append(dailyItems, *entry)
		} else {
			dailyItems = append(dailyItems, dto.UploadsPeriodoItem{Data: d})
		}
	}

	// Para períodos longos, agregar para melhor visualização
	if dias > 60 {
		return aggregateByPeriod(dailyItems, dias), nil
	}

	return dailyItems, nil
}

// aggregateByPeriod agrupa dados diários por semana (até 180d) ou mês (acima).
func aggregateByPeriod(items []dto.UploadsPeriodoItem, dias int) []dto.UploadsPeriodoItem {
	if len(items) == 0 {
		return items
	}

	bucketFormat := "2006-01" // mensal
	labelFormat := "Jan/2006"
	if dias <= 180 {
		// semanal: agrupar de 7 em 7 dias
		return aggregateByWeek(items)
	}

	buckets := make(map[string]*dto.UploadsPeriodoItem)
	var order []string

	for _, item := range items {
		t, err := time.Parse("2006-01-02", item.Data)
		if err != nil {
			continue
		}
		key := t.Format(bucketFormat)
		if _, ok := buckets[key]; !ok {
			buckets[key] = &dto.UploadsPeriodoItem{Data: t.Format(labelFormat)}
			order = append(order, key)
		}
		b := buckets[key]
		b.Uploads += item.Uploads
		b.ProtocolosExternos += item.ProtocolosExternos
		b.ProtocolosInternos += item.ProtocolosInternos
	}

	result := make([]dto.UploadsPeriodoItem, 0, len(order))
	for _, key := range order {
		result = append(result, *buckets[key])
	}
	return result
}

// aggregateByWeek agrupa dados diários em blocos de 7 dias.
func aggregateByWeek(items []dto.UploadsPeriodoItem) []dto.UploadsPeriodoItem {
	var result []dto.UploadsPeriodoItem

	for i := 0; i < len(items); i += 7 {
		end := i + 7
		if end > len(items) {
			end = len(items)
		}
		bucket := dto.UploadsPeriodoItem{
			Data: items[i].Data, // usa a data do primeiro dia da semana
		}
		for _, item := range items[i:end] {
			bucket.Uploads += item.Uploads
			bucket.ProtocolosExternos += item.ProtocolosExternos
			bucket.ProtocolosInternos += item.ProtocolosInternos
		}
		result = append(result, bucket)
	}

	return result
}

type sagiDayCount struct {
	data  string
	total int64
}

// protocolosSAGIPorDia busca quantidade de protocolos SAGI criados por dia.
func (s *DashboardService) protocolosSAGIPorDia(ctx context.Context, desde time.Time) ([]sagiDayCount, error) {
	ctx2, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	query := `
SELECT
    CONVERT(VARCHAR(10), d.data, 120) AS dia,
    COUNT(*) AS total
FROM documento d
WHERE (d.deletado IS NULL OR d.deletado = 0)
  AND d.data >= @pDesde
GROUP BY CONVERT(VARCHAR(10), d.data, 120)
ORDER BY dia`

	rows, err := s.sagiDB.QueryContext(ctx2, query, sql.Named("pDesde", desde))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []sagiDayCount
	for rows.Next() {
		var item sagiDayCount
		if err := rows.Scan(&item.data, &item.total); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// DocsPorTipo retorna os dados para o gráfico de pizza.
func (s *DashboardService) DocsPorTipo(ctx context.Context, q dto.DashboardQuery) ([]dto.DocsPorTipoItem, error) {
	dataInicio := q.DataInicio()
	ts := pgtype.Timestamp{Time: dataInicio, Valid: true}

	rows, err := s.queries.DashboardDocsPorTipo(ctx, ts)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar docs por tipo: %w", err)
	}

	items := make([]dto.DocsPorTipoItem, len(rows))
	for i, r := range rows {
		items[i] = dto.DocsPorTipoItem{
			Tipo:       r.Tipo,
			Quantidade: r.Quantidade,
			Cor:        tipoCores[i%len(tipoCores)],
		}
	}

	return items, nil
}

// TramitacaoPorSetor retorna tempo médio de permanência por setor (SAGI).
func (s *DashboardService) TramitacaoPorSetor(ctx context.Context, q dto.DashboardQuery) ([]dto.TramitacaoSetorItem, error) {
	if s.sagiDB == nil {
		return []dto.TramitacaoSetorItem{}, nil
	}

	dataInicio := q.DataInicio()

	query := `
SELECT
    setor_destino.DESCR COLLATE Latin1_General_CI_AI AS setor,
    AVG(
        CASE
            WHEN sm_next.data IS NOT NULL
                THEN DATEDIFF(DAY, sm.data, sm_next.data)
            ELSE DATEDIFF(DAY, sm.data, GETDATE())
        END
    ) AS media_dias,
    COUNT(*) AS total_movimentacoes
FROM scd_movimentacao sm
LEFT JOIN SETOR setor_destino ON setor_destino.CODIGO = sm.codSetorDestino
OUTER APPLY (
    SELECT TOP 1 sm2.data
    FROM scd_movimentacao sm2
    WHERE sm2.CodProt = sm.CodProt
      AND sm2.codigo > sm.codigo
      AND (sm2.Deletado IS NULL OR sm2.Deletado = 0)
    ORDER BY sm2.codigo ASC
) sm_next
WHERE (sm.Deletado IS NULL OR sm.Deletado = 0)
  AND sm.data >= @pDataInicio
  AND setor_destino.DESCR IS NOT NULL
GROUP BY setor_destino.DESCR
HAVING COUNT(*) >= 3
ORDER BY media_dias DESC`

	ctx2, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := s.sagiDB.QueryContext(ctx2, query, sql.Named("pDataInicio", dataInicio))
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar tramitação por setor: %w", err)
	}
	defer rows.Close()

	items := make([]dto.TramitacaoSetorItem, 0)
	totalDias := 0.0
	for rows.Next() {
		var setor string
		var mediaDias float64
		var totalMov int
		if err := rows.Scan(&setor, &mediaDias, &totalMov); err != nil {
			return nil, fmt.Errorf("erro ao escanear tramitação setor: %w", err)
		}
		mediaDias = math.Round(mediaDias*10) / 10
		setor = strings.TrimPrefix(setor, "- ")
		items = append(items, dto.TramitacaoSetorItem{
			Setor:          setor,
			TempoMedioDias: mediaDias,
		})
		totalDias += mediaDias
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro ao iterar tramitação setor: %w", err)
	}

	// Calcular média geral e marcar quem está acima
	if len(items) > 0 {
		mediaGeral := totalDias / float64(len(items))
		for i := range items {
			items[i].AcimaDaMedia = items[i].TempoMedioDias > mediaGeral
		}
	}

	return items, nil
}

// RankingUploads retorna o ranking de quem mais fez uploads.
func (s *DashboardService) RankingUploads(ctx context.Context, q dto.DashboardQuery, limit int) ([]dto.RankingUploadItem, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	dataInicio := q.DataInicio()
	ts := pgtype.Timestamp{Time: dataInicio, Valid: true}

	rows, err := s.queries.DashboardRankingUploads(ctx, db.DashboardRankingUploadsParams{
		Column1: ts,
		Limit:   int32(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar ranking uploads: %w", err)
	}

	items := make([]dto.RankingUploadItem, len(rows))
	for i, r := range rows {
		setor := ""
		// Tentar resolver setor via cache SAGI
		if s.setorRepo != nil {
			_, setorNome, err := s.setorRepo.GetUserSectorCode(ctx, r.Email)
			if err == nil {
				setor = setorNome
			}
		}
		items[i] = dto.RankingUploadItem{
			Posicao: i + 1,
			Nome:    r.Nome,
			Setor:   setor,
			Uploads: r.Uploads,
		}
	}

	return items, nil
}

// ProtocolosSemDocumentos retorna protocolos SAGI que não têm documentos no PostgreSQL.
func (s *DashboardService) ProtocolosSemDocumentos(ctx context.Context, q dto.DashboardQuery, page, limit int) ([]dto.ProtocoloSemDocs, error) {
	if s.sagiDB == nil {
		return []dto.ProtocoloSemDocs{}, nil
	}
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	// Buscar protocolos que JÁ têm documentos no PostgreSQL
	protosComDocs, err := s.queries.DashboardProtocolosComDocs(ctx)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar protocolos com docs: %w", err)
	}

	// Montar IN clause para exclusão no SAGI
	exclusionClause := ""
	args := []interface{}{
		sql.Named("pLimit", limit),
		sql.Named("pOffset", (page-1)*limit),
	}

	if len(protosComDocs) > 0 {
		placeholders := ""
		for i, num := range protosComDocs {
			paramName := fmt.Sprintf("pExcl%d", i)
			if i > 0 {
				placeholders += ", "
			}
			placeholders += "@" + paramName
			args = append(args, sql.Named(paramName, num))
		}
		exclusionClause = fmt.Sprintf("AND d.Numero NOT IN (%s)", placeholders)
	}

	setorFilter := ""
	if sf := q.SetorFilter(); sf != "" {
		setorFilter = "AND setor.DESCR COLLATE Latin1_General_CI_AI = @pSetor COLLATE Latin1_General_CI_AI"
		args = append(args, sql.Named("pSetor", sf))
	}

	query := fmt.Sprintf(`
SELECT
    CAST(d.Codigo AS VARCHAR) AS id,
    d.Numero AS numero,
    ISNULL(d.Assunto, '') COLLATE Latin1_General_CI_AI AS assunto,
    ISNULL(setor.DESCR, '') COLLATE Latin1_General_CI_AI AS setor_destino,
    DATEDIFF(DAY, d.data, GETDATE()) AS dias_sem_documento
FROM documento d
LEFT JOIN scd_movimentacao sm ON sm.CodProt = d.Codigo AND sm.RegAtual = 1
LEFT JOIN SETOR setor ON setor.CODIGO = sm.codSetorDestino
WHERE (d.deletado IS NULL OR d.deletado = 0)
  %s
  %s
  AND d.data IS NOT NULL
ORDER BY dias_sem_documento DESC
OFFSET @pOffset ROWS FETCH NEXT @pLimit ROWS ONLY`, exclusionClause, setorFilter)

	ctx2, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	rows, err := s.sagiDB.QueryContext(ctx2, query, args...)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar protocolos sem docs: %w", err)
	}
	defer rows.Close()

	items := make([]dto.ProtocoloSemDocs, 0)
	for rows.Next() {
		var item dto.ProtocoloSemDocs
		if err := rows.Scan(&item.ID, &item.Numero, &item.Assunto, &item.SetorDestino, &item.DiasSemDocumento); err != nil {
			return nil, fmt.Errorf("erro ao escanear protocolo sem docs: %w", err)
		}
		item.SetorDestino = strings.TrimPrefix(item.SetorDestino, "- ")
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("erro ao iterar protocolos sem docs: %w", err)
	}

	return items, nil
}

// --- Helpers ---

// countProtocolosSAGI conta protocolos no SAGI a partir de uma data, com filtro de setor opcional.
func (s *DashboardService) countProtocolosSAGI(ctx context.Context, desde time.Time, setor string) (int64, error) {
	ctx2, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()

	setorClause := ""
	args := []interface{}{sql.Named("pDesde", desde)}
	if setor != "" {
		setorClause = "AND setor.DESCR COLLATE Latin1_General_CI_AI = @pSetor COLLATE Latin1_General_CI_AI"
		args = append(args, sql.Named("pSetor", setor))
	}

	query := fmt.Sprintf(`
SELECT COUNT(*)
FROM documento d
LEFT JOIN scd_movimentacao sm ON sm.CodProt = d.Codigo AND sm.RegAtual = 1
LEFT JOIN SETOR setor ON setor.CODIGO = sm.codSetorDestino
WHERE (d.deletado IS NULL OR d.deletado = 0)
  AND d.data >= @pDesde
  %s`, setorClause)

	var count int64
	err := s.sagiDB.QueryRowContext(ctx2, query, args...).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// countProtocolosComDocs conta quantos protocolos distintos têm documentos no PostgreSQL.
func (s *DashboardService) countProtocolosComDocs(ctx context.Context, ts pgtype.Timestamp) (int64, error) {
	protos, err := s.queries.DashboardProtocolosComDocs(ctx)
	if err != nil {
		return 0, err
	}
	return int64(len(protos)), nil
}

// calcVariacao calcula a variação percentual entre dois valores.
func calcVariacao(atual, anterior int64) float64 {
	if anterior == 0 {
		if atual > 0 {
			return 100
		}
		return 0
	}
	variacao := (float64(atual-anterior) / float64(anterior)) * 100
	return math.Round(variacao*10) / 10
}
