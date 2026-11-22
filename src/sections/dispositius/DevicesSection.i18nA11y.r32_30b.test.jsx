import { describe, expect, test } from 'vitest';
import { codiLlenguaDispositius, textosDispositiusA11y } from './i18nDispositiusA11y.js';

const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];

describe('Dispositius · i18n diferit d’accessibilitat en 5 llengües (Onada R32.30b)', () => {
  test('totes les claus de títol, subtítol, etiqueta i placeholder existixen en ca, es, en, eu i gl', () => {
    const claus = Object.keys(textosDispositiusA11y('ca'));
    expect(claus.length).toBeGreaterThanOrEqual(9);
    for (const codi of LLENGUES) {
      expect(codiLlenguaDispositius(codi)).toBe(codi);
      const tx = textosDispositiusA11y(codi);
      for (const clau of claus) {
        expect(typeof tx[clau], `${codi}.${clau}`).toBe('string');
        expect(tx[clau].trim().length, `${codi}.${clau}`).toBeGreaterThan(0);
        expect(tx[clau]).not.toContain('undefined');
      }
    }
    expect(codiLlenguaDispositius('fr-FR')).toBe('ca');
    expect(codiLlenguaDispositius('es-ES')).toBe('es');
  });

  test('conserva byte a byte els literals canònics en valencià (ca) i traduïx en es, en, eu i gl', () => {
    const ca = textosDispositiusA11y('ca');
    expect(ca.modePrivatTitle).toBe('Mode privat');
    expect(ca.modePublicTitle).toBe('Mode públic');
    expect(ca.nomDispositiuPlaceholder).toBe('Nom del dispositiu');
    expect(ca.missatgeDirectePlaceholder).toBe('Escriu un missatge directe...');

    expect(textosDispositiusA11y('es').missatgeDirectePlaceholder).toBe('Escribe un mensaje directo...');
    expect(textosDispositiusA11y('en').missatgeDirectePlaceholder).toBe('Write a direct message...');
    expect(textosDispositiusA11y('eu').missatgeDirectePlaceholder).toBe('Idatzi mezu zuzen bat...');
    expect(textosDispositiusA11y('gl').missatgeDirectePlaceholder).toBe('Escribe unha mensaxe directa...');
  });
});
