/* T10 (ordre del Mestre, 261001) · L'hora d'ara, renovada al canvi de cada
   minut amb un sol setTimeout alineat, que es neteja en desmuntar. */
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useAra } from './useAra.js';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0, 45));
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

function Rellotge({ actiu }) {
  const ara = useAra({ actiu });
  return <span data-testid="ara">{`${ara.getHours()}:${ara.getMinutes()}`}</span>;
}

test('es renova al canvi de minut del rellotge, no 60 s després de muntar-se', () => {
  const { getByTestId } = render(<Rellotge />);
  expect(getByTestId('ara').textContent).toBe('12:0');
  act(() => { vi.advanceTimersByTime(14999); });
  expect(getByTestId('ara').textContent).toBe('12:0');
  act(() => { vi.advanceTimersByTime(1); });
  expect(getByTestId('ara').textContent).toBe('12:1');
  act(() => { vi.advanceTimersByTime(60000); });
  expect(getByTestId('ara').textContent).toBe('12:2');
  expect(vi.getTimerCount()).toBe(1);
});

test('inactiu, cap temporitzador; en tornar a ser actiu, l’hora es renova de seguida', () => {
  const { getByTestId, rerender } = render(<Rellotge actiu={false} />);
  expect(vi.getTimerCount()).toBe(0);
  act(() => { vi.setSystemTime(new Date(2026, 9, 1, 12, 7, 10)); });
  rerender(<Rellotge actiu />);
  expect(getByTestId('ara').textContent).toBe('12:7');
  expect(vi.getTimerCount()).toBe(1);
});

test('en desmuntar, el temporitzador es neteja', () => {
  const { unmount } = render(<Rellotge />);
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · el rellotge viu
   de la barra taronja: un rellotge injectat, i la resincronització en tornar
   a primer pla (auditoria Codex 261013_1510, §2). */
function RellotgeInjectat({ rellotge }) {
  const ara = useAra({ rellotge });
  return <span data-testid="ara">{`${ara.getHours()}:${ara.getMinutes()}:${ara.getSeconds()}`}</span>;
}

const posaVisibilitat = (estat) => Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => estat });
afterEach(() => { delete document.visibilityState; });

test('amb un rellotge injectat, l’hora és la seua i el temporitzador s’alinea al seu minut', () => {
  let ms = new Date(2026, 9, 13, 9, 59, 30).getTime();
  const { getByTestId } = render(<RellotgeInjectat rellotge={() => ms} />);
  expect(getByTestId('ara').textContent).toBe('9:59:30');
  /* El del dispositiu (12:00:45) en faltarien 15 s; el injectat, 30 s. */
  act(() => { vi.advanceTimersByTime(29999); });
  expect(getByTestId('ara').textContent).toBe('9:59:30');
  ms += 30000;
  act(() => { vi.advanceTimersByTime(1); });
  expect(getByTestId('ara').textContent).toBe('10:0:0');
  expect(vi.getTimerCount()).toBe(1);
});

test('un rellotge escrit en línia, que canvia d’identitat a cada pintada, no fa cap bucle: un sol temporitzador', () => {
  const ms = new Date(2026, 9, 13, 9, 59, 30).getTime();
  let pintades = 0;
  function Pare({ n }) {
    pintades += 1;
    return <><RellotgeInjectat rellotge={() => ms} /><i>{n}</i></>;
  }
  const { rerender, getByTestId } = render(<Pare n={1} />);
  rerender(<Pare n={2} />);
  rerender(<Pare n={3} />);
  expect(pintades).toBe(3);
  expect(vi.getTimerCount()).toBe(1);
  expect(getByTestId('ara').textContent).toBe('9:59:30');
});

test('un rellotge que no torna un instant vàlid no trenca res: mana el del dispositiu', () => {
  const text = render(<RellotgeInjectat rellotge={() => 'no és cap hora'} />);
  expect(text.getByTestId('ara').textContent).toBe('12:0:45');
  cleanup();
  const nan = render(<RellotgeInjectat rellotge={() => Number.NaN} />);
  expect(nan.getByTestId('ara').textContent).toBe('12:0:45');
  expect(vi.getTimerCount()).toBe(1);
});

test('en tornar a primer pla, l’hora es renova de seguida i el temporitzador es torna a alinear; amagada, no', () => {
  const { getByTestId } = render(<Rellotge />);
  expect(getByTestId('ara').textContent).toBe('12:0');
  /* La pestanya amagada: el navegador alenteix el temporitzador i el rellotge del sistema avança sol. */
  posaVisibilitat('hidden');
  act(() => { vi.setSystemTime(new Date(2026, 9, 1, 12, 9, 20)); });
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  expect(getByTestId('ara').textContent).toBe('12:0');
  posaVisibilitat('visible');
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  expect(getByTestId('ara').textContent).toBe('12:9');
  expect(vi.getTimerCount()).toBe(1);
  /* Alineat al minut nou: 40 s des de 12:09:20, no els 15 s que quedaven del programa d'abans. */
  act(() => { vi.advanceTimersByTime(39999); });
  expect(getByTestId('ara').textContent).toBe('12:9');
  act(() => { vi.advanceTimersByTime(1); });
  expect(getByTestId('ara').textContent).toBe('12:10');
});

test('en desmuntar, tampoc no escolta la visibilitat; inactiu, no l’escolta mai', () => {
  const afig = vi.spyOn(document, 'addEventListener');
  const lleva = vi.spyOn(document, 'removeEventListener');
  const { unmount } = render(<Rellotge />);
  const escoltes = afig.mock.calls.filter(([nom]) => nom === 'visibilitychange');
  expect(escoltes).toHaveLength(1);
  unmount();
  expect(lleva.mock.calls.filter(([nom, funcio]) => nom === 'visibilitychange' && funcio === escoltes[0][1])).toHaveLength(1);
  afig.mockClear();
  render(<Rellotge actiu={false} />);
  expect(afig.mock.calls.filter(([nom]) => nom === 'visibilitychange')).toHaveLength(0);
  afig.mockRestore();
  lleva.mockRestore();
});
