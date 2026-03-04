'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  X,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDocumentTypes } from '@/hooks/use-document-types';
import type { UploadFileItem } from '@/lib/types';

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

  const validFiles = files.filter((f) => f.status !== 'error');

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
            ou clique para selecionar — PDF, imagens, documentos (max. 25MB)
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

      {/* Lista de arquivos selecionados */}
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
                    : 'border-border/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {item.file.name}
                      </p>
                      {item.status === 'error' && (
                        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(item.file.size)}</span>
                      {item.error && (
                        <span className="text-destructive">{item.error}</span>
                      )}
                    </div>
                  </div>

                  {item.status !== 'error' && (
                    <Select
                      value={item.tipoDocumentoId ?? ''}
                      onValueChange={(v) =>
                        updateFileType(item.id, v || null)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className={`h-8 w-36 text-xs shrink-0 ${!item.tipoDocumentoId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTypes.map((dt) => (
                          <SelectItem key={dt.id} value={dt.id}>
                            {dt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeFile(item.id)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Resumo */}
          <p className="text-xs text-muted-foreground">
            {validFiles.length > 0
              ? `${validFiles.length} arquivo${validFiles.length !== 1 ? 's' : ''} selecionado${validFiles.length !== 1 ? 's' : ''} — serao enviados ao criar o protocolo`
              : 'Nenhum arquivo valido selecionado'}
          </p>
        </div>
      )}
    </div>
  );
}
