'use client';

import { useMemo } from 'react';
import { differenceInHours } from 'date-fns';
import { FileText, MessageSquare, ArrowRightLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ProtocoloDetails } from '@/components/protocolo/ProtocoloDetails';
import { DocumentoList } from '@/components/protocolo/DocumentoList';
import { ObservacaoList } from '@/components/protocolo/ObservacaoList';
import { TramitacaoTimeline } from '@/components/protocolo/TramitacaoTimeline';
import { DossieExportButton } from '@/components/protocolo/DossieExportButton';
import { DownloadZipButton } from '@/components/protocolo/DownloadZipButton';
import { useProtocoloDetalhes } from '@/hooks/use-documentos';
import { useObservacoes } from '@/hooks/use-observacoes';

interface PageProps {
  params: { numero: string; ano: string };
}

export default function ProtocoloDetalhesPage({ params }: PageProps) {
  const { numero, ano } = params;
  const numeroInt = parseInt(numero, 10);
  const anoInt = parseInt(ano, 10);
  const protocoloSagi = `${numeroInt}/${anoInt}`;

  const { data, isLoading, isError } = useProtocoloDetalhes(numeroInt, anoInt);
  const { data: observacoes } = useObservacoes(protocoloSagi);

  // Contar observações recentes (< 48h)
  const recentObsCount = useMemo(() => {
    if (!observacoes) return 0;
    const now = new Date();
    return observacoes.filter(
      (o) => differenceInHours(now, new Date(o.criadoEm)) < 48
    ).length;
  }, [observacoes]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-10 w-80" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
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
            O protocolo {numero}/{ano} não foi encontrado no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProtocoloDetails protocol={data.protocolo} />

      {/* Ações de exportação */}
      <div className="flex items-center gap-3">
        <DossieExportButton protocoloSagi={protocoloSagi} />
        <DownloadZipButton
          protocoloSagi={protocoloSagi}
          documentCount={data.documentos.length}
        />
      </div>

      <Tabs defaultValue="documentos">
        <TabsList>
          <TabsTrigger value="documentos" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Documentos
            {data.documentos.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {data.documentos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="observacoes" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Observações
            {observacoes && observacoes.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {observacoes.length}
              </span>
            )}
            {recentObsCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {recentObsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tramitacao" className="gap-1.5">
            <ArrowRightLeft className="h-4 w-4" />
            Tramitação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="mt-4">
          <DocumentoList protocoloSagi={protocoloSagi} />
        </TabsContent>

        <TabsContent value="observacoes" className="mt-4">
          <ObservacaoList protocoloSagi={protocoloSagi} />
        </TabsContent>

        <TabsContent value="tramitacao" className="mt-4">
          <TramitacaoTimeline protocoloSagi={protocoloSagi} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
