'use client';

import { useState, useCallback } from 'react';
import { FolderArchive, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DownloadZipButtonProps {
  protocoloSagi: string;
  documentCount: number;
  disabled?: boolean;
}

type DownloadStatus = 'idle' | 'downloading' | 'done';

export function DownloadZipButton({
  protocoloSagi,
  documentCount,
  disabled = false,
}: DownloadZipButtonProps) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = useCallback(async () => {
    if (status !== 'idle' || documentCount === 0) return;

    setStatus('downloading');
    setProgress(0);

    // Mock: simula download em lote
    // TODO: substituir por chamada real ao endpoint de download ZIP
    const steps = [15, 35, 55, 75, 95, 100];
    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      setProgress(step);
    }

    setStatus('done');

    setTimeout(() => {
      setStatus('idle');
      setProgress(0);
    }, 2000);
  }, [status, documentCount]);

  const isDisabled = disabled || documentCount === 0 || status === 'downloading';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex flex-col items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDisabled}
              className="gap-2"
            >
              {status === 'idle' && (
                <>
                  <FolderArchive className="h-4 w-4" />
                  ZIP ({documentCount})
                </>
              )}
              {status === 'downloading' && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Baixando...
                </>
              )}
              {status === 'done' && (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Pronto!
                </>
              )}
            </Button>
            {status === 'downloading' && (
              <Progress value={progress} className="h-1 w-full" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {documentCount === 0
            ? 'Nenhum documento para baixar'
            : `Baixar ${documentCount} documento${documentCount > 1 ? 's' : ''} em ZIP`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
