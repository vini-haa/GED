import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface SagiUnavailableProps {
  onRetry?: () => void;
  message?: string;
}

export function SagiUnavailable({ onRetry, message }: SagiUnavailableProps) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Card className="w-full max-w-lg text-center border-warning/30">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-8 w-8 text-warning" />
          </div>
          <CardTitle className="text-xl">
            Sistema SAGI Temporariamente Indisponível
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {message ||
              'Não foi possível conectar ao sistema SAGI. Os protocolos do SAGI estão temporariamente indisponíveis. Protocolos internos e demais funcionalidades continuam funcionando normalmente.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Tente novamente em alguns minutos. Se o problema persistir, entre em
            contato com a equipe de TI.
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
