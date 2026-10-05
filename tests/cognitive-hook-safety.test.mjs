import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {anchored} from '../tooling/documental/core.mjs';
import {fixture} from './helpers/documental.mjs';
import {preTool} from '../tooling/gates/antigravity-hook.mjs';
import {arxiva,ancoratge,checkTaula,avui,vius} from '../tooling/gates/porta-olivera.mjs';
const DESK='_wiki_de_poble/04_escriptori',INDEX=`${DESK}/00_index_escriptori.md`,ARXIU='_wiki_de_poble/90_arxiu_historic';
const put=(root,file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);};
const get=(root,file)=>fs.readFileSync(path.join(root,file),'utf8');
const call=(root,args)=>preTool({toolCall:{name:'run_command',args}},{root});
test('variants destructives protegides force_ask; el classificador no executa cap ordre',t=>{
 const root=fixture(t),file=`${DESK}/${avui()}_0900_auditoria_guard.md`;
 put(root,file,'Document intacte\n');
 for(const CommandLine of [`rm ${file}`,`/bin/rm ${file}`,`'rm' ${file}`,`r'm' ${file}`,`r\\m ${file}`,`rm -rf .agents`,`/bin/RM -rf .AGENTS`,`rm -rf src/..`,`rm -rf .`,`rm -rf ./`,`rm -rf ..`,`rm -rf _wiki_de_poble`,`rm -rf *`,`rm -rf "${root}"`,`rm .a'gents'/test`,`rm _wiki_de_poble/04_escrip'tori'/test.md`,`rm _wiki_de_poble/04_escrip\\tori/test.md`,`/bin/mv ${file} /tmp/`,`cp ${file} /tmp/a && rm ${file}`,`sh -c 'rm ${file}'`,`node -e "require('fs').unlinkSync('${file}')"`,`python3 -c "import os; os.unlink('${file}')"`]) {
  assert.equal(call(root,{CommandLine}).decision,'force_ask',CommandLine);
 }
 assert.equal(call(root,{CommandLine:'rm a.md',Cwd:path.join(root,DESK)}).decision,'force_ask');
 assert.equal(call(root,{CommandLine:'rg -n "rm a.md" .',Cwd:path.join(root,DESK)}).decision,'allow');
 assert.equal(call(root,{CommandLine:'rm -rf .',Cwd:'/tmp'}).decision,'allow','neteja temporal fora del repo no és governança');
 assert.equal(get(root,file),'Document intacte\n');
});
test('lectures pures i via documental preaprovada continuen allow amb text rm i rutes governades',t=>{
 const root=fixture(t),file=`${DESK}/a.md`;
 for(const CommandLine of [`rg -n 'rm ${file}' .agents/skills`,`cat .agents/skills/core-higiene-escriptori/SKILL.md`,`ls ${DESK}`,'node tooling/gates/porta-olivera.mjs --arxiva --sec',`node tooling/wiki/document.mjs create --turn-id ID --file ${file} --description 'Audita rm . al Tauler'`,'npm test','mv src/a.js src/b.js'])assert.equal(call(root,{CommandLine}).decision,'allow',CommandLine);
});
test('eina directa o redirecció a governança no hereta un Always Allow vell',t=>{
 const root=fixture(t);
 for(const relative of ['.agents/skills/core-higiene-escriptori/SKILL.md','tooling/documental/turns.mjs','.github/workflows/ci.yml','package.json']) {
  const r=preTool({toolCall:{name:'write_to_file',args:{TargetFile:path.join(root,relative),CodeContent:'test'}}},{root});
  assert.equal(r.decision,'force_ask',relative);
  assert.equal(call(root,{CommandLine:`echo x > ${relative}`}).decision,'force_ask',relative);
 }
 assert.equal(call(root,{CommandLine:'rm one.md',Cwd:path.join(root,'.agents/skills')}).decision,'force_ask');
 assert.equal(call(root,{CommandLine:'npm test',Command:`rm ${DESK}/a.md`}).decision,'force_ask');
});
test('àncora d’una altra carpeta amb mateix basename no acredita un document solt',t=>{
 const root=fixture(t),name=`${avui()}_0900_auditoria_homonima.md`;
 put(root,`${DESK}/${name}`,'Document solt\n');
 put(root,INDEX,`# Índex\n\n- [[02_investigacio_ia/${name.slice(0,-3)}]]\n`);
 assert.deepEqual(ancoratge(root).senseAncora,[name]);
});
test('arxivar preserva text humà, àncora homònima externa i exemples de codi',t=>{
 const root=fixture(t),name=`${avui()}_0900_auditoria_preservada.md`,base=name.slice(0,-3);
 put(root,`${DESK}/${name}`,'Document original\n');
 const human='Text humà amb accent i instrucció independent.';
 put(root,`${DESK}/01_produccio/control.txt`,human);put(root,`${DESK}/00_bandeja_d_entrada/control.txt`,human);
 const before=`# Índex\n${human} [[${base}.md#Resultats|Veure]] i [[../10_actes/${base}]]\nExemple: \`[[${base}]]\`\n<!-- [[${base}]] -->\n`;
 put(root,INDEX,before);
 arxiva(root,{noms:[name]});
 const after=get(root,INDEX);
 assert.equal(after,before.replace(`[[${base}.md#Resultats|Veure]]`,''));
 assert.equal(get(root,`${ARXIU}/${name}`),'Document original\n');
 assert.equal(get(root,`${DESK}/01_produccio/control.txt`),human);assert.equal(get(root,`${DESK}/00_bandeja_d_entrada/control.txt`),human);
 assert.equal(checkTaula(root).valid,false,'la safata pendent continua explícitament roja');
});

test('importar porta Olivera des de node stdin no tracta el guió com a fitxer executable',()=>{
 const uri=new URL('../tooling/gates/porta-olivera.mjs',import.meta.url).href;
 const result=spawnSync(process.execPath,['--input-type=module','-'],{input:`import {checkTaula} from ${JSON.stringify(uri)}; console.log(typeof checkTaula);`,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'function');
});

test('àlies escapats de taula Obsidian són coherents i despenjar conserva cel·les humanes',t=>{
 const root=fixture(t),name='250101_0900_auditoria_alias_escapat.md',base=name.slice(0,-3),file=`${DESK}/${name}`;
 put(root,file,'Document antic viu\n');
 const link=`[[${base}\\|Etiqueta completa]]`,before=`# Índex\n\n## Activitat en curs\n\n| Document | Estat |\n| --- | --- |\n| ${link} | valor humà |\n`;
 put(root,INDEX,before);
 assert.ok(anchored(before,file));assert.ok(vius(root).has(base));assert.equal(checkTaula(root).valid,true);
 arxiva(root,{noms:[name]});assert.equal(get(root,INDEX),before.replace(link,''));assert.equal(checkTaula(root).valid,true);
});
for(const prefix of ['04_escriptori/','_wiki_de_poble/04_escriptori/','../04_escriptori/'])test(`un viu amb camí exacte ${prefix} no s’arxiva per data`,t=>{
 const root=fixture(t),name='250101_0900_auditoria_viu_amb_cami.md',base=name.slice(0,-3),file=`${DESK}/${name}`;
 put(root,file,'Document antic viu\n');put(root,INDEX,`# Índex\n\n## Activitat en curs\n\n- [[${prefix}${base}.md#Resultats|Nom]]\n`);
 assert.ok(vius(root).has(base));assert.equal(checkTaula(root).valid,true);assert.deepEqual(arxiva(root).moguts,[]);assert.equal(get(root,file),'Document antic viu\n');
});

test('àlies symlink de governança, hardlink i eixida física de l’arrel fallen tancats sense escriure',t=>{
 const root=fixture(t),protectedFile='.agents/hooks.json';put(root,protectedFile,'Governança intacta\n');
 fs.mkdirSync(path.join(root,'src'),{recursive:true});
 fs.symlinkSync('../.agents/hooks.json',path.join(root,'src/alias.js'));fs.linkSync(path.join(root,protectedFile),path.join(root,'src/hardlink.js'));
 fs.symlinkSync('/tmp/target-outside-governance',path.join(root,'src/escape.js'));
 for(const file of ['src/alias.js','src/hardlink.js','src/escape.js']) {
  const decision=preTool({toolCall:{name:'write_to_file',args:{TargetFile:path.join(root,file),CodeContent:'No s’escriu'}}},{root});
  assert.equal(decision.decision,'force_ask',file);
 }
 assert.equal(get(root,protectedFile),'Governança intacta\n');
});

test('redirecció quoted amb espais, quotes parcials i àlies físic no escreta governança',t=>{
 const root=fixture(t),nested=path.join(root,'Mas amb espais'),target=path.join(nested,'.agents/hooks.json');
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,'Governança intacta\n');fs.mkdirSync(path.join(nested,'src'),{recursive:true});fs.symlinkSync('../.agents/hooks.json',path.join(nested,'src/alias.js'));
 for(const CommandLine of [`printf x > '${target}'`,`printf x > "${target}"`,`printf x > ${target.replaceAll(' ','\\ ')}`,`printf x > src/alias.js`,`printf x > .a'gents'/hooks.json`,'printf x > ".agents/$target"','printf x > ".agents/${target:-hooks.json}"',`printf x | tee /tmp/ordinary-sdp-output '${target}'`]) {
  assert.equal(call(nested,{CommandLine}).decision,'force_ask',CommandLine);
 }
 assert.equal(fs.readFileSync(target,'utf8'),'Governança intacta\n');
});
