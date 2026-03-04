'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { UploadsPeriodoItem } from '@/lib/types';

interface ChartUploadsPeriodoProps {
  data: UploadsPeriodoItem[] | undefined;
  isLoading: boolean;
}

function formatDateTick(value: string): string {
  const parts = value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return value;
}

export function ChartUploadsPeriodo({
  data,
  isLoading,
}: ChartUploadsPeriodoProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-[280px] w-full rounded-lg" />
      </div>
    );
  }

  const hasAnyData = data && data.some(
    (d) => d.uploads > 0 || d.protocolos_externos > 0 || d.protocolos_internos > 0
  );

  if (!data || !hasAnyData) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <h3 className="text-sm font-medium">Atividade Diária</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Protocolos criados e documentos anexados por dia
        </p>
        <div className="mt-4 flex h-[280px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade registrada no período
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <h3 className="text-sm font-medium">Atividade Diária</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Protocolos criados e documentos anexados por dia
      </p>

      <div className="mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.4}
            />
            <XAxis
              dataKey="data"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDateTick}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={30}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={formatDateTick}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="protocolos_externos"
              name="Prot. Externos"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="protocolos_internos"
              name="Prot. Internos"
              stroke="#0891b2"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="uploads"
              name="Documentos"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
