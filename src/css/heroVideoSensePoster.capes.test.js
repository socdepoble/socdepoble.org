import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

/* v1.2.19 · Gauntlet R2 (L5R2-01) · El reproductor de capçalera sense pòster reserva la proporció mentre el vídeo no
   s'ha demanat (preload="none"); amb pòster, la regla no hi aplica. */
test('el vídeo de capçalera sense pòster reserva la proporció 16:9', () => {
  const css = readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8');
  expect(css).toMatch(/\.sdp-hero-video__player:not\(\[poster\]\)\s*\{\s*aspect-ratio:\s*16\s*\/\s*9;\s*\}/);
});
