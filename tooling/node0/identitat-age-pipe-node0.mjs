/** One-shot native age identity input. No filesystem identity input or output. */
import fs from 'node:fs';
const fail=code=>{throw new Error(code);};
const PREFIX=Buffer.from(['AGE-','SECRET-KEY-1'].join(''));
const ALPHABET=Buffer.from('QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L');
export function validaIdentitatAgeMemoria(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.byteLength<74||bytes.byteLength>8192)fail('restore_identity_invalid');
 let key=null,offset=0;
 while(offset<bytes.length){let end=offset;while(end<bytes.length&&bytes[end]!==10)end++;let stop=end;if(stop>offset&&bytes[stop-1]===13)stop--;
  const line=bytes.subarray(offset,stop);offset=end+1;
  if(line.length===0||line[0]===35)continue;
  if(key||line.length!==PREFIX.length+58||!line.subarray(0,PREFIX.length).equals(PREFIX))fail('restore_identity_invalid');key=line;
 }
 if(!key)fail('restore_identity_invalid');
 const values=[];for(const c of key.subarray(PREFIX.length)){const index=ALPHABET.indexOf(c);if(index<0)fail('restore_identity_invalid');values.push(index);}
 const hrp='age-secret-key-',expanded=[...[...hrp].map(c=>c.charCodeAt(0)>>5),0,...[...hrp].map(c=>c.charCodeAt(0)&31)];let chk=1;
 for(const v of[...expanded,...values]){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3][i];}
 if((chk>>>0)!==1||values[51]%16!==0)fail('restore_identity_invalid');return true;
}
export function llegeixIdentitatAgePipe(stream,{timeoutMs=15000}={}){
 if(!stream||!Number.isInteger(stream.fd)||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)fail('restore_identity_pipe_required');
 const info=fs.fstatSync(stream.fd);if(stream.isTTY||!(info.isFIFO()||info.isSocket())||info.nlink!==0)fail('restore_identity_pipe_required');
 return new Promise((resolve,reject)=>{const buffer=Buffer.alloc(8192);let size=0,settled=false;
  const finish=cause=>{if(settled)return;settled=true;clearTimeout(timer);stream.off('data',data);stream.off('end',end);stream.off('error',failed);stream.off('close',closed);stream.pause();if(cause){buffer.fill(0);reject(new Error(cause));return;}try{validaIdentitatAgeMemoria(buffer.subarray(0,size));resolve(buffer.subarray(0,size));}catch{buffer.fill(0);reject(new Error('restore_identity_invalid'));}};
  const data=chunk=>{if(!(chunk instanceof Uint8Array)||size+chunk.length>buffer.length)return finish('restore_identity_limit');buffer.set(chunk,size);size+=chunk.length;};
  const end=()=>finish(),failed=()=>finish('restore_identity_pipe_failed'),closed=()=>{if(!stream.readableEnded)finish('restore_identity_pipe_failed');};
  const timer=setTimeout(()=>finish('restore_identity_timeout'),timeoutMs);
  stream.on('data',data);stream.once('end',end);stream.once('error',failed);stream.once('close',closed);
 });
}
