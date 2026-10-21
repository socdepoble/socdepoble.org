// @vitest-environment node
/* Fase 0 de l'empaquetat mòbil (261003) · el registre del service worker.
   Només a l'entrada pròpia (src/main.jsx), només en producció, en context
   segur, fora d'iframe i fora de l'app nativa. Tot amb dobles: cap navegador. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ABAST_DEL_SW, ESDEVENIMENT_APP_VISITADA, ESPERA_ESCALFAMENT_MS, MISSATGE_ESCALFAMENT, RUTA_DEL_SW, escoltaEscalfament, missatgeDEscalfament,
  motiuPerNoRegistrar, registraServiceWorker
} from './registre.js';

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
