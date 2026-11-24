import {getOperacionsEditorials} from '../config/storage.js';
import {lligLotEditorial,MARCA_LOT_EDITORIAL,MAX_OPS_LOGIQUES_EDITORIALS,MAX_CHARS_LOGICS_EDITORIALS,MAX_TREBALL_LECTURA_EDITORIAL} from './lotsDiariEditorial.js';
export const PREFIX_REVISIONS='publicacions.revisions.ops.v1.';
export const PREFIX_HISTORIAL='publicacions.revisions.histops.v1.';
export const MAX_OPERACIONS_REVISIONS=512;
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
export function llegeixDiariRevisions(prefix,valida){
 const raw=getOperacionsEditorials(prefix),perId=new Map(),records=[];
 let disponible=raw.disponible,ultim=0,decodedChars=0,workChars=0;
 for(const [key,text] of raw.items.sort(([a],[b])=>a<b?-1:a>b?1:0)){
  try{
   const value=JSON.parse(text),lot=key.startsWith(prefix+MARCA_LOT_EDITORIAL);
   const textos=lot?lligLotEditorial(prefix,key,value,MAX_TREBALL_LECTURA_EDITORIAL-workChars):[text];
   const ids=[];
   for(const encoded of textos){
    if((workChars+=encoded.length)>MAX_TREBALL_LECTURA_EDITORIAL)throw Error('work-budget');
    const op=JSON.parse(encoded);
    if(!op||typeof op!=='object'||Array.isArray(op)||op.v!==1||typeof op.id!=='string'||!UUID.test(op.id)
     ||!lot&&key!==prefix+op.id||!Number.isSafeInteger(op.n)||op.n<1||!valida(op))throw Error('operation-shape');
    const normalized=encoded,old=perId.get(op.id);
    if(old&&old.text!==normalized)throw Error('conflicting-id');
    if(!old){
     if(perId.size>=MAX_OPS_LOGIQUES_EDITORIALS||(decodedChars+=normalized.length)>MAX_CHARS_LOGICS_EDITORIALS)throw Error('logical-budget');
     perId.set(op.id,{op,text:normalized});ultim=Math.max(ultim,op.n);
    }
    ids.push(op.id);
   }
   records.push({key,text,ids});
  }catch{disponible=false;}
 }
 const ops=[...perId.values()].map(x=>x.op).sort((a,b)=>a.n-b.n||(a.id<b.id?-1:a.id>b.id?1:0));
 return {disponible,ops,textos:ops.map(op=>perId.get(op.id).text),ultim,chars:raw.chars,decodedChars,workChars,records,valida,prefix};
}
