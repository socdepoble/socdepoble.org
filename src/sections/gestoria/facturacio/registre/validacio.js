/**
 * validacio.js — la forma d'un registre de facturació (alta o anul·lació).
 *
 * Validació d'estructura, síncrona i sense resums: camps admesos i només
 * eixos, tipus i formats, coherència amb l'encadenament i amb la factura, que
 * es torna a calcular sencera des de les seues dades (errorsDeRecalcul de
 * facturaEmesa.js): una factura amb les línies, el destinatari o els totals
 * retocats dins del registre no passa, encara que l'empremta quadre.
 * Que l'empremta quadre amb els camps ho comprova verificaCadena (cadena.js),
 * que la torna a calcular. La comparteixen els constructors, els ports i la
 * verificació, perquè els tres diguen el mateix d'un registre.
 * JS pur: sense DOM, React ni xarxa.
 */
import { validaNif } from '../../nucli/nif.js';
import { CONTROL, esDataIso } from '../comu.js';
import { ESQUEMA_FACTURA, TIPUS_FACTURA, errorsDeRecalcul } from '../facturaEmesa.js';
import { TIPUS_EMPREMTA, esDataHoraHus, esEmpremta } from './empremta.js';

/* Versions del contracte de cada registre: si canvia el que es guarda, canvia el nom. */
export const ESQUEMA_ALTA = 'sdp.gestoria.verifactu.alta.v1';
export const ESQUEMA_ANULACIO = 'sdp.gestoria.verifactu.anulacio.v1';
export const TIPUS_REGISTRE = Object.freeze(['alta', 'anulacio']);

const CAMPS_ALTA = Object.freeze([
  'esquema', 'tipusRegistre', 'ordre', 'idEmisor', 'numSerie', 'dataExpedicio', 'tipusFactura', 'quotaTotal',
  'importTotal', 'factura', 'encadenament', 'dataHoraHusGeneracio', 'tipusEmpremta', 'empremta'
]);
const CAMPS_ANULACIO = Object.freeze([
  'esquema', 'tipusRegistre', 'ordre', 'idEmisor', 'numSerie', 'dataExpedicio', 'encadenament',
  'dataHoraHusGeneracio', 'tipusEmpremta', 'motiu', 'empremta'
]);
const CAMPS_ENCADENAMENT = Object.freeze(['idEmisor', 'numSerie', 'dataExpedicio', 'empremta']);
const NUM_SERIE = /^[\x21-\x7E](?:[\x20-\x7E]*[\x21-\x7E])?$/;
const MAX_NUM_SERIE = 60;
const MAX_MOTIU = 500;
const MAX_CENTIMS = 99999999999999;

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esImport = (valor) => Number.isSafeInteger(valor) && Math.abs(valor) <= MAX_CENTIMS;
export const esNumSerie = (text) => typeof text === 'string' && text.length <= MAX_NUM_SERIE && NUM_SERIE.test(text);

/* Un NIF espanyol ja normalitzat (DNI, NIE o CIF): el de l'emissor d'una cadena. */
export function esNifEmissor(text) {
  const { valid, tipus, normalitzat } = validaNif(text);
  return valid && tipus !== 'IVA-UE' && normalitzat === text;
}

/* La clau que identifica una factura per a l'AEAT: emissor, número de sèrie i data d'expedició. */
export const clauFactura = (r) => `${r.idEmisor}|${r.numSerie}|${r.dataExpedicio}`;

/**
 * L'encadenament (RegistroAnterior) que porta el registre que va darrere d'`anterior`,
 * o null si no n'hi ha (PrimerRegistro).
 * @param {object|null} anterior
 * @returns {{ idEmisor: string, numSerie: string, dataExpedicio: string, empremta: string }|null}
 */
export function encadenamentDe(anterior) {
  if (anterior === null || anterior === undefined) return null;
  return {
    idEmisor: anterior.idEmisor,
    numSerie: anterior.numSerie,
    dataExpedicio: anterior.dataExpedicio,
    empremta: anterior.empremta
  };
}

function validaEncadenament(enc, idEmisor, errors) {
  if (!esObjecte(enc)) {
    errors.push('encadenament ha de ser null (primer registre) o { idEmisor, numSerie, dataExpedicio, empremta }.');
    return;
  }
  for (const camp of Object.keys(enc)) if (!CAMPS_ENCADENAMENT.includes(camp)) errors.push(`encadenament: camp desconegut «${camp}».`);
  if (enc.idEmisor !== idEmisor) errors.push('encadenament: el registre anterior ha de ser del mateix emissor.');
  if (!esNumSerie(enc.numSerie)) errors.push('encadenament: número de sèrie mal format.');
  if (!esDataIso(enc.dataExpedicio)) errors.push('encadenament: data d\'expedició mal formada.');
  if (!esEmpremta(enc.empremta)) errors.push('encadenament: empremta mal formada.');
}

/* Coherència entre el registre d'alta i la factura que porta dins. */
function validaFacturaDeAlta(r, errors) {
  const f = r.factura;
  if (!esObjecte(f) || f.esquema !== ESQUEMA_FACTURA) {
    errors.push(`factura ha de ser una factura emesa (${ESQUEMA_FACTURA}).`);
    return;
  }
  const parelles = [
    [f.emissor?.nif, r.idEmisor, 'l\'emissor'], [f.numSerie, r.numSerie, 'el número de sèrie'],
    [f.dataExpedicio, r.dataExpedicio, 'la data d\'expedició'], [f.tipus, r.tipusFactura, 'el tipus'],
    [f.quotaTotal, r.quotaTotal, 'la quota total'], [f.importTotal, r.importTotal, 'l\'import total']
  ];
  for (const [deFactura, deRegistre, que] of parelles) {
    if (deFactura !== deRegistre) errors.push(`La factura i el registre no coincidixen en ${que}.`);
  }
  /* L'empremta de l'AEAT no cobrix el cos de la factura: es torna a calcular
     des de les seues dades, amb les opcions que se'n deriven (els tipus d'IVA
     de les seues línies, sense el límit de la simplificada), i ha de donar
     exactament la mateixa. */
  for (const error of errorsDeRecalcul(f)) errors.push(`La factura del registre no és la que es va emetre: ${error}`);
}

/**
 * Els errors d'estructura d'un registre (llista buida si és vàlid). No llança.
 * @param {object} r
 * @returns {string[]}
 */
export function validaRegistre(r) {
  if (!esObjecte(r)) return ['El registre ha de ser un objecte.'];
  const errors = [];
  const alta = r.tipusRegistre === 'alta';
  if (!TIPUS_REGISTRE.includes(r.tipusRegistre)) return [`tipusRegistre ha de ser ${TIPUS_REGISTRE.join(' o ')}.`];
  const esquema = alta ? ESQUEMA_ALTA : ESQUEMA_ANULACIO;
  if (r.esquema !== esquema) errors.push(`esquema ha de ser ${esquema}.`);
  for (const camp of Object.keys(r)) if (!(alta ? CAMPS_ALTA : CAMPS_ANULACIO).includes(camp)) errors.push(`Camp desconegut: «${camp}».`);
  if (!Number.isSafeInteger(r.ordre) || r.ordre < 1) errors.push('ordre ha de ser un enter positiu.');
  if (!esNifEmissor(r.idEmisor)) errors.push('idEmisor ha de ser un DNI, NIE o CIF vàlid i normalitzat.');
  if (!esNumSerie(r.numSerie)) errors.push(`numSerie: ASCII imprimible, com a molt ${MAX_NUM_SERIE} caràcters.`);
  if (!esDataIso(r.dataExpedicio)) errors.push('dataExpedicio ha de ser una data «aaaa-mm-dd».');
  if (!esDataHoraHus(r.dataHoraHusGeneracio)) errors.push('dataHoraHusGeneracio ha de ser ISO 8601 amb desfase (2024-01-01T19:20:30+01:00).');
  else if (esDataIso(r.dataExpedicio) && r.dataExpedicio > r.dataHoraHusGeneracio.slice(0, 10)) {
    errors.push('La data d\'expedició no pot ser posterior al dia en què es genera el registre.');
  }
  if (r.tipusEmpremta !== TIPUS_EMPREMTA) errors.push(`tipusEmpremta ha de ser ${TIPUS_EMPREMTA} (SHA-256).`);
  if (!esEmpremta(r.empremta)) errors.push('empremta: 64 xifres hexadecimals en majúscules.');
  if (r.encadenament === null) {
    if (r.ordre !== 1) errors.push('Només el primer registre (ordre 1) va sense encadenament.');
  } else {
    validaEncadenament(r.encadenament, r.idEmisor, errors);
    if (r.ordre === 1) errors.push('El primer registre (ordre 1) no porta encadenament.');
  }
  if (alta) {
    if (!TIPUS_FACTURA.includes(r.tipusFactura)) errors.push(`tipusFactura ha de ser ${TIPUS_FACTURA.join(', ')}.`);
    if (!esImport(r.quotaTotal) || !esImport(r.importTotal)) errors.push('quotaTotal i importTotal van en cèntims enters.');
    validaFacturaDeAlta(r, errors);
  } else {
    if (r.encadenament === null) errors.push('Una anul·lació no pot ser el primer registre: sempre hi ha una alta abans.');
    if (r.motiu !== undefined && (typeof r.motiu !== 'string' || r.motiu.trim() !== r.motiu || r.motiu === ''
      || r.motiu.length > MAX_MOTIU || CONTROL.test(r.motiu))) {
      errors.push(`motiu, si hi és, és un text net de com a molt ${MAX_MOTIU} caràcters.`);
    }
  }
  return errors;
}
