import React, { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
const mock = vi.hoisted(() => ({ user: { id: 'A' }, epoch: 1, generation: 1,
  getProfile: vi.fn(), listMyOrganizations: vi.fn(), updateProfile: vi.fn(), updateOrganization: vi.fn(),
  updateUserPassword: vi.fn(), createOrganization: vi.fn(), uploadToStorage: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mock.user, generacio: mock.generation }) }));
vi.mock('../../data/identitat.js', () => ({ get versioSessio() { return mock.epoch; } }));
vi.mock('../../data/backendPort.js', () => ({ ...mock, getCurrentUser: () => mock.user, teCapacitat: () => true }));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
let value, snapshots;
function Probe() { value = usePerfil(); useLayoutEffect(() => { snapshots.push(value); }); return null; }
function tree(config) { return <StrictMode><PerfilProvider config={config}><Probe /></PerfilProvider></StrictMode>; }
function switchToB() { mock.user = { id: 'B' }; mock.epoch++; mock.generation++; }
beforeEach(() => {
  vi.clearAllMocks(); snapshots = []; mock.user = { id: 'A' }; mock.epoch = 1; mock.generation = 1;
  mock.getProfile.mockImplementation(async () => ({ id: mock.user?.id, full_name: `Perfil ${mock.user?.id}` }));
  mock.listMyOrganizations.mockImplementation(async () => [{ id: `org-${mock.user?.id}`, name: `Org ${mock.user?.id}` }]);
});
afterEach(cleanup);
async function open(config = { tenantId: 'poble-A', backendId: 'supabase' }) {
  const view = render(tree(config)); await waitFor(() => expect(value.carregant).toBe(false)); return { ...view, config };
}
it('A→B no mostra perfil ni organitzacions A en el primer render de B', async () => {
  const view = await open(); expect(value.identitats[0].nom).toBe('Perfil A');
  switchToB(); snapshots = []; view.rerender(tree(view.config));
  expect(snapshots[0].usuari).toBeNull();
  expect(snapshots[0].identitats.map(i => i.nom)).not.toContain('Perfil A');
  expect(snapshots[0].identitats.map(i => i.nom)).not.toContain('Org A');
  await waitFor(() => expect(value.identitats[0].nom).toBe('Perfil B'));
});
it('la càrrega inicial d’A resolta després de B no contamina B', async () => {
  const pending = deferred(); mock.getProfile.mockImplementation(() => mock.user.id === 'A' ? pending.promise : Promise.resolve({ id: 'B', full_name: 'Perfil B' }));
  const config = { tenantId: 'poble-A' }, view = render(tree(config));
  switchToB(); view.rerender(tree(config));
  await waitFor(() => expect(value.identitats[0].nom).toBe('Perfil B'));
  await act(async () => pending.resolve({ id: 'A', full_name: 'A tardà' }));
  expect(value.identitats[0].nom).toBe('Perfil B'); expect(value.error).toBeNull();
});
it('una mutació d’A pendent rebutja i no modifica B després del relleu', async () => {
  const view = await open(), pending = deferred(); mock.updateProfile.mockReturnValueOnce(pending.promise);
  const work = value.guardarCampPerfil('full_name', 'Nom vell', 'jo');
  const assertion = expect(work).rejects.toMatchObject({ name: 'AbortError' });
  switchToB(); view.rerender(tree(view.config));
  await waitFor(() => expect(value.identitats[0].nom).toBe('Perfil B'));
  await act(async () => { pending.resolve({ id: 'A', full_name: 'Nom vell' }); await assertion; });
  expect(value.identitats[0].nom).toBe('Perfil B');
});
it.each(['usuari', 'tenant', 'backend', 'generacio'])('cap callback antic inicia writes després de canviar %s', async change => {
  const view = await open(), old = value; let config = view.config;
  if (change === 'usuari') switchToB();
  if (change === 'tenant') config = { ...config, tenantId: 'poble-B' };
  if (change === 'backend') config = { ...config, backendId: 'altre' };
  if (change === 'generacio') mock.generation++;
  view.rerender(tree(config));
  await expect(old.guardarCampPerfil('full_name', 'antic', 'jo')).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.guardarAjust('jo', 'contrasenya', 'antic')).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.creaOrganitzacio({ name: 'Organització', slug: 'entitat' })).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.pujaMitja({ name: 'foto' })).rejects.toMatchObject({ name: 'AbortError' });
  expect(mock.updateProfile).not.toHaveBeenCalled(); expect(mock.updateUserPassword).not.toHaveBeenCalled();
  expect(mock.createOrganization).not.toHaveBeenCalled(); expect(mock.uploadToStorage).not.toHaveBeenCalled();
});
it('manté l’edició normal de la sessió vigent', async () => {
  await open(); mock.updateProfile.mockResolvedValue({ id: 'A', full_name: 'Nom nou' });
  await act(async () => value.guardarCampPerfil('full_name', 'Nom nou', 'jo'));
  expect(value.identitats[0].nom).toBe('Nom nou');
});
