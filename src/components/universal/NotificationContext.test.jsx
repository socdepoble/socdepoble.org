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

/* Onada R30 · A2-LLEI06 · L'avís no penja mai del <body> del document: va al node que declara
   l'entrada (targetNode: el #root, l'arrel ombra) o, sense node, es pinta dins de l'arbre del
   proveïdor (LLEI_06). */
test('amb targetNode, l’avís va al node declarat; sense, es pinta dins de l’arbre i no penja del <body>', () => {
  let mostra = null;
  function Disparador() {
    mostra = useToast().showToast;
    return null;
  }
  const desti = document.createElement('div');
  document.body.appendChild(desti);
  const declarat = render(<NotificationProvider targetNode={desti}><Disparador /></NotificationProvider>);
  act(() => { mostra('Al node declarat', 'success'); });
  expect(desti.querySelector(':scope > .sdp-toast-container [role="alert"]')?.textContent).toBe('Al node declarat');
  expect(declarat.container.querySelector('.sdp-toast-container')).toBeNull();
  declarat.unmount();
  desti.remove();

  const { container } = render(<div data-arbre=""><NotificationProvider><Disparador /></NotificationProvider></div>);
  act(() => { mostra('Al seu lloc', 'success'); });
  const caixa = screen.getByRole('alert').closest('.sdp-toast-container');
  expect(caixa).not.toBeNull();
  expect(container.querySelector('[data-arbre]').contains(caixa)).toBe(true);
  expect(caixa.parentElement).not.toBe(document.body);
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
