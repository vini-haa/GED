'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  subject: z
    .string()
    .min(5, 'Assunto deve ter pelo menos 5 caracteres')
    .max(200, 'Assunto deve ter no maximo 200 caracteres'),
  interested: z
    .string()
    .min(1, 'Interessado e obrigatorio')
    .max(200, 'Interessado deve ter no maximo 200 caracteres'),
  sender: z
    .string()
    .min(1, 'Remetente e obrigatorio')
    .max(200, 'Remetente deve ter no maximo 200 caracteres'),
  project_name: z
    .string()
    .max(200, 'Nome do projeto deve ter no maximo 200 caracteres')
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
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      subject: protocolo.subject,
      interested: protocolo.interested,
      sender: protocolo.sender,
      project_name: protocolo.project_name ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        subject: protocolo.subject,
        interested: protocolo.interested,
        sender: protocolo.sender,
        project_name: protocolo.project_name ?? '',
      });
    }
  }, [open, protocolo, reset]);

  function onSubmit(data: FormData) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) return;

    updateMutation.mutate(
      {
        id: protocolo.id,
        data: {
          subject: parsed.data.subject,
          interested: parsed.data.interested,
          sender: parsed.data.sender,
          project_name: parsed.data.project_name,
        },
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
                Altere os dados do protocolo{' '}
                <span className="font-medium">{protocolo.protocol_number}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="edit-subject">
              Assunto <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-subject"
              placeholder="Ex: Solicitacao de compra de material..."
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">
                {errors.subject.message}
              </p>
            )}
          </div>

          {/* Interessado */}
          <div className="space-y-2">
            <Label htmlFor="edit-interested">
              Interessado <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-interested"
              placeholder="Nome do interessado..."
              {...register('interested')}
            />
            {errors.interested && (
              <p className="text-sm text-destructive">
                {errors.interested.message}
              </p>
            )}
          </div>

          {/* Remetente */}
          <div className="space-y-2">
            <Label htmlFor="edit-sender">
              Remetente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-sender"
              placeholder="Nome do remetente..."
              {...register('sender')}
            />
            {errors.sender && (
              <p className="text-sm text-destructive">
                {errors.sender.message}
              </p>
            )}
          </div>

          {/* Nome do Projeto */}
          <div className="space-y-2">
            <Label htmlFor="edit-project_name">Nome do Projeto</Label>
            <Input
              id="edit-project_name"
              placeholder="Nome do projeto relacionado (opcional)..."
              {...register('project_name')}
            />
            {errors.project_name && (
              <p className="text-sm text-destructive">
                {errors.project_name.message}
              </p>
            )}
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
