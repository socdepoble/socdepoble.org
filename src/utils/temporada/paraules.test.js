// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { arrel, normalitza, paraules } from './paraules.js';

describe('normalitza', () => {
  test('minúscules, sense diacrítics ni signes', () => {
    expect(normalitza('  CREÏLLES  ')).toBe('creilles');
    expect(normalitza('Ñora i piñón')).toBe('nora i pinon');
    expect(normalitza('Pebrots de colors: roig, groc i verd')).toBe('pebrots de colors roig groc i verd');
    expect(normalitza('Plátano C1ª')).toBe('platano c1');
    expect(normalitza('Salsa 80% tomaca')).toBe('salsa 80 tomaca');
  });

  test('la ela geminada val per «ll», amb punt volat o de partició', () => {
    expect(normalitza('Brussel·les')).toBe('brusselles');
    expect(normalitza('Brussel‧les')).toBe('brusselles');
    expect(normalitza('BRUSSEL·LES')).toBe('brusselles');
  });

  test('la -ó i la -à tòniques finals s’escriuen -on i -an; dins de la paraula, no', () => {
    expect(normalitza('Meló')).toBe('melon');
    expect(normalitza('meló d’Alger')).toBe('melon d alger');
    expect(normalitza("meló d'Alger")).toBe('melon d alger');
    expect(normalitza('Paraguaià')).toBe('paraguaian');
    expect(normalitza('Melón')).toBe('melon');
    expect(normalitza('Bròquil')).toBe('broquil');
  });

  test('el mateix text en NFC i en NFD dona el mateix', () => {
    const nfd = 'Meló'.normalize('NFD');
    expect(nfd).not.toBe('Meló');
    expect(normalitza(nfd)).toBe('melon');
    expect(normalitza('Creïlles'.normalize('NFD'))).toBe('creilles');
  });

  test('el que no és text és buit', () => {
    for (const dolent of [null, undefined, 12, {}, [], true]) expect(normalitza(dolent), String(dolent)).toBe('');
    expect(normalitza('   ')).toBe('');
    expect(normalitza('—·—')).toBe('');
  });
});

describe('paraules', () => {
  test('les paraules en ordre, sense buides', () => {
    expect(paraules('Ram de Tomaques')).toEqual(['ram', 'de', 'tomaques']);
    expect(paraules('Amanida 3 colors: enciam, safanòria i col')).toEqual(['amanida', '3', 'colors', 'enciam', 'safanoria', 'i', 'col']);
    expect(paraules('')).toEqual([]);
    expect(paraules(null)).toEqual([]);
  });
});

describe('arrel', () => {
  /* Cada grup: les formes d'una paraula, que han de fer la mateixa arrel. */
  const GRUPS = [
    ['tomaca', 'tomaques'], ['tomate', 'tomates', 'tomata'], ['taronja', 'taronges'], ['naranja', 'naranjas'],
    ['creilla', 'creilles'], ['patata', 'patatas', 'patates'], ['carxofa', 'carxofes'], ['alcachofa', 'alcachofas'],
    ['bajoqueta', 'bajoquetes'], ['judia', 'judias'], ['figa', 'figues'], ['pastanaga', 'pastanagues'],
    ['lechuga', 'lechugas'], ['lletuga', 'lletugues'], ['melon', 'melons', 'melones'], ['carabasson', 'carabassons'],
    ['calabacin', 'calabacines'], ['limon', 'limones'], ['llima', 'llimes'], ['espinac', 'espinacs', 'espinaques', 'espinaca', 'espinacas'],
    ['all', 'alls'], ['ajo', 'ajos'], ['col', 'cols', 'coles'], ['coliflor', 'coliflors', 'coliflores'], ['nap', 'naps'],
    ['caqui', 'caquis'], ['albaricoque', 'albaricoques'], ['pressec', 'pressecs'], ['raim', 'raims'], ['uva', 'uvas'],
    ['sec', 'secs', 'seca', 'seques', 'seco', 'secos'], ['frito', 'frita', 'fritos', 'fritas'], ['congelada', 'congelades'],
    ['esparrago', 'esparragos'], ['aranja', 'aranges']
  ];

  test('les formes d’una paraula fan la mateixa arrel', () => {
    for (const grup of GRUPS) {
      const arrels = new Set(grup.map(arrel));
      expect([...arrels], grup.join(', ')).toHaveLength(1);
    }
  });

  test('exemples de la capçalera', () => {
    expect(arrel('tomaques')).toBe('tomac');
    expect(arrel('tomates')).toBe('tomat');
    expect(arrel('taronges')).toBe('taronj');
    expect(arrel('figues')).toBe('fij');
    expect(arrel('melones')).toBe('melon');
  });

  test('paraules diferents que s’assemblen fan arrels diferents', () => {
    const parelles = [
      ['carabassa', 'carabasson'], ['melon', 'mel'], ['pepino', 'pepinillo'], ['cebolla', 'cebollino'],
      ['limon', 'limonada'], ['llima', 'lima'], ['taronja', 'aranja'], ['pebrot', 'pebre'], ['col', 'coliflor'],
      ['fresa', 'fresc'], ['patata', 'patatilla'], ['naranja', 'naranjada'], ['agua', 'ajo'], ['aguas', 'ajos'],
      ['aigua', 'all']
    ];
    for (const [a, b] of parelles) expect(arrel(a), `${a} / ${b}`).not.toBe(arrel(b));
  });

  test('les paraules curtes no perden la -s ni la vocal fins a quedar-se en res', () => {
    expect(arrel('gas')).toBe('gas');
    expect(arrel('ous')).toBe('ous');
    expect(arrel('de')).toBe('de');
    expect(arrel('a')).toBe('a');
    expect(arrel('')).toBe('');
    expect(arrel(null)).toBe('');
  });
});
