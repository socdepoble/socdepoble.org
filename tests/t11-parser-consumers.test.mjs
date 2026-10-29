import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {extractDocumentLinks} from '../tooling/lib/document-links.mjs';
const plaquetes=fileURLToPath(new URL('../scripts/immunitari/plaquetes.mjs',import.meta.url));
const doctrina=fileURLToPath(new URL('../tooling/gates/tractor-doctrina.mjs',import.meta.url));
function fixture(t){
 const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-parser-consumer-')));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const put=(rel,text)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);};
 put('.agents/AGENTS.md','# BIOS de prova\n');
 return {root,put,run:(script,args)=>spawnSync(process.execPath,[script,...args],{cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8'})};
}
function immune(t,example=''){
 const f=fixture(t);f.put('.immunitari/config.json',JSON.stringify({vault:'_wiki_de_poble',exclouFonts:[],ignoraObjectius:[],hubsTaxonomics:[],hubsDelegats:false,indexAdopcio:'00_index',memorialLapides:'memorial'}));
 f.put('.immunitari/baseline.json',JSON.stringify({ferides:0}));
 f.put('_wiki_de_poble/00_index.md',`# Índex\n[[real]]\n${example}\n`);f.put('_wiki_de_poble/real.md','# Real\n[[00_index]]\n');
 return {...f,diagnose:()=>f.run(plaquetes,['diagnostic','--porta'])};
}
function doctrine(t,text,args=[]){
 const f=fixture(t);f.put('docs/norma.md',`# Norma\n${text}\n`);f.put('src/present.js','export const present=true;\n');
 return {...f,check:()=>{const result=f.run(doctrina,['--json','--abast=docs',...args]);return {...result,data:JSON.parse(result.stdout)};}};
}
const inventory=root=>{
 const scan=(dir,rel='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
  const name=path.posix.join(rel,e.name),abs=path.join(dir,e.name);
  if(e.isSymbolicLink())return [[name,'symlink',fs.readlinkSync(abs)]];
  return e.isDirectory()?scan(abs,name):[[name,'file',fs.readFileSync(abs).toString('base64')]];
 });return scan(root).sort((a,b)=>a[0].localeCompare(b[0]));
};
for(const[name,example]of[
 ['doble backtick','``[[fantasma]]``'],['triple inline','``` [[fantasma]] ```'],
 ['fence tildes','~~~markdown\n[[fantasma]]\n~~~'],
 ['fence llarga amb marcador curt','````markdown\n```\n[[fantasma]]\n````'],
 ['famílies barrejades','~~~~markdown\n```\n[[fantasma]]\n~~~~'],
 ['comentari HTML','<!-- [[fantasma]] -->'],
 ['wikilink escapat','\\[[fantasma]]']
])test('Plaquetes no transforma exemple en ferida: '+name,t=>{
 const f=immune(t,example),before=inventory(f.root),r=f.diagnose();
 assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/0 ferides totals/);assert.deepEqual(inventory(f.root),before);
 const content=`[[real]]\n${example}`;
 assert.deepEqual(extractDocumentLinks(content).filter(l=>l.kind==='wiki').map(l=>l.target),['real']);
});
test('Plaquetes conserva àlies/fragments reals i escapament de taula Obsidian',t=>{
 const f=immune(t,'| [[real\\|etiqueta]] | [[real#seccio|altra]] |'),r=f.diagnose();assert.equal(r.status,0,r.stderr);
});
test('Plaquetes continua fallant amb un fantasma real després dels exemples',t=>{
 const f=immune(t,'``[[nomes_exemple]]``\n[[fantasma_real]]'),before=inventory(f.root),r=f.diagnose();
 assert.equal(r.status,1);assert.match(r.stderr,/1 ferides noves/);assert.deepEqual(inventory(f.root),before);
});
test('Plaquetes distingix esquemes remots de noms locals que comencen per http',t=>{
 const remote=immune(t,'[[https://example.invalid/absent]] [[mailto:veinat@example.invalid]]');assert.equal(remote.diagnose().status,0);
 const local=immune(t,'[[http_document_local]]'),r=local.diagnose();assert.equal(r.status,1);assert.match(r.stderr,/1 ferides noves/);
});
test('Plaquetes conserva el recompte de dues referències reals repetides',t=>{
 const f=immune(t,'[[fantasma_real]] [[fantasma_real]]'),r=f.diagnose();assert.equal(r.status,1);assert.match(r.stderr,/2 ferides noves/);
});
test('Plaquetes no seguix symlinks ni incorpora arxiu o producció humana',t=>{
 const f=immune(t);f.put('_wiki_de_poble/90_arxiu_historic/vell.md','[[fantasma_arxiu]]');f.put('_wiki_de_poble/01_produccio/huma.md','[[fantasma_huma]]');
 f.put('extern.md','[[fantasma_extern]]');fs.symlinkSync(path.join(f.root,'extern.md'),path.join(f.root,'_wiki_de_poble/simbolic.md'));
 const before=inventory(f.root),r=f.diagnose();assert.equal(r.status,0,r.stderr);assert.deepEqual(inventory(f.root),before);
});
for(const suffix of [':45',':102-107',':30-33,121-133',':45:7',':3–6'])test('Doctrina resol la cita existent sense confondre el sufix amb el fitxer: '+suffix,t=>{
 const f=doctrine(t,`Referència: \`src/present.js${suffix}\`.`),r=f.check();assert.equal(r.status,0,r.stderr);assert.equal(r.data.absents.length,0);assert.equal(r.data.resum.uniques,1);
});
test('Doctrina conserva línia i detecta realment un fitxer absent citat amb rang',t=>{
 const f=doctrine(t,'Referència: `src/absent.js:10-12,17`.'),r=f.check();assert.equal(r.status,1);assert.deepEqual(r.data.absents.map(({cami,linia})=>({cami,linia})),[{cami:'src/absent.js',linia:2}]);
});
test('Doctrina ignora extensions nues però continua comprovant noms concrets',t=>{
 const f=doctrine(t,'Extensions: `.mjs` `.php` `.sh` `.py` `.sql` `.md` `.json`. Referència: `src/absent.js`.'),r=f.check();
 assert.equal(r.status,1);assert.deepEqual(r.data.absents.map(a=>a.cami),['src/absent.js']);
});
test('Doctrina conserva .env com a nom de fitxer concret, sense llegir-ne contingut',t=>{
 const f=doctrine(t,'Configuració: `.env`.'),missing=f.check();assert.equal(missing.status,1);assert.deepEqual(missing.data.absents.map(a=>a.cami),['.env']);
 f.put('.env','FIXTURE_SENSE_SECRETS=\n');const found=f.check();assert.equal(found.status,0,found.stderr);
});
for(const name of ['docs/aammdd_hhmm_auditoria.md','docs/AAMMDD_HHMM_auditoria.md','docs/aammdd/nota.md','docs/prefix_aammdd_hhmm_auditoria.md'])test('Doctrina exclou una metavariable de data declarada en qualsevol segment: '+name,t=>{
 const f=doctrine(t,`Plantilla: \`${name}\`. Referència: \`src/present.js\`.`),r=f.check();assert.equal(r.status,0,r.stderr);assert.equal(r.data.resum.uniques,1);
});
test('Doctrina no amaga un nom literal que només s’assembla a una metavariable',t=>{
 const f=doctrine(t,'Referència: `src/aammddurable.js`.'),r=f.check();assert.equal(r.status,1);assert.deepEqual(r.data.absents.map(a=>a.cami),['src/aammddurable.js']);
});
test('Doctrina conserva les exempcions externes i extern-fatal',t=>{
 const f=doctrine(t,'Vegeu `../extern.js:45`.'),normal=f.check();assert.equal(normal.status,0);assert.equal(normal.data.externs[0].cami,'../extern.js');
 const fatal=f.run(doctrina,['--json','--abast=docs','--extern-fatal']);assert.equal(fatal.status,1);
});
test('Doctrina és lectura, determinista i continua rebutjant abast buit',t=>{
 const f=doctrine(t,'Referència: `src/present.js:45`.'),before=inventory(f.root),a=f.check(),b=f.check();assert.equal(a.status,0);assert.equal(a.stdout,b.stdout);assert.deepEqual(inventory(f.root),before);
 const empty=f.run(doctrina,['--json','--abast=absent']);assert.equal(empty.status,1);assert.match(empty.stderr,/no existix/);
});
