'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDocumentos, getDocumentosByProtocolo } from '@/lib/mock-documentos';
import { mockProtocols } from '@/lib/mock-protocols';
import type { Documento, Protocol } from '@/lib/types';

// Estado local mutável para simular persistência durante a sessão
let localDocumentos = [...mockDocumentos];

// ============================================
// Funções de fetch mock
// TODO: Substituir por chamadas ao apiClient quando a API Go estiver pronta
// ============================================

async function fetchDocumentos(protocoloSagi: string): Promise<Documento[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return localDocumentos.filter((d) => d.protocoloSagi === protocoloSagi);
}

async function deleteDocumento(params: {
  id: string;
  motivo: string;
}): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  localDocumentos = localDocumentos.filter((d) => d.id !== params.id);
}

async function fetchProtocoloDetalhes(
  numero: number,
  ano: number
): Promise<{ protocolo: Protocol; documentos: Documento[] }> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const protocolo = mockProtocols.find(
    (p) => p.numeroProtocolo === numero && p.anoProtocolo === ano
  );

  if (!protocolo) {
    throw new Error('Protocolo não encontrado');
  }

  const protocoloSagi = `${numero}/${ano}`;
  const documentos = localDocumentos.filter(
    (d) => d.protocoloSagi === protocoloSagi
  );

  return { protocolo, documentos };
}

// ============================================
// Hooks exportados
// ============================================

export function useDocumentos(protocoloSagi: string) {
  return useQuery({
    queryKey: ['documentos', protocoloSagi],
    queryFn: () => fetchDocumentos(protocoloSagi),
    enabled: !!protocoloSagi,
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
      queryClient.invalidateQueries({ queryKey: ['protocolo-detalhes'] });
    },
  });
}

export function useProtocoloDetalhes(numero: number, ano: number) {
  return useQuery({
    queryKey: ['protocolo-detalhes', numero, ano],
    queryFn: () => fetchProtocoloDetalhes(numero, ano),
    enabled: !!numero && !!ano,
  });
}
