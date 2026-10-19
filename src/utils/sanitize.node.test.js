// @vitest-environment node
/* Pla 261018_1605 (Tasca 0 i 3; ordre del Mestre, 18-10-2026) · Sense DOM
   (Node pla: tooling/gates/build-seo-manifest.mjs importa marketSeed.js, que
   importa identitatsSeed.js, i les proves amb l'entorn node) sanitize.js ha de
   carregar: els classificadors de fonts són purs. El sanejador d'HTML, en
   canvi, falla tancat: sense DOM no hi ha cap HTML sanejat. */
import { describe, expect, it } from 'vitest';

describe('sanitize.js sense DOM', () => {
  it('el mòdul carrega i els classificadors de fonts responen', async () => {
    expect(typeof globalThis.window).toBe('undefined');
    const { esAvatarDeProveidorOAuth, esFontImatgePropia, esFontImatgeSegura, fontImatgePropia } = await import('./sanitize.js');
    expect(esFontImatgePropia('/assets/fotos/javi-llinares-perfil-1200px.jpg')).toBe(true);
    expect(esFontImatgePropia('sdp-media://mitjans/poble/u/avatars/a.webp')).toBe(true);
    expect(esFontImatgePropia('https://lh3.googleusercontent.com/a/foto')).toBe(false);
    expect(esFontImatgeSegura('https://lh3.googleusercontent.com/a/foto')).toBe(true);
    expect(fontImatgePropia('https://exemple.example/a.png')).toBeNull();
    expect(esAvatarDeProveidorOAuth('https://lh3.googleusercontent.com/a/foto')).toBe(true);
  });

  it('sanitizeHtml falla tancat: cap HTML ix sense sanejar', async () => {
    const { sanitizeHtml, netejaText } = await import('./sanitize.js');
    expect(() => sanitizeHtml('<img src="https://atacant.example/x.png" onerror="alert(1)">')).toThrow();
    expect(sanitizeHtml('')).toBe('');
    expect(netejaText('  l’aigua < 5 litres  ')).toBe('l’aigua < 5 litres');
  });

  it('identitatsSeed.js i marketSeed.js carreguen sense DOM (build-seo-manifest.mjs)', async () => {
    const { PERSONA_PILOT, hidrataPerfilPersonaPilot } = await import('../data/identitatsSeed.js');
    expect(hidrataPerfilPersonaPilot({ id: PERSONA_PILOT.id, avatar_url: '' }).avatar_url).toBe(PERSONA_PILOT.avatar);
    const { MOCK_MARKET_ITEMS } = await import('../sections/mercat/marketSeed.js');
    expect(Array.isArray(MOCK_MARKET_ITEMS)).toBe(true);
  });
});
