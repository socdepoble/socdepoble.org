// @vitest-environment node
/* B8C-1 (marató 261101_2143; B8-CLIENT §2.2 punt 7, D-B8C-1 i D-B8C-6) · El
   destí del toc d'un avís push, calculat amb els fils de la sessió actual, i
   la ruta neutra de l'avís. Pur: res del servei de push no hi entra. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { especificadorsImport } from '../../../tests/helpers/especificadorsImport.js';
import { CAMI_AVIS_XAT, PARAM_AVIS, VALOR_AVIS, destiDelToc, esRutaDeLAvis } from './destiDelAvis.js';

const fil = (id, extra = {}) => ({ id, noLlegits: 0, silenciat: false, arxivat: false, perDefecte: null, participant: true, tipus: 'directe', ...extra });

describe('la ruta neutra de l’avís', () => {
  test('el camí és /xat?obri=no-llegits, sense cap fil', () => {
    expect(PARAM_AVIS).toBe('obri');
    expect(VALOR_AVIS).toBe('no-llegits');
    expect(CAMI_AVIS_XAT).toBe('/xat?obri=no-llegits');
  });

  test.each([
    ['/xat', 'obri=no-llegits', true],
    ['/xat', '?obri=no-llegits', true],
    ['/xat/', 'obri=no-llegits', true],
    ['/xat/', '?obri=no-llegits&altra=1', true],
    ['/xatxa', 'obri=no-llegits', false],
    ['/xat/123', 'obri=no-llegits', false],
    ['/xat/123', '?obri=no-llegits', false],
    ['/xat', 'obri=altra', false],
    ['/xat', '?obri=', false],
    ['/xat', '', false],
    ['/xat', undefined, false],
    ['/xat', null, false],
    ['/notes', '?obri=no-llegits', false],
    [undefined, '?obri=no-llegits', false],
    ['/XAT', '?obri=no-llegits', false]
  ])('esRutaDeLAvis(%j, %j) → %s', (pathname, search, esperat) => {
    expect(esRutaDeLAvis(pathname, search)).toBe(esperat);
  });
});

describe('destiDelToc', () => {
  test('un sol fil amb missatges nous → la seua conversa, amb l’id codificat', () => {
    expect(destiDelToc([fil('a'), fil('b c/d?e', { noLlegits: 2 })])).toBe('/xat/b%20c%2Fd%3Fe');
    expect(destiDelToc([fil('f-1', { noLlegits: 1 })])).toBe('/xat/f-1');
  });

  test('dos o més → la llista; cap → null (qui ja llig la conversa no en surt)', () => {
    expect(destiDelToc([fil('a', { noLlegits: 1 }), fil('b', { noLlegits: 5 })])).toBe('/xat');
    expect(destiDelToc([fil('a'), fil('b')])).toBeNull();
    expect(destiDelToc([])).toBeNull();
  });

  test('els silenciats, arxivats, bloquejats, per defecte i amb la marca manual no compten', () => {
    const apartats = [
      fil('s', { noLlegits: 3, silenciat: true }),
      fil('ar', { noLlegits: 3, arxivat: true }),
      fil('bl', { noLlegits: 3, bloquejat: true }),
      fil('pd', { noLlegits: 3, perDefecte: 'javi' }),
      fil('sdp-per-defecte:iaia', { noLlegits: 3 }),
      fil('m', { noLlegits: 0, noLlegitManual: true })
    ];
    expect(destiDelToc(apartats)).toBeNull();
    expect(destiDelToc([...apartats, fil('bo', { noLlegits: 1 })])).toBe('/xat/bo');
  });

  test('ni una comunitat (contenidor sense missatges) ni un fil de visitant poden haver dut l’avís', () => {
    const altres = [fil('com', { noLlegits: 4, tipus: 'comunitat', esComunitat: true }), fil('vis', { noLlegits: 2, participant: false })];
    expect(destiDelToc([...altres, fil('bo', { noLlegits: 1 })])).toBe('/xat/bo');
  });

  test('noLlegits en text ("3") compta; en brossa, negatiu o zero, no', () => {
    expect(destiDelToc([fil('t', { noLlegits: '3' })])).toBe('/xat/t');
    expect(destiDelToc([fil('x', { noLlegits: 'tres' }), fil('y', { noLlegits: -1 }), fil('z', { noLlegits: '0' }), fil('w', { noLlegits: null })])).toBeNull();
  });

  test('un id repetit compta una vegada; un id numèric es llig com a text; sense id, no compta', () => {
    expect(destiDelToc([fil('a', { noLlegits: 1 }), fil('a', { noLlegits: 2 })])).toBe('/xat/a');
    expect(destiDelToc([fil(42, { noLlegits: 1 })])).toBe('/xat/42');
    expect(destiDelToc([fil(undefined, { noLlegits: 1 }), fil('   ', { noLlegits: 1 }), null, 'fil', 7])).toBeNull();
  });

  test('una llista que no ho és → null', () => {
    expect(destiDelToc(null)).toBeNull();
    expect(destiDelToc(undefined)).toBeNull();
    expect(destiDelToc({ 0: fil('a', { noLlegits: 1 }) })).toBeNull();
  });
});

test('per text: pur, sense cap import', () => {
  const fitxer = 'src/sections/xat/destiDelAvis.js';
  expect(especificadorsImport(readFileSync(path.join(process.cwd(), fitxer), 'utf8'), fitxer)).toEqual([]);
});
