/**
 * registreAlta.js — el registre d'ALTA d'una factura emesa (RegistroAlta de Veri*Factu).
 *
 * Pren una factura de creaFacturaEmesa i l'últim registre de la cadena de
 * l'emissor (o null si és el primer), posa l'hora de generació amb el
 * desfase d'Europe/Madrid, calcula l'empremta encadenada i ho torna tot
 * congelat en profunditat. No hi ha cap funció que el modifique: una
 * correcció és una factura rectificativa (un altre registre d'alta) o una
 * anul·lació (registreAnulacio.js).
 *
 * Fora del registre i de l'empremta, a propòsit: el número d'ordre és local
 * (la posició a la cadena, per a l'IndexedDB i per a detectar reordenacions)
 * i la factura sencera hi va perquè el llibre siga autosuficient.
 *
 * PENDENT (fase de remissió, al servidor): els indicadors de subsanació i de
 * rebuig previ, el SistemaInformatico i la remissió mateixa. JS pur: sense
 * DOM, React ni xarxa.
 */
import { copiaCongelada, errorAmbCodi } from '../comu.js';
import { esFacturaEmesa } from '../facturaEmesa.js';
import { TIPUS_EMPREMTA, ZONA_AEAT, dataHoraAmbHus, empremtaDeRegistre } from './empremta.js';
import { ESQUEMA_ALTA, encadenamentDe, validaRegistre } from './validacio.js';

export { ESQUEMA_ALTA };

/* L'anterior ha de ser un registre vàlid del mateix emissor; null vol dir primer registre. */
export function comprovaAnterior(anterior, idEmisor) {
  if (anterior === null) return;
  const errors = validaRegistre(anterior);
  if (errors.length) throw errorAmbCodi('REGISTRE_INVALID', `El registre anterior no és vàlid: ${errors.join(' ')}`, errors);
  if (anterior.idEmisor !== idEmisor) {
    throw errorAmbCodi('CADENA_ALIENA', 'El registre anterior és d\'un altre emissor: cada NIF porta la seua cadena.');
  }
}

/**
 * El registre d'alta, amb l'empremta encadenada i congelat en profunditat.
 * @param {object} p
 * @param {object} p.factura eixida de creaFacturaEmesa
 * @param {object|null} p.anterior l'últim registre de la cadena de l'emissor, o null
 * @param {number|Date} [p.instant] per defecte, ara
 * @param {string} [p.zona] per defecte, Europe/Madrid
 * @param {SubtleCrypto} [p.subtle] per defecte, crypto.subtle
 * @returns {Promise<Readonly<object>>}
 */
export async function creaRegistreAlta({ factura, anterior = null, instant = Date.now(), zona = ZONA_AEAT, subtle } = {}) {
  if (!esFacturaEmesa(factura)) {
    throw errorAmbCodi('REGISTRE_INVALID', 'Cal una factura eixida de creaFacturaEmesa: validada i congelada.');
  }
  comprovaAnterior(anterior, factura.emissor.nif);
  const dataHoraHusGeneracio = dataHoraAmbHus(instant, zona);
  if (factura.dataExpedicio > dataHoraHusGeneracio.slice(0, 10)) {
    throw errorAmbCodi('DATA_FUTURA', 'No es pot registrar una factura amb data d\'expedició posterior a hui.');
  }
  const senseEmpremta = {
    esquema: ESQUEMA_ALTA,
    tipusRegistre: 'alta',
    ordre: anterior === null ? 1 : anterior.ordre + 1,
    idEmisor: factura.emissor.nif,
    numSerie: factura.numSerie,
    dataExpedicio: factura.dataExpedicio,
    tipusFactura: factura.tipus,
    quotaTotal: factura.quotaTotal,
    importTotal: factura.importTotal,
    factura,
    encadenament: encadenamentDe(anterior),
    dataHoraHusGeneracio,
    tipusEmpremta: TIPUS_EMPREMTA
  };
  const registre = copiaCongelada({ ...senseEmpremta, empremta: await empremtaDeRegistre(senseEmpremta, subtle) });
  const errors = validaRegistre(registre);
  if (errors.length) throw errorAmbCodi('REGISTRE_INVALID', `Registre d'alta no vàlid: ${errors.join(' ')}`, errors);
  return registre;
}
