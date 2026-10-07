/* PENDENT DE TRASLLAT (261007): ningú no importa este fitxer. La LLEI_08
   (src/sections/tractors/clausura.test.js) vol el suport de proves dels
   carrils fora de src/, a tests/helpers/, i les dues proves que el feien
   servir (facturacio/magatzemPerfil.test.js i facturar/Facturacio.test.jsx)
   porten ara el seu fals escrit dins. Cal moure'l a tests/helpers/idbFals.js
   (i repuntar-hi les dues proves) o esborrar-lo: no s'ha fet perquè el torn
   que l'ha creat no podia esborrar fitxers ni escriure fora de la Gestoria.

   Suport de proves de la Facturació (ordre del Mestre, 261007: «tindre la
   facturació operativa inclús sense xarxa»). Un IndexedDB fals i mínim, el
   mateix model que el de registre/portIndexedDB.test.js, pensat per al perfil
   fiscal (facturacio/magatzemPerfil.js) i per a la pantalla, que hi munta el
   llibre i el perfil de veres:
     · open/upgrade, diverses bases i diversos stores amb keyPath i índexs
       (únics o no);
     · add/getAll al store i, als índexs, get/getAll/openCursor('prev');
     · les transaccions d'una base passen d'una en una, com fa el navegador
       amb les que es solapen, i una avortada desfà el que havia escrit;
     · `operacions` apunta cada operació que es demana, per a vigilar que no
       n'hi ha cap d'esborrar ni de reescriure (el fals ni tan sols en té).
   Res d'ací no és codi de producció: només l'importen les proves. */

const clona = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));

/**
 * @returns {{ open: Function, bases: Map, operacions: string[], files: (base: string, store: string) => object[] }}
 */
export function creaIdbFals() {
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
    tx.abort = () => acaba(false, null);
    tx.objectStore = (nom) => {
      const store = base.stores.get(nom);
      if (!store) throw Object.assign(new Error(`No hi ha cap store «${nom}»`), { name: 'NotFoundError' });
      const ordenades = () => [...store.files.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, v]) => v);
      const index = (nomIndex) => {
        const { camp } = store.indexs.get(nomIndex);
        const coincidents = (clau) => ordenades().filter((fila) => fila[camp] === clau);
        return {
          get: (clau) => peticio('index.get', () => clona(coincidents(clau)[0])),
          getAll: (clau) => peticio('index.getAll', () => clona(coincidents(clau))),
          openCursor: (clau, direccio) => peticio('index.openCursor', () => {
            const files = coincidents(clau);
            const fila = direccio === 'prev' ? files[files.length - 1] : files[0];
            return fila ? { value: clona(fila) } : null;
          })
        };
      };
      return {
        add: (valor) => peticio('add', () => {
          if (mode !== 'readwrite') throw Object.assign(new Error('Només lectura'), { name: 'ReadOnlyError' });
          const clau = valor[store.keyPath];
          const unica = [...store.indexs.values()].find(({ camp, unique }) => unique && [...store.files.values()].some((f) => f[camp] === valor[camp]));
          if (store.files.has(clau) || unica) throw Object.assign(new Error('Clau duplicada'), { name: 'ConstraintError' });
          store.files.set(clau, clona(valor));
          return clau;
        }),
        getAll: () => peticio('getAll', () => clona(ordenades())),
        index
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
      return store ? [...store.files.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, v]) => clona(v)) : [];
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

/* Web Locks fals: un bloqueig exclusiu per nom, compartit per les «pestanyes» que el reben. */
export function creaLocksFals() {
  const cues = new Map();
  const peticions = [];
  return {
    peticions,
    request(nom, opcions, fn) {
      peticions.push({ nom, mode: opcions?.mode });
      const pas = (cues.get(nom) ?? Promise.resolve()).then(() => fn({ name: nom, mode: opcions?.mode }));
      cues.set(nom, pas.catch(() => undefined));
      return pas;
    }
  };
}
