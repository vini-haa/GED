'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format, formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Route,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusDropdown, StatusBadge } from '@/components/protocolo-interno/StatusDropdown';
import { TramitarModal } from '@/components/protocolo-interno/TramitarModal';
import { useProtocoloInternoDetail } from '@/hooks/use-protocolos-internos';
import { usePermissions } from '@/hooks/use-permissions';
import type { TramitacaoInterna } from '@/lib/types';

function formatPermanencia(fromDate: string, toDate: string | null): string {
  const from = new Date(fromDate);
  const to = toDate ? new Date(toDate) : new Date();

  const days = differenceInDays(to, from);
  const hours = differenceInHours(to, from) % 24;

  if (days === 0) {
    if (hours === 0) return 'Menos de 1 hora';
    return `${hours}h`;
  }
  if (days === 1) return hours > 0 ? `1 dia e ${hours}h` : '1 dia';
  return `${days} dias`;
}

interface PageProps {
  params: { id: string };
}

export default function ProtocoloInternoDetalhesPage({ params }: PageProps) {
  const { id } = params;
  const { data, isLoading, isError } = useProtocoloInternoDetail(id);
  const { isAdmin, canEdit } = usePermissions();

  const [tramitarOpen, setTramitarOpen] = useState(false);

  // Calcular setor atual
  const setorAtual = useMemo(() => {
    if (!data) return null;
    const { protocolo, tramitacoes } = data;
    if (tramitacoes.length === 0) return protocolo.setorOrigem;
    return tramitacoes[tramitacoes.length - 1].paraSetor;
  }, [data]);

  // Timeline items com permanência
  const timelineItems = useMemo(() => {
    if (!data?.tramitacoes || data.tramitacoes.length === 0) return [];

    return data.tramitacoes.map((tram, index) => {
      const isLast = index === data.tramitacoes.length - 1;
      const nextDate = isLast
        ? null
        : data.tramitacoes[index + 1].tramitadoEm;

      return {
        ...tram,
        permanencia: formatPermanencia(tram.tramitadoEm, nextDate),
        isLast,
      };
    });
  }, [data]);

  // Verificar se protocolo pode ser tramitado
  const canTramitar = useMemo(() => {
    if (!data) return false;
    const { status } = data.protocolo;
    return (
      canEdit &&
      (status === 'ABERTO' || status === 'EM_ANDAMENTO')
    );
  }, [data, canEdit]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-lg font-medium">Protocolo não encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O protocolo interno solicitado não foi encontrado no sistema.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Voltar à listagem</Link>
        </Button>
      </div>
    );
  }

  const { protocolo, tramitacoes } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {protocolo.numero}
              </h1>
              {isAdmin ? (
                <StatusDropdown
                  protocoloId={protocolo.id}
                  currentStatus={protocolo.status}
                />
              ) : (
                <StatusBadge status={protocolo.status} />
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {protocolo.assunto}
            </p>
          </div>
        </div>

        {/* Ações */}
        {canTramitar && (
          <Button
            onClick={() => setTramitarOpen(true)}
            className="gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            Tramitar
          </Button>
        )}
      </div>

      {/* Card de informações */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Setor de Origem
          </div>
          <p className="mt-1 text-sm font-medium">{protocolo.setorOrigem}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Setor Atual
          </div>
          <p className="mt-1 text-sm font-medium">{setorAtual}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Criado por
          </div>
          <p className="mt-1 text-sm font-medium">{protocolo.criadoPorNome}</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Data de Criação
          </div>
          <p className="mt-1 text-sm font-medium">
            {format(new Date(protocolo.criadoEm), 'dd/MM/yyyy', {
              locale: ptBR,
            })}
          </p>
        </div>
      </div>

      {/* Descrição */}
      {protocolo.descricao && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Descrição
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {protocolo.descricao}
          </p>
        </div>
      )}

      {/* Resumo de tramitação */}
      {tramitacoes.length > 0 && setorAtual && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Protocolo no setor{' '}
              <span className="text-primary">{setorAtual}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Há{' '}
              {formatDistanceToNow(
                new Date(tramitacoes[tramitacoes.length - 1].tramitadoEm),
                { locale: ptBR }
              )}{' '}
              — desde{' '}
              {format(
                new Date(tramitacoes[tramitacoes.length - 1].tramitadoEm),
                "dd/MM/yyyy 'às' HH:mm",
                { locale: ptBR }
              )}
            </p>
          </div>
        </div>
      )}

      {/* Timeline de tramitação */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <ArrowRightLeft className="h-5 w-5" />
          Tramitação
        </h2>

        {tramitacoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/50 py-12">
            <Route className="h-10 w-10 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Sem registro de tramitação
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Este protocolo ainda não foi tramitado para outro setor.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative pl-8">
            {/* Linha vertical */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />

            <div className="space-y-6">
              {timelineItems.map((item) => (
                <div key={item.id} className="relative">
                  {/* Nó do círculo */}
                  <div
                    className={`absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      item.isLast
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        item.isLast
                          ? 'bg-primary animate-pulse'
                          : 'bg-muted-foreground/40'
                      }`}
                    />
                  </div>

                  {/* Conteúdo */}
                  <div
                    className={`rounded-lg border p-3 ${
                      item.isLast
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border/40'
                    }`}
                  >
                    {/* Setores */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {item.deSetor}
                      </Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <Badge
                        variant={item.isLast ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {item.paraSetor}
                      </Badge>
                    </div>

                    {/* Despacho */}
                    {item.despacho && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {item.despacho}
                      </p>
                    )}

                    {/* Metadados */}
                    <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                      <span>
                        {format(
                          new Date(item.tramitadoEm),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                      <span>·</span>
                      <span>{item.tramitadoPorNome}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.isLast
                          ? `Há ${formatPermanencia(item.tramitadoEm, null)} (atual)`
                          : item.permanencia}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de tramitação */}
      {setorAtual && (
        <TramitarModal
          open={tramitarOpen}
          onOpenChange={setTramitarOpen}
          protocoloInternoId={protocolo.id}
          setorAtual={setorAtual}
        />
      )}
    </div>
  );
}
