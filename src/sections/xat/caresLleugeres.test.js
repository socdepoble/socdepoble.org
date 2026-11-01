// @vitest-environment node
/* P1-70 (marató nocturna 261101, T5.2) · La cara de Javi Llinares al xat és
   la miniatura de 256 px de la seua foto de perfil, no la de 1200 px:
     · cada camí de la seua foto de perfil (el del catàleg, la bessona .webp i
       les còpies del port i del padró) es pinta amb la miniatura, i cap altra
       cara no canvia;
     · la miniatura i la seua bessona .webp són a public/, fan 256 × 256, pesen
       poc i no porten cap EXIF (una foto d'identitat: OG-7);
     · el catàleg conserva la foto gran (la fitxa i el perfil la pinten). */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { AJUDA_PER_CLAU, CARA_DE_LA_IAIA } from '../../data/xatsPerDefecte.js';
import { bessonaDe } from '../../config/politicaDeMitjans.js';
import { llegixCapcalera } from '../tractors/sentinelles/imatges.js';
import { FOTOS_DE_PERFIL_DE_JAVI, caraLleugera } from './caresLleugeres.js';

const PUBLIC = path.join(process.cwd(), 'public');
const MINIATURA = AGENTS_MAP.JAVI.avatar_miniatura;
const bytesDe = (src) => new Uint8Array(readFileSync(path.join(PUBLIC, src.slice(1))));

describe('caraLleugera', () => {
  test('cada camí de la foto de perfil de Javi es pinta amb la miniatura (també amb espais)', () => {
    expect(MINIATURA).toBe('/assets/fotos/javi-llinares-256x256.jpg');
    expect(FOTOS_DE_PERFIL_DE_JAVI).toContain(AGENTS_MAP.JAVI.avatar_url);
    for (const src of FOTOS_DE_PERFIL_DE_JAVI) {
      expect(caraLleugera(src), src).toBe(MINIATURA);
      expect(caraLleugera(`  ${src} `), src).toBe(MINIATURA);
    }
    expect(Object.isFrozen(FOTOS_DE_PERFIL_DE_JAVI)).toBe(true);
  });

  test('qualsevol altra cara torna tal qual, amb el mateix valor', () => {
    const altres = [
      AGENTS_MAP.IAIA.avatar_url, AJUDA_PER_CLAU.socdepoble.avatar, CARA_DE_LA_IAIA.src, MINIATURA,
      '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg',
      'sdp-media://mitjans/t/u/avatars/foto.webp', 'https://lh3.googleusercontent.com/a/pepa=s96-c',
      `https://node.example${AGENTS_MAP.JAVI.avatar_url}`, 'data:image/png;base64,iVBORw0KGgo=', ''
    ];
    for (const src of altres) expect(caraLleugera(src), src).toBe(src);
    for (const valor of [null, undefined, 42]) expect(caraLleugera(valor)).toBe(valor);
  });

  test('el catàleg conserva la foto gran per a la fitxa i el perfil', () => {
    expect(AGENTS_MAP.JAVI.avatar_url).toBe('/assets/fotos/javi-llinares-perfil-1200px.jpg');
  });
});

describe('els fitxers', () => {
  test('cada camí de la foto de perfil existix a public/ i és la mateixa foto quadrada', () => {
    for (const src of FOTOS_DE_PERFIL_DE_JAVI) {
      expect(existsSync(path.join(PUBLIC, src.slice(1))), src).toBe(true);
      const { amplada, alcada } = llegixCapcalera(bytesDe(src));
      expect(amplada, src).toBe(alcada);
      expect(amplada, src).toBeGreaterThanOrEqual(1200);
    }
  });

  test('la miniatura i la seua bessona .webp: 256 × 256, lleugeres i sense EXIF', () => {
    for (const src of [MINIATURA, bessonaDe(MINIATURA)]) {
      expect(existsSync(path.join(PUBLIC, src.slice(1))), src).toBe(true);
      const bytes = bytesDe(src);
      const capcalera = llegixCapcalera(bytes);
      expect(capcalera, src).toMatchObject({ amplada: 256, alcada: 256, exif: false, gps: false });
      expect(capcalera.format, src).toBe(src.endsWith('.webp') ? 'webp' : 'jpeg');
      expect(bytes.byteLength, src).toBeLessThan(24 * 1024);
      expect(Buffer.from(bytes).includes(Buffer.from('Exif\0\0', 'latin1')), src).toBe(false);
    }
    /* Més d'un orde de magnitud per davall de la foto que arrossegava cada fila. */
    expect(bytesDe(MINIATURA).byteLength * 10).toBeLessThan(bytesDe(AGENTS_MAP.JAVI.avatar_url).byteLength);
  });
});
