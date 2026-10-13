/**
 * validadorsIdentitat.js — els validadors purs de la Fitxa d'identitat
 * sobirana i de la Finestreta, i el catàleg tancat dels seus camps.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): extraure les dades
 * legals dels papers de la persona (DNI o NIE, número d'afiliació, domicili
 * fiscal, referències cadastrals, RETA…) i tindre-les preparades per a omplir
 * tràmits. Cap valor entra a la fitxa ni ix cap a un formulari sense passar
 * per un validador d'ací: forma, i el control quan l'identificador en porta.
 *
 * Tots tornen el mateix: { valid, normalitzat, avis } congelat. `normalitzat`
 * és null quan no és vàlid (millor buit que fals); `avis` és un text per a la
 * persona quan el valor és vàlid però convé mirar-lo. Les regles marcades
 * [A VERIFICAR] són les del disseny i s'han de contrastar amb la font oficial
 * (TGSS, Cadastre, INE, SUMA) abans de donar-les per certes.
 *
 * El catàleg dels camps (CAMPS_IDENTITAT) no té cap camp per a l'IBAN o el
 * compte, la salut o la discapacitat, el CSV dels documents ni cap credencial:
 * la fitxa no els pot guardar perquè no hi ha on.
 * JS pur: sense DOM, React, xarxa ni emmagatzematge.
 */
import { esDataValida, formatData, parseData } from '../../nucli/dates.js';
import { normalitzaNif, validaNif } from '../../nucli/nif.js';

/* Congela un objecte i tot el que en penja. */
export function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
}

/* Un error amb codi estable perquè la UI decidisca què diu; `detalls` porta la llista d'errors de validació. */
export function errorAmbCodi(codi, missatge, detalls) {
  const error = new Error(missatge);
  error.codi = codi;
  if (detalls !== undefined) error.detalls = detalls;
  return error;
}

const MARQUES = /[̀-ͯ]/g;

/* Text plegat: sense accents ni diacrítics i en minúscules. */
export const plegaText = (text) => (typeof text === 'string' ? text.normalize('NFD').replace(MARQUES, '').toLowerCase() : '');

/**
 * Text plegat amb la MATEIXA llargària que l'original, caràcter a caràcter:
 * una posició del plegat és la mateixa posició de l'original. Així l'extractor
 * busca les etiquetes en el plegat i copia el valor de l'original (amb la Ñ i
 * els accents intactes).
 * @param {string} text
 * @returns {string}
 */
export function plegaAlineat(text) {
  if (typeof text !== 'string') return '';
  let plegat = '';
  for (const caracter of text) {
    const p = caracter.normalize('NFD').replace(MARQUES, '').toLowerCase();
    if (p.length === caracter.length) plegat += p;
    else if (caracter.length === 1) plegat += p[0] ?? ' ';
    else plegat += ' '.repeat(caracter.length);
  }
  return plegat;
}

const ok = (normalitzat, extra = {}) => congela({ valid: true, normalitzat, avis: null, ...extra });
const ko = (avis, extra = {}) => congela({ valid: false, normalitzat: null, avis, ...extra });
const textDe = (valor) => (typeof valor === 'string' ? valor.replace(/\s+/g, ' ').trim() : typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : '');
const CONTROL = /[\u0000-\u001F\u007F]/;

/* Les formes d'identificador personal que un text lliure (una via, una
   denominació, un àlies) no pot amagar: DNI, NIE, NIF d'entitat, IBAN i
   qualsevol tira de nou xifres o més (NAF, telèfon, compte). Fallen cap al
   costat segur. Sense mirada arrere (Safari 16.0): la vora d'abans es
   consumix amb (?:^|…). */
const FORMES_IDENTIFICADOR = Object.freeze([
  /(?:^|[^0-9])\d{1,2}[.\s]?\d{3}[.\s]?\d{3}[\s.-]?[a-z](?![a-z])/i,
  /(?:^|[^a-z])[xyz][\s.-]?\d{7}[\s.-]?[a-z](?![a-z])/i,
  /(?:^|[^a-z])[abcdefghjnpqrsuvw][\s.-]?\d{7}[\s.-]?[0-9a-j](?![a-z0-9])/i,
  /[a-z]{2}\d{2}(?:[\s-]?[a-z0-9]{4}){3,7}/i,
  /\d(?:[\s.-]?\d){8,}/
]);

/** Cert si el text porta alguna forma d'identificador personal. */
export const teFormaIdentificador = (text) => typeof text === 'string' && FORMES_IDENTIFICADOR.some((patro) => patro.test(text));

/* ---------- Identificadors fiscals de persona i d'entitat ---------- */

/** NIF d'una persona: DNI o NIE amb la lletra de control bona (nif.js). */
export function validaNifPersona(text) {
  const r = validaNif(text);
  if ((r.tipus === 'DNI' || r.tipus === 'NIE') && r.valid) return ok(r.normalitzat);
  if (r.tipus === 'CIF' || r.tipus === 'IVA-UE') return ko('És el NIF d’una entitat, no el d’una persona.');
  return ko('Cal un DNI o un NIE amb la lletra de control bona.');
}

/** NIF d'una entitat: CIF amb el control bo. Les associacions porten la G: una altra lletra és vàlida però es marca. */
export function validaNifEntitat(text) {
  const r = validaNif(text);
  if (r.tipus !== 'CIF' || !r.valid) return ko('Cal el NIF d’una entitat (CIF) amb el control bo.');
  return ok(r.normalitzat, { avis: r.normalitzat[0] === 'G' ? null : 'La lletra no és la G de les associacions: comprova la forma jurídica.' });
}

/* L'IPF de la TGSS: un dígit de tipus de document davant (1 DNI, 2
   passaport, 6 NIE) i el número farcit amb zeros. [A VERIFICAR amb la TGSS] */
const IPF_DNI = /^[126](\d{8,9})([A-Z])$/;
const IPF_NIE = /^[126]0?([XYZ]\d{7}[A-Z])$/;

/**
 * Lleva el dígit de tipus i els zeros d'un IPF. Només torna la forma
 * transformada si el DNI o el NIE que en ix passa el control; si no, torna el
 * text normalitzat tal qual (i validaNifPersona el refusarà). Un DNI o NIE
 * que ja és bo no es toca.
 * @param {string} text
 * @returns {string}
 */
export function normalitzaIpf(text) {
  const net = normalitzaNif(text);
  if (validaNifPersona(net).valid) return net;
  const dni = IPF_DNI.exec(net);
  if (dni && Number(dni[1]) < 1e8) {
    const candidat = `${String(Number(dni[1])).padStart(8, '0')}${dni[2]}`;
    if (validaNifPersona(candidat).valid) return candidat;
  }
  const nie = IPF_NIE.exec(net);
  if (nie && validaNifPersona(nie[1]).valid) return nie[1];
  return net;
}

/**
 * Número d'afiliació a la Seguretat Social (NAF): 12 xifres, amb «/», espai
 * o guionet com a separadors. `prov` són les 2 primeres, `n` les 8 del mig, i
 * el control (les 2 últimes) és base % 97, amb base = n < 10^7 ? n + prov·10^7
 * : prov·10^8 + n. [A VERIFICAR amb la font de la TGSS]
 */
export function validaNaf(text) {
  const net = textDe(text).replace(/[\s/-]/g, '');
  if (!/^\d{12}$/.test(net)) return ko('El número d’afiliació són 12 xifres.');
  const prov = Number(net.slice(0, 2));
  const n = Number(net.slice(2, 10));
  const base = n < 1e7 ? n + prov * 1e7 : prov * 1e8 + n;
  return String(base % 97).padStart(2, '0') === net.slice(10) ? ok(net) : ko('El control del número d’afiliació no quadra.');
}

/* ---------- Referència cadastral ---------- */

const PESOS_RC = Object.freeze([13, 15, 12, 5, 4, 17, 9, 21, 3, 7, 1]);
const LLETRES_RC = 'MQWERTYUIOPASDFGHJKLBZX';

/* Valor d'un caràcter: una xifra val ella mateixa; A-N valen 1-14, Ñ 15 i O-Z 16-27. */
function valorRc(c) {
  if (c >= '0' && c <= '9') return Number(c);
  if (c === 'Ñ') return 15;
  if (c >= 'A' && c <= 'N') return c.charCodeAt(0) - 64;
  return c.charCodeAt(0) - 63;
}

function lletraRc(cadena) {
  let suma = 0;
  for (let i = 0; i < PESOS_RC.length; i += 1) suma += valorRc(cadena[i]) * PESOS_RC[i];
  return LLETRES_RC[suma % 23];
}

/**
 * Referència cadastral: 20 caràcters alfanumèrics. Les dues últimes són
 * lletres de control: la primera es calcula sobre rc[0..7]+rc[14..18] i la
 * segona sobre rc[7..14]+rc[14..18], amb els pesos i el mòdul 23. Amb només
 * 14 caràcters (la parcel·la, sense el càrrec ni el control) no es pot
 * verificar: no és vàlida i porta `parcial: true`. [A VERIFICAR amb el vector
 * d'exemple del Cadastre]
 */
export function validaReferenciaCadastral(text) {
  const net = textDe(text).toUpperCase().replace(/[\s.-]/g, '');
  if (/^[0-9A-ZÑ]{14}$/.test(net)) {
    return congela({ valid: false, normalitzat: null, avis: 'Referència de parcel·la (14 caràcters): sense el control no es pot verificar.', parcial: true });
  }
  if (!/^[0-9A-ZÑ]{18}[A-ZÑ]{2}$/.test(net)) return ko('La referència cadastral són 20 caràcters, els dos últims lletres de control.', { parcial: false });
  const primera = lletraRc(net.slice(0, 7) + net.slice(14, 18));
  const segona = lletraRc(net.slice(7, 14) + net.slice(14, 18));
  return primera === net[18] && segona === net[19] ? ok(net, { parcial: false }) : ko('Les lletres de control de la referència cadastral no quadren.', { parcial: false });
}

/* ---------- Codi postal, província i municipi ---------- */

/* Les 52 províncies, en l'ordre del codi de l'INE (01-52), que és també el de
   les dues primeres xifres del codi postal. Les cooficials, amb les dues formes. */
export const PROVINCIES = Object.freeze([
  'Araba/Álava', 'Albacete', 'Alacant/Alicante', 'Almería', 'Ávila', 'Badajoz', 'Illes Balears', 'Barcelona', 'Burgos', 'Cáceres',
  'Cádiz', 'Castelló/Castellón', 'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca', 'Girona', 'Granada', 'Guadalajara', 'Gipuzkoa',
  'Huelva', 'Huesca', 'Jaén', 'León', 'Lleida', 'La Rioja', 'Lugo', 'Madrid', 'Málaga', 'Murcia',
  'Navarra', 'Ourense', 'Asturias', 'Palencia', 'Las Palmas', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife', 'Cantabria', 'Segovia',
  'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'València/Valencia', 'Valladolid', 'Bizkaia', 'Zamora', 'Zaragoza',
  'Ceuta', 'Melilla'
]);

/* La mateixa expressió que facturacio/facturaEmesa.js:100 (no s'importa:
   cada carril porta la seua): cinc xifres, les dues primeres d'una província. */
const CODI_POSTAL = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;

/** La província d'un codi postal vàlid, o null. */
export function provinciaDelCodiPostal(text) {
  const net = textDe(text).replace(/\s/g, '');
  return CODI_POSTAL.test(net) ? PROVINCIES[Number(net.slice(0, 2)) - 1] : null;
}

/** Codi postal espanyol, amb la seua província. */
export function validaCodiPostal(text) {
  const net = textDe(text).replace(/\s/g, '');
  return CODI_POSTAL.test(net) ? ok(net, { provincia: provinciaDelCodiPostal(net) }) : ko('El codi postal són cinc xifres, les dues primeres d’una província (01-52).');
}

/** Codi de municipi de l'INE: cinc xifres, les dues primeres de la província. */
export function validaCodiIne(text) {
  const net = textDe(text);
  return CODI_POSTAL.test(net) ? ok(net) : ko('El codi INE del municipi són cinc xifres, les dues primeres d’una província.');
}

/* ---------- Dates, telèfon, correu ---------- */

/**
 * Una data plausible (1900-2100) en qualsevol format que llig parseData,
 * normalitzada a «aaaa-mm-dd». L'any ha de portar quatre xifres: «15/03/75»
 * seria 2075 per a parseData, i una data de naixement així és falsa.
 */
export function validaData(valor) {
  if (typeof valor === 'string' && !/\d{4}/.test(valor)) return ko('Cal la data amb l’any de quatre xifres.');
  const d = parseData(valor);
  if (!d || d.a < 1900 || d.a > 2100) return ko('No és una data plausible.');
  return ok(formatData(d, 'aaaa-mm-dd'));
}

/** Telèfon espanyol: nou xifres que comencen per 6, 7, 8 o 9, amb el +34 o el 0034 opcional. Torna les nou xifres. */
export function validaTelefon(text) {
  const net = textDe(text).replace(/[\s.()-]/g, '').replace(/^0034/, '+34');
  return /^(?:\+34)?[6789]\d{8}$/.test(net) ? ok(net.slice(-9)) : ko('El telèfon són nou xifres que comencen per 6, 7, 8 o 9.');
}

/** Correu electrònic, de forma. Torna el domini en minúscules. */
export function validaCorreu(text) {
  const net = textDe(text);
  if (net.length > 254 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(net)) return ko('No té forma de correu electrònic.');
  const arroba = net.lastIndexOf('@');
  return ok(`${net.slice(0, arroba)}@${net.slice(arroba + 1).toLowerCase()}`);
}

/* ---------- Activitat ---------- */

/** CNAE: quatre xifres, també «62.01». Torna les quatre xifres. [A VERIFICAR: CNAE-2009 o CNAE-2025] */
export function validaCnae(text) {
  const net = textDe(text);
  if (!/^\d{2}\.?\d{2}$/.test(net)) return ko('El CNAE són quatre xifres, com «62.01».');
  const xifres = net.replace('.', '');
  return xifres.startsWith('00') ? ko('Cap divisió del CNAE comença per 00.') : ok(xifres);
}

/** Epígraf de l'IAE: d'una a quatre xifres i, opcionalment, un o dos decimals. Només la forma. [A VERIFICAR] */
export function validaEpigrafIae(text) {
  const net = textDe(text).replace(/\s/g, '');
  return /^\d{1,4}(?:\.\d{1,2})?$/.test(net) && /[1-9]/.test(net) ? ok(net) : ko('L’epígraf de l’IAE són xifres, com «751.1».');
}

/**
 * Referència d'un objecte tributari de SUMA (el «número fix»): de 6 a 30
 * caràcters alfanumèrics amb alguna xifra. Tipatge estricte: un NIF o una
 * referència cadastral vàlids no són mai una referència de SUMA. Només la
 * forma. [A VERIFICAR]
 */
export function validaRefSuma(text) {
  const net = textDe(text).toUpperCase().replace(/[\s./-]/g, '');
  if (!/^[A-Z0-9]{6,30}$/.test(net) || !/\d/.test(net)) return ko('La referència de SUMA són de 6 a 30 lletres i xifres.');
  if (validaNif(net).valid) return ko('Això és un NIF, no una referència de SUMA.');
  if (validaReferenciaCadastral(net).valid) return ko('Això és una referència cadastral, no una referència de SUMA.');
  return ok(net);
}

/* ---------- Noms i textos ---------- */

/* Lletres (de qualsevol alfabet llatí), espais, apòstrofs, el punt volat i el
   guionet. Cap xifra: un NIF no cap mai en un camp de nom (regressió Xylella). */
const NOM_PROPI = /^\p{L}[\p{L}\p{M}'’·\s-]*$/u;
const NOM_LLOC = /^\p{L}[\p{L}\p{M}'’·\s./()-]*$/u;
const VIA = /^[\p{L}\d][\p{L}\p{M}\d'’·\s.,ºª/()-]*$/u;
const COMPLEMENT = /^[\p{L}\p{M}\d'’·\s.,ºª/-]+$/u;
const ADRECA = /^[\p{L}\d][\p{L}\p{M}\d'’·\s.,:;ºª/()-]*$/u;
const DENOMINACIO = /^[\p{L}\p{N}][\p{L}\p{M}\p{N}'’·\s.,:;&ºª"«»/()-]*$/u;
const lletres = (text) => (text.match(/\p{L}/gu) ?? []).length;

/* Un text lliure amb forma, llargària i lletres mínimes, sense control ni cap identificador amagat. */
function validaTextAmb(patro, { minim, maxim, minimLletres, que }) {
  return (valor) => {
    const net = textDe(valor);
    if (net.length < minim || net.length > maxim || CONTROL.test(net) || !patro.test(net) || lletres(net) < minimLletres) return ko(`${que} no té una forma vàlida.`);
    if (teFormaIdentificador(net)) return ko(`${que} sembla portar un identificador personal.`);
    return ok(net);
  };
}

/** Nom o cognom: lletres, espais, apòstrof, punt volat i guionet; cap xifra. */
export const validaNomPropi = validaTextAmb(NOM_PROPI, { minim: 2, maxim: 80, minimLletres: 2, que: 'El nom' });
/** Nom de lloc (municipi, tipus de via): com un nom propi, i també «/», «.» i parèntesis. */
export const validaNomLloc = validaTextAmb(NOM_LLOC, { minim: 2, maxim: 80, minimLletres: 2, que: 'El nom del lloc' });
/** Nom de la via: lletres i xifres («Carrer 9 d’Octubre»), sense identificadors. */
export const validaVia = validaTextAmb(VIA, { minim: 2, maxim: 120, minimLletres: 2, que: 'La via' });
/** Complement de l'adreça: pis, porta, escala. */
export const validaComplement = validaTextAmb(COMPLEMENT, { minim: 1, maxim: 40, minimLletres: 0, que: 'El complement' });
/** Una adreça sencera en una línia. */
export const validaAdreca = validaTextAmb(ADRECA, { minim: 3, maxim: 200, minimLletres: 3, que: 'L’adreça' });
/** Denominació d'una entitat o d'una mútua. */
export const validaDenominacio = validaTextAmb(DENOMINACIO, { minim: 2, maxim: 160, minimLletres: 2, que: 'La denominació' });

/** Text curt d'una descripció: sense control ni identificadors. */
export function validaText(valor) {
  const net = textDe(valor);
  if (net.length < 2 || net.length > 160 || CONTROL.test(net) || lletres(net) < 2) return ko('El text no té una forma vàlida.');
  return teFormaIdentificador(net) ? ko('El text sembla portar un identificador personal.') : ok(net);
}

/** Número de la via: «12», «12B», «s/n» o un punt quilomètric. */
export function validaNumeroVia(valor) {
  const net = textDe(valor).toUpperCase();
  if (/^S\s?\/?\s?N$/.test(net)) return ok('S/N');
  return /^(?:\d{1,5}[A-Z]?|KM\s?\d{1,3}(?:[.,]\d{1,3})?)$/.test(net) ? ok(net) : ko('El número de la via són xifres, «s/n» o un quilòmetre.');
}

/** Número d'inscripció en un registre: lletres i xifres amb «/», «.» o «-», amb alguna xifra. Mai un NIF. */
export function validaNumeroInscripcio(valor) {
  const net = textDe(valor).toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z0-9][A-Z0-9/.-]{0,24}$/.test(net) || !/\d/.test(net)) return ko('El número d’inscripció són lletres i xifres.');
  if (validaNif(net).valid || teFormaIdentificador(net)) return ko('El número d’inscripció sembla un identificador personal.');
  return ok(net);
}

/** Secció d'un registre: «1», «1A», «1ª», un número romà o el nom de l'ordinal. [A VERIFICAR] */
export function validaSeccio(valor) {
  const net = textDe(valor).toUpperCase();
  return /^(?:\d{1,3}(?:ª|A)?|[IVX]{1,5}|PRIMERA|SEGUNDA|SEGONA|TERCERA)$/.test(net) ? ok(net) : ko('La secció és un número o un ordinal.');
}

/** Un import en cèntims (enter), positiu i per davall del milió d'euros. */
export function validaImport(valor) {
  return Number.isSafeInteger(valor) && valor > 0 && valor < 100000000 ? ok(valor) : ko('L’import són cèntims enters i positius.');
}

/* ---------- Llistes tancades ---------- */

/* Els organismes, la mateixa llista que identitat/nucli/document.js, que des
   d'ací no es pot importar (fronteraModelsPurs.test.js: encara no s'endolla).
   La prova d'este mòdul comprova que no se separen. */
export const ORGANISMES = Object.freeze([
  'AEAT', 'TGSS', 'SEPE', 'LABORA', 'SUMA', 'OEPM', 'RED.ES', 'REGISTRE-ASSOCIACIONS', 'AJUNTAMENT', 'GENERALITAT',
  'NOTARIA', 'BANC', 'ALTRE'
]);
export const CONCEPTES_TRIBUT = Object.freeze(['IBI-urbana', 'IBI-rustica', 'IVTM', 'IAE', 'taxa', 'altre']);
export const CARRECS = Object.freeze(['president', 'vicepresident', 'secretari', 'tresorer', 'vocal', 'apoderat']);
export const TIPUS_REPRESENTACIO = Object.freeze(['legal-estatutaria', 'voluntaria']);
export const MITJANS_NOTIFICACIO = Object.freeze(['electronica', 'postal']);

const validaEnum = (valors, que) => (valor) => (typeof valor === 'string' && valors.includes(valor) ? ok(valor) : ko(`${que} és un de: ${valors.join(', ')}.`));

/* ---------- El registre dels validadors i el catàleg dels camps ---------- */

/* Cada tipus de valor, amb el seu validador. Les receptes de l'extractor, la
   fitxa i els formularis de la Finestreta en fan servir els mateixos. */
export const VALIDADORS = Object.freeze({
  'nif-persona': validaNifPersona,
  'nif-entitat': validaNifEntitat,
  naf: validaNaf,
  'referencia-cadastral': validaReferenciaCadastral,
  'codi-postal': validaCodiPostal,
  'codi-ine': validaCodiIne,
  provincia: validaEnum(PROVINCIES, 'La província'),
  pais: validaEnum(['ES'], 'El país'),
  data: validaData,
  telefon: validaTelefon,
  correu: validaCorreu,
  'mitja-notificacio': validaEnum(MITJANS_NOTIFICACIO, 'El mitjà de notificació'),
  cnae: validaCnae,
  'epigraf-iae': validaEpigrafIae,
  'ref-suma': validaRefSuma,
  'nom-propi': validaNomPropi,
  'nom-lloc': validaNomLloc,
  via: validaVia,
  'numero-via': validaNumeroVia,
  complement: validaComplement,
  adreca: validaAdreca,
  denominacio: validaDenominacio,
  text: validaText,
  'numero-inscripcio': validaNumeroInscripcio,
  seccio: validaSeccio,
  import: validaImport,
  regim: validaEnum(['RETA'], 'El règim'),
  'concepte-tribut': validaEnum(CONCEPTES_TRIBUT, 'El concepte'),
  carrec: validaEnum(CARRECS, 'El càrrec'),
  'tipus-representacio': validaEnum(TIPUS_REPRESENTACIO, 'El tipus de representació'),
  organisme: validaEnum(ORGANISMES, 'L’organisme')
});

/** Valida un valor amb el validador d'un tipus; un tipus desconegut no valida res. */
export function validaSegons(tipus, valor) {
  const validador = Object.prototype.hasOwnProperty.call(VALIDADORS, tipus) ? VALIDADORS[tipus] : null;
  return validador ? validador(valor) : ko(`Tipus de valor desconegut: ${tipus}.`);
}

/* On viu cada camp (`rol`): la persona (titular de LLAR), la seua activitat
   (titular d'ACTIVITAT), una entitat, un tribut o una representació. */
export const ROLS = Object.freeze(['persona', 'activitat', 'entitat', 'tribut', 'representacio']);

const camp = (rol, tipus, manual = false) => Object.freeze({ rol, tipus, manual });

/* El catàleg tancat dels camps de la fitxa, '<grup>.<camp>'. Els de contacte
   només s'entren a mà: cap recepta els proposa. */
export const CAMPS_IDENTITAT = Object.freeze({
  'identificacio.nif': camp('persona', 'nif-persona'),
  'identificacio.nom': camp('persona', 'nom-propi'),
  'identificacio.cognom1': camp('persona', 'nom-propi'),
  'identificacio.cognom2': camp('persona', 'nom-propi'),
  'identificacio.dataNaixement': camp('persona', 'data'),
  'domicili.tipusVia': camp('persona', 'nom-lloc'),
  'domicili.via': camp('persona', 'via'),
  'domicili.numero': camp('persona', 'numero-via'),
  'domicili.complement': camp('persona', 'complement'),
  'domicili.codiPostal': camp('persona', 'codi-postal'),
  'domicili.municipi': camp('persona', 'nom-lloc'),
  'domicili.codiIne': camp('persona', 'codi-ine'),
  'domicili.provincia': camp('persona', 'provincia'),
  'domicili.pais': camp('persona', 'pais'),
  'contacte.telefon': camp('persona', 'telefon', true),
  'contacte.correu': camp('persona', 'correu', true),
  'contacte.mitjaNotificacio': camp('persona', 'mitja-notificacio', true),
  'seguretatSocial.naf': camp('activitat', 'naf'),
  'seguretatSocial.regim': camp('activitat', 'regim'),
  'seguretatSocial.dataAlta': camp('activitat', 'data'),
  'seguretatSocial.dataEfectes': camp('activitat', 'data'),
  'seguretatSocial.baseCotitzacio': camp('activitat', 'import'),
  'seguretatSocial.mutua': camp('activitat', 'denominacio'),
  'activitat.cnae': camp('activitat', 'cnae'),
  'activitat.descripcio': camp('activitat', 'text'),
  'activitat.epigrafIae': camp('activitat', 'epigraf-iae'),
  'activitat.dataAltaCensal': camp('activitat', 'data'),
  'activitat.domicili': camp('activitat', 'adreca'),
  'entitat.nif': camp('entitat', 'nif-entitat'),
  'entitat.denominacio': camp('entitat', 'denominacio'),
  'entitat.domiciliSocial': camp('entitat', 'adreca'),
  'registre.organisme': camp('entitat', 'organisme'),
  'registre.numeroInscripcio': camp('entitat', 'numero-inscripcio'),
  'registre.seccio': camp('entitat', 'seccio'),
  'registre.dataInscripcio': camp('entitat', 'data'),
  'tribut.concepte': camp('tribut', 'concepte-tribut'),
  'tribut.referenciaSuma': camp('tribut', 'ref-suma'),
  'tribut.referenciaCadastral': camp('tribut', 'referencia-cadastral'),
  'tribut.adreca': camp('tribut', 'adreca'),
  'tribut.municipi': camp('tribut', 'nom-lloc'),
  'representacio.carrec': camp('representacio', 'carrec'),
  'representacio.tipus': camp('representacio', 'tipus-representacio'),
  'representacio.vigentDes': camp('representacio', 'data'),
  'representacio.vigentFins': camp('representacio', 'data')
});

/** Valida el valor d'un camp del catàleg; un camp que no hi és no valida res. */
export function validaCamp(nomCamp, valor) {
  const definicio = Object.prototype.hasOwnProperty.call(CAMPS_IDENTITAT, nomCamp) ? CAMPS_IDENTITAT[nomCamp] : null;
  return definicio ? validaSegons(definicio.tipus, valor) : ko(`El camp ${nomCamp} no és de la fitxa.`);
}

/* ---------- Dates ISO de la fitxa ---------- */

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const MOMENT_ISO = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Cert si el text és una data «aaaa-mm-dd» que existix. */
export function esDataIso(text) {
  const r = typeof text === 'string' ? DATA_ISO.exec(text) : null;
  return Boolean(r) && esDataValida({ a: Number(r[1]), m: Number(r[2]), d: Number(r[3]) });
}

/** Cert si el text és un moment ISO 8601 amb zona («2026-10-13T15:40:00Z»). */
export function esMomentIso(text) {
  const r = typeof text === 'string' ? MOMENT_ISO.exec(text) : null;
  return Boolean(r) && esDataValida({ a: Number(r[1]), m: Number(r[2]), d: Number(r[3]) }) && !Number.isNaN(Date.parse(text));
}
