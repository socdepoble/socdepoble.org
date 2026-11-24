/** IndexedDB contract fixture for rural failure tests. No production imports.
 * Transactions use private snapshots and a database queue: only oncomplete
 * exposes writes. Supports inline/out-of-line keys, indexes and aborts.
 * It is deliberately not a browser certification (no cursors or key ranges).
 */
export function creaIdbCaosRural() {
  const bases = new Map();
  const control = { errorObrir: null, errorEscriptura: null, fallaEscriptura: 1, pausaCommit: false };
  const registre = { obertes: 0, commits: 0, aborts: 0 };
  const pendents = new Set();
  const copia = value => value === undefined ? undefined : structuredClone(value);
  const nomError = name => Object.assign(new Error(name), { name });
  const ordered = files => [...files.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, value]) => copia(value));

  function transaction(base, names, mode) {
    const scope = Array.isArray(names) ? names : [names];
    for (const name of scope) if (!base.stores.has(name)) throw nomError('NotFoundError');
    const operations = [];
    let working, active = false, done = false, scheduled = false, writes = 0;
    const tx = { error: null, mode };
    const finish = () => {
      if (done || !active) return;
      if (control.pausaCommit && !tx.error) { pendents.add(finish); return; }
      done = true; pendents.delete(finish);
      if (tx.error) { registre.aborts++; tx.onabort?.({ target: tx }); }
      else {
        if (mode === 'readwrite') for (const [name, files] of working) base.stores.get(name).files = files;
        registre.commits++; tx.oncomplete?.({ target: tx });
      }
      base.busy = false; base.queue.shift()?.();
    };
    const schedule = () => {
      if (scheduled || !active || done) return;
      scheduled = true;
      setTimeout(() => { scheduled = false; if (tx.error || !operations.length) finish(); else run(); }, 0);
    };
    const run = () => {
      if (!active || done || tx.error) { schedule(); return; }
      while (operations.length && !tx.error) {
        const { request, action } = operations.shift();
        try { request.result = action(); request.onsuccess?.({ target: request }); }
        catch (error) { request.error = error; tx.error = error; request.onerror?.({ target: request }); tx.onerror?.({ target: request }); }
      }
      schedule();
    };
    const request = action => {
      const result = {};
      if (done) throw nomError('TransactionInactiveError');
      operations.push({ request: result, action });
      if (active) queueMicrotask(run);
      return result;
    };
    tx.abort = () => { if (done) throw nomError('InvalidStateError'); tx.error ||= nomError('AbortError'); schedule(); };
    tx.objectStore = name => {
      if (!scope.includes(name)) throw nomError('NotFoundError');
      const store = base.stores.get(name);
      const files = () => working.get(name);
      const change = fn => request(() => {
        if (mode !== 'readwrite') throw nomError('ReadOnlyError');
        if (control.errorEscriptura && ++writes === control.fallaEscriptura) throw control.errorEscriptura;
        return fn();
      });
      return {
        get: key => request(() => copia(files().get(key))),
        getAll: () => request(() => ordered(files())),
        put: (value, key = value?.[store.keyPath]) => {
          const saved = copia(value);
          return change(() => { if (key === undefined) throw nomError('DataError'); files().set(key, saved); return key; });
        },
        delete: key => change(() => { files().delete(key); }),
        clear: () => change(() => { files().clear(); }),
        index: index => ({ getAll: value => request(() => ordered(files()).filter(row => value == null || row[store.indexes.get(index)] === value)) })
      };
    };
    const start = () => {
      base.busy = true; active = true;
      working = new Map(scope.map(name => [name, new Map([...base.stores.get(name).files].map(([key, value]) => [key, copia(value)]))]));
      queueMicrotask(run); schedule();
    };
    if (base.busy) base.queue.push(start); else start();
    return tx;
  }

  const idb = { open(name, version = 1) {
    const request = {};
    setTimeout(() => {
      if (control.errorObrir) { request.error = control.errorObrir; request.onerror?.(); return; }
      let base = bases.get(name);
      if (base && version < base.version) { request.error = nomError('VersionError'); request.onerror?.(); return; }
      if (!base) { base = { version: 0, stores: new Map(), busy: false, queue: [] }; bases.set(name, base); }
      let closed = false;
      const db = {
        objectStoreNames: { contains: store => base.stores.has(store) },
        createObjectStore(store, { keyPath } = {}) {
          const definition = { keyPath, indexes: new Map(), files: new Map() };
          base.stores.set(store, definition);
          return { indexNames: { contains: index => definition.indexes.has(index) }, createIndex: (index, field) => definition.indexes.set(index, field) };
        },
        transaction: (stores, mode = 'readonly') => transaction(base, stores, mode),
        close() { if (!closed) { closed = true; registre.obertes--; } }
      };
      registre.obertes++; request.result = db;
      if (version > base.version) {
        base.version = version;
        request.transaction = { objectStore: store => {
          const definition = base.stores.get(store);
          return { indexNames: { contains: index => definition.indexes.has(index) }, createIndex: (index, field) => definition.indexes.set(index, field) };
        } };
        request.onupgradeneeded?.();
      }
      request.onsuccess?.();
    }, 0);
    return request;
  } };
  return { idb, bases, control, registre,
    repren() { control.pausaCommit = false; for (const finish of [...pendents]) finish(); },
    files: (name, store) => ordered(bases.get(name)?.stores.get(store)?.files ?? new Map())
  };
}
