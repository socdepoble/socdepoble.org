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
import { compteOMesura, plural } from './concordanca.js';
import { esSenseLector, fluxosDelMapa, puntsDeTrobada } from './mapa/fluxosMapa.js';
import { TITOLS_PECES_AGENTS, agentsAtomics, capesActors, pecesAgents, xifresDelMas } from './mapa/actorsMapa.js';
import { LLINDAR_ROIG, resumInventari } from './mapa/inventariMapa.js';
import { recomptePer, resumMapa } from './mapa/mapaContent.js';

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

/* T2 (ordre del Mestre, 260930) · Cada mesura rep { dades, mapa } i torna
   les parts del resum (una xifra amb el que compta, que la targeta pinta en
   h5), o null si la seua font no ha arribat. El resum unix les parts amb
   « · »: és la signatura de «Canvis nous» i no pot canviar ni un caràcter. */
const delMapa = (mesura) => ({ mapa }) => (mapa ? mesura(mapa) : null);
/* Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada mesura concorda
   (concordanca.js): «1 tasca», «1 viva», «1 avís». Amb una xifra diferent
   d'1 el text no canvia ni un caràcter; amb un 1, la signatura canvia una
   sola vegada i «Canvis nous» hi salta un cop. */
const MESURES = Object.freeze({
  /* Ordre del Mestre, 261004 · El pols compara el disc amb manifest.yaml:
     el que hi diu «orfes» no són les òrfenes del Mapa (sense cap relació que
     hi arribe). Es diu «fora del manifest» perquè les dues paraules no es
     contradiguen (el Pols deia 0 orfes i l'Inventari, «Cal reparar»). La
     signatura del pols canvia una vegada: «Canvis nous» hi salta un cop. */
  /* Correcció 261004 (verificador de la tercera passada, punt 4) · Sense el
     diari de sessió, els registres i els rebuts no tenen mesura: no són 0
     (registresDelDiari). Amb el diari, la signatura no canvia. */
  pols: ({ dades }) => {
    if (!dades) return null;
    const { total, orfes } = resumSkills(dades.skills);
    return [
      compteOMesura(registresDelDiari(dades, 'consums'), 'registre de consum', 'registres de consum'),
      compteOMesura(registresDelDiari(dades, 'rebuts'), 'rebut', 'rebuts'),
      `${plural(total, 'skill', 'skills')} (${orfes.length} fora del manifest)`
    ];
  },
  explorador: delMapa((mapa) => [plural(mapa.nodes.length, 'node', 'nodes'), plural(mapa.arestes.length, 'aresta', 'arestes')]),
  calendari: delMapa((mapa) => [
    plural(mapa.tasques.length, 'tasca', 'tasques'),
    plural(compta(mapa.tasques, (t) => t.estat === 'viu'), 'viva', 'vives'),
    plural(compta(mapa.tasques, (t) => t.estat === 'mort'), 'morta', 'mortes')
  ]),
  inventari: delMapa((mapa) => [plural(compta(mapa.nodes, (n) => n.tipus === 'skill'), 'skill al Mapa', 'skills al Mapa')]),
  entrades: delMapa((mapa) => [
    plural(compta(mapa.nodes, (n) => n.tipus === 'skill'), 'skill', 'skills'),
    plural(compta(mapa.nodes, (n) => n.tipus === 'ruta'), 'ruta documental', 'rutes documentals')
  ]),
  /* Correcció 261004 (verificador de la tercera passada, punt 5) · La segona
     mètrica és la xifra de la targeta «metriques-amb-mesura»: derogat «N
     mètriques», el total sense targeta pròpia (ara el diu el subtítol
     d'eixa targeta). La signatura de Salut canvia una vegada. */
  salut: delMapa((mapa) => [
    `${plural(mapa.avisos.length, 'avís', 'avisos')} (${plural(compta(mapa.avisos, (a) => a.severitat === 'alta'), 'alt', 'alts')})`,
    plural(compta(mapa.salut, (m) => m.valor !== 'N/A'), 'mètrica de salut amb mesura', 'mètriques de salut amb mesura')
  ]),
  fluxos: delMapa((mapa) => {
    const { cadenes, suggeriments } = fluxosDelMapa(mapa);
    return [
      plural(cadenes.length, 'cadena declarada', 'cadenes declarades'),
      plural(suggeriments.length, 'suggeriment de la prosa', 'suggeriments de la prosa')
    ];
  }),
  agents: delMapa((mapa) => [
    plural(agentsAtomics(mapa).length, 'agent atòmic', 'agents atòmics'),
    plural(compta(mapa.nodes, (n) => n.tipus === 'agent'), 'arnés que conversa', 'arnesos que conversen')
  ]),
  actors: delMapa((mapa) => {
    const { arnesos, candats, programades } = capesActors(mapa);
    return [
      plural(arnesos.length, 'arnés', 'arnesos'),
      plural(candats.length, 'candat', 'candats'),
      plural(programades.length, 'tasca programada', 'tasques programades')
    ];
  })
});

/* Sense font, el resum diu per què: consola.json per al pols, el Mapa per a la resta. */
const textSenseFont = (id, { estatDades, estatMapa }) => (id === 'pols'
  ? TEXT_SENSE_DADES[estatDades] ?? TEXT_SENSE_DADES.absent
  : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent);

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

/** Parts del resum d'una targeta (cada una, una mètrica); null sense font o per a una pàgina desconeguda. */
export function mesuresPagina(id, fonts = {}) {
  const mesura = MESURES[id];
  return mesura ? mesura(fonts) : null;
}

/** Frase de resum d'una targeta a partir de les dades disponibles. */
export function resumPagina(id, fonts = {}) {
  if (!MESURES[id]) return '';
  const mesures = mesuresPagina(id, fonts);
  return mesures ? mesures.join(' · ') : textSenseFont(id, fonts);
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

/* Semàfor de l'inventari (03_inventari_skills.md): 3 avisos o més, roig; 1 o
   2, ambre. Viu amb la resta de l'inventari (mapa/inventariMapa.js). */
export { LLINDAR_ROIG };
/** Artefactes actius per damunt dels quals el pols avisa de saturació. */
export const LLINDAR_SATURACIO = 150;
/** El recompte d'artefactes (recompteArtefactes) passa del llindar de saturació. */
export const saturat = (recompte) => recompte !== null && recompte > LLINDAR_SATURACIO;

/* T12 (ordre del Mestre, 260930) · Un diari de rebuts que fa més d'una
   setmana que no en rep cap ja no diu què llig l'eixam hui. */
export const LLINDAR_REBUTS_RANCIS_DIES = 7;
const DIA_MS = 24 * 60 * 60 * 1000;

/** Recompte d'artefactes actius de consola.json, o null si la font no el mesura. */
export function recompteArtefactes(dades) {
  const n = dades?.termometria?.artefactesActius;
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/**
 * Ordre del Mestre, 261004 (cap anomalia sense mostrar) · Les línies del
 * diari de sessió i del journal immunitari que el middleware no ha pogut
 * llegir (consola.json · fonts.<font>.línies_descartades): no compten enlloc
 * i abans no es deien. Es diuen també quan són zero. null si consola.json no
 * porta `fonts`; cada valor, null si la seua font no el porta (absent).
 */
export function liniesDescartades(dades) {
  const fonts = dades?.fonts;
  if (!fonts || typeof fonts !== 'object') return null;
  const de = (font) => {
    const n = font?.['línies_descartades'];
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  };
  const diari = de(fonts.diari);
  const immunitari = de(fonts.immunitari);
  return diari === null && immunitari === null ? null : { diari, immunitari };
}

/**
 * Correcció 261004 (verificador de la tercera passada, punt 4) · Una font
 * absent no és cap zero. El middleware publica `operacions: 0`, `rebuts: []`
 * i `consums: []` també quan el journal immunitari o el diari de sessió no
 * existixen, i ho diu a fonts.<font>.estat ('absent'). Una font es llig si
 * consola.json no diu el contrari: sense `fonts` (un productor anterior), es
 * creu el que porta.
 */
export function fontLlegible(dades, font) {
  const estat = dades?.fonts?.[font]?.estat;
  return typeof estat !== 'string' || estat === 'ok';
}

/** Operacions del journal immunitari; null si el journal no es pot llegir (mai 0). */
export function operacionsImmunitaries(dades) {
  if (!dades || !fontLlegible(dades, 'immunitari')) return null;
  const n = dades.immunitari?.operacions;
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/** Quants registres del diari de sessió porta `camp` ('rebuts' o 'consums'); null si el diari no es pot llegir (mai 0). */
export function registresDelDiari(dades, camp) {
  if (!dades || !fontLlegible(dades, 'diari')) return null;
  return Array.isArray(dades[camp]) ? dades[camp].length : null;
}

/* Un instant llegible (mil·lisegons) o null: les dates de consola.json poden
   faltar (un rebut sense `t`) i la Consola no n'inventa cap. */
const instant = (iso) => {
  if (typeof iso !== 'string') return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
};

/** Data (ISO, tal com arriba) del rebut més recent; null si cap no en porta una de llegible. */
export function ultimRebut(rebuts) {
  let millor = null;
  for (const r of rebuts ?? []) {
    const t = instant(r?.t);
    if (t !== null && (millor === null || t > millor.t)) millor = { t, iso: r.t };
  }
  return millor?.iso ?? null;
}

/** Dies sencers des de `iso` fins a `ara` (mai negatius); null si la data no es pot llegir. */
export function diesDes(iso, ara = Date.now()) {
  const t = instant(iso);
  return t === null ? null : Math.max(0, Math.floor((ara - t) / DIA_MS));
}

/**
 * Rebuts rancis: el més recent fa més de LLINDAR_REBUTS_RANCIS_DIES dies,
 * comptats per l'instant (7 dies i una hora ja en són més de 7), no pels dies
 * sencers del text «fa N dies». Sense cap rebut datat no hi ha base per a dir-ho.
 * Correcció B1 (260930): el llindar de l'encàrrec, «més de 7 dies».
 */
export function rebutsRancis(rebuts, ara = Date.now()) {
  const t = instant(ultimRebut(rebuts));
  return t !== null && ara - t > LLINDAR_REBUTS_RANCIS_DIES * DIA_MS;
}

/** Data (ISO) de l'última operació immunitària, si consola.json la porta (immunitari.ultima.data); si no, null. */
export function dataUltimaOperacio(dades) {
  const iso = dades?.immunitari?.ultima?.data;
  return instant(iso) === null ? null : iso;
}

/* T12 · Codis d'avís del Mapa que volen dir que la vigilància mateixa està
   trencada (el segell de les skills, l'empremta del LEDGER): el tauler els
   alça en una alerta, perquè cap semàfor d'una sola pàgina no n'avise prou. */
export const CODIS_VIGILANCIA = Object.freeze(['segell-trencat', 'ledger-invalid']);

/** Avisos del Mapa amb un codi de vigilància, en l'ordre del Mapa. */
export function avisosDeVigilancia(mapa) {
  return (mapa?.avisos ?? []).filter((a) => CODIS_VIGILANCIA.includes(a.codi));
}

/* ── Coberta: els estats de dins de cada pàgina ───────────────────────────
   T3 (ordre del Mestre, 260930) · Cada targeta del tauler desglossa a la
   coberta el que la seua pàgina marca per dins, el que falla primer al
   capdavant. Viu a part de MESURES: la signatura de «Canvis nous»
   (resumPagina) no en sap res. Cada regla rep la dada de la seua font (i el
   rellotge, per als rebuts del pols) i torna una llista de { clau, n, text,
   to } o null; el que compta zero no hi entra. El `to` és el vocabulari
   d'Insignia, i el nivell de l'etiqueta és el to del primer (nivellEstats). */

/** Una xifra amb el que compta: «1 dia», «2 dies» (concordanca.js, la de tota la Consola). */
export { plural };
/** Dies des d'una data, com es diuen: «avui», «fa 1 dia», «fa 8 dies». */
export const faDies = (dies) => (dies === 0 ? 'avui' : `fa ${plural(dies, 'dia', 'dies')}`);

/** Ordre de la coberta: el que falla primer al capdavant. */
export const ORDRE_TO = Object.freeze({ error: 0, avis: 1, info: 2 });

const compte = (clau, n, un, molts, to) => (n > 0 ? { clau, n, text: plural(n, un, molts), to } : null);
const perClau = (llista, clau) => new Map(recomptePer(llista, clau));

/* D1 (decisió del Mestre, 260930): un diari de rebuts ranci, que la targeta
   Rebuts del pols ja marca «Important», també és un avís de la coberta. */
function estatRebuts(rebuts, ara) {
  if (!rebutsRancis(rebuts, ara)) return null;
  const dies = diesDes(ultimRebut(rebuts), ara);
  return { clau: 'rebuts-rancis', n: dies, text: `Últim rebut ${faDies(dies)}`, to: 'avis' };
}

/* Enllaços trencats (cap a un script, una font, un fitxer o una skill que no
   hi són, o una menció a una skill inexistent) i peces òrfenes, del
   compilador, en ordre de severitat. Per a l'explorador tots són fallades
   («enllaços trencats o orfes», encàrrec de la llesca), encara que el Mapa en
   gradue uns quants de mitjans. L2 (260930): el compilador ja diu «fitxer
   absent» del fitxer que un contracte declara i no és al disc. */
export const CODIS_TRENCATS = Object.freeze([
  ['script-absent', 'script absent', 'scripts absents'],
  ['font-absent', 'font absent', 'fonts absents'],
  ['fitxer-absent', 'fitxer absent', 'fitxers absents'],
  ['skill-fantasma', 'skill fantasma', 'skills fantasma'],
  ['crida-inexistent', 'crida a una skill inexistent', 'crides a skills inexistents'],
  ['orfe', 'peça òrfena', 'peces òrfenes']
]);

const ESTATS = Object.freeze({
  pols: (dades, ara) => {
    const { orfes, fantasmes } = resumSkills(dades.skills);
    const recompte = recompteArtefactes(dades);
    return [
      // Ordre del Mestre, 261004 · el vocabulari del pols ja no xoca amb el del Mapa (MESURES.pols).
      compte('orfes', orfes.length, 'skill al disc fora del manifest', 'skills al disc fora del manifest', 'error'),
      compte('fantasmes', fantasmes.length, 'skill al manifest sense disc', 'skills al manifest sense disc', 'error'),
      saturat(recompte)
        ? compte('saturacio', recompte - LLINDAR_SATURACIO, 'artefacte per damunt del llindar', 'artefactes per damunt del llindar', 'avis')
        : null,
      estatRebuts(dades.rebuts, ara)
    ];
  },
  explorador: (mapa) => {
    const perCodi = perClau(mapa.avisos, 'codi');
    return [
      ...CODIS_TRENCATS.map(([codi, un, molts]) => compte(codi, perCodi.get(codi) ?? 0, un, molts, 'error')),
      compte('inferides', perClau(mapa.arestes, 'confianca').get('inferit') ?? 0,
        'relació inferida de la prosa', 'relacions inferides de la prosa', 'info')
    ];
  },
  fluxos: (mapa) => [
    compte('sense-lector', puntsDeTrobada(mapa).filter(esSenseLector).length, 'lloc amb faena i cap lector', 'llocs amb faena i cap lector', 'avis')
  ],
  calendari: (mapa) => {
    const perEstat = perClau(mapa.tasques, 'estat');
    return [
      compte('mort', perEstat.get('mort') ?? 0, 'tasca morta', 'tasques mortes', 'error'),
      compte('sense-llancador', perEstat.get('declarat-sense-llancador') ?? 0, 'tasca sense llançador', 'tasques sense llançador', 'avis'),
      compte('sense-declaracio', perEstat.get('llancador-sense-declaracio') ?? 0, 'tasca sense declaració', 'tasques sense declaració', 'avis'),
      compte('desconegut', perEstat.get('desconegut') ?? 0, 'tasca d’estat desconegut', 'tasques d’estat desconegut', 'info')
    ];
  },
  /* Mana el semàfor de la pàgina, no la severitat del codi: un fora-segell
     (alt al Mapa) en una skill amb un sol avís és ambre, i «Important». */
  inventari: (mapa) => {
    const r = resumInventari(mapa);
    return [
      compte('roig', r.roges, 'skill amb semàfor roig', 'skills amb semàfor roig', 'error'),
      compte('ambre', r.ambres, 'skill amb semàfor ambre', 'skills amb semàfor ambre', 'avis'),
      compte('orfenes', r.orfenes, 'skill òrfena', 'skills òrfenes', 'avis'),
      compte('fora-cens', r.foraDeCens, 'skill fora del cens', 'skills fora del cens', 'avis'),
      compte('sense-disparador', r.senseDisparador, 'skill sense disparador útil', 'skills sense disparador útil', 'avis')
    ];
  },
  entrades: (mapa) => [compte('opaques', xifresDelMas(mapa).opaques, 'skill opaca', 'skills opaques', 'avis')],
  // Informació: les seues quatre peces ja avisen a fluxos, calendari, actors i salut.
  agents: (mapa) => Object.entries(pecesAgents(mapa))
    .filter(([, peca]) => peca.estat !== 'EN MARXA')
    .map(([id, peca]) => ({ clau: id, n: 1, text: `${TITOLS_PECES_AGENTS[id]}: ${peca.estat.toLocaleLowerCase('ca')}`, to: 'info' })),
  actors: (mapa) => {
    const { programades, candats, senseLlancador, sol } = capesActors(mapa);
    return [
      compte('launchd-morta', programades.filter((t) => t.estat === 'mort').length, 'tasca de launchd morta', 'tasques de launchd mortes', 'error'),
      compte('sense-consumidor', candats.filter((c) => c.acreditat === false).length, 'candat sense consumidor', 'candats sense consumidor', 'avis'),
      compte('per-acreditar', candats.filter((c) => c.acreditat === null).length, 'candat per acreditar', 'candats per acreditar', 'info'),
      compte('sense-llancador', senseLlancador.length, 'tasca sense llançador', 'tasques sense llançador', 'info'),
      compte('sol-sense-lector', sol.filter(esSenseLector).length, 'lloc sense lector', 'llocs sense lector', 'info')
    ];
  },
  // Les severitats del Mapa ja són el criteri (TO_SEVERITAT de les vistes del Mapa).
  salut: (mapa) => {
    const resum = resumMapa(mapa);
    const perSeveritat = new Map(resum.perSeveritat);
    return [
      compte('alta', perSeveritat.get('alta') ?? 0, 'avís alt', 'avisos alts', 'error'),
      compte('mitjana', perSeveritat.get('mitjana') ?? 0, 'avís mitjà', 'avisos mitjans', 'avis'),
      compte('baixa', perSeveritat.get('baixa') ?? 0, 'avís baix', 'avisos baixos', 'info'),
      compte('sense-mesura', mapa.salut.length - resum.mesurades, 'mètrica sense mesura (N/A)', 'mètriques sense mesura (N/A)', 'info')
    ];
  }
});

/**
 * Estats de la coberta d'una pàgina: [{ clau, n, text, to }], el més greu
 * primer; null sense font o per a una pàgina desconeguda.
 */
export function estatsPagina(id, fonts = {}, ara = Date.now()) {
  const regla = ESTATS[id];
  const { dada } = regla ? fontDe(id, fonts) : {};
  if (!dada) return null;
  // sort és estable (ES2019): dins d'un mateix to, l'ordre de la regla.
  return regla(dada, ara).filter(Boolean).sort((x, y) => ORDRE_TO[x.to] - ORDRE_TO[y.to]);
}

/** El nivell de l'etiqueta és el to del primer estat, si és 'error' o 'avis'; si no, null. */
export function nivellEstats(estats) {
  const to = estats?.[0]?.to;
  return to === 'error' || to === 'avis' ? to : null;
}

/**
 * Correcció 261004 (verificador de la tercera passada, punt 5) · Cap xifra
 * destacada sense targeta. Cada mètrica de la coberta (h5, MESURES) i cada
 * estat (ESTATS) resumix una xifra que té targeta i pàgina pròpia: el mateix
 * número és al títol o al subtítol d'eixa targeta. Ací, per pàgina, la
 * targeta (o les dues, si la mètrica en porta dues xifres) de cada mètrica,
 * en l'ordre de MESURES, i la de cada estat, per la seua clau. La prova de
 * consolaPagines.test.js ho contrasta amb les targetes de la Consola: una
 * mètrica o un estat nou sense targeta la fa roja. Derogat per l'ordre del
 * Mestre del 261004 (xat: cap xifra solta): «N rutes documentals», «N agents
 * atòmics», «N candats», els enllaços trencats, les skills sense disparador i
 * els llocs del sòl sense lector com a xifres de coberta sense targeta.
 */
const congela = (perPagina) => Object.freeze(Object.fromEntries(
  Object.entries(perPagina).map(([id, valor]) => [id, Object.freeze(valor)])
));
export const XIFRES_DE_LES_MESURES = congela({
  pols: [['registres-de-consum'], ['rebuts-de-lectura'], ['skills-del-manifest', 'skills-fora-del-manifest']],
  explorador: [['nodes'], ['arestes']],
  calendari: [['tasques-del-mapa'], ['tasques-del-mapa'], ['tasques-del-mapa']],
  inventari: [['skills']],
  entrades: [['skills'], ['rutes-documentals']],
  salut: [['avisos', 'avisos-alts'], ['metriques-amb-mesura']],
  fluxos: [['cadenes-declarades'], ['suggeriments-de-la-prosa']],
  agents: [['agents-atomics'], ['agents']],
  actors: [['agents'], ['candats'], ['coses-que-corren-soles']]
});
export const XIFRES_DELS_ESTATS = congela({
  pols: { orfes: 'skills-fora-del-manifest', fantasmes: 'skills-sense-disc', saturacio: 'artefactes-actius', 'rebuts-rancis': 'ultim-rebut' },
  explorador: { ...Object.fromEntries(CODIS_TRENCATS.map(([codi]) => [codi, 'enllacos-trencats'])), inferides: 'arestes' },
  fluxos: { 'sense-lector': 'llocs-sense-lector' },
  calendari: { mort: 'tasques-del-mapa', 'sense-llancador': 'tasques-del-mapa', 'sense-declaracio': 'tasques-del-mapa', desconegut: 'tasques-del-mapa' },
  inventari: {
    roig: 'skills-amb-avisos', ambre: 'skills-amb-avisos', orfenes: 'skills-orfenes', 'fora-cens': 'skills-fora-d-algun-cens',
    'sense-disparador': 'skills-sense-disparador'
  },
  entrades: { opaques: 'skills-opaques' },
  agents: { fluxos: 'peca-fluxos-de-treball', tauler: 'peca-tauler', sols: 'peca-agents-sols', vigilants: 'peca-vigilants' },
  actors: {
    'launchd-morta': 'coses-que-corren-soles', 'sense-consumidor': 'candats', 'per-acreditar': 'candats',
    'sense-llancador': 'tasques-sense-llancador', 'sol-sense-lector': 'llocs-del-sol'
  },
  salut: { alta: 'avisos-alts', mitjana: 'avisos', baixa: 'avisos', 'sense-mesura': 'metriques-amb-mesura' }
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
 * emmagatzematge mut) no hi ha base per a dir que res és nou. El nivell és el
 * del desglossament de la coberta (nivellEstats): una sola font de veritat.
 * `ara` és el rellotge dels rebuts del pols; el tauler passa el mateix a
 * estatsPagina perquè coberta i etiqueta coincidisquen.
 */
export function etiquetesPagina(id, fonts, vist, ara = Date.now()) {
  if (!ESTATS[id]) return [];
  const { dada, estat } = fontDe(id, fonts);
  if (!dada) {
    if (estat === 'loading') return [];
    return [estat === 'error' ? ETIQUETES.reparar : ETIQUETES.senseFont];
  }
  const etiquetes = [];
  // Una lectura fallida amb l'última instantània bona també és una fallada.
  const nivell = estat === 'error' ? 'error' : nivellEstats(estatsPagina(id, fonts, ara));
  if (nivell === 'error') etiquetes.push(ETIQUETES.reparar);
  else if (nivell === 'avis') etiquetes.push(ETIQUETES.important);
  if (typeof vist === 'string' && vist !== signaturaPagina(id, fonts)) etiquetes.push(ETIQUETES.nou);
  return etiquetes;
}

/**
 * Etiquetes de les cinc targetes del pols, amb la mateixa llei: sense
 * consola.json, totes diuen per què; amb dades, només on hi ha base.
 * `ara` és el rellotge dels rebuts rancis (T12).
 */
export function etiquetesPols(dades, estat, ara = Date.now()) {
  const IDS = ['carrega', 'consums', 'credits', 'rebuts', 'skills'];
  if (!dades) {
    const comu = estat === 'loading' ? [] : [estat === 'error' ? ETIQUETES.reparar : ETIQUETES.senseFont];
    return Object.fromEntries(IDS.map((id) => [id, comu]));
  }
  const recompte = recompteArtefactes(dades);
  const { orfes, fantasmes } = resumSkills(dades.skills);
  return {
    carrega: recompte === null ? [ETIQUETES.senseFont] : saturat(recompte) ? [ETIQUETES.important] : [],
    consums: [],
    credits: dades.credits?.length ? [] : [ETIQUETES.senseFont],
    rebuts: rebutsRancis(dades.rebuts, ara) ? [ETIQUETES.important] : [],
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
