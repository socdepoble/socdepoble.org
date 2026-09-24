/**
 * La porta de plantilla viva, provada abans d'instal·lar-la (i després).
 *
 * Decisió §7.3 de l'auditoria 260924_1810 (Fable): endollar
 * tooling/gates/porta-plantilla-viva.mjs al hook PreToolUse (hooks-local), al
 * pre-commit i a un vigilant launchd. Els dos primers són governança
 * (SECURITY_PATHS): només entren amb executor-mutacio i lease del Mestre. Esta
 * prova els deixa verificats a un pas:
 *
 *   1. Els pegats del laboratori 260924_1815 s'apliquen nets al fitxer actual:
 *      context literal, una sola coincidència i línies senceres (el criteri de
 *      `patchOperations` de hooks-local).
 *   2. El hook pegat bloqueja el Write d'un prompt amb el Context mutilat i deixa
 *      passar el correcte. Cada cas passa també pel hook actual i se n'imprimix
 *      la diferència: és el que el pegat afig de veres.
 *   3. `--staged` jutja els bytes de l'índex (pegat addicional d'esta prova).
 *   4. El codi pegat passa l'ESLint del repositori (lintText: no escriu res).
 *   5. El vigilant: plist vàlid i què passa amb un document heretat que es toca.
 *   6. Diagnòstic del segell de skills, previ a la reconciliació.
 *
 * Tot s'escriu en directoris de os.tmpdir(). Les còpies pegades importen la
 * resta del tooling per URL absoluta del repositori: el pegat es prova contra
 * les dependències reals, no contra dobles. Un pegat que ja està instal·lat es
 * reconeix per la seua marca i no es torna a aplicar: la prova continua valent
 * després de l'executor.
 *
 * Generador per al Mestre (després de `reflex_petorreta.mjs open`):
 *   SDP_PLA_SESSIO=<sessionId> node --test tests/plantilla-viva-installacio.test.mjs
 * deixa a os.tmpdir() el pla d'executor-mutacio, la Petorreta i el manifest del
 * bootstrap, i imprimix les ordres. SDP_PLA_INDEX=0 deixa fora el pegat de
 * l'índex. No escriu res al repositori.
 *
 * Ús:  node --test tests/plantilla-viva-installacio.test.mjs
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { DESK, sha } from '../tooling/documental/core.mjs';
import { openTurn, deliverContext } from '../tooling/documental/turns.mjs';
import { draft } from '../tooling/wiki/document.mjs';
import { SOURCES } from '../tooling/brain/context-local.mjs';
import { checkLocal as hookActual } from '../tooling/gates/hooks-local.mjs';
import { avui, checkOlivera } from '../tooling/gates/porta-olivera.mjs';
import { calculaSegell } from '../tooling/gates/segella.mjs';
import { fixture, REPO } from './helpers/documental.mjs';

const LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/260924_1815_tractor_plantilla_literal';
const llig = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const escriu = (s) => process.stdout.write(`${s}\n`);
const curt = (e) => (e.length > 170 ? `${e.slice(0, 167)}…` : e);

/* ── Pegats ───────────────────────────────────────────────────────────────── */

/* Pegat addicional (no és del laboratori). `--staged` passava per `inspecciona`,
   que llig el disc: amb un índex parcial, el que es jutja no és el que es
   commiteja. Depén de `inspeccionaText`, que porta el pegat del laboratori.
   `cat-file blob` és plomeria: mai aplica textconv ni filtres. */
const PEGAT_INDEX = `@@
 export function fitxersStaged(root) {
   const eixida = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { cwd: root, encoding: 'utf8' });
   return eixida.split('\\0').filter(Boolean)
     .filter((f) => path.posix.dirname(f) === DESK && vigilat(path.posix.basename(f))).sort();
 }
+
+/** Bytes preparats a l'índex: el pre-commit jutja el que es commitejarà, no el disc. */
+export function blobPreparat(root, rel) {
+  return execFileSync('git', ['cat-file', 'blob', \`:\${rel}\`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
+}
@@
-  const informes = fitxers.map((rel) => inspecciona(root, rel, { complet: te('--complet') }));
+  const complet = te('--complet');
+  const informes = fitxers.map((rel) => (te('--staged')
+    ? inspeccionaText(root, rel, blobPreparat(root, rel), { complet })
+    : inspecciona(root, rel, { complet })));
`;

/* pre-commit.txt del laboratori, dit com a pegat: una línia abans de l'exec. */
const PEGAT_PRECOMMIT = `@@
 node tooling/gates/porta-taxonomia.mjs --staged || exit 1
+node tooling/gates/porta-plantilla-viva.mjs --staged || exit 1
 exec node tooling/gates/git-staged.mjs
`;

const OBJECTIUS = [
  { desti: 'tooling/gates/porta-plantilla-viva.mjs', pegats: [
    { nom: `${LAB}/porta-plantilla-viva.patch.txt`, text: () => llig(`${LAB}/porta-plantilla-viva.patch.txt`), marca: 'export function inspeccionaText(' },
    { nom: 'pegat de l’índex (esta prova)', text: () => PEGAT_INDEX, marca: 'export function blobPreparat(', index: true },
  ] },
  { desti: 'tooling/gates/hooks-local.mjs', pegats: [
    { nom: `${LAB}/hooks-local.patch.txt`, text: () => llig(`${LAB}/hooks-local.patch.txt`), marca: "from './porta-plantilla-viva.mjs'" },
  ] },
  { desti: '.husky/pre-commit', pegats: [
    { nom: `${LAB}/pre-commit.txt (una línia)`, text: () => PEGAT_PRECOMMIT, marca: 'porta-plantilla-viva.mjs --staged' },
  ] },
];

/** Hunks d'un pegat del laboratori: capçalera lliure, i `@@` sense números de línia. */
function fragments(text) {
  const hunks = [];
  let dins = false;
  for (const l of text.split('\n')) {
    if (l.startsWith('@@')) { hunks.push([]); dins = true; continue; }
    if (dins && /^[ +-]/.test(l)) hunks.at(-1).push(l);
    else dins = false;
  }
  return hunks;
}

/** Aplica amb context exacte: una sola coincidència i línies senceres. Diu quines línies no hi són. */
function aplica(contingut, hunks) {
  let text = contingut;
  const informe = hunks.map((h, i) => {
    const abans = h.filter((l) => l[0] !== '+').map((l) => l.slice(1));
    const despres = h.filter((l) => l[0] !== '-').map((l) => l.slice(1)).join('\n');
    const bloc = abans.join('\n');
    const coincidencies = text.split(bloc).length - 1;
    const inici = text.indexOf(bloc), fi = inici + bloc.length;
    const senceres = coincidencies === 1 && (inici === 0 || text[inici - 1] === '\n') && (fi === text.length || text[fi] === '\n');
    const linies = new Set(text.split('\n'));
    const absents = abans.filter((l) => !linies.has(l));
    if (senceres) text = text.replace(bloc, () => despres);
    return { hunk: i + 1, coincidencies, senceres, absents };
  });
  return { text, net: hunks.length > 0 && informe.every((r) => r.senceres), informe };
}

function construeix({ index = true } = {}) {
  return OBJECTIUS.map(({ desti, pegats }) => {
    const original = llig(desti);
    let text = original;
    const estats = [];
    for (const p of pegats) {
      if (p.index && !index) continue;
      if (text.includes(p.marca)) { estats.push({ pegat: p.nom, estat: 'ja instal·lat' }); continue; }
      let font;
      try { font = p.text(); } catch (e) { estats.push({ pegat: p.nom, estat: 'no s’aplica', motiu: e.message }); continue; }
      const r = aplica(text, fragments(font));
      estats.push({ pegat: p.nom, estat: r.net ? 'net' : 'no s’aplica', detall: r.informe });
      if (r.net) text = r.text;
    }
    return { desti, original, text, estats };
  });
}

/* ── Còpies pegades a os.tmpdir() ─────────────────────────────────────────── */

const OBRA = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-plantilla-viva-')));
after(() => fs.rmSync(OBRA, { recursive: true, force: true }));

/** Els imports relatius de la còpia apunten al tooling real del repositori. */
function reancora(codi, dirOriginal, propis = {}) {
  return codi.replace(/(\bfrom\s+)'(\.{1,2}\/[^']+)'/g,
    (_m, pre, spec) => `${pre}'${propis[spec] ?? pathToFileURL(path.resolve(dirOriginal, spec)).href}'`);
}

function materialitza(nom, objectius) {
  const dir = path.join(OBRA, nom);
  fs.mkdirSync(dir);
  const gates = path.join(REPO, 'tooling/gates');
  const text = (desti) => objectius.find((o) => o.desti === desti).text;
  const porta = path.join(dir, 'porta-plantilla-viva.mjs');
  fs.writeFileSync(porta, reancora(text('tooling/gates/porta-plantilla-viva.mjs'), gates));
  const hook = path.join(dir, 'hooks-local.mjs');
  fs.writeFileSync(hook, reancora(text('tooling/gates/hooks-local.mjs'), gates, { './porta-plantilla-viva.mjs': pathToFileURL(porta).href }));
  const precommit = path.join(dir, 'pre-commit');
  fs.writeFileSync(precommit, text('.husky/pre-commit'));
  return { porta, hook, precommit };
}

const COMPLET = construeix();
const FABLE = construeix({ index: false });
const COPIES = { complet: materialitza('complet', COMPLET), fable: materialitza('fable', FABLE) };
const { checkLocal: hookPegat } = await import(pathToFileURL(COPIES.complet.hook).href);
const { vigila, plist } = await import(pathToFileURL(COPIES.complet.porta).href);

/* ── Taula de proves ──────────────────────────────────────────────────────── */

const ancora = (root, nom) => fs.appendFileSync(path.join(root, DESK, '00_index_escriptori.md'), `\n- [[${nom}]]\n`);

/** Fixture documental amb les fonts del hook i la pissarra d'avui (la porta Olivera la demana). */
function mesa(t) {
  const root = fixture(t);
  for (const f of [...SOURCES, '.agents/AGENTS.md']) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), path.join(root, f));
  }
  const dia = avui();
  const pla = `${dia}_0200_pla_implementacio_prova`;
  fs.writeFileSync(path.join(root, DESK, `${pla}.md`), '---\ntype: document\nstatus: esborrany\ndescription: Pissarra de la jornada per a la prova\n---\n# Pla de prova\n');
  ancora(root, pla);
  return { root, dia };
}

/** Document nascut del circuit: torn, rebut de context i esborrany de la plantilla, completat. */
function documentDeProva(root, { ruta = 'prompt.local', nom }) {
  const turn = openTurn(root, { scope: 'documents', actor: 'prova-plantilla-viva' });
  const file = `${DESK}/${nom}`;
  const lliurament = deliverContext(root, turn.turn_id, { route: ruta, file });
  const content = draft(lliurament, { title: 'Prova de plantilla viva', description: 'Document de prova per a la porta de plantilla viva' })
    .replaceAll('[pendent]', 'Contingut comprovat amb evidència.');
  return { file, content, route: lliurament.route };
}

function contextResumit({ content, route }) {
  const bloc = route.fixedBlocks.Context;
  assert.equal(content.split(bloc).length, 2, 'el bloc Context ha d’aparéixer una sola vegada');
  return content.replace(bloc, () => 'Llegiu AGENTS.md abans de començar.');
}

function senseContext({ content, route }) {
  const bloc = `\n\n<!-- SDP:SECTION ${route.sectionIds.Context} -->\n## Context\n\n${route.fixedBlocks.Context}`;
  assert.ok(content.includes(bloc), 'la secció Context de l’esborrany té la forma de draft()');
  return content.replace(bloc, () => '');
}

function ambSeccioAfegida({ content, route }) {
  const vincles = `<!-- SDP:SECTION ${route.sectionIds.Vincles} -->`;
  return content.replace(vincles, () => `## Notes lliures\n\nUna secció que la plantilla no porta.\n\n${vincles}`);
}

const escriptura = (file, content) => ({ tool_name: 'Write', tool_input: { file_path: file, content } });

/** El mateix payload pels dos hooks. S'imprimix el de hui i s'avalua el pegat. */
function compara(nom, payload, root) {
  const actual = hookActual(payload, root), pegat = hookPegat(payload, root);
  const viva = pegat.errors.filter((e) => e.startsWith('[Plantilla viva]'));
  escriu(`\n· ${nom}`);
  escriu(`   hook actual: code ${actual.code}${actual.errors.length ? ` · ${actual.errors.map(curt).join(' | ')}` : ''}`);
  escriu(`   hook pegat : code ${pegat.code}${viva.length ? ` · ${viva.map(curt).join(' | ')}` : ''}`);
  return { actual, pegat, viva };
}

/* ── 1. Els pegats ────────────────────────────────────────────────────────── */

test('els pegats s’apliquen nets sobre els fitxers actuals', () => {
  for (const o of COMPLET) {
    for (const e of o.estats) {
      escriu(`${e.estat === 'no s’aplica' ? '❌' : '✅'} ${o.desti} ← ${e.pegat}: ${e.estat}${e.motiu ? ` (${e.motiu})` : ''}`);
      for (const d of e.detall || []) {
        escriu(`     hunk ${d.hunk}: ${d.coincidencies} coincidència(es)${d.senceres ? '' : ' · NO net'}${d.absents.length ? ` · absents: ${d.absents.map((l) => JSON.stringify(l)).join(', ')}` : ''}`);
      }
    }
    assert.ok(o.estats.every((e) => e.estat !== 'no s’aplica'), `${o.desti}: hi ha pegats que no s’apliquen nets`);
  }
  const ordres = (t) => t.split('\n').filter((l) => l.trim() && !l.trimStart().startsWith('#') && !l.startsWith('DESTÍ:'));
  const precommit = COMPLET.find((o) => o.desti === '.husky/pre-commit').text;
  if (fs.existsSync(path.join(REPO, LAB, 'pre-commit.txt'))) {
    assert.deepEqual(ordres(precommit), ordres(llig(`${LAB}/pre-commit.txt`)), 'les ordres del pre-commit pegat són les de pre-commit.txt');
  }
  const sh = spawnSync('sh', ['-n', COPIES.complet.precommit], { encoding: 'utf8' });
  assert.equal(sh.status, 0, sh.stderr);
});

/* ── 2. El hook ───────────────────────────────────────────────────────────── */

test('hook pegat: bloqueja el prompt amb el Context mutilat i deixa passar el correcte', (t) => {
  const { root, dia } = mesa(t);
  const doc = documentDeProva(root, { nom: `${dia}_0300_prompt_prova.md` });

  const bo = compara('Prompt correcte (esborrany de la plantilla, amb rebut, completat)', escriptura(doc.file, doc.content), root);
  assert.equal(bo.pegat.code, 0, bo.pegat.errors.join('\n'));

  const resumit = compara('Context resumit en una línia', escriptura(doc.file, contextResumit(doc)), root);
  assert.equal(resumit.pegat.code, 2);
  assert.ok(resumit.viva.some((e) => e.includes('bloc normatiu alterat: «Context»')), resumit.pegat.errors.join('\n'));

  const absent = compara('Sense la secció Context', escriptura(doc.file, senseContext(doc)), root);
  assert.equal(absent.pegat.code, 2);
  assert.ok(absent.viva.some((e) => e.includes('secció absent: «## Context»')), absent.pegat.errors.join('\n'));
});

test('hook pegat: el que afig al hook actual (seccions, Edit i ruta del rebut)', (t) => {
  const { root, dia } = mesa(t);
  const doc = documentDeProva(root, { nom: `${dia}_0300_prompt_prova.md` });

  const extra = compara('Secció fora de plantilla (Write)', escriptura(doc.file, ambSeccioAfegida(doc)), root);
  assert.equal(extra.pegat.code, 2);
  assert.ok(extra.viva.some((e) => e.includes('secció fora de plantilla: «## Notes lliures»')), extra.pegat.errors.join('\n'));

  // Edit: el hook reconstruïx el candidat a partir del disc.
  fs.writeFileSync(path.join(root, doc.file), doc.content);
  ancora(root, path.basename(doc.file, '.md'));
  const edit = compara('Secció fora de plantilla (Edit sobre el document desat)', { tool_name: 'Edit', tool_input: {
    file_path: doc.file, old_string: '## Vincles', new_string: '## Notes lliures\n\nUna secció que la plantilla no porta.\n\n## Vincles'
  } }, root);
  assert.equal(edit.pegat.code, 2);
  assert.ok(edit.viva.some((e) => e.includes('secció fora de plantilla')), edit.pegat.errors.join('\n'));

  const pla = documentDeProva(root, { ruta: 'auditoria', nom: `${dia}_0400_pla_director.md` });
  const ruta = compara('Rebut d’auditoria per a un fitxer que el nom declara pla', escriptura(pla.file, pla.content), root);
  assert.equal(ruta.pegat.code, 2);
  assert.ok(ruta.viva.some((e) => e.includes('ruta: el rebut és de «auditoria»')), ruta.pegat.errors.join('\n'));
});

/* ── 3. El pre-commit ─────────────────────────────────────────────────────── */

const ENV = Object.fromEntries(Object.entries({ ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' })
  .filter(([k]) => !k.startsWith('GIT_') || ['GIT_CONFIG_GLOBAL', 'GIT_CONFIG_NOSYSTEM'].includes(k)));

test('pre-commit --staged: la porta jutja els bytes de l’índex, no els del disc', (t) => {
  const { root, dia } = mesa(t);
  const git = (...args) => {
    const r = spawnSync('git', args, { cwd: root, env: ENV, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  };
  const porta = (variant) => {
    const r = spawnSync(process.execPath, [COPIES[variant].porta, '--staged'], { cwd: root, env: { ...ENV, SDP_ARREL: root }, encoding: 'utf8' });
    let informe = null;
    try { informe = JSON.parse(r.stdout); } catch { /* l'status ja ho diu */ }
    return { status: r.status, informe, stderr: r.stderr };
  };
  git('init', '--quiet');
  const doc = documentDeProva(root, { nom: `${dia}_0300_prompt_prova.md` });
  const disc = path.join(root, doc.file);
  const mutilat = contextResumit(doc);

  fs.writeFileSync(disc, doc.content);
  git('add', '--', doc.file);
  const net = porta('complet');
  assert.equal(net.status, 0, net.stderr);

  fs.writeFileSync(disc, mutilat);
  git('add', '--', doc.file);
  for (const v of ['complet', 'fable']) assert.equal(porta(v).status, 1, `${v}: índex i disc mutilats han de parar el commit`);

  // Índex mutilat i disc net: el commit s'emportaria el mutilat.
  fs.writeFileSync(disc, doc.content);
  const complet = porta('complet'), fable = porta('fable');
  escriu(`\nÍndex mutilat, disc net · amb el pegat de l'índex: exit ${complet.status} · només el del laboratori: exit ${fable.status}`);
  assert.equal(complet.status, 1, complet.stderr);
  assert.ok(complet.informe?.informes?.[0]?.errors.some((e) => e.includes('bloc normatiu alterat: «Context»')));
});

/* ── 4. ESLint ────────────────────────────────────────────────────────────── */

test('el codi pegat passa l’ESLint del repositori', async () => {
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  for (const o of COMPLET.filter((x) => x.desti.endsWith('.mjs'))) {
    const [r] = await eslint.lintText(o.text, { filePath: path.join(REPO, o.desti) });
    const msgs = r.messages.map((m) => `${o.desti}:${m.line} ${m.ruleId} ${m.message}`);
    escriu(`${msgs.length ? '❌' : '✅'} ESLint ${o.desti}${msgs.length ? `\n   ${msgs.join('\n   ')}` : ''}`);
    assert.equal(msgs.length, 0);
  }
});

/* ── 5. El vigilant ───────────────────────────────────────────────────────── */

test('vigilant: el plist del llançador és vàlid i apunta a fitxers que existixen', { skip: process.platform !== 'darwin' && 'launchd és de macOS' }, () => {
  const text = plist(REPO);
  const fitxer = path.join(OBRA, 'org.socdepoble.plantilla-viva.plist');
  fs.writeFileSync(fitxer, text);
  const lint = spawnSync('plutil', ['-lint', fitxer], { encoding: 'utf8' });
  assert.equal(lint.status, 0, lint.stdout + lint.stderr);
  const cadenes = [...text.matchAll(/<string>([^<]*)<\/string>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  assert.ok(cadenes.includes('--quarantena'), 'el llançador arrenca en mode quarantena');
  for (const f of [process.execPath, path.join(REPO, 'tooling/gates/porta-plantilla-viva.mjs')]) assert.ok(cadenes.includes(f) && fs.existsSync(f), f);
});

test('vigilant: un document heretat sense rebut que es toca va a la paperera i deixa l’àncora òrfena', async (t) => {
  const { root } = mesa(t);
  const heretats = ['260924_1850_prompt_claude', '260924_1850_pla_implementacio_claude'];
  for (const nom of heretats) {
    const font = path.join(REPO, DESK, `${nom}.md`);
    if (!fs.existsSync(font)) { t.skip(`${nom} ja no és a l’Escriptori`); return; }
    fs.copyFileSync(font, path.join(root, DESK, `${nom}.md`));
    ancora(root, nom);
  }
  const dorm = (ms) => new Promise((r) => setTimeout(r, ms));
  // FSEvents pot reenviar la creació recent d'un fitxer al watcher que arranca
  // just després: els heretats s'hi posen abans, i el vigilant arranca més tard.
  await dorm(2000);
  const registre = [];
  const vigilant = vigila(root, { quarantena: true, espera: 100, log: (l) => registre.push(l) });
  const paperera = path.join(root, '.sdp-paperera/plantilles', `${heretats[0]}.md`);
  let quietsEnArrancar;
  try {
    await dorm(1000);
    quietsEnArrancar = heretats.every((nom) => fs.existsSync(path.join(root, DESK, `${nom}.md`)));
    fs.appendFileSync(path.join(root, DESK, `${heretats[0]}.md`), '\n- Una línia més, escrita des d’Antigravity.\n');
    const fi = Date.now() + 8000;
    while (!fs.existsSync(paperera) && Date.now() < fi) await dorm(50);
    await dorm(500);
  } finally { vigilant.tanca(); }
  escriu(`\nVigilant: ${registre.map(curt).join('\n          ') || '(cap esdeveniment)'}`);
  assert.ok(quietsEnArrancar, 'en arrancar, el vigilant denuncia però no mou els heretats');
  assert.ok(fs.existsSync(paperera), 'el prompt heretat tocat ha anat a .sdp-paperera/plantilles/');
  assert.ok(fs.existsSync(`${paperera}.rebuig.json`));
  assert.ok(fs.existsSync(path.join(root, DESK, `${heretats[1]}.md`)), 'el pla heretat que ningú toca es queda');
  const olivera = checkOlivera(root, { contingut: '## 0. Abans de generar\n- [x] fet\n' });
  escriu(`Porta Olivera després del trasllat: ${olivera.errors.map(curt).join(' | ') || 'cap error'}`);
  assert.ok(olivera.errors.some((e) => e.includes('Àncores a documents absents') && e.includes(heretats[0])));
});

/* ── 6. El segell ─────────────────────────────────────────────────────────── */

test('segell de skills: diagnòstic previ a la reconciliació (lectura)', () => {
  const segell = JSON.parse(llig('.agents/SKILLS_SEAL.json'));
  const actual = calculaSegell(REPO);
  const estat = (f) => {
    if (!segell.manifest[f]) return 'afegit   ';
    if (!actual.manifest[f]) return 'eliminat ';
    return segell.manifest[f] === actual.manifest[f] ? null : 'modificat';
  };
  const noms = [...new Set([...Object.keys(segell.manifest), ...Object.keys(actual.manifest)])].sort();
  const canvis = noms.map((f) => [estat(f), f]).filter(([e]) => e);
  let traca = 'sense transacció';
  if (segell.transaction) {
    try {
      const r = JSON.parse(llig(`.agents/seal-transactions/${segell.transaction}.json`));
      traca = `${r.state}, afterSeal ${r.afterSeal === segell.hash ? '=' : '≠'} hash desat`;
    } catch (e) { traca = `il·legible: ${e.message}`; }
  }
  escriu(`\nSegell desat  ${segell.hash} · ${segell.filesCount} fitxers · ${segell.timestamp} · traça ${segell.transaction || '-'} (${traca})`);
  escriu(`Segell actual ${actual.hash} · ${actual.files.length} fitxers${actual.ignorats.length ? ` · fora del hash: ${actual.ignorats.join(', ')}` : ''}`);
  escriu(canvis.length ? canvis.map(([e, f]) => `   ${e} ${f}`).join('\n') : '   cap diferència');
});

/* ── Generador per al Mestre ──────────────────────────────────────────────── */

function textPetorreta({ session, intent, regles, planSha, files }) {
  return `---
type: prompt
status: esborrany
description: Instal·lació amb executor-mutacio de la porta de plantilla viva al hook PreToolUse i al pre-commit.
---
# Instal·lació de la porta de plantilla viva

Reflex-Session: ${session}
Intent-SHA256: ${intent}
Rules-SHA256: ${regles}
Plan-SHA256: ${planSha}

## Context

La decisió 7.3 de l'auditoria 260924_1810 de Fable endolla tooling/gates/porta-plantilla-viva.mjs a tres punts: el hook PreToolUse comú (tooling/gates/hooks-local.mjs), el pre-commit de Husky i un vigilant launchd per a Antigravity. Els dos primers són governança i només entren per este circuit. Els pegats vénen del laboratori 260924_1815_tractor_plantilla_literal, més un pegat perquè el mode --staged jutge els bytes de l'índex. S'han verificat en còpies temporals amb tests/plantilla-viva-installacio.test.mjs: s'apliquen nets, el hook pegat bloqueja un prompt amb el bloc Context mutilat i deixa passar el correcte, i el codi pegat passa l'ESLint del repositori.

## Tasques

${files.map((f) => `- Substituir ${f.path} (SHA-256 previ ${f.before}) pel contingut exacte del pla.`).join('\n')}
- Cap altre fitxer. El vigilant launchd viu fora del repositori i no forma part d'este pla.

## Riscos

- El worktree ha d'estar quiet entre seal i executor: un canvi a git status o als targets caduca el rebut, i un canvi concurrent durant l'escriptura deixa un pending que bloqueja les mutacions fins a reconciliar-lo.
- Els documents de l'Escriptori sense rebut continuen bloquejats per al hook com ja ho estaven, i un commit que els prepare fallarà al pre-commit.

## Criteris d’acceptació

- node tooling/gates/segella.mjs ix verd després de l'executor.
- node --test tests/plantilla-viva-installacio.test.mjs reconeix els pegats com a instal·lats i continua verd.
- node --test tests/hooks-local.test.mjs continua verd.
`;
}

const NOM_PETORRETA = (ara) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${avui(ara)}_${p(ara.getHours())}${p(ara.getMinutes())}_PROMPT_installacio_porta_plantilla_viva_hook_precommit_i_vigilant.md`;
};

test('la Petorreta del generador passa validatePetorreta (format, sense sessió real)', async () => {
  const { validatePetorreta } = await import('../tooling/wiki/reflex_petorreta.mjs');
  const zero = '0'.repeat(64);
  const files = COMPLET.map((o) => ({ path: o.desti, before: zero }));
  const text = textPetorreta({ session: '00000000-0000-4000-8000-000000000000', intent: zero, regles: zero, planSha: zero, files });
  assert.deepEqual(validatePetorreta(NOM_PETORRETA(new Date()), text), []);
});

test('generador del pla d’executor-mutacio (només amb SDP_PLA_SESSIO)', { skip: !process.env.SDP_PLA_SESSIO && 'cal SDP_PLA_SESSIO=<sessionId> de reflex_petorreta.mjs open' }, async () => {
  const session = process.env.SDP_PLA_SESSIO;
  assert.match(session, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  const obert = JSON.parse(llig(`.sdp-reflex/sessions/${session}.json`));
  assert.equal(obert.status, 'open', 'la sessió ha d’estar oberta i encara sense segellar');
  const objectius = process.env.SDP_PLA_INDEX === '0' ? FABLE : COMPLET;
  assert.ok(objectius.every((o) => o.estats.every((e) => e.estat !== 'no s’aplica')), 'hi ha pegats que no s’apliquen nets');
  const files = objectius.filter((o) => o.text !== o.original)
    .map((o) => ({ path: o.desti, before: sha(fs.readFileSync(path.join(REPO, o.desti))), content: o.text }));
  assert.ok(files.length, 'Res a instal·lar: els pegats ja hi són.');
  const fora = files.filter((f) => !obert.scopes.includes(f.path));
  assert.equal(fora.length, 0, `targets fora del scope de la sessió: ${fora.map((f) => f.path).join(', ')}`);

  const plan = { schema: 'sdp.mutation.v1', session, operationId: 'plantilla-viva-installacio', files };
  const planSha = sha(JSON.stringify(plan));
  const eixida = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-pla-plantilla-viva-'));
  const pla = path.join(eixida, 'pla.json');
  fs.writeFileSync(pla, JSON.stringify(plan));
  const nom = NOM_PETORRETA(new Date());
  const petorreta = textPetorreta({ session, intent: obert.intentSha256, regles: obert.rulesDigest, planSha, files });
  const { validatePetorreta } = await import('../tooling/wiki/reflex_petorreta.mjs');
  assert.deepEqual(validatePetorreta(nom, petorreta), []);
  fs.writeFileSync(path.join(eixida, nom), petorreta);
  const manifest = { sources: files.map((f) => ({ path: f.path, reason: 'Target de la instal·lació de la porta de plantilla viva', classification: 'internal', role: 'target' })) };
  fs.writeFileSync(path.join(eixida, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  const boot = obert.bootstrap.path;
  escriu(`\nPla (${files.length} fitxers): ${pla}\nPlan-SHA256: ${planSha}\n`);
  escriu(`cp "${path.join(eixida, nom)}" "${path.join(eixida, 'manifest.json')}" "${path.join(REPO, boot)}/"`);
  escriu(`node tooling/wiki/reflex_petorreta.mjs seal --session=${session} --nonce=NONCE_DE_OPEN --petorreta=${boot}/${nom} --manifest=${boot}/manifest.json`);
  escriu(`node tooling/gates/executor-mutacio.mjs "${pla}" .sdp-reflex/sessions/${session}.json`);
});
