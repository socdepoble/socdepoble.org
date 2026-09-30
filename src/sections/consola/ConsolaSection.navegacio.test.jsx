import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* Navegació real de la Consola: el router de l'aplicació (RouterContext), la
   UniversalPage i les targetes de veres. Només es falsegen les fonts de dades
   i el que no té res a vore amb navegar (SEO, avisos, llenç del graf). */
const fonts = vi.hoisted(() => ({ mapa: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'ready', mapa: fonts.mapa, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve({
    generat: '2026-09-25T13:00:00.000Z', rebuts: [], consums: [{ agent: 'claude', entrada: 1, eixida: 1 }], credits: null,
    skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
    segell: null, immunitari: { operacions: 0 }
  })
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { paginesConsola } from './consolaPagines.js';

const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} }
  ],
  arestes: [],
  tasques: [{ id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: null, font: null }],
  avisos: [],
  salut: []
};

let errors;
beforeEach(() => {
  fonts.mapa = MAPA;
  window.history.replaceState(null, '', '/consola');
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  localStorage.clear();
});

function Aplicacio() {
  return (
    <RouterProvider>
      <Routes>
        <Route path="/consola/*" element={<ConsolaSection />} />
      </Routes>
    </RouterProvider>
  );
}

/** Un contenidor de scroll com el de l'aplicació (.app-main__content), amb posició manual: jsdom no en té. */
function contenidorDesplacat(inici = 0) {
  const div = document.createElement('div');
  let posicio = inici;
  Object.defineProperty(div, 'scrollTop', { configurable: true, get: () => posicio, set: (v) => { posicio = v; } });
  document.body.appendChild(div);
  return div;
}

const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const tauler = () => screen.getByRole('navigation', { name: 'Pàgines de la Consola' });

test('cada targeta del tauler obri la seua pàgina i la molla de pa torna al tauler', async () => {
  render(<Aplicacio />);
  await screen.findByText(/registres de consum/);

  for (const p of paginesConsola()) {
    fireEvent.click(within(tauler()).getByRole('link', { name: p.title }));
    expect(window.location.pathname).toBe(p.ruta);
    expect(h1()).toBe(p.title);
    expect(screen.getByRole('navigation', { name: 'Molla de pa' })).toBeTruthy();

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' }));
    expect(window.location.pathname).toBe('/consola');
    expect(h1()).toBe('Consola Termodinàmica');
  }
  expect(errors).not.toHaveBeenCalled();
});

/* T11 (ordre del Mestre, 260930) · a cada pàgina s'entra per la seua
   targeta del tauler i se'n torna per la molla de pa. Les xifres del Mas i
   les peces d'Agents atòmics són dades: clicar-les no porta enlloc. */
test('les xifres del Mas i les peces dels agents ja no naveguen: són dades', async () => {
  render(<Aplicacio />);
  await screen.findByText(/registres de consum/);

  const xifres = screen.getByRole('region', { name: 'El Mas en xifres' });
  expect(within(xifres).queryAllByRole('link')).toEqual([]);
  fireEvent.click(within(xifres).getByText('1 skill opaca'));
  expect(window.location.pathname).toBe('/consola');
  expect(h1()).toBe('Consola Termodinàmica');

  window.history.replaceState(null, '', '/consola/agents');
  act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(h1()).toBe('Agents atòmics');
  const peces = screen.getByRole('heading', { level: 3, name: 'Les quatre peces que ho fan possible' }).closest('section');
  expect(within(peces).queryAllByRole('link')).toEqual([]);
  for (const nom of ['Fluxos de treball', 'Tauler', 'Agents que treballen sols', 'Qui avisa quan algo es trenca']) {
    fireEvent.click(within(peces).getByRole('heading', { level: 3, name: nom }));
    expect(window.location.pathname, nom).toBe('/consola/agents');
  }
  expect(h1()).toBe('Agents atòmics');
  expect(errors).not.toHaveBeenCalled();
});

test('a /consola, cada pàgina té exactament una porta; a cada pàgina, l’única cap a la Consola és la molla', async () => {
  render(<Aplicacio />);
  await screen.findByText(/registres de consum/);
  const cap = (prefix) => [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'))
    .filter((h) => h === prefix || h.startsWith(`${prefix}/`));
  const recompte = cap('/consola').reduce((acc, h) => ({ ...acc, [h]: (acc[h] || 0) + 1 }), {});
  expect(recompte).toEqual(Object.fromEntries(paginesConsola().map((p) => [p.ruta, 1])));

  for (const p of paginesConsola()) {
    fireEvent.click(within(tauler()).getByRole('link', { name: p.title }));
    expect(h1()).toBe(p.title);
    expect(cap('/consola'), p.id).toEqual(['/consola']);
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' }));
  }
  expect(errors).not.toHaveBeenCalled();
});

/* T2 (ordre del Mestre, 260930) · l'Índex de la Consola arriba a h6: les
   mètriques de les targetes (h5) hi entren, sagnades davall del seu títol. */
test('l’Índex de secció de la Consola recull les mètriques en h5', async () => {
  render(<Aplicacio />);
  await screen.findByText(/registres de consum/);
  fireEvent.click(screen.getByRole('button', { name: 'Índex de secció' }));
  const index = screen.getByRole('dialog', { name: 'Taula de continguts' });
  const entrades = [...index.querySelectorAll('li')].map((li) => [li.className, li.textContent]);
  const titol = entrades.findIndex(([, text]) => text === 'El pols del cervell');
  expect(entrades[titol][0]).toBe('toc-item toc-level-3');
  expect(entrades.slice(titol + 2, titol + 5)).toEqual([
    ['toc-item toc-level-5', '1 registres de consum'],
    ['toc-item toc-level-5', '0 rebuts'],
    ['toc-item toc-level-5', '1 skills (0 orfes)']
  ]);
  // Totes les mètriques del tauler: 3 del pols i 17 de les huit targetes del Mapa.
  expect(entrades.filter(([classe]) => classe === 'toc-item toc-level-5')).toHaveLength(20);
  expect(errors).not.toHaveBeenCalled();
});

test('arrere i avant del navegador tornen a la pàgina i al tauler', async () => {
  render(<Aplicacio />);
  await screen.findByText(/registres de consum/);
  fireEvent.click(within(tauler()).getByRole('link', { name: 'Calendari de processos' }));
  expect(h1()).toBe('Calendari de processos');

  act(() => { window.history.back(); });
  await waitFor(() => expect(window.location.pathname).toBe('/consola'));
  await waitFor(() => expect(h1()).toBe('Consola Termodinàmica'));

  act(() => { window.history.forward(); });
  await waitFor(() => expect(window.location.pathname).toBe('/consola/calendari'));
  await waitFor(() => expect(h1()).toBe('Calendari de processos'));
  expect(errors).not.toHaveBeenCalled();
});

test('canviar de pàgina torna al cim del contenidor de scroll', async () => {
  const contenidor = contenidorDesplacat(0);
  render(<Aplicacio />, { container: contenidor });
  await screen.findByText(/registres de consum/);

  contenidor.scrollTop = 900;                       // el Mestre ha baixat fins al peu del tauler
  fireEvent.click(within(tauler()).getByRole('link', { name: 'Actors del Mas' }));
  expect(h1()).toBe('Actors del Mas');
  expect(contenidor.scrollTop).toBe(0);

  contenidor.scrollTop = 450;
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Molla de pa' })).getByRole('link', { name: 'Consola Termodinàmica' }));
  expect(contenidor.scrollTop).toBe(0);
  contenidor.remove();
});

test('/consola/pols: targetes i desplegables no toquen la ruta', async () => {
  window.history.replaceState(null, '', '/consola/pols');
  render(<Aplicacio />);
  await screen.findByText('1 registres');

  for (const nom of ['Consums', 'Crèdits', 'Rebuts', 'Skills']) {
    const boto = screen.getByRole('button', { name: nom });
    fireEvent.click(boto);
    const detall = document.getElementById(boto.getAttribute('aria-controls'));
    expect(detall.open).toBe(true);
    expect(boto.getAttribute('aria-expanded')).toBe('true');
  }
  for (const resum of document.querySelectorAll('summary')) fireEvent.click(resum);
  expect(window.location.pathname).toBe('/consola/pols');
  expect(window.location.hash).toBe('');
  expect(errors).not.toHaveBeenCalled();
});

test('una subruta desconeguda torna al tauler sense deixar-la a l’historial', async () => {
  window.history.replaceState(null, '', '/consola/pestanyes');
  const abans = window.history.length;
  render(<Aplicacio />);
  await screen.findByText(/registres de consum/);
  expect(window.location.pathname).toBe('/consola');
  expect(window.history.length).toBe(abans);
});
