'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DashboardData, DashboardFilters } from '@/lib/types';

// ============================================
// Fetch — chamada à API Go real
// Endpoints: GET /api/dashboard/kpis, uploads-periodo, etc.
// ============================================

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const result = await fn();
    return result ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchDashboard(
  filters: DashboardFilters
): Promise<DashboardData> {
  const params = new URLSearchParams();
  params.set('periodo', filters.periodo);
  if (filters.setor !== 'all') params.set('setor', filters.setor);
  if (filters.projeto !== 'all') params.set('projeto', filters.projeto);

  const qs = params.toString();

  const [kpis, uploadsPeriodo, docsPorTipo, tramitacaoPorSetor, rankingUploads, protocolosSemDocs] =
    await Promise.all([
      safeFetch(() => apiClient.get<DashboardData['kpis']>(`/dashboard/kpis?${qs}`), []),
      safeFetch(() => apiClient.get<DashboardData['uploadsPeriodo']>(`/dashboard/uploads-periodo?${qs}`), []),
      safeFetch(() => apiClient.get<DashboardData['docsPorTipo']>(`/dashboard/docs-por-tipo?${qs}`), []),
      safeFetch(() => apiClient.get<DashboardData['tramitacaoPorSetor']>(`/dashboard/tramitacao-por-setor?${qs}`), []),
      safeFetch(() => apiClient.get<DashboardData['rankingUploads']>(`/dashboard/ranking-uploads?${qs}`), []),
      safeFetch(() => apiClient.get<DashboardData['protocolosSemDocs']>(`/dashboard/sem-documentos?${qs}`), []),
    ]);

  return {
    kpis,
    uploadsPeriodo,
    docsPorTipo,
    tramitacaoPorSetor,
    rankingUploads,
    protocolosSemDocs,
  };
}

// ============================================
// Hooks exportados
// ============================================

export function useDashboard(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', filters.periodo, filters.setor, filters.projeto],
    queryFn: () => fetchDashboard(filters),
    retry: false,
  });
}
