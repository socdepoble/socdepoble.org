/* Ordre del Mestre (261007) · La insígnia de l'emoji XL, una sola peça per al
   catàleg (EspecimenUniversalCard) i per a la targeta viva (TargetaViva). */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* La targeta sense router ni avisos de l'app, com a UniversalCard.test.jsx. */
vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => vi.fn(),
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { UniversalCard } from '../PedraSeca/index.js';
import { insigniaEmojiXL } from './insigniaEmoji.jsx';

afterEach(cleanup);

test('la insígnia és un squareBadge «custom» amb el nom a l’etiqueta i l’emoji decoratiu', () => {
  const insignia = insigniaEmojiXL('Publicar al Mapa', '🗺️');
  expect(insignia).toMatchObject({ type: 'custom', label: 'Publicar al Mapa' });
  const { container } = render(<UniversalCard title="Mapa" squareBadge={insignia} />);
  const quadrat = container.querySelector('.sp-card-body.has-aside > .sp-card-calendar-badge');
  expect(quadrat.getAttribute('aria-label')).toBe('Publicar al Mapa');
  /* Revisió del 261007 (M2-08) · Una imatge amb nom: el lector el llig (un
     aria-label en un <div> sense rol, no). */
  expect(quadrat.getAttribute('role')).toBe('img');
  expect(quadrat.querySelector('svg')).toBeNull();
  expect(quadrat.innerHTML).toBe('<span class="sp-card-calendar-badge__emoji" aria-hidden="true">🗺️</span>');
});

test('M2-08 · sense etiqueta, el quadrat és decoratiu: amagat, sense nom ni rol', () => {
  const insignia = insigniaEmojiXL(null, '🍅');
  expect(insignia).toMatchObject({ type: 'custom', decoratiu: true });
  expect(insignia.label).toBeUndefined();
  const { container } = render(<UniversalCard title="Prova" squareBadge={insignia} />);
  const quadrat = container.querySelector('.sp-card-body.has-aside > .sp-card-calendar-badge');
  expect(quadrat.getAttribute('aria-hidden')).toBe('true');
  expect(quadrat.hasAttribute('aria-label')).toBe(false);
  expect(quadrat.hasAttribute('role')).toBe(false);
  expect(quadrat.querySelector('.sp-card-calendar-badge__emoji').textContent).toBe('🍅');
});

test('sense emoji, cap insígnia: el quadrat no es pinta', () => {
  for (const buit of ['', null, undefined]) expect(insigniaEmojiXL('Prova', buit)).toBeNull();
  const { container } = render(<UniversalCard title="Prova" squareBadge={insigniaEmojiXL('Prova', '')} />);
  expect(container.querySelector('.sp-card-calendar-badge')).toBeNull();
  expect(container.querySelector('.sp-card-body').classList.contains('has-aside')).toBe(false);
});
