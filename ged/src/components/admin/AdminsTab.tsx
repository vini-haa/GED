'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  Users,
  Shield,
  ShieldCheck,
  Trash2,
  Power,
  PowerOff,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/shared/Pagination';
import { AddAdminModal } from './AddAdminModal';
import { useAdmins, useRemoveAdmin, useToggleAdmin } from '@/hooks/use-admin';
import { usePermissions } from '@/hooks/use-permissions';
import type { AdminUser } from '@/lib/types';

const PER_PAGE = 8;

export function AdminsTab() {
  const { data: admins, isLoading } = useAdmins();
  const removeMutation = useRemoveAdmin();
  const toggleMutation = useToggleAdmin();
  const { canManageAdmins, isSuperAdmin, user } = usePermissions();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    if (!admins) return [];
    return admins.filter((a) => {
      if (search === '') return true;
      const term = search.toLowerCase();
      return (
        a.nome.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        a.setor.toLowerCase().includes(term)
      );
    });
  }, [admins, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Super admin card
  const superAdmin = admins?.find((a) => a.gedRole === 'super_admin');

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleConfirmRemove() {
    if (!confirmRemove) return;
    removeMutation.mutate(confirmRemove.id, {
      onSuccess: () => setConfirmRemove(null),
    });
  }

  function handleToggle(admin: AdminUser) {
    toggleMutation.mutate(admin.id);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border/30 p-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card Super Admin */}
      {superAdmin && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{superAdmin.nome}</p>
                <Badge variant="default" className="text-[10px]">
                  Super Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{superAdmin.email}</p>
              <p className="text-xs text-muted-foreground">{superAdmin.setor}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar administrador..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {canManageAdmins && (
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Admin
          </Button>
        )}
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card/50 py-16">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            {search
              ? 'Nenhum administrador encontrado com os filtros aplicados.'
              : 'Nenhum administrador cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:!bg-transparent">
                <TableHead className="w-[200px]">Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="hidden md:table-cell">Setor</TableHead>
                <TableHead className="w-[100px]">Perfil</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="hidden w-[120px] sm:table-cell">Adicionado em</TableHead>
                {canManageAdmins && (
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((admin) => {
                const isSelf = admin.email === user?.email;
                const isSA = admin.gedRole === 'super_admin';

                return (
                  <TableRow
                    key={admin.id}
                    className="!border-border/30 hover:!bg-muted/20"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isSA ? (
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        )}
                        {admin.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {admin.email}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {admin.setor}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isSA ? 'default' : 'secondary'}>
                        {isSA ? 'Super Admin' : 'Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.ativo ? 'default' : 'secondary'}>
                        {admin.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {format(new Date(admin.adicionadoEm), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    {canManageAdmins && (
                      <TableCell className="text-right">
                        {/* Não permite ações no super admin ou em si mesmo */}
                        {!isSA && !isSelf && (
                          <TooltipProvider delayDuration={300}>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleToggle(admin)}
                                    disabled={toggleMutation.isPending}
                                  >
                                    {toggleMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : admin.ativo ? (
                                      <PowerOff className="h-4 w-4 text-destructive" />
                                    ) : (
                                      <Power className="h-4 w-4 text-green-600" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {admin.ativo ? 'Desativar' : 'Reativar'}
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setConfirmRemove(admin)}
                                    disabled={removeMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
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

      {/* Modal adicionar admin */}
      <AddAdminModal open={modalOpen} onOpenChange={setModalOpen} />

      {/* Dialog de confirmação de remoção */}
      <AlertDialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover administrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <span className="font-medium text-foreground">
                {confirmRemove?.nome}
              </span>{' '}
              ({confirmRemove?.email}) da lista de administradores? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
