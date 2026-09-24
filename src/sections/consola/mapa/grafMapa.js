/**
 * grafMapa.js — del Mapa (sdp.mapa.v1) al graf de l'Explorador del cervell.
 *
 * Pur: sense React, sense disc i sense xarxa. Els filtres imiten els del graf
 * d'Obsidian (tipus, òrfens, cerca, fletxes, forces) però parlen el
 * vocabulari tancat del contracte (contracteMapa.js). Traduïx al valencià el
 * que el «Mapa de mis agentes» d'Emowe deia en castellà.
 */
import { TIPUS_NODE, CONFIANCES } from './contracteMapa.js';

export const NOMS_TIPUS = Object.freeze({
  skill: 'Skill', plantilla: 'Plantilla', ruta: 'Ruta documental', script: 'Script',
  hook: 'Hook', tasca: 'Tasca', agent: 'Agent', document: 'Document', porta: 'Porta'
});

export const NOMS_CONFIANCA = Object.freeze({
  declarat: 'declarat: escrit en un camp estructurat',
  derivat: 'derivat: tret per un analitzador determinista',
  inferit: 'inferit: tret de la prosa (es pinta discontinu)'
});

/* Colors només amb tokens semàntics (Pedra Seca §2); el canvas els resol. */
export const ESTIL_MAPA = Object.freeze({
  radis: Object.freeze({ agent: 11, skill: 10, ruta: 8, plantilla: 7, hook: 7, tasca: 7, porta: 7, script: 5, document: 5 }),
  colors: Object.freeze({
    skill: 'var(--sdp-accent)',
    ruta: 'var(--sdp-accio)',
    plantilla: 'var(--sdp-exit)',
    agent: 'var(--sdp-text-titol)',
    hook: 'var(--sdp-avis)',
    tasca: 'var(--sdp-accio-text)',
    porta: 'var(--sdp-error)',
    script: 'var(--sdp-text-suau)',
    document: 'var(--sdp-vora-forta)'
  }),
  noms: NOMS_TIPUS,
  etiquetaAmbZoom: Object.freeze({ agent: 0.6, skill: 0.8 })
});

/* Forces del graf. «Espaiat» porta la distància d'enllaç 250 del graf del Mestre a Obsidian. */
export const FORCES = Object.freeze({
  compacte: Object.freeze({ repulsio: 400, llargaria: 90, molla: 0.06, gravetat: 0.02 }),
  normal: Object.freeze({ repulsio: 800, llargaria: 150, molla: 0.05, gravetat: 0.01 }),
  espaiat: Object.freeze({ repulsio: 1600, llargaria: 250, molla: 0.04, gravetat: 0.006 })
});

export const TEXTOS_EXPLORADOR = Object.freeze({
  titol: 'Explorador del cervell',
  selector: 'Skill, ruta, plantilla, script, hook, tasca o agent',
  obrir: null,
  buit: 'Fes clic en un node per vore què llig, què escriu, qui el crida i a qui crida.',
  canvas: 'Graf dels agents del Mas. Utilitza l’explorador per a triar nodes amb el teclat.',
  inspector: 'Detall del node'
});

export function filtresInicials() {
  return {
    tipus: Object.fromEntries(TIPUS_NODE.map((t) => [t, true])),
    confiances: Object.fromEntries(CONFIANCES.map((c) => [c, true])),
    orfes: true,
    fletxes: true,
    cerca: ''
  };
}

/** Nom curt per a pintar: sense prefix de tipus ni ruta sencera. */
export function etiquetaNode(node) {
  const id = String(node?.id ?? '');
  const tall = id.indexOf(':');
  const tipus = tall >= 0 ? id.slice(0, tall) : '';
  const cos = tall >= 0 ? id.slice(tall + 1) : id;
  if (tipus === 'script' && cos.startsWith('npm:')) return `npm run ${cos.slice(4)}`;
  if (tipus === 'hook') {
    const [arnes, ...esdeveniment] = cos.split(':');
    return esdeveniment.length ? `${esdeveniment.join(':')} · ${arnes}` : cos;
  }
  if (['plantilla', 'script', 'document'].includes(tipus)) return cos.split('/').filter(Boolean).pop() || cos;
  return cos || id;
}

/**
 * Graf per a BrainGraph. La cerca mostra els nodes que hi casen i els seus
 * veïns directes, com Obsidian: buscar una skill és vore amb qui parla.
 */
export function grafDelMapa(mapa, filtres = filtresInicials()) {
  const arestes = mapa.arestes.filter((a) => filtres.confiances?.[a.confianca] !== false);
  const grau = new Map();
  for (const a of arestes) {
    grau.set(a.de, (grau.get(a.de) || 0) + 1);
    grau.set(a.a, (grau.get(a.a) || 0) + 1);
  }
  const base = new Set(mapa.nodes
    .filter((n) => filtres.tipus?.[n.tipus] !== false && (filtres.orfes !== false || grau.has(n.id)))
    .map((n) => n.id));

  const cerca = String(filtres.cerca || '').trim().toLowerCase();
  let visibles = base;
  if (cerca) {
    const casen = new Set(mapa.nodes
      .filter((n) => base.has(n.id) && (n.id.toLowerCase().includes(cerca) || etiquetaNode(n).toLowerCase().includes(cerca)))
      .map((n) => n.id));
    visibles = new Set(casen);
    for (const a of arestes) {
      if (casen.has(a.de) && base.has(a.a)) visibles.add(a.a);
      if (casen.has(a.a) && base.has(a.de)) visibles.add(a.de);
    }
  }

  const nodes = mapa.nodes.filter((n) => visibles.has(n.id)).map((n) => ({
    id: n.id, label: etiquetaNode(n), type: n.tipus, font: n.font, atributs: n.atributs
  }));
  const links = arestes.filter((a) => visibles.has(a.de) && visibles.has(a.a)).map((a) => ({
    source: a.de, target: a.a, type: a.tipus, confianca: a.confianca, discontinu: a.confianca === 'inferit'
  }));
  return { nodes, links };
}

const VERBS_DE_CRIDA = new Set(['crida', 'dispara', 'encamina', 'carrega', 'governa']);

/** Entrades i eixides d'un node: el «qué lee / qué produce» d'Emowe, amb confiança. */
export function relacionsDe(mapa, id) {
  const surten = mapa.arestes.filter((a) => a.de === id);
  const entren = mapa.arestes.filter((a) => a.a === id);
  const llig = surten.filter((a) => a.tipus === 'llig');
  const escriu = surten.filter((a) => a.tipus === 'escriu');
  return {
    llig,
    escriu,
    crida: surten.filter((a) => VERBS_DE_CRIDA.has(a.tipus)),
    elCriden: entren,
    avisos: mapa.avisos.filter((a) => a.node === id),
    // Caixa opaca: no declara què llig ni què produïx; no es pot encadenar.
    opaca: llig.length === 0 && escriu.length === 0
  };
}

/** Files de la pestanya «Entrades i eixides»: skills i rutes; com a Emowe, les opaques al final. */
export function filesEntradesEixides(mapa, cerca = '') {
  const q = String(cerca).trim().toLowerCase();
  return mapa.nodes
    .filter((n) => n.tipus === 'skill' || n.tipus === 'ruta')
    .map((n) => ({ node: n, ...relacionsDe(mapa, n.id) }))
    .filter((f) => !q || f.node.id.toLowerCase().includes(q)
      || [...f.llig, ...f.escriu].some((a) => a.a.toLowerCase().includes(q)))
    .sort((x, y) => Number(x.opaca) - Number(y.opaca) || x.node.id.localeCompare(y.node.id));
}
