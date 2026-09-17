#!/usr/bin/env node
/**
 * contradiction_engine.mjs
 * Motor autònom per a detectar duplicitats semàntiques a la Wiki de Poble.
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
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { buildWikiIndex } from './lib/wiki_walker.mjs';
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

function jaccard(a, b) {
  const A = shingles(a), B = shingles(b);
  if (A.size === 0 && B.size === 0) return 0;
  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
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

function jurisdictionFromPath(relPath) {
  return JURISDICTIONS.get(relPath.split(path.sep)[0]) || null;
}

function isManagedOperationalDoc(doc) {
  const normalized = doc.relPath.split(path.sep).join('/');
  return jurisdictionFromPath(doc.relPath) !== null
    && !EXCLUDED_OPERATIONAL_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

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

export async function findDuplicates(wikiDir = ROOT) {
  const { mdDocs } = await buildWikiIndex(wikiDir);
  const docs = mdDocs
    .filter(isManagedOperationalDoc)
    .map(d => {
      const parsed = parseManagedDocument(d);
      return {
        ruta: d.relPath,
        fm: parsed.data,
        jurisdiccio: jurisdictionFromPath(d.relPath),
        text: stripComments(parsed.body),
      };
    })
    .filter(d => d.text.length > 200);

  const duplicats = [];
  for (let i = 0; i < docs.length; i++) {
    for (let j = i + 1; j < docs.length; j++) {
      const sim = jaccard(docs[i].text, docs[j].text);
      if (sim < UMBRAL_DUPLICAT) continue;

      const jurA = docs[i].jurisdiccio;
      const jurB = docs[j].jurisdiccio;
      const marcaJurisdiccioDiferent = jurA !== jurB;

      duplicats.push({
        s: sim,
        a: docs[i].ruta,
        b: docs[j].ruta,
        marcaJurisdiccioDiferent,
        jurA, jurB
      });
    }
  }
  return duplicats;
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
    description: 'Proposta automàtica de revisió de possibles contradiccions semàntiques.',
  }, ['status', 'type', 'description']);
  const lines = [
    frontmatter.trimEnd(),
    `# Proposta de fusió — contradiccions detectades`,
    ``,
    ...duplicatsReals.map(d =>
      `- **${(d.s * 100).toFixed(1)}%** — [[${d.a}]] ↔ [[${d.b}]] → escull document canònic i converteix l'altre en pont (wikilink).`
    )
  ];
  await fs.writeFile(target, lines.join('\n') + '\n', { encoding: 'utf8', flag: 'wx' });
  await completeMutationClaim({ receiptPath: RECEIPT, operation: 'contradiction-report' }, claim.claimToken);
  return target;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  log(`Iniciant Contradiction Engine a: ${ROOT} (mode: ${FORCE ? 'ESCRIPTURA' : 'DRY-RUN'})`);
  const duplicats = await findDuplicates();

  const marcats = duplicats.filter(d => d.marcaJurisdiccioDiferent);
  const reals = duplicats.filter(d => !d.marcaJurisdiccioDiferent);

  if (marcats.length) {
    log(`ℹ️ ${marcats.length} coincidència(es) amb Marca de Jurisdicció diferent — NO són contradicció, són capes legítimes:`);
    marcats.forEach(d => log(`  [${(d.s * 100).toFixed(1)}%] ${d.a} (${d.jurA}) ↔ ${d.b} (${d.jurB})`));
  }

  if (reals.length === 0) {
    log('✅ Cap contradicció real (Veritat en Dos Miralls preservada).');
    process.exit(0);
  }

  log(`⚠️ ${reals.length} contradicció(ns) semàntica(ques) real(s):`);
  reals.sort((a, b) => b.s - a.s).forEach(d => {
    log(`[${(d.s * 100).toFixed(1)}%] ${d.a}  ↔  ${d.b}`);
  });

  if (FORCE) {
    const actaPath = await escriureActaProposta(reals);
    log(`📝 Acta de proposta escrita: ${path.relative(ROOT, actaPath)}`);
  } else {
    log('DRY-RUN: cap fitxer escrit. Per generar l\'Acta cal --force i --receipt=<lease Reflex>.');
  }
  process.exit(1);
}
