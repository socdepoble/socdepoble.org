#!/usr/bin/env node
/** IDEA-107: extractor local, traçable i idempotent. No publica ni toca BD. */
import {readFileSync,writeFileSync,mkdirSync,statSync,existsSync,lstatSync,realpathSync,mkdtempSync,renameSync,rmSync,rmdirSync} from 'node:fs';
import {resolve,join,dirname,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const SCHEMA_CORPUS='sdp.corpus-dialectal.v1';
const sha=value=>createHash('sha256').update(value).digest('hex');
const sqlString=value=>"'"+String(value).replace(/'/g,"''")+"'";
const limita=(text,max,nom)=>{if(typeof text!=='string'||text.length>max||text.includes('\0'))throw new TypeError(nom+' invàlid');return text;};

/** Les localitats són literals de la font, mai codis municipals inferits. */
export function extreuCandidats(text,{fontSha256,paginaInicial=1}={}) {
 if(!/^[a-f0-9]{64}$/.test(fontSha256)||!Number.isSafeInteger(paginaInicial)||paginaInicial<1)throw new TypeError('Procedència invàlida');
 limita(text,64*1024*1024,'Text');
 const fragments=[],candidats=[];
 const pages=text.split('\f');if(!pages.at(-1)?.trim())pages.pop();
 for(let i=0;i<pages.length;i++) {
  const pagina=i+paginaInicial,original=pages[i];
  if(!original.trim())continue;
  fragments.push({font_sha256:fontSha256,pagina,text_original:original,sha256:sha(original)});
  const linies=original.split(/\r?\n/);
  for(let j=0;j<linies.length;j++) {
   const linia=linies[j].trim();
   const matches=[...linia.matchAll(/\(([^()\d]{2,120})\)\s*\((\d{1,4})\)/gu)];
   if(!matches.length)continue;
   const prefix=linia.slice(0,matches[0].index).trim();
   const lema=prefix.split(/[[(*]/u)[0].replace(/[°:;,\s]+$/u,'').trim();
   if(!lema||lema.length>160||!/^\p{L}/u.test(lema)||/^Exemple\b/u.test(lema))continue;
   const localitats=[...new Set(matches.map(m=>m[1].trim()))].sort();
   const referencies=[...new Set(matches.map(m=>m[2]))].sort();
   const ipa=[...prefix.matchAll(/\[([^\]]{1,120})\]/gu)].map(m=>m[1]);
   candidats.push({id:sha([fontSha256,pagina,j+1,linia].join('\n')),font_sha256:fontSha256,pagina,linia:j+1,lema,variants:[],transcripcions_candidates:ipa,localitats_literals:localitats,referencies_font:referencies,skos:[],text_original:linia,estat:'candidat',geografia_confirmada:false});
  }
 }
 return {fragments,candidats,paginesTotals:pages.length};
}
export function generaSqlCorpus({font,fragments,candidats}) {
 if(!font||!/^[a-f0-9]{64}$/.test(font.sha256))throw new TypeError('Font invàlida');
 if(!Array.isArray(fragments)||!Array.isArray(candidats))throw new TypeError('Corpus invàlid');
 const files=[...fragments,...candidats];
 if(files.some(f=>f.font_sha256!==font.sha256))throw new TypeError('Font divergent');
 for(const f of fragments)if(!Number.isSafeInteger(f.pagina)||f.pagina<1||sha(limita(f.text_original,1024*1024,'Fragment'))!==f.sha256)throw new TypeError('Fragment invàlid');
 const esperats=new Map(),pagines=new Set(),vistos=new Set();
 for(const fragment of fragments){
  if(pagines.has(fragment.pagina))throw new TypeError('Pàgina duplicada');pagines.add(fragment.pagina);
  const extrets=extreuCandidats(fragment.text_original,{fontSha256:font.sha256,paginaInicial:fragment.pagina});
  if(extrets.paginesTotals!==1)throw new TypeError('Fragment amb més d’una pàgina');
  for(const candidat of extrets.candidats)esperats.set(candidat.id,candidat);
 }
 for(const c of candidats){
  const esperat=esperats.get(c.id);
  if(!esperat||vistos.has(c.id)||Object.keys(c).length!==Object.keys(esperat).length||Object.keys(esperat).some(k=>JSON.stringify(c[k])!==JSON.stringify(esperat[k])))throw new TypeError('Candidat invàlid: procedència o dades divergents');
  vistos.add(c.id);
 }
 const nom=limita(font.nom,500,'Nom');if(!nom.trim())throw new TypeError('Nom invàlid');
 const lines=['BEGIN;','SET LOCAL standard_conforming_strings = on;',`INSERT INTO node0.corpus_dialectal_fonts(sha256,nom,metadades) VALUES (${sqlString(font.sha256)},${sqlString(nom)},${sqlString(JSON.stringify(font))}::jsonb) ON CONFLICT(sha256) DO NOTHING;`];
 for(const fragment of fragments) lines.push(`INSERT INTO node0.corpus_dialectal_fragments(font_sha256,pagina,sha256,text_original) VALUES (${sqlString(fragment.font_sha256)},${fragment.pagina},${sqlString(fragment.sha256)},${sqlString(fragment.text_original)}) ON CONFLICT(font_sha256,pagina) DO UPDATE SET sha256=CASE WHEN corpus_dialectal_fragments.sha256=EXCLUDED.sha256 AND corpus_dialectal_fragments.text_original=EXCLUDED.text_original THEN corpus_dialectal_fragments.sha256 ELSE NULL END;`);
 for(const candidat of candidats) lines.push(`INSERT INTO node0.corpus_dialectal_valencia(id,font_sha256,pagina,linia,lema,dades,text_original) VALUES (${sqlString(candidat.id)},${sqlString(candidat.font_sha256)},${candidat.pagina},${candidat.linia},${sqlString(candidat.lema)},${sqlString(JSON.stringify(candidat))}::jsonb,${sqlString(candidat.text_original)}) ON CONFLICT(id) DO UPDATE SET dades=CASE WHEN corpus_dialectal_valencia.dades=EXCLUDED.dades AND corpus_dialectal_valencia.font_sha256=EXCLUDED.font_sha256 AND corpus_dialectal_valencia.pagina=EXCLUDED.pagina AND corpus_dialectal_valencia.linia=EXCLUDED.linia AND corpus_dialectal_valencia.lema=EXCLUDED.lema AND corpus_dialectal_valencia.text_original=EXCLUDED.text_original THEN corpus_dialectal_valencia.dades ELSE NULL END;`);
 return lines.concat('COMMIT;','').join('\n');
}
export function ingestaTresor({pdf,out,pdftotext='pdftotext',primera=1,ultima}={}) {
 const input=resolve(pdf),output=resolve(out);
 if(input===output||!input.toLowerCase().endsWith('.pdf')||!lstatSync(input).isFile()||statSync(input).size>256*1024*1024)throw new TypeError('PDF invàlid');
 if(existsSync(output))throw new TypeError('Cal una carpeta d’eixida nova');
 if(!Number.isSafeInteger(primera)||primera<1||ultima!==undefined&&(!Number.isSafeInteger(ultima)||ultima<primera))throw new TypeError('Rang invàlid');
 const bytes=readFileSync(input);if(bytes.subarray(0,5).toString()!=='%PDF-')throw new TypeError('Capçalera PDF invàlida');
 const args=['-layout','-enc','UTF-8','-f',String(primera),...(ultima===undefined?[]:['-l',String(ultima)]),input,'-'];
 const result=spawnSync(pdftotext,args,{encoding:'utf8',timeout:120000,maxBuffer:64*1024*1024});
 if(result.error||result.status!==0)throw new Error('Extracció PDF fallida: '+(result.error?.code??result.status));
 const font={sha256:sha(bytes),nom:input.split('/').at(-1),schema:SCHEMA_CORPUS,extractor:'poppler-pdftotext-layout',primera,ultima:ultima??null,distribucio:'privada',estat:'pendent-revisio'};
 const corpus={font,...extreuCandidats(result.stdout,{fontSha256:font.sha256,paginaInicial:primera})};
 const outputs={'font.json':JSON.stringify(font,null,2)+'\n','fragments.jsonl':corpus.fragments.map(f=>JSON.stringify(f)).join('\n')+'\n','candidats.jsonl':corpus.candidats.map(c=>JSON.stringify(c)).join('\n')+'\n','ingesta.sql':generaSqlCorpus(corpus)};
 const manifest={schema:SCHEMA_CORPUS,font_sha256:font.sha256,pagines_totals:corpus.paginesTotals,pagines_no_buides:corpus.fragments.length,candidats:corpus.candidats.length,entrades_revisades:0,geografies_confirmades:0,limit:'Heurística de candidats: no és un diccionari validat, no inferix SKOS ni municipis.',fitxers:[]};
 // Reserva exclusiva del nom i publicació de carpeta completa amb rename.
 // El staging és germà (mateix filesystem), privat i eliminable només per
 // esta invocació. Una fallada mai deixa font.json sense manifest vàlid.
 const requestedParent=dirname(output);
 if(existsSync(requestedParent)&&lstatSync(requestedParent).isSymbolicLink())throw new TypeError('Carpeta pare simbòlica');
 mkdirSync(requestedParent,{recursive:true,mode:0o700});
 const parent=realpathSync(requestedParent),dest=join(parent,basename(output));
 mkdirSync(dest,{mode:0o700});
 const reserva=lstatSync(dest);let staging;
 try{
  staging=mkdtempSync(join(parent,'.sdp-ingesta-'));
  for(const [nom,content] of Object.entries(outputs)){
   writeFileSync(join(staging,nom),content,{flag:'wx',mode:0o600});manifest.fitxers.push({cami:nom,sha256:sha(content)});
  }
  writeFileSync(join(staging,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  const actual=lstatSync(dest);if(actual.ino!==reserva.ino||actual.dev!==reserva.dev||actual.isSymbolicLink())throw new Error('Reserva d’eixida canviada');
  renameSync(staging,dest);staging=null;
 }catch(error){
  if(staging)rmSync(staging,{recursive:true,force:true});
  try{const actual=lstatSync(dest);if(actual.ino===reserva.ino&&actual.dev===reserva.dev)rmdirSync(dest);}catch{/* No esborrem contingut alié. */}
  throw error;
 }
 return manifest;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const args=process.argv.slice(2),options={};
  for(let i=0;i<args.length;i+=2){if(!['--pdf','--out','--pdftotext','--primera','--ultima'].includes(args[i])||!args[i+1])throw new Error('Ús: --pdf FONT.pdf --out CARPETA_NOVA [--pdftotext BINARI] [--primera N --ultima N]');options[args[i].slice(2)]=args[i+1];}
  if(!options.pdf||!options.out)throw new Error('Cal --pdf i --out');
  if(options.primera)options.primera=Number(options.primera);if(options.ultima)options.ultima=Number(options.ultima);
  console.log(JSON.stringify(ingestaTresor(options),null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
