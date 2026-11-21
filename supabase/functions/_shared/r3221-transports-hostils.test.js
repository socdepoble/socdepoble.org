// @vitest-environment node
// R32.21: local hostile peers and injected transports; no external network or real credentials.
import { createServer } from 'node:http';
import { describe, expect, test } from 'vitest';
import { APPLE, postApple } from './apple.js';
import { creaGestor } from '../purga-fitxers/gestor.js';

const cron = 'cron-sintetic-'.repeat(4);
const serviceKey = 'sb_secret_sintetica_r3221';
const silent = { info() {}, error() {} };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const expired = Symbol('deadline missed');
async function within(promise) {
  let timer;
  try { return await Promise.race([promise, new Promise(resolve => { timer = setTimeout(() => resolve(expired), 150); })]); }
  finally { clearTimeout(timer); }
}
const request = () => new Request('https://worker.example.test', { method: 'POST', headers: { 'x-sdp-cron': cron } });
const worker = (fetch, base = 'https://projecte.example.test') => creaGestor({
  env: { SUPABASE_URL: base, SUPABASE_SERVICE_ROLE_KEY: serviceKey, SDP_CRON_SECRET: cron },
  fetch, registre: silent, opcions: { TOPALL_MS: 10 }
});
async function listen(handler) {
  const server = createServer(handler);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

describe('R32.21 · purga privileged transport boundary', () => {
  function largeJson(prefix, suffix, status = 200) {
    const state = { cancelled: 0, pulls: 0 };
    const body = new ReadableStream({
      pull(controller) {
        state.pulls++;
        if (state.pulls === 1) controller.enqueue(new TextEncoder().encode(prefix + ' '.repeat(1048576)));
        else { controller.enqueue(new TextEncoder().encode(suffix)); controller.close(); }
      }, cancel() { state.cancelled++; }
    }, { highWaterMark: 0 });
    return { state, response: new Response(body, { status }) };
  }

  test('an oversized native RPC stream fails closed before reading the rest or deleting anything', async () => {
    const large = largeJson('[', ']'); let deletes = 0;
    const response = await worker(async url => {
      if (url.includes('/storage/')) deletes++;
      return large.response;
    })(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ ok: false, error: 'base', fets: 0 });
    expect(deletes).toBe(0);
    expect(large.state).toEqual({ cancelled: 1, pulls: 1 });
  });

  test('an oversized legacy Storage 400 cannot become a successful 404 ACK', async () => {
    const large = largeJson('{"statusCode":"404","padding":"', '"}', 400);
    let claims = 0, acknowledgments = 0, failures = 0;
    const response = await worker(async url => {
      if (url.endsWith('purga_fitxers_reclama')) return Response.json(++claims === 1 ? [{ id: 1, bucket_id: 'mitjans', nom: 'synthetic.webp' }] : []);
      if (url.includes('/storage/')) return large.response;
      if (url.endsWith('purga_fitxers_fets')) acknowledgments++;
      if (url.endsWith('purga_fitxers_fallits')) failures++;
      return Response.json(1);
    })(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, fets: 0, fallits: 1 });
    expect(acknowledgments).toBe(0); expect(failures).toBe(1);
    expect(large.state).toEqual({ cancelled: 1, pulls: 1 });
  });

  test('empty RPC chunks have a finite fragment budget', async () => {
    let cancelled = 0, pulls = 0;
    const body = new ReadableStream({ pull(controller) {
      if (++pulls <= 8193) controller.enqueue(new Uint8Array());
      else { controller.enqueue(new TextEncoder().encode('[]')); controller.close(); }
    }, cancel() { cancelled++; } }, { highWaterMark: 0 });
    const response = await worker(async () => new Response(body))(request());
    expect(response.status).toBe(502); expect(cancelled).toBe(1); expect(pulls).toBeLessThan(8194);
  });

  test.each(['not-json', '{}', 'null', '0', '"synthetic-private-provider-body"'])('a 2xx malformed/non-array claim (%s) is a generic failure', async text => {
    const response = await worker(async () => new Response(text))(request());
    expect(response.status).toBe(502);
    const json = await response.json(); expect(json).toMatchObject({ ok: false, error: 'base', fets: 0 });
    expect(JSON.stringify(json)).not.toContain('synthetic-private-provider-body');
  });

  test('a malformed 2xx commit receipt is never reported as a successful worker pass', async () => {
    let claims = 0;
    const response = await worker(async url => {
      if (url.endsWith('purga_fitxers_reclama')) return Response.json(++claims === 1 ? [{ id: 1, bucket_id: 'mitjans', nom: 'synthetic.webp' }] : []);
      if (url.includes('/storage/')) return new Response(null, { status: 204 });
      return new Response('not-json');
    })(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ ok: false, error: 'base', fets: 0 });
  });

  test('the byte budget accommodates 200 maximum-length Unicode object names and normal receipts', async () => {
    let claims = 0, deleted = 0;
    const rows = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, bucket_id: 'mitjans', nom: '漢'.repeat(1024) }));
    const response = await worker(async (url, options) => {
      if (url.endsWith('purga_fitxers_reclama')) return Response.json(++claims === 1 ? rows : []);
      if (url.includes('/storage/')) { deleted += JSON.parse(options.body).prefixes.length; return new Response(null, { status: 204 }); }
      return Response.json(JSON.parse(options.body).p_ids.length);
    })(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, fets: 200, fallits: 0 }); expect(deleted).toBe(200);
  });

  test('a native 307 cannot forward the service apikey to another origin', async () => {
    let leaked = false, targetCalls = 0;
    const target = await listen((req, res) => { targetCalls++; leaked ||= req.headers.apikey === serviceKey; req.resume(); res.end('[]'); });
    const source = await listen((req, res) => { req.resume(); res.writeHead(307, { Location: target.base }); res.end(); });
    try {
      // Give native fetch ample wall time; this oracle checks redirect policy, not timing.
      const handler = creaGestor({ env: { SUPABASE_URL: source.base, SUPABASE_SERVICE_ROLE_KEY: serviceKey, SDP_CRON_SECRET: cron },
        fetch: globalThis.fetch, registre: silent, opcions: { TOPALL_MS: 1000 } });
      const response = await handler(request());
      expect(leaked).toBe(false);
      expect(targetCalls).toBe(0);
      expect(response.status).toBe(502);
    } finally { await close(source.server); await close(target.server); }
  });

  test('the deadline wins when fetch ignores abort and cancels a late response body', async () => {
    const late = deferred(); let cancelled = 0, stream;
    const pending = worker(() => late.promise)(request());
    const response = await within(pending);
    late.resolve(new Response(new ReadableStream({ start(c) { stream = c; c.enqueue(new TextEncoder().encode('[]')); }, cancel() { cancelled++; } })));
    if (response === expired) stream.close();
    // Settle the baseline loser too; never leave a fixture or rejection running after a failed assertion.
    await pending; await new Promise(resolve => setImmediate(resolve));
    expect(response).not.toBe(expired);
    expect(response.status).toBe(502);
    expect(cancelled).toBe(1);
  });
});

describe('R32.21 · Apple bounded response and hard deadline', () => {
  test('stops an oversized stream before accumulating its remaining response', async () => {
    let cancelled = 0, pulls = 0;
    const response = new Response(new ReadableStream({
      pull(controller) { pulls++; controller.enqueue(new Uint8Array(65537).fill(32)); if (pulls === 3) controller.close(); },
      cancel() { cancelled++; }
    }));
    const result = await postApple(APPLE.TOKEN, new URLSearchParams(), { fetch: async () => response });
    expect(result).toEqual({ estat: 0, cos: null, fallada: 'xarxa' });
    expect(cancelled).toBe(1);
    expect(pulls).toBeLessThan(3);
  });

  test('empty chunks count toward a finite fragment limit', async () => {
    let cancelled = 0, pulls = 0;
    const response = new Response(new ReadableStream({
      pull(controller) { pulls++; controller.enqueue(new Uint8Array()); if (pulls === 4100) controller.close(); },
      cancel() { cancelled++; }
    }));
    expect(await postApple(APPLE.TOKEN, new URLSearchParams(), { fetch: async () => response }))
      .toEqual({ estat: 0, cos: null, fallada: 'xarxa' });
    expect(cancelled).toBe(1);
    expect(pulls).toBeLessThan(4100);
  });

  test('an uncooperative fetch cannot outlive the deadline; its late body is discarded', async () => {
    const late = deferred(); let cancelled = 0, stream;
    const pending = postApple(APPLE.TOKEN, new URLSearchParams(), { fetch: () => late.promise, topallMs: 10 });
    const result = await within(pending);
    late.resolve(new Response(new ReadableStream({ start(c) { stream = c; c.enqueue(new TextEncoder().encode('{}')); }, cancel() { cancelled++; } })));
    // The original implementation waits for this body's EOF; close its fixture without requiring abort cooperation.
    if (result === expired) stream.close();
    await pending;
    await new Promise(resolve => setImmediate(resolve));
    expect(result).toEqual({ estat: 0, cos: null, fallada: 'temps' });
    expect(cancelled).toBe(1);
  });

  test('a response reader that ignores abort is also bounded and cancelled', async () => {
    let cancelled = 0, stream;
    const response = new Response(new ReadableStream({ start(c) { stream = c; }, cancel() { cancelled++; } }));
    const pending = postApple(APPLE.TOKEN, new URLSearchParams(), { fetch: async () => response, topallMs: 10 });
    const result = await within(pending);
    if (result === expired) stream.close();
    await pending;
    expect(result).toEqual({ estat: 0, cos: null, fallada: 'temps' });
    expect(cancelled).toBe(1);
  });

  test('small split UTF-8 JSON and an empty successful revoke keep their contract', async () => {
    const bytes = new TextEncoder().encode('{"scope":"població"}');
    const response = new Response(new ReadableStream({ start(controller) {
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close();
    } }));
    expect(await postApple(APPLE.TOKEN, new URLSearchParams(), { fetch: async () => response }))
      .toEqual({ estat: 200, cos: { scope: 'població' }, fallada: null });
    expect(await postApple(APPLE.REVOCA, new URLSearchParams(), { fetch: async () => new Response(null, { status: 200 }) }))
      .toEqual({ estat: 200, cos: null, fallada: null });
  });
});
