/* B8-SERVIDOR · S2 (marató 261101_2143; ordre del Mestre 261101) · El Web Push
   de notifica-xat: VAPID (RFC 8292) amb ES256 fet amb WebCrypto i un push
   SENSE COS (RFC 8030), el despertador cec que public/sw.js convertix sempre
   en «Tens missatges nous». Sense cos no hi ha res que xifrar (RFC 8291): el
   servidor no guarda mai p256dh ni auth, i cap fil, remitent ni text no ix
   cap a cap servei de push (D-B8S-1).
   Pur i sense dependències: fetch, WebCrypto, URL, TextEncoder, TextDecoder,
   AbortController, setTimeout i atob/btoa, que tenen igual Deno (index.ts) i
   Node (les proves Vitest). Mai Buffer ni Deno.*. Cap regex amb repetició
   niada. Cap endpoint, JWT ni clau no ix d'ací: ni al registre ni a cap error.
   Contra SSRF: només els serveis de push dels navegadors, amb la mateixa
   llista que SERVEIS_DE_PUSH (src/pwa/avisosPush.js) i que
   private.xat_push_adreca_valida (la migració); paritat.test.js ho prova. */
import { aBase64url, deBase64url } from '../_shared/apple.js';

export const WEB_PUSH = Object.freeze({
  /* Un dia: amb Topic el servei només guarda un avís pendent, i un
     despertador cec lliurat en tornar la cobertura continua sent cert. */
  TTL_S: 86400,
  /* RFC 8030 §5.3: «normal» és la de la missatgeria; el contracte únic
     (B8-SERVIDOR §2.9, D-B8S-16). */
  URGENCIA: 'normal',
  /* RFC 8030 §5.4: el servei substituïx el pendent amb el mateix tema. És
     l'etiqueta dels avisos del Xat (ETIQUETA_AVIS_XAT, public/sw.js). */
  TEMA: 'sdp-xat',
  /* RFC 8292 §2: com a molt 24 h; 12 h. */
  DURADA_JWT_S: 43200,
  MAXIM_ENDPOINT: 2048
});

/* La llista blanca: l'amfitrió sencer o un subdomini dels sufixos. */
export const AMFITRIONS_EXACTES = Object.freeze(['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'push.apple.com', 'notify.windows.com']);
export const SUFIXOS_ADMESOS = Object.freeze(['.push.apple.com', '.notify.windows.com']);

const ASCII_VISIBLE = /^[!-~]+$/;
const AMFITRIO_NET = /^[a-z0-9.-]+$/;
const FORMA_PUBLICA = /^[A-Za-z0-9_-]{87}$/;
const FORMA_PRIVADA = /^[A-Za-z0-9_-]{43}$/;
const ECDSA_P256 = Object.freeze({ name: 'ECDSA', namedCurve: 'P-256' });
const SIGNA_ES256 = Object.freeze({ name: 'ECDSA', hash: 'SHA-256' });
/* El cos d'un 429 d'Apple es llig com a molt fins a 4 KiB (com natius.js). */
const MAXIM_COS_ERROR = 4096;
const FORMA_MOTIU = /^[A-Za-z]{1,64}$/;

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const jsonEnBase64url = (objecte) => aBase64url(new TextEncoder().encode(JSON.stringify(objecte)));

/** Si l'amfitrió és d'un servei de push conegut: minúscules, sense punt al davant ni etiquetes buides. */
export function amfitrioAdmes(host) {
  if (typeof host !== 'string' || host.length === 0 || host.length > 253) return false;
  if (!AMFITRIO_NET.test(host) || host.startsWith('.') || host.includes('..')) return false;
  return AMFITRIONS_EXACTES.includes(host) || SUFIXOS_ADMESOS.some((sufix) => host.endsWith(sufix));
}

/**
 * { endpoint, audiencia, amfitrio } o null. La forma canònica del client:
 * https, ASCII visible, com a molt MAXIM_ENDPOINT caràcters, sense fragment,
 * amb camí, i un amfitrió llegit a mà (abans de cap «/») que ha de ser el
 * mateix que dona URL: així no hi caben credencials, port, IP literal,
 * majúscules ni trucs de barra inversa o de percentatge.
 */
export function formaDeLEndpoint(text) {
  if (typeof text !== 'string' || text.length > WEB_PUSH.MAXIM_ENDPOINT || !text.startsWith('https://')) return null;
  if (!ASCII_VISIBLE.test(text) || text.includes('#')) return null;
  const resta = text.slice('https://'.length);
  const barra = resta.indexOf('/');
  if (barra <= 0) return null;
  const amfitrio = resta.slice(0, barra);
  if (!amfitrioAdmes(amfitrio)) return null;
  let url;
  try { url = new URL(text); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hostname !== amfitrio) return null;
  return { endpoint: text, audiencia: `https://${amfitrio}`, amfitrio };
}

/**
 * La clau VAPID importada i comprovada, o null. `publica`: el punt P-256 sense
 * comprimir (65 bytes, 0x04 al davant) en base64url, 87 caràcters, la mateixa
 * que VITE_PUSH_VAPID_PUBLICA del client. `privada`: l'escalar d (43). Fa una
 * autoprova (signa i verifica una sonda amb la pública crua): Node rebutja un
 * parell barrejat en importar-lo, però un altre runtime potser no.
 */
export async function clauVapid({ publica, privada } = {}, subtle = globalThis.crypto.subtle) {
  if (typeof publica !== 'string' || typeof privada !== 'string' || !FORMA_PUBLICA.test(publica) || !FORMA_PRIVADA.test(privada)) return null;
  try {
    const punt = deBase64url(publica);
    if (punt.length !== 65 || punt[0] !== 4) return null;
    const clau = await subtle.importKey('jwk', {
      kty: 'EC', crv: 'P-256', d: privada, x: aBase64url(punt.subarray(1, 33)), y: aBase64url(punt.subarray(33)), ext: false
    }, ECDSA_P256, false, ['sign']);
    const verificadora = await subtle.importKey('raw', punt, ECDSA_P256, false, ['verify']);
    const sonda = new TextEncoder().encode('sdp-vapid-sonda');
    const ok = await subtle.verify(SIGNA_ES256, verificadora, await subtle.sign(SIGNA_ES256, clau, sonda), sonda);
    return ok ? { clau, publica } : null;
  } catch {
    return null;
  }
}

/** El contacte del JWT (sub): mailto:algu@domini o https://…, sense espais i de com a molt 200 caràcters; o null. */
export function contacteVapid(text) {
  const t = textNet(text);
  if (!t || t.length > 200 || !ASCII_VISIBLE.test(t)) return null;
  if (t.startsWith('mailto:')) {
    const arroba = t.indexOf('@');
    return arroba > 'mailto:'.length && arroba < t.length - 1 ? t : null;
  }
  if (t.startsWith('https://')) {
    try { return new URL(t).protocol === 'https:' ? t : null; } catch { return null; }
  }
  return null;
}

/** El JWT VAPID (RFC 8292): ES256, aud = l'origen del servei, exp a 12 h, sub = el contacte. Signatura P1363 (r‖s, 64 bytes). */
export async function jwtVapid({ clau, audiencia, contacte, ara = Date.now() }, subtle = globalThis.crypto.subtle) {
  const dades = `${jsonEnBase64url({ typ: 'JWT', alg: 'ES256' })}.${jsonEnBase64url({ aud: audiencia, exp: Math.floor(ara / 1000) + WEB_PUSH.DURADA_JWT_S, sub: contacte })}`;
  const signatura = await subtle.sign(SIGNA_ES256, clau, new TextEncoder().encode(dades));
  return `${dades}.${aBase64url(new Uint8Array(signatura))}`;
}

/** La petició d'un push sense cos: cap body ni Content-Encoding, i redirect: 'error' (contra SSRF). */
export function peticioWebPush({ endpoint, jwt, publica }) {
  return {
    url: endpoint,
    opcions: {
      method: 'POST',
      redirect: 'error',
      headers: {
        Authorization: `vapid t=${jwt}, k=${publica}`,
        TTL: String(WEB_PUSH.TTL_S),
        Urgency: WEB_PUSH.URGENCIA,
        Topic: WEB_PUSH.TEMA,
        'Content-Length': '0'
      }
    }
  };
}

/**
 * enviat | expulsa | rebutjat | ritme | reintenta | fallit (mai «config»).
 * Només 404 i 410 expulsen. 401 i 403 són «rebutjat»: el servei els dona
 * també a UNA subscripció feta amb una altra applicationServerKey (Mozilla
 * 401 errno 109, FCM i Apple 403), així que no diuen res de la clau pròpia
 * (G1-B-seg-01): es compten per aparell, no pausen el web i mai expulsen
 * (ARB-B8S-02, D-B8S-13). L'únic «config» del web és la signatura del JWT
 * propi que falla (creaEnviadorWeb). Un 429 pausa l'amfitrió, excepte el
 * `TooManyRequests` d'Apple (massa avisos seguits a UN aparell): es
 * reintenta en una altra passada i no pausa Safari per als altres (A-02,
 * com classificaApns). `motiu` només el porta Apple (motiuDApple).
 */
export function classificaWebPush(estat, motiu = null) {
  if (estat === 200 || estat === 201 || estat === 202) return 'enviat';
  if (estat === 404 || estat === 410) return 'expulsa';
  if (estat === 401 || estat === 403) return 'rebutjat';
  if (estat === 429 && motiu === 'TooManyRequests') return 'reintenta';
  if (estat === 429) return 'ritme';
  if (!estat || estat >= 500) return 'reintenta';
  return 'fallit';
}

/* El cos de la resposta d'un servei de push no es llig (es cancel·la), amb
   una sola excepció: el 429 d'Apple, per saber si és d'un aparell. */
function cancellaElCos(r) {
  if (r && r.body && !r.body.locked && typeof r.body.cancel === 'function') r.body.cancel().catch(() => {});
}

const esApple = (amfitrio) => amfitrio === 'push.apple.com' || amfitrio.endsWith('.push.apple.com');

/* El `reason` d'un error d'Apple Web Push ({ reason }, el vocabulari
   d'APNs), llegit com a molt fins a MAXIM_COS_ERROR bytes; null si passa,
   si el topall talla, si no és JSON o si no té forma. Mai llança. */
async function motiuDApple(r, senyal) {
  const declarada = Number(r.headers?.get?.('content-length'));
  if (Number.isFinite(declarada) && declarada > MAXIM_COS_ERROR) return null;
  if (!r.body || typeof r.body.getReader !== 'function' || senyal.aborted) return null;
  const lector = r.body.getReader();
  const talla = () => { lector.cancel().catch(() => {}); };
  senyal.addEventListener('abort', talla, { once: true });
  const parts = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done || senyal.aborted) break;
      const bytes = ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : new Uint8Array(0);
      total += bytes.byteLength;
      if (total > MAXIM_COS_ERROR) { talla(); return null; }
      parts.push(bytes);
    }
  } catch {
    talla();
    return null;
  } finally {
    senyal.removeEventListener('abort', talla);
  }
  if (senyal.aborted) return null;
  const tot = new Uint8Array(total);
  let posicio = 0;
  for (const part of parts) { tot.set(part, posicio); posicio += part.byteLength; }
  let cos;
  try { cos = JSON.parse(new TextDecoder().decode(tot)); } catch { return null; }
  const motiu = cos && typeof cos === 'object' ? cos.reason : null;
  return typeof motiu === 'string' && FORMA_MOTIU.test(motiu) ? motiu : null;
}

/**
 * L'enviador web d'una passada, o null sense SDP_PUSH_VAPID_PUBLICA,
 * SDP_PUSH_VAPID_PRIVADA i SDP_PUSH_VAPID_SUBJECTE vàlids (B8-SERVIDOR §2.9).
 * L'enviador, `async (forma | endpoint) → { resultat, amfitrio, estat }`,
 * torna a validar l'endpoint (una forma dolenta és «invalid» i no es busca
 * mai), guarda el JWT per audiència dins de la passada, posa el topall amb
 * AbortController (també per al cos d'un 429 d'Apple, l'únic que es llig),
 * cancel·la la resta de cossos de resposta i no llança mai.
 */
export async function creaEnviadorWeb({ env = {}, fetch = globalThis.fetch, subtle = globalThis.crypto.subtle, ara = Date.now, topallMs = 8000 } = {}) {
  const contacte = contacteVapid(env.SDP_PUSH_VAPID_SUBJECTE);
  if (!contacte) return null;
  const vapid = await clauVapid({ publica: textNet(env.SDP_PUSH_VAPID_PUBLICA), privada: textNet(env.SDP_PUSH_VAPID_PRIVADA) }, subtle);
  if (!vapid) return null;

  /* Una promesa per audiència: vuit treballadors alhora signen una sola vegada. */
  const jwts = new Map();
  const jwtDe = (audiencia) => {
    if (!jwts.has(audiencia)) {
      const promesa = jwtVapid({ clau: vapid.clau, audiencia, contacte, ara: ara() }, subtle);
      jwts.set(audiencia, promesa);
      promesa.catch(() => jwts.delete(audiencia));
    }
    return jwts.get(audiencia);
  };

  return async function enviaWeb(entrada) {
    const forma = formaDeLEndpoint(typeof entrada === 'string' ? entrada : entrada?.endpoint);
    if (!forma) return { resultat: 'invalid', amfitrio: null, estat: 0 };
    let jwt;
    /* La clau pròpia no signa: l'únic senyal global del web, que el pausa. */
    try { jwt = await jwtDe(forma.audiencia); } catch { return { resultat: 'config', amfitrio: forma.amfitrio, estat: 0 }; }
    const { url, opcions } = peticioWebPush({ endpoint: forma.endpoint, jwt, publica: vapid.publica });
    const control = new AbortController();
    const rellotge = setTimeout(() => control.abort(), topallMs);
    let r = null;
    try {
      r = await fetch(url, { ...opcions, signal: control.signal });
      const estat = Number.isInteger(r?.status) ? r.status : 0;
      const motiu = estat === 429 && esApple(forma.amfitrio) ? await motiuDApple(r, control.signal) : null;
      return { resultat: classificaWebPush(estat, motiu), amfitrio: forma.amfitrio, estat };
    } catch {
      /* La xarxa o el topall: es pot tornar a provar en una altra passada. */
      return { resultat: 'reintenta', amfitrio: forma.amfitrio, estat: 0 };
    } finally {
      clearTimeout(rellotge);
      cancellaElCos(r);
    }
  };
}
