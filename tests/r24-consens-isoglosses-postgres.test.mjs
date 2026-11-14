/* R24 · CODEX-R24-03 · El mapatge del port 'consensIsoglosses' (src/data/consensIsoglosses.js,
   el mateix que fa servir l'adaptador Supabase) contra els objectes SQL de les migracions R23 de
   la capacitat, sobre PostgreSQL 18.6 real amb tot el catàleg en l'ordre del verificador:
     · public.resum_consens_isoglosses_poble(text), cridada com anon i en JSON, com PostgREST;
     · public.joc_isoglosses_vots_consens, INSERT … ON CONFLICT (user_id, pregunta_id,
       variant_clau) DO NOTHING com authenticated (Prefer: resolution=ignore-duplicates);
     · public.aportacions_veu_poble, INSERT com authenticated (Prefer: return=representation).
   Les migracions es troben pel CONTINGUT (l'objecte que creen) i no pel nom del fitxer, que un
   altre carril pot reanomenar. Cap migració d'esta prova canvia l'SQL R23: és del carril de la
   targeta. Les observacions de l'SQL que el port no corregix ixen com a diagnòstic. Cap servei remot. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { creaPlaMigracions } from '../tooling/node0/hidrata-postgres-node0.mjs';
import { startLocalPostgres } from './fixtures/postgres-local.mjs';
import {
  aportacioDelServidor, capturaAportacioVeu, capturaConsultaConsens, capturaVotVariant, filaDAportacio, filaDeVot,
  resumConsensDelServidor, votDelServidor
} from '../src/data/consensIsoglosses.js';

const id = n => `24000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const [ANNA, BERTA, CARME] = [1, 2, 3].map(id);

async function com(db, who, sql, params = []) {
  const role = who ? 'authenticated' : 'anon';
  await db.query('begin');
  try {
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.role',$2,true),set_config('request.jwt.claims',$3,true)",
      [who ?? '', role, JSON.stringify({ sub: who, role, aal: 'aal1' })]);
    const r = await db.query(sql, params);
    await db.query('commit'); return r;
  } catch (e) { await db.query('rollback'); throw e; }
}
/* PostgREST: les columnes són les claus del cos i les files venen de json_populate_recordset. */
const insercio = (taula, fila, { conflicte = null, retorna }) => {
  const cols = Object.keys(fila).join(', ');
  return [`with ins as (insert into public.${taula} (${cols}) select ${cols} from json_populate_recordset(null::public.${taula}, $1::json)
    ${conflicte ? `on conflict (${conflicte}) do nothing` : ''} returning ${retorna}) select coalesce(json_agg(ins), '[]'::json) as j from ins`,
  [JSON.stringify([fila])]];
};
const vota = async (db, who, entrada, userId = who) => {
  const vot = capturaVotVariant(entrada);
  const [sql, params] = insercio('joc_isoglosses_vots_consens', filaDeVot(vot, userId), { conflicte: 'user_id, pregunta_id, variant_clau', retorna: 'pregunta_id, variant_clau' });
  return votDelServidor((await com(db, who, sql, params)).rows[0].j, vot);
};
const resum = async (db, entrada) => {
  const { preguntaId } = capturaConsultaConsens(entrada);
  const r = await com(db, null, "select coalesce(json_agg(r), '[]'::json) as j from public.resum_consens_isoglosses_poble($1) r", [preguntaId]);
  return { cru: r.rows[0].j, dto: resumConsensDelServidor(r.rows[0].j) };
};
const error = code => e => e.code === code;
const APORTACIO = Object.freeze({ tipus: 'variant_isoglossa', id: 'iso-1763100000000', paraula: 'Creïlla de secà', poble: 'La Torre de les Maçanes',
  comarcaId: 'alacanti', comarcaNom: 'L’Alacantí', areaId: 'alacanti_vinalopo', abastComarcal: 'nomes_poble', pobleComarca: 'La Torre de les Maçanes · L’Alacantí',
  preguntaId: 'q01_creilla', opcioVivaId: 'viva:q01_creilla:creilla_de_seca', consentimentArxiuObert: true, consentimentVersio: 'cc-by-sa-4.0-v1',
  consentimentAcceptatAt: '2026-11-14T06:00:00.000Z' });

test('R24 · consensIsoglosses: el mapatge del port sobre l’SQL R23 en PostgreSQL 18.6 real', { timeout: 300000 }, async t => {
  const cluster = await startLocalPostgres(), db = cluster.db;
  try {
    assert.equal((await db.query("select current_setting('server_version_num') as n")).rows[0].n, '180006');
    const plan = creaPlaMigracions();
    const de = text => plan.migrations.filter(m => m.body.toLowerCase().includes(text.toLowerCase())).map(m => m.file);
    const [aportacions] = de('create table if not exists public.aportacions_veu_poble');
    const [vots] = de('create table if not exists public.joc_isoglosses_vots_consens');
    assert.ok(aportacions && vots, 'les dues migracions R23 de la capacitat són al catàleg');
    const fi = Math.max(...[aportacions, vots].map(f => plan.migrations.findIndex(m => m.file === f)));
    t.diagnostic(`R23: ${aportacions} i ${vots}; catàleg aplicat fins a la posició ${fi + 1} de ${plan.migrations.length}`);
    await db.query(plan.bootstrap);
    for (const migration of plan.migrations.slice(0, fi + 1)) {
      await db.query('begin');
      try { await db.query(migration.body); await db.query('commit'); }
      catch (e) { await db.query('rollback'); throw new Error(`catàleg ${migration.file}: ${e.message}`, { cause: e }); }
    }
    for (const [n, who] of [ANNA, BERTA, CARME].entries()) {
      await db.query('insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values($1,$2,now(),$3)', [who, `${who}@example.invalid`, { full_name: `Persona sintètica ${n}` }]);
    }

    await t.test('vot: la fila del port passa CHECK, RLS i la UNIQUE; el repetit no és nou', async () => {
      const vot = { preguntaId: 'q01_creilla', variantClau: 'querilla', paraulaEtiqueta: 'Querilla', poble: '', comarcaId: 'no_ho_se', abastComarcal: 'no_ho_se' };
      assert.deepEqual(await vota(db, ANNA, vot), { preguntaId: 'q01_creilla', variantClau: 'querilla', nou: true });
      assert.deepEqual(await vota(db, ANNA, vot), { preguntaId: 'q01_creilla', variantClau: 'querilla', nou: false });
      assert.deepEqual(await vota(db, BERTA, { ...vot, poble: 'Xixona', comarcaId: 'alacanti', abastComarcal: 'crec_comarca' }), { preguntaId: 'q01_creilla', variantClau: 'querilla', nou: true });
      assert.equal((await db.query('select count(*)::int as n from public.joc_isoglosses_vots_consens')).rows[0].n, 2);
      const fila = (await db.query('select poble, comarca_id, abast_comarcal from public.joc_isoglosses_vots_consens where user_id=$1', [ANNA])).rows[0];
      assert.deepEqual(fila, { poble: null, comarca_id: null, abast_comarcal: 'no_ho_se' }, 'cap poble buit ni la comarca «no ho sé»');
    });

    await t.test('vot: l’autoria només pot ser la de la sessió (RLS) i anon no vota', async () => {
      await assert.rejects(vota(db, ANNA, { preguntaId: 'q01_creilla', variantClau: 'querila', paraulaEtiqueta: 'Querila' }, BERTA), error('42501'), 'una fila amb un altre user_id');
      await assert.rejects(com(db, null, ...insercio('joc_isoglosses_vots_consens', filaDeVot(capturaVotVariant({ preguntaId: 'q01_creilla', variantClau: 'querila', paraulaEtiqueta: 'Querila' }), ANNA), { conflicte: 'user_id, pregunta_id, variant_clau', retorna: 'pregunta_id' })), error('42501'));
    });

    await t.test('resum: anon llig la RPC en JSON i el port en fa el DTO sense cap identificador', async () => {
      const { cru, dto } = await resum(db);
      assert.deepEqual(Object.keys(cru[0]).sort(), ['comarca_id', 'paraula_etiqueta', 'poble_exemple', 'pregunta_id', 'total_vots', 'variant_clau']);
      /* Onada R24.2 (R23-U05 + CODEX-R24-D1-07) · Una fila per pregunta, variant i comarca: ANNA sense
         comarca i BERTA a l'Alacantí ja no es barregen en una parella poble/comarca de vots diferents. */
      /* Gauntlet R24.2 · el poble que ha escrit una sola persona no ix mai (cal que dos vots el comparteixen). */
      assert.deepEqual(dto, [
        { preguntaId: 'q01_creilla', variantClau: 'querilla', paraula: 'Querilla', poble: null, comarcaId: 'alacanti', vots: 1 },
        { preguntaId: 'q01_creilla', variantClau: 'querilla', paraula: 'Querilla', poble: null, comarcaId: null, vots: 1 }
      ]);
      assert.ok(!JSON.stringify(cru).includes(ANNA) && !JSON.stringify(cru).includes(BERTA));
      assert.deepEqual((await resum(db, { preguntaId: 'q02_espencat' })).dto, []);
    });

    await t.test('resum: una etiqueta escrita sense el port (min de paraula_etiqueta) no es pinta damunt de la variant', async () => {
      await com(db, CARME, "insert into public.joc_isoglosses_vots_consens(user_id,pregunta_id,variant_clau,paraula_etiqueta) values($1,'q01_creilla','querilla','AAA text lliure')", [CARME]);
      const { cru, dto } = await resum(db, { preguntaId: 'q01_creilla' });
      /* La fila sense comarca (ANNA i CARME) passa davant amb 2 vots. */
      assert.equal(cru[0].comarca_id, null);
      assert.equal(cru[0].paraula_etiqueta, 'AAA text lliure', 'la RPC el torna a qualsevol visitant');
      assert.equal(dto[0].paraula, 'querilla');
      assert.equal(dto[0].vots, 2);
      assert.equal(dto.reduce((n, f) => n + f.vots, 0), 3);
      t.diagnostic('SQL R23 · resum_consens_isoglosses_poble publica a anon min(paraula_etiqueta) de text lliure, sense moderació: el port neutralitza l’etiqueta; el poble només ix compartit per dos vots (R24.2)');
    });

    /* Onada R24.2 (R23-U05 de Codex, CODEX-R24-D1-07) · Abans una sola fila barrejava min(poble) i
       min(comarca_id) de vots diferents (Alcoi amb l'Alacantí). Ara, una fila per comarca, i el poble
       de cada fila és el més freqüent d'eixa mateixa comarca. */
    await t.test('resum: una fila per comarca (R23-U05) i el poble només quan dos vots el comparteixen (Gauntlet R24.2)', async () => {
      await vota(db, ANNA, { preguntaId: 'q03_bresquilla', variantClau: 'bresquilla_vella', paraulaEtiqueta: 'Bresquilla vella', poble: 'Alcoi', comarcaId: 'alcoia' });
      await vota(db, BERTA, { preguntaId: 'q03_bresquilla', variantClau: 'bresquilla_vella', paraulaEtiqueta: 'Bresquilla vella', poble: 'Xixona', comarcaId: 'alacanti' });
      const files = (await resum(db, { preguntaId: 'q03_bresquilla' })).dto;
      assert.deepEqual(files.map(f => [f.poble, f.comarcaId, f.vots]), [[null, 'alacanti', 1], [null, 'alcoia', 1]]);
      /* Tres vots a l'Alcoià: Alcoi ×2 i Cocentaina ×1 → Alcoi (el més freqüent, i ni min ni max l'encerten tots dos casos). */
      await vota(db, ANNA, { preguntaId: 'q04_pesol', variantClau: 'pesol', paraulaEtiqueta: 'Pésol', poble: 'Cocentaina', comarcaId: 'alcoia' });
      await vota(db, BERTA, { preguntaId: 'q04_pesol', variantClau: 'pesol', paraulaEtiqueta: 'Pésol', poble: 'Alcoi', comarcaId: 'alcoia' });
      await vota(db, CARME, { preguntaId: 'q04_pesol', variantClau: 'pesol', paraulaEtiqueta: 'Pésol', poble: 'Alcoi', comarcaId: 'alcoia' });
      const [fila] = (await resum(db, { preguntaId: 'q04_pesol' })).dto;
      assert.deepEqual([fila.poble, fila.comarcaId, fila.vots], ['Alcoi', 'alcoia', 3]);
    });

    await t.test('aportació: el registre de la targeta, mapejat pel port, entra pendent amb la sessió com a autora', async () => {
      const a = capturaAportacioVeu(APORTACIO);
      const [sql, params] = insercio('aportacions_veu_poble', filaDAportacio(a, ANNA), { retorna: 'id, estat_moderacio, created_at' });
      const rebut = aportacioDelServidor((await com(db, ANNA, sql, params)).rows[0].j);
      assert.equal(rebut.estatModeracio, 'pendent');
      const fila = (await db.query('select user_id, tipus, pregunta_id, text_aportat, poble_comarca, poble, comarca_id, abast_comarcal, consentiment_arxiu_obert, consentiment_versio, consentiment_acceptat_at from public.aportacions_veu_poble where id=$1', [rebut.id])).rows[0];
      assert.deepEqual({ ...fila, consentiment_acceptat_at: fila.consentiment_acceptat_at.toISOString() }, {
        user_id: ANNA, tipus: 'variant_isoglossa', pregunta_id: 'q01_creilla', text_aportat: 'Creïlla de secà', poble_comarca: 'La Torre de les Maçanes · L’Alacantí',
        poble: 'La Torre de les Maçanes', comarca_id: 'alacanti', abast_comarcal: 'nomes_poble', consentiment_arxiu_obert: true, consentiment_versio: 'cc-by-sa-4.0-v1',
        consentiment_acceptat_at: '2026-11-14T06:00:00.000Z' });
      await assert.rejects(com(db, ANNA, ...insercio('aportacions_veu_poble', filaDAportacio(a, BERTA), { retorna: 'id' })), error('42501'), 'cap autoria aliena');
      await assert.rejects(com(db, null, ...insercio('aportacions_veu_poble', filaDAportacio(a, ANNA), { retorna: 'id' })), error('42501'), 'anon no aporta');
    });

    await t.test('aportació: la fila mínima (sense pregunta, comarca ni abast) també passa les CHECK', async () => {
      const a = capturaAportacioVeu({ tipus: 'variant_isoglossa', paraula: 'Pataca', poble: 'Muro', consentimentArxiuObert: true, consentimentVersio: 'cc-by-sa-4.0-v1', consentimentAcceptatAt: '2026-11-14T06:00:00Z' });
      const [sql, params] = insercio('aportacions_veu_poble', filaDAportacio(a, BERTA), { retorna: 'id, estat_moderacio, created_at' });
      assert.equal(aportacioDelServidor((await com(db, BERTA, sql, params)).rows[0].j).estatModeracio, 'pendent');
    });

    /* Onada R24.2 (D-codex_sql_port-3c) · Abans era una observació: anon llegia el user_id de les
       aportacions aprovades. Ara la R23 dona a anon un SELECT per columnes: les públiques sí, l'autoria
       i el camí de l'àudio no. */
    await t.test('R23 · una aportació aprovada: anon llig les columnes públiques, mai el user_id ni el camí de l’àudio', async () => {
      await db.query("update public.aportacions_veu_poble set estat_moderacio='aprovat' where user_id=$1", [BERTA]);
      await assert.rejects(com(db, null, 'select user_id from public.aportacions_veu_poble'), error('42501'));
      await assert.rejects(com(db, null, 'select audio_storage_path from public.aportacions_veu_poble'), error('42501'));
      await assert.rejects(com(db, null, 'select * from public.aportacions_veu_poble'), error('42501'));
      const r = await com(db, null, 'select id, tipus, text_aportat, poble_comarca, estat_moderacio from public.aportacions_veu_poble');
      assert.ok(r.rows.every(f => f.estat_moderacio === 'aprovat'), 'anon només veu les aprovades (RLS)');
    });
  } finally {
    await cluster.close();
  }
});
