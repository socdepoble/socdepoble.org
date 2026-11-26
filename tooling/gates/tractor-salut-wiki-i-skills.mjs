#!/usr/bin/env node
/** IDEA-361 · tractor de salut de la Wiki i les skills (proposta R4 de Codex, integrada per Claude a la v1.2.26,
 * Lot C1-1, D7; bytes del motor idèntics a la proposta segellada llevat d'esta capçalera i de 4 escapaments sobrers
 * de regex que l'ESLint del repositori refusa (`no-useless-escape`, mateix significat amb la bandera u); les rutes
 * canòniques de la Wiki i de l'Escriptori ixen de `CAMINS` (Porta Rutes R1), amb els mateixos valors. Només lectura, Node builtin, cap IA/xarxa.
 * Ús des de socdepoble.org: node tooling/gates/tractor-salut-wiki-i-skills.mjs --arrel . --sense-ia --json --ara AAAA-MM-DD
 * CLI: --arrel DIR --sense-ia --json --ara ISO [--cataleg FILE]
 *      [--skill-externa FILE] (repetible; mai hi ha cap externa per defecte).
 * Exit 0: informe complet, també si demana revisió. Exit 2: ús/IO incomplet.
 * Cap resultat és un certificat global o una autorització de poda/repair.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { isUtf8 } from 'node:buffer';
import { CAMINS } from '../lib/arrel.mjs';

// Porta Rutes (R1): les rutes canòniques ixen de la SSOT, no de literals.
const WIKI = CAMINS.wiki;
const escapaRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ZONES_PROTEGIDES = new RegExp(`^${escapaRe(CAMINS.escriptori)}\\/(?:01_produccio|02_investigacio_ia)(?:\\/|$)`, 'iu');

export const SCHEMA = 'sdp.tractor-salut-wiki-skills.v1';
export const CATALEG_SCHEMA = 'sdp.salut-wiki-skills.cataleg.v1';
export const POLITICA = Object.freeze({ draftDies: 15, elefantBytes: 25_000,
  maxFitxerBytes: 8 * 1024 * 1024, maxTotalBytes: 64 * 1024 * 1024,
  maxDocuments: 20_000, maxFindings: 5_000, maxFontsControl: 10_000,
  maxControlBytes: 128 * 1024 * 1024, paragrafDuplicatMin: 160 });
const REGLES = ['DRAFT_ANTIC', 'CLAIM_DIVERGENT', 'ELEFANT', 'DUPLICAT_WIKI_SKILL', 'DUPLICAT_SKILL_SKILL', 'ORFE', 'UNKNOWN'];
const ARCHIVE = new Set(['90_arxiu_historic', '90_historic', '.sdp-reflex', '.sdp-paperera']);
const SKIP = new Set(['.git', 'node_modules', '.obsidian', 'backups', 'backup']);
const arxivat = part => ARCHIVE.has(part.toLowerCase());
const protegit = rel => ZONES_PROTEGIDES.test(rel);
const ZONES_ELEFANT = new RegExp(`^${escapaRe(WIKI)}\\/(?:01_ser|02_saber)\\/`, 'u');
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const hash = text => createHash('sha256').update(text).digest('hex');
const objecte = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const historic = cami => /(?:^|\/)(?:10_actes|90_arxiu_historic|90_historic)(?:\/|$)/u.test(cami);
const esSkill = d => d.origen === 'externa' || (d.cami.startsWith('.agents/skills/') && /\/SKILL\.md$/u.test(d.cami));
const limits = [
  'Proposta read-only; cap IA, xarxa, autoreparació, poda o certificat global.',
  'Orfe significa zero fonts Markdown resoltes, no unused: registres coneguts es mostren separadament.',
  'Cicles poden tindre entrada literal sense ser abastables: no es certifica reachability.',
  'Lèxic Markdown/frontmatter delimitat; ambigüitats i manca de catàleg són UNKNOWN.',
  '25 KB són 25000 bytes UTF-8; edat >15 dies UTC, no mtime ni durada d’estatus inventada.',
  'Arxiu i backups exclosos abans de llegir; snapshots de disc no atòmics.',
  'Referència literal de codi o fixture no és consumidor runtime ni prova d’ús dinàmic; cap UNUSED certificat.',
];

export function normalitzaCami(cami) {
  if (typeof cami !== 'string' || !cami || cami.length > 4096 || cami.includes('\\')
      || path.posix.isAbsolute(cami) || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(cami)) throw new Error('Camí relatiu invàlid');
  const value = cami.normalize('NFC');
  if (value.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Camí no canònic');
  return value;
}

function dataUTC(value) {
  if (typeof value !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/u.exec(value);
  if (!m) return null;
  const [year, month, day] = m.slice(1, 4).map(Number);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return null;
  const time = new Date(m[4] ? value : `${value}T00:00:00Z`);
  if (!Number.isFinite(time.getTime())) return null;
  return Date.UTC(time.getUTCFullYear(), time.getUTCMonth(), time.getUTCDate());
}

function scalar(raw) {
  const value = raw.trim();
  if (value.startsWith('"')) { try { return JSON.parse(value); } catch { return null; } }
  if (value.startsWith("'")) return value.endsWith("'") ? value.slice(1, -1).replace(/''/gu, "'") : null;
  if (/^[!&*]|^[>|]/u.test(value)) return null;
  return value.replace(/\s+#.*$/u, '').trim();
}

/** Només camps necessaris. No pretén validar l’esquema canònic ni tot YAML. */
export function lligFrontmatter(text) {
  const rows = text.replace(/^\uFEFF/u, '').split('\n');
  const data = Object.create(null), errors = [];
  if (rows[0].trimEnd() !== '---') return { data, errors, body: text, offset: 0 };
  const end = rows.findIndex((line, i) => i > 0 && line.trimEnd() === '---');
  if (end < 0) return { data, errors: ['Frontmatter sense tancament'], body: '', offset: 0 };
  const relevant = new Set(['status', 'estat', 'type', 'tipus', 'date', 'data', 'created', 'creat', 'updated', 'revisat', 'status_since', 'data_esborrany', 'aliases']);
  let list = null;
  for (let i = 1; i < end; i++) {
    const line = rows[i].replace(/\r$/u, '');
    const m = /^([A-Za-z_][\w.-]*):\s*(.*)$/u.exec(line);
    if (m) {
      list = null;
      if (!relevant.has(m[1])) continue;
      if (Object.hasOwn(data, m[1])) { errors.push(`Camp duplicat: ${m[1]}`); data[m[1]] = null; continue; }
      if (m[1] === 'aliases') {
        if (!m[2]) { data.aliases = []; list = data.aliases; }
        else { try { data.aliases = JSON.parse(m[2]); } catch { errors.push('Aliases no JSON inline: no interpretats'); data.aliases = []; } }
      } else data[m[1]] = scalar(m[2]);
    } else if (list && /^\s+-\s+/u.test(line)) {
      const value = scalar(line.replace(/^\s+-\s+/u, ''));
      if (typeof value === 'string') list.push(value); else errors.push('Alias no escalar');
    }
  }
  if (data.status && data.estat && data.status !== data.estat) errors.push('status/estat contradictoris');
  if (Object.hasOwn(data, 'aliases') && (!Array.isArray(data.aliases) || data.aliases.some(a => typeof a !== 'string'))) {
    errors.push('Aliases amb forma no compatible'); data.aliases = [];
  }
  return { data, errors, body: rows.slice(end + 1).join('\n'), offset: end + 1 };
}

function blanc(value) { return value.replace(/[^\n]/gu, char => ' '.repeat(char.length)); }
/** Context literal de claims: conserva inline code de marcadors, no blocs/exemples. */
function markdownSenseBlocs(text) {
  let fence = null;
  return text.split('\n').map(line => {
    const m = /^ {0,3}(`{3,}|~{3,})/u.exec(line);
    if (!fence && m) { fence = m[1]; return blanc(line); }
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length && /^ {0,3}(`{3,}|~{3,})\s*$/u.test(line)) fence = null;
      return blanc(line);
    }
    return line;
  }).join('\n').replace(/<!--[\s\S]*?(?:-->|$)/gu, blanc).replace(/%%[\s\S]*?(?:%%|$)/gu, blanc);
}

/** Conserva línies/posicions, retirant comentaris, fences i exemples inline. */
export function markdownViu(text) {
  const fenced = markdownSenseBlocs(text);
  const out = [];
  let start = 0;
  for (let i = 0; i < fenced.length; i++) {
    if (fenced[i] !== '`') continue;
    let n = 1; while (fenced[i + n] === '`') n++;
    const marker = '`'.repeat(n), tail = fenced.indexOf(marker, i + n);
    if (tail >= 0) { out.push(fenced.slice(start, i), blanc(fenced.slice(i, tail + n))); i = tail + n - 1; start = i + 1; }
    else i += n - 1;
  }
  out.push(fenced.slice(start)); return out.join('');
}

function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
  return at => {
    let low = 0, high = starts.length;
    while (low < high) { const middle = (low + high) >>> 1; if (starts[middle] <= at) low = middle + 1; else high = middle; }
    return low;
  };
}

export function extreuVincles(text) {
  const live = markdownViu(text), found = [];
  const line = lineIndex(live);
  const add = (kind, target, at) => found.push({ kind, target, linia: line(at) });
  for (const m of live.matchAll(/!?\[\[([^[\]\n]+)\]\]/gu)) add('wiki', m[1].split('|')[0].trim(), m.index);
  const noWiki = live.replace(/!?\[\[[^[\]\n]+\]\]/gu, blanc);
  // Inline Markdown, balanced parentheses. Reference-style definitions are below.
  for (let i = 0; i < noWiki.length - 1; i++) {
    if (noWiki[i] !== ']' || noWiki[i + 1] !== '(') continue;
    let depth = 1, j = i + 2, raw = '';
    for (; j < noWiki.length && depth && j - i <= 4096; j++) {
      const c = noWiki[j];
      if (c === '\\' && j + 1 < noWiki.length) { raw += noWiki[++j]; continue; }
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth) raw += c;
    }
    if (depth === 0) {
      const target = raw.trim().startsWith('<') ? /^<([^>]+)>/u.exec(raw.trim())?.[1] : raw.trim().split(/\s+/u)[0];
      if (target) add('markdown', target, i);
      i = j - 1;
    }
  }
  const references = new Map();
  const definitions = [];
  for (const m of noWiki.matchAll(/^ {0,3}\[([^\]\n]+)\]:\s*(?:<([^>\n]+)>|(\S+))/gmu)) {
    const key = m[1].normalize('NFC').toLowerCase();
    if (!references.has(key)) references.set(key, m[2] ?? m[3]);
    definitions.push([m.index, m.index + m[0].length]);
  }
  for (const m of noWiki.matchAll(/!?\[([^\]\n]+)\](?:\[([^\]\n]*)\])?/gu)) {
    if (noWiki[m.index + m[0].length] === '(' || definitions.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const target = references.get((m[2] || m[1]).normalize('NFC').toLowerCase());
    if (target) add('markdown', target, m.index);
  }
  return found;
}

function resolver(documents) {
  const byPath = new Map(), byBase = new Map(), byAlias = new Map(), byCase = new Map(), bySuffix = new Map();
  const add = (map, key, doc) => { const list = map.get(key) ?? []; list.push(doc); map.set(key, list); };
  for (const doc of documents) {
    const noExt = doc.cami.replace(/\.md$/iu, '');
    add(byPath, noExt, doc); add(byCase, noExt.toLowerCase(), doc);
    add(byBase, path.posix.basename(noExt), doc);
    const parts = noExt.split('/');
    for (let i = 1; i < parts.length; i++) add(bySuffix, parts.slice(i).join('/'), doc);
    if (esSkill(doc)) add(byBase, path.posix.basename(path.posix.dirname(noExt)), doc);
    for (const alias of doc.fm.data.aliases ?? []) add(byAlias, alias.normalize('NFC'), doc);
  }
  return (link, source) => {
    let target;
    try { target = decodeURIComponent(link.target).normalize('NFC').trim(); }
    catch { return { state: 'unknown', reason: 'Percent-encoding invàlid', candidates: [] }; }
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/iu.test(target)) return { state: 'external' };
    if (!target || /^[#^]/u.test(target)) return { state: 'self' };
    target = target.split(/[#^]/u)[0].trim();
    if (!target || target.includes('\\') || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(target)) return { state: 'unknown', reason: 'Destí no canònic', candidates: [] };
    if (/\.[A-Za-z0-9]{1,8}$/u.test(target) && !/\.md$/iu.test(target)) return { state: 'asset' };
    target = target.replace(/\.md$/iu, '');
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(source.cami), target));
    const wiki = source.cami.startsWith(`${WIKI}/`);
    const rootTarget = target.replace(/^\/+/, '');
    const candidates = link.kind === 'markdown'
      ? [target.startsWith('/') ? (wiki && !rootTarget.startsWith(`${WIKI}/`) && !rootTarget.startsWith('.agents/') ? `${WIKI}/${rootTarget}` : rootTarget) : relative]
      : [relative, rootTarget, `${WIKI}/${rootTarget}`];
    for (const key of [...new Set(candidates)]) {
      if (key.startsWith('../') || key.split('/').some(arxivat)) continue;
      const hits = byPath.get(key) ?? [];
      const portable = byCase.get(key.toLowerCase()) ?? [];
      if (hits.length && portable.length > 1) return { state: 'unknown', reason: 'Col·lisió portable de caixa', candidates: portable };
      if (hits.length === 1) return { state: 'resolved', doc: hits[0] };
      if (hits.length > 1) return { state: 'unknown', reason: 'Camí ambigu', candidates: hits };
    }
    if (link.kind === 'wiki') {
      const hits = target.includes('/')
        ? bySuffix.get(rootTarget) ?? []
        : byBase.get(target) ?? byAlias.get(target) ?? [];
      if (hits.length === 1) return { state: 'resolved', doc: hits[0] };
      if (hits.length > 1) return { state: 'unknown', reason: 'Basename/alias ambigu', candidates: hits };
    }
    const caseHits = candidates.flatMap(key => byCase.get(key.toLowerCase()) ?? []);
    return { state: 'unknown', reason: caseHits.length ? 'Caixa no canònica' : 'Destí no resolt en l’abast', candidates: caseHits };
  };
}

function emptyReport(ara, incidencies = []) {
  return { schema: SCHEMA, ara, complet: incidencies.length === 0, estat: 'SENSE_TROBALLES',
    findings: [], resum: { total: 0, revisio: 0, unknown: 0, perRegla: Object.fromEntries(REGLES.map(k => [k, 0])) },
    cobertura: {}, incidencies: [...incidencies], limits: [...limits], globalPass: false };
}

/** Catàleg literal amb proves de font; mai regex aportada ni model vigent inventat. */
function preparaCataleg(cataleg, evidencies, errors) {
  if (cataleg === undefined || cataleg === null) return [];
  if (!objecte(cataleg) || cataleg.schema !== CATALEG_SCHEMA || !Array.isArray(cataleg.sources)
      || !Array.isArray(cataleg.claims) || cataleg.sources.length > 100 || cataleg.claims.length > 500) {
    errors.push('Catàleg invàlid o fora de límit'); return [];
  }
  const sources = new Map(), ids = new Set();
  for (const src of cataleg.sources) {
    if (!objecte(src) || typeof src.id !== 'string' || ids.has(src.id) || typeof src.path !== 'string'
        || !/^[a-f0-9]{64}$/u.test(src.sha256 ?? '')) { errors.push('Font de catàleg invàlida/duplicada'); continue; }
    ids.add(src.id);
    let sourcePath;
    try { sourcePath = normalitzaCami(src.path); } catch { errors.push('Path de font invàlid'); continue; }
    const evidence = evidencies.find(e => e.path === sourcePath);
    const verified = typeof evidence?.text === 'string' && hash(evidence.text) === src.sha256
      && (src.quote === undefined || (typeof src.quote === 'string' && evidence.text.includes(src.quote)));
    sources.set(src.id, verified);
    if (!verified) errors.push(`Font no verificada: ${sourcePath} (SHA/quote)`);
  }
  const escaped = s => s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const identifier = '[A-Za-z0-9](?:[A-Za-z0-9.-]{0,38}[A-Za-z0-9])?';
  const patterns = { version: '[vV]?[0-9]{1,6}\\.[0-9]{1,6}\\.[0-9]{1,6}(?:-' + identifier + ')?(?:\\+' + identifier + ')?',
    count: '[0-9]{1,12}(?:[.,][0-9]{1,6})?', model: '[A-Za-z0-9](?:[A-Za-z0-9_.:+-]{0,78}[A-Za-z0-9])?' };
  const result = [], claimIds = new Set(), templates = new Map();
  for (const claim of cataleg.claims) {
    if (!objecte(claim) || typeof claim.id !== 'string' || !Object.hasOwn(patterns, claim.kind)
        || !Array.isArray(claim.current) || !claim.current.length || claim.current.some(v => typeof v !== 'string' || v.length > 100)
        || !Array.isArray(claim.templates) || claim.templates.length > 20 || !sources.has(claim.sourceId)) {
      errors.push('Claim de catàleg invàlid'); continue;
    }
    const fullValue = new RegExp('^(?:' + patterns[claim.kind] + ')$', 'u');
    if (claim.current.some(value => !fullValue.test(value))) {
      errors.push(`Vigent fora de la gramàtica delimitada: ${claim.id}`); continue;
    }
    if (claimIds.has(claim.id)) { errors.push(`Claim ID duplicat: ${claim.id}`); continue; }
    claimIds.add(claim.id);
    for (const template of claim.templates) {
      if (typeof template !== 'string' || template.length > 240 || template.split('{valor}').length !== 2 || template === '{valor}') {
        errors.push(`Template invàlid: ${claim.id}`); continue;
      }
      const [prefix, suffix] = template.split('{valor}');
      const key = `${claim.kind}\0${template}`, current = JSON.stringify([...new Set(claim.current)].sort(cmp));
      if (templates.has(key) && templates.get(key) !== current) errors.push(`Template amb vigents contradictoris: ${claim.id}`);
      templates.set(key, current);
      result.push({ ...claim, prefixLength: prefix.length, suffixLength: suffix.length, verified: sources.get(claim.sourceId), regex: new RegExp(escaped(prefix) + '(' + patterns[claim.kind] + ')' + escaped(suffix), 'gu') });
    }
  }
  return errors.length ? result.map(claim => ({ ...claim, verified: false })) : result;
}

/** Motor pur: no FS, rellotge, xarxa, imports producte o mutació dels inputs. */
export function analitzaSalut({ documents, ara, cataleg, evidencies = [], incidencies = [], referenciesControl = [], tracesControl = [], coberturaControl = null, politica = {} } = {}) {
  const today = dataUTC(ara), report = emptyReport(ara, incidencies);
  if (today === null || !Array.isArray(documents) || !Array.isArray(evidencies)) {
    report.incidencies.push('Cal ara ISO real i documents/evidencies arrays'); report.complet = false; report.estat = 'INCOMPLET'; return report;
  }
  const docs = [], seen = new Set(), policy = { ...POLITICA, entrypoints: Array.isArray(politica?.entrypoints) ? [...politica.entrypoints] : [] }, possibleInbound = new Set();
  let totalBytes = 0;
  const add = (regla, doc, linia, missatge, evidencia = {}, nivell = 'revisio') => {
    if (report.findings.length >= POLITICA.maxFindings) { if (!report.incidencies.includes('Límit findings assolit')) report.incidencies.push('Límit findings assolit'); return; }
    const item = { regla, cami: doc.cami, linia, nivell, missatge, evidencia };
    item.id = hash(JSON.stringify(item)).slice(0, 20); report.findings.push(item);
  };
  for (const input of documents) {
    try {
      const cami = normalitzaCami(input.cami);
      if (cami.split('/').some(arxivat) || protegit(cami)) continue;
      if (seen.has(cami)) { report.incidencies.push(`Camí Unicode duplicat: ${cami}`); continue; }
      seen.add(cami);
      if (typeof input.text !== 'string') throw new Error('Text no string');
      const bytes = Buffer.byteLength(input.text, 'utf8');
      totalBytes += bytes;
      if (bytes > POLITICA.maxFitxerBytes || docs.length >= POLITICA.maxDocuments || totalBytes > POLITICA.maxTotalBytes) throw new Error('Límit de document/bytes excedit');
      const fm = lligFrontmatter(input.text), doc = { ...input, cami, bytes, fm };
      doc.live = markdownViu(fm.body); doc.claimText = markdownSenseBlocs(fm.body); doc.line = lineIndex(doc.live); docs.push(doc);
      for (const error of fm.errors) add('UNKNOWN', doc, 1, error, { ambit: 'frontmatter parcial' }, 'unknown');
    } catch (error) { report.incidencies.push(`Document no analitzable: ${error.message}`); }
  }
  docs.sort((a, b) => cmp(a.cami, b.cami));
  const evidenceIndex = new Map(), evidenceErrors = [];
  for (const entry of evidencies) {
    try {
      if (!objecte(entry) || typeof entry.text !== 'string') throw new Error('Forma d’evidència invàlida');
      const key = normalitzaCami(entry.path);
      if (evidenceIndex.has(key)) { evidenceIndex.set(key, null); throw new Error(`Path d’evidència duplicat: ${key}`); }
      evidenceIndex.set(key, { path: key, text: entry.text });
    } catch (error) { evidenceErrors.push(error.message); }
  }
  const uniqueEvidence = [...evidenceIndex.values()].filter(Boolean);
  const catErrors = [...evidenceErrors], claims = preparaCataleg(cataleg, uniqueEvidence, catErrors);
  report.incidencies.push(...catErrors);
  const incoming = new Map(docs.map(d => [d.cami, new Set()])), resolve = resolver(docs);
  const controls = new Set(Array.isArray(referenciesControl) ? referenciesControl : []);
  const controlFonts = new Map(), controlKeys = new Map(), possibleControl = new Set();
  const control = (cami, font, ambigu = false) => {
    if (ambigu) possibleControl.add(cami); else controls.add(cami);
    const list = controlFonts.get(cami) ?? [];
    const key = JSON.stringify(font);
    const keys = controlKeys.get(cami) ?? new Set();
    if (!keys.has(key)) { list.push(font); keys.add(key); }
    controlKeys.set(cami, keys);
    controlFonts.set(cami, list);
  };
  for (const trace of Array.isArray(tracesControl) ? tracesControl : []) {
    if (!objecte(trace) || typeof trace.cami !== 'string' || typeof trace.font !== 'string'
        || !Number.isSafeInteger(trace.linia) || trace.linia < 1) { report.incidencies.push('Traça de control invàlida'); continue; }
    control(trace.cami, { font: trace.font, linia: trace.linia, tipus: trace.tipus === 'literal_test' ? 'literal_test' : 'literal_codi', executat: false, ambigu: trace.ambigu === true }, trace.ambigu === true);
  }
  for (const entry of policy.entrypoints) controls.add(entry);
  controls.add(`${WIKI}/00_index.md`); controls.add('.agents/skills/00_INDEX_SKILLS.md');
  controls.add('AGENTS.md'); controls.add('.agents/AGENTS.md');
  const brain = uniqueEvidence.find(e => e.path === '.agents/cervell.json');
  const protocol = uniqueEvidence.find(e => e.path === '.agents/protocolledge.json');
  for (const registry of [brain, protocol].filter(Boolean)) {
    try {
      const values = [], parsed = JSON.parse(registry.text);
      if (!objecte(parsed)) throw new Error('Registre no objecte');
      const visit = value => {
        if (typeof value === 'string') values.push(value);
        else if (Array.isArray(value)) value.forEach(visit);
        else if (objecte(value)) Object.values(value).forEach(visit);
      };
      visit(parsed);
      const strings = new Set(values), line = lineIndex(registry.text);
      for (const doc of docs) {
        const skillId = esSkill(doc) ? path.posix.basename(path.posix.dirname(doc.cami)) : null;
        const value = strings.has(doc.cami) ? doc.cami
          : registry === brain && skillId && strings.has(skillId) ? skillId : null;
        if (value !== null) control(doc.cami, { font: registry.path, linia: line(Math.max(0, registry.text.indexOf(JSON.stringify(value)))), tipus: 'registre_json', executat: false });
      }
    } catch { report.incidencies.push(registry.path + ' no interpretable'); }
  }
  for (const doc of docs) {
    for (const link of extreuVincles(doc.fm.body)) {
      const result = resolve(link, doc);
      if (result.state === 'resolved' && result.doc.cami !== doc.cami) incoming.get(result.doc.cami).add(doc.cami);
      if (result.state === 'unknown') {
        for (const candidate of result.candidates ?? []) possibleInbound.add(candidate.cami);
        add('UNKNOWN', doc, link.linia + doc.fm.offset, result.reason, { desti: link.target.slice(0, 240) }, 'unknown');
      }
    }
    if ((ZONES_ELEFANT.test(doc.cami) || esSkill(doc)) && doc.bytes > policy.elefantBytes) {
      add('ELEFANT', doc, 1, 'Document de coneixement per damunt de 25 KB: revisar estructura, sense fragmentar automàticament', { bytes: doc.bytes, llindarBytes: policy.elefantBytes });
    }
    const status = doc.fm.data.status ?? doc.fm.data.estat;
    const exclouEdat = historic(doc.cami) || doc.fm.data.type === 'acta' || doc.fm.data.tipus === 'acta' || status === 'arxivat';
    if (!exclouEdat && status === 'esborrany' && !doc.fm.errors.length) {
      const keys = ['status_since', 'data_esborrany', 'created', 'creat', 'date', 'data', 'updated', 'revisat'];
      const key = keys.find(k => Object.hasOwn(doc.fm.data, k));
      const name = /^(\d{2})(\d{2})(\d{2})_/u.exec(path.posix.basename(doc.cami));
      const value = key ? doc.fm.data[key] : name ? `20${name[1]}-${name[2]}-${name[3]}` : undefined;
      const date = dataUTC(value);
      const actualStatus = key === 'status_since' || key === 'data_esborrany';
      if (date === null || date > today) add('UNKNOWN', doc, 1, 'Edat d’esborrany no acreditada: data absent, invàlida o futura', { font: key ?? (name ? 'nom_fitxer' : 'absent'), valor: value ?? null }, 'unknown');
      else if ((today - date) / 86_400_000 > policy.draftDies) add('DRAFT_ANTIC', doc, 1,
        actualStatus ? 'Esborrany amb font externa d’inici d’estatus anterior al llindar: revisar' : 'Esborrany en document antic: revisar; no acredita durada de l’estatus',
        { dies: (today - date) / 86_400_000, llindarDies: policy.draftDies, font: key ?? 'nom_fitxer', precisio: actualStatus ? 'estatus_aportat_no_camp_canonic' : 'edat_document_proxy', data: value });
    }
    if (historic(doc.cami) || doc.fm.data.type === 'acta' || doc.fm.data.tipus === 'acta' || doc.fm.data.status === 'arxivat') continue;
    const covered = [];
    for (const claim of claims) for (const match of doc.claimText.matchAll(claim.regex)) {
      // El context pot contindre un path inline literal; el valor executiu ha de
      // continuar fora d’un exemple inline. Les dos cadenes conserven offsets UTF-16.
      const valueStart = match.index + claim.prefixLength;
      if (doc.live.slice(valueStart, valueStart + match[1].length) !== match[1]) continue;
      const valueEnd = valueStart + match[1].length, next = doc.claimText[valueEnd] ?? '', afterNext = doc.claimText[valueEnd + 1] ?? '';
      const continued = /[\p{L}\p{N}_:+/-]/u.test(next)
        || (next === '.' && /[\p{L}\p{N}_]/u.test(afterNext)) || (next === ',' && /\p{N}/u.test(afterNext));
      const lineEnd = doc.claimText.indexOf('\n', valueEnd);
      const modelTail = claim.kind === 'model' && claim.suffixLength === 0
        && /[\p{L}\p{N}_:+/-]/u.test(doc.claimText.slice(valueEnd, lineEnd < 0 ? undefined : lineEnd));
      if (continued || modelTail) {
        add('UNKNOWN', doc, doc.fm.offset + doc.line(match.index),
          'Valor fora de la gramàtica completa: no comparar ni deduir un prefix truncat',
          { claim: claim.id, tipus: claim.kind, font: claim.sourceId, motiu: 'captura_lexica_no_completa' }, 'unknown');
        continue;
      }
      covered.push([match.index, match.index + match[0].length]);
      const value = match[1], normal = v => (claim.kind === 'version' ? v.replace(/^[vV]/u, '') : v).normalize('NFC');
      if (!claim.verified) add('UNKNOWN', doc, doc.fm.offset + doc.line(match.index),
        'Font del catàleg absent/divergent: no qualificar caducitat', { claim: claim.id, font: claim.sourceId, valor: value }, 'unknown');
      else if (!claim.current.some(v => normal(v) === normal(value))) add('CLAIM_DIVERGENT', doc, doc.fm.offset + doc.line(match.index),
        'Claim contextual divergent del catàleg: revisió humana, no substitució automàtica', { claim: claim.id, tipus: claim.kind, valor: value, vigents: claim.current, font: claim.sourceId });
    }
    const mentions = /\bv?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?\b|\b\d+\s+(?:skills?|proves?|tests?|fitxers?|models?)\b|\b(?:GPT|Claude|Gemini|Qwen|Llama|DeepSeek)(?:[- ][A-Za-z0-9][A-Za-z0-9_.-]{0,50})?/giu;
    for (const m of doc.live.matchAll(mentions)) if (!covered.some(([start, end]) => m.index >= start && m.index < end)) {
      add('UNKNOWN', doc, doc.fm.offset + doc.line(m.index),
        'Menció sense claim contextual acreditat; no implica versió, xifra o model caducat', { mencio: m[0].slice(0, 120) }, 'unknown');
    }
  }
  const groups = new Map();
  for (const doc of docs) {
    if (historic(doc.cami)) continue;
    const texts = [doc.fm.body.trim().replace(/\s+/gu, ' '), ...doc.fm.body.split(/\n\s*\n/u).map(p => p.trim().replace(/\s+/gu, ' '))];
    for (const [i, text] of texts.entries()) {
      if (text.length < (i === 0 ? 80 : policy.paragrafDuplicatMin)) continue;
      const key = hash(text.normalize('NFC')), group = groups.get(key) ?? new Map(); group.set(doc.cami, doc); groups.set(key, group);
    }
  }
  const duplicatePairs = new Set();
  duplicates: for (const [digest, group] of groups) {
    const all = [...group.values()], wiki = all.filter(d => d.cami.startsWith(`${WIKI}/`)), skills = all.filter(esSkill);
    for (const skill of skills) for (const doc of wiki) {
      const pair = `${skill.cami}\0${doc.cami}`;
      if (duplicatePairs.has(pair)) continue; duplicatePairs.add(pair);
      add('DUPLICAT_WIKI_SKILL', skill, 1, 'Cos/paràgraf normalitzat repetit en Wiki i skill: revisar frontera AGENTS §1', { relacionat: doc.cami, sha256Normalitzat: digest, fontPolitica: 'AGENTS.md §1', limit: 'Pot ser citació legítima; no és una classificació semàntica de filosofia/procediment' });
      if (report.findings.length >= POLITICA.maxFindings) { report.incidencies.push('Límit findings assolit'); break duplicates; }
    }
    for (let i = 0; i < skills.length; i++) for (let k = i + 1; k < skills.length; k++) {
      const [first, second] = [skills[i], skills[k]].sort((a, b) => cmp(a.cami, b.cami));
      if (first.cami === second.cami) continue;
      const pair = first.cami + '\0' + second.cami;
      if (duplicatePairs.has(pair)) continue;
      duplicatePairs.add(pair);
      add('DUPLICAT_SKILL_SKILL', first, 1, 'Cos/paràgraf normalitzat repetit entre skills: revisió humana de la font única',
        { relacionat: second.cami, sha256Normalitzat: digest, fontPolitica: 'AGENTS.md §1', limit: 'Pot ser citació legítima; ni duplicació semàntica ni autorització de poda' });
      if (report.findings.length >= POLITICA.maxFindings) { report.incidencies.push('Límit findings assolit'); break duplicates; }
    }
  }
  for (const doc of docs) if (incoming.get(doc.cami).size === 0) {
    const metadata = { incomingMarkdown: 0, controlRef: controls.has(doc.cami), possibleAmbiguousInbound: possibleInbound.has(doc.cami), possibleAmbiguousControl: possibleControl.has(doc.cami),
      controlFonts: (controlFonts.get(doc.cami) ?? []).sort((a, b) => cmp(a.font, b.font) || a.linia - b.linia || cmp(a.tipus, b.tipus)) };
    if (metadata.controlRef || metadata.possibleAmbiguousInbound || metadata.possibleAmbiguousControl) add('UNKNOWN', doc, 1,
      'Zero entrades Markdown resoltes, però és entrypoint/referència de control o possible destí ambigu: no declarar procediment sense ús', metadata, 'unknown');
    else add('ORFE', doc, 1, 'Candidat amb zero fonts Markdown entrants en l’abast: revisar àncores, no podar', metadata);
  }
  report.findings.sort((a, b) => cmp(a.cami, b.cami) || a.linia - b.linia || cmp(a.regla, b.regla) || cmp(a.id, b.id));
  for (const item of report.findings) { report.resum.total++; report.resum[item.nivell]++; report.resum.perRegla[item.regla]++; }
  report.complet = report.incidencies.length === 0;
  report.estat = !report.complet ? 'INCOMPLET' : report.findings.length ? 'REVISIO' : 'SENSE_TROBALLES';
  report.cobertura = { documents: docs.length, bytesUTF8: docs.reduce((s, d) => s + d.bytes, 0),
    skillsLocals: docs.filter(d => esSkill(d) && d.origen !== 'externa').length, skillsExternes: docs.filter(d => d.origen === 'externa').length,
    catalegClaims: claims.length, registreCervellDisponible: Boolean(brain), registreProtocolledgeDisponible: Boolean(protocol),
    controlLiteral: coberturaControl, arestesResoltes: [...incoming.values()].reduce((sum, sources) => sum + sources.size, 0),
    orfes: 'incoming Markdown de fonts úniques; controlrefs coneguts separats', politica: policy };
  return report;
}

function readRegularBytes(file, max = POLITICA.maxFitxerBytes, before = fs.lstatSync(file)) {
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || before.size > max) throw new Error('Fitxer no regular, hardlink o límit excedit');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1 || opened.size > max || opened.size !== before.size
        || opened.ino !== before.ino || opened.dev !== before.dev
        || opened.mtimeMs !== before.mtimeMs || opened.ctimeMs !== before.ctimeMs) throw new Error('Fitxer canviat en obrir');
    // Una sola assignació acotada. El byte addicional detecta creixement, encara
    // que el productor continue afegint dades: mai readFileSync(fd) sense límit.
    const ceiling = Math.min(max + 1, before.size + 1), raw = Buffer.allocUnsafe(ceiling);
    let total = 0;
    while (total < ceiling) {
      const count = fs.readSync(fd, raw, total, Math.min(65_536, ceiling - total), null);
      if (count === 0) break;
      total += count;
    }
    const after = fs.fstatSync(fd);
    if (!after.isFile() || after.nlink !== 1 || total > max || total !== before.size || after.size !== before.size
        || after.mtimeMs !== opened.mtimeMs || after.ctimeMs !== opened.ctimeMs) throw new Error('Fitxer canviat durant lectura');
    return raw.subarray(0, total);
  } finally { fs.closeSync(fd); }
}

function readRegular(file, max = POLITICA.maxFitxerBytes) {
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(readRegularBytes(file, max));
}

function safePathInfo(root, relative) {
  const normalized = normalitzaCami(relative);
  let cursor = root, st;
  for (const part of normalized.split('/')) {
    if (arxivat(part) || part === '.env' || part.startsWith('.env.')) throw new Error('Arxiu/secret exclòs');
    cursor = path.join(cursor, part);
    st = fs.lstatSync(cursor);
    if (st.isSymbolicLink()) throw new Error('Enllaç simbòlic no seguit');
  }
  return { file: cursor, stat: st };
}

function safePath(root, relative) { return safePathInfo(root, relative).file; }

function explicitPath(file) {
  const full = path.resolve(file), parts = full.slice(path.parse(full).root.length).split(path.sep);
  return safePath(path.parse(full).root, parts.join('/'));
}
function readExplicit(file, max) { return readRegular(explicitPath(file), max); }


/** Lèxic delimitat: literals complets sense escapes/interpolació ni comentaris.
 * Una menció literal, inclosa una fixture, no prova que cap consumidor l'execute.
 */
export function extreuLiteralsControl(text, extension = '.js') {
  const values = [], hashComment = ['.py', '.sh'].includes(extension), sql = extension === '.sql';
  let line = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\n') { line++; continue; }
    if ((c === '/' && text[i + 1] === '/') || (hashComment && c === '#') || (sql && c === '-' && text[i + 1] === '-')) {
      while (i < text.length && text[i] !== '\n') i++;
      if (i < text.length) line++;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) { if (text[i] === '\n') line++; i++; }
      i++; continue;
    }
    if (c !== "'" && c !== '"' && c.charCodeAt(0) !== 96) continue;
    const startLine = line;
    let value = '', opaque = false, closed = false;
    for (i++; i < text.length; i++) {
      const char = text[i];
      if (char === c) { closed = true; break; }
      if (char === '\n') line++;
      if (char === '\\') { opaque = true; if (text[i + 1] === '\n') line++; i++; continue; }
      if (value.length < 4096) value += char; else opaque = true;
    }
    if (closed && !opaque && !value.includes('$' + '{') && /\.md$/iu.test(value) && !/[\p{Cc}\p{Cf}\p{Cs}]/u.test(value)) {
      if (values.length >= POLITICA.maxFontsControl) throw new Error('Límit literals de control');
      values.push({ valor: value.normalize('NFC'), linia: startLine });
    }
  }
  return values;
}

const ARRELS_CONTROL = Object.freeze(['src', 'tooling', 'tests', 'scripts']);
const EXTENSIONS_CONTROL = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.py', '.sh', '.php', '.sql', '.json']);
const secretControl = name => /^\.env(?:\.|$)/iu.test(name)
  || /(?:^|[._-])(?:secrets?|credentials?|service[-_]?account|private[-_]?keys?)(?:[._-]|$)/iu.test(name);
/** Adaptador IO read-only. No crea carpetes, caches, rebuts o locks. */
export function lligSnapshot({ arrel, cataleg, skillsExternes = [] } = {}) {
  const documents = [], evidencies = [], incidencies = [], exclosos = [];
  let root, total = 0;
  try {
    if (typeof arrel !== 'string' || arrel.split(path.sep).some(arxivat)) throw new Error('Arrel invàlida/arxivada');
    root = fs.realpathSync(arrel);
    if (root.split(path.sep).some(arxivat)) throw new Error('Arrel resolta arxivada');
  } catch (e) { return { documents, evidencies, incidencies: [e.message], exclosos }; }
  const walk = relative => {
    let directory;
    try { directory = safePath(root, relative); if (!fs.lstatSync(directory).isDirectory()) throw new Error('Arrel no directori'); }
    catch (error) { incidencies.push(`${relative}: ${error.message}`); return; }
    let entries;
    try { entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => cmp(a.name, b.name)); }
    catch (error) { incidencies.push(`${relative}: ${error.message}`); return; }
    for (const entry of entries) {
      const rel = `${relative}/${entry.name}`;
      if (arxivat(entry.name) || protegit(rel) || SKIP.has(entry.name) || (entry.isDirectory() && entry.name.startsWith('.'))) { exclosos.push(rel); continue; }
      if (entry.isSymbolicLink()) { incidencies.push(`${rel}: symlink no seguit`); continue; }
      if (entry.isDirectory()) { walk(rel); continue; }
      if (!/\.md$/iu.test(entry.name)) continue;
      try {
        if (documents.length >= POLITICA.maxDocuments) throw new Error('Límit documents');
        if (total + fs.lstatSync(path.join(directory, entry.name)).size > POLITICA.maxTotalBytes) throw new Error('Límit bytes totals');
        const text = readRegular(path.join(directory, entry.name)); total += Buffer.byteLength(text);
        if (total > POLITICA.maxTotalBytes) throw new Error('Límit bytes totals');
        documents.push({ cami: rel, text });
      } catch (error) { incidencies.push(`${rel}: ${error.message}`); }
    }
  };
  walk(WIKI); walk('.agents/skills');
  const externalIds = new Set();
  const externalFiles = Array.isArray(skillsExternes) && skillsExternes.length <= 16 ? skillsExternes : [];
  if (externalFiles !== skillsExternes) incidencies.push('Skills externes: cal array de màxim16fitxers');
  for (const [i, file] of externalFiles.entries()) {
    try {
      const full = explicitPath(file), identity = fs.realpathSync(full);
      if (externalIds.has(identity)) throw new Error('Skill externa duplicada');
      const text = readRegular(full, POLITICA.maxFitxerBytes); externalIds.add(identity); total += Buffer.byteLength(text);
      if (total > POLITICA.maxTotalBytes) throw new Error('Límit bytes totals');
      const id = path.basename(path.dirname(path.resolve(file)));
      documents.push({ cami: `externes/${i + 1}-${id}/SKILL.md`, text, origen: 'externa' });
    } catch (e) { incidencies.push(`Skill externa ${i + 1}: ${e.message}`); }
  }
  const paths = new Set(['.agents/cervell.json', '.agents/protocolledge.json', ...(Array.isArray(cataleg?.sources) ? cataleg.sources.map(s => s.path) : [])]);
  for (const relative of paths) {
    if (typeof relative !== 'string') { incidencies.push('Font de catàleg sense path'); continue; }
    try {
      if (!/\.(?:md|json|yaml|yml)$/iu.test(relative)) throw new Error('Font no documental');
      evidencies.push({ path: relative, text: readRegular(safePath(root, relative)) });
    } catch (e) {
      if (['.agents/cervell.json', '.agents/protocolledge.json'].includes(relative) && e.code === 'ENOENT' && !(cataleg?.sources ?? []).some(s => s.path === relative)) continue;
      incidencies.push(`${relative}: ${e.message}`);
    }
  }
  const referenciesControl = new Set(), tracesControl = [], byPath = new Map(), byBase = new Map();
  let controlAturat = false;
  const coberturaControl = { arrels: [...ARRELS_CONTROL], arrelsAbsents: [],
    extensions: [...EXTENSIONS_CONTROL].sort(cmp), maxFitxerBytes: POLITICA.maxFitxerBytes,
    fonts: 0, fontsAmbLiteralMarkdown: 0, bytesUTF8: 0, literalsResolts: 0,
    literalsAmbigus: 0, maxFonts: POLITICA.maxFontsControl, maxBytesControl: POLITICA.maxControlBytes,
    maxBytesDocuments: POLITICA.maxTotalBytes, aturat: false,
    executat: false, abast: 'literals complets en fonts locals; no ús runtime ni clausura dinàmica' };
  for (const doc of documents) {
    if (doc.origen === 'externa') continue;
    const key = doc.cami.normalize('NFC'); byPath.set(key, doc);
    const name = path.posix.basename(key), list = byBase.get(name) ?? [];
    list.push(doc); byBase.set(name, list);
  }
  const walkControl = relative => {
    if (controlAturat) return;
    let directory, entries;
    try {
      directory = safePath(root, relative);
      if (!fs.lstatSync(directory).isDirectory()) throw new Error('Arrel de control no directori');
      entries = fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => cmp(a.name, b.name));
    } catch (error) {
      if (ARRELS_CONTROL.includes(relative) && error.code === 'ENOENT') { coberturaControl.arrelsAbsents.push(relative); return; }
      incidencies.push(relative + ': ' + error.message); return;
    }
    for (const entry of entries) {
      if (controlAturat) return;
      const rel = relative + '/' + entry.name;
      if (arxivat(entry.name) || protegit(rel) || SKIP.has(entry.name) || secretControl(entry.name)
          || (entry.isDirectory() && entry.name.startsWith('.'))) { exclosos.push(rel); continue; }
      if (entry.isSymbolicLink()) { incidencies.push(rel + ': symlink de control no seguit'); continue; }
      if (entry.isDirectory()) { walkControl(rel); continue; }
      const extension = path.posix.extname(entry.name).toLowerCase();
      if (!EXTENSIONS_CONTROL.has(extension)) continue;
      try {
        if (coberturaControl.fonts >= POLITICA.maxFontsControl) {
          controlAturat = true; coberturaControl.aturat = true;
          incidencies.push('Límit global de fonts de control; escaneig aturat'); return;
        }
        // Keep all parent checks. Reuse only the exact leaf lstat as before:
        // open/fstat still compare its inode, dev, size, times and nlink.
        const { file, stat: before } = safePathInfo(root, rel);
        if (coberturaControl.bytesUTF8 + before.size > POLITICA.maxControlBytes) {
          controlAturat = true; coberturaControl.aturat = true;
          incidencies.push('Límit global de bytes de control; escaneig aturat'); return;
        }
        const raw = readRegularBytes(file, POLITICA.maxFitxerBytes, before);
        if (!isUtf8(raw)) throw new Error('UTF-8 invàlid en font de control');
        const bytes = raw.length;
        coberturaControl.fonts++; coberturaControl.bytesUTF8 += bytes;
        // Native prefilter avoids a JS character walk over every code file.
        // Four ASCII case variants retain the documented case-insensitive extension.
        if (!raw.includes('.md') && !raw.includes('.mD') && !raw.includes('.Md') && !raw.includes('.MD')) continue;
        coberturaControl.fontsAmbLiteralMarkdown++;
        const text = raw.toString('utf8');
        for (const literal of extreuLiteralsControl(text, extension)) {
          const possible = new Map();
          for (const value of [literal.valor, path.posix.normalize(path.posix.join(path.posix.dirname(rel), literal.valor))]) {
            const doc = byPath.get(value); if (doc) possible.set(doc.cami, doc);
          }
          if (possible.size === 0 && !literal.valor.includes('/')) for (const doc of byBase.get(literal.valor) ?? []) possible.set(doc.cami, doc);
          if (possible.size === 0) continue;
          const ambigu = possible.size > 1;
          if (ambigu) coberturaControl.literalsAmbigus++; else coberturaControl.literalsResolts++;
          for (const cami of [...possible.keys()].sort(cmp)) {
            if (tracesControl.length >= POLITICA.maxFontsControl) throw new Error('Límit traces literals de control');
            if (!ambigu) referenciesControl.add(cami);
            tracesControl.push({ cami, font: rel, linia: literal.linia, tipus: /(?:^|\/)(?:tests|fixtures)(?:\/|$)|\.(?:test|spec)\./u.test(rel) ? 'literal_test' : 'literal_codi', executat: false, ambigu });
          }
        }
      } catch (error) { incidencies.push(rel + ': ' + error.message); }
    }
  };
  for (const relative of ARRELS_CONTROL) walkControl(relative);
  tracesControl.sort((a, b) => cmp(a.cami, b.cami) || cmp(a.font, b.font) || a.linia - b.linia);
  return { documents, evidencies, incidencies, exclosos,
    referenciesControl: [...referenciesControl].sort(cmp), tracesControl, coberturaControl };
}

export function main(argv = process.argv.slice(2), io = { stdout: process.stdout }) {
  try {
    let arrel, ara = new Date().toISOString().slice(0, 10), catalegFile;
    const skillsExternes = [];
    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === '--sense-ia' || arg === '--json') continue;
      if (arg === '--format' && argv[i + 1] === 'json') { i++; continue; }
      if (['--arrel', '--ara', '--data', '--cataleg', '--skill-externa'].includes(arg) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
        const value = argv[++i];
        if (arg === '--arrel') arrel = value;
        else if (arg === '--cataleg') catalegFile = value;
        else if (arg === '--skill-externa') skillsExternes.push(value);
        else ara = value;
      } else throw new Error('Ús: --arrel DIR --sense-ia --json [--ara ISO|--data YYYY-MM-DD] [--cataleg JSON] [--skill-externa FILE]');
    }
    if (!arrel || dataUTC(ara) === null) throw new Error('Cal --arrel i data real reproduïble');
    const cataleg = catalegFile ? JSON.parse(readExplicit(catalegFile, 2 * 1024 * 1024)) : undefined;
    const snapshot = lligSnapshot({ arrel, cataleg, skillsExternes });
    const report = analitzaSalut({ ...snapshot, ara, cataleg });
    report.cobertura.exclosos = snapshot.exclosos;
    io.stdout.write(JSON.stringify(report) + '\n');
    return report.complet ? 0 : 2;
  } catch (error) {
    const report = emptyReport(null, [error.message]); report.complet = false; report.estat = 'INCOMPLET';
    io.stdout.write(JSON.stringify(report) + '\n'); return 2;
  }
}

let isMain = false;
try { isMain = Boolean(process.argv[1]) && fs.realpathSync(fileURLToPath(import.meta.url)) === fs.realpathSync(process.argv[1]); } catch { /* import pur */ }
if (isMain) process.exitCode = main();
