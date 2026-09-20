import { setEfimer, getEfimer } from '../../config/storage.js';

// F01: Gestor d'esborranys persistent basat en IndexedDB per no dependre del L1 (storage.js)
const DB_NAME = 'SdpNotesQueue';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDraftToIDB(key, payload) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(payload, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[GlobalSaveManager] No s'ha pogut desar l'esborrany a IndexedDB:", err);
  }
}

async function removeDraftFromIDB(key) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("[GlobalSaveManager] No s'ha pogut eliminar l'esborrany de IndexedDB:", err);
  }
}

export async function getDraftsForScope(scopeKey) {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => {
        const keys = request.result.filter(k => k.startsWith(`${scopeKey}:`));
        if (keys.length === 0) return resolve({});
        
        let pending = keys.length;
        const drafts = {};
        keys.forEach(k => {
          const noteId = k.split(':')[1];
          const getReq = store.get(k);
          getReq.onsuccess = () => {
            drafts[noteId] = getReq.result;
            pending--;
            if (pending === 0) resolve(drafts);
          };
          getReq.onerror = () => {
            pending--;
            if (pending === 0) resolve(drafts);
          };
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn("[GlobalSaveManager] No s'han pogut carregar esborranys d'IndexedDB:", err);
    return {};
  }
}

class GlobalSaveManager {
  constructor() {
    this.queues = {}; // notes en edició durant el debounce
    this.locks = {};  // promeses en execució
    this.knownRevisions = new Map();
  }

  // Obtenim la revisió més recent que coneixem, o la de la base
  getExpectedRevision(scopeKey, noteId, baseRevision) {
    const key = `${scopeKey}:${noteId}`;
    if (this.knownRevisions.has(key)) {
      return this.knownRevisions.get(key);
    }
    return baseRevision || 0;
  }

  setRevision(scopeKey, noteId, revision) {
    const key = `${scopeKey}:${noteId}`;
    this.knownRevisions.set(key, revision);
  }

  enqueue(scopeKey, noteId, field, netejat, getBaseNote, updateNoteContext, clearLocalNoteFields, onToast) {
    return new Promise((resolve) => {
      const key = `${scopeKey}:${noteId}`;
      let queueItem = this.queues[key];
      if (!queueItem) {
        queueItem = { payload: {}, resolves: [], timeout: null };
        this.queues[key] = queueItem;
      }
      
      queueItem.payload[field] = netejat;
      queueItem.resolves.push(resolve);
      
      // Persistim el draft immediatament perquè si cau la pestanya, no es perda
      saveDraftToIDB(key, { ...queueItem.payload, _draftTimestamp: Date.now() });
      
      if (queueItem.timeout) clearTimeout(queueItem.timeout);
      
      queueItem.timeout = setTimeout(() => {
        // Quan venç el debounce, traiem la cua editable
        const sealedItem = this.queues[key];
        delete this.queues[key];

        const doSave = async () => {
          const { payload, resolves } = sealedItem;
          
          const baseNote = getBaseNote(noteId);
          const expectedRevision = this.getExpectedRevision(scopeKey, noteId, baseNote?.revision);
            
          try {
            // Passem a 'desant'
            const savedNote = await updateNoteContext(noteId, payload, expectedRevision);
            
            // Actualitzem la revisió coneguda sempre que siga exitós
            this.setRevision(scopeKey, noteId, savedNote.revision);
            
            clearLocalNoteFields(noteId, payload, savedNote.revision);
            
            // Ha triomfat! L'esborrem d'IDB.
            await removeDraftFromIDB(key);
            
            resolves.forEach(res => res(true));
          } catch (e) {
            console.log("Desat ajornat:", e.message || e);
            if (e.status === 409) {
              onToast("Conflicte: s'ha detectat una versió més recent al servidor.", 'warning');
              // Si és un conflicte 409, netegem la revisió per recuperar-nos i retirem el draft (S-7, S-6)
              this.knownRevisions.delete(key);
              await removeDraftFromIDB(key);
            } else {
              onToast('El canvi no ha arribat al servidor. Reintenta-ho.', 'error');
              // Guardem el payload atrapat per a reintents futurs
              saveDraftToIDB(key, { ...payload, _draftTimestamp: Date.now() });
            }
            resolves.forEach(res => res(false));
          }
        };

        const prevLock = this.locks[key] || Promise.resolve();
        const nextLock = prevLock.then(doSave).finally(() => {
          if (this.locks[key] === nextLock) delete this.locks[key];
        });
        this.locks[key] = nextLock;
      }, 600);
    });
  }
}

export const bgSaveManager = new GlobalSaveManager();
