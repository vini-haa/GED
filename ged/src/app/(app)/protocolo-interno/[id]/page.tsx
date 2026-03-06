'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateTime, parseLocalDate } from '@/lib/date-utils';
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Pencil,
  Route,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { StatusDropdown, StatusBadge } from '@/components/protocolo-interno/StatusDropdown';
import { TramitarModal } from '@/components/protocolo-interno/TramitarModal';
import { EditarProtocoloModal } from '@/components/protocolo-interno/EditarProtocoloModal';
import { DocumentoList } from '@/components/protocolo/DocumentoList';
import { ObservacaoList } from '@/components/protocolo/ObservacaoList';
import { DossieExportButton } from '@/components/protocolo/DossieExportButton';
import { DownloadZipButton } from '@/components/protocolo/DownloadZipButton';
import {
  useProtocoloInternoDetail,
  useTramitacaoInterna,
} from '@/hooks/use-protocolos-internos';
import { useObservacoes } from '@/hooks/use-observacoes';
import { useDocumentos } from '@/hooks/use-documentos';
import { usePermissions } from '@/hooks/use-permissions';
import { formatSectorName } from '@/lib/types';

function formatPermanenciaDias(dias: number): string {
  if (dias === 0) return 'Menos de 1 dia';
  if (dias === 1) return '1 dia';
  return `${dias} dias`;
}

interface PageProps {
  params: { id: string };
}

export default function ProtocoloInternoDetalhesPage({ params }: PageProps) {
  const { id: idStr } = params;
  const id = Number(idStr);
  const { data: protocolo, isLoading, isError } = useProtocoloInternoDetail(id);
  const { data: tramitacaoData } = useTramitacaoInterna(id);
  const { isAdmin, canEdit } = usePermissions();

  const { data: documentos } = useDocumentos('interno', id);
  const { data: obsResponse } = useObservacoes('interno', id);

  const [tramitarOpen, setTramitarOpen] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);

  const tramitacoes = tramitacaoData?.data ?? [];
  const resumo = tramitacaoData?.resumo ?? null;

  // Verificar se protocolo pode ser tramitado
  const canTramitar = useMemo(() => {
    if (!protocolo) return false;
    const { status } = protocolo;
    return (
      canEdit &&
      (status === 'aberto' || status === 'em_analise')
    );
  }, [protocolo, canEdit]);

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

  if (isError || !protocolo) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-lg font-medium">Protocolo nao encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O protocolo interno solicitado nao foi encontrado no sistema.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/">Voltar a listagem</Link>
        </Button>
      </div>
    );
  }

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
                {protocolo.protocol_number}
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
              {protocolo.subject}
            </p>
          </div>
        </div>

        {/* Acoes */}
        {canTramitar && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setEditarOpen(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button
              onClick={() => setTramitarOpen(true)}
              className="gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Tramitar
            </Button>
          </div>
        )}
      </div>

      {/* Card de informacoes */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            Setor Atual
          </div>
          <p className="mt-1 text-sm font-medium">
            {formatSectorName(protocolo.current_sector_name)}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Criado por
          </div>
          <p className="mt-1 text-sm font-medium">
            {protocolo.created_by_name}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Data de Criacao
          </div>
          <p className="mt-1 text-sm font-medium">
            {formatDateTime(protocolo.created_at)}
          </p>
        </div>
      </div>

      {/* Informacoes adicionais */}
      {protocolo.project_name && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-card/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Projeto
            </p>
            <p className="mt-2 text-sm">{protocolo.project_name}</p>
          </div>
        </div>
      )}

      {/* Resumo de tramitacao */}
      {tramitacoes.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Protocolo no setor{' '}
              <span className="text-primary">
                {formatSectorName(protocolo.current_sector_name)}
              </span>
            </p>
            {tramitacoes.length > 0 && tramitacoes[tramitacoes.length - 1].moved_at && (() => {
              const d = parseLocalDate(tramitacoes[tramitacoes.length - 1].moved_at!);
              return d ? (
                <p className="text-xs text-muted-foreground">
                  Ha {formatDistanceToNow(d, { locale: ptBR })} — desde{' '}
                  {formatDateTime(tramitacoes[tramitacoes.length - 1].moved_at!)}
                </p>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Acoes de exportacao */}
      <div className="flex items-center gap-3">
        <DossieExportButton
          source="interno"
          id={idStr}
          protocoloSagi={protocolo.protocol_number}
        />
        <DownloadZipButton
          source="interno"
          id={idStr}
          documentCount={protocolo.doc_count}
        />
      </div>

      {/* Abas: Documentos, Observacoes, Tramitacao */}
      <Tabs defaultValue="documentos">
        <TabsList>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Documentos
            {protocolo.doc_count > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {protocolo.doc_count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="observacoes" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Observacoes
            {protocolo.obs_count > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {protocolo.obs_count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tramitacao" className="gap-1.5">
            <ArrowRightLeft className="h-4 w-4" />
            Tramitacao
            {protocolo.tramitacao_count > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {protocolo.tramitacao_count}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="mt-4">
          <DocumentoList source="interno" id={id} />
        </TabsContent>

        <TabsContent value="observacoes" className="mt-4">
          <ObservacaoList source="interno" id={id} />
        </TabsContent>

        <TabsContent value="tramitacao" className="mt-4">
          {tramitacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/50 py-12">
              <Route className="h-10 w-10 text-muted-foreground/40" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Sem registro de tramitacao
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Este protocolo ainda nao foi tramitado para outro setor.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative pl-8">
              {/* Linha vertical */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/60" />

              <div className="space-y-6">
                {tramitacoes.map((item, index) => {
                  const isLast = index === tramitacoes.length - 1;
                  return (
                    <div key={item.id} className="relative">
                      {/* No do circulo */}
                      <div
                        className={`absolute -left-8 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          item.is_current
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-background'
                        }`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            item.is_current
                              ? 'bg-primary animate-pulse'
                              : 'bg-muted-foreground/40'
                          }`}
                        />
                      </div>

                      {/* Conteudo */}
                      <div
                        className={`rounded-lg border p-3 ${
                          item.is_current
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border/40'
                        }`}
                      >
                        {/* Setores */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.from_sector_name ? (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {formatSectorName(item.from_sector_name)}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              <Badge
                                variant={item.is_current ? 'default' : 'outline'}
                                className="text-xs"
                              >
                                {formatSectorName(item.to_sector_name)}
                              </Badge>
                            </>
                          ) : (
                            <Badge
                              variant={item.is_current ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {formatSectorName(item.to_sector_name)}
                            </Badge>
                          )}
                        </div>

                        {/* Despacho */}
                        {item.dispatch_note && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.dispatch_note}
                          </p>
                        )}

                        {/* Metadados */}
                        <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          {item.moved_at && (
                            <span>
                              {formatDateTime(item.moved_at)}
                            </span>
                          )}
                          <span>·</span>
                          <span>{item.moved_by_name}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.is_current
                              ? `${formatPermanenciaDias(item.permanencia_dias)} (atual)`
                              : formatPermanenciaDias(item.permanencia_dias)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de tramitacao */}
      <TramitarModal
        open={tramitarOpen}
        onOpenChange={setTramitarOpen}
        protocoloInternoId={protocolo.id}
        setorAtualCodigo={protocolo.current_sector_code}
        setorAtualNome={protocolo.current_sector_name}
      />

      {/* Modal de edicao */}
      <EditarProtocoloModal
        open={editarOpen}
        onOpenChange={setEditarOpen}
        protocolo={protocolo}
      />
    </div>
  );
}
