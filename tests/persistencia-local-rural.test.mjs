import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { creaIdbFalsEstructurat } from './helpers/idbFalsEstructurat.js';
import { creaMagatzemAtomicRural, creaPersistenciaLocalRural, COLLECCIONS_RURALS, copiaJsonRural } from '../src/data/local/persistenciaLocalRural.js';
const abast = Object.freeze({ persona: 'persona-A', tenant: 'poble-A', endpoint: 'https://dades.example/servei', mode: 'local' });
const setup = (tipus, extra = {}) => {
  const idb = creaIdbFalsEstructurat(); const memoria = new Map();
  const opcions = { abast, motor: tipus, indexedDB: idb, memoria, crypto: webcrypto, ara: () => 1234, ...extra };
  return { idb, memoria, opcions, crea: () => creaPersistenciaLocalRural(opcions) };
};
const falla = codi => e => e?.code === codi;
for (const tipus of ['memoria', 'indexeddb']) {
  test(`${tipus}: cinc col·leccions, aïllament de còpies i reobertura`, async t => {
    const { crea } = setup(tipus); const store = crea(); t.after(() => store.tanca());
    for (const col of COLLECCIONS_RURALS) {
      assert.deepEqual(await store.llegix(col), []);
      const rows = [{ id: col, text: 'dada', actualitzat: 1234, public: false }];
      await store.desa(col, rows); rows[0].text = 'mutada';
      const read = await store.llegix(col); assert.equal(read[0].text, 'dada'); read[0].text = 'una altra mutació';
      assert.equal((await store.llegix(col))[0].text, 'dada');
    }
    store.tanca(); const reobert = crea(); t.after(() => reobert.tanca());
    for (const col of COLLECCIONS_RURALS) assert.equal((await reobert.llegix(col))[0].id, col);
  });
  test(`${tipus}: concurrent actualitza no perd cap registre`, async t => {
    const { crea } = setup(tipus); const a = crea(); const b = crea(); t.after(() => { a.tanca(); b.tanca(); });
    await Promise.all(Array.from({ length: 30 }, (_, i) => (i % 2 ? a : b).actualitza('notes', rows => [...rows, { id: `n${i}`, text: String(i) }])));
    assert.equal((await a.llegix('notes')).length, 30);
  });
  test(`${tipus}: CAS únic amb dues instàncies i revisió esperada`, async t => {
    const { opcions } = setup(tipus); const a = creaMagatzemAtomicRural(opcions); const b = creaMagatzemAtomicRural(opcions);
    t.after(() => { a.close(); b.close(); });
    const results = await Promise.all([a.compareAndSwap('cua', 0, { revision: 1, payload: 'A' }), b.compareAndSwap('cua', 0, { revision: 1, payload: 'B' })]);
    assert.equal(results.filter(Boolean).length, 1);
    assert.equal((await a.read('cua')).revision, 1);
    await assert.rejects(a.compareAndSwap('cua', 1, { revision: 3 }), falla('SDP-RURAL-INVALID'));
  });
  test(`${tipus}: persona, tenant, endpoint i mode separen namespaces`, async t => {
    const { opcions } = setup(tipus); const main = creaPersistenciaLocalRural(opcions); t.after(() => main.tanca());
    await main.desa('notes', [{ id: 'privat', text: 'només A' }]);
    for (const key of ['persona', 'tenant', 'endpoint', 'mode']) {
      const altre = creaPersistenciaLocalRural({ ...opcions, abast: { ...abast, [key]: `${abast[key]}-altre` } }); t.after(() => altre.tanca());
      assert.deepEqual(await altre.llegix('notes'), []);
      await assert.rejects(altre.restauraInstantaniaLocal(await main.exportaInstantaniaLocal()), falla('SDP-RURAL-ABAST'));
    }
  });
  test(`${tipus}: snapshot SHA-256 anada/tornada de les cinc col·leccions`, async t => {
    const { crea } = setup(tipus); const a = crea(); t.after(() => a.tanca());
    for (const col of COLLECCIONS_RURALS) await a.desa(col, [{ id: col, text: 'à, 漢字', n: 2.5, flag: true, nullable: null, nest: { llista: ['x', 1] } }]);
    const snap = await a.exportaInstantaniaLocal(); assert.match(snap.sha256, /^[a-f0-9]{64}$/);
    for (const col of COLLECCIONS_RURALS) await a.desa(col, []);
    const result = await a.restauraInstantaniaLocal(JSON.stringify(snap)); assert.equal(result.registres, 5); assert.equal(result.autenticitat, 'no-verificada');
    for (const col of COLLECCIONS_RURALS) assert.equal((await a.llegix(col))[0].text, 'à, 漢字');
  });
  test(`${tipus}: hash, esquema, IDs i primitius alterats no escriuen`, async t => {
    const { crea } = setup(tipus); const a = crea(); t.after(() => a.tanca());
    await a.desa('notes', [{ id: '1', text: 'original' }]); const snap = await a.exportaInstantaniaLocal();
    const tampered = structuredClone(snap); tampered.collections.notes[0].text = 'atac';
    await assert.rejects(a.restauraInstantaniaLocal(tampered), falla('SDP-RURAL-HASH'));
    for (const change of [s => { s.extra = 'no'; }, s => { s.schema = 'desconegut'; }, s => { s.collections.notes[0].id = 1; }, s => { s.createdAt = '1234'; }, s => { s.collections.extra = []; }]) {
      const bad = structuredClone(snap); change(bad); await assert.rejects(a.restauraInstantaniaLocal(bad), falla('SDP-RURAL-INVALID'));
    }
    assert.equal((await a.llegix('notes'))[0].text, 'original');
  });
  test(`${tipus}: JSON hostil, getters, prototips, buits i secrets rebutjats`, async t => {
    const { crea } = setup(tipus); const a = crea(); t.after(() => a.tanca()); let accessed = false;
    const getter = { id: '1', get text() { accessed = true; return 'x'; } };
    const cycle = { id: '1' }; cycle.cycle = cycle;
    const sparse = []; sparse.length = 2;
    const invalids = [getter, cycle, { id: '1', x: undefined }, { id: '1', x: NaN }, { id: '1', x: Infinity }, { id: '1', x: new Date() },
      { id: '1', x: 1n }, { id: '1', x: () => 1 }, { id: '1', x: sparse }, { id: '1', access_token: 'NO-SECRET' },
      { id: '1', toJSON() { accessed = true; return 'x'; } }, JSON.parse('{"id":"1","__proto__":{"polluted":true}}')];
    for (const row of invalids) await assert.rejects(async () => a.desa('notes', [row]), falla('SDP-RURAL-INVALID'));
    assert.equal(accessed, false); assert.equal({}.polluted, undefined); assert.deepEqual(await a.llegix('notes'), []);
  });
  test(`${tipus}: quota, cancel·lació, callback asíncron i tancament són visibles`, async t => {
    const { crea } = setup(tipus, { limitBytes: 1024, limitRegistres: 2 }); const a = crea(); t.after(() => a.tanca());
    await assert.rejects(async () => a.desa('notes', [{ id: '1', text: 'x'.repeat(2000) }]), falla('SDP-RURAL-INVALID'));
    await assert.rejects(a.desa('notes', [{ id: '1' }, { id: '2' }, { id: '3' }]), falla('SDP-RURAL-INVALID'));
    const controller = new AbortController(); controller.abort();
    await assert.rejects(a.llegix('notes', { signal: controller.signal }), e => e.name === 'AbortError');
    await assert.rejects(a.actualitza('notes', async () => []), falla('SDP-RURAL-INVALID'));
    a.tanca(); await assert.rejects(a.llegix('notes'), falla('SDP-RURAL-TANCAT'));
  });
  test(`${tipus}: edició concurrent durant digest impedeix restauració que la trepitge`, async t => {
    let libera; const gated = new Promise(r => { libera = r; }); let pausar = false;
    const crypto = { subtle: { digest: async (...args) => { if (pausar) await gated; return webcrypto.subtle.digest(...args); } } };
    const { crea } = setup(tipus, { crypto }); const a = crea(); t.after(() => a.tanca());
    await a.desa('notes', [{ id: 'original' }]); const snap = await a.exportaInstantaniaLocal(); pausar = true;
    const restore = a.restauraInstantaniaLocal(snap);
    // Arriba al digest després de la captura de revisió del destí.
    await new Promise(r => setTimeout(r, 10));
    await a.desa('notes', [{ id: 'nova' }]); libera();
    await assert.rejects(restore, falla('SDP-RURAL-CONFLICTE'));
    assert.equal((await a.llegix('notes'))[0].id, 'nova');
  });
}

test('IndexedDB realista: quota al commit desfà la mutació i no fabrica ack', async t => {
  const { idb, crea } = setup('indexeddb'); const a = crea(); t.after(() => a.tanca());
  await a.desa('notes', [{ id: 'abans' }]); idb.omplit = true;
  await assert.rejects(a.desa('notes', [{ id: 'després' }]), falla('SDP-RURAL-QUOTA'));
  idb.omplit = false; assert.equal((await a.llegix('notes'))[0].id, 'abans');
});
test('no hi ha fallback de la persistència absent a memòria', async () => {
  const a = creaPersistenciaLocalRural({ abast, indexedDB: null });
  try { await assert.rejects(a.llegix('notes'), falla('SDP-RURAL-NO-IDB')); } finally { a.tanca(); }
});
test('el nom d’endpoint no accepta credencials i el snapshot necessita WebCrypto', async () => {
  assert.throws(() => creaPersistenciaLocalRural({ abast: { ...abast, endpoint: 'https://user:secret@example.com' } }), falla('SDP-RURAL-INVALID'));
  const a = creaPersistenciaLocalRural({ abast, motor: 'memoria', crypto: null });
  try { await assert.rejects(a.exportaInstantaniaLocal(), falla('SDP-RURAL-NO-CRYPTO')); } finally { a.tanca(); }
});

test('cancel·lació mentre s’obri IDB és immediata i el close lleva l’espera pendent', async () => {
  const a = creaPersistenciaLocalRural({ abast, indexedDB: { open: () => ({}) }, timeoutMs: 1000 });
  const controller = new AbortController();
  const read = a.llegix('notes', { signal: controller.signal }); controller.abort();
  try { await assert.rejects(read, e => e.name === 'AbortError'); } finally { a.tanca(); }
});
test('obertura bloquejada i WebCrypto penjat tenen límit i error explícit', async () => {
  const a = creaPersistenciaLocalRural({ abast, indexedDB: { open: () => ({}) }, timeoutMs: 5 });
  try { await assert.rejects(a.llegix('notes'), falla('SDP-RURAL-TIMEOUT')); } finally { a.tanca(); }
  const b = creaPersistenciaLocalRural({ abast, motor: 'memoria', timeoutMs: 5, crypto: { subtle: { digest: () => new Promise(() => {}) } } });
  try { await assert.rejects(b.exportaInstantaniaLocal(), falla('SDP-RURAL-TIMEOUT')); } finally { b.tanca(); }
});
test('close durant un digest retira el timer i rebutja sense lliurar dades privades', async () => {
  let avis; const dins = new Promise(r => { avis = r; });
  const a = creaPersistenciaLocalRural({ abast, motor: 'memoria', crypto: { subtle: { digest: () => { avis(); return new Promise(() => {}); } } } });
  const pending = a.exportaInstantaniaLocal(); await dins; a.tanca();
  await assert.rejects(pending, falla('SDP-RURAL-TANCAT'));
});
test('tancament extern de la connexió IDB es recupera amb una obertura nova', async t => {
  const { idb, crea } = setup('indexeddb'); const a = crea(); t.after(() => a.tanca());
  await a.desa('notes', [{ id: 'durable' }]); idb.tancaConnexions('sdp-rural-v1');
  assert.equal((await a.llegix('notes'))[0].id, 'durable');
});
test('dos IDBFactory de pestanyes comparteixen el CAS atòmic de la mateixa base', async t => {
  const { idb, opcions } = setup('indexeddb');
  const a = creaMagatzemAtomicRural(opcions); const b = creaMagatzemAtomicRural({ ...opcions, indexedDB: idb.pestanya() });
  t.after(() => { a.close(); b.close(); });
  const results = await Promise.all([a.compareAndSwap('pestanyes', 0, { revision: 1, writer: 'A' }), b.compareAndSwap('pestanyes', 0, { revision: 1, writer: 'B' })]);
  assert.equal(results.filter(Boolean).length, 1);
});

test('una URL malformada no pot ocultar credencials; sentinels locals són explícits', () => {
  for (const endpoint of ['http://user:password@[', 'not-an-url', 'https://', 'https://example.com?token=x', 'https://example.com/#secret', 'file:///tmp/dades', 'javascript:secret']) {
    assert.throws(() => creaPersistenciaLocalRural({ abast: { ...abast, endpoint }, motor: 'memoria' }), falla('SDP-RURAL-INVALID'));
  }
  for (const endpoint of ['local', 'seed']) {
    const p = creaPersistenciaLocalRural({ abast: { ...abast, endpoint }, motor: 'memoria' });
    assert.equal(p.abast.endpoint, endpoint); p.tanca();
  }
});

/* PERS-01 (Gauntlet O7-O9) · Un readwrite que ja ha arribat a oncomplete és durable:
   abort() llança InvalidStateError en committing/finished i la cancel·lació ha perdut
   la carrera. L'abort s'injecta dins de l'oncomplete interceptat. */
function avortaEnConfirmar(idb, controller) {
  const [bd] = idb.connexions('sdp-rural-v1');
  const original = bd.transaction;
  bd.transaction = (...args) => {
    const tx = original.apply(bd, args);
    if (args[1] !== 'readwrite') return tx;
    let gestor = null;
    Object.defineProperty(tx, 'oncomplete', { configurable: true, get: () => gestor,
      set: f => { gestor = f && (ev => { controller.abort(); f(ev); }); } });
    return tx;
  };
  return () => { bd.transaction = original; };
}
test('PERS-01 · una cancel·lació durant el commit no desmentix una escriptura ja persistida', async t => {
  const { idb, crea } = setup('indexeddb'); const a = crea(); t.after(() => a.tanca());
  await a.desa('notes', [{ id: 'abans' }]);
  const controller = new AbortController(); const restaura = avortaEnConfirmar(idb, controller);
  assert.deepEqual(await a.desa('notes', [{ id: 'despres' }], { signal: controller.signal }), [{ id: 'despres' }]);
  restaura(); assert.equal(controller.signal.aborted, true);
  assert.equal((await a.llegix('notes'))[0].id, 'despres');
});
test('PERS-01 · un CAS confirmat torna true encara que el senyal s’avorte durant el commit', async t => {
  const { idb, opcions } = setup('indexeddb'); const a = creaMagatzemAtomicRural(opcions); t.after(() => a.close());
  await a.compareAndSwap('cua', 0, { revision: 1, v: 'u' });
  const controller = new AbortController(); const restaura = avortaEnConfirmar(idb, controller);
  assert.equal(await a.compareAndSwap('cua', 1, { revision: 2, v: 'dos' }, { signal: controller.signal }), true);
  restaura(); assert.equal((await a.read('cua')).v, 'dos');
});

test('E07: la còpia genèrica rebutja __proto__ normalitzat sense dependre d’una segona validació', () => {
  for (const key of ['__proto__', '_proto_', 'proto', '__PrOtO__', 'constructor', 'prototype']) {
    const input = JSON.parse(`{"${key}":{"role":"admin"},"value":"fixture"}`);
    assert.throws(() => copiaJsonRural(input), falla('SDP-RURAL-INVALID'), key);
    assert.throws(() => copiaJsonRural({ nested: [input] }), falla('SDP-RURAL-INVALID'), `nested ${key}`);
    assert.equal(Object.getPrototypeOf(input), Object.prototype);
  }
  const value = copiaJsonRural({ id: 'legitim', nested: [{ text: 'memòria rural' }] });
  assert.equal(Object.getPrototypeOf(value), Object.prototype);
  assert.equal(Object.getPrototypeOf(value.nested[0]), Object.prototype);
  assert.equal({}.role, undefined);
});
