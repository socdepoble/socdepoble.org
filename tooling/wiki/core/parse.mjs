/**
 * autoneteja_wiki.mjs — auditoria i migració reversible de la Wiki.
 *
 * GARANTIES:
 * - Sense flags d'aplicació és un dry-run real: zero escriptures.
 * - Una migració de frontmatter conserva el cos byte a byte.
 * - Cap orfe amb contingut es mou automàticament.
 * - Només es poden quarantinar buits semàntics amb grau zero.
 * - Tota mutació exigix rebut del Reflex, backup, manifest i rollback.
 * - Qualsevol error és fail-closed (exit diferent de zero).
 *
 * Ús:
 *   node autoneteja_wiki.mjs [--json] [--strict]
 *   node autoneteja_wiki.mjs --apply-frontmatter --ack-schema-cutover \
 *     --receipt=/ruta/rebut.json
 *   node autoneteja_wiki.mjs --quarantine-empty --receipt=/ruta/rebut.json
 *   node autoneteja_wiki.mjs --restore=/ruta/manifest.json \
 *     --receipt=/ruta/rebut.json
 */

import fs from 'node:fs/promises';

const _metaUrl = import.meta.url.startsWith('file:') ? import.meta.url : 'file://' + import.meta.url;
import path from 'node:path';
import {
  parseFrontmatter,
} from '../lib/frontmatter.mjs';
import { WIKI_DIR } from '../lib/project_paths.mjs';

export const DEFAULT_WIKI_DIR = WIKI_DIR;
const SCHEMA_TEXT = await fs.readFile(new URL('../schema.json', _metaUrl), 'utf8');
const SCHEMA = JSON.parse(SCHEMA_TEXT);
const FIELD_ORDER = ['status', 'type', 'description', 'aliases', 'revisat'];
const ALLOWED_FIELDS = new Set(FIELD_ORDER);
const ALLOWED_STATES = new Set(SCHEMA.properties.status.enum);
const ALLOWED_TYPES = new Set(SCHEMA.properties.type.enum);
const MAX_DESCRIPTION = SCHEMA.properties.description.maxLength;
const MAX_ALIASES = SCHEMA.properties.aliases.maxItems;
 
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const PLACEHOLDER_RE = /^(?:todo|tbd|wip|fixme|placeholder|pendent|per completar|pr[oò]ximament|sense contingut)[\s.!…:;-]*$/i;

const posix = (value) => value.split(path.sep).join('/');
import { normalitza } from '../lib/text.mjs';
const unique = (values) => [...new Set(values)];
const emptyValue = (value) => value === undefined || value === null || value === ''
  || (Array.isArray(value) && value.length === 0);

export function stripComments(text) {
  return text
    .replace(/<!--[^]*?-->/g, '')
    .replace(/%%[^]*?%%/g, '');
}

/** Retira només regions on Obsidian no hauria de crear arestes. */
export function liveMarkdown(body) {
  const out = [];
  let inFence = false;
  let fenceChar = '';
  let fenceLength = 0;
  for (const line of body.split(/(?<=\n)/)) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (!inFence && marker) {
      inFence = true;
      fenceChar = marker[1][0];
      fenceLength = marker[1].length;
      out.push('\n');
      continue;
    }
    if (inFence) {
      if (marker && marker[1][0] === fenceChar && marker[1].length >= fenceLength
        && /^\s{0,3}(`{3,}|~{3,})\s*$/.test(line.trimEnd())) {
        inFence = false;
      }
      out.push('\n');
      continue;
    }
    out.push(line);
  }
  return stripComments(out.join('')).replace(/(`+)(?:[^`]|`(?!\1))*?\1/g, '');
}

export function parseMarkdownDestination(raw) {
  let value = raw.trim();
  const angle = /^<([^>]+)>/.exec(value);
  if (angle) return angle[1];
  const quotedTitle = /\s+(?:"[^"]*"|'[^']*'|\([^)]*\))\s*$/.exec(value);
  if (quotedTitle) value = value.slice(0, quotedTitle.index).trim();
  return value;
}

export function extractInlineMarkdownLinks(text) {
  const links = [];
  for (let i = 0; i < text.length; i++) {
    const embed = text[i] === '!' && text[i + 1] === '[';
    const bracket = embed ? i + 1 : i;
    if (text[bracket] !== '[' || text[bracket + 1] === '[') continue;
    let depth = 1;
    let escaped = false;
    let labelEnd = -1;
    for (let j = bracket + 1; j < text.length; j++) {
      const char = text[j];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (char === '[') depth++;
      else if (char === ']' && --depth === 0) { labelEnd = j; break; }
    }
    if (labelEnd < 0 || text[labelEnd + 1] !== '(') continue;

    let parens = 1;
    let quote = '';
    let angle = false;
    escaped = false;
    let end = -1;
    for (let j = labelEnd + 2; j < text.length; j++) {
      const char = text[j];
      if (escaped) { escaped = false; continue; }
      if (char === '\\') { escaped = true; continue; }
      if (!quote && char === '<') { angle = true; continue; }
      if (angle && char === '>') { angle = false; continue; }
      if (!angle && (char === '"' || char === "'")) {
        if (quote === char) quote = '';
        else if (!quote && /\s/.test(text[j - 1] || '')) quote = char;
        continue;
      }
      if (angle || quote) continue;
      if (char === '(') parens++;
      else if (char === ')' && --parens === 0) { end = j; break; }
    }
    if (end < 0) continue;
    links.push({
      kind: 'markdown',
      raw: text.slice(i, end + 1),
      target: parseMarkdownDestination(text.slice(labelEnd + 2, end)),
      embed,
    });
    i = end;
  }
  return links;
}

export function extractLinks(body) {
  const live = liveMarkdown(body);
  const links = [];
  for (const match of live.matchAll(/(!?)\[\[([^[\]\n]+)\]\]/g)) {
    const inner = match[2];
    const pipe = inner.indexOf('|');
    const rawTarget = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
    links.push({ kind: 'wiki', raw: match[0], target: rawTarget, embed: Boolean(match[1]) });
  }
  const withoutWiki = live.replace(/!?\[\[[^[\]\n]+\]\]/g, '');
  links.push(...extractInlineMarkdownLinks(withoutWiki));
  return links;
}

export function safeDecode(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function buildResolver(docs) {
  const byPath = new Map();
  const byBase = new Map();
  const byAlias = new Map();

  const add = (map, key, doc) => {
    const normalized = normalitza(key);
    if (!map.has(normalized)) map.set(normalized, []);
    map.get(normalized).push(doc);
  };

  for (const doc of docs) {
    const noExt = doc.relPath.replace(/\.md$/i, '');
    add(byPath, noExt, doc);
    add(byBase, doc.base, doc);
    const parsed = parseFrontmatter(doc.content);
    const aliases = Array.isArray(parsed.data.aliases) ? parsed.data.aliases : [];
    for (const alias of aliases) add(byAlias, String(alias), doc);
  }
  return { byPath, byBase, byAlias };
}

export function resolveLink(link, source, resolver) {
  let target = safeDecode(link.target).replace(/\\/g, '/').trim();
  if (!target) return { status: 'self' };
  if (/^(?:https?:|mailto:|tel:|ftp:|file:|data:|obsidian:)/i.test(target)) return { status: 'external' };
  if (target.startsWith('#') || target.startsWith('^')) return { status: 'self' };

  const anchorAt = link.kind === 'wiki' ? target.search(/[#^]/) : target.indexOf('#');
  if (anchorAt >= 0) target = target.slice(0, anchorAt);
  target = target.trim();
  if (!target) return { status: 'self' };
  if (!/\.md$/i.test(target) && /\.[A-Za-z0-9]{1,8}$/.test(target)) return { status: 'asset' };
  const vaultAbsolute = target.startsWith('/');
  target = target.replace(/\.md$/i, '').replace(/^\/+/, '');

  const candidates = [];
  if (link.kind === 'markdown') {
    if (vaultAbsolute) candidates.push(target);
    else {
      const relative = posix(path.posix.normalize(path.posix.join(path.posix.dirname(source.relPath), target)));
      if (relative.startsWith('../')) return { status: 'outside' };
      candidates.push(relative);
    }
  } else if (target.includes('/')) {
    const relative = posix(path.posix.normalize(path.posix.join(path.posix.dirname(source.relPath), target)));
    candidates.push(target, relative);
  }

  for (const candidate of unique(candidates)) {
    const hits = resolver.byPath.get(normalitza(candidate)) || [];
    if (hits.length === 1) return { status: 'resolved', doc: hits[0] };
    if (hits.length > 1) return { status: 'ambiguous', docs: hits };
  }

  if (link.kind === 'markdown') return { status: 'unresolved' };
  if (target.includes('/')) return { status: 'unresolved' };

  const base = path.posix.basename(target);
  const baseHits = resolver.byBase.get(normalitza(base)) || [];
  if (baseHits.length === 1) return { status: 'resolved', doc: baseHits[0] };
  if (baseHits.length > 1) return { status: 'ambiguous', docs: baseHits };

  // Obsidian prioritza un basename real sobre un alias homònim. Resoldre
  // l'alias primer podia convertir [[Target]] en una aresta cap a una altra
  // nota i deixar `Target.md` falsament orfe/quarantinable.
  if (link.kind === 'wiki') {
    const aliasHits = resolver.byAlias.get(normalitza(target)) || [];
    if (aliasHits.length === 1) return { status: 'resolved', doc: aliasHits[0] };
    if (aliasHits.length > 1) return { status: 'ambiguous', docs: aliasHits };
  }

  const suffixHits = [...resolver.byPath.entries()]
    .filter(([key]) => key.endsWith(`/${normalitza(target)}`))
    .flatMap(([, hits]) => hits);
  if (suffixHits.length === 1) return { status: 'resolved', doc: suffixHits[0] };
  if (suffixHits.length > 1) return { status: 'ambiguous', docs: suffixHits };
  return { status: 'unresolved' };
}

export function buildGraph(docs, universeDocs = docs) {
  const resolver = buildResolver(universeDocs);
  const nodePaths = new Set(docs.map((doc) => doc.relPath));
  const outgoing = new Map(docs.map((doc) => [doc.relPath, new Set()]));
  const incoming = new Map(docs.map((doc) => [doc.relPath, new Set()]));
  const unresolved = [];
  const ambiguous = [];
  const outside = [];
  const outsideScope = [];
  let occurrences = 0;

  for (const source of docs) {
    const body = parseFrontmatter(source.content).body;
    for (const link of extractLinks(body)) {
      const resolution = resolveLink(link, source, resolver);
      if (['external', 'asset', 'self'].includes(resolution.status)) continue;
      occurrences++;
      if (resolution.status === 'resolved') {
        if (!nodePaths.has(resolution.doc.relPath)) {
          outsideScope.push({ from: source.relPath, kind: link.kind, target: link.target, resolved: resolution.doc.relPath });
          continue;
        }
        if (resolution.doc.relPath !== source.relPath) {
          outgoing.get(source.relPath).add(resolution.doc.relPath);
          incoming.get(resolution.doc.relPath).add(source.relPath);
        }
      } else if (resolution.status === 'ambiguous') {
        ambiguous.push({
          from: source.relPath,
          kind: link.kind,
          target: link.target,
          candidates: resolution.docs.map((doc) => doc.relPath),
        });
      } else if (resolution.status === 'outside') {
        outside.push({ from: source.relPath, kind: link.kind, target: link.target });
      } else {
        unresolved.push({ from: source.relPath, zone: source.zone, kind: link.kind, target: link.target });
      }
    }
  }

  const degree = new Map(docs.map((doc) => [
    doc.relPath,
    (incoming.get(doc.relPath)?.size || 0) + (outgoing.get(doc.relPath)?.size || 0),
  ]));
  const orphans = docs.filter((doc) => degree.get(doc.relPath) === 0).map((doc) => doc.relPath);
  const sourceOnly = docs
    .filter((doc) => incoming.get(doc.relPath).size === 0 && outgoing.get(doc.relPath).size > 0)
    .map((doc) => doc.relPath);
  const scopedResolver = buildResolver(docs);
  const duplicateBasenames = [...scopedResolver.byBase.entries()]
    .filter(([, hits]) => hits.length > 1)
    .map(([base, hits]) => ({ base, files: hits.map((doc) => doc.relPath) }));

  return {
    incoming, outgoing, degree,
    summary: {
      occurrences,
      resolvedEdges: [...outgoing.values()].reduce((sum, values) => sum + values.size, 0),
      unresolvedOccurrences: unresolved.length,
      unresolvedTargets: unique(unresolved.map((item) => normalitza(item.target))).length,
      ambiguousOccurrences: ambiguous.length,
      outsideOccurrences: outside.length,
      outsideScopeOccurrences: outsideScope.length,
      orphans: orphans.length,
      sourceOnly: sourceOnly.length,
      duplicateBasenames: duplicateBasenames.length,
    },
    unresolved,
    ambiguous,
    outside,
    outsideScope,
    orphans,
    sourceOnly,
    duplicateBasenames,
  };
}

export function cleanText(value) {
  return String(value ?? '')
    .replace(/!?(?:\[\[([^\]|]+)(?:\|([^\]]+))?\]\])/g, (_, target, alias) => alias || target)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateCodePoints(value, max) {
  const chars = [...value];
  if (chars.length <= max) return value;
  return `${chars.slice(0, Math.max(0, max - 1)).join('').trimEnd()}…`;
}

export function descriptionFromBody(body, base) {
  const live = liveMarkdown(body);
  for (const raw of live.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^#{1,6}\s/.test(line) || /^[-*+]\s/.test(line) || /^\|/.test(line) || /^>/.test(line)) continue;
    const cleaned = cleanText(line);
    if (cleaned.length >= 12) return truncateCodePoints(cleaned, MAX_DESCRIPTION);
  }
  const h1 = /^#\s+(.+)$/m.exec(live)?.[1];
  if (h1) return truncateCodePoints(`Document sobre «${cleanText(h1)}».`, MAX_DESCRIPTION);
  return truncateCodePoints(`Document «${base}» pendent de descripció humana.`, MAX_DESCRIPTION);
}

const TYPE_MAP = new Map([
  ['doc', 'document'], ['document', 'document'], ['nucli', 'document'], ['core', 'document'],
  ['bios', 'document'], ['identitat', 'document'], ['cultura', 'document'], ['saber', 'document'],
  ['entrada', 'index'], ['index', 'index'], ['skill', 'skill'],
  ['plantilla', 'plantilla'], ['plantilla-mestra', 'plantilla'],
  ['acta', 'acta'], ['acte', 'acta'], ['actes', 'acta'],
  ['auditoria', 'informe'], ['report', 'informe'], ['informe', 'informe'],
  ['prompt', 'prompt'], ['petorreta', 'petorreta'],
  ['llei', 'norma'], ['regles', 'norma'], ['estandard', 'norma'],
  ['governanca', 'norma'], ['font-veritat', 'norma'],
  ['protocol', 'protocol'], ['protocol-execucio', 'protocol'], ['workflow', 'protocol'],
  ['registre', 'registre'], ['log', 'registre'], ['ledger', 'registre'],
]);

export function eventTypeFromName(base) {
  const upper = `_${base.toUpperCase()}_`;
  if (upper.includes('_PETORRETA_')) return 'petorreta';
  const candidates = [
    ['_ACTA_', 'acta'],
    ['_AUDITORIA_', 'informe'],
    ['_REPORT_', 'informe'],
    ['_PROMPT_', 'prompt'],
  ].map(([needle, type]) => ({ index: upper.indexOf(needle), type }))
    .filter((candidate) => candidate.index >= 0)
    .sort((a, b) => a.index - b.index);
  return candidates[0]?.type || null;
}

export function structuralType(doc) {
  const rel = doc.relPath;
  if (/(?:^|\/)skills(?:\/|$)/i.test(rel) || doc.name === 'SKILL.md') return 'skill';
  if (/^(?:README|00_INDEX|00_index|index)/i.test(doc.base)) return 'index';
  if (/^00_plantilles$/i.test(doc.base)) return 'index';
  if (/(?:^|\/)(?:07_)?plantilles(?:\/|$)/i.test(rel)) return 'plantilla';
  const event = eventTypeFromName(doc.base);
  if (event) return event;
  if (/^(?:LLEI|ESTANDARD|DOC_Governanca)/i.test(doc.base)) return 'norma';
  if (/(?:registre|registry|ledger|changelog|^log_)/i.test(doc.base)) return 'registre';
  return null;
}

export function inferType(doc, data) {
  const explicit = String(data.type || data.tipus || '').toLocaleLowerCase('ca');
  if (ALLOWED_TYPES.has(explicit)) return explicit;
  const raw = String(data.categoria || '').toLocaleLowerCase('ca');
  const mapped = TYPE_MAP.get(raw);
  if (mapped) return mapped;
  return structuralType(doc) || 'document';
}

export function inferState(doc, data) {
  const value = String(data.status || data.estat || '').toLocaleLowerCase('ca');
  if (ALLOWED_STATES.has(value)) return value;
  if (doc.zone === 'arxiu' || doc.zone === 'quarantena_visible') return 'arxivat';
  if (doc.zone === 'escriptori') return 'esborrany';
  return 'esborrany';
}

export function canonicalAliases(data, base) {
  void base;
  // sourceShapeErrors ja bloqueja formes insegures. Ací no "netegem" valors
  // vàlids: `C#`, apòstrofs i puntuació són dades humanes, no soroll Markdown.
  return Array.isArray(data.aliases) ? [...data.aliases] : [];
}

export function canonicalFrontmatter(doc, parsed) {
  const data = parsed.data;
  const sourceDescription = data.description || data.descripcio || data.resum || '';
  const existingDescription = typeof sourceDescription === 'string' ? sourceDescription : '';
  const hasHumanDescription = [...existingDescription].length >= SCHEMA.properties.description.minLength;
  const description = hasHumanDescription
    ? existingDescription
    : descriptionFromBody(parsed.body, doc.base);
  const canonical = {
    status: hasHumanDescription ? inferState(doc, data) : 'esborrany',
    type: inferType(doc, data),
    description,
  };
  const aliases = canonicalAliases(data, doc.base);
  if (aliases.length) canonical.aliases = aliases;
  if (validIsoDate(data.revisat)) {
    canonical.revisat = String(data.revisat);
  }
  return canonical;
}

export function validateCanonical(data) {
  const errors = [];
  const unknown = Object.keys(data).filter((key) => !ALLOWED_FIELDS.has(key));
  if (unknown.length) errors.push(`claus no admeses: ${unknown.join(', ')}`);
  if (typeof data.status !== 'string' && typeof data.estat !== 'string') errors.push('status o estat absent o invàlid');
  else if (!ALLOWED_STATES.has(data.status || data.estat)) errors.push(`status invàlid: ${data.status || data.estat}`);
  if (typeof data.type !== 'string' && typeof data.tipus !== 'string') errors.push('type o tipus absent o invàlid');
  else if (!ALLOWED_TYPES.has(data.type || data.tipus)) errors.push(`type invàlid: ${data.type || data.tipus}`);
  const descriptionLength = typeof data.description === 'string' ? [...data.description].length : 0;
  if (descriptionLength < SCHEMA.properties.description.minLength || descriptionLength > MAX_DESCRIPTION) {
    errors.push('description absent, massa curta o massa llarga');
  }
  if (data.aliases !== undefined) {
    if (!Array.isArray(data.aliases) || data.aliases.length > MAX_ALIASES
      || data.aliases.some((alias) => typeof alias !== 'string' || [...alias].length < 1 || [...alias].length > 80)
      || new Set(data.aliases.map((alias) => normalitza(String(alias)))).size !== data.aliases.length) {
      errors.push('aliases invàlid, duplicat o fora de límits');
    }
  }
  if (data.revisat !== undefined && !validIsoDate(data.revisat)) errors.push('revisat invàlid');
  return errors;
}

export function validIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function sourceShapeErrors(data, doc) {
  const errors = [];
  for (const key of ['status', 'type', 'estat', 'tipus']) {
    if (data[key] === undefined || emptyValue(data[key])) continue;
    if (typeof data[key] !== 'string') errors.push(`${key} no és string`);
    else {
      const allowed = (key === 'status' || key === 'estat') ? ALLOWED_STATES : ALLOWED_TYPES;
      if (!allowed.has(data[key])) errors.push(`${key} té un valor no admés i necessita revisió humana: ${data[key]}`);
    }
  }
  for (const key of ['description', 'descripcio', 'resum']) {
    if (data[key] !== undefined && !emptyValue(data[key])) {
      if (typeof data[key] !== 'string') errors.push(`${key} no és string`);
      else if ([...data[key]].length < SCHEMA.properties.description.minLength) errors.push(`${key} és massa curta per migrar automàticament`);
      else if ([...data[key]].length > MAX_DESCRIPTION) errors.push(`${key} és massa llarga per migrar automàticament`);
    }
  }
  if (data.aliases !== undefined && !emptyValue(data.aliases)) {
    if (!Array.isArray(data.aliases) || data.aliases.length > MAX_ALIASES
      || data.aliases.some((alias) => typeof alias !== 'string' || [...alias].length < 1 || [...alias].length > 80)
      || new Set(data.aliases.map((alias) => normalitza(String(alias)))).size !== data.aliases.length) {
      errors.push('aliases necessita revisió humana');
    }
  }
  if (data.revisat !== undefined && !emptyValue(data.revisat) && !validIsoDate(data.revisat)) {
    errors.push('revisat no és una data real YYYY-MM-DD');
  }
  const expectedType = structuralType(doc);
  const explicitType = String(data.type || data.tipus || '').toLocaleLowerCase('ca');
  if (expectedType && ALLOWED_TYPES.has(explicitType) && explicitType !== expectedType) {
    errors.push(`type explícit ${explicitType} entra en conflicte amb ${expectedType} inferit de nom/ruta`);
  }
  return errors;
}

export function contentClassification(doc, parsed) {
  const withoutComments = stripComments(parsed.body).trim();
  const plain = cleanText(liveMarkdown(parsed.body).replace(/^#{1,6}\s+/gm, '')).trim();
  const headings = [...liveMarkdown(parsed.body).matchAll(/^#{1,6}\s+(.+)$/gm)];
  return {
    physicalEmpty: /^\uFEFF?\s*$/u.test(doc.content),
    semanticEmpty: withoutComments === '',
    placeholder: plain.length <= 120 && PLACEHOLDER_RE.test(plain),
    titleOnly: headings.length > 0 && plain === cleanText(headings.map((match) => match[1]).join(' ')),
    controlChars: CONTROL_RE.test(doc.content),
  };
}
