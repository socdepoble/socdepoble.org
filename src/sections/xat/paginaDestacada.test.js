/**
 * Ordre del Mestre (261007) · La pàgina destacada de la columna dreta de /xat
 * es tria en UN sol lloc (paginaDestacada.js). Si la clau triada no existix,
 * cau a 'anima', la de sempre. «L'Ànima de la IAIA» no es retira.
 * Proposta P4 · Connectar, des del document destacat, desa una ruta que el
 * lector de connexions sap resoldre: la canònica o /page/<clau>.
 */
import { describe, expect, test } from 'vitest';
import {
  PAGINA_DESTACADA_DE_RESERVA, PAGINA_DESTACADA_DEL_XAT, paginaDestacada, rutaDeLaPaginaDestacada
} from './paginaDestacada.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { paginaDeRuta } from '../text/paginaDeText.js';
import font from './paginaDestacada.js?raw';

describe('paginaDestacada · la tria de l’administrador', () => {
  test('per defecte, «El Xat»; «L’Ànima de la IAIA» continua sent la reserva i continua existint', () => {
    expect(PAGINA_DESTACADA_DEL_XAT).toBe('xat');
    expect(PAGINA_DESTACADA_DE_RESERVA).toBe('anima');
    expect(paginaDestacada({}, undefined, PAGE_COPY)).toEqual({ clau: 'xat', pagina: PAGE_COPY.xat });
    expect(PAGE_COPY.anima.title).toBe("L'Ànima de la IAIA");
  });

  test('es pot triar qualsevol pàgina de text (anima, projecte…)', () => {
    expect(paginaDestacada({}, 'anima', PAGE_COPY)).toEqual({ clau: 'anima', pagina: PAGE_COPY.anima });
    expect(paginaDestacada({}, 'projecte', PAGE_COPY)).toEqual({ clau: 'projecte', pagina: PAGE_COPY.projecte });
  });

  test('una clau que no existix (o heretada, com «constructor») cau a l’Ànima', () => {
    for (const clau of ['no-existix', 'constructor', '', null]) {
      expect(paginaDestacada({}, clau, PAGE_COPY)).toEqual({ clau: 'anima', pagina: PAGE_COPY.anima });
    }
  });

  /* Fase D (261020, L4) · El mòdul no porta contingut: en estret /xat no
     carrega pageContent.js (el document destacat el demana en diferit). */
  test('sense còpia local només mira el contingut core, i null si no hi ha res; el mòdul no importa pageContent', () => {
    expect(paginaDestacada({})).toBeNull();
    expect(paginaDestacada(null, 'xat')).toBeNull();
    const anima = { title: 'Ànima del core' };
    expect(paginaDestacada({ anima })).toEqual({ clau: 'anima', pagina: anima });
    expect(paginaDestacada({}, 'constructor')).toBeNull();
    const codi = font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(codi).not.toMatch(/pageContent|PAGE_COPY/);
  });

  test('el contingut core mana sobre PAGE_COPY, com a TextRoute', () => {
    const propia = { title: 'El Xat del poble', html: '<p>Hola</p>' };
    expect(paginaDestacada({ xat: propia })).toEqual({ clau: 'xat', pagina: propia });
    /* Amb la triada absent als dos llocs i la reserva al core, la del core. */
    const anima = { title: 'Ànima del core' };
    expect(paginaDestacada({ anima }, 'no-existix')).toEqual({ clau: 'anima', pagina: anima });
  });
});

describe('rutaDeLaPaginaDestacada · la ruta que Connectar desa (P4)', () => {
  /* Gauntlet 261016_1530 (Bloc 3.6.3; F64) · Actualitzada a posta: el
     manifest és a /anima; /iaia és la fitxa de la IAIA. */
  test('xat → /page/xat; anima → /anima; projecte → /projecte; la resta, /page/<clau> codificada', () => {
    expect(rutaDeLaPaginaDestacada('xat')).toBe('/page/xat');
    expect(rutaDeLaPaginaDestacada('anima')).toBe('/anima');
    expect(rutaDeLaPaginaDestacada('projecte')).toBe('/projecte');
    expect(rutaDeLaPaginaDestacada('una pàgina')).toBe('/page/una%20p%C3%A0gina');
  });

  test('el lector de connexions resol la ruta a la mateixa pàgina, mai a /xat', () => {
    for (const clau of ['xat', 'anima', 'projecte']) {
      expect(paginaDeRuta(rutaDeLaPaginaDestacada(clau))).toEqual({ pageKey: clau, page: PAGE_COPY[clau] });
    }
    expect(paginaDeRuta('/xat')).toBeNull();
  });
});
