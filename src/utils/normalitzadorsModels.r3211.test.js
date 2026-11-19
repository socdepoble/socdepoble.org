// @vitest-environment node
import { performance } from 'node:perf_hooks';
import { describe, expect, test } from 'vitest';
import { normalitzaNom, clauDuplicat } from '../sections/gestoria/nucli/model.js';
import { importaLoyverse, slugDe } from '../apps/bar/nucli/loyverse.js';
import { detectaFormat, llibreDeCsv, normalitzaEtiqueta, proposaApunts } from '../apps/salut/nucli/importacio.js';
import { entradesDelCataleg, filtraEntrades } from '../data/patrimoni/bancLlavors.js';
import { ESPECIES_HERBARI_LA_TORRE_117, filtraEspeciesHerbari } from '../data/patrimoni/herbariLaTorre117.js';
import { normalitza, paraules } from './temporada/paraules.js';

const hostil = bytes => {
  const marques = Math.floor((bytes - 2) / 2), altes = Math.floor(marques / 2);
  return 'a' + '\u0315'.repeat(altes) + '\u0300'.repeat(marques - altes) + 'x' + 'a'.repeat((bytes - 2) % 2);
};
const text64 = hostil(65536);
const csvHostil = () => {
  const prefix = 'Handle,Nombre,Precio,', sufix = '\nuno,Joan,1,\n';
  return prefix + hostil(65536 - Buffer.byteLength(prefix + sufix)) + sufix;
};
const errorPressupost = fn => expect(fn).toThrow(expect.objectContaining({ name: 'RangeError', code: 'UNICODE_MARK_LIMIT' }));

describe('R32.11 Lot08 · normalitzadors de models i importadors', () => {
  test.each([
    ['Gestoria normalitzaNom', () => normalitzaNom(text64)],
    ['Gestoria clauDuplicat', () => clauDuplicat({ num: '1', contrapart: text64 })],
    ['Loyverse slugDe', () => slugDe(text64)],
    ['Loyverse importaLoyverse', () => importaLoyverse(csvHostil())],
    ['Salut normalitzaEtiqueta', () => normalitzaEtiqueta(text64)],
  ])('%s rebutja64KiB amb error explícit, sense clau buida, en menys de25ms', (_nom, fn) => {
    expect(Buffer.byteLength(text64)).toBe(65536);
    expect(Buffer.byteLength(csvHostil())).toBe(65536);
    const inici = performance.now();
    errorPressupost(fn);
    expect(performance.now() - inici).toBeLessThan(25);
  });

  test('Salut conserva el llibre, enum desconegut i proposta sense apunts ni persistència', () => {
    const llibre = llibreDeCsv([[text64]]);
    const abans = JSON.stringify(llibre);
    const inici = performance.now();
    expect(detectaFormat(llibre)).toBe('desconegut');
    const proposta = proposaApunts({ llibre });
    expect(proposta.format).toBe('desconegut');
    expect(proposta.apunts).toEqual([]);
    expect(proposta.avisos.some(a => a.codi === 'format-desconegut')).toBe(true);
    expect(performance.now() - inici).toBeLessThan(25);
    expect(JSON.stringify(llibre)).toBe(abans);
  });

  test('Banc i Herbari rebutgen consulta hostil amb[] i mai mostren tot per convertir-la en buida', () => {
    const entrades = entradesDelCataleg('cataleg-valencia');
    const abans = JSON.stringify(entrades);
    expect(entrades.length).toBeGreaterThan(0);
    const inici = performance.now();
    expect(filtraEntrades(entrades, text64)).toEqual([]);
    expect(filtraEspeciesHerbari({ cerca: text64 })).toEqual([]);
    expect(performance.now() - inici).toBeLessThan(25);
    expect(filtraEntrades(entrades, '')).toBe(entrades);
    expect(filtraEspeciesHerbari({ cerca: '' })).toHaveLength(ESPECIES_HERBARI_LA_TORRE_117.length);
    expect(JSON.stringify(entrades)).toBe(abans);
  });

  test('Herbari NFKD rebutja l’expansió de FF9E que un guard de marques raw no veu', () => {
    const text = '\u0315\uff9e'.repeat(65536 / 5) + 'a'.repeat(65536 % 5);
    //0315 ocupa2 bytes i FF9E3: cada unitat és5 bytes. La tira raw M és1.
    expect(Buffer.byteLength(text)).toBe(65536);
    const inici = performance.now();
    expect(filtraEspeciesHerbari({ cerca: text })).toEqual([]);
    expect(performance.now() - inici).toBeLessThan(25);
  });

  test('Temporada deriva no-coincidència, sense canviar el nom original', () => {
    const original = Object.freeze({ nom: text64 });
    const inici = performance.now();
    expect(normalitza(original.nom)).toBe('');
    expect(paraules(original.nom)).toEqual([]);
    expect(performance.now() - inici).toBeLessThan(25);
    expect(original.nom).toBe(text64);
  });

  test('semàntica regular, valencià, sufixos i tipus primitius legítims', () => {
    expect(normalitzaNom('  Cooperativa de València, S.L.  ')).toBe('cooperativa de valencia');
    expect(normalitzaNom('S.L.')).toBe('sl');
    expect(normalitzaNom(0)).toBe('0');
    expect(normalitzaNom(false)).toBe('false');
    expect(normalitzaNom(null)).toBe('');
    expect(slugDe('Fruïta de València')).toBe('fruita-de-valencia');
    expect(slugDe(0)).toBe('0');
    expect(slugDe(false)).toBe('false');
    expect(normalitzaEtiqueta(0)).toBe('0');
    expect(normalitzaEtiqueta(false)).toBe('false');
    expect(normalitzaEtiqueta('LÍQUID INGERIT?')).toBe('liquid ingerit');
    expect(normalitza('Meló d’Alger')).toBe('melon d alger');
    expect(normalitza('Brussel·les')).toBe('brusselles');
    expect(normalitza(0)).toBe('');
    expect(normalitza(false)).toBe('');
    expect(normalitza('123')).toBe('123');
    const entrades = [{ id: 'zero', nom: '0' }, { id: 'false', nom: 'false' }];
    expect(filtraEntrades(entrades, 0).map(e => e.id)).toEqual(['zero']);
    expect(filtraEntrades(entrades, false).map(e => e.id)).toEqual(['false']);
    expect(filtraEspeciesHerbari({ cerca: 0 })).toHaveLength(ESPECIES_HERBARI_LA_TORRE_117.length);
    expect(filtraEspeciesHerbari({ cerca: false })).toHaveLength(ESPECIES_HERBARI_LA_TORRE_117.length);
  });

  test('CSV vàlid de Loyverse preserva els noms humans i el text original', () => {
    const csv = 'Handle,Nombre,Precio\nfruita,Fruïta de València,1\n';
    const r = importaLoyverse(csv);
    expect(r.carta.productes[0].nom).toBe('Fruïta de València');
    expect(csv).toContain('Fruïta de València');
  });

  test('les captures de rebuig són específiques: altres errors es propaguen', () => {
    const sentencia = Object.assign(new Error('Error alié'), { code: 'ALTRE_ERROR' });
    const entrada = { toString() { throw sentencia; } };
    expect(() => normalitzaNom(entrada)).toThrow(sentencia);
    expect(() => filtraEntrades([], entrada)).toThrow(sentencia);
    expect(() => filtraEspeciesHerbari({ cerca: entrada })).toThrow(sentencia);
    expect(() => detectaFormat({ fulles: [{ get celles() { throw sentencia; } }] })).toThrow(sentencia);
  });
});
