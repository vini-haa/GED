'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useUpdateProtocoloInterno } from '@/hooks/use-protocolos-internos';
import type { ProtocoloInterno } from '@/lib/types';

const schema = z.object({
  assunto: z
    .string()
    .min(5, 'Assunto deve ter pelo menos 5 caracteres')
    .max(200, 'Assunto deve ter no máximo 200 caracteres'),
  descricao: z
    .string()
    .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
    .optional()
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : undefined)),
});

type FormData = z.infer<typeof schema>;

interface EditarProtocoloModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolo: ProtocoloInterno;
}

export function EditarProtocoloModal({
  open,
  onOpenChange,
  protocolo,
}: EditarProtocoloModalProps) {
  const updateMutation = useUpdateProtocoloInterno();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      assunto: protocolo.assunto,
      descricao: protocolo.descricao ?? '',
    },
  });

  const descricao = watch('descricao') ?? '';

  useEffect(() => {
    if (open) {
      reset({
        assunto: protocolo.assunto,
        descricao: protocolo.descricao ?? '',
      });
    }
  }, [open, protocolo, reset]);

  function onSubmit(data: FormData) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) return;

    updateMutation.mutate(
      {
        id: protocolo.id,
        assunto: parsed.data.assunto,
        descricao: parsed.data.descricao,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Editar Protocolo</DialogTitle>
              <DialogDescription>
                Altere o assunto ou a descrição do protocolo{' '}
                <span className="font-medium">{protocolo.numero}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="edit-assunto">
              Assunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-assunto"
              placeholder="Ex: Solicitação de compra de material..."
              {...register('assunto')}
            />
            {errors.assunto && (
              <p className="text-sm text-destructive">
                {errors.assunto.message}
              </p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="edit-descricao">Descrição</Label>
            <Textarea
              id="edit-descricao"
              placeholder="Descreva os detalhes do protocolo (opcional)..."
              rows={4}
              {...register('descricao')}
            />
            <div className="flex items-center justify-between">
              {errors.descricao ? (
                <p className="text-sm text-destructive">
                  {errors.descricao.message}
                </p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  descricao.length > 1800
                    ? descricao.length > 2000
                      ? 'font-medium text-destructive'
                      : 'text-amber-600'
                    : 'text-muted-foreground'
                }`}
              >
                {descricao.length}/2000
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !isDirty}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
