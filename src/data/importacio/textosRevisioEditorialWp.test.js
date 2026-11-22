import { expect, test } from 'vitest';
import { AVISOS_REVISIO_EDITORIAL_WP, avisDeRevisioEditorial } from './textosRevisioEditorialWp.js';

test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s distingix els sis rebuts sense inferir local de remot false', (language) => {
  const tx = AVISOS_REVISIO_EDITORIAL_WP[language];
  expect(Object.keys(tx)).toEqual(Object.keys(AVISOS_REVISIO_EDITORIAL_WP.ca));
  expect(new Set(Object.values(tx)).size).toBe(6);
  expect(avisDeRevisioEditorial({ remot: true, desatLocal: true }, { language })).toBe(tx.remot);
  expect(avisDeRevisioEditorial({ remot: true, desatLocal: false }, { language })).toBe(tx.remotSenseCopia);
  expect(avisDeRevisioEditorial({ remot: false, desatLocal: true }, { language })).toBe(tx.local);
  expect(avisDeRevisioEditorial({ remot: false }, { language })).toBe(tx.noDesada);
  expect(avisDeRevisioEditorial({ conflicte: true, desatLocal: true }, { language })).toBe(tx.conflicteLocal);
  expect(avisDeRevisioEditorial({ conflicte: true, desatLocal: false }, { language })).toBe(tx.conflicteSenseCopia);
});

test('reutilitza selecció de llengua del Perfil: etiqueta regional i traductor opcional', () => {
  expect(avisDeRevisioEditorial({}, { language: 'EN-gb' })).toBe(AVISOS_REVISIO_EDITORIAL_WP.en.noDesada);
  expect(avisDeRevisioEditorial({}, { t: () => 'Cerrar sesión' })).toBe(AVISOS_REVISIO_EDITORIAL_WP.es.noDesada);
});
