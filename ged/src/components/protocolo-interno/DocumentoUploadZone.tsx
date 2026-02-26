'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDocumentTypes } from '@/hooks/use-document-types';
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

function getStatusColor(status: UploadFileStatus): string {
  switch (status) {
    case 'done':
      return 'text-emerald-600';
    case 'error':
      return 'text-destructive';
    case 'uploading':
      return 'text-primary';
    default:
      return 'text-muted-foreground';
  }
}

interface DocumentoUploadZoneProps {
  files: UploadFileItem[];
  onFilesChange: (files: UploadFileItem[]) => void;
  disabled?: boolean;
}

export function DocumentoUploadZone({
  files,
  onFilesChange,
  disabled = false,
}: DocumentoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { data: documentTypes } = useDocumentTypes();

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
            error: `Arquivo muito grande (máx. ${formatFileSize(MAX_FILE_SIZE)})`,
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
            error: 'Tipo de arquivo não suportado',
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

      onFilesChange([...files, ...validFiles]);
    },
    [files, onFilesChange]
  );

  const removeFile = useCallback(
    (id: string) => {
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  const updateFileType = useCallback(
    (id: string, tipoDocumentoId: string | null) => {
      onFilesChange(
        files.map((f) => (f.id === id ? { ...f, tipoDocumentoId } : f))
      );
    },
    [files, onFilesChange]
  );

  const applyTypeToAll = useCallback(
    (tipoDocumentoId: string) => {
      onFilesChange(
        files.map((f) =>
          f.status !== 'done' && f.status !== 'error'
            ? { ...f, tipoDocumentoId }
            : f
        )
      );
    },
    [files, onFilesChange]
  );

  // Drag handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

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
      if (!disabled && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [disabled, addFiles]
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

  // Simular upload mock
  useEffect(() => {
    const queuedFile = files.find((f) => f.status === 'queued');
    if (!queuedFile) return;

    // Iniciar upload do primeiro na fila
    onFilesChange(
      files.map((f) =>
        f.id === queuedFile.id ? { ...f, status: 'uploading' as UploadFileStatus, progress: 0 } : f
      )
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onFilesChange(
          files.map((f) =>
            f.id === queuedFile.id
              ? { ...f, status: 'done' as UploadFileStatus, progress: 100 }
              : f
          )
        );
      } else {
        onFilesChange(
          files.map((f) =>
            f.id === queuedFile.id ? { ...f, progress: Math.min(progress, 95) } : f
          )
        );
      }
    }, 300);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.filter((f) => f.status === 'queued').length]);

  const queuedOrUploading = files.filter(
    (f) => f.status === 'queued' || f.status === 'uploading'
  );
  const firstSelectedType = files.find(
    (f) => f.tipoDocumentoId && f.status !== 'done' && f.status !== 'error'
  )?.tipoDocumentoId;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
          disabled
            ? 'cursor-not-allowed border-border/30 bg-muted/20 opacity-60'
            : isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-border/50 bg-card/30 hover:border-primary/50 hover:bg-primary/5'
        }`}
      >
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isDragOver ? 'bg-primary/10' : 'bg-muted'
          }`}
        >
          <Upload
            className={`h-6 w-6 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragOver
              ? 'Solte os arquivos aqui'
              : 'Arraste e solte arquivos aqui'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            ou clique para selecionar — PDF, imagens, documentos (máx. 25MB)
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Lista de arquivos */}
      {files.length > 0 && (
        <div className="space-y-3">
          {/* Ação "aplicar tipo para todos" */}
          {files.filter((f) => f.status !== 'done' && f.status !== 'error').length > 1 &&
            firstSelectedType && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Aplicar &quot;
                  {activeTypes.find((t) => t.id === firstSelectedType)?.name}
                  &quot; para todos os arquivos?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => applyTypeToAll(firstSelectedType)}
                >
                  Aplicar para todos
                </Button>
              </div>
            )}

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
                  {/* Ícone do arquivo */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Info do arquivo */}
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

                    {/* Barra de progresso */}
                    {(item.status === 'uploading' ||
                      item.status === 'queued') && (
                      <div className="mt-2">
                        <Progress value={item.progress} className="h-1.5" />
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {item.status === 'queued'
                            ? 'Aguardando...'
                            : `${Math.round(item.progress)}%`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Seletor de tipo */}
                  {item.status !== 'error' && (
                    <div className="shrink-0">
                      <Select
                        value={item.tipoDocumentoId ?? 'none'}
                        onValueChange={(v) =>
                          updateFileType(item.id, v === 'none' ? null : v)
                        }
                        disabled={item.status === 'done'}
                      >
                        <SelectTrigger className="h-8 w-36 text-xs">
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
                    </div>
                  )}

                  {/* Botão remover */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFile(item.id)}
                    disabled={item.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Resumo */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {files.length} arquivo{files.length !== 1 && 's'}
            </span>
            {files.filter((f) => f.status === 'done').length > 0 && (
              <Badge
                variant="outline"
                className="bg-emerald-50/50 text-emerald-700 text-[10px] dark:bg-emerald-950/20 dark:text-emerald-400"
              >
                {files.filter((f) => f.status === 'done').length} enviado
                {files.filter((f) => f.status === 'done').length !== 1 && 's'}
              </Badge>
            )}
            {files.filter((f) => f.status === 'error').length > 0 && (
              <Badge
                variant="outline"
                className="bg-destructive/5 text-destructive text-[10px]"
              >
                {files.filter((f) => f.status === 'error').length} erro
                {files.filter((f) => f.status === 'error').length !== 1 && 's'}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
