package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"

	"github.com/fadex/ged-api/internal/db"
	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

type ProtocoloService struct {
	sagiRepo *repository.SAGIProtocoloRepository
	queries  *db.Queries
}

func NewProtocoloService(sagiRepo *repository.SAGIProtocoloRepository, queries *db.Queries) *ProtocoloService {
	return &ProtocoloService{
		sagiRepo: sagiRepo,
		queries:  queries,
	}
}

// List retorna protocolos paginados com enriquecimento do PostgreSQL.
func (s *ProtocoloService) List(ctx context.Context, q dto.ListProtocolosQuery) (*dto.ListProtocolosResponse, error) {
	q.Defaults()

	// Tab "internos" é tratado diferente — busca do PostgreSQL
	if q.Tab == "internos" {
		return s.listInternos(ctx, q)
	}

	if s.sagiRepo == nil {
		return nil, fmt.Errorf("SAGI indisponível")
	}

	// Quando filtra por setor sem ordenação explícita, usa data_chegada_setor
	ordenacao := q.Ordenacao
	if ordenacao == "" && q.Setor != nil {
		ordenacao = "data_chegada_setor"
	}

	filters := repository.ProtocoloListFilters{
		Setor:      q.Setor,
		Status:     q.Status,
		Search:     q.Search,
		DataInicio: q.DataInicio,
		DataFim:    q.DataFim,
		Offset:     q.Offset(),
		Limit:      q.PageSize,
		Ordenacao:  ordenacao,
		Projeto:    q.Projeto,
	}

	// Se tab=meu_setor e setor não informado, o handler deve ter setado do contexto
	if q.Tab == "meu_setor" && q.Setor == nil {
		return &dto.ListProtocolosResponse{
			Data:       []dto.ProtocoloItem{},
			Pagination: dto.Pagination{Page: q.Page, PageSize: q.PageSize},
		}, nil
	}

	protocolos, err := s.sagiRepo.ListProtocolos(ctx, filters)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar protocolos: %w", err)
	}

	total, err := s.sagiRepo.CountProtocolos(ctx, filters)
	if err != nil {
		log.Error().Err(err).Msg("erro ao contar protocolos, usando len(data)")
		total = int64(len(protocolos))
	}

	// Coletar números de protocolo para enriquecer com PostgreSQL
	// (documentos.protocolo_sagi armazena o número, não o Codigo inteiro)
	protoNums := make([]string, len(protocolos))
	for i, p := range protocolos {
		protoNums[i] = p.NumeroProtocolo
	}

	docCounts, obsFlags := s.enrichFromPostgres(ctx, protoNums)

	// Tab "sem_docs": filtrar após enriquecer
	if q.Tab == "sem_docs" {
		return s.filterSemDocs(ctx, q, filters, docCounts)
	}

	items := make([]dto.ProtocoloItem, len(protocolos))
	for i, p := range protocolos {
		items[i] = dto.ProtocoloItem{
			ID:                    p.ID,
			NumeroProtocolo:       p.NumeroProtocolo,
			DataCriacao:           p.DataCriacao,
			Assunto:               p.Assunto,
			NomeProjeto:           p.NomeProjeto,
			CodigoConvenio:        p.CodigoConvenio,
			NomeInteressado:       p.NomeInteressado,
			NomeSetorAtual:        p.NomeSetorAtual,
			CodSetorAtual:         p.CodSetorAtual,
			DataChegadaSetor:      p.DataChegadaSetor,
			Status:                p.Status,
			DocCount:              docCounts[p.NumeroProtocolo],
			IsNew:                 isNew(p.DataChegadaSetor),
			HasRecentObservations: obsFlags[p.NumeroProtocolo],
			IsInternal:            false,
		}
	}

	return &dto.ListProtocolosResponse{
		Data: items,
		Pagination: dto.Pagination{
			Page:       q.Page,
			PageSize:   q.PageSize,
			Total:      total,
			TotalPages: dto.CalcTotalPages(total, q.PageSize),
		},
	}, nil
}

// filterSemDocs faz uma abordagem diferente: busca todos do setor e filtra os sem docs.
func (s *ProtocoloService) filterSemDocs(ctx context.Context, q dto.ListProtocolosQuery, filters repository.ProtocoloListFilters, docCounts map[string]int64) (*dto.ListProtocolosResponse, error) {
	// Busca sem paginação para obter os IDs sem docs, depois pagina
	allFilters := filters
	allFilters.Offset = 0
	allFilters.Limit = 5000 // Limite razoável para um setor

	allProtos, err := s.sagiRepo.ListProtocolos(ctx, allFilters)
	if err != nil {
		return nil, err
	}

	// Enriquecer todos com números de protocolo
	allNums := make([]string, len(allProtos))
	for i, p := range allProtos {
		allNums[i] = p.NumeroProtocolo
	}
	allDocCounts, allObsFlags := s.enrichFromPostgres(ctx, allNums)

	// Filtrar sem docs
	var semDocs []repository.ProtocoloDocumento
	for _, p := range allProtos {
		if allDocCounts[p.NumeroProtocolo] == 0 {
			semDocs = append(semDocs, p)
		}
	}

	total := int64(len(semDocs))

	// Paginar manualmente
	start := q.Offset()
	end := start + q.PageSize
	if start > len(semDocs) {
		start = len(semDocs)
	}
	if end > len(semDocs) {
		end = len(semDocs)
	}
	page := semDocs[start:end]

	items := make([]dto.ProtocoloItem, len(page))
	for i, p := range page {
		items[i] = dto.ProtocoloItem{
			ID:                    p.ID,
			NumeroProtocolo:       p.NumeroProtocolo,
			DataCriacao:           p.DataCriacao,
			Assunto:               p.Assunto,
			NomeProjeto:           p.NomeProjeto,
			CodigoConvenio:        p.CodigoConvenio,
			NomeInteressado:       p.NomeInteressado,
			NomeSetorAtual:        p.NomeSetorAtual,
			CodSetorAtual:         p.CodSetorAtual,
			DataChegadaSetor:      p.DataChegadaSetor,
			Status:                p.Status,
			DocCount:              0,
			IsNew:                 isNew(p.DataChegadaSetor),
			HasRecentObservations: allObsFlags[p.NumeroProtocolo],
			IsInternal:            false,
		}
	}

	return &dto.ListProtocolosResponse{
		Data: items,
		Pagination: dto.Pagination{
			Page:       q.Page,
			PageSize:   q.PageSize,
			Total:      total,
			TotalPages: dto.CalcTotalPages(total, q.PageSize),
		},
	}, nil
}

// listInternos busca protocolos internos do PostgreSQL.
func (s *ProtocoloService) listInternos(ctx context.Context, q dto.ListProtocolosQuery) (*dto.ListProtocolosResponse, error) {
	params := db.ListProtocolosInternosParams{
		Limit:  int32(q.PageSize),
		Offset: int32(q.Offset()),
	}
	if q.Status != "" {
		params.Status = pgtype.Text{String: q.Status, Valid: true}
	}
	if q.Search != "" {
		params.Busca = pgtype.Text{String: q.Search, Valid: true}
	}

	internos, err := s.queries.ListProtocolosInternos(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("erro ao listar protocolos internos: %w", err)
	}

	countParams := db.CountProtocolosInternosParams{
		Status: params.Status,
		Busca:  params.Busca,
	}
	total, err := s.queries.CountProtocolosInternos(ctx, countParams)
	if err != nil {
		total = int64(len(internos))
	}

	items := make([]dto.ProtocoloItem, len(internos))
	for i, p := range internos {
		var dataCriacao *time.Time
		if p.CriadoEm.Valid {
			dataCriacao = &p.CriadoEm.Time
		}
		status := "ABERTO"
		if p.Status.Valid {
			status = p.Status.String
		}
		items[i] = dto.ProtocoloItem{
			ID:              0,
			NumeroProtocolo: p.Numero,
			DataCriacao:     dataCriacao,
			Assunto:         p.Assunto,
			NomeProjeto:     "",
			NomeInteressado: p.CriadoPorNome,
			NomeSetorAtual:  p.SetorOrigem,
			Status:          status,
			IsInternal:      true,
		}
	}

	return &dto.ListProtocolosResponse{
		Data: items,
		Pagination: dto.Pagination{
			Page:       q.Page,
			PageSize:   q.PageSize,
			Total:      total,
			TotalPages: dto.CalcTotalPages(total, q.PageSize),
		},
	}, nil
}

// Counters retorna contadores do cabeçalho.
func (s *ProtocoloService) Counters(ctx context.Context, codSetor int) (*dto.ContadoresResponse, error) {
	if s.sagiRepo == nil {
		return nil, fmt.Errorf("SAGI indisponível")
	}

	// Total de protocolos no setor
	totalProtos, err := s.sagiRepo.CountProtocolosNoSetor(ctx, codSetor)
	if err != nil {
		return nil, err
	}

	// Listar números para cross-check
	numeros, err := s.sagiRepo.ListProtocoloNumerosBySetor(ctx, codSetor)
	if err != nil {
		log.Error().Err(err).Msg("erro ao listar números para contadores")
		return &dto.ContadoresResponse{TotalProtocolos: totalProtos}, nil
	}

	if len(numeros) == 0 {
		return &dto.ContadoresResponse{TotalProtocolos: totalProtos}, nil
	}

	// Contar docs anexados
	docsAnexados, err := s.queries.CountDocsByProtocoloIDsForSetor(ctx, numeros)
	if err != nil {
		log.Error().Err(err).Msg("erro ao contar docs para contadores")
		docsAnexados = 0
	}

	// Contar protocolos que TÊM docs (para calcular sem docs)
	docCounts, err := s.queries.CountDocsByProtocoloIDs(ctx, numeros)
	if err != nil {
		log.Error().Err(err).Msg("erro ao contar docs por protocolo")
		docCounts = nil
	}

	protocolosComDocs := int64(len(docCounts))
	semDocs := totalProtos - protocolosComDocs
	if semDocs < 0 {
		semDocs = 0
	}

	return &dto.ContadoresResponse{
		TotalProtocolos: totalProtos,
		SemDocumentos:   semDocs,
		DocsAnexados:    docsAnexados,
	}, nil
}

// Recent retorna protocolos recentes do usuário.
func (s *ProtocoloService) Recent(ctx context.Context, userEmail string, limit int) (*dto.ListProtocolosResponse, error) {
	recents, err := s.queries.ListRecentProtocols(ctx, db.ListRecentProtocolsParams{
		UserEmail: userEmail,
		Limit:     int32(limit),
	})
	if err != nil {
		return nil, fmt.Errorf("erro ao listar protocolos recentes: %w", err)
	}

	if len(recents) == 0 {
		return &dto.ListProtocolosResponse{
			Data:       []dto.ProtocoloItem{},
			Pagination: dto.Pagination{Page: 1, PageSize: limit, Total: 0, TotalPages: 0},
		}, nil
	}

	// Separar SAGI e internos
	var sagiIDs []int
	for _, r := range recents {
		if r.ProtocolType == "sagi" {
			id, err := strconv.Atoi(r.ProtocolID)
			if err == nil {
				sagiIDs = append(sagiIDs, id)
			}
		}
	}

	// Buscar dados do SAGI
	var sagiMap map[int]repository.ProtocoloDocumento
	if s.sagiRepo != nil && len(sagiIDs) > 0 {
		protos, err := s.sagiRepo.GetProtocolosByIDs(ctx, sagiIDs)
		if err != nil {
			log.Error().Err(err).Msg("erro ao buscar protocolos recentes do SAGI")
		} else {
			sagiMap = make(map[int]repository.ProtocoloDocumento, len(protos))
			for _, p := range protos {
				sagiMap[p.ID] = p
			}
		}
	}

	// Enriquecer com doc counts
	protoIDs := make([]string, 0, len(recents))
	for _, r := range recents {
		protoIDs = append(protoIDs, r.ProtocolID)
	}
	docCounts, obsFlags := s.enrichFromPostgres(ctx, protoIDs)

	items := make([]dto.ProtocoloItem, 0, len(recents))
	for _, r := range recents {
		if r.ProtocolType == "sagi" {
			id, _ := strconv.Atoi(r.ProtocolID)
			if p, ok := sagiMap[id]; ok {
				items = append(items, dto.ProtocoloItem{
					ID:                    p.ID,
					NumeroProtocolo:       p.NumeroProtocolo,
					DataCriacao:           p.DataCriacao,
					Assunto:               p.Assunto,
					NomeProjeto:           p.NomeProjeto,
					CodigoConvenio:        p.CodigoConvenio,
					NomeInteressado:       p.NomeInteressado,
					NomeSetorAtual:        p.NomeSetorAtual,
					CodSetorAtual:         p.CodSetorAtual,
					DataChegadaSetor:      p.DataChegadaSetor,
					Status:                p.Status,
					DocCount:              docCounts[r.ProtocolID],
					IsNew:                 isNew(p.DataChegadaSetor),
					HasRecentObservations: obsFlags[r.ProtocolID],
					IsInternal:            false,
				})
			}
		}
		// Protocolos internos recentes seriam tratados aqui se necessário
	}

	return &dto.ListProtocolosResponse{
		Data: items,
		Pagination: dto.Pagination{
			Page:       1,
			PageSize:   limit,
			Total:      int64(len(items)),
			TotalPages: 1,
		},
	}, nil
}

// enrichFromPostgres busca doc_count e has_recent_observations do PostgreSQL em batch.
func (s *ProtocoloService) enrichFromPostgres(ctx context.Context, protoIDs []string) (docCounts map[string]int64, obsFlags map[string]bool) {
	docCounts = make(map[string]int64)
	obsFlags = make(map[string]bool)

	if len(protoIDs) == 0 {
		return
	}

	docs, err := s.queries.CountDocsByProtocoloIDs(ctx, protoIDs)
	if err != nil {
		log.Error().Err(err).Msg("erro ao enriquecer doc_count")
	} else {
		for _, d := range docs {
			docCounts[d.ProtocoloSagi] = d.DocCount
		}
	}

	obs, err := s.queries.HasRecentObservations(ctx, protoIDs)
	if err != nil {
		log.Error().Err(err).Msg("erro ao enriquecer observações recentes")
	} else {
		for _, o := range obs {
			obsFlags[o.ProtocoloSagi] = o.ObsCount > 0
		}
	}

	return
}

// GetByID retorna os detalhes completos de um protocolo.
func (s *ProtocoloService) GetByID(ctx context.Context, source, id string) (*dto.ProtocoloDetalheResponse, error) {
	switch source {
	case "sagi":
		return s.getSAGIByID(ctx, id)
	case "interno":
		return s.getInternoByID(ctx, id)
	default:
		return nil, fmt.Errorf("source inválido: %s", source)
	}
}

func (s *ProtocoloService) getSAGIByID(ctx context.Context, id string) (*dto.ProtocoloDetalheResponse, error) {
	idInt, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("ID inválido: %s", id)
	}

	if s.sagiRepo == nil {
		return nil, fmt.Errorf("SAGI indisponível")
	}

	proto, err := s.sagiRepo.GetProtocoloByID(ctx, idInt)
	if err != nil {
		return nil, err
	}

	// Enriquecer com dados do PostgreSQL
	var docCount int64
	var obsCount int64
	var hasRecentObs bool
	var tramitacaoCount int64

	docCount, _ = s.queries.CountDocumentosByProtocolo(ctx, proto.NumeroProtocolo)
	obsCount, _ = s.queries.CountObservacoesByProtocolo(ctx, proto.NumeroProtocolo)

	obsFlags, _ := s.queries.HasRecentObservations(ctx, []string{proto.NumeroProtocolo})
	for _, o := range obsFlags {
		if o.ProtocoloSagi == proto.NumeroProtocolo && o.ObsCount > 0 {
			hasRecentObs = true
		}
	}

	tramitacaoCount, _ = s.sagiRepo.CountTramitacoesByProtocolo(ctx, proto.ID)

	return &dto.ProtocoloDetalheResponse{
		ID:                    proto.ID,
		NumeroProtocolo:       proto.NumeroProtocolo,
		DataCriacao:           proto.DataCriacao,
		Assunto:               proto.Assunto,
		NomeProjeto:           proto.NomeProjeto,
		CodigoConvenio:        proto.CodigoConvenio,
		NomeInteressado:       proto.NomeInteressado,
		NomeSetorAtual:        proto.NomeSetorAtual,
		CodSetorAtual:         proto.CodSetorAtual,
		DataChegadaSetor:      proto.DataChegadaSetor,
		Status:                proto.Status,
		IsInternal:            false,
		DocCount:              docCount,
		ObservationCount:      obsCount,
		HasRecentObservations: hasRecentObs,
		TramitacaoCount:       tramitacaoCount,
	}, nil
}

func (s *ProtocoloService) getInternoByID(ctx context.Context, id string) (*dto.ProtocoloDetalheResponse, error) {
	idInt, err := strconv.Atoi(id)
	if err != nil {
		return nil, fmt.Errorf("ID de protocolo interno inválido: %w", err)
	}

	proto, err := s.queries.GetInternalProtocolByID(ctx, int32(idInt))
	if err != nil {
		return nil, fmt.Errorf("protocolo interno não encontrado: %w", err)
	}

	var dataCriacao *time.Time
	if proto.CreatedAt.Valid {
		dataCriacao = &proto.CreatedAt.Time
	}
	// Enriquecer
	var docCount int64
	var obsCount int64
	docCount, _ = s.queries.CountDocumentosByProtocolo(ctx, proto.ProtocolNumber)
	obsCount, _ = s.queries.CountObservacoesByProtocolo(ctx, proto.ProtocolNumber)

	return &dto.ProtocoloDetalheResponse{
		ID:               int(proto.ID),
		NumeroProtocolo:  proto.ProtocolNumber,
		DataCriacao:      dataCriacao,
		Assunto:          proto.Subject,
		NomeProjeto:      proto.ProjectName,
		NomeInteressado:  proto.Interested,
		NomeSetorAtual:   proto.CurrentSectorName,
		Status:           proto.Status,
		IsInternal:       true,
		DocCount:         docCount,
		ObservationCount: obsCount,
	}, nil
}

// TrackRecentView registra que o usuário visualizou um protocolo.
func (s *ProtocoloService) TrackRecentView(ctx context.Context, email, protocolID, protocolType string) error {
	return s.queries.UpsertRecentProtocol(ctx, db.UpsertRecentProtocolParams{
		UserEmail:    email,
		ProtocolID:   protocolID,
		ProtocolType: protocolType,
	})
}

func isNew(dataChegada *time.Time) bool {
	if dataChegada == nil {
		return false
	}
	return time.Since(*dataChegada) < 24*time.Hour
}
