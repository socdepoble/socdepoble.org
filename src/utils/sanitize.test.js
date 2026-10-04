import { describe, it, expect } from 'vitest';
import { sanitizeHtml, esFontImatgeSegura } from './sanitize.js';

describe('sanitize.js', () => {
  describe('esFontImatgeSegura', () => {
    it('accepta sdp-media://mitjans_privats/', () => {
      expect(esFontImatgeSegura('sdp-media://mitjans_privats/123/foto.jpg')).toBe(true);
    });

    it('accepta sdp-media://mitjans/', () => {
      expect(esFontImatgeSegura('sdp-media://mitjans/123/foto.jpg')).toBe(true);
    });

    it('rebutja sdp-media://un_altre_bucket/', () => {
      expect(esFontImatgeSegura('sdp-media://un_altre_bucket/foto.jpg')).toBe(false);
    });

    it('rebutja rutes http externes no llistades', () => {
      expect(esFontImatgeSegura('http://evilsite.com/foto.jpg')).toBe(false);
    });

    it('accepta data URIs', () => {
      expect(esFontImatgeSegura('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')).toBe(true);
    });
  });

  describe('sanitizeHtml', () => {
    it('permet <s> i <u> i class (C15)', () => {
      const html = '<p class="sdp-imatge-cos">text <s>ratllat</s> i <u>subratllat</u></p>';
      expect(sanitizeHtml(html)).toContain('<p class="sdp-imatge-cos">text <s>ratllat</s> i <u>subratllat</u></p>');
    });

    it('sobreviu imatge de sdp-media://mitjans', () => {
      const html = '<img src="sdp-media://mitjans/foto.jpg" alt="foto" />';
      const resultat = sanitizeHtml(html);
      // El ganxo afegirà loading="lazy" i altres atributs
      expect(resultat).toContain('src="sdp-media://mitjans/foto.jpg"');
      expect(resultat).not.toContain('data-sdp-bloquejada');
    });

    it('sobreviu imatge de sdp-media://mitjans_privats', () => {
      const html = '<img src="sdp-media://mitjans_privats/foto.jpg" alt="foto" />';
      const resultat = sanitizeHtml(html);
      expect(resultat).toContain('src="sdp-media://mitjans_privats/foto.jpg"');
      expect(resultat).not.toContain('data-sdp-bloquejada');
    });

    it('bloqueja imatges no segures i lleva el src', () => {
      const html = '<img src="http://evilsite.com/foto.jpg" alt="foto" />';
      const resultat = sanitizeHtml(html);
      expect(resultat).not.toContain('src="');
      expect(resultat).toContain('data-sdp-bloquejada="1"');
    });

    it.each(['docs/guia.md', 'pagina2', 'memoria.md', '#seccio', '/wiki?item=x', 'https://socdepoble.org/x', 'mailto:hola@example.test'])(
      'conserva l’href relatiu o permés %s', (href) => {
        expect(sanitizeHtml(`<a href="${href}">x</a>`)).toContain(`href="${href}"`);
      });

    it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'vbscript:x', 'data:text/html,x', '//evil.test/x', ' //evil.test/x'])(
      'lleva l’href perillós %s', (href) => {
        expect(sanitizeHtml(`<a href="${href}">x</a>`)).not.toContain('href=');
      });
  });

  /* T7 (ordre del Mestre, 261004) · Les targetes incrustades viatgen com a
     div amb data-* (DOMPurify té ALLOW_DATA_ATTR per defecte i cap prova ho
     fixava). Si mai es tancaren, les targetes desapareixerien sense avís. */
  describe('targetes incrustades (data-*)', () => {
    const TARGETA = '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="esquerra">'
      + '<div data-sdp-targeta="publicacio:1" class="sdp-targeta" data-ruta="/mur/1" data-titol="La festa" data-imatge="/assets/mur/1.webp" data-autor-ruta="/perfil/persona/pep">'
      + '<a href="/mur/1" rel="noopener noreferrer nofollow">La festa</a></div></div>';

    it('data-sdp-targetes, data-sdp-targeta, data-alineacio, data-ruta i la resta sobreviuen, byte a byte', () => {
      expect(sanitizeHtml(TARGETA)).toBe(TARGETA);
    });

    it('style i els on* d’eixos div se’n van; les dades es queden', () => {
      const brut = '<div data-sdp-targetes="" style="position:fixed" onclick="alert(1)"><div data-sdp-targeta="publicacio:1" onmouseover="alert(2)" style="color:red" data-titol="T"></div></div>';
      const net = sanitizeHtml(brut);
      expect(net).not.toMatch(/style=|onclick|onmouseover/);
      expect(net).toContain('data-sdp-targeta="publicacio:1"');
      expect(net).toContain('data-titol="T"');
    });

    it('un atribut amb una seqüència de comentari s’esborra sencer (per això la instantània no porta < ni >)', () => {
      expect(sanitizeHtml('<div data-titol="a --> b">x</div>')).toBe('<div>x</div>');
    });
  });
});
