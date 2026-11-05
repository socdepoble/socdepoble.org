/**
 * P1-f (Onada R6, Bloc 2) · El detall del Mur resol els articles importats
 * sense arrossegar el tesaurus doctoral: l'índex de claus diu si una clau n'és
 * un, el transformador arriba amb import() i el resultat és el mateix que el
 * del transformador. L'ordre de les proves importa: les primeres miren l'estat
 * d'abans de carregar (l'estat del mòdul és d'este fitxer).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { ARTICLES_SIMULADOR_IA_425 } from '../data/taxonomia/tesaurusDoctoralSocDePoble.js';
import { CLAUS_ARTICLES_IMPORTATS } from '../data/taxonomia/indexArticlesImportats.js';
import * as complet from './transformadorEditorialWpBlogger.js';
import * as revisio from './revisioEditorialWp.js';
import {
  carregaArticlesImportats,
  esClauDArticleImportat,
  estatArticleImportat,
  trobaArticleImportatComAPublicacio,
  useEstatArticleImportat,
} from './articlesImportatsMandros.js';

const PRIMER = ARTICLES_SIMULADOR_IA_425[0];
const font = (relatiu) => readFileSync(path.join(process.cwd(), relatiu), 'utf8');
const IMPORTS_ESTATICS = /^\s*(?:import|export)\s[^;]*?\sfrom\s+['"]([^'"]+)['"]/gm;
const importsDe = (relatiu) => [...font(relatiu).matchAll(IMPORTS_ESTATICS)].map(([, desti]) => desti);

function storageDeProva(estat) {
  const dades = new Map(estat ? [[revisio.CLAU_STORAGE_REVISIO_WP, JSON.stringify(estat)]] : []);
  return { getItem: (clau) => dades.get(clau) ?? null, setItem: (clau, valor) => dades.set(clau, String(valor)) };
}

describe('P1-f · índex de claus i mòduls lleugers', () => {
  test('l’índex té exactament els slugs i els id dels articles del tesaurus', () => {
    const esperades = new Set(ARTICLES_SIMULADOR_IA_425.flatMap((article) => [String(article.slug), String(article.id)]));
    expect([...CLAUS_ARTICLES_IMPORTATS].sort()).toEqual([...esperades].sort());
  });

  test('ni l’índex, ni el carregador, ni la revisió importen estàticament el tesaurus o el transformador', () => {
    for (const fitxer of ['src/data/taxonomia/indexArticlesImportats.js', 'src/utils/articlesImportatsMandros.js', 'src/utils/revisioEditorialWp.js']) {
      expect(importsDe(fitxer).filter((desti) => /tesaurus|transformadorEditorial|mapaEnllacos/.test(desti)), fitxer).toEqual([]);
    }
  });

  test('el transformador reexporta la revisió lleugera amb els mateixos noms', () => {
    for (const nom of ['CLAU_STORAGE_REVISIO_WP', 'llegeixEstatRevisioEditorial', 'desaEstatRevisioEditorial', 'desaRevisioArticleImportat']) {
      expect(complet[nom], nom).toBe(revisio[nom]);
    }
  });
});

describe('P1-f · càrrega mandrosa', () => {
  test('abans de carregar: la clau es coneix, l’article encara no, i l’estat és «carregant»', () => {
    expect(esClauDArticleImportat(PRIMER.slug)).toBe(true);
    expect(esClauDArticleImportat(`  ${PRIMER.id} `)).toBe(true);
    expect(esClauDArticleImportat('no-es-cap-article')).toBe(false);
    expect(esClauDArticleImportat('')).toBe(false);
    expect(esClauDArticleImportat(null)).toBe(false);
    expect(trobaArticleImportatComAPublicacio(PRIMER.slug)).toBeNull();
    expect(estatArticleImportat(PRIMER.slug)).toBe('carregant');
    expect(estatArticleImportat('no-es-cap-article')).toBeNull();
  });

  test('el ganxo demana el transformador i torna a pintar quan arriba', async () => {
    const { result } = renderHook(() => useEstatArticleImportat(PRIMER.slug));
    expect(result.current).toBe('carregant');
    await waitFor(() => expect(result.current).toBeNull());
    expect(trobaArticleImportatComAPublicacio(PRIMER.slug)).not.toBeNull();
  });

  test('després de carregar: el mateix resultat que el transformador per a cada clau', async () => {
    await carregaArticlesImportats();
    const storage = storageDeProva({ estats: { [PRIMER.id]: 'aprovat' }, anotacions: { [PRIMER.id]: 'Revisat' } });
    const claus = [...CLAUS_ARTICLES_IMPORTATS, ` ${PRIMER.slug} `, 'no-es-cap-article', '', null, undefined, 'aplec-pel-territori-2023'];
    for (const clau of claus) {
      expect(trobaArticleImportatComAPublicacio(clau, storage), String(clau)).toEqual(complet.trobaArticleImportatComAPublicacio(clau, storage));
    }
    expect(trobaArticleImportatComAPublicacio(PRIMER.slug, storage)).toMatchObject({ estat_revisio: 'aprovat', nota_revisio: 'Revisat', esImportatWp: true });
    expect(estatArticleImportat(PRIMER.slug)).toBeNull();
  });
});
