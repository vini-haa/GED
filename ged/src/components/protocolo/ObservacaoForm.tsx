'use client';

import { useCallback, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useCreateObservacao } from '@/hooks/use-observacoes';

const MAX_LENGTH = 2000;

interface ObservacaoFormProps {
  protocoloSagi: string;
}

export function ObservacaoForm({ protocoloSagi }: ObservacaoFormProps) {
  const [texto, setTexto] = useState('');
  const [importante, setImportante] = useState(false);
  const createMutation = useCreateObservacao();

  const charCount = texto.length;
  const isOverLimit = charCount > MAX_LENGTH;
  const isEmpty = texto.trim().length === 0;

  const handleSubmit = useCallback(() => {
    if (isEmpty || isOverLimit) return;

    createMutation.mutate(
      { protocoloSagi, texto: texto.trim(), importante },
      {
        onSuccess: () => {
          setTexto('');
          setImportante(false);
        },
      }
    );
  }, [protocoloSagi, texto, importante, isEmpty, isOverLimit, createMutation]);

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
      <Textarea
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
