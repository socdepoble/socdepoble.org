import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { creaSessioRural } from '../src/data/sessioRural.js';
import { CarpetaFalsa, textFals } from './helpers/carpetaLocalFalsa.js';
import { sincronitzaCrdtAmbDirectoryHandle, ESQUEMA_BATCH_CRDT_VAULT } from '../src/data/sincronitzadorCarpetaLocal.js';
import { sha256Hex, canonitzaJsonJcs } from '../src/data/federacio/portabilitatFediversity.js';
import { estatCrdtRuralBuit, canviaCrdtRural, fusionaCrdtRural, projectaCrdtRural, compactaCrdtRural,
  preparaSincronitzacioCrdtRural, registraAckCrdtRural, normalitzaCrdtRural, RETENCIO_TOMBSTONES_RURAL_MS } from '../src/data/crdtRural.js';
const AUTORITAT = 'https://replica.example';
const INICI = Date.parse('2026-01-01T00:00:00.000Z');
const iso = n => new Date(n).toISOString();
const nota = (content = 'Cos original') => ({ title: 'Nota', content, slug: 'nota', folderId: 'camp', tags: [], prioritat: 'normal', updatedAt: '2099-12-31T00:00:00Z' });
const empty = estatCrdtRuralBuit;
const dot = op => `${op.replica}:${op.comptador}`;
const join = (...ss) => ss.reduce(fusionaCrdtRural, empty());
const genesis = () => canviaCrdtRural(empty(), { id: 'nota', replica: 'base', comptador: 1, nota: nota() });
const elimina = g => canviaCrdtRural(g, { id: 'nota', replica: 'delete', comptador: 1, elimina: true });
const ack = (p, n = INICI) => ({ schema: 'sdp.rural.remote-ack.v1', requestId: p.requestId, sha256: p.sha256,
  frontera: p.frontera, autoritat: AUTORITAT, confirmatEl: iso(n), ack_remot_confirmat: true });
function confirma(s, n, id = 'request') { const p = preparaSincronitzacioCrdtRural(s, id); return registraAckCrdtRural(s, p, ack(p, n), AUTORITAT); }
function retirat() {
  const g = genesis(), d = elimina(g), original = join(g, d);
  const confirmat = confirma(original, INICI);
  return { g, d, original, compactat: compactaCrdtRural(confirma(confirmat, INICI + RETENCIO_TOMBSTONES_RURAL_MS + 1, 'late')) };
}
test('PF03: sense ACK, ACK fals i límit exacte de 90 dies no autoritzen compactació', () => {
  const g = genesis(), s = join(g, elimina(g));
  assert.deepEqual(compactaCrdtRural(s), s);
  const p = preparaSincronitzacioCrdtRural(s, 'first');
  for (const canvi of [{ ack_remot_confirmat: false }, { sha256: '0'.repeat(64) }, { requestId: 'replay' }, { frontera: [] }, { autoritat: 'https://other.example' }, { confirmatEl: 'ahir' }]) {
    assert.throws(() => registraAckCrdtRural(s, p, { ...ack(p), ...canvi }, AUTORITAT));
    assert.deepEqual(compactaCrdtRural(s), s);
  }
  const a = confirma(s, INICI), exact = confirma(a, INICI + RETENCIO_TOMBSTONES_RURAL_MS, 'exact');
  assert.equal(compactaCrdtRural(exact).ops.length, 2);
  assert.equal(retirat().compactat.ops.length, 0);
});
test('PF03: certificat compacte permanent, replay antic idempotent i zero resurrecció', () => {
  const { original, compactat } = retirat();
  assert.equal(compactat.sincronitzacio.retirades.length, 1);
  assert.equal(projectaCrdtRural(compactat).notes.length, 0);
  assert.deepEqual(join(compactat, original), compactat);
  assert.deepEqual(join(original, compactat), compactat);
  assert.deepEqual(join(compactat, compactat), compactat);
  assert.deepEqual(compactaCrdtRural(compactat), compactat);
  const equivocat = structuredClone(original); equivocat.ops[0].camps.title = 'Un altre contingut amb el mateix DOT';
  assert.throws(() => join(compactat, equivocat), { code: 'RURAL_CRDT_DOT_EQUIVOCATION' });
});
test('PF03: tots els ordres/particions convergeixen i preserven edició desconnectada pendent', () => {
  const { g, original, compactat } = retirat();
  const tardana = canviaCrdtRural(g, { id: 'nota', replica: 'offline', comptador: 1, nota: nota('Edició conservada després de 8 mesos') });
  const esperat = join(compactat, tardana);
  const permuta = xs => xs.length ? xs.flatMap((x, i) => permuta(xs.filter((_, j) => i !== j)).map(rest => [x, ...rest])) : [[]];
  for (const ordre of permuta([g, original, compactat, tardana])) {
    assert.deepEqual(join(...ordre), esperat);
    assert.deepEqual(join(join(ordre[0], ordre[1]), join(ordre[2], ordre[3])), esperat);
  }
  assert.deepEqual(projectaCrdtRural(esperat), { notes: [], esborrades: [], pendents: 1, reconciliacions: ['nota'] });
  assert.equal(esperat.ops[0].insert.text, 'Edició conservada després de 8 mesos');
});
test('PF03: document viu, supressió concurrent i dependències pendents no es compacten', () => {
  const g = genesis(), d = elimina(g), canvi = canviaCrdtRural(g, { id: 'nota', replica: 'other', comptador: 1, nota: nota('Edició concurrent') });
  const s = confirma(confirma(join(g, d, canvi), INICI), INICI + RETENCIO_TOMBSTONES_RURAL_MS + 1, 'later');
  assert.equal(compactaCrdtRural(s).ops.length, 3);
  assert.equal(projectaCrdtRural(s).notes[0].content, 'Edició concurrent');
  assert.throws(() => preparaSincronitzacioCrdtRural(d, 'orphan'), { code: 'RURAL_CRDT_DEPENDENCIES_PENDING' });
});
test('PF03: regressió del rellotge remot i rebuts de captures alienes fallen tancats', () => {
  const g = genesis(), s = confirma(g, INICI), p = preparaSincronitzacioCrdtRural(s, 'clock');
  assert.throws(() => registraAckCrdtRural(s, p, ack(p, INICI - 1), AUTORITAT), { code: 'RURAL_CRDT_ACK_CLOCK_REGRESSION' });
  const aliena = canviaCrdtRural(empty(), { id: 'altra', replica: 'altra', comptador: 1, nota: nota() });
  const pa = preparaSincronitzacioCrdtRural(aliena, 'alien');
  assert.throws(() => registraAckCrdtRural(s, pa, ack(pa), AUTORITAT), { code: 'RURAL_CRDT_ACK_INVALID' });
});
const AB = { persona: 'persona', tenant: 'torre', endpoint: 'seed', mode: 'seed' };
async function sessio(t, memoria, offset = 0) {
  const s = await creaSessioRural({ abast: AB, municipi: 'La Torre', motor: 'memoria', memoria, crdt: true,
    crypto: webcrypto, BroadcastChannel: null, ara: () => INICI + offset });
  t.after(() => s.close()); return s;
}
const transport = n => ({ tipus: 'remot', autoritat: AUTORITAT, envia: async p => ack(p, n) });
test('PF03: sessió real persistix ACK, compacta en consolidar i suporta reinici i rellotges locals desfasats', async t => {
  for (const offset of [-365 * 86400000, 365 * 86400000]) {
    const memoria = new Map(), s = await sessio(t, memoria, offset);
    const id = (await s.desaNota({ title: 'Nota', content: 'Payload llarg '.repeat(100) })).notes[0].id;
    await s.eliminaNota({ id, base: (await s.preparaEdicio(id)).base });
    const vell = await s.exportaVault();
    assert.equal((await s.estat()).sincronitzacioRemota, undefined);
    await s.sincronitzaRemot(transport(INICI));
    await s.sincronitzaRemot(transport(INICI + RETENCIO_TOMBSTONES_RURAL_MS + 1));
    await s.consolidaDiari();
    const p = await s.exportaVault();
    assert.equal(p.crdt.ops.length, 0); assert.equal(p.crdt.sincronitzacio.retirades.length, 1);
    assert.ok(JSON.stringify(p).length < JSON.stringify(vell).length);
    s.close();
    const b = await sessio(t, memoria);
    await b.importaVault(vell);
    assert.equal((await b.estat()).notes.length, 0);
    assert.equal((await b.exportaVault()).crdt.ops.length, 0);
    assert.deepEqual((await b.exportaVault()).crdt, p.crdt);
  }
});
test('PF03: desament i carpeta locals mai són ACK; transport local és refusat', async t => {
  const memoria = new Map(), s = await sessio(t, memoria);
  await s.desaNota({ title: 'Local', content: 'Només local' }); await s.consolidaDiari();
  assert.equal((await s.exportaVault()).crdt.sincronitzacio, undefined);
  await assert.rejects(s.sincronitzaRemot({ ...transport(INICI), tipus: 'local' }), { code: 'RURAL_CRDT_REMOTE_REQUIRED' });
  const p = await s.exportaVault(), result = await sincronitzaCrdtAmbDirectoryHandle(new CarpetaFalsa('local'), { crdt: p.crdt });
  assert.equal(result.crdt.sincronitzacio, undefined);
});
test('PF03: edició durant ACK no rep confirmació d’una captura anterior', async t => {
  const s = await sessio(t, new Map()); await s.desaNota({ title: 'A', content: 'Primer' });
  let entra, allibera;
  const dins = new Promise(r => { entra = r; }), espera = new Promise(r => { allibera = r; });
  const op = s.sincronitzaRemot({ ...transport(INICI), envia: async p => { entra(); await espera; return ack(p); } });
  await dins; await s.desaNota({ title: 'B', content: 'Durant transport' }); allibera(); await op;
  const p = await s.exportaVault(), acks = new Set(p.crdt.sincronitzacio.acks.map(a => a.dot));
  assert.equal(p.crdt.ops.length, 2); assert.equal(acks.size, 1);
  assert.equal(acks.has(dot(p.crdt.ops.find(o => o.camps.title === 'B'))), false);
});
test('PF03: tancar o fallar transport no deixa ACK durable', async t => {
  const memoria = new Map(), s = await sessio(t, memoria); await s.desaNota({ title: 'Nota', content: 'Original' });
  await assert.rejects(s.sincronitzaRemot({ ...transport(INICI), envia: async () => { throw new Error('Offline'); } }), /Offline/);
  assert.equal((await s.exportaVault()).crdt.sincronitzacio, undefined);
  let entra, allibera; const dins = new Promise(r => { entra = r; }), espera = new Promise(r => { allibera = r; });
  const pendent = s.sincronitzaRemot({ ...transport(INICI), envia: async p => { entra(); await espera; return ack(p); } });
  await dins; s.close(); allibera(); await assert.rejects(pendent, /tancat/);
  assert.equal((await (await sessio(t, memoria)).exportaVault()).crdt.sincronitzacio, undefined);
});
/* Onada R32 · D-R30-1 · Correcció de l'àrbitre R32. El certificat és del dispositiu que l'ha fet amb el seu ACK
   remot. La carpeta propaga la supressió com a operació ordinària, mai el certificat. El Markdown antic es
   conserva intacte i pendent, sense tornar el payload a les operacions. Cap dispositiu el ressuscita. */
test('PF03: carpeta propaga la supressió, no el certificat; Markdown antic es conserva intacte i pendent, mai ressuscita', async () => {
  const folder = new CarpetaFalsa('compartida'), { g, compactat } = retirat();
  await sincronitzaCrdtAmbDirectoryHandle(folder, { crdt: g });
  const md = [...folder.fills.keys()].filter(n => n.endsWith('.md')).sort(), abans = md.map(n => textFals(folder, n));
  const r = await sincronitzaCrdtAmbDirectoryHandle(folder, { crdt: compactat });
  assert.equal(projectaCrdtRural(r.crdt).notes.length, 0);
  assert.deepEqual(r.crdt.ops, [], 'el payload retirat no torna a les operacions');
  assert.deepEqual(r.reconciliacionsCarpeta, md);
  assert.deepEqual(md.map(n => textFals(folder, n)), abans, 'el Markdown extern no es toca');
  const lots = [...folder.fills.keys()].filter(n => n.startsWith('.sdp-crdt-')).map(n => JSON.parse(textFals(folder, n)).crdt);
  assert.equal(lots.some(l => l.sincronitzacio !== undefined), false);
  const nova = await sincronitzaCrdtAmbDirectoryHandle(folder, { crdt: empty() });
  assert.equal(projectaCrdtRural(nova.crdt).notes.length, 0);
  assert.deepEqual(projectaCrdtRural(nova.crdt).esborrades.map(n => n.id), ['nota']);
  assert.equal(nova.crdt.sincronitzacio, undefined);
  assert.ok(nova.crdt.ops.some(op => op.insert.text === 'Cos original'));
});
test('PF03 · R32: un certificat aliè (paquet o carpeta) no purga ni amaga cap nota viva', async t => {
  const s = await sessio(t, new Map());
  const id = (await s.desaNota({ title: 'Diari', content: 'Text que no es pot perdre' })).notes[0].id;
  const copia = (await s.exportaVault()).crdt;
  // Qui té una còpia fabrica una supressió i dos rebuts inventats separats per més de 90 dies.
  const supressio = canviaCrdtRural({ schema: copia.schema, ops: copia.ops }, { id, replica: 'aliena', comptador: 1, elimina: true });
  const fals = compactaCrdtRural(confirma(confirma(join(copia, supressio), INICI), INICI + RETENCIO_TOMBSTONES_RURAL_MS + 1, 'late'));
  assert.deepEqual([fals.ops.length, fals.sincronitzacio.retirades.length], [0, 1]);
  const viva = estat => estat.notes.map(n => [n.id, n.content]);
  await s.importaVault({ schema: 'sdp.rural.crdt-bundle.v1', createdAt: iso(INICI), crdt: fals, sha256: sha256Hex(canonitzaJsonJcs(fals)) });
  assert.deepEqual(viva(await s.estat()), [[id, 'Text que no es pot perdre']]);
  const exportat = (await s.exportaVault()).crdt;
  assert.deepEqual(exportat.sincronitzacio.retirades, []);
  assert.ok(JSON.stringify(exportat).includes('Text que no es pot perdre'));
  // Pel camí de la carpeta: un altre escriptor hi deixa un lot amb el certificat.
  const folder = new CarpetaFalsa('compartida'), lot = { schema: fals.schema, ops: [], sincronitzacio: fals.sincronitzacio };
  const sha256 = sha256Hex(canonitzaJsonJcs(lot));
  folder.afig(`.sdp-crdt-${sha256}.json`, JSON.stringify({ schema: ESQUEMA_BATCH_CRDT_VAULT, crdt: lot, sha256 }, null, 2));
  const r = await sincronitzaCrdtAmbDirectoryHandle(folder, { crdt: copia });
  assert.deepEqual(projectaCrdtRural(r.crdt).notes.map(n => [n.id, n.content]), [[id, 'Text que no es pot perdre']]);
  assert.equal(r.crdt.sincronitzacio, undefined);
});
test('PF03: un certificat sense supressió causal vàlida no pot retirar una nota viva', () => {
  const { compactat } = retirat();
  for (const muta of [
    p => { p.sincronitzacio.retirades[0].supressions = []; },
    p => { p.sincronitzacio.retirades[0].supressions[0].elimina = false; },
    p => { p.sincronitzacio.retirades[0].dots[0].parents = ['absent:1']; },
    p => { p.sincronitzacio.retirades[0].supressions[0].parents = []; },
  ]) {
    const fals = structuredClone(compactat); muta(fals);
    assert.throws(() => normalitzaCrdtRural(fals));
    assert.throws(() => join(genesis(), fals));
  }
});
test('PF03: importar ACK locals no autentica rebuts ni permet compactar; transport configurat és explícit', async t => {
  const { original } = retirat();
  const falsificable = confirma(confirma(original, INICI), INICI + RETENCIO_TOMBSTONES_RURAL_MS + 1, 'late');
  const s = await sessio(t, new Map());
  await s.importaVault({ schema: 'sdp.rural.crdt-bundle.v1', createdAt: iso(INICI), crdt: falsificable, sha256: sha256Hex(canonitzaJsonJcs(falsificable)) });
  const importat = await s.exportaVault();
  assert.equal(importat.crdt.sincronitzacio.acks.length, 0);
  assert.equal(importat.crdt.sincronitzacio.fronteres.length, 0);
  await s.consolidaDiari(); assert.equal((await s.exportaVault()).crdt.ops.length, 2);
  const configurada = await creaSessioRural({ abast: AB, municipi: 'La Torre', motor: 'memoria', memoria: new Map(), crdt: true,
    crypto: webcrypto, BroadcastChannel: null, transportCrdtRemot: transport(INICI) });
  t.after(() => configurada.close());
  await configurada.desaNota({ title: 'Configurada', content: 'Captura' });
  assert.equal((await configurada.sincronitzaRemot()).sincronitzacioRemota.acks.length, 1);
});
