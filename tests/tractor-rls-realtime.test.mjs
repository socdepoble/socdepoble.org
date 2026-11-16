import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const gate = fileURLToPath(new URL('../tooling/gates/tractor-rls.mjs', import.meta.url));
function check(sql) {
  const cwd = mkdtempSync(join(tmpdir(), 'sdp-rls-'));
  try {
    mkdirSync(join(cwd, 'supabase'));
    for (const [file, content] of Object.entries(typeof sql === 'string' ? { 'policy.sql': sql } : sql)) {
      const absolute = join(cwd, 'supabase', file);
      mkdirSync(join(absolute, '..'), { recursive: true });
      writeFileSync(absolute, content);
    }
    return spawnSync(process.execPath, [gate], { cwd, encoding: 'utf8' });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}

test('R1 reconeix exclusivament realtime.messages com a taula del servei', () => {
  const result = check('create policy own on realtime.messages for select to authenticated using (topic = realtime.topic());');
  assert.equal(result.status, 0, result.stdout);
  const unknown = check('create policy own on realtime.inventada for select to authenticated using (false);');
  assert.equal(unknown.status, 1);
  assert.match(unknown.stdout, /R1.*realtime.inventada/);
});

test('R3 continua rebutjant lectura o escriptura indiscriminada en Realtime', () => {
  for (const clause of ['for select using (true)', 'for insert with check (true)']) {
    const result = check(`create policy open on realtime.messages ${clause};`);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /R3.*messages/);
  }
});

test('R1 reconeix auth.users com a destí de triggers de GoTrue', () => {
  const trigger = (table) => `create trigger baixa before delete on ${table} execute function private.baixa();`;
  const valid = check(trigger('auth.users'));
  assert.equal(valid.status, 0, valid.stdout);
  for (const table of ['auth.inventada', 'public.users']) {
    const unknown = check(trigger(table));
    assert.equal(unknown.status, 1, unknown.stdout);
    assert.ok(unknown.stdout.includes(`create trigger sobre taula inexistent: ${table}`), unknown.stdout);
  }
});

const funcio = opcions => `create function public.segura() returns integer ${opcions};`;
test('R6 accepta només el search_path buit real de capçalera, amb gramàtica PostgreSQL independent dels espais', () => {
  for (const opcions of [
    "language sql security definer set search_path='' as $$select 1$$",
    "LANGUAGE SQL SECURITY DEFINER SET SEARCH_PATH TO '' AS $$select 1$$",
    "set search_path = '' security definer language sql as $$select 1$$",
    "language sql security /* intermig */ definer set\nsearch_path/* separació */= '' as $$select 1$$",
    "as $cos$select 1$cos$ language sql security definer set search_path to ''",
    "as 'select 1' set search_path=E'' language sql security definer",
    "language sql security definer set search_path = $$$$ as $$select 1$$",
    "language sql security definer set \"search_path\" = '' set work_mem='4MB' as $$select 1$$"
  ]) {
    const result = check(funcio(opcions));
    assert.equal(result.status, 0, `${opcions}\n${result.stdout}`);
  }
});

test('R6 rebutja ruta absent, no buida, heretada, concatenada, amb més valors o reassignada', () => {
  for (const clausula of [
    '', "set search_path = 'public'", 'set search_path=public',
    "set search_path to '$user', public", 'set search_path from current',
    'set search_path = default', "set search_path='',public", "set search_path=''\n'public'",
    "set search_path='' set search_path='public'", "set search_path='public' set search_path=''",
    "set search_path='' set \"search_path\" to 'public'", "set search_path='' set search_path=''"
  ]) {
    const result = check(funcio(`language sql security definer ${clausula} as $$select 1$$`));
    assert.equal(result.status, 1, `${clausula}\n${result.stdout}`);
    assert.match(result.stdout, /R6.*segura/);
  }
});

test('R6 no acredita tranquil·litzadors de comentaris, cos, altres GUC o arguments per defecte', () => {
  for (const sql of [
    funcio("language sql security definer /* set search_path = '' */ as $$select 1$$"),
    funcio("language sql security definer -- set search_path = ''\nas $$select 1$$"),
    funcio("language plpgsql security definer as $$begin set search_path = ''; return 1; end$$"),
    funcio("as $$select 'set search_path = '''''$$ language sql security definer"),
    funcio("language sql security definer set work_mem='set search_path = ''''' as $$select 1$$"),
    "create function public.segura(x text default 'set search_path = ''''') returns text language sql security definer as $$select x$$;",
    "create function public.segura(x text default $$set search_path = ''$$) returns text language sql security definer as $$select x$$;",
    funcio("language sql security definer begin atomic set search_path=''; select 1; end"),
    funcio("language sql security definer return 'set search_path = '''''"),
    // El cos SQL estàndard no literal queda fora del subconjunt estàtic:
    // ni una ruta de capçalera ni un ALTER posterior el poden acreditar.
    funcio("language sql security definer set search_path='' begin atomic select 1; end"),
    funcio("language sql security definer set search_path='' return 1"),
    funcio("language sql security definer begin atomic select 1; end") + "alter function public.segura() set search_path='';"
  ]) {
    const result = check(sql);
    assert.equal(result.status, 1, `${sql}\n${result.stdout}`);
    assert.match(result.stdout, /R6.*segura/);
  }
});

test('R6 distingix SECURITY DEFINER executable de noms quoted i text inert en invoker', () => {
  for (const sql of [
    funcio("language sql security invoker as $$select 'security definer'$$"),
    "create function public.inerta(x text default 'security definer') returns text language sql as $$select x$$;",
    'create function public.inerta() returns table("security" text,"definer" text) language sql security invoker as $$select \'a\',\'b\'$$;',
    funcio("language sql /* security definer */ as $$select 1$$")
  ]) {
    const result = check(sql);
    assert.equal(result.status, 0, `${sql}\n${result.stdout}`);
  }
});

test('R6 seguix CREATE, ALTER, RESET, DROP i sobrecàrregues sense atribuir una esmena a una altra funció', () => {
  const insegura = "create function public.f(p int) returns int language sql security definer set search_path=public as $$select p$$;";
  const segura = "create or replace function public.f(p int) returns int language sql security definer set search_path='' as $$select p$$;";
  for (const [sql, status] of [
    [insegura + "alter function public.f(integer) set search_path='';", 0],
    [segura + 'alter function public.f(integer) set search_path=public;', 1],
    [insegura + "alter function public.f(text) set search_path='';", 1],
    [insegura + "alter function private.f(integer) set search_path='';", 1],
    [insegura + "create or replace function public.f(p int) returns int language sql as $$select p$$;", 0],
    [segura + 'alter function public.f(integer) reset search_path;', 1],
    [segura + 'alter function public.f(integer) reset all;', 1],
    [insegura + 'alter function public.f(integer) security invoker;', 0],
    ["create function public.f(p int) returns int language sql as $$select p$$; alter function public.f(integer) security definer;", 1],
    [segura + 'create or replace function public.f(p int) returns int language sql security definer as $$select p$$;', 1],
    [insegura + 'drop function public.f(integer);', 0],
    [insegura + 'drop function if exists public.f(text);', 1],
    [insegura + "do $$begin execute 'alter function public.f(integer) set search_path='''';'; end$$;", 1],
    [insegura + "alter function public.f(integer) rename to g; alter function public.g(integer) set search_path='';", 0],
    [insegura + 'alter function public.f(integer) rename to g;' + segura, 1],
    [insegura + "alter function public.f(integer) set schema private; alter function private.f(integer) set search_path='';", 0]
  ]) {
    const result = check(sql);
    assert.equal(result.status, status, `${sql}\n${result.stdout}\n${result.stderr}`);
    if (status) assert.match(result.stdout, /R6.*f|R6.*g/);
  }
});

test('R6 tanca els bypassos d’identitat confirmats executant el SQL amb PostgreSQL/PGlite', () => {
  // La revisió independent executa estes formes en PG i conserva l'estat
  // prosecdef/proconfig: una funció definer amb ruta public ha de quedar roja.
  const safe = (args = 'p integer') => `create function public.f(${args}) returns integer language sql security definer set search_path='' as $$select 1$$;`;
  const cases = [
    safe('p pg_catalog.int4') + 'alter function public.f(integer) set search_path=public;',
    safe() + 'alter function public.f(pg_catalog.int4) set search_path=public;',
    safe('p IN integer') + 'alter function public.f(integer) set search_path=public;',
    'create type public."MyType" as enum (\'a\'); create type public."mytype" as enum (\'a\'); create function public.f(p "MyType") returns integer language sql security definer set search_path=public as $$select 1$$; create function public.f(p "mytype") returns integer language sql security invoker as $$select 1$$;',
    'create type public."MyType" as enum (\'a\'); create type public."mytype" as enum (\'a\'); create function public.f(p "MyType") returns integer language sql security definer set search_path=public as $$select 1$$; create function public.f(p "mytype") returns integer language sql security definer set search_path=public as $$select 1$$; alter function public.f("mytype") set search_path=\'\';',
    'create type public."A Type" as enum (\'a\'); create type public."B Type" as enum (\'a\'); create function public.f("A Type") returns integer language sql security definer set search_path=public as $$select 1$$; create function public.f("B Type") returns integer language sql security invoker as $$select 1$$;',
    safe() + 'alter routine public.f(integer) set search_path=public;',
    safe() + 'alter function public.f set search_path=public;',
    safe('') + 'alter function public.f set search_path=public;',
    "create function public.f(float(20)) returns int language sql security definer set search_path=public as $$select 1$$; create function public.f(float(40)) returns int language sql security invoker as $$select 1$$;",
    "create schema hidden; set search_path=hidden; create function f() returns int language sql security definer set search_path=public as $$select 1$$; create function public.f() returns int language sql security invoker as $$select 1$$;",
    "create domain public.int4 as text; set search_path=public,pg_catalog; create function public.f(int4) returns int language sql security definer set search_path=public as $$select 1$$; create function public.f(integer) returns int language sql security invoker as $$select 1$$;",
  ];
  for (const sql of cases) {
    const result = check(sql);
    assert.equal(result.status, 1, `${sql}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /R6/);
  }
});

test('R6 resol el subconjunt explícit i falla tancat amb una identitat desconeguda o ambigua', () => {
  const unsafe = args => `create function public.f(${args}) returns int language sql security definer set search_path=public as $$select 1$$;`;
  for (const [sql, status] of [
    [unsafe('p pg_catalog.int4') + "alter routine public.f(integer) set search_path='';", 0],
    [unsafe('p IN integer') + "alter function public.f set search_path='';", 0],
    [unsafe('') + "alter function public.f set search_path='';", 0],
    [unsafe('IN p integer, OUT r integer') + "alter function public.f(integer) set search_path='';", 0],
    [unsafe('p INOUT integer') + "alter function public.f(integer) set search_path='';", 0],
    [unsafe('VARIADIC p integer[]') + "alter function public.f(pg_catalog._int4) set search_path='';", 0],
    [unsafe('p numeric(12,2), q timestamp(3) with time zone, r integer[2][3]') + "alter function public.f(decimal,timestamptz,int4[]) set search_path='';", 0],
    [unsafe('p float(20)') + "alter function public.f(real) set search_path='';", 0],
    [unsafe('p float(40)') + "alter function public.f(double precision) set search_path='';", 0],
    [unsafe('p public."A Type"') + "alter function public.f(public.\"A Type\") set search_path='';", 0],
    [unsafe('p public."MyType"') + 'create function public.f(p public."mytype") returns int language sql security invoker as $$select 1$$;', 1],
    [unsafe('p public."A Type"') + 'create function public.f(p public."B Type") returns int language sql security invoker as $$select 1$$;', 1],
    [unsafe('p public."MyType"') + "alter function public.f(public.\"mytype\") set search_path='';", 1],
    [unsafe('p integer') + unsafe('p text') + "alter function public.f set search_path='';", 1],
    ["alter function public.desconeguda(integer) set search_path='';", 1],
    ["alter routine public.desconeguda set search_path=public;", 1],
    ['alter procedure public.desconeguda(integer) security definer;', 1],
    ["alter function U&\"f\" set search_path=public;", 1],
    ["create function U&\"f\"() returns int language sql security definer set search_path='' as $$select 1$$;", 1],
    [unsafe('p int') + 'alter function public.f(integer) rename to U&"g"; create function public.u(p int) returns int language sql as $$select 1$$;', 1],
    [unsafe('p int') + 'drop function U&"f";', 1],
    [unsafe('p int').replace('search_path=public', "search_path=''") + 'alter function public.f(integer) set U&"search_path"=public;', 1],
    ["create function public.f(p \"Tipus no resolt\") returns int language sql security definer set search_path='' as $$select 1$$;", 1],
  ]) {
    const result = check(sql);
    assert.equal(result.status, status, `${sql}\n${result.stdout}\n${result.stderr}`);
    if (status) assert.match(result.stdout, /R6/);
  }
  for (const setting of ['set "search_path"=hidden', 'set session "search_path"=hidden', "set schema 'hidden'", 'set U&"search_path"=hidden', 'reset "search_path"']) {
    const sql = `create schema hidden; ${setting};` + unsafe('p int') + 'create function public.f(p int) returns int language sql as $$select 1$$;';
    const result = check(sql);
    assert.equal(result.status, 1, `${sql}\n${result.stdout}`);
    assert.match(result.stdout, /R6.*search_path de sessió/);
  }
});

test('R6 aplica cronologia mixta i restriccions declarades, no l’ordre alfabètic ni la creació dels fitxers', () => {
  const unsafe = "create function public.f() returns int language sql security definer set search_path=public as $$select 1$$;";
  const fix = "alter function public.f() set search_path='';";
  const mixed = { '20261116040000_fix.sql': fix, '2610311800_original.sql': unsafe };
  let result = check(mixed);
  assert.equal(result.status, 0, result.stdout);
  result = check({ '20261116040000_bad.sql': 'alter function public.f() set search_path=public;', '2610311800_original.sql': unsafe.replace('search_path=public', "search_path='' ") });
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /R6.*public\.f\(\)/);
  const manifest = { esquema: 'sdp.ordre-desplegament.v1', restriccions: [{ abans: '20261116040000', despres: '2610311800' }] };
  result = check({ 'migrations/20261116040000_fix.sql': fix, 'migrations/2610311800_original.sql': unsafe, 'ordre_desplegament.json': JSON.stringify(manifest) });
  assert.equal(result.status, 1, 'la restricció obliga l’esmena abans de la declaració insegura; no pot donar verd');
  assert.match(result.stdout, /R6.*public\.f\(\)/);
});

test('R32 · seed, snippets i sql/ s’avaluen DESPRÉS del catàleg: una migració posterior no n’emmascara el DDL insegur', () => {
  const ordre = JSON.stringify({ esquema: 'sdp.ordre-desplegament.v1', restriccions: [] });
  const crea = 'create table public.t (id int); alter table public.t enable row level security;';
  const segura = "create function public.f() returns int language sql security definer set search_path='' as $$select 1$$;";
  const insegura = 'create or replace function public.f() returns int language sql security definer as $$select 1$$;';
  for (const [nom, posterior] of [
    // Versió ANTERIOR a les migracions: l'ordre cronològic sol el posaria davant.
    ['snippets/2601010000_desactiva.sql', 'alter table public.t disable row level security;'],
    ['seed.sql', 'alter table public.t disable row level security;'],
    ['sql/referencia.sql', 'alter table public.t disable row level security;'],
  ]) {
    for (const ambOrdre of [true, false]) {
      const fitxers = { 'migrations/2611010000_crea.sql': crea, 'migrations/2611020000_altra.sql': 'select 1;', [nom]: posterior };
      if (ambOrdre) fitxers['ordre_desplegament.json'] = ordre;
      const result = check(fitxers);
      assert.equal(result.status, 1, `${nom} (ordre=${ambOrdre})\n${result.stdout}\n${result.stderr}`);
      assert.ok(result.stdout.includes(`R2 · supabase/${nom}: La taula public.t queda amb RLS desactivada`), result.stdout);
    }
  }
  for (const nom of ['snippets/2601010000_redefinix.sql', 'seed.sql']) {
    const result = check({ 'migrations/2611010000_f.sql': segura, [nom]: insegura, 'ordre_desplegament.json': ordre });
    assert.equal(result.status, 1, `${nom}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, new RegExp(`R6 · supabase/${nom.replace('.', '\\.')}: Funció security definer public\\.f\\(\\)`));
  }
  // Control: la mateixa forma sense el fitxer posterior continua en verd.
  const net = check({ 'migrations/2611010000_crea.sql': crea, 'migrations/2611020000_f.sql': segura, 'ordre_desplegament.json': ordre });
  assert.equal(net.status, 0, net.stdout);
});

test('R32 · R6 avalua CREATE PROCEDURE … SECURITY DEFINER com una funció i falla tancat amb ALTER/gramàtica no suportada', () => {
  for (const [sql, status] of [
    ['create or replace procedure public.p() language sql security definer as $$select 1$$;', 1],
    ['create procedure public.p(p int) language sql security definer set search_path=public as $$select 1$$;', 1],
    ["create procedure public.p() language sql security definer set search_path='' as $$select 1$$;", 0],
    ["CREATE PROCEDURE public.p(IN p integer, OUT r integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$begin r := p; end$$;", 0],
    ['create procedure public.p() language sql security invoker as $$select 1$$;', 0],
    ['create procedure public.p() language sql as $$select 1$$;', 0],
    // Com en pg_proc, els OUT no formen part de la identitat (p() en PGlite 17.5):
    // un altre objecte posterior no esborra el diagnòstic del procediment.
    ['create procedure public.p(out r int) language plpgsql security definer set search_path=public as $$begin r := 1; end$$; create function public.q() returns int language sql as $$select 1$$;', 1],
    ["create procedure public.p(p int) language sql security definer set search_path=public as $$select 1$$; alter routine public.p(integer) set search_path='';", 0],
    ["create procedure public.p() language sql security definer set search_path='' as $$select 1$$; alter procedure public.p() set search_path=public;", 1],
    ['create procedure public.p() language sql as $$select 1$$; alter procedure public.p() security definer;', 1],
    ["create procedure U&\"p\"() language sql security definer set search_path='' as $$select 1$$;", 1],
    ["create procedure public.p() language sql security definer set search_path='' begin atomic select 1; end;", 1],
  ]) {
    const result = check(sql);
    assert.equal(result.status, status, `${sql}\n${result.stdout}\n${result.stderr}`);
    if (status) assert.match(result.stdout, /R6/);
  }
});

// R32 · Gauntlet final (seguretat, P1 + P2). Base comuna: una migració real que
// deixa public.pou(uuid) definer sense search_path, i una variant segura.
const ORDRE_R32 = JSON.stringify({ esquema: 'sdp.ordre-desplegament.v1', restriccions: [] });
const POU_INSEGURA = 'create or replace function public.pou(p uuid) returns int language sql security definer as $$select 1$$;';
const POU_SEGURA = "create or replace function public.pou(p uuid) returns int language sql security definer set search_path = '' as $$select 1$$;";
const R6_MIGRACIO = /R6 · supabase\/migrations\/2611160001_a\.sql: Funció security definer public\.pou\(uuid\)/;

test('R32 · P1 · seed, snippets i sql/ poden afegir infraccions R6/R2, però mai retirar-ne cap de les migracions', () => {
  for (const nom of ['seed.sql', 'snippets/2611170000_x.sql', 'sql/referencia.sql']) {
    for (const retira of [
      'drop function if exists public.pou(uuid);',
      'create or replace function public.pou(p uuid) returns int language sql as $$select 1$$;',
      "alter function public.pou(uuid) set search_path = '';",
      'alter function public.pou(uuid) security invoker;',
      POU_SEGURA,
    ]) {
      for (const ambOrdre of [true, false]) {
        const fitxers = { 'migrations/2611160001_a.sql': POU_INSEGURA, [nom]: retira };
        if (ambOrdre) fitxers['ordre_desplegament.json'] = ORDRE_R32;
        const result = check(fitxers);
        assert.equal(result.status, 1, `${nom}: ${retira} (ordre=${ambOrdre})\n${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout, R6_MIGRACIO, `${nom}: ${retira}`);
      }
    }
    // R2 per coherència: un ENABLE posterior no rescata un DISABLE del catàleg.
    const rls = check({
      'migrations/2611160001_a.sql': 'create table public.t (id int); alter table public.t enable row level security;',
      'migrations/2611160002_b.sql': 'alter table public.t disable row level security;',
      [nom]: 'alter table public.t enable row level security;', 'ordre_desplegament.json': ORDRE_R32,
    });
    assert.equal(rls.status, 1, `${nom}\n${rls.stdout}`);
    assert.ok(rls.stdout.includes('R2 · supabase/migrations/2611160002_b.sql: La taula public.t queda amb RLS desactivada'), rls.stdout);
  }
  // Cada posterior treballa sobre la seua pròpia còpia: sql/ (que no s'aplica)
  // no emmascara el definer insegur que crea seed.sql.
  const entrePosteriors = check({
    'migrations/2611160001_a.sql': POU_SEGURA, 'ordre_desplegament.json': ORDRE_R32,
    'seed.sql': 'create function public.g() returns int language sql security definer as $$select 1$$;',
    'sql/referencia.sql': 'drop function if exists public.g();',
  });
  assert.equal(entrePosteriors.status, 1, entrePosteriors.stdout);
  assert.match(entrePosteriors.stdout, /R6 · supabase\/seed\.sql: Funció security definer public\.g\(\)/);
  // Un posterior que empitjora una funció segura del catàleg respon ell mateix.
  const empitjora = check({ 'migrations/2611160001_a.sql': POU_SEGURA, 'sql/referencia.sql': 'alter function public.pou(uuid) set search_path = public;', 'ordre_desplegament.json': ORDRE_R32 });
  assert.equal(empitjora.status, 1, empitjora.stdout);
  assert.match(empitjora.stdout, /R6 · supabase\/sql\/referencia\.sql: Funció security definer public\.pou\(uuid\)/);
  // Controls: sense posterior la migració insegura és roja; un posterior que
  // retira o afig rutines segures sobre un catàleg net continua verd.
  const control = check({ 'migrations/2611160001_a.sql': POU_INSEGURA, 'ordre_desplegament.json': ORDRE_R32 });
  assert.equal(control.status, 1, control.stdout);
  assert.match(control.stdout, R6_MIGRACIO);
  const net = check({
    'migrations/2611160001_a.sql': POU_SEGURA, 'ordre_desplegament.json': ORDRE_R32,
    'seed.sql': "create function public.h() returns int language sql security definer set search_path = '' as $$select 1$$;",
    'sql/referencia.sql': 'drop function if exists public.pou(uuid);',
  });
  assert.equal(net.status, 0, net.stdout);
});

test('R32 · P2 (a) · DDL de rutina en un fitxer amb ROLLBACK, ROLLBACK TO o ABORT de nivell superior falla tancat', () => {
  for (const desfet of [
    'begin; drop function public.pou(uuid); rollback;',
    'begin; savepoint s; drop function public.pou(uuid); rollback to savepoint s; commit;',
    `begin; ${POU_SEGURA} rollback;`,
    "begin; alter function public.pou(uuid) set search_path = ''; rollback;",
    'begin; alter function public.pou(uuid) security invoker; abort;',
    'begin;\n-- desfà\ndrop function public.pou(uuid);\nROLLBACK;',
  ]) {
    const result = check({ 'migrations/2611160001_a.sql': POU_INSEGURA, 'migrations/2611160002_b.sql': desfet, 'ordre_desplegament.json': ORDRE_R32 });
    assert.equal(result.status, 1, `${desfet}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /R6 · supabase\/migrations\/2611160002_b\.sql: ROLLBACK, ROLLBACK TO o ABORT/, desfet);
  }
  for (const [a, b] of [
    [POU_INSEGURA, 'drop function public.pou(uuid);'], // DROP real: sí que retira.
    [POU_SEGURA, 'begin; select 1; rollback;'], // ROLLBACK sense DDL de rutina.
    [POU_SEGURA, 'create procedure public.p() language plpgsql as $$begin commit; rollback; end$$;'], // dins del cos.
    [POU_SEGURA, '-- rollback\ndrop function public.pou(uuid);'], // comentari.
  ]) {
    const result = check({ 'migrations/2611160001_a.sql': a, 'migrations/2611160002_b.sql': b, 'ordre_desplegament.json': ORDRE_R32 });
    assert.equal(result.status, 0, `${b}\n${result.stdout}\n${result.stderr}`);
  }
});

test('R32 · P2 (b) · set_config, DO i ALTER ROLE/DATABASE de search_path es tracten com un SET de sessió', () => {
  const drop = 'drop function if exists pou(uuid);';
  for (const canvi of [
    "create schema if not exists privat2; select pg_catalog.set_config('search_path','privat2',false);",
    "select set_config('search_path','privat2',true);",
    "select set_config('SEARCH_PATH','privat2',false);",
    "select * from pg_catalog.set_config($$search_path$$,'privat2',false);",
    "select set_config('search_' || 'path','privat2',false);",
    "select set_config(E'search\\x5fpath','privat2',false);",
    "select set_config(U&'search\\005fpath','privat2',false);",
    'select "set_config"(\'search_path\',\'privat2\',false);',
    "do $$begin perform set_config('search_path','privat2',false); end$$;",
    "do $$declare n text := 'search_path'; begin perform pg_catalog.set_config(n,'privat2',false); end$$;",
    'do $$begin set search_path = privat2; end$$;',
    "do $$begin execute 'set local search_path to privat2'; end$$;",
    'do $$<<alter>> begin set search_path = privat2; end$$;',
    'do $$<<function>> begin set search_path = privat2; end$$;',
    'do $$declare alter int; begin if alter is null then set search_path = privat2; end if; end$$;',
    "do $$begin execute 'alter role postgres set search_path = privat2'; end$$;",
    'do $a$begin execute $b$ execute $c$ execute $d$ execute $e$ set search_path = privat2 $e$ $d$ $c$ $b$; end$a$;',
    'alter role postgres set search_path = privat2;',
    'alter database postgres reset all;',
    'alter system set search_path = privat2;',
    'alter system reset all;',
  ]) {
    const result = check({ 'migrations/2611160001_a.sql': POU_INSEGURA, 'migrations/2611160002_b.sql': `${canvi} ${drop}`, 'ordre_desplegament.json': ORDRE_R32 });
    assert.equal(result.status, 1, `${canvi}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /R6 · supabase\/migrations\/2611160002_b\.sql: (?:search_path|set_config)/, canvi);
  }
  for (const inert of [
    "select set_config('request.jwt.claims','{}',true);",
    "do $$begin perform pg_catalog.set_config('sdp.desa_el_meu_usuari','on',true); end$$;",
    'do $$begin\n  -- public ha de ser de confiança per a SET search_path = public, pg_temp.\n  null;\nend$$;',
    'do $$begin alter table public.t set schema private; end$$;',
    "do $$begin execute 'alter function public.pou(uuid) set schema private'; end$$;",
    "create function public.f() returns void language plpgsql security definer set search_path = '' as $$begin perform set_config('sdp.x','1',true); end$$;",
  ]) {
    const result = check({ 'migrations/2611160001_a.sql': POU_SEGURA, 'migrations/2611160002_b.sql': inert, 'ordre_desplegament.json': ORDRE_R32 });
    assert.equal(result.status, 0, `${inert}\n${result.stdout}\n${result.stderr}`);
  }
});

test('R32 · P2 (c) · SQL dinàmic que crea o altera una rutina amb DEFINER o search_path falla tancat', () => {
  for (const dinamic of [
    "do $do$ begin execute $f$create or replace function public.pou() returns int language sql security definer as 'select 1'$f$; end $do$;",
    "do $do$ begin execute format('create or replace function public.%I() returns int language sql security definer as %L', 'pou', 'select 1'); end $do$;",
    "do $$begin execute 'create function public.' || 'pou() returns int language sql security ' || 'definer as ''select 1'''; end$$;",
    "do $$begin execute 'alter function public.pou(uuid) security definer'; end$$;",
    "do $$begin execute 'alter function public.pou(uuid) set search_path = public'; end$$;",
    "do $$begin execute 'alter routine public.pou(uuid) reset all'; end$$;",
    "create function public.fabrica() returns void language plpgsql security definer set search_path = '' as $$begin execute 'create procedure public.p() language sql security definer as ''select 1'''; end$$;",
    "select public.executa('create function public.q() returns int language sql security definer as ''select 1''');",
  ]) {
    const result = check({ 'migrations/2611160001_a.sql': POU_SEGURA, 'migrations/2611160002_b.sql': dinamic, 'ordre_desplegament.json': ORDRE_R32 });
    assert.equal(result.status, 1, `${dinamic}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /R6 · supabase\/migrations\/2611160002_b\.sql: SQL dinàmic/, dinamic);
  }
  for (const inert of [
    "do $$begin execute 'create function public.q() returns int language sql as ''select 1'''; end$$;",
    "do $$begin raise notice 'security definer'; end$$;",
    "comment on function public.pou(uuid) is 'Funció security definer amb search_path buit';",
  ]) {
    const result = check({ 'migrations/2611160001_a.sql': POU_SEGURA, 'migrations/2611160002_b.sql': inert, 'ordre_desplegament.json': ORDRE_R32 });
    assert.equal(result.status, 0, `${inert}\n${result.stdout}\n${result.stderr}`);
  }
});

// R32 · ronda 2 · Un nom sense esquema el resol PostgreSQL amb el search_path de
// la SESSIÓ (PGlite 17: UPDATE pg_settings, ALTER SYSTEM, una funció amb SET
// cridada abans, un EXECUTE concatenat o un esquema "$user" el desvien, i
// aleshores DROP IF EXISTS és un no-op i public.pou continua definer).
const migracio = (b, a = POU_INSEGURA) => ({ 'migrations/2611160001_a.sql': a, 'migrations/2611160002_b.sql': b, 'ordre_desplegament.json': ORDRE_R32 });
const SENSE_ESQUEMA = /R6 · supabase\/migrations\/2611160002_b\.sql: (?:DROP|ALTER|CREATE OR REPLACE) [^\n]*sense esquema/;

test('R32 · ronda 2 · un DROP, ALTER o CREATE OR REPLACE de rutina sense esquema no retira ni rebaixa mai la protecció d’una definer', () => {
  const desviaments = [
    '',
    "update pg_settings set setting = 'privat2' where name = 'search_path';",
    "update pg_catalog.pg_settings set setting = 'privat2' where name = 'search_path';",
    "do $$begin execute 'se' || 't search_path = privat2'; end$$;",
    "do $$begin execute format('%s search_path = privat2', 'set'); end$$;",
    'create function public.canvia() returns void language plpgsql as $$begin set search_path = privat2; end$$; select public.canvia();',
    'create procedure public.canviap() language plpgsql as $$begin set search_path = privat2; end$$; call public.canviap();',
    'alter system set search_path = privat2;',
    "create schema postgres; create function postgres.pou(p uuid) returns int language sql as 'select 2';",
  ];
  for (const desvia of desviaments) {
    const result = check(migracio(`${desvia} drop function if exists pou(uuid);`));
    assert.equal(result.status, 1, `${desvia}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, R6_MIGRACIO, desvia);
    assert.match(result.stdout, /R6 · supabase\/migrations\/2611160002_b\.sql: DROP pou\(uuid\) sense esquema[^\n]*public\.pou\(uuid\)/, desvia);
  }
  for (const desvia of desviaments.slice(0, 2)) {
    for (const retira of [
      'drop function pou;',
      'drop routine if exists pou(uuid);',
      'drop function if exists public.altra(int), pou(uuid);',
      'create or replace function pou(p uuid) returns int language sql as $$select 2$$;',
      "create or replace function pou(p uuid) returns int language sql security definer set search_path = '' as $$select 2$$;",
      "alter function pou(uuid) set search_path = '';",
      "alter function pou set search_path = '';",
      'alter function pou(uuid) security invoker;',
      'alter routine pou(uuid) reset all;',
      'alter function pou(uuid) rename to pou2; drop function if exists public.pou2(uuid);',
      'alter function pou(uuid) set schema privat2; drop function if exists privat2.pou(uuid);',
    ]) {
      const result = check(migracio(`${desvia} ${retira}`));
      assert.equal(result.status, 1, `${desvia} ${retira}\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stdout, R6_MIGRACIO, retira);
      assert.match(result.stdout, SENSE_ESQUEMA, retira);
    }
  }
  // També en un fitxer posterior (seed): la còpia additiva aplica la mateixa regla.
  const seed = check({ 'migrations/2611160001_a.sql': POU_INSEGURA, 'seed.sql': 'drop function if exists pou(uuid);', 'ordre_desplegament.json': ORDRE_R32 });
  assert.equal(seed.status, 1, seed.stdout);
  assert.match(seed.stdout, /R6 · supabase\/seed\.sql: DROP pou\(uuid\) sense esquema/);
});

test('R32 · ronda 2 · una rutina creada sense esquema té identitat pròpia: cap operació qualificada ni un segon CREATE la retira', () => {
  const g = 'create function g() returns int language sql security definer as $$select 1$$;';
  for (const sql of [
    // PGlite: amb la ruta desviada, g() viu a privat2 i el DROP qualificat no la toca.
    `${g} drop function if exists public.g();`,
    `${g} update pg_settings set setting = 'privat2' where name = 'search_path'; create or replace function g() returns int language sql as $$select 2$$;`,
    `${g} alter function public.g() set search_path = '';`,
  ]) {
    const result = check(migracio(sql, POU_SEGURA));
    assert.equal(result.status, 1, `${sql}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /R6 · supabase\/migrations\/2611160002_b\.sql: (?:Funció security definer g\(\)|ALTER public\.g\(\))/, sql);
  }
  // Tipus ombrejat: amb `public, pg_catalog` (via pg_settings, invisible al
  // model), int4 és el domini public.int4 i g(int4) ≠ g(integer) en pg_proc.
  const ombra = "create domain public.int4 as text; update pg_settings set setting = 'public, pg_catalog' where name = 'search_path'; "
    + "create function public.g(int4) returns int language sql security definer as $$select 1$$; create or replace function public.g(integer) returns int language sql as $$select 2$$;";
  const ombrejat = check(migracio(ombra, POU_SEGURA));
  assert.equal(ombrejat.status, 1, ombrejat.stdout);
  assert.match(ombrejat.stdout, /R6 · supabase\/migrations\/2611160002_b\.sql: Funció security definer public\.g\(\?\) té una identitat de tipus no suportada/);
  // Controls verds: res a protegir, o operacions qualificades sobre el catàleg.
  for (const net of [
    'drop function if exists pou(uuid);',
    'drop function if exists inexistent(int);',
    "create function g() returns int language sql security definer set search_path = '' as $$select 1$$;",
    'create or replace function pou(p uuid) returns int language sql as $$select 2$$;',
    'alter function pou(uuid) owner to postgres;',
    'create domain public.meu as text; create function public.g(int4) returns int language sql security definer as $$select 1$$; create or replace function public.g(integer) returns int language sql as $$select 2$$;',
    'create domain public.int4 as text; create function public.g(integer) returns int language sql security definer set search_path = \'\' as $$select 1$$; create or replace function public.g(numeric) returns int language sql as $$select 2$$;',
  ]) {
    const result = check(migracio(net, POU_SEGURA));
    assert.equal(result.status, 0, `${net}\n${result.stdout}\n${result.stderr}`);
  }
  const qualificat = check(migracio('drop function if exists public.pou(uuid);'));
  assert.equal(qualificat.status, 0, qualificat.stdout);
});

test('R32 · ronda 2 · una identitat no resolta té clau estable: un DROP intermedi no fa col·lidir dues rutines', () => {
  const x = 'create function public.x(p int) returns int language sql as $$select 1$$;';
  const f = 'create function public.f(p tipus_meu) returns int language sql security definer as $$select 1$$;';
  const g = 'create function public.g(p tipus_meu) returns int language sql as $$select 1$$;';
  for (const b of [
    `${f} drop function public.x(int); ${g}`,
    `${f} drop function public.x(int); ${g} ${g.replace('public.g', 'public.h')}`,
    `drop function public.x(int); ${f} drop function if exists public.y(int); ${g}`,
  ]) {
    const result = check(migracio(b, `${x} create function public.y(p int) returns int language sql as $$select 1$$;`));
    assert.equal(result.status, 1, `${b}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /R6 · supabase\/migrations\/2611160002_b\.sql: Funció security definer public\.f\(\?\) té una identitat de tipus no suportada/, b);
  }
  // Control: sense la definer no resolta, la invoker no resolta continua verda.
  const control = check(migracio(`drop function public.x(int); ${g}`, x));
  assert.equal(control.status, 0, control.stdout);
});

test('R32 · ronda 2 · zero ReDoS: 600.000 caràcters patològics no tornen quadràtiques R1, R5, R6, R7 ni R8', () => {
  // Abans: R7 ~51 s, R5 ~10 s, R1 ~8 s, R8 ~6 s amb estes entrades (cada intent
  // travessava el fitxer); ara, uns 100 ms cadascuna. El sostre deixa marge de 20×.
  const rep = (text, n) => text.repeat(Math.ceil(n / text.length)).slice(0, n);
  const N = 600_000;
  for (const [nom, sql] of [
    ['R7 create function sense ;', `select '${rep('create function ', N)}';`],
    ['R5 grant amb ( obert', rep('grant select (', N)],
    ['R1 trigger sense on', rep('create trigger x after ', N)],
    ['R8 revoke amb ( obert', `create function f() security definer es_superadmin();${rep('revoke all on function f(', N)}`],
    ['R6 create or replace sense esquema', rep('create or replace function f();', N)],
  ]) {
    const inici = performance.now();
    const result = check({ 'migrations/2611160001_a.sql': sql });
    const ms = performance.now() - inici;
    assert.ok(result.status === 0 || result.status === 1, `${nom}: ${result.signal ?? result.status}\n${result.stderr}`);
    assert.ok(ms < 2500, `${nom}: ${Math.round(ms)} ms`);
  }
});
