import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadContract } from '../../tooling/documental/core.mjs';
import { openTurn, deliverContext } from '../../tooling/documental/turns.mjs';
import { draft } from '../../tooling/wiki/document.mjs';
export const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-contract-test-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const config=JSON.parse(fs.readFileSync(path.join(REPO,'.agents/protocolledge.json'),'utf8'));
  for(const file of ['.agents/protocolledge.json','tooling/wiki/schema.json',...config.rutes.map(r=>r.plantilla)]) {
    fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
    fs.copyFileSync(path.join(REPO,file),path.join(root,file));
  }
  for(const [file,content] of Object.entries({'.agents/ESTAT.md':'# Estat\n','.agents/LEDGER.md':'# Ledger\n',
    '_wiki_de_poble/04_escriptori/00_index_escriptori.md':'---\ntype: index\nstatus: canonic\ndescription: Índex de treball de proves\n---\n# Índex\n'})) {
    fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),content);
  }
  return root;
}
export function validDoc(root,{route='auditoria',scope='documents',turn=null,suffix='prova'}={}) {
  turn ||= openTurn(root,{scope,actor:'test'});
  const file=`_wiki_de_poble/04_escriptori/260922_0300_auditoria_${suffix}.md`;
  const delivery=deliverContext(root,turn.turn_id,{route,file});
  const content=draft(delivery,{title:'Prova vàlida',description:'Document positiu per a proves adversarials'}).replaceAll('[pendent]','Resultat comprovat amb evidència.');
  return {turn,file,delivery,content};
}
export function writeDoc(root,doc) {
  fs.writeFileSync(path.join(root,doc.file),doc.content);
  fs.appendFileSync(path.join(root,'_wiki_de_poble/04_escriptori/00_index_escriptori.md'),`\n- [[${path.basename(doc.file,'.md')}]]\n`);
}
export function relay(root,id) {for(const f of ['ESTAT.md','LEDGER.md'])fs.appendFileSync(path.join(root,'.agents',f),`\nTorn ${id}: relleu comprovat.\n`);}
export function contract(root){return loadContract(root);}
