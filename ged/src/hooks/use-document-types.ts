'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { DocumentType } from '@/lib/types';

// ============================================
// Fetch — chamada à API Go real
// Endpoints: CRUD /api/tipos-documento
// ============================================

async function fetchDocumentTypes(): Promise<DocumentType[]> {
  return apiClient.get<DocumentType[]>('/tipos-documento');
}

async function createDocumentType(
  data: Pick<DocumentType, 'name' | 'description'>
): Promise<DocumentType> {
  return apiClient.post<DocumentType>('/tipos-documento', data);
}

async function updateDocumentType(
  data: Pick<DocumentType, 'id' | 'name' | 'description'>
): Promise<DocumentType> {
  return apiClient.patch<DocumentType>(`/tipos-documento/${data.id}`, {
    name: data.name,
    description: data.description,
  });
}

async function toggleDocumentType(id: string): Promise<DocumentType> {
  return apiClient.patch<DocumentType>(`/tipos-documento/${id}/toggle`, {});
}

// ============================================
// Hooks exportados
// ============================================

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['document-types'],
    queryFn: fetchDocumentTypes,
    retry: false,
  });
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
    },
  });
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
    },
  });
}

export function useToggleDocumentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleDocumentType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
    },
  });
}
