// @vitest-environment node
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { TRACTORS_GESTORIA } from '../gestoria/tractors.js';
import { calculaEmpremta } from './nucli/empremta.js';
import {
  BASE_REGISTRE, RUTES_DEL_CATALEG, TRACTORS, catalegTractors, construixTractor, empremtaDe, empremtesDe, empremtesDelsTractors,
  rutaDesDeArrel, textosPerRuta
} from './registreTractors.js';

const subtle = webcrypto.subtle;

function manifest(canvis = {}) {
  return {
    schema: 'sdp.tractor.v1',
    id: 'prova.lector',
    nom: 'Lector de prova',
    versio: '1.0.0',
    descripcio: 'Llig una carpeta de prova.',
    fitxa: 'src/sections/gestoria/fitxes/prova.md',
    fonts: ['src/sections/gestoria/nucli/lector.js', 'src/sections/tractors/nucli/porta.js'],
    llig: ['La carpeta que tries'],
    escriu: ['Res'],
    xarxa: 'cap',
    dadesPersonals: false,
    nivellMinim: 'confirmacio',
    caducitatDies: 30,
    ...canvis
  };
}

/* Glob simulat amb les claus que dona Vite des de src/sections/tractors/. */
const GLOB = {
  '../gestoria/fitxes/prova.md': '# Lector de prova\n\nQuè fa.\n',
  '../gestoria/nucli/lector.js': 'export const lector = 1;\n',
  './nucli/porta.js': 'export const porta = 2;\n'
};
const senseClaus = (objecte, ...claus) => Object.fromEntries(Object.entries(objecte).filter(([clau]) => !claus.includes(clau)));

describe('rutaDesDeArrel', () => {
  test.each([
    ['./nucli/aprovacio.js', 'src/sections/tractors/nucli/aprovacio.js'],
    ['../tractors/nucli/aprovacio.js', 'src/sections/tractors/nucli/aprovacio.js'],
    ['../gestoria/fitxes/gestoria_factures.md', 'src/sections/gestoria/fitxes/gestoria_factures.md'],
    ['../gestoria/nucli/../tractors.js', 'src/sections/gestoria/tractors.js'],
    ['/src/sections/gestoria/nucli/csv.js', 'src/sections/gestoria/nucli/csv.js']
  ])('%s → %s', (clau, ruta) => {
    expect(rutaDesDeArrel(clau)).toBe(ruta);
  });

  test.each([
    ['fora de l\'arrel', '../../../../../fora.js'],
    ['sense punt inicial', 'nucli/x.js'],
    ['barra inversa', '.\\nucli\\x.js'],
    ['buida', ''],
    ['no és text', 7]
  ])('rebutja: %s', (_nom, clau) => {
    expect(rutaDesDeArrel(clau)).toBeNull();
  });

  test('la base és configurable i per defecte és la carpeta del mòdul', () => {
    expect(BASE_REGISTRE).toBe('src/sections/tractors');
    expect(rutaDesDeArrel('./a.js', 'src/x')).toBe('src/x/a.js');
  });
});

describe('textosPerRuta i construixTractor', () => {
  test('converteix les claus i ignora el que no és text', () => {
    const textos = textosPerRuta({ ...GLOB, './nucli/binari.js': new Uint8Array(1), 'res.js': 'x' });
    expect([...textos.keys()].sort()).toEqual([
      'src/sections/gestoria/fitxes/prova.md',
      'src/sections/gestoria/nucli/lector.js',
      'src/sections/tractors/nucli/porta.js'
    ]);
    expect(textosPerRuta(undefined).size).toBe(0);
  });

  test('un tractor complet porta la fitxa i les fonts en l\'ordre del manifest', () => {
    const t = construixTractor(manifest(), textosPerRuta(GLOB));
    expect(t.id).toBe('prova.lector');
    expect(t.fitxa).toBe(GLOB['../gestoria/fitxes/prova.md']);
    expect(t.fonts).toEqual([
      { ruta: 'src/sections/gestoria/nucli/lector.js', contingut: 'export const lector = 1;\n' },
      { ruta: 'src/sections/tractors/nucli/porta.js', contingut: 'export const porta = 2;\n' }
    ]);
    expect(t.fontsAbsents).toEqual([]);
    expect(Object.isFrozen(t)).toBe(true);
  });

  test('les fonts i la fitxa que falten queden a fontsAbsents', () => {
    const [t] = catalegTractors([manifest()], senseClaus(GLOB, './nucli/porta.js', '../gestoria/fitxes/prova.md'));
    expect(t.fitxa).toBeNull();
    expect(t.fontsAbsents).toEqual(['src/sections/gestoria/fitxes/prova.md', 'src/sections/tractors/nucli/porta.js']);
    expect(t.fonts.map((f) => f.ruta)).toEqual(['src/sections/gestoria/nucli/lector.js']);
  });
});

describe('empremtaDe', () => {
  test('dona la mateixa empremta que el nucli i la curta', async () => {
    const [t] = catalegTractors([manifest()], GLOB);
    const info = await empremtaDe(t, subtle);
    const esperada = await calculaEmpremta({ manifest: t.manifest, fitxa: t.fitxa, fonts: t.fonts }, subtle);
    expect(info).toEqual({
      id: 'prova.lector', estat: 'ok', empremta: esperada,
      curta: `${esperada.slice(7, 11).toUpperCase()}-${esperada.slice(11, 15).toUpperCase()}`,
      fontsAbsents: [], motiu: ''
    });
  });

  test('incomplet és un estat normal: llista les absents i no necessita WebCrypto', async () => {
    const [t] = catalegTractors([manifest()], senseClaus(GLOB, './nucli/porta.js'));
    const sensSubtle = { digest: () => { throw new Error('no s\'havia de cridar'); } };
    const info = await empremtaDe(t, sensSubtle);
    expect(info).toMatchObject({ estat: 'incomplet', empremta: null, curta: null, fontsAbsents: ['src/sections/tractors/nucli/porta.js'] });
    expect(info.motiu).toMatch(/Falten un fitxer declarat/);
  });

  test('un manifest invàlid o sense WebCrypto és «error», mai una excepció', async () => {
    const [invalid] = catalegTractors([manifest({ versio: 'u' })], GLOB);
    expect(await empremtaDe(invalid, subtle)).toMatchObject({ estat: 'error', empremta: null, motiu: expect.stringMatching(/versio/) });
    const [bo] = catalegTractors([manifest()], GLOB);
    expect((await empremtaDe(bo, { digest: async () => { throw new Error('trencat'); } })).estat).toBe('error');
  });

  test('empremtesDe conserva l\'ordre del catàleg', async () => {
    const cataleg = catalegTractors([manifest(), manifest({ id: 'prova.altre', fonts: ['src/sections/gestoria/nucli/absent.js'] })], GLOB);
    const infos = await empremtesDe(cataleg, subtle);
    expect(infos.map((i) => [i.id, i.estat])).toEqual([['prova.lector', 'ok'], ['prova.altre', 'incomplet']]);
  });
});

describe('TRACTORS (glob real de Vite)', () => {
  test('un tractor per manifest de la Gestoria, amb la fitxa sencera del disc', () => {
    expect(TRACTORS.map((t) => t.id)).toEqual(TRACTORS_GESTORIA.map((m) => m.id));
    for (const t of TRACTORS) {
      expect(t.manifest).toBe(TRACTORS_GESTORIA.find((m) => m.id === t.id));
      expect(t.fitxa).toBe(readFileSync(t.manifest.fitxa, 'utf8'));
    }
  });

  test('cada font declarada és present (amb el text del disc) o absent, mai les dues coses', () => {
    for (const t of TRACTORS) {
      const presents = t.fonts.map((f) => f.ruta);
      expect([...presents, ...t.fontsAbsents].sort()).toEqual([...t.manifest.fonts].sort());
      for (const font of t.fonts) expect(font.contingut).toBe(readFileSync(font.ruta, 'utf8'));
    }
  });

  test('el nucli de la porta entra a l\'empremta i les proves no hi entren', () => {
    const factures = TRACTORS.find((t) => t.id === 'gestoria.factures');
    expect(factures.fonts.map((f) => f.ruta)).toContain('src/sections/tractors/nucli/aprovacio.js');
    expect(TRACTORS.every((t) => t.fonts.every((f) => !/\.test\.jsx?$/.test(f.ruta)))).toBe(true);
  });

  /* seguretat-01 / governanca-02: el glob ha de poder servir la UI que aplica
     les aprovacions (.jsx) i la porta sencera, no només nucli/. */
  test('el glob porta el .jsx i la porta sencera, però cap prova ni suport de proves', () => {
    for (const esperada of [
      'src/sections/tractors/useTractors.js',
      'src/sections/tractors/registreTractors.js',
      'src/sections/tractors/DialegAprovacio.jsx',
      'src/sections/tractors/PanellTractors.jsx',
      'src/sections/tractors/nucli/aprovacio.js',
      'src/sections/gestoria/ContenidorGestoria.jsx',
      'src/sections/gestoria/enviament/EnviamentGestoria.jsx',
      'src/sections/gestoria/fitxes/gestoria_factures.md'
    ]) expect(RUTES_DEL_CATALEG, esperada).toContain(esperada);
    expect(RUTES_DEL_CATALEG.filter((ruta) => /\.test\./.test(ruta) || ruta.includes('/__fixtures__/'))).toEqual([]);
    expect(Object.isFrozen(RUTES_DEL_CATALEG)).toBe(true);
  });

  test('els tractors de la Gestoria són complets: cap font declarada queda fora del glob', () => {
    expect(TRACTORS.map((t) => [t.id, [...t.fontsAbsents]])).toEqual(TRACTORS_GESTORIA.map((m) => [m.id, []]));
  });

  test('empremtesDelsTractors no llança encara que falten fonts', async () => {
    const infos = await empremtesDelsTractors(subtle);
    expect(infos).toHaveLength(TRACTORS.length);
    for (const [i, info] of infos.entries()) {
      expect(['ok', 'incomplet']).toContain(info.estat);
      expect(info.fontsAbsents).toEqual([...TRACTORS[i].fontsAbsents]);
    }
  });
});
