/**
 * Onada 5 (ordre del Mestre, 261008, tasques 3 i 4) · La targeta de /pobles i
 * la Pàgina del poble pinten l'entitat (author), el poble (title), la
 * província (categoria) i la comarca (etiqueta) de la fitxa. Amb un node
 * Supabase, la fitxa ve d'app_content 'towns' tal com la sembra
 * supabase/seed.sql, generat per scripts/generate-supabase-seed.mjs des de
 * les llavors JS (appSeed.js · APP_CONTENT_ROWS · townsSeed.js). Si el
 * seed.sql no porta un camp, la píndola no ix i ningú se n'adona: esta prova
 * fixa que cada poble de les llavors el sembra igual.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { APP_CONTENT_ROWS } from '../../data/appSeed.js';
import { MOCK_TOWNS } from './townsSeed.js';

const SQL = readFileSync(path.join(process.cwd(), 'supabase/seed.sql'), 'utf8');

/* Cada fila d'app_content: ('tenant', 'clau', '<json amb les cometes doblades>'::jsonb, versio). */
const FILA = /\('[^']*', '([A-Za-z]+)', '((?:[^']|'')*)'::jsonb/g;
function filaDelSeedSql(clau) {
  for (const [, nom, json] of SQL.matchAll(FILA)) if (nom === clau) return JSON.parse(json.replace(/''/g, "'"));
  return null;
}

/* Onada 6 (prompt 261009_0230, punt 6: cap poble escrit al codi) · També
   l'article de la Viquipèdia: les desambiguacions de Sella i Relleu ja no
   viuen a PoblesSection.jsx, sinó a les dades (wikipedia_title). */
const CAMPS = ['title', 'author', 'provincia', 'comarca', 'wikipedia_title'];

describe('el seed.sql sembra els pobles com les llavors', () => {
  const llavors = APP_CONTENT_ROWS.find(({ key }) => key === 'towns').payload;
  const sembrats = new Map((filaDelSeedSql('towns') || []).map((town) => [String(town.id), town]));

  test('es llig: tots els pobles de les llavors hi són', () => {
    expect(llavors.length).toBeGreaterThan(0);
    expect(llavors.map((town) => town.id).filter((id) => !sembrats.has(String(id)))).toEqual([]);
  });

  test('l’entitat, el poble, la província i la comarca de cada poble, iguals al seed.sql', () => {
    const divergencies = [];
    for (const town of llavors) {
      const sembrat = sembrats.get(String(town.id));
      if (!sembrat) continue;
      for (const camp of CAMPS) {
        if ((sembrat[camp] ?? null) !== (town[camp] ?? null)) divergencies.push(`${town.id}: ${camp}`);
      }
    }
    expect(divergencies).toEqual([]);
  });

  test('la Torre: «Gent de la Torre», a la província d’Alacant i a l’Alacantí', () => {
    expect(sembrats.get('la-torre-de-les-macanes')).toMatchObject({
      author: 'Gent de la Torre', provincia: 'Alacant', comarca: 'L\'Alacantí'
    });
  });

  test('Onada 6 · Sella i Relleu porten la seua desambiguació de la Viquipèdia com a dada', () => {
    expect(sembrats.get('sella')).toMatchObject({ wikipedia_title: 'Sella (Marina Baixa)' });
    expect(sembrats.get('relleu')).toMatchObject({ wikipedia_title: 'Relleu (municipi)' });
  });
});

/* R6 · Bloc 2 (P0-26 D2) · El seed.sql es va quedar amb la llavor vella de la
   Torre (749 hab, commons-ah27.webp, coordenades velles) i amb el Manifest en
   text pla. Estes proves fixen que la foto, l'avatar, la població i les
   coordenades ixen de MOCK_TOWNS, i que el Manifest viatja amb el seu HTML ric. */
const CAMPS_DE_FITXA = ['image_url', 'avatar_url', 'population', 'lat', 'lng'];

describe('el seed.sql sembra la foto, l’avatar, la població i les coordenades de MOCK_TOWNS', () => {
  const sembrats = new Map((filaDelSeedSql('towns') || []).map((town) => [String(town.id), town]));

  test('cada poble de MOCK_TOWNS té els mateixos camps de fitxa al seed.sql', () => {
    expect(MOCK_TOWNS.length).toBeGreaterThan(0);
    const divergencies = [];
    for (const town of MOCK_TOWNS) {
      const sembrat = sembrats.get(String(town.id));
      if (!sembrat) { divergencies.push(`${town.id}: absent`); continue; }
      for (const camp of CAMPS_DE_FITXA) {
        if ((sembrat[camp] ?? null) !== (town[camp] ?? null)) divergencies.push(`${town.id}: ${camp}`);
      }
    }
    expect(divergencies).toEqual([]);
  });

  test('la Torre: 700 hab, les seues fotos pròpies i les coordenades del nucli', () => {
    expect(sembrats.get('la-torre-de-les-macanes')).toMatchObject({
      population: '700 hab',
      image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg',
      avatar_url: '/assets/towns/la-torre-de-les-macanes/2.jpg',
      lat: 38.5919,
      lng: -0.4184
    });
  });
});

describe('el seed.sql sembra el Manifest de Poble amb el seu HTML ric', () => {
  const llavor = APP_CONTENT_ROWS.find(({ key }) => key === 'feedPosts').payload
    .find(({ id }) => id === 'manifest-de-poble');
  const sembrat = (filaDelSeedSql('feedPosts') || []).find(({ id }) => id === 'manifest-de-poble');

  test('el contingut del seed.sql és el de la llavor', () => {
    expect(sembrat).toBeTruthy();
    expect(sembrat.content).toBe(llavor.content);
  });

  test('porta els encapçalaments del document, no el resum en text pla', () => {
    for (const encapcalament of [
      '<h3>Un document obert dels pobles</h3>',
      '<h3>Dos pilars per a revitalitzar els pobles</h3>',
      '<h4>Despoblament</h4>'
    ]) expect(sembrat.content).toContain(encapcalament);
  });
});
