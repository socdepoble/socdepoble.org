// @vitest-environment node
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { DADES_POBLES_APLEC_VIQUIPEDIA } from './poblesAplecViquipedia.js';
import { MOCK_TOWNS, POBLES_APLEC_2023, fusionaAmbAplec } from './townsSeed.js';

const dades = Object.entries(DADES_POBLES_APLEC_VIQUIPEDIA);
const pedanies = ['benialfaqui', 'beniaia'];
/* R5-D5 · Les fitxes pròpies de la llavor conserven les seues fotos reals. */
const FOTOS_PROPIES = Object.freeze({ 'la-torre-de-les-macanes': '/assets/towns/la-torre-de-les-macanes/1.jpg' });

describe('AH-27 · dades territorials contrastades', () => {
  test('els 21 participants i Ebo tenen una única fitxa hidratada, foto real i procedència', () => {
    expect(dades).toHaveLength(22);
    expect(dades.map(([id]) => id).sort()).toEqual([...POBLES_APLEC_2023.map((poble) => poble.id), 'la-vall-d-ebo'].sort());
    for (const [id, dada] of dades) {
      const fitxes = MOCK_TOWNS.filter((poble) => poble.id === id);
      expect(fitxes, id).toHaveLength(1);
      expect(fitxes[0].image_url, id).toBe(FOTOS_PROPIES[id] || dada.image_url);
      expect(dada.content.length, id).toBeGreaterThan(60);
      expect(dada.lat, id).toBeGreaterThan(38);
      expect(dada.lat, id).toBeLessThan(40);
      expect(dada.lng, id).toBeGreaterThan(-1);
      expect(dada.lng, id).toBeLessThan(1);
      expect(dada.population, id).toMatch(/^[1-9]\d* hab$/);
      expect(dada.population_year, id).toBe(2025);
      expect(dada.hydration_version, id).toBe(2);
      expect(dada.wikipedia_hydration.version, id).toBe(2);
      expect(Number.isFinite(Date.parse(dada.wikipedia_hydration.checked_at)), id).toBe(true);
      expect(dada.wikipedia_provenance.wikidata_revision, id).toBeGreaterThan(0);
      expect(dada.wikipedia_provenance.wikipedia_revision, id).toBeGreaterThan(0);
      expect(dada.image_url, id).toBe(`/assets/towns/${id}/commons-ah27.webp`);
      expect(dada.avatar_url, id).toBe(dada.image_url);
      expect(dada.image_url, id).not.toMatch(/nanobanana|shield|escut|logo/i);
      expect(dada.wikipedia_provenance.photo, id).toEqual(dada.imatges.hero);
      expect(dada.imatges.hero.autor, id).toBeTruthy();
      expect(dada.imatges.hero.llicencia, id).toMatch(/CC|Public domain/i);
      expect(dada.imatges.hero.fontUrl, id).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      if (dada.imatges.hero.llicencia === 'Public domain') {
        // Commons pot acreditar domini públic sense enllaç a una llicència CC.
        expect(dada.imatges.hero.llicenciaUrl === null || dada.imatges.hero.llicenciaUrl.startsWith('https://'), id).toBe(true);
      } else {
        expect(dada.imatges.hero.llicenciaUrl, id).toMatch(/^https:\/\//);
      }
    }
  });

  test('els municipis tenen superfície, altitud i gentilici, i zero escuts (IDEA-90)', () => {
    for (const [id, dada] of dades.filter(([id]) => !pedanies.includes(id))) {
      expect(dada.area, id).toBeGreaterThan(0);
      expect(dada.elevation, id).toBeGreaterThan(0);
      expect(dada.gentilici, id).toBeTruthy();
      expect(dada.shield_url ?? null, id).toBeNull();
      expect(dada.shield ?? null, id).toBeNull();
      expect(dada.wikipedia_hydration.status, id).toBe('verified');
      expect(dada.wikipedia_hydration.missing, id).toEqual([]);
      expect(dada.wikipedia_provenance.scope, id).toBe('municipality');
    }
    expect(DADES_POBLES_APLEC_VIQUIPEDIA['muro-d-alcoi'].area).toBe(30.5);
    expect(DADES_POBLES_APLEC_VIQUIPEDIA.planes.area).toBe(38.5);
    expect(DADES_POBLES_APLEC_VIQUIPEDIA.planes.wikipedia_title).toBe('Planes (Comtat)');
  });

  test('les pedanies mantenen cens i coordenades propis i absències explícites', () => {
    const casos = [['benialfaqui', 'planes', 'Q11908991', '33 hab'], ['beniaia', 'la-vall-d-alcala', 'Q141120000', '31 hab']];
    for (const [id, parent, qid, poblacio] of casos) {
      const dada = DADES_POBLES_APLEC_VIQUIPEDIA[id];
      const pare = DADES_POBLES_APLEC_VIQUIPEDIA[parent];
      expect(MOCK_TOWNS.find((poble) => poble.id === id).parent_poble_id).toBe(parent);
      expect(dada.wikidata_id).toBe(qid);
      expect(dada.population).toBe(poblacio);
      expect(dada.population).not.toBe(pare.population);
      expect([dada.lat, dada.lng]).not.toEqual([pare.lat, pare.lng]);
      expect(dada.wikipedia_provenance.scope).toBe('settlement');
      expect(dada.wikipedia_hydration.status).toBe('partial');
      for (const camp of ['elevation', 'area', 'gentilici']) {
        expect(dada[camp], `${id}:${camp}`).toBeNull();
        expect(dada.wikipedia_hydration.missing).toContain(camp);
      }
    }
    const beniaia = DADES_POBLES_APLEC_VIQUIPEDIA.beniaia;
    expect(beniaia.wikipedia_title).toBeNull();
    expect(beniaia.wikipedia_url).toBe('https://es.wikipedia.org/wiki/Beniaya');
    expect(beniaia.wikipedia_hydration.source_url).toBe('https://www.wikidata.org/wiki/Q141120000');
  });

  test('les 22 fotos són WebP locals reals, acotats i no buits, i zero escuts (IDEA-90)', () => {
    const fotos = dades.map(([, dada]) => dada.image_url);
    const escuts = dades.map(([, dada]) => dada.shield_url).filter(Boolean);
    expect(new Set(fotos).size).toBe(22);
    expect(escuts).toHaveLength(0);
    for (const src of fotos) {
      const fitxer = path.join(process.cwd(), 'public', src);
      const bytes = readFileSync(fitxer);
      expect(bytes.toString('ascii', 0, 4), src).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12), src).toBe('WEBP');
      expect(statSync(fitxer).size, src).toBeGreaterThan(100);
      expect(bytes.length, src).toBeLessThan(1024 * 1024);
    }
  });
});

test('IDEA-90 · cap poble de MOCK_TOWNS ni DADES_POBLES_APLEC_VIQUIPEDIA té ni referència cap escut municipal', () => {
    for (const town of MOCK_TOWNS) {
      expect(town.shield_url ?? null, town.id).toBeNull();
      expect(town.shield ?? null, town.id).toBeNull();
      expect(String(town.image_url || '')).not.toMatch(/shield|escut|coat_of_arms/i);
    }
    for (const [id, dada] of Object.entries(DADES_POBLES_APLEC_VIQUIPEDIA)) {
      expect(dada.shield_url ?? null, id).toBeNull();
      expect(dada.shield ?? null, id).toBeNull();
      expect(dada.wikipedia_hydration?.missing || []).not.toContain('shield_url');
      expect(String(dada.image_url || '')).not.toMatch(/shield|escut|coat_of_arms/i);
    }
  });

describe('R5-D5 · la fitxa pròpia mana sobre la hidratació de l’Aplec', () => {
  const torre = MOCK_TOWNS.find((poble) => poble.id === 'la-torre-de-les-macanes');

  test('la Torre conserva 1.jpg/2.jpg, el seu cens, les seues coordenades i la seua veu', () => {
    expect(torre).toMatchObject({
      image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg',
      avatar_url: '/assets/towns/la-torre-de-les-macanes/2.jpg',
      population: '700 hab', lat: 38.5919, lng: -0.4184,
      author: 'Gent de la Torre', created_at: '2026-08-20T08:00:00.000Z'
    });
    // La foto pròpia no s'atribuïx a Commons ni hereta el cens de 2025 (749 hab).
    expect(torre.imatges).toEqual({ hero: null, avatar: null, reserva: null });
    expect(torre.wikipedia_provenance.photo).toBeNull();
    expect(torre.copyright ?? null).toBeNull();
    expect(torre.population_year ?? null).toBeNull();
    for (const src of [torre.image_url, torre.avatar_url]) {
      const bytes = readFileSync(path.join(process.cwd(), 'public', src));
      expect([bytes[0], bytes[1], bytes[2]], src).toEqual([0xff, 0xd8, 0xff]);
    }
  });

  test('la Torre només rep de l’Aplec i la Viquipèdia el que li faltava', () => {
    const font = DADES_POBLES_APLEC_VIQUIPEDIA['la-torre-de-les-macanes'];
    expect(torre).toMatchObject({
      wikidata_id: font.wikidata_id, wikipedia_url: font.wikipedia_url,
      elevation: font.elevation, area: font.area, gentilici: font.gentilici,
      source_url: 'https://socdepoble.net/2022/11/17/aplec-pel-territori-2023/'
    });
    expect(torre.wikipedia_hydration).toEqual(font.wikipedia_hydration);
  });

  test('una fitxa amb foto de reserva rep la foto, les dades i els crèdits de l’Aplec', () => {
    const aplec = POBLES_APLEC_2023.find((poble) => poble.id === 'balones');
    const font = DADES_POBLES_APLEC_VIQUIPEDIA.balones;
    const reserva = '/assets/hero_nanobanana.png';
    const fusionat = fusionaAmbAplec({ id: 'balones', type: 'town', title: 'Balones', image_url: reserva, avatar_url: reserva }, aplec);
    expect(fusionat).toMatchObject({
      image_url: font.image_url, avatar_url: font.avatar_url, population: font.population,
      population_year: font.population_year, lat: font.lat, lng: font.lng, content: font.content,
      author: aplec.author, source_url: aplec.source_url, copyright: font.copyright
    });
    expect(fusionat.imatges.hero).toEqual(font.imatges.hero);
    expect(fusionat.wikipedia_provenance.photo).toEqual(font.wikipedia_provenance.photo);
  });
});
