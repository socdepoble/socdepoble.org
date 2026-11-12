import { afterEach, expect, test, vi } from 'vitest';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { capturaEdicioRevisioPatrimoni } from '../revisionsPatrimoni.js';
import { creaAdaptadorLocal } from './adaptadorLocal.js';

const POBLE = 'a1111111-1111-4111-8111-111111111111';
const ALTRE_POBLE = 'a2222222-2222-4222-8222-222222222222';
const AUTOR = 'ca111111-1111-4111-8111-111111111111';
const VEINA = 'ca222222-2222-4222-8222-222222222222';
const PECA = { entitatTipus: 'arbre', entitatSlug: 'om-del-rentonar' };
const instancies = [];

function crea(tenantId = POBLE) {
  const a = creaAdaptadorLocal({ mode: 'local', tenantId });
  instancies.push(a);
  return a;
}

function entra(a, id = AUTOR) {
  configuraBackendSessio(a.configuracio);
  expect(desaSessio({ access_token: 'patrimoni-local-prova', user: { id } })).toBe(true);
}

function entrada(canvis = {}) {
  return { ...PECA, campanyaAny: 2026, versio: 0, estatConservacio: 'Bo',
    mesures: { altura_m: 13.25, vist: true, unitat: 'm', desconegut: null },
    observacions: 'Visita de camp.', ...canvis };
}

afterEach(async () => {
  esborraSessio({ abast: 'tot' });
  await Promise.all(instancies.splice(0).map(a => a.destroy()));
});

test('captura valors primitius i rebutja getters, autoritat client i caràcters invàlids', () => {
  const llig = vi.fn();
  const objecte = entrada();
  Object.defineProperty(objecte.mesures, 'altura_m', { get: llig, enumerable: true });
  expect(() => capturaEdicioRevisioPatrimoni(objecte)).toThrow(TypeError);
  expect(llig).not.toHaveBeenCalled();
  for (const canvi of [
    { creatPer: AUTOR }, { tenantId: POBLE }, { id: AUTOR }, { versio: 1 }, { campanyaAny: 0 }, { entitatTipus: 'altre' }, { entitatSlug: 'nom\n' },
    { estatConservacio: '\t \r' }, { observacions: '\ud800' },
    { mesures: { dada: { x: true } } }, { mesures: { dada: [] } }, { mesures: { dada: Infinity } },
    { mesures: { dada: 2 ** 53 } }, { mesures: { constructor: 'x' } }, { mesures: { 'clau\r': true } },
    { mesures: Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`m${i}`, i])) }
  ]) expect(() => capturaEdicioRevisioPatrimoni(entrada(canvi))).toThrow(TypeError);
  expect(capturaEdicioRevisioPatrimoni(entrada({ estatConservacio: ' Bo﻿', mesures: { etiqueta: '🌳'.repeat(160) } })))
    .toMatchObject({ estatConservacio: 'Bo' });
});

test('lectura pública en ordre, paginació i aïllament per instància i poble', async () => {
  const a = crea();
  const b = crea(ALTRE_POBLE);
  await expect(a.desaRevisioPatrimoni(entrada())).rejects.toMatchObject({ code: 'sense-sessio' });
  entra(a);
  await expect(a.desaRevisioPatrimoni(entrada({ campanyaAny: 2025 }))).resolves.toMatchObject({ versio: 1 });
  const resultat = await a.desaRevisioPatrimoni(entrada());
  expect(Object.isFrozen(resultat.mesures)).toBe(true);
  esborraSessio({ abast: 'tot' });
  expect((await a.llistaRevisionsPatrimoni(PECA)).map(r => r.campanyaAny)).toEqual([2026, 2025]);
  expect((await a.llistaRevisionsPatrimoni({ ...PECA, abansAny: 2026, limit: 1 })).map(r => r.campanyaAny)).toEqual([2025]);
  expect(await a.llistaRevisionsPatrimoni({ ...PECA, entitatTipus: 'llavor' })).toEqual([]);
  expect(await b.llistaRevisionsPatrimoni(PECA)).toEqual([]);
  expect(JSON.stringify(resultat)).not.toContain(AUTOR);
});

test('una edició o baixa requereix autor i versió. Captura síncrona d’entrada i sessió', async () => {
  const a = crea();
  entra(a);
  const camps = entrada();
  const desament = a.desaRevisioPatrimoni(camps);
  camps.mesures.altura_m = 21;
  const creada = await desament;
  const { id } = creada;
  expect(creada.mesures.altura_m).toBe(13.25);
  await expect(a.desaRevisioPatrimoni(entrada())).rejects.toMatchObject({ code: 'revisio-no-vigent' });

  const enVol = a.desaRevisioPatrimoni(entrada({ campanyaAny: 2027 }));
  entra(a, VEINA);
  await expect(enVol).rejects.toMatchObject({ name: 'AbortError' });
  await expect(a.desaRevisioPatrimoni(entrada({ id, versio: 1 }))).rejects.toMatchObject({ code: 'revisio-no-vigent' });
  const baixa = { ...PECA, id, campanyaAny: 2026, versio: 1 };
  await expect(a.esborraRevisioPatrimoni(baixa)).rejects.toMatchObject({ code: 'revisio-no-vigent' });
  entra(a);
  const resultats = await Promise.allSettled([
    a.desaRevisioPatrimoni(entrada({ id, versio: 1 })),
    a.desaRevisioPatrimoni(entrada({ id, versio: 1 }))
  ]);
  expect(resultats.map(r => r.status)).toEqual(['fulfilled', 'rejected']);
  expect(resultats[0].value.versio).toBe(2);
  await expect(a.esborraRevisioPatrimoni(baixa)).rejects.toMatchObject({ code: 'revisio-no-vigent' });
  await expect(a.esborraRevisioPatrimoni({ ...baixa, versio: 2 })).resolves.toBe(true);
  expect(await a.llistaRevisionsPatrimoni(PECA)).toEqual([]);
  const recreada = await a.desaRevisioPatrimoni(entrada());
  expect(recreada.id).not.toBe(id);
  await expect(a.desaRevisioPatrimoni(entrada({ id, versio: 1 }))).rejects.toMatchObject({ code: 'revisio-no-vigent' });
  await expect(a.esborraRevisioPatrimoni(baixa)).rejects.toMatchObject({ code: 'revisio-no-vigent' });
});
