import { setEfimer, getEfimer } from '../../config/storage.js';

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
      
      if (queueItem.timeout) clearTimeout(queueItem.timeout);
      
      queueItem.timeout = setTimeout(() => {
        // Quan venç el debounce, traiem la cua editable (F07 fix)
        const sealedItem = this.queues[key];
        delete this.queues[key];

        const doSave = async () => {
          const { payload, resolves } = sealedItem;
          
          const baseNote = getBaseNote(noteId);
          const expectedRevision = this.getExpectedRevision(scopeKey, noteId, baseNote?.revision);
            
          try {
            // Passem a 'desant'
            const savedNote = await updateNoteContext(noteId, payload, expectedRevision);
            
            // F02: Actualitzem la revisió coneguda sempre que siga exitós
            this.setRevision(scopeKey, noteId, savedNote.revision);
            
            clearLocalNoteFields(noteId, payload, savedNote.revision);
            
            resolves.forEach(res => res(true));
          } catch (e) {
            console.log("Desat ajornat:", e.message || e);
            if (e.status === 409) {
              onToast('Conflicte: s\'ha detectat una versió més recent al servidor.', 'warning');
              // F10: La reconciliació (baixada de la versió remota i fusió amb el draft local)
              // es produeix automàticament perquè NotesDataContext fa setTick() quan updateNote llança 409.
            } else {
              onToast('El canvi no ha arribat al servidor. Reintenta-ho.', 'error');
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
