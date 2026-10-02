// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { creaMagatzemProgres, magatzemProgres } from './magatzemProgres.js';

/* IndexedDB mínim per a les proves: peticions en microtasques i la transacció
   es completa en la macrotasca següent, quan ja no queden peticions vives. */
function creaIdbFals() {
  const bases = new Map();
  const clona = valor => JSON.parse(JSON.stringify(valor));
  const registre = { obertes: 0, connexions: [], obrides: [] };

  function transaccio(store, mode) {
    const tx = {};
    const peticio = executa => {
      const p = {};
      queueMicrotask(() => { p.result = executa(); p.onsuccess?.(); });
      return p;
    };
    tx.objectStore = () => ({
      getAll: () => peticio(() => [...store.files.values()].map(clona)),
      put(valor) {
        if (mode !== 'readwrite') throw new Error('ReadOnlyError');
        store.files.set(valor[store.keyPath], clona(valor));
      },
      openCursor() {
        const claus = [...store.files.keys()];
        let i = 0;
        const p = {};
        const emet = () => queueMicrotask(() => {
          if (i >= claus.length) { p.result = null; p.onsuccess?.(); return; }
          const clau = claus[i];
          p.result = {
            key: clau, value: clona(store.files.get(clau)),
            delete: () => store.files.delete(clau),
            continue: () => { i++; emet(); }
          };
          p.onsuccess?.();
        });
        emet();
        return p;
      }
    });
    setTimeout(() => tx.oncomplete?.(), 0);
    return tx;
  }

  const idb = {
    open(nom, versio) {
      registre.obrides.push([nom, versio]);
      const peticio = {};
      setTimeout(() => {
        let base = bases.get(nom);
        const nova = !base;
        if (nova) { base = new Map(); bases.set(nom, base); }
        const db = {
          objectStoreNames: { contains: n => base.has(n) },
          createObjectStore: (n, { keyPath }) => base.set(n, { keyPath, files: new Map() }),
          transaction: (n, mode) => transaccio(base.get(n), mode),
          close: () => { registre.obertes--; db.tancada = true; }
        };
        registre.obertes++;
        registre.connexions.push(db);
        peticio.result = db;
        if (nova) peticio.onupgradeneeded?.();
        peticio.onsuccess?.();
      }, 0);
      return peticio;
    }
  };
  return { idb, registre, files: () => [...bases.get('sdp-aprendre').get('estats').files.values()] };
}

const estat = (cardId, extra = {}) => ({
  barallaId: 'gestoria-autonoms', cardId, contentVersion: '1.0.0', caixa: 1, dueAt: 1000,
  lastReviewedAt: 500, repetitions: 1, lapses: 0, ...extra
});

describe('amb IndexedDB', () => {
  test('desa i carrega des d’una altra instància; base «sdp-aprendre» v1 i connexions tancades', async () => {
    const fals = creaIdbFals();
    const primer = creaMagatzemProgres({ idb: fals.idb });
    expect(primer.persistent).toBe(true);
    await primer.desa(estat('a'));
    await primer.desa(estat('b', { caixa: 3 }));
    await primer.desa(estat('a', { caixa: 2 }));
    const segon = creaMagatzemProgres({ idb: fals.idb });
    const carregats = await segon.carrega('gestoria-autonoms');
    expect(carregats.map(e => [e.cardId, e.caixa])).toEqual([['a', 2], ['b', 3]]);
    expect(fals.registre.obrides.every(([nom, versio]) => nom === 'sdp-aprendre' && versio === 1)).toBe(true);
    expect(fals.registre.obertes).toBe(0);
  });

  test('només desa els camps del motor i rebutja estats sense baralla o targeta', async () => {
    const fals = creaIdbFals();
    const magatzem = creaMagatzemProgres({ idb: fals.idb });
    await magatzem.desa(estat('a', { nota: 'text lliure', dueAt: Number.NaN }));
    expect(fals.files()).toEqual([{
      barallaId: 'gestoria-autonoms', cardId: 'a', contentVersion: '1.0.0', caixa: 1, dueAt: null,
      lastReviewedAt: 500, repetitions: 1, lapses: 0
    }]);
    await expect(magatzem.desa({ cardId: 'a', contentVersion: '1' })).rejects.toThrow(TypeError);
    await expect(magatzem.desa(estat(''))).rejects.toThrow(TypeError);
    await expect(magatzem.carrega('')).rejects.toThrow(TypeError);
  });

  test('esborra només la baralla demanada', async () => {
    const fals = creaIdbFals();
    const magatzem = creaMagatzemProgres({ idb: fals.idb });
    await magatzem.desa(estat('a'));
    await magatzem.desa(estat('b'));
    await magatzem.desa(estat('altra-x', { barallaId: 'altra' }));
    await magatzem.esborra('gestoria-autonoms');
    expect(await magatzem.carrega('gestoria-autonoms')).toEqual([]);
    expect((await magatzem.carrega('altra')).map(e => e.cardId)).toEqual(['altra-x']);
    expect(fals.files()).toHaveLength(1);
  });

  test('una altra pestanya que puja la versió tanca la connexió', async () => {
    const fals = creaIdbFals();
    const magatzem = creaMagatzemProgres({ idb: fals.idb });
    await magatzem.carrega('gestoria-autonoms');
    const [connexio] = fals.registre.connexions;
    expect(connexio.tancada).toBe(true);
    connexio.tancada = false;
    connexio.onversionchange();
    expect(connexio.tancada).toBe(true);
  });

  test('les còpies retornades no comparteixen referència amb el magatzem', async () => {
    const magatzem = creaMagatzemProgres({ idb: creaIdbFals().idb });
    const desat = await magatzem.desa(estat('a'));
    desat.caixa = 99;
    const [carregat] = await magatzem.carrega('gestoria-autonoms');
    carregat.caixa = 77;
    expect((await magatzem.carrega('gestoria-autonoms'))[0].caixa).toBe(1);
  });
});

describe('sense IndexedDB', () => {
  test('en memòria: funciona i declara persistent=false', async () => {
    const magatzem = creaMagatzemProgres({ idb: null });
    expect(magatzem.persistent).toBe(false);
    await magatzem.desa(estat('a'));
    await magatzem.desa(estat('z', { barallaId: 'altra' }));
    expect((await magatzem.carrega('gestoria-autonoms')).map(e => e.cardId)).toEqual(['a']);
    await magatzem.esborra('gestoria-autonoms');
    expect(await magatzem.carrega('gestoria-autonoms')).toEqual([]);
    expect(await magatzem.carrega('altra')).toHaveLength(1);
  });

  test('si el navegador no el deixa obrir, passa a memòria sense perdre el que s’ha desat', async () => {
    const idb = { open() { throw new Error('SecurityError'); } };
    const magatzem = creaMagatzemProgres({ idb });
    expect(magatzem.persistent).toBe(true);
    await magatzem.desa(estat('a'));
    expect(magatzem.persistent).toBe(false);
    expect((await magatzem.carrega('gestoria-autonoms')).map(e => e.cardId)).toEqual(['a']);
  });

  test('el magatzem compartit es crea una sola vegada', () => {
    expect(magatzemProgres()).toBe(magatzemProgres());
  });
});
