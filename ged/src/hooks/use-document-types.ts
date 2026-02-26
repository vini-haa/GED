'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockDocumentTypes } from '@/lib/mock-document-types';
import type { DocumentType } from '@/lib/types';

// Estado local mutável para simular persistência durante a sessão
let localTypes = [...mockDocumentTypes];

async function fetchDocumentTypes(): Promise<DocumentType[]> {
  // TODO: Substituir por apiClient.get('/tipos-documento')
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...localTypes];
}

async function createDocumentType(
  data: Pick<DocumentType, 'name' | 'description'>
): Promise<DocumentType> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const newType: DocumentType = {
    id: `dt_${Date.now()}`,
    name: data.name,
    description: data.description,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localTypes = [newType, ...localTypes];
  return newType;
}

async function updateDocumentType(
  data: Pick<DocumentType, 'id' | 'name' | 'description'>
): Promise<DocumentType> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  localTypes = localTypes.map((t) =>
    t.id === data.id
      ? { ...t, name: data.name, description: data.description, updatedAt: new Date().toISOString() }
      : t
  );
  const updated = localTypes.find((t) => t.id === data.id);
  if (!updated) throw new Error('Tipo não encontrado');
  return updated;
}

async function toggleDocumentType(id: string): Promise<DocumentType> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  localTypes = localTypes.map((t) =>
    t.id === id
      ? { ...t, active: !t.active, updatedAt: new Date().toISOString() }
      : t
  );
  const toggled = localTypes.find((t) => t.id === id);
  if (!toggled) throw new Error('Tipo não encontrado');
  return toggled;
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['document-types'],
    queryFn: fetchDocumentTypes,
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
