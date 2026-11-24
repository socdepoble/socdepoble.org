/**
 * idbMemoriaTest.js — Doble lleuger i determinista d'IndexedDB en memòria per a jsdom.
 *
 * En entorns Vitest/jsdom sense IndexedDB natiu, el motor de persistència local rural
 * (sdp-rural-v1) necessita un `globalThis.indexedDB` funcional perquè les escriptures
 * editorials de pàgines de Sistema i llavors puguen completar la transacció atòmica.
 */

function clona(valor) {
  return valor === undefined ? undefined : structuredClone(valor);
}

function peticioResolta(resultat, transaccio = null) {
  const req = {
    result: resultat,
    error: null,
    transaction: transaccio,
    readyState: 'done',
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  };
  queueMicrotask(() => {
    if (typeof req.onsuccess === 'function') {
      req.onsuccess({ target: req });
    }
  });
  return req;
}

export function creaIdbMemoriaTest() {
  const bases = new Map();

  function asseguraBase(nom, versioSolicitada) {
    let reg = bases.get(nom);
    if (!reg) {
      reg = { nom, versio: 0, stores: new Map() };
      bases.set(nom, reg);
    }
    const versioNova = versioSolicitada ?? (reg.versio || 1);
    const calUpgrade = versioNova > reg.versio;
    if (calUpgrade) reg.versio = versioNova;
    return { reg, calUpgrade };
  }

  function embolcallaDb(reg) {
    return {
      name: reg.nom,
      version: reg.versio,
      get objectStoreNames() {
        const llista = [...reg.stores.keys()];
        llista.contains = (nomStore) => reg.stores.has(nomStore);
        return llista;
      },
      createObjectStore(nomStore, opcions = {}) {
        if (!reg.stores.has(nomStore)) {
          reg.stores.set(nomStore, {
            keyPath: opcions?.keyPath ?? null,
            dades: new Map(),
          });
        }
        return { name: nomStore };
      },
      deleteObjectStore(nomStore) {
        reg.stores.delete(nomStore);
      },
      transaction(noms, mode = 'readonly') {
        const llistaNoms = Array.isArray(noms) ? noms : [noms];
        for (const nomStore of llistaNoms) {
          if (!reg.stores.has(nomStore)) throw new Error(`ObjectStore inexistent: ${nomStore}`);
        }
        let pendent = 0;
        let tancada = false;
        const tx = {
          mode,
          error: null,
          oncomplete: null,
          onerror: null,
          onabort: null,
          abort() {
            tancada = true;
            queueMicrotask(() => {
              if (typeof tx.onabort === 'function') tx.onabort({ target: tx });
            });
          },
          objectStore(nomStore) {
            const store = reg.stores.get(nomStore);
            if (!store) throw new Error(`ObjectStore inexistent: ${nomStore}`);
            const encua = (operacio) => {
              pendent += 1;
              const valor = operacio();
              const req = {
                result: valor,
                error: null,
                transaction: tx,
                readyState: 'done',
                onsuccess: null,
                onerror: null,
              };
              queueMicrotask(() => {
                try {
                  if (!tancada && typeof req.onsuccess === 'function') {
                    req.onsuccess({ target: req });
                  }
                } finally {
                  pendent -= 1;
                  if (pendent === 0 && !tancada) {
                    tancada = true;
                    queueMicrotask(() => {
                      if (typeof tx.oncomplete === 'function') tx.oncomplete({ target: tx });
                    });
                  }
                }
              });
              return req;
            };
            return {
              get: (clau) => encua(() => clona(store.dades.get(String(clau)))),
              getAll: () => encua(() => [...store.dades.values()].map(clona)),
              getAllKeys: () => encua(() => [...store.dades.keys()]),
              count: () => encua(() => store.dades.size),
              put: (valor, clauExplicita) => encua(() => {
                const clau = store.keyPath ? valor?.[store.keyPath] : clauExplicita;
                store.dades.set(String(clau), clona(valor));
                return clau;
              }),
              add: (valor, clauExplicita) => encua(() => {
                const clau = store.keyPath ? valor?.[store.keyPath] : clauExplicita;
                store.dades.set(String(clau), clona(valor));
                return clau;
              }),
              delete: (clau) => encua(() => {
                store.dades.delete(String(clau));
                return undefined;
              }),
              clear: () => encua(() => {
                store.dades.clear();
                return undefined;
              }),
            };
          },
        };
        queueMicrotask(() => {
          if (pendent === 0 && !tancada) {
            tancada = true;
            if (typeof tx.oncomplete === 'function') tx.oncomplete({ target: tx });
          }
        });
        return tx;
      },
      close() {},
    };
  }

  return {
    open(nom, versio) {
      const { reg, calUpgrade } = asseguraBase(nom, versio);
      const db = embolcallaDb(reg);
      const req = {
        result: db,
        error: null,
        transaction: null,
        readyState: 'done',
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        onblocked: null,
      };
      queueMicrotask(() => {
        if (calUpgrade && typeof req.onupgradeneeded === 'function') {
          req.onupgradeneeded({ target: req });
        }
        if (typeof req.onsuccess === 'function') {
          req.onsuccess({ target: req });
        }
      });
      return req;
    },
    deleteDatabase(nom) {
      bases.delete(nom);
      return peticioResolta(undefined);
    },
    _buidaTot() {
      bases.clear();
    },
  };
}

export function installaIdbMemoriaTest() {
  const previ = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  const motor = creaIdbMemoriaTest();
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    writable: true,
    value: motor,
  });
  return () => {
    motor._buidaTot();
    if (previ) Object.defineProperty(globalThis, 'indexedDB', previ);
    else delete globalThis.indexedDB;
  };
}
