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
   el testimoni ni el secret. */
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
const MAXIM_COS = 4096;
const LOT_DEL_BUIDATGE = 50;
/* El buidatge para abans del sostre de temps d'una Edge Function. */
const PRESSUPOST_BUIDATGE_MS = 100_000;
const TOPALL_SUPABASE_MS = 10_000;
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

/* Un fetch al nostre Supabase amb topall: mai penja la funció. */
async function ambTopall(fetch, url, opcions, ms = TOPALL_SUPABASE_MS) {
  const controlador = new AbortController();
  const id = setTimeout(() => controlador.abort(), ms);
  try { return await fetch(url, { ...opcions, redirect: 'error', signal: controlador.signal }); } finally { clearTimeout(id); }
}

const errorIntern = (missatge) => Object.assign(new Error(missatge), { codi: 'servidor' });

/** L'usuari de la sessió, segons GoTrue; null si no n'hi ha o no val. */
async function usuariDeLaSessio(req, entorn, fetch) {
  const m = FORMA_BEARER.exec(textNet(req.headers.get('authorization')));
  if (!m || !entorn.anonima) return null;
  const resposta = await ambTopall(fetch, `${entorn.url}/auth/v1/user`, {
    method: 'GET', headers: { apikey: entorn.anonima, Authorization: `Bearer ${m[1]}`, Accept: 'application/json' }
  });
  if (resposta.status === 401 || resposta.status === 403) return null;
  if (!resposta.ok) throw errorIntern('SDP-APPLE: GoTrue no ha respost.');
  const usuari = await resposta.json().catch(() => null);
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
  });
  if (!resposta.ok) throw errorIntern(`SDP-APPLE: l’RPC ${nom} no s’ha confirmat (${resposta.status}).`);
  const text = await resposta.text();
  return text ? JSON.parse(text) : null;
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
 *   topallAppleMs?: number, pressupostMs?: number }} dependencies
 * @returns {(req: Request) => Promise<Response>}
 */
export function creaGestor({
  env, fetch = globalThis.fetch, subtle = globalThis.crypto.subtle, ara = Date.now,
  topallAppleMs = 10_000, pressupostMs = PRESSUPOST_BUIDATGE_MS
} = {}) {
  const entorn = llegixEntorn(env);
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
    try {
      const text = await req.text();
      if (text.length > MAXIM_COS) return falla(400, 'peticio');
      cos = JSON.parse(text);
    } catch { return falla(400, 'peticio'); }
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
