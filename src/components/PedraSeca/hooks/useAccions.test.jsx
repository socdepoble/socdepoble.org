/**
 * Connectar i la telemetria: primer es compta, després es fa el de sempre, i
 * si el comptador peta el clic continua. El mòdul de telemetria és el real
 * (embolcallat per poder-lo fer petar); `window.umami` fa d'amfitrió perquè
 * cap prova depenga del backend ni toque la xarxa.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));

vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../../data/telemetria.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, registraEsdeveniment: vi.fn(real.registraEsdeveniment) };
});

import { CLAU_APAGADA, ESDEVENIMENT_DOM, registraEsdeveniment } from '../../../data/telemetria.js';
import { registraConnectar, rutaActual, urlPerCompartir, useAccions } from './useAccions.js';

const fetchOriginal = window.fetch;
let vistos;
const escolta = (event) => vistos.push(event.detail);

beforeEach(() => {
  vi.clearAllMocks();
  vistos = [];
  window.localStorage.removeItem(CLAU_APAGADA);
  window.umami = { track: vi.fn() };
  window.fetch = vi.fn(() => Promise.resolve({ ok: true }));
  window.history.replaceState(null, '', '/notes');
  window.addEventListener(ESDEVENIMENT_DOM, escolta);
});
afterEach(() => {
  window.removeEventListener(ESDEVENIMENT_DOM, escolta);
  delete window.umami;
  window.fetch = fetchOriginal;
});

const connectars = () => vistos.filter((intent) => intent.nom === 'connectar');

test('primer es compta i després s’executa el handler propi, en el mateix clic', () => {
  const ordre = [];
  window.umami.track.mockImplementation(() => ordre.push('umami'));
  const onConnect = vi.fn(() => ordre.push('handler'));
  const { result } = renderHook(() => useAccions({ title: 'Nota secreta', onConnect }));

  result.current.handleConnect('esdeveniment');

  expect(ordre).toEqual(['umami', 'handler']); // síncron: el clic no espera ningú
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(onConnect).toHaveBeenCalledWith('esdeveniment');
  expect(window.umami.track).toHaveBeenCalledWith('connectar', { seccio: 'notes', origen: 'targeta' });
  expect(window.fetch).not.toHaveBeenCalled();
  expect(connectars()).toHaveLength(1);
});

/* T43 (ordre del Mestre, 260928, D7) · el Connectar per defecte ja no porta
   només el títol: porta un descriptor tipat ('pagina') amb la ruta del detall
   o, si no n'hi ha, la d'on està la persona. Abans esperava
   '/connectar?item_id=Nota%20secreta', l'URL que perdia d'on venia. */
const parametres = (ruta) => Object.fromEntries(new URL(ruta, 'http://localhost').searchParams);

test('sense handler propi compta i navega amb un descriptor de pàgina, sense el títol a la telemetria', () => {
  const { result } = renderHook(() => useAccions({ title: 'Nota secreta' }));
  result.current.handleConnect();
  const [ruta] = mocks.navigate.mock.calls[0];
  expect(ruta.startsWith('/connectar?')).toBe(true);
  expect(parametres(ruta)).toEqual({ item_id: 'Nota secreta', title: 'Nota secreta', objecte: 'pagina', ruta: '/notes' });
  expect(connectars()).toHaveLength(1);
  expect(JSON.stringify(connectars()[0])).not.toContain('secreta');
});

test('T43 · amb detall intern (mainHref), la clau i la ruta són les del detall; un detall extern no viatja', () => {
  const { result } = renderHook(() => useAccions({ title: 'Fira', mainHref: '/events/fira' }));
  result.current.handleConnect();
  expect(parametres(mocks.navigate.mock.calls[0][0])).toEqual({ item_id: '/events/fira', title: 'Fira', objecte: 'pagina', ruta: '/events/fira' });
  const extern = renderHook(() => useAccions({ title: 'Fira', mainHref: 'https://ca.wikipedia.org/wiki/Sella' }));
  extern.result.current.handleConnect();
  expect(parametres(mocks.navigate.mock.calls[1][0])).toEqual({ item_id: 'Fira', title: 'Fira', objecte: 'pagina', ruta: '/notes' });
});

/* T43a-1 · PENDENT, i esta prova ho fixa: rutaActual() llig window.location,
   no el router. Amb un basename d'incrustació la ruta el porta (i navigate()
   l'hi tornaria a posar), mentre que el mainHref d'una targeta no; amb
   MemoryRouter és la de la pàgina amfitriona. I urlPerCompartir compon
   origin + ruta sense basename. Llegir-la de RouterContext trencaria les
   proves que el simulen només amb useNavigate (UniversalEditorShell,
   DocumentEditor, PageFrame, UniversalCard…). Si canvia, canvia açò. */
test('T43a-1 · (comportament actual) la ruta per defecte és la de la barra d’adreces, basename inclòs', () => {
  window.history.replaceState(null, '', '/app/mur?item=3');
  expect(rutaActual()).toBe('/app/mur?item=3');
  const { result } = renderHook(() => useAccions({ title: 'Mur' }));
  result.current.handleConnect();
  expect(parametres(mocks.navigate.mock.calls[0][0]).ruta).toBe('/app/mur?item=3');
  expect(urlPerCompartir('/mur/3')).toBe(`${window.location.origin}/mur/3`);
});

test('la prop telemetria porta origen i mode fins a Umami', () => {
  const { result } = renderHook(() => useAccions({
    onConnect: () => {}, telemetria: { origen: 'pagina', mode: 'previsualitzacio' }
  }));
  result.current.handleConnect();
  expect(connectars()[0].dades).toEqual({ seccio: 'notes', origen: 'pagina', mode: 'previsualitzacio' });
});

test('només valors tancats: un text lliure no entra per origen ni per mode', () => {
  registraConnectar({ origen: 'Fira secreta', mode: 'Nota secreta' });
  expect(registraEsdeveniment).toHaveBeenCalledWith('connectar', { seccio: 'notes', origen: 'targeta' });
});

test('si la telemetria peta, el clic continua', () => {
  registraEsdeveniment.mockImplementationOnce(() => { throw new Error('comptador caigut'); });
  const onConnect = vi.fn();
  const { result } = renderHook(() => useAccions({ onConnect }));
  expect(() => result.current.handleConnect()).not.toThrow();
  expect(onConnect).toHaveBeenCalledTimes(1);
});
