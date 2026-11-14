/* Onada R24 · Consola Zero (P-G) · El nucli pur de l'arnés
   (tooling/gates/consola-zero-nucli.mjs): Firebase Hosting en local, la
   classificació dels esdeveniments CDP, les rutes del router i el resum.
   Les fixtures CDP tenen la forma que envia Chromium (Log.entryAdded,
   Runtime.consoleAPICalled, Runtime.exceptionThrown, Network.*); la del
   «Banner not shown» és sintètica (el nivell exacte de Chromium no és
   verificat, informe 261114 §3.5). Cap navegador ni xarxa. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESQUEMA_RUTES, aplicaExempcions, capcaleresEfectives, casaGlobHosting, casaPatroDeRuta, casaReglaHosting, categoriaDIniciador,
  classificaEsdeveniment, classificaFallada, classificaResposta, codiDEixida, comprovaRutes, esFugaAProduccio,
  esPeticioPermesa, esTrobadaDeTros, reclassificaLogDeXarxa, reescripturaDe, resolDeHosting, resumeix, rutesDeLApp, textDeArguments, tipusMime
} from './consola-zero-nucli.mjs';

const ARREL = fileURLToPath(new URL('../..', import.meta.url));
const HOSTING = JSON.parse(fs.readFileSync(path.join(ARREL, 'firebase.json'), 'utf8')).hosting;
const RUTES = JSON.parse(fs.readFileSync(path.join(ARREL, 'tooling/gates/consola-zero.rutes.json'), 'utf8'));
const ORIGEN = 'http://127.0.0.1:4173';

test('Hosting: globs amb negació i regex RE2 (?i:…) com superstatic', () => {
  assert.equal(casaGlobHosting('!/@(assets|fonts)/**', '/xat'), true);
  assert.equal(casaGlobHosting('!/@(assets|fonts)/**', '/assets/x-AbCdEf12.js'), false);
  assert.equal(casaGlobHosting('/assets/**', '/assets/system/ui/logo.png'), true);
  assert.equal(casaGlobHosting('**/*.sha256', '/descarregues/a.apk.sha256'), true);
  assert.equal(casaReglaHosting({ regex: '^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$' }, '/assets/plus-BdnY3z-k.js'), true);
  assert.equal(casaReglaHosting({ regex: '^/assets/[^/]+-[A-Za-z0-9_-]{8}\\.(js|mjs|css|woff2?)$' }, '/assets/system/x-AbCdEf12.js'), false);
  assert.equal(casaReglaHosting({ regex: '^/a/(?i:acct)$' }, '/a/ACCT'), true);
  assert.equal(casaReglaHosting({}, '/x'), false);
});

test('Hosting: capçaleres efectives (l’última que casa mana) i la reescriptura de l’SPA', () => {
  assert.equal(capcaleresEfectives(HOSTING, '/index.html')['cache-control'].valor, 'no-cache');
  assert.equal(capcaleresEfectives(HOSTING, '/assets/plus-BdnY3z-k.js')['cache-control'].valor, 'public, max-age=31536000, immutable');
  assert.equal(capcaleresEfectives(HOSTING, '/ap/actors/socdepoble')['cache-control'].valor, 'public, max-age=300');
  assert.match(capcaleresEfectives(HOSTING, '/xat')['content-security-policy'].valor, /script-src 'self';/);
  const propi = { headers: [{ source: '**', headers: [{ key: 'X-A', value: '1' }] }, { source: '/b', headers: [{ key: 'x-a', value: '2' }] }] };
  assert.equal(capcaleresEfectives(propi, '/b')['x-a'].valor, '2');
  assert.equal(capcaleresEfectives(propi, '/c')['x-a'].valor, '1');
  assert.equal(reescripturaDe(HOSTING, '/xat'), '/index.html');
  assert.equal(reescripturaDe(HOSTING, '/assets/send-Cok00000.js'), null);
});

test('Hosting: resolDeHosting servix fitxers, l’index.html d’una carpeta i la reescriptura; un tros que falta és un 404 de veritat', () => {
  const disc = new Map([['index.html', 'fitxer'], ['assets', 'carpeta'], ['assets/plus-BdnY3z-k.js', 'fitxer'], ['projecte', 'carpeta'],
    ['projecte/index.html', 'fitxer'], ['buida', 'carpeta']]);
  const tipusDe = (rel) => disc.get(rel) ?? null;
  assert.deepEqual(resolDeHosting(HOSTING, '/', tipusDe), { estat: 200, rel: 'index.html' });
  assert.deepEqual(resolDeHosting(HOSTING, '/assets/plus-BdnY3z-k.js', tipusDe), { estat: 200, rel: 'assets/plus-BdnY3z-k.js' });
  assert.deepEqual(resolDeHosting(HOSTING, '/projecte', tipusDe), { estat: 200, rel: 'projecte/index.html' });
  assert.deepEqual(resolDeHosting(HOSTING, '/projecte/', tipusDe), { estat: 301, desti: '/projecte' });
  assert.deepEqual(resolDeHosting(HOSTING, '/xat', tipusDe), { estat: 200, rel: 'index.html', reescrit: true });
  assert.deepEqual(resolDeHosting(HOSTING, '/buida', tipusDe), { estat: 200, rel: 'index.html', reescrit: true });
  assert.deepEqual(resolDeHosting(HOSTING, '/assets/send-Cok00000.js', tipusDe), { estat: 404 });
  assert.deepEqual(resolDeHosting(HOSTING, '/fonts/no.woff2', tipusDe), { estat: 404 });
  assert.deepEqual(resolDeHosting(HOSTING, '/a/../index.html', tipusDe), { estat: 400 });
  assert.deepEqual(resolDeHosting(HOSTING, 'sense-barra', tipusDe), { estat: 400 });
  assert.equal(tipusMime('assets/x.js'), 'text/javascript; charset=utf-8');
  assert.equal(tipusMime('manifest.webmanifest'), 'application/manifest+json');
  assert.equal(tipusMime('x.desconegut'), 'application/octet-stream');
});

test('CDP: el 404 d’un modulepreload («about:client:1») és una troballa de xarxa i de tros', () => {
  // Network.requestWillBeSent → initiator d'un <link rel=modulepreload> (BuildInitiatorObject amb el referrer «about:client»).
  const iniciador = { type: 'script', url: 'about:client', lineNumber: 0 };
  assert.equal(categoriaDIniciador(iniciador), 'modulepreload');
  assert.equal(categoriaDIniciador({ type: 'parser', url: `${ORIGEN}/xat`, lineNumber: 87 }), 'parser');
  assert.equal(categoriaDIniciador(undefined), 'desconegut');
  const resposta = classificaResposta({ url: `${ORIGEN}/assets/send-Cok00000.js`, estat: 404, iniciador, tipus: 'Script' }, { origen: ORIGEN });
  assert.deepEqual(resposta, {
    categoria: 'xarxa', nivell: 'error', text: '404 /assets/send-Cok00000.js', url: `${ORIGEN}/assets/send-Cok00000.js`,
    iniciador: 'modulepreload', tipus: 'Script', estat: 404, falla: true
  });
  assert.equal(esTrobadaDeTros(resposta), true);
  assert.equal(classificaResposta({ url: `${ORIGEN}/assets/x.js`, estat: 200 }, { origen: ORIGEN }), null);
  assert.equal(classificaResposta({ url: 'https://altre.example/x.js', estat: 404 }, { origen: ORIGEN }), null);
  // El Log.entryAdded que la consola pinta en roig per al mateix 404.
  const log = classificaEsdeveniment({
    method: 'Log.entryAdded',
    params: { entry: { source: 'network', level: 'error', text: 'Failed to load resource: the server responded with a status of 404 (Not Found)', url: `${ORIGEN}/assets/send-Cok00000.js`, networkRequestId: '17.42', timestamp: 1 } }
  });
  assert.deepEqual(log, { categoria: 'log:network', text: 'Failed to load resource: the server responded with a status of 404 (Not Found)', url: `${ORIGEN}/assets/send-Cok00000.js`, linia: null, nivell: 'error', falla: true, peticio: '17.42' });
});

test('CDP: consola error, warning i assert fallen; log i info no; excepcions i rebutjos sense amo fallen', () => {
  const crida = (type, args) => classificaEsdeveniment({ method: 'Runtime.consoleAPICalled', params: { type, args, stackTrace: { callFrames: [{ url: `${ORIGEN}/assets/index-AbCdEf12.js`, lineNumber: 41, columnNumber: 7 }] } } });
  assert.deepEqual(crida('error', [{ type: 'string', value: 'Ha fallat' }, { type: 'object', description: 'Error: x' }]),
    { categoria: 'consola', nivell: 'error', text: 'Ha fallat Error: x', url: `${ORIGEN}/assets/index-AbCdEf12.js`, linia: 42, falla: true });
  assert.equal(crida('warning', [{ type: 'string', value: 'Compte' }]).nivell, 'avis');
  assert.equal(crida('assert', [{ type: 'string', value: 'Assertion failed' }]).falla, true);
  for (const type of ['log', 'info', 'debug', 'table']) assert.equal(crida(type, [{ type: 'string', value: 'res' }]), null);
  const excepcio = classificaEsdeveniment({
    method: 'Runtime.exceptionThrown',
    params: { timestamp: 1, exceptionDetails: { exceptionId: 1, text: 'Uncaught (in promise)', lineNumber: 0, columnNumber: 9,
      url: `${ORIGEN}/assets/XatSection-1acBZFqI.js`, exception: { type: 'object', subtype: 'error', description: 'TypeError: Failed to fetch dynamically imported module: http://127.0.0.1:4173/assets/XatSection-1acBZFqI.js' } } }
  });
  assert.equal(excepcio.categoria, 'excepcio');
  assert.equal(excepcio.linia, 1);
  assert.match(excepcio.text, /^Uncaught \(in promise\) TypeError: Failed to fetch dynamically imported module/);
  assert.equal(esTrobadaDeTros(excepcio), true);
  assert.equal(esTrobadaDeTros({ categoria: 'consola', text: 'Una altra cosa' }), false);
  assert.equal(textDeArguments([{ type: 'number', value: 3 }, { type: 'undefined' }, { type: 'bigint', unserializableValue: '1n' }]), '3 [undefined] 1n');
});

test('CDP: el «Banner not shown» informatiu s’anota sempre i només falla amb --estricte; verbose, mai', () => {
  const banner = { method: 'Log.entryAdded', params: { entry: { source: 'other', level: 'info', text: 'Banner not shown: beforeinstallpromptevent.preventDefault() called. The page must call beforeinstallpromptevent.prompt() to show the banner.', timestamp: 1 } } };
  assert.deepEqual([classificaEsdeveniment(banner).falla, classificaEsdeveniment(banner).observacio], [false, true]);
  assert.equal(classificaEsdeveniment(banner, { estricte: true }).falla, true);
  assert.equal(classificaEsdeveniment({ method: 'Log.entryAdded', params: { entry: { source: 'violation', level: 'verbose', text: '[Violation] x' } } }), null);
  assert.equal(classificaEsdeveniment({ method: 'Log.entryAdded', params: { entry: { source: 'security', level: 'error', text: 'Refused to connect' } } }).categoria, 'log:security');
  assert.equal(classificaEsdeveniment({ method: 'Page.loadEventFired', params: {} }), null);
  assert.equal(classificaEsdeveniment(undefined), null);
});

test('Peticions: les permeses, la fuga a Supabase, el backend sintètic, les externes i les cancel·lades', () => {
  assert.equal(esPeticioPermesa(`${ORIGEN}/assets/x.js`, ORIGEN), true);
  assert.equal(esPeticioPermesa('data:image/png;base64,AAAA', ORIGEN), true);
  assert.equal(esPeticioPermesa('blob:http://127.0.0.1:4173/uuid', ORIGEN), true);
  assert.equal(esPeticioPermesa('https://socdepoble.org/x', ORIGEN), false);
  assert.equal(esFugaAProduccio('https://abcdefgh.supabase.co/rest/v1/agents'), true);
  assert.equal(esFugaAProduccio('wss://abcdefgh.supabase.co/realtime/v1'), true);
  assert.equal(esFugaAProduccio('https://supabase.com.example.org/x'), false);
  const opcions = { origen: ORIGEN, backend: 'http://localhost:9' };
  assert.equal(classificaFallada({ url: 'https://abcdefgh.supabase.co/rest/v1/x', error: 'net::ERR_PROXY_CONNECTION_FAILED' }, opcions).categoria, 'fuga');
  assert.equal(classificaFallada({ url: 'http://localhost:9/rest/v1/x', error: 'net::ERR_CONNECTION_REFUSED' }, opcions).categoria, 'backend-sintetic');
  // Una de fora: l'arnés la talla, però en producció arribaria; s'anota sense fallar.
  assert.deepEqual(['categoria', 'falla', 'observacio'].map((k) => classificaFallada({ url: 'https://fonts.example/x.woff2', error: 'net::ERR_NAME_NOT_RESOLVED' }, opcions)[k]), ['externa', false, true]);
  const log = { categoria: 'log:network', nivell: 'error', text: 'Failed to load resource: net::ERR_PROXY_CONNECTION_FAILED', falla: true };
  assert.equal(reclassificaLogDeXarxa(log, `${ORIGEN}/assets/x.js`, opcions), log);
  assert.equal(reclassificaLogDeXarxa(log, 'https://abcdefgh.supabase.co/rest/v1/x', opcions).categoria, 'fuga');
  assert.equal(reclassificaLogDeXarxa(log, 'http://localhost:9/auth/v1/user', opcions).categoria, 'backend-sintetic');
  assert.deepEqual([reclassificaLogDeXarxa(log, 'https://img.example/a.jpg', opcions).categoria, reclassificaLogDeXarxa(log, 'https://img.example/a.jpg', opcions).falla], ['externa', false]);
  assert.equal(reclassificaLogDeXarxa({ ...log, categoria: 'consola' }, 'https://img.example/a.jpg', opcions).categoria, 'consola');
  assert.equal(reclassificaLogDeXarxa(log, null, opcions), log);
  assert.equal(classificaFallada({ url: `${ORIGEN}/assets/x.js`, error: 'net::ERR_ABORTED', iniciador: { type: 'script', url: 'about:client' } }, opcions).iniciador, 'modulepreload');
  assert.equal(classificaFallada({ url: `${ORIGEN}/xat`, error: 'net::ERR_ABORTED', cancelada: true }, opcions), null);
  assert.equal(classificaFallada({ url: 'data:text/plain,x', error: 'x' }, opcions), null);
});

test('Rutes: rutesDeLApp fa absoluts els camins relatius i separa els que són una expressió', () => {
  const app = `const A = () => (<Routes><Route path="/" element={<X />} /><Route path="/*" element={<Y />} /></Routes>);
const B = () => (<Routes><Route path="xat" element={<Z />} /><Route path={'mur'} element={<Z />} /><Route path={R.slice(1)} element={<Z />} /><Route path="*" element={<N />} /><Route index element={<I />} /></Routes>);`;
  assert.deepEqual(rutesDeLApp(app), { patrons: ['/', '/*', '/mur', '/xat'], expressions: ['R.slice(1)'] });
  assert.equal(casaPatroDeRuta('/page/:slug', '/page/descarregues'), true);
  assert.equal(casaPatroDeRuta('/page/:slug', '/page'), false);
  assert.equal(casaPatroDeRuta('/consola/*', '/consola/salut'), true);
  assert.equal(casaPatroDeRuta('/consola/*', '/consola'), true);
  assert.equal(casaPatroDeRuta('/xat', '/xat?fil=1'), true);
  assert.equal(casaPatroDeRuta('/xat', '/xat/1'), false);
  assert.deepEqual(comprovaRutes({ rutes: ['/', '/xat', '/inventada', '/r'], router: ['/', '/*', '/xat', '/mur', '/consola/*'], exclosos: { '/mur': 'motiu', '/mort': 'x' }, perExpressio: { '/r': 'R.slice(1)' } }),
    { senseRouter: ['/inventada'], senseCobrir: ['/consola'], exclusionsMortes: ['/mort'] });
});

test('Rutes: consola-zero.rutes.json cobrix cada patró sense paràmetres de src/app/App.jsx, i cada ruta casa amb el router', () => {
  const { patrons, expressions } = rutesDeLApp(fs.readFileSync(path.join(ARREL, 'src/app/App.jsx'), 'utf8'));
  assert.equal(RUTES.schema, ESQUEMA_RUTES);
  assert.ok(patrons.length > 40, `massa pocs <Route>: ${patrons.length}`);
  const res = comprovaRutes({ rutes: RUTES.rutes, router: patrons, exclosos: RUTES.exclosos, perExpressio: RUTES.perExpressio });
  assert.deepEqual(res, { senseRouter: [], senseCobrir: [], exclusionsMortes: [] });
  // Cada ruta d'expressió nomena una de les expressions que App.jsx porta de veres, i n'hi ha alguna per cada una.
  for (const expr of Object.values(RUTES.perExpressio)) assert.ok(expressions.includes(expr), expr);
  assert.deepEqual([...new Set(Object.values(RUTES.perExpressio))].sort(), [...new Set(expressions)].sort());
  for (const r of RUTES.perExpressio ? Object.keys(RUTES.perExpressio) : []) assert.ok(RUTES.rutes.includes(r), r);
  // La ruta inexistent de prova només casa amb el comodí: és la de NotFoundPage.
  for (const r of RUTES.notFound) assert.deepEqual(comprovaRutes({ rutes: [r], router: patrons }).senseRouter, [r]);
  assert.equal(new Set(RUTES.rutes).size, RUTES.rutes.length, 'rutes duplicades');
  for (const r of [RUTES.skew.inici, ...RUTES.skew.navegacions]) assert.ok(RUTES.rutes.includes(r), r);
});

test('Excepcions: només la categoria i el camí exactes deixen de fallar; la llista de rutes.json és la sonda documentada i res més', () => {
  const exempcions = [{ categoria: 'backend-sintetic', cami: '/auth/v1/health', motiu: 'sonda documentada' }];
  const sonda = { categoria: 'backend-sintetic', nivell: 'error', text: 'net::ERR_UNSAFE_PORT /auth/v1/health', url: 'http://localhost:9/auth/v1/health', falla: true };
  assert.deepEqual(aplicaExempcions(sonda, exempcions), { ...sonda, falla: false, observacio: true, exempcio: 'sonda documentada' });
  for (const altra of [{ ...sonda, url: 'http://localhost:9/auth/v1/user' }, { ...sonda, categoria: 'xarxa' }, { ...sonda, url: 'http://localhost:9/auth/v1/health/x' }, { ...sonda, url: null }]) {
    assert.equal(aplicaExempcions(altra, exempcions), altra);
  }
  assert.equal(aplicaExempcions(undefined, exempcions), undefined);
  // Créixer la llista és una decisió: esta prova l'ha de canviar qui n'afija una.
  assert.deepEqual(RUTES.exempcions.map(({ categoria, cami }) => [categoria, cami]), [['backend-sintetic', '/auth/v1/health']]);
  assert.match(RUTES.exempcions[0].motiu, /D-consola-5/);
});

test('Resum i codi d’eixida: verd només sense troballes que fallen, amb el desfasament verd i sense infraestructura', () => {
  const net = { escenaris: { rutes: [{ ruta: '/', troballes: [{ categoria: 'log:other', falla: false, observacio: true }] }] } };
  assert.equal(resumeix(net).verd, true);
  assert.equal(codiDEixida(net), 0);
  const brut = { escenaris: { rutes: [{ ruta: '/xat', troballes: [{ categoria: 'xarxa', falla: true }, { categoria: 'consola', falla: true }] }, { ruta: '/', troballes: [] }] } };
  assert.deepEqual([resumeix(brut).troballes, resumeix(brut).rutesAmbFalles, resumeix(brut).perCategoria], [2, 1, { xarxa: 1, consola: 1 }]);
  assert.equal(codiDEixida(brut), 1);
  assert.equal(codiDEixida({ ...net, escenaris: { ...net.escenaris, skew: { veredicte: 'roig' } } }), 1);
  assert.equal(codiDEixida({ ...net, escenaris: { ...net.escenaris, skew: { veredicte: 'control-no-falla' } } }), 2);
  assert.equal(codiDEixida({ ...net, infraestructura: 'Chrome no arrenca' }), 2);
  assert.match(resumeix(net).text, /verd/);
});
