// @vitest-environment node
/* v1.2.23 · Carril T (ordre del Mestre 261123) · Verificador de K3 · avisRevisioDesada (publicacioEditable.js)
   amb seccio 'sistema' llig el text del diccionari diferit de les Notes (i18nEdicioSistema.js, +0 B a
   pesDelNucli), no el traductor: la llengua és la que passa qui crida (PublicacioEditable.jsx), i un `t` que
   diga una altra cosa no hi pinta res. Cap prova ho fixava. Les altres seccions continuen passant pel traductor
   (section.notes.publicacio.revisioDesada) o, sense, per la reserva valenciana. */
import { describe, expect, test } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../config/i18n.js';
import { avisRevisioDesada } from './publicacioEditable.js';

const SISTEMA = Object.freeze({
  ca: 'Pàgina del sistema actualitzada en este navegador: els canvis ja són visibles.',
  es: 'Página del sistema actualizada en este navegador: los cambios ya son visibles.',
  en: 'System page updated in this browser: changes are now visible.',
  eu: 'Sistemaren orria eguneratu da nabigatzaile honetan: aldaketak ikusgai daude jada.',
  gl: 'Páxina do sistema actualizada neste navegador: os cambios xa son visibles.',
});
const MUR_CA = 'Revisió desada en este navegador: el Mur i la pàgina ja la mostren.';
const MUR_EN = 'Revision saved in this browser: the Wall and the page already show it.';

describe('avisRevisioDesada · seccio «sistema»', () => {
  test('ca: el text de Sistema, amb traductor o sense', () => {
    expect(avisRevisioDesada(null, 'sistema', 'ca')).toBe(SISTEMA.ca);
    expect(avisRevisioDesada(createTranslator('ca'), 'sistema', 'ca')).toBe(SISTEMA.ca);
    expect(avisRevisioDesada(null, 'sistema')).toBe(SISTEMA.ca);
  });

  test('en: el text de Sistema en anglés, encara que el traductor siga valencià o diga una altra cosa', () => {
    expect(avisRevisioDesada(null, 'sistema', 'en')).toBe(SISTEMA.en);
    expect(avisRevisioDesada(createTranslator('ca'), 'sistema', 'en')).toBe(SISTEMA.en);
    expect(avisRevisioDesada(() => 'cap', 'sistema', 'en')).toBe(SISTEMA.en);
    expect(avisRevisioDesada(null, 'sistema', 'en-GB')).toBe(SISTEMA.en);
  });

  test.each(Object.keys(SISTEMA))('%s: el text exacte de la seua llengua, i mai el del Mur', (llengua) => {
    const avis = avisRevisioDesada(createTranslator(llengua), 'sistema', llengua);
    expect(avis).toBe(SISTEMA[llengua]);
    expect([MUR_CA, MUR_EN]).not.toContain(avis);
  });

  test('una llengua desconeguda parla valencià', () => {
    expect(avisRevisioDesada(null, 'sistema', 'fr')).toBe(SISTEMA.ca);
  });

  test('les altres seccions continuen amb el traductor (o la reserva valenciana), no amb el text de Sistema', () => {
    expect(avisRevisioDesada(null, 'mur', 'en')).toBe(MUR_CA);
    expect(avisRevisioDesada(createTranslator('en'), 'mur', 'en')).toBe(MUR_EN);
    expect(avisRevisioDesada(createTranslator('en'))).toBe(MUR_EN);
  });
});
