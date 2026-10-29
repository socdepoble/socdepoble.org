import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseDocument, validateSchema, sha} from '../tooling/documental/core.mjs';
import {markdownProse} from '../tooling/lib/markdown-prose.mjs';
import {extractDocumentLinks, resolveDocumentLink} from '../tooling/lib/document-links.mjs';
import {documentCorpus, documentLinkTargets} from '../tooling/lib/document-corpus.mjs';
import {auditContractClaims} from '../tooling/wiki/lib/contract_consistency.mjs';
import {parseMarkdown} from '../src/sections/wiki-de-poble/parseMarkdown.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const EQUIP='_wiki_de_poble/01_ser/03_equip_ia.md';
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const source=()=>JSON.parse(read('.agents/consell.json'));
const members=registry=>registry.membres.filter(m=>m.actiu===true);

// Taula editorial declarada, no inferència de rols a partir de prosa lliure.
function auditRoster(content,registry=source()) {
  if(!Array.isArray(registry?.membres))return {status:'incomplete',issues:['cens absent']};
  const active=members(registry),ids=active.map(m=>m.id);
  if(!active.length||new Set(ids).size!==ids.length||active.some(m=>['id','nom','rol','url'].some(k=>typeof m[k]!=='string'||!m[k].trim())))return {status:'incomplete',issues:['cens invàlid o buit']};
  const lines=markdownProse(content).split(/\r?\n/),heads=[];
  lines.forEach((l,i)=>{if(l==='## Cens vigent')heads.push(i);});
  if(heads.length!==1)return {status:'incomplete',issues:['secció vigent absent o duplicada']};
  let end=lines.findIndex((l,i)=>i>heads[0]&&/^## /.test(l));
  if(end<0)end=lines.length;
  const claims=[],seen=[],raw=content.split(/\r?\n/);
  for(let i=heads[0]+1;i<end;i++) {
    const match=/^\|\s*([a-z][a-z0-9-]*)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*\[[^\]]+\]\((https?:[^)]+)\)\s*\|$/.exec(lines[i]);
    if(!match)continue;
    const [,id,name,role,url]=match;seen.push(id);
    for(const [field,value]of [['nom',name],['rol',role],['url',url]])claims.push({id:`${id}:${field}`,value,path:EQUIP,line:i+1,text:raw[i]});
  }
  const issues=[];
  for(const id of ids)if(!seen.includes(id))issues.push(`membre absent:${id}`);
  for(const id of seen)if(!ids.includes(id))issues.push(`membre alié o inactiu:${id}`);
  if(new Set(seen).size!==seen.length)issues.push('fila duplicada');
  if(issues.length)return {status:'incomplete',issues};
  const scope='equip-cens-vigent';
  return auditContractClaims({scope,documents:[{path:EQUIP,content,authority:'active'}],catalog:{scope,canonical:active.flatMap(m=>['nom','rol','url'].map(k=>({id:`${m.id}:${k}`,value:m[k]}))),claims}});
}

test('equip conserva frontmatter canònic i resol les fonts de rols i lectura amb el resolutor real',()=>{
  const raw=read(EQUIP),doc=parseDocument(raw);
  assert.deepEqual(validateSchema(doc.data,JSON.parse(read('tooling/wiki/schema.json'))),[]);
  assert.ok(doc.data.aliases.includes('12 petorretes'));
  const files=documentLinkTargets(ROOT,documentCorpus(ROOT));
  const targets=extractDocumentLinks(raw).map(link=>path.relative(ROOT,resolveDocumentLink(link,path.join(ROOT,EQUIP),files,ROOT)));
  for(const target of ['AGENTS.md','.agents/cervell.json','.agents/PROFILE.md','.agents/consell.json','.agents/ESTAT.md','.agents/skills/core-consell-i-colmena/SKILL.md'])assert.ok(targets.includes(target),target);
});
test('taula vigent compara noms i rols exactes contra totes les membres actives de la font',()=>{
  const result=auditRoster(read(EQUIP));assert.equal(result.status,'no-explicit-disagreements');
  assert.equal(result.coverage.catalog.activeClaims,members(source()).length*3);
  assert.equal(result.coverage.catalog.comparedIds,members(source()).length*3);
});
test('un perfil obsolet produeix desacord localitzat encara que el nom continue correcte',()=>{
  const m=members(source())[0],raw=read(EQUIP).replace(`| ${m.id} | ${m.nom} | ${m.rol} | [${m.nom}](${m.url}) |`,`| ${m.id} | ${m.nom} | Rol antic | [${m.nom}](${m.url}) |`),result=auditRoster(raw);
  assert.equal(result.status,'explicit-disagreements');assert.equal(result.findings.length,1);
  assert.equal(result.findings[0].contract,`catalog:${m.id}:rol`);assert.equal(result.findings[0].requiresReview,true);
});
test('un nom comercial o de model atribuït sense font produeix desacord nominal',()=>{
  const m=members(source())[0],raw=read(EQUIP).replace(`| ${m.id} | ${m.nom} |`,`| ${m.id} | Model inventat |`);
  const result=auditRoster(raw);assert.equal(result.status,'explicit-disagreements');assert.equal(result.findings[0].contract,`catalog:${m.id}:nom`);
});
test('cens absent, buit o duplicat i secció absent no donen verd per falta de dades',()=>{
  const raw=read(EQUIP),registry=source();
  for(const broken of [{},{membres:[]},{membres:[...registry.membres,registry.membres[0]]}])assert.equal(auditRoster(raw,broken).status,'incomplete');
  assert.equal(auditRoster('# Equip IA\nVegeu el cens.').status,'incomplete');
});
test('una membre retirada de la font o una fila repetida exigeixen reconciliació',()=>{
  const registry=source(),m=members(registry)[0],raw=read(EQUIP),row=`| ${m.id} | ${m.nom} | ${m.rol} | [${m.nom}](${m.url}) |`;
  assert.equal(auditRoster(raw,{...registry,membres:registry.membres.filter(x=>x.id!==m.id)}).status,'incomplete');
  assert.equal(auditRoster(raw.replace(row,row+'\n'+row)).status,'incomplete');
  assert.equal(auditRoster(raw.replace(row,'')).status,'incomplete');
});
test('exemples fenced, comentats i inline no reparen una membre real absent',()=>{
  const m=members(source())[0],row=`| ${m.id} | ${m.nom} | ${m.rol} | [${m.nom}](${m.url}) |`,raw=read(EQUIP).replace(row,'');
  for(const example of [`~~~markdown\n${row}\n~~~`,`<!--\n${row}\n-->`,`\`\`${row}\`\``])assert.equal(auditRoster(raw.replace('## Cens vigent','## Cens vigent\n'+example)).status,'incomplete');
  assert.equal(auditRoster('~~~~markdown\n'+read(EQUIP)+'\n~~~~').status,'incomplete');
});
test('un exemple complet abans de la taula no oculta un desacord vigent; dues seccions fallen tancades',()=>{
  const m=members(source())[0],raw=read(EQUIP),wrong=raw.replace(`| ${m.id} | ${m.nom} | ${m.rol} | [${m.nom}](${m.url}) |`,`| ${m.id} | ${m.nom} | Rol antic | [${m.nom}](${m.url}) |`);
  for(const prelude of [`~~~markdown\n${raw}\n~~~\n`,`<!--\n${raw}\n-->\n`])assert.equal(auditRoster(prelude+wrong).status,'explicit-disagreements');
  assert.equal(auditRoster(raw+'\n## Cens vigent\n').status,'incomplete');
});
test('el lector web real mostra tots els perfils sense dependre d’una transclusió Obsidian',()=>{
  const html=parseMarkdown(parseDocument(read(EQUIP)).body,{entradilla:false});
  assert.equal(html.includes('![['),false);
  for(const m of members(source()))assert.ok(html.includes(`<td>${m.nom}</td>`)&&html.includes(`<td>${m.rol}</td>`),m.id);
});
test('lectura, resolució i comprovació deixen intactes les fonts i la memòria narrativa',()=>{
  const files=[EQUIP,'_wiki_de_poble/01_ser/agents_equip_ia.md','AGENTS.md','.agents/cervell.json','.agents/consell.json','.agents/PROFILE.md','.agents/ESTAT.md','.agents/skills/core-consell-i-colmena/SKILL.md'];
  const before=files.map(p=>sha(read(p)));auditRoster(read(EQUIP));extractDocumentLinks(read(EQUIP));
  assert.deepEqual(files.map(p=>sha(read(p))),before);
});
