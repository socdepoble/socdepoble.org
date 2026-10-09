// @vitest-environment node
/* El cofre xifrat de la Gestoria (Onada 6, ordre del Mestre, 261009: «la
   seguretat ha de ser paranoica i absoluta»). De veres: WebCrypto de l'entorn
   (globalThis.crypto.subtle), el magatzem IndexedDB de producció
   (magatzemCofre.js) i un IndexedDB fals escrit ací, el model de
   facturar/__fixtures__/idbFals.js amb put, get, delete i clear (LLEI_08 de
   tractors/clausura.test.js: cap prova dels carrils importa suport de dins de
   src/). Es mira: context segur obligatori, anada i tornada, frase errònia,
   registres manipulats, canvi de frase, recuperació amb el codi, que no queda
   res en clar a l'IndexedDB, l'autobloqueig amb rellotge simulat, la còpia
   xifrada, l'exportació en clar amb confirmació i la persistència d'una
   col·lecció per al front de l'Històric. També la rotació de la clau (un
   codi o una frase retirats, amb una còpia vella, no obrin res d'ara), les
   sessions caducades d'una altra pestanya i les escriptures atòmiques del
   magatzem. Les iteracions del KDF baixen a 1.000 per a no esperar, menys a
   la prova que fixa les 600.000 de producció. Dades sintètiques: cap compte
   ni NIF real. */
import { afterEach, describe, expect, test } from 'vitest';
import { CONFIRMACIO_EN_CLAR, FORMAT_COPIA, ID_UNIC, cofreDeLaGestoria, creaCofreLocal, persistenciaDelCofre } from './cofre.js';
import { NOM_BD_COFRE, clauRegistre, creaMagatzemCofre } from './magatzemCofre.js';
import { BLOC_FARCIT, ITERACIONS_KDF, aBase64, deBase64, esIdOpac } from './nucli/cripto.js';

const cripto = globalThis.crypto;
const PROVES = 1000;
const FRASE = 'olivera vella del mas de dalt';
const NOVA = 'forn de pa de la plaça major';
const SENTINELLA = 'SENTINELLA-ANTHROPIC-4242';
const ID_A = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ID_B = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const perClau = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);
const clona = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));
const ambCodi = (codi) => expect.objectContaining({ codi });

/* Fals d'IndexedDB: diverses bases, stores amb keyPath i índexs, i add, put,
   get, getAll, delete i clear; als índexs, getAll. Les transaccions d'una
   base passen d'una en una (com fa el navegador amb les readwrite que se
   solapen) i una avortada desfà el que havia escrit. `operacions` apunta
   cada operació demanada. */
function creaIdbFals() {
  const bases = new Map();
  const operacions = [];
  const despres = (fn) => setTimeout(fn, 0);
  function creaTransaccio(base, mode) {
    const tx = { error: null };
    let pendents = 0;
    let activa = false;
    let acabada = false;
    let instantania = null;
    const espera = [];
    let allibera;
    const torn = new Promise((resol) => { allibera = resol; });
    const previ = base.cua;
    base.cua = previ.then(() => torn);
    const acaba = (correcta, error) => {
      if (acabada) return;
      acabada = true;
      if (correcta) {
        despres(() => { tx.oncomplete?.(); allibera(); });
        return;
      }
      if (instantania) for (const [nom, files] of instantania) base.stores.get(nom).files = files;
      tx.error = error ?? null;
      despres(() => {
        if (error) tx.onerror?.({ target: { error } });
        tx.onabort?.({ target: tx });
        allibera();
      });
    };
    const potAcabar = () => {
      if (activa && pendents === 0) acaba(true);
    };
    previ.then(() => {
      activa = true;
      if (mode === 'readwrite') instantania = [...base.stores].map(([nom, s]) => [nom, new Map(s.files)]);
      despres(() => {
        espera.splice(0).forEach((executa) => executa());
        potAcabar();
      });
    });
    const peticio = (que, accio) => {
      operacions.push(que);
      const p = { result: undefined, error: null };
      pendents += 1;
      const executa = () => despres(() => {
        pendents -= 1;
        if (acabada) return;
        try {
          p.result = accio();
        } catch (error) {
          p.error = error;
          acaba(false, error);
          return;
        }
        p.onsuccess?.();
        potAcabar();
      });
      if (activa) executa();
      else espera.push(executa);
      return p;
    };
    const escriptura = (accio) => () => {
      if (mode !== 'readwrite') throw Object.assign(new Error('Només lectura'), { name: 'ReadOnlyError' });
      return accio();
    };
    tx.abort = () => acaba(false, null);
    tx.objectStore = (nom) => {
      const store = base.stores.get(nom);
      if (!store) throw Object.assign(new Error(`No hi ha cap store «${nom}»`), { name: 'NotFoundError' });
      const ordenades = () => [...store.files.entries()].sort(perClau).map(([, v]) => v);
      return {
        add: (valor) => peticio('add', escriptura(() => {
          const clau = valor[store.keyPath];
          if (store.files.has(clau)) throw Object.assign(new Error('Clau duplicada'), { name: 'ConstraintError' });
          store.files.set(clau, clona(valor));
          return clau;
        })),
        put: (valor) => peticio('put', escriptura(() => {
          store.files.set(valor[store.keyPath], clona(valor));
          return valor[store.keyPath];
        })),
        delete: (clau) => peticio('delete', escriptura(() => { store.files.delete(clau); })),
        clear: () => peticio('clear', escriptura(() => { store.files.clear(); })),
        get: (clau) => peticio('get', () => clona(store.files.get(clau))),
        getAll: () => peticio('getAll', () => clona(ordenades())),
        index: (nomIndex) => {
          const { camp } = store.indexs.get(nomIndex);
          return { getAll: (clau) => peticio('index.getAll', () => clona(ordenades().filter((fila) => fila[camp] === clau))) };
        }
      };
    };
    return tx;
  }

  return {
    bases,
    operacions,
    /* Les files desades d'un store, en l'ordre de la clau (per a mirar què hi ha de veres). */
    files(nomBase, nomStore) {
      const store = bases.get(nomBase)?.stores.get(nomStore);
      return store ? [...store.files.entries()].sort(perClau).map(([, v]) => clona(v)) : [];
    },
    /* Reescriu una fila per darrere del cofre (per a manipular-lo). */
    toca(nomBase, nomStore, clau, canvi) {
      const store = bases.get(nomBase).stores.get(nomStore);
      store.files.set(clau, canvi(clona(store.files.get(clau))));
    },
    open(nom, versio) {
      const peticio = {};
      despres(() => {
        let base = bases.get(nom);
        const puja = !base || base.versio < versio;
        if (!base) {
          base = { versio: 0, stores: new Map(), cua: Promise.resolve() };
          bases.set(nom, base);
        }
        peticio.result = {
          objectStoreNames: { contains: (n) => base.stores.has(n) },
          createObjectStore(n, { keyPath }) {
            const store = { keyPath, files: new Map(), indexs: new Map() };
            base.stores.set(n, store);
            return { createIndex: (nomIndex, camp, { unique = false } = {}) => store.indexs.set(nomIndex, { camp, unique }) };
          },
          close() {},
          transaction: (_noms, mode) => creaTransaccio(base, mode)
        };
        if (puja) {
          base.versio = versio;
          peticio.onupgradeneeded?.();
        }
        peticio.onsuccess?.();
      });
      return peticio;
    }
  };
}

/* La finestra i el document, amb els esdeveniments de veres (EventTarget). */
function entornFals({ segur = true } = {}) {
  const finestra = new EventTarget();
  const doc = new EventTarget();
  doc.visibilityState = 'visible';
  finestra.document = doc;
  finestra.isSecureContext = segur;
  return finestra;
}

/* Temporitzadors i rellotge simulats: el temps només avança quan es demana. */
function creaTemporitzadors() {
  let ara = 1000000;
  let seguent = 1;
  const pendents = new Map();
  return {
    rellotge: () => ara,
    setTimeout: (fn, ms) => {
      const id = seguent++;
      pendents.set(id, { fn, quan: ara + Math.max(0, ms) });
      return id;
    },
    clearTimeout: (id) => {
      pendents.delete(id);
    },
    avanca(ms) {
      const fi = ara + ms;
      for (;;) {
        const proper = [...pendents].filter(([, t]) => t.quan <= fi).sort((a, b) => a[1].quan - b[1].quan)[0];
        if (!proper) break;
        pendents.delete(proper[0]);
        ara = proper[1].quan;
        proper[1].fn();
      }
      ara = fi;
    }
  };
}

const oberts = [];
function muntaCofre({ idb = creaIdbFals(), entorn = entornFals(), iteracions = PROVES, ...resta } = {}) {
  const temporitzadors = resta.temporitzadors ?? creaTemporitzadors();
  const cofre = creaCofreLocal({ idb, cripto, entorn, iteracions, temporitzadors, rellotge: temporitzadors.rellotge, ...resta });
  oberts.push(cofre);
  return { cofre, idb, entorn, temporitzadors };
}
afterEach(() => {
  oberts.splice(0).forEach((cofre) => cofre.tanca());
});

/* Tot el que hi ha a les bases del fals, en text. */
const bolcat = (idb) => JSON.stringify([...idb.bases.keys()].map((nom) => [nom, ...['meta', 'registres'].map((store) => idb.files(nom, store))]));

describe('l’entorn', () => {
  test('hi ha WebCrypto a l’entorn de proves', () => {
    expect(typeof globalThis.crypto?.subtle?.deriveKey).toBe('function');
  });

  test('sense context segur o sense WebCrypto, el cofre es nega a obrir-se amb un missatge clar', async () => {
    for (const opcions of [{ entorn: entornFals({ segur: false }) }, { cripto: { getRandomValues: (b) => b } }]) {
      const idb = creaIdbFals();
      const { cofre } = muntaCofre({ idb, ...opcions });
      expect(await cofre.estat()).toBe('insegur');
      await expect(cofre.creaCofre(FRASE)).rejects.toEqual(ambCodi('CONTEXT_INSEGUR'));
      await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('CONTEXT_INSEGUR'));
      await expect(cofre.importa('{}', FRASE)).rejects.toEqual(ambCodi('CONTEXT_INSEGUR'));
      await expect(cofre.creaCofre(FRASE)).rejects.toThrow(/context segur \(https o localhost\)/);
      expect(idb.operacions).toEqual([]);
    }
  });

  test('sense IndexedDB: «sense-magatzem», i no es passa a memòria', async () => {
    const { cofre } = muntaCofre({ idb: null });
    expect(await cofre.estat()).toBe('sense-magatzem');
    await expect(cofre.creaCofre(FRASE)).rejects.toEqual(ambCodi('SENSE_INDEXEDDB'));
  });

  test('les iteracions no baixen mai de 1.000, ni en proves', () => {
    expect(() => creaCofreLocal({ iteracions: 999 })).toThrow(RangeError);
  });
});

describe('crear, obrir i bloquejar', () => {
  test('anada i tornada amb els paràmetres de producció (600.000 iteracions)', async () => {
    const { cofre, idb } = muntaCofre({ iteracions: ITERACIONS_KDF });
    expect(await cofre.estat()).toBe('absent');
    const { codiRecuperacio } = await cofre.creaCofre(FRASE);
    expect(codiRecuperacio).toMatch(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/);
    expect(await cofre.estat()).toBe('obert');
    const [meta] = idb.files(NOM_BD_COFRE, 'meta');
    expect(meta.contrasenya).toMatchObject({ v: 1, kdf: 'PBKDF2-HMAC-SHA-256', iter: 600000 });
    expect(meta.recuperacio).toMatchObject({ v: 1, kdf: 'PBKDF2-HMAC-SHA-256', iter: 600000 });
    const valor = { proveidor: 'Anthropic', import: -2000, mes: '2026-09' };
    await cofre.desa('classificacions', ID_A, valor);
    expect(await cofre.llig('classificacions', ID_A)).toEqual(valor);
    cofre.bloqueja();
    expect(await cofre.estat()).toBe('bloquejat');
    await expect(cofre.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
    await cofre.obreCofre(FRASE);
    expect(await cofre.llig('classificacions', ID_A)).toEqual(valor);
  }, 30000);

  test('desa, reescriu, llista i esborra; un registre que no hi és, null', async () => {
    const { cofre } = muntaCofre();
    await cofre.creaCofre(FRASE);
    expect(await cofre.llig('classificacions', ID_A)).toBeNull();
    await cofre.desa('classificacions', ID_A, { n: 1 });
    await cofre.desa('classificacions', ID_B, { n: 2 });
    await cofre.desa('simulacions', ID_A, { escenari: 'base' });
    await cofre.desa('classificacions', ID_A, { n: 3 });
    expect(await cofre.llista('classificacions')).toEqual([{ id: ID_B, valor: { n: 2 } }, { id: ID_A, valor: { n: 3 } }]);
    expect(await cofre.esborra('classificacions', ID_B)).toBe(true);
    expect(await cofre.esborra('classificacions', ID_B)).toBe(false);
    expect(await cofre.llista('classificacions')).toEqual([{ id: ID_A, valor: { n: 3 } }]);
    expect(await cofre.llista('simulacions')).toEqual([{ id: ID_A, valor: { escenari: 'base' } }]);
    await expect(cofre.desa('classificacions', 'compte-1', 1)).rejects.toEqual(ambCodi('ID_INVALID'));
    await expect(cofre.desa('Factures', ID_A, 1)).rejects.toEqual(ambCodi('COLLECCIO_INVALIDA'));
  });

  test('nouId: el cofre dona ids opacs (UUID v4) per als registres, i no es repetixen', async () => {
    const { cofre } = muntaCofre();
    await cofre.creaCofre(FRASE);
    const ids = new Set(Array.from({ length: 100 }, () => cofre.nouId()));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(esIdOpac(id), id).toBe(true);
    const [id] = ids;
    await cofre.desa('simulacions', id, { escenari: 'base' });
    expect(await cofre.llista('simulacions')).toEqual([{ id, valor: { escenari: 'base' } }]);
  });

  test('frase errònia: error controlat, cap sessió i res desxifrat', async () => {
    const { cofre } = muntaCofre();
    await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { secret: SENTINELLA });
    cofre.bloqueja();
    await expect(cofre.obreCofre('olivera vella del mas de baix')).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    await expect(cofre.obreCofre('')).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    expect(cofre.obert).toBe(false);
    expect(await cofre.estat()).toBe('bloquejat');
    await expect(cofre.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
  });

  test('una frase feble no crea res; un segon cofre tampoc; obrir sense cofre, COFRE_INEXISTENT', async () => {
    const { cofre, idb } = muntaCofre();
    await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('COFRE_INEXISTENT'));
    await expect(cofre.creaCofre('curta')).rejects.toEqual(ambCodi('CONTRASENYA_FEBLE'));
    expect(idb.files(NOM_BD_COFRE, 'meta')).toEqual([]);
    await cofre.creaCofre(FRASE);
    await expect(cofre.creaCofre(NOVA)).rejects.toEqual(ambCodi('COFRE_EXISTENT'));
    // Dues pestanyes que creen alhora: només una guanya.
    const idb2 = creaIdbFals();
    const a = muntaCofre({ idb: idb2 }).cofre;
    const b = muntaCofre({ idb: idb2 }).cofre;
    const resultats = await Promise.allSettled([a.creaCofre(FRASE), b.creaCofre(NOVA)]);
    expect(resultats.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(resultats.find((r) => r.status === 'rejected').reason.codi).toBe('COFRE_EXISTENT');
    expect(idb2.files(NOM_BD_COFRE, 'meta')).toHaveLength(1);
  });

  test('els subscriptors saben quan s’obri i quan es bloqueja; una operació començada ja no torna res', async () => {
    const { cofre } = muntaCofre();
    const avisos = [];
    const deixa = cofre.subscriu((canvi) => avisos.push(canvi));
    await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { n: 1 });
    const enCurs = cofre.llig('classificacions', ID_A);
    cofre.bloqueja();
    await expect(enCurs).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
    expect(avisos).toEqual([{ estat: 'obert', motiu: 'obert' }, { estat: 'bloquejat', motiu: 'manual' }]);
    deixa();
    await cofre.obreCofre(FRASE);
    expect(avisos).toHaveLength(2);
  });
});

describe('integritat a l’IndexedDB', () => {
  test('res en clar: ni el contingut, ni la frase, ni el codi; i només els camps previstos', async () => {
    const { cofre, idb } = muntaCofre();
    const { codiRecuperacio } = await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { proveidor: SENTINELLA, nota: 'Compte de la Caixa Rural' });
    await cofre.desa('historic', ID_UNIC, Array.from({ length: 50 }, (_, i) => ({ mes: i, concepte: SENTINELLA })));
    const text = bolcat(idb);
    for (const secret of [SENTINELLA, 'Caixa Rural', FRASE, codiRecuperacio, codiRecuperacio.replace(/-/g, ''), aBase64(new TextEncoder().encode(SENTINELLA))]) {
      expect(text.includes(secret), secret).toBe(false);
    }
    const [meta] = idb.files(NOM_BD_COFRE, 'meta');
    expect(Object.keys(meta).sort()).toEqual(['clau', 'contrasenya', 'format', 'recuperacio', 'v']);
    for (const parametres of [meta.contrasenya, meta.recuperacio]) expect(Object.keys(parametres).sort()).toEqual(['dek', 'iter', 'kdf', 'sal', 'v']);
    const registres = idb.files(NOM_BD_COFRE, 'registres');
    expect(registres).toHaveLength(2);
    for (const fila of registres) {
      expect(Object.keys(fila).sort()).toEqual(['clau', 'colleccio', 'id', 'iv', 'xifrat']);
      expect((deBase64(fila.xifrat).length - 16) % BLOC_FARCIT).toBe(0);
      expect(deBase64(fila.iv)).toHaveLength(12);
    }
    // Les dues sals i els dos embolcalls són diferents.
    expect(meta.contrasenya.sal).not.toBe(meta.recuperacio.sal);
    expect(meta.contrasenya.dek).not.toBe(meta.recuperacio.dek);
    // Cap operació d'escriptura fora de les previstes.
    expect([...new Set(idb.operacions)].sort()).toEqual(['add', 'get', 'put']);
  });

  test('un xifrat, un IV o un registre canviat de lloc a l’IndexedDB: REGISTRE_MANIPULAT i la col·lecció no es llista a mitges', async () => {
    const { cofre, idb } = muntaCofre();
    await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { n: 1 });
    await cofre.desa('classificacions', ID_B, { n: 2 });
    const gira = (b64) => {
      const bytes = deBase64(b64);
      bytes[5] ^= 1;
      return aBase64(bytes);
    };
    idb.toca(NOM_BD_COFRE, 'registres', `classificacions|${ID_A}`, (fila) => ({ ...fila, xifrat: gira(fila.xifrat) }));
    await expect(cofre.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));
    await expect(cofre.llista('classificacions')).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));
    await cofre.desa('classificacions', ID_A, { n: 1 });
    idb.toca(NOM_BD_COFRE, 'registres', `classificacions|${ID_A}`, (fila) => ({ ...fila, iv: gira(fila.iv) }));
    await expect(cofre.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));
    // El xifrat de B posat al lloc d'A: l'AAD no quadra.
    const filaB = idb.files(NOM_BD_COFRE, 'registres').find((fila) => fila.id === ID_B);
    idb.toca(NOM_BD_COFRE, 'registres', `classificacions|${ID_A}`, (fila) => ({ ...fila, iv: filaB.iv, xifrat: filaB.xifrat }));
    await expect(cofre.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));
    expect(await cofre.llig('classificacions', ID_B)).toEqual({ n: 2 });
  });

  test('paràmetres manipulats: per davall del mínim, PARAMETRES_DESCONEGUTS; uns altres de vàlids, la frase ja no obri', async () => {
    const { cofre, idb } = muntaCofre();
    await cofre.creaCofre(FRASE);
    cofre.bloqueja();
    const [original] = idb.files(NOM_BD_COFRE, 'meta');
    idb.toca(NOM_BD_COFRE, 'meta', 'cofre', (meta) => ({ ...meta, contrasenya: { ...meta.contrasenya, iter: 1 } }));
    await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('PARAMETRES_DESCONEGUTS'));
    idb.toca(NOM_BD_COFRE, 'meta', 'cofre', (meta) => ({ ...meta, contrasenya: { ...original.contrasenya, iter: PROVES + 1 } }));
    await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    idb.toca(NOM_BD_COFRE, 'meta', 'cofre', (meta) => ({ ...meta, v: 2 }));
    await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('PARAMETRES_DESCONEGUTS'));
  });
});

describe('frase de pas i codi de recuperació', () => {
  test('canviar la frase conserva les dades i el codi; la vella ja no obri', async () => {
    const { cofre, idb } = muntaCofre();
    const { codiRecuperacio } = await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { n: 1 });
    await cofre.desa('simulacions', ID_B, { n: 2 });
    const abans = idb.files(NOM_BD_COFRE, 'registres');
    await expect(cofre.canviaContrasenya('una frase que no és', NOVA)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    await expect(cofre.canviaContrasenya(FRASE, 'curta')).rejects.toEqual(ambCodi('CONTRASENYA_FEBLE'));
    await cofre.canviaContrasenya(FRASE, NOVA);
    // Les dades no es tornen a xifrar: només canvia l'embolcall de la DEK.
    expect(idb.files(NOM_BD_COFRE, 'registres')).toEqual(abans);
    cofre.bloqueja();
    await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    await cofre.obreCofre(NOVA);
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ n: 1 });
    expect(await cofre.llig('simulacions', ID_B)).toEqual({ n: 2 });
    cofre.bloqueja();
    await expect(cofre.canviaContrasenya(NOVA, FRASE)).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
    // El codi de recuperació continua valent.
    await cofre.obreAmbCodi(codiRecuperacio, FRASE);
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ n: 1 });
  });

  test('recuperar amb el codi: posa una frase nova, conserva les dades i retira el codi usat', async () => {
    const { cofre } = muntaCofre();
    const { codiRecuperacio: primer } = await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { proveidor: 'OpenAI' });
    cofre.bloqueja();
    await expect(cofre.obreAmbCodi('ABCD-EFGH', NOVA)).rejects.toEqual(ambCodi('CODI_INVALID'));
    await expect(cofre.obreAmbCodi('AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AA', NOVA)).rejects.toEqual(ambCodi('CODI_ERRONI'));
    await expect(cofre.obreAmbCodi(primer, 'curta')).rejects.toEqual(ambCodi('CONTRASENYA_FEBLE'));
    expect(cofre.obert).toBe(false);
    const { codiRecuperacio: segon } = await cofre.obreAmbCodi(primer.toLowerCase(), NOVA);
    expect(segon).not.toBe(primer);
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ proveidor: 'OpenAI' });
    cofre.bloqueja();
    await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    await expect(cofre.obreAmbCodi(primer, FRASE)).rejects.toEqual(ambCodi('CODI_ERRONI'));
    await cofre.obreCofre(NOVA);
    cofre.bloqueja();
    await cofre.obreAmbCodi(segon, FRASE);
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ proveidor: 'OpenAI' });
  });

  test('un codi nou (amb la frase vigent) retira l’anterior', async () => {
    const { cofre } = muntaCofre();
    const { codiRecuperacio: vell } = await cofre.creaCofre(FRASE);
    await expect(cofre.renovaCodi(NOVA)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    const { codiRecuperacio: nou } = await cofre.renovaCodi(FRASE);
    cofre.bloqueja();
    await expect(cofre.obreAmbCodi(vell, NOVA)).rejects.toEqual(ambCodi('CODI_ERRONI'));
    await cofre.obreAmbCodi(nou, NOVA);
    expect(cofre.obert).toBe(true);
  });

  test('una altra pestanya canvia la frase entremig: COFRE_CANVIAT i res sobreescrit', async () => {
    const idb = creaIdbFals();
    const a = muntaCofre({ idb }).cofre;
    await a.creaCofre(FRASE);
    const b = muntaCofre({ idb }).cofre;
    await b.obreCofre(FRASE);
    const [abans] = idb.files(NOM_BD_COFRE, 'meta');
    const resultats = await Promise.allSettled([a.canviaContrasenya(FRASE, NOVA), b.canviaContrasenya(FRASE, 'una tercera frase prou llarga')]);
    expect(resultats.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(resultats.find((r) => r.status === 'rejected').reason.codi).toMatch(/^(?:COFRE_CANVIAT|CONTRASENYA_ERRONIA)$/);
    expect(idb.files(NOM_BD_COFRE, 'meta')[0].contrasenya.dek).not.toBe(abans.contrasenya.dek);
  });
});

describe('rotació de la clau de les dades', () => {
  /* La còpia d'un cofre restaurada en un altre navegador (el de qui l'ha robada), amb files posades a mà. */
  async function atacantAmb(copiaVella, frase, filesRobades) {
    const atacant = muntaCofre();
    await atacant.cofre.importa(copiaVella, frase);
    atacant.cofre.bloqueja();
    for (const fila of filesRobades) atacant.idb.toca(NOM_BD_COFRE, 'registres', fila.clau, () => fila);
    return atacant;
  }

  test('un codi nou i un canvi de frase amb rotació: la còpia vella amb la frase o el codi retirats no obri res d’ara', async () => {
    const { cofre, idb } = muntaCofre();
    const { codiRecuperacio: codi1 } = await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { abans: 'de la còpia' });
    const copiaVella = await cofre.exporta();
    const filaVella = idb.files(NOM_BD_COFRE, 'registres')[0];
    const { codiRecuperacio: codi2, illegibles } = await cofre.renovaCodi(FRASE);
    expect(illegibles).toBe(0);
    // La clau ha canviat: el mateix registre té un xifrat i un IV nous, i la meta, una DEK embolcallada nova.
    expect(idb.files(NOM_BD_COFRE, 'registres')[0].iv).not.toBe(filaVella.iv);
    const rotada = await cofre.canviaContrasenya(FRASE, NOVA, { rotaClau: true });
    expect(rotada).toMatchObject({ rotada: true, illegibles: 0 });
    expect(rotada.codiRecuperacio).not.toBe(codi2);
    await cofre.desa('classificacions', ID_B, { s: SENTINELLA });
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ abans: 'de la còpia' });
    const filesDara = idb.files(NOM_BD_COFRE, 'registres');
    expect(bolcat(idb).includes(SENTINELLA)).toBe(false);

    // Qui té la còpia vella i la frase vella, i roba les files d'ara: res.
    const ambFrase = await atacantAmb(copiaVella, FRASE, filesDara);
    await ambFrase.cofre.obreCofre(FRASE);
    await expect(ambFrase.cofre.llig('classificacions', ID_B)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));
    await expect(ambFrase.cofre.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));

    // Qui té la còpia vella i el primer codi retirat: obri la meta vella, però cap fila d'ara (les compta com a il·legibles).
    const ambCodi1 = await atacantAmb(copiaVella, FRASE, filesDara);
    const recuperat = await ambCodi1.cofre.obreAmbCodi(codi1, 'una frase de lladre prou llarga');
    expect(recuperat.illegibles).toBe(2);
    await expect(ambCodi1.cofre.llig('classificacions', ID_B)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));

    // El cofre de veres: la frase nova i l'últim codi l'obrin; la frase i els codis vells, no.
    cofre.bloqueja();
    await expect(cofre.obreCofre(FRASE)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    for (const vell of [codi1, codi2]) await expect(cofre.obreAmbCodi(vell, FRASE)).rejects.toEqual(ambCodi('CODI_ERRONI'));
    await cofre.obreCofre(NOVA);
    expect(await cofre.llig('classificacions', ID_B)).toEqual({ s: SENTINELLA });
    cofre.bloqueja();
    await cofre.obreAmbCodi(rotada.codiRecuperacio, FRASE);
    expect(await cofre.llista('classificacions')).toEqual([{ id: ID_B, valor: { s: SENTINELLA } }, { id: ID_A, valor: { abans: 'de la còpia' } }]);
  });

  test('recuperar amb el codi també rota: la frase oblidada i el codi usat no obrin les dades d’ara', async () => {
    const { cofre, idb } = muntaCofre();
    const { codiRecuperacio: codi1 } = await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { n: 1 });
    const copiaVella = await cofre.exporta();
    cofre.bloqueja();
    await cofre.obreAmbCodi(codi1, NOVA);
    const filesDara = idb.files(NOM_BD_COFRE, 'registres');
    const atacant = await atacantAmb(copiaVella, FRASE, filesDara);
    await atacant.cofre.obreCofre(FRASE);
    await expect(atacant.cofre.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ n: 1 });
  });

  test('un registre que ja no es podia llegir es deixa com estava i es compta; la resta es torna a xifrar', async () => {
    const { cofre, idb } = muntaCofre();
    await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { n: 1 });
    await cofre.desa('classificacions', ID_B, { n: 2 });
    const clauB = clauRegistre('classificacions', ID_B);
    idb.toca(NOM_BD_COFRE, 'registres', clauB, (fila) => ({ ...fila, xifrat: aBase64(deBase64(fila.xifrat).map((b, i) => (i === 3 ? b ^ 1 : b))) }));
    const malmesa = idb.files(NOM_BD_COFRE, 'registres').find((fila) => fila.clau === clauB);
    expect((await cofre.renovaCodi(FRASE)).illegibles).toBe(1);
    expect(idb.files(NOM_BD_COFRE, 'registres').find((fila) => fila.clau === clauB)).toEqual(malmesa);
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ n: 1 });
    await expect(cofre.llig('classificacions', ID_B)).rejects.toEqual(ambCodi('REGISTRE_MANIPULAT'));
    expect(cofre.obert).toBe(true);
  });

  test('canviar la frase sense rotar: el codi continua valent i la còpia vella s’obri amb la frase vella (com diu la porta)', async () => {
    const { cofre } = muntaCofre();
    const { codiRecuperacio } = await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { n: 1 });
    const copiaVella = await cofre.exporta();
    expect(await cofre.canviaContrasenya(FRASE, NOVA)).toEqual({ rotada: false, codiRecuperacio: null, illegibles: 0 });
    const nou = muntaCofre();
    expect(await nou.cofre.importa(copiaVella, FRASE)).toMatchObject({ restaurat: true });
    cofre.bloqueja();
    await cofre.obreAmbCodi(codiRecuperacio, FRASE);
    expect(cofre.obert).toBe(true);
  });
});

describe('diverses pestanyes', () => {
  test('una altra pestanya rota la clau: la sessió vella no escriu res amb la clau caducada, es bloqueja i ho diu', async () => {
    const idb = creaIdbFals();
    const a = muntaCofre({ idb }).cofre;
    await a.creaCofre(FRASE);
    await a.desa('classificacions', ID_A, { n: 1 });
    const b = muntaCofre({ idb }).cofre;
    await b.obreCofre(FRASE);
    const avisos = [];
    b.subscriu((canvi) => avisos.push(canvi));
    await a.renovaCodi(FRASE);
    const abans = idb.files(NOM_BD_COFRE, 'registres');
    await expect(b.desa('classificacions', ID_B, { n: 2 })).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    expect(b.obert).toBe(false);
    expect(avisos).toEqual([{ estat: 'bloquejat', motiu: 'canviat' }]);
    expect(idb.files(NOM_BD_COFRE, 'registres')).toEqual(abans);
    // Tornada a obrir, escriu amb la clau nova; i una lectura després d'una altra rotació també ho detecta.
    await b.obreCofre(FRASE);
    await b.desa('classificacions', ID_B, { n: 2 });
    expect(await a.llig('classificacions', ID_B)).toEqual({ n: 2 });
    await a.renovaCodi(FRASE);
    await expect(b.llig('classificacions', ID_A)).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    expect(b.obert).toBe(false);
  });

  test('un canvi de frase en una altra pestanya també caduca la sessió (paranoia: tornar a obrir)', async () => {
    const idb = creaIdbFals();
    const a = muntaCofre({ idb }).cofre;
    await a.creaCofre(FRASE);
    const b = muntaCofre({ idb }).cofre;
    await b.obreCofre(FRASE);
    await a.canviaContrasenya(FRASE, NOVA);
    await expect(b.desa('classificacions', ID_A, { n: 1 })).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    await expect(b.obreCofre(FRASE)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    await b.obreCofre(NOVA);
    await b.desa('classificacions', ID_A, { n: 1 });
    expect(await a.llig('classificacions', ID_A)).toEqual({ n: 1 });
  });
});

describe('el magatzem: escriptures atòmiques', () => {
  test('desar, afegir i rotar comparen la meta dins de la transacció; la rotació, també els registres', async () => {
    const { cofre, idb } = muntaCofre();
    await cofre.creaCofre(FRASE);
    await cofre.desa('classificacions', ID_A, { n: 1 });
    const m = creaMagatzemCofre({ idb });
    const meta = await m.llegixMeta();
    const llegits = await m.totsElsRegistres();
    const fila = { colleccio: 'classificacions', id: ID_B, iv: llegits[0].iv, xifrat: llegits[0].xifrat };
    const altra = { ...meta, contrasenya: { ...meta.contrasenya, sal: aBase64(new Uint8Array(16)) } };
    await expect(m.desaRegistre(fila, altra)).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    await expect(m.desaRegistre(fila, null)).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    await expect(m.afegixSiFalten([fila], altra)).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    await expect(m.rota(altra, altra, llegits, [])).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    // Un registre escrit després de llegir-los: la rotació no buida res.
    await cofre.desa('classificacions', ID_A, { n: 2 });
    await expect(m.rota(altra, meta, llegits, [])).rejects.toEqual(ambCodi('COFRE_CANVIAT'));
    expect(idb.files(NOM_BD_COFRE, 'meta')[0].contrasenya).toEqual(meta.contrasenya);
    expect(idb.files(NOM_BD_COFRE, 'registres')).toHaveLength(1);
    expect(await cofre.llig('classificacions', ID_A)).toEqual({ n: 2 });
    m.tanca();
  });
});

describe('autobloqueig (rellotge simulat)', () => {
  test('10 minuts sense activitat: es bloqueja i ho diu; l’activitat ho ajorna', async () => {
    const { cofre, entorn, temporitzadors } = muntaCofre();
    const avisos = [];
    cofre.subscriu((canvi) => avisos.push(canvi));
    await cofre.creaCofre(FRASE);
    temporitzadors.avanca(9 * 60 * 1000);
    entorn.dispatchEvent(new Event('keydown'));
    temporitzadors.avanca(9 * 60 * 1000);
    expect(cofre.obert).toBe(true);
    temporitzadors.avanca(60 * 1000);
    expect(cofre.obert).toBe(false);
    expect(avisos.at(-1)).toEqual({ estat: 'bloquejat', motiu: 'inactivitat' });
  });

  test('pagehide el bloqueja de colp; la pestanya amagada més de 5 minuts, també', async () => {
    const { cofre, entorn, temporitzadors } = muntaCofre();
    await cofre.creaCofre(FRASE);
    entorn.dispatchEvent(new Event('pagehide'));
    expect(cofre.obert).toBe(false);
    await cofre.obreCofre(FRASE);
    entorn.document.visibilityState = 'hidden';
    entorn.document.dispatchEvent(new Event('visibilitychange'));
    temporitzadors.avanca(4 * 60 * 1000);
    expect(cofre.obert).toBe(true);
    temporitzadors.avanca(60 * 1000);
    expect(cofre.obert).toBe(false);
  });
});

describe('còpia de seguretat', () => {
  async function cofreAmbDades() {
    const muntat = muntaCofre();
    await muntat.cofre.creaCofre(FRASE);
    await muntat.cofre.desa('classificacions', ID_A, { proveidor: SENTINELLA });
    await muntat.cofre.desa('simulacions', ID_B, { escenari: 'base' });
    return muntat;
  }

  test('la còpia xifrada no porta res en clar i restaura un cofre sencer en un navegador nou', async () => {
    const { cofre } = await cofreAmbDades();
    const text = await cofre.exporta();
    expect(text.includes(SENTINELLA)).toBe(false);
    expect(text.includes(FRASE)).toBe(false);
    const copia = JSON.parse(text);
    expect(copia).toMatchObject({ format: FORMAT_COPIA, v: 1 });
    expect(copia.registres).toHaveLength(2);
    cofre.bloqueja();
    await expect(cofre.exporta()).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));

    const nou = muntaCofre();
    expect(await nou.cofre.estat()).toBe('absent');
    await expect(nou.cofre.importa(text, NOVA)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    await expect(nou.cofre.importa('no és JSON', FRASE)).rejects.toEqual(ambCodi('COPIA_INVALIDA'));
    await expect(nou.cofre.importa(JSON.stringify({ ...copia, format: 'un altre' }), FRASE)).rejects.toEqual(ambCodi('COPIA_INVALIDA'));
    expect(await nou.cofre.estat()).toBe('absent');
    expect(await nou.cofre.importa(text, FRASE)).toEqual({ restaurat: true, afegits: 2, conservats: 0 });
    expect(nou.cofre.obert).toBe(true);
    expect(await nou.cofre.llig('classificacions', ID_A)).toEqual({ proveidor: SENTINELLA });
    nou.cofre.bloqueja();
    await nou.cofre.obreCofre(FRASE);
  });

  test('una còpia manipulada no importa res', async () => {
    const { cofre } = await cofreAmbDades();
    const copia = JSON.parse(await cofre.exporta());
    const bytes = deBase64(copia.registres[1].xifrat);
    bytes[9] ^= 1;
    copia.registres[1].xifrat = aBase64(bytes);
    const nou = muntaCofre();
    await expect(nou.cofre.importa(JSON.stringify(copia), FRASE)).rejects.toEqual(ambCodi('COPIA_MANIPULADA'));
    expect(await nou.cofre.estat()).toBe('absent');
    expect(nou.idb.files(NOM_BD_COFRE, 'registres')).toEqual([]);
  });

  test('en un cofre obert, la còpia d’un altre s’hi afig tornada a xifrar i mai reescriu el que hi ha', async () => {
    const { cofre: origen } = await cofreAmbDades();
    const text = await origen.exporta();
    const desti = muntaCofre();
    await desti.cofre.creaCofre(NOVA);
    await desti.cofre.desa('simulacions', ID_B, { escenari: 'propi' });
    expect(await desti.cofre.importa(text, FRASE)).toEqual({ restaurat: false, afegits: 1, conservats: 1 });
    expect(await desti.cofre.llig('classificacions', ID_A)).toEqual({ proveidor: SENTINELLA });
    expect(await desti.cofre.llig('simulacions', ID_B)).toEqual({ escenari: 'propi' });
    expect(await desti.cofre.importa(text, FRASE)).toEqual({ restaurat: false, afegits: 0, conservats: 2 });
    // Tornat a xifrar amb la clau del destí: obri amb la frase del destí.
    desti.cofre.bloqueja();
    await expect(desti.cofre.importa(text, FRASE)).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
    await desti.cofre.obreCofre(NOVA);
    expect(await desti.cofre.llista('classificacions')).toEqual([{ id: ID_A, valor: { proveidor: SENTINELLA } }]);
  });

  test('l’exportació en clar només amb confirmació explícita i la frase vigent', async () => {
    const { cofre } = await cofreAmbDades();
    await expect(cofre.exportaEnClar(FRASE, 'sí')).rejects.toEqual(ambCodi('CONFIRMACIO_NECESSARIA'));
    await expect(cofre.exportaEnClar(FRASE)).rejects.toEqual(ambCodi('CONFIRMACIO_NECESSARIA'));
    await expect(cofre.exportaEnClar(NOVA, CONFIRMACIO_EN_CLAR)).rejects.toEqual(ambCodi('CONTRASENYA_ERRONIA'));
    const clar = JSON.parse(await cofre.exportaEnClar(FRASE, CONFIRMACIO_EN_CLAR));
    expect(clar.avis).toMatch(/NO està xifrat/);
    expect(clar.registres).toEqual([
      { colleccio: 'classificacions', id: ID_A, valor: { proveidor: SENTINELLA } },
      { colleccio: 'simulacions', id: ID_B, valor: { escenari: 'base' } }
    ]);
    cofre.bloqueja();
    await expect(cofre.exportaEnClar(FRASE, CONFIRMACIO_EN_CLAR)).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
  });
});

describe('persistenciaDelCofre (per al front de l’Històric)', () => {
  test('desa i llig un sol valor per col·lecció; bloquejat, COFRE_BLOQUEJAT; i avisa del bloqueig', async () => {
    const { cofre } = muntaCofre();
    await cofre.creaCofre(FRASE);
    const historic = persistenciaDelCofre(cofre, 'historic');
    expect(Object.isFrozen(historic)).toBe(true);
    expect(await historic.llig()).toBeNull();
    const reduit = { mesos: [{ mes: '2026-09', ia: -12345 }] };
    await historic.desa(reduit);
    expect(await historic.llig()).toEqual(reduit);
    expect(await cofre.llista('historic')).toEqual([{ id: ID_UNIC, valor: reduit }]);
    const avisos = [];
    historic.subscriu((canvi) => avisos.push(canvi.estat));
    cofre.bloqueja();
    expect(avisos).toEqual(['bloquejat']);
    await expect(historic.llig()).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
    await expect(historic.desa(reduit)).rejects.toEqual(ambCodi('COFRE_BLOQUEJAT'));
    await cofre.obreCofre(FRASE);
    expect(await historic.esborra()).toBe(true);
    expect(await historic.llig()).toBeNull();
    expect(() => persistenciaDelCofre(cofre, 'Històric')).toThrow(expect.objectContaining({ codi: 'COLLECCIO_INVALIDA' }));
  });
});

/* Integració de l'Onada 6 (261009): l'Històric fa servir l'únic cofre de l'app. */
describe('cofreDeLaGestoria', () => {
  test('una sola instància per pàgina: totes les crides tornen el mateix cofre, congelat i sense obrir res encara', async () => {
    const primer = cofreDeLaGestoria();
    expect(cofreDeLaGestoria()).toBe(primer);
    expect(Object.isFrozen(primer)).toBe(true);
    expect(primer.obert).toBe(false);
    /* Amb els valors de producció: en Node, sense context segur o sense IndexedDB, no s'obri, com qualsevol altre cofre. */
    expect(['insegur', 'sense-magatzem']).toContain(await primer.estat());
  });
});
