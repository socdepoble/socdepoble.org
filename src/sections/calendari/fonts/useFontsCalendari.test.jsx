/**
 * T1 (prompt comú 261002_0125) · useFontsCalendari amb un fetch simulat:
 * sense configuració és inert; amb configuració, no demana res fins que el
 * compte es connecta; després demana cada font marcada una vegada per
 * període, la barreja, la deixa d'oblidar quan caduca i obri la finestra
 * de Google dins del clic.
 */
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { llegixConfigFonts } from './configFonts.js';
import { TIPUS_MISSATGE_OAUTH } from './googleCalendar.js';
import { desaToken, oblidaTot, tokenDe } from './sessioFonts.js';
import { useFontsCalendari } from './useFontsCalendari.js';

const CLIENT = '123456789012-provesprovesproves.apps.googleusercontent.com';
const ORG = 'calendari@example.org';
const TOKEN = 'ya29.token-de-proves-0123456789';
const CONFIG = llegixConfigFonts({
  VITE_GOOGLE_OAUTH_CLIENT_ID: CLIENT,
  VITE_GCAL_FONTS: JSON.stringify([
    { id: 'privat', nom: 'El meu calendari', calendarId: 'primary' },
    { id: 'organitzacio', nom: 'Organització', calendarId: ORG, compte: ORG }
  ])
}, { origen: 'http://localhost:3000' });
const SENSE_CONFIG = llegixConfigFonts({}, { origen: 'http://localhost:3000' });
const OCTUBRE = { desde: new Date(2026, 9, 1), fins: new Date(2026, 10, 1) };
const NOVEMBRE = { desde: new Date(2026, 10, 1), fins: new Date(2026, 11, 1) };

const resposta = (cos, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => cos });
const acte = (id, dia) => ({ id, summary: `Acte ${id}`, start: { date: dia }, end: { date: dia.replace(/\d{2}$/, (d) => String(Number(d) + 1).padStart(2, '0')) } });
const calendariDe = (url) => decodeURIComponent(new URL(url).pathname.split('/')[4]);
let fetchImpl;
let avis;

function munta(rang = OCTUBRE, opcions = {}) {
  return renderHook(({ periode }) => useFontsCalendari(periode, { config: CONFIG, fetchImpl, ...opcions }), { initialProps: { periode: rang } });
}
const titols = (result) => result.current.entrades.map((entrada) => entrada.esdeveniment.titol);
const fontDe = (result, id) => result.current.comptes.flatMap((compte) => compte.fonts).find((font) => font.id === id);

beforeEach(() => {
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  fetchImpl = vi.fn(async (url) => resposta({ items: calendariDe(url) === ORG ? [acte('ple', '2026-10-20')] : [acte('fira', '2026-10-17')] }));
});
afterEach(() => {
  cleanup();
  oblidaTot();
  avis.mockRestore();
});

test('sense configuració és inert: cap compte, cap entrada, cap petició', () => {
  const { result } = renderHook(() => useFontsCalendari(OCTUBRE, { config: SENSE_CONFIG, fetchImpl }));
  expect(result.current).toMatchObject({ configurades: false, entrades: [], comptes: [] });
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('amb configuració, un grup per compte i cap petició fins que es connecta', () => {
  const { result } = munta();
  expect(result.current.configurades).toBe(true);
  expect(result.current.comptes.map(({ clau, etiqueta, fase }) => ({ clau, etiqueta, fase }))).toEqual([
    { clau: '', etiqueta: 'El teu compte de Google', fase: 'desconnectat' },
    { clau: ORG, etiqueta: ORG, fase: 'desconnectat' }
  ]);
  expect(fontDe(result, 'organitzacio')).toMatchObject({ nom: 'Organització', colorToken: 'accent', activa: true, fase: 'inactiu' });
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('connectat el compte, demana les seues fonts marcades amb el seu token i en barreja les entrades', async () => {
  const { result } = munta();
  act(() => desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 }));
  await waitFor(() => expect(titols(result)).toEqual(['Acte fira']));
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  expect(calendariDe(fetchImpl.mock.calls[0][0])).toBe('primary');
  expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${TOKEN}`);
  expect(fontDe(result, 'privat').fase).toBe('llest');
  expect(result.current.entrades[0]).toMatchObject({ font: 'privat', item: null });

  act(() => desaToken(ORG, { token: `${TOKEN}-org`, caduca: Date.now() + 3600000 }));
  await waitFor(() => expect(titols(result)).toEqual(['Acte fira', 'Acte ple']));
  // La font privada no es torna a demanar: el seu període i el seu token no han canviat.
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test('desmarcar una casella lleva les seues entrades sense tornar a demanar les altres', async () => {
  const { result } = munta();
  act(() => {
    desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 });
    desaToken(ORG, { token: TOKEN, caduca: Date.now() + 3600000 });
  });
  await waitFor(() => expect(titols(result)).toHaveLength(2));
  act(() => result.current.commuta('privat'));
  expect(titols(result)).toEqual(['Acte ple']);
  expect(fontDe(result, 'privat')).toMatchObject({ activa: false, fase: 'inactiu' });
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test('canviar de període avorta la petició vella i demana la nova', async () => {
  let primera;
  fetchImpl = vi.fn((url, { signal }) => {
    if (!primera) {
      primera = signal;
      return new Promise(() => {});
    }
    return Promise.resolve(resposta({ items: [acte('magosta', '2026-11-07')] }));
  });
  const { result, rerender } = munta();
  act(() => desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 }));
  await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
  rerender({ periode: NOVEMBRE });
  await waitFor(() => expect(titols(result)).toEqual(['Acte magosta']));
  expect(primera.aborted).toBe(true);
  expect(new URL(fetchImpl.mock.calls[1][0]).searchParams.get('timeMin')).toBe(NOVEMBRE.desde.toISOString());
});

test('un 401 oblida el token: el compte torna a «Connecta» i diu que ha caducat', async () => {
  fetchImpl = vi.fn(async () => resposta({ error: { code: 401 } }, 401));
  const { result } = munta();
  act(() => desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 }));
  await waitFor(() => expect(result.current.comptes[0].fase).toBe('desconnectat'));
  expect(result.current.comptes[0].error).toMatchObject({ tipus: 'TOKEN_CADUCAT' });
  expect(tokenDe('')).toBeNull();
  expect(result.current.entrades).toEqual([]);
});

test('un error de xarxa queda a la font, i «Torna a provar» la torna a demanar', async () => {
  fetchImpl = vi.fn()
    .mockRejectedValueOnce(new TypeError('Failed to fetch'))
    .mockResolvedValueOnce(resposta({ items: [acte('fira', '2026-10-17')] }));
  const { result } = munta();
  act(() => desaToken('', { token: TOKEN, caduca: Date.now() + 3600000 }));
  await waitFor(() => expect(fontDe(result, 'privat').fase).toBe('error'));
  expect(fontDe(result, 'privat').error).toMatchObject({ tipus: 'XARXA' });
  expect(result.current.comptes[0].fase).toBe('connectat');
  act(() => result.current.reintenta('privat'));
  await waitFor(() => expect(titols(result)).toEqual(['Acte fira']));
  expect(fetchImpl).toHaveBeenCalledTimes(2);
});

test('connecta obri la finestra de Google dins del clic; si el navegador la bloqueja, el compte ho diu', () => {
  const obriFinestra = vi.fn(() => null);
  const { result } = munta(OCTUBRE, { obriFinestra });
  act(() => result.current.connecta(ORG));
  const url = new URL(obriFinestra.mock.calls[0][0]);
  expect(url.searchParams.get('login_hint')).toBe(ORG);
  expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/auth/calendari-google.html');
  expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{48}$/);
  expect(result.current.comptes[1]).toMatchObject({ fase: 'desconnectat', error: { tipus: 'SENSE_AUTORITZACIO' } });
  expect(result.current.comptes[1].error.missatge).toMatch(/finestres emergents/);
});

test('la tornada amb el nostre state connecta el compte, tanca la finestra i demana el calendari', async () => {
  const finestra = { close: vi.fn() };
  const oients = new Set();
  const canal = { addEventListener: (_, oient) => oients.add(oient), removeEventListener: (_, oient) => oients.delete(oient), close: vi.fn() };
  const obriFinestra = vi.fn(() => finestra);
  const { result } = munta(OCTUBRE, { obriFinestra, crearCanal: () => canal });
  act(() => result.current.connecta(''));
  expect(result.current.comptes[0].fase).toBe('connectant');
  const estat = new URL(obriFinestra.mock.calls[0][0]).searchParams.get('state');
  const hash = `#${new URLSearchParams({ access_token: TOKEN, token_type: 'Bearer', expires_in: '3599', state: estat })}`;
  await act(async () => {
    [...oients].forEach((oient) => oient({ data: { type: TIPUS_MISSATGE_OAUTH, hash } }));
  });
  await waitFor(() => expect(result.current.comptes[0].fase).toBe('connectat'));
  expect(finestra.close).toHaveBeenCalled();
  expect(canal.close).toHaveBeenCalled();
  await waitFor(() => expect(titols(result)).toEqual(['Acte fira']));
});

test('cancel·lar una connexió en curs torna el compte a «desconnectat» sense cap error', async () => {
  const finestra = { close: vi.fn() };
  const { result } = munta(OCTUBRE, { obriFinestra: () => finestra, crearCanal: () => null });
  act(() => result.current.connecta(''));
  await act(async () => result.current.cancella(''));
  expect(result.current.comptes[0]).toMatchObject({ fase: 'desconnectat', error: null });
  await waitFor(() => expect(finestra.close).toHaveBeenCalled());
});
