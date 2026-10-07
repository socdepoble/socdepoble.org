/**
 * Ordre del Mestre (261007) · Les pàgines del sistema que el Mur barreja amb
 * les publicacions (SYSTEM_PAGES) i la ruta on porta el copyright de totes
 * les targetes i capçaleres (RUTA_DRETS_AUTOR).
 *
 *  · «Drets d'autor» és una entrada més: /page/drets-autor (PageDetailSection,
 *    sense ruta nova ni component propi), sense acció gran.
 *  · Cada pàgina declarada té el seu copy a PAGE_COPY: una absent el Mur la
 *    descartaria en silenci (incident del 24-09) i la frontissa de contingut
 *    fallaria.
 */
import { describe, expect, test } from 'vitest';
import { RUTA_DRETS_AUTOR, SYSTEM_PAGES, accioDeLaPagina } from './systemPages.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { resolvePageSlugPath } from './navigation.js';

describe('SYSTEM_PAGES', () => {
  test('«Drets d’autor» viu a /page/drets-autor, sense acció gran', () => {
    expect(SYSTEM_PAGES.find((pagina) => pagina.key === 'drets-autor')).toEqual({ key: 'drets-autor', isAvis: false, href: '/page/drets-autor' });
    expect(accioDeLaPagina('drets-autor')).toBeNull();
    // Sense ruta canònica: PageDetailSection no la redirigix enlloc.
    expect(resolvePageSlugPath('drets-autor')).toBeNull();
  });

  test('cap clau repetida, i cada pàgina declarada té el seu copy a PAGE_COPY', () => {
    const claus = SYSTEM_PAGES.map((pagina) => pagina.key);
    expect(new Set(claus).size).toBe(claus.length);
    expect(claus.filter((clau) => !Object.hasOwn(PAGE_COPY, clau))).toEqual([]);
  });

  test('immutables: la llista i cada entrada', () => {
    expect(Object.isFrozen(SYSTEM_PAGES)).toBe(true);
    for (const pagina of SYSTEM_PAGES) expect(Object.isFrozen(pagina), pagina.key).toBe(true);
  });
});

describe('RUTA_DRETS_AUTOR', () => {
  test('és la ruta de l’entrada «drets-autor»: una sola font per a la targeta i la capçalera', () => {
    expect(RUTA_DRETS_AUTOR).toBe('/page/drets-autor');
    expect(RUTA_DRETS_AUTOR).toBe(SYSTEM_PAGES.find((pagina) => pagina.key === 'drets-autor').href);
  });
});
