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
import { toast } from '@/hooks/use-toast';

interface DownloadZipButtonProps {
  source: string;
  id: string | number;
  documentCount: number;
  disabled?: boolean;
}

type DownloadStatus = 'idle' | 'downloading' | 'done';

export function DownloadZipButton({
  source,
  id,
  documentCount,
  disabled = false,
}: DownloadZipButtonProps) {
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [progress, setProgress] = useState(0);

  const handleDownload = useCallback(async () => {
    if (status !== 'idle' || documentCount === 0) return;

    setStatus('downloading');
    setProgress(20);

    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = '/api';

      setProgress(40);

      const response = await fetch(
        `${baseUrl}/protocolos/${source}/${id}/documentos/download-zip`,
        {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      setProgress(70);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error?.message || `Erro ${response.status}`);
      }

      const blob = await response.blob();
      setProgress(90);

      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `documentos_${source}_${id}.zip`;
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

      setProgress(100);
      setStatus('done');

      setTimeout(() => {
        setStatus('idle');
        setProgress(0);
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao baixar documentos';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      setStatus('idle');
      setProgress(0);
    }
  }, [status, documentCount, source, id]);

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
