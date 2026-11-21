import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { analitzaVigilant, codiVigilant, readOnly, defectesWp72, defectesSvgWp72 } from '../tooling/gates/tractor-vigilant.mjs';
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
