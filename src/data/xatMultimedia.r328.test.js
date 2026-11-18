import { expect, test } from 'vitest';
import * as multimedia from './xatMultimedia.js';

const video = bytes => new Blob([new Uint8Array(bytes)], { type: 'video/mp4' });

test('R32.8 separa la quota total, l’entrada original i el vídeo preparat', () => {
  expect(multimedia.QUOTA_XAT_BYTES).toBe(250_000_000);
  expect(multimedia.MAX_VIDEO_ENTRADA_BYTES).toBe(150_000_000);
  expect(multimedia.MAX_VIDEO_MS).toBe(60_000);
  expect(multimedia.MAXIM_ADJUNT_XAT).toEqual({ imatge: 2_000_000, veu: 3_000_000, video: 20_000_000 });
  expect(multimedia.MAXIM_BLOB_ADJUNT).toBe(20_000_000);
  expect(multimedia.MISSATGE_QUOTA_XAT).not.toMatch(/diners|pagar|servidor/i);
});

test('R32.8 admet 60 segons i 20 MB exactes; un sol byte o mil·lisegon de més és rebutjat', () => {
  expect(() => multimedia.validaAdjuntXat({ fitxer: video(20_000_000), tipus: 'video', duradaMs: 60_000 })).not.toThrow();
  expect(() => multimedia.validaAdjuntXat({ fitxer: video(20_000_001), tipus: 'video', duradaMs: 60_000 })).toThrow(expect.objectContaining({ code: 'video-mida' }));
  for (const duradaMs of [0, -1, 60_001, 60_000.1, NaN, Infinity, '60000']) {
    expect(() => multimedia.validaAdjuntXat({ fitxer: video(64), tipus: 'video', duradaMs })).toThrow(expect.objectContaining({ code: 'durada' }));
  }
});

test('R32.8 les coordenades només admeten números finits dins del rang i es copien', () => {
  expect(typeof multimedia.normalitzaUbicacioXat).toBe('function');
  for (const valor of [null, undefined]) expect(multimedia.normalitzaUbicacioXat(valor)).toBeNull();
  for (const valor of [{ lat: -90, lng: -180 }, { lat: 90, lng: 180 }, { lat: 38.64, lng: -0.49 }]) {
    const net = multimedia.normalitzaUbicacioXat(valor);
    expect(net).toEqual(valor); expect(net).not.toBe(valor);
  }
  for (const valor of [{}, [], false, '38,-0.4', { lat: 0 }, { lat: '0', lng: 0 }, { lat: true, lng: 0 },
    { lat: 90.1, lng: 0 }, { lat: 0, lng: -180.1 }, { lat: NaN, lng: 0 }, { lat: 0, lng: Infinity },
    { lat: 0, lng: 0, altitud: 4 }, { lat: 0, lng: 0, usuari_id: 'suplantat' }]) {
    expect(() => multimedia.normalitzaUbicacioXat(valor)).toThrow(expect.objectContaining({ code: 'ubicacio-invalida' }));
  }
});

test('R32.8 la validació d’adjunt rebutja GPS malformat abans del transport', () => {
  expect(() => multimedia.validaAdjuntXat({ fitxer: video(64), tipus: 'video', duradaMs: 60_000, ubicacio: { lat: 999, lng: 0 } })).toThrow(expect.objectContaining({ code: 'ubicacio-invalida' }));
});
