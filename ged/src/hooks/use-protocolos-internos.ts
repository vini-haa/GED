'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  ProtocoloInterno,
  ProtocoloInternoDetalhe,
  TramitacaoInterna,
  ListInternalProtocolsResponse,
  MovementHistoryResponse,
  CreateProtocoloInternoRequest,
  UpdateProtocoloInternoRequest,
  ChangeStatusRequest,
  DispatchRequest,
} from '@/lib/types';

// ============================================
// Funções de fetch — chamadas à API Go real
// ============================================

interface ListInternalParams {
  page?: number;
  per_page?: number;
  setor?: number;
  status?: string;
}

async function fetchProtocolosInternos(
  params?: ListInternalParams
): Promise<ListInternalProtocolsResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.per_page) qs.set('per_page', String(params.per_page));
  if (params?.setor) qs.set('setor', String(params.setor));
  if (params?.status) qs.set('status', params.status);

  const query = qs.toString();
  return apiClient.get<ListInternalProtocolsResponse>(
    `/protocolos-internos${query ? `?${query}` : ''}`
  );
}

async function fetchProtocoloInternoDetail(
  id: number
): Promise<ProtocoloInternoDetalhe> {
  const resp = await apiClient.get<{ data: ProtocoloInternoDetalhe }>(`/protocolos-internos/${id}`);
  return resp.data;
}

async function createProtocoloInterno(
  data: CreateProtocoloInternoRequest
): Promise<ProtocoloInterno> {
  const resp = await apiClient.post<{ data: ProtocoloInterno }>('/protocolos-internos', data);
  return resp.data;
}

async function updateProtocoloInterno(params: {
  id: number;
  data: UpdateProtocoloInternoRequest;
}): Promise<ProtocoloInterno> {
  const resp = await apiClient.patch<{ data: ProtocoloInterno }>(
    `/protocolos-internos/${params.id}`,
    params.data
  );
  return resp.data;
}

async function updateStatusProtocoloInterno(params: {
  id: number;
  data: ChangeStatusRequest;
}): Promise<ProtocoloInterno> {
  const resp = await apiClient.patch<{ data: ProtocoloInterno }>(
    `/protocolos-internos/${params.id}/status`,
    params.data
  );
  return resp.data;
}

async function tramitarProtocoloInterno(params: {
  id: number;
  data: DispatchRequest;
}): Promise<TramitacaoInterna> {
  const resp = await apiClient.post<{ data: TramitacaoInterna }>(
    `/protocolos-internos/${params.id}/tramitar`,
    params.data
  );
  return resp.data;
}

async function fetchTramitacaoInterna(
  id: number
): Promise<MovementHistoryResponse> {
  return apiClient.get<MovementHistoryResponse>(
    `/protocolos-internos/${id}/tramitacao`
  );
}

async function deleteProtocoloInterno(params: {
  id: number;
  reason: string;
}): Promise<void> {
  await apiClient.delete(`/protocolos-internos/${params.id}`, {
    reason: params.reason,
  });
}

// ============================================
// Hooks exportados
// ============================================

export function useProtocolosInternos(params?: ListInternalParams) {
  return useQuery({
    queryKey: ['protocolos-internos', params],
    queryFn: () => fetchProtocolosInternos(params),
  });
}

export function useProtocoloInternoDetail(id: number) {
  return useQuery({
    queryKey: ['protocolo-interno', id],
    queryFn: () => fetchProtocoloInternoDetail(id),
    enabled: !!id,
  });
}

export function useCreateProtocoloInterno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProtocoloInterno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolos-internos'] });
    },
  });
}

export function useUpdateProtocoloInterno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProtocoloInterno,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['protocolos-internos'] });
      queryClient.invalidateQueries({
        queryKey: ['protocolo-interno', variables.id],
      });
    },
  });
}

export function useUpdateStatusProtocoloInterno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStatusProtocoloInterno,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['protocolos-internos'] });
      queryClient.invalidateQueries({
        queryKey: ['protocolo-interno', variables.id],
      });
    },
  });
}

export function useTramitarProtocoloInterno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tramitarProtocoloInterno,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['protocolos-internos'] });
      queryClient.invalidateQueries({
        queryKey: ['protocolo-interno', variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ['tramitacao-interna', variables.id],
      });
    },
  });
}

export function useDeleteProtocoloInterno() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProtocoloInterno,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocolos-internos'] });
    },
  });
}

export function useTramitacaoInterna(id: number) {
  return useQuery({
    queryKey: ['tramitacao-interna', id],
    queryFn: () => fetchTramitacaoInterna(id),
    enabled: !!id,
  });
}
