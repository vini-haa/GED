'use client';

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

interface PageProps {
  params: { source: string; id: string };
}

export default function ProtocoloDetalhesPage({ params }: PageProps) {
  const { source, id: idStr } = params;
  const id = parseInt(idStr, 10);

  const { data: protocolo, isLoading, isError } = useProtocoloDetalhes(source, id);

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

  if (isError || !protocolo) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-lg font-medium">Protocolo não encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O protocolo não foi encontrado no sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProtocoloDetails protocol={protocolo} />

      {/* Ações de exportação */}
      <div className="flex items-center gap-3">
        <DossieExportButton
          source={source}
          id={idStr}
          protocoloSagi={protocolo.numero_protocolo}
        />
        <DownloadZipButton
          source={source}
          id={idStr}
          documentCount={protocolo.doc_count}
        />
      </div>

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
            Observações
            {protocolo.observation_count > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {protocolo.observation_count}
              </span>
            )}
            {protocolo.has_recent_observations && (
              <span className="ml-0.5 h-2 w-2 rounded-full bg-destructive" />
            )}
          </TabsTrigger>
          <TabsTrigger value="tramitacao" className="gap-1.5">
            <ArrowRightLeft className="h-4 w-4" />
            Tramitação
            {protocolo.tramitacao_count > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {protocolo.tramitacao_count}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="mt-4">
          <DocumentoList source={source} id={id} />
        </TabsContent>

        <TabsContent value="observacoes" className="mt-4">
          <ObservacaoList source={source} id={id} />
        </TabsContent>

        <TabsContent value="tramitacao" className="mt-4">
          <TramitacaoTimeline source={source} id={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
