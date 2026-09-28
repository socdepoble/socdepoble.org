/**
 * Poliment T39/T40 · La targeta del Mur pinta el que la publicació porta:
 * els drets triats a la vista de drets (payload.copyright) i la data triada al
 * calendari (payload.publish_date). El text de sèrie i created_at només quan
 * la publicació no en porta (la llavor i les publicacions d'abans).
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
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
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';

/* Una publicació tal com la deixa loadSections: el payload de publishNote,
   amb l'id i el created_at de la fila. */
const publicacio = (payload) => ({ type: 'feed', labels: [{ text: 'Publicació', className: 'sdp-badge-category' }], ...payload });
const diaDelMur = (iso) => new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
const targetaDe = (titol) => {
  const targeta = [...document.querySelectorAll('.sdp-card-grid > *')].find((element) => element.textContent.includes(titol));
  expect(targeta, titol).toBeTruthy();
  return targeta.textContent;
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = {
    status: 'ready', error: null, sortedEvents: [], sortedMarketItems: [],
    sortedFeedPosts: [
      publicacio({ id: 'cc', title: 'Recepta de coca', copyright: 'CC BY 4.0', created_at: '2026-09-01T10:00:00.000Z', publish_date: '2026-10-05T08:30:00.000Z' }),
      publicacio({ id: 'vella', title: 'Crònica vella', created_at: '2026-08-15T10:00:00.000Z' })
    ]
  };
});

test('una publicació amb «CC BY 4.0» ho diu a la targeta; una sense drets porta el text de sèrie', () => {
  render(<MurSection />);
  expect(screen.getByText('CC BY 4.0')).toBeTruthy();
  expect(targetaDe('Recepta de coca')).toContain('CC BY 4.0');
  expect(targetaDe('Recepta de coca')).not.toContain(COPYRIGHT_SDP);
  expect(targetaDe('Crònica vella')).toContain(COPYRIGHT_SDP);
});

test('la data de la targeta és la triada al calendari; sense, la de creació', () => {
  render(<MurSection />);
  expect(targetaDe('Recepta de coca')).toContain(diaDelMur('2026-10-05T08:30:00.000Z'));
  expect(targetaDe('Crònica vella')).toContain(diaDelMur('2026-08-15T10:00:00.000Z'));
});
