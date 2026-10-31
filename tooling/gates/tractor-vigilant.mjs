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
export const readOnly = true;
const SENSIBLE = /(?:^|\/)(?:\.env[^/]*|\.git[^/]*|debug\.log|error_log|phpinfo\.php|wp-config[^/]*\.php)$|\.(?:sql(?:\.gz)?|bak|old|orig|swp)$/i;
const EXECUTABLE = /\.(php[0-9]?|phtml|phar|sh|py|pl|cgi)$/i;
const NOU = new Set(['VIG-01','VIG-02','VIG-03','VIG-04','VIG-05','VIG-06','VB1','VB2','VB3','VB9','VB10','VC2']);
const ORIGEN = 'Vigilant Tellado: perímetre estàtic adaptat a Sóc de Poble';
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
export function analitzaVigilant(arrel, { ara = new Date() } = {}) {
  const root=fs.realpathSync(arrel);if(!fs.statSync(root).isDirectory()) throw new TypeError('Arrel invàlida.');
  const comprovacions=[],enllacos=[];
  const anota=(id,severitat,estat,files=[],proposta='')=>comprovacions.push({id,capa:id.startsWith('VA')?'A':id.startsWith('VC')?'C':'B',origen_tellado:ORIGEN,estat,severitat,avis:NOU.has(id),evidencia:files.map(fitxer=>({fitxer})),proposta});
  const llig=rel=>{ const parts=rel.split('/');let cursor=root;
    for(const part of parts) {cursor=path.join(cursor,part);if(!fs.existsSync(cursor)||fs.lstatSync(cursor).isSymbolicLink()) return null;}
    if(!fs.statSync(cursor).isFile() || fs.statSync(cursor).size>8*1024*1024) return null;
    return fs.readFileSync(cursor,'utf8'); };
  const exposats=['public','dist','dist-natiu','wordpress-plugin/dist','wordpress-plugin/builds/directori'];
  const presents=exposats.map(p=>fitxers(root,p,enllacos)).filter(Boolean), tots=presents.flat();
  for(const [id,filtra] of [['VIG-01',p=>SENSIBLE.test(p)],['VIG-02',p=>(p.startsWith('public/assets/')||p.startsWith('wordpress-plugin/dist/')||p.startsWith('wordpress-plugin/builds/directori/dist/'))&&EXECUTABLE.test(p)]]) {
    const males=tots.filter(filtra);anota(id,'critica',males.length?'falla':presents.length?'ok':'no-mesurat',males,'Retirar la superfície del paquet en el carril autoritzat.');
  }
  const php=(fitxers(root,'wordpress-plugin',enllacos)||[]).filter(p=>p.endsWith('.php'));
  const perillos=php.filter(p=>{const s=llig(p)||'';return /eval\s*\(\s*(?:base64_decode|gzinflate|str_rot13|gzuncompress)|assert\s*\(\s*\$_(?:POST|GET|REQUEST)|preg_replace\s*\(\s*['"][^'"\n]{0,200}\/e['"]|\$(?:[a-f0-9]{16,})\b|\b(?:create_function|shell_exec|passthru|proc_open|system|popen)\s*\(/i.test(s);});
  anota('VIG-03','critica',perillos.length?'falla':php.length?'ok':'no-mesurat',perillos,'Revisar manualment el PHP assenyalat; cap codi s’executa.');
  // L’inventari no es certifica si la release no aporta el format conegut.
  const inventaris=tots.filter(p=>p.endsWith('/sdp-inventari.json'));
  let mesurats=0;const errors=[];
  for(const p of inventaris) {
    let inv;try {inv=JSON.parse(llig(p));}catch {errors.push(p);continue;}
    if(!Array.isArray(inv?.fitxers)) continue;
    mesurats++;
    const base=path.posix.dirname(p),noms=new Set();
    for(const f of inv.fitxers) {
      if(!f || typeof f.cami!=='string'||!/^[-a-zA-Z0-9_./]+$/.test(f.cami)||f.cami.split('/').some(t=>t==='..'||t==='.'||!t)||!/^([a-f0-9]{64})$/.test(f.sha256||'')) {errors.push(p);continue;}
      const rel=path.posix.join(base,f.cami);noms.add(rel);
      const bytes=llig(rel);if(bytes===null||createHash('sha256').update(fs.readFileSync(path.join(root,rel))).digest('hex')!==f.sha256) errors.push(rel);
    }
    errors.push(...tots.filter(f=>f.startsWith(base+'/')&&!noms.has(f)&&!['sdp-inventari.json','sdp-release.json'].includes(path.posix.basename(f))));
  }
  anota('VIG-04','alta',errors.length?'falla':mesurats?'ok':'no-mesurat',errors,'Validar també sdp-release amb la porta d’empaquetat; no substituïx la comprovació de release.');
  const src=(fitxers(root,'src',enllacos)||[]).filter(p=>/\.(jsx?|mjs)$/.test(p)&&!p.includes('.test.')&&!p.includes('/__fixtures__/')&&!p.startsWith('src/data/wiki'));
  const fonts=[...src,...php,'index.html','vercel.json','firebase.json'].filter(p=>llig(p)!==null);
  const mixt=fonts.filter(p=>[...(llig(p)||'').matchAll(/http:\/\/[^\s"'<>`]+/g)].some(m=>{try{return !['localhost','127.0.0.1','[::1]','www.w3.org','schema.org','webfinger.net','nodeinfo.diaspora.software','docs.oasis-open.org'].includes(new URL(m[0]).hostname);}catch{return true;}}));
  anota('VIG-05','mitjana',mixt.length?'falla':fonts.length?'ok':'no-mesurat',mixt,'Revisar URL no locals. Els espais de noms estàndard estan exempts.');
  const html=llig('index.html');const externs=[...php,...(html===null?[]:['index.html'])].filter(p=>/(?:src|href)\s*=\s*['"]https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|cdn\.jsdelivr\.net)/i.test(llig(p)||''));
  anota('VIG-06','alta',externs.length?'falla':html!==null?'ok':'no-mesurat',externs,'Comprovar declaració External services abans d’autoritzar el recurs.');
  const senseGuarda=php.filter(p=>!/(?:defined\s*\(\s*['"]ABSPATH['"]\s*\)|!\s*defined\s*\(\s*['"]ABSPATH['"]\s*\))/.test(llig(p)||''));
  anota('VA1','alta',senseGuarda.length?'falla':php.length?'ok':'no-mesurat',senseGuarda,'Afegir i provar la guarda d’accés directe.');
  const rest=php.filter(p=>/register_rest_route\s*\(/.test(llig(p)||''));
  const sensePermis=rest.filter(p=>!/permission_callback/.test(llig(p)||'')||/permission_callback['"]?\s*=>\s*['"]__return_true/.test(llig(p)||''));
  anota('VA2','alta',sensePermis.length?'falla':php.length?'ok':'no-mesurat',sensePermis,'Revisar cada ruta REST i el seu permís; comprovació lèxica, no prova semàntica.');
  const proxy=php.filter(p=>/HTTP_(?:X_FORWARDED_FOR|CF_CONNECTING_IP|X_REAL_IP)/.test(llig(p)||''));
  anota('VA3','alta',proxy.length?'falla':php.length?'ok':'no-mesurat',proxy,'Documentar i validar la llista de proxies de confiança.');
  let hosting;try {hosting=JSON.parse(llig('firebase.json'))?.hosting;}catch {hosting=null;}
  for(const [id,nom,patro] of [['VB1','X-Content-Type-Options',/^nosniff$/i],['VB2','Referrer-Policy',/strict-origin/],['VB3','Permissions-Policy',/camera=/]]) {
    const ok=hosting?.headers?.some(r=>r.source==='**'&&r.headers?.some(h=>h.key.toLowerCase()===nom.toLowerCase()&&patro.test(h.value)));
    anota(id,'alta',!hosting?'no-mesurat':ok?'ok':'falla',hosting?['firebase.json']:[],'Capçaleres estàtiques; l’allotjament en viu encara no està mesurat.');
  }
  anota('VB9','baixa',html===null?'no-mesurat':/Content-Security-Policy/.test(html)?'ok':'falla',html===null?[]:['index.html'],'La CSP final de producció es valida sobre el build.');
  const maps=tots.filter(p=>/\.map$/.test(p));anota('VB10','baixa',maps.length?'falla':tots.some(p=>p.startsWith('dist/'))?'ok':'no-mesurat',maps,'Revisar mapes de fonts publicats.');
  const dies=[ara,new Date(ara.getTime()-86400000)].map(d=>`${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
  const higiene=dies.map(d=>`.immunitari/higiene/${d}.json`).filter(p=>llig(p)!==null);
  anota('VC2','baixa',higiene.length?'ok':'falla',higiene,'Comprovar que el cron ha deixat informe hui o ahir.');
  if(enllacos.length) anota('VIG-SYMLINK','alta','no-mesurat',enllacos,'Els enllaços no es travessen; revisar-los en el paquet.');
  const recompte={ok:0,falla:0,'no-mesurat':0,informa:0,avisos:0,bloquejants:0};
  for(const c of comprovacions) {recompte[c.estat]++;if(c.estat==='falla') {if(c.avis) recompte.avisos++;else if(['critica','alta'].includes(c.severitat)) recompte.bloquejants++;}}
  return {esquema:'sdp.vigilant.v1',arrel:root,commit:null,mode:'estatic',readOnly:true,origen:null,data:ara.toISOString(),comprovacions,recompte};
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
