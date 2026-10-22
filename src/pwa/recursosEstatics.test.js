// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const arrel = new URL('../../', import.meta.url);
const llig = (ruta) => readFileSync(new URL(ruta, arrel));
const hosting = JSON.parse(llig('vercel.json'));
const reescriptures = hosting.rewrites.map(({ source }) => new RegExp(`^${source}$`));

describe('recursos estàtics del navegador: contingut i encaminament', () => {
  test('favicon.ico conté el logo oficial intacte i un directori ICO vàlid de 256 px', () => {
    const ico = llig('public/favicon.ico');
    const png = llig('public/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(1);
    expect([...ico.subarray(6, 10)]).toEqual([0, 0, 0, 0]); // 0 = 256 px en ICO.
    expect(ico.readUInt16LE(10)).toBe(1);
    expect(ico.readUInt16LE(12)).toBe(32);
    expect(ico.readUInt32LE(14)).toBe(png.length);
    expect(ico.readUInt32LE(18)).toBe(22);
    expect(ico.subarray(22).equals(png)).toBe(true);
    expect(png.toString('hex', 0, 8)).toBe('89504e470d0a1a0a');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([256, 256]);
  });

  test.each([
    ['favicon.svg', 'image/svg+xml'],
    ['favicon.ico', 'image/x-icon'],
    ['manifest.webmanifest', 'application/manifest+json']
  ])('%s té contingut propi, MIME explícit i no cau al fallback HTML', (nom, mime) => {
    expect(llig(`public/${nom}`).length).toBeGreaterThan(0);
    expect(reescriptures.some((re) => re.test(`/${nom}`))).toBe(false);
    const capcaleres = hosting.headers.find(({ source }) => source === `/${nom}`).headers;
    expect(capcaleres).toContainEqual({ key: 'Content-Type', value: mime });
    expect(capcaleres).toContainEqual({ key: 'X-Content-Type-Options', value: 'nosniff' });
  });

  test('el manifest referencia PNG reals de la mida declarada, fora del fallback', () => {
    const manifest = JSON.parse(llig('public/manifest.webmanifest'));
    expect(manifest.scope).toBe('/');
    expect(manifest.start_url).toBe('/');
    for (const icona of manifest.icons) {
      const ruta = new URL(icona.src, 'https://fixture.invalid/').pathname;
      const png = llig(`public${ruta}`);
      expect(png.toString('hex', 0, 8)).toBe('89504e470d0a1a0a');
      expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icona.sizes);
      expect(icona.type).toBe('image/png');
      expect(reescriptures.some((re) => re.test(ruta))).toBe(false);
    }
  });

  test('les rutes SPA conserven el fallback i les carpetes de recursos continuen excloses', () => {
    for (const ruta of ['/javillinares', '/gent/javillinares', '/plugin/gestoria', '/notes']) {
      expect(reescriptures.some((re) => re.test(ruta))).toBe(true);
    }
    for (const ruta of ['/assets/inexistent.png', '/fonts/inexistent.woff2']) {
      expect(reescriptures.some((re) => re.test(ruta))).toBe(false);
    }
  });
});
