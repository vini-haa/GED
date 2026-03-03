'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteDocumento } from '@/hooks/use-documentos';
import { toast } from '@/hooks/use-toast';
import type { Documento } from '@/lib/types';
import type { ApiError } from '@/lib/api-client';

interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento: Documento | null;
}

export function DeleteModal({
  open,
  onOpenChange,
  documento,
}: DeleteModalProps) {
  const deleteMutation = useDeleteDocumento();
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (open) {
      setMotivo('');
      setErro('');
    }
  }, [open]);

  function handleDelete() {
    if (!documento) return;

    const trimmed = motivo.trim();
    if (trimmed.length < 3) {
      setErro('Justificativa deve ter pelo menos 3 caracteres');
      return;
    }
    if (trimmed.length > 500) {
      setErro('Justificativa deve ter no máximo 500 caracteres');
      return;
    }

    setErro('');
    deleteMutation.mutate(
      { id: documento.id, motivo_exclusao: trimmed },
      {
        onSuccess: () => {
          toast({
            title: 'Documento excluído',
            description: 'O documento foi excluído com sucesso.',
          });
          onOpenChange(false);
        },
        onError: (error) => {
          const apiError = error as ApiError;
          toast({
            title: 'Erro ao excluir',
            description: apiError?.message || 'Não foi possível excluir o documento.',
            variant: 'destructive',
          });
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Excluir Documento</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {documento && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="text-sm font-medium">{documento.nome_arquivo}</p>
            {documento.tipo_documento_nome && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tipo: {documento.tipo_documento_nome}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivoExclusao">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivoExclusao"
              placeholder="Informe o motivo da exclusão deste documento..."
              rows={3}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (erro) setErro('');
              }}
            />
            {erro && (
              <p className="text-sm text-destructive">{erro}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
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
  );
}
