import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import http from 'node:http';
import assert from 'node:assert/strict';
import {certificaEnllacos,extreuUrlsDeText,verificaRutaContraArbre,verificaUrlRemota} from '../tooling/gates/certifica-enllacos.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const resposta=(body,type='application/json',url='')=>({ok:true,status:200,url,headers:new Map([['content-type',type]]),text:async()=>body});
for(const target of ['javascript://socdepoble.org/notes','ftp://socdepoble.org/notes','https://user:password@socdepoble.org/notes']) test('no certifica protocols/autoritat invàlids: '+target,()=>assert.equal(verificaRutaContraArbre(target,{}).ok,false));
test('un slug amb percentatge malformat no interromp tot el lot',async()=>{const r=await certificaEnllacos({arrel:root,urls:['/page/%E0%A4%A','/notes']});assert.equal(r.ok,false);assert.equal(r.resultats.length,2);assert.equal(r.resultats[1].ok,true);});
test('remot verifica també una ruta relativa, sense fals doble certificat',async()=>{let calls=0;const r=await certificaEnllacos({arrel:root,urls:['/opendata/manifest.json'],remot:true,fetchImpl:async url=>{calls++;assert.match(url,/^https:\/\/socdepoble.org\/opendata/);return resposta('<html>fallback</html>','text/html');}});assert.equal(calls,1);assert.equal(r.ok,false);});
test('lectura de documents inclou href relatius i Markdown',()=>{const r=extreuUrlsDeText('<a href="/page/no-existix">x</a> [x](/opendata/no-existix.json)');assert.ok(r.includes('/page/no-existix'));assert.ok(r.includes('/opendata/no-existix.json'));});
for(const [body,mime] of [['text inesperat','application/json'],['{}','text/plain'],['{}','text/html']]) test('endpoint JSON rebutja cos/MIME divergents '+mime+body,async()=>assert.equal((await verificaUrlRemota('https://socdepoble.org/opendata/manifest.json',{tipus:'opendata'},{fetchImpl:async()=>resposta(body,mime)})).ok,false));
test('HTTP200 amb pantalla NotFound no és una verificació de SPA vàlida',async()=>assert.equal((await verificaUrlRemota('https://socdepoble.org/notes',{tipus:'spa-ruta'},{fetchImpl:async()=>resposta('<html><title>404 - No Trobat | Sóc de Poble</title><h1>Error 404</h1></html>','text/html')})).ok,false));
test('redirecció a un destí alié no certifica l’URL original',async()=>assert.equal((await verificaUrlRemota('https://socdepoble.org/opendata/manifest.json',{tipus:'opendata'},{fetchImpl:async()=>resposta('{}','application/json','https://altre.invalid/login')})).ok,false));
test('informe estàtic no s’anomena doble certificació',async()=>{const r=await certificaEnllacos({arrel:root,urls:['/notes']});assert.equal(r.dobleCertificacio,false);});

for(const target of ['/page/legal%2fno','/page/%0afoo','/page/%5cfoo']) test('rebutja codificació ambigua '+target,()=>assert.equal(verificaRutaContraArbre(target,{}).ok,false));
test('manifest no convertix directoris o symlinks externs en recursos',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-enllacos-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'public/opendata/dir'),{recursive:true});fs.writeFileSync(path.join(dir,'fora.json'),'{}');fs.symlinkSync(path.join(dir,'fora.json'),path.join(dir,'public/opendata/fora.json'));
 const ctx={arrel:dir,recursosOpendata:new Set(['dir','fora.json'])};
 for(const name of ['dir','fora.json']) assert.equal(verificaRutaContraArbre('/opendata/'+name,ctx).ok,false);
});
test('CLI --fitxer reconeix un camí absolut i no el certifica com ruta SPA',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-enllacos-cli-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'document amb espais.md');fs.writeFileSync(file,'[mal](/page/aquesta-pagina-no-existix)');
 const r=spawnSync(process.execPath,[path.join(root,'tooling/gates/certifica-enllacos.mjs'),'--arrel',root,'--fitxer',file,'--json'],{encoding:'utf8'});assert.equal(r.status,1,r.stderr);const d=JSON.parse(r.stdout);assert.equal(d.total,1);assert.equal(d.falles[0].arbre.codi,'SPA_404_PAGE_SLUG');
});
test('fuzz de rutes inclou 2000 entrades adverses sense excepcions ni falses rutes conegudes',()=>{
 const ctx={PAGE_COPY:{legal:{title:'Legal'}},resolvePageSlugPath:()=>null,rutesSeccions:new Set(['/notes']),rutesDinamiques:[],arrel:root,federacioFitxers:new Map(),rewritesFirebase:[],recursosOpendata:new Set()};
 for(let i=0;i<2000;i++) {const raw=i%2?'/ruta-impossible-'+i:'/page/%E0%ZZ'+i;assert.equal(verificaRutaContraArbre(raw,ctx).ok,false,raw);}
});
test('stream remot massa gran es talla sense consumir la resta',async()=>{
 let n=0,cancelled=false;const r=await verificaUrlRemota('https://socdepoble.org/opendata/manifest.json',{tipus:'opendata'},{fetchImpl:async()=>({ok:true,status:200,headers:new Map([['content-type','application/json']]),body:{getReader:()=>({read:async()=>({done:false,value:new Uint8Array(1024*1024)}),cancel:async()=>{cancelled=true;},releaseLock:()=>{n++;}}) }})});assert.equal(r.ok,false);assert.equal(cancelled,true);assert.equal(n,1);
});

test('doble certificació usa HTTP real local i detecta canvi posterior a fallback',async t=>{
 let fallback=false;const server=http.createServer((req,res)=>{const data=req.url.startsWith('/opendata/');res.setHeader('Content-Type',data&&!fallback?'application/json':'text/html');res.end(data&&!fallback?'{"resources":[]}':'<!doctype html><html><title>Notes</title><body>Notes</body></html>');});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});t.after(()=>{server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port;
 const r=await certificaEnllacos({arrel:root,urls:[base+'/notes',base+'/opendata/manifest.json'],remot:true});assert.equal(r.dobleCertificacio,true);assert.equal(r.resultats.length,2);
 fallback=true;const bad=await certificaEnllacos({arrel:root,urls:[base+'/opendata/manifest.json'],remot:true});assert.equal(bad.ok,false);assert.equal(bad.dobleCertificacio,false);
});

test('expressions de rutes i subrouter de Consola mantenen els destins acreditats',async()=>{
 const good=await certificaEnllacos({arrel:root,urls:['/iaia','/consola','/consola/calendari','/consola/empaquetats','/consola/govern/requeriments','/consola/pols/carrega']});assert.equal(good.ok,true,JSON.stringify(good.falles));
 const bad=await certificaEnllacos({arrel:root,urls:['/consola/inventat']});assert.equal(bad.ok,false);assert.equal(bad.falles[0].arbre.codi,'SPA_404_SUBRUTA');
});
test('ruta dinàmica i comodí no simulen ni 404 ni existència de dades',async()=>{
 const r=await certificaEnllacos({arrel:root,urls:['/pobles/a','/notes/a','/app/bar/a'],remot:true,fetchImpl:async()=>resposta('<html>App</html>','text/html')});
 assert.equal(r.resultats[0].arbre.pendentDades,true);assert.equal(r.resultats[1].arbre.pendentDades,true);assert.equal(r.resultats[2].arbre.codi,'RUTA_PENDENT_RESOLUCIO');assert.equal(r.dobleCertificacio,false);
});
