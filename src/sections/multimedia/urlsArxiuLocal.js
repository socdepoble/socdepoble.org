/**
 * urlsArxiuLocal.js — Les URL d'objecte (blob:) del Gestor d'arxius locals
 * (IDEA-54/55 · Onada 261029_1605), amb revocació estricta.
 *
 * Un registre per flux asíncron (una pàgina de miniatures, un detall, una
 * previsualització WebP). En acabar el flux (canvi de pàgina, de selecció o de
 * volum, desmuntatge) es TANCA: revoca totes les seues URL i, des d'eixe
 * moment, no en crea cap més. Així una resposta tardana (el testimoni de
 * generació) no deixa cap blob: penjat.
 *
 *   · visor(blob): només amb un MIME de la llista blanca del motor (ràster,
 *     àudio, vídeo i PDF; mai HTML, SVG, XML ni JS). Si no, null.
 *   · descarrega(blob): el mateix contingut retipat a application/octet-stream
 *     (decisions.md): el navegador el baixa, mai el pinta.
 */
import { MIME_DESCARREGA_LOCAL, creaRegistreUrlsLocals } from './motorMultimediaLocal.js';

export function creaUrlsArxiuLocal({ urlApi = globalThis.URL } = {}) {
  const visor = creaRegistreUrlsLocals({ urlApi });
  const descarregues = new Set();
  let tancat = false;

  const revocaDescarrega = (url) => {
    try {
      urlApi.revokeObjectURL(url);
    } catch {
      /* ja revocada */
    }
  };

  return Object.freeze({
    /** Una URL per a pintar (img, audio, video, PDF en pestanya nova), o null. */
    visor(blob) {
      return tancat ? null : visor.crea(blob);
    },
    /** Una URL de descàrrega (application/octet-stream), o null. */
    descarrega(blob) {
      if (tancat || !blob || typeof blob.slice !== 'function' || typeof urlApi?.createObjectURL !== 'function') return null;
      const url = urlApi.createObjectURL(blob.slice(0, blob.size, MIME_DESCARREGA_LOCAL));
      descarregues.add(url);
      return url;
    },
    /** Revoca una URL d'este registre. Cert si n'era. */
    revoca(url) {
      if (visor.revoca(url)) return true;
      if (!descarregues.delete(url)) return false;
      revocaDescarrega(url);
      return true;
    },
    /** Revoca totes les URL i no en deixa crear cap més. */
    tanca() {
      tancat = true;
      visor.revocaTot();
      for (const url of descarregues) revocaDescarrega(url);
      descarregues.clear();
    },
    get tancat() {
      return tancat;
    },
    get vives() {
      return visor.vives + descarregues.size;
    }
  });
}
