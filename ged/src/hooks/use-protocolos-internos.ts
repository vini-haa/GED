'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';
import {
  mockProtocolosInternos,
  mockTramitacoesInternas,
  getTramitacoesByProtocoloInterno,
} from '@/lib/mock-protocolos-internos';
import type {
  ProtocoloInterno,
  ProtocoloInternoDetalhes,
  TramitacaoInterna,
  StatusProtocoloInterno,
  CreateProtocoloInternoRequest,
  UpdateProtocoloInternoRequest,
  PaginatedResult,
} from '@/lib/types';

// ============================================
// Estado local mutável para simular persistência
// TODO: Substituir por chamadas ao apiClient quando a API Go estiver pronta
// ============================================

let localProtocolos = [...mockProtocolosInternos];
let localTramitacoes = [...mockTramitacoesInternas];
let nextNumero = 16; // Próximo número para GED-2026-XXX

// ============================================
// Funções de fetch mock
// ============================================

async function fetchProtocolosInternos(): Promise<ProtocoloInterno[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return [...localProtocolos].sort(
    (a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
  );
}

async function fetchProtocoloInternoDetail(
  id: string
): Promise<ProtocoloInternoDetalhes> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const protocolo = localProtocolos.find((p) => p.id === id);
  if (!protocolo) throw new Error('Protocolo interno não encontrado');

  const tramitacoes = localTramitacoes
    .filter((t) => t.protocoloInternoId === id)
    .sort(
      (a, b) =>
        new Date(a.tramitadoEm).getTime() - new Date(b.tramitadoEm).getTime()
    );

  return { protocolo, tramitacoes };
}

async function createProtocoloInterno(
  data: CreateProtocoloInternoRequest
): Promise<ProtocoloInterno> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const user = getCurrentUser();
  const numero = `GED-2026-${String(nextNumero).padStart(3, '0')}`;
  nextNumero++;

  const novo: ProtocoloInterno = {
    id: `gpi_${Date.now()}`,
    numero,
    assunto: data.assunto,
    descricao: data.descricao || null,
    status: 'ABERTO',
    setorOrigem: data.setorOrigem,
    criadoPorEmail: user.email,
    criadoPorNome: user.name,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };

  localProtocolos = [novo, ...localProtocolos];
  return novo;
}

async function updateProtocoloInterno(
  params: UpdateProtocoloInternoRequest
): Promise<ProtocoloInterno> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  localProtocolos = localProtocolos.map((p) =>
    p.id === params.id
      ? {
          ...p,
          assunto: params.assunto,
          descricao: params.descricao ?? null,
          atualizadoEm: new Date().toISOString(),
        }
      : p
  );

  const updated = localProtocolos.find((p) => p.id === params.id);
  if (!updated) throw new Error('Protocolo não encontrado');
  return updated;
}

async function updateStatusProtocoloInterno(params: {
  id: string;
  status: StatusProtocoloInterno;
}): Promise<ProtocoloInterno> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  localProtocolos = localProtocolos.map((p) =>
    p.id === params.id
      ? { ...p, status: params.status, atualizadoEm: new Date().toISOString() }
      : p
  );

  const updated = localProtocolos.find((p) => p.id === params.id);
  if (!updated) throw new Error('Protocolo não encontrado');
  return updated;
}

async function tramitarProtocoloInterno(params: {
  protocoloInternoId: string;
  paraSetor: string;
  despacho: string;
}): Promise<TramitacaoInterna> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const user = getCurrentUser();
  const protocolo = localProtocolos.find(
    (p) => p.id === params.protocoloInternoId
  );
  if (!protocolo) throw new Error('Protocolo não encontrado');

  // Determinar setor de origem (último destino ou setor de origem do protocolo)
  const tramitacoesDoProtocolo = localTramitacoes
    .filter((t) => t.protocoloInternoId === params.protocoloInternoId)
    .sort(
      (a, b) =>
        new Date(b.tramitadoEm).getTime() - new Date(a.tramitadoEm).getTime()
    );

  const deSetor =
    tramitacoesDoProtocolo.length > 0
      ? tramitacoesDoProtocolo[0].paraSetor
      : protocolo.setorOrigem;

  const novaTramitacao: TramitacaoInterna = {
    id: `tri_${Date.now()}`,
    protocoloInternoId: params.protocoloInternoId,
    deSetor,
    paraSetor: params.paraSetor,
    despacho: params.despacho,
    tramitadoPorEmail: user.email,
    tramitadoPorNome: user.name,
    tramitadoEm: new Date().toISOString(),
  };

  localTramitacoes = [...localTramitacoes, novaTramitacao];

  // Atualizar status para EM_ANDAMENTO se estiver ABERTO
  if (protocolo.status === 'ABERTO') {
    localProtocolos = localProtocolos.map((p) =>
      p.id === params.protocoloInternoId
        ? { ...p, status: 'EM_ANDAMENTO' as StatusProtocoloInterno, atualizadoEm: new Date().toISOString() }
        : p
    );
  } else {
    localProtocolos = localProtocolos.map((p) =>
      p.id === params.protocoloInternoId
        ? { ...p, atualizadoEm: new Date().toISOString() }
        : p
    );
  }

  return novaTramitacao;
}

// ============================================
// Hooks exportados
// ============================================

export function useProtocolosInternos() {
  return useQuery({
    queryKey: ['protocolos-internos'],
    queryFn: fetchProtocolosInternos,
  });
}

export function useProtocoloInternoDetail(id: string) {
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
        queryKey: ['protocolo-interno', variables.protocoloInternoId],
      });
    },
  });
}
