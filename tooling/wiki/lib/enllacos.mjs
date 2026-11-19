import { scanDotallWikilinkSpans } from '../../lib/document-link-scanners.mjs';

export function parseWikilink(raw) {
  const match = raw.match(/^(!?)\[\[(.*?)\]\]$/s);
  if (!match) return null;
  
  const embed = match[1] === '!';
  const inner = match[2].trim();
  
  let target = inner;
  let alias = null;
  let anchor = null;
  let blockId = null;

  // Obtenir alias
  const pipeIndex = target.indexOf('|');
  if (pipeIndex !== -1) {
    alias = target.substring(pipeIndex + 1).trim();
    target = target.substring(0, pipeIndex).trim();
  }

  // Obtenir àncora i blockId
  const hashIndex = target.indexOf('#');
  if (hashIndex !== -1) {
    const afterHash = target.substring(hashIndex + 1);
    if (afterHash.startsWith('^')) {
      blockId = afterHash.substring(1).trim();
    } else {
      anchor = afterHash.trim();
    }
    target = target.substring(0, hashIndex).trim();
  }

  // Eliminar .md si l'usuari ho ha posat
  if (target.toLowerCase().endsWith('.md')) {
    target = target.slice(0, -3);
  }

  return { embed, target, anchor, blockId, alias };
}

export function extractWikilinks(text) {
  // Preserve the legacy string-method failure for non-string arguments.
  if (typeof text?.matchAll !== 'function') throw new TypeError('text.matchAll is not a function');
  const links = [];
  for (const match of scanDotallWikilinkSpans(text)) {
    const parsed = parseWikilink(match.raw);
    if (parsed) links.push({...match, ...parsed});
  }
  return links;
}
