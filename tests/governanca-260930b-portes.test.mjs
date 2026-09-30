/** Corredor del paquet de governança 260930b · portes i hooks (llesca L7, torn torn_2c40cd77).
 *
 *  El paquet viu a `02_investigacio_ia/260930_0400_governanca_claude/nous/` i
 *  l'aplicarà l'executor amb una lease del Mestre. Ací es prova abans, sense
 *  escriure res al repositori:
 *    (a) cada fitxer de la llesca té la base que es va preparar, o ja és al disc;
 *    (b) hooks-local només perd la línia morta; les còpies són sintàcticament
 *        vàlides, conserven l'API i passen l'ESLint del repositori;
 *    (c) el hook i la porta nous importen `../lib/arrel.mjs` i les portes germanes
 *        i no es poden carregar des del laboratori: es construïx a os.tmpdir() una
 *        còpia de `tooling/` amb els fitxers nous superposats, s'hi posen les
 *        proves que entren amb el codi i les guardes que els importen, i
 *        s'executen allí (les rutes relatives de les proves apunten a la còpia);
 *    (d) la bateria nova mossega: contra el codi d'ara, les proves noves fallen;
 *    (e) el generador del pla (prepara-pla.mjs) fa un pla que l'executor accepta
 *        i una Petorreta que el seal accepta, i no escriu res.
 *  Quan l'executor ja ha deixat la transacció del paquet, quan el paquet ja és al
 *  disc o si el laboratori s'arxiva, les proves fan skip: aplicat el paquet, els
 *  fitxers reals poden evolucionar i açò no ha de posar-se roig.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LAB = path.join(REPO, '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0400_governanca_claude');
const HI_HA_LAB = fs.existsSync(path.join(LAB, 'prepara-pla.mjs'));
const pla = HI_HA_LAB ? await import(pathToFileURL(path.join(LAB, 'prepara-pla.mjs')).href) : null;

/** Fitxers d'esta llesca: ruta real → ruta dins de nous/. */
const FITXERS = [
  'tooling/gates/antigravity-hook.mjs',
  'tooling/gates/porta-olivera.mjs',
  'tooling/gates/hooks-local.mjs',
  'tests/antigravity-hook.test.mjs',
  'tests/porta-olivera-v3.test.mjs'
];
const llig = (rel) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const nou = (rel) => fs.readFileSync(path.join(LAB, 'nous', rel), 'utf8');
const aplicat = (rel) => fs.existsSync(path.join(REPO, rel)) && fs.existsSync(path.join(LAB, 'nous', rel)) && llig(rel) === nou(rel);
const APLICAT = HI_HA_LAB && FITXERS.every(aplicat);
const TOT_APLICAT = HI_HA_LAB && pla.fitxersNous().every((f) => fs.existsSync(path.join(REPO, f.ruta)) && llig(f.ruta) === nou(f.nou));
/** La transacció que deixa l'executor: després, els fitxers reals poden evolucionar i el corredor no ha de fer-se roig per això. */
const TRANSACCIO = HI_HA_LAB ? pla.transaccio(REPO) : null;

function salta(t, { tot = false } = {}) {
  if (!HI_HA_LAB) { t.skip('laboratori 260930_0400_governanca_claude absent (arxivat)'); return true; }
  if (TRANSACCIO) { t.skip(`paquet 260930b aplicat per l'executor (transacció ${TRANSACCIO.id}): les proves reals el cobrixen; arxiveu el laboratori`); return true; }
  if (tot ? TOT_APLICAT : APLICAT) { t.skip('paquet 260930b ja aplicat al disc: les proves reals el cobrixen; arxiveu el laboratori'); return true; }
  return false;
}

const exportats = (text) => [...text.matchAll(/^export (?:async )?(?:const|let|function|class) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);

/* ── (a) i (b) Còpies ─────────────────────────────────────────────────────── */

test('cada fitxer de la llesca té la base preparada o ja és al disc', (t) => {
  if (salta(t)) return;
  const estat = pla.estat(REPO).filter((f) => FITXERS.includes(f.ruta));
  assert.deepEqual(estat.map((f) => f.ruta).sort(), [...FITXERS].sort());
  for (const f of estat) assert.notEqual(f.estat, 'deriva', `${f.ruta}: ${f.motiu}`);
});

test('hooks-local només perd la línia morta de Bash (tooling-portes-12)', (t) => {
  if (salta(t)) return;
  const ruta = 'tooling/gates/hooks-local.mjs';
  if (aplicat(ruta)) return;
  const MORTA = "    if (name === 'Bash') errors.push(...olivera(payload, root).errors);";
  const real = llig(ruta);
  assert.equal(real.split('\n').filter((l) => l === MORTA).length, 1, 'la línia morta és al disc una sola vegada');
  assert.equal(nou(ruta), real.split('\n').filter((l) => l !== MORTA).join('\n'), 'cap altre canvi');
  // Morta de veres: abans d'arribar-hi, qualsevol eina que no escriu (Bash inclòs) ja ha llançat.
  assert.match(real, /if \(!\['apply_patch', 'Write', 'Edit', [^\]]+\]\.includes\(name\)\) throw new Error\('Eina opaca/);
});

test('les còpies noves són sintàcticament vàlides i conserven tota l’API exportada', (t) => {
  if (salta(t)) return;
  for (const ruta of FITXERS) {
    const r = spawnSync(process.execPath, ['--check', path.join(LAB, 'nous', ruta)], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${ruta}: ${r.stderr}`);
    if (!ruta.startsWith('tooling/')) continue;
    const falten = exportats(llig(ruta)).filter((n) => !exportats(nou(ruta)).includes(n));
    assert.deepEqual(falten, [], `${ruta}: exportacions perdudes`);
  }
  assert.ok(exportats(nou('tooling/gates/antigravity-hook.mjs')).includes('LECTURES'));
  for (const n of ['ancoraPlana', 'forasters', 'absencies']) assert.ok(exportats(nou('tooling/gates/porta-olivera.mjs')).includes(n), n);
});

test('el codi que entra passa l’ESLint del repositori, sense més avisos que el que substituïx', async (t) => {
  if (salta(t)) return;
  const { ESLint } = await import('eslint');
  const eslint = new ESLint({ cwd: REPO });
  const missatges = async (text, rel) => (await eslint.lintText(text, { filePath: path.join(REPO, rel) }))[0].messages
    .map((m) => `${rel}:${m.line} ${m.severity === 2 ? 'error' : 'avís'} ${m.ruleId} ${m.message}`);
  for (const ruta of FITXERS) {
    const ara = await missatges(nou(ruta), ruta);
    const abans = fs.existsSync(path.join(REPO, ruta)) ? await missatges(llig(ruta), ruta) : [];
    assert.deepEqual(ara.filter((m) => / error /.test(m)), [], ara.join('\n'));
    assert.ok(ara.length <= abans.length, `avisos nous:\n${ara.join('\n')}`);
  }
  // El generador i els dos corredors, nets del tot: no substituïxen res.
  for (const rel of [path.relative(REPO, path.join(LAB, 'prepara-pla.mjs')), 'tests/governanca-260930b-portes.test.mjs', 'tests/governanca-260930b-torns.test.mjs']) {
    assert.deepEqual(await missatges(llig(rel), rel), [], rel);
  }
});

/* ── (c) i (d) En una còpia de tooling/ ───────────────────────────────────── */

/** Guardes existents que importen el hook, la porta o hooks-local. porta-olivera-v2 no: prova el laboratori 260924, no la porta. */
const GUARDES = ['tests/sistema_nervios.test.mjs', 'tests/tractor-fortification.test.mjs', 'tests/hooks-local.test.mjs'];
const NOVES = ['tests/antigravity-hook.test.mjs', 'tests/porta-olivera-v3.test.mjs'];

/**
 * Còpia de `tooling/` a os.tmpdir() amb el que les proves lligen des de l'arrel.
 * Amb `nous`, els fitxers de la llesca se superposen; sense, és el codi d'ara amb
 * les proves noves (per a vore-les en roig). És un repositori git perquè els hooks
 * de Codex es localitzen amb `git rev-parse --show-toplevel`.
 */
function arbre(t, { nous = true } = {}) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-260930b-portes-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const fora = (src) => !/[\\/](?:node_modules|\.DS_Store)$/.test(src);
  for (const d of ['tooling', 'scripts/immunitari', 'tests/helpers']) fs.cpSync(path.join(REPO, d), path.join(dir, d), { recursive: true, filter: fora });
  const router = JSON.parse(llig('.agents/protocolledge.json'));
  for (const f of ['.agents/protocolledge.json', '.agents/hooks.json', '.agents/BOOTSTRAP.md', '.claude/settings.json', '.codex/hooks.json',
    'AGENTS.md', '_wiki_de_poble/01_ser/02_genotip.md', '_wiki_de_poble/00_index.md', ...router.rutes.map((r) => r.plantilla), ...GUARDES]) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    fs.copyFileSync(path.join(REPO, f), path.join(dir, f));
  }
  for (const ruta of NOVES) fs.copyFileSync(path.join(LAB, 'nous', ruta), path.join(dir, ruta));
  if (nous) for (const ruta of FITXERS) fs.copyFileSync(path.join(LAB, 'nous', ruta), path.join(dir, ruta));
  fs.symlinkSync(path.join(REPO, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  // Marcador propi: els mòduls que resolen l'arrel en carregar-se ho fan dins de la còpia.
  fs.writeFileSync(path.join(dir, '.agents/AGENTS.md'), '# BIOS de la còpia de proves\n');
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
}

function nodeTest(dir, fitxers) {
  const env = { ...process.env };
  delete env.SDP_ARREL;
  delete env.CLAUDE_PROJECT_DIR;
  // Sense açò, el `node --test` fill parlaria el protocol intern del pare i no l'informe.
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...fitxers], { cwd: dir, env, encoding: 'utf8', timeout: 300000, maxBuffer: 64 * 1024 * 1024 });
}

test('en una còpia de tooling/ amb el paquet passen les proves noves i les guardes que el importen', (t) => {
  if (salta(t)) return;
  const dir = arbre(t);
  assert.match(fs.readFileSync(path.join(dir, 'tooling/gates/antigravity-hook.mjs'), 'utf8'), /export const LECTURES/);
  const r = nodeTest(dir, [...NOVES, ...GUARDES]);
  const informe = `${r.stdout.slice(-6000)}\n${r.stderr.slice(-2000)}`;
  assert.equal(r.status, 0, informe);
  assert.match(r.stdout, /ℹ fail 0/);
  assert.match(r.stdout, /ℹ skipped 0/, 'cap prova s’ha saltat a la còpia');
  assert.match(r.stdout, /✔ la secció 0 de la plantilla viva prompt_local\.md/);
  const passades = Number(/ℹ pass (\d+)/.exec(r.stdout)?.[1] ?? 0);
  t.diagnostic(`${passades} proves passades a la còpia de tooling/`);
  assert.ok(passades >= 70, `només ${passades} proves passades:\n${informe}`);
});

/** Proves noves que el codi d'ara no pot passar: cada una fixa una troballa de 260930b. */
const HAN_DE_CAURE = [
  'run_command del payload documentat (npm test) → ask sense objecció i sense carregar portes',
  'lectures conegudes → allow; qualsevol altra eina que no escriu → ask',
  'prompt que passa les dues portes → ask sense errors: allow només és per a lectures',
  'fora del repositori, subcarpetes i documents no vigilats → ask, i res no es reconstruïx',
  'zona humana i peces del mateix hook → ask, amb qualsevol caixa',
  'un .md nou al primer nivell amb una categoria fora del catàleg → ask sense reconstruir; un existent o l’índex, no',
  'un camí de l’Escriptori amb una caixa no canònica → ask: les portes no el reconeixerien',
  'trasllat, còpia o esborrat per shell que toca l’Escriptori → ask amb la via canònica',
  'la resta de shell → ask sense objecció, mai allow',
  'redirecció de shell a un document del primer nivell → ask, també amb >| i amb una altra caixa',
  'zona humana per shell → ask, amb qualsevol caixa i també pel directori de treball',
  'peces del hook per shell → ask, amb qualsevol caixa',
  'procés: interruptor d’apagada → ask, mai allow; no comprova res i deixa una traça «apagat»',
  'procés: eixida JSON per stdout i una línia de traça per invocació, amb l’ordre de shell',
  'procés: un .md nou amb una categoria fora del catàleg real → ask',
  'procés: PreInvocation injecta amb la taula bruta, calla amb la neta i avisa si l’Escriptori no hi és',
  '«Activitat en curs» es reconeix sense distingir caixa, a nivell 2 o 3 i amb un prefix no alfabètic',
  'sense carpeta o sense índex, la taula no és vàlida i l’informe ix amb 1 sense cap ✅',
  'executada des d’un directori que no és l’arrel, sense SDP_ARREL, la porta no diu «net»',
  'un fitxer solt fora de la forma aammdd_hhmm_categoria_titol.md fa caure la taula amb un error propi',
  'una àncora amb camí no ancora cap document de la taula ni és fantasma',
  'una àncora amb fragment, amb àlies o amb extensió ancora el document i no és fantasma',
  '--arxiva --nom --sec no mou res; sense --sec mou el document d’avui i en reapunta l’àncora a l’arxiu',
  '--arxiva reapunta cada àncora plana del document, en qualsevol posició, i conserva la resta de la línia',
  'si el trasllat es trenca a mitges, els ja moguts queden reapuntats i l’error diu quins són',
  'l’API que importen hooks-local i les proves antigues es conserva, i s’hi afig la de 260930b',
  // Revisió adversarial de la correcció (observacions 1, 2, 5 i 8).
  'si el reapuntat de l’índex també falla, l’error del lot mana, ho diu i porta els moguts',
  'dins de «## Vincles» només se’n va l’àncora moguda, i la línia quan no li’n queda cap altra',
  'un document existent escrit amb una altra caixa del nom es jutja com el document real',
  'la traça emmascara els secrets en línia d’una ordre',
  'procés: la traça no desa els secrets en línia de l’ordre'
];
/** I les que ja passaven: la bateria carrega amb el codi d'ara i no cau per sintaxi. */
const HAN_DE_PASSAR = [
  'prompt escrit al primer nivell amb errors → deny, i el motiu porta cada error i la via de sortida',
  'procés: un prompt escrit de memòria al primer nivell → deny amb la Plantilla viva',
  'la Safata d’Entrada amb elements embruta la taula, amb qualsevol caixa de nom',
  '--nom rebutja subcarpetes, noms absents i categories no transitòries sense moure res'
];

test('la bateria nova mossega: contra el codi d’ara, cada prova nova de 260930b cau i les antigues passen', (t) => {
  if (salta(t)) return;
  const dir = arbre(t, { nous: false });
  const r = nodeTest(dir, NOVES);
  assert.notEqual(r.status, 0, 'la bateria nova passa amb el codi vell: no protegix res');
  const caigudes = new Set([...r.stdout.matchAll(/^\s*✖ (.+?) \(\d+(?:\.\d+)?m?s\)$/gm)].map((m) => m[1]));
  const passades = new Set([...r.stdout.matchAll(/^\s*✔ (.+?) \(\d+(?:\.\d+)?m?s\)$/gm)].map((m) => m[1]));
  for (const titol of HAN_DE_CAURE) assert.ok(caigudes.has(titol), `no cau amb el codi d'ara: ${titol}`);
  for (const titol of HAN_DE_PASSAR) assert.ok(passades.has(titol), `hauria de passar també amb el codi d'ara: ${titol}\n${r.stdout.slice(-3000)}`);
});

/* ── (e) Generador del pla ────────────────────────────────────────────────── */

test('prepara-pla: el pla del paquet sencer l’accepta validatePlan de l’executor, amb les rutes reals i scopes existents', async (t) => {
  if (salta(t, { tot: true })) return;
  const { plan, scopes, targets } = await pla.preparaPla(REPO);
  assert.equal(plan.schema, 'sdp.mutation.v1');
  assert.equal(plan.session, pla.SESSIO_ZERO);
  assert.ok(plan.operationId.startsWith(pla.OPERACIO), 'el marcador que després fa saltar els corredors');
  for (const f of plan.files) {
    assert.doesNotMatch(f.path, /\.md\.txt$/, 'les normes entren com a .md');
    assert.equal(f.before === null, pla.BASES[f.path] === null, `${f.path}: només les altes porten before null`);
  }
  assert.ok(targets.includes('.agents/rules/firebase_hosting.md'));
  for (const s of scopes) assert.ok(fs.existsSync(path.join(REPO, s)), s);
  for (const tg of targets) assert.ok(scopes.some((s) => tg === s || tg.startsWith(`${s}/`)), `${tg} fora dels scopes`);
  // Només informa: l'executor refusa qualsevol lease amb el segell de skills trencat (executor-mutacio.mjs:42).
  const { verificaSegell } = await import('../tooling/gates/segella.mjs');
  const segell = verificaSegell(REPO);
  t.diagnostic(`segell de skills: ${segell.ok ? 'intacte' : `${segell.motiu} (actual ${segell.hash?.slice(0, 8)}, segellat ${segell.anterior?.slice(0, 8)})`}`);
});

test('la skill d’higiene que el paquet porta de la incidència de l’Escriptori només hi afig la lliçó 260930', (t) => {
  if (salta(t, { tot: true })) return;
  const ruta = '.agents/skills/core-higiene-escriptori/SKILL.md';
  const font = path.join(LAB, 'nous', `${ruta}.txt`);
  if (!fs.existsSync(font)) return t.skip('la incidència de l’Escriptori no hi ha deixat la skill');
  const text = fs.readFileSync(font, 'utf8');
  const real = llig(ruta);
  if (text === real) return;
  const noves = text.split('\n').filter((l) => !real.split('\n').includes(l));
  assert.equal(noves.length, 1, noves.join('\n'));
  assert.match(noves[0], /^- \*\*260930 · /);
  assert.equal(text.replace(`${noves[0]}\n`, ''), real, 'el frontmatter i la resta del cos no canvien: l’índex de skills no s’ha de regenerar');
});

test('prepara-pla: la Petorreta i el manifest passarien el seal, i les fonts no porten res sensible', async (t) => {
  if (salta(t, { tot: true })) return;
  const { plan, targets } = await pla.preparaPla(REPO);
  const petorreta = pla.construeixPetorreta({ sessio: pla.SESSIO_ZERO, intentSha256: 'a'.repeat(64), rulesSha256: 'b'.repeat(64), planSha256: pla.sha(JSON.stringify(plan)), targets });
  const { validatePetorreta } = await import('../tooling/wiki/reflex_petorreta.mjs');
  assert.deepEqual(validatePetorreta(path.join(REPO, '.sdp-reflex/bootstrap/x', pla.NOM_PETORRETA), petorreta), []);
  const manifest = JSON.parse(pla.manifest(REPO));
  assert.deepEqual(Object.keys(manifest), ['sources']);
  assert.ok(manifest.sources.some((s) => s.path === pla.LLEGIU));
  for (const s of manifest.sources) {
    assert.ok(s.reason.length <= 240);
    assert.deepEqual(pla.sensibles(fs.readFileSync(path.join(REPO, s.path), 'utf8')), [], s.path);
  }
  assert.deepEqual(pla.sensibles(petorreta), []);
  assert.deepEqual(pla.sensibles(pla.manifest(REPO)), []);
});

test('prepara-pla reconeix la transacció acceptada del paquet, i només eixa; amb ella el pla es nega', async (t) => {
  if (salta(t)) return;
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-gov-260930b-tx-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  assert.equal(pla.transaccio(dir), null, 'sense carpeta de transaccions');
  const tx = path.join(dir, '.agents/seal-transactions');
  fs.mkdirSync(tx, { recursive: true });
  const posa = (nom, dades) => fs.writeFileSync(path.join(tx, nom), typeof dades === 'string' ? dades : JSON.stringify(dades));
  const nostra = `${pla.OPERACIO}12345678`;
  posa('a.json', { id: 'a', state: 'accepted', operationId: 'sdp-t1-t16-6d4eb9bb', files: [] });
  posa('b.json', { id: 'b', state: 'failed', operationId: nostra, files: [] });
  posa('c.json', '{');
  posa('d.txt', JSON.stringify({ id: 'd', state: 'accepted', operationId: nostra, files: [] }));
  posa('e.json', { id: 'e', state: 'accepted', kind: 'explicit-reconciliation' });
  assert.equal(pla.transaccio(dir), null, 'una altra operació, una fallida, un JSON trencat, un .txt o una reconciliació no compten');
  posa('f.json', { id: 'f', state: 'accepted', operationId: nostra, files: [{ path: 'tooling/gates/porta-olivera.mjs' }] });
  assert.equal(pla.transaccio(dir)?.id, 'f');
  await assert.rejects(pla.preparaPla(dir), /ja aplicat per la transacció f/);
});

test('prepara-pla no escriu cap fitxer i la seua CLI treu el pla per stdout', (t) => {
  if (salta(t, { tot: true })) return;
  const codi = fs.readFileSync(path.join(LAB, 'prepara-pla.mjs'), 'utf8');
  assert.doesNotMatch(codi, /\b(?:writeFileSync|appendFileSync|mkdirSync|renameSync|rmSync|unlinkSync|copyFileSync|cpSync|openSync)\b/);
  const r = spawnSync(process.execPath, [path.join(LAB, 'prepara-pla.mjs'), 'pla'], { cwd: REPO, encoding: 'utf8', timeout: 60000 });
  assert.equal(r.status, 0, r.stderr);
  const plan = JSON.parse(r.stdout);
  assert.equal(plan.schema, 'sdp.mutation.v1');
  assert.match(r.stderr, /sessió zero/);
  const c = spawnSync(process.execPath, [path.join(LAB, 'prepara-pla.mjs'), 'comprova'], { cwd: REPO, encoding: 'utf8', timeout: 60000 });
  assert.equal(c.status, 0, c.stderr);
  assert.match(c.stdout, /reflex_petorreta\.mjs open --intent=".+" --risk=high --operation=governance-write --scope=/);
  assert.equal(spawnSync(process.execPath, [path.join(LAB, 'prepara-pla.mjs'), 'inventat'], { cwd: REPO, encoding: 'utf8' }).status, 1);
});
