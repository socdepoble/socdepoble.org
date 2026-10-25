import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* IDEA-22, punt 2 (pla 261025_0200) · La titular d'una entitat a /connectar.
   P1-15 del Llibre (auditoria Port Neutral 261025, PN-03) · El servidor
   filtra la titular pels bloquejos entre ella i QUI MIRA: la lectura és de
   l'àmbit sencer (backend, persona i entitat), no només de l'entitat. Un canvi
   de persona torna a llegir, i la resposta tardana de l'àmbit vell no es pinta. */
const m = vi.hoisted(() => ({ capacitat: true, titular: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'titularPublic' && m.capacitat,
  loadTitularPublic: (...args) => m.titular(...args)
}));
import { useTitularDeConnexio } from './useTitularDeConnexio.js';

const TITULAR = Object.freeze({ tipus: 'persona', id: 'u-tere', nom: 'Tere Vidal' });
const POBLE_A = { tenantId: '0a0a0a0a-0000-4000-8000-00000000000a' };
const POBLE_B = { tenantId: '0b0b0b0b-0000-4000-8000-00000000000b' };

afterEach(cleanup);
beforeEach(() => {
  m.capacitat = true;
  m.titular.mockReset().mockResolvedValue(TITULAR);
});

test('sense sessió, sense entitat o sense la capacitat, no crida res: inactiu', () => {
  const senseSessio = renderHook(() => useTitularDeConnexio('org-1', { config: POBLE_A, teSessio: false, usuariId: 'u-1' }));
  expect(senseSessio.result.current).toEqual({ estat: 'inactiu', titular: null });
  const senseEntitat = renderHook(() => useTitularDeConnexio(null, { config: POBLE_A, teSessio: true, usuariId: 'u-1' }));
  expect(senseEntitat.result.current.estat).toBe('inactiu');
  m.capacitat = false;
  const senseCapacitat = renderHook(() => useTitularDeConnexio('org-1', { config: POBLE_A, teSessio: true, usuariId: 'u-1' }));
  expect(senseCapacitat.result.current.estat).toBe('inactiu');
  expect(m.titular).not.toHaveBeenCalled();
});

test('llig la titular de l’entitat (l’id, mai la clau d’àmbit) amb un senyal per a avortar-la', async () => {
  const { result } = renderHook(() => useTitularDeConnexio('org-1', { config: POBLE_A, teSessio: true, usuariId: 'u-1' }));
  expect(result.current).toEqual({ estat: 'carregant', titular: null });
  await waitFor(() => expect(result.current.estat).toBe('llest'));
  expect(result.current.titular).toEqual({ ...TITULAR, avatar: '' });
  expect(m.titular).toHaveBeenCalledTimes(1);
  expect(m.titular).toHaveBeenCalledWith('org-1', expect.objectContaining({ ...POBLE_A, signal: expect.any(AbortSignal) }));
});

test('P1-15 · un canvi de persona (mateix backend i entitat) torna a llegir i no pinta la titular de l’altra', async () => {
  m.titular.mockResolvedValueOnce(TITULAR).mockResolvedValueOnce(null);
  const { result, rerender } = renderHook(({ usuariId }) => useTitularDeConnexio('org-1', { config: POBLE_A, teSessio: true, usuariId }),
    { initialProps: { usuariId: 'u-1' } });
  await waitFor(() => expect(result.current.titular?.nom).toBe('Tere Vidal'));
  rerender({ usuariId: 'u-2' });
  /* En el mateix pintat: la titular que el servidor ha donat a u-1 ja no es veu. */
  expect(result.current).toEqual({ estat: 'carregant', titular: null });
  await waitFor(() => expect(result.current.estat).toBe('llest'));
  expect(m.titular).toHaveBeenCalledTimes(2);
  expect(result.current.titular).toBeNull();
});

test('P1-15 · la resposta tardana de l’àmbit vell s’avorta i no es pinta en el nou', async () => {
  let respon;
  m.titular.mockImplementationOnce(() => new Promise((resolve) => { respon = resolve; }));
  m.titular.mockImplementationOnce(async () => null);
  const { result, rerender } = renderHook(({ usuariId, config }) => useTitularDeConnexio('org-1', { config, teSessio: true, usuariId }),
    { initialProps: { usuariId: 'u-1', config: POBLE_A } });
  await waitFor(() => expect(m.titular).toHaveBeenCalledTimes(1));
  const primerSenyal = m.titular.mock.calls[0][1].signal;
  rerender({ usuariId: 'u-1', config: POBLE_B });
  expect(primerSenyal.aborted).toBe(true);
  await waitFor(() => expect(result.current.estat).toBe('llest'));
  await act(async () => { respon(TITULAR); });
  expect(result.current).toEqual({ estat: 'llest', titular: null });
});

test('una configuració nova del mateix àmbit no torna a llegir', async () => {
  const { result, rerender } = renderHook(({ config }) => useTitularDeConnexio('org-1', { config, teSessio: true, usuariId: 'u-1' }),
    { initialProps: { config: { ...POBLE_A } } });
  await waitFor(() => expect(result.current.estat).toBe('llest'));
  rerender({ config: { ...POBLE_A } });
  await act(async () => {});
  expect(m.titular).toHaveBeenCalledTimes(1);
  expect(result.current.titular?.nom).toBe('Tere Vidal');
});
