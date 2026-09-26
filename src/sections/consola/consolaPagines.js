/**
 * consolaPagines.js — les pàgines de la Consola Termodinàmica.
 *
 * El text viu a PAGE_COPY.consola (una sola font de veritat per al copy); ací
 * només hi ha l'ordre, la ruta, el resum que cada targeta del tauler calcula
 * de les dades reals i les etiquetes d'un colp d'ull. Cap resum ni cap
 * etiqueta inventa res: si la font no ha arribat, ho diu; si no hi ha base
 * per a una etiqueta, no n'hi ha.
 *
 * Mòdul sense React ni JSX perquè es puga provar sense muntar res. L'única
 * eixida del món pur és el record de visites (localStorage), aïllat al final.
 */
import { PAGE_COPY } from '../text/pageContent.js';
import { resumSkills } from './consolaContent.js';
import { fluxosDelMapa } from './mapa/fluxosMapa.js';
import { agentsAtomics, capesActors, xifresDelMas } from './mapa/actorsMapa.js';

export const RUTA_CONSOLA = '/consola';

/**
 * Ordre del tauler: el pols i l'explorador, i després les pestanyes del «Mapa
 * de mis agentes» d'Emowe en el seu ordre. Els ids són els segments de ruta:
 * /consola/<id>.
 */
export const IDS_PAGINES = Object.freeze([
  'pols', 'explorador', 'fluxos', 'calendari', 'inventari', 'entrades', 'agents', 'actors', 'salut'
]);

/* Copy provisional de les pàgines que PAGE_COPY.consola encara no porta.
   PAGE_COPY mana sempre: quan hi entren estes tres, este bloc sobra
   (pendent a src/sections/text/pageContent.js, fora del carril de la Consola). */
const COPY_PROVISIONAL = Object.freeze({
  fluxos: Object.freeze({
    title: 'Fluxos de treball',
    lead: 'Les cadenes on el que deixa una peça és el que llig la següent, només amb relacions declarades. La prosa no encadena: només suggerix què caldria declarar.'
  }),
  agents: Object.freeze({
    title: 'Agents atòmics',
    lead: 'Perfils amb contracte que treballen sols, i les quatre peces que ho fan possible, mesurades amb el Mapa d’avui.'
  }),
  actors: Object.freeze({
    title: 'Actors del Mas',
    lead: 'Qui conversa, què es carrega en arrencar, quins candats hi ha, què corre sol i sobre quin sòl treballen, capa per capa.'
  })
});

/* H2 d'introducció de cada pàgina: per a què servix, en una línia i sense
   punt final. Mateix patró que COPY_PROVISIONAL: si un dia PAGE_COPY porta
   `subtitle` a la pàgina, mana eixe. */
const SUBTITOLS = Object.freeze({
  pols: 'Per a saber què gasta i què llig l’eixam',
  explorador: 'Per a vore qui es relaciona amb qui',
  fluxos: 'Per a trobar les cadenes de faena declarades',
  calendari: 'Per a vigilar el que corre sense ningú davant',
  inventari: 'Per a saber quines skills cal cuidar',
  entrades: 'Per a detectar les caixes opaques',
  agents: 'Per a saber qui pot treballar sol',
  actors: 'Per a vore qui fa què al voltant dels agents',
  salut: 'Per a saber què està trencat i què cal vigilar'
});

const TEXT_SENSE_DADES = Object.freeze({
  loading: 'Llegint les dades…',
  absent: 'Dades no disponibles en este entorn',
  error: 'No s’han pogut llegir les dades'
});
const TEXT_SENSE_MAPA = Object.freeze({
  loading: 'Llegint el Mapa…',
  absent: 'Mapa no disponible en este entorn',
  error: 'No s’ha pogut llegir el Mapa'
});

const compta = (llista, prova) => llista.filter(prova).length;

/* Cada resum rep { dades, estatDades, mapa, estatMapa } i torna una frase. */
const RESUMS = Object.freeze({
  pols: ({ dades, estatDades }) => {
    if (!dades) return TEXT_SENSE_DADES[estatDades] ?? TEXT_SENSE_DADES.absent;
    const { total, orfes } = resumSkills(dades.skills);
    return `${dades.consums.length} registres de consum · ${dades.rebuts.length} rebuts · ${total} skills (${orfes.length} orfes)`;
  },
  explorador: ({ mapa, estatMapa }) => (mapa
    ? `${mapa.nodes.length} nodes · ${mapa.arestes.length} arestes`
    : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent),
  calendari: ({ mapa, estatMapa }) => (mapa
    ? `${mapa.tasques.length} tasques · ${compta(mapa.tasques, (t) => t.estat === 'viu')} vives · ${compta(mapa.tasques, (t) => t.estat === 'mort')} mortes`
    : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent),
  inventari: ({ mapa, estatMapa }) => (mapa
    ? `${compta(mapa.nodes, (n) => n.tipus === 'skill')} skills al Mapa`
    : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent),
  entrades: ({ mapa, estatMapa }) => (mapa
    ? `${compta(mapa.nodes, (n) => n.tipus === 'skill')} skills · ${compta(mapa.nodes, (n) => n.tipus === 'ruta')} rutes documentals`
    : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent),
  salut: ({ mapa, estatMapa }) => (mapa
    ? `${mapa.avisos.length} avisos (${compta(mapa.avisos, (a) => a.severitat === 'alta')} alts) · ${mapa.salut.length} mètriques`
    : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent),
  fluxos: ({ mapa, estatMapa }) => {
    if (!mapa) return TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent;
    const { cadenes, suggeriments } = fluxosDelMapa(mapa);
    return `${cadenes.length} cadenes declarades · ${suggeriments.length} suggeriments de la prosa`;
  },
  agents: ({ mapa, estatMapa }) => (mapa
    ? `${agentsAtomics(mapa).length} agents atòmics · ${compta(mapa.nodes, (n) => n.tipus === 'agent')} arnesos que conversen`
    : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent),
  actors: ({ mapa, estatMapa }) => {
    if (!mapa) return TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent;
    const { arnesos, candats, programades } = capesActors(mapa);
    return `${arnesos.length} arnesos · ${candats.length} candats · ${programades.length} tasques programades`;
  }
});

/** Copy de la Consola. Si la clau falta, la pàgina es pinta amb el mínim i ho diu en desenvolupament. */
export function copyConsola() {
  return PAGE_COPY.consola ?? { title: 'Consola Termodinàmica', pagines: [] };
}

/** Pàgina pel seu id (segment de ruta), amb el copy de PAGE_COPY (o el provisional); null si no existix. */
export function paginaConsola(id) {
  if (!IDS_PAGINES.includes(id)) return null;
  const copy = copyConsola().pagines?.find((p) => p.id === id) ?? COPY_PROVISIONAL[id];
  return {
    id,
    ruta: `${RUTA_CONSOLA}/${id}`,
    title: copy?.title ?? id,
    subtitle: copy?.subtitle ?? SUBTITOLS[id],
    lead: copy?.lead ?? ''
  };
}

export function paginesConsola() {
  return IDS_PAGINES.map(paginaConsola);
}

/** Frase de resum d'una targeta a partir de les dades disponibles. */
export function resumPagina(id, fonts) {
  const resum = RESUMS[id];
  return resum ? resum(fonts) : '';
}

/**
 * Segment de pàgina a partir del comodí de la ruta (/consola/*): '' és el
 * tauler; 'calendari' o 'calendari/' és eixa pàgina; qualsevol altra cosa, null.
 */
export function segmentPagina(comodi) {
  const net = String(comodi ?? '').replace(/^\/+|\/+$/g, '');
  if (!net) return '';
  return IDS_PAGINES.includes(net) ? net : null;
}

/* ── Etiquetes d'un colp d'ull ────────────────────────────────────────────
   Cada targeta del tauler en porta com a molt dues: el nivell de la seua
   font (Cal reparar o Important, mai les dues; Sense font si no n'hi ha) i
   Canvis nous si el resum és diferent del que este visitant va vore l'última
   vegada que va obrir la pàgina. El `to` és el vocabulari d'Insignia. */

export const ETIQUETES = Object.freeze({
  reparar: Object.freeze({ text: 'Cal reparar', to: 'error' }),
  important: Object.freeze({ text: 'Important', to: 'avis' }),
  nou: Object.freeze({ text: 'Canvis nous', to: 'info' }),
  senseFont: Object.freeze({ text: 'Sense font', to: 'neutre' })
});

/** Semàfor de l'inventari (03_inventari_skills.md): 3 avisos o més, roig; 1 o 2, ambre. */
export const LLINDAR_ROIG = 3;
/** Artefactes actius per damunt dels quals el pols avisa de saturació. */
export const LLINDAR_SATURACIO = 150;

/** Recompte d'artefactes actius de consola.json, o null si la font no el mesura. */
export function recompteArtefactes(dades) {
  const n = dades?.termometria?.artefactesActius;
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/* Les severitats del Mapa ja són el criteri: alta és una fallada, mitjana un
   avís i baixa, informació (TO_SEVERITAT de les vistes del Mapa). */
const nivellAvisos = (avisos) => {
  if (avisos.some((a) => a.severitat === 'alta')) return 'error';
  return avisos.some((a) => a.severitat === 'mitjana') ? 'avis' : null;
};
/* Enllaços trencats (cap a un script, una skill o una font que no hi són, o
   una menció a una skill inexistent) i peces òrfenes, del compilador. Per a
   l'explorador tots són fallades («enllaços trencats o orfes», encàrrec de la
   llesca), encara que el Mapa en gradue uns quants de mitjans. */
const CODIS_ENLLAC = new Set(['script-absent', 'skill-fantasma', 'font-absent', 'crida-inexistent', 'orfe']);
const SENSE_PROGRAMA = new Set(['declarat-sense-llancador', 'llancador-sense-declaracio']);

/* Cada regla rep la dada de la seua font i torna 'error', 'avis' o null. */
const NIVELLS = Object.freeze({
  pols: (dades) => {
    const { orfes, fantasmes } = resumSkills(dades.skills);
    if (orfes.length || fantasmes.length) return 'error';
    const recompte = recompteArtefactes(dades);
    return recompte !== null && recompte > LLINDAR_SATURACIO ? 'avis' : null;
  },
  explorador: (mapa) => (mapa.avisos.some((a) => CODIS_ENLLAC.has(a.codi)) ? 'error' : null),
  fluxos: (mapa) => (fluxosDelMapa(mapa).punts.some((p) => p.escriuen.length && !p.lligen.length) ? 'avis' : null),
  calendari: (mapa) => {
    if (mapa.tasques.some((t) => t.estat === 'mort')) return 'error';
    return mapa.tasques.some((t) => SENSE_PROGRAMA.has(t.estat)) ? 'avis' : null;
  },
  inventari: (mapa) => {
    const perSkill = new Map();
    for (const a of mapa.avisos) perSkill.set(a.node, (perSkill.get(a.node) || 0) + 1);
    const recomptes = mapa.nodes.filter((n) => n.tipus === 'skill').map((n) => perSkill.get(n.id) || 0);
    if (recomptes.some((n) => n >= LLINDAR_ROIG)) return 'error';
    return recomptes.some((n) => n > 0) ? 'avis' : null;
  },
  entrades: (mapa) => (xifresDelMas(mapa).opaques > 0 ? 'avis' : null),
  // Sense regla pròpia: les seues quatre peces ja avisen a fluxos, calendari, actors i salut.
  agents: () => null,
  actors: (mapa) => {
    const { programades, candats } = capesActors(mapa);
    if (programades.some((t) => t.estat === 'mort')) return 'error';
    return candats.some((c) => c.acreditat === false) ? 'avis' : null;
  },
  salut: (mapa) => nivellAvisos(mapa.avisos)
});

/** La dada i l'estat de la font d'una pàgina: consola.json per al pols, el Mapa per a la resta. */
function fontDe(id, fonts = {}) {
  return id === 'pols'
    ? { dada: fonts.dades ?? null, estat: fonts.estatDades }
    : { dada: fonts.mapa ?? null, estat: fonts.estatMapa };
}

/**
 * Signatura del que la targeta resumix: el resum mateix, i només quan la
 * font ha arribat (un «Llegint…» no és cap estat que es puga haver vist).
 */
export function signaturaPagina(id, fonts) {
  if (!IDS_PAGINES.includes(id) || !fontDe(id, fonts).dada) return null;
  return resumPagina(id, fonts);
}

/**
 * Etiquetes de la targeta d'una pàgina. `vist` és la signatura que este
 * visitant va vore l'última vegada; sense record (primera visita o
 * emmagatzematge mut) no hi ha base per a dir que res és nou.
 */
export function etiquetesPagina(id, fonts, vist) {
  const regla = NIVELLS[id];
  if (!regla) return [];
  const { dada, estat } = fontDe(id, fonts);
  if (!dada) {
    if (estat === 'loading') return [];
    return [estat === 'error' ? ETIQUETES.reparar : ETIQUETES.senseFont];
  }
  const etiquetes = [];
  // Una lectura fallida amb l'última instantània bona també és una fallada.
  const nivell = estat === 'error' ? 'error' : regla(dada);
  if (nivell === 'error') etiquetes.push(ETIQUETES.reparar);
  else if (nivell === 'avis') etiquetes.push(ETIQUETES.important);
  if (typeof vist === 'string' && vist !== signaturaPagina(id, fonts)) etiquetes.push(ETIQUETES.nou);
  return etiquetes;
}

/**
 * Etiquetes de les cinc targetes del pols, amb la mateixa llei: sense
 * consola.json, totes diuen per què; amb dades, només on hi ha base.
 */
export function etiquetesPols(dades, estat) {
  const IDS = ['carrega', 'consums', 'credits', 'rebuts', 'skills'];
  if (!dades) {
    const comu = estat === 'loading' ? [] : [estat === 'error' ? ETIQUETES.reparar : ETIQUETES.senseFont];
    return Object.fromEntries(IDS.map((id) => [id, comu]));
  }
  const recompte = recompteArtefactes(dades);
  const { orfes, fantasmes } = resumSkills(dades.skills);
  return {
    carrega: recompte === null ? [ETIQUETES.senseFont] : recompte > LLINDAR_SATURACIO ? [ETIQUETES.important] : [],
    consums: [],
    credits: dades.credits?.length ? [] : [ETIQUETES.senseFont],
    rebuts: [],
    skills: orfes.length || fantasmes.length ? [ETIQUETES.reparar] : []
  };
}

/* ── Record de visites ────────────────────────────────────────────────────
   Per visitant i per navegador: { id de pàgina: signatura vista }. Si
   l'emmagatzematge no respon (navegació privada, previsualitzacions), no hi
   ha record i cap targeta diu «Canvis nous». */

export const CLAU_VISTES = 'sdp:consola:vist:v1';
/* El mode privacitat viu al peu de cada pàgina: qui l'activa per gravar no
   ha de tornar a travessar les dades la visita següent. Només es recorda
   per visitant i navegador; si l'emmagatzematge no respon, torna a false. */
export const CLAU_PRIVACITAT = 'sdp:consola:privat:v1';

const magatzemDe = (magatzem) => (magatzem === undefined ? globalThis.localStorage : magatzem);

/** Signatures vistes per este visitant; null si l'emmagatzematge no es pot llegir. */
export function llegixVistes(magatzem) {
  try {
    const m = magatzemDe(magatzem);
    if (!m) return null;
    const brut = m.getItem(CLAU_VISTES);
    if (!brut) return {};
    const vistes = JSON.parse(brut);
    return vistes && typeof vistes === 'object' && !Array.isArray(vistes) ? vistes : {};
  } catch {
    return null;
  }
}

/** El mode privacitat que este visitant va deixar actiu; false si no se'n sap res. */
export function llegixPrivacitat(magatzem) {
  try {
    return magatzemDe(magatzem)?.getItem(CLAU_PRIVACITAT) === '1';
  } catch {
    return false;
  }
}

/** Recorda el mode privacitat. Torna si ho ha pogut guardar. */
export function desaPrivacitat(actiu, magatzem) {
  try {
    const m = magatzemDe(magatzem);
    if (!m) return false;
    if (actiu) m.setItem(CLAU_PRIVACITAT, '1');
    else m.removeItem(CLAU_PRIVACITAT);
    return true;
  } catch {
    return false;
  }
}

/** Anota que este visitant ha vist la pàgina amb eixa signatura. Torna si ho ha pogut guardar. */
export function marcaVista(id, signatura, magatzem) {
  if (!IDS_PAGINES.includes(id) || typeof signatura !== 'string') return false;
  try {
    const m = magatzemDe(magatzem);
    if (!m) return false;
    const vistes = llegixVistes(m) ?? {};
    if (vistes[id] === signatura) return true;
    m.setItem(CLAU_VISTES, JSON.stringify({ ...vistes, [id]: signatura }));
    return true;
  } catch {
    return false;
  }
}
