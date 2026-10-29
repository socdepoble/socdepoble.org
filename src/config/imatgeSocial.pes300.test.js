// @vitest-environment node
/* Pla 261029_0216 (R-01/GM2-01 i R-02; Pas 2 i Pas 9) · Guarda de pes i de
   format de cada og:image del manifest social, el mateix que construïx el
   build (tooling/seo/build-social-manifest.mjs · buildSocialManifest) sobre
   l'arbre viu, sense cap snapshot remot:
     · la imatge és un fitxer de public/assets del mateix origen;
     · pesa com a molt 300 000 bytes: WhatsApp no pinta a la primera una
       targeta més pesada (R-01, GM2-01);
     · els bytes diuen el que diu l'extensió (R-02: un .png amb bytes JPEG
       declara un MIME que un rastrejador estricte rebutja);
     · és PNG o JPEG, cap WebP (WhatsApp no en pinta);
     · si el manifest declara MIME o mides, són els dels bytes.
   I de cada parell de VARIANTS_SOCIALS (config/imatgeSocial.js): l'original
   continua al disc amb el seu nom, i la variant és un JPEG baseline de
   1200x630, de 300 000 bytes com a molt, sense cap segment APP1 (ni EXIF ni
   XMP: OG-7, cap GPS a public/assets), i és la que urlSocialDe posa al
   <head>. Una prova de conformitat, no de disseny: no diu quina imatge va a
   cada ruta (això és d'imatgeSocial.test.js), només que la que hi va es pot
   servir. */
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildSocialManifest } from '../../tooling/seo/build-social-manifest.mjs';
import { sniffImage } from '../../tooling/seo/prerender-social.mjs';
import { ORIGEN_SOCIAL_PER_DEFECTE, VARIANTS_SOCIALS, urlSocialDe } from './imatgeSocial.js';

const ARREL = process.cwd();
const PUBLIC = path.join(ARREL, 'public');
const PES_MAXIM = 300_000;
const MIME_DE_L_EXTENSIO = Object.freeze({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' });
const SUFIX_SOCIAL = '-social-1200x630.jpg';

/* El fitxer de public/ d'una URL del manifest (el camí descodificat, com el
   servix Firebase), o null si no és del nostre origen ni d'/assets/. */
function fitxerDe(url) {
  const u = new URL(url);
  if (u.origin !== ORIGEN_SOCIAL_PER_DEFECTE || !u.pathname.startsWith('/assets/')) return null;
  return path.join(PUBLIC, decodeURIComponent(u.pathname));
}

/* Els marcadors d'un JPEG fins al començament de les dades (SOS), en ordre:
   APPn (0xE0–0xEF), DQT, SOFn, DHT… Un APP1 (0xE1) és un EXIF o un XMP. */
function marcadorsDeJpeg(bytes) {
  const marcadors = [];
  let i = 2;
  while (i + 3 < bytes.length && bytes[i] === 0xff) {
    const marcador = bytes[i + 1];
    if (marcador === 0xda) break;
    marcadors.push(marcador);
    i += 2 + bytes.readUInt16BE(i + 2);
  }
  return marcadors;
}

const { manifest } = await buildSocialManifest({ root: ARREL, origin: ORIGEN_SOCIAL_PER_DEFECTE });
const rutes = Object.entries(manifest.routes);
/* Una entrada per imatge, amb les rutes que la porten: la targeta base en
   servix moltes, i un fitxer que falla ho fa una vegada, amb els noms. */
const perImatge = new Map();
for (const [ruta, { image }] of rutes) {
  if (!perImatge.has(image.url)) perImatge.set(image.url, { image, rutes: [] });
  perImatge.get(image.url).rutes.push(ruta);
}
const imatges = [...perImatge.entries()].map(([url, { image, rutes: llista }]) => [`${new URL(url).pathname} (${llista.length} ruta/es: ${llista.slice(0, 3).join(', ')}${llista.length > 3 ? '…' : ''})`, image, llista]);

describe('cada og:image del manifest social es pot servir a WhatsApp (R-01, R-02)', () => {
  test('el manifest és el del lloc, amb rutes i cap imatge fora de public/assets', () => {
    expect(manifest.schema).toBe('sdp.social-manifest.v1');
    expect(manifest.origin).toBe(ORIGEN_SOCIAL_PER_DEFECTE);
    expect(rutes.length).toBeGreaterThan(50);
    expect(rutes.filter(([, { image }]) => !fitxerDe(image.url)).map(([ruta]) => ruta)).toEqual([]);
  });

  test.each(imatges)('%s', (nom, image) => {
    const fitxer = fitxerDe(image.url);
    expect(statSync(fitxer).isFile()).toBe(true);
    const bytes = readFileSync(fitxer);
    expect(bytes.length, `${nom}: ${bytes.length} B`).toBeLessThanOrEqual(PES_MAXIM);
    const llegida = sniffImage(bytes);
    expect(llegida?.type, 'PNG o JPEG, cap WebP').toMatch(/^image\/(?:png|jpeg)$/);
    expect(MIME_DE_L_EXTENSIO[path.extname(new URL(image.url).pathname).toLowerCase()], 'els bytes i l’extensió').toBe(llegida.type);
    if (image.type) expect(image.type).toBe(llegida.type);
    if (image.width && image.height) expect([llegida.width, llegida.height]).toEqual([image.width, image.height]);
  });

  test('cap ruta porta al <head> un original que té variant social', () => {
    const originals = new Set(Object.keys(VARIANTS_SOCIALS));
    expect(rutes.filter(([, { image }]) => originals.has(decodeURIComponent(new URL(image.url).pathname))).map(([ruta]) => ruta)).toEqual([]);
  });
});

describe('VARIANTS_SOCIALS: cada parell al disc; la variant, un JPEG baseline de 1200x630 i ≤300 KB sense EXIF', () => {
  test('el mapa és congelat, de camins nets d’/assets/, i cap variant torna a ser clau', () => {
    expect(Object.isFrozen(VARIANTS_SOCIALS)).toBe(true);
    expect(Object.keys(VARIANTS_SOCIALS).length).toBeGreaterThanOrEqual(24);
    for (const [original, variant] of Object.entries(VARIANTS_SOCIALS)) {
      expect(original).toMatch(/^\/assets\/[^?#]+\.(?:png|jpe?g|webp)$/i);
      expect(variant).toBe(original.replace(/\.[^./]+$/, SUFIX_SOCIAL));
      expect(path.posix.dirname(variant)).toBe(path.posix.dirname(original));
      expect(VARIANTS_SOCIALS).not.toHaveProperty([variant]);
    }
  });

  test.each(Object.entries(VARIANTS_SOCIALS))('%s', (original, variant) => {
    // L'original no s'ha tocat: hi és, amb el seu nom (la pàgina el pinta).
    expect(statSync(path.join(PUBLIC, original)).isFile()).toBe(true);
    const bytes = readFileSync(path.join(PUBLIC, variant));
    expect(bytes.length).toBeLessThanOrEqual(PES_MAXIM);
    expect(sniffImage(bytes)).toEqual({ type: 'image/jpeg', width: 1200, height: 630 });
    const marcadors = marcadorsDeJpeg(bytes);
    expect(marcadors, 'JPEG baseline (SOF0), no progressiu').toContain(0xc0);
    expect(marcadors).not.toContain(0xc2);
    expect(marcadors, 'cap APP1: ni EXIF ni XMP').not.toContain(0xe1);
    // El <head> porta la variant; la variant mateixa no es torna a mapar.
    expect(urlSocialDe(original)).toBe(`${ORIGEN_SOCIAL_PER_DEFECTE}${variant}`);
    expect(urlSocialDe(`${ORIGEN_SOCIAL_PER_DEFECTE}${original}?v=3#x`)).toBe(`${ORIGEN_SOCIAL_PER_DEFECTE}${variant}`);
    expect(urlSocialDe(variant)).toBe(`${ORIGEN_SOCIAL_PER_DEFECTE}${variant}`);
  });
});
