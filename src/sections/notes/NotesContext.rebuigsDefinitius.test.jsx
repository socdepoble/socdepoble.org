/* Gauntlet R22 (notes-05 i sql-02, part client) · publishNote davant dels rebuigs que no es curen reintentant:
   · SDP-MUR-OWNER (42501, HTTP 403; runtime.js hi posa `codi`) i SDP-MUR-PUBLICACIO (22023, HTTP 400, només al
     missatge) de publica_nota_al_mur v2 (2611122200): l'intent del diari es retira, el motiu ho diu i mai
     «Reintenta-la: es reutilitzarà la mateixa publicació»;
   · la còpia pública d'una imatge que no s'ha pogut pujar (promoteToPublic rebutja amb CODI_PROMOCIO_PUBLICA,
     p. ex. SDP-PURGA-004 després d'una retirada): no s'envia res al Mur, mai la ref privada. */
import { beforeEach as abansDePublicar } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
abansDePublicar(() => { globalThis.indexedDB = creaIdbFalsEstructurat(); });
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  update: vi.fn(), send: vi.fn(), toast: vi.fn(), promou: vi.fn(), notes: [], capacitats: new Set()
}));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: mocks.notes, noteFolders: [], scopeKey: 'tenant-user-r22-def', workspaceKey: 'session-r22-def', config: { tenantId: 'tenant' },
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
vi.mock('../../data/backendPort.js', () => ({
  promoteToPublic: (...args) => mocks.promou(...args),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat)
}));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes } from './NotesContext';
import { motiuPublicacioNoFeta, esRebuigDefinitiuDePublicacio, esRebuigDeMida, campQuePassaDelLimit, motiuDeMida, LIMITS_PUBLICACIO } from './visibilitatNota.js';
import { CODI_MITJANS, CODI_PROMOCIO_PUBLICA } from '../../data/errorsBackend.js';

/* Els rebuigs tal com els construïx runtime.js (ErrorSupabase): el text «Supabase NNN: {json}», l'estat, el
   sqlstate i, només per a SDP-MUR-REVISION i SDP-MUR-OWNER, el `codi`. */
const rebuigRpc = (status, sqlstate, missatge, codi) => Object.assign(
  new Error(`Supabase ${status}: {"code":"${sqlstate}","details":null,"hint":null,"message":"${missatge}"}`),
  { status, sqlstate, ...(codi ? { codi } : {}) });
const OWNER = () => rebuigRpc(403, '42501', 'SDP-MUR-OWNER: acte no disponible per a esta sessió.', 'SDP-MUR-OWNER');
const PUBLICACIO = () => rebuigRpc(400, '22023', 'SDP-MUR-PUBLICACIO: un acte nou necessita un UUID independent de la nota.');
const PUBLICACIO_CONTINGUT = () => rebuigRpc(403, '42501', 'SDP-MUR-PUBLICACIO: no es pot publicar este contingut.');

let comptador = 0;
let ID = 'nota-r22-def-0';
const nota = (extra = {}) => ({ id: ID, title: 'A', content: '<p>A</p>', revision: 3, ...extra });
const textosDelsToasts = () => mocks.toast.mock.calls.map(([text]) => text);

beforeEach(() => {
  comptador += 1; ID = `nota-r22-def-${comptador}`;
  mocks.notes = [nota()];
  mocks.toast.mockReset(); mocks.send.mockReset(); mocks.promou.mockReset();
  mocks.capacitats = new Set();
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
});
afterEach(cleanup);

describe('notes-05 · SDP-MUR-OWNER i SDP-MUR-PUBLICACIO són definitius', () => {
  test('esRebuigDefinitiuDePublicacio: el codi, el missatge de la RPC o una causa; mai REVISION, REVOKED ni un text que només l’esmenta', () => {
    for (const error of [OWNER(), PUBLICACIO(), PUBLICACIO_CONTINGUT(), new Error('SDP-MUR-PUBLICACIO: autoria invàlida.'),
      Object.assign(new Error('x'), { codi: 'SDP-MUR-OWNER' }), new Error('embolcall', { cause: PUBLICACIO() })]) {
      expect(esRebuigDefinitiuDePublicacio(error), error.message).toBe(true);
    }
    for (const error of [rebuigRpc(409, '40001', 'SDP-MUR-REVISION: la nota ha canviat; recarrega-la.', 'SDP-MUR-REVISION'),
      rebuigRpc(400, '23514', 'SDP-MUR-REVOKED: UUID retirat definitivament; publica amb un UUID nou.'),
      new Error('xarxa'), new Error('El títol parla de SDP-MUR-OWNERS'), null, undefined]) {
      expect(esRebuigDefinitiuDePublicacio(error), String(error?.message)).toBe(false);
    }
  });

  test.each([['SDP-MUR-OWNER', OWNER], ['SDP-MUR-PUBLICACIO', PUBLICACIO], ['SDP-MUR-PUBLICACIO (contingut)', PUBLICACIO_CONTINGUT]])(
    '%s: rebutja amb el motiu honest, retira l’intent i el reintent no fa cap consulta de més', async (_cas, rebuig) => {
      mocks.send.mockImplementation(async () => { throw rebuig(); });
      const { result } = renderHook(useNotes, { wrapper: NotesProvider });
      const motiu = motiuPublicacioNoFeta('rebutjada');
      let error;
      await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
      expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
      expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
      await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
      expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
      const crides = mocks.send.mock.calls.map(([s]) => s);
      expect(crides).toHaveLength(2);
      expect(crides.filter((s) => s.consulta === true)).toEqual([]);
      /* L'intent retirat no es reutilitza: el segon envia una operació nova. */
      expect(crides[1].operationId).not.toBe(crides[0].operationId);
      expect(textosDelsToasts().filter((text) => /Reintenta-la|pendent de confirmar/i.test(text))).toEqual([]);
      expect(mocks.update.mock.calls.filter(([, canvis]) => canvis?.isPublished)).toEqual([]);
    });

  test('control · un error de xarxa continua deixant l’intent pendent (el reintent el consulta)', async () => {
    mocks.send.mockImplementationOnce(async () => { throw Object.assign(new Error('xarxa'), { status: 0 }); })
      .mockImplementation(async (sub) => (sub.consulta === true ? null
        : { publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false }));
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(false); });
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    expect(mocks.send.mock.calls.map(([s]) => s.consulta === true)).toEqual([false, true, false]);
  });

  test('la consulta prèvia d’un intent pendent que torna SDP-MUR-OWNER també el retira', async () => {
    mocks.send.mockImplementationOnce(async () => { throw Object.assign(new Error('xarxa'), { status: 0 }); })
      .mockImplementationOnce(async () => { throw rebuigRpc(403, '42501', 'SDP-MUR-OWNER: operació no disponible per a esta sessió.', 'SDP-MUR-OWNER'); })
      .mockImplementation(async (sub) => (sub.consulta === true ? null
        : { publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false }));
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(false); });
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuPublicacioNoFeta('rebutjada') });
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    /* xarxa, consulta rebutjada i, retirat l'intent, un enviament directe sense cap consulta. */
    expect(mocks.send.mock.calls.map(([s]) => s.consulta === true)).toEqual([false, true, false]);
  });
});

describe('sql-02 · la còpia pública d’una imatge no s’ha pogut pujar', () => {
  const PRIVADA = 'sdp-media://mitjans_privats/poble/u1/notes/foto.webp';
  const errorDePromocio = () => Object.assign(new Error('No s’ha pogut fer pública una imatge de la publicació.', {
    cause: Object.assign(new Error('No s’ha pogut pujar el fitxer: el servidor ha fallat.'), { codi: CODI_MITJANS.SERVIDOR, status: 500 })
  }), { codi: CODI_PROMOCIO_PUBLICA });

  test.each([['la capçalera', { coverImage: PRIVADA }], ['una imatge del cos', { content: `<p>A</p><img src="${PRIVADA}">` }],
    ['el logotip', { logoImage: PRIVADA }]])('%s: no s’envia res al Mur i el motiu ho diu (mai «pendent»)', async (_cas, extra) => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async () => { throw errorDePromocio(); });
    mocks.send.mockImplementation(async () => { throw new Error('No s’havia d’enviar res.'); });
    mocks.notes = [nota(extra)];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    const motiu = motiuPublicacioNoFeta('imatge');
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.promou).toHaveBeenCalledWith(PRIVADA, expect.anything());
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
    expect(textosDelsToasts().filter((text) => /Reintenta-la|pendent de confirmar/i.test(text))).toEqual([]);
  });

  test('control · amb la còpia pública feta, el payload porta la ref pública i cap de privada', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async (ref) => ref.replace('mitjans_privats/', 'mitjans/'));
    mocks.send.mockImplementation(async (sub) => ({ publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1,
      publicada_revision: sub.expectedNoteRevision + 1, replay: false }));
    mocks.notes = [nota({ coverImage: PRIVADA, content: `<p>A</p><img src="${PRIVADA}">` })];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    const payload = JSON.stringify(mocks.send.mock.calls[0][0].payload);
    expect(payload).toContain('sdp-media://mitjans/poble/u1/notes/foto.webp');
    expect(payload).not.toContain('mitjans_privats');
  });
});

/* Gauntlet R22 (ronda 3, sql-05) · El límit de mida nou del servidor (section_submissions_limita_mida, SDP-MUR-MIDA,
   22001): 1.000 caràcters de títol, 20.000 de resum (l'entradilla) i 100.000 de cos. El client el diu abans d'enviar
   i, si el servidor el rebutja igualment, el reconeix com a definitiu: l'intent es retira del diari i el motiu diu
   quin camp passa, mai «Reintenta-la: es reutilitzarà la mateixa publicació». */
describe('ronda 3 (sql-05) · SDP-MUR-MIDA és definitiu i té motiu propi', () => {
  const MIDA = (camp = 'cos', maxim = 100000) => rebuigRpc(400, '22001', `SDP-MUR-MIDA: el ${camp} d'una publicació no pot passar de ${maxim} caràcters.`, 'SDP-MUR-MIDA');
  const rebut = async (sub) => (sub.consulta === true ? null
    : { publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false });

  test('esRebuigDeMida i motiuDeMida: el codi, el SQLSTATE o el missatge; el camp, del missatge (mai el text del servidor)', () => {
    for (const error of [MIDA(), Object.assign(new Error('x'), { sqlstate: '22001' }), new Error('embolcall', { cause: MIDA('títol', 1000) })]) {
      expect(esRebuigDeMida(error), error.message).toBe(true);
    }
    for (const error of [OWNER(), PUBLICACIO(), new Error('xarxa'), new Error('parla de SDP-MUR-MIDAS'), null]) {
      expect(esRebuigDeMida(error), String(error?.message)).toBe(false);
    }
    expect(motiuDeMida({ error: MIDA('títol', 1000) })).toBe(motiuPublicacioNoFeta('midaTitol'));
    expect(motiuDeMida({ error: MIDA('resum', 20000) })).toBe(motiuPublicacioNoFeta('midaResum'));
    expect(motiuDeMida({ error: MIDA('cos') })).toBe(motiuPublicacioNoFeta('midaCos'));
    expect(motiuDeMida({ error: Object.assign(new Error('x'), { sqlstate: '22001' }) })).toBe(motiuPublicacioNoFeta('mida'));
    expect(new Set(['midaTitol', 'midaResum', 'midaCos', 'mida', 'rebutjada'].map((tipus) => motiuPublicacioNoFeta(tipus))).size).toBe(5);
  });

  test('campQuePassaDelLimit compta punts de codi, com char_length: 1.000 emoticones de títol hi caben', () => {
    expect(LIMITS_PUBLICACIO).toEqual({ titol: 1000, resum: 20000, cos: 100000 });
    expect(campQuePassaDelLimit({ titol: '🌿'.repeat(1000) })).toBeNull();
    expect(campQuePassaDelLimit({ titol: '🌿'.repeat(1001) })).toBe('titol');
    expect(campQuePassaDelLimit({ titol: 'a'.repeat(1000), resum: 'b'.repeat(20000), cos: 'c'.repeat(100000) })).toBeNull();
    expect(campQuePassaDelLimit({ resum: 'b'.repeat(20001) })).toBe('resum');
    expect(campQuePassaDelLimit({ cos: 'c'.repeat(100001) })).toBe('cos');
  });

  test('el servidor el rebutja: motiu del camp, l’intent es retira i el reintent no fa cap consulta de més', async () => {
    mocks.send.mockImplementationOnce(async () => { throw MIDA(); }).mockImplementation(rebut);
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    const motiu = motiuPublicacioNoFeta('midaCos');
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
    expect(textosDelsToasts().filter((text) => /Reintenta-la|pendent de confirmar/i.test(text))).toEqual([]);
    // Corregida la nota, el pròxim intent és nou: cap consulta d'un intent penjat, una operació nova.
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    const crides = mocks.send.mock.calls.map(([sub]) => sub);
    expect(crides.map((sub) => sub.consulta === true)).toEqual([false, false]);
    expect(crides[1].operationId).not.toBe(crides[0].operationId);
  });

  test.each([
    ['el títol', { title: 'T'.repeat(1001) }, 'midaTitol'],
    ['l’entradilla', { lead: 'E'.repeat(20001) }, 'midaResum'],
    ['el cos (una foto enganxada en data:)', { content: `<p>A</p><img src="data:image/png;base64,${'A'.repeat(100000)}">` }, 'midaCos'],
  ])('%s passa del límit: es diu abans d’enviar, sense cap intent al diari', async (_cas, extra, tipus) => {
    mocks.send.mockImplementation(rebut);
    mocks.notes = [nota(extra)];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    const motiu = motiuPublicacioNoFeta(tipus);
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
    expect(mocks.send).not.toHaveBeenCalled();
    // Sense intent obert: la nota corregida es publica directament, sense consultar-ne cap de penjat.
    mocks.notes = [nota()];
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    expect(mocks.send.mock.calls.map(([sub]) => sub.consulta === true)).toEqual([false]);
  });
});

/* Gauntlet R22 (ronda 4) · La guarda del client només val per a un acte NOU. Una publicació d'abans del límit
   que ja en passava (per exemple, amb una foto enganxada en data: dins del cos) s'ha de poder actualitzar mentre
   el camp no cresca: ho decidix el servidor (2611122200 · mur_limita_mida), i el seu rebuig (SDP-MUR-MIDA,
   22001) té el mateix motiu. El motiu del cos parla del contingut (amb el format i les imatges enganxades),
   no del «text»: passaDe compta l'HTML sencer. */
describe('ronda 4 · una actualització la decidix el servidor', () => {
  const ACTE = '11111111-1111-4111-8111-111111111111';
  const COS_LLARG = `<p>A</p><img src="data:image/png;base64,${'A'.repeat(120000)}">`;
  const publicada = (extra) => nota({ isPublished: true, publishedSubmissionId: ACTE, publishedPobleId: 'la-torre', ...extra });
  const rebut = async (sub) => (sub.consulta === true ? null
    : { publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false });
  const MIDA_COS = () => rebuigRpc(400, '22001', 'SDP-MUR-MIDA: el cos d\'una publicació no pot passar de 100000 caràcters.', 'SDP-MUR-MIDA');

  test('una publicació vigent amb un cos de més de 100.000 caràcters i el títol canviat s’envia al mateix acte', async () => {
    expect(campQuePassaDelLimit({ cos: COS_LLARG })).toBe('cos');
    mocks.send.mockImplementation(rebut);
    mocks.notes = [publicada({ title: 'Títol corregit', content: COS_LLARG })];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    const enviats = mocks.send.mock.calls.map(([sub]) => sub).filter((sub) => sub.consulta !== true);
    expect(enviats).toHaveLength(1);
    expect(enviats[0].id).toBe(ACTE);
    expect(textosDelsToasts()).not.toContain(motiuPublicacioNoFeta('midaCos'));
  });

  test('si el servidor la rebutja (el cos creix), el motiu del cos i cap «Reintenta-la»', async () => {
    mocks.send.mockImplementation(async (sub) => { if (sub.consulta === true) return null; throw MIDA_COS(); });
    mocks.notes = [publicada({ content: COS_LLARG })];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    const motiu = motiuPublicacioNoFeta('midaCos');
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
    expect(mocks.send.mock.calls.filter(([sub]) => sub.consulta !== true).map(([sub]) => sub.id)).toEqual([ACTE]);
    expect(textosDelsToasts().filter((text) => /Reintenta-la|pendent de confirmar/i.test(text))).toEqual([]);
  });

  test('una publicació nova continua comprovant-se abans d’enviar', async () => {
    mocks.send.mockImplementation(rebut);
    mocks.notes = [nota({ content: COS_LLARG })];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuPublicacioNoFeta('midaCos') });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test('el motiu del cos diu el contingut amb el format i les imatges enganxades, no «el text»', () => {
    const motiu = motiuPublicacioNoFeta('midaCos');
    expect(motiu).toContain('el contingut de la nota (amb el format i les imatges enganxades)');
    expect(motiu).not.toMatch(/el text de la nota/);
  });
});
