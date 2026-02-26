'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockProtocols } from '@/lib/mock-protocols';
import Link from 'next/link';
import type { Protocol, ProtocolStatus } from '@/lib/types';

function getStatusVariant(
  status: ProtocolStatus
): 'success' | 'warning' | 'default' | 'destructive' {
  switch (status) {
    case 'Concluído':
      return 'success';
    case 'Pendente':
      return 'warning';
    case 'Cancelado':
      return 'destructive';
    default:
      return 'default';
  }
}

function formatNumber(numero: number, ano: number): string {
  return `${String(numero).padStart(5, '0')}/${ano}`;
}

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Protocol[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setTotalResults(0);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = mockProtocols.filter(
        (p) =>
          `${p.numeroProtocolo}/${p.anoProtocolo}`.includes(q) ||
          (p.assunto && p.assunto.toLowerCase().includes(q)) ||
          (p.projetoDescricao &&
            p.projetoDescricao.toLowerCase().includes(q)) ||
          (p.setorOrigem && p.setorOrigem.toLowerCase().includes(q)) ||
          (p.setorDestino && p.setorDestino.toLowerCase().includes(q))
      );

      setTotalResults(filtered.length);
      setResults(filtered.slice(0, 5));
      setIsOpen(filtered.length > 0);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleResultClick = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative ml-auto flex-1 sm:flex-initial"
    >
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Buscar por número, assunto ou setor..."
          className="pl-8 pr-8 sm:w-[300px] md:w-[200px] lg:w-[400px]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md sm:w-[400px]">
          <div className="py-1">
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {totalResults} resultado{totalResults !== 1 ? 's' : ''}{' '}
              encontrado{totalResults !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {results.map((protocol) => (
              <Link
                key={protocol.id}
                href={`/protocolo/${protocol.numeroProtocolo}/${protocol.anoProtocolo}`}
                className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                onClick={handleResultClick}
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {formatNumber(
                        protocol.numeroProtocolo,
                        protocol.anoProtocolo
                      )}
                    </p>
                    <Badge
                      variant={getStatusVariant(protocol.situacao)}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {protocol.situacao}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {protocol.assunto ?? 'Sem assunto'} —{' '}
                    {protocol.setorDestino ?? '—'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          {totalResults > 5 && (
            <div className="border-t">
              <Link
                href={`/?busca=${encodeURIComponent(query)}`}
                className="block px-3 py-2.5 text-center text-sm text-primary hover:bg-accent transition-colors"
                onClick={handleResultClick}
              >
                Ver todos os {totalResults} resultados
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
