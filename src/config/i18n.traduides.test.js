// @vitest-environment node
/* IDEA-57 L1 (P1-22; Gauntlet 261029, cicle 1, àrea i18n-a11y) · Una clau en
   ús pot ser a les cinc llengües (LLEI_07 i i18n.usades.test.js en verd) i,
   tot i així, dir el text en valencià: «Estira per actualitzar» eixia en
   anglés, castellà, basc i gallec. Cap porta no ho mesurava.
     1. La llista tancada de les 14 claus que estaven així (47 cadenes): cap
        torna a ser el valor valencià.
     2. Una guarda general per a l'anglés: cap text de dues paraules o més
        (sense comptar els marcadors {nom}) idèntic al valencià, fora dels noms
        propis i de canal que s'escriuen igual. */
import { describe, expect, test } from 'vitest';
import CA from './idiomes/ca.js';
import ES from './idiomes/es.js';
import EN from './idiomes/en.js';
import EU from './idiomes/eu.js';
import GL from './idiomes/gl.js';

const DICCIONARIS = { es: ES, en: EN, eu: EU, gl: GL };
const COMUNES = [
  'pull.release', 'pull.pull', 'pull.refreshing',
  'section.poblacio.title', 'section.poblacio.subtitle', 'section.poblacio.lead',
  'section.pobles.wikipedia_link', 'section.pobles.noResults', 'section.pobles.loading', 'section.pobles.error'
];
const TRADUIDES = {
  es: COMUNES,
  en: COMUNES,
  eu: [...COMUNES, 'section.control.title', 'section.control.subtitle', 'nav.dispositius'],
  /* nav.gestoria en basc («Gestoria») es deixa per a la revisió nadiua. */
  gl: [...COMUNES, 'section.control.title', 'section.control.subtitle', 'nav.dispositius', 'nav.gestoria']
};

/* Noms propis, de canal o de persona: s'escriuen igual en anglés. */
const NOMS_PROPIS = new Set([
  'nav.iaiaFitxa', 'nav.wikidepoble', 'section.detail.mur.author', 'section.detail.mur.town', 'section.gestoria.meta1',
  'section.xat.avisNatiu.titol', 'section.xat.poble.previa', 'section.xat.pagina.participant'
]);
const paraules = (text) => String(text).replace(/\{\w+\}/g, ' ').split(/\s+/).filter((tros) => /\p{L}/u.test(tros)).length;

describe('les claus en ús, traduïdes', () => {
  test('la llista tancada té les 47 cadenes', () => {
    expect(Object.values(TRADUIDES).reduce((suma, llista) => suma + llista.length, 0)).toBe(47);
  });

  test.each(Object.keys(TRADUIDES))('%s: cap clau de la llista no és el valor valencià', (codi) => {
    const iguals = TRADUIDES[codi].filter((clau) => {
      expect([codi, clau, typeof DICCIONARIS[codi][clau]]).toEqual([codi, clau, 'string']);
      return DICCIONARIS[codi][clau] === CA[clau];
    });
    expect(iguals).toEqual([]);
  });

  test('en: cap text de dues paraules o més idèntic al valencià, fora dels noms propis', () => {
    const iguals = Object.keys(EN).filter((clau) => !NOMS_PROPIS.has(clau)
      && typeof EN[clau] === 'string' && EN[clau] === CA[clau] && paraules(EN[clau]) >= 2);
    expect(iguals).toEqual([]);
  });
});
