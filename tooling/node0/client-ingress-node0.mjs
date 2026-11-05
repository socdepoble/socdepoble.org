/** Identitat d'ingrés autenticada pel proxy local. No llig X-Forwarded-For,
 * CF-Connecting-IP ni cap cookie. No aplica ni consumeix cap quota.
 * El proxy ha de substituir els dos headers, mai conservar-los del client.
 * Exemple de prova (no desplegable): secret TEST_ONLY_NOT_A_DEPLOY_SECRET_00000000.
 * La configuració real del proxy i la verificació Cloudflare són externes. */
import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

const SECRET = /^[A-Za-z0-9_-]{32,128}$/;
const LOCAL_PROXY = new Set(['127.0.0.1','::1']);
const unavailable = () => Object.assign(new Error('node0_client_ingress_unavailable'), {code:'node0_client_ingress_unavailable',status:503});

function ipCanonica(value) {
  if (typeof value !== 'string' || value.length > 45 || /[\s,\r\n\0%]/.test(value) || value.includes('[') || value.includes(']')) return null;
  const family = isIP(value);
  if (family === 4) return value;
  if (family !== 6 || value.includes('.')) return null;
  let canonical;
  try { canonical = new URL(`http://[${value}]/`).hostname.slice(1,-1); } catch { return null; }
  if (canonical !== value || canonical.startsWith('::ffff:')) return null;
  return canonical;
}

/** Només un IncomingMessage amb rawHeaders únics pot acreditar el proxy.
 * proxySecret ha de ser un secret nou de servidor; no és el token Mastodon,
 * la cookie d'una persona ni cap clau privada ActivityPub. */
export function creaIdentificadorClientNodeZero({proxySecret} = {}) {
  if (typeof proxySecret !== 'string' || !SECRET.test(proxySecret)) throw new TypeError('node0_proxy_secret_required');
  const expected = Buffer.from(proxySecret,'ascii');
  return req => {
    if (!LOCAL_PROXY.has(req?.socket?.remoteAddress)) throw unavailable();
    const raw = req.rawHeaders;
    if (!Array.isArray(raw) || raw.length % 2 !== 0 || raw.length > 4000) throw unavailable();
    let auth, ip, authCount = 0, ipCount = 0;
    for (let i = 0; i < raw.length; i += 2) {
      const name = raw[i], value = raw[i+1];
      if (typeof name !== 'string' || typeof value !== 'string' || /[\r\n\0]/.test(name+value)) throw unavailable();
      if (name.toLowerCase() === 'x-sdp-proxy-auth') { auth = value; authCount++; }
      if (name.toLowerCase() === 'x-sdp-client-ip') { ip = value; ipCount++; }
    }
    if (authCount !== 1 || ipCount !== 1 || typeof auth !== 'string' || !SECRET.test(auth)) throw unavailable();
    const supplied = Buffer.from(auth,'ascii');
    if (supplied.length !== expected.length || !timingSafeEqual(supplied,expected)) throw unavailable();
    const client = ipCanonica(ip); if (client === null) throw unavailable();
    return client;
  };
}
