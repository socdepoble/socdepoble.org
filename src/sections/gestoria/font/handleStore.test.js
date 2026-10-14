// @vitest-environment node
/* Gestoria · font · handleStore: persistència del FileSystemDirectoryHandle
   de _gestoria_de_poble/ amb clonació estructurada (sense JSON.stringify),
   revalidació de permisos i degradació neta quan no hi ha base de dades o
   falla l'obertura. */
import { describe, expect, test } from 'vitest';
import {
  CLAU_ARREL_GESTORIA,
  NOM_BD_HANDLES,
  STORE_HANDLES,
  VERSIO_BD_HANDLES,
  creaMagatzemHandles,
  desaHandleCarpeta,
  esHandleCarpetaValid,
  oblidaHandleCarpeta,
  recuperaHandleCarpeta,
  verificaPermisHandle
} from './handleStore.js';

const despres = (fn) => setTimeout(fn, 0);

function creaHandleSimulat(nom = '_gestoria_de_poble', { permis = 'granted', permisDemanat = 'granted' } = {}) {
  return {
    kind: 'directory',
    name: nom,
    consultes: 0,
    peticions: 0,
    async* entries() {
      yield ['00_Tauler_Central', { kind: 'directory', name: '00_Tauler_Central' }];
    },
    async queryPermission() {
      this.consultes += 1;
      if (permis instanceof Error) throw permis;
      return permis;
    },
    async requestPermission() {
      this.peticions += 1;
      if (permisDemanat instanceof Error) throw permisDemanat;
      return permisDemanat;
    }
  };
}

function creaIdbSimulat({ fallaOpen = false, bloquejada = false, fallaTx = false } = {}) {
  const dades = new Map();
  const stores = new Set();
  const obertes = [];
  let ultimaBd = null;

  return {
    dades,
    stores,
    obertes,
    get ultimaBd() {
      return ultimaBd;
    },
    open(nom, versio) {
      obertes.push([nom, versio]);
      const peticio = {};
      despres(() => {
        if (fallaOpen) {
          peticio.error = new Error('Navegació privada sense base de dades');
          peticio.onerror?.();
          return;
        }
        if (bloquejada) {
          peticio.onblocked?.();
          return;
        }
        const bd = {
          tancada: false,
          objectStoreNames: {
            contains: (nomStore) => stores.has(nomStore)
          },
          createObjectStore(nomStore) {
            stores.add(nomStore);
            return {};
          },
          close() {
            bd.tancada = true;
          },
          transaction(nomStore, mode) {
            if (fallaTx) throw new Error('Transacció no disponible');
            const tx = { mode, nomStore };
            tx.objectStore = () => ({
              put(valor, clau) {
                if (typeof valor === 'function') throw new Error('No clonable');
                dades.set(clau, valor);
                const req = {};
                despres(() => {
                  req.onsuccess?.();
                  despres(() => tx.oncomplete?.());
                });
                return req;
              },
              get(clau) {
                const req = {};
                despres(() => {
                  req.result = dades.get(clau);
                  req.onsuccess?.();
                  despres(() => tx.oncomplete?.());
                });
                return req;
              },
              delete(clau) {
                dades.delete(clau);
                const req = {};
                despres(() => {
                  req.onsuccess?.();
                  despres(() => tx.oncomplete?.());
                });
                return req;
              }
            });
            return tx;
          }
        };
        ultimaBd = bd;
        peticio.result = bd;
        if (!stores.has(STORE_HANDLES)) peticio.onupgradeneeded?.();
        peticio.onsuccess?.();
      });
      return peticio;
    }
  };
}

describe('esHandleCarpetaValid i verificaPermisHandle', () => {
  test('valida només handles de directori amb mètodes del File System Access', () => {
    const handle = creaHandleSimulat();
    expect(esHandleCarpetaValid(handle)).toBe(true);
    expect(esHandleCarpetaValid({ kind: 'directory', values() {} })).toBe(true);
    expect(esHandleCarpetaValid({ kind: 'directory', getDirectoryHandle() {} })).toBe(true);
    expect(esHandleCarpetaValid({ kind: 'file', getFile() {} })).toBe(false);
    expect(esHandleCarpetaValid({ kind: 'directory' })).toBe(false);
    expect(esHandleCarpetaValid(null)).toBe(false);
    expect(esHandleCarpetaValid('carpeta')).toBe(false);
  });

  test('verificaPermisHandle consulta i, si es demana amb gest, sol·licita el permís', async () => {
    const concedit = creaHandleSimulat('arrel', { permis: 'granted' });
    expect(await verificaPermisHandle(concedit)).toBe('granted');
    expect(concedit.consultes).toBe(1);
    expect(concedit.peticions).toBe(0);

    const pendent = creaHandleSimulat('arrel', { permis: 'prompt', permisDemanat: 'granted' });
    expect(await verificaPermisHandle(pendent, { demana: false })).toBe('prompt');
    expect(pendent.peticions).toBe(0);
    expect(await verificaPermisHandle(pendent, { demana: true })).toBe('granted');
    expect(pendent.peticions).toBe(1);

    const fallit = creaHandleSimulat('arrel', { permis: new Error('SecurityError') });
    expect(await verificaPermisHandle(fallit)).toBe('denied');
    expect(await verificaPermisHandle(null)).toBe('denied');
  });
});

describe('desaHandleCarpeta, recuperaHandleCarpeta i oblidaHandleCarpeta', () => {
  test('desa el handle per clonació estructurada, el recupera intacte i l’oblida', async () => {
    const idb = creaIdbSimulat();
    const handle = creaHandleSimulat('_gestoria_de_poble');

    expect(await recuperaHandleCarpeta({ idb })).toBeNull();
    expect(await desaHandleCarpeta(handle, { idb })).toBe(true);
    expect(idb.obertes[0]).toEqual([NOM_BD_HANDLES, VERSIO_BD_HANDLES]);
    expect(idb.stores.has(STORE_HANDLES)).toBe(true);
    expect(idb.dades.get(CLAU_ARREL_GESTORIA)).toBe(handle);
    expect(idb.ultimaBd.tancada).toBe(true);

    const recuperat = await recuperaHandleCarpeta({ idb });
    expect(recuperat).toBe(handle);
    expect(recuperat.name).toBe('_gestoria_de_poble');

    expect(await oblidaHandleCarpeta({ idb })).toBe(true);
    expect(await recuperaHandleCarpeta({ idb })).toBeNull();
  });

  test('rebutja entrades que no són un handle de carpeta o claus buides sense obrir la base', async () => {
    const idb = creaIdbSimulat();
    expect(await desaHandleCarpeta(null, { idb })).toBe(false);
    expect(await desaHandleCarpeta({ kind: 'file' }, { idb })).toBe(false);
    expect(await desaHandleCarpeta(creaHandleSimulat(), { idb, clau: '   ' })).toBe(false);
    expect(await recuperaHandleCarpeta({ idb, clau: '' })).toBeNull();
    expect(await oblidaHandleCarpeta({ idb, clau: '' })).toBe(false);
    expect(idb.obertes).toEqual([]);
  });

  test('si el valor desat a la base està corromput i no és un handle de directori, recupera torna null', async () => {
    const idb = creaIdbSimulat();
    idb.dades.set(CLAU_ARREL_GESTORIA, { kind: 'file', name: 'intrus.txt' });
    expect(await recuperaHandleCarpeta({ idb })).toBeNull();
  });

  test('degrada netament sense llançar quan no hi ha base de dades, falla l’obertura, es bloqueja o falla la transacció', async () => {
    const handle = creaHandleSimulat();
    for (const idb of [null, {}, creaIdbSimulat({ fallaOpen: true }), creaIdbSimulat({ bloquejada: true }), creaIdbSimulat({ fallaTx: true })]) {
      expect(await desaHandleCarpeta(handle, { idb })).toBe(false);
      expect(await recuperaHandleCarpeta({ idb })).toBeNull();
      expect(await oblidaHandleCarpeta({ idb })).toBe(false);
    }
  });

  test('creaMagatzemHandles encapsula les opcions i opera sobre la mateixa clau', async () => {
    const idb = creaIdbSimulat();
    const magatzem = creaMagatzemHandles({ idb, clau: 'carpeta_personalitzada' });
    const handle = creaHandleSimulat('La_Meua_Gestoria');

    expect(await magatzem.desa(handle)).toBe(true);
    expect(await magatzem.recupera()).toBe(handle);
    expect(await magatzem.oblida()).toBe(true);
    expect(await magatzem.recupera()).toBeNull();
  });
});
