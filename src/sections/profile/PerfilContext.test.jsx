import React, { StrictMode, useLayoutEffect } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  ERROR_SENSE_POBLE_PERSONA, PerfilProvider, usePerfil, ajustosPersona, ajustosOrganitzacio, opcionsDePoble, valorDePoblePersona,
} from './PerfilContext.jsx';
const mock = vi.hoisted(() => ({ user: { id: 'A' }, epoch: 1, generation: 1, entrada: 1,
  getProfile: vi.fn(), listMyOrganizations: vi.fn(), updateProfile: vi.fn(), updateOrganization: vi.fn(),
  updateUserPassword: vi.fn(), createOrganization: vi.fn(), uploadToStorage: vi.fn(),
  /* T43 · el correu opcional de l'organització (capacitat 'contacteOrganitzacio'). */
  llegeixContacteOrganitzacio: vi.fn(), desaContacteOrganitzacio: vi.fn(),
  /* Grup C (261008) · els membres (capacitat 'membresOrganitzacio') i el padró del nucli. */
  llistaMembresOrganitzacio: vi.fn(), desaMembreOrganitzacio: vi.fn(), llevaMembreOrganitzacio: vi.fn(), carregaMembres: vi.fn(),
  senseCapacitats: new Set()
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
vi.mock('../../data/backendPort.js', () => ({ ...mock, getCurrentUser: () => (mock.portSenseUsuari ? null : mock.user), teCapacitat: (nom) => !mock.senseCapacitats.has(nom) }));
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import { desaLlicenciaPerDefecte, llegixLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
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
  mock.senseCapacitats = new Set();
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
  /* Pla 261016 (Bloc 3.1) i Pla 261018 (Tasca 2) · Canvis deliberats: poble i drets de sèrie de les notes al compte.
     Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 2 (l’ajust «Poble» de la persona, al compte). */
  expect(ajustosPersona().map(a => [a.id, a.lloc])).toEqual([['nom', 'fitxa'], ['avatar', 'fitxa'],
    ['poble', 'compte'], ['correu', 'compte'], ['privacitat', 'compte'], ['drets-notes', 'compte'], ['contrasenya', 'compte'], ['sessio', 'compte']]);
  const org = ajustosOrganitzacio({ role: 'owner', slug: 'forn' });
  expect(org.filter(a => a.lloc === 'fitxa').map(a => a.id)).toEqual(['nom', 'avatar', 'lema', 'descripcio']);
  /* T43 (ordre del Mestre, 260928) · el correu opcional va al compte; grup C
     (ordre del Mestre, 261008) · el poble, abans del correu. */
  expect(org.filter(a => a.lloc === 'compte').map(a => a.id)).toEqual(['poble', 'correu', 'correu-public', 'membres', 'identificador', 'fitxa', 'eixir']);
  expect(org.find(a => a.id === 'fitxa').pendent).toBe(true);
});

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · El superadmin té dos ajustos
   més al compte: el segon factor i el Tauler. La resta, el catàleg d'abans. */
it('Onada 11 · ajustosPersona amb superadmin afig «Segon factor» i «Panell de superadministració» al compte, abans de «Tancar sessió»; sense, no canvia', () => {
  expect(ajustosPersona({}, {})).toEqual(ajustosPersona());
  expect(ajustosPersona({}, { superadmin: false })).toEqual(ajustosPersona());
  const amb = ajustosPersona({ full_name: 'Pep' }, { superadmin: true });
  expect(amb.filter(a => a.lloc === 'fitxa').map(a => a.id)).toEqual(['nom', 'avatar']);
  /* Pla 261016 (Bloc 3.1) i Pla 261018 (Tasca 2) · Canvis deliberats: 'poble' i 'drets-notes' al compte.
     Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 2 (l’ajust «Poble» de la persona, al compte). */
  expect(amb.filter(a => a.lloc === 'compte').map(a => a.id)).toEqual(['poble', 'correu', 'privacitat', 'drets-notes', 'contrasenya', 'segon-factor', 'panell-superadmin', 'sessio']);
  expect(amb.find(a => a.id === 'segon-factor')).toEqual({ id: 'segon-factor', lloc: 'compte', titol: 'Segon factor', tipus: 'accio', accio: 'segon-factor', obert: true });
  expect(amb.find(a => a.id === 'panell-superadmin')).toEqual({ id: 'panell-superadmin', lloc: 'compte', titol: 'Panell de superadministració', tipus: 'accio', accio: 'obrir-admin', obert: true });
  /* La resta de files són idèntiques a les d'abans. */
  expect(amb.filter(a => !['segon-factor', 'panell-superadmin'].includes(a.id))).toEqual(ajustosPersona({ full_name: 'Pep' }));
});

/* ── Pla 261016 (Bloc 3.1; ordre del Mestre) · els drets de sèrie de les notes, a «El compte» ── */

it('261016 · «drets-notes» és una llicència sobre profiles.copyright; tancat amb una baixa en curs i amb la fila de reserva', () => {
  const ajust = (perfil) => ajustosPersona(perfil).find(a => a.id === 'drets-notes');
  expect(ajust({ copyright: 'CC BY 4.0' })).toMatchObject({
    lloc: 'compte', titol: 'Drets de sèrie de les meues notes', camp: 'copyright', tipus: 'llicencia', valor: 'CC BY 4.0', obert: true,
  });
  /* Sense la columna, o sense cap tria, el valor és buit (mai null). */
  expect(ajust({}).valor).toBe('');
  expect(ajust({ copyright: null }).valor).toBe('');
  /* Amb una baixa el perfil està congelat; la fila de reserva no porta la columna. */
  expect(ajust({ copyright: 'CC0 1.0', baixa_demanada_at: '2026-09-26T10:00:00Z' }))
    .toMatchObject({ obert: false, valor: 'CC0 1.0', motiu: expect.stringContaining('Tens una baixa en curs') });
  expect(ajust({ reserva: true, id: 'A' }))
    .toMatchObject({ obert: false, valor: '', motiu: expect.stringContaining('No s’ha pogut llegir el compte del servidor') });
  /* L'organització no el porta: els seus drets de sèrie es trien a la fitxa. */
  expect(ajustosOrganitzacio({ role: 'owner' }).some(a => a.id === 'drets-notes' || a.tipus === 'llicencia')).toBe(false);
});

it('261016 · desar els drets de sèrie va a profiles.copyright i, si el servidor l’accepta, a la preferència d’este dispositiu (per l’id de la fila)', async () => {
  mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Perfil A', copyright: 'CC BY 4.0' }));
  await open();
  try {
    await act(async () => value.guardarAjust('jo', 'drets-notes', 'CC BY-SA 4.0'));
    expect(mock.updateProfile).toHaveBeenCalledWith({ copyright: 'CC BY-SA 4.0' }, expect.any(Object));
    expect(value.identitats[0].dades.copyright).toBe('CC BY-SA 4.0');
    expect(llegixLlicenciaPerDefecte('A')).toBe('CC BY-SA 4.0');
    // Mai amb la clau de la vista ('jo'): «CREAR NOTA» la busca per l'id de l'actor.
    expect(llegixLlicenciaPerDefecte('jo')).toBeNull();
    /* El servidor el rebutja: ni la fila ni la preferència no canvien. */
    mock.updateProfile.mockRejectedValueOnce(new Error('Sense xarxa'));
    await expect(value.guardarAjust('jo', 'drets-notes', 'CC0 1.0')).rejects.toThrow('Sense xarxa');
    expect(value.identitats[0].dades.copyright).toBe('CC BY-SA 4.0');
    expect(llegixLlicenciaPerDefecte('A')).toBe('CC BY-SA 4.0');
  } finally {
    desaLlicenciaPerDefecte('A', '');
  }
});

it('261016 · amb la fila de reserva o amb una baixa en curs, els drets de sèrie no arriben al servidor ni a la preferència', async () => {
  mock.getProfile.mockImplementation(async () => ({ reserva: true, id: 'A', full_name: 'Pep' }));
  await open();
  await expect(value.guardarAjust('jo', 'drets-notes', 'CC0 1.0')).rejects.toThrow('No s’ha pogut llegir el compte del servidor');
  cleanup();
  mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Pep', copyright: 'CC BY 4.0', baixa_demanada_at: '2026-09-26T10:00:00Z' }));
  await open();
  await expect(value.guardarAjust('jo', 'drets-notes', 'CC0 1.0')).rejects.toThrow('Tens una baixa en curs');
  expect(mock.updateProfile).not.toHaveBeenCalled();
  expect(llegixLlicenciaPerDefecte('A')).toBeNull();
});

/* ── Grup C (ordre del Mestre, 261008) · el poble i els membres de l'organització ── */

it('grup C · opcionsDePoble: l’opció buida primer, els pobles per nom (ca) i el desat encara que ja no hi siga', () => {
  const towns = [{ id: 'b', title: 'Benilloba' }, { id: 't', title: 'La Torre de les Maçanes' }, { id: 'a', title: 'Alcoi' },
    { id: 'e', title: 'Èrcol' }, { id: 'x', title: '  ' }, null, { id: 'z' }, { id: 'b2', title: 'Benilloba' }];
  expect(opcionsDePoble(towns)).toEqual([
    { valor: '', etiqueta: 'Tria un poble…' },
    { valor: 'Alcoi', etiqueta: 'Alcoi' },
    { valor: 'Benilloba', etiqueta: 'Benilloba' },
    { valor: 'Èrcol', etiqueta: 'Èrcol' },
    { valor: 'La Torre de les Maçanes', etiqueta: 'La Torre de les Maçanes' },
  ]);
  /* El valor desat que ja no és a la llista es conserva (i no es repetix si hi és). */
  expect(opcionsDePoble(towns, 'Penàguila').map(o => o.valor)).toEqual(['', 'Alcoi', 'Benilloba', 'Èrcol', 'La Torre de les Maçanes', 'Penàguila']);
  expect(opcionsDePoble(towns, 'Alcoi').filter(o => o.valor === 'Alcoi')).toHaveLength(1);
  /* Sense llista (sense contingut core), només la buida i el desat. */
  expect(opcionsDePoble(undefined, 'Sella')).toEqual([{ valor: '', etiqueta: 'Tria un poble…' }, { valor: 'Sella', etiqueta: 'Sella' }]);
  expect(opcionsDePoble()).toEqual([{ valor: '', etiqueta: 'Tria un poble…' }]);
});

it('grup C · l’ajust «Poble» és un selector obert segons el rol (no segons la llista), amb el valor desat', () => {
  const pobles = [{ title: 'Benilloba' }];
  const owner = ajustosOrganitzacio({ role: 'owner', town_name: 'Sella' }, null, { pobles }).find(a => a.id === 'poble');
  expect(owner).toMatchObject({ lloc: 'compte', titol: 'Poble', camp: 'town_name', tipus: 'selector', valor: 'Sella', obert: true });
  expect(owner.opcions.map(o => o.valor)).toEqual(['', 'Benilloba', 'Sella']);
  /* Sense cap poble al node, qui administra el pot triar igualment. Gauntlet
     261016 (Bloc 3.5.2) · Deixar-lo buit ja no: desar-lo buit és un error
     (la prova següent). */
  expect(ajustosOrganitzacio({ role: 'admin' }).find(a => a.id === 'poble')).toMatchObject({ obert: true, valor: '' });
  /* Un membre no el canvia, encara que hi haja pobles. */
  expect(ajustosOrganitzacio({ role: 'member', town_name: 'Sella' }, null, { pobles }).find(a => a.id === 'poble'))
    .toMatchObject({ obert: false, valor: 'Sella', motiu: 'Només qui administra aquesta organització ho pot canviar.' });
});

it('grup C · «Membres» i «Eixir» només deixen de ser pendents si el port gestiona els membres', () => {
  const sense = ajustosOrganitzacio({ role: 'admin' });
  expect(sense.find(a => a.id === 'membres')).toMatchObject({ pendent: true, obert: true });
  expect(sense.find(a => a.id === 'eixir')).toMatchObject({ pendent: true, obert: true });
  const amb = ajustosOrganitzacio({ role: 'admin' }, null, { ambMembres: true });
  expect(amb.find(a => a.id === 'membres')).toMatchObject({ pendent: false, obert: true });
  expect(amb.find(a => a.id === 'eixir')).toMatchObject({ pendent: false, obert: true });
  /* La llista només la veuen owner i admin; la propietària no se'n pot anar. */
  expect(ajustosOrganitzacio({ role: 'member' }, null, { ambMembres: true }).find(a => a.id === 'membres').obert).toBe(false);
  expect(ajustosOrganitzacio({ role: 'member' }, null, { ambMembres: true }).find(a => a.id === 'eixir').obert).toBe(true);
  expect(ajustosOrganitzacio({ role: 'owner' }, null, { ambMembres: true }).find(a => a.id === 'eixir').obert).toBe(false);
  /* La fitxa pública continua pendent (I7). */
  expect(amb.find(a => a.id === 'fitxa').pendent).toBe(true);
});

/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «El poble és innegociable»)
   · DEROGADA «l'opció buida, null»: l'edició ja no pot buidar el poble d'una
   organització. Desar-lo buit (o d'espais) és un error amb missatge clar,
   sense cap crida, i el poble desat no es toca. Tampoc per guardarCampPerfil,
   que desa la columna directament. */
it('grup C · desar el poble envia el NOM a town_name; buit no es desa (Gauntlet 261016); un membre no el desa', async () => {
  mock.listMyOrganizations.mockResolvedValue([
    { id: 'O', name: 'Forn', kind: 'company', role: 'owner' },
    { id: 'M', name: 'Colla', kind: 'group', role: 'member' }
  ]);
  mock.updateOrganization.mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  await open();
  await act(async () => value.guardarAjust('O', 'poble', '  Benilloba '));
  expect(mock.updateOrganization).toHaveBeenLastCalledWith('O', { town_name: 'Benilloba' }, expect.any(Object));
  expect(value.identitats.find(i => i.id === 'O').dades.town_name).toBe('Benilloba');
  for (const buit of ['', '   ', null, undefined]) {
    await expect(value.guardarAjust('O', 'poble', buit)).rejects.toThrow('Cada organització ha de tindre el seu poble: tria’n un.');
    await expect(value.guardarCampPerfil('town_name', buit, 'O')).rejects.toThrow('Cada organització ha de tindre el seu poble');
  }
  expect(value.identitats.find(i => i.id === 'O').dades.town_name).toBe('Benilloba');
  await expect(value.guardarAjust('O', 'poble', 'x'.repeat(121))).rejects.toThrow('com a màxim 120 caràcters');
  await expect(value.guardarAjust('M', 'poble', 'Benilloba')).rejects.toThrow('Només qui administra');
  expect(mock.updateOrganization).toHaveBeenCalledTimes(1);
  /* guardarCampPerfil amb un poble de veres el desa retallat; els altres camps, tal qual. */
  await act(async () => value.guardarCampPerfil('town_name', ' Alcoi ', 'O'));
  expect(mock.updateOrganization).toHaveBeenLastCalledWith('O', { town_name: 'Alcoi' }, expect.any(Object));
  await act(async () => value.guardarCampPerfil('lema', '', 'O'));
  expect(mock.updateOrganization).toHaveBeenLastCalledWith('O', { lema: '' }, expect.any(Object));
});

/* Pla 261018_1605 (Tasca 2, D5; ordre del Mestre, 18-10-2026) · Els pobles de
   la persona: la cadena canònica 'A · B' a la columna de sempre (town_name),
   mai buida i amb el límit de 120 caràcters de la columna. */
it('261018 · valorDePoblePersona: buit és un error, més de 120 caràcters també, i diversos pobles es normalitzen', () => {
  for (const buit of ['', '   ', ' · ', null, undefined, []]) {
    expect(() => valorDePoblePersona(buit)).toThrow(ERROR_SENSE_POBLE_PERSONA);
  }
  expect(() => valorDePoblePersona('x'.repeat(121))).toThrow('com a màxim 120 caràcters');
  expect(() => valorDePoblePersona(['x'.repeat(60), 'y'.repeat(60)])).toThrow('com a màxim 120 caràcters');
  expect(valorDePoblePersona('x'.repeat(120))).toBe('x'.repeat(120));
  expect(valorDePoblePersona('  La Torre de les Maçanes ·Xixona  · ')).toBe('La Torre de les Maçanes · Xixona');
  expect(valorDePoblePersona(['La Torre de les Maçanes', ' Xixona ', 'La Torre de les Maçanes'])).toBe('La Torre de les Maçanes · Xixona');
});

it('261018 · guardarAjust de la persona desa el poble normalitzat a town_name; buit no arriba al servidor', async () => {
  mock.updateProfile.mockImplementation(async (canvis) => ({ id: 'A', ...canvis }));
  await open();
  await act(async () => value.guardarAjust('jo', 'poble', ' La Torre de les Maçanes ·  Xixona '));
  expect(mock.updateProfile).toHaveBeenLastCalledWith({ town_name: 'La Torre de les Maçanes · Xixona' }, expect.any(Object));
  expect(value.identitats.find(i => i.id === 'jo').dades.town_name).toBe('La Torre de les Maçanes · Xixona');
  await expect(value.guardarAjust('jo', 'poble', ' · ')).rejects.toThrow(ERROR_SENSE_POBLE_PERSONA);
  await expect(value.guardarCampPerfil('town_name', '', 'jo')).rejects.toThrow(ERROR_SENSE_POBLE_PERSONA);
  expect(mock.updateProfile).toHaveBeenCalledTimes(1);
  expect(value.identitats.find(i => i.id === 'jo').dades.town_name).toBe('La Torre de les Maçanes · Xixona');
});

it('261018 · el catàleg de la persona: el poble del catàleg sense el desat, l’estat públic sense is_public i, amb la fila de reserva, tancats', () => {
  const pobles = [{ title: 'Xixona' }, { title: 'La Torre de les Maçanes' }];
  const poble = ajustosPersona({ town_name: 'La Torre de les Maçanes · Sella' }, { pobles }).find(a => a.id === 'poble');
  expect(poble).toMatchObject({ tipus: 'selector', multiple: true, valor: 'La Torre de les Maçanes · Sella', obert: true });
  expect(poble.opcions.map(o => o.valor)).toEqual(['', 'La Torre de les Maçanes', 'Xixona']);
  expect(ajustosPersona({}).find(a => a.id === 'privacitat')).toMatchObject({ valor: true, obert: true });
  expect(ajustosPersona({ is_public: false }).find(a => a.id === 'privacitat')).toMatchObject({ valor: false, obert: true });
  const deReserva = ajustosPersona({ reserva: true, is_public: true });
  expect(deReserva.find(a => a.id === 'privacitat')).toMatchObject({
    obert: false, motiu: 'No s’ha pogut llegir el compte del servidor: l’estat es podrà canviar quan es torne a llegir.',
  });
  expect(deReserva.find(a => a.id === 'poble').obert).toBe(false);
});

it('grup C · amb la capacitat, ambMembres i les accions criden el port amb la configuració (i el senyal)', async () => {
  const { config } = await open();
  expect(value.ambMembres).toBe(true);
  const membre = { tipus: 'persona', id: 'P', nom: 'Pepa', avatar: '', rol: 'member', desDe: null };
  mock.llistaMembresOrganitzacio.mockResolvedValue([membre]);
  const control = new AbortController();
  await expect(value.llistaMembres('O', { signal: control.signal })).resolves.toEqual([membre]);
  expect(mock.llistaMembresOrganitzacio).toHaveBeenCalledWith('O', { ...config, signal: control.signal });
  /* Un port que no torna cap llista no fa caure la pantalla. */
  mock.llistaMembresOrganitzacio.mockResolvedValue(null);
  await expect(value.llistaMembres('O')).resolves.toEqual([]);
  expect(mock.llistaMembresOrganitzacio).toHaveBeenLastCalledWith('O', config);
  mock.desaMembreOrganitzacio.mockResolvedValue({ ...membre, rol: 'admin' });
  await expect(value.desaMembre('O', { tipus: 'persona', id: 'P', rol: 'admin' })).resolves.toMatchObject({ rol: 'admin' });
  expect(mock.desaMembreOrganitzacio).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'P', rol: 'admin' }, config);
  /* Els errors del port (amb el seu code) arriben tal qual. */
  mock.desaMembreOrganitzacio.mockRejectedValue(Object.assign(new Error('Només la propietària nomena, degrada o lleva administradores.'), { code: 'SDP-ORGMEM-006' }));
  await expect(value.desaMembre('O', { tipus: 'persona', id: 'P', rol: 'admin' })).rejects.toMatchObject({ code: 'SDP-ORGMEM-006' });
});

it('grup C · sense la capacitat, ambMembres és false i cap acció arriba al port', async () => {
  mock.senseCapacitats = new Set(['membresOrganitzacio']);
  await open();
  expect(value.ambMembres).toBe(false);
  await expect(value.llistaMembres('O')).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  await expect(value.desaMembre('O', { tipus: 'persona', id: 'P' })).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  await expect(value.llevaMembre('O', { tipus: 'persona', id: 'A' })).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  await expect(value.cercaCandidats('O', 'pe')).rejects.toMatchObject({ code: 'NO-DISPONIBLE' });
  expect(mock.llistaMembresOrganitzacio).not.toHaveBeenCalled();
  expect(mock.desaMembreOrganitzacio).not.toHaveBeenCalled();
  expect(mock.llevaMembreOrganitzacio).not.toHaveBeenCalled();
  expect(mock.carregaMembres).not.toHaveBeenCalled();
});

it('grup C · «Eixir» (el propi id) lleva l’organització del Perfil i avisa el selector; llevar una altra persona, no', async () => {
  avis = vi.fn();
  mock.listMyOrganizations.mockResolvedValue([
    { id: 'O', name: 'Forn', kind: 'company', role: 'admin' },
    { id: 'G', name: 'Colla', kind: 'group', role: 'member' }
  ]);
  mock.llevaMembreOrganitzacio.mockResolvedValue({ llevat: true });
  const { config } = await open();
  await act(async () => { await value.llevaMembre('O', { tipus: 'persona', id: 'P' }); });
  expect(mock.llevaMembreOrganitzacio).toHaveBeenCalledWith('O', { tipus: 'persona', id: 'P' }, config);
  expect(value.identitats.map(i => i.id)).toEqual(['jo', 'O', 'G']);
  expect(avis).not.toHaveBeenCalled();
  let resultat;
  await act(async () => { resultat = await value.llevaMembre('G', { tipus: 'persona', id: 'A' }); });
  expect(resultat).toEqual({ llevat: true });
  expect(value.identitats.map(i => i.id)).toEqual(['jo', 'O']);
  expect(avis).toHaveBeenCalledTimes(1);
  /* Si el servidor rebutja l'eixida (la propietària), l'organització es queda. */
  mock.llevaMembreOrganitzacio.mockRejectedValue(Object.assign(new Error('La propietària no es canvia ni es lleva.'), { code: 'SDP-ORGMEM-005' }));
  await expect(value.llevaMembre('O', { tipus: 'persona', id: 'A' })).rejects.toMatchObject({ code: 'SDP-ORGMEM-005' });
  expect(value.identitats.map(i => i.id)).toEqual(['jo', 'O']);
});

it('grup C · cercaCandidats: persones del padró (carregaMembres) i organitzacions que també administra, sense membres ni ella mateixa', async () => {
  mock.listMyOrganizations.mockResolvedValue([
    { id: 'O', name: 'Forn', kind: 'company', role: 'owner' },
    { id: 'G', name: 'Colla del Forn', kind: 'group', role: 'admin', logo_url: '/logo-g.png' },
    { id: 'H', name: 'Forners units', kind: 'group', role: 'member' },
    { id: 'K', name: 'Cooperativa', kind: 'company', role: 'owner' }
  ]);
  mock.carregaMembres.mockResolvedValue([
    { usuari_id: 'P', nom: 'Pepa Forner', tipus: 'persona', avatar_url: '/p.png', fil_id: null },
    { usuari_id: 'Q', nom: 'Quique Forner', tipus: 'persona', avatar_url: null, fil_id: 'f' },
    { usuari_id: 'E', nom: 'Forn Vell', tipus: 'entitat', avatar_url: null, fil_id: null },
    { usuari_id: 'A', nom: 'Jo mateixa', tipus: 'persona', avatar_url: null, fil_id: null }
  ]);
  const { config } = await open();
  const control = new AbortController();
  const candidats = await value.cercaCandidats('O', '  forn ', { signal: control.signal, membres: [{ tipus: 'persona', id: 'Q' }] });
  expect(mock.carregaMembres).toHaveBeenCalledWith('forn', { ...config, signal: control.signal });
  expect(candidats).toEqual([
    { tipus: 'persona', id: 'P', nom: 'Pepa Forner', avatar: '/p.png' },
    { tipus: 'organitzacio', id: 'G', nom: 'Colla del Forn', avatar: '/logo-g.png' }
  ]);
});

it('grup C · una acció de membres d’una sessió antiga rebutja sense arribar al port', async () => {
  const view = await open(), old = value;
  switchToB(); view.rerender(tree(view.config));
  await expect(old.llistaMembres('O')).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.desaMembre('O', { tipus: 'persona', id: 'P' })).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.llevaMembre('O', { tipus: 'persona', id: 'A' })).rejects.toMatchObject({ name: 'AbortError' });
  await expect(old.cercaCandidats('O', 'pe')).rejects.toMatchObject({ name: 'AbortError' });
  expect(mock.llistaMembresOrganitzacio).not.toHaveBeenCalled();
  expect(mock.desaMembreOrganitzacio).not.toHaveBeenCalled();
  expect(mock.llevaMembreOrganitzacio).not.toHaveBeenCalled();
  expect(mock.carregaMembres).not.toHaveBeenCalled();
});

it('grup C · una resposta del port que arriba després de canviar de sessió no es dona per bona', async () => {
  const view = await open(), pendent = deferred();
  mock.llistaMembresOrganitzacio.mockReturnValueOnce(pendent.promise);
  const llista = value.llistaMembres('O');
  const comprova = expect(llista).rejects.toMatchObject({ name: 'AbortError' });
  switchToB(); view.rerender(tree(view.config));
  await act(async () => { pendent.resolve([{ tipus: 'persona', id: 'A', nom: 'A', rol: 'owner' }]); await comprova; });
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

/* Ordre del Mestre (261008, grup C) · «Un grup no té per què pertànyer a cap
   empresa»: sense mare, el grup arriba al servidor sense la clau de la mare
   (2610081400). Un ajuntament continua sense crear-se: es reclama. */
/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Tota entitat creada ha de
   portar el seu poble») · Cada alta porta el poble (town_name), que el
   domini envia al port i torna amb l'organització nova. Les altes d'estes
   proves el porten; sense, la de davall en fixa el rebuig. */
const POBLE = 'La Torre de les Maçanes';

it('grup C · un grup sense empresa mare arriba al servidor sense mare; un ajuntament no es crea', async () => {
  await open();
  mock.createOrganization.mockResolvedValue({ id: 'G', name: 'Colla', slug: 'colla', kind: 'group' });
  await act(async () => { await value.creaOrganitzacio({ name: 'Colla', slug: 'colla', kind: 'group', town_name: POBLE }); });
  expect(mock.createOrganization).toHaveBeenCalledWith({ name: 'Colla', slug: 'colla', kind: 'group', town_name: POBLE }, expect.any(Object));
  mock.createOrganization.mockClear();
  await expect(value.creaOrganitzacio({ name: 'Ajuntament', slug: 'ajuntament', kind: 'city_hall', town_name: POBLE })).rejects.toThrow('Tipus d’organització no vàlid.');
  expect(mock.createOrganization).not.toHaveBeenCalled();
});

it('Gauntlet 261016 · una alta sense poble no arriba al servidor ni avisa el selector', async () => {
  avis = vi.fn();
  await open();
  for (const dades of [{ name: 'Forn', slug: 'forn', kind: 'company' }, { name: 'Forn', slug: 'forn', kind: 'company', town_name: '  ' }]) {
    await expect(value.creaOrganitzacio(dades)).rejects.toThrow('Cada organització ha de tindre el seu poble: tria’n un.');
  }
  expect(mock.createOrganization).not.toHaveBeenCalled();
  expect(avis).not.toHaveBeenCalled();
});

it('crear una organització avisa el selector, la fa propietària i no muta la resposta', async () => {
  avis = vi.fn();
  await open();
  const resposta = { id: 'O', name: 'Forn', slug: 'forn', kind: 'company' };
  mock.createOrganization.mockResolvedValue(resposta);
  let nova;
  await act(async () => { nova = await value.creaOrganitzacio({ name: 'Forn', slug: 'forn', kind: 'company', town_name: POBLE }); });
  expect(mock.createOrganization).toHaveBeenCalledWith({ name: 'Forn', slug: 'forn', kind: 'company', town_name: POBLE }, expect.any(Object));
  expect(avis).toHaveBeenCalledTimes(1);
  expect(nova).toEqual({ ...resposta, town_name: POBLE, role: 'owner' });
  expect(resposta).not.toHaveProperty('role');
  expect(value.identitats.at(-1)).toMatchObject({ id: 'O', mena: 'empresa', rol: 'Propietari' });
  /* L'organització nova ja porta el seu poble a la fitxa. */
  expect(value.identitats.at(-1).dades.town_name).toBe(POBLE);
});

it('un grup amb mare envia la mare', async () => {
  mock.listMyOrganizations.mockResolvedValue([{ id: 'org-A', name: 'Forn', kind: 'company', role: 'admin' }]);
  await open();
  mock.createOrganization.mockResolvedValue({ id: 'G', name: 'Colla', kind: 'group' });
  await act(async () => { await value.creaOrganitzacio({ name: 'Colla', slug: 'colla', kind: 'group', parentOrganizationId: 'org-A', town_name: POBLE }); });
  expect(mock.createOrganization.mock.calls[0][0]).toMatchObject({ kind: 'group', parentOrganizationId: 'org-A', town_name: POBLE });
  expect(value.identitats.at(-1)).toMatchObject({ id: 'G', mena: 'grup' });
});

it('un reintent selecciona la mateixa organització sense duplicar-la ni ascendir el rol', async () => {
  mock.listMyOrganizations.mockResolvedValue([{ id: 'O', name: 'Forn', kind: 'company', role: 'admin' }]);
  await open();
  mock.createOrganization.mockResolvedValue({ id: 'O', name: 'Forn', kind: 'company' });
  await act(async () => value.creaOrganitzacio({ name: 'Forn', slug: 'forn', town_name: POBLE }));
  await act(async () => value.creaOrganitzacio({ name: 'Forn', slug: 'forn', town_name: POBLE }));
  expect(value.identitats.filter((i) => i.id === 'O')).toHaveLength(1);
  expect(value.identitats.find((i) => i.id === 'O').dades.role).toBe('admin');
});

it.each(['usuari', 'tenant'])('una alta pendent es descarta si canvia %s', async (canvi) => {
  avis = vi.fn();
  const view = await open(), pendent = deferred();
  mock.createOrganization.mockReturnValueOnce(pendent.promise);
  const alta = value.creaOrganitzacio({ name: 'Forn', slug: 'forn', town_name: POBLE });
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
  await expect(value.creaOrganitzacio({ name: 'Forn', slug: 'forn', town_name: POBLE })).rejects.toThrow('El servidor no ha confirmat l’organització.');
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

/* ── Pla 261014_1450, front B · la foto de la persona a /el-meu-perfil ──
   La regla de PerfilContext: triaAvatar entre la fila de profiles i
   user_metadata.avatar_url. La pujada a Sóc de Poble guanya a la de Google
   siga on siga, i sense cap foto, null (Avatar hi pinta les inicials). */
const FOTO_GOOGLE = 'https://lh3.googleusercontent.com/a/pepa.png';
const FOTO_PUJADA = 'sdp-media://mitjans/la-torre/A/avatars/pepa.webp';
it.each([
  ['fila amb la de Google i user_metadata amb la pujada', { avatar_url: FOTO_GOOGLE }, { avatar_url: FOTO_PUJADA }, FOTO_PUJADA],
  ['fila amb la pujada i user_metadata amb la de Google', { avatar_url: FOTO_PUJADA }, { avatar_url: FOTO_GOOGLE }, FOTO_PUJADA],
  ['cap foto, ni a la fila ni a la sessió', { avatar_url: null }, {}, null],
])('front B · %s → identitats[0].avatar', async (_cas, deLaFila, metadades, esperat) => {
  mock.user = { id: 'A', user_metadata: metadades };
  mock.getProfile.mockImplementation(async () => ({ id: 'A', full_name: 'Perfil A', ...deLaFila }));
  await open();
  expect(value.identitats[0].avatar).toBe(esperat);
});

/* Encàrrec 261018 (ordre del Mestre: «desar la capçalera i l'avatar no pot
   fallar») · En mode de proves la imatge es desa com a data URL dels mateixos
   bytes i no passa mai per uploadToStorage (que exigix un usuari del servidor i
   rebutjava la persona pilot, '0001'). En remot, el camí de sempre. */
it('261018 · en mode de proves pujaMitja torna el data URL i no puja res; en remot puja', async () => {
  await open({ tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase', dataMode: 'seed' });
  const foto = new File([new Uint8Array([137, 80, 78, 71])], 'capcalera.png', { type: 'image/png' });
  let url;
  await act(async () => { url = await value.pujaMitja(foto, 'capcaleres'); });
  expect(url).toMatch(/^data:image\/png;base64,/);
  expect(mock.uploadToStorage).not.toHaveBeenCalled();
  const pdf = new File(['%PDF'], 'x.pdf', { type: 'application/pdf' });
  await expect(value.pujaMitja(pdf)).rejects.toThrow('Tria una imatge PNG, JPEG, WebP, GIF o AVIF de menys de 10 MB.');
  cleanup();
  mock.uploadToStorage.mockResolvedValueOnce({ url: 'sdp-media://mitjans/t/u/avatars/x.png' });
  await open({ tenantId: '00000000-0000-0000-0000-00000000000a', backendId: 'supabase', dataMode: 'remote' });
  await act(async () => { url = await value.pujaMitja(foto); });
  expect(url).toBe('sdp-media://mitjans/t/u/avatars/x.png');
  expect(mock.uploadToStorage).toHaveBeenCalledTimes(1);
});
