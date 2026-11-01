/* T7 · S2 (assalt 261101) · useRellotgeAlertes amb temporitzadors falsos:
   un sol temporitzador fins a la caducitat més pròxima, que es torna a armar
   si arriba abans d'hora i també després de marcar (fins que la caducitat
   canvia), es neteja en canviar o desmuntar, i en tornar a la pestanya
   marca només si ja ha caducat. Sense caducitat, ni temporitzador ni
   escolta. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MAX_ESPERA_MS, MIN_ESPERA_MS } from './alertesMunicipals.js';
import { useRellotgeAlertes } from './useRellotgeAlertes.js';

const ARA = Date.parse('2026-11-01T12:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(ARA);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});

const munta = (propera, marca, opcions) => renderHook(({ p }) => useRellotgeAlertes(p, marca, opcions), { initialProps: { p: propera } });
const visibilitat = (estat) => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: estat });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
};

describe('el temporitzador', () => {
  test('marca just després de la caducitat, amb l’instant del toc; quan la caducitat canvia, es desarma', () => {
    const marca = vi.fn();
    const { rerender } = munta(ARA + 5000, marca);
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(marca).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(marca).toHaveBeenCalledTimes(1);
    expect(marca.mock.calls[0][0]).toBe(ARA + 5001);
    expect(marca.mock.calls[0][0]).toBeGreaterThan(ARA + 5000);
    // Torna a mirar fins que el pare recalcula; sense cap alerta, res.
    expect(vi.getTimerCount()).toBe(1);
    rerender({ p: null });
    expect(vi.getTimerCount()).toBe(0);
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(marca).toHaveBeenCalledTimes(1);
  });

  test('si després de marcar la caducitat no canvia (rellotge enrere entre el toc i el render), hi torna a mirar i marca quan toca', () => {
    const marca = vi.fn();
    munta(ARA + 5000, marca);
    act(() => { vi.advanceTimersByTime(5001); });
    expect(marca).toHaveBeenCalledTimes(1);
    // El pare ha repintat amb el rellotge de paret 4 s enrere: la mateixa
    // alerta encara és vigent i `propera` no ha canviat.
    vi.setSystemTime(ARA + 1001);
    act(() => { vi.advanceTimersByTime(MIN_ESPERA_MS); });
    // El toc arriba abans d'hora: no marca, torna a esperar.
    expect(marca).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(marca).toHaveBeenCalledTimes(2);
    expect(marca.mock.calls[1][0]).toBeGreaterThan(ARA + 5000);
  });

  test('sense caducitat (null), cap temporitzador ni cap escolta de la pestanya', () => {
    const marca = vi.fn();
    const escolta = vi.spyOn(document, 'addEventListener');
    munta(null, marca);
    expect(vi.getTimerCount()).toBe(0);
    expect(escolta.mock.calls.filter(([tipus]) => tipus === 'visibilitychange')).toEqual([]);
    visibilitat('visible');
    expect(marca).not.toHaveBeenCalled();
    escolta.mockRestore();
  });

  test('un canvi de caducitat neteja l’anterior i arma la nova', () => {
    const marca = vi.fn();
    const { rerender } = munta(ARA + 60_000, marca);
    rerender({ p: ARA + 10_000 });
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(10_001); });
    expect(marca).toHaveBeenCalledTimes(1);
    // El pare recalcula: la caducitat següent és d'ací a molt. El
    // temporitzador vell de 60 s ja no hi és: res fins a la nova.
    rerender({ p: ARA + 600_000 });
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(marca).toHaveBeenCalledTimes(1);
  });

  test('el desmuntatge neteja el temporitzador i l’escolta', () => {
    const marca = vi.fn();
    const { unmount } = munta(ARA + 5000, marca);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => { vi.advanceTimersByTime(10_000); });
    visibilitat('visible');
    expect(marca).not.toHaveBeenCalled();
  });

  test('si el toc arriba abans d’hora (rellotge de paret enrere), torna a esperar i no marca', () => {
    const marca = vi.fn();
    munta(ARA + 5000, marca);
    // El rellotge de paret recula 10 s just abans del toc.
    act(() => { vi.advanceTimersByTime(4000); });
    vi.setSystemTime(Date.now() - 10_000);
    act(() => { vi.advanceTimersByTime(1001); });
    expect(marca).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    // Ara espera els 10 s que han tornat a faltar, i marca just al final.
    act(() => { vi.advanceTimersByTime(9_999); });
    expect(marca).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(marca).toHaveBeenCalledTimes(1);
    expect(marca.mock.calls[0][0]).toBeGreaterThan(ARA + 5000);
  });

  test('una caducitat de més de 24,8 dies espera el sostre de setTimeout i torna a armar-se', () => {
    const marca = vi.fn();
    const llunyana = ARA + MAX_ESPERA_MS + 60_000;
    munta(llunyana, marca);
    act(() => { vi.advanceTimersByTime(MAX_ESPERA_MS); });
    expect(marca).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    act(() => { vi.advanceTimersByTime(60_001); });
    expect(marca).toHaveBeenCalledTimes(1);
  });
});

describe('la pestanya', () => {
  test('en tornar-hi (visible) després de la caducitat, marca l’instant d’ara; amagada, no', () => {
    const marca = vi.fn();
    munta(ARA + 3_600_000, marca);
    visibilitat('hidden');
    expect(marca).not.toHaveBeenCalled();
    vi.setSystemTime(ARA + 7_200_000);
    visibilitat('visible');
    expect(marca).toHaveBeenCalledTimes(1);
    expect(marca.mock.calls[0][0]).toBe(ARA + 7_200_000);
  });

  test('en tornar-hi abans de la caducitat, no marca (cap repintat sense canvis)', () => {
    const marca = vi.fn();
    munta(ARA + 3_600_000, marca);
    vi.setSystemTime(ARA + 1_800_000);
    visibilitat('visible');
    vi.setSystemTime(ARA + 3_600_000);
    visibilitat('visible');
    expect(marca).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
  });

  test('ara i doc injectats (referències estables): els usa en lloc del global', () => {
    const marca = vi.fn();
    const doc = new EventTarget();
    doc.visibilityState = 'visible';
    let instant = ARA + 42;
    const ara = () => instant;
    munta(ARA + 5000, marca, { ara, doc });
    instant = ARA + 6000;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(marca).not.toHaveBeenCalled();
    act(() => { doc.dispatchEvent(new Event('visibilitychange')); });
    expect(marca).toHaveBeenCalledWith(ARA + 6000);
  });
});
