import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {executa, empremta, REGISTRE} from '../tooling/gates/frontissa-contingut.mjs';
import {executeMutation} from '../tooling/gates/executor-mutacio.mjs';
import {verificaSegell} from '../tooling/gates/segella.mjs';
import {sha} from '../tooling/documental/core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const put = (root, rel, value) => { const file = path.join(root, rel); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, value); };
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-frontissa-dual-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  put(root, 'package.json', '{"type":"module"}\n'); put(root, '.agents/AGENTS.md', 'fixture');
  put(root, 'src/sections/text/pageContent.js', 'export const PAGE_COPY={poble:{html:"nou"}, retirada:{html:"fora"}};\n');
  put(root, 'src/config/systemPages.js', 'export const SYSTEM_PAGES=[{key:"poble"}];export const COVER_PAGE_KEYS={};\n');
  put(root, 'src/config/sections.js', 'export const SECTIONS=[];\n');
  put(root, REGISTRE, JSON.stringify({schema: 'sdp.contingut.v1', claus: {poble: {...empremta({html: 'vell'}), aprovat_per: 'Fixture', data: '2026-11-23'}}}));
  put(root, '.agents/skills/prova/SKILL.md', 'A0'); verificaSegell(root, {update: true}); return root;
}
const plan = () => ({schema: 'sdp.mutation.v1', session: 'fixture', operationId: 'test', files: [{path: '.agents/skills/prova/SKILL.md', before: sha('A0'), content: 'A1'}]});
const authorize = async () => ({claim: 'fixture-claim', complete: async () => {}});

test('frontissa: sense TTY ni rebut no hi ha mutació', async t => {
  const root = fixture(t), before = fs.readFileSync(path.join(root, REGISTRE));
  await assert.rejects(executa(['--aprova', 'poble', '--per', 'Fixture', '--motiu', 'Revisió explícita'], root), /TTY|agent|rebut|Claim|sessió/i);
  assert.deepEqual(fs.readFileSync(path.join(root, REGISTRE)), before);
});
test('frontissa: ordres contradictòries fallen abans de qualsevol efecte', async t => {
  const root = fixture(t), before = fs.readFileSync(path.join(root, REGISTRE));
  await assert.rejects(executa(['--aprova', 'poble', '--retira', 'retirada', '--per', 'Fixture', '--motiu', 'Revisió explícita'], root), /ambig|una.*ordre|incompat/i);
  assert.deepEqual(fs.readFileSync(path.join(root, REGISTRE)), before);
});
test('frontissa: accepta-retall sense motiu explícit falla', async t => {
  const root = fixture(t);
  await assert.rejects(executa(['--aprova', 'poble', '--per', 'Fixture', '--accepta-retall'], root), /motiu/i);
});
test('frontissa: registre symlink no és un target vàlid', async t => {
  const root = fixture(t), file = path.join(root, REGISTRE), outside = path.join(root, 'registre-extra.json'); fs.renameSync(file, outside); fs.symlinkSync(outside, file);
  await assert.rejects(executa(['--aprova', 'poble', '--per', 'Fixture', '--motiu', 'Revisió'], root), /symlink|regular/i);
});
test('executor: CAS immediat després del fsync del temporal preserva un canvi concurrent', async t => {
  const root = fixture(t), sync = fs.fsyncSync; let injected = false;
  fs.fsyncSync = fd => { sync(fd); const dir = path.join(root, '.agents/skills/prova'); if (!injected && fs.readdirSync(dir).some(name => name.endsWith('.tmp') && fs.readFileSync(path.join(dir, name), 'utf8') === 'A1')) { injected = true; put(root, '.agents/skills/prova/SKILL.md', 'concurrent'); } };
  try { await assert.rejects(executeMutation(root, plan(), authorize), /CAS|concurrent/); }
  finally { fs.fsyncSync = sync; }
  assert.equal(injected, true); assert.equal(fs.readFileSync(path.join(root, '.agents/skills/prova/SKILL.md'), 'utf8'), 'concurrent');
  assert.equal(fs.existsSync(path.join(root, '.agents/runtime/mutation.pending.json')), true);
});
test('executor: auditoria invàlida falla abans del target', async t => {
  const root = fixture(t); put(root, '.agents/runtime/segell.log', 'no-json\n');
  await assert.rejects(executeMutation(root, plan(), authorize), /Traça|auditoria/i);
  assert.equal(fs.readFileSync(path.join(root, '.agents/skills/prova/SKILL.md'), 'utf8'), 'A0');
});
test('executor: evidència amb symlink falla abans del target', async t => {
  const root = fixture(t); fs.mkdirSync(path.join(root, 'evidencia')); fs.symlinkSync(path.join(root, 'evidencia'), path.join(root, '.agents/seal-transactions'));
  await assert.rejects(executeMutation(root, plan(), authorize), /symlink/i);
  assert.equal(fs.readFileSync(path.join(root, '.agents/skills/prova/SKILL.md'), 'utf8'), 'A0');
});

const args = (action, key = 'poble', extra = []) => [`--${action}`, ...(action === 'inicia' ? [] : [key]), '--per', 'Mantenidor', '--motiu', 'Revisió humana explícita', ...extra];
const agent = (argv, root, auth = authorize) => executa(argv, root, {session: 'fixture', authorize: auth});
const records = root => fs.readdirSync(path.join(root, '.agents/seal-transactions')).map(name => JSON.parse(fs.readFileSync(path.join(root, '.agents/seal-transactions', name))));
const snapshot = root => {
  const out = {}; const walk = rel => { for (const e of fs.readdirSync(path.join(root, rel), {withFileTypes: true})) { const name = rel ? `${rel}/${e.name}` : e.name; out[name] = e.isDirectory() ? 'directory' : sha(fs.readFileSync(path.join(root, name))); if (e.isDirectory()) walk(name); } }; walk(''); return out;
};

test('agent: aprovació exacta deixa CAS, motiu, claim i segell verificables', async t => {
  const root = fixture(t), before = sha(fs.readFileSync(path.join(root, REGISTRE)));
  const r = await agent(args('aprova'), root); assert.equal(verificaSegell(root).ok, true);
  const [audit] = records(root); assert.equal(audit.id, r.transaction); assert.equal(audit.kind, 'frontissa-agent'); assert.equal(audit.claim, 'fixture-claim');
  assert.equal(audit.reason, 'Revisió humana explícita'); assert.equal(audit.actor, 'Mantenidor'); assert.equal(audit.files[0].before, before);
  assert.equal(audit.files[0].after, sha(fs.readFileSync(path.join(root, REGISTRE)))); assert.equal((await executa([], root)).valid, true);
});
test('agent: inici CAS null i retirada d’una clau sense consumidor', async t => {
  const root = fixture(t); fs.unlinkSync(path.join(root, REGISTRE));
  const started = await agent(args('inicia'), root); assert.equal(started.before, null);
  await agent(args('aprova', 'retirada'), root); await agent(args('retira', 'retirada'), root);
  assert.equal(Object.hasOwn(JSON.parse(fs.readFileSync(path.join(root, REGISTRE))).claus, 'retirada'), false);
  assert.deepEqual(new Set(records(root).map(r => r.action)), new Set(['inicia', 'aprova', 'retira']));
});
test('agent: --accepta-retall audita literalment bandera i motiu', async t => {
  const root = fixture(t), registry = JSON.parse(fs.readFileSync(path.join(root, REGISTRE))); registry.claus.poble.html = 100;
  put(root, REGISTRE, JSON.stringify(registry));
  await assert.rejects(agent(args('aprova'), root), /accepta-retall/);
  await agent(args('aprova', 'poble', ['--accepta-retall']), root);
  const [audit] = records(root); assert.equal(audit.acceptaRetall, true); assert.equal(audit.reason, 'Revisió humana explícita');
});
test('comprovació pura: cap fitxer ni directori nou, també amb pending', async t => {
  const root = fixture(t); const before = snapshot(root); await executa(['--json'], root); assert.deepEqual(snapshot(root), before);
  put(root, '.agents/runtime/mutation.pending.json', '{}'); const pending = snapshot(root);
  const checked = await executa([], root); assert.equal(checked.valid, false); assert.ok(checked.errors.some(e => e.codi === 'operacio-incompleta')); assert.deepEqual(snapshot(root), pending);
});
test('executor genèric no pot evitar política Frontissa ni sobreescriure identitat auditada', async t => {
  const root = fixture(t), content = fs.readFileSync(path.join(root, REGISTRE), 'utf8');
  const p = {...plan(), files: [{path: REGISTRE, before: sha(content), content}]};
  await assert.rejects(executeMutation(root, p, authorize), /Frontissa incomplet/);
  p.frontissa = {action: 'aprova', key: 'poble', actor: 'Fixture', reason: 'Revisat', acceptaRetall: false, session: 'forjada'};
  await assert.rejects(executeMutation(root, p, authorize), /Frontissa incomplet/);
  assert.equal(fs.existsSync(path.join(root, '.agents/runtime/mutation.pending.json')), false);
});
test('frontissa copia argv i dependències abans del primer await', async t => {
  const root = fixture(t), argv = args('aprova'), deps = {session: 'fixture', authorize};
  const running = executa(argv, root, deps); argv[argv.indexOf('--motiu') + 1] = 'motiu canviat'; deps.authorize = () => { throw new Error('dependència canviada'); };
  await running; assert.equal(records(root)[0].reason, 'Revisió humana explícita');
});
test('executor copia el pla abans del claim i preserva planHash', async t => {
  const root = fixture(t), p = plan(), hash = sha(JSON.stringify(p));
  await executeMutation(root, p, async () => { p.files[0].content = 'canvi injectat'; p.session = 'altra'; return authorize(); });
  assert.equal(fs.readFileSync(path.join(root, '.agents/skills/prova/SKILL.md'), 'utf8'), 'A1'); assert.equal(records(root)[0].planHash, hash); assert.equal(records(root)[0].session, 'fixture');
});
test('claim tardà fallit preserva pending i la porta no dóna verd pels bytes efectius', async t => {
  const root = fixture(t), seal = fs.readFileSync(path.join(root, '.agents/SKILLS_SEAL.json'));
  await assert.rejects(agent(args('aprova'), root, async () => ({claim: 'claim', complete: async () => { throw new Error('claim tardà denegat'); }})), /claim tardà/);
  assert.equal((await executa([], root)).valid, false); assert.deepEqual(fs.readFileSync(path.join(root, '.agents/SKILLS_SEAL.json')), seal);
  let called = false; await assert.rejects(agent(args('aprova'), root, () => { called = true; }), /Segell previ|incompleta/); assert.equal(called, false);
});
test('dos escriptors cooperatius no comparteixen claim ni sobreescriuen lock', async t => {
  const root = fixture(t); let entered, release;
  const ready = new Promise(resolve => { entered = resolve; }), waiting = new Promise(resolve => { release = resolve; });
  const first = executeMutation(root, plan(), async () => { entered(); await waiting; return authorize(); }); await ready;
  let called = false; await assert.rejects(executeMutation(root, plan(), () => { called = true; }), /EEXIST/); assert.equal(called, false);
  release(); await first; assert.equal(verificaSegell(root).ok, true);
});
test('fsync temporal fallit preserva preimatge, segell i pending', async t => {
  const root = fixture(t), sync = fs.fsyncSync, seal = fs.readFileSync(path.join(root, '.agents/SKILLS_SEAL.json')); let injected = false;
  fs.fsyncSync = fd => { if (!injected && fs.readdirSync(path.join(root, '.agents/skills/prova')).some(name => name.endsWith('.tmp'))) { injected = true; throw new Error('fsync EIO fixture'); } sync(fd); };
  try { await assert.rejects(executeMutation(root, plan(), authorize), /fsync EIO/); } finally { fs.fsyncSync = sync; }
  assert.equal(injected, true); assert.equal(fs.readFileSync(path.join(root, '.agents/skills/prova/SKILL.md'), 'utf8'), 'A0'); assert.deepEqual(fs.readFileSync(path.join(root, '.agents/SKILLS_SEAL.json')), seal);
  assert.equal(fs.existsSync(path.join(root, '.agents/runtime/mutation.pending.json')), true);
});
for (const rel of [REGISTRE, '.agents/runtime/segell.log', '.agents/SKILLS_SEAL.json']) test(`hardlink rebutjat abans del claim: ${rel}`, async t => {
  const root = fixture(t); if (!fs.existsSync(path.join(root, rel))) put(root, rel, ''); fs.linkSync(path.join(root, rel), path.join(root, 'hardlink'));
  let called = false; await assert.rejects(agent(args('aprova'), root, () => { called = true; }), /hardlink|regular/i); assert.equal(called, false);
});
test('evidència JSON invàlida rebutjada abans del target', async t => {
  const root = fixture(t); put(root, '.agents/seal-transactions/12345678-1234-4123-8123-123456789abc.json', '{}');
  await assert.rejects(executeMutation(root, plan(), authorize), /auditoria/i); assert.equal(fs.readFileSync(path.join(root, '.agents/skills/prova/SKILL.md'), 'utf8'), 'A0');
});
test('traversal i pare symlink són rebutjats', async t => {
  const root = fixture(t); const p = plan(); p.files[0].path = '.agents/skills/../skills/prova/SKILL.md';
  await assert.rejects(executeMutation(root, p, authorize), /Ruta/);
  fs.renameSync(path.join(root, '.agents/skills/prova'), path.join(root, '.agents/skills/real')); fs.symlinkSync('real', path.join(root, '.agents/skills/prova'));
  await assert.rejects(executeMutation(root, plan(), authorize), /symlink/);
});

const GATE = path.join(ROOT, 'tooling/gates/frontissa-contingut.mjs');
function cli(root, argv, {tty = false, env = {}} = {}) {
  const deny = path.join(root, 'deny-network.cjs');
  put(root, 'deny-network.cjs', "require('node:net').Socket.prototype.connect=()=>{throw new Error('network forbidden in human fixture')};global.fetch=()=>{throw new Error('network forbidden in human fixture')};\n");
  const command = [process.execPath, '--require', deny, GATE, '--arrel', root, ...argv];
  const options = {cwd: root, env: {PATH: '/usr/bin:/bin', TERM: 'dumb', ...env}, encoding: 'utf8', timeout: 15000};
  if (!tty) return spawnSync(command[0], command.slice(1), options);
  // Python's bundled POSIX pty module is only a test harness; production is Node-only.
  const harness = `import os, pty, sys, json
pid, fd = pty.fork()
if pid == 0:
    os.execve(sys.argv[1], sys.argv[1:], dict(os.environ))
output = b""
while True:
    try:
        data = os.read(fd, 4096)
        if not data: break
        output += data
    except OSError: break
os.close(fd)
_, status = os.waitpid(pid, 0)
print(json.dumps({"status": os.waitstatus_to_exitcode(status), "output": output.decode("utf-8", errors="replace")}))
`;
  const runner = spawnSync('/usr/bin/python3', ['-c', harness, ...command], options);
  assert.equal(runner.status, 0, runner.stderr);
  const result = JSON.parse(runner.stdout); return {status: result.status, stdout: result.output, stderr: runner.stderr};
}
function withoutAgentInfrastructure(root) {
  fs.rmSync(path.join(root, '.agents/SKILLS_SEAL.json')); fs.rmSync(path.join(root, '.agents/skills'), {recursive: true});
}
test('TTY real: humà aprova i retira sense IA, torn, rebut, segell ni xarxa', async t => {
  const root = fixture(t); withoutAgentInfrastructure(root);
  const registry = JSON.parse(fs.readFileSync(path.join(root, REGISTRE))); registry.claus.retirada = {...empremta({html: 'fora'}), aprovat_per: 'Fixture', data: '2026-11-23'};
  put(root, REGISTRE, JSON.stringify(registry));
  const before = sha(fs.readFileSync(path.join(root, REGISTRE)));
  for (const argv of [args('aprova'), args('retira', 'retirada')]) { const run = cli(root, argv, {tty: true}); assert.equal(run.status, 0, run.stderr + run.stdout); assert.match(run.stdout, /✅ \[Frontissa\]/); }
  assert.equal((await executa([], root)).valid, true); assert.equal(fs.existsSync(path.join(root, '.sdp-reflex')), false); assert.equal(fs.existsSync(path.join(root, '.agents/SKILLS_SEAL.json')), false);
  const audit = records(root); assert.equal(audit.length, 2); const approval = audit.find(r => r.action === 'aprova');
  assert.equal(approval.files[0].before, before); assert.ok(audit.every(r => r.kind === 'frontissa-human' && !Object.hasOwn(r, 'claim') && !Object.hasOwn(r, 'session')));
  const after = sha(fs.readFileSync(path.join(root, REGISTRE))); assert.equal(audit.find(r => r.action === 'retira').files[0].after, after);
});
test('TTY real: humà inicia registre absent amb CAS null sense segell d’IA', t => {
  const root = fixture(t); withoutAgentInfrastructure(root); fs.unlinkSync(path.join(root, REGISTRE));
  const run = cli(root, args('inicia'), {tty: true}); assert.equal(run.status, 0, run.stderr + run.stdout); assert.equal(records(root)[0].files[0].before, null);
});
for (const marker of ['CI', 'CODEX_THREAD_ID', 'SDP_AGENT', 'active-turn']) test(`TTY real no oculta context automatitzat: ${marker}`, t => {
  const root = fixture(t), before = fs.readFileSync(path.join(root, REGISTRE));
  if (marker === 'active-turn') put(root, '.agents/TORN_ACTIU.json', '{}');
  const run = cli(root, args('aprova'), {tty: true, env: marker === 'active-turn' ? {} : {[marker]: 'fixture'}});
  assert.notEqual(run.status, 0, run.stdout); assert.match(run.stderr + run.stdout, /Via agent\/automatitzada/); assert.deepEqual(fs.readFileSync(path.join(root, REGISTRE)), before);
});
test('CLI agent real sense rebut falla tancat i no produeix efectes de registre', t => {
  const root = fixture(t), before = fs.readFileSync(path.join(root, REGISTRE));
  const run = cli(root, args('aprova', 'poble', ['--session', '12345678-1234-4123-8123-123456789abc']), {env: {CI: '1'}});
  assert.notEqual(run.status, 0); assert.match(run.stderr + run.stdout, /Reflex|reflex|ENOENT|rebut/); assert.deepEqual(fs.readFileSync(path.join(root, REGISTRE)), before);
  assert.equal(fs.existsSync(path.join(root, '.agents/runtime/mutation.pending.json')), false);
});
test('CLI real rebutja opcions duplicades i desconegudes', t => {
  const root = fixture(t), before = fs.readFileSync(path.join(root, REGISTRE));
  for (const extra of [['--motiu', 'duplicat'], ['--force'], ['--accepta-retall=false']]) {
    const run = cli(root, [...args('aprova'), ...extra], {tty: true}); assert.notEqual(run.status, 0); assert.match(run.stderr + run.stdout, /ambig|desconegud/);
  }
  assert.deepEqual(fs.readFileSync(path.join(root, REGISTRE)), before);
});
test('auditoria ben formada però deslligada del journal no és acceptable', async t => {
  const root = fixture(t), result = await executeMutation(root, plan(), authorize);
  const file = `.agents/seal-transactions/${result.id}.json`, entry = JSON.parse(fs.readFileSync(path.join(root, file))); entry.session = 'sessió forjada'; put(root, file, JSON.stringify(entry));
  const next = plan(); next.files[0] = {...next.files[0], before: sha('A1'), content: 'A2'};
  await assert.rejects(executeMutation(root, next, authorize), /auditoria|journal|Traça/i);
  assert.equal(fs.readFileSync(path.join(root, '.agents/skills/prova/SKILL.md'), 'utf8'), 'A1');
});
test('previsualització de pla és només lectura i mostra el digest exacte per al Reflex', async t => {
  const root = fixture(t), before = snapshot(root);
  const preview = await executa([...args('aprova'), '--session', 'fixture', '--pla'], root);
  assert.equal(preview.planDigest, sha(JSON.stringify(preview.plan))); assert.equal(preview.plan.files[0].before, sha(fs.readFileSync(path.join(root, REGISTRE))));
  assert.deepEqual(snapshot(root), before); await executeMutation(root, preview.plan, authorize);
  assert.equal(records(root)[0].planHash, preview.planDigest);
});
