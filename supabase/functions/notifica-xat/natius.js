/* B8-SERVIDOR · S3 (marató 261101_2143; ordre del Mestre 261101) · Els
   proveïdors natius de notifica-xat: APNs (JWT ES256 amb la clau .p8) i FCM
   HTTP v1 (OAuth 2.0 amb un JWT RS256 del compte de servei). PREPARATS I
   INACTIUS fins que el Mestre pose els secrets: sense SDP_APNS_* o
   SDP_FCM_COMPTE_SERVEI vàlids, el proveïdor no apareix i el gestor compta
   els aparells en sense_proveidor, sense esborrar-ne cap (D-B8S-10).
   Avís cec (D-B8S-1): el text literal de public/sw.js en la llengua de la
   fila i desti '/xat'. Cap fil, remitent, text del missatge ni loc-key (les
   claus localitzades haurien de viure dins del projecte natiu).
   Només expulsen APNs 410 i FCM 404 UNREGISTERED. BadDeviceToken,
   DeviceTokenNotForTopic, SENDER_ID_MISMATCH i THIRD_PARTY_AUTH_ERROR poden
   ser de configuració (entorn d'APNs o projecte de Firebase equivocats),
   però també d'UN testimoni que qualsevol persona amb sessió pot desar: són
   «rebutjat», que el gestor compta per aparell, que mai expulsa (ARB-B8S-02,
   D-B8S-13) i que mai pausa el proveïdor per als altres (G1-B-seg-01). Només
   és «config» (pausa) el que ve de la credencial pròpia: APNs 403 i FCM 401
   o 403 sense codi d'aparell.
   La credencial de cada proveïdor (el JWT d'APNs, el testimoni d'OAuth de
   FCM) es demana a xat_push_credencial i, si no n'hi ha, es fa i es desa amb
   xat_push_desa_credencial, com a molt una vegada per passada: APNs respon
   429 si el JWT es refà més d'una vegada cada 20 minuts (R3). La desada va
   lligada a la clau que la va fer (G1-B-doctr-02): el JWT d'APNs ha de dur
   el kid i l'equip d'ara i verificar amb la .p8 d'ara, i el testimoni de FCM
   porta davant l'empremta del compte de servei. Si no casa, se'n fa una de
   nova, que la base accepta perquè dura més.
   Pur i sense dependències: fetch, WebCrypto, TextEncoder, TextDecoder,
   URLSearchParams, AbortController, setTimeout i atob/btoa, que tenen igual
   Deno (index.ts) i Node (Vitest). Mai Buffer ni Deno.*. Totes les URL són
   fixes (contra SSRF): el testimoni d'APNs i el projecte de FCM es validen
   abans d'entrar al camí, i el token_uri del compte de servei no es llig
   mai. Cap secret, testimoni, JWT ni credencial ix d'ací: ni al registre ni
   a cap error. Cap regex amb repetició niada. */
import { aBase64url, deBase64, deBase64url } from '../_shared/apple.js';

/* Els cinc textos de public/sw.js (TEXTOS_AVIS), idèntics: natius.test.js ho comprova. */
export const TEXTOS_AVIS = Object.freeze({
  ca: Object.freeze({ titol: 'Sóc de Poble', cos: 'Tens missatges nous' }),
  es: Object.freeze({ titol: 'Sóc de Poble', cos: 'Tienes mensajes nuevos' }),
  en: Object.freeze({ titol: 'Sóc de Poble', cos: 'You have new messages' }),
  eu: Object.freeze({ titol: 'Sóc de Poble', cos: 'Mezu berriak dituzu' }),
  gl: Object.freeze({ titol: 'Sóc de Poble', cos: 'Tes mensaxes novas' })
});

/* L'únic destí que viatja (el client l'ignora i resol el fil ell mateix),
   l'etiqueta que agrupa els avisos (la de sw.js i del Topic web) i un dia de
   vida, com el Web Push. */
export const AVIS_NATIU = Object.freeze({ DESTI: '/xat', ETIQUETA: 'sdp-xat', TTL_S: 86400 });

export const APNS = Object.freeze({
  PRODUCCIO: 'https://api.push.apple.com',
  SANDBOX: 'https://api.sandbox.push.apple.com',
  /* 50 minuts: Apple el vol de menys d'una hora, i la base el torna amb cinc de marge. */
  DURADA_CREDENCIAL_S: 3000,
  /* L'appId de capacitor.config.json. */
  TOPIC_PER_DEFECTE: 'org.socdepoble.app'
});

export const FCM = Object.freeze({
  TOKEN: 'https://oauth2.googleapis.com/token',
  ABAST: 'https://www.googleapis.com/auth/firebase.messaging',
  MISSATGES: 'https://fcm.googleapis.com/v1/projects',
  DURADA_JWT_S: 3600,
  /* La credencial es desa amb cinc minuts menys de vida que el testimoni. */
  MARGE_S: 300,
  /* El canal dels avisos del Xat a Android (CANAL_XAT, src/natiu/avisosNatius.js). */
  CANAL: 'xat',
  /* El tipus del detall d'error de FCM v1 que porta errorCode. */
  TIPUS_ERROR: 'type.googleapis.com/google.firebase.fcm.v1.FcmError'
});

/* Sostres de lectura: el cos d'un error (APNs i FCM) i la resposta d'OAuth. */
const MAXIM_COS_ERROR = 4096;
const MAXIM_COS_OAUTH = 16384;
const MAXIM_COMPTE = 16384;

/* APNs: els motius de 400 que poden ser de configuració (entorn o topic
   equivocats) o d'un testimoni inventat. Mai expulsen ni pausen: compten
   per aparell (G1-B-seg-01). */
const MOTIUS_REBUTJAT_APNS = new Set(['BadDeviceToken', 'DeviceTokenNotForTopic', 'BadTopic', 'TopicDisallowed', 'MissingTopic']);
/* FCM: els codis que diuen alguna cosa del testimoni, no de la credencial pròpia. */
const CODIS_REBUTJAT_FCM = new Set(['SENDER_ID_MISMATCH', 'THIRD_PARTY_AUTH_ERROR']);

const FORMA_ID_APPLE = /^[A-Z0-9]{10}$/;
const FORMA_TOPIC = /^[A-Za-z0-9.-]{3,200}$/;
const FORMA_HEX = /^[0-9a-f]+$/;
const FORMA_FCM = /^[A-Za-z0-9_:-]+$/;
const FORMA_PROJECTE = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const FORMA_CORREU = /^[a-z0-9-]{1,64}@[a-z0-9.-]{1,160}$/;
const SUFIX_CORREU = '.iam.gserviceaccount.com';
const FORMA_CREDENCIAL = /^[A-Za-z0-9._-]+$/;
const FORMA_BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;
const FORMA_MOTIU_APNS = /^[A-Za-z]{1,64}$/;
const FORMA_CODI_FCM = /^[A-Z_]{1,64}$/;

const ECDSA_P256 = Object.freeze({ name: 'ECDSA', namedCurve: 'P-256' });
const SIGNA_ES256 = Object.freeze({ name: 'ECDSA', hash: 'SHA-256' });
const RSA_SHA256 = Object.freeze({ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' });

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');
/* L'error només porta la classe: mai el valor que l'ha provocat. */
const errorDe = (codi) => Object.assign(new Error(`SDP-PUSH-NATIU: ${codi}`), { codi });
const jsonEnBase64url = (objecte) => aBase64url(new TextEncoder().encode(JSON.stringify(objecte)));

/** El text de l'avís en la llengua de la fila; ca si no és una de les cinc. */
export function textDeLAvis(llengua) {
  return typeof llengua === 'string' && Object.prototype.hasOwnProperty.call(TEXTOS_AVIS, llengua) ? TEXTOS_AVIS[llengua] : TEXTOS_AVIS.ca;
}

/** Una credencial que la base pot desar (20-4096 caràcters de [A-Za-z0-9._-]). */
export const credencialValida = (valor) => typeof valor === 'string' && valor.length >= 20 && valor.length <= 4096 && FORMA_CREDENCIAL.test(valor);
export const esTestimoniApns = (t) => typeof t === 'string' && t.length >= 64 && t.length <= 200 && FORMA_HEX.test(t);
export const esTestimoniFcm = (t) => typeof t === 'string' && t.length >= 32 && t.length <= 1024 && FORMA_FCM.test(t);

/* ───────────────────────── Claus i JWT ───────────────────────── */

/* La marca del PEM es compon a trossos (com a _shared/apple.js): els escàners
   de secrets del repositori no han de prendre esta font per una clau. */
const ETIQUETA_PEM = ['PRIVATE', 'KEY'].join(' ');
const INICI_PEM = `-----BEGIN ${ETIQUETA_PEM}-----`;
const FI_PEM = `-----END ${ETIQUETA_PEM}-----`;

/**
 * Els bytes DER d'un PKCS#8 en PEM (la .p8 d'Apple i el private_key del
 * compte de servei). Admet «\n» literals (el secret enganxat en una línia).
 * Llança `codi: 'config'` si no és un PEM vàlid; sense regex de repetició.
 */
export function pemAPkcs8(pem) {
  const net = textNet(pem).replace(/\\n/g, '\n');
  const inici = net.indexOf(INICI_PEM);
  const fi = inici < 0 ? -1 : net.indexOf(FI_PEM, inici + INICI_PEM.length);
  if (inici < 0 || fi < 0) throw errorDe('config');
  const cos = net.slice(inici + INICI_PEM.length, fi).replace(/\s+/g, '');
  if (cos.length === 0 || cos.length % 4 !== 0 || !FORMA_BASE64.test(cos)) throw errorDe('config');
  try { return deBase64(cos); } catch { throw errorDe('config'); }
}

async function importaClau(pem, algorisme, subtle) {
  const der = pemAPkcs8(pem);
  try { return await subtle.importKey('pkcs8', der, algorisme, false, ['sign']); } catch { throw errorDe('config'); }
}

async function signaJwt(capcalera, reclams, clau, algorisme, subtle) {
  const dades = `${jsonEnBase64url(capcalera)}.${jsonEnBase64url(reclams)}`;
  let signatura;
  try { signatura = await subtle.sign(algorisme, clau, new TextEncoder().encode(dades)); } catch { throw errorDe('config'); }
  return `${dades}.${aBase64url(new Uint8Array(signatura))}`;
}

/**
 * El JWT del proveïdor d'APNs: { alg: 'ES256', kid } · { iss: equip, iat },
 * signatura P1363 (r‖s, 64 bytes). `clau` (ja importada) estalvia la
 * importació del PEM. L'equip i la clau han de complir ^[A-Z0-9]{10}$.
 */
export async function jwtApns({ equip, clauId, clauPem, clau = null, ara = Date.now() } = {}, subtle = globalThis.crypto.subtle) {
  const e = textNet(equip);
  const k = textNet(clauId);
  if (!FORMA_ID_APPLE.test(e) || !FORMA_ID_APPLE.test(k)) throw errorDe('config');
  const privada = clau ?? await importaClau(clauPem, ECDSA_P256, subtle);
  return signaJwt({ alg: 'ES256', kid: k }, { iss: e, iat: Math.floor(ara / 1000) }, privada, SIGNA_ES256, subtle);
}

/** La forma del compte de servei de Firebase, o null. Mai es registra. */
export function compteDeServei(text) {
  const t = textNet(text);
  if (!t || t.length > MAXIM_COMPTE) return null;
  let j;
  try { j = JSON.parse(t); } catch { return null; }
  if (!j || typeof j !== 'object' || Array.isArray(j) || j.type !== 'service_account') return null;
  const { project_id: projecte, client_email: correu, private_key: clauPem } = j;
  if (typeof projecte !== 'string' || !FORMA_PROJECTE.test(projecte)) return null;
  if (typeof correu !== 'string' || !correu.endsWith(SUFIX_CORREU) || !FORMA_CORREU.test(correu)) return null;
  if (typeof clauPem !== 'string' || !clauPem.includes(INICI_PEM)) return null;
  return { projecte, correu, clauPem };
}

/** El JWT de l'intercanvi OAuth de Google: RS256 · { iss, scope, aud, iat, exp: iat + 3600 }. */
export async function jwtFcm({ correu, clauPem, clau = null, ara = Date.now() } = {}, subtle = globalThis.crypto.subtle) {
  const c = textNet(correu);
  if (!c.endsWith(SUFIX_CORREU) || !FORMA_CORREU.test(c)) throw errorDe('config');
  const privada = clau ?? await importaClau(clauPem, RSA_SHA256, subtle);
  const iat = Math.floor(ara / 1000);
  return signaJwt({ alg: 'RS256', typ: 'JWT' }, { iss: c, scope: FCM.ABAST, aud: FCM.TOKEN, iat, exp: iat + FCM.DURADA_JWT_S }, privada, RSA_SHA256, subtle);
}

/** El formulari de l'intercanvi (RFC 7523). */
export const cosOAuth = (jwt) => new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt });

/* ───────────────────────── Peticions ───────────────────────── */

/**
 * La petició d'APNs, o null si el testimoni no és hexadecimal de 64 a 200
 * (entra al camí de l'URL). Cos: només `aps` (el text literal) i `sdp`
 * (versió i destí). Cap fil, remitent ni text del missatge.
 */
export function peticioApns({ entorn = 'produccio', topic = APNS.TOPIC_PER_DEFECTE, testimoni, jwt, llengua, ara = Date.now() } = {}) {
  if (!esTestimoniApns(testimoni)) return null;
  const { titol, cos } = textDeLAvis(llengua);
  return {
    url: `${entorn === 'sandbox' ? APNS.SANDBOX : APNS.PRODUCCIO}/3/device/${testimoni}`,
    opcions: {
      method: 'POST',
      redirect: 'error',
      headers: {
        authorization: `bearer ${jwt}`,
        'apns-topic': topic,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': String(Math.floor(ara / 1000) + AVIS_NATIU.TTL_S),
        'apns-collapse-id': AVIS_NATIU.ETIQUETA,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        aps: { alert: { title: titol, body: cos }, badge: 1, sound: 'default', 'thread-id': AVIS_NATIU.ETIQUETA },
        sdp: { v: 1, desti: AVIS_NATIU.DESTI }
      })
    }
  };
}

/** La petició de FCM HTTP v1, o null si el projecte o el testimoni no tenen forma. */
export function peticioFcm({ projecte, testimoni, accessToken, llengua } = {}) {
  if (typeof projecte !== 'string' || !FORMA_PROJECTE.test(projecte) || !esTestimoniFcm(testimoni)) return null;
  const { titol, cos } = textDeLAvis(llengua);
  return {
    url: `${FCM.MISSATGES}/${projecte}/messages:send`,
    opcions: {
      method: 'POST',
      redirect: 'error',
      headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: testimoni,
          notification: { title: titol, body: cos },
          android: { priority: 'HIGH', ttl: `${AVIS_NATIU.TTL_S}s`, collapse_key: AVIS_NATIU.ETIQUETA, notification: { tag: AVIS_NATIU.ETIQUETA, channel_id: FCM.CANAL } },
          data: { desti: AVIS_NATIU.DESTI }
        }
      })
    }
  };
}

/* ───────────────────────── Classificació ───────────────────────── */

/** El motiu d'un error d'APNs ({ reason }), o null. */
export function motiuApns(cos) {
  const motiu = cos && typeof cos === 'object' ? cos.reason : null;
  return typeof motiu === 'string' && FORMA_MOTIU_APNS.test(motiu) ? motiu : null;
}

/**
 * enviat | expulsa | config | rebutjat | ritme | reintenta | fallit.
 * 410 (Unregistered, ExpiredToken) és l'ÚNICA expulsió d'APNs. Els 400 que
 * poden ser de configuració són «rebutjat» i mai expulsen; un 403 (el JWT o
 * la clau pròpia) pausa el proveïdor; un 404 (BadPath) és nostre i tampoc
 * expulsa. Un 429 TooManyRequests és d'UN testimoni (massa avisos seguits a
 * eixe aparell): es reintenta en una altra passada (el gestor el salta en
 * la resta d'esta, A-02) i no pausa APNs (G1-B-seg-01); la resta de 429
 * (TooManyProviderTokenUpdates) són ritme.
 */
export function classificaApns(estat, motiu = null) {
  if (estat === 200) return 'enviat';
  if (estat === 410) return 'expulsa';
  if (estat === 400 && MOTIUS_REBUTJAT_APNS.has(motiu)) return 'rebutjat';
  if (estat === 403) return 'config';
  if (estat === 429 && motiu === 'TooManyRequests') return 'reintenta';
  if (estat === 429) return 'ritme';
  if (!estat || estat >= 500) return 'reintenta';
  return 'fallit';
}

/** L'errorCode d'un error de FCM v1 (el detall FcmError), o null. */
export function codiFcm(cos) {
  const detalls = cos && typeof cos === 'object' && cos.error && typeof cos.error === 'object' ? cos.error.details : null;
  if (!Array.isArray(detalls)) return null;
  for (const detall of detalls.slice(0, 16)) {
    if (detall && typeof detall === 'object' && detall['@type'] === FCM.TIPUS_ERROR && typeof detall.errorCode === 'string' && FORMA_CODI_FCM.test(detall.errorCode)) return detall.errorCode;
  }
  return null;
}

/**
 * 404 UNREGISTERED és l'ÚNICA expulsió de FCM. SENDER_ID_MISMATCH (el
 * testimoni d'un altre projecte) i THIRD_PARTY_AUTH_ERROR (la plataforma
 * d'un testimoni iOS o web) són «rebutjat», per aparell (G1-B-seg-01); un
 * 401 o 403 sense codi d'aparell és el testimoni d'OAuth propi: «config».
 * Un 400 pot ser un error nostre: mai expulsa.
 */
export function classificaFcm(estat, codi = null) {
  if (estat === 200) return 'enviat';
  if (estat === 404 && codi === 'UNREGISTERED') return 'expulsa';
  if ((estat === 401 || estat === 403) && CODIS_REBUTJAT_FCM.has(codi)) return 'rebutjat';
  if (estat === 401 || estat === 403) return 'config';
  if (estat === 429) return 'ritme';
  if (!estat || estat >= 500) return 'reintenta';
  return 'fallit';
}

/* ───────────────────────── Xarxa ───────────────────────── */

/* El JSON d'un cos, llegit com a molt fins a `maxim` bytes; null si passa, si
   el topall talla o si no és JSON. */
async function llegixJsonFitat(r, maxim, senyal) {
  const declarada = Number(r.headers?.get?.('content-length'));
  if (Number.isFinite(declarada) && declarada > maxim) return null;
  if (!r.body || typeof r.body.getReader !== 'function') return null;
  const lector = r.body.getReader();
  const talla = () => { lector.cancel().catch(() => {}); };
  if (senyal.aborted) { talla(); return null; }
  senyal.addEventListener('abort', talla, { once: true });
  const parts = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done || senyal.aborted) break;
      const bytes = ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(0);
      total += bytes.byteLength;
      if (total > maxim) { talla(); return null; }
      parts.push(bytes);
    }
  } finally {
    senyal.removeEventListener('abort', talla);
  }
  if (senyal.aborted) return null;
  const tot = new Uint8Array(total);
  let posicio = 0;
  for (const part of parts) { tot.set(part, posicio); posicio += part.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(tot)); } catch { return null; }
}

/* Un POST amb topall: { estat, cos }. Mai llança: la xarxa o el topall donen
   estat 0. El cos només es llig si `llegix(estat)`; si no, es cancel·la. */
async function peticioFitada(fetch, url, opcions, topallMs, maxim, llegix) {
  const control = new AbortController();
  const rellotge = setTimeout(() => control.abort(), topallMs);
  let r = null;
  try {
    try { r = await fetch(url, { ...opcions, signal: control.signal }); } catch { return { estat: 0, cos: null }; }
    const estat = Number.isInteger(r?.status) ? r.status : 0;
    let cos = null;
    if (llegix(estat)) { try { cos = await llegixJsonFitat(r, maxim, control.signal); } catch { cos = null; } }
    return { estat, cos };
  } finally {
    clearTimeout(rellotge);
    if (r && r.body && !r.body.locked && typeof r.body.cancel === 'function') r.body.cancel().catch(() => {});
  }
}

/**
 * L'intercanvi OAuth de Google: { acces, vidaS }. Llança `codi: 'reintenta'`
 * (xarxa, 429, 5xx) o `codi: 'config'` (qualsevol altre rebuig, o una
 * resposta sense un testimoni que la base puga desar). Sempre a FCM.TOKEN.
 */
export async function demanaAccesFcm({ jwt, fetch = globalThis.fetch, topallMs = 8000 } = {}) {
  const { estat, cos } = await peticioFitada(fetch, FCM.TOKEN, {
    method: 'POST',
    redirect: 'error',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: cosOAuth(jwt).toString()
  }, topallMs, MAXIM_COS_OAUTH, (e) => e === 200);
  if (estat === 200) {
    const acces = cos && typeof cos === 'object' ? cos.access_token : null;
    if (!credencialValida(acces)) throw errorDe('config');
    const vida = Number.isSafeInteger(cos.expires_in) && cos.expires_in > 0 ? Math.min(cos.expires_in, FCM.DURADA_JWT_S) : 0;
    return { acces, vidaS: vida };
  }
  if (!estat || estat === 429 || estat >= 500) throw errorDe('reintenta');
  throw errorDe('config');
}

/* ───────────────────────── La caché de credencials ───────────────────────── */

/**
 * Si el JWT d'APNs desat l'ha fet la configuració d'ara (G1-B-doctr-02):
 * ES256, el kid i l'equip (iss) d'ara i, amb `verificadora`, la signatura
 * de la .p8 d'ara (una .p8 corregida amb el mateix kid). Mai llança: una
 * forma estranya és fals.
 */
export async function jwtApnsDeLaClau(jwt, { equip, clauId, verificadora = null } = {}, subtle = globalThis.crypto.subtle) {
  if (!credencialValida(jwt)) return false;
  const parts = jwt.split('.');
  if (parts.length !== 3) return false;
  let capcalera;
  let reclams;
  try {
    capcalera = JSON.parse(new TextDecoder().decode(deBase64url(parts[0])));
    reclams = JSON.parse(new TextDecoder().decode(deBase64url(parts[1])));
  } catch {
    return false;
  }
  if (!capcalera || typeof capcalera !== 'object' || capcalera.alg !== 'ES256' || capcalera.kid !== clauId) return false;
  if (!reclams || typeof reclams !== 'object' || reclams.iss !== equip) return false;
  if (!verificadora) return true;
  try {
    return await subtle.verify(SIGNA_ES256, verificadora, deBase64url(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  } catch {
    return false;
  }
}

/* La pública de la .p8 d'ara, per a reconéixer els JWT desats. Si el runtime
   no la pot derivar, null: llavors només es miren el kid i l'equip. */
async function verificadoraApns(p8, subtle) {
  try {
    const extraible = await subtle.importKey('pkcs8', pemAPkcs8(p8), ECDSA_P256, true, ['sign']);
    const { x, y } = await subtle.exportKey('jwk', extraible);
    return await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x, y }, ECDSA_P256, false, ['verify']);
  } catch {
    return null;
  }
}

/* L'empremta del compte de servei que va davant del testimoni de FCM desat:
   els 8 primers bytes de SHA-256(«correu|projecte») en hexadecimal. No és cap
   secret i canvia si canvia el compte o el projecte. */
async function empremtaFcm({ correu, projecte }, subtle) {
  const resum = new Uint8Array(await subtle.digest('SHA-256', new TextEncoder().encode(`${correu}|${projecte}`)));
  return Array.from(resum.subarray(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

/* La credencial vigent (xat_push_credencial) si és de la clau d'ara, o una de
   nova, desada. `deLaClau(desada)` torna la credencial que s'usa, o null si
   no és d'esta clau; `perDesar(valor)`, el text que es desa. La nova dura
   més que la d'una clau vella, així que la base la substituïx (G1-B-doctr-02).
   Si la base no respon, «reintenta» i no se n'usa cap sense desar (un JWT
   d'APNs refet a cada passada portaria al 429 d'Apple). Si el desament torna
   fals, una altra passada n'ha desada una que dura més: es rellig i s'usa
   eixa si és d'esta clau; si no, o si la relectura falla, també «reintenta»
   (ARB-N02-02). L'única que s'usa sense desar és la de FCM massa curta (o
   massa llarga per a dur l'empremta). */
async function obteCredencial({ proveidor, rpc, fabrica, deLaClau, perDesar, avisa }) {
  const llig = async () => {
    try { return await rpc('xat_push_credencial', { p_proveidor: proveidor }); } catch { throw errorDe('reintenta'); }
  };
  const desada = await llig();
  const vigent = await deLaClau(desada);
  if (vigent) return vigent;
  if (credencialValida(desada)) avisa(`[notifica-xat] ${proveidor}: la credencial desada és d’una altra clau; se’n fa una de nova.`);
  const { valor, caducaAlMs } = await fabrica();
  if (!credencialValida(valor)) throw errorDe('config');
  const text = perDesar(valor);
  /* Massa curta per a desar-la (la base només la tornaria amb cinc minuts de
     vida) o massa llarga per a dur l'empremta: només per a esta passada. */
  if (caducaAlMs === null || !credencialValida(text)) return valor;
  let desat;
  try {
    desat = await rpc('xat_push_desa_credencial', { p_proveidor: proveidor, p_valor: text, p_caduca_al: new Date(caducaAlMs).toISOString() });
  } catch {
    throw errorDe('reintenta');
  }
  if (desat === true) return valor;
  const altra = await deLaClau(await llig());
  if (altra) return altra;
  throw errorDe('reintenta');
}

/* Una sola promesa per proveïdor i passada: els treballadors alhora no la refan. */
function credencialDeLaPassada({ proveidor, rpc, fabrica, deLaClau, perDesar, avisa }) {
  let promesa = null;
  return () => {
    if (!promesa) {
      promesa = obteCredencial({ proveidor, rpc, fabrica, deLaClau, perDesar, avisa });
      promesa.catch((error) => avisa(`[notifica-xat] ${proveidor}: sense credencial (${error?.codi === 'config' ? 'config' : 'reintenta'}).`));
    }
    return promesa;
  };
}

const resultatSenseCredencial = (error) => ({ resultat: error?.codi === 'config' ? 'config' : 'reintenta', estat: 0 });

/* ───────────────────────── Els enviadors ───────────────────────── */

const entornApns = (valor) => {
  const t = textNet(valor);
  if (t === '' || t === 'produccio') return 'produccio';
  return t === 'sandbox' ? 'sandbox' : null;
};
const topicValid = (t) => FORMA_TOPIC.test(t) && !t.startsWith('.') && !t.endsWith('.') && !t.includes('..');

async function preparaApns({ env, fetch, subtle, ara, rpc, topallMs, avisa }) {
  const equip = textNet(env.SDP_APNS_EQUIP);
  const clauId = textNet(env.SDP_APNS_CLAU_ID);
  const p8 = textNet(env.SDP_APNS_CLAU_P8);
  /* Inactiu: cap secret, cap soroll. */
  if (!equip && !clauId && !p8) return null;
  const topic = textNet(env.SDP_APNS_TOPIC) || APNS.TOPIC_PER_DEFECTE;
  const entorn = entornApns(env.SDP_APNS_ENTORN);
  const dolents = [];
  if (!FORMA_ID_APPLE.test(equip)) dolents.push('SDP_APNS_EQUIP');
  if (!FORMA_ID_APPLE.test(clauId)) dolents.push('SDP_APNS_CLAU_ID');
  let clau = null;
  try { clau = await importaClau(p8, ECDSA_P256, subtle); } catch { dolents.push('SDP_APNS_CLAU_P8'); }
  if (!topicValid(topic)) dolents.push('SDP_APNS_TOPIC');
  if (!entorn) dolents.push('SDP_APNS_ENTORN');
  if (dolents.length > 0) {
    avisa(`[notifica-xat] APNs inactiu: ${dolents.join(', ')} no vàlid.`);
    return null;
  }

  const verificadora = await verificadoraApns(p8, subtle);
  const credencial = credencialDeLaPassada({
    proveidor: 'apns', rpc, avisa,
    deLaClau: async (desada) => ((await jwtApnsDeLaClau(desada, { equip, clauId, verificadora }, subtle)) ? desada : null),
    perDesar: (valor) => valor,
    fabrica: async () => {
      const instant = ara();
      const jwt = await jwtApns({ equip, clauId, clau, ara: instant }, subtle);
      return { valor: jwt, caducaAlMs: instant + APNS.DURADA_CREDENCIAL_S * 1000 };
    }
  });

  return async function enviaApns(entrada) {
    const testimoni = entrada && typeof entrada === 'object' ? entrada.adreca : null;
    if (!esTestimoniApns(testimoni)) return { resultat: 'invalid', estat: 0 };
    let jwt;
    try { jwt = await credencial(); } catch (error) { return resultatSenseCredencial(error); }
    const { url, opcions } = peticioApns({ entorn, topic, testimoni, jwt, llengua: entrada.llengua, ara: ara() });
    const { estat, cos } = await peticioFitada(fetch, url, opcions, topallMs, MAXIM_COS_ERROR, (e) => e !== 200);
    return { resultat: classificaApns(estat, motiuApns(cos)), estat };
  };
}

async function preparaFcm({ env, fetch, subtle, ara, rpc, topallMs, avisa }) {
  const text = textNet(env.SDP_FCM_COMPTE_SERVEI);
  if (!text) return null;
  const compte = compteDeServei(text);
  let clau = null;
  if (compte) { try { clau = await importaClau(compte.clauPem, RSA_SHA256, subtle); } catch { clau = null; } }
  if (!compte || !clau) {
    avisa('[notifica-xat] FCM inactiu: SDP_FCM_COMPTE_SERVEI no vàlid.');
    return null;
  }
  const { projecte, correu } = compte;
  let prefix;
  try { prefix = `${await empremtaFcm(compte, subtle)}.`; } catch {
    avisa('[notifica-xat] FCM inactiu: sense SHA-256 per a l’empremta del compte.');
    return null;
  }
  /* El testimoni desat només val si porta l'empremta del compte d'ara; viatja sense. */
  const deLaClau = (desada) => {
    if (!credencialValida(desada) || !desada.startsWith(prefix)) return null;
    const testimoni = desada.slice(prefix.length);
    return credencialValida(testimoni) ? testimoni : null;
  };

  const credencial = credencialDeLaPassada({
    proveidor: 'fcm', rpc, avisa, deLaClau,
    perDesar: (valor) => `${prefix}${valor}`,
    fabrica: async () => {
      const instant = ara();
      const jwt = await jwtFcm({ correu, clau, ara: instant }, subtle);
      const { acces, vidaS } = await demanaAccesFcm({ jwt, fetch, topallMs });
      const util = vidaS - FCM.MARGE_S;
      return { valor: acces, caducaAlMs: util > 0 ? instant + util * 1000 : null };
    }
  });

  return async function enviaFcm(entrada) {
    const testimoni = entrada && typeof entrada === 'object' ? entrada.adreca : null;
    if (!esTestimoniFcm(testimoni)) return { resultat: 'invalid', estat: 0 };
    let accessToken;
    try { accessToken = await credencial(); } catch (error) { return resultatSenseCredencial(error); }
    const { url, opcions } = peticioFcm({ projecte, testimoni, accessToken, llengua: entrada.llengua });
    const { estat, cos } = await peticioFitada(fetch, url, opcions, topallMs, MAXIM_COS_ERROR, (e) => e !== 200);
    return { resultat: classificaFcm(estat, codiFcm(cos)), estat };
  };
}

/**
 * Els enviadors natius d'una passada: `{ apns?, fcm? }`. Cada proveïdor hi és
 * només si en té tots els secrets vàlids; si no, el registre diu quin nom de
 * secret falla (mai el valor) i el gestor compta els aparells en
 * sense_proveidor. Sense `rpc` (la caché de credencials), cap. Mai llança.
 * Cada enviador, `async ({ adreca, llengua }) → { resultat, estat }`, torna a
 * validar el testimoni («invalid» sense buscar res) i no llança mai.
 */
export async function creaEnviadorsNatius({
  env = {}, fetch = globalThis.fetch, subtle = globalThis.crypto.subtle,
  ara = Date.now, rpc = null, topallMs = 8000, registre = console
} = {}) {
  const avisa = (text) => { try { registre?.warn?.(text); } catch { /* el registre no atura res */ } };
  const entorn = env && typeof env === 'object' ? env : {};
  const enviadors = {};
  if (typeof rpc !== 'function') {
    if (textNet(entorn.SDP_APNS_CLAU_P8) || textNet(entorn.SDP_FCM_COMPTE_SERVEI)) avisa('[notifica-xat] Natius inactius: falta la caché de credencials.');
    return enviadors;
  }
  const deps = { env: entorn, fetch, subtle, ara, rpc, topallMs, avisa };
  const [apns, fcm] = await Promise.all([preparaApns(deps).catch(() => null), preparaFcm(deps).catch(() => null)]);
  if (apns) enviadors.apns = apns;
  if (fcm) enviadors.fcm = fcm;
  return enviadors;
}
