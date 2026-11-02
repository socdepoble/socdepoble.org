/**
 * PS-10 (marató 261101_2143, B7f; default D-3 del Mestre) · El Mur en mòbil.
 * MurSection posa la classe `sdp-pagina-mur` a la pàgina (UniversalPage →
 * PageFrame → .sdp-universal-page-container) en els tres estats: dades,
 * càrrega i error. Les regles de modules.css (les píndoles del Mur en una
 * fila que llisca i l'entradeta fora, amb la pàgina a 480px o menys) es
 * lligen del full i es proven contra el DOM de veres del Mur: casen amb el
 * grup «Filtres del mur», les seues cinc opcions i l'entradeta, i amb res
 * més (ni el selector de vistes del calendari de la pestanya Calendari).
 * La cascada (capes, @container, xarxa sense contenidors) la prova
 * src/css/ritmeEntreBlocs.capes.test.js; la mesura amb Chrome, el registre
 * del carril M22-B7f-MUR.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), setSearchParams: vi.fn(), params: new URLSearchParams(),
  t: (_, alternativa) => alternativa, core: {}, mur: {}
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params, mocks.setSearchParams],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('./MapaFotografic.jsx', () => ({ default: () => null }));
import MurSection from './MurSection.jsx';

const ENTRADETA = 'Explora el mur públic a través de les diferents vistes: llista, calendari i mapa.';
const FILTRES = ['Mostrar tot', 'Sóc de Poble', 'Mercat', 'Calendari', 'Mapa'];

/* Els selectors de PS-10, del full de veres: els de les regles que penjen de
   .sdp-pagina-mur (el bloc @container i la seua xarxa, els mateixos). */
const MODULES = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const SELECTORS_MUR = [...new Set([...MODULES.matchAll(/(\.sdp-pagina-mur\s[^{};]+?)\s*\{/g)].map((m) => m[1].replace(/\s+/g, ' ').trim()))];

const contenidor = () => document.querySelector('.sdp-universal-page-container');
const grupFiltres = () => screen.getByRole('group', { name: 'Filtres del mur' });
const entradeta = () => [...document.querySelectorAll('.page-intro .lead')].find((p) => p.textContent === ENTRADETA);
const casats = () => SELECTORS_MUR.map((s) => [...document.querySelectorAll(s)]);

let avis;
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  avis.mockRestore();
});
beforeEach(() => {
  vi.clearAllMocks();
  // Sense PAGE_COPY, el Mur avisa en desenvolupament de cada pàgina de sistema: no és d'esta prova.
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 30, 12, 0));
  mocks.params = new URLSearchParams();
  mocks.core = { status: 'ready', error: null, pageCopy: {}, towns: [] };
  mocks.mur = {
    status: 'ready', error: null, sortedMarketItems: [],
    sortedEvents: [{ id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-11-14', author_name: 'Sóc de Poble' }],
    sortedFeedPosts: [{ id: 'p', type: 'feed', title: 'Crònica', created_at: '2026-09-01T10:00:00.000Z' }]
  };
});

test('amb dades, la pàgina del Mur porta sdp-pagina-mur al contenidor, al costat de la columna «contained»', () => {
  render(<MurSection />);
  expect(document.querySelectorAll('.sdp-universal-page-container').length).toBe(1);
  expect(contenidor().classList.contains('sdp-pagina-mur')).toBe(true);
  expect(contenidor().classList.contains('sdp-universal-page-container--contained')).toBe(true);
  // L'entradeta continua al DOM: la regla de mòbil la deixa de pintar, no la lleva.
  expect(entradeta()).toBeTruthy();
});

test('mentre carrega i quan falla, també: la capçalera no salta en arribar les dades', () => {
  mocks.mur = { status: 'loading' };
  const { unmount } = render(<MurSection />);
  expect(contenidor().classList.contains('sdp-pagina-mur')).toBe(true);
  expect(screen.getByText('Carregant contingut...')).toBeTruthy();
  unmount();

  mocks.mur = { status: 'error', error: new Error('caigut'), refresh: vi.fn() };
  render(<MurSection />);
  expect(contenidor().classList.contains('sdp-pagina-mur')).toBe(true);
  expect(screen.getByText("No s'ha pogut carregar el Mur")).toBeTruthy();
});

test('els selectors de PS-10 del full casen amb els filtres del Mur, les seues cinc opcions i l’entradeta, i amb res més', () => {
  expect(SELECTORS_MUR.length).toBe(3);
  render(<MurSection />);
  const grup = grupFiltres();
  const opcions = within(grup).getAllByRole('button');
  expect(opcions.map((b) => b.textContent)).toEqual(FILTRES);
  const llistes = casats();
  expect(llistes.map((l) => l.length).sort((a, b) => a - b)).toEqual([1, 1, 5]);
  expect(new Set(llistes.flat())).toEqual(new Set([grup, ...opcions, entradeta()]));
});

test('a la pestanya Calendari, el selector de vistes del calendari no hi entra; els filtres del Mur, sí', () => {
  render(<MurSection />);
  act(() => within(grupFiltres()).getByRole('button', { name: 'Calendari' }).click());
  const vistes = screen.getByRole('group', { name: 'Vista' });
  expect(vistes.classList.contains('sdp-pindola')).toBe(true);
  const tots = new Set(casats().flat());
  expect(tots.has(vistes)).toBe(false);
  expect([...vistes.querySelectorAll('button')].some((b) => tots.has(b))).toBe(false);
  expect(tots.has(grupFiltres())).toBe(true);
});

/* PS-06, correcció ARB-B7f-01 (261102) · Sense el marge de l'última fila, el
   coixí de baix de la graella separa les targetes del Mur del «Mostra més» (32,
   el píxel de sempre). Els selectors, del full; la cascada, ritmeEntreBlocs. */
test('la graella de veres del Mur, amb targetes, porta el coixí de baix; cap excepció del coixí hi casa', () => {
  const coixi = /\n {2}(\.sdp-card-grid:not\(:empty\)) \{\s*padding-block-end: var\(--sdp-space-8\);\s*\}/.exec(MODULES)?.[1];
  const excepcions = /\n {2}(\[data-sdp-app="nevera"\] \.sdp-card-grid,\s*\.devices-panel__body > \.sdp-card-grid) \{\s*padding-block-end: 0;\s*\}/.exec(MODULES)?.[1];
  expect(coixi).toBeTruthy();
  expect(excepcions).toBeTruthy();
  render(<MurSection />);
  const graella = document.querySelector('.sdp-pagina-mur .content-wrapper > .sdp-card-grid');
  expect(graella.querySelectorAll(':scope > article.sp-card').length).toBeGreaterThan(0);
  expect(graella.matches(coixi)).toBe(true);
  expect(graella.matches(excepcions)).toBe(false);
});

test('la prova mossega: sense la classe al contenidor, cap selector de PS-10 casa', () => {
  render(<MurSection />);
  contenidor().classList.remove('sdp-pagina-mur');
  expect(casats().flat()).toEqual([]);
});
