'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DocumentoUploadZone } from './DocumentoUploadZone';
import { useCreateProtocoloInterno } from '@/hooks/use-protocolos-internos';
import { useUploadDocumento } from '@/hooks/use-documentos';
import { useCurrentUser } from '@/hooks/use-user-sector';
import { useSetores } from '@/hooks/use-protocolos';
import { toast } from '@/hooks/use-toast';
import type { UploadFileItem } from '@/lib/types';

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
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : '')),
});

type FormValues = z.infer<typeof schema>;

export function CriarProtocoloForm() {
  const router = useRouter();
  const createMutation = useCreateProtocoloInterno();
  const uploadMutation = useUploadDocumento();
  const { data: currentUser } = useCurrentUser();
  const { data: setores = [] } = useSetores();

  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSetor, setSelectedSetor] = useState<string>('');

  const userHasSetor = !!currentUser?.setor;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      subject: '',
      interested: '',
      sender: '',
      project_name: '',
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      const parsed = schema.safeParse(data);
      if (!parsed.success) return;

      if (!userHasSetor && !selectedSetor) {
        toast({
          title: 'Setor obrigatorio',
          description: 'Selecione o setor de origem do protocolo.',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);

      try {
        // 1. Criar o protocolo
        let sectorCode: number | undefined;
        if (currentUser?.setor) {
          sectorCode = Number(currentUser.setor);
        } else if (selectedSetor) {
          sectorCode = Number(selectedSetor);
        }
        if (sectorCode && isNaN(sectorCode)) sectorCode = undefined;

        const protocolo = await createMutation.mutateAsync({
          subject: parsed.data.subject,
          interested: parsed.data.interested,
          sender: parsed.data.sender,
          project_name: parsed.data.project_name ?? '',
          sector_code: sectorCode,
        });

        // 2. Upload dos arquivos selecionados (se houver)
        const validFiles = files.filter((f) => f.status === 'queued');
        if (validFiles.length > 0) {
          let successCount = 0;
          let errorCount = 0;

          for (const item of validFiles) {
            try {
              const formData = new FormData();
              formData.append('file', item.file);
              if (item.tipoDocumentoId) {
                formData.append('tipo_documento_id', item.tipoDocumentoId);
              }

              await uploadMutation.mutateAsync({
                source: 'interno',
                id: protocolo.id,
                formData,
              });
              successCount++;
            } catch {
              errorCount++;
            }
          }

          if (successCount > 0) {
            toast({
              title: 'Protocolo criado',
              description: `Protocolo criado com ${successCount} documento${successCount !== 1 ? 's' : ''} anexado${successCount !== 1 ? 's' : ''}.`,
            });
          }
          if (errorCount > 0) {
            toast({
              title: 'Aviso',
              description: `Protocolo criado, mas ${errorCount} arquivo${errorCount !== 1 ? 's' : ''} falharam no upload. Voce pode anexa-los na pagina do protocolo.`,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Protocolo criado',
            description: 'Protocolo interno criado com sucesso.',
          });
        }

        router.push(`/protocolo-interno/${protocolo.id}`);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        const message = apiErr?.message || 'Erro ao criar protocolo';
        toast({
          title: 'Erro',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setSubmitting(false);
      }
    },
    [createMutation, uploadMutation, files, router, currentUser, userHasSetor, selectedSetor]
  );

  const isPending = submitting || createMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Assunto */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Assunto <span className="text-destructive">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Ex: Solicitacao de compra de material..."
          {...register('subject')}
        />
        {errors.subject && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* Interessado */}
      <div className="space-y-2">
        <Label htmlFor="interested">
          Interessado <span className="text-destructive">*</span>
        </Label>
        <Input
          id="interested"
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
        <Label htmlFor="sender">
          Remetente <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sender"
          placeholder="Nome do remetente..."
          {...register('sender')}
        />
        {errors.sender && (
          <p className="text-sm text-destructive">{errors.sender.message}</p>
        )}
      </div>

      {/* Nome do Projeto */}
      <div className="space-y-2">
        <Label htmlFor="project_name">Nome do Projeto</Label>
        <Input
          id="project_name"
          placeholder="Nome do projeto relacionado (opcional)..."
          {...register('project_name')}
        />
        {errors.project_name && (
          <p className="text-sm text-destructive">
            {errors.project_name.message}
          </p>
        )}
      </div>

      {/* Setor (apenas quando o usuario nao tem setor definido) */}
      {!userHasSetor && (
        <div className="space-y-2">
          <Label htmlFor="sector">
            Setor <span className="text-destructive">*</span>
          </Label>
          <Select value={selectedSetor} onValueChange={setSelectedSetor}>
            <SelectTrigger id="sector">
              <SelectValue placeholder="Selecione o setor..." />
            </SelectTrigger>
            <SelectContent>
              {setores.map((s) => (
                <SelectItem key={s.codigo} value={String(s.codigo)}>
                  {s.descricao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Seu usuario nao possui setor vinculado. Selecione o setor de origem do protocolo.
          </p>
        </div>
      )}

      {/* Upload de documentos */}
      <div className="space-y-2">
        <Label>Documentos anexos</Label>
        <p className="text-xs text-muted-foreground">
          Opcionalmente, anexe documentos ao protocolo durante a criacao.
        </p>
        <DocumentoUploadZone
          files={files}
          onFilesChange={setFiles}
          disabled={isPending}
        />
      </div>

      {/* Botao submit */}
      <div className="flex justify-end gap-3 border-t border-border/30 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
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
