'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, FolderKanban, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProjetos, type ProjetoSAGI } from '@/hooks/use-protocolos';

interface ProjetoComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ProjetoCombobox({ value, onChange, disabled }: ProjetoComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: projetos = [], isLoading } = useProjetos(debouncedSearch);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearch(val);
      onChange(val);
      if (val.length > 0) {
        setOpen(true);
      }
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (projeto: ProjetoSAGI) => {
      setSearch(projeto.titulo);
      onChange(projeto.titulo);
      setOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    setSearch('');
    onChange('');
    setOpen(false);
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <FolderKanban className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar projeto..."
          value={search}
          onChange={handleInputChange}
          onFocus={() => search.length > 0 && setOpen(true)}
          disabled={disabled}
          className="pl-9 pr-16"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {search && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          >
            <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-border/50 bg-popover shadow-md max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando projetos...
            </div>
          ) : projetos.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Nenhum projeto encontrado.
            </div>
          ) : (
            projetos.slice(0, 50).map((projeto) => (
              <button
                key={projeto.numconv}
                type="button"
                onClick={() => handleSelect(projeto)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
              >
                <Check
                  className={`h-3.5 w-3.5 shrink-0 ${
                    value === projeto.titulo ? 'text-primary' : 'text-transparent'
                  }`}
                />
                <span className="truncate">{projeto.titulo}</span>
                {projeto.num_oficial && (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {projeto.num_oficial}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
