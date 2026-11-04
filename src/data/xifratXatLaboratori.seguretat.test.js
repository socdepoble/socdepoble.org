// @vitest-environment node
import { afterEach, expect, test } from 'vitest';
import { creaProvaXifratXat } from './xifratXatLaboratori.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../config/xifratXat.js';

let prova;
afterEach(() => { prova?.tanca(); prova = null; });

test('FEDI-07 · tres SAS reals, xifrat i obertura, integritat, replay i rotació monòtona, només en memòria', async () => {
  prova = await creaProvaXifratXat({ cripto: globalThis.crypto });
  expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  const inicial = prova.fotografia();
  expect(inicial.verificats).toBe(0);
  expect(inicial.ranures).toHaveLength(3);
  expect(new Set(inicial.ranures.map((r) => r.id)).size).toBe(3);
  for (const r of inicial.ranures) {
    expect(r.propi).toMatch(/^\d{3} \d{3} \d{3} \d{3}$/);
    expect(r.contacte).toBe(r.propi);
  }
  await expect(prova.provaMissatge('Abans de comparar')).rejects.toMatchObject({ codi: 'sas-pendent' });
  expect(() => prova.confirmaSas(0, 'incorrecte')).toThrow('sas-no-coincidix');
  expect(prova.fotografia().verificats).toBe(0);
  inicial.ranures.forEach((r, i) => prova.confirmaSas(i, r.contacte));
  expect(prova.fotografia().verificats).toBe(3);
  const resultat = await prova.provaMissatge('Missatge efímer de la prova');
  expect(resultat).toMatchObject({ obert: 'Missatge efímer de la prova', manipulacioRebutjada: true, repeticioRebutjada: true });
  expect(resultat.xifrat).toMatch(/^[\w-]+$/);
  expect(resultat.xifrat).not.toContain('Missatge');
  expect(await prova.provaRotacio()).toEqual({ continuitat: true, canvi: 'suau', retornAnticRebutjat: true });
  expect(JSON.stringify(prova)).toBe('{}');
  prova.tanca();
  expect(() => prova.fotografia()).toThrow('prova-tancada');
  await expect(prova.provaMissatge('Després de tancar')).rejects.toMatchObject({ codi: 'prova-tancada' });
}, 30_000);

test('una disputa atura confirmacions i xifrat fins a crear una altra prova', async () => {
  prova = await creaProvaXifratXat({ cripto: globalThis.crypto });
  const r = prova.fotografia().ranures[0];
  prova.declaraDisputa();
  expect(() => prova.confirmaSas(0, r.contacte)).toThrow('prova-en-disputa');
  await expect(prova.provaMissatge('Aturat')).rejects.toMatchObject({ codi: 'prova-en-disputa' });
  await expect(prova.provaRotacio()).rejects.toMatchObject({ codi: 'prova-en-disputa' });
}, 30_000);

test('sense WebCrypto falla tancat i no activa cap bandera', async () => {
  await expect(creaProvaXifratXat({ cripto: null })).rejects.toMatchObject({ codi: 'sense-cripto' });
  expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
});
