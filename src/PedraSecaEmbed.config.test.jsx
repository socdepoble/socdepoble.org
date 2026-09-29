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
 *  · Defectes del paquet (Model B): sense cap declaració, l'element pren el
 *    backend de compilació (VITE_*); qualsevol capa declarada el trepitja.
 *
 * L'App i els proveïdors no hi pinten res: ací només es mira la configuració.
 * El backend de compilació es fixa abans d'avaluar l'element (vi.hoisted), així
 * que les proves no depenen del .env de qui les executa.
 */
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import fs from 'node:fs';
import { act } from '@testing-library/react';
import { activeElements, defineCustomElement, sanejaConfig, DEFECTES_DEL_PAQUET } from './PedraSecaEmbed.jsx';
import { baseRecursos, fixaBaseRecursos } from './config/assetResolver.js';
import { sanejaEtiqueta } from './config/configAmfitrio.js';
import { normalizeBackendConfig } from './config/backendConfig.js';
import { permetOrigenMitjans } from './utils/sanitize.js';

const ENTORN = vi.hoisted(() => {
  const entorn = {
    VITE_SUPABASE_URL: 'https://paquet.supabase.test',
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_del_paquet',
    VITE_DATA_MODE: 'seed',
    VITE_TENANT_ID: 'tenant-del-paquet'
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
vi.mock('./app/App.jsx', () => ({ default: () => null }));
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

/** Com host.js:configura(): la config de l'amfitrió, normalitzada, queda a la política. */
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
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  // '/' buida la base: cada prova comença sense amfitrió.
  fixaBaseRecursos('/');
  delete globalThis.SocDePobleConfig;
  politica.actual = null;
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllEnvs();
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
    ['manageDocumentHead', null, undefined]
  ])('%s = %j → %j', (clau, valor, esperat) => {
    const net = sanejaConfig({ [clau]: valor });
    if (esperat === undefined) expect(net).not.toHaveProperty(clau);
    else expect(net[clau]).toBe(esperat);
  });

  test('el poble dona la ruta inicial només si no n’hi ha cap de vàlida', () => {
    expect(sanejaConfig({ poble: 'sella' }).rutaInicial).toBe('/pobles/sella');
    expect(sanejaConfig({ poble: 'sella', rutaInicial: '/xat' }).rutaInicial).toBe('/xat');
    expect(sanejaConfig({ poble: 'sella', rutaInicial: '//evil.test' }).rutaInicial).toBe('/pobles/sella');
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

/* ── Defectes del paquet (Model B) ───────────────────────────────────── */
/* Amb el marcatge universal de tres peces (global + <soc-de-poble plugin-url
   fonts-href> + paquet) l'amfitrió no diu res del backend: el tria i el
   segella Sóc de Poble. La capa és la més baixa de totes. */

describe('defectes del paquet: el backend de compilació, per davall de tot', () => {
  const DECLARAT = Object.freeze({
    supabaseUrl: 'https://socdepoble.sollutia.com',
    supabaseAnonKey: 'sb_publishable_de_l_amfitrio',
    dataMode: 'local',
    tenantId: 'tenant-de-l-amfitrio'
  });

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

  test.each([
    ['atributs', () => munta({ 'supabase-url': DECLARAT.supabaseUrl, 'supabase-anon-key': DECLARAT.supabaseAnonKey,
      'data-mode': DECLARAT.dataMode, 'tenant-id': DECLARAT.tenantId })],
    ['JSON de l’atribut config', () => munta({ config: JSON.stringify(DECLARAT) })],
    ['propietat JS config', async () => {
      const element = await munta();
      await act(async () => { element.config = { ...DECLARAT }; });
      return element;
    }],
    ['configura({config})', () => { configura({ config: { ...DECLARAT } }); return munta(); }]
  ])('qualsevol valor declarat guanya al del paquet: %s', async (_, declara) => {
    const element = await declara();
    expect(element.config).toMatchObject(DECLARAT);
  });

  test('configura({config}) sense backend no esborra el del paquet: els buits que afig la normalització no tapen res', async () => {
    configura({ config: { poble: 'sella' } });
    const element = await munta();
    expect(element.config.poble).toBe('sella');
    expect(element.config.supabaseUrl).toBe(ENTORN.VITE_SUPABASE_URL);
    expect(element.config.supabaseAnonKey).toBe(ENTORN.VITE_SUPABASE_ANON_KEY);
    expect(element.config.tenantId).toBe(ENTORN.VITE_TENANT_ID);
  });

  test('configura({backend_url, tenant_id}) guanya al paquet, i l’atribut supabase-url a configura', async () => {
    configura({ backend_url: DECLARAT.supabaseUrl, tenant_id: DECLARAT.tenantId });
    const perConfigura = await munta();
    expect(perConfigura.config.supabaseUrl).toBe(DECLARAT.supabaseUrl);
    expect(perConfigura.config.tenantId).toBe(DECLARAT.tenantId);
    // L'àlies de configura no passa per davant de l'atribut dins de normalizeBackendConfig.
    const perAtribut = await munta({ 'supabase-url': 'https://auth.socdepoble.org', 'tenant-id': 'tenant-de-l-atribut' });
    expect(perAtribut.config.supabaseUrl).toBe('https://auth.socdepoble.org');
    expect(perAtribut.config.tenantId).toBe('tenant-de-l-atribut');
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
