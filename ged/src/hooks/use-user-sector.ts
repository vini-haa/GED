'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiResponse } from '@/lib/api-client';
import type { CurrentUser } from '@/lib/types';

async function fetchCurrentUser(): Promise<CurrentUser> {
  const resp = await apiClient.get<ApiResponse<CurrentUser>>('/me');
  return resp.data;
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUserSector() {
  const query = useCurrentUser();

  return {
    codSetor: query.data?.setor ?? null,
    nomeSetor: query.data?.setor ?? null,
    email: query.data?.email ?? null,
    nome: query.data?.nome ?? null,
    role: query.data?.role ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
