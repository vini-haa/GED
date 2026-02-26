'use client';

import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { getCurrentUser } from '@/lib/auth';
import { mockProtocols, mockSetores } from '@/lib/mock-protocols';
import type {
  Protocol,
  ProtocolCounters,
  ProtocolFilters,
  PaginatedResult,
  Setor,
} from '@/lib/types';

// ============================================
// Funções de fetch mock
// TODO: Substituir por chamadas ao apiClient quando a API Go estiver pronta
// ============================================

// Simula protocolos recentemente acessados pelo usuário (mock de user_recent_protocols)
// TODO: Substituir por GET /api/user/recentes quando a API Go estiver pronta
const recentProtocolIds = new Set([
  'prot_1', // 1523/2026
  'prot_3', // 1521/2026
  'prot_5', // 1519/2026
  'prot_7', // 1517/2026
  'prot_10', // 1514/2026
  'prot_2', // 1522/2026
  'prot_4', // 1520/2026
  'prot_8', // 1516/2026
]);

function applyPeriodFilter(protocols: Protocol[], periodo: string): Protocol[] {
  if (periodo === 'all') return protocols;

  const now = new Date();
  const daysMap: Record<string, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  const days = daysMap[periodo];
  if (!days) return protocols;

  const cutoff = subDays(now, days);
  return protocols.filter((p) => new Date(p.dataProtocolo) >= cutoff);
}

async function fetchProtocolos(
  filters: ProtocolFilters
): Promise<PaginatedResult<Protocol>> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const user = getCurrentUser();
  let result = [...mockProtocols];

  // Filtro por aba
  switch (filters.tab) {
    case 'my-sector':
      result = result.filter(
        (p) =>
          p.codigoOrigem === user.codSetor ||
          p.codigoDestino === user.codSetor
      );
      break;
    case 'recents':
      result = result
        .filter((p) => recentProtocolIds.has(p.id))
        .sort(
          (a, b) =>
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
        );
      break;
    case 'no-docs':
      result = result.filter((p) => p.documentCount === 0);
      break;
    case 'internals':
      // Placeholder — protocolos internos virão da Semana 6
      result = [];
      break;
    case 'all':
    default:
      break;
  }

  // Filtro por busca
  if (filters.busca) {
    const q = filters.busca.toLowerCase();
    result = result.filter(
      (p) =>
        `${p.numeroProtocolo}/${p.anoProtocolo}`.includes(q) ||
        (p.assunto && p.assunto.toLowerCase().includes(q)) ||
        (p.projetoDescricao && p.projetoDescricao.toLowerCase().includes(q)) ||
        (p.setorOrigem && p.setorOrigem.toLowerCase().includes(q)) ||
        (p.setorDestino && p.setorDestino.toLowerCase().includes(q))
    );
  }

  // Filtro por status
  if (filters.status !== 'all') {
    result = result.filter((p) => p.situacao === filters.status);
  }

  // Filtro por setor
  if (filters.setor !== 'all') {
    result = result.filter(
      (p) =>
        p.codigoOrigem === filters.setor ||
        p.codigoDestino === filters.setor
    );
  }

  // Filtro por período
  result = applyPeriodFilter(result, filters.periodo);

  // Ordenar por data mais recente
  result.sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );

  // Paginação
  const total = result.length;
  const totalPages = Math.ceil(total / filters.perPage);
  const start = (filters.page - 1) * filters.perPage;
  const data = result.slice(start, start + filters.perPage);

  return {
    data,
    meta: {
      page: filters.page,
      per_page: filters.perPage,
      total,
      total_pages: totalPages,
    },
  };
}

async function fetchProtocoloCounters(): Promise<ProtocolCounters> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const user = getCurrentUser();
  const setorProtocols = mockProtocols.filter(
    (p) =>
      p.codigoOrigem === user.codSetor || p.codigoDestino === user.codSetor
  );

  return {
    totalSetor: setorProtocols.length,
    semDocumentos: mockProtocols.filter((p) => p.documentCount === 0).length,
    totalDocumentos: mockProtocols.reduce(
      (acc, p) => acc + p.documentCount,
      0
    ),
  };
}

async function fetchSetores(): Promise<Setor[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockSetores;
}

// ============================================
// Hooks exportados
// ============================================

export function useProtocolos(filters: ProtocolFilters) {
  return useQuery({
    queryKey: ['protocolos', filters],
    queryFn: () => fetchProtocolos(filters),
  });
}

export function useProtocoloCounters() {
  return useQuery({
    queryKey: ['protocolo-counters'],
    queryFn: fetchProtocoloCounters,
  });
}

export function useSetores() {
  return useQuery({
    queryKey: ['setores'],
    queryFn: fetchSetores,
    staleTime: 10 * 60 * 1000,
  });
}
