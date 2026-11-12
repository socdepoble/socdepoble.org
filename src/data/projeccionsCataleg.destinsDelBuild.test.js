/* PRODNM-01, PRODNM-02, USA-04, RV-05 (R15b) · Els destins del Rebost i del
   Bar existixen només amb l'app al build, i cap fila amb la marca de projecció
   no és una publicació del Mur. P0-113 (ordre del Mestre, 261111): la Nevera i
   el Bar són oberts per defecte; amb VITE_SDP_APP_<ID>=0 ixen del build. */
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { DESTINS_CATALEG, capturaDestinsCataleg, destinsOferitsCataleg, portaMarcaProjeccioCataleg, rutaFontCataleg } from './projeccionsCataleg.js';

afterEach(() => { vi.unstubAllEnvs(); });

function produccio({ nevera = '', bar = '' } = {}) {
  vi.stubEnv('DEV', false);
  vi.stubEnv('VITE_SDP_APP_NEVERA', nevera);
  vi.stubEnv('VITE_SDP_APP_BAR', bar);
}

test('les rutes van darrere del mateix literal d’exclusió que el manifest de cada app', () => {
  const font = readFileSync('src/data/projeccionsCataleg.js', 'utf8');
  for (const [id, ruta] of [['NEVERA', "{ nevera: '/app/nevera/rebost' }"], ['BAR', "{ bar: '/app/bar/cataleg' }"]]) {
    const porta = `import.meta.env.VITE_SDP_APP_${id} !== '0'`;
    expect(font).toContain(`...(${porta} ? ${ruta} : {})`);
    expect(readFileSync(`src/apps/${id.toLowerCase()}/manifest.js`, 'utf8')).toContain(`carrega: ${porta} ? () => import(`);
  }
});

test('producció per defecte (sense banderes): les rutes i els destins del Rebost i del Bar hi són', () => {
  produccio();
  expect(rutaFontCataleg('nevera')).toBe('/app/nevera/rebost');
  expect(rutaFontCataleg('bar')).toBe('/app/bar/cataleg');
  expect(rutaFontCataleg('herbari')).toBe('/page/herbari');
  expect(destinsOferitsCataleg()).toEqual([...DESTINS_CATALEG]);
});

test('producció amb les dos apps desendollades (=0): cap ruta ni destí del Rebost o del Bar', () => {
  produccio({ nevera: '0', bar: '0' });
  expect(rutaFontCataleg('nevera')).toBeNull();
  expect(rutaFontCataleg('bar')).toBeNull();
  expect(rutaFontCataleg('herbari')).toBe('/page/herbari');
  expect(destinsOferitsCataleg()).toEqual(['mur', 'mercat', 'receptes', 'herbari', 'llavors', 'arbres-monumentals', 'pagina']);
  // La validació de les files continua acceptant-los: cap dada desada es perd.
  expect(capturaDestinsCataleg(['bar', 'rebost'])).toEqual(['rebost', 'bar']);
});

test('desendollar una app trau només el seu destí', () => {
  produccio({ bar: '0' });
  expect(rutaFontCataleg('nevera')).toBe('/app/nevera/rebost');
  expect(rutaFontCataleg('bar')).toBeNull();
  expect(destinsOferitsCataleg()).toContain('rebost');
  expect(destinsOferitsCataleg()).not.toContain('bar');
  vi.unstubAllEnvs();
  produccio({ nevera: '0' });
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
