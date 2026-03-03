'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Calendar, Building2, FolderKanban, FileText, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProtocoloDetalhe } from '@/lib/types';
import { formatSectorName } from '@/lib/types';

const statusVariantMap: Record<
  string,
  'success' | 'warning' | 'default' | 'destructive' | 'secondary'
> = {
  'Em Tramitação': 'default',
  'Em Análise': 'warning',
  Arquivado: 'secondary',
  Finalizado: 'success',
  Cancelado: 'destructive',
};

interface ProtocoloDetailsProps {
  protocol: ProtocoloDetalhe;
}

export function ProtocoloDetails({ protocol }: ProtocoloDetailsProps) {
  const router = useRouter();

  const dataFormatada = protocol.data_criacao
    ? format(
        new Date(protocol.data_criacao),
        "dd/MM/yyyy 'às' HH:mm",
        { locale: ptBR }
      )
    : '—';

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
            Protocolo {protocol.numero_protocolo}
          </h1>
          <Badge variant={statusVariantMap[protocol.status] ?? 'default'}>
            {protocol.status}
          </Badge>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Protocolo
            </div>
            <p className="text-sm font-medium">
              {protocol.numero_protocolo}
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
              Setor Atual
            </div>
            <p className="text-sm font-medium">
              {formatSectorName(protocol.nome_setor_atual)}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              Interessado
            </div>
            <p className="text-sm font-medium">
              {protocol.nome_interessado ?? '—'}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FolderKanban className="h-3.5 w-3.5" />
              Projeto
            </div>
            <p className="text-sm font-medium">
              {protocol.nome_projeto ?? '—'}
            </p>
          </div>

          {protocol.codigo_convenio && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Convênio</p>
              <p className="text-sm font-medium">{protocol.codigo_convenio}</p>
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
