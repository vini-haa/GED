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

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <h3 className="text-sm font-medium">Uploads e Protocolos por Dia</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Evolução nos últimos 30 dias
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
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="uploads"
              name="Uploads"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="protocolos"
              name="Protocolos"
              stroke="#7c3aed"
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
