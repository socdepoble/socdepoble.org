/* Diari de retirada: només identificadors, cap cos ni credencial. Els ACK es
   conserven; els errors, inclosos 403/404, conserven la voluntat i el retard.
   Gauntlet R22 (dades-02, notes-02) · Una sola excepció, que no és cap
   rebuig sinó l'absència d'objecte: una fila de nota SENSE acte (publicacioId
   null, les que encuaven les versions anteriors per a notes mai publicades)
   que el servidor contesta amb SDP-MUR-REVISION (cap acte en eixa revisió) o
   SDP-MUR-OWNER (la nota ja no hi és i no hi ha cap acte). No hi ha res a
   retirar i cap reintent no ho canviarà: la fila s'esborra, no compta com a
   pendent i no impedix l'esdeveniment de cua buida. */
const DB = 'sdp-copublicacio-mur-r21';
const STORE = 'revocacions';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const error = text => Object.assign(new Error(text), { codi: 'MUR_REVOCACIO_PERSISTENCIA' });
const canvi = () => new DOMException('La identitat o el backend han canviat.', 'AbortError');
/* Els codis estructurats (runtime.request els llig del missatge) que, per a una nota sense acte, volen dir «res a retirar». */
const SENSE_ACTE = new Set(['SDP-MUR-REVISION', 'SDP-MUR-OWNER']);
const abastDe = value => {
  if (!value || ['backend', 'tenant', 'user'].some(k => typeof value[k] !== 'string' || !value[k] || value[k].length > 2048)) throw error('Falta l’àmbit de la revocació persistent.');
  return JSON.stringify([value.backend, value.tenant, value.user]);
};
export function creaCuaRevocacionsMur({ indexedDB = globalThis.indexedDB, obteAbast, envia,
  ara = Date.now, nouId = () => globalThis.crypto.randomUUID() } = {}) {
  if (typeof obteAbast !== 'function' || typeof envia !== 'function') throw new TypeError('Falta el port de revocació.');
  const capture = () => abastDe(obteAbast());
  const check = scope => { if (capture() !== scope) throw canvi(); };
  async function transaccio(mode, feina) {
    if (!indexedDB) throw error('No hi ha emmagatzematge persistent per a la revocació.');
    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 2);
      req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'key' }); };
      req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      req.onblocked = () => reject(error('La revocació persistent està bloquejada.'));
    });
    db.onversionchange = () => db.close();
    try { return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode); let result, cause;
      const abort = e => { cause = e; tx.abort(); };
      tx.oncomplete = () => resolve(result);
      tx.onabort = tx.onerror = () => reject(cause || tx.error || error('Ha fallat la revocació persistent.'));
      try { feina(tx.objectStore(STORE), v => { result = v; }, abort); } catch(e) { abort(e); }
    }); } finally { db.close(); }
  }
  function descriptor(id, { tipus = 'publicacio', revision = null, publicacioId = null } = {}) {
    if (!UUID.test(id) || !['nota', 'publicacio'].includes(tipus) || (tipus === 'nota' ? !Number.isSafeInteger(revision) || revision < 0 : revision !== null)
      || (publicacioId !== null && (!UUID.test(publicacioId) || tipus !== 'nota'))) throw new TypeError('Intent de revocació invàlid.');
    const scope = capture(); id = id.toLowerCase(); publicacioId = publicacioId?.toLowerCase() ?? null;
    return { key: JSON.stringify([scope, id, tipus, revision, ...(publicacioId ? [publicacioId] : [])]), scope, id, tipus, revision, publicacioId };
  }
  async function encua(id, options = {}) {
    const d = descriptor(id, options);
    await transaccio('readwrite', (store, done, abort) => {
      const req = store.get(d.key); req.onsuccess = () => { try {
        check(d.scope);
        const row = req.result;
        if (row) {
          // Upgrade rejected R21.6 rows. An ACK can never be rearmed.
          if (row.pending || row.rejected) store.put({ ...row, ...d, pending: true, rejected: false,
            nextRetryAt: options.reintentaRebutjada ? 0 : row.nextRetryAt ?? 0 });
          return done();
        }
        const count = store.count(); count.onsuccess = () => { try {
          check(d.scope); if (count.result >= 4096) throw error('El diari de retirada està ple.');
          store.add({ ...d, pending: true, attempt: 0, nextRetryAt: 0 });
        } catch(e) { abort(e); } };
      } catch(e) { abort(e); } };
    }); check(d.scope);
  }
  async function files(scope) {
    const rows = await transaccio('readonly', (store, done) => { const r = store.getAll(); r.onsuccess = () => done(r.result.filter(r => r.scope === scope)); });
    check(scope); return rows;
  }
  async function estat(id, options = {}) {
    const d = descriptor(id, options); const rows = await files(d.scope);
    const row = rows.find(r => r.key === d.key);
    return row ? { pendent: row.pending === true || row.rejected === true, seguentIntent: row.nextRetryAt ?? 0 } : null;
  }
  async function estaRetirada(id) {
    const scope = capture(); return (await files(scope)).some(r => r.id === String(id).toLowerCase() || r.publicacioId === String(id).toLowerCase());
  }
  async function drena() {
    const scope = capture(); const rows = await files(scope), errors = [];
    for (const candidate of rows) {
      if (!candidate.pending && !candidate.rejected) continue;
      const row = await transaccio('readwrite', (store, done, abort) => {
        const req = store.get(candidate.key); req.onsuccess = () => { try {
          check(scope); const r = req.result, now = ara();
          if (!r || (!r.pending && !r.rejected) || (r.nextRetryAt ?? 0) > now || (r.leaseUntil ?? 0) > now) return done(null);
          if (!Number.isSafeInteger(r.attempt ?? 0) || (r.attempt ?? 0) < 0) throw error('Generació de retirada no vàlida.');
          const next = { ...r, pending: true, rejected: false, attempt: Math.min((r.attempt ?? 0) + 1, 1000000), lease: nouId(), leaseUntil: now + 60000 };
          delete next.rejection; delete next.rejectionStatus; store.put(next); done(next);
        } catch(e) { abort(e); } };
      });
      if (!row) continue;
      let failure;
      try { check(scope); await envia(row.id, { tipus: row.tipus, revision: row.revision, publicacioId: row.publicacioId ?? null }); }
      catch(e) { failure = e; }
      check(scope);
      const accepted = await transaccio('readwrite', (store, done, abort) => {
        const req = store.get(row.key); req.onsuccess = () => { try {
          check(scope); const current = req.result;
          if (!current || current.scope !== row.scope || current.id !== row.id || current.tipus !== row.tipus || current.revision !== row.revision
            || current.publicacioId !== row.publicacioId || current.attempt !== row.attempt || current.lease !== row.lease) return done(false);
          if (failure && current.tipus === 'nota' && current.publicacioId == null && SENSE_ACTE.has(failure.codi)) {
            store.delete(row.key); done(true); return;
          }
          const next = { ...current, pending: Boolean(failure), rejected: false, lease: null, leaseUntil: 0,
            nextRetryAt: failure ? ara() + Math.min(300000, 1000 * 2 ** Math.min(row.attempt - 1, 9)) : 0 };
          // Persist structured status only, never a provider message/body.
          if (failure) next.lastStatus = Number.isInteger(failure.status) ? failure.status : null;
          else delete next.lastStatus;
          store.put(next); done(true);
        } catch(e) { abort(e); } };
      });
      check(scope); if (!accepted) throw canvi();
      if (failure && !(row.tipus === 'nota' && row.publicacioId == null && SENSE_ACTE.has(failure.codi))) errors.push(failure);
    }
    const pending = (await files(scope)).filter(r => r.pending || r.rejected);
    const result = { pendents: pending.length, seguentIntent: pending.length ? Math.min(...pending.map(r => Math.max(r.nextRetryAt ?? 0, r.leaseUntil ?? 0))) : null };
    if (errors.length) { errors[0].revocacioPendent = true; errors[0].seguentIntent = result.seguentIntent; throw errors[0]; }
    return result;
  }
  return Object.freeze({ encua, drena, estaRetirada, estat });
}
