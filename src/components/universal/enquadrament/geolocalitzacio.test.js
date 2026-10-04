import { describe, expect, test } from 'vitest';
import {
  ERROR_LATITUD, ERROR_LONGITUD, PRECISIONS, PRECISIO_PER_DEFECTE, arrodonix, errorCoordenada, geolocalitzacio,
  llegixCoordenada, textUbicacio,
} from './geolocalitzacio.js';

/* Onada 4, T3a · Geolocalització voluntària (ADR multimèdia D5, D6 i §3.3). */

describe('T3a · precisions', () => {
  test('exacta, uns 100 m i només el poble; la de sèrie és la més vaga', () => {
    expect(PRECISIONS.map((p) => [p.valor, p.precisio_m, p.decimals])).toEqual([
      ['exacta', 1, 5], ['100m', 100, 3], ['poble', 1000, 2],
    ]);
    expect(PRECISIO_PER_DEFECTE).toBe('poble');
  });

  test('geolocalitzacio arrodonix a la precisió triada i anota precisio_m i origen', () => {
    const punt = { lat: 38.591937, lng: -0.418426 };
    expect(geolocalitzacio({ ...punt, precisio: 'exacta', origen: 'exif' })).toEqual({ lat: 38.59194, lng: -0.41843, precisio_m: 1, origen: 'exif' });
    expect(geolocalitzacio({ ...punt, precisio: '100m', origen: 'exif' })).toEqual({ lat: 38.592, lng: -0.418, precisio_m: 100, origen: 'exif' });
    expect(geolocalitzacio({ ...punt, precisio: 'poble' })).toEqual({ lat: 38.59, lng: -0.42, precisio_m: 1000, origen: 'manual' });
    // Sense precisió, la de sèrie; una de desconeguda, també.
    expect(geolocalitzacio(punt).precisio_m).toBe(1000);
    expect(geolocalitzacio({ ...punt, precisio: 'mil·límetre' }).precisio_m).toBe(1000);
  });

  test('un origen que no és «exif» és «manual»', () => {
    expect(geolocalitzacio({ lat: 38.5, lng: -0.4, origen: 'gps' }).origen).toBe('manual');
  });

  test('coordenades impossibles o buides: null', () => {
    expect(geolocalitzacio({ lat: null, lng: -0.4 })).toBeNull();
    expect(geolocalitzacio({ lat: 91, lng: -0.4 })).toBeNull();
    expect(geolocalitzacio({ lat: 38, lng: 181 })).toBeNull();
    expect(geolocalitzacio({ lat: 0.001, lng: 0.002, precisio: 'poble' })).toBeNull(); // arrodonit, el 0/0
  });

  test('arrodonix', () => {
    expect(arrodonix(38.59194, 2)).toBe(38.59);
    expect(arrodonix(-0.4155, 3)).toBe(-0.415);
  });
});

describe('T3a · camps de text', () => {
  test('llegixCoordenada accepta punt i coma decimals i el signe', () => {
    expect(llegixCoordenada('38.5919')).toBe(38.5919);
    expect(llegixCoordenada(' 38,5919 ')).toBe(38.5919);
    expect(llegixCoordenada('-0.4184')).toBe(-0.4184);
    expect(llegixCoordenada('+12')).toBe(12);
    expect(llegixCoordenada('')).toBeNull();
    expect(llegixCoordenada('38°35′')).toBeNull();
    expect(llegixCoordenada('1e3')).toBeNull();
    expect(llegixCoordenada(null)).toBeNull();
  });

  test('errorCoordenada: buit no és error; fora de rang o il·legible, sí', () => {
    expect(errorCoordenada('', 'lat')).toBeNull();
    expect(errorCoordenada('38.59', 'lat')).toBeNull();
    expect(errorCoordenada('95', 'lat')).toBe(ERROR_LATITUD);
    expect(errorCoordenada('abc', 'lng')).toBe(ERROR_LONGITUD);
    expect(errorCoordenada('-179.9', 'lng')).toBeNull();
  });

  test('textUbicacio ensenya el que es desarà, amb els decimals de la precisió', () => {
    const geo = geolocalitzacio({ lat: 38.591937, lng: -0.418426, precisio: 'poble' });
    expect(textUbicacio(geo, 'poble')).toBe('38.59, -0.42 (uns 1.000 m)');
    expect(textUbicacio(geolocalitzacio({ lat: 38.591937, lng: -0.418426, precisio: '100m' }), '100m')).toBe('38.592, -0.418 (uns 100 m)');
    expect(textUbicacio(geolocalitzacio({ lat: 38.591937, lng: -0.418426, precisio: 'exacta' }), 'exacta')).toBe('38.59194, -0.41843 (exacta)');
    expect(textUbicacio(null)).toBe('');
  });
});
