/**
 * revisioEditorialWp.js — P1-f (Onada R6, Bloc 2) · L'estat de revisió
 * editorial dels articles importats de socdepoble.net, sense el tesaurus.
 *
 * Només toca el storage (clau `sdp_revisio_editorial_wp_v1`). El detall del Mur
 * (detailSectionMeta.jsx) el necessita per a desar «aprovat» o una nota, i no
 * ha d'arrossegar per això els 450 KB del tesaurus doctoral: este mòdul no
 * importa res. transformadorEditorialWpBlogger.js el reexporta tal com és,
 * amb els mateixos noms, perquè els consumidors de sempre no canvien.
 */

export const CLAU_STORAGE_REVISIO_WP = 'sdp_revisio_editorial_wp_v1';

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
  if (!st) return { estats: {}, anotacions: {} };
  try {
    const raw = st.getItem(CLAU_STORAGE_REVISIO_WP);
    if (!raw) return { estats: {}, anotacions: {} };
    const parsed = JSON.parse(raw);
    return {
      estats: parsed?.estats || {},
      anotacions: parsed?.anotacions || {},
    };
  } catch {
    return { estats: {}, anotacions: {} };
  }
}

export function desaEstatRevisioEditorial(nouEstat, storage) {
  const st = obteStorageSegur(storage);
  if (!st) return;
  try {
    st.setItem(CLAU_STORAGE_REVISIO_WP, JSON.stringify(nouEstat));
  } catch {
    /* Ignora quota */
  }
}

export function desaRevisioArticleImportat(wpId, { estat, nota } = {}, storage) {
  const actual = llegeixEstatRevisioEditorial(storage);
  const nouEstat = {
    estats: { ...actual.estats, ...(estat ? { [wpId]: estat } : {}) },
    anotacions: { ...actual.anotacions, ...(nota !== undefined ? { [wpId]: nota } : {}) },
  };
  desaEstatRevisioEditorial(nouEstat, storage);
  return nouEstat;
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
