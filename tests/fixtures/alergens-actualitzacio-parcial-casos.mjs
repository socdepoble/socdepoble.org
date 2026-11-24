import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { creaActualitzacioUnanimitat } from '../../src/data/menjarIBeure/actualitzacioUnanimitat.js';
import { ingereixResultatsUnanimitat, projectaAlergensPatrimoni, CORPUS_UNANIMITAT } from '../../src/data/menjarIBeure/alergensPatrimoni.js';
import { CATALEG_UNANIMITAT } from '../../tooling/gates/lib/cataleg-unanimitat.mjs';
import { registreFixture, jsonlFixture } from './alergens-unanimitat.mjs';
const identities = [
  { corpus: 'quedinem', uid: 'quedinem:allioli' }, { corpus: 'bar', uid: 'bar-producte:patates-picants' },
  { corpus: 'nevera-ing', uid: 'nevera-ingredient:ou' }, { corpus: 'nevera-rec', uid: 'nevera-recepta:truita-de-creilla' },
  { corpus: 'llavors', uid: 'llavor-cv:cv-04-alberginia-blanca' }, { corpus: 'herbari', uid: 'herbari:alfabega' }
];
const records = () => identities.map(identity => registreFixture(identity));
const pending = () => registreFixture({ corpus: 'quedinem', uid: 'quedinem:pa-rustic', estatConsens: 'PRECAUCIO_MAXIMA_REVISIO_MESTRE', rondesUsades: 3, discrepantsFinals: ['aptitud'] });
export function registraCasosActualitzacioParcial(test, assert) {
  test('catalogue identities come from all six local sources, not the live progress counter', () => {
    assert.equal(CATALEG_UNANIMITAT.length, 469); assert.equal(new Set(CATALEG_UNANIMITAT.map(r => r.uid)).size, 469);
    assert.deepEqual(Object.fromEntries(CORPUS_UNANIMITAT.map(c => [c, CATALEG_UNANIMITAT.filter(r => r.corpus === c).length])),
      { quedinem: 149, bar: 31, 'nevera-ing': 30, 'nevera-rec': 14, llavors: 128, herbari: 117 });
    for (const identity of identities) assert.ok(CATALEG_UNANIMITAT.some(r => r.uid === identity.uid && r.corpus === identity.corpus));
  });
  test('six real-catalogue fixtures consolidate independently and pending matrix never leaks into the update', () => {
    const update = creaActualitzacioUnanimitat(jsonlFixture(...records(), pending()), CATALEG_UNANIMITAT);
    assert.equal(update.estat, 'parcial'); assert.equal(update.certificacioExperta, false); assert.equal(update.acreditatPerAlConsum, false);
    assert.equal(update.consolidats.length, 6); assert.equal(update.pendents.length, 1);
    for (const corpus of CORPUS_UNANIMITAT) assert.equal(update.corpus[corpus].consolidats, 1);
    const index = ingereixResultatsUnanimitat(update.jsonl);
    for (const identity of identities) assert.equal(projectaAlergensPatrimoni(identity, index).estat, 'consolidat');
    const notReady = projectaAlergensPatrimoni({ uid: pending().uid, corpus: 'quedinem' }, index);
    assert.ok(Object.values(notReady.matriu).every(cell => cell.estat === 'desconegut'));
    assert.equal(notReady.classificatComAliment, false); assert.equal(notReady.acreditatPerAlConsum, false);
  });
  test('packaged real checkpoint is four rows; all 465 remaining local identities stay unknown', () => {
    const bytes = fs.readFileSync(new URL('../../src/data/menjarIBeure/checkpoints/unanimitat8.r3258.jsonl', import.meta.url));
    const manifest = JSON.parse(fs.readFileSync(new URL('../../src/data/menjarIBeure/checkpoints/unanimitat8.r3258.manifest.json', import.meta.url), 'utf8'));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.jsonlSha256);
    const index = ingereixResultatsUnanimitat(bytes.toString('utf8'));
    assert.equal(index.estat, 'validat'); assert.equal(index.registres.length, 4);
    assert.deepEqual(index.registres.map(r => r.uid), manifest.consolidats.map(r => r.uid));
    assert.equal(manifest.pendents.length, 6); assert.equal(manifest.coberturaGlobal, 'parcial');
    assert.equal(manifest.certificacioExperta, false); assert.equal(manifest.acreditatPerAlConsum, false);
    let known = 0, unknown = 0;
    for (const identity of CATALEG_UNANIMITAT) {
      const projection = projectaAlergensPatrimoni(identity, index);
      assert.equal(projection.acreditatPerAlConsum, false); assert.equal(projection.certificacioExperta, false);
      if (projection.estat === 'consolidat') known++;
      else { unknown++; assert.ok(Object.values(projection.matriu).every(cell => cell.estat === 'desconegut')); assert.equal(projection.classificatComAliment, false); }
      if (projection.toxicitatAdvertidaFont) assert.equal(projection.ambitConsum, 'no_consum');
    }
    assert.equal(known, 4); assert.equal(unknown, 465);
    assert.equal(Object.values(manifest.corpus).reduce((n, r) => n + r.desconeguts, 0), 465);
    assert.equal(Object.values(manifest.corpus).reduce((n, r) => n + r.senseResultat, 0), 459);
    assert.ok(manifest.pendents.every(p => !index.registres.some(r => r.uid === p.uid)));
  });
  for (const aptitud of ['toxica', 'no_comestible', 'aromatica_infusio']) test(`partial update never upgrades ${aptitud} to ordinary food`, () => {
    const row = registreFixture({ aptitud }), update = creaActualitzacioUnanimitat(jsonlFixture(row), CATALEG_UNANIMITAT);
    assert.equal(update.estat, 'parcial'); const projection = projectaAlergensPatrimoni({ uid: row.uid, corpus: 'herbari' }, ingereixResultatsUnanimitat(update.jsonl));
    assert.equal(projection.classificatComAliment, false); assert.equal(projection.acreditatPerAlConsum, false);
    assert.equal(projection.ambitConsum, aptitud === 'aromatica_infusio' ? 'aromatic_infusio_limitat' : 'no_consum');
  });
  const badInputs = [
    ['truncated final line', rows => jsonlFixture(...rows) + '{"uid":'],
    ['duplicate key', rows => jsonlFixture(...rows).replace('"uid":', '"uid":"quedinem:allioli","uid":')],
    ['duplicate identity', rows => jsonlFixture(...rows, rows[0])],
    ['replaced eighth school', rows => { rows[0].votsPerEscola.fake = rows[0].votsPerEscola['phi4:14b']; delete rows[0].votsPerEscola['phi4:14b']; return jsonlFixture(...rows); }],
    ['conflicting matrix', rows => { rows[0].votsPerEscola['phi4:14b'].alergens.ous = 'absent'; return jsonlFixture(...rows); }],
    ['forged source toxicity', rows => jsonlFixture(...rows, registreFixture({ uid: 'herbari:baladre' }))],
    ['unknown later catalogue identity', rows => jsonlFixture(...rows, registreFixture({ uid: 'quedinem:no-existeix', corpus: 'quedinem' }))]
  ];
  for (const [name, mutate] of badInputs) test(`whole-input refusal before selection: ${name}`, () => {
    const update = creaActualitzacioUnanimitat(mutate(records()), CATALEG_UNANIMITAT);
    assert.equal(update.estat, 'malformat'); assert.equal(update.jsonl, undefined); assert.equal(update.consolidats, undefined);
  });
  test('catalogue accessors, holes and duplicate identities cannot provide trusted identities', () => {
    let calls = 0; const row = { corpus: 'quedinem' }; Object.defineProperty(row, 'uid', { enumerable: true, get() { calls++; return 'quedinem:allioli'; } });
    const malformed = [[row, ...CATALEG_UNANIMITAT.slice(1)], new Array(8), [...CATALEG_UNANIMITAT, CATALEG_UNANIMITAT[0]]];
    for (const catalog of malformed) assert.equal(creaActualitzacioUnanimitat(jsonlFixture(...records()), catalog).estat, 'malformat');
    assert.equal(calls, 0);
  });
  test('canonical update bytes are stable across record order and key order', () => {
    const a = creaActualitzacioUnanimitat(jsonlFixture(...records(), pending()), CATALEG_UNANIMITAT);
    const reversed = [...records(), pending()].reverse().map(r => Object.fromEntries(Object.entries(r).reverse()));
    const b = creaActualitzacioUnanimitat(jsonlFixture(...reversed), CATALEG_UNANIMITAT);
    assert.deepEqual(a, b); assert.ok(Object.isFrozen(a)); assert.ok(Object.isFrozen(a.consolidats)); assert.ok(Object.isFrozen(a.corpus.quedinem));
  });
}
