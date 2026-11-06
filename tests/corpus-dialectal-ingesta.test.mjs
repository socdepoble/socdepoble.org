import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extreuCandidats,generaSqlCorpus,ingestaTresor} from '../tooling/cultura/ingesta_tresor_meridional.mjs';
import fs,{mkdtempSync,writeFileSync,readFileSync,readdirSync,existsSync,statSync,symlinkSync,rmSync} from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const fontSha256='a'.repeat(64);
test('proveniència exacta i localitat literal sense geografia inferida',()=>{
 const text='  cadolla° [clot] (Marina Baixa) (28)\n  covolla (Beneixama) (33)\f\n godolla (Agullent) (35)\f';
 const a=extreuCandidats(text,{fontSha256,paginaInicial:7});
 assert.equal(a.fragments.length,2);assert.equal(a.candidats.length,3);
 assert.equal(a.candidats[0].lema,'cadolla');assert.equal(a.candidats[2].pagina,8);
 assert.deepEqual(a.candidats[0].localitats_literals,['Marina Baixa']);
 assert.equal(a.candidats[0].geografia_confirmada,false);assert.deepEqual(a.candidats[0].skos,[]);
 assert.deepEqual(a,extreuCandidats(text,{fontSha256,paginaInicial:7}));
});
test('linies ambigües no esdevenen dades validades',()=>{
 const r=extreuCandidats('Introducció sense localitat\n terra [téra] (Alcoi) (2)',{fontSha256});
 assert.equal(r.candidats.length,1);assert.equal(r.candidats[0].estat,'candidat');
 assert.deepEqual(r.candidats[0].transcripcions_candidates,['téra']);
});
test('SQL escapa dades, transacció i idempotència',()=>{
 const r=extreuCandidats("  l'aigua (L'Alacantí) (2)",{fontSha256});
 const sql=generaSqlCorpus({font:{sha256:fontSha256,nom:"Font d'ara"},...r});
 assert.match(sql,/Font d''ara/);assert.match(sql,/l''aigua/);assert.match(sql,/ON CONFLICT\(id\) DO UPDATE/);assert.ok(sql.startsWith('BEGIN;'));assert.ok(sql.endsWith('COMMIT;\n'));
 assert.throws(()=>generaSqlCorpus({font:{sha256:'b'.repeat(64),nom:'X'},...r}),/divergent/);
});
test('R15 traçabilitat: rebutja hash fals, línia inventada, semàntica alterada i duplicats',()=>{
 const r=extreuCandidats('cadolla (Alcoi) (2)',{fontSha256});
 const corpus={font:{sha256:fontSha256,nom:'Exemple'},...r};
 for(const canvi of [{id:'b'.repeat(64)},{linia:2},{text_original:'altra entrada'},{lema:'altra'},{skos:['validat']},{verificat:true}]){
  assert.throws(()=>generaSqlCorpus({...corpus,candidats:[{...r.candidats[0],...canvi}]}),/Candidat invàlid/);
 }
 assert.throws(()=>generaSqlCorpus({...corpus,candidats:[...r.candidats,...r.candidats]}),/Candidat invàlid/);
 assert.throws(()=>generaSqlCorpus({...corpus,fragments:[...r.fragments,...r.fragments]}),/Pàgina duplicada/);
});

test('R15 carpeta completa privada, manifest verificable i eixida existent intacta',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sdp-r15-ingesta-'));
 try{
  const pdf=join(dir,'mostra.pdf'),extractor=join(dir,'extractor.mjs'),out=join(dir,'resultat');
  writeFileSync(pdf,'%PDF-1.7\nexemple sintètic');
  writeFileSync(extractor,'#!/usr/bin/env node\nprocess.stdout.write("cadolla (Alcoi) (2)\\f");\n',{mode:0o700});
  const manifest=ingestaTresor({pdf,out,pdftotext:extractor});
  assert.equal(manifest.candidats,1);assert.equal(statSync(out).mode&0o777,0o700);
  for(const f of manifest.fitxers){assert.equal(statSync(join(out,f.cami)).mode&0o777,0o600);assert.equal(createHash('sha256').update(readFileSync(join(out,f.cami))).digest('hex'),f.sha256);}
  const abans=readFileSync(join(out,'manifest.json'));
  assert.throws(()=>ingestaTresor({pdf,out,pdftotext:extractor}),/nova/);
  assert.deepEqual(readFileSync(join(out,'manifest.json')),abans);
  const dest=join(dir,'alias');symlinkSync(out,dest);
  assert.throws(()=>ingestaTresor({pdf,out:dest,pdftotext:extractor}),/nova/);
  const fals=join(dir,'fals.pdf');symlinkSync(pdf,fals);
  assert.throws(()=>ingestaTresor({pdf:fals,out:join(dir,'altre'),pdftotext:extractor}),/PDF invàlid/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('R15 fallada posterior a extracció no deixa corpus parcial ni staging',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sdp-r15-atomic-'));
 try{
  const pdf=join(dir,'mostra.pdf'),extractor=join(dir,'extractor.mjs'),out=join(dir,'resultat');
  writeFileSync(pdf,'%PDF-1.7\nexemple sintètic');
  // L'extractor ocupa el destí després del preflight. La reserva exclusiva
  // ha de fallar sense substituir ni tocar el directori de l'altre procés.
  writeFileSync(extractor,`#!/usr/bin/env node\nimport{mkdirSync,writeFileSync}from'node:fs';mkdirSync(${JSON.stringify(out)});writeFileSync(${JSON.stringify(join(out,'aliena'))},'conservar');process.stdout.write('cadolla (Alcoi) (2)\\f');`,{mode:0o700});
  assert.throws(()=>ingestaTresor({pdf,out,pdftotext:extractor}),/exist/i);
  assert.equal(readFileSync(join(out,'aliena'),'utf8'),'conservar');
  assert.equal(existsSync(join(out,'font.json')),false);
  assert.ok(!readdirSync(dir).some(n=>n.startsWith('.sdp-ingesta-')));
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('R15 error EIO en el tercer fitxer desfà staging i reserva completa',()=>{
 const dir=mkdtempSync(join(tmpdir(),'sdp-r15-eio-'));
 const original=fs.writeFileSync;
 try{
  const pdf=join(dir,'mostra.pdf'),extractor=join(dir,'extractor.mjs'),out=join(dir,'resultat');
  original(pdf,'%PDF-1.7\nexemple sintètic');
  original(extractor,'#!/usr/bin/env node\nprocess.stdout.write("cadolla (Alcoi) (2)\\f");\n',{mode:0o700});
  let escrits=0;
  fs.writeFileSync=(path,...args)=>{if(String(path).includes('.sdp-ingesta-')){escrits++;if(escrits===3)throw Object.assign(new Error('EIO sintètic'),{code:'EIO'});}return original(path,...args);};
  syncBuiltinESMExports();
  assert.throws(()=>ingestaTresor({pdf,out,pdftotext:extractor}),/EIO/);
  assert.equal(escrits,3);assert.equal(existsSync(out),false);
  assert.ok(!readdirSync(dir).some(n=>n.startsWith('.sdp-ingesta-')));
 }finally{fs.writeFileSync=original;syncBuiltinESMExports();rmSync(dir,{recursive:true,force:true});}
});

const pglitePath=process.env.SDP_PGLITE_MODULE;
test('R15 PostgreSQL: import 2x, RLS, procedència, revisor, divergència i rollback',{skip:!pglitePath?'Cal SDP_PGLITE_MODULE explícit':false},async()=>{
 const {PGlite}=await import(pglitePath.startsWith('file:')?pglitePath:pathToFileURL(pglitePath).href);
 const db=new PGlite();
 try{
  const schema=readFileSync(new URL('../tooling/cultura/corpus_dialectal_valencia.sql',import.meta.url),'utf8');
  await db.exec(schema);await db.exec(schema);
  const r=extreuCandidats("cadolla (Alcoi) (2)\n l'aigua (L'Alacantí) (3)",{fontSha256});
  const corpus={font:{sha256:fontSha256,nom:'Exemple'},...r};
  const sql=generaSqlCorpus(corpus);await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.corpus_dialectal_valencia')).rows[0].n,2);
  await db.exec('CREATE ROLE corpus_lector; GRANT USAGE ON SCHEMA node0 TO corpus_lector; GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA node0 TO corpus_lector; SET ROLE corpus_lector;');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.corpus_dialectal_valencia')).rows[0].n,0);
  await assert.rejects(db.query("INSERT INTO node0.corpus_dialectal_fonts VALUES ($1,'intrús','{}')",['b'.repeat(64)]),/row-level security/);
  await db.exec('RESET ROLE;');
  await assert.rejects(db.query("UPDATE node0.corpus_dialectal_valencia SET estat='revisat',revisor='  '"),/corpus_revisor_no_buit/);
  await assert.rejects(db.query("UPDATE node0.corpus_dialectal_valencia SET dades=jsonb_set(dades,'{pagina}','99')"),/corpus_dades_procedencia/);
  await assert.rejects(db.query("UPDATE node0.corpus_dialectal_valencia SET dades=dades-'id'"),/corpus_dades_procedencia/);
  await db.query("UPDATE node0.corpus_dialectal_valencia SET estat='revisat',revisor='Revisor local'");
  await db.exec(sql);
  assert.equal((await db.query("SELECT count(*)::int AS n FROM node0.corpus_dialectal_valencia WHERE estat='revisat'")).rows[0].n,2);
  const divergent={font:corpus.font,...extreuCandidats('text divergent (Alcoi) (2)',{fontSha256})};
  await assert.rejects(db.exec(generaSqlCorpus(divergent)),/null value/);await db.exec('ROLLBACK;');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.corpus_dialectal_valencia')).rows[0].n,2);
  // Una font nova dins un lot avortat tampoc queda com a satèl·lit.
  const altraFont='c'.repeat(64);
  const altreCorpus={font:{sha256:altraFont,nom:'Altra font'},...extreuCandidats('terra (Alcoi) (2)',{fontSha256:altraFont})};
  const alterat=generaSqlCorpus(altreCorpus).replace('COMMIT;','SELECT 1/0; COMMIT;');
  await assert.rejects(db.exec(alterat),/division by zero/);await db.exec('ROLLBACK;');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM node0.corpus_dialectal_fonts')).rows[0].n,1);
 }finally{await db.close();}
});
test('rebutja procedència absent i límits',()=>{
 assert.throws(()=>extreuCandidats('text',{fontSha256:'bad'}));
 assert.throws(()=>extreuCandidats('text',{fontSha256,paginaInicial:0}));
 assert.throws(()=>extreuCandidats('\0',{fontSha256}));
});
