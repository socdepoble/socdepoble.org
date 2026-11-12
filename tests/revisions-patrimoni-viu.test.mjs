import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { creaPlaMigracions, generaSql, preparaHidratacio } from '../tooling/node0/hidrata-postgres-node0.mjs';

const FITXER = '2611110110_revisions_patrimoni_viu.sql';
const POBLE = 'ac3bec76-255b-5ca2-8886-28fcceab4267';
const ALTRE_POBLE = 'a81deb1b-8c3b-4be7-81bd-5588d50d6d82';
const persones = ['autor', 'veina', 'curador', 'admin', 'global', 'senseNormes'];
const actors = Object.fromEntries(persones.map((nom, index) => [nom, `ca000000-0000-4000-8000-00000000000${index}`]));
const permisos = error => error.code === '42501';
const limit = error => error.code === '23514';

test('R17.2B · revisions longitudinals sobre tot el catàleg SQL', {
  skip: !process.env.SDP_PGLITE_MODULE && 'Cal un mòdul PGlite local i descartable'
}, async t => {
  const url = pathToFileURL(process.env.SDP_PGLITE_MODULE);
  const { PGlite } = await import(url.href);
  const { pgcrypto } = await import(new URL('./contrib/pgcrypto.js', url));
  const initial = new PGlite();
  await initial.exec('CREATE DATABASE socdepoble_node0');
  const image = await initial.dumpDataDir('none');
  await initial.close();
  const db = new PGlite({ database: 'socdepoble_node0', loadDataDir: image, extensions: { pgcrypto } });
  t.after(() => db.close());
  const pla = creaPlaMigracions();
  assert.ok(pla.migrations.some(m => m.file === FITXER));
  await db.exec(generaSql(pla, await preparaHidratacio(), { advisoryLock: false }));

  await db.query("INSERT INTO public.towns(id,slug,name) VALUES($1,'prova-patrimoni','Poble de prova')", [ALTRE_POBLE]);
  await db.exec('ALTER TABLE auth.users DISABLE TRIGGER USER');
  for (const nom of persones) {
    await db.query('INSERT INTO auth.users(id,email) VALUES($1,$2)', [actors[nom], `${nom}@prova.invalid`]);
    if (nom !== 'senseNormes') await db.query('INSERT INTO private.normes_acceptades(usuari_id,versio) VALUES($1,private.versio_normes_vigent())', [actors[nom]]);
  }
  await db.exec('ALTER TABLE auth.users ENABLE TRIGGER USER');
  for (const nom of ['autor', 'veina', 'curador', 'admin', 'senseNormes']) {
    await db.query('INSERT INTO public.town_memberships(town_id,user_id,role) VALUES($1,$2,$3)', [POBLE, actors[nom], nom === 'admin' ? 'admin' : 'member']);
  }
  await db.query("INSERT INTO public.town_memberships(town_id,user_id,role) VALUES($1,$2,'member')", [ALTRE_POBLE, actors.veina]);
  await db.query('INSERT INTO private.curadors_culturals(usuari_id) VALUES($1)', [actors.curador]);
  await db.query("INSERT INTO public.user_platform_roles(user_id,role) VALUES($1,'superadmin')", [actors.global]);

  async function com(actor, sql, params = [], aal = 'aal1') {
    const role = actor === null ? 'anon' : 'authenticated';
    await db.exec('BEGIN');
    try {
      const sub = actor === null ? '' : actors[actor];
      await db.query("SELECT set_config('request.jwt.claim.sub',$1,true), set_config('request.jwt.claims',$2,true)", [sub, JSON.stringify({ sub, role, aal })]);
      await db.exec(`SET LOCAL ROLE ${role}`);
      const resultat = await db.query(sql, params);
      await db.exec('COMMIT');
      return resultat;
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
  }

  function crea(actor, { poble = POBLE, tipus = 'arbre', slug = 'om-del-rentonar', any = 2026,
    estat = 'Bo', mesures = { altura_m: 13.25, dany: false, unitat: 'm', estimacio: null }, observacions = 'Visitada la peça.' } = {}) {
    return com(actor, `INSERT INTO public.revisions_patrimoni
      (tenant_id,entitat_tipus,entitat_slug,campanya_any,estat_conservacio,mesures_jsonb,observacions)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING versio`, [poble, tipus, slug, any, estat, mesures, observacions]);
  }

  const edita = (actor, { poble = POBLE, versio, aal = 'aal1' }) => com(actor,
    `UPDATE public.revisions_patrimoni SET estat_conservacio='En observació'
     WHERE tenant_id=$1 AND entitat_slug='om-del-rentonar' AND campanya_any=2026 AND versio=$2 RETURNING versio`,
    [poble, versio], aal);

  await t.test('lectura pública, campanyes anuals, autoria interna i idempotència', async () => {
    assert.deepEqual((await crea('autor')).rows, [{ versio: 1 }]);
    await crea('autor', { any: 2025 });
    await crea('veina', { poble: ALTRE_POBLE });
    await assert.rejects(crea('autor'), error => error.code === '23505');
    await assert.rejects(crea(null, { any: 2023 }), permisos);
    await assert.rejects(crea('autor', { poble: ALTRE_POBLE, any: 2024 }), permisos);
    const sql = 'SELECT campanya_any,versio,mesures_jsonb FROM public.revisions_patrimoni WHERE tenant_id=$1 ORDER BY campanya_any DESC';
    const { rows } = await com(null, sql, [POBLE]);
    assert.deepEqual(rows.map(fila => fila.campanya_any), [2026, 2025]);
    assert.deepEqual(rows[0].mesures_jsonb, { altura_m: 13.25, dany: false, unitat: 'm', estimacio: null });
    for (const actor of [null, 'autor']) await assert.rejects(com(actor, 'SELECT creat_per FROM public.revisions_patrimoni'), permisos);
    await assert.rejects(com('autor', 'UPDATE public.revisions_patrimoni SET creat_per=$1 WHERE tenant_id=$2', [actors.veina, POBLE]), permisos);
    assert.deepEqual((await db.query('SELECT creat_per FROM public.revisions_patrimoni WHERE tenant_id=$1 AND campanya_any=2026', [POBLE])).rows, [{ creat_per: actors.autor }]);

    const migracio = await readFile(new URL(`../supabase/migrations/${FITXER}`, import.meta.url), 'utf8');
    await db.exec(migracio);
    await db.exec(migracio);
    assert.deepEqual((await com(null, sql, [POBLE])).rows, rows);
  });

  await t.test('autor, curador i administradors amb abast i versió', async () => {
    assert.deepEqual((await edita('veina', { versio: 1 })).rows, []);
    assert.deepEqual((await edita('autor', { versio: 1 })).rows, [{ versio: 2 }]);
    assert.deepEqual((await edita('autor', { versio: 1 })).rows, []);
    assert.deepEqual((await edita('curador', { versio: 2 })).rows, []);
    assert.deepEqual((await edita('curador', { versio: 2, aal: 'aal2' })).rows, [{ versio: 3 }]);
    assert.deepEqual((await edita('curador', { poble: ALTRE_POBLE, versio: 1, aal: 'aal2' })).rows, []);
    assert.deepEqual((await edita('admin', { versio: 3 })).rows, []);
    assert.deepEqual((await edita('admin', { versio: 3, aal: 'aal2' })).rows, [{ versio: 4 }]);
    assert.deepEqual((await edita('admin', { poble: ALTRE_POBLE, versio: 1, aal: 'aal2' })).rows, []);
    assert.deepEqual((await edita('global', { poble: ALTRE_POBLE, versio: 1 })).rows, []);
    assert.deepEqual((await edita('global', { poble: ALTRE_POBLE, versio: 1, aal: 'aal2' })).rows, [{ versio: 2 }]);
    assert.deepEqual((await db.query('SELECT creat_per,versio FROM public.revisions_patrimoni WHERE tenant_id=$1 AND campanya_any=2026', [POBLE])).rows, [{ creat_per: actors.autor, versio: 4 }]);

    const sql = 'DELETE FROM public.revisions_patrimoni WHERE tenant_id=$1 AND campanya_any=2026 AND versio=$2 RETURNING id,versio';
    assert.deepEqual((await com('veina', sql, [POBLE, 4])).rows, []);
    assert.deepEqual((await com('autor', sql, [POBLE, 3])).rows, []);
    const [retirada] = (await com('curador', sql, [POBLE, 4], 'aal2')).rows;
    assert.equal(retirada.versio, 4);
    await crea('autor');
    const [recreada] = (await com(null, 'SELECT id FROM public.revisions_patrimoni WHERE tenant_id=$1 AND campanya_any=2026', [POBLE])).rows;
    assert.notEqual(recreada.id, retirada.id);
    const cas = 'DELETE FROM public.revisions_patrimoni WHERE id=$1 AND tenant_id=$2 AND campanya_any=2026 AND versio=1 RETURNING id';
    assert.deepEqual((await com('autor', cas, [retirada.id, POBLE])).rows, []);
    assert.deepEqual((await com('autor', cas, [recreada.id, POBLE])).rows, [recreada]);
  });

  await t.test('els camps directes i les normes de publicació estan tancats al servidor', async () => {
    await assert.rejects(crea('senseNormes', { any: 2024 }), error => permisos(error) && /SDP-MOD-428/.test(error.message));
    // Com exigix_normes_publicacio (2610241400): el sistema i els seeds, sense persona, no passen per les normes.
    await db.query(`INSERT INTO public.revisions_patrimoni
      (tenant_id,entitat_tipus,entitat_slug,campanya_any,estat_conservacio,creat_per)
      VALUES($1,'llavor','llavor-del-seed',2021,'Bo',$2)`, [ALTRE_POBLE, actors.global]);
    for (const entrada of [
      { mesures: { altura: { valor: 15 } } }, { mesures: { altura: [15] } }, { mesures: { constructor: true } },
      { mesures: { etiqueta: 'x'.repeat(161) } }, { mesures: { altura: 2 ** 53 } }, { mesures: ['15'] },
      { mesures: Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`m${i}`, i])) },
      { estat: ' \t\n' }, { estat: '\xa0Bo' }, { estat: 'Bo\u{feff}' }, { slug: 'llavor\n' },
      { any: 0 }, { observacions: 'x'.repeat(4001) }
    ]) await assert.rejects(crea('autor', { ...entrada, any: entrada.any ?? 2023 }), limit);
    await assert.rejects(crea('autor', { tipus: 'inventat', any: 2023 }), permisos);
    await crea('autor', { tipus: 'llavor', slug: 'llavor-antiga', any: 2022, mesures: { emoji: '🌳'.repeat(160) } });
    await crea('autor', { tipus: 'recepta', slug: 'olleta', any: 2023 });
    const abans = await com(null, 'SELECT count(*)::int AS n FROM public.revisions_patrimoni WHERE tenant_id=$1', [POBLE]);
    assert.equal(abans.rows[0].n, 3);
    await db.query('DELETE FROM auth.users WHERE id=$1', [actors.autor]);
    const despres = await com(null, 'SELECT count(*)::int AS n FROM public.revisions_patrimoni WHERE tenant_id=$1', [POBLE]);
    assert.equal(despres.rows[0].n, 0);
  });
});
