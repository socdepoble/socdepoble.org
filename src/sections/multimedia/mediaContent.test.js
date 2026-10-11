/**
 * Onada 12 (261011; ordres 261011_0130, punt 1: «hi ha dos Mac Mini») · Una
 * entrada de Multimèdia derivada d'un article és una FOTO d'eixe article: mai
 * l'avatar ni el logotip de qui signa, mai el text de venda sencer, i sempre
 * diu de quin article és (`article`). Es prova amb la llavor de veres.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { MEDIA_ITEMS, fotosDelMercat, fotosDelMur, fotosDelsPobles } from './mediaContent.js';
import { LEGACY_MEDIA } from './legacyMedia.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { TOWNS } from '../pobles/townsContent.js';

const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const perId = (id) => MEDIA_ITEMS.find((item) => item.id === id);

describe('MEDIA_ITEMS (la llavor de Multimèdia)', () => {
  test('cap id repetit', () => {
    const ids = MEDIA_ITEMS.map((item) => item.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  test('cap entrada porta de foto un logotip ni l’avatar de qui ven', () => {
    const deQuiVen = new Set(MARKET_ITEMS.flatMap((item) => [item.avatar_url, item.author_avatar]).filter(Boolean));
    expect(deQuiVen.has(LOGO)).toBe(true);
    expect(MEDIA_ITEMS.filter((item) => /\/logo-/.test(String(item.src))).map((item) => item.id)).toEqual([]);
    expect(MEDIA_ITEMS.filter((item) => item.article && deQuiVen.has(item.src)).map((item) => item.id)).toEqual([]);
    /* Troballa oberta (decisió del Mestre): l'arxiu (legacyMedia.js) porta com
       a «Fotografia històrica» la foto de perfil de la persona pilot, que és
       també l'avatar de qui ven el Mac Mini. No és una entrada derivada i
       esta nit no es toca; la prova la deixa a la vista. */
    expect(MEDIA_ITEMS.filter((item) => !item.article && deQuiVen.has(item.src)).map((item) => item.id)).toEqual(['foto-javi']);
  });

  test('totes les fotos existixen a public/', () => {
    const absents = MEDIA_ITEMS.filter((item) => !existsSync(path.join(process.cwd(), 'public', item.src))).map((item) => `${item.id}: ${item.src}`);
    expect(absents).toEqual([]);
  });

  test('el Mac Mini i la Samarreta hi són UNA vegada, amb la seua primera foto i el seu article', () => {
    const mac = MARKET_ITEMS.find((item) => item.id === 'mac-mini-m4');
    const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    const delMercat = MEDIA_ITEMS.filter((item) => item.tag === 'Mercat');
    expect(delMercat.map((item) => [item.id, item.title, item.src, item.article])).toEqual([
      ['market-0', mac.title, '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg', { sectionId: 'mercat', id: 'mac-mini-m4' }],
      ['market-1', samarreta.title, '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png', { sectionId: 'mercat', id: 'samarreta-socdepoble' }]
    ]);
    /* La foto no és una segona fitxa del producte: el text de venda no hi viatja. */
    expect(perId('market-0').description).toBe(mac.subtitle);
    expect(perId('market-0').description).not.toContain('Processador');
    expect(perId('market-0').searchText).not.toContain('processador');
    expect(MEDIA_ITEMS.filter((item) => item.title === mac.title)).toHaveLength(1);
  });

  test('cada foto derivada nomena el seu article; l’arxiu, cap', () => {
    for (const town of TOWNS) expect(perId(`town-${town.id}`)).toMatchObject({ src: town.image_url, article: { sectionId: 'pobles', id: town.id } });
    expect(LEGACY_MEDIA.filter((item) => 'article' in item)).toEqual([]);
    expect(MEDIA_ITEMS).toHaveLength(LEGACY_MEDIA.length + MARKET_ITEMS.length + TOWNS.length);
  });
});

describe('fotosDelMercat', () => {
  const base = { id: 'p', title: 'Oli', seller: 'Pepa', subtitle: 'Collita 2026', created_at: '2026-09-01T10:00:00.000Z' };

  test('un producte sense cap foto pròpia no fa entrada: ni amb l’avatar a avatar_url, ni copiat a image_url o image', () => {
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO }])).toEqual([]);
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, image_url: LOGO, image: LOGO }])).toEqual([]);
    expect(fotosDelMercat([{ ...base, author_avatar: '/assets/cara.png', images: ['/assets/cara.png'] }])).toEqual([]);
    expect(fotosDelMercat([base])).toEqual([]);
  });

  test('primer `images`; sense, image_url i image', () => {
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, images: ['/assets/a.png', '/assets/b.png'], image_url: '/assets/c.png' }])[0].src).toBe('/assets/a.png');
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, image_url: '/assets/c.png' }])[0].src).toBe('/assets/c.png');
    expect(fotosDelMercat([{ ...base, images: [], image: ['/assets/d.png'] }])[0].src).toBe('/assets/d.png');
  });

  /* Correcció D4 (261011, refutació del front 1) · LÍMIT CONEGUT. L'avatar es
     descarta per igualtat de cadena, no amb camiDeLaMarca (UniversalUtils.js),
     que iguala el logotip PNG i el seu SVG d'abans: eixe mòdul importa sense
     extensió i arrossega el router, i mediaContent.js és de la cadena que el
     generador de la llavor carrega amb node pla. Un producte amb l'avatar en
     .png i el MATEIX logotip en .svg a image_url encara faria entrada. Cap
     producte de la llavor ni del seed.sql ho porta (ho fixen les proves «cap
     entrada porta de foto un logotip» d'ací i de seedSql.multimedia.test.js).
     El dia que camiDeLaMarca visca en un mòdul pur, esta prova s'ha de girar. */
  test('[LÍMIT] l’avatar en PNG i el mateix logotip en SVG a image_url: no es reconeixen com el mateix recurs', () => {
    const SVG = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, image_url: SVG }]).map((foto) => foto.src)).toEqual([SVG]);
  });

  test('la forma de l’entrada', () => {
    expect(fotosDelMercat([{ ...base, images: ['/assets/a.png'] }])).toEqual([{
      id: 'market-0', title: 'Oli', subtitle: 'Pepa', description: 'Collita 2026', src: '/assets/a.png', kind: 'image', tag: 'Mercat',
      source: 'Pepa', created_at: '2026-09-01T10:00:00.000Z', sectionId: 'multimedia', article: { sectionId: 'mercat', id: 'p' },
      searchText: 'oli collita 2026 pepa mercat'
    }]);
  });
});

describe('fotosDelMur i fotosDelsPobles', () => {
  test('una publicació sense portada no fa entrada; amb portada, nomena el seu article', () => {
    const fotos = fotosDelMur([
      { id: 'sense', title: 'Sense foto', avatar_url: LOGO },
      { id: 'amb', title: 'Fira', image_url: ['/assets/fira.jpg'], author: 'Pepa', content: 'Dissabte.', created_at: '2026-09-02T10:00:00.000Z' }
    ]);
    expect(fotos).toHaveLength(1);
    expect(fotos[0]).toMatchObject({ id: 'feed-1', src: '/assets/fira.jpg', article: { sectionId: 'mur', id: 'amb' } });
  });

  test('un poble: la foto de la seua fitxa i el seu article', () => {
    expect(fotosDelsPobles([{ id: 'tibi', title: 'Tibi', type: 'town', content: 'Un pantà.', image_url: '/assets/towns/tibi/1.jpg', created_at: '2026-08-16T08:00:00.000Z' }])).toEqual([{
      id: 'town-tibi', title: 'Tibi', subtitle: 'town', description: 'Un pantà.', src: '/assets/towns/tibi/1.jpg', kind: 'image', tag: 'Poble',
      source: 'Tibi', created_at: '2026-08-16T08:00:00.000Z', sectionId: 'multimedia', article: { sectionId: 'pobles', id: 'tibi' },
      searchText: 'tibi un panta. poble'
    }]);
  });
});
