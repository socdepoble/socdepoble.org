// @vitest-environment node
/* D-5 (pla 261101_1246, assalt 10/10) · La font única dels àlies de poble:
   aliesDelPoble (la fitxa primer, la llavor després) i catalegDePobles (els
   pobles de l'aplicació i, darrere, els municipis de referència), i les
   invariants de la llavor (aliesDePoblesSeed.js). */
import { describe, expect, test } from 'vitest';
import { MAX_ALIES_DE_FITXA, MAX_FORMA_ALIES, aliesDelPoble, catalegDePobles } from './aliesDePobles.js';
import { ALIES_DE_POBLES_SEED, MUNICIPIS_DE_REFERENCIA } from './aliesDePoblesSeed.js';
import { MOCK_TOWNS } from './townsSeed.js';
import { slugDelPoble } from './nomsDelPoble.js';
/* T11-04 · El selector i el detector de la Fitxa de memòria oral, els dos consumidors del catàleg. */
import { estructuraMemoriaOral, resolPobleDeText } from '../notes/memoriaOral.js';

const formes = (llista) => llista.map((a) => a.forma);
/* La forma de comparació: sense accents, sense majúscules i amb espais simples. */
const clau = (text) => String(text).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

describe('aliesDelPoble', () => {
  test('per l’id de la llavor, i pel nom quan l’id és de la base de dades', () => {
    expect(formes(aliesDelPoble({ id: 'xixona', title: 'Xixona' }))).toEqual(['Jijona']);
    expect(formes(aliesDelPoble({ id: '7f3c9a2e-5b1d-4c8e-9a0f-2d6b8e4c1a55', title: 'La Torre de les Maçanes' }))).toEqual(['Torremanzanas', 'la Torre']);
    expect(aliesDelPoble({ id: 'la-torre-de-les-macanes' })[1]).toEqual({ forma: 'la Torre', ambMajuscula: true, majusculaEn: 1 });
    expect(aliesDelPoble({ id: 'tibi', title: 'Tibi' })).toEqual([]);
    for (const res of [null, undefined, 'xixona', 42]) expect(aliesDelPoble(res)).toEqual([]);
    // Una clau del prototip no és cap poble.
    expect(aliesDelPoble({ id: 'constructor', title: 'toString' })).toEqual([]);
  });

  test('els de la fitxa primer (cadenes o objectes), sense repetits, i després els de la llavor', () => {
    const poble = { id: 'xixona', title: 'Xixona', alies: ['Xixona del Torró', { forma: 'JIJONA' }, { forma: 'el Barri', ambMajuscula: true, majusculaEn: 1 }] };
    const llista = aliesDelPoble(poble);
    expect(formes(llista)).toEqual(['Xixona del Torró', 'JIJONA', 'el Barri']);
    expect(llista[2]).toEqual({ forma: 'el Barri', ambMajuscula: true, majusculaEn: 1 });
    expect(Object.isFrozen(llista) && llista.every(Object.isFrozen)).toBe(true);
    // Un poble nou, sense codi: els àlies a la seua fitxa.
    expect(formes(aliesDelPoble({ id: 'benimantell', title: 'Benimantell', alies: ['Benimantel'] }))).toEqual(['Benimantel']);
  });

  test('els de la fitxa que no valen es boten, i se’n lligen com a molt MAX_ALIES_DE_FITXA', () => {
    const dolents = ['', '   ', '!!!', 'x'.repeat(MAX_FORMA_ALIES + 1), 42, null, { forma: 7 }, ['Jijona'], { forma: 'Bo', majusculaEn: -1 }, { forma: 'Bo2', majusculaEn: 1.5, ambMajuscula: 'sí' }];
    const llista = aliesDelPoble({ id: 'nou', title: 'Nou', alies: dolents });
    expect(llista).toEqual([{ forma: 'Bo', ambMajuscula: false, majusculaEn: 0 }, { forma: 'Bo2', ambMajuscula: false, majusculaEn: 0 }]);
    expect(formes(aliesDelPoble({ id: 'nou', title: 'Nou', alies: ['  Dos   espais  '] }))).toEqual(['Dos espais']);
    const molts = Array.from({ length: MAX_ALIES_DE_FITXA + 3 }, (_, n) => `Àlies ${n}`);
    expect(aliesDelPoble({ id: 'nou', title: 'Nou', alies: molts })).toHaveLength(MAX_ALIES_DE_FITXA);
    expect(formes(aliesDelPoble({ id: 'nou', alies: [`a${'x'.repeat(MAX_FORMA_ALIES - 1)}`] }))[0]).toHaveLength(MAX_FORMA_ALIES);
  });
});

describe('la llavor dels àlies', () => {
  const pobles = [...MOCK_TOWNS, ...MUNICIPIS_DE_REFERENCIA];
  const oficials = new Map(pobles.map((p) => [p.id, clau(p.title)]));

  test('cada clau és un poble de la llavor o un municipi de referència', () => {
    expect(Object.keys(ALIES_DE_POBLES_SEED).filter((id) => !oficials.has(id))).toEqual([]);
    expect(Object.isFrozen(ALIES_DE_POBLES_SEED)).toBe(true);
    for (const llista of Object.values(ALIES_DE_POBLES_SEED)) expect(Object.isFrozen(llista) && llista.every(Object.isFrozen)).toBe(true);
  });

  test('cap àlies no és el nom oficial d’un poble (el seu o un altre), ni l’àlies de dos pobles', () => {
    const vistos = new Map();
    const senseArticle = (nom) => nom.replace(/^(?:el|els|la|les) |^l'/, '');
    const noms = new Set([...oficials.values()].flatMap((nom) => [nom, senseArticle(nom)]));
    for (const [id, llista] of Object.entries(ALIES_DE_POBLES_SEED)) {
      for (const { forma } of llista) {
        expect(noms.has(clau(forma)), `${id}: ${forma}`).toBe(false);
        expect(vistos.get(clau(forma)) ?? id, forma).toBe(id);
        vistos.set(clau(forma), id);
      }
    }
  });

  test('els municipis de referència: id, nom, comarca i província; l’id és el del nom; cap no és de la llavor', () => {
    // Els set de sempre, primers i en el mateix ordre; darrere, els de T11-04 que no són a la llavor (AH-19, 261104: 12 han passat a la llavor, 53 - 12 = 41).
    expect(MUNICIPIS_DE_REFERENCIA.slice(0, 7).map((m) => m.title)).toEqual(['Ibi', 'Castalla', 'Onil', 'Biar', 'Alcoi', 'Alacant', 'València']);
    expect(MUNICIPIS_DE_REFERENCIA).toHaveLength(41);
    expect(new Set(MUNICIPIS_DE_REFERENCIA.map((m) => m.id)).size).toBe(MUNICIPIS_DE_REFERENCIA.length);
    expect(Object.isFrozen(MUNICIPIS_DE_REFERENCIA)).toBe(true);
    for (const m of MUNICIPIS_DE_REFERENCIA) {
      expect(Object.isFrozen(m)).toBe(true);
      expect([typeof m.title, typeof m.comarca, typeof m.provincia].every((t) => t === 'string'), m.id).toBe(true);
      expect(m.comarca && m.provincia, m.id).toBeTruthy();
      expect(m.id).toBe(slugDelPoble(m.title));
      expect(MOCK_TOWNS.some((t) => t.id === m.id || clau(t.title) === clau(m.title)), m.id).toBe(false);
    }
  });
});

describe('catalegDePobles', () => {
  test('sense llista (o buida): la llavor i, darrere, els municipis de referència; congelat i memoritzat', () => {
    const cataleg = catalegDePobles();
    expect(cataleg.map((p) => p.id)).toEqual([...MOCK_TOWNS.map((t) => t.id), ...MUNICIPIS_DE_REFERENCIA.map((m) => m.id)]);
    expect(Object.isFrozen(cataleg)).toBe(true);
    expect(catalegDePobles()).toBe(cataleg);
    expect(catalegDePobles([])).toBe(cataleg);
    expect(catalegDePobles('xixona')).toBe(cataleg);
  });

  test('amb els pobles de l’aplicació: primer els seus, sense repetir cap referència (per id o pel nom, també amb un id UUID)', () => {
    const pobles = [
      { id: 'alcoi', title: 'Alcoi', comarca: "L'Alcoià", provincia: 'Alacant' },
      { id: '7f3c9a2e-5b1d-4c8e-9a0f-2d6b8e4c1a55', title: 'València' },
      null,
      { id: 'benimantell', title: 'Benimantell' }
    ];
    const cataleg = catalegDePobles(pobles);
    // Els de l'aplicació i, darrere, les referències que no hi són: ni Alcoi, ni València, ni Benimantell (T11-04).
    expect(cataleg.map((p) => p.id).slice(0, 8)).toEqual(['alcoi', '7f3c9a2e-5b1d-4c8e-9a0f-2d6b8e4c1a55', 'benimantell', 'ibi', 'castalla', 'onil', 'biar', 'alacant']);
    const repetides = 3; // alcoi (per id), València (pel nom) i benimantell (per id)
    expect(cataleg).toHaveLength(3 + MUNICIPIS_DE_REFERENCIA.length - repetides);
    expect(cataleg.filter((p) => p.id === 'benimantell')).toEqual([pobles[3]]);
    expect(cataleg.filter((p) => p.id === 'alcoi')).toEqual([pobles[0]]);
    expect(cataleg.some((p) => p.id === 'valencia')).toBe(false);
    expect(cataleg[0]).toBe(pobles[0]);
    expect(catalegDePobles(pobles)).toBe(cataleg);
    // Una llista nova es torna a construir.
    expect(catalegDePobles([...pobles])).not.toBe(cataleg);
  });
});

/* T11-04 (Gemini, Tall 11; marató 261101_2143) · Les quatre comarques on hi ha
   pobles de l'aplicació (la Muntanya d'Alacant), completes entre la llavor i
   els municipis de referència, i la comarca de València, que és «València»
   (la divisió comarcal oficial), no «L'Horta». */
describe('T11-04 · els municipis de referència de la Muntanya d’Alacant', () => {
  /* Quants municipis té cada comarca: relació del PEGV a 1/1/2026 amb la comarca de la
     Llei 2/2020 (https://pegv.gva.es/va/municipis) i AVL 23/04/2026
     (https://www.avl.gva.es/municipis/), contrastades el 261102 (IDEA-49): les quatre
     comarques fan 10, 8, 24 i 18, i la comarca de València és «València» (codi 06). */
  /* El Comtat: 24 municipis i Benialfaquí, pedania de Famorca que la llavor d'AH-27 duu amb fitxa pròpia (261104). */
  const MIDA_DE_LA_COMARCA = { "L'Alacantí": 10, "L'Alcoià": 8, 'El Comtat': 25, 'La Marina Baixa': 18 };
  const COMARQUES_ADMESES = [...Object.keys(MIDA_DE_LA_COMARCA), "L'Alt Vinalopó", 'València'].sort();

  test('cada comarca és d’una llista tancada, amb majúscula i apòstrof recte; la província, Alacant o València', () => {
    expect([...new Set(MUNICIPIS_DE_REFERENCIA.map((m) => m.comarca))].sort()).toEqual(COMARQUES_ADMESES);
    expect(MUNICIPIS_DE_REFERENCIA.filter((m) => /[’‘]/.test(`${m.title}${m.comarca}`)).map((m) => m.id)).toEqual([]);
    expect([...new Set(MUNICIPIS_DE_REFERENCIA.map((m) => m.provincia))].sort()).toEqual(['Alacant', 'València']);
  });

  test('la província és la de la seua comarca (també a la llavor de l’aplicació)', () => {
    const PROVINCIA_DE_LA_COMARCA = { "L'Alacantí": 'Alacant', "L'Alcoià": 'Alacant', 'El Comtat': 'Alacant', 'La Marina Baixa': 'Alacant', "L'Alt Vinalopó": 'Alacant', 'València': 'València' };
    const tots = [...MOCK_TOWNS, ...MUNICIPIS_DE_REFERENCIA].filter((p) => p.comarca in PROVINCIA_DE_LA_COMARCA);
    expect(tots.length).toBeGreaterThan(MUNICIPIS_DE_REFERENCIA.length);
    expect(tots.filter((p) => p.provincia !== PROVINCIA_DE_LA_COMARCA[p.comarca]).map((p) => `${p.id}: ${p.provincia}`)).toEqual([]);
  });

  test('els noms oficials segons l’AVL i el BOE-A-2022-2683: Alcosser (Decret 115/2021) i Muro de Alcoy, com a àlies', () => {
    expect(MUNICIPIS_DE_REFERENCIA.find((m) => m.title.startsWith('Alcosser'))).toEqual({ id: 'alcosser', title: 'Alcosser', comarca: 'El Comtat', provincia: 'Alacant' });
    expect(formes(aliesDelPoble({ id: 'alcosser' }))).toEqual(['Alcocer de Planes', 'Alcosser de Planes']);
    expect(formes(aliesDelPoble({ id: 'muro-d-alcoi' }))[0]).toBe('Muro de Alcoy');
    // «Muro» també és una paraula corrent en castellà: als relats, només amb majúscula.
    expect(aliesDelPoble({ id: 'muro-d-alcoi' }).find((a) => a.forma === 'Muro')).toEqual({ forma: 'Muro', ambMajuscula: true, majusculaEn: 0 });
  });

  test('la comarca de València continua sent «València», no «L’Horta»', () => {
    expect(MUNICIPIS_DE_REFERENCIA.find((m) => m.id === 'valencia')).toEqual({ id: 'valencia', title: 'València', comarca: 'València', provincia: 'València' });
    expect(MUNICIPIS_DE_REFERENCIA.some((m) => /horta/i.test(m.comarca))).toBe(false);
  });

  test('les quatre comarques, completes i sense repetits entre la llavor i les referències', () => {
    const tots = [...MOCK_TOWNS, ...MUNICIPIS_DE_REFERENCIA];
    for (const [comarca, mida] of Object.entries(MIDA_DE_LA_COMARCA)) {
      const noms = tots.filter((p) => p.comarca === comarca).map((p) => clau(p.title));
      expect([comarca, noms.length, new Set(noms).size]).toEqual([comarca, mida, mida]);
    }
    // Cap municipi de referència de més fora de les sis comarques admeses.
    expect(MUNICIPIS_DE_REFERENCIA.filter((m) => !(m.comarca in MIDA_DE_LA_COMARCA)).map((m) => m.id)).toEqual(['biar', 'valencia']);
  });

  test('els àlies nous, per l’id de la llavor i pel nom d’una fitxa amb un id UUID', () => {
    expect(formes(aliesDelPoble({ id: 'la-vila-joiosa', title: 'La Vila Joiosa' }))).toEqual(['Villajoyosa']);
    expect(formes(aliesDelPoble({ id: '0b6c1f8e-2d4a-4e9b-8c7d-5a3f2e1d0c9b', title: "Muro d'Alcoi" }))).toEqual(['Muro de Alcoy', 'Muro']);
    expect(formes(aliesDelPoble({ id: 'l-orxa', title: "L'Orxa" }))).toEqual(['Lorcha']);
    // Només un accent de diferència: cap àlies (la comparació ja el lleva).
    for (const id of ['tarbena', 'beniarda', 'la-nucia', 'el-campello']) expect(aliesDelPoble({ id }), id).toEqual([]);
  });

  test('al selector de la fitxa, com ho diu la gent; al detector dels relats, mai una referència', () => {
    const casos = [
      ['Villajoyosa', 'la-vila-joiosa'], ['Muro de Alcoy', 'muro-d-alcoi'], ['Guadalest', 'el-castell-de-guadalest'],
      ['Campello', 'el-campello'], ['Tárbena', 'tarbena'], ['La Nucía', 'la-nucia'], ['Bañeres', 'banyeres-de-mariola'],
      ['San Vicente del Raspeig', 'sant-vicent-del-raspeig'], ['Cocentaina', 'cocentaina'], ['València', 'valencia'],
      ['Alcosser', 'alcosser'], ['Alcocer de Planes', 'alcosser'], ['Muro', 'muro-d-alcoi'], ['Banyeres', 'banyeres-de-mariola'],
      ['Bañeres de Mariola', 'banyeres-de-mariola']
    ];
    for (const [text, id] of casos) {
      const r = resolPobleDeText(text);
      expect([text, r.estat, r.poble?.id]).toEqual([text, 'trobat', id]);
    }
    expect(resolPobleDeText('Villajoyosa').poble).toEqual({ id: 'la-vila-joiosa', nom: 'La Vila Joiosa', comarca: 'La Marina Baixa', provincia: 'Alacant' });
    // El detector no s'inventa cap poble: les referències no són pobles de l'aplicació.
    expect(estructuraMemoriaOral('Estiuejàvem a Benidorm i baixàvem a vendre a Cocentaina i a Villajoyosa.').municipi ?? null).toBeNull();
  });
});
