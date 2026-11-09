import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import BotiguesSistema from './BotiguesSistema.jsx';

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const clipboard = value => Object.defineProperty(navigator, 'clipboard', { configurable: true, value });
beforeEach(() => clipboard(undefined));
afterEach(() => { cleanup(); if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard); else delete navigator.clipboard; });
const mount = () => render(<MemoryRouter><BotiguesSistema /></MemoryRouter>);

test('el cos real mostra12membres desconeguts i2/12 separat de14web, sense botó live fictici', () => {
  mount();
  expect(screen.getAllByText('Estat operatiu no verificat')).toHaveLength(12);
  expect(screen.getByText('2/12')).toBeTruthy();
  expect(screen.getByText('14')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Refresca/ })).toBeNull();
  expect(screen.getByRole('link', { name: 'WordPress.org: obri el canal configurat' }).href).toBe('https://wordpress.org/plugins/socdepoble/');
});

test('Clipboard absent no anuncia copiat', () => {
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Copia l’enllaç de proves' }));
  expect(screen.getByText(/No es pot copiar automàticament/)).toBeTruthy();
  expect(screen.queryByText(/Enllaç de proves copiat/)).toBeNull();
});

test.each(['sync', 'async'])('Clipboard rebutjat:%s no anuncia èxit', async (mode) => {
  clipboard({ writeText: mode === 'sync' ? () => { throw Error('denied'); } : () => Promise.reject(Error('denied')) });
  mount(); fireEvent.click(screen.getByRole('button', { name: 'Copia l’enllaç de proves' }));
  await screen.findByText(/No s’ha pogut copiar/);
  expect(screen.queryByText(/Enllaç de proves copiat/)).toBeNull();
});

test('la promesa pendent no és èxit i el doble clic no duplica l’acció; es confirma només després', async () => {
  let resolve; const writeText = vi.fn(() => new Promise(r => { resolve = r; })); clipboard({ writeText });
  mount(); const button = screen.getByRole('button', { name: 'Copia l’enllaç de proves' });
  fireEvent.click(button); fireEvent.click(button);
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith('https://play.google.com/apps/testing/org.socdepoble.app');
  expect(screen.queryByText(/Enllaç de proves copiat/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Copiant…' }).disabled).toBe(true);
  await act(async () => resolve());
  expect(screen.getByText(/Enllaç de proves copiat/)).toBeTruthy();
});

test('desmuntar no publica un resultat tardà ni reenvia res', async () => {
  let resolve; const writeText = vi.fn(() => new Promise(r => { resolve = r; })); clipboard({ writeText });
  const { unmount } = mount(); fireEvent.click(screen.getByRole('button', { name: 'Copia l’enllaç de proves' })); unmount();
  await act(async () => resolve());
  expect(document.querySelector('.sdp-botigues-sistema')).toBeNull();
  expect(writeText).toHaveBeenCalledTimes(1);
});
