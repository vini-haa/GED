'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface ProtocoloSearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  scope: 'my-sector' | 'all';
  onScopeChange: (scope: 'my-sector' | 'all') => void;
}

export function ProtocoloSearchBar({
  value,
  onSearch,
  scope,
  onScopeChange,
}: ProtocoloSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar quando o valor externo muda (ex: limpar filtros)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback(
    (val: string) => {
      setLocalValue(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(val);
      }, 300);
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearch('');
    inputRef.current?.focus();
  }, [onSearch]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Buscar por número, assunto, projeto ou setor..."
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {localValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 rounded-lg border border-border/50 p-1">
        <Button
          variant={scope === 'my-sector' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onScopeChange('my-sector')}
        >
          Meu Setor
        </Button>
        <Button
          variant={scope === 'all' ? 'default' : 'ghost'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onScopeChange('all')}
        >
          Todos
        </Button>
      </div>
    </div>
  );
}
