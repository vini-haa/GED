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
import type { ProtocolFilters, ProtocolTab } from '@/lib/types';
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
  { value: 'meu_setor', label: 'Meu Setor', icon: Building2 },
  { value: 'recentes', label: 'Recentes', icon: Clock },
  { value: 'sem_docs', label: 'Sem Docs', icon: FileText },
  { value: 'internos', label: 'Internos', icon: FolderOpen },
  { value: 'todos', label: 'Todos', icon: List },
];

const defaultFilters: ProtocolFilters = {
  tab: 'meu_setor',
  busca: '',
  status: 'all',
  setor: 'all',
  periodo: 'all',
  page: 1,
  pageSize: PER_PAGE,
};

export function ProtocoloTabs() {
  const [filters, setFilters] = useState<ProtocolFilters>(defaultFilters);
  const [searchScope, setSearchScope] = useState<'meu_setor' | 'todos'>(
    'meu_setor'
  );

  const { data: result, isLoading } = useProtocolos(filters);

  const updateFilters = useCallback(
    (partial: Partial<ProtocolFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...partial,
        // Reseta pagina ao mudar qualquer filtro (exceto page)
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
    (scope: 'meu_setor' | 'todos') => {
      setSearchScope(scope);
      updateFilters({ tab: scope === 'meu_setor' ? 'meu_setor' : 'todos' });
    },
    [updateFilters]
  );

  const handleStatusChange = useCallback(
    (status: string) => {
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

  const handleOrdenacaoChange = useCallback(
    (ordenacao: 'data_criacao' | 'data_chegada_setor') => {
      updateFilters({ ordenacao });
    },
    [updateFilters]
  );

  const handleProjetoChange = useCallback(
    (projeto: string) => {
      updateFilters({ projeto: projeto || undefined });
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
      ordenacao: undefined,
      projeto: undefined,
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
    filters.periodo !== 'all' ||
    !!filters.projeto;

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

        {filters.tab !== 'internos' && (
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
              ordenacao={filters.ordenacao}
              onStatusChange={handleStatusChange}
              onSetorChange={handleSetorChange}
              onPeriodoChange={handlePeriodoChange}
              onOrdenacaoChange={handleOrdenacaoChange}
              projeto={filters.projeto}
              onProjetoChange={handleProjetoChange}
              onClear={handleClearFilters}
            />
          </div>
        )}

        <TabsContent value="internos" className="mt-4">
          <ProtocoloInternoTable />
        </TabsContent>

        {tabs
          .filter((t) => t.value !== 'internos')
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

      {result && result.pagination.total_pages > 1 && (
        <Pagination
          page={result.pagination.page}
          totalPages={result.pagination.total_pages}
          total={result.pagination.total}
          perPage={result.pagination.page_size}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
