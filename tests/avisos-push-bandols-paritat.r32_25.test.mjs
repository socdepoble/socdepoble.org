import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalitzaEtiqueta, tipusDAlerta } from '../src/sections/mur/alertesMunicipals.js';
import { bootstrap, database, migrate } from './fixtures/r32_25-push.mjs';

const corpusBytes = readFileSync(new URL('./fixtures/avisos-push-unicode16.r32_25.json', import.meta.url));
const corpus = JSON.parse(corpusBytes);
const PIN = '120b5afaff4dda4b4c890cbadaf6ec444054b2f231d9ca96db29b4c4b0c0c26d';
const engine = process.env.SDP_R32_25_ENGINE || 'native';
const etiquetes = [
  ...corpus.labels,
  ...corpus.marks.map(cp => `ba${String.fromCodePoint(cp)}ndol urgent`)
];
const hash = b => createHash('sha256').update(b).digest('hex');

test('R32.25 S4 · corpus compartit pinnat i cens complet de marques Unicode 16.0', () => {
  assert.equal(hash(corpusBytes), PIN);
  assert.equal(process.versions.unicode, corpus.unicode, 'Una actualització d’Unicode exigix reconciliar el corpus i el mirall SQL.');
  const actuals = [];
  for (let cp = 0; cp <= 0x10ffff; cp += 1) {
    if (/\p{M}/u.test(String.fromCodePoint(cp))) actuals.push(cp);
  }
  assert.equal(corpus.markCount, 2501);
  assert.equal(corpus.marks.length, 2501);
  assert.deepEqual(corpus.marks, actuals);
  assert.equal(normalitzaEtiqueta('🌱'.repeat(26) + 'Bàndol urgent'), '');
  assert.equal(normalitzaEtiqueta('🌱'.repeat(25) + 'Bàndol urgent'), 'bandol_urgent');
  assert.equal(normalitzaEtiqueta('🌱'.repeat(33) + 'alerta'), '');
  assert.equal(normalitzaEtiqueta('ba\u0903ndol urgent'), 'bandol_urgent');
});

test(`R32.25 S4 · funcions JS reals contra SQL real · ${engine}`, { timeout: 180_000 }, async t => {
  assert.ok(['native', 'pglite'].includes(engine));
  const db = await database(engine);
  t.after(() => db.close());
  await bootstrap(db);
  await migrate(db);
  const versio = (await db.query("select current_setting('server_version_num') v,version() detall")).rows[0];
  if (engine === 'native') assert.equal(versio.v, '180006', 'La prova nativa ha de ser PostgreSQL 18.6.');
  t.diagnostic(JSON.stringify({ engine, version: versio.detall, corpusSha256: PIN,
    jsRealSha256: hash(readFileSync(new URL('../src/sections/mur/alertesMunicipals.js', import.meta.url))),
    normalitzacions: etiquetes.length, classificacions: corpus.items.length, marquesUnicode16: corpus.marks.length }));

  await t.test('normalitzaEtiqueta · accents, NFD, formes JSON, UTF-16 i les 2501 marques', async () => {
    const files = (await db.query(`select n::integer as n,
      private.avisos_push_normalitza(private.avisos_push_etiqueta(valor)) as net
      from jsonb_array_elements($1::jsonb) with ordinality as e(valor,n) order by n`, [JSON.stringify(etiquetes)])).rows;
    assert.equal(files.length, etiquetes.length);
    for (let i = 0; i < files.length; i += 1) {
      const esperat = normalitzaEtiqueta(etiquetes[i]);
      assert.equal(files[i].net, esperat, `etiqueta[${i}] ${JSON.stringify(etiquetes[i])}`);
    }
    const nfd = (await db.query('select private.avisos_push_normalitza($1) a,private.avisos_push_normalitza($2) b', ['Bàndol urgent', 'Ba\u0300ndol urgent'])).rows[0];
    assert.equal(nfd.a, 'bandol_urgent');
    assert.equal(nfd.b, nfd.a);
  });

  await t.test('tipusDAlerta · prioritats, 32 per llista, camps singulars i tipus exclosos', async () => {
    const files = (await db.query(`select n::integer as n,private.avisos_push_tipus_alerta(valor) as tipus
      from jsonb_array_elements($1::jsonb) with ordinality as e(valor,n) order by n`, [JSON.stringify(corpus.items)])).rows;
    assert.equal(files.length, corpus.items.length);
    for (let i = 0; i < files.length; i += 1) assert.equal(files[i].tipus, tipusDAlerta(corpus.items[i]), `item[${i}] ${JSON.stringify(corpus.items[i])}`);
  });

  await t.test('paritat de classificació també amb cada marca, no només del normalitzador aïllat', async () => {
    const items = corpus.marks.map(cp => ({ labels: [`ba${String.fromCodePoint(cp)}ndol urgent`] }));
    const files = (await db.query(`select n::integer as n,private.avisos_push_tipus_alerta(valor) as tipus
      from jsonb_array_elements($1::jsonb) with ordinality as e(valor,n) order by n`, [JSON.stringify(items)])).rows;
    assert.equal(files.length, 2501);
    for (let i = 0; i < files.length; i += 1) {
      assert.equal(files[i].tipus, tipusDAlerta(items[i]), `General_Category=Mark U+${corpus.marks[i].toString(16)}`);
      assert.equal(files[i].tipus, 'bandol_urgent');
    }
  });

  await t.test('domini declarat: valors no representables a PostgreSQL no es presenten com paritat', async () => {
    // Les dues funcions JS accepten objectes del runtime; SQL rep text/jsonb.
    // No es fingix equivalència per getters, undefined, Symbol o surrogats solts.
    assert.match(corpus.limits, /JSON domain only/);
    await assert.rejects(db.query('select private.avisos_push_normalitza($1)', ['ba\u0000ndol urgent']));
    await assert.rejects(db.query('select private.avisos_push_tipus_alerta($1::jsonb)', ['{"labels":["\\ud800"]}']));
  });
});
