import { setEfimer, getEfimer } from '../../config/storage.js';

class GlobalSaveManager {
  constructor() {
    this.queues = {}; // notes en edició durant el debounce
    this.locks = {};  // promeses en execució
    this.knownRevisions = new Map();
  }

  // Obtenim la revisió més recent que coneixem, o la de la base
  getExpectedRevision(noteId, baseRevision) {
    if (this.knownRevisions.has(noteId)) {
      return this.knownRevisions.get(noteId);
    }
    return baseRevision || 0;
  }

  setRevision(noteId, revision) {
    this.knownRevisions.set(noteId, revision);
  }

  enqueue(noteId, field, netejat, getBaseNote, updateNoteContext, clearLocalNoteFields, onToast) {
    return new Promise((resolve) => {
      let queueItem = this.queues[noteId];
      if (!queueItem) {
        queueItem = { payload: {}, resolves: [], timeout: null };
        this.queues[noteId] = queueItem;
      }
      
      queueItem.payload[field] = netejat;
      queueItem.resolves.push(resolve);
      
      if (queueItem.timeout) clearTimeout(queueItem.timeout);
      
      queueItem.timeout = setTimeout(() => {
        // Quan venç el debounce, traiem la cua editable (F07 fix)
        const sealedItem = this.queues[noteId];
        delete this.queues[noteId];

        const doSave = async () => {
          const { payload, resolves } = sealedItem;
          
          const baseNote = getBaseNote(noteId);
          const expectedRevision = this.getExpectedRevision(noteId, baseNote?.revision);
            
          try {
            // Passem a 'desant'
            const savedNote = await updateNoteContext(noteId, payload, expectedRevision);
            
            // F02: Actualitzem la revisió coneguda sempre que siga exitós
            this.setRevision(noteId, savedNote.revision);
            
            clearLocalNoteFields(noteId, Object.keys(payload), savedNote.revision);
            
            resolves.forEach(res => res(true));
          } catch (e) {
            console.log("Desat ajornat:", e.message || e);
            if (e.status === 409) {
              onToast('Conflicte: la nota s\'ha actualitzat en un altre dispositiu.', 'error');
              // TODO: F02 Reconciliació de conflictes!
            } else {
              onToast('El canvi no ha arribat al servidor. Reintenta-ho.', 'error');
            }
            resolves.forEach(res => res(false));
          }
        };

        const prevLock = this.locks[noteId] || Promise.resolve();
        const nextLock = prevLock.then(doSave).finally(() => {
          if (this.locks[noteId] === nextLock) delete this.locks[noteId];
        });
        this.locks[noteId] = nextLock;
      }, 600);
    });
  }
}

export const bgSaveManager = new GlobalSaveManager();
