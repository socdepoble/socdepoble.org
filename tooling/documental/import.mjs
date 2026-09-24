/** Explicit revision of a legacy document. Original bytes are retained by content hash. */
import { CAMINS } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {sha,relativePath,parseDocument,resolveRoute,loadContract} from './core.mjs';
import {deliverContext,mutateTurn} from './turns.mjs';
import {draft} from '../wiki/document.mjs';
export function importDocument(root,id,{file,route,title,description,actor='agent-local'}) {
 const rel=relativePath(root,file),target=path.join(root,rel),original=fs.readFileSync(target,'utf8');
 const originalHash=sha(original),parsed=parseDocument(original);
 const contract=loadContract(root,{route}),schemaRoute=resolveRoute(contract,{route});
 if(!title||!description) throw new Error('Importació: cal títol i descripció');
 const delivery=deliverContext(root,id,{route,file:rel});
 const main=schemaRoute.seccions.find(name=>!['Registre','Acte reflex','Historial','Vincles','Verificació','Riscos','Fonts','Pendents','Context','Protocol de la Reunió a l’Olivera'].includes(name));
 if(!main) throw new Error('Ruta sense camp editorial d’importació');
 const note=`Importació explícita de ${rel}; SHA-256 original ${originalHash}. No acredita una lectura anterior ni revalida les conclusions de l’original.`;
 let raw=draft(delivery,{title,description,actor});
 raw=raw.replace(`## ${main}\n\n[pendent]`,`## ${main}\n\n${note}\n\n${parsed.body.replace(/^#{1,2} /gm,'### ')}`);
 raw=raw.replaceAll('[pendent]',note).replace('esborrany creat; contingut i verificació pendents.','revisió d’importació; original conservat, revisió editorial pendent.');
 const backup=`.agents/runtime/imports/${originalHash}.md`,backupFile=path.join(root,backup);
 fs.mkdirSync(path.dirname(backupFile),{recursive:true});
 if(fs.existsSync(backupFile)) {if(sha(fs.readFileSync(backupFile))!==originalHash)throw new Error('Original immutable alterat');}
 else fs.writeFileSync(backupFile,original,{flag:'wx'});
 if(sha(fs.readFileSync(target))!==originalHash)throw new Error('Document canviat concurrentment durant la importació');
 const receiptId=delivery.reflex.split(':')[2];
 mutateTurn(root,id,turn=>{turn.receipts[receiptId].origin={kind:'explicit-import',file:rel,hash:originalHash,archive:backup,at:new Date().toISOString()};});
 fs.writeFileSync(target,raw);
 const index=path.join(root,CAMINS.indexEscriptori),anchor=`[[${path.basename(rel,'.md')}]]`;
 if(!fs.readFileSync(index,'utf8').includes(anchor))fs.appendFileSync(index,`\n- ${anchor}\n`);
 return {file:rel,original:backup,reflex:delivery.reflex};
}
