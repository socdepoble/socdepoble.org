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
 * El dibuix del QR (ISO/IEC 18004, nivell de correcció M, de 30 a 40 mm, a
 * la primera pàgina de la factura) el fa ../qrDibuix.js des de l'Onada 6
 * (261009): un codificador propi, sense dependències, verificat amb el vector
 * Reed-Solomon de «HELLO WORLD» 1-M, el de l'annex I de la norma, un lector
 * escrit dins de la seua prova i una lectura real (el BarcodeDetector del
 * navegador). La factura impresa és facturar/ImpressioFactura.jsx.
 * JS pur: sense DOM, React ni xarxa.
 */
import { errorAmbCodi } from '../comu.js';
import { dataAEAT, importAEAT } from './empremta.js';
import { esNifEmissor, esNumSerie } from './validacio.js';

export const URL_COTEJO = Object.freeze({
  produccio: 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR',
  preproduccio: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR'
});

/* El que complix el dibuix (qrDibuix.js i la regla de la factura a modules.css: 35 mm). */
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
