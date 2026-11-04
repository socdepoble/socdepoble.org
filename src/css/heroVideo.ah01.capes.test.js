// @vitest-environment node
/* AH-01 (Cua d'Auditoria Humana del Mestre, 261104 16:59) · En mòbil i en mode
   compacte el vídeo protagonista va de vora a vora, sense franges negres; en
   escriptori conserva l'alçada màxima i l'encaix sencer. Regla aportada pel kit
   de Gemini (v2.2) i integrada per Claude. jsdom no pinta: es comproven les
   regles escrites, sense comentaris. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const COMPONENTS = readFileSync(resolve(process.cwd(), 'src/css/components.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const reglaDe = (selector, des = 0) => {
  const inici = COMPONENTS.indexOf(`${selector} {`, des);
  if (inici === -1) return null;
  return net(COMPONENTS.slice(COMPONENTS.indexOf('{', inici) + 1, COMPONENTS.indexOf('}', inici)));
};
const VORA_A_VORA = 'width: 100%; height: auto; max-height: none; object-fit: cover;';

describe('AH-01 · vídeo protagonista de vora a vora en mòbil · components.css', () => {
  test('en mode compacte el reproductor ocupa tota l’amplària i no deixa franges', () => {
    expect(reglaDe(':where(.sdp-root.is-compact) .sdp-hero-video__player')).toBe(VORA_A_VORA);
  });

  test('sota 768 px passa el mateix, també fora de l’arrel compacta', () => {
    const media = COMPONENTS.indexOf('@media (max-width: 767px) {\n  .sdp-hero-video__player');
    expect(media).toBeGreaterThan(-1);
    expect(reglaDe('.sdp-hero-video__player', media)).toBe(VORA_A_VORA);
  });

  test('el contenidor continua amb cantons quadrats (sense border-radius)', () => {
    expect(reglaDe('.sdp-hero-video')).not.toMatch(/border-radius/);
  });
});
