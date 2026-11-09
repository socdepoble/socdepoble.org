/* JWT-only fast wake after a committed chat message. No chat writes,
   cookies, provider results or worker credentials cross the client boundary. */
import { capcaleresDeServei } from '../_shared/apple.js';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8'
};
const reply = (status, body) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: CORS });
async function boundedJson(input, limit, signal) {
  const reader = input.body?.getReader();
  if (!reader) throw Error('body');
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  let total = 0; const chunks = [];
  try {
    while (true) {
      if (signal.aborted) throw Error('timeout');
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) { abort(); throw Error('body'); }
      chunks.push(value);
    }
    if (signal.aborted) throw Error('timeout');
    const bytes = new Uint8Array(total); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } finally {
    signal.removeEventListener('abort', abort);
    try { reader.releaseLock(); } catch { /* cancelled */ }
  }
}
export function creaDespertador({ env = {}, fetch: request = globalThis.fetch, worker, background, timeoutMs = 8000 } = {}) {
  return async (req) => {
    if (req.method === 'OPTIONS') return reply(204, null);
    if (req.method !== 'POST') return reply(405, { ok: false, error: 'method' });
    const authorization = req.headers.get('authorization') || '';
    if (authorization.length > 16384 || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization))
      return reply(401, { ok: false, error: 'auth' });
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type') || '')) return reply(415, { ok: false, error: 'content_type' });
    let base;
    try {
      const u = new URL(env.SUPABASE_URL);
      if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password || u.search || u.hash || u.pathname !== '/') throw Error();
      base = u.origin;
    } catch { return reply(503, { ok: false, error: 'unavailable' }); }
    if (!env.SUPABASE_SERVICE_ROLE_KEY || typeof worker !== 'function' || typeof background !== 'function'
      || (env.SDP_PUSH_ACTIU === 'si' && String(env.SDP_CRON_SECRET || '').length < 32))
      return reply(503, { ok: false, error: 'unavailable' });
    const control = new AbortController();
    let abort;
    const interrupted = new Promise((_, reject) => {
      abort = () => reject(Error('timeout'));
      control.signal.addEventListener('abort', abort, { once: true });
    });
    const withinDeadline = (fn) => {
      if (control.signal.aborted) return Promise.reject(Error('timeout'));
      return Promise.race([Promise.resolve().then(fn), interrupted]);
    };
    const boundedRequest = (url, options) => {
      const pending=Promise.resolve().then(()=>request(url,options));
      pending.then(response=>{
        if(control.signal.aborted&&!response?.body?.locked){try{Promise.resolve(response?.body?.cancel?.()).catch(()=>{});}catch{/* best effort */}}
      },()=>{});
      return withinDeadline(()=>pending);
    };
    const timeout = setTimeout(() => control.abort(), Number.isFinite(timeoutMs) ? Math.max(10, Math.min(8000, timeoutMs)) : 8000);
    try {
      let body;
      try { body = await withinDeadline(() => boundedJson(req, 512, control.signal)); }
      catch { return reply(400, { ok: false, error: 'body' }); }
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1
        || typeof body.missatgeId !== 'string' || !UUID.test(body.missatgeId)) return reply(400, { ok: false, error: 'body' });
      const auth = await boundedRequest(base + '/auth/v1/user', {
        method: 'GET', redirect: 'error', credentials: 'omit', cache: 'no-store', signal: control.signal,
        headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: authorization }
      });
      if (auth.status === 401 || auth.status === 403) return reply(401, { ok: false, error: 'auth' });
      if (!auth.ok) return reply(503, { ok: false, error: 'unavailable' });
      const user = await withinDeadline(() => boundedJson(auth, 65536, control.signal));
      if (typeof user?.id !== 'string' || !UUID.test(user.id)) return reply(401, { ok: false, error: 'auth' });
      if (env.SDP_PUSH_ACTIU === 'si') {
        const claim = await boundedRequest(base + '/rest/v1/rpc/xat_push_desperta_v2', {
          method: 'POST', redirect: 'error', credentials: 'omit', cache: 'no-store', signal: control.signal,
          headers: { ...capcaleresDeServei(env.SUPABASE_SERVICE_ROLE_KEY), 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_missatge_id: body.missatgeId, p_usuari_esperat: user.id })
        });
        if (!claim.ok) return reply(503, { ok: false, error: 'unavailable' });
        const shouldWake = await withinDeadline(() => boundedJson(claim, 128, control.signal));
        if (typeof shouldWake !== 'boolean') return reply(503, { ok: false, error: 'unavailable' });
        if (shouldWake) {
          let begin;
          const task = new Promise(resolve=>{begin=resolve;}).then(registered => registered ? worker(new Request(base + '/functions/v1/notifica-xat', {
            method: 'POST', headers: { 'x-sdp-cron': env.SDP_CRON_SECRET }
          })) : undefined).catch(() => {});
          try { background(task); begin(true); }
          catch (error) { begin(false); throw error; }
        }
      }
      return reply(202, { ok: true });
    } catch { return reply(503, { ok: false, error: 'unavailable' }); }
    finally { clearTimeout(timeout); control.signal.removeEventListener('abort', abort); control.abort(); }
  };
}
