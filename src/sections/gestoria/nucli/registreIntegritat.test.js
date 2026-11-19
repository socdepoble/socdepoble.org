// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { jsonCanonic } from '../../tractors/nucli/canonic.js';
import { afegixRegistreIntegritat, copiaJsonIntegritat, LIMITS_INTEGRITAT, SCHEMA_INTEGRITAT, verificaRegistreIntegritat } from './registreIntegritat.js';

const subtle = webcrypto.subtle;
const copia = (v) => JSON.parse(JSON.stringify(v));
const event = (i = 1, extra = {}) => ({ id: `document-${i}`, tipus: ['esborrany', 'tiquet', 'assentament'][(i - 1) % 3],
  data: '2026-07-01', instant: `2026-07-01T10:00:0${i}.000Z`, dades: { concepte: 'Taller rural', centims: 12100, client: { nom: 'Exemple' } }, ...extra });
async function llibre(n = 3) {
  let r = [];
  for (let i = 1; i <= n; i++) r = await afegixRegistreIntegritat(r, event(i), { hashEsperat: r.at(-1)?.hash_actual ?? null, subtle });
  return r;
}
const codis = (r) => r.incidencies.map((i) => i.codi);

describe('registre complet de només afegir', () => {
  test('esborrany, tiquet i assentament: SHA independent de tots els camps JSON ordenats', async () => {
    const r = await llibre();
    expect(r.map((v) => v.tipus)).toEqual(['esborrany', 'tiquet', 'assentament']);
    for (let i = 0; i < r.length; i++) {
      const cos = copia(r[i]); delete cos.hash_actual;
      expect(r[i]).toMatchObject({ schema: SCHEMA_INTEGRITAT, ordre: i + 1, hash_anterior: i === 0 ? null : r[i - 1].hash_actual });
      expect(r[i].hash_actual).toBe(createHash('sha256').update(jsonCanonic(cos)).digest('hex'));
    }
    expect((await verificaRegistreIntegritat(r, { subtle })).valida).toBe(true);
    expect(Object.isFrozen(r[0].dades.client)).toBe(true);
  });

  test('claus en un altre ordre donen els mateixos bytes; mai es modifica el llibre ni la dada rebuda', async () => {
    const a = event();
    const b = { dades: { client: { nom: 'Exemple' }, centims: 12100, concepte: 'Taller rural' }, instant: a.instant, data: a.data, tipus: a.tipus, id: a.id };
    const primera = await afegixRegistreIntegritat([], a, { hashEsperat: null, subtle });
    const altra = await afegixRegistreIntegritat([], b, { hashEsperat: null, subtle });
    expect(primera).toEqual(altra);
    a.dades.client.nom = 'Canvi després';
    expect(primera[0].dades.client.nom).toBe('Exemple');
    const segona = await afegixRegistreIntegritat(primera, event(2), { hashEsperat: primera[0].hash_actual, subtle });
    expect(primera).toHaveLength(1); expect(segona).toHaveLength(2);
  });

  test('instantània abans de WebCrypto: mutar durant digest no canvia el registre', async () => {
    const e = event();
    const digest = async (...args) => { e.dades.concepte = 'Mutat durant await'; return subtle.digest(...args); };
    const r = await afegixRegistreIntegritat([], e, { hashEsperat: null, subtle: { digest } });
    expect(r[0].dades.concepte).toBe('Taller rural');
    expect((await verificaRegistreIntegritat(r, { subtle })).valida).toBe(true);
  });

  test('CAS obligatori i expectativa obsoleta refusen un afegit', async () => {
    const r = await llibre(1);
    await expect(afegixRegistreIntegritat(r, event(2), { subtle })).rejects.toMatchObject({ codi: 'CAS_OBLIGATORI' });
    await expect(afegixRegistreIntegritat(r, event(2), { hashEsperat: null, subtle })).rejects.toMatchObject({ codi: 'CADENA_CANVIADA' });
    expect((await verificaRegistreIntegritat(r, { subtle })).valida).toBe(true);
  });
});

describe('falsificacions i àncora de confiança', () => {
  test('detecta mutacio de qualsevol camp del JSON complet, inclosos textos i metadades', async () => {
    const r = await llibre();
    for (const muta of [
      (v) => { v.dades.client.nom = 'Un altre nom'; }, (v) => { v.dades.concepte = 'Un altre concepte'; },
      (v) => { v.dades.centims++; }, (v) => { v.dades.nou = true; }, (v) => { delete v.dades.client; },
      (v) => { v.id = 'canviat'; }, (v) => { v.data = '2026-07-02'; }
    ]) {
      const dolent = copia(r); muta(dolent[1]);
      expect(codis(await verificaRegistreIntegritat(dolent, { subtle }))).toContain('HASH_ALTERAT');
      await expect(afegixRegistreIntegritat(dolent, event(4), { hashEsperat: dolent.at(-1).hash_actual, subtle })).rejects.toMatchObject({ codi: 'CADENA_INVALIDA' });
    }
    expect((await verificaRegistreIntegritat(r, { subtle })).valida).toBe(true);
  });

  test('supressió, reordre, duplicació i hash refet a mitja cadena no passen', async () => {
    const r = await llibre();
    for (const dolent of [[r[0], r[2]], [r[1], r[0], r[2]], [...r, r[2]]]) expect((await verificaRegistreIntegritat(dolent, { subtle })).valida).toBe(false);
    const nou = await afegixRegistreIntegritat([r[0]], event(2, { dades: { concepte: 'Refet' } }), { hashEsperat: r[0].hash_actual, subtle });
    expect(codis(await verificaRegistreIntegritat([...nou, r[2]], { subtle }))).toContain('ENLLAC_TRENCAT');
  });

  test('truncament i reescriptura TOTAL sols es descobrixen amb una àncora externa', async () => {
    const r = await llibre();
    const ancora = { ordre: 3, hash_actual: r[2].hash_actual };
    expect((await verificaRegistreIntegritat(r.slice(0, 2), { subtle })).valida).toBe(true);
    expect(codis(await verificaRegistreIntegritat(r.slice(0, 2), { ancora, subtle }))).toContain('ANCORA_ABSENT');
    let refet = [];
    for (let i = 1; i <= 3; i++) refet = await afegixRegistreIntegritat(refet, event(i, { dades: { concepte: 'Reescriptura coherent' } }), { hashEsperat: refet.at(-1)?.hash_actual ?? null, subtle });
    expect((await verificaRegistreIntegritat(refet, { subtle })).valida).toBe(true);
    expect((await verificaRegistreIntegritat(refet, { ancora, subtle })).valida).toBe(false);
    await expect(verificaRegistreIntegritat(r, { ancora: {}, subtle })).rejects.toMatchObject({ codi: 'ANCORA_INVALIDA' });
  });
});

test('temps i dates estrictes: cap hora inventada, dates impossibles o retrocés del rellotge', async () => {
  const r = await llibre(1);
  const senseHora = await afegixRegistreIntegritat(r, event(2, { instant: null }), { hashEsperat: r[0].hash_actual, subtle });
  expect(senseHora[1].instant).toBeNull();
  await expect(afegixRegistreIntegritat(senseHora, event(3, { instant: '2026-07-01T09:00:00.000Z' }), { hashEsperat: senseHora[1].hash_actual, subtle })).rejects.toMatchObject({ codi: 'TEMPS_ENRERE' });
  for (const extra of [{ data: '2026-02-30' }, { data: '01/07/2026' }, { instant: '2026-07-01T10:00:01Z' }, { tipus: 'factura-homologada' }, { id: '' }]) {
    await expect(afegixRegistreIntegritat([], event(1, extra), { hashEsperat: null, subtle })).rejects.toMatchObject({ codi: 'ENTRADA_INVALIDA' });
  }
});

test('JSON hostil no perd silenciosament dades ni executa getters', async () => {
  const getter = Object.defineProperty({}, 'secret', { enumerable: true, get() { throw new Error('No s’ha d’executar'); } });
  const cicle = {}; cicle.cicle = cicle;
  const simbol = { [Symbol('ocult')]: 'valor' };
  const dispers = [1, 2, 3]; delete dispers[1];
  for (const dades of [getter, cicle, simbol, { valor: undefined }, { valor: NaN }, new Date(), dispers]) {
    expect(() => copiaJsonIntegritat(dades)).toThrow();
    await expect(afegixRegistreIntegritat([], event(1, { dades }), { hashEsperat: null, subtle })).rejects.toThrow();
  }
});

test('pressupostos previs: ni un JSON molt profund ni llistes gegants esgoten la pila o entren al hash', async () => {
  let profund = null;
  for (let i = 0; i < 10_000; i++) profund = { fill: profund };
  expect(() => copiaJsonIntegritat(profund)).toThrow(expect.objectContaining({ codi: 'LIMIT_PROFUNDITAT' }));
  expect(() => copiaJsonIntegritat(new Array(LIMITS_INTEGRITAT.nodes + 1).fill(null))).toThrow(expect.objectContaining({ codi: 'LIMIT_NODES' }));
  expect(() => copiaJsonIntegritat('x'.repeat(LIMITS_INTEGRITAT.cadena + 1))).toThrow(expect.objectContaining({ codi: 'LIMIT_CADENA' }));
  const gran = new Array(18).fill('x'.repeat(1000 * 1000));
  expect(() => copiaJsonIntegritat(gran)).toThrow(expect.objectContaining({ codi: 'LIMIT_BYTES' }));
  const massiu = new Array(LIMITS_INTEGRITAT.registres + 1).fill(null);
  expect(codis(await verificaRegistreIntegritat(massiu, { subtle }))).toEqual(['LIMIT_REGISTRES']);
  await expect(afegixRegistreIntegritat(massiu, event(), { hashEsperat: null, subtle })).rejects.toMatchObject({ codi: 'LIMIT_REGISTRES' });
  const compartit = { valor: 1 };
  expect(copiaJsonIntegritat({ a: compartit, b: compartit })).toEqual({ a: { valor: 1 }, b: { valor: 1 } });
});
