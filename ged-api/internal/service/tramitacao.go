package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"github.com/fadex/ged-api/internal/dto"
	"github.com/fadex/ged-api/internal/repository"
)

// TramitacaoService gerencia operações com tramitações de protocolos SAGI.
type TramitacaoService struct {
	tramRepo *repository.SAGITramitacaoRepository
}

// NewTramitacaoService cria uma instância do TramitacaoService.
func NewTramitacaoService(tramRepo *repository.SAGITramitacaoRepository) *TramitacaoService {
	return &TramitacaoService{tramRepo: tramRepo}
}

// GetByProtocolo retorna o histórico de tramitação com cálculo de permanência e resumo.
func (s *TramitacaoService) GetByProtocolo(ctx context.Context, protocolID int) (*dto.TramitacaoResponse, error) {
	if s.tramRepo == nil {
		return nil, fmt.Errorf("SAGI indisponível")
	}

	tramitacoes, err := s.tramRepo.ListByProtocolo(ctx, protocolID)
	if err != nil {
		return nil, fmt.Errorf("erro ao buscar tramitações: %w", err)
	}

	// Os resultados vêm ORDER BY sm.Sequencia DESC (mais recente primeiro)
	// Para calcular permanência, precisamos da ordem cronológica (ASC)
	items := make([]dto.TramitacaoItem, len(tramitacoes))
	now := time.Now()

	// Mapear setores para acumular dias
	setorDias := make(map[string]int)
	var primeiraData, ultimaData *time.Time
	setoresUnicos := make(map[string]bool)

	for i, t := range tramitacoes {
		permanencia := 0

		if t.DataMovimentacao != nil {
			if t.RegAtual {
				// Setor atual: dias desde a última movimentação até agora
				permanencia = daysBetween(*t.DataMovimentacao, now)
			} else if i > 0 && tramitacoes[i-1].DataMovimentacao != nil {
				// DESC order: tramitacoes[i-1] é a movimentação mais recente seguinte
				permanencia = daysBetween(*t.DataMovimentacao, *tramitacoes[i-1].DataMovimentacao)
			}

			// Track primeira e última data (invertido pois está DESC)
			if primeiraData == nil || t.DataMovimentacao.Before(*primeiraData) {
				primeiraData = t.DataMovimentacao
			}
			if ultimaData == nil || t.DataMovimentacao.After(*ultimaData) {
				ultimaData = t.DataMovimentacao
			}
		}

		if t.SetorDestino != "" {
			setoresUnicos[t.SetorDestino] = true
			setorDias[t.SetorDestino] += permanencia
		}

		items[i] = dto.TramitacaoItem{
			Sequencia:          t.Sequencia,
			DataMovimentacao:   t.DataMovimentacao,
			SetorOrigem:        t.SetorOrigem,
			SetorDestino:       t.SetorDestino,
			Situacao:           t.Situacao,
			RegAtual:           t.RegAtual,
			PermanenciaDias:    permanencia,
			UsuarioEnvio:       t.UsuarioEnvio,
			UsuarioRecebimento: t.UsuarioRecebimento,
			DataRecebimento:    t.DataRecebimento,
			Observacao:         t.Observacao,
		}
	}

	// Calcular resumo
	resumo := dto.TramitacaoResumo{
		TotalSetores: len(setoresUnicos),
	}

	if primeiraData != nil {
		resumo.TempoTotalDias = daysBetween(*primeiraData, now)
	}

	// Setor com mais dias
	maxDias := 0
	for setor, dias := range setorDias {
		if dias > maxDias {
			maxDias = dias
			resumo.SetorMaisLongo = setor
			resumo.DiasSetorMaisLongo = dias
		}
	}

	return &dto.TramitacaoResponse{
		Data:   items,
		Total:  len(items),
		Resumo: resumo,
	}, nil
}

// daysBetween calcula dias entre duas datas (arredondando para cima).
func daysBetween(start, end time.Time) int {
	diff := end.Sub(start)
	days := diff.Hours() / 24
	return int(math.Ceil(days))
}
