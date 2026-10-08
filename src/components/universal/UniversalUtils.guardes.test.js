/**
 * Relleu 261007 («Límits» §5) · Les guardes de l'avatar i de la marca de la
 * capçalera (esAvatarSegur, camiDe i esMarcaDeLEntitat) vivien copiades a
 * PageFrame.jsx, detail/elementDeSeccio.js i mercat/imatgesDeProducte.js. Ara
 * són d'UniversalUtils.js, amb el mateix cos: estes proves en fixen la regla,
 * i les de PageFrame (avatar i logotip), elementDeSeccio (logotip) i el
 * carrusel (imatgesDeProducte) continuen fixant el DOM de cada consumidor.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { camiDe, esAvatarSegur, esMarcaDeLEntitat, DEFAULT_AUTHOR } from './UniversalUtils.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

const QUADRAT_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const NEGRE = '/assets/system/ui/logo-socdepoble-rect-negre.svg';
const BLANC = '/assets/system/ui/logo-socdepoble-rect-blanc.svg';
const PAQUET = 'https://wp.example/wp-content/plugins/soc-de-poble/dist';

afterEach(() => {
  fixaBaseRecursos('/');
});

describe('camiDe', () => {
  test('el camí, sense origen, consulta ni fragment; si no s’analitza, el text', () => {
    expect(camiDe('/assets/a.png?v=2#x')).toBe('/assets/a.png');
    expect(camiDe('https://cdn.example/assets/a.png')).toBe('/assets/a.png');
    expect(camiDe('assets/a.png')).toBe('/assets/a.png');
    expect(camiDe('http://[no-es-url')).toBe('http://[no-es-url');
  });
});

describe('esAvatarSegur', () => {
  test('segur abans i després de resoldre’l (isSafeAsset)', () => {
    expect(esAvatarSegur('/assets/a.png')).toBe(true);
    expect(esAvatarSegur('https://cdn.example/a.png')).toBe(true);
    expect(esAvatarSegur('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    for (const dolent of ['', 'javascript:alert(1)', '//altre.example/a.png', 'sdp-media://mitjans/a.webp', null, 42]) {
      expect(esAvatarSegur(dolent), String(dolent)).toBe(false);
    }
  });
});

describe('esMarcaDeLEntitat', () => {
  test('la marca de Sóc de Poble, escrita com a camí, resolta o com a URL absoluta del mateix fitxer', () => {
    for (const marca of [QUADRAT_VERD, NEGRE, BLANC, DEFAULT_AUTHOR.avatarUrl, `https://socdepoble.org${QUADRAT_VERD}?v=1`]) {
      expect(esMarcaDeLEntitat(marca), marca).toBe(true);
    }
    expect(esMarcaDeLEntitat('/assets/gent/pepa.webp')).toBe(false);
  });

  test('amb la base de l’amfitrió, també la marca ja resolta pel paquet', () => {
    fixaBaseRecursos(PAQUET);
    expect(esMarcaDeLEntitat(QUADRAT_VERD)).toBe(true);
    expect(esMarcaDeLEntitat(`${PAQUET}${NEGRE}`)).toBe(true);
    expect(esMarcaDeLEntitat(DEFAULT_AUTHOR.avatarUrl)).toBe(true);
    expect(esMarcaDeLEntitat(`${PAQUET}/assets/gent/pepa.webp`)).toBe(false);
  });
});
