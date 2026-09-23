import fs from 'node:fs';
import path from 'node:path';
import {sha} from './core.mjs';
const seal=/\n\n<!-- HASH: ([a-f0-9]{64}) -->\s*$/;
export function ledgerStatus(raw) {
 const match=raw.match(seal),body=match?raw.slice(0,match.index):raw;
 return {valid:!!match&&sha(body)===match[1],body,hash:sha(body)};
}
// Lock and compare-and-swap protect both successful closure and rollback.
export async function withSignedLedger(root,operation) {
 const file=path.join(root,'.agents/LEDGER.md'), lock=path.join(root,'.agents/runtime/ledger.lock');
 fs.mkdirSync(path.dirname(lock),{recursive:true});
 const fd=fs.openSync(lock,'wx');
 const before=fs.readFileSync(file,'utf8'),status=ledgerStatus(before);
 const signed=`${status.body}\n\n<!-- HASH: ${status.hash} -->`;
 try {
  if(fs.readFileSync(file,'utf8')!==before) throw new Error('LEDGER canviat concurrentment');
  fs.writeFileSync(file,signed);
  const result=await operation();
  if(!result.valid) {
   if(fs.readFileSync(file,'utf8')!==signed) throw new Error('LEDGER canviat; no es pot restaurar automàticament');
   fs.writeFileSync(file,before);
  }
  return result;
 } catch(e) {
  if(fs.readFileSync(file,'utf8')===signed) fs.writeFileSync(file,before);
  throw e;
 } finally {fs.closeSync(fd);fs.unlinkSync(lock);}
}
