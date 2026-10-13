/**
 * aprovacio.js — la Porta d'Aprovació de Tractors.
 *
 * Cap tractor s'executa sense una aprovació vigent de la versió exacta
 * (empremta). Dos nivells: 'confirmacio' (el Mestre escriu l'empremta curta)
 * i 'signatura' (WebAuthn amb verificació d'usuari: el gest biomètric o el PIN
 * el fa la persona, però un programa que ja controle el navegador podria
 * registrar-hi una clau pròpia; és el model d'amenaça de les fitxes).
 * `exigeixAprovacio` és FAIL-CLOSED: qualsevol dubte és error.
 */
import { aBytes, base64url, desdeBase64url, desdeUtf8, igualsBytes, resolSubtle, sha256, utf8 } from './canonic.js';
import { empremtaCurta } from './empremta.js';
import {
  DECISIONS, DIA_MS, NIVELLS, PATRO_EMPREMTA, SCHEMA_APROVACIO,
  avaluaEstat, instantDe, preimatgeRegistre, rangNivell, validaManifest, validaRegistre
} from './registre.js';
import { ALG_ES256, ALG_RS256, FLAG_UP, FLAG_UV, extreuClauDeRegistre, verificaAssercio } from './webauthn.js';

export const CODIS_APROVACIO = Object.freeze([
  'APROVACIO_REQUERIDA', 'EMPREMTA_DIVERGENT', 'APROVACIO_CADUCADA',
  'APROVACIO_REVOCADA', 'NIVELL_INSUFICIENT', 'SIGNATURA_INVALIDA'
]);
const TEMPS_WEBAUTHN_MS = 120000;

export class ErrorAprovacio extends Error {
  constructor(codi, missatge, { registre = null, cause } = {}) {
    super(missatge, cause === undefined ? undefined : { cause });
    this.name = 'ErrorAprovacio';
    this.codi = codi;
    this.registre = registre;
  }
}

function aleatoris(n) {
  if (typeof globalThis.crypto?.getRandomValues !== 'function') {
    throw new Error('Cal crypto.getRandomValues per a generar aleatoris.');
  }
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

function nonceDe(nonce) {
  if (nonce === undefined) return base64url(aleatoris(16));
  const bytes = typeof nonce === 'string' ? desdeBase64url(nonce) : aBytes(nonce);
  if (bytes.length !== 16) throw new TypeError('El nonce ha de tindre 16 bytes.');
  return base64url(bytes);
}

/* Detecció per a la UI (Safari 16, Chrome 100 i Firefox 100 tenen WebAuthn,
   però només en context segur). */
export function webauthnDisponible(entorn = globalThis) {
  return typeof entorn?.PublicKeyCredential === 'function'
    && typeof entorn.navigator?.credentials?.get === 'function'
    && typeof entorn.navigator?.credentials?.create === 'function';
}

export async function autenticadorDePlataforma(entorn = globalThis) {
  if (!webauthnDisponible(entorn)) return false;
  const pkc = entorn.PublicKeyCredential;
  if (typeof pkc.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false;
  try {
    return (await pkc.isUserVerifyingPlatformAuthenticatorAvailable()) === true;
  } catch {
    return false;
  }
}

export function preparaRegistre({ manifest, empremta, decisio, nivell, ara = Date.now(), nonce } = {}) {
  const errors = validaManifest(manifest);
  if (errors.length) throw new TypeError(`Manifest invàlid: ${errors.join(' ')}`);
  if (typeof empremta !== 'string' || !PATRO_EMPREMTA.test(empremta)) throw new TypeError('Empremta mal formada.');
  if (!DECISIONS.includes(decisio)) throw new TypeError(`decisio ha de ser ${DECISIONS.join(' o ')}.`);
  if (!NIVELLS.includes(nivell)) throw new TypeError(`nivell ha de ser ${NIVELLS.join(' o ')}.`);
  if (decisio === 'aprovat' && rangNivell(nivell) < rangNivell(manifest.nivellMinim)) {
    throw new ErrorAprovacio('NIVELL_INSUFICIENT', `Aquest tractor exigix «${manifest.nivellMinim}».`);
  }
  const ms = instantDe(ara);
  if (!Number.isFinite(ms)) throw new TypeError('ara ha de ser una data vàlida.');
  const caduca = decisio === 'aprovat' && manifest.caducitatDies !== null
    ? new Date(ms + manifest.caducitatDies * DIA_MS).toISOString()
    : null;
  return {
    schema: SCHEMA_APROVACIO,
    tractor: manifest.id,
    versio: manifest.versio,
    empremta,
    decisio,
    nivell,
    data: new Date(ms).toISOString(),
    caduca,
    nonce: nonceDe(nonce)
  };
}

/* El repte WebAuthn lliga la signatura al registre sencer (menys la prova). */
export async function repteDeRegistre(registre, subtle) {
  return sha256(utf8(preimatgeRegistre(registre)), subtle);
}

export async function signaAmbWebAuthn({ registre, credencial, credentials = globalThis.navigator?.credentials, rpId, subtle } = {}) {
  if (!credentials || typeof credentials.get !== 'function') {
    throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'Aquest navegador no oferix WebAuthn.');
  }
  if (registre?.nivell !== 'signatura') {
    throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'Només es signen registres de nivell «signatura».');
  }
  if (typeof rpId !== 'string' || !rpId) throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'Falta el rpId.');
  let id;
  try {
    id = desdeBase64url(credencial);
  } catch (error) {
    throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'Credencial mal formada.', { cause: error });
  }
  const senseProva = {};
  for (const clau of Object.keys(registre)) {
    if (clau !== 'prova') senseProva[clau] = registre[clau];
  }
  const repte = await repteDeRegistre(senseProva, subtle);
  let resposta;
  try {
    resposta = await credentials.get({
      publicKey: {
        challenge: repte,
        rpId,
        allowCredentials: [{ type: 'public-key', id }],
        userVerification: 'required',
        timeout: TEMPS_WEBAUTHN_MS
      }
    });
  } catch (error) {
    throw new ErrorAprovacio('SIGNATURA_INVALIDA', `La signatura no s'ha completat: ${error?.message ?? String(error)}`, { cause: error });
  }
  const r = resposta?.response;
  if (!resposta?.rawId || !r?.authenticatorData || !r.clientDataJSON || !r.signature) {
    throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'L\'autenticador no ha tornat cap asserció.');
  }
  const usada = base64url(resposta.rawId);
  if (usada !== credencial) throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'Ha signat una credencial diferent.');
  return {
    ...senseProva,
    prova: {
      tipus: 'webauthn',
      credencial: usada,
      authenticatorData: base64url(r.authenticatorData),
      clientDataJSON: base64url(r.clientDataJSON),
      signatura: base64url(r.signature)
    }
  };
}

/* Registra una clau de plataforma (Touch ID, Windows Hello, clau de pas).
   `origen` i `repte` són opcionals; si hi ha origen, es comprova. */
export async function registraClauWebAuthn({
  credentials = globalThis.navigator?.credentials, rpId, nomRp = 'Sóc de Poble', subtle, origen, repte
} = {}) {
  if (!credentials || typeof credentials.create !== 'function') {
    throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'Aquest navegador no oferix WebAuthn.');
  }
  if (typeof rpId !== 'string' || !rpId) throw new ErrorAprovacio('SIGNATURA_INVALIDA', 'Falta el rpId.');
  const falla = (motiu, cause) => new ErrorAprovacio('SIGNATURA_INVALIDA', `Registre de clau rebutjat: ${motiu}`, { cause });
  const s = resolSubtle(subtle);
  const repteBytes = repte === undefined ? aleatoris(32) : aBytes(repte);
  let resposta;
  try {
    resposta = await credentials.create({
      publicKey: {
        challenge: repteBytes,
        rp: { id: rpId, name: nomRp },
        user: { id: aleatoris(16), name: 'aprovador-tractors', displayName: 'Aprovador de tractors' },
        pubKeyCredParams: [
          { type: 'public-key', alg: ALG_ES256 },
          { type: 'public-key', alg: ALG_RS256 }
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        attestation: 'none',
        timeout: TEMPS_WEBAUTHN_MS
      }
    });
  } catch (error) {
    throw falla(error?.message ?? String(error), error);
  }
  const r = resposta?.response;
  if (!resposta?.rawId || !r?.attestationObject || !r.clientDataJSON) throw falla('resposta incompleta.');
  try {
    const client = JSON.parse(desdeUtf8(r.clientDataJSON));
    if (client?.type !== 'webauthn.create') throw falla('clientData.type no és webauthn.create.');
    if (client.challenge !== base64url(repteBytes)) throw falla('el repte no coincidix.');
    if (origen !== undefined && client.origin !== origen) throw falla(`origen inesperat (${String(client.origin)}).`);
    const clau = extreuClauDeRegistre(r.attestationObject);
    if (!igualsBytes(clau.rpIdHash, await sha256(rpId, s))) throw falla('el rpIdHash no correspon al rpId.');
    if (!(clau.flags & FLAG_UP) || !(clau.flags & FLAG_UV)) throw falla('cal presència i verificació d\'usuari.');
    if (clau.credencial !== base64url(resposta.rawId)) throw falla('l\'identificador de credencial no quadra.');
    /* Importar-la valida que el punt és de la corba. */
    await s.importKey('jwk', clau.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return { credencial: clau.credencial, jwk: clau.jwk };
  } catch (error) {
    if (error instanceof ErrorAprovacio) throw error;
    throw falla(error?.message ?? String(error), error);
  }
}

export async function verificaRegistre({ registre, claus, origen, rpId, subtle } = {}) {
  try {
    const errors = validaRegistre(registre);
    if (errors.length) return { valid: false, motiu: `Registre malformat: ${errors[0]}` };
    if (registre.nivell === 'confirmacio') {
      return { valid: true, motiu: 'Confirmació escrita: no porta prova criptogràfica.' };
    }
    const clau = (Array.isArray(claus) ? claus : []).find((c) => c?.credencial === registre.prova.credencial);
    if (!clau) return { valid: false, motiu: 'La credencial que signa no és cap de les claus registrades.' };
    const repte = await repteDeRegistre(registre, subtle);
    return await verificaAssercio({ jwk: clau.jwk, assercio: registre.prova, repte, origen, rpId }, subtle);
  } catch (error) {
    return { valid: false, motiu: `No s'ha pogut verificar: ${error?.message ?? String(error)}` };
  }
}

/* Insensible a majúscules, espais i guions (també els tipogràfics). */
export function confirmacioValida(textEscrit, empremta) {
  if (typeof textEscrit !== 'string') return false;
  let curta;
  try {
    curta = empremtaCurta(empremta);
  } catch {
    return false;
  }
  const net = (text) => text.replace(/[\s‐-―−-]/g, '').toUpperCase();
  return net(textEscrit) === net(curta);
}

const CODI_PER_ESTAT = Object.freeze({
  revocat: 'APROVACIO_REVOCADA',
  'empremta-divergent': 'EMPREMTA_DIVERGENT',
  caducat: 'APROVACIO_CADUCADA'
});

/* Torna una còpia del registre vigent o llança ErrorAprovacio. */
export async function exigeixAprovacio({ manifest, empremta, registres, claus, ara, origen, rpId, subtle } = {}) {
  let avaluacio;
  try {
    avaluacio = avaluaEstat({ manifest, empremta, registres, ara });
  } catch (error) {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s'ha pogut avaluar l'aprovació: ${error?.message ?? String(error)}`, { cause: error });
  }
  const { estat, registre, motiu } = avaluacio;
  if (estat !== 'aprovat') {
    if (CODI_PER_ESTAT[estat]) throw new ErrorAprovacio(CODI_PER_ESTAT[estat], motiu, { registre });
    const nivellBaix = registre?.decisio === 'aprovat'
      && rangNivell(registre.nivell) < rangNivell(manifest?.nivellMinim);
    throw new ErrorAprovacio(nivellBaix ? 'NIVELL_INSUFICIENT' : 'APROVACIO_REQUERIDA', motiu, { registre });
  }
  const verificacio = await verificaRegistre({ registre, claus, origen, rpId, subtle });
  if (!verificacio.valid) throw new ErrorAprovacio('SIGNATURA_INVALIDA', verificacio.motiu, { registre });
  return JSON.parse(JSON.stringify(registre));
}
