// Proves del connector de la Consola (tooling/vite/consola-iaia.mjs): la ruta GET /__iaia/govern.json.
// Ordre del Mestre del 30-10-2026 (B2) · Un Llibre de prova en un repositori git de mkdtemp i un
// servidor de Vite propi en mode middleware en un port efímer (cap xarxa real), que es tanca en acabar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { PassThrough, Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import consolaIaia, {
  ERROR_GOVERN_INTERN, ERROR_JARVIS, ESQUEMA_GOVERN, ESQUEMA_JARVIS, RUTA_GOVERN,
  RUTA_PROGRES_JARVIS, RUTA_PUBLICA_TOT, carregaAmbMarca, compiladorGovern,
  oblidaCorredorJarvis, servixGovern, vocabulariGovern
} from './consola-iaia.mjs';
import { RUTA_LLIBRE } from '../brain/fonts-govern.mjs';
import { PROJECT_DIR } from '../wiki/lib/project_paths.mjs';
import { FONT_GOVERN, normalitzaGovern } from '../../src/sections/consola/govern/governContent.js';
import { vistaMatriu } from '../../src/sections/consola/govern/matriuGovern.js';

const GIT_NET = { ...process.env, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };
for (const clau of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE']) delete GIT_NET[clau];
const git = (cwd, ...args) => execFileSync('git', ['-c', 'user.name=Prova', '-c', 'user.email=prova@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd, env: GIT_NET, encoding: 'utf8' }).trim();

const llibre = (commit) => [
  '# Llibre de prova', '', '## 🔴 2. Matriu P0 · Bloquejants', '',
  '| ID | Àmbit | Estat | Descripció | Fitxers Afectats |', '| :--- | :--- | :---: | :--- | :--- |',
  `| **\`P0-01\`** | **Seguretat** | \`[FET · ${commit}]\` | Fet i comprovat. | \`a.sql\` |`,
  '| **`P0-02`** | **Secrets** | `[PENDENT]` | Rotar. | Panell |', '',
  '## 🟢 4. Matriu P2 · Full de Ruta', '', '| ID | Àmbit | Estat | Descripció |', '| :--- | :--- | :---: | :--- |',
  '| **`P2-01`** | **Portes** | `[BACKLOG]` | Desplegar. |', ''
].join('\n');

/** Un Mas de prova: { arrel, head }. Amb `ambGit: false`, sense repositori; amb `text`, aquell Llibre. */
function mas(t, { ambGit = true, ambLlibre = true, text = null } = {}) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-consola-iaia-')));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  fs.writeFileSync(path.join(arrel, 'index.html'), '<!doctype html><html><body><div id="root"></div></body></html>\n');
  let head = null;
  if (ambGit) {
    git(arrel, 'init', '-q', '-b', 'main');
    git(arrel, 'add', 'index.html');
    git(arrel, 'commit', '-q', '-m', 'primer');
    head = git(arrel, 'rev-parse', 'HEAD');
  }
  if (ambLlibre) {
    fs.mkdirSync(path.join(arrel, path.dirname(RUTA_LLIBRE)), { recursive: true });
    fs.writeFileSync(path.join(arrel, RUTA_LLIBRE), text ?? llibre(head ? head.slice(0, 9) : 'abcdef1'));
  }
  return { arrel, head };
}

/* Els gestors que el connector munta, amb un servidor de mentides.
   Decisió del Mestre (31-10-2026) · consolaIaia() torna el connector de
   desenvolupament i el de la instantània del build: les rutes vives són del primer. */
const connectorDev = (opcions) => consolaIaia(opcions).find((connector) => connector.apply === 'serve');
function gestors(opcions) {
  const rutes = new Map();
  connectorDev(opcions).configureServer({ middlewares: { use: (ruta, gestor) => rutes.set(ruta, gestor) } });
  return rutes;
}
/* Una resposta de mentides que recull el que s'envia. */
function resposta() {
  const r = { statusCode: 200, capcaleres: {}, cos: null };
  r.setHeader = (k, v) => { r.capcaleres[k.toLowerCase()] = v; };
  r.fet = new Promise((resol) => { r.end = (cos) => { r.cos = cos; resol(r); }; });
  return r;
}
const peticio = (method = 'GET', ip = '127.0.0.1') => ({ method, socket: { remoteAddress: ip }, url: RUTA_GOVERN });

test('la ruta és la que llig la Consola, i el connector la munta amb les altres quatre i el corredor Jarvis', () => {
  assert.equal(RUTA_GOVERN, FONT_GOVERN);
  assert.deepEqual([...gestors().keys()], ['/__iaia/consola.json', '/__iaia/mapa.json', '/__iaia/empaquetats.json', RUTA_GOVERN, RUTA_PUBLICA_TOT]);
  assert.equal(connectorDev().apply, 'serve', 'només en desenvolupament: el build no la coneix');
  // El del build no munta cap servidor: només emet la instantània estàtica (instantania-consola.test.mjs).
  assert.deepEqual(consolaIaia().filter((c) => c.configureServer || c.configurePreviewServer).map((c) => c.name), ['sdp:consola-iaia']);
});

test('GET local: 200, JSON sense memòria cau i sdp.govern.v1 que normalitzaGovern accepta, amb les files vives', async (t) => {
  const { arrel, head } = mas(t);
  const res = resposta();
  gestors({ arrelGovern: arrel }).get(RUTA_GOVERN)(peticio(), res);
  await res.fet;
  assert.equal(res.statusCode, 200);
  assert.equal(res.capcaleres['content-type'], 'application/json; charset=utf-8');
  assert.equal(res.capcaleres['cache-control'], 'no-store');
  const cos = JSON.parse(res.cos);
  assert.equal(cos.schema, ESQUEMA_GOVERN);
  assert.equal(cos.head, head);
  const govern = normalitzaGovern(cos);
  const vista = vistaMatriu(govern.matriu, { head: govern.head });
  assert.equal(vista.caducitat.obsoleta, false);
  assert.deepEqual(vista.files.map((f) => [f.id, f.estatVist]), [['P0-01', 'fet'], ['P0-02', 'pendent'], ['P2-01', 'pendent']]);
});

test('fora del mateix ordinador o amb un altre mètode: 403, sense compilar res', async (t) => {
  let compilat = 0;
  const rutes = gestors({ arrelGovern: mas(t).arrel, compiladorGovern: async () => { compilat += 1; return { recullGovern: async () => ({}) }; } });
  for (const [method, ip] of [['GET', '10.0.0.2'], ['GET', '192.168.1.20'], ['POST', '127.0.0.1'], ['DELETE', '::1']]) {
    const res = resposta();
    rutes.get(RUTA_GOVERN)(peticio(method, ip), res);
    await res.fet;
    assert.equal(res.statusCode, 403, `${method} ${ip}`);
    assert.equal(res.cos, 'Forbidden');
  }
  assert.equal(compilat, 0);
});

test('errors controlats: Llibre absent, git absent i taula mal formada tornen 500 amb JSON i el seu codi, mai HTML', async (t) => {
  const casos = [
    ['llibre-absent', mas(t, { ambLlibre: false }).arrel],
    ['git-absent', mas(t, { ambGit: false }).arrel],
    ['taula-mal-formada', mas(t, { text: '## Matriu P0\n\n| ID | Àmbit |\n| --- | --- |\n| A | B |\n' }).arrel],
    ['sense-matriu', mas(t, { text: '# Res\n\nCap matriu.\n' }).arrel]
  ];
  for (const [codi, arrel] of casos) {
    const res = resposta();
    await servixGovern(res, { arrel });
    assert.equal(res.statusCode, 500, codi);
    assert.equal(res.capcaleres['content-type'], 'application/json; charset=utf-8', codi);
    assert.doesNotMatch(res.cos, /^\s*</, codi);
    const cos = JSON.parse(res.cos);
    assert.equal(cos.schema, ESQUEMA_GOVERN, codi);
    assert.equal(cos.codi, codi);
    assert.ok(!cos.error.includes(arrel) && !cos.error.includes('/'), cos.error);
  }
});

test('un error que no és del compilador es diu amb un text fix: cap camí ni cap missatge intern ix', async () => {
  for (const compilador of [
    async () => { throw new Error('/Users/algu/secret/fonts-govern.mjs: SyntaxError'); },
    async () => ({ recullGovern: async () => { throw Object.assign(new Error('EACCES /Users/algu/llibre.md'), { codi: 'fals' }); } })
  ]) {
    const res = resposta();
    await servixGovern(res, { arrel: os.tmpdir(), compilador });
    assert.equal(res.statusCode, 500);
    assert.deepEqual(JSON.parse(res.cos), { schema: ESQUEMA_GOVERN, codi: 'intern', error: ERROR_GOVERN_INTERN });
  }
});

/* Gauntlet f4b (govern, «vocabulari-en-cache») · Expectativa ampliada a propòsit: el vocabulari de la
   Consola (matriuGovern.js) també es carrega amb la marca del seu mtime. Abans: només el compilador. */
test('el compilador i el vocabulari es carreguen pel seu camí, amb la marca del seu mtime (cap dependència de la configuració)', async (t) => {
  const modul = await compiladorGovern();
  assert.equal(typeof modul.recullGovern, 'function');
  assert.equal(modul.RUTA_LLIBRE, RUTA_LLIBRE);
  assert.equal((await vocabulariGovern()).estatDeStatus('[FET I SEGELLAT]'), 'fet');
  const font = fs.readFileSync(new URL('./consola-iaia.mjs', import.meta.url), 'utf8');
  assert.match(font, /import\(`\$\{url\.href\}\?v=\$\{Math\.trunc\(fs\.statSync\(url\)\.mtimeMs\)\}`\)/);
  assert.match(font, /compiladorGovern = \(\) => carregaAmbMarca\(COMPILADOR_GOVERN\)/);
  assert.match(font, /vocabulariGovern = \(\) => carregaAmbMarca\(VOCABULARI_GOVERN\)/);
  assert.doesNotMatch(font, /^import .*(?:fonts-govern|matriuGovern)/m, 'cap import estàtic: un canvi seu no reinicia el servidor');
  // Un mòdul que canvia (amb un altre mtime) es torna a carregar, amb el contingut nou.
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-marca-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const url = pathToFileURL(path.join(dir, 'vocabulari.mjs'));
  fs.writeFileSync(url, "export const estat = 'vell';\n");
  fs.utimesSync(url, new Date(1_800_000_000_000), new Date(1_800_000_000_000));
  assert.equal((await carregaAmbMarca(url)).estat, 'vell');
  fs.writeFileSync(url, "export const estat = 'nou';\n");
  fs.utimesSync(url, new Date(1_800_000_060_000), new Date(1_800_000_060_000));
  assert.equal((await carregaAmbMarca(url)).estat, 'nou');
});

test('la guarda contra el verd sense commit usa el vocabulari d’ara, també pel connector muntat', async (t) => {
  const amb = '| **`P0-03`** | **Nova** | `[IMPLEMENTAT]` | Sense commit. | — |';
  const { arrel } = mas(t, { text: llibre('abcdef1').replace('| Rotar. | Panell |', `| Rotar. | Panell |\n${amb}`) });
  const dAra = async () => ({ estatDeStatus: (s) => (/IMPLEMENTAT/.test(String(s)) ? 'fet' : null) });
  const statusDe = (res) => JSON.parse(res.cos).mcr.requirements.find((r) => r.id === 'P0-03').status;
  // Amb el vocabulari del disc, «[IMPLEMENTAT]» no s'entén: passa literal i la Consola el pinta obsolet.
  const delDisc = resposta();
  await servixGovern(delDisc, { arrel });
  assert.equal(statusDe(delDisc), '[IMPLEMENTAT]');
  // Amb un vocabulari que el llig com a fet, ix sense estat (cap verd sense commit).
  const directe = resposta();
  await servixGovern(directe, { arrel, vocabulari: dAra });
  assert.equal(statusDe(directe), null);
  const muntat = resposta();
  gestors({ arrelGovern: arrel, vocabulariGovern: dAra }).get(RUTA_GOVERN)(peticio(), muntat);
  await muntat.fet;
  assert.equal(muntat.statusCode, 200);
  assert.equal(statusDe(muntat), null);
});

/* Gauntlet f4b (govern, «toleràncies-i-ceiling-sense-prova», N1) · Sense opcions, l'arrel de sempre. */
test('sense opcions, el connector i servixGovern compilen el Llibre de l’arrel del repositori (PROJECT_DIR)', async () => {
  const arrels = [];
  const espia = async () => ({ recullGovern: async (arrel) => { arrels.push(arrel); return { schema: ESQUEMA_GOVERN }; } });
  const muntat = resposta();
  gestors({ compiladorGovern: espia }).get(RUTA_GOVERN)(peticio(), muntat);
  await muntat.fet;
  await servixGovern(resposta(), { compilador: espia });
  assert.equal(muntat.statusCode, 200);
  assert.deepEqual(arrels, [PROJECT_DIR, PROJECT_DIR]);
});

/* Una petició HTTP de veres al servidor de prova. */
function demanaA(port) {
  return (cami) => new Promise((resol, rebutja) => {
    const req = http.request({ host: '127.0.0.1', port, path: cami, method: 'GET', headers: { host: `localhost:${port}`, accept: 'text/html,application/json' } }, (res) => {
      const trossos = [];
      res.on('data', (tros) => trossos.push(tros));
      res.on('end', () => resol({ status: res.statusCode, tipus: res.headers['content-type'] ?? '', text: Buffer.concat(trossos).toString('utf8') }));
    });
    req.on('error', rebutja);
    req.end();
  });
}

async function servidorDeVite(t, arrel, plugins) {
  const { createServer } = await import('vite');
  // appType 'spa': la caiguda a index.html del servidor de desenvolupament, la que tornava l'HTML a /__iaia/govern.json.
  const vite = await createServer({
    root: arrel, configFile: false, logLevel: 'silent', appType: 'spa', optimizeDeps: { noDiscovery: true, include: [] },
    server: { middlewareMode: true, hmr: false, ws: false, watch: null }, plugins
  });
  t.after(() => vite.close());
  const srv = http.createServer(vite.middlewares);
  await new Promise((resol) => srv.listen(0, '127.0.0.1', resol));
  t.after(() => new Promise((resol) => srv.close(resol)));
  return demanaA(srv.address().port);
}

test('dins d’un servidor de Vite de veres: sense el connector, l’SPA; amb el connector, la matriu en JSON', async (t) => {
  const { arrel, head } = mas(t);
  const sense = await (await servidorDeVite(t, arrel, []))(RUTA_GOVERN);
  assert.equal(sense.status, 200);
  assert.match(sense.tipus, /text\/html/, 'el defecte d’abans: l’HTML de l’aplicació');
  const pide = await servidorDeVite(t, arrel, [consolaIaia({ arrelGovern: arrel })]);
  const amb = await pide(RUTA_GOVERN);
  assert.equal(amb.status, 200);
  assert.equal(amb.tipus, 'application/json; charset=utf-8');
  const govern = normalitzaGovern(JSON.parse(amb.text));
  assert.equal(govern.head, head);
  assert.equal(govern.matriu.files.length, 3);
  // Un error també és JSON dins de Vite: l'SPA no se'l menja.
  fs.rmSync(path.join(arrel, RUTA_LLIBRE));
  const error = await pide(RUTA_GOVERN);
  assert.equal(error.status, 500);
  assert.equal(JSON.parse(error.text).codi, 'llibre-absent');
});

/* ── IDEA-60 (T1a) · Proves del corredor Jarvis ─────────────────────────── */
function peticioPostJarvis(cos, {
  ip = '127.0.0.1',
  url = RUTA_PUBLICA_TOT,
  method = 'POST',
  headers = {}
} = {}) {
  const bytes = typeof cos === 'string' ? Buffer.from(cos, 'utf8') : Buffer.from(JSON.stringify(cos), 'utf8');
  const req = Readable.from([bytes]);
  req.method = method;
  req.url = url;
  req.socket = { remoteAddress: ip };
  req.headers = {
    'content-length': String(bytes.length),
    'content-type': 'application/json',
    origin: 'http://localhost:3340',
    host: 'localhost:3340',
    'sec-fetch-site': 'same-origin',
    ...headers
  };
  return req;
}

function falsExecuta() {
  const crides = [];
  const executa = (fitxer, args, opcions) => {
    const proc = new EventEmitter();
    proc.stdout = new PassThrough();
    crides.push({ fitxer, args, opcions, proc });
    return proc;
  };
  return { crides, executa };
}

test('POST local bo: 202 amb el progrés inicial, execFile sense shell, cwd a l’arrel, i el progrés es llig a .json', async (t) => {
  oblidaCorredorJarvis();
  t.after(() => oblidaCorredorJarvis());
  const { crides, executa } = falsExecuta();
  const rutes = gestors({ executaJarvis: executa, arrelJarvis: '/arrel/de/mentides' });
  const gestor = rutes.get(RUTA_PUBLICA_TOT);

  const res = resposta();
  gestor(peticioPostJarvis({ schema: ESQUEMA_JARVIS, notes: 'Arreglem el xat', canals: ['web', 'ios'], sec: false }), res);
  await res.fet;
  assert.equal(res.statusCode, 202);
  assert.equal(res.capcaleres['content-type'], 'application/json; charset=utf-8');
  assert.equal(res.capcaleres['cache-control'], 'no-store');
  assert.deepEqual(JSON.parse(res.cos), {
    schema: ESQUEMA_JARVIS,
    estat: 'en_curs',
    passos: [
      { id: 'web', canal: 'web', titol: '1/2 Web al dia', estat: 'pendent' },
      { id: 'ios', canal: 'ios', titol: '2/2 Apple enviat', estat: 'pendent' }
    ]
  });
  assert.equal(crides.length, 1);
  assert.equal(crides[0].fitxer, process.execPath);
  assert.deepEqual(crides[0].args, ['scripts/botigues/publica-tot.mjs', '--notes', 'Arreglem el xat', '--canals', 'web,ios']);
  assert.equal(crides[0].opcions.cwd, '/arrel/de/mentides');
  assert.equal('shell' in crides[0].opcions, false);

  crides[0].proc.stdout.write('{"pas":"web","estat":"en_curs"}\n{"pas":"web","estat":"fet","text":"a /Users/algu/dist"}\n');
  await new Promise((r) => setImmediate(r));

  const resProgres = resposta();
  gestor({ method: 'GET', url: RUTA_PROGRES_JARVIS, socket: { remoteAddress: '127.0.0.1' }, headers: {} }, resProgres);
  await resProgres.fet;
  assert.equal(resProgres.statusCode, 200);
  const prog1 = JSON.parse(resProgres.cos);
  assert.equal(prog1.estat, 'en_curs');
  assert.deepEqual(prog1.passos, [
    { id: 'web', canal: 'web', titol: '1/2 Web al dia', estat: 'fet', detall: 'a <camí>' },
    { id: 'ios', canal: 'ios', titol: '2/2 Apple enviat', estat: 'pendent' }
  ]);

  // close(0) sense que ios haja dit res -> estat 'error'
  crides[0].proc.emit('close', 0);
  const resTancatError = resposta();
  gestor({ method: 'GET', url: RUTA_PROGRES_JARVIS, socket: { remoteAddress: '127.0.0.1' }, headers: {} }, resTancatError);
  await resTancatError.fet;
  assert.equal(JSON.parse(resTancatError.cos).estat, 'error');

  // Segon cas: ios també diu 'fet' abans de close(0) -> estat 'fet'
  oblidaCorredorJarvis();
  const res2 = resposta();
  gestor(peticioPostJarvis({ schema: ESQUEMA_JARVIS, notes: 'Segona pujada', canals: ['web', 'ios'], sec: false }), res2);
  await res2.fet;
  assert.equal(res2.statusCode, 202);
  crides[1].proc.stdout.write('{"pas":"web","estat":"fet"}\n{"pas":"ios","estat":"fet"}\n');
  await new Promise((r) => setImmediate(r));
  crides[1].proc.emit('close', 0);
  const resTancatFet = resposta();
  gestor({ method: 'GET', url: RUTA_PROGRES_JARVIS, socket: { remoteAddress: '127.0.0.1' }, headers: {} }, resTancatFet);
  await resTancatFet.fet;
  assert.equal(JSON.parse(resTancatFet.cos).estat, 'fet');
});

test('un sol corredor alhora: segon POST mentre corre torna 409 ocupat, i després de close(0) torna 202', async (t) => {
  oblidaCorredorJarvis();
  t.after(() => oblidaCorredorJarvis());
  const { crides, executa } = falsExecuta();
  const gestor = gestors({ executaJarvis: executa }).get(RUTA_PUBLICA_TOT);

  const r1 = resposta();
  gestor(peticioPostJarvis({ schema: ESQUEMA_JARVIS, notes: 'Primera', canals: ['web'], sec: false }), r1);
  await r1.fet;
  assert.equal(r1.statusCode, 202);
  assert.equal(crides.length, 1);

  const r2 = resposta();
  gestor(peticioPostJarvis({ schema: ESQUEMA_JARVIS, notes: 'Segona', canals: ['web'], sec: false }), r2);
  await r2.fet;
  assert.equal(r2.statusCode, 409);
  assert.equal(JSON.parse(r2.cos).codi, 'ocupat');
  assert.equal(crides.length, 1);

  crides[0].proc.emit('close', 0);
  const r3 = resposta();
  gestor(peticioPostJarvis({ schema: ESQUEMA_JARVIS, notes: 'Tercera', canals: ['web'], sec: false }), r3);
  await r3.fet;
  assert.equal(r3.statusCode, 202);
  assert.equal(crides.length, 2);
});

test('el cos: JSON invàlid, schema erroni, notes buides o >500, canal desconegut, sec cadena o cos >4096 bytes', async (t) => {
  oblidaCorredorJarvis();
  t.after(() => oblidaCorredorJarvis());
  const { crides, executa } = falsExecuta();
  const gestor = gestors({ executaJarvis: executa }).get(RUTA_PUBLICA_TOT);

  const invalids = [
    'no es json {',
    { schema: 'altre', notes: 'ok', canals: [], sec: false },
    { schema: ESQUEMA_JARVIS, notes: '   ', canals: [], sec: false },
    { schema: ESQUEMA_JARVIS, notes: 'a'.repeat(501), canals: [], sec: false },
    { schema: ESQUEMA_JARVIS, notes: 'ok', canals: ['tv'], sec: false },
    { schema: ESQUEMA_JARVIS, notes: 'ok', canals: [], sec: 'true' }
  ];
  for (const cos of invalids) {
    const res = resposta();
    gestor(peticioPostJarvis(cos), res);
    await res.fet;
    assert.equal(res.statusCode, 400);
    assert.equal(JSON.parse(res.cos).codi, 'cos');
  }

  const resGran = resposta();
  gestor(peticioPostJarvis({ schema: ESQUEMA_JARVIS, notes: 'ok', canals: [], sec: false }, { headers: { 'content-length': '5000' } }), resGran);
  await resGran.fet;
  assert.equal(resGran.statusCode, 413);
  assert.equal(JSON.parse(resGran.cos).codi, 'mida');
  assert.equal(crides.length, 0);

  for (const text of Object.values(ERROR_JARVIS)) {
    assert.equal(text.includes('/'), false, text);
  }
});

test('fronteres i CSRF (T1a-ARB-01): mètodes, IP externa, Origin/Host/Sec-Fetch-Site i Content-Type', async (t) => {
  oblidaCorredorJarvis();
  t.after(() => oblidaCorredorJarvis());
  const { crides, executa } = falsExecuta();
  const gestor = gestors({ executaJarvis: executa }).get(RUTA_PUBLICA_TOT);
  const cosBo = { schema: ESQUEMA_JARVIS, notes: 'Arreglem el xat', canals: ['web'], sec: true };

  // GET .json sense corredor -> 404 codi 'cap'
  const resCap = resposta();
  gestor({ method: 'GET', url: RUTA_PROGRES_JARVIS, socket: { remoteAddress: '127.0.0.1' }, headers: {} }, resCap);
  await resCap.fet;
  assert.equal(resCap.statusCode, 404);
  assert.equal(JSON.parse(resCap.cos).codi, 'cap');

  // GET local a RUTA_PUBLICA_TOT (sense .json) -> 403
  const resGet = resposta();
  gestor({ method: 'GET', url: RUTA_PUBLICA_TOT, socket: { remoteAddress: '127.0.0.1' }, headers: {} }, resGet);
  await resGet.fet;
  assert.equal(resGet.statusCode, 403);

  // POST/PUT/DELETE a .json -> 403
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const res = resposta();
    gestor({ method, url: RUTA_PROGRES_JARVIS, socket: { remoteAddress: '127.0.0.1' }, headers: {} }, res);
    await res.fet;
    assert.equal(res.statusCode, 403, method);
  }

  // POST des de 192.168.1.20 -> 403
  const resFora = resposta();
  gestor(peticioPostJarvis(cosBo, { ip: '192.168.1.20' }), resFora);
  await resFora.fet;
  assert.equal(resFora.statusCode, 403);

  // CSRF: sense Origin, Origin extern, port diferent, Sec-Fetch-Site cross-site -> 403
  for (const headers of [
    { origin: undefined },
    { origin: 'http://evil.example', host: 'localhost:3340' },
    { origin: 'http://localhost:8080', host: 'localhost:3340' },
    { origin: 'http://localhost:3340', host: 'localhost:3340', 'sec-fetch-site': 'cross-site' }
  ]) {
    const res = resposta();
    gestor(peticioPostJarvis(cosBo, { headers }), res);
    await res.fet;
    assert.equal(res.statusCode, 403);
  }

  // Content-Type text/plain -> 415 codi 'cos'
  const res415 = resposta();
  gestor(peticioPostJarvis(cosBo, { headers: { 'content-type': 'text/plain' } }), res415);
  await res415.fet;
  assert.equal(res415.statusCode, 415);
  assert.equal(JSON.parse(res415.cos).codi, 'cos');
  assert.equal(crides.length, 0);

  // Content-Type application/json; charset=utf-8 -> 202 i --sec al final d'args
  const res202 = resposta();
  gestor(peticioPostJarvis(cosBo, { headers: { 'content-type': 'application/json; charset=utf-8' } }), res202);
  await res202.fet;
  assert.equal(res202.statusCode, 202);
  assert.equal(crides.length, 1);
  assert.equal(crides[0].args.at(-1), '--sec');
});
