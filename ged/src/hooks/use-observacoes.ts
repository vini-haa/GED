'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Observacao,
  ListObservacoesResponse,
  TramitacaoResponse,
} from '@/lib/types';

// ============================================
// Funções de fetch — chamadas à API Go real
// ============================================

async function fetchObservacoes(
  source: string,
  id: number
): Promise<ListObservacoesResponse> {
  return apiClient.get<ListObservacoesResponse>(
    `/protocolos/${source}/${id}/observacoes`
  );
}

async function createObservacao(data: {
  source: string;
  id: number;
  content: string;
  is_important: boolean;
  parent_id?: string;
}): Promise<Observacao> {
  return apiClient.post<Observacao>(
    `/protocolos/${data.source}/${data.id}/observacoes`,
    {
      content: data.content,
      is_important: data.is_important,
      ...(data.parent_id && { parent_id: data.parent_id }),
    }
  );
}

async function updateObservacao(data: {
  id: string;
  content: string;
}): Promise<Observacao> {
  return apiClient.patch<Observacao>(`/observacoes/${data.id}`, {
    content: data.content,
  });
}

async function deleteObservacao(params: {
  id: string;
  motivo: string;
}): Promise<void> {
  await apiClient.delete(`/observacoes/${params.id}`, {
    motivo_exclusao: params.motivo,
  });
}

async function toggleImportante(id: string): Promise<Observacao> {
  return apiClient.patch<Observacao>(`/observacoes/${id}/importante`, {});
}

async function fetchTramitacoes(
  source: string,
  id: number
): Promise<TramitacaoResponse> {
  return apiClient.get<TramitacaoResponse>(
    `/protocolos/${source}/${id}/tramitacao`
  );
}

// ============================================
// Hooks exportados
// ============================================

export function useObservacoes(source: string, id: number) {
  return useQuery({
    queryKey: ['observacoes', source, id],
    queryFn: () => fetchObservacoes(source, id),
    enabled: !!id,
  });
}

export function useCreateObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createObservacao,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['observacoes', variables.source, variables.id],
      });
    },
  });
}

export function useUpdateObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateObservacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes'] });
    },
  });
}

export function useDeleteObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteObservacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes'] });
    },
  });
}

export function useToggleImportante() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleImportante,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes'] });
    },
  });
}

export function useTramitacoes(source: string, id: number) {
  return useQuery({
    queryKey: ['tramitacoes', source, id],
    queryFn: () => fetchTramitacoes(source, id),
    enabled: !!id,
  });
}
