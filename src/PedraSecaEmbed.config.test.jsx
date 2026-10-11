/**
 * Enxufe universal · la configuració de <soc-de-poble>.
 *
 *  · sanejaConfig(): les claus noves (nomPoble, poble, rutaInicial) i les de
 *    router i capçalera passen per un sanejador tipat; la validació d'URL de
 *    sempre no canvia.
 *  · Recursos: l'element fixa la base des del seu `plugin-url`, publica el fons
 *    del Xat a l'estil de l'element i obri els mitjans del seu origen.
 *  · Fonts: el mateix origen que el paquet és de confiança; el que un atribut
 *    diu de si mateix, no.
 *  · configAmfitrio.js i els fonts de l'element no porten cap invisible cru, i
 *    l'escapament no ha canviat quins caràcters es lleven.
 *  · Capa del paquet (Model B): l'element pren el backend i el tenant de
 *    compilació (VITE_*). Des de 261003 (A1 i A3) cap canal de l'amfitrió
 *    (atributs, JSON, config-id, propietat JS, configura, global) no els
 *    trepitja: es descarten amb un sol avís per canal i clau, i les claus
 *    legítimes de l'amfitrió continuen funcionant igual.
 *
 * L'App i els proveïdors no hi pinten res: ací només es mira la configuració.
 * El backend de compilació es fixa abans d'avaluar l'element (vi.hoisted), així
 * que les proves no depenen del .env de qui les executa.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import fs from 'node:fs';
import { act, cleanup, render } from '@testing-library/react';
import {
  activeElements, defineCustomElement, sanejaConfig, DEFECTES_DEL_PAQUET, ESDEVENIMENT_RUTA, llegeixRutaDeLaUrl, sanejaApps
} from './PedraSecaEmbed.jsx';
import { _reiniciaAvisos, senseTenantInvalid } from './config/capaDelPaquet.js';
import { MemoryRouter, useNavigate } from './app/contexts/RouterContext.jsx';
import { baseRecursos, fixaBaseRecursos } from './config/assetResolver.js';
import { sanejaEtiqueta } from './config/configAmfitrio.js';
import { normalizeBackendConfig } from './config/backendConfig.js';
import { ORIGENS_CONEGUTS } from './config/origensSollutia.js';
import { CONTRACTE_AMFITRIO_V1 } from './config/contracteAmfitrio.js';
import { registraAppExterna, retiraAppExterna } from './apps/plataforma/registreApps.js';
import { manifestExternDeProva } from './apps/plataforma/__fixtures__/manifests.js';
import { permetOrigenMitjans } from './utils/sanitize.js';
import { THEME_KEY } from './config/theme.js';
import { delVal, getVal, setVal } from './config/storage.js';

const ENTORN = vi.hoisted(() => {
  const entorn = {
    VITE_SUPABASE_URL: 'https://paquet.supabase.test',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_del_paquet',
    VITE_DATA_MODE: 'seed',
    // UUID sintètic en minúscules: backendConfig.js només n'accepta d'eixa forma.
    VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111'
  };
  for (const [variable, valor] of Object.entries(entorn)) vi.stubEnv(variable, valor);
  return entorn;
});
const politica = vi.hoisted(() => ({ actual: null }));
vi.mock('./config/runtimePolicy.js', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, getRuntimePolicy: (noAutoFreeze) => politica.actual ?? original.getRuntimePolicy(noAutoFreeze) };
});
vi.mock('./utils/sanitize.js', async (importOriginal) => ({ ...(await importOriginal()), permetOrigenMitjans: vi.fn() }));
/* El registre d'apps de veritat, amb cada subscripció espiada: l'oient que hi
   queda i la baixa que torna (WP-R3). */
const subscripcions = vi.hoisted(() => []);
vi.mock('./apps/plataforma/registreApps.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    subscriu: (oient) => {
      const escolta = vi.fn(oient);
      const baixa = vi.fn(original.subscriu(escolta));
      subscripcions.push({ escolta, baixa });
      return baixa;
    }
  };
});
vi.mock('./css/index.css?inline', () => ({ default: '.sdp-root { display: flex; }' }));
/* L'App no pinta res: només deixa a mà el navigate del router de cada
   element, per a les proves de la ruta cap a l'amfitrió (P1-c). Una prova
   que necessita un àlies de l'App (Onada 5: /chat → /xat) el declara a
   `alies` i el doble el resol amb el <Navigate replace> del router propi,
   com RedireccioXat (App.jsx). Buit, no fa res. */
const navegadors = vi.hoisted(() => new Map());
const alies = vi.hoisted(() => new Map());
vi.mock('./app/App.jsx', async () => {
  const { createElement } = await import('react');
  const { Navigate, useLocation, useNavigate } = await import('./app/contexts/RouterContext.jsx');
  return {
    default: function AppDeProva({ targetNode }) {
      navegadors.set(targetNode?.host, useNavigate());
      const desti = alies.get(useLocation().pathname);
      return desti ? createElement(Navigate, { to: desti, replace: true }) : null;
    }
  };
});
vi.mock('./app/contexts/UIContext.jsx', () => ({ UIProvider: ({ children }) => children }));
vi.mock('./app/contexts/SessionContext.jsx', () => ({ SessionProvider: ({ children }) => children }));
vi.mock('./app/contexts/IdentitatContext.jsx', () => ({ IdentitatProvider: ({ children }) => children }));

const CDN = 'https://cdn.socdepoble.test';
const FONS_XAT = '--sdp-xat-fons-imatge';

async function munta(atributs = {}) {
  const element = document.createElement('soc-de-poble');
  for (const [nom, valor] of Object.entries(atributs)) element.setAttribute(nom, valor);
  await act(async () => { document.body.appendChild(element); });
  return element;
}

/** Una política com la que deixa host.js:configura(), però CRUA: no passa pel
 *  descart del Model B de host.js (tests/host.test.js el prova), i així es veu
 *  que l'element tampoc no pren backend ni tenant d'una política que en porte. */
function configura({ config = {}, backend_url, tenant_id } = {}) {
  const rawHostConfig = { ...config,
    ...(backend_url !== undefined ? { backend_url } : {}),
    ...(tenant_id !== undefined ? { tenant_id } : {}) };
  const normalitzada = normalizeBackendConfig(rawHostConfig);
  politica.actual = Object.freeze({ backendConfig: Object.freeze({ ...normalitzada }), rawHostConfig: Object.freeze({ ...rawHostConfig }) });
}

beforeAll(() => {
  defineCustomElement();
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  navegadors.clear();
  alies.clear();
  subscripcions.length = 0;
  window.history.replaceState(null, '', '/');
  document.body.replaceChildren();
  // '/' buida la base: cada prova comença sense amfitrió.
  fixaBaseRecursos('/');
  delete globalThis.SocDePobleConfig;
  politica.actual = null;
  // Cada prova comença sense avisos del Model B ja donats.
  _reiniciaAvisos();
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
});

test('sense pinta-amfitrio, desmuntar no lleva el tema ni el fons del document', async () => {
  const root = document.documentElement;
  root.style.setProperty('--sdp-bg', 'beige', 'important');
  root.setAttribute('data-sdp-theme', 'tema-del-lloc');
  try {
    const element = await munta();
    await act(async () => { element.remove(); });
    expect(root.style.getPropertyValue('--sdp-bg')).toBe('beige');
    expect(root.style.getPropertyPriority('--sdp-bg')).toBe('important');
    expect(root.getAttribute('data-sdp-theme')).toBe('tema-del-lloc');
  } finally {
    root.style.removeProperty('--sdp-bg');
    root.removeAttribute('data-sdp-theme');
  }
});

test('dos opt-in restitueixen el tema original quan es retira l’últim, encara que quede un bloc normal', async () => {
  const root = document.documentElement;
  root.style.setProperty('--sdp-bg', 'beige', 'important');
  root.setAttribute('data-sdp-theme', 'tema-del-lloc');
  try {
    await munta();
    const primer = await munta();
    const segon = await munta();
    primer._punt.style.setProperty('--sdp-fons-app', 'black');
    segon._punt.style.setProperty('--sdp-fons-app', 'white');
    primer.setAttribute('pinta-amfitrio', '');
    segon.setAttribute('pinta-amfitrio', '');
    expect(root.style.getPropertyValue('--sdp-bg')).toBe('white');
    segon.removeAttribute('pinta-amfitrio');
    expect(root.style.getPropertyValue('--sdp-bg')).toBe('black');
    await act(async () => { primer.remove(); });
    expect(root.style.getPropertyValue('--sdp-bg')).toBe('beige');
    expect(root.style.getPropertyPriority('--sdp-bg')).toBe('important');
    expect(root.getAttribute('data-sdp-theme')).toBe('tema-del-lloc');
    expect(activeElements.size).toBe(2);
  } finally {
    root.style.removeProperty('--sdp-bg');
    root.removeAttribute('data-sdp-theme');
  }
});

test('si falla adoptedStyleSheets amb un full alié, encara injecta el CSS propi', async () => {
  const alié = {};
  vi.stubGlobal('CSSStyleSheet', class { replaceSync() {} });
  const attach = HTMLElement.prototype.attachShadow;
  const spy = vi.spyOn(HTMLElement.prototype, 'attachShadow').mockImplementation(function (options) {
    const root = attach.call(this, options);
    Object.defineProperty(root, 'adoptedStyleSheets', {
      configurable: true,
      get: () => [alié],
      set: () => { throw new Error('Amfitrió sense adopció'); }
    });
    return root;
  });
  try {
    const element = await munta();
    const fulls = element._closedRoot.querySelectorAll('style[data-sdp-fallback]');
    expect(fulls).toHaveLength(1);
    expect(fulls[0].textContent).toContain('.sdp-root');
    await act(async () => { document.body.appendChild(element); });
    expect(element._closedRoot.querySelectorAll('style[data-sdp-fallback]')).toHaveLength(1);
  } finally {
    spy.mockRestore();
    vi.unstubAllGlobals();
  }
});

/* ── Claus tipades ───────────────────────────────────────────────────── */

describe('sanejaConfig · claus tipades', () => {
  test.each([
    ['nomPoble', '  Gent   de la Torre ', 'Gent de la Torre'],
    ['nomPoble', `Gent de la${String.fromCodePoint(0x202E)} Torre`, 'Gent de la Torre'],
    ['nomPoble', 'x'.repeat(200), 'x'.repeat(80)],
    ['nomPoble', '   ', undefined],
    ['nomPoble', 42, undefined],
    ['nomPoble', ['Torre'], undefined],
    ['poble', 'LA-TORRE-DE-LES-MACANES', 'la-torre-de-les-macanes'],
    ['poble', '../admin', undefined],
    ['poble', 'a/b', undefined],
    ['poble', 7, undefined],
    ['rutaInicial', '/pobles/sella#portada', '/pobles/sella'],
    ['rutaInicial', '/mur?filtre=tot', '/mur?filtre=tot'],
    ['rutaInicial', '//evil.test/x', undefined],
    ['rutaInicial', 'https://evil.test/', undefined],
    ['rutaInicial', '/a/%2e%2e/admin', undefined],
    ['basename', '/comunitat/', '/comunitat'],
    ['basename', '/', undefined],
    ['basename', '', undefined],
    ['basename', '/a//b', undefined],
    ['basename', '//evil.test', undefined],
    ['basename', 42, undefined],
    ['routerType', 'browser', 'browser'],
    ['routerType', 'memory', 'memory'],
    ['routerType', 'Browser', undefined],
    ['routerType', 'hash', undefined],
    ['manageDocumentHead', true, true],
    ['manageDocumentHead', false, false],
    ['manageDocumentHead', 'true', undefined],
    ['manageDocumentHead', 1, undefined],
    ['manageDocumentHead', null, undefined],
    // T1 (260930): només els codis exactes del selector.
    ['language', 'es', 'es'],
    ['language', 'ca', 'ca'],
    ['language', 'gl', 'gl'],
    ['language', 'en-US', undefined],
    ['language', 'ES', undefined],
    ['language', 'fr', undefined],
    ['language', 42, undefined],
    ['language', '', undefined],
    ['language', null, undefined],
    ['language', ['es'], undefined],
    // Auditoria 261007 (B): només les tres preferències de theme.js.
    ['themeMode', 'system', 'system'],
    ['themeMode', 'light', 'light'],
    ['themeMode', 'dark', 'dark'],
    ['themeMode', 'fosc', undefined],
    ['themeMode', 'Dark', undefined],
    ['themeMode', '', undefined],
    ['themeMode', 1, undefined],
    ['themeMode', null, undefined]
  ])('%s = %j → %j', (clau, valor, esperat) => {
    const net = sanejaConfig({ [clau]: valor });
    if (esperat === undefined) expect(net).not.toHaveProperty(clau);
    else expect(net[clau]).toBe(esperat);
  });

  test('el poble dona la ruta inicial només si no n’hi ha cap de vàlida', () => {
    expect(sanejaConfig({ poble: 'sella' }).rutaInicial).toBe('/xat');
    expect(sanejaConfig({ poble: 'sella', rutaInicial: '/xat' }).rutaInicial).toBe('/xat');
    expect(sanejaConfig({ poble: 'sella', rutaInicial: '//evil.test' }).rutaInicial).toBe('/xat');
    expect(sanejaConfig({ poble: '../admin' })).not.toHaveProperty('rutaInicial');
  });

  test('torna un objecte congelat i sense claus desconegudes', () => {
    const net = sanejaConfig({ nomPoble: 'Sella', tenant: 'sella', nomPobleX: 'x', __proto__: { poble: 'evil' } });
    expect(Object.isFrozen(net)).toBe(true);
    expect(net).not.toHaveProperty('tenant');
    expect(net).not.toHaveProperty('nomPobleX');
    expect(Object.hasOwn(net, 'poble')).toBe(false);
  });

  test('la validació d’URL de sempre no canvia', () => {
    const net = sanejaConfig({
      supabaseUrl: 'https://evil.test', botApiUrl: 'https://evil.test/bot', oauthRelayUrl: 'https://evil.test/cb',
      sollutiaIssuer: 'https://evil.test', basePath: '//evil.test', pluginUrl: 'javascript:alert(1)',
      fontsHref: 'https://evil.test/f.css'
    });
    for (const clau of ['supabaseUrl', 'botApiUrl', 'oauthRelayUrl', 'sollutiaIssuer', 'basePath', 'pluginUrl', 'fontsHref'])
      expect(net, clau).not.toHaveProperty(clau);
    expect(sanejaConfig({ fontsHref: 'https://fonts.googleapis.com/css2?family=Noto+Sans' }).fontsHref)
      .toBe('https://fonts.googleapis.com/css2?family=Noto+Sans');
    expect(sanejaConfig({ fontsHref: '/fonts/noto-sans.css' }).fontsHref).toBe('/fonts/noto-sans.css');
    expect(sanejaConfig({ fontsHref: `${window.location.origin}/fonts/noto-sans.css` }).fontsHref)
      .toBe(`${window.location.origin}/fonts/noto-sans.css`);
  });
});

/* ── T1 · Llengua de l'amfitrió ──────────────────────────────────────── */

describe('llengua de l’amfitrió (T1, 260930)', () => {
  test('una language vàlida del JSON arriba a la config; una forma BCP47 no hi arriba', async () => {
    const valida = await munta({ config: JSON.stringify({ language: 'es' }) });
    expect(valida.config.language).toBe('es');
    const bcp47 = await munta({ config: JSON.stringify({ language: 'en-US' }) });
    expect(bcp47.config).not.toHaveProperty('language');
  });

  test('configura({config:{language}}) passa pel sanejador com qualsevol capa', async () => {
    configura({ config: { language: 'fr' } });
    const element = await munta();
    expect(element.config).not.toHaveProperty('language');
  });

  test('l’element reemet sdp:language-changed com a sdp-language-changed, i deixa de fer-ho en desmuntar', async () => {
    const element = await munta();
    const rebuts = [];
    element.addEventListener('sdp-language-changed', (e) => rebuts.push(e.detail));
    window.dispatchEvent(new CustomEvent('sdp:language-changed', { detail: { language: 'eu' } }));
    expect(rebuts).toEqual([{ language: 'eu', _sdp_reemitted: true }]);
    await act(async () => { element.remove(); element._desmuntaAra(); });
    window.dispatchEvent(new CustomEvent('sdp:language-changed', { detail: { language: 'gl' } }));
    expect(rebuts).toHaveLength(1);
  });
});

/* ── Tema de l'amfitrió (Auditoria 261007 (B)) ───────────────────────── */

describe('tema de l’amfitrió: setTheme(), themeMode i el mode del sistema (Auditoria 261007 (B))', () => {
  /* Una MediaQueryList de prefers-color-scheme que la prova pot canviar; la
     resta de consultes (el contrast) no casen mai. */
  function sistema(foscInicial = false) {
    const oients = new Set();
    const tema = {
      matches: foscInicial,
      addEventListener: (tipus, oient) => { if (tipus === 'change') oients.add(oient); },
      removeEventListener: (tipus, oient) => { if (tipus === 'change') oients.delete(oient); }
    };
    const altra = { matches: false, addEventListener() {}, removeEventListener() {} };
    vi.stubGlobal('matchMedia', vi.fn((consulta) => (consulta === '(prefers-color-scheme: dark)' ? tema : altra)));
    return {
      canvia(fosc) {
        tema.matches = fosc;
        for (const oient of [...oients]) oient({ matches: fosc });
      }
    };
  }

  let temaDesat = null;
  let temaHtml = null;
  beforeEach(() => {
    temaDesat = getVal(THEME_KEY);
    delVal(THEME_KEY);
    // readThemePreference encara mira l'<html>: cada prova comença sense tema escrit.
    temaHtml = document.documentElement.getAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (temaDesat == null) delVal(THEME_KEY);
    else setVal(THEME_KEY, temaDesat);
    if (temaHtml == null) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', temaHtml);
  });

  test('setTheme() pinta una preferència vàlida i descarta una de desconeguda, com setLanguage', async () => {
    sistema();
    const element = await munta();
    expect(element.dataset.theme).toBe('light');
    await act(async () => { element.setTheme('dark'); });
    expect(element.dataset.theme).toBe('dark');
    // Abans quedava data-theme="fosc", que cap selector de tokens.css reconeix.
    await act(async () => { element.setTheme('fosc'); });
    expect(element.dataset.theme).toBe('light');
    expect(element._manualTheme).toBeNull();
  });

  test('descartat un setTheme() desconegut, mana el themeMode de la configuració', async () => {
    sistema();
    const element = await munta({ config: JSON.stringify({ themeMode: 'dark' }) });
    expect(element.dataset.theme).toBe('dark');
    await act(async () => { element.setTheme('light'); });
    expect(element.dataset.theme).toBe('light');
    await act(async () => { element.setTheme(42); });
    expect(element.dataset.theme).toBe('dark');
  });

  test('un themeMode desconegut de l’amfitrió no arriba a la config ni a data-theme', async () => {
    sistema();
    const element = await munta({ config: JSON.stringify({ themeMode: 'fosc' }) });
    expect(element.config).not.toHaveProperty('themeMode');
    expect(element.dataset.theme).toBe('light');
  });

  test('el mode del telèfon no trepitja el tema que l’amfitrió ha fixat amb setTheme()', async () => {
    setVal(THEME_KEY, 'system');
    const sis = sistema(false);
    const element = await munta();
    expect(element.dataset.theme).toBe('light');
    // Amb la preferència desada 'system', l'element seguix el telèfon.
    await act(async () => { sis.canvia(true); });
    expect(element.dataset.theme).toBe('dark');
    // L'amfitrió fixa el clar: un canvi del telèfon ja no el trepitja.
    await act(async () => { element.setTheme('light'); });
    await act(async () => { sis.canvia(false); sis.canvia(true); });
    expect(element.dataset.theme).toBe('light');
    // Si l'amfitrió demana 'system', torna a seguir el telèfon.
    await act(async () => { element.setTheme('system'); });
    expect(element.dataset.theme).toBe('dark');
    await act(async () => { sis.canvia(false); });
    expect(element.dataset.theme).toBe('light');
  });
});

/* ── Fonts del mateix origen que el paquet ───────────────────────────── */

describe('fonts: l’origen del paquet és de confiança', () => {
  /* La base del paquet es fixa en avaluar assetResolver.js (currentScript),
     abans que PedraSecaEmbed.jsx prenga l'origen: es reproduïx amb un registre
     de mòduls nou on la base ja hi és quan l'element s'avalua. */
  test('amb la base que el paquet va deduir en avaluar-se, les seues fonts passen', async () => {
    vi.resetModules();
    const recursos = await import('./config/assetResolver.js');
    recursos.fixaBaseRecursos(`${CDN}/dist`);
    const { sanejaConfig: sanejaAmbPaquet } = await import('./PedraSecaEmbed.jsx');
    expect(sanejaAmbPaquet({ fontsHref: `${CDN}/dist/fonts/noto-sans.css` }).fontsHref).toBe(`${CDN}/dist/fonts/noto-sans.css`);
    expect(sanejaAmbPaquet({ fontsHref: 'https://evil.test/f.css' })).not.toHaveProperty('fontsHref');
    // Un altre esquema és un altre origen.
    expect(sanejaAmbPaquet({ fontsHref: 'http://cdn.socdepoble.test/dist/fonts/noto-sans.css' })).not.toHaveProperty('fontsHref');
  });

  test('sense base del paquet, el CDN no és cap origen permés', () => {
    expect(sanejaConfig({ fontsHref: `${CDN}/dist/fonts/noto-sans.css` })).not.toHaveProperty('fontsHref');
  });

  test('un plugin-url no es declara de confiança a si mateix: les seues fonts no entren', async () => {
    const element = await munta({ 'plugin-url': 'https://evil.test/dist/', 'fonts-href': 'https://evil.test/dist/fonts/noto-sans.css' });
    expect(element.config.pluginUrl).toBe('https://evil.test/dist/');
    expect(element.config).not.toHaveProperty('fontsHref');
    expect(document.head.querySelector('link[href^="https://evil.test"]')).toBeNull();
  });
});

/* ── Base de recursos de l'element ───────────────────────────────────── */

describe('base de recursos de l’element', () => {
  test('plugin-url d’un altre origen: fixa la base, publica el fons del Xat i obri els mitjans', async () => {
    const element = await munta({ 'plugin-url': `${CDN}/dist/` });
    expect(baseRecursos()).toBe(`${CDN}/dist`);
    expect(element.style.getPropertyValue(FONS_XAT)).toBe(`url("${CDN}/dist/assets/system/ui/xat-bg-map-v2.jpg")`);
    expect(permetOrigenMitjans).toHaveBeenCalledWith(`${CDN}/dist`);
  });

  test('plugin-url camí del mateix lloc: fons des de la carpeta del paquet, cap origen nou', async () => {
    const element = await munta({ 'plugin-url': '/wp-content/plugins/socdepoble-enxufe/dist/' });
    expect(baseRecursos()).toBe('/wp-content/plugins/socdepoble-enxufe/dist');
    expect(element.style.getPropertyValue(FONS_XAT))
      .toBe('url("/wp-content/plugins/socdepoble-enxufe/dist/assets/system/ui/xat-bg-map-v2.jpg")');
    expect(permetOrigenMitjans).not.toHaveBeenCalled();
  });

  test('plugin-url absolut del mateix origen: cap origen nou de mitjans', async () => {
    await munta({ 'plugin-url': `${window.location.origin}/dist/` });
    expect(baseRecursos()).toBe(`${window.location.origin}/dist`);
    expect(permetOrigenMitjans).not.toHaveBeenCalled();
  });

  test.each([
    ['sense plugin-url', {}],
    ['plugin-url "/" (el #root de sempre)', { 'plugin-url': '/' }],
    ['plugin-url amb esquema perillós', { 'plugin-url': 'javascript:alert(1)' }]
  ])('Llei del Píxel · %s: cap base, cap estil a l’element, cap origen nou', async (_, atributs) => {
    const element = await munta(atributs);
    expect(baseRecursos()).toBe('');
    expect(element.hasAttribute('style')).toBe(false);
    expect(permetOrigenMitjans).not.toHaveBeenCalled();
  });
});

/* ── Capa del paquet (Model B) ───────────────────────────────────────── */
/* Amb el marcatge universal de tres peces (global + <soc-de-poble plugin-url
   fonts-href> + paquet) l'amfitrió no diu res del backend: el tria i el
   segella Sóc de Poble. Des de 261003 (A1 i A3) tampoc no el pot dir: cap
   canal de l'amfitrió trepitja el backend ni el tenant del paquet. */

describe('capa del paquet: l’única font del backend i del tenant (Model B)', () => {
  /* El que un amfitrió intentaria declarar. supabaseUrl és d'un origen
     permés (ORIGENS_BACKEND): si arribara a la configuració, sanejaConfig el
     deixaria passar. Tot és sintètic. */
  const DECLARAT = Object.freeze({
    supabaseUrl: 'https://socdepoble.sollutia.com',
    supabaseAnonKey: 'sb_publishable_de_l_amfitrio',
    dataMode: 'local',
    tenantId: '22222222-2222-4222-8222-222222222222'
  });
  const DEL_PAQUET = () => ({
    supabaseUrl: ENTORN.VITE_SUPABASE_URL,
    supabaseAnonKey: ENTORN.VITE_SUPABASE_ANON_KEY,
    dataMode: ENTORN.VITE_DATA_MODE,
    tenantId: ENTORN.VITE_TENANT_ID
  });

  /** Munta amb console.warn silenciat i torna l'element i els avisos. */
  async function ambAvisos(muntatge) {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const element = await muntatge();
      return { element, avisos: avis.mock.calls.map((crida) => crida.join(' ')) };
    } finally {
      avis.mockRestore();
    }
  }

  test('es congelen una vegada amb les quatre variables del paquet', () => {
    expect(Object.isFrozen(DEFECTES_DEL_PAQUET)).toBe(true);
    expect(DEFECTES_DEL_PAQUET).toEqual({
      supabaseUrl: ENTORN.VITE_SUPABASE_URL,
      supabaseAnonKey: ENTORN.VITE_SUPABASE_ANON_KEY,
      dataMode: ENTORN.VITE_DATA_MODE,
      tenantId: ENTORN.VITE_TENANT_ID
    });
  });

  test('marcatge universal sense cap declaració: l’element arrenca amb el backend del paquet', async () => {
    globalThis.SocDePobleConfig = { nomPoble: 'Gent de Sella' };
    const element = await munta({ 'plugin-url': `${CDN}/dist/`, 'fonts-href': 'https://fonts.googleapis.com/css2?family=Noto+Sans' });
    expect(element.config).toMatchObject({
      supabaseUrl: ENTORN.VITE_SUPABASE_URL,
      supabaseAnonKey: ENTORN.VITE_SUPABASE_ANON_KEY,
      dataMode: ENTORN.VITE_DATA_MODE,
      tenantId: ENTORN.VITE_TENANT_ID,
      nomPoble: 'Gent de Sella'
    });
  });

  /* Cada canal de l'amfitrió, amb les quatre claus. `canal` és el nom que
     porta l'avís. */
  test.each([
    ['atributs', 'atributs', () => munta({ 'supabase-url': DECLARAT.supabaseUrl, 'supabase-anon-key': DECLARAT.supabaseAnonKey,
      'data-mode': DECLARAT.dataMode, 'tenant-id': DECLARAT.tenantId })],
    ['backend-url (àlies de l’atribut)', 'atributs', () => munta({ 'backend-url': DECLARAT.supabaseUrl, 'tenant-id': DECLARAT.tenantId })],
    ['JSON de l’atribut config', 'config', () => munta({ config: JSON.stringify(DECLARAT) })],
    ['JSON de config-id, amb els àlies', 'config', () => {
      const script = document.createElement('script');
      script.type = 'application/json';
      script.id = 'sdp-config-model-b';
      script.textContent = JSON.stringify({ backend_url: DECLARAT.supabaseUrl, tenant_id: DECLARAT.tenantId, backendUrl: DECLARAT.supabaseUrl });
      document.body.appendChild(script);
      return munta({ 'config-id': 'sdp-config-model-b' });
    }],
    ['propietat JS config', 'propietat', async () => {
      const element = await munta();
      await act(async () => { element.config = { ...DECLARAT }; });
      return element;
    }],
    ['configura({config})', 'configura', () => { configura({ config: { ...DECLARAT } }); return munta(); }],
    ['configura({backend_url, tenant_id})', 'configura', () => {
      configura({ backend_url: DECLARAT.supabaseUrl, tenant_id: DECLARAT.tenantId });
      return munta();
    }],
    ['el global SocDePobleConfig', 'global', () => {
      globalThis.SocDePobleConfig = { nomPoble: 'Gent de Sella', ...DECLARAT };
      return munta();
    }]
  ])('cap canal de l’amfitrió trepitja el backend ni el tenant del paquet: %s', async (_, canal, declara) => {
    const { element, avisos } = await ambAvisos(declara);
    expect(element.config).toMatchObject(DEL_PAQUET());
    expect(element.config.supabaseUrl).not.toBe(DECLARAT.supabaseUrl);
    expect(element.config.tenantId).not.toBe(DECLARAT.tenantId);
    const delModelB = avisos.filter((text) => text.includes('Model B'));
    expect(delModelB).toHaveLength(1);
    expect(delModelB[0]).toContain(`«${canal}»`);
  });

  /* Correcció de l'A1 (261003): el relé d'OAuth, el bot i l'emissor són serveis
     propis de Sóc de Poble. Amb un origen de la llista permesa, si arribaren a
     la configuració, sanejaConfig els deixaria passar (la primera asserció ho
     demostra) i data/oauthRelay.js enviaria l'entrada amb Google al relé de
     l'etiqueta. Cap canal de l'amfitrió no els hi porta. */
  const SERVEIS = Object.freeze({
    oauthRelayUrl: 'https://socdepoble.sollutia.com/cb',
    botApiUrl: 'https://socdepoble.sollutia.com/bot',
    sollutiaIssuer: 'https://socdepoble.sollutia.com'
  });

  test('premissa: un servei propi d’un origen permés passaria el sanejador de l’element', () => {
    expect(sanejaConfig({ ...SERVEIS })).toMatchObject(SERVEIS);
  });

  test.each([
    ['atributs', 'atributs', () => munta({ 'oauth-relay-url': SERVEIS.oauthRelayUrl, 'bot-api-url': SERVEIS.botApiUrl,
      'sollutia-issuer': SERVEIS.sollutiaIssuer })],
    ['JSON de l’atribut config', 'config', () => munta({ config: JSON.stringify({ ...SERVEIS, version: '9.9.9' }) })],
    ['propietat JS config', 'propietat', async () => {
      const element = await munta();
      await act(async () => { element.config = { ...SERVEIS, version: '9.9.9' }; });
      return element;
    }],
    ['configura({config})', 'configura', () => { configura({ config: { ...SERVEIS } }); return munta(); }]
  ])('cap canal de l’amfitrió no declara els serveis propis de Sóc de Poble: %s', async (_, canal, declara) => {
    const { element, avisos } = await ambAvisos(declara);
    for (const clau of [...Object.keys(SERVEIS), 'version']) expect(element.config, clau).not.toHaveProperty(clau);
    expect(element.config).toMatchObject(DEL_PAQUET());
    const delModelB = avisos.filter((text) => text.includes('Model B'));
    expect(delModelB).toHaveLength(1);
    expect(delModelB[0]).toContain(`«${canal}» porta `);
    for (const clau of Object.keys(SERVEIS)) expect(delModelB[0], clau).toContain(clau);
  });

  test('les claus legítimes de l’amfitrió continuen funcionant al costat de les descartades, en tots els canals', async () => {
    globalThis.SocDePobleConfig = { nomPoble: 'Gent del Global', poble: 'sella', tenantId: DECLARAT.tenantId };
    const { element } = await ambAvisos(() => munta({
      'nom-poble': 'Gent de Penàguila', 'ruta-inicial': '/mur', 'plugin-url': `${CDN}/dist/`, 'tenant-id': DECLARAT.tenantId,
      config: JSON.stringify({ language: 'es', apps: 'bar', supabaseUrl: DECLARAT.supabaseUrl })
    }));
    expect(element.config).toMatchObject({
      ...DEL_PAQUET(), nomPoble: 'Gent de Penàguila', poble: 'sella', rutaInicial: '/mur', pluginUrl: `${CDN}/dist/`,
      language: 'es', apps: ['bar']
    });
    // La propietat JS trepitja el nom, però el tenant que porta no entra.
    await ambAvisos(async () => { await act(async () => { element.config = { nomPoble: 'Gent de la Propietat', tenantId: DECLARAT.tenantId }; }); });
    expect(element.config.nomPoble).toBe('Gent de la Propietat');
    expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
  });

  test('l’avís es dona una sola vegada per canal i clau, encara que la configuració es recalcule i hi haja dues instàncies', async () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const element = await munta({ 'tenant-id': DECLARAT.tenantId });
      await act(async () => {
        element.setAttribute('nom-poble', 'Sella');
        element.setAttribute('tenant-id', '33333333-3333-4333-8333-333333333333');
        element.setAttribute('ruta-inicial', '/mur');
      });
      await munta({ 'tenant-id': DECLARAT.tenantId });
      const delModelB = () => avis.mock.calls.map((crida) => crida.join(' ')).filter((text) => text.includes('Model B'));
      expect(delModelB()).toHaveLength(1);
      expect(delModelB()[0]).toContain('«atributs» porta tenantId');
      expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
      // Una clau nova del mateix canal, o la mateixa per un altre canal, sí que avisa: una vegada.
      await act(async () => { element.setAttribute('supabase-url', DECLARAT.supabaseUrl); });
      await act(async () => { element.setAttribute('supabase-url', 'https://auth.socdepoble.org'); });
      await munta({ config: JSON.stringify({ tenantId: DECLARAT.tenantId }) });
      expect(delModelB()).toHaveLength(3);
      expect(delModelB()[1]).toContain('«atributs» porta supabaseUrl');
      expect(delModelB()[2]).toContain('«config» porta tenantId');
    } finally {
      avis.mockRestore();
    }
  });

  test('un valor buit no és cap declaració: no avisa i tampoc no tapa el del paquet', async () => {
    const { element, avisos } = await ambAvisos(async () => {
      const muntat = await munta({ 'tenant-id': '', 'supabase-url': '   ', config: JSON.stringify({ tenantId: null, supabaseAnonKey: '' }) });
      await act(async () => { muntat.config = { dataMode: undefined, tenant_id: null }; });
      return muntat;
    });
    expect(element.config).toMatchObject(DEL_PAQUET());
    expect(avisos).toEqual([]);
  });

  /* La via interna de main.jsx i embed.jsx, en un registre de mòduls nou (la
     capa es fixa una sola vegada per mòdul). */
  test('la capa que fixa l’entrada pròpia (fixaCapaDelPaquet) mana sobre la de compilació, i cap capa de l’amfitrió no la trepitja', async () => {
    vi.resetModules();
    const capa = await import('./config/capaDelPaquet.js');
    const fresc = await import('./PedraSecaEmbed.jsx');
    const PROPI = { supabaseUrl: 'https://auth.socdepoble.org', tenantId: '44444444-4444-4444-8444-444444444444' };
    capa.fixaCapaDelPaquet(PROPI);
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const config = fresc.sanejaConfig(fresc.composaCapes({
        json: { supabaseUrl: DECLARAT.supabaseUrl, language: 'es' },
        atributs: { tenantId: DECLARAT.tenantId, nomPoble: 'Sella' },
        propietat: { dataMode: DECLARAT.dataMode }
      }));
      expect(config).toMatchObject({ ...PROPI, nomPoble: 'Sella', language: 'es', dataMode: 'remote' });
      // La de compilació ja no hi entra: la clau pública no la porta la capa fixada.
      expect(config).not.toHaveProperty('supabaseAnonKey');
      expect(avis.mock.calls.map((crida) => crida.join(' ')).filter((text) => text.includes('Model B'))).toHaveLength(3);
    } finally {
      avis.mockRestore();
    }
  });

  test('configura({config}) sense backend no esborra el del paquet: els buits que afig la normalització no tapen res', async () => {
    configura({ config: { poble: 'sella' } });
    const element = await munta();
    expect(element.config.poble).toBe('sella');
    expect(element.config.supabaseUrl).toBe(ENTORN.VITE_SUPABASE_URL);
    expect(element.config.supabaseAnonKey).toBe(ENTORN.VITE_SUPABASE_ANON_KEY);
    expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
  });

  test('una variable buida o de només blancs no s’injecta', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.stubEnv('VITE_TENANT_ID', '   ');
    try {
      const { DEFECTES_DEL_PAQUET: defectes } = await import('./PedraSecaEmbed.jsx');
      expect(defectes).toEqual({ supabaseUrl: ENTORN.VITE_SUPABASE_URL, dataMode: ENTORN.VITE_DATA_MODE });
      expect(defectes).not.toHaveProperty('supabaseAnonKey');
      expect(defectes).not.toHaveProperty('tenantId');
    } finally {
      vi.stubEnv('VITE_SUPABASE_ANON_KEY', ENTORN.VITE_SUPABASE_ANON_KEY);
      vi.stubEnv('VITE_TENANT_ID', ENTORN.VITE_TENANT_ID);
    }
  });

  test('el backend del paquet passa per sanejaConfig com qualsevol capa', () => {
    // L'origen de VITE_SUPABASE_URL és a la llista permesa; un altre no ho és.
    expect(sanejaConfig({ supabaseUrl: ENTORN.VITE_SUPABASE_URL }).supabaseUrl).toBe(ENTORN.VITE_SUPABASE_URL);
    expect(sanejaConfig({ supabaseUrl: 'https://evil.test' })).not.toHaveProperty('supabaseUrl');
  });
});

/* ── Cap invisible cru al font ───────────────────────────────────────── */

describe('fonts sense caràcters invisibles crus (Trojan Source)', () => {
  /* Control (menys el salt de línia), format (bidi, amplada zero, BOM) i
     separadors de línia i paràgraf: cap no es veu en revisar un canvi. */
  const PERILLOSOS = /[\p{Cf}\p{Zl}\p{Zp}]|(?![\n])\p{Cc}/u;

  test.each([
    ['src/config/configAmfitrio.js'], ['src/PedraSecaEmbed.jsx'], ['src/embed.jsx'],
    ['src/PedraSecaEmbed.router.test.jsx'], ['src/PedraSecaEmbed.config.test.jsx']
  ])('%s', (fitxer) => {
    const linies = fs.readFileSync(fitxer, 'utf8').split('\n');
    const trobades = linies.flatMap((linia, i) => (PERILLOSOS.test(linia) ? [i + 1] : []));
    expect(trobades).toEqual([]);
  });

  /* L'escapament de configAmfitrio.js no ha de canviar quins caràcters lleva
     sanejaEtiqueta(): es recorre tot el pla bàsic contra la llista del
     contracte, escrita ací per punt de codi. */
  test('sanejaEtiqueta lleva exactament els invisibles del contracte, ni un més ni un menys', () => {
    const RANGS = [[0x061C, 0x061C], [0x200B, 0x200F], [0x202A, 0x202E], [0x2060, 0x2064], [0x2066, 0x2069], [0xFEFF, 0xFEFF]];
    const invisible = (punt) => RANGS.some(([des, fins]) => punt >= des && punt <= fins);
    const control = (punt) => punt <= 0x1F || (punt >= 0x7F && punt <= 0x9F);
    const errors = [];
    for (let punt = 0; punt <= 0xFFFF; punt += 1) {
      if (punt >= 0xD800 && punt <= 0xDFFF) continue; // subrogats: no són caràcters
      if (control(punt)) continue; // els lleva o els fa espai CONTROL, no INVISIBLES
      const caracter = String.fromCodePoint(punt);
      const desapareix = sanejaEtiqueta(`a${caracter}b`) === 'ab';
      if (desapareix !== invisible(punt)) errors.push(punt.toString(16));
    }
    expect(errors).toEqual([]);
  });
});


describe('servei de traducció de l’amfitrió', () => {
  test('només URL HTTP del mateix origen, també amb permalinks simples', () => {
    for (const valor of ['/wp-json/socdepoble/v1/traduir', `${window.location.origin}/sub/?rest_route=/socdepoble/v1/traduir`])
      expect(sanejaConfig({ traductorUrl: valor }).traductorUrl).toBe(new URL(valor, window.location.origin).href);
    for (const valor of ['', null, 1, {}, '//evil.test', 'https://evil.test', 'javascript:alert(1)', '/ok#secret', '/\\evil.test', 'api/traduir', `${window.location.origin.replace('://', '://user:password@')}/api`])
      expect(sanejaConfig({ traductorUrl: valor })).not.toHaveProperty('traductorUrl');
    expect(sanejaConfig({ traductorUrl: 'https://fonts.googleapis.com/api' })).not.toHaveProperty('traductorUrl');
    const net = sanejaConfig({ traductorNonce: 'unused', deeplApiKey: 'must-not-enter' });
    expect(net).not.toHaveProperty('traductorNonce');
    expect(net).not.toHaveProperty('deeplApiKey');
  });
  test('atribut per instància; una URL aliena no arriba a la configuració', async () => {
    const first = await munta({ 'traductor-url': '/wp-json/socdepoble/v1/traduir' });
    const second = await munta({ 'traductor-url': 'https://evil.test/traduir' });
    expect(first.config.traductorUrl).toBe(`${window.location.origin}/wp-json/socdepoble/v1/traduir`);
    expect(second.config).not.toHaveProperty('traductorUrl');
  });
});

/* ── T2b (261002) · Tenant invàlid en una capa (P0-b) ────────────────── */
/* Abans, un tenant que no era UUID feia llançar normalizeBackendConfig dins
   de connectedCallback: element en blanc i excepció global. Ara es descarta
   el d'eixa capa, amb un avís, i mana el segellat al paquet. Des de 261003
   (A1) el de l'amfitrió es descarta sempre, siga vàlid o no; el filtre del
   tenant invàlid només queda per a la capa del paquet. */

describe('tenant invàlid en una capa: l’element munta amb el del paquet', () => {
  const UUID_MAJUSCULES = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA';

  /** Munta amb un escoltador d'errors globals i un avís silenciat. */
  async function sotaVigilancia(muntatge) {
    const globals = [];
    const alError = (event) => globals.push(event.error ?? event.message);
    window.addEventListener('error', alError);
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const element = await muntatge();
      return { element, globals, avisos: avis.mock.calls.map((crida) => crida.join(' ')) };
    } finally {
      window.removeEventListener('error', alError);
      avis.mockRestore();
    }
  }

  test.each([
    ['l’atribut tenant-id', 'atributs', () => munta({ 'tenant-id': 'x' })],
    ['el JSON de l’atribut config', 'config', () => munta({ config: JSON.stringify({ tenantId: 'x' }) })],
    ['el JSON de config-id', 'config', () => {
      const script = document.createElement('script');
      script.type = 'application/json';
      script.id = 'sdp-config-de-prova';
      script.textContent = JSON.stringify({ tenant_id: 'tenant-mal-escrit', nomPoble: 'Sella' });
      document.body.appendChild(script);
      return munta({ 'config-id': 'sdp-config-de-prova' });
    }],
    ['la propietat JS config', 'propietat', async () => {
      const element = await munta();
      await act(async () => { element.config = { tenantId: 42 }; });
      return element;
    }]
  ])('%s amb un tenant que no és UUID: munta, cap excepció global, i el tenant és el del paquet', async (_, capa, muntatge) => {
    const { element, globals, avisos } = await sotaVigilancia(muntatge);
    expect(globals).toEqual([]);
    expect(element._root).not.toBeNull();
    expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
    expect(element.config.supabaseUrl).toBe(ENTORN.VITE_SUPABASE_URL);
    expect(avisos.some((text) => text.includes(`«${capa}»`))).toBe(true);
  });

  test('canviar tenant-id en calent, de vàlid a invàlid, no peta i el tenant és sempre el del paquet', async () => {
    const { element, globals } = await sotaVigilancia(async () => {
      const muntat = await munta({ 'tenant-id': '33333333-3333-4333-8333-333333333333' });
      expect(muntat.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
      await act(async () => { muntat.setAttribute('tenant-id', 'x'); });
      return muntat;
    });
    expect(globals).toEqual([]);
    expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
  });

  test('un tenant-id buit o de blancs no és cap declaració: no avisa i no tapa el del paquet', async () => {
    const { element, avisos } = await sotaVigilancia(() => munta({ 'tenant-id': '  ' }));
    expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
    expect(avisos).toEqual([]);
  });

  /* A1 (261003): abans un UUID vàlid de l'amfitrió guanyava al del paquet. */
  test('un tenant UUID vàlid de l’amfitrió, també en majúscules, tampoc no guanya: mana el del paquet', async () => {
    const { element, avisos } = await sotaVigilancia(() => munta({ 'tenant-id': UUID_MAJUSCULES }));
    expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
    expect(avisos.filter((text) => text.includes('Model B'))).toHaveLength(1);
  });

  test('paquet amb un tenant que no és UUID (VITE_TENANT_ID de desenvolupament): la capa es descarta i no peta', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_TENANT_ID', 'tenant-de-desenvolupament');
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const fresc = await import('./PedraSecaEmbed.jsx');
      expect(fresc.DEFECTES_DEL_PAQUET.tenantId).toBe('tenant-de-desenvolupament');
      let config;
      expect(() => { config = fresc.sanejaConfig(fresc.composaCapes()); }).not.toThrow();
      expect(config.tenantId).toBeNull();
      expect(config.supabaseUrl).toBe(ENTORN.VITE_SUPABASE_URL);
      expect(avis.mock.calls.flat().join(' ')).toContain('«paquet»');
    } finally {
      avis.mockRestore();
      vi.stubEnv('VITE_TENANT_ID', ENTORN.VITE_TENANT_ID);
    }
  });

  test('senseTenantInvalid es queda exactament el que normalizeBackendConfig accepta, i no muta la capa', () => {
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const valors = ['x', '', '   ', 42, 0, true, false, {}, [], ENTORN.VITE_TENANT_ID, UUID_MAJUSCULES,
        `${ENTORN.VITE_TENANT_ID} `, `{${ENTORN.VITE_TENANT_ID}}`, ENTORN.VITE_TENANT_ID.replace(/-/g, '')];
      for (const valor of valors) {
        let llancaria = false;
        try { normalizeBackendConfig({ tenantId: valor }); } catch { llancaria = true; }
        const capa = Object.freeze({ tenantId: valor, nomPoble: 'Sella' });
        const neta = senseTenantInvalid(capa, 'prova');
        expect(Object.hasOwn(neta, 'tenantId'), JSON.stringify(valor)).toBe(!llancaria);
        expect(neta.nomPoble).toBe('Sella');
        if (!llancaria) expect(neta).toBe(capa);
      }
      // null i undefined són «sense tenant»: es conserven tal qual.
      const sense = { tenantId: null, tenant_id: undefined };
      expect(senseTenantInvalid(sense, 'prova')).toBe(sense);
      expect(senseTenantInvalid(null, 'prova')).toEqual({});
    } finally {
      avis.mockRestore();
    }
  });
});

/* ── T2b · Orígens de backend: una sola llista (A6, P2-b) ────────────── */

test('orígens de backend acceptats: exactament els de hui, de la llista única d’orígens', () => {
  const esperats = ['https://auth.socdepoble.org', 'https://socdepoble.sollutia.com', 'https://socdepoble.sollutia.cat'];
  for (const origen of ORIGENS_CONEGUTS) {
    expect(Object.hasOwn(sanejaConfig({ supabaseUrl: origen }), 'supabaseUrl'), origen).toBe(esperats.includes(origen));
  }
});

/* ── T2b · Apps de la Plataforma que declara l'amfitrió ──────────────── */

describe('la clau apps', () => {
  test.each([
    ['bar salut', ['bar', 'salut']],
    ['  salut   bar ', ['salut', 'bar']],
    ['bar bar evil', ['bar']],
    [['salut', 'bar', 'salut'], ['salut', 'bar']],
    [['bar', 42, null, '../x', 'BAR'], ['bar']],
    ['evil', undefined],
    ['', undefined],
    ['   ', undefined],
    [[], undefined],
    [42, undefined],
    [null, undefined],
    [{ bar: true }, undefined],
    ['bar '.repeat(300), undefined]
  ])('sanejaApps(%j) → %j', (valor, esperat) => {
    const net = sanejaApps(valor);
    if (esperat === undefined) expect(net).toBeUndefined();
    else {
      expect(net).toEqual(esperat);
      expect(Object.isFrozen(net)).toBe(true);
    }
  });

  test('entra per la configuració, congelada; el global de l’amfitrió no la porta mai', async () => {
    globalThis.SocDePobleConfig = { nomPoble: 'Sella', apps: 'bar salut' };
    const perGlobal = await munta();
    expect(perGlobal.config.nomPoble).toBe('Sella');
    expect(perGlobal.config).not.toHaveProperty('apps');
    const perJson = await munta({ config: JSON.stringify({ apps: 'bar evil' }) });
    expect(perJson.config.apps).toEqual(['bar']);
    expect(Object.isFrozen(perJson.config.apps)).toBe(true);
    configura({ config: { apps: ['salut'] } });
    expect((await munta()).config.apps).toEqual(['salut']);
  });

  test('una app que l’amfitrió registra després de muntar entra a la llista que ja havia declarat', async () => {
    const element = await munta({ config: JSON.stringify({ apps: 'reserves bar' }) });
    expect(element.config.apps).toEqual(['bar']);
    try {
      await act(async () => { expect(registraAppExterna(manifestExternDeProva()).ok).toBe(true); });
      expect(element.config.apps).toEqual(['reserves', 'bar']);
    } finally {
      await act(async () => { retiraAppExterna('reserves'); });
    }
    expect(element.config.apps).toEqual(['bar']);
  });

  /* WP-R3: el callback de l'element ja és inert després de desmuntar
     (isConnected fals i config null), així que «no peta» no distingix una
     subscripció penjada d'una retirada. Es mira la subscripció mateixa. */
  test('desmuntat, l’element es dona de baixa del registre i el seu oient ja no hi és', async () => {
    const element = await munta({ config: JSON.stringify({ apps: 'reserves' }) });
    expect(subscripcions).toHaveLength(1);
    const [{ escolta, baixa }] = subscripcions;
    // Un moviment de node no torna a subscriure.
    await act(async () => { document.body.appendChild(element); });
    expect(subscripcions).toHaveLength(1);
    expect(baixa).not.toHaveBeenCalled();
    await act(async () => { element.remove(); element._desmuntaAra(); });
    expect(baixa).toHaveBeenCalledTimes(1);
    try {
      expect(() => registraAppExterna(manifestExternDeProva())).not.toThrow();
      expect(escolta).not.toHaveBeenCalled();
      expect(element.config).toBeNull();
    } finally {
      retiraAppExterna('reserves');
    }
  });
});

/* ── T2b · Clàusula dels slugs: la ruta de l'app cap a l'amfitrió (P1-c) ── */

describe('MemoryRouter · onCanvi', () => {
  function Sonda({ alNavegar }) {
    alNavegar(useNavigate());
    return null;
  }

  test('avisa en muntar i a cada canvi de ruta; no quan la ruta no canvia ni quan només canvia el callback', async () => {
    const rutes = [];
    const altres = [];
    let navega;
    const desa = (n) => { navega = n; };
    const { rerender } = render(<MemoryRouter rutaInicial="/xat" onCanvi={(ruta) => rutes.push(ruta)}><Sonda alNavegar={desa} /></MemoryRouter>);
    expect(rutes).toEqual(['/xat']);
    await act(async () => { navega('/mur?filtre=tot'); });
    await act(async () => { navega('/mur?filtre=tot', { replace: true }); });
    await act(async () => { navega(-1); });
    expect(rutes).toEqual(['/xat', '/mur?filtre=tot', '/xat']);
    rerender(<MemoryRouter rutaInicial="/xat" onCanvi={(ruta) => altres.push(ruta)}><Sonda alNavegar={desa} /></MemoryRouter>);
    expect(altres).toEqual([]);
    await act(async () => { navega('/pobles'); });
    expect(altres).toEqual(['/pobles']);
    expect(rutes).toHaveLength(3);
  });

  test('sense onCanvi navega igual, i mai toca window.history', async () => {
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');
    try {
      let navega;
      render(<MemoryRouter rutaInicial="/xat"><Sonda alNavegar={(n) => { navega = n; }} /></MemoryRouter>);
      await act(async () => { navega('/mur'); });
      expect(push).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    } finally {
      push.mockRestore();
      replace.mockRestore();
    }
  });
});

describe('la ruta de l’app cap a l’amfitrió (clàusula dels slugs)', () => {
  const onEs = () => window.location.pathname + window.location.search + window.location.hash;

  /** Escolta `sdp-navega` al document (bombolla des de l'element). */
  function escolta() {
    const rebuts = [];
    const alNavegar = (event) => rebuts.push({ ruta: event.detail.ruta, target: event.target, composed: event.composed });
    document.addEventListener(ESDEVENIMENT_RUTA, alNavegar);
    return { rebuts, rutes: () => rebuts.map((r) => r.ruta), para: () => document.removeEventListener(ESDEVENIMENT_RUTA, alNavegar) };
  }

  test('fase 1: sdp-navega sobre l’element en muntar i a cada navegació, sense historial ni bus de window', async () => {
    window.history.replaceState(null, '', '/pagina-de-l-amfitrio?x=1#seccio');
    const historial = [vi.spyOn(window.history, 'pushState'), vi.spyOn(window.history, 'replaceState')];
    const bus = vi.fn();
    window.addEventListener('sdp:navega', bus);
    const sentit = escolta();
    try {
      const element = await munta({ poble: 'sella' });
      expect(sentit.rutes()).toEqual(['/xat']);
      await act(async () => { navegadors.get(element)('/mur?filtre=tot'); });
      expect(sentit.rutes()).toEqual(['/xat', '/mur']);
      expect(sentit.rebuts.every((r) => r.target === element && r.composed)).toBe(true);
      expect(bus).not.toHaveBeenCalled();
      for (const espia of historial) expect(espia).not.toHaveBeenCalled();
      expect(onEs()).toBe('/pagina-de-l-amfitrio?x=1#seccio');
    } finally {
      sentit.para();
      window.removeEventListener('sdp:navega', bus);
      for (const espia of historial) espia.mockRestore();
    }
  });

  /* WP-R1: el text del cercador (/cerca?q=…, escrit amb replace cada 250 ms)
     i els ids de perfil no ixen cap a l'amfitrió. Només la ruta tapada, i
     només quan canvia. */
  test('fase 1 · privacitat: sdp-navega porta la ruta tapada, sense consulta ni ids, i només quan canvia', async () => {
    const sentit = escolta();
    try {
      const element = await munta({ 'ruta-inicial': '/xat' });
      const navega = navegadors.get(element);
      await act(async () => { navega('/cerca?q=nom-sintetic'); });
      await act(async () => { navega('/cerca?q=nom-sintetic-mes-llarg', { replace: true }); });
      await act(async () => { navega('/perfil/agent-sintetic-1'); });
      await act(async () => { navega('/perfil/agent-sintetic-2'); });
      await act(async () => { navega('/mur?filtre=tot'); });
      expect(sentit.rutes()).toEqual(['/xat', '/cerca', '/perfil/*', '/mur']);
      expect(JSON.stringify(sentit.rutes())).not.toMatch(/sintetic|filtre/);
    } finally {
      sentit.para();
    }
  });

  test('fase 1: amb dues instàncies, cada una avisa una sola vegada, i només de la seua ruta', async () => {
    const primera = await munta();
    const segona = await munta();
    const sentit = escolta();
    try {
      // L'element es compara per identitat: un toMatchObject recorreria tot l'arbre de React que penja d'ell.
      await act(async () => { navegadors.get(segona)('/pobles'); });
      expect(sentit.rutes()).toEqual(['/pobles']);
      expect(sentit.rebuts[0].target).toBe(segona);
      await act(async () => { navegadors.get(primera)('/mur'); });
      expect(sentit.rutes()).toEqual(['/pobles', '/mur']);
      expect(sentit.rebuts[1].target).toBe(primera);
    } finally {
      sentit.para();
    }
  });

  /* Onada 12 (261011; ordres 261011_0130, punt 4) · Abans el reflex no obria
     mai cap entrada i «Arrere» treia del portal. Ara la primera càrrega
     adopta l'entrada (replaceState) i cada navegació nova n'obri una; l'estat
     de l'amfitrió es conserva i s'amplia amb la clau `sdp`. La seqüència
     sencera amb «Arrere» és a PedraSecaEmbed.historial.test.jsx. */
  test('fase 2 · fragment: la ruta viu a #sdp= i la resta de la URL i de l’estat de l’amfitrió no es toca', async () => {
    window.history.replaceState({ amfitrio: 1 }, '', '/pagina?x=1#vista=mapa');
    const push = vi.spyOn(window.history, 'pushState');
    try {
      const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
      expect(element.config.rutaAUrl).toBe('fragment');
      expect(onEs()).toBe('/pagina?x=1#vista=mapa&sdp=/xat');
      expect(window.history.state).toEqual({ amfitrio: 1, sdp: { ruta: '/xat', i: 0 } });
      expect(push).not.toHaveBeenCalled();
      await act(async () => { navegadors.get(element)('/mur?filtre=tot&ordre=nou'); });
      expect(onEs()).toBe('/pagina?x=1#vista=mapa&sdp=/mur%3Ffiltre%3Dtot%26ordre%3Dnou');
      expect(window.history.state).toEqual({ amfitrio: 1, sdp: { ruta: '/mur?filtre=tot&ordre=nou', i: 1 } });
      expect(push).toHaveBeenCalledTimes(1);
    } finally {
      push.mockRestore();
    }
  });

  /* WP-R4: un ancoratge (#seccio) o un router de hash (#/ruta) de l'amfitrió
     no són paràmetres: afegir-hi &sdp= trencaria el :target, el scroll i la
     ruta de l'amfitrió en recarregar o compartir. */
  test.each([['#seccio'], ['#/ruta/de/l-amfitrio'], ['#!/ruta'], ['#seccio&vista=mapa']])(
    'fase 2 · fragment de l’amfitrió que no és clau=valor (%s): no es toca, i un sol avís recomana parametre', async (fragment) => {
      window.history.replaceState(null, '', `/pagina?x=1${fragment}`);
      const replace = vi.spyOn(window.history, 'replaceState');
      const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
      try {
        const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
        await act(async () => { navegadors.get(element)('/mur'); });
        await act(async () => { navegadors.get(element)('/pobles'); });
        expect(replace).not.toHaveBeenCalled();
        expect(onEs()).toBe(`/pagina?x=1${fragment}`);
        expect(avis).toHaveBeenCalledTimes(1);
        expect(avis.mock.calls[0].join(' ')).toContain('parametre');
      } finally {
        replace.mockRestore();
        avis.mockRestore();
      }
    });

  test('fase 2 · fragment: quan l’amfitrió lleva el seu ancoratge, la ruta torna a escriure’s', async () => {
    window.history.replaceState(null, '', '/pagina#seccio');
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
      expect(onEs()).toBe('/pagina#seccio');
      await act(async () => {
        window.history.replaceState(null, '', '/pagina');
        window.dispatchEvent(new Event('hashchange'));
      });
      await act(async () => { navegadors.get(element)('/mur'); });
      expect(onEs()).toBe('/pagina#sdp=/mur');
    } finally {
      avis.mockRestore();
    }
  });

  /* WP-R5: el límit que s'aplica en llegir s'aplica també en escriure. */
  test('fase 2 · límit: just al límit fa anada i tornada; per damunt s’escriu només el camí, amb un avís', async () => {
    const limit = CONTRACTE_AMFITRIO_V1.limits.rutaAUrl;
    const prefix = '/cerca%3Fq%3D'; // '/cerca?q=' codificat a la clau sdp
    const justa = `/cerca?q=${'a'.repeat(limit - prefix.length)}`;
    const llarga = `${justa}a`;
    window.history.replaceState(null, '', '/pagina');
    const avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const element = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
      await act(async () => { navegadors.get(element)(justa); });
      expect(window.location.hash.slice('#sdp='.length)).toHaveLength(limit);
      expect(llegeixRutaDeLaUrl('fragment')).toBe(justa);
      expect(avis).not.toHaveBeenCalled();
      await act(async () => { navegadors.get(element)(llarga); });
      expect(onEs()).toBe('/pagina#sdp=/cerca');
      expect(llegeixRutaDeLaUrl('fragment')).toBe('/cerca');
      expect(avis).toHaveBeenCalledTimes(1);
      expect(avis.mock.calls[0].join(' ')).toContain(String(limit));
    } finally {
      avis.mockRestore();
    }
  });

  test('fase 2 · paràmetre: ?sdp= al seu lloc, els paràmetres aliens intactes i en el seu ordre', async () => {
    window.history.replaceState(null, '', '/pagina?a=1&sdp=/xat&b=2#seccio');
    const sentit = escolta();
    try {
      const element = await munta({ 'ruta-a-url': 'parametre' });
      expect(sentit.rutes()).toEqual(['/xat']);
      await act(async () => { navegadors.get(element)('/pobles/sella'); });
      expect(onEs()).toBe('/pagina?a=1&sdp=/pobles/sella&b=2#seccio');
    } finally {
      sentit.para();
    }
  });

  test('fase 2 · en muntar, la ruta de la URL guanya a ruta-inicial', async () => {
    window.history.replaceState(null, '', '/pagina#sdp=/pobles/sella');
    const sentit = escolta();
    try {
      await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
      // L'esdeveniment porta la ruta tapada; la URL, la sencera.
      expect(sentit.rutes()).toEqual(['/pobles/*']);
      expect(onEs()).toBe('/pagina#sdp=/pobles/sella');
    } finally {
      sentit.para();
    }
  });

  /* Onada 5 (ordre del Mestre, 261009) · Apegar a WordPress un enllaç amb la
     paraula anglesa. El plugin declara ruta-a-url="fragment" i sempre un
     poble, que sense ruta duria a /xat: per això cal veure que l'app munta a
     /chat (la URL guanya) i que és l'àlies qui la porta a /xat. L'App d'este
     fitxer és un doble; l'àlies de veritat (RedireccioXat) el prova
     App.test.jsx, i ací se'n reprodueix el <Navigate replace>. */
  test('fase 2 · apegar «#sdp=/chat» amb un poble declarat: l’àlies porta l’app a /xat i la URL queda en «#sdp=/xat»', async () => {
    window.history.replaceState(null, '', '/pagina#sdp=/chat');
    alies.set('/chat', '/xat');
    const push = vi.spyOn(window.history, 'pushState');
    const sentit = escolta();
    try {
      const element = await munta({ 'ruta-a-url': 'fragment', poble: 'la-torre-de-les-macanes' });
      expect(element.config.rutaAUrl).toBe('fragment');
      expect(sentit.rutes()).toEqual(['/chat', '/xat']);
      expect(onEs()).toBe('/pagina#sdp=/xat');
      expect(llegeixRutaDeLaUrl('fragment')).toBe('/xat');
      // replaceState del reflex: l'enllaç apegat no deixa cap entrada nova a l'historial.
      expect(push).not.toHaveBeenCalled();
    } finally {
      push.mockRestore();
      sentit.para();
    }
  });

  test('fase 2 · hashchange i popstate: l’app segueix la URL de l’amfitrió', async () => {
    window.history.replaceState(null, '', '/pagina');
    const sentit = escolta();
    try {
      await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
      await act(async () => {
        window.history.replaceState(null, '', '/pagina#sdp=/pobles');
        window.dispatchEvent(new Event('hashchange'));
      });
      await act(async () => {
        window.history.replaceState(null, '', '/pagina#sdp=/mur');
        window.dispatchEvent(new Event('popstate'));
      });
      expect(sentit.rutes()).toEqual(['/xat', '/pobles', '/mur']);
    } finally {
      sentit.para();
    }
  });

  test.each([['//evil.test/x'], ['/a/%2e%2e/admin'], ['/a/../admin'], ['https://evil.test/'], ['/\\evil.test']])(
    'fase 2 · una ruta de la URL invàlida (%j) es rebutja: aterra a la ruta inicial i la reescriu', async (dolenta) => {
      window.history.replaceState(null, '', `/pagina#sdp=${encodeURIComponent(dolenta)}`);
      const sentit = escolta();
      try {
        await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
        expect(sentit.rutes()).toEqual(['/xat']);
        expect(onEs()).toBe('/pagina#sdp=/xat');
        await act(async () => {
          window.history.replaceState(null, '', `/pagina#sdp=${encodeURIComponent(dolenta)}`);
          window.dispatchEvent(new Event('hashchange'));
        });
        expect(sentit.rutes()).toEqual(['/xat']);
      } finally {
        sentit.para();
      }
    });

  test.each([[{}], [{ 'ruta-a-url': 'hash' }], [{ 'ruta-a-url': 'FRAGMENT' }]])('fase 2 · sense una declaració vàlida (%j), la URL no es toca', async (atributs) => {
    window.history.replaceState(null, '', '/pagina?x=1#sdp=/pobles');
    const replace = vi.spyOn(window.history, 'replaceState');
    try {
      const element = await munta({ ...atributs, 'ruta-inicial': '/xat' });
      expect(element.config).not.toHaveProperty('rutaAUrl');
      await act(async () => { navegadors.get(element)('/mur'); });
      expect(replace).not.toHaveBeenCalled();
      expect(onEs()).toBe('/pagina?x=1#sdp=/pobles');
    } finally {
      replace.mockRestore();
    }
  });

  test('fase 2 · la segona instància no escriu mai, encara que ho declare', async () => {
    window.history.replaceState(null, '', '/pagina');
    await munta();
    const replace = vi.spyOn(window.history, 'replaceState');
    try {
      const segona = await munta({ 'ruta-a-url': 'fragment', 'ruta-inicial': '/xat' });
      expect(segona.config.rutaAUrl).toBe('fragment');
      await act(async () => { navegadors.get(segona)('/mur'); });
      expect(replace).not.toHaveBeenCalled();
      expect(onEs()).toBe('/pagina');
    } finally {
      replace.mockRestore();
    }
  });
});
