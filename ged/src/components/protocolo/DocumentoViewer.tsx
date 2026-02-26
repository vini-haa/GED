'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Archive,
  FileQuestion,
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

interface DocumentoViewerProps {
  documento: Documento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (documento: Documento) => void;
}

function PreviewContent({ documento }: { documento: Documento }) {
  if (documento.mimeType === 'application/pdf') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">Preview de PDF</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Preview indisponível sem integração com Google Drive.
          </p>
        </div>
      </div>
    );
  }

  if (documento.mimeType?.startsWith('image/')) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-8 text-center">
        <Image className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">Preview de Imagem</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Preview indisponível sem integração com Google Drive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-8 text-center">
      <FileQuestion className="h-12 w-12 text-muted-foreground/50" />
      <div>
        <p className="text-sm font-medium">Preview não disponível</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Este formato de arquivo não suporta preview.
        </p>
      </div>
    </div>
  );
}

export function DocumentoViewer({
  documento,
  open,
  onOpenChange,
  onDelete,
}: DocumentoViewerProps) {
  const { canDelete } = usePermissions();

  if (!documento) return null;

  const Icon = getMimeIcon(documento.mimeType);
  const dataUpload = format(
    new Date(documento.uploadedAt),
    "dd/MM/yyyy 'às' HH:mm",
    { locale: ptBR }
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <SheetTitle className="text-left text-sm leading-tight">
              {documento.nomeArquivo}
            </SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="mt-6 h-[calc(100vh-10rem)]">
          <div className="space-y-6 pr-4">
            <PreviewContent documento={documento} />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Metadados</h3>
              <div className="rounded-lg border border-border/50 divide-y divide-border/30">
                {documento.tipoDocumentoNome && (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-xs text-muted-foreground">Tipo</span>
                    <Badge variant="outline" className="text-xs">
                      {documento.tipoDocumentoNome}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Tamanho</span>
                  <span className="text-sm">{formatFileSize(documento.tamanhoBytes)}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Formato</span>
                  <span className="text-sm">{documento.mimeType ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Upload em</span>
                  <span className="text-sm">{dataUpload}</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">Enviado por</span>
                  <span className="text-sm">{documento.uploadedBy}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
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
