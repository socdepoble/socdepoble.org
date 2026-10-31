/**
 * W4-12 (auditoria de Codex, 261004) · El contrast respecta l'arrel del mòdul.
 *
 * data-contrast="bancal" va a UN element, i mai a un de l'amfitrió
 * (config/theme.js: arrelDePresentacio):
 *  · Shadow DOM (<soc-de-poble>): l'element amfitrió del shadow root;
 *  · document alié (l'embed React en DOM ordinari sense manageDocumentHead:
 *    true, o amb window.__SDP_EMBEDDED__): l'arrel del mòdul, .sdp-root;
 *  · <html> NOMÉS quan l'app és ama del document (esAmaDelDocument).
 * La sentinella de Codex, <html data-contrast="HOST-CONTRAST">, es conserva
 * en muntar, canviar i desmuntar. Dues instàncies no es barallen i
 * comparteixen la tria; els Ajustos i el sistema són el mateix estat.
 *
 * Shell real (PedraSecaEmbed, App, proveïdors i l'element de veritat) amb un
 * backend fals sense xarxa, com App.contrast.test.jsx. L'emmagatzematge es
 * toca només per storage.js.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed, { activeElements, defineCustomElement } from '../PedraSecaEmbed.jsx';
import { UIProvider, useUIActions, useUIState } from './contexts/UIContext.jsx';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { CONSULTA_CONTRAST_SISTEMA, CONTRAST_KEY, ESDEVENIMENT_CONTRAST } from '../config/theme.js';
import { delVal, getVal, setVal } from '../config/storage.js';
import { carregaDiccionari, createTranslator } from '../config/i18n.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined, arrencaAuto: vi.fn(), exposaGlobal: vi.fn() }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

/* MediaQueryList controlable per consulta (tema i contrast). */
function sistema({ contrastMes = false } = {}) {
  const llistes = new Map();
  const llista = (consulta) => {
    if (!llistes.has(consulta)) {
      const oients = new Set();
      llistes.set(consulta, {
        matches: consulta === CONSULTA_CONTRAST_SISTEMA ? contrastMes : false,
        media: consulta,
        onchange: null,
        addEventListener: (tipus, oient) => { if (tipus === 'change') oients.add(oient); },
        removeEventListener: (tipus, oient) => { if (tipus === 'change') oients.delete(oient); },
        addListener: (oient) => oients.add(oient),
        removeListener: (oient) => oients.delete(oient),
        dispatchEvent: () => true,
        oients
      });
    }
    return llistes.get(consulta);
  };
  vi.stubGlobal('matchMedia', vi.fn(llista));
  return {
    canviaContrast(valor) {
      const mq = llista(CONSULTA_CONTRAST_SISTEMA);
      mq.matches = valor;
      for (const oient of [...mq.oients]) oient({ matches: valor, media: CONSULTA_CONTRAST_SISTEMA });
    }
  };
}

const html = document.documentElement;
const SENTINELLA = 'HOST-CONTRAST';
let anterior = null;
let contrastAbans = null;
let temaHtmlAbans = null;

beforeAll(() => {
  defineCustomElement();
});

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Xarxa inesperada'); }));
  contrastAbans = getVal(CONTRAST_KEY);
  delVal(CONTRAST_KEY);
  temaHtmlAbans = html.getAttribute('data-theme');
  /* La pàgina amfitriona ja porta el seu propi data-contrast. */
  html.setAttribute('data-contrast', SENTINELLA);
  anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => []
  });
});

afterEach(async () => {
  cleanup();
  await act(async () => {
    for (const element of [...activeElements]) {
      element.remove();
      element._desmuntaAra();
    }
  });
  document.body.replaceChildren();
  delete window.__SDP_EMBEDDED__;
  if (Object.keys(anterior).length) setBackendImplementation(anterior);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  html.removeAttribute('data-contrast');
  if (temaHtmlAbans == null) html.removeAttribute('data-theme');
  else html.setAttribute('data-theme', temaHtmlAbans);
  if (contrastAbans == null) delVal(CONTRAST_KEY);
  else setVal(CONTRAST_KEY, contrastAbans);
});

const arrelDe = (contenidor) => contenidor.querySelector('.sdp-root');

/* ── Embed React en DOM ordinari: el document és d'un altre ─────────────── */

describe('document alié (embed React sense Shadow DOM)', () => {
  test.each([
    ['manageDocumentHead: false', { manageDocumentHead: false }, false],
    ['sense cap declaració', {}, false],
    ['manageDocumentHead: true però window.__SDP_EMBEDDED__', { manageDocumentHead: true }, true]
  ])('%s: <html> conserva HOST-CONTRAST en muntar, canviar i desmuntar; el Bancal va a .sdp-root', async (_nom, declaracio, encastat) => {
    if (encastat) window.__SDP_EMBEDDED__ = true;
    const sis = sistema();
    setVal(CONTRAST_KEY, 'sistema');
    const { container, unmount } = render(<PedraSecaEmbed config={{ routerType: 'memory', ...declaracio }} />);
    await screen.findByRole('main');
    const arrel = arrelDe(container);

    /* Muntar · mode normal: ni l'arrel ni l'<html> canvien. */
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
    expect(arrel.hasAttribute('data-contrast')).toBe(false);

    /* Canviar · el sistema demana més contrast: l'arrel del mòdul, i res més. */
    act(() => { sis.canviaContrast(true); });
    expect(arrel.getAttribute('data-contrast')).toBe('bancal');
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
    act(() => { sis.canviaContrast(false); });
    expect(arrel.hasAttribute('data-contrast')).toBe(false);
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);

    /* Desmuntar · l'amfitrió es queda com estava. */
    unmount();
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
  });

  test('amb «Bancal» desat, l’arrel ja el porta en el primer pintat i l’<html> no', async () => {
    sistema();
    setVal(CONTRAST_KEY, 'bancal');
    const { container } = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false }} />);
    await screen.findByRole('main');
    expect(arrelDe(container).getAttribute('data-contrast')).toBe('bancal');
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
    expect(document.body.hasAttribute('data-contrast')).toBe(false);
  });

  test('dues instàncies: cada una a la seua arrel; desmuntar-ne una no toca l’altra ni l’<html>', async () => {
    sistema();
    setVal(CONTRAST_KEY, 'bancal');
    const primera = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false }} />);
    const segona = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false }} isFirstInstance={false} />);
    await waitFor(() => expect(screen.getAllByRole('main')).toHaveLength(2));
    const [a, b] = [arrelDe(primera.container), arrelDe(segona.container)];
    expect(a).not.toBe(b);
    expect([a.getAttribute('data-contrast'), b.getAttribute('data-contrast')]).toEqual(['bancal', 'bancal']);
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);

    primera.unmount();
    expect(b.getAttribute('data-contrast')).toBe('bancal');
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
    segona.unmount();
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
  });
});

/* ── L'app ama del document (socdepoble.org, main.jsx) ─────────────────── */

describe('ama del document (manageDocumentHead: true, fora d’iframe)', () => {
  test('el Bancal va a <html>, l’arrel no el porta, i en desmuntar l’<html> recupera el que tenia', async () => {
    const sis = sistema();
    setVal(CONTRAST_KEY, 'bancal');
    const { container, unmount } = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: true }} />);
    await screen.findByRole('main');
    expect(html.getAttribute('data-contrast')).toBe('bancal');
    expect(arrelDe(container).hasAttribute('data-contrast')).toBe(false);
    act(() => { sis.canviaContrast(true); });
    expect(html.getAttribute('data-contrast')).toBe('bancal');
    unmount();
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
  });
});

/* ── Shadow DOM: <soc-de-poble> ─────────────────────────────────────────── */

async function muntaElement() {
  const element = document.createElement('soc-de-poble');
  element.setAttribute('plugin-url', '/');
  document.body.appendChild(element);
  await act(async () => {});
  await waitFor(() => expect(element._closedRoot?.querySelector('main')).toBeTruthy());
  return element;
}

describe('Shadow DOM (<soc-de-poble>)', () => {
  test('el contrast va a l’amfitrió; <html> conserva HOST-CONTRAST en muntar, canviar i desmuntar', async () => {
    const sis = sistema({ contrastMes: true });
    setVal(CONTRAST_KEY, 'sistema');
    const element = await muntaElement();
    expect(element.getAttribute('data-contrast')).toBe('bancal');
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);

    act(() => { sis.canviaContrast(false); });
    expect(element.hasAttribute('data-contrast')).toBe(false);
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
    act(() => { sis.canviaContrast(true); });
    expect(element.getAttribute('data-contrast')).toBe('bancal');

    await act(async () => {
      element.remove();
      element._desmuntaAra();
    });
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
  });

  test('dues instàncies: cada amfitrió porta el seu atribut; retirar-ne una no toca l’altra ni l’<html>', async () => {
    sistema();
    setVal(CONTRAST_KEY, 'bancal');
    const a = await muntaElement();
    const b = await muntaElement();
    expect([a.getAttribute('data-contrast'), b.getAttribute('data-contrast')]).toEqual(['bancal', 'bancal']);
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
    await act(async () => {
      a.remove();
      a._desmuntaAra();
    });
    expect(b.getAttribute('data-contrast')).toBe('bancal');
    expect(html.getAttribute('data-contrast')).toBe(SENTINELLA);
  });
});

/* ── Revisió adversarial de C1 · la resta d'atributs de l'<html> ───────────
   La mateixa frontera val per a tot el que la closca escriu a l'arrel: el
   tema conserva el seu lloc (<html> o l'amfitrió) però torna el de la pàgina
   en desmuntar; la llengua (lang) d'un document alié no es toca mai: va a
   l'arrel del mòdul, que és on viu el contingut que la parla. */

describe('document alié: data-theme i lang de l’amfitrió', () => {
  let langAbans = null;
  beforeEach(() => { langAbans = html.getAttribute('lang'); });
  afterEach(() => {
    if (langAbans == null) html.removeAttribute('lang');
    else html.setAttribute('lang', langAbans);
  });

  test('data-theme: en desmuntar, l’<html> recupera el tema de l’amfitrió; dues instàncies no es barallen', async () => {
    sistema();
    html.setAttribute('data-theme', 'HOST-TEMA');
    const a = render(<PedraSecaEmbed themeMode="dark" config={{ routerType: 'memory', manageDocumentHead: false }} />);
    await screen.findByRole('main');
    expect(html.getAttribute('data-theme')).toBe('dark');
    const b = render(<PedraSecaEmbed themeMode="light" config={{ routerType: 'memory', manageDocumentHead: false }} isFirstInstance={false} />);
    await waitFor(() => expect(screen.getAllByRole('main')).toHaveLength(2));
    expect(html.getAttribute('data-theme')).toBe('light');
    b.unmount();
    expect(html.getAttribute('data-theme')).toBe('dark');
    a.unmount();
    expect(html.getAttribute('data-theme')).toBe('HOST-TEMA');
  });

  test('lang: l’<html> d’un WordPress en-US no passa a «ca» ni en muntar ni en desmuntar; l’arrel del mòdul el porta', async () => {
    sistema();
    html.setAttribute('lang', 'en-US');
    const { container, unmount } = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false }} />);
    await screen.findByRole('main');
    expect(html.getAttribute('lang')).toBe('en-US');
    expect(arrelDe(container).getAttribute('lang')).toBe('ca');
    unmount();
    expect(html.getAttribute('lang')).toBe('en-US');
  });

  test('lang: l’app ama del document (socdepoble.org) el posa a <html>, com sempre', async () => {
    sistema();
    html.setAttribute('lang', 'en-US');
    const { container } = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: true }} />);
    await screen.findByRole('main');
    expect(html.getAttribute('lang')).toBe('ca');
    expect(arrelDe(container).hasAttribute('lang')).toBe(false);
  });

  /* Fase D (261020, tasca 4.1) · L1 · El diccionari del castellà arriba
     després del primer pintat: el lang de l'arrel i la barra lateral (un memo
     que només llig el router) han de seguir la llengua del text quan arriba. */
  test('lang i barra lateral: amfitrió en castellà, valencià fins que arriba el diccionari i castellà després', async () => {
    sistema();
    vi.stubGlobal('innerWidth', 1440);
    const { container } = render(<PedraSecaEmbed config={{ routerType: 'memory', manageDocumentHead: false, language: 'es' }} />);
    await screen.findByRole('main');
    /* Gauntlet 261029 (i18n-a11y, L4a) · El nom de la barra també seguix la
       llengua: es llig després que arribe el diccionari, en castellà. */
    const barra = () => screen.getByRole('navigation', { name: 'Navegación principal' });
    /* El tros pot haver arribat ja (l'efecte d'UIProvider el demana en muntar):
       l'estat d'abans no és determinista; el d'arribada, sí. */
    await act(async () => { await carregaDiccionari('es'); });
    expect(arrelDe(container).getAttribute('lang')).toBe('es');
    expect(barra().querySelector('a.nav-item[aria-label="Mercado"]')).not.toBeNull();
    expect(createTranslator('es')('nav.mercat')).toBe('Mercado');
  });

  test('lang: dins del Shadow DOM, a l’amfitrió <soc-de-poble>, i l’<html> no es toca', async () => {
    sistema();
    html.setAttribute('lang', 'en-US');
    const element = await muntaElement();
    expect(element.getAttribute('lang')).toBe('ca');
    expect(html.getAttribute('lang')).toBe('en-US');
  });
});

/* ── Un sol estat: Ajustos, Panell, sistema i altres instàncies ─────────── */

const accions = {};
function Sonda({ nom }) {
  const { contrastMode, contrastPreference } = useUIState();
  const { setContrast } = useUIActions();
  accions[nom] = setContrast;
  return <p data-testid={nom} data-mode={contrastMode} data-preferencia={contrastPreference} />;
}

describe('un sol estat de contrast', () => {
  test('la tria d’una instància (setContrast, el dels Ajustos i el Panell) arriba a l’altra; un valor invàlid no', () => {
    sistema();
    render(
      <>
        <UIProvider externalConfig={{}}><Sonda nom="a" /></UIProvider>
        <UIProvider externalConfig={{}}><Sonda nom="b" /></UIProvider>
      </>
    );
    act(() => { accions.a('bancal'); });
    expect([screen.getByTestId('a').dataset.mode, screen.getByTestId('b').dataset.mode]).toEqual(['bancal', 'bancal']);
    expect(getVal(CONTRAST_KEY)).toBe('bancal');

    act(() => { window.dispatchEvent(new CustomEvent(ESDEVENIMENT_CONTRAST, { detail: { contrast: 'fosc' } })); });
    expect(screen.getByTestId('b').dataset.preferencia).toBe('bancal');

    act(() => { accions.b('normal'); });
    expect([screen.getByTestId('a').dataset.preferencia, screen.getByTestId('b').dataset.preferencia]).toEqual(['normal', 'normal']);
  });

  test('«Segons el sistema» triat en una instància seguix el dispositiu en les dues', () => {
    const sis = sistema();
    render(
      <>
        <UIProvider externalConfig={{}}><Sonda nom="a" /></UIProvider>
        <UIProvider externalConfig={{}}><Sonda nom="b" /></UIProvider>
      </>
    );
    act(() => { accions.a('sistema'); });
    expect(screen.getByTestId('b').dataset.mode).toBe('normal');
    act(() => { sis.canviaContrast(true); });
    expect([screen.getByTestId('a').dataset.mode, screen.getByTestId('b').dataset.mode]).toEqual(['bancal', 'bancal']);
  });
});
