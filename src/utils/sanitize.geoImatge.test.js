import { describe, expect, test } from 'vitest';
import { sanitizeHtml } from './sanitize.js';

/* P1-64 (pla 261028_1526 §3.1.1) · El registre d'una foto del cos (data-lat,
   data-lng, data-precisio i data-captura de l'<img>, SdpImage) passa pel
   sanejador sense tocar sanitize.js: DOMPurify deixa els data-* de sèrie
   (ALLOW_DATA_ATTR), també en el mode estricte del cos publicat
   ({ imatgesPropies: true }, cosAmbImatgesPropies). Una <img> de fora perd el
   src, però el sanejador no inventa ni lleva cap altre atribut. */
const IMG = '<img src="/assets/uploads/poble/font.webp" alt="Font" data-lat="38.592" data-lng="-0.418" data-precisio="100m" data-captura="2017-05-14T10:22:33">';
const imatgeDe = (html) => new DOMParser().parseFromString(html, 'text/html').querySelector('img');
const dades = (img) => ['data-lat', 'data-lng', 'data-precisio', 'data-captura'].map((a) => img.getAttribute(a));

describe('P1-64 · els data-* de la foto del cos sobreviuen al sanejador', () => {
  test('sanitizeHtml de sèrie', () => {
    expect(dades(imatgeDe(sanitizeHtml(IMG)))).toEqual(['38.592', '-0.418', '100m', '2017-05-14T10:22:33']);
  });

  test('el mode estricte del cos publicat (imatgesPropies)', () => {
    const img = imatgeDe(sanitizeHtml(IMG, { imatgesPropies: true }));
    expect(img.getAttribute('src')).toBe('/assets/uploads/poble/font.webp');
    expect(dades(img)).toEqual(['38.592', '-0.418', '100m', '2017-05-14T10:22:33']);
  });

  test('un atribut d’esdeveniment al costat continua fora', () => {
    const img = imatgeDe(sanitizeHtml(IMG.replace('<img ', '<img onerror="alert(1)" ')));
    expect(img.hasAttribute('onerror')).toBe(false);
    expect(img.getAttribute('data-lat')).toBe('38.592');
  });
});
