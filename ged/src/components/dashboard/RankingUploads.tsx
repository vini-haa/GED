'use client';

import { Medal, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { RankingUploadItem } from '@/lib/types';

interface RankingUploadsProps {
  data: RankingUploadItem[] | undefined;
  isLoading: boolean;
}

function getMedalColor(posicao: number): string | null {
  switch (posicao) {
    case 1:
      return 'text-amber-500';
    case 2:
      return 'text-gray-400';
    case 3:
      return 'text-orange-600';
    default:
      return null;
  }
}

export function RankingUploads({ data, isLoading }: RankingUploadsProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <Skeleton className="h-5 w-32" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Top Uploaders</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Ranking por quantidade de uploads
        </p>
        <div className="mt-4 flex h-[160px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nenhum upload registrado no período
          </p>
        </div>
      </div>
    );
  }

  const maxUploads = data[0].uploads;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Top Uploaders</h3>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ranking por quantidade de uploads
      </p>

      <div className="mt-4 space-y-2">
        {data.map((item) => {
          const medalColor = getMedalColor(item.posicao);
          const barWidth = (item.uploads / maxUploads) * 100;

          return (
            <div key={item.posicao} className="group">
              <div className="flex items-center gap-3">
                {/* Posição */}
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {medalColor ? (
                    <Medal className={`h-4 w-4 ${medalColor}`} />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.posicao}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-medium">{item.nome}</p>
                    <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums">
                      {item.uploads}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.setor}
                  </p>
                  {/* Barra de progresso */}
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
