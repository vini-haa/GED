'use client';

import Link from 'next/link';
import { formatDateTime } from '@/lib/date-utils';
import {
  AlertTriangle,
  Eye,
  FolderOpen,
  Inbox,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
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
import type { ProtocoloInterno } from '@/lib/types';
import { formatSectorName } from '@/lib/types';

interface ProtocoloInternoTableProps {
  data: ProtocoloInterno[];
  isLoading: boolean;
  hasFilters: boolean;
}

export function ProtocoloInternoTable({
  data,
  isLoading,
  hasFilters,
}: ProtocoloInternoTableProps) {
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/50 py-16">
        <Inbox className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {hasFilters
            ? 'Nenhum protocolo interno encontrado com os filtros aplicados.'
            : 'Nenhum protocolo interno cadastrado.'}
        </p>
        {!hasFilters && (
          <Button variant="outline" asChild>
            <Link href="/protocolo-interno/novo" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Protocolo Interno
            </Link>
          </Button>
        )}
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
              <TableHead className="hidden lg:table-cell">
                Projeto
              </TableHead>
              <TableHead className="hidden md:table-cell">
                Setor Atual
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
            {data.map((protocolo) => (
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
                    {protocolo.protocol_number}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {protocolo.subject}
                </TableCell>
                <TableCell className="hidden lg:table-cell max-w-[180px]">
                  {protocolo.project_name ? (
                    <span className="block truncate" title={protocolo.project_name}>
                      {protocolo.project_name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatSectorName(protocolo.current_sector_name)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={protocolo.status} />
                </TableCell>
                <TableCell className="hidden sm:table-cell text-center">
                  <span className="inline-flex items-center gap-1">
                    {protocolo.doc_count}
                    {protocolo.doc_count === 0 && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatDateTime(protocolo.created_at)}
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
                        <Link href={`/protocolo-interno/${protocolo.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
