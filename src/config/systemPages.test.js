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
 * Onada 8 (261009; requeriments 261009_1300, punt 2) · La Consola i el
 * Cervell són pàgines del sistema (/page/consola i /page/cervell), amb el
 * botó «Obrir…» cap a l'eina; Disseny continua a /disseny. Les tres porten la
 * data literal del Mestre.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import fontApp from '../app/App.jsx?raw';
import { RUTA_CONSOLA, segmentPagina } from '../sections/consola/consolaPagines.js';
import { RUTA_DRETS_AUTOR, SYSTEM_PAGES, accioDeLaPagina } from './systemPages.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { createTranslator } from './i18n.js';
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

describe('Onada 8 · la Consola, el Cervell i Disseny són pàgines del sistema', () => {
  test('la Consola i el Cervell viuen a /page/<clau>, darrere de Disseny, sense ruta canònica', () => {
    const claus = SYSTEM_PAGES.map((pagina) => pagina.key);
    expect(claus.slice(claus.indexOf('disseny'), claus.indexOf('disseny') + 3)).toEqual(['disseny', 'consola', 'cervell']);
    expect(SYSTEM_PAGES.find((pagina) => pagina.key === 'disseny')).toEqual({ key: 'disseny', isAvis: false, href: '/disseny' });
    for (const clau of ['consola', 'cervell']) {
      expect(SYSTEM_PAGES.find((pagina) => pagina.key === clau)).toMatchObject({ key: clau, isAvis: false, href: `/page/${clau}` });
      // Sense ruta canònica: PageDetailSection la servix i no la redirigix enlloc.
      expect([clau, resolvePageSlugPath(clau)]).toEqual([clau, null]);
    }
    expect(fontApp.includes('<Route path="/page/:slug"')).toBe(true);
  });

  test('el botó gran «Obrir…»: la Consola a RUTA_CONSOLA i el Cervell a l’Explorador, cap còpia que divergisca', () => {
    expect(accioDeLaPagina('consola')).toEqual({ id: 'obrir-consola', verb: 'Obrir la Consola', desti: RUTA_CONSOLA, varietat: 'primari' });
    expect(accioDeLaPagina('cervell')).toEqual({ id: 'obrir-cervell', verb: 'Obrir el Cervell', desti: `${RUTA_CONSOLA}/explorador`, varietat: 'primari' });
    // L'Explorador és una pàgina de la Consola de veres; /consola/cervell, no.
    expect(segmentPagina('/explorador')).toBe('explorador');
    expect(segmentPagina('/cervell')).toBeNull();
    // Disseny no porta cap botó gran: conserva les seues etiquetes.
    expect(accioDeLaPagina('disseny')).toBeNull();
  });

  test('el text del botó passa pel traductor amb la seua clau, i en valencià és la reserva', () => {
    const en = createTranslator('en');
    expect(accioDeLaPagina('consola', en).verb).toBe('Open the Console');
    expect(accioDeLaPagina('cervell', en).verb).toBe('Open the Brain');
    const ca = createTranslator('ca');
    expect(accioDeLaPagina('consola', ca).verb).toBe('Obrir la Consola');
    expect(accioDeLaPagina('cervell', ca).verb).toBe('Obrir el Cervell');
  });

  /* Decisió D3 de MarIA · El botó porta a la ruta de la Consola. Fora de
     desenvolupament, la barrera és la de la ruta: el rol de superadmin. Esta
     prova no diu que el botó haja de ser actiu en producció: la porta no
     mira l'entorn, i la regla P7-A (inert fora de desenvolupament, cap
     enllaç a una eina sense dades) no l'ha derogada cap ordre. Pendent de
     decisió de MarIA o del Mestre (systemPages.js, OBRIR_CONSOLA). */
  test('/consola es servix amb el comodí i, fora de desenvolupament, demana el rol de superadmin', () => {
    expect(fontApp.includes('<Route path="/consola/*" element={<RutaConsola />} />')).toBe(true);
    expect(fontApp.includes('<RequireAuth rol="superadmin"><ConsolaSection /></RequireAuth>')).toBe(true);
  });

  test('les dates literals del Mestre (8, 9 i 10 de setembre, a les 00:00) i les imatges, a public/', () => {
    expect(PAGE_COPY.consola.date).toBe('2026-09-08T00:00:00+02:00');
    expect(PAGE_COPY.cervell.date).toBe('2026-09-09T00:00:00+02:00');
    expect(PAGE_COPY.disseny.date).toBe('2026-09-10T00:00:00+02:00');
    for (const clau of ['consola', 'cervell', 'disseny']) {
      expect([clau, existsSync(path.join(process.cwd(), 'public', PAGE_COPY[clau].image))]).toEqual([clau, true]);
      expect([clau, PAGE_COPY[clau].imageAlt.trim().length > 0]).toEqual([clau, true]);
    }
    expect(PAGE_COPY.cervell).toMatchObject({ title: 'El Cervell', image: '/assets/ui/plugins/cervell_vinyeta.jpg' });
    expect(PAGE_COPY.consola.image).toBe('/assets/ui/plugins/consola_vinyeta.jpg');
  });
});

describe('RUTA_DRETS_AUTOR', () => {
  test('és la ruta de l’entrada «drets-autor»: una sola font per a la targeta i la capçalera', () => {
    expect(RUTA_DRETS_AUTOR).toBe('/page/drets-autor');
    expect(RUTA_DRETS_AUTOR).toBe(SYSTEM_PAGES.find((pagina) => pagina.key === 'drets-autor').href);
  });
});
