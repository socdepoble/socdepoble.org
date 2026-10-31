/* P1-06 · La graella d'emojis no ensenya els que el navegador no sap pintar.
   Cap prova no depén del canvas de jsdom (no n'hi ha): la mesura s'injecta.
   Les amplades de mostra són les del banc de Chrome 156 headless a macOS
   (261030, measureText a 32px): 😀 i qualsevol emoji pintable, 32; el tofu
   (U+1FFFD i els punts d'Unicode 18 que el tipus de lletra encara no porta:
   🫹 U+1FAF9, 🛙 U+1F6D9), 20,28; ♀️, 32. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { EMOJI_DE_REFERENCIA, creaDetectorDePintat, detectorDePintat, emojisPintables } from './emojiPintable.js';

const TOFU = 20.28;
const AMPLES = new Map([
  [EMOJI_DE_REFERENCIA, 32],
  ['\u{1FFFD}', TOFU],
  ['\u{1F600}‍\u{1F600}', 64],
  ['\u{1FAF9}', TOFU], // 🫹 (Unicode 18, sense glif)
  ['\u{1FAF9}\u{1F3FB}', TOFU + 32], // 🫹🏻: tofu més la mostra de color de pell
  ['\u{1F9D1}‍\u{1F9D1}‍\u{1F9D2}', 32], // 🧑‍🧑‍🧒: un sol glif
  ['\u{1F426}‍\u{1F525}', 64], // 🐦‍🔥 en un sistema que no el porta: dos glifs
  ['♀️', 32], // ♀️: el test de color el tombava; l'amplada, no
  ['\u{1F1EA}\u{1F1F8}', 36] // 🇪🇸 una mica més ample: dins del marge
]);
const mesuraDeChrome = (text) => AMPLES.get(text) ?? 32;

describe('creaDetectorDePintat', () => {
  test('un emoji pintable és un sol glif de l’amplada de 😀: el tofu i les seqüències partides, no', () => {
    const pinta = creaDetectorDePintat(mesuraDeChrome);
    expect(typeof pinta).toBe('function');
    expect(pinta('\u{1FAF9}')).toBe(false);
    expect(pinta('\u{1FAF9}\u{1F3FB}')).toBe(false);
    expect(pinta('\u{1F426}‍\u{1F525}')).toBe(false);
    expect(pinta('\u{1F9D1}‍\u{1F9D1}‍\u{1F9D2}')).toBe(true);
    expect(pinta('♀️')).toBe(true);
    expect(pinta('\u{1F1EA}\u{1F1F8}')).toBe(true);
    expect(pinta('\u{1F345}')).toBe(true);
  });

  /* Cicle 4 (auditoria matinal 261030_1217, MILLORA-02, rebutjada) · Cap
     drecera per als emojis d'un sol punt de codi: són justament els d'Unicode
     nou que el motor ja coneix i el tipus de lletra encara no porta (el tofu
     que P1-06 amaga). Es mesuren com tots, i el tofu no passa. */
  test('MILLORA-02 · un sol punt de codi també es mesura: el tofu d’Unicode nou no passa per drecera', () => {
    const mesura = vi.fn(mesuraDeChrome);
    const pinta = creaDetectorDePintat(mesura);
    expect(pinta('\u{1FAF9}')).toBe(false);
    expect(mesura).toHaveBeenCalledWith('\u{1FAF9}');
    const nou = [{ id: 'nous', emojis: [['1FAF9', '\u{1FAF9}', 'nou'], ['1F345', '\u{1F345}', 'tomato']] }];
    expect(emojisPintables(nou, { reconeix: (glif) => glif, potPintar: pinta }).flatMap((g) => g.emojis.map(([codi]) => codi))).toEqual(['1F345']);
  });

  test('es comprova a si mateix: sense mesura fiable, cap detector (només mana emojiSol)', () => {
    expect(creaDetectorDePintat(null)).toBeNull();
    expect(creaDetectorDePintat(() => 32)).toBeNull(); // mesura constant (soroll, canvas mut): el tofu fa com un emoji
    expect(creaDetectorDePintat((t) => (t === '\u{1F600}‍\u{1F600}' ? 32 : mesuraDeChrome(t)))).toBeNull(); // el parell no es veu partit
    expect(creaDetectorDePintat((t) => (t === '\u{1FFFD}' ? 30 : mesuraDeChrome(t)))).toBeNull(); // el tofu dins del marge
    expect(creaDetectorDePintat(() => 0)).toBeNull();
    expect(creaDetectorDePintat(() => Number.NaN)).toBeNull();
    expect(creaDetectorDePintat(() => { throw new Error('sense canvas'); })).toBeNull();
  });

  test('mesura cada glif una sola vegada, i una mesura que falla no amaga l’emoji', () => {
    const mesura = vi.fn(mesuraDeChrome);
    const pinta = creaDetectorDePintat(mesura);
    const abans = mesura.mock.calls.length;
    pinta('\u{1FAF9}');
    pinta('\u{1FAF9}');
    expect(mesura.mock.calls.length).toBe(abans + 1);
    const ambFallada = creaDetectorDePintat((t) => {
      if (t === '\u{1F33D}') throw new Error('fallada puntual');
      return mesuraDeChrome(t);
    });
    expect(ambFallada('\u{1F33D}')).toBe(true);
  });
});

describe('emojisPintables', () => {
  const GRUPS = Object.freeze([
    { id: 'gestos', nom: 'Gestos', extra: 1, emojis: [['1FAF9', '\u{1FAF9}', 'nou'], ['1F44B', '\u{1F44B}', 'waving hand'], ['1FAF9 1F3FB', '\u{1FAF9}\u{1F3FB}', 'nou: to clar']] },
    { id: 'nous', nom: 'Només nous', emojis: [['1F6D9', '\u{1F6D9}', 'nou']] },
    { id: 'text', nom: 'Text', emojis: [['61', 'ab', 'no és cap emoji'], ['1F345', '\u{1F345}', 'tomato']] }
  ]);
  const pinta = creaDetectorDePintat((t) => (t === '\u{1F6D9}' ? TOFU : mesuraDeChrome(t)));

  test('lleva el que no es reconeix o no es pinta, i els grups que es queden buits; conserva l’ordre i la resta de camps', () => {
    const grups = emojisPintables(GRUPS, { potPintar: pinta });
    expect(grups.map((g) => [g.id, g.extra, g.emojis.map(([codi]) => codi)])).toEqual([
      ['gestos', 1, ['1F44B']],
      ['text', undefined, ['1F345']]
    ]);
    expect(GRUPS[0].emojis).toHaveLength(3);
  });

  test('sense detector, només la capa 1 (el criteri que refusa en triar): el que el motor no reconeix', () => {
    const grups = emojisPintables(GRUPS, { potPintar: null });
    expect(grups.flatMap((g) => g.emojis.map(([codi]) => codi))).not.toContain('61');
    const safari16 = (glif) => ([...glif].some((c) => c.codePointAt(0) >= 0x1FAF0) ? null : glif);
    expect(emojisPintables(GRUPS, { reconeix: safari16, potPintar: null }).map((g) => [g.id, g.emojis.map(([codi]) => codi)])).toEqual([
      ['gestos', ['1F44B']],
      ['nous', ['1F6D9']],
      ['text', ['61', '1F345']]
    ]);
    expect(emojisPintables(null)).toEqual([]);
  });
});

describe('detectorDePintat (el del navegador)', () => {
  afterEach(() => vi.restoreAllMocks());

  test('sota jsdom no toca el canvas (no l’implementa): cap detector i cap avís a la consola', async () => {
    /* Un mòdul fresc: el detector es crea una vegada per sessió, i les
       proves d'abans ja l'haurien pogut crear. */
    vi.resetModules();
    const fresc = await import('./emojiPintable.js');
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    expect(fresc.detectorDePintat()).toBeNull();
    expect(getContext).not.toHaveBeenCalled();
    expect(fresc.emojisPintables([{ id: 'a', emojis: [['1F345', '\u{1F345}', 'tomato']] }]).length).toBe(1);
    expect(detectorDePintat()).toBeNull();
    expect(emojisPintables([{ id: 'a', emojis: [['1F345', '\u{1F345}', 'tomato']] }]).length).toBe(1);
  });

  test('sense document (un treballador, Node), cap detector', async () => {
    vi.resetModules();
    vi.stubGlobal('document', undefined);
    try {
      const fresc = await import('./emojiPintable.js');
      expect(fresc.detectorDePintat()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
