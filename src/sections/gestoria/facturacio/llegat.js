/**
 * llegat.js — l'historial de factures emeses FORA del programa, amb l'eina externa.
 *
 * Decisió del Mestre (261004): la facturació Veri*Factu del programa obri una
 * sèrie NOVA el dia del pas, i la sèrie «F»+AA+NNNN de l'eina externa
 * (contínua des de 2023) queda com a LLEGAT TANCAT. Per això l'historial
 * entra FORA de la cadena:
 *   · mai es registra com a alta: el registre posaria l'hora d'ara a una
 *     factura d'un altre dia i d'un altre programa, i l'encadenaria per sempre;
 *   · no se'n continua la numeració: el programa no emet mai en una sèrie que
 *     es puga confondre amb una del llegat (serie.js, comprovaEmissio);
 *   · només en sembra, per sèrie i any, l'últim número i els forats, per a
 *     l'auditoria, i la llista de sèries tancades que rep comprovaEmissio.
 *
 * Els números es reconeixen en les formes pintades («F26 0001», «F260001» o
 * amb un coixinet davant) i es comparen compactes. Els que no tenen la forma
 * es tornen a part, sense endevinar-los. JS pur: sense DOM, React ni xarxa;
 * no importa res del registre.
 */
import { copiaCongelada, errorAmbCodi } from './comu.js';
import { foratsDeNumeros, llegixNumSerieLlegat } from './serie.js';

export const ESQUEMA_LLEGAT = 'sdp.gestoria.facturacio.llegat.v1';
const MAX_ENTRADES = 100000;

/**
 * El resum del llegat per a l'auditoria: per sèrie i any, l'últim número, els
 * vistos, els absents (de l'1 a l'últim) i els repetits. Congelat.
 * @param {Array<string|{ num: string }>} historial els números emesos amb l'eina externa
 * @returns {Readonly<{ esquema: string, noReconeguts: string[],
 *   series: { prefix: string, any: number, ultim: number, vistos: number, absents: number[], nombreAbsents: number, repetits: number[] }[] }>}
 */
export function sembraLlegat(historial) {
  if (!Array.isArray(historial)) throw new TypeError('Cal la llista dels números emesos amb l\'eina externa.');
  if (historial.length > MAX_ENTRADES) {
    throw errorAmbCodi('LLEGAT_MASSA_GRAN', `L'historial porta més de ${MAX_ENTRADES} números: carrega'l per anys.`);
  }
  const perSerie = new Map();
  const noReconeguts = [];
  for (const entrada of historial) {
    const text = typeof entrada === 'string' ? entrada : entrada?.num;
    const parts = llegixNumSerieLlegat(text);
    if (!parts) {
      noReconeguts.push(typeof text === 'string' ? text.trim() : '');
      continue;
    }
    const clau = `${parts.prefix}|${parts.any}`;
    if (!perSerie.has(clau)) perSerie.set(clau, { prefix: parts.prefix, any: parts.any, numeros: [] });
    perSerie.get(clau).numeros.push(parts.numero);
  }
  const series = [...perSerie.values()]
    .sort((a, b) => (a.prefix === b.prefix ? a.any - b.any : (a.prefix < b.prefix ? -1 : 1)))
    .map(({ prefix, any, numeros }) => ({ prefix, any, vistos: new Set(numeros).size, ...foratsDeNumeros(numeros) }));
  return copiaCongelada({ esquema: ESQUEMA_LLEGAT, series, noReconeguts });
}
