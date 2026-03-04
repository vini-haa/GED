'use client';

import { formatDateTime } from '@/lib/date-utils';
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Archive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/use-permissions';
import type { Documento } from '@/lib/types';

function getMimeIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.startsWith('image/')) return Image;
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel')
  )
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

interface DocumentoCardProps {
  documento: Documento;
  selected: boolean;
  onSelect: (id: string) => void;
  onView: (documento: Documento) => void;
  onDelete: (documento: Documento) => void;
}

export function DocumentoCard({
  documento,
  selected,
  onSelect,
  onView,
  onDelete,
}: DocumentoCardProps) {
  const { canDelete } = usePermissions();
  const Icon = getMimeIcon(documento.mime_type);

  const uploadDate = formatDateTime(documento.uploaded_at);

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30 ${
        selected
          ? 'border-primary/50 bg-primary/5'
          : 'border-border/50'
      }`}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={() => onSelect(documento.id)}
        className="shrink-0"
      />

      <div
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
        onClick={() => onView(documento)}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">
              {documento.nome_arquivo}
            </p>
            {documento.tipo_documento_nome && (
              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                {documento.tipo_documento_nome}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(documento.tamanho_bytes)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">{documento.uploaded_by_name}</span>
            <span>·</span>
            <span>{uploadDate}</span>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onView(documento)}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Download className="mr-2 h-4 w-4" />
            Baixar
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(documento)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
