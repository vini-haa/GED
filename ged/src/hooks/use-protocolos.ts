'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Protocol,
  ProtocolCounters,
  ProtocolFilters,
  PaginatedResult,
  Setor,
} from '@/lib/types';

// ============================================
// Funções de fetch — chamadas à API Go real
// ============================================

async function fetchProtocolos(
  filters: ProtocolFilters
): Promise<PaginatedResult<Protocol>> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('page_size', String(filters.pageSize));
  params.set('tab', filters.tab);

  if (filters.busca) params.set('search', filters.busca);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.setor !== 'all') params.set('setor', String(filters.setor));
  if (filters.periodo && filters.periodo !== 'all') {
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[filters.periodo];
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      params.set('data_inicio', cutoff.toISOString().split('T')[0]);
    }
  }
  if (filters.ordenacao) params.set('ordenacao', filters.ordenacao);
  if (filters.projeto) params.set('projeto', filters.projeto);

  return apiClient.get<PaginatedResult<Protocol>>(`/protocolos?${params.toString()}`);
}

async function fetchProtocoloCounters(setor: number): Promise<ProtocolCounters> {
  const resp = await apiClient.get<{ data: ProtocolCounters }>(`/protocolos/contadores?setor=${setor}`);
  return resp.data;
}

async function fetchSetores(): Promise<Setor[]> {
  const resp = await apiClient.get<{ data: Setor[] }>('/setores');
  return resp.data;
}

async function fetchRecentes(limit: number = 10): Promise<Protocol[]> {
  const resp = await apiClient.get<PaginatedResult<Protocol>>(`/user/recentes?limit=${limit}`);
  return resp.data;
}

// ============================================
// Hooks exportados
// ============================================

export function useProtocolos(filters: ProtocolFilters) {
  return useQuery({
    queryKey: ['protocolos', filters],
    queryFn: () => fetchProtocolos(filters),
    // Não buscar quando tab é "recentes" (usa useRecentes) ou "internos" (usa useProtocolosInternos)
    enabled: filters.tab !== 'recentes' && filters.tab !== 'internos',
  });
}

export function useProtocoloCounters(setor: number | null) {
  // setor=0 para admin sem setor (retorna contadores globais)
  const setorParam = setor ?? 0;
  return useQuery({
    queryKey: ['protocolo-counters', setorParam],
    queryFn: () => fetchProtocoloCounters(setorParam),
  });
}

export function useSetores() {
  return useQuery({
    queryKey: ['setores'],
    queryFn: fetchSetores,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecentes(limit: number = 10) {
  return useQuery({
    queryKey: ['recentes', limit],
    queryFn: () => fetchRecentes(limit),
    enabled: limit > 0,
  });
}

// ============================================
// Projetos SAGI
// ============================================

export interface ProjetoSAGI {
  numconv: number;
  titulo: string;
  num_oficial: string;
}

async function fetchProjetos(search: string): Promise<ProjetoSAGI[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const query = params.toString();
  const resp = await apiClient.get<{ data: ProjetoSAGI[] }>(
    `/projetos${query ? `?${query}` : ''}`
  );
  return resp.data;
}

export function useProjetos(search: string) {
  return useQuery({
    queryKey: ['projetos', search],
    queryFn: () => fetchProjetos(search),
    staleTime: 10 * 60 * 1000,
  });
}
