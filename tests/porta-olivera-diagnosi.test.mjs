/** Diagnosi de la incidència de MarIA del 261002: «esborrar i arxivar» a l'Escriptori.
 *
 *  MarIA va deixar l'Escriptori net per força bruta: sis documents d'avui moguts a
 *  mà a `90_arxiu_historic/` i les àncores llevades a mà de l'índex. La traça
 *  `.agents/runtime/antigravity-hook.log` (14:47:53 – 14:50:55Z) en conserva els
 *  estats intermedis; estes proves els reproduïxen en un Mas sintètic.
 *
 *  Convenció: una prova «[DEFECTE Dn]» PASSA hui perquè afirma el comportament
 *  defectuós actual. La reparació l'ha d'invertir (i, aleshores, cal reescriure
 *  l'asserció en positiu). Una prova «[CONTROL]» fixa el que ja funciona i ha de
 *  continuar funcionant després de la reparació.
 *
 *  Totes les fixtures viuen a os.tmpdir(): cap prova toca l'Escriptori real, i
 *  cap dada és real (noms de document sintètics amb la data d'avui o 250101).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { inventari, vius, ranci, ancoratge, checkTaula, arxivables, arxiva, avui, checkPayload } from '../tooling/gates/porta-olivera.mjs';
import { checkLocal } from '../tooling/gates/hooks-local.mjs';
import { preTool } from '../tooling/gates/antigravity-hook.mjs';
import { SOURCES } from '../tooling/brain/context-local.mjs';
import { checkTurn, handoffDocument, bindPlan } from '../tooling/documental/turns.mjs';
import { fixture, validDoc, writeDoc, REPO } from './helpers/documental.mjs';

const PORTA = fileURLToPath(new URL('../tooling/gates/porta-olivera.mjs', import.meta.url));
const DESK = '_wiki_de_poble/04_escriptori';
const ARXIU = '_wiki_de_poble/90_arxiu_historic';
const INDEX = `${DESK}/00_index_escriptori.md`;
const DIA = avui();
// Una jornada que sempre és anterior a hui.
const VELL = '250101';

function mas(t, linies = ['# Índex', '']) {
  const arrel = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-diagnosi-')));
  fs.mkdirSync(path.join(arrel, DESK), { recursive: true });
  fs.writeFileSync(path.join(arrel, INDEX), [].concat(linies).join('\n'));
  t.after(() => fs.rmSync(arrel, { recursive: true, force: true }));
  return arrel;
}
const posa = (arrel, nom, text = '# prova\n') => fs.writeFileSync(path.join(arrel, DESK, nom), text);
const index = (arrel) => fs.readFileSync(path.join(arrel, INDEX), 'utf8');
const aTaula = (arrel, nom) => fs.existsSync(path.join(arrel, DESK, nom));
const aArxiu = (arrel, nom) => fs.existsSync(path.join(arrel, ARXIU, nom));
const sense = (nom) => nom.replace(/\.md$/, '');
const entornSenseArrel = () => { const e = { ...process.env }; delete e.SDP_ARREL; return e; };

/* ── 1. La seqüència de MarIA, estat per estat ────────────────────────────── */

test('[DEFECTE D1+D2] la seqüència del 261002: --arxiva per defecte no veu els d’avui, --nom cau sencer per una «visio» i el trasllat a mà deixa fantasmes', (t) => {
  const g = `${DIA}_0045_pla_implementacio_gestoria.md`;
  const a = `${DIA}_0205_pla_implementacio_arbre_genealogic.md`;
  const v = `${DIA}_0310_visio_arquitectonica_expansio.md`;
  const fp = `${DIA}_1245_pla_implementacio_alarma_fatiga.md`;
  const fr = `${DIA}_1245_prompt_claude_alarma_fatiga.md`;
  const au = `${DIA}_1525_auditoria_claude.md`;
  const sis = [g, a, v, fp, fr, au];
  const arrel = mas(t, [
    '# Índex', '', '## Activitat en curs', '',
    ...[g, a, v, fp, fr].map((n) => `- [[${sense(n)}]]`),
    '', '## Altres enllaços', '',
    `- [[${sense(fp)}]]`, '', `- [[${sense(fr)}]]`, '', `- [[${sense(au)}]]`, ''
  ]);
  for (const n of sis) posa(arrel, n);

  // Abans de netejar, la taula és «neta»: tot ancorat i res d'una jornada anterior.
  assert.equal(checkTaula(arrel).valid, true);

  // D2: el mode per defecte (npm run olivera:arxiva) només mou jornades anteriors.
  assert.deepEqual(ranci(arrel, DIA), []);
  assert.deepEqual(arxiva(arrel).moguts, []);
  for (const n of sis) assert.ok(aTaula(arrel, n), `${n} no s'ha mogut`);

  // D1: per nom, una sola categoria fora de TRANSITORIES («visio») atura el lot sencer.
  assert.throws(() => arxiva(arrel, { noms: sis }), /la categoria «visio» no és de torn/);
  for (const n of sis) assert.ok(aTaula(arrel, n), `${n} continua a la taula després de l'error`);
  // Sense la «visio», els altres cinc sí que eixirien: l'únic bloqueig és la categoria.
  assert.equal(arxivables(arrel, { noms: sis.filter((n) => n !== v) }).length, 5);

  // Traça 14:47:53Z: llevar a mà les àncores d'«Activitat en curs» abans de moure.
  fs.writeFileSync(path.join(arrel, INDEX), index(arrel).replace(/## Activitat en curs\n\n(?:- \[\[[^\]]+\]\]\n)+/, '## Activitat en curs\n\n'));
  const brut = checkTaula(arrel);
  assert.equal(brut.valid, false);
  assert.match(brut.errors.join('\n'), new RegExp(`Sense àncora a l’índex: ${g}, ${a}, ${v}`));

  // Traça 14:49:21Z: trasllat a mà dels sis. Les àncores de baix queden fantasma.
  fs.mkdirSync(path.join(arrel, ARXIU), { recursive: true });
  for (const n of sis) fs.renameSync(path.join(arrel, DESK, n), path.join(arrel, ARXIU, n));
  assert.deepEqual(ancoratge(arrel).fantasma, [sense(fp), sense(fr), sense(au)]);
  assert.equal(checkTaula(arrel).valid, false);
});

test('[CONTROL] l’ús canònic funciona per a categories de torn: --arxiva --nom mou els d’avui i despenja les línies «- [[X]]»', (t) => {
  const p = `${DIA}_1245_prompt_claude_alarma_fatiga.md`;
  const q = `${DIA}_1245_pla_implementacio_alarma_fatiga.md`;
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '', `- [[${sense(p)}]]`, `- [[${sense(q)}]]`, '']);
  posa(arrel, p); posa(arrel, q);
  const r = arxiva(arrel, { noms: [p, q] });
  assert.deepEqual(r.moguts.map((m) => m.nota), ['mogut', 'mogut']);
  assert.ok(aArxiu(arrel, p) && aArxiu(arrel, q));
  assert.equal(checkTaula(arrel).valid, true);
});

/* ── 2. Categories sense eixida ───────────────────────────────────────────── */

test('[DEFECTE D1] categories fora de TRANSITORIES (visio, brainstorming, estudi, planificacio) mai són rancies i per nom no ixen: la taula diu «neta» per sempre', (t) => {
  const noms = ['visio_x', 'brainstorming_x', 'estudi_x', 'planificacio_x'].map((c) => `${VELL}_0900_${c}.md`);
  const arrel = mas(t, ['# Índex', '', '## Altres', '', ...noms.map((n) => `- [[${sense(n)}]]`), '']);
  for (const n of noms) posa(arrel, n);
  assert.deepEqual(inventari(arrel).map((d) => d.categoria).sort(), ['brainstorming', 'estudi', 'planificacio', 'visio']);
  assert.deepEqual(ranci(arrel, DIA), [], 'cap categoria no transitòria es considera consumida');
  assert.equal(checkTaula(arrel).valid, true, 'documents de 250101 damunt la taula i la porta diu net');
  for (const n of noms) assert.throws(() => arxivables(arrel, { noms: [n] }), /no és de torn/);
});

/* ── 3. Àncores ───────────────────────────────────────────────────────────── */

test('[CONTROL D3] una àncora amb .md o #secció és coherent entre vius i ancoratge', (t) => {
  const a = `${VELL}_0900_prompt_a.md`;
  const b = `${VELL}_0905_auditoria_b.md`;
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '', `- [[${a}]]`, `- [[${sense(b)}#T6]]`, '']);
  posa(arrel, a); posa(arrel, b);
  assert.deepEqual([...vius(arrel)].sort(), [sense(a), sense(b)], 'vius() lleva «.md» i «#»: els dos són vius');
  const anc = ancoratge(arrel);
  assert.deepEqual(anc.senseAncora, []);
  assert.deepEqual(anc.fantasma, []);
  assert.equal(checkTaula(arrel).valid, true);
});

test('[CONTROL D4] --arxiva despenja només els tokens moguts en taula, prosa i llista; preserva altres àncores', (t) => {
  const [A, B, C, D, E] = ['a', 'b', 'c', 'd', 'e'].map((x) => `${VELL}_0900_auditoria_${x}.md`);
  const arrel = mas(t, [
    '# Índex', '', '## Activitat en curs', '',
    '| Document | Estat |', '| --- | --- |', `| [[${sense(A)}]] | consumit |`, '',
    `Vegeu també [[${sense(B)}]] per al context.`, '',
    `* [[${sense(C)}]]`, '',
    `- [[${sense(D)}]] · [[${sense(E)}]]`, ''
  ]);
  for (const n of [A, B, C, D, E]) posa(arrel, n);
  assert.deepEqual(ancoratge(arrel), { senseAncora: [], fantasma: [] });
  const r = arxiva(arrel, { noms: [A, B, C, D] });
  assert.equal(r.moguts.filter((m) => m.nota === 'mogut').length, 4);
  const anc = ancoratge(arrel);
  assert.deepEqual(anc.fantasma, []);
  assert.deepEqual(anc.senseAncora, []);
  assert.match(index(arrel),new RegExp(`\\[\\[${sense(E)}\\]\\]`));
  assert.equal(checkTaula(arrel).valid, true);
});

/* ── 4. Col·lisió i arrel ─────────────────────────────────────────────────── */

test('[CONTROL D5] col·lisió a l’arxiu conserva les dues versions i retorna resultat incomplet', (t) => {
  const x = `${VELL}_0900_auditoria_repetida.md`;
  const arrel = mas(t, ['# Índex', '', `- [[${sense(x)}]]`, '']);
  posa(arrel, x);
  fs.mkdirSync(path.join(arrel, ARXIU), { recursive: true });
  fs.writeFileSync(path.join(arrel, ARXIU, x), '# versió anterior\n');
  const p = spawnSync(process.execPath, [PORTA, '--arxiva', '--nom', x], { cwd: arrel, env: { ...process.env, SDP_ARREL: arrel }, encoding: 'utf8', timeout: 10000 });
  assert.equal(p.status, 1, p.stderr);
  assert.match(p.stdout, /ja existia a l’arxiu; no es sobreescriu/);
  assert.ok(aTaula(arrel, x), 'el document continua a la taula');
  assert.match(index(arrel), new RegExp(`\\[\\[${sense(x)}\\]\\]`));
  assert.equal(checkTaula(arrel).valid, false, 'i la porta continua roja després d’un «èxit»');
});

test('[CONTROL D6] l’informe i la simulació resolen l’arrel de l’eina encara que cwd siga una subcarpeta', (t) => {
  const x = `${VELL}_0900_auditoria_rancia.md`;
  const arrel = mas(t, ['# Índex', '', `- [[${sense(x)}]]`, '']);
  posa(arrel, x);
  for (const file of ['tooling/gates/porta-olivera.mjs', 'tooling/lib/arrel.mjs', 'tooling/lib/markdown-prose.mjs', '.agents/AGENTS.md']) {
    fs.mkdirSync(path.dirname(path.join(arrel, file)), { recursive: true });
    fs.copyFileSync(path.join(REPO, file), path.join(arrel, file));
  }
  const cli = path.join(arrel, 'tooling/gates/porta-olivera.mjs');
  const cwd = path.join(arrel, '_wiki_de_poble');
  const inf = spawnSync(process.execPath, [cli, '--informe'], { cwd, env: entornSenseArrel(), encoding: 'utf8', timeout: 10000 });
  assert.equal(inf.status, 1, inf.stderr);
  assert.match(inf.stdout, new RegExp(x));
  const arx = spawnSync(process.execPath, [cli, '--arxiva', '--sec', '--nom', x], { cwd, env: entornSenseArrel(), encoding: 'utf8', timeout: 10000 });
  assert.equal(arx.status, 0, arx.stderr);
  assert.match(arx.stdout, /simulació: es mouria/);
  assert.ok(aTaula(arrel, x), 'la simulació no mou el document');
});

/* ── 5. Rebuts de torn: arxivar no fa el relleu, i el relleu no casa amb la porta ── */

test('[DEFECTE D7 parcial] --arxiva no fa el relleu; CONTROL el relleu posterior i àncora amb camí són coherents', (t) => {
  const root = fixture(t);
  const d = validDoc(root, { suffix: 'consumida' });
  writeDoc(root, d);
  const nom = path.basename(d.file);
  const desti = `${ARXIU}/${nom}`;

  const r = arxiva(root, { noms: [nom] });
  assert.deepEqual(r.moguts.map((m) => m.nota), ['mogut']);
  // El rebut del torn continua apuntant a l'Escriptori.
  const abans = checkTurn(root, d.turn.turn_id).errors;
  assert.ok(abans.includes(`Document eliminat sense relleu: ${d.file}`), abans.join('\n'));

  // Relleu fet a mà (és el que mana la skill i el que el hook de Claude i Codex nega).
  // 261006: el rebut d'un torn obert conserva una àncora amb camí davall de
  // «## Arxivat amb la Porta Olivera», i el relleu ja no deixa el torn sense àncora.
  handoffDocument(root, d.turn.turn_id, d.file, desti);
  let errors = checkTurn(root, d.turn.turn_id).errors;
  assert.ok(!errors.some((e) => e.startsWith('Document eliminat sense relleu')));
  assert.ok(!errors.includes(`Document sense àncora: ${desti}`), errors.join('\n'));
  assert.ok(index(root).includes(`## Arxivat amb la Porta Olivera\n\n- [[../90_arxiu_historic/${sense(nom)}]]\n`), index(root));

  // L'àncora amb camí acredita el document arxivat en les dues portes.
  fs.appendFileSync(path.join(root, INDEX), `\n- [[../90_arxiu_historic/${sense(nom)}]]\n`);
  errors = checkTurn(root, d.turn.turn_id).errors;
  assert.ok(!errors.includes(`Document sense àncora: ${desti}`));
  assert.equal(checkTaula(root).valid, true);

  // Una àncora plana extra és fantasma i no és la prova del document arxivat.
  fs.appendFileSync(path.join(root, INDEX), `\n- [[${sense(nom)}]]\n`);
  errors = checkTurn(root, d.turn.turn_id).errors;
  assert.ok(!errors.includes(`Document sense àncora: ${desti}`));
  assert.deepEqual(ancoratge(root).fantasma, [sense(nom)]);
  assert.equal(checkTaula(root).valid, false);
});

test('[DEFECTE D8] handoff no pot reapuntar el pla que un altre torn ha vinculat: el torn que el va vincular queda «Pla absent» per sempre', (t) => {
  const root = fixture(t);
  const pla = validDoc(root, { route: 'pla.implementacio', suffix: 'pla_maria' });
  writeDoc(root, pla);
  const codex = validDoc(root, { suffix: 'codex' });
  writeDoc(root, codex);
  bindPlan(root, codex.turn.turn_id, pla.file);

  const nom = path.basename(pla.file);
  const desti = `${ARXIU}/${nom}`;
  arxiva(root, { noms: [nom] });
  handoffDocument(root, pla.turn.turn_id, pla.file, desti);
  assert.throws(() => handoffDocument(root, codex.turn.turn_id, pla.file, desti), /Identitat del relleu divergent/);
  assert.ok(checkTurn(root, codex.turn.turn_id).errors.includes(`Pla absent o modificat: ${pla.file}`));
});

/* ── 6. Hooks: què pot executar cada agent ────────────────────────────────── */

function masAmbHook(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-olivera-hook-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of SOURCES) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(REPO, file), path.join(root, file));
  }
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: {
    'porta:olivera': 'node tooling/gates/porta-olivera.mjs --informe',
    'olivera:arxiva': 'node tooling/gates/porta-olivera.mjs --arxiva',
    'porta:orfandat': 'node tooling/gates/tractor-orfandat.mjs',
  } }));
  // authorizeDocumentCommand exigix que la CLI documental siga un fitxer regular.
  fs.mkdirSync(path.join(root, 'tooling/wiki'), { recursive: true });
  fs.writeFileSync(path.join(root, 'tooling/wiki/document.mjs'), '// marcador de prova\n');
  fs.mkdirSync(path.join(root, DESK), { recursive: true });
  fs.writeFileSync(path.join(root, INDEX), '# Índex\n');
  return root;
}
const bash = (command) => ({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } });

test('[DEFECTE D9] hook de Claude i Codex: AGENTS §0.1 i les skills manen ordres que hooks-local denega', (t) => {
  const root = masAmbHook(t);
  const nom = `${DIA}_1245_prompt_claude_alarma_fatiga.md`;
  const torn = 'torn_00000000-0000-4000-8000-000000000000';
  const casos = [
    // [ordre, codi actual, d'on ve la doctrina]
    ['node tooling/gates/porta-olivera.mjs --informe', 0, 'control'],
    ['npm run porta:olivera', 0, 'control'],
    ['node tooling/gates/porta-olivera.mjs', 2, 'AGENTS §0.1 pas 1 (observa, sense bandera)'],
    [`node tooling/gates/porta-olivera.mjs --arxiva --sec --nom ${nom}`, 2, 'AGENTS §0.1 pas 2 (simulació: no escriu res)'],
    [`node tooling/gates/porta-olivera.mjs --arxiva --nom ${nom}`, 2, 'AGENTS §0.1 pas 2'],
    ['npm run olivera:arxiva', 2, 'core-higiene-escriptori pas 3'],
    ['npm run porta:orfandat', 2, 'core-higiene-escriptori pas 4 (verifica)'],
    [`node tooling/gates/tancament.mjs --check --turn-id ${torn}`, 2, 'wiki-cicle-de-vida pas 8 («És lectura»)'],
  ];
  for (const [ordre, codi, font] of casos) {
    assert.equal(checkLocal(bash(ordre), root).code, codi, `${ordre} · ${font}`);
  }
  const handoff = checkLocal(bash(`node tooling/wiki/document.mjs handoff --turn-id ${torn} --file ${DESK}/${nom} --to ${ARXIU}/${nom}`), root);
  assert.equal(handoff.code, 2, 'wiki-cicle-de-vida pas 6 i porta-olivera.mjs:375 manen handoff');
  assert.match(handoff.errors.join('\n'), /Operació fora del circuit documental ordinari/);
});

test('[CONTROL D10] hook d’Antigravity força permís per mv, rm, cp&&rm i /bin/mv sobre l’Escriptori', () => {
  const root = REPO;
  const doc = `${DESK}/${DIA}_0310_visio_arquitectonica_expansio.md`;
  const run = (CommandLine) => preTool({ toolCall: { name: 'run_command', args: { CommandLine } } }, { root }).decision;
  // Control: la via canònica passa.
  assert.equal(run(`node tooling/gates/porta-olivera.mjs --arxiva --nom ${path.basename(doc)}`), 'allow');
  assert.equal(run(`node tooling/wiki/document.mjs handoff --turn-id ID --file ${doc} --to ${ARXIU}/x.md`), 'allow');
  // El trasllat transparent pregunta...
  assert.equal(run(`mv ${doc} ${ARXIU}/`), 'force_ask');
  assert.equal(run(`git mv ${doc} ${ARXIU}/`), 'force_ask');
  // ...i l'esborrat i les variants que no diuen «mv» s'aproven soles (AGENTS §5).
  assert.equal(run(`rm ${doc}`), 'force_ask');
  assert.equal(run(`cp ${doc} ${ARXIU}/ && rm ${doc}`), 'force_ask');
  assert.equal(run(`/bin/mv ${doc} ${ARXIU}/`), 'force_ask');
});

/* ── 7. Ergonomia: la porta de la petorreta jutja la taula a cada edició ──── */

test('[DEFECTE D11] editar una petorreta ja nascuda queda bloquejat per un document nou d’un altre agent encara sense àncora', (t) => {
  const pla = `${DIA}_1650_pla_implementacio_massiva_claude.md`;
  const prompt = `${DIA}_1650_prompt_claude_massiu.md`;
  const arrel = mas(t, ['# Índex', '', '## Activitat en curs', '', `- [[${sense(pla)}]]`, `- [[${sense(prompt)}]]`, '']);
  posa(arrel, pla); posa(arrel, prompt);
  const edicio = { tool_name: 'Write', tool_input: { file_path: path.join(arrel, DESK, prompt), content: '# Prompt\n\n## 0. Preflight\n\n- [x] Escriptori net\n' } };
  assert.equal(checkPayload(edicio, arrel).code, 0, 'control: amb la taula neta, l’edició passa');
  // Un altre agent acaba d'escriure la seua auditoria i encara no l'ha ancorada.
  const aliena = `${DIA}_1700_auditoria_claude.md`;
  posa(arrel, aliena);
  const r = checkPayload(edicio, arrel);
  assert.equal(r.code, 2);
  assert.deepEqual(r.errors, [`Sense àncora a l’índex: ${aliena}`]);
});


/* T5-08/10: controls nous sobre estructura i derivats, sense maquillar D7–D11. */
test('[CONTROL T5-08] arxiva no declara èxit sobre un Escriptori absent o sense índex',t=>{
 const empty=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-archive-absent-'));t.after(()=>fs.rmSync(empty,{recursive:true,force:true}));
 for (const options of [{},{sec:true},{noms:['250101_0900_auditoria_absent.md']}]) {
  assert.throws(()=>arxiva(empty,options),/Estructura de l'Escriptori absent/);
  assert.equal(fs.existsSync(path.join(empty,ARXIU)),false,'cap carpeta d’arxiu creada');
 }
 const root=mas(t),name=`${VELL}_0900_auditoria_conservada.md`;
 posa(root,name);fs.unlinkSync(path.join(root,INDEX));
 assert.throws(()=>arxiva(root,{noms:[name]}),/Estructura de l'Escriptori absent/);
 assert.equal(aTaula(root,name),true,'fallar abans de moure el document');
 assert.equal(aArxiu(root,name),false);
});
test('[CONTROL T5-10] archivar Markdown preserva byte a byte els derivats i les seues àncores',t=>{
 const name=`${VELL}_0900_auditoria_consumida.md`,resource='prova.jpg';
 const root=mas(t,['# Índex','',`- [[${sense(name)}]]`,`- [[${resource}]]`,'']);
 posa(root,name);posa(root,resource,Buffer.from([255,216,255,0]));
 const before=fs.readFileSync(path.join(root,DESK,resource));
 assert.equal(checkTaula(root).errors.some(e=>e.includes('Àncores a documents absents')),false);
 const result=arxiva(root,{noms:[name]});
 assert.deepEqual(result.moguts.map(x=>x.nota),['mogut']);
 assert.deepEqual(fs.readFileSync(path.join(root,DESK,resource)),before);
 assert.ok(index(root).includes(`[[${resource}]]`),'l’àncora del recurs es conserva');
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[]});
});
