'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  X,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useDocumentTypes } from '@/hooks/use-document-types';
import { useUploadDocumento } from '@/hooks/use-documentos';
import { toast } from '@/hooks/use-toast';
import type { UploadFileItem, UploadFileStatus } from '@/lib/types';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return FileSpreadsheet;
  if (mimeType === 'application/pdf' || mimeType.includes('word'))
    return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
  id: number;
}

export function DocumentoUploadModal({
  open,
  onOpenChange,
  source,
  id,
}: DocumentoUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const { data: documentTypes } = useDocumentTypes();
  const uploadMutation = useUploadDocumento();

  const activeTypes = documentTypes?.filter((dt) => dt.active) ?? [];

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: UploadFileItem[] = [];

      for (const file of fileArray) {
        if (file.size > MAX_FILE_SIZE) {
          validFiles.push({
            id: `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            file,
            tipoDocumentoId: null,
            status: 'error',
            progress: 0,
            error: `Arquivo muito grande (max. ${formatFileSize(MAX_FILE_SIZE)})`,
          });
          continue;
        }

        if (!ACCEPTED_TYPES.includes(file.type) && file.type !== '') {
          validFiles.push({
            id: `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            file,
            tipoDocumentoId: null,
            status: 'error',
            progress: 0,
            error: 'Tipo de arquivo nao suportado',
          });
          continue;
        }

        validFiles.push({
          id: `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          file,
          tipoDocumentoId: null,
          status: 'queued',
          progress: 0,
          error: null,
        });
      }

      setFiles((prev) => [...prev, ...validFiles]);
    },
    []
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const updateFileType = useCallback(
    (fileId: string, tipoDocumentoId: string | null) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, tipoDocumentoId } : f))
      );
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const handleUploadAll = useCallback(async () => {
    const queued = files.filter((f) => f.status === 'queued');
    if (queued.length === 0) return;

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of queued) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: 'uploading' as UploadFileStatus, progress: 30 }
            : f
        )
      );

      try {
        const formData = new FormData();
        formData.append('file', item.file);
        if (item.tipoDocumentoId) {
          formData.append('tipo_documento_id', item.tipoDocumentoId);
        }

        await uploadMutation.mutateAsync({ source, id, formData });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'done' as UploadFileStatus, progress: 100 }
              : f
          )
        );
        successCount++;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erro ao enviar arquivo';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error' as UploadFileStatus, error: message }
              : f
          )
        );
        errorCount++;
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast({
        title: 'Upload concluido',
        description: `${successCount} arquivo${successCount !== 1 ? 's' : ''} enviado${successCount !== 1 ? 's' : ''} com sucesso.`,
      });
    }
    if (errorCount > 0) {
      toast({
        title: 'Erros no upload',
        description: `${errorCount} arquivo${errorCount !== 1 ? 's' : ''} falharam.`,
        variant: 'destructive',
      });
    }
  }, [files, source, id, uploadMutation]);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && !uploading) {
        setFiles([]);
        setIsDragOver(false);
      }
      if (!uploading) {
        onOpenChange(open);
      }
    },
    [uploading, onOpenChange]
  );

  const queuedCount = files.filter((f) => f.status === 'queued').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anexar Documentos</DialogTitle>
          <DialogDescription>
            Arraste e solte arquivos ou clique para selecionar. PDF, imagens e
            documentos Office aceitos (max. 25MB cada).
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 transition-colors ${
            uploading
              ? 'cursor-not-allowed border-border/30 bg-muted/20 opacity-60'
              : isDragOver
                ? 'border-primary bg-primary/5'
                : 'border-border/50 bg-card/30 hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isDragOver ? 'bg-primary/10' : 'bg-muted'
            }`}
          >
            <Upload
              className={`h-5 w-5 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragOver
                ? 'Solte os arquivos aqui'
                : 'Arraste e solte arquivos aqui'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              ou clique para selecionar
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleInputChange}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Lista de arquivos */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((item) => {
              const Icon = getFileIcon(item.file.type);
              return (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 transition-colors ${
                    item.status === 'error'
                      ? 'border-destructive/30 bg-destructive/5'
                      : item.status === 'done'
                        ? 'border-emerald-200/60 bg-emerald-50/30 dark:border-emerald-800/30 dark:bg-emerald-950/10'
                        : 'border-border/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {item.file.name}
                        </p>
                        {item.status === 'done' && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        )}
                        {item.status === 'error' && (
                          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                        )}
                        {item.status === 'uploading' && (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(item.file.size)}</span>
                        {item.error && (
                          <span className="text-destructive">{item.error}</span>
                        )}
                      </div>

                      {(item.status === 'uploading' ||
                        item.status === 'queued') && (
                        <Progress
                          value={item.progress}
                          className="mt-2 h-1.5"
                        />
                      )}
                    </div>

                    {item.status !== 'error' && item.status !== 'done' && (
                      <Select
                        value={item.tipoDocumentoId ?? 'none'}
                        onValueChange={(v) =>
                          updateFileType(item.id, v === 'none' ? null : v)
                        }
                        disabled={uploading}
                      >
                        <SelectTrigger className="h-8 w-32 text-xs shrink-0">
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem tipo</SelectItem>
                          {activeTypes.map((dt) => (
                            <SelectItem key={dt.id} value={dt.id}>
                              {dt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {!uploading && item.status !== 'uploading' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => removeFile(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Resumo */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {files.length} arquivo{files.length !== 1 && 's'}
              </span>
              {doneCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-emerald-50/50 text-emerald-700 text-[10px] dark:bg-emerald-950/20 dark:text-emerald-400"
                >
                  {doneCount} enviado{doneCount !== 1 && 's'}
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-destructive/5 text-destructive text-[10px]"
                >
                  {errorCount} erro{errorCount !== 1 && 's'}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Botoes */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={uploading}
          >
            {doneCount > 0 && queuedCount === 0 ? 'Fechar' : 'Cancelar'}
          </Button>
          {queuedCount > 0 && (
            <Button
              onClick={handleUploadAll}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading
                ? 'Enviando...'
                : `Enviar ${queuedCount} arquivo${queuedCount !== 1 ? 's' : ''}`}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
