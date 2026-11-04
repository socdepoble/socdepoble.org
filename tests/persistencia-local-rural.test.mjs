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

const DISPOSITIU = 'mode-rural:dispositiu';
const LOT = [DISPOSITIU, 'colleccions', 'cua'];
const colsDeProva = () => Object.fromEntries(COLLECCIONS_RURALS.map(clau => [clau, clau === 'notes' ? [{ id: 'privada', text: 'només local' }] : []]));
for (const tipus of ['memoria', 'indexeddb']) {
  test(`${tipus}: lot coherent, esborrat físic i canvi de generació deixen un altre tenant intacte`, async t => {
    const { opcions, memoria, idb } = setup(tipus);
    const inicial = creaMagatzemAtomicRural(opcions);
    const persistencia = creaPersistenciaLocalRural(opcions);
    const altre = creaMagatzemAtomicRural({ ...opcions, abast: { ...abast, tenant: 'poble-B' } });
    const a = creaMagatzemAtomicRural({ ...opcions, generacio: { clau: DISPOSITIU, id: 'generacio-A' } });
    t.after(() => { inicial.close(); persistencia.tanca(); altre.close(); a.close(); });
    await altre.compareAndSwap('cua', 0, { revision: 1, text: 'intacte' });
    const state = persistencia.estatAmbColleccions(null, colsDeProva());
    assert.equal(await inicial.actualitzaLot(LOT, actual => {
      assert.deepEqual({ ...actual }, { [DISPOSITIU]: null, colleccions: null, cua: null });
      return { next: { [DISPOSITIU]: { revision: 1, id: 'generacio-A' }, colleccions: state, cua: { revision: 1, text: 'pendent' } }, value: true };
    }), true);
    const midaAbans = tipus === 'memoria' ? memoria.size : idb.files('sdp-rural-v1', 'estat').length;
    const resultat = await a.actualitzaLot(LOT, actual => {
      assert.equal(actual[DISPOSITIU].id, 'generacio-A');
      assert.equal(actual.colleccions.revision, 1);
      assert.equal(actual.cua.revision, 1);
      return { next: { [DISPOSITIU]: { revision: 2, id: 'generacio-B' }, colleccions: null, cua: null }, value: { purgat: true } };
    });
    assert.deepEqual(resultat, { purgat: true });
    const midaDespres = tipus === 'memoria' ? memoria.size : idb.files('sdp-rural-v1', 'estat').length;
    assert.equal(midaDespres, midaAbans - 2);
    assert.equal((await inicial.read(DISPOSITIU)).id, 'generacio-B');
    assert.equal(await inicial.read('cua'), null);
    assert.equal(await inicial.read('colleccions'), null);
    assert.equal((await altre.read('cua')).text, 'intacte');
  });

  test(`${tipus}: tot next i value es validen abans de qualsevol escriptura del lot`, async t => {
    const { opcions } = setup(tipus, { limitBytes: 1024 });
    const a = creaMagatzemAtomicRural(opcions); t.after(() => a.close());
    await a.actualitzaLot(['a', 'b'], () => ({ next: { a: { revision: 1, text: 'A' }, b: { revision: 1, text: 'B' } }, value: true }));
    let accessos = 0;
    const accessor = { a: null, get b() { accessos += 1; return null; } };
    const canvisInvalids = [
      () => ({ next: { a: null, b: { revision: 2, text: 'x'.repeat(2000) } }, value: true }),
      () => ({ next: { a: null, b: null }, value: undefined }),
      () => ({ next: { a: null, b: null }, value: { secret: 'NO-SECRET' } }),
      () => ({ next: { a: null, fora: { revision: 1 } }, value: true }),
      () => ({ next: { a: null, b: undefined }, value: true }),
      () => ({ next: accessor, value: true }),
      async () => ({ next: { a: null, b: null }, value: true })
    ];
    for (const transforma of canvisInvalids) {
      await assert.rejects(a.actualitzaLot(['a', 'b'], transforma), falla('SDP-RURAL-INVALID'));
      assert.equal((await a.read('a')).text, 'A');
      assert.equal((await a.read('b')).text, 'B');
    }
    assert.equal(accessos, 0);
    for (const claus of [[], ['a', 'a'], Array.from({ length: 9 }, (_, i) => String(i)), ['a', ' x'], ['a', 'x'.repeat(513)]]) {
      await assert.rejects(a.actualitzaLot(claus, () => ({ next: {}, value: true })), falla('SDP-RURAL-INVALID'));
    }
    assert.equal(await a.actualitzaLot(['a', 'b'], () => ({ next: {}, value: false })), false);
    assert.equal((await a.read('a')).text, 'A');
  });

  test(`${tipus}: avortar o tancar dins del transformador desfà el lot sencer`, async t => {
    const { opcions } = setup(tipus);
    const a = creaMagatzemAtomicRural(opcions); const b = creaMagatzemAtomicRural(opcions);
    t.after(() => { a.close(); b.close(); });
    await a.actualitzaLot(['a', 'b'], () => ({ next: { a: { revision: 1 }, b: { revision: 1 } }, value: true }));
    const controller = new AbortController();
    await assert.rejects(a.actualitzaLot(['a', 'b'], () => {
      controller.abort(); return { next: { a: null, b: { revision: 2 } }, value: true };
    }, { signal: controller.signal }), e => e.name === 'AbortError');
    assert.equal((await b.read('a')).revision, 1); assert.equal((await b.read('b')).revision, 1);
    await assert.rejects(a.actualitzaLot(['a', 'b'], () => {
      a.close(); return { next: { a: null, b: null }, value: true };
    }), e => ['SDP-RURAL-TANCAT', 'SDP-RURAL-CANCEL'].includes(e.code));
    assert.equal((await b.read('a')).revision, 1); assert.equal((await b.read('b')).revision, 1);
  });

  test(`${tipus}: una generació caducada bloqueja lectura, CAS diferit i restauració que esperava WebCrypto`, async t => {
    let desbloqueja, dinsDigest;
    const gate = new Promise(resolve => { desbloqueja = resolve; });
    const dins = new Promise(resolve => { dinsDigest = resolve; });
    let pausar = false;
    const crypto = { subtle: { digest: async (...args) => {
      if (pausar) { dinsDigest(); await gate; }
      return webcrypto.subtle.digest(...args);
    } } };
    const { opcions, idb } = setup(tipus, { crypto });
    const inicial = creaMagatzemAtomicRural(opcions);
    await inicial.actualitzaLot(LOT, () => ({ next: { [DISPOSITIU]: { revision: 1, id: 'A' }, cua: { revision: 1 } }, value: true }));
    const guard = { clau: DISPOSITIU, id: 'A' };
    const a = creaMagatzemAtomicRural({ ...opcions, generacio: guard });
    const p = creaPersistenciaLocalRural({ ...opcions, generacio: guard });
    const b = creaMagatzemAtomicRural({ ...opcions, generacio: guard,
      ...(tipus === 'indexeddb' ? { indexedDB: idb.pestanya() } : {}) });
    t.after(() => { desbloqueja(); inicial.close(); a.close(); b.close(); p.tanca(); });
    await p.desa('notes', [{ id: 'abans' }]);
    const snap = await p.exportaInstantaniaLocal();
    const revision = (await b.read('cua')).revision;
    pausar = true;
    const restauracio = p.restauraInstantaniaLocal(snap);
    await dins;
    const casDiferit = gate.then(() => b.compareAndSwap('cua', revision, { revision: revision + 1, text: 'ressurrecció' }));
    const rebutjos = Promise.all([
      assert.rejects(restauracio, falla('SDP-RURAL-GENERACIO')),
      assert.rejects(casDiferit, falla('SDP-RURAL-GENERACIO'))
    ]);
    await a.actualitzaLot(LOT, () => ({ next: { [DISPOSITIU]: { revision: 2, id: 'B' }, colleccions: null, cua: null }, value: true }));
    desbloqueja();
    await rebutjos;
    await assert.rejects(b.read('cua'), falla('SDP-RURAL-GENERACIO'));
    await assert.rejects(p.llegix('notes'), falla('SDP-RURAL-GENERACIO'));
    let executat = false;
    await assert.rejects(b.actualitzaLot(LOT, () => { executat = true; return { next: {}, value: true }; }), falla('SDP-RURAL-GENERACIO'));
    assert.equal(executat, false);
    assert.equal(await inicial.read('colleccions'), null); assert.equal(await inicial.read('cua'), null);
    const nou = creaMagatzemAtomicRural({ ...opcions, generacio: { clau: DISPOSITIU, id: 'B' } });
    t.after(() => nou.close()); assert.equal(await nou.read('colleccions'), null);
  });

  test(`${tipus}: metadata absent i generació aliena deneguen abans de transformar`, async t => {
    const { opcions } = setup(tipus);
    const a = creaMagatzemAtomicRural({ ...opcions, generacio: { clau: DISPOSITIU, id: 'A' } });
    t.after(() => a.close());
    let crides = 0;
    await assert.rejects(a.actualitzaLot(LOT, () => { crides += 1; return { next: {}, value: true }; }), falla('SDP-RURAL-GENERACIO'));
    assert.equal(crides, 0);
    for (const generacio of [false, {}, { clau: DISPOSITIU, id: '' }, { clau: DISPOSITIU, id: 'A', extra: true }]) {
      assert.throws(() => creaMagatzemAtomicRural({ ...opcions, generacio }), falla('SDP-RURAL-INVALID'));
    }
  });

  test(`${tipus}: una exportació que esperava SHA no lliura dades privades després d’una purga aliena`, async t => {
    let desbloqueja, entra;
    const gate = new Promise(resolve => { desbloqueja = resolve; });
    const iniciat = new Promise(resolve => { entra = resolve; });
    const crypto = { subtle: { digest: async (...args) => {
      entra(); await gate; return webcrypto.subtle.digest(...args);
    } } };
    const { opcions } = setup(tipus, { crypto });
    const a = creaMagatzemAtomicRural(opcions);
    const p = creaPersistenciaLocalRural({ ...opcions, generacio: { clau: DISPOSITIU, id: 'A' } });
    t.after(() => { desbloqueja(); a.close(); p.tanca(); });
    await a.compareAndSwap(DISPOSITIU, 0, { revision: 1, id: 'A' });
    await p.desa('notes', [{ id: 'privada' }]);
    const exportacio = p.exportaInstantaniaLocal();
    const rebutjada = assert.rejects(exportacio, falla('SDP-RURAL-GENERACIO'));
    await iniciat;
    await a.actualitzaLot(LOT, () => ({ next: { [DISPOSITIU]: { revision: 2, id: 'B' }, colleccions: null, cua: null }, value: true }));
    desbloqueja(); await rebutjada;
    assert.equal(await a.read('colleccions'), null);
  });
}

test('IndexedDB: quota al commit del lot restaura també les claus esborrades i l’epoch', async t => {
  const { opcions, idb } = setup('indexeddb');
  const a = creaMagatzemAtomicRural(opcions); t.after(() => a.close());
  await a.actualitzaLot(LOT, () => ({ next: { [DISPOSITIU]: { revision: 1, id: 'A' }, colleccions: { revision: 1 }, cua: { revision: 1 } }, value: true }));
  idb.omplit = true;
  await assert.rejects(a.actualitzaLot(LOT, () => ({ next: { [DISPOSITIU]: { revision: 2, id: 'B' }, colleccions: null, cua: null }, value: true })), falla('SDP-RURAL-QUOTA'));
  idb.omplit = false;
  assert.equal((await a.read(DISPOSITIU)).id, 'A');
  assert.equal((await a.read('colleccions')).revision, 1); assert.equal((await a.read('cua')).revision, 1);
});

test('les projeccions pures validen l’estat original i no creen cap registre ni compartixen referències', async t => {
  const { opcions, memoria } = setup('memoria');
  const p = creaPersistenciaLocalRural(opcions); t.after(() => p.tanca());
  const cols = colsDeProva(); const a = p.estatAmbColleccions(null, cols);
  assert.equal(a.revision, 1); assert.deepEqual(p.colleccionsDe(null), Object.fromEntries(COLLECCIONS_RURALS.map(c => [c, []])));
  cols.notes[0].text = 'mutada';
  const copia = p.colleccionsDe(a); copia.notes[0].text = 'altra';
  assert.equal(p.colleccionsDe(a).notes[0].text, 'només local');
  assert.equal(p.estatAmbColleccions(a, p.colleccionsDe(a)).revision, 2);
  assert.equal(memoria.size, 0);
  for (const mal of [{ revision: 1, schema: 'inventat', collections: colsDeProva() }, { revision: 0, schema: a.schema, collections: colsDeProva() }, { ...a, extra: true }]) {
    assert.throws(() => p.colleccionsDe(mal), falla('SDP-RURAL-INVALID'));
    assert.throws(() => p.estatAmbColleccions(mal, colsDeProva()), falla('SDP-RURAL-INVALID'));
  }
  await assert.rejects(p.llegix('cap'), falla('SDP-RURAL-INVALID'));
});

test('memòria: la reentrada entre instàncies no confirma un CAS que el lot exterior trepitjaria', async t => {
  const { opcions } = setup('memoria');
  const a = creaMagatzemAtomicRural(opcions), b = creaMagatzemAtomicRural(opcions);
  const altre = creaMagatzemAtomicRural({ ...opcions, abast: { ...abast, tenant: 'poble-B' } });
  t.after(() => { a.close(); b.close(); altre.close(); });
  await a.compareAndSwap('a', 0, { revision: 1 });
  let interiorRebutjat, altreTenant;
  assert.equal(await a.actualitzaLot(['a'], actual => {
    interiorRebutjat = assert.rejects(b.compareAndSwap('a', 1, { revision: 2, text: 'interior' }), falla('SDP-RURAL-CONFLICTE'));
    altreTenant = altre.compareAndSwap('a', 0, { revision: 1, text: 'altre poble' });
    return { next: { a: { revision: actual.a.revision + 1, text: 'exterior' } }, value: actual.a.revision };
  }), 1);
  await interiorRebutjat;
  assert.equal(await altreTenant, true);
  assert.equal((await a.read('a')).text, 'exterior');
  assert.equal((await altre.read('a')).text, 'altre poble');
  // El pany també s’allibera després d’un error, no queda cap procés esperant.
  await assert.rejects(a.actualitzaLot(['a'], () => { throw new Error('fixture'); }), /fixture/);
  assert.equal(await b.compareAndSwap('a', 2, { revision: 3 }), true);
});
