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
import type { Protocol, ProtocolTab } from '@/lib/types';
import { formatSectorName } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Eye,
  FileText,
  FolderKanban,
  Inbox,
  MoreHorizontal,
  Paperclip,
} from 'lucide-react';
import Link from 'next/link';

function getStatusVariant(
  status: string
): 'success' | 'warning' | 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'Finalizado':
      return 'success';
    case 'Em Análise':
      return 'warning';
    case 'Cancelado':
      return 'destructive';
    case 'Arquivado':
      return 'secondary';
    case 'Em Tramitação':
    default:
      return 'default';
  }
}

const emptyMessageMap: Record<ProtocolTab, string> = {
  meu_setor: 'Nenhum protocolo vinculado ao seu setor.',
  recentes: 'Nenhum protocolo recente encontrado.',
  sem_docs: 'Todos os protocolos possuem documentos anexados.',
  internos: 'Nenhum protocolo interno cadastrado.',
  todos: 'Nenhum protocolo encontrado.',
};

interface ProtocoloTableProps {
  data: Protocol[];
  isLoading: boolean;
  activeTab: ProtocolTab;
  hasFilters: boolean;
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
            <Skeleton className="hidden h-5 w-28 lg:block" />
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
            <TableHead className="hidden lg:table-cell">
              Projeto
            </TableHead>
            <TableHead className="hidden md:table-cell">
              Setor Destino
            </TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="hidden sm:table-cell text-center">
              Docs
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              Ultima Atividade
            </TableHead>
            <TableHead>
              <span className="sr-only">Acoes</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((protocol) => (
            <TableRow
              key={protocol.id}
              className="!border-border/30 hover:!bg-muted/20"
            >
              <TableCell className="font-medium">
                <Link
                  href={`/protocolo/sagi/${protocol.id}`}
                  className="hover:underline"
                >
                  {protocol.numero_protocolo}
                </Link>
                {protocol.is_new && (
                  <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {protocol.assunto ?? '—'}
              </TableCell>
              <TableCell className="hidden lg:table-cell max-w-[180px]">
                {protocol.nome_projeto ? (
                  <span className="block truncate" title={protocol.nome_projeto}>
                    {protocol.nome_projeto}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatSectorName(protocol.nome_setor_atual)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={getStatusVariant(protocol.status)}>
                  {protocol.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-center">
                <span className="inline-flex items-center gap-1">
                  {protocol.doc_count}
                  {protocol.doc_count === 0 && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </span>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {protocol.data_chegada_setor
                  ? formatDistanceToNow(
                      new Date(protocol.data_chegada_setor),
                      {
                        addSuffix: true,
                        locale: ptBR,
                      }
                    )
                  : '—'}
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
                    <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/protocolo/sagi/${protocol.id}`}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
