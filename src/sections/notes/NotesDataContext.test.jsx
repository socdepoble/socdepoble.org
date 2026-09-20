import React from 'react';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
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

vi.mock('../../data/backendPort.js', () => ({
  loadNotes: mocks.loadNotes,
  createNote: mocks.createNote,
  updateNote: mocks.updateNote,
  getCurrentUser: mocks.getCurrentUser
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({
  useIdentitat: () => ({ actorId: 'user', actorKey: 'user' })
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ generacio: mocks.generacio })
}));
vi.mock('../../host.js', () => ({ quanLlest: mocks.quanLlest }));
vi.mock('./GlobalSaveManager.js', () => ({
  getDraftsForScope: mocks.getDraftsForScope
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
  expect(mocks.getDraftsForScope).toHaveBeenCalledWith('supabase_user_tenant');

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