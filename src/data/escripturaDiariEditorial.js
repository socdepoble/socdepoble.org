import {STORAGE_PREFIX,getValAmbEstat,setVal,delVal,getOperacionsEditorials,getTextOperacioEditorial,retiraOperacioEditorialSiIgual} from '../config/storage.js';
import {MAX_OPERACIONS_REVISIONS,llegeixDiariRevisions} from './diariRevisionsEditorials.js';
import {creaLotEditorial,lligLotEditorial,MARCA_LOT_EDITORIAL,MAX_CHARS_ADMISSIO_EDITORIAL,MAX_OPS_LOGIQUES_EDITORIALS,MAX_CHARS_LOGICS_EDITORIALS} from './lotsDiariEditorial.js';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const intentades=new WeakSet(),enCurs=new Set(),resultats=new Map();
export const midaOperacioRevisions=(prefix,op)=>JSON.stringify(op).length+STORAGE_PREFIX.length+prefix.length+op.id.length;
export const diagnosticCompactacioEditorial=prefix=>resultats.get(prefix)||null;
export function compactaDiariEditorial(prefix,diari){
 if(enCurs.has(prefix))return {compactada:false,motiu:'en-curs'};
 enCurs.add(prefix);const abans={records:diari.records?.length||0,chars:diari.chars};let retirades=0;
 const final=motiu=>{
  const fresh=llegeixDiariRevisions(prefix,diari.valida);Object.assign(diari,fresh);
  const resultat={compactada:retirades>0,motiu,retirades,abans,despres:{records:fresh.records.length,chars:fresh.chars},operacions:fresh.ops.length};
  resultats.set(prefix,resultat);return resultat;
 };
 try{
  if(!diari.disponible||typeof diari.valida!=='function')return final('inventari-illegible');
  // Finish an interrupted retirement without requiring room for another batch.
  const ordered=diari.records.map(r=>({...r,idSet:new Set(r.ids)})).sort((a,b)=>b.ids.length-a.ids.length||(a.key<b.key?-1:a.key>b.key?1:0));
  for(let i=ordered.length-1;i>=0;i--){
   const record=ordered[i];
   const container=ordered.slice(0,i).find(c=>record.ids.every(id=>c.idSet.has(id)));
   if(container&&getTextOperacioEditorial(container.key).text===container.text
    &&retiraOperacioEditorialSiIgual(record.key,record.text))retirades++;
  }
  Object.assign(diari,llegeixDiariRevisions(prefix,diari.valida));
  if(!diari.disponible)return final('inventari-illegible');
  if(diari.records.length<2)return final('sense-reduccio');
  const textos=diari.textos,lot=creaLotEditorial(prefix,textos);
  const key=prefix+MARCA_LOT_EDITORIAL+lot.hash,text=JSON.stringify(lot),old=getTextOperacioEditorial(key);
  if(!old.disponible)return final('lectura-bloquejada');
  if(old.text!==null&&old.text!==text)return final('conflicte-lot');
  if(old.text===null){
   if(diari.chars+text.length+STORAGE_PREFIX.length+key.length>MAX_CHARS_ADMISSIO_EDITORIAL)return final('marge-insuficient');
   if(!setVal(key,lot))return final('escriptura-fallida');
  }
  const receipt=getTextOperacioEditorial(key);
  if(!receipt.disponible||receipt.text!==text)return final('rebut-fallit');
  const restored=lligLotEditorial(prefix,key,JSON.parse(receipt.text));
  if(restored.length!==textos.length||restored.some((row,i)=>row!==textos[i]))return final('inclusio-fallida');
  // Only captured, byte-identical records are retired. New keys are untouched.
  for(const record of diari.records){
   if(record.key===key)continue;
   if(getTextOperacioEditorial(key).text!==text)return final('contenidor-no-disponible');
   if(retiraOperacioEditorialSiIgual(record.key,record.text))retirades++;
  }
  return final('verificat');
 }catch{return final('compactacio-fallida');}
 finally{enCurs.delete(prefix);}
}
export function creaOperacioRevisions(dades,diari){
 try{const id=globalThis.crypto?.randomUUID?.();
  return typeof id==='string'&&UUID.test(id)&&Number.isSafeInteger(diari.ultim+1)?{...dades,v:1,n:diari.ultim+1,id}:null;
 }catch{return null;}
}
export function desaOperacioRevisions(prefix,dades,diari,preparada=null){
 if(!diari.disponible)return null;
 try{
  let op=preparada||creaOperacioRevisions(dades,diari);if(!op)return null;
  const existent=diari.ops.find(actual=>actual.id===op.id);
  if(existent)return preparada&&intentades.has(op)&&JSON.stringify(existent)===JSON.stringify(op)?op:null;
  if(diari.records.length>=256||diari.chars>=1024*1024)compactaDiariEditorial(prefix,diari);
  if(!diari.disponible)return null;
  if(!preparada)op={...op,n:diari.ultim+1};
  const text=JSON.stringify(op),before=getValAmbEstat(prefix+op.id);
  if(!before.disponible)return null;
  if(before.present)return preparada&&intentades.has(op)&&before.jsonValid&&JSON.stringify(before.valor)===text?op:null;
  const motiu=diari.records.length>=MAX_OPERACIONS_REVISIONS?'limit-registres'
   :midaOperacioRevisions(prefix,op)+diari.chars>MAX_CHARS_ADMISSIO_EDITORIAL?'limit-fisic'
   :diari.ops.length>=MAX_OPS_LOGIQUES_EDITORIALS?'limit-operacions'
   :diari.decodedChars+text.length>MAX_CHARS_LOGICS_EDITORIALS?'limit-logic':null;
  if(motiu){resultats.set(prefix,{...resultats.get(prefix),admissio:{acceptada:false,motiu,registres:diari.records.length,operacions:diari.ops.length,chars:diari.chars,charsLogics:diari.decodedChars}});return null;}
  intentades.add(op);
  if(!setVal(prefix+op.id,op))return null;
  const receipt=getTextOperacioEditorial(prefix+op.id);
  return receipt.disponible&&receipt.text===text?op:null;
 }catch{return null;}
}
export function esborraDiariRevisions(prefix){
 const raw=getOperacionsEditorials(prefix);if(!raw.disponible)return false;
 return raw.items.map(([key])=>delVal(key)).every(Boolean);
}
