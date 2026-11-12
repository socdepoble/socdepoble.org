/**
 * sosa.js — Arbre Genealògic · la numeració Sosa-Stradonitz (Ahnentafel) i
 * les branques col·laterals (FAN Club).
 *
 *   l'arrel és 1; el pare de n és 2n i la mare 2n+1; la generació de n és
 *   floor(log2 n) + 1 (1 → G1 de la taula, 2-3 → pares, 4-7 → iaios…).
 *
 * Amb el sexe desconegut ('U'): si l'altre progenitor té sexe, pren el lloc
 * complementari; si no se sap, el d'id menor fa de 2n i les posicions queden
 * a `ambigus`. Implex: una mateixa persona pot tindre diversos números. Els
 * cicles es tallen: dins d'una branca, una persona ja visitada no es torna a
 * expandir.
 */
import { indexa } from './model.js';

export const MAX_GENERACIONS_SOSA = 10; // 1023 posicions

/** La generació d'un número Sosa: floor(log2 n) + 1. */
export function generacioDeSosa(n) {
  if (!Number.isSafeInteger(n) || n < 1) throw new RangeError('Un número Sosa és un enter ≥ 1.');
  let generacio = 1;
  let resta = n;
  while (resta > 1) {
    resta = Math.floor(resta / 2);
    generacio += 1;
  }
  return generacio;
}

/* L'ordre de desempat acompanya els ids remapejats en una còpia. */
export function comparaOrdreSosa(a, b) {
  const rang = (p) => Number.isSafeInteger(p.ordreSosa) && p.ordreSosa >= 0 ? p.ordreSosa : Number.MAX_SAFE_INTEGER;
  const rangA = rang(a);
  const rangB = rang(b);
  return rangA - rangB || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

/* Reparteix els (com a molt) dos progenitors entre 2n (pare) i 2n+1 (mare). */
function posicions(progenitors, perId) {
  const [a, b] = progenitors.map((id) => perId.get(id)).sort(comparaOrdreSosa);
  if (!b) {
    if (a.sexe === 'F') return { pare: null, mare: a.id, ambigu: false };
    return { pare: a.id, mare: null, ambigu: a.sexe !== 'M' };
  }
  const sexes = `${a.sexe}${b.sexe}`;
  if (sexes === 'MF' || sexes === 'MU' || sexes === 'UF') return { pare: a.id, mare: b.id, ambigu: false };
  if (sexes === 'FM' || sexes === 'FU' || sexes === 'UM') return { pare: b.id, mare: a.id, ambigu: false };
  /* UU, MM o FF: no es pot decidir; l'id menor (ja vénen ordenats) fa de 2n. */
  return { pare: a.id, mare: b.id, ambigu: true };
}

/**
 * Numera els avantpassats de `arrelId`.
 * Torna { perPersona: Map<id, number[]>, files: FilaSosa[], ambigus: number[] }
 * amb FilaSosa = { sosa, generacio, personaId | null, ambigu }. Les files van
 * de 1 a 2^g - 1, fins a l'última generació amb alguna persona, també les
 * buides (perquè l'arbre ensenye els forats).
 */
export function numeraSosa(complet, arrelId, { maxGeneracions = MAX_GENERACIONS_SOSA } = {}) {
  const { perId, progenitorsDe } = indexa(complet);
  const buit = { perPersona: new Map(), files: [], ambigus: [] };
  if (!perId.has(arrelId)) return buit;
  const limit = Math.min(MAX_GENERACIONS_SOSA, Math.max(1, Number.isSafeInteger(maxGeneracions) ? maxGeneracions : MAX_GENERACIONS_SOSA));
  const perPosicio = new Map();
  const ambigus = new Set();
  let ultimaGeneracio = 1;

  const visita = (personaId, n, cami) => {
    perPosicio.set(n, personaId);
    const generacio = generacioDeSosa(n);
    ultimaGeneracio = Math.max(ultimaGeneracio, generacio);
    if (generacio >= limit || cami.has(personaId)) return;
    const progenitors = progenitorsDe.get(personaId) || [];
    if (!progenitors.length) return;
    const { pare, mare, ambigu } = posicions(progenitors, perId);
    const seguent = new Set(cami).add(personaId);
    if (ambigu) {
      if (pare) ambigus.add(2 * n);
      if (mare) ambigus.add(2 * n + 1);
    }
    if (pare) visita(pare, 2 * n, seguent);
    if (mare) visita(mare, 2 * n + 1, seguent);
  };
  visita(arrelId, 1, new Set());

  const perPersona = new Map();
  for (const [n, personaId] of perPosicio) {
    if (!perPersona.has(personaId)) perPersona.set(personaId, []);
    perPersona.get(personaId).push(n);
  }
  for (const numeros of perPersona.values()) numeros.sort((x, y) => x - y);

  const files = [];
  const total = 2 ** ultimaGeneracio - 1;
  for (let sosa = 1; sosa <= total; sosa += 1) {
    files.push({ sosa, generacio: generacioDeSosa(sosa), personaId: perPosicio.get(sosa) ?? null, ambigu: ambigus.has(sosa) });
  }
  return { perPersona, files, ambigus: [...ambigus].sort((x, y) => x - y) };
}

const ordenats = (ids) => [...new Set(ids)].sort();

/**
 * Les branques col·laterals d'una persona (FAN Club): germans (progenitor
 * compartit o relació 'germa'), padrins, testimonis i veïns (`de` de la
 * relació cap a la persona) i parelles.
 */
export function colateralsFan(complet, personaId) {
  const { progenitorsDe, fillsDe, relacionsDe } = indexa(complet);
  const germans = [];
  for (const progenitorId of progenitorsDe.get(personaId) || []) {
    for (const fillId of fillsDe.get(progenitorId) || []) if (fillId !== personaId) germans.push(fillId);
  }
  const padrins = [];
  const testimonis = [];
  const veins = [];
  const parelles = [];
  for (const relacio of relacionsDe.get(personaId) || []) {
    const altra = relacio.de === personaId ? relacio.a : relacio.de;
    if (relacio.tipus === 'germa') germans.push(altra);
    else if (relacio.tipus === 'parella') parelles.push(altra);
    else if (relacio.a === personaId && relacio.tipus === 'padri') padrins.push(relacio.de);
    else if (relacio.a === personaId && relacio.tipus === 'testimoni') testimonis.push(relacio.de);
    else if (relacio.a === personaId && relacio.tipus === 'vei') veins.push(relacio.de);
  }
  return { germans: ordenats(germans), padrins: ordenats(padrins), testimonis: ordenats(testimonis), veins: ordenats(veins), parelles: ordenats(parelles) };
}
