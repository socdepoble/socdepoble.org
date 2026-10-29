/** Byte-exact retrieval projection. Bundles and authored documents are untouched.
 * An aggregate is omitted only after replaying its real producer emissions.
 * These hashes establish consistency, not authorship, permission or consent.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {parseFrontmatter} from './frontmatter.mjs';
export const GENOMA='.agents/GENOMA.md';
export const GENOMA_SOURCES='.agents/GENOMA.sources.json';
const PRODUCER='tooling/wiki/compile-wiki-to-system-prompt.mjs';
const CONTEXT_DIRS=['.agents/skills','_wiki_de_poble/01_ser','_wiki_de_poble/02_saber','_wiki_de_poble/03_actuar'];
const CONTEXT_FILES=['AGENTS.md','.agents/AGENTS.md','.agents/PROTOCOL_PETORRETA.md'];
const DEPENDENCIES=['tooling/wiki/lib/frontmatter.mjs','tooling/wiki/lib/retrieval-sources.mjs'];
const HEADER='# CONTEXT MESTRE GLOBAL (SÓC DE POBLE)\n\nAquest document és generat automàticament. No l\'editis directament. Conté les fonts seleccionades pel productor i traçades al sidecar de procedència.\n\n';
const compare=(a,b)=>a<b?-1:a>b?1:0;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const record=s=>({path:s.path,sha256:s.sha256,bytes:s.bytes.length});
function relativeName(name) {
 if(typeof name!=='string'||!name||name.startsWith('/')||/[\\\0]/.test(name)||name.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error(`Ruta relativa invàlida: ${name}`);
 return name;
}
function confined(root,file) {
 const base=fs.realpathSync(root),absolute=path.resolve(root,file),rel=path.relative(path.resolve(root),absolute).split(path.sep).join('/');
 relativeName(rel);let cursor=base;const parts=rel.split('/');
 for(const [i,part]of parts.entries()) {
  cursor=path.join(cursor,part);const stat=fs.lstatSync(cursor);
  if(stat.isSymbolicLink()||(i<parts.length-1&&!stat.isDirectory()))throw new Error(`Symlink o camí no auditat: ${rel}`);
 }
 return {rel,cursor};
}
export function readContextSource(root,file) {
 const {rel,cursor}=confined(root,file);
 const fd=fs.openSync(cursor,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);let bytes;
 try{if(!fs.fstatSync(fd).isFile())throw new Error(`No és un fitxer: ${rel}`);bytes=fs.readFileSync(fd);}finally{fs.closeSync(fd);}
 return {path:rel,bytes,sha256:sha(bytes)};
}
export function contextInputFiles(root) {
 const names=[...CONTEXT_FILES];
 function visit(rel) {
  let safe;try{safe=confined(root,rel);}catch(e){if(e.code==='ENOENT')return;throw e;}
  if(!fs.lstatSync(safe.cursor).isDirectory())throw new Error(`No és un directori de context: ${rel}`);
  for(const entry of fs.readdirSync(safe.cursor,{withFileTypes:true}).sort((a,b)=>compare(a.name,b.name))) {
   const child=rel+'/'+entry.name;
   if(entry.isSymbolicLink())throw new Error(`Symlink no auditat: ${child}`);
   if(entry.isDirectory()&&!entry.name.startsWith('.')&&entry.name!=='plantilles'&&!entry.name.startsWith('90_'))visit(child);
   else if(entry.isFile()&&entry.name.endsWith('.md'))names.push(child);
  }
 }
 CONTEXT_DIRS.forEach(visit);return [...new Set(names)].sort(compare).map(p=>path.resolve(root,p));
}
export function readContextInputs(root) {return contextInputFiles(root).map(file=>readContextSource(root,file));}
function revalidateSelection(root,sources) {
 const expected=contextInputFiles(root).map(f=>path.relative(path.resolve(root),f).split(path.sep).join('/')).sort(compare),actual=sources.map(s=>s.path).sort(compare);
 if(!isDeepStrictEqual(expected,actual))throw new Error('Selecció del productor canviada o incompleta');
}
export function groupIdenticalSources(sources) {
 const unique=new Map(),buckets=new Map();
 for(const source of sources) {
  relativeName(source.path);
  if(!Buffer.isBuffer(source.bytes))throw new Error('Calen bytes crus de cada font');
  const prior=unique.get(source.path);if(prior&&!prior.bytes.equals(source.bytes))throw new Error(`Selecció divergent: ${source.path}`);
  unique.set(source.path,{...source,sha256:sha(source.bytes)});
 }
 for(const source of unique.values()) {
  const matches=buckets.get(source.sha256)||[],group=matches.find(g=>g[0].bytes.equals(source.bytes));
  if(group)group.push(source);else matches.push([source]);buckets.set(source.sha256,matches);
 }
 const groups=[];
 for(const matches of buckets.values())for(const group of matches) {
  group.sort((a,b)=>compare(a.path,b.path));const source=group.find(s=>s.path==='AGENTS.md')||group[0];
  groups.push({source,aliases:group.map(record)});
 }
 return groups.sort((a,b)=>compare(a.source.path,b.source.path));
}
function producer(root) {
 const source=readContextSource(root,PRODUCER);
 return {path:PRODUCER,sha256:source.sha256,dependencies:DEPENDENCIES.map(p=>record(readContextSource(root,p)))};
}
function compilerSource(name) {
 relativeName(name);
 if([GENOMA,GENOMA_SOURCES].includes(name))throw new Error('Procedència generada circular');
 if(CONTEXT_FILES.includes(name))return;
 const roots=CONTEXT_DIRS.map(p=>p+'/');
 const prefix=roots.find(p=>name.startsWith(p));
 if(!prefix||!name.endsWith('.md')||name.slice(prefix.length).split('/').slice(0,-1).some(p=>p.startsWith('.')||p==='plantilles'||p.startsWith('90_')))throw new Error(`Font fora del productor: ${name}`);
}
export function renderGeneratedContext(sources,producerRecord) {
 const selected=new Map(),excluded=[],active=[];
 for(const input of sources) {
  if(!Buffer.isBuffer(input.bytes))throw new Error('Calen bytes crus de cada font');
  const bytes=Buffer.from(input.bytes),source={path:input.path,bytes,sha256:sha(bytes)};
  compilerSource(source.path);if(selected.has(source.path))throw new Error(`Font repetida: ${source.path}`);selected.set(source.path,source);
  const parsed=parseFrontmatter(source.bytes.toString('utf8'));
  if(parsed.malformed||parsed.errors.length)throw new Error(`Frontmatter invàlid: ${source.path}`);
  if(['arxivat','quarantena'].includes(parsed.data?.status))excluded.push({...record(source),reason:parsed.data.status});else active.push(source);
 }
 if(!selected.size)throw new Error('Corpus del productor buit');
 let text=HEADER;const emissions=[];
 for(const group of groupIdenticalSources(active)) {
  const parsed=parseFrontmatter(group.source.bytes.toString('utf8')),body=parsed.body.replace(/\n{3,}/g,'\n\n').trim();
  const block=`## [FILE: ${group.source.path}]\n${body}\n\n---\n\n`;
  emissions.push({path:group.source.path,aliases:group.aliases,start:Buffer.byteLength(text),bytes:Buffer.byteLength(block),sha256:sha(Buffer.from(block))});text+=block;
 }
 const artifact=Buffer.from(text);
 return {bytes:artifact,manifest:{schema:'sdp.genoma.provenance.v1',producer:producerRecord,sources:[...selected.values()].map(record).sort((a,b)=>compare(a.path,b.path)),excluded:excluded.sort((a,b)=>compare(a.path,b.path)),emissions,artifact:{path:GENOMA,sha256:sha(artifact),bytes:artifact.length}}};
}
function revalidate(root,sources) {
 for(const source of sources)if(readContextSource(root,source.path).sha256!==source.sha256)throw new Error(`Font canviada durant la captura: ${source.path}`);
}
export function writeGeneratedContext(root,sources) {
 const code=producer(root),result=renderGeneratedContext(sources,code),captured=result.manifest.sources;
 revalidateSelection(root,captured);revalidate(root,captured);if(!isDeepStrictEqual(producer(root),code))throw new Error('Productor canviat durant la captura');
 const nonce=randomUUID(),body=path.join(root,GENOMA),sidecar=path.join(root,GENOMA_SOURCES),bodyTemp=body+'.tmp-'+nonce,sideTemp=sidecar+'.tmp-'+nonce;
 // Cada rename és atòmic. Una interrupció entre els dos deixa un parell que
 // el consumidor rebutja explícitament; mai interpreta un sidecar antic.
 for(const target of [body,sidecar]){try{fs.lstatSync(target);readContextSource(root,target);}catch(e){if(e.code!=='ENOENT')throw e;}}
 try{
  fs.writeFileSync(bodyTemp,result.bytes,{flag:'wx'});fs.writeFileSync(sideTemp,JSON.stringify(result.manifest,null,2)+'\n',{flag:'wx'});
  revalidateSelection(root,captured);revalidate(root,captured);if(!isDeepStrictEqual(producer(root),code))throw new Error('Productor canviat abans de publicar');
  fs.renameSync(bodyTemp,body);fs.renameSync(sideTemp,sidecar);
  revalidateSelection(root,captured);revalidate(root,captured);if(!isDeepStrictEqual(producer(root),code))throw new Error('Productor canviat durant la publicació');
 }finally{for(const tmp of [bodyTemp,sideTemp])if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
 return result.manifest;
}
export function retrievalSources(root,files,{requireCoveredEmissions=false}={}) {
 const selected=files.map(f=>readContextSource(root,f)),aggregate=selected.find(s=>s.path===GENOMA);let generated=null;
 if(aggregate) {
  let manifest;try{manifest=JSON.parse(readContextSource(root,GENOMA_SOURCES).bytes.toString('utf8'));}catch(e){throw new Error(`Procedència GENOMA absent o invàlida: ${e.message}`);}
  if(manifest?.schema!=='sdp.genoma.provenance.v1'||!Array.isArray(manifest.sources)||!manifest.sources.length)throw new Error('Contracte de procedència GENOMA invàlid');
  const seen=new Set(),sources=manifest.sources.map(s=>{
   compilerSource(s?.path);if(seen.has(s.path))throw new Error('Procedència GENOMA repetida');seen.add(s.path);
   const actual=readContextSource(root,s.path);if(actual.sha256!==s.sha256||actual.bytes.length!==s.bytes)throw new Error(`Procedència GENOMA desfasada: ${s.path}`);return actual;
  });
  revalidateSelection(root,sources);
  const expected=renderGeneratedContext(sources,producer(root));
  if(!isDeepStrictEqual(expected.manifest,manifest)||!aggregate.bytes.equals(expected.bytes))throw new Error('GENOMA i procedència divergeixen de les emissions reals');
  for(const source of sources){const earlier=selected.find(s=>s.path===source.path);if(earlier&&earlier.sha256!==source.sha256)throw new Error(`Captura GENOMA inconsistent: ${source.path}`);}
  if(requireCoveredEmissions&&manifest.emissions.some(e=>!e.aliases.some(a=>selected.some(s=>s.path===a.path))))throw new Error('GENOMA té emissions sense fonts seleccionades explícitament');
  revalidateSelection(root,sources);revalidate(root,sources);generated={...manifest.artifact,producer:manifest.producer,emissions:manifest.emissions,sources:manifest.sources.map(s=>({...s,selected:selected.some(earlier=>earlier.path===s.path)}))};
 }
 const groups=groupIdenticalSources(selected.filter(s=>s.path!==GENOMA));
 return {groups,provenance:{sources:[...new Map(selected.map(s=>[s.path,record(s)])).values()].sort((a,b)=>compare(a.path,b.path)),groups:groups.map(g=>({path:g.source.path,aliases:g.aliases})),generated}};
}
