/* Onada R30 · PF-03 · Compactació segura de la carpeta CRDT del Mode Rural.
   Decisió de la IAIA MarIA (pla R30 §4): es preserven els tombstones vius i només
   es compacten entrades amb ACK confirmat i antiguitat de més de 90 dies.
   Una prova per invariant: (1) sense ACK, (2) 90 dies o menys, (3) tombstones i
   estat materialitzat, (4) idempotència, (5) ordre segur davant tall, (6) determinisme.
   El rellotge és injectable (`ara`) i els ACK es passen com a dades.
   Correccions de l'àrbitre (Onada R30 · d1): (7) capacitat de la carpeta, (8) maduresa de la
   superació d'una projecció, ordre ACK/commit de la sessió, relectura de projeccions, pressupost
   de temps, ACK implausibles i fallada de l'ACK.
   Onada R32 · fusió amb la frontera causal de Codex R30.2 (D-R30-1) i correcció de l'àrbitre: (9) la carpeta
   no porta mai ACK, fronteres ni certificats (un certificat aliè no s'aplica i el seu lot no ix mai), la
   supressió hi viatja com a operació ordinària i cap instantània consolida payload retirat, tampoc en la
   mateixa passada; (10) un Markdown d'una nota retirada es conserva intacte i no torna a les operacions;
   l'ACK local de la sessió no és ACK remot. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import * as vault from '../src/data/sincronitzadorCarpetaLocal.js';
import { creaSessioRural } from '../src/data/sessioRural.js';
import { estatCrdtRuralBuit, canviaCrdtRural, fusionaCrdtRural, projectaCrdtRural, baseNotaCrdtRural,
  preparaSincronitzacioCrdtRural, registraAckCrdtRural, compactaCrdtRural, RETENCIO_TOMBSTONES_RURAL_MS } from '../src/data/crdtRural.js';
import { canonitzaJsonJcs, sha256Hex } from '../src/data/federacio/portabilitatFediversity.js';
import { CarpetaFalsa, textFals } from './helpers/carpetaLocalFalsa.js';
import { creaBloquejosOpfsFalsos } from './helpers/bloquejosOpfsFalsos.js';

const DIA = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 6, 1);
const NOVANTA = vault.DIES_COMPACTACIO_CRDT_VAULT * DIA;
const iso = ms => new Date(ms).toISOString();
const nota = (content, title = 'Nota') => ({ title, content, slug: 'nota', folderId: 'camp', tags: [], updatedAt: '2026-07-01T00:00:00Z' });
const esBatch = nom => nom.startsWith('.sdp-crdt-');
const noms = root => [...root.fills.keys()].sort();
const instantaniaCarpeta = root => noms(root).map(nom => [nom, textFals(root, nom)]);
const estatCarpeta = root => noms(root).filter(esBatch)
  .reduce((s, nom) => fusionaCrdtRural(s, JSON.parse(textFals(root, nom)).crdt), estatCrdtRuralBuit());
const canon = s => canonitzaJsonJcs(s);
const ackTots = (noms, ms) => Object.fromEntries(noms.map(nom => [nom, iso(ms)]));
const sync = (root, crdt, opcions = {}) => vault.sincronitzaCrdtAmbDirectoryHandle(root, { crdt, ...opcions });
const SENSE_CANVIS = { instantania: null, contenidors: [], batchesRetirats: [], projeccionsRetirades: [], error: null };
const MAX_BYTES = 4 * 1024 * 1024;
/* Cronòmetre aturat per a les passades grosses del segon àrbitre: en una màquina carregada, 4 s reals no hi
   arriben, i el pressupost de temps ja té una prova pròpia. */
const SENSE_PRESSA = () => 0;
const bytesText = text => new TextEncoder().encode(text).length;
const bytesCarpeta = root => noms(root).reduce((n, nom) => n + bytesText(textFals(root, nom)), 0);
const nomLot = crdt => `.sdp-crdt-${sha256Hex(canonitzaJsonJcs(crdt))}.json`;
const textLot = crdt => JSON.stringify({ schema: vault.ESQUEMA_BATCH_CRDT_VAULT, crdt, sha256: sha256Hex(canonitzaJsonJcs(crdt)) }, null, 2);

/* Història amb tombstones: «a» perd «cd» (rangs eliminats) i «b» s'elimina sencera.
   Cada pas se sincronitza: 5 batches i 4 projeccions (3 de «a», 1 de «b»). */
async function historia(root) {
  let s = estatCrdtRuralBuit(), comptador = 0;
  const estats = [];
  const pas = async (id, opcions) => {
    s = fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, id), { id, replica: 'A', comptador: ++comptador, ...opcions }));
    s = (await sync(root, s)).crdt; estats.push(s);
  };
  await pas('a', { nota: nota('abcdef') });
  await pas('a', { nota: nota('abXef') });
  await pas('b', { nota: nota('temporal', 'B') });
  await pas('b', { elimina: true });
  await pas('a', { nota: nota('abXefg') });
  return { s, estats };
}
async function preparada() {
  const root = new CarpetaFalsa('vault');
  const { s, estats } = await historia(root);
  const confirmats = (await sync(root, s)).confirmats;
  return { root, s, estats, confirmats };
}

test('punt de partida: la història deixa 5 batches, 4 projeccions i els tombstones a la carpeta', async () => {
  const { root, s, confirmats } = await preparada();
  assert.equal(noms(root).filter(esBatch).length, 5);
  assert.equal(noms(root).filter(n => n.endsWith('.md')).length, 4);
  assert.deepEqual(confirmats, noms(root));
  const p = projectaCrdtRural(s);
  assert.deepEqual(p.notes.map(n => [n.id, n.content]), [['a', 'abXefg']]);
  assert.deepEqual(p.esborrades.map(n => n.id), ['b']);
  assert.equal(canon(estatCarpeta(root)), canon(s));
});

test('sense acks (crida antiga) no hi ha compactació ni cap retirada', async () => {
  const { root, s } = await preparada();
  const abans = instantaniaCarpeta(root);
  const r = await sync(root, s, { ara: () => T0 + 1000 * DIA });
  assert.equal(r.compactacio, null);
  assert.deepEqual(instantaniaCarpeta(root), abans);
  assert.equal(root.registre.some(([op]) => op === 'removeEntry'), false);
});

test('(1) cap entrada sense ACK confirmat es compacta, encara que siga molt antiga', async () => {
  const { root, s, confirmats } = await preparada();
  const abans = instantaniaCarpeta(root);
  const buit = await sync(root, s, { acks: {}, ara: () => T0 + 1000 * DIA });
  assert.deepEqual(buit.compactacio, SENSE_CANVIS);
  assert.deepEqual(instantaniaCarpeta(root), abans);
  // ACK parcial: només dos batches i cap projecció tenen ACK; la resta queda intacta byte a byte.
  const batches = confirmats.filter(esBatch), ambAck = batches.slice(0, 2);
  const r = await sync(root, s, { acks: ackTots(ambAck, T0), ara: () => T0 + 1000 * DIA });
  assert.deepEqual([...r.compactacio.batchesRetirats].sort(), ambAck.filter(n => n !== r.compactacio.instantania).sort());
  assert.deepEqual(r.compactacio.projeccionsRetirades, []);
  for (const [nom, text] of abans) if (!ambAck.includes(nom)) assert.equal(textFals(root, nom), text, nom);
  assert.equal(canon(estatCarpeta(root)), canon(s));
});

test('(2) cap entrada amb ACK de 90 dies o menys es compacta; l’endemà del dia 90, sí', async () => {
  const { root, s, confirmats } = await preparada();
  const abans = instantaniaCarpeta(root), acks = ackTots(confirmats, T0);
  for (const ara of [T0, T0 + 89 * DIA, T0 + NOVANTA]) {
    const r = await sync(root, s, { acks, ara: () => ara });
    assert.deepEqual(r.compactacio.batchesRetirats, []); assert.deepEqual(r.compactacio.projeccionsRetirades, []);
    assert.deepEqual(instantaniaCarpeta(root), abans);
  }
  // Un ACK del futur o mal format no compta com a antic.
  const rars = { ...ackTots(confirmats, T0 + 5000 * DIA), [confirmats[0]]: '2026-07-01', [confirmats[1]]: 'ahir' };
  assert.deepEqual((await sync(root, s, { acks: rars, ara: () => T0 + 1000 * DIA })).compactacio.batchesRetirats, []);
  assert.deepEqual(instantaniaCarpeta(root), abans);
  // Tampoc un ACK anterior a l'època del sincronitzador (rellotge a 1970): no és plausible.
  const de1970 = ackTots(confirmats, Date.UTC(1970, 0, 1));
  assert.deepEqual((await sync(root, s, { acks: de1970, ara: () => T0 + 1000 * DIA })).compactacio, SENSE_CANVIS);
  assert.deepEqual(instantaniaCarpeta(root), abans);
  assert.equal(vault.esAckPlausibleCrdtVault(iso(T0), T0), true);
  assert.equal(vault.esAckPlausibleCrdtVault(iso(T0 + 1), T0), false);
  assert.equal(vault.esAckPlausibleCrdtVault(iso(Date.UTC(2025, 11, 31)), T0), false);
  const r = await sync(root, s, { acks, ara: () => T0 + NOVANTA + 1 });
  assert.equal(r.compactacio.batchesRetirats.length, 5);
  assert.equal(r.compactacio.error, null);
});

test('(3) els tombstones es conserven: mateix estat abans i després i cap esborrat ressuscita amb una rèplica antiga', async () => {
  const { root, s, estats, confirmats } = await preparada();
  const abans = instantaniaCarpeta(root), estatAbans = estatCarpeta(root);
  const r = await sync(root, s, { acks: ackTots(confirmats, T0), ara: () => T0 + NOVANTA + 1 });
  // Queden la instantània i la projecció vigent de «a»; les tres projeccions superades sense editar ixen.
  assert.equal(r.compactacio.batchesRetirats.length, 5);
  assert.equal(r.compactacio.projeccionsRetirades.length, 3);
  assert.deepEqual(noms(root), [r.compactacio.instantania, ...r.projeccions].sort());
  // Unió exacta d'operacions: l'estat materialitzat (notes, esborrades, pendents) és idèntic.
  assert.equal(canon(estatCarpeta(root)), canon(estatAbans));
  assert.deepEqual(projectaCrdtRural(estatCarpeta(root)), projectaCrdtRural(estatAbans));
  const ops = estatCarpeta(root).ops;
  assert.ok(ops.some(op => op.id === 'b' && op.elimina === true), 'el tombstone de nota continua');
  assert.ok(ops.some(op => op.id === 'a' && op.remove.length > 0), 'els rangs eliminats continuen');
  // Una rèplica antiga (abans d'esborrar «b» i «cd») es fusiona amb la carpeta compactada.
  const antiga = estats[2];
  assert.deepEqual(projectaCrdtRural(antiga).notes.map(n => [n.id, n.content]), [['a', 'abXef'], ['b', 'temporal']]);
  const fusio = await sync(root, antiga);
  assert.deepEqual(projectaCrdtRural(fusio.crdt).notes.map(n => [n.id, n.content]), [['a', 'abXefg']]);
  assert.deepEqual(projectaCrdtRural(fusio.crdt).esborrades.map(n => n.id), ['b']);
  // Ni tan sols si una còpia vella de la carpeta torna els fitxers retirats.
  for (const [nom, text] of abans) if (!root.fills.has(nom)) root.afig(nom, text);
  const retorn = await sync(root, estatCrdtRuralBuit());
  assert.equal(canon(retorn.crdt), canon(s));
  assert.equal(retorn.incorporacionsSenseBase, 0);
});

test('(3) una projecció editada fora, una nota feta a mà i les projeccions vigents no es retiren mai', async () => {
  const { root, s, confirmats } = await preparada();
  const vigentAbans = (await sync(root, s)).projeccions[0];
  const editada = confirmats.filter(n => n.endsWith('.md')).find(n => n !== vigentAbans);
  root.fills.get(editada).modificaDesDeFora(textFals(root, editada).replace(/\n$/, ' editat a mà\n'));
  root.afig('apunt-meu.md', 'Una nota escrita fora\n');
  // La passada que incorpora les edicions; després, la compactació amb tots els ACK antics.
  const incorporada = await sync(root, s);
  assert.equal(incorporada.incorporacionsSenseBase, 1);
  const acks = ackTots([...noms(root), 'apunt-meu.md'], T0);
  const r = await sync(root, incorporada.crdt, { acks, ara: () => T0 + NOVANTA + 1 });
  assert.equal(r.compactacio.error, null);
  assert.ok(root.fills.has(editada), 'la projecció editada es conserva');
  assert.match(textFals(root, editada), /editat a mà/);
  assert.equal(textFals(root, 'apunt-meu.md'), 'Una nota escrita fora\n');
  for (const nom of r.projeccions) assert.ok(root.fills.has(nom), `vigent ${nom}`);
  assert.ok(!r.compactacio.projeccionsRetirades.some(n => n === editada || r.projeccions.includes(n)));
  // La projecció que era vigent abans de l'edició ara està superada i sense editar: sí que ix.
  assert.ok(r.compactacio.projeccionsRetirades.includes(vigentAbans));
  assert.equal(canon(estatCarpeta(root)), canon(incorporada.crdt));
});

test('(4) idempotent: compactar dues vegades deixa la carpeta igual que compactar-ne una', async () => {
  const { root, s, confirmats } = await preparada();
  const acks = ackTots(confirmats, T0), ara = () => T0 + NOVANTA + 1;
  const primera = await sync(root, s, { acks, ara });
  const despres = instantaniaCarpeta(root), escriptures = root.registre.length;
  const segona = await sync(root, primera.crdt, { acks, ara });
  assert.deepEqual(segona.compactacio, SENSE_CANVIS);
  assert.deepEqual(instantaniaCarpeta(root), despres);
  assert.equal(root.registre.slice(escriptures).some(([op]) => ['removeEntry', 'escriu'].includes(op)), false);
  // Ni quan, 90 dies després, la mateixa instantània ja és madura i no hi ha res més a unir.
  const tercera = await sync(root, primera.crdt, { acks: ackTots(segona.confirmats, T0 + NOVANTA + 1), ara: () => T0 + 2 * NOVANTA + 2 });
  assert.deepEqual(tercera.compactacio.batchesRetirats, []);
  assert.deepEqual(instantaniaCarpeta(root), despres);
});

test('(5) primer s’escriu i es verifica la instantània; només després es retiren els lots', async () => {
  const { root, s, confirmats } = await preparada();
  const inici = root.registre.length;
  const r = await sync(root, s, { acks: ackTots(confirmats, T0), ara: () => T0 + NOVANTA + 1 });
  const registre = root.registre.slice(inici), nom = r.compactacio.instantania;
  const escrita = registre.findIndex(([op, ruta]) => op === 'escriu' && ruta === nom);
  const verificada = registre.findIndex(([op, ruta], i) => i > escrita && op === 'getFile' && ruta === nom);
  const primeraRetirada = registre.findIndex(([op, ruta]) => op === 'removeEntry' && esBatch(ruta));
  assert.ok(escrita >= 0 && verificada > escrita && primeraRetirada > verificada, JSON.stringify({ escrita, verificada, primeraRetirada }));
  // Una vegada escrita, la instantània no es torna a llegir: el pressupost de lectura la compta una sola vegada.
  assert.equal(registre.filter(([op, ruta]) => op === 'getFile' && ruta === nom).length, 1);
});

test('(5) un tall en escriure o verificar la instantània no retira cap lot', async () => {
  for (const tall of ['close', 'corromp']) {
    const { root, s, confirmats } = await preparada();
    const abans = instantaniaCarpeta(root);
    if (tall === 'close') root.injectaFallada('close', { ruta: esBatch, error: new DOMException('Sense espai', 'QuotaExceededError'), vegades: 1 });
    else root.corrompEscriptura({ ruta: esBatch, mode: 'altera', vegades: 1 });
    const r = await sync(root, s, { acks: ackTots(confirmats, T0), ara: () => T0 + NOVANTA + 1 });
    assert.equal(r.compactacio.error, tall === 'close' ? 'QuotaExceededError' : 'RURAL_CRDT_VAULT_WRITE_VERIFY');
    assert.deepEqual(r.compactacio.batchesRetirats, []);
    assert.equal(root.registre.some(([op, ruta]) => op === 'removeEntry' && esBatch(ruta)), false, tall);
    // Les projeccions van abans dels lots i no en depenen: les tres superades ja han eixit; la resta, intacta.
    assert.equal(r.compactacio.projeccionsRetirades.length, 3, tall);
    for (const [nom, text] of abans) if (!r.compactacio.projeccionsRetirades.includes(nom)) assert.equal(textFals(root, nom), text, `${tall}: ${nom}`);
    // La sincronització en si no es desfà: l'estat tornat és el de sempre.
    assert.equal(canon(r.crdt), canon(s));
  }
});

test('(5) un tall a mitja retirada deixa l’estat idèntic i la passada següent acaba igual que una sense tall', async () => {
  const neta = await preparada();
  const acks = ackTots(neta.confirmats, T0), ara = () => T0 + NOVANTA + 1;
  await sync(neta.root, neta.s, { acks, ara });
  const { root, s } = await preparada();
  let retirades = 0;
  root.injectaFallada('removeEntry', { ruta: ruta => esBatch(ruta) && ++retirades === 3, vegades: 1 });
  const tallada = await sync(root, s, { acks, ara });
  assert.equal(tallada.compactacio.error, 'NoModificationAllowedError');
  assert.equal(tallada.compactacio.batchesRetirats.length, 2);
  assert.equal(canon(estatCarpeta(root)), canon(s));
  // La instantània de la passada tallada encara no té ACK: es reutilitza com a contenidor, no se n'escriu cap altra.
  const inici = root.registre.length;
  const represa = await sync(root, s, { acks, ara });
  assert.equal(represa.compactacio.error, null);
  assert.equal(represa.compactacio.instantania, null);
  assert.deepEqual(represa.compactacio.contenidors, [tallada.compactacio.instantania]);
  assert.equal(represa.compactacio.batchesRetirats.length, 3);
  assert.equal(root.registre.slice(inici).some(([op, ruta]) => op === 'escriu' && esBatch(ruta)), false);
  assert.deepEqual(instantaniaCarpeta(root), instantaniaCarpeta(neta.root));
});

test('(6) determinista: el mateix contingut en un altre ordre de carpeta dona la mateixa instantània i les mateixes retirades', async () => {
  const a = await preparada();
  // Una altra carpeta: entrades en ordre invers i batches amb les claus JSON també invertides
  // (el nom no canvia: el SHA-256 és del JSON canònic). La instantània ha d'eixir byte a byte igual.
  const inverteix = v => Array.isArray(v) ? v.map(inverteix) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).reverse().map(k => [k, inverteix(v[k])])) : v;
  const b = new CarpetaFalsa('vault-invers');
  for (const [nom, text] of [...instantaniaCarpeta(a.root)].reverse()) b.afig(nom, esBatch(nom) ? JSON.stringify(inverteix(JSON.parse(text))) : text);
  assert.notEqual(textFals(b, noms(b).find(esBatch)), textFals(a.root, noms(b).find(esBatch)));
  const acks = ackTots(a.confirmats, T0), ara = () => T0 + NOVANTA + 1;
  const ra = await sync(a.root, a.s, { acks, ara }), rb = await sync(b, estatCrdtRuralBuit(), { acks, ara });
  assert.deepEqual(rb.compactacio, ra.compactacio);
  assert.deepEqual(instantaniaCarpeta(b), instantaniaCarpeta(a.root));
  assert.deepEqual(rb.confirmats, ra.confirmats);
});

test('una carpeta sense removeEntry no escriu cap instantània i ho declara', async () => {
  const { root, s, confirmats } = await preparada();
  const abans = instantaniaCarpeta(root);
  const sense = Object.assign(Object.create(root), { removeEntry: undefined });
  const r = await sync(sense, s, { acks: ackTots(confirmats, T0), ara: () => T0 + NOVANTA + 1 });
  assert.equal(r.compactacio.error, 'RURAL_CRDT_VAULT_SENSE_RETIRADA');
  assert.deepEqual(instantaniaCarpeta(root), abans);
});

test('una cancel·lació durant la compactació es propaga i no retorna cap pla', async () => {
  const { root, s, confirmats } = await preparada();
  const controller = new AbortController(), remove = root.removeEntry.bind(root);
  root.removeEntry = async (...args) => { await remove(...args); controller.abort(); };
  await assert.rejects(sync(root, s, { acks: ackTots(confirmats, T0), ara: () => T0 + NOVANTA + 1, signal: controller.signal }), e => e.name === 'AbortError');
  assert.equal(canon(estatCarpeta(root)), canon(s));
});

/* Correccions de l'àrbitre · (7) capacitat. Lots grossos: `lots` lots de `notes` notes creades i
   eliminades (cap projecció viva), cada una amb 64 etiquetes de 120 caràcters; cada lot d'un sol cop. */
function carpetaGrossa(lots, notes) {
  const root = new CarpetaFalsa('grossa');
  let comptador = 0;
  for (let i = 0; i < lots; i++) {
    const ops = [];
    for (let j = 0; j < notes; j++) {
      const id = `n${i}-${j}`, tags = Array.from({ length: 64 }, (_, k) => `${i}-${j}-${k}-`.padEnd(120, 'x'));
      const creada = canviaCrdtRural(estatCrdtRuralBuit(), { id, replica: 'G', comptador: ++comptador, nota: { ...nota('c'), tags } });
      ops.push(...creada.ops, ...canviaCrdtRural(creada, { id, replica: 'G', comptador: ++comptador, elimina: true }).ops);
    }
    const lot = fusionaCrdtRural(estatCrdtRuralBuit(), { schema: estatCrdtRuralBuit().schema, ops });
    root.afig(nomLot(lot), textLot(lot));
  }
  return root;
}

test('(7) amb més de 2 MB de lots madurs, la instantània hi cap amb marge: la carpeta continua llegible i convergix', async () => {
  const root = carpetaGrossa(26, 10), bytes0 = bytesCarpeta(root);
  assert.ok(bytes0 > 2 * 1024 * 1024 && bytes0 < MAX_BYTES, String(bytes0));
  const r0 = await sync(root, estatCrdtRuralBuit());
  const acks = ackTots(r0.confirmats, T0), ara = () => T0 + NOVANTA + 1;
  const r1 = await sync(root, r0.crdt, { acks, ara });
  assert.equal(r1.compactacio.error, null);
  // La unió dels 26 no hi cap: s'unix el prefix més llarg que no gasta més de la meitat del marge.
  const k = r1.compactacio.batchesRetirats.length;
  assert.ok(k >= 2 && k < 26, String(k));
  assert.ok(bytesText(textFals(root, r1.compactacio.instantania)) <= (MAX_BYTES - bytes0) / 2);
  assert.ok(bytesCarpeta(root) <= MAX_BYTES, String(bytesCarpeta(root)));
  // La passada següent (també la d'R29, sense ACK) llig la carpeta sencera i en trau el mateix estat.
  assert.equal(canon((await sync(root, estatCrdtRuralBuit())).crdt), canon(r0.crdt));
  // Onada R30 · PF-03 · Segon àrbitre: amb la meitat del marge, la convergència va per prefixos en unes
  // poques passades (abans, dues). Cada passada retira i la carpeta no passa mai dels 4 MB.
  let retirats = k, passades = 1;
  while (retirats < 26 && passades < 8) {
    const r = await sync(root, r0.crdt, { acks, ara, cronometre: SENSE_PRESSA }); passades++;
    assert.equal(r.compactacio.error, null);
    if (!r.compactacio.batchesRetirats.length) break;
    retirats += r.compactacio.batchesRetirats.length;
    assert.ok(bytesCarpeta(root) <= MAX_BYTES, String(bytesCarpeta(root)));
  }
  // Com a molt en queda un lot original (una instantània necessita dos lots madurs).
  assert.ok(retirats >= 25, `${retirats} retirats en ${passades} passades`);
  assert.ok(noms(root).length <= 6 && noms(root).length < 26, String(noms(root).length));
  assert.equal(canon(estatCarpeta(root)), canon(r0.crdt));
});

test('(7) un tall a la primera retirada, amb la carpeta prop del límit, la deixa llegible i la represa no reescriu la instantània', async () => {
  const neta = carpetaGrossa(26, 10), root = carpetaGrossa(26, 10);
  const r0 = await sync(root, estatCrdtRuralBuit()), bytes0 = bytesCarpeta(root);
  const acks = ackTots(r0.confirmats, T0), ara = () => T0 + NOVANTA + 1;
  root.injectaFallada('removeEntry', { vegades: 1 });
  const tallada = await sync(root, r0.crdt, { acks, ara });
  assert.equal(tallada.compactacio.error, 'NoModificationAllowedError');
  assert.deepEqual(tallada.compactacio.batchesRetirats, []);
  assert.ok(tallada.compactacio.instantania);
  // Els 26 lots i la instantània alhora: per davall dels 4 MB, amb almenys la meitat del marge d'abans
  // (segon àrbitre), i la passada R29 la llig sencera.
  const bytesTall = bytesCarpeta(root);
  assert.ok(bytesTall > bytes0 && MAX_BYTES - bytesTall >= (MAX_BYTES - bytes0) / 2, `${bytes0} → ${bytesTall}`);
  assert.equal(canon((await sync(root, estatCrdtRuralBuit())).crdt), canon(r0.crdt));
  // La represa retira els lots que la instantània tallada ja cobrix sense tornar-la a escriure.
  const inici = root.registre.length;
  const represa = await sync(root, r0.crdt, { acks, ara });
  assert.equal(represa.compactacio.error, null);
  assert.deepEqual(represa.compactacio.contenidors, [tallada.compactacio.instantania]);
  assert.equal(root.registre.slice(inici).some(([op, ruta]) => op === 'escriu' && ruta === tallada.compactacio.instantania), false);
  // I acaba exactament com la mateixa carpeta compactada sense cap tall.
  const n0 = await sync(neta, estatCrdtRuralBuit());
  await sync(neta, n0.crdt, { acks, ara }); await sync(neta, n0.crdt, { acks, ara });
  assert.deepEqual(instantaniaCarpeta(root), instantaniaCarpeta(neta));
});

test('(7) la capacitat compta la segona lectura de cada projecció vigent: amb una nota viva gran, un tall continua sent llegible', async () => {
  const root = carpetaGrossa(26, 10), lotsGrossos = noms(root).filter(esBatch);
  // Una nota viva de 99.000 caràcters (5 edicions de 19.800): la seua projecció fa més que cap lot gros
  // (~90 KB) i la passada R29 la llig dues vegades (llista i escriuImmut).
  let viva = estatCrdtRuralBuit(), text = '';
  for (let i = 1; i <= 5; i++) {
    text += 'v'.repeat(19800);
    viva = fusionaCrdtRural(viva, canviaCrdtRural(baseNotaCrdtRural(viva, 'viva'), { id: 'viva', replica: 'V', comptador: i, nota: nota(text) }));
  }
  const r0 = await sync(root, viva);
  assert.equal(r0.projeccions.length, 1);
  assert.ok(new TextEncoder().encode(textFals(root, r0.projeccions[0])).length > 95_000);
  // Només els lots grossos tenen ACK: la nota viva i la seua projecció queden fora de la compactació.
  const acks = ackTots(lotsGrossos, T0), ara = () => T0 + NOVANTA + 1;
  root.injectaFallada('removeEntry', { vegades: 1 });
  // Esta prova força el tall de removeEntry; el pressupost real té una prova pròpia.
  const tallada = await sync(root, r0.crdt, { acks, ara, cronometre: SENSE_PRESSA });
  assert.equal(tallada.compactacio.error, 'NoModificationAllowedError');
  assert.ok(tallada.compactacio.instantania);
  const llegida = await sync(root, r0.crdt);
  assert.equal(canon(llegida.crdt), canon(r0.crdt));
  assert.deepEqual(projectaCrdtRural(llegida.crdt).notes.map(n => n.content.length), [99000]);
});

/* Onada R30 · PF-03 · Segon àrbitre. Amb la meitat del marge, la nota de 99.000 caràcters de la prova
   anterior ja no discrimina si es compta la segona lectura de les vigents. Ací les projeccions vigents
   (52 notes vives amb 64 etiquetes de 120 caràcters de 3 bytes) ocupen més que la meitat del marge: si no es comptara
   la segona lectura, s'escriuria una instantània de 4 lots i, amb un tall, la carpeta passaria dels 4 MB. */
test('(7) amb projeccions vigents grans, la segona lectura decidix: no s’escriu cap instantània que un tall faria il·legible', async () => {
  const root = carpetaGrossa(4, 10), lotsMorts = noms(root);
  const ops = [];
  for (let j = 0; j < 52; j++) ops.push(...canviaCrdtRural(estatCrdtRuralBuit(), { id: `v${j}`, replica: 'V', comptador: j + 1, nota: { ...nota('v'), tags: Array.from({ length: 64 }, (_, k) => `v${j}-${k}-`.padEnd(120, '€')) } }).ops);
  const r0 = await sync(root, { schema: estatCrdtRuralBuit().schema, ops });
  const vigents = r0.projeccions.reduce((n, nom) => n + bytesText(textFals(root, nom)), 0), mortes = lotsMorts.reduce((n, nom) => n + bytesText(textFals(root, nom)), 0);
  const F = bytesCarpeta(root);
  // Precondicions mesurades: la carpeta es llig (F + V), però F + V + els 4 lots ja no hi cabria, i sense la
  // segona lectura els 4 lots sí que cabrien dins de la meitat del marge.
  assert.ok(F + vigents <= MAX_BYTES && F + vigents + mortes > MAX_BYTES && mortes <= (MAX_BYTES - F) / 2, JSON.stringify({ F, vigents, mortes }));
  root.injectaFallada('removeEntry', { vegades: 1 });
  const r = await sync(root, r0.crdt, { acks: ackTots(lotsMorts, T0), ara: () => T0 + NOVANTA + 1, cronometre: SENSE_PRESSA });
  assert.deepEqual(r.compactacio, { ...SENSE_CANVIS, error: 'RURAL_CRDT_VAULT_COMPACT_QUOTA' });
  assert.equal(canon((await sync(root, estatCrdtRuralBuit())).crdt), canon(r0.crdt));
});

test('(7) si ni dos lots madurs hi caben al costat de la carpeta, no s’escriu cap instantània i es declara', async () => {
  const root = carpetaGrossa(2, 170);
  assert.ok(bytesCarpeta(root) > 2.5 * 1024 * 1024, String(bytesCarpeta(root)));
  const r0 = await sync(root, estatCrdtRuralBuit()), abans = instantaniaCarpeta(root), inici = root.registre.length;
  const r = await sync(root, r0.crdt, { acks: ackTots(r0.confirmats, T0), ara: () => T0 + NOVANTA + 1 });
  assert.deepEqual(r.compactacio, { ...SENSE_CANVIS, error: 'RURAL_CRDT_VAULT_COMPACT_QUOTA' });
  assert.equal(root.registre.slice(inici).some(([op]) => ['escriu', 'removeEntry'].includes(op)), false);
  assert.deepEqual(instantaniaCarpeta(root), abans);
});

/* Onada R30 · PF-03 · Segon àrbitre. Un tall entre la instantània i la primera retirada (removeEntry fallit
   o pressupost de temps esgotat just després d'escriure-la) no pot deixar sense marge un dispositiu amb canvis
   nous: el seu delta s'escriu abans de reprendre la compactació. Abans, la carpeta passava de 2,5 MB a 4,12 MB
   (71 KB de marge) i dues notes noves de 19.000 caràcters donaven RURAL_CRDT_VAULT_QUOTA per sempre. */
test('(7) després d’un tall, un dispositiu amb canvis nous continua sincronitzant i reprén la compactació', async () => {
  for (const causa of ['removeEntry', 'temps']) {
    const root = carpetaGrossa(26, 10), r0 = await sync(root, estatCrdtRuralBuit()), bytes0 = bytesCarpeta(root);
    const acks = ackTots(r0.confirmats, T0), ara = () => T0 + NOVANTA + 1;
    let opcions = { acks, ara, cronometre: SENSE_PRESSA };
    if (causa === 'removeEntry') root.injectaFallada('removeEntry', { vegades: 1 });
    else {
      // El cronòmetre s'esgota just quan la instantània ja és a la carpeta: el primer pas de `retira` para.
      let escrita = false; const getFileHandle = root.getFileHandle.bind(root);
      root.getFileHandle = async (nom, o) => { if (o?.create && esBatch(nom)) escrita = true; return getFileHandle(nom, o); };
      opcions = { ...opcions, cronometre: () => (escrita ? 1e9 : 0) };
    }
    const tallada = await sync(root, r0.crdt, opcions);
    assert.equal(tallada.compactacio.error, causa === 'removeEntry' ? 'NoModificationAllowedError' : 'RURAL_CRDT_VAULT_COMPACT_TEMPS');
    assert.ok(tallada.compactacio.instantania, causa);
    assert.deepEqual(tallada.compactacio.batchesRetirats, [], causa);
    assert.ok(MAX_BYTES - bytesCarpeta(root) >= (MAX_BYTES - bytes0) / 2, `${causa}: ${bytes0} → ${bytesCarpeta(root)}`);
    // El dispositiu escriu dues notes noves (≈ 76 KB entre delta i projeccions) abans de tornar a sincronitzar.
    let local = r0.crdt;
    for (const i of [0, 1]) local = fusionaCrdtRural(local, canviaCrdtRural(baseNotaCrdtRural(local, `nova${i}`), { id: `nova${i}`, replica: 'Z', comptador: i + 1, nota: nota('g'.repeat(19000)) }));
    const represa = await sync(root, local, { acks, ara, cronometre: SENSE_PRESSA });
    assert.equal(represa.compactacio.error, null, causa);
    assert.deepEqual(represa.compactacio.contenidors, [tallada.compactacio.instantania], causa);
    assert.equal(canon(estatCarpeta(root)), canon(local), causa);
    assert.deepEqual(projectaCrdtRural(estatCarpeta(root)).notes.map(n => [n.id, n.content.length]), [['nova0', 19000], ['nova1', 19000]]);
  }
});

test('(1) i (2) també en la represa: un lot que una instantània ja cobrix només es retira amb el seu propi ACK madur', async () => {
  const { root, s, confirmats } = await preparada();
  root.injectaFallada('removeEntry', { ruta: esBatch, vegades: 1 });
  const tallada = await sync(root, s, { acks: ackTots(confirmats, T0), ara: () => T0 + NOVANTA + 1 });
  const instantania = tallada.compactacio.instantania;
  assert.ok(instantania); assert.deepEqual(tallada.compactacio.batchesRetirats, []);
  const lots = noms(root).filter(n => esBatch(n) && n !== instantania);
  assert.equal(lots.length, 5);
  const abans = instantaniaCarpeta(root);
  // Sense cap ACK; amb ACK només de la instantània (el contenidor); amb ACK dels lots de 90 dies justos: res.
  for (const [acks, ara] of [[{}, T0 + 1000 * DIA], [ackTots([instantania], T0), T0 + 1000 * DIA], [ackTots(lots, T0), T0 + NOVANTA]]) {
    const r = await sync(root, s, { acks, ara: () => ara });
    assert.deepEqual(r.compactacio, SENSE_CANVIS, JSON.stringify(Object.keys(acks)));
    assert.deepEqual(instantaniaCarpeta(root), abans);
  }
  // Amb ACK madur de només dos lots, només ixen eixos dos, per contenidor i sense escriure res nou.
  const inici = root.registre.length;
  const r = await sync(root, s, { acks: ackTots(lots.slice(0, 2), T0), ara: () => T0 + NOVANTA + 1 });
  assert.deepEqual([...r.compactacio.batchesRetirats].sort(), lots.slice(0, 2));
  assert.deepEqual(r.compactacio.contenidors, [instantania]);
  assert.equal(r.compactacio.instantania, null);
  assert.equal(root.registre.slice(inici).some(([op]) => op === 'escriu'), false);
  assert.equal(canon(estatCarpeta(root)), canon(s));
});

test('(8) amb dues edicions concurrents, la projecció superada espera que TOTA la frontera tinga ACK madur', async () => {
  const root = new CarpetaFalsa('concurrents');
  const v1 = canviaCrdtRural(estatCrdtRuralBuit(), { id: 'a', replica: 'A', comptador: 1, nota: nota('v1') });
  const deA = fusionaCrdtRural(v1, canviaCrdtRural(v1, { id: 'a', replica: 'A', comptador: 2, nota: nota('v1 de A') }));
  const deB = canviaCrdtRural(v1, { id: 'a', replica: 'B', comptador: 1, nota: nota('de B v1') });
  const r1 = await sync(root, deA), [vella] = r1.projeccions;
  const acks = ackTots(r1.confirmats, T0);
  // 100 dies després arriba l'edició concurrent de B: la frontera és [A:2, B:1] i només A:2 té ACK madur.
  const s = fusionaCrdtRural(deA, deB);
  const r2 = await sync(root, s, { acks, ara: () => T0 + 100 * DIA });
  assert.notEqual(r2.projeccions[0], vella);
  assert.deepEqual(r2.compactacio.projeccionsRetirades, []);
  assert.ok(root.fills.has(vella));
  for (const nom of r2.confirmats) if (!Object.hasOwn(acks, nom)) acks[nom] = iso(T0 + 100 * DIA);
  assert.deepEqual((await sync(root, s, { acks, ara: () => T0 + 100 * DIA + NOVANTA })).compactacio.projeccionsRetirades, []);
  const r3 = await sync(root, s, { acks, ara: () => T0 + 100 * DIA + NOVANTA + 1 });
  assert.deepEqual(r3.compactacio.projeccionsRetirades, [vella]);
  assert.equal(canon(estatCarpeta(root)), canon(s));
});

test('(8) una projecció superada no ix en la passada que la supera, sinó quan l’edició o l’eliminació té 90 dies', async () => {
  const root = new CarpetaFalsa('superada');
  let s = estatCrdtRuralBuit();
  s = fusionaCrdtRural(s, canviaCrdtRural(estatCrdtRuralBuit(), { id: 'a', replica: 'A', comptador: 1, nota: nota('v1') }));
  s = fusionaCrdtRural(s, canviaCrdtRural(estatCrdtRuralBuit(), { id: 'b', replica: 'A', comptador: 2, nota: nota('b1', 'B') }));
  const r1 = await sync(root, s), velles = [...r1.projeccions].sort();
  assert.equal(velles.length, 2);
  const acks = ackTots(r1.confirmats, T0);
  // 100 dies després de l'ACK de les projeccions: s'edita «a» i s'elimina «b», i la mateixa passada compacta.
  s = fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, 'a'), { id: 'a', replica: 'A', comptador: 3, nota: nota('v2') }));
  s = fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, 'b'), { id: 'b', replica: 'A', comptador: 4, elimina: true }));
  const r2 = await sync(root, s, { acks, ara: () => T0 + 100 * DIA });
  assert.deepEqual(r2.compactacio.projeccionsRetirades, []);
  for (const nom of velles) assert.ok(root.fills.has(nom), nom);
  for (const nom of r2.confirmats) if (!Object.hasOwn(acks, nom)) acks[nom] = iso(T0 + 100 * DIA);
  // 90 dies justos després de l'edició, encara no; un mil·lisegon més tard, sí.
  assert.deepEqual((await sync(root, s, { acks, ara: () => T0 + 100 * DIA + NOVANTA })).compactacio.projeccionsRetirades, []);
  const r3 = await sync(root, s, { acks, ara: () => T0 + 100 * DIA + NOVANTA + 1 });
  assert.deepEqual([...r3.compactacio.projeccionsRetirades].sort(), velles);
  assert.deepEqual(projectaCrdtRural(estatCarpeta(root)).notes.map(n => [n.id, n.content]), [['a', 'v2']]);
  assert.deepEqual(projectaCrdtRural(estatCarpeta(root)).esborrades.map(n => n.id), ['b']);
});

test('(3) una projecció superada que algú edita durant la sincronització no es retira i conserva el text', async () => {
  const { root, s, confirmats } = await preparada();
  const vigent = (await sync(root, s)).projeccions[0];
  const superada = confirmats.filter(n => n.endsWith('.md') && n !== vigent).sort()[0];
  const editat = textFals(root, superada).replace(/\n$/, ' editat durant la passada\n');
  const getFileHandle = root.getFileHandle.bind(root);
  let editada = false;
  root.getFileHandle = async (nom, opcions) => {
    // La primera obertura sense crear d'esta projecció és la relectura d'abans de retirar-la.
    if (nom === superada && !opcions?.create && !editada) { editada = true; root.fills.get(nom).modificaDesDeFora(editat); }
    return getFileHandle(nom, opcions);
  };
  const r = await sync(root, s, { acks: ackTots(confirmats, T0), ara: () => T0 + NOVANTA + 1 });
  assert.equal(editada, true);
  assert.equal(r.compactacio.error, null);
  assert.equal(r.compactacio.projeccionsRetirades.includes(superada), false);
  assert.equal(r.compactacio.projeccionsRetirades.length, 2);
  assert.equal(textFals(root, superada), editat);
});

test('pressupost de temps: una passada lenta no compacta i una compactació que l’esgota para en un punt segur', async () => {
  const lenta = await preparada(), abans = instantaniaCarpeta(lenta.root), inici = lenta.root.registre.length;
  let crides = 0;
  const r = await sync(lenta.root, lenta.s, { acks: ackTots(lenta.confirmats, T0), ara: () => T0 + NOVANTA + 1, cronometre: () => (crides++ === 0 ? 0 : 60_000) });
  assert.deepEqual(r.compactacio, { ...SENSE_CANVIS, error: 'RURAL_CRDT_VAULT_COMPACT_TEMPS' });
  assert.equal(lenta.root.registre.slice(inici).some(([op]) => ['escriu', 'removeEntry'].includes(op)), false);
  assert.deepEqual(instantaniaCarpeta(lenta.root), abans);
  // Un cronòmetre que avança un pas per consulta esgota el pressupost a mitja compactació.
  const neta = await preparada(), acks = ackTots(neta.confirmats, T0), ara = () => T0 + NOVANTA + 1;
  await sync(neta.root, neta.s, { acks, ara });
  const { root, s } = await preparada();
  let pas = 0;
  const tallada = await sync(root, s, { acks, ara, cronometre: () => pas++, pressupostMs: 6 });
  assert.equal(tallada.compactacio.error, 'RURAL_CRDT_VAULT_COMPACT_TEMPS');
  const fetes = tallada.compactacio.projeccionsRetirades.length + tallada.compactacio.batchesRetirats.length;
  assert.ok(fetes >= 1 && fetes < 8, String(fetes));
  assert.equal(canon(estatCarpeta(root)), canon(s));
  const represa = await sync(root, s, { acks, ara });
  assert.equal(represa.compactacio.error, null);
  assert.deepEqual(instantaniaCarpeta(root), instantaniaCarpeta(neta.root));
});

test('dos lots amb les mateixes operacions i JSON diferent no es retiren l’un per l’altre: en queda un', async () => {
  const root = new CarpetaFalsa('dobles');
  let s = estatCrdtRuralBuit();
  for (const [comptador, content] of [[1, 'x'], [2, 'xy']]) s = fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, 'a'), { id: 'a', replica: 'A', comptador, nota: nota(content) }));
  const invers = { schema: s.schema, ops: [...s.ops].reverse() };
  root.afig(nomLot(s), textLot(s)); root.afig(nomLot(invers), textLot(invers));
  assert.equal(noms(root).filter(esBatch).length, 2);
  const r0 = await sync(root, s);
  const r = await sync(root, s, { acks: ackTots(r0.confirmats, T0), ara: () => T0 + NOVANTA + 1 });
  assert.equal(r.compactacio.error, null);
  assert.equal(r.compactacio.batchesRetirats.length, 1);
  assert.deepEqual(noms(root).filter(esBatch), r.compactacio.contenidors);
  assert.equal(canon(estatCarpeta(root)), canon(s));
});

/* Sessió OPFS: l'ACK només naix d'una sincronització confirmada al magatzem local, amb la
   seua hora; esborrar l'espai rural també l'esborra. */
const abast = { persona: 'INTERNAL_ACCOUNT_SENTINEL', tenant: 'torre', endpoint: 'seed', mode: 'seed' };
const CLAU_CRDT = 'mode-rural:crdt', CLAU_ACKS = 'mode-rural:crdt-carpeta-acks';
function opcionsSessio(rellotge) {
  const root = new CarpetaFalsa('opfs');
  return { root, opcions: { abast, municipi: 'La Torre', motor: 'opfs', storage: { getDirectory: async () => root }, locks: creaBloquejosOpfsFalsos(), crypto: webcrypto, BroadcastChannel: null, ara: () => rellotge.ara } };
}
async function obri(t, opcions) { const s = await creaSessioRural(opcions); t.after(() => s.close()); return s; }
const fitxerOpfs = root => [...root.fills].find(([nom]) => nom.startsWith('sdp-rural-'))[1];
const estatOpfs = (text, clau) => JSON.parse(text).estats.find(e => e.clau === clau)?.estat ?? null;
/* Fa fallar (QuotaExceededError) NOMÉS el commit OPFS que puja la revisió de `clau`; qualsevol altra
   escriptura del mateix fitxer ix bé. Així la prova distingix quina escriptura va primer. */
function fallaCommitDe(root, clau) {
  const fitxer = fitxerOpfs(root), crea = fitxer.createWritable.bind(fitxer);
  const revisio = text => estatOpfs(text, clau)?.revision ?? 0;
  let pendent = true;
  fitxer.createWritable = async opcions => {
    const w = await crea(opcions); let text = '';
    return {
      write: async dades => { text += typeof dades === 'string' ? dades : new TextDecoder().decode(dades); return w.write(dades); },
      close: async () => {
        if (pendent && revisio(text) > revisio(fitxer.text)) { pendent = false; await w.abort(); throw new DOMException('Sense espai', 'QuotaExceededError'); }
        return w.close();
      },
      abort: () => w.abort(),
    };
  };
  return () => !pendent;
}

test('sessió · l’ACK es registra després del commit local i una sincronització fallida no en dona', async t => {
  const rellotge = { ara: T0 }, carpeta = new CarpetaFalsa('compartida');
  const da = opcionsSessio(rellotge), db = opcionsSessio(rellotge);
  const a = await obri(t, da.opcions), b = await obri(t, db.opcions);
  await b.desaNota({ title: 'De B', content: 'xyz' });
  await b.sincronitzaCarpeta(carpeta);
  const inicial = await a.desaNota({ title: 'Nota', content: 'abc' }), id = inicial.notes[0].id;
  // A escriu el seu batch i les projeccions, però el commit local (importaCrdt, que puja la revisió de
  // l'estat CRDT) falla. L'escriptura de l'ACK, si anara primer, sí que eixiria bé: no n'hi ha d'haver cap.
  const fallat = fallaCommitDe(da.root, CLAU_CRDT);
  await assert.rejects(a.sincronitzaCarpeta(carpeta), e => e.code === 'SDP-RURAL-QUOTA');
  assert.equal(fallat(), true, 'ha fallat el commit de l’estat CRDT');
  assert.equal(estatOpfs(fitxerOpfs(da.root).text, CLAU_ACKS), null, 'cap ACK sense commit local');
  assert.equal(noms(carpeta).filter(esBatch).length, 2);
  rellotge.ara = T0 + 100 * DIA;
  const primera = await a.sincronitzaCarpeta(carpeta);
  assert.deepEqual(primera.sincronitzacio.compactacio, { instantania: null, batchesRetirats: 0, projeccionsRetirades: 0, error: null, errorAck: null });
  assert.equal(Object.keys(estatOpfs(fitxerOpfs(da.root).text, CLAU_ACKS).acks).length, 4);
  const draft = await a.preparaEdicio(id);
  await a.editaNota({ id, title: 'Nota', content: 'abXc', base: draft.base });
  rellotge.ara = T0 + 101 * DIA; await a.sincronitzaCarpeta(carpeta);
  // Si l'ACK haguera nascut de la passada fallida (T0), els dos primers batches ja serien madurs.
  rellotge.ara = T0 + 150 * DIA;
  assert.equal((await a.sincronitzaCarpeta(carpeta)).sincronitzacio.compactacio.batchesRetirats, 0);
  rellotge.ara = T0 + 192 * DIA;
  const madura = await a.sincronitzaCarpeta(carpeta);
  assert.equal(madura.sincronitzacio.compactacio.error, null);
  assert.equal(madura.sincronitzacio.compactacio.batchesRetirats, 3);
  assert.equal(madura.sincronitzacio.compactacio.projeccionsRetirades, 1);
  assert.deepEqual(madura.notes.map(n => n.content).sort(), ['abXc', 'xyz']);
  assert.equal(noms(carpeta).length, 3);
  // B, sense ACK propis tan antics, llig la carpeta compactada i convergix.
  const deB = await b.sincronitzaCarpeta(carpeta);
  assert.deepEqual(deB.notes.map(n => n.content).sort(), ['abXc', 'xyz']);
});

test('sessió · una fallada en anotar l’ACK no fa fallar una sincronització ja confirmada', async t => {
  const rellotge = { ara: T0 }, da = opcionsSessio(rellotge), carpeta = new CarpetaFalsa('compartida');
  const s = await obri(t, da.opcions);
  await s.desaNota({ title: 'Nota', content: 'abc' });
  const fallat = fallaCommitDe(da.root, CLAU_ACKS);
  const r = await s.sincronitzaCarpeta(carpeta);
  assert.equal(fallat(), true);
  assert.equal(r.sincronitzacio.compactacio.errorAck, 'SDP-RURAL-QUOTA');
  assert.deepEqual(r.notes.map(n => n.content), ['abc']);
  assert.equal(noms(carpeta).filter(esBatch).length, 1);
  assert.equal(estatOpfs(fitxerOpfs(da.root).text, CLAU_ACKS), null);
  // La passada següent l'anota: només s'ha endarrerit.
  const r2 = await s.sincronitzaCarpeta(carpeta);
  assert.equal(r2.sincronitzacio.compactacio.errorAck, null);
  assert.equal(Object.keys(estatOpfs(fitxerOpfs(da.root).text, CLAU_ACKS).acks).length, 2);
});

test('sessió · un ACK anotat amb el rellotge avançat es torna a anotar amb l’hora bona', async t => {
  const rellotge = { ara: Date.UTC(2031, 0, 1) }, da = opcionsSessio(rellotge), carpeta = new CarpetaFalsa('compartida');
  const s = await obri(t, da.opcions);
  const inicial = await s.desaNota({ title: 'Nota', content: 'abc' }), id = inicial.notes[0].id;
  await s.sincronitzaCarpeta(carpeta);
  assert.ok(Object.values(estatOpfs(fitxerOpfs(da.root).text, CLAU_ACKS).acks).every(m => m.startsWith('2031-')));
  // Es corregix el rellotge: les marques del futur cauen i es tornen a anotar amb l'hora d'ara.
  rellotge.ara = T0;
  const draft = await s.preparaEdicio(id);
  await s.editaNota({ id, title: 'Nota', content: 'abcd', base: draft.base });
  await s.sincronitzaCarpeta(carpeta);
  assert.ok(Object.values(estatOpfs(fitxerOpfs(da.root).text, CLAU_ACKS).acks).every(m => m === iso(T0)));
  rellotge.ara = T0 + NOVANTA + DIA;
  const r = await s.sincronitzaCarpeta(carpeta);
  assert.equal(r.sincronitzacio.compactacio.batchesRetirats, 2);
  assert.deepEqual(r.notes.map(n => n.content), ['abcd']);
});

test('sessió · esborrar l’espai rural esborra també els ACK de carpeta', async t => {
  const rellotge = { ara: T0 }, { opcions } = opcionsSessio(rellotge), carpeta = new CarpetaFalsa('compartida');
  const s = await obri(t, opcions);
  const inicial = await s.desaNota({ title: 'Nota', content: 'abc' }), id = inicial.notes[0].id;
  await s.sincronitzaCarpeta(carpeta);
  const draft = await s.preparaEdicio(id);
  await s.editaNota({ id, title: 'Nota', content: 'abcd', base: draft.base });
  await s.sincronitzaCarpeta(carpeta);
  const abans = instantaniaCarpeta(carpeta);
  await s.esborraTot();
  rellotge.ara = T0 + 1000 * DIA;
  const nova = await obri(t, opcions);
  const r = await nova.sincronitzaCarpeta(carpeta);
  assert.deepEqual(r.sincronitzacio.compactacio, { instantania: null, batchesRetirats: 0, projeccionsRetirades: 0, error: null, errorAck: null });
  assert.deepEqual(instantaniaCarpeta(carpeta), abans);
  assert.deepEqual(r.notes.map(n => n.content), ['abcd']);
});

/* Onada R32 · Fusió de la PF-03 viva (ACK LOCAL de carpeta i compactació sense pèrdua) amb la frontera causal
   de Codex R30.2 (ACK remot explícit i certificat de retirada permanent), segons D-R30-1. Correcció de l'àrbitre
   R32: el certificat és del dispositiu que l'ha fet amb el seu ACK remot. La carpeta només transporta operacions
   (també la supressió), i un Markdown d'una nota retirada no torna mai a les operacions. */
const AUTORITAT_REMOTA = 'https://replica.example';
function confirmaRemot(s, ms, requestId) {
  const p = preparaSincronitzacioCrdtRural(s, requestId);
  return registraAckCrdtRural(s, p, { schema: 'sdp.rural.remote-ack.v1', requestId, sha256: p.sha256, frontera: p.frontera,
    autoritat: AUTORITAT_REMOTA, confirmatEl: iso(ms), ack_remot_confirmat: true }, AUTORITAT_REMOTA);
}
const retiraAmbAckRemot = s => compactaCrdtRural(confirmaRemot(confirmaRemot(s, T0, 'primer'), T0 + RETENCIO_TOMBSTONES_RURAL_MS + 1, 'segon'));
const lotsAmbMetadades = root => noms(root).filter(esBatch).filter(nom => JSON.parse(textFals(root, nom)).crdt.sincronitzacio !== undefined);
const ambPayloadDe = (root, id) => noms(root).filter(esBatch).filter(nom => JSON.parse(textFals(root, nom)).crdt.ops.some(op => op.id === id && op.insert.text));
/* «x» es crea i s'elimina; «y» i «z» viuen. Cada pas se sincronitza: 4 lots ordinaris i les seues projeccions. */
async function historiaAmbRetirada(root) {
  let s = estatCrdtRuralBuit(), comptador = 0;
  const estats = [];
  const pas = async (id, opcions) => {
    s = fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, id), { id, replica: 'A', comptador: ++comptador, ...opcions }));
    s = (await sync(root, s)).crdt; estats.push(s);
  };
  await pas('x', { nota: nota('payload retirable '.repeat(20), 'X') });
  await pas('x', { elimina: true });
  await pas('y', { nota: nota('viva y', 'Y') });
  await pas('z', { nota: nota('viva z', 'Z') });
  return { s, estats };
}

test('R32 · D-R30-1: la carpeta no rep mai ACK, fronteres ni certificats, i un lot aliè que en porta no acredita res', async () => {
  const root = new CarpetaFalsa('vault');
  const compactat = retiraAmbAckRemot((await historiaAmbRetirada(root)).s);
  assert.ok(compactat.sincronitzacio.acks.length > 0 && compactat.sincronitzacio.fronteres.length === 1);
  assert.deepEqual(compactat.sincronitzacio.retirades.map(x => x.id), ['x']);
  const r = await sync(root, compactat);
  assert.equal(r.batchesCreats, 0, 'la supressió ja era a la carpeta: no hi ha res nou');
  assert.deepEqual(lotsAmbMetadades(root), []);
  // El certificat i els ACK remots del resultat són els del dispositiu (crdt local), no de la carpeta.
  assert.equal(canon(r.crdt.sincronitzacio), canon(compactat.sincronitzacio));
  // Un lot aliè amb ACK, fronteres i certificat no acredita res: només se'n lligen les operacions.
  const aliena = new CarpetaFalsa('aliena');
  aliena.afig(nomLot(compactat), textLot(compactat));
  const llegit = await sync(aliena, estatCrdtRuralBuit());
  assert.equal(llegit.crdt.sincronitzacio, undefined);
  assert.deepEqual(projectaCrdtRural(llegit.crdt).notes.map(n => n.id).sort(), ['y', 'z']);
});

test('R32 · un certificat aliè a la carpeta no purga ni amaga cap nota viva, i el lot que el porta no ix mai', async () => {
  let s = estatCrdtRuralBuit();
  s = fusionaCrdtRural(s, canviaCrdtRural(estatCrdtRuralBuit(), { id: 'x', replica: 'A', comptador: 1, nota: nota('text que no es pot perdre', 'X') }));
  s = fusionaCrdtRural(s, canviaCrdtRural(estatCrdtRuralBuit(), { id: 'y', replica: 'A', comptador: 2, nota: nota('viva y', 'Y') }));
  const root = new CarpetaFalsa('vault');
  await sync(root, s);
  // Un altre escriptor de la carpeta, amb una còpia de les operacions, fabrica una supressió i rebuts inventats.
  const fals = retiraAmbAckRemot(fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, 'x'), { id: 'x', replica: 'atacant', comptador: 1, elimina: true })));
  assert.deepEqual(fals.sincronitzacio.retirades.map(r => r.id), ['x']);
  const certificat = { schema: fals.schema, ops: [], sincronitzacio: { acks: [], retirades: fals.sincronitzacio.retirades, fronteres: [] } };
  root.afig(nomLot(certificat), textLot(certificat));
  const r = await sync(root, s);
  assert.deepEqual(projectaCrdtRural(r.crdt).notes.map(n => [n.id, n.content]), [['x', 'text que no es pot perdre'], ['y', 'viva y']]);
  assert.equal(r.crdt.sincronitzacio, undefined);
  assert.deepEqual(r.reconciliacionsCarpeta, []);
  // Un dispositiu nou tampoc l'hereta.
  assert.deepEqual(projectaCrdtRural((await sync(root, estatCrdtRuralBuit())).crdt).notes.map(n => n.id), ['x', 'y']);
  // El lot del certificat no té cap operació, i el lot ordinari el cobrix: amb tots els ACK madurs, no es retira.
  const c = await sync(root, r.crdt, { acks: ackTots(noms(root), T0), ara: () => T0 + NOVANTA + 1 });
  assert.equal(c.compactacio.error, null);
  assert.deepEqual(c.compactacio.batchesRetirats, []);
  assert.ok(root.fills.has(nomLot(certificat)));
});

test('R32 · (9) en la mateixa passada en què la retirada arriba a la carpeta, cap instantània nova porta payload retirat', async () => {
  const root = new CarpetaFalsa('vault');
  const { s } = await historiaAmbRetirada(root);
  const lots = noms(root).filter(esBatch), ambPayload = ambPayloadDe(root, 'x'), abans = noms(root);
  const ambX = lots.filter(n => JSON.parse(textFals(root, n)).crdt.ops.some(op => op.id === 'x'));
  assert.equal(lots.length, 4);
  assert.equal(ambPayload.length, 1);
  assert.equal(ambX.length, 2);
  // Una sola passada: la retirada és nova per a la carpeta i tots els ACK locals ja són madurs.
  const c = await sync(root, retiraAmbAckRemot(s), { acks: ackTots(abans, T0), ara: () => T0 + NOVANTA + 1 });
  assert.equal(c.compactacio.error, null);
  assert.ok(c.compactacio.instantania);
  // S'unixen només els lots de «y» i «z». Els dos lots de «x» (creació i supressió) es conserven.
  assert.deepEqual([...c.compactacio.batchesRetirats].sort(), lots.filter(n => !ambX.includes(n)).sort());
  assert.equal(JSON.parse(textFals(root, c.compactacio.instantania)).crdt.ops.some(op => op.id === 'x'), false);
  for (const nom of ambX) assert.ok(root.fills.has(nom));
  // Cap fitxer escrit en esta passada conté el payload retirat.
  assert.deepEqual(noms(root).filter(n => textFals(root, n).includes('payload retirable')).filter(n => !abans.includes(n)), []);
});

test('R32 · (9) la compactació conserva els lots amb payload retirat i ningú no torna a veure viva «x»', async () => {
  const root = new CarpetaFalsa('vault');
  const { s, estats } = await historiaAmbRetirada(root);
  const lotsOrdinaris = noms(root).filter(esBatch);
  const ambX = lotsOrdinaris.filter(nom => JSON.parse(textFals(root, nom)).crdt.ops.some(op => op.id === 'x'));
  assert.equal(ambX.length, 2);
  const r = await sync(root, retiraAmbAckRemot(s));
  const estatAbans = estatCarpeta(root);
  const c = await sync(root, r.crdt, { acks: ackTots(noms(root), T0), ara: () => T0 + NOVANTA + 1 });
  assert.equal(c.compactacio.error, null);
  assert.ok(c.compactacio.instantania);
  assert.deepEqual([...c.compactacio.batchesRetirats].sort(), lotsOrdinaris.filter(n => !ambX.includes(n)).sort());
  for (const nom of ambX) assert.ok(root.fills.has(nom), 'el payload retirat només el pot llevar compactaCrdtRural');
  assert.equal(canon(estatCarpeta(root)), canon(estatAbans));
  // Un dispositiu nou veu «x» eliminada (el payload continua a la carpeta), mai viva i sense cap certificat aliè.
  const nova = await sync(root, estatCrdtRuralBuit());
  assert.equal(nova.crdt.sincronitzacio, undefined);
  assert.deepEqual(projectaCrdtRural(nova.crdt).notes.map(n => n.id).sort(), ['y', 'z']);
  assert.deepEqual(projectaCrdtRural(nova.crdt).esborrades.map(n => n.id), ['x']);
  // Una rèplica d'abans d'eliminar «x» tampoc la ressuscita, i el dispositiu que l'ha retirada no la recupera.
  assert.deepEqual(projectaCrdtRural(estats[0]).notes.map(n => n.id), ['x']);
  assert.deepEqual(projectaCrdtRural((await sync(root, estats[0])).crdt).notes.map(n => n.id).sort(), ['y', 'z']);
  assert.equal((await sync(root, c.crdt)).crdt.ops.some(op => op.id === 'x'), false);
  // Idempotent: la passada següent, amb els mateixos ACK, no toca res.
  const abans = instantaniaCarpeta(root);
  const c2 = await sync(root, c.crdt, { acks: ackTots(noms(root), T0), ara: () => T0 + NOVANTA + 1 });
  assert.deepEqual([c2.compactacio.instantania, c2.compactacio.batchesRetirats, c2.compactacio.error], [null, [], null]);
  assert.deepEqual(instantaniaCarpeta(root), abans);
});

test('R32 · una nota eliminada i retirada abans d’arribar a la carpeta hi arriba com a supressió ordinària: ningú la veu viva', async () => {
  const root = new CarpetaFalsa('vault');
  let s = estatCrdtRuralBuit();
  s = fusionaCrdtRural(s, canviaCrdtRural(estatCrdtRuralBuit(), { id: 'x', replica: 'A', comptador: 1, nota: nota('payload retirable', 'X') }));
  s = fusionaCrdtRural(s, canviaCrdtRural(estatCrdtRuralBuit(), { id: 'y', replica: 'A', comptador: 2, nota: nota('viva y', 'Y') }));
  const vella = (await sync(root, s)).crdt;
  s = fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, 'x'), { id: 'x', replica: 'A', comptador: 3, elimina: true }));
  const lotsAbans = noms(root).filter(esBatch);
  const retirat = retiraAmbAckRemot(s);
  // En la mateixa passada arriba una nota viva nova, «w».
  const r = await sync(root, fusionaCrdtRural(retirat, canviaCrdtRural(estatCrdtRuralBuit(), { id: 'w', replica: 'A', comptador: 4, nota: nota('viva w', 'W') })));
  assert.equal(r.batchesCreats, 2);
  const nous = noms(root).filter(esBatch).filter(n => !lotsAbans.includes(n)).map(n => JSON.parse(textFals(root, n)).crdt);
  assert.equal(nous.some(lot => lot.sincronitzacio !== undefined), false);
  // La supressió va sola en el seu lot: la nota viva nova queda en un lot ordinari, compactable.
  assert.deepEqual(nous.map(lot => lot.ops.map(op => [op.id, op.elimina, op.insert.text])).sort(), [[['w', false, 'viva w']], [['x', true, '']]]);
  // Un dispositiu nou i una rèplica antiga veuen «x» eliminada, sense dependències pendents.
  const nova = await sync(root, estatCrdtRuralBuit());
  assert.deepEqual(projectaCrdtRural(nova.crdt).notes.map(n => n.id), ['w', 'y']);
  assert.deepEqual(projectaCrdtRural(nova.crdt).esborrades.map(n => n.id), ['x']);
  assert.equal(projectaCrdtRural(nova.crdt).pendents, 0);
  assert.deepEqual(projectaCrdtRural((await sync(root, vella)).crdt).notes.map(n => n.id), ['w', 'y']);
  // Idempotent: la supressió no es reescriu.
  const abans = instantaniaCarpeta(root);
  assert.equal((await sync(root, r.crdt)).batchesCreats, 0);
  assert.deepEqual(instantaniaCarpeta(root), abans);
  // En una carpeta que no ha vist mai «x», la supressió no s'hi escriu: hi quedaria pendent per sempre.
  const buida = new CarpetaFalsa('buida');
  await sync(buida, r.crdt);
  assert.deepEqual(noms(buida).filter(esBatch).map(n => JSON.parse(textFals(buida, n)).crdt.ops.map(op => op.id)), [['y', 'w']]);
});

test('R32 · (10) un Markdown antic d’una nota retirada es conserva intacte, es declara pendent i no torna a les operacions', async () => {
  const root = new CarpetaFalsa('vault');
  const { s } = await historiaAmbRetirada(root);
  const mdX = noms(root).filter(n => n.endsWith('.md') && textFals(root, n).includes('payload retirable'));
  assert.equal(mdX.length, 1);
  const bytesAbans = textFals(root, mdX[0]);
  const r = await sync(root, retiraAmbAckRemot(s));
  assert.deepEqual(r.reconciliacionsCarpeta, mdX);
  assert.equal(r.incorporacionsSenseBase, 0);
  assert.equal(r.crdt.ops.some(op => op.id === 'x'), false, 'el payload retirat no torna a les operacions');
  assert.equal(projectaCrdtRural(r.crdt).pendents, 0);
  assert.equal(textFals(root, mdX[0]), bytesAbans);
  const r2 = await sync(root, r.crdt);
  assert.deepEqual([r2.incorporacionsSenseBase, r2.batchesCreats, r2.reconciliacionsCarpeta], [0, 0, mdX]);
  assert.equal(canon(r2.crdt), canon(r.crdt));
  // Tampoc no es retira amb un ACK local madur: sense payload no es pot provar que no porte una edició externa.
  const c = await sync(root, r.crdt, { acks: ackTots(noms(root), T0), ara: () => T0 + NOVANTA + 1 });
  assert.equal(c.compactacio.projeccionsRetirades.includes(mdX[0]), false);
  assert.equal(textFals(root, mdX[0]), bytesAbans);
});

test('R32 · (10) una nota retirada gran o amb moltes projeccions no bloqueja la carpeta ni torna a la quota', async () => {
  const root = new CarpetaFalsa('vault');
  let s = estatCrdtRuralBuit(), comptador = 0;
  const pas = async (id, opcions) => {
    s = fusionaCrdtRural(s, canviaCrdtRural(baseNotaCrdtRural(s, id), { id, replica: 'A', comptador: ++comptador, ...opcions }));
    s = (await sync(root, s)).crdt;
  };
  // 30.000 caràcters en dues operacions: una sola operació no en pot portar més de 20.000.
  await pas('x', { nota: nota('a'.repeat(15000), 'X') });
  await pas('x', { nota: nota('a'.repeat(15000) + 'b'.repeat(15000), 'X') });
  // 14.000 caràcters i 7 edicions: 8 projeccions que sumen més dels 100.000 caràcters de la quota CRDT.
  const cos = 'p'.repeat(14000);
  await pas('p', { nota: nota(cos, 'P') });
  for (let i = 1; i <= 7; i++) await pas('p', { nota: nota(cos + i, 'P') });
  await pas('x', { elimina: true });
  await pas('p', { elimina: true });
  const mds = noms(root).filter(n => n.endsWith('.md'));
  assert.equal(mds.length, 10);
  const r = await sync(root, retiraAmbAckRemot(s));
  assert.deepEqual(r.crdt.ops, []);
  assert.deepEqual(r.crdt.sincronitzacio.retirades.map(x => x.id), ['p', 'x']);
  assert.deepEqual(r.reconciliacionsCarpeta, mds);
  const r2 = await sync(root, r.crdt);
  assert.deepEqual([r2.batchesCreats, r2.reconciliacionsCarpeta], [0, mds]);
});

test('sessió · R32 · D-R30-1: l’ACK local de carpeta compacta la carpeta, però no és ACK remot ni retira cap payload', async t => {
  const rellotge = { ara: T0 }, da = opcionsSessio(rellotge), carpeta = new CarpetaFalsa('compartida');
  const s = await obri(t, da.opcions);
  const id = (await s.desaNota({ title: 'Temporal', content: 'abc' })).notes[0].id;
  await s.sincronitzaCarpeta(carpeta);
  await s.eliminaNota({ id, base: (await s.preparaEdicio(id)).base });
  await s.sincronitzaCarpeta(carpeta);
  await s.desaNota({ title: 'Viva', content: 'xyz' });
  await s.sincronitzaCarpeta(carpeta);
  rellotge.ara = T0 + NOVANTA + DIA;
  const r = await s.sincronitzaCarpeta(carpeta);
  assert.equal(r.sincronitzacio.compactacio.error, null);
  assert.equal(r.sincronitzacio.compactacio.batchesRetirats, 3);
  assert.equal(r.sincronitzacioRemota, undefined, 'cap ACK local s’etiqueta com a remot');
  assert.equal(estatOpfs(fitxerOpfs(da.root).text, CLAU_ACKS).schema, 'sdp.rural.crdt-vault-acks.v1');
  await assert.rejects(s.sincronitzaRemot(), { code: 'RURAL_CRDT_REMOTE_REQUIRED' });
  await s.consolidaDiari();
  const paquet = await s.exportaVault();
  assert.equal(paquet.crdt.sincronitzacio, undefined);
  assert.equal(paquet.crdt.ops.filter(op => op.id === id).length, 2, 'el payload i el tombstone continuen');
  assert.ok(paquet.crdt.ops.some(op => op.id === id && op.elimina === true));
  assert.deepEqual((await s.estat()).notes.map(n => n.content), ['xyz']);
});
