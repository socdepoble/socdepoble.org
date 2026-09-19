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
  });
});
