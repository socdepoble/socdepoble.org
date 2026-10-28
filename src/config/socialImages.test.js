// @vitest-environment node
/* Pla 261028_1526 (P1-61, Fase 2) · El catàleg d'imatges socials editorials
   (socialImages.js): sense cap import, i cada entrada nomena un PNG de
   public/assets amb les mides i el MIME que diuen els seus bytes. La targeta
   del Llibre d'Or és la còpia exacta de la de Codex (261027_0730). */
import { expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { SOCIAL_IMAGES } from './socialImages.js';

const ARREL = process.cwd();
const bytesDe = (url) => readFileSync(path.join(ARREL, 'public', url));

test('sense cap import: el lligen el client i les eines del build', () => {
  expect(readFileSync(new URL('./socialImages.js', import.meta.url), 'utf8')).not.toMatch(/^\s*import\s/m);
});

test('cada imatge és un PNG de public/assets amb les mides i el MIME declarats', () => {
  expect(Object.keys(SOCIAL_IMAGES).length).toBeGreaterThan(0);
  for (const [id, imatge] of Object.entries(SOCIAL_IMAGES)) {
    expect(id).toMatch(/^[a-zA-Z0-9_-]{1,180}$/);
    expect(imatge.url).toMatch(/^\/assets\/[a-z0-9/_-]+\.png$/);
    expect(imatge.type).toBe('image/png');
    expect(imatge.alt.trim().length).toBeGreaterThan(0);
    const bytes = bytesDe(imatge.url);
    expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([imatge.width, imatge.height]);
  }
});

test('el Llibre d’Or: la targeta de 1200x630 de Codex, byte a byte', () => {
  const imatge = SOCIAL_IMAGES['03_llibre_d_or_memoria_episodica'];
  expect(imatge.url).toBe('/assets/system/ui/og-llibre-d-or-1200x630.png');
  expect(createHash('sha256').update(bytesDe(imatge.url)).digest('hex'))
    .toBe('4a18d6b3c300c4eb5f5eeb4e7347421cdce5dddf7b729968d2d5749097f8f3f1');
});
