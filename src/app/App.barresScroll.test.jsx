import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import PedraSecaEmbed from '../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../data/backendPort.js';
import { getSessionState } from '../data/sessionService.js';

/* Ordre del Mestre (261012, vespre) · Sobre la closca de veres (AppShell):
   en compacte les barres acompanyen el scroll i, quan tornen amb el visor
   avall, el botó «Tornar a dalt» apareix damunt de «Pobles»; en escriptori,
   res (Llei del Píxel). jsdom no maqueta: l'amplada de l'arrel, la geometria
   del visor i els tokens es posen a mà, i requestAnimationFrame és síncron. */

vi.mock('../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const vista = document.defaultView;
let rafOriginal;
beforeEach(() => {
  rafOriginal = vista.requestAnimationFrame;
  vista.requestAnimationFrame = (fn) => { fn(0); return 1; };
});
afterEach(() => {
  cleanup();
  vista.requestAnimationFrame = rafOriginal;
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* L'amplada de la caixa de l'app decidix el compacte (App.jsx, ≤1023). */
async function munta(ample, cos) {
  vi.stubGlobal('innerWidth', ample);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const fons = this.classList.contains('app-main__content') || this.classList.contains('sdp-root') ? 812 : 400;
    return { width: ample, height: 812, top: 0, left: 0, bottom: fons, right: ample, x: 0, y: 0 };
  });
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => { throw new Error(`Xarxa inesperada: ${url}`); }));
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
  window.history.replaceState(null, '', '/legal');
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await screen.findByRole('main');
    const main = document.getElementById('main-content');
    const arrel = main.parentElement;
    const visor = main.querySelector('.app-main__content');
    arrel.style.setProperty('--sdp-space-6', '24px');
    arrel.style.setProperty('--sdp-alt-accio', '58px');
    for (const [element, alcada, recorregut] of [[main, 748, 748], [visor, 748, 6000]]) {
      Object.defineProperty(element, 'clientHeight', { configurable: true, value: alcada });
      Object.defineProperty(element, 'scrollHeight', { configurable: true, value: recorregut });
      Object.defineProperty(element, 'scrollTop', { configurable: true, writable: true, value: 0 });
    }
    await cos({ arrel, main, visor });
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

const desplaca = (element, y) => act(() => {
  element.scrollTop = y;
  element.dispatchEvent(new Event('scroll'));
});
const recorre = (element, posicions) => posicions.forEach((y) => desplaca(element, y));
const BAIXA = [40, 80, 120, 200, 600, 1200];

test('escriptori (1440): el scroll del visor no posa cap atribut ni pinta cap botó (Llei del Píxel)', async () => {
  await munta(1440, async ({ arrel, visor }) => {
    expect(arrel.classList.contains('is-compact')).toBe(false);
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1170, 1150]);
    expect(arrel.hasAttribute('data-sdp-barres')).toBe(false);
    expect(arrel.querySelector('.sdp-tornar-dalt')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tornar a dalt' })).toBeNull();
  });
});

test('compacte (375): en repòs, cap atribut ni botó, i la barra mòbil continua sent l’últim fill (T3)', async () => {
  await munta(375, async ({ arrel }) => {
    expect(arrel.classList.contains('is-compact')).toBe(true);
    expect(arrel.hasAttribute('data-sdp-barres')).toBe(false);
    expect(arrel.querySelector('.sdp-tornar-dalt')).toBeNull();
    const nav = arrel.querySelector(':scope > nav.mobile-nav');
    expect(nav.nextSibling).toBeNull();
    expect(nav.previousSibling).toBe(document.getElementById('main-content'));
  });
});

test('compacte: baixant s’amaguen totes; pujant tornen i, més d’una pantalla avall, apareix «Tornar a dalt» damunt de la barra', async () => {
  await munta(375, async ({ arrel, visor }) => {
    recorre(visor, BAIXA);
    expect(arrel.getAttribute('data-sdp-barres')).toBe('totes');
    expect(arrel.querySelector('.sdp-tornar-dalt')).toBeNull();
    recorre(visor, [1190, 1170]);
    expect(arrel.hasAttribute('data-sdp-barres')).toBe(false);
    const boto = screen.getByRole('button', { name: 'Tornar a dalt' });
    expect(boto.classList.contains('sdp-tornar-dalt')).toBe(true);
    // Germà de la barra mòbil, darrere d'ella: fora del contingut (el gest de recarregar el desplaça).
    expect(arrel.querySelector(':scope > nav.mobile-nav').nextSibling).toBe(boto);
    // Per davall d'una pantalla se'n va.
    recorre(visor, [700, 600]);
    expect(screen.queryByRole('button', { name: 'Tornar a dalt' })).toBeNull();
  });
});

/* Revisió adversarial 261012 · Un peu ancorat a baix (ací, el compositor del
   Xat) reserva l'alçada de la barra inferior: la barra es queda i el botó no
   hi cau damunt. El node s'afig a mà al <main> de la closca de veres. */
test('compacte amb un peu ancorat al <main>: la barra inferior es queda («dalt») i «Tornar a dalt» no apareix', async () => {
  await munta(375, async ({ arrel, main, visor }) => {
    const peu = document.createElement('form');
    peu.className = 'sdp-xat-compositor';
    main.appendChild(peu);
    try {
      recorre(visor, BAIXA);
      expect(arrel.getAttribute('data-sdp-barres')).toBe('dalt');
      recorre(visor, [1190, 1170]);
      expect(arrel.hasAttribute('data-sdp-barres')).toBe(false);
      expect(screen.queryByRole('button', { name: 'Tornar a dalt' })).toBeNull();
    } finally {
      peu.remove();
    }
  });
});

test('compacte: el clic porta el visor a dalt amb moviment suau i el focus al <main>', async () => {
  await munta(375, async ({ main, visor }) => {
    visor.scrollTo = vi.fn();
    recorre(visor, BAIXA);
    recorre(visor, [1190, 1170]);
    fireEvent.click(screen.getByRole('button', { name: 'Tornar a dalt' }));
    expect(visor.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(document.activeElement).toBe(main);
  });
});
