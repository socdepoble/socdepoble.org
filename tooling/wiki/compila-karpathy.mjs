#!/usr/bin/env node
/** Consumidor CLI privat del motor pur; no publica a la Wiki viva. */
import {readFileSync,writeFileSync,mkdirSync,lstatSync,existsSync,realpathSync,mkdtempSync,renameSync,rmSync,rmdirSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {compilaWikiKarpathy,LIMITS_COMPILADOR} from './lib/karpathyWikiCompiler.js';
export async function compilaFitxer({input,out}) {
 const font=path.resolve(input),requested=path.resolve(out);
 const desti=path.join(realpathSync(path.dirname(requested)),path.basename(requested));
 const stat=lstatSync(font);
 if(!stat.isFile()||stat.isSymbolicLink()||stat.size>LIMITS_COMPILADOR.bytesTotal)throw new TypeError('Font JSON invàlida');
 if(existsSync(desti))throw new TypeError('Cal carpeta nova amb pare real');
 const resultat=await compilaWikiKarpathy(JSON.parse(readFileSync(font,'utf8')));
 const fitxers=[...resultat.articles.map(a=>[a.cami,a.markdown]),...resultat.fonts.map(f=>[f.cami,f.json]),['index.md',resultat.index],['log.md',resultat.registre],['manifest.json',JSON.stringify(resultat.manifest,null,2)+'\n']];
 // Reserve el nom de manera exclusiva abans de preparar cap fitxer. El
 // pare canònic manté staging i destí al mateix filesystem, també amb /tmp
 // → /private/tmp en macOS. El destí només rep el paquet complet per rename.
 mkdirSync(desti,{mode:0o700});
 const reserva=lstatSync(desti);let staging;
 try{
  staging=mkdtempSync(path.join(path.dirname(desti),'.sdp-karpathy-'));
  for(const [cami,bytes] of fitxers){
   const file=path.join(staging,cami);mkdirSync(path.dirname(file),{recursive:true,mode:0o700});writeFileSync(file,bytes,{flag:'wx',mode:0o600});
  }
  const actual=lstatSync(desti);
  if(actual.ino!==reserva.ino||actual.dev!==reserva.dev||actual.isSymbolicLink())throw new Error('Reserva de paquet canviada');
  renameSync(staging,desti);staging=null;
 }catch(error){
  if(staging)rmSync(staging,{recursive:true,force:true});
  try{const actual=lstatSync(desti);if(actual.ino===reserva.ino&&actual.dev===reserva.dev)rmdirSync(desti);}catch{/* Contingut alié: es conserva. */}
  throw error;
 }
 return resultat.manifest;
}
export async function main(args=process.argv.slice(2)){
 if(args.length!==4||args[0]!=='--input'||args[2]!=='--out')throw new TypeError('Ús: --input CORPUS.json --out CARPETA_NOVA');
 const manifest=await compilaFitxer({input:args[1],out:args[3]});process.stdout.write(JSON.stringify(manifest,null,2)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{process.stderr.write(error.message+'\n');process.exitCode=1;});
