import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  SCHEMA, PROFILE, BUDGETS, CONFIG_PATH, ENTRY_ID, LOADER, SOURCE_TREES,
  createContext, captureSnapshot, captureOutputs, captureAst, toolIdentity,
  dependencyDeclarations, runtimeIdentitySet, captureRuntimePins, captureConfigIds,
  artifactPin, normalProcess, graphSummary, deriveMetrics, validateReceipt,
  exitCode, parseLawLog, sha256
} from '../tooling/gates/lib/fn009-wp-build.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const LAWS = [
  'LLEI_01_CLASSE_ORFENA', 'LLEI_02_TOKEN_FANTASMA', 'LLEI_03_ESTIL_EN_LINIA',
  'LLEI_03_COLOR_EN_LINIA', 'LLEI_04_VIDA', 'LLEI_05_PORTA_UNICA',
  'LLEI_06_ENCAPSULAMENT', 'LLEI_07_PARITAT_I18N', 'LLEI_08_SUBARBRE_ORFE'
];

function lawLog(orphans = []) {
  const rows = LAWS.map((name, index) => `${index === 8 && orphans.length ? '✗' : '·'} ${name} ${index === 8 ? orphans.length : 0} màx 0`);
  return ['══ TRACTOR PEDRA SECA ══', '', ...rows,
    ...orphans.map(name => `      + ${name}`), '',
    orphans.length ? "PARAT. El deute puja o s'ha trencat una llei dura." : 'PASSA. El deute no puja.', ''].join('\n');
}

function fixture(t, { orphan = false, cycle = false, lazy = false, configHelper = false } = {}) {
  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-fn009-unit-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const root = path.join(temporary, 'source');
  const artifacts = path.join(temporary, 'artifact');
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(artifacts, 'build'), { recursive: true });
  for (const directory of SOURCE_TREES) fs.mkdirSync(path.join(root, directory), { recursive: true });
  fs.writeFileSync(path.join(root, CONFIG_PATH), 'export default {};\n');
  if (configHelper) {
    fs.writeFileSync(path.join(root, CONFIG_PATH), "import './tooling/config-helper.mjs'; export default {};\n");
    fs.writeFileSync(path.join(root, 'tooling/config-helper.mjs'), "export * from './config-leaf.mjs';\n");
    fs.writeFileSync(path.join(root, 'tooling/config-leaf.mjs'), 'export const owned=1;\n');
  }
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"fn009-owned-unit","type":"module"}\n');
  fs.writeFileSync(path.join(root, 'src/embed.jsx'), "import { dep } from './dep.js'; export const value = dep;\n");
  fs.writeFileSync(path.join(root, 'src/dep.js'), cycle ? "import './embed.jsx'; export const dep=1;\n"
    : lazy ? "export const dep=1; export const open=()=>import('./embed.jsx');\n" : 'export const dep=1;\n');
  if (orphan) fs.writeFileSync(path.join(root, 'src/orphan.js'), 'export const unused=1;\n');
  const output = path.join(artifacts, 'build');
  fs.writeFileSync(path.join(output, 'entry.js'), "import { dep } from './dep.js'; export const value=dep;\n");
  fs.writeFileSync(path.join(output, 'dep.js'), cycle ? "import './entry.js'; export const dep=1;\n"
    : lazy ? "export const dep=1; export const open=()=>import('./entry.js');\n" : 'export const dep=1;\n');
  fs.writeFileSync(path.join(output, LOADER), "import('./entry.js');\n");
  const modules = [
    { id: 'rel:src/dep.js', fileId: 'rel:src/dep.js', kind: 'repo', entry: false,
      imports: cycle ? [ENTRY_ID] : [], dynamicImports: lazy ? [ENTRY_ID] : [] },
    { id: ENTRY_ID, fileId: ENTRY_ID, kind: 'repo', entry: true, imports: ['rel:src/dep.js'], dynamicImports: [] }
  ];
  const chunks = [
    { fileName: 'dep.js', entry: false, facadeId: null, imports: cycle ? ['entry.js'] : [],
      dynamicImports: lazy ? ['entry.js'] : [], modules: ['rel:src/dep.js'] },
    { fileName: 'entry.js', entry: true, facadeId: ENTRY_ID, imports: ['dep.js'], dynamicImports: [], modules: [ENTRY_ID] }
  ];
  const context = createContext(root);
  const configIds = captureConfigIds(context);
  const pins = captureRuntimePins(runtimeIdentitySet(modules, configIds, context), context);
  const graph = graphSummary(modules, chunks);
  const before = captureSnapshot(root);
  const orphans = orphan ? ['src/orphan.js'] : [];
  fs.writeFileSync(path.join(artifacts, 'llei08.log'), lawLog(orphans));
  fs.writeFileSync(path.join(artifacts, 'ast.json'), JSON.stringify(captureAst(root), null, 2) + '\n');
  const outputs = captureOutputs(output);
  const receipt = {
    schema: SCHEMA, profile: PROFILE, budgets: BUDGETS,
    producerPins: toolIdentity(context), dependencyRoots: dependencyDeclarations(context), versions: context.versions,
    source: { before, after: structuredClone(before) }, runtime: { configIds, pinsBefore: pins, pinsAfter: structuredClone(pins) },
    graph: { modules, chunks, staticScc: graph.staticScc, combinedScc: graph.combinedScc },
    astPin: artifactPin(artifacts, 'ast.json'), outputs, metrics: deriveMetrics(chunks, outputs),
    law: { process: normalProcess(orphan ? 1 : 0), logPin: artifactPin(artifacts, 'llei08.log'), count: orphans.length, maximum: 0, newOrphans: orphans },
    build: { process: normalProcess(0), durationMs: 1, environment: 'minimal-ci-fixture-v1', publicCopied: false, snapshotAtomic: false, warnings: [] },
    coverage: { allRoots: false, scope: PROFILE }
  };
  return { root, artifacts, output, receipt, temporary };
}

function result(fixtureValue) {
  return validateReceipt(fixtureValue.receipt, { root: fixtureValue.root, artifactRoot: fixtureValue.artifacts });
}

test('complete owned unit evidence remains INCOMPLET/2; no real build is claimed', t => {
  const value = result(fixture(t));
  assert.equal(value.status, 'INCOMPLET');
  assert.equal(exitCode(value), 2);
  assert.equal(value.certifiesProduction, false);
  assert.equal(value.filterWarmCertified, false);
});

test('orphan and static cycle fixtures fail; lazy cycle stays visible without a TDZ claim', t => {
  assert.equal(result(fixture(t, { orphan: true })).status, 'FAIL');
  assert.equal(result(fixture(t, { cycle: true })).status, 'FAIL');
  const lazy = result(fixture(t, { lazy: true }));
  assert.equal(lazy.status, 'INCOMPLET');
  assert.equal(lazy.graph.combinedScc.length, 1);
});

const schemaMutations = [
  ['unknown top-level field', value => { value.extra = true; }],
  ['non-object receipt', () => null],
  ['array instead of modules', value => { value.graph.modules = {}; }],
  ['boolean mode', value => { value.outputs[0].mode = true; }],
  ['fractional byte count', value => { value.outputs[0].bytes = 1.5; }],
  ['infinite byte count', value => { value.metrics.coreBytes = Infinity; }],
  ['arbitrary producer path', value => { value.producerPins[0].path = 'package.json'; }],
  ['missing producer pin', value => { value.producerPins.pop(); }],
  ['false global coverage', value => { value.coverage.allRoots = true; }],
  ['unknown dependency root', value => { value.dependencyRoots.push({ id: 'outside', basis: '/etc' }); }],
  ['path traversal output', value => { value.outputs[0].path = '../outside.js'; }],
  ['null gate exit', value => { value.law.process.exit = null; }],
  ['signal settlement', value => { value.law.process.signal = 'SIGTERM'; }],
  ['truncated settlement', value => { value.law.process.truncated = true; }],
  ['missing artifact', value => { value.outputs = []; }],
  ['duplicate module', value => { value.graph.modules.push(value.graph.modules[0]); }],
  ['duplicate chunk', value => { value.graph.chunks.push(value.graph.chunks[0]); }],
  ['truncated module graph', value => { value.graph.modules = [value.graph.modules[1]]; }],
  ['empty graph edges contradict chunks', value => { value.graph.modules.forEach(module => { module.imports = []; }); }],
  ['phantom entry without output', value => { value.graph.chunks[1].fileName = 'never-emitted.js'; }],
  ['omitted required physical runtime pin', value => { value.runtime.pinsBefore.pop(); value.runtime.pinsAfter.pop(); }],
  ['missing graph SCC', value => { value.graph.staticScc = null; }],
  ['fake zero core', value => { value.metrics.coreBytes = 0; }]
];
for (const [label, mutate] of schemaMutations) {
  test(`INVALIDAT without uncaught TypeError: ${label}`, t => {
    const value = fixture(t);
    const replacement = mutate(value.receipt);
    if (replacement === null) value.receipt = null;
    const checked = result(value);
    assert.equal(checked.status, 'INVALIDAT', JSON.stringify(checked));
    assert.equal(exitCode(checked), 2);
  });
}

test('a prefixed zero header cannot hide the retained orphan section', t => {
  const value = fixture(t, { orphan: true });
  const file = path.join(value.artifacts, 'llei08.log');
  fs.writeFileSync(file, 'LLEI_08_SUBARBRE_ORFE 0 màx 0\n\n' + fs.readFileSync(file, 'utf8'));
  value.receipt.law.logPin = artifactPin(value.artifacts, 'llei08.log');
  value.receipt.law.count = 0;
  value.receipt.law.newOrphans = [];
  assert.equal(result(value).status, 'INVALIDAT');
  assert.throws(() => parseLawLog(fs.readFileSync(file, 'utf8'), normalProcess(1)), /múltiple/);
});

test('native config relative closure is derived independently, including reexports', t => {
  const value = fixture(t, { configHelper: true });
  assert.equal(result(value).status, 'INCOMPLET');
  assert.deepEqual(value.receipt.runtime.configIds, [
    'rel:tooling/config-helper.mjs', 'rel:tooling/config-leaf.mjs', `rel:${CONFIG_PATH}`
  ]);
  value.receipt.runtime.configIds = [`rel:${CONFIG_PATH}`];
  value.receipt.runtime.pinsBefore = value.receipt.runtime.pinsBefore.filter(pin => !pin.id.startsWith('rel:tooling/config-'));
  value.receipt.runtime.pinsAfter = structuredClone(value.receipt.runtime.pinsBefore);
  const checked = result(value);
  assert.equal(checked.status, 'INVALIDAT');
  assert(checked.issues.some(issue => issue.includes('Clausura relativa')));
});

test('source changes/additions/removals invalidate, also after a portable relocation', t => {
  const value = fixture(t);
  const relocated = path.join(value.temporary, 'relocated-source');
  fs.cpSync(value.root, relocated, { recursive: true });
  assert.equal(validateReceipt(value.receipt, { root: relocated, artifactRoot: value.artifacts }).status, 'INCOMPLET');
  fs.appendFileSync(path.join(relocated, 'src/dep.js'), '// owned change\n');
  assert.equal(validateReceipt(value.receipt, { root: relocated, artifactRoot: value.artifacts }).status, 'INVALIDAT');
  fs.writeFileSync(path.join(value.root, 'src/new.js'), 'export const added=1;\n');
  assert.equal(result(value).status, 'INVALIDAT');
  fs.unlinkSync(path.join(value.root, 'src/new.js'));
  fs.unlinkSync(path.join(value.root, 'src/dep.js'));
  assert.equal(result(value).status, 'INVALIDAT');
});

test('a relocated static cycle keeps its repo identity and cannot disappear behind an absolute prefix', t => {
  const value = fixture(t, { cycle: true });
  const relocated = path.join(value.temporary, 'other-source');
  fs.cpSync(value.root, relocated, { recursive: true });
  const checked = validateReceipt(value.receipt, { root: relocated, artifactRoot: value.artifacts });
  assert.equal(checked.status, 'FAIL');
  assert(checked.fails.some(item => item.code === 'FN009_STATIC_SOURCE_SCC'));
});

test('outputs and AST are material, not zero-byte defaults or trusted counters', t => {
  const value = fixture(t);
  fs.appendFileSync(path.join(value.output, 'dep.js'), 'changed\n');
  assert.equal(result(value).status, 'INVALIDAT');
  const other = fixture(t);
  fs.writeFileSync(path.join(other.artifacts, 'ast.json'), '{}\n');
  other.receipt.astPin = artifactPin(other.artifacts, 'ast.json');
  assert.equal(result(other).status, 'INVALIDAT');
});

test('swapping entry metadata cannot hide bytes still loaded by the material loader', t => {
  const value = fixture(t);
  fs.appendFileSync(path.join(value.output, 'entry.js'), '/*' + 'x'.repeat(BUDGETS.coreBytes) + '*/\n');
  value.receipt.outputs = captureOutputs(value.output);
  value.receipt.metrics = deriveMetrics(value.receipt.graph.chunks, value.receipt.outputs);
  assert.equal(result(value).status, 'FAIL');
  const entry = value.receipt.graph.chunks.find(chunk => chunk.fileName === 'entry.js');
  const other = value.receipt.graph.chunks.find(chunk => chunk.fileName === 'dep.js');
  entry.entry = false; entry.facadeId = null; entry.modules = ['rel:src/dep.js'];
  other.entry = true; other.facadeId = ENTRY_ID; other.modules = [ENTRY_ID];
  value.receipt.metrics = deriveMetrics(value.receipt.graph.chunks, value.receipt.outputs);
  const checked = result(value);
  assert.equal(checked.status, 'INVALIDAT');
  assert(checked.issues.some(issue => issue.includes('carregador material')));
});

test('canonical computed loader contract binds the entry while its import remains opaque', t => {
  const value = fixture(t);
  const file = path.join(value.output, LOADER);
  fs.writeFileSync(file, 'install(window,document,document.currentScript,{modul:"entry.js",claus:["ready"],fitxer:"soc-de-poble.standalone.js"},url=>import(url));\n');
  value.receipt.outputs = captureOutputs(value.output);
  value.receipt.metrics = deriveMetrics(value.receipt.graph.chunks, value.receipt.outputs);
  const checked = result(value);
  assert.equal(checked.status, 'INCOMPLET');
  assert.equal(checked.opaque.emitted.length, 1);
  fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('modul:"entry.js"', 'modul:"dep.js"'));
  value.receipt.outputs = captureOutputs(value.output);
  value.receipt.metrics = deriveMetrics(value.receipt.graph.chunks, value.receipt.outputs);
  assert.equal(result(value).status, 'INVALIDAT');
});

test('release and Vite entry sidecars must agree when present, without becoming authorities', t => {
  const value = fixture(t);
  const loader = value.receipt.outputs.find(pin => pin.path === LOADER);
  const release = { schema: 'sdp.release.v1', formatDelPaquet: { format: 'trossos', modul: 'entry.js' },
    entrada: { cami: LOADER, mida: loader.bytes, sha256: loader.sha256 } };
  const manifest = { 'src/embed.jsx': { isEntry: true, src: 'src/embed.jsx', file: 'entry.js' } };
  fs.mkdirSync(path.join(value.output, '.vite'));
  const save = () => {
    fs.writeFileSync(path.join(value.output, 'sdp-release.json'), JSON.stringify(release));
    fs.writeFileSync(path.join(value.output, '.vite/manifest.json'), JSON.stringify(manifest));
    value.receipt.outputs = captureOutputs(value.output);
  };
  save();
  assert.equal(result(value).status, 'INCOMPLET');
  release.formatDelPaquet.modul = 'dep.js'; save();
  assert.equal(result(value).status, 'INVALIDAT');
  release.formatDelPaquet.modul = 'entry.js';
  manifest['src/embed.jsx'].file = 'dep.js'; save();
  assert.equal(result(value).status, 'INVALIDAT');
});

test('root Vite symlink, including a dangling one, is refused rather than omitted', t => {
  const value = fixture(t);
  const config = path.join(value.root, CONFIG_PATH);
  fs.unlinkSync(config);
  fs.symlinkSync(path.join(value.temporary, 'missing.js'), config);
  assert.throws(() => captureSnapshot(value.root), /Config.*regular/);
  assert.equal(result(value).status, 'INVALIDAT');
});

test('CLI malformed args produce JSON/2 via physical path, /tmp alias and a parent symlink', t => {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-fn009-cli-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const link = path.join(directory, 'repo-link');
  fs.symlinkSync(ROOT, link, 'dir');
  for (const name of ['compila-fn009-wp.mjs', 'verifica-fn009-wp.mjs']) {
    const relative = `tooling/gates/${name}`;
    const paths = [path.join(ROOT, relative), path.join(link, relative)];
    if (ROOT.startsWith('/private/tmp/')) paths.push(path.join(ROOT.replace('/private/tmp/', '/tmp/'), relative));
    for (const command of paths) {
      const child = spawnSync(process.execPath, [command, '--unknown', 'value'], { encoding: 'utf8' });
      assert.equal(child.status, 2, child.stderr);
      assert.equal(JSON.parse(child.stdout).status, 'INVALIDAT');
    }
  }
});

test('importing both CLIs does not run main, create outputs or compile', t => {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-fn009-import-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'imports.mjs');
  fs.writeFileSync(file, `await import(${JSON.stringify(pathToFileURL(path.join(ROOT, 'tooling/gates/compila-fn009-wp.mjs')).href)});\nawait import(${JSON.stringify(pathToFileURL(path.join(ROOT, 'tooling/gates/verifica-fn009-wp.mjs')).href)});\nprocess.stdout.write('IMPORTED');\n`);
  const child = spawnSync(process.execPath, [file], { cwd: directory, encoding: 'utf8' });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, 'IMPORTED');
  assert.deepEqual(fs.readdirSync(directory), ['imports.mjs']);
});

test('missing or duplicate CLI options fail as JSON/2 before creating outputs', t => {
  const directory = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sdp-fn009-args-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const output = path.join(directory, 'must-not-exist');
  for (const [name, option] of [['compila-fn009-wp.mjs', '--sortida'], ['verifica-fn009-wp.mjs', '--rebut']]) {
    const command = path.join(ROOT, 'tooling/gates', name);
    for (const args of [[], ['--arrel'], ['--arrel', ROOT], ['--arrel', ROOT, '--arrel', ROOT, option, output]]) {
      const child = spawnSync(process.execPath, [command, ...args], { encoding: 'utf8' });
      assert.equal(child.status, 2, child.stderr);
      assert.equal(JSON.parse(child.stdout).status, 'INVALIDAT');
      assert.equal(fs.existsSync(output), false);
    }
  }
});

test('malformed receipt JSON is INVALIDAT/2 instead of an uncaught parser failure', t => {
  const value = fixture(t);
  const file = path.join(value.artifacts, 'rebut.json');
  fs.writeFileSync(file, '{"schema":');
  const child = spawnSync(process.execPath, [path.join(ROOT, 'tooling/gates/verifica-fn009-wp.mjs'),
    '--arrel', value.root, '--rebut', file], { encoding: 'utf8' });
  assert.equal(child.status, 2, child.stderr);
  assert.equal(JSON.parse(child.stdout).status, 'INVALIDAT');
  assert.equal(child.stderr, '');
});

test('log pin uses actual bytes and never accepts a claimed digest alone', t => {
  const value = fixture(t);
  value.receipt.law.logPin.sha256 = sha256('an unrelated innocent string');
  assert.equal(result(value).status, 'INVALIDAT');
});
