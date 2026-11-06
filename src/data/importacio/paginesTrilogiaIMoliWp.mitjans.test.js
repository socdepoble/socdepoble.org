import { createHash, webcrypto } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { MITJANS_WP_LOCALS } from './paginesTrilogiaIMoliWp.mitjans.js';
import { carregaPaginesTrilogiaIMoliWp, FONT_PAGINES_WP_SHA256 } from './paginesTrilogiaIMoliWp.js';
import { transformaPaginaTrilogiaIMoliWp } from './paginesTrilogiaIMoliEditorial.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
beforeAll(() => vi.stubGlobal('crypto', webcrypto));
afterAll(() => vi.unstubAllGlobals());
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const typeOf = bytes => bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg'
  : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp'
    : bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png' : 'unsupported';
describe('R24 · mitjans propis amb procedència, sense permisos remots', () => {
  test('el registre conté només URL exactes del corpus i cada còpia concorda en bytes/MIME/SHA/mode', async () => {
    const pages = await carregaPaginesTrilogiaIMoliWp();
    const urls = new Set(pages.flatMap(page => [...page.images, page.featured_image].filter(Boolean)).map(url => new URL(url).href));
    expect(urls.size).toBe(87); expect(Object.keys(MITJANS_WP_LOCALS)).toHaveLength(47);
    for (const [url, record] of Object.entries(MITJANS_WP_LOCALS)) {
      expect(urls.has(url)).toBe(true); expect(Object.isFrozen(record)).toBe(true);
      expect(record.sourceSha256).toBe(FONT_PAGINES_WP_SHA256);
      expect(record.path).toMatch(/^\/assets\/importacio-wp\/wp-[a-f0-9]{24}-[a-f0-9]{16}\.(?:webp|jpg|png|avif)$/);
      const file = `${process.cwd()}/public${record.path}`, bytes = readFileSync(file);
      expect(bytes.length).toBe(record.bytes); expect(digest(bytes)).toBe(record.sha256); expect(typeOf(bytes)).toBe(record.mime);
      expect(record.width).toBeGreaterThan(0); expect(record.height).toBeGreaterThan(0); expect(statSync(file).mode & 0o777).toBe(0o644);
    }
  });
  test('les huit pàgines amb mitjans complets continuen pendent_admin i el Molí conserva el bloqueig de la font TLS invàlida', async () => {
    const pages = await carregaPaginesTrilogiaIMoliWp();
    const values = pages.map(transformaPaginaTrilogiaIMoliWp);
    expect(values.filter(page => page.imatgesPendents.length === 0)).toHaveLength(8);
    const moli = values.find(page => page.wp_id === 2002);
    expect(moli.publicable).toBe(false);
    expect(moli.imatgesPendents).toEqual(['https://socdepoble.com/portal/wp-content/uploads/2020/06/moli-fariner-electric-la-torre-2020_33-1-1024x791.jpg']);
    for (const page of values) {
      expect(page.estat_revisio).toBe('pendent_admin'); expect(page.quarantena).toBe(true);
      const dom = new DOMParser().parseFromString(page.htmlNet, 'text/html').body;
      const allowed = new Set(Object.values(MITJANS_WP_LOCALS).map(record => record.path));
      for (const img of dom.querySelectorAll('img')) expect(allowed.has(img.getAttribute('src'))).toBe(true);
      expect(dom.querySelector('iframe')).toBeNull();
    }
  });
  test('G5-03 · cap escrit escanejat amb dades personals (DNI, telèfon, adreça) no té còpia local fins que una persona el revise i l’oculte', () => {
    const escrit = /(escrit|queixa|resposta|carta|informe|expedient|admissi|s[ií]ndic-a-rentonar)/i;
    for (const url of Object.keys(MITJANS_WP_LOCALS)) expect(decodeURIComponent(url.split('/').pop())).not.toMatch(escrit);
  });
  test('les còpies no donen permís d’origen a qualsevol imatge remota ni creen una aprovació', () => {
    const cleaned = sanitizeHtml('<img src="https://socdepoble.net/unregistered.jpg">', { imatgesPropies: true });
    expect(cleaned).not.toContain('src='); expect(MITJANS_WP_LOCALS['https://socdepoble.net/unregistered.jpg']).toBeUndefined();
    for (const record of Object.values(MITJANS_WP_LOCALS)) expect(record.autoritzat).toBeUndefined();
  });
});
