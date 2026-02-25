import { useQuery } from '@tanstack/react-query';
import { protocols } from '@/lib/data';
import type { Protocol } from '@/lib/types';

async function fetchProtocols(): Promise<Protocol[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return protocols;
}

export function useProtocols() {
  return useQuery({
    queryKey: ['protocols'],
    queryFn: fetchProtocols,
  });
}
