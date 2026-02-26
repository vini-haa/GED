'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Pencil,
  Power,
  PowerOff,
  Search,
  FileText,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/shared/Pagination';
import { DocumentTypeModal } from './DocumentTypeModal';
import {
  useDocumentTypes,
  useToggleDocumentType,
} from '@/hooks/use-document-types';
import { usePermissions } from '@/hooks/use-permissions';
import type { DocumentType } from '@/lib/types';

const PER_PAGE = 8;

export function TiposDocumentoTab() {
  const { data: types, isLoading } = useDocumentTypes();
  const toggleMutation = useToggleDocumentType();
  const { canManageDocumentTypes } = usePermissions();

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);

  const filtered = useMemo(() => {
    if (!types) return [];
    return types.filter((t) => {
      const matchesSearch =
        search === '' ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filterActive === 'all' ||
        (filterActive === 'active' && t.active) ||
        (filterActive === 'inactive' && !t.active);
      return matchesSearch && matchesFilter;
    });
  }, [types, search, filterActive]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleOpenCreate() {
    setEditingType(null);
    setModalOpen(true);
  }

  function handleOpenEdit(type: DocumentType) {
    setEditingType(type);
    setModalOpen(true);
  }

  function handleToggle(id: string) {
    toggleMutation.mutate(id);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleFilterChange(value: 'all' | 'active' | 'inactive') {
    setFilterActive(value);
    setPage(1);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border/30 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros e ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tipo de documento..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-1">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <Button
                key={f}
                variant={filterActive === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange(f)}
              >
                {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
              </Button>
            ))}
          </div>
        </div>
        {canManageDocumentTypes && (
          <Button onClick={handleOpenCreate} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipo
          </Button>
        )}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/50 py-16">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {search || filterActive !== 'all'
              ? 'Nenhum tipo de documento encontrado com os filtros aplicados.'
              : 'Nenhum tipo de documento cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:!bg-transparent">
                <TableHead className="w-[200px]">Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="hidden w-[140px] sm:table-cell">Atualizado em</TableHead>
                {canManageDocumentTypes && (
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((type) => (
                <TableRow
                  key={type.id}
                  className="!border-border/30 hover:!bg-muted/20"
                >
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {type.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.active ? 'default' : 'secondary'}>
                      {type.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                    {format(new Date(type.updatedAt), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  {canManageDocumentTypes && (
                    <TableCell className="text-right">
                      <TooltipProvider delayDuration={300}>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(type)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleToggle(type.id)}
                                disabled={toggleMutation.isPending}
                              >
                                {toggleMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : type.active ? (
                                  <PowerOff className="h-4 w-4 text-destructive" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {type.active ? 'Desativar' : 'Reativar'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginação */}
      {filtered.length > PER_PAGE && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={filtered.length}
          perPage={PER_PAGE}
          onPageChange={setPage}
        />
      )}

      {/* Modal criar/editar */}
      <DocumentTypeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingType={editingType}
      />
    </div>
  );
}
