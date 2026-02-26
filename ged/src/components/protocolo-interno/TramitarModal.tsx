'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowRightLeft, Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTramitarProtocoloInterno } from '@/hooks/use-protocolos-internos';
import { useSetores } from '@/hooks/use-protocolos';

const schema = z.object({
  paraSetor: z.string().min(1, 'Selecione o setor de destino'),
  despacho: z
    .string()
    .min(5, 'Despacho deve ter pelo menos 5 caracteres')
    .max(1000, 'Despacho deve ter no máximo 1000 caracteres'),
});

type FormData = z.infer<typeof schema>;

interface TramitarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocoloInternoId: string;
  setorAtual: string;
}

export function TramitarModal({
  open,
  onOpenChange,
  protocoloInternoId,
  setorAtual,
}: TramitarModalProps) {
  const tramitarMutation = useTramitarProtocoloInterno();
  const { data: setores } = useSetores();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      paraSetor: '',
      despacho: '',
    },
  });

  const despacho = watch('despacho');

  useEffect(() => {
    if (open) {
      reset({ paraSetor: '', despacho: '' });
    }
  }, [open, reset]);

  function onSubmit(data: FormData) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) return;

    tramitarMutation.mutate(
      {
        protocoloInternoId,
        paraSetor: parsed.data.paraSetor,
        despacho: parsed.data.despacho,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  }

  // Filtrar o setor atual da lista de destinos
  const setoresDestino = setores?.filter((s) => s.nome !== setorAtual) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Tramitar Protocolo</DialogTitle>
              <DialogDescription>
                Enviar protocolo para outro setor com despacho obrigatório.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Setor atual */}
        <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">Setor atual</p>
          <p className="text-sm font-medium">{setorAtual}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Setor destino */}
          <div className="space-y-2">
            <Label>
              Setor de destino <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={(v) => setValue('paraSetor', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o setor de destino" />
              </SelectTrigger>
              <SelectContent>
                {setoresDestino.map((setor) => (
                  <SelectItem key={setor.codigo} value={setor.nome}>
                    {setor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paraSetor && (
              <p className="text-sm text-destructive">
                {errors.paraSetor.message}
              </p>
            )}
          </div>

          {/* Despacho */}
          <div className="space-y-2">
            <Label htmlFor="despacho">
              Despacho <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="despacho"
              placeholder="Descreva o motivo da tramitação..."
              rows={4}
              {...register('despacho')}
            />
            <div className="flex items-center justify-between">
              {errors.despacho ? (
                <p className="text-sm text-destructive">
                  {errors.despacho.message}
                </p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  despacho.length > 900
                    ? despacho.length > 1000
                      ? 'font-medium text-destructive'
                      : 'text-amber-600'
                    : 'text-muted-foreground'
                }`}
              >
                {despacho.length}/1000
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={tramitarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={tramitarMutation.isPending}>
              {tramitarMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tramitar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
