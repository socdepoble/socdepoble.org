/**
 * T6 (ordre del Mestre, 260930) · L'Agenda del Mur porta el seu mes damunt de
 * les targetes. S'obri al mes de l'acte més pròxim, diu quan el mes no té
 * actes i clicar un dia és el filtre ?date= de sempre. Les altres pestanyes
 * no pinten cap calendari.
 */
import React from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), setSearchParams: vi.fn(), params: new URLSearchParams(),
  t: (_, alternativa) => alternativa, core: {}, mur: {}
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params, mocks.setSearchParams],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
import MurSection from './MurSection.jsx';

const acte = (id, date, title, time) => ({
  id, type: 'event', title, date, time, entradilla: `Entradilla de ${title}`, author_name: 'Sóc de Poble', author_location: 'La Torre de les Maçanes'
});
const ACTES = [
  acte('aplec-2023', '2023-01-29', '2n Aplec pel Territori', '10:00'),
  acte('fira', '2026-11-14', 'Fira de tardor'),
  acte('concert', '2027-03-01', 'Concert de primavera', '19:00')
];
const nomMes = (any, mes) => new Date(any, mes, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
const calendari = () => document.querySelector('.sdp-calendari--gran');
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const agenda = () => act(() => screen.getByRole('button', { name: 'Agenda' }).click());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 30, 12, 0));
  mocks.params = new URLSearchParams();
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = {
    status: 'ready', error: null, sortedEvents: ACTES, sortedMarketItems: [],
    sortedFeedPosts: [{ id: 'p', type: 'feed', title: 'Crònica', created_at: '2026-09-01T10:00:00.000Z' }]
  };
});

test('Mostrar tot, Mercat i Mapa no pinten cap calendari', () => {
  render(<MurSection />);
  expect(calendari()).toBeNull();
  expect(titolsDeTargetes()).toContain('Crònica');
  act(() => screen.getByRole('button', { name: 'Mercat' }).click());
  expect(calendari()).toBeNull();
  act(() => screen.getByRole('button', { name: 'Mapa' }).click());
  expect(calendari()).toBeNull();
});

test('l’Agenda porta el mes damunt de les targetes, obert al mes de l’acte que ve més prompte', () => {
  render(<MurSection />);
  agenda();
  const graella = calendari();
  expect(graella).not.toBeNull();
  expect(graella.compareDocumentPosition(document.querySelector('.sdp-card-grid')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(graella.querySelector('caption').textContent).toBe(nomMes(2026, 10));
  expect(within(graella).getByText('Fira de tardor').className).toBe('sdp-calendari__pindola');
  expect(titolsDeTargetes()).toEqual(['Concert de primavera', 'Fira de tardor', '2n Aplec pel Territori']);
});

test('sense cap acte per vindre, el mes del més recent; un mes sense actes ho diu', () => {
  mocks.mur.sortedEvents = [ACTES[0]];
  render(<MurSection />);
  agenda();
  expect(calendari().querySelector('caption').textContent).toBe(nomMes(2023, 0));
  expect(screen.queryByText(/Cap acte a l’agenda/)).toBeNull();
  act(() => screen.getByRole('button', { name: 'Mes següent' }).click());
  expect(screen.getByText(`Cap acte a l’agenda de ${nomMes(2023, 1)}. N’hi ha en altres mesos: passa de mes amb les fletxes.`)).toBeTruthy();
});

test('clicar un dia posa ?date=; amb el dia a la URL, s’obri al seu mes i tornar-lo a clicar el lleva', () => {
  render(<MurSection />);
  agenda();
  const catorze = within(calendari()).getAllByRole('button')[13];
  expect(catorze.getAttribute('aria-label')).toMatch(/ · 1 acte: Fira de tardor$/);
  act(() => catorze.click());
  expect(mocks.setSearchParams).toHaveBeenLastCalledWith({ date: '2026-11-14' });
  cleanup();

  mocks.params = new URLSearchParams('date=2023-01-29');
  render(<MurSection />);
  agenda();
  expect(calendari().querySelector('caption').textContent).toBe(nomMes(2023, 0));
  const triat = within(calendari()).getByRole('button', { pressed: true });
  expect(triat.getAttribute('aria-label')).toMatch(/2n Aplec pel Territori$/);
  // Les targetes de davall, filtrades pel mateix dia.
  expect(titolsDeTargetes()).toEqual(['2n Aplec pel Territori']);
  act(() => triat.click());
  expect(mocks.setSearchParams).toHaveBeenLastCalledWith({ date: null });
});

test('una agenda buida ho diu', () => {
  mocks.mur.sortedEvents = [];
  render(<MurSection />);
  agenda();
  expect(screen.getByText(`Cap acte a l’agenda de ${nomMes(2026, 8)}. L’agenda encara no en té cap.`)).toBeTruthy();
});
