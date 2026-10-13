/**
 * fitxaIdentitat.js — la Fitxa d'identitat sobirana: els camps legals de la
 * persona, de la seua activitat, de les entitats que representa, dels seus
 * tributs locals i de les representacions, cadascun amb la seua font i el seu
 * estat.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H). Esquema
 * 'sdp.gestoria.fitxa-identitat.v1':
 *   { schema, versio: 1, actualitzat,
 *     titulars: [{ id 'tit_…', tipus, ambit, alies, persona?, camps }],
 *     tributs: [{ id 'trb_…', titular, camps }],
 *     representacions: [{ id 'rep_…', representant, representat, camps }] }
 * Cada camp ('<grup>.<camp>', del catàleg CAMPS_IDENTITAT) és un Valor:
 *   { valor, estat: 'proposat'|'en-conflicte'|'confirmat', fonts, alternatives, confirmat }
 * Regles:
 *   · Una proposta vàlida sola queda 'proposat'. Dos valors vàlids diferents
 *     queden 'en-conflicte': mai es tria sol cap dels dos.
 *   · Un valor 'confirmat' no el sobreescriu mai una proposta: el valor nou
 *     va a `alternatives` (és l'avís «ha canviat en <fitxer>»). Només la
 *     persona canvia un confirmat (confirma una alternativa, rebutja o entra a mà).
 *   · Al cofre només van els valors confirmats, amb les seues fonts
 *     (perAlCofre); les propostes viuen en memòria i es tornen a fer llegint.
 *   · La fitxa no té on posar l'IBAN, la salut, el CSV ni cap credencial: les
 *     claus són tancades a tots els nivells.
 * Totes les eixides són congelades. JS pur: sense DOM, React, xarxa ni
 * emmagatzematge (el cofre el fa servir qui crida).
 */
import { TIPUS_DOCUMENT_IDENTITAT } from './filtreDocuments.js';
import {
  CAMPS_IDENTITAT, congela, errorAmbCodi, esDataIso, esMomentIso, provinciaDelCodiPostal, teFormaIdentificador, validaCamp
} from './validadorsIdentitat.js';

export const SCHEMA_FITXA = 'sdp.gestoria.fitxa-identitat.v1';
export const ESTATS_VALOR = Object.freeze(['proposat', 'en-conflicte', 'confirmat']);
export const AMBITS = Object.freeze(['LLAR', 'ACTIVITAT', 'ENTITAT']);

const AMBITS_DEL_TIPUS = Object.freeze({ persona: Object.freeze(['LLAR', 'ACTIVITAT']), entitat: Object.freeze(['ENTITAT']) });
/* El rol dels camps que viuen en cada àmbit de titular. */
const ROL_DE_LAMBIT = Object.freeze({ LLAR: 'persona', ACTIVITAT: 'activitat', ENTITAT: 'entitat' });

const CLAUS_FITXA = Object.freeze(['schema', 'versio', 'actualitzat', 'titulars', 'tributs', 'representacions']);
const CLAUS_TITULAR = Object.freeze(['id', 'tipus', 'ambit', 'alies', 'persona', 'camps']);
const CLAUS_TRIBUT = Object.freeze(['id', 'titular', 'camps']);
const CLAUS_REPRESENTACIO = Object.freeze(['id', 'representant', 'representat', 'camps']);
const CLAUS_VALOR = Object.freeze(['valor', 'estat', 'fonts', 'alternatives', 'confirmat']);
const CLAUS_ALTERNATIVA = Object.freeze(['valor', 'fonts']);
const CLAUS_FONT_DOCUMENT = Object.freeze(['tipus', 'ruta', 'sha256', 'tipusDocument', 'regla', 'dataDocument']);

const ID = Object.freeze({ tit: /^tit_[a-p]{16}$/, trb: /^trb_[a-p]{16}$/, rep: /^rep_[a-p]{16}$/ });
const SHA256 = /^[0-9a-f]{64}$/;
const REGLA = /^[a-z0-9-]{1,60}$/;
const IBAN_EN_RUTA = /[a-z]{2}\d{2}(?:[\s_.-]?[a-z0-9]{4}){4,7}/i;
const LLETRES_ID = 'abcdefghijklmnop';

const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
const copia = (valor) => JSON.parse(JSON.stringify(valor));
const te = (objecte, clau) => Object.prototype.hasOwnProperty.call(objecte, clau);

/* ---------- Ids ---------- */

/**
 * Un id opac nou ('tit', 'trb' o 'rep' i setze lletres) a partir de bytes
 * aleatoris que dona qui crida (crypto.getRandomValues(new Uint8Array(8))):
 * el model no tria l'atzar. Sense xifres: cap tros pot tindre forma de DNI.
 */
export function nouIdFitxa(prefix, bytes) {
  if (!te(ID, prefix)) throw new TypeError('El prefix de l’id és tit, trb o rep.');
  if (!(bytes instanceof Uint8Array) || bytes.length < 8) throw new TypeError('Calen almenys 8 bytes aleatoris per a un id opac.');
  let cos = '';
  for (const byte of bytes.subarray(0, 8)) cos += LLETRES_ID[byte >> 4] + LLETRES_ID[byte & 15];
  return `${prefix}_${cos}`;
}

/* FNV-1a de 32 bits: determinista, no criptogràfic. */
function fnv1a(text, llavor) {
  let h = llavor >>> 0;
  for (const caracter of text) {
    h ^= caracter.codePointAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/* Un id DERIVAT d'una clau (la mateixa clau, el mateix id): així tornar a fusionar el mateix document no duplica res. */
function idDerivat(prefix, clau) {
  let cos = '';
  for (const llavor of [2166136261, 16777619]) {
    const h = fnv1a(clau, llavor);
    for (let desplacament = 28; desplacament >= 0; desplacament -= 4) cos += LLETRES_ID[(h >>> desplacament) & 15];
  }
  return `${prefix}_${cos}`;
}

/* ---------- Validació ---------- */

const error = (errors, codi, camp, missatge) => errors.push({ codi, camp, missatge });

function comprovaClaus(objecte, permeses, camp, errors) {
  for (const clau of Object.keys(objecte)) {
    if (!permeses.includes(clau)) error(errors, 'CAMP_DESCONEGUT', `${camp}.${clau}`, `${camp} no admet «${clau}».`);
  }
}

/** Cert si la font és vàlida: una lectura de document amb ruta, sha256, tipus i regla, o una entrada a mà. */
export function esFontValida(font) {
  if (!esObjecte(font)) return false;
  if (font.tipus === 'manual') return Object.keys(font).length === 1;
  if (font.tipus !== 'document' || !Object.keys(font).every((clau) => CLAUS_FONT_DOCUMENT.includes(clau))) return false;
  return typeof font.ruta === 'string' && font.ruta.trim() !== '' && font.ruta.length <= 1024 && !IBAN_EN_RUTA.test(font.ruta)
    && SHA256.test(font.sha256 ?? '') && TIPUS_DOCUMENT_IDENTITAT.includes(font.tipusDocument) && REGLA.test(font.regla ?? '')
    && (font.dataDocument === undefined || esDataIso(font.dataDocument));
}

function comprovaFonts(fonts, camp, errors) {
  if (!Array.isArray(fonts) || fonts.length === 0) {
    error(errors, 'FONTS_INVALIDES', camp, `${camp} necessita almenys una font.`);
    return;
  }
  fonts.forEach((font, i) => {
    if (!esFontValida(font)) error(errors, 'FONT_INVALIDA', `${camp}.fonts[${i}]`, 'Una font és un document (ruta, sha256, tipus i regla) o una entrada a mà.');
  });
}

function comprovaValor(valor, nomCamp, camp, errors) {
  if (!esObjecte(valor)) {
    error(errors, 'VALOR_INVALID', camp, `${camp} ha de ser un Valor.`);
    return;
  }
  comprovaClaus(valor, CLAUS_VALOR, camp, errors);
  for (const clau of CLAUS_VALOR) if (!te(valor, clau)) error(errors, 'CAMP_OBLIGATORI', `${camp}.${clau}`, `Falta ${camp}.${clau}.`);
  const v = validaCamp(nomCamp, valor.valor);
  if (!v.valid || v.normalitzat !== valor.valor) error(errors, 'VALOR_INVALID', camp, `${camp}: ${v.avis ?? 'el valor no està normalitzat.'}`);
  if (!ESTATS_VALOR.includes(valor.estat)) error(errors, 'ESTAT_INVALID', `${camp}.estat`, `L’estat és ${ESTATS_VALOR.join(', ')}.`);
  comprovaFonts(valor.fonts, camp, errors);
  if (!Array.isArray(valor.alternatives)) {
    error(errors, 'ALTERNATIVES_INVALIDES', `${camp}.alternatives`, 'Les alternatives són una llista.');
  } else {
    const vistos = new Set([valor.valor]);
    valor.alternatives.forEach((alternativa, i) => {
      const ruta = `${camp}.alternatives[${i}]`;
      if (!esObjecte(alternativa)) {
        error(errors, 'ALTERNATIVA_INVALIDA', ruta, 'Una alternativa és { valor, fonts }.');
        return;
      }
      comprovaClaus(alternativa, CLAUS_ALTERNATIVA, ruta, errors);
      const va = validaCamp(nomCamp, alternativa.valor);
      if (!va.valid || va.normalitzat !== alternativa.valor) error(errors, 'VALOR_INVALID', ruta, `${ruta}: ${va.avis ?? 'el valor no està normalitzat.'}`);
      if (vistos.has(alternativa.valor)) error(errors, 'ALTERNATIVA_REPETIDA', ruta, 'Cada alternativa és un valor diferent.');
      vistos.add(alternativa.valor);
      comprovaFonts(alternativa.fonts, ruta, errors);
    });
    if (valor.estat === 'proposat' && valor.alternatives.length) error(errors, 'ESTAT_INCOHERENT', camp, 'Un valor proposat sense conflicte no té alternatives.');
    if (valor.estat === 'en-conflicte' && !valor.alternatives.length) error(errors, 'ESTAT_INCOHERENT', camp, 'Un conflicte necessita almenys una alternativa.');
  }
  if (valor.estat === 'confirmat' ? !esMomentIso(valor.confirmat) : valor.confirmat !== null) {
    error(errors, 'CONFIRMAT_INVALID', `${camp}.confirmat`, 'Només un valor confirmat porta el moment ISO de la confirmació.');
  }
}

function comprovaCamps(camps, rol, camp, errors) {
  if (!esObjecte(camps)) {
    error(errors, 'CAMPS_INVALIDS', camp, `${camp} ha de ser un objecte.`);
    return;
  }
  for (const [nomCamp, valor] of Object.entries(camps)) {
    const definicio = te(CAMPS_IDENTITAT, nomCamp) ? CAMPS_IDENTITAT[nomCamp] : null;
    if (!definicio) error(errors, 'CAMP_DESCONEGUT', `${camp}.${nomCamp}`, `«${nomCamp}» no és un camp de la fitxa.`);
    else if (definicio.rol !== rol) error(errors, 'CAMP_FORA_DE_LLOC', `${camp}.${nomCamp}`, `«${nomCamp}» no és d’un titular de rol ${rol}.`);
    else comprovaValor(valor, nomCamp, `${camp}.${nomCamp}`, errors);
  }
}

/* Coherència entre valors confirmats: la província i el codi INE han de ser els del codi postal. */
function comprovaCoherencia(camps, camp, errors) {
  const confirmat = (nom) => (esObjecte(camps?.[nom]) && camps[nom].estat === 'confirmat' ? camps[nom].valor : null);
  const cp = confirmat('domicili.codiPostal');
  if (!cp) return;
  const provincia = confirmat('domicili.provincia');
  if (provincia && provincia !== provinciaDelCodiPostal(cp)) error(errors, 'PROVINCIA_INCOHERENT', `${camp}.domicili.provincia`, 'La província no és la del codi postal.');
  const ine = confirmat('domicili.codiIne');
  if (ine && ine.slice(0, 2) !== cp.slice(0, 2)) error(errors, 'INE_INCOHERENT', `${camp}.domicili.codiIne`, 'El codi INE no és de la província del codi postal.');
}

/**
 * Els errors d'una fitxa, sense llançar: [] si és vàlida.
 * @returns {{ codi: string, camp: string, missatge: string }[]}
 */
export function validaFitxa(f) {
  const errors = [];
  if (!esObjecte(f)) return [{ codi: 'FITXA_INVALIDA', camp: 'fitxa', missatge: 'La fitxa ha de ser un objecte.' }];
  comprovaClaus(f, CLAUS_FITXA, 'fitxa', errors);
  if (f.schema !== SCHEMA_FITXA) error(errors, 'SCHEMA_INVALID', 'fitxa.schema', `L’esquema és ${SCHEMA_FITXA}.`);
  if (f.versio !== 1) error(errors, 'VERSIO_INVALIDA', 'fitxa.versio', 'La versió és 1.');
  if (f.actualitzat !== null && !esMomentIso(f.actualitzat)) error(errors, 'DATA_INVALIDA', 'fitxa.actualitzat', 'Un moment ISO o null.');
  for (const llista of ['titulars', 'tributs', 'representacions']) {
    if (!Array.isArray(f[llista])) error(errors, 'LLISTA_INVALIDA', `fitxa.${llista}`, `fitxa.${llista} ha de ser una llista.`);
  }
  if (errors.length) return errors;

  const ids = new Set();
  const perId = new Map();
  const idNou = (id, patro, camp) => {
    if (typeof id !== 'string' || !patro.test(id)) error(errors, 'ID_INVALID', camp, `${camp} no és un id opac.`);
    else if (ids.has(id)) error(errors, 'ID_REPETIT', camp, `L’id ${id} es repetix.`);
    else ids.add(id);
  };
  f.titulars.forEach((t, i) => {
    const camp = `titulars[${i}]`;
    if (!esObjecte(t)) {
      error(errors, 'TITULAR_INVALID', camp, 'Un titular és un objecte.');
      return;
    }
    comprovaClaus(t, CLAUS_TITULAR, camp, errors);
    idNou(t.id, ID.tit, `${camp}.id`);
    if (!te(AMBITS_DEL_TIPUS, t.tipus) || !AMBITS_DEL_TIPUS[t.tipus].includes(t.ambit)) {
      error(errors, 'AMBIT_INVALID', `${camp}.ambit`, 'Una persona és de LLAR o d’ACTIVITAT; una entitat, d’ENTITAT.');
      return;
    }
    if (typeof t.alies !== 'string' || t.alies.trim() === '' || t.alies.length > 80 || teFormaIdentificador(t.alies)) {
      error(errors, 'ALIES_INVALID', `${camp}.alies`, 'L’àlies és un text curt, sense cap identificador personal.');
    }
    if (t.ambit === 'ACTIVITAT' ? typeof t.persona !== 'string' : te(t, 'persona')) {
      error(errors, 'PERSONA_INVALIDA', `${camp}.persona`, 'Només l’àmbit ACTIVITAT apunta a la llar d’una persona, i sempre.');
    }
    comprovaCamps(t.camps, ROL_DE_LAMBIT[t.ambit], `${camp}.camps`, errors);
    comprovaCoherencia(t.camps, `${camp}.camps`, errors);
    if (typeof t.id === 'string') perId.set(t.id, t);
  });
  const esDeLAmbit = (id, ambits) => perId.has(id) && ambits.includes(perId.get(id).ambit);
  f.titulars.forEach((t, i) => {
    if (esObjecte(t) && t.ambit === 'ACTIVITAT' && !esDeLAmbit(t.persona, ['LLAR'])) {
      error(errors, 'PERSONA_ABSENT', `titulars[${i}].persona`, 'L’activitat ha d’apuntar a la llar d’una persona de la fitxa.');
    }
  });
  f.tributs.forEach((t, i) => {
    const camp = `tributs[${i}]`;
    if (!esObjecte(t)) {
      error(errors, 'TRIBUT_INVALID', camp, 'Un tribut és un objecte.');
      return;
    }
    comprovaClaus(t, CLAUS_TRIBUT, camp, errors);
    idNou(t.id, ID.trb, `${camp}.id`);
    if (!esDeLAmbit(t.titular, ['LLAR', 'ENTITAT'])) error(errors, 'TITULAR_ABSENT', `${camp}.titular`, 'El tribut és d’una persona (llar) o d’una entitat de la fitxa.');
    comprovaCamps(t.camps, 'tribut', `${camp}.camps`, errors);
  });
  const parelles = new Set();
  f.representacions.forEach((r, i) => {
    const camp = `representacions[${i}]`;
    if (!esObjecte(r)) {
      error(errors, 'REPRESENTACIO_INVALIDA', camp, 'Una representació és un objecte.');
      return;
    }
    comprovaClaus(r, CLAUS_REPRESENTACIO, camp, errors);
    idNou(r.id, ID.rep, `${camp}.id`);
    if (!esDeLAmbit(r.representant, ['LLAR'])) error(errors, 'REPRESENTANT_ABSENT', `${camp}.representant`, 'El representant és una persona (llar) de la fitxa.');
    if (!esDeLAmbit(r.representat, ['ENTITAT'])) error(errors, 'REPRESENTAT_ABSENT', `${camp}.representat`, 'El representat és una entitat de la fitxa.');
    const parella = `${r.representant}|${r.representat}`;
    if (parelles.has(parella)) error(errors, 'REPRESENTACIO_REPETIDA', camp, 'Una sola representació per persona i entitat.');
    parelles.add(parella);
    comprovaCamps(r.camps, 'representacio', `${camp}.camps`, errors);
  });
  return errors;
}

/* Llança FITXA_INVALIDA amb tots els detalls, o no fa res. */
function exigixFitxa(f) {
  const errors = validaFitxa(f);
  if (errors.length) throw errorAmbCodi('FITXA_INVALIDA', `La fitxa no és vàlida: ${errors.map((e) => e.missatge).join(' ')}`, errors);
}

function exigixMoment(ara) {
  if (!esMomentIso(ara)) throw errorAmbCodi('MOMENT_INVALID', 'Cal el moment ISO de l’acció («ara»).');
}

/* ---------- Construcció ---------- */

/** Una fitxa buida. `ara` (moment ISO) és opcional: sense, `actualitzat` és null. */
export function fitxaBuida({ ara = null } = {}) {
  if (ara !== null) exigixMoment(ara);
  return congela({ schema: SCHEMA_FITXA, versio: 1, actualitzat: ara, titulars: [], tributs: [], representacions: [] });
}

/* Torna la fitxa nova congelada, o llança si no és vàlida. */
function tanca(nova, ara) {
  if (ara !== undefined && ara !== null) {
    exigixMoment(ara);
    nova.actualitzat = ara;
  }
  exigixFitxa(nova);
  return congela(nova);
}

/** Afig un titular: una persona (LLAR, o ACTIVITAT amb `persona`) o una entitat (ENTITAT). */
export function afegixTitular(f, { id, tipus, ambit, alies, persona } = {}, { ara } = {}) {
  exigixFitxa(f);
  const nova = copia(f);
  nova.titulars.push({ id, tipus, ambit, alies: typeof alies === 'string' ? alies.trim() : alies, ...(ambit === 'ACTIVITAT' ? { persona } : {}), camps: {} });
  return tanca(nova, ara);
}

/** Afig un tribut local d'una persona (llar) o d'una entitat. */
export function afegixTribut(f, { id, titular } = {}, { ara } = {}) {
  exigixFitxa(f);
  const nova = copia(f);
  nova.tributs.push({ id, titular, camps: {} });
  return tanca(nova, ara);
}

/** Afig una representació: una persona (llar) que representa una entitat. */
export function afegixRepresentacio(f, { id, representant, representat } = {}, { ara } = {}) {
  exigixFitxa(f);
  const nova = copia(f);
  nova.representacions.push({ id, representant, representat, camps: {} });
  return tanca(nova, ara);
}

/* ---------- On viu cada camp ---------- */

/**
 * El portador d'un id (un titular, un tribut o una representació) i el rol
 * dels seus camps, o null.
 * @returns {{ portador: object, rol: string }|null}
 */
export function portadorDe(f, id) {
  if (!esObjecte(f) || typeof id !== 'string') return null;
  const titular = (f.titulars ?? []).find((t) => t?.id === id);
  if (titular) return { portador: titular, rol: ROL_DE_LAMBIT[titular.ambit] };
  const tribut = (f.tributs ?? []).find((t) => t?.id === id);
  if (tribut) return { portador: tribut, rol: 'tribut' };
  const representacio = (f.representacions ?? []).find((r) => r?.id === id);
  return representacio ? { portador: representacio, rol: 'representacio' } : null;
}

/* El titular d'un àmbit: el que diu `id`, o l'únic que n'hi ha (si n'hi ha més d'un, cap). */
function resolTitular(f, ambit, id, persona) {
  if (id !== undefined && id !== null) return f.titulars.find((t) => t.id === id && t.ambit === ambit) ?? null;
  const candidats = f.titulars.filter((t) => t.ambit === ambit && (persona === undefined || t.persona === persona));
  return candidats.length === 1 ? candidats[0] : null;
}

/* ---------- Fusió ---------- */

const mateixaFont = (a, b) => a.tipus === b.tipus && a.ruta === b.ruta && a.sha256 === b.sha256 && a.regla === b.regla;
function afegixFont(fonts, font) {
  if (!fonts.some((f) => mateixaFont(f, font))) fonts.push(font);
}

/* Un valor nou damunt de l'actual, amb les regles de dalt. Muta `actual` (ja és una còpia). */
function fusionaValor(actual, valor, font) {
  if (!actual) return { valor, estat: 'proposat', fonts: [font], alternatives: [], confirmat: null };
  if (actual.valor === valor) {
    afegixFont(actual.fonts, font);
    return actual;
  }
  const alternativa = actual.alternatives.find((a) => a.valor === valor);
  if (alternativa) afegixFont(alternativa.fonts, font);
  else actual.alternatives.push({ valor, fonts: [font] });
  if (actual.estat === 'proposat') actual.estat = 'en-conflicte';
  return actual;
}

/* Una font de document sense res de més, o null. */
function fontNeta(font) {
  if (!esFontValida(font) || font.tipus !== 'document') return null;
  const neta = { tipus: 'document', ruta: font.ruta, sha256: font.sha256, tipusDocument: font.tipusDocument, regla: font.regla };
  return font.dataDocument ? { ...neta, dataDocument: font.dataDocument } : neta;
}

/* La proposta, validada i normalitzada, o null si no es pot fusionar. */
function propostaNeta(p) {
  if (!esObjecte(p) || !te(CAMPS_IDENTITAT, p.camp)) return null;
  const definicio = CAMPS_IDENTITAT[p.camp];
  if (definicio.manual || definicio.rol !== p.titularRol) return null;
  const v = validaCamp(p.camp, p.valor);
  const font = fontNeta(p.font);
  return v.valid && font ? { rol: definicio.rol, camp: p.camp, valor: v.normalitzat, font } : null;
}

/* El tribut d'un grup de propostes del mateix document: el que ja porta la
   mateixa referència (cadastral o de SUMA), el d'este document si ja s'havia
   fusionat, o un de nou. */
function tributDelGrup(nova, grup, titular) {
  const refs = grup.filter((p) => p.camp === 'tribut.referenciaCadastral' || p.camp === 'tribut.referenciaSuma');
  const teLaRef = (t) => refs.some((p) => {
    const actual = t.camps[p.camp];
    return actual && (actual.valor === p.valor || actual.alternatives.some((a) => a.valor === p.valor));
  });
  const id = idDerivat('trb', `${grup[0].font.sha256}|${grup[0].font.ruta}`);
  const existent = nova.tributs.find((t) => (refs.length && teLaRef(t)) || t.id === id);
  if (existent) return existent;
  if (!titular) return null;
  const tribut = { id, titular: titular.id, camps: {} };
  nova.tributs.push(tribut);
  return tribut;
}

/**
 * Fusiona les propostes de l'extractor en una fitxa nova.
 * Cada rol va al seu titular: el de `desti` (ids) o, si no se'n diu cap,
 * l'únic de l'àmbit (LLAR, ACTIVITAT de la persona, ENTITAT). Si no n'hi ha
 * cap o n'hi ha més d'un, les propostes d'eixe rol no s'hi fusionen. Els
 * tributs s'agrupen per document; les representacions, per persona i entitat.
 * Les propostes invàlides, de camps desconeguts o de contacte (només a mà)
 * no hi entren.
 * @param {object} f la fitxa
 * @param {object[]} propostes d'extreuPropostes
 * @param {{ desti?: { persona?: string, activitat?: string, entitat?: string }, ara?: string }} [opcions]
 */
export function fusionaPropostes(f, propostes, { desti = {}, ara = null } = {}) {
  exigixFitxa(f);
  if (!Array.isArray(propostes)) throw new TypeError('Les propostes són una llista.');
  const nova = copia(f);
  const persona = resolTitular(nova, 'LLAR', desti.persona);
  const portadors = {
    persona,
    activitat: resolTitular(nova, 'ACTIVITAT', desti.activitat, desti.activitat ? undefined : persona?.id),
    entitat: resolTitular(nova, 'ENTITAT', desti.entitat)
  };
  const netes = propostes.map(propostaNeta).filter(Boolean);
  const perDocument = new Map();
  for (const p of netes) {
    if (p.rol === 'tribut') {
      const clau = `${p.font.sha256}|${p.font.ruta}`;
      if (!perDocument.has(clau)) perDocument.set(clau, []);
      perDocument.get(clau).push(p);
      continue;
    }
    let portador = portadors[p.rol] ?? null;
    if (p.rol === 'representacio') {
      if (!portadors.persona || !portadors.entitat) continue;
      portador = nova.representacions.find((r) => r.representant === portadors.persona.id && r.representat === portadors.entitat.id) ?? null;
      if (!portador) {
        portador = { id: idDerivat('rep', `${portadors.persona.id}|${portadors.entitat.id}`), representant: portadors.persona.id, representat: portadors.entitat.id, camps: {} };
        nova.representacions.push(portador);
      }
    }
    if (!portador) continue;
    portador.camps[p.camp] = fusionaValor(portador.camps[p.camp], p.valor, p.font);
  }
  for (const grup of perDocument.values()) {
    const tribut = tributDelGrup(nova, grup, portadors.persona ?? portadors.entitat);
    if (!tribut) continue;
    for (const p of grup) tribut.camps[p.camp] = fusionaValor(tribut.camps[p.camp], p.valor, p.font);
  }
  return tanca(nova, ara);
}

/* ---------- Les decisions de la persona ---------- */

function valorDe(nova, titular, camp) {
  const trobat = portadorDe(nova, titular);
  if (!trobat) throw errorAmbCodi('TITULAR_DESCONEGUT', 'Este titular no és de la fitxa.');
  const actual = trobat.portador.camps[camp];
  if (!actual) throw errorAmbCodi('CAMP_BUIT', `El camp ${camp} no té cap valor.`);
  return { trobat, actual };
}

/* El valor que diu la persona, normalitzat si és vàlid (per a comparar-lo amb els guardats). */
function normalitzatDe(camp, valor) {
  const v = validaCamp(camp, valor);
  return v.valid ? v.normalitzat : valor;
}

/**
 * Confirma un valor: el principal o una de les alternatives. Sense `valor`
 * només es pot confirmar un camp sense alternatives. Les altres candidates
 * queden descartades: la persona ja ha triat.
 */
export function confirma(f, { titular, camp, valor } = {}, { ara } = {}) {
  exigixFitxa(f);
  exigixMoment(ara);
  const nova = copia(f);
  const { trobat, actual } = valorDe(nova, titular, camp);
  const candidates = [{ valor: actual.valor, fonts: actual.fonts }, ...actual.alternatives];
  let triada = candidates[0];
  if (valor === undefined) {
    if (candidates.length > 1) throw errorAmbCodi('CAL_TRIAR', 'Hi ha més d’un valor: cal dir quin es confirma.');
  } else {
    const buscat = normalitzatDe(camp, valor);
    triada = candidates.find((c) => c.valor === buscat);
    if (!triada) throw errorAmbCodi('VALOR_DESCONEGUT', 'Este valor no és cap de les candidates: entra’l a mà.');
  }
  if (!validaCamp(camp, triada.valor).valid) throw errorAmbCodi('VALOR_INVALID', 'El valor no passa el validador del camp.');
  trobat.portador.camps[camp] = { valor: triada.valor, estat: 'confirmat', fonts: triada.fonts, alternatives: [], confirmat: ara };
  return tanca(nova, ara);
}

/**
 * Rebutja un valor (el principal, si no se'n diu cap, o una alternativa).
 * Si era el principal, puja la primera alternativa; si no en queda cap, el
 * camp desapareix. Un rebuig no es recorda: tornar a llegir el document el
 * pot tornar a proposar.
 */
export function rebutja(f, { titular, camp, valor } = {}, { ara } = {}) {
  exigixFitxa(f);
  const nova = copia(f);
  const { trobat, actual } = valorDe(nova, titular, camp);
  const buscat = valor === undefined ? actual.valor : normalitzatDe(camp, valor);
  const i = actual.alternatives.findIndex((a) => a.valor === buscat);
  if (i >= 0) {
    actual.alternatives.splice(i, 1);
    if (actual.estat === 'en-conflicte' && actual.alternatives.length === 0) actual.estat = 'proposat';
  } else if (actual.valor === buscat) {
    const [seguent, ...resta] = actual.alternatives;
    if (seguent) trobat.portador.camps[camp] = { valor: seguent.valor, estat: resta.length ? 'en-conflicte' : 'proposat', fonts: seguent.fonts, alternatives: resta, confirmat: null };
    else delete trobat.portador.camps[camp];
  } else {
    throw errorAmbCodi('VALOR_DESCONEGUT', 'Este valor no és cap de les candidates.');
  }
  return tanca(nova, ara);
}

/**
 * La persona entra un valor a mà: queda confirmat, amb la font «manual». És
 * una decisió seua i substituïx el que hi haguera. Un valor que no passa el
 * validador del camp no entra (un NIF en un camp de nom, per exemple).
 */
export function entraAMa(f, { titular, camp, valor } = {}, { ara } = {}) {
  exigixFitxa(f);
  exigixMoment(ara);
  const nova = copia(f);
  const trobat = portadorDe(nova, titular);
  if (!trobat) throw errorAmbCodi('TITULAR_DESCONEGUT', 'Este titular no és de la fitxa.');
  if (!te(CAMPS_IDENTITAT, camp) || CAMPS_IDENTITAT[camp].rol !== trobat.rol) throw errorAmbCodi('CAMP_INVALID', `El camp ${camp} no és d’este titular.`);
  const v = validaCamp(camp, valor);
  if (!v.valid) throw errorAmbCodi('VALOR_INVALID', v.avis ?? 'El valor no és vàlid.');
  trobat.portador.camps[camp] = { valor: v.normalitzat, estat: 'confirmat', fonts: [{ tipus: 'manual' }], alternatives: [], confirmat: ara };
  return tanca(nova, ara);
}

/* ---------- Lectures ---------- */

/** Els valors confirmats d'un titular, tribut o representació: { camp: valor }. */
export function campsConfirmats(f, id) {
  const trobat = portadorDe(f, id);
  const fora = {};
  if (trobat && esObjecte(trobat.portador.camps)) {
    for (const [camp, valor] of Object.entries(trobat.portador.camps)) {
      if (valor?.estat === 'confirmat') fora[camp] = valor.valor;
    }
  }
  return congela(fora);
}

/** Només recomptes, cap valor: per a dir «tens 3 conflictes» sense ensenyar res. */
export function resum(f) {
  const recompte = { titulars: 0, tributs: 0, representacions: 0, proposat: 0, enConflicte: 0, confirmat: 0, ambAvis: 0 };
  if (!esObjecte(f)) return congela(recompte);
  for (const llista of ['titulars', 'tributs', 'representacions']) {
    for (const portador of Array.isArray(f[llista]) ? f[llista] : []) {
      recompte[llista] += 1;
      for (const valor of Object.values(portador?.camps ?? {})) {
        if (valor?.estat === 'proposat') recompte.proposat += 1;
        else if (valor?.estat === 'en-conflicte') recompte.enConflicte += 1;
        else if (valor?.estat === 'confirmat') {
          recompte.confirmat += 1;
          if (valor.alternatives?.length) recompte.ambAvis += 1;
        }
      }
    }
  }
  return congela(recompte);
}

const nomesConfirmats = (camps) => Object.fromEntries(Object.entries(camps)
  .filter(([, valor]) => valor.estat === 'confirmat')
  .map(([camp, valor]) => [camp, { ...valor, alternatives: [] }]));

/**
 * El que es desa al cofre: els titulars, i només els valors confirmats amb
 * les seues fonts (sense alternatives). Els tributs i les representacions
 * sense cap valor confirmat no hi van.
 */
export function perAlCofre(f) {
  exigixFitxa(f);
  const nova = copia(f);
  nova.titulars = nova.titulars.map((t) => ({ ...t, camps: nomesConfirmats(t.camps) }));
  nova.tributs = nova.tributs.map((t) => ({ ...t, camps: nomesConfirmats(t.camps) })).filter((t) => Object.keys(t.camps).length);
  nova.representacions = nova.representacions.map((r) => ({ ...r, camps: nomesConfirmats(r.camps) })).filter((r) => Object.keys(r.camps).length);
  return tanca(nova);
}

/**
 * Llig una fitxa que ve del cofre: l'esquema i la versió, totes les regles
 * de validaFitxa i que només hi haja valors confirmats sense alternatives.
 * Llança FITXA_INVALIDA si no; torna una còpia congelada si sí.
 */
export function llegixDelCofre(v) {
  if (!esObjecte(v) || v.schema !== SCHEMA_FITXA || v.versio !== 1) throw errorAmbCodi('FITXA_INVALIDA', 'El registre del cofre no és una fitxa d’identitat v1.');
  const errors = validaFitxa(v);
  for (const llista of ['titulars', 'tributs', 'representacions']) {
    (Array.isArray(v[llista]) ? v[llista] : []).forEach((portador, i) => {
      for (const [camp, valor] of Object.entries(portador?.camps ?? {})) {
        if (valor?.estat !== 'confirmat' || valor.alternatives?.length) {
          error(errors, 'NO_CONFIRMAT', `${llista}[${i}].camps.${camp}`, 'Al cofre només hi ha valors confirmats.');
        }
      }
    });
  }
  if (errors.length) throw errorAmbCodi('FITXA_INVALIDA', `La fitxa del cofre no és vàlida: ${errors.map((e) => e.missatge).join(' ')}`, errors);
  return congela(copia(v));
}
