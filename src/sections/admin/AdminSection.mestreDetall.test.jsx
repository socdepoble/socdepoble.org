/* MD (ordre del Mestre, 261003) · Admin en mòbil: patró mestre-detall.
   Revisió: el Tauler s'obri pel menú (la navegació del mòdul), «Panell
   General» porta als Indicadors i la fletxa blava torna al menú. Usuaris i
   Entitats no tenen filtres de navegació, així que la primera vista és la
   llista, i la seua fletxa ← torna al Tauler; el detall no és una Pàgina
   Universal (no porta barra blava) i la seua capçalera du la fletxa ←
   «Tornar a la llista» NOMÉS en estret. En ample, tot és el d'abans (Llei del
   Píxel). Els clics de les proves d'estret es fan amb getByRole, que no veu
   les capes amagades: tot el que es prem és a la vista. Dades sintètiques. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ usuaris: vi.fn(), entitats: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'admin',
  adminListUsers: (...args) => m.usuaris(...args),
  adminListOrganizations: (...args) => m.entitats(...args)
}));
/* Onada 11 (261010) · El Tauler llig la sessió (calSegonFactor): ací, aal2, el d'abans. */
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ esSuperadmin: true, nivell: 'aal2', calSegonFactor: false }) }));
/* La barra blava del doble: la fletxa crida l'onBack que rep (si en rep). */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, onBack }) => (
    <main>
      <button type="button" data-propi={onBack ? 'si' : 'no'} onClick={() => onBack?.()}>Tornar arrere</button>
      {children}
    </main>
  )
}));
import AdminSection from './AdminSection.jsx';

const USUARIS = [
  { id: 'u1', email: 'pep@exemple.test', created_at: '2026-01-01', last_sign_in_at: '2026-10-01' },
  { id: 'u2', email: 'maria@exemple.test', created_at: '2026-02-01', last_sign_in_at: '2026-10-02' }
];
const ENTITATS = [{ id: 'e1', name: 'Forn del Raval', slug: 'forn', created_at: '2026-03-01', description: 'Pa i coca' }];

let restaura = () => {};
function ambAmplada(amplada) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const observadorAbans = globalThis.ResizeObserver;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  restaura = () => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.ResizeObserver = observadorAbans;
  };
}

beforeEach(() => {
  m.usuaris.mockReset().mockResolvedValue(USUARIS);
  m.entitats.mockReset().mockResolvedValue(ENTITATS);
});
afterEach(() => {
  cleanup();
  restaura();
  restaura = () => {};
});

const panell = (c) => c.querySelector('.app-grid-shell').dataset.panell;
/* La fitxa per defecte diu el títol (el correu) i, darrere, el subtítol. */
const fitxa = (llista, correu) => within(llista).getByRole('button', { name: (nom) => nom.startsWith(correu) });
const obertes = (c) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => c.querySelector(id).getAttribute('aria-hidden') !== 'true');
const menu = (c) => within(c.querySelector('#app-grid-sidebar'));
/* Del Tauler a un gestor, amb el botó del menú a la vista (getByRole no
   troba res dins d'una capa amb aria-hidden). */
async function obri(nom) {
  const vista = render(<AdminSection />);
  const boto = menu(vista.container).getByRole('button', { name: nom });
  await act(async () => { fireEvent.click(boto); });
  return vista;
}
const obriUsuaris = () => obri('Usuaris');

test('MD · a 375 px: primer la llista d’usuaris; triar-ne un obri el detall, i la seua fletxa ← torna a la llista', async () => {
  ambAmplada(375);
  const { container } = await obriUsuaris();
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  const llista = container.querySelector('#app-grid-list');
  fireEvent.click(fitxa(llista, 'maria@exemple.test'));
  expect(panell(container)).toBe('');
  expect(obertes(container)).toEqual(['#app-grid-main']);
  const detall = container.querySelector('#app-grid-main');
  expect(within(detall).getByRole('heading', { level: 2 }).textContent).toBe('maria@exemple.test');
  fireEvent.click(within(detall).getByRole('button', { name: 'Tornar a la llista' }));
  expect(panell(container)).toBe('middle');
  expect(document.activeElement).toBe(fitxa(llista, 'maria@exemple.test'));
});

test('MD · a 1400 px la capçalera del detall és la d’abans: cap fletxa', async () => {
  ambAmplada(1400);
  const { container } = await obriUsuaris();
  expect(panell(container)).toBe('');
  const detall = container.querySelector('#app-grid-main');
  expect(within(detall).queryByRole('button', { name: 'Tornar a la llista' })).toBeNull();
  expect(detall.querySelector('.app-grid-col-header').firstElementChild.className).toBe('app-grid-col-header__plec app-grid-col-header__plec--fix');
  // Revisió · cap «Tornar al Tauler» a la llista fora d'estret.
  expect(within(container.querySelector('#app-grid-list')).queryByRole('button', { name: 'Tornar al Tauler' })).toBeNull();
});

test.each(['Usuaris', 'Entitats'])('MD · a 375 px el Tauler s’obri pel menú; %s amb clics a capes visibles, i la seua llista torna al Tauler', async (nom) => {
  ambAmplada(375);
  const { container } = await obri(nom);
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  const llista = container.querySelector('#app-grid-list');
  expect(within(llista).getAllByRole('listitem').length).toBeGreaterThan(0);
  fireEvent.click(within(llista).getByRole('button', { name: 'Tornar al Tauler' }));
  expect(panell(container)).toBe('left');
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);
  expect(menu(container).getByRole('button', { name: nom })).toBeTruthy();
});

test('MD · a 375 px «Panell General» porta als Indicadors, i la fletxa blava torna al menú (no a l’historial)', () => {
  ambAmplada(375);
  const { container } = render(<AdminSection />);
  expect(panell(container)).toBe('left');
  const blava = () => screen.getByRole('button', { name: 'Tornar arrere' });
  expect(blava().dataset.propi).toBe('no');
  fireEvent.click(menu(container).getByRole('button', { name: 'Panell General' }));
  expect(panell(container)).toBe('');
  expect(obertes(container)).toEqual(['#app-grid-main']);
  expect(blava().dataset.propi).toBe('si');
  fireEvent.click(blava());
  expect(panell(container)).toBe('left');
  expect(document.activeElement).toBe(menu(container).getByRole('button', { name: 'Panell General' }));
  expect(blava().dataset.propi).toBe('no');
});

test('MD · a 1400 px el Tauler és el d’abans: tres columnes, cap panell i la fletxa blava sense tornada pròpia', () => {
  ambAmplada(1400);
  const { container } = render(<AdminSection />);
  expect(panell(container)).toBe('');
  expect(obertes(container)).toEqual(['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']);
  fireEvent.click(menu(container).getByRole('button', { name: 'Panell General' }));
  expect(panell(container)).toBe('');
  expect(screen.getByRole('button', { name: 'Tornar arrere' }).dataset.propi).toBe('no');
});
