import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { creaInventariEstatic, escriuInventariEstatic, verificaInventariEstatic } from './inventari-estatic.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const cli=fileURLToPath(new URL('./inventari-estatic.mjs',import.meta.url));
const files={
 'index.html':'<!doctype html><title>Node</title>',
 'manifest.webmanifest':'{"name":"Node","start_url":"/"}',
 '.well-known/host-meta':'<XRD/>', '.well-known/nodeinfo':'{"links":[]}',
 '.well-known/webfinger/sella.json':'{"subject":"acct:sella@sella.example"}',
 '.well-known/webfinger.nginx':'return 404;', 'nodeinfo/2.1.json':'{"version":"2.1"}',
 'opendata/manifest.json':'{"schema":"public"}', 'opendata/municipi.jsonld':'{"@id":"https://sella.example/"}',
 'ap/actors/sella.json':'{"id":"https://sella.example/ap/actors/sella.json"}',
 'assets/app-01.js':'console.log("node")', 'assets/pages/01_chat/.keep':'',
 '.htaccess':'Header set X-Test node', '_headers':'/*', 'sw.js':'/* offline */',
 'federation/manifest.json':'{"proof":{"type":"DataIntegrityProof","proofValue":"zPublica"}}'
};
function fixture(t) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-inventari-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const dist=path.join(dir,'dist');fs.mkdirSync(dist);
 for(const [cami,bytes] of Object.entries(files)){const abs=path.join(dist,cami);fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,bytes);}
 const manifest=path.join(dir,'inventari-dist.json');return {dir,dist,manifest};
}
function paquet(t){const f=fixture(t),rebut=escriuInventariEstatic(f);return {...f,...rebut};}
test('inventaria exactament tots els regulars, també ocults, totes les categories i firma pública existent',t=>{
 const f=paquet(t),inv=JSON.parse(fs.readFileSync(f.manifest,'utf8'));
 assert.deepEqual(inv.fitxers.map(x=>x.cami),Object.keys(files).sort());
 for(const row of inv.fitxers){const bytes=Buffer.from(files[row.cami]);assert.equal(row.bytes,bytes.length);assert.equal(row.sha256,sha(bytes));}
 assert.equal(inv.fitxers.find(x=>x.cami==='federation/manifest.json').sha256,sha(files['federation/manifest.json']));
 assert.equal(f.sha256Confiat,sha(fs.readFileSync(f.manifest)));
 assert.equal(verificaInventariEstatic(f).valid,true);assert.equal(inv.fitxers.some(x=>x.cami==='inventari-dist.json'),false);
});
test('cap verificador accepta l’absència d’anchor o un anchor erroni',t=>{
 const f=paquet(t);for(const value of [undefined,null,'',true,'0'.repeat(64),'A'.repeat(64)])assert.throws(()=>verificaInventariEstatic({...f,sha256Confiat:value}));
});
for(const cami of ['index.html','manifest.webmanifest','.well-known/host-meta','.well-known/nodeinfo','nodeinfo/2.1.json','opendata/municipi.jsonld','ap/actors/sella.json','assets/app-01.js']){
 test('alteració de bytes rebutjada: '+cami,t=>{const f=paquet(t);fs.appendFileSync(path.join(f.dist,cami),'ALTERAT');assert.throws(()=>verificaInventariEstatic(f),/inventari|cobertura|empremta|bytes/i);});
}
test('cobertura exacta rebutja supressions, extres i directori extra encara buit',t=>{
 const f=paquet(t);fs.unlinkSync(path.join(f.dist,'sw.js'));assert.throws(()=>verificaInventariEstatic(f));fs.writeFileSync(path.join(f.dist,'sw.js'),files['sw.js']);
 fs.writeFileSync(path.join(f.dist,'assets/extra.js'),'extra');assert.throws(()=>verificaInventariEstatic(f));fs.unlinkSync(path.join(f.dist,'assets/extra.js'));
 fs.mkdirSync(path.join(f.dist,'assets/buit'));assert.throws(()=>verificaInventariEstatic(f));
});
test('un manifest recalculat no pot substituir l’anchor extern original',t=>{
 const f=paquet(t),confiat=f.sha256Confiat;fs.appendFileSync(path.join(f.dist,'assets/app-01.js'),'ALTERAT');fs.unlinkSync(f.manifest);
 const alterat=escriuInventariEstatic(f);assert.notEqual(alterat.sha256Confiat,confiat);assert.throws(()=>verificaInventariEstatic({...f,sha256Confiat:confiat}),/confian|empremta/i);
 assert.equal(verificaInventariEstatic({...f,sha256Confiat:alterat.sha256Confiat}).valid,true);
});
test('allowlist rebutja arrels desconegudes, secrets, paths ambigus i manifest dins dist',t=>{
 const f=fixture(t);for(const cami of ['.env','desconegut.json','assets/.env','assets/a%2fb.js','assets/a\\b.js']){
 fs.writeFileSync(path.join(f.dist,cami),'x');assert.throws(()=>creaInventariEstatic(f.dist),/camí|admé|admes|llista/i);fs.unlinkSync(path.join(f.dist,cami));}
 assert.throws(()=>escriuInventariEstatic({...f,manifest:path.join(f.dist,'inventari-dist.json')}));
});
test('R14 receptes prerenderitzades entren amb cobertura exacta; arrels semblants i traversal no',t=>{
 const f=fixture(t),paths=['receptes/index.html','receptes/plat-de-prova-r15/index.html'];
 for(const p of paths){fs.mkdirSync(path.dirname(path.join(f.dist,p)),{recursive:true});fs.writeFileSync(path.join(f.dist,p),'<!doctype html><title>Fixture R15</title>');}
 const receipt=escriuInventariEstatic(f),inv=JSON.parse(fs.readFileSync(f.manifest));
 assert.deepEqual(inv.fitxers.filter(x=>x.cami.startsWith('receptes/')).map(x=>x.cami),paths.slice().sort());
 assert.equal(verificaInventariEstatic({...f,...receipt}).valid,true);
 fs.appendFileSync(path.join(f.dist,paths[1]),'ALTERAT');assert.throws(()=>verificaInventariEstatic({...f,...receipt}),/inventari|cobertura|empremtes/i);
 fs.writeFileSync(path.join(f.dist,paths[1]),'<!doctype html><title>Fixture R15</title>');
 fs.mkdirSync(path.join(f.dist,'receptes-privades'));assert.throws(()=>creaInventariEstatic(f.dist),/llista admesa/);fs.rmdirSync(path.join(f.dist,'receptes-privades'));
 const mutant=structuredClone(inv);mutant.fitxers.find(x=>x.cami===paths[1]).cami='receptes/../secret.html';
 fs.writeFileSync(f.manifest,JSON.stringify(mutant)+'\n');assert.throws(()=>verificaInventariEstatic({...f,sha256Confiat:sha(fs.readFileSync(f.manifest))}),/invàlid/);
});
test('symlinks en fitxer, directori, arrel i ancestors de manifest no es travessen',t=>{
 const f=fixture(t),extern=path.join(f.dir,'extern');fs.writeFileSync(extern,'extern');fs.symlinkSync(extern,path.join(f.dist,'assets/link.js'));assert.throws(()=>creaInventariEstatic(f.dist),/enllaç|simbòlic/);fs.unlinkSync(path.join(f.dist,'assets/link.js'));
 fs.symlinkSync(path.join(f.dist,'assets'),path.join(f.dist,'anima'));assert.throws(()=>creaInventariEstatic(f.dist));fs.unlinkSync(path.join(f.dist,'anima'));
 fs.symlinkSync(f.dist,path.join(f.dir,'alias'));assert.throws(()=>creaInventariEstatic(path.join(f.dir,'alias')));
 fs.symlinkSync(f.dir,path.join(f.dir,'manifest-alias'));assert.throws(()=>escriuInventariEstatic({...f,manifest:path.join(f.dir,'manifest-alias/inventari.json')}));
});
test('manifest estructuralment malformat continua fallant amb un hash extern coincident',t=>{
 const f=paquet(t),original=JSON.parse(fs.readFileSync(f.manifest));
 for(const muta of [x=>{x.fitxers.push(x.fitxers[0]);},x=>{x.fitxers.reverse();},x=>{x.fitxers[0].cami='../fora';},x=>{x.fitxers[0].bytes=-1;},x=>{x.fitxers[0].extra='x';},x=>{x.extra='x';}]){
 const inv=structuredClone(original);muta(inv);fs.writeFileSync(f.manifest,JSON.stringify(inv)+'\n');assert.throws(()=>verificaInventariEstatic({...f,sha256Confiat:sha(fs.readFileSync(f.manifest))}));}
});
test('categories obligatòries absents no generen un paquet acreditat',t=>{
 for(const cami of ['manifest.webmanifest','.well-known/host-meta','.well-known/nodeinfo','nodeinfo/2.1.json','opendata/manifest.json']){
 const f=fixture(t);fs.unlinkSync(path.join(f.dist,cami));assert.throws(()=>escriuInventariEstatic(f),/Falta|categoria/i);}
});
test('productor i CLI són deterministes entre dos entorns i rutes, verificador exigix anchor explícit',t=>{
 const a=fixture(t),b=fixture(t);let anchor;
 for(const [f,TZ,LANG] of [[a,'UTC','C'],[b,'Europe/Madrid','ca_ES.UTF-8']]){
 const r=spawnSync(process.execPath,[cli,'crea','--dist',f.dist,'--manifest',f.manifest],{env:{...process.env,TZ,LANG,LC_ALL:LANG},encoding:'utf8'});assert.equal(r.status,0,r.stderr);anchor=r.stdout.trim();assert.match(anchor,/^[0-9a-f]{64}$/);
 const ok=spawnSync(process.execPath,[cli,'verifica','--dist',f.dist,'--manifest',f.manifest,'--sha256-confiat',anchor],{encoding:'utf8'});assert.equal(ok.status,0,ok.stderr);assert.equal(JSON.parse(ok.stdout).valid,true);
 assert.equal(spawnSync(process.execPath,[cli,'verifica','--dist',f.dist,'--manifest',f.manifest],{encoding:'utf8'}).status,1);
 }
 assert.deepEqual(fs.readFileSync(a.manifest),fs.readFileSync(b.manifest));
});
test('recepta Nix real verifica abans de copiar i després, també per façana municipal',t=>{
 const f=fixture(t),root=fileURLToPath(new URL('../../',import.meta.url));
 const text=fs.readFileSync(process.env.SDP_FLAKE_FONT??path.join(root,'flake.nix'),'utf8'),fase=/installPhase = ''([\s\S]*?)'';/.exec(text)?.[1];assert.ok(fase);
 assert.ok(text.includes('"integritat"'));assert.ok(fase.indexOf('verifica')<fase.indexOf('cp -R dist'));
 assert.ok(fs.readFileSync(process.env.SDP_MUNICIPAL_FLAKE??path.join(root,'nix/flake.nix'),'utf8').includes('release.lib.mkWeb'));
 fs.mkdirSync(path.join(f.dir,'tooling/instalador'),{recursive:true});fs.copyFileSync(cli,path.join(f.dir,'tooling/instalador/inventari-estatic.mjs'));
 const env={...process.env,TMPDIR:f.dir,out:path.join(f.dir,'out'),integritat:path.join(f.dir,'integritat')};
 const r=spawnSync('bash',['-eu','-c','runHook(){ :; }\n'+fase],{cwd:f.dir,env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const manifest=path.join(env.integritat,'inventari-dist.json'),sha256Confiat=fs.readFileSync(path.join(env.integritat,'sha256-confiat'),'utf8').trim();
 assert.equal(verificaInventariEstatic({dist:env.out,manifest,sha256Confiat}).valid,true);
 // Un cp interposat altera els bytes DESPRÉS de l’acreditació inicial: el segon control ha de fallar.
 const bin=path.join(f.dir,'bin');fs.mkdirSync(bin);const cp=spawnSync('which',['cp'],{encoding:'utf8'}).stdout.trim();
 fs.writeFileSync(path.join(bin,'cp'),'#!/bin/sh\nprintf "ALTERAT" >> "$PWD/dist/assets/app-01.js"\nexec '+cp+' "$@"\n',{mode:0o755});
 fs.rmSync(env.out,{recursive:true,force:true});fs.rmSync(env.integritat,{recursive:true,force:true});fs.rmSync(path.join(f.dir,'inventari-dist.json'),{force:true});
 const bad=spawnSync('bash',['-eu','-c','runHook(){ :; }\n'+fase],{cwd:f.dir,env:{...env,PATH:bin+path.delimiter+process.env.PATH},encoding:'utf8'});assert.notEqual(bad.status,0);
});
