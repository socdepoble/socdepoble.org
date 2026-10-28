import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { prepareShell } from './prepare-social-shell.mjs';
import { createSocialHandler, renderSocialHead, routeKey, selectMetadata, socialAgent } from './social-edge.mjs';
import { ATRIBUT_SSR, CAP_SOCIAL_BASE } from '../../src/config/imatgeSocial.js';
import { clauSocialDeRuta } from '../../src/config/rutaSocial.js';

const origin = 'https://socdepoble.org';
const wiki = '/wikidepoble?item=03_llibre_d_or_memoria_episodica';
const raw = '<!doctype html><html><head><title>Base</title><meta property="og:title" content="Base"><meta property="og:image" content="/old.png"><meta property="og:image:width" content="256"><meta name="twitter:title" content="Base"><meta property="og:title" content="Duplicat"><meta http-equiv="Content-Security-Policy" content="script-src \'self\'"></head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>';
const entry = (key, title) => ({ title, description: 'Història i decisions contrastades de Sóc de Poble.',
  canonical: origin + key, index: true, type: 'article',
  image: { url: origin + '/assets/book.jpg', alt: 'Memòria de Sóc de Poble' } });
const manifest = { schema: 'sdp.social-manifest.v1', origin,
  routes: { [wiki]: entry(wiki, "El Llibre d'Or"), '/projecte': entry('/projecte', 'El projecte') },
  aliases: { '/page/projecte': '/projecte' } };
const shell = prepareShell(raw, JSDOM);
function handler({ data = manifest, source = raw, status = 200, contentType = 'text/html', extraHeaders = {}, inspect = () => {} } = {}) {
  return createSocialHandler({ manifest: data, shell, fetchOrigin: async req => {
    inspect(req);
    return new Response(status === 304 ? null : source, { status, headers: {
      'Content-Type': contentType, 'Content-Security-Policy': "script-src 'self'",
      ETag: 'old', 'Last-Modified': 'Tue, 27 Oct 2026 00:00:00 GMT', ...extraHeaders
    } });
  } });
}
const get = (path = wiki, options = {}) => new Request(origin + path, options);

test('head sense JS: un únic OG específic, canonical amb item i cos SPA intacte', async () => {
  const response = await handler()(get());
  const dom = new JSDOM(await response.text());
  const d = dom.window.document;
  for (const s of ['title', 'meta[property="og:title"]', 'meta[property="og:image"]', 'link[rel="canonical"]']) assert.equal(d.querySelectorAll(s).length, 1, s);
  assert.equal(d.title, "El Llibre d'Or | Sóc de Poble");
  assert.equal(d.querySelector('link[rel="canonical"]').href, origin + wiki);
  assert.equal(d.querySelector('meta[property="og:image:width"]'), null);
  assert.ok(d.querySelector('#root')); assert.equal(d.querySelector('script').getAttribute('src'), '/assets/app.js');
  assert.equal(response.headers.get('Content-Security-Policy'), "script-src 'self'");
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('ETag'), null); assert.equal(response.headers.get('Last-Modified'), null);
  dom.window.close();
});
test('quotes, entitats i tancaments de title no executen ni creen nodes', async () => {
  const malicious = structuredClone(manifest);
  malicious.routes[wiki].title = '"><script src=https://evil.invalid/x></script></title>';
  malicious.routes[wiki].description = 'A & B " < >';
  const d = new JSDOM(await (await handler({ data: malicious })(get())).text()).window.document;
  assert.equal(d.querySelectorAll('script').length, 1);
  assert.equal(d.querySelector('meta[property="og:description"]').content, 'A & B " < >');
  assert.equal(d.title, malicious.routes[wiki].title + ' | Sóc de Poble');
});
test('UTM no canvia l’objecte; items distints sí; els àlies conserven canonical', () => {
  assert.equal(routeKey(origin + wiki + '&utm_source=whatsapp'), wiki);
  assert.notEqual(routeKey(origin + wiki), routeKey(origin + '/wikidepoble?item=altre'));
  assert.equal(selectMetadata(manifest, origin + '/page/projecte').canonical, origin + '/projecte');
});
test('duplicates, desconeguts, notes i claus de prototip no exporten dades', async () => {
  for (const path of [wiki + '&item=altre', '/wikidepoble?item=privat', '/wikidepoble?item=../secrets',
    '/notes?item=privat', '/notes/secret', '/__proto__', '/constructor']) {
    const response = await handler()(get(path, { headers: { 'User-Agent': 'WhatsApp/2', Cookie: 'session=secret' } }));
    const html = await response.text();
    assert.equal(response.headers.get('X-SDP-Social'), 'generic', path);
    assert.ok(html.includes('noindex, nofollow')); assert.ok(!html.includes('rel="canonical"'));
    assert.ok(!html.includes("El Llibre d&#39;Or"));
  }
});
test('autoritat pública explícita: index false, canonical estranger i imatges signades es rebutgen', () => {
  for (const mutate of [e => { e.index = false; }, e => { e.canonical = 'https://evil.invalid/'; },
    e => { e.image.url = 'https://storage.invalid/private.jpg?token=secret'; }, e => { e.image.url = '/assets/a.svg'; },
    e => { e.image.url = '/assets/a.png?token=SECRET'; }, e => { e.image.url = '/assets/a.png#x'; }]) {
    const data = structuredClone(manifest); mutate(data.routes[wiki]);
    assert.equal(selectMetadata(data, origin + wiki), null);
  }
});
test('mateixes metadades per persones i crawlers, sense cookies al subfetch', async () => {
  let baseline;
  for (const ua of ['Mozilla/5.0', 'WhatsApp/2.0', 'TelegramBot', 'Twitterbot', 'facebookexternalhit']) {
    const response = await handler({ inspect: req => assert.equal(req.headers.get('Cookie'), null) })(get(wiki, { headers: { 'User-Agent': ua, Cookie: 'private=secret' } }));
    const html = await response.text(); baseline ??= html; assert.equal(html, baseline);
  }
  assert.equal(socialAgent('WhatsApp/2'), true); assert.equal(socialAgent('Mozilla/5.0'), false);
});
test('GET i HEAD mateix estat/capçalera; condicionals i Range no arriben al shell', async () => {
  const h = handler({ inspect: req => {
    assert.equal(req.method, 'GET');
    for (const name of ['If-None-Match', 'Range', 'Authorization']) assert.equal(req.headers.get(name), null);
  } });
  const response = await h(get(wiki, { method: 'HEAD', headers: { 'If-None-Match': 'old', Range: 'bytes=0-4', Authorization: 'Bearer secret' } }));
  assert.equal(response.status, 200); assert.equal(await response.text(), '');
  assert.deepEqual([...response.headers], [...(await h(get())).headers]);
});
test('no reescriu no-HTML, 206, 302, 304, 404 ni 500', async () => {
  for (const status of [206, 302, 304, 404, 500]) {
    const response = await handler({ status })(get()); assert.equal(response.status, status); assert.equal(response.headers.get('X-SDP-Social'), null);
  }
  const response = await handler({ contentType: 'application/json' })(get());
  assert.equal(response.headers.get('X-SDP-Social'), null);
});
test('assets, auth i POST passen al seu camí sense transformació', async () => {
  for (const request of [get('/assets/photo.jpg'), get('/fonts/font.woff2'), get('/auth/callback'), get(wiki, { method: 'POST', body: 'data' })]) {
    const response = await handler({ inspect: req => assert.equal(req.method, request.method) })(request);
    assert.equal(response.headers.get('X-SDP-Social'), null);
  }
});
test('canvi de publicitat no reutilitza la vista anterior', async () => {
  assert.equal((await handler()(get())).headers.get('X-SDP-Social'), 'public');
  const data = structuredClone(manifest); data.routes[wiki].index = false;
  assert.equal((await handler({ data })(get())).headers.get('X-SDP-Social'), 'generic');
});
test('release de shell distinta i Set-Cookie no es reescriuen', async () => {
  const different = await handler({ source: raw + '<!-- nou build -->' })(get());
  assert.equal(different.headers.get('X-SDP-Social'), 'build-mismatch');
  assert.ok((await different.text()).includes('nou build'));
  const personalized = await handler({ extraHeaders: { 'Set-Cookie': 'id=1' } })(get());
  assert.equal(personalized.headers.get('X-SDP-Social'), null);
});
test('cap directiva CDN antiga anul·la no-store', async () => {
  const extraHeaders = { 'Cloudflare-CDN-Cache-Control': 'public,max-age=86400',
    'CDN-Cache-Control': 'public,max-age=86400', 'Surrogate-Control': 'max-age=86400',
    Expires: 'Tue, 27 Oct 2030 00:00:00 GMT', Age: '86400' };
  for (const source of [raw, raw + 'changed']) {
    const response = await handler({ source, extraHeaders })(get());
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    for (const name of Object.keys(extraHeaders)) assert.equal(response.headers.get(name), null);
  }
});
/* Pla 261028_1526 (P1-61, Fase 2) · El shell real (index.html del repositori):
   un sol forat i, de les og:, només les del lloc, una vegada i sense marca. */
test('el shell real també elimina tots els duplicats i conserva les del lloc', () => {
  const root = process.env.SDP_TEST_ROOT || process.env.SDP_PROJECT_ROOT || process.cwd();
  const html = fs.readFileSync(root + '/index.html', 'utf8');
  const prepared = prepareShell(html, JSDOM);
  assert.equal(prepared.template.split('<!--SDP_SOCIAL_HEAD-->').length, 2);
  const d = new JSDOM(prepared.template).window.document;
  assert.deepEqual([...d.querySelectorAll('meta[property^="og:"]')].map(n => n.getAttribute('property')), ['og:site_name', 'og:locale']);
  for (const s of ['title', 'meta[name="description"]', 'meta[name^="twitter:"]', 'link[rel="canonical"]']) assert.equal(d.querySelectorAll(s).length, 0, s);
  assert.equal(d.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').length, 1);
  assert.equal(d.querySelectorAll('script[type="application/ld+json"]').length, 1);
});

/* Pla 261028_1526 (P1-61, Fase 2) · renderSocialHead, l'únic renderitzador
   (estàtic i edge): el <title> i cada node de la ruta porten ATRIBUT_SSR, el
   contracte de src/hooks/seoHead.js; og:site_name i og:locale no es repetixen. */
const nodesDelHead = html => new JSDOM(`<!doctype html><html><head>${html}</head><body></body></html>`).window.document.head.children;
test('cada node renderitzat porta data-sdp-ssr, sense og:site_name ni og:locale', () => {
  const metadata = { ...entry(wiki, "El Llibre d'Or"), image: { ...entry(wiki, '').image, type: 'image/png', width: 1200, height: 630 } };
  const nodes = [...nodesDelHead(renderSocialHead(metadata, origin))];
  assert.equal(nodes.length, 17);
  for (const node of nodes) assert.ok(node.hasAttribute(ATRIBUT_SSR), node.outerHTML);
  assert.equal(nodes.filter(n => /^og:(site_name|locale)$/.test(n.getAttribute('property') || '')).length, 0);
  assert.equal(nodes.filter(n => n.getAttribute('name') === 'robots').length, 0);
  const prop = name => nodes.find(n => n.getAttribute('property') === name)?.getAttribute('content');
  assert.equal(prop('og:url'), origin + wiki);
  assert.deepEqual([prop('og:image:type'), prop('og:image:width'), prop('og:image:height')], ['image/png', '1200', '630']);
  assert.equal(nodes.find(n => n.tagName === 'LINK').getAttribute('href'), origin + wiki);
});
test('canonical:false omet og:url i canonical; marca:null no marca res; sense metadades, el genèric de CAP_SOCIAL_BASE amb noindex', () => {
  const sense = [...nodesDelHead(renderSocialHead(entry('/wikidepoble', 'Wiki de Poble'), origin, { canonical: false }))];
  assert.equal(sense.filter(n => n.tagName === 'LINK' || n.getAttribute('property') === 'og:url').length, 0);
  assert.ok(sense.every(n => n.hasAttribute(ATRIBUT_SSR)));
  const net = [...nodesDelHead(renderSocialHead(entry('/projecte', 'El projecte'), origin, { marca: null }))];
  assert.ok(net.every(n => !n.hasAttribute(ATRIBUT_SSR)));
  const generic = [...nodesDelHead(renderSocialHead(null, origin))];
  const valor = name => generic.find(n => n.getAttribute('property') === name || n.getAttribute('name') === name)?.getAttribute('content');
  assert.equal(generic.find(n => n.tagName === 'TITLE').textContent, CAP_SOCIAL_BASE.title);
  assert.equal(valor('description'), CAP_SOCIAL_BASE.description);
  assert.equal(valor('og:image'), new URL(CAP_SOCIAL_BASE.image.url, origin).href);
  assert.equal(valor('og:image:alt'), CAP_SOCIAL_BASE.image.alt);
  assert.equal(valor('robots'), 'noindex, nofollow');
  assert.equal(generic.filter(n => n.tagName === 'LINK').length, 0);
});
/* Revisió adversarial (261028) · ogUrl: l'og:url de la forma de camí d'un
   document, sense tocar el canonical (?item=, decisió 2) ni la marca. */
test('ogUrl canvia només l’og:url: el canonical continua sent el de les metadades', () => {
  const cami = origin + '/wikidepoble/03_llibre_d_or_memoria_episodica';
  const nodes = [...nodesDelHead(renderSocialHead(entry(wiki, "El Llibre d'Or"), origin, { ogUrl: cami }))];
  assert.equal(nodes.find(n => n.getAttribute('property') === 'og:url').getAttribute('content'), cami);
  assert.equal(nodes.find(n => n.tagName === 'LINK').getAttribute('href'), origin + wiki);
  assert.ok(nodes.every(n => n.hasAttribute(ATRIBUT_SSR)));
  assert.equal(nodes.filter(n => n.getAttribute('property') === 'og:url').length, 1);
  // Sense metadades (genèric) o amb canonical:false, ogUrl no afig res.
  for (const html of [renderSocialHead(null, origin, { ogUrl: cami }), renderSocialHead(entry('/wikidepoble', 'Wiki'), origin, { canonical: false, ogUrl: cami })]) {
    assert.equal([...nodesDelHead(html)].filter(n => n.tagName === 'LINK' || n.getAttribute('property') === 'og:url').length, 0);
  }
  // Escapat com la resta.
  const hostil = renderSocialHead(entry(wiki, 'x'), origin, { ogUrl: `${cami}"><script>alert(1)</script>` });
  assert.equal([...nodesDelHead(hostil)].filter(n => n.tagName === 'SCRIPT').length, 0);
});
test('routeKey: la forma de camí és el document; on dona clau, és la del client (clauSocialDeRuta)', () => {
  assert.equal(routeKey(origin + '/wikidepoble/03_llibre_d_or_memoria_episodica'), wiki);
  assert.equal(routeKey(origin + '/wikidepoble/03_llibre_d_or_memoria_episodica/?utm_source=x'), wiki);
  assert.equal(routeKey(origin + '/wikidepoble/a.b'), '/wikidepoble/a.b');
  for (const ruta of ['/projecte', '/projecte/', '/wikidepoble', wiki, wiki + '&utm_source=x', '/wikidepoble?categoria=x&item=el_projecte',
    '/wikidepoble/el_projecte', '/mercat/samarreta-socdepoble?item=x', '/', '/page/descarregues/']) {
    const url = new URL(ruta, origin);
    assert.equal(routeKey(url.href), clauSocialDeRuta(url.pathname, url.search), ruta);
  }
  // On el client cau a la llista, el servidor no dona cap head específic.
  for (const ruta of ['/wikidepoble?item=a&item=b', '/wikidepoble?item=..%2Fx']) assert.equal(routeKey(origin + ruta), null, ruta);
});
