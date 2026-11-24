import vm from 'node:vm';
import path from 'node:path';
import {webcrypto} from 'node:crypto';
import {buildSync} from 'esbuild';
let bundle;
export const fullPrefix=canal=>'sdp_embed_publicacions.revisions.'+(canal==='historial'?'histops':'ops')+'.v1.';
export const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export function laboratoriCapacitat(){
 const root=process.cwd();
 bundle??=buildSync({stdin:{contents:['revisionsEditorialsDelNavegador','historialRevisionsEditorials','gestioDiariEditorial'].map(n=>`export * from ${JSON.stringify(path.join(root,'src/data',n+'.js'))};`).join(''),resolveDir:root},bundle:true,write:false,format:'iife',globalName:'API',platform:'browser',target:'es2022'}).outputFiles[0].text;
 const disk=new Map(),realms=[];let hook=null;
 function realm(){
  const storage={get length(){return disk.size;},key:i=>[...disk.keys()][i]??null,
   getItem(key){hook?.('beforeGet',key);const value=disk.get(key)??null;hook?.('afterGet',key,value);return value;},
   setItem(key,value){if(hook?.('beforeSet',key,value)===false)return;disk.set(key,String(value));hook?.('afterSet',key,value);},
   removeItem(key){if(hook?.('beforeRemove',key)===false)return;disk.delete(key);hook?.('afterRemove',key);}};
  const context=vm.createContext({console,DOMException,crypto:webcrypto,structuredClone,TextEncoder,TextDecoder,navigator:{},localStorage:storage,sessionStorage:{getItem:()=>null},addEventListener(){},removeEventListener(){}});
  context.window=context;context.globalThis=context;vm.runInContext(bundle,context,{timeout:3000});
  const result={api:context.API,context};realms.push(result);return result;
 }
 return {disk,realm,hook:fn=>{hook=fn;},close:()=>{hook=null;realms.length=0;}};
}
export function sembraOperacions(lab,count,{canal='revisions',from=1}={}){
 const p=fullPrefix(canal);
 for(let n=from;n<from+count;n++){
  const op={v:1,n,id:uid(n),k:'mur:seed',t:canal==='historial'?'h':'p',d:canal==='historial'?{versio:n,campsNous:{title:`H${n}`},campsAnteriors:null}:{title:`T${n}`},at:null};
  if(canal==='historial')delete op.at;
  lab.disk.set(p+op.id,JSON.stringify(op));
 }
}
export const pla=value=>value==null?value:JSON.parse(JSON.stringify(value));
