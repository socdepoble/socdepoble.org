// @vitest-environment node
/* Fase 0 de l'empaquetat mòbil (261003) · el service worker de l'entrada
   pròpia. S'avalua el public/sw.js REAL (script clàssic) dins d'una màquina
   virtual de Node, amb self, caches i fetch simulats: el que es prova és el
   que es publica. Disseny: _wiki_de_poble/04_escriptori/02_investigacio_ia/
   261003_1330_empaquetat_mobil_claude/FASE0_PWA.txt.
   Closca de les apps (ordre del Mestre, 261007; _wiki_de_poble/02_saber/
   architecture/ADR-2026-10-APPS-DEL-DISPOSITIU.md): les proves de
   contingencia_offline.md §1 que es poden fer sense navegador (instal·lació
   neta sense xarxa, closca desada, actualització, cap HTML fora de /app/*,
   escalfament amb sostres i patró, Authorization i POST mai).
   Revisió F1 (261007): una closca per app (/app/<id>/), confirmada per la
   pàgina d'eixa app amb els recursos que ha carregat; mai la d'una altra app
   ni una a la qual falte un chunk. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, test, vi } from 'vitest';
import { paletaDeTokens, valorDelToken } from './__fixtures__/tokens.js';
import { MISSATGE_ESCALFAMENT, RECURS_AMB_EMPREMTA } from './registre.js';

const CODI = readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
const ORIGEN = 'https://socdepoble.org';
/* La darrera expressió del script és el seu valor: així es lligen les funcions
   i les constants de dalt sense que el fitxer publicat exporte res. */
const LECTURA = '\n;({ classificaPeticio, esRespostaGuardable, esCloscaGuardable, esCamiDApp, camiDeLaClosca, recursosDeLHtml, recursosDeLaClau, esCloscaConfirmada, esDelBuild, llistesDeLaClosca, capcaleresDeLaClosca, recursosPerArrencar, planDEscalfament, cachesAEsborrar, clausSobrants, midaDeLaClau, paginaSenseConnexio, CLASSE, MEMORIA_RECURSOS, MEMORIA_CLOSCA, MEMORIES_VIVES, CAMI_DEL_PORTAL, MAXIM_CLOSQUES, MAXIM_RECURSOS, MAXIM_BYTES, CAPCALERA_MIDA, CAPCALERA_RECURSOS, CAPCALERA_RECURSOS_PAGINA, CSP_SENSE_CONNEXIO, MISSATGE_ESCALFAMENT, RECURS_AMB_EMPREMTA });';

const urlDe = (x) => (typeof x === 'string' ? x : x.url);

/** Cache Storage en memòria: noms → (url → { clau, resposta }), en ordre
 *  d'inserció. Com el de veres, keys() torna la petició desada (amb les seues
 *  capçaleres) i put() d'una URL que ja hi és la mou al final. */
function memoriesFalses(inicials = {}) {
  const entradaDe = ([clau, resposta]) => [urlDe(clau), { clau: typeof clau === 'string' ? { url: clau, headers: new Headers() } : clau, resposta }];
  const memories = new Map(Object.entries(inicials).map(([nom, entrades]) => [nom, new Map(entrades.map(entradaDe))]));
  const memoria = (nom) => {
    if (!memories.has(nom)) memories.set(nom, new Map());
    const entrades = memories.get(nom);
    return {
      match: vi.fn(async (peticio) => entrades.get(urlDe(peticio))?.resposta),
      put: vi.fn(async (clau, resposta) => { entrades.delete(urlDe(clau)); entrades.set(urlDe(clau), { clau, resposta }); }),
      keys: async () => [...entrades.values()].map((entrada) => entrada.clau),
      delete: async (clau) => entrades.delete(urlDe(clau))
    };
  };
  const caches = {
    open: vi.fn(async (nom) => memoria(nom)),
    keys: async () => [...memories.keys()],
    delete: vi.fn(async (nom) => memories.delete(nom))
  };
  return { memories, caches };
}

/** Carrega public/sw.js com ho faria el navegador, amb els dobles que es passen. */
function carregaWorker({ fetch: fetchFals = vi.fn(), caches = memoriesFalses().caches, registration = {} } = {}) {
  const escoltes = new Map();
  const self = {
    location: { origin: ORIGEN },
    registration,
    clients: { claim: vi.fn(async () => {}) },
    skipWaiting: vi.fn(),
    addEventListener: (tipus, funcio) => escoltes.set(tipus, [...(escoltes.get(tipus) || []), funcio])
  };
  const context = vm.createContext({ self, caches, fetch: fetchFals, Request, Response, Headers, URL });
  const api = vm.runInContext(CODI + LECTURA, context, { filename: 'public/sw.js' });
  return { api, escoltes, self, fetch: fetchFals };
}

/** Dispara activate i espera el seu waitUntil. */
async function activa(worker) {
  const pendents = [];
  for (const escolta of worker.escoltes.get('activate')) escolta({ waitUntil: (p) => pendents.push(p) });
  expect(pendents).toHaveLength(1);
  await Promise.all(pendents);
}

/** Una petició com la veu el worker (Request de Node no admet mode 'navigate'). */
function peticio(url, { method = 'GET', mode = 'cors', cache = 'default', headers = {} } = {}) {
  return { url: new URL(url, ORIGEN).href, method, mode, cache, headers: new Headers(headers) };
}

/** Una resposta de xarxa del mateix origen ('basic'), que es pot clonar i llegir. */
function resposta({ status = 200, type = 'basic', redirected = false, headers = {}, cos = '' } = {}) {
  const r = { status, type, redirected, headers: new Headers(headers), cos };
  r.blob = async () => new Blob([cos]);
  r.text = async () => cos;
  r.clone = () => ({ ...r, clonada: true });
  return r;
}

/** Dispara un fetch i torna si s'hi ha respost, la resposta i els waitUntil pendents.
 *  `preloadResponse`: la promesa de la precàrrega de navegació, si n'hi ha. */
async function demana(worker, req, { preloadResponse } = {}) {
  const pendents = [];
  let promesa;
  const esdeveniment = {
    request: req,
    preloadResponse,
    respondWith: (p) => { promesa = Promise.resolve(p); },
    waitUntil: (p) => { pendents.push(p); }
  };
  for (const escolta of worker.escoltes.get('fetch')) escolta(esdeveniment);
  if (!promesa) return { respost: false };
  const valor = await promesa;
  await Promise.all(pendents);
  return { respost: true, resposta: valor };
}

/** Dispara un missatge d'una pàgina i espera la feina; torna quants waitUntil hi ha hagut. */
async function missatge(worker, data, { origin = ORIGEN } = {}) {
  const pendents = [];
  for (const escolta of worker.escoltes.get('message')) escolta({ data, origin, waitUntil: (p) => { pendents.push(p); } });
  await Promise.all(pendents);
  return pendents.length;
}

const descriu = (url, opcions = {}) => {
  const req = peticio(url, opcions);
  return {
    metode: req.method, url: req.url, mode: req.mode, cache: req.cache,
    teAutoritzacio: req.headers.has('authorization'), teRang: req.headers.has('range')
  };
};

const JS = '/assets/index-B5hur-io.js';
const CHUNK_APP = '/assets/AppBar-AbCdEf12.js';
/* La closca com la servix el lloc: l'index.html del build, amb el chunk d'entrada. */
const HTML_CLOSCA = `<!doctype html>
<html lang="ca"><head>
<link rel="stylesheet" href="/fonts/noto-sans.css" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<script type="module" crossorigin src="${JS}"></script>
</head><body class="sdp-root"><div id="root"></div></body></html>
`;
const HTML = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'max-age=3600' };
const htmlDeLaClosca = (cos = HTML_CLOSCA) => resposta({ headers: HTML, cos });
const jsDeLaXarxa = (cos = 'export{}') => resposta({ headers: { 'content-type': 'text/javascript' }, cos });

/** Una clau desada com la deixa el worker: la petició amb la mida a la capçalera. */
const clauDesada = (url, mida) => new Request(new URL(url, ORIGEN).href, { headers: { 'x-sdp-mida': String(mida) } });
/** La clau d'una closca desada: els recursos de l'HTML i, si la pàgina l'ha
 *  confirmada (`pagina` no null), els que la pàgina ha carregat. */
const clauDeCloscaDesada = (recursos, { cami = '/app/bar/', pagina = [CHUNK_APP] } = {}) => new Request(`${ORIGEN}${cami}`, {
  headers: { 'x-sdp-recursos': recursos.join(' '), ...(pagina ? { 'x-sdp-recursos-pagina': pagina.join(' ') || '-' } : {}) }
});
const desatsEn = (desats) => new Map(desats.map((cami) => [`${ORIGEN}${cami}`, { clau: clauDesada(cami, 10), resposta: jsDeLaXarxa() }]));

/** Deixa la closca de l'app de `cami` (que demana `recursos` i, confirmada,
 *  els de `pagina`) i els `desats` a les memòries del worker. Amb `conserva`,
 *  les closques que ja hi havia es queden. */
function preparaClosca(worker, memories, { cami = '/app/bar/', recursos = [JS], pagina = [CHUNK_APP], desats = [JS, CHUNK_APP], closca = htmlDeLaClosca(), conserva = false } = {}) {
  const closques = (conserva && memories.get(worker.api.MEMORIA_CLOSCA)) || new Map();
  closques.set(`${ORIGEN}${cami}`, { clau: clauDeCloscaDesada(recursos, { cami, pagina }), resposta: closca });
  memories.set(worker.api.MEMORIA_CLOSCA, closques);
  memories.set(worker.api.MEMORIA_RECURSOS, desatsEn(desats));
  return closca;
}

/** La clau desada de la closca de `cami`, o undefined. */
const closcaDe = (worker, memories, cami) => (memories.get(worker.api.MEMORIA_CLOSCA) || new Map()).get(`${ORIGEN}${cami}`);

/** Les comprovacions comunes de la pàgina «Sense connexió»: 503, sense script, CSP pròpia i tokens. */
async function comprovaPaginaHonesta(r, worker) {
  expect(r.status).toBe(503);
  expect(r.headers.get('content-type')).toBe('text/html; charset=utf-8');
  expect(r.headers.get('cache-control')).toBe('no-store');
  expect(r.headers.get('content-security-policy')).toBe(worker.api.CSP_SENSE_CONNEXIO);
  expect(worker.api.CSP_SENSE_CONNEXIO).toMatch(/default-src 'none'/);
  const html = await r.text();
  expect(html).toContain('<html lang="ca">');
  expect(html).toContain('Sense connexió');
  expect(html).toContain('<a href="">Torna-ho a provar</a>');
  expect(html).not.toMatch(/<script/i);
  // Cap color inventat: cada hex de la pàgina és el valor d'un token de Pedra Seca.
  const paleta = paletaDeTokens();
  const usats = [...new Set([...html.matchAll(/#[0-9a-f]{3,8}\b/gi)].map((m) => m[0].toLowerCase()))];
  expect(usats.length).toBeGreaterThan(0);
  expect(usats.filter((color) => !paleta.has(color))).toEqual([]);
  // I són els que toquen: fons, títol, cos, botó d'acció i focus en clar; fons i textos en fosc.
  const [clar, fosc] = html.split('@media (prefers-color-scheme: dark)');
  for (const token of ['--sdp-fons-app', '--sdp-text-titol', '--sdp-text-cos', '--sdp-accio-control', '--sdp-sobre-accio', '--sdp-color-focus']) {
    expect(clar, token).toContain(valorDelToken(token));
  }
  // El bloc fosc de tokens.css: fons pedra-900, títol pedra-50 i cos pedra-200.
  for (const primitiu of ['--sdp-pedra-900', '--sdp-pedra-50', '--sdp-pedra-200']) {
    expect(fosc, primitiu).toContain(valorDelToken(primitiu));
  }
  return html;
}

const TEXT_DE_SEMPRE = 'Sóc de Poble necessita la xarxa per a mostrar-te el poble: les dades viuen al servidor i este dispositiu no en guarda cap còpia.';
const TEXT_DE_LES_APPS = 'Esta app encara no està guardada en este dispositiu per a obrir-se sense connexió.';
const senseXarxa = () => vi.fn(async () => { throw new TypeError('Failed to fetch'); });

describe('classificaPeticio (pura)', () => {
  const { api } = carregaWorker();
  const classe = (url, opcions) => api.classificaPeticio(descriu(url, opcions), ORIGEN);

  test('navegacions de l\'origen propi → xarxa primer, també amb consulta (fora de /app/* no es guarden mai)', () => {
    for (const url of ['/', '/pobles/la-torre-de-les-macanes', '/el-meu-perfil?code=abc', '/mur#ancora', '/app/bar/tpv']) {
      expect(classe(url, { mode: 'navigate' }), url).toBe(api.CLASSE.NAVEGACIO);
    }
  });

  test('recursos del build amb empremta a l\'arrel de /assets/ → memòria cau primer', () => {
    for (const url of [JS, '/assets/CalendariSection-DDOaj-1k.js', '/assets/PoblacioSection--ALbCLi-.js',
      '/assets/index-DLAj3yFC.css', '/assets/noto-AbCd_123.woff2', '/assets/x-12345678.mjs']) {
      expect(classe(url), url).toBe(api.CLASSE.RECURS);
    }
  });

  test('l\'API, l\'autenticació i qualsevol altre origen passen sense tocar-los', () => {
    const passen = [
      ['https://abcdefgh.supabase.co/rest/v1/posts?select=*', {}],
      ['https://abcdefgh.supabase.co/auth/v1/token?grant_type=refresh_token', { method: 'POST' }],
      ['/rest/v1/posts', {}],
      ['/auth/v1/user', {}],
      ['/auth/callback.html', { mode: 'navigate' }],
      ['/auth/calendari-google.js', {}],
      ['/functions/v1/traductor', {}],
      ['/storage/v1/object/public/avatars/a.png', {}],
      ['/realtime/v1/websocket', {}],
      ['/api/send', {}],
      ['https://fonts.googleapis.com/css2?family=Noto+Sans', {}],
      ['https://cdn.example.org/assets/index-B5hur-io.js', {}],
      ['http://socdepoble.org/assets/index-B5hur-io.js', {}]
    ];
    for (const [url, opcions] of passen) expect(classe(url, opcions), url).toBeNull();
  });

  test('POST, Authorization, Range, consulta i only-if-cached passen', () => {
    expect(classe(JS, { method: 'POST' })).toBeNull();
    expect(classe('/', { method: 'POST', mode: 'navigate' })).toBeNull();
    expect(classe(JS, { headers: { Authorization: 'Bearer x' } })).toBeNull();
    expect(classe(JS, { headers: { Range: 'bytes=0-10' } })).toBeNull();
    expect(classe(`${JS}?v=1`)).toBeNull();
    expect(classe(JS, { cache: 'only-if-cached', mode: 'no-cors' })).toBeNull();
    expect(api.classificaPeticio({ metode: 'GET', url: 'no és una url', mode: 'cors' }, ORIGEN)).toBeNull();
    expect(api.classificaPeticio(null, ORIGEN)).toBeNull();
  });

  test('una navegació de /app/* amb Authorization o POST tampoc passa pel worker', () => {
    expect(classe('/app/bar/tpv', { mode: 'navigate', headers: { Authorization: 'Bearer x' } })).toBeNull();
    expect(classe('/app/bar/tpv', { mode: 'navigate', method: 'POST' })).toBeNull();
  });

  test('les còpies de public/ dins de /assets/ no tenen empremta i passen', () => {
    for (const url of ['/assets/cc-by-nc-sa.svg', '/assets/pedra-seca.css', '/assets/media_registry.json',
      '/assets/soc_de_poble_ibanez.png', '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
      '/assets/system/ui/og-socdepoble-1200x630.png', '/assets/uploads/gent/avatars/a-12345678.js',
      '/assets/logo-socdepoble-rect-blanc-CMqUaDOP.svg', '/fonts/noto-sans.css', '/rag-index.json',
      '/sw.js', '/manifest.webmanifest', '/apple-touch-icon.png']) {
      expect(classe(url), url).toBeNull();
    }
  });
});

describe('esRespostaGuardable (pura)', () => {
  const { api } = carregaWorker();
  const bona = { status: 200, tipus: 'basic', redirigida: false, contentType: 'text/javascript; charset=utf-8', cacheControl: 'public, max-age=31536000, immutable', cami: JS };

  test('JavaScript i CSS del mateix origen amb 200 i el tipus que toca', () => {
    expect(api.esRespostaGuardable(bona)).toBe(true);
    expect(api.esRespostaGuardable({ ...bona, contentType: 'application/javascript' })).toBe(true);
    expect(api.esRespostaGuardable({ ...bona, cami: '/assets/index-DLAj3yFC.css', contentType: 'text/css' })).toBe(true);
    expect(api.esRespostaGuardable({ ...bona, cami: '/assets/noto-AbCd_123.woff2', contentType: 'font/woff2' })).toBe(true);
  });

  test('mai l\'HTML de la reescriptura SPA, ni opaques, ni errors, ni redirigides, ni no-store', () => {
    expect(api.esRespostaGuardable({ ...bona, contentType: 'text/html; charset=utf-8' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, cami: '/assets/index-DLAj3yFC.css', contentType: 'text/html' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, cami: '/assets/noto-AbCd_123.woff2', contentType: 'text/html' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, tipus: 'opaque', status: 0 })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, tipus: 'cors' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, status: 404 })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, status: 206 })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, redirigida: true })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, cacheControl: 'no-store' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, cacheControl: 'private, max-age=60' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, contentType: '' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, contentType: 'text/css' })).toBe(false);
    expect(api.esRespostaGuardable({ ...bona, cami: '/assets/cc-by-nc-sa.svg', contentType: 'image/svg+xml' })).toBe(false);
    expect(api.esRespostaGuardable(null)).toBe(false);
  });
});

describe('memòries: neteja i poda (pures)', () => {
  const { api } = carregaWorker();

  test('en activar s\'esborren les versions velles pròpies i les de Workbox; res més', () => {
    const noms = [api.MEMORIA_RECURSOS, 'sdp-pwa-recursos-v0', 'sdp-pwa-una-altra',
      'workbox-precache-v2-https://socdepoble.org/', 'sdp-salut', 'una-memoria-dalgu'];
    expect(Array.from(api.cachesAEsborrar(noms, api.MEMORIA_RECURSOS)))
      .toEqual(['sdp-pwa-recursos-v0', 'sdp-pwa-una-altra', 'workbox-precache-v2-https://socdepoble.org/']);
    expect(api.MEMORIA_RECURSOS).toBe('sdp-pwa-recursos-v1');
  });

  test('amb la closca, les dos memòries vives es queden i les versions velles de totes dos ixen', () => {
    expect(api.MEMORIA_CLOSCA).toBe('sdp-pwa-closca-v1');
    expect(Array.from(api.MEMORIES_VIVES)).toEqual(['sdp-pwa-recursos-v1', 'sdp-pwa-closca-v1']);
    const noms = ['sdp-pwa-recursos-v1', 'sdp-pwa-closca-v1', 'sdp-pwa-closca-v0', 'sdp-pwa-recursos-v0', 'workbox-x', 'sdp-bar'];
    expect(Array.from(api.cachesAEsborrar(noms, api.MEMORIES_VIVES))).toEqual(['sdp-pwa-closca-v0', 'sdp-pwa-recursos-v0', 'workbox-x']);
  });

  const entrades = (...mides) => mides.map((mida, i) => ({ clau: String.fromCharCode(97 + i), mida }));
  const sobrants = (llista, maxim, maximBytes) => Array.from(api.clausSobrants(llista, maxim, maximBytes));

  test('la poda lleva les claus més velles per damunt del màxim d\'entrades', () => {
    expect(sobrants(entrades(1, 1, 1), 5, 100)).toEqual([]);
    expect(sobrants(entrades(1, 1, 1), 3, 100)).toEqual([]);
    expect(sobrants(entrades(1, 1, 1, 1), 2, 100)).toEqual(['a', 'b']);
    expect(sobrants([], 2, 100)).toEqual([]);
  });

  test('i per damunt del màxim de bytes, encara que hi càpiguen les entrades', () => {
    // Dos chunks d'entrada vells (~1 MB) i un de nou: fora els vells fins que hi cap.
    expect(sobrants(entrades(60, 60, 10, 60), 10, 100)).toEqual(['a', 'b']);
    expect(sobrants(entrades(40, 40, 20), 10, 100)).toEqual([]);
    expect(sobrants(entrades(50, 51), 10, 100)).toEqual(['a']);
  });

  test('la més nova no s\'esborra mai, ni si tota sola passa del sostre', () => {
    expect(sobrants(entrades(10, 500), 10, 100)).toEqual(['a']);
    expect(sobrants(entrades(500), 10, 100)).toEqual([]);
    expect(sobrants(entrades(1, 1, 1), 0, 100)).toEqual(['a', 'b']);
  });

  test('la mida es llig de la clau; sense mida, compta zero', () => {
    const clau = (valor) => ({ headers: new Headers(valor === undefined ? {} : { [api.CAPCALERA_MIDA]: valor }) });
    expect(api.midaDeLaClau(clau('1056190'))).toBe(1056190);
    expect(api.midaDeLaClau(clau(undefined))).toBe(0);
    expect(api.midaDeLaClau(clau('no'))).toBe(0);
    expect(api.midaDeLaClau(clau('-5'))).toBe(0);
    expect(api.midaDeLaClau({ url: 'x' })).toBe(0);
    expect(api.midaDeLaClau(null)).toBe(0);
  });

  test('els sostres: més entrades que chunks té un build i més del doble del seu JS', () => {
    expect(api.MAXIM_RECURSOS).toBe(300);
    expect(api.MAXIM_BYTES).toBe(8 * 1024 * 1024);
    expect(api.CAPCALERA_MIDA).toBe('x-sdp-mida');
  });
});

describe('la closca de les apps (pures)', () => {
  const { api } = carregaWorker();

  test('/app i el que penja de /app/ són apps; /apps, /application i la resta, no', () => {
    for (const cami of ['/app', '/app/', '/app/bar/tpv', '/app/gestoria/tauler']) expect(api.esCamiDApp(cami), cami).toBe(true);
    for (const cami of ['/', '/apps', '/application', '/mur', '/xat/app', '', undefined]) expect(api.esCamiDApp(cami), String(cami)).toBe(false);
  });

  test('revisió F1: cada app té la seua closca (/app/<id>/) i el portal la seua (/app/)', () => {
    expect(api.CAMI_DEL_PORTAL).toBe('/app/');
    for (const [cami, clau] of [
      ['/app', '/app/'], ['/app/', '/app/'],
      ['/app/bar', '/app/bar/'], ['/app/bar/', '/app/bar/'], ['/app/bar/tpv', '/app/bar/'], ['/app/bar/taules/t-3', '/app/bar/'],
      ['/app/gestoria/tauler', '/app/gestoria/'], ['/app/salut_2/x', '/app/salut_2/'], ['/app/9a', '/app/9a/']
    ]) {
      expect(api.camiDeLaClosca(cami), cami).toBe(clau);
    }
  });

  test('un camí sense app vàlida (com la valida la Plataforma) no té closca', () => {
    for (const cami of ['/', '/mur', '/apps', '/apps/bar', '/application', '/app//bar', '/app/Bar', '/app/BAR/tpv',
      '/app/b%C3%A0r', '/app/-bar', '/app/_bar', `/app/${'a'.repeat(65)}`, '', null, undefined, 42]) {
      expect(api.camiDeLaClosca(cami), String(cami)).toBeNull();
    }
    expect(api.camiDeLaClosca(`/app/${'a'.repeat(64)}/x`)).toBe(`/app/${'a'.repeat(64)}/`);
  });

  const bona = { status: 200, tipus: 'basic', redirigida: false, contentType: 'text/html; charset=utf-8', cacheControl: 'max-age=3600', cami: '/app/bar/tpv', consulta: false };

  test('es guarda la navegació bona de /app/*: 200, mateix origen, HTML, sense consulta ni redirecció', () => {
    expect(api.esCloscaGuardable(bona)).toBe(true);
    expect(api.esCloscaGuardable({ ...bona, cami: '/app', cacheControl: '' })).toBe(true);
  });

  test('mai fora de /app/*, ni sense app vàlida, ni amb consulta, error, redirecció, opaca, no-store, private o un altre tipus', () => {
    for (const cami of ['/', '/mur', '/apps', '/application', '/app/BAR', '/app//bar']) expect(api.esCloscaGuardable({ ...bona, cami }), cami).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, consulta: true })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, status: 500 })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, status: 304 })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, redirigida: true })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, tipus: 'opaqueredirect', status: 0 })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, tipus: 'cors' })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, cacheControl: 'no-store' })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, cacheControl: 'private, max-age=60' })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, contentType: 'application/json' })).toBe(false);
    expect(api.esCloscaGuardable({ ...bona, contentType: '' })).toBe(false);
    expect(api.esCloscaGuardable(null)).toBe(false);
  });

  test('els recursos que demana un HTML: els src i href amb empremta, sense repetir', () => {
    const html = `${HTML_CLOSCA}<link rel="modulepreload" crossorigin href="/assets/vendor-AbCd_123.js">
<link rel="stylesheet" href="/assets/index-DLAj3yFC.css"><script src="${JS}"></script>
<link href="/assets/system/ui/logo.svg"><script src="/assets/x-12345678.js?v=1"></script>`;
    expect(Array.from(api.recursosDeLHtml(html))).toEqual([JS, '/assets/vendor-AbCd_123.js', '/assets/index-DLAj3yFC.css']);
    expect(Array.from(api.recursosDeLHtml(''))).toEqual([]);
    expect(Array.from(api.recursosDeLHtml(null))).toEqual([]);
  });

  test('els camins queden en ASCII, com el pathname d\'una petició (poden viatjar en una capçalera); amb fragment, fora', () => {
    const html = '<script src="/assets/Notícia-AbCdEf12.js"></script><link href="/assets/x-12345678.css#a">';
    const camins = Array.from(api.recursosDeLHtml(html));
    expect(camins).toEqual(['/assets/Not%C3%ADcia-AbCdEf12.js']);
    expect(camins[0]).toBe(new URL('/assets/Notícia-AbCdEf12.js', ORIGEN).pathname);
    expect(() => new Headers({ [api.CAPCALERA_RECURSOS]: camins.join(' ') })).not.toThrow();
  });

  test('l\'index.html de desenvolupament (/src/main.jsx) no demana cap recurs amb empremta: no és una closca', () => {
    const index = readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
    expect(Array.from(api.recursosDeLHtml(index))).toEqual([]);
  });

  test('els recursos d\'una clau desada; una clau sense capçalera no en porta cap', () => {
    expect(api.CAPCALERA_RECURSOS).toBe('x-sdp-recursos');
    expect(Array.from(api.recursosDeLaClau(clauDeCloscaDesada([JS, '/assets/vendor-AbCd_123.js'])))).toEqual([JS, '/assets/vendor-AbCd_123.js']);
    expect(Array.from(api.recursosDeLaClau(clauDeCloscaDesada(['/rest/v1/x', JS])))).toEqual([JS]);
    expect(Array.from(api.recursosDeLaClau(new Request(`${ORIGEN}/app/`)))).toEqual([]);
    expect(Array.from(api.recursosDeLaClau(null))).toEqual([]);
  });

  test('els recursos que la pàgina ha confirmat van a una capçalera a banda; sense ella, la closca no està confirmada', () => {
    expect(api.CAPCALERA_RECURSOS_PAGINA).toBe('x-sdp-recursos-pagina');
    const confirmada = clauDeCloscaDesada([JS], { pagina: [CHUNK_APP, '/rest/v1/x'] });
    expect(Array.from(api.recursosDeLaClau(confirmada, api.CAPCALERA_RECURSOS_PAGINA))).toEqual([CHUNK_APP]);
    expect(api.esCloscaConfirmada(confirmada)).toBe(true);
    // Una confirmació sense cap recurs més que els de l'HTML s'escriu '-'.
    const buida = clauDeCloscaDesada([JS], { pagina: [] });
    expect(buida.headers.get('x-sdp-recursos-pagina')).toBe('-');
    expect(api.esCloscaConfirmada(buida)).toBe(true);
    expect(Array.from(api.recursosDeLaClau(buida, api.CAPCALERA_RECURSOS_PAGINA))).toEqual([]);
    expect(api.esCloscaConfirmada(clauDeCloscaDesada([JS], { pagina: null }))).toBe(false);
    expect(api.esCloscaConfirmada(null)).toBe(false);
  });

  test('una pàgina és del build d\'un HTML si n\'ha carregat tots els recursos', () => {
    expect(api.esDelBuild([JS], [JS, CHUNK_APP])).toBe(true);
    expect(api.esDelBuild([JS, '/assets/index-DLAj3yFC.css'], [JS])).toBe(false);
    expect(api.esDelBuild(['/assets/index-VELL0000.js'], [JS, CHUNK_APP])).toBe(false);
    expect(api.esDelBuild([], [JS])).toBe(false);
    expect(api.esDelBuild([JS], null)).toBe(false);
  });

  test('les llistes d\'una closca nova: una navegació del mateix build conserva la confirmació; d\'un altre build, la perd', () => {
    const vista = '/assets/Tpv-AbCdEf12.js';
    const mateix = api.llistesDeLaClosca([JS], { html: [JS], pagina: [CHUNK_APP, vista] }, null);
    expect(Array.from(mateix.html)).toEqual([JS]);
    expect(Array.from(mateix.pagina)).toEqual([CHUNK_APP, vista]);
    expect(api.llistesDeLaClosca([JS], { html: ['/assets/index-VELL0000.js'], pagina: [CHUNK_APP] }, null).pagina).toBeNull();
    expect(api.llistesDeLaClosca([JS], { html: [JS], pagina: null }, null).pagina).toBeNull();
    expect(api.llistesDeLaClosca([JS], null, null).pagina).toBeNull();
  });

  test('les llistes d\'una closca: la pàgina la confirma amb la unió del que ja hi havia i el que ha carregat, sense l\'HTML ni repetir', () => {
    const vista = '/assets/Tpv-AbCdEf12.js';
    expect(Array.from(api.llistesDeLaClosca([JS], null, [JS, CHUNK_APP]).pagina)).toEqual([CHUNK_APP]);
    expect(Array.from(api.llistesDeLaClosca([JS], { html: [JS], pagina: [CHUNK_APP] }, [JS, vista, CHUNK_APP]).pagina)).toEqual([CHUNK_APP, vista]);
    expect(Array.from(api.llistesDeLaClosca([JS], { html: ['/assets/index-VELL0000.js'], pagina: [CHUNK_APP] }, [JS, vista]).pagina)).toEqual([vista]);
    expect(Array.from(api.llistesDeLaClosca([JS], null, [JS]).pagina)).toEqual([]);
  });

  test('una closca es dona només confirmada i amb tots els seus recursos; mai si en demana més dels que caben a la memòria', () => {
    expect(Array.from(api.recursosPerArrencar(clauDeCloscaDesada([JS], { pagina: [CHUNK_APP] })))).toEqual([JS, CHUNK_APP]);
    expect(Array.from(api.recursosPerArrencar(clauDeCloscaDesada([JS], { pagina: [] })))).toEqual([JS]);
    expect(api.recursosPerArrencar(clauDeCloscaDesada([JS], { pagina: null }))).toBeNull();
    expect(api.recursosPerArrencar(clauDeCloscaDesada([], { pagina: [CHUNK_APP] }))).toBeNull();
    expect(api.recursosPerArrencar(null)).toBeNull();
    // La llista no creix sense límit: com a molt una més de les que caben, i llavors no es dona.
    const molts = Array.from({ length: 400 }, (_, i) => `/assets/vista${i}-AbCdEf12.js`);
    const llistes = api.llistesDeLaClosca([JS], null, molts);
    expect(llistes.html.length + llistes.pagina.length).toBe(api.MAXIM_RECURSOS + 1);
    expect(api.recursosPerArrencar(new Request(`${ORIGEN}/app/bar/`, { headers: api.capcaleresDeLaClosca(llistes) }))).toBeNull();
    const justos = api.llistesDeLaClosca([JS], null, molts.slice(0, api.MAXIM_RECURSOS - 1));
    expect(api.recursosPerArrencar(new Request(`${ORIGEN}/app/bar/`, { headers: api.capcaleresDeLaClosca(justos) }))).toHaveLength(api.MAXIM_RECURSOS);
  });

  test('el missatge d\'escalfament: només recursos amb empremta de l\'origen propi, sense consulta ni repetir', () => {
    const pla = api.planDEscalfament({
      tipus: 'sdp-escalfa',
      recursos: [JS, `${ORIGEN}${CHUNK_APP}`, JS, 'https://altre.org/assets/x-12345678.js', '//altre.org/assets/x-12345678.js',
        `${JS}?v=1`, '/assets/cc-by-nc-sa.svg', '/assets/system/ui/a-12345678.js', '/rest/v1/x-12345678.js',
        'https://usuari:clau@socdepoble.org/assets/x-12345678.js', 42, null, {}],
      closca: '/app/bar/tpv'
    }, ORIGEN);
    expect(Array.from(pla.recursos)).toEqual([JS, CHUNK_APP]);
    expect(pla.closca).toBe('/app/bar/tpv');
  });

  test('la closca d\'un missatge: només un camí de /app/* amb app vàlida, de l\'origen propi i sense consulta', () => {
    const closca = (valor) => api.planDEscalfament({ tipus: 'sdp-escalfa', recursos: [JS], closca: valor }, ORIGEN).closca;
    expect(closca('/app')).toBe('/app');
    expect(closca(`${ORIGEN}/app/gestoria/tauler#res`)).toBe('/app/gestoria/tauler');
    for (const valor of ['/app/bar?code=secret', '/mur', '/apps', '/app/BAR', '/app//bar', 'https://altre.org/app/bar', '//altre.org/app/bar', 42, undefined]) {
      expect(closca(valor), String(valor)).toBeNull();
    }
  });

  test('el missatge: com a molt MAXIM_RECURSOS recursos, i res si no és d\'escalfament o no porta res vàlid', () => {
    const molts = Array.from({ length: 400 }, (_, i) => `/assets/chunk${i}-AbCdEf12.js`);
    expect(api.planDEscalfament({ tipus: 'sdp-escalfa', recursos: molts }, ORIGEN).recursos).toHaveLength(api.MAXIM_RECURSOS);
    for (const dades of [null, undefined, 'sdp-escalfa', 42, {}, { tipus: 'altre', recursos: [JS] }, { type: 'CACHE_URLS', recursos: [JS] },
      { tipus: 'sdp-escalfa' }, { tipus: 'sdp-escalfa', recursos: ['/rag-index.json'], closca: '/mur' }]) {
      expect(api.planDEscalfament(dades, ORIGEN), JSON.stringify(dades)).toBeNull();
    }
  });

  test('el patró i el tipus de missatge són els mateixos que els de la pàgina (src/pwa/registre.js)', () => {
    expect(api.RECURS_AMB_EMPREMTA.source).toBe(RECURS_AMB_EMPREMTA.source);
    expect(api.RECURS_AMB_EMPREMTA.flags).toBe(RECURS_AMB_EMPREMTA.flags);
    expect(api.MISSATGE_ESCALFAMENT).toBe(MISSATGE_ESCALFAMENT);
  });
});

describe('el worker en marxa', () => {
  test('només escolta activate, fetch i message (l\'escalfament): cap skipWaiting, cap push ni sync, cap importScripts', () => {
    const worker = carregaWorker();
    expect([...worker.escoltes.keys()].sort()).toEqual(['activate', 'fetch', 'message']);
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
    expect(CODI).not.toMatch(/skipWaiting\s*\(/);
    expect(CODI).not.toMatch(/importScripts\s*\(/);
    expect(CODI).not.toMatch(/\b(?:indexedDB|localStorage|sessionStorage)\b/);
  });

  test('navegació fora de /app/* amb xarxa: la resposta del servidor tal qual, sense obrir cap memòria', async () => {
    const { caches } = memoriesFalses();
    const servidor = resposta({ headers: { 'content-type': 'text/html' }, cos: '<!doctype html>' });
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => servidor) });
    const req = peticio('/pobles?code=secret', { mode: 'navigate' });
    const { respost, resposta: r } = await demana(worker, req);
    expect(respost).toBe(true);
    expect(r).toBe(servidor);
    expect(worker.fetch).toHaveBeenCalledWith(req);
    expect(caches.open).not.toHaveBeenCalled();
  });

  test('navegació amb error del servidor: l\'error arriba tal qual (honest)', async () => {
    const error = resposta({ status: 500, headers: { 'content-type': 'text/html' } });
    const worker = carregaWorker({ fetch: vi.fn(async () => error) });
    expect((await demana(worker, peticio('/', { mode: 'navigate' }))).resposta).toBe(error);
  });

  test('navegació amb precàrrega: la resposta precarregada, sense un segon fetch ni cap memòria', async () => {
    const { caches } = memoriesFalses();
    const precarregada = resposta({ headers: { 'content-type': 'text/html' }, cos: '<!doctype html>' });
    const worker = carregaWorker({ caches, fetch: vi.fn() });
    const { resposta: r } = await demana(worker, peticio('/mur', { mode: 'navigate' }), { preloadResponse: Promise.resolve(precarregada) });
    expect(r).toBe(precarregada);
    expect(worker.fetch).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
  });

  test('precàrrega buida o fallida: la xarxa una vegada; sense xarxa, la pàgina honesta', async () => {
    const servidor = resposta({ headers: { 'content-type': 'text/html' } });
    const buida = carregaWorker({ fetch: vi.fn(async () => servidor) });
    expect((await demana(buida, peticio('/', { mode: 'navigate' }), { preloadResponse: Promise.resolve(undefined) })).resposta).toBe(servidor);
    expect(buida.fetch).toHaveBeenCalledTimes(1);

    const fallida = carregaWorker({ fetch: vi.fn(async () => servidor) });
    expect((await demana(fallida, peticio('/', { mode: 'navigate' }), { preloadResponse: Promise.reject(new TypeError('Failed to fetch')) })).resposta).toBe(servidor);
    expect(fallida.fetch).toHaveBeenCalledTimes(1);

    const sense = carregaWorker({ fetch: senseXarxa() });
    const { resposta: r } = await demana(sense, peticio('/', { mode: 'navigate' }), { preloadResponse: Promise.reject(new TypeError('Failed to fetch')) });
    expect(r.status).toBe(503);
  });

  test('navegació sense xarxa: pàgina «Sense connexió» 503, sense script, amb CSP pròpia i el text de sempre', async () => {
    const { caches } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    const { resposta: r } = await demana(worker, peticio('/mur', { mode: 'navigate' }));
    const html = await comprovaPaginaHonesta(r, worker);
    expect(html).toContain(TEXT_DE_SEMPRE);
    expect(html).not.toContain(TEXT_DE_LES_APPS);
    expect(caches.open).not.toHaveBeenCalled();
  });

  test('recurs amb empremta: la primera vegada de la xarxa i es guarda amb la seua mida; la segona, de la memòria', async () => {
    const { caches, memories } = memoriesFalses();
    const xarxa = jsDeLaXarxa();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => xarxa) });

    const primera = await demana(worker, peticio(JS, { headers: { accept: '*/*' } }));
    expect(primera.resposta).toBe(xarxa);
    expect(worker.fetch).toHaveBeenCalledTimes(1);
    const desades = memories.get(worker.api.MEMORIA_RECURSOS);
    expect([...desades.keys()]).toEqual([`${ORIGEN}${JS}`]);
    const { clau, resposta: desada } = desades.get(`${ORIGEN}${JS}`);
    // La resposta es guarda intacta (una còpia); la mida va a la clau, que conserva
    // les capçaleres de la petició perquè un Vary del servidor continue casant.
    expect(desada.clonada).toBe(true);
    expect(desada.status).toBe(200);
    expect(clau.url).toBe(`${ORIGEN}${JS}`);
    expect(clau.headers.get(worker.api.CAPCALERA_MIDA)).toBe(String('export{}'.length));
    expect(clau.headers.get('accept')).toBe('*/*');

    const segona = await demana(worker, peticio(JS));
    expect(segona.resposta).toBe(desada);
    expect(worker.fetch).toHaveBeenCalledTimes(1);
    expect([...memories.keys()]).toEqual([worker.api.MEMORIA_RECURSOS]);
  });

  test('un chunk que ja no existix (index.html de la reescriptura SPA) es torna però no es guarda', async () => {
    const { caches, memories } = memoriesFalses();
    const html = resposta({ headers: { 'content-type': 'text/html' }, cos: '<!doctype html>' });
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => html) });
    expect((await demana(worker, peticio(JS))).resposta).toBe(html);
    expect([...(memories.get(worker.api.MEMORIA_RECURSOS) || new Map()).keys()]).toEqual([]);
  });

  test('l\'API i els recursos sense empremta no passen pel worker ni per la memòria', async () => {
    const { caches } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn() });
    for (const req of [
      peticio('/rest/v1/posts'),
      peticio('https://abcdefgh.supabase.co/rest/v1/posts'),
      peticio('/auth/v1/token', { method: 'POST' }),
      peticio(JS, { headers: { authorization: 'Bearer x' } }),
      peticio('/assets/system/ui/og-socdepoble-1200x630.png'),
      peticio('/rag-index.json')
    ]) {
      expect((await demana(worker, req)).respost, req.url).toBe(false);
    }
    expect(worker.fetch).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
  });

  test('si la memòria falla (quota, mode privat), el recurs ve de la xarxa', async () => {
    const xarxa = resposta({ headers: { 'content-type': 'text/javascript' } });
    const caches = { open: vi.fn(async () => { throw new Error('quota'); }), keys: async () => [], delete: async () => false };
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => xarxa) });
    expect((await demana(worker, peticio(JS))).resposta).toBe(xarxa);
  });

  test('la poda deixa la memòria en el màxim d\'entrades i lleva la més vella', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => resposta({ headers: { 'content-type': 'text/javascript' } })) });
    const maxim = worker.api.MAXIM_RECURSOS;
    const plenes = Array.from({ length: maxim }, (_, i) => {
      const url = `${ORIGEN}/assets/vell${i}-AAAAAAAA.js`;
      return [url, { clau: clauDesada(url, 1000), resposta: resposta() }];
    });
    memories.set(worker.api.MEMORIA_RECURSOS, new Map(plenes));
    await demana(worker, peticio(JS));
    const claus = [...memories.get(worker.api.MEMORIA_RECURSOS).keys()];
    expect(claus).toHaveLength(maxim);
    expect(claus).not.toContain(`${ORIGEN}/assets/vell0-AAAAAAAA.js`);
    expect(claus.at(-1)).toBe(`${ORIGEN}${JS}`);
  });

  test('la poda per bytes: els chunks d\'entrada de desplegaments vells ixen, el build viu es queda', async () => {
    const { caches, memories } = memoriesFalses();
    const MB = 1024 * 1024;
    const nou = 'a'.repeat(MB);
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => resposta({ headers: { 'content-type': 'text/javascript' }, cos: nou })) });
    // Set desplegaments vells d'1 MB cadascun i un chunk menut viu: 7 MB + 1 kB.
    const velles = Array.from({ length: 7 }, (_, i) => `${ORIGEN}/assets/index-VELL000${i}.js`);
    memories.set(worker.api.MEMORIA_RECURSOS, new Map([
      ...velles.map((url) => [url, { clau: clauDesada(url, MB), resposta: resposta() }]),
      [`${ORIGEN}/assets/Pista-BYY5kVd1.js`, { clau: clauDesada('/assets/Pista-BYY5kVd1.js', 1024), resposta: resposta() }]
    ]));
    await demana(worker, peticio(JS)); // un chunk d'entrada nou d'1 MB: 8 MB + 1 kB > 8 MB
    const claus = [...memories.get(worker.api.MEMORIA_RECURSOS).keys()];
    expect(claus).not.toContain(velles[0]);
    expect(claus).toContain(velles[1]);
    expect(claus).toContain(`${ORIGEN}/assets/Pista-BYY5kVd1.js`);
    expect(claus.at(-1)).toBe(`${ORIGEN}${JS}`);
    const total = [...memories.get(worker.api.MEMORIA_RECURSOS).values()].reduce((suma, { clau }) => suma + worker.api.midaDeLaClau(clau), 0);
    expect(total).toBeLessThanOrEqual(worker.api.MAXIM_BYTES);
  });

  test('activate esborra només les memòries velles pròpies i les de Workbox, i reclama els clients', async () => {
    const { caches, memories } = memoriesFalses({
      'sdp-pwa-recursos-v0': [], 'sdp-pwa-recursos-v1': [], 'workbox-precache-v2-x': [], 'sdp-salut': [], 'altra': []
    });
    const worker = carregaWorker({ caches });
    await activa(worker);
    expect([...memories.keys()].sort()).toEqual(['altra', 'sdp-pwa-recursos-v1', 'sdp-salut']);
    expect(worker.self.clients.claim).toHaveBeenCalledTimes(1);
  });

  test('activate encén la precàrrega de navegació; sense suport, o si falla, activa igual', async () => {
    const enable = vi.fn(async () => {});
    const amb = carregaWorker({ registration: { navigationPreload: { enable } } });
    await activa(amb);
    expect(enable).toHaveBeenCalledTimes(1);
    expect(amb.self.clients.claim).toHaveBeenCalledTimes(1);

    const sense = carregaWorker({ registration: {} });
    await activa(sense);
    expect(sense.self.clients.claim).toHaveBeenCalledTimes(1);

    const falla = carregaWorker({ registration: { navigationPreload: { enable: () => { throw new Error('InvalidStateError'); } } } });
    await activa(falla);
    expect(falla.self.clients.claim).toHaveBeenCalledTimes(1);
  });
});

describe('la closca de les apps en marxa (contingencia_offline.md §1)', () => {
  test('instal·lació neta i primera visita sense xarxa: sense closca, la pàgina honesta de les apps (503)', async () => {
    const { caches } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    const { resposta: r } = await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    const html = await comprovaPaginaHonesta(r, worker);
    expect(html).toContain(TEXT_DE_LES_APPS);
    expect(html).not.toContain(TEXT_DE_SEMPRE);
  });

  test('navegació a /app/* amb xarxa: la resposta tal qual i una còpia a la closca de l\'app, amb els recursos de l\'HTML a la clau i encara sense confirmar', async () => {
    const { caches, memories } = memoriesFalses();
    const servidor = htmlDeLaClosca();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => servidor) });
    const { resposta: r } = await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    expect(r).toBe(servidor);
    const closca = memories.get(worker.api.MEMORIA_CLOSCA);
    expect([...closca.keys()]).toEqual([`${ORIGEN}/app/bar/`]);
    const { clau, resposta: desada } = closca.get(`${ORIGEN}/app/bar/`);
    expect(clau.headers.get('x-sdp-recursos')).toBe(JS);
    expect(clau.headers.has('x-sdp-recursos-pagina')).toBe(false);
    expect(desada.clonada).toBe(true);
    expect(desada.cos).toBe(HTML_CLOSCA);
    // L'HTML no entra mai a la memòria dels recursos.
    expect(memories.has(worker.api.MEMORIA_RECURSOS)).toBe(false);
  });

  test('la precàrrega d\'una navegació de /app/* també deixa la closca (la del portal, per a /app), sense un segon fetch', async () => {
    const { caches, memories } = memoriesFalses();
    const precarregada = htmlDeLaClosca();
    const worker = carregaWorker({ caches, fetch: vi.fn() });
    const { resposta: r } = await demana(worker, peticio('/app', { mode: 'navigate' }), { preloadResponse: Promise.resolve(precarregada) });
    expect(r).toBe(precarregada);
    expect(worker.fetch).not.toHaveBeenCalled();
    expect([...memories.get(worker.api.MEMORIA_CLOSCA).keys()]).toEqual([`${ORIGEN}/app/`]);
  });

  test('closca confirmada i tots els seus recursos desats: sense xarxa, les rutes d\'eixa app arrenquen amb ella', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    const closca = preparaClosca(worker, memories);
    for (const ruta of ['/app/bar/tpv', '/app/bar', '/app/bar/taules/t-3']) {
      const { resposta: r } = await demana(worker, peticio(ruta, { mode: 'navigate' }), { preloadResponse: Promise.reject(new TypeError('Failed to fetch')) });
      expect(r, ruta).toBe(closca);
    }
  });

  test('revisió F1: mai la closca d\'una altra app; una app sense closca pròpia, o el portal, reben la pàgina honesta de les apps', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    preparaClosca(worker, memories);
    for (const ruta of ['/app/gestoria/tauler', '/app', '/app/BAR/tpv']) {
      const { resposta: r } = await demana(worker, peticio(ruta, { mode: 'navigate' }));
      expect(r.status, ruta).toBe(503);
      expect(await r.text(), ruta).toContain(TEXT_DE_LES_APPS);
    }
  });

  test('revisió F1: després d\'un desplegament, la visita a una altra app no canvia la closca de la primera, que arrenca amb el seu build', async () => {
    const { caches, memories } = memoriesFalses();
    const N = { entrada: '/assets/index-BuildNNN.js', ruta: '/assets/RutaApps-BuildNNN.js', bar: '/assets/AppBar-BuildNNN.js' };
    const M = { entrada: '/assets/index-BuildMMM.js', ruta: '/assets/RutaApps-BuildMMM.js', gestoria: '/assets/AppGestoria-BuildMMM.js' };
    const htmlN = htmlDeLaClosca(HTML_CLOSCA.replace(JS, N.entrada));
    const htmlM = htmlDeLaClosca(HTML_CLOSCA.replace(JS, M.entrada));
    // 1. Build N: la persona ha obert /app/bar amb xarxa i la pàgina ha confirmat la closca.
    const worker = carregaWorker({ caches, fetch: vi.fn(async (req) => (new URL(req.url).pathname.startsWith('/app/') ? htmlM : jsDeLaXarxa())) });
    preparaClosca(worker, memories, { recursos: [N.entrada], pagina: [N.ruta, N.bar], desats: [N.entrada, N.ruta, N.bar], closca: htmlN });
    // 2. Build N+1 desplegat; 3. amb xarxa, obri /app/gestoria i la seua pàgina confirma.
    await demana(worker, peticio('/app/gestoria/tauler', { mode: 'navigate' }));
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [M.entrada, M.ruta, M.gestoria], closca: '/app/gestoria/tauler' });
    expect(closcaDe(worker, memories, '/app/gestoria/').clau.headers.get('x-sdp-recursos-pagina')).toBe(`${M.ruta} ${M.gestoria}`);
    expect(closcaDe(worker, memories, '/app/bar/').resposta).toBe(htmlN);
    // 4. Sense xarxa, /app/bar en fred: la closca N, amb el seu RutaApps i el seu AppBar.
    worker.fetch.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
    expect((await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }))).resposta).toBe(htmlN);
    expect((await demana(worker, peticio('/app/gestoria/tauler', { mode: 'navigate' }))).resposta.cos).toBe(htmlM.cos);
    // I si la poda s'ha endut l'AppBar (o el RutaApps) d'eixa closca, encara que l'entrada hi siga: la pàgina honesta, no un error de càrrega.
    const recursos = memories.get(worker.api.MEMORIA_RECURSOS);
    for (const podat of [N.bar, N.ruta]) {
      const entrada = recursos.get(`${ORIGEN}${podat}`);
      recursos.delete(`${ORIGEN}${podat}`);
      const { resposta: r } = await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
      expect(r.status, podat).toBe(503);
      expect(await r.text()).toContain(TEXT_DE_LES_APPS);
      recursos.set(`${ORIGEN}${podat}`, entrada);
    }
    expect((await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }))).resposta).toBe(htmlN);
  });

  test('una closca que la pàgina encara no ha confirmat no es dona: la navegació no sap quins chunks lazy calen', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    memories.set(worker.api.MEMORIA_RECURSOS, desatsEn([JS]));
    await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    worker.fetch.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
    expect((await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }))).resposta.status).toBe(503);
    // Quan la pàgina d'eixa app la confirma (els seus recursos ja hi són), arrenca.
    memories.get(worker.api.MEMORIA_RECURSOS).set(`${ORIGEN}${CHUNK_APP}`, { clau: clauDesada(CHUNK_APP, 10), resposta: jsDeLaXarxa() });
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP], closca: '/app/bar/tpv' });
    expect(closcaDe(worker, memories, '/app/bar/').clau.headers.get('x-sdp-recursos-pagina')).toBe(CHUNK_APP);
    expect((await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }))).resposta.cos).toBe(HTML_CLOSCA);
  });

  test('un worker nou mai servix una closca que demana chunks que ja no hi són (podats o d\'un build vell): la pàgina honesta', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    preparaClosca(worker, memories, { recursos: [JS, '/assets/vendor-AbCd_123.js'], desats: [JS, CHUNK_APP] });
    const { resposta: r } = await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    expect(r.status).toBe(503);
    expect(await r.text()).toContain(TEXT_DE_LES_APPS);

    // Ni una a la qual falte un dels recursos que la pàgina havia carregat.
    preparaClosca(worker, memories, { pagina: [CHUNK_APP, '/assets/Tpv-AbCdEf12.js'], desats: [JS, CHUNK_APP] });
    expect((await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }))).resposta.status).toBe(503);

    // Una clau sense llista de recursos tampoc no es dona.
    memories.set(worker.api.MEMORIA_CLOSCA, new Map([[`${ORIGEN}/app/bar/`, { clau: new Request(`${ORIGEN}/app/bar/`), resposta: htmlDeLaClosca() }]]));
    expect((await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }))).resposta.status).toBe(503);
  });

  test('si la memòria falla, sense xarxa: la pàgina honesta de les apps, mai una excepció', async () => {
    const caches = { open: vi.fn(async () => { throw new Error('quota'); }), keys: async () => [], delete: async () => false };
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    const { resposta: r } = await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    expect(r.status).toBe(503);
  });

  test('fora de /app/*, sense xarxa, mai la closca: la pàgina honesta de sempre, sense obrir cap memòria', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    preparaClosca(worker, memories);
    for (const ruta of ['/', '/mur', '/apps', '/application', '/xat/app']) {
      const { resposta: r } = await demana(worker, peticio(ruta, { mode: 'navigate' }));
      expect(r.status, ruta).toBe(503);
      expect(await r.text(), ruta).toContain(TEXT_DE_SEMPRE);
    }
    expect(caches.open).not.toHaveBeenCalled();
  });

  test('cap HTML fora de /app/*: amb xarxa, cap d\'estes navegacions obri cap memòria', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    for (const ruta of ['/', '/mur', '/apps', '/application', '/xat/app', '/el-meu-perfil?code=abc']) {
      await demana(worker, peticio(ruta, { mode: 'navigate' }));
    }
    expect(caches.open).not.toHaveBeenCalled();
    expect([...memories.keys()]).toEqual([]);
  });

  test.each([
    ['un error del servidor', '/app/bar/tpv', () => resposta({ status: 500, headers: HTML, cos: HTML_CLOSCA })],
    ['una resposta redirigida', '/app/bar/tpv', () => resposta({ redirected: true, headers: HTML, cos: HTML_CLOSCA })],
    ['una redirecció opaca', '/app/bar/tpv', () => resposta({ status: 0, type: 'opaqueredirect' })],
    ['no-store', '/app/bar/tpv', () => resposta({ headers: { ...HTML, 'cache-control': 'no-store' }, cos: HTML_CLOSCA })],
    ['private', '/app/bar/tpv', () => resposta({ headers: { ...HTML, 'cache-control': 'private, max-age=60' }, cos: HTML_CLOSCA })],
    ['una adreça amb consulta (un testimoni d\'OAuth)', '/app/bar/tpv?code=secret', () => htmlDeLaClosca()],
    ['un HTML sense cap recurs amb empremta', '/app/bar/tpv', () => htmlDeLaClosca('<!doctype html><script type="module" src="/src/main.jsx"></script>')],
    ['un altre tipus', '/app/bar/tpv', () => resposta({ headers: { 'content-type': 'application/json' }, cos: '{}' })],
    ['una ruta amb un id d\'app que la Plataforma no admet', '/app/BAR/tpv', () => htmlDeLaClosca()]
  ])('a /app/* no es guarda %s, i la resposta arriba tal qual', async (_que, ruta, fesResposta) => {
    const { caches, memories } = memoriesFalses();
    const servidor = fesResposta();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => servidor) });
    expect((await demana(worker, peticio(ruta, { mode: 'navigate' }))).resposta).toBe(servidor);
    expect([...(memories.get(worker.api.MEMORIA_CLOSCA) || new Map()).keys()]).toEqual([]);
  });

  test('actualització: amb xarxa, cada navegació a /app/* refresca la closca de la seua app amb el build nou, que espera la confirmació de la pàgina nova', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    preparaClosca(worker, memories, { recursos: ['/assets/index-VELL0000.js'], closca: htmlDeLaClosca('vell') });
    await demana(worker, peticio('/app/bar/caixa', { mode: 'navigate' }));
    const { clau, resposta: desada } = closcaDe(worker, memories, '/app/bar/');
    expect(clau.headers.get('x-sdp-recursos')).toBe(JS);
    expect(clau.headers.has('x-sdp-recursos-pagina')).toBe(false);
    expect(desada.cos).toBe(HTML_CLOSCA);
  });

  test('una navegació del mateix build refresca la closca i conserva el que la pàgina ja havia confirmat', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    preparaClosca(worker, memories, { pagina: [CHUNK_APP, '/assets/Tpv-AbCdEf12.js'], closca: htmlDeLaClosca('abans') });
    await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    const { clau, resposta: desada } = closcaDe(worker, memories, '/app/bar/');
    expect(clau.headers.get('x-sdp-recursos-pagina')).toBe(`${CHUNK_APP} /assets/Tpv-AbCdEf12.js`);
    expect(desada.cos).toBe(HTML_CLOSCA);
  });

  test('com a molt MAXIM_CLOSQUES closques: en desar-ne una de més, ix la que fa més temps que es va desar', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    const maxim = worker.api.MAXIM_CLOSQUES;
    expect(maxim).toBe(32);
    memories.set(worker.api.MEMORIA_CLOSCA, new Map(Array.from({ length: maxim }, (_, i) => {
      const url = `${ORIGEN}/app/app${i}/`;
      return [url, { clau: clauDeCloscaDesada([JS], { cami: `/app/app${i}/` }), resposta: htmlDeLaClosca() }];
    })));
    await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    const claus = [...memories.get(worker.api.MEMORIA_CLOSCA).keys()];
    expect(claus).toHaveLength(maxim);
    expect(claus).not.toContain(`${ORIGEN}/app/app0/`);
    expect(claus.at(-1)).toBe(`${ORIGEN}/app/bar/`);
  });

  test('actualització: activate esborra la closca d\'una versió vella i conserva la viva i els recursos', async () => {
    const { caches, memories } = memoriesFalses({
      'sdp-pwa-closca-v0': [], 'sdp-pwa-closca-v1': [], 'sdp-pwa-recursos-v1': [], 'sdp-bar': []
    });
    const worker = carregaWorker({ caches });
    await activa(worker);
    expect([...memories.keys()].sort()).toEqual(['sdp-bar', 'sdp-pwa-closca-v1', 'sdp-pwa-recursos-v1']);
  });

  test('Authorization i POST mai: una navegació de /app/* amb Authorization o POST no passa pel worker', async () => {
    const { caches } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn() });
    for (const req of [
      peticio('/app/bar/tpv', { mode: 'navigate', headers: { authorization: 'Bearer x' } }),
      peticio('/app/bar/tpv', { mode: 'navigate', method: 'POST' })
    ]) {
      expect((await demana(worker, req)).respost).toBe(false);
    }
    expect(worker.fetch).not.toHaveBeenCalled();
    expect(caches.open).not.toHaveBeenCalled();
  });
});

describe('l\'escalfament que demana la pàgina d\'una app', () => {
  test('els recursos de la pàgina que falten, de la xarxa i amb la seua mida; els que ja hi són, no; cap amb Authorization', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => jsDeLaXarxa('export const app = 1;')) });
    preparaClosca(worker, memories, { desats: [JS] });
    expect(await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP] })).toBe(1);
    expect(worker.fetch).toHaveBeenCalledTimes(1);
    const [req] = worker.fetch.mock.calls[0];
    expect(req.url).toBe(`${ORIGEN}${CHUNK_APP}`);
    expect(req.method).toBe('GET');
    expect(req.headers.has('authorization')).toBe(false);
    const { clau } = memories.get(worker.api.MEMORIA_RECURSOS).get(`${ORIGEN}${CHUNK_APP}`);
    expect(clau.headers.get('x-sdp-mida')).toBe(String('export const app = 1;'.length));
  });

  test('només el patró i l\'origen propi: la resta del missatge s\'ignora i no surt a la xarxa', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => jsDeLaXarxa()) });
    await missatge(worker, {
      tipus: 'sdp-escalfa',
      recursos: ['https://altre.org/assets/x-12345678.js', '//altre.org/assets/x-12345678.js', `${JS}?v=1`,
        '/assets/cc-by-nc-sa.svg', '/rest/v1/x-12345678.js', '/rag-index.json', CHUNK_APP]
    });
    expect(worker.fetch.mock.calls.map(([req]) => req.url)).toEqual([`${ORIGEN}${CHUNK_APP}`]);
    expect([...memories.get(worker.api.MEMORIA_RECURSOS).keys()]).toEqual([`${ORIGEN}${CHUNK_APP}`]);
  });

  test('un chunk que ja no existix (l\'HTML de la reescriptura SPA) no es desa en escalfar', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [CHUNK_APP] });
    expect([...memories.get(worker.api.MEMORIA_RECURSOS).keys()]).toEqual([]);
  });

  test('respecta els sostres: la memòria plena es poda per entrades en cada desament', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => jsDeLaXarxa()) });
    const maxim = worker.api.MAXIM_RECURSOS;
    memories.set(worker.api.MEMORIA_RECURSOS, new Map(Array.from({ length: maxim }, (_, i) => {
      const url = `${ORIGEN}/assets/vell${i}-AAAAAAAA.js`;
      return [url, { clau: clauDesada(url, 1000), resposta: resposta() }];
    })));
    const nous = Array.from({ length: 5 }, (_, i) => `/assets/nou${i}-BBBBBBBB.js`);
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: nous });
    const claus = [...memories.get(worker.api.MEMORIA_RECURSOS).keys()];
    expect(claus).toHaveLength(maxim);
    expect(claus.slice(-5)).toEqual(nous.map((cami) => `${ORIGEN}${cami}`));
    for (let i = 0; i < 5; i += 1) expect(claus).not.toContain(`${ORIGEN}/assets/vell${i}-AAAAAAAA.js`);
  });

  test('respecta els sostres: per bytes, el total desat no passa mai de MAXIM_BYTES', async () => {
    const { caches, memories } = memoriesFalses();
    const MB = 1024 * 1024;
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => jsDeLaXarxa('a'.repeat(MB))) });
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: Array.from({ length: 12 }, (_, i) => `/assets/gran${i}-CCCCCCCC.js`) });
    const desades = [...memories.get(worker.api.MEMORIA_RECURSOS).values()];
    const total = desades.reduce((suma, { clau }) => suma + worker.api.midaDeLaClau(clau), 0);
    expect(total).toBeLessThanOrEqual(worker.api.MAXIM_BYTES);
    expect(desades.at(-1).clau.url).toBe(`${ORIGEN}/assets/gran11-CCCCCCCC.js`);
  });

  test('sense xarxa para al primer error: no insistix, no desa res i no llança', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: senseXarxa() });
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP, '/assets/x-12345678.js'], closca: '/app/bar/tpv' });
    expect(worker.fetch).toHaveBeenCalledTimes(1);
    expect([...(memories.get(worker.api.MEMORIA_RECURSOS) || new Map()).keys()]).toEqual([]);
    expect(memories.has(worker.api.MEMORIA_CLOSCA)).toBe(false);
  });

  test('revisió F1: la pàgina confirma la closca de la seua app amb la unió del que ha carregat; sense res de nou, no la reescriu', async () => {
    const { caches, memories } = memoriesFalses();
    const vista = '/assets/Tpv-AbCdEf12.js';
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => jsDeLaXarxa()) });
    preparaClosca(worker, memories, { pagina: null, desats: [JS] });
    // RutaApps avisa abans que arribe el chunk de l'app: el primer missatge porta el que hi ha.
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP], closca: '/app/bar/tpv' });
    expect(closcaDe(worker, memories, '/app/bar/').clau.headers.get('x-sdp-recursos-pagina')).toBe(CHUNK_APP);
    // Una vista oberta després s'hi afig, sense perdre el que ja hi era.
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, vista], closca: '/app/bar/caixa' });
    expect(closcaDe(worker, memories, '/app/bar/').clau.headers.get('x-sdp-recursos-pagina')).toBe(`${CHUNK_APP} ${vista}`);
    // Res de nou: la closca no es torna a escriure (put en deixaria una entrada nova), i cap petició de l'HTML.
    const abans = closcaDe(worker, memories, '/app/bar/');
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP, vista], closca: '/app/bar/tpv' });
    expect(closcaDe(worker, memories, '/app/bar/')).toBe(abans);
    expect(worker.fetch.mock.calls.map(([req]) => new URL(req.url).pathname)).toEqual([CHUNK_APP, vista]);
  });

  test('una navegació i una confirmació que arriben alhora no es trepitgen: la confirmació no es perd', async () => {
    const { caches, memories } = memoriesFalses();
    // La primera escriptura de la closca (la de la navegació) espera a la barrera:
    // ha llegit la clau sense confirmar i encara no l'ha escrita.
    let allibera;
    const barrera = new Promise((resol) => { allibera = resol; });
    let bloquejada = false;
    const obri = caches.open;
    const ambBarrera = {
      ...caches,
      open: vi.fn(async (nom) => {
        const memoria = await obri(nom);
        if (nom !== 'sdp-pwa-closca-v1') return memoria;
        return {
          ...memoria,
          put: async (...arguments_) => {
            if (!bloquejada) {
              bloquejada = true;
              await barrera;
            }
            return memoria.put(...arguments_);
          }
        };
      })
    };
    const worker = carregaWorker({ caches: ambBarrera, fetch: vi.fn(async () => htmlDeLaClosca()) });
    preparaClosca(worker, memories, { pagina: null });
    const navegacio = demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    await vi.waitFor(() => expect(bloquejada).toBe(true));
    const confirmacio = missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP], closca: '/app/bar/tpv' });
    for (let i = 0; i < 5; i += 1) await new Promise((resol) => { setTimeout(resol, 0); });
    allibera();
    await Promise.all([navegacio, confirmacio]);
    expect(closcaDe(worker, memories, '/app/bar/').clau.headers.get('x-sdp-recursos-pagina')).toBe(CHUNK_APP);
  });

  test('revisió F1: cada pàgina confirma la closca de la seua app i no toca la de cap altra', async () => {
    const { caches, memories } = memoriesFalses();
    const gestoria = '/assets/AppGestoria-AbCdEf12.js';
    const worker = carregaWorker({ caches, fetch: vi.fn(async (req) => (new URL(req.url).pathname.startsWith('/app/') ? htmlDeLaClosca() : jsDeLaXarxa())) });
    preparaClosca(worker, memories);
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP, gestoria], closca: '/app/gestoria/tauler' });
    expect(closcaDe(worker, memories, '/app/gestoria/').clau.headers.get('x-sdp-recursos-pagina')).toBe(`${CHUNK_APP} ${gestoria}`);
    expect(closcaDe(worker, memories, '/app/bar/').clau.headers.get('x-sdp-recursos-pagina')).toBe(CHUNK_APP);
  });

  test('una pestanya vella (d\'un altre build) no confirma ni sobreescriu la closca del build nou', async () => {
    const { caches, memories } = memoriesFalses();
    const vell = { entrada: '/assets/index-VELL0000.js', bar: '/assets/AppBar-VELL0000.js' };
    const worker = carregaWorker({ caches, fetch: vi.fn(async (req) => (new URL(req.url).pathname.startsWith('/app/') ? htmlDeLaClosca() : jsDeLaXarxa())) });
    const nova = preparaClosca(worker, memories);
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [vell.entrada, vell.bar], closca: '/app/bar/tpv' });
    const { clau, resposta: desada } = closcaDe(worker, memories, '/app/bar/');
    expect(desada).toBe(nova);
    expect(clau.headers.get('x-sdp-recursos')).toBe(JS);
    expect(clau.headers.get('x-sdp-recursos-pagina')).toBe(CHUNK_APP);
  });

  test('un recurs de la pàgina que no s\'ha pogut desar (sense xarxa o que no es pot guardar) no confirma res: la closca queda com estava', async () => {
    const vista = '/assets/Tpv-AbCdEf12.js';
    for (const fetch of [senseXarxa(), vi.fn(async () => htmlDeLaClosca())]) {
      const { caches, memories } = memoriesFalses();
      const worker = carregaWorker({ caches, fetch });
      const closca = preparaClosca(worker, memories);
      await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP, vista], closca: '/app/bar/tpv' });
      expect(closcaDe(worker, memories, '/app/bar/').clau.headers.get('x-sdp-recursos-pagina')).toBe(CHUNK_APP);
      worker.fetch.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
      expect((await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }))).resposta).toBe(closca);
    }
  });

  test('sense closca desada, la demana a la xarxa (GET, sense Authorization, revalidant) i la desa: l\'app visitada arrencarà sense xarxa', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({
      caches,
      fetch: vi.fn(async (req) => (new URL(req.url).pathname === '/app/bar/tpv' ? htmlDeLaClosca() : jsDeLaXarxa()))
    });
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS], closca: '/app/bar/tpv' });
    const demanades = worker.fetch.mock.calls.map(([req]) => req);
    expect(demanades.map((req) => new URL(req.url).pathname)).toEqual([JS, '/app/bar/tpv']);
    const [, closca] = demanades;
    expect(closca.method).toBe('GET');
    expect(closca.headers.has('authorization')).toBe(false);
    expect(closca.cache).toBe('no-cache');
    expect(closca.credentials).toBe('same-origin');
    const { clau } = closcaDe(worker, memories, '/app/bar/');
    expect(clau.headers.get('x-sdp-recursos')).toBe(JS);
    // Confirmada per la pàgina: cap recurs més que els de l'HTML.
    expect(clau.headers.get('x-sdp-recursos-pagina')).toBe('-');

    // I ara, sense xarxa, la mateixa app arrenca.
    worker.fetch.mockImplementation(async () => { throw new TypeError('Failed to fetch'); });
    const { resposta: r } = await demana(worker, peticio('/app/bar/tpv', { mode: 'navigate' }));
    expect(r.status).toBe(200);
    expect(r.cos).toBe(HTML_CLOSCA);
  });

  test('si la closca desada és la del build de la pàgina, no la torna a demanar; si és d\'un build vell, sí', async () => {
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    preparaClosca(worker, memories);
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS], closca: '/app/bar/tpv' });
    expect(worker.fetch).not.toHaveBeenCalled();

    preparaClosca(worker, memories, { recursos: ['/assets/index-VELL0000.js'], desats: [JS] });
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS], closca: '/app/bar/tpv' });
    expect(worker.fetch).toHaveBeenCalledTimes(1);
    const { clau } = closcaDe(worker, memories, '/app/bar/');
    expect(clau.headers.get('x-sdp-recursos')).toBe(JS);
    // Del build vell no queda res confirmat: només el que ha carregat la pàgina nova.
    expect(clau.headers.get('x-sdp-recursos-pagina')).toBe('-');
  });

  test('la closca demanada no es desa si no és bona (error, sense recursos, redirigida, d\'un altre build) ni si la pàgina no porta recursos', async () => {
    for (const dolenta of [
      resposta({ status: 503, headers: HTML, cos: HTML_CLOSCA }),
      htmlDeLaClosca('<!doctype html><p>res</p>'),
      resposta({ redirected: true, headers: HTML, cos: HTML_CLOSCA }),
      htmlDeLaClosca(HTML_CLOSCA.replace(JS, '/assets/index-NOU00000.js'))
    ]) {
      const { caches, memories } = memoriesFalses();
      const worker = carregaWorker({ caches, fetch: vi.fn(async (req) => (new URL(req.url).pathname === JS ? jsDeLaXarxa() : dolenta)) });
      await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS], closca: '/app/bar/tpv' });
      expect(worker.fetch).toHaveBeenCalledTimes(2);
      expect([...(memories.get(worker.api.MEMORIA_CLOSCA) || new Map()).keys()]).toEqual([]);
    }
    const { caches, memories } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => htmlDeLaClosca()) });
    await missatge(worker, { tipus: 'sdp-escalfa', recursos: [], closca: '/app/bar/tpv' });
    expect(worker.fetch).not.toHaveBeenCalled();
    expect(memories.has(worker.api.MEMORIA_CLOSCA)).toBe(false);
  });

  test('missatges que no són d\'escalfament, o d\'un altre origen: res, ni memòria ni xarxa', async () => {
    const { caches } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn() });
    for (const dades of [null, 'sdp-escalfa', { tipus: 'altre' }, { type: 'SKIP_WAITING' }, { tipus: 'sdp-escalfa', closca: '/mur' }]) {
      expect(await missatge(worker, dades), JSON.stringify(dades)).toBe(0);
    }
    expect(await missatge(worker, { tipus: 'sdp-escalfa', recursos: [JS], closca: '/app/bar' }, { origin: 'https://altre.org' })).toBe(0);
    expect(caches.open).not.toHaveBeenCalled();
    expect(worker.fetch).not.toHaveBeenCalled();
  });
});
