/** Proves de l'estat terminal `retired` (tooling/documental/turns.mjs) i de la CLI
 *  tooling/gates/retira_torns.mjs (paquet de governança 260930b).
 *
 *  El problema: un torn caducat no es podia tornar a escriure (readTurn diu «Torn
 *  caducat»), i per tant no es podia tancar mai. El 260930 el Mapa en comptava
 *  101. Retirar-lo no és tancar-lo: no acredita cap verificació, conserva rebuts,
 *  pla i inventari, i deixa una línia a `history` amb la nota de qui ho ordena.
 *
 *  Totes les fixtures viuen a os.tmpdir(): cap prova toca .agents/runtime/ real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture, validDoc, writeDoc, relay } from './helpers/documental.mjs';
// Espai de noms: contra un turns.mjs sense `retireExpiredTurn`, la bateria carrega i cada prova diu què falla.
import * as torns from '../tooling/documental/turns.mjs';

const { openTurn, readTurn, mutateTurn, checkTurn, sealTurn, bindPlan, ownPaths, handoffDocument, validateDocument } = torns;
const CLI = fileURLToPath(new URL('../tooling/gates/retira_torns.mjs', import.meta.url));
const NOTA = 'Caducat sense tancar; retirat per ordre del Mestre. No acredita verificació.';
const ok = () => ({ valid: true, checks: [{ name: 'fixture', exit: 0 }], errors: [] });

const registre = (root, id) => path.join(root, '.agents/runtime/turns', `${id}.json`);
const llig = (root, id) => fs.readFileSync(registre(root, id), 'utf8');
/** Fa caducar un torn de la fixture: només es toca `expiresAt`, com passaria amb el rellotge. */
function caduca(root, id, quan = Date.now() - 60000) {
  const t = JSON.parse(llig(root, id));
  t.expiresAt = new Date(quan).toISOString();
  fs.writeFileSync(registre(root, id), `${JSON.stringify(t, null, 2)}\n`);
}
/** Torn amb document, pla vinculat i relleu: el mateix cicle que tests/documental.test.mjs. */
function planificat(t) {
  const root = fixture(t);
  const d = validDoc(root);
  writeDoc(root, d);
  const pla = validDoc(root, { route: 'pla.implementacio', turn: d.turn, suffix: 'pla' });
  writeDoc(root, pla);
  bindPlan(root, d.turn.turn_id, pla.file);
  relay(root, d.turn.turn_id);
  return { root, d, id: d.turn.turn_id };
}
const marcador = (root) => fs.writeFileSync(path.join(root, '.agents/AGENTS.md'), '# BIOS de prova\n');
const cli = (root, args) => spawnSync(process.execPath, [CLI, ...args], { cwd: root, env: { ...process.env, SDP_ARREL: root }, encoding: 'utf8', timeout: 20000 });

/* ── retireExpiredTurn ────────────────────────────────────────────────────── */

test('retira un torn caducat: estat retired, una línia d’historial i res més del registre canvia', (t) => {
  const { root, id } = planificat(t);
  caduca(root, id);
  const abans = JSON.parse(llig(root, id));
  const ara = Date.now();
  const r = torns.retireExpiredTurn(root, id, { note: `  ${NOTA}  `, now: ara });
  const despres = JSON.parse(llig(root, id));
  assert.equal(r.state, 'retired');
  assert.equal(despres.state, 'retired');
  assert.equal(despres.revision, abans.revision + 1);
  assert.equal(despres.history.length, abans.history.length + 1);
  assert.deepEqual(despres.history.at(-1), { state: 'retired', action: 'retire-expired', at: new Date(ara).toISOString(), expiredAt: abans.expiresAt, note: NOTA });
  for (const clau of ['turn_id', 'schema', 'actor', 'scope', 'createdAt', 'expiresAt', 'contractHash', 'receipts', 'plan', 'initial', 'verification']) {
    assert.deepEqual(despres[clau], abans[clau], clau);
  }
  assert.equal(despres.verification, null, 'retirar no acredita cap verificació');
  assert.equal(fs.existsSync(`${registre(root, id)}.lock`), false, 'el pany s’allibera');
});

test('rebutja un torn viu, un de tancat i un de ja retirat, sense tocar el registre', (t) => {
  const viu = planificat(t);
  const abansViu = llig(viu.root, viu.id);
  assert.throws(() => torns.retireExpiredTurn(viu.root, viu.id, { note: NOTA }), /viu/);
  assert.equal(llig(viu.root, viu.id), abansViu);

  const tancat = planificat(t);
  assert.equal(sealTurn(tancat.root, tancat.id, ok, { close: true }).state, 'closed');
  caduca(tancat.root, tancat.id);
  const abansTancat = llig(tancat.root, tancat.id);
  assert.throws(() => torns.retireExpiredTurn(tancat.root, tancat.id, { note: NOTA }), /tancat/);
  assert.equal(llig(tancat.root, tancat.id), abansTancat);

  const retirat = planificat(t);
  caduca(retirat.root, retirat.id);
  torns.retireExpiredTurn(retirat.root, retirat.id, { note: NOTA });
  const abansRetirat = llig(retirat.root, retirat.id);
  assert.throws(() => torns.retireExpiredTurn(retirat.root, retirat.id, { note: NOTA }), /ja retirat/);
  assert.equal(llig(retirat.root, retirat.id), abansRetirat);
});

test('un torn sense caducitat llegible es pot retirar: tampoc es podria tancar mai', (t) => {
  const root = fixture(t);
  const { turn_id: id } = openTurn(root, { actor: 'test' });
  const cru = JSON.parse(llig(root, id));
  cru.expiresAt = 'demà';
  fs.writeFileSync(registre(root, id), `${JSON.stringify(cru, null, 2)}\n`);
  assert.equal(torns.retireExpiredTurn(root, id, { note: NOTA }).state, 'retired');
});

test('falla amb el pany ocupat i no toca ni el pany ni el registre', (t) => {
  const { root, id } = planificat(t);
  caduca(root, id);
  const abans = llig(root, id);
  fs.writeFileSync(`${registre(root, id)}.lock`, 'ocupat');
  assert.throws(() => torns.retireExpiredTurn(root, id, { note: NOTA }), /EEXIST/);
  assert.equal(fs.readFileSync(`${registre(root, id)}.lock`, 'utf8'), 'ocupat', 'el pany d’un altre no s’esborra');
  assert.equal(llig(root, id), abans);
});

test('sense nota no es retira res: la retirada ha de dir per què', (t) => {
  const { root, id } = planificat(t);
  caduca(root, id);
  const abans = llig(root, id);
  for (const note of [undefined, '', '   ']) assert.throws(() => torns.retireExpiredTurn(root, id, { note }), /nota/);
  assert.equal(llig(root, id), abans);
});

/* ── Un torn retirat és terminal ──────────────────────────────────────────── */

test('readTurn: amb {closed:true} el llig com un tancat; sense, diu «Torn retirat» i mai «Torn caducat»', (t) => {
  const { root, id } = planificat(t);
  caduca(root, id);
  assert.throws(() => readTurn(root, id), /Torn caducat/, 'abans de retirar-lo, és un caducat');
  torns.retireExpiredTurn(root, id, { note: NOTA });
  assert.equal(readTurn(root, id, { closed: true }).state, 'retired');
  assert.equal(readTurn(root, id, { closed: true, now: Date.now() + 10 * 86400000 }).state, 'retired');
  assert.throws(() => readTurn(root, id), (e) => /Torn retirat/.test(e.message) && !/caducat/.test(e.message));
});

test('mutateTurn, checkTurn, sealTurn, ownPaths i handoff rebutgen un torn retirat', (t) => {
  const { root, d, id } = planificat(t);
  caduca(root, id);
  torns.retireExpiredTurn(root, id, { note: NOTA });
  const abans = llig(root, id);

  assert.throws(() => mutateTurn(root, id, () => {}), /retirat/);
  assert.equal(fs.existsSync(`${registre(root, id)}.lock`), false, 'mutateTurn allibera el pany');
  assert.throws(() => checkTurn(root, id), /retirat/);
  assert.throws(() => sealTurn(root, id, ok, { close: true }), /retirat/);
  assert.throws(() => ownPaths(root, id, [d.file]), /retirat/);
  const desti = `_wiki_de_poble/10_actes/${path.basename(d.file)}`;
  fs.mkdirSync(path.join(root, '_wiki_de_poble/10_actes'), { recursive: true });
  fs.renameSync(path.join(root, d.file), path.join(root, desti));
  assert.throws(() => handoffDocument(root, id, d.file, desti), /retirat/);
  assert.equal(llig(root, id), abans, 'cap operació ha escrit el registre');
});

test('un document amb reflex d’un torn retirat valida sense «Torn caducat»', (t) => {
  const { root, d, id } = planificat(t);
  caduca(root, id);
  assert.match(validateDocument(root, d.content, d.file, { closed: true }).join('\n'), /Torn caducat/, 'el problema de partida');
  torns.retireExpiredTurn(root, id, { note: NOTA });
  assert.deepEqual(validateDocument(root, d.content, d.file, { closed: true }), [], 'com un tancat: el document es llig');
  const escriptura = validateDocument(root, d.content, d.file).join('\n');
  assert.match(escriptura, /Torn retirat/, 'però cap document nou pot nàixer d’un rebut retirat');
  assert.doesNotMatch(escriptura, /caducat/);
});

test('un altre torn que revisa un document amb reflex d’un torn retirat no hereta cap «Torn caducat»', (t) => {
  const { root, d, id } = planificat(t);
  const altre = openTurn(root, { scope: 'documents', actor: 'test' });
  // El document canvia durant l'altre torn: checkTurn el revisa i en llig el rebut amb {closed:true}.
  fs.appendFileSync(path.join(root, d.file), '\n');
  caduca(root, id);
  torns.retireExpiredTurn(root, id, { note: NOTA });
  const delDocument = checkTurn(root, altre.turn_id).errors.filter((e) => e.startsWith(`${d.file}:`));
  assert.deepEqual(delDocument.filter((e) => /Torn/.test(e)), []);
});

/* ── CLI retira_torns.mjs ─────────────────────────────────────────────────── */

/** Mas amb un torn viu, dos caducats, un de tancat, un de ja retirat, un il·legible i restes de l'escriptura atòmica. */
function mas(t) {
  const root = fixture(t);
  marcador(root);
  const viu = openTurn(root, { actor: 'viu' }).turn_id;
  const caducat = openTurn(root, { actor: 'caducat', scope: 'documents' }).turn_id;
  const senseData = openTurn(root, { actor: 'sense-data' }).turn_id;
  const tancat = openTurn(root, { actor: 'tancat' }).turn_id;
  const retirat = openTurn(root, { actor: 'retirat' }).turn_id;
  caduca(root, caducat);
  caduca(root, tancat);
  caduca(root, retirat);
  const cru = JSON.parse(llig(root, senseData));
  cru.expiresAt = null;
  fs.writeFileSync(registre(root, senseData), `${JSON.stringify(cru, null, 2)}\n`);
  // Un tancat de la fixture: només compta l'estat, que és el que llig la CLI.
  const t2 = JSON.parse(llig(root, tancat));
  t2.state = 'closed';
  fs.writeFileSync(registre(root, tancat), `${JSON.stringify(t2, null, 2)}\n`);
  torns.retireExpiredTurn(root, retirat, { note: NOTA });
  const dir = path.join(root, '.agents/runtime/turns');
  fs.writeFileSync(path.join(dir, 'torn_trencat.json'), '{');
  fs.writeFileSync(path.join(dir, `${viu}.json.lock`), 'ocupat');
  fs.writeFileSync(path.join(dir, `${viu}.json.0000.tmp`), '{}');
  return { root, dir, viu, caducat, senseData, tancat, retirat };
}
const foto = (dir) => Object.fromEntries(fs.readdirSync(dir).sort().map((n) => [n, fs.readFileSync(path.join(dir, n), 'utf8')]));

test('CLI: --sec, que és el mode per defecte, llista només els oberts caducats i no escriu res', (t) => {
  const m = mas(t);
  const abans = foto(m.dir);
  for (const args of [[], ['--sec']]) {
    const r = cli(m.root, args);
    assert.equal(r.status, 0, r.stderr);
    const eixida = JSON.parse(r.stdout);
    assert.equal(eixida.mode, 'sec');
    assert.deepEqual(eixida.retirables.map((x) => x.id).sort(), [m.caducat, m.senseData].sort());
    const c = eixida.retirables.find((x) => x.id === m.caducat);
    assert.deepEqual(Object.keys(c).sort(), ['actor', 'ambPla', 'createdAt', 'expiresAt', 'id', 'rebuts', 'scope', 'state']);
    assert.equal(c.actor, 'caducat');
    assert.equal(c.scope, 'documents');
    assert.equal(c.rebuts, 0);
    assert.equal(c.ambPla, false);
    assert.deepEqual(eixida.illegibles.map((x) => x.fitxer), ['torn_trencat.json']);
    assert.deepEqual(foto(m.dir), abans, `${args.join(' ') || '(sense bandera)'} no escriu res`);
  }
});

test('CLI: --escriu --nota retira els caducats i deixa intactes els vius, els tancats i els ja retirats', (t) => {
  const m = mas(t);
  const intactes = [m.viu, m.tancat, m.retirat].map((id) => [id, llig(m.root, id)]);
  const r = cli(m.root, ['--escriu', '--nota', NOTA]);
  assert.equal(r.status, 0, r.stderr);
  const eixida = JSON.parse(r.stdout);
  assert.equal(eixida.mode, 'escriu');
  assert.equal(eixida.nota, NOTA);
  assert.deepEqual(eixida.retirats.map((x) => x.id).sort(), [m.caducat, m.senseData].sort());
  assert.deepEqual(eixida.errors, []);
  for (const id of [m.caducat, m.senseData]) {
    const torn = readTurn(m.root, id, { closed: true });
    assert.equal(torn.state, 'retired');
    assert.equal(torn.history.at(-1).note, NOTA);
  }
  for (const [id, text] of intactes) assert.equal(llig(m.root, id), text, id);
  assert.equal(fs.readFileSync(path.join(m.dir, 'torn_trencat.json'), 'utf8'), '{');
  const segona = JSON.parse(cli(m.root, ['--escriu', `--nota=${NOTA}`]).stdout);
  assert.deepEqual(segona.retirats, [], 'idempotent: la segona passada no troba res');
});

test('CLI: un torn que no es pot retirar ix amb 1 i el JSON diu quin i per què', (t) => {
  const m = mas(t);
  fs.writeFileSync(`${registre(m.root, m.caducat)}.lock`, 'ocupat');
  const r = cli(m.root, ['--escriu', '--nota', NOTA]);
  assert.equal(r.status, 1, r.stderr);
  const eixida = JSON.parse(r.stdout);
  assert.deepEqual(eixida.retirats.map((x) => x.id), [m.senseData]);
  assert.deepEqual(eixida.errors.map((e) => e.id), [m.caducat]);
  assert.match(eixida.errors[0].motiu, /EEXIST/);
});

test('CLI: els usos incorrectes ixen amb 2 i no escriuen res', (t) => {
  const m = mas(t);
  const abans = foto(m.dir);
  for (const args of [['--escriu'], ['--escriu', '--nota'], ['--escriu', '--nota', '   '], ['--nota', NOTA], ['--sec', '--escriu', '--nota', NOTA], ['--inventat']]) {
    const r = cli(m.root, args);
    assert.equal(r.status, 2, `${args.join(' ')} → ${r.stdout}`);
    assert.match(r.stderr, /Ús: retira_torns\.mjs/, args.join(' '));
  }
  assert.deepEqual(foto(m.dir), abans);
});
