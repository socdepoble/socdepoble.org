#!/usr/bin/env node
/**
 * contradiction_engine.mjs
 * Revisor determinista de cobertura, solapaments lèxics i contractes de ruta.
 * Usa similitud de Jaccard sobre shingles (n-grames de paraules).
 *
 * Canvis respecte a la versió anterior:
 * 1. Extensió .mjs explícita (l'original ja usava sintaxi ESM però amb
 *    extensió .js, ambigu en un projecte amb germans .cjs).
 * 2. El schema v2 no duplica la jurisdicció dins del YAML: la deriva del
 *    pilar físic (SER/SABER/ACTUAR/GOVERNAR). Dos documents semànticament
 *    pareguts en capes diferents es marquen, però no es proposen com a fusió.
 * 3. DRY_RUN ara fa alguna cosa: abans es declarava i mai es llegia
 *    (--force no tenia cap efecte real, era un altre interruptor fantasma
 *    igual que PERMITTED_DIRS). Ara, --force escriu una proposta a
 *    `.wiki-safety/reports/`, fora del vault, en compte de només imprimir.
 */
import path from 'node:path';
import { esMain } from '../lib/arrel.mjs';
import fs from 'node:fs/promises';
import { parseFrontmatter, serializeFrontmatter } from './lib/frontmatter.mjs';
import { validarFrontmatter } from './entropia_zero_router.mjs';
import { getTimestamp } from './lib/termodinamic.mjs';
import { normalitza } from './lib/text.mjs';
import { claimReceiptForMutation, completeMutationClaim } from './reflex_petorreta.mjs';
import { WIKI_DIR } from './lib/project_paths.mjs';

const ROOT = WIKI_DIR;
const UMBRAL_DUPLICAT = 0.62;
const FORCE = process.argv.includes('--force');
const RECEIPT_ARG = process.argv.find((arg) => arg.startsWith('--receipt='));
const RECEIPT = RECEIPT_ARG ? path.resolve(RECEIPT_ARG.slice('--receipt='.length)) : '';

const log = (msg) => console.log(`[CONTRADICTION] ${msg}`);

function shingles(text, n = 4) {
  const tokens = normalitza(text).split(/\s+/).filter(Boolean);
  const s = new Set();
  for (let i = 0; i <= tokens.length - n; i++) s.add(tokens.slice(i, i + n).join(' '));
  return s;
}


const JURISDICTIONS = new Map([
  ['00_SER_Brain_Identitat', 'principi'],
  ['01_SABER_Cultura_Coneixement', 'cultura'],
  ['02_ACTUAR_Maquina_Tecnica', 'implementacio'],
  ['03_GOVERNAR_Normativa_Regles', 'requisit'],
]);

const EXCLUDED_OPERATIONAL_PREFIXES = [
  '00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/',
  '00_SER_Brain_Identitat/Sollutia/',
  '03_GOVERNAR_Normativa_Regles/agents_actius/',
];


function parseManagedDocument(doc) {
  const parsed = parseFrontmatter(doc.content);
  if (!parsed.hasFrontmatter) {
    const reason = parsed.malformed ? 'frontmatter obert però no tancat' : 'frontmatter absent';
    throw new Error(`${doc.relPath}: ${reason}`);
  }
  if (parsed.errors.length) {
    throw new Error(`${doc.relPath}: YAML invàlid: ${parsed.errors.join('; ')}`);
  }
  const schemaErrors = validarFrontmatter(parsed.data);
  if (schemaErrors.length) {
    throw new Error(`${doc.relPath}: schema v2 invàlid: ${schemaErrors.join(' ')}`);
  }
  return parsed;
}

function stripComments(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/%%[\s\S]*?%%/g, '').trim();
}

/**
 * T11: audita un tall de lectura. Una coincidència de shingles és un candidat
 * de solapament; mai acredita una contradicció semàntica ni autoritza una fusió.
 * El registre de rutes permet demostrar col·lisions estructurals concretes.
 * La resta de contradiccions normatives requerixen evidència/revisió del text.
 */
const EXCLUSIONS = new Map([
  ['90_arxiu_historic', 'historical-archive'],
  ['01_produccio', 'protected-human-zone'],
  ['02_investigacio_ia', 'protected-research-zone'],
  ['node_modules', 'dependency'], ['.git', 'version-control'],
  ['.obsidian', 'editor-state'],
]);
const CURRENT_JURISDICTIONS = new Map([
  ['01_ser', 'identitat'], ['02_saber', 'coneixement'],
  ['03_actuar', 'procediments'], ['04_escriptori', 'treball_actiu'],
  ['05_social', 'social'], ['10_actes', 'evidencia'], ['10_metriques', 'metriques'],
]);
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const slash = value => value.split(path.sep).join('/');
const errorText = error => error.code || error.message;
const compareDocuments = (a, b) => cmp(a.ruta, b.ruta);

function similarity(A, B) {
  let intersection = 0;
  for (const token of A) if (B.has(token)) intersection++;
  return intersection / (A.size + B.size - intersection || 1);
}

async function collectCoherenceDocuments(wikiDir, projectDir, includeProject) {
  const docs = [], excluded = [], problems = [];
  const coverage = { wikiDocuments: 0, skillDocuments: 0, legacyDocuments: 0, protocolRoutes: 0,
    skillsWithReadContract: 0, skillsWithWriteContract: 0, skillReadReferences: 0, skillWriteTargets: 0 };
  const jurisdictions = new Map([...JURISDICTIONS, ...CURRENT_JURISDICTIONS]);
  const note = (ruta, reason) => excluded.push({ ruta, reason });
  const fail = (ruta, code, detail = '') => problems.push({ ruta, code, detail });
  let projectReadable = includeProject;
  if (includeProject) {
    try {
      const agents = await fs.lstat(path.join(projectDir, '.agents'));
      if (agents.isSymbolicLink() || !agents.isDirectory()) throw new Error('symlink-or-nondirectory');
    } catch (error) {
      projectReadable = false;
      note('.agents', 'project-state-not-followed');
      fail('.agents', 'project-state-unavailable', errorText(error));
    }
  }
  // cervell.json és el mapa vigent. Es manté el mapa legacy per a callers v2.
  if (projectReadable) {
    const mapPath = path.join(projectDir, '.agents/cervell.json');
    try {
      const mapStat = await fs.lstat(mapPath);
      if (mapStat.isSymbolicLink()) throw new Error('symlink');
      const brain = JSON.parse(await fs.readFile(mapPath, 'utf8'));
      for (const dimension of brain.dimensions || []) {
        if (typeof dimension.ruta !== 'string' || typeof dimension.id !== 'string') continue;
        const parts = dimension.ruta.split('/');
        if (parts.length === 2 && parts[0] === '_wiki_de_poble') jurisdictions.set(parts[1], dimension.id);
      }
    } catch (error) {
      // El mapa no era requisit del caller legacy; en mode projecte no s'amaga.
      fail('.agents/cervell.json', 'cognitive-map-unavailable', errorText(error));
    }
  }
  async function walk(root, relative = '', skills = false) {
    const absolute = path.join(root, relative);
    const display = `${skills ? '.agents/skills' : '_wiki_de_poble'}${relative ? '/' + slash(relative) : ''}`;
    let stat;
    try { stat = await fs.lstat(absolute); }
    catch (error) { fail(display, 'source-unavailable', errorText(error)); return; }
    if (stat.isSymbolicLink()) { note(display, 'symlink-not-followed'); fail(display, 'symlink-not-followed'); return; }
    if (stat.isDirectory()) {
      let entries;
      try { entries = (await fs.readdir(absolute)).sort(cmp); }
      catch (error) { fail(display, 'directory-unreadable', errorText(error)); return; }
      for (const name of entries) {
        const rel = path.join(relative, name), shown = `${skills ? '.agents/skills' : '_wiki_de_poble'}/${slash(rel)}`;
        const reason = EXCLUSIONS.get(name) || (name.startsWith('.') ? 'hidden-state' : null);
        if (reason) { note(shown, reason); continue; }
        await walk(root, rel, skills);
      }
      return;
    }
    if (!stat.isFile() || !relative.endsWith('.md') || (skills && path.basename(relative) !== 'SKILL.md')) return;
    if (stat.size > 2 * 1024 * 1024) { fail(display, 'document-too-large'); return; }
    let text;
    try { text = await fs.readFile(absolute, 'utf8'); }
    catch (error) { fail(display, 'document-unreadable', errorText(error)); return; }
    coverage[skills ? 'skillDocuments' : 'wikiDocuments']++;
    const top = slash(relative).split('/')[0];
    const legacy = !skills && JURISDICTIONS.has(top);
    const parsed = parseFrontmatter(text);
    if (!parsed.hasFrontmatter || parsed.errors.length) {
      fail(display, 'frontmatter-invalid', parsed.errors.join('; ') || 'frontmatter absent');
      return;
    }
    if (legacy) {
      try { parseManagedDocument({ relPath: relative, content: text }); }
      catch (error) { fail(display, 'legacy-schema-invalid', error.message); return; }
      coverage.legacyDocuments++;
      if (EXCLUDED_OPERATIONAL_PREFIXES.some(prefix => slash(relative).startsWith(prefix))) {
        note(display, 'legacy-operational-mirror'); return;
      }
    }
    const jurisdiction = skills ? 'skills' : (jurisdictions.get(top) || (relative.includes(path.sep) ? null : 'index'));
    if (!jurisdiction) { fail(display, 'unclassified-document'); return; }
    const evidence = ['treball_actiu', 'evidencia', 'metriques', 'social', 'index'].includes(jurisdiction);
    const body = stripComments(parsed.body);
    docs.push({ ruta: display, relative: slash(relative), jurisdiccio: jurisdiction, text: body,
      evidence, skill: skills, contract: skills ? parsed.data : null,
      shingles: evidence ? new Set() : shingles(body) });
  }
  await walk(wikiDir);
  if (projectReadable) await walk(path.join(projectDir, '.agents/skills'), '', true);
  docs.sort(compareDocuments);
  return { docs, coverage, excluded, problems, fail, projectReadable };
}

/** Inspect path names and metadata only; never read the referenced contents.
 * Write declarations may describe future files/directories. Existing parents
 * still need exact case and must not be symlinks. No glob expansion or URL
 * interpretation is implicit in a declared repository path.
 */
async function inspectDeclaredPath(projectDir, relative, { allowMissing = false } = {}) {
  if (typeof relative !== 'string' || !relative || relative.trim() !== relative
    || relative.includes('\0') || relative.includes('\\') || path.isAbsolute(relative)
    || /^[a-z][a-z0-9+.-]*:/i.test(relative) || /[*?[\]{}]/.test(relative)) throw new Error('invalid-repository-path');
  const rel = relative.replace(/\/$/, '');
  const parts = rel.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) throw new Error('invalid-repository-path');
  let cursor = projectDir;
  for (const part of parts) {
    const names = await fs.readdir(cursor);
    if (!names.includes(part)) {
      if (names.some(name => name.toLowerCase() === part.toLowerCase())) throw new Error('case-mismatch');
      if (allowMissing) return { exists: false };
      throw new Error('target-absent');
    }
    cursor = path.join(cursor, part);
    if ((await fs.lstat(cursor)).isSymbolicLink()) throw new Error('symlink-not-followed');
  }
  const stat = await fs.lstat(cursor);
  if (relative.endsWith('/') && !stat.isDirectory()) throw new Error('target-not-directory');
  if (!stat.isFile() && !stat.isDirectory()) throw new Error('target-not-file-or-directory');
  return { exists: true, isFile: stat.isFile() };
}

async function auditSkillContracts(projectDir, result) {
  for (const doc of result.docs.filter(item => item.skill)) {
    for (const [field, skillsCounter, referencesCounter, allowMissing] of [
      ['contracte.llig', 'skillsWithReadContract', 'skillReadReferences', false],
      ['contracte.escriu', 'skillsWithWriteContract', 'skillWriteTargets', true],
    ]) {
      if (!Object.hasOwn(doc.contract, field)) continue;
      result.coverage[skillsCounter]++;
      const references = doc.contract[field];
      if (!Array.isArray(references)) {
        result.fail(doc.ruta, 'skill-contract-invalid', `${field}: expected-array`);
        continue;
      }
      for (let index = 0; index < references.length; index++) {
        const reference = references[index];
        result.coverage[referencesCounter]++;
        try { await inspectDeclaredPath(projectDir, reference, { allowMissing }); }
        catch (error) {
          result.fail(doc.ruta, 'skill-contract-reference-invalid',
            `${field}[${index}]: ${JSON.stringify(reference)}: ${errorText(error)}`);
        }
      }
    }
  }
}

async function auditRoutes(projectDir, result) {
  const routePath = path.join(projectDir, '.agents/protocolledge.json');
  let registry;
  try {
    const stat = await fs.lstat(routePath);
    if (stat.isSymbolicLink()) throw new Error('symlink');
    registry = JSON.parse(await fs.readFile(routePath, 'utf8'));
    if (!Array.isArray(registry.rutes)) throw new Error('rutes no és array');
  } catch (error) {
    result.fail('.agents/protocolledge.json', 'routing-registry-unavailable', errorText(error));
    return [];
  }
  const contradictions = [], byId = new Map(), bySelector = new Map();
  for (const route of registry.rutes) {
    result.coverage.protocolRoutes++;
    const id = route?.id;
    if (typeof id !== 'string' || !id) { result.fail('.agents/protocolledge.json', 'route-id-invalid'); continue; }
    if (byId.has(id)) contradictions.push({ kind: 'duplicate-route-id', id,
      evidence: ['.agents/protocolledge.json'], detail: 'Dos contractes comparteixen identificador.' });
    byId.set(id, route);
    if (route.quan && typeof route.quan === 'object' && !Array.isArray(route.quan)) {
      const selector = JSON.stringify(Object.keys(route.quan).sort(cmp).map(key => [key, route.quan[key]]));
      const previous = bySelector.get(selector);
      if (previous && previous.id !== id && previous.plantilla !== route.plantilla) contradictions.push({
        kind: 'routing-contract-conflict', ids: [previous.id, id].sort(cmp), selector,
        evidence: ['.agents/protocolledge.json'], detail: 'El mateix selector té dues plantilles diferents.' });
      bySelector.set(selector, route);
    }
    for (const field of ['plantilla', 'skill']) {
      const rel = route[field];
      if (typeof rel !== 'string' || path.isAbsolute(rel) || rel.includes('\\') || rel.split('/').some(p => !p || p === '.' || p === '..')) {
        result.fail('.agents/protocolledge.json', 'route-path-invalid', `${id}.${field}`); continue;
      }
      try {
        if (!(await inspectDeclaredPath(projectDir, rel)).isFile) throw new Error('target-not-file');
      } catch (error) { result.fail(rel, 'route-target-unavailable', `${id}.${field}: ${errorText(error)}`); }
    }
  }
  return contradictions.sort((a, b) => cmp(JSON.stringify(a), JSON.stringify(b)));
}

export async function auditCoherence(wikiDir = ROOT, { projectDir = path.dirname(wikiDir), includeProject = true } = {}) {
  const result = await collectCoherenceDocuments(wikiDir, projectDir, includeProject);
  const candidates = result.docs.filter(doc => !doc.evidence && doc.text.length > 200);
  const overlaps = [];
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i], b = candidates[j], score = similarity(a.shingles, b.shingles);
      if (score < UMBRAL_DUPLICAT) continue;
      overlaps.push({ kind: 'lexical-overlap', s: score, a: a.ruta, b: b.ruta,
        marcaJurisdiccioDiferent: a.jurisdiccio !== b.jurisdiccio,
        jurA: a.jurisdiccio, jurB: b.jurisdiccio, action: 'review-scope-and-authority' });
    }
  }
  const contradictions = result.projectReadable ? await auditRoutes(projectDir, result) : [];
  if (result.projectReadable) await auditSkillContracts(projectDir, result);
  const coverage = { ...result.coverage, readDocuments: result.coverage.wikiDocuments + result.coverage.skillDocuments, parsedDocuments: result.docs.length, comparedDocuments: candidates.length };
  if (!coverage.comparedDocuments) result.fail('_wiki_de_poble', 'empty-comparison-corpus');
  const excluded = result.excluded.sort((a, b) => cmp(a.ruta, b.ruta) || cmp(a.reason, b.reason));
  const problems = result.problems.sort((a, b) => cmp(a.ruta, b.ruta) || cmp(a.code, b.code) || cmp(a.detail, b.detail));
  return { schema: 'sdp.coherence-audit.v1', complete: !problems.length, coverage, excluded, problems,
    overlaps, contradictions,
    limits: ['La similitud lèxica és un candidat de solapament, no una contradicció demostrada.',
      'Les contradiccions demostrades ací són col·lisions de contractes de ruta; no es certifica tota la semàntica normativa.',
      'Les referències de skill comprovades són les declaracions estructurades contracte.llig/escriu, no totes les ordres ni cites del cos; les destinacions futures no autoritzen escriptura.',
      'Documents de treball, actes i índexs es censen, però no s\'usen com a autoritat normativa per a proposar fusions.'] };
}

/** Caller v2: conserva forma de resultat i validació estricta de corpus legacy. */
export async function findDuplicates(wikiDir = ROOT) {
  const report = await auditCoherence(wikiDir, { includeProject: false });
  if (!report.complete) throw new Error(`Auditoria incompleta: ${report.problems.map(p => `${p.ruta}: ${p.code} ${p.detail}`).join('; ')}`);
  return report.overlaps.map(match => ({ s: match.s,
    a: match.a.replace(/^_wiki_de_poble\//, ''), b: match.b.replace(/^_wiki_de_poble\//, ''),
    marcaJurisdiccioDiferent: match.marcaJurisdiccioDiferent, jurA: match.jurA, jurB: match.jurB }));
}

async function escriureActaProposta(duplicatsReals) {
  const dest = path.join(path.dirname(ROOT), '.wiki-safety', 'reports');
  const ts = getTimestamp();
  const filename = `${ts}_ACTA_Proposta_Fusio_Contradiccions.md`;
  const target = path.join(dest, filename);
  const claim = await claimReceiptForMutation({
    receiptPath: RECEIPT,
    operation: 'contradiction-report',
    targets: [target],
    checkDirty: true,
  });
  await fs.mkdir(dest, { recursive: true });
  const frontmatter = serializeFrontmatter({
    status: 'arxivat',
    type: 'acta',
    description: 'Proposta automàtica de revisió de possibles solapaments lèxics; no acredita contradiccions.',
  }, ['status', 'type', 'description']);
  const lines = [
    frontmatter.trimEnd(),
    `# Proposta de revisió — candidats de solapament`,
    ``,
    ...duplicatsReals.map(d =>
      `- **${(d.s * 100).toFixed(1)}%** — [[${d.a}]] ↔ [[${d.b}]] → revisa abast i autoritat abans de proposar cap fusió.`
    )
  ];
  await fs.writeFile(target, lines.join('\n') + '\n', { encoding: 'utf8', flag: 'wx' });
  await completeMutationClaim({ receiptPath: RECEIPT, operation: 'contradiction-report' }, claim.claimToken);
  return target;
}

if (esMain(import.meta.url)) {
  try {
    const report = await auditCoherence();
    if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
    else {
      log(`${report.coverage.readDocuments} documents censats; ${report.coverage.comparedDocuments} comparats; ${report.excluded.length} exclusions explícites.`);
      log(`${report.overlaps.length} candidats de solapament; ${report.contradictions.length} col·lisions de contracte de ruta.`);
      for (const problem of report.problems) log(`INCOMPLET ${problem.ruta}: ${problem.code} ${problem.detail}`);
      for (const overlap of report.overlaps) log(`REVISAR ${(overlap.s * 100).toFixed(1)}% ${overlap.a} ↔ ${overlap.b}`);
      for (const conflict of report.contradictions) log(`CONTRACTE ${JSON.stringify(conflict)}`);
      for (const limit of report.limits) log(limit);
    }
    if (FORCE && report.complete) {
      const proposals = report.overlaps.filter(match => !match.marcaJurisdiccioDiferent);
      if (proposals.length) log(`Proposta escrita: ${await escriureActaProposta(proposals)}`);
    }
    process.exitCode = !report.complete ? 2 : (report.overlaps.length || report.contradictions.length ? 1 : 0);
  } catch (error) { log(`INCOMPLET: ${error.message}`); process.exitCode = 2; }
}
