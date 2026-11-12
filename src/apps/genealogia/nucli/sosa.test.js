// @vitest-environment node
/* Arbre Genealògic · Sosa-Stradonitz (Ahnentafel): pare 2n, mare 2n+1,
   generació floor(log2 n) + 1, sexe desconegut, implex, cicles i FAN. */
import { describe, expect, test } from 'vitest';
import { complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { colateralsFan, generacioDeSosa, numeraSosa } from './sosa.js';

describe('generacioDeSosa', () => {
  test('floor(log2 n) + 1', () => {
    expect([1, 2, 3, 4, 7, 8, 15, 16, 1023, 1024].map(generacioDeSosa)).toEqual([1, 2, 2, 3, 3, 4, 4, 5, 10, 11]);
    expect(() => generacioDeSosa(0)).toThrow(RangeError);
    expect(() => generacioDeSosa(1.5)).toThrow(RangeError);
  });
});

describe('numeraSosa', () => {
  const tresGeneracions = () => complet(
    [persona(1), persona(2, { sexe: 'M' }), persona(3, { sexe: 'F' }), persona(4, { sexe: 'M' }), persona(5, { sexe: 'F' }), persona(7, { sexe: 'F' })],
    [rel(10, 'progenitor', 3, 1), rel(11, 'progenitor', 2, 1), rel(12, 'progenitor', 4, 2), rel(13, 'progenitor', 5, 2), rel(14, 'progenitor', 7, 3)]
  );

  test('arrel 1, pare 2n, mare 2n+1, i les posicions buides', () => {
    const { perPersona, files, ambigus } = numeraSosa(tresGeneracions(), uid(1));
    expect(perPersona.get(uid(1))).toEqual([1]);
    expect(perPersona.get(uid(2))).toEqual([2]);
    expect(perPersona.get(uid(3))).toEqual([3]);
    expect(perPersona.get(uid(4))).toEqual([4]);
    expect(perPersona.get(uid(5))).toEqual([5]);
    expect(perPersona.get(uid(7))).toEqual([7]);
    expect(files).toHaveLength(7);
    expect(files[5]).toEqual({ sosa: 6, generacio: 3, personaId: null, ambigu: false });
    expect(files.map((f) => f.generacio)).toEqual([1, 2, 2, 3, 3, 3, 3]);
    expect(ambigus).toEqual([]);
  });

  test('sexe desconegut: pren el lloc complementari, o queda ambigu', () => {
    const complementari = complet([persona(1), persona(2, { sexe: 'U' }), persona(3, { sexe: 'M' })], [rel(10, 'progenitor', 2, 1), rel(11, 'progenitor', 3, 1)]);
    const r = numeraSosa(complementari, uid(1));
    expect(r.perPersona.get(uid(3))).toEqual([2]);
    expect(r.perPersona.get(uid(2))).toEqual([3]);
    expect(r.ambigus).toEqual([]);
    const ambigu = complet([persona(1), persona(2), persona(3)], [rel(10, 'progenitor', 3, 1), rel(11, 'progenitor', 2, 1)]);
    const s = numeraSosa(ambigu, uid(1));
    expect(s.perPersona.get(uid(2))).toEqual([2]);
    expect(s.perPersona.get(uid(3))).toEqual([3]);
    expect(s.ambigus).toEqual([2, 3]);
    expect(s.files.filter((f) => f.ambigu).map((f) => f.sosa)).toEqual([2, 3]);
  });

  test('implex: una persona amb dos números', () => {
    const c = complet(
      [persona(1), persona(2, { sexe: 'M' }), persona(3, { sexe: 'F' }), persona(4, { sexe: 'M' })],
      [rel(10, 'progenitor', 2, 1), rel(11, 'progenitor', 3, 1), rel(12, 'progenitor', 4, 2), rel(13, 'progenitor', 4, 3)]
    );
    expect(numeraSosa(c, uid(1)).perPersona.get(uid(4))).toEqual([4, 6]);
  });

  test('un cicle es talla i el límit de generacions es respecta', () => {
    const cicle = complet([persona(1), persona(2, { sexe: 'M' })], [rel(10, 'progenitor', 2, 1), rel(11, 'progenitor', 1, 2)]);
    const r = numeraSosa(cicle, uid(1));
    expect(r.perPersona.get(uid(1))).toEqual([1, 4]);
    expect(r.files).toHaveLength(7);
    const linia = complet(Array.from({ length: 15 }, (_, i) => persona(i + 1, { sexe: 'M' })), Array.from({ length: 14 }, (_, i) => rel(100 + i, 'progenitor', i + 2, i + 1)));
    expect(numeraSosa(linia, uid(1)).files).toHaveLength(1023);
    expect(numeraSosa(linia, uid(1), { maxGeneracions: 3 }).files).toHaveLength(7);
    expect(numeraSosa(linia, uid(99))).toEqual({ perPersona: new Map(), files: [], ambigus: [] });
  });
});

describe('colateralsFan', () => {
  test('germans per progenitor compartit o relació germa, padrins, testimonis, veïns i parelles', () => {
    const c = complet(
      [persona(1), persona(2), persona(3), persona(4), persona(5), persona(6), persona(7), persona(8), persona(9)],
      [
        rel(10, 'progenitor', 2, 1), rel(11, 'progenitor', 2, 3), rel(12, 'germa', 4, 1), rel(13, 'padri', 5, 1),
        rel(14, 'testimoni', 6, 1), rel(15, 'vei', 7, 1), rel(16, 'parella', 1, 8), rel(17, 'padri', 1, 9)
      ]
    );
    expect(colateralsFan(c, uid(1))).toEqual({ germans: [uid(3), uid(4)], padrins: [uid(5)], testimonis: [uid(6)], veins: [uid(7)], parelles: [uid(8)] });
  });
});
