import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {projectaDestins, textDestins, comprovaDestins, destinsCLI} from '../tooling/brain/destins_canonics.mjs';
import {inventari, projeccions} from '../tooling/brain/cataleg_skills.mjs';
import {prepara} from '../tooling/brain/context_documental.mjs';

const registry = () => ({schema:'sdp.protocolledge.v4',onUnknown:'error',rutes:[
  {id:'auditoria',tipus:'informe',claus:['auditoria'],plantilla:'templates/audit.md',lectures:[],destins:['_wiki_de_poble/04_escriptori']},
  {id:'acta',tipus:'acta',claus:['acta'],plantilla:'templates/audit.md',lectures:[],destins:['_wiki_de_poble/10_actes','_wiki_de_poble/04_escriptori']},
]});
function fixture(t, reg = registry()) {
  const root=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-destins-')));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const put=(rel,text)=>{const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);};
  put('.agents/protocolledge.json',JSON.stringify(reg));put('.agents/DESTINS_CANONICS.json',textDestins(reg));
  for(const name of ['BOOTSTRAP.md','AGENTS.md','PROFILE.md','BASELINE.md','PROTOCOL_PETORRETA.md','consell.json'])put('.agents/'+name,'# Font de prova\n');
  put('templates/audit.md','# Plantilla de prova\n');
  put('.agents/skills/prova/SKILL.md','---\ntype: skill\nstatus: canonic\nname: prova\ndescription: Procediment de prova per a la càrrega del context.\ntriggers_on: [auditoria]\n---\n# Prova\n');
  for(const[rel,text]of projeccions(inventari(root)))put(rel,text);
  return{root,put};
}
const capture=()=>{const out=[],err=[];return{out,err,io:{stdout:{write:s=>out.push(s)},stderr:{write:s=>err.push(s)}}};};

test('projecció determinista conserva rutes i normalitza només ordre/barra final',()=>{
  const a=registry(),before=JSON.stringify(a),b=registry();b.rutes.reverse();b.rutes[0].destins.reverse();b.rutes[0].destins[0]+='/';
  assert.equal(textDestins(a),textDestins(b));assert.equal(JSON.stringify(a),before);
  assert.deepEqual(projectaDestins(a).rutes.map(r=>r.id),['acta','auditoria']);
  assert.deepEqual(projectaDestins(a).rutes[0].destins,['_wiki_de_poble/04_escriptori','_wiki_de_poble/10_actes']);
  assert.equal(projectaDestins(a).font,'.agents/protocolledge.json');
});
test('editar plantilla, lectures o versió no inventa canvi de destinacions',()=>{
  const a=registry(),b=registry();b.rutes[0].plantilla='altra.md';b.rutes[0].lectures=['extra.md'];b.rutes[0].version='5';
  assert.equal(textDestins(a),textDestins(b));
});
test('canvi de destí, id o tipus canvia digest i projecció',()=>{
  const a=registry();for(const field of ['id','tipus','destins']){const b=registry();b.rutes[0][field]=field==='destins'?['new/path']:'nou';assert.notEqual(projectaDestins(a).contracte_sha256,projectaDestins(b).contracte_sha256);}
});
for(const bad of [null,{},[],{schema:'unknown',rutes:registry().rutes},{schema:'sdp.protocolledge.v4',rutes:[]}])test('registre incomplet no dona projecció saludable '+JSON.stringify(bad)?.slice(0,45),()=>assert.throws(()=>projectaDestins(bad)));
test('id duplicat, camps absents i destins duplicats queden rebutjats',()=>{
  const a=registry();a.rutes.push({...a.rutes[0]});assert.throws(()=>projectaDestins(a),/duplicada/);
  for(const field of ['id','tipus','destins']){const b=registry();delete b.rutes[0][field];assert.throws(()=>projectaDestins(b));}
  const c=registry();c.rutes[0].destins=['x','x/'];assert.throws(()=>projectaDestins(c),/duplicada/);
});
test('forats en arrays de l’API JS no es projecten com null',()=>{
  const a=registry();a.rutes=new Array(1);assert.throws(()=>projectaDestins(a));
  const b=registry();b.rutes[0].destins=new Array(1);assert.throws(()=>projectaDestins(b));
});
for(const bad of ['/absolute','../outside','x/../a','x//a','x/./a','https://example.invalid','x\\a','x/*.md',' x','x\0a'])test('destí relatiu malformat rebutjat '+JSON.stringify(bad),()=>{const a=registry();a.rutes[0].destins=[bad];assert.throws(()=>projectaDestins(a));});

test('check de només lectura detecta mapa antic sense reparar-lo',t=>{
  const f=fixture(t),file=path.join(f.root,'.agents/DESTINS_CANONICS.json');assert.deepEqual(comprovaDestins(f.root),{ok:true,errors:[]});
  f.put('.agents/DESTINS_CANONICS.json',JSON.stringify({destins_permesos:{safata_entrada:'old'}}));const before=fs.readFileSync(file);
  assert.equal(comprovaDestins(f.root).ok,false);assert.deepEqual(fs.readFileSync(file),before);
});
test('font absent, caixa incorrecta, JSON corrupte i symlink no passen',t=>{
  const f=fixture(t),file=path.join(f.root,'.agents/protocolledge.json'),original=fs.readFileSync(file);
  fs.unlinkSync(file);assert.equal(comprovaDestins(f.root).ok,false);
  fs.writeFileSync(path.join(f.root,'.agents/Protocolledge.json'),original);assert.equal(comprovaDestins(f.root).ok,false);
  fs.writeFileSync(file,'{');assert.equal(comprovaDestins(f.root).ok,false);fs.unlinkSync(file);
  fs.symlinkSync(path.join(f.root,'.agents/Protocolledge.json'),file);assert.equal(comprovaDestins(f.root).ok,false);
});
test('carregador real rebutja projecció divergent abans de lliurar context',t=>{
  const f=fixture(t);assert.ok(prepara('auditoria',[],f.root).fonts.some(s=>s.ruta==='.agents/DESTINS_CANONICS.json'));
  f.put('.agents/DESTINS_CANONICS.json','{}\n');assert.throws(()=>prepara('auditoria',[],f.root),/Projecció divergent/);
});
test('canvi de destí exigix regeneració; altres esmenes no',t=>{
  const f=fixture(t),reg=registry();reg.rutes[0].version='5';f.put('.agents/protocolledge.json',JSON.stringify(reg));
  assert.doesNotThrow(()=>prepara('auditoria',[],f.root));reg.rutes[0].destins=['new/destination'];f.put('.agents/protocolledge.json',JSON.stringify(reg));
  assert.throws(()=>prepara('auditoria',[],f.root),/Projecció divergent/);f.put('.agents/DESTINS_CANONICS.json',textDestins(reg));assert.doesNotThrow(()=>prepara('auditoria',[],f.root));
});
test('CLI check/print són de només lectura i no admeten bandera d’escriptura',t=>{
  const f=fixture(t),file=path.join(f.root,'.agents/DESTINS_CANONICS.json'),before=fs.readFileSync(file),c=capture();
  assert.equal(destinsCLI([],f.root,c.io),0);assert.equal(JSON.parse(c.out.join('')).ok,true);
  const p=capture();assert.equal(destinsCLI(['--print'],f.root,p.io),0);assert.equal(p.out.join(''),textDestins(registry()));
  for(const args of [['--write'],['--check','--print'],['--print','--print'],['--arrel'],['--arrel','x','--arrel','y'],['unexpected']])assert.equal(destinsCLI(args,f.root,capture().io),2);
  assert.deepEqual(fs.readFileSync(file),before);f.put('.agents/DESTINS_CANONICS.json','{}');assert.equal(destinsCLI([],f.root,capture().io),1);
});
test('CLI real: projecció divergent retorna1 i cap verd fals',t=>{
  const f=fixture(t);f.put('.agents/DESTINS_CANONICS.json','{}');
  const cli=fileURLToPath(new URL('../tooling/brain/destins_canonics.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[cli,'--arrel',f.root],{cwd:f.root,encoding:'utf8'});
  assert.equal(r.status,1,r.stderr);assert.equal(JSON.parse(r.stdout).ok,false);
});
