import { describe, expect, test } from 'vitest';
import { esHostSospitos, segmentaEnllacos } from './enllacos.js';

describe('enllaços del xat', () => {
  test('un text sense URL és un sol segment de text', () => {
    expect(segmentaEnllacos('Bon dia a tots')).toEqual([{ tipus: 'text', text: 'Bon dia a tots' }]);
    expect(segmentaEnllacos('')).toEqual([]);
    expect(segmentaEnllacos(null)).toEqual([]);
  });

  test('troba http i https, conserva el text del voltant i lleva la puntuació final', () => {
    const segments = segmentaEnllacos('Mira https://socdepoble.org/mur. I també http://exemple.cat/a?b=1, val?');
    expect(segments).toEqual([
      { tipus: 'text', text: 'Mira ' },
      { tipus: 'enllac', text: 'https://socdepoble.org/mur', href: 'https://socdepoble.org/mur', host: 'socdepoble.org', sospitos: false },
      { tipus: 'text', text: '. I també ' },
      { tipus: 'enllac', text: 'http://exemple.cat/a?b=1', href: 'http://exemple.cat/a?b=1', host: 'exemple.cat', sospitos: false },
      { tipus: 'text', text: ', val?' }
    ]);
  });

  test('marca com a sospitosos els dominis amb punycode, també escrits amb Unicode', () => {
    expect(esHostSospitos('xn--pple-43d.com')).toBe(true);
    expect(esHostSospitos('socdepoble.org')).toBe(false);
    const [enllac] = segmentaEnllacos('http://xn--pple-43d.com/entra');
    expect(enllac.sospitos).toBe(true);
    const [unicode] = segmentaEnllacos('https://аpple.com');
    expect(unicode.tipus).toBe('enllac');
    expect(unicode.sospitos).toBe(true);
  });

  test('mai produïx HTML ni toca protocols que no siguen web', () => {
    const segments = segmentaEnllacos('<b>javascript:alert(1)</b> i ftp://res');
    expect(segments).toEqual([{ tipus: 'text', text: '<b>javascript:alert(1)</b> i ftp://res' }]);
  });
});
