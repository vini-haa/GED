'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateTime, parseLocalDate } from '@/lib/date-utils';
import { ArrowRight, Clock, MapPin, Route, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTramitacoes } from '@/hooks/use-observacoes';
import type { TramitacaoSagi } from '@/lib/types';
import { formatSectorName } from '@/lib/types';

function formatPermanenciaDias(dias: number): string {
  if (dias === 0) return 'Menos de 1 dia';
  if (dias === 1) return '1 dia';
  return `${dias} dias`;
}

interface TramitacaoTimelineProps {
  source: string;
  id: number;
}

export function TramitacaoTimeline({
  source,
  id,
}: TramitacaoTimelineProps) {
  const { data: response, isLoading } = useTramitacoes(source, id);

  const tramitacoes = response?.data;
  const resumo = response?.resumo;

  // Setor atual = destino da tramitacao com reg_atual === true, ou ultima
  const setorAtual = useMemo(() => {
    if (!tramitacoes || tramitacoes.length === 0) return null;
    const atual = tramitacoes.find((t) => t.reg_atual);
    const last = atual ?? tramitacoes[tramitacoes.length - 1];
    return {
      nome: last.setor_destino,
      desde: last.data_movimentacao,
    };
  }, [tramitacoes]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-6 w-6 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tramitacoes || tramitacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/50 py-12">
        <Route className="h-10 w-10 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-sm font-medium">Sem registro de tramitação</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Este protocolo ainda não possui movimentações registradas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do setor atual */}
      {setorAtual && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Protocolo no setor{' '}
              <span className="text-primary">{formatSectorName(setorAtual.nome)}</span>
            </p>
            {setorAtual.desde && (
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const d = parseLocalDate(setorAtual.desde);
                  return d
                    ? `Há ${formatDistanceToNow(d, { locale: ptBR })} — desde ${formatDateTime(setorAtual.desde)}`
                    : '—';
                })()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Resumo estatistico */}
      {resumo && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border/40 bg-card/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Tempo total</p>
            <p className="mt-1 text-sm font-semibold">{formatPermanenciaDias(resumo.tempo_total_dias)}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Total setores</p>
            <p className="mt-1 text-sm font-semibold">{resumo.total_setores}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Setor mais longo</p>
            <p className="mt-1 text-sm font-semibold truncate">{formatSectorName(resumo.setor_mais_longo)}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Dias no setor</p>
            <p className="mt-1 text-sm font-semibold">{resumo.dias_setor_mais_longo}</p>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Linha vertical */}
        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />

        <div className="space-y-6">
          {tramitacoes.map((item, index) => {
            const isLast = index === tramitacoes.length - 1;
            const isCurrent = item.reg_atual;

            return (
              <div key={item.sequencia} className="relative">
                {/* No do circulo */}
                <div
                  className={`absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isCurrent
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background'
                  }`}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isCurrent ? 'bg-primary animate-pulse' : 'bg-muted-foreground/40'
                    }`}
                  />
                </div>

                {/* Conteudo */}
                <div
                  className={`rounded-lg border p-3 ${
                    isCurrent
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/40'
                  }`}
                >
                  {/* Setores */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {formatSectorName(item.setor_origem)}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <Badge
                      variant={isCurrent ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {formatSectorName(item.setor_destino)}
                    </Badge>
                    {item.situacao && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {item.situacao}
                      </Badge>
                    )}
                  </div>

                  {/* Metadados */}
                  <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    {item.data_movimentacao && (
                      <span>
                        {formatDateTime(item.data_movimentacao)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatPermanenciaDias(item.permanencia_dias)}
                      {isCurrent && ' (atual)'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
