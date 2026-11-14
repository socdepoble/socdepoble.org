/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · El servidor del Node 0 (socdepoble.cat) davant del prerender social:
   les imatges materialitzades de /assets/og/ es servixen amb una hora de memòria cau, mai immutables (són de fitxes de
   veïns: quan una es retira, ha de deixar de ser servida), i la resta de /assets/ continua immutable d'un any. I un
   directori prerenderitzat (dist/empresa/<slug>/index.html) es servix amb el seu head, amb barra final i sense. El
   servidor de veres, en un port efímer de loopback i un directori temporal (el llançador de la prova de R9). */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fork} from 'node:child_process';
import {once} from 'node:events';
const launcher=new URL('./fixtures/node0-static-inbox-server.mjs',import.meta.url);

test('Node 0 · /assets/og/ amb «public, max-age=3600»; la resta de /assets/, immutable; el directori prerenderitzat, amb el seu head',async()=>{
  const base=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-node0-static-r9-'));
  const put=(rel,text)=>{const f=path.join(base,'public',rel);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,text);};
  put('index.html','<!doctype html><title>Sóc de Poble</title>');
  put('empresa/olidelatorre/index.html','<!doctype html><title data-sdp-ssr>Oli de La Torre | Sóc de Poble</title>');
  put('assets/og/0123456789abcdef01234567.jpg','JPEG_DE_PROVA');
  put('assets/index-AbCdEf12.js','console.log(1)');
  put('assets/fotos/portada.jpg','JPEG_DE_PROVA');
  const child=fork(launcher,[],{stdio:['ignore','ignore','ignore','ipc'],env:{PATH:process.env.PATH,...(process.env.TMPDIR?{TMPDIR:process.env.TMPDIR}:{}),SDP_NODE_BASE_DIR:base,SDP_NODE_PORT:'0',SDP_NODE0_TEST_STATIC_FIXTURE:'1'}});
  let timer;
  try{
    const message=await Promise.race([once(child,'message'),once(child,'exit').then(()=>{throw Error('fixture_exit_before_listen');}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('fixture_start_timeout')),5000);})]);clearTimeout(timer);
    const origin='http://127.0.0.1:'+message[0].port;
    const demana=async(cami,method='GET')=>{const r=await fetch(origin+cami,{method,headers:{'User-Agent':'WhatsApp/2.24.6.77 A'},signal:AbortSignal.timeout(3000)});return {status:r.status,cache:r.headers.get('cache-control'),tipus:r.headers.get('content-type'),text:method==='HEAD'?'':await r.text()};};
    for(const method of ['GET','HEAD']) {
      const og=await demana('/assets/og/0123456789abcdef01234567.jpg',method);
      assert.deepEqual([og.status,og.cache,og.tipus],[200,'public, max-age=3600','image/jpeg'],method);
    }
    assert.equal((await demana('/assets/index-AbCdEf12.js')).cache,'public, max-age=31536000, immutable');
    // Onada R22 (eixa42) · Un fitxer de /assets/ amb nom estable (sense empremta) no és immutable: un dia, com la resta d'imatges.
    assert.equal((await demana('/assets/fotos/portada.jpg')).cache,'public, max-age=86400');
    // Una imatge retirada dona 404 (no el shell de l'SPA): /assets/ no cau mai a index.html.
    assert.equal((await demana('/assets/og/ffffffffffffffffffffffff.jpg')).status,404);
    // El directori prerenderitzat, amb barra final i sense: el seu head, sense memòria cau.
    for(const cami of ['/empresa/olidelatorre','/empresa/olidelatorre/']) {
      const pagina=await demana(cami);
      assert.equal(pagina.status,200,cami);assert.match(pagina.text,/Oli de La Torre \| Sóc de Poble/,cami);assert.equal(pagina.cache,'no-cache',cami);
    }
    // Una adreça sense fitxer cau al shell genèric de l'SPA (és el que rebia /empresa/olidelatorre abans del P0).
    assert.match((await demana('/empresa/no-existix')).text,/<title>Sóc de Poble<\/title>/);
  }finally{
    clearTimeout(timer);
    if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.send('stop');const kill=setTimeout(()=>child.kill('SIGKILL'),3000);try{await exited;}finally{clearTimeout(kill);}}
    fs.rmSync(base,{recursive:true,force:true});
  }
});
