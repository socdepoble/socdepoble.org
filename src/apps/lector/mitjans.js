/**
 * Lector de notícies · les imatges i els vídeos que sap servir el servei de
 * notícies (ordre del Mestre, 261024, 15:05: la miniatura de la fila i el
 * vídeo dins de la lectura), i la seua regla per a les adreces de les fonts.
 *
 *   mitjansDe(servei) → {
 *     imatge(urlOriginal) → l'adreça de la imatge DEL SERVEI (que fa de pont), o null
 *     video(enllac)       → { proveidor, id, incrustacio, enllac } o null
 *     adreca              → (valor) → l'adreça tal com la llegiria el servei, o null;
 *                           o bé null, si el servei no dona la seua regla
 *   }
 * Les tres són pures i no fan xarxa: només criden servei.imatge, servei.video
 * i servei.adrecaPersonal (src/data/adaptadors/noticies/client.js, per la
 * plataforma). L'app no sap cap adreça ni cap origen: ni el del servei ni el
 * de YouTube. Sense servei (la llavor, un port de proves) o amb un servei que
 * no en sap, sempre null: cap miniatura i cap vídeo, mai l'origen de la font
 * directament.
 * El que torna el servei no es dona per bo: només una adreça absoluta segura
 * (protocol https) passa; una altra cosa (un esquema estrany, un objecte mal
 * fet, una excepció) és null.
 *
 * Correcció L-10 (261024 Lector final) · «Afig una font» (GestioFonts.jsx)
 * desava adreces que el client del servei mai no enviaria (un port, més
 * caràcters dels que deixa eixir la Frontissa) o que el servei rebutja (una IP,
 * localhost): la font quedava a l'arbre com una fallada 'adreca' per sempre.
 * La regla és UNA, la del client (adrecaPersonalDelClient), i arriba per la
 * mateixa porta del servei, sense cap còpia a l'app: el servei l'exposa, pura,
 * com a `adrecaPersonal(valor)` → l'adreça normalitzada que enviaria, o null
 * (https, sense usuari ni port, com a molt els caràcters que deixa eixir la
 * Frontissa, un nom públic amb punt, cap IP ni nom local). `adreca` la crida i
 * no se'n fia (només una adreça https neta passa). Un servei que no la dona
 * (un de proves, la llavor, un client que encara no l'exposa) deixa `adreca` a
 * null, i el formulari fa la seua comprovació de sempre.
 */

const CAP = Object.freeze({ imatge: () => null, video: () => null, adreca: null });

/* Una adreça absoluta amb el protocol segur, o null. */
function segura(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function mitjansDe(servei) {
  if (!servei || typeof servei !== 'object') return CAP;
  const imatge = (urlOriginal) => {
    if (typeof urlOriginal !== 'string' || urlOriginal === '' || typeof servei.imatge !== 'function') return null;
    try {
      return segura(servei.imatge(urlOriginal));
    } catch {
      return null;
    }
  };
  const video = (enllac) => {
    if (typeof enllac !== 'string' || enllac === '' || typeof servei.video !== 'function') return null;
    try {
      const cru = servei.video(enllac);
      const incrustacio = segura(cru?.incrustacio);
      if (cru?.proveidor !== 'youtube' || typeof cru.id !== 'string' || cru.id === '' || !incrustacio) return null;
      return Object.freeze({ proveidor: 'youtube', id: cru.id, incrustacio, enllac: segura(cru.enllac) || segura(enllac) });
    } catch {
      return null;
    }
  };
  /* Correcció L-10 · La regla del client per a una adreça de font, si el servei la dona. */
  const adreca = typeof servei.adrecaPersonal === 'function'
    ? (valor) => {
      if (typeof valor !== 'string' || valor === '') return null;
      try {
        return segura(servei.adrecaPersonal(valor));
      } catch {
        return null;
      }
    }
    : null;
  return Object.freeze({ imatge, video, adreca });
}

export const SENSE_MITJANS = CAP;
