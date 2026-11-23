#!/usr/bin/env node
/** Índex privat i determinista per a agents. L0 orienta, L1 referencia
 * estructura/decisions declarades i L2 continua sent l'original immutable.
 * No és un exportador públic, no seguix links i no executa cap model/xarxa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CAMINS } from '../lib/arrel.mjs';
import { documentCorpus, isDocumentArchive, operationalDocumentText } from '../lib/document-corpus.mjs';
import { parseFrontmatter } from '../wiki/lib/frontmatter.mjs';
import { liveMarkdown } from '../wiki/core/parse.mjs';
import { confinedFile } from '../wiki/lib/publication-policy.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ordre = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const ROOT_NOTES = new Set(['AGENTS.md', 'CLAUDE.md', 'README.md', 'INTEGRACIO.md', 'VEINS.md']);
function rutaSegura(rel) {
  if (typeof rel !== 'string' || path.posix.isAbsolute(rel) || rel.includes('\\')
    || /[\u0000-\u001f\u007f\u2028\u2029]/.test(rel) || path.posix.normalize(rel) !== rel
    || rel.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('Ruta de document invàlida.');
  return rel;
}
function rutaElegible(rel) {
  rutaSegura(rel);
  return /\.md$/i.test(rel) && !isDocumentArchive(rel)
    && (rel.startsWith(`${CAMINS.wiki}/`) || rel.startsWith('.agents/') || ROOT_NOTES.has(rel))
    && !rel.split('/').some(p => p.startsWith('.quarantena') || p === 'node_modules');
}
const dades = (text, rel) => {
  const parsed = parseFrontmatter(text);
  if (parsed.malformed || parsed.errors.length || parsed.duplicateKeys.length) throw new Error(`Metadades no llegibles: ${rel}`);
  return parsed;
};

/** API en memòria: permet afegir un original privat omés d'una còpia sense
 * copiar-ne L2 a disc. El Mestre és un document viu elegible com els altres.
 * Un Map no concedeix publicació ni amplia l'abast a runtime/arxiu. */
export function seleccionaDocuments(texts) {
  if (!(texts instanceof Map)) throw new TypeError('Cal un Map de ruta relativa a text.');
  const selected = [];
  for (const [rel, text] of texts) {
    if (rel === '.agents/AGENTS.md' && texts.has('AGENTS.md')) continue;
    if (!rutaElegible(rel)) continue;
    if (typeof text !== 'string') throw new TypeError(`Font no textual: ${rel}`);
    const parsed = dades(text, rel);
    if (['arxivat', 'quarantena', 'generat'].includes(parsed.data.status)) continue;
    selected.push([rel, text]);
  }
  return new Map(selected.sort(([a], [b]) => ordre(a, b)));
}

/* liveMarkdown és el parser compartit; preservem les línies dels comentaris
 * i literals abans de cridar-lo perquè cada referència continue apuntant a
 * la línia exacta de L2. Cada caràcter es visita un nombre acotat de vegades. */
function estructuraViva(body) {
  const out = body.split('');
  const mask = (a, b) => { for (let i = a; i < b; i++) if (out[i] !== '\n' && out[i] !== '\r') out[i] = ' '; };
  let offset = 0, fence = null, comment = null;
  for (const line of body.split(/(?<=\n)/)) {
    const m = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (!comment && (fence || m)) {
      if (!fence) fence = { char: m[1][0], length: m[1].length };
      else if (m && m[1][0] === fence.char && m[1].length >= fence.length && !line.slice(m[0].length).trim()) fence = null;
      mask(offset, offset + line.length); offset += line.length; continue;
    }
    for (let i = offset; i < offset + line.length;) {
      if (comment) {
        if (body.startsWith(comment, i)) { mask(i, i + comment.length); i += comment.length; comment = null; }
        else { mask(i, i + 1); i++; }
      } else if (body.startsWith('<!--', i)) { comment = '-->'; mask(i, i + 4); i += 4; }
      else if (body.startsWith('%%', i)) { comment = '%%'; mask(i, i + 2); i += 2; }
      else i++;
    }
    offset += line.length;
  }
  const ticks = [], next = new Map(), following = new Map();
  for (let i = 0; i < out.length;) {
    if (out[i] !== '`') { i++; continue; }
    const start = i; while (out[i] === '`') i++;
    ticks.push({ start, end: i, length: i - start });
  }
  for (let i = ticks.length - 1; i >= 0; i--) { following.set(i, next.get(ticks[i].length)); next.set(ticks[i].length, i); }
  for (let i = 0; i < ticks.length; i++) {
    const end = following.get(i);
    if (end !== undefined) { mask(ticks[i].start, ticks[end].end); i = end; }
  }
  return liveMarkdown(out.join(''));
}
const heading = line => {
  const match = /^ {0,3}(#{1,6})[\t ]+/.exec(line);
  if (!match) return null;
  let text = line.slice(match[0].length).trimEnd();
  const close = /[\t ]+#+$/.exec(text);
  if (close) text = text.slice(0, close.index).trimEnd();
  return { level: match[1].length, text };
};
const unaLinia = text => JSON.stringify(text).replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');

export function resumeixDocument(rel, text) {
  rutaSegura(rel);
  const metadata = dades(text, rel).data;
  const operational = operationalDocumentText(text, rel);
  const parsed = dades(operational, rel), body = parsed.body;
  const before = text.indexOf(operational) + operational.length - body.length;
  const lineOffset = text.slice(0, before).split('\n').length - 1;
  const original = body.replaceAll('\r\n', '\n').split('\n');
  const live = estructuraViva(body.replaceAll('\r\n', '\n')).split('\n');
  const headings = [], decisions = [];
  let section = null;
  for (let i = 0; i < live.length; i++) {
    const current = heading(live[i]);
    if (current) {
      const raw = heading(original[i] ?? '') ?? current;
      headings.push({ level: raw.level, text: raw.text, line: lineOffset + i + 1 });
      if (section && current.level <= section.level) section = null;
      if (/^(?:decisions|acords|decisions aprovades|acords aprovats)$/iu.test(current.text.trim())) section = { level: current.level, text: raw.text };
    } else if (section && live[i].trim()) {
      decisions.push({ section: section.text, line: lineOffset + i + 1, text: original[i] });
    }
  }
  const title = headings.find(h => h.level === 1)?.text ?? (typeof metadata.name === 'string' ? metadata.name : path.posix.basename(rel, '.md'));
  const description = typeof metadata.description === 'string' ? metadata.description : 'Sense descripció acreditada';
  const sourceSha256 = sha(text);
  return {
    l0: [rel, title, description, sourceSha256].map(unaLinia).join(' | '),
    l1: { path: rel, headings, decisions, l2: { path: rel, sha256: sourceSha256 } }
  };
}

export function generaResumL0L1(texts) {
  const selected = seleccionaDocuments(texts);
  const summaries = [...selected].map(([rel, text]) => resumeixDocument(rel, text));
  return { format: 'sdp.context.l0-l1/v1', visibility: 'private', selection: 'document-corpus/live/private/v1',
    corpusSha256: sha(JSON.stringify(summaries.map(x => [x.l1.path, x.l1.l2.sha256]))),
    l0: summaries.map(x => x.l0), l1: summaries.map(x => x.l1) };
}

/** Lectura confinada amb segona passada de hashes. El hook de verificació és
 * només per a provar una carrera de forma determinista; no canvia selecció. */
export function lligDocuments(root, { abansDeVerificar = () => {} } = {}) {
  const snapshot = new Map(), hashes = new Map();
  const files = documentCorpus(root).filter(rutaElegible);
  const read = rel => {
    const safe = confinedFile(root, path.join(root, rel));
    if (!safe) throw new Error(`Font no confinada: ${rel}`);
    const fd = fs.openSync(safe, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try { return fs.readFileSync(fd); } finally { fs.closeSync(fd); }
  };
  for (const rel of files) {
    const bytes = read(rel);
    // Fatal: un byte invàlid no es pot convertir en una altra preimatge L2.
    const text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    snapshot.set(rel, text); hashes.set(rel, sha(bytes));
  }
  abansDeVerificar();
  if (JSON.stringify(files) !== JSON.stringify(documentCorpus(root).filter(rutaElegible))) throw new Error('El corpus ha canviat durant la lectura.');
  for (const rel of files) if (hashes.get(rel) !== sha(read(rel))) throw new Error(`La font ha canviat durant la lectura: ${rel}`);
  return snapshot;
}

function destiPrivat(root, output) {
  const lexical = path.resolve(output), parent = fs.realpathSync(path.dirname(lexical));
  const full = path.join(parent, path.basename(lexical)), base = fs.realpathSync(root);
  const rel = path.relative(base, full).split(path.sep).join('/');
  const parts = rel.split('/');
  if (parts.some(p => ['public', 'src', 'tooling', 'scripts', 'tests', '.git', 'dist', 'build', 'android', 'ios', CAMINS.wiki, '.agents'].includes(p))
    || !full.endsWith('.json') || (fs.existsSync(full) && (fs.lstatSync(full).isSymbolicLink() || !fs.lstatSync(full).isFile()))) throw new Error('Destí privat invàlid.');
  return full;
}
export function cli(args = process.argv.slice(2)) {
  const options = new Map();
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--check') options.set(arg, true);
    else if (['--arrel', '--out'].includes(arg) && typeof args[i + 1] === 'string' && !args[i + 1].startsWith('--')) options.set(arg, args[++i]);
    else throw new Error('Arguments invàlids: --arrel ARREL --out FITXER.json [--check].');
  }
  if (!options.get('--out')) throw new Error('Cal un destí privat explícit --out.');
  const root = path.resolve(options.get('--arrel') ?? process.cwd());
  const out = destiPrivat(root, options.get('--out'));
  const result = generaResumL0L1(lligDocuments(root)), bytes = JSON.stringify(result, null, 2) + '\n';
  if (options.get('--check')) {
    const fd = fs.openSync(out, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try { if (fs.readFileSync(fd, 'utf8') !== bytes) throw new Error('Índex privat obsolet.'); } finally { fs.closeSync(fd); }
  } else {
    if (fs.existsSync(out)) {
      let existing;
      try { existing = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { throw new Error('Destí ocupat per un altre fitxer.'); }
      if (existing?.format !== 'sdp.context.l0-l1/v1' || existing.visibility !== 'private') throw new Error('Destí ocupat per un altre fitxer.');
    }
    const temporary = `${out}.tmp-${process.pid}`;
    try {
      fs.writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o600 });
      fs.renameSync(temporary, out);
    } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
  }
  return { documents: result.l0.length, corpusSha256: result.corpusSha256 };
}
const esEntrada = () => {
  try { return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); }
  catch { return false; }
};
if (esEntrada()) {
  try { console.log(JSON.stringify(cli())); }
  catch { console.error('No s’ha pogut verificar o generar l’índex privat; cap L2 reescrit.'); process.exitCode = 1; }
}
