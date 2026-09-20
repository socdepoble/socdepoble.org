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
  return {
    generat: brut.generat ?? null,
    rebuts: Array.isArray(brut.rebuts) ? brut.rebuts : [],
    consums: Array.isArray(brut.consums) ? brut.consums : [],
    credits: brut.credits ?? null,
    skills: Array.isArray(brut.skills) ? brut.skills : [],
    segell: brut.segell ?? null,
    immunitari: brut.immunitari ?? { operacions: 0, ultima: null }
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

export const dataLocal = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('ca-ES');
};
