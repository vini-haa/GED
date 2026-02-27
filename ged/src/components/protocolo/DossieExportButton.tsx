'use client';

import { useState, useCallback } from 'react';
import { FileDown, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DossieExportButtonProps {
  protocoloSagi: string;
  disabled?: boolean;
}

type ExportStatus = 'idle' | 'generating' | 'done';

export function DossieExportButton({
  protocoloSagi,
  disabled = false,
}: DossieExportButtonProps) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);

  const handleExport = useCallback(async () => {
    if (status !== 'idle') return;

    setStatus('generating');
    setProgress(0);

    // Mock: simula progresso de geração do dossiê
    // TODO: substituir por chamada real ao endpoint de geração
    const steps = [10, 25, 45, 60, 75, 90, 100];
    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setProgress(step);
    }

    setStatus('done');

    // Volta ao estado idle após 2s
    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
    }, 2000);
  }, [status]);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex flex-col items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={disabled || status === 'generating'}
              className="gap-2"
            >
              {status === 'idle' && (
                <>
                  <FileDown className="h-4 w-4" />
                  Dossiê PDF
                </>
              )}
              {status === 'generating' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              )}
              {status === 'done' && (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Pronto!
                </>
              )}
            </Button>
            {status === 'generating' && (
              <Progress value={progress} className="h-1 w-full" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Exportar dossiê completo do protocolo {protocoloSagi} em PDF
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
