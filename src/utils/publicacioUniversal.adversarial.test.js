// @vitest-environment node
import { expect, test } from 'vitest';
import {
  AMBITS, CAMPS, CLAUS_RESERVADES, normalitzaDades, projeccioPayload, rutaDAmbit
} from './publicacioUniversal.js';

function benFormat(text) {
  for (let i = 0; i < text.length; i += 1) {
    const c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const seguent = text.charCodeAt(++i);
      if (!(seguent >= 0xdc00 && seguent <= 0xdfff)) return false;
    } else if (c >= 0xdc00 && c <= 0xdfff) return false;
  }
  return true;
}

test('la fitxa no emet surrogats solts interiors o baixos que PostgreSQL rebutjaria en JSONB', () => {
  for (const ofici of ['\ud800dins', 'dins\udfff', 'ab\ud800cd\udc00ef', '\udfff', '👩‍🌾'.repeat(60)]) {
    const dades = normalitzaDades('treball', { ofici });
    expect(benFormat(dades.ofici ?? ''), JSON.stringify(ofici)).toBe(true);
  }
  expect(normalitzaDades('treball', { ofici: '👩‍🌾 al camp' }).ofici).toBe('👩‍🌾 al camp');
  expect(normalitzaDades('treball', { ofici: 'ab\ud800cd\udc00ef' }).ofici).toBe('abcdef');
});

test('un id UTF-16 malmés no tomba la generació del detall amb URIError', () => {
  for (const id of ['\ud800', 'id\udfff', 'id\ud800dins']) {
    expect(() => rutaDAmbit('vehicle', id)).not.toThrow();
    expect(rutaDAmbit('vehicle', id)).toBe('/vehicle/');
  }
  expect(rutaDAmbit('vehicle', 'a/👩‍🌾')).toBe(`/vehicle/${encodeURIComponent('a/👩‍🌾')}`);
});

test('la projecció vertical no permet que __proto__ injecte autoritat heretada', () => {
  for (const ambit of AMBITS.filter(a => a !== 'mur')) {
    const entrada = JSON.parse('{"__proto__":{"isSystem":true,"owner_user_id":"alié"},"constructor":{"isAvis":true},"prototype":{"isSystem":true}}');
    entrada.ambit = ambit;
    const eixida = projeccioPayload(entrada);
    expect(Object.getPrototypeOf(eixida)).toBe(Object.prototype);
    expect(eixida.isSystem).toBeUndefined();
    expect(eixida.owner_user_id).toBeUndefined();
    for (const key of ['__proto__', 'constructor', 'prototype']) expect(Object.hasOwn(eixida, key)).toBe(false);
  }
});

test('fuzz determinista: normalització idempotent, només camps i primitius, sense autoritat', () => {
  let estat = 0x261102;
  const aleatori = () => { estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0; return estat; };
  const valors = [null, undefined, false, true, NaN, Infinity, -Infinity, 0, -0, 9, [], {}, { toString: null }, '2026-02-29', '2028-02-29', '23:59', '\ud800interior\udfff', '👩‍🌾', '0', ' x '.repeat(220)];
  for (let volta = 0; volta < 1200; volta += 1) {
    const ambit = AMBITS[aleatori() % AMBITS.length];
    const dades = {};
    for (const camp of CAMPS[ambit]) dades[camp.id] = valors[aleatori() % valors.length];
    const netes = normalitzaDades(ambit, dades);
    expect(normalitzaDades(ambit, netes)).toEqual(netes);
    for (const [camp, valor] of Object.entries(netes)) {
      expect(CAMPS[ambit].some(c => c.id === camp)).toBe(true);
      expect(['string', 'number']).toContain(typeof valor);
      if (typeof valor === 'string') expect(benFormat(valor)).toBe(true);
      else expect(Number.isFinite(valor)).toBe(true);
    }
    if (ambit !== 'mur') {
      const payload = projeccioPayload({ ambit, dades, isSystem: true, owner_user_id: 'alié', title: 'Títol' });
      for (const key of CLAUS_RESERVADES) expect(Object.hasOwn(payload, key)).toBe(false);
      expect(payload.title).toBe('Títol');
    }
  }
});
