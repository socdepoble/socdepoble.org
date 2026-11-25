/* Gauntlet R22 (notes-05 i sql-02, part client) · publishNote davant dels rebuigs que no es curen reintentant:
   · SDP-MUR-OWNER (42501, HTTP 403; runtime.js hi posa `codi`) i SDP-MUR-PUBLICACIO (22023, HTTP 400, només al
     missatge) de publica_nota_al_mur v2 (2611122200): l'intent del diari es retira, el motiu ho diu i mai
     «Reintenta-la: es reutilitzarà la mateixa publicació»;
   · la còpia pública d'una imatge que no s'ha pogut pujar (promoteToPublic rebutja amb CODI_PROMOCIO_PUBLICA,
     p. ex. SDP-PURGA-004 després d'una retirada): no s'envia res al Mur, mai la ref privada;
   · PUB-D11-01 (v1.2.25) · la promoció que torna la ref privada tal qual, sense llançar: tampoc no s'envia res. */
import { beforeEach as abansDePublicar } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
abansDePublicar(() => { globalThis.indexedDB = creaIdbFalsEstructurat(); });
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
const mocks = vi.hoisted(() => ({
  update: vi.fn(), send: vi.fn(), toast: vi.fn(), promou: vi.fn(), notes: [], capacitats: new Set(), traductor: null
}));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: mocks.notes, noteFolders: [], scopeKey: 'tenant-user-r22-def', workspaceKey: 'session-r22-def', config: { tenantId: 'tenant' },
  status: 'ready', updateNote: mocks.update, confirmaPublicacioNota: vi.fn(async (_id, rebut) => rebut), mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
/* PUB-D11-01 · Sense traductor, la reserva (el valencià de sempre); amb un, la llengua de qui publica. */
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (key, fallback) => (mocks.traductor ? mocks.traductor(key, fallback) : fallback) })
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
/* PUB-D11-01 · La geo de les fotos, la de veres però espiada: la guarda va abans (ni el tros ni l'EXIF del hero
   per a una publicació que no eixirà). */
vi.mock('./geoDeLesFotos.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fotosGeoDelCos: vi.fn(actual.fotosGeoDelCos), geoDelHero: vi.fn(actual.geoDelHero) };
});
import { NotesProvider, useNotes } from './NotesContext';
import { fotosGeoDelCos, geoDelHero } from './geoDeLesFotos.js';
import { motiuPublicacioNoFeta, esRebuigDefinitiuDePublicacio, esRebuigDeMida, campQuePassaDelLimit, motiuDeMida, LIMITS_PUBLICACIO,
  TEXTOS_VISIBILITAT_NOTA } from './visibilitatNota.js';
import { CODI_MITJANS, CODI_PROMOCIO_PUBLICA } from '../../data/errorsBackend.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';

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
  mocks.traductor = null;
  vi.mocked(fotosGeoDelCos).mockClear(); vi.mocked(geoDelHero).mockClear();
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

/* PUB-D11-01 (v1.2.25, D09/D11) · promoteToPublic torna la ref privada tal qual, sense llançar, en sis camins
   (storage.js · promouSenseMarc: camí no net, baixada fallida, un fitxer buit o de més de 5 MiB, un format no
   sanejable com AVIF, i un duplicat no verificable o de bytes distints). Abans eixia al Mur amb la ref privada i
   «Nota publicada correctament al mur!»: només l'autora veia la foto i la resta del poble, la targeta sense foto
   per sempre. Ara la publicació s'atura pel mateix camí que sql-02 (CODI_PROMOCIO_PUBLICA, motiu 'imatge'), abans
   de la geo i d'obrir cap intent al diari, i també sense la capacitat 'mitjans'. Al cos només compta el que la
   promoció hi busca: el prefix nu escrit com a text es publica. El PDF privat dins del cos no es decidix ací
   (vegeu NotesContext.jsx). */
describe('PUB-D11-01 · una ref que la promoció torna privada no arriba mai al Mur', () => {
  const PRIVADA = 'sdp-media://mitjans_privats/poble/u1/notes/foto.avif';
  const rebut = async (sub) => (sub.consulta === true ? null
    : { publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false });
  const CASOS = [['la capçalera', { coverImage: PRIVADA }], ['una imatge del cos', { content: `<p>A</p><img src="${PRIVADA}">` }],
    ['el logotip', { logoImage: PRIVADA }], ['el logotip de nit', { logoImageDark: PRIVADA }]];

  test.each(CASOS)(
    '%s: promou = async ref => ref; send no es crida i el motiu és el de la imatge', async (_cas, extra) => {
      mocks.capacitats = new Set(['mitjans']);
      mocks.promou.mockImplementation(async (ref) => ref);
      mocks.send.mockImplementation(rebut);
      mocks.notes = [nota(extra)];
      const { result } = renderHook(useNotes, { wrapper: NotesProvider });
      const motiu = motiuPublicacioNoFeta('imatge');
      let error;
      await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
      expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
      expect(mocks.promou).toHaveBeenCalledWith(PRIVADA, expect.anything());
      expect(mocks.send).not.toHaveBeenCalled();
      expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
      expect(mocks.toast.mock.calls.filter(([, tipus]) => tipus === 'success')).toEqual([]);
      expect(textosDelsToasts().filter((text) => /Reintenta-la|pendent de confirmar/i.test(text))).toEqual([]);
      expect(mocks.update.mock.calls.filter(([, canvis]) => canvis?.isPublished)).toEqual([]);
      /* La guarda va abans de la geo: ni el tros ni l'EXIF del hero (fins a uns 8 s) per a res. */
      expect(fotosGeoDelCos).not.toHaveBeenCalled();
      expect(geoDelHero).not.toHaveBeenCalled();
      /* Cap intent obert al diari: amb la còpia pública feta, el pròxim intent s'envia directe, sense consulta,
         i ja no porta cap ref privada. La geo hi passa una vegada (l'espia és viva). */
      mocks.promou.mockImplementation(async (ref) => ref.replace('mitjans_privats/', 'mitjans/'));
      await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
      expect(mocks.send.mock.calls.map(([sub]) => sub.consulta === true)).toEqual([false]);
      expect(JSON.stringify(mocks.send.mock.calls[0][0].payload)).not.toContain('mitjans_privats');
      expect(fotosGeoDelCos).toHaveBeenCalledTimes(1);
    });

  test.each(CASOS)('sense la capacitat mitjans (cap promoció), %s privada tampoc no ix al Mur', async (_cas, extra) => {
    mocks.capacitats = new Set();
    mocks.promou.mockImplementation(async (ref) => ref);
    mocks.send.mockImplementation(rebut);
    mocks.notes = [nota(extra)];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    const motiu = motiuPublicacioNoFeta('imatge');
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.promou).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
    expect(fotosGeoDelCos).not.toHaveBeenCalled();
    /* Reintentar no la cola: la mateixa nota, una altra vegada, s'atura igual (cap estat de l'intent d'abans). */
    let altra;
    await act(async () => { altra = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    expect(altra).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test.each([['seguit d’un espai', 'Les fotos privades viuen a sdp-media://mitjans_privats/ i no es veuen.'],
    ['entre cometes', 'El prefix "sdp-media://mitjans_privats/" no és cap foto.']])(
    'el prefix nu escrit com a text (%s) no és cap imatge: es publica i no es promou res', async (_cas, text) => {
      mocks.capacitats = new Set(['mitjans']);
      mocks.promou.mockImplementation(async (ref) => ref);
      mocks.send.mockImplementation(rebut);
      mocks.notes = [nota({ content: `<p>${text}</p>` })];
      const { result } = renderHook(useNotes, { wrapper: NotesProvider });
      await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
      expect(mocks.promou).not.toHaveBeenCalled();
      expect(mocks.send.mock.calls.map(([sub]) => sub.consulta === true)).toEqual([false]);
      expect(mocks.send.mock.calls[0][0].payload.content).toContain(text);
      expect(mocks.toast.mock.calls.filter(([, tipus]) => tipus === 'error')).toEqual([]);
    });

  test('el veí ho llig en la seua llengua: el motiu de la imatge ix del diccionari en les 5 llengües', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async (ref) => ref);
    mocks.send.mockImplementation(rebut);
    const vistos = new Set();
    expect(SUPPORTED_LANGUAGES.map(({ code }) => code)).toEqual(['ca', 'es', 'en', 'eu', 'gl']);
    for (const { code } of SUPPORTED_LANGUAGES) {
      cleanup();
      mocks.toast.mockClear();
      mocks.traductor = createTranslator(code);
      const esperat = mocks.traductor(...TEXTOS_VISIBILITAT_NOTA.errorPublicarImatge);
      mocks.notes = [nota({ id: `${ID}-${code}`, coverImage: PRIVADA })];
      const { result } = renderHook(useNotes, { wrapper: NotesProvider });
      let error;
      await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
      expect([code, error?.message]).toEqual([code, esperat]);
      expect(mocks.toast).toHaveBeenCalledWith(esperat, 'error');
      vistos.add(esperat);
    }
    expect(vistos.size).toBe(5);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

/* v1.2.25 · K-CAB-PUBD11 (PUB-D11-01, opció (a); clau section.notes.visibilitat.errorPublicarDocument de G9) · Un
   document privat del cos (PDF, TXT, CSV, ODT o DOCX, per la ruta real de la ref) no es pot fer públic mai
   (promouSenseMarc només sanejarà JPEG, PNG i WebP: mitjansPublicsNets.js), i abans s'aturava amb el motiu de la
   imatge, que no li escau. Ara té motiu propi, 'document'. La capçalera, els logotips i qualsevol imatge privada que
   quede continuen sent 'imatge', que té prioritat. Igual que la imatge: no s'envia res, ni geo ni intent al diari. */
describe('K-CAB-PUBD11 · un document privat del cos té motiu propi', () => {
  const IMATGE = 'sdp-media://mitjans_privats/poble/u1/notes/foto.avif';
  const doc = (nom) => `sdp-media://mitjans_privats/poble/u1/notes/${nom}`;
  const rebut = async (sub) => (sub.consulta === true ? null
    : { publicacio: { id: sub.id }, nota_revision: sub.expectedNoteRevision + 1, publicada_revision: sub.expectedNoteRevision + 1, replay: false });
  const publicaAmbError = async (nota_) => {
    mocks.notes = [nota_];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let error;
    await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
    return { error, result };
  };
  const capNoEnvia = () => {
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.toast.mock.calls.filter(([, tipus]) => tipus === 'success')).toEqual([]);
    expect(textosDelsToasts().filter((text) => /Reintenta-la|pendent de confirmar/i.test(text))).toEqual([]);
    expect(mocks.update.mock.calls.filter(([, canvis]) => canvis?.isPublished)).toEqual([]);
    expect(fotosGeoDelCos).not.toHaveBeenCalled();
    expect(geoDelHero).not.toHaveBeenCalled();
  };

  test('el motiu del document és propi, distint del de la imatge, i la reserva és el valor valencià de ca.js', () => {
    const motiu = motiuPublicacioNoFeta('document');
    expect(motiu).toBe(TEXTOS_VISIBILITAT_NOTA.errorPublicarDocument[1]);
    expect(TEXTOS_VISIBILITAT_NOTA.errorPublicarDocument[0]).toBe('section.notes.visibilitat.errorPublicarDocument');
    expect(motiu).toBe(createTranslator('ca')('section.notes.visibilitat.errorPublicarDocument'));
    expect(motiu).not.toBe(motiuPublicacioNoFeta('imatge'));
  });

  /* Llei 0 · Un document no es pot fer públic mai (promouSenseMarc només saneja JPEG, PNG i WebP:
     src/data/mitjansPublicsNets.js), de manera que el motiu no pot prometre que reintentar-ho ho arreglarà. El text de
     G9 deia «Torna-ho a provar més tard o lleva’l»: ara diu només el que funciona, llevar-lo. */
  test('el motiu del document no promet cap reintent en cap llengua: només llevar-lo', () => {
    const REINTENT = { ca: /Torna-ho a provar/, es: /Vuelve a intentarlo/, en: /Try again/i, eu: /Saiatu berriro/, gl: /Téntao de novo/ };
    for (const { code } of SUPPORTED_LANGUAGES) {
      const text = createTranslator(code)(...TEXTOS_VISIBILITAT_NOTA.errorPublicarDocument);
      expect([code, REINTENT[code].test(text)]).toEqual([code, false]);
      /* Control: el de la imatge sí que el porta (una imatge es pot tornar a pujar). */
      expect([code, REINTENT[code].test(createTranslator(code)(...TEXTOS_VISIBILITAT_NOTA.errorPublicarImatge))]).toEqual([code, true]);
    }
  });

  test.each([
    ['un PDF enllaçat', `<p>A</p><p><a href="${doc('informe.pdf')}">Informe</a></p>`, doc('informe.pdf')],
    ['un TXT enllaçat', `<p><a href="${doc('acta.txt')}">Acta</a></p>`, doc('acta.txt')],
    ['un CSV enllaçat', `<p><a href="${doc('comptes.csv')}">Comptes</a></p>`, doc('comptes.csv')],
    ['un ODT enllaçat', `<p><a href="${doc('carta.odt')}">Carta</a></p>`, doc('carta.odt')],
    ['un DOCX enllaçat', `<p><a href="${doc('bases.docx')}">Bases</a></p>`, doc('bases.docx')],
    ['un PDF amb l’extensió en majúscules', `<p><a href="${doc('INFORME.PDF')}">Informe</a></p>`, doc('INFORME.PDF')],
    ['un PDF amb consulta i fragment', `<p><a href="${doc('informe.pdf?v=2#p=3')}">Informe</a></p>`, doc('informe.pdf?v=2#p=3')],
    ['la ref d’un PDF escrita com a text', `<p>Vegeu ${doc('informe.pdf')} al Bloc.</p>`, doc('informe.pdf')]
  ])('%s al cos: motiu «document», no s’envia res', async (_cas, content, ref) => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async (r) => r);
    mocks.send.mockImplementation(rebut);
    const { error } = await publicaAmbError(nota({ content }));
    const motiu = motiuPublicacioNoFeta('document');
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.promou).toHaveBeenCalledWith(ref, expect.anything());
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
    expect(mocks.toast).not.toHaveBeenCalledWith(motiuPublicacioNoFeta('imatge'), 'error');
    capNoEnvia();
  });

  test.each([
    ['una imatge privada del cos', { content: `<p>A</p><img src="${IMATGE}"><p><a href="${doc('informe.pdf')}">Informe</a></p>` }],
    ['la capçalera', { coverImage: IMATGE, content: `<p><a href="${doc('informe.pdf')}">Informe</a></p>` }],
    ['el logotip', { logoImage: IMATGE, content: `<p><a href="${doc('informe.pdf')}">Informe</a></p>` }],
    ['el logotip de nit', { logoImageDark: IMATGE, content: `<p><a href="${doc('informe.pdf')}">Informe</a></p>` }],
    ['una ref privada sense extensió de document', { content: `<p><a href="${doc('informe')}">Informe</a> i <a href="${doc('acta.txt')}">acta</a></p>` }],
    ['una ref que només porta «pdf» abans de l’extensió real', { content: `<p><img src="${doc('informe.pdf.webp')}"><a href="${doc('acta.txt')}">acta</a></p>` }],
    ['una ref amb «.pdf» a la carpeta', { content: `<p><img src="${doc('arxiu.pdf/foto.webp')}"><a href="${doc('acta.csv')}">acta</a></p>` }]
  ])('amb %s privada i un document privat, el motiu continua sent «imatge» (té prioritat)', async (_cas, extra) => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async (r) => r);
    mocks.send.mockImplementation(rebut);
    const { error } = await publicaAmbError(nota(extra));
    const motiu = motiuPublicacioNoFeta('imatge');
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'error');
    capNoEnvia();
  });

  test('el camí de veres: la foto del cos es fa pública i el PDF no (promouSenseMarc el torna tal qual): motiu «document»', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async (r) => (/\.pdf$/.test(r) ? r : r.replace('mitjans_privats/', 'mitjans/')));
    mocks.send.mockImplementation(rebut);
    const { error, result } = await publicaAmbError(nota({ coverImage: IMATGE,
      content: `<p>A</p><img src="${IMATGE}"><p><a href="${doc('informe.pdf')}">Informe</a></p>` }));
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuPublicacioNoFeta('document') });
    expect(mocks.promou).toHaveBeenCalledWith(doc('informe.pdf'), expect.anything());
    capNoEnvia();
    /* Cap intent obert al diari: sense el PDF, el pròxim intent s'envia directe, sense consulta, i sense cap ref privada. */
    mocks.notes = [nota({ coverImage: IMATGE, content: `<p>A</p><img src="${IMATGE}">` })];
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    expect(mocks.send.mock.calls.map(([sub]) => sub.consulta === true)).toEqual([false]);
    expect(JSON.stringify(mocks.send.mock.calls[0][0].payload)).not.toContain('mitjans_privats');
  });

  test('sense la capacitat mitjans (cap promoció), un PDF privat del cos també s’atura amb el motiu «document»', async () => {
    mocks.capacitats = new Set();
    mocks.promou.mockImplementation(async (r) => r);
    mocks.send.mockImplementation(rebut);
    const { error } = await publicaAmbError(nota({ content: `<p><a href="${doc('informe.pdf')}">Informe</a></p>` }));
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuPublicacioNoFeta('document') });
    expect(mocks.promou).not.toHaveBeenCalled();
    capNoEnvia();
  });

  test('control · un PDF que ja és públic (mitjans/) no para res: es publica', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async (r) => r);
    mocks.send.mockImplementation(rebut);
    mocks.notes = [nota({ content: '<p><a href="sdp-media://mitjans/poble/u1/notes/informe.pdf">Informe</a></p>' })];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(mocks.notes[0])).toBe(true); });
    expect(mocks.promou).not.toHaveBeenCalled();
    expect(mocks.toast.mock.calls.filter(([, tipus]) => tipus === 'error')).toEqual([]);
  });

  test('el veí ho llig en la seua llengua: el motiu del document ix del diccionari en les 5 llengües, i parla d’este poble', async () => {
    mocks.capacitats = new Set(['mitjans']);
    mocks.promou.mockImplementation(async (r) => r);
    mocks.send.mockImplementation(rebut);
    /* Gauntlet R22, ronda 3 (visibilitatNota.test.js, la de la imatge) · El poble de qui llig és «este poble». */
    const ESTE = { ca: 'la resta d’este poble', es: 'el resto de este pueblo', en: 'the rest of this village', eu: 'herri honetako gainerakoek', gl: 'o resto deste pobo' };
    const DEL = /\bdel poble\b|\bdel pueblo\b|\bthe town\b|\bherriko gainerakoek\b|\bdo pobo\b/i;
    const vistos = new Set();
    for (const { code } of SUPPORTED_LANGUAGES) {
      cleanup();
      mocks.toast.mockClear();
      mocks.traductor = createTranslator(code);
      const esperat = mocks.traductor(...TEXTOS_VISIBILITAT_NOTA.errorPublicarDocument);
      expect([code, esperat.includes(ESTE[code]), DEL.test(esperat)]).toEqual([code, true, false]);
      if (code !== 'ca') expect(esperat).not.toBe(TEXTOS_VISIBILITAT_NOTA.errorPublicarDocument[1]);
      mocks.notes = [nota({ id: `${ID}-${code}`, content: `<p><a href="${doc('informe.pdf')}">Informe</a></p>` })];
      const { result } = renderHook(useNotes, { wrapper: NotesProvider });
      let error;
      await act(async () => { error = await result.current.publishNote(mocks.notes[0]).catch((e) => e); });
      expect([code, error?.message]).toEqual([code, esperat]);
      expect(mocks.toast).toHaveBeenCalledWith(esperat, 'error');
      vistos.add(esperat);
    }
    expect(vistos.size).toBe(5);
    expect(mocks.send).not.toHaveBeenCalled();
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
