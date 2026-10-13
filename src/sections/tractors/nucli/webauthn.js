/**
 * webauthn.js — verificació local de WebAuthn (ES256), sense servidor.
 *
 * Inclou el mínim de CBOR per a llegir l'attestationObject i la clau COSE
 * (Firefox 100 no té `getPublicKey()`), i la verificació d'una asserció amb
 * presència (UP) i verificació d'usuari (UV) obligatòries. `verificaAssercio`
 * no llança mai: qualsevol cosa estranya torna { valid: false }.
 */
import { aBytes, base64url, concatena, desdeBase64url, desdeUtf8, igualsBytes, resolSubtle, sha256 } from './canonic.js';

export const FLAG_UP = 0x01;
export const FLAG_UV = 0x04;
export const FLAG_AT = 0x40;
export const FLAG_ED = 0x80;
export const ALG_ES256 = -7;
export const ALG_RS256 = -257;

const PROFUNDITAT_MAXIMA = 16;
const LLARGARIA_MAXIMA_CREDENCIAL = 1023;

function errorCbor(motiu) {
  const error = new TypeError(`CBOR: ${motiu}.`);
  error.codi = 'CBOR_INVALID';
  return error;
}

function errorWebAuthn(motiu) {
  const error = new TypeError(`WebAuthn: ${motiu}.`);
  error.codi = 'WEBAUTHN_INVALID';
  return error;
}

function cal(b, estat, n) {
  if (estat.pos + n > b.length) throw errorCbor('dades truncades');
}

function llegixArgument(b, vista, estat, info) {
  if (info < 24) return info;
  let valor;
  if (info === 24) {
    cal(b, estat, 1);
    valor = b[estat.pos];
    estat.pos += 1;
  } else if (info === 25) {
    cal(b, estat, 2);
    valor = vista.getUint16(estat.pos);
    estat.pos += 2;
  } else if (info === 26) {
    cal(b, estat, 4);
    valor = vista.getUint32(estat.pos);
    estat.pos += 4;
  } else if (info === 27) {
    cal(b, estat, 8);
    valor = vista.getUint32(estat.pos) * 2 ** 32 + vista.getUint32(estat.pos + 4);
    estat.pos += 8;
    if (!Number.isSafeInteger(valor)) throw errorCbor('enter massa gran');
  } else {
    throw errorCbor('longitud indefinida o reservada');
  }
  return valor;
}

function mitjaPrecisio(h) {
  const signe = h & 0x8000 ? -1 : 1;
  const exponent = (h >> 10) & 0x1f;
  const mantissa = h & 0x3ff;
  if (exponent === 0) return signe * 2 ** -14 * (mantissa / 1024);
  if (exponent === 31) return mantissa ? NaN : signe * Infinity;
  return signe * 2 ** (exponent - 15) * (1 + mantissa / 1024);
}

function llegixSimple(b, vista, estat, info) {
  switch (info) {
    case 20: return false;
    case 21: return true;
    case 22: return null;
    case 23: return undefined;
    case 25: {
      cal(b, estat, 2);
      const valor = mitjaPrecisio(vista.getUint16(estat.pos));
      estat.pos += 2;
      return valor;
    }
    case 26: {
      cal(b, estat, 4);
      const valor = vista.getFloat32(estat.pos);
      estat.pos += 4;
      return valor;
    }
    case 27: {
      cal(b, estat, 8);
      const valor = vista.getFloat64(estat.pos);
      estat.pos += 8;
      return valor;
    }
    default:
      throw errorCbor(`valor simple ${info} no admés`);
  }
}

function llegixElement(b, vista, estat, profunditat) {
  if (profunditat > PROFUNDITAT_MAXIMA) throw errorCbor('massa nivells d\'imbricació');
  cal(b, estat, 1);
  const inicial = b[estat.pos];
  estat.pos += 1;
  const major = inicial >> 5;
  const info = inicial & 0x1f;
  if (major === 7) return llegixSimple(b, vista, estat, info);
  if (major === 6) throw errorCbor('les etiquetes (major 6) no s\'admeten');
  const n = llegixArgument(b, vista, estat, info);
  switch (major) {
    case 0:
      return n;
    case 1:
      return -1 - n;
    case 2: {
      cal(b, estat, n);
      const valor = b.slice(estat.pos, estat.pos + n);
      estat.pos += n;
      return valor;
    }
    case 3: {
      cal(b, estat, n);
      const valor = desdeUtf8(b.subarray(estat.pos, estat.pos + n));
      estat.pos += n;
      return valor;
    }
    case 4: {
      cal(b, estat, n);
      const valor = [];
      for (let i = 0; i < n; i++) valor.push(llegixElement(b, vista, estat, profunditat + 1));
      return valor;
    }
    default: {
      cal(b, estat, n * 2);
      const valor = new Map();
      for (let i = 0; i < n; i++) {
        const clau = llegixElement(b, vista, estat, profunditat + 1);
        if (typeof clau !== 'number' && typeof clau !== 'string') throw errorCbor('clau de mapa no admesa');
        if (valor.has(clau)) throw errorCbor('clau de mapa repetida');
        valor.set(clau, llegixElement(b, vista, estat, profunditat + 1));
      }
      return valor;
    }
  }
}

/* Llig un element des de `posicio` i torna on acaba (per a dades encadenades). */
export function llegixCbor(bytes, posicio = 0) {
  const b = aBytes(bytes);
  const estat = { pos: posicio };
  const valor = llegixElement(b, new DataView(b.buffer, b.byteOffset, b.byteLength), estat, 0);
  return { valor, posicio: estat.pos };
}

/* Mapes com a Map, cadenes de bytes com a Uint8Array. Sense bytes sobrants. */
export function descodificaCbor(bytes) {
  const b = aBytes(bytes);
  const { valor, posicio } = llegixCbor(b, 0);
  if (posicio !== b.length) throw errorCbor('sobren bytes darrere del valor');
  return valor;
}

export function llegixAuthenticatorData(bytes) {
  const b = aBytes(bytes);
  if (b.length < 37) throw errorWebAuthn('authenticatorData massa curt');
  const vista = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const flags = b[32];
  const dades = { rpIdHash: b.slice(0, 32), flags, comptador: vista.getUint32(33), credencial: null };
  let pos = 37;
  if (flags & FLAG_AT) {
    if (b.length < pos + 18) throw errorWebAuthn('dades de credencial truncades');
    const aaguid = b.slice(pos, pos + 16);
    const llargaria = vista.getUint16(pos + 16);
    pos += 18;
    if (llargaria === 0 || llargaria > LLARGARIA_MAXIMA_CREDENCIAL || pos + llargaria > b.length) {
      throw errorWebAuthn('identificador de credencial invàlid');
    }
    const id = b.slice(pos, pos + llargaria);
    pos += llargaria;
    const clau = llegixCbor(b, pos);
    pos = clau.posicio;
    dades.credencial = { aaguid, id, clauCose: clau.valor };
  }
  if (flags & FLAG_ED) pos = llegixCbor(b, pos).posicio;
  if (pos !== b.length) throw errorWebAuthn('authenticatorData amb bytes sobrants');
  return dades;
}

/* Només EC2 / P-256 / ES256 (alg -7). */
export function clauCoseAJwk(cose) {
  if (!(cose instanceof Map)) throw errorWebAuthn('la clau COSE ha de ser un mapa');
  if (cose.get(1) !== 2) throw errorWebAuthn('la clau COSE ha de ser EC2');
  if (cose.get(3) !== ALG_ES256) throw errorWebAuthn('l\'algorisme ha de ser ES256 (-7)');
  if (cose.get(-1) !== 1) throw errorWebAuthn('la corba ha de ser P-256');
  const x = cose.get(-2);
  const y = cose.get(-3);
  if (!(x instanceof Uint8Array) || x.length !== 32 || !(y instanceof Uint8Array) || y.length !== 32) {
    throw errorWebAuthn('coordenades de la clau incorrectes');
  }
  return { kty: 'EC', crv: 'P-256', x: base64url(x), y: base64url(y) };
}

/* No verifica l'atestació (es demana 'none'): la confiança ve de la cerimònia
   local. Torna també rpIdHash i flags perquè qui registra els comprove. */
export function extreuClauDeRegistre(attestationObjectBytes) {
  const objecte = descodificaCbor(attestationObjectBytes);
  if (!(objecte instanceof Map)) throw errorWebAuthn('attestationObject ha de ser un mapa');
  const fmt = objecte.get('fmt');
  const authData = objecte.get('authData');
  if (typeof fmt !== 'string' || !(authData instanceof Uint8Array)) throw errorWebAuthn('attestationObject incomplet');
  const dades = llegixAuthenticatorData(authData);
  if (!dades.credencial) throw errorWebAuthn('el registre no porta credencial (flag AT)');
  return {
    credencial: base64url(dades.credencial.id),
    jwk: clauCoseAJwk(dades.credencial.clauCose),
    rpIdHash: dades.rpIdHash,
    flags: dades.flags,
    fmt
  };
}

/* ECDSA en DER (el que dona WebAuthn) → r||s de 64 bytes (el que vol WebCrypto). DER estricte. */
export function derASignaturaCrua(der) {
  const b = aBytes(der);
  let pos = 0;
  const llig = () => {
    if (pos >= b.length) throw errorWebAuthn('signatura DER truncada');
    return b[pos++];
  };
  if (llig() !== 0x30) throw errorWebAuthn('la signatura no és una SEQUENCE DER');
  const total = llig();
  if (total & 0x80 || total !== b.length - 2) throw errorWebAuthn('longitud DER incorrecta');
  const enter = () => {
    if (llig() !== 0x02) throw errorWebAuthn('s\'esperava un INTEGER DER');
    const n = llig();
    if (n === 0 || n > 33 || pos + n > b.length) throw errorWebAuthn('INTEGER DER fora de mida');
    let valor = b.subarray(pos, pos + n);
    pos += n;
    if (valor[0] & 0x80) throw errorWebAuthn('INTEGER DER negatiu');
    if (valor.length > 1 && valor[0] === 0 && !(valor[1] & 0x80)) throw errorWebAuthn('INTEGER DER no mínim');
    if (valor[0] === 0 && valor.length > 1) valor = valor.subarray(1);
    if (valor.length > 32) throw errorWebAuthn('INTEGER DER massa llarg');
    const eixida = new Uint8Array(32);
    eixida.set(valor, 32 - valor.length);
    return eixida;
  };
  const r = enter();
  const s = enter();
  if (pos !== b.length) throw errorWebAuthn('bytes sobrants a la signatura');
  return concatena(r, s);
}

function bytesDe(valor) {
  return typeof valor === 'string' ? desdeBase64url(valor) : aBytes(valor);
}

export async function verificaAssercio({ jwk, assercio, repte, origen, rpId } = {}, subtle) {
  const invalid = (motiu) => ({ valid: false, motiu });
  try {
    const s = resolSubtle(subtle);
    if (!assercio) return invalid('Falta l\'asserció.');
    if (jwk?.kty !== 'EC' || jwk?.crv !== 'P-256' || typeof jwk.x !== 'string' || typeof jwk.y !== 'string') {
      return invalid('La clau pública no és EC P-256.');
    }
    if (typeof origen !== 'string' || !origen) return invalid('Falta l\'origen esperat.');
    if (typeof rpId !== 'string' || !rpId) return invalid('Falta el rpId esperat.');
    const authData = bytesDe(assercio.authenticatorData);
    const clientData = bytesDe(assercio.clientDataJSON);
    const signatura = bytesDe(assercio.signatura);

    let client;
    try {
      client = JSON.parse(desdeUtf8(clientData));
    } catch {
      return invalid('clientDataJSON il·legible.');
    }
    if (!client || typeof client !== 'object') return invalid('clientDataJSON il·legible.');
    if (client.type !== 'webauthn.get') return invalid('clientData.type no és webauthn.get.');
    if (typeof client.challenge !== 'string' || client.challenge !== base64url(repte)) {
      return invalid('El repte signat no és el d\'aquest registre.');
    }
    if (client.origin !== origen) return invalid(`Origen inesperat: ${String(client.origin)}.`);
    if (client.crossOrigin === true) return invalid('No s\'admeten assercions des d\'un iframe d\'un altre origen.');

    const dades = llegixAuthenticatorData(authData);
    if (!igualsBytes(dades.rpIdHash, await sha256(rpId, s))) return invalid('El rpIdHash no correspon al rpId.');
    if (!(dades.flags & FLAG_UP)) return invalid('Falta la presència d\'usuari (UP).');
    if (!(dades.flags & FLAG_UV)) return invalid('Falta la verificació d\'usuari (UV): cal Touch ID o PIN.');

    const crua = derASignaturaCrua(signatura);
    const clau = await s.importKey(
      'jwk',
      { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
    const missatge = concatena(authData, await sha256(clientData, s));
    const ok = await s.verify({ name: 'ECDSA', hash: 'SHA-256' }, clau, crua, missatge);
    return ok ? { valid: true, motiu: 'Signatura WebAuthn vàlida.' } : invalid('La signatura no verifica.');
  } catch (error) {
    return invalid(`Asserció il·legible: ${error?.message ?? String(error)}`);
  }
}
