#!/usr/bin/env node
/** IDEA-334: bounded, read-only contract. Import reachability is evidence of
 * inclusion, never evidence that an optional assistant is a required service.
 * Direct call paths are checked separately; dynamic dispatch stays explicit. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import { classificaEndpoint } from './zero-ia-endpoints.mjs';
export { classificaEndpoint } from './zero-ia-endpoints.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CODE = /\.(?:mjs|cjs|js|jsx)$/;
const TEST = /(?:\.test\.|\.spec\.|\/__tests__\/|\/fixtures\/)/;
const AI_PACKAGES = /^(?:openai|ollama|@anthropic-ai\/sdk|@google\/generative-ai|@google\/genai)(?:\/|$)/;
const FUN = new Set(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression','ObjectMethod','ClassMethod','ClassPrivateMethod']);
const plainName = n => n?.type === 'Identifier' ? n.name : n?.type === 'StringLiteral' ? n.value : null;
const member = n => n?.type === 'MemberExpression' || n?.type === 'OptionalMemberExpression';
const property = n => member(n) && (!n.computed || n.property.type === 'StringLiteral') ? plainName(n.property) : null;

function walk(node, visit, parent = null) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') visit(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (['loc','start','end','extra','comments','tokens','errors'].includes(key)) continue;
    if (Array.isArray(value)) { for (const child of value) walk(child, visit, node); }
    else if (value && typeof value === 'object') walk(value, visit, node);
  }
}

function inside(root, rel) { const abs = path.resolve(root, rel); return abs.startsWith(`${root}${path.sep}`) ? abs : null; }
function localFile(root, from, spec) {
  if (!spec.startsWith('.')&&!spec.startsWith('@/')) return null;
  const rel = spec.startsWith('@/')?`src/${spec.slice(2).split('?')[0]}`:path.relative(root, path.resolve(root, path.dirname(from), spec.split('?')[0]));
  if (!inside(root, rel)) return null;
  for (const candidate of [rel,`${rel}.js`,`${rel}.mjs`,`${rel}.cjs`,`${rel}.jsx`,`${rel}/index.js`,`${rel}/index.mjs`]) {
    if (CODE.test(candidate) && fs.existsSync(inside(root,candidate)) && fs.lstatSync(inside(root,candidate)).isFile()) return candidate;
  }
  return null;
}
function list(root, rel, out) {
  const abs = inside(root,rel);
  if (!abs || !fs.existsSync(abs)) return;
  for (const entry of fs.readdirSync(abs,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
    const name = `${rel}/${entry.name}`;
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory() && !['node_modules','fixtures','__tests__'].includes(entry.name)) list(root,name,out);
    else if (entry.isFile() && CODE.test(name) && !TEST.test(name)) out.add(name);
  }
}

function modelOf(file, source, budget) {
  const ast = parse(source,{sourceType:'unambiguous',plugins:['jsx'],createImportExpressions:true});
  const model = {file,imports:[],commands:[],bindings:new Map(),exports:new Map(),stars:[],values:new Map(),scopes:new Map(),functions:new Map(),calls:[],sinks:[],dynamic:[]};
  const owners = new Map(), parents = new Map();
  const owner = node => { let n=node; while(n) { if(owners.has(n))return owners.get(n); n=parents.get(n); } return `${file}#module`; };
  const scopeOf=id=>{if(!model.scopes.has(id))model.scopes.set(id,{bindings:new Map(),values:new Map()});return model.scopes.get(id);};
  const putBinding=(name,value,scope)=>scopeOf(scope).bindings.set(name,value);
  walk(ast,(node,parent)=>{
    if (++budget.nodes > budget.maxNodes) throw new Error('AST node budget exceeded');
    parents.set(node,parent);
    if (FUN.has(node.type)) {
      const name = node.id?.name ?? (parent?.type === 'VariableDeclarator' ? plainName(parent.id) : plainName(node.key)) ?? `callback@${node.start}`;
      const id = `${file}#${name}@${node.start}`;
      const enclosing=owner(parent);
      owners.set(node,id); model.functions.set(id,{id,name,start:node.start,line:node.loc.start.line,parent:enclosing});
      for(const param of node.params??[])if(param.type==='Identifier')putBinding(param.name,{parameter:true},id);
      if (node.type === 'FunctionDeclaration' || parent?.type === 'VariableDeclarator') putBinding(name,{id},enclosing);
    }
    if (node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && node.init) scopeOf(owner(node)).values.set(node.id.name,node.init);
    const initializer=node.type==='VariableDeclarator'?(node.init?.type==='AwaitExpression'?node.init.argument:node.init):null;
    if (initializer&&(initializer.type === 'CallExpression' && initializer.callee.name === 'require' && initializer.arguments[0]?.type === 'StringLiteral'||initializer.type==='ImportExpression'&&initializer.source.type==='StringLiteral')) {
      const spec=(initializer.source??initializer.arguments[0]).value;
      if(node.id.type==='Identifier')putBinding(node.id.name,{spec,name:'*'},owner(node));
      if(node.id.type==='ObjectPattern')for(const p of node.id.properties)if(p.type==='ObjectProperty'&&p.value.type==='Identifier')putBinding(p.value.name,{spec,name:plainName(p.key)},owner(node));
    }
    if (node.type === 'ImportDeclaration' || (node.type === 'ExportNamedDeclaration' && node.source) || node.type === 'ExportAllDeclaration') {
      const spec = node.source.value; model.imports.push({spec,eager:true,line:node.loc.start.line});
      if (node.type === 'ImportDeclaration') for (const s of node.specifiers) putBinding(s.local.name,{spec,name:s.type === 'ImportDefaultSpecifier'?'default':s.type === 'ImportNamespaceSpecifier'?'*':plainName(s.imported)},`${file}#module`);
      if (node.type === 'ExportAllDeclaration') model.stars.push(spec);
      if (node.type === 'ExportNamedDeclaration') for (const s of node.specifiers) model.exports.set(plainName(s.exported),{spec,name:plainName(s.local)});
    }
    if (node.type === 'ExportNamedDeclaration' && !node.source) {
      const decl = node.declaration;
      if (decl?.id) model.exports.set(decl.id.name,{local:decl.id.name});
      if (decl?.declarations) for (const d of decl.declarations) if (d.id.type === 'Identifier') model.exports.set(d.id.name,{local:d.id.name});
      for (const s of node.specifiers) model.exports.set(plainName(s.exported),{local:plainName(s.local)});
    }
    if (node.type === 'ExportDefaultDeclaration') model.exports.set('default',{node:node.declaration,local:node.declaration.name ?? node.declaration.id?.name});
  });
  model.bindings=scopeOf(`${file}#module`).bindings;model.values=scopeOf(`${file}#module`).values;
  walk(ast,node=>{
    if(node.type==='ObjectExpression'){
      const props=new Map(node.properties.filter(p=>p.type==='ObjectProperty').map(p=>[plainName(p.key),p.value]));
      const cmd=props.get('cmd'),args=props.get('args');
      if((cmd?.value==='node'||member(cmd)&&plainName(cmd.object)==='process'&&property(cmd)==='execPath')&&args?.type==='ArrayExpression'){
        const script=args.elements.find(e=>e?.type==='StringLiteral'&&CODE.test(e.value));
        if(script)model.commands.push({spec:script.value,line:node.loc.start.line,kind:'node-command-registry'});
      }
    }
    if (node.type === 'ImportExpression' || node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === 'require') {
      const arg = node.source ?? node.arguments[0];
      if (arg?.type === 'StringLiteral') model.imports.push({spec:arg.value,eager:node.type !== 'ImportExpression',owner:owner(node),line:node.loc.start.line});
      else model.dynamic.push({file,line:node.loc.start.line,kind:'computed-import'});
    }
    if (!['CallExpression','OptionalCallExpression','NewExpression'].includes(node.type)) return;
    const callee = node.callee, name = callee.type === 'Identifier' ? callee.name : property(callee);
    const callbacks=node.arguments.filter(a=>FUN.has(a.type)).map(a=>owners.get(a));
    const call = {owner:owner(node),name,base:member(callee)?plainName(callee.object):null,line:node.loc.start.line,arg:node.arguments[0],callbacks,iife:owners.get(callee)};
    model.calls.push(call);
    if(['spawn','spawnSync','exec','execSync','execFile','execFileSync','fork','executa','runChecked'].includes(name)){
      const cmd=node.arguments[0],argv=node.arguments[1];
      const script=(cmd?.value==='node'||member(cmd)&&plainName(cmd.object)==='process'&&property(cmd)==='execPath')&&argv?.type==='ArrayExpression'?argv.elements.find(e=>e?.type==='StringLiteral'&&CODE.test(e.value)):null;
      if(script)model.commands.push({spec:script.value,line:node.loc.start.line,kind:'node-subprocess'});
      else model.dynamic.push({file,line:node.loc.start.line,kind:'subprocess-dispatch'});
    }
    if (['fetch','fetchImpl','obte','peticioHttp','WebSocket','EventSource','XMLHttpRequest'].includes(name)
      || name === 'invoke' && node.arguments[0]?.value === 'iaia'
      || ['http','https','axios'].includes(call.base) && ['request','get','post','put'].includes(name)) model.sinks.push(call);
  });
  return model;
}

export function inspectaContracte({root = path.resolve(HERE,'../..'),contract = JSON.parse(fs.readFileSync(path.join(HERE,'tractor-zero-dependencia-ia.contracte.json'),'utf8'))} = {}) {
  root=fs.realpathSync(root);
  const issues=[], limits=[...contract.limits], models=new Map(), files=new Set(), imports=[], external=new Set();
  for(const surface of contract.surfaces)list(root,surface,files);
  for(const entry of contract.entries)files.add(entry);
  const packagePath=inside(root,'package.json');
  const scripts=fs.existsSync(packagePath)?JSON.parse(fs.readFileSync(packagePath,'utf8')).scripts??{}:{};
  const scriptEvidence=[],scriptDynamic=[],seenScripts=new Set();
  function script(name) {
    if(seenScripts.has(name))return; seenScripts.add(name);
    if(typeof scripts[name]!=='string'){issues.push({code:'SCRIPT_MISSING',file:'package.json',detail:name});return;}
    const command=scripts[name];scriptEvidence.push({name,command});
    for(const lifecycle of [`pre${name}`,`post${name}`])if(typeof scripts[lifecycle]==='string')script(lifecycle);
    for(const m of command.matchAll(/\bnpm\s+run\s+([\w:.-]+)/g))script(m[1]);
    for(const m of command.matchAll(/(?:^|\s)([\w./-]+\.(?:mjs|cjs|js))(?:\s|$|['"])/g))files.add(m[1]);
    if(/\bvite\b/.test(command))for(const m of command.matchAll(/\s-c\s+([\w./-]+)/g))files.add(m[1]);
    for(const inline of command.matchAll(/\bnode\s+(?:--input-type=module\s+)?(?:-e|--eval)\s+(['"])([\s\S]*?)\1/g)){
      try{walk(parse(inline[2],{sourceType:'unambiguous',createImportExpressions:true}),node=>{
        if(node.type!=='ImportExpression'&&!(node.type==='CallExpression'&&node.callee.name==='require'))return;
        const spec=node.source??node.arguments[0];
        if(spec?.type==='StringLiteral'){
          const target=localFile(root,'package.json',spec.value);
          if(target)files.add(target);else scriptDynamic.push({file:'package.json',script:name,kind:'unresolved-inline-import'});
        }else scriptDynamic.push({file:'package.json',script:name,kind:'computed-inline-import'});
      });}catch{scriptDynamic.push({file:'package.json',script:name,kind:'unparsed-inline-command'});}
    }
    if(/\b(?:curl|wget)\b/.test(command))limits.push(`shell-network: package.json:${name}`);
    if(/(?:11434|api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com)/i.test(command))issues.push({code:'AI_REQUIRED_COMMAND',file:'package.json',detail:name});
  }
  for(const name of contract.scripts)script(name);
  const hookPath=inside(root,'.husky/pre-commit');
  const hook=hookPath&&fs.existsSync(hookPath)?fs.readFileSync(hookPath,'utf8'):'';
  if(!hook)issues.push({code:'HOOK_MISSING',file:'.husky/pre-commit'});
  for(const m of hook.matchAll(/\bnode\s+([\w./-]+\.mjs)/g))files.add(m[1]);
  if(/11434|api\.openai\.com|api\.anthropic\.com/.test(hook))issues.push({code:'AI_REQUIRED_COMMAND',file:'.husky/pre-commit'});
  const budget={nodes:0,maxNodes:contract.bounds.astNodes};let bytes=0;
  const queue=[...files].sort();
  for(let i=0;i<queue.length;i++) {
    const file=queue[i];if(models.has(file))continue;
    if(models.size>=contract.bounds.files){issues.push({code:'BOUND_FILES',file});break;}
    const abs=inside(root,file);
    if(!abs||!fs.existsSync(abs)){issues.push({code:'ENTRY_MISSING',file});continue;}
    const stat=fs.lstatSync(abs);
    if(!stat.isFile()||stat.isSymbolicLink()){issues.push({code:'NONREGULAR_SOURCE',file});continue;}
    bytes+=stat.size;
    if(stat.size>contract.bounds.bytesPerFile||bytes>contract.bounds.totalBytes){issues.push({code:'BOUND_BYTES',file});break;}
    let model;
    try{model=modelOf(file,fs.readFileSync(abs,'utf8'),budget);}catch(error){issues.push({code:'PARSE_OR_BOUND',file,detail:error.message.split('\n')[0]});continue;}
    models.set(file,model);
    for(const cmd of model.commands){
      const target=localFile(root,'package.json',cmd.spec.startsWith('.')?cmd.spec:`./${cmd.spec}`);
      if(target){imports.push({from:file,to:target,eager:false,line:cmd.line,kind:cmd.kind});if(!models.has(target))queue.push(target);}
      else model.dynamic.push({file,line:cmd.line,kind:'unresolved-node-command'});
    }
    for(const imp of model.imports) {
      const target=localFile(root,file,imp.spec);imports.push({from:file,to:target??imp.spec,eager:imp.eager,owner:imp.owner,line:imp.line});
      if(target&&!models.has(target))queue.push(target);
      else if(!imp.spec.startsWith('.')&&!imp.spec.startsWith('@/')){external.add(imp.spec);if(AI_PACKAGES.test(imp.spec))issues.push({code:'AI_SDK',file,line:imp.line,detail:imp.spec});}
      else if(CODE.test(imp.spec.split('?')[0])&&!target)issues.push({code:'IMPORT_MISSING',file,line:imp.line,detail:imp.spec});
    }
  }
  function exported(file,name,seen=new Set()) {
    const key=`${file}:${name}`;if(seen.has(key))return null;seen.add(key);
    const m=models.get(file),e=m?.exports.get(name);
    if(e?.node&&FUN.has(e.node.type))for(const [id,f]of m.functions)if(f.start===e.node.start)return id;
    if(e?.spec)return exported(localFile(root,file,e.spec),e.name,seen);
    if(e?.local)return binding(file,e.local,seen);
    if(e?.node)for(const [id,f] of m.functions)if(f.name===e.node.id?.name)return id;
    for(const spec of m?.stars??[]){const value=exported(localFile(root,file,spec),name,seen);if(value)return value;}
    return null;
  }
  function lookup(file,name,scope=`${file}#module`) {
    const m=models.get(file);let current=scope;
    while(current){const s=m?.scopes.get(current);if(s?.bindings.has(name)||s?.values.has(name))return {binding:s.bindings.get(name),value:s.values.get(name),scope:current};current=m?.functions.get(current)?.parent;}
    return {};
  }
  function binding(file,name,seen=new Set(),scope=`${file}#module`) {
    const key=`binding:${file}:${scope}:${name}`;if(seen.has(key))return null;seen.add(key);
    const found=lookup(file,name,scope),b=found.binding;if(b?.id)return b.id;
    if(b?.spec)return exported(localFile(root,file,b.spec),b.name,seen);
    const value=found.value;
    if(value?.type==='Identifier')return binding(file,value.name,seen,found.scope);
    if(member(value)&&plainName(value.object)&&property(value)){const imp=lookup(file,plainName(value.object),found.scope).binding;if(imp?.name==='*')return exported(localFile(root,file,imp.spec),property(value),seen);}
    return null;
  }
  function stringValue(file,node,seen=new Set(),scope=`${file}#module`) {
    if(!node)return null;
    if(node.type==='StringLiteral')return node.value;
    if(node.type==='TemplateLiteral') { const values=node.expressions.map(e=>stringValue(file,e,new Set(seen),scope));return node.quasis.map((q,i)=>q.value.cooked+(i<values.length?(values[i]??'${dynamic}'):'')).join(''); }
    if(node.type==='BinaryExpression'&&node.operator==='+'){const a=stringValue(file,node.left,new Set(seen),scope),b=stringValue(file,node.right,new Set(seen),scope);return a===null&&b===null?null:`${a??'${dynamic}'}${b??'${dynamic}'}`;}
    if(node.type==='Identifier') {
      const key=`${file}:${scope}:${node.name}`;if(seen.has(key))return null;seen.add(key);
      const found=lookup(file,node.name,scope),v=found.value;if(v)return stringValue(file,v,seen,found.scope);
      const b=found.binding,target=b?.spec&&localFile(root,file,b.spec),ex=models.get(target)?.exports.get(b?.name);
      if(ex?.local)return stringValue(target,{type:'Identifier',name:ex.local},seen);
    }
    return null;
  }
  const optional=new Map(contract.optionalAi.map(x=>[x.file,x.reason])),edges=new Map(),sinks=[],dynamic=[...scriptDynamic];
  const addEdge=(from,to)=>{if(!edges.has(from))edges.set(from,new Set());edges.get(from).add(to);};
  for(const imp of imports)if(imp.eager&&models.has(imp.to))addEdge(`${imp.from}#module`,`${imp.to}#module`);
  for(const imp of imports)if(imp.owner&&models.has(imp.to))addEdge(imp.owner,`${imp.to}#module`);
  for(const [file,m] of models) {
    dynamic.push(...m.dynamic);
    for(const call of m.calls) {
      let target;
      const imported=call.base&&lookup(file,call.base,call.owner).binding;
      if(imported?.name==='*')target=exported(localFile(root,file,imported.spec),call.name);
      else if(!call.base)target=binding(file,call.name,new Set(),call.owner);
      if(!call.base&&lookup(file,call.name,call.owner).binding?.parameter)dynamic.push({file,line:call.line,kind:'parameter-dispatch'});
      if(target)addEdge(call.owner,target);
      if(call.iife)addEdge(call.owner,call.iife);
      if(['then','catch','finally','map','filter','forEach','reduce','some','every'].includes(call.name))for(const callback of call.callbacks)addEdge(call.owner,callback);
    }
    for(const sink of m.sinks) {
      const endpoint=sink.name==='invoke'?'/functions/v1/iaia':stringValue(file,sink.arg,new Set(),sink.owner),classification=endpoint===null||endpoint.includes('${dynamic}')?'dynamic':classificaEndpoint(endpoint);
      // A fixed AI prefix remains AI even if the body/path is dynamic.
      const ai=endpoint!==null&&classificaEndpoint(endpoint)==='ai';
      const record={file,line:sink.line,owner:sink.owner,transport:sink.name,endpoint,classification:ai?'ai':classification};sinks.push(record);
      if(record.classification==='dynamic')dynamic.push({file,line:sink.line,kind:'configured-transport'});
      if(ai&&!optional.has(file))issues.push({code:'AI_OUTSIDE_OPTIONAL_BOUNDARY',...record});
    }
  }
  const roots=contract.entries.map(file=>`${file}#module`);
  for(const imp of imports)if(imp.kind)roots.push(`${imp.to}#module`);
  for(const [file,m] of models)if(file.startsWith('tooling/gates/')||file.startsWith('scripts/botigues/'))for(const id of m.functions.keys())if(!optional.has(file))roots.push(id);
  for(const spec of contract.criticalFunctions)for(const name of spec.exports){const id=exported(spec.file,name);if(id)roots.push(id);else issues.push({code:'CRITICAL_EXPORT_MISSING',file:spec.file,detail:name});}
  const reached=new Map(roots.map(id=>[id,[id]])),pending=[...roots];
  for(let i=0;i<pending.length;i++)for(const target of edges.get(pending[i])??[])if(!reached.has(target)){reached.set(target,[...reached.get(pending[i]),target]);pending.push(target);}
  for(const [file,m] of models)for(const call of m.calls)if(reached.has(call.owner)&&call.callbacks.length&&!['then','catch','finally','map','filter','forEach','reduce','some','every'].includes(call.name))dynamic.push({file,line:call.line,kind:'callback-dispatch'});
  for(const sink of sinks)if(sink.classification==='ai'&&reached.has(sink.owner))issues.push({code:'AI_ON_CRITICAL_CALL_PATH',...sink,chain:reached.get(sink.owner)});
  return {schema:contract.schema,ok:issues.length===0,status:issues.length?'fail':'pass-with-limits',issues,
    coverage:{files:models.size,bytes,astNodes:budget.nodes,directCallEdges:[...edges.values()].reduce((n,s)=>n+s.size,0),criticalRoots:roots.length},
    sources:[...models.keys()].sort(),hook:hook.trim().split('\n').filter(l=>/\bnode\s/.test(l)),scripts:scriptEvidence,imports,sinks,dynamic,external:[...external].sort(),optionalAi:contract.optionalAi,limits};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const args=process.argv.slice(2),json=args.includes('--json');
  const rootIndex=args.indexOf('--root');
  if(rootIndex>=0&&(!args[rootIndex+1]||args[rootIndex+1].startsWith('--'))||args.some((arg,i)=>!['--json','--root'].includes(arg)&&!(rootIndex>=0&&i===rootIndex+1))){process.stderr.write('Usage: tractor-zero-dependencia-ia.mjs [--root PATH] [--json]\n');process.exitCode=2;}
  else {try{const result=inspectaContracte({...(rootIndex>=0?{root:args[rootIndex+1]}:{})});
    process.stdout.write(json?`${JSON.stringify(result,null,2)}\n`:`Zero dependència IA: ${result.status}; ${result.coverage.files} fonts, ${result.issues.length} infraccions, ${result.dynamic.length} límits dinàmics declarats.\n`);
    process.exitCode=result.ok?0:1;
  }catch(error){process.stderr.write(`Zero dependència IA: ${error.message}\n`);process.exitCode=1;}}
}
