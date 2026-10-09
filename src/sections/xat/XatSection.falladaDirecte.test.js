// B03 · El text d'una fallada en obrir un directe: SDP-XAT-016 es diu en la
// llengua de la interfície (mai el codi cru); la resta d'errors, com sempre.
import { describe, expect, it } from 'vitest';
import { textDeFalladaDirecte } from './XatSection.jsx';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';

const RESERVA_CA = 'Esta persona no està disponible al xat.';

describe('textDeFalladaDirecte', () => {
  it('SDP-XAT-016 ix traduït a cada llengua i sense el codi', () => {
    const error = { code: 'SDP-XAT-016', message: RESERVA_CA };
    for (const { code } of SUPPORTED_LANGUAGES) {
      const t = createTranslator(code);
      const text = textDeFalladaDirecte(error, t);
      expect(text).toBe(t('section.xat.error.noDisponible'));
      expect(text).not.toMatch(/SDP-XAT/);
    }
    expect(textDeFalladaDirecte(error, createTranslator('ca'))).toBe(RESERVA_CA);
    expect(textDeFalladaDirecte(error, createTranslator('es'))).not.toBe(RESERVA_CA);
  });

  /* Onada 8 (261009, revisió) · SDP-XAT-004 ja té clau (noDelPoble): l'exemple
     d'un altre error passa a ser SDP-XAT-006. */
  it('un altre error conserva el seu missatge', () => {
    const t = createTranslator('ca');
    expect(textDeFalladaDirecte({ code: 'SDP-XAT-006', message: 'SDP-XAT-006: no.' }, t)).toBe('SDP-XAT-006: no.');
  });

  it('Onada 8 · SDP-XAT-004 ix traduït a cada llengua i sense el codi', () => {
    const error = { code: 'SDP-XAT-004', message: createTranslator('ca')('section.xat.error.noDelPoble') };
    for (const { code } of SUPPORTED_LANGUAGES) {
      const t = createTranslator(code);
      expect([code, textDeFalladaDirecte(error, t)]).toEqual([code, t('section.xat.error.noDelPoble')]);
      expect(textDeFalladaDirecte(error, t)).not.toMatch(/SDP-XAT/);
    }
  });

  it('sense missatge, el text genèric d’obrir la conversa', () => {
    const t = createTranslator('ca');
    expect(textDeFalladaDirecte(null, t)).toBe(t('section.xat.obrirError'));
    expect(textDeFalladaDirecte({}, t)).toBe(t('section.xat.obrirError'));
  });
});
