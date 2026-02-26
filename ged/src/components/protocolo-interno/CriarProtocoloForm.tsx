'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentoUploadZone } from './DocumentoUploadZone';
import { useCreateProtocoloInterno } from '@/hooks/use-protocolos-internos';
import { useSetores } from '@/hooks/use-protocolos';
import { usePermissions } from '@/hooks/use-permissions';
import type { UploadFileItem } from '@/lib/types';

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
  setorOrigem: z.string().min(1, 'Selecione o setor de origem'),
});

type FormData = z.infer<typeof schema>;

export function CriarProtocoloForm() {
  const router = useRouter();
  const { user } = usePermissions();
  const { data: setores } = useSetores();
  const createMutation = useCreateProtocoloInterno();

  const [files, setFiles] = useState<UploadFileItem[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      assunto: '',
      descricao: '',
      setorOrigem: user.nomeSetor,
    },
  });

  const descricao = watch('descricao') ?? '';

  const onSubmit = useCallback(
    (data: FormData) => {
      const parsed = schema.safeParse(data);
      if (!parsed.success) return;

      createMutation.mutate(parsed.data, {
        onSuccess: (protocolo) => {
          router.push(`/protocolo-interno/${protocolo.id}`);
        },
      });
    },
    [createMutation, router]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Assunto */}
      <div className="space-y-2">
        <Label htmlFor="assunto">
          Assunto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="assunto"
          placeholder="Ex: Solicitação de compra de material..."
          {...register('assunto')}
        />
        {errors.assunto && (
          <p className="text-sm text-destructive">{errors.assunto.message}</p>
        )}
      </div>

      {/* Setor de Origem */}
      <div className="space-y-2">
        <Label htmlFor="setorOrigem">
          Setor de Origem <span className="text-destructive">*</span>
        </Label>
        <Select
          defaultValue={user.nomeSetor}
          onValueChange={(v) => setValue('setorOrigem', v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o setor" />
          </SelectTrigger>
          <SelectContent>
            {setores?.map((setor) => (
              <SelectItem key={setor.codigo} value={setor.nome}>
                {setor.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.setorOrigem && (
          <p className="text-sm text-destructive">
            {errors.setorOrigem.message}
          </p>
        )}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          placeholder="Descreva os detalhes do protocolo interno (opcional)..."
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

      {/* Upload de documentos */}
      <div className="space-y-2">
        <Label>Documentos anexos</Label>
        <p className="text-xs text-muted-foreground">
          Opcionalmente, anexe documentos ao protocolo durante a criação.
        </p>
        <DocumentoUploadZone
          files={files}
          onFilesChange={setFiles}
          disabled={createMutation.isPending}
        />
      </div>

      {/* Botão submit */}
      <div className="flex justify-end gap-3 border-t border-border/30 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={createMutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Criar Protocolo
        </Button>
      </div>
    </form>
  );
}
