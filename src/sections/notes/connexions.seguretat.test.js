/**
 * Auditoria de seguretat 261019 (R4) · cosDeConnexioEditadaPerAlMur mira si el
 * cos nomena l'autor amb el text visible de l'HTML, que ara lleva les etiquetes
 * en temps lineal (contentHelpers.js · llevaEtiquetes). La decisió és la
 * mateixa que amb /<[^>]*>/g, i un cos de molts '<' i cap '>' ja no congela
 * el compartir.
 */
import { describe, expect, test } from 'vitest';
import { cosDeConnexioEditadaPerAlMur, cosDeConnexioPerAlMur } from './connexions.js';

const ORIGEN = { tipus: 'connexio', sectionId: 'mercat', itemId: 'x', titol: 'X', autorNom: 'Na Pepa', ruta: '/mercat/x' };
const ENLLAC = '<a href="/mercat/x">';

/* La decisió d'abans, només com a oracle de la prova. Els textos de la prova
   no porten cap '&', i les entitats no hi fan res. */
const nomenaLAutorDAbans = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  .toLocaleLowerCase('ca').includes('na pepa');

/* Un generador determinista (LCG): la mateixa sèrie en cada execució. */
function generador(llavor) {
  let estat = llavor >>> 0;
  return (maxim) => {
    estat = (Math.imul(estat, 1664525) + 1013904223) >>> 0;
    return estat % maxim;
  };
}

function textsAleatoris(trossos, quantitat, llargariaMaxima, llavor) {
  const atzar = generador(llavor);
  return Array.from({ length: quantitat }, () => {
    const llargaria = atzar(llargariaMaxima + 1);
    let text = '';
    for (let i = 0; i < llargaria; i += 1) text += trossos[atzar(trossos.length)];
    return text;
  });
}

describe('cosDeConnexioEditadaPerAlMur', () => {
  test('decidix el mateix que amb l’expressió d’abans en milers de cossos aleatoris', () => {
    const trossos = ['<', '>', 'Na', 'na', ' ', '\n', 'Pepa', 'PEPA', '<b>', '</b>', 'Na Pepa', 'x', '"', '<i'];
    for (const resta of textsAleatoris(trossos, 4000, 16, 20261019)) {
      const html = `${ENLLAC}${resta}`;
      const esperat = nomenaLAutorDAbans(html) ? html : `${html}${cosDeConnexioPerAlMur(ORIGEN)}`;
      expect(cosDeConnexioEditadaPerAlMur(html, ORIGEN)).toBe(esperat);
    }
  });

  test('un cos de molts < i cap > es resol en temps lineal', () => {
    const html = `${ENLLAC}${'<'.repeat(160000)}`;
    const inici = performance.now();
    expect(cosDeConnexioEditadaPerAlMur(html, ORIGEN)).toBe(`${html}${cosDeConnexioPerAlMur(ORIGEN)}`);
    expect(performance.now() - inici).toBeLessThan(1000);
  });
});
