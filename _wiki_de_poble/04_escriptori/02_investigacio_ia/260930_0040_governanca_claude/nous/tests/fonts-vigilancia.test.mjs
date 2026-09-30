// DESTÍ: tests/fonts-vigilancia.test.mjs (fitxer nou; s'executa amb node --test)
// Fonts de vigilància del Mapa de la Consola (T12): torns, Escriptori, LEDGER i ESTAT.
// Totes les fixtures viuen a os.tmpdir(); cap prova toca el repositori.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  resumTorns, resumEscriptori, resumLedger, resumEstat,
  analitzaLedger, dataEstat, ancoratA, LIMIT_SAFATA
} from '../tooling/brain/fonts-vigilancia.mjs';

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
const DESK = '_wiki_de_poble/04_escriptori';

function escriu(arrel, rel, text) {
  fs.mkdirSync(path.dirname(path.join(arrel, rel)), { recursive: true });
  fs.writeFileSync(path.join(arrel, rel), text);
}
const arrelNova = () => fs.mkdtempSync(path.join(os.tmpdir(), 'vigilancia-'));
const torn = (camps) => JSON.stringify({ schema: 'sdp.turn.v1', initial: { 'src/x.js': 'a'.repeat(64) }, history: [], ...camps });

test('torns: només els camps del contracte, rebuts comptats i pla; il·legibles i locks fora', () => {
  const arrel = arrelNova();
  assert.equal(resumTorns(arrel), null, 'sense directori de torns no hi ha font');
  escriu(arrel, '.agents/runtime/turns/torn_a.json', torn({
    turn_id: 'torn_a', actor: 'claude-opus-5-5', scope: 'code', state: 'planned',
    createdAt: '2026-09-29T22:00:00.000Z', expiresAt: '2026-09-30T22:00:00.000Z',
    receipts: { r1: { id: 'r1', file: `${DESK}/260930_0040_a.md` }, r2: { id: 'r2', file: `${DESK}/260930_0040_b.md` } },
    plan: { file: `${DESK}/260930_0040_b.md`, hash: 'b'.repeat(64) }, contractHash: 'c'.repeat(64)
  }));
  escriu(arrel, '.agents/runtime/turns/torn_b.json', torn({
    turn_id: 'torn_b', actor: 'codex', scope: 'documents', state: 'closed',
    createdAt: '2026-09-28T10:00:00.000Z', expiresAt: '2026-09-29T10:00:00.000Z', receipts: {}, plan: null
  }));
  // Sense turn_id i amb un actor que no és text: l'id ix del nom del fitxer i l'actor és null.
  escriu(arrel, '.agents/runtime/turns/torn_d.json', torn({ actor: 42, state: 'opened', createdAt: '2026-09-27T09:00:00.000Z' }));
  escriu(arrel, '.agents/runtime/turns/torn_c.json', '{ trencat');
  escriu(arrel, '.agents/runtime/turns/torn_a.json.lock', '');
  escriu(arrel, '.agents/runtime/turns/notes.txt', 'no és un torn');
  assert.deepEqual(resumTorns(arrel), [
    { id: 'torn_d', actor: null, scope: null, state: 'opened', createdAt: '2026-09-27T09:00:00.000Z', expiresAt: null, rebuts: 0, ambPla: false },
    { id: 'torn_b', actor: 'codex', scope: 'documents', state: 'closed', createdAt: '2026-09-28T10:00:00.000Z', expiresAt: '2026-09-29T10:00:00.000Z', rebuts: 0, ambPla: false },
    { id: 'torn_a', actor: 'claude-opus-5-5', scope: 'code', state: 'planned', createdAt: '2026-09-29T22:00:00.000Z', expiresAt: '2026-09-30T22:00:00.000Z', rebuts: 2, ambPla: true }
  ]);
});

test('torns: la memòria cau seguix els canvis del disc i no es deixa tocar', () => {
  const arrel = arrelNova();
  escriu(arrel, '.agents/runtime/turns/torn_a.json', torn({ turn_id: 'torn_a', state: 'opened', receipts: {}, plan: null }));
  escriu(arrel, '.agents/runtime/turns/torn_b.json', torn({ turn_id: 'torn_b', state: 'opened', receipts: {}, plan: null }));
  const primer = resumTorns(arrel);
  primer[0].state = 'manipulat';
  assert.deepEqual(resumTorns(arrel).map((t) => t.state), ['opened', 'opened'], 'el qui rep el resum no altera la memòria cau');
  escriu(arrel, '.agents/runtime/turns/torn_a.json', torn({
    turn_id: 'torn_a', state: 'planned', receipts: { r: { id: 'r', file: `${DESK}/260930_0040_a.md` } }, plan: { file: 'x', hash: 'y' }
  }));
  fs.rmSync(path.join(arrel, '.agents/runtime/turns/torn_b.json'));
  assert.deepEqual(resumTorns(arrel).map((t) => [t.id, t.state, t.rebuts, t.ambPla]), [['torn_a', 'planned', 1, true]]);
});

test('escriptori: documents solts amb àncora i rebut, safata sense caixa ni ocults', () => {
  const arrel = arrelNova();
  assert.equal(resumEscriptori(arrel), null, 'sense Escriptori no hi ha font');
  escriu(arrel, `${DESK}/00_index_escriptori.md`, [
    '---', 'type: index', '---', '# Índex', '',
    '- [[260930_0040_ancorat]]',
    '- [[260930_0040_amb_alies|amb àlies]]',
    '- `[[260930_0040_en_codi]]`',
    '<!-- [[260930_0040_en_comentari]] -->',
    '```', '[[260930_0040_en_bloc]]', '```',
    '- [[../10_actes/260930_0040_amb_cami]]', ''
  ].join('\n'));
  for (const nom of ['ancorat', 'amb_alies', 'en_codi', 'en_comentari', 'en_bloc', 'amb_cami']) escriu(arrel, `${DESK}/260930_0040_${nom}.md`, '# x\n');
  escriu(arrel, `${DESK}/notes.txt`, 'no és un document');
  escriu(arrel, `${DESK}/.ocult.md`, 'ocult');
  escriu(arrel, `${DESK}/02_investigacio_ia/260930_0040_fons.md`, 'no és del primer nivell');
  escriu(arrel, `${DESK}/00_Bandeja_d_Entrada/a.md`, 'a');
  escriu(arrel, `${DESK}/00_Bandeja_d_Entrada/carpeta/b.md`, 'b');
  escriu(arrel, `${DESK}/00_Bandeja_d_Entrada/.DS_Store`, '');
  escriu(arrel, '.agents/runtime/turns/torn_a.json', torn({ turn_id: 'torn_a', receipts: { r: { id: 'r', file: `${DESK}/260930_0040_ancorat.md` } }, plan: null }));
  assert.deepEqual(resumEscriptori(arrel), {
    documents: [
      { nom: '260930_0040_amb_alies.md', ancorat: true, ambRebut: false },
      { nom: '260930_0040_amb_cami.md', ancorat: false, ambRebut: false },
      { nom: '260930_0040_ancorat.md', ancorat: true, ambRebut: true },
      { nom: '260930_0040_en_bloc.md', ancorat: false, ambRebut: false },
      { nom: '260930_0040_en_codi.md', ancorat: false, ambRebut: false },
      { nom: '260930_0040_en_comentari.md', ancorat: false, ambRebut: false }
    ],
    safata: 2,
    limitSafata: LIMIT_SAFATA
  });
  assert.equal(LIMIT_SAFATA, 20);
});

test('escriptori: índex en majúscules, sense safata i sense torns', () => {
  const arrel = arrelNova();
  escriu(arrel, `${DESK}/00_INDEX_ESCRIPTORI.md`, '# Índex\n\n- [[260930_0040_a]]\n');
  escriu(arrel, `${DESK}/260930_0040_a.md`, '# a\n');
  assert.deepEqual(resumEscriptori(arrel), {
    documents: [{ nom: '260930_0040_a.md', ancorat: true, ambRebut: false }], safata: 0, limitSafata: 20
  });
});

test('ancoratA: rèplica d’anchored (sense .md, sense camí, fora de codi)', () => {
  assert.equal(ancoratA('- [[x]]', 'x.md'), true);
  assert.equal(ancoratA('- [[x#secció]]', 'x.md'), true);
  assert.equal(ancoratA('- [[ x ]]', 'x.md'), true);
  assert.equal(ancoratA('- [[x.md]]', 'x.md'), false);
  assert.equal(ancoratA('- [[dir/x]]', 'x.md'), false);
  assert.equal(ancoratA('~~~\n[[x]]\n~~~\n', 'x.md'), false);
  assert.equal(ancoratA(null, 'x.md'), false);
});

/** LEDGER amb les quatre formes, una data impossible, una línia coixa i soroll que no és entrada. */
const COS_LEDGER = [
  '# LEDGER', '',
  '260922 | correcció | wiki-documentacio-i-reflex | forma nua',
  '## 260922 | recaiguda | wiki-cicle-de-vida | amb capçalera',
  '',
  `<!-- HASH: ${'a'.repeat(64)} -->260927 | torn | claude-fable | enganxada a un segell fòssil`,
  '260927 | torn | claude-fable | primera.260928 | torn | claude | segona',
  '261340 | torn | claude | data impossible',
  '260923 | torn | sense skill',
  '## 2026-09-29 — Capçalera de prosa',
  '| 260923 | taula | no | és una entrada |',
  '- Model IA: 260923 | no comença per data |'
].join('\n');
const signa = (cos) => `${cos}\n\n<!-- HASH: ${sha256(cos)} -->`;

test('LEDGER: quatre formes, malformades, fòssils i signatura vàlida', () => {
  assert.deepEqual(analitzaLedger(signa(COS_LEDGER)), {
    valid: true,
    entrades: [
      { data: '260922', tipus: 'correcció', skill: 'wiki-documentacio-i-reflex', resum: 'forma nua' },
      { data: '260922', tipus: 'recaiguda', skill: 'wiki-cicle-de-vida', resum: 'amb capçalera' },
      { data: '260927', tipus: 'torn', skill: 'claude-fable', resum: 'enganxada a un segell fòssil' },
      { data: '260927', tipus: 'torn', skill: 'claude-fable', resum: 'primera.' },
      { data: '260928', tipus: 'torn', skill: 'claude', resum: 'segona' }
    ],
    fossils: 1,
    malformades: 4
  });
});

test('LEDGER: la signatura l’han d’acceptar ledger.mjs i verify-ledger.mjs alhora', () => {
  const signat = signa(COS_LEDGER);
  assert.equal(analitzaLedger(`${signat}\n`).valid, false, 'un salt de línia després del segell tomba la porta del pas 0');
  assert.equal(analitzaLedger(signat.replace('forma nua', 'forma retocada')).valid, false, 'cos alterat després de signar');
  assert.equal(analitzaLedger(`${signat}\n260930 | torn | claude | afegida sense signar`).valid, false);
  const sense = analitzaLedger(COS_LEDGER);
  assert.equal(sense.valid, false);
  assert.equal(sense.fossils, 0, 'una sola marca és l’última, encara que no segelle');
  assert.deepEqual(analitzaLedger(''), { valid: false, entrades: [], fossils: 0, malformades: 0 });
});

test('LEDGER: resumLedger llig el fitxer o torna null', () => {
  const arrel = arrelNova();
  assert.equal(resumLedger(arrel), null);
  escriu(arrel, '.agents/LEDGER.md', signa(COS_LEDGER));
  assert.equal(resumLedger(arrel).valid, true);
  assert.equal(resumLedger(arrel).entrades.length, 5);
});

test('ESTAT: data de la primera capçalera en ISO local, sense buscar-ne una altra', () => {
  const iso = dataEstat('# ESTAT\n\n## ESTAT_ACTUAL · 2026-09-29 21:58 · MarIA · Tancament\n\n## ESTAT_ACTUAL · 260924_1900 · MarIA\n');
  assert.match(iso, /^2026-09-29T21:58:00[+-]\d{2}:\d{2}$/);
  assert.equal(Date.parse(iso), new Date(2026, 8, 29, 21, 58).getTime());
  const compacta = dataEstat('## ESTAT_ACTUAL · 260924_1900 · MarIA · Tancament\n');
  assert.equal(Date.parse(compacta), new Date(2026, 8, 24, 19, 0).getTime());
  assert.equal(dataEstat('## ESTAT_ACTUAL · 2026-09-29 · Codex · Sense hora\n\n## ESTAT_ACTUAL · 2026-09-28 23:50 · MarIA\n'), null);
  assert.equal(dataEstat('## ESTAT_ACTUAL · Codex · Sense data\n'), null);
  assert.equal(dataEstat('## ESTAT_ACTUAL · 2026-02-30 10:00 · Dia impossible\n'), null);
  assert.equal(dataEstat('## ESTAT_ACTUAL · 260924_19001 · Massa xifres\n'), null);
  assert.equal(dataEstat('# ESTAT\n\nSense capçalera.\n'), null);
  assert.equal(dataEstat(null), null);
});

test('ESTAT: resumEstat compta bytes i torna null si no hi és', () => {
  const arrel = arrelNova();
  assert.equal(resumEstat(arrel), null);
  const text = '## ESTAT_ACTUAL · 2026-09-29 21:58 · MarIA · Relleu amb accents: àèéíòóú\n';
  escriu(arrel, '.agents/ESTAT.md', text);
  const estat = resumEstat(arrel);
  assert.equal(estat.bytes, Buffer.byteLength(text));
  assert.equal(Date.parse(estat.data), new Date(2026, 8, 29, 21, 58).getTime());
});

test('cap funció llança: una arrel inservible és null', () => {
  const fitxer = path.join(arrelNova(), 'no-es-un-directori');
  fs.writeFileSync(fitxer, 'x');
  for (const f of [resumTorns, resumEscriptori, resumLedger, resumEstat]) {
    assert.equal(f(fitxer), null, `${f.name} amb una arrel que és un fitxer`);
    assert.equal(f(42), null, `${f.name} amb una arrel que no és text`);
    assert.equal(f(undefined), null, `${f.name} sense arrel`);
  }
});
