'use client';

import { useCallback, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Pagination } from '@/components/shared/Pagination';
import { useProtocolos } from '@/hooks/use-protocolos';
import type { ProtocolFilters, ProtocolStatus, ProtocolTab } from '@/lib/types';
import {
  Building2,
  Clock,
  FileText,
  FolderOpen,
  List,
} from 'lucide-react';
import { ProtocoloFilters } from './ProtocoloFilters';
import { ProtocoloInternoTable } from './ProtocoloInternoTable';
import { ProtocoloSearchBar } from './ProtocoloSearchBar';
import { ProtocoloTable } from './ProtocoloTable';

const PER_PAGE = 10;

const tabs: Array<{
  value: ProtocolTab;
  label: string;
  icon: typeof FileText;
}> = [
  { value: 'my-sector', label: 'Meu Setor', icon: Building2 },
  { value: 'recents', label: 'Recentes', icon: Clock },
  { value: 'no-docs', label: 'Sem Docs', icon: FileText },
  { value: 'internals', label: 'Internos', icon: FolderOpen },
  { value: 'all', label: 'Todos', icon: List },
];

const defaultFilters: ProtocolFilters = {
  tab: 'my-sector',
  busca: '',
  status: 'all',
  setor: 'all',
  periodo: 'all',
  page: 1,
  perPage: PER_PAGE,
};

export function ProtocoloTabs() {
  const [filters, setFilters] = useState<ProtocolFilters>(defaultFilters);
  const [searchScope, setSearchScope] = useState<'my-sector' | 'all'>(
    'my-sector'
  );

  const { data: result, isLoading } = useProtocolos(filters);

  const updateFilters = useCallback(
    (partial: Partial<ProtocolFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...partial,
        // Reseta página ao mudar qualquer filtro (exceto page)
        page: 'page' in partial ? (partial.page ?? 1) : 1,
      }));
    },
    []
  );

  const handleTabChange = useCallback(
    (value: string) => {
      updateFilters({ tab: value as ProtocolTab });
    },
    [updateFilters]
  );

  const handleSearch = useCallback(
    (busca: string) => {
      updateFilters({ busca });
    },
    [updateFilters]
  );

  const handleScopeChange = useCallback(
    (scope: 'my-sector' | 'all') => {
      setSearchScope(scope);
      updateFilters({ tab: scope === 'my-sector' ? 'my-sector' : 'all' });
    },
    [updateFilters]
  );

  const handleStatusChange = useCallback(
    (status: ProtocolStatus | 'all') => {
      updateFilters({ status });
    },
    [updateFilters]
  );

  const handleSetorChange = useCallback(
    (setor: number | 'all') => {
      updateFilters({ setor });
    },
    [updateFilters]
  );

  const handlePeriodoChange = useCallback(
    (periodo: 'all' | '7d' | '30d' | '90d' | '1y') => {
      updateFilters({ periodo });
    },
    [updateFilters]
  );

  const handleClearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      busca: '',
      status: 'all',
      setor: 'all',
      periodo: 'all',
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setFilters((prev) => ({ ...prev, page }));
    },
    []
  );

  const hasFilters =
    filters.busca !== '' ||
    filters.status !== 'all' ||
    filters.setor !== 'all' ||
    filters.periodo !== 'all';

  return (
    <div className="space-y-4">
      <Tabs value={filters.tab} onValueChange={handleTabChange}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {filters.tab !== 'internals' && (
          <div className="mt-4 space-y-3">
            <ProtocoloSearchBar
              value={filters.busca}
              onSearch={handleSearch}
              scope={searchScope}
              onScopeChange={handleScopeChange}
            />

            <ProtocoloFilters
              status={filters.status}
              setor={filters.setor}
              periodo={filters.periodo}
              onStatusChange={handleStatusChange}
              onSetorChange={handleSetorChange}
              onPeriodoChange={handlePeriodoChange}
              onClear={handleClearFilters}
            />
          </div>
        )}

        <TabsContent value="internals" className="mt-4">
          <ProtocoloInternoTable />
        </TabsContent>

        {tabs
          .filter((t) => t.value !== 'internals')
          .map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              <ProtocoloTable
                data={result?.data ?? []}
                isLoading={isLoading}
                activeTab={filters.tab}
                hasFilters={hasFilters}
              />
            </TabsContent>
          ))}
      </Tabs>

      {result && result.meta.total_pages > 1 && (
        <Pagination
          page={result.meta.page}
          totalPages={result.meta.total_pages}
          total={result.meta.total}
          perPage={result.meta.per_page}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
