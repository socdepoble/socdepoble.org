import React from 'react';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { NotesProvider, useNotes } from './NotesContext';
import { NotesDataProvider, useNotesData } from './NotesDataContext';

const mocks = vi.hoisted(() => ({
  loadNotes: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  getCurrentUser: vi.fn(),
  getDefaultUserId: vi.fn(),
  getRuntimeDataMode: vi.fn(),
  quanLlest: vi.fn(),
  getDraftsForScope: vi.fn(),
  generacio: 1
}));

vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca', externalConfig: {} }), useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: vi.fn() }) }));
vi.mock('../../data/backendPort.js', () => ({
  promoteToPublic: vi.fn(), teCapacitat: () => false,
  loadNotes: mocks.loadNotes,
  createNote: mocks.createNote,
  updateNote: mocks.updateNote,
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
  draftFields: draft => Object.fromEntries(Object.entries(draft).filter(([key]) => !key.startsWith('_')))
}));

afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.generacio = 1;
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
  const config = { tenantId: 'tenant' };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result, unmount } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(mocks.loadNotes).toHaveBeenCalledWith('user', {
    ...config,
    signal: expect.any(AbortSignal)
  });
  expect(mocks.getDraftsForScope).toHaveBeenCalledWith('supabase_user_user_tenant');

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
  const config = { tenantId: 'tenant' };
  const wrapper = ({ children }) => <NotesDataProvider config={config}><NotesProvider>{children}</NotesProvider></NotesDataProvider>;
  const { result } = renderHook(useNotes, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(result.current.workspaceKey).toContain('supabase_user_user_tenant');
  expect(result.current.resolveNote).toBeTypeOf('function');
  expect(result.current.refresh).toBeTypeOf('function');
  expect(result.current.config).toBe(config);
  expect(result.current.canCreate).toBe(true);
});

test('una resposta d’una generació antiga no es retorna com a èxit', async () => {
  const config = { tenantId: 'tenant' };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result, rerender } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  let finish;
  mocks.updateNote.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const request = result.current.updateNote('old', { title: 'A' }, 1);
  const rejected = expect(request).rejects.toMatchObject({ name: 'AbortError' });
  mocks.generacio++;
  rerender();
  await act(async () => { finish({ id: 'old', revision: 2 }); await rejected; });
});

test('en mode seed carrega les notes encara que no hi haja sessió', async () => {
  mocks.getCurrentUser.mockReturnValue(null);
  mocks.getRuntimeDataMode.mockReturnValue('seed');
  const config = { tenantId: 'tenant', dataMode: 'seed' };
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
  const wrapper = ({ children }) => <NotesDataProvider config={{ tenantId: 'tenant' }}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  const [antiga, alDia] = result.current.notes;
  expect(antiga.title).toBe('Meu');
  expect(antiga.draftConflict).toEqual({ baseRevision: 1, remoteRevision: 3 });
  expect(alDia.title).toBe('Al dia');
  expect(alDia.draftConflict).toBeUndefined();
});

test('sense sessió i amb dades remotes no es demanen notes', async () => {
  mocks.getCurrentUser.mockReturnValue(null);
  const config = { tenantId: 'tenant' };
  const wrapper = ({ children }) => <NotesDataProvider config={config}>{children}</NotesDataProvider>;
  const { result } = renderHook(useNotesData, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('ready'));
  expect(mocks.loadNotes).not.toHaveBeenCalled();
  expect(result.current.notes).toEqual([]);
});
