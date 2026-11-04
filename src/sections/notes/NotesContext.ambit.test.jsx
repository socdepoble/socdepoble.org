/* IDEA-61 (T0, prompt 261102_1532; carril L1) · La fitxa d'àmbit d'una nota
   (note.fitxa = { ambit, estat, dades }) a publishNote: es desa com la resta de
   camps, el payload es projecta amb el contracte (utils/publicacioUniversal.js)
   i la fila va a la secció de l'àmbit. Sense fitxa, el payload és byte a byte el
   de sempre i la secció, 'mur' (Llei del Píxel). canviaEstatPublicacio canvia
   l'estat, el desa i torna a publicar amb el mateix id. Fitxer propi: el gestor
   de desament (bgSaveManager) és d'àmbit de mòdul (patró de
   NotesContext.dataPublicacio.test.jsx). */
import { renderHook, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  update: vi.fn(), send: vi.fn(), toast: vi.fn(), resolve: vi.fn(), notes: [], scopeKey: 'tenant-user', workspaceKey: 'session',
  actor: null, user: null, externalConfig: {}, memberships: [], config: { tenantId: 'tenant' },
  /* idea61-01 (Gauntlet T7a, 261104) · Les files carregades del Mur i del Mercat. */
  feed: [], mercat: []
}));
/* Correccions L1-A2 i L1-A4 (àrbitre, 261102) · resolveNote (el detall d'una
   nota resum) i config (el mode de dades, que fa rebutjar publishNote). */
vi.mock('./NotesDataContext', () => ({ useNotesData: () => ({
  notes: mocks.notes, noteFolders: [], scopeKey: mocks.scopeKey, workspaceKey: mocks.workspaceKey, config: mocks.config,
  status: 'ready', updateNote: mocks.update, resolveNote: mocks.resolve, mouNota: vi.fn(), esborraNota: vi.fn()
}) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca', externalConfig: mocks.externalConfig }),
  useUIActions: () => ({ normalizeSearchText: s => s, t: (_key, fallback) => fallback })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: mocks.send, feedPosts: mocks.feed, marketItems: mocks.mercat }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: mocks.actor, memberships: mocks.memberships }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
vi.mock('../../data/backendPort.js', () => ({ promoteToPublic: vi.fn(), teCapacitat: () => false }));
vi.mock('./GlobalSaveManager.js', async importOriginal => {
  const actual = await importOriginal();
  const records = new Map();
  return { ...actual, bgSaveManager: new actual.GlobalSaveManager({ persist: async (key, transform) => {
    const next = transform(records.get(key) || {}); records.set(key, next); return next;
  } }) };
});
import { NotesProvider, useNotes, fitxaDeNota } from './NotesContext';
import { bgSaveManager } from './GlobalSaveManager.js';
import { esFitxaDAmbit, perAmbit } from '../../utils/publicacioUniversal.js';
import { motiuSeccioPublicada, publicaAmbMotiu } from './visibilitatNota.js';

beforeEach(() => {
  mocks.toast.mockReset();
  mocks.send.mockReset().mockResolvedValue(undefined);
  mocks.update.mockReset().mockImplementation(async (id, changes, revision) => ({ id, ...changes, revision: revision + 1 }));
  mocks.resolve.mockReset().mockResolvedValue({ status: 'not-found' });
  mocks.notes = [];
  mocks.actor = null;
  mocks.user = null;
  mocks.externalConfig = {};
  mocks.memberships = [];
  mocks.config = { tenantId: 'tenant' };
  mocks.feed = [];
  mocks.mercat = [];
});
afterEach(cleanup);

const textHostil = () => JSON.parse('{"toString":0}');
const enviament = (index = 0) => mocks.send.mock.calls[index][0];
const payloadEnviat = (index = 0) => enviament(index).payload;
/* Les claus del payload de sempre d'una nota sense actor ni poble (publishNote). */
const CLAUS_DE_SEMPRE = ['sectionId', 'type', 'title', 'subtitle', 'description', 'content', 'copyright', 'image', 'labels', 'author_name'];
const VIATGE = () => ({
  ambit: 'vehicle', estat: 'disponible',
  dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', places: '3', aportacio: '5 €' }
});
const VIATGE_NET = { ambit: 'vehicle', estat: 'disponible', dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', places: 3, aportacio: '5 €' } };
const nota = (id, extra = {}) => ({ id, title: 'Fira', content: '<p>Cos</p>', revision: 1, ...extra });
/* Les claus que hi ha a l'últim desat del camp fitxa. */
const ultimaFitxaDesada = () => mocks.update.mock.calls.map(([, canvis]) => canvis).filter((canvis) => Object.hasOwn(canvis, 'fitxa')).at(-1)?.fitxa;
/* Una còpia sense eixes claus. */
const sense = (objecte, ...claus) => Object.fromEntries(Object.entries(objecte).filter(([clau]) => !claus.includes(clau)));

describe('fitxaDeNota (el contracte aplicat a la nota)', () => {
  test('una fitxa vertical ix neta; la del Mur, la brossa i un objecte hostil, null', () => {
    expect(fitxaDeNota(VIATGE())).toEqual(VIATGE_NET);
    expect(fitxaDeNota({ ambit: 'mur', estat: 'reservat', dades: {} })).toBeNull();
    for (const brossa of [null, undefined, 'vehicle', 7, ['vehicle'], { ambit: 'xyz' }, { estat: 'reservat' }, textHostil()]) expect(fitxaDeNota(brossa)).toBeNull();
    const neta = fitxaDeNota({ ambit: 'treball', estat: 'hackejat', dades: { modalitat: 'oferta_feina', ofici: textHostil(), municipi: ' Sella ', contacte: 'tel 600', altra: 'x' } });
    expect(neta).toEqual({ ambit: 'treball', estat: 'disponible', dades: { modalitat: 'oferta_feina', municipi: 'Sella', contacte: 'tel 600' } });
    expect(esFitxaDAmbit(neta)).toBe(true);
  });
});

describe('publishNote', () => {
  test('Llei del Píxel · sense fitxa (o amb null, la del Mur o brossa) el payload és byte a byte el de sempre i la secció, mur', async () => {
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(nota('sense'))).toBe(true); });
    const deSempre = payloadEnviat();
    expect(enviament().sectionId).toBe('mur');
    expect(Object.keys(deSempre).sort()).toEqual([...CLAUS_DE_SEMPRE].sort());
    expect(deSempre).toMatchObject({ sectionId: 'mur', type: 'feed', title: 'Fira' });
    for (const [id, fitxa] of [['nul', null], ['mur', { ambit: 'mur', estat: 'reservat', dades: {} }], ['brossa', 'vehicle'], ['hostil', textHostil()]]) {
      mocks.send.mockClear();
      await act(async () => { expect(await result.current.publishNote(nota(id, { fitxa }))).toBe(true); });
      expect(enviament().sectionId, id).toBe('mur');
      expect(payloadEnviat(), id).toEqual(deSempre);
    }
    /* Una nota sense el camp no desa cap fitxa; amb null, el desa (per a llevar-la). */
    expect(mocks.update.mock.calls.filter(([id, canvis]) => id === 'sense' && Object.hasOwn(canvis, 'fitxa'))).toEqual([]);
    expect(mocks.update.mock.calls.some(([id, canvis]) => id === 'nul' && canvis.fitxa === null)).toBe(true);
  });

  test('un viatge: es desa la fitxa neta, el payload porta ambit, estat, dades i el type de l’àmbit, i la fila va a mur', async () => {
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(nota('plana'))).toBe(true); });
    const plana = payloadEnviat();
    mocks.send.mockClear();
    const fitxa = { ...VIATGE(), dades: { ...VIATGE().dades, lloc_eixida: textHostil(), places: 99 } };
    await act(async () => { expect(await result.current.publishNote(nota('viatge', { title: 'Viatge a Alcoi', fitxa }))).toBe(true); });
    expect(enviament().sectionId).toBe('mur');
    const { ambit, estat, dades, type } = payloadEnviat();
    expect({ ambit, estat, dades, type }).toEqual({ ambit: 'vehicle', estat: 'disponible', type: 'vehicle', dades: { modalitat: 'oferisc_places', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', aportacio: '5 €' } });
    /* La resta del payload és la de sempre: només canvien el títol i el type de l'àmbit. */
    expect(sense(payloadEnviat(), 'ambit', 'estat', 'dades', 'type')).toEqual({ ...sense(plana, 'type'), title: 'Viatge a Alcoi', sectionId: 'mur' });
    expect(JSON.stringify(payloadEnviat())).not.toContain('toString');
    expect(perAmbit([payloadEnviat()], 'vehicle')).toHaveLength(1);
    expect(ultimaFitxaDesada()).toEqual({ ambit: 'vehicle', estat: 'disponible', dades: { modalitat: 'oferisc_places', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', aportacio: '5 €' } });
  });

  test('un producte: la fila va a mercat amb type product, price, tag i category_slug del contracte', async () => {
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    const fitxa = { ambit: 'mercat', estat: 'reservat', dades: { preu: '12 €', unitat: 'litre', categoria: 'Oli d’oliva', estoc: 'Queden 3' } };
    await act(async () => { expect(await result.current.publishNote(nota('oli', { title: 'Oli', fitxa }))).toBe(true); });
    expect(enviament()).toMatchObject({ id: 'oli', sectionId: 'mercat' });
    expect(payloadEnviat()).toMatchObject({
      sectionId: 'mercat', type: 'product', title: 'Oli', ambit: 'mercat', estat: 'reservat', price: '12 €', tag: 'Oli d’oliva', category_slug: 'oli-d-oliva',
      dades: { preu: '12 €', unitat: 'litre', categoria: 'Oli d’oliva', estoc: 'Queden 3' }
    });
  });

  test('compartir (una connexió és contingut d’altri) ignora la fitxa: secció mur i cap clau d’àmbit', async () => {
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.compartirNota(nota('compartida', { fitxa: VIATGE() }))).toBe(true); });
    expect(enviament().sectionId).toBe('mur');
    expect(payloadEnviat().type).toBe('compartit');
    for (const clau of ['ambit', 'estat', 'dades']) expect(payloadEnviat()).not.toHaveProperty(clau);
  });

  test('republicar amb la fitxa reutilitza el mateix id (l’upsert reemplaça el payload sencer)', async () => {
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(nota('repub', { fitxa: VIATGE() }))).toBe(true); });
    const publicada = nota('repub', { revision: 2, isPublished: true, publishedSubmissionId: 'repub', fitxa: { ...VIATGE(), estat: 'complet' } });
    await act(async () => { expect(await result.current.publishNote(publicada)).toBe(true); });
    expect(mocks.send.mock.calls.map(([s]) => [s.id, s.sectionId, s.payload.estat])).toEqual([['repub', 'mur', 'disponible'], ['repub', 'mur', 'complet']]);
  });
});

/* idea61-01 (Gauntlet T7a, 261104) · Una publicació no canvia mai de secció:
   el trigger sdp_force_author (2609261500_identitat_perfil_f1.sql) rebutja
   l'upsert amb un section_id nou («SDP-SEC-002: section_id is immutable») i la
   fila es queda on era. Moure entre el Mur i el Mercat una nota ja publicada
   (l'àmbit, la carpeta o ?ambit=) feia fallar cada «Actualitzar al Mur» amb un
   fals «torna-ho a provar». Ara publishNote no l'envia si la fila carregada és
   d'una altra secció, i el rebuig del servidor (la fila de fora de la
   finestra) es diu amb el motiu de veres, no amb «Reintenta-la». */
describe('idea61-01 · una publicació no canvia de secció (SDP-SEC-002)', () => {
  const PRODUCTE = Object.freeze({ ambit: 'mercat', estat: 'disponible', dades: { preu: '12 €' } });
  const publicada = (id, extra = {}) => nota(id, { title: 'Oli verge', isPublished: true, publishedSubmissionId: id, revision: 2, ...extra });
  const REBUIG_SECCIO = 'Supabase 400: {"code":"P0001","details":null,"hint":null,"message":"SDP-SEC-002: section_id is immutable"}';

  test('la fila és al Mur i la nota porta ara la fitxa del Mercat: no s’envia res i el motiu diu on viu', async () => {
    mocks.feed = [{ id: 'oli', title: 'Oli verge', ownerUserId: 'u-pep' }];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let error;
    await act(async () => { error = await result.current.publishNote(publicada('oli', { fitxa: PRODUCTE })).catch((motiu) => motiu); });
    const motiu = motiuSeccioPublicada('mur');
    expect(motiu).toMatch(/Mur/);
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiu });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls.filter(([, canvis]) => canvis?.isPublished)).toEqual([]);
    expect(mocks.toast).toHaveBeenCalledWith(motiu, 'info');
    /* El selector (publicaAmbMotiu) diu el motiu en línia, no «torna-ho a provar». */
    await act(async () => {
      await expect(publicaAmbMotiu(() => result.current.publishNote(publicada('oli', { fitxa: PRODUCTE })))).rejects.toThrow(motiu);
    });
  });

  test('la fila és al Mercat i la nota ja no hi porta fitxa (o en porta una de vertical): tampoc', async () => {
    mocks.mercat = [{ id: 'oli', title: 'Oli verge', ownerUserId: 'u-pep', ambit: 'mercat', type: 'product' }];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    for (const fitxa of [null, VIATGE()]) {
      let error;
      await act(async () => { error = await result.current.publishNote(publicada('oli', { fitxa })).catch((motiu) => motiu); });
      expect(error, JSON.stringify(fitxa)).toMatchObject({ name: 'ErrorPublicacio', message: motiuSeccioPublicada('mercat') });
    }
    expect(mocks.send).not.toHaveBeenCalled();
  });

  test('a la mateixa secció s’actualitza com sempre (el mateix id), i una fila d’una altra nota no compta', async () => {
    mocks.feed = [{ id: 'viatge', title: 'Viatge' }];
    mocks.mercat = [{ id: 'oli', title: 'Oli verge', ambit: 'mercat', type: 'product' }, { id: 'altra', title: 'Altra' }];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.publishNote(publicada('oli', { fitxa: { ...PRODUCTE, estat: 'reservat' } }))).toBe(true); });
    await act(async () => { expect(await result.current.publishNote(publicada('viatge', { fitxa: VIATGE() }))).toBe(true); });
    await act(async () => { expect(await result.current.publishNote(nota('nova', { fitxa: PRODUCTE }))).toBe(true); });
    expect(mocks.send.mock.calls.map(([s]) => [s.id, s.sectionId])).toEqual([['oli', 'mercat'], ['viatge', 'mur'], ['nova', 'mercat']]);
  });

  test('fora de la finestra carregada, el rebuig del servidor diu el motiu (mai «Reintenta-la») i rebutja amb ErrorPublicacio', async () => {
    mocks.send.mockRejectedValue(new Error(REBUIG_SECCIO));
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let error;
    await act(async () => { error = await result.current.publishNote(publicada('oli', { fitxa: PRODUCTE })).catch((motiu) => motiu); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuSeccioPublicada('mur') });
    await act(async () => { error = await result.current.publishNote(publicada('oli', { fitxa: null })).catch((motiu) => motiu); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuSeccioPublicada('mercat') });
    expect(mocks.toast.mock.calls.map(([text]) => text).filter((text) => /Reintenta-la/.test(text))).toEqual([]);
    expect(mocks.update.mock.calls.filter(([, canvis]) => canvis?.isPublished)).toEqual([]);
    /* Amb la causa (com l'error del xat) o el codi a part, el mateix. */
    mocks.send.mockRejectedValueOnce(Object.assign(new Error('Abortada'), { cause: { code: 'P0001', message: 'SDP-SEC-002: section_id is immutable' } }));
    await act(async () => { error = await result.current.publishNote(publicada('oli', { fitxa: PRODUCTE })).catch((motiu) => motiu); });
    expect(error).toMatchObject({ name: 'ErrorPublicacio', message: motiuSeccioPublicada('mur') });
  });

  test('canviaEstatPublicacio sobre una nota moguda de secció: false sense enviar res (el toast ja diu el motiu)', async () => {
    mocks.feed = [{ id: 'oli', title: 'Oli verge' }];
    mocks.notes = [publicada('oli', { fitxa: PRODUCTE })];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.canviaEstatPublicacio('oli', 'reservat')).toBe(false); });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledWith(motiuSeccioPublicada('mur'), 'info');
  });
});

describe('saveNoteField', () => {
  test('el camp fitxa es neteja amb el contracte, mai amb el sanejador de text; la brossa es desa com a null', async () => {
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    let desat;
    act(() => { desat = result.current.saveNoteField('neta', 'fitxa', { ...VIATGE(), dades: { ...VIATGE().dades, lloc_eixida: textHostil() } }); });
    await act(async () => { await bgSaveManager.flush('tenant-user', 'neta'); });
    expect(await desat).toBe(true);
    expect(mocks.update).toHaveBeenLastCalledWith('neta', { fitxa: { ...VIATGE_NET, dades: sense(VIATGE_NET.dades, 'lloc_eixida') } }, expect.any(Number));
    expect(JSON.stringify(mocks.update.mock.calls.at(-1)[1])).not.toContain('[object Object]');
    act(() => { desat = result.current.saveNoteField('neta', 'fitxa', 'brossa'); });
    await act(async () => { await bgSaveManager.flush('tenant-user', 'neta'); });
    expect(mocks.update).toHaveBeenLastCalledWith('neta', { fitxa: null }, expect.any(Number));
  });
});

describe('canviaEstatPublicacio', () => {
  const publicada = () => nota('pub', { title: 'Viatge', isPublished: true, publishedSubmissionId: 'pub', fitxa: VIATGE() });
  const esborrany = () => nota('esb', { fitxa: { ambit: 'habitatge', estat: 'disponible', dades: { modalitat: 'lloguer', preu: '400 €' } } });
  /* Una nota resum: la que porta la llista en remot (sense el cos). */
  const resum = () => ({ ...sense(publicada(), 'content'), contentLoaded: false });
  /* Com NotesDataContext.updateNote: la llista es queda amb el que el servidor
     ha desat. Sense això, en esborrar-se la capa local (L1-A5) la nota tornaria
     a l'estat d'abans del desat, cosa que a l'app no passa. */
  beforeEach(() => {
    mocks.update.mockImplementation(async (id, changes, revision) => {
      mocks.notes = mocks.notes.map((n) => (n.id === id ? { ...n, ...changes, revision: revision + 1 } : n));
      return { id, ...changes, revision: revision + 1 };
    });
  });

  test('una nota publicada: actualitza l’estat, el desa i torna a publicar amb el mateix id i el payload complet', async () => {
    mocks.notes = [publicada(), esborrany(), nota('plana')];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.canviaEstatPublicacio('pub', 'reservat')).toBe(true); });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(enviament()).toMatchObject({ id: 'pub', sectionId: 'mur' });
    expect(payloadEnviat()).toMatchObject({ type: 'vehicle', title: 'Viatge', ambit: 'vehicle', estat: 'reservat', dades: VIATGE_NET.dades });
    expect(ultimaFitxaDesada()).toEqual({ ...VIATGE_NET, estat: 'reservat' });
    /* La capa local ja porta l'estat nou. */
    expect(result.current.notes.find((n) => n.id === 'pub').fitxa.estat).toBe('reservat');
  });

  test('un esborrany: desa l’estat nou i no publica res', async () => {
    mocks.notes = [publicada(), esborrany(), nota('plana')];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.canviaEstatPublicacio('esb', 'tancat')).toBe(true); });
    await act(async () => { await bgSaveManager.flush('tenant-user', 'esb'); });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(ultimaFitxaDesada()).toEqual({ ambit: 'habitatge', estat: 'tancat', dades: { modalitat: 'lloguer', preu: '400 €' } });
    expect(result.current.notes.find((n) => n.id === 'esb').fitxa.estat).toBe('tancat');
  });

  test('sense fitxa, amb un estat de fora d’ESTATS o amb una nota que no hi és: false i res no es mou', async () => {
    mocks.notes = [publicada(), esborrany(), nota('plana')];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    for (const [id, estat] of [['plana', 'reservat'], ['pub', 'venut'], ['pub', 7], ['no-hi-es', 'reservat'], [null, 'reservat']]) {
      await act(async () => { expect(await result.current.canviaEstatPublicacio(id, estat), `${id} ${estat}`).toBe(false); });
    }
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls.filter(([, canvis]) => Object.hasOwn(canvis, 'fitxa'))).toEqual([]);
  });

  /* Correcció L1-A2 (àrbitre, 261102) · La llista en remot porta resums
     (contentLoaded false, sense cos, emoticona, data ni fitxa): republicar-ne
     un tal qual reescrivia la fila del Mur amb content '' i sense publish_date
     ni icon. El detall arriba amb la llista següent, no amb el retorn de
     resolveNote: la crida comença fora d'act (el render del detall ha de poder
     passar mentre canviaEstatPublicacio espera) i s'espera dins. */
  test('L1-A2 · una nota resum es resol abans de republicar: el Mur rep el cos, l’emoticona i la data resolts, mai el cos buit', async () => {
    mocks.notes = [resum()];
    const { result, rerender } = renderHook(useNotes, { wrapper: NotesProvider });
    mocks.resolve.mockImplementation(async (id) => {
      mocks.notes = [{ ...publicada(), id, contentLoaded: true, content: '<p>Cos resolt</p>', icon: '🚗', publishDate: '2026-11-10T08:00:00.000Z' }];
      rerender();
      return { status: 'found' };
    });
    const canvi = result.current.canviaEstatPublicacio('pub', 'reservat');
    await act(async () => { expect(await canvi).toBe(true); });
    expect(mocks.resolve).toHaveBeenCalledTimes(1);
    expect(mocks.resolve).toHaveBeenCalledWith('pub');
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(enviament()).toMatchObject({ id: 'pub', sectionId: 'mur' });
    expect(payloadEnviat()).toMatchObject({
      type: 'vehicle', ambit: 'vehicle', estat: 'reservat', content: '<p>Cos resolt</p>', icon: '🚗', publish_date: '2026-11-10T08:00:00.000Z'
    });
    expect(ultimaFitxaDesada()).toEqual({ ...VIATGE_NET, estat: 'reservat' });
  });

  test('L1-A2 · si la nota resum no es pot resoldre (error de xarxa, o no trobada), false: ni es desa ni s’envia res', async () => {
    mocks.notes = [resum()];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    mocks.resolve.mockRejectedValueOnce(new Error('xarxa'));
    await act(async () => { expect(await result.current.canviaEstatPublicacio('pub', 'reservat')).toBe(false); });
    mocks.resolve.mockResolvedValueOnce({ status: 'not-found' });
    await act(async () => { expect(await result.current.canviaEstatPublicacio('pub', 'reservat')).toBe(false); });
    expect(mocks.resolve).toHaveBeenCalledTimes(2);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.update.mock.calls.filter(([, canvis]) => Object.hasOwn(canvis, 'fitxa'))).toEqual([]);
    /* Una nota amb el cos carregat no es torna a resoldre. */
    mocks.notes = [publicada()];
    const { result: carregada } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await carregada.current.canviaEstatPublicacio('pub', 'reservat')).toBe(true); });
    expect(mocks.resolve).toHaveBeenCalledTimes(2);
  });

  /* Correcció L1-A4 (àrbitre, 261102) · publishNote rebutja quan no ha arribat
     ni a provar-ho (mode local, desat pendent, signatura aliena): un botó de
     llista sense catch deixaria una «Unhandled promise rejection» a la consola.
     El toast ja l'ha fet publishNote; ací, false. El rebuig per les normes
     (SDP-MOD-428) passa tal qual: l'editor el tracta. */
  test('L1-A4 · un rebuig de publishNote torna false (el toast ja està fet); el de les normes passa tal qual; la xarxa, false', async () => {
    mocks.config = { tenantId: 'tenant', dataMode: 'local' };
    mocks.notes = [publicada()];
    const { result: local } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await local.current.canviaEstatPublicacio('pub', 'reservat')).toBe(false); });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.toast).toHaveBeenCalledTimes(1);
    /* L'estat nou queda a la nota (es desa igualment): el Mur no el rep fins que es publique. */
    expect(local.current.notes.find((n) => n.id === 'pub').fitxa.estat).toBe('reservat');
    cleanup();

    mocks.config = { tenantId: 'tenant' };
    mocks.notes = [publicada()];
    const { result } = renderHook(useNotes, { wrapper: NotesProvider });
    const normes = Object.assign(new Error('Supabase 403: SDP-MOD-428: cal acceptar les normes'), { code: 'SDP-MOD-428' });
    mocks.send.mockRejectedValueOnce(normes);
    await act(async () => { await expect(result.current.canviaEstatPublicacio('pub', 'complet')).rejects.toBe(normes); });
    mocks.send.mockRejectedValueOnce(new Error('xarxa'));
    await act(async () => { expect(await result.current.canviaEstatPublicacio('pub', 'tancat')).toBe(false); });
    expect(mocks.send).toHaveBeenCalledTimes(2);
  });

  /* Correcció L1-A5 (àrbitre, 261102) · La capa local (localNoteOverrides) del
     camp fitxa no s'esborrava mai després del desat: clearLocalNoteFields
     comparava per identitat i el valor desat és sempre un objecte nou de
     fitxaDeNota. La capa tapava el que el servidor diguera després (l'estat
     canviat des d'un altre aparell). */
  test('L1-A5 · la capa local de la fitxa s’esborra quan el servidor confirma el desat: una recàrrega amb un estat nou guanya', async () => {
    mocks.notes = [publicada()];
    const { result, rerender } = renderHook(useNotes, { wrapper: NotesProvider });
    await act(async () => { expect(await result.current.canviaEstatPublicacio('pub', 'reservat')).toBe(true); });
    await act(async () => { await bgSaveManager.flush('tenant-user', 'pub'); });
    expect(ultimaFitxaDesada()).toEqual({ ...VIATGE_NET, estat: 'reservat' });
    expect(result.current.notes.find((n) => n.id === 'pub').fitxa.estat).toBe('reservat');
    /* Un altre aparell ha completat el viatge: la recàrrega ha de guanyar. */
    mocks.notes = [{ ...publicada(), revision: 3, fitxa: { ...VIATGE_NET, estat: 'complet' } }];
    await act(async () => { rerender(); });
    expect(result.current.notes.find((n) => n.id === 'pub').fitxa.estat).toBe('complet');
    /* Les categories i les etiquetes (llistes noves del sanejador), igual. */
    act(() => { result.current.setLocalNoteField('pub', 'tags', ['fira', 'poble']); });
    await act(async () => { await bgSaveManager.flush('tenant-user', 'pub'); });
    mocks.notes = [{ ...publicada(), revision: 4, tags: ['altres'], fitxa: { ...VIATGE_NET, estat: 'complet' } }];
    await act(async () => { rerender(); });
    expect(result.current.notes.find((n) => n.id === 'pub').tags).toEqual(['altres']);
  });
});
