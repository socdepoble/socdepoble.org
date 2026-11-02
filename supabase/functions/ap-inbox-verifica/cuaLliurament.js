/* B5 (marató 261101_2143; P1-23 fase 2 / P2-07; spec B5-FEDERACIO §2.5) · La cua
   d'eixida signada de la inbox ActivityPub: hui, els Accept dels Follow.
   PUR i portable (Deno a index.ts, Node a Vitest): fetch, WebCrypto,
   TextEncoder, AbortController i setTimeout s'injecten o són dels dos costats.
   Mai Deno.* ni Buffer.
   · Idempotència per (activitat, inbox): un Follow repetit genera el MATEIX
     Accept (id determinista, inboxActivityPub.js) i no duplica cap fila; si la
     fila ja s'havia resolt fa més d'una hora, es torna a enviar una vegada.
   · Reintents amb espera exponencial fitada i «equal jitter» ([x/2, x]); un
     Retry-After (429/503) n'és el mínim; mai més d'un dia; 10 intents com a
     molt (unes 16 h). L'atzar s'injecta (proves deterministes).
   · Cada enviament: DNS després del filtre lèxic (una sola adreça no pública
     veta; sense resoledor, no s'envia), signatura draft-cavage-12 (rsa-sha256)
     amb la clau de l'actor local, redirect 'manual' (un 3xx és fallada),
     topall de 10 s i el cos de la resposta cancel·lat sense llegir-lo.
   Cap secret ix d'ací: ni la clau ni el cos van al registre; el motiu d'una
   fallada és un codi curt (http_503, temps, adreca_vetada…). */
import { AGENT_USUARI, esIpNoPublica } from '../noticies/gestor.js';
import { esSlugFederat, urlsDeMunicipi } from '../../../src/data/activitypub.js';
import { signaPeticioHttpActivityPub, urlRemota } from '../../../src/data/federacio/inboxActivityPub.js';

export const CUA = Object.freeze({
  MAXIM_INTENTS: 10,
  BASE_S: 60,
  MAXIM_ESPERA_S: 6 * 3600,
  /* El sostre absolut d'una espera (el mateix que ap_cua_resol). */
  SOSTRE_ESPERA_S: 86400,
  LOT: 20,
  MAX_LOTS: 10,
  TOPALL_MS: 10_000,
  PRESSUPOST_MS: 45_000,
  /* La reserva d'una fila reclamada: si el procés cau, torna sola (ap_cua_reclama). */
  RESERVA_MS: 10 * 60_000,
  /* Un Accept resolt es pot tornar a encuar com a molt una vegada per hora (ap_cua_encua). */
  REENVIAMENT_MS: 3_600_000,
  /* El sostre del cos d'una fila (la CHECK de private.ap_cua_eixida). */
  MAXIM_COS: 64 * 1024,
  /* Reclamacions sense cap resolució abans de donar la fila per fallida (ap_cua_reclama). */
  MAXIM_RECLAMACIONS: 50
});

const FALLITS_HTTP = new Set([400, 401, 403, 404, 405, 410, 413, 415, 422]);
const REINTENTS_HTTP = new Set([408, 425, 429]);
/* Errors locals que no milloren reintentant: la fila no s'enviarà mai. */
const ERRORS_FALLITS = new Set(['adreca_vetada', 'redireccio', 'fila_invalida']);
const SEGONS = /^\d{1,9}$/;
const DATA_HTTP = /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/;
const DIA_MS = 86_400_000;

const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
const fita = (valor, minim, maxim, perDefecte) => {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.min(maxim, Math.max(minim, n)) : perDefecte;
};

/* Una promesa que perd la cursa amb el senyal (el patró finsAlTopall de purga-fitxers). */
export const finsAlTopall = (promesa, senyal) => new Promise((resol, rebutja) => {
  const talla = () => rebutja(Object.assign(new Error('temps'), { codi: 'temps' }));
  if (senyal.aborted) { talla(); return; }
  senyal.addEventListener('abort', talla, { once: true });
  Promise.resolve(promesa).then(resol, rebutja).finally(() => senyal.removeEventListener('abort', talla));
});

/**
 * La xarxa d'un nom DESPRÉS del filtre lèxic: 'publica', 'privada' (una sola
 * adreça no pública, encara que l'altra família falle), 'desconeguda' (cap
 * adreça o alguna família sense resposta) o 'sense-dns' (l'entorn no té
 * resoledor: mai pública). `resolDns(host, 'A'|'AAAA', {signal})` → [ip].
 */
export async function xarxaDe(host, { resolDns = null, senyal = undefined } = {}) {
  if (typeof resolDns !== 'function') return 'sense-dns';
  const resol = (tipus) => Promise.resolve().then(() => resolDns(host, tipus, { signal: senyal }));
  const respostes = await Promise.allSettled([resol('A'), resol('AAAA')]);
  const adreces = respostes.flatMap((r) => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []));
  if (adreces.some((ip) => esIpNoPublica(String(ip)))) return 'privada';
  return respostes.some((r) => r.status === 'rejected') || adreces.length === 0 ? 'desconeguda' : 'publica';
}

/** La clau privada RSA d'un actor (PKCS#8 PEM, 2048–8192 bits) per a signar, o null. */
export async function importaClauPrivada(pem, { subtle = globalThis.crypto?.subtle } = {}) {
  try {
    if (typeof pem !== 'string' || pem.length > 16384) return null;
    const net = pem.replace(/\r/g, '');
    if (!net.includes('-----BEGIN PRIVATE KEY-----') || !net.includes('-----END PRIVATE KEY-----')) return null;
    const cos = net.replace('-----BEGIN PRIVATE KEY-----', '').replace('-----END PRIVATE KEY-----', '').replace(/\s+/g, '');
    const der = Uint8Array.from(atob(cos), (c) => c.charCodeAt(0));
    const clau = await subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const bits = clau.algorithm?.modulusLength;
    return bits >= 2048 && bits <= 8192 ? clau : null;
  } catch { return null; }
}

/**
 * Espera abans del reintent n (≥ 1), en segons enters: exponencial fitada
 * (baseS·2^(n-1), com a molt maximS) amb «equal jitter» ([x/2, x]); un
 * Retry-After n'és el mínim; mai menys d'1 s ni més d'1 dia.
 */
export function esperaReintent(intents, { aleatori = Math.random, baseS = CUA.BASE_S, maximS = CUA.MAXIM_ESPERA_S, retryAfterS = null } = {}) {
  const n = Number.isSafeInteger(intents) && intents >= 1 ? Math.min(intents, 60) : 1;
  const base = fita(baseS, 1, CUA.SOSTRE_ESPERA_S, CUA.BASE_S);
  const sostre = fita(maximS, 1, CUA.SOSTRE_ESPERA_S, CUA.MAXIM_ESPERA_S);
  const x = Math.min(sostre, base * 2 ** (n - 1));
  const u = fita(typeof aleatori === 'function' ? aleatori() : NaN, 0, 1, 1);
  let espera = Math.round(x / 2 + (u * x) / 2);
  if (Number.isFinite(retryAfterS) && retryAfterS > 0) espera = Math.max(espera, Math.ceil(retryAfterS));
  return Math.min(CUA.SOSTRE_ESPERA_S, Math.max(1, espera));
}

/**
 * {resultat: 'fet'|'reintent'|'fallit', motiu}. 2xx fet; 3xx fallit
 * (redireccio); 400/401/403/404/405/410/413/415/422 i la resta de 4xx fallit;
 * 408/425/429/5xx reintent; xarxa, temps o DNS sense resposta, reintent;
 * adreça privada, fallit (adreca_vetada); sense resoledor o sense clau,
 * reintent (la configuració es pot arreglar; el sostre d'intents ho fita).
 */
export function classificaLliurament({ status = null, error = null } = {}) {
  if (error) {
    const motiu = typeof error === 'string' && /^[a-z_]{1,32}$/.test(error) ? error : 'error';
    return { resultat: ERRORS_FALLITS.has(motiu) ? 'fallit' : 'reintent', motiu };
  }
  if (!Number.isInteger(status) || status < 100 || status > 599) return { resultat: 'reintent', motiu: 'estat_desconegut' };
  const motiu = `http_${status}`;
  if (status >= 200 && status < 300) return { resultat: 'fet', motiu };
  if (status >= 300 && status < 400) return { resultat: 'fallit', motiu: 'redireccio' };
  if (FALLITS_HTTP.has(status)) return { resultat: 'fallit', motiu };
  if (REINTENTS_HTTP.has(status) || status >= 500) return { resultat: 'reintent', motiu };
  return { resultat: status >= 400 ? 'fallit' : 'reintent', motiu };
}

/* El Retry-After en segons (enter o data HTTP), o null. */
function retryAfterDe(valor, ara) {
  if (typeof valor !== 'string') return null;
  const text = valor.trim();
  if (SEGONS.test(text)) return Number(text);
  if (!DATA_HTTP.test(text)) return null;
  const quan = Date.parse(text);
  return Number.isFinite(quan) ? Math.max(0, Math.ceil((quan - ara) / 1000)) : null;
}

/**
 * Signa (signaPeticioHttpActivityPub, rsa-sha256) i envia UNA fila
 * {id, slug, inbox, activitat_id, cos, intents}. keyId =
 * `${urlsDeMunicipi(slug, {origen}).actor}#main-key`. `claus`: Map slug →
 * CryptoKey privada. El cos que es signa és JSON.stringify(fila.cos) i el
 * Digest es calcula sobre eixos bytes exactes. La capçalera Host la posa el
 * fetch des de l'URL: és la mateixa que la signada. Torna {status,
 * retryAfterS} o {error}.
 */
export async function lliura({ fila, claus, origen, fetch, resolDns = null, ara, subtle = globalThis.crypto?.subtle, topallMs = CUA.TOPALL_MS }) {
  const desti = urlRemota(fila?.inbox);
  if (!desti || !esSlugFederat(fila?.slug) || !esObjecte(fila?.cos) || typeof fila.cos.id !== 'string') return { error: 'fila_invalida' };
  const clau = claus instanceof Map ? claus.get(fila.slug) : null;
  if (!clau?.algorithm) return { error: 'sense_clau' };
  const control = new AbortController();
  const rellotge = setTimeout(() => control.abort(), topallMs);
  let r = null;
  try {
    const xarxa = await finsAlTopall(xarxaDe(desti.hostname, { resolDns, senyal: control.signal }), control.signal);
    if (xarxa === 'sense-dns') return { error: 'sense_dns' };
    if (xarxa === 'privada') return { error: 'adreca_vetada' };
    if (xarxa !== 'publica') return { error: 'dns' };
    const cos = JSON.stringify(fila.cos);
    const keyId = `${urlsDeMunicipi(fila.slug, { origen }).actor}#main-key`;
    const signades = await signaPeticioHttpActivityPub({ url: desti.href, cos, keyId, clauPrivada: clau, ara: ara(), subtle });
    r = await finsAlTopall(fetch(desti.href, {
      method: 'POST',
      redirect: 'manual',
      signal: control.signal,
      headers: {
        date: signades.date, digest: signades.digest, signature: signades.signature,
        'content-type': 'application/activity+json', accept: 'application/activity+json', 'user-agent': AGENT_USUARI
      },
      body: cos
    }), control.signal);
    const status = Number(r?.status);
    if (r?.type === 'opaqueredirect' || (status >= 300 && status < 400)) return { error: 'redireccio' };
    return { status: Number.isInteger(status) ? status : 0, retryAfterS: retryAfterDe(r?.headers?.get?.('retry-after') ?? null, ara()) };
  } catch {
    return { error: control.signal.aborted ? 'temps' : 'xarxa' };
  } finally {
    clearTimeout(rellotge);
    try { r?.body?.cancel?.()?.catch?.(() => {}); } catch { /* ja tancat */ }
  }
}

/**
 * Buida lots fins que la cua s'acaba, el pressupost o `maxLots`; cada fila es
 * resol amb `cua.resol`. Una fila reclamada que ja no cap en el pressupost es
 * queda sense provar: la seua reserva la torna sola. Torna només recomptes
 * {fets, reintents, fallits, sense_provar, lots, esgotat}. Si la cua (la base)
 * falla, llança: qui la crida respon que la base no està disponible.
 */
export async function drenaCua({
  cua, claus, origen, fetch, resolDns = null, ara, subtle = globalThis.crypto?.subtle, aleatori = Math.random,
  pressupostMs = CUA.PRESSUPOST_MS, lot = CUA.LOT, maxLots = CUA.MAX_LOTS, topallMs = CUA.TOPALL_MS
}) {
  const inici = ara();
  const queda = () => pressupostMs - (ara() - inici);
  const recompte = { fets: 0, reintents: 0, fallits: 0, sense_provar: 0, lots: 0 };
  let esgotat = false;
  while (recompte.lots < maxLots) {
    if (queda() < 2 * topallMs) { esgotat = true; break; }
    const files = await cua.reclama(lot);
    if (!Array.isArray(files) || files.length === 0) break;
    recompte.lots += 1;
    for (const fila of files) {
      if (queda() < topallMs) { esgotat = true; recompte.sense_provar += 1; continue; }
      const eixida = await lliura({ fila, claus, origen, fetch, resolDns, ara, subtle, topallMs });
      const { resultat, motiu } = classificaLliurament(eixida);
      const retryAfterS = eixida.status === 429 || eixida.status === 503 ? eixida.retryAfterS : null;
      const esperaS = resultat === 'reintent' ? esperaReintent(fila.intents, { aleatori, retryAfterS }) : null;
      const estat = await cua.resol({ id: fila.id, resultat, esperaS, error: resultat === 'fet' ? null : motiu });
      if (estat === 'fet') recompte.fets += 1;
      else if (estat === 'pendent') recompte.reintents += 1;
      else if (estat === 'fallit') recompte.fallits += 1;
    }
    if (esgotat || files.length < lot) break;
  }
  return { ...recompte, esgotat };
}

/**
 * La cua en memòria (proves i un sol procés), amb la mateixa semàntica que
 * les RPC ap_cua_* de la migració: encuar idempotent per (activitat, inbox) i
 * reenviament fitat a una vegada per hora; reclamar suma l'intent i reserva
 * 10 min; resoldre només una fila pendent ja reclamada: una de feta o fallida,
 * o una que ningú no ha reclamat (intents 0), torna null; després d'un reintent
 * la fila torna a ser pendent i encara es pot resoldre (sense token de
 * reclamació, com ap_cua_resol: residu declarat, ARB-M13-05); arribat a
 * `maximIntents`, fallit. `ara`: () → ms.
 */
export function creaCuaEnMemoria({ ara, maximIntents = CUA.MAXIM_INTENTS } = {}) {
  if (typeof ara !== 'function') throw new TypeError('creaCuaEnMemoria necessita ara.');
  const files = new Map();
  const perClau = new Map();
  let seguent = 0;
  const maxim = fita(maximIntents, 1, 50, CUA.MAXIM_INTENTS);
  const copia = (f) => ({ id: f.id, slug: f.slug, inbox: f.inbox, activitat_id: f.activitat_id, cos: JSON.parse(f.cos), intents: f.intents });
  return Object.freeze({
    async encua({ slug, inbox, activitat } = {}) {
      if (!esSlugFederat(slug) || !urlRemota(inbox) || !esObjecte(activitat) || !urlRemota(activitat.id)) throw new TypeError('Lliurament invàlid.');
      const cos = JSON.stringify(activitat);
      if (new TextEncoder().encode(cos).length > CUA.MAXIM_COS) throw new RangeError('Cos massa gran.');
      const clau = `${activitat.id} ${inbox}`;
      const actual = perClau.get(clau);
      if (actual) {
        // Mai un cos distint amb el mateix id (com la condició c.cos = excluded.cos de la migració).
        if (actual.estat === 'pendent' || !(actual.resolt < ara() - CUA.REENVIAMENT_MS) || actual.cos !== cos) return false;
        Object.assign(actual, { estat: 'pendent', intents: 0, proper: ara(), error: null, resolt: null });
        return true;
      }
      seguent += 1;
      const fila = { id: seguent, slug, inbox, activitat_id: activitat.id, cos, estat: 'pendent', intents: 0, proper: ara(), error: null, resolt: null };
      files.set(fila.id, fila);
      perClau.set(clau, fila);
      return true;
    },
    async reclama(limit = CUA.LOT) {
      const n = Number.isInteger(limit) ? Math.min(100, Math.max(1, limit)) : CUA.LOT;
      const ara0 = ara();
      // Una fila reclamada 50 vegades sense cap resolució (un worker que cau sempre amb ella) no bloqueja la cua.
      for (const f of files.values()) {
        if (f.estat === 'pendent' && f.intents >= CUA.MAXIM_RECLAMACIONS && f.proper <= ara0) {
          Object.assign(f, { estat: 'fallit', resolt: ara0, error: 'reclamacions_esgotades' });
        }
      }
      const triades = [...files.values()].filter((f) => f.estat === 'pendent' && f.proper <= ara0)
        .sort((a, b) => a.proper - b.proper || a.id - b.id).slice(0, n);
      for (const f of triades) { f.intents += 1; f.proper = ara0 + CUA.RESERVA_MS; }
      return triades.map(copia);
    },
    async resol({ id, resultat, esperaS = null, error = null } = {}) {
      if (!['fet', 'reintent', 'fallit'].includes(resultat)) throw new TypeError('Resultat desconegut.');
      const f = files.get(id);
      if (!f || f.estat !== 'pendent' || f.intents <= 0) return null;
      const estat = resultat === 'fet' ? 'fet' : resultat === 'fallit' || f.intents >= maxim ? 'fallit' : 'pendent';
      if (resultat === 'reintent') f.proper = ara() + fita(esperaS ?? CUA.BASE_S, 1, CUA.SOSTRE_ESPERA_S, CUA.BASE_S) * 1000;
      f.error = resultat === 'fet' ? null : (String(error ?? '').trim() || 'sense detall').slice(0, 200);
      f.resolt = resultat === 'reintent' && f.intents < maxim ? null : ara();
      f.estat = estat;
      return estat;
    },
    async purga() {
      const ara0 = ara();
      let n = 0;
      for (const [id, f] of files) {
        if ((f.estat === 'fet' && f.resolt < ara0 - 7 * DIA_MS) || (f.estat === 'fallit' && f.resolt < ara0 - 30 * DIA_MS)) {
          files.delete(id);
          perClau.delete(`${f.activitat_id} ${f.inbox}`);
          n += 1;
        }
      }
      return n;
    },
    instantania() {
      return [...files.values()].map((f) => ({ ...copia(f), estat: f.estat, proper: f.proper, error: f.error, resolt: f.resolt }));
    }
  });
}
