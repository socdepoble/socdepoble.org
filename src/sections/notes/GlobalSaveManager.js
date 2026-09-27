const DB_NAME = 'SdpNotesQueue';
const STORE_NAME = 'drafts';

function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('El magatzem d’esborranys està bloquejat.'));
  });
}

// Read/compare/write share one transaction, including across browser tabs.
export async function mutateDraft(key, transform) {
  const db = await getDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      let result;
      request.onsuccess = () => {
        result = transform(request.result || {});
        if (result == null) store.delete(key);
        else store.put(result, key);
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Esborrany no desat.'));
    });
  } finally { db.close(); }
}

export async function getDraftsForScope(scopeKey) {
  const db = await getDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const result = {};
      const request = tx.objectStore(STORE_NAME).openCursor();
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        if (String(cursor.key).startsWith(`${scopeKey}:`)) {
          result[String(cursor.key).slice(scopeKey.length + 1)] = cursor.value;
        }
        cursor.continue();
      };
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('No es poden llegir els esborranys.'));
    });
  } finally { db.close(); }
}

export function draftFields(draft = {}) {
  return Object.fromEntries(Object.entries(draft).filter(([key]) => !key.startsWith('_')));
}

export class GlobalSaveManager {
  constructor({ persist = mutateDraft, delay = 600, maxInactiveRevisions = 256 } = {}) {
    this.persist = persist;
    this.delay = delay;
    this.maxInactiveRevisions = Math.max(0, Math.floor(maxInactiveRevisions) || 0);
    this.queues = new Map();
    this.locks = new Map();
    this.writes = new Map();
    this.knownRevisions = new Map();
  }

  getExpectedRevision(scope, id, base = 0) {
    return Math.max(base || 0, this.knownRevisions.get(`${scope}:${id}`) || 0);
  }

  setRevision(scope, id, revision) {
    const key = `${scope}:${id}`;
    const expected = this.getExpectedRevision(scope, id, revision);
    this.knownRevisions.delete(key);
    this.knownRevisions.set(key, expected);
    this.pruneRevisions();
  }

  /** Conserva com a màxim 256 revisions inactives; mai expulsa un desat viu.
   * Una expulsió només perd cache: updateNote continua exigint revisió remota.
   */
  pruneRevisions() {
    const inactive = [...this.knownRevisions.keys()].filter(key =>
      !this.queues.has(key) && !this.locks.has(key) && !this.writes.has(key));
    for (const key of inactive.slice(0, Math.max(0, inactive.length - this.maxInactiveRevisions))) {
      this.knownRevisions.delete(key);
    }
  }

  write(key, transform) {
    const next = (this.writes.get(key) || Promise.resolve()).catch(() => {}).then(() => this.persist(key, transform));
    this.writes.set(key, next);
    next.finally(() => {
      if (this.writes.get(key) === next) this.writes.delete(key);
      this.pruneRevisions();
    }).catch(() => {});
    return next;
  }

  serial(key, action) {
    const next = (this.locks.get(key) || Promise.resolve()).catch(() => {}).then(action);
    this.locks.set(key, next);
    next.finally(() => {
      if (this.locks.get(key) === next) this.locks.delete(key);
      this.pruneRevisions();
    }).catch(() => {});
    return next;
  }

  enqueue(scope, id, field, value, getBase, update, clear, toast) {
    const key = `${scope}:${id}`;
    let item = this.queues.get(key);
    if (!item) {
      item = { resolves: [], getBase, update, clear, toast };
      this.queues.set(key, item);
    }
    item.persisted = this.write(key, previous => {
      const version = (previous._operationVersion || 0) + 1;
      // D01 · Un esborrany naix quan no queda cap camp pendent: la seua base és
      // la revisió que la persona té davant en eixe moment (o la del darrer desat
      // propi, si la vista encara no l'ha rebuda). Mentre queden camps pendents,
      // la base no es mou: només l'avança un desat propi confirmat.
      const pendent = Object.keys(draftFields(previous)).length > 0;
      const base = pendent && previous._baseRevision != null
        ? previous._baseRevision
        : Math.max(getBase(id)?.revision ?? 0, previous._baseRevision ?? 0);
      return { ...previous, [field]: value, _operationVersion: version,
        _fieldVersions: { ...previous._fieldVersions, [field]: version },
        _baseRevision: base };
    });
    clearTimeout(item.timer);
    item.timer = setTimeout(() => { void this.flush(scope, id); }, this.delay);
    return new Promise(resolve => item.resolves.push(resolve));
  }

  flush(scope, id) {
    const key = `${scope}:${id}`;
    const item = this.queues.get(key);
    if (!item) return this.locks.get(key) || Promise.resolve(true);
    clearTimeout(item.timer);
    this.queues.delete(key);
    return this.serial(key, async () => {
      try {
        const snapshot = await item.persisted;
        const current = await this.write(key, value => value);
        // A preceding save may already have confirmed some accumulated fields.
        // Never resend those old values over a later server revision.
        const payload = Object.fromEntries(Object.entries(draftFields(snapshot)).filter(([field]) =>
          current._fieldVersions?.[field] === snapshot._fieldVersions[field]
        ));
        if (!Object.keys(payload).length) {
          item.resolves.forEach(resolve => resolve(true));
          return true;
        }
        // D01 · La revisió esperada és la BASE de l'esborrany: la que tenia la nota
        // quan es va començar a editar, avançada només pels desats propis
        // confirmats. Mai la darrera lectura remota: si el servidor ha avançat per
        // un altre camí, ha de respondre 409, que és justament el que protegix el CAS.
        const base = current._baseRevision ?? snapshot._baseRevision ?? item.getBase(id)?.revision;
        const saved = await item.update(id, payload, this.getExpectedRevision(scope, id, base));
        this.setRevision(scope, id, saved.revision);
        await this.write(key, current => {
          const next = { ...current, _fieldVersions: { ...current._fieldVersions } };
          for (const field of Object.keys(payload)) {
            if (next._fieldVersions[field] === snapshot._fieldVersions[field]) {
              delete next[field];
              delete next._fieldVersions[field];
            }
          }
          // Keep the counter even when clean; revisions never go backwards.
          next._baseRevision = saved.revision;
          return next;
        });
        item.clear(id, payload, saved.revision);
        item.resolves.forEach(resolve => resolve(true));
        return true;
      } catch (error) {
        // Never rewrite an old failed snapshot over a newer draft.
        item.toast(error?.status === 409
          ? 'Conflicte: hi ha una versió més recent. El teu esborrany es conserva.'
          : 'No s’ha pogut confirmar el desat. El canvi continua pendent.', 'error');
        item.resolves.forEach(resolve => resolve(false));
        return false;
      }
    });
  }

  // Publication enters the same lock synchronously, before any later autosave.
  runExclusive(scope, id, action) {
    const flushed = this.flush(scope, id);
    return this.serial(`${scope}:${id}`, async () => {
      if (!await flushed) throw new Error('Cal confirmar el desat abans de publicar.');
      return action();
    });
  }

  async clearDraft(scope, id) {
    const key = `${scope}:${id}`;
    const item = this.queues.get(key);
    if (item) {
      clearTimeout(item.timer);
      this.queues.delete(key);
      item.resolves.forEach(resolve => resolve(false));
    }
    // A later enqueue is ordered after this clear, never removed by it.
    await this.write(key, current => ({ _operationVersion: (current._operationVersion || 0) + 1 }));
  }

  /** Paperera, arxiu o esborrat: la nota ja no es desa més. Cancel·la la cua
   * pendent (les seues promeses es resolen a false), esborra el registre
   * d'IndexedDB (escriure null és l'única manera: clearDraft el conserva) i
   * oblida la revisió coneguda. Un enqueue posterior el tornaria a crear: qui
   * crida ha de tallar abans els desats d'eixa nota. */
  async oblida(scope, id) {
    const key = `${scope}:${id}`;
    const item = this.queues.get(key);
    if (item) {
      clearTimeout(item.timer);
      this.queues.delete(key);
      item.resolves.forEach(resolve => resolve(false));
    }
    await this.write(key, () => null);
    this.knownRevisions.delete(key);
  }

  /** D01 · Decisió explícita de la persona: conservar el seu esborrany damunt
   * d'una revisió remota més nova. Només mou la base; els camps no es toquen. */
  async rebaseDraft(scope, id, revision) {
    const current = await this.write(`${scope}:${id}`, previous => ({ ...previous, _baseRevision: revision }));
    return draftFields(current);
  }

  /** D01 · Una revisió confirmada per una escriptura pròpia fora de la cua
   * (la publicació) també avança la base de l'esborrany: un canvi propi mai no
   * és un conflicte, tampoc després de recarregar. Sense registre, no en crea cap. */
  async confirmRevision(scope, id, revision) {
    this.setRevision(scope, id, revision);
    await this.write(`${scope}:${id}`, previous => {
      if (!Object.keys(previous).length) return null;
      return (previous._baseRevision ?? 0) < revision ? { ...previous, _baseRevision: revision } : previous;
    });
  }
}

export const bgSaveManager = new GlobalSaveManager();
