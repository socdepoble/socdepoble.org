/**
 * D6 · Mode Bancal (Q1 del Mestre, 261004) · On cau data-contrast="bancal".
 *
 * L'atribut va al MATEIX element que data-theme, que és el que tokens.css
 * llig (`:root[data-contrast="bancal"]`, `:host([data-contrast="bancal"])`):
 *  · socdepoble.org (l'app ama del document, com el #root de main.jsx, que
 *    declara manageDocumentHead: true): <html>;
 *  · incrustada (<soc-de-poble>, shadow root tancat): l'element amfitrió,
 *    i MAI l'<html> de la pàgina de l'amfitrió.
 * W4-12 (261004) · Sense la declaració, el document és d'un altre i l'atribut
 * va a l'arrel del mòdul: ho prova App.arrelContrast.test.jsx.
 * Incrustada, l'element el posa ja a connectedCallback, abans que React
 * pinte res (com el tema); després el manté App.jsx: la tria i els canvis de
 * `prefers-contrast: more` amb «Segons el sistema».
 * En mode normal l'atribut no hi és (Llei del Píxel).
 *
 * Shell real (App, proveïdors i element de veritat) amb un backend fals sense
 * xarxa, com App.test.jsx. L'emmagatzematge es toca només per storage.js.
 */
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import PedraSecaEmbed, { activeElements, defineCustomElement } from '../PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { CONSULTA_CONTRAST_SISTEMA, CONTRAST_KEY } from '../config/theme.js';
import { delVal, getVal, setVal } from '../config/storage.js';

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
  html.removeAttribute('data-contrast');
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
  if (Object.keys(anterior).length) setBackendImplementation(anterior);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  html.removeAttribute('data-contrast');
  if (temaHtmlAbans == null) html.removeAttribute('data-theme');
  else html.setAttribute('data-theme', temaHtmlAbans);
  if (contrastAbans == null) delVal(CONTRAST_KEY);
  else setVal(CONTRAST_KEY, contrastAbans);
});

/* ── socdepoble.org: l'app ama del document ──────────────────────────── */

/* La declaració de main.jsx (W4-12: sense ella, el document és d'un altre). */
const DEL_LLOC = Object.freeze({ routerType: 'memory', manageDocumentHead: true });

test('al document, «Bancal» posa data-contrast="bancal" a <html>, el mateix element que data-theme', async () => {
  sistema();
  setVal(CONTRAST_KEY, 'bancal');
  render(<PedraSecaEmbed config={DEL_LLOC} />);
  await screen.findByRole('main');
  expect(html.getAttribute('data-contrast')).toBe('bancal');
  expect(html.getAttribute('data-theme')).toBe('light');
  /* Ni el body ni l'arrel de l'app el porten: només <html>. */
  expect(document.body.hasAttribute('data-contrast')).toBe(false);
  expect(document.querySelector('.sdp-root[data-contrast]')).toBeNull();
});

test('al document, «Normal» (per defecte) no posa cap atribut: la pantalla de sempre', async () => {
  sistema({ contrastMes: true });
  render(<PedraSecaEmbed config={DEL_LLOC} />);
  await screen.findByRole('main');
  expect(html.hasAttribute('data-contrast')).toBe(false);
});

test('al document, «Segons el sistema» seguix prefers-contrast: more amb la pàgina oberta', async () => {
  const sis = sistema();
  setVal(CONTRAST_KEY, 'sistema');
  render(<PedraSecaEmbed config={DEL_LLOC} />);
  await screen.findByRole('main');
  expect(html.hasAttribute('data-contrast')).toBe(false);
  act(() => { sis.canviaContrast(true); });
  expect(html.getAttribute('data-contrast')).toBe('bancal');
  act(() => { sis.canviaContrast(false); });
  expect(html.hasAttribute('data-contrast')).toBe(false);
});

/* ── Incrustada: <soc-de-poble> amb shadow root tancat ───────────────── */

async function muntaElement() {
  const element = document.createElement('soc-de-poble');
  element.setAttribute('plugin-url', '/');
  /* Sense act: connectedCallback corre ara i React encara no ha pintat. */
  document.body.appendChild(element);
  return element;
}
const mainDe = (element) => element._closedRoot?.querySelector('main') ?? null;

test('incrustada, l’element ja porta data-contrast="bancal" abans que React pinte, i <html> no el porta mai', async () => {
  sistema();
  setVal(CONTRAST_KEY, 'bancal');
  const element = await muntaElement();
  expect(mainDe(element)).toBeNull();
  expect(element.getAttribute('data-contrast')).toBe('bancal');
  expect(element.getAttribute('data-theme')).toBe('light');

  await act(async () => {});
  await waitFor(() => expect(mainDe(element)).not.toBeNull());
  /* Ja amb l'App pintada (App.jsx l'ha tornat a aplicar): al host, no a l'<html>. */
  expect(element.getAttribute('data-contrast')).toBe('bancal');
  expect(html.hasAttribute('data-contrast')).toBe(false);
  expect(element._closedRoot.querySelector('[data-contrast]')).toBeNull();
});

test('incrustada, «Segons el sistema» canvia l’atribut de l’element quan el dispositiu canvia', async () => {
  const sis = sistema({ contrastMes: true });
  setVal(CONTRAST_KEY, 'sistema');
  const element = await muntaElement();
  expect(element.getAttribute('data-contrast')).toBe('bancal');
  await act(async () => {});
  await waitFor(() => expect(mainDe(element)).not.toBeNull());
  act(() => { sis.canviaContrast(false); });
  expect(element.hasAttribute('data-contrast')).toBe(false);
  act(() => { sis.canviaContrast(true); });
  expect(element.getAttribute('data-contrast')).toBe('bancal');
  expect(html.hasAttribute('data-contrast')).toBe(false);
});

test('incrustada en mode normal, l’element no porta cap atribut de contrast', async () => {
  sistema();
  const element = await muntaElement();
  expect(element.hasAttribute('data-contrast')).toBe(false);
  await act(async () => {});
  await waitFor(() => expect(mainDe(element)).not.toBeNull());
  expect(element.hasAttribute('data-contrast')).toBe(false);
  expect(html.hasAttribute('data-contrast')).toBe(false);
});
