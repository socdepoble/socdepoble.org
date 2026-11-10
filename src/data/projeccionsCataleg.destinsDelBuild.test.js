/* PRODNM-01, PRODNM-02, USA-04, RV-05 (R15b) · Els destins del Rebost i del
   Bar existixen només amb l'app al build, i cap fila amb la marca de projecció
   no és una publicació del Mur. */
import { afterEach, expect, test, vi } from 'vitest';
import { DESTINS_CATALEG, capturaDestinsCataleg, destinsOferitsCataleg, portaMarcaProjeccioCataleg, rutaFontCataleg } from './projeccionsCataleg.js';

afterEach(() => { vi.unstubAllEnvs(); });

function produccio({ nevera = '', bar = '' } = {}) {
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_SDP_APP_NEVERA', nevera);
  vi.stubEnv('VITE_SDP_APP_BAR', bar);
}

test('producció sense les banderes de les apps: cap ruta ni destí del Rebost o del Bar', () => {
  produccio();
  expect(rutaFontCataleg('nevera')).toBeNull();
  expect(rutaFontCataleg('bar')).toBeNull();
  expect(rutaFontCataleg('herbari')).toBe('/page/herbari');
  expect(destinsOferitsCataleg()).toEqual(['mur', 'mercat', 'receptes', 'herbari', 'llavors']);
  // La validació de les files continua acceptant-los: cap dada desada es perd.
  expect(capturaDestinsCataleg(['bar', 'rebost'])).toEqual(['rebost', 'bar']);
});

test('cada app oberta pel seu literal oferix només el seu destí', () => {
  produccio({ nevera: '1' });
  expect(rutaFontCataleg('nevera')).toBe('/app/nevera/rebost');
  expect(rutaFontCataleg('bar')).toBeNull();
  expect(destinsOferitsCataleg()).toContain('rebost');
  expect(destinsOferitsCataleg()).not.toContain('bar');
  vi.unstubAllEnvs();
  produccio({ bar: '1' });
  expect(destinsOferitsCataleg()).toContain('bar');
  expect(destinsOferitsCataleg()).not.toContain('rebost');
});

test('en desenvolupament hi són tots, en l’ordre de DESTINS_CATALEG', () => {
  vi.stubEnv('DEV', true);
  expect(destinsOferitsCataleg()).toEqual([...DESTINS_CATALEG]);
});

test('una font desconeguda o heretada del prototip no té ruta', () => {
  for (const font of ['constructor', '__proto__', 'toString', 'inventada', null, 7]) expect(rutaFontCataleg(font)).toBeNull();
});

test('la marca de projecció es reconeix encara que siga invàlida o una retirada', () => {
  expect(portaMarcaProjeccioCataleg({ id: 'x', projeccioCataleg: { v: 1, destins: [] } })).toBe(true);
  expect(portaMarcaProjeccioCataleg({ id: 'x', projeccioCataleg: null })).toBe(true);
  expect(portaMarcaProjeccioCataleg({ id: 'x', title: 'Publicació normal' })).toBe(false);
  expect(portaMarcaProjeccioCataleg(Object.create({ projeccioCataleg: {} }))).toBe(false);
  expect(portaMarcaProjeccioCataleg(null)).toBe(false);
});
