#!/usr/bin/env node
/**
 * sentinella-edicions-humanes.mjs — R32.44 · IDEA-324 (part B)
 *
 * Sentinella Humà -> IAIA: inspecciona un snapshot o fitxer d'exportació
 * d'edicions editorials humanes (`sdp.edicions-humanes.v1`, generat des del
 * botó «Exportar per a la IAIA» d'HistorialRevisionsBar o per exportaRevisionsHumanes)
 * i el contrasta amb `PAGE_COPY` (`src/sections/text/pageContent.js`) i les
 * publicacions del repositori.
 *
 * Es pot executar a mà en obrir sessió per avisar la IAIA MarIA de quins
 * `pageKey` o publicacions ha editat el Mestre al navegador o al servidor, perquè
 * cap compilació futura les xafe abans de consolidar-les a Git.
 * v1.2.23 · L8-06 (Gauntlet R1) · Cap hook ni cap cadena no la crida: és una eina d'informe, no una porta.
 *
 * ÚS:
 *   node tooling/gates/sentinella-edicions-humanes.mjs [--fitxer CAMÍ] [--clau CLAU] [--json] [--estricte]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CAMINS, arrelSegura, esMain } from '../lib/arrel.mjs';

export const ESQUEMA_EDICIONS_HUMANES = 'sdp.edicions-humanes.v1';
// v1.2.23 · costura Porta Arrel A5 (ordre del Mestre 261123) · l'única ruta per defecte és la de la zona humana,
// amb el nom que descarrega el botó «Exportar per a la IAIA» (HistorialRevisionsBar). La ruta antiga dins de
// .agents/ no la produïa ningú i la Porta Arrel la denunciava com a configuració citada inexistent.
export const RUTES_PER_DEFECTE = Object.freeze([
  `${CAMINS.escriptori}/01_produccio/edicions_humanes_sdp.json`
]);

const CAMPS_COMPARABLES = Object.freeze([
  ['title', (p) => p?.title ?? ''],
  ['subtitle', (p) => p?.subtitle ?? ''],
  ['lead', (p) => p?.lead ?? p?.summary ?? ''],
  ['content', (p) => p?.html ?? p?.content ?? ''],
  ['heroImage', (p) => p?.image ?? p?.heroImage ?? ''],
  ['publishDate', (p) => p?.date ?? p?.publishDate ?? null],
  ['tags', (p) => (Array.isArray(p?.tags) ? p.tags : [])]
]);

function igualValor(a, b) {
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a || []) === JSON.stringify(b || []);
  }
  return String(a ?? '') === String(b ?? '');
}

function esRegistre(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

/**
 * Analitza un paquet `sdp.edicions-humanes.v1` contra el diccionari `pageCopy`.
 * v1.2.23 · L8-06 (Gauntlet R1) · La forma és la del productor (exportaRevisionsHumanes de
 * src/data/historialRevisionsEditorials.js, el que descarrega «Exportar per a la IAIA»): `schema`, `generatEl`,
 * `revisions` i `historial`. Abans només s'acceptava `esquema`, `exportatEl` i `actives`, que no produïx ningú, i
 * tot fitxer real es rebutjava com a «Esquema invàlid». Els noms antics es continuen llegint.
 */
export function analitzaPaquetEdicionsHumanes(paquet, pageCopy = {}, { filtreClau = null } = {}) {
  if (!esRegistre(paquet) || (paquet.schema ?? paquet.esquema) !== ESQUEMA_EDICIONS_HUMANES) {
    return {
      valid: false,
      error: `Esquema invàlid: s'esperava '${ESQUEMA_EDICIONS_HUMANES}'.`,
      pendents: [],
      sincronitzades: [],
      totalActives: 0
    };
  }

  const actives = esRegistre(paquet.revisions) ? paquet.revisions : (esRegistre(paquet.actives) ? paquet.actives : {});
  const historial = esRegistre(paquet.historial) ? paquet.historial : {};
  const pendents = [];
  const sincronitzades = [];
  let totalActives = 0;

  for (const [clau, entrada] of Object.entries(actives)) {
    if (!esRegistre(entrada) || !esRegistre(entrada.camps)) continue;
    if (filtreClau && clau !== filtreClau && clau !== `sistema:${filtreClau}`) continue;
    totalActives += 1;

    const separador = clau.indexOf(':');
    const seccio = separador > 0 ? clau.slice(0, separador) : 'sistema';
    const id = separador > 0 ? clau.slice(separador + 1) : clau;
    const versions = Array.isArray(historial[clau]) ? historial[clau] : [];
    const ultimAutor = versions.at(-1)?.autorNom || null;

    if (seccio === 'sistema' && Object.hasOwn(pageCopy, id)) {
      const paginaRepo = pageCopy[id];
      const campsDivergents = [];
      for (const [campRevisio, lligRepo] of CAMPS_COMPARABLES) {
        if (!Object.hasOwn(entrada.camps, campRevisio)) continue;
        if (!igualValor(entrada.camps[campRevisio], lligRepo(paginaRepo))) {
          campsDivergents.push(campRevisio);
        }
      }
      const resum = {
        clau,
        seccio,
        id,
        desadaEl: entrada.desadaEl || versions.at(-1)?.desadaEl || null,
        autorNom: ultimAutor,
        versions: versions.length,
        camps: campsDivergents
      };
      if (campsDivergents.length > 0) pendents.push(resum);
      else sincronitzades.push({ ...resum, camps: Object.keys(entrada.camps) });
    } else {
      pendents.push({
        clau,
        seccio,
        id,
        desadaEl: entrada.desadaEl || versions.at(-1)?.desadaEl || null,
        autorNom: ultimAutor,
        versions: versions.length,
        camps: Object.keys(entrada.camps)
      });
    }
  }

  return {
    valid: true,
    error: null,
    exportatEl: paquet.generatEl || paquet.exportatEl || null,
    totalActives,
    pendents,
    sincronitzades
  };
}

export async function carregaPageCopyDelRepo(arrel) {
  const cami = path.join(arrel, 'src/sections/text/pageContent.js');
  const modul = await import(pathToFileURL(cami).href);
  return modul.PAGE_COPY || {};
}

export async function avaluaFitxerEdicionsHumanes({
  arrel = arrelSegura(),
  fitxer = null,
  filtreClau = null
} = {}) {
  const rutaEscollida = fitxer
    ? path.resolve(arrel, fitxer)
    : RUTES_PER_DEFECTE.map((r) => path.resolve(arrel, r)).find((abs) => fs.existsSync(abs)) || null;

  if (!rutaEscollida || !fs.existsSync(rutaEscollida)) {
    return {
      trobat: false,
      fitxer: rutaEscollida ? path.relative(arrel, rutaEscollida) : null,
      valid: true,
      totalActives: 0,
      pendents: [],
      sincronitzades: []
    };
  }

  let brut;
  try {
    brut = JSON.parse(fs.readFileSync(rutaEscollida, 'utf8'));
  } catch (err) {
    return {
      trobat: true,
      fitxer: path.relative(arrel, rutaEscollida),
      valid: false,
      error: `JSON malformat: ${err.message}`,
      totalActives: 0,
      pendents: [],
      sincronitzades: []
    };
  }

  const pageCopy = await carregaPageCopyDelRepo(arrel);
  const resultat = analitzaPaquetEdicionsHumanes(brut, pageCopy, { filtreClau });
  return {
    trobat: true,
    fitxer: path.relative(arrel, rutaEscollida),
    ...resultat
  };
}

function lligOpcionsCli(argv) {
  const opcions = { fitxer: null, filtreClau: null, json: false, estricte: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') opcions.json = true;
    else if (arg === '--estricte') opcions.estricte = true;
    else if (arg === '--fitxer' && argv[i + 1]) {
      opcions.fitxer = argv[i + 1];
      i += 1;
    } else if (arg === '--clau' && argv[i + 1]) {
      opcions.filtreClau = argv[i + 1];
      i += 1;
    }
  }
  return opcions;
}

async function main() {
  const opcions = lligOpcionsCli(process.argv.slice(2));
  const informe = await avaluaFitxerEdicionsHumanes({
    fitxer: opcions.fitxer,
    filtreClau: opcions.filtreClau
  });

  if (opcions.json) {
    process.stdout.write(`${JSON.stringify(informe, null, 2)}\n`);
  } else if (!informe.trobat) {
    process.stdout.write('[sentinella-edicions-humanes] Cap fitxer d’edicions humanes pendent detectat (estat net).\n');
  } else if (!informe.valid) {
    process.stderr.write(`[sentinella-edicions-humanes] ERROR en ${informe.fitxer}: ${informe.error}\n`);
  } else if (!informe.pendents.length) {
    process.stdout.write(`[sentinella-edicions-humanes] OK (${informe.fitxer}): ${informe.sincronitzades.length} edicions ja consolidades a Git.\n`);
  } else {
    process.stdout.write(`[sentinella-edicions-humanes] AVÍS (${informe.fitxer}): ${informe.pendents.length} edicions humanes pendents de consolidar a Git:\n`);
    for (const p of informe.pendents) {
      process.stdout.write(`  - ${p.clau} [camps: ${p.camps.join(', ')}]${p.autorNom ? ` per ${p.autorNom}` : ''}${p.desadaEl ? ` (${p.desadaEl})` : ''}\n`);
    }
  }

  if (!informe.valid) process.exitCode = 2;
  else if (opcions.estricte && informe.pendents.length > 0) process.exitCode = 1;
}

if (esMain(import.meta.url)) {
  main();
}
