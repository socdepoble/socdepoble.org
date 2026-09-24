/**
 * consolaPagines.js — les sis pàgines de la Consola Termodinàmica.
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

export const RUTA_CONSOLA = '/consola';

/** Ordre del tauler. Els ids són els segments de ruta: /consola/<id>. */
export const IDS_PAGINES = Object.freeze(['pols', 'explorador', 'calendari', 'inventari', 'entrades', 'salut']);

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
    : TEXT_SENSE_MAPA[estatMapa] ?? TEXT_SENSE_MAPA.absent)
});

/** Copy de la Consola. Si la clau falta, la pàgina es pinta amb el mínim i ho diu en desenvolupament. */
export function copyConsola() {
  return PAGE_COPY.consola ?? { title: 'Consola Termodinàmica', pagines: [] };
}

/** Pàgina pel seu id (segment de ruta), amb el copy de PAGE_COPY; null si no existix. */
export function paginaConsola(id) {
  if (!IDS_PAGINES.includes(id)) return null;
  const copy = copyConsola().pagines?.find((p) => p.id === id);
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
