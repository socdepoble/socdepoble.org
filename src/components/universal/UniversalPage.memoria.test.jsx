/**
 * C3 (260929) · La barra de la Pàgina Universal dins d'un amfitrió. Connectar
 * i Compartir porten la ruta de l'APP (l'entrada del router en memòria), no la
 * de la pàgina amfitriona. Amb router de navegador sense base (socdepoble.org)
 * són els d'abans, byte a byte. Els routers són els de veres; només la
 * navegació es simula, per a llegir on porta cada clic.
 */
import { render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mocks.navigate
}));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));

import { BrowserRouter, MemoryRouter } from '../../app/contexts/RouterContext';
import { UniversalPage } from './UniversalPage.jsx';

const botoConnectar = (container) => container.querySelector('header.bar-blue .btn-connectar.sp-card-connect');
const botoCompartir = (container) => container.querySelector('header.bar-blue [aria-label="Compartir"]');
const parametres = (crida) => Object.fromEntries(new URL(crida, 'http://localhost').searchParams);

let share;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('VITE_CANONICAL_URL', '');
  share = vi.fn(() => Promise.resolve());
  Object.defineProperty(window.navigator, 'share', { value: share, configurable: true });
});
afterEach(() => {
  cleanup();
  delete window.navigator.share;
  vi.unstubAllEnvs();
});

test('MEMÒRIA: Connectar de la barra porta la ruta de l’app, no la de la pàgina amfitriona', () => {
  window.history.replaceState(null, '', '/pagina-amfitrio?p=42');
  const { container } = render(
    <MemoryRouter rutaInicial="/mur?date=2026-09-28"><UniversalPage chrome="context" title="Pàgina" /></MemoryRouter>
  );
  fireEvent.click(botoConnectar(container));
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(parametres(mocks.navigate.mock.calls[0][0])).toEqual({
    item_id: '/mur?date=2026-09-28', title: 'Pàgina', objecte: 'pagina', ruta: '/mur?date=2026-09-28'
  });
  expect(`${window.location.pathname}${window.location.search}`).toBe('/pagina-amfitrio?p=42');
});

test('MEMÒRIA: Compartir de la barra comparteix l’enllaç de l’app (canònic del build o, si no, origen de la pàgina)', () => {
  window.history.replaceState(null, '', '/pagina-amfitrio?p=42');
  const sense = render(<MemoryRouter rutaInicial="/mercat"><UniversalPage chrome="context" title="Mercat" /></MemoryRouter>);
  fireEvent.click(botoCompartir(sense.container));
  expect(share).toHaveBeenLastCalledWith({ title: 'Mercat', url: `${window.location.origin}/mercat` });
  sense.unmount();
  vi.stubEnv('VITE_CANONICAL_URL', 'https://socdepoble.org/');
  const amb = render(<MemoryRouter rutaInicial="/mur?item=3"><UniversalPage chrome="context" title="Mur" /></MemoryRouter>);
  fireEvent.click(botoCompartir(amb.container));
  expect(share).toHaveBeenLastCalledWith({ title: 'Mur', url: 'https://socdepoble.org/mur?item=3' });
});

test('NAVEGADOR sense base (socdepoble.org): Connectar i Compartir, els d’abans', () => {
  window.history.replaceState(null, '', '/mur?date=2026-09-28');
  const { container } = render(<BrowserRouter><UniversalPage chrome="context" title="Pàgina" /></BrowserRouter>);
  fireEvent.click(botoConnectar(container));
  expect(parametres(mocks.navigate.mock.calls[0][0]).ruta).toBe('/mur?date=2026-09-28');
  fireEvent.click(botoCompartir(container));
  expect(share).toHaveBeenCalledWith({ title: 'Pàgina', url: window.location.href });
});

/* Ordre del Mestre (261021, pla 261021_0015 §13, P1-03) · L'app nativa munta
   el router de NAVEGADOR sense base, però la barra d'adreces és
   capacitor://localhost (iOS) o https://localhost (Android): Compartir de la
   barra porta socdepoble.org i el mateix camí. */
test('APP NATIVA (navegador sense base): Compartir de la barra porta socdepoble.org', () => {
  window.history.replaceState(null, '', '/mur?date=2026-09-28');
  window.Capacitor = { isNativePlatform: () => true };
  try {
    const { container } = render(<BrowserRouter><UniversalPage chrome="context" title="Pàgina" /></BrowserRouter>);
    fireEvent.click(botoCompartir(container));
    expect(share).toHaveBeenCalledWith({ title: 'Pàgina', url: 'https://socdepoble.org/mur?date=2026-09-28' });
  } finally {
    delete window.Capacitor;
  }
});
