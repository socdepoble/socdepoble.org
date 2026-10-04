/**
 * limits.js — Els límits d'entrada del retallador (Onada 4, T3a; RETALLADOR
 * §2). Purs: es proven en Node. El diàleg els aplica abans i després de
 * carregar, siga quin siga el carregador (també l'injectat a les proves).
 */

/** Pes màxim del fitxer d'entrada. */
export const PES_MAXIM_ENTRADA = 25 * 1024 * 1024;
/** Costat màxim descodificat: més enllà, el canvas d'alguns navegadors queda en blanc. */
export const COSTAT_MAXIM = 16384;
/** Píxels màxims descodificats (uns 200 MB de memòria en RGBA). */
export const PIXELS_MAXIMS = 50e6;

export const ERROR_PES = 'Esta foto ocupa més de 25 MB. Tria’n una de més lleugera.';
export const ERROR_PIXELS = 'Esta foto és massa gran per a enquadrar-la al navegador (més de 16.384 píxels per costat o de 50 megapíxels). Redueix-la abans de pujar-la.';
export const ERROR_HEIC = 'Este navegador no pot obrir fotos HEIC. Desa-la o comparteix-la com a JPEG i torna-ho a provar.';

const MISSATGES = { pes: ERROR_PES, pixels: ERROR_PIXELS, heic: ERROR_HEIC };

/** Un error amb codi ('pes' | 'pixels' | 'heic'): el diàleg en mostra el missatge tal qual. */
export class ErrorImatge extends Error {
  constructor(codi) {
    super(MISSATGES[codi] || 'La imatge no es pot obrir.');
    this.name = 'ErrorImatge';
    this.codi = codi;
  }
}

/** 'pes' si el fitxer passa del màxim; null si no se sap o hi cap. */
export function comprovaPes(fitxer) {
  const pes = fitxer?.size;
  return Number.isFinite(pes) && pes > PES_MAXIM_ENTRADA ? 'pes' : null;
}

/** 'pixels' si la imatge descodificada passa dels límits; null si hi cap. */
export function comprovaDimensions(amplada, alcada) {
  if (!(amplada > 0) || !(alcada > 0)) return null;
  return amplada > COSTAT_MAXIM || alcada > COSTAT_MAXIM || amplada * alcada > PIXELS_MAXIMS ? 'pixels' : null;
}

/** HEIC/HEIF pel tipus o, si el sistema no en diu el tipus, per l'extensió. */
export function esHeic(fitxer) {
  if (!fitxer) return false;
  if (/^image\/hei[cf](-sequence)?$/i.test(String(fitxer.type || ''))) return true;
  return /\.hei[cf]$/i.test(String(fitxer.name || ''));
}

export function missatgeLimit(codi) {
  return MISSATGES[codi] || null;
}
