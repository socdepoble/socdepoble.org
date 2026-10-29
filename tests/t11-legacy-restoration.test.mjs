import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const LEGACY=path.join(ROOT,'tooling/scripts/desenterrar.mjs');
const CANONICAL='tooling/brain/desenterrar.mjs';
function fixture(t){
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-legacy-restoration-')),cwd=path.join(parent,'workspace with spaces'),bin=path.join(parent,'bin'),marker=path.join(parent,'git-called');
 fs.mkdirSync(cwd);fs.mkdirSync(bin);fs.writeFileSync(path.join(cwd,'sentinel.txt'),'current fixture bytes\n');
 // A synthetic Git process only records its invocation; it never reads Git or restores files.
 fs.writeFileSync(path.join(bin,'git'),`#!${process.execPath}\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'called');process.exit(1);\n`,{mode:0o755});
 t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));return{cwd,marker,env:{...process.env,PATH:bin}};
}
for(const args of [[],['--ancores'],['--ref','HEAD','--fitxer','sentinel.txt'],['--ref','HEAD','--fitxer','sentinel.txt','--segell','0'.repeat(64)],['--help','--segell','0'.repeat(64)]]){
 test('legacy route refuses ordinary request: '+JSON.stringify(args),t=>{
  const f=fixture(t),r=spawnSync(process.execPath,[LEGACY,...args],{cwd:f.cwd,env:f.env,encoding:'utf8',timeout:5000});
  assert.equal(r.status,2,r.stdout+r.stderr);assert.match(r.stderr,new RegExp(CANONICAL.replaceAll('.','\\.')));assert.match(r.stderr,/retirada/i);
  assert.equal(fs.existsSync(f.marker),false,'retired CLI invoked synthetic Git');assert.equal(fs.readFileSync(path.join(f.cwd,'sentinel.txt'),'utf8'),'current fixture bytes\n');assert.deepEqual(fs.readdirSync(f.cwd),['sentinel.txt']);
 });
}
for(const flag of ['--help','-h'])test('help diagnoses retirement without mutation: '+flag,t=>{
 const f=fixture(t),r=spawnSync(process.execPath,[LEGACY,flag],{cwd:f.cwd,env:f.env,encoding:'utf8',timeout:5000});assert.equal(r.status,0,r.stdout+r.stderr);assert.match(r.stdout,/tooling\/brain\/desenterrar\.mjs/);assert.equal(r.stderr,'');assert.equal(fs.existsSync(f.marker),false);assert.deepEqual(fs.readdirSync(f.cwd),['sentinel.txt']);
});
test('import is inert and exports only the migration destination',t=>{
 const f=fixture(t),url=pathToFileURL(LEGACY).href,r=spawnSync(process.execPath,['--input-type=module','-e',`const m=await import(${JSON.stringify(url)});process.stdout.write(JSON.stringify(Object.keys(m)));`],{cwd:f.cwd,env:f.env,encoding:'utf8',timeout:5000});
 assert.equal(r.status,0,r.stdout+r.stderr);assert.deepEqual(JSON.parse(r.stdout),['CANONICAL_CLI']);assert.equal(r.stderr,'');assert.equal(fs.existsSync(f.marker),false);assert.deepEqual(fs.readdirSync(f.cwd),['sentinel.txt']);
});

test('retired CLI invoked through a symlink still refuses with a diagnosis',t=>{
 const f=fixture(t),alias=path.join(f.cwd,'legacy-alias.mjs');fs.symlinkSync(LEGACY,alias);
 const r=spawnSync(process.execPath,[alias,'--ref','HEAD','--fitxer','sentinel.txt'],{cwd:f.cwd,env:f.env,encoding:'utf8',timeout:5000});
 assert.equal(r.status,2,r.stdout+r.stderr);assert.match(r.stderr,/retirada/i);assert.equal(fs.existsSync(f.marker),false);assert.equal(fs.readFileSync(path.join(f.cwd,'sentinel.txt'),'utf8'),'current fixture bytes\n');
});
