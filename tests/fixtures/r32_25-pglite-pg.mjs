// Adaptador de transport per a regressió seqüencial; NO simula sessions independents.
import {pathToFileURL} from 'node:url';
export async function startLocalPostgres(){
 if(!process.env.SDP_PGLITE_MODULE)throw Error('SDP_PGLITE_MODULE obligatori');
 const base=pathToFileURL(process.env.SDP_PGLITE_MODULE),{PGlite}=await import(base.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',base)),{unaccent}=await import(new URL('./contrib/unaccent.js',base));
 const d=new PGlite({extensions:{pgcrypto,unaccent}}),options={parsers:{20:v=>v}};
 const db={exec:q=>d.exec(q,options),query:async(q,params)=>params?.length?d.query(q,params,options):(await d.exec(q,options)).at(-1)};
 return {db,close:()=>d.close()};
}
