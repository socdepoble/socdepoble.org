/* R32.19: server-only DNS/TLS boundary. node:https is supported by Deno's
   Node compatibility layer; the Edge deployment must still certify its runtime.
   A fresh socket dials exactly the granted public IP; the URL hostname remains
   the Host, SNI and certificate identity. No native fetch/DNS/redirect fallback. */
import https from 'node:https';
import { isIP } from 'node:net';
import { Buffer } from 'node:buffer';
import { urlRemota } from '../../../src/data/federacio/urlRemota.js';
import { esIpNoPublica } from '../noticies/gestor.js';

const errorDe = (codi) => Object.assign(new Error(codi), { codi });

export function creaFetchPinnat({ request = https.request, topallMs = 10_000, maximBytes = 1024 * 1024 } = {}) {
  if (typeof request !== 'function' || !Number.isSafeInteger(topallMs) || topallMs < 1 || topallMs > 10_000
      || !Number.isSafeInteger(maximBytes) || maximBytes < 1 || maximBytes > 1024 * 1024) throw errorDe('pin_configuracio');
  return async function fetchPinnat(url, init = {}, resolucio) {
    const target = urlRemota(url);
    if (!target || target.protocol !== 'https:' || (target.port && target.port !== '443')
        || !['manual', 'error'].includes(init.redirect) || resolucio?.estat !== 'publica'
        || resolucio.host !== target.hostname || !Object.isFrozen(resolucio) || !Object.isFrozen(resolucio.adreces)
        || !Array.isArray(resolucio.adreces) || !resolucio.adreces.length || resolucio.adreces.length > 256
        || resolucio.adreces.some(ip => !isIP(ip) || esIpNoPublica(ip))) throw errorDe('dns_concessio_invalida');
    // Copy scalar addresses before dispatch: no deferred lookup of mutable DNS.
    const address = resolucio.adreces[0], family = isIP(address);
    const method = String(init.method ?? 'GET').toUpperCase();
    if (!['GET', 'POST'].includes(method) || (init.body != null && typeof init.body !== 'string')) throw errorDe('pin_peticio_invalida');
    const headers = new Headers(init.headers);
    if (headers.has('host') && headers.get('host') !== target.host) throw errorDe('pin_host_invalida');
    if (headers.has('transfer-encoding') || headers.has('connection') || headers.has('upgrade')) throw errorDe('pin_peticio_invalida');
    const body = init.body == null ? null : Buffer.from(init.body, 'utf8');
    if ((body?.length ?? 0) > 64 * 1024 || (method === 'GET' && body !== null)) throw errorDe('pin_peticio_invalida');
    if (headers.has('content-length') && headers.get('content-length') !== String(body?.length ?? 0)) throw errorDe('pin_peticio_invalida');
    if (body !== null) headers.set('content-length', String(body.length));
    headers.set('host', target.host);
    if (init.signal?.aborted) throw errorDe('temps');
    return new Promise((resolve, reject) => {
      let settled = false, outgoing, incoming;
      // An explicit empty proxyEnv overrides process/global proxy settings.
      // Pin hostname as an IP as well: no DNS lookup is needed to dial it.
      const agent = new https.Agent({ keepAlive: false, maxCachedSessions: 0, proxyEnv: {} });
      const cleanup = () => { clearTimeout(timer); init.signal?.removeEventListener('abort', onAbort); agent.destroy(); };
      const fail = (error) => {
        if (settled) return;
        settled = true; cleanup(); incoming?.destroy(); outgoing?.destroy(); reject(error);
      };
      const onAbort = () => fail(errorDe('temps'));
      const timer = setTimeout(onAbort, topallMs);
      init.signal?.addEventListener('abort', onAbort, { once: true });
      if (init.signal?.aborted) { onAbort(); return; }
      try {
        outgoing = request(target, {
          method, headers: Object.fromEntries(headers), agent, rejectUnauthorized: true,
          hostname: address, family, autoSelectFamily: false, servername: target.hostname, maxHeaderSize: 16 * 1024,
          lookup: (host, options, callback) => {
            if (host !== target.hostname && host !== address) { callback(errorDe('pin_host_invalida')); return; }
            if (options.all) callback(null, [{ address, family }]); else callback(null, address, family);
          }
        }, response => {
          incoming = response;
          response.on('error', fail);
          if (settled) { response.destroy(); return; }
          const status = response.statusCode;
          if (!Number.isInteger(status) || status < 200 || status > 599) { fail(errorDe('pin_estat_invalid')); return; }
          if (status >= 300 && status < 400) { fail(errorDe('redireccio')); return; }
          const length = response.headers['content-length'];
          if (length !== undefined && (!/^\d{1,10}$/.test(String(length)) || Number(length) > maximBytes)) { fail(errorDe('pin_resposta_limit')); return; }
          const chunks = []; let size = 0;
          response.on('data', chunk => {
            if (settled) return;
            size += chunk.length;
            if (size > maximBytes) fail(errorDe('pin_resposta_limit')); else chunks.push(chunk);
          });
          response.on('aborted', () => fail(errorDe('pin_resposta_incompleta')));
          response.on('close', () => { if (!response.complete) fail(errorDe('pin_resposta_incompleta')); });
          response.on('end', () => {
            if (settled) return;
            if (!response.complete) { fail(errorDe('pin_resposta_incompleta')); return; }
            try {
              const responseHeaders = new Headers();
              for (const [name, value] of Object.entries(response.headers)) {
                if (Array.isArray(value)) value.forEach(v => responseHeaders.append(name, v));
                else if (value !== undefined) responseHeaders.set(name, String(value));
              }
              const result = new Response([204, 205].includes(status) ? null : Buffer.concat(chunks), { status, headers: responseHeaders });
              settled = true; cleanup(); resolve(result);
            } catch (error) { fail(error); }
          });
        });
        outgoing.on('error', fail);
        outgoing.on('upgrade', (_response, socket) => { socket.on('error', () => {}); socket.destroy(); fail(errorDe('pin_upgrade_vetat')); });
        if (settled) outgoing.destroy(); else outgoing.end(body);
      } catch (error) { fail(error); }
    });
  };
}
