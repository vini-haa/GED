'use client';

import { useCallback, useState } from 'react';
import {
  Circle,
  Play,
  CheckCircle2,
  XCircle,
  Archive,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateStatusProtocoloInterno } from '@/hooks/use-protocolos-internos';
import type { StatusProtocoloInterno } from '@/lib/types';

interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  dotClass: string;
}

const STATUS_MAP: Record<StatusProtocoloInterno, StatusConfig> = {
  aberto: {
    label: 'Aberto',
    icon: Circle,
    badgeClass:
      'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    dotClass: 'bg-blue-500',
  },
  em_analise: {
    label: 'Em Analise',
    icon: Play,
    badgeClass:
      'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    dotClass: 'bg-amber-500',
  },
  finalizado: {
    label: 'Finalizado',
    icon: CheckCircle2,
    badgeClass:
      'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
    dotClass: 'bg-emerald-500',
  },
  arquivado: {
    label: 'Arquivado',
    icon: Archive,
    badgeClass:
      'bg-slate-100 text-slate-700 hover:bg-slate-100 dark:bg-slate-900/30 dark:text-slate-400',
    dotClass: 'bg-slate-500',
  },
  cancelado: {
    label: 'Cancelado',
    icon: XCircle,
    badgeClass:
      'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    dotClass: 'bg-red-500',
  },
};

// Regras de transicao: status atual -> status permitidos
const TRANSITION_RULES: Record<StatusProtocoloInterno, StatusProtocoloInterno[]> = {
  aberto: ['em_analise', 'cancelado'],
  em_analise: ['finalizado', 'arquivado', 'cancelado'],
  finalizado: [],
  arquivado: [],
  cancelado: [],
};

interface StatusDropdownProps {
  protocoloId: number;
  currentStatus: StatusProtocoloInterno;
  disabled?: boolean;
}

export function StatusDropdown({
  protocoloId,
  currentStatus,
  disabled = false,
}: StatusDropdownProps) {
  const updateMutation = useUpdateStatusProtocoloInterno();
  const [confirmStatus, setConfirmStatus] =
    useState<StatusProtocoloInterno | null>(null);

  const config = STATUS_MAP[currentStatus];
  const allowedTransitions = TRANSITION_RULES[currentStatus];
  const Icon = config.icon;
  const isTerminal = allowedTransitions.length === 0;

  const handleSelect = useCallback((newStatus: StatusProtocoloInterno) => {
    // Status terminais requerem confirmacao
    if (newStatus === 'finalizado' || newStatus === 'cancelado' || newStatus === 'arquivado') {
      setConfirmStatus(newStatus);
    } else {
      updateMutation.mutate({ id: protocoloId, data: { status: newStatus } });
    }
  }, [protocoloId, updateMutation]);

  const handleConfirm = useCallback(() => {
    if (!confirmStatus) return;
    updateMutation.mutate(
      { id: protocoloId, data: { status: confirmStatus } },
      { onSuccess: () => setConfirmStatus(null) }
    );
  }, [protocoloId, confirmStatus, updateMutation]);

  // Se nao ha transicoes possiveis, exibir apenas badge estatico
  if (isTerminal || disabled) {
    return (
      <Badge className={`gap-1.5 ${config.badgeClass}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`h-auto gap-1.5 px-2.5 py-1 text-xs font-medium ${config.badgeClass}`}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Icon className="h-3 w-3" />
            )}
            {config.label}
            <ChevronDown className="ml-0.5 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {/* Status atual */}
          <div className="px-2 py-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Alterar status
            </p>
          </div>
          <DropdownMenuSeparator />
          {allowedTransitions.map((status) => {
            const targetConfig = STATUS_MAP[status];
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleSelect(status)}
                className="gap-2"
              >
                <div
                  className={`h-2 w-2 rounded-full ${targetConfig.dotClass}`}
                />
                {targetConfig.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmacao para status terminais */}
      <Dialog
        open={!!confirmStatus}
        onOpenChange={(open) => !open && setConfirmStatus(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {confirmStatus === 'finalizado'
                ? 'Finalizar Protocolo'
                : confirmStatus === 'arquivado'
                  ? 'Arquivar Protocolo'
                  : 'Cancelar Protocolo'}
            </DialogTitle>
            <DialogDescription>
              {confirmStatus === 'finalizado'
                ? 'Ao finalizar, o protocolo nao podera mais ser tramitado ou ter seu status alterado.'
                : confirmStatus === 'arquivado'
                  ? 'Ao arquivar, o protocolo sera marcado como arquivado permanentemente.'
                  : 'Ao cancelar, o protocolo sera marcado como cancelado permanentemente.'}
            </DialogDescription>
          </DialogHeader>

          {confirmStatus && (
            <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Badge className={`gap-1 ${config.badgeClass}`}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="text-muted-foreground">&rarr;</span>
                <Badge
                  className={`gap-1 ${STATUS_MAP[confirmStatus].badgeClass}`}
                >
                  {(() => {
                    const ConfirmIcon = STATUS_MAP[confirmStatus].icon;
                    return <ConfirmIcon className="h-3 w-3" />;
                  })()}
                  {STATUS_MAP[confirmStatus].label}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmStatus(null)}
              disabled={updateMutation.isPending}
            >
              Voltar
            </Button>
            <Button
              variant={
                confirmStatus === 'cancelado' ? 'destructive' : 'default'
              }
              onClick={handleConfirm}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {confirmStatus === 'finalizado'
                ? 'Finalizar'
                : confirmStatus === 'arquivado'
                  ? 'Arquivar'
                  : 'Cancelar Protocolo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Badge estatico de status (para uso em listagens, sem interacao) */
export function StatusBadge({
  status,
}: {
  status: StatusProtocoloInterno;
}) {
  const config = STATUS_MAP[status];
  const Icon = config?.icon ?? Circle;

  return (
    <Badge className={`gap-1 ${config?.badgeClass ?? ''}`}>
      <Icon className="h-3 w-3" />
      {config?.label ?? status}
    </Badge>
  );
}
