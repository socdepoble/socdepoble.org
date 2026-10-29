import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const GATE=fileURLToPath(new URL('../tooling/gates/tractor-rls.mjs',import.meta.url));
function audit(sql){const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-rls-r2-'));try{fs.mkdirSync(path.join(root,'supabase'));fs.writeFileSync(path.join(root,'supabase/fixture.sql'),sql);return spawnSync(process.execPath,[GATE],{cwd:root,encoding:'utf8'});}finally{fs.rmSync(root,{recursive:true,force:true});}}
const create='create table public.private_row (id int);\n';
for(const [name,evidence]of [['comment','-- alter table public.private_row enable row level security;'],['literal',"select 'alter table public.private_row enable row level security;';"],['dollar body','do $$ begin alter table public.private_row enable row level security; end $$;'],['other table','alter table public.other_row enable row level security;']])test(`R2 no accepta ${name} com ENABLE de la taula`,()=>{const r=audit(create+evidence);assert.equal(r.status,1,r.stdout);assert.match(r.stdout,/R2.*private_row/);});
test('DDL real admet espais, caixa, IF EXISTS, ONLY i identificadors entre cometes exactes',()=>{for(const ddl of ['alter table public.private_row enable row level security;','AlTeR\n TaBlE IF EXISTS ONLY public.private_row ENABLE\nROW LEVEL\nSECURITY;','alter table "public"."private_row" enable row level security;']){const r=audit(create+ddl);assert.equal(r.status,0,r.stdout);}});
test('DISABLE posterior torna roig; ENABLE posterior reprén el control estàtic',()=>{const enable='alter table public.private_row enable row level security;',disable='alter table public.private_row disable row level security;';assert.equal(audit(create+enable+disable).status,1);assert.equal(audit(create+disable+enable).status,0);});
test('CREATE comentat o literal no introduïx una exigència R2 fictícia',()=>{for(const sql of ['-- create table public.fake(id int);\nselect 1;',"select 'create table public.fake(id int);';"]){const r=audit(sql);assert.equal(r.status,0,r.stdout);}});

test('cometes amb caixa diferent no acrediten la relació unquoted',()=>{assert.equal(audit(create+'alter table public."PRIVATE_ROW" enable row level security;').status,1);});
test('PRIVATE unquoted conserva l’exempció existent independentment de caixa',()=>{assert.equal(audit('CREATE TABLE PRIVATE.internal_row(id int);').status,0);});

test('CREATE entre cometes exigix ENABLE sobre la mateixa relació',()=>{
  for(const relation of ['"public"."private_row"','"PrivateSchema"."PrivateRow"','"PrivateRow"']) {
    const ddl=`CREATE TABLE IF NOT EXISTS ${relation}(id int);\n`;
    const missing=audit(ddl);
    assert.equal(missing.status,1,missing.stdout);
    assert.match(missing.stdout,/R2/);
    const enabled=audit(ddl+`ALTER TABLE ${relation} ENABLE ROW LEVEL SECURITY;`);
    assert.equal(enabled.status,0,enabled.stdout);
  }
});
test('CREATE quoted conserva caixa de taula i esquema davant de relacions distintes',()=>{
  const ddl='CREATE TABLE "PrivateSchema"."PrivateRow"(id int);\n';
  for(const relation of ['privateschema.privaterow','"privateschema"."PrivateRow"','"PrivateSchema"."privaterow"']) {
    const result=audit(ddl+`ALTER TABLE ${relation} ENABLE ROW LEVEL SECURITY;`);
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2/);
  }
});
test('identificadors quoted amb cometes escapades i puntuació comparteixen parser CREATE/ALTER',()=>{
  for(const relation of ['"public"."Private""Row"','"Schema""Name"."Row;--/*Name"']) {
    const ddl=`CREATE TABLE ${relation}(id int);\n`;
    assert.equal(audit(ddl).status,1);
    const enabled=audit(ddl+`ALTER TABLE ${relation} ENABLE ROW LEVEL SECURITY;`);
    assert.equal(enabled.status,0,enabled.stdout);
    const disabled=audit(ddl+`ALTER TABLE ${relation} ENABLE ROW LEVEL SECURITY; ALTER TABLE ${relation} DISABLE ROW LEVEL SECURITY;`);
    assert.equal(disabled.status,1,disabled.stdout);
  }
});
test('l’exempció private respecta la caixa dels esquemes quoted',()=>{
  assert.equal(audit('CREATE TABLE "private"."internal_row"(id int);').status,0);
  const result=audit('CREATE TABLE "PRIVATE"."internal_row"(id int);');
  assert.equal(result.status,1,result.stdout);
  assert.match(result.stdout,/R2/);
});
