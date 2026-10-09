/**
 * Relleu 261007 («Límits» §5) · Les guardes de l'avatar i de la marca de la
 * capçalera (esAvatarSegur, camiDe i esMarcaDeLEntitat) vivien copiades a
 * PageFrame.jsx, detail/elementDeSeccio.js i mercat/imatgesDeProducte.js. Ara
 * són d'UniversalUtils.js, amb el mateix cos: estes proves en fixen la regla,
 * i les de PageFrame (avatar i logotip), elementDeSeccio (logotip) i el
 * carrusel (imatgesDeProducte) continuen fixant el DOM de cada consumidor.
 */
import { afterEach, describe, expect, test } from 'vitest';
import { camiDe, camiDeLaMarca, esAvatarSegur, esMarcaDeLEntitat, DEFAULT_AUTHOR, MARQUES_SVG_ANTIGUES } from './UniversalUtils.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

/* Onada 8 (261009) · Els SVG d'abans: les files del servidor encara els porten. */
const QUADRAT_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const NEGRE = '/assets/system/ui/logo-socdepoble-rect-negre.svg';
const BLANC = '/assets/system/ui/logo-socdepoble-rect-blanc.svg';
/* Onada 8 (261009) · Els PNG d'ara (DEFAULT_AUTHOR). */
const QUADRAT_VERD_PNG = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const NEGRE_PNG = '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png';
const BLANC_PNG = '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png';
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

  /* Onada 8 (261009) · La marca és el PNG, i l'SVG d'abans continua sent-ho. */
  test('els PNG d’ara i els SVG d’abans: totes dues formes són la marca', () => {
    expect([DEFAULT_AUTHOR.avatarUrl, DEFAULT_AUTHOR.logo.clar, DEFAULT_AUTHOR.logo.fosc]).toEqual([QUADRAT_VERD_PNG, NEGRE_PNG, BLANC_PNG]);
    expect(MARQUES_SVG_ANTIGUES).toEqual({ avatar: QUADRAT_VERD, clar: NEGRE, fosc: BLANC });
    expect(Object.isFrozen(MARQUES_SVG_ANTIGUES)).toBe(true);
    for (const marca of [QUADRAT_VERD_PNG, NEGRE_PNG, BLANC_PNG, `https://socdepoble.org${BLANC_PNG}?v=2`]) {
      expect(esMarcaDeLEntitat(marca), marca).toBe(true);
    }
    // Un altre logotip del mateix directori no és la marca.
    expect(esMarcaDeLEntitat('/assets/system/ui/logo-socdepoble-rect.svg')).toBe(false);
    expect(esMarcaDeLEntitat('/assets/system/ui/og-socdepoble-1200x630.png')).toBe(false);
  });

  test('amb la base de l’amfitrió, també la marca ja resolta pel paquet', () => {
    fixaBaseRecursos(PAQUET);
    expect(esMarcaDeLEntitat(QUADRAT_VERD)).toBe(true);
    expect(esMarcaDeLEntitat(`${PAQUET}${NEGRE}`)).toBe(true);
    expect(esMarcaDeLEntitat(`${PAQUET}${NEGRE_PNG}`)).toBe(true);
    expect(esMarcaDeLEntitat(QUADRAT_VERD_PNG)).toBe(true);
    expect(esMarcaDeLEntitat(DEFAULT_AUTHOR.avatarUrl)).toBe(true);
    expect(esMarcaDeLEntitat(`${PAQUET}/assets/gent/pepa.webp`)).toBe(false);
  });
});

describe('camiDeLaMarca', () => {
  test('l’SVG d’abans dona el camí del seu PNG; la resta, el camí resolt de sempre', () => {
    expect(camiDeLaMarca(QUADRAT_VERD)).toBe(QUADRAT_VERD_PNG);
    expect(camiDeLaMarca(`https://socdepoble.org${NEGRE}?v=1`)).toBe(NEGRE_PNG);
    expect(camiDeLaMarca(BLANC)).toBe(BLANC_PNG);
    expect(camiDeLaMarca(BLANC_PNG)).toBe(BLANC_PNG);
    expect(camiDeLaMarca('/assets/gent/pepa.webp?v=3')).toBe('/assets/gent/pepa.webp');
  });

  test('amb la base de l’amfitrió, els dos camins penjen del paquet', () => {
    fixaBaseRecursos(PAQUET);
    const dePaquet = camiDe(`${PAQUET}${QUADRAT_VERD_PNG}`);
    expect(camiDeLaMarca(QUADRAT_VERD)).toBe(dePaquet);
    expect(camiDeLaMarca(`${PAQUET}${QUADRAT_VERD}`)).toBe(dePaquet);
    expect(camiDeLaMarca(QUADRAT_VERD_PNG)).toBe(dePaquet);
  });
});
