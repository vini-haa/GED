'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AdminUser, ActivityLog } from '@/lib/types';

// ============================================
// Fetch — chamada à API Go real
// Endpoints: GET/POST/DELETE /api/admin/admins, GET /api/admin/logs
// ============================================

async function fetchAdmins(): Promise<AdminUser[]> {
  return apiClient.get<AdminUser[]>('/admin/admins');
}

async function addAdmin(data: { email: string; nome: string; setor: string }): Promise<AdminUser> {
  return apiClient.post<AdminUser>('/admin/admins', data);
}

async function removeAdmin(id: string): Promise<void> {
  await apiClient.delete(`/admin/admins/${id}`);
}

async function toggleAdmin(id: string): Promise<void> {
  await apiClient.patch(`/admin/admins/${id}/toggle`, {});
}

async function fetchActivityLogs(): Promise<ActivityLog[]> {
  const resp = await apiClient.get<{ data: ActivityLog[]; pagination: unknown }>(
    '/admin/logs'
  );
  return resp.data;
}

// ============================================
// Hooks exportados
// ============================================

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: fetchAdmins,
    retry: false,
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
    retry: false,
  });
}
