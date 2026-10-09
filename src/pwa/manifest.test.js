// @vitest-environment node
/* Fase 0 de l'empaquetat mòbil (261003) · el manifest i la capçalera PWA de
   l'entrada pròpia. Els colors són valors dels tokens de Pedra Seca (es lligen
   de src/css/tokens.css, no es copien a mà ací), cada icona existix a public/
   i les mides declarades d'una PNG són les de la seua capçalera IHDR. */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { valorDelToken } from './__fixtures__/tokens.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const MANIFEST = JSON.parse(llig('public/manifest.webmanifest'));
const INDEX = llig('index.html');

/** Amplària i alçària d'una PNG, de la capçalera IHDR. */
function midesPng(ruta) {
  const dades = readFileSync(ruta);
  const signatura = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  expect([...dades.subarray(0, 8)], ruta).toEqual(signatura);
  expect(dades.subarray(12, 16).toString('ascii'), ruta).toBe('IHDR');
  return { amplaria: dades.readUInt32BE(16), alcaria: dades.readUInt32BE(20) };
}

/** Les etiquetes <meta>/<link> de la capçalera, en ordre, com a objectes d'atributs. */
function etiquetes(html, nom) {
  const patro = new RegExp(`<${nom}\\b([^>]*)>`, 'gi');
  return [...html.matchAll(patro)].map(([, atributs]) => Object.fromEntries(
    [...atributs.matchAll(/([a-z:-]+)\s*=\s*"([^"]*)"/gi)].map(([, clau, valor]) => [clau.toLowerCase(), valor])
  ));
}

/** Directives d'una CSP: nom → fonts. */
function directives(csp) {
  return Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => {
    const [nom, ...fonts] = d.split(/\s+/);
    return [nom, fonts];
  }));
}

describe('manifest.webmanifest', () => {
  test('una sola app genèrica: identitat, abast i presentació', () => {
    expect(MANIFEST).toMatchObject({
      id: '/',
      name: 'Sóc de Poble',
      short_name: 'Sóc de Poble',
      lang: 'ca',
      dir: 'ltr',
      start_url: '/',
      scope: '/',
      display: 'standalone'
    });
    expect([...MANIFEST.short_name].length).toBeLessThanOrEqual(12);
    // La descripció és la de index.html, no una de nova.
    const descripcio = etiquetes(INDEX, 'meta').find((m) => m.name === 'description');
    expect(MANIFEST.description).toBe(descripcio.content);
    expect(Object.keys(MANIFEST).sort()).toEqual(['background_color', 'description', 'dir', 'display', 'icons', 'id', 'lang',
      'name', 'scope', 'short_name', 'start_url', 'theme_color']);
  });

  test('colors = valors dels tokens: barra negra (--sdp-crom-fons) i fons de l\'app en clar (--sdp-fons-app)', () => {
    // La barra negra pinta amb --sdp-crom-fons (closca immutable) i el body, amb --sdp-fons-app.
    expect(llig('src/css/layout.css')).toMatch(/header\.bar-black\s*\{[^}]*background:\s*var\(--sdp-crom-fons\)/);
    expect(llig('src/css/base.css')).toMatch(/body,[^{]*\{[^}]*background:\s*var\(--sdp-fons-app\)/);
    expect(MANIFEST.theme_color).toBe(valorDelToken('--sdp-crom-fons'));
    expect(MANIFEST.background_color).toBe(valorDelToken('--sdp-fons-app'));
  });

  test('cada icona existix a public/, dins de l\'abast, i les mides de les PNG són les reals', () => {
    expect(MANIFEST.icons.length).toBeGreaterThan(0);
    for (const icona of MANIFEST.icons) {
      expect(icona.src.startsWith(MANIFEST.scope), icona.src).toBe(true);
      const fitxer = path.join(ARREL, 'public', icona.src);
      expect(existsSync(fitxer), icona.src).toBe(true);
      if (icona.type === 'image/png') {
        expect(icona.src.endsWith('.png'), icona.src).toBe(true);
        const { amplaria, alcaria } = midesPng(fitxer);
        expect(amplaria, icona.src).toBe(alcaria);
        expect(icona.sizes, icona.src).toBe(`${amplaria}x${alcaria}`);
      } else {
        expect(icona.type, icona.src).toBe('image/svg+xml');
        expect(icona.sizes, icona.src).toBe('any');
      }
      expect(['any', 'maskable', 'monochrome']).toEqual(expect.arrayContaining(icona.purpose.split(' ')));
    }
    // Chrome demana una icona principal quadrada d'almenys 144 px.
    const principals = MANIFEST.icons.filter((i) => i.type === 'image/png' && i.purpose.split(' ').includes('any'));
    expect(principals.some((i) => Number(i.sizes.split('x')[0]) >= 144)).toBe(true);
  });

  test('la brúixola de 180 no es declara maskable: no cap dins de la zona segura', () => {
    const touch = MANIFEST.icons.find((i) => i.src === '/apple-touch-icon.png');
    expect(touch).toBeTruthy();
    expect(touch.purpose).toBe('any');
  });
});

describe('index.html', () => {
  const metes = etiquetes(INDEX, 'meta');
  const enllacos = etiquetes(INDEX, 'link');

  test('enllaça el manifest i les metadades d\'app instal·lable', () => {
    expect(enllacos.filter((l) => l.rel === 'manifest')).toEqual([{ rel: 'manifest', href: '/manifest.webmanifest' }]);
    expect(existsSync(path.join(ARREL, 'public/manifest.webmanifest'))).toBe(true);
    const nom = (n) => metes.find((m) => m.name === n)?.content;
    expect(nom('mobile-web-app-capable')).toBe('yes');
    expect(nom('apple-mobile-web-app-capable')).toBe('yes');
    expect(nom('apple-mobile-web-app-title')).toBe(MANIFEST.short_name);
    expect(nom('apple-mobile-web-app-status-bar-style')).toBe('black');
    const touch = enllacos.find((l) => l.rel === 'apple-touch-icon');
    expect(touch.href).toBe('/apple-touch-icon.png');
    expect(existsSync(path.join(ARREL, 'public', touch.href))).toBe(true);
  });

  test('theme-color: el primer només casa amb l\'app instal·lada i és el del manifest; en pestanya, el de sempre', () => {
    const colors = metes.filter((m) => m.name === 'theme-color');
    expect(colors).toHaveLength(2);
    expect(colors[0]).toEqual({ name: 'theme-color', media: '(display-mode: standalone)', content: MANIFEST.theme_color });
    // Llei del Píxel: el de la pestanya continua sense media, i no és el de l'app instal·lada.
    expect(Object.keys(colors[1]).sort()).toEqual(['content', 'name']);
    expect(colors[1].content).toMatch(/^#[0-9a-f]{6}$/i);
    expect(colors[1].content).not.toBe(MANIFEST.theme_color);
  });

  test('imatge social per defecte (Onada 5): la panoràmica verda de useSEO, amb mides reals i text alternatiu', () => {
    const propietat = (p) => metes.find((m) => m.property === p)?.content;
    const nom = (n) => metes.find((m) => m.name === n)?.content;
    const imatge = new URL(propietat('og:image'));
    expect(imatge.origin).toBe('https://socdepoble.org');
    // El mateix camí que IMATGE_BASE: la vista sense imatge pròpia conserva este conjunt.
    expect(llig('src/hooks/useSEO.js')).toContain(`const IMATGE_BASE = '${imatge.pathname}';`);
    expect(imatge.pathname).toMatch(/\.png$/);
    expect(propietat('og:image:type')).toBe('image/png');
    const { amplaria, alcaria } = midesPng(path.join(ARREL, 'public', imatge.pathname));
    expect(propietat('og:image:width')).toBe(String(amplaria));
    expect(propietat('og:image:height')).toBe(String(alcaria));
    expect(propietat('og:image:alt')).toBeTruthy();
    expect(nom('twitter:image')).toBe(imatge.href);
    expect(nom('twitter:image:alt')).toBe(propietat('og:image:alt'));
    expect(nom('twitter:card')).toBe('summary_large_image');
  });

  test('la CSP de index.html i la de vercel.json admeten el worker i el manifest propis', () => {
    const vercel = JSON.parse(llig('vercel.json'));
    const capcalera = vercel.headers.flatMap((h) => h.headers).find((h) => h.key === 'Content-Security-Policy');
    const metaCsp = metes.find((m) => m['http-equiv'] === 'Content-Security-Policy');
    for (const [on, csp] of [['index.html', metaCsp.content], ['vercel.json', capcalera.value]]) {
      const d = directives(csp);
      const worker = d['worker-src'] || d['script-src'] || d['default-src'];
      const manifest = d['manifest-src'] || d['default-src'];
      expect(worker, `${on}: worker-src`).toContain("'self'");
      expect(manifest, `${on}: manifest-src`).toContain("'self'");
    }
  });
});
