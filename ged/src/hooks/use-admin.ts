'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockAdmins, mockActivityLogs } from '@/lib/mock-admin';
import type { AdminUser, ActivityLog } from '@/lib/types';

// ============================================
// Fetch mocks — TODO: substituir por apiClient
// ============================================

async function fetchAdmins(): Promise<AdminUser[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockAdmins;
}

async function addAdmin(_data: { email: string; nome: string; setor: string }): Promise<AdminUser> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    id: `adm_${Date.now()}`,
    nome: _data.nome,
    email: _data.email,
    setor: _data.setor,
    gedRole: 'admin',
    ativo: true,
    adicionadoEm: new Date().toISOString(),
    adicionadoPor: 'suporteti@fadex.org.br',
  };
}

async function removeAdmin(_id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
}

async function toggleAdmin(_id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
}

async function fetchActivityLogs(): Promise<ActivityLog[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockActivityLogs;
}

// ============================================
// Hooks exportados
// ============================================

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
  });
}

export function useAddAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useRemoveAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useToggleAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useActivityLogs() {
  return useQuery({
    queryKey: ['activity-logs'],
    queryFn: fetchActivityLogs,
  });
}
