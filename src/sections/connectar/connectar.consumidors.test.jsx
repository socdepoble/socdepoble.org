/**
 * T43 (ordre del Mestre, 260928) · Tots els «Connectar» porten el descriptor
 * de l'objecte: pobles, agenda i avisos del sistema del Mur (D9) i el
 * directori de persones, entitats i IA. Abans queien al Connectar genèric,
 * que només enviava el títol (item_id=<nom>) i perdia id, secció i ruta.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {}
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
import PoblesSection from '../pobles/PoblesSection.jsx';
import MurSection from '../mur/MurSection.jsx';
import ProfileSection from '../profile/ProfileSection.jsx';
import { SYSTEM_PAGES } from '../../config/systemPages.js';

const parametres = (crida) => {
  const url = new URL(crida, 'http://localhost');
  expect(url.pathname).toBe('/connectar');
  return Object.fromEntries(url.searchParams);
};
const connecta = (nom) => {
  fireEvent.click(screen.getByRole('button', { name: `Connectar amb ${nom}` }));
  return parametres(mocks.navigate.mock.calls.at(-1)[0]);
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.core = {
    status: 'ready', error: null,
    sortedTowns: [{ id: 'sella', title: 'Sella', comarca: 'Marina Baixa', content: 'Poble de muntanya.' }],
    pageCopy: Object.fromEntries(SYSTEM_PAGES.map((pagina) => [pagina.key, { title: `Pàgina ${pagina.key}` }]))
  };
  mocks.mur = {
    status: 'ready', error: null, sortedFeedPosts: [], sortedMarketItems: [],
    sortedEvents: [{ id: 'aplec', type: 'event', title: 'Aplec de la Torre', date: '2026-10-04T10:00:00.000Z' }]
  };
});

test('un poble es connecta com a poble, amb id i ruta', () => {
  render(<PoblesSection />);
  expect(connecta('Sella')).toEqual({ item_id: 'sella', title: 'Sella', sectionId: 'pobles', objecte: 'poble', ruta: '/pobles/sella' });
});

test('Mur: l’agenda es connecta com a esdeveniment i un avís del sistema com a pàgina amb la seua ruta (D9)', () => {
  render(<MurSection />);
  expect(connecta('Aplec de la Torre')).toEqual({
    item_id: 'aplec', title: 'Aplec de la Torre', sectionId: 'events', objecte: 'esdeveniment', ruta: '/events/aplec'
  });
  expect(connecta('Pàgina projecte')).toEqual({ item_id: 'projecte', title: 'Pàgina projecte', objecte: 'pagina', ruta: '/projecte' });
});

test('directori: persona, entitat i IA amb el seu tipus i la ruta del perfil públic', () => {
  render(<ProfileSection agents={[
    { id: '0001', name: 'Mestre Poble', type: 'PERSON' },
    { id: 'socdepoble', name: 'Sóc de Poble', type: 'COMPANY' },
    { id: 'iaia', name: 'IAIA MarIA', type: 'AI' }
  ]} />);
  expect(connecta('Mestre Poble')).toEqual({ item_id: '0001', title: 'Mestre Poble', sectionId: 'perfil', objecte: 'persona', ruta: '/gent/0001' });
  // Poliment T43 · el mateix camí que la fitxa pública: una entitat porta organitzacio=ID.
  expect(connecta('Sóc de Poble')).toMatchObject({ objecte: 'entitat', ruta: '/empresa/socdepoble', organitzacio: 'socdepoble' });
  expect(connecta('IAIA MarIA')).toMatchObject({ objecte: 'ia', ruta: '/perfil/iaia' });
});
