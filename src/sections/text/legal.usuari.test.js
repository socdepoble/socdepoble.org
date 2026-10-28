// @vitest-environment node
/* P1-68 (decisió del Mestre 261028: «línia nova a l'avís legal §13») · El
   text legal diu el mateix que perfil_public (2610282100): l'identificador
   només es veu si el perfil és públic, i durant la baixa no es mostra però es
   reté. L'empremta nova de PAGE_COPY.legal l'aprova el Mestre (frontissa). */
import { expect, test } from 'vitest';
import { legalContent } from './legalContent.js';

const apartat13 = () => {
  const html = legalContent.html;
  const inici = html.indexOf('<h4>13. Qui pot veure el que publiques</h4>');
  const fi = html.indexOf('<h4>14.', inici);
  expect(inici).toBeGreaterThan(0);
  expect(fi).toBeGreaterThan(inici);
  return html.slice(inici, fi);
};

test('§13: l’identificador, només amb el perfil públic, i amagat però retingut durant la baixa', () => {
  const text = apartat13();
  expect(text).toContain('El teu <strong>identificador</strong>');
  expect(text).toContain('<strong>només el veuen les altres persones si el teu perfil és públic</strong>');
  expect(text).toContain('Mentre la baixa està en curs no es mostra enlloc');
  /* El nom i la imatge per als membres del poble, com sempre i en primer lloc. */
  expect(text.indexOf('nom o pseudònim')).toBeLessThan(text.indexOf('identificador'));
});
