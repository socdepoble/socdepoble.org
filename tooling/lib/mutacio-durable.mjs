/** Local, dependency-free durable replacements. No I/O on import.
 * The shared lock serializes cooperating writers. POSIX rename atomically publishes
 * one file, not a batch; portable Node has no kernel compare-and-swap/openat. A
 * noncooperating same-user writer can still race the last check and rename. Pending
 * evidence blocks subsequent writes after a crash/failure; recovery reviews bytes.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash, randomUUID} from 'node:crypto';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const HASH = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const RUNTIME = '.agents/runtime';
const JOURNAL = `${RUNTIME}/segell.log`;
const PENDING = `${RUNTIME}/mutation.pending.json`;
const EVIDENCE = '.agents/seal-transactions';
const nofollow = fs.constants.O_NOFOLLOW;
const exists = file => { try { return fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };

export function safePath(root, rel) {
  if (typeof rel !== 'string' || !rel || path.isAbsolute(rel) || rel.includes('\\') || /[\x00-\x1f\x7f]/.test(rel) || rel.split('/').some(s => !s || s === '.' || s === '..')) throw new Error(`Ruta no autoritzada: ${rel}`);
  const parts = rel.split('/'); let cursor = root;
  for (let i = 0; i < parts.length; i++) {
    cursor = path.join(cursor, parts[i]); const stat = exists(cursor);
    if (stat?.isSymbolicLink()) throw new Error(`Target amb symlink: ${rel}`);
    if (stat && (i < parts.length - 1 ? !stat.isDirectory() : !(stat.isDirectory() || (stat.isFile() && stat.nlink === 1)))) throw new Error(`Target no regular o hardlink: ${rel}`);
  }
  return cursor;
}
export function readState(root, rel) {
  const file = safePath(root, rel), stat = exists(file);
  if (!stat) return {hash: null, bytes: null, mode: 0o600, identity: null};
  if (!stat.isFile() || stat.nlink !== 1) throw new Error(`Target no regular o hardlink: ${rel}`);
  const fd = fs.openSync(file, fs.constants.O_RDONLY | nofollow);
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1 || stat.dev !== opened.dev || stat.ino !== opened.ino) throw new Error(`CAS d'identitat divergent: ${rel}`);
    const bytes = fs.readFileSync(fd), current = exists(safePath(root, rel));
    if (!current || opened.dev !== current.dev || opened.ino !== current.ino || current.nlink !== 1) throw new Error(`CAS d'identitat divergent: ${rel}`);
    return {hash: digest(bytes), bytes, mode: opened.mode & 0o777, identity: `${opened.dev}:${opened.ino}`};
  } finally { fs.closeSync(fd); }
}
export function syncDirectory(root, rel) {
  const dir = rel ? safePath(root, rel) : root;
  const fd = fs.openSync(dir, fs.constants.O_RDONLY | nofollow);
  try { if (!fs.fstatSync(fd).isDirectory()) throw new Error('Directori no regular'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}
export function ensureDirectory(root, rel) {
  const parts = rel.split('/');
  for (let i = 1; i <= parts.length; i++) {
    const item = parts.slice(0, i).join('/'), dir = safePath(root, item);
    if (!exists(dir)) {
      try { fs.mkdirSync(dir, {mode: 0o700}); } catch (e) { if (e.code !== 'EEXIST') throw e; }
      syncDirectory(root, parts.slice(0, i - 1).join('/'));
    }
    if (!fs.lstatSync(safePath(root, item)).isDirectory()) throw new Error(`Directori no regular: ${item}`);
  }
}
function assertCAS(root, file, before, identity) {
  const current = readState(root, file);
  if (current.hash !== before || (identity !== undefined && current.identity !== identity)) throw new Error(`CAS divergent: ${file}`);
  return current;
}
export function durableCreate(root, rel, content, mode = 0o600) {
  const file = safePath(root, rel);
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | nofollow, mode);
  try { fs.writeFileSync(fd, content); fs.fchmodSync(fd, mode); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  if (readState(root, rel).hash !== digest(content)) throw new Error(`Escriptura durable divergent: ${rel}`);
}
export function atomicReplace(root, {path: rel, before, content}, id = randomUUID()) {
  const previous = assertCAS(root, rel, before);
  const parent = path.posix.dirname(rel); if (parent !== '.') ensureDirectory(root, parent);
  const temp = `${rel}.${id}.tmp`; let created = false;
  try {
    durableCreate(root, temp, content, previous.mode); created = true;
    // Recheck after every potentially slow temp write/fsync, immediately before rename.
    assertCAS(root, rel, before, previous.identity);
    fs.renameSync(safePath(root, temp), safePath(root, rel)); created = false;
    syncDirectory(root, parent === '.' ? '' : parent);
    assertCAS(root, rel, digest(content));
  } finally {
    if (created) { fs.unlinkSync(safePath(root, temp)); syncDirectory(root, parent === '.' ? '' : parent); }
  }
}
const interrupted = entry => entry?.kind === 'reviewed-interrupted-mutation';
const recovery = entry => entry?.kind === 'reviewed-recovery';
const historical = entry => interrupted(entry) || recovery(entry);
const terminal = entry => entry.state === 'accepted' || recovery(entry) && entry.state === 'reviewed';
const text = value => typeof value === 'string' && !!value.trim();
const hash = value => typeof value === 'string' && HASH.test(value);
const uuid = value => typeof value === 'string' && UUID.test(value);
const fileProjection = files => files.map(({path, before, after}) => ({path, before, after}));
function validFiles(files) {
  if (!Array.isArray(files) || !files.length) throw new Error('Auditoria invàlida: fitxers');
  const seen = new Set();
  for (const f of files) {
    if (!f || typeof f.path !== 'string' || !f.path || /[\x00-\x1f\x7f]/.test(f.path)
      || f.path.split('/').some(p => !p || p === '.' || p === '..') || f.path.includes('\\') || path.isAbsolute(f.path)
      || seen.has(f.path) || !(f.before === null || hash(f.before)) || !hash(f.after)) throw new Error('Auditoria invàlida: CAS');
    seen.add(f.path);
  }
}
function validRecord(entry) {
  const states = interrupted(entry) ? ['reviewed-recovery', 'accepted']
    : recovery(entry) ? ['prepared', 'verified', 'reviewed'] : ['prepared', 'verified', 'accepted', 'failed'];
  if (!entry || !uuid(entry.id) || !states.includes(entry.state)) throw new Error('Auditoria invàlida: id/estat');
  if (entry.kind === 'explicit-reconciliation') {
    if (!text(entry.reason) || !hash(entry.beforeSeal) || !hash(entry.afterSeal)) throw new Error('Auditoria invàlida: reconciliació');
  } else validFiles(entry.files);
  if (historical(entry)) {
    const origin = interrupted(entry) ? entry.recovers : entry.originalMutation;
    if (!text(entry.reason) || !uuid(origin) || origin === entry.id) throw new Error('Auditoria invàlida: origen/motiu històric');
    if (interrupted(entry)) {
      if (entry.schema !== undefined || !hash(entry.beforeSeal) || !hash(entry.afterSeal)
        || !uuid(entry.session) || entry.claim !== `${entry.session}:governance-write` || !text(entry.operationId)
        || !hash(entry.planHash) || !hash(entry.reviewSha256) || !text(entry.reviewedAt) || !Number.isFinite(Date.parse(entry.reviewedAt))
        || !entry.manifest || typeof entry.manifest !== 'object' || Array.isArray(entry.manifest) || !Object.keys(entry.manifest).length) throw new Error('Auditoria invàlida: interrupció revisada');
      validFiles(Object.entries(entry.manifest).map(([path, after]) => ({path, before: null, after})));
      if (entry.files.some(f => Object.hasOwn(entry.manifest, f.path) && entry.manifest[f.path] !== f.after)) throw new Error('Manifest històric divergent');
    } else {
      if (entry.schema !== 'sdp.reviewed-recovery.evidence.v1' || entry.originalState !== 'failed'
        || entry.disposition !== 'targets-applied-seal-unchanged' || typeof entry.pendingRaw !== 'string'
        || !hash(entry.pendingSHA) || digest(entry.pendingRaw) !== entry.pendingSHA) throw new Error('Auditoria invàlida: recuperació revisada');
      let pending;
      try { pending = JSON.parse(entry.pendingRaw); } catch { throw new Error('Auditoria invàlida: pending històric'); }
      validFiles(pending.files);
      if (pending.id !== origin || pending.state !== 'prepared'
        || !uuid(entry.recoverySession) || !hash(entry.recoveryPlanHash) || !uuid(pending.session)
        || !text(pending.operationId) || !hash(pending.planHash) || pending.claim !== `${pending.session}:governance-write`
        || !hash(entry.sealBytesSHA) || !hash(entry.sealHash) || pending.beforeSeal !== entry.sealBytesSHA
        || entry.originalReceipt?.path !== `.sdp-reflex/sessions/${pending.session}.json`
        || !hash(entry.originalReceipt?.sha256) || entry.originalReceipt?.signatureValid !== true
        || entry.originalReceipt?.status !== 'consumed' || entry.originalReceipt?.claim !== 'completed'
        || JSON.stringify(fileProjection(pending.files)) !== JSON.stringify(fileProjection(entry.files))
        || entry.files.some(f => f.actual !== f.after)) throw new Error('Auditoria invàlida: origen/fitxers històrics divergents');
    }
  }
  if (entry.kind?.startsWith('frontissa-') && (!text(entry.reason) || !text(entry.actor) || !['inicia', 'aprova', 'retira'].includes(entry.action))) throw new Error('Auditoria invàlida: motiu/actor/acció');
}
const comparable = (entry, omitted = []) => JSON.stringify(Object.keys(entry).filter(k => !omitted.includes(k)).sort().map(k => [k, entry[k]]));
function validateAudit(root, inFlightAccepted = null) {
  let state;
  try { state = readState(root, JOURNAL); } catch (e) { throw new Error(`Traça no regular: ${e.message}`); }
  const histories = new Map(), accepted = new Map();
  if (state.bytes) {
    const text = state.bytes.toString('utf8');
    if (!text.endsWith('\n')) throw new Error('Traça d’auditoria incompleta');
    try {
      for (const line of text.trimEnd().split('\n')) {
        const entry = JSON.parse(line); validRecord(entry);
        const previous = histories.get(entry.id);
        if (previous) {
          if (comparable(previous, ['state', 'error', 'afterSeal']) !== comparable(entry, ['state', 'error', 'afterSeal'])
            || previous.afterSeal && previous.afterSeal !== entry.afterSeal) throw new Error('Identitat de transacció divergent');
          const allowed = interrupted(entry) ? {'reviewed-recovery': ['accepted'], accepted: []}
            : recovery(entry) ? {prepared: ['verified'], verified: ['reviewed'], reviewed: []}
              : {prepared: ['verified', 'failed'], verified: ['accepted', 'failed'], accepted: ['failed'], failed: []};
          if (!allowed[previous.state].includes(entry.state)) throw new Error('Seqüència de transacció invàlida');
        } else if (entry.state !== 'prepared' && !(entry.kind === 'explicit-reconciliation' && entry.state === 'accepted')
          && !(historical(entry) && (terminal(entry) || interrupted(entry) && entry.state === 'reviewed-recovery'))) throw new Error('Transacció sense preparació');
        histories.set(entry.id, entry);
        if (terminal(entry)) accepted.set(entry.id, entry);
      }
    } catch (e) { throw new Error(`Traça d’auditoria invàlida: ${e.message}`); }
  }
  const evidence = safePath(root, EVIDENCE), found = new Set();
  if (exists(evidence)) for (const name of fs.readdirSync(evidence)) {
    if (!UUID.test(name.slice(0, -5)) || !name.endsWith('.json')) throw new Error('Auditoria invàlida: nom d’evidència');
    try {
      const entry = JSON.parse(readState(root, `${EVIDENCE}/${name}`).bytes); validRecord(entry);
      if (`${entry.id}.json` !== name || !terminal(entry)) throw new Error('Evidència divergent');
      // Only this transaction may be between durable evidence and accepted journal.
      const logged = accepted.get(entry.id) || (inFlightAccepted?.id === entry.id ? inFlightAccepted : null);
      // Versioned historical review evidence may predate the unversioned runtime journal.
      // If its id is present, require the exact terminal journal record; never exempt modern mutations.
      if (logged ? comparable(logged) !== comparable(entry) : !historical(entry) || histories.has(entry.id)) throw new Error('Evidència deslligada del journal');
      const origin = histories.get(interrupted(entry) ? entry.recovers : entry.originalMutation);
      if (historical(entry) && origin && (origin.state !== 'failed'
        || JSON.stringify(fileProjection(origin.files)) !== JSON.stringify(fileProjection(entry.files)))) throw new Error('Origen històric divergent');
      found.add(entry.id);
    } catch (e) { throw new Error(`Auditoria invàlida: ${e.message}`); }
  }
  for (const id of accepted.keys()) if (!found.has(id)) throw new Error('Auditoria invàlida: evidència absent');
}

function journal(root, entry) {
  validRecord(entry); validateAudit(root, entry.state === 'accepted' ? entry : null);
  const prior = readState(root, JOURNAL), file = safePath(root, JOURNAL);
  const fd = fs.openSync(file, fs.constants.O_WRONLY | fs.constants.O_APPEND | fs.constants.O_CREAT | nofollow, 0o600);
  try {
    const opened = fs.fstatSync(fd);
    if (!opened.isFile() || opened.nlink !== 1 || (prior.identity && prior.identity !== `${opened.dev}:${opened.ino}`)) throw new Error('Traça no regular o concurrent');
    fs.writeFileSync(fd, `${JSON.stringify(entry)}\n`); fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  syncDirectory(root, RUNTIME); validateAudit(root);
}

/** Callers own authorization. All inputs are copied before the first await. */
export async function durableMutation(root, input, {metadata = {}, prepare = async () => ({}), verify = () => ({}), publish = () => {}} = {}) {
  root = fs.realpathSync(root);
  if (!Array.isArray(input) || !input.length) throw new Error('Mutació sense fitxers');
  const seen = new Set();
  const files = input.map(f => {
    safePath(root, f.path);
    if (seen.has(f.path) || typeof f.content !== 'string' || !(f.before === null || HASH.test(f.before))) throw new Error('Pla CAS invàlid o repetit');
    seen.add(f.path); return {path: f.path, before: f.before, content: f.content, after: digest(f.content)};
  });
  const record = {...structuredClone(metadata), id: randomUUID(), files: files.map(({path, before, after}) => ({path, before, after}))};
  if (historical(record)) throw new Error('Tipus històric reservat a evidència');
  const check = () => { for (const f of files) assertCAS(root, f.path, f.before); };
  const checkAfter = () => { for (const f of files) assertCAS(root, f.path, f.after); };
  check(); ensureDirectory(root, RUNTIME); ensureDirectory(root, EVIDENCE);
  const lockRel = `${RUNTIME}/mutation.lock`, lock = safePath(root, lockRel);
  const fd = fs.openSync(lock, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | nofollow, 0o600);
  const lockStat = fs.fstatSync(fd); let prepared = false;
  try {
    syncDirectory(root, RUNTIME);
    if (readState(root, PENDING).hash !== null) throw new Error('Operació incompleta: reconciliació requerida');
    validateAudit(root); check();
    const authorization = await prepare();
    const granted = structuredClone(authorization.metadata || {});
    if (Object.keys(granted).some(k => ['id', 'files', 'state'].includes(k))) throw new Error('Metadades reservades');
    Object.assign(record, granted);
    if (historical(record)) throw new Error('Tipus històric reservat a evidència');
    check(); validRecord({...record, state: 'prepared'}); validateAudit(root);
    durableCreate(root, PENDING, `${JSON.stringify({...record, state: 'prepared'})}\n`); prepared = true;
    syncDirectory(root, RUNTIME); journal(root, {...record, state: 'prepared'});
    for (const f of files) atomicReplace(root, f, record.id);
    checkAfter(); Object.assign(record, verify());
    journal(root, {...record, state: 'verified'});
    await authorization.complete?.();
    checkAfter();
    const final = verify();
    for (const key of Object.keys(final)) if (record[key] !== final[key]) throw new Error('CAS final divergent');
    validateAudit(root);
    const accepted = {...record, state: 'accepted'};
    durableCreate(root, `${EVIDENCE}/${record.id}.json`, `${JSON.stringify(accepted, null, 2)}\n`); syncDirectory(root, EVIDENCE);
    journal(root, accepted); checkAfter(); publish(accepted); checkAfter(); validateAudit(root);
    fs.unlinkSync(safePath(root, PENDING)); syncDirectory(root, RUNTIME);
    return {valid: true, id: record.id, files: record.files, ...final};
  } catch (error) {
    // No rollback: a crash or any late failure leaves the prepared pre/post hashes.
    if (prepared) try { journal(root, {...record, state: 'failed', error: error.message}); } catch { /* pending blocks recovery */ }
    throw error;
  } finally {
    fs.closeSync(fd);
    const current = exists(safePath(root, lockRel));
    if (current?.dev === lockStat.dev && current?.ino === lockStat.ino) { fs.unlinkSync(lock); syncDirectory(root, RUNTIME); }
  }
}
