/**
 * Proves del Traductor Sobirà de desenvolupament (IDEA-31, QA-R2-13):
 * tooling/vite/traductor-iaia.mjs. Cap xarxa real: el fetch dels proveïdors
 * és fals i el rellotge s'injecta. L'única connexió és el servidor HTTP local
 * de la prova, a 127.0.0.1 i en un port efímer.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import traductorIaia, {
  AGENT, APERTIUM, APERTIUM_BETA, APERTIUM_PRINCIPAL, LIMITS, ORDRE_DEL_MENU, RUTA_TRADUCTOR, comprovaCapcaleres, creaTraductorIaia,
  destinsServits, gestorTraductor, proveidorPer, urlHttps, validaCos
} from './traductor-iaia.mjs';
import { LLENGUES_TRADUCCIO } from '../../src/data/traductor.js';

/* Cicle 2 (G10): la beta és el primer extrem; la principal, la reserva. */
const BETA = 'https://beta.apertium.org/apy/translate';
const PRINCIPAL = 'https://apertium.org/apy/translate';
const LLIURE = 'https://lliure.example/translate';
const cos = (textos = ['Bon dia'], extra = {}) => Buffer.from(JSON.stringify({ textos, desti: 'ES', origen: 'CA', format: 'text', ...extra }));

/* Doble dels proveïdors: Apertium respon «spa:text» i l'extrem LibreTranslate «de:text». */
function falsFetch({ fail = {}, cost = 0, rellotge = null, upstream, cru } = {}) {
  const crides = [];
  const fetch = async (url, opcions) => {
    const json = opcions.headers['Content-Type'] === 'application/json';
    const dades = json ? JSON.parse(opcions.body) : Object.fromEntries(new URLSearchParams(opcions.body));
    crides.push({ url, opcions, dades });
    if (rellotge) rellotge.t += cost;
    const falla = fail[url];
    if (falla === 'transport') throw new TypeError('fetch failed');
    const bona = json
      ? { translatedText: dades.q.map((text) => `${dades.target}:${text}`) }
      : { responseData: { translatedText: `${dades.langpair.split('|')[1]}:${dades.q}` }, responseDetails: null, responseStatus: 200 };
    return new Response(cru ?? JSON.stringify(upstream ?? bona), { status: typeof falla === 'number' ? falla : 200 });
  };
  return { fetch, crides };
}

function servei(opcions = {}, env = {}) {
  const rellotge = { t: Date.UTC(2026, 9, 29, 22, 0, 0) };
  const doble = falsFetch({ rellotge, ...opcions });
  const traductor = creaTraductorIaia({ fetch: doble.fetch, env, ara: () => rellotge.t });
  return { ...doble, rellotge, traductor };
}

test('validació del cos com el PHP: estructura, destí, origen, format, mides i UTF-8', () => {
  assert.deepEqual(validaCos(cos()), { textos: ['Bon dia'], desti: 'ES', format: 'text' });
  const casos = [
    [{ textos: 'Bon dia' }, 400], [{ textos: [1] }, 400], [{ textos: [] }, 400], [{ textos: Array(51).fill('a') }, 400],
    [{ textos: [' ', '', '\t\n'] }, 400], [{ desti: 'ZZ' }, 400], [{ origen: 'ES' }, 400], [{ format: 'xml' }, 400],
    [{ url: 'http://evil.test' }, 400], [{ textos: ['é'.repeat(5001)] }, 413], [{ textos: ['€'.repeat(5000), '€'.repeat(1700)] }, 413],
    [{ textos: ['\ud800'] }, 400],
    // Cicle 2: GL i EU entren a la llista tancada; cap altra variant.
    [{ desti: 'gl' }, 400], [{ desti: 'eu' }, 400], [{ desti: 'EU-ES' }, 400], [{ desti: 'constructor' }, 400], [{ desti: '__proto__' }, 400]
  ];
  for (const desti of ['ES', 'EN-GB', 'FR', 'DE', 'GL', 'EU']) {
    assert.deepEqual(validaCos(cos(['Bon dia'], { desti })), { textos: ['Bon dia'], desti, format: 'text' }, desti);
  }
  for (const [canvi, status] of casos) {
    const dades = { textos: ['Bon dia'], desti: 'ES', origen: 'CA', format: 'text', ...canvi };
    assert.equal(validaCos(Buffer.from(JSON.stringify(dades))).error?.status, status, JSON.stringify(canvi).slice(0, 60));
  }
  for (const cru of ['{', '[]', 'null', '{"textos":{"0":"text"},"desti":"ES","origen":"CA","format":"text"}']) {
    assert.equal(validaCos(Buffer.from(cru)).error.status, 400, cru);
  }
  assert.equal(validaCos(Buffer.from([0x7b, 0xff, 0x7d])).error.status, 400, 'UTF-8 invàlid');
  assert.deepEqual(validaCos(cos()).error, undefined);
  assert.deepEqual(validaCos(cos(['x'], { desti: 'ZZ' })).error.cos, { code: 'sdp_traduccio_invalida', message: 'The translation request could not be accepted.', data: { status: 400 } });
});

test('capçaleres com el permís del PHP: mateix origen o cap, cross-site fora, només JSON', () => {
  const propi = 'http://localhost:3340';
  const json = { 'content-type': 'application/json' };
  assert.equal(comprovaCapcaleres({ ...json, origin: propi }, propi), null);
  assert.equal(comprovaCapcaleres({ ...json, origin: 'http://localhost:3340/' }, propi), null);
  assert.equal(comprovaCapcaleres(json, propi), null, 'sense Origin (curl, CLI) passa');
  assert.equal(comprovaCapcaleres({ ...json, origin: '' }, propi), null, 'Origin buit compta com a absent');
  assert.equal(comprovaCapcaleres({ 'content-type': 'application/json; charset=utf-8' }, propi), null);
  for (const origin of ['https://evil.test', 'null', 'http://localhost:3341', 'https://localhost:3340', 'http://user:pw@localhost:3340']) {
    assert.equal(comprovaCapcaleres({ ...json, origin }, propi)?.status, 403, origin);
  }
  assert.equal(comprovaCapcaleres({ ...json, 'sec-fetch-site': 'cross-site' }, propi).status, 403);
  assert.equal(comprovaCapcaleres({ 'content-type': 'application/x-www-form-urlencoded' }, propi).status, 415);
  assert.equal(comprovaCapcaleres({}, propi).status, 415);
});

test('Apertium: cat|spa, cat|eng, cat|fra i cat|glg a la beta primer, markUnknown=no, format txt, una crida de formulari per text i l’agent honest del Mas', async () => {
  assert.equal(APERTIUM_BETA, BETA);
  assert.equal(APERTIUM_PRINCIPAL, PRINCIPAL);
  assert.deepEqual(APERTIUM, [BETA, PRINCIPAL], 'G10: primer la beta');
  const { traductor, crides } = servei();
  const r = await traductor.tradueix(cos(['Bon dia', '', 'Poble', 'Bon dia']));
  assert.deepEqual(r, { status: 200, cos: { traduccions: ['spa:Bon dia', '', 'spa:Poble', 'spa:Bon dia'], origen: 'CA', desti: 'ES', cache: false } });
  await traductor.tradueix(cos(['Bon dia'], { desti: 'EN-GB' }));
  await traductor.tradueix(cos(['Bon dia'], { desti: 'FR' }));
  assert.deepEqual((await traductor.tradueix(cos(['Bon dia'], { desti: 'GL' }))).cos.traduccions, ['glg:Bon dia']);
  assert.deepEqual(crides.map((c) => [c.url, c.dades.langpair, c.dades.q]), [
    [BETA, 'cat|spa', 'Bon dia'], [BETA, 'cat|spa', 'Poble'], [BETA, 'cat|eng', 'Bon dia'], [BETA, 'cat|fra', 'Bon dia'], [BETA, 'cat|glg', 'Bon dia']
  ]);
  for (const { opcions, dades } of crides) {
    assert.equal(dades.markUnknown, 'no');
    assert.equal(dades.format, 'txt', 'C6: el text pla porta format=txt (l’APy, sense format, el tractaria com a HTML)');
    assert.equal(opcions.method, 'POST');
    assert.equal(opcions.redirect, 'manual');
    assert.equal(opcions.headers['User-Agent'], AGENT);
    assert.equal(opcions.headers['Content-Type'], 'application/x-www-form-urlencoded; charset=UTF-8');
    assert.ok(opcions.signal instanceof AbortSignal);
  }
  const { traductor: html, crides: cridesHtml } = servei();
  await html.tradueix(cos(['<p>Bon <strong>dia</strong></p>'], { format: 'html' }));
  assert.equal(cridesHtml[0].dades.format, 'html');
  // C6: angles, entitats, acrònims i URL viatgen tal qual dins de q, amb format=txt.
  const literal = 'Si a < b i c > d, l’ONU escriu &amp; a https://socdepoble.org/page/fediversity?a=1&b=2';
  const { traductor: txt, crides: cridesTxt } = servei();
  await txt.tradueix(cos([literal], { desti: 'FR' }));
  assert.deepEqual([cridesTxt[0].dades.q, cridesTxt[0].dades.format], [literal, 'txt']);
});

test('memòria cau: tot de la cache → cache:true sense crides ni ritme; separada per destí i format; amb sostre', async () => {
  const { traductor, crides } = servei();
  await traductor.tradueix(cos(['Bon dia', 'Poble']));
  assert.deepEqual(await traductor.tradueix(cos(['Poble', 'Bon dia'])), { status: 200, cos: { traduccions: ['spa:Poble', 'spa:Bon dia'], origen: 'CA', desti: 'ES', cache: true } });
  assert.equal((await traductor.tradueix(cos(['Poble', 'Nit']))).cos.cache, false);
  await traductor.tradueix(cos(['Poble'], { format: 'html' }));
  await traductor.tradueix(cos(['Poble'], { desti: 'FR' }));
  assert.deepEqual(crides.map((c) => c.dades.q), ['Bon dia', 'Poble', 'Nit', 'Poble', 'Poble']);
  const rellotge = { t: 0 };
  const doble = falsFetch();
  const petit = creaTraductorIaia({ fetch: doble.fetch, env: {}, ara: () => rellotge.t, limits: { ...LIMITS, cau: 2 } });
  for (const text of ['a', 'b', 'c']) await petit.tradueix(cos([text]));
  assert.equal(petit.mida(), 2);
  await petit.tradueix(cos(['a']));
  assert.equal(doble.crides.length, 4, 'la més vella ha eixit del sostre');
  rellotge.t += LIMITS.vidaCau + 1;
  await petit.tradueix(cos(['a']));
  assert.equal(doble.crides.length, 5, 'passats 7 dies, la cache caduca');
});

test('beta caiguda (5xx o transport) → principal, i la resta de la petició hi va directa; 4xx no canvia d’extrem; 429 i 403 obrin la pausa', async () => {
  for (const falla of [500, 503, 'transport']) {
    const { traductor, crides } = servei({ fail: { [BETA]: falla } });
    const r = await traductor.tradueix(cos(['Bon dia', 'Poble']));
    assert.equal(r.status, 200, String(falla));
    assert.deepEqual(crides.map((c) => c.url), [BETA, PRINCIPAL, PRINCIPAL]);
  }
  const refusat = servei({ fail: { [BETA]: 400 } });
  assert.equal((await refusat.traductor.tradueix(cos())).cos.code, 'sdp_traduccio_proveidor');
  assert.deepEqual(refusat.crides.map((c) => c.url), [BETA]);
  for (const [estat, codi] of [[429, 'sdp_traduccio_limit'], [403, 'sdp_traduccio_proveidor']]) {
    const limitat = servei({ fail: { [BETA]: estat } });
    assert.equal((await limitat.traductor.tradueix(cos())).cos.code, codi);
    assert.equal((await limitat.traductor.tradueix(cos(['Nit']))).cos.code, codi, `pausa curta per ${estat}`);
    assert.equal(limitat.crides.length, 1, String(estat));
    limitat.rellotge.t += LIMITS.pausa + 1;
    await limitat.traductor.tradueix(cos(['Nit']));
    assert.equal(limitat.crides.length, 2, `passada la pausa de ${estat}, torna a provar`);
  }
});

test('GL només a la beta: si la beta cau, 502 net i mai l’extrem principal (que torna 400 «That pair is not installed»)', async () => {
  for (const falla of [500, 503, 'transport']) {
    const { traductor, crides } = servei({ fail: { [BETA]: falla } });
    assert.equal((await traductor.tradueix(cos(['Bon dia'], { desti: 'GL' }))).cos.code, 'sdp_traduccio_proveidor', String(falla));
    assert.deepEqual(crides.map((c) => c.url), [BETA]);
  }
  assert.deepEqual(proveidorPer('GL', {}).extrems, [BETA]);
  assert.deepEqual(proveidorPer('GL', { SDP_TRADUCCIO_URL: LLIURE }).nom, 'apertium', 'el gallec no va mai al proveïdor LibreTranslate');
});

test('sense xarxa: 502 sdp_traduccio_proveidor net i res a la cache; un error de xarxa no obri la pausa (decisió del Mestre 261030 §2)', async () => {
  const { traductor, crides } = servei({ fail: { [BETA]: 'transport', [PRINCIPAL]: 'transport' } });
  const r = await traductor.tradueix(cos());
  assert.deepEqual(r, { status: 502, cos: { code: 'sdp_traduccio_proveidor', message: 'The translation provider is unavailable. Try again later.', data: { status: 502 } } });
  assert.equal(traductor.mida(), 0);
  assert.equal((await traductor.tradueix(cos(['Nit']))).status, 502);
  assert.deepEqual(crides.map((c) => c.url), [BETA, PRINCIPAL, BETA, PRINCIPAL], 'la petició següent torna a provar, sense esperar 60 s');
  const lliure = servei({ fail: { [LLIURE]: 'transport' } }, { SDP_TRADUCCIO_URL: LLIURE });
  assert.equal((await lliure.traductor.tradueix(cos(['Bon dia'], { desti: 'DE' }))).status, 502);
  assert.equal((await lliure.traductor.tradueix(cos(['Nit'], { desti: 'DE' }))).status, 502);
  assert.equal(lliure.crides.length, 2, 'tampoc el proveïdor LibreTranslate es pausa per un error de xarxa');
});

test('SDP_TRADUCCIO_APERTIUM_URL https és l’únic extrem; si no és https sense credencials, s’ignora', async () => {
  const propi = 'https://apertium.example/apy/translate';
  const { traductor, crides } = servei({ fail: { [propi]: 500 } }, { SDP_TRADUCCIO_APERTIUM_URL: propi });
  assert.equal((await traductor.tradueix(cos())).status, 502);
  assert.deepEqual(crides.map((c) => c.url), [propi]);
  for (const invalida of ['http://apertium.example/x', 'https://u:p@apertium.example/x', 'ftp://x', 'https://a b', 'https://x/\nx', '//x/y', '', undefined]) {
    assert.equal(urlHttps(invalida), '', String(invalida));
    assert.deepEqual(proveidorPer('ES', { SDP_TRADUCCIO_APERTIUM_URL: invalida }).extrems, [BETA, PRINCIPAL]);
    assert.deepEqual(proveidorPer('GL', { SDP_TRADUCCIO_APERTIUM_URL: invalida }).extrems, [BETA]);
  }
  assert.deepEqual(proveidorPer('GL', { SDP_TRADUCCIO_APERTIUM_URL: propi }).extrems, [propi], 'també substituïx la beta del gallec');
  // Un nom heretat d'Object.prototype no és cap destí (la validació ja el para abans).
  for (const fals of ['constructor', '__proto__', 'toString']) assert.equal(proveidorPer(fals, { SDP_TRADUCCIO_URL: LLIURE }).error?.status, 503, fals);
});

test('DE i EU: sense SDP_TRADUCCIO_URL, 503 estable sense crides (D-3); amb l’extrem LibreTranslate, un lot amb la clau només al cos', async () => {
  const sense = servei();
  for (const desti of ['DE', 'EU']) {
    assert.deepEqual(await sense.traductor.tradueix(cos(['Bon dia'], { desti })), {
      status: 503, cos: { code: 'sdp_traduccio_sense_clau', message: 'Translation is not configured on this server.', data: { status: 503 } }
    }, desti);
  }
  assert.equal(sense.crides.length, 0);
  // G3: el `target` és el del destí, mai un 'de' fix.
  const basc = servei({}, { SDP_TRADUCCIO_URL: LLIURE });
  assert.deepEqual((await basc.traductor.tradueix(cos(['Bon dia'], { desti: 'EU' }))).cos.traduccions, ['eu:Bon dia']);
  assert.deepEqual(basc.crides.map((c) => [c.url, c.dades.target]), [[LLIURE, 'eu']]);
  assert.equal(proveidorPer('DE', { SDP_TRADUCCIO_URL: LLIURE }).target, 'de');
  const amb = servei({}, { SDP_TRADUCCIO_URL: LLIURE, SDP_TRADUCCIO_URL_CLAU: 'clau-de-prova-sintetica' });
  const r = await amb.traductor.tradueix(cos(['Bon dia', 'Poble'], { desti: 'DE' }));
  assert.deepEqual(r.cos.traduccions, ['de:Bon dia', 'de:Poble']);
  assert.deepEqual(amb.crides[0].dades, { q: ['Bon dia', 'Poble'], source: 'ca', target: 'de', format: 'text', api_key: 'clau-de-prova-sintetica' });
  assert.equal(amb.crides[0].url, LLIURE);
  assert.equal(amb.crides[0].opcions.headers['User-Agent'], AGENT);
  assert.ok(!JSON.stringify(r).includes('clau-de-prova'), 'la clau mai torna');
  assert.equal((await servei({}, { SDP_TRADUCCIO_URL: 'http://lliure.example/translate' }).traductor.tradueix(cos(['x'], { desti: 'DE' }))).status, 503);
  for (const upstream of [{}, { translatedText: 'x' }, { translatedText: ['a', 'b'] }, { translatedText: [''] }]) {
    const dolenta = servei({ upstream }, { SDP_TRADUCCIO_URL: LLIURE });
    assert.equal((await dolenta.traductor.tradueix(cos(['Nit'], { desti: 'DE' }))).status, 502, JSON.stringify(upstream));
    assert.equal(dolenta.traductor.mida(), 0);
  }
});

test('resposta d’Apertium malformada, buida o massa gran: 502 i res a la cache', async () => {
  const dolentes = [{ upstream: {} }, { upstream: { responseStatus: 200, responseData: { translatedText: '' } } },
    { upstream: { responseStatus: 400, responseData: { translatedText: 'x' } } }, { upstream: { responseStatus: '200', responseData: { translatedText: 'x' } } },
    { upstream: { responseStatus: 200, responseData: { translatedText: 5 } } }, { cru: 'no és JSON' },
    { cru: JSON.stringify({ responseStatus: 200, responseData: { translatedText: 'x'.repeat(LIMITS.resposta) } }) }];
  for (const cas of dolentes) {
    const { traductor } = servei(cas);
    assert.equal((await traductor.tradueix(cos())).status, 502, JSON.stringify(cas).slice(0, 80));
    assert.equal(traductor.mida(), 0);
  }
});

test('ritme per adreça (30 sense cache cada 10 minuts) i pressupost diari reservat abans d’enviar, sense reemborsament', async () => {
  const { traductor, crides, rellotge } = servei();
  for (let i = 0; i < 30; i += 1) assert.equal((await traductor.tradueix(cos([`text${i}`]), '192.0.2.1')).status, 200);
  assert.equal((await traductor.tradueix(cos(['text30']), '192.0.2.1')).cos.code, 'sdp_traduccio_limit');
  assert.equal((await traductor.tradueix(cos(['text0']), '192.0.2.1')).cos.cache, true, 'la cache no compta');
  assert.equal((await traductor.tradueix(cos(['altra']), '192.0.2.2')).status, 200, 'una altra adreça té el seu comptador');
  assert.equal(crides.length, 31);
  rellotge.t += LIMITS.finestra + 1;
  assert.equal((await traductor.tradueix(cos(['text30']), '192.0.2.1')).status, 200);
  const caigut = servei({ fail: { [BETA]: 'transport', [PRINCIPAL]: 'transport' } }, { SDP_TRADUCCIO_LIMIT_DIARI: '10' });
  assert.equal((await caigut.traductor.tradueix(cos())).status, 502);
  assert.equal((await caigut.traductor.tradueix(cos(['Nit nova']))).status, 429, '7 reservats + 8 passen de 10');
  assert.equal(caigut.crides.length, 2, 'passat el pressupost, cap crida');
  for (const limit of ['0', '-1', 'deu']) {
    const zero = servei({}, { SDP_TRADUCCIO_LIMIT_DIARI: limit });
    assert.equal((await zero.traductor.tradueix(cos())).status, 429, limit);
    assert.equal(zero.crides.length, 0);
  }
});

test('termini: 12 s per crida i 30 s per petició (decisió §2); el que ha arribat es guarda i el reintent continua sense pausa', async () => {
  assert.deepEqual([LIMITS.crida, LIMITS.total, LIMITS.pausa], [12000, 30000, 60000]);
  const original = AbortSignal.timeout;
  const terminis = [];
  AbortSignal.timeout = (ms) => { terminis.push(ms); return original.call(AbortSignal, ms); };
  try {
    const { traductor, crides } = servei({ cost: 11000 });
    const textos = ['u', 'dos', 'tres', 'quatre'];
    assert.equal((await traductor.tradueix(cos(textos))).cos.code, 'sdp_traduccio_proveidor');
    assert.deepEqual(crides.map((c) => c.dades.q), ['u', 'dos', 'tres'], 'dues crides lentes d’11 s no esgoten la petició');
    assert.deepEqual(terminis, [12000, 12000, 8000], 'cada crida té 12 s com a molt, i només el que queda dels 30');
    const r = await traductor.tradueix(cos(textos));
    assert.deepEqual(r.cos.traduccions, textos.map((text) => `spa:${text}`), 'un termini no obri la pausa');
    assert.deepEqual(crides.slice(3).map((c) => c.dades.q), ['quatre']);
  } finally {
    AbortSignal.timeout = original;
  }
});

test('dues peticions alhora no paguen el mateix text: la segona, 503 ocupada', async () => {
  let deixa;
  const espera = new Promise((resolve) => { deixa = resolve; });
  const traductor = creaTraductorIaia({ env: {}, fetch: async (url, opcions) => {
    await espera;
    const q = new URLSearchParams(opcions.body).get('q');
    return new Response(JSON.stringify({ responseData: { translatedText: `spa:${q}` }, responseStatus: 200 }));
  } });
  const primera = traductor.tradueix(cos());
  assert.equal((await traductor.tradueix(cos())).cos.code, 'sdp_traduccio_ocupada');
  deixa();
  assert.equal((await primera).status, 200);
});

test('HTTP: contracte exacte, no-store, cos de més de 32768 bytes tallat, origen aliè i GET fora', async () => {
  const { traductor, crides } = servei();
  const servidor = http.createServer(gestorTraductor(traductor));
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const post = (cosPeticio, capcaleres = {}) => fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json', ...capcaleres }, body: cosPeticio });
  try {
    const bona = await post(cos(['Bon dia']), { Origin: base });
    assert.equal(bona.status, 200);
    assert.equal(bona.headers.get('cache-control'), 'no-store');
    assert.match(bona.headers.get('content-type'), /^application\/json/);
    assert.deepEqual(await bona.json(), { traduccions: ['spa:Bon dia'], origen: 'CA', desti: 'ES', cache: false });
    const gran = await post(JSON.stringify({ textos: ['a'], desti: 'ES', origen: 'CA', format: 'text', x: ' '.repeat(32769) }));
    assert.equal(gran.status, 413);
    assert.equal((await gran.json()).code, 'sdp_traduccio_mida');
    assert.equal((await post(cos(), { Origin: 'https://evil.test' })).status, 403);
    assert.equal((await post(cos(), { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await post('{')).status, 400);
    const get = await fetch(base);
    assert.equal(get.status, 404);
    assert.equal((await get.json()).code, 'rest_no_route');
    assert.equal(crides.length, 1);
  } finally {
    servidor.close();
  }
});

test('connector: només en servir, munta la ruta i definix SDP_TRADUCTOR_DEV fora de build, preview i Vitest', () => {
  const connector = traductorIaia({ env: {} });
  assert.equal(connector.apply, 'serve');
  /* TC3.1 (261030) · I els destins que servix, per a main.jsx. */
  assert.deepEqual(connector.config({}, { command: 'serve', isPreview: false }), { define: {
    'import.meta.env.SDP_TRADUCTOR_DEV': JSON.stringify(RUTA_TRADUCTOR),
    'import.meta.env.SDP_TRADUCTOR_DEV_LLENGUES': JSON.stringify('ES GL EN-GB FR')
  } });
  assert.equal(traductorIaia({ env: { SDP_TRADUCCIO_URL: LLIURE } }).config({}, { command: 'serve', isPreview: false })
    .define['import.meta.env.SDP_TRADUCTOR_DEV_LLENGUES'], JSON.stringify('ES GL EU EN-GB FR DE'));
  assert.equal(connector.config({}, { command: 'build' }), undefined);
  assert.equal(connector.config({}, { command: 'serve', isPreview: true }), undefined);
  const abans = process.env.VITEST;
  process.env.VITEST = 'true';
  try {
    assert.equal(connector.config({}, { command: 'serve', isPreview: false }), undefined);
  } finally {
    if (abans === undefined) delete process.env.VITEST; else process.env.VITEST = abans;
  }
  const muntades = [];
  connector.configureServer({ config: { server: {} }, middlewares: { use: (ruta, gestor) => muntades.push([ruta, typeof gestor]) } });
  assert.deepEqual(muntades, [[RUTA_TRADUCTOR, 'function']]);
});

/* Gauntlet 261030 (Fase 3, TC3.1; traduir-eu-de-servidor-503) · El connector
   declara EXACTAMENT els destins que servix (els que proveidorPer no torna en
   503 sense_clau), en l'ordre del menú del client: el client no demana cap
   altre destí i a :3340 no ix cap 503 a la consola. */
test('TC3.1 · destinsServits: els que proveidorPer servix, en l’ordre del menú del client', () => {
  assert.deepEqual([...ORDRE_DEL_MENU], LLENGUES_TRADUCCIO.map((llengua) => llengua.codi), 'l’ordre del menú');
  for (const env of [{}, { SDP_TRADUCCIO_URL: LLIURE }, { SDP_TRADUCCIO_URL: 'http://lliure.example/translate' }, { SDP_TRADUCCIO_APERTIUM_URL: 'https://apertium.example/translate' }]) {
    const servits = ORDRE_DEL_MENU.filter((desti) => !proveidorPer(desti, env).error);
    assert.deepEqual(destinsServits(env), servits, JSON.stringify(env));
  }
  assert.deepEqual(destinsServits({}), ['ES', 'GL', 'EN-GB', 'FR']);
  assert.deepEqual(destinsServits({ SDP_TRADUCCIO_URL: LLIURE }), ['ES', 'GL', 'EU', 'EN-GB', 'FR', 'DE']);
});
