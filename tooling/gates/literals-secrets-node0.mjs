#!/usr/bin/env node
/** Public-source/index scan. Never reports values or credential hashes.
 * Private env/log/key paths are rejected without reading their bytes.
 * High-risk literals only: weak/short generic values are intentionally ambiguous.
 * Pattern detection is not proof of absence of secrets.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=path.resolve(fileURLToPath(new URL('../..',import.meta.url)));
const ROOTS=['src','tests','tooling','scripts','supabase','public','.github'];
const PUBLIC_ENV_TEMPLATES=new Set(['scripts/botigues/botigues.env.exemple.txt','.env.example']);
const ROOT_FILES=['package.json','package-lock.json','vite.config.js','vitest.precommit.config.js','.gitignore',...PUBLIC_ENV_TEMPLATES];
const MAX_FILE=8*1024*1024,MAX_TOTAL=256*1024*1024,MAX_BATCH=8*1024*1024,MAX_FILES=12000,MAX_FINDINGS=1000;
export const LIMITS_LITERAL_SECRETS=Object.freeze({maxFile:MAX_FILE,maxTotal:MAX_TOTAL,maxBatch:MAX_BATCH,maxFiles:MAX_FILES,maxFindings:MAX_FINDINGS});
const TEXT=/\.(?:[cm]?[jt]sx?|json|ya?ml|sql|py|sh|md|html|css|txt)$/i;
// Canonical lifecycle receipts are versioned evidence, not private state.
// Only direct JSON leaves qualify; locks, logs, nested paths and pointers keep
// the private-path rule. Their bytes still use every literal rule below.
const publicRuntimeRecord=name=>/^\.agents\/runtime\/(?:turns|contracts)\/[^/]+\.json$/.test(name);
const privateName=name=>!PUBLIC_ENV_TEMPLATES.has(name)&&(name.split('/').some(p=>/^\.env(?:\.|$)/i.test(p)||/\.(?:agekey|pem|p12|pfx|key|log)$/i.test(p))||name.startsWith('.agents/runtime/')&&!publicRuntimeRecord(name));
const publicName=name=>publicRuntimeRecord(name)||ROOT_FILES.includes(name)||ROOTS.some(root=>name.startsWith(root+'/'))&&TEXT.test(name);
const fail=code=>{throw Error(code);};
function decoded(value){return value.replace(/\\(?:u\{([0-9a-f]{1,6})\}|u([0-9a-f]{4})|x([0-9a-f]{2})|([\s\S]))/gi,(_m,a,b,c,d)=>a||b||c?String.fromCodePoint(Math.min(0x10ffff,parseInt(a??b??c,16))):({n:'\n',r:'\r',t:'\t','0':'\0'}[d]??d));}
export function escanejaLiterals(text,name='source'){
 if(typeof text!=='string'||Buffer.byteLength(text)>MAX_FILE||typeof name!=='string')fail('secret_gate_input_invalid');
 const findings=[],seen=new Set(),starts=[0];
 for(let at=text.indexOf('\n');at!==-1;at=text.indexOf('\n',at+1))starts.push(at+1);
 const add=(ruleId,offset)=>{let lo=0,hi=starts.length;while(lo<hi){const mid=(lo+hi)>>>1;if(starts[mid]<=offset)lo=mid+1;else hi=mid;}const line=lo,id=ruleId+':'+line;if(seen.has(id))return;if(findings.length>=MAX_FINDINGS)fail('secret_gate_finding_limit');seen.add(id);findings.push({ruleId,path:name,line});};
 const keys='KNOWN_PRODUCTION[A-Z0-9_]*|(?:SDP_)?MASTODON_(?:ACCESS_TOKEN|CLIENT_SECRET)|SDP_[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD)|SMTP_PASSWORD|PGPASSWORD|GITHUB_TOKEN|GH_TOKEN|DEEPL_API_KEY|OAUTH2?[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD)|password|passwd|access_?token|refresh_?token|client_?secret|oauth_?token|oauth_?client_?secret|token';
 const assignments=new RegExp('(?:\\b('+keys+')\\b|([\'"])('+keys+')\\2)\\s*[:=]\\s*([\'"\\x60])((?:\\\\[\\s\\S]|(?!\\4)[^\\\\\\r\\n]){1,8192}?)\\4','gi');
 for(const m of text.matchAll(assignments)){
  const key=m[1]??m[3],value=decoded(m[5]);if(value.includes('${'))continue;
  // In e.g. putenv('NAME=' . $value), this quote closes the surrounding
  // string; it does not start a credential value. JSON quoted keys differ.
  if(m[1]&&text[m.index-1]===m[4])continue;
  if(key.toUpperCase().startsWith('KNOWN_PRODUCTION')&&value.length>=8)add('known-production-literal',m.index);
  else if(!/^TEST_ONLY_[A-Z0-9_]+$/.test(value)){
   // A quoted fragment followed by concatenation is not a complete assignment.
   // Provider-format patterns below still inspect complete credential shapes.
   if(/^\s*\+/.test(text.slice(m.index+m[0].length)))continue;
   const specific=/^(?:(?:SDP_)?MASTODON_(?:ACCESS_TOKEN|CLIENT_SECRET)|SDP_[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD)|SMTP_PASSWORD|PGPASSWORD|GITHUB_TOKEN|GH_TOKEN|DEEPL_API_KEY|OAUTH2?[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD))$/i.test(key);
   const oauthClient=/^client_?secret$/i.test(key)&&/\b(?:oauth2?|client_?id|grant_?type)\b/i.test(text.slice(Math.max(0,m.index-256),m.index));
   const classes=[/[a-z]/,/[A-Z]/,/[0-9]/,/[^A-Za-z0-9]/].filter(rule=>rule.test(value)).length;
   let publicEndpoint=false;try{const url=new URL(value);publicEndpoint=url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash;}catch{/* A generic string is not necessarily a URL. */}
   const generic=value.length>=20&&!/\s/u.test(value)&&classes>=3&&!publicEndpoint;
   if((specific||oauthClient)?value.length>=8:generic)add('credential-assignment',m.index);
  }
 }
 if(PUBLIC_ENV_TEMPLATES.has(name)){
  for(const m of text.matchAll(/^[ \t]*(?:export[ \t]+)?([A-Z_][A-Z0-9_]*)[ \t]*=[ \t]*([^\r\n]*)/gmi)){
   const value=m[2].trim(),credential=/(?:TOKEN|SECRET|PASSWORD|PASSWD|PGPASSWORD|PRIVATE_?KEY|SERVICE_ROLE|P12(?:_|$)|P8(?:_|$))/.test(m[1].toUpperCase());
   if(credential&&value&&!value.startsWith('#')&&!/^['"\x60]/.test(value))add('dotenv-credential-literal',m.index);
  }
 }
 const patterns=[
  ['private-key',/-----BEGIN (?:[A-Z0-9 ]{0,32})?PRIVATE KEY-----[A-Za-z0-9+/=\r\n ]{32,32768}?-----END (?:[A-Z0-9 ]{0,32})?PRIVATE KEY-----/g],
  ['age-identity',new RegExp('AGE-'+'SECRET-KEY-1[023456789ACDEFGHJKLMNPQRSTUVWXYZ]{58}','g')],
  ['github-token',/\bgh[pousr]_[A-Za-z0-9]{36}\b|\bgithub_pat_[A-Za-z0-9_]{50,255}\b/g],
  ['supabase-secret',/\bsb_secret_[A-Za-z0-9_-]{20,255}\b/g]
 ];
 for(const[id,regex]of patterns)for(const m of text.matchAll(regex))add(id,m.index);
 for(const m of text.matchAll(/\b[A-Za-z0-9_-]{6,2048}\.[A-Za-z0-9_-]{6,8192}\.[A-Za-z0-9_-]{16,512}\b/g)){
  try{if(JSON.parse(Buffer.from(m[0].split('.')[1],'base64url')).role==='service_role')add('service-role-jwt',m.index);}catch{/* Not a decoded role claim. */}
 }
 return findings.sort((a,b)=>a.line-b.line||a.ruleId.localeCompare(b.ruleId));
}
function readSource(root,name){
 let cursor=root;const parts=name.split('/');
 for(const[i,part]of parts.entries()){cursor=path.join(cursor,part);const s=fs.lstatSync(cursor);if(s.isSymbolicLink()||i<parts.length-1&&!s.isDirectory())fail('secret_gate_unsafe_source');}
 const fd=fs.openSync(cursor,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW|fs.constants.O_NONBLOCK);
 try{const before=fs.fstatSync(fd);if(!before.isFile()||before.nlink!==1||before.size>MAX_FILE)fail('secret_gate_source_limit');const bytes=fs.readFileSync(fd),after=fs.fstatSync(fd),named=fs.lstatSync(cursor);if(bytes.length!==before.size||before.ino!==after.ino||before.dev!==after.dev||before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ctimeMs!==after.ctimeMs||after.ino!==named.ino||after.dev!==named.dev||named.isSymbolicLink()||named.nlink!==1)fail('secret_gate_source_changed');return bytes;}finally{fs.closeSync(fd);}
}
export function comprovaLiteralsSecrets({root=ROOT,index=fs.existsSync(path.join(root,'.git'))}={}){
 if(typeof root!=='string'||!path.isAbsolute(root)||typeof index!=='boolean')fail('secret_gate_arguments');
 const findings=[];let files=0,total=0;
 const append=values=>{if(findings.length+values.length>MAX_FINDINGS)fail('secret_gate_finding_limit');findings.push(...values);};
 const accept=(name,bytes)=>{if(++files>MAX_FILES||(total+=bytes.length)>MAX_TOTAL||bytes.length>MAX_FILE)fail('secret_gate_resource_limit');append(escanejaLiterals(new TextDecoder('utf-8',{fatal:true}).decode(bytes),name));};
 const git=(args,input,maxBuffer=32*1024*1024)=>{const r=spawnSync('git',['-c','core.fsmonitor=false',...args],{cwd:root,input,encoding:null,maxBuffer,timeout:30000,env:{PATH:process.env.PATH,LANG:'C',GIT_OPTIONAL_LOCKS:'0',GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_NO_REPLACE_OBJECTS:'1'}});if(r.status!==0)fail('secret_gate_index_unavailable');return r.stdout;};
 if(index){
  const rows=git(['ls-files','--stage','-z']).toString('utf8').split('\0').filter(Boolean);if(rows.length>MAX_FILES)fail('secret_gate_resource_limit');
  const selected=[];
  for(const row of rows){const m=/^([0-7]{6}) ([a-f0-9]{40,64}) ([0-3])\t(.+)$/.exec(row);if(!m||m[3]!=='0')fail('secret_gate_index_conflict');const name=m[4];if(privateName(name)){append([{ruleId:'private-file-indexed',path:name,line:1}]);continue;}if(!publicName(name))continue;if(!['100644','100755'].includes(m[1]))fail('secret_gate_unsafe_source');selected.push({name,oid:m[2]});}
  if(selected.length){
   const ids=[...new Set(selected.map(item=>item.oid))],input=Buffer.from(ids.join('\n')+'\n');
   const metadata=git(['cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],input,MAX_FILES*256).toString('ascii').trimEnd().split('\n'),sizes=new Map();
   if(metadata.length!==ids.length)fail('secret_gate_index_protocol');
   metadata.forEach((line,i)=>{const match=/^([a-f0-9]{40,64}) blob ([0-9]+)$/.exec(line),size=match?Number(match[2]):NaN;if(!match||match[1]!==ids[i]||!Number.isSafeInteger(size))fail('secret_gate_index_protocol');if(size>MAX_FILE)fail('secret_gate_resource_limit');sizes.set(ids[i],size);});
   const declared=selected.reduce((sum,item)=>sum+sizes.get(item.oid),0);if(declared>MAX_TOTAL)fail('secret_gate_resource_limit');
   // Keep memory bounded while scanning the full versioned receipt history.
   // The total 256 MiB budget includes the 169 MiB of canonical lifecycle
   // JSON at HEAD 064ec0137; each Git batch stays at most 8 MiB of blob bytes.
   const namesByOid=new Map();for(const item of selected){if(!namesByOid.has(item.oid))namesByOid.set(item.oid,[]);namesByOid.get(item.oid).push(item.name);}
   const scanBatch=group=>{
    const batch=git(['cat-file','--batch'],Buffer.from(group.join('\n')+'\n'),MAX_BATCH+MAX_FILES*256);let cursor=0;
    for(const oid of group){const end=batch.indexOf(10,cursor);if(end<cursor||end-cursor>255)fail('secret_gate_index_protocol');const expected=oid+' blob '+sizes.get(oid);if(batch.subarray(cursor,end).toString('ascii')!==expected)fail('secret_gate_index_protocol');cursor=end+1;const next=cursor+sizes.get(oid);if(next>=batch.length||batch[next]!==10)fail('secret_gate_index_protocol');const bytes=batch.subarray(cursor,next);for(const name of namesByOid.get(oid))accept(name,bytes);cursor=next+1;}
    if(cursor!==batch.length)fail('secret_gate_index_protocol');
   };
   let group=[],bytes=0;for(const oid of ids){const size=sizes.get(oid);if(group.length&&bytes+size>MAX_BATCH){scanBatch(group);group=[];bytes=0;}group.push(oid);bytes+=size;}if(group.length)scanBatch(group);
  }
 }else{
  let visited=0;const visitedPaths=new Set();const walk=(relative,depth=0)=>{if(visitedPaths.has(relative))return;visitedPaths.add(relative);if(depth>32||++visited>MAX_FILES)fail('secret_gate_resource_limit');const absolute=path.join(root,relative);let s;try{s=fs.lstatSync(absolute);}catch(e){if(e.code==='ENOENT')return;throw e;}if(s.isSymbolicLink())fail('secret_gate_unsafe_source');if(s.isDirectory()){for(const name of fs.readdirSync(absolute).sort()){if(['node_modules','.git'].includes(name)||name.startsWith('.r')&&name.endsWith('-lab'))continue;walk(relative+'/'+name,depth+1);}}else if(s.isFile()&&publicName(relative)){if(privateName(relative)){append([{ruleId:'private-public-source',path:relative,line:1}]);return;}accept(relative,readSource(root,relative));}};
  for(const name of[...ROOTS,...ROOT_FILES,'.agents/runtime/turns','.agents/runtime/contracts'])walk(name);
 }
 return{schema:'sdp.node0.secret-literals.v1',ok:findings.length===0,source:index?'git-index':'explicit-public-roots',files,findings};
}
export function main(args=process.argv.slice(2)){
 if(args.length)fail('secret_gate_arguments');const result=comprovaLiteralsSecrets();process.stdout.write(JSON.stringify(result)+'\n');return result.ok?0:1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{process.exitCode=main();}catch{process.stderr.write('secret_gate_failed\n');process.exitCode=1;}}
