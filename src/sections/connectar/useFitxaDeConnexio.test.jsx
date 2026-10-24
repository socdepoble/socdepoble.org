import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* IDEA-14 (Directiva del Mestre, 261024; G-04) · La fitxa de confiança d'un
   perfil o d'una organització: inert sense la capacitat 'directori', un sol
   tipus per fitxa i la lectura vella avortada quan canvia la clau. */
const m = vi.hoisted(() => ({ directori: true, perfil: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'directori' && m.directori,
  loadPerfilPublic: (...args) => m.perfil(...args)
}));
import { fitxaDelTipus, useFitxaDeConnexio } from './useFitxaDeConnexio.js';

const PEPA = Object.freeze({ tipus: 'persona', id: 'u-pepa', nom: 'Pepa Soler' });
const RENTONAR = Object.freeze({ tipus: 'entitat', id: 'org-1', nom: 'El Rentonar' });

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  m.directori = true;
  m.perfil.mockResolvedValue(PEPA);
});

test('sense petició, o sense la capacitat del directori, no crida res: inactiu', () => {
  const sense = renderHook(() => useFitxaDeConnexio(null, { config: {} }));
  expect(sense.result.current).toEqual({ estat: 'inactiu', perfil: null });
  m.directori = false;
  const senseCapacitat = renderHook(() => useFitxaDeConnexio({ id: 'u-pepa', tipus: 'persona' }, { config: {} }));
  expect(senseCapacitat.result.current).toEqual({ estat: 'inactiu', perfil: null });
  const ia = renderHook(() => useFitxaDeConnexio({ id: 'iaia-maria', tipus: 'ia' }, { config: {} }));
  expect(ia.result.current.estat).toBe('inactiu');
  expect(m.perfil).not.toHaveBeenCalled();
});

test('carrega la fitxa del tipus demanat amb un senyal per a avortar-la', async () => {
  const { result } = renderHook(() => useFitxaDeConnexio({ id: 'u-pepa', tipus: 'persona' }, { config: { dataMode: 'remote' } }));
  expect(result.current).toEqual({ estat: 'carregant', perfil: null });
  await waitFor(() => expect(result.current.estat).toBe('llest'));
  expect(result.current.perfil).toEqual(PEPA);
  expect(m.perfil).toHaveBeenCalledTimes(1);
  expect(m.perfil).toHaveBeenCalledWith('u-pepa', expect.objectContaining({ dataMode: 'remote', signal: expect.any(AbortSignal) }));
});

test('una URL que demana una persona amb l’id d’una entitat no en fa cap persona (i al revés)', async () => {
  m.perfil.mockResolvedValue(RENTONAR);
  const persona = renderHook(() => useFitxaDeConnexio({ id: 'org-1', tipus: 'persona' }, { config: {} }));
  await waitFor(() => expect(persona.result.current.estat).toBe('llest'));
  expect(persona.result.current.perfil).toBeNull();
  const entitat = renderHook(() => useFitxaDeConnexio({ id: 'org-1', tipus: 'grup' }, { config: {} }));
  await waitFor(() => expect(entitat.result.current.estat).toBe('llest'));
  expect(entitat.result.current.perfil).toEqual(RENTONAR);
  expect(fitxaDelTipus(PEPA, 'entitat')).toBeNull();
  expect(fitxaDelTipus({ ...PEPA, nom: '  ' }, 'persona')).toBeNull();
  expect(fitxaDelTipus({ ...PEPA, id: '' }, 'persona')).toBeNull();
  expect(fitxaDelTipus(null, 'persona')).toBeNull();
});

test('un error de lectura acaba en «error», sense cap fitxa', async () => {
  m.perfil.mockRejectedValue(Object.assign(new Error('La fitxa no ha arribat a temps.'), { name: 'TimeoutError' }));
  const { result } = renderHook(() => useFitxaDeConnexio({ id: 'u-pepa', tipus: 'persona' }, { config: {} }));
  await waitFor(() => expect(result.current.estat).toBe('error'));
  expect(result.current.perfil).toBeNull();
});

test('canviar de fitxa avorta la lectura d’abans i la seua resposta tardana no es pinta', async () => {
  let respon;
  m.perfil.mockImplementationOnce(() => new Promise((resolve) => { respon = resolve; }));
  m.perfil.mockImplementationOnce(async () => RENTONAR);
  const { result, rerender } = renderHook(({ peticio }) => useFitxaDeConnexio(peticio, { config: {} }), {
    initialProps: { peticio: { id: 'u-pepa', tipus: 'persona' } }
  });
  await waitFor(() => expect(m.perfil).toHaveBeenCalledTimes(1));
  const primerSenyal = m.perfil.mock.calls[0][1].signal;
  rerender({ peticio: { id: 'org-1', tipus: 'entitat' } });
  expect(primerSenyal.aborted).toBe(true);
  await waitFor(() => expect(result.current.perfil).toEqual(RENTONAR));
  await act(async () => { respon(PEPA); });
  expect(result.current.perfil).toEqual(RENTONAR);
});
