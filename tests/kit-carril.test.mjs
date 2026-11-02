import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { generateKit, applyKit, validatePath, requiresFrontissa, SCHEMA } from '../tooling/gates/kit-carril.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = path.join(ROOT, 'tooling/gates/kit-carril.mjs');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const put = (root, relative, value) => {
  fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
  fs.writeFileSync(path.join(root, relative), value);
};
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-kit-test-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = Object.fromEntries(['source', 'candidate', 'target'].map(key => {
    const value = path.join(root, key); fs.mkdirSync(value); return [key, value];
  }));
  return { root, ...result, kit: path.join(root, 'kit') };
}
function seed(f, files) {
  for (const [name, content] of Object.entries(files)) for (const root of [f.source, f.candidate, f.target]) put(root, name, content);
}
function generate(f, paths, preconditions = []) {
  return generateKit({ sourceRoot: f.source, candidateRoot: f.candidate, kitRoot: f.kit, name: 'fixture', paths, preconditions });
}
const apply = (f, write = false) => applyKit({ kitRoot: f.kit, targetRoot: f.target, write });
function rewriteManifest(f, edit) {
  const manifest = JSON.parse(fs.readFileSync(path.join(f.kit, 'manifest.json')));
  edit(manifest);
  const text = `${JSON.stringify(manifest, null, 2)}\n`;
  put(f.kit, 'manifest.json', text);
  put(f.kit, 'manifest.sha256', `${digest(text)}  manifest.json\n`);
}
function clean(f) {
  assert.equal(fs.existsSync(path.join(f.target, '.kit-carril.lock')), false);
  assert.deepEqual(fs.readdirSync(f.target).filter(name => name.startsWith('.kit-carril-stage-')), []);
}

function frontissaFixture(f) {
  for (const root of [f.source, f.candidate, f.target]) {
    put(root, 'package.json', '{"type":"module"}\n');
    put(root, '.agents/AGENTS.md', 'fixture\n');
    const page = { html: '<p>Protegit</p>', title: 'Poble' };
    put(root, 'src/sections/text/pageContent.js', `export const PAGE_COPY = { poble: ${JSON.stringify(page)} };\n`);
    put(root, 'src/config/systemPages.js', 'export const SYSTEM_PAGES=[{key:"poble"}]; export const COVER_PAGE_KEYS={};\n');
    put(root, 'src/config/sections.js', 'export const SECTIONS = [];\n');
    put(root, '.agents/contingut_estructural.json', JSON.stringify({ schema: 'sdp.contingut.v1', claus: {
      poble: { sha256: digest(JSON.stringify(page)), html: page.html.length, aprovat_per: 'fixture', data: '2026-11-02' }
    } }));
    for (const name of ['tooling/gates/frontissa-contingut.mjs', 'tooling/lib/arrel.mjs']) put(root, name, fs.readFileSync(path.join(ROOT, name)));
  }
}

test('genera el contracte canònic amb hashes, preimatges, modes i sortida determinista', t => {
  const f = fixture(t); seed(f, { 'docs/a.txt': 'abans\n' });
  put(f.candidate, 'docs/a.txt', 'després\n');
  const manifest = generate(f, ['docs/a.txt']);
  assert.equal(manifest.schema, SCHEMA);
  assert.equal(manifest.files[0].source_sha256, digest('abans\n'));
  assert.equal(manifest.files[0].target_sha256, digest('després\n'));
  assert.equal(fs.readFileSync(path.join(f.kit, 'preimages/docs/a.txt'), 'utf8'), 'abans\n');
  assert.equal(fs.readFileSync(path.join(f.kit, 'payload/docs/a.txt'), 'utf8'), 'després\n');
  const second = path.join(f.root, 'second');
  generateKit({ sourceRoot: f.source, candidateRoot: f.candidate, kitRoot: second, name: 'fixture', paths: ['docs/a.txt'] });
  assert.equal(fs.readFileSync(path.join(second, 'manifest.sha256'), 'utf8'), fs.readFileSync(path.join(f.kit, 'manifest.sha256'), 'utf8'));
  assert.throws(() => generate(f, ['docs/a.txt']), /ja existix/);
});

test('check no escriu; apply modifica, crea i retira; repetir apply falla CAS per defecte', t => {
  const f = fixture(t); seed(f, { 'docs/a': 'A', 'docs/retira': 'R' });
  put(f.candidate, 'docs/a', 'B'); put(f.candidate, 'new/nested/b', 'N'); fs.unlinkSync(path.join(f.candidate, 'docs/retira'));
  generate(f, ['docs/a', 'docs/retira', 'new/nested/b']);
  assert.equal(apply(f).applied, false);
  assert.equal(fs.readFileSync(path.join(f.target, 'docs/a'), 'utf8'), 'A');
  assert.equal(fs.existsSync(path.join(f.target, 'new')), false);
  const report = apply(f, true);
  assert.equal(report.applied, true); assert.equal(report.files, 3);
  assert.equal(fs.readFileSync(path.join(f.target, 'docs/a'), 'utf8'), 'B');
  assert.equal(fs.readFileSync(path.join(f.target, 'new/nested/b'), 'utf8'), 'N');
  assert.equal(fs.existsSync(path.join(f.target, 'docs/retira')), false);
  assert.throws(() => apply(f, true), /CAS divergent/);
  clean(f);
});

test('CAS null significa absència i no admet un fitxer existent amb bytes iguals al payload', t => {
  const f = fixture(t); put(f.candidate, 'new', 'N'); generate(f, ['new']); put(f.target, 'new', 'N');
  assert.throws(() => apply(f, true), /CAS divergent/); clean(f);
});

test('un CAS divergent al segon fitxer impedix qualsevol escriptura del primer', t => {
  const f = fixture(t); seed(f, { a: 'A', b: 'B' }); put(f.candidate, 'a', 'AA'); put(f.candidate, 'b', 'BB');
  generate(f, ['a', 'b']); put(f.target, 'b', 'edicio aliena');
  assert.throws(() => apply(f, true), /CAS divergent: b/);
  assert.equal(fs.readFileSync(path.join(f.target, 'a'), 'utf8'), 'A'); clean(f);
});

test('precondicions CAS de dependències són obligatòries i no modificables pel kit', t => {
  const f = fixture(t); seed(f, { a: 'A', dependency: 'D' }); put(f.candidate, 'a', 'AA');
  generate(f, ['a'], ['dependency']); put(f.target, 'dependency', 'canvi');
  assert.throws(() => apply(f, true), /CAS divergent: dependency/); clean(f);
  const g = fixture(t); seed(g, { a: 'A' }); put(g.candidate, 'a', 'AA');
  assert.throws(() => generate(g, ['a'], ['a']), /Precondició modificada/);
});

test('corrupció del payload, preimatge i manifest falla abans d’escriure', t => {
  for (const corrupted of ['payload/a', 'preimages/a', 'manifest.json']) {
    const f = fixture(t); seed(f, { a: 'A' }); put(f.candidate, 'a', 'AA'); generate(f, ['a']); put(f.kit, corrupted, 'corrupte');
    assert.throws(() => apply(f, true), /divergent/);
    assert.equal(fs.readFileSync(path.join(f.target, 'a'), 'utf8'), 'A'); clean(f);
  }
});

test('hash de font omés o invàlid no es convertix en CAS permissiu encara que es recalculen hashes', t => {
  for (const value of [undefined, '', true, 'A'.repeat(64), 'z'.repeat(64)]) {
    const f = fixture(t); seed(f, { a: 'A' }); put(f.candidate, 'a', 'AA'); generate(f, ['a']);
    rewriteManifest(f, manifest => { if (value === undefined) delete manifest.files[0].source_sha256; else manifest.files[0].source_sha256 = value; });
    assert.throws(() => apply(f, true), /Hash o mode invàlid/); clean(f);
  }
});

test('rebutja traversal, àlies Windows/macOS, secrets i noms de control', () => {
  for (const name of ['../out', '/out', 'x//a', 'x/./a', 'x/../a', 'a\\b', 'x\u0000a', 'x\u202ea', 'a ', 'a.', 'C:/x', 'CON.txt', '.git/config', '.GIT/config', 'node_modules/x', '.env.local', 'e\u0301.txt']) {
    assert.throws(() => validatePath(name), /Ruta relativa invàlida|Segment de ruta prohibit/, name);
  }
  assert.equal(validatePath('docs/poble_2.md'), 'docs/poble_2.md');
});

test('rebutja rutes duplicades i solapades abans de generar', t => {
  const f = fixture(t); seed(f, { a: 'A' }); put(f.candidate, 'a', 'AA');
  assert.throws(() => generate(f, ['a', 'A']), /duplicada/);
  assert.throws(() => generate(f, ['a', 'a/b']), /solapades/);
  assert.throws(() => generate(f, ['absent']), /absent als dos arbres/);
  assert.throws(() => generateKit({sourceRoot:f.source,candidateRoot:f.candidate,kitRoot:path.join(f.source,'kit'),name:'bad',paths:['a']}), /fora dels arbres/);
});

test('un manifest maliciós amb ruta duplicada, traversal o solapament falla tancat', t => {
  for (const attack of ['duplicate', 'traversal', 'overlap']) {
    const f = fixture(t); seed(f, { a: 'A' }); put(f.candidate, 'a', 'AA'); generate(f, ['a']);
    rewriteManifest(f, manifest => {
      if (attack === 'duplicate') manifest.files.push({...manifest.files[0]});
      if (attack === 'traversal') manifest.files[0].path = '../outside';
      if (attack === 'overlap') manifest.files.push({...manifest.files[0], path:'a/b'});
    });
    assert.throws(() => apply(f, true), /duplicada|prohibit|solapades/); clean(f);
  }
});

test('no seguix symlinks del font, candidat, payload o arbre destí, inclús si són trencats', t => {
  for (const location of ['source', 'candidate', 'target', 'payload']) {
    const f = fixture(t); seed(f, { a: 'A' }); put(f.candidate, 'a', 'AA');
    if (location === 'source' || location === 'candidate') {
      fs.unlinkSync(path.join(f[location], 'a')); fs.symlinkSync(path.join(f.root, 'absent'), path.join(f[location], 'a'));
      assert.throws(() => generate(f, ['a']), /Symlink prohibit/);
    } else {
      generate(f, ['a']); const base = location === 'payload' ? path.join(f.kit,'payload') : f.target;
      fs.unlinkSync(path.join(base, 'a')); fs.symlinkSync(path.join(f.root, 'absent'), path.join(base, 'a'));
      assert.throws(() => apply(f, true), /Symlink prohibit/); clean(f);
    }
  }
});

test('rebutja symlinks de pare i hardlinks sense tocar el destí exterior', t => {
  const f = fixture(t); put(f.candidate, 'new/a', 'A'); generate(f, ['new/a']);
  const external = path.join(f.root, 'external'); fs.mkdirSync(external); fs.symlinkSync(external, path.join(f.target, 'new'));
  assert.throws(() => apply(f, true), /Symlink prohibit/); assert.deepEqual(fs.readdirSync(external), []); clean(f);
  const g = fixture(t); seed(g, { a: 'A' }); put(g.candidate, 'a', 'AA'); generate(g, ['a']);
  fs.linkSync(path.join(g.target,'a'),path.join(g.root,'hardlink'));
  assert.throws(() => apply(g, true), /hardlink/); clean(g);
});

test('els modes es verifiquen per CAS i es preserven en payload, aplicació i retirada', t => {
  const f = fixture(t); seed(f, { executable: 'script' }); fs.chmodSync(path.join(f.candidate, 'executable'), 0o755); generate(f, ['executable']);
  apply(f, true); assert.equal(fs.statSync(path.join(f.target,'executable')).mode & 0o777, 0o755); clean(f);
  const g = fixture(t); seed(g, { a: 'A' }); put(g.candidate, 'a', 'AA'); generate(g, ['a']); fs.chmodSync(path.join(g.target,'a'),0o600);
  assert.throws(() => apply(g, true), /CAS divergent/); clean(g);
});

test('un lock alié bloqueja l’aplicació i es conserva; check continua sent només lectura', t => {
  const f = fixture(t); seed(f, { a: 'A' }); put(f.candidate, 'a', 'AA'); generate(f, ['a']); put(f.target,'.kit-carril.lock','alié');
  assert.throws(() => apply(f, true), /bloquejat/);
  assert.equal(fs.readFileSync(path.join(f.target,'.kit-carril.lock'),'utf8'),'alié');
  assert.equal(apply(f).applied, false);
});

test('una fallada capturable a mig commit restaura bytes, modes i carpetes noves', t => {
  const f = fixture(t); seed(f, { a: 'A', c: 'C' }); put(f.candidate, 'a', 'AA'); put(f.candidate, 'b/new','N'); put(f.candidate, 'c','CC');
  generate(f, ['a','b/new','c']);
  const rename = fs.renameSync;
  fs.renameSync = (from,to) => { if (to === path.join(f.target,'c') && from.includes(`${path.sep}new${path.sep}`)) throw new Error('fixture EIO'); return rename(from,to); };
  try { assert.throws(() => apply(f,true), /fixture EIO/); } finally { fs.renameSync = rename; }
  assert.equal(fs.readFileSync(path.join(f.target,'a'),'utf8'),'A');
  assert.equal(fs.existsSync(path.join(f.target,'b')),false);
  assert.equal(fs.readFileSync(path.join(f.target,'c'),'utf8'),'C'); clean(f);
});

test('una retirada prèvia també es restaura si el rename següent falla', t => {
  const f = fixture(t); seed(f,{a:'A',b:'B'}); fs.unlinkSync(path.join(f.candidate,'a')); put(f.candidate,'b','BB'); generate(f,['a','b']);
  const rename = fs.renameSync; fs.renameSync = (from,to) => { if(to===path.join(f.target,'b')&&from.includes(`${path.sep}new${path.sep}`)) throw new Error('fixture EIO');return rename(from,to); };
  try { assert.throws(()=>apply(f,true),/fixture EIO/); } finally {fs.renameSync=rename;}
  assert.equal(fs.readFileSync(path.join(f.target,'a'),'utf8'),'A'); clean(f);
});

test('canvi alié després del staging força CAS i rollback del fitxer anterior', t => {
  const f = fixture(t); seed(f,{a:'A',b:'B'}); put(f.candidate,'a','AA'); put(f.candidate,'b','BB'); generate(f,['a','b']);
  const rename=fs.renameSync; fs.renameSync=(from,to)=>{const result=rename(from,to);if(to===path.join(f.target,'a')&&from.includes(`${path.sep}new${path.sep}`))put(f.target,'b','edicio aliena');return result;};
  try { assert.throws(()=>apply(f,true),/CAS divergent abans del rename: b/); } finally {fs.renameSync=rename;}
  assert.equal(fs.readFileSync(path.join(f.target,'a'),'utf8'),'A'); assert.equal(fs.readFileSync(path.join(f.target,'b'),'utf8'),'edicio aliena'); clean(f);
});

test('frontissa detecta fonts i dependències, inclosos el registre i la porta', () => {
  for (const name of ['src/sections/text/legalContent.js','src/sections/text/pageContent.js','src/config/systemPages.js','src/config/sections.js','.agents/contingut_estructural.json','tooling/gates/frontissa-contingut.mjs','tooling/lib/arrel.mjs']) assert.equal(requiresFrontissa([name]),true,name);
  assert.equal(requiresFrontissa(['docs/a.md']),false);
});

test('frontissa real valida un candidat íntegre abans d’escriure', t => {
  const f=fixture(t); frontissaFixture(f);
  const name='src/sections/text/pageContent.js'; put(f.candidate,name,fs.readFileSync(path.join(f.candidate,name),'utf8')+'// canvi sense retall\n');generate(f,[name]);
  const report=apply(f); assert.equal(report.frontissa.ran,true); assert.equal(report.frontissa.report.correctes,1);
  assert.equal(apply(f,true).frontissa.report.valid,true); clean(f);
});

test('frontissa bloqueja el retall en staging i no deixa cap canvi parcial', t => {
  const f=fixture(t);frontissaFixture(f);seed(f,{a:'A'});put(f.candidate,'a','AA');
  put(f.candidate,'src/sections/text/pageContent.js','export const PAGE_COPY={};\n');generate(f,['a','src/sections/text/pageContent.js']);
  assert.throws(()=>apply(f,true),/Frontissa rebutja/);
  assert.equal(fs.readFileSync(path.join(f.target,'a'),'utf8'),'A');clean(f);
});

test('un kit que desactiva la porta no pot ser el seu propi àrbitre', t => {
  const f=fixture(t);frontissaFixture(f);
  put(f.candidate,'src/sections/text/pageContent.js','export const PAGE_COPY={};\n');
  put(f.candidate,'tooling/gates/frontissa-contingut.mjs','console.log(JSON.stringify({valid:true}));\n');
  generate(f,['src/sections/text/pageContent.js','tooling/gates/frontissa-contingut.mjs']);
  assert.throws(()=>apply(f,true),/Frontissa rebutja/);clean(f);
});

test('registre absent, gate absent i symlink en dependència fallen tancats', t => {
  for (const missing of ['.agents/contingut_estructural.json','tooling/gates/frontissa-contingut.mjs','symlink']) {
    const f=fixture(t);frontissaFixture(f);put(f.candidate,'src/new.js','export const newValue=1;\n');generate(f,['src/new.js']);
    if(missing==='symlink')fs.symlinkSync('/outside',path.join(f.target,'src/linked.js'));
    else fs.unlinkSync(path.join(f.target,missing));
    assert.throws(()=>apply(f,true),/Falta|Symlink/);clean(f);
  }
});

test('CLI genera, comprova i aplica; no té bypass --force ni opcions ambigües', t => {
  const f=fixture(t);seed(f,{a:'A'});put(f.candidate,'a','AA');
  const run=args=>spawnSync(process.execPath,[CLI,...args],{encoding:'utf8'});
  const create=run(['create','--source',f.source,'--candidate',f.candidate,'--kit',f.kit,'--name','fixture','--path','a']);
  assert.equal(create.status,0,create.stderr);assert.equal(JSON.parse(create.stdout).schema,SCHEMA);
  const check=run(['check','--kit',f.kit,'--target',f.target]);assert.equal(check.status,0,check.stderr);assert.equal(JSON.parse(check.stdout).applied,false);
  const applied=run(['apply','--kit',f.kit,'--target',f.target]);assert.equal(applied.status,0,applied.stderr);
  assert.notEqual(run(['apply','--kit',f.kit,'--target',f.target,'--force','yes']).status,0);
  assert.notEqual(run(['check','--kit',f.kit,'--kit',f.kit,'--target',f.target]).status,0);
  assert.notEqual(run(['check','--kit']).status,0);clean(f);
});


test('un EIO en escriure el lock tanca descriptor i retira el seu lock', t => {
  const f=fixture(t);seed(f,{a:'A'});put(f.candidate,'a','AA');generate(f,['a']);
  const write=fs.writeFileSync;const close=fs.closeSync;let lockedFd;let closed=false;
  fs.writeFileSync=(fd,...args)=>{if(typeof fd==='number'){lockedFd=fd;throw new Error('fixture lock EIO');}return write(fd,...args);};
  fs.closeSync=fd=>{if(fd===lockedFd)closed=true;return close(fd);};
  try{assert.throws(()=>apply(f,true),/fixture lock EIO/);}finally{fs.writeFileSync=write;fs.closeSync=close;}
  assert.equal(closed,true);assert.equal(fs.readFileSync(path.join(f.target,'a'),'utf8'),'A');clean(f);
});

test('una precondició canviada durant el commit força rollback i conserva el canvi alié',t=>{
  const f=fixture(t);seed(f,{a:'A',dependency:'D'});put(f.candidate,'a','AA');generate(f,['a'],['dependency']);
  const rename=fs.renameSync;fs.renameSync=(from,to)=>{const result=rename(from,to);if(to===path.join(f.target,'a')&&from.includes(`${path.sep}new${path.sep}`))put(f.target,'dependency','concurrent');return result;};
  try{assert.throws(()=>apply(f,true),/CAS divergent: dependency/);}finally{fs.renameSync=rename;}
  assert.equal(fs.readFileSync(path.join(f.target,'a'),'utf8'),'A');assert.equal(fs.readFileSync(path.join(f.target,'dependency'),'utf8'),'concurrent');clean(f);
});

test('no retira un lock substituït per un altre inode durant el commit',t=>{
  const f=fixture(t);seed(f,{a:'A'});put(f.candidate,'a','AA');generate(f,['a']);
  const rename=fs.renameSync;fs.renameSync=(from,to)=>{const result=rename(from,to);if(to===path.join(f.target,'a')&&from.includes(`${path.sep}new${path.sep}`)){fs.unlinkSync(path.join(f.target,'.kit-carril.lock'));put(f.target,'.kit-carril.lock','lock alié');}return result;};
  try{assert.equal(apply(f,true).applied,true);}finally{fs.renameSync=rename;}
  assert.equal(fs.readFileSync(path.join(f.target,'.kit-carril.lock'),'utf8'),'lock alié');
});


test('una fallada de neteja del staging no deixa lock ni descriptor obert',t=>{
  const f=fixture(t);seed(f,{a:'A'});put(f.candidate,'a','AA');generate(f,['a']);
  const rm=fs.rmSync;const close=fs.closeSync;let closed=false;let cleanupPath;
  fs.rmSync=(name,...args)=>{if(name.startsWith(path.join(f.target,'.kit-carril-stage-'))){cleanupPath=name;throw new Error('fixture cleanup EIO');}return rm(name,...args);};
  fs.closeSync=fd=>{closed=true;return close(fd);};
  try{assert.throws(()=>apply(f,true),/fixture cleanup EIO/);}finally{fs.rmSync=rm;fs.closeSync=close;}
  assert.equal(closed,true);assert.equal(fs.existsSync(path.join(f.target,'.kit-carril.lock')),false);
  assert.equal(fs.readFileSync(path.join(f.target,'a'),'utf8'),'AA');rm(cleanupPath,{recursive:true,force:true});clean(f);
});


test('generació exigix les mateixes dependències al font i al candidat que s’ha provat',t=>{
  for(const change of ['bytes','mode','absent','created']){
    const f=fixture(t);seed(f,{a:'A',dependency:'D'});put(f.candidate,'a','AA');
    if(change==='bytes')put(f.candidate,'dependency','candidate-v2');
    if(change==='mode')fs.chmodSync(path.join(f.candidate,'dependency'),0o755);
    if(change==='absent')fs.unlinkSync(path.join(f.candidate,'dependency'));
    if(change==='created')fs.unlinkSync(path.join(f.source,'dependency'));
    assert.throws(()=>generate(f,['a'],['dependency']),/Precondició divergent al candidat: dependency/);
    assert.equal(fs.existsSync(f.kit),false);
  }
});

test('CLI invocada per un symlink executa main i no retorna un fals verd buit',t=>{
  const f=fixture(t);seed(f,{a:'A'});put(f.candidate,'a','AA');
  const alias=path.join(f.root,'kit-carril-alias.mjs');fs.symlinkSync(CLI,alias);
  const create=spawnSync(process.execPath,[alias,'create','--source',f.source,'--candidate',f.candidate,'--kit',f.kit,'--name','alias','--path','a'],{encoding:'utf8'});
  assert.equal(create.status,0,create.stderr);assert.equal(JSON.parse(create.stdout).schema,SCHEMA);assert.equal(fs.existsSync(f.kit),true);
  const check=spawnSync(process.execPath,[alias,'check','--kit',f.kit,'--target',f.target],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);assert.equal(JSON.parse(check.stdout).valid,true);
  const missing=spawnSync(process.execPath,[alias,'check','--kit',f.kit],{encoding:'utf8'});
  assert.notEqual(missing.status,0);
});
