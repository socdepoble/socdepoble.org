import { ALERGENS, matriuAlergens } from '../../src/data/menjarIBeure/allergens.js';
import { ESCOLES_UNANIMITAT, LIMITS_UNANIMITAT, normalitzaCorpusUnanimitat, validaRegistreUnanimitat, ingereixResultatsUnanimitat, projectaAlergensPatrimoni } from '../../src/data/menjarIBeure/alergensPatrimoni.js';
import { CORPUS_FIXTURE, ESCOLES_FIXTURE, registreFixture, jsonlFixture } from './alergens-unanimitat.mjs';
export function registraCasosUnanimitat(test, assert) {
  const consulta = (r, index = ingereixResultatsUnanimitat(jsonlFixture(r))) => projectaAlergensPatrimoni({ uid: r.uid, corpus: r.corpus }, index);
  const desconegut = p => { assert.equal(Object.keys(p.matriu).length, 14); assert.ok(Object.values(p.matriu).every(c => c.estat === 'desconegut' && c.font === null)); assert.equal(p.classificatComAliment, false); assert.equal(p.acreditatPerAlConsum, false); };
  test('producer fixture uses the exact eight model identifiers and all 14 canonical keys', () => {
    assert.deepEqual(ESCOLES_UNANIMITAT, ESCOLES_FIXTURE); assert.equal(ALERGENS.length, 14);
    const r = registreFixture(); assert.equal(validaRegistreUnanimitat(r).valid, true);
    const p = consulta(r); assert.equal(p.matriu.ous.estat, 'ingredient'); assert.equal(p.matriu.sesam.estat, 'traca'); assert.equal(p.matriu.llet.estat, 'absent');
    assert.equal(p.classificatComAliment, true); assert.equal(p.acreditatPerAlConsum, false); assert.equal(p.certificacioExperta, false);
    assert.deepEqual(p.matriu, matriuAlergens(p.matriu)); assert.ok(p.avisos.some(s => s.includes('no és una certificació')));
  });
  for (const [corpus, raw, uid] of CORPUS_FIXTURE) test(`exact raw and canonical aliases: ${corpus}`, () => {
    assert.equal(normalitzaCorpusUnanimitat(raw), corpus); assert.equal(normalitzaCorpusUnanimitat(corpus), corpus);
    const r = registreFixture({ uid, corpus: raw }); assert.equal(validaRegistreUnanimitat(r).valid, true);
    const index = ingereixResultatsUnanimitat(jsonlFixture(r));
    assert.equal(projectaAlergensPatrimoni({ uid, corpus }, index).estat, 'consolidat');
    assert.equal(projectaAlergensPatrimoni({ uid, corpus: raw }, index).corpus, corpus);
  });
  for (const prefix of ['llavor-cv:', 'llavor-avl:', 'llavor-atles:', 'olivera-gva:']) test(`seed namespace ${prefix}`, () => assert.equal(validaRegistreUnanimitat(registreFixture({ uid: `${prefix}varietat-1`, corpus: 'llavors' })).valid, true));
  for (const ronda of [1, 2, 3]) test(`consensus exact round ${ronda}`, () => assert.equal(validaRegistreUnanimitat(registreFixture({ estatConsens: `UNANIMITAT_8_DE_8_R${ronda}`, rondesUsades: ronda })).valid, true));
  test('unknown herbari IDs cannot assert a food classification', () => {
    const r = registreFixture({ uid: 'herbari:inventada' });
    assert.equal(validaRegistreUnanimitat(r).valid, false); desconegut(consulta(r));
  });
  test('missing checkpoint, empty checkpoint and absent UID remain honest unknown', () => {
    assert.equal(ingereixResultatsUnanimitat().estat, 'absent'); assert.equal(ingereixResultatsUnanimitat('').estat, 'pendent');
    const r = registreFixture(); desconegut(consulta(r, ingereixResultatsUnanimitat()));
    desconegut(projectaAlergensPatrimoni({ uid: 'herbari:absent', corpus: 'herbari' }, ingereixResultatsUnanimitat(jsonlFixture(r))));
  });
  test('unresolved PRECAUCIO result never leaks the conservative matrix or food default', () => {
    const r = registreFixture({ estatConsens: 'PRECAUCIO_MAXIMA_REVISIO_MESTRE', rondesUsades: 3, discrepantsFinals: ['falten_escoles'], votsPerEscola: {} });
    assert.equal(validaRegistreUnanimitat(r).valid, true); assert.equal(ingereixResultatsUnanimitat(jsonlFixture(r)).estat, 'pendent'); desconegut(consulta(r));
  });
  for (const aptitud of ['toxica', 'no_comestible', 'aromatica_infusio']) test(`14 absences never grant ordinary food or consumption accreditation: ${aptitud}`, () => {
    const r = registreFixture({ aptitud, matriuFinal: Object.fromEntries(ALERGENS.map(k => [k, 'absent'])) }); const p = consulta(r);
    assert.equal(p.aptitud, aptitud); assert.equal(p.classificatComAliment, false); assert.equal(p.acreditatPerAlConsum, false); assert.equal(p.certificacioExperta, false);
    assert.equal(p.ambitConsum, aptitud === 'aromatica_infusio' ? 'aromatic_infusio_limitat' : 'no_consum');
    assert.ok(p.avisos.some(s => aptitud === 'aromatica_infusio' ? s.includes('part i la preparació') : s.includes('No ingeriu')));
  });
  for (const uid of ['herbari:baladre', 'herbari:grevol', 'herbari:teix']) test(`canonical source toxicity overrides false food consensus ${uid}`, () => {
    const r = registreFixture({ uid }); assert.ok(validaRegistreUnanimitat(r).errors.includes('conflicte_toxicitat_font')); desconegut(consulta(r));
    const pending = projectaAlergensPatrimoni({ uid, corpus: 'herbari' }); assert.equal(pending.toxicitatAdvertidaFont, true); assert.equal(pending.ambitConsum, 'no_consum');
    assert.equal(consulta(registreFixture({ uid, aptitud: 'toxica' })).classificatComAliment, false);
  });
  const invalides = [
    ['no votes', r => { r.votsPerEscola = {}; }],
    ['one missing school', r => { delete r.votsPerEscola['phi4:14b']; }],
    ['fake ninth school', r => { r.votsPerEscola.fake = r.votsPerEscola['phi4:14b']; }],
    ['fake replacement school', r => { r.votsPerEscola.fake = r.votsPerEscola['phi4:14b']; delete r.votsPerEscola['phi4:14b']; }],
    ['disagreeing aptitud vote', r => { r.votsPerEscola['phi4:14b'].aptitud = 'toxica'; }],
    ['disagreeing matrix vote', r => { r.votsPerEscola['phi4:14b'].alergens.ous = 'absent'; }],
    ['incomplete vote', r => { delete r.votsPerEscola['phi4:14b'].alergens.ous; }],
    ['vote justification object', r => { r.votsPerEscola['phi4:14b'].justificacio = {}; }],
    ['round contradiction', r => { r.rondesUsades = 2; }],
    ['unresolved field in unanimous result', r => { r.discrepantsFinals = ['ous']; }],
    ['fake label', r => { r.estatConsens = 'UNANIMITAT_8_DE_8_R1_APPROVED'; }],
    ['unknown pending status', r => { r.estatConsens = 'PENDENT'; }],
    ['missing allergen', r => { delete r.matriuFinal.api; }],
    ['extra allergen', r => { r.matriuFinal.coco = 'absent'; }],
    ['input ingredient is not producer conte', r => { r.matriuFinal.ous = 'ingredient'; }],
    ['cell object', r => { r.matriuFinal.ous = { estat: 'conte' }; }],
    ['aptitud object', r => { r.aptitud = {}; }],
    ['summary object', r => { r.justificacioSintesi = {}; }],
    ['short summary', r => { r.justificacioSintesi = 'ok'; }],
    ['name object', r => { r.nom = {}; }],
    ['timestamp object', r => { r.timestamp = {}; }],
    ['unknown authority field', r => { r.certificacioExperta = true; }],
    ['wrong corpus namespace', r => { r.corpus = 'bar'; }],
    ['unknown corpus', r => { r.corpus = 'herbari-v2'; }],
    ['uid path traversal', r => { r.uid = 'herbari:../../private'; }],
    ['uid extra namespace', r => { r.uid = 'herbari:a:b'; }],
    ['uid object', r => { r.uid = {}; }],
    ['diff object injection', r => { r.discrepanciesAmbCodiActual = [{ alergen: 'ous', codiActual: {}, dictamenNode0: 'absent' }]; }]
  ];
  for (const [name, mutate] of invalides) test(`fail closed: ${name}`, () => {
    const r = registreFixture(); mutate(r); assert.equal(validaRegistreUnanimitat(r).valid, false);
    const index = ingereixResultatsUnanimitat(jsonlFixture(r)); assert.equal(index.estat, 'malformat'); desconegut(consulta(registreFixture(), index));
  });
  test('getters, nonplain objects, cycles, functions and dangerous keys never execute', () => {
    let reads = 0; const getter = registreFixture(); Object.defineProperty(getter, 'aptitud', { get() { reads++; throw Error('getter'); } });
    assert.equal(validaRegistreUnanimitat(getter).valid, false);
    const index = {}; Object.defineProperty(index, 'estat', { get() { reads++; throw Error('getter'); } });
    desconegut(consulta(registreFixture(), index)); assert.equal(reads, 0);
    const cycle = registreFixture(); cycle.self = cycle;
    for (const r of [null, [], new Date(), cycle, () => {}, JSON.parse('{"__proto__":{"polluted":true}}')]) assert.equal(validaRegistreUnanimitat(r).valid, false);
    assert.equal({}.polluted, undefined);
  });
  test('sparse index arrays and poisoned identities remain bounded and unknown', () => {
    const registres = []; registres.length = 2 ** 32 - 1;
    desconegut(consulta(registreFixture(), { estat: 'validat', registres }));
    const foraLimit = [registreFixture()]; foraLimit.length = LIMITS_UNANIMITAT.registres + 1;
    desconegut(consulta(registreFixture(), { estat: 'validat', registres: foraLimit }));
    let reads = 0; const identity = {}; Object.defineProperty(identity, 'uid', { get() { reads++; throw Error(); } });
    desconegut(projectaAlergensPatrimoni(identity)); assert.equal(reads, 0);
  });
  for (const raw of ['{', '{}\n', 'null\n', '[]\n', '{"__proto__":{}}\n']) test(`malformed/nonrecord JSONL ${JSON.stringify(raw)}`, () => { const i = ingereixResultatsUnanimitat(raw); assert.equal(i.estat, 'malformat'); desconegut(consulta(registreFixture(), i)); });
  test('nonterminated producer JSONL is partial even when the last JSON object is complete', () => {
    const raw = JSON.stringify(registreFixture()); assert.ok(ingereixResultatsUnanimitat(raw).errors.some(e => e.codi === 'linia_final_parcial'));
    const mixed = ingereixResultatsUnanimitat(jsonlFixture(registreFixture()) + '{"uid":'); assert.equal(mixed.estat, 'malformat'); assert.equal(mixed.registres.length, 0);
  });
  test('duplicate UIDs (identical or conflicting) invalidate the entire checkpoint', () => {
    const r = registreFixture(); for (const other of [r, registreFixture({ aptitud: 'toxica' })]) { const i = ingereixResultatsUnanimitat(jsonlFixture(r, other)); assert.equal(i.estat, 'malformat'); assert.ok(i.errors.some(e => e.codi === 'uid_duplicat')); desconegut(consulta(r, i)); }
  });
  test('duplicate raw and escaped JSON keys cannot be silently replaced', () => {
    const raw = JSON.stringify(registreFixture());
    for (const corrupt of [raw.replace('"uid":', '"uid":"herbari:teix","uid":'), raw.replace('"gluten":', '"gluten":"conte","gluten":'), raw.replace('"gluten":', '"glu\\u0074en":"conte","gluten":'), raw.replace('"iaia-maria:latest":', '"iaia-maria:latest":{},"iaia-maria:latest":')]) assert.ok(ingereixResultatsUnanimitat(corrupt + '\n').errors.some(e => e.codi === 'clau_json_duplicada'));
  });
  test('bounded input, line, depth, primitives, CRLF and empty lines', () => {
    for (const input of [{}, 42, false, 'x'.repeat(LIMITS_UNANIMITAT.entrada + 1), ' '.repeat(LIMITS_UNANIMITAT.linia) + 'x\n', '['.repeat(20) + ']'.repeat(20) + '\n']) assert.equal(ingereixResultatsUnanimitat(input).estat, 'malformat');
    assert.equal(ingereixResultatsUnanimitat('\n' + jsonlFixture(registreFixture()).replaceAll('\n', '\r\n') + '\n').registres.length, 1);
  });
  test('ingestion and projection are immutable, detached and deterministic', () => {
    const r = registreFixture(), raw = jsonlFixture(r), a = ingereixResultatsUnanimitat(raw), b = ingereixResultatsUnanimitat(raw);
    assert.deepEqual(a, b); const p = consulta(r, a); assert.ok(Object.isFrozen(p)); assert.ok(Object.isFrozen(p.matriu.ous)); assert.ok(Object.isFrozen(a.registres[0].votsPerEscola));
    r.matriuFinal.ous = 'absent'; assert.equal(p.matriu.ous.estat, 'ingredient');
  });
  const indexDirectesInvalids = [
    ['duplicate conflicting UID', r => ({ estat: 'validat', registres: [r, registreFixture({ aptitud: 'no_comestible' })], errors: [], avisos: [] })],
    ['duplicate identical UID', r => ({ estat: 'validat', registres: [r, registreFixture()], errors: [], avisos: [] })],
    ['invalid unrelated row', r => ({ estat: 'validat', registres: [r, registreFixture({ uid: 'bar-producte:incomplet', corpus: 'bar', votsPerEscola: {} })], errors: [], avisos: [] })],
    ['nonempty error list', r => ({ estat: 'validat', registres: [r], errors: [{ linia: 2, codi: 'json_invalid' }], avisos: [] })],
    ['pending row mislabeled validat', r => ({ estat: 'validat', registres: [r, registreFixture({ uid: 'bar-producte:pendent', corpus: 'bar', estatConsens: 'PRECAUCIO_MAXIMA_REVISIO_MESTRE', rondesUsades: 3, discrepantsFinals: ['falten_escoles'], votsPerEscola: {} })], errors: [], avisos: [] })],
    ['valid rows mislabeled pendent', r => ({ estat: 'pendent', registres: [r], errors: [], avisos: [] })],
    ['missing envelope field', r => ({ estat: 'validat', registres: [r], errors: [] })],
    ['unknown envelope authority field', r => ({ estat: 'validat', registres: [r], errors: [], avisos: [], certificacioExperta: true })]
  ];
  for (const [nom, fabrica] of indexDirectesInvalids) test(`direct index all-or-nothing: ${nom}`, () => {
    const r = registreFixture(); const p = consulta(r, fabrica(r));
    desconegut(p); assert.equal(p.estat, 'invalid');
  });
  test('a complete 469-item envelope can project an item at the end without scan truncation', () => {
    const records = Array.from({ length: 469 }, (_, i) => registreFixture({ uid: `bar-producte:fixture-${i}`, corpus: 'bar' })); const index = ingereixResultatsUnanimitat(jsonlFixture(...records));
    assert.equal(index.registres.length, 469); assert.equal(consulta(records.at(-1), index).estat, 'consolidat');
  });
}
