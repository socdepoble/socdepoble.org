import React, { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PerfilProvider, usePerfil, ajustosPersona, ajustosOrganitzacio } from './PerfilContext.jsx';
const mock = vi.hoisted(() => ({ user: { id: 'A' }, epoch: 1, generation: 1, entrada: 1,
  getProfile: vi.fn(), listMyOrganizations: vi.fn(), updateProfile: vi.fn(), updateOrganization: vi.fn(),
  updateUserPassword: vi.fn(), createOrganization: vi.fn(), uploadToStorage: vi.fn()
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mock.user, generacio: mock.generation }) }));
/* Com identitat.js: l'entrada només es mou en eixir o tornar a entrar; la renovació mou epoch i generació. */
vi.mock('../../data/identitat.js', () => ({
  get versioSessio() { return mock.epoch; },
  entradaSessio: () => mock.entrada,
  capturaSessio: () => {
    const entrada = mock.entrada, actor = mock.user?.id;
    return () => { if (entrada !== mock.entrada || actor !== mock.user?.id) throw new DOMException('La sessió ha canviat.', 'AbortError'); };
  },
}));
vi.mock('../../data/backendPort.js', () => ({ ...mock, getCurrentUser: () => mock.user, teCapacitat: () => true }));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
let value, snapshots;
function Probe() { value = usePerfil(); useLayoutEffect(() => { snapshots.push(value); }); return null; }
let avis;
function tree(config) { return <StrictMode><PerfilProvider config={config} onCanviOrganitzacions={avis}><Probe /></PerfilProvider></StrictMode>; }
function switchToB() { mock.user = { id: 'B' }; mock.epoch++; mock.generation++; mock.entrada++; }
beforeEach(() => {
  vi.clearAllMocks(); snapshots = []; avis = undefined; mock.user = { id: 'A' }; mock.epoch = 1; mock.generation = 1; mock.entrada = 1;
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
it.each(['usuari', 'tenant', 'backend', 'entrada'])('cap callback antic inicia writes després de canviar %s', async change => {
  const view = await open(), old = value; let config = view.config;
  if (change === 'usuari') switchToB();
  if (change === 'tenant') config = { ...config, tenantId: 'poble-B' };
  if (change === 'backend') config = { ...config, backendId: 'altre' };
  // Eixir i tornar a entrar amb el mateix compte: entrada nova.
  if (change === 'entrada') { mock.epoch++; mock.generation++; mock.entrada++; }
  view.rerender(tree(config));
  await expect(old.guardarCampPerfil('full_name', 'antic', 'jo')).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.guardarAjust('jo', 'contrasenya', 'antic')).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.creaOrganitzacio({ name: 'Organització', slug: 'entitat' })).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.pujaMitja({ name: 'foto' })).rejects.toMatchObject({ name: 'AbortError' });
  expect(mock.updateProfile).not.toHaveBeenCalled(); expect(mock.updateUserPassword).not.toHaveBeenCalled();
  expect(mock.createOrganization).not.toHaveBeenCalled(); expect(mock.uploadToStorage).not.toHaveBeenCalled();
});
it('la renovació del JWT (generació nova, mateixa entrada) no desmunta el perfil ni avorta el desat', async () => {
  const view = await open(), abans = value, lectures = mock.getProfile.mock.calls.length;
  mock.updateProfile.mockResolvedValue({ id: 'A', lema: 'Del Comtat' });
  mock.epoch++; mock.generation++;                       // el que fa desaSessio({ renovacio: true })
  view.rerender(tree(view.config));
  expect(value.carregant).toBe(false);
  expect(mock.getProfile).toHaveBeenCalledTimes(lectures);   // cap càrrega nova: el mateix àmbit
  await act(async () => abans.guardarCampPerfil('lema', 'Del Comtat', 'jo'));
  expect(mock.updateProfile).toHaveBeenCalledWith({ lema: 'Del Comtat' }, expect.any(Object));
});
it('manté l’edició normal de la sessió vigent', async () => {
  await open(); mock.updateProfile.mockResolvedValue({ id: 'A', full_name: 'Nom nou' });
  await act(async () => value.guardarCampPerfil('full_name', 'Nom nou', 'jo'));
  expect(value.identitats[0].nom).toBe('Nom nou');
});

/* ── Catàleg per llocs, creació d'organitzacions i avís al selector ── */

it('cada ajust del catàleg diu si viu a la fitxa o al compte', () => {
  expect(ajustosPersona().map(a => [a.id, a.lloc])).toEqual([['nom', 'fitxa'], ['avatar', 'fitxa'],
    ['correu', 'compte'], ['privacitat', 'compte'], ['contrasenya', 'compte'], ['sessio', 'compte']]);
  const org = ajustosOrganitzacio({ role: 'owner', slug: 'forn' });
  expect(org.filter(a => a.lloc === 'fitxa').map(a => a.id)).toEqual(['nom', 'avatar', 'lema', 'descripcio']);
  expect(org.filter(a => a.lloc === 'compte').map(a => a.id)).toEqual(['membres', 'identificador', 'fitxa', 'eixir']);
  expect(org.find(a => a.id === 'fitxa').pendent).toBe(true);
});

it('un grup sense empresa mare no arriba al servidor', async () => {
  await open();
  await expect(value.creaOrganitzacio({ name: 'Colla', slug: 'colla', kind: 'group' })).rejects.toThrow('Un grup necessita una empresa mare.');
  await expect(value.creaOrganitzacio({ name: 'Ajuntament', slug: 'ajuntament', kind: 'city_hall' })).rejects.toThrow('Tipus d’organització no vàlid.');
  expect(mock.createOrganization).not.toHaveBeenCalled();
});

it('crear una organització avisa el selector, la fa propietària i no muta la resposta', async () => {
  avis = vi.fn();
  await open();
  const resposta = { id: 'O', name: 'Forn', slug: 'forn', kind: 'company' };
  mock.createOrganization.mockResolvedValue(resposta);
  let nova;
  await act(async () => { nova = await value.creaOrganitzacio({ name: 'Forn', slug: 'forn', kind: 'company' }); });
  expect(mock.createOrganization).toHaveBeenCalledWith({ name: 'Forn', slug: 'forn', kind: 'company' }, expect.any(Object));
  expect(avis).toHaveBeenCalledTimes(1);
  expect(nova).toEqual({ ...resposta, role: 'owner' });
  expect(resposta).not.toHaveProperty('role');
  expect(value.identitats.at(-1)).toMatchObject({ id: 'O', mena: 'empresa', rol: 'Propietari' });
});

it('un grup amb mare envia la mare', async () => {
  await open();
  mock.createOrganization.mockResolvedValue({ id: 'G', name: 'Colla', kind: 'group' });
  await act(async () => { await value.creaOrganitzacio({ name: 'Colla', slug: 'colla', kind: 'group', parentOrganizationId: 'org-A' }); });
  expect(mock.createOrganization.mock.calls[0][0]).toMatchObject({ kind: 'group', parentOrganizationId: 'org-A' });
  expect(value.identitats.at(-1)).toMatchObject({ id: 'G', mena: 'grup' });
});

it('si el servidor no confirma l’organització, ho diu', async () => {
  await open();
  mock.createOrganization.mockResolvedValue(null);
  await expect(value.creaOrganitzacio({ name: 'Forn', slug: 'forn' })).rejects.toThrow('El servidor no ha confirmat l’organització.');
});

it('reanomenar una organització també avisa el selector', async () => {
  avis = vi.fn();
  await open();
  mock.updateOrganization.mockResolvedValue({ id: 'org-A', name: 'Org nova' });
  await act(async () => value.guardarCampPerfil('name', 'Org nova', 'org-A'));
  expect(mock.updateOrganization).toHaveBeenCalledWith('org-A', { name: 'Org nova' }, expect.any(Object));
  expect(avis).toHaveBeenCalledTimes(1);
  expect(value.identitats[1].nom).toBe('Org nova');
});

it('la persona porta el correu de la sessió i recarrega torna a llegir sense pantalla de càrrega', async () => {
  mock.user = { id: 'A', email: 'a@poble.test' };
  await open();
  expect(value.identitats[0].dades.email).toBe('a@poble.test');
  mock.getProfile.mockResolvedValue({ id: 'A', full_name: 'Restaurat' });
  act(() => value.recarrega());
  expect(value.carregant).toBe(false);
  await waitFor(() => expect(value.identitats[0].nom).toBe('Restaurat'));
});
