'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSetores } from '@/hooks/use-protocolos';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, FilterX, FolderKanban } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProtocoloFiltersProps {
  status: string;
  setor: number | 'all';
  periodo: 'all' | '7d' | '30d' | '90d' | '1y';
  ordenacao?: 'data_criacao' | 'data_chegada_setor';
  projeto?: string;
  onStatusChange: (value: string) => void;
  onSetorChange: (value: number | 'all') => void;
  onPeriodoChange: (value: 'all' | '7d' | '30d' | '90d' | '1y') => void;
  onOrdenacaoChange?: (value: 'data_criacao' | 'data_chegada_setor') => void;
  onProjetoChange?: (value: string) => void;
  onClear: () => void;
}

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Todos os status' },
  { value: 'em_tramitacao', label: 'Em Tramitação' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'arquivado', label: 'Arquivado' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const periodoOptions: Array<{
  value: 'all' | '7d' | '30d' | '90d' | '1y';
  label: string;
}> = [
  { value: 'all', label: 'Qualquer periodo' },
  { value: '7d', label: 'Ultimos 7 dias' },
  { value: '30d', label: 'Ultimos 30 dias' },
  { value: '90d', label: 'Ultimos 90 dias' },
  { value: '1y', label: 'Ultimo ano' },
];

export function ProtocoloFilters({
  status,
  setor,
  periodo,
  ordenacao,
  projeto,
  onStatusChange,
  onSetorChange,
  onPeriodoChange,
  onOrdenacaoChange,
  onProjetoChange,
  onClear,
}: ProtocoloFiltersProps) {
  const { data: setores } = useSetores();

  const activeCount =
    (status !== 'all' ? 1 : 0) +
    (setor !== 'all' ? 1 : 0) +
    (periodo !== 'all' ? 1 : 0) +
    (projeto ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={periodo}
          onValueChange={(v) =>
            onPeriodoChange(v as 'all' | '7d' | '30d' | '90d' | '1y')
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {periodoOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => onStatusChange(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={setor === 'all' ? 'all' : String(setor)}
          onValueChange={(v) =>
            onSetorChange(v === 'all' ? 'all' : Number(v))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {setores?.map((s) => (
              <SelectItem key={s.codigo} value={String(s.codigo)}>
                {s.descricao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <FolderKanban className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar por projeto"
            value={projeto ?? ''}
            onChange={(e) => onProjetoChange?.(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {setor !== 'all' && onOrdenacaoChange && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onOrdenacaoChange(
                      ordenacao === 'data_chegada_setor'
                        ? 'data_criacao'
                        : 'data_chegada_setor'
                    )
                  }
                  className="gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {ordenacao === 'data_chegada_setor'
                      ? 'Chegada no setor'
                      : 'Data de criacao'}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {ordenacao === 'data_chegada_setor'
                  ? 'Ordenando por data de chegada no setor'
                  : 'Ordenando por data de criacao do protocolo'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-2"
          >
            <FilterX className="h-4 w-4" />
            Limpar
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {activeCount}
            </Badge>
          </Button>
        )}
      </div>
    </div>
  );
}
