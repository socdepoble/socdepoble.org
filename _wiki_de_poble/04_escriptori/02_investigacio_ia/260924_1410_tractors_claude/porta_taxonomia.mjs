#!/usr/bin/env node
/**
 * porta-taxonomia.mjs — Tractor de taxonomia documental.
 *
 * DESTÍ: tooling/gates/porta-taxonomia.mjs (en quarantena al laboratori).
 * Configuració: tooling/wiki/taxonomia.json. Doctrina: la pàgina de la Wiki
 * que nomena la configuració (`pagina`).
 *
 * PER QUÈ EXISTIX
 *   La regla `aammdd_hhmm_categoria_titol.ext` (AGENTS.md §2) vivia només en
 *   prosa. tractor-nomenclatura.mjs vigila el snake_case (N1), però no la data,
 *   l'hora ni la categoria, i MarIA escriu sense cap porta que la veja. Esta
 *   porta s'executa on passa tothom: el pre-commit.
 *
 * LLEIS (només per als fitxers de primer nivell de les superfícies declarades)
 *   T1 FORMAT     aammdd_hhmm_resta.ext, minúscules, sense accents ni espais
 *   T2 DATA       data i hora reals (no 260231, no 2460)
 *   T3 CATEGORIA  la resta comença per una categoria del catàleg
 *   T4 TÍTOL      hi ha títol després de la categoria
 *   T5 FUTUR      la data no passa de demà
 *   T6 PASSAT     un fitxer NOU no du una data de fa més de N dies
 *                 (atrapa un DDMMAA escrit on toca AAMMDD: 240926 per 260924)
 *
 * ABAST (declarat per superfície, no per patró): _wiki_de_poble/04_escriptori
 * i _wiki_de_poble/10_actes, primer nivell. Subcarpetes (01_produccio,
 * 02_investigacio_ia, 00_bandeja_d_entrada) queden fora. El deute heretat no
 * bloqueja: --staged només mira els fitxers AFEGITS al commit.
 *
 * ÚS
 *   node tooling/gates/porta-taxonomia.mjs --staged           # pre-commit (exit 1 si un fitxer nou falla)
 *   node tooling/gates/porta-taxonomia.mjs --fitxer RUTA      # un fitxer (com si fóra nou)
 *   node tooling/gates/porta-taxonomia.mjs --tot [--estricte] # inventari del deute (exit 0 si no és estricte)
 *   node tooling/gates/porta-taxonomia.mjs --paritat          # la pàgina de la Wiki i el JSON diuen el mateix
 *   afig --json per a eixida de màquina
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';

export const CONFIG = 'tooling/wiki/taxonomia.json';
const NOM = /^(\d{2})(\d{2})(\d{2})_(\d{2})(\d{2})_([a-z0-9]+(?:_[a-z0-9]+)*)\.([a-z0-9]+)$/;
const MARCA_INICI = '<!-- SDP:TAXONOMIA:CATEGORIES -->';
const MARCA_FI = '<!-- /SDP:TAXONOMIA:CATEGORIES -->';
const DIA_MS = 24 * 3600 * 1000;

export function carregaConfig(arrel) {
  const c = JSON.parse(fs.readFileSync(path.join(arrel, CONFIG), 'utf8'));
  if (c.schema !== 'sdp.taxonomia.v1' || !c.categories || !Array.isArray(c.superficies)) {
    throw new Error(`${CONFIG} no és una configuració sdp.taxonomia.v1`);
  }
  return c;
}

/** Per què un nom no casa amb T1: la causa concreta, no només «invàlid». */
function causaFormat(nom) {
  if (/[A-Z]/.test(nom)) return 'porta majúscules';
  if (/[^ -~]/.test(nom)) return 'porta accents o caràcters no ASCII';
  if (/\s/.test(nom)) return 'porta espais';
  if (/-/.test(nom)) return 'porta guions; el separador és el guió baix';
  if (!/^\d{6}_\d{4}_/.test(nom)) return 'no comença per aammdd_hhmm_';
  return 'no segueix aammdd_hhmm_categoria_titol.ext';
}

/**
 * @param {string} nom       nom del fitxer (sense carpeta)
 * @param {object} config    tooling/wiki/taxonomia.json
 * @param {{ara?: Date, nou?: boolean}} opcions  `nou` activa T6
 */
export function analitzaNom(nom, config, { ara = new Date(), nou = false } = {}) {
  const errors = [];
  const m = NOM.exec(nom);
  if (!m) return { nom, valid: false, errors: [{ llei: 'T1', missatge: `${nom}: ${causaFormat(nom)}.` }] };
  const [, aa, mm, dd, hh, mi, resta] = m;
  const any = 2000 + Number(aa);
  const data = new Date(Date.UTC(any, Number(mm) - 1, Number(dd)));
  if (data.getUTCFullYear() !== any || data.getUTCMonth() !== Number(mm) - 1 || data.getUTCDate() !== Number(dd)) {
    errors.push({ llei: 'T2', missatge: `${nom}: ${aa}${mm}${dd} no és una data real (aammdd).` });
  }
  if (Number(hh) > 23 || Number(mi) > 59) errors.push({ llei: 'T2', missatge: `${nom}: ${hh}${mi} no és una hora real (hhmm).` });

  const categories = Object.keys(config.categories).sort((a, b) => b.length - a.length);
  const categoria = categories.find((c) => resta === c || resta.startsWith(`${c}_`)) ?? null;
  if (!categoria) {
    errors.push({ llei: 'T3', missatge: `${nom}: «${resta.split('_')[0]}» no és cap categoria del catàleg (${CONFIG}).` });
  } else if (resta === categoria) {
    errors.push({ llei: 'T4', missatge: `${nom}: falta el títol després de la categoria «${categoria}».` });
  }

  if (!errors.some((e) => e.llei === 'T2')) {
    // La data del nom és local; es compara per dies sencers perquè l'hora no importa ací.
    const diaNom = Date.UTC(any, Number(mm) - 1, Number(dd));
    const diaAra = Date.UTC(ara.getFullYear(), ara.getMonth(), ara.getDate());
    if (diaNom > diaAra + DIA_MS) errors.push({ llei: 'T5', missatge: `${nom}: la data ${aa}${mm}${dd} és del futur.` });
    const tolerancia = Number.isInteger(config.tolerancia_dies_passat) ? config.tolerancia_dies_passat : 30;
    if (nou && diaNom < diaAra - tolerancia * DIA_MS) {
      errors.push({ llei: 'T6', missatge: `${nom}: un fitxer nou amb data de fa més de ${tolerancia} dies. És aammdd (any, mes, dia)?` });
    }
  }
  return { nom, valid: errors.length === 0, categoria, titol: categoria && resta !== categoria ? resta.slice(categoria.length + 1) : null, errors };
}

/** Està dins d'una superfície, al primer nivell, i no és exempt? */
export function dinsAbast(rel, config) {
  const net = rel.split(path.sep).join('/');
  const dir = path.posix.dirname(net);
  const base = path.posix.basename(net);
  if (!config.superficies.includes(dir)) return false;
  if (base.startsWith('.')) return false;
  return !Object.hasOwn(config.exempts || {}, base);
}

function afegitsAlCommit(arrel) {
  const text = execFileSync('git', ['-C', arrel, 'diff', '--cached', '--name-only', '--diff-filter=A', '-z'], { encoding: 'utf8' });
  return text.split('\0').filter(Boolean);
}

export function comprovaRutes(rutes, config, { ara = new Date(), nou = false } = {}) {
  const resultats = rutes.filter((r) => dinsAbast(r, config))
    .map((r) => ({ ruta: r, ...analitzaNom(path.posix.basename(r.split(path.sep).join('/')), config, { ara, nou }) }));
  return { valid: resultats.every((r) => r.valid), resultats: resultats.filter((r) => !r.valid), revisats: resultats.length };
}

export function inventari(arrel, config) {
  const rutes = [];
  for (const sup of config.superficies) {
    let entrades = [];
    try { entrades = fs.readdirSync(path.join(arrel, sup), { withFileTypes: true }); } catch { continue; }
    for (const e of entrades) if (e.isFile()) rutes.push(`${sup}/${e.name}`);
  }
  return rutes.sort();
}

/** Categories de la taula de la pàgina, entre les marques, primera columna entre accents greus. */
export function categoriesDeLaPagina(text) {
  const i = text.indexOf(MARCA_INICI);
  const f = text.indexOf(MARCA_FI);
  if (i === -1 || f === -1 || f < i) return null;
  return [...text.slice(i, f).matchAll(/^\|\s*`([a-z0-9_]+)`\s*\|/gm)].map((m) => m[1]).sort();
}

export function paritat(arrel, config) {
  const text = fs.readFileSync(path.join(arrel, config.pagina), 'utf8');
  const pagina = categoriesDeLaPagina(text);
  if (!pagina) return { valid: false, errors: [`${config.pagina}: falten les marques ${MARCA_INICI} … ${MARCA_FI}`] };
  const json = Object.keys(config.categories).sort();
  const falten = json.filter((c) => !pagina.includes(c));
  const sobren = pagina.filter((c) => !json.includes(c));
  const errors = [
    ...falten.map((c) => `La categoria «${c}» és a ${CONFIG} i no a la pàgina.`),
    ...sobren.map((c) => `La categoria «${c}» és a la pàgina i no a ${CONFIG}.`)
  ];
  return { valid: errors.length === 0, errors };
}

function opcio(argv, nom) {
  const i = argv.indexOf(`--${nom}`);
  return i === -1 ? null : argv[i + 1] ?? null;
}

function main() {
  const argv = process.argv.slice(2);
  const arrel = arrelSegura();
  const config = carregaConfig(arrel);
  const json = argv.includes('--json');
  let r;
  let bloqueja = true;
  if (argv.includes('--paritat')) r = paritat(arrel, config);
  else if (argv.includes('--staged')) r = comprovaRutes(afegitsAlCommit(arrel), config, { nou: true });
  else if (opcio(argv, 'fitxer')) r = comprovaRutes([opcio(argv, 'fitxer')], config, { nou: true });
  else {
    r = comprovaRutes(inventari(arrel, config), config);
    bloqueja = argv.includes('--estricte');
  }

  if (json) console.log(JSON.stringify(r, null, 2));
  else if (r.valid) console.log(`✅ [Taxonomia] ${r.revisats ?? 'Pàgina i catàleg'}${r.revisats !== undefined ? ' fitxers conformes.' : ' diuen el mateix.'}`);
  else {
    console.error(`${bloqueja ? '❌' : '·'} [Taxonomia] ${r.resultats ? `${r.resultats.length} de ${r.revisats} fitxers fora de la taxonomia` : 'Pàgina i catàleg divergents'}:`);
    for (const x of r.resultats ?? []) for (const e of x.errors) console.error(`   ${e.llei} · ${e.missatge}`);
    for (const e of r.errors ?? []) console.error(`   · ${e}`);
    if (r.resultats) console.error(`   Format: aammdd_hhmm_categoria_titol.ext · catàleg i exemples a ${config.pagina}`);
  }
  process.exitCode = r.valid || !bloqueja ? 0 : 1;
}

if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(`[Taxonomia] ${e.message}`); process.exitCode = 2; }
}
