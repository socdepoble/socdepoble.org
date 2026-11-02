/** Regressió B1 (261101): `porta-olivera.mjs --arxiva` reapunta els enllaços dels documents vius.
 *
 *  El bloqueig creuat: arxivar un document de l'Escriptori deixava LINK_INVALID a l'SCC als
 *  vius que l'enllaçaven, i reescriure'ls a mà deixava «Artefacte modificat després del
 *  tancament» (turns.mjs) o «Pla absent o modificat» als torns. MarIA ho va resoldre a mà, sense
 *  rastre, dues vegades el 261101. Estes proves exigixen el comportament correcte: el resolutor
 *  i el conjunt de l'SCC, el camí relatiu de cada font, l'esmena només del torn tancat del rebut
 *  propi (amb preimatge i substitucions reversibles), plan.hash i relocated dels torns oberts de
 *  qualsevol abast, aturades sense moure res i --sec pur.
 *
 *  Totes les fixtures viuen a os.tmpdir(), amb noms i dades sintètics: cap prova toca
 *  l'Escriptori real ni cap torn real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { fixture, validDoc, writeDoc, relay } from './helpers/documental.mjs';
import { arxiva, arxivables } from '../tooling/gates/porta-olivera.mjs';
import { planificaArxiu, reescriuEnllacos, desfesSubstitucions, documentsAuditats, hashBytes, fallidesF9 } from '../tooling/documental/arxiu-enllacos.mjs';
import { ambTornsArxiu, openTurn, bindPlan, sealTurn, checkTurn, validateDocument, inventory, readTurn } from '../tooling/documental/turns.mjs';
import { checkDocuments } from '../tooling/gates/porta-documents.mjs';
import { VerificadorSCC } from '../tooling/gates/verificador-scc.mjs';

const PORTA = fileURLToPath(new URL('../tooling/gates/porta-olivera.mjs', import.meta.url));
const DESK = '_wiki_de_poble/04_escriptori';
const ARXIU = '_wiki_de_poble/90_arxiu_historic';
const ACTES = '_wiki_de_poble/10_actes';
const INDEX = `${DESK}/00_index_escriptori.md`;
const X = '250101_0900_prompt_consumit.md';
const XS = '250101_0900_prompt_consumit';
const INDEX_FM = '---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n';

const sha = (valor) => createHash('sha256').update(valor).digest('hex');
const llig = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const hi = (root, rel) => fs.existsSync(path.join(root, rel));
const posa = (root, rel, text) => { fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true }); fs.writeFileSync(path.join(root, rel), text); };
const porta = (root, args) => spawnSync(process.execPath, [PORTA, ...args], { cwd: root, env: { ...process.env, SDP_ARREL: root }, encoding: 'utf8', timeout: 60000 });
const ok = () => ({ valid: true, checks: [{ name: 'fixture', exit: 0 }], errors: [] });
const registre = (root, id) => path.join(root, '.agents/runtime/turns', `${id}.json`);
const crus = (root, id) => fs.readFileSync(registre(root, id), 'utf8');
const MOU = [{ nom: X, rel: `${DESK}/${X}`, desti: `${ARXIU}/${X}` }];

/** Empremta de tot l'arbre de la fixture: «res no ha canviat» vol dir esta igualtat. */
function foto(root) {
  const out = {};
  const walk = (rel) => {
    for (const e of fs.readdirSync(path.join(root, rel), { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(r);
      else if (e.isFile()) out[r] = sha(fs.readFileSync(path.join(root, r)));
    }
  };
  walk('');
  return out;
}

/** Un Mas amb el contracte documental, el document consumit X i l'índex que el declara. */
function masAmbX(t) {
  const root = fixture(t);
  posa(root, `${DESK}/${X}`, '# Consumit\n\n## Secció\n');
  fs.writeFileSync(path.join(root, INDEX), `${INDEX_FM}\n## Activitat en curs\n\n- [[${XS}]] · Mestre 250101: prova\n`);
  return root;
}

/** Afig una línia de prosa amb l'enllaç just abans de «## Vincles» (fora de taules). */
const ambEnllac = (content, enllac = `[[${XS}]]`) => {
  assert.match(content, /\n## Vincles/);
  return content.replace(/\n## Vincles/, `\nVegeu ${enllac}.\n\n## Vincles`);
};

/** Un document formal D que enllaça X, d'un torn C tancat amb verificació genuïna. */
function tancatAmbEnllac(root, suffix = 'segellada') {
  const d = validDoc(root, { suffix });
  d.content = ambEnllac(d.content);
  writeDoc(root, d);
  const plan = validDoc(root, { route: 'pla.implementacio', turn: d.turn, suffix: `${suffix}_pla` });
  writeDoc(root, plan);
  bindPlan(root, d.turn.turn_id, plan.file);
  relay(root, d.turn.turn_id);
  assert.equal(sealTurn(root, d.turn.turn_id, ok, { close: true }).state, 'closed');
  assert.deepEqual(validateDocument(root, d.content, d.file, { closed: true }), [], 'el document segellat és vàlid abans d’arxivar');
  return d;
}

/** Tanca un torn a mà amb una verificació només administrativa (expire-close). */
function tancaSenseVerificacio(root, d) {
  const file = registre(root, d.turn.turn_id);
  const turn = JSON.parse(fs.readFileSync(file, 'utf8'));
  turn.state = 'closed';
  turn.verification = { at: new Date().toISOString(), files: { [d.file]: sha(d.content) }, checks: ['expire-close'] };
  fs.writeFileSync(file, `${JSON.stringify(turn, null, 2)}\n`);
}

const linkInvalid = async (root) => (await new VerificadorSCC(root).runAudits()).errors
  .filter((e) => e.code === 'LINK_INVALID').map((e) => `${e.affected_files.join(',')}: ${e.message}`).sort();

/* ── T1 · Formes ──────────────────────────────────────────────────────────── */

test('T1 · cada forma d’enllaç apunta a l’arxiu des de la carpeta de la seua font; l’SCC no guanya cap LINK_INVALID i un segon pla no troba res', async (t) => {
  const root = masAmbX(t);
  const Y = '250101_0920_prompt_viu';
  posa(root, `${DESK}/${Y}.md`, '# Viu\n');
  fs.appendFileSync(path.join(root, INDEX), `- [[${Y}]] · Mestre 250101: viu\n\n## Notes\n\nVegeu [l'antic](${X}).\n`);
  const A = `${DESK}/250101_0910_auditoria_formes.md`;
  posa(root, A, ['# Formes', '',
    `[[${XS}]]`, `[[${XS}|àlies]]`, `[[${XS}#Secció]]`, `[[${XS}.md]]`, `![[${XS}]]`,
    `| [[${XS}]] | fet |`, `| [[${XS}\\|informe]] |`,
    `[t](${X}) · [t](./${X}#s)`,
    `\`[[${XS}]]\` i <!-- [[${XS}]] --> i [[${Y}]]`, ''].join('\n'));
  const B = `${ACTES}/250101_1000_acta_formes.md`;
  posa(root, B, `# B\n\n[t](../04_escriptori/${X}) i [[${XS}]]\n`);
  posa(root, '_wiki_de_poble/00_index.md', `# Índex\n\n[[${XS}]] · [t](04_escriptori/${X})\n`);
  const P = '_wiki_de_poble/03_actuar/plantilles/p_formes.md';
  posa(root, P, `# P\n\n[[${XS}]]\n`);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n[t](../_wiki_de_poble/04_escriptori/${X}) i [[${XS}]]\n`);
  posa(root, '.agents/ON_ESTIC.md', `# On\n\n[t](../_wiki_de_poble/04_escriptori/${X})\n`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });

  const abans = await linkInvalid(root);
  assert.ok(!abans.some((e) => /formes|00_index\.md|p_formes/.test(e)), `les fonts resolen abans d’arxivar: ${abans.join('\n')}`);
  // Amb títol, l'extractor de l'SCC ja no el resol (preexistent); la porta el reapunta igualment per a qui llig.
  const conjunt = await documentsAuditats(root);
  assert.equal(reescriuEnllacos(root, A, `[t](<${X}> "títol") · [u](${X} "altre")`, MOU, conjunt.fitxers).text,
    `[t](<../90_arxiu_historic/${X}> "títol") · [u](../90_arxiu_historic/${X} "altre")`);

  const p = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(p.status, 0, p.stderr + p.stdout);
  assert.ok(hi(root, `${ARXIU}/${X}`) && !hi(root, `${DESK}/${X}`));
  assert.equal(llig(root, A), ['# Formes', '',
    `[[../90_arxiu_historic/${XS}|${XS}]]`, `[[../90_arxiu_historic/${XS}|àlies]]`, `[[../90_arxiu_historic/${XS}#Secció|${XS}#Secció]]`,
    `[[../90_arxiu_historic/${X}|${X}]]`, `![[../90_arxiu_historic/${XS}]]`,
    `| [[../90_arxiu_historic/${XS}]] | fet |`, `| [[../90_arxiu_historic/${XS}\\|informe]] |`,
    `[t](../90_arxiu_historic/${X}) · [t](../90_arxiu_historic/${X}#s)`,
    `\`[[${XS}]]\` i <!-- [[${XS}]] --> i [[${Y}]]`, ''].join('\n'));
  assert.equal(llig(root, B), `# B\n\n[t](../90_arxiu_historic/${X}) i [[../90_arxiu_historic/${XS}|${XS}]]\n`);
  assert.equal(llig(root, '_wiki_de_poble/00_index.md'), `# Índex\n\n[[./90_arxiu_historic/${XS}|${XS}]] · [t](./90_arxiu_historic/${X})\n`);
  assert.equal(llig(root, P), `# P\n\n[[../../90_arxiu_historic/${XS}|${XS}]]\n`);
  assert.match(llig(root, '.agents/ESTAT.md'), new RegExp(`\\[t\\]\\(\\.\\./_wiki_de_poble/90_arxiu_historic/${XS}\\.md\\) i \\[\\[\\.\\./_wiki_de_poble/90_arxiu_historic/${XS}\\|${XS}\\]\\]`));
  assert.equal(llig(root, '.agents/ON_ESTIC.md'), `# On\n\n[t](../_wiki_de_poble/90_arxiu_historic/${X})\n`);
  // L'índex: la declaració de viu se'n va (despenja) i l'enllaç Markdown apunta a l'arxiu.
  const index = llig(root, INDEX);
  assert.doesNotMatch(index, new RegExp(`\\[\\[${XS}\\]\\]`));
  assert.match(index, new RegExp(`Vegeu \\[l'antic\\]\\(\\.\\./90_arxiu_historic/${XS}\\.md\\)`));

  assert.deepEqual(await linkInvalid(root), abans, 'cap LINK_INVALID nou a l’SCC');
  const { fitxers, fonts } = await documentsAuditats(root);
  for (const f of fonts) {
    assert.equal(reescriuEnllacos(root, f.rel, fs.readFileSync(f.abs, 'utf8'), MOU, fitxers).substitucions.length, 0, `${f.rel}: cap enllaç resol ja al camí vell`);
  }
  const segona = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(segona.status, 2);
  assert.match(segona.stderr, /no és cap document solt/);
});

test('T1 · C6: un [[X]] ambigu (Escriptori i actes, vist des d’una tercera carpeta) atura l’arxivat amb exit 2, nomena la font i no mou res', (t) => {
  const root = masAmbX(t);
  posa(root, `${ACTES}/${X}`, '# Homònim a les actes\n');
  const A = '_wiki_de_poble/01_ser/250101_0910_nota_ambigua.md';
  posa(root, A, `# A\n\n[[${XS}]]\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 2, p.stdout);
  assert.ok(p.stderr.includes(A), p.stderr);
  assert.match(p.stderr, /Enllaç ambigu/);
  assert.match(p.stderr, /No s'ha mogut res/);
  assert.deepEqual(foto(root), abans);
});

/* ── T2 · Sessió ──────────────────────────────────────────────────────────── */

test('T2 · amb --sessio el destí és la carpeta de sessió, també als enllaços reescrits', (t) => {
  const root = masAmbX(t);
  const B = `${ACTES}/250101_1000_acta_sessio.md`;
  posa(root, B, `# B\n\n[[${XS}]] i [t](../04_escriptori/${X})\n`);
  // Un disc que no distingix majúscules (APFS) resol també un camí amb una altra caixa: es reapunta igual.
  const MAJ = X.replace('prompt', 'PROMPT');
  const senseCaixa = hi(root, `${DESK}/${MAJ}`);
  const C = `${ACTES}/250101_1001_acta_caixa.md`;
  if (senseCaixa) posa(root, C, `# C\n\n[t](../04_escriptori/${MAJ})\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const S = '250101_Sessio_Prova';
  const p = porta(root, ['--arxiva', '--nom', X, '--sessio', S]);
  assert.equal(p.status, 0, p.stderr);
  assert.ok(hi(root, `${ARXIU}/${S}/${X}`));
  assert.equal(llig(root, B), `# B\n\n[[../90_arxiu_historic/${S}/${XS}|${XS}]] i [t](../90_arxiu_historic/${S}/${X})\n`);
  if (senseCaixa) assert.equal(llig(root, C), `# C\n\n[t](../90_arxiu_historic/${S}/${X})\n`);
});

/* ── T3 · Esmena estreta del torn tancat ──────────────────────────────────── */

test('T3 · el torn tancat del rebut propi rep només files[D] nou, amb rastre reversible; el document continua vàlid i porta-documents no veu cap artefacte modificat', (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  const C = d.turn.turn_id;
  const abansC = JSON.parse(crus(root, C));
  openTurn(root, { actor: 'test', scope: 'documents' });
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 0, p.stderr + p.stdout);
  assert.match(p.stdout, /esmena de verification\.files/);
  assert.match(p.stdout, /Versiona junts: .*\.agents\/runtime\/turns\//);

  const despres = llig(root, d.file);
  assert.notEqual(despres, d.content);
  assert.ok(despres.includes(`[[../90_arxiu_historic/${XS}|${XS}]]`));
  const turn = readTurn(root, C, { closed: true });
  assert.equal(turn.verification.files[d.file], sha(despres));
  assert.equal(turn.verification.at, abansC.verification.at, 'la data del segell no canvia');
  assert.deepEqual(turn.verification.checks, abansC.verification.checks, 'cap verificació nova');
  for (const [file, hash] of Object.entries(abansC.verification.files)) if (file !== d.file) assert.equal(turn.verification.files[file], hash, file);
  const ev = turn.history.at(-1);
  assert.equal(ev.action, 'archive-links');
  assert.equal(ev.file, d.file);
  assert.equal(ev.fromHash, sha(d.content));
  assert.equal(ev.toHash, sha(despres));
  assert.equal(sha(desfesSubstitucions(despres, ev.replacements)), ev.fromHash, 'el rastre torna els bytes d’abans');
  assert.deepEqual(validateDocument(root, despres, d.file, { closed: true }), []);
  assert.ok(!checkDocuments(root, { all: true }).errors.some((e) => /Artefacte modificat/.test(e)));
});

test('T4 · C1: un altre torn tancat amb D al seu inventari (hash vell) queda idèntic byte a byte i no atura l’arxivat', (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  const k = validDoc(root, { suffix: 'alie' });
  writeDoc(root, k);
  const plan = validDoc(root, { route: 'pla.implementacio', turn: k.turn, suffix: 'alie_pla' });
  writeDoc(root, plan);
  bindPlan(root, k.turn.turn_id, plan.file);
  relay(root, k.turn.turn_id);
  sealTurn(root, k.turn.turn_id, ok, { close: true });
  const K = JSON.parse(crus(root, k.turn.turn_id));
  K.verification.files[d.file] = 'f'.repeat(64);
  fs.writeFileSync(registre(root, k.turn.turn_id), `${JSON.stringify(K, null, 2)}\n`);
  const abansK = crus(root, k.turn.turn_id);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 0, p.stderr + p.stdout);
  assert.equal(crus(root, k.turn.turn_id), abansK, 'el torn aliè no es toca');
  assert.equal(readTurn(root, d.turn.turn_id, { closed: true }).verification.files[d.file], sha(llig(root, d.file)));
});

test('T5 · preimatge divergent a l’Escriptori: exit 2 sense moure res; el missatge nomena D i C; --sec diu que s’aturaria i ix amb 1', (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  fs.appendFileSync(path.join(root, d.file), '\nEdició posterior al tancament.\n');
  openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X]);
  assert.equal(sec.status, 1, sec.stderr);
  assert.match(sec.stdout, /s'aturaria/);
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 2, p.stdout);
  assert.ok(p.stderr.includes(d.file) && p.stderr.includes(d.turn.turn_id), p.stderr);
  assert.match(p.stderr, /preimatge/);
  assert.deepEqual(foto(root), abans, 'X a la taula, documents i registres idèntics');
});

test('T6 · torn tancat sense verificació genuïna: a 10_actes es reescriu sense esmena i avisa; a l’Escriptori s’atura', (t) => {
  const root = masAmbX(t);
  const acta = validDoc(root, { route: 'acta', suffix: 'acta_vella' });
  acta.content = ambEnllac(acta.content);
  posa(root, acta.file, acta.content);
  tancaSenseVerificacio(root, acta);
  const abansActa = crus(root, acta.turn.turn_id);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 0, p.stderr + p.stdout);
  assert.ok(llig(root, acta.file).includes(`[[../90_arxiu_historic/${XS}|${XS}]]`));
  assert.match(p.stdout, /sense esmenar el torn/);
  assert.equal(crus(root, acta.turn.turn_id), abansActa);

  const root2 = masAmbX(t);
  const d = validDoc(root2, { suffix: 'escriptori_vell' });
  d.content = ambEnllac(d.content);
  writeDoc(root2, d);
  tancaSenseVerificacio(root2, d);
  openTurn(root2, { actor: 'test', scope: 'documents' });
  const abans = foto(root2);
  const q = porta(root2, ['--arxiva', '--nom', X]);
  assert.equal(q.status, 2, q.stdout);
  assert.match(q.stderr, /sense verificació genuïna/);
  assert.deepEqual(foto(root2), abans);
});

/* ── T7-T8 · Torns oberts de qualsevol abast ──────────────────────────────── */

test('T7 · C2: el pla reescrit d’un torn obert d’abast code rep plan.hash nou amb rastre i el torn no diu «Pla absent o modificat»', (t) => {
  const root = masAmbX(t);
  const p = validDoc(root, { scope: 'code', route: 'pla.implementacio', suffix: 'pla_codi' });
  p.content = ambEnllac(p.content);
  writeDoc(root, p);
  bindPlan(root, p.turn.turn_id, p.file);
  // Verificat però obert: canviar-li el pla invalida la verificació (com bindPlan i context).
  relay(root, p.turn.turn_id);
  assert.equal(sealTurn(root, p.turn.turn_id, ok).state, 'verified');
  openTurn(root, { actor: 'test', scope: 'documents' });
  const r = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const turn = readTurn(root, p.turn.turn_id);
  assert.equal(turn.plan.hash, sha(llig(root, p.file)));
  assert.equal(turn.state, 'planned');
  assert.equal(turn.verification, null, 'cap verificació vella sobre un pla nou');
  const ev = turn.history.at(-1);
  assert.equal(ev.action, 'archive-links');
  assert.equal(ev.state, 'planned');
  assert.deepEqual(ev.plan, { file: p.file, fromHash: sha(p.content), toHash: turn.plan.hash });
  const errors = checkTurn(root, p.turn.turn_id).errors;
  assert.ok(!errors.some((e) => /Pla absent o modificat|Document eliminat sense relleu/.test(e)), errors.join('\n'));
});

test('T8 · C3: els torns oberts que veien X el porten a relocated i no diuen «Document eliminat sense relleu»; l’autor porta el rastre', (t) => {
  const root = masAmbX(t);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n[t](../_wiki_de_poble/04_escriptori/${X})\n`);
  const codi = openTurn(root, { actor: 'test', scope: 'code' });
  const autor = openTurn(root, { actor: 'test', scope: 'documents' });
  const r = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  for (const id of [codi.turn_id, autor.turn_id]) {
    const turn = readTurn(root, id);
    assert.ok(turn.relocated.includes(`${DESK}/${X}`), id);
    assert.ok(!checkTurn(root, id).errors.some((e) => e.includes(`Document eliminat sense relleu: ${DESK}/${X}`)), id);
  }
  const ev = readTurn(root, autor.turn_id).history.find((e) => e.role === 'autor');
  assert.ok(ev, 'el torn autor porta el rastre');
  assert.deepEqual(ev.moves.map((m) => [m.from, m.to]), [[`${DESK}/${X}`, `${ARXIU}/${X}`]]);
  assert.deepEqual(ev.rewrites.map((w) => w.file), ['.agents/ESTAT.md']);
  assert.deepEqual(ev.relocatedIn.sort(), [codi.turn_id, autor.turn_id].sort());
});

/* ── T9-T11 · Aturades ────────────────────────────────────────────────────── */

test('T9 · un document de la zona humana que enllaça X atura amb exit 2 i no canvia res', (t) => {
  const root = masAmbX(t);
  posa(root, `${DESK}/01_produccio/250101_1100_nota_humana.md`, `# Humana\n\n[[${XS}]]\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 2, p.stdout);
  assert.match(p.stderr, /zona humana/);
  assert.deepEqual(foto(root), abans);
});

test('T10 · un Markdown de fora de la Wiki (README de l’arrel) que enllaça X atura', (t) => {
  const root = masAmbX(t);
  posa(root, 'README.md', `# Mas\n\n[t](${DESK}/${X})\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 2, p.stdout);
  assert.match(p.stderr, /README\.md \(fora de la Wiki\)/);
  assert.deepEqual(foto(root), abans);
});

test('T11 · autor: dos torns documentals sense --torn aturen amb els candidats; amb --torn passa; sense torns ni enllaços, com sempre', (t) => {
  const root = masAmbX(t);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n[[${XS}]]\n`);
  const a = openTurn(root, { actor: 'maria', scope: 'documents' });
  const b = openTurn(root, { actor: 'codex', scope: 'documents' });
  const abans = foto(root);
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 2, p.stdout);
  assert.ok(p.stderr.includes(a.turn_id) && p.stderr.includes(b.turn_id), p.stderr);
  assert.match(p.stderr, /--torn ID/);
  assert.deepEqual(foto(root), abans);
  const tancat = porta(root, ['--arxiva', '--nom', X, '--torn', 'torn_00000000-0000-4000-8000-000000000000']);
  assert.equal(tancat.status, 2);
  assert.match(tancat.stderr, /ha de ser un torn obert i vigent/);
  const q = porta(root, ['--arxiva', '--nom', X, '--torn', a.turn_id]);
  assert.equal(q.status, 0, q.stderr + q.stdout);
  assert.ok(readTurn(root, a.turn_id).history.some((e) => e.role === 'autor'));
  assert.ok(!readTurn(root, b.turn_id).history.some((e) => e.role === 'autor'));

  // Un Mas sense torns: sense enllaços, l'arxivat de sempre; amb un enllaç, cal un autor.
  const mas = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-enllacos-'));
  t.after(() => fs.rmSync(mas, { recursive: true, force: true }));
  posa(mas, `${DESK}/${X}`, '# x\n');
  posa(mas, INDEX, `# Índex\n\n- [[${XS}]]\n`);
  const sense = porta(mas, ['--arxiva', '--nom', X]);
  assert.equal(sense.status, 0, sense.stderr);
  assert.equal(llig(mas, INDEX), '# Índex\n\n', 'el despenjat de sempre');
  posa(mas, `${DESK}/${X}`, '# x\n');
  fs.rmSync(path.join(mas, ARXIU), { recursive: true });
  posa(mas, `${ACTES}/250101_1200_acta_mas.md`, `# A\n\n[[${XS}]]\n`);
  const amb = porta(mas, ['--arxiva', '--nom', X]);
  assert.equal(amb.status, 2, amb.stdout);
  assert.match(amb.stderr, /no hi ha cap torn documental obert/);
});

/* ── T12 · Concurrència i desfer ──────────────────────────────────────────── */

async function planDe(root, opcions = {}) {
  return planificaArxiu(root, { bruts: arxivables(root, { noms: [X] }), carpeta: ARXIU, ...opcions });
}
const enllacos = (pla) => ({ pla, ambTorns: ambTornsArxiu, reescriu: reescriuEnllacos, hash: hashBytes });

test('T12 · un document amb esmena que canvia entre el pla i l’aplicació desfà tot; sense esmena es recalcula i passa', async (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  const B = `${ACTES}/250101_1000_acta_concurrent.md`;
  posa(root, B, `# B\n\n[[${XS}]]\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const pla = await planDe(root);
  assert.deepEqual(pla.aturades, []);
  fs.appendFileSync(path.join(root, d.file), '\nEdició concurrent.\n');
  const abans = foto(root);
  assert.throws(() => arxiva(root, { noms: [X], enllacos: enllacos(pla) }), /ha canviat des del pla/);
  assert.deepEqual(foto(root), abans, 'X torna a la taula; documents i registres restaurats');
  assert.ok(!fs.readdirSync(path.join(root, '.agents/runtime/turns')).some((n) => n.endsWith('.lock')), 'cap lock de torn orfe');
  assert.ok(!hi(root, '.agents/runtime/document-create.lock'));

  const root2 = masAmbX(t);
  posa(root2, B, `# B\n\n[[${XS}]]\n`);
  openTurn(root2, { actor: 'test', scope: 'documents' });
  const pla2 = await planDe(root2);
  fs.appendFileSync(path.join(root2, B), 'Línia concurrent.\n');
  const r = arxiva(root2, { noms: [X], enllacos: enllacos(pla2) });
  assert.deepEqual(r.moguts.map((m) => m.nota), ['mogut']);
  assert.equal(llig(root2, B), `# B\n\n[[../90_arxiu_historic/${XS}|${XS}]]\nLínia concurrent.\n`);
});

test('T12 · si falla l’escriptura d’un registre de torn després del trasllat, tot torna al lloc: documents, índex, registres i el document mogut', async (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  posa(root, `${ACTES}/250101_1000_acta_desfer.md`, `# B\n\n[[${XS}]]\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const pla = await planDe(root);
  assert.equal(pla.torns.tancats.length, 1);
  const abans = foto(root);
  const original = fs.renameSync;
  fs.renameSync = (de, a) => {
    if (String(a).includes(`${path.sep}runtime${path.sep}turns${path.sep}`) && String(a).endsWith('.json')) throw Object.assign(new Error('disc ple (simulat)'), { code: 'ENOSPC' });
    return original(de, a);
  };
  try { assert.throws(() => arxiva(root, { noms: [X], enllacos: enllacos(pla) }), /disc ple/); }
  finally { fs.renameSync = original; }
  assert.deepEqual(foto(root), abans);
  assert.ok(hi(root, `${DESK}/${X}`) && !hi(root, `${ARXIU}/${X}`));
  assert.equal(llig(root, d.file), d.content);
});

/* ── T13 · --sec pur ──────────────────────────────────────────────────────── */

test('T13 · --sec no toca cap fitxer ni registre i mostra documents, enllaços, torns i autor', (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  const autor = openTurn(root, { actor: 'test', scope: 'documents' });
  const inv = inventory(root);
  const abans = foto(root);
  const p = porta(root, ['--arxiva', '--sec', '--nom', X]);
  assert.equal(p.status, 0, p.stderr);
  assert.deepEqual(inventory(root), inv);
  assert.deepEqual(foto(root), abans);
  assert.match(p.stdout, /simulació: es mouria/);
  assert.match(p.stdout, /1 document\(s\) es reescriurien/);
  assert.ok(p.stdout.includes(`${d.file}: 1 enllaç(os)`), p.stdout);
  assert.ok(p.stdout.includes(`Torn tancat ${d.turn.turn_id}: verification.files[${d.file}]`), p.stdout);
  assert.ok(p.stdout.includes(`Torn obert ${autor.turn_id}: relocated += ${DESK}/${X}`), p.stdout);
  assert.ok(p.stdout.includes(`Autor del rastre: ${autor.turn_id}`), p.stdout);
});

/* ── Correccions de l'àrbitre (A-2, A-3) ─────────────────────────────────── */

test('T9 · un document del laboratori (02_investigacio_ia) que enllaça X atura amb exit 2 i no canvia res', (t) => {
  const root = masAmbX(t);
  posa(root, `${DESK}/02_investigacio_ia/250101_1100_nota_laboratori.md`, `# Laboratori\n\n[[${XS}]]\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 2, p.stdout);
  assert.match(p.stderr, /laboratori \(02_investigacio_ia\)/);
  assert.deepEqual(foto(root), abans);
});

test('T9 · un document viu amb un enllaç dur no es reescriu a cegues: --sec ix amb 1 i l’arxivat s’atura sense moure res', (t) => {
  const root = masAmbX(t);
  const B = `${ACTES}/250101_1000_acta_enllac_dur.md`;
  posa(root, B, `# B\n\n[[${XS}]]\n`);
  const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-dur-'));
  t.after(() => fs.rmSync(fora, { recursive: true, force: true }));
  fs.linkSync(path.join(root, B), path.join(fora, 'mateix-inode.md'));
  openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.match(sec.stdout, /enllaç dur o simbòlic/);
  assert.equal(porta(root, ['--arxiva', '--nom', X]).status, 2);
  assert.deepEqual(foto(root), abans);
});

test('T1 · un enllaç que ja apunta al destí (escrit per avançat) no atura l’arxivat i queda intacte', (t) => {
  const root = masAmbX(t);
  const B = `${ACTES}/250101_1000_acta_avancada.md`;
  const text = `# B\n\n[[../90_arxiu_historic/${XS}|${XS}]] i [t](../90_arxiu_historic/${X})\n`;
  posa(root, B, text);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 0, p.stderr + p.stdout);
  assert.ok(hi(root, `${ARXIU}/${X}`));
  assert.equal(llig(root, B), text);
});

test('T5 · un document amb el rebut d’un altre document del torn tancat s’atura encara que el hash segellat case', (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  const C = d.turn.turn_id;
  const turn = JSON.parse(crus(root, C));
  const alie = Object.values(turn.receipts).find((r) => r.file !== d.file);
  assert.ok(alie, 'el pla del mateix torn porta un altre rebut');
  const text = d.content.replace(/^reflex: .*$/m, `reflex: sdp:${C}:${alie.id}`);
  assert.notEqual(text, d.content);
  posa(root, d.file, text);
  turn.verification.files[d.file] = sha(text);
  fs.writeFileSync(registre(root, C), `${JSON.stringify(turn, null, 2)}\n`);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 2, p.stdout);
  assert.match(p.stderr, /vinculat a un altre document/);
  assert.deepEqual(foto(root), abans);
});

test('T8 · un torn obert que no veia X (obert abans que existira) no rep relocated i el seu registre no es toca', (t) => {
  const root = fixture(t);
  const K = openTurn(root, { actor: 'test', scope: 'code' });
  posa(root, `${DESK}/${X}`, '# Consumit\n');
  fs.appendFileSync(path.join(root, INDEX), `\n## Activitat en curs\n\n- [[${XS}]] · Mestre 250101: prova\n`);
  fs.appendFileSync(path.join(root, '.agents/ESTAT.md'), `\n[[${XS}]]\n`);
  const abansK = crus(root, K.turn_id);
  const autor = openTurn(root, { actor: 'test', scope: 'documents' });
  const p = porta(root, ['--arxiva', '--nom', X]);
  assert.equal(p.status, 0, p.stderr + p.stdout);
  assert.equal(crus(root, K.turn_id), abansK);
  assert.ok(readTurn(root, autor.turn_id).relocated.includes(`${DESK}/${X}`));
});

test('T12 · el pla d’un torn obert canviat entre el pla i l’aplicació desfà tot (CAS estricta per a plan.hash)', async (t) => {
  const root = masAmbX(t);
  const p = validDoc(root, { scope: 'code', route: 'pla.implementacio', suffix: 'pla_concurrent' });
  p.content = ambEnllac(p.content);
  writeDoc(root, p);
  bindPlan(root, p.turn.turn_id, p.file);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const pla = await planDe(root);
  assert.equal(pla.torns.plans.length, 1);
  fs.appendFileSync(path.join(root, p.file), '\nEdició concurrent del pla.\n');
  const abans = foto(root);
  assert.throws(() => arxiva(root, { noms: [X], enllacos: enllacos(pla) }), /ha canviat des del pla/);
  assert.deepEqual(foto(root), abans);
});

test('T12 · un registre de torn tancat canviat entre el pla i l’aplicació atura sota lock, abans de moure res', async (t) => {
  const root = masAmbX(t);
  const d = tancatAmbEnllac(root);
  openTurn(root, { actor: 'test', scope: 'documents' });
  const pla = await planDe(root);
  assert.equal(pla.torns.tancats.length, 1);
  const turn = JSON.parse(crus(root, d.turn.turn_id));
  turn.verification.files[d.file] = 'e'.repeat(64);
  fs.writeFileSync(registre(root, d.turn.turn_id), `${JSON.stringify(turn, null, 2)}\n`);
  const abans = foto(root);
  assert.throws(() => arxiva(root, { noms: [X], enllacos: enllacos(pla) }), new RegExp(`El torn ${d.turn.turn_id} ha canviat des del pla`));
  assert.deepEqual(foto(root), abans);
});

test('T14 · al frontmatter el camí es reapunta sense àlies; si el camí nou en trenca l’esquema, --sec ix amb 1 i l’arxivat s’atura sense moure res', (t) => {
  const root = masAmbX(t);
  const autor = openTurn(root, { actor: 'test', scope: 'documents' });
  const d = validDoc(root, { suffix: 'fm_curt', turn: autor });
  d.content = ambEnllac(d.content).replace(/^description: .*$/m, `description: Continua [[${XS}]]`);
  writeDoc(root, d);
  assert.deepEqual(validateDocument(root, d.content, d.file), []);
  const p = porta(root, ['--arxiva', '--nom', X, '--torn', autor.turn_id]);
  assert.equal(p.status, 0, p.stderr + p.stdout);
  const despres = llig(root, d.file);
  assert.match(despres, new RegExp(`^description: Continua \\[\\[\\.\\./90_arxiu_historic/${XS}\\]\\]$`, 'm'), 'sense àlies al YAML');
  assert.ok(despres.includes(`Vegeu [[../90_arxiu_historic/${XS}|${XS}]].`), 'a la prosa, amb àlies');
  assert.deepEqual(validateDocument(root, despres, d.file), []);

  const root2 = masAmbX(t);
  const autor2 = openTurn(root2, { actor: 'test', scope: 'documents' });
  const e = validDoc(root2, { suffix: 'fm_llarg', turn: autor2 });
  const cua = ` [[${XS}]]`;
  const desc = `Continua ${'x'.repeat(220 - 'Continua '.length - cua.length)}${cua}`;
  assert.equal([...desc].length, 220, 'al màxim de l’esquema');
  e.content = e.content.replace(/^description: .*$/m, `description: ${desc}`);
  writeDoc(root2, e);
  assert.deepEqual(validateDocument(root2, e.content, e.file), [], 'vàlid abans d’arxivar');
  const abans = foto(root2);
  const sec = porta(root2, ['--arxiva', '--sec', '--nom', X, '--torn', autor2.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.match(sec.stdout, /és al frontmatter i reapuntar-lo trencaria l'esquema/);
  const q = porta(root2, ['--arxiva', '--nom', X, '--torn', autor2.turn_id]);
  assert.equal(q.status, 2, q.stdout);
  assert.ok(q.stderr.includes(e.file), q.stderr);
  assert.match(q.stderr, /frontmatter\.description: massa llarg/);
  assert.deepEqual(foto(root2), abans);
});

/* ── T15 · Portes Frontmatter (F9) i Doctrina després de l'arxivat (Gauntlet G1-A-integ-01/02) ── */

const TRACTOR_FM = fileURLToPath(new URL('../tooling/wiki/tractor-frontmatter.mjs', import.meta.url));
const DOCTRINA = fileURLToPath(new URL('../tooling/gates/tractor-doctrina.mjs', import.meta.url));
const ESTAT = '.agents/ESTAT.md';
const VIU_FM = (descripcio) => `---\ntype: index\nstatus: canonic\ndescription: ${descripcio}\n---\n`;
/** Sense GIT_*: dins d'un hook, Git classificaria la fixture amb l'índex del repositori real. */
const entorn = (root) => ({ ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_'))), SDP_ARREL: root });
/** Les portes reals exigixen el marcador de l'arrel (tooling/lib/arrel.mjs). */
const ambMarcador = (root) => posa(root, '.agents/AGENTS.md', '# Agents del Mas de proves\n');

/** F9 per document segons el tractor real (tooling/wiki/tractor-frontmatter.mjs --json). */
function f9(root) {
  const r = spawnSync(process.execPath, [TRACTOR_FM, '--json'], { cwd: root, env: entorn(root), encoding: 'utf8', timeout: 60000 });
  assert.notEqual(r.status, 2, `el tractor no pot jutjar la fixture: ${r.stderr}`);
  const per = {};
  for (const it of JSON.parse(r.stdout).fallades.F9) (per[it.n] ||= []).push(it.detall);
  return per;
}

/** Veredicte de la Porta Doctrina real (tooling/gates/tractor-doctrina.mjs --json, abast per defecte .agents). */
function doctrina(root) {
  const r = spawnSync(process.execPath, [DOCTRINA, '--json'], { cwd: root, env: entorn(root), encoding: 'utf8', timeout: 60000 });
  const j = JSON.parse(r.stdout);
  return { status: r.status, absents: j.absents.map((a) => `${a.doc}:${a.linia} ${a.cami}`) };
}

test('T15 · G1-A-integ-01: un viu amb X com a única nota de «## Vincles» atura l’arxivat (--sec ix amb 1); amb una nota viva passa i el tractor de frontmatter no guanya cap F9', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  const Y = `${DESK}/250101_0920_pla_viu.md`;
  const Z = `${ACTES}/250101_0930_acta_control.md`;
  const vincles = (...notes) => `\n## Vincles\n\n${notes.map((n) => `- [[${n}]]`).join('\n')}\n`;
  posa(root, Y, `${VIU_FM('Pla viu de proves')}# Pla viu\n\nText.\n${vincles(XS)}`);
  // Control: el mateix vincle més una nota viva no atura res.
  posa(root, Z, `${VIU_FM('Acta de control')}# Acta\n\nText.\n${vincles(XS, '00_index_escriptori')}`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  const abansF9 = f9(root);
  assert.deepEqual(abansF9[Y] ?? [], [], 'Y és net a F9 abans d’arxivar');
  assert.deepEqual(abansF9[Z] ?? [], []);

  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes(`❌ ${Y}: `), sec.stdout);
  assert.match(sec.stdout, /quedaria sense cap nota viva resoluble/);
  assert.match(sec.stdout, /Falta una nota interna única i diferent/);
  assert.ok(!sec.stdout.includes(`❌ ${Z}`), `el control conserva una nota viva: ${sec.stdout}`);
  assert.deepEqual(foto(root), abans, '--sec no toca res');
  const q = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(q.status, 2, q.stdout);
  assert.ok(q.stderr.includes(Y), q.stderr);
  assert.match(q.stderr, /No s'ha mogut res/);
  assert.deepEqual(foto(root), abans, 'l’aturada no mou res');
  assert.deepEqual(f9(root)[Y] ?? [], [], 'Y continua net');

  // Esmena humana: una nota viva a Y. L'arxivat passa i la Porta Frontmatter, executada després, no hi veu res nou.
  posa(root, Y, `${VIU_FM('Pla viu de proves')}# Pla viu\n\nText.\n${vincles(XS, '00_index_escriptori')}`);
  const fet = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(fet.status, 0, fet.stdout + fet.stderr);
  assert.ok(hi(root, `${ARXIU}/${X}`));
  assert.ok(llig(root, Y).includes(`- [[../90_arxiu_historic/${XS}|${XS}]]\n- [[00_index_escriptori]]`), llig(root, Y));
  const despresF9 = f9(root);
  assert.deepEqual(despresF9[Y] ?? [], [], 'el vincle històric és vàlid i la nota viva compta');
  assert.deepEqual(despresF9[Z] ?? [], []);
});

test('T15 · G1-A-integ-01: també atura quan el viu no es reescriu (fora de les fonts de la porta) i X era la seua única nota viva', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  // .agents/LEDGER.md no és font de la porta: el seu [[X]] quedaria «unresolved» i sense cap nota viva.
  fs.writeFileSync(path.join(root, '.agents/LEDGER.md'), `# Ledger\n\n## Vincles\n- [[${XS}]]\n\n## 250101_0900 · entrada\n- Text.\n`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(f9(root)['.agents/LEDGER.md'] ?? [], []);
  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes('❌ .agents/LEDGER.md: '), sec.stdout);
  assert.match(sec.stdout, new RegExp(`${XS}: unresolved`));
  assert.deepEqual(foto(root), abans);
});

test('T15 · G1-A-integ-02: .agents/ESTAT.md amb el camí de X en codi inline atura l’arxivat (--sec ix amb 1); esmenat a mà, passa i la Porta Doctrina continua verda després', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  // Dos seccions ESTAT_ACTUAL: la Doctrina només llig la primera (operationalDocumentText).
  fs.writeFileSync(path.join(root, ESTAT), [
    '# Estat', '', '## ESTAT_ACTUAL · 250101', `Vegeu [[${XS}]] i \`${DESK}/${X}\`.`, '',
    '## ESTAT_ACTUAL · 241231', `Històric: \`${DESK}/${X}\`.`, ''].join('\n'));
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(doctrina(root), { status: 0, absents: [] }, 'Doctrina verda abans d’arxivar');

  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes(`❌ ${ESTAT}:4 cita «${DESK}/${X}» en codi inline`), sec.stdout);
  assert.match(sec.stdout, /Porta Doctrina/);
  assert.ok(!sec.stdout.includes(`${ESTAT}:7`), `la secció històrica no la llig la Doctrina: ${sec.stdout}`);
  const q = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(q.status, 2, q.stdout);
  assert.ok(q.stderr.includes(`${ESTAT}:4`), q.stderr);
  assert.deepEqual(foto(root), abans, 'l’aturada no mou res');
  assert.equal(doctrina(root).status, 0);

  // Esmena humana del camí en codi: l'arxivat passa, reapunta el wikilink i la Doctrina, executada després, és verda.
  fs.writeFileSync(path.join(root, ESTAT), llig(root, ESTAT).replace(`Vegeu [[${XS}]] i \`${DESK}/${X}\``, `Vegeu [[${XS}]] i \`${ARXIU}/${X}\``));
  const fet = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(fet.status, 0, fet.stdout + fet.stderr);
  assert.ok(llig(root, ESTAT).includes(`Vegeu [[../_wiki_de_poble/90_arxiu_historic/${XS}|${XS}]] i \`${ARXIU}/${X}\`.`), llig(root, ESTAT));
  assert.deepEqual(doctrina(root), { status: 0, absents: [] }, 'Doctrina verda després d’arxivar');
});

test('T15 · G1-A-integ-02: un camí en prosa sense cap enllaç (ON_ESTIC) també atura; el nom sol en codi, que la Doctrina troba a l’arxiu, no', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  posa(root, '.agents/ON_ESTIC.md', `# On\n\nSeguix per ${DESK}/${X} quan tornes.\n`);
  fs.appendFileSync(path.join(root, ESTAT), `\nNom sol: \`${X}\`.\n`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(doctrina(root), { status: 0, absents: [] });
  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes(`❌ .agents/ON_ESTIC.md:3 cita «${DESK}/${X}» en prosa`), sec.stdout);
  assert.ok(!sec.stdout.includes(`❌ ${ESTAT}`), `el nom sol resol a l’arxiu després del trasllat: ${sec.stdout}`);
  assert.deepEqual(foto(root), abans);

  // Sense el camí en prosa, l'arxivat passa i la Doctrina queda verda amb el nom sol.
  posa(root, '.agents/ON_ESTIC.md', '# On\n\nSeguix per l’índex quan tornes.\n');
  const fet = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(fet.status, 0, fet.stdout + fet.stderr);
  assert.deepEqual(doctrina(root), { status: 0, absents: [] });
});

test('T15 · l’índex de l’Escriptori: amb X com a única nota viva de «## Vincles» atura; amb una altra nota viva, despenja lleva X i la Porta Frontmatter queda neta', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  const ACTA = '250101_1000_acta_viva';
  posa(root, `${ACTES}/${ACTA}.md`, `${VIU_FM('Acta viva')}# Acta\n`);
  fs.appendFileSync(path.join(root, INDEX), `\n## Vincles\n\n- [[${XS}]]\n`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(f9(root)[INDEX] ?? [], []);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes(`❌ ${INDEX}: després de l'arxivat, «## Vincles» quedaria sense cap nota viva resoluble`), sec.stdout);

  // Control: l'índex no es jutja amb el text d'abans (on [[X]] quedaria «unresolved»), sinó amb el que en deixa despenja.
  fs.appendFileSync(path.join(root, INDEX), `- [[${ACTA}]]\n`);
  const sec2 = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec2.status, 0, sec2.stdout + sec2.stderr);
  const fet = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(fet.status, 0, fet.stdout + fet.stderr);
  assert.match(llig(root, INDEX), new RegExp(`## Vincles\\n\\n- \\[\\[${ACTA}\\]\\]\\n$`));
  assert.deepEqual(f9(root)[INDEX] ?? [], [], 'la Porta Frontmatter, executada després, no hi veu res');
});

/** X amb un àlies: el resolutor de la Porta Frontmatter el troba també per l'àlies. */
const ALIES = 'Prompt consumit de proves';
const X_AMB_ALIES = `---\ntype: index\nstatus: canonic\ndescription: Consumit\naliases:\n  - ${ALIES}\n---\n# Consumit\n`;

test('T15 · G1-A-integ-01 (ARB-F9-01): el deute F9 que el viu ja portava (un vincle absent) no atura; amb una nota viva i [[X]], l’arxivat passa i el tractor real no hi veu cap fallada nova', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  const Y = `${ACTES}/250101_1000_acta_amb_deute.md`;
  posa(root, Y, `${VIU_FM('Acta amb deute previ')}# Acta\n\n## Vincles\n\n- [[${XS}]]\n- [[no_existix]]\n- [[00_index_escriptori]]\n`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(f9(root)[Y], ['no_existix: unresolved'], 'Y ja porta deute F9 abans d’arxivar');
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 0, sec.stdout + sec.stderr);
  assert.ok(!sec.stdout.includes('❌'), `el deute vell no és cap fallada nova: ${sec.stdout}`);
  const fet = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(fet.status, 0, fet.stdout + fet.stderr);
  assert.ok(hi(root, `${ARXIU}/${X}`));
  assert.ok(llig(root, Y).includes(`- [[../90_arxiu_historic/${XS}|${XS}]]\n- [[no_existix]]`), llig(root, Y));
  assert.deepEqual(f9(root)[Y], ['no_existix: unresolved'], 'el mateix deute, cap fallada nova');
});

test('T15 · G1-A-integ-01 (ARB-F9-02): un «## Vincles» que només nomena X pel seu àlies també atura (--sec ix amb 1, l’arxivat amb 2) i no es mou res', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  posa(root, `${DESK}/${X}`, X_AMB_ALIES);
  const Y = `${ACTES}/250101_1000_acta_per_alies.md`;
  posa(root, Y, `${VIU_FM('Acta per àlies')}# Acta\n\n## Vincles\n\n- [[${ALIES}]]\n`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(f9(root)[Y] ?? [], [], 'l’àlies resol a X abans d’arxivar');
  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes(`❌ ${Y}: després de l'arxivat, «## Vincles» quedaria sense cap nota viva resoluble`), sec.stdout);
  assert.ok(sec.stdout.includes(`${ALIES}: unresolved`), sec.stdout);
  const q = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(q.status, 2, q.stdout);
  assert.ok(q.stderr.includes(Y), q.stderr);
  assert.deepEqual(foto(root), abans, 'l’aturada no mou res');
  assert.deepEqual(f9(root)[Y] ?? [], []);
});

test('T15 · l’índex de l’Escriptori (ARB-F9-04): un àlies de X a «## Vincles», que despenja no lleva, atura encara que hi quede una altra nota viva; amb el camí sencer de X, despenja el lleva i passa net', (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  posa(root, `${DESK}/${X}`, X_AMB_ALIES);
  const ACTA = '250101_1000_acta_viva';
  posa(root, `${ACTES}/${ACTA}.md`, `${VIU_FM('Acta viva')}# Acta\n`);
  const ambVincles = (primer) => fs.writeFileSync(path.join(root, INDEX),
    `${INDEX_FM}\n## Activitat en curs\n\n- [[${XS}]] · Mestre 250101: prova\n\n## Vincles\n\n- [[${primer}]]\n- [[${ACTA}]]\n`);
  ambVincles(ALIES);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(f9(root)[INDEX] ?? [], []);
  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes(`❌ ${INDEX}: després de l'arxivat, «## Vincles» guanyaria fallades a la Porta Frontmatter (F9: ${ALIES}: unresolved)`), sec.stdout);
  const q = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(q.status, 2, q.stdout);
  assert.deepEqual(foto(root), abans, 'l’aturada no mou res');

  // Control: amb el camí sencer, resolAncora el porta a X, despenja el lleva i la Porta Frontmatter queda neta.
  ambVincles(`${DESK}/${XS}`);
  const fet = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(fet.status, 0, fet.stdout + fet.stderr);
  assert.match(llig(root, INDEX), new RegExp(`## Vincles\\n\\n- \\[\\[${ACTA}\\]\\]\\n$`));
  assert.deepEqual(f9(root)[INDEX] ?? [], [], 'la Porta Frontmatter, executada després, no hi veu res');
});

test('T15 · fail-closed:si el resolutor de la Porta Frontmatter no es pot carregar (arrel sense marcador) i un «## Vincles» nomena X, --sec ix amb 1 i no es mou res', (t) => {
  const root = masAmbX(t); // sense .agents/AGENTS.md: parse.mjs no pot resoldre l'arrel imposada
  const Y = `${DESK}/250101_0920_pla_viu.md`;
  posa(root, Y, `${VIU_FM('Pla viu de proves')}# Pla viu\n\n## Vincles\n\n- [[${XS}]]\n- [[00_index_escriptori]]\n`);
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  const abans = foto(root);
  const sec = porta(root, ['--arxiva', '--sec', '--nom', X, '--torn', T.turn_id]);
  assert.equal(sec.status, 1, sec.stdout + sec.stderr);
  assert.ok(sec.stdout.includes(`❌ ${Y}: «## Vincles» nomena un document que es mou, però el resolutor de la Porta Frontmatter no s'ha pogut carregar`), sec.stdout);
  const q = porta(root, ['--arxiva', '--nom', X, '--torn', T.turn_id]);
  assert.equal(q.status, 2, q.stdout);
  assert.deepEqual(foto(root), abans);
});

test('T15 · paritat F9: la regla replicada al pla dona, document a document, les mateixes fallades F9 que el tractor real', async (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  const doc = (nom, cos) => posa(root, `${ACTES}/${nom}.md`, `${VIU_FM(`Paritat ${nom}`)}# ${nom}\n\n${cos}`);
  posa(root, `${ARXIU}/240101_0900_antic.md`, '# Antic\n');
  posa(root, `${ARXIU}/240101_Sessio/240101_0901_antic_sessio.md`, '# Antic de sessió\n');
  posa(root, `${ACTES}/homonim.md`, '# H1\n');
  posa(root, `${DESK}/homonim.md`, '# H2\n');
  doc('p01_viu', '## Vincles\n\n- [[00_index_escriptori]]\n');
  doc('p02_auto', '## Vincles\n\n- [[p02_auto]]\n');
  doc('p03_absent', '## Vincles\n\n- [[no_existix]]\n- [[00_index_escriptori]]\n');
  doc('p04_ambigu', '## Vincles\n\n- [[homonim]]\n');
  doc('p05_fragment', '## Vincles\n\n- [[00_index_escriptori#Activitat]]\n');
  doc('p06_prosa', '## Vincles\n\nText lliure i [[00_index_escriptori]].\n');
  doc('p07_dues', '## Vincles\n\n- [[00_index_escriptori]]\n\n## Vincles\n\n- [[p01_viu]]\n');
  doc('p08_cap', '## Altres\n\n- [[00_index_escriptori]]\n');
  doc('p09_arxivat', '## Vincles\n\n- [[../90_arxiu_historic/240101_0900_antic|antic]]\n');
  doc('p10_arxivat_absent', '## Vincles\n\n- [[../90_arxiu_historic/240101_0902_mai]]\n- [[p01_viu]]\n');
  doc('p11_sessio', '## Vincles\n\n- [[../90_arxiu_historic/240101_Sessio/240101_0901_antic_sessio]]\n- [[p01_viu]]\n');
  doc('p12_escapat', '## Vincles\n\n- [[p01_viu\\|àlies]]\n');
  doc('p13_codi', '## Vincles\n\n```\n## Vincles\n```\n- [[p01_viu]]\n<!-- - [[p99]] -->\n');
  posa(root, `${ACTES}/p14_yaml.md`, '---\ntype: [obert\n---\n# Y\n\n## Vincles\n\n- [[p01_viu]]\n');
  doc('p15_codi_inline', '## Vincles\n\n- `[[p01_viu]]`\n- [[p01_viu]]\n');
  const tractor = f9(root);
  const replica = await fallidesF9(root);
  assert.ok(Object.keys(tractor).length > 10, `la fixture exercita F9: ${JSON.stringify(tractor)}`);
  assert.deepEqual(replica, tractor);
});

test('T15 · paritat Doctrina: les línies que el pla atura són exactament les que la Porta Doctrina veu ABSENT si s’aplica el pla sense aturar-lo', async (t) => {
  const root = masAmbX(t);
  ambMarcador(root);
  const ple = `${DESK}/${X}`;
  // La Doctrina només informa la primera aparició de cada camí per document: una forma per fitxer.
  const formes = {
    f1: `Codi: \`${ple}\`.`,                         // codi inline: atura
    f2: `Sufix: \`04_escriptori/${X}\`.`,            // sufix amb carpeta: atura
    f3: `Nom sol: \`${X}\`.`,                         // nom sol: la Doctrina el troba a l'arxiu
    f4: `Prosa: ${ple} quan tornes.`,                 // prosa: atura
    f5: `Línia: \`${ple}:12\`.`,                      // sufix de línia: atura
    f6: `\`\`\`\ncat \`${ple}\`\n\`\`\``,             // codi inline dins d'un bloc: atura
    f7: `\`\`\`\ncat ${ple}\n\`\`\``,                 // prosa dins d'un bloc: no la llig
    f8: `Enllaç: [el prompt](${ple}).`,               // destinació d'un enllaç que l'SCC no resol: atura
    g1: `Punt: \`./${ple}\`.`,                        // R() de la Doctrina normalitza «./»: atura (ARB-F9-03)
    g2: `Tornada: \`${ACTES}/../04_escriptori/${X}\`.`, // i «x/../»: atura (ARB-F9-03)
  };
  for (const [nom, cos] of Object.entries(formes)) posa(root, `.agents/notes/${nom}.md`, `# ${nom}\n\n${cos}\n`);
  // ESTAT: l'enllaç es reescriu; la secció històrica, la Doctrina no la llig.
  fs.writeFileSync(path.join(root, ESTAT), ['# Estat', '', '## ESTAT_ACTUAL · 250101', `[t](../${ple}) i [[${XS}]]`, '',
    '## ESTAT_ACTUAL · 241231', `\`${ple}\``, ''].join('\n'));
  const T = openTurn(root, { actor: 'test', scope: 'documents' });
  assert.deepEqual(doctrina(root), { status: 0, absents: [] }, 'verda abans');
  const pla = await planificaArxiu(root, { bruts: arxivables(root, { noms: [X] }), torn: T.turn_id });
  const atura = pla.aturades.map((a) => /^(\.agents\/[^:]+:\d+) cita /.exec(a)?.[1]).filter(Boolean).sort();
  assert.deepEqual(atura, ['f1.md:3', 'f2.md:3', 'f4.md:3', 'f5.md:3', 'f6.md:4', 'f8.md:3', 'g1.md:3', 'g2.md:3'].map((x) => `.agents/notes/${x}`), pla.aturades.join('\n'));
  // Aplica el pla a mà, sense aturar-lo: els textos reescrits i el trasllat. La Doctrina real ha de veure les mateixes línies.
  for (const r of pla.reescriptures) fs.writeFileSync(path.join(root, r.rel), r.despres);
  fs.mkdirSync(path.join(root, ARXIU), { recursive: true });
  fs.renameSync(path.join(root, ple), path.join(root, ARXIU, X));
  const d = doctrina(root);
  assert.equal(d.status, 1);
  assert.deepEqual(d.absents.map((a) => a.split(' ')[0]).sort(), atura);
});
