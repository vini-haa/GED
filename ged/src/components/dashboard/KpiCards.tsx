'use client';

import {
  FileText,
  Upload,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardKpi } from '@/lib/types';

const ICONS = [FileText, Upload, AlertTriangle, Clock];

function formatValue(valor: number, formato: 'numero' | 'dias'): string {
  if (formato === 'dias') return `${valor} dias`;
  return valor.toLocaleString('pt-BR');
}

interface KpiCardsProps {
  data: DashboardKpi[] | undefined;
  isLoading: boolean;
}

export function KpiCards({ data, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/50 bg-card/50 p-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="mt-2 h-8 w-20" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((kpi, index) => {
        const Icon = ICONS[index] ?? FileText;
        const isPositive = kpi.variacao >= 0;
        const isGood =
          kpi.label === 'Protocolos sem Docs' || kpi.label === 'Tempo Médio Tramitação'
            ? !isPositive
            : isPositive;

        return (
          <div
            key={kpi.label}
            className="rounded-xl border border-border/50 bg-card/50 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-2xl font-semibold">
              {formatValue(kpi.valor, kpi.formato)}
            </p>
            <div className="mt-1 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp
                  className={`h-3 w-3 ${isGood ? 'text-emerald-600' : 'text-red-500'}`}
                />
              ) : (
                <TrendingDown
                  className={`h-3 w-3 ${isGood ? 'text-emerald-600' : 'text-red-500'}`}
                />
              )}
              <span
                className={`text-xs font-medium ${isGood ? 'text-emerald-600' : 'text-red-500'}`}
              >
                {isPositive ? '+' : ''}
                {kpi.variacao}%
              </span>
              <span className="text-xs text-muted-foreground">
                vs período anterior
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
