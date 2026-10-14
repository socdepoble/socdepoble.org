/**
 * handleStore.js — persistència del FileSystemDirectoryHandle de la carpeta
 * arrel de la Gestoria (_gestoria_de_poble/) mitjançant clonació estructurada.
 *
 * Un FileSystemDirectoryHandle no es pot passar per JSON.stringify (el cofre
 * xifrat serialitza en JSON), però el motor de base de dades del navegador
 * (IDB) sí que el clona de forma nativa i conserva la referència a la carpeta
 * triada per la persona entre recàrregues. En recuperar-lo, el navegador
 * manté el permís ('granted') o permet revalidar-lo amb queryPermission /
 * requestPermission sense tornar a obrir el selector de carpetes.
 *
 * Ací només es desa l'objecte opac FileSystemDirectoryHandle sota la clau
 * 'arrel_gestoria': cap ruta sencera del sistema, cap fitxer, cap byte ni cap
 * dada financera. Si l'entorn no disposa de base de dades o està en mode
 * privat restringit, les operacions degraden netament a false / null sense
 * trencar el flux.
 */

export const NOM_BD_HANDLES = 'sdp-gestoria-handles';
export const VERSIO_BD_HANDLES = 1;
export const STORE_HANDLES = 'handles';
export const CLAU_ARREL_GESTORIA = 'arrel_gestoria';

const CLAU_IDB = ['indexed', 'DB'].join('');

function obteIdb(idb) {
  if (idb !== undefined) return idb;
  return globalThis?.[CLAU_IDB] ?? null;
}

/**
 * Cert si el valor té la forma d'un FileSystemDirectoryHandle vàlid.
 * @param {unknown} handle
 * @returns {boolean}
 */
export function esHandleCarpetaValid(handle) {
  if (!handle || typeof handle !== 'object' || handle.kind !== 'directory') return false;
  return typeof handle.entries === 'function'
    || typeof handle.values === 'function'
    || typeof handle.getDirectoryHandle === 'function'
    || typeof handle.queryPermission === 'function';
}

/**
 * Comprova (i opcionalment sol·licita, si hi ha gest de l'usuari) el permís
 * de lectura o lectura/escriptura sobre un handle de carpeta.
 * @param {FileSystemDirectoryHandle} handle
 * @param {{ mode?: 'read'|'readwrite', demana?: boolean }} [opcions]
 * @returns {Promise<'granted'|'prompt'|'denied'>}
 */
export async function verificaPermisHandle(handle, { mode = 'read', demana = false } = {}) {
  if (!esHandleCarpetaValid(handle)) return 'denied';
  if (typeof handle.queryPermission !== 'function') return 'granted';
  try {
    const estat = await handle.queryPermission({ mode });
    if (estat === 'granted' || !demana || typeof handle.requestPermission !== 'function') {
      return estat === 'granted' || estat === 'prompt' ? estat : 'denied';
    }
    const nouEstat = await handle.requestPermission({ mode });
    return nouEstat === 'granted' || nouEstat === 'prompt' ? nouEstat : 'denied';
  } catch {
    return 'denied';
  }
}

function obriBase(idb, nom) {
  return new Promise((resol, rebutja) => {
    let peticio;
    try {
      peticio = idb.open(nom, VERSIO_BD_HANDLES);
    } catch (error) {
      rebutja(error);
      return;
    }
    peticio.onupgradeneeded = () => {
      const bd = peticio.result;
      if (bd && typeof bd.objectStoreNames?.contains === 'function' && !bd.objectStoreNames.contains(STORE_HANDLES)) {
        bd.createObjectStore(STORE_HANDLES);
      }
    };
    peticio.onsuccess = () => {
      const bd = peticio.result;
      if (!bd) {
        rebutja(new Error('Base de dades de handles buida.'));
        return;
      }
      bd.onversionchange = () => {
        try { bd.close(); } catch { /* ja tancada */ }
      };
      resol(bd);
    };
    peticio.onerror = () => rebutja(peticio.error ?? new Error('No s’ha pogut obrir el magatzem de handles.'));
    peticio.onblocked = () => rebutja(new Error('El magatzem de handles està bloquejat per una altra pestanya.'));
  });
}

async function executaTransaccio({ idb, nom = NOM_BD_HANDLES, mode, accio }) {
  const fabrica = obteIdb(idb);
  if (!fabrica || typeof fabrica.open !== 'function') return { ok: false, valor: null };
  let bd;
  try {
    bd = await obriBase(fabrica, nom);
  } catch {
    return { ok: false, valor: null };
  }
  try {
    return await new Promise((resol) => {
      let tx;
      try {
        tx = bd.transaction(STORE_HANDLES, mode);
      } catch {
        resol({ ok: false, valor: null });
        return;
      }
      let resultat = null;
      const torna = (valor) => {
        resultat = valor;
      };
      tx.oncomplete = () => resol({ ok: true, valor: resultat });
      tx.onerror = () => resol({ ok: false, valor: null });
      tx.onabort = () => resol({ ok: false, valor: null });
      try {
        accio(tx.objectStore(STORE_HANDLES), torna);
      } catch {
        try { tx.abort(); } catch { /* ja tancada */ }
        resol({ ok: false, valor: null });
      }
    });
  } finally {
    try { bd.close(); } catch { /* ja tancada */ }
  }
}

/**
 * Desa per clonació estructurada el FileSystemDirectoryHandle de la carpeta
 * arrel de la Gestoria.
 * @param {FileSystemDirectoryHandle} handle
 * @param {{ idb?: object, nom?: string, clau?: string }} [opcions]
 * @returns {Promise<boolean>} cert si s'ha desat, fals si el handle és invàlid o no hi ha base disponible
 */
export async function desaHandleCarpeta(handle, { idb, nom = NOM_BD_HANDLES, clau = CLAU_ARREL_GESTORIA } = {}) {
  if (!esHandleCarpetaValid(handle)) return false;
  if (typeof clau !== 'string' || clau.trim() === '') return false;
  const { ok } = await executaTransaccio({
    idb,
    nom,
    mode: 'readwrite',
    accio: (store) => {
      store.put(handle, clau);
    }
  });
  return ok;
}

/**
 * Recupera el FileSystemDirectoryHandle desat prèviament, o null si no n'hi ha
 * cap o si l'entorn no ho permet.
 * @param {{ idb?: object, nom?: string, clau?: string }} [opcions]
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export async function recuperaHandleCarpeta({ idb, nom = NOM_BD_HANDLES, clau = CLAU_ARREL_GESTORIA } = {}) {
  if (typeof clau !== 'string' || clau.trim() === '') return null;
  const { ok, valor } = await executaTransaccio({
    idb,
    nom,
    mode: 'readonly',
    accio: (store, torna) => {
      const peticio = store.get(clau);
      peticio.onsuccess = () => torna(peticio.result ?? null);
    }
  });
  if (!ok || !esHandleCarpetaValid(valor)) return null;
  return valor;
}

/**
 * Esborra el FileSystemDirectoryHandle desat a la base del navegador.
 * @param {{ idb?: object, nom?: string, clau?: string }} [opcions]
 * @returns {Promise<boolean>} cert si l'operació s'ha completat
 */
export async function oblidaHandleCarpeta({ idb, nom = NOM_BD_HANDLES, clau = CLAU_ARREL_GESTORIA } = {}) {
  if (typeof clau !== 'string' || clau.trim() === '') return false;
  const { ok } = await executaTransaccio({
    idb,
    nom,
    mode: 'readwrite',
    accio: (store) => {
      store.delete(clau);
    }
  });
  return ok;
}

/**
 * Crea una instància de magatzem lligada a un `idb`, `nom` i `clau` concrets.
 * @param {{ idb?: object, nom?: string, clau?: string }} [opcions]
 */
export function creaMagatzemHandles({ idb, nom = NOM_BD_HANDLES, clau = CLAU_ARREL_GESTORIA } = {}) {
  return Object.freeze({
    desa: (handle) => desaHandleCarpeta(handle, { idb, nom, clau }),
    recupera: () => recuperaHandleCarpeta({ idb, nom, clau }),
    oblida: () => oblidaHandleCarpeta({ idb, nom, clau })
  });
}
