/**
 * idea61-04 (Gauntlet T7a, 261104) · El contracte d'estats del Flux Universal
 * de Publicació (utils/publicacioUniversal.js · esVisibleALaLlista): una fitxa
 * d'àmbit 'tancada' no ix a la llista de la seua vertical. /treball,
 * /habitatge i /vehicle ja l'apliquen (SeccioVertical); /mercat no, i com que
 * la targeta del Mercat no pinta cap estat, un producte «Tancat» es veia igual
 * que un de disponible. Ara el Mercat aplica la mateixa regla, només a les
 * fitxes d'àmbit: un producte de sempre (sense `ambit`) es pinta com abans
 * encara que porte un `estat` (Llei del Píxel). El detall per enllaç no es
 * toca. El Mur es queda com està: és una decisió del Mestre.
 */
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mur: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));

import MercatSection from './MercatSection.jsx';

const producte = (id, title, extra = {}) => ({
  id, type: 'product', title, author_name: 'Pep', created_at: '2026-11-01T09:00:00.000Z', price: '3 €', ...extra
});
const fitxa = (estat) => ({ ambit: 'mercat', estat, dades: { preu: '3 €' } });
const pinta = (items) => {
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), sortedMarketItems: items };
  return render(<MercatSection />);
};
const titols = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((node) => node.textContent);
const BUIT = 'Encara no hi ha productes publicats en este poble.';

afterEach(cleanup);

test('una fitxa del Mercat «Tancat» no es pinta; la disponible, la reservada i el producte de sempre (també amb un estat brut), sí', () => {
  pinta([
    producte('m1', 'Oli tancat', fitxa('tancat')),
    producte('m2', 'Oli disponible', fitxa('disponible')),
    producte('m3', 'Oli reservat', fitxa('reservat')),
    producte('m4', 'Samarreta de sempre'),
    producte('m5', 'Producte de llegat', { estat: 'tancat' })
  ]);
  expect(titols()).toEqual(['Oli disponible', 'Oli reservat', 'Samarreta de sempre', 'Producte de llegat']);
  expect(screen.queryByText(BUIT)).toBeNull();
});

test('amb només fitxes tancades, el Mercat diu que encara no n’hi ha (l’estat buit de sempre), no una graella muda', () => {
  pinta([producte('m1', 'Oli tancat', fitxa('tancat')), producte('m2', 'Mel tancada', fitxa('tancat'))]);
  expect(titols()).toEqual([]);
  expect(screen.getByRole('status').textContent).toBe(BUIT);
});

test('sense cap fitxa tancada, la llista és la de sempre, en el mateix ordre', () => {
  const items = [producte('m1', 'U', fitxa('complet')), producte('m2', 'Dos'), producte('m3', 'Tres', fitxa('disponible'))];
  pinta(items);
  expect(titols()).toEqual(['U', 'Dos', 'Tres']);
});
