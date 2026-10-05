import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fixture} from './helpers/documental.mjs';
import {openTurn,deliverContext,readTurn,handoffDocument,mutateTurn} from '../tooling/documental/turns.mjs';
import {createDraft} from '../tooling/wiki/document.mjs';
import {anchored,sha} from '../tooling/documental/core.mjs';
import {checkTaula,avui} from '../tooling/gates/porta-olivera.mjs';
const DESK='_wiki_de_poble/04_escriptori',INDEX=`${DESK}/00_index_escriptori.md`;
const doc=(suffix)=>`${avui()}_1230_${suffix}.md`;
const text=(root,file)=>fs.readFileSync(path.join(root,file),'utf8');
const put=(root,file,content)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),content);};
for(const [route,destination] of [['auditoria',`${DESK}/02_investigacio_ia`],['acta','_wiki_de_poble/10_actes']])test(`esborrany ${route} fora primer nivell deixa àncora exacta i taula neta`,t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),file=`${destination}/${doc(`${route}_subcarpeta`)}`;
 createDraft(root,turn.turn_id,{route,file,title:'Prova',description:'Prova d’ancoratge exacte en subcarpeta'});
 assert.ok(anchored(text(root,INDEX),file));
 assert.equal(checkTaula(root).valid,true,checkTaula(root).errors.join('\n'));
 assert.doesNotMatch(text(root,INDEX),new RegExp(`- \\[\\[${path.basename(file,'.md')}\\]\\]`),'sense basename fantasma');
});
test('una àncora plana homònima no acredita el document de la subcarpeta',()=>{
 const name=doc('auditoria_homonima'),file=`${DESK}/02_investigacio_ia/${name}`;
 assert.equal(anchored(`- [[${path.basename(name,'.md')}]]`,file),false);
 assert.equal(anchored(`- [[02_investigacio_ia/${name}#Resultats|prova]]`,file),true);
 assert.equal(anchored(`- [[04_escriptori/02_investigacio_ia/${name}]]`,file),true);
 assert.equal(anchored(`- [[${file}]]`,file),true);
 assert.equal(anchored(`- [[02_investigacio_ia/altre/${name}]]`,file),false);
});
test('esborrany de subcarpeta encara s’ancora si el camí ja existix com a exemple inline',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),file=`${DESK}/02_investigacio_ia/${doc('auditoria_inline_lab')}`;
 const ref=`02_investigacio_ia/${path.basename(file,'.md')}`;
 put(root,INDEX,`# Índex\nExemple: \`[[${ref}]]\`\n`);
 createDraft(root,turn.turn_id,{route:'auditoria',file,title:'Prova',description:'Prova d’ancoratge fora de l’exemple inline'});
 assert.ok(anchored(text(root,INDEX),file));assert.equal(checkTaula(root).valid,true);
});
function moved(t){
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),source=`${DESK}/${doc('auditoria_duplicada')}`,target=`_wiki_de_poble/90_arxiu_historic/${path.basename(source)}`;
 const opts={route:'auditoria',file:source,title:'Prova',description:'Prova de relleu complet dels rebuts d’un torn'};
 deliverContext(root,turn.turn_id,opts);createDraft(root,turn.turn_id,opts);
 const raw=text(root,source);fs.mkdirSync(path.dirname(path.join(root,target)),{recursive:true});fs.renameSync(path.join(root,source),path.join(root,target));
 return{root,turn,source,target,raw};
}
test('handoff reapunta tots els rebuts duplicats del mateix torn i preserva tercers',t=>{
 const s=moved(t),other=openTurn(s.root,{scope:'documents'}),otherFile=path.join(s.root,'.agents/runtime/turns',`${other.turn_id}.json`),before=fs.readFileSync(otherFile);
 handoffDocument(s.root,s.turn.turn_id,s.source,s.target);
 const receipts=Object.values(readTurn(s.root,s.turn.turn_id).receipts);
 assert.equal(receipts.length,2);assert.ok(receipts.every(r=>r.file===s.target&&r.moves.length===1));
 assert.deepEqual(fs.readFileSync(otherFile),before);assert.equal(text(s.root,s.target),s.raw);
});
test('handoff completa el duplicat quan el rebut del reflex ja té un trasllat acreditat',t=>{
 const s=moved(t),raw=s.raw;
 const id=/reflex:.*:([0-9a-f-]+)["']?/.exec(raw)[1];
 mutateTurn(s.root,s.turn.turn_id,turn=>{const receipt=turn.receipts[id];receipt.file=s.target;receipt.moves=[{from:s.source,to:s.target,hash:sha(raw),at:new Date().toISOString()}];});
 handoffDocument(s.root,s.turn.turn_id,s.source,s.target);
 assert.ok(Object.values(readTurn(s.root,s.turn.turn_id).receipts).every(r=>r.file===s.target&&r.moves.length===1));
});
test('un rebut emés per al destí no acredita un source absent ni altera els registres',t=>{
 const root=fixture(t),turn=openTurn(root,{scope:'documents'}),target=`${DESK}/${doc('auditoria_original_destino')}`;
 createDraft(root,turn.turn_id,{route:'auditoria',file:target,title:'Prova',description:'Prova de rebuig d’un relleu sense traça original'});
 const before=readTurn(root,turn.turn_id);
 assert.throws(()=>handoffDocument(root,turn.turn_id,`${DESK}/${doc('auditoria_source_inventat')}`,target),/Rebut del relleu absent/);
 assert.deepEqual(readTurn(root,turn.turn_id),before);
});

for(const beforeFirstHandoff of [false,true])test(`context nou per source no es reapunta: abans del primer relleu=${beforeFirstHandoff}`,t=>{
 const s=moved(t);
 if(!beforeFirstHandoff)handoffDocument(s.root,s.turn.turn_id,s.source,s.target);
 const delivery=deliverContext(s.root,s.turn.turn_id,{route:'auditoria',file:s.source});
 const id=delivery.reflex.split(':').at(-1),before=readTurn(s.root,s.turn.turn_id).receipts[id];
 handoffDocument(s.root,s.turn.turn_id,s.source,s.target);
 assert.deepEqual(readTurn(s.root,s.turn.turn_id).receipts[id],before,'el context nou no acredita l’arxiu antic');
});
