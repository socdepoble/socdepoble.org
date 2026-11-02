/**
 * IDEA-42 (B7h, marató 261101_2143) · Petició al carril d'EventCard: la
 * targeta d'un ACTE del Mur (EventCard) rep de TargetaDelMur l'enquadrament
 * ja net (enquadramentTargeta) i el passa a UniversalCard (formaMitja i
 * posicioMitja). Sense, la targeta de sempre.
 */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

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
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => false, loadPerfilPublic: async () => null }));

import { TargetaDelMur } from './TargetaDelMur.jsx';

afterEach(cleanup);
const acte = (extra) => ({ id: 'aplec-2023', type: 'event', title: 'Aplec', image_url: '/assets/events/aplec_2023_cartell.jpg', date: '2023-01-29', ...extra });
const html = (item) => { const s = render(<TargetaDelMur item={item} />).container.innerHTML; cleanup(); return s; };

test('un acte amb enquadrament net: 16:9 i el punt focal en carregar', () => {
  const { container } = render(<TargetaDelMur item={acte({ enquadrament_targeta: { format: '16:9', cx: 0.5, cy: 0.3, zoom: 1 } })} />);
  const caixa = container.querySelector('.sp-card-media-container');
  expect(caixa.className).toBe('sp-card-media-container sp-card-media-container--16-9');
  const img = caixa.querySelector('img');
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: 723 });
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: 1024 });
  act(() => { fireEvent.load(img); });
  expect(img.style.getPropertyValue('--targeta-mitja-y')).toBe('16.82%');
});

test('un acte amb un enquadrament hostil o sense: la targeta de sempre, byte a byte', () => {
  const abans = html(acte({}));
  expect(html(acte({ enquadrament_targeta: { format: '16:9', cx: '50%', cy: 0.3, zoom: 1 } }))).toBe(abans);
});
