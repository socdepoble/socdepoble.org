/**
 * configEmpresa.js — l'esquema de la configuració de l'empresa que emet les factures.
 *
 * Només l'esquema i la validació. Els valors (el NIF, el nom legal i el
 * comercial, els domicilis, els comptes de cobrament, el logo, els prefixos i
 * la data de pas) viuen en la configuració de l'ordinador de l'empresa, mai al
 * codi ni a les proves.
 *
 * La factura no hi apunta: emissorDe() en trau l'emissor amb el domicili
 * triat, i la factura el congela tal com era el dia que s'emet (un mateix NIF
 * pot tindre diverses adreces). Del compte de cobrament, la factura només
 * porta la referència opaca (cobrament.compte); el número viu ací, i
 * compteDe() el resol quan s'imprimix.
 *
 * La data de pas és el dia en què el programa comença a emetre amb Veri*Factu
 * en una sèrie NOVA. Fins aleshores factura l'eina externa, la sèrie de la
 * qual queda com a llegat tancat (llegat.js i comprovaEmissio de serie.js).
 * JS pur: sense DOM, React ni xarxa.
 */
import { validaNif } from '../nucli/nif.js';
import { copiaCongelada, errorAmbCodi, esDataIso, esReferenciaOpaca, textValid } from './comu.js';
import { TIPUS_FACTURA, validaDomicili } from './facturaEmesa.js';
import { PREFIX_PRESSUPOST } from './pressupost.js';

export const ESQUEMA_CONFIG_EMPRESA = 'sdp.gestoria.config-empresa.v1';

const CAMPS = Object.freeze(['esquema', 'nif', 'nom', 'nomComercial', 'domicilis', 'domiciliFiscal', 'comptes', 'logo', 'facturacio']);
const CAMPS_FACTURACIO = Object.freeze(['dataPas', 'prefixos']);
const MAX_NOM = 120;
const MAX_DOMICILIS = 20;
const MAX_COMPTES = 10;
const PREFIX = /^[A-Z]{1,10}$/;
/* IBAN (ISO 13616): el país, dues xifres de control i el compte. */
const IBAN = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/;
/* La llargària per país que coneixem; la resta, la de la forma general. */
const LLARGARIA_IBAN = Object.freeze({ ES: 24 });

const donat = (valor) => valor !== undefined && valor !== null;
const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);

/**
 * L'IBAN net (sense espais, en majúscules) si té la forma i les xifres de control bones (mòdul 97); null si no.
 * @param {string} text
 * @returns {string|null}
 */
export function normalitzaIban(text) {
  if (typeof text !== 'string') return null;
  const net = text.replace(/\s+/g, '').toUpperCase();
  if (!IBAN.test(net) || (LLARGARIA_IBAN[net.slice(0, 2)] ?? net.length) !== net.length) return null;
  let resta = 0;
  for (const caracter of net.slice(4) + net.slice(0, 4)) {
    const valor = caracter >= 'A' ? String(caracter.charCodeAt(0) - 55) : caracter;
    for (const xifra of valor) resta = (resta * 10 + Number(xifra)) % 97;
  }
  return resta === 1 ? net : null;
}

function analitzaDomicilis(config, errors) {
  const domicilis = [];
  if (!Array.isArray(config.domicilis) || config.domicilis.length === 0 || config.domicilis.length > MAX_DOMICILIS) {
    errors.push(`Cal almenys un domicili (com a molt ${MAX_DOMICILIS}): { id, adreca, codiPostal, poblacio }.`);
    return domicilis;
  }
  config.domicilis.forEach((entrada, i) => {
    const { id, ...resta } = esObjecte(entrada) ? entrada : {};
    const idBo = esReferenciaOpaca(id) && !domicilis.some((d) => d.id === id);
    if (!idBo) errors.push(`Domicili ${i + 1}: cal un id propi (minúscules, xifres i guions, sense repetir).`);
    const { errors: delDomicili, domicili } = validaDomicili(resta, `el domicili ${i + 1}`);
    errors.push(...delDomicili);
    if (idBo && domicili) domicilis.push({ id, ...domicili });
  });
  if (!domicilis.some((d) => d.id === config.domiciliFiscal)) {
    errors.push('domiciliFiscal és l\'id d\'un dels domicilis: el que va per defecte a les factures.');
  }
  return domicilis;
}

function analitzaComptes(config, errors) {
  const comptes = [];
  if (!donat(config.comptes)) return comptes;
  if (!Array.isArray(config.comptes) || config.comptes.length > MAX_COMPTES) {
    errors.push(`Els comptes de cobrament són una llista (com a molt ${MAX_COMPTES}) de { id, iban, titular? }.`);
    return comptes;
  }
  config.comptes.forEach((compte, i) => {
    const idBo = esReferenciaOpaca(compte?.id) && !comptes.some((c) => c.id === compte.id);
    if (!idBo) errors.push(`Compte ${i + 1}: cal un id propi (minúscules, xifres i guions, sense repetir), mai el número del compte.`);
    const iban = normalitzaIban(compte?.iban);
    if (!iban) errors.push(`Compte ${i + 1}: l'IBAN no és vàlid (la forma o les xifres de control no quadren).`);
    const ambTitular = donat(compte?.titular);
    const titular = ambTitular ? textValid(compte.titular, MAX_NOM) : null;
    if (ambTitular && !titular) errors.push(`Compte ${i + 1}: el titular, si hi és, és un text d'una línia.`);
    if (idBo && iban && (!ambTitular || titular)) comptes.push({ id: compte.id, iban, ...(titular ? { titular } : {}) });
  });
  return comptes;
}

function analitzaFacturacio(facturacio, errors) {
  if (!donat(facturacio)) return null;
  if (!esObjecte(facturacio)) {
    errors.push('facturacio és { dataPas, prefixos }.');
    return null;
  }
  for (const camp of Object.keys(facturacio)) if (!CAMPS_FACTURACIO.includes(camp)) errors.push(`facturacio: camp desconegut «${camp}».`);
  const ambPas = donat(facturacio.dataPas);
  if (ambPas && !esDataIso(facturacio.dataPas)) errors.push('La data de pas a Veri*Factu és una data «aaaa-mm-dd».');
  const prefixos = {};
  if (donat(facturacio.prefixos) && !esObjecte(facturacio.prefixos)) {
    errors.push('facturacio.prefixos és { tipus de factura: prefix }.');
  } else if (donat(facturacio.prefixos)) {
    for (const [tipus, prefix] of Object.entries(facturacio.prefixos)) {
      if (!TIPUS_FACTURA.includes(tipus)) errors.push(`facturacio.prefixos: tipus de factura desconegut «${tipus}».`);
      else if (typeof prefix !== 'string' || !PREFIX.test(prefix)) errors.push(`facturacio.prefixos.${tipus}: d'1 a 10 lletres majúscules.`);
      else if (prefix === PREFIX_PRESSUPOST) errors.push(`facturacio.prefixos.${tipus}: ${PREFIX_PRESSUPOST} és la sèrie dels pressupostos.`);
      else prefixos[tipus] = prefix;
    }
  }
  return { ...(ambPas ? { dataPas: facturacio.dataPas } : {}), ...(Object.keys(prefixos).length ? { prefixos } : {}) };
}

function analitza(config) {
  if (!esObjecte(config)) return { errors: ['La configuració de l\'empresa és un objecte.'], config: null };
  const errors = [];
  if (config.esquema !== ESQUEMA_CONFIG_EMPRESA) errors.push(`esquema ha de ser ${ESQUEMA_CONFIG_EMPRESA}.`);
  for (const camp of Object.keys(config)) if (!CAMPS.includes(camp)) errors.push(`Camp desconegut: «${camp}».`);
  const { valid, tipus, normalitzat } = validaNif(config.nif);
  if (!valid || tipus === 'IVA-UE') errors.push('El NIF de l\'empresa ha de ser un DNI, NIE o CIF vàlid.');
  const nom = textValid(config.nom, MAX_NOM);
  if (!nom) errors.push(`El nom legal (raó social, o nom i cognoms) és obligatori: una línia de com a molt ${MAX_NOM} caràcters.`);
  const ambComercial = donat(config.nomComercial);
  const nomComercial = ambComercial ? textValid(config.nomComercial, MAX_NOM) : null;
  if (ambComercial && !nomComercial) errors.push('El nom comercial, si hi és, és un text d\'una línia.');
  const domicilis = analitzaDomicilis(config, errors);
  const comptes = analitzaComptes(config, errors);
  if (donat(config.logo) && !esReferenciaOpaca(config.logo)) errors.push('El logo és una referència a un fitxer de la configuració (minúscules, xifres i guions).');
  const facturacio = analitzaFacturacio(config.facturacio, errors);
  if (errors.length) return { errors, config: null };
  return {
    errors,
    config: {
      esquema: ESQUEMA_CONFIG_EMPRESA,
      nif: normalitzat,
      nom,
      ...(nomComercial ? { nomComercial } : {}),
      domicilis,
      domiciliFiscal: config.domiciliFiscal,
      ...(comptes.length ? { comptes } : {}),
      ...(donat(config.logo) ? { logo: config.logo } : {}),
      ...(facturacio && Object.keys(facturacio).length ? { facturacio } : {})
    }
  };
}

/**
 * Els errors de la configuració de l'empresa (llista buida si és vàlida). No llança.
 * @param {object} config
 * @returns {string[]}
 */
export function validaConfigEmpresa(config) {
  return analitza(config).errors;
}

/**
 * La configuració neta (NIF i IBAN normalitzats) i congelada. Llança CONFIG_INVALIDA amb la llista a `detalls`.
 * @param {object} config
 * @returns {Readonly<object>}
 */
export function llegixConfigEmpresa(config) {
  const { errors, config: neta } = analitza(config);
  if (errors.length) throw errorAmbCodi('CONFIG_INVALIDA', `La configuració de l'empresa no és vàlida: ${errors.join(' ')}`, errors);
  return copiaCongelada(neta);
}

/**
 * L'emissor per a creaFacturaEmesa: NIF, nom legal, nom comercial i el domicili
 * triat (per defecte, el fiscal). La factura en congela una còpia: canviar la
 * configuració després no canvia cap factura emesa.
 * @param {object} config
 * @param {{ domicili?: string }} [opcions] l'id del domicili
 * @returns {Readonly<{ nif: string, nom: string, nomComercial?: string, domicili: object }>}
 */
export function emissorDe(config, { domicili: id } = {}) {
  const neta = llegixConfigEmpresa(config);
  const triat = neta.domicilis.find((d) => d.id === (id ?? neta.domiciliFiscal));
  if (!triat) throw errorAmbCodi('DOMICILI_INEXISTENT', `La configuració no té cap domicili «${id}».`);
  const { adreca, codiPostal, poblacio, provincia } = triat;
  return copiaCongelada({
    nif: neta.nif,
    nom: neta.nom,
    ...(neta.nomComercial ? { nomComercial: neta.nomComercial } : {}),
    domicili: { adreca, codiPostal, poblacio, ...(provincia ? { provincia } : {}) }
  });
}

/**
 * El compte de cobrament d'una referència (la de cobrament.compte d'una factura), per a imprimir-lo.
 * @param {object} config
 * @param {string} id
 * @returns {Readonly<{ id: string, iban: string, titular?: string }>}
 */
export function compteDe(config, id) {
  const compte = (llegixConfigEmpresa(config).comptes ?? []).find((c) => c.id === id);
  if (!compte) throw errorAmbCodi('COMPTE_INEXISTENT', `La configuració no té cap compte «${id}».`);
  return compte;
}
