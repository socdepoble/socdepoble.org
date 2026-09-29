/* T51 (ordre del Mestre, 260928) · L'emoticona triada viatja al Mur dins del
   payload (jsonb flexible de section_submissions: cap canvi d'esquema), perquè
   la targeta la pinte al centre de la caputxa. Fitxer propi: el gestor de
   desament (bgSaveManager) és d'àmbit de mòdul (com dataPublicacio). */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn() }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: [], noteFolders: [], scopeKey: 'tenant-user', workspaceKey: 'session', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: null }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null }) }));
vi.mock('../../data/backendPort.js', () => ({ promoteToPublic: vi.fn(), teCapacitat: () => false }));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes } from './NotesContext';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
});
afterEach(cleanup);

const payloadEnviat = (index = 0) => mocks.send.mock.calls[index][0].payload;
const publica = async (nota) => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote(nota)).toBe(true); });
};

test('publishNote envia al Mur l’emoticona triada de la nota', async () => {
  await publica({ id: 'hort', title: 'Hort', content: '', revision: 1, icon: '🌿' });
  expect(payloadEnviat().icon).toBe('🌿');
});

test('sense emoticona (o amb brossa) el payload no porta la clau: republicar sense ella la lleva del Mur', async () => {
  await publica({ id: 'sense', title: 'T', content: '', revision: 1, icon: '' });
  expect(payloadEnviat()).not.toHaveProperty('icon');
  cleanup();
  mocks.send.mockClear();
  await publica({ id: 'brossa', title: 'T', content: '', revision: 1, icon: '🍅 Tomaques' });
  expect(payloadEnviat()).not.toHaveProperty('icon');
});
