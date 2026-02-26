'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { MessageSquareOff, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ObservacaoForm } from './ObservacaoForm';
import { ObservacaoCard } from './ObservacaoCard';
import { useObservacoes, useDeleteObservacao } from '@/hooks/use-observacoes';
import { usePermissions } from '@/hooks/use-permissions';
import type { Observacao } from '@/lib/types';

const deleteSchema = z.object({
  motivo: z
    .string()
    .min(10, 'Justificativa deve ter pelo menos 10 caracteres')
    .max(500, 'Justificativa deve ter no máximo 500 caracteres'),
});

type DeleteFormData = z.infer<typeof deleteSchema>;

interface ObservacaoListProps {
  protocoloSagi: string;
}

export function ObservacaoList({ protocoloSagi }: ObservacaoListProps) {
  const { data: observacoes, isLoading } = useObservacoes(protocoloSagi);
  const { canEdit } = usePermissions();
  const deleteMutation = useDeleteObservacao();

  const [deleteObs, setDeleteObs] = useState<Observacao | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeleteFormData>({
    defaultValues: { motivo: '' },
  });

  useEffect(() => {
    if (deleteOpen) {
      reset({ motivo: '' });
    }
  }, [deleteOpen, reset]);

  // Ordenar: importantes primeiro, depois cronológica reversa
  const sorted = useMemo(() => {
    if (!observacoes) return [];

    const importantes = observacoes
      .filter((o) => o.importante)
      .sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );

    const normais = observacoes
      .filter((o) => !o.importante)
      .sort(
        (a, b) =>
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );

    return [...importantes, ...normais];
  }, [observacoes]);

  const handleDeleteRequest = useCallback((obs: Observacao) => {
    setDeleteObs(obs);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback((open: boolean) => {
    setDeleteOpen(open);
    if (!open) setDeleteObs(null);
  }, []);

  function onDeleteSubmit(data: DeleteFormData) {
    if (!deleteObs) return;

    const parsed = deleteSchema.safeParse(data);
    if (!parsed.success) return;

    deleteMutation.mutate(
      { id: deleteObs.id, motivo: parsed.data.motivo },
      {
        onSuccess: () => handleDeleteClose(false),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && <ObservacaoForm protocoloSagi={protocoloSagi} />}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/50 py-12">
          <MessageSquareOff className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-sm font-medium">
              Nenhuma observação registrada
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {canEdit
                ? 'Adicione uma observação sobre este protocolo.'
                : 'Ainda não há observações neste protocolo.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((obs) => (
            <ObservacaoCard
              key={obs.id}
              observacao={obs}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Modal de exclusão */}
      <Dialog open={deleteOpen} onOpenChange={handleDeleteClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle>Excluir Observação</DialogTitle>
                <DialogDescription>
                  Esta ação não pode ser desfeita.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteObs && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm line-clamp-3">{deleteObs.texto}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Por {deleteObs.autorNome} — {deleteObs.autorSetor}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onDeleteSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="motivo">
                Justificativa <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="Informe o motivo da exclusão desta observação..."
                rows={3}
                {...register('motivo')}
              />
              {errors.motivo && (
                <p className="text-sm text-destructive">
                  {errors.motivo.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDeleteClose(false)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Excluir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
