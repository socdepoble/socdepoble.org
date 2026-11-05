import {xarxaRateNodeZero} from './xarxa-rate-node0.mjs';
/** Local Node 0 identity. Requires the narrow node0_authenticator connection.
 * Transport owns JSON/body size limits and trusted remoteAddress extraction.
 * No token, password or verification challenge is returned in a JSON body.
 * Node v24 crypto primary reference: https://nodejs.org/docs/latest-v24.x/api/crypto.html
 */
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { sqlJson, sqlText } from './postgres-node0.mjs';
import {IDENTITAT_INSTITUCIONAL_NODE0} from './identitat-institucional-node0.mjs';

const scryptAsync = promisify(scrypt);
export const NODE0_AUTH_COOKIE = '__Host-sdp-node0';
export const NODE0_AUTH_TENANT = 'ac3bec76-255b-5ca2-8886-28fcceab4267';
export const NODE0_SCRYPT = Object.freeze({ N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 });
const ALGORITHM = 'scrypt-N131072-r8-p1-k64';
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const HEX64 = /^[a-f0-9]{64}$/;
const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const NODE0_AUTH_LIMITS = Object.freeze({ activeKdfs: 2, mailTransports: 2, resetWorkers: 2, resetRequests: 16, resetResponseMs: 100 });
let activeKdfs = 0, activeMailTransports = 0;
const LOCAL_FAILURE = Symbol('node0-auth-local-failure');
const failure = (code, status = 400) => Object.assign(new Error(code), { code, status, [LOCAL_FAILURE]: true });

export const hashTokenNodeZero = token => createHash('sha256').update(token).digest('hex');
const validToken = token => typeof token === 'string' && TOKEN.test(token) && Buffer.from(token, 'base64url').toString('base64url') === token;
function header(headers, name) {
  const value = headers?.get ? headers.get(name) : headers?.[name] ?? headers?.[name.toLowerCase()];
  return typeof value === 'string' ? value : '';
}
/** Duplicated or noncanonical cookies fail closed; no URL/query token accepted. */
export function hashSessioNodeZero(headers) {
  const raw = header(headers, 'cookie');
  if (raw.length > 8192) return null;
  const values = raw.split(';').map(x => x.trim()).filter(x => x.split('=', 1)[0] === NODE0_AUTH_COOKIE);
  if (values.length !== 1) return null;
  const token = values[0].slice(NODE0_AUTH_COOKIE.length + 1);
  return validToken(token) ? hashTokenNodeZero(token) : null;
}
function password(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 256 ||
    Buffer.byteLength(value) > 1024 || value.includes('\0') || !value.isWellFormed()) throw failure('password_invalid');
  return value;
}
function email(value) {
  if (typeof value !== 'string') throw failure('email_invalid');
  const normalized = value.trim().toLowerCase();
  if (normalized.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(normalized) || normalized.includes('..')) throw failure('email_invalid');
  return normalized;
}
async function derive(value, salt) {
  if (activeKdfs >= NODE0_AUTH_LIMITS.activeKdfs) throw failure('auth_busy', 429);
  activeKdfs++;
  try { return await scryptAsync(value, salt, 64, NODE0_SCRYPT); }
  finally { activeKdfs--; }
}
export async function creaCredencialNodeZero(value) {
  const salt = randomBytes(16);
  const digest = await derive(password(value), salt);
  try { return { salt: salt.toString('hex'), digest: digest.toString('hex'), algorithm: ALGORITHM }; }
  finally { digest.fill(0); }
}
export async function verificaContrasenyaNodeZero(value, credential) {
  password(value);
  // Unknown emails consume the same configured KDF. Only fixed-size digests go
  // to timingSafeEqual; that does not make the entire HTTP handler constant-time.
  const valid = credential?.algorithm === ALGORITHM && /^[a-f0-9]{32}$/.test(credential.salt) && /^[a-f0-9]{128}$/.test(credential.digest);
  const salt = Buffer.from(valid ? credential.salt : '00'.repeat(16), 'hex');
  const expected = Buffer.from(valid ? credential.digest : '00'.repeat(64), 'hex');
  const actual = await derive(value, salt);
  try { return timingSafeEqual(actual, expected) && Boolean(valid); }
  finally { actual.fill(0); expected.fill(0); }
}
const cookie = (token, maxAge = 28800) => `${NODE0_AUTH_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const clearedCookie = () => cookie('', 0);
const response = (status, body, extra = {}) => ({ status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8', ...extra }, body });

/** Safe SQL fragment, for use within the same transaction as a private RPC.
 * A null result means unauthorized. The caller must abort rather than set claims.
 */
export function contextSqlNodeZero(sessionHash) {
  if (typeof sessionHash !== 'string' || !HEX64.test(sessionHash)) throw failure('session_invalid', 401);
  return `private.node0_auth_context(${sqlText(sessionHash)})`;
}

export function creaAuthNodeZero({ db, origin = 'https://socdepoble.cat', tenantId = NODE0_AUTH_TENANT,
  mailTransport = null, rateSecret } = {}) {
  const configured = new URL(origin);
  if (configured.protocol !== 'https:' || configured.origin !== origin || configured.username || configured.password || tenantId !== NODE0_AUTH_TENANT) throw failure('auth_configuration_invalid');
  if (!db || typeof db.query !== 'function' || (mailTransport !== null && typeof mailTransport !== 'function')) throw failure('auth_configuration_invalid');
  const secret = Buffer.isBuffer(rateSecret) ? Buffer.from(rateSecret) : typeof rateSecret === 'string' && HEX64.test(rateSecret) ? Buffer.from(rateSecret, 'hex') : null;
  if (!secret || secret.length < 32 || secret.length > 128) throw failure('auth_rate_secret_required');
  const query = (name, args = []) => db.query(`SELECT coalesce(to_jsonb(private.node0_auth_${name}(${args.join(',')})),'null'::jsonb) AS result;`,{privateValues:true});
  // creaPostgres.query returns a JSON scalar when SELECT emits a JSON value.
  // No arbitrary SQL identifiers, method names or body fields reach query().
  const invoke = async (name, args = []) => {
    const result = await query(name, args);
    return result?.rows ? result.rows[0]?.result : result;
  };
  // Recovery is an accepted request, never a delivery receipt. Neither the
  // account lookup nor SMTP latency/error controls its public response. Bound
  // both queued and active work; saturation returns the same acknowledgement.
  const resetRequests = [];
  let resetWorkers = 0, closed = false;
  const pumpResetRequests = () => {
    if (closed) return;
    while (resetWorkers < NODE0_AUTH_LIMITS.resetWorkers && resetRequests.length) {
      const normalizedEmail = resetRequests.shift();
      resetWorkers++;
      void (async () => {
        try {
          const token = randomBytes(32).toString('base64url');
          if (await invoke('reset_challenge', [sqlText(normalizedEmail), sqlText(hashTokenNodeZero(token))]) && !closed)
            await deliver(normalizedEmail, token, 'reset-password');
        } catch { /* no account-dependent status, diagnostic or private log */ }
        finally { resetWorkers--; pumpResetRequests(); }
      })();
    }
  };
  function requestReset(normalizedEmail) {
    if (resetRequests.length + resetWorkers < NODE0_AUTH_LIMITS.resetRequests) {
      resetRequests.push(normalizedEmail);
      setImmediate(pumpResetRequests);
    }
  }
  async function limit(action, address, normalizedEmail = '', identity = null) {
    const key = (scope, value) => createHmac('sha256', secret).update(`${action}\0${scope}\0${value}`).digest('hex');
    if(action==='password'&&identity){
      // The SQL function revalidates this exact session and actor before using
      // a stable actor quota. An email claim never selects this lane.
      const scope=`session-password:${identity.sessionHash}:${identity.user.id}`;
      if(!await invoke('rate',[sqlText(key('verified',identity.user.id)),sqlText(scope)]))throw failure('auth_rate_limited',429);
      return;
    }
    let network;try{network=xarxaRateNodeZero(address);}catch{throw failure('remote_address_required');}
    // Separate address and email buckets: a distributed attack cannot remove the
    // account bucket, nor can random emails remove the address bucket.
    if (!await invoke('rate', [sqlText(key('ip', network)), sqlText('ip')]) ||
      (normalizedEmail && !await invoke('rate', [sqlText(key('email', normalizedEmail)), sqlText('email')]))) throw failure('auth_rate_limited', 429);
  }
  async function identifica(headers) {
    const sessionHash = hashSessioNodeZero(headers);
    if (!sessionHash) return null;
    const context = await invoke('context', [sqlText(sessionHash)]);
    return context?.user?.id ? { ...context, sessionHash } : null;
  }
  function mutation(headers) {
    if (header(headers, 'origin') !== origin) throw failure('auth_origin_rejected', 403);
    if (!/^application\/json(?:\s*;|$)/i.test(header(headers, 'content-type'))) throw failure('auth_json_required', 415);
  }
  function expectedActor(headers) {
    const actor = header(headers, 'x-sdp-expected-actor');
    if (!UUID.test(actor)) throw failure('actor_binding_required', 409);
    return actor.toLowerCase();
  }
  async function deliver(to, token, purpose = 'verify-email') {
    // Trusted server transport, not a browser callback. No token in public JSON,
    // exception text or logs. Promise settlement is bounded even if SMTP ignores
    // cancellation. Late acceptance may deliver a still-valid confirmation.
    let timer;
    const controller = new AbortController();
    if (activeMailTransports >= NODE0_AUTH_LIMITS.mailTransports) throw failure('email_delivery_unavailable', 503);
    activeMailTransports++;
    const transport = Promise.resolve().then(() => mailTransport({ from:IDENTITAT_INSTITUCIONAL_NODE0.mailFrom, to, token, purpose, origin, signal: controller.signal }));
    // A transport that ignores abort must keep its slot until it really
    // settles. A timeout can never create unlimited underlying SMTP work.
    void transport.then(() => { activeMailTransports--; }, () => { activeMailTransports--; });
    try {
      await Promise.race([
        transport,
        new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(failure('email_delivery_unavailable', 503)); }, 10000); })
      ]);
    } catch { throw failure('email_delivery_unavailable', 503); }
    finally { clearTimeout(timer); }
  }
  async function handle(action, { headers = {}, body = {}, remoteAddress } = {}) {
    try {
      if (closed) throw failure('auth_unavailable', 503);
      if (action === 'policy') return response(200, await invoke('policy'));
      if (action === 'session') {
        // Identity-bearing GET responses are same-origin, never public CORS.
        const suppliedOrigin = header(headers, 'origin');
        if (suppliedOrigin && suppliedOrigin !== origin) throw failure('auth_origin_rejected', 403);
        const identity = await identifica(headers);
        return response(200, { user: identity?.user ?? null });
      }
      mutation(headers);
      if (!body || typeof body !== 'object' || Array.isArray(body) || JSON.stringify(body).length > 16384) throw failure('auth_body_invalid');
      const actor = ['logout', 'password', 'norms', 'norms-state'].includes(action) ? expectedActor(headers) : null;
      if (action === 'register') {
        // Existing UI shows a sent-email screen for a successful signup. A
        // missing transport must therefore fail before creating a person.
        if (!mailTransport) throw failure('email_delivery_unavailable', 503);
        const normalizedEmail = email(body.email);
        const meta = body.metadata;
        if (!meta || meta.accepta_rgpd !== true || typeof meta.versio_politica !== 'string') throw failure('consent_required', 422);
        const policy = await invoke('policy');
        if (!policy?.privacy?.version || meta.versio_politica !== policy.privacy.version) throw failure('consent_version_invalid', 422);
        if (meta.tenant_id !== undefined && meta.tenant_id !== tenantId) throw failure('tenant_invalid', 422);
        await limit('register', remoteAddress, normalizedEmail);
        const credential = await creaCredencialNodeZero(body.password);
        const token = randomBytes(32).toString('base64url');
        // No claimed profile belongs to an email owner before proof. The owner
        // can choose their profile after verification with their own session.
        const cleanMeta = { accepta_rgpd: true, versio_politica: meta.versio_politica, tenant_id: tenantId };
        const result = await invoke('register', [sqlText(normalizedEmail), sqlJson(cleanMeta), sqlText(credential.salt), sqlText(credential.digest), sqlText(hashTokenNodeZero(token))]);
        if (result?.created) await deliver(normalizedEmail, token);
        return response(202, { verification_required: true });
      }
      if (action === 'resend-verification') {
        if (!mailTransport) throw failure('email_delivery_unavailable', 503);
        const normalizedEmail = email(body.email);
        await limit('resend', remoteAddress, normalizedEmail);
        const token = randomBytes(32).toString('base64url');
        const changed = await invoke('challenge', [sqlText(normalizedEmail), sqlText(hashTokenNodeZero(token))]);
        if (changed) await deliver(normalizedEmail, token);
        return response(202, { verification_required: true });
      }
      if (action === 'request-password-reset') {
        if (!mailTransport) throw failure('email_delivery_unavailable',503);
        const normalizedEmail=email(body.email);
        await limit('reset-request',remoteAddress,normalizedEmail);
        requestReset(normalizedEmail);
        await new Promise(resolve => setTimeout(resolve, NODE0_AUTH_LIMITS.resetResponseMs));
        return response(202,{recovery_requested:true});
      }
      if (action === 'verify-email' || action === 'reset-password') {
        await limit(action==='verify-email'?'verify':'reset',remoteAddress);
        if(!validToken(body.token))throw failure('verification_invalid',400);
        const method=action==='verify-email'?'verify':'reset';
        const tokenHash=hashTokenNodeZero(body.token);
        // Indexed SHA lookup rejects absent/expired/version-stale challenges
        // before scrypt. The mutation rechecks under locks after derivation.
        if(!await invoke('challenge_ready',[sqlText(tokenHash),sqlText(method)]))throw failure('verification_invalid',400);
        // The email receiver chooses the final password explicitly here. It is
        // never inherited from an unverified third-party registration request.
        const chosen=await creaCredencialNodeZero(body.password);
        let accepted=null;
        if(action==='verify-email'||body.metadata!==undefined){
          const meta=body.metadata;
          if(!meta||meta.accepta_rgpd!==true||typeof meta.versio_politica!=='string')throw failure('consent_required',422);
          const policy=await invoke('policy');
          if(meta.versio_politica!==policy?.privacy?.version)throw failure('consent_version_invalid',422);
          accepted=meta.versio_politica;
        }
        if(!await invoke(method,[sqlText(tokenHash),sqlText(chosen.salt),sqlText(chosen.digest),sqlText(accepted)]))throw failure('verification_invalid',400);
        return action==='verify-email'?response(200,{verified:true,login_required:true}):response(200,{password_changed:true,login_required:true});
      }
      if (action === 'login') {
        const normalizedEmail = email(body.email);
        await limit('login', remoteAddress, normalizedEmail);
        const credential = await invoke('credential', [sqlText(normalizedEmail)]);
        if (!await verificaContrasenyaNodeZero(body.password, credential)) throw failure('credentials_invalid', 401);
        const token = randomBytes(32).toString('base64url');
        const session = await invoke('create_session', [sqlText(credential.user_id)+'::uuid', sqlText(credential.version)+'::bigint', sqlText(hashTokenNodeZero(token))]);
        if (!session?.user) throw failure('credentials_invalid', 401);
        return response(200, { user: session.user }, { 'Set-Cookie': cookie(token) });
      }
      if (action === 'logout') {
        const sessionHash = hashSessioNodeZero(headers);
        if (!sessionHash) throw failure('session_actor_changed', 409);
        const changed = await invoke('logout', [sqlText(sessionHash), sqlText(actor)+'::uuid']);
        if (!changed) throw failure('session_actor_changed', 409);
        return response(200, { logged_out: true }, { 'Set-Cookie': clearedCookie() });
      }
      if (action === 'password') {
        const identity = await identifica(headers);
        if (!identity) throw failure('session_required', 401);
        // Fast rejection is supplemental. The SQL mutation checks the expected
        // actor again under its credential/session locks in the same transaction.
        if (identity.user.id !== actor) throw failure('session_actor_changed', 409);
        await limit('password', remoteAddress, identity.user.email,identity);
        const credential = await invoke('credential', [sqlText(identity.user.email)]);
        if (!await verificaContrasenyaNodeZero(body.currentPassword, credential)) throw failure('credentials_invalid', 401);
        const replacement = await creaCredencialNodeZero(body.password);
        const changed = await invoke('password', [sqlText(identity.sessionHash), sqlText(credential.version)+'::bigint', sqlText(replacement.salt), sqlText(replacement.digest), sqlText(actor)+'::uuid']);
        if (!changed) throw failure('session_required', 401);
        return response(200, { password_changed: true, login_required: true }, { 'Set-Cookie': clearedCookie() });
      }
      if (action === 'norms-state') {
        const sessionHash = hashSessioNodeZero(headers);
        if (!sessionHash) throw failure('session_required', 401);
        const result = await invoke('norms_state', [sqlText(sessionHash), sqlText(actor)+'::uuid']);
        if (!result) throw failure('session_required', 401);
        return response(200, result);
      }
      if (action === 'norms') {
        const sessionHash = hashSessioNodeZero(headers);
        if (!sessionHash) throw failure('session_required', 401);
        if (body.accept !== true || typeof body.version !== 'string') throw failure('norms_acceptance_required', 422);
        const policy = await invoke('policy');
        if (body.version !== policy.normsVersion) throw failure('norms_version_invalid', 422);
        const result = await invoke('norms', [sqlText(sessionHash), sqlText(body.version), sqlText(actor)+'::uuid']);
        if (!result) throw failure('session_required', 401);
        return response(200, result);
      }
      throw failure('auth_action_unavailable', 404);
    } catch (error) {
      // PostgreSQL and SMTP exception details may contain private inputs. Only
      // locally constructed, known error codes cross the HTTP boundary.
      if (error?.[LOCAL_FAILURE] === true) return response(error.status, { error: error.code });
      if (error?.sqlState === 'N0A01') return response(409, { error: 'session_actor_changed' });
      if (error?.sqlState === 'N0A02') return response(409, { error: 'actor_binding_required' });
      return response(503, { error: 'auth_unavailable' });
    }
  }
  // Supported code surface; the daemon additionally verifies database grants
  // and function signatures before advertising a ready user backend.
  const capabilities = Object.freeze({ actorBinding: true, norms: true, emailDelivery: typeof mailTransport === 'function', emailVerificationWithPassword: typeof mailTransport === 'function', emailPasswordRecovery: typeof mailTransport === 'function' });
  const close = () => { closed = true; resetRequests.length = 0; secret.fill(0); };
  return Object.freeze({ handle, identifica, hashSessio: hashSessioNodeZero, contextSql: contextSqlNodeZero, capabilities, close });
}
