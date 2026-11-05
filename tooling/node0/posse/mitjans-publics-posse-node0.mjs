/** Reads only an explicitly configured local public-media root.
 * A privileged publication certificate supplies blobRef; requests cannot pick
 * roots, URLs or private paths. The motor separately verifies exact bytes/hash.
 * Magic identifies the container, not a complete image-decoding guarantee.
 */
import fs from 'node:fs';
import path from 'node:path';

const MAX_BYTES=8*1024*1024;
const failure=()=>Object.assign(Error('POSSE_MEDIA_UNAVAILABLE'),{code:'POSSE_MEDIA_UNAVAILABLE',status:503});
const sameFile=(a,b)=>['dev','ino','size','mtimeNs','ctimeNs'].every(key=>a[key]===b[key]);
function absoluteRoot(root){
  if(typeof root!=='string'||!root||!path.isAbsolute(root)||root.includes('\0'))throw failure();
  let absolute=path.resolve(root);
  if(process.platform==='darwin'){
    if(absolute==='/tmp'||absolute.startsWith('/tmp/'))absolute='/private'+absolute;
    if(absolute==='/var'||absolute.startsWith('/var/'))absolute='/private'+absolute;
  }
  if(absolute===path.parse(absolute).root)throw failure();
  return absolute;
}
function relativeBlob(value){
  if(typeof value!=='string'||value.length<1||value.length>256
    ||value.split('/').some(part=>! /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(part)))throw failure();
  return value;
}
async function inspect(file){
  let cursor=path.parse(file).root;
  const parents=[];
  const parts=file.slice(cursor.length).split(path.sep);
  for(let index=0;index<parts.length;index++){
    cursor=path.join(cursor,parts[index]);
    const info=await fs.promises.lstat(cursor,{bigint:true});
    if(info.isSymbolicLink())throw failure();
    if(index===parts.length-1)return {parents,leaf:info};
    if(!info.isDirectory())throw failure();
    parents.push({path:cursor,dev:info.dev,ino:info.ino});
  }
  throw failure();
}
function mime(bytes){
  if(bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
  if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
  if(bytes.length>=16&&bytes.subarray(0,4).toString('ascii')==='RIFF'
    &&bytes.subarray(8,12).toString('ascii')==='WEBP'
    &&['VP8 ','VP8L','VP8X'].includes(bytes.subarray(12,16).toString('ascii')))return 'image/webp';
  throw failure();
}
export function creaLectorMitjansPublicsPosse({root}={}){
  return async blobRef=>{
    let handle;
    try{
      const directory=absoluteRoot(root),reference=relativeBlob(blobRef),file=path.join(directory,reference);
      const initial=await inspect(file);
      if(!initial.leaf.isFile()||initial.leaf.nlink!==1n||initial.leaf.size<1n||initial.leaf.size>BigInt(MAX_BYTES))throw failure();
      handle=await fs.promises.open(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
      const before=await handle.stat({bigint:true});
      if(!before.isFile()||before.nlink!==1n||!sameFile(initial.leaf,before))throw failure();
      const buffer=Buffer.allocUnsafe(64*1024),chunks=[];
      let total=0;
      while(true){
        const {bytesRead}=await handle.read(buffer,0,Math.min(buffer.length,MAX_BYTES+1-total),null);
        if(!bytesRead)break;
        total+=bytesRead;
        if(total>MAX_BYTES)throw failure();
        chunks.push(Buffer.from(buffer.subarray(0,bytesRead)));
      }
      const after=await handle.stat({bigint:true}),current=await inspect(file);
      if(!sameFile(before,after)||!sameFile(after,current.leaf)||after.nlink!==1n
        ||total!==Number(after.size)||initial.parents.length!==current.parents.length
        ||initial.parents.some((parent,index)=>parent.dev!==current.parents[index].dev||parent.ino!==current.parents[index].ino))throw failure();
      const bytes=Buffer.concat(chunks,total),mimeType=mime(bytes);
      return {bytes:new Uint8Array(bytes),mimeType};
    }catch{throw failure();}
    finally{
      if(handle)try{await handle.close();}catch{throw failure();}
    }
  };
}
