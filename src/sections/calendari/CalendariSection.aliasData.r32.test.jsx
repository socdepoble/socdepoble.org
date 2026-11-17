/**
 * Regressió R32 (T2) · Rutes profundes en fred a `/calendari?data=AAAA-MM-DD`.
 *
 * Verifica que l'àlies en valencià `?data=2026-11-16` posiciona la graella al
 * novembre de 2026 i tria el dia `2026-11-16`, que `?date=` manté precedència si
 * tots dos paràmetres conviuen, i que en interactuar (deseleccionar dia o
 * navegar de període) l'àlies `?data=` s'esborra netament sense quedar encallat.
 */
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';

const mocks = vi.hoisted(() => ({
  t: (_, alternativa) => alternativa,
  core: {},
  mur: {},
  teCapacitat: vi.fn(),
  loadActesAgenda: vi.fn()
}));

vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (...args) => mocks.teCapacitat(...args),
  loadActesAgenda: (...args) => mocks.loadActesAgenda(...args)
}));

import CalendariSection from './CalendariSection.jsx';

const TROBADA_NOV = {
  id: 'trobada-r32',
  type: 'event',
  title: 'Trobada de novembre a la plaça',
  date: '2026-11-16',
  author_name: 'Sóc de Poble'
};

function Sonda() {
  const { pathname, search } = useLocation();
  return <span data-testid="on-soc">{`${pathname}${search ? `?${search}` : ''}`}</span>;
}

const dataLlarga = (d) =>
  d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

let avis;

beforeEach(() => {
  vi.clearAllMocks();
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  mocks.teCapacitat.mockReturnValue(false);
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = {
    status: 'ready',
    error: null,
    refresh: vi.fn(),
    sortedEvents: [TROBADA_NOV],
    sortedFeedPosts: [],
    sortedMarketItems: []
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  avis.mockRestore();
});

test('R32 · /calendari?data=2026-11-16 obri novembre de 2026 amb el dia triat i neteja ?data= en canviar d’estat', () => {
  render(
    <MemoryRouter rutaInicial="/calendari?data=2026-11-16">
      <CalendariSection />
      <Sonda />
    </MemoryRouter>
  );

  const graella = document.querySelector('.sdp-cal-mes');
  expect(graella).not.toBeNull();
  const botoDia = within(graella).getByRole('button', {
    name: (nom) => nom.startsWith(`${dataLlarga(new Date(2026, 10, 16))} · `)
  });
  expect(botoDia.getAttribute('aria-pressed')).toBe('true');

  // Clicar el mateix dia deselecciona i esborra l'àlies `?data=` de la URL.
  act(() => {
    botoDia.click();
  });

  expect(within(graella).queryByRole('button', { pressed: true })).toBeNull();
  expect(screen.getByTestId('on-soc').textContent).toBe('/calendari?vista=mes&mes=2026-11');
});

test('R32 · ?date= manté precedència quan conviu amb ?data=', () => {
  render(
    <MemoryRouter rutaInicial="/calendari?date=2026-10-05&data=2026-11-16">
      <CalendariSection />
      <Sonda />
    </MemoryRouter>
  );

  const graella = document.querySelector('.sdp-cal-mes');
  const botoOctubre = within(graella).getByRole('button', {
    name: (nom) => nom.startsWith(`${dataLlarga(new Date(2026, 9, 5))} · `)
  });
  expect(botoOctubre.getAttribute('aria-pressed')).toBe('true');
});
