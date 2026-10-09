/* Suport de proves: un IndexedDB fals i mínim, en memòria, fora de src/
   (LLEI_08 de src/sections/tractors/clausura.test.js: el suport de proves
   dels carrils viu a tests/helpers/).

   Integració de l'Onada 6 (261009): el fa servir la prova de l'Històric
   darrere del cofre (src/sections/gestoria/historic/HistoricCofre.test.jsx),
   que munta el magatzem de producció del cofre (cofre/magatzemCofre.js)
   damunt d'este fals per a mirar què queda de veres a la base. És la unió
   dels dos falsos que ja hi havia, el de facturar/__fixtures__/idbFals.js
   (PENDENT DE TRASLLAT des del 261007: este fitxer n'és el destí, i
   l'original es pot esborrar quan el Mestre ho diga) i el de
   cofre/cofre.test.js:
     · open/upgrade, diverses bases i diversos stores amb keyPath i índexs
       (únics o no);
     · al store, add (amb els índexs únics), put, get, getAll, delete i
       clear; als índexs, get, getAll i openCursor('prev');
     · les transaccions d'una base passen d'una en una, com fa el navegador
       amb les readwrite que se solapen, i una avortada desfà el que havia
       escrit;
     · `operacions` apunta cada operació que es demana (per a vigilar, per
       exemple, que un llibre de només afegir no en demana cap de reescriure);
     · files(base, store) torna el que hi ha desat de veres, en l'ordre de la
       clau, per a comprovar que no hi queda res en clar.
   Res d'ací no és codi de producció: només l'importen les proves. */

const clona = (valor) => (valor === undefined ? undefined : JSON.parse(JSON.stringify(valor)));
const perClau = ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0);

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
    const escriptura = (accio) => () => {
      if (mode !== 'readwrite') throw Object.assign(new Error('Només lectura'), { name: 'ReadOnlyError' });
      return accio();
    };
    tx.abort = () => acaba(false, null);
    tx.objectStore = (nom) => {
      const store = base.stores.get(nom);
      if (!store) throw Object.assign(new Error(`No hi ha cap store «${nom}»`), { name: 'NotFoundError' });
      const ordenades = () => [...store.files.entries()].sort(perClau).map(([, v]) => v);
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
        add: (valor) => peticio('add', escriptura(() => {
          const clau = valor[store.keyPath];
          const unica = [...store.indexs.values()].find(({ camp, unique }) => unique && [...store.files.values()].some((f) => f[camp] === valor[camp]));
          if (store.files.has(clau) || unica) throw Object.assign(new Error('Clau duplicada'), { name: 'ConstraintError' });
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
      return store ? [...store.files.entries()].sort(perClau).map(([, v]) => clona(v)) : [];
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
