import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { iniciaNodeGerma, validaConfig, validaCompilacioNode, adaptaFirebaseNode } from './inicia-node-germa.mjs';
const config={slug:'sella',nom:'Sella',origen:'https://sella.example',mode:'seed'};
function fixture(t) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-instalador-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const font=path.join(dir,'font');fs.mkdirSync(font);
 for(const n of ['src','tooling','public','scripts']) {fs.mkdirSync(path.join(font,n));fs.writeFileSync(path.join(font,n,'a.txt'),'font pública');}
 fs.writeFileSync(path.join(font,'package.json'),JSON.stringify({version:'1.0.0'}));
 fs.writeFileSync(path.join(font,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:{'':{version:'1.0.0'}}}));
 fs.writeFileSync(path.join(font,'firebase.json'), JSON.stringify({hosting:{site:'soc-de-poble',rewrites:[],headers:[]}}));
 fs.writeFileSync(path.join(font,'.env'),'SECRET_NO_COPIAR');
 return {dir,font,desti:path.join(dir,'node')};
}
function distDeProva(desti, c = config) {
 const files = {
  'index.html':'<!doctype html><title>Node de prova</title>',
  [`ap/actors/${c.slug}.json`]:JSON.stringify({id:`${c.origen}/ap/actors/${c.slug}.json`,preferredUsername:c.slug}),
  [`.well-known/webfinger/${c.slug}.json`]:JSON.stringify({subject:`acct:${c.slug}@${new URL(c.origen).host}`,links:[{rel:'self',href:`${c.origen}/ap/actors/${c.slug}.json`}]}),
  '.well-known/nodeinfo':JSON.stringify({links:[{href:`${c.origen}/nodeinfo/2.1.json`}]}),
  'nodeinfo/2.1.json':JSON.stringify({version:'2.1',software:{homepage:`${c.origen}/`}}),
  '.well-known/host-meta':`<Link template="${c.origen}/.well-known/webfinger/{uri}"/>`,
   'manifest.webmanifest':'{"name":"Node"}', 'assets/app.js':'/* node */',
   'opendata/manifest.json':'{"schema":"public"}', 'opendata/municipi.jsonld':'{"@id":"https://sella.example/"}'
 };
 for(const [rel,text] of Object.entries(files)) {const abs=path.join(desti,'dist',rel);fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,text);}
}
test('dues instal·lacions tenen manifest i bytes iguals, sense secrets ni git',t=>{
 const f=fixture(t);const a=iniciaNodeGerma({...f,config}), b=iniciaNodeGerma({...f,desti:path.join(f.dir,'altre'),config});
 assert.deepEqual(a,b);assert.equal(fs.existsSync(path.join(f.desti,'.git')),false);
 assert.ok(!fs.readFileSync(path.join(f.desti,'.env.local'),'utf8').includes('SECRET_NO_COPIAR'));
 assert.deepEqual(fs.readFileSync(path.join(f.desti,'node-germa.json')),fs.readFileSync(path.join(f.dir,'altre/node-germa.json')));
});
test('destí existent, solapat, symlink i lock incoherent es rebutgen abans d’escriure',t=>{
 const f=fixture(t);assert.throws(()=>iniciaNodeGerma({...f,desti:f.font,config}),/separar/);
 fs.mkdirSync(f.desti);assert.throws(()=>iniciaNodeGerma({...f,config}),/existix/);
 fs.symlinkSync('/tmp',path.join(f.font,'src','enllac'));assert.throws(()=>iniciaNodeGerma({...f,desti:path.join(f.dir,'nou'),config}),/simbòlic/);
 fs.unlinkSync(path.join(f.font,'src','enllac'));fs.writeFileSync(path.join(f.font,'package-lock.json'),'{}');
 assert.throws(()=>iniciaNodeGerma({...f,desti:path.join(f.dir,'nou'),config}),/incoherent/);
 assert.equal(fs.existsSync(path.join(f.dir,'nou')),false);
});
test('configuració rebutja secrets, shell i orígens no canònics',()=>{
 for(const c of [{slug:'../sella'},{origen:'http://sella.example'},{nom:'Sella\nVITE_X=1'},{mode:'remote',supabaseUrl:'https://example.supabase.co',anonKey:'sb_secret_no',tenantId:'bad'}]) assert.throws(()=>validaConfig({...config,...c}));
});
test('--build usa npm amb arguments fixos sense shell i conserva error',t=>{
 const f=fixture(t),calls=[];iniciaNodeGerma({...f,config,build:true,run:(...args)=>{calls.push(args);if(args[1][0]==='run')distDeProva(f.desti);return {status:0};}});
 assert.deepEqual(calls.map(c=>c.slice(0,2)),[['npm',['ci','--ignore-scripts','--no-audit','--no-fund']],['npm',['run','build:web']]]);assert.equal(calls[0][2].shell,false);
 assert.throws(()=>iniciaNodeGerma({...f,desti:path.join(f.dir,'fallit'),config,build:true,run:()=>({status:1})}),/ha fallat/);
});
test('CLI executable: prepara un node i falla sense arguments',t=>{
 const f=fixture(t), fitxer=path.join(f.dir,'config.json');fs.writeFileSync(fitxer,JSON.stringify(config));
 const cli=fileURLToPath(new URL('./inicia-node-germa.mjs',import.meta.url));
 const ok=spawnSync(process.execPath,[cli,'--font',f.font,'--desti',f.desti,'--config',fitxer],{encoding:'utf8'});
 assert.equal(ok.status,0,ok.stderr);assert.equal(JSON.parse(ok.stdout).slug,'sella');
 assert.equal(spawnSync(process.execPath,[cli],{encoding:'utf8'}).status,1);
});
test('--build no hereta cap VITE_ de l’entorn de qui instal·la',t=>{
 const f=fixture(t),calls=[];const abans=process.env.VITE_UMAMI_WEBSITE_ID;process.env.VITE_UMAMI_WEBSITE_ID='id-del-mas';
 t.after(()=>{if(abans===undefined)delete process.env.VITE_UMAMI_WEBSITE_ID;else process.env.VITE_UMAMI_WEBSITE_ID=abans;});
 iniciaNodeGerma({...f,config,build:true,run:(...args)=>{calls.push(args);if(args[1][0]==='run')distDeProva(f.desti);return {status:0};}});
 for(const c of calls){assert.equal(Object.hasOwn(c[2].env,'VITE_UMAMI_WEBSITE_ID'),false);assert.equal(c[2].env.VITE_CANONICAL_URL,'https://sella.example');}
});
test('FEDI-05 · Firebase deriva WebFinger de l’origen i l’actor nou, conserva la resta i lleva el lloc de desplegament', () => {
 const anterior={hosting:{site:'soc-de-poble',target:'mas',public:'dist',rewrites:[{regex:'^/\\.well-known/webfinger/antic$',destination:'/vell.json'},{source:'/app/**',destination:'/index.html'}],headers:[{regex:'^/\\.well-known/webfinger/antic$',headers:[]},{source:'**',headers:[{key:'X-Test',value:'conservat'}]}]}};
 const copia=JSON.stringify(anterior), adaptat=adaptaFirebaseNode(anterior,config);
 assert.equal(JSON.stringify(anterior),copia);
 assert.equal(adaptat.hosting.site,undefined);assert.equal(adaptat.hosting.target,undefined);
 assert.deepEqual(adaptat.hosting.rewrites.at(-1),anterior.hosting.rewrites[1]);
 assert.deepEqual(adaptat.hosting.headers[0],anterior.hosting.headers[1]);
 assert.ok(JSON.stringify(adaptat).includes('sella\\\\.example'));
 assert.ok(!JSON.stringify(adaptat).includes('antic'));
 assert.deepEqual(adaptaFirebaseNode(adaptat,config),adaptat);
 assert.throws(()=>adaptaFirebaseNode({hosting:[]},config),/Hosting/);
});
test('FEDI-05 · exit 0 sense documents o amb identitat aliena no acredita la compilació', t => {
 const f=fixture(t);
 assert.throws(()=>iniciaNodeGerma({...f,config,build:true,run:()=>({status:0})}));
 distDeProva(f.desti);
 assert.equal(validaCompilacioNode(f.desti,config).webfinger,'acct:sella@sella.example');
 const actor=path.join(f.desti,'dist/ap/actors/sella.json');
 fs.writeFileSync(actor,JSON.stringify({id:'https://altre.example/ap/actors/sella.json',preferredUsername:'sella'}));
 assert.throws(()=>validaCompilacioNode(f.desti,config),/no correspon/);
 distDeProva(f.desti);
 fs.writeFileSync(path.join(f.desti,'dist/ap/actors/intrus.json'),'{}');
 assert.throws(()=>validaCompilacioNode(f.desti,config),/identitats federades/);
});

test('FEDI19 · --build entrega inventari de dist i anchor al rebut, sense confondre fonts i artefactes',t=>{
 const f=fixture(t);const rebut=iniciaNodeGerma({...f,config,build:true,run:(_cmd,args)=>{if(args[0]==='run')distDeProva(f.desti);return {status:0};}});
 assert.match(rebut.compilacio?.sha256Confiat??'',/^[0-9a-f]{64}$/);
 assert.equal(rebut.compilacio.inventari,'inventari-dist.json');
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(f.desti,'node-germa.json'),'utf8')),rebut);
 assert.equal(fs.existsSync(path.join(f.desti,'dist/inventari-dist.json')),false);
});
