import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import { EventEmitter } from 'node:events';
import { auditaBlindatge, parseArgs, requestGet, LIMITS } from './tractor-sentinella-blindatge.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-sentinella-seo-'));
  fs.mkdirSync(path.join(root, 'public'));
  fs.writeFileSync(path.join(root, 'public', 'index.html'), '<!doctype html><title>Prova</title>');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
const html = (body = '<main><h1>El poble</h1><a href="/xat">Entra al xat</a></main>') => '<!doctype html><title>Sóc de Poble</title><body>' + body + '</body>';
const transport = (body = html()) => async url => url.startsWith('http:') || new URL(url).hostname.startsWith('www.')
  ? { status: 301, headers: { location: 'https://' + new URL(url).hostname.replace(/^www\./, '') + '/' }, text: '', tls: url.startsWith('https:') ? { authorized: true, daysRemaining: 60 } : null }
  : { status: 200, headers: { 'content-type': 'text/html' }, text: body, tls: { authorized: true, daysRemaining: 60 } };
const audit = (t, request = transport(), options = {}) => auditaBlindatge({ root: fixture(t), remote: true, seo: true, ...options }, { now: () => 0, requestGet: request });
const canonicalRows = report => report.results.filter(row => row.id.startsWith('org-https-apex-') && row.kind === 'seo-html');

test('SEO és explícit, remot i només admet els dos dominis propis, sense credencials', async t => {
  assert.equal(parseArgs(['--remot', '--seo']).seo, true);
  assert.equal(parseArgs(['--remot', '--seo', '--domini=cat']).domain, 'cat');
  for (const args of [['--seo'], ['--domini=cat'], ['--remot', '--seo', '--domini=evil.test'], ['--remot', '--seo', '--config=public.json']]) assert.throws(() => parseArgs(args));
  await assert.rejects(audit(t, transport(), { config: { supabaseUrl: 'https://project.supabase.co', publishableKey: 'sb_publishable_TEST_ONLY_PUBLIC_FIXTURE_123456' } }));
});

test('SEO sondeja 4 variants × 3 perfils en 12 GET i compara cada triple sense seguir redirects', async t => {
  const calls = [];
  const report = await audit(t, async (url, options) => { calls.push({ url, options }); return transport()(url); });
  assert.equal(report.status, 'ok'); assert.equal(report.usage.requests, 12);
  assert.equal(new Set(calls.map(call => new URL(call.url).origin)).size, 4);
  assert.deepEqual(new Set(calls.map(call => call.options.profile)), new Set(['normal', 'googlebot', 'google']));
  assert.ok(calls.every(call => call.options.method === 'GET' && !Object.keys(call.options.headers).length && !call.options.backendOrigin));
  assert.equal(report.results.filter(row => row.kind === 'seo-comparison' && row.status === 'ok').length, 4);
  assert.ok(report.results.filter(row => row.code === 'CANONICAL_REDIRECT_OBSERVED').every(row => row.followed === false));
  assert.equal(report.budget.maxRequests, LIMITS.requestsPerCycle); assert.equal(report.budget.redirects, 0);
  assert.equal(report.coverage.cloakingAbsenceProven, false); assert.equal(report.notification.sent, false);
});

test('un perfil fallit deixa la comparació inconclusiva sense inventar cloaking', async t => {
  const report = await audit(t, async (url, options) => {
    if (url === 'https://socdepoble.org/' && options.profile === 'google') throw Object.assign(new Error('TIMEOUT'), { code: 'TIMEOUT' });
    return transport()(url);
  });
  assert.equal(report.status, 'unknown');
  assert.equal(report.results.find(row => row.id === 'org-https-apex' && row.kind === 'seo-comparison').code, 'STATIC_COMPARISON_INCONCLUSIVE');
});

test('les quatre variants revelen una cadena de dos salts: només HTTPS apex directe és vàlid', async t => {
  const calls = [];
  const report = await audit(t, async url => {
    calls.push(url);
    if (url === 'http://www.socdepoble.org/') return { status: 301, headers: { location: 'https://www.socdepoble.org/' }, text: '', tls: null };
    return transport()(url);
  });
  assert.equal(calls.length, 12, 'cada variant es consulta una vegada per perfil, sense seguir cap redirecció');
  assert.equal(report.status, 'fail');
  assert.ok(report.results.filter(row => row.id.startsWith('org-http-www-') && row.kind === 'seo-html').every(row => row.code === 'REDIRECT_TARGET_REJECTED'));
  assert.ok(report.results.filter(row => row.id.startsWith('org-https-www-') && row.kind === 'seo-html').every(row => row.code === 'CANONICAL_REDIRECT_OBSERVED' && row.redirectOrigin === 'https://socdepoble.org'));
  assert.equal(report.budget.redirects, 0);
});

test('segon domini usa només variants cat en la seua ronda', async t => {
  const calls = [];
  const report = await audit(t, async url => { calls.push(url); return transport()(url); }, { domain: 'cat' });
  assert.equal(report.status, 'ok'); assert.ok(calls.every(url => new URL(url).hostname.endsWith('socdepoble.cat')));
  assert.equal(report.coverage.seoDomain, 'socdepoble.cat');
});

test('una resposta diferent per Googlebot o Referer Google marca cloaking observat, ambdues direccions', async t => {
  for (const variant of ['googlebot', 'google']) {
    const report = await audit(t, async (url, options) => {
      const result = await transport()(url);
      if (url === 'https://socdepoble.org/' && options.profile === variant) result.text = html('<main>Casino <a href="https://spam.test/">Premi</a></main>');
      return result;
    });
    assert.equal(report.status, 'fail');
    assert.ok(report.results.some(row => row.code === 'CLOAKING_VARIANT_OBSERVED'));
    assert.equal(JSON.stringify(report).includes('spam.test'), false);
  }
});

test('comparació ignora nonce, scripts i espais, però detecta canvi de títol o href', async t => {
  const report = await audit(t, async (url, options) => {
    const result = await transport()(url);
    if (url === 'https://socdepoble.org/' && options.profile === 'googlebot') result.text = html('\n <main>  <h1>El poble</h1> <a href="/xat" nonce="random">Entra al xat</a></main><script>dynamic()</script>');
    return result;
  });
  assert.equal(report.status, 'ok');
  for (const transform of [value => value.replace('Sóc de Poble', 'Spam'), value => value.replace('href="/xat"', 'href="/spam"')]) {
    const changed = await audit(t, async (url, options) => {
      const result = await transport()(url);
      if (url === 'https://socdepoble.org/' && options.profile === 'googlebot') result.text = transform(result.text);
      return result;
    });
    assert.ok(changed.results.some(row => row.code === 'CLOAKING_VARIANT_OBSERVED'));
  }
});

test('detector CSS cobreix les sis tècniques inline, per classe i en un ancestre', async t => {
  for (const declaration of ['display:none', 'visibility:hidden', 'opacity:0', 'font-size:0', 'text-indent:-9999px', 'left:-9999px']) {
    for (const mode of ['inline', 'class', 'ancestor']) {
      const content = mode === 'inline' ? `<a href="/xat" style="${declaration}">Entra</a>`
        : mode === 'class' ? `<style>.amagat { ${declaration} }</style><a class="amagat" href="/xat">Entra</a>`
          : `<div style="${declaration}"><a href="/xat">Entra</a></div>`;
      const report = await audit(t, transport(html(content)));
      const rows = canonicalRows(report);
      assert.ok(rows.every(row => row.code === 'HIDDEN_LINK_CSS'), declaration + ' ' + mode);
      assert.ok(rows.every(row => row.findings.some(finding => finding.reasons.includes(declaration))), declaration + ' ' + mode);
    }
  }
});

test('CSS visibles i un display corregit per inline no generen falsa detecció', async t => {
  const report = await audit(t, transport(html('<style>.amagat { display:none }</style><a class="amagat" href="/xat" style="display:inline;opacity:1;font-size:16px;text-indent:0;left:0;visibility:visible">Entra</a>')));
  assert.equal(report.status, 'ok'); assert.ok(canonicalRows(report).every(row => !row.findings.length));
});

test('no executa scripts ni carrega stylesheets, iframes o imatges i deixa la closca SPA inconclusiva', async t => {
  const calls = [];
  const report = await audit(t, async url => {
    calls.push(url);
    return transport('<!doctype html><title>SPA</title><link rel="stylesheet" href="https://untrusted.invalid/private"><script>throw new Error("EXECUTED")</script><iframe src="https://untrusted.invalid/"></iframe><img src="https://untrusted.invalid/pixel"><body><div id="root"></div>')(url);
  });
  assert.equal(report.status, 'unknown'); assert.equal(calls.length, 12);
  assert.ok(canonicalRows(report).every(row => row.code === 'SPA_SHELL_ONLY' && row.externalStylesheets === 1));
  assert.ok(report.results.some(row => row.code === 'STATIC_COMPARISON_INCONCLUSIVE'));
});

/* v1.2.18 · Gauntlet R1 (L3-03) · La closca real (el cos d'index.html): #root
   buit i un <noscript> amb un enllaç mailto; l'adreça d'ací és genèrica.
   jsdom analitza el noscript com a DOM; l'enllaç no pot fer passar la closca
   per HTML observat. */
const MAILTO = 'mailto:contacte@poble.example';
const CLOSCA_REAL = '<!doctype html><html lang="ca"><head><meta charset="UTF-8"><title>Sóc de Poble</title></head><body class="sdp-root"><div id="root"></div>'
  + '<noscript><div class="sdp-noscript"><h1>Sóc de Poble</h1><p>Aquesta aplicació necessita JavaScript per a funcionar. Si el teu navegador no l\'executa, pots contactar amb nosaltres a '
  + `<a href="${MAILTO}">la bústia del poble</a>.</p></div></noscript><script type="module" src="/src/main.jsx"></script></body></html>`;

test('v1.2.18 · Gauntlet R1 (L3-03) · la closca SPA amb un enllaç dins del <noscript> continua inconclusiva', async t => {
  const shell = await audit(t, transport(CLOSCA_REAL));
  assert.equal(shell.status, 'unknown');
  assert.ok(canonicalRows(shell).every(row => row.status === 'unknown' && row.code === 'SPA_SHELL_ONLY' && row.links === 0));
  assert.equal(shell.results.find(row => row.id === 'org-https-apex' && row.kind === 'seo-comparison').code, 'STATIC_COMPARISON_INCONCLUSIVE');
  // Un enllaç fora del noscript sí que és HTML observat.
  const observat = await audit(t, transport(CLOSCA_REAL.replace('<div id="root"></div>', `<div id="root"><a href="${MAILTO}"></a></div>`)));
  assert.ok(canonicalRows(observat).every(row => row.code === 'STATIC_HTML_OBSERVED' && row.links === 1));
  // Els hrefs del noscript continuen dins de la projecció: un noscript diferent per a Googlebot és cloaking observat.
  const report = await audit(t, async (url, options) => {
    const result = await transport(CLOSCA_REAL)(url);
    if (url === 'https://socdepoble.org/' && options.profile === 'googlebot') result.text = CLOSCA_REAL.replace(MAILTO, 'https://spam.test/');
    return result;
  });
  assert.equal(report.status, 'fail');
  assert.equal(report.results.find(row => row.id === 'org-https-apex' && row.kind === 'seo-comparison').code, 'CLOAKING_VARIANT_OBSERVED');
  assert.equal(JSON.stringify(report).includes('spam.test'), false);
});

/* v1.2.18 · Gauntlet R2 (L2R2-01) · La mateixa closca servida amb 200 per http:
   les files fallen per INSECURE_HTTP_CONTENT, i la comparació no pot eixir
   STATIC_VARIANTS_MATCH perquè les tres siguen 'fail' i iguals. */
const http200 = text => async url => url.startsWith('http:')
  ? { status: 200, headers: { 'content-type': 'text/html' }, text, tls: null }
  : transport(text)(url);
const filesHttp = report => report.results.filter(row => row.id.startsWith('org-http-') && row.kind === 'seo-html');
const comparacio = (report, id) => report.results.find(row => row.id === id && row.kind === 'seo-comparison').code;

test('v1.2.18 · Gauntlet R2 (L2R2-01) · la closca SPA servida amb 200 per http falla i deixa la comparació inconclusiva', async t => {
  const shell = await audit(t, http200(CLOSCA_REAL));
  assert.equal(shell.status, 'fail');
  assert.equal(filesHttp(shell).length, 6);
  assert.ok(filesHttp(shell).every(row => row.status === 'fail' && row.code === 'INSECURE_HTTP_CONTENT' && row.spaShell === true && row.links === 0));
  for (const id of ['org-http-apex', 'org-http-www']) assert.equal(comparacio(shell, id), 'STATIC_COMPARISON_INCONCLUSIVE', id);
  assert.equal(comparacio(shell, 'org-https-apex'), 'STATIC_COMPARISON_INCONCLUSIVE');
  // HTML estàtic de veres per http continua sent comparable, i la fila no porta spaShell.
  const observat = await audit(t, http200(html()));
  assert.ok(filesHttp(observat).every(row => row.code === 'INSECURE_HTTP_CONTENT' && !Object.hasOwn(row, 'spaShell')));
  assert.equal(comparacio(observat, 'org-http-apex'), 'STATIC_VARIANTS_MATCH');
});

test('redirect privat, extern, amb credencial o cercle no s’emmagatzema ni se seguix', async t => {
  for (const location of ['https://127.0.0.1/private', 'https://evil.test/', 'https://name:PRIVATE_CANARY@socdepoble.org/', 'https://socdepoble.org/']) {
    const report = await audit(t, async () => ({ status: 302, headers: { location }, text: '', tls: { authorized: true } }));
    assert.equal(report.status, 'fail'); assert.ok(report.results.some(row => row.code === 'REDIRECT_TARGET_REJECTED'));
    assert.equal(JSON.stringify(report).includes('PRIVATE_CANARY'), false); assert.equal(report.usage.requests, 12);
  }
});

test('HTTP sense redirecció canònica és una regressió i HTTP mai afirma TLS', async t => {
  const report = await audit(t, async () => ({ status: 200, text: html(), headers: { 'content-type': 'text/html' }, tls: null }));
  assert.ok(report.results.some(row => row.code === 'INSECURE_HTTP_CONTENT'));
  assert.ok(report.results.some(row => row.code === 'TLS_NOT_VERIFIED'));
});

test('HTML, quantitat de nodes i profunditat excessius queden bounded i inconclusius', async t => {
  for (const body of ['x'.repeat(LIMITS.htmlBytes + 1), html('<i></i>'.repeat(2050)), html('<div>'.repeat(33) + '<a href="/">Entra</a>' + '</div>'.repeat(33))]) {
    const report = await audit(t, transport(body));
    assert.equal(report.status, 'unknown'); assert.ok(canonicalRows(report).every(row => ['BYTE_LIMIT', 'LOCAL_LIMIT'].includes(row.code)));
  }
});

test('SEO conserva cancel·lació i pressupost acumulat; transport que ignora abort no bloqueja', async t => {
  const report = await auditaBlindatge({ root: fixture(t), remote: true, seo: true }, {
    now: () => 0, requestGet: () => new Promise(() => {}), setTimer: fn => { queueMicrotask(fn); return 1; }, clearTimer: () => {},
  });
  assert.equal(report.status, 'unknown'); assert.equal(report.usage.requests, 2); assert.equal(report.results.length, 16);
  assert.ok(report.results.filter(row => row.kind === 'seo-html').every(row => row.status === 'unknown'));
});

function mockHttp( { text = '', status = 200, headers = {} } = {}) {
  const calls = [];
  const deps = { resolverFactory: () => ({ resolve4: async () => ['1.1.1.1'], resolve6: async () => [], cancel: () => {} }), requestImpl: (url, options, callback) => {
    const req = new EventEmitter(); req.destroy = () => {}; req.end = () => queueMicrotask(() => {
      const incoming = new PassThrough(); incoming.statusCode = status; incoming.headers = headers; incoming.complete = true;
      incoming.socket = {};
      calls.push({ url: url.href, options }); callback(incoming); incoming.end(text);
    });
    return req;
  } };
  return { calls, deps };
}

test('transport envia perfils exactes a HTTP propi, amb DNS pinning i sense cookies ni claus', async () => {
  for (const profile of ['normal', 'googlebot', 'google']) {
    const { calls, deps } = mockHttp();
    const result = await requestGet('http://www.socdepoble.org/', { kind: 'seo-html', profile }, deps);
    assert.equal(result.tls, null); assert.equal(calls.length, 1);
    const headers = calls[0].options.headers;
    assert.equal(headers['User-Agent'], profile === 'googlebot' ? 'Googlebot/2.1' : 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    assert.equal(headers.Referer, profile === 'google' ? 'https://www.google.com/' : undefined);
    assert.equal(headers.apikey, undefined); assert.equal(headers.Cookie, undefined);
    calls[0].options.lookup('www.socdepoble.org', { family: 4 }, (error, address) => { assert.ifError(error); assert.equal(address, '1.1.1.1'); });
  }
});

test('excepció HTTP és només SEO / propi; no amplia el transport antic ni admet headers arbitraris', async () => {
  const deps = { resolverFactory: () => assert.fail('no DNS') };
  for (const url of ['http://evil.test/', 'http://socdepoble.org/private', 'http://socdepoble.org/?key=private', 'https://www.socdepoble.org/private', 'http://user:pass@socdepoble.org/']) {
    await assert.rejects(requestGet(url, { kind: 'seo-html', profile: 'normal' }, deps), { code: 'ORIGIN_REJECTED' });
  }
  for (const options of [{}, { kind: 'seo-html', profile: 'other' }, { kind: 'seo-html', profile: 'normal', headers: { Referer: 'https://evil.test/' } }, { kind: 'seo-html', profile: 'normal', backendOrigin: 'https://project.supabase.co' }]) {
    await assert.rejects(requestGet('http://socdepoble.org/', options, deps));
  }
});

test('transport HTTP SEO imposa bytes, encoding, redirects no seguits i deadline', async () => {
  const large = mockHttp( { text: 'x'.repeat(128) });
  await assert.rejects(requestGet('http://socdepoble.org/', { kind: 'seo-html', profile: 'normal', maxBytes: 64 }, large.deps), { code: 'BYTE_LIMIT' });
  const encoded = mockHttp( { headers: { 'content-encoding': 'gzip' } });
  await assert.rejects(requestGet('http://socdepoble.org/', { kind: 'seo-html', profile: 'normal' }, encoded.deps), { code: 'ENCODING_REJECTED' });
  const redirect = mockHttp( { status: 301, headers: { location: 'https://127.0.0.1/' } });
  const observed = await requestGet('http://socdepoble.org/', { kind: 'seo-html', profile: 'normal' }, redirect.deps);
  assert.equal(observed.status, 301); assert.equal(redirect.calls.length, 1);
  const stalled = mockHttp(); stalled.deps.requestImpl = () => { const req = new EventEmitter(); req.end = () => {}; req.destroy = () => {}; return req; };
  await assert.rejects(requestGet('http://socdepoble.org/', { kind: 'seo-html', profile: 'normal', timeoutMs: 10 }, stalled.deps), { code: 'TIMEOUT' });
});
