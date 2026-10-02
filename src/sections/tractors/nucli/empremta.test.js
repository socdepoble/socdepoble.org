// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { ErrorEmpremta, SCHEMA_EMPREMTA, calculaEmpremta, empremtaCurta, manifestNet, normalitzaText, preimatgeEmpremta } from './empremta.js';

const subtle = webcrypto.subtle;
const FITXA = 'Lector de factures\n\nQuè llig, què escriu i per què.\n';
const LECTOR = 'export function llig() {\n  return 1;\n}\n';
const FULL = 'export function full() {\n  return 2;\n}\n';

function manifest(canvis = {}) {
  return {
    schema: 'sdp.tractor.v1',
    id: 'sdp.gestoria-lector',
    nom: 'Lector de factures',
    versio: '1.0.0',
    descripcio: 'Llig les factures de la carpeta triada.',
    fitxa: 'tractors/gestoria/fitxa.md',
    fonts: ['src/gestoria/lector.js', 'src/gestoria/full.js'],
    llig: ['factures/**'],
    escriu: ['eixida/**'],
    xarxa: 'cap',
    dadesPersonals: true,
    nivellMinim: 'signatura',
    caducitatDies: 90,
    ...canvis
  };
}

function entrada(canvis = {}) {
  return {
    manifest: manifest(),
    fitxa: FITXA,
    fonts: [
      { ruta: 'src/gestoria/lector.js', contingut: LECTOR },
      { ruta: 'src/gestoria/full.js', contingut: FULL }
    ],
    ...canvis
  };
}

const hexNode = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

async function errorDe(promesa) {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error('S\'esperava un error.');
}

describe('calculaEmpremta', () => {
  test('forma i determinisme', async () => {
    const a = await calculaEmpremta(entrada(), subtle);
    expect(a).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(await calculaEmpremta(entrada(), subtle)).toBe(a);
    expect(await calculaEmpremta(entrada())).toBe(a);
  });

  test('coincidix amb un càlcul independent amb node:crypto', async () => {
    const preimatge = JSON.stringify({
      fitxa: hexNode(FITXA),
      fonts: [['src/gestoria/full.js', hexNode(FULL)], ['src/gestoria/lector.js', hexNode(LECTOR)]],
      manifest: {
        caducitatDies: 90,
        dadesPersonals: true,
        descripcio: 'Llig les factures de la carpeta triada.',
        escriu: ['eixida/**'],
        fitxa: 'tractors/gestoria/fitxa.md',
        fonts: ['src/gestoria/lector.js', 'src/gestoria/full.js'],
        id: 'sdp.gestoria-lector',
        llig: ['factures/**'],
        nivellMinim: 'signatura',
        nom: 'Lector de factures',
        schema: 'sdp.tractor.v1',
        versio: '1.0.0',
        xarxa: 'cap'
      },
      schema: SCHEMA_EMPREMTA
    });
    expect(await preimatgeEmpremta(entrada(), subtle)).toBe(preimatge);
    expect(await calculaEmpremta(entrada(), subtle)).toBe(`sha256:${hexNode(preimatge)}`);
  });

  test('l\'ordre de les fonts rebudes no importa', async () => {
    const girades = entrada();
    girades.fonts.reverse();
    expect(await calculaEmpremta(girades, subtle)).toBe(await calculaEmpremta(entrada(), subtle));
  });

  test('CRLF, BOM i bytes donen la mateixa empremta que el text LF', async () => {
    const base = await calculaEmpremta(entrada(), subtle);
    const windows = entrada({
      fitxa: `﻿${FITXA.replace(/\n/g, '\r\n')}`,
      fonts: [
        { ruta: 'src/gestoria/lector.js', contingut: new TextEncoder().encode(LECTOR.replace(/\n/g, '\r\n')) },
        { ruta: 'src/gestoria/full.js', contingut: FULL }
      ]
    });
    expect(await calculaEmpremta(windows, subtle)).toBe(base);
  });

  test('qualsevol canvi de codi, fitxa o manifest canvia l\'empremta', async () => {
    const base = await calculaEmpremta(entrada(), subtle);
    const variants = [
      entrada({ fitxa: `${FITXA} ` }),
      entrada({ fonts: [{ ruta: 'src/gestoria/lector.js', contingut: LECTOR.replace('1', '3') }, { ruta: 'src/gestoria/full.js', contingut: FULL }] }),
      entrada({ manifest: manifest({ versio: '1.0.1' }) }),
      entrada({ manifest: manifest({ xarxa: 'api.example.org' }) }),
      entrada({ manifest: manifest({ escriu: ['eixida/**', 'altra/**'] }) })
    ];
    const empremtes = await Promise.all(variants.map((v) => calculaEmpremta(v, subtle)));
    for (const e of empremtes) expect(e).not.toBe(base);
    expect(new Set(empremtes).size).toBe(variants.length);
  });

  test('un CR solt no es normalitza', async () => {
    const ambCr = entrada({ fitxa: FITXA.replace('\n\n', '\r\r') });
    expect(await calculaEmpremta(ambCr, subtle)).not.toBe(await calculaEmpremta(entrada(), subtle));
  });

  test('els camps derivats del manifest no entren a l\'empremta', async () => {
    const ambDerivats = entrada({ manifest: { ...manifest(), empremta: 'sha256:x', estat: 'aprovat' } });
    expect(await calculaEmpremta(ambDerivats, subtle)).toBe(await calculaEmpremta(entrada(), subtle));
    expect(manifestNet({ ...manifest(), empremtaCurta: 'X' })).toEqual(manifest());
  });

  test('falta una font declarada: EMPREMTA_INCOMPLETA amb la llista', async () => {
    const error = await errorDe(calculaEmpremta(entrada({ fonts: [{ ruta: 'src/gestoria/full.js', contingut: FULL }] }), subtle));
    expect(error).toBeInstanceOf(ErrorEmpremta);
    expect(error.codi).toBe('EMPREMTA_INCOMPLETA');
    expect(error.detalls).toEqual(['src/gestoria/lector.js']);
  });

  test('una font sense contingut compta com absent', async () => {
    const fonts = [{ ruta: 'src/gestoria/lector.js', contingut: null }, { ruta: 'src/gestoria/full.js', contingut: FULL }];
    expect((await errorDe(calculaEmpremta(entrada({ fonts }), subtle))).codi).toBe('EMPREMTA_INCOMPLETA');
  });

  test('falta la fitxa: EMPREMTA_INCOMPLETA', async () => {
    const error = await errorDe(calculaEmpremta(entrada({ fitxa: undefined }), subtle));
    expect(error.codi).toBe('EMPREMTA_INCOMPLETA');
    expect(error.detalls).toEqual(['tractors/gestoria/fitxa.md']);
  });

  test('fonts no declarades, repetides o mal formades: EMPREMTA_INVALIDA', async () => {
    const extra = entrada();
    extra.fonts.push({ ruta: 'src/gestoria/amagat.js', contingut: 'x' });
    const repetida = entrada();
    repetida.fonts.push({ ruta: 'src/gestoria/full.js', contingut: FULL });
    const binaria = entrada();
    binaria.fonts[0] = { ruta: 'src/gestoria/lector.js', contingut: new Uint8Array([0xff, 0xfe, 0x00]) };
    for (const cas of [extra, repetida, binaria, entrada({ fonts: 'tot' })]) {
      expect((await errorDe(calculaEmpremta(cas, subtle))).codi).toBe('EMPREMTA_INVALIDA');
    }
  });

  test('manifest invàlid: EMPREMTA_INVALIDA amb els errors', async () => {
    const error = await errorDe(calculaEmpremta(entrada({ manifest: manifest({ id: 'X' }) }), subtle));
    expect(error.codi).toBe('EMPREMTA_INVALIDA');
    expect(error.detalls.length).toBeGreaterThan(0);
    expect((await errorDe(calculaEmpremta(undefined, subtle))).codi).toBe('EMPREMTA_INVALIDA');
  });
});

describe('normalitzaText', () => {
  test('lleva el BOM inicial i converteix CRLF', () => {
    expect(normalitzaText('﻿a\r\nb\r\n')).toBe('a\nb\n');
    expect(normalitzaText('a﻿b')).toBe('a﻿b');
  });
});

describe('empremtaCurta', () => {
  test('8 primers hex en majúscules, partits per un guió', () => {
    expect(empremtaCurta(`sha256:a3f91c2b${'0'.repeat(56)}`)).toBe('A3F9-1C2B');
  });

  test('rebutja empremtes mal formades', () => {
    for (const dolenta of ['a3f91c2b', `sha256:${'g'.repeat(64)}`, `SHA256:${'a'.repeat(64)}`, null]) {
      expect(() => empremtaCurta(dolenta)).toThrow(ErrorEmpremta);
    }
  });
});
