import { getVal } from '../../../config/storage.js';

export const GESTORIA_BUIDA = Object.freeze({ events: [], factures: [], contactes: [], documents: [] });
const MAGATZEMS = Object.keys(GESTORIA_BUIDA);

function lligIndexedDb(dbName, indexedDb) {
  if (!indexedDb?.open) return Promise.resolve(null);
  return new Promise((resolve) => {
    const peticio = indexedDb.open(dbName);
    let resolta = false;
    const acaba = (valor) => { if (!resolta) { resolta = true; resolve(valor); } };
    peticio.onerror = () => acaba(null);
    peticio.onupgradeneeded = (event) => { event.target.transaction.abort(); acaba(null); };
    peticio.onsuccess = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('events')) { db.close(); acaba(null); return; }
      const disponibles = MAGATZEMS.filter((nom) => db.objectStoreNames.contains(nom));
      const result = { events: [], factures: [], contactes: [], documents: [] };
      if (!disponibles.length) { db.close(); acaba(result); return; }
      let transaction;
      try { transaction = db.transaction(disponibles, 'readonly'); }
      catch { db.close(); acaba(null); return; }
      transaction.oncomplete = () => { db.close(); acaba(result); };
      transaction.onerror = () => { db.close(); acaba(null); };
      transaction.onabort = () => { db.close(); acaba(null); };
      for (const nom of disponibles) {
        const consulta = transaction.objectStore(nom).getAll();
        consulta.onsuccess = () => { result[nom] = consulta.result || []; };
      }
    };
  });
}

export async function loadGestoria(options = {}) {
  if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const globals = options.globals || globalThis;
  
  if (import.meta.env?.PROD) {
    console.warn('Gestoria local desactivada en producció (Online-First actiu).');
    return { events: [], factures: [], contactes: [], documents: [] };
  }

  try {
    const demo = new URLSearchParams(globals.location?.search || '').get('mode') === 'demo';
    const antiga = await lligIndexedDb(demo ? 'GestoriaDePoble_Demo' : 'GestoriaDePoble', globals.indexedDB);
    if (antiga && (antiga.events.length || antiga.factures.length || antiga.contactes.length || antiga.documents.length)) return antiga;
    return getVal('sdp_gestoria_local') || { events: [], factures: [], contactes: [], documents: [] };
  } catch (error) {
    console.warn('Error llegint dades locals de gestoria:', error);
    return { events: [], factures: [], contactes: [], documents: [] };
  }
}
