import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setSearchParams: vi.fn(),
  params: new URLSearchParams('revisio=wordpress'),
  t: (_, alternativa) => alternativa,
  core: { status: 'ready', error: null, pageCopy: {}, towns: [] },
  mur: { status: 'ready', error: null, sortedMarketItems: [], sortedEvents: [], sortedFeedPosts: [] },
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params, mocks.setSearchParams],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} }),
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('./MapaFotografic.jsx', () => ({ default: () => null }));

import MurSection from './MurSection.jsx';

beforeEach(() => {
  window.localStorage.clear();
  mocks.params = new URLSearchParams('revisio=wordpress');
});

afterEach(() => {
  cleanup();
});

test('AH-28 / IDEA-88 · /mur?revisio=wordpress obri el Mode Revisió d’Importació amb els 425 articles, filtres per cas d’ús i botó d’aprovar', () => {
  render(<MurSection />);

  const panell = screen.getByTestId('mur-revisio-wordpress');
  expect(panell).toBeTruthy();
  expect(panell.textContent).toContain('425 articles');
  expect(panell.textContent).toContain('0 aprovats');

  const botoAprovar = panell.querySelectorAll('button');
  const aprovarPrimer = [...botoAprovar].find((b) => b.textContent.includes('Aprovar'));
  expect(aprovarPrimer).toBeTruthy();

  fireEvent.click(aprovarPrimer);
  expect(panell.textContent).toContain('1 aprovats');
});
