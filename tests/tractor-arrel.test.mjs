import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const put=(root,file,content)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content);};
function fixture(t){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-arrel-test-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.symlinkSync(path.join(REPO,'node_modules'),path.join(root,'node_modules'),'dir');
 for(const file of ['tooling/gates/tractor-arrel.mjs','tooling/lib/arrel.mjs']) put(root,file,fs.readFileSync(path.join(REPO,file),'utf8'));
 put(root,'.agents/AGENTS.md','# Fixture');put(root,'package.json','{"type":"module","scripts":{}}');
 return root;
}
function audit(root){
 const run=spawnSync(process.execPath,[path.join(root,'tooling/gates/tractor-arrel.mjs'),'--json'],{cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8'});
 assert.ok([0,1].includes(run.status),run.stderr);return JSON.parse(run.stdout);
}
test('reconeix CLI amb esMain del custodi i CLI top-level try, sense acceptar funció mai invocada',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/guarded.mjs',"import {esMain} from '../lib/arrel.mjs';\nif(esMain(import.meta.url)){console.log('checked');}\n");
 put(root,'tooling/gates/top-level.mjs',"try {\n  console.log('checked');\n} catch(e){process.exitCode=1;}\n");
 assert.equal(audit(root).ok,true);
 put(root,'tooling/gates/dead.mjs','export function main(){return true;}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('/dead.mjs')));
 put(root,'tooling/gates/dead.mjs','// if(esMain(import.meta.url)) main();\nexport function main(){return true;}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('/dead.mjs')));
 put(root,'tooling/gates/dead.mjs','const esMain=()=>false;\nif(esMain(import.meta.url)){console.log("never");}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('/dead.mjs')));
});
test('biblioteca declarada necessita exports/consumidor i deixa de ser biblioteca si script l’invoca',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/mutation-policy.mjs','export function mutationPath(){}\nexport function knownRead(){}\n');
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'));
 put(root,'tooling/gates/hooks-local.mjs',"import {mutationPath, knownRead} from './mutation-policy.mjs';\nconsole.log(mutationPath, knownRead);\nprocess.exit(0);\n");
 assert.equal(audit(root).ok,true);
 put(root,'package.json',JSON.stringify({type:'module',scripts:{bad:'node tooling/gates/mutation-policy.mjs'}}));
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith('mutation-policy.mjs')));
});
test('pending transitori no exigix crear bloqueig; configuració persistent absent continua roja',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/check.mjs',"const pending='.agents/runtime/mutation.pending.json';\nconsole.log(pending);\nprocess.exit(0);\n");
 assert.equal(audit(root).ok,true);
 put(root,'tooling/gates/check.mjs',"const required='.agents/runtime/required-config.json';\nconsole.log(required);\nprocess.exit(0);\n");
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A5'));
});
test('CLI reconegut amb comparació d’identitat invertida i guarda calculada',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/reversed.mjs',"import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';\nexport function main(){return 0;}\nif(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=main();\n");
 put(root,'tooling/gates/computed.mjs',"import fs from 'node:fs';import {fileURLToPath} from 'node:url';\nexport function main(){return 0;}\nlet entryPoint=false;try{entryPoint=Boolean(process.argv[1])&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url));}catch{}\nif(entryPoint)process.exitCode=await main();\n");
 assert.equal(audit(root).ok,true);
});
test('A4 no acredita crides o guardes escrites dins de literals ni funcions sense executar',t=>{
 const root=fixture(t);
 for(const [name,source]of Object.entries({string:"const fixture = 'import.meta.url === fileURLToPath(process.argv[1]); main();';",template:'const fixture = `process.exit(0);`; ',nested:'export function never(){\nprocess.exit(0);\n}',fake:'const esMain=()=>false; if(esMain(import.meta.url)){main();}',empty:'if(process.argv[1]&&import.meta.url===process.argv[1]){}'})){
  put(root,`tooling/gates/${name}.mjs`,source);
  assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith(`/${name}.mjs`)),name);
 }
});
test('A4 les biblioteques noves no hereten excepcions de lib ni fixtures',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/lib/future.mjs','export const helper=1;');
 put(root,'tooling/gates/fixtures/future.mjs','export const fixture=1;');
 const report=audit(root);
 for(const name of ['lib/future.mjs','fixtures/future.mjs']) assert.ok(report.infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith(name)));
});
test('A5 TORN_ACTIU és marcador opcional només del consumidor Frontissa conegut',t=>{
 const root=fixture(t);
 put(root,'tooling/gates/frontissa-contingut.mjs',"const legacy = '.agents/TORN_ACTIU.json'; process.exit(0);\n");
 assert.equal(audit(root).ok,true);
 put(root,'tooling/gates/other.mjs',"const required = '.agents/TORN_ACTIU.json'; process.exit(0);\n");
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A5'&&x.fitxer.endsWith('/other.mjs')));
});
test('A4 els set nous rols no-CLI requerixen consumidor exacte i mai són ordres npm',t=>{
 const root=fixture(t);
 const pairs=[
  ['tooling/gates/zero-ia-endpoints.mjs','tooling/gates/tractor-zero-dependencia-ia.mjs'],
  ['tooling/gates/lib/cataleg-unanimitat.mjs','tooling/gates/verifica-alergens-unanimitat.mjs'],
  ['tooling/gates/lib/r3254-migracio132.mjs','tooling/gates/prepara-migracio132-r3254.mjs'],
  ['tooling/gates/lib/radiografia-local.mjs','tooling/gates/verifica-radiografia-supabase-viu.mjs'],
  ['tooling/gates/lib/radiografia-snapshot.mjs','tooling/gates/verifica-radiografia-supabase-viu.mjs'],
  ['tooling/gates/fixtures/zero-ia.vitest.config.mjs','tooling/gates/tractor-zero-dependencia-ia.test.mjs'],
  ['tooling/gates/fixtures/zero-ia-outage.mjs','tooling/gates/tractor-zero-dependencia-ia.test.mjs'],
 ];
 for(const [file,consumer]of pairs){
  put(root,file,fs.readFileSync(path.join(REPO,file),'utf8'));
  put(root,consumer,fs.readFileSync(path.join(REPO,consumer),'utf8'));
 }
 const initial=audit(root);
 for(const [file]of pairs) assert.ok(!initial.infraccions.some(x=>x.llei==='A4'&&x.fitxer===file),file);
 for(const [file]of pairs){
  put(root,'package.json',JSON.stringify({type:'module',scripts:{bad:`node ${file}`}}));
  assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer===file),file);
 }
 put(root,'package.json','{"type":"module","scripts":{}}');
 put(root,'tooling/gates/tractor-zero-dependencia-ia.mjs',"// import {classificaEndpoint} from './zero-ia-endpoints.mjs';\nconst fixture=\"import {classificaEndpoint} from './zero-ia-endpoints.mjs'\";process.exit(0);");
 assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer==='tooling/gates/zero-ia-endpoints.mjs'));
});
test('A4 exigix guarda positiva viable i rebutja reassignació o retorn mort',t=>{
 const root=fixture(t);
 const prefix="import {fileURLToPath} from 'node:url';import path from 'node:path';function main(){}\n";
 const identity='path.resolve(process.argv[1])===fileURLToPath(import.meta.url)';
 const cases={
  dead:`if(false && (${identity}))main();`,
  negated:`if(!(${identity}))main();`,
  either:`if(globalThis.flag || (${identity}))main();`,
  changed:`let direct=(${identity});direct=false;if(direct)main();`,
  deadReturn:`function esEntrada(){if(false)return (${identity});return false;}if(esEntrada())main();`,
 };
 for(const [name,source]of Object.entries(cases)){
  put(root,`tooling/gates/${name}.mjs`,prefix+source);
  assert.ok(audit(root).infraccions.some(x=>x.llei==='A4'&&x.fitxer.endsWith(`/${name}.mjs`)),name);
 }
});
