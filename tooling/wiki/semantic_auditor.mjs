#!/usr/bin/env node
/**
 * Auditor semàntic consultiu.
 *
 * No intenta inferir significat amb vocabularis difusos ni duplica les portes
 * dures d'autoneteja_wiki.mjs. Només revisa dos contractes humans verificables:
 * arquitectura 4+2 i prefix termodinàmic reservat a esdeveniments.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildWikiIndex, parseFrontmatter } from './lib/wiki_walker.mjs';
import { WIKI_DIR } from './lib/project_paths.mjs';

const ROOT = WIKI_DIR;

export const PILARS_OPERATIUS = [
  '00_SER_Brain_Identitat',
  '01_SABER_Cultura_Coneixement',
  '02_ACTUAR_Maquina_Tecnica',
  '03_GOVERNAR_Normativa_Regles',
];

export const ZONES_CICLE = [
  '90_historic',
  '04_escriptori',
];

// Alias temporal per a importadors antics. El nom nou evita dir-ne «6 pilars».
export const PILARS_VIGENTS = [...PILARS_OPERATIUS, ...ZONES_CICLE];

const ROOT_SUPPORT_DIRS = new Set(['.obsidian', 'docs', 'src', 'supabase']);
const EPISODIC_TYPES = new Set(['acta', 'informe', 'prompt', 'petorreta']);
const LIVING_TYPES = new Set([
  'document', 'index', 'norma', 'protocol', 'registre', 'skill', 'plantilla',
]);
const MIRROR_PREFIXES = [
  '00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR',
  '03_GOVERNAR_Normativa_Regles/agents_actius',
];
const VENDOR_PREFIXES = ['00_SER_Brain_Identitat/Sollutia'];
const DATE_PREFIX = /^\d{6}_\d{4}_/;
const EVENT_IN_NAME = /(?:^|_)(?:ACTA|AUDITORIA|INFORME|REPORT|PROMPT|PETORRETA)(?:_|$)/i;
const WEAK_DESCRIPTION = /^(?:categoria|estat|tipus|data d['’]extracci[oó]|nom de la skill)\s*:|\{\{|\$\{|\[(?:ex|pendent)\s*:/i;

const posix = (value) => value.split(path.sep).join('/');
const isPrefix = (value, prefix) => value === prefix || value.startsWith(`${prefix}/`);

function semanticZone(relPath) {
  const rel = posix(relPath);
  if (MIRROR_PREFIXES.some((prefix) => isPrefix(rel, prefix))) return 'mirall';
  if (VENDOR_PREFIXES.some((prefix) => isPrefix(rel, prefix))) return 'vendor';
  if (rel.startsWith('90_historic/')) return 'arxiu';
  if (rel.startsWith('04_escriptori/')) return 'escriptori';
  if (/^0[0-3]_/.test(rel)) return 'operatiu';
  return 'suport';
}

export function auditFolderSemantics(allEntries) {
  const allowed = new Set([...PILARS_OPERATIUS, ...ZONES_CICLE, ...ROOT_SUPPORT_DIRS]);
  return allEntries
    .filter((entry) => entry.type === 'dir' && !posix(entry.relPath).includes('/'))
    .filter((entry) => !allowed.has(entry.name) && !entry.name.startsWith('.'))
    .map((entry) => ({
      tipus: 'FORA-TAXONOMIA',
      carpeta: posix(entry.relPath),
      missatge: 'Carpeta d’arrel no declarada en l’arquitectura 4+2 ni com a suport explícit.',
    }));
}

/** Retorna una decisió conservadora i explicable; mai obliga per desconeixement. */
export function needsThermodynamicDate(doc) {
  const fm = parseFrontmatter(doc.content);
  const tipus = String(fm.type || fm.tipus || '').toLocaleLowerCase('ca');
  if (EPISODIC_TYPES.has(tipus)) {
    return { necessitaData: true, motiu: `tipus '${tipus}' representa un esdeveniment.` };
  }
  if (LIVING_TYPES.has(tipus)) {
    return { necessitaData: false, motiu: `tipus '${tipus}' representa un document viu.` };
  }
  if (EVENT_IN_NAME.test(path.basename(doc.name, '.md'))) {
    return { necessitaData: true, motiu: 'el nom declara inequívocament un esdeveniment.' };
  }
  return { necessitaData: false, motiu: 'sense evidència d’esdeveniment; no s’imposa cap renomenat.' };
}

export function auditFilenameNecessity(mdDocs) {
  const alerts = [];
  for (const doc of mdDocs) {
    const zone = semanticZone(doc.relPath);
    if (!['operatiu', 'escriptori'].includes(zone)) continue;
    if (posix(doc.relPath).split('/').includes('scripts')) continue;
    const { necessitaData, motiu } = needsThermodynamicDate(doc);
    const hasDate = DATE_PREFIX.test(doc.name);
    if (necessitaData && !hasDate) {
      alerts.push({
        tipus: 'FALTA-DATA-ESDEVENIMENT',
        fitxer: posix(doc.relPath),
        missatge: `Cal prefix YYMMDD_HHMM_CATEGORIA_Titol.md perquè ${motiu}`,
      });
    } else if (!necessitaData && hasDate) {
      alerts.push({
        tipus: 'DATA-EN-DOCUMENT-VIU',
        fitxer: posix(doc.relPath),
        missatge: `El prefix crea versions paral·leles perquè ${motiu}`,
      });
    }
  }
  return alerts;
}

export function auditDescriptionQuality(mdDocs) {
  const alerts = [];
  for (const doc of mdDocs) {
    if (semanticZone(doc.relPath) !== 'operatiu') continue;
    if (posix(doc.relPath).split('/').includes('scripts')) continue;
    const fm = parseFrontmatter(doc.content);
    const description = typeof fm.description === 'string' ? fm.description.trim() : '';
    if (WEAK_DESCRIPTION.test(description) || description.endsWith('...')) {
      alerts.push({
        tipus: 'DESCRIPCIO-FEBLE',
        fitxer: posix(doc.relPath),
        missatge: 'La descripció sembla metadada, placeholder o text truncat; requerix síntesi humana.',
      });
    }
  }
  return alerts;
}

export async function runSemanticAudit(wikiDir = ROOT) {
  const { allEntries, mdDocs } = await buildWikiIndex(wikiDir);
  return {
    folderAlerts: auditFolderSemantics(allEntries),
    filenameAlerts: auditFilenameNecessity(mdDocs),
    descriptionAlerts: auditDescriptionQuality(mdDocs),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await runSemanticAudit();
  const groups = [
    ['Carpetes', result.folderAlerts],
    ['Noms', result.filenameAlerts],
    ['Descripcions', result.descriptionAlerts],
  ];
  console.log('\n🧠 AUDITORIA SEMÀNTICA (consultiva — no bloqueja)\n');
  for (const [label, alerts] of groups) {
    console.log(`${label}: ${alerts.length}`);
    for (const alert of alerts) {
      console.log(`  [${alert.tipus}] ${alert.carpeta || alert.fitxer} — ${alert.missatge}`);
    }
  }
}
