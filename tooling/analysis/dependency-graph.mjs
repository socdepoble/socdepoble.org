/** Read-only dependency inventory. Extends the Babel/static/Tarjan census in
 * tarjan-zero-cicles-src.r32_19.test.mjs with literal import() and Vite glob.
 * A dynamic SCC is a candidate cycle, not proof of a TDZ or a runtime failure. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parse} from '@babel/parser';
const EXTENSIONS=['.js','.jsx','.mjs','.ts','.tsx'];
const cmp=(a,b)=>a<b?-1:a>b?1:0;
const sha=b=>createHash('sha256').update(b).digest('hex');
const literal=n=>n?.type==='StringLiteral'?n.value:n?.type==='TemplateLiteral'&&n.expressions.length===0?n.quasis[0].value.cooked:null;
const assetQuery=s=>/\?(?:raw|url)(?:[&#]|$)/.test(s)||/\.css\?inline(?:[&#]|$)/.test(s);
const hasCodeExtension=s=>EXTENSIONS.includes(path.posix.extname(s));
function localPath(spec,from,sourceRoot,query=true){
 const s=query?spec.split(/[?#]/)[0]:spec;
 return s.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(from),s))
  :s.startsWith('@/')?sourceRoot+'/'+s.slice(2):s.startsWith('/src/')?sourceRoot+'/'+s.slice(5):null;
}
function globPattern(pattern){
 if(pattern.length>512||['[',']','{','}','(',')','!','\\'].some(c=>pattern.includes(c)))return null;
 const tokens=[];let prefix='';
 for(let i=0;i<pattern.length;i++){
  const c=pattern[i];
  if(c==='*'&&pattern[i+1]==='*'){i++;if(pattern[i+1]==='/'){i++;if(tokens.at(-1)!=='D')tokens.push('D');}else tokens.push('G');}
  else if(c==='*')tokens.push('S');else if(c==='?')tokens.push('Q');else tokens.push({literal:c});
 }
 while(tokens[0]?.literal!==undefined)prefix+=tokens.shift().literal;
 return (value,budget)=>{
  if(value.length>4096)throw Object.assign(Error('Glob path budget'),{code:'glob-work-budget'});
  if(!value.startsWith(prefix))return false;
  const text=value.slice(prefix.length);let previous=new Uint8Array(text.length+1);previous[0]=1;
  for(const token of tokens){
   const next=new Uint8Array(text.length+1);let seen=0;
   for(let j=0;j<=text.length;j++){
    if(--budget.remaining<0)throw Object.assign(Error('Glob work budget'),{code:'glob-work-budget'});
    if(token==='S'||token==='G')next[j]=previous[j]||j>0&&(token==='G'||text[j-1]!=='/')&&next[j-1];
    else if(token==='D'){if(j>0)seen=seen||previous[j-1];next[j]=previous[j]||j>0&&text[j-1]==='/'&&seen;}
    else if(j>0)next[j]=previous[j-1]&&(token==='Q'?text[j-1]!=='/':text[j-1]===token.literal);
   }
   previous=next;
  }
  return previous[text.length]===1;
 };
}
function optionsOf(node){
 const result={};if(node?.type!=='ObjectExpression')return result;
 for(const p of node.properties)if(p.type==='ObjectProperty'&&!p.computed){const key=p.key.name??p.key.value;if(p.value.type==='BooleanLiteral')result[key]=p.value.value;else if(literal(p.value)!==null)result[key]=literal(p.value);}
 return result;
}
export function ciclesTarjan(nodes,edges){
 const graph=new Map(nodes.map(n=>[n,[]]));for(const e of edges)graph.get(e.from)?.push(e.to);
 for(const list of graph.values())list.sort(cmp);
 let index=0;const indices=new Map(),low=new Map(),stack=[],inside=new Set(),cycles=[];
 for(const start of nodes){
  if(indices.has(start))continue;
  const frames=[{node:start,next:0,parent:null}];
  while(frames.length){
   const frame=frames.at(-1),v=frame.node;
   if(!indices.has(v)){indices.set(v,index);low.set(v,index++);stack.push(v);inside.add(v);}
   const list=graph.get(v)||[];
   if(frame.next<list.length){const w=list[frame.next++];if(!indices.has(w))frames.push({node:w,next:0,parent:v});else if(inside.has(w))low.set(v,Math.min(low.get(v),indices.get(w)));continue;}
   frames.pop();if(frame.parent!==null)low.set(frame.parent,Math.min(low.get(frame.parent),low.get(v)));
   if(low.get(v)!==indices.get(v))continue;
   const component=[];let w;do{w=stack.pop();inside.delete(w);component.push(w);}while(w!==v);
   if(component.length>1||list.includes(v))cycles.push(component.sort(cmp));
  }
 }
 return cycles.sort((a,b)=>cmp(a.join('\n'),b.join('\n')));
}
export function analitzaFonts(fonts,{sourceRoot='src'}={}){
 const names=[...fonts.keys()].sort(cmp),known=new Set(names),edges=[],unresolved=[],opaque=[],outside=[],assets=[],external=new Set(),parseErrors=[],commonjs=[];
 const add=(from,spec,kind,origin)=>{
  if(assetQuery(spec)){assets.push({from,spec,reason:'asset-query'});return;}
  const local=localPath(spec,from,sourceRoot);
  if(local===null){external.add(spec);return;}
  if(local!==sourceRoot&&!local.startsWith(sourceRoot+'/')){outside.push({from,spec});return;}
  const candidates=[local,...EXTENSIONS.map(e=>local+e),...EXTENSIONS.map(e=>local+'/index'+e)],to=candidates.find(n=>known.has(n));
  if(to){edges.push({from,to,kind,origin});return;}
  if(hasCodeExtension(local)||!path.posix.extname(local))unresolved.push({from,spec,kind,origin});else assets.push({from,spec,reason:'non-code'});
 };
 for(const from of names){
  const text=fonts.get(from);let ast;
  try{ast=parse(text,{sourceType:'unambiguous',plugins:/\.tsx?$/.test(from)?['jsx','typescript']:['jsx'],createImportExpressions:true,sourceFilename:from});}
  catch(e){parseErrors.push({path:from,message:e.message});continue;}
  const work=[ast.program];
  while(work.length){
   const n=work.pop();if(!n||typeof n!=='object')continue;
   const inlineTypeOnly=n.specifiers?.length>0&&n.specifiers.every(s=>s.importKind==='type'||s.exportKind==='type');
   if(['ImportDeclaration','ExportNamedDeclaration','ExportAllDeclaration'].includes(n.type)&&n.source&&n.importKind!=='type'&&n.exportKind!=='type'&&!inlineTypeOnly)add(from,n.source.value,'static',n.type);
   if(n.type==='ImportExpression'||n.type==='CallExpression'&&n.callee?.type==='Import'){
    const value=literal(n.source??n.arguments?.[0]);if(value!==null)add(from,value,'dynamic','import-expression');else opaque.push({from,offset:n.start,reason:'computed-import'});
   }
   const callee=n.callee;
   if(n.type==='CallExpression'&&callee?.type==='Identifier'&&callee.name==='require')commonjs.push({from,offset:n.start,specifier:literal(n.arguments[0]),reason:'CommonJS-runtime-not-an-ESM-edge'});
   if(n.type==='CallExpression'&&callee?.type==='MemberExpression'&&callee.object?.type==='MetaProperty'&&callee.object.meta.name==='import'&&callee.property.name==='glob'){
    const arg=n.arguments[0],patterns=arg?.type==='ArrayExpression'?arg.elements.map(literal):[literal(arg)],options=optionsOf(n.arguments[1]);
    if(options.as==='raw'||options.as==='url'||typeof options.query==='string'&&assetQuery(options.query)){assets.push({from,spec:'import.meta.glob',reason:'glob-asset-query'});}
    else if(patterns.some(p=>p===null)){opaque.push({from,offset:n.start,reason:'computed-glob'});}
    else {
     const positives=[],negatives=[];let supported=true;
     for(const pattern of patterns){const negative=pattern.startsWith('!'),local=localPath(negative?pattern.slice(1):pattern,from,sourceRoot,false),rx=local&&globPattern(local);if(!rx){supported=false;break;}(negative?negatives:positives).push(rx);}
     if(!supported)opaque.push({from,offset:n.start,reason:'glob-syntax-not-enumerated'});
     else {
      const matches=[],budget={remaining:2000000};
      try{for(const to of names)if(positives.some(p=>p(to,budget))&&!negatives.some(p=>p(to,budget)))matches.push({from,to,kind:options.eager===true?'static':'dynamic',origin:'import.meta.glob'});edges.push(...matches);}
      catch(error){if(error.code!=='glob-work-budget')throw error;opaque.push({from,offset:n.start,reason:'glob-work-budget'});}
     }
    }
   }
   for(const [key,value] of Object.entries(n))if(!['loc','comments','leadingComments','trailingComments','innerComments','tokens','errors','extra'].includes(key)){
    if(Array.isArray(value)) {
     for(let i=value.length-1;i>=0;i--)if(value[i]&&typeof value[i]==='object')work.push(value[i]);
    } else if(value&&typeof value==='object'&&typeof value.type==='string')work.push(value);
   }
  }
 }
 const unique=[...new Map(edges.map(e=>[JSON.stringify(e),e])).values()].sort((a,b)=>cmp(JSON.stringify(a),JSON.stringify(b)));
 const staticEdges=unique.filter(e=>e.kind==='static'),staticCycles=ciclesTarjan(names,staticEdges),allCycles=ciclesTarjan(names,unique);
 return {schema:'sdp.dependency-graph.v1',sourceRoot,counts:{modules:names.length,staticEdges:staticEdges.length,dynamicEdges:unique.length-staticEdges.length,staticCycles:staticCycles.length,combinedCycles:allCycles.length,opaque:opaque.length,commonjsRequires:commonjs.length,unresolved:unresolved.length,parseErrors:parseErrors.length},staticCycles,combinedCycles:allCycles,edges:unique,unresolved,opaque,commonjsRequires:commonjs,outsideSourceRoot:outside,assets,externalSpecifiers:[...external].sort(cmp),parseErrors,sourcePins:names.map(p=>({path:p,sha256:sha(fonts.get(p)),bytes:Buffer.byteLength(fonts.get(p))})),limits:['Static and literal-dynamic source graph; does not execute app code or resolve package internals.','Computed imports, CommonJS require and unsupported glob syntax are explicitly inventoried; no completeness claim for them.','A combined SCC containing a lazy edge is not proof of a runtime TDZ. A zero-SCC result is not proof of general runtime correctness.','Build chunks require a separate inventory of the actual emitted build; this source report does not certify it.']};
}
export function inventariaFonts(root,{sourceRoot='src',maxFiles=10000,maxBytes=128*1024*1024,maxDepth=64}={}){
 const absolute=path.resolve(root),canonical=fs.realpathSync(absolute);
 if(canonical!==absolute)throw Error('Root or parent symlink refused');
 if(typeof sourceRoot!=='string'||!sourceRoot||path.isAbsolute(sourceRoot)||sourceRoot.includes('\\')||sourceRoot.includes('\0')||sourceRoot.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Source root must be a relative contained path');
 if(!Number.isSafeInteger(maxDepth)||maxDepth<1||maxDepth>128||!Number.isSafeInteger(maxFiles)||maxFiles<1||maxFiles>100000||!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>256*1024*1024)throw Error('Invalid source inventory budget');
 let directory=canonical;
 for(const segment of sourceRoot.split('/')){directory=path.join(directory,segment);const stat=fs.lstatSync(directory);if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('Source root parent symlink or non-directory refused');}
 const fonts=new Map();let bytes=0;
 function visit(rel,depth){if(depth>maxDepth)throw Error('Source inventory depth budget exceeded');for(const entry of fs.readdirSync(path.join(canonical,rel),{withFileTypes:true}).sort((a,b)=>cmp(a.name,b.name))){const p=rel+'/'+entry.name;if(entry.isSymbolicLink())throw Error('Source symlink refused: '+p);if(entry.isDirectory())visit(p,depth+1);else if(entry.isFile()&&hasCodeExtension(p)){const size=fs.statSync(path.join(canonical,p)).size;bytes+=size;if(fonts.size>=maxFiles||size>8*1024*1024||bytes>maxBytes)throw Error('Source inventory budget exceeded');fonts.set(p,fs.readFileSync(path.join(canonical,p),'utf8'));}}}
 visit(sourceRoot,0);return fonts;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=process.cwd(),report=analitzaFonts(inventariaFonts(root));process.stdout.write(JSON.stringify(report,null,2)+'\n');
 if(report.unresolved.length||report.parseErrors.length||report.staticCycles.length)process.exitCode=1;
}
