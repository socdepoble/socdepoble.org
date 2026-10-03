// @vitest-environment node
/* Les peces comunes dels sentinelles: el text d'un fitxer triat es llig amb
   la mateixa política que la Gestoria (gestoria/nucli/csv.js): UTF-8, UTF-16LE
   amb el seu BOM, o windows-1252 si no és UTF-8 vàlid. Els textos són
   inventats. */
import { describe, expect, test } from 'vitest';
import { textDe } from './comu.js';

const BOM = String.fromCharCode(0xfeff);
const FRASE = 'Ferretería Sintètica, número 1';
/* windows-1252 i latin-1 coincidixen per a estes lletres: un byte per caràcter. */
const windows1252 = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const utf16le = (text) => Uint8Array.from([0xff, 0xfe, ...[...text].flatMap((c) => [c.charCodeAt(0) & 0xff, c.charCodeAt(0) >> 8])]);
const utf8 = (text) => new TextEncoder().encode(text);

describe('textDe', () => {
  test('UTF-8, amb BOM o sense', () => {
    expect(textDe(utf8(FRASE))).toBe(FRASE);
    expect(textDe(utf8(`${BOM}${FRASE}`))).toBe(FRASE);
    expect(textDe(utf8(FRASE).buffer)).toBe(FRASE);
  });

  test('windows-1252 (el que desa Excel a Windows): els accents no es perden', () => {
    const text = textDe(windows1252(FRASE));
    expect(text).toBe(FRASE);
    expect(text).not.toContain(String.fromCharCode(0xfffd));
  });

  test('UTF-16LE amb el seu BOM: cap caràcter nul entre lletres', () => {
    const text = textDe(utf16le(FRASE));
    expect(text).toBe(FRASE);
    expect(text).not.toContain(String.fromCharCode(0));
  });

  test('un text ja descodificat només perd el BOM', () => {
    expect(textDe(`${BOM}${FRASE}`)).toBe(FRASE);
  });

  test('ni text ni bytes: ENTRADA_INVALIDA', () => {
    expect(() => textDe(42)).toThrow(expect.objectContaining({ codi: 'ENTRADA_INVALIDA' }));
  });
});
