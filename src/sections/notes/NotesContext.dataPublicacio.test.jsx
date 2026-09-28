/* T40 (ordre del Mestre, 260928) · La data de publicació de la nota: es desa
   pel canal de sempre (autodesament) i publishNote l'envia al Mur. Fitxer
   propi: el gestor de desament (bgSaveManager) és d'àmbit de mòdul.
   Poliment T41/T43 · i qui signa: l'actor d'IdentitatContext, mai un correu. */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  update: vi.fn(), send: vi.fn(), toast: vi.fn(), notes: [], scopeKey: 'tenant-user', workspaceKey: 'session',
  actor: null, user: null, externalConfig: {}
}));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: mocks.notes, noteFolders: [], scopeKey: mocks.scopeKey, workspaceKey: mocks.workspaceKey, config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: mocks.externalConfig }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
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
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
  mocks.actor = null;
  mocks.user = null;
  mocks.externalConfig = {};
});
afterEach(cleanup);

const payloadEnviat = (index = 0) => mocks.send.mock.calls[index][0].payload;

test('publishNote envia al Mur la data triada al calendari', async () => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  const nota = { id: 'amb-data', title: 'Fira', content: '<p>Cos</p>', revision: 1, publishDate: '2026-10-05T08:30:00.000Z' };
  await act(async () => { expect(await result.current.publishNote(nota)).toBe(true); });
  expect(payloadEnviat().publish_date).toBe('2026-10-05T08:30:00.000Z');
  // Abans de publicar, la data es desa com la resta de camps visibles.
  expect(mocks.update.mock.calls.some(([, canvis]) => canvis.publishDate === '2026-10-05T08:30:00.000Z')).toBe(true);
});

/* Sense data triada, la data del Mur és created_at, que el servidor conserva en
   republicar (trigger section_submissions_conserva_creacio). Si el payload
   portara l'hora de publicar, cada «Actualitzar al Mur» la tornaria a datar. */
test('sense data triada (o amb brossa) el payload no porta publish_date', async () => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { await result.current.publishNote({ id: 'sense-data', title: 'T', content: '', revision: 1 }); });
  expect(payloadEnviat()).not.toHaveProperty('publish_date');
  mocks.send.mockClear();
  await act(async () => { await result.current.publishNote({ id: 'brossa', title: 'T', content: '', revision: 1, publishDate: 'demà' }); });
  expect(payloadEnviat()).not.toHaveProperty('publish_date');
});

test('republicar sense data triada tampoc no porta publish_date: la nota no puja dalt de tot', async () => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote({ id: 'republica', title: 'T', content: '', revision: 1 })).toBe(true); });
  const publicada = { id: 'republica', title: 'T nou', content: '', revision: 2, isPublished: true, publishedSubmissionId: 'republica' };
  await act(async () => { expect(await result.current.publishNote(publicada)).toBe(true); });
  expect(mocks.send).toHaveBeenCalledTimes(2);
  expect(mocks.send.mock.calls[1][0].id).toBe('republica');
  expect(payloadEnviat(1)).not.toHaveProperty('publish_date');
});

test('el camp publishDate es neteja al desar: ISO o null, mai brossa', async () => {
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  let desat;
  act(() => { desat = result.current.saveNoteField('neta', 'publishDate', 'brossa'); });
  await act(async () => { await bgSaveManager.flush('tenant-user', 'neta'); });
  expect(await desat).toBe(true);
  expect(mocks.update).toHaveBeenLastCalledWith('neta', { publishDate: null }, expect.any(Number));
  act(() => { desat = result.current.saveNoteField('neta', 'publishDate', '2026-10-05T10:30:00+02:00'); });
  await act(async () => { await bgSaveManager.flush('tenant-user', 'neta'); });
  expect(mocks.update).toHaveBeenLastCalledWith('neta', { publishDate: '2026-10-05T08:30:00.000Z' }, expect.any(Number));
});

/* ── Poliment T41/T43 · qui signa ─────────────────────────────────────── */

test('amb una entitat activa, el payload signa amb el seu nom i el seu logo', async () => {
  mocks.user = { id: 'u-1', user_metadata: { full_name: 'Pepa Soler', town_name: 'Benifallim' } };
  mocks.actor = { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: 'https://exemple.org/forn.png' };
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { await result.current.publishNote({ id: 'forn', title: 'Pa', content: '', revision: 1 }); });
  expect(payloadEnviat()).toMatchObject({ author_name: 'Forn de la Torre', author_avatar: 'https://exemple.org/forn.png' });
  // El poble de la persona no és el de l'entitat: es queda el del poble on es publica.
  expect(payloadEnviat().author_location).toBe('La Torre de les Maçanes');
});

test('una persona signa amb el seu nom i el seu poble; un correu no es publica mai', async () => {
  mocks.user = { id: 'u-1', email: 'pepa@exemple.org', user_metadata: { town_name: 'Benifallim' } };
  mocks.actor = { tipus: 'persona', id: 'u-1', nom: 'pepa@exemple.org', avatar: 'sdp-media://mitjans_privats/u-1/cara.jpg' };
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { await result.current.publishNote({ id: 'pepa', title: 'Hola', content: '', revision: 1 }); });
  const payload = payloadEnviat();
  expect(payload.author_name).toBe('Veí');
  expect(payload.author_location).toBe('Benifallim');
  // Una referència privada (sdp-media://) no viatja al Mur.
  expect(payload).not.toHaveProperty('author_avatar');
  expect(JSON.stringify(payload)).not.toContain('pepa@exemple.org');
});

test('sense actor (incrustat), el nom de l’app queda de reserva', async () => {
  mocks.externalConfig = { appName: 'Poble Amfitrió', appLocation: 'Sella' };
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { await result.current.publishNote({ id: 'amfitrio', title: 'T', content: '', revision: 1 }); });
  expect(payloadEnviat()).toMatchObject({ author_name: 'Poble Amfitrió', author_location: 'Sella' });
});
