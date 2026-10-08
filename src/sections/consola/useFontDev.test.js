/* Neteja 261007 (prompt 261007_1628, peça D: Consola, només canvis píxel
   idèntics) · useConsola (ConsolaSection.jsx) i useMapa (mapa/useMapa.js)
   eren dues còpies línia per línia; ara són dues línies damunt de
   useFontDev. Esta prova fixa la semàntica que tenien les dues: l'estat des
   del principi, absent sense font, l'error que conserva l'última lectura
   bona, la lectura nova que avorta la que corre, l'abort en desmuntar i la
   barrera de DEV. La de DEV a la secció sencera és a
   ConsolaSection.produccio.test.jsx. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const fontMapa = vi.hoisted(() => ({ carregaMapa: null }));
vi.mock('./mapa/mapaContent.js', () => ({
  carregaMapa: (...args) => fontMapa.carregaMapa(...args)
}));

import { useFontDev } from './useFontDev.js';
import { useMapa } from './mapa/useMapa.js';

/* Un carregador que deixa resoldre o fallar cada lectura des de la prova. */
function carregadorManual() {
  const lectures = [];
  const carregador = vi.fn((signal) => new Promise((resol, falla) => lectures.push({ signal, resol, falla })));
  return { carregador, lectures };
}
const resol = async (lectura, valor) => { await act(async () => { lectura.resol(valor); }); };
const falla = async (lectura, error) => { await act(async () => { lectura.falla(error); }); };

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('useFontDev a DEV', () => {
  test('llig en muntar: loading i després ready amb el valor', async () => {
    vi.stubEnv('DEV', true);
    const { carregador, lectures } = carregadorManual();
    const { result } = renderHook(() => useFontDev(carregador));
    expect(result.current.estat).toBe('loading');
    expect(result.current.valor).toBeNull();
    expect(carregador).toHaveBeenCalledTimes(1);
    expect(lectures[0].signal).toBeInstanceOf(AbortSignal);
    await resol(lectures[0], { generat: 'x' });
    expect(result.current).toMatchObject({ estat: 'ready', valor: { generat: 'x' }, error: null });
  });

  test('una lectura buida (null) és absència, no error', async () => {
    vi.stubEnv('DEV', true);
    const { carregador, lectures } = carregadorManual();
    const { result } = renderHook(() => useFontDev(carregador));
    await resol(lectures[0], null);
    expect(result.current).toMatchObject({ estat: 'absent', valor: null, error: null });
  });

  test('un error conserva l’última lectura bona, i Refrescar el neteja', async () => {
    vi.stubEnv('DEV', true);
    const { carregador, lectures } = carregadorManual();
    const { result } = renderHook(() => useFontDev(carregador));
    await resol(lectures[0], { n: 1 });
    act(() => { result.current.carrega(); });
    expect(result.current).toMatchObject({ estat: 'loading', valor: { n: 1 }, error: null });
    const error = new Error('Mapa 500');
    await falla(lectures[1], error);
    expect(result.current).toMatchObject({ estat: 'error', valor: { n: 1 }, error });
    act(() => { result.current.carrega(); });
    expect(result.current).toMatchObject({ estat: 'loading', error: null });
  });

  test('una lectura nova avorta la que corre, i les velles ja no escriuen res', async () => {
    vi.stubEnv('DEV', true);
    const { carregador, lectures } = carregadorManual();
    const { result } = renderHook(() => useFontDev(carregador));
    act(() => { result.current.carrega(); });
    act(() => { result.current.carrega(); });
    expect(lectures.map((l) => l.signal.aborted)).toEqual([true, true, false]);
    await resol(lectures[2], { nova: true });
    await resol(lectures[0], { vella: true });
    await falla(lectures[1], new Error('tard'));
    expect(result.current).toMatchObject({ estat: 'ready', valor: { nova: true }, error: null });
  });

  test('desmuntar avorta la lectura que corre', () => {
    vi.stubEnv('DEV', true);
    const { carregador, lectures } = carregadorManual();
    const { unmount } = renderHook(() => useFontDev(carregador));
    unmount();
    expect(lectures[0].signal.aborted).toBe(true);
  });

  test('`carrega` és estable entre pintades', async () => {
    vi.stubEnv('DEV', true);
    const { carregador, lectures } = carregadorManual();
    const { result, rerender } = renderHook(() => useFontDev(carregador));
    const primera = result.current.carrega;
    rerender();
    await resol(lectures[0], { n: 1 });
    expect(result.current.carrega).toBe(primera);
    expect(carregador).toHaveBeenCalledTimes(1);
  });

  /* Esmena del revisor adversarial (peça D) · Un carregador en línia, nou a
     cada pintada, no fa cap bucle de lectures: `carrega` continua estable i
     no torna a llegir sol; el següent Refrescar fa servir l'últim. */
  test('un carregador nou no torna a llegir sol; el següent Refrescar el fa servir', async () => {
    vi.stubEnv('DEV', true);
    const primer = carregadorManual();
    const segon = carregadorManual();
    const { result, rerender } = renderHook(({ carregador }) => useFontDev((s) => carregador(s)), {
      initialProps: { carregador: primer.carregador }
    });
    const carrega = result.current.carrega;
    await resol(primer.lectures[0], { n: 1 });
    rerender({ carregador: segon.carregador });
    rerender({ carregador: segon.carregador });
    expect(result.current.carrega).toBe(carrega);
    expect(primer.carregador).toHaveBeenCalledTimes(1);
    expect(segon.carregador).not.toHaveBeenCalled();
    act(() => { result.current.carrega(); });
    expect(segon.carregador).toHaveBeenCalledTimes(1);
    await resol(segon.lectures[0], { n: 2 });
    expect(result.current).toMatchObject({ estat: 'ready', valor: { n: 2 }, error: null });
    expect(primer.carregador).toHaveBeenCalledTimes(1);
  });

  test('`actiu: false` no llig res en muntar', () => {
    vi.stubEnv('DEV', true);
    const { carregador } = carregadorManual();
    const { result } = renderHook(() => useFontDev(carregador, { actiu: false }));
    expect(result.current.estat).toBe('absent');
    expect(carregador).not.toHaveBeenCalled();
  });
});

describe('useFontDev fora de DEV', () => {
  test('\'absent\' des del principi, i ni muntar ni Refrescar demanen res', () => {
    vi.stubEnv('DEV', false);
    const { carregador } = carregadorManual();
    const { result } = renderHook(() => useFontDev(carregador));
    expect(result.current).toMatchObject({ estat: 'absent', valor: null, error: null });
    act(() => { result.current.carrega(); });
    expect(result.current.estat).toBe('absent');
    expect(carregador).not.toHaveBeenCalled();
  });
});

describe('useMapa és useFontDev amb el carregador del Mapa', () => {
  test('la mateixa forma d’abans: { estat, mapa, error, carrega }', async () => {
    vi.stubEnv('DEV', true);
    const { carregador, lectures } = carregadorManual();
    fontMapa.carregaMapa = carregador;
    const { result } = renderHook(() => useMapa());
    expect(Object.keys(result.current).sort()).toEqual(['carrega', 'error', 'estat', 'mapa']);
    await resol(lectures[0], { generat: 'g' });
    expect(result.current).toMatchObject({ estat: 'ready', mapa: { generat: 'g' }, error: null });
  });
});
