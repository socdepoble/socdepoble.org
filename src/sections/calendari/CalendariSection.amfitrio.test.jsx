/**
 * Bucle adversarial (auditoria Codex 261002_0148, punt 12) · /calendari amb i
 * sense amfitrió. Amb VITE_GOOGLE_OAUTH_CLIENT_ID però incrustada (l'element
 * <soc-de-poble> d'un WordPress o un Joomla) i sense cap adreça de tornada
 * declarada, la pàgina és la de sempre: cap panell, cap petició, i Google no
 * s'ofereix a connectar amb una pàgina de tornada que el paquet no porta.
 * Sense amfitrió, el panell de sempre. El fetch és simulat: cap xarxa.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { MOTIU_MAL_CONFIGURAT, MOTIU_SENSE_RETORN } from './fonts/configFonts.js';
import { oblidaTot } from './fonts/sessioFonts.js';

const mocks = vi.hoisted(() => ({
  t: (_, alternativa) => alternativa, core: {}, mur: {},
  teCapacitat: vi.fn(), loadActesAgenda: vi.fn()
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
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

const CLIENT = '123456789012-provesprovesproves.apps.googleusercontent.com';
const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17', author_name: 'Sóc de Poble' };

const panell = () => screen.queryByRole('complementary', { name: 'Els meus calendaris' });
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const pinta = () => render(<MemoryRouter rutaInicial="/calendari"><CalendariSection /></MemoryRouter>);

let fetchSimulat;
let avis;
beforeEach(() => {
  vi.clearAllMocks();
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  mocks.teCapacitat.mockReturnValue(false);
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedEvents: [FIRA], sortedFeedPosts: [], sortedMarketItems: [] };
  fetchSimulat = vi.fn();
  vi.stubGlobal('fetch', fetchSimulat);
  vi.stubEnv('VITE_GOOGLE_OAUTH_CLIENT_ID', CLIENT);
});
afterEach(() => {
  cleanup();
  oblidaTot();
  document.querySelectorAll('soc-de-poble').forEach((element) => element.remove());
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  avis.mockRestore();
});

test('incrustada sense adreça de tornada: la pàgina de sempre, sense panell ni peticions, i la consola diu per què', () => {
  document.body.append(document.createElement('soc-de-poble'));
  pinta();
  expect(panell()).toBeNull();
  expect(document.querySelector('.sdp-calendari-fonts-costat')).toBeNull();
  expect(document.querySelector('.sdp-cal-mes')).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  expect(screen.queryByRole('button', { name: 'Connecta amb Google' })).toBeNull();
  expect(fetchSimulat).not.toHaveBeenCalled();
  expect(avis).toHaveBeenCalledWith('[calendari] Fonts de Google:', expect.stringContaining('retornCalendariGoogle'));
});

test('sense amfitrió (l’SPA pròpia): el panell de sempre al costat del calendari', () => {
  pinta();
  expect(within(panell()).getByRole('button', { name: 'Connecta amb Google' })).toBeTruthy();
  expect(fetchSimulat).not.toHaveBeenCalled();
  expect(document.querySelector('.sdp-alerta')).toBeNull();
});

/* Auditoria Codex, punt 23 · Amb client de Google però incrustada sense
   retorn declarat, la consola ho deia i el veí no veia res: AmbLesFonts
   ignorava `motiu`. Ara un avís de Pedra Seca (Alerta 'avis') ho diu, davant
   del calendari i sense cap panell ni petició. */
const avisDeFonts = () => document.querySelector('.sdp-alerta.sdp-alerta--avis');

test('incrustada sense adreça de tornada: un avís de Pedra Seca diu al veí per què Google no s’hi connecta', () => {
  document.body.append(document.createElement('soc-de-poble'));
  pinta();
  const alerta = avisDeFonts();
  expect(alerta).toBeTruthy();
  expect(alerta.textContent).toBe(MOTIU_SENSE_RETORN);
  expect(alerta.compareDocumentPosition(document.querySelector('.sdp-cal-mes')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(panell()).toBeNull();
  expect(fetchSimulat).not.toHaveBeenCalled();
});

test('client de Google mal escrit: el mateix avís amb el motiu de configuració', () => {
  vi.stubEnv('VITE_GOOGLE_OAUTH_CLIENT_ID', 'no-es-cap-client');
  pinta();
  expect(avisDeFonts()?.textContent).toBe(MOTIU_MAL_CONFIGURAT);
  expect(panell()).toBeNull();
});

test('sense client de Google, incrustada o no: cap avís, la pantalla de sempre', () => {
  vi.stubEnv('VITE_GOOGLE_OAUTH_CLIENT_ID', '');
  /* El DOM serialitzat sense els identificadors de useId, que canvien d'un muntatge a l'altre. */
  const dom = (container) => new XMLSerializer().serializeToString(container).replace(/:r[0-9a-z]+:/g, ':id:');
  const { container, unmount } = pinta();
  const propia = dom(container);
  unmount();
  document.body.append(document.createElement('soc-de-poble'));
  const incrustada = pinta();
  expect(document.querySelector('.sdp-alerta')).toBeNull();
  expect(screen.queryByText(MOTIU_SENSE_RETORN)).toBeNull();
  expect(dom(incrustada.container)).toBe(propia);
  expect(fetchSimulat).not.toHaveBeenCalled();
});
