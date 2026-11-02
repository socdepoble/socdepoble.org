/* B5 (marató 261101_2143; P1-23 fase 2 / P2-07; spec B5-FEDERACIO §2.4) · El
   gestor de la funció ap-inbox-verifica: la inbox ActivityPub dels actors
   locals (POST /ap/inbox/<slug>) i la passada de la cua d'eixida (POST /cua,
   el cron). NO està desplegada, i desplegada naix APAGADA: sense
   SDP_AP_ACTIVA=1, la inbox respon 503 federacio_apagada i la cua no envia res.
   Sense claus, cap actor accepta un Follow (404); sense nodes de confiança,
   cap alerta remota (fallada tancada de la biblioteca).
   PUR: fetch, crypto.subtle, TextEncoder/TextDecoder, AbortController i
   setTimeout, que tenen igual Deno (index.ts) i Node (Vitest). Mai Deno.* ni
   Buffer. La verificació i el processament són de la biblioteca
   (src/data/federacio/inboxActivityPub.js); ací hi ha les obligacions de qui
   la desplega (la seua capçalera):
   · el cos es llig amb un sostre (llegixCosFitat), mai req.arrayBuffer();
   · les claus i els documents remots es demanen amb redirect 'manual', un
     topall de 10 s, un sostre d'1 MiB llegit per flux, Accept
     application/activity+json i el DNS comprovat DESPRÉS del filtre lèxic
     (una sola adreça no pública veta; sense resoledor, cap obtenció);
   · el host i el camí que entren a la cadena signada són els PÚBLICS
     configurats (SDP_AP_INBOX_PUBLICA), no els que reescriga la passarel·la:
     una petició signada per a un altre host o camí no verifica.
   Variables (cap secret ix ni a les respostes ni al registre):
     SDP_AP_ACTIVA            només '1' l'encén
     SDP_AP_ORIGEN            l'origen dels ids d'actor (per defecte https://socdepoble.org)
     SDP_AP_INBOX_PUBLICA     l'URL base on arriben els POST (per defecte, l'origen), p. ex.
                              https://<ref>.supabase.co/functions/v1/ap-inbox-verifica
     SDP_AP_CLAUS_PRIVADES    JSON {"<slug>": "<PKCS#8 PEM RSA>"}; un slug és actor local
                              només si té clau vàlida I és a ['socdepoble', ...POBLES_FEDERATS]
     SDP_AP_NODES_CONFIANCA   orígens https separats per comes (buit: cap alerta)
     SDP_CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY */
import {
  LIMITS_CLAU_PUBLICA, LIMITS_SIGNATURA, MAXIM_COS_INBOX, atenPeticioInbox, clauDeDocumentActor, urlRemota
} from '../../../src/data/federacio/inboxActivityPub.js';
import { POBLES_FEDERATS, normalitzaOrigen, urlsDeMunicipi } from '../../../src/data/activitypub.js';
import { igualsEnTempsConstant } from '../purga-fitxers/gestor.js';
import { AGENT_USUARI } from '../noticies/gestor.js';
import { drenaCua, finsAlTopall, importaClauPrivada, xarxaDe } from './cuaLliurament.js';
import { creaMagatzemPostgrest } from './magatzemPostgrest.js';

export const AP = Object.freeze({
  CAPCALERA_CRON: 'x-sdp-cron',
  SECRET_MINIM: 32,
  TOPALL_MS: 10_000,
  MAXIM_DOCUMENT: 1024 * 1024,
  CAU_CLAUS: 256,
  VIDA_CLAU_MS: 10 * 60_000,
  OBTENCIONS_PER_MINUT: 60,
  ORIGEN_PER_DEFECTE: 'https://socdepoble.org',
  /* El camí amb què Supabase passa la petició a la funció. */
  PREFIX_INTERN: '/ap-inbox-verifica',
  MAXIM_CLAUS_JSON: 64 * 1024,
  MAXIM_NODES: 64,
  /* La passada curta de la cua en segon pla després d'un Follow (EdgeRuntime.waitUntil). */
  LOT_EN_SEGON_PLA: 5,
  PRESSUPOST_EN_SEGON_PLA_MS: 25_000,
  RETRY_AFTER_QUOTA_S: 600,
  RETRY_AFTER_CAIGUT_S: 60
});

const ACTORS_POSSIBLES = Object.freeze(['socdepoble', ...POBLES_FEDERATS]);
const CAMI_INBOX = /^\/ap\/inbox\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
/* Buit, o segments «/nom»: cada repetició comença per «/» (lineal). */
const PREFIX_CAMI = /^(?:\/[A-Za-z0-9._~-]+)*$/;
const FORMA_URL_SUPABASE = /^https?:\/\/[^\s/?#]+$/;
const ACCEPT_AP = 'application/activity+json, application/ld+json; profile="https://www.w3.org/ns/activitystreams"';
const TIPUS_DOCUMENT = Object.freeze(['application/activity+json', 'application/ld+json', 'application/json']);

const enc = new TextEncoder();
const esLoopback = (nom) => nom === 'localhost' || nom.endsWith('.localhost') || nom === '127.0.0.1' || nom === '[::1]';
const senseBarraFinal = (text) => { let t = text; while (t.endsWith('/')) t = t.slice(0, -1); return t; };
const resposta = (status, cos, capcaleres = {}) => new Response(JSON.stringify(cos), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...capcaleres }
});

/**
 * La configuració de la funció a partir de l'entorn, o {error:'config',
 * falten} amb els NOMS de les variables que falten o no s'entenen (mai els
 * valors). Unes claus mal formades són un error de configuració; una clau
 * d'un slug que no pot ser actor local, s'ignora.
 */
export function configDe(env = {}) {
  const text = (nom) => (typeof env?.[nom] === 'string' ? env[nom].trim() : '');
  const falten = [];
  let origen = null;
  try { origen = normalitzaOrigen(text('SDP_AP_ORIGEN') || AP.ORIGEN_PER_DEFECTE); } catch { falten.push('SDP_AP_ORIGEN'); }

  let inboxPublica = null;
  try {
    const u = new URL(text('SDP_AP_INBOX_PUBLICA') || origen || '');
    const protocolBo = u.protocol === 'https:' || (u.protocol === 'http:' && esLoopback(u.hostname));
    const prefix = senseBarraFinal(u.pathname);
    if (!protocolBo || u.username || u.password || u.search || u.hash || !PREFIX_CAMI.test(prefix)) throw new TypeError('inbox');
    inboxPublica = Object.freeze({ host: u.host, prefix });
  } catch { falten.push('SDP_AP_INBOX_PUBLICA'); }

  const actors = new Map();
  const crues = text('SDP_AP_CLAUS_PRIVADES');
  if (crues) {
    let mapa = null;
    try { mapa = crues.length <= AP.MAXIM_CLAUS_JSON ? JSON.parse(crues) : null; } catch { mapa = null; }
    if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa)) falten.push('SDP_AP_CLAUS_PRIVADES');
    else if (origen) {
      // Es recorre la llista d'actors possibles, no les claus del JSON (cap clau estranya hi entra).
      for (const slug of ACTORS_POSSIBLES) {
        const pem = Object.hasOwn(mapa, slug) ? mapa[slug] : null;
        if (typeof pem === 'string' && pem.includes('-----BEGIN PRIVATE KEY-----')) {
          actors.set(slug, Object.freeze({ keyId: `${urlsDeMunicipi(slug, { origen }).actor}#main-key`, clauPrivadaPem: pem }));
        }
      }
    }
  }

  const nodesDeConfianca = text('SDP_AP_NODES_CONFIANCA').split(',').map((o) => o.trim()).filter(Boolean).slice(0, AP.MAXIM_NODES)
    .flatMap((o) => { try { const n = normalitzaOrigen(o); return n.startsWith('https://') ? [n] : []; } catch { return []; } });

  const secret = text('SDP_CRON_SECRET');
  const base = senseBarraFinal(text('SUPABASE_URL'));
  const clau = text('SUPABASE_SERVICE_ROLE_KEY');
  if (!FORMA_URL_SUPABASE.test(base)) falten.push('SUPABASE_URL');
  if (!clau) falten.push('SUPABASE_SERVICE_ROLE_KEY');
  if (falten.length) return { error: 'config', falten };
  return {
    activa: text('SDP_AP_ACTIVA') === '1',
    origen,
    inboxPublica,
    prefixIntern: AP.PREFIX_INTERN,
    actors,
    nodesDeConfianca,
    secretCron: secret.length >= AP.SECRET_MINIM ? secret : null,
    supabase: { base, clau }
  };
}

/** Llig un flux amb un sostre: els bytes, o null si en passa (i el cancel·la sense llegir-ne més). */
export async function llegixFluxFitat(flux, maxim) {
  if (!flux) return new Uint8Array(0);
  const lector = flux.getReader();
  const trossos = [];
  let n = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      const tros = typeof value === 'string' ? enc.encode(value) : value instanceof Uint8Array ? value : new Uint8Array(value);
      n += tros.byteLength;
      if (n > maxim) {
        await lector.cancel().catch(() => {});
        return null;
      }
      trossos.push(tros);
    }
  } finally {
    try { lector.releaseLock(); } catch { /* ja alliberat */ }
  }
  const eixida = new Uint8Array(n);
  let posicio = 0;
  for (const tros of trossos) { eixida.set(tros, posicio); posicio += tros.byteLength; }
  return eixida;
}

/** El cos d'una petició amb un sostre (null: passa de `maxim`). Mai req.arrayBuffer(). */
export const llegixCosFitat = (req, maxim) => llegixFluxFitat(req?.body ?? null, maxim);

/**
 * Les obtencions remotes de la inbox: obtenDocument(id) i
 * obtenClauPublica(keyId) → {clau, documentActor, deCau}. Memòria cau de
 * claus per keyId (256 entrades, 10 min); `oblida(keyId)` la buida per a una
 * clau (rotació). Sostre d'obtencions per minut i procés contra
 * l'amplificació. Qualsevol fallada llança (la biblioteca ho tradueix en
 * key_not_found o object_unverifiable).
 * ARB-M13-01 · De cada document d'actor es torna i es desa només {id, inbox}
 * (el que en llig la biblioteca), mai el document sencer, i una clau que la
 * biblioteca no pot importar (LIMITS_CLAU_PUBLICA) no entra a la memòria cau:
 * cada entrada són uns quants KiB (keyId, id i inbox ≤ 2048, PEM ≤ 8192), unes
 * 7 MiB com a molt amb 256 entrades, i no 256 documents d'1 MiB que qualsevol
 * podia fer retindre sense cap signatura vàlida.
 */
export function creaObtenidor({
  fetch, resolDns = null, ara, topallMs = AP.TOPALL_MS, maximBytes = AP.MAXIM_DOCUMENT, cauClaus = AP.CAU_CLAUS,
  vidaClauMs = AP.VIDA_CLAU_MS, obtencionsPerMinut = AP.OBTENCIONS_PER_MINUT
} = {}) {
  const cau = new Map();
  let finestra = { minut: -1, n: 0 };
  const projeccio = (document) => Object.freeze({
    id: typeof document.id === 'string' && document.id.length <= LIMITS_SIGNATURA.url ? document.id : null,
    inbox: typeof document.inbox === 'string' && document.inbox.length <= LIMITS_SIGNATURA.url ? document.inbox : null
  });
  const desable = (clau) => (typeof clau.publicKeyPem === 'string'
    ? clau.publicKeyPem.length <= LIMITS_CLAU_PUBLICA.pem
    : typeof clau.publicKeyMultibase === 'string' && clau.publicKeyMultibase.length <= LIMITS_CLAU_PUBLICA.multibase);

  async function obtenDocument(id) {
    const url = urlRemota(id);
    if (!url) throw new Error('url_invalida');
    url.hash = '';
    const minut = Math.floor(ara() / 60_000);
    if (finestra.minut !== minut) finestra = { minut, n: 0 };
    if (finestra.n >= obtencionsPerMinut) throw new Error('massa_obtencions');
    finestra.n += 1;
    const control = new AbortController();
    const rellotge = setTimeout(() => control.abort(), topallMs);
    let r = null;
    try {
      const xarxa = await finsAlTopall(xarxaDe(url.hostname, { resolDns, senyal: control.signal }), control.signal);
      if (xarxa !== 'publica') throw new Error(`xarxa_${xarxa}`);
      r = await finsAlTopall(fetch(url.href, {
        method: 'GET', redirect: 'manual', signal: control.signal, headers: { accept: ACCEPT_AP, 'user-agent': AGENT_USUARI }
      }), control.signal);
      if (r?.type === 'opaqueredirect' || !(r?.status >= 200 && r.status < 300)) throw new Error('estat');
      const tipus = String(r.headers?.get?.('content-type') ?? '').split(';')[0].trim().toLowerCase();
      if (!TIPUS_DOCUMENT.includes(tipus)) throw new Error('tipus');
      const declarada = Number(r.headers.get('content-length'));
      if (Number.isFinite(declarada) && declarada > maximBytes) throw new Error('massa_gran');
      const bytes = await finsAlTopall(llegixFluxFitat(r.body, maximBytes), control.signal);
      if (!bytes) throw new Error('massa_gran');
      const document = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (!document || typeof document !== 'object' || Array.isArray(document)) throw new Error('document');
      return document;
    } finally {
      clearTimeout(rellotge);
      try { r?.body?.cancel?.()?.catch?.(() => {}); } catch { /* ja llegit */ }
    }
  }

  async function obtenClauPublica(keyId) {
    const ara0 = ara();
    const desada = cau.get(keyId);
    if (desada && desada.fins > ara0) return { clau: desada.clau, documentActor: desada.documentActor, deCau: true };
    cau.delete(keyId);
    const url = urlRemota(keyId);
    if (!url) return null;
    url.hash = '';
    const document = await obtenDocument(url.href);
    const clau = clauDeDocumentActor(document, keyId);
    if (!clau) return null;
    const documentActor = projeccio(document);
    if (desable(clau)) {
      // Plena, se'n va la més antiga (ordre d'entrada del Map).
      if (cau.size >= cauClaus) cau.delete(cau.keys().next().value);
      cau.set(keyId, { clau, documentActor, fins: ara0 + vidaClauMs });
    }
    return { clau, documentActor, deCau: false };
  }

  return Object.freeze({ obtenDocument, obtenClauPublica, oblida: (keyId) => { cau.delete(keyId); } });
}

/* El camí intern: sense el prefix amb què Supabase passa la petició a la funció. */
function camiIntern(cami, prefixIntern) {
  for (const prefix of [`/functions/v1${prefixIntern}`, prefixIntern]) {
    if (cami === prefix) return '/';
    if (cami.startsWith(`${prefix}/`)) return cami.slice(prefix.length);
  }
  return cami;
}

/**
 * @returns {(req: Request) => Promise<Response>} El gestor per a Deno.serve.
 * `magatzem` i `cua` s'injecten a les proves (i a dosNodes.test.js); si no,
 * són l'adaptador PostgREST. `espera`: EdgeRuntime.waitUntil, si n'hi ha.
 */
export function creaGestor({
  env = {}, fetch = globalThis.fetch, resolDns = null, ara = () => Date.now(), subtle = globalThis.crypto?.subtle,
  aleatori = Math.random, espera = null, magatzem = null, cua = null, registre = console
} = {}) {
  const activa = typeof env?.SDP_AP_ACTIVA === 'string' && env.SDP_AP_ACTIVA.trim() === '1';
  const config = configDe(env);
  const bona = !config.error;
  const postgrest = bona && (!magatzem || !cua) ? creaMagatzemPostgrest({ base: config.supabase.base, clau: config.supabase.clau, fetch }) : null;
  const magatzemInbox = magatzem ?? postgrest;
  const cuaEixida = cua ?? postgrest;
  const obtenidor = bona ? creaObtenidor({ fetch, resolDns, ara }) : null;
  let claus = null;
  /* Les claus privades, importades una vegada: un slug amb una clau que no s'importa no és actor local. */
  const clausPrivades = () => {
    claus ??= (async () => {
      const mapa = new Map();
      for (const [slug, actor] of config.actors) {
        const clau = await importaClauPrivada(actor.clauPrivadaPem, { subtle });
        if (clau) mapa.set(slug, clau);
        else registre.error(`[ap-inbox-verifica] La clau de ${slug} no és una RSA PKCS#8 vàlida.`);
      }
      return mapa;
    })();
    return claus;
  };
  const faltaConfig = () => {
    registre.error(`[ap-inbox-verifica] Falta la configuració de la funció (${(config.falten ?? ['SDP_CRON_SECRET']).join(', ')}).`);
    return resposta(503, { error: 'config' });
  };

  async function atenInbox(req, slug, consulta) {
    if (!activa) return resposta(503, { error: 'federacio_apagada' });
    if (!bona) return faltaConfig();
    if (String(req.method).toUpperCase() !== 'POST') return resposta(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
    // Abans de llegir cap octet: la inbox ha de ser d'un actor local amb clau, i el tipus, el d'ActivityPub
    // (les mateixes respostes que atenPeticioInbox, que ho torna a comprovar).
    const actius = await clausPrivades();
    if (!actius.has(slug)) return resposta(404, { error: 'not_found' });
    const tipus = String(req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (tipus !== 'application/activity+json' && tipus !== 'application/ld+json') return resposta(415, { error: 'unsupported_media_type' });
    const declarada = Number(req.headers.get('content-length'));
    if (Number.isFinite(declarada) && declarada > MAXIM_COS_INBOX) return resposta(413, { error: 'payload_too_large' });
    const bytes = await llegixCosFitat(req, MAXIM_COS_INBOX);
    if (!bytes) return resposta(413, { error: 'payload_too_large' });
    // El host i el camí que es verifiquen són els públics: la passarel·la no els pot canviar.
    const capcaleres = new Map();
    for (const [nom, valor] of req.headers) capcaleres.set(nom.toLowerCase(), valor);
    capcaleres.set('host', config.inboxPublica.host);
    const peticio = { metode: 'POST', cami: `${config.inboxPublica.prefix}/ap/inbox/${slug}${consulta}`, capcaleres, cos: bytes };
    let usada = null;
    const opcions = {
      origen: config.origen, actorsLocals: [...actius.keys()], magatzem: magatzemInbox, nodesDeConfianca: config.nodesDeConfianca,
      obtenDocument: obtenidor.obtenDocument, ara: ara(), subtle, hostEsperat: config.inboxPublica.host, prefixCami: config.inboxPublica.prefix,
      obtenClauPublica: async (keyId) => {
        const obtinguda = await obtenidor.obtenClauPublica(keyId);
        usada = { keyId, deCau: obtinguda?.deCau === true };
        return obtinguda;
      }
    };
    let r = null;
    try {
      r = await atenPeticioInbox(peticio, opcions);
      // Rotació de clau: una signatura invàlida amb la clau de la memòria cau es torna a provar una vegada amb la clau fresca.
      if (r.status === 401 && r.cos?.error === 'signature_invalid' && usada?.deCau) {
        obtenidor.oblida(usada.keyId);
        r = await atenPeticioInbox(peticio, opcions);
      }
      for (const lliurament of r.lliuraments) await cuaEixida.encua({ slug, inbox: lliurament.inbox, activitat: lliurament.activitat });
    } catch (error) {
      if (error instanceof RangeError) return resposta(429, { error: 'quota' }, { 'Retry-After': String(AP.RETRY_AFTER_QUOTA_S) });
      registre.error('[ap-inbox-verifica] La base no respon.');
      return resposta(503, { error: 'magatzem_no_disponible' }, { 'Retry-After': String(AP.RETRY_AFTER_CAIGUT_S) });
    }
    if (r.lliuraments.length && typeof espera === 'function') {
      espera(drenaCua({
        cua: cuaEixida, claus: actius, origen: config.origen, fetch, resolDns, ara, subtle, aleatori,
        lot: AP.LOT_EN_SEGON_PLA, maxLots: 1, pressupostMs: AP.PRESSUPOST_EN_SEGON_PLA_MS
      }).catch(() => {}));
    }
    // Al registre, només l'estat i el motiu: cap actor ni cap cos.
    registre.info?.(`[ap-inbox-verifica] ${r.status} ${r.cos?.estat ?? r.cos?.error ?? ''}${r.cos?.motiu ? ` ${r.cos.motiu}` : ''}`);
    return resposta(r.status, r.cos, r.capcaleres);
  }

  async function atenCua(req) {
    if (String(req.method).toUpperCase() !== 'POST') return resposta(405, { ok: false, error: 'metode' }, { Allow: 'POST' });
    if (!activa) return resposta(503, { ok: false, error: 'federacio_apagada' });
    if (!bona || !config.secretCron) return faltaConfig();
    if (!(await igualsEnTempsConstant(String(req.headers.get(AP.CAPCALERA_CRON) ?? '').trim(), config.secretCron, subtle))) {
      return resposta(401, { ok: false, error: 'no-autoritzat' });
    }
    try {
      const actius = await clausPrivades();
      const recompte = await drenaCua({ cua: cuaEixida, claus: actius, origen: config.origen, fetch, resolDns, ara, subtle, aleatori });
      const purgades = typeof magatzemInbox.purga === 'function' ? await magatzemInbox.purga(ara()) : {};
      const purga = {
        activitats: purgades.activitats ?? 0, alertes: purgades.alertes ?? 0, lapides: purgades.lapides ?? 0,
        cua: purgades.cua ?? (cuaEixida !== magatzemInbox && typeof cuaEixida.purga === 'function' ? await cuaEixida.purga() : 0)
      };
      registre.info?.(`[ap-inbox-verifica] cua fets=${recompte.fets} reintents=${recompte.reintents} fallits=${recompte.fallits} lots=${recompte.lots}`);
      return resposta(200, {
        ok: true, fets: recompte.fets, reintents: recompte.reintents, fallits: recompte.fallits, sense_provar: recompte.sense_provar,
        lots: recompte.lots, esgotat: recompte.esgotat, purga
      });
    } catch {
      registre.error('[ap-inbox-verifica] La base no respon.');
      return resposta(502, { ok: false, error: 'base' });
    }
  }

  return async function gestor(req) {
    let url = null;
    try { url = new URL(req.url); } catch { return resposta(400, { error: 'bad_request' }); }
    const intern = camiIntern(url.pathname, AP.PREFIX_INTERN);
    const inbox = CAMI_INBOX.exec(intern);
    if (inbox) return atenInbox(req, inbox[1], url.search);
    if (intern === '/cua') return atenCua(req);
    return resposta(404, { error: 'not_found' });
  };
}
