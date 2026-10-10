/* Onada 6 (decisió 5) · Els codis SDP que l'adaptador ja diu en valencià
   (MISSATGES_SDP_HUMANS) es diuen en la llengua de la interfície pel codi:
   ningú no veu «SDP-XAT-…». La resta d'errors, el seu missatge. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CLAUS_ERROR_SDP, textDErrorDelXat, textDeFalladaDirecte } from './errorsXat.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';

/* Onada 6 (verificació, 261009) · El text de l'adaptador es llig del disc,
   com les altres proves de qualitat (qualitat.carregaMes.test.js): un import
   de src/data/supabase/ des de fora, encara que siga `?raw`, és una
   infracció E1 de la Porta Enxufe (tooling/gates/tractor-enxufe.mjs). */
const fontAdaptadorXat = readFileSync(path.join(process.cwd(), 'src/data/supabase/xat.js'), 'utf8');

const ca = createTranslator('ca');

describe('textDErrorDelXat', () => {
  it('cada codi amb clau ix traduït a les cinc llengües i sense el codi', () => {
    /* Onada 8 (261009) · SDP-XAT-002 (cap xat amb tu mateix) i SDP-XAT-004
       (no és d'este poble, revisió) també tenen text humà.
       Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
       SDP-XAT-003 i SDP-XAT-004 diuen «Foraster»; les claus són les mateixes. */
    expect(Object.keys(CLAUS_ERROR_SDP).sort()).toEqual(['SDP-XAT-002', 'SDP-XAT-003', 'SDP-XAT-004', 'SDP-XAT-013', 'SDP-XAT-016', 'SDP-XAT-429']);
    for (const [codi, clau] of Object.entries(CLAUS_ERROR_SDP)) {
      const error = { code: codi, message: ca(clau) };
      for (const { code } of SUPPORTED_LANGUAGES) {
        const t = createTranslator(code);
        expect([codi, code, textDErrorDelXat(error, t)]).toEqual([codi, code, t(clau)]);
        expect(textDErrorDelXat(error, t)).not.toMatch(/SDP-XAT/);
      }
    }
  });

  it('la reserva de l’adaptador és el valor valencià de la clau (les dues formes no es desfasen)', () => {
    for (const [codi, clau] of Object.entries(CLAUS_ERROR_SDP)) {
      expect([codi, fontAdaptadorXat.includes(`'${codi}': '${ca(clau)}'`)]).toEqual([codi, true]);
    }
  });

  it('un error sense clau conserva el missatge; sense res, la reserva', () => {
    expect(textDErrorDelXat({ code: 'SDP-XAT-011', message: 'SDP-XAT-011: no.' }, ca, 'x')).toBe('SDP-XAT-011: no.');
    expect(textDErrorDelXat({ code: 'XARXA', message: '' }, ca, 'reserva')).toBe('reserva');
    expect(textDErrorDelXat(null, ca, 'reserva')).toBe('reserva');
    /* Un codi heretat de l'objecte no és cap clau. */
    expect(textDErrorDelXat({ code: 'toString', message: 'm' }, ca)).toBe('m');
  });

  it('textDeFalladaDirecte: el 429 també, i sense missatge el text genèric d’obrir', () => {
    const es = createTranslator('es');
    expect(textDeFalladaDirecte({ code: 'SDP-XAT-429', message: ca('section.xat.error.massaMissatges') }, es)).toBe(es('section.xat.error.massaMissatges'));
    expect(textDeFalladaDirecte({}, ca)).toBe(ca('section.xat.obrirError'));
  });
});
