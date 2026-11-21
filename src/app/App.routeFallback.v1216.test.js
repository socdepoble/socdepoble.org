// @vitest-environment node
/* P0-ANDROID-PUSH (v1.2.16) · B11a (ordre del Mestre 261121; prompt 0216, T2.5; D-13) · El text de càrrega
   de la closca es veu: mentre arriba el tros d'una ruta (el Xat, on aterra sempre el Foraster), la
   regió viva diu «S'està carregant el contingut...» amb les classes de l'estat buit, i ja no només al
   lector de pantalla (abans, un buit color crema). 0 classes noves i 0 claus noves. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import CA from '../config/idiomes/ca.js';
import ES from '../config/idiomes/es.js';
import EN from '../config/idiomes/en.js';
import EU from '../config/idiomes/eu.js';
import GL from '../config/idiomes/gl.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

test('B11a · RouteFallback pinta el text visible amb les classes de l’estat buit', () => {
  const app = senseComentaris(llig('src/app/App.jsx'));
  const inici = app.indexOf('function RouteFallback()');
  expect(inici).toBeGreaterThan(-1);
  const cos = app.slice(inici, app.indexOf('\n}\n', inici));
  expect(cos).toContain('<div role="status" aria-live="polite" className="sdp-buit">');
  expect(cos).toContain('<p className="sdp-buit__titol">{tradueix(t, NOMS_CLOSCA.carregaRuta)}</p>');
  expect(cos).not.toContain('sr-only');
});

test('B11a · les classes ja són al full de components (arrencada) i la clau, a les 5 llengües', () => {
  const components = senseComentaris(llig('src/css/components.css'));
  expect(components).toMatch(/\.sdp-buit \{/);
  expect(components).toMatch(/\.sdp-buit__titol \{/);
  for (const dic of [CA, ES, EN, EU, GL]) {
    expect(typeof dic['nav.carregaRuta']).toBe('string');
    expect(dic['nav.carregaRuta'].trim().length).toBeGreaterThan(0);
  }
  expect(CA['nav.carregaRuta']).toBe("S'està carregant el contingut...");
});
