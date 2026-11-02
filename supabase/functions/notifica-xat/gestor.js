/* B8-SERVIDOR · S2 (marató 261101_2143; ordre del Mestre 261101) · El worker
   notifica-xat: buida private.xat_push_cua (l'omple el disparador
   xat_missatges_push_encua de la migració *_xat_avisos_push.sql) i desperta
   els aparells dels destinataris amb un avís CEC (D-B8S-1): el web, un push
   sense cos (webpush.js); els natius, si tenen secrets, el text literal en la
   llengua de l'aparell (natius.js, S3). El cron el crida amb la capçalera
   x-sdp-cron, com purga-fitxers i compte-apple.
   Pur i sense dependències: fetch, WebCrypto, TextEncoder, TextDecoder,
   AbortController i setTimeout, que tenen igual Deno (index.ts) i Node (les
   proves Vitest). Mai Buffer ni Deno.*.
   Tres panys, tot apagat per defecte: private.ajustos push_xat_actiu (base),
   SDP_PUSH_ACTIU=si (ací) i la bandera del client. Sense SDP_PUSH_ACTIU=si la
   funció NOMÉS crida xat_push_neteja (la retenció de la cua no depén de
   l'enviament, ARB-B8S-03) i no busca cap servei de push.
   Només s'expulsa un aparell amb web 404/410, APNs 410 i FCM 404 UNREGISTERED
   (el resultat «expulsa» de cada enviador, ARB-B8S-02, D-B8S-13). Una
   resposta que pot ser d'un sol aparell («rebutjat»: web 401/403, APNs
   BadDeviceToken, FCM SENDER_ID_MISMATCH…) es compta per aparell: mai
   expulsa i mai pausa el proveïdor per als altres, perquè qualsevol persona
   amb sessió pot desar una subscripció o un testimoni que la provoque
   (G1-B-seg-01). Només pausa el proveïdor un «config», que és sempre de la
   credencial pròpia (la signatura del JWT VAPID, APNs 403, FCM 401/403 sense
   codi d'aparell, la credencial nativa que falla). Un 429 pausa l'amfitrió
   web o el proveïdor natiu, excepte el `TooManyRequests` d'Apple (APNs i Web
   Push), que és d'un sol aparell: només salta eixe aparell (A-02).
   Cap endpoint, testimoni, JWT ni secret ix d'ací: ni a la resposta ni al
   registre, només recomptes i classes («web expulsa 410»). */
import { capcaleresDeServei } from '../_shared/apple.js';
import { creaEnviadorWeb, formaDeLEndpoint } from './webpush.js';

export const NOTIFICA = Object.freeze({
  /* La capçalera del cron, la mateixa de compte-apple i purga-fitxers (SDP_CRON_SECRET). */
  CAPCALERA: 'x-sdp-cron',
  SECRET_MINIM: 32,
  /* Missatges per reclamació (la RPC en dona 200 com a molt) i lots per passada. */
  LOT: 50,
  MAX_LOTS: 10,
  /* Peticions alhora als serveis de push. */
  CONCURRENCIA: 8,
  /* Temps de paret d'una passada i topall de cada petició. Un lot nou només
     comença si hi caben dos topalls, i un enviament, si n'hi cap un. */
  PRESSUPOST_MS: 45000,
  TOPALL_MS: 8000,
  /* Ids per crida a xat_push_expulsa (la RPC n'admet de 1 a 1.000). */
  MAXIM_EXPULSA: 1000,
  /* El cos d'una resposta de PostgREST es llig com a molt fins a 2 MiB. */
  MAXIM_COS_BASE: 2 * 1024 * 1024,
  /* Aparells per lot que es proven (el sostre de xat_push_reclama). */
  MAXIM_DISPOSITIUS: 5000
});

/* Les úniques RPC que pot cridar el worker (també els enviadors natius, per a
   la caché de credencials): les cinc de service_role de la migració. */
export const RPC_DEL_WORKER = Object.freeze(['xat_push_neteja', 'xat_push_reclama', 'xat_push_expulsa', 'xat_push_credencial', 'xat_push_desa_credencial']);

/* La llengua de l'avís natiu (la de la fila; el web la tria el navegador). */
export const LLENGUES_AVIS = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const RESULTATS = new Set(['enviat', 'expulsa', 'config', 'rebutjat', 'ritme', 'reintenta', 'fallit', 'invalid']);
const FORMA_URL = /^https?:\/\/[^\s/?#]+$/;
const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FORMA_HEX = /^[0-9a-f]+$/;
const FORMA_FCM = /^[A-Za-z0-9_:-]+$/;

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');
/* Un recompte de la base: un enter no negatiu, o 0. Cap altra forma no es creu. */
const enter = (valor) => (typeof valor === 'number' && Number.isSafeInteger(valor) && valor >= 0 ? valor : 0);
const errorDe = (codi) => Object.assign(new Error(codi), { codi });
const codiDe = (error) => (typeof error?.codi === 'string' ? error.codi : 'error');

const resposta = (estat, cos, capcaleres = {}) => new Response(JSON.stringify(cos), {
  status: estat,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...capcaleres }
});

/** Comparació en temps constant: el resum SHA-256 de tots dos, que tampoc no filtra la llargària. (Còpia de purga-fitxers/gestor.js.) */
export async function igualsEnTempsConstant(a, b, subtle = globalThis.crypto.subtle) {
  const codifica = new TextEncoder();
  const [x, y] = await Promise.all([
    subtle.digest('SHA-256', codifica.encode(String(a))),
    subtle.digest('SHA-256', codifica.encode(String(b)))
  ]);
  const vx = new Uint8Array(x);
  const vy = new Uint8Array(y);
  let diferencia = 0;
  for (let i = 0; i < vx.length; i++) diferencia |= vx[i] ^ vy[i];
  return diferencia === 0;
}

/** Talla una llista en trossos de `mida`. (Còpia de purga-fitxers/gestor.js.) */
export function trossos(llista, mida) {
  const eixida = [];
  for (let i = 0; i < llista.length; i += mida) eixida.push(llista.slice(i, i + mida));
  return eixida;
}

/**
 * Un grup de `n` treballadors que buiden `llista` en ordre, cridant
 * `fes(element, index)`. No passa mai de `n` crides alhora. Si alguna crida
 * llança, la resta acaba igual i després es llança el primer error.
 */
export async function enviaAmbLimit(llista, n, fes) {
  const elements = Array.isArray(llista) ? llista : [];
  if (elements.length === 0) return;
  const treballadors = Math.max(1, Math.min(Number.isInteger(n) ? n : 1, elements.length));
  let seguent = 0;
  let primer = null;
  const treballa = async () => {
    while (seguent < elements.length) {
      const index = seguent++;
      try { await fes(elements[index], index); } catch (error) { if (!primer) primer = { error }; }
    }
  };
  await Promise.all(Array.from({ length: treballadors }, treballa));
  if (primer) throw primer.error;
}

/**
 * Un aparell reclamat, tornat a validar abans de buscar res: és la guarda SSRF
 * del worker, que val també contra una fila manipulada. `{ id, tipus, adreca,
 * llengua, clauDePausa } | null`. La clau de pausa és l'amfitrió (web) o el
 * proveïdor (natius): un 429 pausa eixa clau (excepte el TooManyRequests
 * d'Apple, que només salta l'aparell).
 */
export function formaDelDispositiu(d) {
  if (!d || typeof d !== 'object' || typeof d.id !== 'string' || !FORMA_UUID.test(d.id)) return null;
  const adreca = typeof d.adreca === 'string' ? d.adreca : '';
  const llengua = LLENGUES_AVIS.includes(d.llengua) ? d.llengua : 'ca';
  if (d.tipus === 'web') {
    const forma = formaDeLEndpoint(adreca);
    return forma ? { id: d.id, tipus: 'web', adreca: forma.endpoint, llengua, clauDePausa: `web ${forma.amfitrio}` } : null;
  }
  if (d.tipus === 'apns') {
    return adreca.length >= 64 && adreca.length <= 200 && FORMA_HEX.test(adreca) ? { id: d.id, tipus: 'apns', adreca, llengua, clauDePausa: 'apns' } : null;
  }
  if (d.tipus === 'fcm') {
    return adreca.length >= 32 && adreca.length <= 1024 && FORMA_FCM.test(adreca) ? { id: d.id, tipus: 'fcm', adreca, llengua, clauDePausa: 'fcm' } : null;
  }
  return null;
}

/* Una promesa que perd la cursa amb el senyal: el topall talla encara que el cos no l'escolte. */
const finsAlTopall = (promesa, senyal) => new Promise((resol, rebutja) => {
  const talla = () => rebutja(errorDe('temps'));
  if (senyal.aborted) { talla(); return; }
  senyal.addEventListener('abort', talla, { once: true });
  promesa.then(resol, rebutja).finally(() => senyal.removeEventListener('abort', talla));
});

/* Una promesa amb sostre de temps (un enviador que no respon mai no atura la passada). */
const ambSostre = (promesa, ms) => new Promise((resol, rebutja) => {
  const rellotge = setTimeout(() => rebutja(errorDe('temps')), ms);
  promesa.then(resol, rebutja).finally(() => clearTimeout(rellotge));
});

/**
 * fetch amb topall (el patró de purga-fitxers, P1-18): el topall dura fins
 * que `llig` ha consumit la resposta, i el cos que `llig` no vol es
 * cancel·la. `llig` rep també el senyal, per a cancel·lar el seu lector.
 */
async function ambTopall(fetch, url, opcions, topallMs, llig) {
  const control = new AbortController();
  const rellotge = setTimeout(() => control.abort(), topallMs);
  let r = null;
  try {
    r = await fetch(url, { ...opcions, signal: control.signal });
    return await finsAlTopall(Promise.resolve().then(() => llig(r, control.signal)), control.signal);
  } catch (error) {
    if (control.signal.aborted) throw errorDe('temps');
    throw error?.codi ? error : errorDe('xarxa');
  } finally {
    clearTimeout(rellotge);
    if (r && r.body && !r.body.locked && typeof r.body.cancel === 'function') r.body.cancel().catch(() => {});
  }
}

/* El JSON d'una resposta, llegit com a molt fins a `maxim` bytes (si no, «cos»). Un cos que no és JSON és null. */
async function llegixJsonFitat(r, maxim, senyal) {
  const declarada = Number(r.headers?.get?.('content-length'));
  if (Number.isFinite(declarada) && declarada > maxim) throw errorDe('cos');
  if (!r.body) return null;
  const lector = r.body.getReader();
  const talla = () => { lector.cancel().catch(() => {}); };
  senyal?.addEventListener('abort', talla, { once: true });
  const parts = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value ?? 0);
      total += bytes.byteLength;
      if (total > maxim) { talla(); throw errorDe('cos'); }
      parts.push(bytes);
    }
  } finally {
    senyal?.removeEventListener('abort', talla);
  }
  const tot = new Uint8Array(total);
  let posicio = 0;
  for (const part of parts) { tot.set(part, posicio); posicio += part.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(tot)); } catch { return null; }
}

/* El resultat d'un enviador, reduït al vocabulari tancat (cap text de fora arriba al registre). */
function resultatDe(r) {
  const resultat = r && typeof r === 'object' && RESULTATS.has(r.resultat) ? r.resultat : 'fallit';
  const estat = r && Number.isInteger(r.estat) && r.estat >= 100 && r.estat <= 599 ? r.estat : null;
  return { resultat, estat };
}

/**
 * @param {object} dependencies
 * @param {Record<string,string|undefined>} dependencies.env SUPABASE_URL,
 *   SUPABASE_SERVICE_ROLE_KEY (les injecta Supabase), SDP_CRON_SECRET,
 *   SDP_PUSH_ACTIU i SDP_PUSH_VAPID_* (més els natius, per a natius.js).
 * @param {Function|null} dependencies.creaEnviadorsNatius S3:
 *   `({ env, fetch, subtle, ara, rpc, topallMs, registre }) → Promise<{ apns?, fcm? }>`.
 *   Cada enviador natiu rep `{ tipus, adreca, llengua }` (ja validats) i
 *   torna `{ resultat, estat? }`, amb el vocabulari de classificaWebPush.
 * @returns {(req: Request) => Promise<Response>}
 */
export function creaGestor({
  env = {}, fetch = globalThis.fetch, subtle = globalThis.crypto.subtle,
  ara = Date.now, registre = console, opcions = {}, creaEnviadorsNatius = null
} = {}) {
  const o = { ...NOTIFICA, ...opcions };

  return async function gestor(req) {
    if (req.method !== 'POST') return resposta(405, { ok: false, error: 'metode' }, { Allow: 'POST' });

    const secret = textNet(env.SDP_CRON_SECRET);
    const base = textNet(env.SUPABASE_URL).replace(/\/+$/, '');
    const clau = textNet(env.SUPABASE_SERVICE_ROLE_KEY);
    if (secret.length < o.SECRET_MINIM || !FORMA_URL.test(base) || !clau) {
      registre.error('[notifica-xat] Falta la configuració de la funció.');
      return resposta(503, { ok: false, error: 'config' });
    }
    if (!(await igualsEnTempsConstant(textNet(req.headers.get(o.CAPCALERA)), secret, subtle))) {
      return resposta(401, { ok: false, error: 'no-autoritzat' });
    }

    const servei = capcaleresDeServei(clau);
    const rpc = (nom, cos = {}) => {
      if (!RPC_DEL_WORKER.includes(nom)) return Promise.reject(errorDe('rpc'));
      return ambTopall(fetch, `${base}/rest/v1/rpc/${nom}`, {
        method: 'POST',
        redirect: 'error',
        headers: { ...servei, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(cos)
      }, o.TOPALL_MS, async (r, senyal) => {
        if (!r.ok) throw errorDe(`base ${r.status}`);
        return llegixJsonFitat(r, o.MAXIM_COS_BASE, senyal);
      });
    };

    /* Pany 2 apagat: només la neteja (aparells vells i cua de més d'una hora). */
    if (env.SDP_PUSH_ACTIU !== 'si') {
      try {
        const n = await rpc('xat_push_neteja', {});
        const neteja = { dispositius: enter(n?.dispositius), cua: enter(n?.cua) };
        registre.info(`[notifica-xat] apagat · neteja dispositius=${neteja.dispositius} cua=${neteja.cua}`);
        return resposta(200, { ok: true, apagat: true, neteja });
      } catch (error) {
        registre.error('[notifica-xat] La base no respon:', codiDe(error));
        return resposta(502, { ok: false, apagat: true, error: 'base' });
      }
    }

    const inici = ara();
    const queda = () => o.PRESSUPOST_MS - (ara() - inici);
    const recompte = { missatges: 0, retallats: 0, dispositius: 0, enviats: 0, expulsats: 0, fallits: 0, sense_proveidor: 0, sense_provar: 0, lots: 0 };
    const classes = new Map();
    let esgotat = false;

    let web = null;
    try { web = await creaEnviadorWeb({ env, fetch, subtle, ara, topallMs: o.TOPALL_MS }); } catch { web = null; }
    if (!web) registre.warn('[notifica-xat] Sense VAPID vàlid (SDP_PUSH_VAPID_*): els aparells web no es desperten ni s’esborren.');

    /* Els natius, una vegada per passada i només si algun lot en porta. */
    let natius = null;
    const preparaNatius = async () => {
      if (typeof creaEnviadorsNatius !== 'function') return {};
      try {
        const creats = await ambSostre(Promise.resolve().then(() => creaEnviadorsNatius({ env, fetch, subtle, ara, rpc, topallMs: o.TOPALL_MS, registre })), 3 * o.TOPALL_MS);
        const nets = {};
        for (const tipus of ['apns', 'fcm']) if (creats && typeof creats[tipus] === 'function') nets[tipus] = creats[tipus];
        return nets;
      } catch {
        registre.warn('[notifica-xat] Els proveïdors natius no s’han pogut preparar.');
        return {};
      }
    };
    const enviadorDe = (tipus) => (tipus === 'web' ? web : (natius?.[tipus] ?? null));

    /* Les pauses de la passada: el proveïdor amb la credencial pròpia dolenta
       («config») i la clau que retalla («ritme»: l'amfitrió web o el natiu).
       Un «rebutjat» no pausa res (G1-B-seg-01). Un aparell que Apple retalla
       sol (429 TooManyRequests → «reintenta» 429, APNs i Web Push d'Apple) no
       es torna a buscar en els lots següents de la passada: ni pausa els
       altres ni es martelleja eixe testimoni (A-02). */
    const configDolenta = new Set();
    const ritme = new Set();
    const aparellsRetallats = new Set();
    const pausat = (d) => configDolenta.has(d.tipus) || ritme.has(d.clauDePausa) || aparellsRetallats.has(`${d.tipus} ${d.adreca}`);

    const compta = (d, perExpulsar, { resultat, estat }) => {
      const classe = `${d.tipus} ${resultat}${estat ? ` ${estat}` : ''}`;
      classes.set(classe, (classes.get(classe) ?? 0) + 1);
      if (resultat === 'enviat') { recompte.enviats += 1; return; }
      if (resultat === 'expulsa') { perExpulsar.push(d.id); return; }
      if (resultat === 'invalid') { recompte.sense_provar += 1; return; }
      recompte.fallits += 1;
      if (resultat === 'config') configDolenta.add(d.tipus);
      else if (resultat === 'ritme') ritme.add(d.clauDePausa);
      else if (resultat === 'reintenta' && estat === 429) aparellsRetallats.add(`${d.tipus} ${d.adreca}`);
    };

    const envia = (perExpulsar) => async (d) => {
      const enviador = enviadorDe(d.tipus);
      if (!enviador) { recompte.sense_proveidor += 1; return; }
      if (pausat(d)) { recompte.sense_provar += 1; return; }
      if (queda() < o.TOPALL_MS) { esgotat = true; recompte.sense_provar += 1; return; }
      const crida = d.tipus === 'web'
        ? () => enviador({ endpoint: d.adreca })
        : () => enviador({ tipus: d.tipus, adreca: d.adreca, llengua: d.llengua });
      const r = await ambSostre(Promise.resolve().then(crida), 2 * o.TOPALL_MS)
        .then(resultatDe, () => ({ resultat: 'reintenta', estat: null }));
      compta(d, perExpulsar, r);
    };

    try {
      await rpc('xat_push_neteja', {});
      while (recompte.lots < o.MAX_LOTS) {
        if (queda() < 2 * o.TOPALL_MS) { esgotat = true; break; }
        const lot = await rpc('xat_push_reclama', { p_limit: o.LOT });
        if (!lot || typeof lot !== 'object' || Array.isArray(lot)) throw errorDe('forma');
        const missatges = enter(lot.missatges);
        if (missatges === 0) break;
        recompte.lots += 1;
        recompte.missatges += missatges;
        recompte.retallats += enter(lot.retallats);
        const files = Array.isArray(lot.dispositius) ? lot.dispositius : [];
        recompte.dispositius += files.length;

        /* Una fila amb mala forma (o repetida, o de més) no es busca mai. */
        const valids = [];
        const vistos = new Set();
        files.forEach((fila, index) => {
          const d = index < o.MAXIM_DISPOSITIUS ? formaDelDispositiu(fila) : null;
          if (!d || vistos.has(d.id)) { recompte.sense_provar += 1; return; }
          vistos.add(d.id);
          valids.push(d);
        });
        if (natius === null && valids.some((d) => d.tipus !== 'web')) natius = await preparaNatius();

        const perExpulsar = [];
        await enviaAmbLimit(valids, o.CONCURRENCIA, envia(perExpulsar));
        for (const tros of trossos(perExpulsar, o.MAXIM_EXPULSA)) {
          recompte.expulsats += enter(await rpc('xat_push_expulsa', { p_ids: tros }));
        }
        if (esgotat) break;
      }
    } catch (error) {
      /* La base no respon: el lot reclamat ja s'ha esborrat (com a molt una vegada, D-B8S-12). */
      registre.error('[notifica-xat] La base no respon:', codiDe(error));
      return resposta(502, { ok: false, error: 'base', ...recompte, esgotat });
    }

    const resum = [...classes.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([c, n]) => `${c}=${n}`).join(', ');
    registre.info(`[notifica-xat] missatges=${recompte.missatges} dispositius=${recompte.dispositius} enviats=${recompte.enviats} expulsats=${recompte.expulsats} fallits=${recompte.fallits} sense_proveidor=${recompte.sense_proveidor} sense_provar=${recompte.sense_provar} lots=${recompte.lots} esgotat=${esgotat}${resum ? ` · ${resum}` : ''}`);
    return resposta(200, { ok: true, ...recompte, esgotat });
  };
}
