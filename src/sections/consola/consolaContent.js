/**
 * consolaContent.js — Transformació de dades de la Consola Termodinàmica.
 * La font és el middleware dev de tooling/vite/consola-iaia.mjs.
 */
export const FONT_CONSOLA = '/__iaia/consola.json';

export async function carregaConsola(signal) {
  const r = await fetch(FONT_CONSOLA, { signal, cache: 'no-store' });
  if (r.status === 404) return null;                 // producció: no hi ha consola
  if (!r.ok) throw new Error(`Consola ${r.status} ${r.statusText}`);
  return normalitza(await r.json());
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
  const credits = b.credits === null ? null : llista(b.credits, 'credits').map((v, i) => {
    const c = objecte(v, `credits[${i}]`);
    return { ...c,
      proveidor: text(c.proveidor, `credits[${i}].proveidor`),
      consumit: numero(c.consumit, `credits[${i}].consumit`),
      limit: numero(c.limit, `credits[${i}].limit`, false, true) };
  });
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
  return {
    generat: text(b.generat, 'generat', true),
    rebuts, consums, credits, skills, segell,
    immunitari: { ...immunitari, operacions: numero(immunitari.operacions, 'immunitari.operacions', true) }
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
