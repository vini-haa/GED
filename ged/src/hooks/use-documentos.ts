'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Documento,
  ListDocumentosResponse,
  ProtocoloDetalhe,
} from '@/lib/types';

// ============================================
// Funções de fetch — chamadas à API Go real
// ============================================

async function fetchProtocoloDetalhes(
  source: string,
  id: number
): Promise<ProtocoloDetalhe> {
  const resp = await apiClient.get<{ data: ProtocoloDetalhe }>(
    `/protocolos/${source}/${id}`
  );
  return resp.data;
}

async function fetchDocumentos(
  source: string,
  id: number
): Promise<Documento[]> {
  const resp = await apiClient.get<ListDocumentosResponse>(
    `/protocolos/${source}/${id}/documentos`
  );
  return resp.data;
}

async function uploadDocumento(params: {
  source: string;
  id: number;
  formData: FormData;
}): Promise<Documento> {
  return apiClient.upload<Documento>(
    `/protocolos/${params.source}/${params.id}/documentos`,
    params.formData
  );
}

async function updateDocumento(params: {
  id: string;
  descricao?: string;
  tipo_documento_id?: string;
}): Promise<Documento> {
  const { id, ...body } = params;
  return apiClient.patch<Documento>(`/documentos/${id}`, body);
}

async function deleteDocumento(params: {
  id: string;
  motivo_exclusao: string;
}): Promise<void> {
  await apiClient.post(`/documentos/${params.id}/delete`, {
    motivo_exclusao: params.motivo_exclusao,
  });
}

async function downloadDocumento(id: string): Promise<Blob> {
  const url = `/api/documentos/${id}/download`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Download falhou: ${response.status}`);
  }

  return response.blob();
}

// ============================================
// Hooks exportados
// ============================================

export function useDocumentos(source: string, id: number) {
  return useQuery({
    queryKey: ['documentos', source, id],
    queryFn: () => fetchDocumentos(source, id),
    enabled: !!id,
  });
}

export function useUploadDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocumento,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['documentos', variables.source, variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['protocolo-detalhes'] });
    },
  });
}

export function useUpdateDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocumento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
    },
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

export function useDownloadDocumento() {
  return useMutation({
    mutationFn: downloadDocumento,
  });
}

export function useProtocoloDetalhes(source: string, id: number) {
  return useQuery({
    queryKey: ['protocolo-detalhes', source, id],
    queryFn: () => fetchProtocoloDetalhes(source, id),
    enabled: !!id,
  });
}
