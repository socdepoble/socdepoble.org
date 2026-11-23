/* v1.2.22 · Gauntlet R1 (L2-04 · L5-05) · IDEA-323.4 · El rebateig del «Mode Bancal» a les guies vives.
   L'interruptor d'un toc es diu «Mode Bancal · Sol i Lletra Gran» en les cinc llengües (TEXTOS_MODE_SENIOR,
   src/config/textosModeSenior.js) i, encés, posa la lletra gran, botons de 56 px i el contrast màxim AAA (≥ 7:1)
   (v1.2.23 · D-V1223-TEXT-BANCAL, ordre del Mestre 261123: abans deia «≥ 10:1», que ja no és cert).
   Les dues guies vives de /page/tot-el-que-pots-fer (l'Aparador de la Guia pas a pas i «Tot el que pots fer»)
   han de dir eixe nom i no els vells («Mode Sènior», «Lectura Gran» i les seues traduccions).
   Fora d'esta prova queden, perquè són història: les cròniques datades (pageContent.r10.js, coherenciaEditorial*),
   els comentaris del codi i les claus internes (mostraSenior*, TEXTOS_MODE_SENIOR).
   v1.2.23 · costura K7 (ordre del Mestre 261123) · public/md/guia-pas-a-pas.md i la seua còpia a
   src/data/wikiManifest.js ja diuen «Mode Bancal» i «AAA (≥ 7:1)»; el «10:1» a public/md el guarda
   textosModeSenior.veritatBancal.v1223.test.js. */
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { TEXTOS_MODE_SENIOR } from '../../config/textosModeSenior.js';
import AparadorGuiaPasAPas from './AparadorGuiaPasAPas.jsx';
import {
  CODIS_IDIOMA_GUIA_PAS_A_PAS,
  TEXTOS_APARADOR_GUIA,
  textosAparadorGuia
} from './i18nAparadorGuiaPasAPas.js';
import { PAGE_COPY } from './pageContent.js';
import { PAGINA_POTS_FER } from './pageContent.potsFer.js';
import { localitzaPagina } from './pageContent.r10.js';

vi.mock('../../app/contexts/UIContext.jsx', () => ({
  useUIActionsOpcional: () => null
}));

afterEach(cleanup);

const CLAU = 'tot-el-que-pots-fer';

/** Els noms vells del control, en les cinc llengües (també els declinats del basc: Modua, Moduan, Modurako…). */
const NOMS_VELLS = /(?:Mode|Modo) S[èée]nior|Senior Mod|Lectura Gran|Large Reading|Large Print|Irakurketa Handia/i;

/** Totes les cadenes (valors, no claus) d'un objecte de textos, amb el seu camí per a l'error. */
function cadenesDe(valor, cami = '') {
  if (typeof valor === 'string') return [[cami, valor]];
  if (Array.isArray(valor)) return valor.flatMap((v, i) => cadenesDe(v, `${cami}[${i}]`));
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).flatMap(([clau, v]) => cadenesDe(v, cami ? `${cami}.${clau}` : clau));
  }
  return [];
}

/** El tros d'HTML d'un pas (de l'H3 fins al següent) que enllaça a `desti`. */
function pasAmbEnllac(html, desti) {
  return String(html).split('<h3>').find((pas) => pas.includes(`href="${desti}"`));
}

describe('v1.2.22 · Gauntlet R1 (L2-04 · L5-05) · Les guies vives anomenen el «Mode Bancal» com el control real', () => {
  test('TEXTOS_MODE_SENIOR porta el rètol complet i el curt en les cinc llengües de la guia', () => {
    for (const codi of CODIS_IDIOMA_GUIA_PAS_A_PAS) {
      expect(TEXTOS_MODE_SENIOR[codi]?.xip, codi).toBeTruthy();
      expect(TEXTOS_MODE_SENIOR[codi]?.xipCurt, codi).toBeTruthy();
      expect(TEXTOS_MODE_SENIOR[codi].xip.startsWith(TEXTOS_MODE_SENIOR[codi].xipCurt), codi).toBe(true);
    }
  });

  /* v1.2.23 · D-V1223-TEXT-BANCAL (ordre del Mestre 261123) · AAA ≥ 7:1 i cap 10:1. S'actualitza a posta. */
  test('la mostra de l’interruptor de l’Aparador diu, en cada llengua, el rètol complet viu i el contrast AAA ≥ 7:1 (cap 10:1)', () => {
    for (const codi of CODIS_IDIOMA_GUIA_PAS_A_PAS) {
      cleanup();
      const tx = textosAparadorGuia(codi);
      expect(tx.mostraSeniorEtiqueta, codi).toBe(TEXTOS_MODE_SENIOR[codi].xip);
      expect(tx.mostraSeniorCaption, codi).toContain(TEXTOS_MODE_SENIOR[codi].xipCurt);
      expect(tx.mostraSeniorCaption, codi).toContain('AAA');
      expect(tx.mostraSeniorCaption, codi).toContain('≥ 7:1');
      expect(tx.mostraSeniorEstat, codi).toContain('AAA ≥ 7:1');
      expect(tx.mostraSeniorCaption, codi).not.toContain('10:1');
      expect(tx.mostraSeniorEstat, codi).not.toContain('10:1');

      const { container } = render(
        createElement(MemoryRouter, { rutaInicial: '/page/tot-el-que-pots-fer' },
          createElement(AparadorGuiaPasAPas, { language: codi }))
      );
      const mostra = container.querySelector('[data-testid="mostra-inerta-senior"]');
      expect(mostra, codi).toBeTruthy();
      expect(mostra.textContent, codi).toContain(TEXTOS_MODE_SENIOR[codi].xip);
      expect(container.textContent, codi).not.toMatch(NOMS_VELLS);
      expect(container.textContent, codi).not.toContain('10:1');
    }
  });

  test('cap cadena viva del diccionari de l’Aparador conté els noms vells', () => {
    for (const codi of CODIS_IDIOMA_GUIA_PAS_A_PAS) {
      for (const [cami, text] of cadenesDe(TEXTOS_APARADOR_GUIA[codi])) {
        expect(text, `${codi}.${cami}`).not.toMatch(NOMS_VELLS);
      }
    }
  });

  test('cap cadena viva de «Tot el que pots fer» conté els noms vells, ni a la font ni a la pàgina servida', () => {
    for (const [cami, text] of cadenesDe(PAGINA_POTS_FER)) {
      expect(text, cami).not.toMatch(NOMS_VELLS);
    }
    for (const codi of CODIS_IDIOMA_GUIA_PAS_A_PAS) {
      const pagina = localitzaPagina(PAGE_COPY[CLAU], codi, CLAU);
      for (const camp of ['title', 'subtitle', 'lead', 'imageAlt', 'html']) {
        expect(pagina[camp], `${codi}.${camp}`).not.toMatch(NOMS_VELLS);
      }
    }
  });

  /* v1.2.23 · D-V1223-TEXT-BANCAL · El contrast dels passos de Traduccions i del Panell és AAA (≥ 7:1). S'actualitza a posta. */
  test('els passos de Traduccions, L’Avisador i el Panell diuen el nom viu; el del Panell, el rètol complet i el contrast AAA (≥ 7:1)', () => {
    for (const codi of CODIS_IDIOMA_GUIA_PAS_A_PAS) {
      const { html } = localitzaPagina(PAGE_COPY[CLAU], codi, CLAU);
      const { xip, xipCurt } = TEXTOS_MODE_SENIOR[codi];
      for (const desti of ['/traduccions', '/page/avisador', '/control']) {
        const pas = pasAmbEnllac(html, desti);
        expect(pas, `${codi} ${desti}`).toBeTruthy();
        expect(pas, `${codi} ${desti}`).toContain(xipCurt);
      }
      const panell = pasAmbEnllac(html, '/control');
      expect(panell, codi).toContain(xip);
      expect(panell, codi).toContain('AAA');
      expect(panell, codi).toContain('(≥ 7:1)');
      expect(pasAmbEnllac(html, '/traduccions'), codi).toContain('AAA');
      expect(pasAmbEnllac(html, '/traduccions'), codi).toContain('(≥ 7:1)');
      expect(html, codi).not.toContain('10:1');
    }
  });
});
