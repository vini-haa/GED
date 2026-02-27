'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Eye,
  FolderOpen,
  Inbox,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
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
import { StatusBadge } from '@/components/protocolo-interno/StatusDropdown';
import { useProtocolosInternos } from '@/hooks/use-protocolos-internos';

export function ProtocoloInternoTable() {
  const { data, isLoading } = useProtocolosInternos();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/30 p-4 last:border-b-0"
          >
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="hidden h-5 w-32 md:block" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="hidden h-5 w-24 sm:block" />
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/50 py-16">
        <Inbox className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Nenhum protocolo interno cadastrado.
        </p>
        <Button variant="outline" asChild>
          <Link href="/protocolo-interno/novo" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Protocolo Interno
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data.length} protocolo{data.length !== 1 ? 's' : ''} interno{data.length !== 1 ? 's' : ''}
        </p>
        <Button size="sm" asChild>
          <Link href="/protocolo-interno/novo" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:!bg-transparent">
              <TableHead>Protocolo</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead className="hidden md:table-cell">
                Setor Origem
              </TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="hidden sm:table-cell">
                Atualizado
              </TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((protocolo) => {
              const isRecent =
                new Date().getTime() -
                  new Date(protocolo.atualizadoEm).getTime() <
                24 * 60 * 60 * 1000;

              return (
                <TableRow
                  key={protocolo.id}
                  className="!border-border/30 hover:!bg-muted/20"
                >
                  <TableCell className="font-medium">
                    <Link
                      href={`/protocolo-interno/${protocolo.id}`}
                      className="inline-flex items-center gap-1.5 hover:underline"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {protocolo.numero}
                    </Link>
                    {isRecent && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {protocolo.assunto}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {protocolo.setorOrigem}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={protocolo.status} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDistanceToNow(
                      new Date(protocolo.atualizadoEm),
                      { addSuffix: true, locale: ptBR }
                    )}
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
                          <Link href={`/protocolo-interno/${protocolo.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Link>
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
    </div>
  );
}
