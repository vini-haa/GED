'use client';

import { useCallback, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUpdateObservacao, useToggleImportante } from '@/hooks/use-observacoes';
import { usePermissions } from '@/hooks/use-permissions';
import type { Observacao } from '@/lib/types';

const MAX_LENGTH = 2000;

interface ObservacaoCardProps {
  observacao: Observacao;
  onDelete: (obs: Observacao) => void;
}

export function ObservacaoCard({ observacao, onDelete }: ObservacaoCardProps) {
  const { user, canDelete } = usePermissions();
  const updateMutation = useUpdateObservacao();
  const toggleMutation = useToggleImportante();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(observacao.texto);

  const isAuthor = observacao.autorEmail === user.email;
  const canEdit = isAuthor || canDelete;
  const canMarkImportant = canDelete;

  const timeAgo = formatDistanceToNow(new Date(observacao.criadoEm), {
    addSuffix: true,
    locale: ptBR,
  });

  const initial = observacao.autorNome.charAt(0).toUpperCase();

  const handleSave = useCallback(() => {
    if (editText.trim().length === 0 || editText.length > MAX_LENGTH) return;

    updateMutation.mutate(
      { id: observacao.id, texto: editText.trim() },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  }, [observacao.id, editText, updateMutation]);

  const handleCancel = useCallback(() => {
    setEditText(observacao.texto);
    setIsEditing(false);
  }, [observacao.texto]);

  const handleToggleImportante = useCallback(() => {
    toggleMutation.mutate(observacao.id);
  }, [observacao.id, toggleMutation]);

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        observacao.importante
          ? 'border-amber-300/60 bg-amber-50/30 dark:border-amber-700/40 dark:bg-amber-950/10'
          : 'border-border/50'
      }`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
            observacao.importante
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {initial}
        </div>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">
              {observacao.autorNome}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {observacao.autorSetor}
            </Badge>
            {observacao.importante && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-1.5 py-0">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Importante
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgo}
              {observacao.editadoEm && ' (editado)'}
            </span>
          </div>

          {/* Texto ou edição */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs ${
                    editText.length > MAX_LENGTH
                      ? 'text-destructive font-medium'
                      : editText.length > 1800
                        ? 'text-amber-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  {editText.length}/{MAX_LENGTH}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCancel}
                    disabled={updateMutation.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleSave}
                    disabled={
                      editText.trim().length === 0 ||
                      editText.length > MAX_LENGTH ||
                      updateMutation.isPending
                    }
                  >
                    {updateMutation.isPending && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm whitespace-pre-wrap">
              {observacao.texto}
            </p>
          )}
        </div>

        {/* Menu contextual */}
        {(canEdit || canMarkImportant) && !isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => {
                    setEditText(observacao.texto);
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {canMarkImportant && (
                <DropdownMenuItem onClick={handleToggleImportante}>
                  {observacao.importante ? (
                    <>
                      <StarOff className="mr-2 h-4 w-4" />
                      Desmarcar importante
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      Marcar importante
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(observacao)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
