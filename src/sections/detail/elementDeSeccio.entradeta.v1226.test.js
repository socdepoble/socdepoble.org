/**
 * IDEA-357 (v1.2.26, Llibre Mestre línia 3677: «Entradetes de Targetes i Pàgines sense Negretes») i
 * P0-33/IDEA-150 (Llei 1:1 UniversalPage ↔ UniversalCard) · La UniversalPage d'una publicació del Mur
 * (paginaDElement, lead) i la seua Card del Mur (TargetaDelMur, .sp-card-text) diuen la MATEIXA
 * entradeta neta, en les cinc llengües de la interfície. Abans (Gauntlet G26, Lent 1 #8) la pàgina
 * pintava 'La **festa** de `poble` amb [música](/agenda).' i la Card «La festa de poble amb música.».
 * El contingut legítim (D2 de l'integrador C1-3) es queda sencer a totes dues.
 */
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ idioma: 'ca', t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/RouterContext', async (importOriginal) => {
  const { createElement: crea } = await import('react');
  return {
    ...(await importOriginal()),
    useNavigate: () => vi.fn(),
    Link: ({ children, to, ...resta }) => crea('a', { href: to, ...resta }, children)
  };
});
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: mocks.t, language: mocks.idioma }),
  useUIActionsOpcional: () => ({ t: mocks.t, language: mocks.idioma })
}));
vi.mock('../../hooks/useEntitatDelProjecte.js', () => ({ useEntitatDelProjecte: () => null }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { paginaDElement } from './elementDeSeccio.js';
import { buildMercatDetailSectionMeta, buildMurDetailSectionMeta } from './detailSectionMeta.jsx';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';

afterEach(() => {
  cleanup();
  mocks.idioma = 'ca';
});

const ENTRADETES = [
  ['ca', 'La **festa** de `poble` amb [música](/agenda) i __ball__.', 'La festa de poble amb música i ball.'],
  ['es', 'La **fiesta** del `pueblo` con [música](/agenda) y __baile__.', 'La fiesta del pueblo con música y baile.'],
  ['en', 'The **village** `fair` with [music](/agenda) and __dancing__.', 'The village fair with music and dancing.'],
  ['eu', 'Herriko **jaia** `plazan` [musikarekin](/agenda) eta __dantzarekin__.', 'Herriko jaia plazan musikarekin eta dantzarekin.'],
  ['gl', 'A **festa** da `aldea` con [música](/agenda) e __baile__.', 'A festa da aldea con música e baile.']
];

/* TargetaDelMur passa l'entradeta com a <p class="sp-card-text"> (un element), i la UniversalCard
   l'embolcalla en el seu <div class="sp-card-text">. */
const entradetaDeLaCard = (item) => {
  const { container } = render(createElement(TargetaDelMur, { item }));
  return container.querySelector('.sp-card-body > div.sp-card-text > p.sp-card-text')?.textContent;
};
const entradetaDeLaPagina = (item, idioma) =>
  paginaDElement(buildMurDetailSectionMeta({ feedPosts: [item], t: mocks.t }), item, { idioma, t: mocks.t }).lead;

describe('IDEA-357 · la Card del Mur i la seua UniversalPage diuen la mateixa entradeta neta', () => {
  test.each(ENTRADETES)('%s · entradeta (camp `entradilla`) amb Markdown cru', (idioma, crua, neta) => {
    mocks.idioma = idioma;
    const item = { id: `post-${idioma}`, type: 'post', title: 'La festa', entradilla: crua, created_at: '2026-11-26T09:00:00Z' };
    const pagina = entradetaDeLaPagina(item, idioma);
    expect(pagina).toBe(neta);
    expect(entradetaDeLaCard(item)).toBe(pagina);
    expect(pagina).not.toMatch(/\*\*|__|`|\]\(/);
  });

  test.each(ENTRADETES)('%s · sense el camp `entradilla`, el `lead` de la publicació', (idioma, crua, neta) => {
    mocks.idioma = idioma;
    const item = { id: `lead-${idioma}`, type: 'post', title: 'La festa', lead: crua, created_at: '2026-11-26T09:00:00Z' };
    expect(entradetaDeLaPagina(item, idioma)).toBe(neta);
    expect(entradetaDeLaCard(item)).toBe(neta);
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s · el contingut legítim es queda sencer a totes dues', (idioma) => {
    mocks.idioma = idioma;
    for (const legitim of ['Preu < 5 € i > 2 € per quilo', 'Barreja 2*3*4 grams i 5**2 cullerades.', '- 5 graus a la matinada', 'Feta al <poble>']) {
      cleanup();
      const item = { id: `legitim-${idioma}`, type: 'post', title: 'Preus', entradilla: legitim, created_at: '2026-11-26T09:00:00Z' };
      expect(entradetaDeLaPagina(item, idioma)).toBe(legitim);
      expect(entradetaDeLaCard(item)).toBe(legitim);
    }
  });

  /* La Card del Mur lleva una etiqueta HTML vàlida (netMd, llevaHtml per defecte) i la seua pàgina
     també; fora del Mur la Card és la UniversalCard, on el cos de text ja és text, i la pàgina també
     el deixa sencer (ConnectarSection.test.jsx, D4: «Feta al <poble>»). */
  test('una etiqueta vàlida: la Card del Mur i la seua pàgina la lleven; al Mercat, el text es queda', () => {
    const item = { id: 'html', type: 'post', title: 'Festa', entradilla: '<b>Festa</b> a la **plaça**', created_at: '2026-11-26T09:00:00Z' };
    expect(entradetaDeLaPagina(item, 'ca')).toBe('Festa a la plaça');
    expect(entradetaDeLaCard(item)).toBe('Festa a la plaça');
    const producte = { id: 'samarreta', title: 'Samarreta', entradilla: 'Feta al <poble> amb **cotó**' };
    expect(paginaDElement(buildMercatDetailSectionMeta({ marketItems: [producte], t: mocks.t }), producte).lead)
      .toBe('Feta al <poble> amb cotó');
  });

  /* Verificador de la tercera ronda (P4) · El subtítol de la pàgina del Mur també ix net. */
  test('el subtítol de la pàgina del Mur ix net, sense Markdown cru', () => {
    const item = { id: 'sub', type: 'post', title: 'Mapa', subtitle: '**Mapa** de `skills`', created_at: '2026-11-26T09:00:00Z' };
    expect(paginaDElement(buildMurDetailSectionMeta({ feedPosts: [item], t: mocks.t }), item, { idioma: 'ca', t: mocks.t }).subtitle)
      .toBe('Mapa de skills');
  });

  test('sense `entradilla` ni `lead` (o amb una entradeta que només és marques), la pàgina no porta lead (Onada 5)', () => {
    const item = { id: 'sense', type: 'post', title: 'Sense entradeta', content: '<p>Cos</p>', created_at: '2026-11-26T09:00:00Z' };
    expect(entradetaDeLaPagina(item, 'ca')).toBeUndefined();
    expect(entradetaDeLaPagina({ ...item, entradilla: '**' }, 'ca')).toBeUndefined();
  });
});
