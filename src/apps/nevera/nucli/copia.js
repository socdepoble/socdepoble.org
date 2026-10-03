/**
 * La Nevera de Casa · la còpia de seguretat (`sdp.nevera.copia.v1`), pura.
 *
 *   { esquema: 'sdp.nevera.copia.v1', creada?: '<ISO 8601>', dades: { seq, llistes, propis, casa, darreraLlista } }
 *
 * La còpia és un fitxer JSON que la persona descarrega i guarda on vol: les
 * dades no ixen mai del dispositiu per cap altre camí. En recuperar-la,
 * `dades` passa per la mateixa llista blanca que el disc (normalitzaEstat):
 * el que no s'entén es descarta, mai s'executa ni es fusiona.
 */
import { normalitzaEstat } from './nevera.js';

export const ESQUEMA_COPIA = 'sdp.nevera.copia.v1';
/** Un milió de caràcters: una llista de la compra real no hi arriba ni de lluny. */
export const MAX_COPIA = 1000000;

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/** La còpia d'un estat (net). `creada`: el moment, si la vista el vol posar. */
export function creaCopia(estat, { creada } = {}) {
  const net = normalitzaEstat(estat);
  return {
    esquema: ESQUEMA_COPIA,
    ...(typeof creada === 'string' && creada ? { creada } : {}),
    dades: { seq: net.seq, llistes: net.llistes, propis: net.propis, casa: net.casa, darreraLlista: net.darreraLlista }
  };
}

/** El text del fitxer: JSON amb sagnat i un salt final. */
export function serialitzaCopia(estat, opcions) {
  return `${JSON.stringify(creaCopia(estat, opcions), null, 2)}\n`;
}

/**
 * Llig el text d'un fitxer de còpia.
 * @returns {{ ok: true, estat: object, resum: { llistes: number, articles: number, propis: number } }
 *         | { ok: false, error: string }}
 */
export function llegixCopia(text) {
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, error: 'El fitxer és buit.' };
  if (text.length > MAX_COPIA) return { ok: false, error: 'El fitxer és massa gran per a ser una còpia de la nevera.' };
  let cru;
  try {
    cru = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El fitxer no és un JSON vàlid.' };
  }
  if (!esObjecte(cru) || cru.esquema !== ESQUEMA_COPIA || !esObjecte(cru.dades)) {
    return { ok: false, error: `No és una còpia de La Nevera de Casa (${ESQUEMA_COPIA}).` };
  }
  const estat = normalitzaEstat(cru.dades);
  const articles = estat.llistes.reduce((suma, llista) => suma + llista.linies.length, 0);
  return { ok: true, estat, resum: { llistes: estat.llistes.length, articles, propis: estat.propis.length } };
}
