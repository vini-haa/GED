'use client';

import { useCallback, useState } from 'react';
import { BarChart3, Calendar, Building2, FolderKanban, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { ChartUploadsPeriodo } from '@/components/dashboard/ChartUploadsPeriodo';
import { ChartDocsPorTipo } from '@/components/dashboard/ChartDocsPorTipo';
import { ChartTramitacaoSetor } from '@/components/dashboard/ChartTramitacaoSetor';
import { RankingUploads } from '@/components/dashboard/RankingUploads';
import { ListaProtocolosSemDocs } from '@/components/dashboard/ListaProtocolosSemDocs';
import { useDashboard } from '@/hooks/use-dashboard';
import { useSetores } from '@/hooks/use-protocolos';
import { toast } from '@/hooks/use-toast';
import type { DashboardFilters } from '@/lib/types';

const PERIODOS = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '1y', label: 'Último ano' },
] as const;

export default function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({
    periodo: '30d',
    setor: 'all',
    projeto: 'all',
  });

  const { data: setores = [] } = useSetores();

  // TODO: Substituir por endpoint de projetos quando backend implementar
  const projetos: string[] = [];

  const { data, isLoading } = useDashboard(filters);

  const [exportingExcel, setExportingExcel] = useState(false);

  const buildExportParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('periodo', filters.periodo);
    if (filters.setor !== 'all') params.set('setor', filters.setor);
    if (filters.projeto !== 'all') params.set('projeto', filters.projeto);
    return params.toString();
  }, [filters]);

  const handleExportExcel = useCallback(
    async () => {
      setExportingExcel(true);

      try {
        const token = localStorage.getItem('auth_token');

        const response = await fetch(
          `/api/dashboard/export/excel?${buildExportParams()}`,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(
            errorBody?.error?.message || `Erro ${response.status}`
          );
        }

        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let fileName = `dashboard_ged_${new Date().toISOString().slice(0, 10)}.xlsx`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) fileName = match[1];
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao exportar Excel';
        toast({ title: 'Erro', description: message, variant: 'destructive' });
      } finally {
        setExportingExcel(false);
      }
    },
    [buildExportParams]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BarChart3 className="h-6 w-6" />
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Indicadores de desempenho do GED FADEX
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={exportingExcel}
          onClick={handleExportExcel}
        >
          {exportingExcel ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
          {exportingExcel ? 'Gerando...' : 'Excel'}
        </Button>
      </div>

      {/* Filtros globais */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro de período */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.periodo}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                periodo: v as DashboardFilters['periodo'],
              }))
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de setor */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.setor}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, setor: v }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setores</SelectItem>
              {setores.map((s) => (
                <SelectItem key={s.codigo} value={s.descricao}>
                  {s.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de projeto */}
        <div className="flex items-center gap-2">
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.projeto}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, projeto: v }))
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projetos.map((nome) => (
                <SelectItem key={nome} value={nome}>
                  {nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <KpiCards data={data?.kpis} isLoading={isLoading} />

      {/* Gráficos - Linha + Pizza */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartUploadsPeriodo
            data={data?.uploadsPeriodo}
            isLoading={isLoading}
          />
        </div>
        <ChartDocsPorTipo data={data?.docsPorTipo} isLoading={isLoading} />
      </div>

      {/* Tramitação por Setor */}
      <ChartTramitacaoSetor
        data={data?.tramitacaoPorSetor}
        isLoading={isLoading}
      />

      {/* Ranking + Sem Docs */}
      <div className="grid gap-6 lg:grid-cols-3">
        <RankingUploads data={data?.rankingUploads} isLoading={isLoading} />
        <div className="lg:col-span-2">
          <ListaProtocolosSemDocs
            data={data?.protocolosSemDocs}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
