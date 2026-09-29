/**
 * T51 (ordre del Mestre, 260928) · La targeta del Mur pinta al centre de la
 * caputxa l'emoticona que la publicació porta al payload (icon). Sense, o amb
 * un valor que no és un sol emoji, la caputxa de sempre. Mai la ploma.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {} }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
import MurSection from './MurSection.jsx';

const publicacio = (payload) => ({ type: 'feed', labels: [{ text: 'Publicació', className: 'sdp-badge-category' }], created_at: '2026-09-01T10:00:00.000Z', ...payload });
const targetaDe = (titol) => {
  const targeta = [...document.querySelectorAll('.sdp-card-grid > *')].find((element) => element.textContent.includes(titol));
  expect(targeta, titol).toBeTruthy();
  return targeta;
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = {
    status: 'ready', error: null, sortedEvents: [], sortedMarketItems: [],
    sortedFeedPosts: [
      publicacio({ id: 'hort', title: 'Hort de tardor', icon: '🌿' }),
      publicacio({ id: 'sense', title: 'Crònica sense emoticona' }),
      publicacio({ id: 'brossa', title: 'Crònica amb brossa', icon: 'lucide-leaf' })
    ]
  };
});

test('una publicació amb emoticona la porta al centre de la caputxa; les altres, la caputxa de sempre', () => {
  render(<MurSection />);
  const amb = targetaDe('Hort de tardor');
  expect(amb.querySelector('header.sp-card-header--amb-emoticona .sdp-emoticona-barra--glif').textContent).toBe('🌿');
  for (const titol of ['Crònica sense emoticona', 'Crònica amb brossa']) {
    const targeta = targetaDe(titol);
    expect(targeta.querySelector('.sdp-emoticona-barra')).toBeNull();
    expect(targeta.querySelector('header.sp-card-header').className).toBe('sp-card-header');
  }
  expect(document.querySelector('.sdp-card-grid svg.lucide-feather')).toBeNull();
});
