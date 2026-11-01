import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import CA from '../../../config/idiomes/ca.js';
import { FORMATS, PARELLS_FORMA, PARELL_PERCENTATGE, etiquetaDeForma, textAmpliacio } from './enquadrament.js';
import {
  ERROR_LATITUD, ERROR_LONGITUD, ERROR_UBICACIO, PRECISIONS, errorCoordenada, errorUbicacio, precisionsTraduides, textUbicacio,
} from './geolocalitzacio.js';
import { ERROR_HEIC, ERROR_PES, ERROR_PIXELS, missatgeLimit } from './limits.js';
import {
  ERROR_EXIF_NO_CONSERVABLE, ERROR_EXIF_NO_CONSERVABLE_CAMERA, ETIQUETA_CONSERVA_CAMERA, ETIQUETA_CONSERVA_EXIF,
  errorExifNoConservable, etiquetaConservaExif,
} from './exifIncrustat.js';

/* ═══════════════════════════════════════════════════════════════════
   T5c · P1-22 (assalt 261101) · ELS MÒDULS PURS DE L'ENQUADRAMENT AMB `t`

   Les funcions prenen un traductor opcional. Sense (o amb null), el valencià
   de sempre, lletra per lletra: limits.test.js, geolocalitzacio.test.js i
   exifIncrustat.test.js no canvien. Amb el traductor valencià de veres, el
   mateix text (el diccionari diu exactament la reserva). Amb una altra
   llengua, la seua. I cap clau editor.enquadrament.* del diccionari és òrfena.
   ═══════════════════════════════════════════════════════════════════ */

const t = Object.freeze({
  ca: createTranslator('ca'), es: createTranslator('es'), en: createTranslator('en'), eu: createTranslator('eu'), gl: createTranslator('gl'),
});
const geo = Object.freeze({ lat: 38.5919, lng: -0.4184 });
const AMB_UBICACIO = Object.freeze({ gps: { lat: 1, lng: 1 } });
const NOMES_CAMERA = Object.freeze({ estat: 'publicable', contingut: { marca: true } });

describe('etiquetaDeForma', () => {
  test('tradueix l’etiqueta de sèrie i respecta una de pròpia', () => {
    expect(etiquetaDeForma({ valor: '16:9', etiqueta: 'Panoràmic (16:9)' }, t.es)).toBe('Panorámico (16:9)');
    expect(etiquetaDeForma({ valor: '1:1', etiqueta: 'Quadrat (1:1)' }, t.en)).toBe('Square (1:1)');
    expect(etiquetaDeForma({ valor: 'original', etiqueta: 'Original' }, t.eu)).toBe('Jatorrizkoa');
    expect(etiquetaDeForma({ valor: '16:9', etiqueta: 'La meua panoràmica' }, t.es)).toBe('La meua panoràmica');
    expect(etiquetaDeForma({ valor: '5:1', etiqueta: 'Banda' }, t.es)).toBe('Banda');
    expect(etiquetaDeForma(null, t.es)).toBeUndefined();
  });

  test('sense traductor (o amb null), i amb el valencià de veres, l’etiqueta de FORMATS tal qual', () => {
    for (const forma of FORMATS) {
      expect(etiquetaDeForma(forma)).toBe(forma.etiqueta);
      expect(etiquetaDeForma(forma, null)).toBe(forma.etiqueta);
      expect(etiquetaDeForma(forma, t.ca)).toBe(forma.etiqueta);
    }
    expect(Object.keys(PARELLS_FORMA).sort()).toEqual(FORMATS.map((f) => f.valor).sort());
  });
});

describe('textAmpliacio amb `t` (correcció T5c-G4)', () => {
  test('el percentatge en la tipografia de la llengua; sense traductor, el valencià de sempre', () => {
    expect(textAmpliacio(1.2, t.en)).toBe('120%');
    expect(textAmpliacio(2.345, t.es)).toBe('235 %');
    for (const tr of [undefined, null, t.ca]) expect(textAmpliacio(1, tr)).toBe('100 %');
    expect(CA[PARELL_PERCENTATGE[0]]).toBe(PARELL_PERCENTATGE[1]);
  });
});

describe('geolocalitzacio amb `t`', () => {
  test('precisionsTraduides: etiqueta i ajuda en anglés, la resta de la fila intacta; PRECISIONS no es toca', () => {
    const abans = JSON.stringify(PRECISIONS);
    const en = precisionsTraduides(t.en);
    expect(en.map((p) => p.etiqueta)).toEqual(['Exact', 'About 100 m', 'Town only']);
    expect(en.map((p) => p.ajuda)).toEqual([
      'The photo’s spot, to within a metre.', 'You can see the area, not the exact spot.', 'Within a kilometre: no house can be pinpointed.',
    ]);
    expect(en.map(({ valor, decimals, precisio_m: m }) => [valor, decimals, m]))
      .toEqual(PRECISIONS.map(({ valor, decimals, precisio_m: m }) => [valor, decimals, m]));
    expect(JSON.stringify(PRECISIONS)).toBe(abans);
    expect(Object.isFrozen(en) && en.every(Object.isFrozen)).toBe(true);
  });

  test('precisionsTraduides: sense traductor, la mateixa taula; amb el valencià, els mateixos textos', () => {
    expect(precisionsTraduides()).toBe(PRECISIONS);
    expect(precisionsTraduides(null)).toBe(PRECISIONS);
    expect(precisionsTraduides(t.ca).map((p) => [p.etiqueta, p.ajuda])).toEqual(PRECISIONS.map((p) => [p.etiqueta, p.ajuda]));
  });

  test('textUbicacio: l’abast i el separador dels milers en la llengua; les coordenades, amb el punt', () => {
    expect(textUbicacio(geo, 'poble')).toBe('38.59, -0.42 (uns 1.000 m)');
    expect(textUbicacio(geo, 'poble', t.ca)).toBe('38.59, -0.42 (uns 1.000 m)');
    expect(textUbicacio(geo, 'poble', t.en)).toBe('38.59, -0.42 (about 1,000 m)');
    expect(textUbicacio(geo, '100m', t.gl)).toBe('38.592, -0.418 (uns 100 m)');
    expect(textUbicacio(geo, '100m', t.eu)).toBe('38.592, -0.418 (100 m inguru)');
    expect(textUbicacio(geo, 'exacta', t.es)).toBe('38.59190, -0.41840 (exacta)');
    expect(textUbicacio(geo, 'exacta', t.en)).toBe('38.59190, -0.41840 (exact)');
    expect(textUbicacio(null, 'exacta', t.en)).toBe('');
  });

  test('errorCoordenada i errorUbicacio: en la llengua; sense traductor, les constants de sempre', () => {
    expect(errorCoordenada('200', 'lat', t.eu)).toBe('Idatzi -90 eta 90 arteko latitude bat (adibidez, 38.5919).');
    expect(errorCoordenada('abc', 'lng', t.es)).toBe('Escribe una longitud entre -180 y 180 (por ejemplo, -0.4184).');
    expect(errorCoordenada('38.5', 'lat', t.es)).toBeNull();
    expect(errorCoordenada('', 'lat', t.es)).toBeNull();
    expect(errorCoordenada('200', 'lat')).toBe(ERROR_LATITUD);
    expect(errorCoordenada('200', 'lng', t.ca)).toBe(ERROR_LONGITUD);
    expect(errorUbicacio()).toBe(ERROR_UBICACIO);
    expect(errorUbicacio(t.ca)).toBe(ERROR_UBICACIO);
    expect(ERROR_UBICACIO).toBe('Falta la ubicació: escriu la latitud i la longitud o desmarca «Vull geolocalitzar aquesta imatge».');
    expect(errorUbicacio(t.es)).toBe('Falta la ubicación: escribe la latitud y la longitud o desmarca «Quiero geolocalizar esta imagen».');
  });
});

describe('limits amb `t`', () => {
  test('missatgeLimit: en la llengua; sense traductor, les constants; un codi que no és un límit, null', () => {
    expect(missatgeLimit('heic', t.es)).toBe('Este navegador no puede abrir fotos HEIC. Guárdala o compártela como JPEG y vuelve a intentarlo.');
    expect(missatgeLimit('pes', t.en)).toBe('This photo is larger than 25 MB. Choose a smaller one.');
    expect(missatgeLimit('pixels', t.gl)).toMatch(/^Esta foto é .+ grande para encadrala no navegador/);
    expect([missatgeLimit('pes'), missatgeLimit('pixels'), missatgeLimit('heic')]).toEqual([ERROR_PES, ERROR_PIXELS, ERROR_HEIC]);
    expect([missatgeLimit('pes', t.ca), missatgeLimit('pixels', t.ca), missatgeLimit('heic', t.ca)]).toEqual([ERROR_PES, ERROR_PIXELS, ERROR_HEIC]);
    for (const codi of [undefined, null, '', 'constructor', '__proto__', 'toString', 'altre']) expect(missatgeLimit(codi, t.es)).toBeNull();
  });
});

describe('exifIncrustat amb `t`', () => {
  test('etiquetaConservaExif i errorExifNoConservable: l’avís nomena la casella en la mateixa llengua', () => {
    expect(etiquetaConservaExif(AMB_UBICACIO, t.gl)).toBe('Conserva a localización e a data da foto');
    expect(etiquetaConservaExif(NOMES_CAMERA, t.en)).toBe('Keep the photo’s camera data');
    expect(errorExifNoConservable(AMB_UBICACIO, t.en))
      .toBe('This photo’s location and date cannot be kept; untick “Keep the photo’s location and date” to upload it without them.');
    expect(errorExifNoConservable(NOMES_CAMERA, t.eu))
      .toBe('Ezin dira argazki honen kameraren datuak gorde; kendu marka «Gorde argazkiaren kameraren datuak» aukerari, haiek gabe igotzeko.');
  });

  test('sense traductor i amb el valencià de veres, les constants de sempre', () => {
    for (const tr of [undefined, null, t.ca]) {
      expect(etiquetaConservaExif(AMB_UBICACIO, tr)).toBe(ETIQUETA_CONSERVA_EXIF);
      expect(etiquetaConservaExif(NOMES_CAMERA, tr)).toBe(ETIQUETA_CONSERVA_CAMERA);
      expect(errorExifNoConservable(AMB_UBICACIO, tr)).toBe(ERROR_EXIF_NO_CONSERVABLE);
      expect(errorExifNoConservable(NOMES_CAMERA, tr)).toBe(ERROR_EXIF_NO_CONSERVABLE_CAMERA);
    }
    expect(ERROR_EXIF_NO_CONSERVABLE).toBe('No es pot conservar la ubicació i la data d’esta foto; desmarca «Conserva la ubicació i la data de la foto» per a pujar-la sense.');
  });
});

describe('les claus editor.enquadrament.* i el codi', () => {
  const ARREL = process.cwd();
  const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
  const produccio = (dir, acc = []) => {
    for (const e of readdirSync(path.join(ARREL, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (rel !== 'src/config/idiomes') produccio(rel, acc); }
      else if (/\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name)) acc.push(rel);
    }
    return acc;
  };
  const CLAU = /(?:\[\s*|\bt\(\s*)'(editor\.enquadrament\.[\w.]+)'\s*,/g;
  const clausDe = (font) => [...font.matchAll(CLAU)].map((m) => m[1]);
  /* Les set peces de P1-22. */
  const PECES = ['DialegEnquadrament.jsx', 'UbicacioImatge.jsx', 'enquadrament.js', 'geolocalitzacio.js', 'limits.js', 'exifIncrustat.js',
    'useEnquadramentImatge.jsx'].map((nom) => llig(`src/components/universal/enquadrament/${nom}`));

  test('cap clau del diccionari és òrfena (totes les demana alguna font de producció)', () => {
    const usades = new Set(produccio('src').flatMap((rel) => clausDe(llig(rel))));
    const delDiccionari = Object.keys(CA).filter((clau) => clau.startsWith('editor.enquadrament.'));
    expect(delDiccionari.length).toBeGreaterThanOrEqual(92);
    expect(delDiccionari.filter((clau) => !usades.has(clau))).toEqual([]);
  });

  test('les set peces demanen 92 claus o més, i totes són al valencià', () => {
    const usades = new Set(PECES.flatMap(clausDe));
    expect(usades.size).toBeGreaterThanOrEqual(92);
    expect([...usades].filter((clau) => !Object.hasOwn(CA, clau))).toEqual([]);
  });

  test('cap clau es construïx amb una plantilla (i18n.usades.test.js només veu les literals)', () => {
    expect(PECES.filter((font) => /`editor\.enquadrament\.\$\{/.test(font))).toEqual([]);
  });
});
