/* W4-12 (auditoria de Codex, 261004) · Política d'arrel i domini dels atributs
   de presentació (config/theme.js).
   · arrelDePresentacio: on va l'atribut d'una instància. Dins d'un ShadowRoot,
     l'amfitrió; amb l'app ama del document, <html>; en qualsevol altre
     document, l'arrel del mòdul (.sdp-root). Mai l'<html> d'un altre.
   · reclamaAtribut: escriu l'atribut i torna qui el deixa anar. Dues
     instàncies sobre el mateix element no es barallen, i quan se'n va l'última
     l'element recupera el valor de l'amfitrió (o cap, si no n'hi havia).
   · ESDEVENIMENT_CONTRAST: el canal entre instàncies de la mateixa pàgina. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { ATRIBUT_CONTRAST, ESDEVENIMENT_CONTRAST, arrelDePresentacio, reclamaAtribut } from './theme.js';

const html = document.documentElement;
afterEach(() => {
  document.body.replaceChildren();
  html.removeAttribute('data-sentinella');
});

describe('arrelDePresentacio', () => {
  test('en un document alié, l’arrel del mòdul (.sdp-root), encara que el node siga més endins', () => {
    const arrel = document.createElement('div');
    arrel.className = 'sdp-root';
    const main = document.createElement('main');
    arrel.append(main);
    document.body.append(arrel);
    expect(arrelDePresentacio(main, { amaDelDocument: false })).toBe(arrel);
    expect(arrelDePresentacio(arrel, {})).toBe(arrel);
    expect(arrelDePresentacio(arrel)).toBe(arrel);
  });

  test('l’<html> només quan l’app és ama del document', () => {
    const arrel = document.createElement('div');
    arrel.className = 'sdp-root';
    document.body.append(arrel);
    expect(arrelDePresentacio(arrel, { amaDelDocument: true })).toBe(html);
    /* Un valor que no és el booleà true no és cap declaració. */
    expect(arrelDePresentacio(arrel, { amaDelDocument: 'true' })).toBe(arrel);
  });

  test('dins d’un ShadowRoot, l’element amfitrió, siga qui siga l’amo del document', () => {
    const amfitrio = document.createElement('div');
    const ombra = amfitrio.attachShadow({ mode: 'closed' });
    const arrel = document.createElement('div');
    arrel.className = 'sdp-root';
    ombra.append(arrel);
    document.body.append(amfitrio);
    expect(arrelDePresentacio(arrel, { amaDelDocument: false })).toBe(amfitrio);
    expect(arrelDePresentacio(arrel, { amaDelDocument: true })).toBe(amfitrio);
  });

  test('sense node, cap arrel', () => {
    expect(arrelDePresentacio(null)).toBeNull();
    expect(arrelDePresentacio(undefined, { amaDelDocument: true })).toBeNull();
  });
});

describe('reclamaAtribut', () => {
  test('escriu el valor; null el lleva; en deixar-lo anar torna el valor de l’amfitrió', () => {
    html.setAttribute('data-sentinella', 'HOST');
    const deixa = reclamaAtribut(html, 'data-sentinella', 'bancal');
    expect(html.getAttribute('data-sentinella')).toBe('bancal');
    deixa();
    expect(html.getAttribute('data-sentinella')).toBe('HOST');

    const lleva = reclamaAtribut(html, 'data-sentinella', null);
    expect(html.hasAttribute('data-sentinella')).toBe(false);
    lleva();
    expect(html.getAttribute('data-sentinella')).toBe('HOST');
  });

  test('sense valor previ, en deixar-lo anar no en queda cap', () => {
    const element = document.createElement('div');
    const deixa = reclamaAtribut(element, ATRIBUT_CONTRAST, 'bancal');
    expect(element.getAttribute(ATRIBUT_CONTRAST)).toBe('bancal');
    deixa();
    expect(element.hasAttribute(ATRIBUT_CONTRAST)).toBe(false);
  });

  test('dues instàncies sobre el mateix element: desmuntar-ne una no esborra l’altra; l’última torna el de l’amfitrió', () => {
    html.setAttribute('data-sentinella', 'HOST');
    const deixaA = reclamaAtribut(html, 'data-sentinella', 'bancal');
    const deixaB = reclamaAtribut(html, 'data-sentinella', 'bancal');
    deixaA();
    expect(html.getAttribute('data-sentinella')).toBe('bancal');
    deixaB();
    expect(html.getAttribute('data-sentinella')).toBe('HOST');
  });

  test('mana l’última que escriu; quan se’n va, torna el valor de la que queda', () => {
    const element = document.createElement('div');
    const deixaA = reclamaAtribut(element, 'data-sentinella', 'a');
    const deixaB = reclamaAtribut(element, 'data-sentinella', 'b');
    expect(element.getAttribute('data-sentinella')).toBe('b');
    deixaB();
    expect(element.getAttribute('data-sentinella')).toBe('a');
    deixaA();
    expect(element.hasAttribute('data-sentinella')).toBe(false);
  });

  test('deixar-lo anar dues vegades (StrictMode, desmuntatges repetits) no torna a escriure', () => {
    html.setAttribute('data-sentinella', 'HOST');
    const deixa = reclamaAtribut(html, 'data-sentinella', 'bancal');
    deixa();
    html.setAttribute('data-sentinella', 'HOST-DESPRES');
    deixa();
    expect(html.getAttribute('data-sentinella')).toBe('HOST-DESPRES');
  });

  test('sense element, una funció que no fa res', () => {
    const deixa = reclamaAtribut(null, ATRIBUT_CONTRAST, 'bancal');
    expect(deixa).toBeTypeOf('function');
    expect(() => deixa()).not.toThrow();
  });
});

test('el canal entre instàncies té nom propi de Sóc de Poble', () => {
  expect(ESDEVENIMENT_CONTRAST).toBe('sdp:contrast-changed');
});

/* El CSS ha de trobar l'atribut on el posa la política: tokens.css declara el
   Bancal (clar i niat fosc) també per a l'arrel del mòdul, en la MATEIXA regla
   que :root i :host (cap còpia de valors que puga divergir). */
describe('tokens.css casa amb l’arrel del mòdul', () => {
  const TOKENS = readFileSync(resolve(process.cwd(), 'src/css/tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const preludiDe = (selector) => {
    const fi = TOKENS.indexOf(`${selector} {`);
    expect(fi, `falta ${selector}`).toBeGreaterThan(-1);
    const inici = TOKENS.lastIndexOf('}', fi) + 1;
    return TOKENS.slice(inici, fi + selector.length).split(',').map((s) => s.trim());
  };

  test('Bancal clar: .sdp-root[data-contrast="bancal"] al costat de :root i :host', () => {
    const selectors = preludiDe(':host([data-contrast="bancal"]) .sdp-root');
    expect(selectors).toEqual(expect.arrayContaining([
      '.sdp-root[data-contrast="bancal"]', ':root[data-contrast="bancal"]', ':host([data-contrast="bancal"])'
    ]));
  });

  test('Bancal fosc niat: el tema a l’<html> i el contrast a l’arrel del mòdul', () => {
    const selectors = preludiDe(':host([data-theme="dark"][data-contrast="bancal"]) .sdp-root');
    expect(selectors).toEqual(expect.arrayContaining([
      ':root[data-theme="dark"] .sdp-root[data-contrast="bancal"]', ':root[data-theme="dark"][data-contrast="bancal"]'
    ]));
  });
});
