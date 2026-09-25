/**
 * consolaPagines.js — les pàgines de la Consola Termodinàmica.
 *
 * El text viu a PAGE_COPY.consola (una sola font de veritat per al copy); ací
 * només hi ha l'ordre, la ruta i el resum que cada targeta del tauler calcula
 * de les dades reals. Cap resum inventa una xifra: si la font no ha arribat,
 * diu per què.
 *
 * Mòdul pur (sense React ni JSX) perquè es puga provar sense muntar res.
 */
import { PAGE_COPY } from '../text/pageContent.js';
import { resumSkills } from './consolaContent.js';
import { fluxosDelMapa } from './mapa/fluxosMapa.js';
import { agentsAtomics, capesActors } from './mapa/actorsMapa.js';

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
  return { id, ruta: `${RUTA_CONSOLA}/${id}`, title: copy?.title ?? id, lead: copy?.lead ?? '' };
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
