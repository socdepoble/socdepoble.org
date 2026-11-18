import { beforeEach as abansDePublicar } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
abansDePublicar(() => { globalThis.indexedDB = creaIdbFalsEstructurat(); });
/* T51 (ordre del Mestre, 260928) · L'emoticona triada viatja al Mur dins del
   payload (jsonb flexible de section_submissions: cap canvi d'esquema), perquè
   la targeta la pinte al centre de la caputxa. Fitxer propi: el gestor de
   desament (bgSaveManager) és d'àmbit de mòdul (com dataPublicacio). */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn() }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: [], noteFolders: [], scopeKey: 'tenant-user', workspaceKey: 'session', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, confirmaPublicacioNota: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn()
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
import { bgSaveManager } from './GlobalSaveManager.js';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.send.mockReset().mockImplementation(async sub => ({ publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false }));
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

test.each([{ mostrarAlMur: false }, { ocultarDelMur: true }, { mostrarAlMur: true, ocultarDelMur: false }])('R32.9: publishNote preserva la decisió %j sense retirar la nota de la carpeta', async decisio => {
  const note = { id: `mur-${String(decisio.mostrarAlMur)}`, title: 'Capítol', content: '', folderId: 'llibre', revision: 1, ...decisio };
  await publica(note);
  const visible = decisio.mostrarAlMur ?? !decisio.ocultarDelMur;
  expect(payloadEnviat()).toMatchObject({ mostrarAlMur: visible, ocultarDelMur: !visible });
  expect(mocks.update.mock.calls.some(([, changes]) => changes.folderId === 'llibre')).toBe(true);
  expect(note.folderId).toBe('llibre'); expect(note).not.toHaveProperty('isPublished');
});

test('R32.9: cap publicació o desat davant una decisió textual o contradictòria', async () => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  for (const decisio of [{ mostrarAlMur: 'false' }, { mostrarAlMur: true, ocultarDelMur: true }]) {
    await act(async () => { await expect(result.current.publishNote({ id: 'invalida', revision: 1, ...decisio })).rejects.toMatchObject({ code: 'mur-visibilitat-invalida' }); });
  }
  expect(mocks.send).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
});

test('R32.9: editar un alias envia un únic parell coherent, sense deixar l’invers vell a l’esborrany', async () => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => {
    result.current.setLocalNoteField('parell', 'mostrarAlMur', false);
    await bgSaveManager.flush('tenant-user', 'parell');
  });
  expect(mocks.update).toHaveBeenCalled();
  expect(mocks.update.mock.calls.at(-1)[1]).toMatchObject({ mostrarAlMur: false, ocultarDelMur: true });
});
