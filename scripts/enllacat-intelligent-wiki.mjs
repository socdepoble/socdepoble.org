#!/usr/bin/env node
/**
 * Enllaçador intel·ligent i no destructiu per a la Wiki de Sóc de Poble.
 *
 * Eina consultiva de només lectura. La seua antiga escriptura directa no tenia
 * pla immutable, rebut del Reflex ni rollback transaccional i queda retirada.
 *
 * Ús:
 *   node scripts/enllacat-intelligent-wiki.mjs
 *   node scripts/enllacat-intelligent-wiki.mjs --file=00_SER_Brain_Identitat/00_BIOS.md
 *   --write  # BLOQUEJAT: només l'Autoneteja v2 pot mutar el vault
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from '../tooling/wiki/lib/frontmatter.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const DEFAULT_WIKI = path.join(PROJECT_ROOT, '_wiki_de_poble');
const args = parseArgs(process.argv.slice(2));
const WIKI_ROOT = path.resolve(args.root || DEFAULT_WIKI);

const PILAR_WEIGHT = new Map([
  ['00_SER_Brain_Identitat', 60],
  ['03_GOVERNAR_Normativa_Regles', 45],
  ['01_SABER_Cultura_Coneixement', 30],
  ['02_ACTUAR_Maquina_Tecnica', 25],
  ['05_Escriptori_Soc_de_Poble', 5],
  ['04_ARXIU_Documents_Historics', -100],
]);

const EXCLUDED_SEGMENTS = new Set([
  '.obsidian', '.git', 'node_modules', '_build', '_quarantena',
  '00_AGENTS_I_SKILLS_MIRROR', 'scripts_obsolets', 'skills_deprecades',
  'src_parallel_arch_deprecated',
]);

const STOP_ALIASES = new Set([
  'index', 'readme', 'document', 'documents', 'projecte', 'sistema', 'skill',
  'agents', 'acta', 'informe', 'script', 'scripts', 'notes', 'guia', 'manual',
]);

function parseArgs(argv) {
  const out = { write: false, json: false, includeArchive: false, maxLinks: 8 };
  for (const arg of argv) {
    if (arg === '--write') throw new Error('--write retirat: l’enllaçador és consultiu; qualsevol mutació ha de passar per pla+Reflex+rollback.');
    else if (arg === '--json') out.json = true;
    else if (arg === '--include-archive') out.includeArchive = true;
    else if (arg.startsWith('--root=')) out.root = arg.slice(7);
    else if (arg.startsWith('--file=')) out.file = arg.slice(7).replaceAll('\\', '/');
    else if (arg.startsWith('--max-links=')) out.maxLinks = Number(arg.slice(12));
    else throw new Error(`Argument desconegut: ${arg}`);
  }
  if (!Number.isInteger(out.maxLinks) || out.maxLinks < 1 || out.maxLinks > 30) {
    throw new Error('--max-links ha de ser un enter entre 1 i 30.');
  }
  return out;
}

async function walk(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (EXCLUDED_SEGMENTS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) found.push(full);
  }
  return found;
}

function relativeWikiPath(full) {
  return path.relative(WIKI_ROOT, full).split(path.sep).join('/');
}

function canonicalDocument(content, rel = '(desconegut)') {
  const parsed = parseFrontmatter(content);
  if (!parsed.hasFrontmatter || parsed.malformed || parsed.errors.length) {
    throw new Error(`${rel}: frontmatter absent o invàlid; l’enllaçador no improvisa metadades.`);
  }
  return {
    data: parsed.data,
    body: parsed.body,
    prefix: content.slice(0, content.length - parsed.body.length),
  };
}

function normaliseSpaces(value) {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function stripPrefixes(value) {
  return normaliseSpaces(value)
    .replace(/^\d{6}_\d{4}_[A-ZÀ-Ü]+_/, '')
    .replace(/^\d{1,2}_/, '')
    .replace(/^(DOC|ESTANDARD|PROTOCOL|ACTA|PETORRETA)\s+/i, '')
    .trim();
}

function validAlias(alias) {
  const clean = alias.trim();
  if (clean.length < 4 || clean.length > 80) return false;
  if (clean.split(/\s+/).length > 8) return false;
  if (STOP_ALIASES.has(clean.toLocaleLowerCase('ca'))) return false;
  return /[\p{L}\p{N}]/u.test(clean);
}

function aliasesFor(rel, content) {
  const { data, body } = canonicalDocument(content, rel);
  const stem = path.posix.basename(rel, '.md');
  const h1 = body.match(/^#\s+(.+)$/m)?.[1]
    ?.replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/[*_`]/g, '').trim();
  const candidates = new Set([
    stem,
    normaliseSpaces(stem),
    stripPrefixes(stem),
    h1,
    ...(Array.isArray(data.aliases) ? data.aliases : []),
  ].filter(Boolean));
  const expanded = new Set();
  for (const candidate of candidates) {
    expanded.add(candidate.trim());
    expanded.add(normaliseSpaces(candidate));
  }
  return [...expanded].filter(validAlias);
}

function importanceFor(rel, content) {
  const pilar = rel.split('/')[0];
  const stem = path.posix.basename(rel, '.md');
  const { data } = canonicalDocument(content, rel);
  let score = PILAR_WEIGHT.get(pilar) ?? 10;
  if (/^(00_|01_|02_)/.test(stem)) score += 18;
  if (/INDEX|BIOS|GENOTIP|TAULA_MESTRA|IDENTITAT/i.test(stem)) score += 25;
  if (data.status === 'canonic' || data.estat === 'canonic') score += 25;
  score -= rel.split('/').length * 2;
  return score;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sameBranchBonus(sourceRel, targetRel) {
  const a = sourceRel.split('/');
  const b = targetRel.split('/');
  let common = 0;
  while (a[common] && a[common] === b[common]) common++;
  return common * 20;
}

function buildDictionary(docs) {
  const byAlias = new Map();
  for (const doc of docs) {
    for (const alias of doc.aliases) {
      const key = alias.toLocaleLowerCase('ca');
      const entries = byAlias.get(key) || [];
      entries.push(doc);
      byAlias.set(key, entries);
    }
  }
  return [...byAlias.entries()]
    .map(([key, targets]) => ({ alias: targets.flatMap(d => d.aliases).find(a => a.toLocaleLowerCase('ca') === key), targets }))
    .filter(item => item.targets.length <= 4)
    .sort((a, b) => b.alias.length - a.alias.length);
}

function protectedRanges(body) {
  const ranges = [];
  const patterns = [
    /```[\s\S]*?```/g,
    /~~~[\s\S]*?~~~/g,
    /`[^`\r\n]+`/g,
    /!?(?:\[\[[^\]]+\]\]|\[[^\]]*\]\([^\r\n)]*\))/g,
    /<!--([\s\S]*?)-->/g,
    /^#{1,6}\s+.*$/gm,
    /^\s*\|.*\|\s*$/gm,
    /<[^>]+>/g,
    /https?:\/\/\S+/g,
  ];
  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges.sort((a, b) => a[0] - b[0]);
}

function isProtected(start, end, ranges) {
  return ranges.some(([a, b]) => start < b && end > a);
}

function chooseTarget(source, candidates) {
  const ranked = candidates
    .filter(candidate => candidate.rel !== source.rel)
    .map(candidate => ({ candidate, score: candidate.importance + sameBranchBonus(source.rel, candidate.rel) }))
    .sort((a, b) => b.score - a.score || a.candidate.rel.localeCompare(b.candidate.rel));
  if (!ranked.length) return null;
  if (ranked[1] && ranked[0].score === ranked[1].score) return null;
  return ranked[0].candidate;
}

function existingTargets(body) {
  const targets = new Set();
  for (const match of body.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    targets.add(match[1].replace(/\.md$/i, '').toLocaleLowerCase('ca'));
  }
  return targets;
}

function proposeLinks(source, dictionary) {
  const { prefix, body } = canonicalDocument(source.content, source.rel);
  const ranges = protectedRanges(body);
  const existing = existingTargets(body);
  const edits = [];
  const usedTargets = new Set(existing);

  for (const item of dictionary) {
    if (edits.length >= args.maxLinks) break;
    const target = chooseTarget(source, item.targets);
    if (!target) continue;
    const targetKey = target.link.toLocaleLowerCase('ca');
    const stemKey = path.posix.basename(target.link).toLocaleLowerCase('ca');
    if (usedTargets.has(targetKey) || usedTargets.has(stemKey)) continue;

    const regex = new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRegex(item.alias)})(?=$|[^\\p{L}\\p{N}_])`, 'giu');
    for (const match of body.matchAll(regex)) {
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      if (isProtected(start, end, ranges) || edits.some(edit => start < edit.end && end > edit.start)) continue;
      const label = match[2];
      const targetStem = path.posix.basename(target.link);
      const wikilink = label.toLocaleLowerCase('ca') === targetStem.toLocaleLowerCase('ca')
        ? `[[${target.link}]]`
        : `[[${target.link}|${label}]]`;
      edits.push({ start, end, wikilink, label, target: target.link });
      usedTargets.add(targetKey);
      break;
    }
  }

  edits.sort((a, b) => b.start - a.start);
  let linkedBody = body;
  for (const edit of edits) linkedBody = linkedBody.slice(0, edit.start) + edit.wikilink + linkedBody.slice(edit.end);
  return { content: prefix + linkedBody, edits: edits.reverse() };
}

async function main() {
  const files = await walk(WIKI_ROOT);
  const docs = [];
  for (const full of files) {
    const rel = relativeWikiPath(full);
    if (!args.includeArchive && rel.startsWith('04_ARXIU_Documents_Historics/')) continue;
    if (args.file && rel !== args.file) continue;
    const content = await readFile(full, 'utf8');
    docs.push({ full, rel, content, aliases: aliasesFor(rel, content), importance: importanceFor(rel, content), link: rel.slice(0, -3) });
  }

  // El diccionari usa tota la Wiki vigent, encara que --file limite els documents origen.
  const allDocs = [];
  for (const full of files) {
    const rel = relativeWikiPath(full);
    if (!args.includeArchive && rel.startsWith('04_ARXIU_Documents_Historics/')) continue;
    const content = await readFile(full, 'utf8');
    allDocs.push({ full, rel, content, aliases: aliasesFor(rel, content), importance: importanceFor(rel, content), link: rel.slice(0, -3) });
  }
  const dictionary = buildDictionary(allDocs);
  const report = [];

  for (const doc of docs) {
    const proposal = proposeLinks(doc, dictionary);
    if (!proposal.edits.length) continue;
    report.push({ file: doc.rel, links: proposal.edits.map(({ label, target }) => ({ label, target })) });
  }

  const totalLinks = report.reduce((sum, item) => sum + item.links.length, 0);
  const result = { mode: 'advisory-dry-run', wiki: WIKI_ROOT, changedFiles: report.length, insertedLinks: totalLinks, files: report };
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`[ENLLAÇADOR] ${result.mode}: ${report.length} fitxer(s), ${totalLinks} enllaç(os).`);
    for (const item of report) {
      console.log(`\n${item.file}`);
      for (const link of item.links) console.log(`  ${link.label} -> [[${link.target}]]`);
    }
    console.log('\nNo s’ha escrit res. Les propostes necessiten un pla canònic abans d’entrar al vault.');
  }
}

main().catch(error => {
  console.error(`[ERROR] ${error.message}`);
  process.exitCode = 1;
});
