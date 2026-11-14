import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { analitzaVigilant, codiVigilant, readOnly } from '../tooling/gates/tractor-vigilant.mjs';
function fixture(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-vigilant-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return {root,write:(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);}};}
const regla=(r,id)=>r.comprovacions.find(c=>c.id===id);
test('sense fonts no acredita verd; import és només lectura',t=>{const {root}=fixture(t);assert.equal(readOnly,true);const r=analitzaVigilant(root);assert.equal(regla(r,'VA1').estat,'no-mesurat');assert.ok(r.recompte['no-mesurat']>0);});
test('VIG01/02: fitxers sensibles i executables només s’anomenen, no es revelen ni es modifiquen',t=>{
 const {root,write}=fixture(t);write('public/.env','NO_REVELAR_EL_VALOR');write('public/assets/a.php','<?php');
 const abans=fs.readFileSync(path.join(root,'public/.env'));const r=analitzaVigilant(root);
 assert.equal(regla(r,'VIG-01').estat,'falla');assert.equal(regla(r,'VIG-02').estat,'falla');assert.equal(codiVigilant(r),0);
 assert.ok(!JSON.stringify(r).includes('NO_REVELAR_EL_VALOR'));assert.deepEqual(fs.readFileSync(path.join(root,'public/.env')),abans);
});
test('guarda PHP i permisos REST absents bloquegen; patrons nous són avís',t=>{
 const {root,write}=fixture(t);write('wordpress-plugin/a.php',"<?php register_rest_route('sdp','/x', []); shell_exec($x);");const r=analitzaVigilant(root);
 assert.equal(regla(r,'VA1').estat,'falla');assert.equal(regla(r,'VA2').estat,'falla');assert.equal(regla(r,'VIG-03').estat,'falla');assert.equal(codiVigilant(r),1);
});
test('inventari verifica hash i fitxers orfes, i no seguix symlinks',t=>{
 const {root,write}=fixture(t);write('dist/a.txt','abc');write('dist/sdp-inventari.json',JSON.stringify({fitxers:[{cami:'a.txt',sha256:createHash('sha256').update('abc').digest('hex')}]}));
 assert.equal(regla(analitzaVigilant(root),'VIG-04').estat,'ok');write('dist/orfe.txt','orfe');assert.equal(regla(analitzaVigilant(root),'VIG-04').estat,'falla');
 fs.symlinkSync('/etc',path.join(root,'dist/enllac'));assert.equal(regla(analitzaVigilant(root),'VIG-SYMLINK').estat,'no-mesurat');
});
test('CLI JSON sense xarxa: arrel absent i mode viu es rebutgen',t=>{
 const {root}=fixture(t);const script=path.resolve('tooling/gates/tractor-vigilant.mjs');const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8'});
 assert.equal(JSON.parse(run('--json',`--arrel=${root}`).stdout).mode,'estatic');assert.equal(run('--viu').status,2);assert.equal(run('--arrel=/no-existix-sdp').status,2);
});
/* F2 / R2-COR-09 (revisió de la Ronda 2): una carpeta il·legible no tomba la diagnosi de cron_higiene; el Vigilant hi queda no-mesurat. */
test('cron_higiene: un EACCES dins de public/ deixa el Vigilant no-mesurat i la diagnosi continua',async t=>{
 const {root}=fixture(t);const tancat=path.join(root,'public/tancat');fs.mkdirSync(tancat,{recursive:true});
 const {diagnosi}=await import('../tooling/higiene/cron_higiene.mjs');
 let d;fs.chmodSync(tancat,0);try{d=diagnosi(root);}finally{fs.chmodSync(tancat,0o755);}
 assert.equal(d.vigilant.esquema,'sdp.vigilant.v1');assert.equal(d.vigilant.estat,'no-mesurat');assert.equal(d.vigilant.error,'EACCES');
});
/* Onada R26 · R25.2-P01/P03 i IDEA-266 també al Vigilant: el text net el dona el lexer de la porta Tellado. */
const png=(w,h)=>{const b=Buffer.alloc(24);Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]).copy(b,0);b.writeUInt32BE(13,8);b.write('IHDR',12,'ascii');b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;};
test('VIG-08: un literal "//" no amaga una clau secreta desada a wp_options',t=>{
 const {root,write}=fixture(t);write('wordpress-plugin/a.php',"<?php\ndefined( 'ABSPATH' ) || exit;\n$x = \"//\"; update_option( 'sdp_api_key', $v );\n");
 assert.equal(regla(analitzaVigilant(root),'VIG-08').estat,'falla');
});
test('VIG-07: un comentari que anomena 503/Retry-After/no-store/robots.txt no fa bo un manteniment que respon 200',t=>{
 const {root,write}=fixture(t);write('wordpress-plugin/eines/amfitrio/sdp-manteniment-503-mu-plugin.php',"<?php\ndefined( 'ABSPATH' ) || exit;\n// 503 Service Unavailable, Retry-After: 60, no-store, robots.txt\necho 'Tornem prompte';\n");
 assert.equal(regla(analitzaVigilant(root),'VIG-07').estat,'falla');
});
test('VIG-10: mira les dimensions reals; 180x180 apple-touch-icon és vàlid i un sizes fals no ho és',t=>{
 const {root,write}=fixture(t);write('public/apple-touch-icon.png',png(180,180));write('public/fals.png',png(16,16));
 write('index.html','<!doctype html><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="apple-touch-icon" href="/apple-touch-icon.png">');
 assert.equal(regla(analitzaVigilant(root),'VIG-10').estat,'ok');
 write('index.html','<!doctype html><link rel="icon" type="image/png" sizes="192x192" href="/fals.png">');
 assert.equal(regla(analitzaVigilant(root),'VIG-10').estat,'falla');
});
test('VA1: defined(\'ABSPATH\') decoratiu o sense exit/die bloqueja; la forma canònica passa',t=>{
 const {root,write}=fixture(t);write('wordpress-plugin/a.php',"<?php\ndefined( 'ABSPATH' );\necho 'die';\n");
 const r=analitzaVigilant(root);assert.equal(regla(r,'VA1').estat,'falla');assert.equal(codiVigilant(r),1);
 write('wordpress-plugin/a.php',"<?php\n/** Capçalera. */\ndefined( 'ABSPATH' ) || exit;\n");
 assert.equal(regla(analitzaVigilant(root),'VA1').estat,'ok');
});
test('el CLI del Vigilant conserva el bit executable del commit base',()=>{
 assert.ok(fs.statSync(path.resolve('tooling/gates/tractor-vigilant.mjs')).mode&0o100);
});
test('VA2: una ruta sense permission_callback no hereta el permís d\'una ruta veïna del mateix fitxer',t=>{
 const {root,write}=fixture(t);
 write('wordpress-plugin/a.php',"<?php\ndefined( 'ABSPATH' ) || exit;\nregister_rest_route( 'sdp/v1', '/obert', array( 'methods' => 'POST', 'callback' => 'sdp_obert' ) );\nregister_rest_route( 'sdp/v1', '/tancat', array( 'methods' => 'GET', 'callback' => 'sdp_tancat', 'permission_callback' => 'sdp_pot' ) );\n");
 const r=analitzaVigilant(root);assert.equal(regla(r,'VA2').estat,'falla');assert.equal(codiVigilant(r),1);
});
/* Onada R26 · ronda 2: mateixes regles que la porta Tellado (VIG-07/08/09 i VA2). */
const firebase=(hsts)=>JSON.stringify({hosting:{headers:[{source:'**',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'Permissions-Policy',value:'camera=(self)'},{key:'Strict-Transport-Security',value:hsts}]}]}});
test('VIG-09: llindar real de max-age >= 31536000, sense exigir includeSubDomains',t=>{
 const {root,write}=fixture(t);write('firebase.json',firebase('max-age=1000000'));
 assert.equal(regla(analitzaVigilant(root),'VIG-09').estat,'falla');
 write('firebase.json',firebase('max-age=31536000'));
 assert.equal(regla(analitzaVigilant(root),'VIG-09').estat,'ok');
});
test('VIG-07: una cadena que anomena 503/Retry-After/no-store/robots.txt no és cap crida de 503',t=>{
 const {root,write}=fixture(t);write('wordpress-plugin/eines/amfitrio/sdp-manteniment-503-mu-plugin.php',"<?php\ndefined( 'ABSPATH' ) || exit;\necho '503 Service Unavailable. Retry-After: 3600 no-store robots.txt';\n");
 assert.equal(regla(analitzaVigilant(root),'VIG-07').estat,'falla');
});
test('VIG-08: un «;» dins d\'una cadena no amaga l\'exposició de WP_SECRETS_KEY',t=>{
 const {root,write}=fixture(t);write('wordpress-plugin/a.php',"<?php\ndefined( 'ABSPATH' ) || exit;\necho ';' . WP_SECRETS_KEY;\n");
 assert.equal(regla(analitzaVigilant(root),'VIG-08').estat,'falla');
});
test('VA2: una cadena que imita «\'permission_callback\' =>» no compensa un endpoint sense permís',t=>{
 const {root,write}=fixture(t);
 write('wordpress-plugin/a.php',"<?php\ndefined( 'ABSPATH' ) || exit;\nregister_rest_route( 'sdp/v1', '/r', array(\n array( 'methods' => 'GET', 'callback' => 'sdp_a', 'permission_callback' => 'sdp_pot' ),\n array( 'methods' => 'POST', 'callback' => 'sdp_b', 'summary' => \"'permission_callback' => cap\" ),\n) );\n");
 const r=analitzaVigilant(root);assert.equal(regla(r,'VA2').estat,'falla');assert.equal(codiVigilant(r),1);
});
