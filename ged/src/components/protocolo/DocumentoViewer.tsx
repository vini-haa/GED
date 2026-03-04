'use client';

import { useState } from 'react';
import { formatDateTime } from '@/lib/date-utils';
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Archive,
  FileQuestion,
  Loader2,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/use-permissions';
import { useDownloadDocumento } from '@/hooks/use-documentos';
import { toast } from '@/hooks/use-toast';
import type { Documento } from '@/lib/types';

function getMimeIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
    return FileSpreadsheet;
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getPreviewUrl(documentoId: string): string {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return `/api/documentos/${documentoId}/preview?token=${encodeURIComponent(token || '')}`;
}

function PreviewContent({ documento }: { documento: Documento }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  if (documento.mime_type === 'application/pdf') {
    const previewUrl = getPreviewUrl(documento.id);
    return (
      <div className="overflow-hidden rounded-lg border border-border/50">
        <iframe
          src={previewUrl}
          className="h-[400px] w-full"
          title={`Preview de ${documento.nome_arquivo}`}
        />
      </div>
    );
  }

  if (documento.mime_type?.startsWith('image/') && !imgError) {
    const previewUrl = getPreviewUrl(documento.id);
    return (
      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-muted/20">
        {imgLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <img
          src={previewUrl}
          alt={documento.nome_arquivo}
          className={`w-full object-contain ${imgLoading ? 'hidden' : ''}`}
          style={{ maxHeight: '400px' }}
          onLoad={() => setImgLoading(false)}
          onError={() => {
            setImgLoading(false);
            setImgError(true);
          }}
        />
      </div>
    );
  }

  const Icon = documento.mime_type?.startsWith('image/') ? Image : FileQuestion;
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <div>
        <p className="text-sm font-medium">Preview não disponível</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {imgError
            ? 'Não foi possível carregar a imagem.'
            : 'Este formato de arquivo não suporta preview.'}
        </p>
      </div>
    </div>
  );
}

interface DocumentoViewerProps {
  documento: Documento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (documento: Documento) => void;
}

export function DocumentoViewer({
  documento,
  open,
  onOpenChange,
  onDelete,
}: DocumentoViewerProps) {
  const { canDelete } = usePermissions();
  const downloadMutation = useDownloadDocumento();

  if (!documento) return null;

  const Icon = getMimeIcon(documento.mime_type);
  const dataUpload = formatDateTime(documento.uploaded_at);

  function handleDownload() {
    if (!documento) return;
    downloadMutation.mutate(documento.id, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = documento.nome_arquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      onError: () => {
        toast({
          title: 'Erro ao baixar',
          description: 'Não foi possível baixar o documento.',
          variant: 'destructive',
        });
      },
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <SheetTitle className="text-left text-sm leading-tight">
              {documento.nome_arquivo}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-10rem)]">
          <div className="space-y-6 pr-4">
            <PreviewContent documento={documento} />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Metadados</h3>
              <div className="rounded-lg border border-border/50 divide-y divide-border/30">
                {documento.tipo_documento_nome && (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Tipo</span>
                    <Badge variant="outline" className="text-xs">
                      {documento.tipo_documento_nome}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Tamanho</span>
                  <span className="text-sm">{formatFileSize(documento.tamanho_bytes)}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Formato</span>
                  <span className="text-sm">{documento.mime_type ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Upload em</span>
                  <span className="text-sm">{dataUpload}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Enviado por</span>
                  <span className="text-sm">{documento.uploaded_by_name}</span>
                </div>
              </div>
            </div>

            {documento.drive_file_url && (
              <a
                href={documento.drive_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir no Google Drive
              </a>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
              >
                {downloadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Baixar
              </Button>
              {canDelete && onDelete && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => onDelete(documento)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
