import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {generateKeyPairSync} from 'node:crypto';
import {createBroker,contextPayload,signReceipt,sha256} from './broker.mjs';
const base=await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()),'sdp-broker-test-'));
const contextKey=generateKeyPairSync('ed25519'),approvalKey=generateKeyPairSync('ed25519');
let failures=0,passed=0;
async function fixture(){
 const home=await fs.mkdtemp(path.join(base,'fixture-')),root=path.join(home,'root'),state=path.join(home,'state');
 for(const p of [root,state,path.join(root,'.agents/skills/basic'),path.join(root,'tooling/wiki'),path.join(root,'src'),path.join(root,'docs')])await fs.mkdir(p,{recursive:true,mode:0o700});
 for(const p of ['.agents/AGENTS.md','.agents/BOOTSTRAP.md','.agents/PROTOCOL_PETORRETA.md','tooling/wiki/schema.json','.agents/skills/basic/SKILL.md','docs/procedure.md'])await fs.writeFile(path.join(root,p),'Current binding procedure\n',{mode:0o600});
 await fs.writeFile(path.join(root,'.agents/protocolledge.json'),JSON.stringify({schema:'sdp.protocolledge.v1',rutes:[{id:'p',plantilla:'docs/template.md',lectures:['docs/read.md']}]}),{mode:0o600});
 for(const p of ['src/a.txt','src/b.txt','docs/template.md','docs/read.md'])await fs.writeFile(path.join(root,p),'old\n',{mode:0o600});
 const policy={version:1,root,state,agentUid:process.getuid()+1,ttlMs:900000,maxFileBytes:1048576,maxBatchBytes:4194304,maxContextBytes:2097152,keys:{context:contextKey.publicKey.export({type:'spki',format:'pem'}),approval:approvalKey.publicKey.export({type:'spki',format:'pem'})},sources:[],routes:[{prefix:'src',protocols:[],sources:['docs/procedure.md']},{prefix:'docs',protocols:[],sources:[]}]};
 const policyPath=path.join(home,'policy.json');await fs.writeFile(policyPath,JSON.stringify(policy),{mode:0o600});
 return {root,state,policy,policyPath,broker:await createBroker(policyPath)};
}
async function prepare(f,paths=['src/a.txt']){return f.broker.prepare({session:'session1',turn:'turn1',intent:'Edit requested files',paths});}
async function propose(f,t,changes){return f.broker.propose({id:t.id,receipt:signReceipt(contextPayload(t,sha256('exact request')),contextKey.privateKey),changes:changes??[{path:'src/a.txt',content:'new\n'}]});}
async function run(name,fn){try{await fn();passed++;console.log('PASS '+name);}catch(e){failures++;console.log('FAIL '+name+': '+e.stack);}}
async function denied(fn,code){await assert.rejects(fn,e=>!code||e.code===code);}
await run('success existing replacement and new UTF8 file',async()=>{const f=await fixture(),t=await prepare(f,['src/a.txt','src/new.txt']),p=await propose(f,t,[{path:'src/a.txt',content:'updated\n'},{path:'src/new.txt',content:'Valencià 🎉\n'}]);const r=await f.broker.execute({id:t.id,approval:signReceipt(p.approval,approvalKey.privateKey)});assert.equal(r.status,'committed');assert.equal(await fs.readFile(path.join(f.root,'src/new.txt'),'utf8'),'Valencià 🎉\n');});
await run('forged context signature',async()=>{const f=await fixture(),t=await prepare(f);await denied(()=>f.broker.propose({id:t.id,receipt:signReceipt(contextPayload(t,sha256('req')),approvalKey.privateKey),changes:[{path:'src/a.txt',content:'bad'}]}),'SIGNATURE_INVALID');});
await run('forged approval signature',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t);await denied(()=>f.broker.execute({id:t.id,approval:signReceipt(p.approval,contextKey.privateKey)}),'SIGNATURE_INVALID');assert.equal(await fs.readFile(path.join(f.root,'src/a.txt'),'utf8'),'old\n');});
await run('replay execution and proposal',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t),a=signReceipt(p.approval,approvalKey.privateKey);await f.broker.execute({id:t.id,approval:a});await denied(()=>f.broker.execute({id:t.id,approval:a}),'TICKET_ALREADY_USED');await denied(()=>propose(f,t),'TICKET_ALREADY_USED');});
await run('context changed after prepare',async()=>{const f=await fixture(),t=await prepare(f);await fs.writeFile(path.join(f.root,'.agents/AGENTS.md'),'Changed');await denied(()=>propose(f,t),'PROCEDURES_CHANGED');});
await run('context changed after propose',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t);await fs.writeFile(path.join(f.root,'.agents/skills/basic/SKILL.md'),'Changed');await denied(()=>f.broker.execute({id:t.id,approval:signReceipt(p.approval,approvalKey.privateKey)}),'PROCEDURES_CHANGED');});
await run('target changed after prepare',async()=>{const f=await fixture(),t=await prepare(f);await fs.writeFile(path.join(f.root,'src/a.txt'),'Changed');await denied(()=>propose(f,t),'PREIMAGE_CHANGED');});
await run('target changed after propose',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t);await fs.writeFile(path.join(f.root,'src/a.txt'),'Changed');await denied(()=>f.broker.execute({id:t.id,approval:signReceipt(p.approval,approvalKey.privateKey)}),'PREIMAGE_CHANGED');});
await run('path traversal and reserved paths',async()=>{const f=await fixture();for(const target of ['src/../a.txt','/tmp/a','src//a.txt','src/./a.txt','src/evil\\x','src/.git/config','src/.GIT/config','src/.env','src/.env.local'])await denied(()=>prepare(f,[target]));});
await run('symlink leaf',async()=>{const f=await fixture();await fs.symlink(path.join(f.root,'src/a.txt'),path.join(f.root,'src/evil.txt'));await denied(()=>prepare(f,['src/evil.txt']));});
await run('symlink parent',async()=>{const f=await fixture();await fs.symlink(path.join(f.root,'docs'),path.join(f.root,'src/evil'));await denied(()=>prepare(f,['src/evil/procedure.md']));});
await run('hardlink target',async()=>{const f=await fixture();await fs.link(path.join(f.root,'src/a.txt'),path.join(f.root,'src/evil.txt'));await denied(()=>prepare(f,['src/evil.txt']),'REGULAR_SINGLE_LINK_REQUIRED');});
await run('normative file from another route protected',async()=>{const f=await fixture();await denied(()=>prepare(f,['docs/procedure.md']),'NORMATIVE_WRITE_FORBIDDEN');});
await run('unselected protocol source protected',async()=>{const f=await fixture();await denied(()=>prepare(f,['docs/template.md']),'NORMATIVE_WRITE_FORBIDDEN');});
async function simulateCrash(f,t,p,applied=0){
 const file=path.join(f.state,t.id+'.json'),record=JSON.parse(await fs.readFile(file,'utf8'));
 record.approval=signReceipt(p.approval,approvalKey.privateKey);record.status='committing';record.startedAt=Date.now();
 await fs.writeFile(file,JSON.stringify(record),{mode:0o600});
 for(let i=0;i<applied;i++)await fs.writeFile(path.join(f.root,record.after[i].path),Buffer.from(record.after[i].base64,'base64'),{mode:record.after[i].mode});
 return record;
}
await run('recovery rolls forward partial commit; replay rejected',async()=>{const f=await fixture(),t=await prepare(f,['src/a.txt','src/b.txt']),p=await propose(f,t,[{path:'src/a.txt',content:'first\n'},{path:'src/b.txt',content:'second\n'}]);await simulateCrash(f,t,p,1);const result=await f.broker.recover({id:t.id});assert.equal(result.status,'committed');assert.equal(await fs.readFile(path.join(f.root,'src/b.txt'),'utf8'),'second\n');await denied(()=>f.broker.recover({id:t.id}),'NOT_RECOVERABLE');});
await run('persistent committing barrier blocks prepare/propose/execute',async()=>{const f=await fixture(),t0=await prepare(f),t1=await prepare(f),p1=await propose(f,t1),t2=await prepare(f,['src/b.txt']),p2=await propose(f,t2,[{path:'src/b.txt',content:'crash\n'}]);await simulateCrash(f,t2,p2);const restart=await createBroker(f.policyPath);await denied(()=>restart.prepare({session:'s',turn:'t',intent:'x',paths:['src/a.txt']}),'RECOVERY_REQUIRED');await denied(()=>restart.propose({id:t0.id,receipt:signReceipt(contextPayload(t0,sha256('request')),contextKey.privateKey),changes:[{path:'src/a.txt',content:'x'}]}),'RECOVERY_REQUIRED');await denied(()=>restart.execute({id:t1.id,approval:signReceipt(p1.approval,approvalKey.privateKey)}),'RECOVERY_REQUIRED');await restart.recover({id:t2.id});await restart.execute({id:t1.id,approval:signReceipt(p1.approval,approvalKey.privateKey)});});
await run('recovery conflict preserves conflicting target',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t);await simulateCrash(f,t,p);await fs.writeFile(path.join(f.root,'src/a.txt'),'third value');await denied(()=>f.broker.recover({id:t.id}),'RECOVERY_CONFLICT');assert.equal(await fs.readFile(path.join(f.root,'src/a.txt'),'utf8'),'third value');});
await run('tampered recovery after bytes rejected',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t),record=await simulateCrash(f,t,p);record.after[0].base64=Buffer.from('evil\n').toString('base64');await fs.writeFile(path.join(f.state,t.id+'.json'),JSON.stringify(record));await denied(()=>f.broker.recover({id:t.id}));assert.equal(await fs.readFile(path.join(f.root,'src/a.txt'),'utf8'),'old\n');});
await run('expired ticket rejected before proposal',async()=>{const f=await fixture(),t=await prepare(f),now=Date.now;try{Date.now=()=>t.expiresAt+1;await denied(()=>propose(f,t),'TICKET_EXPIRED');}finally{Date.now=now;}});
await run('expired approval rejected before execution',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t),now=Date.now;try{Date.now=()=>t.expiresAt+1;await denied(()=>f.broker.execute({id:t.id,approval:signReceipt(p.approval,approvalKey.privateKey)}),'TICKET_EXPIRED');}finally{Date.now=now;}});
await run('consumed transaction recoverable after receipt expiry',async()=>{const f=await fixture(),t=await prepare(f),p=await propose(f,t),now=Date.now;await simulateCrash(f,t,p);try{Date.now=()=>t.expiresAt+1;assert.equal((await f.broker.recover({id:t.id})).status,'committed');}finally{Date.now=now;}});
await run('context receipt cannot cross ticket boundary',async()=>{const f=await fixture(),t=await prepare(f),t2=await prepare(f);await denied(()=>f.broker.propose({id:t2.id,receipt:signReceipt(contextPayload(t,sha256('exact request')),contextKey.privateKey),changes:[{path:'src/a.txt',content:'bad'}]}),'RECEIPT_BINDING');});
console.log(JSON.stringify({base,passed,failures}));
process.exitCode=failures?1:0;
