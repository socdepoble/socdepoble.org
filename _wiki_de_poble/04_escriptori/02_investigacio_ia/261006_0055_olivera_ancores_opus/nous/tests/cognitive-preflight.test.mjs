import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {fixture, REPO} from './helpers/documental.mjs';
import {openTurn, deliverContext, readTurn, checkTurn, bindPlan, protectedTurnFiles, ownPaths, mutateTurn, validateDocument} from '../tooling/documental/turns.mjs';
import * as turns from '../tooling/documental/turns.mjs';
import {validDoc, writeDoc, relay} from './helpers/documental.mjs';
import {inspeccionaText} from '../tooling/gates/porta-plantilla-viva.mjs';
import {draft} from '../tooling/wiki/document.mjs';
import {createDraft} from '../tooling/wiki/document.mjs';
import {anchored, withoutCode} from '../tooling/documental/core.mjs';
import {checkTaula, vius, ranci, avui, ancoratge, arxiva, arxivables, inventari} from '../tooling/gates/porta-olivera.mjs';
const DESK='_wiki_de_poble/04_escriptori';
const INDEX=`${DESK}/00_index_escriptori.md`;
const doc=(name)=>`${DESK}/${avui()}_1230_${name}.md`;
function put(root,file,content) { fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true}); fs.writeFileSync(path.join(root,file),content); }
function dirty(root) {
 put(root,`${DESK}/250101_0900_auditoria_consumida.md`,'# Consumida\n');
 fs.appendFileSync(path.join(root,INDEX),'\n## Altres\n\n- [[250101_0900_auditoria_consumida]]\n');
}
const options=(route='prompt.local')=>({route,file:doc('prompt_prova'),title:'Prova',description:'Preflight de convocatòria'});
for (const route of ['prompt.local','prompt.consell']) test(`context ${route} denega taula bruta sense crear un rebut`,t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),before=readTurn(root,turn.turn_id);
 dirty(root);
 assert.throws(()=>deliverContext(root,turn.turn_id,options(route)),/Convocatòria amb Escriptori brut/);
 assert.deepEqual(readTurn(root,turn.turn_id),before);
 assert.equal(fs.existsSync(path.join(root,'.agents/runtime/contracts')),false);
});
test('create revalida una taula embrutada després de context i conserva els documents existents',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=options();
 deliverContext(root,turn.turn_id,opts);
 const before=readTurn(root,turn.turn_id);
 dirty(root);
 const indexBefore=fs.readFileSync(path.join(root,INDEX),'utf8');
 assert.throws(()=>createDraft(root,turn.turn_id,opts),/Convocatòria amb Escriptori brut/);
 assert.deepEqual(readTurn(root,turn.turn_id),before);
 assert.equal(fs.existsSync(path.join(root,opts.file)),false);
 assert.equal(fs.readFileSync(path.join(root,INDEX),'utf8'),indexBefore);
});
test('una auditoria pot descriure la taula bruta sense relaxar la convocatòria',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}); dirty(root);
 const opts={...options('auditoria'),file:doc('auditoria_prova')};
 createDraft(root,turn.turn_id,opts);
 assert.ok(fs.existsSync(path.join(root,opts.file)));
 assert.ok(vius(root).has(path.basename(opts.file,'.md')));
 assert.equal(checkTaula(root).valid,false,'el deute previ continua visible');
});
for (const heading of ['','## Activitat en curs','## Activitat en curs (marató)']) test(`l'ancoratge és viu amb capçalera «${heading || 'absent'}» i sobreviu a mitjanit`,t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts={...options('auditoria'),file:doc('auditoria_prova')};
 const prefix=`# Índex\n\n${heading ? heading+'\n\n### Notes del torn\n\n' : ''}`;
 const tail='## Referències\n\nText humà que cal conservar íntegre.\n';
 put(root,INDEX,prefix+tail);
 createDraft(root,turn.turn_id,opts);
 const index=fs.readFileSync(path.join(root,INDEX),'utf8');
 assert.ok(index.includes(tail));
 assert.ok(vius(root).has(path.basename(opts.file,'.md')));
 assert.deepEqual(ranci(root,'991231'),[]);
 assert.equal(checkTaula(root,{dia:'991231'}).valid,true);
});
test('una àncora fora d’Activitat queda intacta i el document nou queda viu',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts={...options('auditoria'),file:doc('auditoria_prova')};
 const anchor=`[[${path.basename(opts.file,'.md')}]]`;
 const ref=`Vegeu ${anchor} per al context.\n`;
 put(root,INDEX,`# Índex\n\n## Activitat en curs\n\n## Referències\n\n${ref}`);
 createDraft(root,turn.turn_id,opts);
 assert.ok(fs.readFileSync(path.join(root,INDEX),'utf8').includes(ref));
 assert.ok(vius(root).has(path.basename(opts.file,'.md')));
});
test('l’informe usa l’arrel de l’eina quan cwd és una subcarpeta o un altre lloc',t=>{
 const root=fixture(t); dirty(root);
 for (const f of ['tooling/gates/porta-olivera.mjs','tooling/lib/arrel.mjs','.agents/AGENTS.md']) {
  fs.mkdirSync(path.dirname(path.join(root,f)),{recursive:true});fs.copyFileSync(path.join(REPO,f),path.join(root,f));
 }
 const env={...process.env};delete env.SDP_ARREL;
 for (const cwd of [path.join(root,'_wiki_de_poble'),os.tmpdir()]) {
  const p=spawnSync(process.execPath,[path.join(root,'tooling/gates/porta-olivera.mjs'),'--informe'],{cwd,env,encoding:'utf8',timeout:10000});
  assert.equal(p.status,1,p.stderr);
  assert.match(p.stdout,/250101_0900_auditoria_consumida/);
 }
});
test('taula o índex absents i índex no regular no poden donar verd',t=>{
 const root=fixture(t);
 const empty=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-empty-desk-'));t.after(()=>fs.rmSync(empty,{recursive:true,force:true}));
 assert.equal(checkTaula(empty).valid,false);
 fs.unlinkSync(path.join(root,INDEX));
 assert.equal(checkTaula(root).valid,false);
 fs.mkdirSync(path.join(root,INDEX));
 assert.equal(checkTaula(root).valid,false);
});
test('CLI amb una arrel explícita sense taula retorna error i diagnòstic',t=>{
 const empty=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-empty-desk-cli-'));t.after(()=>fs.rmSync(empty,{recursive:true,force:true}));
 const p=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-olivera.mjs'),'--informe'],{cwd:REPO,env:{...process.env,SDP_ARREL:empty},encoding:'utf8',timeout:10000});
 assert.equal(p.status,1,p.stderr);
 assert.match(p.stderr,/Estructura de l'Escriptori absent/);
 assert.doesNotMatch(p.stdout,/✅/);
});

test('capçaleres i àncores d’exemple no desvien l’ancoratge real del nou document',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts={...options('auditoria'),file:doc('auditoria_prova')};
 const anchor=`[[${path.basename(opts.file,'.md')}]]`;
 const example=`\`\`\`markdown\n## Activitat en curs\n- ${anchor}\n\`\`\`\n`;
 const comment=`<!--\n## Activitat en curs\n- ${anchor}\n-->\n`;
 put(root,INDEX,`# Índex\n\n${example}${comment}\n## Activitat en curs\n\n## Referències\n`);
 createDraft(root,turn.turn_id,opts);
 const index=fs.readFileSync(path.join(root,INDEX),'utf8');
 assert.ok(index.includes(example));assert.ok(index.includes(comment));
 assert.ok(anchored(index,opts.file));
 assert.equal(withoutCode(index).split(anchor).length-1,1,'una sola àncora real');
});

test('un exemple inline no substituïx l’àncora real del nou esborrany',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts={...options('auditoria'),file:doc('auditoria_inline')};
 const anchor=`[[${path.basename(opts.file,'.md')}]]`;
 const example=`Exemple en línia: \`${anchor}\`\n`;
 put(root,INDEX,`# Índex\n\n## Activitat en curs\n\n${example}`);
 createDraft(root,turn.turn_id,opts);
 const index=fs.readFileSync(path.join(root,INDEX),'utf8');
 assert.ok(index.includes(example));
 assert.ok(anchored(index,opts.file),'àncora real fora de l’exemple inline');
 assert.equal(checkTaula(root).valid,true);
});
test('crear prompt revalida dins del lock després del rebut si entra un document alié',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=options();
 const original=fs.writeFileSync;
 let injected=false;
 fs.writeFileSync=(file,...args)=>{
  const result=original(file,...args);
  if (!injected && typeof file==='string' && file.includes(`${path.sep}runtime${path.sep}contracts${path.sep}`)) {
   injected=true;
   original(path.join(root,DESK,'250101_0900_auditoria_aliena.md'),'# Auditoria aliena\n');
  }
  return result;
 };
 try { assert.throws(()=>createDraft(root,turn.turn_id,opts),/Convocatòria amb Escriptori brut/); }
 finally {fs.writeFileSync=original;}
 assert.equal(injected,true,'la finestra posterior al context s’exercita');
 assert.equal(fs.existsSync(path.join(root,opts.file)),false);
 assert.equal(fs.existsSync(path.join(root,'.agents/runtime/document-create.lock')),false);
 assert.equal(Object.keys(readTurn(root,turn.turn_id).receipts).length,1,'el rebut ja emés es conserva com a evidència');
 assert.equal(checkTaula(root).valid,false,'la incidència aliena continua visible');
});

test('importar funcions de torn en una còpia sense marcador no exigix arrel implícita; CLI falla tancat',t=>{
 const stripped=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-stripped-tools-')));
 t.after(()=>fs.rmSync(stripped,{recursive:true,force:true}));
 for (const file of ['tooling/documental/turns.mjs','tooling/documental/core.mjs','tooling/wiki/lib/frontmatter.mjs','tooling/lib/arrel.mjs','tooling/gates/porta-olivera.mjs']) {
  fs.mkdirSync(path.dirname(path.join(stripped,file)),{recursive:true});fs.copyFileSync(path.join(REPO,file),path.join(stripped,file));
 }
 fs.symlinkSync(fs.realpathSync(path.join(REPO,'node_modules')),path.join(stripped,'node_modules'),'dir');
 const env={...process.env};delete env.SDP_ARREL;
 const url=pathToFileURL(path.join(stripped,'tooling/documental/turns.mjs')).href;
 const source=`const {inventory}=await import(${JSON.stringify(url)}); if (typeof inventory !== 'function') throw new Error('missing export');`;
 const imported=spawnSync(process.execPath,['--input-type=module','--eval',source],{cwd:stripped,env,encoding:'utf8',timeout:10000});
 assert.equal(imported.status,0,imported.stderr);
 const cli=spawnSync(process.execPath,[path.join(stripped,'tooling/gates/porta-olivera.mjs'),'--informe'],{cwd:stripped,env,encoding:'utf8',timeout:10000});
 assert.equal(cli.status,2,cli.stdout);
 assert.match(cli.stderr,/Arrel no trobada/);
 assert.doesNotMatch(cli.stdout,/✅/);
 assert.doesNotMatch(cli.stderr,/\n\s+at /,'diagnòstic sense stack cru');
});


// T5-10: un derivat és evidència de treball encara que no siga Markdown.
for (const extension of ['jpg','json','patch','html','PNG']) test(`recurs .${extension} exigix àncora exacta i no es declara fantasma quan existix`,t=>{
 const root=fixture(t),name=`x.${extension}`,file=`${DESK}/${name}`;
 const bytes=Buffer.from([0,255,10,13,127]);put(root,file,bytes);
 assert.deepEqual(ancoratge(root),{senseAncora:[name],fantasma:[]});
 assert.equal(checkTaula(root).valid,false,'el recurs no ancorat no pot donar verd');
 put(root,INDEX,`# Índex\n\n- [[${name}]]\n`);
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[]});
 assert.equal(checkTaula(root).valid,true,'recurs existent amb extensió exacta');
 assert.deepEqual(fs.readFileSync(path.join(root,file)),bytes,'diagnosticar no transforma els bytes');
 fs.unlinkSync(path.join(root,file));
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[name]});
 assert.equal(checkTaula(root).valid,false,'una àncora al recurs absent fa caure la porta');
});
test('fragments, àlies escapats i camins de primer nivell resolen el recurs exacte',t=>{
 const root=fixture(t),name='prova.report.json';put(root,`${DESK}/${name}`,'{}\n');
 for (const ref of [name,`04_escriptori/${name}`,`${DESK}/${name}`,`${name}#Resultats|informe`,`${name}\\|informe`]) {
  put(root,INDEX,`# Índex\n\n| Evidència |\n| --- |\n| [[${ref}]] |\n`);
  assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[]},ref);
 }
 fs.unlinkSync(path.join(root,DESK,name));
 put(root,INDEX,`# Índex\n- [[04_escriptori/${name}]]\n`);
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[`04_escriptori/${name}`]});
});
test('un homònim sense extensió, extern, comentat o en codi no ancora un recurs',t=>{
 const root=fixture(t),name='x.jpg';put(root,`${DESK}/${name}`,'x');
 for (const ref of ['[[x]]','[[x.md]]',`[[../90_arxiu_historic/${name}]]`,`[[02_investigacio_ia/${name}]]`,`<!-- [[${name}]] -->`,`\`[[${name}]]\``,`\`\`\`markdown\n[[${name}]]\n\`\`\``]) {
  put(root,INDEX,`# Índex\n${ref}\n`);
  assert.deepEqual(ancoratge(root).senseAncora,[name],ref);
  assert.equal(checkTaula(root).valid,false,ref);
 }
});
test('l’àncora amb extensió distingix x.jpg de x.jpg.md sense acreditar-los junts',t=>{
 const root=fixture(t);put(root,`${DESK}/x.jpg`,'image');put(root,`${DESK}/x.jpg.md`,'# nota\n');
 put(root,INDEX,'# Índex\n- [[x.jpg]]\n');
 assert.deepEqual(ancoratge(root),{senseAncora:['x.jpg.md'],fantasma:[]});
 fs.appendFileSync(path.join(root,INDEX),'- [[x.jpg.md]]\n');
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[]});
});
test('els recursos i Markdown sense nom termodinàmic s’ancoren però l’arxivat de torn continua acotat',t=>{
 const root=fixture(t),resource='250101_0900_auditoria_prova.json',note='notes humanes.md';
 put(root,`${DESK}/${resource}`,'{}\n');put(root,`${DESK}/${note}`,'# nota\n');
 assert.deepEqual(ancoratge(root).senseAncora,[resource,note]);
 put(root,INDEX,`# Índex\n- [[${resource}]]\n- [[notes humanes]]\n`);
 assert.equal(checkTaula(root).valid,true);
 assert.deepEqual(inventari(root),[],'només metadades Markdown termodinàmiques');
 assert.deepEqual(ranci(root,'991231'),[],'cap política nova d’envelliment de recursos');
 assert.deepEqual(arxivables(root),[]);
 // 261006: un artefacte de torn amb nom termodinàmic ix per nom, de qualsevol extensió.
 assert.deepEqual(arxivables(root,{noms:[resource]}).map(d=>d.nom),[resource]);
 assert.deepEqual(arxiva(root),{moguts:[],index:false,sec:false});
 assert.equal(fs.readFileSync(path.join(root,DESK,resource),'utf8'),'{}\n');
 assert.equal(fs.readFileSync(path.join(root,DESK,note),'utf8'),'# nota\n');
});

test('una activitat del recurs homònim sense extensió no protegix el Markdown ranci',t=>{
 const root=fixture(t),stem='250101_0900_auditoria_homonima';
 put(root,`${DESK}/${stem}`,'resource');put(root,`${DESK}/${stem}.md`,'# Document\n');
 put(root,INDEX,`# Índex\n\n## Activitat en curs\n- [[${stem}]]\n\n## Referències\n- [[${stem}.md]]\n`);
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[]});
 assert.deepEqual(ranci(root,'991231').map(d=>d.nom),[`${stem}.md`]);
 assert.equal(checkTaula(root,{dia:'991231'}).valid,false);
 fs.appendFileSync(path.join(root,INDEX),`\n## Activitat en curs (document)\n- [[${stem}.md]]\n`);
 assert.deepEqual(ranci(root,'991231'),[],'amb declaració exacta Markdown, el document continua viu');
 assert.equal(checkTaula(root,{dia:'991231'}).valid,true);
});

test('els controls ocults i carpetes permanents no entren en l’ancoratge de la taula',t=>{
 const root=fixture(t);
 put(root,`${DESK}/.DS_Store`,Buffer.from([0,255,10]));
 put(root,`${DESK}/.ancora_sessio.json`,'{"control":true}\n');
 put(root,`${DESK}/01_produccio/prova.jpg`,'human');
 put(root,`${DESK}/02_investigacio_ia/prova.json`,'{}\n');
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[]});
 assert.equal(checkTaula(root).valid,true);
 assert.deepEqual(arxiva(root),{moguts:[],index:false,sec:false});
 assert.equal(fs.readFileSync(path.join(root,DESK,'01_produccio/prova.jpg'),'utf8'),'human');
 assert.equal(fs.readFileSync(path.join(root,DESK,'.ancora_sessio.json'),'utf8'),'{"control":true}\n');
});

test('CLI informe jutja els recursos visibles: sense àncora roja, amb nom exacte verda i absent roja',t=>{
 const root=fixture(t),name='prova.jpg';put(root,`${DESK}/${name}`,Buffer.from([255,216,255]));
 const run=()=>spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-olivera.mjs'),'--informe'],{cwd:os.tmpdir(),env:{...process.env,SDP_ARREL:root},encoding:'utf8',timeout:10000});
 let result=run();assert.equal(result.status,1,result.stderr);assert.match(result.stdout,/Sense àncora a l'índex: prova\.jpg/);
 put(root,INDEX,`# Índex\n- [[${name}]]\n`);
 result=run();assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/Artefactes regulars visibles de primer nivell: 1/);
 fs.unlinkSync(path.join(root,DESK,name));
 result=run();assert.equal(result.status,1,result.stderr);assert.match(result.stdout,/Àncores a documents absents.*prova\.jpg/);
});

test('una extensió de recurs explícita absent no es reapunta a un homònim Markdown',t=>{
 const root=fixture(t);put(root,`${DESK}/x.jpg`,'image');put(root,`${DESK}/x.jpg.md`,'# Document\n');
 put(root,INDEX,'# Índex\n- [[x.jpg]]\n- [[x.jpg.md]]\n');
 assert.equal(checkTaula(root).valid,true);
 fs.unlinkSync(path.join(root,DESK,'x.jpg'));
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:['x.jpg']},'l’evidència desapareguda continua denunciada');
 assert.equal(checkTaula(root).valid,false);
 put(root,INDEX,'# Índex\n- [[x.jpg.md]]\n');
 assert.equal(checkTaula(root).valid,true,'el document amb punts s’ancora amb .md explícit');
});


/* T5-09: proves de fallada amb el writer real, sense esborrar rebuts ni fitxers. */
function failCAS(root, turn, opts, {replace = false} = {}) {
 const original=fs.writeFileSync;let injected=false, raw, failure;
 const anchor=`[[${path.basename(opts.file,'.md')}]]`;
 fs.writeFileSync=(file,data,...args)=>{
  const result=original(file,data,...args);
  if(typeof file==='number'&&typeof data==='string'&&data.startsWith('---')&&data.includes(`sdp:${turn.turn_id}:`))raw=data;
  if(!injected&&typeof file==='number'&&typeof data==='string'&&data.includes(anchor)) {
   injected=true;fs.appendFileSync(path.join(root,INDEX),'\nText legítim concurrent.\n');
   if(replace) {
    fs.renameSync(path.join(root,opts.file),path.join(root,opts.file+'.owned-backup'));
    original(path.join(root,opts.file),'Document concurrent que no és nostre.\n');
   }
  }
  return result;
 };
 try{createDraft(root,turn.turn_id,opts);}catch(error){failure=error;}finally{fs.writeFileSync=original;}
 assert.equal(injected,true);assert.match(failure?.message||'',/substituït/);
 return {failure,raw,record:readTurn(root,turn.turn_id)};
}
const optsFailed=(suffix='cas')=>({...options('auditoria'),file:doc(`auditoria_failed_${suffix}`)});
function priorPlan(root,turn) {
 const plan=validDoc(root,{turn,route:'pla.implementacio',suffix:'pla_previ'});writeDoc(root,plan);bindPlan(root,turn.turn_id,plan.file);relay(root,turn.turn_id);
 return readTurn(root,turn.turn_id).plan;
}
test('T5-09 · rollback CAS conserva una entrega real fallida i no exigix document fantasma',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed();
 const {record}=failCAS(root,turn,opts);const receipts=Object.values(record.receipts);
 assert.equal(receipts.length,1,'la traça d’entrega real es conserva');
 assert.equal(receipts[0].creation?.state,'failed');assert.equal(receipts[0].creation.absent,true);
 assert.ok(record.history.some(h=>h.action==='create-failed'&&h.receiptId===receipts[0].id));
 assert.equal(fs.existsSync(path.join(root,opts.file)),false);
 assert.ok(fs.readFileSync(path.join(root,INDEX),'utf8').includes('Text legítim concurrent.'));
 assert.ok(!checkTurn(root,turn.turn_id).errors.some(e=>e.includes('Document eliminat sense relleu')));
 assert.equal(protectedTurnFiles(root).has(opts.file),false);
});
test('T5-09 · un create fallit conserva el pla vinculat i permet tancar el torn documental net',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),plan=priorPlan(root,turn),opts=optsFailed('planned');
 const {record}=failCAS(root,turn,opts);
 assert.deepEqual(record.plan,plan);assert.equal(record.state,'planned');
 assert.equal(checkTurn(root,turn.turn_id).valid,true);
});
test('T5-09 · context CLI legacy continua exigint el seu document',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('legacy');
 deliverContext(root,turn.turn_id,opts);const receipt=Object.values(readTurn(root,turn.turn_id).receipts)[0];
 assert.equal(Object.hasOwn(receipt,'creation'),false);
 assert.ok(checkTurn(root,turn.turn_id).errors.some(e=>e.includes('Document eliminat sense relleu')));
 assert.equal(protectedTurnFiles(root).has(opts.file),true);
});
test('T5-09 · un reflex failed no es pot reproduir ni amagar amb ownership alié',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('replay');
 priorPlan(root,turn);const {raw}=failCAS(root,turn,opts);
 const replay=raw.replaceAll('[pendent]','Comprovat amb evidència.');
 fs.writeFileSync(path.join(root,opts.file),replay);fs.appendFileSync(path.join(root,INDEX),`\n- [[${path.basename(opts.file,'.md')}]]\n`);
 ownPaths(root,turn.turn_id,[doc('auditoria_aliena')]);
 assert.match(validateDocument(root,replay,opts.file).join(),/creació fallida/i);
 assert.match(checkTurn(root,turn.turn_id).errors.join(),/creació fallida/i);
 assert.match(inspeccionaText(root,opts.file,replay).errors.join(),/creació fallida/i);
});
test('T5-09 · reusar el mateix path amb un context nou autenticat no reactiva el rebut failed',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('newcontext');
 priorPlan(root,turn);failCAS(root,turn,opts);
 const delivery=deliverContext(root,turn.turn_id,opts);
 const content=draft(delivery,opts).replaceAll('[pendent]','Comprovat amb evidència.');
 fs.writeFileSync(path.join(root,opts.file),content);fs.appendFileSync(path.join(root,INDEX),`\n- [[${path.basename(opts.file,'.md')}]]\n`);
 assert.deepEqual(validateDocument(root,content,opts.file),[]);
 assert.equal(checkTurn(root,turn.turn_id).valid,true);
 assert.equal(Object.values(readTurn(root,turn.turn_id).receipts).filter(r=>r.creation?.state==='failed').length,1);
 assert.equal(protectedTurnFiles(root).has(opts.file),true);
});
test('T5-09 · reintentar create al mateix path deixa traça failed i un nou committed real',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('retry');
 failCAS(root,turn,opts);createDraft(root,turn.turn_id,opts);
 const receipts=Object.values(readTurn(root,turn.turn_id).receipts);
 assert.deepEqual(receipts.map(r=>r.creation?.state),['failed','committed']);
 assert.match(receipts[1].creation.documentHash,/^[a-f0-9]{64}$/);
 assert.ok(fs.existsSync(path.join(root,opts.file)));
});
test('T5-09 · un fitxer concurrent existent no es certifica absent ni esborra',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('partial');
 const {record}=failCAS(root,turn,opts,{replace:true});
 assert.equal(Object.values(record.receipts)[0].creation?.state,'prepared');
 assert.equal(fs.readFileSync(path.join(root,opts.file),'utf8'),'Document concurrent que no és nostre.\n');
 assert.match(checkTurn(root,turn.turn_id).errors.join(),/creació pendent/i);
});
test('T5-09 · si falla consolidar el rebut, conserva draft i índex però queda prepared visible',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('commit');
 const original=fs.writeFileSync;let injected=false;
 fs.writeFileSync=(file,data,...args)=>{
  if(typeof file==='string'&&file.includes(`${path.sep}turns${path.sep}`)&&typeof data==='string'&&data.includes('create-committed')) {
   injected=true;throw new Error('EIO: fallada sintètica consolidant rebut');
  }
  return original(file,data,...args);
 };
 try{assert.throws(()=>createDraft(root,turn.turn_id,opts),/EIO: fallada sintètica/);}finally{fs.writeFileSync=original;}
 assert.equal(injected,true);assert.equal(fs.existsSync(path.join(root,opts.file)),true);
 assert.ok(anchored(fs.readFileSync(path.join(root,INDEX),'utf8'),opts.file));
 const receipt=Object.values(readTurn(root,turn.turn_id).receipts)[0];
 assert.equal(receipt.creation?.state,'prepared');assert.equal(protectedTurnFiles(root).has(opts.file),true);
 assert.match(checkTurn(root,turn.turn_id).errors.join(),/creació pendent/i);
});
test('T5-09 · un únic rebut failed no és context actiu per a vincular un pla',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('bind');failCAS(root,turn,opts);
 const plan=validDoc(root,{route:'pla.implementacio',suffix:'pla_d_un_altre_torn'});writeDoc(root,plan);
 assert.throws(()=>bindPlan(root,turn.turn_id,plan.file),/context actiu/i);
});
test('T5-09 · un symlink sobre el path failed falla tancat sense llegir-ne el destí privat',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('symlink');failCAS(root,turn,opts);
 const outside=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-private-failed-'));t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));
 const target=path.join(outside,'privat.md');fs.writeFileSync(target,'CONTINGUT_PRIVAT_NO_LLEGIR');fs.symlinkSync(target,path.join(root,opts.file));
 const original=fs.readFileSync;let outsideRead=false;
 fs.readFileSync=(file,...args)=>{if(file===target||file===path.join(root,opts.file))outsideRead=true;return original(file,...args);};
 try{assert.match(checkTurn(root,turn.turn_id).errors.join(),/creació fallida.*no regular/i);}finally{fs.readFileSync=original;}
 assert.equal(outsideRead,false);assert.equal(fs.readFileSync(target,'utf8'),'CONTINGUT_PRIVAT_NO_LLEGIR');
});

test('T5-09 · recuperar una creació prepared comprova bytes i àncora abans de committed',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('recover');
 const delivery=deliverContext(root,turn.turn_id,{...opts,creation:true}),raw=draft(delivery,opts);
 fs.writeFileSync(path.join(root,opts.file),raw);fs.appendFileSync(path.join(root,INDEX),`\n- [[${path.basename(opts.file,'.md')}]]\n`);
 assert.throws(()=>turns.commitCreation(root,turn.turn_id,delivery.reflex,raw+'CANVI'),/pendent/);
 assert.equal(Object.values(readTurn(root,turn.turn_id).receipts)[0].creation.state,'prepared');
 turns.commitCreation(root,turn.turn_id,delivery.reflex,raw);
 assert.equal(Object.values(readTurn(root,turn.turn_id).receipts)[0].creation.state,'committed');
 assert.ok(!checkTurn(root,turn.turn_id).errors.some(e=>/creació pendent/i.test(e)));
});
test('T5-09 · una fase prepared no autoritza documents encara que s’invente un tancament independent',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('fakeclosed');
 const delivery=deliverContext(root,turn.turn_id,{...opts,creation:true}),raw=draft(delivery,opts).replaceAll('[pendent]','Comprovat amb evidència.');
 fs.writeFileSync(path.join(root,opts.file),raw);
 mutateTurn(root,turn.turn_id,record=>{record.state='closed';});
 assert.match(validateDocument(root,raw,opts.file,{closed:true}).join(),/creació pendent/i);
 assert.match(inspeccionaText(root,opts.file,raw).errors.join(),/creació pendent/i);
});
test('T5-09 · un reflex inventat al path failed no s’oculta darrere ownership',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('unknownreplay');
 priorPlan(root,turn);const {raw,record}=failCAS(root,turn,opts);
 const id=Object.values(record.receipts).at(-1).id;
 const fake=raw.replace(id,'00000000-0000-4000-8000-000000000000').replaceAll('[pendent]','Comprovat amb evidència.');
 fs.writeFileSync(path.join(root,opts.file),fake);ownPaths(root,turn.turn_id,[doc('auditoria_aliena')]);
 assert.match(checkTurn(root,turn.turn_id).errors.join(),/Rebut absent/i);
});

test('T5-09 · afegir una fase failed sense traça real no eximix el document obligatori',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts=optsFailed('inventedphase');
 deliverContext(root,turn.turn_id,opts);
 mutateTurn(root,turn.turn_id,record=>{const r=Object.values(record.receipts)[0];r.creation={state:'failed',preparedAt:r.issuedAt,failedAt:r.issuedAt,absent:true};});
 assert.throws(()=>checkTurn(root,turn.turn_id),/sense traça/i);
 assert.throws(()=>protectedTurnFiles(root),/sense traça/i);
});

for (const window of ['before-leaf-lstat', 'before-leaf-open']) {
 test(`T5-09 · substituir un pare ${window} no llig bytes privats ni acredita absència`, t => {
  const root=fs.realpathSync(fixture(t)),turn=openTurn(root,{scope:'documents'}),opts=optsFailed(`parent_${window.replaceAll('-','_')}`);
  const delivery=deliverContext(root,turn.turn_id,{...opts,creation:true});
  const dir=path.join(root,DESK),file=path.join(root,opts.file),saved=dir+'.original';
  const outside=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-private-parent-'));
  t.after(()=>fs.rmSync(outside,{recursive:true,force:true}));
  const target=path.join(outside,path.basename(file));
  fs.writeFileSync(file,'Fitxer nostre anterior.\n');fs.writeFileSync(target,'CONTINGUT_PRIVAT_SINTETIC_NO_LLEGIR');
  const privateStat=fs.statSync(target),oldLstat=fs.lstatSync,oldOpen=fs.openSync,oldRead=fs.readFileSync;
  let swapped=false,privateRead=false;
  const swap=()=>{if(!swapped){swapped=true;fs.renameSync(dir,saved);fs.symlinkSync(outside,dir);}};
  fs.lstatSync=(name,...args)=>{if(window==='before-leaf-lstat'&&name===file)swap();return oldLstat(name,...args);};
  fs.openSync=(name,...args)=>{if(window==='before-leaf-open'&&name===file)swap();return oldOpen(name,...args);};
  fs.readFileSync=(name,...args)=>{
   if(typeof name==='number'){const stat=fs.fstatSync(name);if(stat.dev===privateStat.dev&&stat.ino===privateStat.ino)privateRead=true;}
   return oldRead(name,...args);
  };
  try{assert.throws(()=>turns.failCreation(root,turn.turn_id,delivery.reflex),/no regular|substituïda/);}
  finally{
   fs.lstatSync=oldLstat;fs.openSync=oldOpen;fs.readFileSync=oldRead;
   if(swapped){fs.unlinkSync(dir);fs.renameSync(saved,dir);}
  }
  assert.equal(swapped,true);assert.equal(privateRead,false,'cap descriptor privat es llig darrere del pare substituït');
  assert.equal(Object.values(readTurn(root,turn.turn_id).receipts)[0].creation.state,'prepared');
  assert.equal(fs.readFileSync(target,'utf8'),'CONTINGUT_PRIVAT_SINTETIC_NO_LLEGIR');
 });
}

/* 261006: anchorDraft escriu dins de la llista i no duplica referents (ANC-W6, ANC-W7). */
const tres=[
 ['una llista',name=>`# Índex\n\n## Activitat en curs\n\n- [[${name}]]\n\n## Referències\n\nText humà.\n`],
 ['una secció buida',()=>'# Índex\n\n## Activitat en curs\n\n## Referències\n'],
 ['prosa',()=>'# Índex\n\n## Activitat en curs\n\nText humà de la secció.\n'],
];
// El torn de createDraft continua obert: arxivar deixa l'índex byte a byte i hi afig
// només l'àncora amb camí del document, perquè el handoff no deixe el torn sense àncora.
for (const [cas,fer] of tres) test(`261006 · ANC-W6: l’àncora nova entra davant de ${cas} sense línia en blanc pròpia, i crear i arxivar torna l’índex byte a byte, més l’àncora amb camí del torn obert`,t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'});
 const existent=`${avui()}_1200_auditoria_existent`;put(root,`${DESK}/${existent}.md`,'# Existent\n');
 const base=fer(existent);put(root,INDEX,base);
 const opts={...options('auditoria'),file:doc('auditoria_w6')};
 createDraft(root,turn.turn_id,opts);
 const nou=path.basename(opts.file,'.md');
 const separa=cas==='prosa'?'\n':'';
 assert.equal(fs.readFileSync(path.join(root,INDEX),'utf8'),base.replace('## Activitat en curs\n\n',`## Activitat en curs\n\n- [[${nou}]]\n${separa}`));
 assert.ok(vius(root).has(nou));
 arxiva(root,{noms:[path.basename(opts.file)]});
 assert.equal(fs.readFileSync(path.join(root,INDEX),'utf8'),`${base}\n## Arxivat amb la Porta Olivera\n\n- [[../90_arxiu_historic/${nou}]]\n`,'cap línia en blanc de més per cicle');
});
for (const forma of ['{x}.md','{x}|àlies','04_escriptori/{x}','_wiki_de_poble/04_escriptori/{x}#Secció','{x}\\|àlies']) test(`261006 · ANC-W7: ja declarat a «Activitat en curs» com a [[${forma}]], create no hi afig cap duplicat`,t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts={...options('auditoria'),file:doc('auditoria_w7')};
 const x=path.basename(opts.file,'.md');
 const base=`# Índex\n\n## Activitat en curs\n\n- [[${forma.replace('{x}',x)}]]\n`;
 put(root,INDEX,base);
 createDraft(root,turn.turn_id,opts);
 assert.equal(fs.readFileSync(path.join(root,INDEX),'utf8'),base);
 assert.ok(vius(root).has(x));
 assert.equal(checkTaula(root).valid,true,checkTaula(root).errors.join('\n'));
});
test('261006 · ANC-W7: fora del primer nivell, una àncora amb .md ja present no es duplica i l’apèndix no porta blanc propi',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'});
 const acta=`_wiki_de_poble/10_actes/${avui()}_1230_acta_w7.md`;
 const base=`# Índex\n\n- [[../10_actes/${path.basename(acta)}]]\n`;
 put(root,INDEX,base);
 createDraft(root,turn.turn_id,{route:'acta',file:acta,title:'Prova',description:'Acta sense àncora duplicada'});
 assert.equal(fs.readFileSync(path.join(root,INDEX),'utf8'),base);
 const altra=`_wiki_de_poble/10_actes/${avui()}_1231_acta_nova.md`;
 createDraft(root,turn.turn_id,{route:'acta',file:altra,title:'Prova',description:'Acta afegida al final'});
 assert.equal(fs.readFileSync(path.join(root,INDEX),'utf8'),`${base}- [[../10_actes/${path.basename(altra,'.md')}]]\n`);
 assert.ok(anchored(fs.readFileSync(path.join(root,INDEX),'utf8'),altra));
});
test('261006 · un recurs homònim sense extensió fa que l’àncora del draft porte .md explícit',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),opts={...options('auditoria'),file:doc('auditoria_homonim')};
 const stem=path.basename(opts.file,'.md');put(root,`${DESK}/${stem}`,'recurs');
 put(root,INDEX,`# Índex\n\n- [[${stem}]]\n\n## Activitat en curs\n\n`);
 createDraft(root,turn.turn_id,opts);
 assert.ok(fs.readFileSync(path.join(root,INDEX),'utf8').includes(`- [[${stem}.md]]`));
 assert.deepEqual(ancoratge(root),{senseAncora:[],fantasma:[]});
 assert.ok(vius(root).has(stem));
});
