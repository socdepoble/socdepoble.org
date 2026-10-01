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
