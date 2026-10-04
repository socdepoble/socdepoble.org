/* Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
   /__iaia/consola.json i /__iaia/mapa.json només els servix el middleware de
   desenvolupament (tooling/vite/consola-iaia.mjs, apply: 'serve'). Fora de
   DEV (el paquet públic, WordPress, Sollutia) la Consola incrustada a la Wiki
   pública, la secció i els seus hooks (useConsola, useMapa) no fan cap
   petició: l'estat és 'absent' des del principi i Refrescar no demana res.
   Ací els hooks i els carregadors són els de veres (ConsolaSection.test.jsx
   els substituïx); només es dobla fetch. */
import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ '*': 'explorador' }),
  useNavigate: () => vi.fn(),
  Navigate: ({ to }) => <p data-testid="redirigix">{to}</p>,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><h1>{title}</h1>{children}</main>
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));

import ConsolaSection, { ConsolaIncrustada } from './ConsolaSection.jsx';
import { useMapa } from './mapa/useMapa.js';
import { carregaMapa } from './mapa/mapaContent.js';
import { carregaConsola } from './consolaContent.js';

/* Un servidor sense middleware: /__iaia/* és 404 (com App.test.jsx). */
const ambFetch = () => {
  const peticio = vi.fn(async () => ({ status: 404, ok: false, statusText: 'Not Found', headers: { get: () => '' } }));
  vi.stubGlobal('fetch', peticio);
  return peticio;
};
const demanatsIaia = (peticio) => peticio.mock.calls.map(([url]) => String(url)).filter((url) => url.startsWith('/__iaia/'));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('fora de DEV, cap petició a /__iaia/*', () => {
  test('la Consola incrustada (Wiki pública) no fa cap petició i el tauler es pinta', async () => {
    vi.stubEnv('DEV', false);
    const peticio = ambFetch();
    render(<ConsolaIncrustada />);
    expect(screen.getByRole('navigation', { name: 'Pàgines de la Consola' })).toBeTruthy();
    await act(async () => { await Promise.resolve(); });
    expect(peticio).not.toHaveBeenCalled();
  });

  test('la secció tampoc, ni en muntar ni amb Refrescar', async () => {
    vi.stubEnv('DEV', false);
    const peticio = ambFetch();
    render(<ConsolaSection />);
    // Sense Mapa, la pàgina ho diu de seguida (cap «Llegint el mapa…»).
    expect(screen.getByText('Mapa no disponible')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Refrescar' }));
    await act(async () => { await Promise.resolve(); });
    expect(peticio).not.toHaveBeenCalled();
  });

  test('useMapa: \'absent\' des del principi, i carrega no demana res', async () => {
    vi.stubEnv('DEV', false);
    const peticio = ambFetch();
    const { result } = renderHook(() => useMapa());
    expect(result.current.estat).toBe('absent');
    act(() => { result.current.carrega(); });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.estat).toBe('absent');
    expect(peticio).not.toHaveBeenCalled();
  });

  test('els carregadors tornen absència sense fetch', async () => {
    vi.stubEnv('DEV', false);
    const peticio = ambFetch();
    await expect(carregaMapa()).resolves.toBeNull();
    await expect(carregaConsola()).resolves.toBeNull();
    expect(peticio).not.toHaveBeenCalled();
  });
});

/* El contrast: a DEV les dues fonts es demanen, com sempre. Sense açò, la
   prova de dalt passaria també amb un fetch que no es crida mai per error. */
test('a DEV la Consola incrustada llig les dues fonts del middleware', async () => {
  vi.stubEnv('DEV', true);
  const peticio = ambFetch();
  render(<ConsolaIncrustada />);
  await act(async () => { await Promise.resolve(); });
  expect(demanatsIaia(peticio).sort()).toEqual(['/__iaia/consola.json', '/__iaia/mapa.json']);
});
