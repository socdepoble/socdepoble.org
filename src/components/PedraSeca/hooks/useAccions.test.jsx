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
import { registraConnectar, useAccions } from './useAccions.js';

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

test('sense handler propi compta i navega com sempre, sense el títol a la telemetria', () => {
  const { result } = renderHook(() => useAccions({ title: 'Nota secreta' }));
  result.current.handleConnect();
  expect(mocks.navigate).toHaveBeenCalledWith('/connectar?item_id=Nota%20secreta');
  expect(connectars()).toHaveLength(1);
  expect(JSON.stringify(connectars()[0])).not.toContain('secreta');
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
