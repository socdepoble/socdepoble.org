/**
 * registre.js — esquemes del manifest de tractor i del registre d'aprovació.
 *
 * Pur i síncron. `avaluaEstat` només mira l'estructura i les dates; la prova
 * criptogràfica la verifica aprovacio.js. Davant de qualsevol dubte, l'estat
 * és 'pendent' (mai 'aprovat').
 */
import { base64url, desdeBase64url, jsonCanonic } from './canonic.js';

export const SCHEMA_TRACTOR = 'sdp.tractor.v1';
export const SCHEMA_APROVACIO = 'sdp.aprovacio.v1';
export const NIVELLS = Object.freeze(['confirmacio', 'signatura']);
export const DECISIONS = Object.freeze(['aprovat', 'revocat']);
export const ESTATS = Object.freeze(['pendent', 'aprovat', 'caducat', 'revocat', 'empremta-divergent']);
/* Camps que la UI pot afegir al manifest i que no entren a l'empremta. */
export const CAMPS_DERIVATS = Object.freeze(['empremta', 'empremtaCurta', 'estat', 'aprovacio']);
export const PATRO_EMPREMTA = /^sha256:[0-9a-f]{64}$/;
export const PATRO_ID_TRACTOR = /^[a-z0-9]+(\.[a-z0-9-]+)+$/;
export const DIA_MS = 86400000;

const PATRO_SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?(\+[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;
const PATRO_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
const CAMPS_MANIFEST = Object.freeze([
  'schema', 'id', 'nom', 'versio', 'descripcio', 'fitxa', 'fonts', 'llig', 'escriu',
  'xarxa', 'dadesPersonals', 'nivellMinim', 'caducitatDies'
]);
const CAMPS_REGISTRE = Object.freeze([
  'schema', 'tractor', 'versio', 'empremta', 'decisio', 'nivell', 'data', 'caduca', 'nonce', 'prova'
]);
const CAMPS_PROVA = Object.freeze(['tipus', 'credencial', 'authenticatorData', 'clientDataJSON', 'signatura']);

function esObjecte(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function textPle(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function esRutaRelativa(ruta) {
  return typeof ruta === 'string' && ruta.length > 0 && !ruta.startsWith('/') && !ruta.includes('\\')
    && ruta.split('/').every((tros) => tros !== '' && tros !== '.' && tros !== '..');
}

function base64urlCanonic(text, longitud) {
  if (typeof text !== 'string' || !text) return false;
  try {
    const bytes = desdeBase64url(text);
    return base64url(bytes) === text && (longitud === undefined || bytes.length === longitud);
  } catch {
    return false;
  }
}

/* Instant en mil·lisegons d'un Date, d'un número o d'un ISO UTC estricte; NaN si no és vàlid. */
export function instantDe(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : NaN;
  if (Object.prototype.toString.call(valor) === '[object Date]') return valor.getTime();
  if (typeof valor !== 'string' || !PATRO_ISO.test(valor)) return NaN;
  const ms = Date.parse(valor);
  if (!Number.isFinite(ms)) return NaN;
  const iso = new Date(ms).toISOString();
  return iso === valor || iso === valor.replace('Z', '.000Z') ? ms : NaN;
}

export function rangNivell(nivell) {
  return NIVELLS.indexOf(nivell);
}

export function validaManifest(manifest) {
  if (!esObjecte(manifest)) return ['El manifest ha de ser un objecte.'];
  const m = manifest;
  const errors = [];
  for (const clau of Object.keys(m)) {
    if (!CAMPS_MANIFEST.includes(clau) && !CAMPS_DERIVATS.includes(clau)) errors.push(`Camp desconegut: «${clau}».`);
  }
  if (m.schema !== SCHEMA_TRACTOR) errors.push(`schema ha de ser «${SCHEMA_TRACTOR}».`);
  if (typeof m.id !== 'string' || !PATRO_ID_TRACTOR.test(m.id)) {
    errors.push('id ha de tindre la forma «ambit.nom» (minúscules, xifres i guions).');
  }
  if (!textPle(m.nom)) errors.push('nom és obligatori.');
  if (typeof m.versio !== 'string' || !PATRO_SEMVER.test(m.versio)) errors.push('versio ha de ser semver (p. ex. 1.0.0).');
  if (!textPle(m.descripcio)) errors.push('descripcio és obligatòria.');
  if (!esRutaRelativa(m.fitxa)) errors.push('fitxa ha de ser una ruta relativa.');
  if (!Array.isArray(m.fonts) || m.fonts.length === 0) {
    errors.push('fonts ha de llistar almenys una ruta de codi.');
  } else {
    if (!m.fonts.every(esRutaRelativa)) errors.push('fonts només admet rutes relatives.');
    if (new Set(m.fonts).size !== m.fonts.length) errors.push('fonts té rutes repetides.');
  }
  for (const camp of ['llig', 'escriu']) {
    if (!Array.isArray(m[camp]) || !m[camp].every(textPle)) errors.push(`${camp} ha de ser una llista de rutes o patrons.`);
  }
  if (!textPle(m.xarxa)) errors.push('xarxa ha de ser «cap» o descriure on es connecta.');
  if (typeof m.dadesPersonals !== 'boolean') errors.push('dadesPersonals ha de ser booleà.');
  if (!NIVELLS.includes(m.nivellMinim)) errors.push(`nivellMinim ha de ser ${NIVELLS.join(' o ')}.`);
  if (m.caducitatDies !== null && !(Number.isSafeInteger(m.caducitatDies) && m.caducitatDies > 0)) {
    errors.push('caducitatDies ha de ser null o un enter positiu.');
  }
  return errors;
}

export function validaRegistre(registre) {
  if (!esObjecte(registre)) return ['El registre ha de ser un objecte.'];
  const r = registre;
  const errors = [];
  for (const clau of Object.keys(r)) {
    if (!CAMPS_REGISTRE.includes(clau)) errors.push(`Camp desconegut: «${clau}».`);
  }
  if (r.schema !== SCHEMA_APROVACIO) errors.push(`schema ha de ser «${SCHEMA_APROVACIO}».`);
  if (typeof r.tractor !== 'string' || !PATRO_ID_TRACTOR.test(r.tractor)) errors.push('tractor no és un identificador vàlid.');
  if (typeof r.versio !== 'string' || !PATRO_SEMVER.test(r.versio)) errors.push('versio ha de ser semver.');
  if (typeof r.empremta !== 'string' || !PATRO_EMPREMTA.test(r.empremta)) errors.push('empremta ha de ser «sha256:» + 64 hex.');
  if (!DECISIONS.includes(r.decisio)) errors.push(`decisio ha de ser ${DECISIONS.join(' o ')}.`);
  if (!NIVELLS.includes(r.nivell)) errors.push(`nivell ha de ser ${NIVELLS.join(' o ')}.`);
  const data = instantDe(r.data);
  if (typeof r.data !== 'string' || !Number.isFinite(data)) errors.push('data ha de ser una data ISO en UTC.');
  if (r.caduca !== null) {
    const caduca = instantDe(r.caduca);
    if (typeof r.caduca !== 'string' || !Number.isFinite(caduca)) errors.push('caduca ha de ser null o una data ISO en UTC.');
    else if (Number.isFinite(data) && caduca <= data) errors.push('caduca ha de ser posterior a data.');
  }
  if (!base64urlCanonic(r.nonce, 16)) errors.push('nonce ha de ser base64url de 16 bytes.');
  const teProva = Object.prototype.hasOwnProperty.call(r, 'prova');
  if (r.nivell === 'confirmacio' && teProva) errors.push('Una confirmació escrita no porta prova.');
  if (r.nivell === 'signatura') {
    if (!esObjecte(r.prova)) {
      errors.push('El nivell signatura exigix una prova WebAuthn.');
    } else {
      for (const clau of Object.keys(r.prova)) {
        if (!CAMPS_PROVA.includes(clau)) errors.push(`Camp desconegut a la prova: «${clau}».`);
      }
      if (r.prova.tipus !== 'webauthn') errors.push('prova.tipus ha de ser «webauthn».');
      for (const camp of CAMPS_PROVA.slice(1)) {
        if (!base64urlCanonic(r.prova[camp])) errors.push(`prova.${camp} ha de ser base64url.`);
      }
    }
  }
  return errors;
}

/* El que signa WebAuthn: el registre sencer menys la prova. */
export function preimatgeRegistre(registre) {
  if (!esObjecte(registre)) throw new TypeError('preimatgeRegistre: s\'esperava un registre.');
  const senseProva = {};
  for (const clau of Object.keys(registre)) {
    if (clau !== 'prova') senseProva[clau] = registre[clau];
  }
  return jsonCanonic(senseProva);
}

/* Per data ascendent; una data il·legible va al final (fail-closed). En empat,
   la revocació va darrere i, per tant, guanya. El sort és estable. */
export function ordenaRegistres(registres) {
  const instant = (r) => {
    const ms = instantDe(r?.data);
    return Number.isFinite(ms) ? ms : Infinity;
  };
  return [...registres].sort((a, b) => {
    const ia = instant(a);
    const ib = instant(b);
    if (ia !== ib) return ia < ib ? -1 : 1;
    return (a?.decisio === 'revocat' ? 1 : 0) - (b?.decisio === 'revocat' ? 1 : 0);
  });
}

function caducitatEfectiva(registre, manifest) {
  const limits = [];
  if (registre.caduca !== null) limits.push(instantDe(registre.caduca));
  if (manifest.caducitatDies !== null) limits.push(instantDe(registre.data) + manifest.caducitatDies * DIA_MS);
  return limits.length ? Math.min(...limits) : null;
}

export function avaluaEstat({ manifest, empremta, registres, ara } = {}) {
  const pendent = (motiu, registre = null) => ({ estat: 'pendent', registre, motiu });
  const errorsManifest = validaManifest(manifest);
  if (errorsManifest.length) return pendent(`El manifest no és vàlid: ${errorsManifest[0]}`);
  if (typeof empremta !== 'string' || !PATRO_EMPREMTA.test(empremta)) {
    return pendent('No hi ha cap empremta vàlida de la versió actual.');
  }
  const ms = instantDe(ara);
  if (!Number.isFinite(ms)) return pendent('Sense una data actual vàlida no es pot avaluar l\'aprovació.');

  const propis = (Array.isArray(registres) ? registres : []).filter((r) => r?.tractor === manifest.id);
  if (!propis.length) return pendent('Aquest tractor no s\'ha aprovat mai.');
  for (const r of propis) {
    const errors = validaRegistre(r);
    if (errors.length) return pendent(`Hi ha un registre d'aprovació malformat: ${errors[0]}`);
  }
  const ordenats = ordenaRegistres(propis);
  const vigent = ordenats[ordenats.length - 1];

  if (instantDe(vigent.data) > ms) return pendent('El registre més recent té una data futura.', vigent);
  if (vigent.decisio === 'revocat') {
    return { estat: 'revocat', registre: vigent, motiu: `Aprovació revocada el ${vigent.data}.` };
  }
  if (vigent.empremta !== empremta || vigent.versio !== manifest.versio) {
    return {
      estat: 'empremta-divergent',
      registre: vigent,
      motiu: `L'aprovació és d'una altra versió (${vigent.versio}); el codi o la fitxa han canviat.`
    };
  }
  const caduca = caducitatEfectiva(vigent, manifest);
  if (caduca !== null && ms >= caduca) {
    return { estat: 'caducat', registre: vigent, motiu: `L'aprovació va caducar el ${new Date(caduca).toISOString()}.` };
  }
  if (rangNivell(vigent.nivell) < rangNivell(manifest.nivellMinim)) {
    return pendent(`Cal el nivell «${manifest.nivellMinim}» i l'aprovació és de «${vigent.nivell}».`, vigent);
  }
  return { estat: 'aprovat', registre: vigent, motiu: `Aprovat amb ${vigent.nivell} el ${vigent.data}.` };
}
