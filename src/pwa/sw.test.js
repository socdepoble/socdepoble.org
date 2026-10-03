// @vitest-environment node
/* Fase 0 de l'empaquetat mòbil (261003) · el service worker de l'entrada
   pròpia. S'avalua el public/sw.js REAL (script clàssic) dins d'una màquina
   virtual de Node, amb self, caches i fetch simulats: el que es prova és el
   que es publica. Disseny: _wiki_de_poble/04_escriptori/02_investigacio_ia/
   261003_1330_empaquetat_mobil_claude/FASE0_PWA.txt. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, test, vi } from 'vitest';
import { paletaDeTokens, valorDelToken } from './__fixtures__/tokens.js';

const CODI = readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
const ORIGEN = 'https://socdepoble.org';
/* La darrera expressió del script és el seu valor: així es lligen les funcions
   i les constants de dalt sense que el fitxer publicat exporte res. */
const LECTURA = '\n;({ classificaPeticio, esRespostaGuardable, cachesAEsborrar, clausSobrants, midaDeLaClau, paginaSenseConnexio, CLASSE, MEMORIA_RECURSOS, MAXIM_RECURSOS, MAXIM_BYTES, CAPCALERA_MIDA, CSP_SENSE_CONNEXIO });';

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

const descriu = (url, opcions = {}) => {
  const req = peticio(url, opcions);
  return {
    metode: req.method, url: req.url, mode: req.mode, cache: req.cache,
    teAutoritzacio: req.headers.has('authorization'), teRang: req.headers.has('range')
  };
};

const JS = '/assets/index-B5hur-io.js';

describe('classificaPeticio (pura)', () => {
  const { api } = carregaWorker();
  const classe = (url, opcions) => api.classificaPeticio(descriu(url, opcions), ORIGEN);

  test('navegacions de l\'origen propi → xarxa primer, també amb consulta (no es guarden mai)', () => {
    for (const url of ['/', '/pobles/la-torre-de-les-macanes', '/el-meu-perfil?code=abc', '/mur#ancora']) {
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

describe('el worker en marxa', () => {
  test('només escolta activate i fetch: cap skipWaiting, cap missatge, cap push ni sync, cap importScripts', () => {
    const worker = carregaWorker();
    expect([...worker.escoltes.keys()].sort()).toEqual(['activate', 'fetch']);
    expect(worker.self.skipWaiting).not.toHaveBeenCalled();
    expect(CODI).not.toMatch(/skipWaiting\s*\(/);
    expect(CODI).not.toMatch(/importScripts\s*\(/);
    expect(CODI).not.toMatch(/\b(?:indexedDB|localStorage|sessionStorage)\b/);
  });

  test('navegació amb xarxa: la resposta del servidor tal qual, sense obrir cap memòria', async () => {
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

    const senseXarxa = carregaWorker({ fetch: vi.fn(async () => { throw new TypeError('Failed to fetch'); }) });
    const { resposta: r } = await demana(senseXarxa, peticio('/', { mode: 'navigate' }), { preloadResponse: Promise.reject(new TypeError('Failed to fetch')) });
    expect(r.status).toBe(503);
  });

  test('navegació sense xarxa: pàgina «Sense connexió» 503, sense script i amb CSP pròpia', async () => {
    const { caches } = memoriesFalses();
    const worker = carregaWorker({ caches, fetch: vi.fn(async () => { throw new TypeError('Failed to fetch'); }) });
    const { resposta: r } = await demana(worker, peticio('/mur', { mode: 'navigate' }));
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
    expect(caches.open).not.toHaveBeenCalled();
  });

  test('recurs amb empremta: la primera vegada de la xarxa i es guarda amb la seua mida; la segona, de la memòria', async () => {
    const { caches, memories } = memoriesFalses();
    const xarxa = resposta({ headers: { 'content-type': 'text/javascript' }, cos: 'export{}' });
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

  /** Una clau desada com la deixa el worker: la petició amb la mida a la capçalera. */
  const clauDesada = (url, mida) => new Request(new URL(url, ORIGEN).href, { headers: { 'x-sdp-mida': String(mida) } });

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
