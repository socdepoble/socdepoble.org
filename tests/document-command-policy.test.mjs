import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fixture, REPO, writeDoc} from './helpers/documental.mjs';
import {openTurn, deliverContext, bindPlan} from '../tooling/documental/turns.mjs';
import {createDraft, draft} from '../tooling/wiki/document.mjs';
import {authorizeDocumentCommand} from '../tooling/documental/command-policy.mjs';
import {knownRead} from '../tooling/gates/mutation-policy.mjs';
import {checkLocal} from '../tooling/gates/hooks-local.mjs';
import {SOURCES} from '../tooling/brain/context-local.mjs';
function setup(t){
 const root=fs.realpathSync(fixture(t));
 for(const file of [...SOURCES,'tooling/wiki/document.mjs','tooling/gates/obrir_torn.mjs']){
  fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.copyFileSync(path.join(REPO,file),path.join(root,file));
 }
 return root;
}
const payload=(root,command)=>({tool_name:'Bash',cwd:root,tool_input:{command}});
const file='_wiki_de_poble/04_escriptori/260924_0400_auditoria_prova.md';
const command=(action,turn,extra='')=>`node tooling/wiki/document.mjs ${action} --turn-id ${turn.turn_id} --file ${file}${extra}`;
test('circuit P13 normal té autoritat documental explícita i continua sense ser lectura',t=>{
 const root=setup(t);
 const opening='node tooling/gates/obrir_torn.mjs --actor codex --scope documents';
 assert.equal(knownRead(payload(root,opening),root),false);
 assert.equal(checkLocal(payload(root,opening),root).authority.kind,'document-mutation');
 const turn=openTurn(root,{actor:'codex',scope:'documents'});
 const context=command('context',turn,' --route auditoria');
 assert.equal(checkLocal(payload(root,context),root).code,0);
 const create=command('create',turn,' --route auditoria --title "Informe de prova" --description "Auditoria del circuit documental"');
 assert.equal(checkLocal(payload(root,create),root).code,2,'no crea abans d’entregar context');
 deliverContext(root,turn.turn_id,{route:'auditoria',file});
 assert.equal(checkLocal(payload(root,create),root).authority.kind,'document-mutation');
 assert.equal(knownRead(payload(root,create),root),false);
 createDraft(root,turn.turn_id,{route:'auditoria',file,title:'Informe de prova',description:'Auditoria del circuit documental'});
 assert.ok(fs.existsSync(path.join(root,file)));
 assert.equal(checkLocal(payload(root,create),root).code,2,'no sobreescriu');
 assert.equal(checkLocal(payload(root,`node tooling/wiki/document.mjs check --file ${file}`),root).authority.kind,'read');
 assert.equal(checkLocal(payload(root,command('own',turn)),root).code,0);
 const planFile='_wiki_de_poble/04_escriptori/260924_0401_pla_implementacio_prova.md';
 const delivery=deliverContext(root,turn.turn_id,{route:'pla.implementacio',file:planFile});
 const content=draft(delivery,{title:'Pla de prova',description:'Pla per al circuit documental'}).replaceAll('[pendent]','Verificat amb evidència.');
 writeDoc(root,{file:planFile,content});
 const plan=`node tooling/wiki/document.mjs plan --turn-id ${turn.turn_id} --file ${planFile}`;
 assert.equal(checkLocal(payload(root,plan),root).code,0);
 bindPlan(root,turn.turn_id,planFile);
});
test('flags desconeguts, root/output override, shell i destins no documentals fallen',t=>{
 const root=setup(t),turn=openTurn(root,{scope:'documents'});
 const good=command('context',turn,' --route auditoria');
 const commands=[`${good} --arrel /tmp`,`${good} --file ${file}`,`${good}; pwd`,`${good}\npwd`,`${good} > /tmp/result`,`node tooling/wiki/document.mjs import --file ${file}`,`node tooling/gates/obrir_torn.mjs --scope documents --output /tmp/free.json`,`node tooling/gates/obrir_torn.mjs --scope unknown`,good.replace(file,'src/new.md'),good.replace(file,'_wiki_de_poble/04_escriptori/../escape.md'),good.replace(file,'_wiki_de_poble/04_escriptori/01_produccio/260924_0400_auditoria_prova.md'),good.replace('auditoria','unknown.route'),good.replace(file,'/tmp/260924_0400_auditoria_prova.md')];
 for(const value of commands)assert.equal(checkLocal(payload(root,value),root).code,2,value);
 for(const suffix of [' --title "$(touch /tmp/x)"',' --title "`touch /tmp/x`"',' --title *'])assert.equal(checkLocal(payload(root,good+suffix),root).code,2);
 const foreign=payload(os.tmpdir(),good);assert.throws(()=>authorizeDocumentCommand(foreign,root),/Cwd/);
 const workdir=payload(root,good);workdir.tool_input.workdir=os.tmpdir();assert.throws(()=>authorizeDocumentCommand(workdir,root),/Cwd/);
});
test('torn caducat, aliases físics i pending bloquegen mutacions però no check',t=>{
 const root=setup(t),turn=openTurn(root,{scope:'documents'}),good=command('context',turn,' --route auditoria');
 const record=path.join(root,`.agents/runtime/turns/${turn.turn_id}.json`);
 const expired=JSON.parse(fs.readFileSync(record,'utf8'));expired.expiresAt='2000-01-01T00:00:00Z';fs.writeFileSync(record,JSON.stringify(expired));
 assert.equal(checkLocal(payload(root,good),root).code,2);
 expired.expiresAt=new Date(Date.now()+3600000).toISOString();fs.writeFileSync(record,JSON.stringify(expired));
 fs.symlinkSync(path.join(root,'_wiki_de_poble/03_actuar'),path.join(root,'_wiki_de_poble/04_escriptori/alias'));
 assert.equal(checkLocal(payload(root,good.replace(file,'_wiki_de_poble/04_escriptori/alias/260924_0400_auditoria_prova.md')),root).code,2);
 const pending=path.join(root,'.agents/runtime/mutation.pending.json');fs.writeFileSync(pending,'{}');
 assert.equal(checkLocal(payload(root,good),root).code,2);
 const check=`node tooling/wiki/document.mjs check --file ${file}`;
 assert.equal(checkLocal(payload(root,check),root).code,0);
});

test('separadors Unicode i controls no poden canviar l’executable vist pel shell',t=>{
 const root=setup(t),base='node tooling/gates/obrir_torn.mjs --scope documents';
 for(const whitespace of ['\u00a0','\u2028','\u2029','\ufeff','\v','\f']) {
  for(const command of [base.replace('node ',`node${whitespace}`),whitespace+base,base+whitespace]) {
   assert.equal(checkLocal(payload(root,command),root).code,2,JSON.stringify(command));
  }
 }
 assert.equal(checkLocal(payload(root,base.replaceAll(' ','\t')),root).code,0,'tabulador ASCII coincideix amb el shell');
});
test('shell i entorn no es poden sobreescriure en cap dialecte',t=>{
 const root=setup(t),command='node tooling/gates/obrir_torn.mjs --scope documents';
 for(const location of ['root','tool_input','toolArgs']) {
  for(const key of ['shell','shellPath','shell_path','executable','interpreter','env','environment','environmentVariables','env_vars','login']) {
   const p=payload(root,command),container=location==='root'?p:(p[location]??={});
   container[key]=key==='login'?true:key.startsWith('env')?{NODE_OPTIONS:'--import ./untrusted.mjs'}:'/tmp/untrusted-shell';
   assert.equal(checkLocal(p,root).code,2,`${location}.${key}`);
  }
 }
});
test('command/cmd i CommandLine/Command divergents no poden tapar la comanda real',t=>{
 const root=setup(t),command='node tooling/gates/obrir_torn.mjs --scope documents';
 for(const key of ['cmd','CommandLine','Command']) {
  const p=payload(root,command);p.tool_input[key]='node untrusted.mjs';
  assert.equal(checkLocal(p,root).code,2,key);
 }
 const p=payload(root,command);p.toolArgs={CommandLine:'node untrusted.mjs'};
 assert.equal(checkLocal(p,root).code,2,'dialectes creuats');
});

test('la lectura i el fast-path executor també rebutgen metadata divergent abans d’autoritzar',t=>{
 const root=setup(t);
 const commands=['pwd','node tooling/gates/segella.mjs','node tooling/gates/executor-mutacio.mjs pla.json lease.json'];
 for(const command of commands) {
  const controls=[
   {command,cmd:'node other.mjs'},
   {cmd:command,shell:'/tmp/other-shell'},
   {cmd:command,env:{NODE_OPTIONS:'--import ./other.mjs'}},
   {cmd:command,workdir:os.tmpdir()},
   {cmd:command,login:true},
   {cmd:`\ufeff${command}`}
  ];
  for(const tool_input of controls) {
   const p={tool_name:'exec_command',cwd:root,tool_input};
   assert.equal(checkLocal(p,root).code,2,JSON.stringify(tool_input));
   assert.equal(knownRead(p,root),false,JSON.stringify(tool_input));
  }
 }
 assert.equal(checkLocal({tool_name:'exec_command',cwd:root,tool_input:{cmd:'pwd',workdir:root}},root).code,0);
 assert.equal(checkLocal({tool_name:'exec_command',cwd:root,tool_input:{cmd:'node tooling/gates/executor-mutacio.mjs pla.json lease.json',workdir:root}},root).code,0);
});
