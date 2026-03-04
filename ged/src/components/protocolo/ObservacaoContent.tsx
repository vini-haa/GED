'use client';

import { useMemo } from 'react';
import { FileText } from 'lucide-react';
import { parseContent } from '@/lib/doc-mentions';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ObservacaoContentProps {
  content: string;
  onDocClick?: (docId: string) => void;
}

export function ObservacaoContent({ content, onDocClick }: ObservacaoContentProps) {
  const parts = useMemo(() => parseContent(content), [content]);

  const hasMentions = parts.some((p) => p.type === 'mention');

  if (!hasMentions) {
    return <p className="mt-1 text-sm whitespace-pre-wrap">{content}</p>;
  }

  return (
    <p className="mt-1 text-sm whitespace-pre-wrap">
      <TooltipProvider delayDuration={300}>
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return <span key={i}>{part.value}</span>;
          }

          const mention = part.mention!;
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onDocClick?.(mention.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors align-baseline"
                >
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="max-w-[200px] truncate">{mention.fileName}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Documento: {mention.fileName}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </p>
  );
}
