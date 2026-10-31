/**
 * consolaContent.js — Transformació de dades de la Consola Termodinàmica.
 * La font és el middleware dev de tooling/vite/consola-iaia.mjs i, al build
 * web, la seua instantània sanejada (decisió del Mestre, 31-10-2026).
 */
import { errorDeLaInstantania, fontsLlegibles, opcionsDeLectura } from './fontsConsola.js';

export const FONT_CONSOLA = '/__iaia/consola.json';

export async function carregaConsola(signal) {
  /* Higiene d'amfitrió (ordre del Mestre, 261004) · Sense font en este paquet
     (WordPress, natiu), absència i cap petició a /__iaia/*.
     Decisió del Mestre (31-10-2026) · En viu a DEV i, al build web, la
     instantània sanejada (fontsConsola.js). */
  if (!fontsLlegibles()) return null;
  const r = await fetch(FONT_CONSOLA, opcionsDeLectura(signal));
  if (r.status === 404) return null;                 // un paquet sense la font
  if (!r.ok) throw new Error(`Consola ${r.status} ${r.statusText}`);
  // Sense middleware, el servidor pot tornar l'HTML de l'aplicació (200): és
  // absència, no una consola trencada. Mateix criteri que carregaMapa.
  if (!(r.headers?.get?.('content-type') || '').includes('application/json')) return null;
  const cos = await r.json();
  const fallada = errorDeLaInstantania(cos);
  if (fallada) throw fallada;
  return normalitza(cos);
}

export function normalitza(brut) {
  const falla = camp => { throw new Error(`Resposta de consola invàlida: ${camp}.`); };
  const objecte = (v, camp) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) falla(camp);
    return v;
  };
  const llista = (v, camp) => {
    if (!Array.isArray(v)) falla(camp);
    return v;
  };
  const text = (v, camp, nul = false, buit = false) => {
    if (nul && v === null) return v;
    if (typeof v !== 'string' || (!buit && !v.trim())) falla(camp);
    return v;
  };
  const boolea = (v, camp) => {
    if (typeof v !== 'boolean') falla(camp);
    return v;
  };
  const numero = (v, camp, enter = false, positiu = false) => {
    if (typeof v !== 'number' && !(typeof v === 'string' && v.trim())) falla(camp);
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || (positiu && n === 0)
      || (enter && !Number.isSafeInteger(n))) falla(camp);
    return n;
  };

  const b = objecte(brut, 'resposta');
  const rebuts = llista(b.rebuts, 'rebuts').map((v, i) => {
    const r = objecte(v, `rebuts[${i}]`);
    return {
      ...r,
      t: text(r.t, `rebuts[${i}].t`, true),
      peticio: text(r.peticio, `rebuts[${i}].peticio`, true),
      protocols: llista(r.protocols, `rebuts[${i}].protocols`).map((p, j) =>
        text(p, `rebuts[${i}].protocols[${j}]`)),
      fonts: llista(r.fonts, `rebuts[${i}].fonts`).map((vFont, j) => {
        const f = objecte(vFont, `rebuts[${i}].fonts[${j}]`);
        return { ...f,
          ruta: text(f.ruta, `rebuts[${i}].fonts[${j}].ruta`),
          sha256: text(f.sha256, `rebuts[${i}].fonts[${j}].sha256`) };
      })
    };
  });
  const consums = llista(b.consums, 'consums').map((v, i) => {
    const c = objecte(v, `consums[${i}]`);
    return { ...c,
      agent: text(c.agent, `consums[${i}].agent`),
      entrada: numero(c.entrada, `consums[${i}].entrada`, true),
      eixida: numero(c.eixida, `consums[${i}].eixida`, true) };
  });
  /* Fase A (pas 2.2 del pla, 261006) · Sense panell de Crèdits, `credits` i
     `estrategia_consum` ni es validen ni es conserven: un fitxer mal format
     ja no pot tombar consola.json sencer. */
  const noms = new Set();
  const skills = llista(b.skills, 'skills').map((v, i) => {
    const s = objecte(v, `skills[${i}]`);
    const nom = text(s.nom, `skills[${i}].nom`);
    if (noms.has(nom)) falla(`skills[${i}].nom duplicat`);
    noms.add(nom);
    return { ...s, nom,
      estat: text(s.estat, `skills[${i}].estat`, true, true),
      descripcio: text(s.descripcio, `skills[${i}].descripcio`, false, true),
      core: boolea(s.core, `skills[${i}].core`),
      alDisc: boolea(s.alDisc, `skills[${i}].alDisc`),
      alManifest: boolea(s.alManifest, `skills[${i}].alManifest`) };
  });
  let segell = null;
  if (b.segell !== null) {
    const s = objecte(b.segell, 'segell');
    segell = { ...s,
      hash: text(s.hash, 'segell.hash'),
      timestamp: text(s.timestamp, 'segell.timestamp'),
      filesCount: numero(s.filesCount, 'segell.filesCount', true) };
  }
  const immunitari = objecte(b.immunitari, 'immunitari');
  /* La termometria és opcional (el middleware encara no la publica), però
     si arriba s'ha de conservar: abans es descartava ací i la Càrrega
     documental del pols no es podia mesurar mai, encara que la font la dugués. */
  let termometria = null;
  if (b.termometria !== undefined && b.termometria !== null) {
    const t = objecte(b.termometria, 'termometria');
    termometria = { ...t,
      artefactesActius: numero(t.artefactesActius, 'termometria.artefactesActius', true),
      // Un abast absent o nul no invalida la instantània: només no hi ha text d'abast.
      abast: t.abast == null ? '' : text(t.abast, 'termometria.abast', false, true) };
  }
  const fonts = b.fonts !== undefined ? objecte(b.fonts, 'fonts') : undefined;
  
  return {
    generat: text(b.generat, 'generat', true),
    rebuts, consums, skills, segell, termometria,
    immunitari: { ...immunitari, operacions: numero(immunitari.operacions, 'immunitari.operacions', true) },
    fonts
  };
}

export function resumSkills(skills) {
  const orfes = skills.filter((s) => s.alDisc && !s.alManifest);      // al disc, fora del manifest
  const fantasmes = skills.filter((s) => s.alManifest && !s.alDisc);  // al manifest, esborrats del disc
  const nucli = skills.filter((s) => s.core);
  return { total: skills.length, orfes, fantasmes, nucli };
}

export function resumConsums(consums) {
  const total = consums.reduce((acc, c) => ({
    entrada: acc.entrada + (Number(c.entrada) || 0),
    eixida: acc.eixida + (Number(c.eixida) || 0)
  }), { entrada: 0, eixida: 0 });
  const perAgent = new Map();
  for (const c of consums) {
    const clau = c.agent ?? 'desconegut';
    const prev = perAgent.get(clau) ?? { agent: clau, entrada: 0, eixida: 0, sessions: 0 };
    perAgent.set(clau, {
      ...prev,
      entrada: prev.entrada + (Number(c.entrada) || 0),
      eixida: prev.eixida + (Number(c.eixida) || 0),
      sessions: prev.sessions + 1
    });
  }
  return { total, perAgent: [...perAgent.values()] };
}

export const curt = (sha) => (typeof sha === 'string' ? sha.slice(0, 12) : '—');

export const dataLocal = (iso, locale = 'ca-ES') => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString(locale);
};
