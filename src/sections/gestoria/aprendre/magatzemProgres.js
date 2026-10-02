/**
 * magatzemProgres.js — Progrés del repàs (Aprendre), només en este dispositiu.
 *
 * IndexedDB «sdp-aprendre» v1, magatzem «estats» amb clau cardId. Cada
 * operació obri la base, fa UNA transacció i la tanca (patró de
 * src/data/localNotes.js); si una altra pestanya puja la versió, es tanca.
 * Les operacions van en fila: una escriptura vella mai aterra damunt d'una nova.
 *
 * Sense IndexedDB, o si el navegador no el deixa obrir, treballa en memòria i
 * ho declara amb `persistent: false`: el progrés dura només la sessió.
 *
 * Només es desen els camps del motor (leitner.js) i la baralla: cap text
 * lliure ni dada personal. Res d'això ix de l'ordinador.
 */

const NOM_BD = 'sdp-aprendre';
const STORE = 'estats';
const TEXTOS = ['barallaId', 'cardId', 'contentVersion'];
const NOMBRES = ['caixa', 'dueAt', 'lastReviewedAt', 'repetitions', 'lapses'];

function idBaralla(barallaId) {
  if (typeof barallaId !== 'string' || !barallaId) throw new TypeError('Cal l’identificador de la baralla.');
  return barallaId;
}

/* Llista blanca de camps: el que no és del motor no entra al disc. */
function registreNet(estat) {
  const registre = {};
  for (const camp of TEXTOS) {
    if (typeof estat?.[camp] !== 'string' || !estat[camp]) throw new TypeError(`Estat de progrés sense ${camp}.`);
    registre[camp] = estat[camp];
  }
  for (const camp of NOMBRES) registre[camp] = Number.isFinite(estat[camp]) ? estat[camp] : null;
  return registre;
}

export function creaMagatzemProgres({ idb = globalThis.indexedDB } = {}) {
  /* Còpia de la sessió: és el magatzem sencer quan no hi ha IndexedDB. */
  const memoria = new Map();
  let disponible = Boolean(idb);
  let cadena = Promise.resolve();

  function obri() {
    return new Promise((resolve, reject) => {
      const peticio = idb.open(NOM_BD, 1);
      peticio.onupgradeneeded = () => {
        const db = peticio.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'cardId' });
      };
      peticio.onerror = () => reject(peticio.error || new Error('No s’ha pogut obrir el progrés local.'));
      peticio.onblocked = () => reject(new Error('Tanca les altres pestanyes per a actualitzar el progrés local.'));
      peticio.onsuccess = () => {
        const db = peticio.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
    });
  }

  async function opera(mode, accio, enMemoria) {
    if (!disponible) return enMemoria();
    let db;
    try { db = await obri(); } catch {
      // El navegador no el deixa obrir (navegació privada, permisos): memòria i prou.
      disponible = false;
      return enMemoria();
    }
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        let resultat;
        accio(tx.objectStore(STORE), valor => { resultat = valor; });
        tx.oncomplete = () => resolve(resultat);
        tx.onabort = tx.onerror = () => reject(tx.error || new Error('El progrés local no s’ha pogut actualitzar.'));
      });
    } finally { db.close(); }
  }

  function enFila(operacio) {
    const pas = cadena.then(operacio);
    cadena = pas.catch(() => undefined);
    return pas;
  }

  return {
    /** true si el progrés sobreviu a tancar la pestanya. */
    get persistent() { return disponible; },

    /** Estats desats d'una baralla (còpies). */
    async carrega(barallaId) {
      const id = idBaralla(barallaId);
      const registres = await enFila(() => opera('readonly', (magatzem, torna) => {
        const peticio = magatzem.getAll();
        peticio.onsuccess = () => torna(peticio.result);
      }, () => [...memoria.values()]));
      return (registres || [])
        .filter(registre => registre?.barallaId === id && typeof registre.cardId === 'string')
        .map(registre => ({ ...registre }));
    },

    /** Desa l'estat d'una targeta; ha de portar barallaId i cardId. */
    async desa(estat) {
      const registre = registreNet(estat);
      memoria.set(registre.cardId, registre);
      await enFila(() => opera('readwrite', magatzem => { magatzem.put(registre); }, () => undefined));
      return { ...registre };
    },

    /** Oblida tot el progrés d'una baralla; les altres no es toquen. */
    async esborra(barallaId) {
      const id = idBaralla(barallaId);
      for (const [clau, registre] of memoria) if (registre.barallaId === id) memoria.delete(clau);
      await enFila(() => opera('readwrite', magatzem => {
        const cursor = magatzem.openCursor();
        cursor.onsuccess = () => {
          const actual = cursor.result;
          if (!actual) return;
          if (actual.value?.barallaId === id) actual.delete();
          actual.continue();
        };
      }, () => undefined));
    }
  };
}

let perDefecte = null;
/** El magatzem compartit de l'app; es crea la primera vegada que es demana. */
export function magatzemProgres() {
  perDefecte ||= creaMagatzemProgres();
  return perDefecte;
}
