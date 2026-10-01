import React, { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PerfilProvider, usePerfil, ajustosPersona, ajustosOrganitzacio } from './PerfilContext.jsx';
const mock = vi.hoisted(() => ({ user: { id: 'A' }, epoch: 1, generation: 1, entrada: 1,
  getProfile: vi.fn(), listMyOrganizations: vi.fn(), updateProfile: vi.fn(), updateOrganization: vi.fn(),
  updateUserPassword: vi.fn(), createOrganization: vi.fn(), uploadToStorage: vi.fn(),
  /* T43 · el correu opcional de l'organització (capacitat 'contacteOrganitzacio'). */
  llegeixContacteOrganitzacio: vi.fn(), desaContacteOrganitzacio: vi.fn()
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
/* `portSenseUsuari`: el JWT ha caducat i es renova. El port diu «ningú», però la sessió de React continua dins. */
vi.mock('../../data/backendPort.js', () => ({ ...mock, getCurrentUser: () => (mock.portSenseUsuari ? null : mock.user), teCapacitat: () => true }));
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
let value, snapshots;
function Probe() { value = usePerfil(); useLayoutEffect(() => { snapshots.push(value); }); return null; }
let avis;
function tree(config) { return <StrictMode><PerfilProvider config={config} onCanviOrganitzacions={avis}><Probe /></PerfilProvider></StrictMode>; }
function switchToB() { mock.user = { id: 'B' }; mock.epoch++; mock.generation++; mock.entrada++; }
beforeEach(async () => {
  await cuaDesament.reinicia();
  vi.clearAllMocks(); snapshots = []; avis = undefined; mock.user = { id: 'A' }; mock.epoch = 1; mock.generation = 1; mock.entrada = 1;
  mock.portSenseUsuari = false;
  mock.getProfile.mockImplementation(async () => ({ id: mock.user?.id, full_name: `Perfil ${mock.user?.id}` }));
  mock.listMyOrganizations.mockImplementation(async () => [{ id: `org-${mock.user?.id}`, name: `Org ${mock.user?.id}` }]);
  mock.llegeixContacteOrganitzacio.mockImplementation(async () => ({ correu: '', public: false, perDefecte: { origen: 'cap', correu: null } }));
  mock.desaContacteOrganitzacio.mockImplementation(async (id, dades) => ({ ...dades, perDefecte: { origen: 'cap', correu: null } }));
});
afterEach(cleanup);
async function open(config = { tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase' }) {
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
  const config = { tenantId: '00000000-0000-0000-0000-00000000000a' }, view = render(tree(config));
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
  if (change === 'tenant') config = { ...config, tenantId: '00000000-0000-0000-0000-00000000000b' };
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

/* ── T47 (ordre del Mestre, 260928) · correccions de la revisió ── */

it('T47 · una confirmació de la cua mentre es llig el perfil no la trepitja la lectura feta abans del PATCH', async () => {
  const orgs = deferred();
  mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Perfil A', lema: 'Vell' }));
  mock.listMyOrganizations.mockImplementation(() => orgs.promise);
  mock.updateProfile.mockImplementation(async (canvis) => ({ id: 'A', full_name: 'Perfil A', lema: 'Vell', ...canvis }));
  render(tree({ tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase' }));
  expect(value.carregant).toBe(true);
  // Un esborrany d'una visita anterior ix (reintent, 'online', entrada de sessió) mentre es llig.
  const ref = { ...value.autodesament, entitat: 'perfil', id: 'jo' };
  cuaDesament.encua(ref, 'lead', 'Nou');
  let desat;
  await act(async () => { desat = await cuaDesament.desaAra(ref, 'lead'); });
  expect(desat).toBe(true);
  expect(mock.updateProfile).toHaveBeenCalledWith({ lema: 'Nou' }, expect.any(Object));
  // L'esborrany ja s'ha oblidat: només la fitxa pot dir el valor nou.
  expect(cuaDesament.llig(ref).camps).toEqual({});
  await act(async () => { orgs.resolve([]); });
  await waitFor(() => expect(value.carregant).toBe(false));
  expect(value.identitats[0].dades.lema).toBe('Nou');
});

it('T47 · l’àmbit dels esborranys és el de la sessió de React encara que el port no diga ningú; el pendent ix quan la sessió es renova', async () => {
  mock.portSenseUsuari = true;                             // JWT caducat, renovació en camí
  const { config } = await open();
  expect(value.autodesament.ambit).toBe(ambitDe(config, 'A'));
  mock.updateProfile.mockResolvedValue({ id: 'A', lema: 'Del Comtat' });
  const ref = { ...value.autodesament, entitat: 'perfil', id: 'jo' };
  cuaDesament.encua(ref, 'lead', 'Del Comtat');
  let desat;
  await act(async () => { desat = await cuaDesament.desaAra(ref, 'lead'); });
  expect(desat).toBe(false);
  expect(mock.updateProfile).not.toHaveBeenCalled();
  mock.portSenseUsuari = false;                            // la renovació aterra i ho avisa
  await act(async () => {
    window.dispatchEvent(new CustomEvent('sdp:auth-change'));
    await new Promise((resolve) => { setTimeout(resolve, 0); });
  });
  expect(mock.updateProfile).toHaveBeenCalledWith({ lema: 'Del Comtat' }, expect.any(Object));
  await waitFor(() => expect(value.identitats[0].dades.lema).toBe('Del Comtat'));
});

/* ── Catàleg per llocs, creació d'organitzacions i avís al selector ── */

it('cada ajust del catàleg diu si viu a la fitxa o al compte', () => {
  expect(ajustosPersona().map(a => [a.id, a.lloc])).toEqual([['nom', 'fitxa'], ['avatar', 'fitxa'],
    ['correu', 'compte'], ['privacitat', 'compte'], ['contrasenya', 'compte'], ['sessio', 'compte']]);
  const org = ajustosOrganitzacio({ role: 'owner', slug: 'forn' });
  expect(org.filter(a => a.lloc === 'fitxa').map(a => a.id)).toEqual(['nom', 'avatar', 'lema', 'descripcio']);
  /* T43 (ordre del Mestre, 260928) · el correu opcional va primer al compte. */
  expect(org.filter(a => a.lloc === 'compte').map(a => a.id)).toEqual(['correu', 'correu-public', 'membres', 'identificador', 'fitxa', 'eixir']);
  expect(org.find(a => a.id === 'fitxa').pendent).toBe(true);
});

/* ── T43 (ordre del Mestre, 260928) · el correu opcional de l'organització ── */

it('T43 · el valor del correu només arriba a qui administra; un membre rep buit i tancat', () => {
  const contacte = { estat: 'llest', correu: 'forn@x.cat', public: true, perDefecte: { origen: 'cap', correu: null } };
  const membre = ajustosOrganitzacio({ role: 'member', contacte });
  expect(membre.find(a => a.id === 'correu')).toMatchObject({ valor: '', obert: false, tipus: 'correu' });
  expect(membre.find(a => a.id === 'correu-public')).toMatchObject({ valor: false, obert: false });
  expect(JSON.stringify(membre)).not.toContain('forn@x.cat');
  const owner = ajustosOrganitzacio({ role: 'owner' }, contacte);
  expect(owner.find(a => a.id === 'correu')).toMatchObject({ valor: 'forn@x.cat', obert: true });
  expect(owner.find(a => a.id === 'correu').ajuda).toContain('no rebrà avisos per correu');
  expect(owner.find(a => a.id === 'correu-public')).toMatchObject({ valor: true, obert: true, casella: 'Mostrar el correu a la fitxa pública' });
  /* Sense lectura encara, o sense servidor, tancat i amb el motiu. */
  expect(ajustosOrganitzacio({ role: 'admin' }).find(a => a.id === 'correu')).toMatchObject({ obert: false, motiu: 'Carregant el correu de l’organització…' });
  expect(ajustosOrganitzacio({ role: 'admin' }, { estat: 'no-disponible', motiu: 'Sense servidor.' }).find(a => a.id === 'correu'))
    .toMatchObject({ obert: false, valor: '', motiu: 'Sense servidor.' });
});

it('T43 · llig el correu NOMÉS de les organitzacions que administra, i el desa amb el «públic»', async () => {
  mock.listMyOrganizations.mockResolvedValue([
    { id: 'O', name: 'Forn', kind: 'company', role: 'owner' },
    { id: 'M', name: 'Colla', kind: 'company', role: 'member' }
  ]);
  mock.llegeixContacteOrganitzacio.mockResolvedValue({ correu: 'Forn@X.cat', public: false, perDefecte: { origen: 'creador', correu: null } });
  await open();
  await waitFor(() => expect(value.contactes.O?.estat).toBe('llest'));
  /* StrictMode pot repetir l'efecte; el que importa és que mai es demana el d'un membre. */
  expect([...new Set(mock.llegeixContacteOrganitzacio.mock.calls.map((crida) => crida[0]))]).toEqual(['O']);
  expect(value.contactes.O).toMatchObject({ correu: 'forn@x.cat', public: false });
  expect(value.contactes.M).toBeUndefined();

  await act(async () => value.guardarAjust('O', 'correu-public', true));
  expect(mock.desaContacteOrganitzacio).toHaveBeenCalledWith('O', { correu: 'forn@x.cat', public: true }, expect.any(Object));
  expect(value.contactes.O).toMatchObject({ estat: 'llest', correu: 'forn@x.cat', public: true });
  /* Buidar el correu apaga el «públic»: no hi ha res a mostrar. */
  await act(async () => value.guardarAjust('O', 'correu', ''));
  expect(mock.desaContacteOrganitzacio).toHaveBeenLastCalledWith('O', { correu: '', public: false }, expect.any(Object));
  await expect(value.guardarAjust('O', 'correu', 'no és un correu')).rejects.toThrow('Escriu un correu vàlid');
  /* Un membre no pot desar-lo. */
  await expect(value.guardarAjust('M', 'correu', 'a@b.cat')).rejects.toThrow('Només qui administra');
  expect(mock.updateOrganization).not.toHaveBeenCalled();
});

it('T43b-4 · si deixa d’administrar-ne cap, el correu llegit abans s’oblida (minimització)', async () => {
  mock.listMyOrganizations.mockResolvedValue([{ id: 'O', name: 'Forn', kind: 'company', role: 'owner' }]);
  mock.llegeixContacteOrganitzacio.mockResolvedValue({ correu: 'forn@x.cat', public: false, perDefecte: { origen: 'cap', correu: null } });
  await open();
  await waitFor(() => expect(value.contactes.O?.estat).toBe('llest'));
  mock.listMyOrganizations.mockResolvedValue([{ id: 'O', name: 'Forn', kind: 'company', role: 'member' }]);
  await act(async () => { value.recarrega(); });
  await waitFor(() => expect(value.contactes).toEqual({}));
});

it('T43 · un esquema absent es diu amb el motiu de l’adaptador, sense error cru', async () => {
  mock.listMyOrganizations.mockResolvedValue([{ id: 'O', name: 'Forn', kind: 'company', role: 'admin' }]);
  mock.llegeixContacteOrganitzacio.mockRejectedValue(Object.assign(new Error('El servidor d’este poble encara no desa el correu de les organitzacions.'), { code: 'NO-DISPONIBLE' }));
  await open();
  await waitFor(() => expect(value.contactes.O?.estat).toBe('no-disponible'));
  expect(value.contactes.O.motiu).toBe('El servidor d’este poble encara no desa el correu de les organitzacions.');
  expect(value.error).toBeNull();
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
  mock.listMyOrganizations.mockResolvedValue([{ id: 'org-A', name: 'Forn', kind: 'company', role: 'admin' }]);
  await open();
  mock.createOrganization.mockResolvedValue({ id: 'G', name: 'Colla', kind: 'group' });
  await act(async () => { await value.creaOrganitzacio({ name: 'Colla', slug: 'colla', kind: 'group', parentOrganizationId: 'org-A' }); });
  expect(mock.createOrganization.mock.calls[0][0]).toMatchObject({ kind: 'group', parentOrganizationId: 'org-A' });
  expect(value.identitats.at(-1)).toMatchObject({ id: 'G', mena: 'grup' });
});

it('un reintent selecciona la mateixa organització sense duplicar-la ni ascendir el rol', async () => {
  mock.listMyOrganizations.mockResolvedValue([{ id: 'O', name: 'Forn', kind: 'company', role: 'admin' }]);
  await open();
  mock.createOrganization.mockResolvedValue({ id: 'O', name: 'Forn', kind: 'company' });
  await act(async () => value.creaOrganitzacio({ name: 'Forn', slug: 'forn' }));
  await act(async () => value.creaOrganitzacio({ name: 'Forn', slug: 'forn' }));
  expect(value.identitats.filter((i) => i.id === 'O')).toHaveLength(1);
  expect(value.identitats.find((i) => i.id === 'O').dades.role).toBe('admin');
});

it.each(['usuari', 'tenant'])('una alta pendent es descarta si canvia %s', async (canvi) => {
  avis = vi.fn();
  const view = await open(), pendent = deferred();
  mock.createOrganization.mockReturnValueOnce(pendent.promise);
  const alta = value.creaOrganitzacio({ name: 'Forn', slug: 'forn' });
  const comprova = expect(alta).rejects.toMatchObject({ name: 'AbortError' });
  if (canvi === 'usuari') switchToB();
  const config = canvi === 'tenant' ? { ...view.config, tenantId: '00000000-0000-0000-0000-00000000000b' } : view.config;
  view.rerender(tree(config));
  await waitFor(() => expect(value.carregant).toBe(false));
  await act(async () => { pendent.resolve({ id: 'N', name: 'Forn', kind: 'company' }); await comprova; });
  expect(value.identitats.some((i) => i.id === 'N')).toBe(false);
  expect(avis).not.toHaveBeenCalled();
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

it('T47 · amb el JWT caducat en muntar (el port diu «ningú»), el correu i el nom de reserva venen de la sessió de React', async () => {
  mock.user = { id: 'A', email: 'a@poble.test', user_metadata: { name: 'Pep de la sessió' } };
  mock.portSenseUsuari = true;
  mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: '' }));
  await open();
  expect(value.usuari).toMatchObject({ id: 'A', email: 'a@poble.test' });
  expect(value.identitats[0].dades.email).toBe('a@poble.test');
  expect(value.identitats[0].nom).toBe('Pep de la sessió');
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
