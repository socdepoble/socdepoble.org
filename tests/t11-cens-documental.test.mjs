import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inventari} from '../tooling/brain/cataleg_skills.mjs';
import {parseDocument,validateSchema,sha} from '../tooling/documental/core.mjs';
import {auditContractClaims} from '../tooling/wiki/lib/contract_consistency.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const CENS='_wiki_de_poble/02_saber/03_consola_termodinamica/03_inventari_skills.md';
const FILES=['_wiki_de_poble/01_ser/00_bios.md','_wiki_de_poble/02_saber/00_full_de_ruta.md',CENS,'_wiki_de_poble/02_saber/sistema_immunitari.md'];
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');
function canonical(){const skills=inventari(ROOT),core=skills.filter(s=>s.core).length;return new Map([
 ['skills actives',skills.length],['marca core: true',core],['sense marca core: true',skills.length-core],
 ...['core-','sdp-','wiki-'].map(prefix=>['prefix '+prefix,skills.filter(s=>s.id.startsWith(prefix)).length])
]);}
function auditCensus(content){
 const values=canonical(),lines=content.split(/\r?\n/);let active=false;
 const claims=[];for(let i=0;i<lines.length;i++){
  if(/^## Cens vigent\b/.test(lines[i])){active=true;continue;}
  if(active&&/^## /.test(lines[i]))active=false;
  const row=active&&/^\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|$/.exec(lines[i]);
  if(row&&values.has(row[1]))claims.push({id:row[1],value:row[2],path:CENS,line:i+1,text:lines[i]});
 }
 const scope='cens-documental-vigent';return auditContractClaims({scope,documents:[{path:CENS,content,authority:'active'}],catalog:{scope,canonical:[...values].map(([id,value])=>({id,value:String(value)})),claims}});
}
test('quatre documents preserven el contracte de frontmatter vigent',()=>{
 const schema=JSON.parse(read('tooling/wiki/schema.json'));for(const file of FILES)assert.deepEqual(validateSchema(parseDocument(read(file)).data,schema),[],file);
});
test('cens vigent compara sis mesures contra les42skills reals, distingint marca i prefix',()=>{
 const r=auditCensus(read(CENS));assert.equal(r.status,'no-explicit-disagreements');assert.equal(r.coverage.catalog.comparedIds,6);assert.equal(r.coverage.catalog.activeClaims,6);
 assert.notEqual(canonical().get('marca core: true'),canonical().get('prefix core-'));
});
test('confondre core:true amb core- genera desacord explícit localitzat',()=>{
 const raw=read(CENS),wrong=raw.replace(/(\| prefix core- \| )\d+( \|)/,'$1'+canonical().get('marca core: true')+'$2');
 const r=auditCensus(wrong);assert.equal(r.status,'explicit-disagreements');assert.equal(r.findings.length,1);assert.equal(r.findings[0].contract,'catalog:prefix core-');assert.equal(r.findings[0].requiresReview,true);
});
test('sense taula vigent el cens és incomplet, mai un verd per buit',()=>{
 const r=auditCensus('# Inventari\nLectura històrica:17skills,8nucli i9connectables.');assert.equal(r.status,'incomplete');assert.equal(r.coverage.catalog.activeClaims,0);
});
test('un altre recompte històric fora de la secció vigent no altera el contracte actual',()=>{
 const a=auditCensus(read(CENS)),b=auditCensus(read(CENS)+'\n## Història addicional\n| prefix core- | 9 |\n');
 assert.deepEqual(a.findings,b.findings);assert.deepEqual(a.coverage.catalog,b.coverage.catalog);
});
test('un canvi real de xifra del cens requereix revisar la declaració, sense inferir salut',()=>{
 const raw=read(CENS),wrong=raw.replace(/(\| skills actives \| )\d+( \|)/,'$199$2');const r=auditCensus(wrong);
 assert.equal(r.findings.length,1);assert.equal(r.findings[0].canonical.value,String(inventari(ROOT).length));assert.equal(Object.hasOwn(r,'score'),false);
});
test('lectures i comparacions deixen intactes documents i skills',()=>{
 const paths=[...FILES,...inventari(ROOT).map(s=>s.ruta)],before=paths.map(p=>sha(fs.readFileSync(path.join(ROOT,p))));auditCensus(read(CENS));
 assert.deepEqual(paths.map(p=>sha(fs.readFileSync(path.join(ROOT,p)))),before);
});
