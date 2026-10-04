/**
 * guardes.js — les guardes comunes dels models purs de la Gestoria
 * (Identitat legal, Burocràcia i Projectes i subvencions).
 *
 * Congelar en profunditat, errors amb codi estable, dates del calendari en
 * text ISO («aaaa-mm-dd»), ids opacs, empremtes sha256 i la guarda que cap
 * text d'un model porte un identificador personal: DNI, NIE, NIF d'entitat,
 * IBAN, compte antic de 20 xifres, número d'afiliació, targeta, telèfon o
 * correu. Viu dins d'Identitat legal perquè és el mòdul que custodia la
 * identitat; Burocràcia i Projectes el declaren com a dependència.
 *
 * Les formes són heurístiques i fallen cap al costat segur: un text que ho
 * sembla es refusa, encara que siga un fals positiu. Els valors reals (el NIF
 * de l'emissor, el compte de cobrament) viuen en configuració local, mai en
 * estos models. JS pur: sense DOM, React ni xarxa.
 */
import { esDataValida } from '../../nucli/dates.js';

/* Congela un objecte i tot el que penja d'ell (com congela() d'entregables.js). */
export function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.values(valor).forEach(congela);
    Object.freeze(valor);
  }
  return valor;
}

/* Un error amb codi estable, perquè la UI decidisca què diu; `detalls`
   porta la llista d'errors de validació quan n'hi ha. */
export function errorAmbCodi(codi, missatge, detalls) {
  const error = new Error(missatge);
  error.codi = codi;
  if (detalls !== undefined) error.detalls = detalls;
  return error;
}

/* La llegenda que porta tot termini, tota regla i tota conservació d'estos models. */
export const VERIFICAR = 'A verificar amb la gestoria.';

const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/* Cert si el text és una data «aaaa-mm-dd» que existix al calendari. */
export function esDataIso(text) {
  const r = typeof text === 'string' ? DATA_ISO.exec(text) : null;
  return Boolean(r) && esDataValida({ a: Number(r[1]), m: Number(r[2]), d: Number(r[3]) });
}

/* Un text sense espais als extrems, o '' si no és un text. */
export const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/* Caràcters de control (inclosos els salts de línia): no van a cap camp d'estos models. */
const CONTROL = /[\u0000-\u001F\u007F]/;

/* Les formes que cap text pot portar. Els separadors habituals (espai,
   guionet, punt) també compten, perquè ningú les escriu sempre igual.
   Cap forma depén d'una frontera de paraula (\b) DAVANT: entre una lletra i
   una xifra no n'hi ha, i «dni» o «cta» enganxats davant amagarien el número.
   Les formes que comencen per una xifra només demanen que DAVANT no n'hi haja
   cap altra ((?:^|\D), sense mirada arrere, que Safari 16.0 no coneix); les
   només numèriques i el NIF d'entitat, que DARRERE tampoc: així un número més
   llarg no es pren per un altre. Les que comencen per una lletra no demanen
   res davant, i les que acaben en lletra no demanen res darrere. */
const FORMES_VETADES = Object.freeze([
  ['DNI', /(?:^|\D)\d{1,2}\.?\d{3}\.?\d{3}[-\s.]?[A-HJ-NP-TV-Z]/i],
  ['NIE', /[XYZ][-\s.]?\d{7}[-\s.]?[A-HJ-NP-TV-Z]/i],
  ['NIF_ENTITAT', /[ABCDEFGHJNPQRSUVW][-\s.]?\d{7}[-\s.]?[0-9A-J](?!\d)/i],
  ['IBAN', /[A-Z]{2}\d{2}(?:[\s-]?[A-Z0-9]{4}){3,7}(?:[\s-]?[A-Z0-9]{1,3})?/i],
  ['COMPTE', /(?:^|\D)\d{4}[\s-]?\d{4}[\s-]?\d{2}[\s-]?\d{10}(?!\d)/],
  ['AFILIACIO', /(?:^|\D)\d{2}[\s/-]?\d{8}[\s/-]?\d{2}(?!\d)/],
  ['TARGETA', /(?:^|\D)\d(?:[\s-]?\d){12,18}(?!\d)/],
  ['TELEFON', /(?:^|\D)(?:\+?\d{2}[\s.-]?)?[6-9](?:[\s.-]?\d){8}(?!\d)/],
  ['CORREU', /[^\s@]+@[^\s@]+\.[a-z]{2,}/i]
]);

/**
 * Les formes d'identificador personal que porta un text (['DNI', 'IBAN'…]),
 * o [] si no en porta cap. Els guions baixos compten com a separadors: dins
 * d'un id opac, «tit_» no amaga res.
 * @param {string} text
 * @returns {string[]}
 */
export function identificadorsDe(text) {
  if (typeof text !== 'string' || text === '') return [];
  const pla = text.replace(/_/g, ' ');
  return FORMES_VETADES.filter(([, patro]) => patro.test(pla)).map(([forma]) => forma);
}

/**
 * Comprova un text lliure d'un model i hi afig els errors. Torna el text net,
 * o '' si no és vàlid. `obligatori` diu si pot quedar buit.
 * @returns {string}
 */
export function comprovaText(valor, camp, errors, { obligatori = false, maxim = 120 } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (obligatori) errors.push({ codi: 'CAMP_OBLIGATORI', camp, missatge: `Falta ${camp}.` });
    return '';
  }
  if (typeof valor !== 'string') {
    errors.push({ codi: 'TEXT_INVALID', camp, missatge: `${camp} ha de ser un text.` });
    return '';
  }
  const net = valor.trim();
  if (net === '' && obligatori) errors.push({ codi: 'CAMP_OBLIGATORI', camp, missatge: `Falta ${camp}.` });
  if (net.length > maxim) errors.push({ codi: 'TEXT_MASSA_LLARG', camp, missatge: `${camp} passa de ${maxim} caràcters.` });
  if (CONTROL.test(net)) errors.push({ codi: 'TEXT_INVALID', camp, missatge: `${camp} porta salts de línia o caràcters de control.` });
  const formes = identificadorsDe(net);
  if (formes.length) {
    errors.push({ codi: 'IDENTIFICADOR_PERSONAL', camp, missatge: `${camp} sembla portar un identificador personal (${formes.join(', ')}): no va mai en este model.` });
  }
  return net;
}

const ID_OPAC = /^[a-z][a-z0-9_-]{3,95}$/;

/* Cert si el valor és un id opac: minúscules, xifres, «_» i «-», i cap forma
   d'identificador personal (ni amagada entre guions baixos). */
export const esIdOpac = (valor) => typeof valor === 'string' && ID_OPAC.test(valor) && identificadorsDe(valor).length === 0;

/* Setze lletres i cap xifra, com nouIdOpac de titular.js: un id derivat no
   pot tindre mai la forma d'un DNI ni d'un IBAN. */
const LLETRES_ID = 'abcdefghijklmnop';

/* FNV-1a de 32 bits sobre els punts de codi del text: determinista, no criptogràfic. */
function fnv1a(text, llavor) {
  let h = llavor >>> 0;
  for (const caracter of text) {
    h ^= caracter.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Un id opac DERIVAT d'una clau composta (per exemple, «expedient:termini»):
 * curt (el prefix i setze lletres), estable (la mateixa clau dona sempre el
 * mateix id) i només de lletres. Fa curt i opac un id que, compost, passaria
 * del límit d'un camp; no és un resum criptogràfic ni amaga res que calga xifrar.
 * @param {string} prefix tres a dotze lletres minúscules
 * @param {string} clau
 * @returns {string}
 */
export function idOpacDerivat(prefix, clau) {
  if (typeof prefix !== 'string' || !/^[a-z]{3,12}$/.test(prefix)) throw new TypeError('El prefix de l’id són de tres a dotze lletres minúscules.');
  if (typeof clau !== 'string' || clau === '') throw new TypeError('Cal la clau de la qual es deriva l’id.');
  let cos = '';
  for (const llavor of [2166136261, 16777619]) {
    const h = fnv1a(clau, llavor);
    for (let desplacament = 28; desplacament >= 0; desplacament -= 4) cos += LLETRES_ID[(h >>> desplacament) & 15];
  }
  return `${prefix}_${cos}`;
}

/* Afig l'error si el valor no és un id opac. */
export function comprovaId(valor, camp, errors, { obligatori = true } = {}) {
  if ((valor === undefined || valor === null) && !obligatori) return null;
  if (!esIdOpac(valor)) {
    errors.push({ codi: 'ID_INVALID', camp, missatge: `${camp} ha de ser un id opac (minúscules, xifres, «_» i «-»), sense cap dada personal.` });
    return null;
  }
  return valor;
}

/* Afig l'error si el valor no és una data «aaaa-mm-dd»; null si pot faltar. */
export function comprovaData(valor, camp, errors, { obligatori = false } = {}) {
  if (valor === undefined || valor === null) {
    if (obligatori) errors.push({ codi: 'CAMP_OBLIGATORI', camp, missatge: `Falta ${camp}.` });
    return null;
  }
  if (!esDataIso(valor)) {
    errors.push({ codi: 'DATA_INVALIDA', camp, missatge: `${camp} ha de ser una data «aaaa-mm-dd» que existisca.` });
    return null;
  }
  return valor;
}

/* Afig un error per cada clau que el model no coneix: res s'hi cola d'amagat. */
export function comprovaClaus(dades, permeses, camp, errors) {
  for (const clau of Object.keys(dades)) {
    if (!permeses.includes(clau)) errors.push({ codi: 'CAMP_DESCONEGUT', camp: `${camp}.${clau}`, missatge: `${camp} no admet el camp «${clau}».` });
  }
}

/* Cert si el valor és un objecte pla (ni null ni una llista). */
export const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);

const SHA256 = /^[0-9a-f]{64}$/i;

/* Cert si el valor és una empremta SHA-256 en hexadecimal (64 xifres). */
export const esSha256 = (valor) => typeof valor === 'string' && SHA256.test(valor);

/* Llança l'error de validació amb tots els detalls, o no fa res si no n'hi ha. */
export function llancaSiCal(errors, codi, missatge) {
  if (errors.length) throw errorAmbCodi(codi, `${missatge}: ${errors.map((e) => e.missatge).join(' ')}`, errors);
}
