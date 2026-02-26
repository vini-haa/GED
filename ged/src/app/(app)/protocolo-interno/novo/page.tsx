'use client';

import { ArrowLeft, FilePlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CriarProtocoloForm } from '@/components/protocolo-interno/CriarProtocoloForm';

export default function NovoProtocoloInternoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <FilePlus className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">
            Novo Protocolo Interno
          </h1>
        </div>
      </div>

      {/* Formulário */}
      <div className="mx-auto max-w-2xl rounded-xl border border-border/50 bg-card/50 p-6 shadow-sm">
        <CriarProtocoloForm />
      </div>
    </div>
  );
}
