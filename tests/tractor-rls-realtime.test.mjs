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
// R32.3 · Una entrada patològica acaba amb el veredicte del tractor, mai amb una
// excepció: l'exit 1 d'un RangeError de Node passava per un veredicte ràpid.
function veredicte(nom, result) {
  assert.equal(result.stderr, '', `${nom}: ${result.stderr}`);
  assert.match(result.stdout, result.status === 1 ? /❌ \[RLS\]/ : /^(?:✅|ℹ) \[RLS\]/m, `${nom}: ${result.signal ?? result.status}`);
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
    veredicte(nom, result);
    assert.ok(ms < 2500, `${nom}: ${Math.round(ms)} ms`);
  }
});

// R32.2: reconéixer codi DO estàtic no és donar per executada una branca.
const alteraDo = "alter function public.f(pg_catalog.int4) set search_path='';";
test('R32.2 R6 admet només ALTER FUNCTION qualificat i pur dins DO, sense inventar l’existència de la rutina', () => {
  for (const sql of [
    `do $do$begin if false then ${alteraDo} end if; end$do$;`,
    'create temp table pg_temp.t(id int primary key); do $$begin insert into pg_temp.t values(1) on conflict do nothing; end$$;',
    'create temp table pg_temp.t(id int primary key); do $$begin insert into pg_temp.t values(1) on conflict(id) do update set id=excluded.id; end$$;',
    `do $do$begin if true then alter function public.a() set search_path=''; else alter function public.b(pg_catalog.uuid,pg_catalog.text) set search_path=''; end if; end$do$;`,
    `do $do$declare v record; begin for v in select * from (values ('UPDATE messages'), ('INSERT INTO public.ficticia')) t(s) loop if false then ${alteraDo} end if; end loop; end$do$;`
  ]) {
    const result = check(sql);
    assert.equal(result.status, 0, `${sql}\n${result.stdout}\n${result.stderr}`);
  }
});

test('R32.2 R6 un ALTER segur condicional mai esmena ni retira una definer insegura coneguda', () => {
  const unsafe = "create function public.f(p integer) returns integer language sql security definer set search_path=public as $$select p$$;";
  for (const condicio of ['false', 'true', '1=1']) {
    const result = check(`${unsafe} do $do$begin if ${condicio} then ${alteraDo} end if; end$do$;`);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, /R6.*public\.f\(int4\).*search_path buit/);
  }
});

test('R32.2 R6 DO refusa DDL de rutina no qualificat, no pur, RESET, SECURITY i identitat opaca', () => {
  for (const ddl of [
    "alter function f(integer) set search_path='';",
    "alter function public.f set search_path='';",
    "alter function public.f(integer) set search_path='public';",
    "alter function public.f(integer) reset search_path;",
    'alter function public.f(integer) reset all;',
    'alter function public.f(integer) security invoker;',
    'alter function public.f(integer) security definer;',
    "alter function public.f(integer) set search_path='' security invoker;",
    "alter function public.f(integer) set search_path='' set search_path=public;",
    "alter function public.f(tipus_opac) set search_path='';",
    "alter function U&\"f\"() set search_path='';",
    "alter procedure public.f() set search_path='';",
    'drop function if exists public.f();',
    'create function public.f() returns integer language sql as $$select 1$$;'
  ]) {
    const result = check(`do $do$begin if false then ${ddl} end if; end$do$;`);
    assert.equal(result.status, 1, `${ddl}\n${result.stdout}`);
    assert.match(result.stdout, /R6/);
  }
});

test('R32.2 R6 manté literals DO conservadors, concatenació, format i DO imbricat sense excepció de ruta', () => {
  for (const cos of [
    "begin execute 'alter function public.f() set search_path='''' '; end",
    "begin execute format('alter function %s set search_path=%L', 'public.f()', ''); end",
    "begin execute 'alter ' || 'function public.f() set ' || 'search_path='''' '; end",
    // Encara que no hi haja EXECUTE, una cadena SQL no acredita efectes ni és un ALTER estàtic.
    "begin perform 'alter function public.f() set search_path='''' '; end",
    'begin do $dins$begin alter function public.f() set search_path=\'\'; end$dins$; end',
    "begin execute $dins$do $tercer$begin alter function public.f() set search_path=''; end$tercer$$dins$; end",
    "begin execute 'create function public.f() returns int language sql security definer as ''select 1'''; end"
  ]) {
    const result = check(`do $do$${cos}$do$;`);
    assert.equal(result.status, 1, `${cos}\n${result.stdout}`);
    assert.match(result.stdout, /R6/);
  }
});


test('R32.2 R6 preserva SET SCHEMA i RENAME TO neutrals de HEAD, sense aplicar branques al catàleg', () => {
  for (const ddl of [
    'alter function public.f(pg_catalog.int4) set schema private;',
    'alter function public.f(pg_catalog.int4) rename to altra;',
    'alter function public.f(pg_catalog.int4) rename to "nom amb espai";'
  ]) {
    const doSql = `do $do$begin if false then ${ddl} end if; end$do$;`;
    const net = check(doSql);
    assert.equal(net.status, 0, `${ddl}\n${net.stdout}`);
    const insegura = check("create function public.f(p integer) returns integer language sql security definer set search_path=public as $$select p$$;" + doSql);
    assert.equal(insegura.status, 1, `${ddl}\n${insegura.stdout}`);
    assert.match(insegura.stdout, /R6.*public\.f\(int4\).*search_path buit/);
  }
  for (const ddl of [
    'alter function f(integer) rename to altra;',
    'alter function public.f(tipus_opac) set schema private;',
    "alter function public.f(integer) set schema 'private';",
    'alter function public.f(integer) set schema private security definer;',
    'alter function public.f(integer) rename to altra security invoker;',
    'alter function public.f(integer) rename to altra reset search_path;',
    "alter function public.f(integer) set schema private set search_path='';",
    'alter function public.f(integer) rename to U&"altra";'
  ]) {
    const result = check(`do $do$begin ${ddl} end$do$;`);
    assert.equal(result.status, 1, `${ddl}\n${result.stdout}`);
    assert.match(result.stdout, /R6/);
  }
});

test('R32.2 R6 LANGUAGE quoted no evita el subconjunt DO ni es confon amb el cos', () => {
  const unsafe = "create function public.f(p integer) returns integer language sql security definer set search_path=public as $$select p$$;";
  for (const language of ["'plpgsql'", '"plpgsql"', 'plpgsql']) {
    for (const doSql of [
      body => `do language ${language} $body$${body}$body$;`,
      body => `do $body$${body}$body$ language ${language};`
    ]) {
      for (const ddl of [alteraDo, 'alter function public.f(pg_catalog.int4) set schema private;', 'alter function public.f(pg_catalog.int4) rename to g;']) {
        const accepted = check(doSql(`begin ${ddl} end`));
        assert.equal(accepted.status, 0, `${language}: ${ddl}\n${accepted.stdout}`);
        const retained = check(unsafe + doSql(`begin if false then ${ddl} end if; end`));
        assert.equal(retained.status, 1, retained.stdout);
        assert.match(retained.stdout, /R6.*public\.f\(int4\).*search_path buit/);
      }
      for (const body of [
        'begin drop function public.f(pg_catalog.int4); end',
        'begin alter function public.f(pg_catalog.int4) security invoker; end',
        "begin create function public.g() returns int language sql as 'select 1'; end",
        "begin do $nested$begin perform 1; end$nested$; end",
        "begin execute 'alter function public.f() set search_path='''' '; end"
      ]) {
        const rejected = check(doSql(body));
        assert.equal(rejected.status, 1, `${language}: ${body}\n${rejected.stdout}`);
        assert.match(rejected.stdout, /R6/);
      }
    }
  }
});

test('R32.2 R6 una capçalera DO opaca falla tancada sense fallback de DDL', () => {
  for (const sql of [
    'do language unknown $body$begin drop function public.f(); end$body$;',
    "do language 'plpgsql' language 'plpgsql' $body$begin drop function public.f(); end$body$;",
    "do U&'begin drop function public.f(); end';"
  ]) {
    const result = check(sql);
    assert.equal(result.status, 1, `${sql}\n${result.stdout}`);
    assert.match(result.stdout, /R6/);
    assert.doesNotMatch(result.stdout, /✅/);
  }
});

/* R32.2 · R0 · Troballa de la nit 1 (Peix 4 del Node 0, arbitratge Ronda 7):
 * segmentsSql absorbia fins a EOF un comentari de bloc, una cometa '…' o "…" o un
 * $tag$ sense tancar i no alçava res. PostgreSQL rebutja eixe fitxer («unterminated
 * …», PGlite 17), però el tractor el certificava en verd i no avaluava la resta. */
const BASE_R0 = 'create table public.t(id int); alter table public.t enable row level security;\n';
const AMAGAT_R0 = 'alter table public.t disable row level security;';
test('R32.2 · R0 · un comentari, una cometa, un identificador o un $tag$ sense tancar a EOF és violació explícita abans d’avaluar sentències', () => {
  for (const [tipus, sql] of [
    ['unclosedBlockComment', `${BASE_R0}/* esborrany sense tancar\n${AMAGAT_R0}`],
    ['unclosedBlockComment', `${BASE_R0}/* a /* imbricat */ encara obert\n${AMAGAT_R0}`],
    ['unclosedSingleQuote', `${BASE_R0}select 'sense tancar; ${AMAGAT_R0}`],
    ['unclosedSingleQuote', `${BASE_R0}select E'\\'; ${AMAGAT_R0}`],
    ['unclosedSingleQuote', `${BASE_R0}select 'acaba en cometa doblada''`],
    ['unclosedDoubleQuote', `${BASE_R0}select "sense tancar; ${AMAGAT_R0}`],
    ['unclosedDollarQuote', `${BASE_R0}select $cos$ sense tancar; ${AMAGAT_R0}`],
    ['unclosedDollarQuote', `${BASE_R0}select $$ sense tancar; ${AMAGAT_R0}`],
  ]) {
    const result = check(sql);
    assert.equal(result.status, 1, `${tipus}\n${sql}\n${result.stdout}`);
    assert.match(result.stdout, new RegExp(`R0 · supabase/policy\\.sql: ${tipus} \\(línia 2, columna \\d+\\)`), result.stdout);
  }
  // Abans de qualsevol regla de sentència: la primera infracció llistada és R0.
  const result = check(`insert into public.fantasma values (1);\n/* obert\n${AMAGAT_R0}`);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /❌[^\n]*\n\s+R0 · supabase\/policy\.sql: unclosedBlockComment \(línia 2, columna 1\)/);
});

test('R32.2 · R0 · també dins dels cossos executables (DO i funcions SQL/PLpgSQL), mai dins d’un literal de dades', () => {
  for (const [tipus, sql] of [
    ['unclosedBlockComment', `${BASE_R0}do $body$ begin /* sense tancar\n ${AMAGAT_R0} end $body$;`],
    ['unclosedSingleQuote', `${BASE_R0}create function public.f() returns void language plpgsql as $body$ begin perform 'sense tancar; end $body$;`],
    ['unclosedDollarQuote', `${BASE_R0}create function public.g() returns int language sql as $body$ select $x$ 1; $body$;`],
    ['unclosedBlockComment', `${BASE_R0}create function public.h() returns int language sql as 'select 1 /* obert';`],
  ]) {
    const result = check(sql);
    assert.equal(result.status, 1, `${tipus}\n${sql}\n${result.stdout}`);
    assert.match(result.stdout, new RegExp(`R0 · supabase/policy\\.sql: ${tipus} dins d'un cos executable`), result.stdout);
  }
  // Controls que PostgreSQL accepta: cap R0, cap fals positiu.
  for (const sql of [
    `${BASE_R0}select 'it''s', E'\\'' || 'x', $$a$$, $a$ $b$ x $b$ $a$, "a""b" from (select 1 as "a""b") s; /* a /* b */ c */ select 1; -- l'era\nselect 1 as "it's";`,
    `${BASE_R0}select '/* no és comentari', '$cos$ no és etiqueta', '"';`,
    `${BASE_R0}do $body$ begin raise notice 'l''era /* $x$ "'; perform set_config('application_name', 'it''s', true); end $body$;`,
    `${BASE_R0}create function public.f() returns text language sql as $body$ select 'l''era' $body$;`,
  ]) {
    const result = check(sql);
    assert.equal(result.status, 0, `${sql}\n${result.stdout}`);
    assert.doesNotMatch(result.stdout, /R0/);
  }
});

test('R32.2 · R0 · etiquetes dòlar, identificadors i prefix E amb lletres no ASCII es lligen com PostgreSQL', () => {
  // PGlite 17 aplica el DISABLE en els tres casos (relrowsecurity = false); el
  // lexer ASCII l'empassava dins d'un literal fictici i certificava en verd.
  for (const sql of [
    `${BASE_R0}select $à$ ' $à$; ${AMAGAT_R0} select $à$ ' $à$;`,
    `${BASE_R0}create domain public."àe" as text;\nselect àe'\\'; ${AMAGAT_R0} select àe'\\';--'\n`,
    `${BASE_R0}select 1 as à$x$; ${AMAGAT_R0} select 1 as b$x$;`,
  ]) {
    const result = check(sql);
    assert.equal(result.status, 1, `${sql}\n${result.stdout}`);
    assert.match(result.stdout, /R2.*public\.t/);
  }
  // I a l'inrevés: un $à$ tancat és un literal (PGlite: RLS continua activada).
  const tancat = check(`${BASE_R0}select $à$ ; ${AMAGAT_R0} $à$;`);
  assert.equal(tancat.status, 0, tancat.stdout);
});

test('R32.2 · R1 · el lexer de Codex jutja els triggers sobre codi executable amb la cerca lineal', () => {
  const trigger = taula => `create trigger baixa before delete on ${taula} execute function private.baixa()`;
  for (const sql of [`select '${trigger('public.fantasma')}';`, `-- ${trigger('public.fantasma')};\nselect 1;`]) {
    const result = check(sql);
    assert.equal(result.status, 0, `${sql}\n${result.stdout}`);
  }
  for (const sql of [`${trigger('public.fantasma')};`, `do $body$ begin ${trigger('public.fantasma')}; end $body$;`]) {
    const result = check(sql);
    assert.equal(result.status, 1, `${sql}\n${result.stdout}`);
    assert.match(result.stdout, /R1.*create trigger sobre taula inexistent: public\.fantasma/);
  }
});

test('R32.2 · R0/R1 · zero ReDoS: 200.000 caràcters patològics al lexer tancat i al codi executable R1', () => {
  const rep = (text, n) => text.repeat(Math.ceil(n / text.length)).slice(0, n);
  const N = 200_000;
  let imbricat = 'select 1;';
  for (let k = 0; k < 40; k++) imbricat = `do $n${k}$ begin ${k ? '' : rep('insert into public.x values (1); ', N)}${imbricat} end $n${k}$;`;
  for (const [nom, sql] of [
    ['comentaris imbricats oberts', rep('/*', N)],
    ['cometes E obertes', `select ${rep("e'\\", N)}`],
    ['etiquetes dòlar sense tancar', rep('$a ', N) + '$z$'],
    ['identificador no ASCII llarg', `select ${rep('à', N)}$x$`],
    ['prefixos U& i E', rep("U&e'x' ", N)],
    ['DO imbricats 40 nivells', imbricat],
    ['executes dinàmics', rep("execute 'x'; ", N)],
  ]) {
    const inici = performance.now();
    const result = check({ 'migrations/2611160001_a.sql': sql });
    const ms = performance.now() - inici;
    veredicte(nom, result);
    assert.ok(ms < 2500, `${nom}: ${Math.round(ms)} ms`);
  }
});

test('R32.2 · R1/R0 · un DO o un CREATE FUNCTION que no encapçala la sentència (darrere de begin, then…) també es llig com a cos executable', () => {
  const fantasma = 'insert into public.push_notifications_log values (1)';
  for (const sql of [
    `do $body$ begin create function public.f() returns void language plpgsql as $f$ begin ${fantasma}; end $f$; end $body$;`,
    `create function public.g() returns void language plpgsql as $g$ begin if true then create or replace function public.h() returns void language sql as $h$ ${fantasma} $h$; end if; end $g$;`,
  ]) {
    const result = check(sql);
    assert.equal(result.status, 1, `${sql}\n${result.stdout}`);
    assert.match(result.stdout, /R1.*insert into sobre taula inexistent: public\.push_notifications_log/);
  }
  const obert = check('do $body$ begin create function public.f() returns void language plpgsql as $f$ begin /* obert\n end $f$; end $body$;');
  assert.equal(obert.status, 1, obert.stdout);
  assert.match(obert.stdout, /R0 · supabase\/policy\.sql: unclosedBlockComment dins d'un cos executable \(nivell 2\)/);
  // GRANT/REVOKE EXECUTE ON és un privilegi, però una variable "on" entre cometes és SQL dinàmic.
  const privilegi = check('create function public.f() returns int language sql as $f$ select 1 $f$; revoke execute on function public.f() from public, anon; grant execute on function public.f() to authenticated;');
  assert.equal(privilegi.status, 0, privilegi.stdout);
  assert.doesNotMatch(privilegi.stdout, /detection-unknown/);
  const variable = check(`do $body$ declare "on" text := '${fantasma}'; begin execute "on"; end $body$;`);
  assert.equal(variable.status, 0, variable.stdout);
  assert.match(variable.stdout, /R1 detection-unknown.*EXECUTE dinàmic/);
  // ON CONFLICT DO NOTHING/UPDATE no és un bloc DO.
  const conflicte = check('create table public.t(id int primary key); alter table public.t enable row level security; insert into public.t values (1) on conflict do nothing; insert into public.t values (1) on conflict (id) do update set id = 2;');
  assert.equal(conflicte.status, 0, conflicte.stdout);
  assert.doesNotMatch(conflicte.stdout, /detection-unknown/);
});

/* R32.2 · Elefant (corrector del clúster tractor_rls_lexer) · Troballes dels
 * Peixos Daurats reproduïdes amb PGlite 17: en tots els casos PostgreSQL
 * aplicava el canvi (RLS desactivada, política oberta, vista definer, rutina
 * definer sense ruta) i la porta certificava ✅ amb exit 0. */
const OBERT_R0 = 'alter table public.t disable row level security;';
const estat = (sql, status, patro) => {
  const result = check(sql);
  assert.equal(result.status, status, `${typeof sql === 'string' ? sql : JSON.stringify(sql)}\n${result.stdout}`);
  if (patro) assert.match(result.stdout, patro, result.stdout);
  return result;
};

test('R32.2 · Elefant · `--` acaba en \\r com a PostgreSQL (newline = [\\n\\r]): la sentència de darrere no s’amaga', () => {
  estat(`${BASE_R0}-- nota\r${OBERT_R0}\nselect 1;\n`, 1, /R2.*public\.t/);
  estat('-- capçalera de la migració\rcreate table public.t(id int);\r', 1, /R2.*public\.t/);
  estat('-- capçalera\rcreate table public.t(id int);\ralter table public.t enable row level security;\rcreate policy obert on public.t for select using (true);', 1, /R3.*obert/);
  estat(`${BASE_R0}-- nota\rcreate function public.f() returns int language sql security definer as $$select 1$$;\n`, 1, /R6.*public\.f\(\)/);
  estat('do $b$ begin -- nota\rinsert into public.fantasma values (1); end $b$;', 1, /R1.*public\.fantasma/);
  // La posició R0 compta \r com a salt de línia.
  estat(`${BASE_R0}-- a\r/* obert\n${OBERT_R0}`, 1, /R0 · supabase\/policy\.sql: unclosedBlockComment \(línia 3, columna 1\)/);
  estat(`${BASE_R0}-- només comentari\r-- i un altre\rselect 1;`, 0);
});

test('R32.2 · Elefant · una cadena E’…’ continuada després d’un salt és el mateix literal escapable (quotecontinue)', () => {
  const amagat = `${BASE_R0}comment on table public.t is E'Taula de proves\\n'\n  'amb l\\'apòstrof';\n-- Desactiva l'RLS mentre es carrega la llavor\n${OBERT_R0}\n-- i la torna a activar (no s'ha fet)\nselect 1;\n`;
  for (const sql of [
    amagat,
    `${BASE_R0}select E'a'\r'\\''; ${OBERT_R0} -- '\n`,
    `${BASE_R0}select E'a' -- comentari horitzontal\n\v'\\''; ${OBERT_R0} -- '\n`,
    `${BASE_R0}select E'a'\n-- comentari\n  '\\''; ${OBERT_R0} -- '\n`,
    `${BASE_R0}select E'a'\n'b'\n'\\''; ${OBERT_R0} -- '\n`,
  ]) estat(sql, 1, /R2.*public\.t/);
  // Dins d'un cos executable, el mateix: R1 veu l'INSERT que el tram continuat amagava.
  const niuat = estat("do $b$ begin perform E'a'\n'\\''; insert into public.fantasma values (1); perform 1; -- '\nend $b$;", 1, /R1.*public\.fantasma/);
  assert.doesNotMatch(niuat.stdout, /R0/);
  // I a l'inrevés: PostgreSQL accepta estos literals i R0 no els pot acusar.
  for (const sql of [`${BASE_R0}comment on table public.t is E'a'\n  'l\\'era';`, `${BASE_R0}select E'a' /* bloc */ , 'b';`, `${BASE_R0}select 'a'\n'b\\';`]) {
    const result = estat(sql, 0);
    assert.doesNotMatch(result.stdout, /R0/);
  }
});

test('R32.2 · Elefant · R3 i R4 també jutgen els cossos executables (DO i funcions SQL/PLpgSQL)', () => {
  estat(`${BASE_R0}do $$ begin create policy obert on public.t for select using (true); end $$;`, 1, /R3.*obert.*cos executable DO, nivell 1/);
  estat(`${BASE_R0}create function public.f() returns void language plpgsql set search_path = '' as $$ begin if true then create policy obert on public.t for select using ((true)); end if; end $$;`, 1,
    /R3.*obert.*trivialment certa.*cos executable de funció, nivell 1/);
  estat(`${BASE_R0}do $$ begin create view public.v as select * from public.t; end $$;`, 1, /R4.*vista v.*cos executable DO/);
  estat(`${BASE_R0}do $$ begin execute 'select 1'; alter view public.v set (security_invoker = false); end $$;`, 1, /R4.*vista v/);
  // Controls: polítiques i vistes correctes dins d'un DO, i taules temporals.
  estat(`${BASE_R0}do $$ begin if not exists (select 1 from pg_policies where policyname = 'propia') then create policy propia on public.t for select using (id = 1); end if; end $$;`, 0);
  estat(`${BASE_R0}do $$ begin create view public.v with (security_invoker = true) as select * from public.t; create temp table pg_temp.x(id int); end $$;`, 0);
});

test('R32.2 · Elefant · R2 llig noms no ASCII com PostgreSQL i falla tancat amb una relació que no entén', () => {
  for (const sql of [
    'create table public.sessió(id int);',
    'create table public.sessió(id int); alter table public.sessió enable row level security; alter table public.sessió disable row level security;',
    'create table public.secret(id int); alter table public.secret enable row level security; create table if not exists public.secretà(id int);',
    // Només es plega la caixa ASCII (PGlite 17: SESSIÓ → sessiÓ, una altra taula que sessió).
    'create table public.SESSIÓ(id int); alter table public.sessió enable row level security;',
  ]) estat(sql, 1, /R2.*public\.(?:sessió|secretà|sessiÓ)/);
  estat('create table public.U&"sessi\\00f3"(id int);', 1, /R2.*CREATE TABLE amb un nom de relació que el tractor no reconeix/);
  estat('create schema s create table s.secret(id int);', 1, /R2.*CREATE SCHEMA amb elements/);
  estat('create schema if not exists private; create schema if not exists s authorization postgres;', 0);
  estat('create table public.sessió(id int); alter table public.SESSIó enable row level security;', 0);
  estat('create table public."Sessió"(id int); alter table public."Sessió" enable row level security;', 0);
});

test('R32.2 · Elefant · R0 · el lexer suposa standard_conforming_strings = on: cap altre valor, RESET ni set_config', () => {
  estat({
    'migrations/2611160001_a.sql': `${BASE_R0}set standard_conforming_strings = off;`,
    'migrations/2611160002_b.sql': `select 'x\\', '; ${OBERT_R0} select '\\', ';`,
  }, 1, /R0 · supabase\/migrations\/2611160001_a\.sql: standardConformingStrings \(sentència 3\)/);
  for (const sql of [
    'set session standard_conforming_strings to false;',
    'reset standard_conforming_strings;',
    "select set_config('standard_conforming_strings', 'off', false);",
    "update pg_settings set setting = 'off' where name = 'standard_conforming_strings';",
    'alter role authenticated set standard_conforming_strings = off;',
    'alter database postgres set standard_conforming_strings to off;',
    "create function public.f() returns int language plpgsql set standard_conforming_strings = off as $$ begin return 1; end $$;",
    'do $$ begin set local standard_conforming_strings = off; end $$;',
    "do $$ begin execute 'set standard_conforming_strings = off'; end $$;",
    'set u&"standard_conforming_string\\0073" = off;',
  ]) estat(sql, 1, /R0 · supabase\/policy\.sql: standardConformingStrings/);
  for (const sql of ['set standard_conforming_strings = on;', "set standard_conforming_strings to 'on';", 'show standard_conforming_strings;', 'do $$ begin set local standard_conforming_strings = true; end $$;']) {
    const result = estat(sql, 0);
    assert.doesNotMatch(result.stdout, /R0/);
  }
});

test('R32.2 · Elefant · R1 · EXECUTE FUNCTION|PROCEDURE només s’excusa dins de CREATE TRIGGER, i un cos U&’…’ no s’interpreta', () => {
  for (const sql of [
    `${BASE_R0}do $$ declare function text := '${OBERT_R0}'; begin execute function; end $$;`,
    `${BASE_R0}do $$ declare procedure text := '${OBERT_R0}'; begin execute procedure; end $$;`,
    "create function public.f() returns void language plpgsql as U&'begin \\0069nsert into public.fantasma values (1); end';",
    "create function public.f() returns void language plpgsql as U&'begin !0069nsert into public.fantasma values (1); end' uescape '!';",
  ]) {
    const result = estat(sql, 0, /R1 detection-unknown/);
    assert.doesNotMatch(result.stdout, /✅/);
  }
  // R32.3 · Un DO U&'…' és opac i R6 el tanca (prova de Codex «capçalera DO
  // opaca»): PGlite 17 hi executa el DISABLE amagat, i un roig és més estricte
  // que la informació R1 que en fixava la primera versió d'esta prova.
  const opac = estat(`${BASE_R0}do U&'begin \\0065xecute ''${OBERT_R0}''; end';`, 1, /R6.*Cos DO amb escapaments no interpretats/);
  assert.match(opac.stdout, /R1 detection-unknown/);
  assert.doesNotMatch(opac.stdout, /✅/);
  for (const sql of [
    "create table public.t(id int); alter table public.t enable row level security; create function public.tf() returns trigger language plpgsql set search_path = '' as $$ begin return new; end $$;\ncreate trigger a before insert on public.t for each row execute function public.tf();\ncreate or replace trigger b before update on public.t for each row execute procedure public.tf();\ncreate constraint trigger c after insert on public.t for each row execute function public.tf();",
    "do $$ begin create trigger a before insert on public.t for each row execute function public.tf(); end $$;",
  ]) {
    const result = check(sql);
    assert.doesNotMatch(result.stdout, /detection-unknown/, `${sql}\n${result.stdout}`);
  }
});

test('R32.2 · Elefant · R4 · security_invoker es llig de la clàusula WITH, també en RECURSIVE, noms entre cometes i ALTER VIEW|TABLE', () => {
  for (const sql of [
    'create recursive view public.v(n) as select 1 union all select n + 1 from v where n < 2;',
    'create view public.v with (security_invoker = true) as select * from public.t;\nalter view public.v set (security_invoker = false);',
    'create view public.v with (security_invoker = true) as select * from public.t; alter table public.v set (security_invoker = false);',
    'create view public.v with (security_invoker = true) as select * from public.t; alter view if exists public.v reset (security_invoker);',
    "create view public.v as select *, 'security_invoker = true' as nota from public.t;",
    'create view public.v as select * from public.t security_invoker_true;',
    'create view "v" as select * from public.t;',
    'create or replace temp view v as select 1;',
  ]) estat(`${BASE_R0}${sql}`, 1, /R4/);
  for (const sql of [
    'create or replace view public.organization_directory with (security_invoker = true, security_barrier = true) as select * from public.t;\nalter view public.organization_directory set (security_invoker = true, security_barrier = true);',
    "create view public.v with (security_invoker) as select 'security_invoker = false' as x from public.t;",
    'create view public.v (a) with (security_barrier = true, security_invoker = on) as select id from public.t; alter view public.v reset (security_barrier);',
  ]) estat(`${BASE_R0}${sql}`, 0);
});

test('R32.2 · Elefant · R3 · una expressió USING/WITH CHECK trivialment certa és una política oberta', () => {
  for (const clausula of [
    'using ((true))', 'using (1=1)', 'using (true or id > 0)', "using ('t'::bool)", 'using (not false)',
    'using (cast(true as boolean))', 'using ((id > 0) or (true))', "using (auth.uid() is null or 'a' = 'a')", 'with check (((true)))',
  ]) estat(`${BASE_R0}create policy obert on public.t for all ${clausula};`, 1, /R3.*obert/);
  estat(`${BASE_R0}create policy "Obert" on "t" for select using (true);`, 1, /R3.*"Obert" sobre t/);
  estat('create schema towns; create table towns.secret(id int); alter table towns.secret enable row level security; create policy obert on towns.secret for select using (true);', 1, /R3.*obert.*sobre secret/);
  for (const clausula of ['using (id = 1)', 'using (1 = 2)', 'using (true and id > 0)', 'using (id >= id)', "with check ((select auth.uid()) = '00000000-0000-0000-0000-000000000000'::uuid)"]) {
    estat(`${BASE_R0}create policy tancat on public.t for all ${clausula};`, 0);
  }
  estat('create table public.towns(id int); alter table public.towns enable row level security; create policy publica on public.towns for select using ((true));', 0);
});

test('R32.2 · Elefant · zero ReDoS: 200.000 caràcters patològics a les correccions noves', () => {
  const rep = (text, n) => text.repeat(Math.ceil(n / text.length)).slice(0, n);
  const N = 200_000;
  const parens = N / 2;
  for (const [nom, sql] of [
    ['continuacions E', `select ${rep("E'a'\n", N)};`],
    ['espai llarg sense continuació', `select E'a'${rep(' \n', N)}x;`],
    ['comentaris \\r', rep('-- x\r', N)],
    ['parèntesis R3', `create policy p on public.t using ${'('.repeat(parens)}true${')'.repeat(parens)};`],
    ['OR R3 pla', `create policy p on public.t using (${rep('x or ', N)}x);`],
    ['OR R3 imbricat', `create policy p on public.t using ${rep('(x or ', N)}x;`],
    ['opcions R4', `create view public.v with (${rep('security_invoker, ', N)}x) as select 1;`],
    ['standard_conforming_strings', rep('show standard_conforming_strings; ', N)],
    ['DO amb DDL', `do $$ begin ${rep('alter table public.t enable row level security; ', N)} end $$;`],
    ['executes i triggers', `do $$ begin ${rep('create trigger x execute function f; ', N)} end $$;`],
  ]) {
    const inici = performance.now();
    const result = check({ 'migrations/2611160001_a.sql': sql });
    const ms = performance.now() - inici;
    veredicte(nom, result);
    assert.ok(ms < 2500, `${nom}: ${Math.round(ms)} ms`);
  }
});

/* R32.3 · Àrbitre del clúster rls (fusió a 3 vies de Codex R32.2 i Claude R32.2):
 * defectes reproduïts contra una de les dues versions, amb PGlite 17 quan tenen
 * efecte a PostgreSQL. */
test('R32.3 · R6 · un tipus ombrejat es detecta encara que el CREATE DOMAIN no siga la primera sentència', () => {
  // PGlite 17: amb `public, pg_catalog`, g(int4) és g(public.int4) i continua sent
  // SECURITY DEFINER al costat de la invoker g(integer). El codi R1 no porta `;`:
  // llegir-hi els tipus deixava veure només el primer CREATE del fitxer (porta ✅).
  const ombra = "create domain public.int4 as text; update pg_settings set setting = 'public, pg_catalog' where name = 'search_path'; create function public.g(int4) returns int language sql security definer as $$select 1$$; create or replace function public.g(integer) returns int language sql as $$select 2$$;";
  for (const davant of ['', 'select 1;\n', `-- capçalera\n${BASE_R0}`]) {
    estat(davant + ombra, 1, /R6.*public\.g\(\?\) té una identitat de tipus no suportada/);
  }
});

test('R32.3 · R5 · el nom de taula d’un GRANT es plega com el de les polítiques del codi R1', () => {
  const taula = 'create table public.MyTable(id int); alter table public.MyTable enable row level security;';
  estat(`${taula} create policy p on public.MyTable for select using (id = 1); grant select on public.MyTable to anon;`, 0);
  estat(`${taula} grant select on public.MyTable to anon;`, 1, /R5.*mytable/);
});

test('R32.3 · R1 · un cos continuat en dos literals estàndard es llig sencer', () => {
  // PGlite 17: prosrc = 'begin insert into public.fantasma values (1); end'.
  estat("create function public.f() returns void language plpgsql as 'begin '\n'insert into public.fantasma values (1); end';", 1, /R1.*public\.fantasma/);
  estat("do 'begin '\n  'insert into public.fantasma values (1); end';", 1, /R1.*public\.fantasma/);
});

test('R32.3 · R0 · un parèntesi obert a EOF i més de 32 cossos imbricats fallen tancats', () => {
  estat(`${BASE_R0}select (1;\n${OBERT_R0}`, 1, /R0 · supabase\/policy\.sql: unclosedParenthesis \(línia 2, columna 8\)/);
  estat(`${BASE_R0}do $$ begin perform (1; ${OBERT_R0} end $$;`, 1, /R0 · supabase\/policy\.sql: unclosedParenthesis dins d'un cos executable \(nivell 1\)/);
  const tancat = estat(`${BASE_R0}select ((1) + (2)) as "(", '(', $$($$; -- (\n/* ( */ select 1;`, 0);
  assert.doesNotMatch(tancat.stdout, /R0/);
  const niu = (nivells, cos) => { let sql = cos; for (let k = 0; k < nivells; k++) sql = `do $n${k}$ begin ${sql} end $n${k}$;`; return sql; };
  estat(niu(32, 'insert into public.fantasma values (1);'), 1, /R1.*public\.fantasma/);
  const fora = estat(niu(33, 'insert into public.fantasma values (1);'), 1, /R0 · supabase\/policy\.sql: nestingLimit dins d'un cos executable \(nivell 33\)/);
  assert.doesNotMatch(fora.stdout, /✅/);
});

test('R32.3 · R1 · 150.000 EXECUTE dins d’un cos no fan petar el tractor (cap spread de vectors grans)', () => {
  const result = check(`do $$ begin ${"execute 'x';".repeat(150_000)} end $$;`);
  veredicte('150.000 EXECUTE en un DO', result);
  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /R1 detection-unknown.*EXECUTE dinàmic/);
});

/* R32.3 · Elefant (corrector del clúster rls) · Troballes P1 del Peix
 * reproduïdes amb PGlite 17 contra el tractor de l'àrbitre: en tots els casos
 * PostgreSQL aplicava el canvi i la porta donava exit 0. */
test('R32.3 · Elefant · R3/R4 · cada DDL d’un cos executable es jutja, encara que una etiqueta o una variable `alter` el precedisca', () => {
  // PGlite 17: política `true`, vista sense reloptions i RESET de security_invoker aplicats.
  estat(`${BASE_R0}do $$ <<alter>> begin create policy obert on public.t for select using (true); end $$;`, 1, /R3.*obert.*cos executable DO, nivell 1/);
  estat(`${BASE_R0}do $$ declare alter int; begin if alter is null then create view public.v as select * from public.t; end if; end $$;`, 1, /R4.*vista v.*cos executable DO/);
  estat(`${BASE_R0}create view public.v with (security_invoker = true) as select * from public.t;\ncreate function public.f() returns void language plpgsql set search_path = '' as $$ <<alter>> begin alter view public.v reset (security_invoker); end $$;`, 1,
    /R4.*RESET \(security_invoker …\) deixa la vista v.*cos executable de funció, nivell 1/);
  // Un rol que es diu alter no talla la política.
  estat(`${BASE_R0}do $$ begin create policy obert on public.t for select to alter using (true); end $$;`, 1, /R3.*obert/);
  estat(`${BASE_R0}do $$ <<alter>> begin create policy propia on public.t for select to alter using (id = 1); end $$;`, 0);
});

test('R32.3 · Elefant · R1 · els tokens només salten l’espai de PostgreSQL: `execute \\u00a0on` és SQL dinàmic, no el privilegi EXECUTE ON', () => {
  // Per a PostgreSQL, U+00A0 és part de l'identificador: PGlite 17 executa la variable
  // `\u00a0on` (DISABLE aplicat). Amb el \s de JS, la porta hi veia EXECUTE ON i donava ✅.
  for (const espai of ['\u00a0', '\ufeff', '\u2003']) {
    const variable = estat(`${BASE_R0}do $$ declare ${espai}on text := '${OBERT_R0}'; begin execute ${espai}on; end $$;`, 0, /R1 detection-unknown.*EXECUTE dinàmic/);
    assert.doesNotMatch(variable.stdout, /✅/);
  }
  const privilegi = estat('create function public.f() returns int language sql as $f$ select 1 $f$; revoke grant option for execute on function public.f() from authenticated; alter default privileges in schema public revoke execute on functions from public;', 0);
  assert.doesNotMatch(privilegi.stdout, /detection-unknown/);
});

test('R32.3 · Elefant · R0 · standard_conforming_strings es tanca pel mecanisme (set_config, pg_settings, U&"…") a tots els nivells', () => {
  // La migració b amaga un DISABLE que PostgreSQL executa quan a ha posat off.
  const amagat = `select 'x\\', '; ${OBERT_R0} select '\\', ';`;
  estat({ 'migrations/2611160001_a.sql': `${BASE_R0}update pg_settings set setting = 'off' where name like 'standard%conforming%strings';`, 'migrations/2611160002_b.sql': amagat }, 1,
    /R0 · supabase\/migrations\/2611160001_a\.sql: standardConformingStrings \(sentència 3\)[^\n]*pg_settings fora de la forma/);
  estat({ 'migrations/2611160001_a.sql': `${BASE_R0}create function public.x() returns void language plpgsql as $$ begin perform set_config('standard_' || 'conforming_strings', 'off', false); end $$;\nselect public.x();`, 'migrations/2611160002_b.sql': amagat }, 1,
    /R0 · supabase\/migrations\/2611160001_a\.sql: standardConformingStrings dins d'un cos executable \(nivell 1, sentència 3\)[^\n]*set_config sense un nom/);
  // PGlite 17: current_setting('standard_conforming_strings') = off després de cadascuna.
  for (const sql of [
    "update pg_settings s set setting = 'off' where s.name like 'standard%';",
    "update pg_settings set setting = 'off' where name in ('standard_' || 'conforming_strings');",
    "create view public.ps with (security_invoker = true) as select * from pg_settings; update public.ps set setting = 'off' where name like 'standard%';",
    "create rule rr as on insert to public.t do also update pg_settings set setting = 'off' where name like 'standard%'; insert into public.t values (1);",
    'update U&"pg\\005fsettings" set setting = \'off\' where name like \'standard%\';',
    "select U&\"set\\005fconfig\"('standard_' || 'conforming_strings', 'off', false);",
    "create function public.w(text) returns text language sql as $$ select set_config($1, 'off', false) $$; select public.w('standard_' || 'conforming_strings');",
    "do $$ begin execute 'update pg_settings set setting = ''off'' where name like ''standard%'''; end $$;",
    "create function public.sc(text, text, boolean) returns text language internal as 'set_config_by_name'; select public.sc('standard_' || 'conforming_strings', 'off', false);",
  ]) estat(`${BASE_R0}${sql}`, 1, /R0 · supabase\/policy\.sql: standardConformingStrings/);
  // Controls: una sola GUC amb nom literal pur, també dins de cossos (com al catàleg).
  for (const sql of [
    "update pg_settings set setting = 'x' where name = 'application_name'; update only pg_catalog.pg_settings set setting = 'y' where name = 'application_name';",
    "do $$ begin update pg_settings set setting = 'z' where name = 'application_name'; end $$;",
    "create function public.f(v int) returns void language plpgsql set search_path = '' as $$ begin perform pg_catalog.set_config('sdp.notes_bytes_peticio', v::text, true); end $$;",
    "select set_config('request.jwt.claims', '{}', true), current_setting('request.jwt.claims');",
  ]) {
    const result = estat(`${BASE_R0}${sql}`, 0);
    assert.doesNotMatch(result.stdout, /R0/);
  }
});

test('R32.3 · Elefant · zero ReDoS: 200.000 caràcters patològics als DDL dels cossos i al mecanisme R0', () => {
  const rep = (text, n) => text.repeat(Math.ceil(n / text.length)).slice(0, n);
  const N = 200_000;
  for (const [nom, sql] of [
    ['vistes sense separador en un DO', `do $$ begin ${rep('create view public.v with (security_invoker = true) as select 1 ', N)} end $$;`],
    ['alter table sense separador en un DO', `do $$ begin ${rep('alter table ', N)} end $$;`],
    ['etiquetes <<alter>>', `${BASE_R0}do $$ ${rep('<<alter>> ', N)} begin create policy p on public.t using (id = 1); end $$;`],
    ['UPDATE pg_settings purs', rep("update pg_settings set setting = 'x' where name = 'application_name'; ", N)],
    ['set_config purs', `select ${rep("set_config('a.b', 'x', true), ", N)} 1;`],
  ]) {
    const inici = performance.now();
    const result = check({ 'migrations/2611160001_a.sql': sql });
    const ms = performance.now() - inici;
    veredicte(nom, result);
    assert.ok(ms < 2500, `${nom}: ${Math.round(ms)} ms`);
  }
});
