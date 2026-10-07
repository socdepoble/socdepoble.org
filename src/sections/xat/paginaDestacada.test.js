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

describe('paginaDestacada · la tria de l’administrador', () => {
  test('per defecte, «El Xat»; «L’Ànima de la IAIA» continua sent la reserva i continua existint', () => {
    expect(PAGINA_DESTACADA_DEL_XAT).toBe('xat');
    expect(PAGINA_DESTACADA_DE_RESERVA).toBe('anima');
    expect(paginaDestacada({})).toEqual({ clau: 'xat', pagina: PAGE_COPY.xat });
    expect(PAGE_COPY.anima.title).toBe("L'Ànima de la IAIA");
  });

  test('es pot triar qualsevol pàgina de text (anima, projecte…)', () => {
    expect(paginaDestacada({}, 'anima')).toEqual({ clau: 'anima', pagina: PAGE_COPY.anima });
    expect(paginaDestacada({}, 'projecte')).toEqual({ clau: 'projecte', pagina: PAGE_COPY.projecte });
  });

  test('una clau que no existix (o heretada, com «constructor») cau a l’Ànima', () => {
    for (const clau of ['no-existix', 'constructor', '', null]) {
      expect(paginaDestacada({}, clau)).toEqual({ clau: 'anima', pagina: PAGE_COPY.anima });
    }
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
  test('xat → /page/xat; anima → /iaia; projecte → /projecte; la resta, /page/<clau> codificada', () => {
    expect(rutaDeLaPaginaDestacada('xat')).toBe('/page/xat');
    expect(rutaDeLaPaginaDestacada('anima')).toBe('/iaia');
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
