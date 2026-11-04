/** FEDI-02 · Serveis de dispositiu opt-in; cap ACK ni publicació remota. */
import { creaMagatzemAtomicRural, creaPersistenciaLocalRural, copiaJsonRural, normalitzaAbastRural } from './persistenciaLocalRural.js';
import { creaCuaOperacionsOffline, verifyOfflineQueueChain } from './cuaOperacionsOffline.js';
import { consolidaOperacionsEmergencia, normalitzaOperacioEmergencia, exportaDeltaEmergenciaRural, importaDeltaEmergenciaRural } from './pontEmergenciaRural.js';
import { calculaPlaSincronitzacioVault, exportaPaquetVaultFallback, importaPaquetVaultFallback, sincronitzaAmbDirectoryHandle, sincronitzaCrdtAmbDirectoryHandle } from './sincronitzadorCarpetaLocal.js';
import { estatCrdtRuralBuit, normalitzaCrdtRural, fusionaCrdtRural, projectaCrdtRural, baseNotaCrdtRural, canviaCrdtRural } from './crdtRural.js';
import { canonitzaJsonJcs, sha256Hex, codificaBase58Btc } from './federacio/portabilitatFediversity.js';

const MAX_FITXER = 4 * 1024 * 1024;
const DISPOSITIU = 'mode-rural:dispositiu';
const COLLECCIONS = 'colleccions';
const CLAU_CRDT = 'mode-rural:crdt';
const ESQUEMA_CRDT_PERSISTIT = 'sdp.rural.crdt-state.v1';
export const ESQUEMA_PAQUET_CRDT_RURAL = 'sdp.rural.crdt-bundle.v1';
const AUTOR_LOCAL = 'Dispositiu local';
const errorRural = (code, message) => Object.assign(new Error(message), { code });
const bytes = value => new TextEncoder().encode(JSON.stringify(value)).length;
export function lligJsonRural(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_FITXER) throw new Error('El fitxer rural supera els 4 MB.');
  try { return copiaJsonRural(JSON.parse(text), MAX_FITXER); }
  catch { throw new Error('El fitxer rural no és un JSON vàlid.'); }
}

/** Identificador autocontingut d'una clau efímera; no inventa un servidor.
 * https://w3c-ccg.github.io/did-key-spec/#did-key-identifier-syntax */
async function clausDeDispositiu(crypto) {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  if (raw.length !== 32) throw new Error('Clau de dispositiu Ed25519 invàlida.');
  const multikey = new Uint8Array(34); multikey.set([0xed, 0x01]); multikey.set(raw, 2);
  const fingerprint = `z${codificaBase58Btc(multikey)}`;
  const id = `did:key:${fingerprint}`;
  return { id, idClau: `${id}#${fingerprint}`, publicKeyJwk: await crypto.subtle.exportKey('jwk', pair.publicKey), privateKeyJwk: await crypto.subtle.exportKey('jwk', pair.privateKey) };
}

export async function creaSessioRural({ abast: abastEntrada, municipi, crypto = globalThis.crypto, ara = Date.now,
  maxOperacionsCua = 1000, maxBytesCua = MAX_FITXER, onInvalidada = () => {}, onCanvi = () => {}, comprovaAbast = () => {}, BroadcastChannel = globalThis.BroadcastChannel, crdt = null, ...motor } = {}) {
  const abast = normalitzaAbastRural(abastEntrada);
  if (typeof municipi !== 'string' || !municipi.trim() || !crypto?.randomUUID || !crypto?.subtle || typeof onInvalidada !== 'function' || typeof onCanvi !== 'function' || typeof comprovaAbast !== 'function') throw new Error('Falten el poble o WebCrypto per al mode rural.');
  if (crdt !== null && typeof crdt !== 'boolean') throw new Error('El mode CRDT ha de ser explícit.');
  const usaCrdt = crdt === true || motor.motor === 'opfs';
  // Replica d'escriptor única per sessió/pestanya, mai el dispositiu durable compartit.
  const replicaCrdt = usaCrdt ? crypto.randomUUID() : null;
  let comptadorCrdt = 0;
  let obert = true, store, persistencia, cua, dispositiu, claus, canal;
  const controller = new AbortController();
  const config = { signal: controller.signal };
  const vigent = () => {
    if (!obert) throw new Error('La sessió rural s’ha tancat.');
    try { comprovaAbast(); } catch (cause) { close(); onInvalidada(cause); throw cause; }
  };
  const abastActiu = () => { vigent(); return true; };
  const keyCua = () => `offline-queue:${dispositiu.id}`;
  function tancaMotors() { cua?.close(); store?.close(); persistencia?.close(); }
  function obriMotors(d) {
    tancaMotors(); dispositiu = d;
    const generacio = { clau: DISPOSITIU, id: d.id };
    store = creaMagatzemAtomicRural({ ...motor, abast, generacio, comprovaAbast: vigent });
    persistencia = creaPersistenciaLocalRural({ ...motor, abast, crypto, ara, generacio, comprovaAbast: vigent });
    const storageCua = usaCrdt ? { abast: store.abast, read: (...args) => store.read(...args),
      compareAndSwap: (key, expected, next, options) => {
        const capturat = copiaJsonRural(next, maxBytesCua);
        return store.actualitzaLot([CLAU_CRDT, key], states => {
          if ((states[key]?.revision ?? 0) !== expected) return { next: {}, value: false };
          if (capturat.revision !== expected + 1) throw errorRural('RURAL_CRDT_CAS_INVALID', 'Revisió de cua CRDT invàlida.');
          // Valida també el log que una altra pestanya pot haver importat
          // mentre WebCrypto calculava el hash de la intenció de cua.
          projectaCrdtRural(unificaCrdt(states[CLAU_CRDT], capturat));
          return { next: { [key]: capturat }, value: true };
        }, options);
      } } : store;
    cua = creaCuaOperacionsOffline({ abast, store: storageCua, nodeId: d.id, crypto, ara, maxOperations: maxOperacionsCua, maxBytes: maxBytesCua, isScopeActive: abastActiu });
  }
  const inicial = creaMagatzemAtomicRural({ ...motor, abast, comprovaAbast: vigent });
  try {
    let d = await inicial.read(DISPOSITIU, config);
    for (let i = 0; !d && i < 3; i += 1) {
      await inicial.compareAndSwap(DISPOSITIU, 0, { revision: 1, id: crypto.randomUUID() }, config);
      d = await inicial.read(DISPOSITIU, config);
    }
    if (!d?.id) throw new Error('No s’ha pogut confirmar el dispositiu rural.');
    obriMotors(d);
  } catch (error) { tancaMotors(); throw error; }
  finally { inicial.close(); }

  async function comprovaGeneracio() {
    vigent();
    try { await store.read(DISPOSITIU, config); }
    catch (e) {
      if (e.code === 'SDP-RURAL-GENERACIO') { close(); onInvalidada(); }
      throw e;
    }
    vigent();
  }
  if (typeof BroadcastChannel === 'function') {
    try {
      canal = new BroadcastChannel(`sdp-rural-${sha256Hex(canonitzaJsonJcs(abast))}`);
      canal.unref?.();
      canal.onmessage = () => { if (obert) void comprovaGeneracio().then(() => { if (obert && usaCrdt) onCanvi(); }).catch(() => {}); };
    } catch { /* El guard transaccional continua actiu sense canal. */ }
  }
  function notificaGeneracio() { try { canal?.postMessage({ tipus: 'generacio' }); } catch { /* guard durable autoritatiu */ } }
  function notificaCanvi() { try { canal?.postMessage({ tipus: 'canvi' }); } catch { /* el consumidor pot refrescar explícitament */ } }

  function privada(op) {
    // Neteja també notes escrites amb la primera versió, abans d'exportar.
    return op.autor === abast.persona ? normalitzaOperacioEmergencia({ ...op, autor: AUTOR_LOCAL }) : op;
  }
  function alertaDe(nota) {
    return normalitzaOperacioEmergencia({ id: nota.id, entitatId: nota.id, tipus: 'nota_camp', prioritat: nota.prioritat || 'normal', municipi,
      autor: AUTOR_LOCAL, creatEl: nota.updatedAt, payload: { title: nota.title, content: nota.content } });
  }
  function crdtDe(raw) {
    if (raw === null || raw === undefined) return estatCrdtRuralBuit();
    const state = copiaJsonRural(raw, MAX_FITXER);
    if (state.schema !== ESQUEMA_CRDT_PERSISTIT || !Number.isSafeInteger(state.revision) || state.revision < 1
      || Object.keys(state).sort().join('|') !== ['data', 'revision', 'schema'].join('|')) throw errorRural('RURAL_CRDT_INVALID', 'Estat CRDT rural invàlid.');
    return normalitzaCrdtRural(state.data);
  }
  function estatCrdtAmb(raw, data) { return { schema: ESQUEMA_CRDT_PERSISTIT, revision: (raw?.revision ?? 0) + 1, data: normalitzaCrdtRural(data) }; }
  function unificaCrdt(raw, pending) {
    let state = crdtDe(raw);
    for (const op of pending.entries) {
      if (op.resource !== 'rural.crdt' || op.action !== 'update' || Object.keys(op.changes).join('|') !== 'delta'
        || op.changes.delta?.ops?.length !== 1 || op.changes.delta.ops[0].id !== op.recordId) throw errorRural('RURAL_DIARI_ALIE', 'La cua no conté una delta CRDT rural.');
      state = fusionaCrdtRural(state, op.changes.delta);
    }
    return state;
  }
  function colsAmbCrdt(cols, data) {
    const projected = projectaCrdtRural(data), ids = new Set(data.ops.map(op => op.id));
    const alertes = new Map(cols.bans.filter(op => !ids.has(op.entitatId)).map(privada).map(op => [op.sha256Operacio, op]));
    for (const nota of projected.notes) { const alerta = alertaDe(nota); alertes.set(alerta.sha256Operacio, alerta); }
    return { ...cols, notes: projected.notes, bans: [...alertes.values()] };
  }
  function projecta(raw, pending) {
    const cols = persistencia.colleccionsDe(raw);
    const notes = new Map(cols.notes.map(n => [n.id, n]));
    const alertes = new Map(cols.bans.map(privada).map(n => [n.sha256Operacio, n]));
    for (const op of pending.entries) {
      if (op.resource !== 'rural.notes' || op.action !== 'create') throw errorRural('RURAL_DIARI_ALIE', 'El diari conté operacions d’un altre servei.');
      const antiga = notes.get(op.recordId);
      if (!antiga || antiga._ruralQueueNode && antiga._ruralQueueNode !== pending.nodeId || op.seq > (antiga._ruralQueueSeq || 0)) notes.set(op.recordId, { ...op.changes, id: op.recordId });
      const alerta = alertaDe({ ...op.changes, id: op.recordId }); alertes.set(alerta.sha256Operacio, alerta);
    }
    return { ...cols, notes: [...notes.values()], bans: [...alertes.values()] };
  }
  async function captura() {
    vigent();
    const absent = await cua.peekOfflineQueue(config);
    let raw;
    const qkey = keyCua();
    await store.actualitzaLot([DISPOSITIU, COLLECCIONS, qkey, ...(usaCrdt ? [CLAU_CRDT] : [])], states => { raw = states; return { next: {}, value: true }; }, config);
    const pending = raw[qkey] || absent;
    const cadena = await verifyOfflineQueueChain(pending, { crypto });
    if (!cadena.valid) throw new Error('La cadena de la cua rural no és vàlida.');
    await comprovaGeneracio();
    if (!usaCrdt) return { raw, pending, cadena, cols: projecta(raw[COLLECCIONS], pending), qkey };
    const data = unificaCrdt(raw[CLAU_CRDT], pending);
    const cols = persistencia.colleccionsDe(raw[COLLECCIONS]);
    if (!raw[CLAU_CRDT] && cols.notes.length) throw errorRural('RURAL_CRDT_MIGRACIO_REQUERIDA', 'Este espai conté notes antigues; prepara una còpia abans de canviar el perfil.');
    return { raw, pending, cadena, cols: colsAmbCrdt(cols, data), crdt: data, qkey };
  }
  function estatDe(s) {
    return { notes: s.cols.notes, bans: s.cols.bans, ...(usaCrdt ? { crdt: true, motor: motor.motor ?? 'indexeddb',
      notesEsborrades: projectaCrdtRural(s.crdt).esborrades, dependenciesPendents: projectaCrdtRural(s.crdt).pendents } : {}), pendents: s.pending.entries.length, sequenciaCua: s.pending.nextSeq - 1,
      cadenaValida: true, bytesCua: bytes(s.pending), limitBytesCua: maxBytesCua, limitOperacionsCua: maxOperacionsCua };
  }
  async function estat() { return estatDe(await captura()); }
  function desaFusioNotes(notes, sequenciaCua, nodeId) {
    return persistencia.actualitza('notes', guardades => {
      const fusio = calculaPlaSincronitzacioVault({ notesApp: guardades, notesCarpeta: notes });
      return fusio.notesResultants.map(n => ({ ...n, _ruralQueueNode: nodeId, _ruralQueueSeq: Math.max(sequenciaCua,
        guardades.find(g => g.id === n.id && g._ruralQueueNode === nodeId)?._ruralQueueSeq || 0) }));
    }, config);
  }
  async function desaNota(entrada) {
    if (usaCrdt) return desaNotaCrdt(entrada);
    const { title, content, prioritat = 'normal' } = entrada;
    vigent();
    if (typeof title !== 'string' || !title.trim() || title.length > 200 || typeof content !== 'string' || !content.trim() || content.length > 20000) throw new Error('Cal un títol i una nota de camp de fins a 20.000 caràcters.');
    const snap = await captura();
    const id = crypto.randomUUID();
    const nota = { id, slug: id, title: title.trim(), content, prioritat, updatedAt: new Date(ara()).toISOString(), folderId: 'camp', tags: [] };
    const alerta = alertaDe(nota);
    // Capacitat del destí comprovada abans de confirmar la intenció durable.
    persistencia.estatAmbColleccions(snap.raw[COLLECCIONS], { ...snap.cols, notes: [...snap.cols.notes, nota], bans: [...snap.cols.bans, alerta] });
    if (snap.pending.entries.length >= maxOperacionsCua || bytes(snap.pending) + bytes(nota) * 2 + 4096 > maxBytesCua) {
      throw errorRural('RURAL_DIARI_PLE', 'Consolida el diari local o prepara una còpia abans de continuar.');
    }
    await cua.enqueueOfflineMutation({ resource: 'rural.notes', recordId: id, action: 'create', changes: nota }, config);
    return estat();
  }
  const exigeixCrdt = () => { vigent(); if (!usaCrdt) throw errorRural('RURAL_CRDT_REQUIRED', 'Activa el perfil CRDT per a editar amb causalitat.'); };
  function notaPerCanvi(id, title, content, base, prioritat) {
    const projected = projectaCrdtRural(base), antiga = [...projected.notes, ...projected.esborrades].find(n => n.id === id);
    return { id, title, content, slug: antiga?.slug ?? id, folderId: antiga?.folderId ?? 'camp', tags: antiga?.tags ?? [],
      prioritat: prioritat ?? antiga?.prioritat ?? 'normal', updatedAt: new Date(ara()).toISOString() };
  }
  async function desaDeltaCrdt(delta, snap) {
    const data = fusionaCrdtRural(snap.crdt, delta);
    persistencia.estatAmbColleccions(snap.raw[COLLECCIONS], colsAmbCrdt(snap.cols, data));
    if (snap.pending.entries.length >= maxOperacionsCua || bytes(snap.pending) + bytes(delta) * 2 + 4096 > maxBytesCua) throw errorRural('RURAL_DIARI_PLE', 'El diari local està ple; consolida’l o prepara una còpia.');
    // La versió de l'envelope de cua només ordena el diari. La causalitat
    // del document és exclusivament el DAG de la delta, no eixe comptador.
    await cua.enqueueOfflineMutation({ resource: 'rural.crdt', recordId: delta.ops[0].id, action: 'update', changes: { delta } }, config);
    notificaCanvi(); return estat();
  }
  async function desaNotaCrdt(entrada) {
    exigeixCrdt(); const value = copiaJsonRural(entrada, 128 * 1024);
    if (Object.keys(value).some(k => !['title', 'content', 'prioritat'].includes(k))) throw errorRural('RURAL_CRDT_INVALID', 'Camps de nota invàlids.');
    const snap = await captura(), id = crypto.randomUUID(), base = estatCrdtRuralBuit();
    const nota = notaPerCanvi(id, value.title, value.content, base, value.prioritat);
    return desaDeltaCrdt(canviaCrdtRural(base, { id, replica: replicaCrdt, comptador: ++comptadorCrdt, nota }), snap);
  }
  async function preparaEdicio(id) {
    exigeixCrdt(); if (typeof id !== 'string') throw errorRural('RURAL_CRDT_INVALID', 'ID de nota invàlid.');
    const snap = await captura(), projected = projectaCrdtRural(snap.crdt);
    const nota = [...projected.notes, ...projected.esborrades].find(n => n.id === id);
    if (!nota) throw errorRural('RURAL_CRDT_NOTA_ABSENT', 'Esta nota no està disponible.');
    return copiaJsonRural({ nota, base: baseNotaCrdtRural(snap.crdt, id) }, MAX_FITXER);
  }
  function comprovaBase(base, actual, id) {
    const capturada = normalitzaCrdtRural(base), originals = new Map(actual.ops.map(op => [`${op.replica}:${op.comptador}`, op]));
    if (capturada.ops.some(op => op.id !== id || !originals.has(`${op.replica}:${op.comptador}`)
      || canonitzaJsonJcs(op) !== canonitzaJsonJcs(originals.get(`${op.replica}:${op.comptador}`)))) throw errorRural('RURAL_CRDT_BASE_ALIENA', 'La base d’edició no pertany a este document local.');
    return capturada;
  }
  async function canviaNota(entrada, elimina) {
    exigeixCrdt(); const value = copiaJsonRural(entrada, MAX_FITXER);
    if (Object.keys(value).some(k => !(elimina ? ['id', 'base'] : ['id', 'title', 'content', 'base', 'resol', 'metadades']).includes(k))) throw errorRural('RURAL_CRDT_INVALID', 'Camps d’edició invàlids.');
    if (value.metadades !== undefined && (!value.metadades || typeof value.metadades !== 'object' || Array.isArray(value.metadades)
      || Object.keys(value.metadades).some(k => !['slug', 'folderId', 'tags', 'prioritat', 'updatedAt'].includes(k)))) throw errorRural('RURAL_CRDT_INVALID', 'Metadades d’edició invàlides.');
    const snap = await captura(), base = comprovaBase(value.base, snap.crdt, value.id);
    const options = { id: value.id, replica: replicaCrdt, comptador: ++comptadorCrdt, elimina,
      ...(elimina ? {} : { nota: { ...notaPerCanvi(value.id, value.title, value.content, base), ...(value.metadades ?? {}) }, ...(value.resol ? { resol: value.resol } : {}) }) };
    return desaDeltaCrdt(canviaCrdtRural(base, options), snap);
  }
  const editaNota = entrada => canviaNota(entrada, false);
  const eliminaNota = entrada => canviaNota(entrada, true);
  async function importaCrdt(entrada) {
    exigeixCrdt(); const value = copiaJsonRural(entrada, MAX_FITXER);
    if (value.schema !== ESQUEMA_PAQUET_CRDT_RURAL || Object.keys(value).sort().join('|') !== ['crdt', 'createdAt', 'schema', 'sha256'].join('|')
      || typeof value.createdAt !== 'string' || value.sha256 !== sha256Hex(canonitzaJsonJcs(value.crdt))) throw errorRural('RURAL_CRDT_PACKAGE_REQUIRED', 'Cal un paquet CRDT rural amb integritat vàlida.');
    const incoming = normalitzaCrdtRural(value.crdt);
    for (let intent = 0; intent < 8; intent++) {
      const snap = await captura(), data = fusionaCrdtRural(snap.crdt, incoming), cols = colsAmbCrdt(snap.cols, data);
      if (canonitzaJsonJcs(data) === canonitzaJsonJcs(snap.crdt)) return estat();
      const canviat = await store.actualitzaLot([DISPOSITIU, COLLECCIONS, CLAU_CRDT, snap.qkey], states => {
        if ((states[snap.qkey]?.revision ?? 0) !== (snap.raw[snap.qkey]?.revision ?? 0)
          || (states[CLAU_CRDT]?.revision ?? 0) !== (snap.raw[CLAU_CRDT]?.revision ?? 0)
          || (states[COLLECCIONS]?.revision ?? 0) !== (snap.raw[COLLECCIONS]?.revision ?? 0)) return { next: {}, value: false };
        return { next: { [CLAU_CRDT]: estatCrdtAmb(states[CLAU_CRDT], data), [COLLECCIONS]: persistencia.estatAmbColleccions(states[COLLECCIONS], cols) }, value: true };
      }, config);
      if (canviat) { notificaCanvi(); return estat(); }
    }
    throw errorRural('RURAL_CONFLICTE', 'El document canvia contínuament; torna a importar el paquet.');
  }
  async function exportaVault() {
    if (usaCrdt) {
      const snap = await captura();
      const paquet = { schema: ESQUEMA_PAQUET_CRDT_RURAL, createdAt: new Date(ara()).toISOString(), crdt: snap.crdt, sha256: sha256Hex(canonitzaJsonJcs(snap.crdt)) };
      if (bytes(paquet) > MAX_FITXER) throw errorRural('RURAL_LIMIT_FITXER', 'El paquet CRDT supera els 4 MB. Conserva una còpia del registre abans de continuar.');
      await comprovaGeneracio(); return paquet;
    }
    const actual = await estat();
    const paquet = exportaPaquetVaultFallback({ notesApp: actual.notes, exportatEl: new Date(ara()).toISOString() });
    if (bytes(paquet) > MAX_FITXER) throw errorRural('RURAL_LIMIT_FITXER', 'La còpia supera els 4 MB; sincronitza una carpeta abans de continuar.');
    return paquet;
  }
  async function importaVault(entrada) {
    const paquet = typeof entrada === 'string' ? lligJsonRural(entrada) : copiaJsonRural(entrada, MAX_FITXER);
    if (usaCrdt) return importaCrdt(paquet);
    if (!paquet?.indexHashes || !paquet.fitxers || Object.keys(paquet.fitxers).length > 5000
      || paquet.sha256Vault !== sha256Hex(canonitzaJsonJcs(paquet.indexHashes))) throw new Error('La integritat del paquet de carpeta no és vàlida.');
    const snap = await captura();
    const pla = importaPaquetVaultFallback(paquet, { notesApp: snap.cols.notes });
    const buit = importaPaquetVaultFallback(paquet);
    const reconstruida = exportaPaquetVaultFallback({ notesApp: buit.notesResultants });
    if (canonitzaJsonJcs(reconstruida.indexHashes) !== canonitzaJsonJcs(paquet.indexHashes)) throw new Error('El contingut Markdown no coincidix amb les empremtes del paquet.');
    vigent(); await desaFusioNotes(pla.notesResultants, snap.pending.nextSeq - 1, snap.pending.nodeId);
    return estat();
  }
  async function sincronitzaCarpeta(handle) {
    if (usaCrdt) {
      if (motor.motor !== 'opfs') throw errorRural('RURAL_CRDT_OPFS_REQUIRED', 'La carpeta CRDT compartida requerix el perfil OPFS amb Web Locks.');
      for (let intent = 0; intent < 8; intent++) {
        const snap = await captura();
        // El mateix pany que usa el purge manté este export abans o després
        // de la purga, mai enmig. El callback no reentra al store.
        const plan = await store.ambPany([DISPOSITIU, COLLECCIONS, CLAU_CRDT, snap.qkey], async (states, signal) => {
          if ((states[snap.qkey]?.revision ?? 0) !== (snap.raw[snap.qkey]?.revision ?? 0)
            || (states[CLAU_CRDT]?.revision ?? 0) !== (snap.raw[CLAU_CRDT]?.revision ?? 0)
            || (states[COLLECCIONS]?.revision ?? 0) !== (snap.raw[COLLECCIONS]?.revision ?? 0)) return { retry: true };
          const result = await sincronitzaCrdtAmbDirectoryHandle(handle, { crdt: snap.crdt, signal, isScopeActive: abastActiu });
          return { retry: false, ...result };
        }, config);
        if (plan.retry) continue;
        const paquet = { schema: ESQUEMA_PAQUET_CRDT_RURAL, createdAt: new Date(ara()).toISOString(), crdt: plan.crdt, sha256: sha256Hex(canonitzaJsonJcs(plan.crdt)) };
        const actual = await importaCrdt(paquet);
        return { ...actual, sincronitzacio: { batchesCreats: plan.batchesCreats, projeccions: plan.projeccions.length, incorporacionsSenseBase: plan.incorporacionsSenseBase } };
      }
      throw errorRural('RURAL_CONFLICTE', 'La cua canvia contínuament; torna a sincronitzar la carpeta.');
    }
    const snap = await captura();
    const pla = await sincronitzaAmbDirectoryHandle(handle, { notesApp: snap.cols.notes, signal: controller.signal, isScopeActive: abastActiu });
    vigent(); await desaFusioNotes(pla.notesResultants, snap.pending.nextSeq - 1, snap.pending.nodeId);
    return estat();
  }
  async function exportaDelta() {
    const actual = await estat();
    claus ||= clausDeDispositiu(crypto);
    const parell = await claus; vigent();
    const delta = await exportaDeltaEmergenciaRural({ municipi, nodeOrigenId: parell.id, generatEl: new Date(ara()).toISOString(), operacions: actual.bans.map(privada),
      privateKeyJwk: parell.privateKeyJwk, verificationMethod: parell.idClau });
    await comprovaGeneracio(); return { delta, publicKeyJwk: parell.publicKeyJwk };
  }
  async function importaDelta(entrada, publicKeyJwk) {
    if (!publicKeyJwk || Object.hasOwn(publicKeyJwk, 'd')) throw new Error('Cal aportar només la clau pública de confiança de l’emissor.');
    const delta = typeof entrada === 'string' ? lligJsonRural(entrada) : copiaJsonRural(entrada, MAX_FITXER);
    const snap = await captura();
    const fusio = await importaDeltaEmergenciaRural(delta, { operacionsLocals: snap.cols.bans, publicKeyJwk, ara: ara() });
    if (!fusio.valid) throw new Error(fusio.motius.join(' '));
    vigent(); await persistencia.actualitza('bans', previs => consolidaOperacionsEmergencia([...previs.map(privada), ...fusio.operacions]).operacions, config);
    return estat();
  }
  async function consolidaDiari() {
    const snap = await captura();
    const cols = { ...snap.cols, notes: snap.cols.notes.map(n => ({ ...n, _ruralQueueNode: snap.pending.nodeId, _ruralQueueSeq: snap.pending.nextSeq - 1 })) };
    const nouId = crypto.randomUUID();
    const confirmat = await store.actualitzaLot([DISPOSITIU, COLLECCIONS, snap.qkey, ...(usaCrdt ? [CLAU_CRDT] : [])], states => {
      if ((states[snap.qkey]?.revision || 0) !== (snap.raw[snap.qkey]?.revision || 0)
        || (states[COLLECCIONS]?.revision || 0) !== (snap.raw[COLLECCIONS]?.revision || 0)
        || usaCrdt && (states[CLAU_CRDT]?.revision ?? 0) !== (snap.raw[CLAU_CRDT]?.revision ?? 0)) throw errorRural('RURAL_CONFLICTE', 'Les notes han canviat; torna a consolidar el diari.');
      const d = { revision: states[DISPOSITIU].revision + 1, id: nouId, checkpoint: { nodeId: snap.pending.nodeId, seq: snap.pending.nextSeq - 1,
        tailHash: snap.cadena.tailHash, tipus: 'copia-local', creatEl: new Date(ara()).toISOString() } };
      return { next: { [DISPOSITIU]: d, [COLLECCIONS]: persistencia.estatAmbColleccions(states[COLLECCIONS], cols), [snap.qkey]: null, ...(usaCrdt ? { [CLAU_CRDT]: estatCrdtAmb(states[CLAU_CRDT], snap.crdt) } : {}) }, value: d };
    }, config);
    vigent(); obriMotors(confirmat); notificaGeneracio();
    return estat();
  }
  async function esborraTot() {
    vigent(); const qkey = keyCua();
    await store.actualitzaLot([DISPOSITIU, COLLECCIONS, qkey, ...(usaCrdt ? [CLAU_CRDT] : [])], states => ({ next: {
      [DISPOSITIU]: { revision: states[DISPOSITIU].revision + 1, id: crypto.randomUUID() }, [COLLECCIONS]: null, [qkey]: null, ...(usaCrdt ? { [CLAU_CRDT]: null } : {})
    }, value: true }), config);
    notificaGeneracio(); close(); return true;
  }
  function close() { if (!obert) return; obert = false; controller.abort(); claus = null; canal?.close(); canal = null; tancaMotors(); }
  return Object.freeze({ estat, desaNota, preparaEdicio, editaNota, eliminaNota, exportaVault, importaVault, sincronitzaCarpeta, exportaDelta, importaDelta, consolidaDiari, esborraTot, close });
}
