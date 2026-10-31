/**
 * miniaturesLocals.js — Les miniatures i les icones de tipus dels arxius
 * locals (IDEA-54/55 · Onada 261029_1605), per a la «Graella d'àlbum»
 * (GraellaAlbumLocal.jsx) i per a la Columna 2 de /multimedia
 * (MultimediaSection.jsx). Gauntlet 261029 (cicle 1) · Abans vivien dins de
 * GraellaAlbumLocal.jsx: un fitxer de component que exporta un hook i
 * constants trenca la frontera de Fast Refresh (una edició de la graella
 * invalidava fins a MultimediaSection i tombava el Mas, P1-71).
 *
 * Miniatures (useMiniaturesLocals): de quatre en quatre, amb un registre de
 * blob: per pàgina que es TANCA en canviar de pàgina, de filtre o de volum i
 * en desmuntar (revoca les seues URL i no en deixa crear cap de tardana).
 *   · SVG: només `data:image/svg+xml;base64` (fins a 1 MiB), mai blob:.
 *   · Ràster de la llista blanca: fins a 256 KiB, el fitxer tal qual; més
 *     gran, reduït a 320 px amb createImageBitmap + canvas (24 fotos de
 *     càmera senceres en memòria poden passar d'1 GB). Si el navegador no en
 *     sap, l'original fins a 25 MiB; més gran, la icona.
 */
import { useEffect, useRef, useState } from 'react';
import {
  File as IconaFitxer, FileCode, FileQuestion, FileText, Film, Image as IconaImatge, Music
} from 'lucide-react';
import { MAX_BYTES_SVG_DATA, MIMES_VISOR_LOCAL, dataUrlSvgLocal, mimeDeVisorLocal } from './motorMultimediaLocal.js';
import { creaUrlsArxiuLocal } from './urlsArxiuLocal.js';

export const MAX_MINIATURA_BYTES = 25 * 1024 * 1024;
export const MINIATURA_DIRECTA_BYTES = 256 * 1024;
const AMPLE_MINIATURA = 320;
const LOT_MINIATURES = 4;

export const ICONES_TIPUS_LOCAL = Object.freeze({
  imatge: IconaImatge,
  audio: Music,
  video: Film,
  text: FileText,
  codi: FileCode,
  document: IconaFitxer,
  altre: FileQuestion
});

/* Una miniatura reduïda (Blob d'un MIME de la llista blanca) o null si no se'n pot fer. */
async function redueix(blob) {
  if (blob.size <= MINIATURA_DIRECTA_BYTES || typeof globalThis.createImageBitmap !== 'function' || typeof document === 'undefined') {
    return null;
  }
  let bitmap = null;
  try {
    bitmap = await globalThis.createImageBitmap(blob, { resizeWidth: AMPLE_MINIATURA, resizeQuality: 'medium' });
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const reduida = await new Promise((resol) => {
      if (typeof canvas.toBlob === 'function') canvas.toBlob(resol, 'image/webp', 0.8);
      else resol(null);
    });
    return reduida && MIMES_VISOR_LOCAL.has(reduida.type) ? reduida : null;
  } catch {
    return null;
  } finally {
    try { bitmap?.close?.(); } catch { /* ja tancat */ }
  }
}

/* El src d'una miniatura: data: per a l'SVG, blob: (registre) per al ràster, o null. */
async function miniaturaDe(font, el, urls) {
  if (el.vista === 'svg') {
    if (el.mida > MAX_BYTES_SVG_DATA) return null;
    return dataUrlSvgLocal(await font.llig(el.ruta, { midaMaxima: MAX_BYTES_SVG_DATA }));
  }
  if (el.vista !== 'imatge' || !mimeDeVisorLocal(el.ruta) || el.mida > MAX_MINIATURA_BYTES) return null;
  const original = await font.fitxer(el.ruta);
  const reduida = await redueix(original);
  return urls.visor(reduida || original);
}

/**
 * Les miniatures (Map ruta → src) dels elements d'una pàgina. Cada pàgina té
 * el seu registre de blob:, que es tanca quan canvia la pàgina o la font.
 */
export function useMiniaturesLocals(font, elements) {
  const [miniatures, setMiniatures] = useState(() => new Map());
  const imatges = elements.filter((el) => el.vista === 'imatge' || el.vista === 'svg');
  const clau = imatges.map((el) => `${el.ruta}\u0000${el.mida}\u0000${el.modificat}`).join('\u0001');
  const imatgesRef = useRef(imatges);
  imatgesRef.current = imatges;

  useEffect(() => {
    setMiniatures(new Map());
    if (!font || clau === '') return undefined;
    let viu = true;
    const urls = creaUrlsArxiuLocal();
    const llista = imatgesRef.current;
    (async () => {
      for (let i = 0; i < llista.length && viu; i += LOT_MINIATURES) {
        const lot = llista.slice(i, i + LOT_MINIATURES);
        const srcs = await Promise.all(lot.map((el) => miniaturaDe(font, el, urls).catch(() => null)));
        if (!viu) return;
        setMiniatures((abans) => {
          const nou = new Map(abans);
          srcs.forEach((src, j) => {
            if (src) nou.set(lot[j].ruta, src);
          });
          return nou;
        });
      }
    })();
    return () => {
      viu = false;
      urls.tanca();
    };
  }, [font, clau]);

  return miniatures;
}
