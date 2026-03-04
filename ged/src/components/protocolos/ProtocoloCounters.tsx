'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useProtocoloCounters } from '@/hooks/use-protocolos';
import { FileText, FileX, Files } from 'lucide-react';

interface ProtocoloCountersProps {
  setor: number | null;
}

export function ProtocoloCounters({ setor }: ProtocoloCountersProps) {
  const { data: counters, isLoading } = useProtocoloCounters(setor);

  const isGlobal = !setor || setor === 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-1 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: isGlobal ? 'Total de Protocolos' : 'Protocolos no Setor',
      value: counters?.total_protocolos ?? 0,
      description: isGlobal ? 'registrados no sistema' : 'vinculados ao seu setor',
      icon: FileText,
    },
    {
      title: 'Sem Documentos',
      value: counters?.sem_documentos ?? 0,
      description: 'aguardando anexos',
      icon: FileX,
    },
    {
      title: 'Total de Documentos',
      value: counters?.docs_anexados ?? 0,
      description: isGlobal ? 'anexados no sistema' : 'em todos os protocolos',
      icon: Files,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
