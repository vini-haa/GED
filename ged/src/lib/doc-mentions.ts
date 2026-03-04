/**
 * Utilitários para menção de documentos em observações.
 *
 * Formato do token: [@doc:UUID:nome_arquivo]
 * Exemplo: [@doc:abc123:relatorio.pdf]
 */

/** Regex que captura tokens de menção de documento */
export const DOC_MENTION_REGEX = /\[@doc:([^:]+):([^\]]+)\]/g;

export interface DocMention {
  id: string;
  fileName: string;
  fullMatch: string;
}

/** Extrai todas as menções de documento de um texto */
export function extractMentions(text: string): DocMention[] {
  const mentions: DocMention[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(DOC_MENTION_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      id: match[1],
      fileName: match[2],
      fullMatch: match[0],
    });
  }

  return mentions;
}

/** Gera o token de menção para inserir no textarea */
export function buildMentionToken(id: string, fileName: string): string {
  return `[@doc:${id}:${fileName}]`;
}

/** Divide o texto em partes alternando entre texto normal e menções */
export interface TextPart {
  type: 'text' | 'mention';
  value: string;
  mention?: DocMention;
}

export function parseContent(text: string): TextPart[] {
  const parts: TextPart[] = [];
  const regex = new RegExp(DOC_MENTION_REGEX.source, 'g');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    parts.push({
      type: 'mention',
      value: match[0],
      mention: {
        id: match[1],
        fileName: match[2],
        fullMatch: match[0],
      },
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}
