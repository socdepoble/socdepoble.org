import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {isExecutionEvidence, isCitationFixtureOrCache} from '../tooling/lib/corpus-scope.mjs';
const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const put=(root,file,body)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);};
function fixture(t){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-corpus-scope-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const file of ['tooling/wiki/schema.json','tooling/wiki/frontmatter-abast.json','tooling/wiki/nomenclatura.json'])put(root,file,fs.readFileSync(path.join(REPO,file),'utf8'));
 const config=JSON.parse(fs.readFileSync(path.join(root,'tooling/wiki/nomenclatura.json'),'utf8'));config.arrels_codi.push('.sdp-reflex');put(root,'tooling/wiki/nomenclatura.json',JSON.stringify(config));
 put(root,'.agents/AGENTS.md','# Marcador\n');
 put(root,'.agents/skills/exemple/SKILL.md','# Canon estable\n`_wiki_de_poble/missing_stable.md`\n');
 put(root,'.agents/runtime_policy.md','# Política estable\n');
 put(root,'.agents/runtime-ish/nota.md','# Nota estable\n');
 put(root,'_wiki_de_poble/00_index.md','# Arrel\n[[runtime/nota]]\n');
 put(root,'_wiki_de_poble/04_escriptori/00_index_escriptori.md','# Índex\n[[00_index]]\n');
 put(root,'_wiki_de_poble/runtime/nota.md','# Capítol runtime legítim\n');
 fs.mkdirSync(path.join(root,'.sdp-reflex'),{recursive:true});
 return root;
}
const scripts=[
 ['frontmatter','tooling/wiki/tractor-frontmatter.mjs',[]],
 ['nomenclatura','tooling/wiki/tractor-nomenclatura.mjs',[]],
 ['doctrina','tooling/gates/tractor-doctrina.mjs',['--abast=.agents,.sdp-reflex']],
 ['teixit','tooling/wiki/teixidor.mjs',['--arrels=_wiki_de_poble,.agents,.sdp-reflex']],
 ['llaurador','tooling/wiki/llaurador_indexs.mjs',['--arrels=_wiki_de_poble,.agents,.sdp-reflex']],
];
function scan(root,script,args){
 const run=spawnSync(process.execPath,[path.join(REPO,script),`--arrel=${root}`,'--json',...args],{cwd:root,encoding:'utf8',timeout:5000});
 assert.ok([0,1].includes(run.status),`${script}: ${run.stderr}`);
 return {status:run.status,report:JSON.parse(run.stdout)};
}
test('exclusions només dels dos namespaces executables exactes; el corpus estable queda dins',()=>{
 for(const file of ['.agents/runtime','.agents/runtime/imports/a.md','./.agents/runtime/turns/a.json','.sdp-reflex/bootstrap/session/prompt.md'])assert.equal(isExecutionEvidence(file),true,file);
 for(const file of ['.agents/AGENTS.md','.agents/skills/core/SKILL.md','.agents/runtime_policy.md','.agents/runtime-ish/a.md','_wiki_de_poble/runtime/nota.md','_wiki_de_poble/03_actuar/bootstrap.md','.sdp-reflex-policy.md'])assert.equal(isExecutionEvidence(file),false,file);
});
for(const [name,script,args] of scripts)test(`${name}: evidència efímera no altera auditoria ni oculta documents canònics`,t=>{
 const root=fixture(t),before=scan(root,script,args);
 put(root,'.agents/runtime/imports/untrusted.md','# Sense frontmatter\n[[fantasma_efimer]]\n`_wiki_de_poble/missing_ephemeral.md`\n');
 put(root,'.agents/runtime/turns/turn.json','{"target":"_wiki_de_poble/missing_ephemeral.md"}');
 put(root,'.sdp-reflex/bootstrap/session/prompt.md','# Bootstrap\n[[fantasma_bootstrap]]\n');
 const after=scan(root,script,args);
 assert.deepEqual(after,before,'afegir rebuts/transaccions no modifica la mètrica de corpus');
 const text=JSON.stringify(after.report);
 assert.doesNotMatch(text,/fantasma_efimer|fantasma_bootstrap|missing_ephemeral/);
 if(name==='frontmatter'){
  assert.match(text,/\.agents\/skills\/exemple\/SKILL.md/);
  assert.match(text,/runtime_policy.md/);
  assert.match(text,/_wiki_de_poble\/runtime\/nota.md/);
  assert.equal(after.status,1,'defectes de frontmatter estables continuen rojos');
 }
 if(name==='nomenclatura'||name==='doctrina')assert.match(text,/missing_stable.md/);
 if(name==='teixit')assert.ok(after.report.orfes.includes('.agents/runtime_policy.md'));
 if(name==='llaurador')assert.equal(after.report.documents,7,'inclou política, skills, índexs i capítol runtime; exclou rebuts');
});

test('visibility private continua validada i els documents no desapareixen per reduir F5',t=>{
 const root=fixture(t);
 const first='_wiki_de_poble/02_saber/privat_a.md',second='_wiki_de_poble/02_saber/privat_b.md';
 const body=visibility=>`---\ntype: document\nstatus: esborrany\ndescription: Document privat de prova\nvisibility: ${visibility}\ncore: true\n---\n# Privat\n`;
 put(root,first,body('private'));put(root,second,body('private'));
 const report=scan(root,'tooling/wiki/tractor-frontmatter.mjs',[]).report;
 assert.equal(report.fallades.F5.some(x=>x.clau==='visibility'),false);
 assert.ok(report.fallades.F5.some(x=>x.clau==='core'),'la mètrica F5 continua activa per a altres claus');
 assert.ok(report.fallades.F9.some(x=>x.n===first),'el document privat continua auditat per altres defectes');
 assert.match(fs.readFileSync(path.join(root,first),'utf8'),/visibility: private/);
 put(root,second,body('publicat_per_error'));
 const invalid=scan(root,'tooling/wiki/tractor-frontmatter.mjs',[]).report;
 assert.ok(invalid.fallades.F3.some(x=>x.n===second&&x.clau==='visibility'),'enum de privacy invàlid continua roig');
});
test('N2 ignora referències sintètiques de test/cache però manté promeses de producte i skills',t=>{
 const root=fixture(t);
 const cite='const fake = "_wiki_de_poble/fake_fixture.md";';
 for(const file of ['tooling/gates/example.test.mjs','src/__tests__/example.js','tooling/wiki/.cache-tractor.json'])put(root,file,cite);
 put(root,'tooling/example.mjs','const missing = "_wiki_de_poble/missing_product.md";');
 const report=scan(root,'tooling/wiki/tractor-nomenclatura.mjs',[]).report;
 assert.equal(report.fallades.N2.some(x=>x.ruta.includes('fake_fixture')),false);
 assert.ok(report.fallades.N2.some(x=>x.ruta.includes('missing_product')));
 assert.ok(report.fallades.N2.some(x=>x.ruta.includes('missing_stable')));
 assert.equal(isCitationFixtureOrCache('tooling/contest.mjs'),false);
 assert.equal(isCitationFixtureOrCache('.agents/skills/test-runner/SKILL.md'),false);
 assert.equal(isCitationFixtureOrCache('_wiki_de_poble/02_saber/test_strategy.md'),false);
});
