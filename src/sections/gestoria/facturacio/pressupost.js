/**
 * pressupost.js — el pressupost: una oferta sense valor fiscal, en sèrie pròpia.
 *
 * Fora de la cadena fiscal: no es registra mai a Veri*Factu (creaRegistreAlta
 * el refusa, perquè no és una factura emesa) ni porta empremta. Es calcula com
 * la factura completa (F1) que serà, amb la mateixa anàlisi de facturaEmesa.js,
 * perquè el client veja les xifres que pagarà.
 *   · Sèrie pròpia: «P2026-0001» (serie.js). Cap prefix recomanat de factura
 *     és P, i la configuració de l'empresa no el deixa triar per a factures.
 *   · Validesa de 90 dies des de la data: validFins és l'últim dia en què es
 *     pot acceptar.
 *   · facturaDePressupost el convertix en factura sense copiar res a mà: les
 *     persones, les línies, la descripció i la retenció passen tal qual, i la
 *     factura es torna a calcular amb la llei del dia que s'emet
 *     (creaFacturaEmesa); el càlcul del pressupost no es copia mai.
 *
 * Congelat com la factura: un pressupost no s'edita, se'n fa un altre.
 * JS pur: sense DOM, React ni xarxa; no importa res del registre.
 */
import { jsonCanonic } from '../../tractors/nucli/canonic.js';
import { copiaCongelada, errorAmbCodi, esDataIso, sumaDies, textNet } from './comu.js';
import { analitzaCosComplet, creaFacturaEmesa, opcionsDeRecalcul } from './facturaEmesa.js';
import { compacta, llegixNumSerie } from './serie.js';

export const ESQUEMA_PRESSUPOST = 'sdp.gestoria.pressupost.v1';
export const PREFIX_PRESSUPOST = 'P';
export const VALIDESA_DIES = 90;

/* Un número de factura que pareix de la sèrie dels pressupostos: compacte
   (sense espais ni coixinet, en majúscules) comença per P i una xifra. No
   només la forma canònica: «P2026-2», «P2026-00002» o «p2026-0002» no són
   números d'esta sèrie, però una factura amb eixe número s'hi confondria. */
const PAREIX_DE_PRESSUPOST = new RegExp(`^${PREFIX_PRESSUPOST}\\d`, 'i');
const pareixDePressupost = (numSerie) => PAREIX_DE_PRESSUPOST.test(compacta(numSerie));

function analitza(dades, opcions) {
  const errors = [];
  if (!dades || typeof dades !== 'object') {
    return { errors: ['Cal un pressupost: { numero, data, emissor, destinatari, linies }.'], pressupost: null };
  }
  const numero = textNet(dades.numero);
  if (llegixNumSerie(numero)?.prefix !== PREFIX_PRESSUPOST) {
    errors.push(`El número del pressupost va en la seua sèrie: ${PREFIX_PRESSUPOST}, l'any i el número («${PREFIX_PRESSUPOST}2026-0001»).`);
  }
  if (!esDataIso(dades.data)) errors.push('La data del pressupost ha de ser una data «aaaa-mm-dd» que existisca.');
  const { errors: delCos, cos } = analitzaCosComplet(dades, opcions);
  errors.push(...delCos);
  if (errors.length) return { errors, pressupost: null };
  return {
    errors,
    pressupost: {
      esquema: ESQUEMA_PRESSUPOST,
      numero,
      data: dades.data,
      validFins: sumaDies(dades.data, VALIDESA_DIES),
      ...cos,
      moneda: 'EUR'
    }
  };
}

/**
 * Els errors d'un pressupost (llista buida si és vàlid). No llança.
 * @param {object} dades { numero, data, emissor, destinatari, descripcio?, linies, retencio? }
 * @param {{ tipusIva?: number[] }} [opcions]
 * @returns {string[]}
 */
export function validaPressupost(dades, opcions) {
  return analitza(dades, opcions).errors;
}

/**
 * El pressupost, validat, calculat i congelat en profunditat.
 * Llança un error amb codi PRESSUPOST_INVALID i la llista a `detalls`.
 * @param {object} dades
 * @param {{ tipusIva?: number[] }} [opcions]
 * @returns {Readonly<object>}
 */
export function creaPressupost(dades, opcions) {
  const { errors, pressupost } = analitza(dades, opcions);
  if (errors.length) throw errorAmbCodi('PRESSUPOST_INVALID', `Pressupost no vàlid: ${errors.join(' ')}`, errors);
  return copiaCongelada(pressupost);
}

/* Cert si és un pressupost eixit de creaPressupost: congelat i que, tornat a
   calcular des de les seues dades, dona exactament el mateix. */
export function esPressupost(pressupost) {
  if (!pressupost || typeof pressupost !== 'object' || !Object.isFrozen(pressupost) || pressupost.esquema !== ESQUEMA_PRESSUPOST) return false;
  try {
    const { errors, pressupost: recalculat } = analitza(pressupost, opcionsDeRecalcul(pressupost));
    return errors.length === 0 && jsonCanonic(recalculat) === jsonCanonic(pressupost);
  } catch {
    return false;
  }
}

/**
 * La factura completa (F1) d'un pressupost acceptat, sense copiar res a mà.
 * Llança PRESSUPOST_INVALID si no és un pressupost, PRESSUPOST_CADUCAT si
 * l'acceptació cau fora de la seua validesa i FACTURA_INVALIDA com creaFacturaEmesa.
 * @param {object} pressupost eixit de creaPressupost
 * @param {object} factura les dades pròpies de la factura
 * @param {string} factura.numSerie de la sèrie de les factures, mai de la del pressupost
 * @param {string} factura.dataExpedicio
 * @param {string} [factura.dataAcceptacio] quan el client el va acceptar; per defecte, la d'expedició
 * @param {string} [factura.dataOperacio]
 * @param {string} [factura.venciment]
 * @param {{ metode: string, compte?: string }} [factura.cobrament]
 * @param {{ tipusIva?: number[] }} [opcions] les de creaFacturaEmesa: la llei del dia que s'emet
 * @returns {Readonly<object>}
 */
export function facturaDePressupost(pressupost, factura = {}, opcions) {
  if (!esPressupost(pressupost)) throw errorAmbCodi('PRESSUPOST_INVALID', 'Cal un pressupost eixit de creaPressupost: validat i congelat.');
  const { numSerie, dataExpedicio, dataAcceptacio, dataOperacio, venciment, cobrament } = factura ?? {};
  if (pareixDePressupost(numSerie)) {
    throw errorAmbCodi('FACTURA_INVALIDA', `La factura va en la sèrie de les factures: ${PREFIX_PRESSUPOST} és la dels pressupostos.`);
  }
  if (dataAcceptacio !== undefined && !esDataIso(dataAcceptacio)) {
    throw errorAmbCodi('FACTURA_INVALIDA', 'La data d\'acceptació del pressupost, si es dona, és una data «aaaa-mm-dd».');
  }
  const acceptacio = dataAcceptacio ?? dataExpedicio;
  if (esDataIso(acceptacio)) {
    if (acceptacio < pressupost.data || acceptacio > pressupost.validFins) {
      throw errorAmbCodi('PRESSUPOST_CADUCAT', `El pressupost ${pressupost.numero} es podia acceptar del ${pressupost.data} al ${pressupost.validFins}: fes-ne un de nou.`);
    }
    if (esDataIso(dataExpedicio) && dataExpedicio < acceptacio) {
      throw errorAmbCodi('FACTURA_INVALIDA', 'La factura no pot ser anterior a l\'acceptació del pressupost.');
    }
  }
  return creaFacturaEmesa({
    tipus: 'F1',
    numSerie,
    dataExpedicio,
    ...(dataOperacio === undefined ? {} : { dataOperacio }),
    ...(venciment === undefined ? {} : { venciment }),
    ...(cobrament === undefined ? {} : { cobrament }),
    emissor: pressupost.emissor,
    destinatari: pressupost.destinatari,
    descripcio: pressupost.descripcio,
    /* La base de cada línia no passa: la factura la torna a calcular. */
    linies: pressupost.linies,
    ...(pressupost.retencio ? { retencio: { percentatge: pressupost.retencio.percentatge } } : {})
  }, opcions);
}
