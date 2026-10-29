import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const FOSSILS=['.agents/ESTAT.md.abans-260830','.agents/manifest.yaml.abans-260830','.agents/pageContent_old.js','tooling/wiki/rules/trellat-rules.json.abans-260830','tooling/wiki/generar_petorreta_inversa.mjs.abans-260830','tooling/wiki/tractor-cognitiu.mjs.abans-260830','tooling/wiki/core/edge_rag.mjs.abans-260830'];
const archive=rel=>'_wiki_de_poble/90_arxiu_historic/fossils_retirats_261029/'+rel;
test('CLI real: fòssil abans al bundle, després arxivat sense contaminació ni pèrdua de bytes',t=>{
 const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-fossils-bundle-'))),root=path.join(parent,'repo'),output=path.join(parent,'outputs');
 fs.mkdirSync(root);fs.mkdirSync(output);t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));
 const put=(rel,content)=>{const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);};
 const current={'.agents/AGENTS.md':'# Current BIOS fixture\n','.agents/ESTAT.md':'# Current state fixture\n','.agents/LEDGER.md':'# Current ledger fixture\n','.agents/skills/current/SKILL.md':'# Current skill fixture\n','package.json':'{"type":"module"}\n','vite.config.js':'export default {};\n','eslint.config.js':'export default [];\n','index.html':'<!doctype html><html lang="ca"></html>\n','src/current.js':'export const current=true;\n','_wiki_de_poble/01_ser/00_bios.md':'# Current knowledge fixture\n'};
 for(const[rel,content]of Object.entries(current))put(rel,content);
 for(const dir of ['scripts','supabase','tests'])fs.mkdirSync(path.join(root,dir),{recursive:true});
 const tools=['tooling/brain/crear_bundle.mjs','tooling/lib/arrel.mjs','tooling/wiki/lib/prompt_sgq.mjs'];
 for(const rel of tools)put(rel,fs.readFileSync(path.join(ROOT,rel)));
 const canary='SYNTHETIC_FOSSIL_RAG_SENTINEL_261029';
 FOSSILS.forEach((rel,i)=>put(rel,`// Synthetic fossil ${i}: ${canary}_${i}\n`));
 const currentPaths=[...Object.keys(current),...tools],beforeCurrent=currentPaths.map(rel=>sha(fs.readFileSync(path.join(root,rel))));
 const run=phase=>{
  const destination=path.join(output,phase+'.md');
  const result=spawnSync(process.execPath,[path.join(root,tools[0]),'--perfil=macro','--eixida='+destination],{cwd:root,env:{...process.env,SDP_ARREL:root},encoding:'utf8'});
  assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
  return fs.readFileSync(destination,'utf8');
 };
 const before=run('before');assert.ok(before.includes(canary+'_2'));assert.ok(before.includes('## Fitxer: .agents/pageContent_old.js'));
 for(const rel of FOSSILS){
  const original=path.join(root,rel),destination=path.join(root,archive(rel)),digest=sha(fs.readFileSync(original));
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.renameSync(original,destination);
  assert.equal(fs.existsSync(original),false);assert.equal(sha(fs.readFileSync(destination)),digest);
 }
 const after=run('after');assert.equal(after.includes(canary),false);
 assert.ok(FOSSILS.every(rel=>!after.includes('## Fitxer: '+archive(rel))));
 assert.deepEqual(currentPaths.map(rel=>sha(fs.readFileSync(path.join(root,rel)))),beforeCurrent);
});

const ORIGINAL_HASHES = Object.freeze({
  ".agents/ESTAT.md.abans-260830": "da681ce7fcafda103c9a9e831b679d7fe4298cf2929b1f8d7d11ef9a5b2dce7f",
  ".agents/manifest.yaml.abans-260830": "7133d2fe2262e5d86141d8ffb1be7e7ce637fd3d8363ea74f10b9244b518a1fb",
  ".agents/pageContent_old.js": "43feb33df5ed78163bd0a52d6a88a0a897735231782f1f98865928a0244f4913",
  "tooling/wiki/rules/trellat-rules.json.abans-260830": "1ad9790a2365673d44ff1c1cd798c2a112bded4e829e8759ed78c3b8a31694a3",
  "tooling/wiki/generar_petorreta_inversa.mjs.abans-260830": "8cf2875b1fe48570fb9e781fc60cf82b1eae54d88946fdac6855ab654cbf90e6",
  "tooling/wiki/tractor-cognitiu.mjs.abans-260830": "b10ce9c482352b59c9c4e1a34800c7196ec7ac6b2cbd771d656edf4f4d1704d9",
  "tooling/wiki/core/edge_rag.mjs.abans-260830": "f92fcf825993fcdd539b4a248cf367f4ed9e91e5ac9ea12eabe094d870745bc7"
});
test('repositori: cap fòssil operatiu reapareix i cada original continua íntegre a l’arxiu',()=>{
  for(const rel of FOSSILS){
    assert.equal(fs.existsSync(path.join(ROOT,rel)),false,'Fòssil operatiu reintroduït: '+rel);
    const destination=path.join(ROOT,archive(rel));
    assert.equal(fs.existsSync(destination),true,'Original arxivat absent: '+rel);
    assert.equal(sha(fs.readFileSync(destination)),ORIGINAL_HASHES[rel],'Bytes històrics alterats: '+rel);
  }
});
