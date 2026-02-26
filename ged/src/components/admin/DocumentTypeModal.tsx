'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

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
import {
  useCreateDocumentType,
  useUpdateDocumentType,
} from '@/hooks/use-document-types';
import type { DocumentType } from '@/lib/types';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z
    .string()
    .min(5, 'Descrição deve ter pelo menos 5 caracteres')
    .max(500, 'Descrição deve ter no máximo 500 caracteres'),
});

type FormData = z.infer<typeof schema>;

interface DocumentTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingType: DocumentType | null;
}

export function DocumentTypeModal({
  open,
  onOpenChange,
  editingType,
}: DocumentTypeModalProps) {
  const createMutation = useCreateDocumentType();
  const updateMutation = useUpdateDocumentType();
  const isEditing = !!editingType;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: editingType?.name ?? '',
        description: editingType?.description ?? '',
      });
    }
  }, [open, editingType, reset]);

  function onSubmit(data: FormData) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) return;

    if (isEditing) {
      updateMutation.mutate(
        { id: editingType.id, ...parsed.data },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createMutation.mutate(parsed.data, {
        onSuccess: () => onOpenChange(false),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tipo de Documento' : 'Novo Tipo de Documento'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Altere as informações do tipo de documento.'
              : 'Preencha as informações para criar um novo tipo de documento.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Ex: Ofício, Contrato, Nota Fiscal..."
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva brevemente este tipo de documento..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
