'use client';

import { useMemo, useState } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { protocols as allProtocols } from '@/lib/data';
import type { Protocol, ProtocolStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabValue = 'all' | 'my-sector' | 'recents' | 'no-docs' | 'internals';

const getStatusVariant = (
  status: ProtocolStatus
): 'success' | 'warning' | 'default' | 'destructive' => {
  switch (status) {
    case 'Concluído':
      return 'success';
    case 'Pendente':
      return 'warning';
    case 'Em Andamento':
      return 'default';
    case 'Cancelado':
      return 'destructive';
    default:
      return 'default';
  }
};

export function ProtocolTable() {
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProtocols = useMemo(() => {
    let protocols: Protocol[] = allProtocols;

    // Filter by tab
    if (activeTab === 'no-docs') {
      protocols = protocols.filter((p) => p.documentCount === 0);
    } else if (activeTab === 'recents') {
        protocols = protocols.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 10);
    }
    // Note: 'my-sector' and 'internals' are placeholders for now
    
    // Filter by search term
    if (searchTerm) {
      protocols = protocols.filter(
        (p) =>
          p.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.interestedParty.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return protocols;
  }, [activeTab, searchTerm]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocolos</CardTitle>
        <CardDescription>
          Gerencie e acompanhe todos os protocolos do seu setor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)}>
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="my-sector">Meu Setor</TabsTrigger>
              <TabsTrigger value="recents">Recentes</TabsTrigger>
              <TabsTrigger value="no-docs">Sem Docs</TabsTrigger>
              <TabsTrigger value="internals">Internos</TabsTrigger>
            </TabsList>
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por palavra-chave..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
          <TabsContent value={activeTab} className="mt-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead className="hidden md:table-cell">Projeto</TableHead>
                    <TableHead>Interessado</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Docs</TableHead>
                    <TableHead className="hidden sm:table-cell">Última Atividade</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProtocols.map((protocol) => (
                    <TableRow key={protocol.id}>
                      <TableCell className="font-medium">{protocol.number}</TableCell>
                      <TableCell className="hidden md:table-cell">{protocol.project}</TableCell>
                      <TableCell>{protocol.interestedParty}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatusVariant(protocol.status)}>
                          {protocol.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">{protocol.documentCount}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDistanceToNow(new Date(protocol.lastUpdated), { addSuffix: true, locale: ptBR })}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem>Anexar Documento</DropdownMenuItem>
                            <DropdownMenuItem>Mudar Status</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
