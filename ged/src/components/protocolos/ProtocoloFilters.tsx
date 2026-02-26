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
import type { ProtocolStatus } from '@/lib/types';
import { FilterX } from 'lucide-react';

interface ProtocoloFiltersProps {
  status: ProtocolStatus | 'all';
  setor: number | 'all';
  periodo: 'all' | '7d' | '30d' | '90d' | '1y';
  onStatusChange: (value: ProtocolStatus | 'all') => void;
  onSetorChange: (value: number | 'all') => void;
  onPeriodoChange: (value: 'all' | '7d' | '30d' | '90d' | '1y') => void;
  onClear: () => void;
}

const statusOptions: Array<{ value: ProtocolStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos os status' },
  { value: 'Em Andamento', label: 'Em Andamento' },
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Concluído', label: 'Concluído' },
  { value: 'Cancelado', label: 'Cancelado' },
];

const periodoOptions: Array<{
  value: 'all' | '7d' | '30d' | '90d' | '1y';
  label: string;
}> = [
  { value: 'all', label: 'Qualquer período' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: '1y', label: 'Último ano' },
];

export function ProtocoloFilters({
  status,
  setor,
  periodo,
  onStatusChange,
  onSetorChange,
  onPeriodoChange,
  onClear,
}: ProtocoloFiltersProps) {
  const { data: setores } = useSetores();

  const activeCount =
    (status !== 'all' ? 1 : 0) +
    (setor !== 'all' ? 1 : 0) +
    (periodo !== 'all' ? 1 : 0);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="grid flex-1 gap-3 sm:grid-cols-3">
        <Select
          value={periodo}
          onValueChange={(v) =>
            onPeriodoChange(v as 'all' | '7d' | '30d' | '90d' | '1y')
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Período" />
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
          onValueChange={(v) => onStatusChange(v as ProtocolStatus | 'all')}
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
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="gap-2 shrink-0"
        >
          <FilterX className="h-4 w-4" />
          Limpar
          <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
            {activeCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
