// @vitest-environment node
/**
 * bibliotecaCarpetesLocals.test.js — La biblioteca de carpetes locals
 * recordades (IDEA-54/55 · Onada 261029_1605) contra un IndexedDB fals
 * estricte (transaccions que s'inactiven després d'un await, quota, fallades
 * en obrir, clonatge estructurat) i el doble únic de carpeta local.
 */
import { describe, expect, test } from 'vitest';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { CarpetaFalsa, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';
import {
  CODIS_BIBLIOTECA_LOCAL,
  MAX_CARPETES_RECORDADES,
  NOM_BD_ARXIUS_LOCALS,
  STORE_CARPETES_LOCALS,
  VERSIO_BD_ARXIUS_LOCALS,
  creaBibliotecaCarpetesLocals,
  desaCarpetaLocal,
  desaHandleCarpetaLocal,
  esHandleCarpetaLocal,
  llistaCarpetesLocalsRecordades,
  marcaAccesCarpetaLocal,
  nouIdCarpetaLocal,
  oblidaCarpetaLocal,
  oblidaHandleCarpetaLocal,
  oblidaTotesLesCarpetesLocals,
  recuperaCarpetaLocal,
  recuperaHandleCarpetaLocal,
  recuperaUltimaCarpetaLocal,
  verificaPermisCarpetaLocal,
  verificaPermisHandleLocal
} from './bibliotecaCarpetesLocals.js';

const fals = () => creaIdbFalsEstructurat({ clona: clonaAmbHandles });
let rellotge = 1000;
const ara = () => rellotge;
const ids = () => {
  let n = 0;
  return () => `id-${(n += 1)}`;
};
const biblioteca = (idb, extra = {}) => creaBibliotecaCarpetesLocals({ idb, ara, generaId: ids(), ...extra });
const carpeta = (nom, opcions = {}) => new CarpetaFalsa(nom, { 'a.txt': 'a' }, opcions);

describe('constants i ajudants', () => {
  test('la base, el store, la versió, el límit i els codis', () => {
    expect(NOM_BD_ARXIUS_LOCALS).toBe('socdepoble_arxius_locals_v1');
    expect(STORE_CARPETES_LOCALS).toBe('carpetes');
    expect(VERSIO_BD_ARXIUS_LOCALS).toBe(1);
    expect(MAX_CARPETES_RECORDADES).toBe(12);
    expect(CODIS_BIBLIOTECA_LOCAL).toEqual(['HANDLE_INVALID', 'SENSE_INDEXEDDB', 'TRANSACCIO_FALLIDA', 'SENSE_ESPAI', 'NO_CLONABLE']);
  });

  test('esHandleCarpetaLocal i nouIdCarpetaLocal', () => {
    expect(esHandleCarpetaLocal(carpeta('x'))).toBe(true);
    expect(esHandleCarpetaLocal({ kind: 'directory' })).toBe(false);
    expect(esHandleCarpetaLocal({ kind: 'file', entries() {} })).toBe(false);
    expect(esHandleCarpetaLocal(null)).toBe(false);
    expect(nouIdCarpetaLocal()).toMatch(/^[0-9a-f-]{36}$/);
    const ambValors = nouIdCarpetaLocal({ getRandomValues: (b) => b.fill(0xab) });
    expect(ambValors).toMatch(/^abababab-abab-4bab-abab-abababababab$/);
    expect(nouIdCarpetaLocal({})).toMatch(/^carpeta-/);
  });
});

describe('ida i tornada', () => {
  test('desa, llista (darrer accés primer), recupera i oblida; la fila té la forma {id,nom,ultimAcces,handle}', async () => {
    const idb = fals();
    const bib = biblioteca(idb);
    const a = carpeta('_multimedia_de_poble');
    const b = carpeta('_cultura_de_poble');
    rellotge = 1000;
    const ra = await bib.desa(a);
    rellotge = 2000;
    const rb = await bib.desa(b);
    expect(ra).toEqual({ ok: true, nova: true, carpeta: { id: 'id-1', nom: '_multimedia_de_poble', ultimAcces: 1000 }, desplacades: [] });
    expect(rb.carpeta).toEqual({ id: 'id-2', nom: '_cultura_de_poble', ultimAcces: 2000 });

    const llista = await bib.llista();
    expect(llista.map((r) => r.nom)).toEqual(['_cultura_de_poble', '_multimedia_de_poble']);
    expect(llista[0].handle).toBe(b);
    expect(Object.isFrozen(llista[0])).toBe(true);

    const files = idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS);
    expect(files).toHaveLength(2);
    expect(Object.keys(files[0].valor).sort()).toEqual(['handle', 'id', 'nom', 'ultimAcces']);
    expect(files.map((f) => f.clau)).toEqual(['id-1', 'id-2']);
    expect(idb.bases.get(NOM_BD_ARXIUS_LOCALS).versio).toBe(1);
    expect(idb.bases.get(NOM_BD_ARXIUS_LOCALS).stores.get(STORE_CARPETES_LOCALS).keyPath).toBe('id');

    expect((await bib.recupera('id-1')).handle).toBe(a);
    expect(await bib.recupera('no-hi-és')).toBeNull();
    expect(await bib.oblida('id-1')).toBe(true);
    expect((await bib.llista()).map((r) => r.id)).toEqual(['id-2']);
  });

  test('el mateix directori amb un objecte nou (isSameEntry) conserva l’id i actualitza l’accés en una sola fila', async () => {
    const idb = fals();
    const bib = biblioteca(idb);
    rellotge = 5000;
    await bib.desa(carpeta('fotos', { identitat: 'disc:fotos' }));
    rellotge = 6000;
    const segona = carpeta('fotos', { identitat: 'disc:fotos' });
    const r = await bib.desa(segona);
    expect(r.ok).toBe(true);
    expect(r.nova).toBe(false);
    expect(r.carpeta.id).toBe('id-1');
    expect(r.carpeta.ultimAcces).toBe(6000);
    const files = idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS);
    expect(files).toHaveLength(1);
    expect(files[0].valor.handle).toBe(segona);
  });

  test('isSameEntry absent o que llança: compta com una carpeta diferent i no llança', async () => {
    const idb = fals();
    const bib = biblioteca(idb);
    /* Un handle desat que no sap comparar-se (clonaAmbHandles el conserva tal qual). */
    const senseComparar = { kind: 'directory', name: 'x', entries() {} };
    expect((await bib.desa(senseComparar)).ok).toBe(true);
    const r = await bib.desa(carpeta('x'));
    expect(r).toMatchObject({ ok: true, nova: true });
    expect(await bib.llista()).toHaveLength(2);

    /* Un handle desat que llança en comparar tampoc no tomba res. */
    const llanca = carpeta('y');
    llanca.isSameEntry = async () => {
      throw new Error('trencat');
    };
    const idb2 = fals();
    const bib2 = biblioteca(idb2);
    await bib2.desa(llanca);
    const r2 = await bib2.desa(carpeta('y'));
    expect(r2).toMatchObject({ ok: true, nova: true });
    expect(await bib2.llista()).toHaveLength(2);
  });

  test('límit de carpetes: desplacades porta la menys recent i en queden maxCarpetes', async () => {
    const idb = fals();
    const bib = biblioteca(idb, { maxCarpetes: 3 });
    for (const [i, nom] of ['a', 'b', 'c', 'd'].entries()) {
      rellotge = 100 * (i + 1);
      const r = await bib.desa(carpeta(nom));
      if (nom === 'd') expect(r.desplacades).toEqual([{ id: 'id-1', nom: 'a' }]);
    }
    expect((await bib.llista()).map((r) => r.nom)).toEqual(['d', 'c', 'b']);
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(3);
  });

  test('marcaAcces passa la carpeta al capdavant, encara que el rellotge no avance', async () => {
    const idb = fals();
    const bib = biblioteca(idb);
    rellotge = 10;
    await bib.desa(carpeta('a'));
    await bib.desa(carpeta('b'));
    expect((await bib.llista()).map((r) => r.nom)).toEqual(['b', 'a']);
    expect(await bib.marcaAcces('id-1')).toBe(true);
    expect((await bib.llista()).map((r) => r.nom)).toEqual(['a', 'b']);
    expect(await bib.marcaAcces('no-hi-és')).toBe(false);
  });

  test('ids invàlids: null o false sense obrir la base', async () => {
    const idb = fals();
    const bib = biblioteca(idb);
    for (const id of ['', 42, null, undefined, {}]) {
      expect(await bib.recupera(id)).toBeNull();
      expect(await bib.marcaAcces(id)).toBe(false);
      expect(await bib.oblida(id)).toBe(false);
    }
    expect(idb.operacions).toEqual([]);
    expect(await bib.desa({ kind: 'file' })).toEqual({ ok: false, codi: 'HANDLE_INVALID' });
    expect(idb.operacions).toEqual([]);
  });
});

describe('clonatge real', () => {
  test('un handle amb mètodes propis no es pot clonar: NO_CLONABLE i 0 files', async () => {
    const idb = creaIdbFalsEstructurat();
    const bib = biblioteca(idb);
    const r = await bib.desa({ kind: 'directory', name: 'propi', entries() {} });
    expect(r).toEqual({ ok: false, codi: 'NO_CLONABLE' });
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
  });

  test('un handle que es clona però perd els mètodes: NO_CLONABLE per la verificació de tornada i 0 files', async () => {
    class HandleDeClasse {
      constructor() {
        this.kind = 'directory';
        this.name = 'de-classe';
      }

      async *entries() { /* buida */ }
    }
    const idb = creaIdbFalsEstructurat();
    const bib = biblioteca(idb);
    const r = await bib.desa(new HandleDeClasse());
    expect(r).toEqual({ ok: false, codi: 'NO_CLONABLE' });
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
  });
});

describe('registres corromputs i degradació', () => {
  test('els corromputs no ixen a la llista i es purguen en el desa següent', async () => {
    const idb = fals();
    const bib = biblioteca(idb);
    await bib.desa(carpeta('bona'));
    /* Una fila trencada escrita per una versió anterior. */
    await new Promise((resol, rebutja) => {
      const p = idb.open(NOM_BD_ARXIUS_LOCALS, 1);
      p.onsuccess = () => {
        const tx = p.result.transaction(STORE_CARPETES_LOCALS, 'readwrite');
        tx.objectStore(STORE_CARPETES_LOCALS).put({ id: 'trencada', nom: 7 });
        tx.oncomplete = () => {
          p.result.close();
          resol();
        };
        tx.onabort = rebutja;
      };
      p.onerror = rebutja;
    });
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(2);
    expect((await bib.llista()).map((r) => r.nom)).toEqual(['bona']);
    await bib.desa(carpeta('altra'));
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS).map((f) => f.clau)).not.toContain('trencada');
  });

  test('sense base, en obrir, en una transacció o sense espai: codis i valors buits, mai llança', async () => {
    for (const idb of [null, {}]) {
      const bib = creaBibliotecaCarpetesLocals({ idb });
      expect(await bib.desa(carpeta('x'))).toEqual({ ok: false, codi: 'SENSE_INDEXEDDB' });
      expect(await bib.llista()).toEqual([]);
      expect(await bib.recupera('a')).toBeNull();
      expect(await bib.oblidaTotes()).toBe(false);
    }
    const tancada = fals();
    tancada.fallaEnObrir = new DOMException('privat', 'InvalidStateError');
    expect(await biblioteca(tancada).desa(carpeta('x'))).toEqual({ ok: false, codi: 'SENSE_INDEXEDDB' });

    const ambError = fals();
    ambError.errorsEnTransaccio.push(new DOMException('perduda', 'UnknownError'));
    expect(await biblioteca(ambError).desa(carpeta('x'))).toEqual({ ok: false, codi: 'TRANSACCIO_FALLIDA' });

    const plena = fals();
    plena.omplit = true;
    expect(await biblioteca(plena).desa(carpeta('x'))).toEqual({ ok: false, codi: 'SENSE_ESPAI' });
    expect(plena.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
  });

  test('oblidaTotes buida el magatzem', async () => {
    const idb = fals();
    const bib = biblioteca(idb);
    await bib.desa(carpeta('a'));
    await bib.desa(carpeta('b'));
    expect(await bib.oblidaTotes()).toBe(true);
    expect(await bib.llista()).toEqual([]);
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
  });

  test('dues pestanyes veuen les mateixes carpetes', async () => {
    const idb = fals();
    await biblioteca(idb).desa(carpeta('compartida'));
    const altra = creaBibliotecaCarpetesLocals({ idb: idb.pestanya() });
    expect((await altra.llista()).map((r) => r.nom)).toEqual(['compartida']);
  });
});

describe('Gauntlet 261029 c1 · cap base nova si ningú no ha vinculat cap carpeta', () => {
  /* Un IDBFactory amb indexedDB.databases(), com Chrome, Edge, Safari 14+ i Firefox 126+. */
  const ambDatabases = (idb, databases = async () => [...idb.bases.keys()].map((name) => ({ name, version: idb.bases.get(name).versio }))) => ({
    open: (nom, versio) => idb.open(nom, versio),
    databases
  });

  test('l’eixida de sessió (oblidaTotes), llistar, recuperar, marcar i oblidar-ne una no creen la base: cap open', async () => {
    const idb = fals();
    const fabrica = ambDatabases(idb);
    /* QA-R2-04 · L'oblit de l'eixida torna { ok } (i un codi si queda pendent). */
    expect(await oblidaTotesLesCarpetesLocals({ idb: fabrica })).toEqual({ ok: true });
    const bib = biblioteca(fabrica);
    expect(await bib.llista()).toEqual([]);
    expect(await bib.recupera('a')).toBeNull();
    expect(await bib.marcaAcces('a')).toBe(false);
    expect(await bib.oblida('a')).toBe(true);
    expect(await bib.oblidaTotes()).toBe(true);
    expect(idb.bases.has(NOM_BD_ARXIUS_LOCALS)).toBe(false);
    expect(idb.operacions).toEqual([]);
  });

  test('desar sí que la crea; després es llig, i oblidar-les totes la buida', async () => {
    const idb = fals();
    const bib = biblioteca(ambDatabases(idb));
    expect((await bib.desa(carpeta('vinculada'))).ok).toBe(true);
    expect(idb.bases.has(NOM_BD_ARXIUS_LOCALS)).toBe(true);
    expect((await bib.llista()).map((r) => r.nom)).toEqual(['vinculada']);
    expect(await bib.oblidaTotes()).toBe(true);
    expect(idb.files(NOM_BD_ARXIUS_LOCALS, STORE_CARPETES_LOCALS)).toHaveLength(0);
  });

  test('si databases() falla o no torna una llista, com sempre: s’obri i es buida', async () => {
    for (const databases of [async () => { throw new Error('no'); }, async () => null]) {
      const idb = fals();
      expect(await oblidaTotesLesCarpetesLocals({ idb: ambDatabases(idb, databases) })).toEqual({ ok: true });
      expect(idb.operacions).toContain('open');
    }
  });
});

describe('verificaPermisCarpetaLocal', () => {
  test('granted sense cap petició', async () => {
    const h = carpeta('x');
    expect(await verificaPermisCarpetaLocal(h, { mode: 'readwrite', demana: true })).toBe('granted');
    expect(h.peticions).toEqual([]);
  });

  test('prompt sense demanar; amb demana, granted amb exactament una petició readwrite', async () => {
    const h = carpeta('x', { permisos: { readwrite: 'prompt' } });
    expect(await verificaPermisCarpetaLocal(h, { mode: 'readwrite' })).toBe('prompt');
    expect(h.peticions).toEqual([]);
    expect(await verificaPermisCarpetaLocal(h, { mode: 'readwrite', demana: true })).toBe('granted');
    expect(h.peticions).toEqual(['readwrite']);
  });

  test('denied, consulta que llança → denied; petició que llança SecurityError → prompt', async () => {
    expect(await verificaPermisCarpetaLocal(carpeta('x', { permisos: { read: 'denied', readwrite: 'denied' } }))).toBe('denied');
    const llança = carpeta('y');
    llança.injectaFallada('query');
    expect(await verificaPermisCarpetaLocal(llança)).toBe('denied');
    const senseGest = carpeta('z', { permisos: { read: 'prompt', readwrite: 'prompt' }, demanats: { read: new DOMException('gest', 'SecurityError') } });
    expect(await verificaPermisCarpetaLocal(senseGest, { demana: true })).toBe('prompt');
  });

  test('mode desconegut o handle invàlid → denied; sense API de permisos → granted', async () => {
    expect(await verificaPermisCarpetaLocal(carpeta('x'), { mode: 'escriure' })).toBe('denied');
    expect(await verificaPermisCarpetaLocal(carpeta('x'), { mode: null })).toBe('denied');
    expect(await verificaPermisCarpetaLocal(null)).toBe('denied');
    expect(await verificaPermisCarpetaLocal({ kind: 'directory', entries() {} })).toBe('granted');
    expect(verificaPermisHandleLocal).toBe(verificaPermisCarpetaLocal);
  });
});

describe('funcions soltes i àlies de compatibilitat', () => {
  test('les del pla treballen sobre la mateixa base', async () => {
    const idb = fals();
    const opcions = { idb, ara, generaId: ids() };
    const h = carpeta('solta');
    const r = await desaCarpetaLocal(h, opcions);
    expect(r.ok).toBe(true);
    expect((await llistaCarpetesLocalsRecordades({ idb })).map((c) => c.nom)).toEqual(['solta']);
    expect((await recuperaCarpetaLocal(r.carpeta.id, { idb })).handle).toBe(h);
    expect(await marcaAccesCarpetaLocal(r.carpeta.id, { idb })).toBe(true);
    expect((await recuperaUltimaCarpetaLocal({ idb })).id).toBe(r.carpeta.id);
    expect(await oblidaCarpetaLocal(r.carpeta.id, { idb })).toBe(true);
    expect(await recuperaUltimaCarpetaLocal({ idb })).toBeNull();
    await desaCarpetaLocal(carpeta('una'), { idb });
    expect(await oblidaTotesLesCarpetesLocals({ idb })).toEqual({ ok: true });
    expect(await llistaCarpetesLocalsRecordades({ idb })).toEqual([]);
  });

  test('desaHandle → true; recuperaHandle → el més recent; oblidaHandle oblida el més recent', async () => {
    const idb = fals();
    const a = carpeta('a');
    const b = carpeta('b');
    rellotge = 1;
    expect(await desaHandleCarpetaLocal(a, { idb, ara })).toBe(true);
    rellotge = 2;
    expect(await desaHandleCarpetaLocal(b, { idb, ara })).toBe(true);
    expect(await recuperaHandleCarpetaLocal({ idb })).toBe(b);
    expect(await oblidaHandleCarpetaLocal({ idb })).toBe(true);
    expect(await recuperaHandleCarpetaLocal({ idb })).toBe(a);
    expect(await desaHandleCarpetaLocal(null, { idb })).toBe(false);
  });
});
