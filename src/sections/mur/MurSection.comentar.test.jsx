/**
 * T63.2 (doctrina del Mestre, 260928) · «Comentar» de les targetes del Mur (i
 * de les seues germanes, el Mercat i Pobles) obri el Xat comú de la Pàgina
 * Universal de cada element, amb el seu tipus: publicació, producte, acte,
 * poble o pàgina del sistema. Abans totes anaven a /xat sense destí.
 * Ordre del Mestre (261007) · «Comentaris = xat» · Comentar obri el menú de
 * dues vies: eixe xat comú és «En públic», i «En privat» és el xat privat amb
 * Sóc de Poble. Les pàgines del sistema també: cap gestor propi.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {}, cerca: '' }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(mocks.cerca)],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
import MurSection from './MurSection.jsx';
import MercatSection from '../mercat/MercatSection.jsx';
import PoblesSection from '../pobles/PoblesSection.jsx';
import { TEXTOS_COMENTAR } from '../../components/universal/barres/BarraBlava.jsx';

const PRIVAT = TEXTOS_COMENTAR.privat[1];
const PUBLIC = TEXTOS_COMENTAR.public[1];

const COPY_CONSTITUCIO = { title: 'Constitució', subtitle: 'La llei del poble', date: '2026-08-20T00:00:00.000Z' };

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cerca = '';
  mocks.core = { status: 'ready', error: null, pageCopy: { constitucio: COPY_CONSTITUCIO }, sortedTowns: [] };
  mocks.mur = {
    status: 'ready', error: null,
    sortedFeedPosts: [{ id: 'coca', type: 'feed', title: 'Recepta de coca', created_at: '2026-09-01T10:00:00.000Z' }],
    sortedMarketItems: [{ id: 'samarreta', type: 'market', title: 'Samarreta', created_at: '2026-09-02T10:00:00.000Z' }],
    sortedEvents: [{ id: 'aplec', type: 'event', title: 'Aplec', date: '2026-08-14T09:00:00' }]
  };
});

/* L'últim destí de navigate, llegit com el llegirà XatSection (onada 3). */
const desti = () => {
  const url = new URL(mocks.navigate.mock.calls.at(-1)[0], 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};
/* Obri el menú de Comentar d'una targeta i hi tria una via (per defecte, la
   pública). */
const comenta = (titol, via = PUBLIC) => {
  fireEvent.click(screen.getByRole('button', { name: `Comentar ${titol}` }));
  fireEvent.click(screen.getByRole('menuitem', { name: via }));
};

test('Mur · una publicació, un producte i un acte, cadascun al seu xat comú amb el seu tipus', () => {
  render(<MurSection />);
  comenta('Recepta de coca');
  expect(desti()).toEqual({ cami: '/xat', sobre: 'publicacio:coca', titol: 'Recepta de coca', ruta: '/mur/coca' });
  comenta('Samarreta');
  expect(desti()).toEqual({ cami: '/xat', sobre: 'producte:samarreta', titol: 'Samarreta', ruta: '/mercat/samarreta' });
  comenta('Aplec');
  expect(desti()).toEqual({ cami: '/xat', sobre: 'esdeveniment:aplec', titol: 'Aplec', ruta: '/events/aplec' });
  expect(mocks.navigate).not.toHaveBeenCalledWith('/xat');
});

/* Ordre del Mestre (261007) · Una pàgina del sistema, com totes: «En públic»
   és el xat comú de la seua ruta i «En privat», el missatge directe amb Sóc de
   Poble. Sense proveïdor del xat de Sóc de Poble, el de la llavor. Derogat el
   gestor propi del mateix dia, que només oferia el privat. */
test('Mur · una pàgina del sistema: les dues vies, la pública per la seua ruta i la privada amb Sóc de Poble', () => {
  render(<MurSection />);
  comenta('Constitució');
  expect(desti()).toEqual({ cami: '/xat', sobre: 'pagina:/constitucio', titol: 'Constitució', ruta: '/constitucio' });
  comenta('Constitució', PRIVAT);
  expect(desti()).toEqual({ cami: '/xat', amb: 'socdepoble' });
  comenta('Recepta de coca', PRIVAT);
  expect(desti()).toEqual({ cami: '/xat', amb: 'socdepoble' });
});

test('Mur · Connectar i Comentar d’una targeta parlen del mateix element', () => {
  render(<MurSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Recepta de coca' }));
  const connectar = new URL(mocks.navigate.mock.calls.at(-1)[0], 'http://localhost');
  expect(Object.fromEntries(connectar.searchParams)).toMatchObject({ item_id: 'coca', objecte: 'publicacio', ruta: '/mur/coca' });
  fireEvent.click(screen.getByRole('button', { name: 'Connectar amb Aplec' }));
  expect(new URL(mocks.navigate.mock.calls.at(-1)[0], 'http://localhost').searchParams.get('objecte')).toBe('esdeveniment');
});

test('Mur · la barra de la llista obri el xat del Mur per la seua ruta canònica: un filtre no en fa un altre', () => {
  mocks.cerca = 'date=2026-09-01';
  window.history.replaceState(null, '', '/mur?date=2026-09-01');
  const { container } = render(<MurSection />);
  const comentar = container.querySelector('header.bar-blue .sp-card-actions').children[1];
  expect([comentar.getAttribute('aria-label'), comentar.getAttribute('aria-haspopup')]).toEqual(['Comentar', 'menu']);
  fireEvent.click(comentar);
  fireEvent.click(screen.getByRole('menuitem', { name: PUBLIC }));
  expect(desti()).toEqual({ cami: '/xat', sobre: 'pagina:/mur', titol: 'Mur', ruta: '/mur' });
});

test('Mercat · un producte, al xat comú del producte', () => {
  render(<MercatSection />);
  comenta('Samarreta');
  expect(desti()).toEqual({ cami: '/xat', sobre: 'producte:samarreta', titol: 'Samarreta', ruta: '/mercat/samarreta' });
});

test('Pobles · un poble, al seu xat (la seua Comunitat)', () => {
  mocks.core = { ...mocks.core, sortedTowns: [{ id: 'sella', title: 'Sella', comarca: 'Marina Baixa', content: 'Poble.' }] };
  render(<PoblesSection />);
  comenta('Sella');
  expect(desti()).toEqual({ cami: '/xat', sobre: 'poble:sella', titol: 'Sella', ruta: '/pobles/sella' });
});
