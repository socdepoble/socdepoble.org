// @vitest-environment node
/* Contracte SDPH de disseny_final_e2ee.md §5.6.3 i §21: una sola representació
   entre Formats i Recuperacio, amb k=3 fix i sense N. Dades sintètiques.
   El vector literal es concatena independentment dels dos serialitzadors. */
import { describe, expect, test } from 'vitest';
import * as F from './xifratXatFormats.js';
import * as R from './xifratXatRecuperacio.js';

const usuari = '0a0a0a0a-0000-4000-8000-00000000000a';
const repartiment = '5a5a5a5a-0000-4000-8000-00000000005a';
const amic = '0b0b0b0b-0000-4000-8000-00000000000b';
const kid = Uint8Array.from({ length: 16 }, (_, i) => 0x10 + i);
const kidAmic = Uint8Array.from({ length: 16 }, (_, i) => 0x20 + i);
const valors = () => ({ usuari, kid: kid.slice(), repartiment, x: 1, llindar: 3, amic, kidAmic: kidAmic.slice() });
const uuidHex = (v) => v.replaceAll('-', '');
const hex = (bytes) => Buffer.from(bytes).toString('hex');
const literal = () => Uint8Array.from(Buffer.from(
  '5344504801' + uuidHex(usuari) + hex(kid) + uuidHex(repartiment) + '0103' + uuidHex(amic) + hex(kidAmic), 'hex'
));
const invalid = (motiu, camp) => expect.objectContaining({ codi: 'FORMAT_INVALID', motiu, ...(camp ? { camp } : {}) });

describe('SDPH: interoperabilitat estricta de Formats i Recuperacio', () => {
  test('control: Recuperacio produïx els 87 B literals del contracte', () => {
    expect(literal()).toHaveLength(87);
    expect(R.construeixInfoAval(valors())).toEqual(literal());
    expect(R.llegixInfoAval(literal())).toEqual(valors());
  });

  test('Formats produïx exactament els mateixos 87 B, sense total', () => {
    expect(F.MIDES.infoFragment).toBe(87);
    expect(F.construeixInfoFragment(valors())).toEqual(literal());
  });

  test('els dos lectors accepten els bytes de l’altre constructor', () => {
    expect(F.llegixInfoFragment(R.construeixInfoAval(valors()))).toEqual(valors());
    expect(R.llegixInfoAval(F.construeixInfoFragment(valors()))).toEqual(valors());
  });

  test.each([2, 4, 255])('Formats rebutja llindar %i: k és exactament 3', (llindar) => {
    expect(() => F.construeixInfoFragment({ ...valors(), llindar })).toThrow(invalid('rang', 'llindar'));
  });

  test.each([2, 4, 255])('els dos lectors rebutgen k=%i en els bytes rebuts', (llindar) => {
    const bytes = literal();
    bytes[54] = llindar;
    expect(() => F.llegixInfoFragment(bytes)).toThrow(invalid('rang', 'llindar'));
    expect(() => R.llegixInfoAval(bytes)).toThrow(invalid('rang', 'llindar'));
  });

  test('total és un camp desconegut; no es descarta silenciosament', () => {
    expect(() => F.construeixInfoFragment({ ...valors(), total: 5 })).toThrow(invalid('desconegut', 'total'));
  });

  test('el vector anterior de 88 B es rebutja, sense autodetectar una altra versió', () => {
    const antic = new Uint8Array(88);
    antic.set(literal().subarray(0, 55));
    antic[55] = 5;
    antic.set(literal().subarray(55), 56);
    expect(() => F.llegixInfoFragment(antic)).toThrow(invalid('sobrants'));
    expect(() => R.llegixInfoAval(antic)).toThrow(invalid('sobrants'));
  });

  test.each([1, 255])('l’índex x=%i conserva els desplaçaments d’amic i kidAmic', (x) => {
    const bytes = F.construeixInfoFragment({ ...valors(), x });
    expect(bytes).toHaveLength(87);
    expect(bytes[53]).toBe(x);
    expect(bytes[54]).toBe(3);
    expect(hex(bytes.subarray(55, 71))).toBe(uuidHex(amic));
    expect(hex(bytes.subarray(71, 87))).toBe(hex(kidAmic));
    expect(R.llegixInfoAval(bytes)).toEqual({ ...valors(), x });
  });
});
