// P0-05 · P0-21 (marató 261101_2143, carril L13-B3-MIGRACIONS): verificador estàtic de migracions.
// Carpetes temporals fora del repositori i l'arbre real només en lectura; cap xarxa ni base de dades.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as V from '../scripts/supabase/verifica-migracions.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(REPO, 'scripts/supabase/verifica-migracions.mjs');
const ARA = new Date('2026-11-02T00:30:00Z');
const CAT = new Map([['public.f', 'volatile'], ['public.g', 'stable'], ['private.h', 'immutable']]);
const ORDRE_BUIT = { esquema: 'sdp.ordre-desplegament.v1' };
const NO_ACREDITAT = 'Estat remot no acreditat; comprovar abans d’aplicar';
const NO_APLICADA = "**NO aplicada: l'aplica el Mestre**";
// Les set NO aplicades de HEAD b5878593a (abans de les migracions noves d'esta nit).
const PENDENTS_HEAD = ['2610311500', '2610311800', '2610311900', '2610312000', '2611011500', '2611011510', '2611011800'];

const sqlBase = (cos, cap = '') => `-- Prova.${cap ? `\n${cap}` : ''}\n-- Idempotent i en una sola transacció; NO aplicada: l'aplica el Mestre, mai un agent.\nbegin;\n${cos}\ncommit;\n`;

function readmeDe(migracions, { estats = {}, nota = '', vinyetes = {}, sql = '' } = {}) {
  const noms = Object.keys(migracions).sort();
  const bullets = noms.map((n) => `- \`migrations/${n}\`\n  Prova.${vinyetes[n.slice(0, 10)] ? ` ${vinyetes[n.slice(0, 10)]}` : ''}\n`).join('\n');
  const files = noms.map((n, i) => `| ${String(i + 1).padStart(2, '0')} | \`${n.slice(0, 10)}\` | \`${n}\` | ${estats[n.slice(0, 10)] ?? NO_ACREDITAT} | prova |`).join('\n');
  return `# Supabase\n\n## Fitxers\n\n${bullets}\n- \`seed.sql\`\n  Contingut.\n\n## Ordre correcte\n\n1. Executar en ordre alfabètic.\n\n${sql}\n### Nota d'auditoria \`DF-06\` (\`P0-05\`) i seqüència\n\n${nota}\n\n### Taula canònica\n\n| Ordre | Versió | Fitxer | Estat declarat | Objectiu |\n| :---: | :--- | :--- | :--- | :--- |\n${files}\n`;
}

function arbre({ migracions, readme, ordre, extra = {} }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-migr-'));
  fs.mkdirSync(path.join(dir, 'supabase/migrations'), { recursive: true });
  for (const [n, sql] of Object.entries(migracions)) fs.writeFileSync(path.join(dir, 'supabase/migrations', n), sql);
  fs.writeFileSync(path.join(dir, 'supabase/README.md'), typeof readme === 'string' ? readme : readmeDe(migracions, readme ?? {}));
  if (ordre !== null) fs.writeFileSync(path.join(dir, 'supabase/ordre_desplegament.json'), JSON.stringify(ordre ?? ORDRE_BUIT));
  for (const [rel, text] of Object.entries(extra)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}

function amb(opcions, fn) {
  const dir = arbre(opcions);
  try { return fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

/** Còpia de supabase/ (i del contracte) de l'arbre real, amb mutacions opcionals. */
function ambCopiaReal(mutacions, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-migr-real-'));
  try {
    fs.cpSync(path.join(REPO, 'supabase/migrations'), path.join(dir, 'supabase/migrations'), { recursive: true });
    for (const rel of ['supabase/README.md', 'supabase/ordre_desplegament.json', 'src/data/contracte.js']) {
      let text = fs.readFileSync(path.join(REPO, rel), 'utf8');
      if (mutacions[rel]) text = mutacions[rel](text);
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), text);
    }
    return fn(dir);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

const codis = (r) => r.errors.map((e) => e.codi);
const avisos = (r) => r.avisos.map((e) => e.codi);
let real = null;
const informeReal = () => (real ??= V.verifica({ arrel: REPO, ara: ARA }));
const catalegDe = (informe) => new Map(Object.entries(informe.catalegFuncions));
const blocsSql = (md) => [...md.matchAll(/```sql\n([\s\S]*?)```/g)].map((m) => m[1]);

test('lèxic: ; dins de literals, E-strings, identificadors, cossos i comentaris imbricats', () => {
  const sql = [
    "select ';' as a;",
    "select E'\\';' as b;",
    'select "a;b" from t;',
    'create function f() returns int as $$ select 1; $$ language sql;',
    'create function g() returns int as $f$ begin return 1; end $f$ language plpgsql;',
    '/* /* ; */ ; */ select $1;'
  ].join('\n');
  const st = V.sentencies(sql);
  assert.deepEqual(st.map((s) => s.linia), [1, 2, 3, 4, 5, 6]);
  assert.ok(st.every((s) => !s.senseTancar));
  assert.equal(st[5].text, 'select $1');
  assert.equal(V.sentencies('create function f() returns int as $$ select 1;').at(-1).senseTancar, true);
  assert.equal(V.sentencies("select 'obert;").at(-1).senseTancar, true);
  assert.equal(V.sentencies('select 1; /* sense tancar').at(-1).senseTancar, true);
  assert.equal(V.sentencies('select 1').at(-1).senseTancar, true);
});

test('noms i versions: convenció, data real, futur i duplicades', () => {
  assert.deepEqual(V.validaNom('2611020000_nom_nou.sql', ARA).errors, []);
  for (const n of ['2613010000_x.sql', '2602300000_x.sql', '2610012460_x.sql', '2602290000_x.sql']) assert.ok(V.validaNom(n, ARA).errors.some((e) => e.codi === 'E-DATA'), n);
  for (const n of ['2610012300_X.sql', '2610012300-x.sql', '2610012300_x_.sql']) assert.ok(V.validaNom(n, ARA).errors.some((e) => e.codi === 'E-NOM'), n);
  const traspas = V.validaNom('2802290000_x.sql', ARA);
  assert.deepEqual(traspas.errors, []);
  assert.deepEqual(traspas.avisos.map((a) => a.codi), ['A-VERSIO-FUTURA']);
  amb({ migracions: { '2611010000_a.sql': sqlBase('select 1;'), '2611010000_b.sql': sqlBase('select 1;') } }, (dir) => {
    assert.ok(codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-DUPLICADA'));
  });
  // idea del kit de Codex: un enllaç simbòlic no és cap migració aprovada
  amb({ migracions: { '2611010000_a.sql': sqlBase('select 1;') } }, (dir) => {
    fs.symlinkSync('2611010000_a.sql', path.join(dir, 'supabase/migrations/2611010100_b.sql'));
    assert.ok(codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-FITXER-NO-REGULAR'));
  });
});

const regles = (sql) => V.analitzaIdempotencia(V.sentencies(sql)).troballes.filter((t) => t.nivell === 'avis').map((t) => t.regla);

test('idempotència: cada regla salta i la forma guardada no', () => {
  const casos = [
    ['TAULA_SENSE_IF_NOT_EXISTS', 'create table t (id int);', 'create table if not exists t (id int);'],
    ['TAULA_SENSE_IF_NOT_EXISTS', 'create table t (id int);', 'drop table if exists t; create table t (id int);'],
    ['INDEX_SENSE_IF_NOT_EXISTS', 'create index i on t (c);', 'create index if not exists i on t (c);'],
    ['INDEX_SENSE_IF_NOT_EXISTS', 'create unique index i on t (c);', 'drop index if exists i; create unique index i on t (c);'],
    ['SCHEMA_SENSE_IF_NOT_EXISTS', 'create schema s;', 'create schema if not exists s;'],
    ['EXTENSION_SENSE_IF_NOT_EXISTS', 'create extension pgcrypto;', 'create extension if not exists pgcrypto;'],
    ['SEQUENCE_SENSE_IF_NOT_EXISTS', 'create sequence q;', 'create sequence if not exists q;'],
    ['FUNCIO_SENSE_OR_REPLACE', 'create function f() returns int language sql as $$ select 1 $$;', 'create or replace function f() returns int language sql as $$ select 1 $$;'],
    ['FUNCIO_SENSE_OR_REPLACE', 'create function f() returns int language sql as $$ select 1 $$;', 'drop function if exists f(); create function f() returns int language sql as $$ select 1 $$;'],
    ['VISTA_SENSE_OR_REPLACE', 'create view v as select 1;', 'create or replace view v as select 1;'],
    ['POLITICA_SENSE_DROP_PREVI', 'create policy "p q" on t for select using (true);', 'drop policy if exists "p q" on public.t; create policy "p q" on t for select using (true);'],
    ['TRIGGER_SENSE_DROP_PREVI', 'create trigger g before insert on t for each row execute function f();', 'drop trigger if exists g on t; create trigger g before insert on t for each row execute function f();'],
    ['TRIGGER_SENSE_DROP_PREVI', 'create trigger g before insert on t for each row execute function f();', 'create or replace trigger g before insert on t for each row execute function f();'],
    ['TIPUS_SENSE_GUARDA', "create type e as enum ('a');", "drop type if exists e; create type e as enum ('a');"],
    ['COLUMNA_SENSE_IF_NOT_EXISTS', 'alter table t add column c int;', 'alter table t add column if not exists c int;'],
    ['COLUMNA_SENSE_IF_NOT_EXISTS', 'alter table t add c int;', 'alter table t add if not exists c int;'],
    ['CONSTRAINT_SENSE_DROP_PREVI', 'alter table t add constraint k check (c > 0);', 'alter table t drop constraint if exists k, add constraint k check (c > 0);'],
    ['DROP_SENSE_IF_EXISTS', 'drop table t;', 'drop table if exists t;'],
    ['DROP_SENSE_IF_EXISTS', 'alter table t drop column c;', 'alter table t drop column if exists c;'],
    ['RENAME', 'alter table t rename column a to b;', 'alter table t alter column a set default 0;'],
    ['INSERT_SENSE_ON_CONFLICT', 'insert into t values (1);', 'insert into t values (1) on conflict do nothing;'],
    ['INSERT_SENSE_ON_CONFLICT', 'insert into t values (1);', 'insert into t select 1 where not exists (select 1 from t);']
  ];
  for (const [regla, mal, be] of casos) {
    assert.ok(regles(mal).includes(regla), `${regla} hauria de saltar: ${mal}`);
    assert.ok(!regles(be).includes(regla), `${regla} no hauria de saltar: ${be}`);
  }
  // noms diferents (cas real de 2609080000:813): el drop d'una altra política no protegix
  assert.ok(regles('drop policy if exists "a" on t; create policy "b" on t using (true);').includes('POLITICA_SENSE_DROP_PREVI'));
  // un DO anterior amb execute … drop constraint rebaixa a indeterminat (cas real 2609261500:240-266)
  const r = V.analitzaIdempotencia(V.sentencies("do $$ begin execute 'alter table t drop constraint ' || quote_ident('k'); end $$; alter table t add constraint k check (c > 0);"));
  assert.equal(r.troballes.find((t) => t.regla === 'CONSTRAINT_SENSE_DROP_PREVI').nivell, 'indeterminat');
  assert.equal(r.veredicte, 'repetible');
  // els cossos no s'analitzen per dins i les mutacions de dades són informatives
  assert.deepEqual(regles('do $$ begin create table t (id int); end $$;'), []);
  assert.equal(V.analitzaIdempotencia(V.sentencies('begin; create table if not exists t (id int); update t set id = 1; commit;')).veredicte, 'repetible');
  // veredicte: sense transacció pot quedar a mitges; dins de begin … commit falla neta
  assert.equal(V.analitzaIdempotencia(V.sentencies('create table t (id int);')).veredicte, 'risc_parcial');
  assert.equal(V.analitzaIdempotencia(V.sentencies('begin; create table t (id int); commit;')).veredicte, 'no_repetible_falla_neta');
  assert.equal(V.analitzaIdempotencia(V.sentencies('begin; select 1; commit; create table t (id int);')).veredicte, 'risc_parcial');
});

test('transacció: begin sense commit, rollback i ordres no transaccionables', () => {
  const tr = (sql) => V.analitzaTransaccio(V.sentencies(sql)).problemes.map((p) => p.codi);
  assert.deepEqual(tr('begin; select 1; commit;'), []);
  assert.deepEqual(tr('begin; select 1;'), ['E-TRANSACCIO']);
  assert.deepEqual(tr('select 1; commit;'), ['E-TRANSACCIO']);
  assert.ok(tr('begin; select 1; rollback;').includes('E-TRANSACCIO'));
  assert.ok(tr('begin; create index concurrently i on t (c); commit;').includes('E-NO-TRANSACCIONABLE'));
  assert.deepEqual(tr('create index concurrently i on t (c);'), []);
  amb({ migracions: { '2611010000_a.sql': '-- Prova.\nbegin;\nselect 1;\n' } }, (dir) => assert.ok(codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-TRANSACCIO')));
});

test('consultes: etiquetes de capçalera i filtre de només lectura amb catàleg obligatori', () => {
  const cap = V.capcalera([
    '-- Abans (lectura):',
    '--   select count(*) from t;',
    '-- El SELECT de la columna x és prosa.',
    '-- Verificació posterior (lectura):',
    '--   1. select a,',
    '--          b from t;',
    '-- VERIFICACIÓ MANUAL AMB DUES SESSIONS (en una base de prova):',
    "--   select count(*) from t where nom = 'x;y';",
    'begin;'
  ].join('\n'));
  const q = V.consultesDeCapcalera(cap);
  assert.deepEqual(q.map((x) => [x.linia, x.etiqueta]), [[2, 'previa'], [5, 'posterior'], [8, 'recepta']]);
  assert.equal(q[1].sql, 'select a,\nb from t;');
  assert.equal(q[2].sql, "select count(*) from t where nom = 'x;y';");
  assert.throws(() => V.nomesLectura('select 1;'), TypeError);
  const valides = ["select 'delete';", 'select g();', 'select public.g(), private.h(1);', 'select jobname from cron.job;', 'select 1 as "lock", comment_count from t; -- delete', 'with x as (select 1) select * from x;', 'select auth.uid();', 'select "public".g(), "Nom" from public.t;'];
  for (const s of valides) assert.equal(V.nomesLectura(s, CAT), null, s);
  const rebutjades = [
    ["select set_config('request.jwt.claims', '{}', true);", /set_config/],
    ['with x as (delete from t returning *) select * from x;', /delete/],
    ['select f();', /volatile/],
    ['select public.f();', /volatile/],
    ['select public.desconeguda();', /desconeguda/],
    ['select * from t for update;', /update|bloqueig/],
    ['select * from t for share;', /bloqueig/],
    ['select * into nova from t;', /into/],
    ['select 1; select 2;', /més d'una/],
    ["select cron.unschedule('a');", /esquema no admès: cron/],
    ["select cron.schedule('a', '* * * * *', $c$select 1$c$);", /dòlars|cron/],
    ['select * from vault.decrypted_secrets;', /vault/],
    ['select public."f"();', /volatile/],
    ['select public."F"();', /cometes/],
    ['select pg_sleep(10);', /pg_sleep/],
    ["select nextval('s');", /nextval/],
    ['insert into t values (1);', /SELECT/],
    // ARB-B3-01: un identificador segur entre cometes és el mateix identificador ("public" = public)
    ['select "public".f();', /volatile/],
    ['select "public"."f"();', /volatile/],
    ['select "f"();', /volatile/],
    ['select U&"public".f();', /volatile/],
    ['select "Public".f();', /qualificador entre cometes/],
    ["select \"cron\".schedule('x', '* * * * *', 'delete from t');", /esquema no admès: cron/],
    ['select * from "vault".decrypted_secrets;', /vault/],
    ['select * from"vault".decrypted_secrets;', /vault/],
    ['select * from vault."Secrets";', /vault/],
    ['select "public".desconeguda();', /desconeguda/],
    // ARB-B3-05: la família advisory sencera, també la variant try
    ['select pg_try_advisory_lock(42);', /pg_try_advisory_lock/],
    ['select pg_catalog.pg_try_advisory_xact_lock(42);', /pg_try_advisory_xact_lock/]
  ];
  for (const [s, re] of rebutjades) assert.match(V.nomesLectura(s, CAT) ?? 'ACCEPTADA', re, s);
});

test('catàleg de volatilitat: volatile per defecte, marques abans del cos, alter i drop (ARB-B3-03)', () => {
  const cat = (sql) => V.catalegFuncions([{ sentencies: V.sentencies(sql) }]);
  assert.equal(cat('create or replace function public.a(p int) returns void language sql as $$ insert into t values (p) $$;').get('public.a'), 'volatile');
  assert.equal(cat('create function public.b() returns int language sql stable as $$ select 1 $$;').get('public.b'), 'stable');
  assert.equal(cat('create function private.c() returns int immutable language sql as $$ select 1 $$;').get('private.c'), 'immutable');
  assert.equal(cat('create function public.d() returns int language sql as $$ select 1 as stable $$;').get('public.d'), 'volatile', 'la paraula dins del cos no és cap marca');
  assert.equal(cat('create procedure public.p() language sql as $$ select 1 $$;').get('public.p'), 'volatile');
  assert.equal(cat('create function public.e() returns int language sql stable as $$ select 1 $$; alter function public.e() volatile;').get('public.e'), 'volatile');
  assert.equal(cat('create function public.e() returns int language sql as $$ select 1 $$; alter function public.e() stable;').get('public.e'), 'stable');
  assert.equal(cat('create function public.g() returns int language sql stable as $$ select 1 $$; drop function if exists public.g();').has('public.g'), false);
  assert.equal(cat('create function public.h(p int) returns int language sql stable as $$ select 1 $$; create function public.h(p text) returns int language sql as $$ select 1 $$;').get('public.h'), 'volatile', 'una sobrecàrrega volatile mana');
  // de punta a punta: una RPC sense marca sota «Abans (lectura)», fora de cap recepta, mai entra al pla
  const migracions = {
    '2611010000_a.sql': sqlBase('create table if not exists public.t (id int);\ncreate or replace function public.desa(p int) returns void language sql as $$ insert into public.t values (p) $$;'),
    '2611010100_b.sql': sqlBase('create table if not exists public.u (id int);', '-- Depén de: 2611010000.\n-- Abans (lectura):\n--   select public.desa(1);\n--   select "public".desa(2);\n-- Verificació posterior (lectura):\n--   select count(*) from public.u;')
  };
  amb({ migracions, readme: { estats: { 2611010000: NO_APLICADA, 2611010100: NO_APLICADA } } }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA, estricte: true });
    assert.equal(r.catalegFuncions['public.desa'], 'volatile');
    const blocs = blocsSql(V.formataPla(r));
    assert.ok(blocs.some((b) => b.includes('select count(*) from public.u;')), 'la posterior sí que hi és');
    assert.ok(!blocs.some((b) => /desa\([12]\)/.test(b)), 'cap crida a public.desa és un bloc del pla');
    for (const l of [4, 5]) assert.ok(r.excloses.some((x) => x.fitxer === '2611010100_b.sql' && x.linia === l && /volatile/.test(x.motiu)), `línia ${l}`);
  });
});

test('regressió real: les 12 receptes de dues sessions (6 set_config i 6 RPC volatile) mai són executables al pla', () => {
  const informe = informeReal();
  const pla = V.formataPla(informe);
  const blocs = blocsSql(pla).map((b) => b.replace(/\s+/g, ' ').trim());
  const casos = { '2610281730': [114, 116, 119, 121], '2610282100': [282, 284, 287, 289], '2610290400': [166, 167, 169, 172] };
  for (const [versio, linies] of Object.entries(casos)) {
    const m = informe.migracions.find((x) => x.versio === versio);
    assert.ok(m, versio);
    const q = V.consultesDeCapcalera(V.capcalera(fs.readFileSync(path.join(REPO, 'supabase/migrations', m.fitxer), 'utf8')));
    for (const l of linies) {
      const consulta = q.find((x) => x.linia === l);
      assert.ok(consulta, `${versio}:${l} és una consulta de capçalera`);
      assert.ok(/set_config|desa_membre_organitzacio|desa_el_meu_usuari|xat_publica_identitat/.test(consulta.sql), `${versio}:${l}`);
      assert.ok(!blocs.includes(consulta.sql.replace(/\s+/g, ' ').trim()), `${versio}:${l} no pot ser un bloc sql del pla`);
      assert.ok(informe.excloses.some((x) => x.fitxer === m.fitxer && x.linia === l), `${versio}:${l} és a les excloses`);
      assert.ok(pla.includes(`- ${m.fitxer}:${l} (`), `${versio}:${l} es llista a «Receptes de base de prova»`);
    }
  }
});

test('dependències declarades: dues línies, format antic, cap avant, inexistent i fantasma', () => {
  const cap = V.capcalera('-- Depén de: 2610201500 (la taula,\n-- i la funció) i 2609261500.\n-- Requerix 260914_0000.\n-- Va després del client.\nbegin;');
  assert.deepEqual(V.dependenciesDeclarades(cap, '2611010000').map((d) => d.versio), ['2610201500', '2609261500', '2609140000']);
  const migracions = {
    '2611010000_a.sql': sqlBase('select 1;'),
    '2611010100_b.sql': sqlBase('select 1;', '-- Depén de: 2611010200.'),
    '2611010200_c.sql': sqlBase('select 1;', '-- Depén de: 2610201400.'),
    '2611010300_d.sql': sqlBase('select 1;', '-- Requerix 2611019999.')
  };
  amb({ migracions, ordre: { ...ORDRE_BUIT, fantasmes: [{ versio: '2610201400', motiu: 'DF-06: cap fitxer ni història.' }] } }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA });
    assert.ok(r.errors.some((e) => e.codi === 'E-DEP-CAP-AVANT' && e.fitxer.endsWith('2611010100_b.sql')));
    assert.ok(r.errors.some((e) => e.codi === 'E-DEP-FANTASMA' && /DF-06/.test(e.missatge)));
    assert.ok(r.errors.some((e) => e.codi === 'E-DEP-INEXISTENT' && e.fitxer.endsWith('2611010300_d.sql')));
  });
});

test('ordre: enganxada, portes, cicle i inversions', () => {
  const o = V.ordena({ versions: ['2610311800', '2610311900', '2610312000'], restriccions: [{ abans: '2610311800', despres: '2610312000', just: true }, { abans: '2610312000', despres: '2610311900' }] });
  assert.deepEqual(o.ordre.map((x) => x.id), ['2610311800', '2610312000', '2610311900']);
  assert.deepEqual(o.inversions, [{ abans: '2610312000', despres: '2610311900' }]);
  const p = V.ordena({ versions: ['2610201500', '2610220240', '2610241400', '2610241420', '2610241430'], portes: [{ id: 'client', despres: ['2610201500'], abans: ['2610241400'] }, { id: 'apple', despres: ['2610241420'], abans: [] }] });
  assert.deepEqual(p.ordre.map((x) => x.id), ['2610201500', '2610220240', 'client', '2610241400', '2610241420', 'apple', '2610241430']);
  const c = V.ordena({ versions: ['2611010000', '2611010100'], dependencies: new Map([['2611010100', ['2611010000']]]), restriccions: [{ abans: '2611010100', despres: '2611010000' }] });
  assert.equal(c.errors[0].codi, 'E-CICLE');
  assert.match(c.errors[0].missatge, /2611010000 → 2611010100 → 2611010000|2611010100 → 2611010000 → 2611010100/);
  const e = V.ordena({ versions: ['2611010000', '2611010100', '2611010200'], dependencies: new Map([['2611010200', ['2611010100']]]), restriccions: [{ abans: '2611010000', despres: '2611010200', just: true }] });
  assert.ok(e.errors.some((x) => x.codi === 'E-ENGANXADA'));
});

test('mutació: el README i ordre_desplegament.json han de dir el mateix (E-ORDRE-README)', () => {
  const cadena = '`2610312000` → `2610311900`';
  assert.ok(fs.readFileSync(path.join(REPO, 'supabase/README.md'), 'utf8').includes(cadena), 'precondició: la seqüència de P0-21 porta la inversió');
  ambCopiaReal({}, (dir) => assert.ok(!codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-ORDRE-README')));
  ambCopiaReal({ 'supabase/README.md': (t) => t.replace(cadena, '`2610311900` → `2610312000`') }, (dir) => {
    assert.ok(codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-ORDRE-README'));
  });
  // sense les restriccions de 2610312000 (la «just» també la força), l'ordre torna a ser l'alfabètic
  ambCopiaReal({ 'supabase/ordre_desplegament.json': (t) => { const o = JSON.parse(t); o.restriccions = o.restriccions.filter((r) => r.abans !== '2610312000' && r.despres !== '2610312000'); return JSON.stringify(o); } }, (dir) => {
    assert.ok(codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-ORDRE-README'));
  });
});

test('ús d\'objectes: nivell superior posterior és error; amb guarda és informatiu; plpgsql sense guarda, avís', () => {
  const creaT = sqlBase('create table if not exists public.t (id int);');
  amb({ migracions: { '2611010000_a.sql': sqlBase('create or replace view public.v as select * from public.t;'), '2611010100_b.sql': creaT } }, (dir) => {
    assert.ok(codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-USA-POSTERIOR'));
  });
  amb({ migracions: { '2611010000_a.sql': sqlBase("do $$ begin if to_regclass('public.t') is not null then perform 1 from public.t; end if; end $$;"), '2611010100_b.sql': creaT } }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA });
    assert.ok(!codis(r).includes('E-USA-POSTERIOR'));
    assert.ok(r.informatius.some((i) => i.codi === 'I-US-GUARDAT' && i.linia === 4));
  });
  amb({ migracions: { '2611010000_a.sql': sqlBase('create or replace function public.q() returns int language plpgsql as $$ begin return (select count(*) from public.t); end $$;'), '2611010100_b.sql': creaT } }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA });
    assert.ok(!codis(r).includes('E-USA-POSTERIOR'));
    assert.ok(avisos(r).includes('A-US-TARDA'));
  });
});

test('README: absent, fantasma, bloc sql d\'escriptura i sonda d\'una versió inexistent', () => {
  const migracions = { '2611010000_a.sql': sqlBase('select 1;'), '2611010100_b.sql': sqlBase('select 1;') };
  const readme = readmeDe({ '2611010000_a.sql': 1, '2611010200_c.sql': 1 }, { sql: '```sql\nselect to_regclass(\'public.t\') is not null as te_t_2611019999;\n```\n\n```sql\ninsert into t values (1);\n```\n' });
  amb({ migracions, readme }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA });
    for (const c of ['E-README-ABSENT', 'E-README-FANTASMA', 'E-README-SQL-ESCRIPTURA', 'E-SONDA-README']) assert.ok(codis(r).includes(c), c);
    assert.ok(!V.formataPla(r).includes('insert into t'), 'un bloc del README que escriu mai entra al pla');
  });
});

test('evidència: formats de --aplicades, deriva, forat, dependència trencada i registre buit', () => {
  assert.deepEqual(V.llegixAplicades('version,name\n2610201500,moderacio\n"2610241400","normes"\n').versions, ['2610201500', '2610241400']);
  assert.deepEqual(V.llegixAplicades('["2610201500", 2610241400]').versions, ['2610201500', '2610241400']);
  assert.deepEqual(V.llegixAplicades('[{"version":"2610201500","name":"x"}]').versions, ['2610201500']);
  assert.deepEqual(V.llegixAplicades('version\tname\n2610201500\tx\n').versions, ['2610201500']);
  assert.deepEqual(V.llegixAplicades(' version | name\n------------+-----\n 20261101123000 | y\n(1 row)\n').versions, ['20261101123000']);
  assert.equal(V.llegixAplicades('version,name\n').buit, true);
  assert.throws(() => V.llegixAplicades('["abc"]'));
  assert.throws(() => V.llegixAplicades('x'.repeat(V.LIMIT_EVIDENCIA + 1)), /1 MB/);
  const migracions = {
    '2611010000_a.sql': sqlBase('create table if not exists public.t (id int);'),
    '2611010100_b.sql': sqlBase('create or replace function public.f() returns int language sql stable as $$ select 1 $$;'),
    '2611010200_c.sql': sqlBase('create or replace function public.f() returns int language sql stable as $$ select 2 $$;', '-- Depén de: 2611010100.')
  };
  amb({ migracions }, (dir) => {
    const sense = V.verifica({ arrel: dir, ara: ARA });
    assert.equal(sense.evidencia.tipus, 'cap');
    assert.ok(sense.migracions.every((m) => m.pas === null), 'sense evidència cap pas d\'una desconeguda');
    const deriva = V.verifica({ arrel: dir, ara: ARA, aplicades: '20261101123000\n2611010000\n' });
    assert.ok(codis(deriva).includes('E-APLICADES-SENSE-FITXER'));
    assert.ok(deriva.migracions.filter((m) => m.pas).every((m) => m.pas.estat === 'bloquejat'));
    const forat = V.verifica({ arrel: dir, ara: ARA, aplicades: '2611010000\n2611010200\n' });
    assert.ok(avisos(forat).includes('A-FORAT'));
    assert.ok(codis(forat).includes('E-DEP-TRENCADA'));
    const b = forat.migracions.find((m) => m.versio === '2611010100');
    assert.equal(b.estat, 'absent');
    const buit = V.verifica({ arrel: dir, ara: ARA, aplicades: 'version,name\n' });
    assert.equal(buit.evidencia.registreBuit, true);
    assert.deepEqual(buit.migracions.map((m) => m.pas?.estat), ['recomanat', 'recomanat', 'recomanat']);
    assert.deepEqual(codis(buit), []);
  });
});

test('evidència contradictòria: un registre que no quadra amb les empremtes, la sonda o el README no dona cap pas (ARB-B3-02)', () => {
  // a crea la taula t; b crea f; c redefinix f (cascada de b) i crea la taula u. Empremtes: a i c (b no en té).
  const migracions = {
    '2611010000_a.sql': sqlBase('create table if not exists public.t (id int);'),
    '2611010100_b.sql': sqlBase('create or replace function public.f() returns int language sql stable as $$ select 1 $$;'),
    '2611010200_c.sql': sqlBase('create or replace function public.f() returns int language sql stable as $$ select 2 $$;\ncreate table if not exists public.u (id int);')
  };
  const sonda = "```sql\nselect to_regclass('public.t') is not null as te_t_2611010000;\n```\n";
  const empremtes = 'versio,esperats,presents,absents\n2611010000,1,1,\n2611010200,1,1,\n';
  amb({ migracions, readme: { sql: sonda } }, (dir) => {
    assert.ok(V.verifica({ arrel: dir, ara: ARA }).migracions.find((m) => m.versio === '2611010100').cascada.includes('2611010200'), 'precondició: c és a la cascada de b');
    // registre buit (el Mestre aplica a mà) i empremtes presents: abans recomanava reaplicar-ho tot
    const buit = V.verifica({ arrel: dir, ara: ARA, aplicades: 'version,name\n', empremtes });
    assert.deepEqual(buit.errors.filter((e) => e.codi === 'E-EVIDENCIA-CONTRADICTORIA').map((e) => e.fitxer), ['supabase/migrations/2611010000_a.sql', 'supabase/migrations/2611010200_c.sql']);
    assert.ok(buit.migracions.every((m) => !m.pas || m.pas.estat === 'bloquejat'), 'cap pas recomanat ni forat');
    assert.doesNotMatch(V.formataPla(buit), /^## Pas [1-9]/m);
    // la inversa: el registre la té i l'empremta la dona absent
    const inversa = V.verifica({ arrel: dir, ara: ARA, aplicades: '2611010000\n2611010100\n2611010200\n', empremtes: 'versio,esperats,presents,absents\n2611010000,1,0,taula public.t\n' });
    assert.ok(inversa.errors.some((e) => e.codi === 'E-EVIDENCIA-CONTRADICTORIA' && e.fitxer.endsWith('2611010000_a.sql')));
    // la sonda del README contra el registre
    const ambSonda = V.verifica({ arrel: dir, ara: ARA, aplicades: '2611010100\n', empremtes: 'te_t_2611010000\nt\n' });
    assert.ok(ambSonda.errors.some((e) => e.codi === 'E-EVIDENCIA-CONTRADICTORIA' && e.fitxer.endsWith('2611010000_a.sql')));
    assert.ok(ambSonda.migracions.every((m) => !m.pas || m.pas.estat === 'bloquejat'));
    // coherent: registre complet i empremtes iguals → cap contradicció
    assert.ok(!codis(V.verifica({ arrel: dir, ara: ARA, aplicades: '2611010000\n2611010100\n2611010200\n', empremtes })).includes('E-EVIDENCIA-CONTRADICTORIA'));
  });
  // el README declara aplicada c: amb el registre buit és error; amb un registre parcial, ni c ni b (cascada) es recomanen
  amb({ migracions, readme: { estats: { 2611010200: '**Aplicada** (prova)' } } }, (dir) => {
    const buit = V.verifica({ arrel: dir, ara: ARA, aplicades: 'version,name\n' });
    assert.ok(buit.errors.some((e) => e.codi === 'E-EVIDENCIA-CONTRADICTORIA' && e.fitxer === 'supabase/README.md' && /2611010200/.test(e.missatge)));
    const parcial = V.verifica({ arrel: dir, ara: ARA, aplicades: '2611010000\n' });
    const pas = (v) => parcial.migracions.find((m) => m.versio === v).pas;
    assert.equal(pas('2611010200').estat, 'bloquejat');
    assert.match(pas('2611010200').motiu, /declara aplicada/);
    assert.equal(pas('2611010100').estat, 'bloquejat');
    assert.match(pas('2611010100').motiu, /cascada inclou 2611010200/);
    assert.ok(avisos(parcial).includes('A-README-DESFASAT'));
  });
});

test('pla: una consulta sense etiqueta que usa un objecte de la mateixa migració va després d\'«Aplica» (ARB-B3-04)', () => {
  const migracions = {
    '2611010000_a.sql': sqlBase('create table if not exists public.vella (id int);'),
    '2611010100_b.sql': sqlBase('create or replace function public.nova() returns int language sql stable as $$ select 1 $$;')
  };
  const vinyetes = { 2611010100: "Consulta `select public.nova();` i `select count(*) from public.vella;` i `select to_regprocedure('public.nova()') is not null;`" };
  amb({ migracions, readme: { estats: { 2611010000: NO_APLICADA, 2611010100: NO_APLICADA }, vinyetes } }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA });
    const pla = V.formataPla(r);
    const seccio = pla.slice(pla.indexOf('2611010100_b.sql'), pla.indexOf('## Portes'));
    const aplica = seccio.indexOf('- Aplica:');
    assert.ok(aplica > 0);
    assert.ok(seccio.indexOf('select public.nova();') > aplica, 'la funció encara no existix abans d\'aplicar-la');
    assert.ok(seccio.indexOf('select count(*) from public.vella;') < aplica, 'un objecte anterior es pot llegir abans');
    assert.ok(seccio.indexOf("select to_regprocedure('public.nova()') is not null;") < aplica, 'un literal no és cap ús');
    const b = r.migracions.find((m) => m.versio === '2611010100');
    assert.deepEqual(b.consultes.sense_etiqueta.map((c) => Boolean(c.despres)), [true, false, false]);
  });
});

test('cascades: forat amb la reaplicació correcta i comprovació creuada del JSON', () => {
  const migracions = {
    '2611010000_m.sql': sqlBase('create or replace function public.f(p_x int) returns int language sql stable as $$ select 1 $$;'),
    '2611010100_x.sql': sqlBase('create table if not exists public.u (id int);'),
    '2611010200_n.sql': sqlBase('create or replace function public.f(p_y integer) returns int language sql stable as $$ select 2 $$;')
  };
  amb({ migracions, ordre: { ...ORDRE_BUIT, reaplicacio: [{ si: '2611010000', llavors: ['2611010200'] }] } }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA, aplicades: '2611010100\n2611010200\n' });
    const m = r.migracions.find((x) => x.versio === '2611010000');
    assert.deepEqual(m.cascada, ['2611010200']);
    assert.equal(m.pas.estat, 'forat');
    assert.deepEqual(m.pas.reaplica, ['2611010200']);
    assert.ok(m.pas.objectes.includes('f:public.f(integer)'));
    assert.match(V.formataPla(r), /\*\*Forat:\*\* aplicar-la regressaria f:public\.f\(integer\) de 2611010200; si cal, aplica-la i reaplica després, en este ordre: 2611010200\./);
    assert.ok(!avisos(r).includes('A-REAPLICACIO-NO-DERIVADA'));
  });
  amb({ migracions, ordre: { ...ORDRE_BUIT, reaplicacio: [{ si: '2611010000', llavors: ['2611010100'] }] } }, (dir) => {
    assert.ok(avisos(V.verifica({ arrel: dir, ara: ARA })).includes('A-REAPLICACIO-NO-DERIVADA'));
  });
});

test('JSON d\'ordre: validació estricta i porta de client', () => {
  const versions = new Set(['2611010000']);
  assert.throws(() => V.llegixOrdre({ ...ORDRE_BUIT, sobrant: 1 }, versions), /desconeguda/);
  assert.throws(() => V.llegixOrdre({ ...ORDRE_BUIT, restriccions: [{ abans: '2611010000', despres: '2611019999' }] }, versions), /sense fitxer|no té fitxer/);
  assert.throws(() => V.llegixOrdre({ ...ORDRE_BUIT, fantasmes: [{ versio: '2611010000', motiu: 'x' }] }, versions), /sí que té fitxer/);
  assert.throws(() => V.llegixOrdre({ ...ORDRE_BUIT, portes: [{ id: 'a', tipus: 'client', comprovacio: { fitxer: '../x.js', constant: 'A', valor: '1' } }] }, versions), /relatiu/);
  assert.throws(() => V.llegixOrdre({ ...ORDRE_BUIT, portes: [{ id: 'a', tipus: 'client' }, { id: 'a', tipus: 'funcio' }] }, versions), /repetit/);
  assert.throws(() => V.llegixOrdre({ ...ORDRE_BUIT, portes: [{ id: 'a', tipus: 'client', comprovacio: { fitxer: 'x.js', constant: 'A-B', valor: '1' } }] }, versions), /identificador/);
  const migracions = { '2611010000_a.sql': sqlBase('select 1;'), '2611010100_b.sql': sqlBase('select 1;') };
  const porta = { id: 'client-normes', tipus: 'client', descripcio: 'Publicar el client.', despres: ['2611010000'], abans: ['2611010100'], comprovacio: { fitxer: 'src/data/contracte.js', constant: 'VERSIO', valor: '2026-10-24' } };
  amb({ migracions, ordre: { ...ORDRE_BUIT, portes: [porta] }, extra: { 'src/data/contracte.js': "export const VERSIO = '2026-10-24';\n" } }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA });
    assert.deepEqual(r.ordre.map((x) => x.id), ['2611010000', 'client-normes', '2611010100']);
    assert.ok(!avisos(r).includes('A-PORTA-CLIENT'));
  });
  amb({ migracions, ordre: { ...ORDRE_BUIT, portes: [porta] }, extra: { 'src/data/contracte.js': "export const VERSIO = '2026-10-20';\n" } }, (dir) => {
    assert.ok(avisos(V.verifica({ arrel: dir, ara: ARA })).includes('A-PORTA-CLIENT'));
  });
  amb({ migracions, ordre: { ...ORDRE_BUIT, clau: 'x' } }, (dir) => assert.ok(codis(V.verifica({ arrel: dir, ara: ARA })).includes('E-ORDRE-JSON')));
  amb({ migracions, ordre: null }, (dir) => assert.ok(avisos(V.verifica({ arrel: dir, ara: ARA })).includes('A-SENSE-ORDRE')));
});

test('pla: sense evidència només el sufix declarat; tot bloc sql passa nomesLectura; determinista', () => {
  const informe = informeReal();
  const cat = catalegDe(informe);
  const pla = V.formataPla(informe);
  for (const b of blocsSql(pla)) assert.equal(V.nomesLectura(b, cat), null, b.slice(0, 120));
  assert.ok(blocsSql(pla).length >= 4, 'Pas 0 amb registre, versions, sonda i empremtes');
  for (const m of informe.migracions) {
    if (m.estat === 'desconegut') assert.equal(m.pas, null, `${m.versio} desconeguda sense pas`);
    if (m.pas?.estat === 'recomanat_declarat') assert.equal(m.estatDeclarat, 'declarada_no_aplicada', m.versio);
  }
  assert.ok(informe.migracions.every((m) => m.pas?.estat !== 'recomanat'), 'sense evidència cap pas recomanat ferm');
  assert.equal(V.formataPla(V.verifica({ arrel: REPO, ara: ARA })), pla, 'dues execucions amb el mateix rellotge donen el mateix pla');
  assert.match(pla, /^# Pla de migracions · generat /);
  assert.match(pla, /Cap consulta d'este pla escriu/);
});

test('arbre real: sense errors, pendents de HEAD estrictes, cadenes del README i casos històrics', () => {
  const r = informeReal();
  assert.deepEqual(r.errors, []);
  const ordre = r.ordre.filter((x) => x.tipus === 'migracio').map((x) => x.id);
  const readme = V.llegixReadme(fs.readFileSync(path.join(REPO, 'supabase/README.md'), 'utf8'));
  assert.ok(readme.cadenes.length >= 9, 'les cadenes de P0-21 es lligen');
  for (const c of readme.cadenes) assert.ok(ordre.indexOf(c.abans) < ordre.indexOf(c.despres), `${c.abans} abans de ${c.despres}`);
  assert.ok(ordre.indexOf('2610312000') === ordre.indexOf('2610311800') + 1, '2610312000 just després de 2610311800');
  const estricte = V.verifica({ arrel: REPO, ara: ARA, estricte: true });
  for (const v of PENDENTS_HEAD) assert.ok(!estricte.errors.some((e) => e.versio === v || (e.fitxer ?? '').includes(`/${v}_`)), `${v} passa --estricte`);
  const m = (v) => r.migracions.find((x) => x.versio === v);
  assert.ok(m('2609080000').idempotencia.troballes.some((t) => t.regla === 'POLITICA_SENSE_DROP_PREVI' && t.linia === 813));
  assert.equal(m('2609080000').idempotencia.veredicte, 'risc_parcial');
  assert.equal(m('2610220240').idempotencia.veredicte, 'no_repetible_falla_neta');
  const signatures = new Set();
  for (const x of r.migracions) for (const s of V.sentencies(fs.readFileSync(path.join(REPO, 'supabase/migrations', x.fitxer), 'utf8'))) { const g = V.signaturaFuncio(s.text); if (g) signatures.add(g); }
  for (const s of ['public.transfereix_propietat_organitzacio(uuid,uuid)', 'private.versio_normes_vigent()', 'public.pot_signar_com_organitzacio(uuid,uuid)', 'public.pot_signar_com_organitzacio(uuid)', 'private.xat_lot3_b64(text,integer)', 'private.exporta_federacio_v1(uuid)', 'public.exporta_les_meues_dades()', 'public.versio_minima_client(text)']) assert.ok(signatures.has(s), s);
  for (const v of ['2610311800', '2610311900', '2610312000']) assert.ok(!r.avisos.some((a) => a.codi === 'A-SENSE-CONSULTES' && a.versio === v), `${v} té columna a la sonda`);
});

test('CLI: codis d\'eixida i cap escriptura a la carpeta', () => {
  const migracions = { '2611010000_a.sql': sqlBase('create table if not exists public.t (id int);') };
  amb({ migracions }, (dir) => {
    const foto = () => fs.readdirSync(dir, { recursive: true }).sort().map((f) => `${f}:${fs.statSync(path.join(dir, f)).mtimeMs}`);
    const abans = foto();
    const run = (...a) => spawnSync(process.execPath, [SCRIPT, '--arrel', dir, ...a], { encoding: 'utf8' });
    const json = run('--format', 'json');
    assert.equal(json.status, 0, json.stderr);
    assert.equal(JSON.parse(json.stdout).esquema, V.ESQUEMA_INFORME);
    assert.equal(run().status, 0);
    assert.equal(run('--pla').status, 0);
    assert.equal(run('--bandera-desconeguda').status, 2);
    assert.equal(run('--aplicades', path.join(dir, 'no-hi-es.csv')).status, 2);
    assert.equal(run('--pla', '--format', 'json').status, 2);
    assert.equal(run('--format', 'xml').status, 2);
    assert.deepEqual(foto(), abans, 'el CLI no escriu res a la carpeta');
    fs.writeFileSync(path.join(dir, 'supabase/migrations/2611010000_a.sql'), "begin;\nselect 'obert;\n");
    assert.equal(run().status, 1);
  });
});

test('pendents: --estricte promou els avisos i les receptes de dues sessions mai entren al pla', () => {
  const cap = "-- VERIFICACIÓ MANUAL AMB DUES SESSIONS (en una base de prova, mai en la de producció):\n--   select count(*) from public.t where nom = 'recepta';";
  const migracions = {
    '2611010000_a.sql': sqlBase('create table if not exists public.t (id int, nom text);'),
    '2611010100_b.sql': `-- Prova sense transacció.\n${cap}\ncreate table public.u (id int);\n`
  };
  amb({ migracions, readme: { estats: { 2611010100: NO_APLICADA } } }, (dir) => {
    const lax = V.verifica({ arrel: dir, ara: ARA });
    assert.deepEqual(codis(lax), []);
    for (const c of ['A-SENSE-TRANSACCIO', 'A-IDEMPOTENCIA']) assert.ok(lax.avisos.some((a) => a.codi === c && a.pendent), c);
    assert.ok(!V.formataPla(lax).includes("nom = 'recepta'"), 'una recepta de dues sessions no és cap bloc del pla');
    assert.ok(lax.excloses.some((x) => x.linia === 3 && x.etiqueta === 'recepta'));
    const estricte = V.verifica({ arrel: dir, ara: ARA, estricte: true });
    for (const c of ['A-SENSE-TRANSACCIO', 'A-IDEMPOTENCIA']) assert.ok(estricte.errors.some((e) => e.codi === c && e.promogut), c);
    assert.ok(!estricte.errors.some((e) => (e.fitxer ?? '').endsWith('2611010000_a.sql')), 'les desconegudes no es promouen');
  });
});

test('frontera: el script no obri processos, no fa xarxa i no escriu fitxers', () => {
  const text = fs.readFileSync(SCRIPT, 'utf8');
  for (const prohibit of ['child_process', 'node:net', 'node:http', 'fetch(', 'writeFile', 'appendFile', 'mkdir', 'rmSync', 'unlink', 'eval(']) assert.ok(!text.includes(prohibit), prohibit);
});

test('empremtes (N2): consulta de només lectura, objectes distintius i escapament', () => {
  const migracions = {
    '2611010000_a.sql': sqlBase("create table if not exists public.t (id int);\ncreate index if not exists t_i on public.t (id);\ndrop policy if exists \"l'altra\" on public.t;\ncreate policy \"l'altra\" on public.t for select using (true);\ncreate or replace function public.f(p uuid, q text) returns int language sql stable as $$ select 1 $$;"),
    '2611010100_b.sql': sqlBase('alter table public.t add column if not exists c int;\ncreate table if not exists public.efimera (id int);\nalter table public.efimera add column if not exists z int;'),
    '2611010200_c.sql': sqlBase('drop table if exists public.efimera;')
  };
  amb({ migracions }, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA });
    assert.ok(r.consultaEmpremtes);
    assert.equal(V.nomesLectura(r.consultaEmpremtes, catalegDe(r)), null);
    const a = r.migracions.find((m) => m.versio === '2611010000').empremta.map((o) => o.objecte);
    assert.deepEqual(a, ['taula public.t', 'funcio public.f(uuid,text)', "politica l'altra@public.t", 'index public.t_i']);
    assert.match(r.consultaEmpremtes, /p\.policyname = 'l''altra'/);
    assert.match(r.consultaEmpremtes, /oidvectortypes\(p\.proargtypes\) = 'uuid, text'/);
    const b = r.migracions.find((m) => m.versio === '2611010100').empremta.map((o) => o.objecte);
    assert.deepEqual(b, ['columna public.t.c'], 'una taula esborrada després no és cap empremta');
    assert.equal(r.migracions.find((m) => m.versio === '2611010200').empremta, null);
    // ingesta: una empremta parcial bloqueja; la sonda «false» amb la cascada present és indeterminada
    const parcial = V.verifica({ arrel: dir, ara: ARA, empremtes: 'versio,esperats,presents,absents\n2611010000,4,2,index public.t_i\n' });
    assert.ok(codis(parcial).includes('E-EMPREMTA-PARCIAL'));
    const ple = V.verifica({ arrel: dir, ara: ARA, empremtes: '[{"versio":"2611010000","esperats":4,"presents":4,"absents":""},{"versio":"2611010100","esperats":1,"presents":0,"absents":"columna public.t.c"}]' });
    assert.equal(ple.migracions.find((m) => m.versio === '2611010000').estat, 'aplicada_empremta');
    assert.equal(ple.migracions.find((m) => m.versio === '2611010100').pas.estat, 'recomanat');
  });
  const sonda = V.llegixEmpremtes('te_moderacio_2610201500,te_filtre_rgpd_2610311900\nt,f\n');
  assert.equal(sonda.sonda.get('te_moderacio_2610201500'), true);
  assert.equal(sonda.sonda.get('te_filtre_rgpd_2610311900'), false);
  ambCopiaReal({}, (dir) => {
    const r = V.verifica({ arrel: dir, ara: ARA, empremtes: ['te_filtre_rgpd_2610311900,te_contracte_federacio_2611011800\nf,t\n'] });
    assert.equal(r.migracions.find((m) => m.versio === '2611011800').estat, 'aplicada_empremta');
    assert.equal(r.migracions.find((m) => m.versio === '2610311900').estat, 'desconegut', 'fals després de 2611011800 no acredita absent');
  });
});
