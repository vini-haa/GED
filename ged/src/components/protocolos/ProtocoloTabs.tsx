'use client';

import { useCallback, useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Pagination } from '@/components/shared/Pagination';
import { useProtocolos, useRecentes } from '@/hooks/use-protocolos';
import { useProtocolosInternos } from '@/hooks/use-protocolos-internos';
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

  const isInternos = filters.tab === 'internos';
  const isRecentes = filters.tab === 'recentes';

  // Hook para protocolos SAGI (não busca quando tab é recentes ou internos)
  const { data: result, isLoading } = useProtocolos(filters);

  // Hook para protocolos recentes do usuário (visualizados recentemente)
  const { data: recentesResult, isLoading: recentesLoading } = useRecentes(
    isRecentes ? 20 : 0
  );

  // Hook para protocolos internos com filtros
  const internosParams = isInternos
    ? {
        page: filters.page,
        per_page: PER_PAGE,
        setor: filters.setor !== 'all' ? (filters.setor as number) : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.busca || undefined,
        projeto: filters.projeto || undefined,
      }
    : undefined;
  const { data: internosResult, isLoading: internosLoading } = useProtocolosInternos(
    internosParams,
    isInternos
  );

  const updateFilters = useCallback(
    (partial: Partial<ProtocolFilters>) => {
      setFilters((prev) => ({
        ...prev,
        ...partial,
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

  // Paginação: usar resultado correto conforme a aba (recentes não tem paginação)
  const paginationData = isRecentes
    ? null
    : isInternos
      ? internosResult
        ? {
            page: internosResult.page,
            total_pages: internosResult.total_pages,
            total: internosResult.total,
            page_size: internosResult.per_page,
          }
        : null
      : result
        ? result.pagination
        : null;

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

        <div className="mt-4 space-y-3">
          <ProtocoloSearchBar
            value={filters.busca}
            onSearch={handleSearch}
            scope={searchScope}
            onScopeChange={isInternos ? undefined : handleScopeChange}
          />

          <ProtocoloFilters
            status={filters.status}
            setor={filters.setor}
            periodo={filters.periodo}
            ordenacao={filters.ordenacao}
            projeto={filters.projeto}
            onStatusChange={handleStatusChange}
            onSetorChange={handleSetorChange}
            onPeriodoChange={handlePeriodoChange}
            onOrdenacaoChange={isInternos ? undefined : handleOrdenacaoChange}
            onProjetoChange={handleProjetoChange}
            onClear={handleClearFilters}
            isInternos={isInternos}
            hideSetor={filters.tab === 'meu_setor'}
          />
        </div>

        <TabsContent value="internos" className="mt-4">
          <ProtocoloInternoTable
            data={internosResult?.data ?? []}
            isLoading={internosLoading}
            hasFilters={hasFilters}
          />
        </TabsContent>

        <TabsContent value="recentes" className="mt-4">
          <ProtocoloTable
            data={recentesResult ?? []}
            isLoading={recentesLoading}
            activeTab="recentes"
            hasFilters={false}
          />
        </TabsContent>

        {tabs
          .filter((t) => t.value !== 'internos' && t.value !== 'recentes')
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

      {paginationData && paginationData.total_pages > 1 && (
        <Pagination
          page={paginationData.page}
          totalPages={paginationData.total_pages}
          total={paginationData.total}
          perPage={paginationData.page_size}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
