/**
 * portIndexedDB.js — el llibre de registres de facturació a IndexedDB, de només afegir.
 *
 * El contracte és el de port.js. Ací, la mecànica:
 *   · add(), mai put(): un registre que ja hi és fa fallar la transacció
 *     (ConstraintError) en lloc de sobreescriure'l. No hi ha cap camí de
 *     codi que esborre, buide o reescriga (ho vigila portIndexedDB.test.js).
 *   · afegix() llig l'últim registre de l'emissor, l'alta i l'anul·lació de
 *     la mateixa factura i desa, tot en UNA transacció readwrite: IndexedDB
 *     no deixa que dos pestanyes hi escriguen entremig, i un registre que no
 *     va just darrere de l'últim no entra (CADENA_CANVIADA), ni un que nomena
 *     un altre anterior (ENCADENAMENT_INCOHERENT): la comprovació és
 *     comprovaAfegit, la de port.js, dins de la mateixa transacció.
 *   · ambEscriptor(fn): un sol escriptor amb Web Locks (bloqueig exclusiu
 *     «sdp-facturacio:<nom>»), perquè llegir l'últim, generar el registre i
 *     afegir-lo siga una sola secció entre totes les pestanyes. Sense Web
 *     Locks, la fila de la pestanya i la comprovació de la transacció.
 *   · Sense IndexedDB no hi ha llibre: es llança SENSE_INDEXEDDB i no es
 *     passa a memòria, perquè un llibre legal que es perd en tancar la
 *     pestanya no és un llibre.
 *
 * IndexedDB és esborrable (netejar les dades del lloc, la navegació privada,
 * un navegador que fa lloc): l'exportació i la còpia fora del navegador són
 * obligatòries, i demanaPersistencia() demana que no s'esborre per falta
 * d'espai. Res d'això ix de l'ordinador: cap crida de xarxa.
 */
import { copiaCongelada, errorAmbCodi } from '../comu.js';
import {
  comprovaAfegit, comprovaEmpremta, comprovaIdEmisor, creaFila, exportaLlibre, instantania, perCadena, validaPort
} from './port.js';
import { clauFactura } from './validacio.js';

export const NOM_BD = 'sdp-facturacio';
export const VERSIO_BD = 1;
const STORE = 'registres';
const PER_EMISOR = 'perEmisor';
const PER_FACTURA = 'perFactura';
const AMPLADA_ORDRE = 12;

/* La fila desada: la clau ordena la cadena de cada emissor; «factura» és única
   per tipus de registre (una alta i, com a molt, una anul·lació per factura). */
const clauDe = (idEmisor, ordre) => `${idEmisor}|${String(ordre).padStart(AMPLADA_ORDRE, '0')}`;
const facturaDe = (tipusRegistre, registre) => `${tipusRegistre}|${clauFactura(registre)}`;
const filaDe = (registre) => ({
  clau: clauDe(registre.idEmisor, registre.ordre),
  idEmisor: registre.idEmisor,
  factura: facturaDe(registre.tipusRegistre, registre),
  registre
});

/**
 * @param {object} [opcions]
 * @param {string} [opcions.nom] nom de la base (i del bloqueig)
 * @param {IDBFactory} [opcions.idb] per defecte globalThis.indexedDB
 * @param {LockManager|null} [opcions.locks] per defecte navigator.locks
 * @param {StorageManager|null} [opcions.emmagatzematge] per defecte navigator.storage
 * @param {SubtleCrypto} [opcions.subtle] per defecte crypto.subtle
 * @returns {Readonly<object>}
 */
export function creaPortIndexedDB({
  nom = NOM_BD, idb = globalThis.indexedDB, locks = globalThis.navigator?.locks,
  emmagatzematge = globalThis.navigator?.storage, subtle
} = {}) {
  if (!idb || typeof idb.open !== 'function') {
    throw errorAmbCodi('SENSE_INDEXEDDB', 'Este navegador no deixa desar el llibre de factures (IndexedDB): ací no es pot emetre cap factura.');
  }
  const ambWebLocks = typeof locks?.request === 'function';
  const enFila = creaFila();
  let connexio = null;

  const obri = () => {
    if (!connexio) {
      connexio = new Promise((resol, rebutja) => {
        const peticio = idb.open(nom, VERSIO_BD);
        peticio.onupgradeneeded = () => {
          const bd = peticio.result;
          if (bd.objectStoreNames.contains(STORE)) return;
          const store = bd.createObjectStore(STORE, { keyPath: 'clau' });
          store.createIndex(PER_EMISOR, 'idEmisor', { unique: false });
          store.createIndex(PER_FACTURA, 'factura', { unique: true });
        };
        peticio.onsuccess = () => {
          const bd = peticio.result;
          bd.onversionchange = () => {
            bd.close();
            connexio = null;
          };
          resol(bd);
        };
        peticio.onerror = () => rebutja(peticio.error ?? new Error('No s\'ha pogut obrir el llibre de factures.'));
        peticio.onblocked = () => rebutja(errorAmbCodi('BLOQUEJAT', 'Una altra pestanya té oberta una versió anterior del llibre: tanca-la.'));
      });
      connexio.catch(() => {
        connexio = null;
      });
    }
    return connexio;
  };

  /* Una transacció sobre el store; `accio(store, torna, avorta)` encadena les
     peticions. Resol quan la transacció es completa, no quan acaba una petició. */
  const opera = async (mode, accio) => {
    const bd = await obri();
    return new Promise((resol, rebutja) => {
      let tx;
      try {
        tx = bd.transaction([STORE], mode);
      } catch (error) {
        rebutja(error);
        return;
      }
      let resultat;
      let errorPropi = null;
      const torna = (valor) => {
        resultat = valor;
      };
      const avorta = (error) => {
        errorPropi = error;
        try { tx.abort(); } catch { /* ja acabada */ }
      };
      /* L'error d'una petició arriba a la transacció abans que tx.error tinga
         valor: es pren el de la petició (event.target), com el ConstraintError d'add(). */
      const falla = (event) => rebutja(errorPropi ?? event?.target?.error ?? tx.error ?? new Error('El llibre de factures no ha respost.'));
      tx.oncomplete = () => resol(resultat);
      tx.onerror = falla;
      tx.onabort = falla;
      try {
        accio(tx.objectStore(STORE), torna, avorta);
      } catch (error) {
        avorta(error);
      }
    });
  };

  /* L'últim de l'emissor: el cursor de l'índex cap enrere dona la clau més alta, que és l'ordre més alt. */
  const llegixUltim = (store, idEmisor, despres) => {
    const peticio = store.index(PER_EMISOR).openCursor(idEmisor, 'prev');
    peticio.onsuccess = () => despres(peticio.result ? peticio.result.value.registre : null);
  };

  const llig = async ({ idEmisor, des = 1 } = {}) => {
    if (idEmisor !== undefined) comprovaIdEmisor(idEmisor);
    const files = await opera('readonly', (store, torna) => {
      const peticio = idEmisor === undefined ? store.getAll() : store.index(PER_EMISOR).getAll(idEmisor);
      peticio.onsuccess = () => torna(peticio.result);
    });
    return copiaCongelada((files ?? []).map((f) => f.registre).filter((r) => r.ordre >= des).sort(perCadena));
  };

  return validaPort(Object.freeze({
    tipus: 'indexeddb',
    persistent: true,
    coordinacio: ambWebLocks ? 'web-locks' : 'pestanya',

    async afegix(registre) {
      /* La còpia que es verifica és la que es desa, encara que qui crida canvie el seu objecte durant el resum. */
      const propi = instantania(registre);
      comprovaIdEmisor(propi?.idEmisor);
      await comprovaEmpremta(propi, subtle);
      const fila = filaDe(propi);
      try {
        await opera('readwrite', (store, torna, avorta) => {
          llegixUltim(store, propi.idEmisor, (ultim) => {
            const alta = store.index(PER_FACTURA).get(facturaDe('alta', propi));
            alta.onsuccess = () => {
              const anulacio = store.index(PER_FACTURA).get(facturaDe('anulacio', propi));
              anulacio.onsuccess = () => {
                try {
                  comprovaAfegit(propi, { ultim, alta: alta.result?.registre ?? null, anulacio: anulacio.result?.registre ?? null });
                } catch (error) {
                  avorta(error);
                  return;
                }
                store.add(fila);
                torna(true);
              };
            };
          });
        });
      } catch (error) {
        if (error?.name === 'ConstraintError') {
          throw errorAmbCodi('CADENA_CANVIADA', 'Una altra pestanya ha escrit este lloc de la cadena abans: torna a generar el registre.');
        }
        throw error;
      }
      return propi;
    },

    async ultim(idEmisor) {
      comprovaIdEmisor(idEmisor);
      const registre = await opera('readonly', (store, torna) => llegixUltim(store, idEmisor, torna));
      return registre ? copiaCongelada(registre) : null;
    },

    llig,

    async exporta() {
      return exportaLlibre(await llig());
    },

    /* Un sol escriptor entre pestanyes. No es pot niar: dins de fn, afegix() directe. */
    ambEscriptor(fn) {
      return enFila(() => (ambWebLocks ? locks.request(`sdp-facturacio:${nom}`, { mode: 'exclusive' }, () => fn()) : fn()));
    },

    /* Demana que el navegador no esborre el llibre quan li falte espai.
       true concedit · false denegat · null sense l'API. No substituïx la còpia. */
    async demanaPersistencia() {
      if (typeof emmagatzematge?.persist !== 'function') return null;
      try {
        return Boolean(await emmagatzematge.persist());
      } catch {
        return false;
      }
    },

    tanca() {
      if (connexio) connexio.then((bd) => bd.close(), () => {});
      connexio = null;
    }
  }));
}
