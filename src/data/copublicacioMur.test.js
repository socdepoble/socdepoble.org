import { describe, it, expect } from 'vitest';
import { creaIdbFalsEstructurat } from '../../tests/helpers/idbFalsEstructurat.js';
import { creaCuaRevocacionsMur } from './copublicacioMur.js';
const A = { backend: 'https://example.supabase.co', tenant: 't', user: 'u' };
const ID = '44000000-0000-4000-8000-000000000001';
const rows = idb => idb.files('sdp-copublicacio-mur-r21', 'revocacions').map(r => r.valor);
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function setup(envia = async () => {}) {
  const indexedDB = creaIdbFalsEstructurat(); let time = 10000, scope = A;
  const options = { indexedDB, obteAbast: () => scope, envia, ara: () => time };
  return { indexedDB, options, q: creaCuaRevocacionsMur(options), advance: ms => { time += ms; }, scope: s => { scope = s; } };
}
describe('R21 v2 · voluntat durable, retard i exclusió entre pestanyes', () => {
  it('un ACK deixa tombstone durable i mai es rearma', async () => {
    let calls = 0; const s = setup(async () => { calls++; });
    await s.q.encua(ID); await s.q.drena(); await s.q.encua(ID, { reintentaRebutjada: true });
    await creaCuaRevocacionsMur(s.options).drena();
    expect(calls).toBe(1); expect(await s.q.estaRetirada(ID)).toBe(true);
    expect(await s.q.estat(ID)).toEqual({ pendent: false, seguentIntent: 0 });
  });
  it.each([403,404,409,408,429,500])('HTTP %s conserva la voluntat i no causa un despertar repetit', async status => {
    let calls = 0, fixed = false; const s = setup(async () => { calls++; if (!fixed) throw Object.assign(new Error('SECRET BODY'), { status }); });
    await s.q.encua(ID); await expect(s.q.drena()).rejects.toMatchObject({ status, revocacioPendent: true });
    expect(rows(s.indexedDB)[0]).toMatchObject({ pending: true, attempt: 1, nextRetryAt: 11000 });
    expect(JSON.stringify(rows(s.indexedDB))).not.toContain('SECRET BODY');
    const restarted = creaCuaRevocacionsMur(s.options);
    await Promise.all([restarted.drena(), restarted.drena()]); expect(calls).toBe(1);
    s.advance(1000); await expect(restarted.drena()).rejects.toThrow();
    expect(rows(s.indexedDB)[0].nextRetryAt).toBe(13000); expect(calls).toBe(2);
    fixed = true; s.advance(2000); await restarted.drena(); expect(rows(s.indexedDB)[0].pending).toBe(false);
  });
  it('el reintent explícit després de reparar permet avançar el retard però no un ACK', async () => {
    let fixed = false; const s = setup(async () => { if (!fixed) throw { status: 403 }; });
    await s.q.encua(ID); await expect(s.q.drena()).rejects.toMatchObject({ status:403 });
    fixed = true; await s.q.encua(ID, { reintentaRebutjada: true }); await s.q.drena();
    expect(rows(s.indexedDB)[0].pending).toBe(false);
  });
  it('un lease persistent evita peticions duplicades en tabs i recàrregues', async () => {
    const started = deferred(), reply = deferred(); let calls = 0;
    const s = setup(async () => { calls++; started.resolve(); await reply.promise; });
    await s.q.encua(ID); const draining = s.q.drena(); await started.promise;
    const other = creaCuaRevocacionsMur(s.options);
    expect(await other.drena()).toMatchObject({ pendents: 1, seguentIntent: 70000 });
    expect(calls).toBe(1); reply.resolve(); await draining; expect(rows(s.indexedDB)[0].pending).toBe(false);
  });
  it('un ACK tardà després d’expirar el lease no consumeix el reintent nou', async () => {
    const started = deferred(), reply = deferred(); let calls = 0;
    const s = setup(async () => { if (++calls === 1) { started.resolve(); await reply.promise; } });
    await s.q.encua(ID); const old = s.q.drena(); await started.promise;
    s.advance(60001); await creaCuaRevocacionsMur(s.options).drena(); reply.resolve();
    await expect(old).rejects.toMatchObject({ name: 'AbortError' }); expect(rows(s.indexedDB)[0]).toMatchObject({ pending:false, attempt:2 });
  });
  it('un canvi d’identitat no consumeix un ACK antic ni envia la cua d’altri', async () => {
    const started = deferred(), reply = deferred(); const s = setup(async () => { started.resolve(); await reply.promise; });
    await s.q.encua(ID); const draining = s.q.drena(); await started.promise;
    s.scope({ ...A, user:'other' }); reply.resolve(); await expect(draining).rejects.toMatchObject({ name:'AbortError' });
    expect(rows(s.indexedDB)[0].pending).toBe(true); expect(await s.q.drena()).toMatchObject({ pendents:0 });
  });
  it('la nota conserva l’acte exacte encara que una revisió nova o una republicació existisquen', async () => {
    const sent = []; const s = setup(async (id, descriptor) => sent.push([id, descriptor]));
    const act = ID.replace(/1$/, '2'); await s.q.encua(ID, { tipus:'nota', revision:3, publicacioId:act });
    expect(await s.q.estaRetirada(act)).toBe(true); await s.q.drena();
    expect(sent).toEqual([[ID,{ tipus:'nota',revision:3,publicacioId:act }]]);
  });
  it('l’absència o la quota de persistència no envia res', async () => {
    const q = creaCuaRevocacionsMur({ indexedDB:null,obteAbast:()=>A,envia:async()=>{ throw new Error('network'); } });
    await expect(q.encua(ID)).rejects.toThrow('persistent');
    const s = setup(); s.indexedDB.omplit = true; await expect(s.q.encua(ID)).rejects.toMatchObject({ name:'QuotaExceededError' });
    expect(rows(s.indexedDB)).toEqual([]);
  });
  it('les dades arbitràries no entren al diari', async () => {
    const s = setup(); await expect(s.q.encua(ID,{ revision:{ body:'private' } })).rejects.toThrow('invàlid');
    expect(rows(s.indexedDB)).toEqual([]);
  });
  it('el backoff és acotat en un intent persistent', async () => {
    const s = setup(async () => { throw { status:403 }; }); await s.q.encua(ID);
    for (let i = 0; i < 16; i++) { await expect(s.q.drena()).rejects.toMatchObject({ status:403 }); s.advance(300000); }
    expect(rows(s.indexedDB)[0].attempt).toBe(16); expect(rows(s.indexedDB)[0].pending).toBe(true);
  });
});

it('R21.6 → v2: recupera els 403 rebutjats antics i conserva els ACK, sense perdre UUID', async () => {
  const indexedDB=creaIdbFalsEstructurat(),scope=JSON.stringify([A.backend,A.tenant,A.user]);
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('sdp-copublicacio-mur-r21',1);r.onupgradeneeded=()=>r.result.createObjectStore('revocacions',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  await new Promise((resolve,reject)=>{const tx=db.transaction('revocacions','readwrite'),store=tx.objectStore('revocacions');tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);
    for(const [id,rejected] of [[ID,true],[ID.replace(/1$/,'2'),false]]) store.put({key:JSON.stringify([scope,id,'publicacio',null]),scope,id,tipus:'publicacio',revision:null,pending:false,rejected,attempt:0});
  }); db.close();
  const sent=[];const q=creaCuaRevocacionsMur({indexedDB,obteAbast:()=>A,envia:async id=>sent.push(id)});
  await q.drena();expect(sent).toEqual([ID]);expect(rows(indexedDB).every(r=>r.pending===false)).toBe(true);
});

/* Gauntlet R22 (dades-02, notes-02) · Una fila de nota sense acte (les que encuaven les versions anteriors per a
   notes mai publicades) que el servidor contesta «no hi ha cap acte» no es reintenta per sempre. */
describe('R22 · una nota sense acte que el servidor no pot retirar no queda pendent per sempre', () => {
  it.each(['SDP-MUR-REVISION', 'SDP-MUR-OWNER'])('%s sense acte: la fila s’esborra, no compta com a pendent i no es torna a enviar', async codi => {
    let calls = 0; const s = setup(async () => { calls++; throw Object.assign(new Error('rebutjat'), { status: codi === 'SDP-MUR-OWNER' ? 403 : 409, codi }); });
    await s.q.encua(ID, { tipus: 'nota', revision: 4 });
    expect(await s.q.drena()).toEqual({ pendents: 0, seguentIntent: null });
    expect(rows(s.indexedDB)).toEqual([]);
    s.advance(600000); await s.q.drena(); expect(calls).toBe(1);
    expect(await s.q.estat(ID, { tipus: 'nota', revision: 4 })).toBeNull();
  });
  it('amb l’acte, el mateix rebuig conserva la voluntat (el servidor convergix per l’acte)', async () => {
    const act = ID.replace(/1$/, '3');
    const s = setup(async () => { throw Object.assign(new Error('rebutjat'), { status: 403, codi: 'SDP-MUR-OWNER' }); });
    await s.q.encua(ID, { tipus: 'nota', revision: 4, publicacioId: act });
    await expect(s.q.drena()).rejects.toMatchObject({ revocacioPendent: true });
    expect(rows(s.indexedDB)[0]).toMatchObject({ pending: true, publicacioId: act });
  });
  it('sense acte, un error de transport o un 5xx continuen pendents', async () => {
    const s = setup(async () => { throw Object.assign(new Error('offline'), { status: 0 }); });
    await s.q.encua(ID, { tipus: 'nota', revision: 4 });
    await expect(s.q.drena()).rejects.toMatchObject({ revocacioPendent: true });
    expect(rows(s.indexedDB)[0]).toMatchObject({ pending: true });
  });
});

/* Onada R29 · PF-04 · Els ACK no s'esborraven mai i el límit els comptava: a partir de 4.096
   retirades confirmades en un dispositiu, cap retirada nova no arribava al servidor. Ara el
   límit compta només les vives i, en la mateixa transacció, es purguen els ACK més vells. */
describe('R29 · PF-04 · el diari de retirades no es tapona amb ACK', () => {
  const SCOPE = JSON.stringify([A.backend, A.tenant, A.user]);
  const idDe = i => `55000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
  const fila = (i, extra) => ({ key: JSON.stringify([SCOPE, idDe(i), 'publicacio', null]), scope: SCOPE, id: idDe(i), tipus: 'publicacio',
    revision: null, publicacioId: null, attempt: 1, nextRetryAt: 0, ...extra });
  async function omple(indexedDB, files) {
    const db = await new Promise((resolve, reject) => { const r = indexedDB.open('sdp-copublicacio-mur-r21', 2);
      r.onupgradeneeded = () => r.result.createObjectStore('revocacions', { keyPath: 'key' }); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
    await new Promise((resolve, reject) => { const tx = db.transaction('revocacions', 'readwrite'), store = tx.objectStore('revocacions');
      tx.oncomplete = resolve; tx.onabort = () => reject(tx.error); for (const f of files) store.put(f); });
    db.close();
  }
  it('amb 4.096 ACK, una retirada nova s’encua i es purga l’ACK més vell (primer els sense hora)', async () => {
    const s = setup();
    /* 4.095 ACK amb hora i un d'abans de R29 sense confirmadaAl (el més vell de tots). */
    await omple(s.indexedDB, [fila(0, { pending: false, rejected: false }),
      ...Array.from({ length: 4095 }, (_, i) => fila(i + 1, { pending: false, rejected: false, confirmadaAl: 1000 + i }))]);
    await s.q.encua(ID);
    const totes = rows(s.indexedDB);
    expect(totes).toHaveLength(4096);
    expect(totes.some(r => r.id === idDe(0))).toBe(false);
    expect(await s.q.estaRetirada(idDe(1))).toBe(true);
    expect(await s.q.estat(ID)).toEqual({ pendent: true, seguentIntent: 0 });
    await s.q.encua(ID.replace(/1$/, '2'));
    expect(rows(s.indexedDB)).toHaveLength(4096);
    expect(await s.q.estaRetirada(idDe(1))).toBe(false);
    expect(await s.q.estaRetirada(idDe(2))).toBe(true);
  });
  it('l’ACK guarda la seua hora per a ordenar la purga', async () => {
    const s = setup(); await s.q.encua(ID); await s.q.drena();
    expect(rows(s.indexedDB)[0]).toMatchObject({ pending: false, confirmadaAl: 10000 });
  });
  it('amb 4.096 retirades vives el diari continua ple i no en perd cap', async () => {
    const s = setup();
    await omple(s.indexedDB, Array.from({ length: 4096 }, (_, i) => fila(i, i % 2 ? { pending: true } : { pending: false, rejected: true })));
    await expect(s.q.encua(ID)).rejects.toMatchObject({ codi: 'MUR_REVOCACIO_PERSISTENCIA', message: 'El diari de retirada està ple.' });
    expect(rows(s.indexedDB)).toHaveLength(4096);
    expect(rows(s.indexedDB).some(r => r.id === ID)).toBe(false);
  });
});


describe('R32.21 · tot rebuig conserva la voluntat durable', () => {
  it.each([undefined, null, false, 0, ''])('un rebuig falsy (%s) no és un ACK', async failure => {
    const s = setup(async () => { throw failure; });
    await s.q.encua(ID);
    await expect(s.q.drena()).rejects.toMatchObject({ revocacioPendent: true, seguentIntent: 11000 });
    expect(rows(s.indexedDB)[0]).toMatchObject({ pending: true, nextRetryAt: 11000, lastStatus: null });
    expect(rows(s.indexedDB)[0]).not.toHaveProperty('confirmadaAl');
    expect(await creaCuaRevocacionsMur(s.options).estat(ID)).toEqual({ pendent: true, seguentIntent: 11000 });
  });
  it.each([
    Object.freeze(Object.assign(new Error('proveïdor indisponible'), { status: 503, codi: 'REINTENTA' })),
    Object.freeze({ status: 503, codi: 'REINTENTA' })
  ])('un error immutable conserva el codi i les dades del reintent sense mutar-lo', async failure => {
    const s = setup(async () => { throw failure; }); await s.q.encua(ID);
    await expect(s.q.drena()).rejects.toMatchObject({ status: 503, codi: 'REINTENTA', revocacioPendent: true, seguentIntent: 11000 });
    expect(failure).not.toHaveProperty('revocacioPendent');
    expect(rows(s.indexedDB)[0]).toMatchObject({ pending: true, nextRetryAt: 11000, lastStatus: 503 });
  });
});


it('R32.21 · un rebuig amb accessors que llancen conserva el context durable del reintent', async () => {
  const failure = Object.freeze(Object.defineProperties({}, Object.fromEntries(
    ['message', 'name', 'codi', 'status'].map(key => [key, { get() { throw new Error(`accessor ${key}`); } }])
  )));
  const s = setup(async () => { throw failure; }); await s.q.encua(ID);
  const caught = await s.q.drena().then(() => null, e => e);
  expect(caught).toMatchObject({ revocacioPendent: true, seguentIntent: 11000 });
  expect(caught.cause).toBe(failure);
  expect(rows(s.indexedDB)[0]).toMatchObject({ pending: true, nextRetryAt: 11000, lastStatus: null });
});
