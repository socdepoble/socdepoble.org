/* Gauntlet 261029 (cicle 1) · El suport sense React del Gestor d'arxius
   locals: nomVisibleLocal (cap control de direcció del text a la vista),
   dataCurtaLocal i canviaElDisc, i el títol de la nota que s'envia al Bloc de
   Notes (notaDelFitxerLocal), que tampoc no en porta. */
import { describe, expect, test } from 'vitest';
import { SIMBOL_INVISIBLE_LOCAL, canviaElDisc, dataCurtaLocal, nomVisibleLocal } from './suportGestorLocal.js';
import { notaDelFitxerLocal } from './notaDelFitxerLocal.js';

describe('nomVisibleLocal', () => {
  test('els controls de direcció del text i els invisibles es veuen com a «�»', () => {
    expect(SIMBOL_INVISIBLE_LOCAL).toBe('�');
    expect(nomVisibleLocal('RTL_‮gnp.md')).toBe('RTL_�gnp.md');
    for (const cp of [0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069, 0x200e, 0x200f, 0x061c, 0x07, 0x1b, 0x7f, 0x85]) {
      expect(nomVisibleLocal(`a${String.fromCodePoint(cp)}b`), cp.toString(16)).toBe('a�b');
    }
  });

  test('un nom normal (accents, emojis, espais) torna igual, i el que no és text, com a text', () => {
    for (const nom of ['nota.md', 'Festa de Tibi · 2026.png', 'àèéíòóú ç l·l', 'foto 📷.jpg', '00_inbox/sub carpeta']) {
      expect(nomVisibleLocal(nom)).toBe(nom);
    }
    expect(nomVisibleLocal(null)).toBe('');
    expect(nomVisibleLocal(42)).toBe('42');
  });

  test('el títol de la nota feta des d’un fitxer amb U+202E tampoc el porta', () => {
    expect(notaDelFitxerLocal({ nom: 'RTL_‮gnp.txt', text: 'hola' }).title).toBe('RTL_�gnp');
    expect(notaDelFitxerLocal({ nom: 'RTL_‮gnp.md', text: 'sense títol' }).title).toBe('RTL_�gnp');
  });
});

describe('dataCurtaLocal i canviaElDisc', () => {
  test('dd/mm/aaaa hh:mm, o «—» sense data', () => {
    expect(dataCurtaLocal(new Date(2026, 9, 29, 7, 5).getTime())).toBe('29/10/2026 07:05');
    expect(dataCurtaLocal(0)).toBe('—');
    expect(dataCurtaLocal('x')).toBe('—');
  });

  test('les fallades que poden haver canviat el disc', () => {
    expect(canviaElDisc({ codi: 'MOVIMENT_INCOMPLET' })).toBe(true);
    expect(canviaElDisc({ codi: 'ORIGINAL_NO_MOGUT' })).toBe(true);
    expect(canviaElDisc({ codi: 'CONFLICTE_DISC', detall: { copiaConservada: 'a/b.png' } })).toBe(true);
    expect(canviaElDisc({ codi: 'CONFLICTE_DISC' })).toBe(false);
    expect(canviaElDisc(null)).toBe(false);
  });
});
