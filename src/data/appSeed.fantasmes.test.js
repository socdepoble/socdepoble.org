/**
 * Onada 12 (261011; ordres 261011_0130, punt 1: «caçar duplicitats o anomalies
 * en dades fantasma») · La guarda de la llavor sencera (APP_CONTENT_ROWS, el
 * que el mode seed pinta i el que scripts/generate-supabase-seed.mjs escriu a
 * supabase/seed.sql): cap id repetit dins d'una col·lecció, cap imatge
 * /assets/ que no existisca a public/ (una imatge trencada és un fantasma) i
 * cap article repetit com a entrada de Multimèdia amb el seu text sencer.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { APP_CONTENT_ROWS, APP_SEED } from './appSeed.js';

const RE_IMATGE = /\/assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|gif|svg)/g;

describe('la llavor no porta fantasmes', () => {
  test('cap id repetit dins de cada col·lecció', () => {
    const repetits = [];
    for (const { key, payload } of APP_CONTENT_ROWS) {
      if (!Array.isArray(payload)) continue;
      const ids = payload.map((item) => item?.id).filter((id) => id != null);
      for (const id of new Set(ids.filter((valor, index) => ids.indexOf(valor) !== index))) repetits.push(`${key}/${id}`);
    }
    expect(repetits).toEqual([]);
  });

  test('totes les imatges /assets/ de la llavor existixen a public/', () => {
    const absents = [];
    for (const { key, payload } of APP_CONTENT_ROWS) {
      for (const ruta of new Set(JSON.stringify(payload).match(RE_IMATGE) || [])) {
        if (!existsSync(path.join(process.cwd(), 'public', ruta))) absents.push(`${key}: ${ruta}`);
      }
    }
    expect(absents).toEqual([]);
  });

  test('cap producte, publicació ni poble es repetix a Multimèdia amb el seu text sencer; la seua foto diu de quin article és', () => {
    const articles = [['mercat', APP_SEED.marketItems, 'description'], ['mur', APP_SEED.feedPosts, 'content'], ['pobles', APP_SEED.towns, null]];
    for (const [sectionId, llista, campDeText] of articles) {
      for (const article of llista) {
        const fotos = APP_SEED.mediaItems.filter((media) => media.title === article.title);
        expect(fotos.length, `${sectionId}/${article.id}`).toBeLessThanOrEqual(1);
        for (const foto of fotos) {
          expect(foto.article, foto.id).toEqual({ sectionId, id: article.id });
          if (campDeText && String(article[campDeText] || '').length > 180) expect(foto.description, foto.id).not.toBe(article[campDeText]);
        }
      }
    }
  });
});
