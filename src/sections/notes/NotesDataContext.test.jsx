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
  getCurrentUser: mocks.getCurrentUser
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
