import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inventari, projeccions} from '../tooling/brain/cataleg_skills.mjs';
import {textDestins} from '../tooling/brain/destins_canonics.mjs';
import {prepara, identitatTorn, desaEmissio} from '../tooling/brain/context_documental.mjs';
const hook=fileURLToPath(new URL('../.agents/hooks/verify.mjs',import.meta.url));
function fixture(t,ids=['auditoria']){
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-hook-destins-')));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const put=(rel,text)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);};
  const reg={schema:'sdp.protocolledge.v4',onUnknown:'error',rutes:[
    {id:'auditoria',tipus:'informe',claus:['auditoria'],plantilla:'templates/audit.md',lectures:[],destins:['_wiki_de_poble/04_escriptori']},
    {id:'acta',tipus:'acta',claus:['acta'],plantilla:'templates/acta.md',lectures:[],destins:['_wiki_de_poble/10_actes']}
  ]};
  for(const name of ['BOOTSTRAP.md','AGENTS.md','PROFILE.md','BASELINE.md','PROTOCOL_PETORRETA.md','consell.json'])put('.agents/'+name,'# Font de prova\n');
  put('.agents/skills/prova/SKILL.md','---\ntype: skill\nstatus: canonic\nname: prova\ndescription: Procediment de prova.\ntriggers_on: [auditoria, acta]\n---\n# Prova\n');
  put('templates/audit.md','# Auditoria\n');put('templates/acta.md','# Acta\n');
  put('.agents/protocolledge.json',JSON.stringify(reg));put('.agents/DESTINS_CANONICS.json',textDestins(reg));
  for(const[rel,text]of projeccions(inventari(root)))put(rel,text);
  const transcriptPath=path.join(root,'session/transcript.jsonl');put('session/transcript.jsonl',JSON.stringify({type:'USER_INPUT',content:'auditoria acta'})+'\n');
  const payload={transcriptPath};const identity=identitatTorn(payload);
  const context=prepara(identity.task,ids,root);const receipt=desaEmissio(context,identity,ids,root);
  const verify=(rel,extra={})=>{
    const input={...payload,...extra,toolCall:{name:'write_to_file',args:{TargetFile:path.join(root,rel)}}};
    const result=spawnSync(process.execPath,[hook],{cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8',input:JSON.stringify(input)});
    assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
  };
  return {root,reg,put,receipt,identity,verify};
}
const audit='_wiki_de_poble/04_escriptori/261029_0538_auditoria_prova.md';
const acta='_wiki_de_poble/10_actes/261029_0538_acta_prova.md';
test('rebut auditoria vigent permet únicament el destí seleccionat',t=>{
 const f=fixture(t);assert.equal(f.verify(audit).decision,'allow');
 const result=f.verify(acta);assert.equal(result.decision,'deny');assert.match(result.reason,/protocols del rebut/);
});
test('rebut acta vigent permet10_actes sense heretar el destí auditoria',t=>{
 const f=fixture(t,['acta']);assert.equal(f.verify(acta).decision,'allow');assert.equal(f.verify(audit).decision,'deny');
});
test('selecció explícita conjunta habilita sols la unió dels protocols acreditats',t=>{
 const f=fixture(t,['acta','auditoria']);assert.equal(f.verify(acta).decision,'allow');assert.equal(f.verify(audit).decision,'allow');
 assert.equal(f.verify('_wiki_de_poble/01_ser/identitat.md').decision,'deny');
});
for(const rel of ['_wiki_de_poble/04_escriptori/01_produccio/261029_0538_produccio_prova.md','_wiki_de_poble/90_arxiu_historic/261029_0538_acta_prova.md','.agents/skills/prova/SKILL.md','tooling/brain/prova.md','supabase/migrations/prova.md'])test('protecció prèvia preval amb rebut vigent: '+rel,t=>{
 const f=fixture(t,['acta','auditoria']);assert.equal(f.verify(rel).decision,'deny');
});
for(const rel of ['_wiki_de_poble/01_ser/identitat.md','_wiki_de_poble/02_saber/norma.md','_wiki_de_poble/03_actuar/procediment.md'])test('manteniment canònic fora de la política actual continua denegat: '+rel,t=>{
 const f=fixture(t,['acta','auditoria']);assert.equal(f.verify(rel).decision,'deny');
});
test('laboratori continua requerint decisió explícita, sense permís automàtic',t=>{
 const f=fixture(t);assert.equal(f.verify('_wiki_de_poble/04_escriptori/02_investigacio_ia/261029_0538_auditoria_laboratori.md').decision,'ask');
});
test('context obsolet per canvi d’una font no s’accepta',t=>{
 const f=fixture(t);fs.appendFileSync(path.join(f.root,'templates/audit.md'),'Canvi\n');
 const result=f.verify(audit);assert.equal(result.decision,'deny');assert.match(result.reason,/Context canviat/);
});
test('projecció antiga o divergent denegada abans d’autoritzar',t=>{
 const f=fixture(t);f.put('.agents/DESTINS_CANONICS.json',JSON.stringify({destins_permesos:{global:'_wiki_de_poble'}}));
 assert.equal(f.verify(audit).decision,'deny');
});
test('canviar registre i projecció coherent no revalida un rebut antic',t=>{
 const f=fixture(t);f.reg.rutes[0].destins=['_wiki_de_poble/10_actes'];
 f.put('.agents/protocolledge.json',JSON.stringify(f.reg));f.put('.agents/DESTINS_CANONICS.json',textDestins(f.reg));
 assert.equal(f.verify(acta).decision,'deny');
});
test('rebut absent, caducat i protocols manipulats fallen tancats',t=>{
 const f=fixture(t),file=path.join(f.root,`.agents/.matrix-rebuts/${f.identity.torn}.json`);
 fs.writeFileSync(file,JSON.stringify({...f.receipt,protocols:['acta']}));assert.equal(f.verify(acta).decision,'deny');
 fs.writeFileSync(file,JSON.stringify({...f.receipt,t:new Date(Date.now()-31*60000).toISOString()}));assert.equal(f.verify(audit).decision,'deny');
 fs.unlinkSync(file);assert.equal(f.verify(audit).decision,'deny');
});
test('nom termodinàmic i ruta simbòlica continuen protegits',t=>{
 const f=fixture(t);assert.equal(f.verify('_wiki_de_poble/04_escriptori/prova.md').decision,'deny');
 fs.mkdirSync(path.join(f.root,'_wiki_de_poble'),{recursive:true});fs.symlinkSync(os.tmpdir(),path.join(f.root,'_wiki_de_poble/04_escriptori'));
 assert.equal(f.verify(audit).decision,'deny');
});
test('consulta del hook no modifica fonts, rebut ni inventari',t=>{
 const f=fixture(t);const inventory=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?inventory(path.join(dir,e.name)):[path.relative(f.root,path.join(dir,e.name))]).sort();
 const names=inventory(f.root);const bytes=names.map(n=>fs.readFileSync(path.join(f.root,n)));
 assert.equal(f.verify(audit).decision,'allow');assert.deepEqual(inventory(f.root),names);
 names.forEach((n,i)=>assert.deepEqual(fs.readFileSync(path.join(f.root,n)),bytes[i]));
});
