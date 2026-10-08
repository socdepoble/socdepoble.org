// @vitest-environment jsdom
/* Decisió 5 del Mestre (261007) · el carregador clàssic del paquet trossejat
   (carregadorDelPaquet.js) i el costat ESM que en pren el control
   (provisionalDelPaquet.js). Finestres fetes a mà, un <script> que no
   s'insertix mai (cap càrrega) i un importa simulat: cap xarxa ni URL real.
   La compilació del carregador i el build real són a
   tests/standalone-build.test.mjs; la integració amb embed.jsx i el host.js
   de veritat, a src/embed.carregador.test.jsx. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CONTRACTE_AMFITRIO_V1 } from './contracteAmfitrio.js';
import { MARCA_DEL_CARREGADOR, instalaCarregador } from './carregadorDelPaquet.js';

const CLAUS = CONTRACTE_AMFITRIO_V1.api.claus;
const FITXER = 'soc-de-poble.standalone.js';
const DIST = 'https://amfitrio.invalid/wp-content/plugins/socdepoble-enxufe/dist/';
const SRC = `${DIST}${FITXER}?ver=1.0.5.abc`;
const MODUL = 'trossos/soc-de-poble-Ab12_x-Y.js';
const OPCIONS = Object.freeze({ modul: MODUL, claus: CLAUS, fitxer: FITXER });
const MAI = () => new Promise(() => {});

/** Una finestra mínima: el carregador només en llig la propietat i l'origen. */
const finestraDe = (origin = 'https://pagina.invalid') => ({ location: { origin } });

function scriptDe(src, tipus) {
  const script = document.createElement('script');
  if (src !== undefined) script.setAttribute('src', src);
  if (tipus) script.setAttribute('type', tipus);
  return script;
}

/** Una API real de mostra, com la d'exposaGlobal: congelada i no configurable a la finestra. */
function exposaReal(finestra, api) {
  delete finestra.SocDePoble;
  Object.defineProperty(finestra, 'SocDePoble', { value: api, writable: false, configurable: false });
  return api;
}

const control = (provisional) => provisional[Symbol.for(MARCA_DEL_CARREGADOR)];
const tick = () => new Promise((resolve) => { setTimeout(resolve, 0); });

/** Posa `n` elements <soc-de-poble> al document, el segon amb un fill vell. */
function posaElements(n = 1) {
  const elements = [];
  for (let i = 0; i < n; i += 1) {
    const element = document.createElement('soc-de-poble');
    if (i === 1) element.append(document.createElement('p'));
    document.body.append(element);
    elements.push(element);
  }
  return elements;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('instalaCarregador', () => {
  test('deixa un provisional congelat amb les claus de l’API real i fa un sol import de l’URL absoluta, sense ?ver=', () => {
    const finestra = finestraDe();
    const importa = vi.fn(MAI);
    const provisional = instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, importa);
    expect(Object.keys(provisional)).toEqual([...CLAUS]);
    expect(Object.isFrozen(provisional)).toBe(true);
    expect(Object.getOwnPropertyDescriptor(finestra, 'SocDePoble'))
      .toEqual({ value: provisional, configurable: true, writable: false, enumerable: false });
    expect(importa).toHaveBeenCalledTimes(1);
    expect(importa).toHaveBeenCalledWith(`${DIST}${MODUL}`);
    expect(control(provisional).base).toBe(DIST);
    // Relleu 261007 · l'adreça exacta demanada, per a delatar una redirecció.
    expect(control(provisional).url).toBe(`${DIST}${MODUL}`);
    expect(Object.isFrozen(control(provisional))).toBe(true);
    expect(provisional.isReady).toBe(false);
    expect(provisional.CONTRACTE_BACKEND).toBeUndefined();
    expect(provisional.estat()).toEqual({ fase: 'carregant', configurable: true });
  });

  test('encua en ordre, adopta una sola vegada i torna els resultats i els errors reals; després reenvia de manera síncrona', async () => {
    const finestra = finestraDe();
    const provisional = instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, MAI);
    const ordre = [];
    const api = Object.freeze({
      deferArrenca: vi.fn(() => { ordre.push('deferArrenca'); }),
      configura: vi.fn((opcions) => { ordre.push('configura'); return { acceptats: [], opcions }; }),
      injectaSessio: vi.fn(() => { ordre.push('injectaSessio'); throw new Error('sessió rebutjada'); }),
      estat: () => ({ fase: 'segellat', configurable: false }),
      CONTRACTE_BACKEND: Object.freeze(['loadData']),
      isReady: true
    });
    const diferida = provisional.deferArrenca();
    const configurada = provisional.configura({ auth: { issuer: 'https://emissor.invalid' } });
    const sessio = provisional.injectaSessio({ access_token: 'sintetic' });
    expect(api.configura).not.toHaveBeenCalled();

    exposaReal(finestra, api);
    expect(control(provisional).adopta(api)).toBe(true);
    expect(ordre).toEqual(['deferArrenca', 'configura', 'injectaSessio']);
    await expect(diferida).resolves.toBeUndefined();
    await expect(configurada).resolves.toEqual({ acceptats: [], opcions: { auth: { issuer: 'https://emissor.invalid' } } });
    await expect(sessio).rejects.toThrow('sessió rebutjada');

    expect(provisional.configura({ x: 1 })).toEqual({ acceptats: [], opcions: { x: 1 } });
    expect(provisional.isReady).toBe(true);
    expect(provisional.CONTRACTE_BACKEND).toEqual(['loadData']);
    expect(provisional.estat()).toEqual({ fase: 'segellat', configurable: false });
    expect(control(provisional).adopta(api)).toBe(false);
  });

  test('adopta només accepta l’API global vigent i no configurable', async () => {
    const finestra = finestraDe();
    const provisional = instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, MAI);
    const pendent = provisional.arrenca();
    const api = Object.freeze({ arrenca: () => 'real' });
    expect(control(provisional).adopta(api)).toBe(false);
    expect(control(provisional).adopta(provisional)).toBe(false);
    delete finestra.SocDePoble;
    Object.defineProperty(finestra, 'SocDePoble', { value: api, configurable: true });
    expect(control(provisional).adopta(api)).toBe(false);
    exposaReal(finestra, Object.freeze({ arrenca: () => 'una altra' }));
    expect(control(provisional).adopta(api)).toBe(false);
    expect(control(provisional).adopta(null)).toBe(false);
    expect(provisional.estat().fase).toBe('carregant');
    expect(control(provisional).adopta(finestra.SocDePoble)).toBe(true);
    await expect(pendent).resolves.toBe('una altra');
  });

  test('doble càrrega: avisa i no importa res', () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const importa = vi.fn(MAI);
    const vell = Object.freeze({});
    const finestra = finestraDe();
    Object.defineProperty(finestra, 'SocDePoble', { value: vell, configurable: false });
    expect(instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, importa)).toBeNull();
    const altra = finestraDe();
    expect(instalaCarregador(altra, document, scriptDe(SRC), OPCIONS, importa)).not.toBeNull();
    expect(instalaCarregador(altra, document, scriptDe(SRC), OPCIONS, importa)).toBeNull();
    expect(importa).toHaveBeenCalledTimes(1);
    expect(avis).toHaveBeenCalledTimes(2);
    expect(avis.mock.calls[0][0]).toMatch(/ja existix/);
    expect(finestra.SocDePoble).toBe(vell);
  });

  test.each([
    ['un script de mòdul', scriptDe(SRC, 'module')],
    ['un script sense src', scriptDe()],
    ['un script blob:', scriptDe('blob:https://amfitrio.invalid/7c1e8a52-0000-4000-8000-000000000000')],
    ['cap script', null]
  ])('%s: no sap on viu, no importa res i ho pinta', async (_cas, script) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    posaElements();
    const importa = vi.fn(MAI);
    const provisional = instalaCarregador(finestraDe(), document, script, OPCIONS, importa);
    expect(importa).not.toHaveBeenCalled();
    expect(control(provisional).base).toBe('');
    expect(control(provisional).url).toBe('');
    const bloc = document.querySelector('soc-de-poble .sdp-arranc-fallida');
    expect([...bloc.children].map((fill) => fill.tagName)).toEqual(['H3', 'P', 'PRE']);
    expect(bloc.querySelector('p').textContent).toMatch(/no ha pogut carregar els seus mòduls.*script src.*clàssic/);
    expect(provisional.estat()).toEqual({ fase: 'fallida', configurable: false });
    await expect(provisional.configura({})).rejects.toThrow(/no ha pogut carregar/);
    expect(error).toHaveBeenCalled();
  });

  test('import rebutjat: missatge honest a la consola i a cada <soc-de-poble>, com a text; la cua i les crides posteriors es rebutgen', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    posaElements(2);
    const hostil = '<img src=x onerror="document.title=1">';
    const provisional = instalaCarregador(finestraDe(), document, scriptDe(SRC), OPCIONS, () => Promise.reject(new Error(hostil)));
    // El gestor s'enganxa abans del rebuig: cap rebuig sense gestionar.
    const encuada = expect(provisional.configura({})).rejects.toThrow(/no ha pogut carregar els seus mòduls/);
    await tick();
    await encuada;
    await expect(provisional.arrenca()).rejects.toThrow(/no ha pogut carregar/);
    const elements = [...document.querySelectorAll('soc-de-poble')];
    expect(elements).toHaveLength(2);
    for (const element of elements) {
      expect(element.children).toHaveLength(1);
      const [titol, text, detall] = element.firstElementChild.children;
      expect(element.firstElementChild.className).toBe('sdp-arranc-fallida');
      expect(titol.textContent).toBe("Error crític d'arrencada");
      expect(text.textContent).toMatch(/altre origen \(https:\/\/amfitrio\.invalid\).*Access-Control-Allow-Origin/);
      expect(detall.textContent).toContain(hostil);
      expect(detall.textContent).toContain(`${DIST}${MODUL}`);
    }
    expect(document.querySelector('img')).toBeNull();
    expect(error.mock.calls.some(([missatge]) => String(missatge).includes('no ha pogut carregar els seus mòduls'))).toBe(true);
  });

  test('un import() que peta de manera síncrona també es pinta, sense excepció cap a la pàgina', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    posaElements();
    const provisional = instalaCarregador(finestraDe(), document, scriptDe(SRC), OPCIONS, () => { throw new TypeError('import no admés'); });
    await tick();
    expect(document.querySelector('soc-de-poble .sdp-arranc-fallida pre').textContent).toContain('import no admés');
    expect(provisional.estat().fase).toBe('fallida');
  });

  /* Relleu 261007 · un amfitrió SPA (Sollutia, React o Vue) crea el
     <soc-de-poble> quan munta la seua vista, també després de la fallada. */
  test('després de la fallada, un <soc-de-poble> que l’amfitrió afig més tard també es pinta, sol o dins d’un altre node', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const observadors = [];
    class Observador extends window.MutationObserver {
      constructor(callback) { super(callback); observadors.push(this); }
    }
    try {
      const finestra = { ...finestraDe(), MutationObserver: Observador };
      instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, () => Promise.reject(new Error('CORS')));
      await tick();
      expect(observadors).toHaveLength(1);
      const sol = document.createElement('soc-de-poble');
      const vista = document.createElement('section');
      vista.append(document.createElement('soc-de-poble'));
      document.body.append(sol, vista);
      await tick();
      const elements = [...document.querySelectorAll('soc-de-poble')];
      expect(elements).toHaveLength(2);
      for (const element of elements) {
        expect(element.children).toHaveLength(1);
        expect(element.firstElementChild.className).toBe('sdp-arranc-fallida');
        expect(element.querySelector('pre').textContent).toContain('CORS');
      }
      // El bloc pintat no torna a disparar l'observador: cap element no es repinta en bucle.
      const bloc = sol.firstElementChild;
      await tick();
      expect(sol.firstElementChild).toBe(bloc);
    } finally {
      for (const observador of observadors) observador.disconnect();
    }
  });

  test('sense MutationObserver a la finestra, la fallada es pinta igual en els elements que ja hi són', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    posaElements();
    instalaCarregador(finestraDe(), document, scriptDe(SRC), OPCIONS, () => Promise.reject(new Error('404')));
    await tick();
    expect(document.querySelector('soc-de-poble .sdp-arranc-fallida')).not.toBeNull();
  });

  test('mateix origen: sense pista de CORS; un fitxer reanomenat per un optimitzador porta la seua pista', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    posaElements();
    const reanomenat ='https://amfitrio.invalid/wp-content/cache/min/1/combinat.js?ver=9';
    instalaCarregador(finestraDe('https://amfitrio.invalid'), document, scriptDe(reanomenat), OPCIONS, () => Promise.reject(new Error('404')));
    await tick();
    const text = document.querySelector('.sdp-arranc-fallida p').textContent;
    expect(text).not.toMatch(/Access-Control-Allow-Origin/);
    expect(text).toMatch(/no es diu soc-de-poble\.standalone\.js: un optimitzador l'ha combinat o reanomenat/);
  });

  test('amb el document carregant, pinta la fallada al DOMContentLoaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });
    try {
      instalaCarregador(finestraDe(), document, scriptDe(SRC), OPCIONS, () => Promise.reject(new Error('xarxa')));
      await tick();
      posaElements();
      expect(document.querySelector('.sdp-arranc-fallida')).toBeNull();
    } finally {
      delete document.readyState;
    }
    document.dispatchEvent(new Event('DOMContentLoaded'));
    expect(document.querySelector('soc-de-poble .sdp-arranc-fallida')).not.toBeNull();
  });

  test('el mòdul s’avalua sense prendre el control: la cua es rebutja i res no es pinta', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    posaElements();
    const provisional = instalaCarregador(finestraDe(), document, scriptDe(SRC), OPCIONS, () => Promise.resolve({}));
    const encuada = expect(provisional.quanLlest()).rejects.toThrow(/sense prendre el control/);
    await tick();
    await encuada;
    expect(document.querySelector('.sdp-arranc-fallida')).toBeNull();
    expect(error).toHaveBeenCalledTimes(1);
  });

  test('una fallada després de l’adopció només va a la consola: l’App ja és seua', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    posaElements();
    let rebutja;
    const finestra = finestraDe();
    const provisional = instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, () => new Promise((_resol, rebuig) => { rebutja = rebuig; }));
    const api = exposaReal(finestra, Object.freeze({ estat: () => ({ fase: 'segellat' }) }));
    expect(control(provisional).adopta(api)).toBe(true);
    rebutja(new Error('init ha petat'));
    await tick();
    expect(document.querySelector('.sdp-arranc-fallida')).toBeNull();
    expect(provisional.estat()).toEqual({ fase: 'segellat' });
    expect(error.mock.calls[0][0]).toMatch(/després de prendre el control/);
  });
});

describe('provisionalDelPaquet', () => {
  /* El mòdul fixa la base en avaluar-se: cada prova el torna a avaluar, amb
     assetResolver.js nou, sobre la finestra global de jsdom. */
  async function avaluaAmb(prepara) {
    vi.resetModules();
    prepara?.();
    const { baseRecursos } = await import('./assetResolver.js');
    const modul = await import('./provisionalDelPaquet.js');
    return { baseRecursos, ...modul };
  }

  afterEach(() => {
    if (Object.getOwnPropertyDescriptor(window, 'SocDePoble')?.configurable) delete window.SocDePoble;
  });

  test('controlDelProvisional només llig: torna el control del carregador i null en qualsevol altre cas', async () => {
    const { controlDelProvisional } = await avaluaAmb();
    const finestra = finestraDe();
    const provisional = instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, MAI);
    expect(controlDelProvisional(finestra)).toBe(control(provisional));
    expect(finestra.SocDePoble).toBe(provisional);
    expect(controlDelProvisional(null)).toBeNull();
    expect(controlDelProvisional(finestraDe())).toBeNull();
    const sensemarca = finestraDe();
    Object.defineProperty(sensemarca, 'SocDePoble', { value: {}, configurable: true });
    expect(controlDelProvisional(sensemarca)).toBeNull();
    const real = finestraDe();
    Object.defineProperty(real, 'SocDePoble', { value: { [Symbol.for(MARCA_DEL_CARREGADOR)]: control(provisional) }, configurable: false });
    expect(controlDelProvisional(real)).toBeNull();
    const accessor = finestraDe();
    Object.defineProperty(accessor, 'SocDePoble', { get: () => provisional, configurable: true });
    expect(controlDelProvisional(accessor)).toBeNull();
  });

  test('prenProvisional esborra el provisional i en torna el control; sense provisional no toca res', async () => {
    const { prenProvisional } = await avaluaAmb();
    const finestra = finestraDe();
    const provisional = instalaCarregador(finestra, document, scriptDe(SRC), OPCIONS, MAI);
    expect(prenProvisional(finestra)).toBe(control(provisional));
    expect(Object.hasOwn(finestra, 'SocDePoble')).toBe(false);
    expect(prenProvisional(finestra)).toBeNull();
    const real = exposaReal(finestraDe(), Object.freeze({}));
    expect(prenProvisional({ SocDePoble: real })).toBeNull();
  });

  test('en avaluar-se fixa la base de recursos amb la del carregador (sense barra final)', async () => {
    const { baseRecursos } = await avaluaAmb(() => {
      instalaCarregador(window, document, scriptDe(SRC), OPCIONS, MAI);
    });
    expect(baseRecursos()).toBe(DIST.replace(/\/$/, ''));
  });

  test('sense provisional, la base es queda buida: socdepoble.org i el monolític no canvien (Llei del Píxel)', async () => {
    const { baseRecursos } = await avaluaAmb();
    expect(baseRecursos()).toBe('');
  });

  /* Relleu 261007 · el mapa de mòduls s'indexa amb l'URL demanada i
     import.meta.url és la final: si no coincidixen, hi ha hagut una redirecció
     i els trossos tornarien a avaluar l'entrada. */
  test('comprovaUrlDelModul: en silenci si el mòdul s’avalua on l’ha demanat el carregador; en veu alta si no', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { comprovaUrlDelModul } = await avaluaAmb();
    const provisional = instalaCarregador(finestraDe(), document, scriptDe(SRC), OPCIONS, MAI);
    const demanada = `${DIST}${MODUL}`;
    expect(comprovaUrlDelModul(control(provisional), demanada)).toBe(true);
    expect(comprovaUrlDelModul(null, 'https://www.amfitrio.invalid/x.js')).toBe(true);
    expect(comprovaUrlDelModul({ base: '', url: '' }, 'https://www.amfitrio.invalid/x.js')).toBe(true);
    expect(error).not.toHaveBeenCalled();
    const redirigida = demanada.replace('https://amfitrio.invalid/', 'https://www.amfitrio.invalid/');
    expect(comprovaUrlDelModul(control(provisional), redirigida)).toBe(false);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toContain(redirigida);
    expect(error.mock.calls[0][0]).toContain(demanada);
    expect(error.mock.calls[0][0]).toMatch(/redirecció.*sense redireccions/);
  });
});
