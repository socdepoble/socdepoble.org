import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const GATE=fileURLToPath(new URL('../tooling/gates/tractor-rls.mjs',import.meta.url));
function audit(sql){const root=fs.mkdtempSync(path.join(os.tmpdir(),'sdp-rls-r2-'));try{fs.mkdirSync(path.join(root,'supabase'));for(const [nom,text]of Object.entries(typeof sql==='string'?{'fixture.sql':sql}:sql))fs.writeFileSync(path.join(root,'supabase',nom),text);return spawnSync(process.execPath,[GATE],{cwd:root,encoding:'utf8'});}finally{fs.rmSync(root,{recursive:true,force:true});}}
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

test('una migració posterior no pot deixar desactivada la RLS d’una taula ja protegida',()=>{
  const result=audit({'001_base.sql':create+'alter table public.private_row enable row level security;',
    '002_canvi.sql':'alter table public.private_row disable row level security;'});
  assert.equal(result.status,1,result.stdout);
  assert.match(result.stdout,/R2.*private_row/);
});

test('DISABLE sense CREATE en el mateix arbre també falla tancat',()=>{
  const result=audit('alter table public.existent_remota disable row level security;');
  assert.equal(result.status,1,result.stdout);
  assert.match(result.stdout,/R2.*existent_remota/);
});

test('l’últim DDL real de la mateixa relació governa per ordre de camí, no d’escriptura de fixture',()=>{
  const result=audit({'003_repara.sql':'alter table public.private_row enable row level security;',
    '002_canvi.sql':'alter table public.private_row disable row level security;',
    '001_base.sql':create+'alter table public.private_row enable row level security;'});
  assert.equal(result.status,0,result.stdout);
});

test('l’ENABLE d’una altra relació o amb altra caixa quoted no tapa el DISABLE',()=>{
  for(const altre of ['public.altra','public."PRIVATE_ROW"']) {
    const result=audit({'001_base.sql':create+'alter table public.private_row enable row level security;',
      '002_canvi.sql':`alter table public.private_row disable row level security; alter table ${altre} enable row level security;`});
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2.*private_row/);
  }
});

test('el control final no interpreta comentaris, cadenes o cossos de funcions com un DISABLE',()=>{
  for(const text of ['-- alter table public.private_row disable row level security;',
    "select 'alter table public.private_row disable row level security;';",
    'do $$ begin alter table public.private_row disable row level security; end $$;']) {
    const result=audit({'001_base.sql':create+'alter table public.private_row enable row level security;','002_canvi.sql':text});
    assert.equal(result.status,0,result.stdout);
  }
});

test('una taula existent retirada explícitament no conserva un DISABLE residual',()=>{
  for(const relation of ['public.existent_remota','"Privat"."Fila"']) {
    const result=audit({'001_canvi.sql':`alter table ${relation} disable row level security;`,
      '002_retira.sql':`drop table if exists ${relation} cascade;`});
    assert.equal(result.status,0,result.stdout);
  }
});

test('un apòstrof escapable en E-string no convertix text literal en DDL de RLS',()=>{
  const literal="select E'quote "+String.fromCharCode(92)+"'; alter table public.private_row enable row level security; --';";
  const result=audit(create+literal);
  assert.equal(result.status,1,result.stdout);
  assert.match(result.stdout,/R2.*private_row/);
});

test('R2 interpreta l’asterisc opcional de la relació ALTER TABLE',()=>{
  for(const ddl of ['ALTER TABLE public.private_row * DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE public.private_row* DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE ONLY "public"."private_row" * DISABLE ROW LEVEL SECURITY;']) {
    const result=audit({'001_base.sql':create+'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;',
      '002_canvi.sql':ddl});
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2.*private_row/);
    assert.equal(audit(create+ddl+'ALTER TABLE public.private_row * ENABLE ROW LEVEL SECURITY;').status,0);
  }
});

test('R2 processa les accions separades per comes en ordre i només a nivell zero',()=>{
  const prefix=create+'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;';
  for(const actions of ['DISABLE ROW LEVEL SECURITY, ADD COLUMN b int',
    'ADD COLUMN b int, DISABLE ROW LEVEL SECURITY',
    'ADD COLUMN b numeric(12, 2), DISABLE ROW LEVEL SECURITY']) {
    const result=audit(prefix+`ALTER TABLE public.private_row ${actions};`);
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2.*private_row/);
  }
  for(const actions of ['DISABLE ROW LEVEL SECURITY, ENABLE ROW LEVEL SECURITY',
    'ADD COLUMN b int, DISABLE ROW LEVEL SECURITY, ENABLE ROW LEVEL SECURITY',
    'DISABLE ROW LEVEL SECURITY, ADD COLUMN b numeric(12, 2), ENABLE ROW LEVEL SECURITY']) {
    assert.equal(audit(create+`ALTER TABLE public.private_row ${actions};`).status,0,actions);
  }
});

test('R2 no interpreta DDL dins de literals, identificadors, expressions o comentaris d’una llista ALTER',()=>{
  for(const clause of [
    "ADD COLUMN b text DEFAULT ', ENABLE ROW LEVEL SECURITY'",
    "ADD COLUMN b text DEFAULT E'quote "+String.fromCharCode(92)+"', ENABLE ROW LEVEL SECURITY'",
    'ADD COLUMN b text DEFAULT $$, ENABLE ROW LEVEL SECURITY$$',
    'ADD COLUMN b text DEFAULT $cos$, ENABLE ROW LEVEL SECURITY$cos$',
    'ADD COLUMN "b, ENABLE ROW LEVEL SECURITY" int',
    'ADD COLUMN b int CHECK ((b IN (1, 2))) /* , ENABLE ROW LEVEL SECURITY */',
    'ADD COLUMN b int -- , ENABLE ROW LEVEL SECURITY\n'
  ]) {
    const result=audit(create+`ALTER TABLE public.private_row ${clause};`);
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2.*private_row/);
    const enabled=audit(create+`ALTER TABLE public.private_row ${clause}, ENABLE ROW LEVEL SECURITY;`);
    assert.equal(enabled.status,0,enabled.stdout);
    const disabledText=clause.replaceAll('ENABLE','DISABLE');
    const protectedResult=audit(create+'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;'+`ALTER TABLE public.private_row ${disabledText};`);
    assert.equal(protectedResult.status,0,protectedResult.stdout);
  }
});

test('R2 CREATE posterior a DROP reinicia l’estat, també entre migracions',()=>{
  const enabled=create+'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;';
  const recreate='DROP TABLE public.private_row; '+create;
  for(const ddl of [enabled+recreate,
    {'001_base.sql':enabled,'002_recrea.sql':recreate}]) {
    const result=audit(ddl);
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2.*private_row/);
  }
  assert.equal(audit(enabled+recreate+'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;').status,0);
});

test('R2 CREATE IF NOT EXISTS conserva l’estat conegut però no protegix una taula nova o recreada',()=>{
  const conditional='CREATE TABLE IF NOT EXISTS public.private_row(id int);';
  const enabled=create+'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;';
  assert.equal(audit(enabled+conditional).status,0);
  assert.equal(audit({'001_base.sql':enabled,'002_noop.sql':conditional}).status,0);
  for(const ddl of [conditional,enabled+'DROP TABLE public.private_row; '+conditional]) {
    const result=audit(ddl);
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2.*private_row/);
  }
});

test('R2 DROP elimina les relacions de l’estat final, també en llistes amb cometes i altres relacions',()=>{
  const result=audit(create+'ALTER TABLE public.private_row DISABLE ROW LEVEL SECURITY; DROP TABLE public.private_row;');
  assert.equal(result.status,0,result.stdout);
  const multiple=audit('ALTER TABLE "S,1"."T,1" DISABLE ROW LEVEL SECURITY; ALTER TABLE public.private_row DISABLE ROW LEVEL SECURITY; DROP TABLE IF EXISTS "S,1"."T,1", public.private_row CASCADE;');
  assert.equal(multiple.status,0,multiple.stdout);
});

test('R2 un CREATE sense ENABLE no queda acreditat per una migració futura',()=>{
  const result=audit({'001_base.sql':create,'002_futura.sql':'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;'});
  assert.equal(result.status,1,result.stdout);
  assert.match(result.stdout,/R2.*001_base.sql.*private_row/);
});

test('R2 DISABLE explícit de storage.objects falla encara que la seua creació siga exempta',()=>{
  assert.equal(audit('CREATE TABLE storage.objects(id int);').status,0);
  for(const ddl of ['ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;',
    'ALTER TABLE "storage"."objects" * DISABLE ROW LEVEL SECURITY, ADD COLUMN b int;',
    'CREATE TABLE storage.objects(id int); ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;']) {
    const result=audit(ddl);
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2.*storage.objects/);
  }
  assert.equal(audit('ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY, ENABLE ROW LEVEL SECURITY;').status,0);
});

test('R2 CREATE UNLOGGED també necessita ENABLE de la mateixa relació',()=>{
  const ddl='CREATE UNLOGGED TABLE IF NOT EXISTS public.private_row(id int);';
  const missing=audit(ddl);
  assert.equal(missing.status,1,missing.stdout);
  assert.match(missing.stdout,/R2.*private_row/);
  assert.equal(audit(ddl+'ALTER TABLE public.private_row ENABLE ROW LEVEL SECURITY;').status,0);
});

test('R2 un dollar-quote no comença dins d’un identificador unquoted',()=>{
  for(const name of ['foo$tag$','foo$$']) {
    const result=audit({'001_base.sql':`CREATE TABLE public."${name}"(id int); ALTER TABLE public."${name}" ENABLE ROW LEVEL SECURITY;`,
      '002_canvi.sql':`ALTER TABLE public.${name} DISABLE ROW LEVEL SECURITY;`});
    assert.equal(result.status,1,result.stdout);
    assert.match(result.stdout,/R2/);
  }
});

/* Gauntlet O4 · D6-05 · RENAME, SET SCHEMA i DROP SCHEMA: la relació antiga ja
   no és la protegida, i un CREATE TABLE IF NOT EXISTS amb el seu nom no hereta
   l'«activat». La relació moguda, en canvi, conserva la seua RLS. */
const protegida=create+'alter table public.private_row enable row level security;\n';
test('RENAME, SET SCHEMA o DROP SCHEMA i un CREATE IF NOT EXISTS amb el nom antic tornen a exigir ENABLE',()=>{
  for(const canvi of ['alter table public.private_row rename to private_row_old;','alter table if exists only public.private_row set schema arxiu;','drop schema if exists public cascade; create schema public;']) {
    const result=audit({'001_base.sql':protegida,'002_canvi.sql':`${canvi}\ncreate table if not exists public.private_row (id int);`});
    assert.equal(result.status,1,`${canvi}\n${result.stdout}`);
    assert.match(result.stdout,/R2.*private_row/);
    const ambEnable=audit({'001_base.sql':protegida,'002_canvi.sql':`${canvi}\ncreate table if not exists public.private_row (id int);\nalter table public.private_row enable row level security;`});
    assert.equal(ambEnable.status,0,ambEnable.stdout);
  }
});
test('la relació reanomenada o moguda conserva la seua RLS, i un DISABLE posterior sobre el nom nou torna roig',()=>{
  for(const [canvi,nou] of [['alter table public.private_row rename to private_row_old;','public.private_row_old'],['alter table public.private_row set schema arxiu;','arxiu.private_row']]) {
    assert.equal(audit({'001_base.sql':protegida,'002_canvi.sql':canvi}).status,0);
    const result=audit({'001_base.sql':protegida,'002_canvi.sql':`${canvi}\nalter table ${nou} disable row level security;`});
    assert.equal(result.status,1,result.stdout);
  }
});
test('RENAME COLUMN no retira la taula: CREATE IF NOT EXISTS continua sent un no-res',()=>{
  const result=audit({'001_base.sql':protegida,'002_canvi.sql':'alter table public.private_row rename column id to ident;\ncreate table if not exists public.private_row (id int);'});
  assert.equal(result.status,0,result.stdout);
});
