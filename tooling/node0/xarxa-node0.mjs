import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const blocked = new BlockList();
for (const [address, prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]]) blocked.addSubnet(address, prefix, 'ipv4');
export function esIpPublica(address) {
  if (isIP(address) === 4) return !blocked.check(address, 'ipv4');
  // Only global unicast IPv6. Reject mapped IPv4, local, multicast and documentation ranges.
  return isIP(address) === 6 && /^[23]/i.test(address) && !address.toLowerCase().startsWith('2001:db8:');
}

/** Fixed federation trust boundary for this bridge. DNS is pinned to the TLS socket. */
export async function peticioMastodont(url, { method = 'GET', headers = {}, body = null, timeoutMs = 10000, maxBytes = 1024 * 1024, resolver = lookup, signal } = {}) {
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'mastodont.cat' || (target.port && target.port !== '443') || target.username || target.password) throw new Error('node0_remote_origin_rejected');
  if (signal?.aborted) throw new Error('node0_remote_aborted');
  const start = Date.now(); let dnsTimer, dnsAbort;
  let addresses;
  try {
    const interrupted = new Promise((_, reject) => {
      dnsTimer = setTimeout(() => reject(new Error('node0_remote_timeout')), timeoutMs);
      dnsAbort = () => reject(new Error('node0_remote_aborted'));
      signal?.addEventListener('abort', dnsAbort, { once: true });
    });
    addresses = await Promise.race([interrupted, Promise.resolve().then(() => {
      if (signal?.aborted) throw new Error('node0_remote_aborted');
      return resolver(target.hostname, { all: true, verbatim: true });
    })]);
  } finally { clearTimeout(dnsTimer); signal?.removeEventListener('abort', dnsAbort); }
  if (signal?.aborted) throw new Error('node0_remote_aborted');
  if (!addresses.length || addresses.some(({ address }) => !esIpPublica(address))) throw new Error('node0_remote_address_rejected');
  const remainingMs = timeoutMs - (Date.now() - start);
  if (remainingMs <= 0) throw new Error('node0_remote_timeout');
  return new Promise((resolve, reject) => {
    let settled = false, request, incoming;
    const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); };
    const fail = (error) => {
      if (settled) return;
      settled = true; cleanup();
      incoming?.destroy(); request?.destroy();
      reject(error);
    };
    const onAbort = () => fail(new Error('node0_remote_aborted'));
    const timer = setTimeout(() => fail(new Error('node0_remote_timeout')), remainingMs);
    signal?.addEventListener('abort', onAbort, { once: true });
    if (signal?.aborted) { onAbort(); return; }
    try {
      request = https.request(target, { method, headers, agent: false, lookup: (_host, options, callback) => {
        const selected = addresses.find((a) => !options.family || a.family === options.family) || addresses[0];
        if (options.all) callback(null, [selected]); else callback(null, selected.address, selected.family);
      } }, (response) => {
        incoming = response;
        response.on('error', fail);
        if (settled) { response.destroy(); return; }
        const chunks = []; let size = 0;
        response.on('data', (chunk) => {
          if (settled) return;
          size += chunk.length;
          if (size > maxBytes) fail(new Error('node0_remote_response_limit')); else chunks.push(chunk);
        });
        response.on('aborted', () => fail(new Error('node0_remote_response_aborted')));
        response.on('close', () => { if (!response.complete) fail(new Error('node0_remote_response_incomplete')); });
        response.on('end', () => {
          if (settled) return;
          try {
            // Fetch forbids a body, including an empty Buffer, for these statuses.
            const bodyless = method.toUpperCase() === 'HEAD' || [204, 205, 304].includes(response.statusCode);
            const result = new Response(bodyless ? null : Buffer.concat(chunks), { status: response.statusCode, headers: response.headers });
            settled = true; cleanup(); resolve(result);
          } catch (error) { fail(error); }
        });
      });
      request.on('error', fail);
      request.on('upgrade', (_response, socket) => {
        socket.on('error', () => {}); socket.destroy();
        fail(new Error('node0_remote_upgrade_rejected'));
      });
      if (settled) request.destroy(); else request.end(body);
    } catch (error) { fail(error); }
  });
}
