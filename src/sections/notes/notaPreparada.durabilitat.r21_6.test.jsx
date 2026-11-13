import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  load: vi.fn(), create: vi.fn(), update: vi.fn(), toast: vi.fn(),
  records: new Map(), manager: null, makeManager: null, data: null, prepared: null
}));
vi.mock('../../data/backendPort.js', () => ({
  loadNotes: (...args) => m.load(...args), createNote: (...args) => m.create(...args),
  updateNote: (...args) => m.update(...args), mouNota: vi.fn(), esborraNota: vi.fn(),
  getCurrentUser: () => ({ id: 'persona-prova' }), getDefaultUserId: () => 'seed',
  getRuntimeDataMode: () => 'remote', promoteToPublic: vi.fn(), teCapacitat: () => false
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../data/identitat.js', async original => ({ ...await original(), entradaSessio: () => 0 }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'persona-prova', actorKey: 'persona-prova' }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ generacio: 1, currentUser: { id: 'persona-prova' }, estat: 'dins' }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: vi.fn(), feedPosts: [], marketItems: [] }) }));
vi.mock('./GlobalSaveManager.js', async original => {
  const real = await original();
  m.makeManager = () => new real.GlobalSaveManager({
    finestra: null, delay: 60_000, retroces: [60_000],
    // Deterministic durable-store port. Production uses the unchanged IndexedDB transaction.
    persist: async (key, transform) => {
      const value = transform(structuredClone(m.records.get(key) || {}));
      if (value == null) m.records.delete(key); else m.records.set(key, structuredClone(value));
      return value;
    }
  });
  return {
    ...real,
    getDraftsForScope: async scope => Object.fromEntries([...m.records].filter(([key]) => key.startsWith(scope + ':'))
      .map(([key, value]) => [key.slice(scope.length + 1), structuredClone(value)])),
    bgSaveManager: new Proxy({}, { get: (_target, property) => {
      const value = m.manager[property];
      return typeof value === 'function' ? value.bind(m.manager) : value;
    } })
  };
});
import { NotesDataProvider, useNotesData } from './NotesDataContext.jsx';
import { NotesProvider, useNotes } from './NotesContext.jsx';
import { useNotaPreparada } from './notaPreparada.js';

const CONFIG = { dataMode: 'remote', tenantId: '00000000-0000-4000-8000-0000000000a1' };
function Editor() {
  const notes = useNotes();
  m.prepared = useNotaPreparada({
    clau: notes.workspaceKey, notes: notes.notes, creaNota: notes.creaNota,
    setLocalNoteField: notes.setLocalNoteField, updateNote: notes.updateNote,
    desaNotaPreparada: notes.desaNotaPreparada, informaError: notes.informaError
  });
  return null;
}
function Probe() { m.data = useNotesData(); return null; }
function App({ editor = false }) {
  return <NotesDataProvider config={CONFIG}><NotesProvider>{editor ? <Editor /> : null}<Probe /></NotesProvider></NotesDataProvider>;
}
function cancelTimers() {
  for (const key of [...m.manager.queues.keys()]) m.manager.cancelaCua(key);
}
beforeEach(() => {
  vi.clearAllMocks(); m.records.clear(); m.manager = m.makeManager(); m.data = null; m.prepared = null;
  m.load.mockResolvedValue({ notes: [], noteFolders: [], notesComplete: true });
});
afterEach(() => { cleanup(); cancelTimers(); });

test('R21.6 · crear en vol → eixir → fallada de flush conserva l’últim text al diari existent i una càrrega nova l’hidrata', async () => {
  let finish;
  m.create.mockImplementation(input => new Promise(resolve => { finish = () => resolve({ ...input, revision: 7 }); }));
  m.update.mockRejectedValue(Object.assign(new Error('servidor no disponible'), { status: 503 }));
  const view = render(<App editor />);
  await waitFor(() => expect(m.data.status).toBe('ready'));
  const id = m.prepared.id;
  await act(async () => { m.prepared.escriu(id, 'title', 'Primer títol'); });
  await waitFor(() => expect(m.create).toHaveBeenCalledTimes(1));
  await act(async () => {
    m.prepared.escriu(id, 'title', 'Última edició');
    m.prepared.escriu(id, 'content', '<p>Últim text que ha de sobreviure</p>');
  });
  view.rerender(<App />);
  await act(async () => { finish(); });
  await waitFor(() => expect(m.update).toHaveBeenCalledTimes(1));
  const scope = m.data.scopeKey;
  const key = scope + ':' + id;
  await waitFor(() => expect(m.records.get(key)).toMatchObject({
    title: 'Última edició', content: '<p>Últim text que ha de sobreviure</p>', _baseRevision: 7
  }));
  expect(m.update.mock.calls[0].slice(0, 3)).toEqual([id, {
    title: 'Última edició', content: '<p>Últim text que ha de sobreviure</p>'
  }, 7]);
  expect(m.toast.mock.calls.filter(([, type]) => type === 'error')).toHaveLength(1);
  view.unmount();
  cancelTimers();
  // Simulate a fresh process: discard every volatile manager cache, retain only the durable port.
  m.manager = m.makeManager();
  m.load.mockResolvedValue({ notes: [{ id, title: 'Primer títol', revision: 7 }], noteFolders: [], notesComplete: true });
  render(<App />);
  await waitFor(() => expect(m.data.status).toBe('ready'));
  expect(m.data.notes).toEqual([expect.objectContaining({
    id, title: 'Última edició', content: '<p>Últim text que ha de sobreviure</p>', revision: 7
  })]);
});
