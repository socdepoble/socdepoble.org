/* Onada 6 · revisió de seguretat de la Gestoria (defensa en profunditat).
   Amb el cofre bloquejat, llig() no comença cap lectura d'extractes, encara
   que algú la cride: la porta del cofre amaga el selector, i el hook també
   s'hi nega. Sense la guarda, la crida arribaria a la porta del tractor i
   deixaria un error («cal aprovar…»); amb la guarda, l'estat no es mou. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { useHistoric } from './useHistoric.js';

const bloquejat = () => Object.assign(new Error('El cofre està bloquejat'), { codi: 'COFRE_BLOQUEJAT' });

afterEach(cleanup);

describe('useHistoric · cofre bloquejat', () => {
  test('amb la persistència bloquejada, llig() no comença cap lectura', async () => {
    const persistencia = {
      llig: () => Promise.reject(bloquejat()),
      desa: () => Promise.resolve(),
      subscriu: () => () => {},
    };
    const { result } = renderHook(() => useHistoric({ magatzem: crearMagatzemMemoria(), persistencia, avui: '2026-10-09' }));
    expect(result.current.persistenciaBloquejada).toBe(true);
    const fitxer = new File(['x'], 'extracte.n43', { type: 'text/plain' });
    await act(async () => { await result.current.llig([fitxer]); });
    expect(result.current.llegint).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lectura ?? null).toBe(null);
  });

  test('control: sense cofre, la mateixa crida arriba a la porta del tractor', async () => {
    const { result } = renderHook(() => useHistoric({ magatzem: crearMagatzemMemoria(), avui: '2026-10-09' }));
    expect(result.current.persistenciaBloquejada).toBe(false);
    const fitxer = new File(['x'], 'extracte.n43', { type: 'text/plain' });
    await act(async () => { await result.current.llig([fitxer]); });
    expect(result.current.error).toBeTruthy();
    expect(result.current.lectura ?? null).toBe(null);
  });
});
