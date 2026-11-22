import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {auditFaviconSeo} from '../tooling/seo/favicon-seo.mjs';
const root=path.resolve(import.meta.dirname,'..');
/* v1.2.19 · Gauntlet R1 (L2-08) · El PHP es busca com cercaPhp() d'enxufe-pantalla.test.mjs: PHP_BIN, 'php'
   i les versions de WordPress Studio de la més nova a la més vella. Sense cap, les proves es salten, com les germanes. */
function cercaPhp(){
 if(process.env.PHP_BIN)return process.env.PHP_BIN;
 const studio=path.join(os.homedir(),'.studio/php-bin');
 const instal_lats=fs.existsSync(studio)?fs.readdirSync(studio).sort().reverse().map(versio=>path.join(studio,versio,'php')):[];
 return ['php',...instal_lats].find(binari=>spawnSync(binari,['-v'],{timeout:5000}).status===0);
}
const php=cercaPhp();
const OPCIONS={skip:!php&&'PHP absent: instal·la PHP o indica PHP_BIN (també es detecta WordPress Studio).'};
const run=(mode,...extra)=>JSON.parse(execFileSync(php,[path.join(root,'tests/fixtures/enxufe-tellado-r32-29.php'),mode,process.env.SDP_WP_TEST_ROOT||root,...extra],{encoding:'utf8'}));
test('autoload: només metadades pròpies i flags moderns; no valors ni diagnòstic del lloc sencer',OPCIONS,()=>{const r=run('autoload');assert.equal(r.estat,'recommended');assert.equal(r.bytes,8192);assert.deepEqual(r.files,[{nom:'socdepoble_enxufe_canal',bytes:8192}]);assert.match(r.sql,/LENGTH\(option_value\)/);assert.match(r.sql,/LIMIT 501/);assert.doesNotMatch(r.sql,/SELECT option_value/);});
test('autoload: error SQL i truncament no es convertixen en verd',OPCIONS,()=>{assert.equal(run('autoload_error').estat,'unknown');assert.equal(run('autoload_limit').estat,'unknown');assert.equal(run('autoload_nul').estat,'unknown','el null de prepare() fallit');});
test('els ajustos nous i existents es declaren sense autoload, també amb valor idèntic',OPCIONS,()=>{const r=run('settings');assert.equal(r.added,null);assert.deepEqual(r.flags,[['socdepoble_enxufe',false],['socdepoble_enxufe_canal',false]]);});
test('cache: drop-in declarat no certifica Memcached ni persistència; OPcache és observació del SAPI',OPCIONS,()=>{const r=run('cache');assert.equal(r.object_cache_declared,true);assert.equal(r.object_cache_persistence_verified,false);assert.equal(r.php_vulnerability_absence_verified,false);assert.equal(r.sapi,'cli');assert.ok(['runtime_status','status_unavailable','api_unavailable'].includes(r.opcache_observation));});
test('Retry-After acotat, sense dates relatives, arrays ni injecció de capçaleres',OPCIONS,()=>assert.deepEqual(run('retry'),[120,1,86400,0,0,0,0,0,90,0]));
test('503 del proveïdor es conserva amb pausa i capçalera REST, sense convertir-lo en quota429',OPCIONS,()=>{const r=run('translation');assert.equal(r.error.data.status,503);assert.equal(r.error.data.retry_after,120);assert.equal(r.transients[0][2],120);assert.deepEqual(r.headers,{'Retry-After':'120','Cache-Control':'no-store'});});
test('preserva memzero i no instal·la un segon forçador HTTPS global',()=>{const s=fs.readFileSync(path.join(root,'wordpress-plugin/includes/traduccio.php'),'utf8');assert.match(s,/wp_secrets_memzero/);assert.doesNotMatch(s,/HTTP_X_FORWARDED_PROTO|wp_redirect|wp_safe_redirect/);});

test('actualitzador:503 conserva el manifest anterior i el botóforçat respecta una pausa de2hores',OPCIONS,()=>{const r=run('updates');assert.equal(r.state.cos,'manifest_verificat_previ');assert.equal(r.state.signatura,'signatura_previa');assert.equal(r.requests,1);assert.ok(r.remaining>=7198&&r.remaining<=7200);assert.equal(JSON.stringify(r).includes('COS_NO_PUBLICABLE'),false);});
test('plantilla real conserva wp_head de l’amfitrió; el comprovador valida la captura explícita sense canviar-ne la marca',OPCIONS,async t=>{
 const capture=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-wp-head-'));t.after(()=>fs.rmSync(capture,{recursive:true,force:true}));fs.mkdirSync(path.join(capture,'public'));fs.copyFileSync(path.join(root,'public/icona-app-192.png'),path.join(capture,'public/icon.png'));fs.copyFileSync(path.join(root,'public/favicon.svg'),path.join(capture,'public/favicon.svg'));
 for(const mode of ['wp_head','wp_head_svg']){const html=execFileSync(php,[path.join(root,'tests/fixtures/enxufe-tellado-r32-29.php'),mode,root],{encoding:'utf8'});assert.match(html,/<link rel="icon" type="image\/png"/);fs.writeFileSync(path.join(capture,'wp-head.html'),html);const r=await auditFaviconSeo({root:capture,htmlFile:'wp-head.html',assetRoot:'public'});assert.equal(r.status,mode==='wp_head'?'ok':'fail');assert.equal(r.httpVerified,false);}
});

/* v1.2.19 · Gauntlet R1 (L2-03) · Només un Retry-After vàlid pausa el botó, i pel temps que demana; un 503
   sense capçalera (o amb una data passada o un format rebutjat) és un error com a la v1.2.18 i el botó torna
   a llegir el canal. «Es conserva l'última versió verificada» només si n'hi ha una. */
const canal=(opcions)=>run('canal',JSON.stringify(opcions));
const NEUTRE='The update service is temporarily unavailable.';
const CONSERVA='The update service is temporarily unavailable. The last verified release is kept.';
// v1.2.19 · Gauntlet R2 (L2R2-01) · La fila «Last check» amb una hora, no «never».
const ULTIMA_COMPROVACIO=/<th scope="row">Last check<\/th>\s*<td><code>\d{4}-\d{2}-\d{2} \d{2}:\d{2}<\/code><\/td>/;
test('actualitzador: un 503 sense Retry-After vàlid no pausa el botó, i una instal·lació sense manifest no diu que el conserva',OPCIONS,()=>{
 for(const opcions of [{},{retry:''},{retry:'tomorrow'},{retry:'Thu, 01 Jan 2026 00:00:00 GMT'}]){
  const r=canal(opcions);
  assert.equal(r.pausa,null,JSON.stringify(opcions));
  assert.equal(r.requests,2,`el botó torna a llegir el canal: ${JSON.stringify(opcions)}`);
  assert.equal(r.error,NEUTRE);
  assert.equal(r.verificada,false);
  assert.doesNotMatch(r.seccio,/Next check allowed/);
 }
 const previ=canal({previ:true});
 assert.equal(previ.verificada,true,'el manifest signat d’abans es conserva');
 assert.equal(previ.error,CONSERVA);
 assert.equal(previ.requests,2);
});
test('actualitzador: el Retry-After pausa el botó exactament el temps demanat i la secció del canal diu fins quan',OPCIONS,()=>{
 const curta=canal({retry:'60'});
 assert.ok(curta.pausa>=59&&curta.pausa<=60,String(curta.pausa));
 assert.equal(curta.requests,1);
 assert.equal(curta.error,NEUTRE);
 assert.match(curta.seccio,/<th scope="row">Next check allowed<\/th>\s*<td><code>\d{4}-\d{2}-\d{2} \d{2}:\d{2}<\/code><\/td>/);
 const llarga=canal({previ:true,retry:'7200'});
 assert.ok(llarga.pausa>=7198&&llarga.pausa<=7200,String(llarga.pausa));
 assert.equal(llarga.requests,1);
 assert.equal(llarga.error,CONSERVA);
 assert.equal(llarga.verificada,true);
 // v1.2.19 · Gauntlet R2 (L2R2-01) · El botó buida la memòria cau de WordPress: durant la pausa no esborra l'hora real.
 for(const r of [curta,llarga]){
  assert.match(r.seccio,ULTIMA_COMPROVACIO);
  assert.doesNotMatch(r.seccio,/<code>never<\/code>/);
  assert.ok(r.comprovat>0&&r.ara-r.comprovat<=2,String(r.comprovat));
 }
});

/* v1.2.19 · Gauntlet R2 (L2R2-01) · «Comprova el canal ara» i qualsevol wp_clean_plugins_cache() criden
   delete_site_transient('update_plugins') i el ganxo caduca_canal(). Durant una pausa de Retry-After canal()
   no torna a llegir (ni forçat), de manera que caducar posava `comprovat` a 0 fins que acabava: «Last check:
   never» al costat d'una versió verificada. Fora de la pausa, caducar continua fent llegir la comprovació
   automàtica següent, com a la v1.2.18. */
test('actualitzador: buidar la memòria cau durant una pausa conserva «Last check»; fora de la pausa el canal caduca com a la v1.2.18',OPCIONS,()=>{
 for(const forca of [true,false]){
  const dins=canal({previ:true,retry:'3600',forca});
  assert.equal(dins.requests,1,`la pausa es respecta (forca=${forca})`);
  assert.ok(dins.comprovat>0&&dins.ara-dins.comprovat<=2,`l’hora de l’última comprovació es conserva (forca=${forca}): ${dins.comprovat}`);
  assert.match(dins.seccio,ULTIMA_COMPROVACIO);
  assert.doesNotMatch(dins.seccio,/<code>never<\/code>/);
  assert.match(dins.seccio,/<th scope="row">Latest verified release<\/th>\s*<td><code>1\.1\.27<\/code><\/td>/);
  assert.match(dins.seccio,/<th scope="row">Next check allowed<\/th>/);
 }
 const fora=canal({previ:true,forca:false});
 assert.equal(fora.pausa,null);
 assert.equal(fora.requests,2,'sense pausa, la lectura automàtica després de buidar la memòria cau torna a llegir el canal');
 assert.match(fora.seccio,ULTIMA_COMPROVACIO);
});

/* v1.2.19 · Gauntlet R1 (L2-04) · wp_options en SQLite: centenars de traduccions en memòria cau (dues files
   sense autoload cadascuna) van davant per ordre alfabètic i abans omplien el LIMIT 501. */
const opcions=(o)=>run('autoload_sqlite',JSON.stringify(o));
test('autoload: més de 500 files de traduccions en memòria cau no amaguen les opcions fixes ni posen la Salut en «unknown»',OPCIONS,()=>{
 const principal=opcions({traduccions:300,principal:'auto'});
 assert.equal(principal.estat,'recommended');
 assert.deepEqual(principal.files,[{nom:'socdepoble_enxufe',bytes:120}]);
 assert.equal(principal.bytes,120);
 assert.deepEqual(opcions({traduccions:300,canal:'yes'}).files,[{nom:'socdepoble_enxufe_canal',bytes:300}]);
 const net=opcions({traduccions:300});
 assert.equal(net.estat,'ok','els transients amb caducitat no es carreguen mai: ni taronja ni «unknown»');
 assert.deepEqual([net.files,net.bytes],[[],0]);
 // Un transient sense caducitat sí que es carrega: el filtre no l'amaga.
 assert.deepEqual(opcions({traduccions:300,persistent:true}).files,[{nom:'_transient_sdp_tr_'+'f'.repeat(64),bytes:70}]);
 assert.match(principal.sql,/WHERE option_name IN \('socdepoble_enxufe','socdepoble_enxufe_canal'\)/);
 assert.match(principal.sql,/AND autoload NOT IN \('no','off','auto-off'\) ORDER BY option_name LIMIT 501/);
 assert.doesNotMatch(principal.sql,/SELECT option_value/);
 assert.equal(run('autoload_error_prefixos').estat,'unknown','una consulta fallida no és verd');
});

/* v1.2.19 · Gauntlet R1 (L2-05) · Taronja només per al que el lloc pot corregir, i cap paraula anglesa al text. */
const entorn=(opcions,cache,...llengua)=>run('entorn',JSON.stringify({opcions,cache:{object_cache_declared:false,sapi:'cli',...cache}}),...llengua);
test('Salut d’entorn: verd amb OPcache desconegut; taronja per a un autoload propi o un OPcache inactiu; valors traduïts',OPCIONS,()=>{
 const ok={estat:'ok',bytes:0};
 assert.equal(entorn(ok,{opcache_active:null}).status,'good','restrict_api, sense extensió o CLI: res a corregir');
 assert.equal(entorn(ok,{opcache_active:true}).status,'good');
 assert.equal(entorn(ok,{opcache_active:false}).status,'recommended');
 assert.equal(entorn({estat:'recommended',bytes:8192},{opcache_active:true}).status,'recommended');
 assert.equal(entorn({estat:'unknown',bytes:null},{opcache_active:true}).status,'recommended','sense llegir les opcions no hi ha verd');
 const carregat=entorn({estat:'recommended',bytes:8192},{object_cache_declared:null,opcache_active:false},'ca');
 assert.match(carregat.description,/Autoload de les opcions pròpies: activat \(8192 bytes\)\. WordPress declara memòria cau externa d’objectes: desconegut;/);
 assert.match(carregat.description,/OPcache en este procés: inactiu \(SAPI cli\)/);
 const net=entorn(ok,{object_cache_declared:true,opcache_active:true},'ca');
 assert.match(net.description,/Autoload de les opcions pròpies: desactivat \(0 bytes\)\. WordPress declara memòria cau externa d’objectes: sí;/);
 assert.match(net.description,/OPcache en este procés: actiu \(SAPI cli\)/);
 const desconegut=entorn({estat:'unknown',bytes:null},{opcache_active:null},'ca');
 assert.match(desconegut.description,/desconegut \(desconegut bytes\)/);
 for(const r of [carregat,net,desconegut])assert.doesNotMatch(r.description,/\b(?:ok|recommended|unknown|yes|active|inactive)\b/);
 assert.match(entorn(ok,{opcache_active:null}).description,/Own options autoload: off \(0 bytes\)\. .*OPcache in this process: unknown \(SAPI cli\)/);
});

/* v1.2.19 · Gauntlet R2 (L2R2-02) · De cap a cap amb un doble fidel a wpdb: una consulta que falla torna
   array() i omple last_error, que la consulta següent torna a buidar. Abans eixia {estat:'ok',bytes:0} i,
   amb OPcache desconegut o actiu, verd amb «desactivat (0 bytes)». */
test('Salut d’entorn: una consulta SQL fallida dona «desconegut» i taronja, també si la que falla és la primera',OPCIONS,()=>{
 for(const falla of ['fixes','prefixos'])for(const opcache_active of [null,true]){
  const cas=`${falla}, OPcache ${opcache_active}`;
  const r=run('entorn_sql',JSON.stringify({falla,cache:{object_cache_declared:false,sapi:'cli',opcache_active}}),'ca');
  assert.deepEqual(r.diagnostic,{estat:'unknown',files:[],bytes:null},cas);
  assert.equal(r.salut.status,'recommended',cas);
  assert.match(r.salut.description,/Autoload de les opcions pròpies: desconegut \(desconegut bytes\)\./,cas);
  assert.doesNotMatch(r.salut.description,/desactivat|\b(?:off|unknown)\b/,cas);
 }
});

/* v1.2.19 · Gauntlet R1 (L2-08) · Este mateix fitxer, en un procés amb un HOME i un PATH de prova: amb un
   Studio que només té una versió que no és cap de les d'abans troba el PHP, i sense PHP se salta sencer. */
test('el PHP es troba en qualsevol versió de Studio i, sense cap PHP, les proves es salten en lloc de fallar',{skip:OPCIONS.skip||(process.env.SDP_TELLADO_SONDA&&'sonda interna')},t=>{
 const casa=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-tellado-php-'));t.after(()=>fs.rmSync(casa,{recursive:true,force:true}));
 const buit=path.join(casa,'bin');fs.mkdirSync(buit);
 const real=execFileSync(php,['-r','echo PHP_BINARY;'],{encoding:'utf8'});
 const ambStudio=path.join(casa,'amb');fs.mkdirSync(path.join(ambStudio,'.studio/php-bin/9.9.99-studio-9'),{recursive:true});
 fs.symlinkSync(real,path.join(ambStudio,'.studio/php-bin/9.9.99-studio-9/php'));
 const senseStudio=path.join(casa,'sense');fs.mkdirSync(senseStudio);
 const corre=home=>spawnSync(process.execPath,['--test',fileURLToPath(import.meta.url)],{encoding:'utf8',timeout:180000,env:{HOME:home,PATH:buit,TMPDIR:os.tmpdir(),SDP_TELLADO_SONDA:'1'}});
 const amb=corre(ambStudio);
 assert.equal(amb.status,0,amb.stdout+amb.stderr);
 assert.match(amb.stdout,/^ℹ fail 0$/m);assert.match(amb.stdout,/^ℹ skipped 1$/m);
 assert.ok(Number(amb.stdout.match(/^ℹ pass (\d+)$/m)?.[1])>=10,amb.stdout);
 const sense=corre(senseStudio);
 assert.equal(sense.status,0,sense.stdout+sense.stderr);
 assert.match(sense.stdout,/^ℹ pass 1$/m,'només la prova que no necessita PHP');assert.match(sense.stdout,/^ℹ fail 0$/m);
 assert.ok(Number(sense.stdout.match(/^ℹ skipped (\d+)$/m)?.[1])>=10,sense.stdout);
 assert.match(sense.stdout,/PHP absent/);
});
