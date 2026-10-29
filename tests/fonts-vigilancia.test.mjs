// DESTÍ: tests/fonts-vigilancia.test.mjs (fitxer nou; s'executa amb node --test)
// Fonts de vigilància del Mapa de la Consola (T12): torns, Escriptori, LEDGER i ESTAT.
// Totes les fixtures viuen a os.tmpdir(); cap prova toca el repositori.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { extractDocumentLinks } from '../tooling/lib/document-links.mjs';
import { anchored } from '../tooling/documental/core.mjs';
import { checkTaula } from '../tooling/gates/porta-olivera.mjs';
import { VerificadorSCC } from '../tooling/gates/verificador-scc.mjs';
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

test('ancoratA: indicador de noms curts (sense .md, sense camí, fora de codi)', () => {
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
    // 261006 (T1 del Mestre): el segell enganxat davant d'una entrada és un peu
    // històric; l'anomalia és la línia (forma 3), que ja compta a malformades.
    fossils: 0,
    peusHistorics: 1,
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
  assert.equal(sense.peusHistorics, 0, 'l’última marca és el peu final, no un peu històric');
  assert.deepEqual(analitzaLedger(''), { valid: false, entrades: [], fossils: 0, peusHistorics: 0, malformades: 0 });
});

test('LEDGER: resumLedger llig el fitxer o torna null', () => {
  const arrel = arrelNova();
  assert.equal(resumLedger(arrel), null);
  escriu(arrel, '.agents/LEDGER.md', signa(COS_LEDGER));
  assert.equal(resumLedger(arrel).valid, true);
  assert.equal(resumLedger(arrel).entrades.length, 5);
});

/* ── 261006 (prompt 261006_0224, T1) · Peus intercalats: tots són història; l'enganxat a text, a més, és anomalia ── */
const peu = (c) => `<!-- HASH: ${c.repeat(64)} -->`;

test('LEDGER 261006: els peus intercalats són història; només és fòssil el segell enganxat que cap línia mal formada recull', () => {
  const cos = [
    '# LEDGER', '',
    '260922 | torn | claude | primera', '',
    peu('a'), '',
    '260923 | torn | claude | segona',
    `${peu('b')}${peu('c')}`,
    `- Nota de prosa ${peu('d')}`,
    `260924 | torn | claude | amb segell al final ${peu('e')}`,
    `${peu('f')}260925 | torn | claude | forma 3`,
    '260926 | torn | claude | última'
  ].join('\n');
  const r = analitzaLedger(signa(cos));
  assert.equal(r.valid, true);
  assert.equal(r.peusHistorics, 6, 'a, b, c, d, e i f: tots els peus intercalats, també els enganxats');
  assert.equal(r.fossils, 2, 'd i e: enganxats a un text que cap línia mal formada no recull');
  assert.equal(r.malformades, 1, 'la forma 3 compta una sola vegada, com a línia');
  assert.deepEqual(r.entrades.map((e) => e.data), ['260922', '260923', '260924', '260925', '260926']);
  // El peu final no és mai història: sense signar i sense les dues últimes línies,
  // l'última marca (e) fa de peu final i deixa de comptar com a fòssil.
  const sense = analitzaLedger(cos.split('\n').slice(0, -2).join('\n'));
  assert.deepEqual([sense.valid, sense.peusHistorics, sense.fossils], [false, 4, 1]);
});

test('LEDGER 261006: separar les dues línies enganxades no esborra cap peu i deixa zero anomalies', () => {
  const abans = ['# LEDGER', '', `${peu('a')}260927 | torn | claude-fable | enganxada al peu`,
    '260927 | torn | claude-fable | primera.260928 | torn | claude | segona'].join('\n');
  const despres = ['# LEDGER', '', peu('a'), '260927 | torn | claude-fable | enganxada al peu',
    '260927 | torn | claude-fable | primera.', '260928 | torn | claude | segona'].join('\n');
  assert.equal(despres.length, abans.length + 2, 'només s’hi afigen dos salts de línia');
  const [a, d] = [analitzaLedger(signa(abans)), analitzaLedger(signa(despres))];
  assert.deepEqual([a.peusHistorics, a.fossils, a.malformades], [1, 0, 2]);
  assert.deepEqual([d.peusHistorics, d.fossils, d.malformades], [1, 0, 0]);
  assert.deepEqual(d.entrades, a.entrades, 'les mateixes entrades, amb el mateix text');
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

test('escriptori: només el Llibre canònic està exempt de rebut i conserva el control d’àncora', () => {
  const arrel = arrelNova();
  escriu(arrel, `${DESK}/00_index_escriptori.md`, '# Índex\n\n- [[03_llibre_mestre_tasques_i_idees]]\n- [[260930_0040_a]]\n');
  escriu(arrel, `${DESK}/03_llibre_mestre_tasques_i_idees.md`, '# Llibre\n');
  escriu(arrel, `${DESK}/260930_0040_a.md`, '# a\n');
  assert.deepEqual(resumEscriptori(arrel).documents, [
    { nom: '03_llibre_mestre_tasques_i_idees.md', ancorat: true, ambRebut: null },
    { nom: '260930_0040_a.md', ancorat: true, ambRebut: false }
  ]);
  escriu(arrel, 'tooling/wiki/taxonomia.json', JSON.stringify({ schema: 'sdp.taxonomia.v1', superficies: [DESK], exempts: { '260930_0040_a.md': 'no autoritzat' } }));
  assert.equal(resumEscriptori(arrel).documents[1].ambRebut, false);
  escriu(arrel, `${DESK}/00_index_escriptori.md`, '# Índex\n');
  assert.deepEqual(resumEscriptori(arrel).documents[0], { nom: '03_llibre_mestre_tasques_i_idees.md', ancorat: false, ambRebut: null });
});


/* C3-T11-FONTS: cap segon lexer en el consumidor del mapa de vigilància. */
for (const [cas, exemple] of [
  ['doble backtick inline', '``[[x]]``'],
  ['triple backtick inline', 'Text ```[[x]]``` final'],
  ['span inline en dues línies', 'Text `[[x]]\nencara codi`'],
  ['tilde de quatre amb fence curta interna', '~~~~markdown\n~~~\n[[x]]\n~~~\n~~~~'],
  ['backticks de quatre amb fence curta interna', '````markdown\n```\n[[x]]\n```\n````'],
  ['famílies de fence diferents', '~~~markdown\n```\n[[x]]\n~~~'],
  ['comentari amb fences', '<!--\n~~~\n[[x]]\n~~~\n-->'],
  ['wikilink escapat', String.raw`\[[x]]`],
]) test(`C3-T11-FONTS ${cas}: l'exemple no acredita una àncora`, () => {
  const source = exemple.replaceAll('\\n', '\n');
  assert.equal(ancoratA(source, 'x.md'), false);
  assert.equal(anchored(source, `${DESK}/x.md`), false);
  assert.ok(extractDocumentLinks(source).every(link => link.target !== 'x'));
  assert.equal(ancoratA(`${source}\n[[x]]`, 'x.md'), true, 'una àncora visible posterior continua acreditada');
});

test('C3-T11-FONTS àlies escapats Obsidian i escapaments literals usen l’extractor compartit', () => {
  assert.equal(ancoratA(String.raw`| [[x\|Etiqueta]] | text |`, 'x.md'), true);
  assert.equal(ancoratA('[[x#Resultat|Etiqueta]]', 'x.md'), true);
  assert.equal(ancoratA(String.raw`\\[[x]]`, 'x.md'), true);
  assert.equal(ancoratA(String.raw`\\\[[x]]`, 'x.md'), false);
});

test('C3-T11-FONTS el contracte de noms curts conserva les formes deliberades', () => {
  for (const source of ['[[x]]', '[[ x ]]', '[[x|Etiqueta]]', '[[x#Resultat]]']) assert.equal(ancoratA(source, 'x.md'), true, source);
  for (const source of ['[[x.md]]', '[[./x]]', '[[dir/x]]', '[[../10_actes/x]]', '[x](x.md)', '[[x_altra]]']) assert.equal(ancoratA(source, 'x.md'), false, source);
  assert.equal(ancoratA(null, 'x.md'), false);
  assert.equal(ancoratA('[[x]]', null), false);
  assert.equal(ancoratA('', 'x.md'), false);
});

test('C3-T11-FONTS resumEscriptori no fabrica salut si l’única àncora és un exemple', async t => {
  const root = fs.realpathSync(arrelNova());
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  escriu(root, '_wiki_de_poble/00_index.md', '# Índex\n\n[[00_index_escriptori]]\n');
  escriu(root, `${DESK}/00_index_escriptori.md`, '# Escriptori\n\n## Activitat en curs\n\n- [[real]]\n\n``[[sense_ancora]]``\n');
  escriu(root, `${DESK}/real.md`, '# Real\n');
  escriu(root, `${DESK}/sense_ancora.md`, '# Requerix una àncora real\n');
  const summary = resumEscriptori(root);
  assert.equal(summary.documents.find(doc => doc.nom === 'real.md').ancorat, true);
  assert.equal(summary.documents.find(doc => doc.nom === 'sense_ancora.md').ancorat, false);
  assert.equal(checkTaula(root).valid, false);
  const sccBefore = await new VerificadorSCC(root).runAudits();
  assert.equal(sccBefore.valid, false);
  assert.ok(sccBefore.errors.some(error => error.code === 'ESCRIPTORI_UNANCHORED'));
  fs.appendFileSync(path.join(root, DESK, '00_index_escriptori.md'), '\n- [[sense_ancora]]\n');
  assert.equal(resumEscriptori(root).documents.find(doc => doc.nom === 'sense_ancora.md').ancorat, true);
  assert.equal(checkTaula(root).valid, true);
  const sccAfter = await new VerificadorSCC(root).runAudits();
  assert.equal(sccAfter.valid, true, JSON.stringify(sccAfter));
});

test('C3-T11-FONTS consultar les fonts no escriu fitxers ni altera el seu contingut', t => {
  const root = fs.realpathSync(arrelNova());
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  escriu(root, `${DESK}/00_index_escriptori.md`, '# Índex\n\n[[x]]\n');
  escriu(root, `${DESK}/x.md`, '# X\n');
  const indexFile = path.join(root, DESK, '00_index_escriptori.md'), docFile = path.join(root, DESK, 'x.md');
  const before = [fs.readFileSync(indexFile), fs.readFileSync(docFile)];
  const entries = fs.readdirSync(path.join(root, DESK));
  assert.equal(resumEscriptori(root).documents[0].ancorat, true);
  assert.deepEqual([fs.readFileSync(indexFile), fs.readFileSync(docFile)], before);
  assert.deepEqual(fs.readdirSync(path.join(root, DESK)), entries);
});
