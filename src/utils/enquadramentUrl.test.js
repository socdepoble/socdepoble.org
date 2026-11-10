import { describe, expect, test } from 'vitest';
import {
  ambEnquadrament, conservaEnquadrament, enquadramentNet, llevaEnquadrament, mateixEnquadrament, separaEnquadrament,
} from './enquadramentUrl.js';

/* P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
   El marc viu al fragment #sdp-crop= de l'adreça de la foto sencera. Estes
   proves fixen el que es desa, el que es llig i el que no es toca. */

const REF = 'sdp-media://mitjans/poble/uid/avatars/foto.webp';
const MARC = { format: '16:9', zoom: 1.5, cx: 0.4, cy: 0.6 };

describe('el fragment que es desa', () => {
  test('la forma canònica: format, zoom, cx i cy, en eixe ordre', () => {
    expect(ambEnquadrament(REF, MARC)).toBe(`${REF}#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6`);
  });

  test('anada i tornada: el que es desa es llig igual, i la base és la referència', () => {
    expect(separaEnquadrament(ambEnquadrament(REF, MARC))).toEqual({ base: REF, enquadrament: MARC });
  });

  test('un marc nou substituïx el d’abans (mai dos fragments)', () => {
    const desada = ambEnquadrament(REF, MARC);
    const nova = ambEnquadrament(desada, { format: '1:1', zoom: 2, cx: 0.5, cy: 0.5 });
    expect(nova.split('#')).toHaveLength(2);
    expect(separaEnquadrament(nova).enquadrament).toEqual({ format: '1:1', zoom: 2, cx: 0.5, cy: 0.5 });
  });

  test('la foto sencera (l’original sense ampliar) o cap marc: l’adreça sense fragment', () => {
    expect(ambEnquadrament(`${REF}#sdp-crop=format=1%3A1&zoom=1&cx=0.5&cy=0.5`, { format: 'original', zoom: 1, cx: 0.5, cy: 0.5 })).toBe(REF);
    expect(ambEnquadrament(REF, null)).toBe(REF);
  });

  test('els valors es fiten (zoom 1..4, centre 0..1) i porten quatre decimals; un número que no ho és, no hi ha marc', () => {
    expect(enquadramentNet({ format: '4:3', zoom: 9, cx: -1, cy: 0.123456 })).toEqual({ format: '4:3', zoom: 4, cx: 0, cy: 0.1235 });
    expect(enquadramentNet({ format: '4:3', zoom: 'x', cx: 0.5, cy: 0.5 })).toBeNull();
    expect(enquadramentNet({ format: 'quadrat', zoom: 1, cx: 0.5, cy: 0.5 })).toBeNull();
    expect(enquadramentNet({ format: '16:9', zoom: '', cx: 0.5, cy: 0.5 })).toBeNull();
  });

  test('un data URL (el mode sense servidor) també porta el marc', () => {
    const dades = 'data:image/webp;base64,AAAA';
    expect(separaEnquadrament(ambEnquadrament(dades, MARC))).toEqual({ base: dades, enquadrament: MARC });
  });
});

describe('el fragment que es llig', () => {
  test('sense fragment, la mateixa adreça i cap marc (una imatge d’abans continua igual)', () => {
    expect(separaEnquadrament(REF)).toEqual({ base: REF, enquadrament: null });
    expect(llevaEnquadrament(REF)).toBe(REF);
  });

  test('un fragment que no és el nostre no es toca', () => {
    const altre = `${REF}#crop?v=7`;
    expect(separaEnquadrament(altre)).toEqual({ base: altre, enquadrament: null });
    expect(llevaEnquadrament(altre)).toBe(altre);
  });

  test('un fragment nostre que no es pot llegir es lleva i no porta cap marc', () => {
    expect(separaEnquadrament(`${REF}#sdp-crop=format=x&zoom=1`)).toEqual({ base: REF, enquadrament: null });
  });

  test('un valor que no és text torna tal qual', () => {
    expect(separaEnquadrament(null)).toEqual({ base: null, enquadrament: null });
    expect(llevaEnquadrament(undefined)).toBeUndefined();
  });
});

describe('la mateixa foto en una altra adreça (el port)', () => {
  test('la URL resolta torna amb el marc de la referència', () => {
    const resolta = 'https://abc.supabase.co/storage/v1/object/public/mitjans/poble/uid/avatars/foto.webp';
    expect(conservaEnquadrament(resolta, ambEnquadrament(REF, MARC))).toBe(ambEnquadrament(resolta, MARC));
    expect(conservaEnquadrament(resolta, REF)).toBe(resolta);
    expect(conservaEnquadrament('', ambEnquadrament(REF, MARC))).toBe('');
  });

  test('mateixEnquadrament compara marcs nets; null i la foto sencera són el mateix', () => {
    expect(mateixEnquadrament(MARC, { ...MARC, cx: 0.40001 })).toBe(true);
    expect(mateixEnquadrament(MARC, { ...MARC, zoom: 1.6 })).toBe(false);
    expect(mateixEnquadrament(null, { format: 'original', zoom: 1, cx: 0.2, cy: 0.9 })).toBe(true);
    expect(mateixEnquadrament(null, MARC)).toBe(false);
  });
});
