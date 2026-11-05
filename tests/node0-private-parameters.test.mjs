import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {inspect} from 'node:util';
import {pathToFileURL} from 'node:url';
import {preparaConsultaPrivadaNodeZero,POLITICA_LOG_PRIVAT_NODE0} from '../tooling/node0/consulta-privada-node0.mjs';
import {sqlText,sqlJson,creaPostgres} from '../tooling/node0/postgres-node0.mjs';
import {compilaOperacioNodeZero} from '../tooling/node0/backend-node0.mjs';
test('private read positions, revisions, page limits and boolean values are bound rather than SQL metadata',()=>{
  const id='11111111-1111-4111-8111-111111111111',tenant='ac3bec76-255b-5ca2-8886-28fcceab4267';
  const cases=[['marcaLlegit',{filId:id,llegitFinsSeq:879164031},'879164031'],['updateNote',{id,expectedRevision:731641,updates:{title:'new'}},'731641'],['loadSeccioPage',{sectionId:'mur',limit:37},'37'],['createNote',{input:{id,title:'private',isPublished:true}},'true']];
  for(const[action,body,canary]of cases){
    const compiled=preparaConsultaPrivadaNodeZero(compilaOperacioNodeZero(action,body,tenant));
    const values=JSON.parse(Buffer.from(/\\bind '([A-Za-z0-9+/=]+)'/.exec(compiled.script)[1],'base64').toString('utf8'));
    assert.ok(values.includes(canary),action+' binds the exact request metadata');
    if(action!=='createNote')assert.equal(compiled.sql.includes(canary),false);
    else assert.ok(compiled.sql.includes('::boolean'));
  }
});
test('private values leave SQL text, including DO bodies, and use one extended Bind',()=>{
  const secret="\ufeffPrivate 'value';\\! printf NEVER\n😀\\g\t";
  const input=`BEGIN;\nDO $fixed$ BEGIN PERFORM ${sqlText(secret)}; END $fixed$; SELECT jsonb_build_object('value',${sqlText(secret)},'payload',${sqlJson({text:secret})});\nCOMMIT;`;
  const compiled=preparaConsultaPrivadaNodeZero(input);
  assert.equal(compiled.parameterCount,3);assert.ok(!compiled.sql.includes(secret));assert.ok(!compiled.sql.includes(Buffer.from(secret).toString('base64')));
  assert.match(compiled.sql,/DO \$fixed\$ BEGIN PERFORM \(\(current_setting/);
  assert.equal((compiled.script.match(/^BEGIN;/gm)||[]).length,1);assert.equal((compiled.script.match(/^COMMIT;/gm)||[]).length,1);
  const binds=[...compiled.script.matchAll(/\\bind '([A-Za-z0-9+/=]+)' \\gset/g)];assert.equal(binds.length,1);
  assert.deepEqual(JSON.parse(Buffer.from(binds[0][1],'base64').toString('utf8')),[secret,secret,JSON.stringify({text:secret})]);
  assert.ok(!JSON.stringify(compiled).includes('Private'));assert.ok(!inspect(compiled).includes('Private'));assert.equal(Object.isFrozen(compiled),true);
});
test('invalid UTF8/NUL, noncanonical base64 and input budgets fail before dispatch',()=>{
  for(const sql of['',' ',null,'SELECT '+sqlText('\0'),"SELECT convert_from(decode('/w==','base64'),'UTF8')",'x'.repeat(4*1024*1024+1)])assert.throws(()=>preparaConsultaPrivadaNodeZero(sql),{message:'node0_private_query_invalid'});
  assert.throws(()=>preparaConsultaPrivadaNodeZero('SELECT '+Array.from({length:10001},()=>sqlText('')).join(',')),{message:'node0_private_query_invalid'});
});
test('logging policy guard precedes private bind and requires narrow login role',()=>{
  const compiled=preparaConsultaPrivadaNodeZero('SELECT '+sqlText('fixture'));
  assert.ok(compiled.script.indexOf('node0_private_logging_policy_required')<compiled.script.indexOf('\\bind'));
  assert.match(compiled.script,/current_user <> 'node0_authenticator'/);
  for(const[key,value]of Object.entries(POLITICA_LOG_PRIVAT_NODE0))assert.ok(compiled.script.includes(`current_setting('${key}') IS DISTINCT FROM '${value}'`));
});
test('private transport cannot inherit a libpq connection string as database/user',()=>{
  const env={PGDATABASE:'node0_gauntlet_r4',PGUSER:'node0_authenticator',PGHOST:'/tmp'};
  for(const patch of[{PGDATABASE:'postgresql://remote.example/db'},{PGDATABASE:'host=remote.example dbname=x'},{PGUSER:'user password=bad'},{PGUSER:'x\nconnect'},{PGHOST:'/tmp,remote'}])assert.throws(()=>creaPostgres({env:{...env,...patch}}));
});
test('request-role queries are parameterized even without a caller private flag; stdout exposes only a JSON result',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'node0-private-bind-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'psql-fixture.mjs'),capture=path.join(dir,'stdin.txt');
  fs.writeFileSync(file,"#!/usr/bin/env node\nimport fs from 'node:fs';let input='';for await(const part of process.stdin)input+=part;fs.writeFileSync(process.env.CAPTURE,input);process.stdout.write('{\"ok\":true}\\n');\n",{mode:0o700});
  const db=creaPostgres({executable:file,env:{PATH:process.env.PATH,CAPTURE:capture,PGDATABASE:'node0_gauntlet_r4',PGUSER:'node0_authenticator',PGHOST:'/tmp'}});
  assert.deepEqual(await db.query(`SELECT json_build_object('value',${sqlText('private canary')});`),{ok:true});
  const sent=fs.readFileSync(capture,'utf8');assert.match(sent,/\\bind '[A-Za-z0-9+/=]+' \\gset/);assert.ok(!sent.includes("decode('cHJpdmF0ZSBjYW5hcnk='"));
  await assert.rejects(db.query('SELECT 1',{privateValues:'yes'}),/node0_query_options_invalid/);
});
test('psql stdout preserves a UTF8 scalar split across subprocess chunks and rejects malformed UTF8',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'node0-private-utf8-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'psql-fixture.mjs');
  fs.writeFileSync(file,"#!/usr/bin/env node\nfor await(const part of process.stdin){void part;}\nif(process.env.FIXTURE_INVALID==='1')process.stdout.write(Buffer.from([0x22,0xff,0x22]));else{const b=Buffer.from(JSON.stringify({text:'before😀after'}));const n=b.indexOf(Buffer.from('😀'))+1;process.stdout.write(b.subarray(0,n));setTimeout(()=>process.stdout.write(b.subarray(n)),30);}\n",{mode:0o700});
  const env={PATH:process.env.PATH,PGDATABASE:'node0_gauntlet_r4',PGUSER:'node0_authenticator',PGHOST:'/tmp'};
  assert.deepEqual(await creaPostgres({executable:file,env}).query('SELECT 1'),{text:'before😀after'});
  await assert.rejects(creaPostgres({executable:file,env:{...env,FIXTURE_INVALID:'1'}}).query('SELECT 1'),{message:'node0_database_invalid_response'});
});
const modulePath=process.env.SDP_PGLITE_MODULE;
if(!modulePath)test('private parameters in real DO/claims transaction require explicit PGlite',{skip:'Set SDP_PGLITE_MODULE; no implicit runtime install'},()=>{});
else{
  const moduleURL=modulePath.startsWith('file:')?new URL(modulePath):pathToFileURL(path.resolve(modulePath));const{PGlite}=await import(moduleURL.href);
  test('bound parameter array and DO body roundtrip exact Unicode/quotes with PostgreSQL transactions',async()=>{
    const pg=new PGlite();try{
      const value="\ufeffExact '\\ newline\n🎉\t<note>";
      const compiled=preparaConsultaPrivadaNodeZero(`BEGIN; DO $check$ BEGIN IF ${sqlText(value)} IS DISTINCT FROM ${sqlText(value)} THEN RAISE EXCEPTION 'mismatch'; END IF; END $check$; SELECT jsonb_build_object('direct',${sqlText(value)},'json',${sqlJson({value})}) AS result; COMMIT;`);
      const encoded=/\\bind '([A-Za-z0-9+/=]+)'/.exec(compiled.script)[1];
      await pg.exec('BEGIN');await pg.query("SELECT set_config('node0.private_parameters',convert_from(decode($1,'base64'),'UTF8'),true)",[encoded]);
      const result=await pg.exec(compiled.sql);assert.deepEqual(result.at(-1).rows[0].result,{direct:value,json:{value}});await pg.exec('COMMIT');
      assert.equal((await pg.query("SELECT current_setting('node0.private_parameters',true) AS value")).rows[0].value,'');
    }finally{await pg.close();}
  });
}
