import { describe, expect, test } from 'vitest';
import { ajudaPreferenciaMur, estatHonestNota, TEXTOS_HONESTEDAT_DESAT, textosHonestedatDesat } from './honestedatDesat.js';

for (const idioma of ['ca', 'es', 'en', 'eu', 'gl']) describe(`DOL-54 · honestedat ${idioma}`, () => {
  const t = TEXTOS_HONESTEDAT_DESAT[idioma];
  test('els cinc diccionaris tenen el mateix contracte complet', () => {
    expect(Object.keys(t)).toEqual(Object.keys(TEXTOS_HONESTEDAT_DESAT.ca));
    expect(Object.values(t).every(v => typeof v === 'string' && v.length > 15)).toBe(true);
  });
  test('una creació pendent o fallida mai es presenta confirmada', () => {
    expect(estatHonestNota({ preparada: true }, idioma)).toBe(t.preparada);
    expect(estatHonestNota({ preparada: true, creacio: { estat: 'enviant' } }, idioma)).toBe(t.creant);
    expect(estatHonestNota({ preparada: true, creacio: { estat: 'error' } }, idioma)).toBe(t.fallida);
  });
  test('la còpia local no es confon amb el privat remot ni amb el Mur', () => {
    expect(estatHonestNota({ local: true, publicada: true }, idioma)).toBe(t.local);
    expect(estatHonestNota({ desament: { estat: 'net' } }, idioma)).toBe(t.privada);
    for (const estat of ['pendent', 'enviant', 'error', 'sessio']) {
      expect(estatHonestNota({ desament: { estat } }, idioma)).toBe(t.pendent);
      expect(estatHonestNota({ desament: { estat, pestanya: true } }, idioma)).toBe(t.pestanya);
      expect(estatHonestNota({ publicada: true, desament: { estat, pestanya: true } }, idioma)).toBe(`${t.publicada} ${t.pestanya}`);
    }
    expect(estatHonestNota({ publicada: true, desament: { estat: 'net' } }, idioma)).toBe(t.publicada);
  });
  /* v1.2.20 · Gauntlet R1 (L2-04) · Una creació aturada ('pendent', després d'un AbortError) no és cap creació en vol. */
  test('una creació aturada no es pinta com una creació en camí', () => {
    expect(estatHonestNota({ preparada: true, creacio: { estat: 'pendent' } }, idioma)).toBe(t.creacioPendent);
    expect(t.creacioPendent).not.toBe(t.creant);
  });
  /* v1.2.20 · Gauntlet R1 (L2-01) · Un embolcall que només guarda en memòria no anuncia cap desat, ni local ni remot. */
  test('un editor que només guarda en memòria no diu cap desat', () => {
    for (const entrada of [{}, { publicada: true }, { local: true }, { desament: { estat: 'net' } }, { publicada: true, desament: { estat: 'pendent', pestanya: true } }]) {
      expect(estatHonestNota({ ...entrada, memoria: true }, idioma)).toBe(t.memoria);
    }
    expect([t.privada, t.publicada, t.local].includes(t.memoria)).toBe(false);
  });
  /* v1.2.20 · Gauntlet R1 (L2-05) · L'ajuda només nomena els botons que hi ha i diu quan no es pot publicar. */
  test('l’ajuda de l’aparador només remet als botons que existixen', () => {
    const omple = (plantilla, boto) => plantilla.replace('{boto}', boto);
    expect(ajudaPreferenciaMur({ publicar: 'P' }, idioma)).toBe(`${t.preferencia} ${omple(t.preferenciaAplica, 'P')}`);
    expect(ajudaPreferenciaMur({ publicar: 'A', retirar: 'R' }, idioma))
      .toBe(`${t.preferencia} ${omple(t.preferenciaAplica, 'A')} ${omple(t.preferenciaRetira, 'R')}`);
    expect(ajudaPreferenciaMur({}, idioma)).toBe(`${t.preferencia} ${t.preferenciaBloquejada}`);
    for (const ajuda of [ajudaPreferenciaMur({ publicar: 'P' }, idioma), ajudaPreferenciaMur({}, idioma)]) expect(ajuda).not.toContain('{boto}');
  });
});
test('una llengua desconeguda conserva la reserva valenciana', () => expect(textosHonestedatDesat('xx')).toBe(TEXTOS_HONESTEDAT_DESAT.ca));

/* v1.2.20 · Gauntlet R1 (L2-05) · En valencià, amb els botons de veres, la frase de sempre; sense retirada, cap «Retirar del Mur». */
test('en valencià, l’ajuda diu el botó real i calla el que no hi és', () => {
  expect(ajudaPreferenciaMur({ publicar: 'Actualitzar al Mur', retirar: 'Retirar del Mur' }))
    .toBe('És la preferència per a la pròxima publicació. Per a aplicar-la, confirma «Actualitzar al Mur». Per a retirar una publicació, usa «Retirar del Mur».');
  expect(ajudaPreferenciaMur({ publicar: 'Publicar al Mercat' })).toBe('És la preferència per a la pròxima publicació. Per a aplicar-la, confirma «Publicar al Mercat».');
  expect(ajudaPreferenciaMur({ publicar: null })).not.toContain('confirma');
});
