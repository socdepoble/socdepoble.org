import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const gate = fileURLToPath(new URL('../tooling/gates/tractor-rls.mjs', import.meta.url));
function audit(sql) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-rls-local-'));
  try {
    fs.mkdirSync(path.join(root, 'supabase'));
    fs.writeFileSync(path.join(root, 'supabase/fixture.sql'), sql);
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.equal(result.stderr, '', result.stderr);
    assert.equal(result.signal, null);
    assert.match(result.stdout, /(?:✅|❌) \[RLS\]/);
    return result;
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const definer = (options = '') => `create function public.f(p pg_catalog.uuid) returns int language sql security definer ${options} as $$select 1$$;`;

test('R6 · SET LOCAL de catàleg: tokens reals, transacció explícita i cap identitat de rutina inferida', () => {
  for (const setting of [
    'SET LOCAL search_path=pg_catalog,public',
    'set local search_path to pg_catalog, public',
    'SeT /* a */ LoCaL\n"search_path" = "pg_catalog", "public"',
    'set local search_path = pg_catalog, public, pg_temp',
    'set local search_path = pg_catalog, pg_temp',
  ]) {
    const result = audit(`begin read only; ${setting}; select 1; commit;`);
    assert.equal(result.status, 0, `${setting}\n${result.stdout}`);
  }
});

test('R6 · manté el refús de sessió mutable, esquemes arbitraris, pg_temp davant i literals amb coma', () => {
  for (const setting of [
    'set search_path=pg_catalog,public',
    'set session search_path=pg_catalog,public',
    'set local search_path=public,pg_catalog',
    'set local search_path=pg_temp,pg_catalog,public',
    'set local search_path=pg_catalog,pg_temp,public',
    'set local search_path=pg_catalog,public,hidden',
    'set local search_path=pg_catalog,public,pg_catalog',
    'set local search_path=pg_catalog,public,',
    'set local search_path=pg_catalog,public from current',
    "set local search_path='pg_catalog,public'",
    'set local search_path="pg_catalog,public"',
    'set local search_path="PG_CATALOG",public',
    'set local search_path=default',
    "set local search_path=''",
    'reset search_path',
    'reset all',
  ]) {
    const result = audit(`begin; ${setting}; select 1; commit;`);
    assert.equal(result.status, 1, `${setting}\n${result.stdout}`);
    assert.match(result.stdout, /R6.*search_path de sessió/);
  }
  for (const sql of [
    'set local search_path=pg_catalog,public;',
    'begin; commit; set local search_path=pg_catalog,public;',
    'begin; rollback; set local search_path=pg_catalog,public;',
    "begin; prepare transaction 'preparada'; set local search_path=pg_catalog,public;",
    "select 'begin'; set local search_path=pg_catalog,public;",
  ]) assert.equal(audit(sql).status, 1, sql);
});

test('R6 · una ruta catalogica no acredita identitats de relació public inferides per R2', () => {
  const base = 'create table public.t(id int); alter table public.t enable row level security;';
  for (const [ombra, setting] of [
    ['create temp table pg_temp.t(id int);', 'pg_catalog,public'],
    ['create table pg_catalog.t(id int); alter table pg_catalog.t enable row level security;', 'pg_catalog,public,pg_temp'],
  ]) {
    for (const operacio of ['alter table t enable row level security', 'drop table t', 'drop table if exists public.altra,t',
      'alter table only "t" enable row level security', 'alter table if exists t rename to altra']) {
      const result = audit(`${base} begin; ${ombra} set local search_path=${setting};
        alter table public.t disable row level security; ${operacio}; commit;`);
      assert.equal(result.status, 1, `${setting}/${operacio}\n${result.stdout}`);
      assert.match(result.stdout, /R6.*search_path de sessió/);
    }
  }
  // Una resolució qualificada no depén de l'ordre d'esquemes de sessió.
  const valid = audit(`${base} begin; set local search_path=pg_catalog,public,pg_temp;
    alter table public.t disable row level security; alter table public.t enable row level security; commit;`);
  assert.equal(valid.status, 0, valid.stdout);
  for (const operacio of ['create policy tanca on t for select using(false)',
    'create trigger avisa before insert on t execute function public.avisa()', 'insert into t values(1)',
    'create view v with (security_invoker=true) as select 1', 'grant select on t to anon',
    'revoke select on table public.altra,t from anon']) {
    const result = audit(`${base} begin; set local search_path=pg_catalog,public,pg_temp; ${operacio}; commit;`);
    assert.equal(result.status, 1, `${operacio}\n${result.stdout}`);
    assert.match(result.stdout, /R6.*search_path de sessió/);
  }
});

test('R6 · la ruta de sessió mai substituïx el search_path buit real del DEFINER', () => {
  for (const options of ['', 'set search_path=pg_catalog,public', 'set search_path=public,pg_temp', 'set search_path from current']) {
    const result = audit(`begin; set local search_path=pg_catalog,public,pg_temp; ${definer(options)} commit;`);
    assert.equal(result.status, 1, `${options}\n${result.stdout}`);
    assert.match(result.stdout, /R6.*public\.f/);
  }
  const safe = audit(`begin; set local search_path=pg_catalog,public,pg_temp; ${definer("set search_path=''")} commit;`);
  assert.equal(safe.status, 0, safe.stdout);
});

test('R6 · pg_temp implícit no acredita DDL de rutina, pg_temp últim no resol rutines sense esquema', () => {
  const implicit = audit(`begin; set local search_path=pg_catalog,public; ${definer("set search_path=''")} commit;`);
  assert.equal(implicit.status, 1, implicit.stdout);
  assert.match(implicit.stdout, /R6.*search_path de sessió/);
  const unqualified = audit(`begin; set local search_path=pg_catalog,public,pg_temp; ${definer().replace('public.f', 'f')} commit;`);
  assert.equal(unqualified.status, 1, unqualified.stdout);
  const doSetting = audit('begin; do $$begin set local search_path=pg_catalog,public,pg_temp; end$$; commit;');
  assert.equal(doSetting.status, 1, doSetting.stdout);
  assert.match(doSetting.stdout, /R6.*search_path de sessió dins/);
});
