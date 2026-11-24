/** Bounded generation certificates; old slash/UUID receipts remain comparable. */
import {sha256Hex} from '../utils/hashSha256.js';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/;
const HASH=/^g1:[0-9a-f]{64}$/;
const cache=new Map();
export function afegeixGeneracioEditorial(base,id){
 if(typeof id!=='string'||!UUID.test(id))throw Error('generation-id');
 const anterior=normalitzaGeneracioEditorial(base);
 if(anterior===null)throw Error('generation-base');
 const key=anterior+'/'+id;
 if(cache.has(key))return cache.get(key);
 if(cache.size>=16384)cache.clear();
 const token='g1:'+sha256Hex(key);cache.set(key,token);return token;
}
export function normalitzaGeneracioEditorial(value){
 if(value===''||typeof value==='string'&&HASH.test(value))return value;
 if(typeof value!=='string'||value.length>20000||!value.startsWith('/'))return null;
 const ids=value.slice(1).split('/');if(!ids.length||!ids.every(id=>UUID.test(id)))return null;
 return ids.reduce((g,id)=>afegeixGeneracioEditorial(g,id),'');
}
