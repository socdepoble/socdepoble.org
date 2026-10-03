import React from 'react';
import { backendScope } from '../../config/backendConfig.js';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { NotesProvider, useNotes } from './NotesContext';
import { NotesDataProvider, useNotesData } from './NotesDataContext';

/* L0 · backendConfig exigix un tenant_id UUID: abast sintètic, en minúscules. */
const TENANT = '00000000-0000-4000-8000-0000000000a1';

const mocks = vi.hoisted(() => ({
  loadNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  mouNota: vi.fn(),
  esborraNota: vi.fn(),
  getCurrentUser: vi.fn(),
  getDefaultUserId: vi.fn(),
  getRuntimeDataMode: vi.fn(),
  quanLlest: vi.fn(),
  getDraftsForScope: vi.fn(),
  repren: vi.fn(),
  generacio: 1,
  entrada: 0
}));

vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca', externalConfig: {} }), useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({
  promoteToPublic: vi.fn(), teCapacitat: () => false,
  loadNotes: mocks.loadNotes,
  createNote: mocks.createNote,
  updateNote: mocks.updateNote,
  mouNota: mocks.mouNota,
  esborraNota: mocks.esborraNota,
  getCurrentUser: mocks.getCurrentUser,
  getDefaultUserId: mocks.getDefaultUserId,
  getRuntimeDataMode: mocks.getRuntimeDataMode
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: 'user', actorKey: 'user' })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ generacio: mocks.generacio, currentUser: { id: 'user' } })
}));
vi.mock('../../host.js', () => ({ quanLlest: mocks.quanLlest }));
vi.mock('./GlobalSaveManager.js', () => ({
  getDraftsForScope: mocks.getDraftsForScope,
  draftFields: draft => Object.fromEntries(Object.entries(draft).filter(([key]) => !key.startsWith('_'))),
  bgSaveManager: { repren: mocks.repren }
}));
/* T47b · L'àmbit de Notes és l'entrada de sessió (identitat.entradaSessio), no la generació. */
vi.mock('../../data/identitat.js', async importOriginal => ({
  ...await importOriginal(),
  entradaSessio: () => mocks.entrada
}));

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.generacio = 1;
  mocks.entrada = 0;
  mocks.getCurrentUser.mockReturnValue({ id: 'user' });
  mocks.getDefaultUserId.mockReturnValue('usuari-seed');
  mocks.getRuntimeDataMode.mockReturnValue('remote');
  mocks.quanLlest.mockResolvedValue(undefined);
  mocks.getDraftsForScope.mockResolvedValue({});
  mocks.loadNotes.mockResolvedValue({
    notes: [{ id: 'old', revision: 1 }],
    noteFolders: []
  });
  mocks.createNote.mockResolvedValue({ id: 'new', title: 'Guardada', revision: 1 });
});

test('crea amb la configuració del provider i incorpora la resposta confirmada', async () => {
  const config = { tenantId: TENANT };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result, unmount } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(mocks.loadNotes).toHaveBeenCalledWith('user', {
    ...config,
    signal: expect.any(AbortSignal)
  });
  expect(mocks.getDraftsForScope).toHaveBeenCalledWith(`${backendScope({ tenantId: TENANT })}_user_user_${TENANT}`);

  await act(async () => {
    const creada = await result.current.creaNota({ title: 'Nova' });
    expect(creada).toEqual({ id: 'new', title: 'Guardada', revision: 1 });
  });
  expect(mocks.createNote).toHaveBeenCalledWith({ title: 'Nova' }, config);
  expect(result.current.notes.map(n => n.id)).toEqual(['new', 'old']);

  mocks.createNote.mockRejectedValueOnce(new Error('sense connexió'));
  await act(async () => {
    await expect(result.current.creaNota({ title: 'Error' })).rejects.toThrow('sense connexió');
  });
  expect(result.current.notes.map(n => n.id)).toEqual(['new', 'old']);

  const signal = mocks.loadNotes.mock.calls[0][1].signal;
  unmount();
  expect(signal.aborted).toBe(true);
});


test('el context de presentació conserva resolució, configuració i clau del workspace', async () => {
  const config = { tenantId: TENANT };
  const wrapper = ({ children }) => <NotesDataProvider config={config}><NotesProvider>{children}</NotesProvider></NotesDataProvider>;
  const { result } = renderHook(useNotes, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(JSON.parse(result.current.workspaceKey)[0]).toBe(`${backendScope({ tenantId: TENANT })}_user_user_${TENANT}`);
  expect(result.current.resolveNote).toBeTypeOf('function');
  expect(result.current.refresh).toBeTypeOf('function');
  expect(result.current.config).toBe(config);
  expect(result.current.canCreate).toBe(true);
});

/* T47b (ordre del Mestre, 260928) · Abans esta guarda mirava la generació del
   servei, que també es mou en la renovació horària del JWT. Ara mira l'ENTRADA:
   eixir, tornar a entrar o canviar de compte (com fa PerfilProvider). */
test('una resposta d’una entrada de sessió antiga no es retorna com a èxit', async () => {
  const config = { tenantId: TENANT };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result, rerender } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const clauAbans = result.current.workspaceKey;
  let finish;
  mocks.updateNote.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const request = result.current.updateNote('old', { title: 'A' }, 1);
  const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
  mocks.entrada++;
  mocks.generacio++;
  rerender();
  await act(async () => { finish({ id: 'old', revision: 2 }); await rejected; });
  expect(result.current.workspaceKey).not.toBe(clauAbans);
});

test('T47b · la renovació del JWT (generació nova, mateixa entrada) no avorta el desat ni remunta el Bloc', async () => {
  const config = { tenantId: TENANT };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result, rerender } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const clauAbans = result.current.workspaceKey;
  const carregues = mocks.loadNotes.mock.calls.length;
  let finish;
  mocks.updateNote.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const request = result.current.updateNote('old', { title: 'A' }, 1);
  mocks.generacio++;
  rerender();
  let desada;
  await act(async () => { finish({ id: 'old', title: 'A', revision: 2 }); desada = await request; });
  expect(desada).toEqual({ id: 'old', title: 'A', revision: 2 });
  expect(result.current.workspaceKey).toBe(clauAbans);
  expect(result.current.status).toBe('ready');
  expect(result.current.notes).toEqual([{ id: 'old', title: 'A', revision: 2 }]);
  expect(mocks.loadNotes.mock.calls.length).toBe(carregues);
});

test('T47b · en carregar, els esborranys sense conflicte tornen a eixir; els de D01 esperen la decisió', async () => {
  mocks.getDraftsForScope.mockResolvedValue({
    old: { title: 'Meu', _baseRevision: 1 },
    nova: { title: 'Al dia', _baseRevision: 2 },
    neta: { _operationVersion: 4, _fieldVersions: {}, _baseRevision: 2 }
  });
  mocks.loadNotes.mockResolvedValue({
    notes: [
      { id: 'old', title: 'Remot', revision: 3 },
      { id: 'nova', title: 'Remot', revision: 2 },
      { id: 'neta', title: 'Remot', revision: 2 }
    ],
    noteFolders: []
  });
  const config = { tenantId: TENANT };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await waitFor(() => expect(mocks.repren).toHaveBeenCalled());
  expect(mocks.repren.mock.calls.map(([scope, id]) => [scope, id])).toEqual([[result.current.scopeKey, 'nova']]);
  const { update, getBase } = mocks.repren.mock.calls[0][2];
  expect(getBase()).toEqual({ revision: 2 });
  // L'escriptura és la de l'operació viva: la que el Bloc exposa.
  mocks.updateNote.mockResolvedValueOnce({ id: 'nova', title: 'Al dia', revision: 3 });
  await act(async () => { await update('nova', { title: 'Al dia' }, 2); });
  expect(mocks.updateNote).toHaveBeenCalledWith('nova', { title: 'Al dia' }, 2, config);
});

test('T47b · un camp que el servidor no ha desat es queda a la llista, sense la marca', async () => {
  const config = { tenantId: TENANT };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  mocks.updateNote.mockResolvedValueOnce({ id: 'old', title: 'Nou', revision: 2, campsNoDesats: ['icon'] });
  let tornada;
  await act(async () => { tornada = await result.current.updateNote('old', { title: 'Nou', icon: '🌿' }, 1); });
  // La cua necessita la marca per a no donar l'emoticona per desada…
  expect(tornada.campsNoDesats).toEqual(['icon']);
  // …i la llista conserva el valor de la persona.
  expect(result.current.notes).toEqual([{ id: 'old', title: 'Nou', revision: 2, icon: '🌿' }]);
});

test('en mode seed carrega les notes encara que no hi haja sessió', async () => {
  mocks.getCurrentUser.mockReturnValue(null);
  mocks.getRuntimeDataMode.mockReturnValue('seed');
  const config = { tenantId: TENANT, dataMode: 'seed' };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(mocks.loadNotes).toHaveBeenCalledWith('usuari-seed', {
    ...config,
    signal: expect.any(AbortSignal)
  });
  expect(result.current.notes.map(n => n.id)).toEqual(['old']);
});

test('D01: un esborrany d’una revisió anterior es mostra marcat, no fusionat en silenci', async () => {
  mocks.getDraftsForScope.mockResolvedValue({
    old: { title: 'Meu', _baseRevision: 1 },
    nova: { title: 'Al dia', _baseRevision: 2 }
  });
  mocks.loadNotes.mockResolvedValue({
    notes: [{ id: 'old', title: 'Remot', revision: 3 }, { id: 'nova', title: 'Remot', revision: 2 }],
    noteFolders: []
  });
  const wrapper = ({ children }) => <NotesDataProvider config={{ tenantId: TENANT }}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const [antiga, alDia] = result.current.notes;
  expect(antiga.title).toBe('Meu');
  expect(antiga.draftConflict).toEqual({ baseRevision: 1, remoteRevision: 3 });
  expect(alDia.title).toBe('Al dia');
  expect(alDia.draftConflict).toBeUndefined();
});

/* T47 (ordre del Mestre, 260928) · Un camp en quarantena (l'emoticona sense
   migració) no arriba mai al servidor: abans deixava l'esborrany ple per
   sempre i qualsevol canvi remot obria el D01 i bloquejava els desats. */
test('T47 · els camps en quarantena (_quarantena) no obrin el conflicte D01; un camp de veres pendent sí', async () => {
  mocks.getDraftsForScope.mockResolvedValue({
    emoticona: { icon: '🌿', _quarantena: ['icon'], _baseRevision: 1 },
    barreja: { icon: '🍅', title: 'Meu', _quarantena: ['icon'], _baseRevision: 1 }
  });
  mocks.loadNotes.mockResolvedValue({
    notes: [{ id: 'emoticona', title: 'Remot', revision: 3 }, { id: 'barreja', title: 'Remot', revision: 3 }],
    noteFolders: []
  });
  const wrapper = ({ children }) => <NotesDataProvider config={{ tenantId: TENANT }}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const [emoticona, barreja] = result.current.notes;
  expect(emoticona).toEqual({ id: 'emoticona', title: 'Remot', revision: 3, icon: '🌿' });
  expect(barreja.draftConflict).toEqual({ baseRevision: 1, remoteRevision: 3 });
  await waitFor(() => expect(mocks.repren).toHaveBeenCalled());
  expect(mocks.repren.mock.calls.map(([, id]) => id)).toEqual(['emoticona']);
});

test('paperera, arxiu i esborrat lleven la nota del Bloc; un 409 torna a carregar', async () => {
  const config = { tenantId: TENANT };
  mocks.loadNotes.mockResolvedValue({
    notes: [{ id: 'a', revision: 1 }, { id: 'b', revision: 2 }, { id: 'c', revision: 3 }],
    noteFolders: []
  });
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));

  mocks.mouNota.mockResolvedValueOnce({ id: 'a', revision: 2, estat: 'paperera' });
  await act(async () => { await result.current.mouNota('a', 'paperera', 1); });
  expect(mocks.mouNota).toHaveBeenCalledWith('a', 'paperera', 1, config);
  mocks.esborraNota.mockResolvedValueOnce({ id: 'b' });
  await act(async () => { await result.current.esborraNota('b', 2); });
  expect(mocks.esborraNota).toHaveBeenCalledWith('b', 2, config);
  expect(result.current.notes.map(n => n.id)).toEqual(['c']);

  const carregues = mocks.loadNotes.mock.calls.length;
  mocks.mouNota.mockRejectedValueOnce(Object.assign(new Error('conflicte'), { status: 409 }));
  await act(async () => {
    await expect(result.current.mouNota('c', 'arxivada', 1)).rejects.toMatchObject({ status: 409 });
  });
  await waitFor(() => expect(mocks.loadNotes.mock.calls.length).toBeGreaterThan(carregues));
});

/* Poliment T23/T40 · SUMMARY_COLUMNS no porta `icon` ni `publish_date`: una
   pàgina de resums de la mateixa revisió no els esborra del detall. */
test('una pàgina de resums conserva l’emoticona i la data de publicació del detall', async () => {
  const resum = { id: 'old', title: 'Fira', revision: 1, contentLoaded: false };
  const detall = { ...resum, content: '<p>Cos</p>', contentLoaded: true, icon: '🌿', publishDate: '2026-10-05T08:30:00.000Z' };
  mocks.loadNotes.mockImplementation(async (_owner, cfg) => (cfg.noteId
    ? { notes: [detall], noteResolution: { id: 'old', status: 'found' } }
    : { notes: [resum], noteFolders: [], notesComplete: true }));
  const wrapper = ({ children }) => <NotesDataProvider config={{ tenantId: TENANT }}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  await act(async () => { await result.current.resolveNote('old'); });
  expect(result.current.notes[0]).toMatchObject({ icon: '🌿', publishDate: '2026-10-05T08:30:00.000Z' });
  const carregues = mocks.loadNotes.mock.calls.length;
  act(() => { result.current.refresh(); });
  await waitFor(() => expect(mocks.loadNotes.mock.calls.length).toBeGreaterThan(carregues));
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(result.current.notes[0]).toMatchObject({
    content: '<p>Cos</p>', contentLoaded: true, icon: '🌿', publishDate: '2026-10-05T08:30:00.000Z'
  });
  // Quan la fila ja porta la columna (migració aplicada), mana el que diu el servidor.
  mocks.loadNotes.mockImplementation(async () => ({ notes: [{ ...resum, icon: '', publishDate: null }], noteFolders: [], notesComplete: true }));
  const abans = mocks.loadNotes.mock.calls.length;
  act(() => { result.current.refresh(); });
  await waitFor(() => expect(mocks.loadNotes.mock.calls.length).toBeGreaterThan(abans));
  await waitFor(() => expect(result.current.notes[0].icon).toBe(''));
  expect(result.current.notes[0].publishDate).toBeNull();
});

test('sense sessió i amb dades remotes no es demanen notes', async () => {
  mocks.getCurrentUser.mockReturnValue(null);
  const config = { tenantId: TENANT };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(mocks.loadNotes).not.toHaveBeenCalled();
  expect(result.current.notes).toEqual([]);
});
