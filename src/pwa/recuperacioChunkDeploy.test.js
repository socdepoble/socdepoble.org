// @vitest-environment node
import { JSDOM } from 'jsdom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { aturaRecuperacioChunkDeploy, CLAU_RECUPERACIO_CHUNK, classificaErrorChunkDeploy,
  creaRecuperacioChunkDeploy, entradesHtmlDeploy, ENTRADES_AMB_ESTAT_EN_MEMORIA, FINESTRA_ANTI_BUCLE_MS,
  instalLaRecuperacioChunkDeploy, MAXIM_HTML_DEPLOY, recuperaErrorChunkDeploy } from './recuperacioChunkDeploy.js';

import { actualitzaWorkerPerDeploy } from './registre.js';
import { buidaEsborranys, desaEsborrany, llegixEsborrany } from '../sections/xat/esborranys.js';

const ORIGIN = 'https://socdepoble.org';
const OLD = '/assets/index-Old12345.js', NEXT = '/assets/index-New12345.js';
const CHUNK = '/assets/FitxaVivaDeComunitat-CQbREbBV.js';
const failure = () => new TypeError('Failed to fetch dynamically imported module: ' + ORIGIN + CHUNK);
const html = path => '<!doctype html><html><head><script type="module" src="' + path + '"></script></head><body></body></html>';
function storage() {
  const data = new Map();
  return { getItem: vi.fn(k => data.get(k) ?? null), setItem: vi.fn((k, v) => data.set(k, v)), data };
}
function environment(options = {}) {
  const saved = options.saved || storage(), listeners = new Map(), fields = [];
  let entry = OLD, clock = 100000, current = NEXT;
  const update = vi.fn(async () => {}), waiting = { scriptURL: ORIGIN + '/sw.js', postMessage: vi.fn() };
  const registration = { scope: ORIGIN + '/', active: { scriptURL: ORIGIN + '/sw.js' }, waiting, update };
  const navegador = { onLine: true, serviceWorker: { getRegistration: vi.fn(async () => registration) } };
  const resources = { delete: vi.fn(async () => true) };
  const cache = { keys: vi.fn(async () => ['sdp-pwa-closca-v1', 'sdp-pwa-recursos-v1', 'notes-privades', 'workbox-alie']),
    delete: vi.fn(async () => true), open: vi.fn(async () => resources) };
  const document = { querySelectorAll: vi.fn(selector => selector.startsWith('script')
    ? [{ getAttribute: () => entry }] : fields) };
  const finestra = { document, sessionStorage: saved, caches: cache,
    location: { origin: ORIGIN, href: ORIGIN + '/xat?comunitat=mostra#fila', reload: vi.fn() },
    addEventListener: vi.fn((name, fn) => listeners.set(name, fn)),
    removeEventListener: vi.fn(name => listeners.delete(name)) };
  Object.defineProperty(finestra, 'indexedDB', { get() { throw Error('no tocar notes'); } });
  Object.defineProperty(finestra, 'localStorage', { get() { throw Error('no tocar persistència privada'); } });
  const fetchFn = vi.fn(async url => url.endsWith('/index.html')
    ? new Response(html(current), { headers: { 'content-type': 'text/html; charset=utf-8' } })
    : new Response(null, { status: 404 }));
  const input = { finestra, navegador, fetchFn, ara: () => clock, topallMs: 100,
    preparaWorker: ({ vigent }) => actualitzaWorkerPerDeploy({ navegador, finestra, vigent }) };
  const motor = creaRecuperacioChunkDeploy(input);
  return { ...input, motor, saved, listeners, fields, registration, waiting, update, cache, resources,
    setEntry: x => { entry = x; }, setFresh: x => { current = x; }, setTime: x => { clock = x; } };
}
afterEach(() => aturaRecuperacioChunkDeploy());

describe('classificació i parser del desplegament', () => {
  test('reconeix Vite, Safari, chunk i MIME; no un error qualsevol', () => {
    expect(classificaErrorChunkDeploy(failure(), ORIGIN)).toEqual({ recurs: CHUNK });
    expect(classificaErrorChunkDeploy(new TypeError('Importing a module script failed'), ORIGIN)).toEqual({ recurs: null });
    // Gauntlet R22 (pwa-04) · Firefox: el mateix TypeError per a 404, xarxa i MIME, amb o sense URL.
    expect(classificaErrorChunkDeploy(new TypeError('error loading dynamically imported module: ' + ORIGIN + CHUNK), ORIGIN)).toEqual({ recurs: CHUNK });
    expect(classificaErrorChunkDeploy(new TypeError('error loading dynamically imported module'), ORIGIN)).toEqual({ recurs: null });
    expect(classificaErrorChunkDeploy(Error('LazyRouteError', { cause: new TypeError('error loading dynamically imported module: ' + ORIGIN + CHUNK) }), ORIGIN)).toEqual({ recurs: CHUNK });
    expect(classificaErrorChunkDeploy(Error('Loading chunk 5 failed'), ORIGIN)).toEqual({ recurs: null });
    expect(classificaErrorChunkDeploy(Error('Expected a module script but MIME text/html'), ORIGIN)).toEqual({ recurs: null });
    for (const error of [new SyntaxError('Unexpected token'), new TypeError('Failed to fetch'), Error('permission denied'), {},
      Object.defineProperty({}, 'message', { get() { throw Error('getter'); } })]) {
      expect(classificaErrorChunkDeploy(error, ORIGIN)).toBeNull();
    }
  });
  test.each(['https://evil.invalid/assets/a-AbCd1234.js', ORIGIN + '/rest/v1/rpc/foo',
    ORIGIN + CHUNK + '?token=privat', ORIGIN + '/assets/a-AbCd1234.js#secret'])('refusa URL aliena o no immutable: %s', url => {
    expect(classificaErrorChunkDeploy(new TypeError('Failed to fetch dynamically imported module: ' + url), ORIGIN)).toBeNull();
  });
  test.each(['https://evil.invalid/assets/a-AbCd1234.js', ORIGIN + CHUNK + '?token=privat'])('pwa-04 · el text de Firefox no relaxa el filtre d’URL: %s', url => {
    expect(classificaErrorChunkDeploy(new TypeError('error loading dynamically imported module: ' + url), ORIGIN)).toBeNull();
  });
  test('causes cíclices i textos excessius no provoquen recorregut il·limitat', () => {
    const e = failure(); e.cause = e;
    expect(classificaErrorChunkDeploy(e, ORIGIN)).toEqual({ recurs: CHUNK });
    expect(classificaErrorChunkDeploy({ message: 'x'.repeat(5000), cause: failure() }, ORIGIN)).toBeNull();
  });
  test('només scripts module externs reals, sense comentaris, raw text o templates', () => {
    const fake = html('/assets/index-Fake1234.js');
    const content = '<!--' + fake + '--><script type="application/ld+json">' + fake + '</script>'
      + '<style>' + fake + '</style><textarea>' + fake + '</textarea><template>' + fake + '</template>' + html(NEXT);
    expect(entradesHtmlDeploy(content, ORIGIN)).toEqual([NEXT]);
    expect(entradesHtmlDeploy('<script type=module src=' + NEXT + '></script>', ORIGIN)).toEqual([NEXT]);
    expect(entradesHtmlDeploy(html('https://evil.invalid' + NEXT), ORIGIN)).toEqual([]);
    expect(entradesHtmlDeploy('x'.repeat(MAXIM_HTML_DEPLOY + 1), ORIGIN)).toEqual([]);
  });
  test.each(['xmp', 'iframe', 'noembed', 'noframes', 'noscript', 'textarea', 'style', 'title'])('el text inert %s i un fals tancament no acrediten una entrada', tag => {
    const fake = html('/assets/index-Fake1234.js');
    expect(entradesHtmlDeploy('<' + tag + '> ' + fake + '</' + tag + '-no> ' + fake + '</' + tag + '>' + html(NEXT), ORIGIN)).toEqual([NEXT]);
  });
  test('plaintext consumix la resta; namespaces aliens refusen; Unicode no desplaça offsets', () => {
    expect(entradesHtmlDeploy('<plaintext>' + html(NEXT), ORIGIN)).toEqual([]);
    for (const tag of ['svg', 'math']) expect(entradesHtmlDeploy('<' + tag + '>' + html(NEXT) + '</' + tag + '>', ORIGIN)).toEqual([]);
    expect(entradesHtmlDeploy('<p>İ</p>' + html(NEXT), ORIGIN)).toEqual([NEXT]);
  });
  test('més de huit entrades o atribut inacabat no acrediten cap build', () => {
    expect(entradesHtmlDeploy(Array.from({ length: 9 }, (_, n) => html('/assets/' + n + '-AbCd1234.js')).join(''), ORIGIN)).toEqual([]);
    expect(entradesHtmlDeploy('<script type="module" src="' + NEXT, ORIGIN)).toEqual([]);
  });
});

describe('prova positiva, pressupost i dades preservades', () => {
  test('404 + build nou: actualitza SW propi, purga només HTML propi, conserva ruta i reserva abans de reload', async () => {
    const e = environment(), route = e.finestra.location.href;
    expect(await e.motor.recupera(failure())).toBe(true);
    expect(e.finestra.location.reload).toHaveBeenCalledOnce();
    expect(e.finestra.location.href).toBe(route);
    expect(e.fetchFn.mock.calls[0][0]).toBe(ORIGIN + '/index.html');
    expect(e.fetchFn.mock.calls[0][1]).toMatchObject({ cache: 'no-store', redirect: 'error' });
    expect(e.fetchFn.mock.calls[1]).toEqual([ORIGIN + CHUNK, expect.objectContaining({ method: 'HEAD', cache: 'no-store' })]);
    expect(e.update).toHaveBeenCalledOnce();
    expect(e.waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(e.cache.delete.mock.calls).toEqual([['sdp-pwa-closca-v1']]);
    expect(e.resources.delete).toHaveBeenCalledWith(ORIGIN + CHUNK);
    const row = JSON.parse(e.saved.getItem(CLAU_RECUPERACIO_CHUNK));
    expect(row.vistes).toHaveLength(1);
    expect(JSON.stringify(row).length).toBeLessThan(2048);
  });
  test('reinici del mòdul sobre la mateixa sessió no repeteix el mateix build ni després de 60s', async () => {
    const e = environment(); await e.motor.recupera(failure());
    e.setTime(900000);
    const another = creaRecuperacioChunkDeploy({ ...e, magatzem: e.saved });
    expect(await another.recupera(failure())).toBe(false);
    expect(e.fetchFn).toHaveBeenCalledTimes(2);
    expect(e.finestra.location.reload).toHaveBeenCalledOnce();
  });
  test('una altra empremta també respecta la finestra global de60s', async () => {
    const e = environment(); await e.motor.recupera(failure());
    e.setEntry('/assets/index-Alt12345.js'); e.setTime(100001);
    expect(await e.motor.recupera(failure())).toBe(false);
    e.setTime(100000 + FINESTRA_ANTI_BUCLE_MS);
    expect(await e.motor.recupera(failure())).toBe(true);
    expect(e.finestra.location.reload).toHaveBeenCalledTimes(2);
  });
  test('dos senyals concurrents compartixen la comprovació i una sola recàrrega', async () => {
    const e = environment();
    expect(await Promise.all([e.motor.recupera(failure()), e.motor.recupera(failure())])).toEqual([true, true]);
    expect(e.fetchFn).toHaveBeenCalledTimes(2);
    expect(e.finestra.location.reload).toHaveBeenCalledOnce();
  });
  test('dos motors sobre el mateix storage no poden reservar dues recàrregues', async () => {
    const e = environment(), other = creaRecuperacioChunkDeploy({ ...e, magatzem: e.saved });
    const result = await Promise.all([e.motor.recupera(failure()), other.recupera(failure())]);
    expect(result.filter(Boolean)).toHaveLength(1);
    expect(e.finestra.location.reload).toHaveBeenCalledOnce();
  });
  test('MIME HTML en un hash retirat també és prova, sense llegir el cos com JavaScript', async () => {
    const e = environment();
    e.fetchFn.mockImplementation(async url => new Response(url.endsWith('/index.html') ? html(NEXT) : '<html>',
      { headers: { 'content-type': 'text/html' } }));
    expect(await e.motor.recupera(failure())).toBe(true);
  });
  test('Safari sense URL acredita skew per les entrades del document i de la resposta fresca', async () => {
    const e = environment();
    expect(await e.motor.recupera(new TypeError('Importing a module script failed'))).toBe(true);
    expect(e.fetchFn).toHaveBeenCalledTimes(1);
  });
  test('pwa-04 · Firefox també es recupera amb la mateixa prova de build nou i hash retirat', async () => {
    const e = environment();
    expect(await e.motor.recupera(new TypeError('error loading dynamically imported module: ' + ORIGIN + CHUNK))).toBe(true);
    expect(e.fetchFn.mock.calls[1]).toEqual([ORIGIN + CHUNK, expect.objectContaining({ method: 'HEAD' })]);
    expect(e.finestra.location.reload).toHaveBeenCalledOnce();
  });
  test('pwa-03 · update() que deixa el worker nou a installing també li envia SKIP_WAITING', async () => {
    const e = environment(), statechange = new Set();
    const nou = { scriptURL: ORIGIN + '/sw.js', state: 'installing', postMessage: vi.fn(),
      addEventListener: vi.fn((type, fn) => { if (type === 'statechange') statechange.add(fn); }),
      removeEventListener: vi.fn((type, fn) => statechange.delete(fn)) };
    e.registration.waiting = null;
    e.update.mockImplementation(async () => {
      e.registration.installing = nou;
      setTimeout(() => {
        Object.assign(e.registration, { installing: null, waiting: nou }); nou.state = 'installed';
        for (const fn of [...statechange]) fn();
      }, 0);
    });
    expect(await e.motor.recupera(failure())).toBe(true);
    expect(nou.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(nou.postMessage.mock.calls.every(([m]) => m.type === 'SKIP_WAITING')).toBe(true);
    expect(e.finestra.location.reload).toHaveBeenCalledOnce();
  });
  test('sense ServiceWorker la prova de build encara permet una recuperació limitada', async () => {
    const e = environment(); delete e.navegador.serviceWorker;
    expect(await e.motor.recupera(failure())).toBe(true);
  });
});

describe('refusos honestos i cancel·lació', () => {
  test('offline i sintaxi real no contacten xarxa ni canvien cap magatzem', async () => {
    const e = environment(); e.navegador.onLine = false;
    expect(await e.motor.recupera(failure())).toBe(false);
    e.navegador.onLine = true;
    expect(await e.motor.recupera(new SyntaxError('Unexpected token'))).toBe(false);
    expect(e.fetchFn).not.toHaveBeenCalled(); expect(e.saved.setItem).not.toHaveBeenCalled();
  });
  test('mateix HTML encara amb404 no prova canvi de desplegament', async () => {
    const e = environment(); e.setFresh(OLD);
    expect(await e.motor.recupera(failure())).toBe(false);
    expect(e.fetchFn).toHaveBeenCalledTimes(1);
    expect(e.update).not.toHaveBeenCalled(); expect(e.finestra.location.reload).not.toHaveBeenCalled();
  });
  test.each([200, 401, 403, 500, 503])('status %i del chunk no es convertix en recàrrega', async status => {
    const e = environment();
    e.fetchFn.mockImplementation(async url => url.endsWith('/index.html')
      ? new Response(html(NEXT), { headers: { 'content-type': 'text/html' } })
      : new Response(null, { status, headers: { 'content-type': 'text/javascript' } }));
    expect(await e.motor.recupera(failure())).toBe(false);
    expect(e.finestra.location.reload).not.toHaveBeenCalled();
  });
  test('quota, registre corrupte i escriptura no persistent fallen tancats', async () => {
    for (const kind of ['quota', 'invalid', 'silent']) {
      const e = environment();
      if (kind === 'quota') e.saved.setItem.mockImplementation(() => { throw Error('quota'); });
      if (kind === 'invalid') e.saved.data.set(CLAU_RECUPERACIO_CHUNK, '{}');
      if (kind === 'silent') e.saved.setItem.mockImplementation(() => {});
      expect(await e.motor.recupera(failure())).toBe(false);
      expect(e.finestra.location.reload).not.toHaveBeenCalled();
      expect(e.update).not.toHaveBeenCalled();
    }
  });
  test('sessionStorage inaccessible no es reemplaça per un pressupost volàtil', async () => {
    const e = environment();
    Object.defineProperty(e.finestra, 'sessionStorage', { get() { throw Error('blocked'); } });
    expect(await e.motor.recupera(failure())).toBe(false);
    expect(e.fetchFn).not.toHaveBeenCalled();
  });
  test('un esborrany visible impedix recàrrega i conserva el text literal', async () => {
    const e = environment(), draft = { value: 'Esborrany privat pendent', disabled: false };
    e.fields.push(draft);
    expect(await e.motor.recupera(failure())).toBe(false);
    expect(draft.value).toBe('Esborrany privat pendent');
    expect(e.fetchFn).not.toHaveBeenCalled();
  });
  test.each(['<div contenteditable="plaintext-only">Text privat</div>', '<div contenteditable>Text privat</div>',
    '<input type="url" value="https://pendent.example">', '<input type="email" value="pendent@example.org">',
    '<input type="number" value="42">', '<textarea hidden>Text privat</textarea>',
    '<div hidden><textarea>Text privat</textarea></div>'])('el DOM real conserva qualsevol edició pendent: %s', async markup => {
    const e = environment(), dom = new JSDOM(markup + html(OLD));
    e.finestra.document = dom.window.document;
    try { expect(await e.motor.recupera(failure())).toBe(false); expect(e.fetchFn).not.toHaveBeenCalled(); }
    finally { dom.window.close(); }
  });
  test('escriure o canviar de ruta durant la comprovació talla la recuperació', async () => {
    for (const mode of ['draft', 'route']) {
      const e = environment(), original = e.fetchFn.getMockImplementation();
      e.fetchFn.mockImplementation(async (...args) => {
        if (mode === 'draft') e.fields.push({ value: 'No es perd' });
        else e.finestra.location.href = ORIGIN + '/notes/una-nota';
        return original(...args);
      });
      expect(await e.motor.recupera(failure())).toBe(false);
      expect(e.finestra.location.reload).not.toHaveBeenCalled();
    }
  });
  test('HTML desmesurat, fallada de xarxa i temps esgotat no recarreguen', async () => {
    for (const mode of ['oversized', 'network', 'timeout']) {
      const e = environment();
      e.fetchFn.mockImplementation(async () => {
        if (mode === 'network') throw new TypeError('network');
        if (mode === 'timeout') return new Promise(() => {});
        return new Response('x'.repeat(MAXIM_HTML_DEPLOY + 1), { headers: { 'content-type': 'text/html' } });
      });
      const motor = creaRecuperacioChunkDeploy({ ...e, topallMs: 10 });
      expect(await motor.recupera(failure())).toBe(false);
      expect(e.finestra.location.reload).not.toHaveBeenCalled();
    }
  });
  test('worker alié mai no es refresca ni se li envia SKIP_WAITING', async () => {
    const e = environment(); e.registration.active.scriptURL = ORIGIN + '/altre-worker.js'; e.waiting.scriptURL = ORIGIN + '/altre-worker.js';
    expect(await e.motor.recupera(failure())).toBe(true);
    expect(e.update).not.toHaveBeenCalled(); expect(e.waiting.postMessage).not.toHaveBeenCalled();
  });
  test('aturar el motor mentre hi ha xarxa pendent impedix efectes tardans', async () => {
    const e = environment(); let done;
    e.fetchFn.mockImplementation(() => new Promise(resolve => { done = resolve; }));
    const result = e.motor.recupera(failure()); await Promise.resolve(); await Promise.resolve();
    e.motor.atura(); done(new Response(html(NEXT), { headers: { 'content-type': 'text/html' } }));
    expect(await result).toBe(false); expect(e.finestra.location.reload).not.toHaveBeenCalled();
  });
  test('registre ple i rellotge arrere no creen noves recàrregues', async () => {
    const e = environment();
    e.saved.data.set(CLAU_RECUPERACIO_CHUNK, JSON.stringify({ v: 1, ultima: 200000, vistes: [] }));
    expect(await e.motor.recupera(failure())).toBe(false);
    e.saved.data.set(CLAU_RECUPERACIO_CHUNK, JSON.stringify({ v: 1, ultima: null, vistes: Array.from({ length: 16 }, (_, n) => n.toString(16).padStart(8, '0')) }));
    expect(await e.motor.recupera(failure())).toBe(false);
    expect(e.fetchFn).not.toHaveBeenCalled();
  });
  test('l’entrada escolta Vite i unhandledrejection, i deixa d’escoltar en aturar-se', async () => {
    const e = environment(); expect(recuperaErrorChunkDeploy(failure())).toBe(false);
    const stop = instalLaRecuperacioChunkDeploy(e);
    expect(e.listeners.has('vite:preloadError')).toBe(true);
    expect(e.listeners.has('unhandledrejection')).toBe(true);
    await recuperaErrorChunkDeploy(failure());
    expect(e.finestra.location.reload).toHaveBeenCalledOnce();
    stop(); expect(e.listeners.size).toBe(0); expect(recuperaErrorChunkDeploy(failure())).toBe(false);
  });
});

/* Gauntlet R22 (pwa-01) · El veto del DOM no veu el que només viu en memòria:
   l'esborrany d'una conversa que ja no es veu (src/sections/xat/esborranys.js),
   l'historial de la IAIA o una escriptura de Notes en cua. */
describe('pwa-01 · l’estat que només viu en memòria no es perd en silenci', () => {
  afterEach(() => buidaEsborranys());
  function documentReal(e, markup = '') {
    const dom = new JSDOM(markup + html(OLD));
    Object.assign(e.finestra, { document: dom.window.document,
      addEventListener: (...args) => dom.window.addEventListener(...args),
      removeEventListener: (...args) => dom.window.removeEventListener(...args) });
    return dom;
  }
  test('l’esborrany d’una altra conversa, ja fora del DOM, impedix la recàrrega i es conserva', async () => {
    const e = environment(), dom = documentReal(e, '<textarea aria-label="Missatge"></textarea>');
    try {
      instalLaRecuperacioChunkDeploy(e);
      // Conversa A: la persona escriu; el compositor desa el text al Map del mòdul.
      const compositor = dom.window.document.querySelector('textarea');
      compositor.value = 'Resposta a mitges per a la conversa A';
      compositor.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      desaEsborrany('amb::fil-A', compositor.value);
      // Obri la comunitat B: el compositor d'A es desmunta i no queda cap camp.
      compositor.remove();
      expect(dom.window.document.querySelectorAll('textarea, input, [contenteditable]')).toHaveLength(0);
      expect(await recuperaErrorChunkDeploy(failure())).toBe(false);
      expect(e.finestra.location.reload).not.toHaveBeenCalled();
      expect(e.fetchFn).not.toHaveBeenCalled();
      expect(e.saved.setItem).not.toHaveBeenCalled();
      expect(llegixEsborrany('amb::fil-A')).toBe('Resposta a mitges per a la conversa A');
    } finally { dom.window.close(); }
  });
  test('control: el mateix document sense cap entrada de la persona sí que es recupera', async () => {
    const e = environment(), dom = documentReal(e);
    try {
      instalLaRecuperacioChunkDeploy(e);
      expect(await recuperaErrorChunkDeploy(failure())).toBe(true);
      expect(e.finestra.location.reload).toHaveBeenCalledOnce();
    } finally { dom.window.close(); }
  });
  test.each(ENTRADES_AMB_ESTAT_EN_MEMORIA)('l’entrada «%s», encara que un component n’atura la propagació, ho veta', async tipus => {
    const e = environment(), dom = documentReal(e, '<div id="zona"></div>');
    try {
      instalLaRecuperacioChunkDeploy(e);
      const zona = dom.window.document.getElementById('zona');
      zona.addEventListener(tipus, event => event.stopPropagation());
      zona.dispatchEvent(new dom.window.Event(tipus, { bubbles: true }));
      expect(await recuperaErrorChunkDeploy(failure())).toBe(false);
      expect(e.finestra.location.reload).not.toHaveBeenCalled();
    } finally { dom.window.close(); }
  });
  /* Ronda 3 · El límit que la capçalera del mòdul i /versions diuen: un toc sol (una pregunta suggerida de la IAIA,
     una emoticona del calaix) no és cap entrada i no deixa cap camp amb valor; la recuperació recarrega igualment. Si
     algun dia s'amplia el veto als tocs, esta prova obliga a tornar a escriure el comentari i la fita R21 C5. */
  test('límit del veto: un toc sol, sense cap entrada ni cap camp amb valor, no impedix la recàrrega', async () => {
    const e = environment(), dom = documentReal(e, '<button type="button">Què és el Mur?</button>');
    try {
      instalLaRecuperacioChunkDeploy(e);
      expect(ENTRADES_AMB_ESTAT_EN_MEMORIA).not.toContain('click');
      const boto = dom.window.document.querySelector('button');
      for (const tipus of ['pointerdown', 'pointerup', 'click']) boto.dispatchEvent(new dom.window.Event(tipus, { bubbles: true }));
      expect(await recuperaErrorChunkDeploy(failure())).toBe(true);
      expect(e.finestra.location.reload).toHaveBeenCalledOnce();
    } finally { dom.window.close(); }
  });
  test('una entrada durant la comprovació de xarxa talla la recuperació abans de recarregar', async () => {
    const e = environment(), dom = documentReal(e), original = e.fetchFn.getMockImplementation();
    try {
      instalLaRecuperacioChunkDeploy(e);
      e.fetchFn.mockImplementation(async (...args) => {
        dom.window.document.body.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
        return original(...args);
      });
      expect(await recuperaErrorChunkDeploy(failure())).toBe(false);
      expect(e.finestra.location.reload).not.toHaveBeenCalled();
      expect(e.saved.setItem).not.toHaveBeenCalled();
    } finally { dom.window.close(); }
  });
  test('el veto injectat tanca si diu cert, llança o no és una funció', async () => {
    for (const tePendents of [() => true, () => { throw Error('estat desconegut'); }, 'sí']) {
      const e = environment(), motor = creaRecuperacioChunkDeploy({ ...e, tePendents });
      expect(await motor.recupera(failure())).toBe(false);
      expect(e.fetchFn).not.toHaveBeenCalled();
      expect(e.finestra.location.reload).not.toHaveBeenCalled();
    }
  });
  test('aturar la recuperació retira també les escoltes d’entrada', () => {
    const e = environment(), stop = instalLaRecuperacioChunkDeploy(e);
    for (const tipus of ENTRADES_AMB_ESTAT_EN_MEMORIA) {
      expect(e.finestra.addEventListener).toHaveBeenCalledWith(tipus, expect.any(Function), expect.objectContaining({ capture: true }));
    }
    stop();
    for (const tipus of ENTRADES_AMB_ESTAT_EN_MEMORIA) {
      expect(e.finestra.removeEventListener).toHaveBeenCalledWith(tipus, expect.any(Function), expect.objectContaining({ capture: true }));
    }
    expect(e.listeners.size).toBe(0);
  });
});
