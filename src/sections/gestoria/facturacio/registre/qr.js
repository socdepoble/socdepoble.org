/**
 * qr.js — el TEXT del codi QR que porta cada factura emesa amb Veri*Factu.
 *
 * El QR codifica l'adreça del servei de cotejo de l'AEAT amb quatre
 * paràmetres: nif, numserie, fecha (dd-mm-aaaa) i importe (punt i dos
 * decimals), cadascun amb encodeURIComponent. Este mòdul només compon el
 * text: no s'hi connecta mai (qui escaneja és la persona que rep la factura).
 *
 * Les adreces base van en una constant documentada i configurable: el domini
 * definitiu es verifica el dia de l'alta al sistema, i qui el canvie passa
 * `base`, sense tocar el codi. Preproducció és l'entorn de proves de l'AEAT.
 *
 * El dibuix del QR és PENDENT: ISO/IEC 18004, nivell de correcció M, de 30 a
 * 40 mm, a la primera pàgina de la factura. No hi ha cap llibreria de QR al
 * projecte (afegir-ne una és un npm install amb aprovació) i un codificador
 * propi només entrarà quan es puga verificar, com a mínim, amb el vector
 * Reed-Solomon de «HELLO WORLD» en versió 1-M i amb una lectura real.
 * JS pur: sense DOM, React ni xarxa.
 */
import { errorAmbCodi } from '../comu.js';
import { dataAEAT, importAEAT } from './empremta.js';
import { esNifEmissor, esNumSerie } from './validacio.js';

export const URL_COTEJO = Object.freeze({
  produccio: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
  preproduccio: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR'
});

/* El que ha de complir el dibuix (PENDENT): ho llig la maqueta de la factura. */
export const ESPECIFICACIO_QR = Object.freeze({
  norma: 'ISO/IEC 18004',
  correccio: 'M',
  midaMinimaMm: 30,
  midaMaximaMm: 40,
  pagina: 'primera'
});

/**
 * L'adreça de cotejo d'una factura: el text que va dins del QR.
 * @param {{ idEmisor: string, numSerie: string, dataExpedicio: string, importTotal: number }} registre
 *   un registre d'alta (o els seus quatre camps); l'anul·lació no porta QR
 * @param {{ entorn?: 'produccio'|'preproduccio', base?: string }} [opcions]
 * @returns {string}
 */
export function textQR(registre, { entorn = 'produccio', base } = {}) {
  if (registre?.tipusRegistre === 'anulacio') throw errorAmbCodi('QR_INVALID', 'Una anul·lació no porta QR: el porta la factura.');
  const arrel = base ?? URL_COTEJO[entorn];
  if (typeof arrel !== 'string' || !arrel.startsWith('https://') || arrel.includes('?')) {
    throw errorAmbCodi('QR_INVALID', 'L\'adreça base del QR ha de ser https i sense paràmetres.');
  }
  if (!esNifEmissor(registre?.idEmisor)) throw errorAmbCodi('QR_INVALID', 'El QR necessita el NIF de l\'emissor.');
  if (!esNumSerie(registre.numSerie)) throw errorAmbCodi('QR_INVALID', 'El QR necessita el número de sèrie.');
  const parametres = [
    ['nif', registre.idEmisor],
    ['numserie', registre.numSerie],
    ['fecha', dataAEAT(registre.dataExpedicio)],
    ['importe', importAEAT(registre.importTotal)]
  ];
  return `${arrel}?${parametres.map(([clau, valor]) => `${clau}=${encodeURIComponent(valor)}`).join('&')}`;
}
