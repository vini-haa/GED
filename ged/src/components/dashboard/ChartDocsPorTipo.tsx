'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { DocsPorTipoItem } from '@/lib/types';

interface ChartDocsPorTipoProps {
  data: DocsPorTipoItem[] | undefined;
  isLoading: boolean;
}

export function ChartDocsPorTipo({ data, isLoading }: ChartDocsPorTipoProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-4 mx-auto h-[220px] w-[220px] rounded-full" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <h3 className="text-sm font-medium">Documentos por Tipo</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Distribuição por categoria
        </p>
        <div className="mt-4 flex h-[220px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhum documento registrado no período
          </p>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.quantidade, 0);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <h3 className="text-sm font-medium">Documentos por Tipo</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Distribuição por categoria
      </p>

      <div className="mt-4 h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              dataKey="quantidade"
              nameKey="tipo"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.tipo} fill={entry.cor} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              itemStyle={{
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                'Quantidade',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((item) => (
          <div key={item.tipo} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.cor }}
            />
            <span className="truncate text-xs text-muted-foreground">
              {item.tipo}
            </span>
            <span className="ml-auto text-xs font-medium tabular-nums">
              {item.quantidade}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
