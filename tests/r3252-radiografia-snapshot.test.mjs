import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {LIMITS,parseStrictJson,readSnapshot,validateSnapshot,compareSnapshots,sha256} from '../tooling/gates/lib/radiografia-snapshot.mjs';
import {main} from '../tooling/gates/verifica-radiografia-supabase-viu.mjs';
import {snapshotCase,clone} from './fixtures/r3252-radiografia-casos.mjs';
const rejects=(fn,code)=>assert.throws(fn,error=>error.safeCode===code);
test('R32.52 · JSON duplicate escaped keys, grammar, bounded depth and forbidden prototype keys',()=>{
 const good=JSON.stringify(snapshotCase());assert.deepEqual(JSON.parse(JSON.stringify(parseStrictJson(good))),snapshotCase());
 for(const source of ['{"x":1,"x":2}','{"x":1,"\\u0078":2}','{"deep":{"a":1,"a":2}}'])rejects(()=>parseStrictJson(source),'snapshot_duplicate_key');
 for(const source of ['{}junk','[1,]','{"a":}', '"unterminated','"\\q"','01','NaN','{"a":1,}'])rejects(()=>parseStrictJson(source),'snapshot_json_invalid');
 rejects(()=>parseStrictJson('{"__proto__":{}}'),'snapshot_forbidden_key');rejects(()=>parseStrictJson('['.repeat(26)+'0'+']'.repeat(26)),'snapshot_depth_limit');rejects(()=>parseStrictJson('"'+'x'.repeat(LIMITS.string+1)+'"'),'snapshot_string_limit');rejects(()=>parseStrictJson('1e999'),'snapshot_number_invalid');
});
test('R32.52 · strict schema, duplicate identities, invalid types/enums and derived r1 consistency',()=>{
 const mutations=[s=>{s.extra='CANARY_PRIVATE'},s=>{delete s.r6_triggers_desactivats},s=>{s.r1_inventari_taules_mides_i_files[0].unknown=1},s=>{s.r1_inventari_taules_mides_i_files[0].rls_enabled='true'},s=>{s.r1_inventari_taules_mides_i_files[0].kind='x'},s=>{s.r1_inventari_taules_mides_i_files[0].total_bytes=-1},s=>{s.r8_integritat_dades_agregada.notes_total=Infinity},s=>{s.r3_total_security_definers=1.5}];
 for(const mutate of mutations){const s=snapshotCase();mutate(s);rejects(()=>validateSnapshot(s),'snapshot_schema_invalid');}
 let s=snapshotCase();s.r1_inventari_taules_mides_i_files.push(clone(s.r1_inventari_taules_mides_i_files[0]));rejects(()=>validateSnapshot(s),'snapshot_duplicate_identity');
 s=snapshotCase();s.r1_inventari_taules_mides_i_files[0].rls_enabled=false;rejects(()=>validateSnapshot(s),'snapshot_inconsistent');s.r1_taules_sense_rls_en_public=[clone(s.r1_inventari_taules_mides_i_files[0])];assert.equal(validateSnapshot(s),s);
});
test('R32.52 · exact structural fields, meaningful array order and volatile values separated',()=>{
 const a=snapshotCase(),b=clone(a);b.generated_at_utc='2026-11-23T01:00:00Z';b.postgres_version='Other engine';b.r1_inventari_taules_mides_i_files[0].total_bytes=999;b.r8_integritat_dades_agregada.notes_total=12;
 let diff=compareSnapshots(a,b);assert.equal(diff.structural_equal,true);assert.equal(diff.volatile.equal,false);
 b.r1_inventari_taules_mides_i_files[0].auth_select=false;diff=compareSnapshots(a,b);assert.equal(diff.structural_equal,false);assert.deepEqual(diff.differences[0].fields,['auth_select']);
 const fk={schema_name:'public',table_name:'child',constraint_name:'fk',fk_columns:['a','b'],referenced_table:'parent'};a.r5_fk_sense_index=[fk];b.r5_fk_sense_index=[{...fk,fk_columns:['b','a']}];assert.ok(compareSnapshots(a,b).differences.some(d=>d.fields?.includes('fk_columns')));
 const fn={schema_name:'public',function_name:'f',args:'p uuid',is_security_definer:true,volatility:'s',proconfig:['search_path=public','statement_timeout=1s'],missing_search_path:false,public_execute:false,anon_execute:true,auth_execute:true};a.r3_security_definers_amb_alerta=[fn];a.r3_total_security_definers=1;b.r3_security_definers_amb_alerta=[{...fn,proconfig:[...fn.proconfig].reverse()}];b.r3_total_security_definers=1;assert.ok(compareSnapshots(a,b).differences.some(d=>d.fields?.includes('proconfig')));
});
test('R32.52 · diff reports only known field names and hashes even if SQL contains private canary',()=>{
 const a=snapshotCase(),b=clone(a),privateValue='private-person@example.invalid';b.r5_fk_sense_index=[{schema_name:'public',table_name:privateValue,constraint_name:privateValue,fk_columns:['private_column'],referenced_table:'parent'}];const output=JSON.stringify(compareSnapshots(a,b));assert.ok(!output.includes(privateValue));assert.ok(output.includes('identity_sha256'));assert.ok(!output.includes('private_column'));
});
test('R32.52 · bounded regular files, no final/parent symlinks, FIFO, malformed UTF8 or oversized read',()=>{
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'sdp-r3252-json-'));try{
  const good=path.join(dir,'good.json');fs.writeFileSync(good,JSON.stringify(snapshotCase()));assert.equal(readSnapshot(good).sha256,sha256(fs.readFileSync(good)));
  fs.symlinkSync(good,path.join(dir,'link.json'));rejects(()=>readSnapshot(path.join(dir,'link.json')),'snapshot_symlink_rejected');fs.mkdirSync(path.join(dir,'nested'));fs.symlinkSync(path.join(dir,'nested'),path.join(dir,'parent'));fs.writeFileSync(path.join(dir,'nested','good.json'),JSON.stringify(snapshotCase()));rejects(()=>readSnapshot(path.join(dir,'parent','good.json')),'snapshot_symlink_rejected');rejects(()=>readSnapshot(dir),'snapshot_regular_file_required');
  const fifo=path.join(dir,'fifo');assert.equal(spawnSync('mkfifo',[fifo]).status,0);rejects(()=>readSnapshot(fifo),'snapshot_regular_file_required');
  fs.writeFileSync(path.join(dir,'utf8.json'),Buffer.from([0xff]));rejects(()=>readSnapshot(path.join(dir,'utf8.json')),'snapshot_utf8_invalid');const large=path.join(dir,'large.json');fs.writeFileSync(large,'');fs.truncateSync(large,LIMITS.bytes+1);rejects(()=>readSnapshot(large),'snapshot_size_limit');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('R32.52 · CLI exits 0/1/2, performs input validation before engine and never echoes raw errors',async()=>{
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'sdp-r3252-cli-')),snapshot=snapshotCase(),report={ok:true};let output;
 const deps={write:v=>{output=v;},audit:async()=>({snapshot,report:{...report}})};
 try{
  assert.equal(await main([],deps),0);assert.equal(output.production_observed,undefined);assert.equal(output.verdict,'LOCAL_AUDIT_ONLY_PRODUCTION_UNOBSERVED');
  const file=path.join(dir,'snapshot.json');fs.writeFileSync(file,JSON.stringify(snapshot));assert.equal(await main(['--snapshot',file],deps),0);assert.equal(output.verdict,'OBSERVED_PROJECTION_EQUAL');
  const changed=clone(snapshot);changed.r1_inventari_taules_mides_i_files[0].auth_delete=false;fs.writeFileSync(file,JSON.stringify(changed));assert.equal(await main(['--snapshot',file],deps),1);assert.equal(output.verdict,'OBSERVED_STRUCTURAL_DRIFT');
  fs.writeFileSync(file,'{"private-person@example.invalid":');assert.equal(await main(['--snapshot',file],{...deps,audit:()=>assert.fail('engine must not run')}),2);assert.ok(!JSON.stringify(output).includes('private-person'));
  assert.equal(await main([],{write:deps.write,audit:()=>{throw new Error('private-person@example.invalid SQL secret');}}),2);assert.equal(output.code,'local_execution_failed');assert.ok(!JSON.stringify(output).includes('private-person'));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('R32.52 · binary identity ordering preserves distinct composed/decomposed Unicode identifiers',()=>{
 const a=snapshotCase();const row=a.r1_inventari_taules_mides_i_files[0];a.r1_inventari_taules_mides_i_files=[{...row,object_name:'é'},{...row,object_name:'e\u0301'}];const b=clone(a);b.r1_inventari_taules_mides_i_files.reverse();const diff=compareSnapshots(a,b);assert.equal(diff.structural_equal,true);assert.equal(diff.repo_structural_sha256,diff.production_structural_sha256);assert.equal(diff.volatile.equal,true);
});

test('R32.52 · CLI relative and absolute /tmp alias both execute, never silent exit 0',()=>{
 const direct=spawnSync(process.execPath,['tooling/gates/verifica-radiografia-supabase-viu.mjs','--help'],{encoding:'utf8'});assert.equal(direct.status,0);assert.equal(JSON.parse(direct.stdout).offline,true);
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'sdp-r3252-entry-'));try{const alias=path.join(dir,'gate.mjs');fs.symlinkSync(path.resolve('tooling/gates/verifica-radiografia-supabase-viu.mjs'),alias);const run=spawnSync(process.execPath,[alias,'--help'],{encoding:'utf8'});assert.equal(run.status,0);assert.equal(JSON.parse(run.stdout).offline,true);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('R32.52 · bucket configuration drift is structural, object totals remain volatile',()=>{
 const a=snapshotCase();a.r7_storage_buckets_salut=[{bucket_id:'fixture',is_public:false,file_size_limit:100,allowed_mime_types:['image/png'],total_objects:0,total_metadata_bytes:0,orphan_ownerless_objects:1}];const b=clone(a);b.r7_storage_buckets_salut[0].total_objects=2;b.r7_storage_buckets_salut[0].orphan_ownerless_objects=0;assert.equal(compareSnapshots(a,b).structural_equal,true);assert.equal(compareSnapshots(a,b).volatile.equal,false);b.r7_storage_buckets_salut[0].is_public=true;assert.ok(compareSnapshots(a,b).differences.some(d=>d.radar==='r7_storage_buckets_salut'&&d.fields?.includes('is_public')));
});

test('R32.52 · numeric lexemes are safe canonical integers before conversion; no underflow or rounding equality',()=>{
 for(const [token,value]of [['0',0],['-0',-0],['-1',-1],['24',24],['9007199254740991',Number.MAX_SAFE_INTEGER],['-9007199254740991',Number.MIN_SAFE_INTEGER]])assert.equal(parseStrictJson(token),value);
 for(const token of ['1e-400','24.0000000000000001','24.0','1e3','1E+3','9007199254740992','-9007199254740992','9'.repeat(65536)])rejects(()=>parseStrictJson(token),'snapshot_number_invalid');
 for(const [token,value]of [['1e-400',0],['24.0000000000000001',24]]){const s=snapshotCase();s.r2_total_politiques_auditades=value;const raw=JSON.stringify(s).replace('"r2_total_politiques_auditades":'+value,'"r2_total_politiques_auditades":'+token);rejects(()=>validateSnapshot(parseStrictJson(raw)),'snapshot_number_invalid');}
});
