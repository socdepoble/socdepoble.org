/* T1 (261024; P0-04, App Store Review Guideline 5.1.1(v); auditoria Codex
   261024_1315 C-01) · La funció compte-apple: custodia i revoca l'autorització
   de Sign in with Apple d'una persona de Sóc de Poble (Apple TN3194).
   Pur i provat amb Vitest: index.ts només fa Deno.serve(creaGestor(...)).
   Es desplega amb --no-verify-jwt a posta (supabase/README.md): la funció
   autoritza ella mateixa cada acció.

   POST { accio } i res més:
     custodia · la sessió de la persona (Bearer) i { codi }, el codi
       d'autorització que el full natiu d'Apple acaba de tornar. La funció
       el canvia a Apple per un refresh token, comprova que l'id_token és
       d'Apple, per al nostre client i del MATEIX subjecte que la identitat
       d'Apple de la sessió (vincle A/B) i el desa xifrat. Mai el codi a GoTrue.
     revoca · la sessió de la persona. El client la crida just ABANS de
       demana_baixa (que esborra les sessions): revoca a Apple i, DESPRÉS, ho
       registra. Sense testimoni custodiat, ho passa a apple_registra_revocacio
       com a sense_testimoni (la RPC només l'anota si la baixa ja existix, i
       un per persona cada 24 hores: R1-03, 261024 correccions).
     buida · la capçalera x-sdp-cron amb SDP_CRON_SECRET (comparació en temps
       constant). El buidatge horari: revoca els pendents de les baixes. Només
       un error de tots (els secrets del servidor) para el lot; el d'una fila,
       no (R1-01, 261024 correccions).
   Ordre invariable: primer Apple, després apple_registra_revocacio, que és
   l'única que esborra la fila custodiada (i, per tant, l'única que obri la
   porta de la purga). Cap resposta ni cap línia de registre porta el codi,
   el testimoni ni el secret.
   P1-18 (auditoria Codex C0545-WM1/WM2 i 261028_1611 C28-03; pla 261028_1526
   §3.6.1) · Cap cos es llig sencer abans de mesurar-lo: el de la petició, com
   a molt MAXIM_COS bytes (una llargària declarada de més, o un flux que se'n
   passa, és 413 i el flux es cancel·la) i dins de TOPALL_COS_MS (un cos que
   no acaba és 408, abans de cap autenticació), i el de cada resposta de
   Supabase, com a molt MAXIM_RESPOSTA_SUPABASE bytes i dins del MATEIX topall
   que la petició: unes capçaleres que arriben i un cos que penja també
   s'avorten. Un cos de GoTrue que no es pot llegir és 500 servidor, ja no
   401: la sessió no s'ha desmentit. */
import {
  APPLE, capcaleresDeServei, classificaResposta, cosDIntercanvi, cosDeRevocacio, desxifra, esErrorDelClient, postApple,
  reclamsCasen, reclamsDelTestimoni, secretDeClient, xifra
} from '../_shared/apple.js';

export const CORS = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Max-Age': '86400'
});
const ACCIONS = new Set(['custodia', 'revoca', 'buida']);
const FORMA_CODI = /^[A-Za-z0-9._-]{8,1024}$/;
const FORMA_BEARER = /^Bearer\s+([\w-]+\.[\w-]+\.[\w-]+)$/i;
/* P1-18 · Bytes, no caràcters: '€' en són tres. */
const MAXIM_COS = 4096;
const MAXIM_RESPOSTA_SUPABASE = 256 * 1024;
const LOT_DEL_BUIDATGE = 50;
/* El buidatge para abans del sostre de temps d'una Edge Function. */
const PRESSUPOST_BUIDATGE_MS = 100_000;
const TOPALL_SUPABASE_MS = 10_000;
/* P1-18 · El cos de la petició (4 KiB) arriba de seguida; un que penja no reté la funció. */
const TOPALL_COS_MS = 10_000;
const SECRET_CRON_MINIM = 32;

const respon = (estat, cos) => new Response(JSON.stringify(cos), {
  status: estat,
  headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});
const falla = (estat, error, extra = {}) => respon(estat, { ok: false, error, ...extra });
const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/** L'entorn que necessita la funció; els secrets de l'Apple els posa el Mestre. */
function llegixEntorn(env = {}) {
  const v = (nom) => textNet(typeof env.get === 'function' ? env.get(nom) : env[nom]);
  return {
    url: v('SUPABASE_URL').replace(/\/+$/, ''),
    anonima: v('SUPABASE_ANON_KEY'),
    servei: v('SUPABASE_SERVICE_ROLE_KEY'),
    teamId: v('APPLE_TEAM_ID'),
    keyId: v('APPLE_KEY_ID'),
    clientId: v('APPLE_CLIENT_ID'),
    clauPem: typeof env.get === 'function' ? env.get('APPLE_PRIVATE_KEY') : env.APPLE_PRIVATE_KEY,
    clauTestimonis: v('APPLE_TESTIMONIS_CLAU'),
    secretCron: v('SDP_CRON_SECRET')
  };
}
const teApple = (e) => !!(e.url && e.servei && e.teamId && e.keyId && e.clientId && e.clauPem && e.clauTestimonis);

const errorIntern = (missatge) => Object.assign(new Error(missatge), { codi: 'servidor' });

/* P1-18 (C0545-WM1/WM2) · El text d'un cos (el de la petició o el d'una
   resposta), com a molt `maxim` BYTES: el llig tros a tros i, tan prompte com
   se'n passa, cancel·la el flux i torna null. Amb `senyal`, cada lectura perd
   la cursa amb el topall encara que el flux no l'escolte, i el flux es
   cancel·la. Sense flux (body null, o un doble sense getReader), el text
   sencer, mesurat després en bytes. Descodifica com req.text(): UTF-8 sense
   errors fatals. */
async function textFitat(missatge, maxim, senyal = null) {
  const finsAlTopall = (promesa) => (!senyal ? promesa : new Promise((resol, rebutja) => {
    const talla = () => rebutja(senyal.reason ?? new DOMException('Temps esgotat.', 'AbortError'));
    if (senyal.aborted) { talla(); return; }
    senyal.addEventListener('abort', talla, { once: true });
    promesa.then(resol, rebutja).finally(() => senyal.removeEventListener('abort', talla));
  }));
  const flux = missatge.body;
  if (typeof flux?.getReader !== 'function') {
    const text = await finsAlTopall(Promise.resolve().then(() => missatge.text()));
    return new TextEncoder().encode(text).byteLength > maxim ? null : text;
  }
  const lector = flux.getReader();
  const trossos = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await finsAlTopall(lector.read());
      if (done) break;
      if (!ArrayBuffer.isView(value)) throw new TypeError('SDP-APPLE: un tros del cos no són bytes.');
      total += value.byteLength;
      if (total > maxim) { lector.cancel().catch(() => {}); return null; }
      trossos.push(value);
    }
  } catch (error) {
    lector.cancel().catch(() => {});
    throw error;
  }
  const bytes = new Uint8Array(total);
  let posicio = 0;
  for (const tros of trossos) { bytes.set(tros, posicio); posicio += tros.byteLength; }
  return new TextDecoder().decode(bytes);
}

/* Un fetch al nostre Supabase amb topall: mai penja la funció. P1-18 (C0545-WM2) ·
   El topall dura fins que el cos s'ha llegit sencer (com a molt
   MAXIM_RESPOSTA_SUPABASE bytes; si se'n passa, errorIntern). Una resposta que
   no és 2xx no es llig: el cos es cancel·la i en torna només l'estat, sense
   esperar-lo. Torna { ok, status, text }. */
async function ambTopall(fetch, url, opcions, ms = TOPALL_SUPABASE_MS) {
  const controlador = new AbortController();
  const id = setTimeout(() => controlador.abort(), ms);
  try {
    const resposta = await fetch(url, { ...opcions, redirect: 'error', signal: controlador.signal });
    if (!resposta.ok) {
      resposta.body?.cancel?.().catch(() => {});
      return { ok: false, status: resposta.status, text: '' };
    }
    const text = await textFitat(resposta, MAXIM_RESPOSTA_SUPABASE, controlador.signal);
    if (text === null) throw errorIntern('SDP-APPLE: la resposta de Supabase passa del topall de bytes.');
    return { ok: true, status: resposta.status, text };
  } finally { clearTimeout(id); }
}

/** L'usuari de la sessió, segons GoTrue; null si no n'hi ha o no val. */
async function usuariDeLaSessio(req, entorn, fetch) {
  const m = FORMA_BEARER.exec(textNet(req.headers.get('authorization')));
  if (!m || !entorn.anonima) return null;
  const resposta = await ambTopall(fetch, `${entorn.url}/auth/v1/user`, {
    method: 'GET', headers: { apikey: entorn.anonima, Authorization: `Bearer ${m[1]}`, Accept: 'application/json' }
  }, entorn.topallSupabaseMs);
  if (resposta.status === 401 || resposta.status === 403) return null;
  if (!resposta.ok) throw errorIntern('SDP-APPLE: GoTrue no ha respost.');
  let usuari = null;
  try { usuari = JSON.parse(resposta.text); } catch { usuari = null; }
  return typeof usuari?.id === 'string' && usuari.id ? usuari : null;
}

/* El subjecte de la identitat d'Apple de la persona, o null. GoTrue el dona
   com a `id` de la identitat (és auth.identities.provider_id, el que
   comprova apple_desa_autoritzacio); identity_data.sub és la reserva. */
function subjecteDApple(usuari) {
  const identitat = (Array.isArray(usuari?.identities) ? usuari.identities : []).find((i) => i?.provider === 'apple');
  const sub = textNet(identitat?.id) || textNet(identitat?.provider_id) || textNet(identitat?.identity_data?.sub);
  return sub || null;
}

/** Una RPC com a service_role. Llança si PostgREST no la confirma. */
async function rpc(entorn, fetch, nom, args) {
  const resposta = await ambTopall(fetch, `${entorn.url}/rest/v1/rpc/${nom}`, {
    method: 'POST',
    headers: { ...capcaleresDeServei(entorn.servei), 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(args)
  }, entorn.topallSupabaseMs);
  if (!resposta.ok) throw errorIntern(`SDP-APPLE: l’RPC ${nom} no s’ha confirmat (${resposta.status}).`);
  return resposta.text ? JSON.parse(resposta.text) : null;
}
const files = (resposta) => (Array.isArray(resposta) ? resposta : resposta ? [resposta] : []);

/** Comparació en temps constant (resum SHA-256 de tots dos: tampoc no filtra la llargària). */
async function igualsEnTempsConstant(a, b, subtle) {
  const codifica = (t) => new TextEncoder().encode(String(t));
  const [x, y] = await Promise.all([subtle.digest('SHA-256', codifica(a)), subtle.digest('SHA-256', codifica(b))]);
  const vx = new Uint8Array(x);
  const vy = new Uint8Array(y);
  let diferencia = 0;
  for (let i = 0; i < vx.length; i++) diferencia |= vx[i] ^ vy[i];
  return diferencia === 0;
}

/**
 * El gestor de peticions de la funció.
 * @param {{ env: object, fetch?: typeof fetch, subtle?: SubtleCrypto, ara?: () => number,
 *   topallAppleMs?: number, topallSupabaseMs?: number, topallCosMs?: number, pressupostMs?: number }} dependencies
 * @returns {(req: Request) => Promise<Response>}
 */
export function creaGestor({
  env, fetch = globalThis.fetch, subtle = globalThis.crypto.subtle, ara = Date.now,
  topallAppleMs = 10_000, topallSupabaseMs = TOPALL_SUPABASE_MS, topallCosMs = TOPALL_COS_MS,
  pressupostMs = PRESSUPOST_BUIDATGE_MS
} = {}) {
  /* P1-18 · El topall de Supabase viatja amb l'entorn (les proves el retallen). */
  const entorn = { ...llegixEntorn(env), topallSupabaseMs };
  const secret = (clientId = entorn.clientId) => secretDeClient({ teamId: entorn.teamId, keyId: entorn.keyId, clientId, clauPem: entorn.clauPem, ara: ara() }, subtle);
  /* R1-01 (261024 correccions) · Un client_secret per client_id (el seu sub ha
     de ser el client_id del cos), fet una sola vegada a cada petició. */
  const secretsPerClient = () => {
    const fets = new Map();
    return (clientId) => {
      if (!fets.has(clientId)) fets.set(clientId, secret(clientId));
      return fets.get(clientId);
    };
  };
  const apple = (url, cos) => postApple(url, cos, { fetch, topallMs: topallAppleMs });
  const registra = (args) => rpc(entorn, fetch, 'apple_registra_revocacio', args);

  /* Revoca un testimoni custodiat i, DESPRÉS, ho registra. Torna la classe:
     'acceptada', 'ja_invalid', 'reintenta', 'fila' (un error només d'esta
     fila: el lot continua) o 'config' (els secrets del servidor no valen per
     a ningú: el lot para).
     R1-01 (261024 correccions) · Un xifrat que no es desxifra, un 400 d'un
     sol testimoni o un client_id d'una altra configuració són de la fila. El
     client_secret es fa amb el client_id de la fila: és el client a qui Apple
     va donar el testimoni, i un client_secret d'un altre client no el revoca. */
  async function revocaIRegistra(fila, origen, secretDe) {
    const args = { p_user_id: fila.user_id, p_origen: origen, p_xifrat: fila.testimoni_xifrat };
    const clientId = textNet(fila.client_id) || entorn.clientId;
    const delClientConfigurat = clientId === entorn.clientId;
    const fallida = async (detall, classe) => {
      await registra({ ...args, p_resultat: 'fallida', p_detall: detall });
      return classe;
    };
    let testimoni;
    try {
      testimoni = await desxifra(fila.testimoni_xifrat, entorn.clauTestimonis, { context: fila.user_id }, subtle);
    } catch (error) {
      /* La clau sense forma no val per a ningú; un xifrat que no es desxifra és d'esta fila. */
      return fallida('config:clau', error?.codi === 'config' ? 'config' : 'fila');
    }
    let secretDelClient;
    try {
      secretDelClient = await secretDe(clientId);
    } catch {
      return fallida('config:client', delClientConfigurat ? 'config' : 'fila');
    }
    const resposta = classificaResposta(await apple(APPLE.REVOCA, cosDeRevocacio({ clientId, secret: secretDelClient, testimoni })));
    const { classe, detall } = resposta;
    if (classe === 'acceptada') await registra({ ...args, p_resultat: 'revocat', p_detall: null });
    else if (classe === 'ja_invalid') await registra({ ...args, p_resultat: 'ja_invalid', p_detall: detall });
    else await registra({ ...args, p_resultat: 'fallida', p_detall: detall });
    if (classe !== 'config') return classe;
    return delClientConfigurat && esErrorDelClient(resposta) ? 'config' : 'fila';
  }

  async function custodia(req, cos) {
    const codi = textNet(cos.codi);
    if (!FORMA_CODI.test(codi)) return falla(400, 'peticio');
    const usuari = await usuariDeLaSessio(req, entorn, fetch);
    if (!usuari) return falla(401, 'sense-sessio');
    const subjecte = subjecteDApple(usuari);
    if (!subjecte) return falla(409, 'subjecte');
    const resposta = await apple(APPLE.TOKEN, cosDIntercanvi({ clientId: entorn.clientId, secret: await secret(), codi }));
    const { classe } = classificaResposta(resposta);
    if (classe === 'ja_invalid') return respon(200, { ok: false, resultat: 'codi_caducat' });
    if (classe === 'config') return falla(503, 'config');
    if (classe !== 'acceptada') return falla(502, 'apple');
    const refresc = textNet(resposta.cos?.refresh_token);
    let reclams = null;
    try { reclams = reclamsDelTestimoni(resposta.cos?.id_token); } catch { reclams = null; }
    if (!refresc || !reclams) return falla(502, 'apple');
    /* El vincle A/B: el codi de la persona A amb la sessió de B no es desa mai. */
    if (!reclamsCasen(reclams, { clientId: entorn.clientId, subjecte })) return falla(409, 'subjecte');
    const xifrat = await xifra(refresc, entorn.clauTestimonis, { context: usuari.id }, subtle);
    await rpc(entorn, fetch, 'apple_desa_autoritzacio',
      { p_user_id: usuari.id, p_sub: subjecte, p_client_id: entorn.clientId, p_xifrat: xifrat });
    return respon(200, { ok: true, resultat: 'desat' });
  }

  async function revoca(req) {
    const usuari = await usuariDeLaSessio(req, entorn, fetch);
    if (!usuari) return falla(401, 'sense-sessio');
    if (!subjecteDApple(usuari)) return respon(200, { ok: true, resultat: 'sense_apple' });
    const [fila] = files(await rpc(entorn, fetch, 'apple_autoritzacio_de', { p_user_id: usuari.id }));
    if (!fila?.testimoni_xifrat) {
      await registra({ p_user_id: usuari.id, p_origen: 'baixa', p_resultat: 'sense_testimoni', p_xifrat: null, p_detall: null });
      return respon(200, { ok: true, resultat: 'sense_testimoni' });
    }
    const secretDe = secretsPerClient();
    await secretDe(entorn.clientId);   // els secrets del servidor, abans de tocar la fila
    const classe = await revocaIRegistra({ ...fila, user_id: usuari.id }, 'baixa', secretDe);
    if (classe === 'acceptada') return respon(200, { ok: true, resultat: 'revocat' });
    if (classe === 'ja_invalid') return respon(200, { ok: true, resultat: 'ja_invalid' });
    if (classe === 'config' || classe === 'fila') return falla(503, 'config');
    return falla(502, 'apple');
  }

  async function buida(req) {
    if (entorn.secretCron.length < SECRET_CRON_MINIM) return falla(503, 'config');
    if (!(await igualsEnTempsConstant(textNet(req.headers.get('x-sdp-cron')), entorn.secretCron, subtle))) {
      return falla(401, 'sense-sessio');
    }
    const pendents = files(await rpc(entorn, fetch, 'apple_revocacions_pendents', { p_limit: LOT_DEL_BUIDATGE }));
    const inici = ara();
    const secretDe = secretsPerClient();
    /* Els secrets del servidor, abans de tocar cap fila: si no valen, 503 config. */
    if (pendents.length) await secretDe(entorn.clientId);
    let fetes = 0;
    let fallides = 0;
    for (const fila of pendents) {
      if (ara() - inici > pressupostMs) break;
      if (!fila?.user_id || !fila?.testimoni_xifrat) continue;
      const classe = await revocaIRegistra(fila, 'cron', secretDe);
      if (classe === 'acceptada' || classe === 'ja_invalid') fetes++;
      else fallides++;
      /* Amb els secrets dolents, cap altra no passaria: el lot para i ho diu.
         Un error d'una sola fila ('fila') no para el lot (R1-01). */
      if (classe === 'config') return falla(503, 'config', { fetes, fallides });
    }
    return respon(200, { ok: true, fetes, fallides, pendents: pendents.length });
  }

  return async function gestor(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...CORS } });
    if (req.method !== 'POST') return falla(405, 'peticio');
    let cos;
    /* P1-18 (C0545-WM1) · Una llargària declarada de més es rebutja sense
       llegir res; un flux que se'n passa es talla al tros que la passa, i un
       que no acaba, al topall (408). Tot abans de cap autenticació. */
    const control = new AbortController();
    const rellotge = setTimeout(() => control.abort(), topallCosMs);
    try {
      const declarat = Number(req.headers.get('content-length'));
      if (Number.isFinite(declarat) && declarat > MAXIM_COS) {
        req.body?.cancel?.().catch(() => {});
        return falla(413, 'peticio');
      }
      const text = await textFitat(req, MAXIM_COS, control.signal);
      if (text === null) return falla(413, 'peticio');
      cos = JSON.parse(text);
    } catch {
      return falla(control.signal.aborted ? 408 : 400, 'peticio');
    } finally { clearTimeout(rellotge); }
    const accio = typeof cos?.accio === 'string' ? cos.accio : '';
    if (!ACCIONS.has(accio)) return falla(400, 'peticio');
    if (!teApple(entorn) || (accio !== 'buida' && !entorn.anonima)) return falla(503, 'config');
    try {
      if (accio === 'custodia') return await custodia(req, cos);
      if (accio === 'revoca') return await revoca(req);
      return await buida(req);
    } catch (error) {
      /* Només la classe: el missatge pot dur l'estat d'una RPC, mai un testimoni, però no cal. */
      console.error('[compte-apple] Acció interrompuda:', accio, error?.codi ?? error?.name ?? 'error');
      return falla(error?.codi === 'config' ? 503 : 500, error?.codi === 'config' ? 'config' : 'servidor');
    }
  };
}
