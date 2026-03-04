'use client';

import { useState, useMemo } from 'react';
import { formatDateTime, parseLocalDate } from '@/lib/date-utils';
import {
  Search,
  ScrollText,
  ChevronDown,
  ChevronRight,
  LogIn,
  Upload,
  Trash2,
  Pencil,
  Plus,
  ArrowRightLeft,
  Download,
  ShieldAlert,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/shared/Pagination';
import { useActivityLogs } from '@/hooks/use-admin';
import type { ActivityLog, LogAction } from '@/lib/types';

const PER_PAGE = 10;

const ACTION_LABELS: Record<LogAction, string> = {
  LOGIN: 'Login',
  UPLOAD: 'Upload',
  DELETE: 'Exclusão',
  EDIT: 'Edição',
  CREATE: 'Criação',
  TRAMITAR: 'Tramitação',
  EXPORT: 'Exportação',
  ADMIN_CHANGE: 'Admin',
};

const ACTION_VARIANTS: Record<LogAction, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  LOGIN: 'secondary',
  UPLOAD: 'default',
  DELETE: 'destructive',
  EDIT: 'outline',
  CREATE: 'default',
  TRAMITAR: 'outline',
  EXPORT: 'secondary',
  ADMIN_CHANGE: 'default',
};

function ActionIcon({ action }: { action: LogAction }) {
  const className = 'h-4 w-4';
  switch (action) {
    case 'LOGIN':
      return <LogIn className={className} />;
    case 'UPLOAD':
      return <Upload className={className} />;
    case 'DELETE':
      return <Trash2 className={className} />;
    case 'EDIT':
      return <Pencil className={className} />;
    case 'CREATE':
      return <Plus className={className} />;
    case 'TRAMITAR':
      return <ArrowRightLeft className={className} />;
    case 'EXPORT':
      return <Download className={className} />;
    case 'ADMIN_CHANGE':
      return <ShieldAlert className={className} />;
  }
}

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: '24h', label: 'Últimas 24h' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
] as const;

function isWithinPeriod(dateStr: string, period: string): boolean {
  if (period === 'all') return true;
  const date = parseLocalDate(dateStr);
  if (!date) return true;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  switch (period) {
    case '24h':
      return diffH <= 24;
    case '7d':
      return diffH <= 24 * 7;
    case '30d':
      return diffH <= 24 * 30;
    default:
      return true;
  }
}

export function LogsTab() {
  const { data: logs, isLoading } = useActivityLogs();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<LogAction | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const matchesSearch =
        search === '' ||
        log.descricao.toLowerCase().includes(search.toLowerCase()) ||
        log.usuarioNome.toLowerCase().includes(search.toLowerCase()) ||
        log.usuarioEmail.toLowerCase().includes(search.toLowerCase());
      const matchesAction =
        actionFilter === 'all' || log.acao === actionFilter;
      const matchesPeriod = isWithinPeriod(log.criadoEm, periodFilter);
      return matchesSearch && matchesAction && matchesPeriod;
    });
  }, [logs, search, actionFilter, periodFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleActionChange(value: string) {
    setActionFilter(value as LogAction | 'all');
    setPage(1);
  }

  function handlePeriodChange(value: string) {
    setPeriodFilter(value);
    setPage(1);
  }

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border/30 p-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar nos logs..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={handleActionChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {(Object.keys(ACTION_LABELS) as LogAction[]).map((action) => (
              <SelectItem key={action} value={action}>
                {ACTION_LABELS[action]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={periodFilter} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || actionFilter !== 'all' || periodFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setActionFilter('all');
              setPeriodFilter('all');
              setPage(1);
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/50 py-16">
          <ScrollText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {search || actionFilter !== 'all' || periodFilter !== 'all'
              ? 'Nenhum log encontrado com os filtros aplicados.'
              : 'Nenhum log de atividade registrado.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:!bg-transparent">
                <TableHead className="w-[32px]" />
                <TableHead className="w-[100px]">Ação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="hidden md:table-cell w-[160px]">Usuário</TableHead>
                <TableHead className="hidden lg:table-cell w-[140px]">Setor</TableHead>
                <TableHead className="w-[130px]">Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <LogRow
                    key={log.id}
                    log={log}
                    isExpanded={isExpanded}
                    onToggle={() => toggleExpanded(log.id)}
                  />
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginação */}
      {filtered.length > PER_PAGE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          perPage={PER_PAGE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

// ============================================
// LogRow — linha expansível
// ============================================

interface LogRowProps {
  log: ActivityLog;
  isExpanded: boolean;
  onToggle: () => void;
}

function LogRow({ log, isExpanded, onToggle }: LogRowProps) {
  const hasDetails = log.detalhes && Object.keys(log.detalhes).length > 0;

  return (
    <>
      <TableRow
        className="!border-border/30 hover:!bg-muted/20 cursor-pointer"
        onClick={hasDetails ? onToggle : undefined}
      >
        <TableCell className="w-[32px] px-2">
          {hasDetails && (
            <Button variant="ghost" size="icon" className="h-6 w-6">
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={ACTION_VARIANTS[log.acao]} className="gap-1">
            <ActionIcon action={log.acao} />
            {ACTION_LABELS[log.acao]}
          </Badge>
        </TableCell>
        <TableCell className="max-w-[300px] truncate text-sm">
          {log.descricao}
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div>
            <p className="text-sm font-medium">{log.usuarioNome}</p>
            <p className="text-xs text-muted-foreground">{log.usuarioEmail}</p>
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
          {log.setor}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {formatDateTime(log.criadoEm)}
        </TableCell>
      </TableRow>

      {/* Linha expandida com detalhes */}
      {isExpanded && hasDetails && (
        <TableRow className="!border-border/30 bg-muted/10 hover:!bg-muted/10">
          <TableCell colSpan={6} className="p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(log.detalhes!).map(([key, value]) => (
                <div key={key} className="rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {key}
                  </p>
                  <p className="mt-0.5 text-sm">{value}</p>
                </div>
              ))}
              {log.ip && (
                <div className="rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    IP
                  </p>
                  <p className="mt-0.5 text-sm font-mono">{log.ip}</p>
                </div>
              )}
              {log.recurso && (
                <div className="rounded-lg bg-muted/30 px-3 py-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Recurso
                  </p>
                  <p className="mt-0.5 text-sm">
                    {log.recurso}
                    {log.recursoId && (
                      <span className="ml-1 text-muted-foreground">
                        ({log.recursoId})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
