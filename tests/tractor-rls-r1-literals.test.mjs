/** R32: R1 distingix codi executable i dades amb el lexer del tractor. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const gate = fileURLToPath(new URL('../tooling/gates/tractor-rls.mjs', import.meta.url));
function check(sql) {
  const cwd = mkdtempSync(join(tmpdir(), 'sdp-r32-rls-r1-'));
  try {
    mkdirSync(join(cwd, 'supabase'));
    writeFileSync(join(cwd, 'supabase/policy.sql'), sql);
    return spawnSync(process.execPath, [gate], { cwd, encoding: 'utf8' });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
const insert = 'insert into public.push_notifications_log values (1)';
const assertGhost = sql => {
  const result = check(sql);
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /R1.*insert into sobre taula inexistent: public\.push_notifications_log/);
};

test('R1 ignora literals VALUES, replace, dollar-quotes i comentaris sense inventar DML o RLS', () => {
  for (const sql of [
    `values ('${insert}', 'create table public.fakeSenseRLS(id int)');`,
    `select replace('${insert}', 'insert into public.', 'insert into private.');`,
    `values ($text$${insert}$text$);`,
    `-- ${insert};\n/* ${insert}; /* imbricat */ */ select 1;`,
    `do $body$ declare spec text; begin for spec in select * from (values ('${insert}')) v(s) loop perform replace(spec, 'insert into', 'text'); end loop; end $body$;`
  ]) {
    const result = check(sql);
    assert.equal(result.status, 0, `${sql}\n${result.stdout}`);
    assert.doesNotMatch(result.stdout, /R1.*taula inexistent|R2.*fakeSenseRLS|detection-unknown/);
  }
});

test('R1 detecta el mateix INSERT real de nivell superior i dins de cossos SQL/PLpgSQL', () => {
  for (const sql of [
    `${insert};`,
    'INSERT /* no és literal */\nINTO public.push_notifications_log values(1);',
    `do $body$ begin perform '${insert}'; /* ${insert}; */ ${insert}; end $body$;`,
    `create function public.f() returns void language plpgsql as $body$ begin ${insert}; end $body$;`,
    `create function public.f() returns void as '${insert};' language sql;`,
    `create procedure public.f() language plpgsql as $body$ begin ${insert}; end $body$;`
  ]) assertGhost(sql);
});

test('R1 un CREATE TABLE literal no acredita la taula d’un INSERT executable', () => {
  const result = check("values ('create table public.fakeSenseRLS(id int)'); insert into public.fakeSenseRLS values(1);");
  assert.equal(result.status, 1, result.stdout);
  assert.match(result.stdout, /R1.*taula inexistent: public\.fakesenserls/);
  assert.doesNotMatch(result.stdout, /R2/);
});

test('R1 un CREATE TABLE real continua acreditant el destí, també dins de DO', () => {
  for (const sql of [
    'create temp table pg_temp.known_row(id int); insert into pg_temp.known_row values(1);',
    'do $body$ begin create temp table pg_temp.known_row(id int); insert into pg_temp.known_row values(1); end $body$;'
  ]) {
    const result = check(sql); assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /detection-unknown/);
  }
});

test('R1 SQL dinàmic queda detection-unknown i no s’imprimix una acreditació verda', () => {
  for (const sql of [
    `do $body$ begin execute '${insert}'; end $body$;`,
    `create function public.f() returns void language plpgsql as $body$ begin execute format('%s', '${insert}'); end $body$;`,
    "create function public.f() returns void language plpgsql as E'begin\\ninsert into public.push_notifications_log values(1); end';"
  ]) {
    const result = check(sql); assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /R1 detection-unknown/);
    assert.match(result.stdout, /no queda acreditat/);
    assert.doesNotMatch(result.stdout, /✅|R1.*taula inexistent/);
  }
});

test('R1 text inert no amaga un INSERT real posterior a SQL dinàmic desconegut', () => {
  assertGhost(`do $body$ begin execute '${insert}'; ${insert}; end $body$;`);
});

// R32.2: el tall de sentències és una frontera, també fora de CREATE FUNCTION.
for (const [tipus, fragments] of [
  ['unclosedBlockComment', ['/*', '/* exterior /* interior */', '/* tancat */ /* obert']],
  ['unclosedSingleQuote', ["select '", "select 'doblada''", "select E'escapat\\'", "select E'barra final\\"]],
  ['unclosedDoubleQuote', ['select "', 'select "doblada""']],
  ['unclosedDollarQuote', ['select $$', 'select $cos$cos', 'select $cos$altre $COS$']]
]) test(`R0 rebutja ${tipus} en EOF sense donar verd ni perdre l'origen`, () => {
  for (const fragment of fragments) {
    const result = check(`select 1;\n${fragment}`);
    assert.equal(result.status, 1, `${fragment}\n${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, new RegExp(`R0.*policy\\.sql.*${tipus}`));
    assert.doesNotMatch(result.stdout, /✅/);
    assert.doesNotMatch(result.stderr, /SyntaxError|at .*tractor/);
  }
});

test('R0 només falla amb delimitadors oberts: comentaris, cometes, E-strings i dollar quotes tancats són inerts', () => {
  for (const sql of [
    'select 1; -- comentari final sense salt',
    '/* exterior /* interior */ exterior */ select 1;',
    "select 'doblada'' i tancada';",
    'select "doblada"" i tancada";',
    "select E'escapat\\\\\\' i tancat';",
    'select $cos$literal \' " /* $$ $cos$;'
  ]) {
    const result = check(sql);
    assert.equal(result.status, 0, `${sql}\n${result.stdout}\n${result.stderr}`);
    assert.doesNotMatch(result.stdout, /R0/);
  }
});

test('R0 també rebutja delimitadors sense tancar en un cos SQL contingut en un literal vàlid', () => {
  for (const fragment of ["select 'oberta", 'select "obert', '/* obert', 'select $cos$obert']) {
    const result = check(`do $extern$begin ${fragment} end$extern$;`);
    assert.equal(result.status, 1, `${fragment}\n${result.stdout}`);
    assert.match(result.stdout, /R0.*unclosed/);
    assert.doesNotMatch(result.stdout, /✅/);
  }
});

// El nom de LANGUAGE pot ser un literal; no és el cos executable del DO.
test('R32.2 R0/R1 distingix LANGUAGE literal del cos DO abans i després del codi', () => {
  for (const language of ["'plpgsql'", '"plpgsql"', 'plpgsql']) {
    for (const doSql of [
      body => `do language ${language} $body$${body}$body$;`,
      body => `do $body$${body}$body$ language ${language};`
    ]) {
      assertGhost(doSql(`begin ${insert}; end`));
      const valid = check(doSql('begin perform 1; end'));
      assert.equal(valid.status, 0, valid.stdout);
      for (const fragment of ['/* open', "select 'open", 'select "open', 'select $inner$open']) {
        const broken = check(doSql(`begin ${fragment}`));
        assert.equal(broken.status, 1, `${language}: ${fragment}\n${broken.stdout}`);
        assert.match(broken.stdout, /R0.*unclosed/);
        assert.doesNotMatch(broken.stdout, /✅/);
      }
    }
  }
});

test('R32.2 R0 reconeix tags dollar PostgreSQL Unicode, inclosos emoji', () => {
  for (const tag of ['é', 'aé', '漢字', '😀']) {
    const open = check(`select $${tag}$open`);
    assert.equal(open.status, 1, `${tag}\n${open.stdout}`);
    assert.match(open.stdout, /R0.*unclosedDollarQuote/);
    assert.doesNotMatch(open.stdout, /✅/);
    const closed = check(`select $${tag}$inert ' " /* $$ $${tag}$;`);
    assert.equal(closed.status, 0, `${tag}\n${closed.stdout}`);
    assert.doesNotMatch(closed.stdout, /R0|detection-unknown/);
    const nested = check(`do $${tag}$begin /* open end$${tag}$;`);
    assert.equal(nested.status, 1, `${tag}\n${nested.stdout}`);
    assert.match(nested.stdout, /R0.*unclosedBlockComment/);
  }
});
