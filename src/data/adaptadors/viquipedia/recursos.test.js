import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { MUNICIPI_D_ESPANYA, RECURSOS, nomDeFitxer, textDeHtml } from './recursos.js';

/* Onada 5 (F5) · Les captures reals del 261009 (navegador, GET de només
   lectura) i la forma dels DTO que en trauen els traductors. Sense xarxa. */
const DIR = resolve(process.cwd(), 'tests/frontissa/fixtures/viquipedia');
const captura = (nom) => JSON.parse(readFileSync(resolve(DIR, `${nom}.json`), 'utf8'));
const tradueix = (recurs, nom) => RECURSOS[recurs].traductor(captura(nom).body);

/* La petjada de cada cos tal com l'ha servit Wikimedia (sha256 del JSON
   canònic, calculada al navegador en capturar-lo). Si algú retoca una
   captura a mà, ací ho sabrem. */
const EMPREMTES = Object.freeze({
  'article-inexistent': 'ee8e642e05f9726c0f6185cb0ea17bf75ff89b1c50fac76a38a8064969af9913',
  'article-la-torre-de-les-macanes': 'ddc3f8316410cb4cb774e226e0f06077128111a1dd167d0422fcc3b3fdbe5e1c',
  'article-sella': 'afb5b3a606f8c2799a6763eddca53df0cfbb35f71e64199f224c8afc25d800db',
  'article-sella-marina-baixa': 'fed92b54741f9a437e7df662c3ce98b74fef317371eea309ffa6b69d1f412ea8',
  'cerca-inexistent': 'fc4ef97f55581c8d6f7eee219bb38485841749396ae8f7520fff2fdf2fe1671d',
  'cerca-la-torre-de-les-macanes': '4c2fc5ea99f7588ae89cfa0da7cd160a351d00c9aed06e6ffab6521148dd95f2',
  'cerca-sella': '390e634fd7c3ddf5b9a9733fe8f8acdd6d0b0a81f60632facdb345156bebd49b',
  'entitats-la-torre-de-les-macanes': '84477f4e65b134ad2c5d3804b7c10a6e2db159185cd37317c2de35bef70fd8fc',
  'entitats-sella': 'ab41afeb2772da2dee01674f02f5c31d52f3a914b45e79cc1a140f68572ee609',
  'error-maxlag': '0e7c636058dd6c80952bad3d745d1951c70461a986f9c8c8153cfa003a6c0c5e',
  'etiquetes-la-torre-de-les-macanes': '072ac6828176672228ad4f9d328e77ebffc27871c4b4fc71e49fbf6593c5973d',
  'etiquetes-sella': 'd13078524f703e2ae690f64f4dd038144388a855ff4f70371e30fa28018d3a8f',
  'fitxers-la-torre-de-les-macanes': '39ac1e1cac18eacd13fe8a386a51f3ef0c0a8635504f43802cdb295eb6af0beb',
  'fitxers-mostra-exclusions': '5adea0a169498a73c36261f248b4fcabe149c2dea86f9bd6f0e2ac6ff0886283',
  'fitxers-sella': '6c46bd422b3f06ee32f4f26a0039d6a62ad00c4c2b4010fd5940fe1569e7305d'
});

const ORIGENS = ['https://ca.wikipedia.org', 'https://www.wikidata.org', 'https://commons.wikimedia.org'];

describe('les captures', () => {
  test('cada fitxer de la carpeta té la seua empremta, i no n’hi ha cap de més', () => {
    const fitxers = readdirSync(DIR).filter((nom) => nom.endsWith('.json')).map((nom) => nom.slice(0, -5)).sort();
    expect(fitxers).toEqual(Object.keys(EMPREMTES).sort());
  });

  test.each(Object.entries(EMPREMTES))('%s és la resposta real, sense retocar', (nom, empremta) => {
    const { captureId, capturedAt, url, body } = captura(nom);
    expect(captureId).toBe(`viquipedia-${nom}-261009`);
    expect(new Date(capturedAt).toISOString()).toBe(capturedAt);
    expect(ORIGENS).toContain(new URL(url).origin);
    expect(new URL(url).pathname).toBe('/w/api.php');
    expect(createHash('sha256').update(JSON.stringify(body)).digest('hex')).toBe(empremta);
  });
});

describe('cercaMunicipi', () => {
  test('torna els QID dels municipis trobats, congelats', () => {
    expect(tradueix('cercaMunicipi', 'cerca-la-torre-de-les-macanes')).toEqual(['Q1641908']);
    expect(tradueix('cercaMunicipi', 'cerca-sella')).toEqual(['Q985137']);
    const buida = tradueix('cercaMunicipi', 'cerca-inexistent');
    expect(buida).toEqual([]);
    expect(Object.isFrozen(buida)).toBe(true);
  });
});

describe('entitats', () => {
  test('la Torre: un DTO tancat amb el que l’algoritme necessita', () => {
    const [torre, ...cap] = tradueix('entitats', 'entitats-la-torre-de-les-macanes');
    expect(cap).toEqual([]);
    expect(torre).toEqual({
      qid: 'Q1641908',
      etiqueta: 'la Torre de les Maçanes',
      titolCawiki: 'La Torre de les Maçanes',
      esMunicipi: true,
      ine: '03132',
      poblacio: 749,
      p18: 'El riu251.jpg',
      p94: 'Escut de la Torre de les Maçanes.svg',
      p131: ['Q54936', 'Q2046431'],
      lat: 38.606666666667,
      lng: -0.41916666666667
    });
    expect(Object.isFrozen(torre)).toBe(true);
    expect(Object.isFrozen(torre.p131)).toBe(true);
  });

  test('Sella: l’element del municipi enllaça l’article desambiguat', () => {
    const [sella] = tradueix('entitats', 'entitats-sella');
    expect(sella).toMatchObject({
      qid: 'Q985137', etiqueta: 'Sella', titolCawiki: 'Sella (Marina Baixa)',
      esMunicipi: true, ine: '03124', poblacio: 621, p18: 'Sella-Panorama.jpg', p131: ['Q2247607', 'Q54936']
    });
  });

  test('el P31 de les dos captures és el «municipi d’Espanya» que busca la cerca', () => {
    for (const nom of ['entitats-la-torre-de-les-macanes', 'entitats-sella']) {
      const [entitat] = Object.values(captura(nom).body.entities);
      expect(entitat.claims.P31.map((d) => d.mainsnak.datavalue.value.id)).toContain(MUNICIPI_D_ESPANYA);
    }
  });

  test('sense població preferent, la de data més recent; una declaració obsoleta no compta', () => {
    const { body } = captura('entitats-la-torre-de-les-macanes');
    const entitat = body.entities.Q1641908;
    const senseRang = entitat.claims.P1082.map((d) => ({ ...d, rank: 'normal' }));
    const [recent] = RECURSOS.entitats.traductor({ entities: { Q1641908: { ...entitat, claims: { ...entitat.claims, P1082: senseRang } } } });
    expect(recent.poblacio).toBe(749);
    const obsoleta = entitat.claims.P31.map((d) => ({ ...d, rank: 'deprecated' }));
    const [noMunicipi] = RECURSOS.entitats.traductor({ entities: { Q1641908: { ...entitat, claims: { ...entitat.claims, P31: obsoleta } } } });
    expect(noMunicipi.esMunicipi).toBe(false);
  });
});

describe('etiquetes', () => {
  test('el nom en català de cada element de P131, en l’ordre de la petició', () => {
    expect(tradueix('etiquetes', 'etiquetes-la-torre-de-les-macanes')).toEqual([
      { qid: 'Q54936', etiqueta: 'província d\'Alacant' },
      { qid: 'Q2046431', etiqueta: 'l\'Alacantí' }
    ]);
    expect(tradueix('etiquetes', 'etiquetes-sella').map((e) => e.etiqueta)).toEqual(['la Marina Baixa', 'província d\'Alacant']);
  });
});

describe('article', () => {
  test('la Torre: extracte, imatge de pàgina, fitxers sense el prefix «Fitxer:» i coordenades', () => {
    const article = tradueix('article', 'article-la-torre-de-les-macanes');
    expect(article).toMatchObject({
      titol: 'La Torre de les Maçanes', falta: false, desambiguacio: false, qid: 'Q1641908',
      imatgePagina: 'El riu251.jpg', lat: 38.60666667, lng: -0.41916667
    });
    expect(article.extracte).toMatch(/^La Torre de les Maçanes és una vila/);
    expect(article.fitxers).toContain('Torre Gran (Torremanzanas) 3.jpg');
    expect(article.fitxers).toContain('Escut de la Torre de les Maçanes.svg');
    expect(article.fitxers.some((nom) => nom.includes('Fitxer:'))).toBe(false);
    expect(Object.isFrozen(article.fitxers)).toBe(true);
  });

  test('«Sella» pelat és una pàgina de desambiguació', () => {
    expect(tradueix('article', 'article-sella')).toMatchObject({ titol: 'Sella', desambiguacio: true, qid: 'Q299778', falta: false });
    expect(tradueix('article', 'article-sella-marina-baixa')).toMatchObject({ desambiguacio: false, qid: 'Q985137' });
  });

  test('un títol inexistent no porta text ni element', () => {
    expect(tradueix('article', 'article-inexistent')).toEqual({
      titol: 'Poble Inexistent de Prova SdP', falta: true, desambiguacio: false, qid: null,
      extracte: '', imatgePagina: null, fitxers: [], lat: null, lng: null
    });
  });
});

describe('fitxers', () => {
  const TORRE_GRAN = {
    fitxer: 'Torre Gran (Torremanzanas) 3.jpg',
    mime: 'image/jpeg',
    amplada: 3008,
    alcada: 2000,
    src: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Torre_Gran_%28Torremanzanas%29_3.jpg/1920px-Torre_Gran_%28Torremanzanas%29_3.jpg',
    sha1: '2cc97d8189af466c113eb4da583c628e5eaa61ce',
    autor: 'Relleu',
    llicencia: 'CC BY-SA 3.0 es',
    llicenciaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/es/deed.en',
    restriccions: '',
    fontUrl: 'https://commons.wikimedia.org/wiki/File:Torre_Gran_(Torremanzanas)_3.jpg'
  };

  test('cada foto ix amb l’autoria en text pla, la llicència i una URL sense rastrejadors', () => {
    const [riu, torre] = tradueix('fitxers', 'fitxers-la-torre-de-les-macanes');
    expect(torre).toEqual(TORRE_GRAN);
    expect(riu).toMatchObject({ fitxer: 'El riu251.jpg', amplada: 600, alcada: 450, autor: 'Torre', llicencia: 'Public domain', llicenciaUrl: null });
    expect(riu.src).toBe('https://upload.wikimedia.org/wikipedia/commons/c/ce/El_riu251.jpg');
    expect(Object.isFrozen(torre)).toBe(true);
  });

  test('sense Artist, l’autor és null i la font continua apuntant a Commons', () => {
    const localitzacio = tradueix('fitxers', 'fitxers-mostra-exclusions').find((f) => f.fitxer.startsWith('Localització'));
    expect(localitzacio.autor).toBeNull();
    expect(localitzacio.fontUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
  });

  test('un camp nou de l’API no travessa el traductor', () => {
    const { body } = captura('fitxers-la-torre-de-les-macanes');
    const pagines = body.query.pages.map((p) => ({ ...p, secret: 'x', imageinfo: p.imageinfo.map((i) => ({ ...i, metadata: 'exif', commonmetadata: [] })) }));
    const [, torre] = RECURSOS.fitxers.traductor({ ...body, query: { pages: pagines } });
    expect(Object.keys(torre).sort()).toEqual(Object.keys(TORRE_GRAN).sort());
  });

  test('una imatge servida fora de Wikimedia es descarta', () => {
    const { body } = captura('fitxers-la-torre-de-les-macanes');
    const pagines = body.query.pages.map((p) => ({ ...p, imageinfo: p.imageinfo.map((i) => ({ ...i, thumburl: 'https://fora.example/x.jpg', url: 'http://upload.wikimedia.org/x.jpg' })) }));
    expect(RECURSOS.fitxers.traductor({ query: { pages: pagines } })).toEqual([]);
  });
});

describe('formes invàlides', () => {
  test.each(Object.keys(RECURSOS))('%s falla tancat davant d’un cos que no és el capturat', (recurs) => {
    const traductor = RECURSOS[recurs].traductor;
    expect(() => traductor(null)).toThrow();
    expect(() => traductor('text')).toThrow();
    expect(() => traductor({})).toThrow();
    expect(() => traductor(captura('error-maxlag').body)).toThrow();
  });
});

describe('ajudants', () => {
  test('textDeHtml: text pla, entitats resoltes i cap etiqueta', () => {
    expect(textDeHtml('<a href="//commons.wikimedia.org/wiki/User:Joan" title="x">Joan</a>')).toBe('Joan');
    expect(textDeHtml('<span class="int-own-work" lang="en">Own work</span> &amp; <b>més</b>')).toBe('Own work & més');
    expect(textDeHtml('Jos&#233; &lt;Pep&gt; &#x41;')).toBe('José <Pep> A');
    expect(textDeHtml('<script>x</script>')).toBe('x');
    expect(textDeHtml(null)).toBe('');
  });

  test('nomDeFitxer: guions baixos fora i el prefix de l’espai de noms tallat', () => {
    expect(nomDeFitxer('El_riu251.jpg')).toBe('El riu251.jpg');
    expect(nomDeFitxer('Fitxer:Torre Gran (Torremanzanas) 3.jpg', { ambPrefix: true })).toBe('Torre Gran (Torremanzanas) 3.jpg');
    expect(nomDeFitxer('Sense prefix.jpg', { ambPrefix: true })).toBeNull();
    expect(nomDeFitxer(42)).toBeNull();
  });
});
