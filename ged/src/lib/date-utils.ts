import { format } from 'date-fns';

/**
 * Parseia um timestamp da API como horário local.
 *
 * O banco PostgreSQL usa `timestamp without time zone` configurado em
 * America/Fortaleza (UTC-3). O Go/pgx serializa esses timestamps com
 * sufixo "Z" como se fossem UTC, mas na verdade são horário local.
 *
 * Esta função remove o "Z" para que o Date() interprete como horário local
 * do browser (que está no mesmo fuso).
 */
export function parseLocalDate(isoString: string | null | undefined): Date | null {
  if (!isoString) return null;
  // Remove trailing Z para tratar como local time
  const cleaned = isoString.replace(/Z$/, '');
  return new Date(cleaned);
}

/** Formata data da API como "DD/MM/AAAA às HH:MM" */
export function formatDateTime(isoString: string | null | undefined): string {
  const date = parseLocalDate(isoString);
  if (!date || isNaN(date.getTime())) return '—';
  return format(date, "dd/MM/yyyy 'às' HH:mm");
}
