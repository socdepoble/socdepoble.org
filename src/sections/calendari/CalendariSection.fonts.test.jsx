/**
 * T1 (prompt comú 261002_0125) · Les fonts de calendari de fora a /calendari.
 * Sense configuració, la pàgina és la de sempre (cap panell, cap petició: les
 * proves de CalendariSection.test.jsx i .vistes ho fixen al detall). Amb
 * VITE_GOOGLE_OAUTH_CLIENT_ID, el panell «Els meus calendaris» al costat del
 * calendari; amb el compte connectat, les entrades de Google al mateix
 * calendari i a les targetes de davall, en totes dues versions de la pàgina.
 * El fetch és simulat: cap xarxa.
 */
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { desaToken, oblidaTot } from './fonts/sessioFonts.js';

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
const TOKEN = 'ya29.token-de-proves-0123456789';
const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17', author_name: 'Sóc de Poble' };
const CRONICA = { id: 'cronica', type: 'feed', title: 'Crònica de la setmana', created_at: '2026-09-29T10:00:00.000Z' };
const CONCERT = {
  id: 'gcal1', status: 'confirmed', summary: 'Concert de Google', location: 'Plaça Major',
  start: { dateTime: '2026-10-10T19:00:00+02:00' }, end: { dateTime: '2026-10-10T21:00:00+02:00' }
};

const calendari = () => document.querySelector('.sdp-calendari--gran');
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const panell = () => screen.queryByRole('complementary', { name: 'Els meus calendaris' });
const pinta = (consulta = '') => render(
  <MemoryRouter rutaInicial={`/calendari${consulta ? `?${consulta}` : ''}`}><CalendariSection /></MemoryRouter>
);
const resposta = (cos) => ({ ok: true, status: 200, json: async () => cos });

let fetchSimulat;
let avis;
beforeEach(() => {
  vi.clearAllMocks();
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  mocks.teCapacitat.mockReturnValue(false);
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedEvents: [FIRA], sortedFeedPosts: [CRONICA], sortedMarketItems: [] };
  fetchSimulat = vi.fn(async () => resposta({ items: [CONCERT] }));
  vi.stubGlobal('fetch', fetchSimulat);
});
afterEach(() => {
  cleanup();
  oblidaTot();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  avis.mockRestore();
});

const configura = () => vi.stubEnv('VITE_GOOGLE_OAUTH_CLIENT_ID', CLIENT);

test('sense configuració: cap panell, cap costat i cap petició a Google; el calendari, el de sempre', () => {
  pinta();
  expect(panell()).toBeNull();
  expect(document.querySelector('.sdp-calendari-fonts-costat')).toBeNull();
  expect(calendari()).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  expect(fetchSimulat).not.toHaveBeenCalled();
});

test('configurat però sense connectar: el panell al costat del calendari, «Connecta amb Google» i cap petició', () => {
  configura();
  pinta();
  const lateral = panell();
  expect(lateral).toBeTruthy();
  expect(within(lateral).getByRole('checkbox', { name: 'El meu calendari' }).checked).toBe(true);
  expect(within(lateral).getByRole('button', { name: 'Connecta amb Google' })).toBeTruthy();
  const costat = document.querySelector('.sdp-calendari-fonts-costat');
  expect(costat.firstElementChild).toBe(lateral);
  expect(costat.querySelector('.sdp-calendari-fonts-costat__principal').contains(calendari())).toBe(true);
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  expect(fetchSimulat).not.toHaveBeenCalled();
});

test('connectat: demana el mes que es veu i l’acte de Google ix a la graella i a les targetes de davall', async () => {
  configura();
  desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 });
  pinta();
  await waitFor(() => expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Concert de Google']));
  const [url, opcions] = fetchSimulat.mock.calls[0];
  const consulta = new URL(url).searchParams;
  expect(consulta.get('timeMin')).toBe(new Date(2026, 9, 1).toISOString());
  expect(consulta.get('timeMax')).toBe(new Date(2026, 10, 1).toISOString());
  expect(opcions.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  expect(within(calendari()).getByText('Concert de Google').className).toBe('sdp-calendari__pindola');
  expect(screen.getByText('2 publicacions')).toBeTruthy();
  expect(within(panell()).getByRole('button', { name: 'Desconnecta' })).toBeTruthy();
});

test('desmarcar la casella lleva l’acte de Google sense tocar la resta', async () => {
  configura();
  desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 });
  pinta();
  await waitFor(() => expect(titolsDeTargetes()).toContain('Concert de Google'));
  act(() => within(panell()).getByRole('checkbox', { name: 'El meu calendari' }).click());
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  expect(within(calendari()).queryByText('Concert de Google')).toBeNull();
});

test('a les vistes noves (?vista=setmana) també: el panell i les entrades de la setmana que es veu', async () => {
  configura();
  desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 });
  pinta('vista=setmana&date=2026-10-10');
  expect(panell()).toBeTruthy();
  await waitFor(() => expect(titolsDeTargetes()).toEqual(['Concert de Google']));
  const consulta = new URL(fetchSimulat.mock.calls[0][0]).searchParams;
  expect(consulta.get('timeMin')).toBe(new Date(2026, 9, 5).toISOString());
  expect(consulta.get('timeMax')).toBe(new Date(2026, 9, 12).toISOString());
});

test('desconnectar oblida el token: l’acte se’n va i el botó torna a ser «Connecta amb Google»', async () => {
  configura();
  desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 });
  pinta();
  await waitFor(() => expect(titolsDeTargetes()).toContain('Concert de Google'));
  act(() => within(panell()).getByRole('button', { name: 'Desconnecta' }).click());
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  expect(within(panell()).getByRole('button', { name: 'Connecta amb Google' })).toBeTruthy();
});
