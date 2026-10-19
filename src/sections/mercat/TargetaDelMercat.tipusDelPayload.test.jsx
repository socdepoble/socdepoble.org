/**
 * Auditoria de seguretat 261019 (F3) · Un producte del Mercat d'un veí amb
 * camps de tipus objecte (o {"toString":0}) ja no tomba la targeta:
 * elementDeFilaPublicada (mapejadorSeccions.js) no deixa viatjar l'objecte, i
 * la targeta de veres hi pinta la seua reserva.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));

import { TargetaDelMercat } from './TargetaDelMercat.jsx';
import { elementDeFilaPublicada } from '../../data/mapejadorSeccions.js';

const hostil = () => JSON.parse('{"toString":0}');
const CAMPS = ['title', 'description', 'subtitle', 'price', 'seller', 'tag', 'category_slug', 'copyright',
  'author_location', 'population', 'imageSrc', 'image_url', 'image', 'avatar_url', 'author_avatar'];

afterEach(cleanup);

test('la targeta es pinta amb la reserva i sense cap objecte del payload', () => {
  const item = elementDeFilaPublicada({
    id: 'p1', titol: 'Venedora', createdAt: '2026-10-07T10:00:00Z', updatedAt: '2026-10-07T10:00:00Z', ownerUserId: 'U',
    payload: { sectionId: 'mercat', ...Object.fromEntries(CAMPS.map((camp) => [camp, hostil()])),
      images: [hostil()], variations: { length: hostil() }, labels: [{ text: hostil() }] }
  });
  const article = render(<TargetaDelMercat item={item} />).container.querySelector('article');
  expect(article).not.toBeNull();
  expect(article.querySelector('.sp-card-author-name').textContent).toBe('Venedora');
});
