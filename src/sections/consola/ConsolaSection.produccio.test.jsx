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
/* Onada 11 (261010; prompt 261010_1730, tasca 3) · el doble embolcalla l'h1 en
   una capçalera page-title, com la UniversalPage de veres. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
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

/* Decisió del Mestre (31-10-2026) · «Fora de DEV» és ací un paquet SENSE la
   instantània publicada (sense la bandera SDP_CONSOLA_INSTANTANIA): el
   connector de WordPress, l'app nativa o Sollutia. El build web, avall. */
describe('fora de DEV, cap petició a /__iaia/*', () => {
  test('la Consola incrustada (Wiki pública) no fa cap petició i el tauler es pinta', async () => {
    vi.stubEnv('DEV', false);
    const peticio = ambFetch();
    render(<ConsolaIncrustada />);
    expect(screen.getByRole('navigation', { name: 'Pàgines de la Consola' })).toBeTruthy();
    // Pla 261027_0845 (Guarda Nocturna), §3 · També el Govern del Mestre, sense demanar govern.json.
    expect(screen.getByRole('region', { name: 'Govern del Mestre' })).toBeTruthy();
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

/* El contrast: a DEV les fonts es demanen, com sempre. Sense açò, la
   prova de dalt passaria també amb un fetch que no es crida mai per error.
   Pla 261027_0845 (Guarda Nocturna), §3 · La Consola incrustada també pinta
   el Govern del Mestre: a DEV llig la seua matriu (/__iaia/govern.json), una
   sola vegada, com les altres dues. Derogat: «les dues fonts del middleware». */
test('a DEV la Consola incrustada llig les tres fonts del middleware, cada una una sola vegada', async () => {
  vi.stubEnv('DEV', true);
  const peticio = ambFetch();
  render(<ConsolaIncrustada />);
  await act(async () => { await Promise.resolve(); });
  expect(demanatsIaia(peticio).sort()).toEqual(['/__iaia/consola.json', '/__iaia/govern.json', '/__iaia/mapa.json']);
});

/* Decisió del Mestre (31-10-2026) · «Sí, vull que la web publicada mostre una
   instantània sanejada amb totes les dades reals de la Consola a qualsevol
   usuari». El build web (vite.config.js → consolaIaia() →
   sdp:consola-instantania) emet /__iaia/*.json estàtics i segella
   SDP_CONSOLA_INSTANTANIA = '1': fora de DEV, amb la bandera, la Consola els
   llig amb un GET al mateix origen i sense credencials, i ho diu. Sense la
   bandera (WordPress, l'app), el que proven les de dalt: cap petició. */
describe('al build web, la instantània publicada', () => {
  const aLaWebPublicada = () => { vi.stubEnv('DEV', false); vi.stubEnv('SDP_CONSOLA_INSTANTANIA', '1'); };
  const json = (cos) => ({ status: 200, ok: true, statusText: 'OK', headers: { get: () => 'application/json' }, json: async () => cos });
  const GENERAT = '2026-10-31T00:30:00.000Z';
  const GOVERN = Object.freeze({
    schema: 'sdp.govern.v1', generat: GENERAT, head: '7a1828ca779ef74284846c9e5a4122cd23945689', trasllat: null,
    mcr: {
      at: '2026-10-30T23:30:00.000Z', baseline_head: '7a1828ca779ef74284846c9e5a4122cd23945689', scope: 'llibre-mestre', pla: 'llibre-mestre',
      requirements: [{ id: 'P0-01', source: '§0', requirement: 'Prova', status: '[FET I SEGELLAT]', evidence: 'commit abc1234', owner: null, priority: 'P0', acceptance: null }]
    }
  });
  /* Un servidor estàtic: el Govern i la resta, 404. */
  const estatic = (fonts = {}) => {
    const peticio = vi.fn(async (url) => (fonts[String(url)] ? json(fonts[String(url)]) : { status: 404, ok: false, statusText: 'Not Found', headers: { get: () => '' } }));
    vi.stubGlobal('fetch', peticio);
    return peticio;
  };

  test('els quatre carregadors demanen la instantània al mateix origen, sense credencials ni lectura en viu', async () => {
    aLaWebPublicada();
    const peticio = estatic();
    const { carregaEmpaquetats } = await import('./empaquetats.js');
    const { carregaGovern } = await import('./govern/governContent.js');
    await expect(carregaConsola('s')).resolves.toBeNull();
    await expect(carregaMapa('s')).resolves.toBeNull();
    await expect(carregaGovern('s')).resolves.toBeNull();
    await expect(carregaEmpaquetats('s')).resolves.toBeNull();
    expect(peticio.mock.calls).toEqual(['consola', 'mapa', 'govern', 'empaquetats']
      .map((font) => [`/__iaia/${font}.json`, { signal: 's', cache: 'no-cache', credentials: 'omit' }]));
  });

  test('una font que el build no ha pogut produir (el sobre d’error) es pinta com a error, amb el seu text', async () => {
    aLaWebPublicada();
    estatic({ '/__iaia/mapa.json': { schema: 'sdp.instantania-error.v1', font: 'mapa', codi: 'intern', error: 'No s’ha pogut compilar el Mapa en fer la instantània.' } });
    await expect(carregaMapa()).rejects.toThrow('No s’ha pogut compilar el Mapa en fer la instantània.');
  });

  test('la Consola incrustada llig les tres fonts una vegada, pinta les dades i diu que són la instantània publicada', async () => {
    aLaWebPublicada();
    const peticio = estatic({ '/__iaia/govern.json': GOVERN });
    render(<ConsolaIncrustada />);
    await act(async () => { await Promise.resolve(); });
    expect(demanatsIaia(peticio).sort()).toEqual(['/__iaia/consola.json', '/__iaia/govern.json', '/__iaia/mapa.json']);
    expect(peticio.mock.calls.every(([, opcions]) => opcions.credentials === 'omit')).toBe(true);
    const avis = await screen.findByText('Instantània publicada');
    expect(avis.closest('.sdp-alerta').textContent).toMatch(/Són les dades reals del sistema tal com eren el .+, quan es va publicar esta versió de la web\./);
    expect(avis.closest('.sdp-alerta').textContent).toContain('sense camins de l’ordinador, sense secrets i sense dades personals');
    // Les dades del Govern hi són: la targeta compta la fila feta i segellada.
    expect(screen.getByRole('region', { name: 'Govern del Mestre' }).textContent).toContain('1 fet i segellat');
  });

  test('al servidor de desenvolupament, cap avís d’instantània publicada', async () => {
    vi.stubEnv('DEV', true);
    estatic({ '/__iaia/govern.json': GOVERN });
    render(<ConsolaIncrustada />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.queryByText('Instantània publicada')).toBeNull();
  });
});
