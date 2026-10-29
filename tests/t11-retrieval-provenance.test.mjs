import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {buildIndex,search} from '../tooling/wiki/core/edge_rag.mjs';
import {readContextSource,writeGeneratedContext,renderGeneratedContext,groupIdenticalSources,GENOMA,GENOMA_SOURCES} from '../tooling/wiki/lib/retrieval-sources.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PRODUCER='tooling/wiki/compile-wiki-to-system-prompt.mjs';
const TOOLS=[PRODUCER,'tooling/wiki/lib/retrieval-sources.mjs','tooling/wiki/lib/frontmatter.mjs'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const doc=(body,metadata='')=>`---\ntype: document\nstatus: canonic\ndescription: Fixture de recuperació\n${metadata}---\n${body}\n`;
function fixture(t){
 const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-rag-provenance-'))),root=path.join(parent,'repo');fs.mkdirSync(root);t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));
 const put=(rel,bytes)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,bytes);return f;};
 const raw=doc('# BIOS\nbiosterm castanyeta'),sources={'AGENTS.md':raw,'.agents/AGENTS.md':raw,'.agents/PROTOCOL_PETORRETA.md':doc('# Protocol\nprotocolterm'),'.agents/skills/fixture/SKILL.md':doc('# Procediment\nskillterm'),'_wiki_de_poble/01_ser/03_equip_ia.md':doc('# Equip\nMarIA coordina rols'), '_wiki_de_poble/01_ser/agents_equip_ia.md':doc('# Narrativa\nMemòria cascavell i família\n\n~~~markdown\n## [FILE: fals.md]\n~~~'),'_wiki_de_poble/01_ser/personalitat_iaia.md':doc('# Personalitat\nVeu clara de MarIA')};
 for(const [p,b]of Object.entries(sources))put(p,b);for(const rel of TOOLS)put(rel,fs.readFileSync(path.join(ROOT,rel)));
 const compile=()=>spawnSync(process.execPath,[path.join(root,PRODUCER)],{cwd:root,encoding:'utf8'});
 const run=()=>{const result=compile();assert.equal(result.status,0,result.stdout+'\n'+result.stderr);return JSON.parse(fs.readFileSync(path.join(root,GENOMA_SOURCES),'utf8'));};
 return {parent,root,put,sources,compile,run,manifest:()=>JSON.parse(fs.readFileSync(path.join(root,GENOMA_SOURCES),'utf8'))};
}
test('CLI real emet una còpia BIOS, àlies i offsets byte-exactes de les emissions reals',t=>{
 const f=fixture(t),m=f.run(),artifact=fs.readFileSync(path.join(f.root,GENOMA));assert.equal(m.sources.length,7);assert.equal(m.emissions.length,6);
 const bios=m.emissions.find(e=>e.path==='AGENTS.md');assert.deepEqual(bios.aliases.map(a=>a.path),['.agents/AGENTS.md','AGENTS.md']);
 for(const e of m.emissions)assert.equal(hash(artifact.subarray(e.start,e.start+e.bytes)),e.sha256);
 assert.equal(m.artifact.sha256,hash(artifact));assert.ok(artifact.toString().includes('## [FILE: fals.md]'));
 const first=hash(artifact),side=hash(fs.readFileSync(path.join(f.root,GENOMA_SOURCES)));f.run();assert.equal(hash(fs.readFileSync(path.join(f.root,GENOMA))),first);assert.equal(hash(fs.readFileSync(path.join(f.root,GENOMA_SOURCES))),side);
});
test('edgeRAG valida el parell real i conserva retrats diferents sense afegir fonts només de procedència',async t=>{
 const f=fixture(t);f.run();const index=await buildIndex(f.root);assert.equal(index.docCount,5);
 assert.equal(index.docs.some(d=>d.path===GENOMA),false);assert.equal(index.docs.some(d=>d.path==='.agents/PROTOCOL_PETORRETA.md'),false);
 assert.equal(index.docs.find(d=>d.path==='AGENTS.md').aliases.length,2);assert.equal(index.sourceProvenance.generated.sources.find(s=>s.path==='.agents/PROTOCOL_PETORRETA.md').selected,false);
 for(const p of Object.keys(f.sources).filter(p=>p.startsWith('_wiki')))assert.ok(index.docs.some(d=>d.path===p));
 const hits=search(index,'biosterm',10);assert.equal(hits.length,1);assert.deepEqual(Object.keys(hits[0]).sort(),['path','score']);assert.equal(hits[0].path,'AGENTS.md');
});
test('sidecar absent i JSON corrupte rebutgen GENOMA sense recuperar-lo com a prosa',async t=>{
 const f=fixture(t);f.run();fs.unlinkSync(path.join(f.root,GENOMA_SOURCES));await assert.rejects(buildIndex(f.root),/Procedència GENOMA absent/);
 f.put(GENOMA_SOURCES,'{malformat');await assert.rejects(buildIndex(f.root),/Procedència GENOMA absent/);
});
test('artefacte alterat rebutja el parell encara que el sidecar original siga vàlid',async t=>{
 const f=fixture(t);f.run();fs.appendFileSync(path.join(f.root,GENOMA),'\ncontingut alié');await assert.rejects(buildIndex(f.root),/divergeixen/);
});
test('font absent o canviada, inclosa una font exclosa pel selector, falla explícitament',async t=>{
 const f=fixture(t);f.run();fs.unlinkSync(path.join(f.root,'.agents/PROTOCOL_PETORRETA.md'));await assert.rejects(buildIndex(f.root));
 f.put('.agents/PROTOCOL_PETORRETA.md',doc('Canvi nou'));await assert.rejects(buildIndex(f.root),/desfasada/);
});
test('productor o dependència canviats exigixen reconstruir el parell',async t=>{
 const f=fixture(t);f.run();fs.appendFileSync(path.join(f.root,PRODUCER),'\n// canvi\n');await assert.rejects(buildIndex(f.root),/divergeixen/);
 f.run();fs.appendFileSync(path.join(f.root,'tooling/wiki/lib/frontmatter.mjs'),'\n// canvi\n');await assert.rejects(buildIndex(f.root),/divergeixen/);
});
test('emissions falsejades, procedència repetida o circular no poden ocultar text',async t=>{
 const f=fixture(t);f.run();const original=f.manifest();
 for(const mutate of [m=>m.emissions[0].start++,m=>m.emissions.pop(),m=>m.sources.push(m.sources[0]),m=>m.sources[0].path=GENOMA]){
  const m=structuredClone(original);mutate(m);f.put(GENOMA_SOURCES,JSON.stringify(m));await assert.rejects(buildIndex(f.root));
 }
});
test('selecció explícita parcial de GENOMA falla; les fonts explícites cobertes passen',async t=>{
 const f=fixture(t);f.run();await assert.rejects(buildIndex(f.root,{files:[path.join(f.root,GENOMA)]}),/sense fonts seleccionades/);
 const files=[GENOMA,...Object.keys(f.sources)].map(p=>path.join(f.root,p));const index=await buildIndex(f.root,{files});assert.equal(index.docCount,6);assert.ok(index.docs.some(d=>d.path==='.agents/PROTOCOL_PETORRETA.md'));
});
test('només mirall seleccionat es conserva; cos igual amb metadata distinta no es fusiona',async t=>{
 const f=fixture(t),mirror=path.join(f.root,'.agents/AGENTS.md');const one=await buildIndex(f.root,{files:[mirror]});assert.equal(one.docs[0].path,'.agents/AGENTS.md');
 f.put('_wiki_de_poble/01_ser/diferent.md',doc('# BIOS\nbiosterm castanyeta','visibility: private\n'));
 const result=await buildIndex(f.root,{files:[mirror,path.join(f.root,'_wiki_de_poble/01_ser/diferent.md')]});assert.equal(result.docCount,2);
});
test('symlinks de font, sidecar o directori i selecció exterior es rebutgen',async t=>{
 const f=fixture(t);f.run();fs.unlinkSync(path.join(f.root,GENOMA_SOURCES));f.put('outside.json','{}');fs.symlinkSync(path.join(f.root,'outside.json'),path.join(f.root,GENOMA_SOURCES));await assert.rejects(buildIndex(f.root),/Symlink/);
 fs.unlinkSync(path.join(f.root,GENOMA_SOURCES));f.run();f.put('outside.md',doc('exterior'));fs.symlinkSync(path.join(f.root,'outside.md'),path.join(f.root,'linked.md'));await assert.rejects(buildIndex(f.root,{files:[path.join(f.root,'linked.md')]}),/Symlink/);
 await assert.rejects(buildIndex(f.root,{files:[path.join(f.parent,'exterior.md')]}),/Ruta relativa/);
});
test('corpus únic manté vectors/puntuacions per ruta i selecció permutada dona metadades deterministes',async t=>{
 const f=fixture(t),files=Object.keys(f.sources).filter(p=>p.startsWith('_wiki')).map(p=>path.join(f.root,p));const a=await buildIndex(f.root,{files}),b=await buildIndex(f.root,{files:[...files].reverse()});assert.deepEqual(a,b);assert.deepEqual(search(a,'MarIA',10),search(b,'MarIA',10));
});
test('publicació interrompuda entre renames deixa un parell rebutjat i neteja temporals',async t=>{
 const f=fixture(t);f.run();f.put('AGENTS.md',doc('BIOS nou'));
 const sources=Object.keys(f.sources).map(p=>readContextSource(f.root,p));const rename=fs.renameSync;
 const mock=t.mock.method(fs,'renameSync',(a,b)=>{if(b.endsWith(GENOMA_SOURCES))throw new Error('Interrupció simulada');return rename(a,b);});
 assert.throws(()=>writeGeneratedContext(f.root,sources),/Interrupció/);mock.mock.restore();await assert.rejects(buildIndex(f.root));assert.equal(fs.readdirSync(path.join(f.root,'.agents')).some(n=>n.includes('.tmp-')),false);
});
test('captura antiga o selecció divergent no es publica com a nova procedència',t=>{
 const f=fixture(t),sources=Object.keys(f.sources).map(p=>readContextSource(f.root,p));f.put('AGENTS.md',doc('Modificat'));assert.throws(()=>writeGeneratedContext(f.root,sources),/Font canviada/);
 assert.throws(()=>groupIdenticalSources([{path:'a.md',bytes:Buffer.from('a')},{path:'a.md',bytes:Buffer.from('b')}]));
});
test('bundle macro real manté totes les fonts/sidecar i hashes després de recuperar context',async t=>{
 const f=fixture(t);f.run();for(const rel of ['tooling/brain/crear_bundle.mjs','tooling/lib/arrel.mjs','tooling/wiki/lib/prompt_sgq.mjs'])f.put(rel,fs.readFileSync(path.join(ROOT,rel)));
 for(const [rel,text]of Object.entries({'package.json':'{"type":"module"}','vite.config.js':'export default {};','eslint.config.js':'export default [];','index.html':'<!doctype html>','src/current.js':'export const current=true;','.agents/ESTAT.md':'# Actual','.agents/LEDGER.md':'# Ledger'}))f.put(rel,text);
 for(const dir of ['scripts','supabase','tests'])fs.mkdirSync(path.join(f.root,dir),{recursive:true});
 const run=phase=>{const out=path.join(f.parent,phase+'.md'),p=spawnSync(process.execPath,[path.join(f.root,'tooling/brain/crear_bundle.mjs'),'--perfil=macro','--eixida='+out],{cwd:f.root,env:{...process.env,SDP_ARREL:f.root},encoding:'utf8'});assert.equal(p.status,0,p.stdout+'\n'+p.stderr);return JSON.parse(/```json\n([^\n]+)\n```/.exec(fs.readFileSync(out,'utf8'))[1]);};
 const before=run('before');await buildIndex(f.root);const after=run('after');assert.deepEqual(after.fitxers,before.fitxers);assert.equal(after.verificat,true);
 for(const rel of [GENOMA,GENOMA_SOURCES,'.agents/AGENTS.md',...Object.keys(f.sources).filter(p=>p.startsWith('_wiki'))])assert.ok(after.fitxers.some(s=>s.ruta===rel),rel);
});

test('nova font del selector i subconjunt falsejat de fonts exigixen reconstrucció',async t=>{
 const f=fixture(t);f.run();f.put('_wiki_de_poble/02_saber/afegit.md',doc('Font nova'));
 await assert.rejects(buildIndex(f.root),/Selecció del productor canviada/);f.run();assert.ok((await buildIndex(f.root)).docs.some(d=>d.path.endsWith('/afegit.md')));
 const genuine=f.manifest(),subset=genuine.sources.filter(s=>!s.path.endsWith('/afegit.md')).map(s=>readContextSource(f.root,s.path)),fake=renderGeneratedContext(subset,genuine.producer);
 f.put(GENOMA,fake.bytes);f.put(GENOMA_SOURCES,JSON.stringify(fake.manifest));await assert.rejects(buildIndex(f.root),/Selecció del productor canviada/);
});
test('estat arxivat s’explica en procedència i directoris històrics no es lligen pel productor',t=>{
 const f=fixture(t);f.put('_wiki_de_poble/01_ser/antic.md','---\ntype: document\nstatus: arxivat\n---\nMemòria antiga');
 f.put('_wiki_de_poble/01_ser/90_historic/no.md','---\nfrontmatter: invàlid: amb colon\n---\nNo llegir');
 const m=f.run();assert.ok(m.excluded.some(s=>s.path.endsWith('/antic.md')&&s.reason==='arxivat'));assert.equal(m.sources.some(s=>s.path.includes('/90_historic/')),false);
});

test('bytes de captura modificats no es poden publicar amb un digest antic aportat pel caller',t=>{
 const f=fixture(t),sources=Object.keys(f.sources).map(p=>readContextSource(f.root,p));sources[0].bytes=Buffer.from('Alterat en memòria');
 assert.throws(()=>writeGeneratedContext(f.root,sources),/Font canviada/);assert.equal(fs.existsSync(path.join(f.root,GENOMA)),false);
});

test('API conserva arrel relativa i fitxers relatius al cwd, igual que readFile abans',async t=>{
 const f=fixture(t),relativeRoot=path.relative(process.cwd(),f.root),absolute=await buildIndex(f.root),relative=await buildIndex(relativeRoot);assert.deepEqual(relative,absolute);
 const file=path.join(f.root,'AGENTS.md'),fromCwd=path.relative(process.cwd(),file);assert.deepEqual(await buildIndex(f.root,{files:[fromCwd]}),await buildIndex(f.root,{files:[file]}));
});


test('productor rebutja outputs symlink existents o trencats sense modificar el destí',t=>{
 const f=fixture(t),outside=f.put('fora.txt','sentinella intacta'),before=hash(fs.readFileSync(outside));
 for(const rel of [GENOMA,GENOMA_SOURCES]) {
  fs.symlinkSync(outside,path.join(f.root,rel));const result=f.compile();assert.notEqual(result.status,0);assert.match(result.stderr,/Symlink/);assert.equal(hash(fs.readFileSync(outside)),before);fs.unlinkSync(path.join(f.root,rel));
 }
 fs.symlinkSync(path.join(f.parent,'inexistent'),path.join(f.root,GENOMA));assert.notEqual(f.compile().status,0);assert.equal(fs.existsSync(path.join(f.root,GENOMA_SOURCES)),false);
});
test('outputs absents no permeten publicar a través d’un pare symlink',t=>{
 const f=fixture(t),real=path.join(f.root,'agents_reals');fs.renameSync(path.join(f.root,'.agents'),real);fs.symlinkSync(real,path.join(f.root,'.agents'));
 const result=f.compile();assert.notEqual(result.status,0);assert.match(result.stderr,/Symlink/);assert.equal(fs.existsSync(path.join(real,'GENOMA.md')),false);assert.equal(fs.existsSync(path.join(real,'GENOMA.sources.json')),false);
});
test('canvi de font després de preparar temporals es detecta abans de publicar qualsevol output',t=>{
 const f=fixture(t),sources=Object.keys(f.sources).map(p=>readContextSource(f.root,p)),write=fs.writeFileSync;
 const mock=t.mock.method(fs,'writeFileSync',(file,data,options)=>{const result=write(file,data,options);if(String(file).includes('GENOMA.sources.json.tmp-'))write(path.join(f.root,'AGENTS.md'),doc('Canvi durant staging'));return result;});
 assert.throws(()=>writeGeneratedContext(f.root,sources),/Font canviada/);mock.mock.restore();assert.equal(fs.existsSync(path.join(f.root,GENOMA)),false);assert.equal(fs.existsSync(path.join(f.root,GENOMA_SOURCES)),false);assert.equal(fs.readdirSync(path.join(f.root,'.agents')).some(n=>n.includes('.tmp-')),false);
});
