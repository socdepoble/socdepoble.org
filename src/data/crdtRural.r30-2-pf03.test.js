import { describe, expect, test, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { creaSessioRural } from './sessioRural.js';
import { estatCrdtRuralBuit, canviaCrdtRural, fusionaCrdtRural, preparaSincronitzacioCrdtRural,
  registraAckCrdtRural, compactaCrdtRural, projectaCrdtRural, RETENCIO_TOMBSTONES_RURAL_MS } from './crdtRural.js';
const remote = 'https://replica.example';
const t0 = Date.parse('2026-01-01T00:00:00.000Z');
const join = (...states) => states.reduce(fusionaCrdtRural, estatCrdtRuralBuit());
const note = id => ({ title: id, content: 'Contingut conservat', slug: id });
function confirma(state, time, requestId) {
  const p = preparaSincronitzacioCrdtRural(state, requestId);
  return registraAckCrdtRural(state, p, { schema: 'sdp.rural.remote-ack.v1', requestId, sha256: p.sha256,
    frontera: p.frontera, autoritat: remote, confirmatEl: new Date(time).toISOString(), ack_remot_confirmat: true }, remote);
}
describe('PF-03 · fronteres remotes i compactació causal', () => {
  test('compactació selectiva: es retira el payload suprimit; la nota viva conserva text i causalitat', () => {
    const a = canviaCrdtRural(estatCrdtRuralBuit(), { id: 'a', replica: 'A', comptador: 1, nota: note('a') });
    const b = canviaCrdtRural(estatCrdtRuralBuit(), { id: 'b', replica: 'B', comptador: 1, nota: note('b') });
    const d = canviaCrdtRural(a, { id: 'a', replica: 'A', comptador: 2, elimina: true });
    const original = join(a, b, d);
    const compactat = compactaCrdtRural(confirma(confirma(original, t0, 'first'), t0 + RETENCIO_TOMBSTONES_RURAL_MS + 1, 'second'));
    expect(compactat.ops).toHaveLength(1);
    expect(projectaCrdtRural(compactat).notes).toMatchObject([{ id: 'b', content: 'Contingut conservat' }]);
    expect(join(original, compactat)).toEqual(compactat);
  });
  test('desconnexió llarga: operació no confirmada queda pendent i el registre suprimit no ressuscita', () => {
    const a = canviaCrdtRural(estatCrdtRuralBuit(), { id: 'a', replica: 'A', comptador: 1, nota: note('a') });
    const d = canviaCrdtRural(a, { id: 'a', replica: 'A', comptador: 2, elimina: true });
    const offline = canviaCrdtRural(a, { id: 'a', replica: 'B', comptador: 1, nota: { ...note('a'), content: 'Edició desconnectada' } });
    const compactat = compactaCrdtRural(confirma(confirma(join(a, d), t0, 'first'), t0 + RETENCIO_TOMBSTONES_RURAL_MS + 1, 'second'));
    const merged = join(offline, a, compactat, d);
    expect(projectaCrdtRural(merged)).toEqual({ notes: [], esborrades: [], pendents: 1, reconciliacions: ['a'] });
    expect(merged.ops[0].insert.text).toBe('Edició desconnectada');
    expect(join(compactat, join(d, join(a, offline)))).toEqual(merged);
  });
});


test('R32.10 · stalled remote transport has a 15 second deadline, aborts and ignores a late acknowledgement', async () => {
  const s = await creaSessioRural({ abast: { persona: 'actor', tenant: 'torre', endpoint: 'seed', mode: 'seed' }, municipi: 'La Torre', motor: 'memoria', memoria: new Map(), crdt: true, crypto: webcrypto, BroadcastChannel: null });
  await s.desaNota({ title: 'Private draft', content: 'Kept locally' });
  let enter, release, transportSignal, outcome;
  const entered = new Promise(resolve => { enter = resolve; });
  const stalled = new Promise(resolve => { release = resolve; });
  vi.useFakeTimers();
  try {
    const pending = s.sincronitzaRemot({ tipus: 'remot', autoritat: remote, envia: (request, options) => {
      transportSignal = options.signal; enter(request); return stalled;
    } });
    pending.then(value => { outcome = { value }; }, error => { outcome = { error }; });
    const request = await entered;
    await vi.advanceTimersByTimeAsync(15000);
    expect(outcome?.error).toMatchObject({ code: 'RURAL_CRDT_REMOTE_TIMEOUT' });
    expect(transportSignal.aborted).toBe(true);
    expect((await s.exportaVault()).crdt.sincronitzacio).toBeUndefined();
    release({ schema: 'sdp.rural.remote-ack.v1', requestId: request.requestId, sha256: request.sha256, frontera: request.frontera, autoritat: remote, confirmatEl: '2026-01-01T00:00:00.000Z', ack_remot_confirmat: true });
    await vi.advanceTimersByTimeAsync(0);
    expect((await s.exportaVault()).crdt.sincronitzacio).toBeUndefined();
    await s.sincronitzaRemot({ tipus: 'remot', autoritat: remote, envia: async request => ({ schema: 'sdp.rural.remote-ack.v1', requestId: request.requestId, sha256: request.sha256, frontera: request.frontera, autoritat: remote, confirmatEl: '2026-01-01T00:00:00.000Z', ack_remot_confirmat: true }) });
    expect((await s.exportaVault()).crdt.sincronitzacio.acks).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
  } finally { s.close(); vi.useRealTimers(); }
});
