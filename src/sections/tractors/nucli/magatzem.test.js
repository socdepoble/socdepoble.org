// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { crearMagatzem, crearMagatzemIndexedDB, crearMagatzemMemoria, validaClau } from './magatzem.js';

const EMPREMTA = `sha256:${'c'.repeat(64)}`;

let comptador = 0;
function registre(canvis = {}) {
  comptador += 1;
  return {
    schema: 'sdp.aprovacio.v1',
    tractor: 'sdp.gestoria-lector',
    versio: '1.0.0',
    empremta: EMPREMTA,
    decisio: 'aprovat',
    nivell: 'confirmacio',
    data: '2026-10-01T10:00:00.000Z',
    caduca: null,
    nonce: Buffer.from(new Uint8Array(16).fill(comptador & 0xff)).toString('base64url'),
    ...canvis
  };
}

function clau(canvis = {}) {
  comptador += 1;
  return {
    credencial: Buffer.from(new Uint8Array(16).fill(comptador & 0xff)).toString('base64url'),
    jwk: { kty: 'EC', crv: 'P-256', x: Buffer.alloc(32, 1).toString('base64url'), y: Buffer.alloc(32, 2).toString('base64url') },
    creat: '2026-10-01T09:00:00.000Z',
    etiqueta: 'Portàtil del taller',
    ...canvis
  };
}

/* Fals mínim d'IndexedDB: open/upgrade, transaccions amb add/getAll/clear,
   ConstraintError en duplicats i oncomplete quan acaben les peticions. */
function crearIdbFals() {
  const bases = new Map();
  const despres = (fn) => setTimeout(fn, 0);
  return {
    bases,
    open(nom, versio) {
      const peticio = { result: null, error: null };
      despres(() => {
        let dades = bases.get(nom);
        const actualitza = !dades || dades.versio < versio;
        if (!dades) {
          dades = { versio: 0, magatzems: new Map() };
          bases.set(nom, dades);
        }
        peticio.result = {
          objectStoreNames: { contains: (n) => dades.magatzems.has(n) },
          createObjectStore: (n, { keyPath }) => dades.magatzems.set(n, { keyPath, files: new Map() }),
          close() {},
          transaction(noms, mode) {
            const tx = { error: null };
            let pendents = 0;
            let acabada = false;
            const acaba = (correcte) => {
              if (acabada) return;
              if (!correcte) {
                acabada = true;
                tx.onerror?.();
                tx.onabort?.();
              } else if (pendents === 0) {
                acabada = true;
                despres(() => tx.oncomplete?.());
              }
            };
            tx.objectStore = (n) => {
              if (!noms.includes(n)) throw new Error('NotFoundError');
              const magatzem = dades.magatzems.get(n);
              const opera = (accio) => {
                const p = { result: undefined, error: null };
                pendents += 1;
                despres(() => {
                  pendents -= 1;
                  try {
                    p.result = accio();
                    p.onsuccess?.();
                    acaba(true);
                  } catch (error) {
                    p.error = error;
                    tx.error = error;
                    acaba(false);
                  }
                });
                return p;
              };
              const escriptura = () => {
                if (mode !== 'readwrite') throw new Error('ReadOnlyError');
              };
              return {
                add: (valor) => opera(() => {
                  escriptura();
                  const k = valor[magatzem.keyPath];
                  if (magatzem.files.has(k)) {
                    const error = new Error('Clau duplicada');
                    error.name = 'ConstraintError';
                    throw error;
                  }
                  magatzem.files.set(k, JSON.parse(JSON.stringify(valor)));
                  return k;
                }),
                getAll: () => opera(() => [...magatzem.files.values()].map((v) => JSON.parse(JSON.stringify(v)))),
                clear: () => opera(() => {
                  escriptura();
                  magatzem.files.clear();
                })
              };
            };
            return tx;
          }
        };
        if (actualitza) {
          dades.versio = versio;
          peticio.onupgradeneeded?.();
        }
        peticio.onsuccess?.();
      });
      return peticio;
    }
  };
}

const fabriques = [
  ['memòria', () => crearMagatzemMemoria()],
  ['IndexedDB (fals)', () => crearMagatzemIndexedDB({ idb: crearIdbFals() })]
];

describe.each(fabriques)('magatzem en %s', (_nom, fabrica) => {
  test('afegix i llista registres ordenats per data, també per tractor', async () => {
    const m = fabrica();
    const tard = registre({ data: '2026-10-02T10:00:00.000Z' });
    const prompte = registre({ data: '2026-09-02T10:00:00.000Z' });
    const altre = registre({ tractor: 'sdp.altre' });
    for (const r of [tard, altre, prompte]) await m.afegixRegistre(r);
    expect(await m.registres('sdp.gestoria-lector')).toEqual([prompte, tard]);
    expect(await m.registres()).toHaveLength(3);
    expect(await m.registres('sdp.cap')).toEqual([]);
  });

  test('només afegir: un nonce repetit es rebutja', async () => {
    const m = fabrica();
    const r = registre();
    await m.afegixRegistre(r);
    await expect(m.afegixRegistre({ ...r, decisio: 'revocat' })).rejects.toThrow(/només admet afegir/);
    expect(await m.registres()).toEqual([r]);
  });

  test('rebutja registres i claus invàlids', async () => {
    const m = fabrica();
    await expect(m.afegixRegistre({ ...registre(), nonce: 'x' })).rejects.toThrow(TypeError);
    await expect(m.afegixClau({ ...clau(), jwk: { kty: 'RSA' } })).rejects.toThrow(TypeError);
    expect(await m.registres()).toEqual([]);
    expect(await m.claus()).toEqual([]);
  });

  test('claus: afegix, llista per data de creació i rebutja duplicats', async () => {
    const m = fabrica();
    const nova = clau({ creat: '2026-10-02T09:00:00.000Z' });
    const vella = clau();
    await m.afegixClau(nova);
    await m.afegixClau(vella);
    expect(await m.claus()).toEqual([vella, nova]);
    await expect(m.afegixClau({ ...vella, etiqueta: 'Una altra' })).rejects.toThrow(/només admet afegir/);
  });

  test('el que torna és una còpia', async () => {
    const m = fabrica();
    await m.afegixRegistre(registre());
    const [r] = await m.registres();
    r.decisio = 'revocat';
    expect((await m.registres())[0].decisio).toBe('aprovat');
  });

  test('exporta JSONL canònic: primer claus, després registres', async () => {
    const m = fabrica();
    expect(await m.exporta()).toBe('');
    const c = clau();
    const r = registre();
    await m.afegixRegistre(r);
    await m.afegixClau(c);
    const text = await m.exporta();
    expect(text.endsWith('\n')).toBe(true);
    const linies = text.trim().split('\n').map((l) => JSON.parse(l));
    expect(linies).toEqual([{ tipus: 'clau', valor: c }, { tipus: 'registre', valor: r }]);
    expect(text.split('\n')[0].startsWith('{"tipus":"clau","valor":{"creat":')).toBe(true);
  });

  test('esborraTot ho buida tot', async () => {
    const m = fabrica();
    await m.afegixRegistre(registre());
    await m.afegixClau(clau());
    await m.esborraTot();
    expect(await m.registres()).toEqual([]);
    expect(await m.claus()).toEqual([]);
    m.tanca();
  });
});

describe('IndexedDB', () => {
  test('persistix entre instàncies amb la mateixa base de dades', async () => {
    const idb = crearIdbFals();
    const r = registre();
    const primer = crearMagatzemIndexedDB({ idb, nom: 'prova-aprovacions' });
    await primer.afegixRegistre(r);
    primer.tanca();
    const segon = crearMagatzemIndexedDB({ idb, nom: 'prova-aprovacions' });
    expect(await segon.registres()).toEqual([r]);
    expect(idb.bases.has('prova-aprovacions')).toBe(true);
    expect(segon).toMatchObject({ tipus: 'indexeddb', persistent: true });
  });

  test('sense indexedDB, error clar', () => {
    expect(() => crearMagatzemIndexedDB({ idb: null })).toThrow(/IndexedDB/);
    expect(() => crearMagatzemIndexedDB()).toThrow(/IndexedDB/);
  });

  test('si obrir falla, el mètode rebutja i el següent intent torna a obrir', async () => {
    let intents = 0;
    const real = crearIdbFals();
    const idb = {
      open(nom, versio) {
        intents += 1;
        if (intents > 1) return real.open(nom, versio);
        const peticio = { error: new Error('Accés denegat') };
        setTimeout(() => peticio.onerror?.(), 0);
        return peticio;
      }
    };
    const m = crearMagatzemIndexedDB({ idb });
    await expect(m.registres()).rejects.toThrow('Accés denegat');
    expect(await m.registres()).toEqual([]);
  });
});

describe('crearMagatzem', () => {
  test('sense IndexedDB tria memòria, no persistent', () => {
    expect(crearMagatzem({ idb: null })).toMatchObject({ tipus: 'memoria', persistent: false });
    expect(crearMagatzem()).toMatchObject({ tipus: 'memoria', persistent: false });
  });

  test('amb IndexedDB la tria', () => {
    expect(crearMagatzem({ idb: crearIdbFals() })).toMatchObject({ tipus: 'indexeddb', persistent: true });
  });

  test('amb IndexedDB que obri, hi desa de veres i continua sent persistent', async () => {
    const idb = crearIdbFals();
    const m = crearMagatzem({ idb, nom: 'prova-tria' });
    const r = registre();
    await m.afegixRegistre(r);
    expect(m).toMatchObject({ tipus: 'indexeddb', persistent: true });
    expect(await crearMagatzemIndexedDB({ idb, nom: 'prova-tria' }).registres()).toEqual([r]);
  });

  /* governanca-06: la mateixa política que el progrés d'Aprendre
     (gestoria/aprendre/magatzemProgres.js): si el navegador no deixa obrir
     la base, memòria i persistent=false, perquè la UI ho puga avisar. */
  const idbQueNoObri = (fes) => ({
    open() {
      const peticio = { error: new Error('Accés denegat') };
      fes(peticio);
      return peticio;
    }
  });

  test.each([
    ['open() falla més tard (onerror)', (p) => setTimeout(() => p.onerror?.(), 0)],
    ['open() queda bloquejada (onblocked)', (p) => setTimeout(() => p.onblocked?.(), 0)],
    ['open() llança en el moment', () => { throw new Error('SecurityError'); }]
  ])('si %s, passa a memòria i ho diu', async (_cas, fes) => {
    const m = crearMagatzem({ idb: idbQueNoObri(fes) });
    expect(await m.claus()).toEqual([]);
    expect(m).toMatchObject({ tipus: 'memoria', persistent: false });
    const r = registre();
    await m.afegixRegistre(r);
    await m.afegixClau(clau());
    expect(await m.registres()).toEqual([r]);
    expect(await m.exporta()).toMatch(/"tipus":"registre"/);
    await m.esborraTot();
    expect(await m.registres()).toEqual([]);
    m.tanca();
  });

  test('les crides simultànies a una base que no obri acaben totes en memòria', async () => {
    const m = crearMagatzem({ idb: idbQueNoObri((p) => setTimeout(() => p.onerror?.(), 0)) });
    expect(await Promise.all([m.registres(), m.claus()])).toEqual([[], []]);
    expect(m.persistent).toBe(false);
  });

  test('un indexedDB sense open és com no tindre’n', () => {
    expect(crearMagatzem({ idb: {} })).toMatchObject({ tipus: 'memoria', persistent: false });
  });

  test('un error d’una transacció, amb la base oberta, es propaga i no canvia de magatzem', async () => {
    const real = crearIdbFals();
    const idb = {
      open(nom, versio) {
        const peticio = real.open(nom, versio);
        queueMicrotask(() => {
          const exit = peticio.onsuccess;
          peticio.onsuccess = () => {
            peticio.result.transaction = () => { throw new Error('Transacció trencada'); };
            exit();
          };
        });
        return peticio;
      }
    };
    const m = crearMagatzem({ idb });
    await expect(m.registres()).rejects.toThrow('Transacció trencada');
    expect(m).toMatchObject({ tipus: 'indexeddb', persistent: true });
  });
});

describe('validaClau', () => {
  test('una clau bona no té errors i una dolenta sí', () => {
    expect(validaClau(clau())).toEqual([]);
    expect(validaClau({ ...clau(), extra: 1 }).length).toBeGreaterThan(0);
    expect(validaClau({ ...clau(), etiqueta: ' ' }).length).toBeGreaterThan(0);
    expect(validaClau({ ...clau(), creat: 'ahir' }).length).toBeGreaterThan(0);
    expect(validaClau({ ...clau(), jwk: { ...clau().jwk, d: 'privada' } }).length).toBeGreaterThan(0);
    expect(validaClau(null)).toHaveLength(1);
  });
});
