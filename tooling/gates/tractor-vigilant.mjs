#!/usr/bin/env node
/** IDEA-13 · Perímetre estàtic sense dependències, xarxa ni escriptures.
 * node tooling/gates/tractor-vigilant.mjs [--json] [--arrel=DIR]
 * Les comprovacions noves són avisos fins a l'aprovació del Mestre.
 * Un fitxer absent o no llegible és no-mesurat; mai un verd fabricat.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
// Un sol lexer i unes mateixes regles que la porta Tellado (R25.2-P01/P03, IDEA-266).
import { avaluaPerimetreTellado, defectesPermisosWp, descodificaEntitatsHtml, faviconsRasterValids, mancancesManteniment503, netejaComentarisLineal, teGuardaAbspathAmbEixida, trobaSecretsWp } from './porta-perimetre-tellado.mjs';
export const readOnly = true;
// v1.2.19 · Gauntlet R1 (L2-02): textos i binaris tenen regla i pressupost propis.
// Les dades comprimides contenen '<?=' per atzar (2^-24 per posició): 17 de 819 actius de public/.
const ACTIU_TEXT = /\.(?:svg|txt|html?|css)$/i;
const ACTIU_BINARI = /\.(?:png|jpe?g|gif|ico|webp|avif|bmp|pdf|woff2?)$/i;
export const PRESSUPOST_ESTATIC = Object.freeze({
  text: Object.freeze({ fitxers: 512, bytes: 8 * 1024 * 1024, perFitxer: 2 * 1024 * 1024 }),
  binari: Object.freeze({ fitxers: 4096, bytes: 256 * 1024 * 1024, perFitxer: 2 * 1024 * 1024 }),
});
const ESPAI_PHP = new Set([0x20, 0x09, 0x0a, 0x0d]);
const llegible = b => ESPAI_PHP.has(b) || (b >= 0x21 && b <= 0x7e);
/** v1.2.19 · Gauntlet R1 (L2-02): obertura PHP plausible dins d'un actiu binari, en temps lineal.
 * '<?php' compta seguit d'espai, salt de línia o final (l'obertura que PHP accepta). '<?=' compta
 * si el seguix codi ASCII llegible fins a '?>', __halt_compiler o el final: el webshell d'IDAT
 * '<?=$_GET[0]($_POST[1]);?>' continua detectat. Un byte no ASCII al mig ho evita: és heurística. */
export function phpEnBinari(bytes) {
  let cuaFallida = -1;
  for (let i = bytes.indexOf('<?'); i !== -1; i = bytes.indexOf('<?', i + 2)) {
    if ((bytes[i + 2] | 0x20) === 0x70 && (bytes[i + 3] | 0x20) === 0x68 && (bytes[i + 4] | 0x20) === 0x70
      && (i + 5 === bytes.length || ESPAI_PHP.has(bytes[i + 5]))) return true;
    if (bytes[i + 2] !== 0x3d || i < cuaFallida) continue;
    let j = i + 3;
    while (j < bytes.length && llegible(bytes[j])) j++;
    const cua = bytes.toString('latin1', i + 3, j).toLowerCase();
    if (cua.includes('?>') || cua.includes('__halt_compiler') || (j === bytes.length && cua.trim())) return true;
    // Els '<?=' següents d'esta mateixa tirada en tenen un sufix: mateix veredicte, sense tornar-la a llegir.
    cuaFallida = j;
  }
  return false;
}
/** Heurística estàtica: noms executables camuflats i PHP incrustat en actius.
 * No executa res ni comprova si el motor PHP té pedaços per a PHP2Shell. */
export function defectesFitxerEstatic(relative, bytes = null) {
  const nom = path.posix.basename(relative);
  const errors = [];
  if (/\.(?:php\d*|phtml|pht|phar|phps|cgi|sh|py|pl)(?:[.;\s]|$)/i.test(nom)) errors.push('executable-static-name');
  if (/^\.user\.ini$/i.test(nom)) errors.push('server-config-static');
  // .htaccess també és configuració legítima de la SPA. Es marquen directives
  // executables, no el nom del fitxer de rewrite que ja distribuïm.
  if (bytes && /^\.htaccess$/i.test(nom)) {
    const config = bytes.toString('utf8').replace(/^\s*#.*$/gm, '');
    if (/^\s*(?:AddHandler|SetHandler|AddType)\b[^\r\n]*(?:php|cgi|exec)|^\s*php_(?:value|flag)\s+auto_(?:prepend|append)_file\b/im.test(config)) errors.push('server-config-execution');
  }
  if (bytes && ACTIU_TEXT.test(nom)) {
    const text = bytes.toString('latin1').toLowerCase();
    if (text.includes('<?php') || text.includes('<?=')) errors.push('php-in-static-bytes');
  } else if (bytes && ACTIU_BINARI.test(nom) && phpEnBinari(bytes)) errors.push('php-in-static-bytes');
  return errors;
}
const SENSIBLE = /(?:^|\/)(?:\.env[^/]*|\.git[^/]*|debug\.log|error_log|phpinfo\.php|secrets\.php|wp-config[^/]*\.php)$|\.(?:sql(?:\.gz)?|bak|old|orig|swp)$/i;
const EXECUTABLE = /\.(php[0-9]?|phtml|phar|sh|py|pl|cgi)$/i;
const NOU = new Set(['VIG-01','VIG-02','VIG-03','VIG-04','VIG-05','VIG-06','VIG-07','VIG-08','VIG-09','VIG-10','VIG-11','VB1','VB2','VB3','VB9','VB10','VC2']);
const ORIGEN = 'Vigilant Tellado: perímetre estàtic adaptat a Sóc de Poble';
// VIG-05 · Exempcions justificades (IDEA-13): cap d'estos hosts es contacta mai des de producció.
const EXEMPT_HOST = new Map([
  ['localhost','servidor de desenvolupament local'],['127.0.0.1','bucle local IPv4'],['[::1]','bucle local IPv6'],
  ['www.w3.org','espai de noms XML/SVG; és un identificador, no es baixa'],['schema.org','vocabulari JSON-LD; identificador'],
  ['purl.org','espai de noms Dublin Core; identificador'],['rs.tdwg.org','termes Darwin Core; identificador'],
  ['datacite.org','esquema DataCite; identificador'],['schemas.openxmlformats.org','espais de noms OOXML dins dels .xlsx'],
  ['schemas.google.com','espai de noms Atom de Blogger; identificador'],['webfinger.net','rel de WebFinger; identificador'],
  ['nodeinfo.diaspora.software','esquema NodeInfo; identificador'],['docs.oasis-open.org','espai de noms OASIS; identificador'],
]);
// RFC 6761: dominis reservats que no resolen mai a Internet (bases de new URL i proves).
const TLD_RESERVAT = /\.(?:invalid|test|example|localhost)$/;
// IRI d'entitat de Wikidata: identificador de dades enllaçades, no un recurs que es baixe.
const IRI_WIKIDATA = /^\/entity\/Q\d+$/;
// Espècimen de pesca del catàleg de disseny: l'enllaç insegur és el contingut que s'hi mostra.
const EXEMPT_FITXER = p => p.startsWith('src/sections/disseny/cataleg/');
export function urlHttpReal(brut) {
  const net=brut.replace(/[),;.]+$/,'').replace(/^(http:\/\/(?:\[[^\]/]*\]|[^/?#:[]+)):(?:\*|\$\{[^}]*\})/,'$1');
  let url;try {url=new URL(net);}catch {return true;}
  const host=url.hostname;
  if(EXEMPT_HOST.has(host)||TLD_RESERVAT.test(host)) return false;
  // Un host d'una sola etiqueta (p. ex. «insegur») no és encaminable a Internet.
  if(host&&!host.startsWith('[')&&!host.includes('.')) return false;
  return !(host==='www.wikidata.org'&&IRI_WIKIDATA.test(url.pathname));
}
// VIG-04 · Artefactes que el build escriu després de l'inventari i que no viatgen als paquets:
// seo-routes.json el genera `npm run build:seo` (build-seo-manifest.mjs) i el vigila la Porta Build.
const POSTERIORS_AL_INVENTARI = new Set(['wordpress-plugin/dist/seo-routes.json']);
// El manifest de Vite (DIRECTORI_DE_VITE de vite.standalone.config.js) és una traça del mateix build
// que manifestDeReleasePlugin deixa fora de l'inventari a posta: no és cap resta.
const TRACA_DE_VITE = '.vite/';
// IDEA-13 · Commit i origen llegits dels fitxers de .git, sense executar git ni tocar la xarxa.
const llegeixPetit=p=>{try {const e=fs.statSync(p);return e.isFile()&&e.size<=4*1024*1024?fs.readFileSync(p,'utf8'):null;}catch {return null;}};
const HASH=/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
export function llegeixGit(root) {
  const buit=motiu=>({commit:null,branca:null,origen:null,motiu});
  const dotgit=path.join(root,'.git');let gitdir;
  try {gitdir=fs.statSync(dotgit).isDirectory()?dotgit:null;}catch {return buit('L’arrel no té .git.');}
  if(!gitdir) {const m=/^gitdir:[ \t]*(.+?)[ \t]*$/m.exec(llegeixPetit(dotgit)||'');if(!m) return buit('El fitxer .git no apunta cap gitdir.');gitdir=path.resolve(root,m[1]);}
  const commondir=llegeixPetit(path.join(gitdir,'commondir'))?.trim();const comu=commondir?path.resolve(gitdir,commondir):gitdir;
  const head=llegeixPetit(path.join(gitdir,'HEAD'))?.trim();
  if(!head) return buit('No es pot llegir HEAD.');
  let commit=null,branca=null;
  if(HASH.test(head)) commit=head;
  else {
    const ref=/^ref:\s*(refs\/[-\w./]+)$/.exec(head)?.[1];
    if(!ref||ref.split('/').some(t=>t==='..'||t==='.'||!t)) return buit('HEAD no és cap referència vàlida.');
    if(ref.startsWith('refs/heads/')) branca=ref.slice(11);
    for(const dir of [gitdir,comu]) {const v=llegeixPetit(path.join(dir,ref))?.trim();if(v&&HASH.test(v)) {commit=v;break;}}
    if(!commit) for(const linia of (llegeixPetit(path.join(comu,'packed-refs'))||'').split('\n')) {const [h,nom]=linia.trim().split(/\s+/);if(nom===ref&&HASH.test(h||'')) {commit=h;break;}}
  }
  if(!commit) return {...buit('La referència de HEAD no té cap commit.'),branca};
  // Config INI mínima: [remote "x"] url i [branch "b"] remote.
  const remots=new Map(),branques=new Map();let seccio=null;
  for(const linia of (llegeixPetit(path.join(comu,'config'))||'').split('\n')) {
    const cap=/^\s*\[\s*(remote|branch)\s+"([^"]+)"\s*\]/.exec(linia);
    if(cap) {seccio=cap;continue;}
    if(/^\s*\[/.test(linia)) {seccio=null;continue;}
    const kv=/^\s*(url|remote)\s*=\s*(.*?)\s*$/i.exec(linia);
    if(!seccio||!kv) continue;
    if(seccio[1]==='remote'&&kv[1].toLowerCase()==='url'&&!remots.has(seccio[2])) remots.set(seccio[2],kv[2]);
    if(seccio[1]==='branch'&&kv[1].toLowerCase()==='remote') branques.set(seccio[2],kv[2]);
  }
  const remot=[branca&&branques.get(branca),'upstream','origin',remots.keys().next().value].find(n=>n&&remots.has(n));
  // Mai cap credencial a l'informe: fora usuari:testimoni@, consulta i fragment.
  const origen=remot?{remot,url:remots.get(remot).replace(/\/\/[^@/]+@/,'//').replace(/[?#].*$/,'')}:null;
  return {commit,branca,origen,motiu:null};
}
function fitxers(root, rel, incidencies) {
  const abs=path.join(root,rel);if(!fs.existsSync(abs)) return null;
  const estat=fs.lstatSync(abs);if(estat.isSymbolicLink()) {incidencies.push(rel);return [];}
  if(!estat.isDirectory()) return [rel];
  const out=[];
  for(const e of fs.readdirSync(abs,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))) {
    const p=path.posix.join(rel,e.name);
    if(e.isSymbolicLink()) {incidencies.push(p);continue;}
    if(e.isDirectory()) out.push(...(fitxers(root,p,incidencies)||[]));
    else if(e.isFile()) out.push(p);
  }
  return out;
}
// IDEA-306 · Compatibilitat per presència: l'API Secrets es va retirar de WP 7.2 RC1.
const API_WP_CONDICIONAL = ['wp_get_secret', 'wp_set_secret', 'wp_delete_secret', 'wp_is_secrets_api_available', 'wp_secrets_memzero', 'wp_is_valid_icon_name'];
const OBSOLETS_WP72 = ['print_head_scripts', 'print_footer_scripts', 'print_admin_styles', 'print_late_styles', 'script_concat_settings', '_print_scripts', '_print_styles', 'in_default_dir', 'WP_Dependencies::get_etag'];
/** Comprovació lèxica per fitxer; una guarda no acredita domini del flux de control. Mai retorna valors. */
export function defectesWp72(text) {
  const net=netejaComentarisLineal(text,'.php');
  const codi=netejaComentarisLineal(text,'.php',{buidaCadenes:true});
  const troballes=[];
  const anota=(regla,index,api)=>troballes.push({regla,linia:net.slice(0,index).split('\n').length,...(api?{api}:{})});
  const guardes=new Set();
  for(const m of codi.matchAll(/(?<![\w>$:])\\?function_exists\s*\(/gi)) {
    const nom=/^\\?function_exists\s*\(\s*(['"])\\?([a-z_][a-z0-9_]*)\1\s*\)/i.exec(net.slice(m.index));
    if(nom) guardes.add(nom[2].toLowerCase());
  }
  const reApi=new RegExp(String.raw`(?<![\w>$:])\\?(${API_WP_CONDICIONAL.join('|')})\s*\(`,'gi');
  for(const m of codi.matchAll(reApi)) {
    if(/\bfunction\s*$/i.test(codi.slice(Math.max(0,m.index-30),m.index))) continue;
    if(!guardes.has(m[1].toLowerCase())) anota('api-sense-guarda',m.index,m[1].toLowerCase());
  }
  // La clau és de l'amfitrió: cap definició al connector, siga literal, concatenada,
  // parentitzada, heredoc o variable. La resta de lectures/defined() no es bloquegen.
  for(const m of codi.matchAll(/(?<![\w>$:])\\?define\s*\(/gi)) {
    const literal=/^\\?define\s*\(\s*(?:\(\s*)*(['"])WP_SECRETS_KEY(?:_PREVIOUS)?\1(?:\s*\))*\s*,/i.exec(net.slice(m.index));
    if(literal) anota('clau-literal',m.index);
  }
  for(const m of codi.matchAll(/\bconst\s+WP_SECRETS_KEY(?:_PREVIOUS)?\s*=/gi)) {
    anota('clau-literal',m.index);
  }
  for(const nom of OBSOLETS_WP72) {
    const esc=nom.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    // Referències de codi i noms literals exactes de hooks, sense comentaris ni text que els imita.
    const re=new RegExp(String.raw`\b${esc}\s*\(|(['"])${esc}\1`,'g');
    for(const m of net.matchAll(re)) {
      if(codi[m.index]===net[m.index]) anota('obsolet-wp72',m.index,nom);
    }
  }
  return troballes;
}
/** SVG de fitxer o regions SVG incrustades; no executa PHP ni cap script. */
export function defectesSvgWp72(text,{fitxerSvg=false}={}) {
  const net=descodificaEntitatsHtml(String(text).replace(/<!--[^]*?(?:-->|$)/g,''));
  const regions=fitxerSvg?[net]:[...net.matchAll(/<svg\b[^]*?(?:<\/svg\s*>|$)/gi)].map(m=>m[0]);
  return regions.some(svg=>/<(?:[\w-]+:)?(?:script|use)\b|\bonload\s*=/i.test(svg)
    || /javascript:/i.test(svg.replace(/[\u0000-\u0020\u007f]/g,'')));
}
export function analitzaVigilant(arrel, { ara = new Date() } = {}) {
  const root=fs.realpathSync(arrel);if(!fs.statSync(root).isDirectory()) throw new TypeError('Arrel invàlida.');
  const comprovacions=[],enllacos=[];
  const anota=(id,severitat,estat,files=[],proposta='')=>comprovacions.push({id,capa:id.startsWith('VA')?'A':id.startsWith('VC')?'C':'B',origen_tellado:ORIGEN,estat,severitat,avis:NOU.has(id),evidencia:files.map(f=>typeof f==='string'?{fitxer:f}:f),proposta});
  const lligBuffer=rel=>{ const parts=rel.split('/');let cursor=root;
    for(const part of parts) {cursor=path.join(cursor,part);if(!fs.existsSync(cursor)||fs.lstatSync(cursor).isSymbolicLink()) return null;}
    if(!fs.statSync(cursor).isFile() || fs.statSync(cursor).size>8*1024*1024) return null;
    return fs.readFileSync(cursor); };
  const llig=rel=>lligBuffer(rel)?.toString('utf8')??null;
  const netPhp=new Map();const net=p=>{if(!netPhp.has(p))netPhp.set(p,netejaComentarisLineal(llig(p)||'','.php'));return netPhp.get(p);};
  const exposats=['public','dist','dist-natiu','wordpress-plugin/dist','wordpress-plugin/builds/directori'];
  const presents=exposats.map(p=>fitxers(root,p,enllacos)).filter(Boolean), tots=presents.flat();
  for(const [id,filtra] of [['VIG-01',p=>SENSIBLE.test(p)],['VIG-02',p=>EXECUTABLE.test(p)||defectesFitxerEstatic(p).length>0]]) {
    const males=tots.filter(filtra);anota(id,'critica',males.length?'falla':presents.length?'ok':'no-mesurat',males,'Retirar la superfície del paquet en el carril autoritzat.');
  }
  // v1.2.19 · Gauntlet R1 (L2-02): cada classe gasta el seu pressupost; la galeria no buida el dels textos.
  const lectura={text:{fitxers:0,bytes:0,fora:0},binari:{fitxers:0,bytes:0,fora:0}};
  const phpCamuflat=[];
  for(const p of tots) {
    if(!/\.(?:png|jpe?g|gif|ico|webp|avif|svg|bmp|txt|html?|css|pdf|woff2?)$|(?:^|\/)\.htaccess$/i.test(p)) continue;
    const classe=ACTIU_BINARI.test(p)?'binari':'text', l=lectura[classe], max=PRESSUPOST_ESTATIC[classe];
    const mida=fs.lstatSync(path.join(root,p)).size;
    if(mida>max.perFitxer || l.bytes+mida>max.bytes || l.fitxers>=max.fitxers) {l.fora++;continue;}
    const bytes=lligBuffer(p);if(!bytes) {l.fora++;continue;}
    l.bytes+=bytes.length;l.fitxers++;
    if(defectesFitxerEstatic(p,bytes).length) phpCamuflat.push(p);
  }
  const coberturaParcial=lectura.text.fora>0||lectura.binari.fora>0;
  const resum=(nom,l,max)=>`${nom} ${l.fitxers} fitxers/${l.bytes} bytes, ${l.fora} sense llegir (límit ${max.fitxers}/${max.bytes/1048576}MiB)`;
  anota('VIG-12','critica',phpCamuflat.length?'falla':coberturaParcial?'no-mesurat':presents.length?'ok':'no-mesurat',phpCamuflat,
    `PHP camuflat: ${resum('textos',lectura.text,PRESSUPOST_ESTATIC.text)}; ${resum('binaris',lectura.binari,PRESSUPOST_ESTATIC.binari)}; 2MiB per fitxer. No certifica pedaços PHP ni absència de webshells.`);
  const php=(fitxers(root,'wordpress-plugin',enllacos)||[]).filter(p=>p.endsWith('.php'));
  const perillos=php.filter(p=>{const s=llig(p)||'';return /eval\s*\(\s*(?:base64_decode|gzinflate|str_rot13|gzuncompress)|assert\s*\(\s*\$_(?:POST|GET|REQUEST)|preg_replace\s*\(\s*['"][^'"\n]{0,200}\/e['"]|\$(?:[a-f0-9]{16,})\b|\b(?:create_function|shell_exec|passthru|proc_open|system|popen)\s*\(/i.test(s);});
  anota('VIG-03','critica',perillos.length?'falla':php.length?'ok':'no-mesurat',perillos,'Revisar manualment el PHP assenyalat; cap codi s’executa.');
  // L’inventari no es certifica si la release no aporta el format conegut.
  // IDEA-13: «alterats» (JSON o entrada invàlids, llistat absent o hash diferent, orfe posterior a l'inventari) falla;
  // els orfes anteriors a l'inventari són restes d'un build local ranci i només informen, com una versió desfasada.
  const inventaris=tots.filter(p=>p.endsWith('/sdp-inventari.json'));
  let mesurats=0;const alterats=[],rancis=[];
  let versioPaquet=null;try {versioPaquet=JSON.parse(llig('package.json'))?.version??null;}catch {versioPaquet=null;}
  for(const p of inventaris) {
    let inv;try {inv=JSON.parse(llig(p));}catch {alterats.push(p);continue;}
    if(!Array.isArray(inv?.fitxers)) continue;
    mesurats++;
    const base=path.posix.dirname(p),noms=new Set();
    for(const f of inv.fitxers) {
      if(!f || typeof f.cami!=='string'||!/^[-a-zA-Z0-9_./]+$/.test(f.cami)||f.cami.split('/').some(t=>t==='..'||t==='.'||!t)||!/^([a-f0-9]{64})$/.test(f.sha256||'')) {alterats.push(p);continue;}
      const rel=path.posix.join(base,f.cami);noms.add(rel);
      const bytes=llig(rel);if(bytes===null||createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex')!==f.sha256) alterats.push(rel);
    }
    const momentInventari=fs.statSync(path.join(root,p)).mtimeMs;
    const orfes=tots.filter(f=>f.startsWith(base+'/')&&!noms.has(f)&&!['sdp-inventari.json','sdp-release.json'].includes(path.posix.basename(f))&&!POSTERIORS_AL_INVENTARI.has(f)&&!f.startsWith(`${base}/${TRACA_DE_VITE}`));
    // Un orfe escrit en el moment de l'inventari o després no ve d'aquell build: s'hi ha injectat.
    const nous=orfes.filter(f=>fs.lstatSync(path.join(root,f)).mtimeMs>=momentInventari);alterats.push(...nous);
    let versioRelease=null;try {versioRelease=JSON.parse(llig(path.posix.join(base,'sdp-release.json')))?.versio??null;}catch {versioRelease=null;}
    // Un build no-release porta `${package.version}-dev` (versioDelBuild): només eixe es compara amb package.json.
    // Una release porta SDP_VERSIO, la línia del connector, i la versió la valida empaqueta.mjs, no esta porta.
    const desfasada=typeof versioRelease==='string'&&typeof versioPaquet==='string'&&versioRelease.endsWith('-dev')&&versioRelease!==`${versioPaquet}-dev`;
    const nRancis=orfes.length-nous.length;
    if(nRancis||desfasada) rancis.push({fitxer:base,rancis:nRancis,versioRelease,versioPaquet});
  }
  anota('VIG-04','alta',alterats.length?'falla':rancis.length?'informa':mesurats?'ok':'no-mesurat',alterats.length?alterats:rancis,alterats.length||!rancis.length?'Validar també sdp-release amb la porta d’empaquetat; no substituïx la comprovació de release.':'Build local ranci (orfes anteriors a l’inventari o versió -dev desfasada): buidar l’outDir (build de release, SDP_MITJANS=externs o esborrar la carpeta) i tornar a compilar; un build:wp normal no buida la carpeta. L’empaquetador ja deixa fora del zip el que l’inventari no nomena.');
  const src=(fitxers(root,'src',enllacos)||[]).filter(p=>/\.(jsx?|mjs)$/.test(p)&&!p.includes('.test.')&&!p.includes('/__fixtures__/')&&!p.startsWith('src/data/wiki'));
  const fonts=[...src,...php,'index.html','vercel.json','firebase.json'].filter(p=>llig(p)!==null);
  // Els comentaris no es servixen ni es baixen: el lexer de la porta Tellado els buida abans de buscar URL.
  const mixt=fonts.filter(p=>!EXEMPT_FITXER(p)&&[...netejaComentarisLineal(llig(p)||'',path.posix.extname(p)).matchAll(/http:\/\/[^\s"'<>`]+/g)].some(m=>urlHttpReal(m[0])));
  anota('VIG-05','mitjana',mixt.length?'falla':fonts.length?'ok':'no-mesurat',mixt,'Revisar URL no locals. Els hosts locals, els dominis reservats (RFC 6761) i els espais de noms estàndard estan exempts.');
  const html=llig('index.html');const externs=[...php,...(html===null?[]:['index.html'])].filter(p=>/(?:src|href)\s*=\s*['"]https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdn\.jsdelivr\.net)/i.test(llig(p)||''));
  anota('VIG-06','alta',externs.length?'falla':html!==null?'ok':'no-mesurat',externs,'Comprovar declaració External services abans d’autoritzar el recurs.');
  const mantFitxers=[...php,...(['wp-content/maintenance.php','public/maintenance.php'].filter(p=>llig(p)!==null))].filter(p=>/(?:^|\/)(?:maintenance\.php|[^/]*manteniment[^/]*503[^/]*\.php)$/i.test(p));
  const mantMales=mantFitxers.filter(p=>mancancesManteniment503(net(p)).length>0);
  const wp72=php.flatMap(p=>defectesWp72(llig(p)||'').map(d=>({fitxer:p,...d})));
  const svg=[...new Set([...tots,...(fitxers(root,'src',enllacos)||[]),...(fitxers(root,'wordpress-plugin',enllacos)||[])])].filter(p=>/\.svg$/i.test(p));
  const svgMals=svg.filter(p=>defectesSvgWp72(llig(p)||'',{fitxerSvg:true}));
  const svgIncrustats=php.filter(p=>defectesSvgWp72(net(p)));
  const secretsNoAutoritzats=[...new Set([...tots,...php])].filter(p=>path.posix.basename(p).toLowerCase()==='secrets.php');
  const wp72Mals=[...wp72,...[...new Set([...svgMals,...svgIncrustats])].map(fitxer=>({fitxer,regla:'svg-actiu'})),
    ...secretsNoAutoritzats.map(fitxer=>({fitxer,regla:'fitxer-secrets-no-autoritzat'}))];
  anota('VIG-07','alta',mantMales.length||wp72Mals.length?'falla':mantFitxers.length||php.length||svg.length?'ok':'no-mesurat',
    [...mantMales,...wp72Mals],
    'Manteniment: 503, Retry-After, no-store i robots. WP: APIs opcionals amb function_exists al mateix fitxer, cap clau literal ni hook obsolet; SVG sense script/onload/javascript/use. Comprovació lèxica, no prova de flux ni de sanejament integral.');
  // El Mestre ha encarregat explícitament el bloqueig d'IDEA-306. El 503 preexistent continua sent avís.
  if(wp72Mals.length) comprovacions.at(-1).avis=false;
  const secretsPla=php.filter(p=>trobaSecretsWp(net(p)).length>0);
  anota('VIG-08','critica',secretsPla.length?'falla':php.length?'ok':'no-mesurat',secretsPla,'Prohibit persistir secrets en clar a wp_options o exposar WP_SECRETS_KEY / _wp_secret_.');
  const senseGuarda=php.filter(p=>!teGuardaAbspathAmbEixida(p,net(p)));
  anota('VA1','alta',senseGuarda.length?'falla':php.length?'ok':'no-mesurat',senseGuarda,'Afegir i provar la guarda d’accés directe.');
  // Crida per crida i endpoint per endpoint (R25.2-P03): cap ruta hereta el permís d'una veïna.
  const rest=php.filter(p=>/register_rest_route\s*\(/.test(net(p)));
  const sensePermis=rest.filter(p=>defectesPermisosWp(net(p)).some(d=>d.nomCrida==='register_rest_route'));
  anota('VA2','alta',sensePermis.length?'falla':php.length?'ok':'no-mesurat',sensePermis,'Revisar cada ruta REST i el seu permís; comprovació lèxica, no prova semàntica.');
  const proxy=php.filter(p=>/HTTP_(?:X_FORWARDED_FOR|CF_CONNECTING_IP|X_REAL_IP)/.test(llig(p)||''));
  anota('VA3','alta',proxy.length?'falla':php.length?'ok':'no-mesurat',proxy,'Documentar i validar la llista de proxies de confiança.');
  let hosting;try {hosting=JSON.parse(llig('firebase.json'))?.hosting;}catch {hosting=null;}
  for(const [id,nom,patro] of [['VB1','X-Content-Type-Options',/^nosniff$/i],['VB2','Referrer-Policy',/strict-origin/],['VB3','Permissions-Policy',/camera=/]]) {
    const ok=hosting?.headers?.some(r=>r.source==='**'&&r.headers?.some(h=>h.key.toLowerCase()===nom.toLowerCase()&&patro.test(h.value)));
    anota(id,'alta',!hosting?'no-mesurat':ok?'ok':'falla',hosting?['firebase.json']:[],'Capçaleres estàtiques; l’allotjament en viu encara no està mesurat.');
  }
  // Mateix llindar que la porta Tellado: max-age >= 31536000 (un any). includeSubDomains no s'exigix (decisió R26 de l'integrador).
  const hstsOk=hosting?.headers?.some(r=>r.source==='**'&&r.headers?.some(h=>h.key.toLowerCase()==='strict-transport-security'&&Number((/\bmax-age\s*=\s*(\d+)/i.exec(h.value)||[])[1]||0)>=31536000));
  anota('VIG-09','alta',!hosting?'no-mesurat':hstsOk?'ok':'falla',hosting?['firebase.json']:[],'Incloure Strict-Transport-Security (max-age>=31536000) junt amb nosniff, Referrer-Policy i Permissions-Policy.');
  // Dimensions reals del fitxer, quadrat >= 48x48 (guia de Google Search); cap múltiple de 48 ni confiança en `sizes`.
  const faviconsRaster=html===null?[]:faviconsRasterValids(root,{llegeix:lligBuffer})||[];
  anota('VIG-10','mitjana',html===null?'no-mesurat':faviconsRaster.length?'ok':'falla',html===null?[]:['index.html',...faviconsRaster.map(f=>`public${f.href}`)],'Declarar un favicon raster .png/.ico quadrat >= 48x48 real a index.html per a Google Search (no només .svg).');
  anota('VB9','baixa',html===null?'no-mesurat':/Content-Security-Policy/.test(html)?'ok':'falla',html===null?[]:['index.html'],'La CSP final de producció es valida sobre el build.');
  const maps=tots.filter(p=>/\.map$/.test(p));anota('VB10','baixa',maps.length?'falla':tots.some(p=>p.startsWith('dist/'))?'ok':'no-mesurat',maps,'Revisar mapes de fonts publicats.');
  const dies=[ara,new Date(ara.getTime()-86400000)].map(d=>`${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
  const higiene=dies.map(d=>`.immunitari/higiene/${d}.json`).filter(p=>llig(p)!==null);
  anota('VC2','baixa',higiene.length?'ok':'falla',higiene,'Comprovar que el cron ha deixat informe hui o ahir.');
  // R32.14: mostrar el catàleg sense amagar els destins runtime originals.
  const tellado = avaluaPerimetreTellado(root);
  const catalegDinamic = tellado.catalegDinamic;
  anota('VIG-11','mitjana',catalegDinamic.pendents?'falla':catalegDinamic.observades?'informa':tellado.fitxersEscanejats?'ok':'no-mesurat',
    catalegDinamic.revisions.map(r=>({fitxer:r.fitxer,id:r.id,linia:r.linia})),
    `${catalegDinamic.cobertes}/${catalegDinamic.observades} signatures runtime catalogades; ${catalegDinamic.pendents} pendents. ${tellado.totalDesconeguts} destins/signatures continuen desconeguts a la porta; una revisió de comportament no resol la URL ni autoritza l'eixida.`);
  if(enllacos.length) anota('VIG-SYMLINK','alta','no-mesurat',enllacos,'Els enllaços no es travessen; revisar-los en el paquet.');
  const recompte={ok:0,falla:0,'no-mesurat':0,informa:0,avisos:0,bloquejants:0};
  for(const c of comprovacions) {recompte[c.estat]++;if(c.estat==='falla') {if(c.avis) recompte.avisos++;else if(['critica','alta'].includes(c.severitat)) recompte.bloquejants++;}}
  const git=llegeixGit(root);
  return {esquema:'sdp.vigilant.v1',arrel:root,commit:git.commit,branca:git.branca,mode:'estatic',readOnly:true,origen:git.origen,...(git.motiu?{motiuGit:git.motiu}:{}),data:ara.toISOString(),comprovacions,recompte,catalegDinamic};
}
export const codiVigilant = informe => informe.recompte.bloquejants ? 1 : 0;
export function main(argv) {
  let arrel=process.cwd(),json=false;
  for(const arg of argv) {if(arg==='--json') json=true;else if(arg.startsWith('--arrel=')) arrel=arg.slice(8);else throw new TypeError('Ús: tractor-vigilant.mjs [--json] [--arrel=DIR]');}
  const informe=analitzaVigilant(arrel);
  if(json) process.stdout.write(JSON.stringify(informe,null,2)+'\n');
  else {for(const c of informe.comprovacions) console.log(`${c.id} ${c.estat.toUpperCase()} ${c.avis?'AVÍS ':''}${c.severitat} · ${c.evidencia.map(e=>e.fitxer).join(', ')}`);console.log(JSON.stringify(informe.recompte));}
  return codiVigilant(informe);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {process.exitCode=main(process.argv.slice(2));}catch {console.error('Vigilant: no s’ha pogut mesurar l’arrel o els arguments no són vàlids.');process.exitCode=2;}
}
