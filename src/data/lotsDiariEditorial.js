/** Lossless immutable batches. Limits apply before rebuilding any row. */
import {sha256Hex} from '../utils/hashSha256.js';
export const MAX_OPS_LOGIQUES_EDITORIALS=16384;
export const MAX_CHARS_LOGICS_EDITORIALS=8*1024*1024;
export const MAX_TREBALL_LECTURA_EDITORIAL=32*1024*1024;
export const MAX_CHARS_ADMISSIO_EDITORIAL=2*1024*1024;
export const MARCA_LOT_EDITORIAL='lot.v1.';
const FORMAT='sdp.editorial.lot.v1';
const digest=(prefix,textos)=>sha256Hex(JSON.stringify([prefix,textos]));
export function creaLotEditorial(prefix,textos){
 if(!Array.isArray(textos)||!textos.length||textos.length>MAX_OPS_LOGIQUES_EDITORIALS)throw Error('lot-count');
 let anterior='',chars=0;const rows=[];
 for(const text of textos){
  if(typeof text!=='string'||(chars+=text.length)>MAX_CHARS_LOGICS_EDITORIALS)throw Error('lot-size');
  let p=0,s=0;while(p<anterior.length&&p<text.length&&anterior[p]===text[p])p++;
  while(s<anterior.length-p&&s<text.length-p&&anterior[anterior.length-1-s]===text[text.length-1-s])s++;
  rows.push([p,s,text.slice(p,text.length-s)]);anterior=text;
 }
 const hash=digest(prefix,textos);
 return {v:1,format:FORMAT,prefix,hash,count:textos.length,chars,rows};
}
export function lligLotEditorial(prefix,key,lot,remaining=MAX_TREBALL_LECTURA_EDITORIAL){
 if(!lot||typeof lot!=='object'||Array.isArray(lot)||lot.v!==1||lot.format!==FORMAT||lot.prefix!==prefix
  ||Object.keys(lot).sort().join(',')!=='chars,count,format,hash,prefix,rows,v'
  ||typeof lot.hash!=='string'||!/^[0-9a-f]{64}$/.test(lot.hash)||key!==prefix+MARCA_LOT_EDITORIAL+lot.hash
  ||!Number.isSafeInteger(lot.count)||lot.count<1||lot.count>MAX_OPS_LOGIQUES_EDITORIALS
  ||!Number.isSafeInteger(lot.chars)||lot.chars<1||lot.chars>MAX_CHARS_LOGICS_EDITORIALS||lot.chars>remaining
  ||!Array.isArray(lot.rows)||lot.rows.length!==lot.count)throw Error('lot-shape');
 const textos=[];let anterior='',chars=0;
 for(const row of lot.rows){
  if(!Array.isArray(row)||row.length!==3||!Number.isSafeInteger(row[0])||!Number.isSafeInteger(row[1])
   ||row[0]<0||row[1]<0||typeof row[2]!=='string'||row[0]+row[1]>anterior.length)throw Error('lot-row');
  const size=row[0]+row[1]+row[2].length;
  if(!Number.isSafeInteger(size)||(chars+=size)>lot.chars)throw Error('lot-expansion');
  const text=anterior.slice(0,row[0])+row[2]+(row[1]?anterior.slice(-row[1]):'');
  textos.push(text);anterior=text;
 }
 if(chars!==lot.chars||digest(prefix,textos)!==lot.hash)throw Error('lot-integrity');
 return textos;
}
