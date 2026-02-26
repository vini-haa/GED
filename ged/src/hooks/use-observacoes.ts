'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockObservacoes } from '@/lib/mock-observacoes';
import { mockTramitacoes } from '@/lib/mock-tramitacoes';
import { getCurrentUser } from '@/lib/auth';
import type { Observacao, TramitacaoSagi } from '@/lib/types';

// Estado local mutável para simular persistência durante a sessão
let localObservacoes = [...mockObservacoes];

// ============================================
// Funções de fetch mock
// TODO: Substituir por chamadas ao apiClient quando a API Go estiver pronta
// ============================================

async function fetchObservacoes(
  protocoloSagi: string
): Promise<Observacao[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return localObservacoes.filter((o) => o.protocoloSagi === protocoloSagi);
}

async function createObservacao(data: {
  protocoloSagi: string;
  texto: string;
  importante: boolean;
}): Promise<Observacao> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const user = getCurrentUser();

  const newObs: Observacao = {
    id: `obs_${Date.now()}`,
    protocoloSagi: data.protocoloSagi,
    texto: data.texto,
    autorEmail: user.email,
    autorNome: user.name,
    autorSetor: user.nomeSetor,
    importante: data.importante,
    criadoEm: new Date().toISOString(),
    editadoEm: null,
  };

  localObservacoes = [newObs, ...localObservacoes];
  return newObs;
}

async function updateObservacao(data: {
  id: string;
  texto: string;
}): Promise<Observacao> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  localObservacoes = localObservacoes.map((o) =>
    o.id === data.id
      ? { ...o, texto: data.texto, editadoEm: new Date().toISOString() }
      : o
  );

  const updated = localObservacoes.find((o) => o.id === data.id);
  if (!updated) throw new Error('Observação não encontrada');
  return updated;
}

async function deleteObservacao(params: {
  id: string;
  motivo: string;
}): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  localObservacoes = localObservacoes.filter((o) => o.id !== params.id);
}

async function toggleImportante(id: string): Promise<Observacao> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  localObservacoes = localObservacoes.map((o) =>
    o.id === id ? { ...o, importante: !o.importante } : o
  );

  const toggled = localObservacoes.find((o) => o.id === id);
  if (!toggled) throw new Error('Observação não encontrada');
  return toggled;
}

async function fetchTramitacoes(
  protocoloSagi: string
): Promise<TramitacaoSagi[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockTramitacoes
    .filter((t) => t.protocoloSagi === protocoloSagi)
    .sort(
      (a, b) =>
        new Date(a.tramitadoEm).getTime() -
        new Date(b.tramitadoEm).getTime()
    );
}

// ============================================
// Hooks exportados
// ============================================

export function useObservacoes(protocoloSagi: string) {
  return useQuery({
    queryKey: ['observacoes', protocoloSagi],
    queryFn: () => fetchObservacoes(protocoloSagi),
    enabled: !!protocoloSagi,
  });
}

export function useCreateObservacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createObservacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observacoes'] });
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

export function useTramitacoes(protocoloSagi: string) {
  return useQuery({
    queryKey: ['tramitacoes', protocoloSagi],
    queryFn: () => fetchTramitacoes(protocoloSagi),
    enabled: !!protocoloSagi,
  });
}
