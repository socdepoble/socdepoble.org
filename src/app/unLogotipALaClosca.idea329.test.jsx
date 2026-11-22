/* IDEA-329 i IDEA-330 (ajust en calent del Mestre, 22-11-2026, 22:40 i 22:48; captures
   01_produccio/261122_2240_* i 261122_2248_*) · Invariant permanent de la closca.

   1. A totes les amplàries, amb la barra lateral tancada i desplegada, entre header.bar-black i
      nav.app-sidebar hi ha EXACTAMENT un logotip de Sóc de Poble visible: mai cap, mai dos.
      En compacte (≤ 1023 px) és el de la barra negra (.mobile-logo-wrapper) i el calaix no en
      porta cap (SidebarContent i BarraApp no pinten .brand); en pantalla gran és la marca de la
      barra lateral (.brand), desplegada o plegada al rail, i el de la barra negra s'amaga.
   2. En compacte no hi ha rail de 56 px: el calaix no porta el botó de plegar ([<|]) i CONTROL
      el tanca abans de navegar a /control, com la resta d'entrades. En pantalla gran el botó de
      plegar es queda.

   jsdom no aplica els fulls de src/css: la visibilitat la decidix el contracte de layout.css que
   el primer bloc d'esta prova llig del full (si algú el canvia, la prova cau). La geometria real,
   a 320, 360, 390, 414, 768 i 1440 px, la comprova la sonda CDP de la release. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';
import { APPS_INTERNES } from '../apps/plataforma/registreApps.js';

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const AMPLARIES = [320, 360, 390, 414, 768, 1440];
const LOGOTIP = 'img[src*="logo-socdepoble-rect"]';
const APP = APPS_INTERNES.find((app) => app.dadesPersonals !== 'salut' && app.capacitats.length === 0 && typeof app.carrega === 'function');

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const LAYOUT = senseComentaris(readFileSync(resolve(process.cwd(), 'src/css/layout.css'), 'utf8'));
/* Les regles (selector i cos) d'un full, aplanades: els @container, @media i @layer només
   n'agrupen, i el selector és el que decidix a qui toca. */
const regles = (css) => [...css.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)]
  .map(([, selector, cos]) => ({ selector: selector.trim().replace(/\s+/g, ' '), cos }));
const displayDe = (cos) => /(?:^|;)\s*display\s*:\s*([^;!]+)/.exec(cos)?.[1].trim() ?? null;

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('el contracte de layout.css que decidix quin logotip es veu', () => {
  const LAYOUT_REGLES = regles(LAYOUT);
  const display = (selector) => LAYOUT_REGLES.filter((r) => r.selector === selector).map((r) => displayDe(r.cos)).filter(Boolean);

  test('el logotip de la barra negra només es veu en compacte', () => {
    expect(display('.mobile-logo-wrapper')).toEqual(['none']);
    expect(display(':where(.sdp-root.is-compact) .mobile-logo-wrapper')).toEqual(['flex']);
    // Cap altra regla no el torna a mostrar fora del compacte.
    const mostren = LAYOUT_REGLES.filter((r) => r.selector.split(',').some((s) => /\.mobile-logo-wrapper$/.test(s.trim())))
      .filter((r) => (displayDe(r.cos) ?? 'none') !== 'none');
    for (const r of mostren) expect(r.selector, r.selector).toContain('.is-compact');
  });

  test('IDEA-329 · la marca del calaix compacte s’amaga, i res no amaga la de pantalla gran', () => {
    expect(display(':where(.sdp-root.is-compact) .sdp-dialeg-sidebar .brand')).toEqual(['none']);
    const amaguen = LAYOUT_REGLES.filter((r) => r.selector.split(',').some((s) => /\.brand$/.test(s.trim())) && displayDe(r.cos) === 'none');
    for (const r of amaguen) expect(r.selector, r.selector).toContain('.is-compact');
  });
});

/* La visibilitat segons el contracte de dalt: un <dialog> tancat no pinta res, el logotip de la
   barra negra només en compacte, i la marca de la barra lateral fora del calaix compacte. */
function visible(img) {
  const compacte = img.closest('.sdp-root')?.classList.contains('is-compact') === true;
  const dialeg = img.closest('dialog');
  if (dialeg && !dialeg.hasAttribute('open')) return false;
  if (img.closest('.mobile-logo-wrapper')) return compacte;
  if (img.closest('.brand')) return !(compacte && img.closest('.sdp-dialeg-sidebar'));
  return true;
}
const logotipsVisibles = () => [...document.querySelectorAll(`header.bar-black ${LOGOTIP}, nav.app-sidebar ${LOGOTIP}`)].filter(visible);

async function munta(ruta, ample, cos) {
  vi.stubGlobal('innerWidth', ample);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => { throw new Error('Xarxa inesperada: ' + url); }));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((name) => [name, async () => null])),
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
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

/* Tancat, el <dialog> és inaccessible (display: none de jsdom) i getByRole no el troba: la nav
   es busca pel seu id, que és el que apunten aria-controls de la barra negra i del calaix. */
const nav = () => document.getElementById('app-sidebar');
const rutes = () => [['/mur', 'Panell de control'], [`/app/${APP.id}/${APP.entradaPerDefecte}`, 'Torna a Sóc de Poble']];

describe('IDEA-329 · un sol logotip visible a la closca, tancada i desplegada', () => {
  test('hi ha una app interna per a provar la barra de les apps', () => {
    expect(APP).toBeTruthy();
  });

  test.each(AMPLARIES.filter((w) => w <= 1023))('%i px (compacte): un logotip, el de la barra negra; el calaix comença per la fila de control', async (ample) => {
    for (const [ruta, filaControl] of rutes()) {
      await munta(ruta, ample, async () => {
        await waitFor(() => expect(document.querySelector('.sdp-root.is-compact nav#app-sidebar')).toBeTruthy());
        // Tancada.
        expect(document.querySelector('dialog.sdp-dialeg-sidebar').hasAttribute('open'), ruta).toBe(false);
        expect(logotipsVisibles(), `${ruta} · tancada`).toHaveLength(1);
        expect(logotipsVisibles()[0].closest('.mobile-logo-wrapper'), ruta).toBeTruthy();
        // Desplegada.
        fireEvent.click(screen.getByRole('button', { name: 'Obrir menú' }));
        await waitFor(() => expect(document.querySelector('dialog.sdp-dialeg-sidebar').hasAttribute('open')).toBe(true));
        expect(logotipsVisibles(), `${ruta} · desplegada`).toHaveLength(1);
        expect(logotipsVisibles()[0].closest('header.bar-black'), ruta).toBeTruthy();
        expect(nav().querySelector('.brand'), ruta).toBeNull();
        expect(nav().querySelector(LOGOTIP), ruta).toBeNull();
        expect(nav().firstElementChild.classList.contains('sidebar-control-row'), ruta).toBe(true);
        expect(within(nav()).getByRole('button', { name: filaControl }), ruta).toBeTruthy();
        // IDEA-330 · cap botó de plegar en compacte.
        expect(nav().querySelector('.sidebar-rail-toggle'), ruta).toBeNull();
      });
    }
  }, 60000);

  test('1440 px (pantalla gran): un logotip, la marca de la barra, desplegada i plegada al rail', async () => {
    for (const [ruta] of rutes()) {
      await munta(ruta, 1440, async () => {
        const barra = await screen.findByRole('navigation', { name: 'Navegació principal' });
        expect(document.querySelector('.sdp-root.is-compact')).toBeNull();
        expect(barra.closest('dialog')).toBeNull();
        expect(logotipsVisibles(), `${ruta} · desplegada`).toHaveLength(1);
        expect(logotipsVisibles()[0].closest('nav.app-sidebar .brand'), ruta).toBeTruthy();
        // IDEA-330 · en pantalla gran el botó de plegar es queda i plega al rail.
        fireEvent.click(within(barra).getByRole('button', { name: 'Plegar barra lateral' }));
        await waitFor(() => expect(document.querySelector('.sdp-root.sidebar-closed')).toBeTruthy());
        expect(logotipsVisibles(), `${ruta} · plegada`).toHaveLength(1);
        expect(logotipsVisibles()[0].closest('nav.app-sidebar .brand'), ruta).toBeTruthy();
        fireEvent.click(within(barra).getByRole('button', { name: 'Desplegar barra lateral' }));
        await waitFor(() => expect(document.querySelector('.sdp-root.sidebar-closed')).toBeNull());
      });
    }
  }, 60000);
});

describe('IDEA-330 · en compacte, CONTROL tanca el calaix', () => {
  test('360 px: CONTROL tanca el calaix i porta a /control', async () => {
    await munta('/mur', 360, async () => {
      await waitFor(() => expect(document.querySelector('.sdp-root.is-compact nav#app-sidebar')).toBeTruthy());
      fireEvent.click(screen.getByRole('button', { name: 'Obrir menú' }));
      await waitFor(() => expect(document.querySelector('dialog.sdp-dialeg-sidebar').hasAttribute('open')).toBe(true));
      fireEvent.click(within(nav()).getByRole('button', { name: 'Panell de control' }));
      await waitFor(() => expect(document.querySelector('dialog.sdp-dialeg-sidebar').hasAttribute('open')).toBe(false));
      await waitFor(() => expect(window.location.pathname).toBe('/control'));
    });
  }, 30000);
});
