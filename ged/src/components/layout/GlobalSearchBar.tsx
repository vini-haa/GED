'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import type { SearchResponse, SearchResultItem } from '@/lib/types';

function getStatusVariant(
  status: string
): 'success' | 'warning' | 'default' | 'destructive' {
  const s = status.toLowerCase();
  if (s.includes('conclu') || s.includes('finaliz')) return 'success';
  if (s.includes('penden') || s.includes('aberto')) return 'warning';
  if (s.includes('cancel')) return 'destructive';
  return 'default';
}

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setTotalResults(0);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const resp = await apiClient.get<SearchResponse>(
          `/search?q=${encodeURIComponent(query)}&limit=6`
        );
        setResults(resp.results ?? []);
        setTotalResults(resp.total_todos);
        setIsOpen((resp.results?.length ?? 0) > 0);
      } catch {
        setResults([]);
        setTotalResults(0);
        setIsOpen(false);
      }
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
            {results.map((item) => {
              const source = item.tipo === 'interno' ? 'interno' : 'sagi';
              return (
                <Link
                  key={`${item.tipo}-${item.id}`}
                  href={`/protocolo/${source}/${item.id}`}
                  className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                  onClick={handleResultClick}
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {item.numero_protocolo}
                      </p>
                      {item.tipo === 'interno' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          Interno
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.assunto || 'Sem assunto'}
                    </p>
                    {item.highlight && (
                      <p className="text-xs text-muted-foreground/70 truncate mt-0.5 italic">
                        {item.highlight}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {totalResults > 6 && (
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
