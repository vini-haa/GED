'use client';

import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Building2, Loader2, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DocumentoUploadZone } from './DocumentoUploadZone';
import { ProjetoCombobox } from './ProjetoCombobox';
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
  const [projectName, setProjectName] = useState('');
  const [observations, setObservations] = useState('');

  // Resolver nome do setor do usuário
  const userSetorCode = currentUser?.setor ? Number(currentUser.setor) : null;
  const userSetorName = userSetorCode
    ? setores.find((s) => s.codigo === userSetorCode)?.descricao ?? `Setor ${userSetorCode}`
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      subject: '',
    },
  });

  const onSubmit = useCallback(
    async (data: FormValues) => {
      const parsed = schema.safeParse(data);
      if (!parsed.success) return;

      if (!userSetorCode) {
        toast({
          title: 'Setor nao identificado',
          description: 'Seu usuario nao possui setor vinculado. Contate o administrador.',
          variant: 'destructive',
        });
        return;
      }

      setSubmitting(true);

      try {
        const protocolo = await createMutation.mutateAsync({
          subject: parsed.data.subject,
          project_name: projectName,
          observations,
          sector_code: userSetorCode,
        });

        // Upload dos arquivos selecionados (se houver)
        const validFiles = files.filter((f) => f.status === 'queued');
        if (validFiles.length > 0) {
          const withoutType = validFiles.filter((f) => !f.tipoDocumentoId);
          if (withoutType.length > 0) {
            toast({
              title: 'Tipo obrigatorio',
              description: `Selecione o tipo de documento para ${withoutType.length === 1 ? 'o arquivo' : 'todos os arquivos'} antes de enviar.`,
              variant: 'destructive',
            });
            setSubmitting(false);
            return;
          }
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
    [createMutation, uploadMutation, files, router, userSetorCode, projectName, observations]
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

      {/* Projeto (Combobox com busca) */}
      <div className="space-y-2">
        <Label>Projeto</Label>
        <ProjetoCombobox
          value={projectName}
          onChange={setProjectName}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Comece a digitar para buscar projetos cadastrados.
        </p>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          placeholder="Informações adicionais, detalhes relevantes..."
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          disabled={isPending}
          rows={4}
          maxLength={5000}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground">
          Campo pesquisável — use para registrar informações que ajudem a localizar este protocolo.
        </p>
      </div>

      {/* Setor (read-only, preenchido automaticamente) */}
      <div className="space-y-2">
        <Label>Setor</Label>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{userSetorName ?? 'Carregando...'}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          O protocolo sera criado no setor do seu usuario.
        </p>
      </div>

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
        <Button type="submit" disabled={isPending || !userSetorCode}>
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
