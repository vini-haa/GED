'use client';

import Link from 'next/link';
import { AlertTriangle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ProtocoloSemDocs } from '@/lib/types';

interface ListaProtocolosSemDocsProps {
  data: ProtocoloSemDocs[] | undefined;
  isLoading: boolean;
}

function getDiasVariant(dias: number): 'default' | 'warning' | 'destructive' {
  if (dias >= 30) return 'destructive';
  if (dias >= 14) return 'warning';
  return 'default';
}

function getDiasColor(dias: number): string {
  if (dias >= 30) return 'text-red-950 dark:text-red-100 font-semibold';
  if (dias >= 14) return 'text-amber-950 dark:text-amber-100 font-medium';
  return 'text-foreground';
}

export function ListaProtocolosSemDocs({
  data,
  isLoading,
}: ListaProtocolosSemDocsProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-4">
        <Skeleton className="h-5 w-48" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-medium">Protocolos sem Documentos</h3>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Protocolos que precisam de atenção
      </p>

      <div className="mt-4 overflow-hidden rounded-lg border border-border/40">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:!bg-transparent">
              <TableHead className="w-[110px]">Protocolo</TableHead>
              <TableHead>Assunto</TableHead>
              <TableHead className="hidden md:table-cell">
                Setor Destino
              </TableHead>
              <TableHead className="w-[100px] text-center">Dias sem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.id}
                className="!border-border/30 hover:!bg-muted/20"
              >
                <TableCell className="font-medium">
                  <Link
                    href={`/protocolo/${item.numero.replace('/', '/')}`}
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.numero}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {item.assunto ?? '—'}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {item.setorDestino ?? '—'}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={getDiasVariant(item.diasSemDocumento)}>
                    <span className={getDiasColor(item.diasSemDocumento)}>
                      {item.diasSemDocumento}d
                    </span>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
