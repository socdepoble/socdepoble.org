#!/usr/bin/env node
/** Inventari íntegre de dist. L’anchor és extern i obligatori en verificar.
 * No és una firma: només un digest rebut per un canal independent de confiança
 * pot acreditar l’origen. El manifest queda fora de dist per cobrir TOTS els bytes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const ESQUEMA_INVENTARI_ESTATIC = 'sdp.inventari-estatic.v1';
const SHA = /^[0-9a-f]{64}$/;
const MAX_MANIFEST = 32 * 1024 * 1024;
const MAX_ENTRADES = 100000;
const FITXERS_ARREL = new Set(['.htaccess','_headers','_redirects','apple-touch-icon.png','favicon.ico','favicon.svg','icona-app-192.png','icona-app-512.png','index.html','manifest.webmanifest','rag-index.json','robots.txt','sitemap.xml','slugIndex.json','sw.js']);
const DIRECTORIS_ARREL = new Set(['.well-known','__iaia','anima','ap','assets','auth','calendari','components','consola','constitucio','descarregues','disseny','events','fedivers','fediversity','federation','fonts','legal','mercat','multimedia','mur','nodeinfo','opendata','page','plugin','poblacio','pobles','projecte','roadmap','versions','wikidepoble']);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const ordre = (a,b) => a < b ? -1 : a > b ? 1 : 0;
const falla = text => { throw new Error(text); };
function camiNet(cami) {
 if(typeof cami!=='string'||!cami||cami.includes('\0'))falla('Cal un camí explícit.');
 const abs=path.resolve(cami).replace(/^\/(tmp|var)(?=\/|$)/,(_,nom)=>fs.realpathSync('/'+nom));
 let cursor=path.parse(abs).root;
 for(const segment of abs.slice(cursor.length).split(path.sep).filter(Boolean)){
  cursor=path.join(cursor,segment);try{if(fs.lstatSync(cursor).isSymbolicLink())falla('No es travessen enllaços simbòlics.');}catch(e){if(e.code!=='ENOENT')throw e;}
 }
 return abs;
}
function admet(cami,directori=false) {
 if(typeof cami!=='string'||!cami||cami.length>2048||cami.includes('\\'))return false;
 const parts=cami.split('/');if(parts.some(p=>!p||p==='.'||p==='..'))return false;
 if(parts.length===1)return directori?DIRECTORIS_ARREL.has(cami):FITXERS_ARREL.has(cami);
 if(!DIRECTORIS_ARREL.has(parts[0]))return false;
 if(parts[0]==='.well-known'){
  if(directori)return parts.length===2&&parts[1]==='webfinger';
  return parts.length===2&&['host-meta','nodeinfo','webfinger.nginx'].includes(parts[1])
   ||parts.length===3&&parts[1]==='webfinger'&&/^[a-z0-9][a-z0-9-]*\.json$/.test(parts[2]);
 }
 return parts.slice(1).every((p,i)=>/^[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(p)
  ||(!directori&&i===parts.length-2&&p==='.keep'&&parts[0]==='assets'));
}
const mateixa = (a,b) => ['dev','ino','size','mtimeNs','ctimeNs','mode'].every(k=>a[k]===b[k]);
function regular(abs) {
 const abans=fs.lstatSync(camiNet(abs),{bigint:true});if(!abans.isFile())falla('L’inventari només admet fitxers regulars.');
 if(abans.size>BigInt(Number.MAX_SAFE_INTEGER))falla('Mida del fitxer fora del límit segur.');
 const fd=fs.openSync(abs,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0));
 try{
  if(!mateixa(abans,fs.fstatSync(fd,{bigint:true})))falla('El fitxer ha canviat durant l’inventari.');
  const hash=createHash('sha256'),buffer=Buffer.allocUnsafe(64*1024);let bytes=0,n;
  while((n=fs.readSync(fd,buffer,0,buffer.length,null))>0){bytes+=n;hash.update(buffer.subarray(0,n));}
  if(bytes!==Number(abans.size)||!mateixa(abans,fs.fstatSync(fd,{bigint:true}))||!mateixa(abans,fs.lstatSync(camiNet(abs),{bigint:true})))falla('El fitxer ha canviat durant l’inventari.');
  return {bytes,sha256:hash.digest('hex')};
 }finally{fs.closeSync(fd);}
}
function exigixCategories(fitxers) {
 const noms=new Set(fitxers.map(f=>f.cami));
 for(const cami of ['index.html','manifest.webmanifest','.well-known/host-meta','.well-known/nodeinfo','nodeinfo/2.1.json','opendata/manifest.json'])if(!noms.has(cami))falla('Falta una categoria obligatòria: '+cami);
 for(const prefix of ['ap/actors/','.well-known/webfinger/','assets/','opendata/'])if(!fitxers.some(f=>f.cami.startsWith(prefix)&&f.cami!=='opendata/manifest.json'))falla('Falta una categoria obligatòria: '+prefix);
}
export function creaInventariEstatic(dist) {
 const root=camiNet(dist),fitxers=[],directoris=[],captures=[];
 if(!fs.lstatSync(root).isDirectory())falla('dist ha de ser un directori regular.');
 function visita(dir,prefix='') {
  const stat=fs.lstatSync(camiNet(dir),{bigint:true});if(!stat.isDirectory())falla('Directori no regular.');captures.push([dir,stat]);
  for(const entry of fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>ordre(a.name,b.name))){
   const rel=prefix?prefix+'/'+entry.name:entry.name,abs=path.join(dir,entry.name);
   if(entry.isSymbolicLink())falla('L’inventari rebutja enllaços simbòlics.');
   if(!admet(rel,entry.isDirectory()))falla('Camí fora de la llista admesa: '+rel);
   if(entry.isDirectory()){directoris.push(rel);visita(abs,rel);}
   else if(entry.isFile())fitxers.push({cami:rel,...regular(abs)});
   else falla('L’inventari rebutja entrades no regulars.');
   if(fitxers.length+directoris.length>MAX_ENTRADES)falla('Massa entrades en l’inventari.');
  }
 }
 visita(root);for(const [abs,stat] of captures)if(!mateixa(stat,fs.lstatSync(camiNet(abs),{bigint:true})))falla('L’arbre ha canviat durant l’inventari.');
 fitxers.sort((a,b)=>ordre(a.cami,b.cami));directoris.sort(ordre);exigixCategories(fitxers);
 return {esquema:ESQUEMA_INVENTARI_ESTATIC,directoris,fitxers};
}
const serialitza = inventari => Buffer.from(JSON.stringify(inventari)+'\n');
function camiManifest(dist,manifest) {
 const root=camiNet(dist),abs=camiNet(manifest),rel=path.relative(root,abs);
 if(rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))falla('El manifest ha de quedar fora de dist.');
 return abs;
}
export function escriuInventariEstatic({dist,manifest}) {
 const abs=camiManifest(dist,manifest),inventari=creaInventariEstatic(dist),bytes=serialitza(inventari);
 if(bytes.length>MAX_MANIFEST)falla('Manifest massa gran.');
 fs.writeFileSync(abs,bytes,{flag:'wx',mode:0o644});
 return {sha256Confiat:sha(bytes),fitxers:inventari.fitxers.length,bytes:inventari.fitxers.reduce((n,f)=>n+f.bytes,0)};
}
function forma(inventari) {
 const claus=(o,esperades)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===esperades.sort().join(',');
 if(!claus(inventari,['esquema','directoris','fitxers'])||inventari.esquema!==ESQUEMA_INVENTARI_ESTATIC||!Array.isArray(inventari.directoris)||!Array.isArray(inventari.fitxers)||inventari.directoris.length+inventari.fitxers.length>MAX_ENTRADES)falla('Forma d’inventari invàlida.');
 let anterior='';for(const cami of inventari.directoris){if(!admet(cami,true)||ordre(anterior,cami)>=0)falla('Directoris d’inventari invàlids.');anterior=cami;}
 anterior='';for(const f of inventari.fitxers){if(!claus(f,['cami','bytes','sha256'])||!admet(f.cami)||ordre(anterior,f.cami)>=0||!Number.isSafeInteger(f.bytes)||f.bytes<0||!SHA.test(f.sha256))falla('Fitxer d’inventari invàlid.');anterior=f.cami;}
}
export function verificaInventariEstatic({dist,manifest,sha256Confiat}) {
 if(typeof sha256Confiat!=='string'||!SHA.test(sha256Confiat))falla('Cal una empremta SHA256 externa de confiança.');
 const abs=camiManifest(dist,manifest),stat=fs.lstatSync(abs);if(!stat.isFile()||stat.size>MAX_MANIFEST)falla('Manifest no regular o massa gran.');
 const bytes=fs.readFileSync(abs);if(sha(bytes)!==sha256Confiat)falla('L’empremta del manifest no coincidix amb la de confiança.');
 const inventari=JSON.parse(bytes.toString('utf8'));forma(inventari);
 const actual=creaInventariEstatic(dist);
 if(!bytes.equals(serialitza(inventari))||!bytes.equals(serialitza(actual)))falla('L’inventari no coincidix: cobertura, bytes o empremtes alterats.');
 return {valid:true,sha256Confiat,fitxers:actual.fitxers.length,bytes:actual.fitxers.reduce((n,f)=>n+f.bytes,0)};
}
export function main(argv) {
 const [accio,...args]=argv,op={};if(!['crea','verifica'].includes(accio))falla('Cal crea o verifica.');
 for(let i=0;i<args.length;i+=2){const clau=args[i];if(!['--dist','--manifest','--sha256-confiat'].includes(clau)||!args[i+1]||Object.hasOwn(op,clau))falla('Opcions d’inventari invàlides.');op[clau]=args[i+1];}
 if(!op['--dist']||!op['--manifest']||(accio==='crea'&&op['--sha256-confiat']))falla('Cal --dist i --manifest; verifica exigix --sha256-confiat.');
 const input={dist:op['--dist'],manifest:op['--manifest'],sha256Confiat:op['--sha256-confiat']};
 if(accio==='crea')process.stdout.write(escriuInventariEstatic(input).sha256Confiat+'\n');
 else process.stdout.write(JSON.stringify(verificaInventariEstatic(input))+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{main(process.argv.slice(2));}catch(error){console.error('Inventari estàtic rebutjat: '+error.message);process.exitCode=1;}
}
