'use client';

import { useCallback, useState } from 'react';
import { formatDateTime } from '@/lib/date-utils';
import {
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  StarOff,
  Loader2,
  AlertTriangle,
  Reply,
  Send,
  CornerDownRight,
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
import { useUpdateObservacao, useToggleImportante, useCreateObservacao } from '@/hooks/use-observacoes';
import { usePermissions } from '@/hooks/use-permissions';
import { ObservacaoContent } from './ObservacaoContent';
import type { Observacao } from '@/lib/types';
import { formatSectorName } from '@/lib/types';

const MAX_LENGTH = 2000;

interface ObservacaoCardProps {
  observacao: Observacao;
  replies?: Observacao[];
  source: string;
  protocolId: number;
  onDelete: (obs: Observacao) => void;
  onDocClick?: (docId: string) => void;
  isReply?: boolean;
}

export function ObservacaoCard({
  observacao,
  replies = [],
  source,
  protocolId,
  onDelete,
  onDocClick,
  isReply = false,
}: ObservacaoCardProps) {
  const { user, canDelete, canEdit: canEditPerm } = usePermissions();
  const updateMutation = useUpdateObservacao();
  const toggleMutation = useToggleImportante();
  const createMutation = useCreateObservacao();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(observacao.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);

  const isAuthor = observacao.created_by_email === user?.email;
  const canEditObs = observacao.can_edit || isAuthor || canDelete;
  const canDeleteObs = observacao.can_delete || isAuthor || canDelete;
  const canMarkImportant = canDelete;

  const formattedDate = formatDateTime(observacao.created_at);

  const formattedEditDate = observacao.updated_at
    ? formatDateTime(observacao.updated_at)
    : null;

  const initial = observacao.created_by_name.charAt(0).toUpperCase();

  const handleSave = useCallback(() => {
    if (editText.trim().length === 0 || editText.length > MAX_LENGTH) return;

    updateMutation.mutate(
      { id: observacao.id, content: editText.trim() },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  }, [observacao.id, editText, updateMutation]);

  const handleCancel = useCallback(() => {
    setEditText(observacao.content);
    setIsEditing(false);
  }, [observacao.content]);

  const handleToggleImportante = useCallback(() => {
    toggleMutation.mutate(observacao.id);
  }, [observacao.id, toggleMutation]);

  const handleReplySubmit = useCallback(() => {
    if (replyText.trim().length === 0 || replyText.length > MAX_LENGTH) return;

    createMutation.mutate(
      {
        source,
        id: protocolId,
        content: replyText.trim(),
        is_important: false,
        parent_id: observacao.id,
      },
      {
        onSuccess: () => {
          setReplyText('');
          setIsReplying(false);
          setShowReplies(true);
        },
      }
    );
  }, [source, protocolId, observacao.id, replyText, createMutation]);

  const replyCount = replies.length;

  return (
    <div>
      <div
        className={`rounded-lg border p-4 transition-colors ${
          observacao.is_important
            ? 'border-amber-300/60 bg-amber-50/30 dark:border-amber-700/40 dark:bg-amber-950/10'
            : 'border-border/50'
        }`}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
              observacao.is_important
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {initial}
          </div>

          {/* Conteudo */}
          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {observacao.created_by_name}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {formatSectorName(observacao.created_by_sector)}
              </Badge>
              {observacao.is_important && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-1.5 py-0">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Importante
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formattedDate}
                {formattedEditDate && ` (editado em ${formattedEditDate})`}
              </span>
            </div>

            {/* Texto ou edicao */}
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
              <ObservacaoContent
                content={observacao.content}
                onDocClick={onDocClick}
              />
            )}

            {/* Barra de ações (responder, ver respostas) */}
            {!isEditing && !isReply && (
              <div className="mt-2 flex items-center gap-3">
                {canEditPerm && (
                  <button
                    type="button"
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Responder
                  </button>
                )}
                {replyCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowReplies(!showReplies)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <CornerDownRight className="h-3.5 w-3.5" />
                    {showReplies
                      ? 'Ocultar'
                      : `Ver ${replyCount}`}{' '}
                    {replyCount === 1 ? 'resposta' : 'respostas'}
                  </button>
                )}
              </div>
            )}

            {/* Form de resposta inline */}
            {isReplying && !isReply && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder={`Responder a ${observacao.created_by_name}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs ${
                      replyText.length > MAX_LENGTH
                        ? 'text-destructive font-medium'
                        : replyText.length > 1800
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {replyText.length}/{MAX_LENGTH}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setIsReplying(false);
                        setReplyText('');
                      }}
                      disabled={createMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleReplySubmit}
                      disabled={
                        replyText.trim().length === 0 ||
                        replyText.length > MAX_LENGTH ||
                        createMutation.isPending
                      }
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="mr-1 h-3 w-3" />
                      )}
                      Responder
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menu contextual */}
          {(canEditObs || canDeleteObs || canMarkImportant) && !isEditing && (
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
                {canEditObs && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditText(observacao.content);
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canMarkImportant && !isReply && (
                  <DropdownMenuItem onClick={handleToggleImportante}>
                    {observacao.is_important ? (
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
                {canDeleteObs && (
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

      {/* Replies aninhadas */}
      {!isReply && showReplies && replies.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-border/30 pl-4">
          {replies.map((reply) => (
            <ObservacaoCard
              key={reply.id}
              observacao={reply}
              source={source}
              protocolId={protocolId}
              onDelete={onDelete}
              onDocClick={onDocClick}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
