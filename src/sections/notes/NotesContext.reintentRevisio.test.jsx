/* Gauntlet R22 (notes-07, dades-01) · Publicar després d'un intent fallit i d'una edició, amb un doble fidel de
   publica_nota_al_mur (2611122200): CAS de la revisió, l'operació només existix si s'ha confirmat, i la consulta
   d'una operació desconeguda torna null. També els motius honestos quan el servidor no publica. */
import { beforeEach as abansDePublicar } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
abansDePublicar(() => { globalThis.indexedDB = creaIdbFalsEstructurat(); });
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ update: vi.fn(), send: vi.fn(), toast: vi.fn(), notes: [], servidor: { revisio: 3, operacions: new Set() } }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: mocks.notes, noteFolders: [], scopeKey: 'tenant-user-r22', workspaceKey: 'session-r22', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, confirmaPublicacioNota: vi.fn(async (_id, rebut) => rebut), mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send, feedPosts: [], marketItems: [] }) }));
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

/* Una nota nova a cada prova: la cua de desat (bgSaveManager) és del mòdul i en conserva l'estat. */
let comptador = 0;
let ID = 'nota-r22-0';
const servidor = mocks.servidor;
/* El doble de la RPC: consulta → rebut només si l'operació s'ha confirmat; enviament → CAS i rebut. */
const rpcFidel = async sub => {
  if (sub.consulta === true) return servidor.operacions.has(sub.operationId)
    ? { publicacio: { id: sub.id }, nota_revision: servidor.revisio, publicada_revision: servidor.revisio, replay: true } : null;
  if (sub.expectedNoteRevision !== servidor.revisio) throw Object.assign(new Error('Supabase 409: SDP-MUR-REVISION: la nota ha canviat'), { codi: 'SDP-MUR-REVISION', status: 409 });
  servidor.revisio += 1; servidor.operacions.add(sub.operationId);
  return { publicacio: { id: sub.id }, nota_revision: servidor.revisio, publicada_revision: servidor.revisio, replay: false };
};

beforeEach(() => {
  servidor.revisio = 3; servidor.operacions.clear();
  bgSaveManager.knownRevisions.clear();
  comptador += 1; ID = `nota-r22-${comptador}`;
  mocks.notes = [{ id: ID, title: 'A', content: '<p>A</p>', revision: 3 }];
  mocks.toast.mockReset(); mocks.send.mockReset();
  /* El servidor de notes, amb CAS: cada desat avança la revisió. */
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => {
    if (revision !== servidor.revisio) throw Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 });
    servidor.revisio += 1;
    return { id, ...changes, revision: servidor.revisio };
  });
});
afterEach(cleanup);

test('notes-07 · fallada de xarxa, edició i reintent: la consulta diu «no aplicat» i el primer reintent ja publica la revisió vigent', async () => {
  mocks.send.mockImplementationOnce(async () => { throw Object.assign(new Error('xarxa'), { status: 0 }); }).mockImplementation(rpcFidel);
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(false); });
  const [primer] = mocks.send.mock.calls.map(([s]) => s);
  expect(primer.expectedNoteRevision).toBe(servidor.revisio);
  // Una edició (en este dispositiu o en un altre) avança la revisió del servidor després de la fallada; la llista la porta.
  servidor.revisio += 1;
  mocks.notes = [{ id: ID, title: 'B', content: '<p>B</p>', revision: servidor.revisio }];
  const { result: despres } = renderHook(useNotes, { wrapper: NotesProvider });
  let fet;
  await act(async () => { fet = await despres.current.publishNote(mocks.notes[0]); });
  expect(fet).toBe(true);
  const crides = mocks.send.mock.calls.map(([s]) => s);
  expect(crides).toHaveLength(3);
  const [, consulta, reenviament] = crides;
  expect(consulta).toMatchObject({ consulta: true, id: primer.id, operationId: primer.operationId });
  expect(reenviament).toMatchObject({ id: primer.id, operationId: primer.operationId, expectedNoteRevision: servidor.revisio - 1 });
  expect(reenviament.expectedNoteRevision).toBeGreaterThan(primer.expectedNoteRevision);
  expect(mocks.toast).toHaveBeenLastCalledWith('Nota publicada correctament al mur!', 'success');
});

test('notes-07 · un rebuig SDP-MUR-REVISION es diu com un conflicte, mai «es reutilitzarà la mateixa publicació»', async () => {
  mocks.send.mockImplementation(async () => { throw Object.assign(new Error('Supabase 409: SDP-MUR-REVISION: la nota ha canviat'), { codi: 'SDP-MUR-REVISION', status: 409 }); });
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  let error;
  await act(async () => { error = await result.current.publishNote(mocks.notes[0]).then(() => null, motiu => motiu); });
  expect(error?.name).toBe('ErrorPublicacio');
  expect(error.message).toBe('No s’ha publicat: la nota ha canviat mentrestant, potser en un altre dispositiu. Revisa la versió que tens ara i torna-la a publicar.');
  expect(mocks.toast.mock.calls.map(([text]) => text).join(' ')).not.toMatch(/reutilitzarà|pendent de confirmar/);
});

test('dades-01 · sense la publicació atòmica al servidor: «no s’ha publicat res», cap intent pendent i cap «pendent de confirmar»', async () => {
  const absent = () => Object.assign(new Error('El servidor encara no té la publicació de notes al Mur d’esta versió: no s’ha publicat res.'), { codi: 'esquema-absent', status: 404 });
  mocks.send.mockImplementation(async () => { throw absent(); });
  const { result } = renderHook(useNotes, { wrapper: NotesProvider });
  let error;
  await act(async () => { error = await result.current.publishNote(mocks.notes[0]).then(() => null, motiu => motiu); });
  expect(error?.message).toBe('No s’ha publicat res: el servidor encara no té la publicació de notes al Mur d’esta versió. Torna-ho a provar quan s’haja actualitzat.');
  expect(mocks.toast.mock.calls.map(([text]) => text).join(' ')).not.toMatch(/pendent de confirmar/);
  // L'intent s'ha descartat: el reintent no fa cap consulta d'una operació que no ha existit mai.
  mocks.send.mockClear();
  await act(async () => { await result.current.publishNote(mocks.notes[0]).catch(() => {}); });
  expect(mocks.send.mock.calls.some(([s]) => s.consulta === true)).toBe(false);
});
