import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {VerificadorSCC} from '../tooling/gates/verificador-scc.mjs';
import {REPO} from './helpers/documental.mjs';
const desk='_wiki_de_poble/04_escriptori';
function setup(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp scc '));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const put=(file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);};
 put('_wiki_de_poble/00_index.md','[[00_index_escriptori]]');put(`${desk}/00_index_escriptori.md`,'');return {root,put};
}
test('SCC usa fixtures privades: orfe roig, àncora real verda',async t=>{
 const {root,put}=setup(t);put(`${desk}/fact.md`,'# Fact');
 assert.equal((await new VerificadorSCC(root).runAudits()).valid,false);
 put(`${desk}/00_index_escriptori.md`,'[Fact](fact.md)');
 const result=await new VerificadorSCC(root).runAudits();assert.equal(result.valid,true,JSON.stringify(result));assert.equal(result.filesChecked,3);
});
test('ruta falsa no resol per basename',async t=>{
 const {root,put}=setup(t);put(`${desk}/fact.md`,'# Fact');put(`${desk}/00_index_escriptori.md`,'[Fact](wrong/fact.md)');
 const r=await new VerificadorSCC(root).runAudits();assert.ok(r.errors.some(e=>e.code==='LINK_INVALID'));assert.ok(r.errors.some(e=>e.code==='ESCRIPTORI_UNANCHORED'));
});
test('homònims no compartixen arestes; wikilink ambigu és error',async t=>{
 const {root,put}=setup(t);put(`${desk}/a/fact.md`,'# A');put(`${desk}/b/fact.md`,'# B');put(`${desk}/00_index_escriptori.md`,'[[fact]]');
 const r=await new VerificadorSCC(root).runAudits();assert.ok(r.errors.some(e=>e.message.includes('ambigu')));assert.equal(r.errors.filter(e=>e.code==='ESCRIPTORI_UNANCHORED').length,2);
});
test('HTML i binari humans requerixen àncora sense llegir el contingut',async t=>{
 const {root,put}=setup(t);put(`${desk}/01_produccio/demo.html`,'html');put(`${desk}/01_produccio/raw.bin`,Buffer.from([0,255]));
 let r=await new VerificadorSCC(root).runAudits();assert.equal(r.errors.filter(e=>e.code==='ESCRIPTORI_UNANCHORED').length,2);
 put(`${desk}/00_index_escriptori.md`,'[HTML](01_produccio/demo.html)\n[Binari](01_produccio/raw.bin)');r=await new VerificadorSCC(root).runAudits();assert.equal(r.valid,true,JSON.stringify(r));
});
test('enllaç fora de l’arrel i symlink fallen explícitament',async t=>{
 const {root,put}=setup(t);put(`${desk}/00_index_escriptori.md`,'[fora](../../../outside.md)');
 fs.symlinkSync(path.join(root,'_wiki_de_poble/00_index.md'),path.join(root,desk,'alias.md'));
 const r=await new VerificadorSCC(root).runAudits();assert.ok(r.errors.some(e=>e.code==='SCC_SYMLINK'));assert.ok(r.errors.some(e=>e.code==='LINK_INVALID'));
});
test('CLI per symlink i espais audita i retorna resultat estructurat',t=>{
 const {root}=setup(t);const aliasDir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp alias '));t.after(()=>fs.rmSync(aliasDir,{recursive:true,force:true}));const alias=path.join(aliasDir,'alias repo');fs.symlinkSync(REPO,alias);
 const r=spawnSync(process.execPath,[path.join(alias,'tooling/gates/verificador-scc.mjs'),root],{encoding:'utf8'});
 assert.notEqual(r.stdout+r.stderr,'');assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).filesChecked,2);
});
test('índex absent o I/O fallida no produeix verd buit',async t=>{
 const {root}=setup(t);fs.unlinkSync(path.join(root,desk,'00_index_escriptori.md'));fs.mkdirSync(path.join(root,desk,'00_index_escriptori.md'));
 const r=await new VerificadorSCC(root).runAudits();assert.equal(r.valid,false);assert.ok(r.errors.some(e=>e.code==='INDEX_NOT_FOUND'));
});
test('wikilink amb ../ es resol des de l’origen sense fals positiu d’eixida',async t=>{
 const {root,put}=setup(t);put('_wiki_de_poble/10_actes/fact.md','# Fact');put(`${desk}/00_index_escriptori.md`,'[[../10_actes/fact.md]]');
 const r=await new VerificadorSCC(root).runAudits();assert.equal(r.valid,true,JSON.stringify(r));
});
test('els derivats var de l’arrel no són documents; var dins de la Wiki continua auditada', async t => {
 const {root,put}=setup(t);
 put('var/plantilla-viva/informe.md','# Derivat regenerable');
 assert.equal((await new VerificadorSCC(root).runAudits()).valid,true);
 put('_wiki_de_poble/var/document.md','# Document operatiu');
 const result=await new VerificadorSCC(root).runAudits();
 assert.equal(result.valid,false);
 assert.ok(result.errors.some(e=>e.code==='ORPHAN_OPERATIVE' && e.affected_files.includes('_wiki_de_poble/var/document.md')));
});

test('OpenData del build natiu no és document operatiu; la mateixa carpeta dins de la Wiki sí que s’audita', async t => {
 const {root,put}=setup(t);
 put('dist-natiu/opendata/llicencies.md','# Llicències distribuïdes');
 put('dist-natiu/opendata/memoria.md','# Memòria distribuïda');
 assert.equal((await new VerificadorSCC(root).runAudits()).valid,true);
 put('_wiki_de_poble/dist-natiu/document.md','# Document operatiu');
 const r=await new VerificadorSCC(root).runAudits();
 assert.equal(r.valid,false);
 assert.ok(r.errors.some(e=>e.code==='ORPHAN_OPERATIVE'&&e.affected_files.includes('_wiki_de_poble/dist-natiu/document.md')));
});

test('R32.9 · rutes del Router i resolutors reals acrediten els 4 links del capítol, sense ancorar documents físics',async()=>{
 const {prepareDocumentWebLinks,resolveDocumentLink,extractDocumentLinks}=await import('../tooling/lib/document-links.mjs');
 const links=extractDocumentLinks('[Inventari](/consola/inventari) [Consola](/consola) [Node](/page/node-zero) [Rutes](/page/rutes-de-poble) [No](/consola/inventat) [No](/page/inventat) [No](/inventat) [No](/consola/../inventari) [No](/consola/%2e%2e/inventari) [No](/wikidepoble?item=fantasma) [No](/wikidepoble?item=00_index&item=fantasma) [No](/wikidepoble?item=) [No](/pobles/fantasma)');
 const catalog=await prepareDocumentWebLinks(REPO,links),source=path.join(REPO,'_wiki_de_poble/00_index.md');
 for(const l of links.slice(0,4))assert.equal(resolveDocumentLink(l,source,[],REPO,{webLinks:catalog}),'web:'+l.target);
 for(const l of links.slice(4))assert.throws(()=>resolveDocumentLink(l,source,[],REPO,{webLinks:catalog}),/web invàlid/);
});

test('R32.9 · URL inventada i absència de context web continuen LINK_INVALID, mai ancoratge verd',async t=>{
 const {root,put}=setup(t);put(`${desk}/fact.md`,'# Fact');put(`${desk}/00_index_escriptori.md`,'[Fact](/consola/inventari)');
 const r=await new VerificadorSCC(root).runAudits();assert.ok(r.errors.some(e=>e.code==='LINK_INVALID'));assert.ok(r.errors.some(e=>e.code==='ESCRIPTORI_UNANCHORED'));
});

test('R32.9 · un path físic absolut interior continua sent físic i els symlinks de ruta no aporten context',async t=>{
 const {root,put}=setup(t);put(`${desk}/fact.md`,'# Fact');
 const file=path.join(root,desk,'fact.md');put(`${desk}/00_index_escriptori.md`,`[Fact](${file})`);
 assert.equal((await new VerificadorSCC(root).runAudits()).valid,true);
 const {prepareDocumentWebLinks,resolveDocumentLink}=await import('../tooling/lib/document-links.mjs');
 const src=path.join(root,desk,'00_index_escriptori.md'),link={kind:'markdown',target:'/consola'};
 fs.symlinkSync(path.join(REPO,'src'),path.join(root,'src'));
 const catalog=await prepareDocumentWebLinks(root,[link]);assert.throws(()=>resolveDocumentLink(link,src,[],root,{webLinks:catalog}),/web invàlid/);
});

function webFixture(t){
 const f=setup(t),put=f.put;
 for(const [p,text]of Object.entries({
  'package.json':'{"type":"module"}', '.agents/AGENTS.md':'# Fixture',
  'src/app/App.jsx':`import {Routes,Route} from './contexts/RouterContext';export function App(){return <Routes><Route path="/consola/*" element={<ConsolaSection/>}/><Route path="/page/:slug" element={<PageDetailSection/>}/></Routes>}`,
  'src/config/navigation.js':`export const PAGE_ROUTE_MAP={};export const RUTES_CANONIQUES={};export const resolvePageSlugPath=()=>null;`,
  'src/config/sections.js':'export const SECTIONS=[];', 'src/config/systemPages.js':'export const SYSTEM_PAGES=[];',
  'src/sections/text/pageContent.js':`export const PAGE_COPY={'node-zero':{title:'Node'}};`,
  'src/sections/consola/consolaPagines.js':`export const RUTA_CONSOLA='/consola';export const segmentPagina=s=>s==='inventari'?'inventari':null;export const paginaConsola=id=>id==='inventari'?{id}:null;`,
  'src/sections/consola/polsConsola.js':'export const segmentPols=()=>null;export const panellPols=()=>null;',
  'src/sections/consola/govern/governConsola.js':'export const segmentGovern=()=>null;export const paginaGovern=()=>null;',
  'src/sections/consola/xifresMas.js':'export const SLUGS_FIXOS=[];',
  'src/sections/consola/empaquetats.js':'export const RUTA_EMPAQUETATS=`${RUTA_CONSOLA}/empaquetats`;',
  'src/data/wikiManifest.js':'export const wikiManifest={items:[]};',
  'tooling/vite/federacio-iaia.mjs':'export default ()=>[{}, {configResolved(){},generateBundle(){}}];',
  'tooling/vite/opendata-publica.mjs':'export default ()=>({generateBundle(){}});',
  'firebase.json':'{"hosting":{"rewrites":[]}}','public/opendata/manifest.json':'{"resources":[]}'
 }))put(p,text);
 fs.symlinkSync(path.join(REPO,'node_modules'),path.join(f.root,'node_modules'));
 return f;
}

test('R32.9 · rutes web vàlides mai ancoren un document i el mateix procés rellegix PAGE_COPY retirada',async t=>{
 const {root,put}=webFixture(t);put(`${desk}/fact.md`,'# Fact');put(`${desk}/00_index_escriptori.md`,'[Fact](/consola/inventari) [Node](/page/node-zero)');
 const a=await new VerificadorSCC(root).runAudits();assert.equal(a.errors.filter(e=>e.code==='LINK_INVALID').length,0,JSON.stringify(a));assert.ok(a.errors.some(e=>e.code==='ESCRIPTORI_UNANCHORED'));
 put('src/sections/text/pageContent.js','export const PAGE_COPY={};');
 const b=await new VerificadorSCC(root).runAudits();assert.ok(b.errors.some(e=>e.code==='LINK_INVALID'&&e.message.includes('node-zero')));
});
