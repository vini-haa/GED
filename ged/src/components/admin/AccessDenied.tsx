'use client';

import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Acesso Restrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
            Entre em contato com o administrador do sistema.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
