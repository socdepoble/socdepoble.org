import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const m = vi.hoisted(() => ({ logout: vi.fn(() => Promise.resolve()) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => true, logout: m.logout, loginWithGoogle: vi.fn(), loginWithPassword: vi.fn(),
  registerWithPassword: vi.fn(), listMyOrganizations: vi.fn()
}));
vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => ({ usuari: { id: 'U' }, estat: 'dins', rol: 'usuari', generacio: 1 }),
  subscribeSession: () => () => {},
  setSessionConfig: () => () => {},
  renovaAra: vi.fn()
}));
import { SessionProvider, useSession } from './SessionContext.jsx';

const CONFIG = Object.freeze({ supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', tenantId: 'T' });

function BotoEixir({ amb }) {
  const { logout } = useSession();
  return <button type="button" onClick={amb === 'clic' ? logout : () => amb(logout)}>Eixir</button>;
}

beforeEach(() => m.logout.mockClear());
afterEach(cleanup);

test('D1 · logout() sense res revoca amb la configuració del proveïdor', () => {
  render(<SessionProvider config={CONFIG}><BotoEixir amb={(logout) => logout()} /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  expect(m.logout).toHaveBeenCalledWith(CONFIG, undefined);
});

test('D1 · un onClick={logout} no passa l’esdeveniment del clic com a configuració', () => {
  render(<SessionProvider config={CONFIG}><BotoEixir amb="clic" /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  expect(m.logout).toHaveBeenCalledTimes(1);
  expect(m.logout.mock.calls[0][0]).toBe(CONFIG);
});

test('D1 · una configuració explícita i l’abast de revocació arriben tal qual al port', () => {
  const altra = { supabaseUrl: 'https://altre.test', supabaseAnonKey: 'k' };
  render(<SessionProvider config={CONFIG}><BotoEixir amb={(logout) => logout(altra, { scope: 'global' })} /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  expect(m.logout).toHaveBeenCalledWith(altra, { scope: 'global' });
});

test('T18 · eixir amb un adaptador alternatiu conserva la configuració explícita', () => {
  const altra = { backendId: 'wordpress', backendUrl: 'https://poble.test/wp-json/sdp/v1', tenantId: 'T' };
  render(<SessionProvider config={CONFIG}><BotoEixir amb={(logout) => logout(altra, { abast: 'pestanya' })} /></SessionProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir' }));
  expect(m.logout).toHaveBeenCalledWith(altra, { abast: 'pestanya' });
});
