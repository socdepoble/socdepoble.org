import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, sha, inventari, projeccions, comprovaCataleg, segura } from '../tooling/brain/cataleg_skills.mjs';
import { prepara, resolProtocols, identitatTorn, desaEmissio, verificaEmissio } from '../tooling/brain/context_documental.mjs';
import { CONTRACTE_NUCLI, CAPACITATS } from '../src/data/contracte.js';
import { validatePublicCredentials } from '../src/config/publicCredentials.js';

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-consolidacio-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const files = ['.agents/BOOTSTRAP.md', '.agents/AGENTS.md', '.agents/PROFILE.md', '.agents/BASELINE.md',
    '.agents/PROTOCOL_PETORRETA.md', '.agents/consell.json', '.agents/protocolledge.json', '.agents/DESTINS_CANONICS.json'];
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, '.agents/protocolledge.json')));
  files.push(reg.default, ...reg.rutes.flatMap(r => [r.plantilla, ...r.lectures]));
  files.push(...inventari(ROOT).map(s => s.ruta));
  for (const rel of new Set(files)) {
    const dst = path.join(root, rel); fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), dst);
  }
  for (const [rel, text] of projeccions(inventari(root))) fs.writeFileSync(path.join(root, rel), text);
  return root;
}
function run(root, rel, args = [], input) {
  return spawnSync(process.execPath, [path.join(ROOT, rel), ...args], {
    env: { ...process.env, SDP_ARREL: root }, cwd: root, encoding: 'utf8', input,
  });
}
function transcript(root, task = 'auditoria backend') {
  const name = path.join(root, 'sessions/.system_generated/transcript.jsonl');
  fs.mkdirSync(path.dirname(name), { recursive: true });
  fs.writeFileSync(name, JSON.stringify({ type: 'USER_INPUT', content: task }) + '\n');
  return { transcriptPath: name, invocationNum: 1 };
}
function docCall(payload, root, relative = '_wiki_de_poble/04_escriptori/260920_0300_auditoria_prova.md') {
  return { ...payload, toolCall: { name: 'write_to_file', args: { TargetFile: path.join(root, relative) } } };
}
function verify(root, payload) {
  const p = run(root, '.agents/hooks/verify.mjs', [], JSON.stringify(payload));
  assert.equal(p.status, 0, p.stderr); return JSON.parse(p.stdout);
}

test('catàleg: 16 IDs iguals, dues escriptures idempotents i check sense mutació', t => {
  const root = fixture(t);
  const expected = inventari(root).map(s => s.id);
  assert.equal(expected.length, 16);
  for (let n = 0; n < 2; n++) {
    for (const command of ['tooling/brain/cataleg_skills.mjs', 'tooling/wiki/sincronitzar_skills.mjs',
      'tooling/maquinaria/rebuild_skills_index.mjs', 'tooling/gates/tractor-manifest.mjs']) {
      const before = [...projeccions(inventari(root)).keys()].map(p => sha(fs.readFileSync(path.join(root, p))));
      const result = run(root, command, ['--escriu']); assert.equal(result.status, 0, result.stderr);
      const after = [...projeccions(inventari(root)).keys()].map(p => sha(fs.readFileSync(path.join(root, p))));
      assert.deepEqual(after, before);
      assert.equal(comprovaCataleg(root).ok, true);
    }
  }
  const manifest = fs.readFileSync(path.join(root, '.agents/manifest.yaml'), 'utf8');
  const index = fs.readFileSync(path.join(root, '.agents/skills/00_INDEX_SKILLS.md'), 'utf8');
  assert.deepEqual([...manifest.matchAll(/skills\/(.*?)\/SKILL.md/g)].map(m => m[1]), expected);
  assert.deepEqual([...index.matchAll(/\[\[(.*?)\/SKILL\|/g)].map(m => m[1]), expected);
  assert.equal(fs.existsSync(path.join(root, '_wiki_de_poble/02_saber/skills_mirror')), false);
});
test('catàleg rebutja divergència, setzena skill absent i espill', t => {
  const root = fixture(t), index = path.join(root, '.agents/skills/00_INDEX_SKILLS.md');
  fs.appendFileSync(index, '\n- [[retirada/SKILL|retirada]]: antiga\n');
  assert.equal(comprovaCataleg(root).ok, false);
  const before = fs.readFileSync(index);
  assert.equal(run(root, 'tooling/brain/cataleg_skills.mjs', ['--check']).status, 1);
  assert.deepEqual(fs.readFileSync(index), before);
  fs.mkdirSync(path.join(root, '_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR'), { recursive: true });
  assert.ok(comprovaCataleg(root).problemes.some(p => p.includes('quarantena')));
  fs.renameSync(path.join(root, '.agents/skills/app-grid-shell/SKILL.md'), path.join(root, 'absent.md'));
  assert.throws(() => inventari(root));
});
test('rutes: escape i symlink rebutjats', t => {
  const root = fixture(t);
  assert.throws(() => segura(root, '../escape'));
  fs.symlinkSync(os.tmpdir(), path.join(root, 'alias'));
  assert.throws(() => segura(root, 'alias/file.md'));
});
test('protocols: local, lectures, desconegut, JSON corrupte', t => {
  const root = fixture(t);
  assert.deepEqual(resolProtocols('crear un prompt per a codex', [], root).map(r => r.id), ['prompt.local']);
  assert.throws(() => resolProtocols('xyzzy', [], root));
  const regPath = path.join(root, '.agents/protocolledge.json'), reg = JSON.parse(fs.readFileSync(regPath));
  reg.rutes.find(r => r.id === 'auditoria').lectures = ['.agents/ESTAT.md'];
  fs.writeFileSync(path.join(root, '.agents/ESTAT.md'), '# Estat de prova\n');
  fs.writeFileSync(regPath, JSON.stringify(reg));
  assert.ok(prepara('auditoria backend', [], root).fonts.some(s => s.ruta === '.agents/ESTAT.md'));
  fs.writeFileSync(regPath, '{'); assert.throws(() => prepara('auditoria', [], root));
});
test('arrancada: CLI no deixa rebut; preflight emet tot i verifica el mateix torn', t => {
  const root = fixture(t), payload = transcript(root);
  assert.equal(run(root, 'tooling/brain/matrix.mjs', ['--json', 'auditoria backend']).status, 0);
  assert.equal(fs.existsSync(path.join(root, '.agents/.matrix-rebuts')), false);
  assert.equal(verify(root, docCall(payload, root)).decision, 'deny');
  const p = run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify(payload));
  assert.equal(p.status, 0, p.stderr);
  assert.equal(JSON.parse(p.stdout).injectSteps[0].ephemeralMessage, prepara('auditoria backend', [], root).contingut);
  const allowed = verify(root, docCall(payload, root)); assert.equal(allowed.decision, 'allow', allowed.reason);
  assert.equal(verify(root, docCall({}, root)).decision, 'deny');
  assert.equal(verify(root, docCall(payload, root, '../fora.md')).decision, 'deny');
  assert.equal(verify(root, docCall(payload, root, '.agents/manifest.yaml')).decision, 'deny');
  assert.equal(verify(root, { ...payload, toolCall: { name: 'run_command', args: { command: 'node tooling/brain/crear_document.mjs' } } }).decision, 'ask');
});
test('rebut: fonts alterades, tasca distinta, data invàlida/futura/caducada', t => {
  const root = fixture(t), payload = transcript(root), identity = identitatTorn(payload);
  const context = prepara(identity.task, [], root), now = Date.now();
  const rec = desaEmissio(context, identity, [], root, now);
  const file = path.join(root, `.agents/.matrix-rebuts/${identity.torn}.json`);
  for (const date of ['invàlida', new Date(now+10000).toISOString(), new Date(now-31*60000).toISOString()]) {
    fs.writeFileSync(file, JSON.stringify({ ...rec, t: date }));
    assert.throws(() => verificaEmissio(payload, root, now));
  }
  fs.writeFileSync(file, JSON.stringify(rec)); assert.equal(verificaEmissio(payload, root, now).torn, identity.torn);
  const skill = path.join(root, '.agents/skills/skill-iaia-identitat/SKILL.md');
  fs.appendFileSync(skill, '\nCanvi posterior\n'); assert.throws(() => verificaEmissio(payload, root, now));
  fs.appendFileSync(payload.transcriptPath, JSON.stringify({ type: 'USER_INPUT', content: 'segona auditoria' })+'\n');
  assert.throws(() => verificaEmissio(payload, root, now));
});
test('un preflight fallit invalida el rebut anterior i no trunca el context', t => {
  const root = fixture(t), payload = transcript(root);
  const good = run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify(payload)); assert.equal(good.status, 0, good.stderr);
  const bad = run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify({ ...payload, matrixProtocols: ['absent'] }));
  assert.equal(bad.status, 1); assert.equal(bad.stdout, '');
  assert.equal(verify(root, docCall(payload, root)).decision, 'deny');
});
test('backend: reemplaçament íntegre, override, atomicitat, getters, lock i capacitats', async () => {
  const url = pathToFileURL(path.join(ROOT, 'src/data/backendPort.js')); url.search = '?test=' + Date.now();
  const p = await import(url.href);
  const full = () => Object.fromEntries(CONTRACTE_NUCLI.map(name => [name, () => name]));
  class Parent { getCurrentUser() { return 'pare'; } }
  class Child extends Parent { getCurrentUser() { return this.label; } }
  const child = Object.assign(new Child(), full(), { label: 'fill' }); delete child.getCurrentUser;
  p.setBackendImplementation(child); assert.equal(p.getCurrentUser(), 'fill');
  assert.ok(Object.isFrozen(p.getBackendImplementation()));
  assert.throws(() => p.setBackendImplementation({ getCurrentUser() {} })); assert.equal(p.getCurrentUser(), 'fill');
  const admin = { ...full(), ...Object.fromEntries(CAPACITATS.admin.map(name => [name, () => []])) };
  p.setBackendImplementation(admin); assert.equal(p.teCapacitat('admin'), true);
  p.setBackendImplementation(full()); assert.equal(p.teCapacitat('admin'), false);
  assert.throws(() => p.setBackendImplementation({ ...full(), adminListUsers() {} }));
  let read = false; const getter = full(); Object.defineProperty(getter, 'getCurrentUser', { get() { read = true; return () => {}; } });
  assert.throws(() => p.setBackendImplementation(getter)); assert.equal(read, false);
  p.freezeImplementation(); assert.throws(() => p.setBackendImplementation(full()));
  assert.equal(p.teCapacitat('__proto__'), false);
});
test('credencials: claus privades/malformades i URLs insegures rebutjades', () => {
  const jwt = role => 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({role})).toString('base64url') + '.c2ln';
  validatePublicCredentials('https://example.invalid', jwt('anon'));
  validatePublicCredentials('http://127.0.0.1:54321', 'sb_publishable_test');
  for (const key of ['sb_secret_test', jwt('service_role'), jwt('authenticated'), 'abc', 'a.b.c'])
    assert.throws(() => validatePublicCredentials('https://example.invalid', key));
  for (const url of ['ftp://localhost', 'http://remote.invalid', 'https://user:pass@example.invalid', 'https://example.invalid/path'])
    assert.throws(() => validatePublicCredentials(url, jwt('anon')));
});

async function isolated(rel, deps) {
  globalThis.__SDP_TEST_DEPS = deps;
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/^import .*;\r?\n/gm, '');
  return import('data:text/javascript;base64,' + Buffer.from(`const {${Object.keys(deps).join(',')}} = globalThis.__SDP_TEST_DEPS;\n${src}\n// ${Math.random()}`).toString('base64'));
}
test('transport: rebutja secrets abans de fetch i no seguix redireccions', async t => {
  const oldFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = oldFetch; delete globalThis.__SDP_TEST_DEPS; });
  let calls = 0, received;
  globalThis.fetch = async (url, options) => { calls++; received = options; return {ok:true, status:200, json:async()=>[]}; };
  const runtime = await isolated('src/data/supabase/runtime.js', {
    validatePublicCredentials, APP_SEED: {}, APP_SEED_VERSION: 1, getDefaultUserId: () => 'user',
    getEfimer: () => null, CLAU_JWT: 'jwt', usuariDeSessio: () => null, permetOrigenMitjans: () => {},
  });
  await assert.rejects(runtime.request('/rest/v1/notes', {supabaseUrl:'https://example.invalid',supabaseAnonKey:'sb_secret_test'}));
  assert.equal(calls, 0);
  await runtime.request('/rest/v1/towns', {supabaseUrl:'https://example.invalid/',supabaseAnonKey:'sb_publishable_test'});
  assert.equal(received.redirect, 'error'); assert.equal(calls, 1);
});
test('singleton: config fixada, clau diferent rebutjada i token renovat', async t => {
  t.after(() => { delete globalThis.__SDP_TEST_DEPS; });
  let jwt = null, creates = 0, removed = 0;
  const config = {supabaseUrl:'https://example.invalid',supabaseAnonKey:'sb_publishable_test'};
  const client = await isolated('src/data/supabase/config.js', {
    createClient: () => { creates++; return { removeAllChannels: async () => { removed++; }, realtime: {setAuth: async () => {}} }; },
    getResolvedConfig: c => ({...c, hasSupabaseConfig: !!(c.supabaseUrl && c.supabaseAnonKey)}),
    getEfimer: () => jwt, CLAU_JWT: 'jwt',
  });
  const first = await client.getClient(config); assert.equal(await client.getClient(), first);
  await assert.rejects(client.getClient({...config,supabaseAnonKey:'sb_publishable_other'}));
  assert.equal(creates, 1); jwt = 'new-token';
  assert.notEqual(await client.getClient(), first); assert.equal(creates, 2); assert.ok(removed);
});
test('storage: poble explícit, carpetes validades i prefix coherent amb RLS', async t => {
  t.after(() => { delete globalThis.__SDP_TEST_DEPS; });
  const uid = '11111111-1111-1111-1111-111111111111', tenant = '22222222-2222-2222-2222-222222222222';
  let sent;
  const storage = await isolated('src/data/supabase/storage.js', {
    getResolvedConfig: c => c, usuariDeSessio: () => ({id:uid}), handleError: e => e,
    getClient: async () => ({storage:{from:bucket=>({upload:async (name, data, options)=>{sent={bucket,name,options};return {error:null};}})}}),
  });
  const blob = new Blob(['x'], {type:'image/png'});
  await assert.rejects(storage.uploadToStorage(blob, {carpeta:'notes'}));
  await assert.rejects(storage.uploadToStorage(blob, {carpeta:'../notes',tenantId:tenant}));
  const result = await storage.uploadToStorage(blob, {carpeta:'notes'}, {tenantId:tenant});
  assert.equal(sent.bucket, 'mitjans_privats'); assert.ok(sent.name.startsWith(`${tenant}/${uid}/notes/`));
  assert.equal(sent.options.upsert, false); assert.ok(result.url.startsWith('sdp-media://mitjans_privats/'));
});
test('dos cicles d’arrancada i tancament no recreen espills; SCC aïllat', t => {
  const root = fixture(t), payload = transcript(root);
  // Aïlla la resta d’auditories: esta prova és del cablejat del tancament.
  for (const rel of ['tooling/gates/tancament.mjs', 'tooling/brain/cataleg_skills.mjs',
    'tooling/wiki/lib/frontmatter.mjs', 'tooling/lib/arrel.mjs']) {
    const dst = path.join(root, rel); fs.mkdirSync(path.dirname(dst), {recursive:true}); fs.copyFileSync(path.join(ROOT,rel),dst);
  }
  fs.writeFileSync(path.join(root,'tooling/gates/verificador-scc.mjs'), 'export class VerificadorSCC { async runAudits() { return {valid:true,errors:[]}; } }');
  for (let n=0;n<2;n++) {
    assert.equal(run(root, '.agents/hooks/preflight_matrix_wrapper.mjs', [], JSON.stringify(payload)).status, 0);
    const close = spawnSync(process.execPath,[path.join(root,'tooling/gates/tancament.mjs'),'--json'], {cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8'});
    assert.equal(close.status,0,close.stderr);assert.equal(JSON.parse(close.stdout).valid,true);
    assert.equal(comprovaCataleg(root).ok,true);
    assert.equal(fs.existsSync(path.join(root,'_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR')),false);
    assert.equal(fs.existsSync(path.join(root,'_wiki_de_poble/02_saber/skills_mirror')),false);
  }
});
test('quarantena: conserva contingut, és idempotent i rebutja symlinks', t => {
  const root = fixture(t), rel = '_wiki_de_poble/01_ser/00_AGENTS_I_SKILLS_MIRROR';
  const src = path.join(root, rel); fs.mkdirSync(src, {recursive:true});fs.writeFileSync(path.join(src,'manual.md'),'contingut humà');
  assert.equal(run(root,'tooling/brain/quarantena_espills.mjs').status,0);assert.ok(fs.existsSync(src));
  assert.equal(run(root,'tooling/brain/quarantena_espills.mjs',['--aplica']).status,0);
  assert.equal(fs.existsSync(src),false);
  assert.equal(fs.readFileSync(path.join(root,`.brain-trash/260920_consolidacio/${rel}/manual.md`),'utf8'),'contingut humà');
  assert.equal(run(root,'tooling/brain/quarantena_espills.mjs',['--aplica']).status,0);
  fs.symlinkSync(path.join(root,'.agents'),src);
  assert.notEqual(run(root,'tooling/brain/quarantena_espills.mjs',['--aplica']).status,0);
  assert.ok(fs.existsSync(path.join(root,'.agents/AGENTS.md')));
});