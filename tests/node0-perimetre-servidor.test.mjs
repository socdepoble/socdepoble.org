/* Onada R22 · eixa42 (Opus 5.5) · El perímetre del servidor web heretat del Node 0 (scripts/node0/servidorNodePoble.mjs),
   la recomanació 5 de la càtedra Tellado (triatge_catedres.json):
   1. Escolta per defecte només a 127.0.0.1: el túnel i Caddy ja hi arriben per 127.0.0.1:3350 (activa-porta-caddy-node0.mjs),
      i la xarxa local no pot saltar-se'ls. El llançador de prova exigix ara eixa adreça (static_fixture_binding_changed).
   2. Un Host o un X-Forwarded-Host escrit per qui demana no fa de domini: ni la redirecció a https ni el manifest de mitjans
      signat amb la clau Ed25519 del node poden portar un origen alié.
   3. /api/estat no publica el túnel, el maquinari ni l'uptime, i cap resposta porta X-SDP-Node.
   4. Només els recursos amb empremta de Rollup (el patró de public/sw.js) són immutables; un fitxer de /assets/ amb nom
      estable, no.
   El servidor de veres, en un port efímer de loopback i un directori temporal (el llançador de la prova de R9). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {once} from 'node:events';
const launcher=new URL('./fixtures/node0-static-inbox-server.mjs',import.meta.url);

test('Node 0 · servidor heretat: loopback, hosts de confiança, /api/estat sense maquinari i immutable només amb empremta',async t=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-node0-static-r9-'));
  const put=(rel,text)=>{const f=path.join(base,rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);};
  put('public/index.html','<!doctype html><title>Sóc de Poble</title>');
  put('public/assets/index-AbCdEf12.js','console.log(1)');
  put('public/assets/fotos/portada.jpg','JPEG_DE_PROVA');
  put('public/assets/logo.png','PNG_DE_PROVA');
  put('media/video.mp4','MP4_DE_PROVA');
  const child=fork(launcher,[],{stdio:['ignore','ignore','ignore','ipc'],env:{PATH:process.env.PATH,...(process.env.TMPDIR?{TMPDIR:process.env.TMPDIR}:{}),SDP_NODE_BASE_DIR:base,SDP_NODE_PORT:'0',SDP_NODE0_TEST_STATIC_FIXTURE:'1'}});
  let timer;
  try{
    const message=await Promise.race([once(child,'message'),once(child,'exit').then(()=>{throw Error('fixture_exit_before_listen');}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('fixture_start_timeout')),5000);})]);clearTimeout(timer);
    const origin='http://127.0.0.1:'+message[0].port;
    const demana=(cami,headers={})=>fetch(origin+cami,{headers,redirect:'manual',signal:AbortSignal.timeout(3000)});

    await t.test('una redirecció a https mai porta un host alié',async()=>{
      for(const host of['evil.example','localhost.evil.example','127.0.0.1.evil.example']){
        const r=await demana('/qualsevol',{'X-Forwarded-Host':host,'X-Forwarded-Proto':'http','X-Forwarded-For':'203.0.113.7'});
        assert.equal(r.status,301,host);
        assert.equal(r.headers.get('location'),'https://socdepoble.cat/qualsevol',host);
      }
      const bona=await demana('/qualsevol',{'X-Forwarded-Host':'www.socdepoble.cat','X-Forwarded-Proto':'http','X-Forwarded-For':'203.0.113.7'});
      assert.equal(bona.headers.get('location'),'https://www.socdepoble.cat/qualsevol');
    });

    await t.test('el manifest de mitjans signat no accepta un origen escrit per qui demana',async()=>{
      for(const host of['evil.example','localhost']){
        const r=await demana('/media/manifest.json',{'X-Forwarded-Host':host,'X-Forwarded-Proto':'https','X-Forwarded-For':'203.0.113.7'});
        assert.equal(r.status,200,host);
        const cos=await r.json();
        assert.equal(cos.origin,'https://socdepoble.cat',host);
        assert.ok(cos.items.length===1&&cos.items[0].url==='https://socdepoble.cat/media/video.mp4',host);
      }
    });

    await t.test('/api/estat sense túnel, maquinari ni uptime, i cap X-SDP-Node',async()=>{
      const r=await demana('/api/estat');
      assert.equal(r.status,200);
      assert.equal(r.headers.get('x-sdp-node'),null);
      const cos=await r.json();
      for(const camp of['tunnelId','tunnelName','maquinari'])assert.equal(Object.hasOwn(cos,camp),false,camp);
      assert.doesNotMatch(JSON.stringify(cos),/uptime|2ffa3e6b/i);
      assert.equal(typeof cos.timestamp,'string');
    });

    await t.test('immutable només per als recursos amb empremta',async()=>{
      assert.equal((await demana('/assets/index-AbCdEf12.js')).headers.get('cache-control'),'public, max-age=31536000, immutable');
      for(const cami of['/assets/fotos/portada.jpg','/assets/logo.png']){
        const cache=(await demana(cami)).headers.get('cache-control');
        assert.doesNotMatch(cache,/immutable/,cami);
        assert.equal(cache,'public, max-age=86400',cami);
      }
    });
  }finally{
    clearTimeout(timer);
    if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.send('stop');const kill=setTimeout(()=>child.kill('SIGKILL'),3000);try{await exited;}finally{clearTimeout(kill);}}
    fs.rmSync(base,{recursive:true,force:true});
  }
});
