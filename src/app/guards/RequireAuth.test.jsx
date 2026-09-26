import { afterEach, expect, test, vi } from 'vitest';
import { useEffect } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
/* Cadena real: SessionProvider → sessionService → identitat (sessionStorage).
   Només es falsegen el backend (el port) i l'arrencada de l'amfitrió.
   L'ordre importa: la primera prova és l'arrencada, amb el servei encara verge. */
const m = vi.hoisted(() => ({ rol: 'usuari', refresca: null, logout: null }));
vi.mock('../../data/backendPort.js', async () => {
  const identitat = await import('../../data/identitat.js');
  return {
    getCurrentUser: () => identitat.usuariDeSessio(),
    teCapacitat: () => true,
    elMeuRol: async () => m.rol,
    refrescaSessio: (...args) => m.refresca(...args),
    logout: (...args) => m.logout(...args),
    loginWithGoogle: vi.fn(), loginWithPassword: vi.fn(), registerWithPassword: vi.fn(), listMyOrganizations: vi.fn(),
  };
});
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
import { SessionProvider } from '../contexts/SessionContext';
import { MemoryRouter, Route, Routes, useLocation } from '../contexts/RouterContext';
import { RequireAuth } from './RequireAuth';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../../data/identitat.js';

m.refresca = vi.fn(); m.logout = vi.fn();
const b64u = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (segons) => `${b64u({ alg: 'none' })}.${b64u({ sub: 'A', exp: Math.floor(Date.now() / 1000) + segons })}.c2ln`;
const avisa = (user = null) => act(() => { window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user } })); });
function OnSoc() {
  const { pathname, search } = useLocation();
  return <output data-testid="on">{pathname + (search ? `?${search}` : '')}</output>;
}
// Com a App.jsx: la barrera viu dins d'una ruta, que es desmunta quan redirigix.
const munta = (rol) => render(
  <MemoryRouter>
    <SessionProvider>
      <OnSoc />
      <Routes>
        <Route path="/registre" element={<p>Pantalla de registre</p>} />
        <Route path="/" element={<RequireAuth rol={rol}><p>Contingut privat</p></RequireAuth>} />
      </Routes>
    </SessionProvider>
  </MemoryRouter>
);
const on = () => screen.getByTestId('on').textContent;
afterEach(() => { cleanup(); m.refresca.mockReset(); m.logout.mockReset(); m.rol = 'usuari'; });

test('en arrencar amb el JWT caducat i refresh token: càrrega, cap redirecció i després el contingut', async () => {
  configuraBackendSessio({});
  desaSessio({ access_token: jwt(-60), refresh_token: 'r1', user: { id: 'A' } });
  let acaba;
  m.refresca.mockImplementationOnce(() => new Promise(resolve => { acaba = resolve; }).then(() => {
    desaSessio({ access_token: jwt(3600), refresh_token: 'r2', user: { id: 'A' } });
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: { id: 'A' } } }));
    return true;
  }));
  munta();
  expect(screen.getByText('Comprovant la sessió…')).toBeTruthy();
  await vi.waitFor(() => expect(m.refresca).toHaveBeenCalledTimes(1));
  expect(screen.getByText('Comprovant la sessió…')).toBeTruthy();
  expect(screen.queryByText('Contingut privat')).toBeNull();
  expect(on()).toBe('/');
  await act(async () => { acaba(); });
  expect(await screen.findByText('Contingut privat')).toBeTruthy();
  expect(on()).toBe('/');
  expect(m.refresca).toHaveBeenCalledTimes(1);
});
test('sense sessió redirigix a /registre i guarda on anava', async () => {
  esborraSessio(); avisa();
  munta();
  await vi.waitFor(() => expect(on()).toBe('/registre?tornar=%2F'));
  expect(screen.queryByText('Contingut privat')).toBeNull();
});
test('amb un rol que no és el demanat mostra «Accés restringit» i no redirigix', async () => {
  desaSessio({ access_token: jwt(3600), refresh_token: 'r1', user: { id: 'A' } }); m.rol = 'usuari'; avisa({ id: 'A' });
  munta('superadmin');
  const alerta = await screen.findByRole('alert');
  expect(alerta.textContent).toContain('Accés restringit');
  expect(alerta.textContent).toContain('superadmin');
  expect(screen.queryByText('Contingut privat')).toBeNull();
  expect(on()).toBe('/');
});
test('amb el rol demanat mostra el contingut', async () => {
  desaSessio({ access_token: jwt(3600), refresh_token: 'r1', user: { id: 'A' } }); m.rol = 'superadmin'; avisa({ id: 'A' });
  munta('superadmin');
  expect(await screen.findByText('Contingut privat')).toBeTruthy();
  expect(screen.queryByRole('alert')).toBeNull();
});
test('la renovació del mateix compte torna a llegir el rol sense desmuntar el contingut', async () => {
  desaSessio({ access_token: jwt(3600), refresh_token: 'r1', user: { id: 'A' } }); m.rol = 'usuari'; avisa({ id: 'A' });
  let muntatges = 0;
  function Fill() { useEffect(() => { muntatges++; }, []); return <p>Contingut privat</p>; }
  render(
    <MemoryRouter><SessionProvider><Routes>
      <Route path="/" element={<RequireAuth><Fill /></RequireAuth>} />
    </Routes></SessionProvider></MemoryRouter>
  );
  expect(await screen.findByText('Contingut privat')).toBeTruthy();
  expect(muntatges).toBe(1);
  // Com auth.js: desa el JWT nou com a renovació i avisa.
  desaSessio({ access_token: jwt(3600), user: { id: 'A' } }, { renovacio: true });
  avisa({ id: 'A' });
  expect(screen.queryByText('Comprovant la sessió…')).toBeNull();
  expect(screen.getByText('Contingut privat')).toBeTruthy();
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByText('Contingut privat')).toBeTruthy();
  expect(muntatges).toBe(1);
  // Un altre compte, en canvi, espera la comprovació.
  desaSessio({ access_token: `${b64u({ alg: 'none' })}.${b64u({ sub: 'B', exp: Math.floor(Date.now() / 1000) + 3600 })}.c2ln`, user: { id: 'B' } });
  avisa({ id: 'B' });
  expect(screen.getByText('Comprovant la sessió…')).toBeTruthy();
});
test('si el servidor rebutja la renovació: una sola crida, fora i a /registre', async () => {
  esborraSessio(); avisa();
  desaSessio({ access_token: jwt(-60), refresh_token: 'r1', user: { id: 'A' } });
  m.refresca.mockResolvedValueOnce(false);
  m.logout.mockImplementationOnce(async () => { esborraSessio(); window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } })); });
  avisa();
  munta();
  await vi.waitFor(() => expect(on()).toBe('/registre?tornar=%2F'));
  expect(m.refresca).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Contingut privat')).toBeNull();
});
