import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {checkPayload,normalitza} from '../tooling/gates/porta-reflex.mjs';
import {fixture,validDoc,writeDoc,REPO} from './helpers/documental.mjs';
const payload=(d,content=d.content,file=d.file)=>({tool_name:'Write',tool_input:{file_path:file,content}});
function setup(t){const root=fixture(t),d=validDoc(root);assert.equal(checkPayload(payload(d),root).code,0);return {root,d};}

for(const [name,mutate,reason] of [
  ['rebut inventat',s=>s.replace(/^reflex:.*$/m,'reflex: rebut completament inventat sense registre'),/reflex/],
  ['status desconegut',s=>s.replace('status: esborrany','status: patata'),/status.*enum/],
  ['camp desconegut',s=>s.replace('status:','recipient: fantasma\nstatus:'),/desconeguda recipient/],
  ['type duplicat',s=>s.replace('type: informe','type: prompt\ntype: informe'),/duplicated mapping key/],
  ['tipus fora de l’enum',s=>s.replace('type: informe','type: planificacio'),/type.*enum/],
  ['document no evita rebut',s=>s.replace('type: informe','type: document').replace(/^reflex:.*\n/m,''),/reflex/],
  ['descripció numèrica',s=>s.replace(/^description:.*$/m,'description: 1234567890123456'),/description.*string/],
  ['descripció curta',s=>s.replace(/^description:.*$/m,'description: curt'),/description.*curt/],
  ['tags desconeguts',s=>s.replace(/tags:\n(?: {2}- .*\n)+/,'tags: [fantasma]\n'),/tags.*enum/],
  ['llista on cal escalar',s=>s.replace('status: esborrany','status: [esborrany]'),/status.*string/],
  ['falta Registre',s=>s.replace('## Registre','## Altre'),/Registre/],
  ['falta camp Registre',s=>s.replace(/^\| Entorn .*\n/m,''),/Registre: falta Entorn/],
  ['secció pendent',s=>s.replace(/## Troballes\n\n[^\n]+/,'## Troballes\n\n[pendent]'),/Troballes/],
  ['secció dins de codi',s=>s.replace('## Troballes\n\nResultat comprovat amb evidència.','```md\n## Troballes\n\nResultat comprovat amb evidència.\n```'),/Troballes/],
  ['sense frontmatter',()=> '# Text sense YAML',/Frontmatter/],
  ['frontmatter sense tancar',()=> '---\ntype: informe',/Frontmatter/],
  ['doble frontmatter',s=>s.replace(/---\n# /,'---\n---\ntype: prompt\n---\n# '),/DOS blocs/]
]) test(`bloqueja ${name} després d’una prova positiva`,t=>{const {root,d}=setup(t);const r=checkPayload(payload(d,mutate(d.content)),root);assert.equal(r.code,2);assert.match(r.errors.join('\n'),reason);});

test('Antigravity bloqueja amb 1 i accepta document complet vàlid',t=>{const {root,d}=setup(t);const p={toolArgs:{TargetFile:d.file,CodeContent:d.content}};assert.equal(checkPayload(p,root).code,0);p.toolArgs.CodeContent='sense YAML';assert.equal(checkPayload(p,root).code,1);});
test('ruta equivalent i cwd de l’host no eviten validació',t=>{const {root,d}=setup(t);assert.equal(checkPayload(payload(d,'sense YAML',d.file.replace('/04_','/./04_')),root).code,2);assert.equal(checkPayload({...payload(d,'sense YAML',path.basename(d.file)),cwd:path.join(root,'_wiki_de_poble/04_escriptori')},root).code,2);});
test('symlink de directori i de fitxer no eviten la porta',t=>{const {root,d}=setup(t);writeDoc(root,d);fs.symlinkSync(path.join(root,'_wiki_de_poble/04_escriptori'),path.join(root,'alias'));fs.symlinkSync(path.join(root,d.file),path.join(root,'alias.md'));for(const file of [`alias/${path.basename(d.file)}`,'alias.md'])assert.equal(checkPayload(payload(d,'sense YAML',file),root).code,2);});
test('symlink que escapa i producció humana bloquegen',t=>{const {root,d}=setup(t);fs.symlinkSync('/tmp',path.join(root,'_wiki_de_poble/04_escriptori/fora'));assert.equal(checkPayload(payload(d,d.content,'_wiki_de_poble/04_escriptori/fora/doc.md'),root).code,2);assert.equal(checkPayload(payload(d,d.content,'_wiki_de_poble/04_escriptori/01_produccio/doc.md'),root).code,2);});
test('Edit reconstrueix replace_all i no interpreta $&',t=>{const {root,d}=setup(t);writeDoc(root,d);const p={tool_name:'Edit',tool_input:{file_path:d.file,old_string:'Resultat comprovat amb evidència.',new_string:'Text literal $&',replace_all:true}};const op=normalitza(p,root);assert.ok(op.contingut.includes('Text literal $&'));assert.ok(!op.contingut.includes('Resultat comprovat amb evidència.'));assert.equal(checkPayload(p,root).code,0);});
test('Edit rebutja old_string absent, ambigu o fitxer absent',t=>{const {root,d}=setup(t);writeDoc(root,d);for(const old_string of ['inexistent','Resultat comprovat amb evidència.','']){const p={tool_input:{file_path:d.file,old_string,new_string:'X'}};assert.equal(checkPayload(p,root).code,2);}assert.equal(checkPayload({tool_input:{file_path:d.file+'absent.md',old_string:'x',new_string:'y'}},root).code,2);});
test('Antigravity comprova tots els fragments del resultat',t=>{const {root,d}=setup(t);writeDoc(root,d);const p={toolArgs:{TargetFile:d.file,ReplacementChunks:[{TargetContent:'# Prova vàlida',ReplacementContent:'# Prova editada'},{TargetContent:'status: esborrany',ReplacementContent:'status: patata'}]}};const r=checkPayload(p,root);assert.equal(r.code,1);assert.match(r.errors.join(),/status.*enum/);});
test('payload desconegut i shell no obtenen una validació fictícia',t=>{const {root}=setup(t);for(const p of [{params:{file:'x'}},{tool_name:'Bash',tool_input:{command:'echo text'}},{}])assert.equal(checkPayload(p,root).code,2);});
test('fitxers fora de l’escriptori no es validen com documents formals',t=>{const {root,d}=setup(t);for(const f of ['src/App.jsx','README.md'])assert.equal(checkPayload(payload(d,'qualsevol',f),root).code,0);});
test('CLI no accepta entrada buida o JSON corrupte com a prova',()=>{for(const input of ['', '{invalid']){const p=spawnSync(process.execPath,[path.join(REPO,'tooling/gates/porta-reflex.mjs')],{input,encoding:'utf8'});assert.notEqual(p.status,0);}});
