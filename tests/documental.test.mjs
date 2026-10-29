import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {fixture,validDoc,writeDoc,relay,REPO,contract} from './helpers/documental.mjs';
import {loadContract,resolveRoute,hashFile} from '../tooling/documental/core.mjs';
import {openTurn,readTurn,deliverContext,validateDocument,bindPlan,checkTurn,sealTurn,inventory,mutateTurn} from '../tooling/documental/turns.mjs';
import {createDraft} from '../tooling/wiki/document.mjs';
import {checkDocuments} from '../tooling/gates/porta-documents.mjs';
const ok=()=>({valid:true,checks:[{name:'fixture',exit:0}],errors:[]});
function planned(t) {const root=fixture(t),d=validDoc(root);writeDoc(root,d);const plan=validDoc(root,{route:'pla.implementacio',turn:d.turn,suffix:'pla'});writeDoc(root,plan);bindPlan(root,d.turn.turn_id,plan.file);relay(root,d.turn.turn_id);return {root,d,plan};}
function git(root,...args){return execFileSync('git',args,{cwd:root,encoding:'utf8'});}

test('les rutes actives generen documents que passen el contracte',t=>{const root=fixture(t);for(const route of contract(root).router.rutes){const d=validDoc(root,{route:route.id,suffix:route.id.replaceAll('.','_')});assert.deepEqual(validateDocument(root,d.content,d.file),[],route.id);}});
test('encaminament explícit: prompt sense destinatari és ambigu',t=>{const root=fixture(t),c=loadContract(root);assert.throws(()=>resolveRoute(c,{intent:'prompt'}),/ambigua/);assert.equal(resolveRoute(c,{intent:'prompt',recipient:'local'}).id,'prompt.local');assert.throws(()=>resolveRoute(c,{route:'inventada'}),/desconeguda/);});
test('esquema viu invàlid bloqueja context nou però conserva el contracte emés',t=>{const root=fixture(t),d=validDoc(root);const file=path.join(root,'tooling/wiki/schema.json'),s=JSON.parse(fs.readFileSync(file));s.allOf=[];fs.writeFileSync(file,JSON.stringify(s));assert.throws(()=>loadContract(root),/no suportat/);assert.deepEqual(validateDocument(root,d.content,d.file),[]);fs.unlinkSync(file);assert.throws(()=>loadContract(root),/ENOENT/);assert.deepEqual(validateDocument(root,d.content,d.file),[]);});
test('plantilla i tipus del router han de coincidir',t=>{const root=fixture(t);const f=path.join(root,'.agents/protocolledge.json'),s=JSON.parse(fs.readFileSync(f));s.rutes[0].tipus='informe';fs.writeFileSync(f,JSON.stringify(s));assert.throws(()=>loadContract(root),/divergent/);});
test('torns diferents no es sobreescriuen i el rebut està vinculat al fitxer',t=>{const root=fixture(t),a=validDoc(root),b=validDoc(root,{suffix:'segon'});assert.notEqual(a.turn.turn_id,b.turn.turn_id);assert.deepEqual(validateDocument(root,a.content,a.file),[]);assert.match(validateDocument(root,a.content,b.file).join(),/altre document/);});
test('no accepta torn inventat, caducat ni ID amb traversal',t=>{const root=fixture(t),d=validDoc(root);assert.throws(()=>readTurn(root,'inventat'),/invàlid/);assert.throws(()=>readTurn(root,'../../fora'),/invàlid/);assert.throws(()=>readTurn(root,d.turn.turn_id,{now:Date.now()+86400001}),/caducat/);});
test('canviar plantilla conserva el contracte immutable del rebut',t=>{const root=fixture(t),d=validDoc(root);fs.appendFileSync(path.join(root,d.delivery.route.plantilla),'\nCanvi de plantilla.\n');assert.deepEqual(validateDocument(root,d.content,d.file),[]);});
test('un canvi al router no invalida rebuts versionats',t=>{const root=fixture(t),d=validDoc(root);fs.appendFileSync(path.join(root,'.agents/protocolledge.json'),'\n');assert.deepEqual(validateDocument(root,d.content,d.file),[]);});
test('generador crea i ancora, no sobreescriu, i el draft pendent no passa',t=>{const root=fixture(t),turn=openTurn(root);const o={route:'auditoria',file:'_wiki_de_poble/04_escriptori/260922_0300_auditoria_nova.md',title:'Nova auditoria',description:'Document generat de manera verificable'};createDraft(root,turn.turn_id,o);assert.match(fs.readFileSync(path.join(root,'_wiki_de_poble/04_escriptori/00_index_escriptori.md'),'utf8'),/auditoria_nova/);assert.match(validateDocument(root,fs.readFileSync(path.join(root,o.file),'utf8'),o.file).join(),/pendent/);assert.throws(()=>createDraft(root,turn.turn_id,o),/EEXIST/);});
test('cicle complet, check pur, i tancament immutable',t=>{const {root,d}=planned(t);const before=inventory(root),record=hashFile(path.join(root,'.agents/runtime/turns',d.turn.turn_id+'.json'));assert.equal(checkTurn(root,d.turn.turn_id).valid,true);assert.deepEqual(inventory(root),before);assert.equal(hashFile(path.join(root,'.agents/runtime/turns',d.turn.turn_id+'.json')),record);assert.equal(sealTurn(root,d.turn.turn_id,ok,{close:true}).state,'closed');assert.throws(()=>deliverContext(root,d.turn.turn_id,{route:'auditoria',file:d.file}),/tancat/);assert.deepEqual(validateDocument(root,d.content,d.file,{closed:true}),[]);assert.match(validateDocument(root,d.content+'\ncanvi',d.file,{closed:true}).join(),/després del tancament/);});
test('verificació fallida no canvia estat, i checks amb escriptures no segellen',t=>{const {root,d}=planned(t);const file=path.join(root,'.agents/runtime/turns',d.turn.turn_id+'.json'),before=hashFile(file);assert.throws(()=>sealTurn(root,d.turn.turn_id,()=>({valid:false,errors:['prova fallida']})),/prova fallida/);assert.equal(hashFile(file),before);assert.throws(()=>sealTurn(root,d.turn.turn_id,()=>{fs.appendFileSync(path.join(root,'.agents/ESTAT.md'),'canvi');return ok();}),/modificat/);assert.equal(hashFile(file),before);});
test('pla modificat, relleu absent i codi fora d’abast bloquegen',t=>{const {root,d,plan}=planned(t);fs.appendFileSync(path.join(root,plan.file),'canvi');fs.writeFileSync(path.join(root,'.agents/LEDGER.md'),'sense torn');fs.mkdirSync(path.join(root,'src'));fs.writeFileSync(path.join(root,'src/new.js'),'export {};');const e=checkTurn(root,d.turn.turn_id).errors.join();assert.match(e,/Pla absent o modificat/);assert.match(e,/LEDGER/);assert.match(e,/abast documental/);});
test('lock per torn evita escriptures concurrents',t=>{const {root,d}=planned(t);const lock=path.join(root,'.agents/runtime/turns',d.turn.turn_id+'.json.lock');fs.writeFileSync(lock,'ocupat');assert.throws(()=>mutateTurn(root,d.turn.turn_id,()=>{}),/EEXIST/);assert.equal(readTurn(root,d.turn.turn_id).state,'planned');});
test('porta final detecta document escrit per shell sense passar pel hook',t=>{const root=fixture(t);git(root,'init','-q');git(root,'add','.');git(root,'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture');fs.writeFileSync(path.join(root,'_wiki_de_poble/04_escriptori/260922_0300_informe_shell.md'),'sense YAML');const r=checkDocuments(root);assert.equal(r.valid,false);assert.match(r.errors.join(),/Frontmatter/);});
test('staging comprova contingut i rebuts de l’índex, no el text reparat al disc',t=>{const {root,d}=planned(t);sealTurn(root,d.turn.turn_id,ok,{close:true});git(root,'init','-q');git(root,'add','.');assert.equal(checkDocuments(root,{staged:true}).valid,true);fs.writeFileSync(path.join(root,d.file),'text corrupte');git(root,'add',d.file);fs.writeFileSync(path.join(root,d.file),d.content);assert.equal(checkDocuments(root,{staged:true}).valid,false);});
test('--check del compilador no escriu i exclou els registres runtime',t=>{const root=fixture(t);for(const f of ['tooling/wiki/compile-wiki-to-app.mjs','tooling/wiki/lib/frontmatter.mjs','tooling/wiki/lib/publication-policy.mjs','tooling/scripts/canonada.mjs','tooling/lib/arrel.mjs']){fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});fs.copyFileSync(path.join(REPO,f),path.join(root,f));}fs.mkdirSync(path.join(root,'src/data'),{recursive:true});const manifest=path.join(root,'src/data/wikiManifest.js');fs.writeFileSync(manifest,'original');const before=hashFile(manifest);const p=spawnSync(process.execPath,['tooling/wiki/compile-wiki-to-app.mjs','--check'],{cwd:root,encoding:'utf8'});assert.equal(hashFile(manifest),before);assert.ok([0,1].includes(p.status));const t1=openTurn(root);const generate=spawnSync(process.execPath,['tooling/wiki/compile-wiki-to-app.mjs'],{cwd:root,encoding:'utf8'});assert.equal(generate.status,0);assert.ok(!fs.readFileSync(manifest,'utf8').includes(t1.turn_id));});

test('una àncora en exemple o comentari no compta com a enllaç real',t=>{const {root,d}=planned(t);const index=path.join(root,'_wiki_de_poble/04_escriptori/00_index_escriptori.md');const link=`[[${path.basename(d.file,'.md')}]]`;let s=fs.readFileSync(index,'utf8');s=s.replace(`- ${link}`,`<!-- ${link} -->\n\`\`\`md\n${link}\n\`\`\``);fs.writeFileSync(index,s);assert.match(checkTurn(root,d.turn.turn_id).errors.join(),/sense àncora/);});
test('CLI tancament rebutja torn inventat abans de qualsevol procés amb efectes',()=>{const p=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/tancament.mjs'),'--check','--turn-id=inventat','--json'],{encoding:'utf8'});assert.equal(p.status,1);assert.match(p.stderr,/Identificador de torn invàlid/);});


test('Llibre permanent: només la ruta física canònica i type document, amb esquema vàlid', t => {
  const root = fixture(t), file = '_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md';
  const raw = '---\ntype: document\nstatus: canonic\ndescription: Llibre Mestre permanent de tasques i idees\ntags: [govern, arquitectura, pla]\n---\n# Llibre\n';
  fs.writeFileSync(path.join(root, file), raw);
  assert.deepEqual(validateDocument(root, raw, file), []);
  assert.match(validateDocument(root, raw.replace('govern', 'backlog'), file).join(), /tags/);
  for (const other of ['_wiki_de_poble/10_actes/03_llibre_mestre_tasques_i_idees.md', '_wiki_de_poble/04_escriptori/sub/03_llibre_mestre_tasques_i_idees.md', '_wiki_de_poble/04_escriptori/260922_0300_auditoria_exempta.md']) assert.match(validateDocument(root, raw, other).join(), /rebut persistent/);
  assert.match(validateDocument(root, raw.replace('type: document', 'type: prompt'), file).join(), /rebut persistent/);
  const alias = '_wiki_de_poble/04_escriptori/alias.md';
  fs.symlinkSync(path.basename(file), path.join(root, alias));
  assert.match(validateDocument(root, raw, alias).join(), /rebut persistent/);
});
test('Llibre permanent: staging continua exigint àncora', t => {
  const root = fixture(t), file = '_wiki_de_poble/04_escriptori/03_llibre_mestre_tasques_i_idees.md';
  fs.writeFileSync(path.join(root, file), '---\ntype: document\nstatus: canonic\ndescription: Llibre Mestre permanent de tasques i idees\ntags: [govern]\n---\n# Llibre\n');
  git(root, 'init', '-q'); git(root, 'add', '.');
  assert.match(checkDocuments(root, { staged: true }).errors.join(), /Sense àncora/);
  fs.appendFileSync(path.join(root, '_wiki_de_poble/04_escriptori/00_index_escriptori.md'), '\n- [[03_llibre_mestre_tasques_i_idees]]\n');
  git(root, 'add', '.');
  assert.equal(checkDocuments(root, { staged: true }).valid, true);
});


test('expire-close històric amb hashes coincidents no acredita verificació; els checks legítims es conserven', t => {
  const { root, d } = planned(t);
  sealTurn(root, d.turn.turn_id, ok, { close: true });
  const record = path.join(root, '.agents/runtime/turns', `${d.turn.turn_id}.json`);
  const turn = JSON.parse(fs.readFileSync(record));
  const genuine = structuredClone(turn.verification.checks);
  assert.deepEqual(validateDocument(root, d.content, d.file, { closed: true }), []);
  git(root, 'init', '-q'); git(root, 'add', '.');
  assert.equal(checkDocuments(root, { staged: true }).valid, true);

  // Only the claimed checks change: the document and its verified file hash are identical.
  turn.verification.checks = ['expire-close'];
  fs.writeFileSync(record, JSON.stringify(turn));
  assert.match(validateDocument(root, d.content, d.file, { closed: true }).join(), /expire-close només acredita caducitat/);
  git(root, 'add', '.');
  assert.match(checkDocuments(root, { staged: true }).errors.join(), /expire-close només acredita caducitat/);

  // A later administrative expiry does not invalidate an authentic earlier verification.
  turn.verification.checks = genuine;
  turn.closure = { reason: 'expired', at: new Date().toISOString(), previousState: 'verified' };
  turn.history.push({ action: 'expire-close', state: 'closed', at: turn.closure.at });
  fs.writeFileSync(record, JSON.stringify(turn));
  assert.deepEqual(validateDocument(root, d.content, d.file, { closed: true }), []);
  git(root, 'add', '.');
  assert.equal(checkDocuments(root, { staged: true }).valid, true);
});
