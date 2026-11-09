import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {privateDirectory,libpqEnvironment} from '../tooling/fediversity/verifyLocalPostgresFediversity.mjs';

function fixture(t) {
  const work=fs.mkdtempSync('/tmp/sdp_r56_unit_'),socket=path.join(work,'socket');fs.mkdirSync(socket,{mode:0o700});t.after(()=>fs.rmSync(work,{recursive:true}));return{work,socket,database:'r56_fixture'};
}
test('libpq uses only explicit Unix socket and private empty files; inherited connection material is absent',t=>{
  const f=fixture(t),env=libpqEnvironment(f);
  assert.equal(env.PGHOST,f.socket);assert.equal(env.PGDATABASE,f.database);assert.equal(env.PGSSLMODE,'disable');
  for(const key of['HOME','PGPASSWORD','PGHOSTADDR','PGSERVICE','PGOPTIONS','DATABASE_URL'])assert.equal(Object.hasOwn(env,key),false,key);
  for(const key of['PGPASSFILE','PGSERVICEFILE']){assert.equal(fs.readFileSync(env[key]).length,0);assert.equal(fs.statSync(env[key]).mode&0o777,0o600);}
  assert.equal(env.PGSYSCONFDIR,f.work);
});
test('credential file symlink is rejected without reading its target',t=>{
  const f=fixture(t),target=path.join(f.work,'target');fs.writeFileSync(target,'must remain unread');fs.symlinkSync(target,path.join(f.work,'empty.pgpass'));
  assert.throws(()=>libpqEnvironment(f),/private_empty_connection_file_required/);assert.equal(fs.readFileSync(target,'utf8'),'must remain unread');
});
test('nonempty or group-readable libpq files are rejected',t=>{
  const f=fixture(t),file=path.join(f.work,'empty.pgpass');fs.writeFileSync(file,'unexpected',{mode:0o600});assert.throws(()=>libpqEnvironment(f),/private_empty_connection_file_required/);fs.writeFileSync(file,'');fs.chmodSync(file,0o640);assert.throws(()=>libpqEnvironment(f),/private_empty_connection_file_required/);
});
test('service file cannot smuggle connection overrides',t=>{
  const f=fixture(t);libpqEnvironment(f);fs.writeFileSync(path.join(f.work,'empty.pg_service.conf'),'[default]\nhost=remote.invalid\n');assert.throws(()=>libpqEnvironment(f),/private_empty_connection_file_required/);
});
test('remote host, URI, traversal, relative path and a symlinked work root are rejected',t=>{
  const f=fixture(t);for(const p of['localhost','https://remote.invalid','/Users/fixture','relative','/tmp/sdp_r56_unit/../elsewhere'])assert.throws(()=>privateDirectory(p),/private_tmp|required/);
  const link=f.work+'_link';fs.symlinkSync(f.work,link);t.after(()=>fs.unlinkSync(link));assert.throws(()=>privateDirectory(link),/physical_private_directory_required/);
});
test('SQL identifiers cannot become libpq connection strings or shell options',t=>{
  const f=fixture(t);for(const database of['postgres host=remote.invalid','postgres://remote.invalid/db','--dbname=remote','../postgres'])assert.throws(()=>libpqEnvironment({...f,database}),/invalid_local_connection_identity/);
  assert.throws(()=>libpqEnvironment({...f,user:'user password=secret'}),/invalid_local_connection_identity/);
});
