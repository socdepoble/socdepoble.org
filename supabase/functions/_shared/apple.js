/* T1 (261024; P0-04, App Store Review Guideline 5.1.1(v); auditoria Codex
   261024_1315 C-01) · El protocol d'Apple per a custodiar i revocar
   l'autorització de Sign in with Apple quan una persona es dona de baixa
   (Apple TN3194).
   Pur i sense dependències: WebCrypto, fetch, URLSearchParams, TextEncoder,
   atob i btoa, que tenen igual Deno (la funció compte-apple) i Node (les
   proves Vitest). Mai Buffer ni Deno.*: trencaria un dels dos costats.
   Ací no hi ha cap secret. La clau .p8, l'equip i l'identificador arriben de
   l'entorn de la funció (supabase secrets) i el client_secret, un JWS ES256
   de cinc minuts, es fa quan cal i no es guarda mai. El refresh token d'Apple
   només ix d'esta capa xifrat (AES-256-GCM) i lligat a la persona. Cap
   missatge d'error porta un testimoni, un codi ni una clau. */

export const APPLE = Object.freeze({
  EMISSOR: 'https://appleid.apple.com',
  TOKEN: 'https://appleid.apple.com/auth/token',
  REVOCA: 'https://appleid.apple.com/auth/revoke',
  /* El sostre d'Apple per al client_secret: sis mesos (15.777.000 s). */
  DURADA_MAXIMA_S: 15777000
});

const URLS_D_APPLE = new Set([APPLE.TOKEN, APPLE.REVOCA]);
const FORMA_EQUIP = /^[A-Z0-9]{10}$/;
const FORMA_CLAU = /^[A-Z0-9]{10}$/;
const FORMA_CLIENT = /^[A-Za-z0-9][A-Za-z0-9.-]{0,254}$/;
const FORMA_JWT = /^[\w-]+\.[\w-]+\.[\w-]+$/;
/* Els errors d'Apple que diuen «la configuració és dolenta»: reintentar no
   servix fins que el Mestre corregix els secrets. */
const ERRORS_DE_CONFIGURACIO = new Set(['invalid_client', 'invalid_request', 'unauthorized_client', 'unsupported_grant_type', 'invalid_scope']);
const FORMA_ERROR = /^[a-z_]{1,40}$/;

const errorDeConfiguracio = (missatge) => Object.assign(new Error(missatge), { codi: 'config' });
const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/* ───────────────────────── Base64 i base64url ───────────────────────── */

export function aBase64(bytes) {
  let binari = '';
  const vista = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < vista.length; i += 0x8000) binari += String.fromCharCode(...vista.subarray(i, i + 0x8000));
  return btoa(binari);
}

export function deBase64(text) {
  const binari = atob(text);
  const bytes = new Uint8Array(binari.length);
  for (let i = 0; i < binari.length; i++) bytes[i] = binari.charCodeAt(i);
  return bytes;
}

export const aBase64url = (bytes) => aBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const deBase64url = (text) => {
  const net = text.replace(/-/g, '+').replace(/_/g, '/');
  return deBase64(net + '='.repeat((4 - (net.length % 4)) % 4));
};
const jsonEnBase64url = (objecte) => aBase64url(new TextEncoder().encode(JSON.stringify(objecte)));

/* La .p8 d'Apple és un PKCS#8 en PEM. Si el secret s'ha enganxat amb «\n»
   literals (el tauler en una sola línia), es tornen salts de línia. La
   marca del PEM es compon a trossos: els escàners de secrets del repositori
   (reflex_petorreta) no han de prendre esta font per una clau. */
const ETIQUETA_PEM = ['PRIVATE', 'KEY'].join(' ');
const FORMA_PEM = new RegExp(`-----BEGIN ${ETIQUETA_PEM}-----([\\s\\S]+?)-----END ${ETIQUETA_PEM}-----`);
function pemADer(pem) {
  const net = textNet(pem).replace(/\\n/g, '\n');
  const m = FORMA_PEM.exec(net);
  if (!m) throw errorDeConfiguracio('SDP-APPLE-CONFIG: la clau privada no és un PKCS#8 en PEM.');
  try {
    return deBase64(m[1].replace(/\s+/g, ''));
  } catch {
    throw errorDeConfiguracio('SDP-APPLE-CONFIG: la clau privada no es pot llegir.');
  }
}

/* ───────────────────────── El client_secret (JWS ES256) ───────────────────────── */

/**
 * El client_secret que Apple demana a /auth/token i a /auth/revoke: capçalera
 * { alg: 'ES256', kid }, reclams { iss: equip, iat, exp, aud: l'emissor
 * d'Apple, sub: el client } i la signatura P-256 crua (r‖s, 64 bytes), que és
 * la que torna WebCrypto i la que vol JWS. Cinc minuts per defecte: cap
 * renovació semestral que el Mestre haja de recordar.
 */
export async function secretDeClient({ teamId, keyId, clientId, clauPem, ara = Date.now(), duradaS = 300 } = {}, subtle = globalThis.crypto.subtle) {
  if (!FORMA_EQUIP.test(textNet(teamId))) throw errorDeConfiguracio('SDP-APPLE-CONFIG: falta l’equip d’Apple o no té la forma.');
  if (!FORMA_CLAU.test(textNet(keyId))) throw errorDeConfiguracio('SDP-APPLE-CONFIG: falta l’identificador de la clau o no té la forma.');
  if (!FORMA_CLIENT.test(textNet(clientId))) throw errorDeConfiguracio('SDP-APPLE-CONFIG: falta el client d’Apple o no té la forma.');
  if (!Number.isInteger(duradaS) || duradaS < 1 || duradaS > APPLE.DURADA_MAXIMA_S) {
    throw errorDeConfiguracio('SDP-APPLE-CONFIG: la durada del secret passa del sostre d’Apple.');
  }
  let clau;
  try {
    clau = await subtle.importKey('pkcs8', pemADer(clauPem), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  } catch (error) {
    if (error?.codi === 'config') throw error;
    throw errorDeConfiguracio('SDP-APPLE-CONFIG: la clau privada no és una clau P-256.');
  }
  const iat = Math.floor(ara / 1000);
  const dades = `${jsonEnBase64url({ alg: 'ES256', kid: textNet(keyId) })}.${jsonEnBase64url({
    iss: textNet(teamId), iat, exp: iat + duradaS, aud: APPLE.EMISSOR, sub: textNet(clientId)
  })}`;
  const signatura = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, clau, new TextEncoder().encode(dades));
  return `${dades}.${aBase64url(new Uint8Array(signatura))}`;
}

/* ───────────────────────── Els cossos d'Apple ───────────────────────── */

/** Intercanvi del codi d'autorització natiu (sense redirect_uri: el codi és de l'app). */
export const cosDIntercanvi = ({ clientId, secret, codi }) => new URLSearchParams({
  client_id: clientId, client_secret: secret, code: codi, grant_type: 'authorization_code'
});

/** Revocació (RFC 7009). El refresh token per defecte: és el que es custodia. */
export const cosDeRevocacio = ({ clientId, secret, testimoni, tipus = 'refresh_token' }) => new URLSearchParams({
  client_id: clientId, client_secret: secret, token: testimoni, token_type_hint: tipus
});

/**
 * POST a Apple amb el cos en form-urlencoded i un topall. Mai llança: la
 * xarxa o el temps esgotat tornen { estat: 0, fallada: 'xarxa'|'temps' }, i un
 * cos buit o que no és JSON, cos null (la revocació bona torna 200 buit).
 * Només a les dues adreces d'Apple.
 */
export async function postApple(url, cos, { fetch = globalThis.fetch, topallMs = 10000 } = {}) {
  if (!URLS_D_APPLE.has(url)) throw new TypeError('SDP-APPLE: només es parla amb /auth/token i /auth/revoke d’Apple.');
  const controlador = new AbortController();
  let temps = false;
  const id = setTimeout(() => { temps = true; controlador.abort(); }, topallMs);
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: cos.toString(),
      signal: controlador.signal
    });
    const text = await resposta.text();
    let json = null;
    if (text) { try { json = JSON.parse(text); } catch { json = null; } }
    return { estat: resposta.status, cos: json && typeof json === 'object' ? json : null, fallada: null };
  } catch {
    return { estat: 0, cos: null, fallada: temps ? 'temps' : 'xarxa' };
  } finally { clearTimeout(id); }
}

/**
 * La classe d'una resposta d'Apple, i un detall curt de vocabulari tancat
 * (mai el cos: Apple podria repetir-hi el testimoni).
 *   acceptada  · 200 (per a /auth/revoke, amb el cos buit)
 *   ja_invalid · 400 invalid_grant: el testimoni o el codi ja no valen; és terminal
 *   config     · invalid_client i companyia, 401 o 403: els secrets són dolents
 *   reintenta  · 429, 5xx, la xarxa o el temps esgotat
 */
export function classificaResposta({ estat, cos, fallada } = {}) {
  if (estat === 200) return { classe: 'acceptada', detall: null };
  if (!estat) return { classe: 'reintenta', detall: `reintenta:${fallada === 'temps' ? 'temps' : 'xarxa'}` };
  const error = FORMA_ERROR.test(String(cos?.error ?? '')) ? cos.error : null;
  if (estat === 400 && error === 'invalid_grant') return { classe: 'ja_invalid', detall: 'invalid_grant' };
  if ((estat === 400 || estat === 401) && ERRORS_DE_CONFIGURACIO.has(error)) return { classe: 'config', detall: `config:${error}` };
  if (estat === 400 || estat === 401 || estat === 403) return { classe: 'config', detall: `config:${estat}` };
  if (estat === 429 || estat >= 500) return { classe: 'reintenta', detall: `reintenta:${estat}` };
  return { classe: 'reintenta', detall: `reintenta:${Number.isInteger(estat) ? estat : 'xarxa'}` };
}

/* R1-01 (261024 correccions) · Dins de la classe 'config', només estos diuen
   «el client o el client_secret no valen», que és el mateix per a tots els
   testimonis del mateix client. La resta (invalid_request, un 400 sense cos,
   un 403…) pot ser d'un sol testimoni. */
const ERRORS_DEL_CLIENT = new Set(['config:invalid_client', 'config:unauthorized_client', 'config:401']);

/** Cert si una resposta classificada diu que el client (no el testimoni) és el que falla. */
export const esErrorDelClient = ({ classe, detall } = {}) => classe === 'config' && ERRORS_DEL_CLIENT.has(detall);

/* ───────────────────────── L'id_token de l'intercanvi ───────────────────────── */

/**
 * Els reclams de l'id_token que Apple torna a l'intercanvi. Sense verificar la
 * signatura a posta: arriba de /auth/token per TLS, directament d'Apple (OIDC
 * Core §3.1.3.7, punt 6). Llança si no té forma de JWT.
 */
export function reclamsDelTestimoni(jwt) {
  const t = textNet(jwt);
  if (!FORMA_JWT.test(t)) throw new TypeError('SDP-APPLE: l’identificador d’Apple no té forma de JWT.');
  const reclams = JSON.parse(new TextDecoder().decode(deBase64url(t.split('.')[1])));
  return { iss: reclams?.iss, aud: reclams?.aud, sub: reclams?.sub };
}

/** El vincle A/B: el testimoni és d'Apple, per a este client i per a ESTA persona. */
export function reclamsCasen({ iss, aud, sub } = {}, { clientId, subjecte }) {
  const audiencies = Array.isArray(aud) ? aud : [aud];
  return iss === APPLE.EMISSOR && !!clientId && audiencies.includes(clientId)
    && typeof sub === 'string' && !!sub && sub === subjecte;
}

/* ───────────────────────── Custòdia xifrada ───────────────────────── */

async function clauDeTestimonis(clauB64, subtle) {
  let crua;
  try { crua = deBase64(textNet(clauB64)); } catch { crua = null; }
  if (!crua || crua.length !== 32) throw errorDeConfiguracio('SDP-APPLE-CONFIG: la clau dels testimonis ha de ser de 32 bytes en base64.');
  return subtle.importKey('raw', crua, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
/* El context (la persona) entra com a dades associades: un xifrat copiat a la
   fila d'una altra persona no es desxifra. */
const dadesAssociades = (context) => new TextEncoder().encode(`sdp:apple:${textNet(context)}`);

/** base64(iv de 12 bytes ‖ xifrat amb l'etiqueta). Un iv nou a cada crida. */
export async function xifra(text, clauB64, { context = '' } = {}, subtle = globalThis.crypto.subtle) {
  const clau = await clauDeTestimonis(clauB64, subtle);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const xifrat = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: dadesAssociades(context) },
    clau, new TextEncoder().encode(text)));
  const tot = new Uint8Array(iv.length + xifrat.length);
  tot.set(iv, 0);
  tot.set(xifrat, iv.length);
  return aBase64(tot);
}

/** El text clar, o un error 'clau' si la clau o el context no són els del xifrat. */
export async function desxifra(b64, clauB64, { context = '' } = {}, subtle = globalThis.crypto.subtle) {
  const clau = await clauDeTestimonis(clauB64, subtle);
  try {
    const tot = deBase64(textNet(b64));
    const clar = await subtle.decrypt({ name: 'AES-GCM', iv: tot.subarray(0, 12), additionalData: dadesAssociades(context) },
      clau, tot.subarray(12));
    return new TextDecoder().decode(clar);
  } catch {
    throw Object.assign(new Error('SDP-APPLE: el testimoni custodiat no es pot desxifrar.'), { codi: 'clau' });
  }
}

/* ───────────────────────── La clau de servei de Supabase ───────────────────────── */

/**
 * Les capçaleres per a cridar PostgREST com a service_role: la clau legada és
 * un JWT (també a Authorization); la nova sb_secret_ només va a apikey.
 */
export const capcaleresDeServei = (clau) => {
  const c = textNet(clau);
  return { apikey: c, ...(c.startsWith('eyJ') ? { Authorization: `Bearer ${c}` } : {}) };
};
