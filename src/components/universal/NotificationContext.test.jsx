/* Auditoria 261007 (B) · El valor de NotificationProvider és estable: mostrar
   o tancar un avís no torna a pintar els consumidors de useToast (cada
   targeta, AppShell i, per ell, el TopBar). Abans `value={{ showToast }}` era
   un objecte nou a cada setToast. */
import React, { memo } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { NotificationProvider, useToast } from './NotificationContext.jsx';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test('mostrar i tancar un avís no torna a pintar els consumidors ni canvia el valor', () => {
  vi.useFakeTimers();
  const valors = [];
  const Consumidor = memo(function Consumidor() {
    valors.push(useToast());
    return null;
  });
  render(<NotificationProvider><Consumidor /></NotificationProvider>);
  expect(valors).toHaveLength(1);
  const [{ showToast }] = valors;

  act(() => { showToast('Desat', 'success', 1000); });
  expect(screen.getByRole('alert').textContent).toBe('Desat');
  // L'avís es tanca (durada) i es desmunta 300 ms després.
  act(() => { vi.advanceTimersByTime(1000); });
  act(() => { vi.advanceTimersByTime(300); });
  expect(screen.queryByRole('alert')).toBeNull();

  expect(valors).toHaveLength(1);
});

test('el valor és el mateix objecte entre pintats del proveïdor', () => {
  const valors = [];
  function Consumidor() {
    valors.push(useToast());
    return null;
  }
  const { rerender } = render(<NotificationProvider><Consumidor /></NotificationProvider>);
  rerender(<NotificationProvider><Consumidor /></NotificationProvider>);
  expect(valors.length).toBeGreaterThan(1);
  expect(valors.every((valor) => valor === valors[0])).toBe(true);
  expect(typeof valors[0].showToast).toBe('function');
});
