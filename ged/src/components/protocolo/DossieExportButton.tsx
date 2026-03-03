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
import { toast } from '@/hooks/use-toast';

interface DossieExportButtonProps {
  source: string;
  id: string | number;
  protocoloSagi: string;
  disabled?: boolean;
}

type ExportStatus = 'idle' | 'generating' | 'done';

export function DossieExportButton({
  source,
  id,
  protocoloSagi,
  disabled = false,
}: DossieExportButtonProps) {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [progress, setProgress] = useState(0);

  const handleExport = useCallback(async () => {
    if (status !== 'idle') return;

    setStatus('generating');
    setProgress(15);

    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = '/api';

      setProgress(30);

      const response = await fetch(
        `${baseUrl}/protocolos/${source}/${id}/dossie/export`,
        {
          method: 'POST',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
      );

      setProgress(60);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error?.message || `Erro ${response.status}`);
      }

      const blob = await response.blob();
      setProgress(85);

      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `dossie_${protocoloSagi.replace(/\./g, '_')}.zip`;
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
      const message = err instanceof Error ? err.message : 'Erro ao gerar dossiê';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
      setStatus('idle');
      setProgress(0);
    }
  }, [status, source, id, protocoloSagi]);

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
