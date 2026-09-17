/**
 * ENTROPIA ZERO ROUTER — contracte v2.
 *
 * El frontmatter descriu el document; la ruta n'és la taxonomia. Per això
 * este mòdul només enruta automàticament quan la destinació és inequívoca.
 * Qualsevol cas ambigu falla de manera explícita en lloc de moure contingut
 * a un pilar inventat.
 */
import path from 'node:path';

const _metaUrl = import.meta.url.startsWith('file:') ? import.meta.url : 'file://' + import.meta.url;
import { normalitza } from './lib/text.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SCHEMA = JSON.parse(readFileSync(fileURLToPath(new URL('./schema.json', _metaUrl))));
const DESCRIPTION_MIN = SCHEMA.properties.description.minLength;
const DESCRIPTION_MAX = SCHEMA.properties.description.maxLength;
const ALIASES_MAX = SCHEMA.properties.aliases.maxItems;
const ALIAS_MIN = SCHEMA.properties.aliases.items.minLength;
const ALIAS_MAX = SCHEMA.properties.aliases.items.maxLength;

export const CORE_PROPS = Object.freeze(Object.keys(SCHEMA.properties));

// Es conserva l'export per compatibilitat d'API. El v2 no té excepcions de
// governança: normes i protocols usen exactament el mateix contracte.
export const GOV_PROPS = Object.freeze([]);

export const REQUIRED_PROPS = Object.freeze([...SCHEMA.required]);
export const ALLOWED_ESTATS = Object.freeze([...SCHEMA.properties.status.enum]);
export const ALLOWED_TIPUS = Object.freeze([...SCHEMA.properties.type.enum]);

const ALLOWED_KEYS = new Set(CORE_PROPS);
const ALLOWED_STATE_SET = new Set(ALLOWED_ESTATS);
const ALLOWED_TYPE_SET = new Set(ALLOWED_TIPUS);
const OPERATIONAL_PILLARS = new Set([
  '00_SER_Brain_Identitat',
  '01_SABER_Cultura_Coneixement',
  '02_ACTUAR_Maquina_Tecnica',
  '03_GOVERNAR_Normativa_Regles',
]);

function codePointLength(value) {
  return [...value].length;
}

function validIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * Valida el subconjunt YAML ja parsejat contra schema.json v2.
 * Retorna tots els errors perquè l'auditoria siga explicable.
 */
export function validarFrontmatter(fm) {
  const errors = [];
  if (!fm || typeof fm !== 'object' || Array.isArray(fm)) {
    return ['El frontmatter ha de ser un objecte.'];
  }

  for (const key of Object.keys(fm)) {
    if (!ALLOWED_KEYS.has(key)) errors.push(`Propietat no admesa pel v2: ${key}`);
  }

  for (const key of REQUIRED_PROPS) {
    if (fm[key] === undefined || fm[key] === null || fm[key] === '') {
      errors.push(`Falta propietat obligatòria: ${key}`);
    }
  }

  const currentStatus = fm.status || fm.estat;
  if (typeof currentStatus !== 'string' || !ALLOWED_STATE_SET.has(currentStatus)) {
    errors.push(`estat/status invàlid: ${String(currentStatus ?? '(absent)')}`);
  }
  const currentType = fm.type || fm.tipus;
  if (typeof currentType !== 'string' || !ALLOWED_TYPE_SET.has(currentType)) {
    errors.push(`tipus/type invàlid: ${String(currentType ?? '(absent)')}`);
  }

  if (typeof fm.description !== 'string') {
    errors.push('description ha de ser una cadena.');
  } else {
    const length = codePointLength(fm.description);
    if (length < DESCRIPTION_MIN || length > DESCRIPTION_MAX) {
      errors.push(`description ha de tindre entre ${DESCRIPTION_MIN} i ${DESCRIPTION_MAX} caràcters (té ${length}).`);
    }
  }

  if (fm.aliases !== undefined) {
    if (!Array.isArray(fm.aliases)) {
      errors.push('aliases ha de ser una llista.');
    } else {
      if (fm.aliases.length > ALIASES_MAX) errors.push(`aliases admet com a màxim ${ALIASES_MAX} elements.`);
      const normalized = [];
      fm.aliases.forEach((alias, index) => {
        if (typeof alias !== 'string') {
          errors.push(`aliases[${index}] ha de ser una cadena.`);
          return;
        }
        const length = codePointLength(alias);
        if (length < ALIAS_MIN || length > ALIAS_MAX) {
          errors.push(`aliases[${index}] ha de tindre entre ${ALIAS_MIN} i ${ALIAS_MAX} caràcters.`);
        }
        normalized.push(normalitza(alias));
      });
      if (new Set(normalized).size !== normalized.length) {
        errors.push('aliases conté duplicats.');
      }
    }
  }

  if (fm.revisat !== undefined && !validIsoDate(fm.revisat)) {
    errors.push('revisat ha de ser una data real YYYY-MM-DD.');
  }
  return errors;
}

export function assertFrontmatterValid(fm, context = 'frontmatter') {
  const errors = validarFrontmatter(fm);
  if (errors.length) throw new Error(`${context}: ${errors.join(' ')}`);
  return fm;
}

function currentOperationalDirectory(currentPath) {
  if (!currentPath) return null;
  const normalized = String(currentPath).replaceAll('\\', '/');
  if (path.posix.isAbsolute(normalized) || normalized.split('/').includes('..')) {
    throw new Error(`currentPath ha de ser una ruta relativa segura: ${currentPath}`);
  }
  const [pillar] = normalized.split('/');
  if (!OPERATIONAL_PILLARS.has(pillar)) return null;
  const directory = path.posix.dirname(normalized);
  return `${directory === '.' ? pillar : directory}/`;
}

/**
 * Determina una destinació només si el v2 aporta prou informació.
 *
 * `currentPath` permet mantindre un document canònic en la seua carpeta
 * operativa actual. Sense eixa dada, només els tipus amb jurisdicció inequívoca
 * es poden enrutar automàticament.
 */
export function determinarCarpeta(fm, { currentPath } = {}) {
  assertFrontmatterValid(fm);

  const currentDirectory = currentOperationalDirectory(currentPath);
  if (currentDirectory) return currentDirectory;

  const st = fm.status || fm.estat;
  const tp = fm.type || fm.tipus;

  if (st === 'arxivat') return '90_arxiu_historic/';
  if (st === 'esborrany' || st === 'futur') {
    return '04_escriptori/';
  }

  if (tp === 'norma' || tp === 'protocol') {
    return '02_saber/protocols_tecnics/';
  }
  if (tp === 'skill' || tp === 'plantilla') {
    return null;
  }

  if (!fm.pilar) {
    throw new Error(
      `No es pot inferir el pilar d'un ${tp} canònic des del frontmatter v2; `
      + 'cal indicar currentPath o una destinació explícita.',
    );
  }
  return `${fm.pilar}/`;
}

export default {
  validarFrontmatter,
  assertFrontmatterValid,
  determinarCarpeta,
  CORE_PROPS,
  GOV_PROPS,
  REQUIRED_PROPS,
  ALLOWED_ESTATS,
  ALLOWED_TIPUS,
};
