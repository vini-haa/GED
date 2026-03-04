'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { useDownloadDocumento } from '@/hooks/use-documentos';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from '@/hooks/use-toast';
import type { Observacao } from '@/lib/types';

interface ObservacaoListProps {
  source: string;
  id: number;
}

export function ObservacaoList({ source, id }: ObservacaoListProps) {
  const { data: response, isLoading } = useObservacoes(source, id);
  const { canEdit } = usePermissions();
  const deleteMutation = useDeleteObservacao();
  const downloadMutation = useDownloadDocumento();

  const handleDocClick = useCallback(
    (docId: string) => {
      downloadMutation.mutate(docId, {
        onSuccess: (blob) => {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          setTimeout(() => URL.revokeObjectURL(url), 30000);
        },
        onError: () => {
          toast({
            title: 'Erro',
            description: 'Não foi possível abrir o documento.',
            variant: 'destructive',
          });
        },
      });
    },
    [downloadMutation]
  );

  const [deleteObs, setDeleteObs] = useState<Observacao | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMotivo, setDeleteMotivo] = useState('');

  const observacoes = response?.data;

  // Organizar em árvore: pais (sem parent_id) e filhos (com parent_id)
  const { rootObservacoes, repliesMap } = useMemo(() => {
    if (!observacoes) return { rootObservacoes: [], repliesMap: new Map<string, Observacao[]>() };

    const roots: Observacao[] = [];
    const map = new Map<string, Observacao[]>();

    for (const obs of observacoes) {
      if (obs.parent_id) {
        const existing = map.get(obs.parent_id) ?? [];
        existing.push(obs);
        map.set(obs.parent_id, existing);
      } else {
        roots.push(obs);
      }
    }

    // Ordenar replies cronologicamente (mais antigo primeiro)
    map.forEach((replies, key) => {
      map.set(
        key,
        replies.sort(
          (a: Observacao, b: Observacao) =>
            new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
        )
      );
    });

    // Ordenar raízes: importantes primeiro, depois cronológica reversa
    const importantes = roots
      .filter((o) => o.is_important)
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );

    const normais = roots
      .filter((o) => !o.is_important)
      .sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );

    return {
      rootObservacoes: [...importantes, ...normais],
      repliesMap: map,
    };
  }, [observacoes]);

  const handleDeleteRequest = useCallback((obs: Observacao) => {
    setDeleteObs(obs);
    setDeleteMotivo('');
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback((open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setDeleteObs(null);
      setDeleteMotivo('');
    }
  }, []);

  const motivoTooShort = deleteMotivo.trim().length < 10;
  const motivoTooLong = deleteMotivo.length > 500;

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteObs || motivoTooShort || motivoTooLong) return;

    deleteMutation.mutate(
      { id: deleteObs.id, motivo: deleteMotivo.trim() },
      {
        onSuccess: () => handleDeleteClose(false),
      }
    );
  }, [deleteObs, deleteMotivo, motivoTooShort, motivoTooLong, deleteMutation, handleDeleteClose]);

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
      {canEdit && <ObservacaoForm source={source} id={id} />}

      {rootObservacoes.length === 0 ? (
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
          {rootObservacoes.map((obs) => (
            <ObservacaoCard
              key={obs.id}
              observacao={obs}
              replies={repliesMap.get(obs.id) ?? []}
              source={source}
              protocolId={id}
              onDelete={handleDeleteRequest}
              onDocClick={handleDocClick}
            />
          ))}
        </div>
      )}

      {/* Modal de exclusao */}
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
              <p className="text-sm line-clamp-3">{deleteObs.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Por {deleteObs.created_by_name} — {deleteObs.created_by_sector}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">
                Justificativa <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo"
                placeholder="Informe o motivo da exclusão desta observação..."
                rows={3}
                value={deleteMotivo}
                onChange={(e) => setDeleteMotivo(e.target.value)}
              />
              {deleteMotivo.length > 0 && motivoTooShort && (
                <p className="text-sm text-destructive">
                  Justificativa deve ter pelo menos 10 caracteres
                </p>
              )}
              {motivoTooLong && (
                <p className="text-sm text-destructive">
                  Justificativa deve ter no máximo 500 caracteres
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
                type="button"
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={motivoTooShort || motivoTooLong || deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Excluir
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
