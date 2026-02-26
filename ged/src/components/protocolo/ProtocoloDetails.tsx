'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, Building2, FolderKanban, FileText, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Protocol, ProtocolStatus } from '@/lib/types';

const statusVariantMap: Record<
  ProtocolStatus,
  'success' | 'warning' | 'default' | 'destructive'
> = {
  Concluído: 'success',
  Pendente: 'warning',
  'Em Andamento': 'default',
  Cancelado: 'destructive',
};

function formatProtocolNumber(numero: number, ano: number): string {
  return `${String(numero).padStart(5, '0')}/${ano}`;
}

interface ProtocoloDetailsProps {
  protocol: Protocol;
}

export function ProtocoloDetails({ protocol }: ProtocoloDetailsProps) {
  const router = useRouter();

  const dataFormatada = format(
    new Date(protocol.dataProtocolo),
    "dd/MM/yyyy 'às' HH:mm",
    { locale: ptBR }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Protocolo {formatProtocolNumber(protocol.numeroProtocolo, protocol.anoProtocolo)}
          </h1>
          <Badge variant={statusVariantMap[protocol.situacao]}>
            {protocol.situacao}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Número / Ano
            </div>
            <p className="text-sm font-medium">
              {formatProtocolNumber(protocol.numeroProtocolo, protocol.anoProtocolo)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Data do Protocolo
            </div>
            <p className="text-sm font-medium">{dataFormatada}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Setor Origem
            </div>
            <p className="text-sm font-medium">
              {protocol.setorOrigem ?? '—'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              Setor Destino
            </div>
            <p className="text-sm font-medium">
              {protocol.setorDestino ?? '—'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              Projeto
            </div>
            <p className="text-sm font-medium">
              {protocol.projetoDescricao ?? '—'}
            </p>
          </div>

          {protocol.numeroConvenio && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Convênio</p>
              <p className="text-sm font-medium">{protocol.numeroConvenio}</p>
            </div>
          )}
        </div>

        {protocol.assunto && (
          <div className="mt-4 border-t border-border/30 pt-4">
            <p className="text-xs text-muted-foreground">Assunto</p>
            <p className="mt-1 text-sm">{protocol.assunto}</p>
          </div>
        )}
      </div>
    </div>
  );
}
