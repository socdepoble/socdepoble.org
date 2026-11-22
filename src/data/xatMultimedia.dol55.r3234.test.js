import { expect, test } from 'vitest';
import { normalitzaUbicacioXat } from './xatMultimedia.js';

test.each([
  [{ lat: 38.5919, lng: -0.4184 }, { lat: 38.59, lng: -0.42 }],
  [{ lat: -38.5919, lng: 0.4184 }, { lat: -38.59, lng: 0.42 }],
  [{ lat: -90, lng: 180 }, { lat: -90, lng: 180 }],
  [{ lat: -0.00001, lng: 0.00001 }, { lat: 0, lng: 0 }],
])('DOL-55: el lloc compartit té dos decimals com a màxim, sense alterar l’entrada %j', (original, esperat) => {
  Object.freeze(original);
  const resultat = normalitzaUbicacioXat(original);
  expect(resultat).toEqual(esperat);
  expect(resultat).not.toBe(original);
  expect(normalitzaUbicacioXat(resultat)).toEqual(resultat);
  for (const valor of Object.values(resultat)) expect(Object.is(valor, -0)).toBe(false);
});

test.each([
  { lat: 90.00001, lng: 0 }, { lat: 0, lng: -180.00001 },
  { lat: '38.5919', lng: -0.4184 }, { lat: 38.5919, lng: -0.4184, altitud: 456.7 },
])('DOL-55: validar abans d’arrodonir impedix ocultar un DTO invàlid %j', valor => {
  expect(() => normalitzaUbicacioXat(valor)).toThrow(expect.objectContaining({ code: 'ubicacio-invalida' }));
});

test('DOL-55: el DTO compartit és una graella estable de 0,01 graus en els quatre hemisferis', () => {
  for (let i = -100; i <= 100; i += 1) {
    const resultat = normalitzaUbicacioXat({ lat: i * 0.891234567, lng: i * 1.781234567 });
    for (const valor of Object.values(resultat)) expect(Number(valor.toFixed(2))).toBe(valor);
    expect(normalitzaUbicacioXat(resultat)).toEqual(resultat);
  }
});
