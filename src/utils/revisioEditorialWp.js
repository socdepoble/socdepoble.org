/**
 * revisioEditorialWp.js — P1-f (Onada R6, Bloc 2) + P0-111 / R18.2 (Onada R18) ·
 * L'estat de revisió editorial dels articles importats de socdepoble.net,
 * sense arrossegar el tesaurus doctoral al Nucli Verge.
 *
 * P0-111 + R18.2:
 *   1. Els 20 ítems verificats del Catàleg d’Arbres Emblemàtics i Monumentals
 *      de La Torre de les Maçanes (Associació El Rentonar · estudi tècnic de
 *      Pedro Ferrer Rodriguez: pàgina WP-619 + 19 arbres WP-1751..WP-2014, incloent
 *      WP-1768 Llorer de Villa María) tenen estat inicial `'aprovat'` cap a la
 *      sèrie `arbres-monumentals`, mentre els restants continuen `'pendent_admin'`
 *      fins a revisió humana.
 *   2. Permet sincronitzar les revisions amb el servidor (Supabase darrere del
 *      port neutral `backendPort.js`, capacitat opcional `'revisionsEditorialsWp'`)
 *      i conserva en el mateix registre local les `destinacions` de Workspace.
 */

import { destinacioWorkspaceWp } from '../data/importacio/destinacionsWorkspaceWp.js';
export { DESTINACIONS_WORKSPACE_WP, destinacioWorkspaceWp } from '../data/importacio/destinacionsWorkspaceWp.js';

export const CLAU_STORAGE_REVISIO_WP = 'sdp_revisio_editorial_wp_v1';

export const ESTATS_REVISIO_WP_VALIDS = Object.freeze([
  'pendent_admin',
  'aprovat',
  'amb_observacions'
]);

/** Els 20 `wp_id` reals del Catàleg d'Arbres d'El Rentonar (1 portada + 19 arbres). */
export const WP_IDS_CATALEG_ARBRES_RENTONAR = Object.freeze([
  619,
  1786, 1784, 1782, 1780, 1778, 1776, 1774, 1772, 1770, 1768,
  1766, 1764, 1762, 1760, 1758, 1756, 1754, 1751, 2014
]);

const CONJUNT_WP_IDS_RENTONAR = new Set(WP_IDS_CATALEG_ARBRES_RENTONAR.map(String));

export function esWpIdCatalegArbresRentonar(wpId) {
  if (wpId === null || wpId === undefined) return false;
  return CONJUNT_WP_IDS_RENTONAR.has(String(wpId).trim());
}

export function estatInicialArticleImportatWp(wpId, estatFont = null) {
  if (esWpIdCatalegArbresRentonar(wpId)) return 'aprovat';
  return ESTATS_REVISIO_WP_VALIDS.includes(estatFont) ? estatFont : 'pendent_admin';
}

export function obteStorageSegur(storage) {
  if (storage !== undefined) return storage;
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function llegeixEstatRevisioEditorial(storage) {
  const st = obteStorageSegur(storage);
  if (!st) return { estats: {}, anotacions: {}, destinacions: {} };
  try {
    const raw = st.getItem(CLAU_STORAGE_REVISIO_WP);
    if (!raw) return { estats: {}, anotacions: {}, destinacions: {} };
    const parsed = JSON.parse(raw);
    return {
      estats: parsed?.estats && typeof parsed.estats === 'object' ? parsed.estats : {},
      anotacions: parsed?.anotacions && typeof parsed.anotacions === 'object' ? parsed.anotacions : {},
      destinacions: Object.fromEntries(Object.entries(parsed?.destinacions || {}).filter(([id, valor]) =>
        /^[1-9][0-9]{0,9}$/.test(id) && destinacioWorkspaceWp(valor, null) !== null)),
    };
  } catch {
    return { estats: {}, anotacions: {}, destinacions: {} };
  }
}

export function desaEstatRevisioEditorial(nouEstat, storage) {
  const st = obteStorageSegur(storage);
  if (!st) return false;
  try {
    st.setItem(CLAU_STORAGE_REVISIO_WP, JSON.stringify(nouEstat));
    return true;
  } catch {
    return false;
  }
}

export function desaRevisioArticleImportat(wpId, { estat, nota } = {}, storage) {
  const clau = String(wpId ?? '').trim();
  const actual = llegeixEstatRevisioEditorial(storage);
  const nouEstat = {
    estats: { ...actual.estats, ...(estat ? { [clau]: estat } : {}) },
    anotacions: { ...actual.anotacions, ...(nota !== undefined ? { [clau]: nota } : {}) },
    destinacions: actual.destinacions,
  };
  desaEstatRevisioEditorial(nouEstat, storage);
  return nouEstat;
}

/** La tria editorial és del navegador; l’ACK de la publicació ve del port. */
export function desaDestinacioArticleImportat(wpId, destinacio, storage) {
  const id = typeof wpId === 'number' && Number.isSafeInteger(wpId) ? String(wpId) : wpId;
  if (typeof id !== 'string' || !/^[1-9][0-9]{0,9}$/.test(id) || destinacioWorkspaceWp(destinacio, null) === null) {
    throw new TypeError('La destinació de l’article importat no és vàlid.');
  }
  const actual = llegeixEstatRevisioEditorial(storage);
  const nouEstat = { ...actual, destinacions: { ...actual.destinacions, [id]: destinacio } };
  if (!desaEstatRevisioEditorial(nouEstat, storage)) throw new Error('No s’ha pogut desar la destinació en este navegador.');
  return nouEstat;
}

/**
 * Sincronitza l'estat local amb el port neutral (`revisionsEditorialsWp`) si el
 * backend actiu ofereix la capacitat. Sense la capacitat o sense sessió d'admin,
 * conserva intacta la còpia local sense llançar error a la interfície.
 */
export async function sincronitzaRevisionsEditorialsWpAmbServidor({ storage, config = {} } = {}) {
  try {
    const port = await import('../data/backendPort.js');
    if (typeof port.teCapacitat !== 'function' || !port.teCapacitat('revisionsEditorialsWp')) {
      return { sincronitzat: false, estat: llegeixEstatRevisioEditorial(storage) };
    }
    const files = await port.llistaRevisionsEditorialsWp(config);
    if (!Array.isArray(files)) {
      return { sincronitzat: false, estat: llegeixEstatRevisioEditorial(storage) };
    }
    const actual = llegeixEstatRevisioEditorial(storage);
    const estats = { ...actual.estats };
    const anotacions = { ...actual.anotacions };
    for (const fila of files) {
      const id = String(fila?.wpId ?? '').trim();
      if (!id) continue;
      if (ESTATS_REVISIO_WP_VALIDS.includes(fila.estat)) estats[id] = fila.estat;
      if (typeof fila.nota === 'string') anotacions[id] = fila.nota;
    }
    const fusionat = { estats, anotacions, destinacions: actual.destinacions };
    desaEstatRevisioEditorial(fusionat, storage);
    return { sincronitzat: true, estat: fusionat, totalRemot: files.length };
  } catch {
    return { sincronitzat: false, estat: llegeixEstatRevisioEditorial(storage) };
  }
}

export async function desaRevisioArticleImportatAmbServidor(
  wpId,
  { estat, nota = '', autoria = null, desti = null } = {},
  { storage, config = {} } = {}
) {
  const local = desaRevisioArticleImportat(wpId, { estat, nota }, storage);
  try {
    const port = await import('../data/backendPort.js');
    if (typeof port.teCapacitat !== 'function' || !port.teCapacitat('revisionsEditorialsWp')) {
      return { remot: false, estat: local };
    }
    const desada = await port.desaRevisioEditorialWp(
      {
        wpId: Number(wpId),
        estat,
        nota: typeof nota === 'string' ? nota : '',
        ...(typeof autoria === 'string' && autoria.trim() ? { autoria: autoria.trim() } : {}),
        ...(typeof desti === 'string' && desti.trim() ? { desti: desti.trim() } : {})
      },
      config
    );
    return { remot: true, fila: desada, estat: local };
  } catch {
    return { remot: false, estat: local };
  }
}

/* B3-4 (Onada R6, Bloc 3) · Les insígnies i els casos d'ús editorials són
   constants pures: viuen ací perquè el Mur pinte els filtres de la revisió
   sense importar el transformador ni el tesaurus. El transformador les
   reexporta amb els mateixos noms. */
export const INSIGNIES_CASOS_US_IMPORTACIO = Object.freeze({
  galeria_fotos: {
    id: 'galeria_fotos',
    icona: '🖼️',
    etiqueta: 'Galeria de fotos',
    descripcio: 'Transformada en mosaic Pedra Seca amb VisorImatges accessible.',
  },
  video_youtube_vimeo: {
    id: 'video_youtube_vimeo',
    icona: '🎬',
    etiqueta: 'Vídeo (YouTube/Vimeo)',
    descripcio: ' Incrustació responsive amb càrrega diferida i títol accessible.',
  },
  pdf_drive_docs: {
    id: 'pdf_drive_docs',
    icona: '📄',
    etiqueta: 'Document PDF / Drive',
    descripcio: 'Targeta documental descarregable sense iframe trencat.',
  },
  iframe_extern_substituit: {
    id: 'iframe_extern_substituit',
    icona: '🛡️',
    etiqueta: 'Iframe extern substituït',
    descripcio: 'Substituït per component natiu o targeta d’enllaç segura.',
  },
  enllacos_interns_reescrits: {
    id: 'enllacos_interns_reescrits',
    icona: '🔗',
    etiqueta: 'Enllaços interns reescrits',
    descripcio: 'Enllaços de socdepoble.net redirigits a /mur, /events, /page o /pobles.',
  },
  pobles_etiquetats: {
    id: 'pobles_etiquetats',
    icona: '📍',
    etiqueta: 'Pobles etiquetats',
    descripcio: 'Connectat automàticament al mur de cada poble i comarca.',
  },
});

export const CASOS_US_EDITORIALS = Object.freeze(
  Object.values(INSIGNIES_CASOS_US_IMPORTACIO).map((c) => ({
    id: c.id,
    icona: c.icona,
    titol: c.etiqueta,
    label: `${c.icona} ${c.etiqueta}`,
    etiqueta: c.etiqueta,
    descripcio: c.descripcio,
  }))
);
