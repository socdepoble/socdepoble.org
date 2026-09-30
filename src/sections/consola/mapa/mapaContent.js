/**
 * mapaContent.js — lectura i validació del Mapa de la Consola (sdp.mapa.v1).
 *
 * La font és el middleware només-dev de tooling/vite/consola-iaia.mjs, que
 * crida el compilador tooling/brain/mapa-consola.mjs. El Mapa descriu la
 * maquinària interna: no entra al paquet públic ni al de WordPress
 * (04_contracte_de_dades.md, «On viu l'eixida»).
 *
 * La validació és estricta i falla en veu alta: un tipus desconegut o una
 * aresta cap a un node absent vol dir que compilador i interfície ja no
 * parlen el mateix contracte, i això no es pinta com si res.
 */
import { ESQUEMA_MAPA, TIPUS_NODE, TIPUS_ARESTA, CONFIANCES, SEVERITATS, ESTATS_TASCA } from './contracteMapa.js';

export const FONT_MAPA = '/__iaia/mapa.json';

export async function carregaMapa(signal) {
  const r = await fetch(FONT_MAPA, { signal, cache: 'no-store' });
  if (r.status === 404) return null;                 // producció, o middleware sense instal·lar
  if (!r.ok) throw new Error(`Mapa ${r.status} ${r.statusText}`);
  // Sense middleware, el servidor pot tornar l'HTML de l'aplicació: és absència, no un mapa.
  if (!(r.headers?.get?.('content-type') || '').includes('application/json')) return null;
  return normalitzaMapa(await r.json());
}

export function normalitzaMapa(brut) {
  const falla = (camp) => { throw new Error(`Mapa invàlid: ${camp}.`); };
  const objecte = (v, camp) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) falla(camp);
    return v;
  };
  const llista = (v, camp) => {
    if (!Array.isArray(v)) falla(camp);
    return v;
  };
  const text = (v, camp, nul = false) => {
    if (nul && (v === null || v === undefined)) return null;
    if (typeof v !== 'string' || !v.trim()) falla(camp);
    return v;
  };
  const enter = (v, camp) => {
    if (v === null || v === undefined) return null;
    if (!Number.isSafeInteger(v) || v < 0) falla(camp);
    return v;
  };
  const tancat = (v, valors, camp) => {
    if (!valors.includes(v)) falla(`${camp} (${String(v)})`);
    return v;
  };
  const mapaLliure = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

  const b = objecte(brut, 'resposta');
  if (b.schema !== ESQUEMA_MAPA) falla(`schema (${String(b.schema)})`);

  let tall = null;
  if (b.tall !== null && b.tall !== undefined) {
    const t = objecte(b.tall, 'tall');
    tall = {
      branca: text(t.branca, 'tall.branca', true),
      commit: text(t.commit, 'tall.commit', true),
      arbre_net: typeof t.arbre_net === 'boolean' ? t.arbre_net : null
    };
  }

  const ids = new Set();
  const nodes = llista(b.nodes, 'nodes').map((v, i) => {
    const n = objecte(v, `nodes[${i}]`);
    const id = text(n.id, `nodes[${i}].id`);
    if (ids.has(id)) falla(`nodes[${i}].id duplicat`);
    ids.add(id);
    return {
      id,
      tipus: tancat(n.tipus, TIPUS_NODE, `nodes[${i}].tipus`),
      font: text(n.font, `nodes[${i}].font`, true),
      atributs: mapaLliure(n.atributs) ?? {}
    };
  });

  const arestes = llista(b.arestes, 'arestes').map((v, i) => {
    const a = objecte(v, `arestes[${i}]`);
    const de = text(a.de, `arestes[${i}].de`);
    const cap = text(a.a, `arestes[${i}].a`);
    if (!ids.has(de) || !ids.has(cap)) falla(`arestes[${i}] apunta a un node absent`);
    return {
      de,
      a: cap,
      tipus: tancat(a.tipus, TIPUS_ARESTA, `arestes[${i}].tipus`),
      confianca: tancat(a.confianca, CONFIANCES, `arestes[${i}].confianca`),
      evidencia: text(a.evidencia, `arestes[${i}].evidencia`, true)
    };
  });

  const tasques = llista(b.tasques, 'tasques').map((v, i) => {
    const t = objecte(v, `tasques[${i}]`);
    return {
      id: text(t.id, `tasques[${i}].id`),
      estat: tancat(t.estat, ESTATS_TASCA, `tasques[${i}].estat`),
      llancador: mapaLliure(t.llancador),
      cadencia: mapaLliure(t.cadencia),
      script: text(t.script, `tasques[${i}].script`, true),
      font: text(t.font, `tasques[${i}].font`, true)
    };
  });

  const avisos = llista(b.avisos, 'avisos').map((v, i) => {
    const a = objecte(v, `avisos[${i}]`);
    const node = text(a.node, `avisos[${i}].node`);
    if (!ids.has(node)) falla(`avisos[${i}] apunta a un node absent`);
    return {
      node,
      codi: text(a.codi, `avisos[${i}].codi`),
      severitat: tancat(a.severitat, SEVERITATS, `avisos[${i}].severitat`),
      evidencia: text(a.evidencia, `avisos[${i}].evidencia`, true)
    };
  });

  const salut = llista(b.salut, 'salut').map((v, i) => {
    const m = objecte(v, `salut[${i}]`);
    const na = m.valor === 'N/A';
    if (!na && !Number.isFinite(m.valor)) falla(`salut[${i}].valor`);
    return {
      metrica: text(m.metrica, `salut[${i}].metrica`),
      valor: na ? 'N/A' : m.valor,
      unitat: text(m.unitat, `salut[${i}].unitat`, true) ?? 'fraccio',
      numerador: enter(m.numerador, `salut[${i}].numerador`),
      denominador: enter(m.denominador, `salut[${i}].denominador`),
      font: text(m.font, `salut[${i}].font`),
      // Un valor sense prova reproduïble no és una mesura: es pinta N/A.
      prova: na ? null : text(m.prova, `salut[${i}].prova`)
    };
  });

  return {
    schema: ESQUEMA_MAPA,
    generat: text(b.generat, 'generat', true),
    tall, nodes, arestes, tasques, avisos, salut
  };
}

const ORDRE_SEVERITAT = Object.freeze({ alta: 0, mitjana: 1, baixa: 2 });

/** [[valor, quants]] de `clau` en la llista: el més nombrós primer i, a igualtat, per nom. */
export function recomptePer(llista, clau) {
  const m = new Map();
  for (const x of llista) m.set(x[clau], (m.get(x[clau]) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
}

export function resumMapa(mapa) {
  return {
    nodes: mapa.nodes.length,
    arestes: mapa.arestes.length,
    avisos: mapa.avisos.length,
    tasques: mapa.tasques.length,
    alts: mapa.avisos.filter((a) => a.severitat === 'alta').length,
    // T3 (ordre del Mestre, 260930) · la coberta del tauler compta amb el mateix recompte.
    perSeveritat: recomptePer(mapa.avisos, 'severitat'),
    mesurades: mapa.salut.filter((m) => m.valor !== 'N/A').length,
    perTipus: recomptePer(mapa.nodes, 'tipus'),
    perConfianca: recomptePer(mapa.arestes, 'confianca'),
    perEstat: recomptePer(mapa.tasques, 'estat'),
    avisosOrdenats: [...mapa.avisos].sort((a, b) =>
      ORDRE_SEVERITAT[a.severitat] - ORDRE_SEVERITAT[b.severitat] || a.node.localeCompare(b.node) || a.codi.localeCompare(b.codi))
  };
}

/** «n / d» per a fraccions, «valor unitat» per a la resta i N/A sense adorn. */
export function valorMetrica(m) {
  if (m.valor === 'N/A') return 'N/A';
  if (m.unitat === 'fraccio') return `${m.numerador} / ${m.denominador}`;
  return `${m.valor} ${m.unitat}`;
}

export function textCadencia(c) {
  if (!c) return '—';
  const parts = [];
  if (Number.isFinite(c.cada_segons)) parts.push(`cada ${c.cada_segons} s`);
  if (c.en_arrencar) parts.push('en arrencar');
  if (c.permanent) parts.push('permanent');
  if (typeof c.cron === 'string') parts.push(c.cron);
  return parts.join(' · ') || '—';
}

export function textLlancador(l) {
  if (!l) return '—';
  // `tasca`: subtasca llançada per una altra tasca declarada (p. ex. Plaquetes).
  return [l.tipus, l.etiqueta, l.esdeveniment, l.tasca].filter(Boolean).join(' · ') || '—';
}
