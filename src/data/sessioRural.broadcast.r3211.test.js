import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { creaSessioRural } from './sessioRural.js';
import { registraAckCrdtRural, compactaCrdtRural, fusionaCrdtRural, projectaCrdtRural,
  RETENCIO_TOMBSTONES_RURAL_MS } from './crdtRural.js';
class CanalControlat {
  static canals = new Set(); static pendents = [];
  constructor(name) { this.name = name; this.onmessage = null; CanalControlat.canals.add(this); }
  postMessage(data) {
    for (const canal of CanalControlat.canals) if (canal !== this && canal.name === this.name) {
      CanalControlat.pendents.push({ fn: canal.onmessage, data: structuredClone(data) });
    }
  }
  close() { CanalControlat.canals.delete(this); }
  static enviaDuplicatsForaOrdre() {
    const events = CanalControlat.pendents.splice(0).reverse();
    for (const event of [...events, ...events]) event.fn?.({ data: event.data });
  }
}
const AB = { persona: 'persona-a', tenant: 'torre', endpoint: 'https://node.example', mode: 'local' };
const memory = new Map(), sessions = [];
const t0 = Date.parse('2026-01-01T00:00:00.000Z'), autoritat = 'https://remot.example';
async function obri(extra = {}) {
  const s = await creaSessioRural({ abast: AB, municipi: 'La Torre', motor: 'memoria', memoria: memory,
    crypto: webcrypto, crdt: true, ara: () => t0, BroadcastChannel: CanalControlat, ...extra });
  sessions.push(s); return s;
}
const ack = (p, when = t0) => ({ schema: 'sdp.rural.remote-ack.v1', requestId: p.requestId, sha256: p.sha256,
  frontera: p.frontera, autoritat, confirmatEl: new Date(when).toISOString(), ack_remot_confirmat: true });
beforeEach(() => { memory.clear(); CanalControlat.canals.clear(); CanalControlat.pendents.length = 0; });
afterEach(() => { sessions.splice(0).forEach(s => s.close()); expect(CanalControlat.canals.size).toBe(0); });

test('tres pestanyes concurrents convergixen amb notificacions duplicades/fora d’ordre i reinici d’una caiguda', async () => {
  const canvis = [vi.fn(), vi.fn(), vi.fn()];
  const [a, b, c] = await Promise.all(canvis.map(onCanvi => obri({ onCanvi })));
  await Promise.all([a.desaNota({ title: 'Camí', content: 'Camí obert' }), b.desaNota({ title: 'Font', content: 'Aigua' }), c.desaNota({ title: 'Forn', content: 'Pa' })]);
  CanalControlat.enviaDuplicatsForaOrdre();
  await vi.waitFor(() => expect(canvis.every(fn => fn.mock.calls.length > 0)).toBe(true));
  const estats = await Promise.all([a.estat(), b.estat(), c.estat()]);
  expect(estats[0]).toEqual(estats[1]); expect(estats[1]).toEqual(estats[2]);
  expect(estats[0]).toMatchObject({ pendents: 3, sequenciaCua: 3, cadenaValida: true });
  const id = estats[0].notes.find(n => n.title === 'Camí').id;
  const [baseA, baseB] = await Promise.all([a.preparaEdicio(id), b.preparaEdicio(id)]);
  await Promise.all([a.editaNota({ id, base: baseA.base, title: 'Camí', content: 'Camí A' }), b.editaNota({ id, base: baseB.base, title: 'Camí', content: 'Camí B' })]);
  const esperat = await a.exportaVault();
  expect(esperat.crdt.ops).toHaveLength(5); expect(new Set(esperat.crdt.ops.map(op => op.replica)).size).toBe(3);
  const notificacionsAbans = canvis[1].mock.calls.length; b.close();
  CanalControlat.enviaDuplicatsForaOrdre();
  await Promise.resolve(); expect(canvis[1]).toHaveBeenCalledTimes(notificacionsAbans);
  await expect(b.estat()).rejects.toThrow('tancat');
  const reiniciada = await obri();
  expect((await reiniciada.exportaVault()).crdt).toEqual(esperat.crdt);
  expect((await reiniciada.estat()).notes.find(n => n.id === id).content).toContain('A');
  expect((await reiniciada.estat()).notes.find(n => n.id === id).content).toContain('B');
});

test('persona, tenant i backend tenen canals separats; logout invalida la pestanya antiga abans de qualsevol lectura', async () => {
  let activa = true; const canvi = vi.fn(), invalidada = vi.fn();
  const a = await obri();
  const antiga = await obri({ onCanvi: canvi, onInvalidada: invalidada, comprovaAbast: () => { if (!activa) throw new Error('Logout'); } });
  const altres = await Promise.all([{ persona: 'persona-b' }, { tenant: 'xixona' }, { endpoint: 'https://altre.example' }].map(d => obri({ abast: { ...AB, ...d } })));
  expect(new Set([...CanalControlat.canals].map(c => c.name)).size).toBe(4);
  await a.desaNota({ title: 'Privada', content: 'Només A' });
  activa = false; CanalControlat.enviaDuplicatsForaOrdre();
  await vi.waitFor(() => expect(invalidada).toHaveBeenCalledTimes(1));
  expect(canvi).not.toHaveBeenCalled();
  await expect(antiga.estat()).rejects.toThrow('tancat');
  for (const s of altres) expect((await s.estat()).notes).toEqual([]);
});

test('esborrar en una pestanya invalida les altres i cap notificació antiga ressuscita el diari', async () => {
  const a = await obri(), invalidada = vi.fn(), b = await obri({ onInvalidada: invalidada });
  await a.desaNota({ title: 'Temporal', content: 'Contingut privat' });
  await a.esborraTot();
  CanalControlat.enviaDuplicatsForaOrdre();
  await vi.waitFor(() => expect(invalidada).toHaveBeenCalledTimes(1));
  await expect(b.desaNota({ title: 'Tardana', content: 'No ha d’entrar' })).rejects.toThrow('tancat');
  const nova = await obri();
  expect(await nova.estat()).toMatchObject({ notes: [], pendents: 0, cadenaValida: true });
  CanalControlat.enviaDuplicatsForaOrdre();
  expect((await nova.estat()).notes).toEqual([]);
});

test('close manual mentre les comprovacions de generació volen no emet invalidacions tardanes ni bloqueja el magatzem', async () => {
  const a = await obri(), invalidada = vi.fn(), b = await obri({ onInvalidada: invalidada });
  await a.desaNota({ title: 'Tancament', content: 'Comprovació en vol' });
  await a.esborraTot();
  CanalControlat.enviaDuplicatsForaOrdre();
  b.close();
  /* Totes les notificacions han iniciat read(); close és explícit i les
     respostes posteriors ja no poden invalidar un consumidor retirat. */
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(invalidada).not.toHaveBeenCalled();
  await expect(b.estat()).rejects.toThrow('tancat');
  const nova = await obri();
  expect(await nova.estat()).toMatchObject({ notes: [], pendents: 0 });
});

test('un missatge de canal no és ACK: captura antiga, operació local concurrent i frontera estrictament superior a 90 dies', async () => {
  const a = await obri(), b = await obri();
  await a.desaNota({ title: 'Retirada', content: 'Payload retirat' });
  const id = (await a.estat()).notes[0].id, base = (await a.preparaEdicio(id)).base;
  await a.eliminaNota({ id, base });
  let captura, release, entered;
  const entrada = new Promise(r => { entered = r; });
  const pendent = a.sincronitzaRemot({ tipus: 'remot', autoritat, envia: request => {
    captura = request; entered(); return new Promise(r => { release = r; });
  } });
  await entrada;
  await b.desaNota({ title: 'Local només', content: 'Conserva este payload' });
  [...CanalControlat.canals][0].postMessage({ tipus: 'ack', ...ack(captura, t0 + RETENCIO_TOMBSTONES_RURAL_MS + 1) });
  CanalControlat.enviaDuplicatsForaOrdre();
  expect((await b.exportaVault()).crdt.sincronitzacio).toBeUndefined();
  release(ack(captura)); await pendent;
  const estat = (await a.exportaVault()).crdt;
  expect(estat.ops).toHaveLength(3); expect(estat.sincronitzacio.acks).toHaveLength(2);
  const exact90 = compactaCrdtRural(registraAckCrdtRural(estat, captura, ack(captura, t0 + RETENCIO_TOMBSTONES_RURAL_MS), autoritat));
  expect(exact90.ops).toHaveLength(3);
  const mes90 = compactaCrdtRural(registraAckCrdtRural(estat, captura, ack(captura, t0 + RETENCIO_TOMBSTONES_RURAL_MS + 1), autoritat));
  expect(mes90.ops).toHaveLength(1);
  expect(mes90.ops[0].insert.text).toBe('Conserva este payload');
  expect(projectaCrdtRural(fusionaCrdtRural(captura.crdt, mes90)).notes.map(n => n.title)).toEqual(['Local només']);
});
