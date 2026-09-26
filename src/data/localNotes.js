import { APP_SEED, NOTE_FOLDERS_SEED, getDefaultUserId } from './appSeed.js';
import { backendScope, normalizeBackendConfig } from '../config/backendConfig.js';
import { sanitizeHtml, netejaText, esFontImatgeSegura } from '../utils/sanitize.js';

const STORE = 'notes';
function openDB() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new Error('El navegador no permet desar notes locals.')); return; }
    const request = indexedDB.open('SdpLocalNotes', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Tanca les altres pestanyes per actualitzar el bloc local.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

// One transaction for read/compare/write; browser tabs share the same revision lock.
const persistence = {
  async mutate(key, transform) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const request = store.get(key);
        let value, failure;
        request.onsuccess = () => {
          try { value = transform(request.result); store.put(value, key); }
          catch (error) { failure = error; tx.abort(); }
        };
        tx.oncomplete = () => resolve(value);
        tx.onabort = tx.onerror = () => reject(failure || tx.error || new Error('Nota local no desada.'));
      });
    } finally { db.close(); }
  },
  async read(key) {
    const db = await openDB();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).get(key);
        tx.oncomplete = () => resolve(request.result || {});
        tx.onabort = tx.onerror = () => reject(tx.error || new Error('No es poden llegir les notes locals.'));
      });
    } finally { db.close(); }
  }
};

function clean(input) {
  const result = {};
  for (const field of ['title', 'subtitle', 'lead', 'content']) if (input[field] !== undefined) result[field] = sanitizeHtml(input[field]);
  for (const field of ['heroImage', 'logoImage']) if (input[field] !== undefined) result[field] = esFontImatgeSegura(input[field]) ? input[field] : '';
  for (const field of ['categories', 'tags']) if (input[field] !== undefined) {
    if (!Array.isArray(input[field])) throw new Error('Classificació de nota invàlida.');
    result[field] = input[field].map(value => netejaText(value)).filter(Boolean);
  }
  if (input.folderId !== undefined) result.folderId = netejaText(input.folderId);
  if (input.copyright !== undefined) result.copyright = netejaText(input.copyright).slice(0, 256);
  return result;
}

/** Storage is injectable for another offline host; the DTO matches the backend port. */
export function createLocalNotesAdapter(storage = persistence) {
  const scope = (owner, config) => JSON.stringify([backendScope(config), owner]);
  const seeds = config => normalizeBackendConfig(config).dataMode === 'seed' ? APP_SEED.notes || [] : [];
  const initial = config => Object.fromEntries(seeds(config).map(n => [n.id, { ...n, revision: n.revision || 0, isPublished: false }]));
  return {
    async load(owner = getDefaultUserId(), config = {}) {
      const notes = { ...initial(config), ...await storage.read(scope(owner, config)) };
      return { notes: Object.values(notes), noteFolders: NOTE_FOLDERS_SEED };
    },
    async create(input, config = {}) {
      const id = input.id || crypto.randomUUID();
      const time = new Date().toISOString();
      const note = { id, folderId: 'f-notes', title: '', content: '', ...clean(input), revision: 0,
        isPublished: false, createdAt: time, updatedAt: time };
      await storage.mutate(scope(getDefaultUserId(), config), stored => {
        const all = { ...initial(config), ...stored };
        if (Object.hasOwn(all, id)) throw Object.assign(new Error('La nota ja existix.'), { status: 409 });
        return { ...all, [id]: note };
      });
      return note;
    },
    async update(id, changes, expectedRevision, config = {}) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) throw new Error('Cal la revisió de la nota.');
      const all = await storage.mutate(scope(getDefaultUserId(), config), stored => {
        const notes = { ...initial(config), ...stored };
        const previous = Object.hasOwn(notes, id) ? notes[id] : null;
        if (!previous) throw Object.assign(new Error('Nota local no trobada.'), { status: 404 });
        if (previous.revision !== expectedRevision) throw Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 });
        return { ...notes, [id]: { ...previous, ...clean(changes), revision: expectedRevision + 1,
          isPublished: false, updatedAt: new Date().toISOString() } };
      });
      return all[id];
    }
  };
}
export const localNotes = createLocalNotesAdapter();
