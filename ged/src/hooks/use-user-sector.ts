'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';

interface UserSector {
  codSetor: number;
  nomeSetor: string;
}

async function fetchUserSector(): Promise<UserSector> {
  // TODO: Substituir por chamada real ao endpoint GET /api/user/me
  // quando o backend estiver pronto
  await new Promise((resolve) => setTimeout(resolve, 200));
  const user = getCurrentUser();
  return {
    codSetor: user.codSetor,
    nomeSetor: user.nomeSetor,
  };
}

export function useUserSector() {
  const query = useQuery({
    queryKey: ['user-sector'],
    queryFn: fetchUserSector,
    staleTime: 5 * 60 * 1000, // 5 minutos (setor muda raramente)
  });

  return {
    codSetor: query.data?.codSetor ?? null,
    nomeSetor: query.data?.nomeSetor ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
