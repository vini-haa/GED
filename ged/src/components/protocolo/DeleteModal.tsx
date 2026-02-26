'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import type { Documento } from '@/lib/types';

const schema = z.object({
  motivoExclusao: z
    .string()
    .min(10, 'Justificativa deve ter pelo menos 10 caracteres')
    .max(500, 'Justificativa deve ter no máximo 500 caracteres'),
});

type FormData = z.infer<typeof schema>;

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      motivoExclusao: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({ motivoExclusao: '' });
    }
  }, [open, reset]);

  function onSubmit(data: FormData) {
    if (!documento) return;

    const parsed = schema.safeParse(data);
    if (!parsed.success) return;

    deleteMutation.mutate(
      { id: documento.id, motivo: parsed.data.motivoExclusao },
      {
        onSuccess: () => onOpenChange(false),
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
            <p className="text-sm font-medium">{documento.nomeArquivo}</p>
            {documento.tipoDocumentoNome && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tipo: {documento.tipoDocumentoNome}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivoExclusao">
              Justificativa <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motivoExclusao"
              placeholder="Informe o motivo da exclusão deste documento..."
              rows={3}
              {...register('motivoExclusao')}
            />
            {errors.motivoExclusao && (
              <p className="text-sm text-destructive">
                {errors.motivoExclusao.message}
              </p>
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
  );
}
