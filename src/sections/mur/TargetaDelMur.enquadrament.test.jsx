/**
 * IDEA-42 (B7h, marató 261101_2143; spec B7-PEDRA §2.9c) · La targeta del Mur
 * d'una publicació amb enquadrament (item.enquadrament_targeta) es pinta en
 * 16:9 amb el punt focal de l'autor. La targeta el torna a coaccionar
 * (portadaDeLaPublicacio): la llavor i app_content no passen pel mapejador, i
 * un valor hostil no arriba mai a UniversalCard. Sense la clau, la targeta de
 * sempre, byte a byte.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' } })
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: () => false,
  loadPerfilPublic: async () => null
}));

import { TargetaDelMur } from './TargetaDelMur.jsx';

afterEach(cleanup);

const FOTO = '/assets/fotos/aplec.webp';
const publicacio = (extra) => ({ id: 'p1', type: 'post', title: 'Aplec', author_name: 'Pepa', image: FOTO, created_at: '2026-09-01T10:00:00.000Z', ...extra });
const pinta = (item) => render(<TargetaDelMur item={item} />).container;
const html = (item) => {
  const sortida = pinta(item).innerHTML;
  cleanup();
  return sortida;
};
const carrega = (img, amplada, alcada) => {
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: amplada });
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: alcada });
  act(() => { fireEvent.load(img); });
};

describe('IDEA-42 · la targeta 16:9 del Mur', () => {
  test('amb un enquadrament net: 16:9 i, en carregar la foto, el punt focal', () => {
    const contenidor = pinta(publicacio({ enquadrament_targeta: { format: '16:9', cx: 0.3, cy: 0.5, zoom: 2 } }));
    const caixa = contenidor.querySelector('.sp-card-media-container');
    expect(caixa.className).toBe('sp-card-media-container sp-card-media-container--16-9');
    const img = caixa.querySelector('img.sp-card-media');
    /* Corrector B7h (B7h-A02) · La foto de la gent, també en 16:9, sense referent (Decisió 3). */
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    carrega(img, 2000, 1000);
    expect(img.style.getPropertyValue('--targeta-mitja-x')).toBe('14%');
    expect(img.style.getPropertyValue('--targeta-mitja-y')).toBe('50%');
    expect(img.style.getPropertyValue('--targeta-mitja-zoom')).toBe('2');
  });

  test.each([
    ['un format fora de la llista', { format: '4:3', cx: 0.3, cy: 0.5, zoom: 1 }],
    ['cx en text', { format: '16:9', cx: '0.3', cy: 0.5, zoom: 1 }],
    ['una injecció CSS', { format: '16:9', cx: '30%; background: url(//rastreig.example)', cy: 0.5, zoom: 1 }],
    ['fora de rang', { format: '16:9', cx: 0.3, cy: 1.5, zoom: 1 }],
    ['una cadena', '16:9'],
    ['null', null]
  ])('un enquadrament hostil (%s): la targeta de sempre, byte a byte', (_, enquadrament_targeta) => {
    expect(html(publicacio({ enquadrament_targeta }))).toBe(html(publicacio({})));
  });

  test('sense la clau, el mitjà quadrat de sempre', () => {
    const caixa = pinta(publicacio({})).querySelector('.sp-card-media-container');
    expect(caixa.className).toBe('sp-card-media-container');
    expect(caixa.querySelector('img').hasAttribute('style')).toBe(false);
  });

  test('un enquadrament heretat del prototip no compta', () => {
    const item = Object.assign(Object.create({ enquadrament_targeta: { format: '16:9', cx: 0.3, cy: 0.5, zoom: 1 } }), publicacio({}));
    expect(pinta(item).querySelector('.sp-card-media-container').className).toBe('sp-card-media-container');
  });

  test('portada_sencera no toca la targeta (és de la pàgina universal)', () => {
    expect(html(publicacio({ portada_sencera: true }))).toBe(html(publicacio({})));
  });
});
