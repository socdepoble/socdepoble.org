import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';
import { creaRegistreSessionsIAIA, titolDeLaPrimeraPregunta } from './sessionsIAIALocals.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('extrau un tema curt de la primera pregunta sense conservar enllaços ni correus', () => {
  expect(titolDeLaPrimeraPregunta('Hola, IAIA! Què és el **Mercat**? També vull altres detalls.')).toBe('el Mercat');
  expect(titolDeLaPrimeraPregunta('¿Qué es la biblioteca? Dime más.')).toBe('la biblioteca');
  expect(titolDeLaPrimeraPregunta('Contacte https://example.test/correu prova@example.test')).toBe('Contacte');
  expect(titolDeLaPrimeraPregunta('✨ https://example.test')).toBeNull();
  expect(titolDeLaPrimeraPregunta('El meu PIN sintètic és 1234')).toBeNull();
  expect(titolDeLaPrimeraPregunta('Contacte 600 000 000')).toBeNull();
  expect(titolDeLaPrimeraPregunta('token_fake-synthetic')).toBeNull();
  expect(titolDeLaPrimeraPregunta('À'.repeat(100))).toBe(`${'À'.repeat(48)}…`);
});

it('desa el primer títol per sessió i àmbit i el recupera des d’una altra connexió', async () => {
  vi.stubGlobal('indexedDB', creaIdbFals().idb);
  vi.stubGlobal('BroadcastChannel', null);
  const a = creaRegistreSessionsIAIA(), b = creaRegistreSessionsIAIA();
  const fil1 = 'iaia-local-00000000-0000-4000-8000-000000000001';
  const fil2 = 'iaia-local-00000000-0000-4000-8000-000000000002';
  await a.desaPrimerTitol('àmbit-a', fil1, 'Rutes');
  await b.desaPrimerTitol('àmbit-a', fil1, 'Altres temes');
  await b.desaPrimerTitol('àmbit-a', fil2, 'Mercat');
  await b.desaPrimerTitol('àmbit-b', fil1, 'Biblioteca');
  expect(await a.llig('àmbit-a')).toEqual([{ id: fil2, titol: 'Mercat' }, { id: fil1, titol: 'Rutes' }]);
  expect(await a.llig('àmbit-b')).toEqual([{ id: fil1, titol: 'Biblioteca' }]);
  await expect(a.desaPrimerTitol('àmbit-a', 'fil-remot', 'Fora')).rejects.toThrow(TypeError);
  a.tanca();
  b.tanca();
});

const FIL_A = 'iaia-local-00000000-0000-4000-8000-000000000011';
const FIL_B = 'iaia-local-00000000-0000-4000-8000-000000000012';
const AMBIT_A = JSON.stringify(['backend-a', 'persona-a', 'actor-a']);
const AMBIT_B = JSON.stringify(['backend-b', 'persona-a', 'actor-b']);
const AMBIT_ALTRE = JSON.stringify(['backend-a', 'persona-b', 'actor-a']);

it('oblida un títol i rebutja la seua escriptura tardana des d’una altra connexió', async () => {
  const fals = creaIdbFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const a = creaRegistreSessionsIAIA(), b = creaRegistreSessionsIAIA();
  try {
    await a.desaPrimerTitol(AMBIT_A, FIL_A, 'Mercat');
    await a.desaPrimerTitol(AMBIT_A, FIL_B, 'Biblioteca');
    await b.llig(AMBIT_A);
    await a.oblidaSessio(AMBIT_A, FIL_A);
    expect(await b.llig(AMBIT_A)).toEqual([{ id: FIL_B, titol: 'Biblioteca' }]);
    await expect(b.desaPrimerTitol(AMBIT_A, FIL_A, 'Títol vell')).rejects.toMatchObject({ codi: 'SESSIO_IAIA_OBLIDADA' });
    expect(await a.llig(AMBIT_A)).toEqual([{ id: FIL_B, titol: 'Biblioteca' }]);
    expect(JSON.stringify(fals.files('xat-iaia-titols', 'titols'))).not.toContain('Mercat');
    expect(fals.registre.obertes).toBe(0);
  } finally { a.tanca(); b.tanca(); }
});

it('la purga de persona elimina títols de tots els seus àmbits i talla una primera escriptura amb testimoni vell', async () => {
  const fals = creaIdbFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const a = creaRegistreSessionsIAIA(), b = creaRegistreSessionsIAIA();
  try {
    await a.desaPrimerTitol(AMBIT_A, FIL_A, 'Mercat');
    await a.desaPrimerTitol(AMBIT_B, FIL_B, 'Biblioteca');
    await a.desaPrimerTitol(AMBIT_ALTRE, FIL_A, 'Altra persona');
    await b.llig(AMBIT_A);
    await a.oblidaPersona('persona-a');
    await expect(b.desaPrimerTitol(AMBIT_A, FIL_B, 'Primera pregunta tardana')).rejects.toMatchObject({ codi: 'OBLIT_IAIA_ACTUALITZAT' });
    expect(await a.llig(AMBIT_A)).toEqual([]);
    expect(await a.llig(AMBIT_B)).toEqual([]);
    expect(await a.llig(AMBIT_ALTRE)).toEqual([{ id: FIL_A, titol: 'Altra persona' }]);
    expect(JSON.stringify(fals.files('xat-iaia-titols', 'titols'))).not.toMatch(/Mercat|Biblioteca/);
    await a.desaPrimerTitol(AMBIT_A, FIL_B, 'Tema nou');
    expect(await b.llig(AMBIT_A)).toEqual([{ id: FIL_B, titol: 'Tema nou' }]);
  } finally { a.tanca(); b.tanca(); }
});


function ambQuota(fals) {
  const control = { plena: false };
  const obri = fals.idb.open.bind(fals.idb);
  fals.idb.open = (...args) => {
    const peticio = obri(...args);
    let escolta;
    Object.defineProperty(peticio, 'onsuccess', {
      set(fn) { escolta = fn; },
      get() { return (...events) => {
        const db = peticio.result, transaccio = db.transaction;
        db.transaction = (...argumentsTx) => {
          const tx = transaccio(...argumentsTx), store = tx.objectStore;
          tx.objectStore = (...argumentsStore) => {
            const objecte = store(...argumentsStore), put = objecte.put;
            objecte.put = (...valors) => {
              if (control.plena) throw new DOMException('Quota plena', 'QuotaExceededError');
              return put(...valors);
            };
            return objecte;
          };
          return tx;
        };
        escolta?.(...events);
      }; }
    });
    return peticio;
  };
  return control;
}

it('l’avortament per quota deixa intacte el títol i només el reintent confirma l’oblit', async () => {
  const fals = creaIdbFals(), quota = ambQuota(fals);
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const a = creaRegistreSessionsIAIA();
  try {
    await a.desaPrimerTitol(AMBIT_A, FIL_A, 'Mercat');
    quota.plena = true;
    await expect(a.oblidaSessio(AMBIT_A, FIL_A)).rejects.toMatchObject({ name: 'QuotaExceededError' });
    expect(await a.llig(AMBIT_A)).toEqual([{ id: FIL_A, titol: 'Mercat' }]);
    expect(fals.files('xat-iaia-titols', 'titols')[0].oblidades).toEqual([]);
    quota.plena = false;
    await a.oblidaSessio(AMBIT_A, FIL_A);
    expect(await a.llig(AMBIT_A)).toEqual([]);
    expect(fals.registre.obertes).toBe(0);
  } finally { a.tanca(); }
});

it('la purga fallida queda pendent i cap registre nou mostra els títols fins a completar-la', async () => {
  const fals = creaIdbFals(), quota = ambQuota(fals);
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const a = creaRegistreSessionsIAIA();
  let b;
  try {
    await a.desaPrimerTitol(AMBIT_A, FIL_A, 'Mercat');
    quota.plena = true;
    await expect(a.oblidaPersona('persona-a')).rejects.toMatchObject({ codi: 'OBLIT_IAIA_PENDENT' });
    b = creaRegistreSessionsIAIA();
    await expect(b.llig(AMBIT_A)).rejects.toMatchObject({ codi: 'OBLIT_IAIA_PENDENT' });
    expect(fals.files('xat-iaia-titols', 'titols')[0].sessions).toHaveLength(1);
    quota.plena = false;
    expect(await b.llig(AMBIT_A)).toEqual([]);
    expect(fals.files('xat-iaia-titols', 'titols')).toEqual([]);
    expect(fals.files('xat-iaia-titols', 'oblit')).toEqual([{ persona: JSON.stringify(['persona', 'persona-a']), generacio: 1 }]);
  } finally { a.tanca(); b?.tanca(); }
});

it('la versió 2 conserva els títols previs i un client antic no pot saltar-se les tombes', async () => {
  const fals = creaIdbFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const antic = creaMagatzemIdb({ nom: 'xat-iaia-titols', stores: { titols: { clau: 'ambit' } }, llistaBlanca: { titols: ['ambit', 'sessions'] } });
  const nou = creaRegistreSessionsIAIA();
  try {
    await antic.desa('titols', { ambit: AMBIT_A, sessions: [{ id: FIL_A, titol: 'Biblioteca' }] });
    expect(await nou.llig(AMBIT_A)).toEqual([{ id: FIL_A, titol: 'Biblioteca' }]);
    await nou.oblidaSessio(AMBIT_A, FIL_A);
    await expect(antic.desa('titols', { ambit: AMBIT_A, sessions: [{ id: FIL_A, titol: 'Biblioteca' }] })).rejects.toMatchObject({ codi: 'VERSIO_ANTIGA' });
    expect(await nou.llig(AMBIT_A)).toEqual([]);
  } finally { antic.tanca(); nou.tanca(); }
});


it('una obertura bloquejada no confirma una purga només en memòria ni torna a exposar els títols', async () => {
  const fals = creaIdbFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const a = creaRegistreSessionsIAIA();
  let b, c;
  try {
    await a.desaPrimerTitol(AMBIT_A, FIL_A, 'Mercat');
    fals.control.fallaObrir = true;
    b = creaRegistreSessionsIAIA();
    await expect(b.oblidaPersona('persona-a')).rejects.toMatchObject({ codi: 'OBLIT_IAIA_PENDENT' });
    fals.control.fallaObrir = false;
    c = creaRegistreSessionsIAIA();
    expect(await c.llig(AMBIT_A)).toEqual([]);
    expect(fals.files('xat-iaia-titols', 'titols')).toEqual([]);
  } finally { a.tanca(); b?.tanca(); c?.tanca(); }
});


it('un registre d’oblit truncat o corrupte falla tancat i no sobreescriu la protecció', async () => {
  const fals = creaIdbFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  const a = creaRegistreSessionsIAIA();
  try {
    await a.desaPrimerTitol(AMBIT_A, FIL_A, 'Mercat');
    const store = fals.bases.get('xat-iaia-titols').stores.get('titols');
    const original = structuredClone(store.files.get(AMBIT_A));
    for (const canvi of [{ oblidades: 'truncat' }, { oblidades: ['UUID incomplet'] }, { generacio: '1' }]) {
      store.files.set(AMBIT_A, { ...original, ...canvi });
      await expect(a.llig(AMBIT_A)).rejects.toThrow(TypeError);
      await expect(a.desaPrimerTitol(AMBIT_A, FIL_B, 'Biblioteca')).rejects.toThrow(TypeError);
      expect(store.files.get(AMBIT_A)).toMatchObject(canvi);
    }
    store.files.set(AMBIT_A, original);
    expect(await a.llig(AMBIT_A)).toEqual([{ id: FIL_A, titol: 'Mercat' }]);
  } finally { a.tanca(); }
});
