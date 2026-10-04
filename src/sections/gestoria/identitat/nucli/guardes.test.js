// @vitest-environment node
/* Identitat legal · les guardes comunes dels models purs. Totes les dades
   són sintètiques; les formes vetades es componen a trossos perquè cap
   porta les trobe escrites senceres. */
import { describe, expect, test } from 'vitest';
import {
  comprovaClaus, comprovaData, comprovaId, comprovaText, congela, esDataIso, esIdOpac, esSha256, idOpacDerivat, identificadorsDe, llancaSiCal
} from './guardes.js';

const tros = (...parts) => parts.join('');

describe('identificadorsDe', () => {
  test.each([
    ['DNI', tros('1234', '5678', 'Z')],
    ['DNI', tros('12.345', '.678-', 'Z')],
    ['NIE', tros('X', '1234567', 'L')],
    ['NIF_ENTITAT', tros('B', '1234567', '4')],
    ['IBAN', tros('ES91 ', '2100 0418 ', '4502 0005 1332')],
    ['COMPTE', tros('2100 0418 ', '45 ', '0200051332')],
    ['AFILIACIO', tros('28/', '1234', '5678/', '90')],
    ['TARGETA', tros('4000 ', '0000 ', '0000 ', '0002')],
    ['TELEFON', tros('600 ', '000 ', '000')],
    ['CORREU', tros('persona', '@', 'exemple.invalid')]
  ])('troba la forma %s', (forma, text) => {
    expect(identificadorsDe(`Text de prova amb ${text} al mig`)).toContain(forma);
  });

  test('també dins d’un id, amagada entre guions baixos', () => {
    expect(identificadorsDe(tros('tit_', '1234', '5678', 'z'))).toContain('DNI');
  });

  /* Entre una lletra i una xifra no hi ha frontera de paraula: estes formes
     s'escapaven quan els patrons demanaven \b davant. */
  test.each([
    ['DNI', tros('dni', '1234', '5678', 'Z')],
    ['DNI', tros('Joan', '1234', '5678', 'Z')],
    ['DNI', tros('ref', '1234', '5678', 'z', 'copia')],
    ['NIE', tros('nie', 'X', '1234567', 'L')],
    ['NIF_ENTITAT', tros('cif', 'B', '1234567', '4')],
    ['IBAN', tros('cta', 'ES91', '2100', '0418', '4502', '0005', '1332')],
    ['COMPTE', tros('ccc', '2100', '0418', '45', '0200051332')],
    ['AFILIACIO', tros('naf', '28', '1234', '5678', '90')],
    ['TARGETA', tros('targeta', '4000', '0000', '0000', '0002')],
    ['TELEFON', tros('+34', '600', '000', '000')],
    ['TELEFON', tros('tel', '600', '000', '000')]
  ])('troba la forma %s compacta o amb lletres enganxades davant', (forma, text) => {
    expect(identificadorsDe(text)).toContain(forma);
    expect(identificadorsDe(`Text de prova amb ${text} al mig`)).toContain(forma);
  });

  test('un número més llarg no es pren per un altre: les vores numèriques continuen valent', () => {
    // Nou xifres que no comencen per 6-9, i vint-i-una xifres seguides, no són cap forma.
    expect(identificadorsDe(tros('ref ', '1234', '5678', '9'))).toEqual([]);
    expect(identificadorsDe(tros('2100', '0418', '4502', '0005', '1332', '9'))).toEqual([]);
  });

  test.each([
    'Activitat de prova 2026', '2026-04-20', 'Model 303 del 3T', 'tit_prova_persona', 'Bo digital de prova', 'IBI i vehicles', ''
  ])('no veu res en «%s»', (text) => {
    expect(identificadorsDe(text)).toEqual([]);
  });

  test('un valor que no és un text no porta res', () => {
    expect(identificadorsDe(null)).toEqual([]);
    expect(identificadorsDe(42)).toEqual([]);
  });
});

describe('ids, dates i empremtes', () => {
  test('un id opac: minúscules, xifres, «_» i «-», de 4 a 96 caràcters', () => {
    expect(esIdOpac('tit_prova_persona')).toBe(true);
    expect(esIdOpac('doc-2026-001')).toBe(true);
    expect(esIdOpac('Tit_prova')).toBe(false);
    expect(esIdOpac('tit')).toBe(false);
    expect(esIdOpac('tit prova')).toBe(false);
    expect(esIdOpac('1tit')).toBe(false);
    expect(esIdOpac(`t${'a'.repeat(96)}`)).toBe(false);
    expect(esIdOpac(tros('tit-', '1234', '5678', 'z'))).toBe(false);
  });

  test('un id amb una forma enganxada a les lletres tampoc és opac', () => {
    for (const id of [
      tros('dni', '1234', '5678', 'z'), tros('ref', '1234', '5678', 'z'), tros('cta', 'es91', '2100', '0418', '4502', '0005', '1332'),
      tros('tel', '600', '000', '000'), tros('doc', '4000', '0000', '0000', '0002')
    ]) {
      expect(esIdOpac(id), id).toBe(false);
    }
  });

  test('idOpacDerivat: curt, estable, només de lletres i sempre opac', () => {
    const clau = `exp_${'a'.repeat(92)}:${'b'.repeat(96)}`;
    const id = idOpacDerivat('texp', clau);
    expect(id).toMatch(/^texp_[a-p]{16}$/);
    expect(idOpacDerivat('texp', clau)).toBe(id);
    expect(idOpacDerivat('texp', `${clau}x`)).not.toBe(id);
    expect(esIdOpac(id)).toBe(true);
    expect(() => idOpacDerivat('t1', 'x')).toThrow(TypeError);
    expect(() => idOpacDerivat('texp', '')).toThrow(TypeError);
  });

  test('una data ISO ha d’existir al calendari', () => {
    expect(esDataIso('2024-02-29')).toBe(true);
    expect(esDataIso('2026-02-29')).toBe(false);
    expect(esDataIso('2026-4-20')).toBe(false);
    expect(esDataIso('20/04/2026')).toBe(false);
  });

  test('una empremta SHA-256 són 64 xifres hexadecimals', () => {
    expect(esSha256('ab'.repeat(32))).toBe(true);
    expect(esSha256('AB'.repeat(32))).toBe(true);
    expect(esSha256('ab'.repeat(31))).toBe(false);
    expect(esSha256('zz'.repeat(32))).toBe(false);
  });
});

describe('les comprovacions afigen errors amb codi', () => {
  test('comprovaText: obligatori, llargària, control i identificadors', () => {
    const errors = [];
    expect(comprovaText('  Activitat de prova  ', 'alies', errors, { obligatori: true })).toBe('Activitat de prova');
    comprovaText('', 'alies', errors, { obligatori: true });
    comprovaText('x'.repeat(10), 'alies', errors, { maxim: 5 });
    comprovaText('dues\nlínies', 'alies', errors);
    comprovaText(tros('Activitat ', 'X', '1234567', 'L'), 'alies', errors);
    comprovaText(7, 'alies', errors);
    comprovaText(tros('Joan', '1234', '5678', 'Z'), 'alies', errors);
    expect(errors.map((e) => e.codi)).toEqual(['CAMP_OBLIGATORI', 'TEXT_MASSA_LLARG', 'TEXT_INVALID', 'IDENTIFICADOR_PERSONAL', 'TEXT_INVALID', 'IDENTIFICADOR_PERSONAL']);
  });

  test('comprovaId, comprovaData i comprovaClaus', () => {
    const errors = [];
    expect(comprovaId('tit_prova', 'id', errors)).toBe('tit_prova');
    expect(comprovaId(undefined, 'id', errors, { obligatori: false })).toBeNull();
    comprovaId('NO VAL', 'id', errors);
    expect(comprovaData('2026-04-20', 'data', errors)).toBe('2026-04-20');
    expect(comprovaData(null, 'data', errors)).toBeNull();
    comprovaData(null, 'data', errors, { obligatori: true });
    comprovaData('2026-13-01', 'data', errors);
    comprovaClaus({ id: 'x', nif: 'x' }, ['id'], 'titular', errors);
    expect(errors.map((e) => e.codi)).toEqual(['ID_INVALID', 'CAMP_OBLIGATORI', 'DATA_INVALIDA', 'CAMP_DESCONEGUT']);
    expect(errors[3].camp).toBe('titular.nif');
  });

  test('llancaSiCal porta el codi i els detalls; sense errors no fa res', () => {
    expect(() => llancaSiCal([], 'X', 'res')).not.toThrow();
    let error;
    try { llancaSiCal([{ codi: 'A', camp: 'a', missatge: 'Falta a.' }], 'MODEL_INVALID', 'No val'); } catch (e) { error = e; }
    expect(error.codi).toBe('MODEL_INVALID');
    expect(error.message).toBe('No val: Falta a.');
    expect(error.detalls).toHaveLength(1);
  });

  test('congela en profunditat', () => {
    const valor = congela({ a: { b: [1, { c: 2 }] } });
    expect(Object.isFrozen(valor.a.b[1])).toBe(true);
  });
});
