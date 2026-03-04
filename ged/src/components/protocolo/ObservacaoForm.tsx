'use client';

import { useCallback, useRef, useState } from 'react';
import { FileText, Loader2, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCreateObservacao } from '@/hooks/use-observacoes';
import { useDocumentos } from '@/hooks/use-documentos';
import { buildMentionToken } from '@/lib/doc-mentions';
import type { Documento } from '@/lib/types';

const MAX_LENGTH = 2000;

interface ObservacaoFormProps {
  source: string;
  id: number;
}

export function ObservacaoForm({ source, id }: ObservacaoFormProps) {
  const [texto, setTexto] = useState('');
  const [importante, setImportante] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createMutation = useCreateObservacao();
  const { data: documentos = [] } = useDocumentos(source, id);

  const charCount = texto.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isEmpty = texto.trim().length === 0;

  const insertMention = useCallback(
    (doc: Documento) => {
      const token = buildMentionToken(doc.id, doc.nome_arquivo);
      const el = textareaRef.current;

      if (el) {
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const before = texto.slice(0, start);
        const after = texto.slice(end);
        const needsSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n');
        const newText = before + (needsSpace ? ' ' : '') + token + ' ' + after;
        setTexto(newText);

        requestAnimationFrame(() => {
          const cursor = (before + (needsSpace ? ' ' : '') + token + ' ').length;
          el.focus();
          el.setSelectionRange(cursor, cursor);
        });
      } else {
        setTexto((prev) => (prev ? prev + ' ' + token + ' ' : token + ' '));
      }

      setMentionOpen(false);
    },
    [texto]
  );

  const handleSubmit = useCallback(() => {
    if (isEmpty || isOverLimit) return;

    createMutation.mutate(
      { source, id, content: texto.trim(), is_important: importante },
      {
        onSuccess: () => {
          setTexto('');
          setImportante(false);
        },
      }
    );
  }, [source, id, texto, importante, isEmpty, isOverLimit, createMutation]);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
      <Textarea
        ref={textareaRef}
        placeholder="Adicionar observação sobre este protocolo..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        className="resize-none"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="importante"
              checked={importante}
              onCheckedChange={(checked) =>
                setImportante(checked === true)
              }
            />
            <Label
              htmlFor="importante"
              className="text-xs text-muted-foreground cursor-pointer"
            >
              Marcar como importante
            </Label>
          </div>

          {documentos.length > 0 && (
            <Popover open={mentionOpen} onOpenChange={setMentionOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Mencionar documento
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 p-0"
              >
                <div className="border-b border-border/50 px-3 py-2">
                  <p className="text-xs font-medium">Documentos anexados</p>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione para inserir referência na observação
                  </p>
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {documentos.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => insertMention(doc)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60 transition-colors"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {doc.nome_arquivo}
                        </p>
                        {doc.tipo_documento_nome && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {doc.tipo_documento_nome}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          <span
            className={`text-xs ${
              isOverLimit
                ? 'text-destructive font-medium'
                : charCount > 1800
                  ? 'text-amber-600'
                  : 'text-muted-foreground'
            }`}
          >
            {charCount}/{MAX_LENGTH}
          </span>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Postar
        </Button>
      </div>
    </div>
  );
}
