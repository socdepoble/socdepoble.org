/**
 * fluxosMapa.js — fluxos de treball del Mapa (01_fluxos_skills.md), pur.
 *
 * És la pestanya «Flujos trabajo skills» d'Emowe amb la regla del Mas: una
 * cadena només es construïx amb arestes declarades o derivades. Dues peces
 * s'encadenen si el que deixa una és el que llig l'altra (el mateix camí o
 * una carpeta que conté l'altre) o si una crida l'altra. La prosa (inferit)
 * no encadena mai: és un suggeriment de «declara'm».
 *
 * Sense React, sense disc i sense xarxa. Només llig el que el compilador ja
 * produïx (sdp.mapa.v1): no inventa rutes ni passos.
 */

/** Les peces que fan faena documental: skills i rutes. Els scripts de npm no són fluxos. */
const ENCADENABLES = new Set(['skill', 'ruta']);
const VERBS_DE_CRIDA = new Set(['crida', 'dispara', 'encamina', 'carrega', 'governa']);
const PES_CONFIANCA = Object.freeze({ declarat: 0, derivat: 1, inferit: 2 });

/** Emowe en pinta com a màxim 12, de 2 a 5 passos. */
export const MAX_PASSOS = 5;
export const MAX_CADENES = 12;

const TIPUS_AMB_CAMI = new Set(['document', 'plantilla', 'script']);

/** Camí del repositori d'un node: el de l'id per a documents i plantilles; si no, la font. */
export function camiDe(node) {
  const id = String(node?.id ?? '');
  const tall = id.indexOf(':');
  if (TIPUS_AMB_CAMI.has(node?.tipus) && tall >= 0) return id.slice(tall + 1);
  return node?.font || (tall >= 0 ? id.slice(tall + 1) : id);
}

/** El mateix camí, o una carpeta que conté l'altre (en qualsevol dels dos sentits). */
export function encaixa(x, y) {
  const a = String(x ?? '').replace(/\/+$/, '');
  const b = String(y ?? '').replace(/\/+$/, '');
  if (!a || !b) return false;
  return a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);
}

const mesFeble = (...confiances) => confiances
  .reduce((pitjor, c) => (PES_CONFIANCA[c] > PES_CONFIANCA[pitjor] ? c : pitjor), 'declarat');

/**
 * Enllaços entre peces encadenables: { de, a, via: 'fitxer'|'crida', deixa?, llig?, confianca }.
 * Un sol enllaç per parella: el primer que es troba en ordre estable.
 */
export function enllacosDelMapa(mapa) {
  const perId = new Map(mapa.nodes.map((n) => [n.id, n]));
  const encadenable = (id) => ENCADENABLES.has(perId.get(id)?.tipus);
  const ferm = mapa.arestes.filter((a) => a.confianca !== 'inferit' && encadenable(a.de));
  const escriu = ferm.filter((a) => a.tipus === 'escriu');
  const llig = ferm.filter((a) => a.tipus === 'llig');
  const enllacos = new Map();
  const posa = (e) => { if (!enllacos.has(`${e.de}|${e.a}`)) enllacos.set(`${e.de}|${e.a}`, e); };

  for (const e of escriu) {
    const deixa = camiDe(perId.get(e.a));
    for (const l of llig) {
      if (l.de === e.de) continue;
      const llegit = camiDe(perId.get(l.a));
      if (encaixa(deixa, llegit)) {
        posa({ de: e.de, a: l.de, via: 'fitxer', deixa, llig: llegit, confianca: mesFeble(e.confianca, l.confianca) });
      }
    }
  }
  for (const c of ferm) {
    if (c.tipus === 'crida' && encadenable(c.a) && c.de !== c.a) {
      posa({ de: c.de, a: c.a, via: 'crida', confianca: c.confianca });
    }
  }
  return [...enllacos.values()].sort((x, y) => `${x.de}|${x.a}`.localeCompare(`${y.de}|${y.a}`));
}

const conte = (llarga, curta) => {
  if (curta.length > llarga.length) return false;
  for (let i = 0; i + curta.length <= llarga.length; i += 1) {
    if (curta.every((id, j) => llarga[i + j] === id)) return true;
  }
  return false;
};

/**
 * Cadenes de 2 a MAX_PASSOS: la més llarga per origen, sense cicles, i fora
 * les que ja estan contingudes en una altra. Cada pas porta l'enllaç amb
 * l'anterior i la cadena, la confiança de la seua baula més feble.
 */
export function cadenesDelMapa(mapa) {
  const enllacos = enllacosDelMapa(mapa);
  const eixides = new Map();
  for (const e of enllacos) {
    if (!eixides.has(e.de)) eixides.set(e.de, []);
    eixides.get(e.de).push(e);
  }
  const perId = new Map(mapa.nodes.map((n) => [n.id, n]));

  const mesLlarga = (cami) => {
    let millor = cami;
    if (cami.length >= MAX_PASSOS) return millor;
    for (const e of eixides.get(cami.at(-1).id) || []) {
      if (cami.some((p) => p.id === e.a)) continue;
      const nou = mesLlarga([...cami, { id: e.a, tipus: perId.get(e.a)?.tipus ?? null, enllac: e }]);
      if (nou.length > millor.length) millor = nou;
    }
    return millor;
  };

  const candidates = [...eixides.keys()].sort()
    .map((id) => mesLlarga([{ id, tipus: perId.get(id)?.tipus ?? null, enllac: null }]))
    .filter((c) => c.length >= 2)
    .sort((x, y) => y.length - x.length || x[0].id.localeCompare(y[0].id));

  const triades = [];
  for (const c of candidates) {
    const ids = c.map((p) => p.id);
    if (triades.some((t) => conte(t.map((p) => p.id), ids))) continue;
    triades.push(c);
  }
  return triades.slice(0, MAX_CADENES).map((passos) => ({
    id: passos.map((p) => p.id).join('>'),
    passos,
    confianca: mesFeble(...passos.slice(1).map((p) => p.enllac.confianca))
  }));
}

/** El que només diu la prosa entre peces encadenables: suggeriments, mai fluxos. */
export function suggerimentsDelMapa(mapa) {
  const perId = new Map(mapa.nodes.map((n) => [n.id, n]));
  const encadenable = (id) => ENCADENABLES.has(perId.get(id)?.tipus);
  return mapa.arestes
    .filter((a) => a.confianca === 'inferit' && encadenable(a.de) && encadenable(a.a)
      && (VERBS_DE_CRIDA.has(a.tipus) || a.tipus === 'llig' || a.tipus === 'escriu'))
    .sort((x, y) => `${x.de}|${x.a}`.localeCompare(`${y.de}|${y.a}`));
}

/**
 * Punts de trobada: cada lloc on una peça escriu o llig, amb qui hi escriu i
 * qui el llig. Una cadena es tanca on algú llig el que un altre ha deixat.
 */
export function puntsDeTrobada(mapa) {
  const perId = new Map(mapa.nodes.map((n) => [n.id, n]));
  const punts = new Map();
  for (const a of mapa.arestes) {
    if (a.confianca === 'inferit' || (a.tipus !== 'llig' && a.tipus !== 'escriu')) continue;
    if (!ENCADENABLES.has(perId.get(a.de)?.tipus) || !perId.has(a.a)) continue;
    if (!punts.has(a.a)) punts.set(a.a, { node: perId.get(a.a), escriuen: new Set(), lligen: new Set() });
    punts.get(a.a)[a.tipus === 'escriu' ? 'escriuen' : 'lligen'].add(a.de);
  }
  return [...punts.values()]
    .map((p) => ({ node: p.node, escriuen: [...p.escriuen].sort(), lligen: [...p.lligen].sort() }))
    .sort((x, y) => (y.escriuen.length + y.lligen.length) - (x.escriuen.length + x.lligen.length)
      || x.node.id.localeCompare(y.node.id));
}

export function fluxosDelMapa(mapa) {
  return {
    cadenes: cadenesDelMapa(mapa),
    suggeriments: suggerimentsDelMapa(mapa),
    punts: puntsDeTrobada(mapa)
  };
}
