'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Protocol, ProtocolStatus, ProtocolTab } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Eye,
  FileText,
  Inbox,
  MoreHorizontal,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';

const statusVariantMap: Record<
  ProtocolStatus,
  'success' | 'warning' | 'default' | 'destructive'
> = {
  Concluído: 'success',
  Pendente: 'warning',
  'Em Andamento': 'default',
  Cancelado: 'destructive',
};

const emptyMessageMap: Record<ProtocolTab, string> = {
  'my-sector': 'Nenhum protocolo vinculado ao seu setor.',
  recents: 'Nenhum protocolo recente encontrado.',
  'no-docs': 'Todos os protocolos possuem documentos anexados.',
  internals: 'Nenhum protocolo interno cadastrado. Disponível na Semana 6.',
  all: 'Nenhum protocolo encontrado.',
};

interface ProtocoloTableProps {
  data: Protocol[];
  isLoading: boolean;
  activeTab: ProtocolTab;
  hasFilters: boolean;
}

function formatProtocolNumber(numero: number, ano: number): string {
  return `${String(numero).padStart(5, '0')}/${ano}`;
}

export function ProtocoloTable({
  data,
  isLoading,
  activeTab,
  hasFilters,
}: ProtocoloTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/30 p-4 last:border-b-0"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="hidden h-5 w-32 md:block" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="hidden h-5 w-10 sm:block" />
            <Skeleton className="hidden h-5 w-24 sm:block" />
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/50 py-16">
        <Inbox className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? 'Nenhum protocolo encontrado com os filtros aplicados.'
            : emptyMessageMap[activeTab]}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:!bg-transparent">
            <TableHead>Protocolo</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead className="hidden md:table-cell">
              Setor Destino
            </TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="hidden sm:table-cell text-center">
              Docs
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              Última Atividade
            </TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((protocol) => {
            const isRecent =
              new Date().getTime() -
                new Date(protocol.lastUpdated).getTime() <
              24 * 60 * 60 * 1000;

            return (
              <TableRow
                key={protocol.id}
                className="!border-border/30 hover:!bg-muted/20"
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/protocolo/${protocol.numeroProtocolo}/${protocol.anoProtocolo}`}
                    className="hover:underline"
                  >
                    {formatProtocolNumber(
                      protocol.numeroProtocolo,
                      protocol.anoProtocolo
                    )}
                  </Link>
                  {isRecent && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {protocol.assunto ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {protocol.setorDestino ?? '—'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={statusVariantMap[protocol.situacao]}>
                    {protocol.situacao}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">
                  <span className="inline-flex items-center gap-1">
                    {protocol.documentCount}
                    {protocol.documentCount === 0 && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatDistanceToNow(new Date(protocol.lastUpdated), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-haspopup="true"
                        size="icon"
                        variant="ghost"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/protocolo/${protocol.numeroProtocolo}/${protocol.anoProtocolo}`}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Paperclip className="mr-2 h-4 w-4" />
                        Anexar Documento
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
