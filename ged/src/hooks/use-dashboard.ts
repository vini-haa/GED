'use client';

import { useQuery } from '@tanstack/react-query';
import { mockDashboardData } from '@/lib/mock-dashboard';
import type { DashboardData, DashboardFilters } from '@/lib/types';

// ============================================
// Fetch mock — TODO: substituir por apiClient
// ============================================

async function fetchDashboard(
  _filters: DashboardFilters
): Promise<DashboardData> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return mockDashboardData;
}

// ============================================
// Hooks exportados
// ============================================

export function useDashboard(filters: DashboardFilters) {
  return useQuery({
    queryKey: ['dashboard', filters.periodo, filters.setor, filters.projeto],
    queryFn: () => fetchDashboard(filters),
  });
}
