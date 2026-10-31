/* QA-R2-06 (Codex, Ronda 2 de l'onada 1605/2258; criteri nou del prompt
   2258: escapes `\*`) · La paritat de les barres invertides just davant d'un
   asterisc: una tira SENAR l'escapa (és text i no obri ni tanca cap negreta);
   una tira PARELL no l'escapa (les barres són text i l'asterisc pot obrir o
   tancar). Abans, «\*hola*» feia negreta i conservava la barra. Les barres es
   pinten tal qual (cap canvi del text de ningú), i el recorregut continua
   sent lineal: cap expressió amb retrocés (porta de ReDoS, P1-21). Les
   adreces continuen sent peces opaques (QA-B01..B03 no es reobrin). */
import { describe, expect, test } from 'vitest';
import { marquesDeNegreta, segmentaNegreta, senseMarquesDeNegreta } from './negreta.js';
import { segmentaEnllacos, tokenitzaText } from './enllacos.js';

const B = '\\';

describe('QA-R2-06 · paritat de barres davant de l’asterisc', () => {
  test('una barra (senar) escapa l’asterisc d’obertura: «\\*hola*» és text', () => {
    expect(marquesDeNegreta(`${B}*hola*`)).toEqual([]);
    expect(marquesDeNegreta(`mira ${B}*hola* ara`)).toEqual([]);
  });

  test('dues barres (parell) no escapen: «\\\\*negreta*» és negreta', () => {
    expect(marquesDeNegreta(`${B}${B}*negreta*`)).toEqual([{ obre: 2, tanca: 10, amplada: 1 }]);
  });

  test('tres barres (senar) tornen a escapar: «\\\\\\*literal*» és text', () => {
    expect(marquesDeNegreta(`${B}${B}${B}*literal*`)).toEqual([]);
  });

  test('el tancament: «*hola\\*» no tanca; «*hola\\\\*» sí', () => {
    expect(marquesDeNegreta(`*hola${B}*`)).toEqual([]);
    expect(marquesDeNegreta(`*hola${B}${B}*`)).toEqual([{ obre: 0, tanca: 7, amplada: 1 }]);
  });

  test('la doble: «\\**hola**» no és negreta; «\\\\**hola**» sí', () => {
    expect(marquesDeNegreta(`${B}**hola**`)).toEqual([]);
    expect(marquesDeNegreta(`${B}${B}**hola**`)).toEqual([{ obre: 2, tanca: 8, amplada: 2 }]);
  });

  test('un salt de línia talla la tira de barres', () => {
    expect(marquesDeNegreta(`${B}\n*hola*`)).toEqual([{ obre: 2, tanca: 7, amplada: 1 }]);
  });

  test('el text es pinta tal qual: les barres es conserven i no hi ha cap <strong>', () => {
    const font = `${B}*hola*`;
    expect(segmentaNegreta(segmentaEnllacos(font))).toEqual([{ negreta: false, segments: [{ tipus: 'text', text: font }] }]);
    expect(senseMarquesDeNegreta(font)).toBe(font);
  });

  test('dins d’una adreça opaca no hi ha cap marca (QA-B03), amb barres o sense', () => {
    const adreca = `https://example.test/?q=${B}*x*`;
    const { adreces, marques } = tokenitzaText(adreca);
    expect(marques).toEqual([]);
    expect(adreces).toHaveLength(1);
    expect(adreces[0].text).toBe(adreca);
    expect(marquesDeNegreta('https://example.test/search?q=foo*')).toEqual([]);
    expect(marquesDeNegreta('**https://example.test/**')).toEqual([{ obre: 0, tanca: 23, amplada: 2 }]);
  });

  test('fora de l’adreça la paritat mana: l’asterisc escapat de la cua d’una adreça no tanca la negreta', () => {
    expect(marquesDeNegreta(`${B}*mira https://a.test/ ara*`)).toEqual([]);
    const font = `*mira https://a.test/x${B}* ara*`;
    const { adreces, marques } = tokenitzaText(font);
    expect(adreces.map((a) => a.text)).toEqual([`https://a.test/x${B}*`]);
    expect(marques).toEqual([{ obre: 0, tanca: font.length - 1, amplada: 1 }]);
  });

  test('lineal: 50.000 barres seguides davant d’un asterisc acaben en menys de 50 ms', () => {
    const parell = `${B.repeat(50000)}*hola*`;
    const senar = `${B.repeat(50001)}*hola*`;
    const t0 = performance.now();
    const ambNegreta = marquesDeNegreta(parell);
    const senseNegreta = marquesDeNegreta(senar);
    const ms = performance.now() - t0;
    expect(ambNegreta).toEqual([{ obre: 50000, tanca: 50005, amplada: 1 }]);
    expect(senseNegreta).toEqual([]);
    expect(ms).toBeLessThan(50);
  });
});
