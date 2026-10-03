/**
 * navegadorFals.js — SUPORT DE PROVES (no l'importa cap fitxer de producció).
 *
 * Un IndexedDB, uns Web Locks i un BroadcastChannel falsos, fets a mà, per a
 * provar utils/magatzemLocal.js i els magatzems de les apps (El Bar, Salut)
 * sense dependències noves (no hi ha fake-indexeddb i no se n'ha d'instal·lar).
 * Els Locks i el Canal comparteixen estat entre les «pestanyes» (instàncies)
 * d'una mateixa prova.
 *
 *   const { idb, registre, bases, control } = creaIdbFals();      // { fallaObrir, bloqueja }
 *   const magatzem = creaMagatzemIdb({ …, idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
 *
 * registre.obertes compta les connexions obertes (ha de tornar a 0);
 * registre.obrides, cada [nom, versio] demanat; bases, el contingut desat.
 * control.fallaObrir i control.bloqueja es poden canviar a mitja prova (una
 * base que deixa de respondre a mitja sessió).
 * Com el navegador: obrir amb una versió més baixa que la desada dona
 * VersionError; index.getAll(undefined | null) torna tot l'índex i un valor
 * que no és clau llança DataError; els Web Locks criden el callback en una
 * tasca posterior (també el de `ifAvailable` sense bloqueig).
 * No imita: IDBKeyRange, cursors, índexs únics ni claus Date o llista.
 * Necessita structuredClone i queueMicrotask (Node ≥ 18 o jsdom de vitest).
 *
 * Porta tractor-pedra-seca, LLEI_08 (subarbre orfe): este fitxer no penjarà
 * mai de cap entrada, perquè només l'importen proves. Cal una excepció a
 * EXCEPCIONS_ORFE o que el tractor excloga `__fixtures__` (decisió del Mestre).
 */

const clona = (valor) => structuredClone(valor);

/* L'ordre de les claus d'IndexedDB: els nombres abans que els textos. */
const rang = (clau) => (typeof clau === 'number' ? 0 : 1);
const compara = (a, b) => {
  if (rang(a) !== rang(b)) return rang(a) - rang(b);
  if (a < b) return -1;
  return a > b ? 1 : 0;
};
const ordenats = (files) => [...files.entries()].sort(([a], [b]) => compara(a, b)).map(([, v]) => v);
/* Les claus que este fals entén: text o nombre que no siga NaN. */
const esClau = (valor) => typeof valor === 'string' || (typeof valor === 'number' && !Number.isNaN(valor));
const errorNom = (nom) => Object.assign(new Error(nom), { name: nom });

/**
 * IndexedDB mínim: peticions en microtasques, la transacció es tanca en la
 * macrotasca següent (ja sense peticions vives) i un abort desfà els canvis.
 * @param {{ fallaObrir?: boolean, bloqueja?: boolean }} [opcions]
 *   fallaObrir: open() llança (navegació privada); bloqueja: avisa onblocked.
 *   Totes dues es poden canviar després amb `control`.
 */
export function creaIdbFals({ fallaObrir = false, bloqueja = false } = {}) {
  const bases = new Map();
  const registre = { obertes: 0, obrides: [], connexions: [] };
  const control = { fallaObrir, bloqueja };

  function storeFals(s, tx) {
    const peticio = (fn) => {
      const p = {};
      queueMicrotask(() => { p.result = fn(); p.onsuccess?.(); });
      return p;
    };
    const escriu = () => { if (tx && tx.mode !== 'readwrite') throw new Error('ReadOnlyError'); };
    return {
      indexNames: { contains: (n) => s.indexs.has(n) },
      createIndex(n, camp) { s.indexs.set(n, camp); },
      get: (clau) => peticio(() => (s.files.has(clau) ? clona(s.files.get(clau)) : undefined)),
      getAll: () => peticio(() => ordenats(s.files).map(clona)),
      put(valor) { escriu(); s.files.set(valor[s.keyPath], clona(valor)); return peticio(() => valor[s.keyPath]); },
      delete(clau) { escriu(); s.files.delete(clau); return peticio(() => undefined); },
      clear() { escriu(); s.files.clear(); return peticio(() => undefined); },
      index(n) {
        const camp = s.indexs.get(n);
        if (!camp) throw new Error('NotFoundError');
        return {
          /* Com IndexedDB: sense valor (undefined o null), tot l'índex, en
             l'ordre de l'índex i després de la clau; un valor que no és clau, DataError. */
          getAll(valor) {
            if (valor === undefined || valor === null) {
              return peticio(() => ordenats(s.files).filter((r) => esClau(r[camp])).sort((a, b) => compara(a[camp], b[camp])).map(clona));
            }
            if (!esClau(valor)) throw errorNom('DataError');
            return peticio(() => ordenats(s.files).filter((r) => r[camp] === valor).map(clona));
          }
        };
      }
    };
  }

  function transaccio(base, noms, mode) {
    const llista = Array.isArray(noms) ? noms : [noms];
    for (const n of llista) if (!base.stores.has(n)) throw new Error(`NotFoundError: ${n}`);
    const instantani = new Map(llista.map((n) => [n, new Map(base.stores.get(n).files)]));
    const tx = { mode, error: null, abortada: false, acabada: false };
    tx.objectStore = (n) => {
      if (!llista.includes(n)) throw new Error('NotFoundError');
      return storeFals(base.stores.get(n), tx);
    };
    tx.abort = () => {
      if (tx.acabada) throw new Error('InvalidStateError');
      tx.abortada = true;
    };
    setTimeout(() => {
      tx.acabada = true;
      if (tx.abortada) {
        for (const [n, files] of instantani) base.stores.get(n).files = files;
        tx.onabort?.();
      } else tx.oncomplete?.();
    }, 0);
    return tx;
  }

  const idb = {
    open(nom, versio) {
      registre.obrides.push([nom, versio]);
      if (control.fallaObrir) throw errorNom('SecurityError');
      const peticio = {};
      setTimeout(() => {
        let base = bases.get(nom);
        const anterior = base?.versio ?? 0;
        /* Una altra pestanya ja ha pujat la versió: IndexedDB no obri la base. */
        if (versio < anterior) {
          peticio.error = errorNom('VersionError');
          peticio.onerror?.();
          return;
        }
        if (!base) {
          base = { versio: 0, stores: new Map() };
          bases.set(nom, base);
        }
        const db = {
          objectStoreNames: { contains: (n) => base.stores.has(n) },
          createObjectStore(n, { keyPath }) {
            const s = { keyPath, indexs: new Map(), files: new Map() };
            base.stores.set(n, s);
            return storeFals(s, null);
          },
          transaction: (noms, mode) => transaccio(base, noms, mode),
          close() {
            if (db.tancada) return;
            db.tancada = true;
            registre.obertes -= 1;
          }
        };
        registre.obertes += 1;
        registre.connexions.push(db);
        peticio.result = db;
        if (control.bloqueja) peticio.onblocked?.();
        if (versio > anterior) {
          base.versio = versio;
          peticio.transaction = { objectStore: (n) => storeFals(base.stores.get(n), null) };
          peticio.onupgradeneeded?.();
        }
        peticio.onsuccess?.();
      }, 0);
      return peticio;
    }
  };
  /** Els registres desats d'un store, en ordre de clau (per a mirar què ha arribat al «disc»). */
  const files = (nom, store) => ordenats(bases.get(nom)?.stores.get(store)?.files ?? new Map()).map(clona);
  return { idb, registre, bases, files, control };
}

/* Crida el callback d'un bloqueig en una tasca posterior, com el navegador,
   i torna la promesa del seu resultat (també si el callback llança). */
const enTasca = (cb, argument) => new Promise((resolve) => { setTimeout(resolve, 0); })
  .then(() => cb(argument));

/**
 * Web Locks compartits per totes les «pestanyes» d'una prova (ifAvailable, cua
 * i signal). Com l'especificació: la disponibilitat es decidix en demanar-lo,
 * però el callback s'executa en una tasca posterior; el bloqueig s'allibera
 * quan la promesa del callback acaba, bé o malament; un abort només treu de
 * la cua una petició que encara no s'ha concedit.
 */
export function creaLocksFals() {
  const tinguts = new Set();
  const cues = new Map();
  const concedix = (nom, cb, resolve, reject) => {
    tinguts.add(nom);
    const allibera = () => {
      tinguts.delete(nom);
      const seguent = cues.get(nom)?.shift();
      if (seguent) concedix(nom, seguent.cb, seguent.resolve, seguent.reject);
    };
    enTasca(cb, { name: nom }).then((valor) => {
      allibera();
      resolve(valor);
    }, (error) => {
      allibera();
      reject(error);
    });
  };
  return {
    request(nom, opcions, cb) {
      return new Promise((resolve, reject) => {
        if (opcions.signal?.aborted) {
          reject(errorNom('AbortError'));
          return;
        }
        if (!tinguts.has(nom)) {
          concedix(nom, cb, resolve, reject);
          return;
        }
        if (opcions.ifAvailable) {
          enTasca(cb, null).then(resolve, reject);
          return;
        }
        const entrada = { cb, resolve, reject };
        if (!cues.has(nom)) cues.set(nom, []);
        cues.get(nom).push(entrada);
        opcions.signal?.addEventListener('abort', () => {
          const cua = cues.get(nom) ?? [];
          if (!cua.includes(entrada)) return;
          cues.set(nom, cua.filter((e) => e !== entrada));
          reject(errorNom('AbortError'));
        });
      });
    }
  };
}

/** BroadcastChannel fals: entrega a les altres instàncies del mateix nom i apunta cada enviament. */
export function creaCanalFals() {
  const obertes = new Set();
  const enviats = [];
  class CanalFals {
    constructor(nom) {
      this.nom = nom;
      this.onmessage = null;
      obertes.add(this);
    }

    postMessage(data) {
      enviats.push({ nom: this.nom, data: clona(data) });
      for (const altre of obertes) {
        if (altre !== this && altre.nom === this.nom) queueMicrotask(() => altre.onmessage?.({ data: clona(data) }));
      }
    }

    close() { obertes.delete(this); }
  }
  return { Canal: CanalFals, enviats, obertes };
}
