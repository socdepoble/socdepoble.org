import { beforeEach as abansDePublicar } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
abansDePublicar(() => { globalThis.indexedDB = creaIdbFalsEstructurat(); });
/* R51 (P0-46 / IDEA-177; R51V-02) · El mode de traducció i la llengua
   original viatgen al Mur dins del payload (jsonb de section_submissions,
   el mateix camí que publish_date: cap migració). Els de la nota (l'editor
   els hi posa des del dispositiu) o, si no en porta, els de la fila ja
   publicada; sense cap dels dos, el payload de sempre. Una còpia compartida,
   cap. Fitxer propi: el gestor de desament (bgSaveManager) és d'àmbit de
   mòdul (com emoticona i dataPublicacio). */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn(), feedPosts: [] }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: [], noteFolders: [], scopeKey: 'tenant-user', workspaceKey: 'session', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, confirmaPublicacioNota: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send, feedPosts: mocks.feedPosts, marketItems: [] }) }));
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
  mocks.send.mockReset().mockImplementation(async sub => ({ publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false }));
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
  mocks.feedPosts = [];
});
afterEach(cleanup);

const payloadEnviat = (index = 0) => mocks.send.mock.calls[index][0].payload;
const publica = async (nota) => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote(nota)).toBe(true); });
};

test('publishNote envia al Mur el mode de traducció i la llengua original que porta la nota', async () => {
  await publica({ id: 'hort', title: 'Hort', content: '', revision: 1, translation_mode: 'none', source_language: 'es' });
  expect(payloadEnviat()).toMatchObject({ translation_mode: 'none', source_language: 'es' });
});

test('sense mode a la nota ni a cap fila publicada, el payload no porta cap de les dues claus', async () => {
  await publica({ id: 'sense', title: 'T', content: '', revision: 1 });
  expect(payloadEnviat()).not.toHaveProperty('translation_mode');
  expect(payloadEnviat()).not.toHaveProperty('source_language');
});

test('republicar sense mode a la nota conserva el de la fila ja publicada (un altre dispositiu no l’esborra)', async () => {
  mocks.feedPosts = [{ id: 'fila-1', title: 'Hort', translation_mode: 'on_the_fly', source_language: 'gl' }];
  await publica({ id: 'hort2', title: 'Hort', content: '', revision: 1, isPublished: true, publishedSubmissionId: 'fila-1' });
  expect(mocks.send.mock.calls[0][0].id).toBe('fila-1');
  expect(payloadEnviat()).toMatchObject({ translation_mode: 'on_the_fly', source_language: 'gl' });
});

test('el mode de la nota mana sobre el de la fila publicada', async () => {
  mocks.feedPosts = [{ id: 'fila-2', title: 'Hort', translation_mode: 'on_the_fly', source_language: 'gl' }];
  await publica({ id: 'hort3', title: 'Hort', content: '', revision: 1, isPublished: true, publishedSubmissionId: 'fila-2', translation_mode: 'none', source_language: 'eu' });
  expect(payloadEnviat()).toMatchObject({ translation_mode: 'none', source_language: 'eu' });
});

/* V2-04 · L'upsert reemplaça el payload sencer: republicar una revisada
   (curated_5_langs) sense portar-ne les traduccions la deixava incompleta
   (R51_CURATED_INCOMPLETE) i la targeta passava a l'avís d'error. */
const REVISADES = Object.freeze(Object.fromEntries(['ca', 'es', 'en', 'eu', 'gl']
  .map((codi) => [codi, { title: `Hort ${codi}`, content: `<p>Cos ${codi}</p>`, reviewed: true }])));

test('V2-04 · republicar una fila curated_5_langs conserva les seues traduccions revisades i el mode', async () => {
  mocks.feedPosts = [{ id: 'fila-3', title: 'Hort', translation_mode: 'curated_5_langs', source_language: 'ca', translations: REVISADES }];
  await publica({ id: 'hort4', title: 'Hort', content: '<p>Cos</p>', revision: 1, isPublished: true, publishedSubmissionId: 'fila-3' });
  expect(mocks.send.mock.calls[0][0].id).toBe('fila-3');
  expect(payloadEnviat()).toMatchObject({ translation_mode: 'curated_5_langs', source_language: 'ca', translations: REVISADES });
  // El que es republica es pot tornar a pintar revisat (el contracte complet).
  const { planTraduccioPublicacio } = await import('../../components/universal/traduccio/planTraduccioPublicacio.js');
  expect(planTraduccioPublicacio({ id: 'fila-3', ...payloadEnviat() }, 'en')).toMatchObject({ tipus: 'curated', element: { title: 'Hort en' } });
});

test('V2-04 · la nota d’una publicació oberta (notaDeLaPublicacio) porta les traduccions si la fila ja no és a la llista carregada', async () => {
  const { notaDeLaPublicacio } = await import('./publicacioEditable.js');
  const publicacio = { id: 'fila-4', title: 'Hort', content: '<p>Cos</p>', translation_mode: 'curated_5_langs', source_language: 'ca', translations: REVISADES };
  const nota = notaDeLaPublicacio({ id: 'publicacio:fila-4', title: 'Hort', data: { seccio: 'mur', item: publicacio } });
  expect(nota.translations).toBe(REVISADES);
  await publica({ ...nota, id: 'hort5', revision: 1 });
  expect(payloadEnviat()).toMatchObject({ translation_mode: 'curated_5_langs', source_language: 'ca', translations: REVISADES });
});

test.each([
  ['un mode que no existix', 'auto'],
  ['un mode en majúscules', 'ON_THE_FLY'],
  ['un mode buit', '']
])('V2-04 · una fila amb %s: el mode heretat no es copia (normalizeTranslationMode), ni la seua llengua', async (_, mode) => {
  mocks.feedPosts = [{ id: 'fila-5', title: 'Hort', translation_mode: mode, source_language: 'gl' }];
  await publica({ id: 'hort6', title: 'Hort', content: '', revision: 1, isPublished: true, publishedSubmissionId: 'fila-5' });
  expect(payloadEnviat()).not.toHaveProperty('translation_mode');
  expect(payloadEnviat()).not.toHaveProperty('source_language');
});

test('V2-04 · compartir una còpia d’altri no s’emporta ni el mode ni les traduccions de cap fila', async () => {
  mocks.feedPosts = [{ id: 'fila-6', title: 'Hort', translation_mode: 'curated_5_langs', source_language: 'ca', translations: REVISADES }];
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => {
    expect(await result.current.publishNote({ id: 'hort7', title: 'Hort', content: '', revision: 1, isPublished: true, publishedSubmissionId: 'fila-6', translation_mode: 'none', source_language: 'ca' }, { mode: 'compartir' })).toBe(true);
  });
  expect(payloadEnviat()).not.toHaveProperty('translation_mode');
  expect(payloadEnviat()).not.toHaveProperty('translations');
});
