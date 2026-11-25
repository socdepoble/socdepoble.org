import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { analitzaVigilant, codiVigilant, readOnly, defectesWp72, defectesSvgWp72, defectesFitxerEstatic, PRESSUPOST_ESTATIC } from '../tooling/gates/tractor-vigilant.mjs';
function fixture(t) {const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-vigilant-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return {root,write:(p,s)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),s);}};}
const regla=(r,id)=>r.comprovacions.find(c=>c.id===id);
test('R32.27 VIG-07 bloqueja secrets.php no autoritzat sense llegir ni revelar valors',t=>{
 const {root,write}=fixture(t);write('public/secrets.php','VALOR_SINTETIC_QUE_NO_HA_DE_IXIR');
 const result=analitzaVigilant(root);assert.equal(regla(result,'VIG-07').estat,'falla');
 assert.equal(codiVigilant(result),1);assert.equal(JSON.stringify(result).includes('VALOR_SINTETIC_QUE_NO_HA_DE_IXIR'),false);
});
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
/* IDEA-13 · commit i origen llegits de .git sense executar git; VIG-05 sense soroll; VIG-04 distingix ranci de manipulat. */
test('IDEA-13: commit, branca i origen ixen dels fitxers de .git (worktree, packed-refs) sense cap credencial',t=>{
 const {root,write}=fixture(t);const hex='0123456789abcdef0123456789abcdef01234567';
 const gd=path.join(root,'gd');write('.git',`gitdir: ${gd}\n`);write('gd/HEAD','ref: refs/heads/r26\n');write('gd/commondir','c\n');
 write('gd/c/packed-refs',`# pack-refs with: peeled\n${hex} refs/heads/r26\n`);
 write('gd/c/config','[core]\n\tbare = false\n[remote "fork"]\n\turl = https://github.com/f/y.git\n[branch "r26"]\n\tremote = upstream\n[remote "upstream"]\n\turl = https://tok@github.com/x/y.git\n');
 const r=analitzaVigilant(root);
 assert.equal(r.commit,hex);assert.equal(r.branca,'r26');assert.deepEqual(r.origen,{remot:'upstream',url:'https://github.com/x/y.git'});
 assert.ok(!JSON.stringify(r).includes('tok'));assert.equal(r.motiuGit,undefined);
});
test('IDEA-13: sense .git, commit i origen són null i el motiu ho diu; mai un commit fabricat',t=>{
 const {root}=fixture(t);const r=analitzaVigilant(root);
 assert.equal(r.commit,null);assert.equal(r.origen,null);assert.equal(typeof r.motiuGit,'string');
});
test('VIG-05: comentaris, hosts locals amb port comodí, dominis reservats, espais de noms i hosts d\'una etiqueta no fan soroll',t=>{
 const {root,write}=fixture(t);
 write('src/a.js',"// http://localhost:3340)\nconst u=new URL(p,'http://x.invalid');\nconst csp=\"connect-src http://localhost:*;\";\nconst d=`http://localhost:${port}/x`;\nconst ns='http://schemas.openxmlformats.org/x';\nconst e='http://insegur';\nconst q='http://www.wikidata.org/entity/Q11573';\n");
 write('src/sections/disseny/cataleg/detalls/Especimen.jsx',"const t='Compte amb este enllaç: http://xn--pple-43d.com/entra';\n");
 assert.equal(regla(analitzaVigilant(root),'VIG-05').estat,'ok');
 write('src/b.js',"const h='<a href=\"http://zona14.org\">';\n");
 const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-05').estat,'falla');assert.deepEqual(regla(r,'VIG-05').evidencia,[{fitxer:'src/b.js'}]);
 write('src/b.js',"const w='http://www.wikidata.org/wiki/Special:Search';\n");
 assert.deepEqual(regla(analitzaVigilant(root),'VIG-05').evidencia,[{fitxer:'src/b.js'}]);
});
const inventariDe=(write,fitxers)=>{write('dist/sdp-inventari.json',JSON.stringify({fitxers:Object.entries(fitxers).map(([cami,text])=>({cami,sha256:createHash('sha256').update(text).digest('hex')}))}));};
test('VIG-04: un orfe anterior a l\'inventari és build ranci i només informa, amb una sola evidència resumida',t=>{
 const {root,write}=fixture(t);write('dist/a.txt','abc');write('dist/trossos/vell.js','vell');inventariDe(write,{'a.txt':'abc'});
 const antic=new Date(Date.now()-3600_000);fs.utimesSync(path.join(root,'dist/trossos/vell.js'),antic,antic);
 const r=analitzaVigilant(root),c=regla(r,'VIG-04');
 assert.equal(c.estat,'informa');assert.equal(c.evidencia.length,1);assert.equal(c.evidencia[0].fitxer,'dist');assert.equal(c.evidencia[0].rancis,1);assert.equal(codiVigilant(r),0);
});
test('VIG-04: un build fresc (versió `${package}-dev`, .vite/manifest.json escrit abans de l\'inventari) és ok; una release no es compara amb package.json',t=>{
 const {root,write}=fixture(t);write('package.json',JSON.stringify({version:'1.2.9'}));write('dist/a.txt','abc');write('dist/.vite/manifest.json','{}');
 const abans=new Date(Date.now()-1000);fs.utimesSync(path.join(root,'dist/.vite/manifest.json'),abans,abans);
 inventariDe(write,{'a.txt':'abc'});write('dist/sdp-release.json',JSON.stringify({versio:'1.2.9-dev'}));
 const fresc=regla(analitzaVigilant(root),'VIG-04');assert.equal(fresc.estat,'ok');assert.doesNotMatch(fresc.proposta,/ranci/);
 write('dist/sdp-release.json',JSON.stringify({versio:'1.1.17'}));
 assert.equal(regla(analitzaVigilant(root),'VIG-04').estat,'ok');
});
test('VIG-04: una versió -dev desfasada respecte de package.json informa',t=>{
 const {root,write}=fixture(t);write('package.json',JSON.stringify({version:'1.2.9'}));write('dist/a.txt','abc');inventariDe(write,{'a.txt':'abc'});
 write('dist/sdp-release.json',JSON.stringify({versio:'1.2.0-dev'}));
 const c=regla(analitzaVigilant(root),'VIG-04');
 assert.equal(c.estat,'informa');assert.deepEqual(c.evidencia,[{fitxer:'dist',rancis:0,versioRelease:'1.2.0-dev',versioPaquet:'1.2.9'}]);
});
test('VIG-04: un hash canviat o un orfe posterior a l\'inventari és manipulació i falla',t=>{
 const {root,write}=fixture(t);write('dist/a.txt','abc');write('dist/trossos/vell.js','vell');inventariDe(write,{'a.txt':'abc'});
 const antic=new Date(Date.now()-3600_000);fs.utimesSync(path.join(root,'dist/trossos/vell.js'),antic,antic);
 write('dist/a.txt','abd');let c=regla(analitzaVigilant(root),'VIG-04');assert.equal(c.estat,'falla');assert.deepEqual(c.evidencia,[{fitxer:'dist/a.txt'}]);
 write('dist/a.txt','abc');const nou=new Date(Date.now()+3600_000);write('dist/injectat.js','x');fs.utimesSync(path.join(root,'dist/injectat.js'),nou,nou);
 c=regla(analitzaVigilant(root),'VIG-04');assert.equal(c.estat,'falla');assert.deepEqual(c.evidencia,[{fitxer:'dist/injectat.js'}]);
});

/* IDEA-306 · Les regles noves tenen autorització explícita de bloqueig, sense desplegar res. */
const apis72 = ['wp_get_secret', 'wp_set_secret', 'wp_delete_secret', 'wp_is_secrets_api_available', 'wp_secrets_memzero', 'wp_is_valid_icon_name'];
test('R32.27 VIG-07: cada API necessita guarda real al mateix fitxer; una cadena/comentari no compta', t => {
 const {root,write}=fixture(t);
 for(const api of apis72) {
  const base = `<?php\ndefined( 'ABSPATH' ) || exit;\n`;
  write('wordpress-plugin/api.php',base+`${api}($valor);`);
  let r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla',api);assert.equal(regla(r,'VIG-07').avis,false);assert.equal(codiVigilant(r),1);
  write('wordpress-plugin/api.php',base+`// function_exists('${api}')\n$x="function_exists('${api}')"; ${api}($valor);`);
  assert.equal(regla(analitzaVigilant(root),'VIG-07').estat,'falla',api);
  write('wordpress-plugin/veina.php',base+`if(function_exists('${api}')) {}`);
  assert.equal(regla(analitzaVigilant(root),'VIG-07').estat,'falla','la veïna no compta');
  write('wordpress-plugin/api.php',base+`if(function_exists('${api}')) { ${api}($valor); }`);
  assert.equal(regla(analitzaVigilant(root),'VIG-07').estat,'ok',api);
 }
 assert.deepEqual(defectesWp72(`<?php // wp_get_secret('x')\n$x="wp_set_secret('x','y')"; function wp_delete_secret($x) {}`),[]);
 assert.equal(defectesWp72(`<?php if(\\function_exists('WP_GET_SECRET')) { \\WP_GET_SECRET('x'); }`).length,0,'noms PHP sense distinció de caixa i namespace global');
});
test('R32.27 VIG-07: clau literal bloquejada i cap valor de credencial en l’informe', t => {
 const {root,write}=fixture(t); const secret='VALOR_FICTICI_NO_REVELAR_3227';
 for(const codi of [`define('WP_SECRETS_KEY','${secret}');`,`const WP_SECRETS_KEY = "${secret}";`, `define('WP_SECRETS_KEY', ('${secret}'));`, `const WP_SECRETS_KEY=('${secret}');`, `define(('WP_SECRETS_KEY'), ('${secret}'));`, `define('WP_SECRETS_KEY', <<<CLAU\n${secret}\nCLAU\n);`, `define('WP_SECRETS_KEY_PREVIOUS', '${secret}');`, `const WP_SECRETS_KEY_PREVIOUS=('${secret}');`]) {
  write('wordpress-plugin/a.php',`<?php defined('ABSPATH') || exit; ${codi}`);
  const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla');assert.equal(codiVigilant(r),1);assert.ok(!JSON.stringify(r).includes(secret));
 }
 assert.deepEqual(defectesWp72(`<?php /* define('WP_SECRETS_KEY','x'); */ $x="define('WP_SECRETS_KEY','y')"; $activa=defined('WP_SECRETS_KEY');`),[]);
});
test('R32.27 VIG-07: els nou hooks/funcions obsolets bloquegen en codi actiu, sense fals verd per comentaris', t => {
 const {root,write}=fixture(t);
 for(const nom of ['print_head_scripts','print_footer_scripts','print_admin_styles','print_late_styles','script_concat_settings','_print_scripts','_print_styles','in_default_dir','WP_Dependencies::get_etag']) {
  write('wordpress-plugin/a.php',`<?php defined('ABSPATH') || exit; add_filter('${nom}', 'sdp_filtre');`);
  const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla',nom);assert.equal(codiVigilant(r),1);
  assert.equal(defectesWp72(`<?php ${nom}();`).some(d=>d.regla==='obsolet-wp72'),true,nom);
  assert.deepEqual(defectesWp72(`<?php // ${nom}();\n$x="comentari sobre '${nom}'";`),[],nom);
 }
});
test('R32.27 VIG-07: SVG actius en fitxer o PHP incrustat bloquegen, incloent entitats HTML', t => {
 const {root,write}=fixture(t);const hostils=['<svg><script>alert(1)</script></svg>','<svg onload="alert(1)"></svg>','<svg><a href="javascript:alert(1)"></a></svg>','<svg><use href="#icona"/></svg>','<svg><a href="java&#x73;cript:alert(1)"></a></svg>','<svg><a href="java&#10;script:alert(1)"></a></svg>','<svg><a href="java\tscript:alert(1)"></a></svg>'];
 for(const svg of hostils) {
  write('public/f.svg',svg);let r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla',svg);assert.equal(codiVigilant(r),1);
  write('public/f.svg','<svg><path d="M0 0h1"/></svg>');write('wordpress-plugin/a.php',`<?php defined('ABSPATH') || exit; echo '${svg}';`);
  assert.equal(regla(analitzaVigilant(root),'VIG-07').estat,'falla',svg);
 }
 assert.equal(defectesSvgWp72('<svg><!-- <script>test</script> --><path d="M0 0h1"/></svg>',{fitxerSvg:true}),false);
 assert.equal(defectesSvgWp72('<script>recurs habitual fora d’SVG</script>'),false);
});
// v1.2.19 · Gauntlet R1 (L2-02): actius versionats que contenen '<?=' per atzar dins de les dades comprimides.
// Es lligen del repositori i només es copien a l'arrel temporal de la prova.
const REPO_L202=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ATZAR_L202=['public/assets/img/nano_porta_del_mas.png','public/assets/nano_cards/mur_nano_card.jpg','public/assets/notes/bloc_notes_vintage.jpg','public/assets/towns/balones/commons-ah27.webp'];
test('L2-02 · imatges reals amb «<?=» per atzar: VIG-12 ok i cap bloquejant',t=>{
 const {root,write}=fixture(t);
 for(const rel of ATZAR_L202){
  const bytes=fs.readFileSync(path.join(REPO_L202,rel));
  assert.ok(bytes.includes('<?='),`${rel} ja no conté la seqüència: actualitzeu la llista`);
  assert.deepEqual(defectesFitxerEstatic(rel,bytes),[],rel);write(rel,bytes);
 }
 const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-12').estat,'ok');assert.equal(r.recompte.bloquejants,0);assert.equal(codiVigilant(r),0);
});
test('L2-02 · el PHP camuflat en binaris continua detectat; les obertures que PHP no accepta no compten',t=>{
 const png=fs.readFileSync(path.join(REPO_L202,'public/assets/img/nano_porta_del_mas.png')),soroll=Buffer.from([0x89,0x01,0xfe,0x00,0x7f]);
 const camuflats={
  'despres-iend.png':Buffer.concat([png,Buffer.from('<?php system($_GET["c"]); ?>')]),
  'idat.png':Buffer.concat([png.subarray(0,4096),Buffer.from('<?=$_GET[0]($_POST[1]);?>'),png.subarray(4096)]),
  'halt.jpg':Buffer.concat([soroll,Buffer.from('<?=system($_GET[0]);__halt_compiler();'),soroll]),
  'final.webp':Buffer.concat([soroll,Buffer.from('<?= `$_GET[1]`;')]),
  'tab.pdf':Buffer.concat([soroll,Buffer.from('<?PHP\tphpinfo();'),soroll]),
  'final.woff2':Buffer.concat([soroll,Buffer.from('<?php')]),
 };
 for(const [nom,bytes] of Object.entries(camuflats)) assert.deepEqual(defectesFitxerEstatic(`public/${nom}`,bytes),['php-in-static-bytes'],nom);
 for(const bytes of [Buffer.concat([soroll,Buffer.from('<?phpinfo'),soroll]),Buffer.concat([soroll,Buffer.from('<?='),soroll,Buffer.from('?>')]),Buffer.concat([soroll,Buffer.from('<?=abc'),soroll]),Buffer.from('<?=a'.repeat(4096)+'\u0001')])
  assert.deepEqual(defectesFitxerEstatic('public/x.png',bytes),[]);
 // Els textos conserven la regla estricta de la v1.2.19.
 assert.deepEqual(defectesFitxerEstatic('public/x.svg',Buffer.from('<svg><?=\u0001</svg>')),['php-in-static-bytes']);
 const {root,write}=fixture(t);write('public/assets/img/porta.png',camuflats['despres-iend.png']);
 const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-12').estat,'falla');assert.equal(codiVigilant(r),1);
 assert.deepEqual(regla(r,'VIG-12').evidencia,[{fitxer:'public/assets/img/porta.png'}]);assert.equal(JSON.stringify(r).includes('system('),false);
});
test('L2-02 · textos i binaris gasten pressupostos separats; cada límit continua deixant no-mesurat',t=>{
 const {root,write}=fixture(t);
 for(let i=0;i<5;i++){const p=path.join(root,`public/galeria/f${i}.jpg`);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,'');fs.truncateSync(p,2*1024*1024-1);}
 write('public/z.svg','<svg><?= $x ?></svg>');
 let c=regla(analitzaVigilant(root),'VIG-12');
 assert.equal(c.estat,'falla');assert.deepEqual(c.evidencia,[{fitxer:'public/z.svg'}]);
 fs.rmSync(path.join(root,'public/z.svg'));c=regla(analitzaVigilant(root),'VIG-12');
 assert.equal(c.estat,'ok');assert.match(c.proposta,/binaris 5 fitxers\/10485755 bytes, 0 sense llegir/);
 const gros=path.join(root,'public/gros.txt');fs.writeFileSync(gros,'');fs.truncateSync(gros,PRESSUPOST_ESTATIC.text.perFitxer+1);
 c=regla(analitzaVigilant(root),'VIG-12');assert.equal(c.estat,'no-mesurat');assert.match(c.proposta,/textos 0 fitxers\/0 bytes, 1 sense llegir/);
 fs.rmSync(gros);for(let i=0;i<=PRESSUPOST_ESTATIC.binari.fitxers-5;i++) write(`public/molts/${String(i).padStart(4,'0')}.png`,'');
 c=regla(analitzaVigilant(root),'VIG-12');assert.equal(c.estat,'no-mesurat');assert.match(c.proposta,new RegExp(`binaris ${PRESSUPOST_ESTATIC.binari.fitxers} fitxers/\\d+ bytes, 1 sense llegir`));
});
/* PWA-03 (v1.2.25) · Un build d'una altra versió no és cap mesura de l'arbre. A la v1.2.25, l'SVG actiu dels dos dist
   rancis (1.2.0-dev, ngi-fediversity-tag.svg) feia caure VIG-07 i bloquejava la Vigilant (eixida 1). Gauntlet PWA03:
   només compta el manifest de l'arrel d'un build (V1), la línia del connector només data un build amb la versio-viva.json
   d'esta App (V3) i un manifest il·legible es mesura (V5). Àrbitre de Carril 1 (PWA03-V2/VF1): NOMÉS la llista d'SVG de
   VIG-07 deixa fora part d'un build ranci, i llavors VIG-07 no dona ok; la resta de comprovacions el lligen sencer, perquè un
   PHP, un .env o un mapa de fonts exposats no depenen de la versió del build (PWA-03 dur, baix). PWA03DUR-S1/A2: d'un ranci
   només queden fora els .svg amb bessó al mateix camí de public/ (la còpia que el build en va fer); els altres es mesuren. */
const SVG_NET='<svg><path d="M0 0h1"/></svg>';
const arbreV1224=write=>{write('package.json',JSON.stringify({version:'1.2.24'}));write('wordpress-plugin/socdepoble-enxufe.php',"<?php\n/**\n * Plugin Name:       Sóc de Poble\n * Version:           1.1.32\n */\ndefined( 'ABSPATH' ) || exit;\n");write('public/f.svg',SVG_NET);};
const SVG_ACTIU='<svg><use href="#icona"/></svg>';
// La proposta de VIG-07 quan ha deixat .svg de rancis fora (PWA03DUR-A1/A2): en diu quants, també quan falla.
const SENSE_MESURAR=n=>new RegExp(` Sense mesurar: ${n} \\.svg de builds d’una altra versió amb bessó a public/ \\(VIG-RANCI\\)\\.$`);
const PHP_SENSE_GUARDA="<?php echo shell_exec($_GET['c']);\n";
const PNG_AMB_PHP=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47]),Buffer.from('<?php system($_GET[0]); ?>')]);
const viva=v=>JSON.stringify({versioSistema:v}),release=v=>JSON.stringify({versio:v});
// Les comprovacions que lligen els exposats o el PHP del connector: un build ranci no les deixa sense mesura.
const DE_SEGURETAT=['VIG-01','VIG-02','VIG-03','VIG-05','VIG-08','VIG-12','VA1','VA2','VA3'];
const RANCI_WP=write=>{write('wordpress-plugin/dist/sdp-release.json',release('1.2.0-dev'));write('wordpress-plugin/dist/versio-viva.json',viva('1.2.0'));};
const RANCI_DIST=write=>write('dist/versio-viva.json',viva('1.2.0'));
const CLI_VIGILANT=path.join(REPO_L202,'tooling/gates/tractor-vigilant.mjs');
test('PWA-03 dur (e) · l’SVG actiu d’un dist ranci no fa caure VIG-07 (no-mesurat) ni bloqueja, VIG-RANCI el nomena i la resta continua dient ok',t=>{
 const {root,write}=fixture(t);arbreV1224(write);
 let r=analitzaVigilant(root);for(const id of [...DE_SEGURETAT,'VIG-07']) assert.equal(regla(r,id).estat,'ok',`control ${id}`);
 // Com a l'arbre viu: el tag.svg dels dist rancis és la còpia vella del de public/, que ja està net.
 write('public/assets/uploads/tag.svg',SVG_NET);
 RANCI_WP(write);write('wordpress-plugin/dist/assets/uploads/tag.svg',SVG_ACTIU);write('wordpress-plugin/dist/a.js','x');
 RANCI_DIST(write);write('dist/assets/uploads/tag.svg',SVG_ACTIU);write('dist/a.js','x');
 r=analitzaVigilant(root);
 // Gauntlet PWA03-V2: VIG-07 ha deixat SVG fora i no és ni verd ni roig; no bloqueja.
 const c7=regla(r,'VIG-07');assert.equal(c7.estat,'no-mesurat');assert.deepEqual(c7.evidencia,[]);assert.match(c7.proposta,SENSE_MESURAR(2));
 // La resta ha llegit els dos builds rancis sencers i no hi ha trobat res: ok de veres, no no-mesurat.
 for(const id of [...DE_SEGURETAT,'VB10']) {const c=regla(r,id);assert.equal(c.estat,'ok',id);assert.doesNotMatch(c.proposta,/VIG-RANCI/,id);}
 assert.equal(codiVigilant(r),0);
 // PWA03DUR-A1/S2: VIG-RANCI és alta i no avís (un no-mesurat no bloqueja; la severitat diu què cal fer-ne).
 const c=regla(r,'VIG-RANCI');assert.equal(c.estat,'no-mesurat');assert.equal(c.severitat,'alta');assert.equal(c.avis,false);assert.match(c.proposta,/només VIG-07 en deixa fora els \.svg amb bessó al mateix camí de public\//);
 assert.deepEqual(c.evidencia,[{fitxer:'dist',motiu:'build ranci, no mesurat',versioBuild:'1.2.0',versioViva:'1.2.0',versioArbre:'1.2.24'},{fitxer:'wordpress-plugin/dist',motiu:'build ranci, no mesurat',versioBuild:'1.2.0-dev',versioViva:'1.2.0',versioArbre:'1.2.24'}]);
 assert.equal(JSON.stringify(r.comprovacions.filter(x=>x.id!=='VIG-RANCI')).includes('tag.svg'),false);
});
test('PWA-03 dur (a) · un PHP perillós dins d’un build ranci fa caure VIG-03, i la porta ix amb 1',t=>{
 // VIG-03 encara és un avís (NOU): l'eixida 1 la dona VA1, perquè el PHP injectat no porta la guarda d'ABSPATH; com a la base.
 const PERILLOS="<?php eval(base64_decode($_POST['x']));\n";
 for(const [base,manifests] of [['wordpress-plugin/dist',{'sdp-release.json':release('1.2.0-dev')}],['wordpress-plugin/builds/directori/dist',{'sdp-release.json':release('1.1.12')}]]) {
  const {root,write}=fixture(t);arbreV1224(write);for(const [nom,text] of Object.entries(manifests)) write(`${base}/${nom}`,text);write(`${base}/assets/porta.php`,PERILLOS);
  const r=analitzaVigilant(root),mal=[{fitxer:`${base}/assets/porta.php`}];
  assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),[base]);
  for(const id of ['VIG-03','VA1','VIG-02']) {assert.equal(regla(r,id).estat,'falla',`${base} ${id}`);assert.deepEqual(regla(r,id).evidencia,mal,`${base} ${id}`);}
  assert.equal(codiVigilant(r),1,base);
  const cli=spawnSync(process.execPath,[CLI_VIGILANT,`--arrel=${root}`],{encoding:'utf8'});assert.equal(cli.status,1,`${base} ${cli.stderr}`);assert.match(cli.stdout,/^VIG-03 FALLA /m);
 }
});
test('PWA-03 dur · cada comprovació del PHP llig el PHP d’un build ranci (VIG-03, VIG-05, VIG-06, VIG-08, VA1, VA2, VA3)',t=>{
 const GUARDA="<?php\ndefined( 'ABSPATH' ) || exit;\n";
 for(const [id,text] of [
  ['VIG-03',`${GUARDA}$x = gzinflate( $y ); eval( base64_decode( $x ) );\n`],
  ['VIG-05',`${GUARDA}echo 'http://insegur.cat/x';\n`],
  ['VIG-06',`${GUARDA}echo '<link href="https://fonts.googleapis.com/css">';\n`],
  ['VIG-08',`${GUARDA}update_option( 'sdp_api_key', $v );\n`],
  ['VA1',"<?php echo 1;\n"],
  ['VA2',`${GUARDA}register_rest_route( 'sdp', '/x', array( 'methods' => 'GET', 'callback' => 'f' ) );\n`],
  ['VA3',`${GUARDA}$ip = $_SERVER['HTTP_X_FORWARDED_FOR'];\n`]
 ]) {
  const {root,write}=fixture(t);arbreV1224(write);write('index.html','<!doctype html><title>x</title>');RANCI_WP(write);write('wordpress-plugin/dist/vell.php',text);
  const r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['wordpress-plugin/dist'],id);
  assert.equal(regla(r,id).estat,'falla',id);assert.deepEqual(regla(r,id).evidencia,[{fitxer:'wordpress-plugin/dist/vell.php'}],id);
 }
});
test('PWA-03 dur (b) · un .env o un secrets.php dins d’un build ranci fan caure VIG-01 i la regla de secrets de VIG-07',t=>{
 let {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('dist/.env','NO_REVELAR_EL_VALOR');
 let r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);
 assert.equal(regla(r,'VIG-01').estat,'falla');assert.deepEqual(regla(r,'VIG-01').evidencia,[{fitxer:'dist/.env'}]);
 // Com a la base: VIG-01 és un avís i no bloqueja; el valor no ix mai a l'informe.
 assert.equal(codiVigilant(r),0);assert.equal(JSON.stringify(r).includes('NO_REVELAR_EL_VALOR'),false);
 ({root,write}=fixture(t));arbreV1224(write);RANCI_DIST(write);write('dist/secrets.php','VALOR_SINTETIC_QUE_NO_HA_DE_IXIR');
 r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);
 assert.equal(regla(r,'VIG-01').estat,'falla');assert.deepEqual(regla(r,'VIG-01').evidencia,[{fitxer:'dist/secrets.php'}]);
 const c7=regla(r,'VIG-07');assert.equal(c7.estat,'falla');assert.equal(c7.avis,false);assert.deepEqual(c7.evidencia,[{fitxer:'dist/secrets.php',regla:'fitxer-secrets-no-autoritzat'}]);
 assert.equal(codiVigilant(r),1);assert.equal(JSON.stringify(r).includes('VALOR_SINTETIC_QUE_NO_HA_DE_IXIR'),false);
});
test('PWA-03 dur (c) · un mapa de fonts dins d’un build ranci fa caure VB10; i els exposats del ranci passen per VIG-02 i VIG-12',t=>{
 let {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('dist/assets/a.js','x');write('dist/assets/a.js.map','{}');
 let r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);
 assert.equal(regla(r,'VB10').estat,'falla');assert.deepEqual(regla(r,'VB10').evidencia,[{fitxer:'dist/assets/a.js.map'}]);
 ({root,write}=fixture(t));arbreV1224(write);RANCI_WP(write);write('wordpress-plugin/dist/x.sh','echo');write('wordpress-plugin/dist/img/a.png',PNG_AMB_PHP);
 r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['wordpress-plugin/dist']);
 // VIG-02 mira el nom (x.sh); el contingut del PNG el mira VIG-12.
 assert.deepEqual(regla(r,'VIG-02').evidencia,[{fitxer:'wordpress-plugin/dist/x.sh'}]);
 // VIG-12 no és cap avís: el PNG amb PHP d'un build ranci bloqueja, com a la base.
 assert.equal(regla(r,'VIG-12').estat,'falla');assert.deepEqual(regla(r,'VIG-12').evidencia,[{fitxer:'wordpress-plugin/dist/img/a.png'}]);assert.equal(codiVigilant(r),1);
});
test('PWA-03 dur (d) · un manifest d’arrel «{}» fa ranci el build però no amaga el seu PHP sense guarda: VA1 continua fallant',t=>{
 for(const [base,manifest] of [['wordpress-plugin/dist','sdp-release.json'],['wordpress-plugin/builds/directori/dist','versio-viva.json']]) {
  const {root,write}=fixture(t);arbreV1224(write);write(`${base}/${manifest}`,'{}');write(`${base}/x.php`,PHP_SENSE_GUARDA);
  const r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>[e.fitxer,e.versioBuild]),[[base,null]],base);
  assert.equal(regla(r,'VA1').estat,'falla',base);assert.deepEqual(regla(r,'VA1').evidencia,[{fitxer:`${base}/x.php`}],base);assert.equal(codiVigilant(r),1,base);
 }
});
test('PWA-03 dur · el PHP de VIG-07 d’un build ranci es llig sencer (WP 7.2, manteniment i SVG incrustat); només els .svg amb bessó en queden fora',t=>{
 const GUARDA="<?php\ndefined( 'ABSPATH' ) || exit;\n";
 for(const [nom,text,evidencia,eixida] of [
  ['api.php',`${GUARDA}wp_get_secret( 'x' );\n`,{regla:'api-sense-guarda',linia:3,api:'wp_get_secret'},1],
  ['maintenance.php',`${GUARDA}echo 'Tornem prompte';\n`,{},0],
  ['icona.php',`${GUARDA}?><svg onload="x()"></svg>\n`,{regla:'svg-actiu'},1]
 ]) {
  const {root,write}=fixture(t);arbreV1224(write);RANCI_WP(write);write('public/assets/tag.svg',SVG_NET);write('wordpress-plugin/dist/assets/tag.svg',SVG_ACTIU);write(`wordpress-plugin/dist/${nom}`,text);
  const r=analitzaVigilant(root),c7=regla(r,'VIG-07');
  assert.equal(c7.estat,'falla',nom);assert.deepEqual(c7.evidencia,[{fitxer:`wordpress-plugin/dist/${nom}`,...evidencia}],nom);
  // PWA03DUR-A2: la fallada diu també que el tag.svg del ranci no s'ha llegit.
  assert.match(c7.proposta,SENSE_MESURAR(1),nom);assert.equal(codiVigilant(r),eixida,nom);
 }
});
test('PWA03-V2 · amb un build ranci, la part mesurada de VIG-07 continua fallant i la resta llig el ranci sencer',t=>{
 const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('public/x.svg',SVG_NET);write('dist/x.svg',SVG_ACTIU);write('dist/.env','NO');
 let r=analitzaVigilant(root);for(const id of ['VIG-02','VIG-03','VIG-08','VIG-12','VA1','VA2','VA3']) assert.equal(regla(r,id).estat,'ok',id);
 assert.equal(regla(r,'VIG-07').estat,'no-mesurat');assert.deepEqual(regla(r,'VIG-01').evidencia,[{fitxer:'dist/.env'}]);
 write('public/mal.svg',SVG_ACTIU);write('public/.env','NO');write('public/x.php','<?php');write('wordpress-plugin/porta.php',PHP_SENSE_GUARDA);
 r=analitzaVigilant(root);
 for(const id of ['VIG-01','VIG-02','VIG-03','VIG-07','VA1']) assert.equal(regla(r,id).estat,'falla',id);
 assert.deepEqual(regla(r,'VIG-07').evidencia,[{fitxer:'public/mal.svg',regla:'svg-actiu'}]);
 assert.deepEqual(regla(r,'VIG-01').evidencia,[{fitxer:'public/.env'},{fitxer:'dist/.env'}]);assert.deepEqual(regla(r,'VIG-02').evidencia,[{fitxer:'public/x.php'}]);assert.equal(codiVigilant(r),1);
 assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);
});
test('PWA-03 dur · VB10 i VIG-06 lligen el build ranci sencer: el seu mapa de fonts i el seu PHP amb un recurs extern fallen',t=>{
 const {root,write}=fixture(t);arbreV1224(write);write('index.html','<!doctype html><title>x</title>');write('dist/versio-viva.json',viva('1.2.24'));write('dist/a.js','x');
 let r=analitzaVigilant(root);assert.equal(regla(r,'VB10').estat,'ok');assert.equal(regla(r,'VIG-06').estat,'ok');
 write('wordpress-plugin/dist/sdp-release.json',release('1.2.0-dev'));write('wordpress-plugin/dist/a.js.map','{}');write('wordpress-plugin/dist/vell.php',"<?php echo '<link href=\"https://fonts.googleapis.com/css\">';");
 r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['wordpress-plugin/dist']);
 assert.deepEqual(regla(r,'VB10').evidencia,[{fitxer:'wordpress-plugin/dist/a.js.map'}]);assert.deepEqual(regla(r,'VIG-06').evidencia,[{fitxer:'wordpress-plugin/dist/vell.php'}]);
 write('dist/b.js.map','{}');r=analitzaVigilant(root);assert.equal(regla(r,'VB10').estat,'falla');assert.deepEqual(regla(r,'VB10').evidencia,[{fitxer:'dist/b.js.map'},{fitxer:'wordpress-plugin/dist/a.js.map'}]);
});
test('PWA-03 · un build d’esta versió sí es mesura: `-dev`, la de package.json i la línia del connector amb la versio-viva.json d’esta App',t=>{
 for(const manifests of [{'sdp-release.json':release('1.2.24-dev')},{'sdp-release.json':release('1.2.24')},{'sdp-release.json':release('1.1.32'),'versio-viva.json':viva('1.2.24')},{'versio-viva.json':viva('1.2.24')},{'sdp-release.json':release('1.2.24-dev'),'versio-viva.json':viva('1.2.0')}]) {
  const {root,write}=fixture(t);arbreV1224(write);for(const [nom,text] of Object.entries(manifests)) write(`wordpress-plugin/dist/${nom}`,text);write('wordpress-plugin/dist/assets/uploads/tag.svg',SVG_ACTIU);
  const r=analitzaVigilant(root),c=regla(r,'VIG-07');
  assert.equal(c.estat,'falla',JSON.stringify(manifests));assert.deepEqual(c.evidencia,[{fitxer:'wordpress-plugin/dist/assets/uploads/tag.svg',regla:'svg-actiu'}]);
  assert.equal(regla(r,'VIG-RANCI'),undefined);assert.equal(codiVigilant(r),1);
 }
});
test('PWA03-V3 · la línia del connector congelada no data cap build: la release de 33e46f278 (App 1.2.2) a l’arbre de 11ca49daa (App 1.2.7)',t=>{
 const arbre117=write=>{write('package.json',JSON.stringify({version:'1.2.7'}));write('wordpress-plugin/socdepoble-enxufe.php',"<?php\n/**\n * Version:           1.1.15\n */\ndefined( 'ABSPATH' ) || exit;\n");};
 for(const [vivaDelDist,esperat] of [[viva('1.2.2'),'ranci'],[null,'ranci'],[viva('1.2.7'),'mesurat']]) {
  const {root,write}=fixture(t);arbre117(write);write('wordpress-plugin/dist/sdp-release.json',release('1.1.15'));if(vivaDelDist) write('wordpress-plugin/dist/versio-viva.json',vivaDelDist);write('public/a.svg',SVG_NET);write('wordpress-plugin/dist/a.svg',SVG_ACTIU);
  const r=analitzaVigilant(root);
  if(esperat==='ranci') {assert.equal(regla(r,'VIG-07').estat,'no-mesurat',vivaDelDist);assert.deepEqual(regla(r,'VIG-RANCI').evidencia,[{fitxer:'wordpress-plugin/dist',motiu:'build ranci, no mesurat',versioBuild:'1.1.15',versioViva:vivaDelDist?'1.2.2':null,versioArbre:'1.2.7'}]);}
  else {assert.equal(regla(r,'VIG-07').estat,'falla');assert.equal(regla(r,'VIG-RANCI'),undefined);}
 }
});
test('PWA03-V1 · un manifest niat dins d’un build fresc no amaga res: VIG-07, VA1 i VIG-12 continuen bloquejant i VIG-01/02 avisant',t=>{
 for(const [nom,fitxers,ids,eixida] of [
  ['C2',{'dist/versio-viva.json':viva('1.2.24'),'dist/assets/x/mal.svg':SVG_ACTIU,'dist/assets/x/versio-viva.json':'{}'},['VIG-07'],1],
  ['C4',{'wordpress-plugin/dist/sdp-release.json':release('1.2.24-dev'),'wordpress-plugin/dist/sub/x.php':PHP_SENSE_GUARDA,'wordpress-plugin/dist/sub/sdp-release.json':release('0')},['VA1','VIG-02','VIG-03'],1],
  ['C6',{'dist/versio-viva.json':viva('1.2.24'),'dist/img/a.png':PNG_AMB_PHP,'dist/img/versio-viva.json':viva('0')},['VIG-12'],1],
  ['S4',{'dist/versio-viva.json':viva('1.2.24'),'dist/vell/versio-viva.json':viva('0'),'dist/vell/.env':'NO','dist/vell/x.php':PHP_SENSE_GUARDA},['VIG-01','VIG-02'],0],
  // Sense manifest a l'arrel, un de niat tampoc no fa ranci cap build.
  ['sense arrel',{'dist/sub/versio-viva.json':viva('0'),'dist/sub/mal.svg':SVG_ACTIU},['VIG-07'],1]
 ]) {
  const {root,write}=fixture(t);arbreV1224(write);for(const [p,s] of Object.entries(fitxers)) write(p,s);
  const r=analitzaVigilant(root);for(const id of ids) assert.equal(regla(r,id).estat,'falla',`${nom} ${id}`);
  assert.equal(regla(r,'VIG-RANCI'),undefined,nom);assert.equal(codiVigilant(r),eixida,nom);
 }
});
test('PWA03-V2 · el prefix del build ranci té frontera: un dist ranci no amaga dist-natiu',t=>{
 const {root,write}=fixture(t);arbreV1224(write);write('dist/versio-viva.json',viva('1.2.0'));write('dist-natiu/versio-viva.json',viva('1.2.24'));write('dist-natiu/a.svg',SVG_ACTIU);
 // Bessons a public/ per als dos talls: el bo (a.svg) i el que donaria un prefix «dist» sense barra (natiu/a.svg).
 // Cap dels dos fa del fitxer de dist-natiu una còpia del dist ranci (PWA03DUR-S1).
 write('public/a.svg',SVG_NET);write('public/natiu/a.svg',SVG_NET);
 const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla');assert.deepEqual(regla(r,'VIG-07').evidencia,[{fitxer:'dist-natiu/a.svg',regla:'svg-actiu'}]);
 assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);
});
test('PWA03-V5 · un manifest il·legible és un build trencat, no un de vell: es mesura sencer; un de llegible sense versió és ranci',t=>{
 for(const manifests of [{'sdp-release.json':'{'},{'sdp-release.json':release('1.2.0-dev'),'versio-viva.json':'{'}]) {
  const {root,write}=fixture(t);arbreV1224(write);for(const [nom,text] of Object.entries(manifests)) write(`wordpress-plugin/dist/${nom}`,text);write('wordpress-plugin/dist/assets/uploads/tag.svg',SVG_ACTIU);
  const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla',JSON.stringify(manifests));assert.equal(regla(r,'VIG-RANCI'),undefined);assert.equal(codiVigilant(r),1);
 }
 const {root,write}=fixture(t);arbreV1224(write);write('dist/versio-viva.json','{}');write('public/a.svg',SVG_NET);write('dist/a.svg',SVG_ACTIU);
 const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'no-mesurat');assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>[e.fitxer,e.versioBuild]),[['dist',null]]);
});
test('PWA-03 · sense una versió d’este arbre no hi ha mesura: una release vella i un arbre sense package.json',t=>{
 // El manifest de la release mana sobre la versio-viva.json que el build copia de public/.
 let {root,write}=fixture(t);arbreV1224(write);write('wordpress-plugin/dist/sdp-release.json',release('1.1.31'));write('wordpress-plugin/dist/versio-viva.json',viva('1.2.24'));write('public/assets/uploads/tag.svg',SVG_NET);write('wordpress-plugin/dist/assets/uploads/tag.svg',SVG_ACTIU);
 let r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'no-mesurat');assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>[e.fitxer,e.versioBuild]),[['wordpress-plugin/dist','1.1.31']]);
 ({root,write}=fixture(t));write('wordpress-plugin/builds/directori/socdepoble.zip','zip');
 write('wordpress-plugin/builds/directori/dist/sdp-release.json',release('1.2.24-dev'));write('public/a.svg',SVG_NET);write('wordpress-plugin/builds/directori/dist/a.svg',SVG_ACTIU);
 r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'no-mesurat');assert.equal(regla(r,'VIG-01').estat,'ok');
 assert.deepEqual(regla(r,'VIG-RANCI').evidencia,[{fitxer:'wordpress-plugin/builds/directori/dist',motiu:'build ranci, no mesurat',versioBuild:'1.2.24-dev',versioViva:null,versioArbre:null}]);
 // Un perímetre fet només de builds rancis es llig sencer: el seu .env hi falla, i el que no hi és sí que és ok.
 ({root,write}=fixture(t));arbreV1224(write);fs.rmSync(path.join(root,'public'),{recursive:true});write('wordpress-plugin/dist/sdp-release.json',release('1.2.0-dev'));write('wordpress-plugin/dist/.env','NO');
 r=analitzaVigilant(root);assert.equal(regla(r,'VIG-01').estat,'falla');assert.deepEqual(regla(r,'VIG-01').evidencia,[{fitxer:'wordpress-plugin/dist/.env'}]);
 for(const id of ['VIG-02','VIG-12']) assert.equal(regla(r,id).estat,'ok',id);
 // public/ és la font, no cap build: es mesura sempre, encara que la seua versio-viva.json no case.
 ({root,write}=fixture(t));arbreV1224(write);write('public/versio-viva.json',viva('1.2.0'));write('public/f.svg',SVG_ACTIU);
 r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla');assert.equal(regla(r,'VIG-RANCI'),undefined);
});
test('PWA-03 · versio-del-build: versions de l’arbre i estat d’un build a partir del text dels manifests',async()=>{
 const {MOTIU_BUILD_RANCI,ARRELS_DE_BUILD,versionsDeLArbre,estatDelBuild}=await import('../tooling/lib/versio-del-build.mjs');
 assert.equal(MOTIU_BUILD_RANCI,'build ranci, no mesurat');
 assert.deepEqual(ARRELS_DE_BUILD,['dist','dist-natiu','wordpress-plugin/dist','wordpress-plugin/builds/directori/dist']);
 assert.deepEqual(versionsDeLArbre({paquet:'{"version":"1.2.24"}',connector:"<?php\n/**\n * Version:           1.1.32\n */"}),{app:'1.2.24',dev:'1.2.24-dev',linia:'1.1.32'});
 assert.deepEqual(versionsDeLArbre({paquet:'{"version":"1.2.24"}'}),{app:'1.2.24',dev:'1.2.24-dev',linia:null});
 for(const paquet of [undefined,null,'{','{}','{"version":""}','{"version":" "}','{"version":3}']) assert.equal(versionsDeLArbre({paquet,connector:' * Version: 1.1.32'}),null,String(paquet));
 const arbre=versionsDeLArbre({paquet:'{"version":"1.2.24"}',connector:' * Version: 1.1.32'});
 const estat=(manifests,a=arbre)=>{const e=estatDelBuild(manifests,a);return [e.estat,e.versio,e.versioViva];};
 assert.deepEqual(estat({}),[null,null,null]);
 assert.deepEqual(estat({release:release('1.2.24-dev')}),['mesurat','1.2.24-dev',null]);
 assert.deepEqual(estat({release:release('1.2.24')}),['mesurat','1.2.24',null]);
 assert.deepEqual(estat({viva:viva('1.2.24')}),['mesurat','1.2.24','1.2.24']);
 assert.deepEqual(estat({release:release('1.1.32'),viva:viva('1.2.24')}),['mesurat','1.1.32','1.2.24']);
 assert.deepEqual(estat({release:release('1.1.32')}),['ranci','1.1.32',null]);
 assert.deepEqual(estat({release:release('1.1.32'),viva:viva('1.2.23')}),['ranci','1.1.32','1.2.23']);
 assert.deepEqual(estat({viva:viva('1.1.32')}),['ranci','1.1.32','1.1.32']);
 assert.deepEqual(estat({release:release('1.2.0-dev'),viva:viva('1.2.24')}),['ranci','1.2.0-dev','1.2.24']);
 for(const v of ['','1.2.0-dev','1.2.24-dev.1',' 1.2.24','1.2.24 ']) assert.deepEqual(estat({release:release(v)}),['ranci',v,null],v);
 for(const text of ['{}','null','3','"1.2.24"','{"versio":1224}','[]']) assert.deepEqual(estat({release:text}),['ranci',null,null],text);
 assert.deepEqual(estat({release:'{'}),['trencat',null,null]);assert.deepEqual(estat({release:release('1.2.24-dev'),viva:'{'}),['trencat',null,null]);
 assert.deepEqual(estat({viva:'{'}),['trencat',null,null]);
 assert.deepEqual(estat({release:release('1.2.24-dev')},null),['ranci','1.2.24-dev',null]);
 // Sense línia del connector, la versio-viva.json d'esta App no fa mesurat un build sense versió.
 assert.deepEqual(estat({release:'{}',viva:viva('1.2.24')},versionsDeLArbre({paquet:'{"version":"1.2.24"}'})),['ranci',null,'1.2.24']);
 // La capçalera de veres del connector es llig: l'App, el seu -dev i una línia del connector.
 const reals=versionsDeLArbre({paquet:fs.readFileSync(path.join(REPO_L202,'package.json'),'utf8'),connector:fs.readFileSync(path.join(REPO_L202,'wordpress-plugin/socdepoble-enxufe.php'),'utf8')});
 assert.equal(reals.dev,`${reals.app}-dev`);assert.match(reals.linia,/^\d+\.\d+\.\d+$/);
});
test('PWA-03 · VIG-04 continua mirant sencer un build ranci: el desfasament informa i un orfe injectat després de l’inventari falla',t=>{
 const {root,write}=fixture(t);arbreV1224(write);write('dist/a.txt','abc');inventariDe(write,{'a.txt':'abc'});write('dist/sdp-release.json',release('1.2.0-dev'));
 assert.equal(regla(analitzaVigilant(root),'VIG-04').estat,'informa');
 const nou=new Date(Date.now()+3600_000);write('dist/injectat.js','x');fs.utimesSync(path.join(root,'dist/injectat.js'),nou,nou);
 const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-04').estat,'falla');assert.deepEqual(regla(r,'VIG-04').evidencia,[{fitxer:'dist/injectat.js'}]);
 assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);
});
/* Gauntlet PWA03DUR (ronda de correcció). A1: la rebaixa de VIG-07 depén de si ha deixat algun .svg fora, no de si hi ha
   cap ranci ni de si l'exclòs és actiu. S1/A2: un .svg d'un ranci només queda fora si té bessó al mateix camí de public/. */
test('PWA03DUR-A1 · VIG-07 només es rebaixa si ha deixat algun .svg fora, siga actiu o benigne',t=>{
 // Un ranci sense cap .svg: VIG-07 ho ha mesurat tot i diu ok; VIG-RANCI nomena el build.
 const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('dist/a.js','x');
 let r=analitzaVigilant(root),c7=regla(r,'VIG-07');
 assert.equal(c7.estat,'ok');assert.doesNotMatch(c7.proposta,/VIG-RANCI/);
 const c=regla(r,'VIG-RANCI');assert.equal(c.estat,'no-mesurat');assert.equal(c.severitat,'alta');assert.equal(c.avis,false);assert.equal(codiVigilant(r),0);
 // Un .svg benigne sense bessó dins del ranci es mesura: continua ok.
 write('dist/assets/propi.svg',SVG_NET);r=analitzaVigilant(root);c7=regla(r,'VIG-07');
 assert.equal(c7.estat,'ok');assert.doesNotMatch(c7.proposta,/VIG-RANCI/);
 // Un .svg benigne amb bessó (dist/f.svg ↔ public/f.svg) no s'ha llegit: VIG-07 no pot dir ok, encara que siga benigne.
 write('dist/f.svg',SVG_NET);r=analitzaVigilant(root);c7=regla(r,'VIG-07');
 assert.equal(c7.estat,'no-mesurat');assert.deepEqual(c7.evidencia,[]);assert.match(c7.proposta,SENSE_MESURAR(1));assert.equal(codiVigilant(r),0);
});
test('PWA03DUR-S1 · un .svg actiu sense bessó a public/ dins d’un build ranci es mesura: VIG-07 bloqueja i la porta ix amb 1',t=>{
 const INJECTAT='<svg><script>x()</script></svg>';
 for(const [base,manifest,text] of [['dist','versio-viva.json',viva('1.2.0')],['dist','sdp-release.json',release('1.1.0')],['wordpress-plugin/dist','sdp-release.json','{}'],['wordpress-plugin/builds/directori/dist','versio-viva.json','{}']]) {
  const {root,write}=fixture(t);arbreV1224(write);write(`${base}/${manifest}`,text);
  // El bessó és per camí, no per nom: un injectat.svg a l'arrel de public/ no ho és d'assets/injectat.svg.
  write('public/injectat.svg',SVG_NET);write(`${base}/assets/injectat.svg`,INJECTAT);
  const r=analitzaVigilant(root),c7=regla(r,'VIG-07');
  assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),[base],base);
  assert.equal(c7.estat,'falla',base);assert.equal(c7.avis,false,base);assert.deepEqual(c7.evidencia,[{fitxer:`${base}/assets/injectat.svg`,regla:'svg-actiu'}],base);
  assert.doesNotMatch(c7.proposta,/VIG-RANCI/,base);assert.equal(codiVigilant(r),1,base);
  if(base==='dist'&&manifest==='sdp-release.json') {const cli=spawnSync(process.execPath,[CLI_VIGILANT,`--arrel=${root}`],{encoding:'utf8'});assert.equal(cli.status,1,cli.stderr);assert.match(cli.stdout,/^VIG-07 FALLA alta · dist\/assets\/injectat\.svg$/m);}
 }
 // Un bessó que és un enllaç simbòlic no compta (no es travessa): l'SVG del ranci es mesura.
 let {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('fora/net.svg',SVG_NET);write('dist/assets/injectat.svg',INJECTAT);
 fs.mkdirSync(path.join(root,'public/assets'),{recursive:true});fs.symlinkSync(path.join(root,'fora/net.svg'),path.join(root,'public/assets/injectat.svg'));
 let r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'falla');assert.deepEqual(regla(r,'VIG-07').evidencia,[{fitxer:'dist/assets/injectat.svg',regla:'svg-actiu'}]);assert.equal(codiVigilant(r),1);
 // Risc residual que l'àrbitre accepta: amb un bessó al mateix camí de public/ i amb el nom exacte (PWA03VF-01), el .svg
 // del ranci no es llig, encara que l'hagen modificat. VIG-07 no diu ok (no-mesurat, amb el recompte) i VIG-RANCI nomena
 // el build.
 ({root,write}=fixture(t));arbreV1224(write);RANCI_DIST(write);write('public/assets/injectat.svg',SVG_NET);write('dist/assets/injectat.svg',INJECTAT);
 r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'no-mesurat');assert.match(regla(r,'VIG-07').proposta,SENSE_MESURAR(1));
 assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);assert.equal(codiVigilant(r),0);
});
test('PWA03DUR-A2 · manteniment sense 503 i un .svg actiu en un ranci: sense bessó bloqueja com a la base; amb bessó, l’avís diu què no ha llegit',t=>{
 const GUARDA="<?php\ndefined( 'ABSPATH' ) || exit;\n";
 for(const [ambBesso,evidencia,avis,eixida] of [
  [false,[{fitxer:'wordpress-plugin/dist/maintenance.php'},{fitxer:'wordpress-plugin/dist/assets/tag.svg',regla:'svg-actiu'}],false,1],
  [true,[{fitxer:'wordpress-plugin/dist/maintenance.php'}],true,0]
 ]) {
  const {root,write}=fixture(t);arbreV1224(write);RANCI_WP(write);write('wordpress-plugin/dist/maintenance.php',`${GUARDA}echo 'Tornem prompte';\n`);write('wordpress-plugin/dist/assets/tag.svg',SVG_ACTIU);
  if(ambBesso) write('public/assets/tag.svg',SVG_NET);
  const r=analitzaVigilant(root),c7=regla(r,'VIG-07');
  assert.equal(c7.estat,'falla');assert.equal(c7.avis,avis,String(ambBesso));assert.deepEqual(c7.evidencia,evidencia);assert.equal(codiVigilant(r),eixida,String(ambBesso));
  if(ambBesso) assert.match(c7.proposta,SENSE_MESURAR(1));else assert.doesNotMatch(c7.proposta,/VIG-RANCI/);
 }
});
/* Verificador final de PWA-03 dur (ronda 4). PWA03VF-02: una font de versió present però il·legible no tomba l'informe i falla
   cap a mesurar. PWA03VF-01/VF4-03: el bessó de public/ té el nom exacte (APFS no distingix majúscules ni NFC de NFD). VF4-01:
   les defenses del bessó (enllaç, carpeta, mida). PWA03VF-03: VIG-12 llig els .svg amb bessó d'un build ranci. PWA03VF-04: la
   capçalera Version: en temps lineal. */
const INJECTAT_SVG='<svg><script>x()</script></svg>';
const ROOT_LLIG_TOT=typeof process.getuid==='function'&&process.getuid()===0;
test('PWA03VF-02 · un package.json o un manifest d’arrel presents però il·legibles no tomben l’informe: VIG-01 i VA1 continuen fallant i el build es mesura sencer',{skip:ROOT_LLIG_TOT&&'root llig els fitxers de mode 000'},t=>{
 const prepara=()=>{const f=fixture(t);arbreV1224(f.write);RANCI_DIST(f.write);f.write('dist/sdp-release.json',release('1.2.0-dev'));f.write('dist/.env','NO_REVELAR_EL_VALOR');
  f.write('wordpress-plugin/porta.php',PHP_SENSE_GUARDA);f.write('public/assets/tag.svg',SVG_NET);f.write('dist/assets/tag.svg',SVG_ACTIU);return f;};
 // Control: tot llegible, el dist és ranci i el seu tag.svg (amb bessó) queda fora de VIG-07.
 let {root}=prepara();let r=analitzaVigilant(root);
 assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);assert.equal(regla(r,'VIG-07').estat,'no-mesurat');
 for(const [illegible,com] of [['package.json','EACCES'],['dist/sdp-release.json','EACCES'],['dist/versio-viva.json','EACCES'],
  ['package.json','carpeta'],['dist/sdp-release.json','carpeta'],['dist/versio-viva.json','carpeta'],['wordpress-plugin/socdepoble-enxufe.php','carpeta'],
  ['dist/sdp-release.json','enllaç trencat']]) {
  ({root}=prepara());const abs=path.join(root,illegible),cas=`${illegible} (${com})`;
  if(com==='carpeta') {fs.rmSync(abs);fs.mkdirSync(abs);}
  else if(com==='enllaç trencat') {fs.rmSync(abs);fs.symlinkSync(path.join(root,'no-hi-es.json'),abs);}
  else fs.chmodSync(abs,0);
  try {r=analitzaVigilant(root);} finally {if(com==='EACCES') fs.chmodSync(abs,0o644);}
  assert.equal(regla(r,'VIG-01').estat,'falla',cas);assert.deepEqual(regla(r,'VIG-01').evidencia,[{fitxer:'dist/.env'}],cas);
  assert.equal(regla(r,'VA1').estat,'falla',cas);assert.deepEqual(regla(r,'VA1').evidencia,[{fitxer:'wordpress-plugin/porta.php'}],cas);
  // Falla cap a mesurar: cap build no és ranci i el tag.svg del dist es llig.
  assert.equal(regla(r,'VIG-RANCI'),undefined,cas);
  assert.equal(regla(r,'VIG-07').estat,'falla',cas);assert.deepEqual(regla(r,'VIG-07').evidencia,[{fitxer:'dist/assets/tag.svg',regla:'svg-actiu'}],cas);
  assert.equal(codiVigilant(r),1,cas);assert.equal(JSON.stringify(r).includes('NO_REVELAR_EL_VALOR'),false,cas);
 }
});
test('PWA03VF-02 · versio-del-build: MANIFEST_ILLEGIBLE fa trencat el build, siga la release o la versio-viva.json',async()=>{
 const {MANIFEST_ILLEGIBLE,estatDelBuild,versionsDeLArbre}=await import('../tooling/lib/versio-del-build.mjs');
 const arbre=versionsDeLArbre({paquet:'{"version":"1.2.24"}',connector:' * Version: 1.1.32'});
 assert.equal(typeof MANIFEST_ILLEGIBLE,'symbol');
 for(const manifests of [{release:MANIFEST_ILLEGIBLE},{viva:MANIFEST_ILLEGIBLE},{release:release('1.2.24-dev'),viva:MANIFEST_ILLEGIBLE},{release:MANIFEST_ILLEGIBLE,viva:viva('1.2.24')}]) {
  const e=estatDelBuild(manifests,arbre);assert.deepEqual([e.estat,e.versio,e.versioViva],['trencat',null,null],String(Object.keys(manifests)));
 }
});
test('PWA03VF-01 · el bessó de public/ ha de tindre el nom exacte: ni les majúscules ni la forma NFD/NFC que APFS confon',t=>{
 for(const [actiu,besso] of [
  ['dist/F.svg','public/f.svg'],
  ['dist/assets/Injectat.svg','public/assets/injectat.svg'],
  ['dist/ASSETS/injectat.svg','public/assets/injectat.svg'],
  ['dist/assets/café.svg','public/assets/café.svg'],
  ['dist/assets/café.svg','public/assets/café.svg']
 ]) {
  const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write(besso,SVG_NET);write(actiu,INJECTAT_SVG);
  // Un sistema de fitxers que normalitza els noms (HFS+) els fa iguals de veres: llavors no hi ha res a provar.
  if(!fs.readdirSync(path.dirname(path.join(root,actiu))).includes(path.basename(actiu))) {t.diagnostic(`el disc ha normalitzat ${JSON.stringify(actiu)}`);continue;}
  const r=analitzaVigilant(root),c7=regla(r,'VIG-07');
  assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist'],actiu);
  assert.equal(c7.estat,'falla',actiu);assert.deepEqual(c7.evidencia,[{fitxer:actiu,regla:'svg-actiu'}],actiu);
  assert.doesNotMatch(c7.proposta,/VIG-RANCI/,actiu);assert.equal(codiVigilant(r),1,actiu);
 }
 // Gauntlet VFR4S-02 · El primer component també té el nom exacte: una carpeta PUBLIC no fa de public/ per al bessó.
 {
  const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('public/assets/t.svg',SVG_NET);write('dist/assets/t.svg',INJECTAT_SVG);
  fs.renameSync(path.join(root,'public'),path.join(root,'PUBLIC'));
  if(fs.readdirSync(root).includes('PUBLIC')) {
   const r=analitzaVigilant(root),c7=regla(r,'VIG-07');
   assert.equal(c7.estat,'falla','PUBLIC');assert.deepEqual(c7.evidencia,[{fitxer:'dist/assets/t.svg',regla:'svg-actiu'}],'PUBLIC');
   assert.equal(codiVigilant(r),1,'PUBLIC');
  } else t.diagnostic('el disc no ha conservat el nom PUBLIC');
 }
 // Amb el nom exacte, també no ASCII, el bessó compta: el .svg del ranci queda fora, com abans.
 for(const nom of ['café.svg','café.svg']) {
  const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write(`public/assets/${nom}`,SVG_NET);write(`dist/assets/${nom}`,INJECTAT_SVG);
  const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'no-mesurat',nom);assert.match(regla(r,'VIG-07').proposta,SENSE_MESURAR(1),nom);assert.equal(codiVigilant(r),0,nom);
 }
});
test('VF4-01 · el bessó no compta si public/assets és un enllaç, si és una carpeta o si passa del límit de lectura: l’SVG del ranci es mesura',t=>{
 const LIMIT=8*1024*1024;
 for(const [nom,prepara] of [
  ['public/assets és un enllaç simbòlic a una carpeta amb el .svg',(root,write)=>{write('fora/injectat.svg',SVG_NET);fs.symlinkSync(path.join(root,'fora'),path.join(root,'public/assets'));}],
  ['public/assets/injectat.svg és una carpeta',root=>fs.mkdirSync(path.join(root,'public/assets/injectat.svg'),{recursive:true})],
  ['public/assets és un fitxer',(_,write)=>write('public/assets','x')],
  ['el bessó passa del límit de lligBuffer (8 MiB i 1 B)',(_,write)=>write('public/assets/injectat.svg',Buffer.alloc(LIMIT+1,0x20))]
 ]) {
  const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);prepara(root,write);write('dist/assets/injectat.svg',INJECTAT_SVG);
  const r=analitzaVigilant(root),c7=regla(r,'VIG-07');
  assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist'],nom);
  assert.equal(c7.estat,'falla',nom);assert.deepEqual(c7.evidencia,[{fitxer:'dist/assets/injectat.svg',regla:'svg-actiu'}],nom);
  assert.doesNotMatch(c7.proposta,/VIG-RANCI/,nom);assert.equal(codiVigilant(r),1,nom);
 }
 // La frontera: un bessó de 8 MiB justos sí compta (el mateix límit que lligBuffer).
 const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('public/assets/injectat.svg',Buffer.alloc(LIMIT,0x20));write('dist/assets/injectat.svg',INJECTAT_SVG);
 const r=analitzaVigilant(root);assert.equal(regla(r,'VIG-07').estat,'no-mesurat');assert.match(regla(r,'VIG-07').proposta,SENSE_MESURAR(1));
});
test('PWA03VF-03 · VIG-12 continua llegint un .svg d’un build ranci amb bessó a public/: el PHP camuflat bloqueja',t=>{
 // arbreV1224 deixa un public/f.svg net: dist/f.svg n'és el bessó i VIG-07 no el llig.
 const {root,write}=fixture(t);arbreV1224(write);RANCI_DIST(write);write('dist/f.svg','<svg><?php echo 1; ?></svg>');
 const r=analitzaVigilant(root);assert.deepEqual(regla(r,'VIG-RANCI').evidencia.map(e=>e.fitxer),['dist']);
 assert.equal(regla(r,'VIG-12').estat,'falla');assert.deepEqual(regla(r,'VIG-12').evidencia,[{fitxer:'dist/f.svg'}]);
 assert.equal(regla(r,'VIG-07').estat,'no-mesurat');assert.match(regla(r,'VIG-07').proposta,SENSE_MESURAR(1));
 assert.equal(codiVigilant(r),1);
});
test('PWA03VF-04 · la capçalera Version: es llig en temps lineal i dona el mateix que la lectura d’abans en els casos bons',async()=>{
 const {versionsDeLArbre}=await import('../tooling/lib/versio-del-build.mjs');
 const linia=connector=>versionsDeLArbre({paquet:'{"version":"1.2.24"}',connector}).linia;
 // Una línia Version: amb 40.000 espais dins del valor: amb la forma d'abans, retrocés quadràtic (1,7 s); ara, lineal.
 const E=' '.repeat(40000);
 for(const [text,esperat] of [[` * Version: 1${E}x`,`1${E}x`],[` * Version:${'\t'.repeat(40000)}1${E}#`,`1${E}#`],[` * Version: 1${E}x${E}\n */`,`1${E}x`]]) {
  const t0=performance.now(),valor=linia(text),ms=performance.now()-t0;
  assert.ok(ms<200,`${ms.toFixed(1)} ms`);assert.equal(valor,esperat);
 }
 // La lectura d'abans (la de capcalera() de wordpress-plugin/eines/empaqueta.mjs), oracle dels casos bons i curts.
 const ABANS=/^[ \t/*#@]*Version:[ \t]*(.+?)[ \t]*$/mi;
 const bons=[fs.readFileSync(path.join(REPO_L202,'wordpress-plugin/socdepoble-enxufe.php'),'utf8'),
  "<?php\n/**\n * Plugin Name:       Sóc de Poble\n * Version:           1.1.32\n */",' * Version: 1.1.32   ',"\t*\tVersion:\t1.1.32\t",'Version:1.1.32',
  '# Version: 1.1.32','// Version: 1.1.32','@Version: 1.1.32',' * version: 1.1.32',"<?php\r\n/**\r\n * Version: 1.1.32\r\n */\r\n",' * Version: 1.1.32\n * Version: 9.9.9',
  ' * Requires at least: 6.4\n * Version: 1.1.32-beta.1 \n',' * Version: 1.1.32 rc 2',' * Plugin Version: 1.1.32',' * Description: sense versió',''];
 for(const text of bons) assert.equal(linia(text),ABANS.exec(text)?.[1]??null,JSON.stringify(text.slice(0,80)));
 assert.equal(bons.filter(text=>linia(text)!==null).length,13);
 // Fora dels casos bons, com get_file_data de WordPress: la primera línia Version: mana, i una de buida no dona cap línia.
 assert.equal(linia(' * Version:\n * Version: 1.1.32'),null);assert.equal(linia(' * Version:    \n'),null);
});
