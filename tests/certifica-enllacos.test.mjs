import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { certificaEnllacos, extreuUrlsDeText } from '../tooling/gates/certifica-enllacos.mjs';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('certificaEnllacos: accepta totes les URLs canòniques de Fediversity, Descàrregues, Federació i OpenData', async () => {
  const informe = await certificaEnllacos({
    arrel: ARREL,
    urls: [
      'https://socdepoble.org/page/fediversity',
      'https://socdepoble.org/fediversity',
      'https://socdepoble.org/page/projecte-fediversity',
      'https://socdepoble.org/page/descarregues',
      'https://socdepoble.org/opendata/municipi.jsonld',
      'https://socdepoble.org/opendata/manifest.json',
      'https://socdepoble.org/opendata/llicencies.md',
      'https://socdepoble.org/.well-known/nodeinfo',
      'https://socdepoble.org/nodeinfo/2.1.json',
      'https://socdepoble.org/.well-known/host-meta',
      'https://socdepoble.org/.well-known/webfinger/acct:socdepoble@socdepoble.org',
      'https://socdepoble.org/ap/actors/socdepoble.json',
      'https://socdepoble.org/ap/outbox/socdepoble.json'
    ],
    remot: false
  });
  assert.equal(informe.ok, true, JSON.stringify(informe.falles));
  assert.equal(informe.falles.length, 0);
  assert.match(informe.segellSha256, /^[0-9a-f]{16}$/);
});

test('certificaEnllacos: rebutja rutes SPA /page/:slug inexistents, recursos /opendata/* absents i endpoints /ap/* falsos', async () => {
  const informe = await certificaEnllacos({
    arrel: ARREL,
    urls: [
      'https://socdepoble.org/page/pagina-inventada-que-dona-404',
      'https://socdepoble.org/opendata/fitxer-inexistent.jsonld',
      'https://socdepoble.org/ap/actors/poble-inventat.json',
      'https://socdepoble.org/ruta-spa-inventada'
    ],
    remot: false
  });
  assert.equal(informe.ok, false);
  assert.equal(informe.falles.length, 4);
  assert.deepEqual(
    informe.falles.map((f) => f.arbre.codi),
    ['SPA_404_PAGE_SLUG', 'OPENDATA_404', 'FEDERACIO_404', 'SPA_404_RUTA_DESCONEGUDA']
  );
});

test('certificaEnllacos amb --remot: detecta quan un endpoint de dades retorna un fallback HTML <!doctype html>', async () => {
  const fetchMock = async () => ({
    ok: true,
    status: 200,
    headers: new Map([['content-type', 'text/html; charset=utf-8']]),
    text: async () => '<!doctype html><html><body>SPA fallback</body></html>'
  });
  const informe = await certificaEnllacos({
    arrel: ARREL,
    urls: ['https://socdepoble.org/opendata/municipi.jsonld'],
    remot: true,
    fetchImpl: fetchMock
  });
  assert.equal(informe.ok, false);
  assert.equal(informe.falles.length, 1);
  assert.match(informe.falles[0].xarxa.motiu, /HTML de fallback/);
});

test('extreuUrlsDeText: neteja signes de puntuació finals i ignora plantilles amb <...>', () => {
  const urls = extreuUrlsDeText(
    'Mireu https://socdepoble.org/page/fediversity, https://socdepoble.org/opendata/manifest.json. I no https://socdepoble.org/ap/<slug>.json'
  );
  assert.deepEqual(urls, [
    'https://socdepoble.org/page/fediversity',
    'https://socdepoble.org/opendata/manifest.json'
  ]);
});

test('O4-GEMINI-1 · extreuUrlsDeText amb inclouRelatius extreu href i data-ruta de Sub-Targetes i certificaEnllacos valida ?item= de la Wiki', async () => {
  const html = '<div data-sdp-targeta="pagina:anima" data-ruta="/anima"><a href="/wikidepoble?item=el_projecte">Projecte</a></div>';
  const urls = extreuUrlsDeText(html, { inclouRelatius: true });
  assert.deepEqual(urls, [
    'https://socdepoble.org/anima',
    'https://socdepoble.org/wikidepoble?item=el_projecte'
  ]);
  const ok = await certificaEnllacos({ arrel: ARREL, urls, remot: false });
  assert.equal(ok.ok, true, JSON.stringify(ok.falles));

  const ko = await certificaEnllacos({
    arrel: ARREL,
    urls: ['https://socdepoble.org/wikidepoble?item=item_inexistent_que_no_es_al_manifest'],
    remot: false
  });
  assert.equal(ko.ok, false);
  assert.equal(ko.falles[0].arbre.codi, 'SPA_404_WIKI_ITEM');
});

test('O4 fusió · inclouRelatius llig data-autor-ruta i les cometes escapades del codi font, en l’ordre del document', () => {
  const font = String.raw`"html": "<div data-sdp-targeta=\"pagina:versions\" data-ruta=\"/versions\" data-autor-ruta=\"/projecte\"><a href=\"/page/descarregues\">x</a></div> https://socdepoble.org/opendata/manifest.json\"`;
  assert.deepEqual(extreuUrlsDeText(font, { inclouRelatius: true }), [
    'https://socdepoble.org/opendata/manifest.json',
    'https://socdepoble.org/versions',
    'https://socdepoble.org/projecte',
    'https://socdepoble.org/page/descarregues'
  ]);
  // Sense l'opció, cap data-ruta ni cap cometa escapada, com en Codex; l'única
  // diferència amb Codex és que la barra invertida ara talla la URL (ARB-G-04).
  assert.deepEqual(extreuUrlsDeText(font), ['https://socdepoble.org/opendata/manifest.json']);
  assert.deepEqual(extreuUrlsDeText('<a href="/anima">a</a>'), ['/anima']);
});

test('O4 fusió · ?item= també es valida a /wiki i un ítem inexistent no passa mai com a ruta de secció', async () => {
  const informe = await certificaEnllacos({
    arrel: ARREL,
    urls: ['/wiki?item=el_projecte', '/wiki?item=no_existix_enlloc', '/wikidepoble'],
    remot: false
  });
  assert.deepEqual(informe.resultats.map((r) => r.ok), [true, false, true]);
  assert.equal(informe.resultats[1].arbre.codi, 'SPA_404_WIKI_ITEM');
});

test('O4 fusió · les pàgines germanes de les targetes incrustades són rutes conegudes, i /app/* continua pendent de resolució', async () => {
  const informe = await certificaEnllacos({
    arrel: ARREL,
    urls: ['/anima', '/constitucio', '/versions', '/fedivers', '/page/fediversity', '/page/descarregues', '/projecte', '/app/qualsevol'],
    remot: false
  });
  assert.deepEqual(informe.resultats.map((r) => r.ok), [true, true, true, true, true, true, true, false]);
  assert.equal(informe.resultats[7].arbre.codi, 'RUTA_PENDENT_RESOLUCIO');
});


test('ARB-G-02 · inclouRelatius no omet cap ruta amb «$»: es valida i, si no existix, falla', async () => {
  const urls = extreuUrlsDeText('<a href="/pagina$x">x</a>', { inclouRelatius: true });
  assert.deepEqual(urls, ['https://socdepoble.org/pagina$x']);
  const informe = await certificaEnllacos({ arrel: ARREL, urls, remot: false });
  assert.equal(informe.ok, false);
  assert.equal(informe.falles[0].arbre.codi, 'SPA_404_RUTA_DESCONEGUDA');
});

test('ARB-G-03 · una categoria de la Wiki («folder:…») no passa com a ítem de ?item=', async () => {
  const informe = await certificaEnllacos({
    arrel: ARREL,
    urls: ['/wikidepoble?item=folder:01_ser', '/wiki?item=folder:02_saber', '/wikidepoble?item=el_projecte'],
    remot: false
  });
  assert.deepEqual(informe.resultats.map((r) => r.ok), [false, false, true]);
  assert.equal(informe.resultats[0].arbre.codi, 'SPA_404_WIKI_ITEM');
  assert.equal(informe.resultats[1].arbre.codi, 'SPA_404_WIKI_ITEM');
});

test('ARB-G-04 · sense inclouRelatius, la barra invertida talla la URL (diferència única amb Codex)', () => {
  assert.deepEqual(extreuUrlsDeText(String.raw`"<a href=\"https://wordpress.org/plugins/socdepoble/\">"`), ['https://wordpress.org/plugins/socdepoble/']);
  assert.deepEqual(extreuUrlsDeText(String.raw`vegeu https://socdepoble.org/a\b`), ['https://socdepoble.org/a']);
});
