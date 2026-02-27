'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { TramitacaoSetorItem } from '@/lib/types';

interface ChartTramitacaoSetorProps {
  data: TramitacaoSetorItem[] | undefined;
  isLoading: boolean;
}

export function ChartTramitacaoSetor({
  data,
  isLoading,
}: ChartTramitacaoSetorProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-4 h-[320px] w-full rounded-lg" />
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  const media =
    data.reduce((sum, d) => sum + d.tempoMedioDias, 0) / data.length;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Tempo Médio por Setor</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dias de permanência em cada setor
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            Acima da média
          </span>
          <span className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Abaixo da média
          </span>
        </div>
      </div>

      <div className="mt-4 h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" barSize={16}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.4}
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              unit=" d"
            />
            <YAxis
              dataKey="setor"
              type="category"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
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
                `${value} dias`,
                'Tempo médio',
              ]}
            />
            <Bar dataKey="tempoMedioDias" radius={[0, 4, 4, 0]}>
              {data.map((entry) => (
                <Cell
                  key={entry.setor}
                  fill={entry.acimaDaMedia ? '#f87171' : '#10b981'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Média geral: <span className="font-medium">{media.toFixed(1)} dias</span>
      </p>
    </div>
  );
}
