/** Eixida exclusiva de Node 0. No s'importa des de src/ ni rep tokens del client.
 * El daemon llig ~/.config/socdepoble/node0.env (0600) abans d'invocar-la.
 * Mastodon conserva Idempotency-Key durant una hora: el daemon ha de mantindre
 * també una cua/deduplicació durable per a reintents després d'eixa finestra.
 */
import { createHash, webcrypto } from 'node:crypto';
import { COMPTE_MASTODON, LIMITS_MASTODON, formataPublicacioMastodon, creaActivitatMastodon, executaAmbTerminiMastodon } from '../../src/data/federacio/pontMastodon.js';
import { signaPeticioHttpMessageActivityPub } from './http-message-signatures-ed25519.mjs';
const ERROR_LOCAL = Symbol('mastodon-server-failure');
const falla = (code) => Object.assign(new Error(code), { code, [ERROR_LOCAL]: true });
export function clauIdempotenciaMastodon(item) {
  const post = formataPublicacioMastodon(item);
  return `sdp-${createHash('sha256').update(JSON.stringify([post.canonicalUrl, post.status])).digest('hex')}`;
}
async function respostaJson(res, signal) {
  const length = res.headers?.get('content-length');
  if (length !== null && length !== undefined && (!/^\d+$/.test(length) || Number(length) > LIMITS_MASTODON.resposta) || !res.body?.getReader) throw falla('MASTODON_RESPOSTA_INVALIDA');
  const reader = res.body.getReader(); const chunks = []; let mida = 0;
  const cancela = () => { try { Promise.resolve(reader.cancel()).catch(() => {}); } catch { /* transport ja tancat */ } };
  signal.addEventListener('abort', cancela, { once: true }); if (signal.aborted) cancela();
  try {
    while (true) {
      if (signal.aborted) throw falla('MASTODON_AVORTAT');
      const { done, value } = await reader.read();
      if (signal.aborted) throw falla('MASTODON_AVORTAT');
      if (done) break;
      if (!(value instanceof Uint8Array)) throw falla('MASTODON_RESPOSTA_INVALIDA');
      mida += value.byteLength;
      if (mida > LIMITS_MASTODON.resposta) { cancela(); throw falla('MASTODON_RESPOSTA_GRAN'); }
      chunks.push(value);
    }
  } finally { signal.removeEventListener('abort', cancela); reader.releaseLock(); }
  const bytes = new Uint8Array(mida); let p = 0; for (const c of chunks) { bytes.set(c, p); p += c.byteLength; }
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw falla('MASTODON_JSON_INVALID'); }
}
async function respostaMastodonJson(res, signal, endpoint) {
  try {
    if (signal.aborted) throw falla('MASTODON_AVORTAT');
    if (!res?.ok) throw falla(`MASTODON_HTTP_${Number.isInteger(res?.status) ? res.status : 0}`);
    if (res.redirected || res.url && res.url !== endpoint) throw falla('MASTODON_REDIRECCIO');
    if ((res.headers?.get('content-type') ?? '').split(';')[0].trim().toLowerCase() !== 'application/json') throw falla('MASTODON_TIPUS_INVALID');
    return await respostaJson(res, signal);
  } catch (error) {
    try { Promise.resolve(res?.body?.cancel()).catch(() => {}); } catch { /* flux ja tancat o bloquejat */ }
    if (error?.[ERROR_LOCAL]) throw error;
    throw falla(signal.aborted ? 'MASTODON_AVORTAT' : 'MASTODON_TRANSPORT_FALLIT');
  }
}
function compteDelToken(compte, compteIdVerificat) {
  // verify_credentials returns local acct=username (Mastodon Account docs).
  // Never reflect CredentialAccount.source, role, note or other private fields.
  if (!compte || typeof compte.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(compte.id)
    || compte.username !== 'depoble' || compte.acct !== 'depoble' || compte.url !== COMPTE_MASTODON.perfil
    || compte.uri !== COMPTE_MASTODON.actor || compteIdVerificat !== null && compte.id !== compteIdVerificat) throw falla('MASTODON_TOKEN_COMPTE_NO_VERIFICAT');
  return compte.id;
}
/** Token de configuració local del servidor, mai transportat des del navegador.
 * No hi ha reintent automàtic: un timeout pot haver publicat el post. La cua
 * durable reintenta amb la mateixa clau, no crea una publicació nova.
 * Abans del POST, GET verify_credentials comprova el compte del token:
 * https://docs.joinmastodon.org/methods/accounts/#verify_credentials
 * compteIdVerificat és un pin opcional del servidor, obtingut d'un lookup
 * públic verificat anterior; no es dedueix ni s'accepta del navegador.
 */
export async function publicaAMastodonServidor(item, {
  token = process.env.MASTODON_ACCESS_TOKEN ?? process.env.SDP_MASTODON_ACCESS_TOKEN,
  fetchImpl = globalThis.fetch, signal, terminiMs, compteIdVerificat = null
} = {}) {
  if (typeof token !== 'string' || token.length < 8 || token.length > 4096 || /[\s\x00-\x1f\x7f]/.test(token)) throw falla('MASTODON_TOKEN_ABSENT_O_INVALID');
  if (typeof fetchImpl !== 'function' || compteIdVerificat !== null && (typeof compteIdVerificat !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(compteIdVerificat))) throw falla('MASTODON_TOKEN_COMPTE_NO_VERIFICAT');
  const post = formataPublicacioMastodon(item); const idempotencyKey = clauIdempotenciaMastodon(item);
  const endpoint = `${COMPTE_MASTODON.origen}/api/v1/statuses`;
  const credentialsEndpoint = `${COMPTE_MASTODON.origen}/api/v1/accounts/verify_credentials`;
  if (signal?.aborted) throw falla('MASTODON_AVORTAT');
  let postIniciat = false;
  try {
    return await executaAmbTerminiMastodon(async (senyal) => {
    let credentialsResponse;
    try {
      credentialsResponse = await fetchImpl(credentialsEndpoint, { method: 'GET', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
        signal: senyal, headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    } catch { throw falla(senyal.aborted ? 'MASTODON_AVORTAT' : 'MASTODON_TRANSPORT_FALLIT'); }
    const compte = await respostaMastodonJson(credentialsResponse, senyal, credentialsEndpoint);
    const compteId = compteDelToken(compte, compteIdVerificat);
    // A late GET/body result must not publish after the bounded caller settled.
    if (senyal.aborted) throw falla('MASTODON_AVORTAT');
    let res;
    try {
      postIniciat = true;
      res = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer',
        signal: senyal, headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ status: post.status, visibility: post.visibility, language: post.language }) });
    } catch { throw falla(senyal.aborted ? 'MASTODON_ENVIAMENT_INDETERMINAT' : 'MASTODON_TRANSPORT_FALLIT'); }
    const estat = await respostaMastodonJson(res, senyal, endpoint);
    if (typeof estat?.id !== 'string' || !/^[0-9]{1,30}$/.test(estat.id) || estat.visibility !== 'public'
      || estat.url !== `${COMPTE_MASTODON.perfil}/${estat.id}` || estat.uri !== `${COMPTE_MASTODON.actor}/statuses/${estat.id}`
      || estat.account?.id !== compteId) throw falla('MASTODON_RESULTAT_NO_VERIFICAT');
    return { id: estat.id, uri: estat.uri, url: estat.url, idempotencyKey, estat: 'publicada' };
    }, { signal, terminiMs });
  } catch (e) {
    if (postIniciat && ['MASTODON_TERMINI', 'MASTODON_AVORTAT'].includes(e?.code)) throw falla('MASTODON_ENVIAMENT_INDETERMINAT');
    if (e?.[ERROR_LOCAL] || ['MASTODON_TERMINI','MASTODON_AVORTAT','MASTODON_TERMINI_INVALID'].includes(e?.code)) throw e;
    throw falla('MASTODON_TRANSPORT_FALLIT');
  }
}
/** Preparació signada Ed25519, sense efecte de xarxa. No acredita acceptació remota. */
export async function signaCreateEd25519(item, {
  publicat, id, inbox = `${COMPTE_MASTODON.actor}/inbox`, clauPrivada, ara, subtle = webcrypto.subtle,
  keyId = 'https://socdepoble.cat/ap/actors/socdepoble#ed25519'
} = {}) {
  if (inbox !== `${COMPTE_MASTODON.actor}/inbox` || keyId !== 'https://socdepoble.cat/ap/actors/socdepoble#ed25519'
    || clauPrivada?.algorithm?.name !== 'Ed25519') throw falla('MASTODON_SIGNATURA_INVALIDA');
  const activitat = creaActivitatMastodon(item, { publicat, id }); const cos = JSON.stringify(activitat);
  const capcaleres = await signaPeticioHttpMessageActivityPub({ metode: 'POST', url: inbox, cos, actorId:'https://socdepoble.cat/ap/actors/socdepoble', keyId, clauPrivada, ara, subtle });
  return { url: inbox, metode: 'POST', capcaleres: { ...capcaleres, 'content-type': 'application/activity+json' }, cos, activitat };
}
/** La cua injectada ha de fer INSERT únic per id, abans de cap lliurament.
 * La signatura es crea al worker, a l'hora de lliurar, per no deixar-la caducar.
 * `encola` és una funció del servidor amb transacció durable, no del client.
 */
export async function encolaCreateMastodon(item, { id, publicat, encola } = {}) {
  if (typeof encola !== 'function') throw falla('MASTODON_CUA_DURABLE_REQUERIDA');
  const activitat = creaActivitatMastodon(item, { id, publicat });
  return encola({ id: activitat.id, desti: `${COMPTE_MASTODON.actor}/inbox`, activitat, tipus: 'Create' });
}
