/**
 * xmlAeat.js — els registres del llibre en l'XML de remissió de l'AEAT, com a
 * fitxer de PROVA: no s'envia res.
 *
 * Onada 6 (261009, front «gestoria-facturació»: «estar preparada per a la
 * nova llei VeriFactu»). L'arrel és RegFactuSistemaFacturacion de l'esquema
 * SuministroLR (Orde HAC/1177/2024): una Cabecera amb l'obligat a emetre i un
 * RegistroFactura per registre, amb el seu RegistroAlta o RegistroAnulacion
 * (esquema SuministroInformacion), en l'ordre del llibre. Els valors ja són
 * els de l'empremta (empremta.js): dates dd-mm-aaaa, imports amb punt i dos
 * decimals i la mateixa Huella, de manera que l'empremta es pot tornar a
 * calcular des de l'XML. Les línies de la factura no hi van (l'AEAT no les
 * demana): sí el desglossament per tipus d'IVA o per exempció.
 *
 * Els espais de noms són IDENTIFICADORS dins del fitxer, com els de l'XLSX:
 * ningú s'hi connecta (privacitat.test.js els té a la llista blanca).
 *
 * PENDENT, i per això és de prova (complet: false):
 *   · el bloc SistemaInformatico: les dades del productor del programari, que
 *     naixen de la declaració responsable, que encara no existix. Sense, es
 *     deixa un comentari al seu lloc; no s'inventa cap identificador;
 *   · la remissió (SOAP amb certificat, des del servidor) i les respostes.
 * [NO VERIFICAT] L'ordre i els noms dels elements segueixen l'esquema tal com
 * el coneixem; cal validar-lo amb els XSD vigents de l'AEAT abans de la fase
 * de remissió. JS pur: sense DOM, React ni xarxa.
 */
import { errorAmbCodi } from '../comu.js';
import { dataAEAT, importAEAT } from './empremta.js';

export const ESPAIS_DE_NOMS = Object.freeze({
  sum: 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroLR.xsd',
  sum1: 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SuministroInformacion.xsd'
});
/* IDVersion del registre, Impuesto 01 (IVA) i ClaveRegimen 01 (règim general). */
export const ID_VERSIO = '1.0';
const IMPOST_IVA = '01';
const REGIM_GENERAL = '01';
/* Com a molt, registres per remissió. */
export const MAX_REGISTRES = 1000;
/* Els camps del bloc SistemaInformatico, en l'ordre de l'esquema. */
const CAMPS_SISTEMA = Object.freeze([
  ['nom', 'NombreRazon'], ['nif', 'NIF'], ['nomSistema', 'NombreSistemaInformatico'], ['idSistema', 'IdSistemaInformatico'],
  ['versio', 'Version'], ['numeroInstalacio', 'NumeroInstalacion'], ['nomesVerifactu', 'TipoUsoPosibleSoloVerifactu'],
  ['multiOT', 'TipoUsoPosibleMultiOT'], ['indicadorMultiplesOT', 'IndicadorMultiplesOT']
]);

const ESCAPS = Object.freeze({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&apos;' });
const escapa = (text) => String(text).replace(/[&<>"']/g, (c) => ESCAPS[c]);
/* Un element de SuministroInformacion amb text, o amb fills ja fets. */
const el = (nom, contingut) => `<sum1:${nom}>${contingut}</sum1:${nom}>`;
const text = (nom, valor) => el(nom, escapa(valor));
/* Un tipus d'IVA amb dos decimals: 21 → '21.00', 10.5 → '10.50'. */
const tipusAEAT = (percentatge) => (Math.round(percentatge * 100) / 100).toFixed(2);

function idFactura(ref, idEmisor, sufix = '') {
  return text(`IDEmisorFactura${sufix}`, idEmisor) + text(`NumSerieFactura${sufix}`, ref.numSerie)
    + text(`FechaExpedicionFactura${sufix}`, dataAEAT(ref.dataExpedicio));
}

function encadenament(registre) {
  const anterior = registre.encadenament;
  if (!anterior) return el('Encadenamiento', text('PrimerRegistro', 'S'));
  return el('Encadenamiento', el('RegistroAnterior', idFactura(anterior, anterior.idEmisor) + text('Huella', anterior.empremta)));
}

function sistemaInformatic(sistema) {
  if (!sistema) return '<!-- PENDENT: SistemaInformatico (les dades del productor naixen de la declaració responsable, que encara no existix) -->';
  return el('SistemaInformatico', CAMPS_SISTEMA.map(([camp, nom]) => text(nom, sistema[camp])).join(''));
}

/* La cua comuna: encadenament, sistema, data i hora, tipus d'empremta i empremta. */
const cua = (registre, sistema) => encadenament(registre) + sistemaInformatic(sistema)
  + text('FechaHoraHusoGenRegistro', registre.dataHoraHusGeneracio) + text('TipoHuella', registre.tipusEmpremta) + text('Huella', registre.empremta);

function detallDesglossament(grup) {
  const qualificacio = grup.exempcio ? text('OperacionExenta', grup.exempcio) : text('CalificacionOperacion', grup.qualificacio);
  return el('DetalleDesglose', text('Impuesto', IMPOST_IVA) + text('ClaveRegimen', REGIM_GENERAL) + qualificacio
    + (grup.exempcio ? '' : text('TipoImpositivo', tipusAEAT(grup.tipusIva)))
    + text('BaseImponibleOimporteNoSujeto', importAEAT(grup.base))
    + (grup.exempcio ? '' : text('CuotaRepercutida', importAEAT(grup.quota))));
}

function registreAlta(r, sistema) {
  const f = r.factura;
  const llista = (contenidor, element, refs) => el(contenidor, refs.map((ref) => el(element, idFactura(ref, r.idEmisor))).join(''));
  return el('RegistroAlta', [
    text('IDVersion', ID_VERSIO),
    el('IDFactura', idFactura(r, r.idEmisor)),
    text('NombreRazonEmisor', f.emissor.nom),
    text('TipoFactura', r.tipusFactura),
    f.tipusRectificativa ? text('TipoRectificativa', f.tipusRectificativa) : '',
    f.rectificades?.length ? llista('FacturasRectificadas', 'IDFacturaRectificada', f.rectificades) : '',
    f.substituides?.length ? llista('FacturasSustituidas', 'IDFacturaSustituida', f.substituides) : '',
    f.importRectificat ? el('ImporteRectificacion', text('BaseRectificada', importAEAT(f.importRectificat.base))
      + text('CuotaRectificada', importAEAT(f.importRectificat.quota))) : '',
    f.dataOperacio ? text('FechaOperacion', dataAEAT(f.dataOperacio)) : '',
    text('DescripcionOperacion', f.descripcio),
    f.destinatari ? el('Destinatarios', el('IDDestinatario', text('NombreRazon', f.destinatari.nom) + text('NIF', f.destinatari.nif))) : '',
    el('Desglose', f.desglossament.map(detallDesglossament).join('')),
    text('CuotaTotal', importAEAT(r.quotaTotal)),
    text('ImporteTotal', importAEAT(r.importTotal)),
    cua(r, sistema)
  ].join(''));
}

function registreAnulacio(r, sistema) {
  return el('RegistroAnulacion', text('IDVersion', ID_VERSIO) + el('IDFactura', idFactura(r, r.idEmisor, 'Anulada')) + cua(r, sistema));
}

/**
 * L'XML de prova dels registres d'una cadena (altes i anul·lacions, en l'ordre del llibre).
 * Llança XML_INVALID (sense registres, d'un altre emissor que l'obligat, o una entrada que no és un
 * registre) i XML_MASSA_REGISTRES (més de MAX_REGISTRES).
 * @param {ReadonlyArray<object>} registres la cadena d'un emissor
 * @param {{ obligat: { nom: string, nif: string }, sistema?: object|null }} opcions
 *   obligat: qui emet (el de la configuració); sistema: el bloc SistemaInformatico, si ja es coneix
 * @returns {{ xml: string, registres: number, complet: boolean, pendents: string[] }}
 */
export function xmlDeRegistres(registres, { obligat, sistema = null } = {}) {
  if (!Array.isArray(registres) || registres.length === 0) throw errorAmbCodi('XML_INVALID', 'No hi ha cap registre per a posar a l’XML.');
  if (registres.length > MAX_REGISTRES) throw errorAmbCodi('XML_MASSA_REGISTRES', `Una remissió porta com a molt ${MAX_REGISTRES} registres.`);
  if (!obligat?.nom || !obligat?.nif) throw errorAmbCodi('XML_INVALID', 'L’XML necessita el nom i el NIF de qui emet.');
  const cos = registres.map((r) => {
    if (r?.idEmisor !== obligat.nif) throw errorAmbCodi('XML_INVALID', 'Tots els registres han de ser de l’obligat de la capçalera.');
    if (r.tipusRegistre === 'alta') return registreAlta(r, sistema);
    if (r.tipusRegistre === 'anulacio') return registreAnulacio(r, sistema);
    throw errorAmbCodi('XML_INVALID', 'Una entrada del llibre no és ni una alta ni una anul·lació.');
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sum:RegFactuSistemaFacturacion xmlns:sum="${ESPAIS_DE_NOMS.sum}" xmlns:sum1="${ESPAIS_DE_NOMS.sum1}">`,
    `<sum:Cabecera>${el('ObligadoEmision', text('NombreRazon', obligat.nom) + text('NIF', obligat.nif))}</sum:Cabecera>`,
    ...cos.map((registre) => `<sum:RegistroFactura>${registre}</sum:RegistroFactura>`),
    '</sum:RegFactuSistemaFacturacion>',
    ''
  ].join('\n');
  const pendents = sistema ? [] : ['SistemaInformatico'];
  return { xml, registres: registres.length, complet: pendents.length === 0, pendents };
}
