// @vitest-environment node
/* Fase 0 de l'empaquetat mòbil (261003) · el registre del service worker.
   Només a l'entrada pròpia (src/main.jsx), només en producció, en context
   segur, fora d'iframe i fora de l'app nativa. Tot amb dobles: cap navegador. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ABAST_DEL_SW, ESDEVENIMENT_APP_VISITADA, ESDEVENIMENT_AVIS_XAT, ESPERA_ESCALFAMENT_MS, MISSATGE_AVIS_XAT, MISSATGE_ESCALFAMENT, RUTA_DEL_SW,
  TOPALL_REGISTRE_ACTIU_MS, escoltaAvisosDelWorker, escoltaEscalfament, missatgeDEscalfament, motiuPerNoRegistrar, registraServiceWorker,
  registreActiu, registreDelSw, portMissatgesAvisos, actualitzaWorkerPerDeploy
} from './registre.js';
import { importaElModul } from '../../tests/helpers/especificadorsImport.js';

/** Un navigator i una finestra de mostra, en producció i en condicions de registrar. */
function entorn({ readyState = 'complete', segur = true, incrustat = false, capacitor, register } = {}) {
  const escoltes = new Map();
  const navegador = {
    serviceWorker: { register: register || vi.fn(async (ruta, opcions) => ({ ruta, opcions })) }
  };
  const finestra = {
    isSecureContext: segur,
    document: { readyState },
    addEventListener: vi.fn((tipus, funcio) => escoltes.set(tipus, funcio)),
    Capacitor: capacitor
  };
  finestra.self = finestra;
  finestra.top = incrustat ? {} : finestra;
  return { navegador, finestra, escoltes };
}

describe('motiuPerNoRegistrar (pura)', () => {
  test('en producció, amb suport, segur, al nivell superior i al navegador: es registra', () => {
    const { navegador, finestra } = entorn();
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra })).toBeNull();
  });

  test('cada condició que falla té el seu motiu', () => {
    const { navegador, finestra } = entorn();
    expect(motiuPerNoRegistrar({ produccio: false, navegador, finestra })).toBe('desenvolupament');
    expect(motiuPerNoRegistrar({ produccio: undefined, navegador, finestra })).toBe('desenvolupament');
    expect(motiuPerNoRegistrar({ produccio: 'true', navegador, finestra })).toBe('desenvolupament');
    expect(motiuPerNoRegistrar({ produccio: true, navegador: {}, finestra })).toBe('sense-suport');
    expect(motiuPerNoRegistrar({ produccio: true, navegador: undefined, finestra })).toBe('sense-suport');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: entorn({ segur: false }).finestra })).toBe('context-insegur');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: undefined })).toBe('context-insegur');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: entorn({ incrustat: true }).finestra })).toBe('incrustat');
    expect(motiuPerNoRegistrar()).toBe('desenvolupament');
  });

  test('dins de l\'app de Capacitor no es registra; Capacitor en el web, sí', () => {
    const { navegador } = entorn();
    const nativa = entorn({ capacitor: { isNativePlatform: () => true } }).finestra;
    const web = entorn({ capacitor: { isNativePlatform: () => false } }).finestra;
    const estrany = entorn({ capacitor: { isNativePlatform: true } }).finestra;
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: nativa })).toBe('nativa');
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: web })).toBeNull();
    expect(motiuPerNoRegistrar({ produccio: true, navegador, finestra: estrany })).toBeNull();
  });
});

describe('registraServiceWorker', () => {
  test('sense arguments, en proves (import.meta.env.PROD fals), no registra res', async () => {
    expect(import.meta.env.PROD).toBe(false);
    await expect(registraServiceWorker()).resolves.toEqual({ registrat: false, motiu: 'desenvolupament' });
  });

  test('en desenvolupament no toca navigator.serviceWorker (ni un worker vell de localhost)', async () => {
    const { navegador, finestra } = entorn();
    await expect(registraServiceWorker({ produccio: false, navegador, finestra })).resolves.toEqual({ registrat: false, motiu: 'desenvolupament' });
    expect(navegador.serviceWorker.register).not.toHaveBeenCalled();
    expect(finestra.addEventListener).not.toHaveBeenCalled();
  });

  test('en producció i amb la pàgina carregada, registra /sw.js amb abast /', async () => {
    const { navegador, finestra } = entorn();
    const resultat = await registraServiceWorker({ produccio: true, navegador, finestra });
    expect(RUTA_DEL_SW).toBe('/sw.js');
    expect(ABAST_DEL_SW).toBe('/');
    expect(navegador.serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(navegador.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(resultat).toEqual({ registrat: true, registre: { ruta: '/sw.js', opcions: { scope: '/' } } });
  });

  test('si la pàgina encara carrega, espera l\'esdeveniment load (una sola vegada)', async () => {
    const { navegador, finestra, escoltes } = entorn({ readyState: 'interactive' });
    const promesa = registraServiceWorker({ produccio: true, navegador, finestra });
    await Promise.resolve();
    expect(navegador.serviceWorker.register).not.toHaveBeenCalled();
    expect(finestra.addEventListener).toHaveBeenCalledWith('load', expect.any(Function), { once: true });
    escoltes.get('load')();
    await expect(promesa).resolves.toMatchObject({ registrat: true });
    expect(navegador.serviceWorker.register).toHaveBeenCalledTimes(1);
  });

  test('un error del registre (asíncron o síncron) no llança: torna el motiu', async () => {
    const error = new Error('SecurityError');
    const asincron = entorn({ register: vi.fn(async () => { throw error; }) });
    await expect(registraServiceWorker({ produccio: true, ...asincron })).resolves.toEqual({ registrat: false, motiu: 'error', error });
    const sincron = entorn({ register: vi.fn(() => { throw error; }) });
    await expect(registraServiceWorker({ produccio: true, ...sincron })).resolves.toEqual({ registrat: false, motiu: 'error', error });
  });

  test('dins d\'un iframe, sense context segur o dins de l\'app nativa, no es registra', async () => {
    for (const opcions of [{ incrustat: true }, { segur: false }, { capacitor: { isNativePlatform: () => true } }]) {
      const { navegador, finestra } = entorn(opcions);
      const resultat = await registraServiceWorker({ produccio: true, navegador, finestra });
      expect(resultat.registrat, JSON.stringify(Object.keys(opcions))).toBe(false);
      expect(navegador.serviceWorker.register).not.toHaveBeenCalled();
    }
  });

  /* Closca de les apps (ordre del Mestre, 261007): l'escolta de l'escalfament
     naix amb el registre i només quan s'ha de registrar. */
  test('quan s\'ha de registrar, escolta des d\'ara l\'avís de les apps (també abans de load); si no, no', async () => {
    const carregant = entorn({ readyState: 'interactive' });
    const promesa = registraServiceWorker({ produccio: true, ...carregant });
    expect(carregant.finestra.addEventListener).toHaveBeenCalledWith(ESDEVENIMENT_APP_VISITADA, expect.any(Function));
    carregant.escoltes.get('load')();
    await promesa;

    for (const [produccio, opcions] of [[false, {}], [true, { incrustat: true }], [true, { segur: false }], [true, { capacitor: { isNativePlatform: () => true } }]]) {
      const { navegador, finestra } = entorn(opcions);
      await registraServiceWorker({ produccio, navegador, finestra });
      expect(finestra.addEventListener, JSON.stringify(opcions)).not.toHaveBeenCalledWith(ESDEVENIMENT_APP_VISITADA, expect.any(Function));
    }
  });
});

/* ─────────── B8C-3 (marató 261101_2143) · El toc d'un avís del Xat, del worker a la finestra ─────────── */

const ORIGEN_DEL_TOC = 'https://socdepoble.org';

/** Un contenidor del worker que guarda els oients, i una finestra EventTarget de veres que anota els esdeveniments del toc. */
function entornDelToc({ origen = ORIGEN_DEL_TOC } = {}) {
  const oients = new Set();
  const sw = {
    addEventListener: vi.fn((tipus, fn) => { if (tipus === 'message') oients.add(fn); }),
    removeEventListener: vi.fn((tipus, fn) => { if (tipus === 'message') oients.delete(fn); })
  };
  const finestra = new EventTarget();
  finestra.Event = Event;
  finestra.location = { origin: origen };
  const rebuts = [];
  finestra.addEventListener(ESDEVENIMENT_AVIS_XAT, (event) => rebuts.push(event));
  const envia = (data, { origin = ORIGEN_DEL_TOC } = {}) => { for (const fn of [...oients]) fn({ data, origin }); };
  return { navegador: { serviceWorker: sw }, finestra, sw, oients, rebuts, envia };
}

describe('escoltaAvisosDelWorker (B8C-3)', () => {
  test('els noms: el missatge del worker i l\'esdeveniment de la finestra', () => {
    expect(MISSATGE_AVIS_XAT).toBe('sdp-avis-xat');
    expect(ESDEVENIMENT_AVIS_XAT).toBe('sdp:avis-xat');
  });

  test('{ tipus: \'sdp-avis-xat\' } exacte → UN Event(\'sdp:avis-xat\') a la finestra, sense cap dada (ni detail)', () => {
    const t = entornDelToc();
    escoltaAvisosDelWorker({ navegador: t.navegador, finestra: t.finestra });
    expect(t.sw.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
    t.envia({ tipus: 'sdp-avis-xat' });
    expect(t.rebuts).toHaveLength(1);
    expect(t.rebuts[0].type).toBe('sdp:avis-xat');
    expect(t.rebuts[0].constructor).toBe(Event);
    expect(t.rebuts[0].detail).toBeUndefined();
    /* Safari pot no posar l'origen al missatge del worker: també val. */
    t.envia({ tipus: 'sdp-avis-xat' }, { origin: '' });
    expect(t.rebuts).toHaveLength(2);
  });

  test('qualsevol altra forma no despatxa res i no llança: un filId de més, un text, null, una llista, un altre tipus, l\'escalfament, una instància, un getter que llança', () => {
    const t = entornDelToc();
    escoltaAvisosDelWorker({ navegador: t.navegador, finestra: t.finestra });
    class Avis { constructor() { this.tipus = 'sdp-avis-xat'; } }
    const espia = {};
    Object.defineProperty(espia, 'tipus', { enumerable: true, get() { throw new Error('no es llig'); } });
    const proxyTrencat = new Proxy({}, { ownKeys() { throw new Error('no'); }, getPrototypeOf() { throw new Error('no'); } });
    for (const data of [
      { tipus: 'sdp-avis-xat', filId: '0b9a3f1e-1111-4111-8111-111111111111' },
      { tipus: 'sdp-avis-xat', desti: '/xat/secret' },
      'sdp-avis-xat', null, undefined, 42, ['sdp-avis-xat'], { tipus: 'altre' }, { type: 'sdp-avis-xat' },
      { tipus: MISSATGE_ESCALFAMENT, recursos: [], closca: '/app/bar' }, new Avis(), espia, proxyTrencat
    ]) {
      expect(() => t.envia(data)).not.toThrow();
    }
    expect(t.rebuts).toEqual([]);
  });

  test('un missatge d\'un altre origen s\'ignora', () => {
    const t = entornDelToc();
    escoltaAvisosDelWorker({ navegador: t.navegador, finestra: t.finestra });
    t.envia({ tipus: 'sdp-avis-xat' }, { origin: 'https://altre.org' });
    expect(t.rebuts).toEqual([]);
  });

  test('torna la funció que deixa d\'escoltar; sense worker, sense finestra o sense Event, no escolta res i no llança', () => {
    const t = entornDelToc();
    const deixa = escoltaAvisosDelWorker({ navegador: t.navegador, finestra: t.finestra });
    deixa();
    expect(t.sw.removeEventListener).toHaveBeenCalledWith('message', t.sw.addEventListener.mock.calls[0][1]);
    t.envia({ tipus: 'sdp-avis-xat' });
    expect(t.rebuts).toEqual([]);
    const quiet = entornDelToc();
    expect(() => escoltaAvisosDelWorker()()).not.toThrow();
    expect(() => escoltaAvisosDelWorker({ navegador: {}, finestra: quiet.finestra })()).not.toThrow();
    expect(() => escoltaAvisosDelWorker({ navegador: quiet.navegador, finestra: null })()).not.toThrow();
    expect(() => escoltaAvisosDelWorker({ navegador: quiet.navegador, finestra: { dispatchEvent: () => true } })()).not.toThrow();
    expect(quiet.sw.addEventListener).not.toHaveBeenCalled();
  });

  test('registraServiceWorker l\'escolta només quan s\'ha de registrar (producció, segur, al nivell de dalt, al navegador), també abans de load', async () => {
    const ambToc = (opcions) => {
      const e = entorn(opcions);
      e.navegador.serviceWorker.addEventListener = vi.fn();
      e.finestra.Event = Event;
      e.finestra.dispatchEvent = vi.fn();
      return e;
    };
    const escoltaMissatges = (e) => e.navegador.serviceWorker.addEventListener.mock.calls.some(([tipus]) => tipus === 'message');
    const carregant = ambToc({ readyState: 'interactive' });
    const promesa = registraServiceWorker({ produccio: true, navegador: carregant.navegador, finestra: carregant.finestra });
    expect(escoltaMissatges(carregant)).toBe(true);
    carregant.escoltes.get('load')();
    await promesa;
    for (const [produccio, opcions] of [[false, {}], [true, { incrustat: true }], [true, { segur: false }], [true, { capacitor: { isNativePlatform: () => true } }]]) {
      const e = ambToc(opcions);
      await registraServiceWorker({ produccio, navegador: e.navegador, finestra: e.finestra });
      expect(escoltaMissatges(e), JSON.stringify([produccio, opcions])).toBe(false);
    }
  });
});

/* ─────────── Escalfament de la closca de les apps (ordre del Mestre, 261007) ─────────── */

const ORIGEN = 'https://socdepoble.org';
const JS = '/assets/index-B5hur-io.js';
const CHUNK_APP = '/assets/AppBar-AbCdEf12.js';
const entrada = (cami) => ({ name: cami.startsWith('http') ? cami : `${ORIGEN}${cami}` });

describe('missatgeDEscalfament (pura)', () => {
  test('a /app/*: els recursos amb empremta del mateix origen ja carregats, sense consulta ni repetir, i la ruta per a la closca', () => {
    const entrades = [JS, CHUNK_APP, JS, `${JS}?v=1`, '/assets/system/ui/logo.svg', '/fonts/noto-sans.css', '/rag-index.json',
      'https://altre.org/assets/x-12345678.js', 'https://abcdefgh.supabase.co/rest/v1/posts'].map(entrada);
    const missatge = missatgeDEscalfament({ entrades: [...entrades, { name: 'no és una url' }, null, {}], ubicacio: { origin: ORIGEN, pathname: '/app/bar/tpv' } });
    expect(missatge).toEqual({ tipus: MISSATGE_ESCALFAMENT, recursos: [JS, CHUNK_APP], closca: '/app/bar/tpv' });
    expect(MISSATGE_ESCALFAMENT).toBe('sdp-escalfa');
  });

  test('fora de /app/*, cap missatge: el comportament de la resta del lloc no canvia', () => {
    for (const pathname of ['/', '/mur', '/apps', '/application', '/xat/app']) {
      expect(missatgeDEscalfament({ entrades: [entrada(JS)], ubicacio: { origin: ORIGEN, pathname } }), pathname).toBeNull();
    }
    expect(missatgeDEscalfament()).toBeNull();
    expect(missatgeDEscalfament({ entrades: [entrada(JS)] })).toBeNull();
  });

  test('sense entrades (o sense performance), el missatge només porta la closca', () => {
    expect(missatgeDEscalfament({ entrades: undefined, ubicacio: { origin: ORIGEN, pathname: '/app' } }))
      .toEqual({ tipus: MISSATGE_ESCALFAMENT, recursos: [], closca: '/app' });
  });
});

describe('escoltaEscalfament', () => {
  /** Una finestra de veres (EventTarget) a `pathname` i un worker controlador de mostra. */
  function pagina({ pathname = '/app/bar/tpv', controlador = { postMessage: vi.fn() }, entrades = [entrada(JS), entrada(CHUNK_APP)] } = {}) {
    const finestra = new EventTarget();
    finestra.location = { origin: ORIGEN, pathname };
    finestra.performance = { getEntriesByType: vi.fn((tipus) => (tipus === 'resource' ? entrades : [])) };
    const sw = new EventTarget();
    sw.controller = controlador;
    return { finestra, navegador: { serviceWorker: sw }, sw, controlador };
  }

  test('l\'avís de RutaApps envia al worker els recursos ja carregats i la ruta de l\'app', () => {
    const { finestra, navegador, controlador } = pagina();
    escoltaEscalfament({ navegador, finestra });
    expect(controlador.postMessage).not.toHaveBeenCalled();
    finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    expect(controlador.postMessage).toHaveBeenCalledTimes(1);
    expect(controlador.postMessage).toHaveBeenCalledWith({ tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP], closca: '/app/bar/tpv' });
  });

  test('primera visita: quan el worker pren el control (controllerchange), envia el que la pàgina ja havia carregat', () => {
    const { finestra, navegador, sw } = pagina({ controlador: null });
    escoltaEscalfament({ navegador, finestra });
    finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA)); // encara cap worker: res
    const controlador = { postMessage: vi.fn() };
    sw.controller = controlador;
    sw.dispatchEvent(new Event('controllerchange'));
    expect(controlador.postMessage).toHaveBeenCalledTimes(1);
  });

  test('fora de /app/* no envia res, ni per l\'avís ni per controllerchange', () => {
    const { finestra, navegador, sw, controlador } = pagina({ pathname: '/mur' });
    escoltaEscalfament({ navegador, finestra });
    finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    sw.dispatchEvent(new Event('controllerchange'));
    expect(controlador.postMessage).not.toHaveBeenCalled();
  });

  test('no llança mai: sense controlador, amb un postMessage que falla o sense performance', () => {
    const fallida = pagina({ controlador: { postMessage: vi.fn(() => { throw new Error('DataCloneError'); }) } });
    escoltaEscalfament(fallida);
    expect(() => fallida.finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA))).not.toThrow();

    const sensePerformance = pagina();
    delete sensePerformance.finestra.performance;
    escoltaEscalfament(sensePerformance);
    sensePerformance.finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    expect(sensePerformance.controlador.postMessage).toHaveBeenCalledWith({ tipus: 'sdp-escalfa', recursos: [], closca: '/app/bar/tpv' });

    expect(() => escoltaEscalfament()).not.toThrow();
    expect(() => escoltaEscalfament({ navegador: {}, finestra: new EventTarget() })).not.toThrow();
    expect(() => escoltaEscalfament({ navegador: { serviceWorker: { register: vi.fn() } }, finestra: {} })).not.toThrow();
  });

  test('torna la funció que deixa d\'escoltar', () => {
    const { finestra, navegador, sw, controlador } = pagina();
    const deixa = escoltaEscalfament({ navegador, finestra });
    deixa();
    finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    sw.dispatchEvent(new Event('controllerchange'));
    expect(controlador.postMessage).not.toHaveBeenCalled();
  });
});

/* Revisió F1 (261007): el worker guarda una closca per app i la pàgina la
   confirma amb TOTS els recursos que ha carregat. RutaApps avisa abans que
   arribe el chunk lazy de l'app: el missatge espera una mica i torna a eixir
   quan l'observador de Resource Timing veu un recurs amb empremta nou. */
describe('escoltaEscalfament amb espera i observador de recursos (revisió F1)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Un PerformanceObserver de mostra: guarda la funció i deixa emetre entrades a mà. */
  function observadorDeMostra({ observeFalla = false } = {}) {
    const instancies = [];
    class Observador {
      constructor(funcio) {
        this.funcio = funcio;
        this.observe = vi.fn((opcions) => {
          if (observeFalla && opcions.type) throw new TypeError('type no admés');
        });
        this.disconnect = vi.fn();
        instancies.push(this);
      }

      emet(noms) {
        this.funcio({ getEntries: () => noms.map((nom) => entrada(nom)) });
      }
    }
    return { Observador, instancies };
  }

  /** Una finestra de veres amb temporitzadors (falsos) i un observador de mostra. */
  function paginaAmbEspera({ pathname = '/app/bar/tpv', carregades = [JS], observeFalla = false } = {}) {
    vi.useFakeTimers();
    const finestra = new EventTarget();
    finestra.location = { origin: ORIGEN, pathname };
    finestra.performance = { getEntriesByType: vi.fn(() => carregades.map(entrada)) };
    finestra.setTimeout = (funcio, ms) => setTimeout(funcio, ms);
    finestra.clearTimeout = (id) => clearTimeout(id);
    const { Observador, instancies } = observadorDeMostra({ observeFalla });
    finestra.PerformanceObserver = Observador;
    const sw = new EventTarget();
    const controlador = { postMessage: vi.fn() };
    sw.controller = controlador;
    return { finestra, navegador: { serviceWorker: sw }, sw, controlador, observador: () => instancies[0] };
  }

  test('l\'espera és curta i fixa', () => {
    expect(ESPERA_ESCALFAMENT_MS).toBe(500);
  });

  test('l\'avís no envia res al moment: després de l\'espera, un sol missatge amb el chunk de l\'app que ha arribat mentrestant', () => {
    const p = paginaAmbEspera();
    escoltaEscalfament(p);
    p.finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS - 100);
    expect(p.controlador.postMessage).not.toHaveBeenCalled();
    // El chunk lazy de l'app arriba després de l'avís: l'espera torna a començar.
    p.observador().emet([`${ORIGEN}${CHUNK_APP}`]);
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS - 1);
    expect(p.controlador.postMessage).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(p.controlador.postMessage).toHaveBeenCalledTimes(1);
    expect(p.controlador.postMessage).toHaveBeenCalledWith({ tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP], closca: '/app/bar/tpv' });
  });

  test('una vista oberta després (un chunk amb empremta nou) torna a enviar el missatge; un recurs repetit, sense empremta o d\'un altre origen, no', () => {
    const vista = '/assets/Caixa-AbCdEf12.js';
    const p = paginaAmbEspera({ carregades: [JS, CHUNK_APP] });
    escoltaEscalfament(p);
    p.finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS);
    expect(p.controlador.postMessage).toHaveBeenCalledTimes(1);

    p.observador().emet([`${ORIGEN}/assets/system/ui/logo.svg`, 'https://altre.org/assets/x-12345678.js', `${ORIGEN}${JS}?v=1`, 'https://abcdefgh.supabase.co/rest/v1/posts']);
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS * 2);
    expect(p.controlador.postMessage).toHaveBeenCalledTimes(1);

    p.observador().emet([`${ORIGEN}${vista}`]);
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS);
    expect(p.controlador.postMessage).toHaveBeenCalledTimes(2);
    expect(p.controlador.postMessage).toHaveBeenLastCalledWith({ tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP, vista], closca: '/app/bar/tpv' });

    p.observador().emet([`${ORIGEN}${vista}`]);
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS * 2);
    expect(p.controlador.postMessage).toHaveBeenCalledTimes(2);
  });

  test('el que veu l\'observador va al missatge encara que el buffer de Resource Timing ja estiga ple', () => {
    const p = paginaAmbEspera({ carregades: [] });
    escoltaEscalfament(p);
    p.observador().emet([`${ORIGEN}${JS}`, `${ORIGEN}${CHUNK_APP}`]);
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS);
    expect(p.controlador.postMessage).toHaveBeenCalledWith({ tipus: 'sdp-escalfa', recursos: [JS, CHUNK_APP], closca: '/app/bar/tpv' });
  });

  test('fora de /app/* l\'observador no programa res', () => {
    const p = paginaAmbEspera({ pathname: '/mur' });
    escoltaEscalfament(p);
    p.observador().emet([`${ORIGEN}${CHUNK_APP}`]);
    p.finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS * 2);
    expect(p.controlador.postMessage).not.toHaveBeenCalled();
  });

  test('observa amb type i buffered (també els ja carregats); si el navegador no ho admet, amb entryTypes', () => {
    const amb = paginaAmbEspera();
    escoltaEscalfament(amb);
    expect(amb.observador().observe).toHaveBeenCalledWith({ type: 'resource', buffered: true });

    const sense = paginaAmbEspera({ observeFalla: true });
    escoltaEscalfament(sense);
    expect(sense.observador().observe).toHaveBeenLastCalledWith({ entryTypes: ['resource'] });
  });

  test('deixar d\'escoltar desconnecta l\'observador i cancel·la l\'enviament pendent', () => {
    const p = paginaAmbEspera();
    const deixa = escoltaEscalfament(p);
    p.finestra.dispatchEvent(new Event(ESDEVENIMENT_APP_VISITADA));
    deixa();
    vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS * 2);
    expect(p.controlador.postMessage).not.toHaveBeenCalled();
    expect(p.observador().disconnect).toHaveBeenCalledTimes(1);
  });

  test('sense PerformanceObserver, o si el constructor falla, l\'avís i el canvi de controlador continuen enviant', () => {
    for (const Observador of [undefined, function Trencat() { throw new Error('res'); }]) {
      const p = paginaAmbEspera();
      p.finestra.PerformanceObserver = Observador;
      expect(() => escoltaEscalfament(p)).not.toThrow();
      p.sw.dispatchEvent(new Event('controllerchange'));
      vi.advanceTimersByTime(ESPERA_ESCALFAMENT_MS);
      expect(p.controlador.postMessage).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    }
  });
});

/* Ordre nocturna 261030_0252 (Fase 3, WP) · El registre que reben els avisos
   push (src/pwa/avisosPush.js): el del worker propi, actiu i sense cap versió
   en espera ni instal·lant-se. */
describe('registreActiu', () => {
  const worker = (cami = RUTA_DEL_SW) => ({ scriptURL: `https://socdepoble.org${cami}` });
  const navegadorAmb = (getRegistration) => ({ serviceWorker: { getRegistration } });

  test('el registre de /sw.js amb un worker actiu i res en espera: el torna, i el demana per a l\'abast /', async () => {
    const registre = { active: worker(), waiting: null, installing: null, pushManager: {} };
    const getRegistration = vi.fn(async () => registre);
    expect(await registreActiu({ navegador: navegadorAmb(getRegistration) })).toBe(registre);
    expect(getRegistration).toHaveBeenCalledWith(ABAST_DEL_SW);
  });

  test('una versió en espera o instal·lant-se, cap worker actiu, un altre script o cap registre: null', async () => {
    for (const registre of [
      { active: worker(), waiting: worker() }, { active: worker(), installing: worker() }, { active: null }, {},
      { active: worker('/service-worker.js') }, { active: { scriptURL: 'no és cap URL' } }, undefined, null
    ]) {
      expect(await registreActiu({ navegador: navegadorAmb(vi.fn(async () => registre)) }), JSON.stringify(registre)).toBeNull();
    }
  });

  test('sense suport o amb un getRegistration que falla (síncron o asíncron): null, mai una excepció', async () => {
    for (const navegador of [undefined, {}, { serviceWorker: {} }, navegadorAmb(() => { throw new Error('SecurityError'); }),
      navegadorAmb(async () => { throw new Error('InvalidStateError'); })]) {
      await expect(registreActiu({ navegador })).resolves.toBeNull();
    }
  });

  test('si el navegador no contesta, el topall torna null; quan contesta, no deixa cap rellotge viu', async () => {
    expect(TOPALL_REGISTRE_ACTIU_MS).toBe(3000);
    await expect(registreActiu({ navegador: navegadorAmb(() => new Promise(() => {})), topallMs: 5 })).resolves.toBeNull();
    vi.useFakeTimers();
    try {
      const registre = { active: worker() };
      const resultat = await registreActiu({ navegador: navegadorAmb(async () => registre) });
      expect(resultat).toBe(registre);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

/* Gauntlet c3 (push-desactiva-fals-exit-amb-worker-en-espera) · El registre
   de la BAIXA dels avisos push: el propi, també amb una versió en espera o
   instal·lant-se (la subscripció penja del registre, no del worker actiu). */
describe('registreDelSw', () => {
  const worker = (cami = RUTA_DEL_SW) => ({ scriptURL: `https://socdepoble.org${cami}` });
  const navegadorAmb = (getRegistration) => ({ serviceWorker: { getRegistration } });

  test('el registre propi amb una versió en espera o instal·lant-se (on registreActiu dona null): el torna, demanat per a l\'abast /', async () => {
    for (const registre of [
      { active: worker(), waiting: worker() }, { active: worker(), installing: worker() }, { active: null, installing: worker() },
      { active: worker('/service-worker.js'), waiting: worker() }, { active: worker(), waiting: null, installing: null }
    ]) {
      const getRegistration = vi.fn(async () => registre);
      expect(await registreDelSw({ navegador: navegadorAmb(getRegistration) }), JSON.stringify(registre)).toBe(registre);
      expect(getRegistration).toHaveBeenCalledWith(ABAST_DEL_SW);
    }
    expect(await registreActiu({ navegador: navegadorAmb(async () => ({ active: worker(), waiting: worker() })) })).toBeNull();
  });

  test('cap worker propi, cap registre, sense suport, un getRegistration que falla o que no contesta: null, mai una excepció', async () => {
    for (const registre of [{}, { active: null }, { active: worker('/service-worker.js') }, { waiting: { scriptURL: 'no és cap URL' } }, undefined, null]) {
      expect(await registreDelSw({ navegador: navegadorAmb(vi.fn(async () => registre)) }), JSON.stringify(registre)).toBeNull();
    }
    for (const navegador of [undefined, {}, { serviceWorker: {} }, navegadorAmb(() => { throw new Error('SecurityError'); }),
      navegadorAmb(async () => { throw new Error('InvalidStateError'); })]) {
      await expect(registreDelSw({ navegador })).resolves.toBeNull();
    }
    await expect(registreDelSw({ navegador: navegadorAmb(() => new Promise(() => {})), topallMs: 5 })).resolves.toBeNull();
  });
});

/* ─────────── Frontera: entrada pròpia sí, paquet autònom i amfitrions no ─────────── */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    if (entrada.name === 'node_modules') continue;
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.(?:m?js|jsx)$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}

describe('frontera', () => {
  const PRODUCCIO = fitxersDe('src').filter((ruta) => !esProva(ruta));

  test('només src/main.jsx importa el registre', () => {
    const importen = PRODUCCIO.filter((ruta) => /from\s+['"][^'"]*pwa\/registre(?:\.js)?['"]/.test(llig(ruta)));
    expect(importen).toEqual(['src/main.jsx']);
    expect(llig('src/main.jsx')).toMatch(/^registraServiceWorker\(\);$/m);
  });

  /* B8C-3 (marató 261101_2143; Bloc B8) · L'adaptador web dels avisos push
     del Xat: només l'entrada pròpia el carrega, amb import() i darrere de la
     bandera (apagada, Rollup lleva el bloc i el tros); de l'entorn, només la
     clau pública. Es llig l'AST de main.jsx, no el text cru. */
  const CLAUS_SENSE_CODI = new Set(['loc', 'start', 'end', 'extra', 'comments', 'leadingComments', 'trailingComments', 'innerComments', 'errors']);
  function recorre(node, visita, pares = []) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const fill of node) recorre(fill, visita, pares);
      return;
    }
    if (typeof node.type === 'string') visita(node, pares);
    const amb = typeof node.type === 'string' ? [...pares, node] : pares;
    for (const [clau, fill] of Object.entries(node)) if (!CLAUS_SENSE_CODI.has(clau)) recorre(fill, visita, amb);
  }
  const astDe = (ruta) => parse(llig(ruta), { sourceType: 'module', plugins: ['jsx'] });
  const esImportMeta = (node) => node?.type === 'MetaProperty' && node.meta?.name === 'import' && node.property?.name === 'meta';
  const esLaBandera = (node) => node?.type === 'Identifier' && node.name === 'AVISOS_PUSH_XAT_ACTIUS';

  test('B8C-3: només src/main.jsx carrega l\'adaptador web, amb UN import() dins d\'if (AVISOS_PUSH_XAT_ACTIUS) al nivell de dalt; mai un import estàtic', () => {
    expect(PRODUCCIO.filter((ruta) => importaElModul(llig(ruta), 'adaptadorAvisosPush', ruta))).toEqual(['src/main.jsx']);
    const ast = astDe('src/main.jsx');
    const estatics = [];
    const dinamics = [];
    recorre(ast.program, (node, pares) => {
      if (node.type === 'ImportDeclaration') {
        if (/adaptadorAvisosPush/.test(node.source.value)) estatics.push(node.source.value);
        if (node.source.value === './config/avisosPushXat.js') estatics.push(`bandera:${node.specifiers.map((s) => s.imported?.name).join(',')}`);
      }
      const font = node.type === 'ImportExpression' ? node.source : (node.type === 'CallExpression' && node.callee.type === 'Import' ? node.arguments[0] : null);
      if (font && /adaptadorAvisosPush/.test(font.value)) dinamics.push({ font: font.value, pares });
    });
    expect(estatics.filter((e) => !e.startsWith('bandera:'))).toEqual([]);
    expect(estatics.find((e) => e.startsWith('bandera:'))).toMatch(/\bAVISOS_PUSH_XAT_ACTIUS\b/);
    expect(dinamics.map((d) => d.font)).toEqual(['./pwa/adaptadorAvisosPush.js']);
    const [{ pares }] = dinamics;
    const indexIf = pares.findIndex((pare) => pare.type === 'IfStatement' && esLaBandera(pare.test));
    expect(indexIf, 'l\'import() ha d\'anar dins d\'if (AVISOS_PUSH_XAT_ACTIUS)').toBeGreaterThanOrEqual(0);
    const siBandera = pares[indexIf];
    expect(pares[indexIf + 1], 'dins de la branca certa, no de l\'else').toBe(siBandera.consequent);
    expect(siBandera.alternate).toBeNull();
    expect(pares[indexIf - 1]?.type, 'al nivell de dalt del mòdul').toBe('Program');
    /* Cap altre import() ni cap altra crida al registre dels avisos fora del bloc. */
    const registren = [];
    recorre(ast.program, (node, pares) => {
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'registraAvisosPush') registren.push(pares.includes(siBandera));
    });
    expect(registren).toEqual([true]);
  });

  test('B8C-3: main.jsx llig de l\'entorn VITE_PUSH_VAPID_PUBLICA i mai import.meta.env sencer', () => {
    const variables = [];
    let senceres = 0;
    recorre(astDe('src/main.jsx').program, (node, pares) => {
      if (node.type !== 'MemberExpression' || node.computed || !esImportMeta(node.object) || node.property.name !== 'env') return;
      const pare = pares[pares.length - 1];
      if (pare?.type === 'MemberExpression' && pare.object === node && !pare.computed) variables.push(pare.property.name);
      else senceres += 1;
    });
    expect(senceres).toBe(0);
    expect(variables).toContain('VITE_PUSH_VAPID_PUBLICA');
    expect(variables).toContain('PROD');
    expect(llig('src/main.jsx')).not.toMatch(/import\.meta\.env\s*[),;\]}]/);
  });

  /* Correcció ARB-B8C3-02 (marató 261101_2143) · El cablatge de l'adaptador,
     propietat a propietat. Amb l'esdeveniment equivocat, el toc d'una finestra
     que ja és al Xat es perdria en silenci; amb els dos registres
     intercanviats, se subscriuria contra un worker en espera i la baixa en
     eixir no el trobaria. */
  test('B8C-3: main.jsx passa a creaAvisosPushWeb exactament registreActiu, registreDelSw i ESDEVENIMENT_AVIS_XAT de registre.js, la clau VITE i PROD, i el resultat va a registraAvisosPush', () => {
    const ast = astDe('src/main.jsx');
    /* Els noms locals dels imports de ./pwa/registre.js → el nom exportat. */
    const delRegistre = new Map();
    for (const node of ast.program.body) {
      if (node.type !== 'ImportDeclaration' || node.source.value !== './pwa/registre.js') continue;
      for (const s of node.specifiers) if (s.type === 'ImportSpecifier') delRegistre.set(s.local.name, s.imported.name);
    }
    const crides = [];
    recorre(ast.program, (node, pares) => {
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'creaAvisosPushWeb') crides.push({ node, pares });
    });
    expect(crides).toHaveLength(1);
    const [{ node: crida, pares }] = crides;
    const pare = pares[pares.length - 1];
    expect(pare.type === 'CallExpression' && pare.callee.name === 'registraAvisosPush' && pare.arguments[0] === crida, 'dins de registraAvisosPush(…)').toBe(true);
    /* creaAvisosPushWeb és el del tros de l'adaptador: el paràmetre desestructurat del .then de l'import(). */
    expect(pares.some((p) => p.type === 'ArrowFunctionExpression' && p.params[0]?.type === 'ObjectPattern' &&
      p.params[0].properties.some((q) => q.key?.name === 'creaAvisosPushWeb'))).toBe(true);
    expect(crida.arguments).toHaveLength(1);
    const [opcions] = crida.arguments;
    expect(opcions.type).toBe('ObjectExpression');
    const valor = new Map();
    for (const p of opcions.properties) {
      expect(p.type, 'cap spread ni mètode').toBe('ObjectProperty');
      expect(p.computed).toBe(false);
      valor.set(p.key.name, p.value);
    }
    expect([...valor.keys()].sort()).toEqual(['clau', 'esdevenimentToc', 'missatges', 'produccio', 'registreActiu', 'registreDelSw']);
    const importat = (node) => (node?.type === 'Identifier' ? delRegistre.get(node.name) ?? null : null);
    expect(importat(valor.get('registreActiu')), 'per a SUBSCRIURE').toBe('registreActiu');
    expect(importat(valor.get('registreDelSw')), 'per a la BAIXA, l\'interruptor i la neteja').toBe('registreDelSw');
    expect(importat(valor.get('esdevenimentToc')), 'el toc del worker').toBe('ESDEVENIMENT_AVIS_XAT');
    const missatges = valor.get('missatges');
    expect(missatges.type).toBe('CallExpression');
    expect(missatges.arguments).toEqual([]);
    expect(importat(missatges.callee), 'port de missatges de l’únic propietari').toBe('portMissatgesAvisos');
    const variableDEntorn = (node) => (node?.type === 'MemberExpression' && !node.computed && node.object?.type === 'MemberExpression' &&
      !node.object.computed && esImportMeta(node.object.object) && node.object.property.name === 'env' ? node.property.name : null);
    expect(variableDEntorn(valor.get('clau'))).toBe('VITE_PUSH_VAPID_PUBLICA');
    expect(variableDEntorn(valor.get('produccio'))).toBe('PROD');
  });

  /* Onada R9 · C3 (G8-09) · El motor del registre dels avisos push
     (config/motorAvisosPushXat.js) no viatja a l'entrada: només el porten,
     per import() dins del bloc de la bandera i ABANS de l'adaptador (que s'ha
     de trobar el motor endollat), l'entrada web i la nativa. Cap import estàtic. */
  test('Onada R9: el motor del registre només arriba per import(), dins del bloc de la bandera i abans de l\'adaptador (web i natiu)', () => {
    const estatics = PRODUCCIO.filter((ruta) => ruta !== 'src/config/motorAvisosPushXat.js' &&
      /(?:from|import)\s*['"][^'"]*motorAvisosPushXat(?:\.js)?['"]/.test(llig(ruta)));
    expect(estatics).toEqual([]);
    const dinamics = PRODUCCIO.filter((ruta) => /import\(\s*['"][^'"]*motorAvisosPushXat(?:\.js)?['"]\s*\)/.test(llig(ruta))).sort();
    expect(dinamics).toEqual(['src/main.jsx', 'src/natiu/entrada.jsx']);
    for (const [ruta, adaptador] of [['src/main.jsx', "import('./pwa/adaptadorAvisosPush.js')"], ['src/natiu/entrada.jsx', "import('./avisosPushNatius.js')"]]) {
      const codi = llig(ruta);
      const bandera = codi.indexOf('if (AVISOS_PUSH_XAT_ACTIUS) {');
      const motor = codi.search(/import\('\.{1,2}\/config\/motorAvisosPushXat\.js'\)/);
      expect(bandera, ruta).toBeGreaterThan(-1);
      expect(motor, ruta).toBeGreaterThan(bandera);
      expect(codi.indexOf(adaptador), ruta).toBeGreaterThan(motor);
    }
  });

  test('B8C-3: el bloc del push va darrere de registraServiceWorker(); i l\'adaptador no nomena el worker ni cap emmagatzematge', () => {
    const main = llig('src/main.jsx');
    expect(main.indexOf('\nregistraServiceWorker();\n')).toBeGreaterThan(0);
    expect(main.indexOf('if (AVISOS_PUSH_XAT_ACTIUS)')).toBeGreaterThan(main.indexOf('\nregistraServiceWorker();\n'));
    const adaptador = llig('src/pwa/adaptadorAvisosPush.js');
    expect(adaptador).not.toMatch(new RegExp(['service', 'Worker|local', 'Storage|session', 'Storage|indexed', 'DB|Capacitor'].join('')));
  });

  /* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · L'oferta
     d'instal·lar a l'ordinador és de la pàgina, com el worker: dins d'un
     amfitrió, quedar-se-la li furtaria la seua instal·lació (LLEI 3). */
  test('només src/main.jsx captura l\'oferta d\'instal·lació, al nivell de dalt; ni embed.jsx ni l\'entrada nativa', () => {
    const capturen = PRODUCCIO.filter((ruta) => /\bcapturaInstalacio\s*\(/.test(llig(ruta)) && ruta !== 'src/pwa/instalacio.js');
    expect(capturen).toEqual(['src/main.jsx']);
    expect(llig('src/main.jsx')).toMatch(/^capturaInstalacio\(\);$/m);
    expect(llig('src/main.jsx')).toMatch(/^import \{ capturaInstalacio \} from '\.\/pwa\/instalacio\.js';$/m);
    for (const entrada of ['src/embed.jsx', 'src/natiu/entrada.jsx']) {
      const codi = llig(entrada);
      expect(codi, entrada).not.toMatch(/pwa\/instalacio|capturaInstalacio/);
    }
  });

  test('cap altre fitxer de producció de src/ toca el service worker', () => {
    const patro = new RegExp(['service', 'Worker'].join(''));
    expect(PRODUCCIO.filter((ruta) => patro.test(llig(ruta)))).toEqual(['src/pwa/registre.js']);
  });

  test('el paquet autònom entra per embed.jsx, que no importa main.jsx ni la PWA', () => {
    const embed = llig('src/embed.jsx');
    expect(embed).not.toMatch(/from\s+['"][^'"]*(?:main(?:\.jsx)?|pwa\/[^'"]*)['"]/);
    expect(embed).not.toMatch(/import\(\s*['"][^'"]*(?:main|pwa)/);
    expect(llig('vite.standalone.config.js')).toMatch(/entry:\s*path\.resolve\(__dirname,\s*'src\/embed\.jsx'\)/);
  });

  /* Closca de les apps (ordre del Mestre, 261007): el component només avisa;
     el worker el toca este fitxer, que només importa l'entrada pròpia. */
  const AVIS = 'src/apps/plataforma/escalfamentMemoriaCau.js';

  test('l\'avís de les apps porta el mateix nom ací i a la plataforma', () => {
    expect(ESDEVENIMENT_APP_VISITADA).toBe('sdp:app-visitada');
    expect(llig(AVIS)).toContain(`export const ESDEVENIMENT_APP_VISITADA = '${ESDEVENIMENT_APP_VISITADA}';`);
  });

  test('el component no toca el worker: l\'avís no importa la PWA ni nomena el worker, la Cache API ni postMessage', () => {
    const codi = llig(AVIS);
    const importats = [...codi.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    expect(importats).toEqual(['react', '../../app/contexts/RouterContext', '../../app/contexts/UIContext', './interruptors.js']);
    expect(codi).not.toMatch(new RegExp(['service', 'Worker|\\bcaches\\.|post', 'Message'].join('')));
  });

  test('només RutaApps (la closca de les apps) crida l\'avís; cap app, ni la Gestoria ni els Tractors', () => {
    const importen = PRODUCCIO.filter((ruta) => /from\s+['"][^'"]*escalfamentMemoriaCau(?:\.js)?['"]/.test(llig(ruta)));
    expect(importen).toEqual(['src/apps/plataforma/RutaApps.jsx']);
    expect(llig('src/apps/plataforma/RutaApps.jsx')).toMatch(/^\s+useEscalfamentMemoriaCau\(\);/m);
  });
});


describe('R54 · portMissatgesAvisos conserva l’únic propietari', () => {
  test('fora de producció no llig ni tan sols el contenidor antic', () => {
    const read = vi.fn(() => { throw Error('no access'); });
    const navegador = Object.defineProperty({}, 'serviceWorker', { get: read });
    expect(portMissatgesAvisos({ produccio: false, navegador, finestra: entorn().finestra })).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });
  test('el port congelat només permet missatges i retirar-ne l’escolta, sense exposar APIs del contenidor', () => {
    const sw = { addEventListener: vi.fn(), removeEventListener: vi.fn(), register: vi.fn(), controller: { postMessage: vi.fn() } };
    const port = portMissatgesAvisos({ produccio: true, navegador: { serviceWorker: sw }, finestra: entorn().finestra });
    expect(Object.isFrozen(port)).toBe(true);
    expect(Object.keys(port).sort()).toEqual(['addEventListener', 'removeEventListener']);
    const rep = vi.fn(), options = { once: true };
    port.addEventListener('message', rep, options);port.removeEventListener('message', rep, options);
    expect(sw.addEventListener).toHaveBeenCalledWith('message', rep, options);
    expect(sw.removeEventListener).toHaveBeenCalledWith('message', rep, options);
    port.addEventListener('controllerchange', rep);port.addEventListener('push', rep);port.addEventListener('message', null);
    expect(sw.addEventListener).toHaveBeenCalledTimes(1);
    expect(sw.register).not.toHaveBeenCalled();expect(sw.controller.postMessage).not.toHaveBeenCalled();
  });
  test('iframe, natiu, context insegur, suport absent i getters hostils fallen tancats', () => {
    const sw = { addEventListener: vi.fn() };
    for (const finestra of [entorn({ incrustat: true }).finestra, entorn({ segur: false }).finestra, entorn({ capacitor: { isNativePlatform: () => true } }).finestra]) {
      expect(portMissatgesAvisos({ produccio: true, navegador: { serviceWorker: sw }, finestra })).toBeNull();
    }
    expect(portMissatgesAvisos({ produccio: true, navegador: {}, finestra: entorn().finestra })).toBeNull();
    expect(portMissatgesAvisos({ produccio: true, navegador: Object.defineProperty({}, 'serviceWorker', { get() { throw Error('blocked'); } }), finestra: entorn().finestra })).toBeNull();
    expect(sw.addEventListener).not.toHaveBeenCalled();
  });
});


describe('actualització acotada després de provar desplegament nou', () => {
  function prova() {
    const origin = 'https://socdepoble.org';
    const waiting = { scriptURL: origin + '/sw.js', postMessage: vi.fn() };
    const reg = { scope: origin + '/', active: { scriptURL: origin + '/sw.js' }, waiting, update: vi.fn(async () => {}) };
    return { reg, waiting, navegador: { serviceWorker: { getRegistration: vi.fn(async () => reg) } },
      finestra: { location: { origin } } };
  }
  test('només el registre propi d’abast arrel rep update i SKIP_WAITING', async () => {
    const e = prova(); await actualitzaWorkerPerDeploy(e);
    expect(e.reg.update).toHaveBeenCalledOnce();
    expect(e.waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
  test.each(['https://alie.invalid/sw.js', 'https://socdepoble.org/altre.js', 'https://socdepoble.org/sw.js?x=1', 'https://socdepoble.org/sw.js#x'])('refusa worker alié o no canònic %s', async scriptURL => {
    const e = prova(); e.reg.active.scriptURL = scriptURL; e.waiting.scriptURL = scriptURL;
    await actualitzaWorkerPerDeploy(e); expect(e.reg.update).not.toHaveBeenCalled();
    expect(e.waiting.postMessage).not.toHaveBeenCalled();
  });
  test('abast diferent i cancel·lació durant update no avancen', async () => {
    const e = prova(); e.reg.scope += 'app/';
    await actualitzaWorkerPerDeploy(e); expect(e.reg.update).not.toHaveBeenCalled();
    e.reg.scope = e.finestra.location.origin + '/'; let vigent = true;
    e.reg.update.mockImplementation(async () => { vigent = false; });
    await actualitzaWorkerPerDeploy({ ...e, vigent: () => vigent });
    expect(e.waiting.postMessage).not.toHaveBeenCalled();
  });

  /* Gauntlet R22 (pwa-03) · update() es resol amb el worker nou encara a
     `installing` (algoritme Install), no a `waiting`: el doble d'abans ja
     portava un `waiting` i la prova passava pel motiu equivocat. */
  function workerNou(origin) {
    const escoltes = new Set();
    const worker = { scriptURL: origin + '/sw.js', state: 'installing', postMessage: vi.fn(),
      addEventListener: vi.fn((tipus, fn) => { if (tipus === 'statechange') escoltes.add(fn); }),
      removeEventListener: vi.fn((tipus, fn) => { if (tipus === 'statechange') escoltes.delete(fn); }),
      instalLat(reg) {
        Object.assign(reg, { installing: null, waiting: worker }); worker.state = 'installed';
        for (const fn of [...escoltes]) fn();
      },
      escoltes };
    return worker;
  }
  test('pwa-03 · el worker nou rep SKIP_WAITING mentre s’instal·la i de nou en arribar a installed', async () => {
    const e = prova(), nou = workerNou(e.finestra.location.origin);
    e.reg.waiting = null;
    e.reg.update.mockImplementation(async () => { e.reg.installing = nou; });
    const feina = actualitzaWorkerPerDeploy(e);
    await vi.waitFor(() => expect(nou.escoltes.size).toBe(1));
    expect(nou.postMessage.mock.calls).toEqual([[{ type: 'SKIP_WAITING' }]]);
    nou.instalLat(e.reg);
    await feina;
    expect(nou.postMessage.mock.calls).toEqual([[{ type: 'SKIP_WAITING' }], [{ type: 'SKIP_WAITING' }]]);
    expect(nou.escoltes.size).toBe(0);
  });
  test('pwa-03 · un worker en espera i un de més nou instal·lant-se reben tots dos l’ordre', async () => {
    const e = prova(), nou = workerNou(e.finestra.location.origin);
    e.reg.update.mockImplementation(async () => { e.reg.installing = nou; setTimeout(() => nou.instalLat(e.reg), 0); });
    await actualitzaWorkerPerDeploy(e);
    expect(e.waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(nou.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });
  test('pwa-03 · cancel·lació, topall i worker alié durant la instal·lació no envien res més', async () => {
    const cancel = prova(), nou = workerNou(cancel.finestra.location.origin); let vigent = true;
    cancel.reg.waiting = null;
    cancel.reg.update.mockImplementation(async () => { cancel.reg.installing = nou; setTimeout(() => { vigent = false; nou.instalLat(cancel.reg); }, 0); });
    await actualitzaWorkerPerDeploy({ ...cancel, vigent: () => vigent });
    expect(nou.postMessage).toHaveBeenCalledTimes(1);

    const quiet = prova(), encallat = workerNou(quiet.finestra.location.origin);
    quiet.reg.waiting = null;
    quiet.reg.update.mockImplementation(async () => { quiet.reg.installing = encallat; });
    await actualitzaWorkerPerDeploy({ ...quiet, esperaMs: 5 });
    expect(encallat.postMessage).toHaveBeenCalledTimes(1);
    expect(encallat.escoltes.size).toBe(0);

    const alie = prova(), estrany = workerNou('https://alie.invalid');
    alie.reg.waiting = null;
    alie.reg.update.mockImplementation(async () => { alie.reg.installing = estrany; });
    await actualitzaWorkerPerDeploy(alie);
    expect(estrany.postMessage).not.toHaveBeenCalled();
    expect(estrany.addEventListener).not.toHaveBeenCalled();
  });
});
