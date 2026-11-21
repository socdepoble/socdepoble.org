// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { clauDe, creaCua } from './cua.js';
import { creaMagatzem } from './magatzem.js';

const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const ref = { ambit: 'backend|A', entitat: 'fitxa', id: 'id', context: {} };
const cues = [];
afterEach(async () => { await Promise.all(cues.splice(0).map(cua => cua.reinicia())); vi.restoreAllMocks(); });
function crea(escriu) {
  const cua = creaCua({ magatzem: creaMagatzem({ idb: null }), actorActual: () => ref.ambit, finestra: null, document: null, debounceMs: 60_000 });
  cues.push(cua); cua.registraEscriptor('fitxa', { escriu }); return cua;
}

test('R3223-OFF-01: una confirmació anterior al logout no esborra la nova seqüència ni publica text antic', async () => {
  const pendents = [];
  const cua = crea(vi.fn(() => new Promise(resolve => pendents.push(resolve))));
  const confirma = vi.fn(); cua.quanConfirma(confirma);
  cua.encua(ref, 'text', 'Sessió antiga');
  const primer = cua.desaAra(ref); await tick();
  await cua.oblida(ref.ambit);
  cua.recordaContext(ref.ambit, {});
  cua.encua(ref, 'text', 'Sessió nova');
  const segon = cua.desaAra(ref);
  pendents[0]({ fila: { text: 'Sessió antiga' }, revisio: 99 }); await tick();
  expect(cua.llig(ref).camps).toEqual({ text: 'Sessió nova' });
  expect(confirma).not.toHaveBeenCalled();
  expect(pendents).toHaveLength(2);
  pendents[1]({ revisio: 1 }); await Promise.all([primer, segon]);
  expect(confirma).toHaveBeenCalledTimes(1);
  expect(confirma.mock.calls[0][0].canvis.text).toBe('Sessió nova');
});

test('R3223-OFF-02: un rebuig anterior al logout no posa en quarantena una sessió nova', async () => {
  let falla;
  const escriu = vi.fn().mockImplementationOnce(() => new Promise((_resolve, reject) => { falla = reject; })).mockResolvedValue({});
  const cua = crea(escriu);
  cua.encua(ref, 'text', 'Antiga'); const primer = cua.desaAra(ref); await tick();
  await cua.oblida(ref.ambit); cua.recordaContext(ref.ambit, {}); cua.encua(ref, 'text', 'Nova');
  falla(Object.assign(new Error('conflicte antic'), { status: 409 })); await primer;
  expect(cua.llig(ref).errors).toEqual({});
  await cua.desaAra(ref); expect(cua.llig(ref).camps).toEqual({});
});

function idbAmbQuota(entrades = []) {
  const disc = new Map(entrades); let quota = true;
  const db = { objectStoreNames: { contains: () => true }, close() {}, transaction() {
    let request, key, cursor, failed = false;
    const tx = { objectStore: () => ({
      get(k) { key = k; request = {}; return request; },
      put(v, k) { if (quota) failed = true; else disc.set(k, structuredClone(v)); },
      delete(k) { disc.delete(k); }, clear() { disc.clear(); },
      openCursor() { cursor = {}; return cursor; }
    }) };
    queueMicrotask(() => { if (cursor) { const entrades = [...disc]; let i = 0; const passa = () => { const entrada = entrades[i++]; cursor.result = entrada ? { key: entrada[0], value: structuredClone(entrada[1]), continue: passa, delete: () => disc.delete(entrada[0]) } : null; cursor.onsuccess?.(); }; passa(); } if (request) { request.result = disc.get(key); request.onsuccess?.(); } if (failed) { tx.error = Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); tx.onerror?.(); } else tx.oncomplete?.(); });
    return tx;
  } };
  return { recupera: () => { quota = false; }, open() { const request = {}; queueMicrotask(() => { request.result = db; request.onsuccess?.(); }); return request; } };
}

test('R3223-OFF-03: QuotaExceededError no anuncia una còpia durable i es recupera en reescriure', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const idb = idbAmbQuota(); const magatzem = creaMagatzem({ idb });
  expect(await magatzem.desa('k', { text: 'Només RAM' })).toBe(false);
  expect(magatzem.llig('k')).toEqual({ text: 'Només RAM' });
  expect(magatzem.persistent).toBe(false);
  idb.recupera(); expect(await magatzem.desa('k', { text: 'Ja al disc' })).toBe(true);
  expect(magatzem.persistent).toBe(true);
});


test('R3223-OFF-04: la corrupció parcial o un àmbit que no correspon a la clau no entra a la cua', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const bo = { v: 1, ambit: ref.ambit, entitat: ref.entitat, id: ref.id, seq: 1, camps: { text: { valor: 'Bo', versio: 1, error: null } }, actualitzat: 1 };
  const altre = { ...ref, id: 'altra' };
  const idb = idbAmbQuota([['nul', null], [clauDe(ref), bo], [clauDe(altre), { ...bo, ambit: 'backend|B' }], ['parcial', { ...bo, camps: { text: null } }]]);
  const magatzem = creaMagatzem({ idb }); await magatzem.hidrata();
  expect(magatzem.llista()).toEqual([bo]);
});


test('Gauntlet: un oient que tanca sessió no deixa arribar una confirmació antiga als altres', async () => {
  const cua = crea(async () => ({}));
  const segon = vi.fn(); cua.quanConfirma(() => { void cua.oblida(ref.ambit); }); cua.quanConfirma(segon);
  cua.encua(ref, 'text', 'Privat'); await cua.desaAra(ref);
  expect(segon).not.toHaveBeenCalled();
});
