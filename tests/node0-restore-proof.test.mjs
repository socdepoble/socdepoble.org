import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {nomRestauracioValid,obriRegularRestauracio,hashCipherRestauracio,provaRestauracioAmbRuntime,verificaRestauracioNodeZero,validaLedgerOrigenRestauracio,SQL_RECOMPTE_RESTAURACIO} from '../tooling/node0/verifica-restauracio-node0.mjs';
import {creaPlaMigracions} from '../tooling/node0/hidrata-postgres-node0.mjs';
const sourceRows=creaPlaMigracions().migrations;
const ledgerOf=rows=>({migrations:rows.length,migrationLedgerSha256:createHash('sha256').update([...rows].sort((a,b)=>a.version<b.version?-1:a.version>b.version?1:0).map(m=>`${m.version}\t${m.file}\t${m.sha256}`).join('\n')).digest('hex')});
const nonce={suffix:'0123456789abcdef',token:'1'.repeat(32),expectedMigrationLedger:ledgerOf(sourceRows.slice(0,75))};
function fixture(patch={}){const events=[];let owned;return{events,runtime:{async versions(){events.push('version');},async create(name){assert.ok(nomRestauracioValid(name));events.push('create');},async mark(name,token){events.push('mark');owned={oid:'1234',owner:'javi',proof:token};return owned;},async restore(){events.push('restore');},async counts(database){events.push('counts');return{database,serverMajor:17,tables:68,...nonce.expectedMigrationLedger,publicDocuments:39,profiles:0,notes:0,appContent:22,extraSecret:'MUST_NOT_RETURN'};},async owned(){events.push('owned');return owned;},async drop(name){assert.ok(nomRestauracioValid(name));events.push('drop');},...patch}};}
test('only exact fresh random restore database names are accepted',()=>{assert.equal(nomRestauracioValid('node0_restore_0123456789abcdef'),true);for(const name of['socdepoble_node0','postgres','node0_restore_abc','node0_restore_'+'A'.repeat(16),'node0_restore_'+"';DROP DATABASE postgres;--"])assert.equal(nomRestauracioValid(name),false);});
test('dry plan has no file/database IO and no clean-machine success claim',async()=>{const result=await verificaRestauracioNodeZero({ciphertextPath:'/does-not-exist/fixture.dump.age',expectedSha256:'a'.repeat(64)});assert.equal(result.apply,false);assert.equal(result.cleanMachineRestoreVerified,false);});
test('caller cannot choose a target DB, connection, private identity or tool',async()=>{for(const key of['database','socket','identity','user','pgRestore','age'])await assert.rejects(verificaRestauracioNodeZero({ciphertextPath:'/fixture.dump.age',expectedSha256:'a'.repeat(64),[key]:'socdepoble_node0'}),/restore_options_invalid/);});
test('lifecycle creates, restores, counts and drops only a newly-owned DB',async()=>{const f=fixture(),r=await provaRestauracioAmbRuntime(f.runtime,nonce);assert.deepEqual(f.events,['version','create','mark','restore','counts','owned','drop']);assert.equal(r.nativeRestoreVerified,false);assert.equal(r.cleanMachineRestoreVerified,false);assert.equal(r.ownedDisposableDatabaseDropped,true);assert.equal(r.counts.tables,68);assert.equal(Object.hasOwn(r.counts,'extraSecret'),false);assert.equal(Object.hasOwn(r.counts,'database'),false);});
test('an existing-name creation failure is never restored or dropped',async()=>{const f=fixture({async create(){throw Error('exists');}});await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),error=>!error.newDisposableDatabaseCreated&&!error.ownedDisposableDatabaseDropped);assert.deepEqual(f.events,['version']);});
test('restore failure still cleans the proven owned DB and hides diagnostic values',async()=>{const f=fixture({async restore(){throw Error('fixture-private-input@example.invalid');}});await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),error=>error.message==='restore_failed'&&error.ownedDisposableDatabaseDropped);assert.ok(f.events.includes('drop'));});
test('unproven ownership never authorizes cleanup',async()=>{const f=fixture({async mark(){return{oid:'1234',owner:'other',proof:nonce.token};}});await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),/ownership_unproven_cleanup_refused/);assert.equal(f.events.includes('drop'),false);});
test('OID replacement before cleanup is refused',async()=>{const f=fixture({async owned(){return{oid:'9999',owner:'javi',proof:nonce.token};}});await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),/cleanup_refused/);assert.equal(f.events.includes('drop'),false);});
test('invalid count protocol fails but still drops the owned DB',async()=>{const f=fixture({async counts(){return{database:'socdepoble_node0'};}});await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),error=>error.message==='restore_counts_invalid'&&error.ownedDisposableDatabaseDropped);});
test('cipher hash and age header are checked without consuming stdin position',t=>{const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-restore-file-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'fixture.dump.age'),bytes=Buffer.from('age-encryption.org/v1\nsynthetic ciphertext');fs.writeFileSync(file,bytes,{mode:0o600});const h=obriRegularRestauracio(file,{mode:0o600});try{assert.equal(hashCipherRestauracio(h,createHash('sha256').update(bytes).digest('hex')),true);assert.throws(()=>hashCipherRestauracio(h,'0'.repeat(64)),/pin_mismatch/);const b=Buffer.alloc(3);fs.readSync(h.fd,b,0,3,null);assert.equal(b.toString(),'age');}finally{fs.closeSync(h.fd);}});
test('private identity metadata rejects symlinks, hardlinks and wrong modes',t=>{const dir=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'sdp-restore-identity-')));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'identity');fs.writeFileSync(file,'synthetic-non-key-fixture'.repeat(4),{mode:0o600});fs.linkSync(file,path.join(dir,'hard'));assert.throws(()=>obriRegularRestauracio(file,{mode:0o600}),/file_unsafe/);fs.unlinkSync(path.join(dir,'hard'));fs.symlinkSync(file,path.join(dir,'link'));assert.throws(()=>obriRegularRestauracio(path.join(dir,'link'),{mode:0o600}));fs.chmodSync(file,0o644);assert.throws(()=>obriRegularRestauracio(file,{mode:0o600}),/file_unsafe/);});
test('unsafe suffix or ownership token is refused before any runtime call',async()=>{const f=fixture();for(const value of[{suffix:'socdepoble_node0',token:nonce.token},{suffix:nonce.suffix,token:"'; SQL"}])await assert.rejects(provaRestauracioAmbRuntime(f.runtime,value),/database_name_invalid/);assert.deepEqual(f.events,[]);});

test('R11 · dumps de75/76 migracions requerixen el seu ledger origen exacte; el recompte sol no basta',async()=>{
 for(const count of[75,76]){
  const expectedMigrationLedger=ledgerOf(sourceRows.slice(0,count));
  const f=fixture({async counts(database){return{database,serverMajor:17,tables:68,...expectedMigrationLedger,publicDocuments:39,profiles:0,notes:0,appContent:22};}});
  assert.equal((await provaRestauracioAmbRuntime(f.runtime,{...nonce,expectedMigrationLedger})).counts.migrations,count);
 }
 for(const migrations of[74,77]){
  const f=fixture({async counts(database){return{database,serverMajor:17,tables:68,...nonce.expectedMigrationLedger,migrations,publicDocuments:39,profiles:0,notes:0,appContent:22};}});
  await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),error=>error.message==='restore_migration_ledger_mismatch'&&error.ownedDisposableDatabaseDropped);
 }
});

test('R11 · restaura el ledger vigent exacte encara que supere76 migracions',async()=>{
 const rows=sourceRows;
 assert.ok(rows.length>76);
 const migrationLedgerSha256=createHash('sha256').update([...rows].sort((a,b)=>a.version<b.version?-1:a.version>b.version?1:0).map(m=>`${m.version}\t${m.file}\t${m.sha256}`).join('\n')).digest('hex');
 const expectedMigrationLedger={migrations:rows.length,migrationLedgerSha256};
 const f=fixture({async counts(database){return{database,serverMajor:17,tables:68,...expectedMigrationLedger,publicDocuments:39,profiles:0,notes:0,appContent:22};}});
 const result=await provaRestauracioAmbRuntime(f.runtime,{...nonce,expectedMigrationLedger});
 assert.equal(result.counts.migrations,rows.length);
 assert.equal(result.counts.migrationLedgerSha256,migrationLedgerSha256);
 assert.equal(result.migrationLedgerMatched,true);assert.equal(result.sourceMigrationLedgerCaptureVerified,false);
 assert.equal(result.ownedDisposableDatabaseDropped,true);
});

test('R11 · mateix recompte amb migració alterada, absent o canviada no acredita restauració',async()=>{
 const originals=sourceRows.slice(0,75);
 for(const change of[{sha256:'0'.repeat(64)},{file:'9999999999_unknown.sql'},{version:'9999999999'}]){
  const altered=originals.map((row,i)=>i===0?{...row,...change}:row);
  const observed=ledgerOf(altered);
  const f=fixture({async counts(database){return{database,serverMajor:17,tables:68,...observed,publicDocuments:39,profiles:0,notes:0,appContent:22};}});
  await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),error=>error.message==='restore_migration_ledger_mismatch'&&error.ownedDisposableDatabaseDropped);
 }
 const f=fixture({async counts(database){return{database,serverMajor:17,tables:68,migrations:75,publicDocuments:39,profiles:0,notes:0,appContent:22};}});
 await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),/restore_migration_ledger_mismatch/);
});

test('R11 · ledger origen obligatori i validat abans de crear cap base',async()=>{
 for(const expectedMigrationLedger of[undefined,null,[],{},Object.create(null),{migrations:75},{migrations:75,migrationLedgerSha256:'A'.repeat(64)},{migrations:0,migrationLedgerSha256:'a'.repeat(64)},{migrations:75.1,migrationLedgerSha256:'a'.repeat(64)},{migrations:75,migrationLedgerSha256:'a'.repeat(64),extra:1}]){
  const f=fixture();
  await assert.rejects(provaRestauracioAmbRuntime(f.runtime,{...nonce,expectedMigrationLedger}),/restore_source_ledger_(required|invalid)/);
  assert.deepEqual(f.events,[]);
 }
 await assert.rejects(verificaRestauracioNodeZero({ciphertextPath:'/TEST_ONLY/never-read.dump.age',expectedSha256:'a'.repeat(64),apply:true,identityStdin:true}),/restore_source_ledger_required/);
});

test('R11 · el ledger de confiança es captura abans de qualsevol await',async()=>{
 const expectedMigrationLedger={...nonce.expectedMigrationLedger},observed={...expectedMigrationLedger};
 const f=fixture({async versions(){expectedMigrationLedger.migrations=76;expectedMigrationLedger.migrationLedgerSha256='0'.repeat(64);},async counts(database){return{database,serverMajor:17,tables:68,...observed,publicDocuments:39,profiles:0,notes:0,appContent:22};}});
 const result=await provaRestauracioAmbRuntime(f.runtime,{...nonce,expectedMigrationLedger});
 assert.equal(result.counts.migrations,observed.migrations);
 assert.equal(result.counts.migrationLedgerSha256,observed.migrationLedgerSha256);
 assert.equal(result.nativeRestoreVerified,false);
 assert.equal(Object.isFrozen(validaLedgerOrigenRestauracio(observed)),true);
});

test('R11 · counts invàlids continuen fallant tancats i netegen només la base pròpia',async()=>{
 for(const patch of[{tables:0},{tables:NaN},{serverMajor:16},{profiles:-1},{notes:1.5},{migrations:Infinity}]){
  const f=fixture({async counts(database){return{database,serverMajor:17,tables:68,...nonce.expectedMigrationLedger,publicDocuments:39,profiles:0,notes:0,appContent:22,...patch};}});
  await assert.rejects(provaRestauracioAmbRuntime(f.runtime,nonce),error=>error.message==='restore_counts_invalid'&&error.ownedDisposableDatabaseDropped);
 }
});

test('R11 · CLI exigix compte i hash origen junts sense llegir fitxers en pla sec',()=>{
 const binary=fileURLToPath(new URL('../tooling/node0/verifica-restauracio-node0.mjs',import.meta.url));
 const base=['--ciphertext','/TEST_ONLY/never-read.dump.age','--sha256','a'.repeat(64)];
 const run=args=>spawnSync(process.execPath,[binary,...base,...args],{encoding:'utf8',env:{PATH:'/usr/bin:/bin'}});
 const both=['--migrations-count','81','--migration-ledger-sha256','b'.repeat(64)];
 const plan=run(both);assert.equal(plan.status,0);assert.equal(plan.stderr,'');assert.equal(JSON.parse(plan.stdout).sourceMigrationLedgerRequired,true);
 for(const args of[['--migrations-count','81'],['--migration-ledger-sha256','b'.repeat(64)],['--migrations-count','8.1','--migration-ledger-sha256','b'.repeat(64)],['--migrations-count','81','--migrations-count','81'],['--apply','--identity-stdin']]){
  const rejected=run(args);assert.equal(rejected.status,1);assert.equal(rejected.stdout,'');assert.match(JSON.parse(rejected.stderr).error,/^restore_(source_ledger_(required|invalid)|arguments_invalid)$/);assert.equal(rejected.stderr.includes('/TEST_ONLY'),false);
 }
});

test('R11 · el SQL de recompte usa sha256 del nucli i no depén de pgcrypto ni del seu esquema',()=>{
 assert.match(SQL_RECOMPTE_RESTAURACIO,/encode\(pg_catalog\.sha256\(convert_to\(coalesce\(string_agg\(/);
 assert.doesNotMatch(SQL_RECOMPTE_RESTAURACIO,/\bdigest\(/);
});

test('R11 · SQL real de recompte calcula el hash exacte del ledger, independent de l’ordre d’inserció i de pgcrypto',{skip:!process.env.SDP_PGLITE_MODULE&&'Set SDP_PGLITE_MODULE for actual PostgreSQL SQL proof'},async()=>{
 const moduleURL=pathToFileURL(process.env.SDP_PGLITE_MODULE);
 const {PGlite}=await import(moduleURL.href),{pgcrypto}=await import(new URL('./contrib/pgcrypto.js',moduleURL));
 for(const extension of['','CREATE EXTENSION pgcrypto;','CREATE SCHEMA extensions;CREATE EXTENSION pgcrypto WITH SCHEMA extensions;']){
  const db=new PGlite({extensions:{pgcrypto}});
  try{
   await db.exec(extension+'CREATE SCHEMA node0;CREATE TABLE node0.schema_migrations(version text,file text,sha256 text);CREATE TABLE node0.public_documents(x int);CREATE TABLE public.profiles(x int);CREATE TABLE public.notes(x int);CREATE TABLE public.app_content(x int);');
   assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_extension WHERE extname='pgcrypto'")).rows[0].n,extension?1:0);
   for(const row of [...sourceRows].reverse())await db.query('INSERT INTO node0.schema_migrations VALUES($1,$2,$3)',[row.version,row.file,row.sha256]);
   const counts=(await db.query(SQL_RECOMPTE_RESTAURACIO)).rows[0].json_build_object;
   assert.equal(counts.migrations,sourceRows.length);assert.equal(counts.migrationLedgerSha256,ledgerOf(sourceRows).migrationLedgerSha256);
   await db.query('UPDATE node0.schema_migrations SET sha256=$1 WHERE version=$2',['0'.repeat(64),sourceRows[0].version]);
   const altered=(await db.query(SQL_RECOMPTE_RESTAURACIO)).rows[0].json_build_object;
   assert.equal(altered.migrations,counts.migrations);assert.notEqual(altered.migrationLedgerSha256,counts.migrationLedgerSha256);
  }finally{await db.close();}
 }
});

test('R11 · bundle públic aplica el mateix ledger exacte i mai certifica un doble de runtime',async()=>{
 const bundle=await import('../tooling/node0/receptes-mirall/restaura-node0-bundle.mjs');
 assert.equal(bundle.SQL_RECOMPTE_RESTAURACIO,SQL_RECOMPTE_RESTAURACIO);
 const expectedMigrationLedger=ledgerOf(sourceRows);
 const counts=database=>({database,serverMajor:17,tables:68,...expectedMigrationLedger,publicDocuments:39,profiles:0,notes:0,appContent:22});
 const f=fixture({async counts(database){return counts(database);}});
 const result=await bundle.provaRestauracioAmbRuntime(f.runtime,{...nonce,expectedMigrationLedger});
 assert.equal(result.nativeRestoreVerified,false);assert.equal(result.migrationLedgerMatched,true);assert.equal(result.sourceMigrationLedgerCaptureVerified,false);assert.equal(result.ownedDisposableDatabaseDropped,true);
 const altered=fixture({async counts(database){return{...counts(database),migrationLedgerSha256:'0'.repeat(64)};}});
 await assert.rejects(bundle.provaRestauracioAmbRuntime(altered.runtime,{...nonce,expectedMigrationLedger}),error=>error.message==='restore_migration_ledger_mismatch'&&error.ownedDisposableDatabaseDropped);
 const manifest=JSON.parse(fs.readFileSync(new URL('../tooling/node0/receptes-mirall/manifest-bundle-restauracio.json',import.meta.url),'utf8'));
 for(const input of manifest.inputs)assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../'+input.path,import.meta.url))).digest('hex'),input.sha256);
 assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../tooling/node0/receptes-mirall/restaura-node0-bundle.mjs',import.meta.url))).digest('hex'),manifest.output.sha256);
});
