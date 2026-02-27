'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAddAdmin } from '@/hooks/use-admin';
import { mockSetores } from '@/lib/mock-protocols';

const schema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z
    .string()
    .email('E-mail inválido')
    .max(200, 'E-mail deve ter no máximo 200 caracteres'),
  setor: z.string().min(1, 'Selecione um setor'),
});

type FormData = z.infer<typeof schema>;

interface AddAdminModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAdminModal({ open, onOpenChange }: AddAdminModalProps) {
  const addMutation = useAddAdmin();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      nome: '',
      email: '',
      setor: '',
    },
  });

  const setorValue = watch('setor');

  useEffect(() => {
    if (open) {
      reset({ nome: '', email: '', setor: '' });
    }
  }, [open, reset]);

  function onSubmit(data: FormData) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) return;

    addMutation.mutate(parsed.data, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Adicionar Administrador</DialogTitle>
          <DialogDescription>
            Adicione um novo administrador ao sistema GED. O usuário receberá
            permissões de admin imediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              placeholder="Ex: João da Silva"
              {...register('nome')}
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail institucional</Label>
            <Input
              id="email"
              type="email"
              placeholder="Ex: joao.silva@fadex.org.br"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Setor</Label>
            <Select
              value={setorValue}
              onValueChange={(v) => setValue('setor', v, { shouldValidate: true })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                {mockSetores.map((s) => (
                  <SelectItem key={s.codigo} value={s.nome}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.setor && (
              <p className="text-sm text-destructive">{errors.setor.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
