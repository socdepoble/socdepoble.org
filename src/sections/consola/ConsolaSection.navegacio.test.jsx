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

test('les xifres del Mas i les peces dels agents també naveguen dins de la Consola', async () => {
  render(<Aplicacio />);
  await screen.findByText(/registres de consum/);

  const xifres = screen.getByRole('region', { name: 'El Mas en xifres' });
  fireEvent.click(within(xifres).getByRole('link', { name: '1 skill opaca' }));
  expect(window.location.pathname).toBe('/consola/entrades');
  expect(h1()).toBe('Entrades i eixides');

  window.history.replaceState(null, '', '/consola/agents');
  act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(h1()).toBe('Agents atòmics');
  fireEvent.click(screen.getByRole('link', { name: 'Fluxos de treball' }));
  expect(window.location.pathname).toBe('/consola/fluxos');
  expect(h1()).toBe('Fluxos de treball');
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

  contenidor.scrollTop = 900;                       // el Mestre ha baixat fins a les xifres
  fireEvent.click(within(screen.getByRole('region', { name: 'El Mas en xifres' })).getByRole('link', { name: '1 agent' }));
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
