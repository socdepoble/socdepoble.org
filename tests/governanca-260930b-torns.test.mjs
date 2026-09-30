/** Corredor del paquet de governança 260930b · torns retirats i frontmatter de governança (llesca L7, torn torn_2c40cd77).
 *
 *  Prova, abans que el Mestre l'aplique amb l'executor, la part B del paquet del
 *  laboratori `02_investigacio_ia/260930_0400_governanca_claude/nous/`:
 *    · turns.mjs amb l'estat terminal `retired` i la CLI retira_torns.mjs;
 *    · despertar.mjs, que ara tanca l'ON_ESTIC amb `## Vincles`;
 *    · les normes de .agents/rules (type norma, status canonic, Vincles);
 *    · frontmatter-abast.json, amb 001 NEXUS com a immutable;
 *    · mapa-consola.mjs, amb `git --no-optional-locks status`.
 *  Els mòduls nous importen `../lib/arrel.mjs` i els seus germans: es proven dins
 *  d'una còpia de `tooling/` a os.tmpdir() amb els fitxers nous superposats, on les
 *  rutes relatives de les proves apunten a la còpia i mai al repositori. Res
 *  s'escriu fora d'os.tmpdir(). Quan l'executor ja ha deixat la transacció del
 *  paquet, quan cada fitxer real ja és idèntic al de nous/ o si el laboratori
 *  s'arxiva, les proves fan skip.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0400_governanca_claude');
const HI_HA_LAB = fs.existsSync(path.join(LAB, 'prepara-pla.mjs'));
const pla = HI_HA_LAB ? await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href) : null;

/** Fitxers d'esta llesca: ruta real → ruta dins de nous/ (les normes porten `.md.txt` al laboratori). */
const FITXERS = new Map([
  ['tooling/documental/turns.mjs', 'tooling/documental/turns.mjs'],
  ['tooling/gates/retira_torns.mjs', 'tooling/gates/retira_torns.mjs'],
  ['tests/turns-retirats.test.mjs', 'tests/turns-retirats.test.mjs'],
  ['tooling/brain/despertar.mjs', 'tooling/brain/despertar.mjs'],
  ['tooling/brain/mapa-consola.mjs', 'tooling/brain/mapa-consola.mjs'],
  ['.agents/rules/firebase_hosting.md', '.agents/rules/firebase_hosting.md.txt'],
  ['.agents/rules/supabase_grants.md', '.agents/rules/supabase_grants.md.txt'],
  ['tooling/wiki/frontmatter-abast.json', 'tooling/wiki/frontmatter-abast.json']
]);
const llig = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const nou = (rel) => fs.readFileSync(path.join(LAB, 'nous', FITXERS.get(rel)), 'utf8');
const aplicat = (rel) => fs.existsSync(path.join(REPO, rel)) && fs.existsSync(path.join(LAB, 'nous', FITXERS.get(rel))) && llig(rel) === nou(rel);
const APLICAT = HI_HA_LAB && [...FITXERS.keys()].every(aplicat);
/** La transacció que deixa l'executor: després, els fitxers reals poden evolucionar i el corredor no ha de fer-se roig per això. */
const TRANSACCIO = HI_HA_LAB ? pla.transaccio(REPO) : null;

function salta(t) {
  if (!HI_HA_LAB) { t.skip('laboratori 260930_0400_governanca_claude absent (arxivat)'); return true; }
  if (TRANSACCIO) { t.skip(`paquet 260930b aplicat per l'executor (transacció ${TRANSACCIO.id}): les proves reals el cobrixen; arxiveu el laboratori`); return true; }
  if (APLICAT) { t.skip('paquet 260930b ja aplicat al disc: les proves reals el cobrixen; arxiveu el laboratori'); return true; }
  return false;
}

/** Text sense l'espai final de cada línia: l'eina d'escriptura de Claude no el conserva (vegeu LLEGIU_PRIMER §6). */
const senseEspaiFinal = (text) => text.split('\n').map((l) => l.trimEnd()).join('\n');

/**
 * Línies noves de `nou` respecte de `vell`: cada línia de `vell` (fora de les
 * `substituides`) ha d'aparéixer a `nou` en el mateix ordre, llevat de l'espai
 * final. Una còpia sencera escrita a mà no pot perdre ni capgirar res de
 * l'original sense que caiga ací.
 */
function afegides(vell, nou, substituides = []) {
  const b = nou.split('\n').map((l) => l.trimEnd());
  let j = 0;
  const marcades = new Set();
  for (const cru of vell.split('\n')) {
    if (substituides.includes(cru)) continue;
    const linia = cru.trimEnd();
    while (j < b.length && b[j] !== linia) j++;
    assert.ok(j < b.length, `línia original perduda o fora d'ordre: ${JSON.stringify(linia)}`);
    marcades.add(j++);
  }
  return b.filter((_, i) => !marcades.has(i));
}

/* ── Còpies ───────────────────────────────────────────────────────────────── */

test('cada fitxer de la llesca té la base preparada o ja és al disc', (t) => {
  if (salta(t)) return;
  const estat = pla.estat(REPO).filter((f) => FITXERS.has(f.ruta));
  assert.deepEqual(estat.map((f) => f.ruta).sort(), [...FITXERS.keys()].sort());
  for (const f of estat) {
    assert.equal(f.nou, FITXERS.get(f.ruta), `${f.ruta}: la ruta real ix de ${f.nou}`);
    assert.notEqual(f.estat, 'deriva', `${f.ruta}: ${f.motiu}`);
  }
});

test('turns.mjs conserva cada línia de l’original llevat de la lectura d’estats, i només hi afig retired', (t) => {
  if (salta(t)) return;
  const ruta = 'tooling/documental/turns.mjs';
  if (aplicat(ruta)) return;
  const vell = llig(ruta);
  const substituides = vell.split('\n').filter((l) => /\['opened', 'context_loaded', 'planned', 'verified', 'closed'\]\.includes|turn\.state !== 'closed' && \(!Number\.isFinite/.test(l));
  assert.equal(substituides.length, 2, 'les dues línies de readTurn que canvien');
  const noves = afegides(vell, nou(ruta), substituides).join('\n');
  assert.match(noves, /export const OPEN_STATES = Object\.freeze\(\['opened', 'context_loaded', 'planned', 'verified'\]\)/);
  assert.match(noves, /if \(turn\.state === 'retired' && !closed\) throw new Error\('Torn retirat'\)/);
  assert.match(noves, /export function retireExpiredTurn\(root, id, \{ note, now = Date\.now\(\) \} = \{\}\)/);
  assert.doesNotMatch(noves, /\bverification\s*=/, 'retirar no escriu cap verificació');
  assert.doesNotMatch(noves, /\b(?:receipts|plan|initial)\s*=/, 'ni toca rebuts, pla o inventari');
});

test('despertar.mjs i mapa-consola.mjs conserven l’original i només afigen el que diu el paquet', (t) => {
  if (salta(t)) return;
  if (!aplicat('tooling/brain/despertar.mjs')) {
    const noves = afegides(llig('tooling/brain/despertar.mjs'), nou('tooling/brain/despertar.mjs'));
    assert.deepEqual(noves.filter((l) => !/^ \* /.test(l)), ['', '## Vincles', '', '- [[00_index]]'], 'a banda del comentari, només la secció Vincles');
  }
  if (!aplicat('tooling/brain/mapa-consola.mjs')) {
    const vell = llig('tooling/brain/mapa-consola.mjs');
    const status = "  const estat = git(arrel, ['status', '--porcelain']);";
    assert.equal(vell.split('\n').filter((l) => l === status).length, 1);
    const noves = afegides(vell, nou('tooling/brain/mapa-consola.mjs'), [status]);
    assert.deepEqual(noves.filter((l) => !/^\s*\/\//.test(l)), ["  const estat = git(arrel, ['--no-optional-locks', 'status', '--porcelain']);"]);
  }
});

test('normes de .agents/rules i abast de frontmatter: exactament el canvi de la correcció', (t) => {
  if (salta(t)) return;
  for (const ruta of ['.agents/rules/firebase_hosting.md', '.agents/rules/supabase_grants.md']) {
    if (aplicat(ruta)) continue;
    const vell = llig(ruta);
    assert.equal(vell.split('\n')[1], 'type: rule', ruta);
    const esperat = `${vell.replace('---\ntype: rule\n', '---\ntype: norma\nstatus: canonic\n')}\n## Vincles\n\n- [[00_index]]\n`;
    assert.equal(senseEspaiFinal(nou(ruta)), senseEspaiFinal(esperat), ruta);
  }
  const ruta = 'tooling/wiki/frontmatter-abast.json';
  if (!aplicat(ruta)) {
    const vell = JSON.parse(llig(ruta));
    const abast = JSON.parse(nou(ruta));
    assert.deepEqual({ ...abast, immutables: [] }, { ...vell, immutables: [] }, 'només canvia immutables');
    assert.deepEqual(abast.immutables, ['_wiki_de_poble/04_escriptori/02_investigacio_ia/001 NEXUS/**']);
  }
});

test('les còpies de codi són sintàcticament vàlides, conserven l’API i passen l’ESLint', async (t) => {
  if (salta(t)) return;
  const exportats = (text) => [...text.matchAll(/^export (?:async )?(?:const|let|function|class) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  const missatges = async (text, rel) => (await eslint.lintText(text, { filePath: path.join(REPO, rel) }))[0].messages
    .map((m) => `${rel}:${m.line} ${m.severity === 2 ? 'error' : 'avís'} ${m.ruleId} ${m.message}`);
  for (const ruta of [...FITXERS.keys()].filter((r) => r.endsWith('.mjs'))) {
    const r = spawnSync(process.execPath, ['--check', path.join(LAB, 'nous', FITXERS.get(ruta))], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${ruta}: ${r.stderr}`);
    const existia = fs.existsSync(path.join(REPO, ruta));
    if (existia && ruta.startsWith('tooling/')) {
      assert.deepEqual(exportats(llig(ruta)).filter((n) => !exportats(nou(ruta)).includes(n)), [], `${ruta}: exportacions perdudes`);
    }
    const ara = await missatges(nou(ruta), ruta);
    const abans = existia ? await missatges(llig(ruta), ruta) : [];
    assert.deepEqual(ara.filter((m) => / error /.test(m)), [], ara.join('\n'));
    assert.ok(ara.length <= abans.length, `avisos nous:\n${ara.join('\n')}`);
  }
});

/* ── En una còpia de tooling/ ─────────────────────────────────────────────── */

/** Guardes existents que importen turns.mjs, despertar.mjs o mapa-consola.mjs. */
const GUARDES = ['tests/documental.test.mjs', 'tests/document-create-race.test.mjs', 'tests/document-command-policy.test.mjs', 'tests/sistema_nervios.test.mjs', 'tests/mapa-consola.test.mjs'];

/**
 * Còpia de `tooling/` a os.tmpdir() amb el que les proves lligen des de l'arrel i
 * els fitxers de la llesca superposats (`nous: false` deixa el codi d'ara). `src`
 * i `node_modules` hi són per enllaç: la closca del Mapa importa el compilador pur.
 */
function arbre(t, { nous = true } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-260930b-torns-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store)$/.test(src);
  for (const d of ['tooling', 'tests/helpers']) fs.cpSync(path.join(REPO, d), path.join(dir, d), { recursive: true, filter: fora });
  const router = JSON.parse(llig('.agents/protocolledge.json'));
  // Les fonts d'arrencada (SOURCES de context-local.mjs) les copien les fixtures de document-create-race i hooks-local.
  for (const f of ['.agents/protocolledge.json', '.agents/hooks.json', '.agents/BOOTSTRAP.md', '.claude/settings.json', '.codex/hooks.json',
    'AGENTS.md', '_wiki_de_poble/01_ser/02_genotip.md', '_wiki_de_poble/00_index.md', ...router.rutes.map((r) => r.plantilla), ...GUARDES]) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), path.join(dir, f));
  }
  fs.copyFileSync(path.join(LAB, 'nous/tests/turns-retirats.test.mjs'), path.join(dir, 'tests/turns-retirats.test.mjs'));
  if (nous) {
    for (const [ruta, font] of FITXERS) {
      fs.mkdirSync(path.dirname(path.join(dir, ruta)), { recursive: true });
      fs.copyFileSync(path.join(LAB, 'nous', font), path.join(dir, ruta));
    }
  }
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  fs.symlinkSync(path.join(REPO, 'src'), path.join(dir, 'src'), 'dir');
  fs.writeFileSync(path.join(dir, '.agents/AGENTS.md'), '# BIOS de la còpia de proves\n');
  return dir;
}

function nodeTest(dir, fitxers) {
  const env = { ...process.env };
  delete env.SDP_ARREL;
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...fitxers], { cwd: dir, env, encoding: 'utf8', timeout: 300000, maxBuffer: 64 * 1024 * 1024 });
}

test('en una còpia de tooling/ amb el paquet passen turns-retirats i les guardes de torns, despertar i closca', (t) => {
  if (salta(t)) return;
  const dir = arbre(t);
  assert.match(fs.readFileSync(path.join(dir, 'tooling/documental/turns.mjs'), 'utf8'), /export function retireExpiredTurn/);
  const r = nodeTest(dir, ['tests/turns-retirats.test.mjs', ...GUARDES]);
  const informe = `${r.stdout.slice(-6000)}\n${r.stderr.slice(-2000)}`;
  assert.equal(r.status, 0, informe);
  assert.match(r.stdout, /ℹ fail 0/);
  const passades = Number(/ℹ pass (\d+)/.exec(r.stdout)?.[1] ?? 0);
  t.diagnostic(`${passades} proves passades a la còpia de tooling/`);
  assert.ok(passades >= 40, `només ${passades} proves passades:\n${informe}`);
});

/**
 * Una bateria que no cau quan el codi torna enrere no protegix res. Cada mutant
 * desfà una peça del remei i turns-retirats l'ha de posar roja per una asserció
 * (hi ha d'haver proves verdes: el mòdul carrega), no per sintaxi.
 */
test('turns-retirats mossega: cada peça del remei que es desfà la posa roja', (t) => {
  if (salta(t)) return;
  const dir = arbre(t);
  const mutants = {
    'retirat llegible sense {closed:true}': ['tooling/documental/turns.mjs', "if (turn.state === 'retired' && !closed) throw new Error('Torn retirat');", ''],
    'retirat també caduca': ['tooling/documental/turns.mjs', 'if (OPEN_STATES.includes(turn.state) && (', "if (turn.state !== 'closed' && ("],
    'retira un torn viu': ['tooling/documental/turns.mjs', "if (Number.isFinite(expiry) && expiry > now) throw new Error('Torn viu: només es retira un torn caducat');", ''],
    'retira sense nota': ['tooling/documental/turns.mjs', "if (typeof note !== 'string' || !note.trim()) throw", 'if (false) throw'],
    'retira un tancat': ['tooling/documental/turns.mjs', "if (turn.state === 'closed') throw new Error('Torn ja tancat');", ''],
    '--sec escriu': ['tooling/gates/retira_torns.mjs', 'if (!o.escriu) {', 'if (false) {'],
    'la CLI toca els vius': ['tooling/gates/retira_torns.mjs', 'if (Number.isFinite(expira) && expira > now) continue;', '']
  };
  for (const [nom, [ruta, vell, nouText]] of Object.entries(mutants)) {
    const desti = path.join(dir, ruta);
    const original = fs.readFileSync(desti, 'utf8');
    assert.equal(original.split(vell).length, 2, `el mutant «${nom}» no troba el seu ancoratge`);
    fs.writeFileSync(desti, original.replace(vell, () => nouText));
    const r = nodeTest(dir, ['tests/turns-retirats.test.mjs']);
    fs.writeFileSync(desti, original);
    assert.notEqual(r.status, 0, `el mutant «${nom}» sobreviu a turns-retirats`);
    assert.match(r.stdout, /✔/, `el mutant «${nom}» no ha carregat:\n${r.stdout.slice(-2000)}`);
  }
});

test('despertar nou: l’ON_ESTIC és el d’abans més `## Vincles`, i el seu frontmatter és vàlid', async (t) => {
  if (salta(t)) return;
  const genera = (dir) => {
    fs.writeFileSync(path.join(dir, '.agents/ESTAT.md'), '# ESTAT\n\n## ESTAT_ACTUAL · 260930_0400 · prova\n\n- relleu de prova\n');
    const r = spawnSync(process.execPath, [path.join(dir, 'tooling/brain/despertar.mjs')], { cwd: dir, encoding: 'utf8', timeout: 20000 });
    assert.equal(r.status, 0, r.stderr);
    return fs.readFileSync(path.join(dir, '.agents/ON_ESTIC.md'), 'utf8').replace(/\*\*GENERAT:\*\* \S+/, '**GENERAT:** X');
  };
  const vell = genera(arbre(t, { nous: false }));
  const text = genera(arbre(t));
  assert.equal(text, `${vell}\n## Vincles\n\n- [[00_index]]\n`, 'Llei del Píxel del punter: la resta, idèntica');
  assert.equal(text.match(/^## Vincles$/gm).length, 1);
  const { parseDocument, validateSchema } = await import('../tooling/documental/core.mjs');
  const { data } = parseDocument(text);
  assert.deepEqual(validateSchema(data, JSON.parse(llig('tooling/wiki/schema.json'))), []);
  assert.ok(fs.existsSync(path.join(REPO, '_wiki_de_poble/00_index.md')), '[[00_index]] resol a la Wiki');
});

test('porta Frontmatter: amb el paquet, normes, ON_ESTIC i 001 NEXUS ixen del deute; amb el codi d’ara, no', (t) => {
  if (salta(t)) return;
  const fixture = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-260930b-fm-')));
  t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
  const posa = (rel, text) => { fs.mkdirSync(path.dirname(path.join(fixture, rel)), { recursive: true }); fs.writeFileSync(path.join(fixture, rel), text); };
  const NEXUS = '_wiki_de_poble/04_escriptori/02_investigacio_ia/001 NEXUS/skills/capturar-idea/SKILL.md';
  const ON_ESTIC = '.agents/ON_ESTIC.md';
  const NORMES = ['.agents/rules/firebase_hosting.md', '.agents/rules/supabase_grants.md'];
  posa('.agents/AGENTS.md', '# Marcador\n');
  posa('tooling/wiki/schema.json', llig('tooling/wiki/schema.json'));
  posa('_wiki_de_poble/00_index.md', '---\ntype: index\nstatus: canonic\ndescription: Índex arrel de la fixture\n---\n# Índex\n');
  posa(NEXUS, '---\nname: capturar-idea\nvisibilidad: ejemplo\n---\n# Capturar idea\n');
  // L'ON_ESTIC tal com el deixaria despertar nou, amb el mateix text que ha jutjat la prova anterior.
  const onEstic = (ambVincles) => `---\ntype: document\nstatus: generat\ndescription: Punter d'arrencada de sessió generat per despertar.mjs\n---\n# ON_ESTIC.md (Punter de Sessió)\n\n## 3. Què has de fer ara?\n\n1. Espera les ordres del Mestre.\n${ambVincles ? '\n## Vincles\n\n- [[00_index]]\n' : ''}`;
  const tractor = () => {
    const r = spawnSync(process.execPath, [path.join(REPO, 'tooling/wiki/tractor-frontmatter.mjs'), `--arrel=${fixture}`, '--json'], { cwd: fixture, encoding: 'utf8', timeout: 60000 });
    assert.ok([0, 1].includes(r.status), r.stderr);
    const fallades = JSON.parse(r.stdout).fallades;
    return (rel) => Object.entries(fallades).filter(([, items]) => items.some((i) => i.n === rel)).map(([llei]) => llei);
  };

  posa('tooling/wiki/frontmatter-abast.json', llig('tooling/wiki/frontmatter-abast.json'));
  for (const n of NORMES) posa(n, llig(n));
  posa(ON_ESTIC, onEstic(false));
  const ara = tractor();
  assert.ok(ara(NEXUS).length > 0, '001 NEXUS hauria de ser deute amb l’abast d’ara');
  for (const n of NORMES) assert.ok(ara(n).includes('F3'), `${n}: type «rule» hauria de ser F3 ara`);
  assert.ok(ara(ON_ESTIC).includes('F9'), 'l’ON_ESTIC sense Vincles és F9 ara');

  posa('tooling/wiki/frontmatter-abast.json', nou('tooling/wiki/frontmatter-abast.json'));
  for (const n of NORMES) posa(n, nou(n));
  posa(ON_ESTIC, onEstic(true));
  const despres = tractor();
  for (const rel of [NEXUS, ON_ESTIC, ...NORMES]) assert.deepEqual(despres(rel), [], `${rel} continua amb deute`);
});

test('la closca del Mapa llig git sense reescriure .git/index; un git status normal sí que el reescriu', async (t) => {
  if (salta(t)) return;
  const dir = arbre(t);
  const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-260930b-git-')));
  const casa = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-260930b-casa-')));
  t.after(() => { fs.rmSync(repo, { recursive: true, force: true }); fs.rmSync(casa, { recursive: true, force: true }); });
  const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' });
  git('init', '-q');
  fs.writeFileSync(path.join(repo, 'a.txt'), 'a\n');
  git('add', 'a.txt');
  git('-c', 'user.name=Prova', '-c', 'user.email=prova@example.invalid', 'commit', '-qm', 'fixture');
  const index = path.join(repo, '.git/index');
  const empremta = () => createHash('sha256').update(fs.readFileSync(index)).digest('hex');
  // La informació de stat de l'índex queda vella: un status amb locks opcionals la refresca i reescriu l'índex.
  const envelleix = () => { const vell = new Date(Date.now() - 3600000); fs.utimesSync(path.join(repo, 'a.txt'), vell, vell); };

  envelleix();
  const abans = empremta();
  const { recullFonts } = await import(pathToFileURL(path.join(dir, 'tooling/brain/mapa-consola.mjs')).href);
  const fonts = recullFonts(repo, { home: casa, plataforma: 'linux' });
  assert.equal(fonts.tall.arbre_net, true, 'el tall es continua llegint');
  assert.equal(empremta(), abans, 'la closca de només lectura no reescriu .git/index');

  git('status', '--porcelain');
  if (empremta() === abans) return t.skip('este git no refresca l’índex en un status: la prova no pot discriminar');
  envelleix();
  const abans2 = empremta();
  recullFonts(repo, { home: casa, plataforma: 'linux' });
  assert.equal(empremta(), abans2);
});
