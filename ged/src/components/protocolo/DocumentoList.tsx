'use client';

import { useCallback, useMemo, useState } from 'react';
import { Search, Upload, X, Download, FileX, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pagination } from '@/components/shared/Pagination';
import { DocumentoCard } from './DocumentoCard';
import { DocumentoViewer } from './DocumentoViewer';
import { DeleteModal } from './DeleteModal';
import { DocumentoUploadModal } from './DocumentoUploadModal';
import { useDocumentos } from '@/hooks/use-documentos';
import { useDocumentTypes } from '@/hooks/use-document-types';
import { usePermissions } from '@/hooks/use-permissions';
import type { Documento } from '@/lib/types';

const PER_PAGE = 10;

interface DocumentoListProps {
  source: string;
  id: number;
}

export function DocumentoList({ source, id }: DocumentoListProps) {
  const { data: documentos, isLoading } = useDocumentos(source, id);
  const { data: documentTypes } = useDocumentTypes();
  const { canUpload, canDelete } = usePermissions();

  // Filtros
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('all');
  const [page, setPage] = useState(1);

  // Seleção
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Viewer e Delete
  const [viewerDoc, setViewerDoc] = useState<Documento | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Documento | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Filtrar documentos
  const filtered = useMemo(() => {
    if (!documentos) return [];

    let result = [...documentos];

    if (busca) {
      const q = busca.toLowerCase();
      result = result.filter((d) =>
        d.nome_arquivo.toLowerCase().includes(q)
      );
    }

    if (tipoFiltro !== 'all') {
      result = result.filter((d) => d.tipo_documento_id === tipoFiltro);
    }

    return result;
  }, [documentos, busca, tipoFiltro]);

  // Paginação
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  // Tipos únicos nos documentos
  const tiposPresentes = useMemo(() => {
    if (!documentos) return [];
    const map = new Map<string, string>();
    documentos.forEach((d) => {
      if (d.tipo_documento_id && d.tipo_documento_nome) {
        map.set(d.tipo_documento_id, d.tipo_documento_nome);
      }
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [documentos]);

  // Handlers
  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedDocs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedDocs.map((d) => d.id)));
    }
  }, [paginatedDocs, selectedIds.size]);

  const handleView = useCallback((doc: Documento) => {
    setViewerDoc(doc);
    setViewerOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((doc: Documento) => {
    setViewerOpen(false);
    setDeleteDoc(doc);
    setDeleteOpen(true);
  }, []);

  const handleDeleteClose = useCallback((open: boolean) => {
    setDeleteOpen(open);
    if (!open) {
      setDeleteDoc(null);
      setSelectedIds(new Set());
    }
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    setSelectedIds(new Set());
  }, []);

  const handleDownloadSelected = useCallback(async () => {
    if (selectedIds.size === 0 || downloading) return;
    setDownloading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = '/api';
      const response = await fetch(
        `${baseUrl}/protocolos/${source}/${id}/documentos/download-selected`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ documento_ids: Array.from(selectedIds) }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error?.message || `Erro ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `selecionados_${source}_${id}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) fileName = match[1];
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSelectedIds(new Set());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao baixar documentos';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  }, [selectedIds, downloading, source, id]);

  const handleClearFilters = useCallback(() => {
    setBusca('');
    setTipoFiltro('all');
    setPage(1);
  }, []);

  const hasFilters = busca !== '' || tipoFiltro !== 'all';

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-40" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do arquivo..."
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-10"
          />
          {busca && (
            <button
              onClick={() => {
                setBusca('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={tipoFiltro} onValueChange={(v) => { setTipoFiltro(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {tiposPresentes.map((tipo) => (
              <SelectItem key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={handleClearFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Limpar
          </Button>
        )}

        {canUpload && (
          <Button size="sm" className="h-9" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Anexar
          </Button>
        )}
      </div>

      {/* Barra de seleção e ações em lote */}
      {paginatedDocs.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 px-3 py-2">
          <Checkbox
            checked={
              paginatedDocs.length > 0 &&
              selectedIds.size === paginatedDocs.length
            }
            onCheckedChange={handleSelectAll}
          />
          <span className="text-xs text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selecionado${selectedIds.size > 1 ? 's' : ''}`
              : `${filtered.length} documento${filtered.length !== 1 ? 's' : ''}`}
          </span>

          {selectedIds.size > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDownloadSelected}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Download className="mr-1 h-3 w-3" />
                )}
                {downloading ? 'Baixando...' : 'Baixar selecionados'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lista de documentos */}
      {paginatedDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/50 bg-card/50 py-12">
          <FileX className="h-10 w-10 text-muted-foreground/40" />
          <div className="text-center">
            <p className="text-sm font-medium">
              {hasFilters ? 'Nenhum documento encontrado' : 'Nenhum documento anexado'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasFilters
                ? 'Tente ajustar os filtros de busca.'
                : 'Anexe documentos a este protocolo para começar.'}
            </p>
          </div>
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedDocs.map((doc) => (
            <DocumentoCard
              key={doc.id}
              documento={doc}
              selected={selectedIds.has(doc.id)}
              onSelect={handleSelect}
              onView={handleView}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      {/* Paginação */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        perPage={PER_PAGE}
        onPageChange={handlePageChange}
      />

      {/* Viewer lateral */}
      <DocumentoViewer
        documento={viewerDoc}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onDelete={handleDeleteRequest}
      />

      {/* Modal de exclusão */}
      <DeleteModal
        open={deleteOpen}
        onOpenChange={handleDeleteClose}
        documento={deleteDoc}
      />

      {/* Modal de upload */}
      <DocumentoUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        source={source}
        id={id}
      />
    </div>
  );
}
