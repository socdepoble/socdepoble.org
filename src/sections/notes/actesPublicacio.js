/* Intenció de publicar durable i comuna a les pestanyes. Només UUID i revisió;
   el document privat continua en el seu diari. El servidor conserva els rebuts. */
const DB = 'sdp-actes-publicacio-r21-v2';
const STORE = 'intents';
const error = () => new Error('No es pot conservar de forma persistent l’intent de publicació.');
export function creaDiariPublicacions({ indexedDB = globalThis.indexedDB, nouId = () => crypto.randomUUID() } = {}) {
  async function transaction(scope, noteId, change) {
    if (!indexedDB || typeof scope !== 'string' || !scope || !String(noteId)) throw error();
    const key = JSON.stringify([scope, String(noteId)]);
    const db = await new Promise((resolve, reject) => {
      const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'key' });
      r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
      r.onblocked = () => reject(error());
    });
    db.onversionchange = () => db.close();
    try { return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite'), store = tx.objectStore(STORE); let value, cause;
      tx.oncomplete = () => resolve(value); tx.onabort = tx.onerror = () => reject(cause || tx.error || error());
      const r = store.get(key); r.onsuccess = () => { try {
        const next = change(r.result, key); value = next; if (next) store.put(next);
      } catch(e) { cause = e; tx.abort(); } };
    }); } finally { db.close(); }
  }
  return Object.freeze({
    llegix(scope, noteId) { return transaction(scope, noteId, r => r); },
    /* Un intent pendent es reprén tal qual (el mateix acte i la mateixa operació:
       si la resposta s'ha perdut, el servidor en fa el replay). Gauntlet R22
       (notes-07) · `noAplicat`: la consulta acaba de confirmar que el servidor
       no té esta operació; aleshores el reintent porta la revisió vigent (la
       nota pot haver canviat després de la fallada), conservant l'acte i
       l'operació. Sense eixa confirmació, la revisió no es toca mai. */
    comenca(scope, noteId, { actId = null, revision, noAplicat = false } = {}) {
      if (!Number.isSafeInteger(revision) || revision < 0) return Promise.reject(error());
      return transaction(scope, noteId, (r, key) => r?.pending && (!actId || r.actId === actId)
        ? (noAplicat && r.revision !== revision ? { ...r, revision } : r)
        : { key, scope, noteId: String(noteId), actId: actId || nouId(), operationId: nouId(), revision, pending: true });
    },
    async confirma(scope, noteId, operationId) {
      let matched = false;
      await transaction(scope, noteId, r => {
        if (!r || r.operationId !== operationId) return r;
        matched = true; return { ...r, pending: false };
      });
      if (!matched) throw new DOMException('L’intent de publicació ha canviat.', 'AbortError');
    },
    retira(scope, noteId) { return transaction(scope, noteId, (r, key) => ({ key, scope, noteId: String(noteId), pending: false })); }
  });
}
