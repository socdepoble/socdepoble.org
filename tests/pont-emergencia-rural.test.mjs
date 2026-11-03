import assert from 'node:assert/strict';
import test from 'node:test';

import { generaParellClausFediversityEd25519 } from '../src/data/federacio/portabilitatFediversity.js';
import {
  ESQUEMA_DELTA_EMERGENCIA,
  consolidaOperacionsEmergencia,
  exportaDeltaEmergenciaRural,
  fusionaDeltesEmergenciaRural,
  importaDeltaEmergenciaRural,
  normalitzaOperacioEmergencia,
  verificaDeltaEmergenciaRural,
} from '../src/data/local/pontEmergenciaRural.js';

// Rellotge del receptor fix: el marge de `creatEl` futur no depén de l'hora de la prova.
const ARA = Date.parse('2026-11-03T06:30:00Z');

test('normalitzaOperacioEmergencia segella amb SHA-256 i consolidaOperacionsEmergencia ordena per prioritat i deduplica', () => {
  const opNormal = normalitzaOperacioEmergencia({
    id: 'op-1',
    tipus: 'nota_camp',
    prioritat: 'normal',
    municipi: 'La Torre de les Maçanes',
    creatEl: '2026-11-03T04:00:00Z',
    payload: { nota: 'Font de la plaça amb cabal normal' },
  });
  const opCritica = normalitzaOperacioEmergencia({
    id: 'op-2',
    tipus: 'alerta_proteccio_civil',
    prioritat: 'critica',
    municipi: 'La Torre de les Maçanes',
    creatEl: '2026-11-03T04:10:00Z',
    payload: { alerta: 'Tall elèctric i de fibra per nevada al port' },
  });

  const consolidat = consolidaOperacionsEmergencia([opNormal, opCritica, opNormal]);
  assert.equal(consolidat.duplicadesIgnorades, 1);
  assert.equal(consolidat.operacions.length, 2);
  // L'operació crítica va sempre davant de la normal:
  assert.equal(consolidat.operacions[0].id, 'op-2');
  assert.equal(consolidat.operacions[1].id, 'op-1');
});

test('exportaDeltaEmergenciaRural i verificaDeltaEmergenciaRural amb signatura Ed25519 (FEP-8b32)', async () => {
  const claus = await generaParellClausFediversityEd25519({
    controller: 'https://latorre.socdepoble.org/actors/emergencia',
    idClau: 'https://latorre.socdepoble.org/actors/emergencia#ed25519-dtn',
  });

  const delta = await exportaDeltaEmergenciaRural({
    municipi: 'La Torre de les Maçanes',
    nodeOrigenId: 'node:latorre-ajuntament',
    transport: 'usb-sneakernet',
    generatEl: '2026-11-03T05:00:00Z',
    operacions: [
      {
        id: 'op-cami-1',
        tipus: 'estat_cami',
        prioritat: 'critica',
        entitatId: 'cami:cv-780-port',
        creatEl: '2026-11-03T04:30:00Z',
        payload: { estat: 'tallat_per_neu', km: 14 },
      },
      {
        id: 'op-generador-1',
        tipus: 'recurs_comunitari',
        prioritat: 'alta',
        entitatId: 'recurs:grup-electrogen-cooperativa',
        creatEl: '2026-11-03T04:45:00Z',
        payload: { estat: 'operatiu', autonomiaHores: 36 },
      },
    ],
    privateKeyJwk: claus.privateKeyJwk,
    verificationMethod: claus.idClau,
  });

  assert.equal(delta.schema, ESQUEMA_DELTA_EMERGENCIA);
  assert.equal(delta.totalOperacions, 2);
  assert.ok(delta.proof);

  const verificacio = await verificaDeltaEmergenciaRural(delta, {
    publicKeyJwk: claus.publicKeyJwk,
    exigeixSignatura: true,
    ara: ARA,
  });
  assert.equal(verificacio.valid, true);
  assert.deepEqual(verificacio.motius, []);

  // Si un bit d'una operació s'altera al llapis USB, la verificació ho detecta i bloqueja la importació:
  const deltaCorrupte = {
    ...delta,
    operacions: [
      {
        ...delta.operacions[0],
        payload: { estat: 'obert', km: 14 },
      },
      delta.operacions[1],
    ],
  };

  const importacioRebutjada = await importaDeltaEmergenciaRural(deltaCorrupte, {
    operacionsLocals: [delta.operacions[1]],
    publicKeyJwk: claus.publicKeyJwk,
    exigeixSignatura: true,
    ara: ARA,
  });
  assert.equal(importacioRebutjada.valid, false);
  assert.equal(importacioRebutjada.afegides, 0);
  // L'estat local queda intacte:
  assert.equal(importacioRebutjada.operacions.length, 1);
  assert.equal(importacioRebutjada.operacions[0].id, 'op-generador-1');
});

test('Sneakernet comarcal: fusionaDeltesEmergenciaRural és commutatiu, idempotent i resol l’estat vigent LWW per entitatId', async () => {
  const deltaLaTorre = await exportaDeltaEmergenciaRural({
    municipi: 'La Torre de les Maçanes',
    nodeOrigenId: 'node:latorre',
    generatEl: '2026-11-03T04:15:00Z',
    operacions: [
      {
        id: 'op-cv780-tallat',
        tipus: 'estat_cami',
        prioritat: 'critica',
        entitatId: 'cami:cv-780',
        creatEl: '2026-11-03T04:00:00Z',
        payload: { estat: 'tallat_per_esllavissada' },
      },
      {
        id: 'op-forn-pa',
        tipus: 'recurs_comunitari',
        prioritat: 'normal',
        entitatId: 'recurs:forn-de-llenya',
        creatEl: '2026-11-03T04:10:00Z',
        payload: { estat: 'actiu', racionsDisponibles: 250 },
      },
    ],
  });

  const deltaBrigadaRelleu = await exportaDeltaEmergenciaRural({
    municipi: 'Relleu',
    nodeOrigenId: 'node:brigada-relleu',
    generatEl: '2026-11-03T05:45:00Z',
    operacions: [
      {
        id: 'op-cv780-obert',
        tipus: 'estat_cami',
        prioritat: 'alta',
        entitatId: 'cami:cv-780',
        creatEl: '2026-11-03T05:30:00Z',
        payload: { estat: 'obert_un_carril_netejat_per_pala' },
      },
    ],
  });

  // O89-RURAL-02: estos deltes no van signats, i la signatura s'exigix per defecte.
  // El mode només-integritat s'ha de demanar explícitament.
  const nomesIntegritat = { exigeixSignatura: false, ara: ARA };
  const fusioOrdreAB = await fusionaDeltesEmergenciaRural([
    deltaLaTorre,
    deltaBrigadaRelleu,
    deltaLaTorre, // repetit per comprovar idempotència
  ], nomesIntegritat);

  const fusioOrdreBA = await fusionaDeltesEmergenciaRural([
    deltaBrigadaRelleu,
    deltaLaTorre,
  ], nomesIntegritat);

  assert.equal(fusioOrdreAB.valid, true);
  assert.equal(fusioOrdreBA.valid, true);
  assert.equal(fusioOrdreAB.sha256Arrel, fusioOrdreBA.sha256Arrel);
  assert.deepEqual(fusioOrdreAB.operacions, fusioOrdreBA.operacions);
  assert.deepEqual(fusioOrdreAB.entitatsVigents, fusioOrdreBA.entitatsVigents);

  const estatCami = fusioOrdreBA.entitatsVigents.find((e) => e.entitatId === 'cami:cv-780');
  assert.equal(estatCami.id, 'op-cv780-obert');
  assert.equal(estatCami.payload.estat, 'obert_un_carril_netejat_per_pala');
});

/* Gauntlet O7-O9 (kit Gemini): O89-RURAL-02, -03 i -04. */
const opCami = (estat, creatEl, id = `op-${estat}`) => ({
  id, tipus: 'estat_cami', prioritat: 'critica', entitatId: 'cami:cv-780', creatEl, payload: { estat },
});

test('O89-RURAL-02 · falla en tancat: un delta reescrit amb hashes recalculats i sense `proof` es rebutja', async () => {
  const claus = await generaParellClausFediversityEd25519({
    controller: 'https://latorre.socdepoble.org/actors/emergencia',
    idClau: 'https://latorre.socdepoble.org/actors/emergencia#ed25519-dtn',
  });
  const legitim = await exportaDeltaEmergenciaRural({
    generatEl: '2026-11-03T05:00:00Z', operacions: [opCami('tallat_per_esllavissada', '2026-11-03T04:00:00Z')],
    privateKeyJwk: claus.privateKeyJwk, verificationMethod: claus.idClau,
  });
  // Qualsevol amb el llapis USB pot reescriure les operacions i recalcular els SHA-256 sense clau.
  const fals = await exportaDeltaEmergenciaRural({
    generatEl: '2026-11-03T05:00:00Z', operacions: [opCami('obert', '2026-11-03T04:30:00Z')],
  });
  const local = [legitim.operacions[0]];
  for (const opcions of [{}, { publicKeyJwk: claus.publicKeyJwk }, { publicKeyJwk: claus.publicKeyJwk, exigeixSignatura: false }]) {
    const r = await importaDeltaEmergenciaRural(fals, { operacionsLocals: local, ara: ARA, ...opcions });
    assert.equal(r.valid, false, JSON.stringify(opcions));
    assert.equal(r.entitatsVigents[0].payload.estat, 'tallat_per_esllavissada');
  }
  const { proof, ...senseProof } = legitim;
  assert.ok(proof);
  assert.equal((await verificaDeltaEmergenciaRural(senseProof, { publicKeyJwk: claus.publicKeyJwk, ara: ARA })).valid, false);
  assert.equal((await verificaDeltaEmergenciaRural(legitim, { publicKeyJwk: claus.publicKeyJwk, ara: ARA })).valid, true);
  // El mode només-integritat existix, però s'ha de demanar explícitament i sense clau.
  assert.equal((await importaDeltaEmergenciaRural(fals, { exigeixSignatura: false, ara: ARA })).valid, true);
});

test('O89-RURAL-03 · LWW sobre un instant UTC validat: cap cadena, zona o data futura fixa l’estat per sempre', async () => {
  for (const creatEl of ['zzz', '9999-99-99', '2026-11-03T05:00:00+02:00', '2026-02-30T00:00:00Z', '2026-11-03T24:00:00Z']) {
    assert.throws(() => normalitzaOperacioEmergencia(opCami('x', creatEl)), TypeError, creatEl);
  }
  // Comparació numèrica: «…04:00:00.500Z» és posterior a «…04:00:00Z», encara que el text diga el contrari.
  const consolidat = consolidaOperacionsEmergencia([
    opCami('obert', '2026-11-03T04:00:00.500Z'), opCami('tallat', '2026-11-03T04:00:00Z'),
  ]);
  assert.equal(consolidat.entitatsVigents[0].payload.estat, 'obert');
  // Una data futura respecte del rellotge del receptor (+15 min de marge) es rebutja.
  const futur = await exportaDeltaEmergenciaRural({ operacions: [opCami('fals', '9999-12-31T23:59:59Z')] });
  const r = await importaDeltaEmergenciaRural(futur, { exigeixSignatura: false, ara: ARA });
  assert.equal(r.valid, false); assert.ok(r.motius.some((m) => m.includes('futur')));
  const dinsMarge = await exportaDeltaEmergenciaRural({ operacions: [opCami('obert', '2026-11-03T06:40:00Z')] });
  assert.equal((await importaDeltaEmergenciaRural(dinsMarge, { exigeixSignatura: false, ara: ARA })).valid, true);
});

test('O89-RURAL-04 · límits abans de cap treball: profunditat, mida i operacions donen un rebuig estructurat', async () => {
  let profund = { fulla: true };
  for (let i = 0; i < 5000; i += 1) profund = { n: profund };
  const base = { schema: ESQUEMA_DELTA_EMERGENCIA, municipi: 'La Torre de les Maçanes', nodeOrigenId: 'node:x', transport: 'usb-sneakernet', generatEl: '2026-11-03T05:00:00Z' };
  const casos = [
    { ...base, totalOperacions: 1, sha256Arrel: '0', operacions: [{ ...opCami('x', '2026-11-03T04:00:00Z'), payload: profund }] },
    { ...base, totalOperacions: 1, sha256Arrel: '0', operacions: [{ ...opCami('x', '2026-11-03T04:00:00Z'), payload: { text: 'x'.repeat(5 * 1024 * 1024) } }] },
    { ...base, totalOperacions: 1001, sha256Arrel: '0', operacions: Array.from({ length: 1001 }, (_, i) => opCami('x', '2026-11-03T04:00:00Z', `op-${i}`)) },
  ];
  for (const delta of casos) {
    const r = await verificaDeltaEmergenciaRural(delta, { exigeixSignatura: false, ara: ARA });
    assert.equal(r.valid, false);
    assert.ok(r.motius[0].includes('límits'));
  }
});

test('O89-RURAL-04 · un delta hostil dona valid:false i no avorta la fusió dels altres', async () => {
  const esquemaHostil = JSON.parse('{"schema":{"toString":1},"operacions":[]}');
  const r = await verificaDeltaEmergenciaRural(esquemaHostil, { exigeixSignatura: false, ara: ARA });
  assert.equal(r.valid, false);
  assert.ok(r.motius.includes('Esquema de delta desconegut: object.'));
  const infinit = JSON.parse(`{"schema":"${ESQUEMA_DELTA_EMERGENCIA}","operacions":[],"totalOperacions":1e400,"sha256Delta":{"x":1}}`);
  const rInfinit = await verificaDeltaEmergenciaRural(infinit, { exigeixSignatura: false, ara: ARA });
  assert.equal(rInfinit.valid, false);
  assert.equal(rInfinit.sha256Delta, null);
  assert.equal(Object.isFrozen(infinit.sha256Delta), false);
  // Qualsevol excepció del cos de la verificació acaba en un rebuig estructurat.
  const getter = { schema: ESQUEMA_DELTA_EMERGENCIA, operacions: [], get totalOperacions() { throw new Error('getter hostil'); } };
  const rGetter = await verificaDeltaEmergenciaRural(getter, { exigeixSignatura: false, ara: ARA });
  assert.equal(rGetter.valid, false);
  assert.equal(rGetter.sha256Delta, null);
  const bo = await exportaDeltaEmergenciaRural({
    municipi: 'La Torre de les Maçanes',
    nodeOrigenId: 'node:x',
    operacions: [opCami('x', '2026-11-03T04:00:00Z')],
    generatEl: '2026-11-03T05:00:00Z',
  });
  const fusio = await fusionaDeltesEmergenciaRural([esquemaHostil, getter, bo], { exigeixSignatura: false, ara: ARA });
  assert.deepEqual(fusio.deltesRebutjats.map((d) => d.index), [0, 1]);
  assert.equal(fusio.operacions.length, 1);
});
