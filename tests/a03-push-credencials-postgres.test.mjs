/* P1-74 (A-03) · Prova SQL real (PGlite explícit) de la caché de credencials
   natives per configuració: 2611020417 i després
   20261118230000_a03_xat_push_credencials_per_configuracio.sql (dues
   vegades: idempotent). Dues empremtes del mateix proveïdor conviuen, «desa
   només si dura més» val dins de cada configuració, les v1 continuen
   funcionant sobre la seua fila única, les caducades s'esborren en desar, el
   sostre de quatre vives mossega i només service_role pot cridar les _v2.
   Sense SDP_PGLITE_MODULE la prova es declara omesa, no superada. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.SDP_PGLITE_MODULE;
const migrations = ['2611020417_xat_avisos_push.sql', '20261118230000_a03_xat_push_credencials_per_configuracio.sql'];
const A = 'aaaaaaaaaaaaaaaa';
const B = 'bbbbbbbbbbbbbbbb';
const X = `jwt.sintetic.x_${'x'.repeat(24)}`;
const Y = `jwt.sintetic.y_${'y'.repeat(24)}`;
const Z = `jwt.sintetic.z_${'z'.repeat(24)}`;
const minuts = (n) => new Date(Date.now() + n * 60 * 1000).toISOString();

test('A-03 · dues configuracions natives alhora a la caché de credencials', {
  skip: !modulePath && 'Cal SDP_PGLITE_MODULE explícit; cap instal·lació implícita ni prova SQL inferida'
}, async (t) => {
  const { PGlite } = await import(modulePath.startsWith('file:') ? modulePath : pathToFileURL(modulePath).href);
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.role() returns text language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.role',true),''),'authenticated')$$;
    grant usage on schema auth to authenticated,anon,service_role;
    create table private.ajustos(clau text primary key,valor text);
    create table public.xat_missatges(id uuid,fil_id uuid,usuari_id uuid,com_org_id uuid,resposta_a uuid,tipus text);`);
  for (const name of migrations) await db.exec(await fs.readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8'));
  /* Idempotent: la nova es pot tornar a aplicar sencera. */
  await db.exec(await fs.readFile(new URL(`../supabase/migrations/${migrations[1]}`, import.meta.url), 'utf8'));

  const com = async (rol, rolJwt, sql, params = []) => {
    await db.exec('begin');
    try {
      await db.query("select set_config('request.jwt.claim.role',$1,true)", [rolJwt]);
      await db.exec(`set local role ${rol}`);
      const r = await db.query(sql, params);
      await db.exec('commit');
      return r;
    } catch (error) { await db.exec('rollback'); throw error; }
  };
  const servidor = (sql, params) => com('service_role', 'service_role', sql, params);
  const desa = async (proveidor, empremta, valor, caduca) => (await servidor('select public.xat_push_desa_credencial_v2($1,$2,$3,$4::timestamptz) as ok', [proveidor, empremta, valor, caduca])).rows[0].ok;
  const llig = async (proveidor, empremta) => (await servidor('select public.xat_push_credencial_v2($1,$2) as valor', [proveidor, empremta])).rows[0].valor;
  const files = async () => (await db.query('select proveidor, empremta, valor from private.xat_push_credencials_v2 order by proveidor, empremta')).rows;

  await t.test('dues empremtes del mateix proveïdor conviuen i cadascuna llig la seua', async () => {
    assert.equal(await desa('apns', A, X, minuts(50)), true);
    assert.equal(await desa('apns', B, Y, minuts(50)), true);
    assert.equal(await llig('apns', A), X);
    assert.equal(await llig('apns', B), Y);
    assert.equal(await llig('fcm', A), null);
    assert.equal(await llig('apns', 'cccccccccccccccc'), null);
  });

  await t.test('dins d’una configuració, només es desa la que dura més', async () => {
    assert.equal(await desa('apns', A, Z, minuts(40)), false);
    assert.equal(await llig('apns', A), X);
    assert.equal(await desa('apns', A, Z, minuts(55)), true);
    assert.equal(await llig('apns', A), Z);
    assert.equal(await llig('apns', B), Y);
  });

  await t.test('amb menys de cinc minuts de vida, la lectura no la torna', async () => {
    await db.query("insert into private.xat_push_credencials_v2 values ('fcm', $1, $2, now() + interval '4 minutes')", [A, X]);
    assert.equal(await llig('fcm', A), null);
  });

  await t.test('les v1 continuen sobre la seua fila única, sense tocar les _v2', async () => {
    assert.equal((await servidor('select public.xat_push_desa_credencial($1,$2,$3::timestamptz) as ok', ['apns', X, minuts(50)])).rows[0].ok, true);
    assert.equal((await servidor('select public.xat_push_desa_credencial($1,$2,$3::timestamptz) as ok', ['apns', Y, minuts(45)])).rows[0].ok, false);
    assert.equal((await servidor('select public.xat_push_credencial($1) as valor', ['apns'])).rows[0].valor, X);
    assert.equal((await db.query('select count(*)::int n from private.xat_push_credencials')).rows[0].n, 1);
    assert.equal(await llig('apns', A), Z);
    assert.equal(await llig('apns', B), Y);
  });

  await t.test('en desar s’esborren les caducades del proveïdor; com a molt quatre vives (SDP-PUSH-014)', async () => {
    await db.query("insert into private.xat_push_credencials_v2 values ('apns', 'dddddddddddddddd', $1, now() - interval '1 minute'), ('apns', 'eeeeeeeeeeeeeeee', $1, now() - interval '1 minute')", [X]);
    assert.equal(await desa('apns', 'cccccccccccccccc', X, minuts(50)), true);
    assert.deepEqual((await files()).filter((f) => f.proveidor === 'apns').map((f) => f.empremta), [A, B, 'cccccccccccccccc']);
    assert.equal(await desa('apns', '0000000000000000', X, minuts(50)), true);
    await assert.rejects(desa('apns', '1111111111111111', X, minuts(50)), /SDP-PUSH-014/);
    /* Una configuració que ja hi és es pot renovar encara que n'hi haja quatre. */
    assert.equal(await desa('apns', B, Z, minuts(60)), true);
    /* El sostre és per proveïdor. */
    assert.equal(await desa('fcm', B, Y, minuts(50)), true);
    assert.equal((await files()).filter((f) => f.proveidor === 'apns').length, 4);
  });

  await t.test('paràmetres invàlids: SDP-PUSH-005, sense escriure res', async () => {
    const abans = await files();
    for (const [proveidor, empremta, valor, caduca] of [
      ['apns', '', X, minuts(50)],
      ['apns', 'AAAAAAAAAAAAAAAA', X, minuts(50)],
      ['apns', 'aaaa', X, minuts(50)],
      ['apns', null, X, minuts(50)],
      ['web', A, X, minuts(50)],
      ['apns', A, 'curta', minuts(50)],
      ['apns', A, X, minuts(70)],
      ['apns', A, X, minuts(-1)]
    ]) await assert.rejects(desa(proveidor, empremta, valor, caduca), /SDP-PUSH-005/);
    assert.deepEqual(await files(), abans);
  });

  await t.test('només service_role: cap altre rol ni cap JWT que no siga de servidor', async () => {
    for (const rol of ['anon', 'authenticated']) {
      await assert.rejects(com(rol, 'service_role', 'select public.xat_push_credencial_v2($1,$2)', ['apns', A]), /permission denied/);
      await assert.rejects(com(rol, 'service_role', 'select public.xat_push_desa_credencial_v2($1,$2,$3,$4::timestamptz)', ['apns', A, X, minuts(50)]), /permission denied/);
    }
    await assert.rejects(com('service_role', 'authenticated', 'select public.xat_push_credencial_v2($1,$2)', ['apns', A]), /SDP-PUSH-000/);
    await assert.rejects(servidor('select * from private.xat_push_credencials_v2'), /permission denied/);
    const rls = (await db.query("select c.relrowsecurity as rls, (select count(*)::int from pg_policies p where p.schemaname='private' and p.tablename='xat_push_credencials_v2') as politiques from pg_class c where c.oid = 'private.xat_push_credencials_v2'::regclass")).rows[0];
    assert.deepEqual(rls, { rls: true, politiques: 0 });
  });
});
