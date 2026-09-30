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
/* T5 · Un acte sense dia real: només porta la data de publicació. */
const SENSE_DIA = { id: 'sense-dia', type: 'event', title: 'Ball sense dia', created_at: '2026-09-20T08:15:00+00:00' };
const nomMes = (any, mes) => new Date(any, mes, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
const calendari = () => document.querySelector('.sdp-calendari--gran');
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const agenda = () => act(() => screen.getByRole('button', { name: 'Agenda' }).click());
/* La targeta d'un títol: la pastilla (hora i dia) i la insígnia (dia, mes, any). */
const targeta = (titol) => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')]
  .find((t) => t.textContent === titol).closest('article');
const pastilla = (titol) => [...targeta(titol).querySelectorAll('.btn-date-time span')].map((s) => s.textContent);
const insignia = (titol) => {
  const badge = targeta(titol).querySelector('.sp-card-calendar-badge');
  return badge && ['dia', 'mes', 'any'].map((peca) => badge.querySelector(`.sp-card-calendar-badge__${peca}`)?.textContent ?? null);
};

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

/* ── T5 (ordre del Mestre, 260930) · Les dades del Mur ───────────────────── */

test('T5 · Llei del Píxel: l’Aplec es pinta com sempre i la Fira, sense cap hora inventada', () => {
  render(<MurSection />);
  expect(pastilla('2n Aplec pel Territori')).toEqual(['10:00', '29/01/23']);
  expect(insignia('2n Aplec pel Territori')).toEqual(['29', 'GENER', '2023']);
  // Abans, «01:00» (la mitjanit UTC de new Date('2026-11-14') en hora d'hivern).
  expect(pastilla('Fira de tardor')).toEqual(['14/11/26']);
  expect(insignia('Fira de tardor')).toEqual(['14', 'NOVEMBRE', '2026']);
});

test('T5 · un acte sense dia real no porta insígnia ni ix al calendari; el troba el dia de la seua pastilla', () => {
  mocks.mur.sortedEvents = [...ACTES, SENSE_DIA];
  render(<MurSection />);
  agenda();
  expect(insignia('Ball sense dia')).toBeNull();
  expect(pastilla('Ball sense dia')).toEqual(['10:15', '20/09/26']);
  expect(within(calendari()).queryByText('Ball sense dia')).toBeNull();
  cleanup();

  mocks.params = new URLSearchParams('date=2026-09-20');
  render(<MurSection />);
  expect(titolsDeTargetes()).toEqual(['Ball sense dia']);
});

test('T5 · el filtre ?date= troba un acte de diversos dies cada dia que el pinta l’Agenda', () => {
  mocks.mur.sortedEvents = [...ACTES, { ...acte('festes', '2026-10-01', 'Festes'), fi: { data: '2026-10-04' } }];
  mocks.params = new URLSearchParams('date=2026-10-02');
  render(<MurSection />);
  agenda();
  expect(titolsDeTargetes()).toEqual(['Festes']);
  const triat = within(calendari()).getByRole('button', { pressed: true });
  expect(triat.getAttribute('aria-label')).toMatch(/ · 1 acte: Festes$/);
});

test('T5 · amb un inici al payload, el filtre el troba el dia de l’inici (el que pinta l’Agenda), no el de date', () => {
  mocks.mur.sortedEvents = [{ ...acte('aplec-tardor', '2026-10-01', 'Aplec de tardor'), inici: '2026-10-03T18:00' }];
  mocks.params = new URLSearchParams('date=2026-10-03');
  render(<MurSection />);
  expect(titolsDeTargetes()).toEqual(['Aplec de tardor']);
  cleanup();

  mocks.params = new URLSearchParams('date=2026-10-01');
  render(<MurSection />);
  expect(titolsDeTargetes()).toEqual([]);
});

test('T5 · clicar la pastilla d’un acte no el fa desaparéixer, encara que la seua repetició no genere el dia d’inici', () => {
  // L'1-10-2026 és dijous; el mercat es repetix els dissabtes.
  mocks.mur.sortedEvents = [...ACTES, { ...acte('mercat', '2026-10-01', 'Mercat'), recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] }];
  render(<MurSection />);
  expect(pastilla('Mercat')).toEqual(['01/10/26']);
  act(() => targeta('Mercat').querySelector('.btn-date-time').click());
  expect(mocks.navigate).toHaveBeenLastCalledWith('/mur?date=2026-10-01');
  cleanup();

  for (const dia of ['2026-10-01', '2026-10-03']) {
    mocks.params = new URLSearchParams(`date=${dia}`);
    render(<MurSection />);
    expect(titolsDeTargetes()).toEqual(['Mercat']);
    cleanup();
  }
});

/* T51 i T5 · El Mur s'ordena pel MATEIX dia que pinta la pastilla: el de
   l'inici del model per a un acte (encara que el payload porte un altre
   `date`, o cap), sense que una edició posterior el pose al capdamunt. */
test('T5 · el Mur s’ordena pel dia que pinta la pastilla de cada acte', () => {
  mocks.mur.sortedEvents = [
    { ...acte('aplec-tardor', '2026-10-01', 'Aplec de tardor'), inici: '2026-10-03T18:00' },
    { ...acte('concert', undefined, 'Concert'), inici: '2026-10-05T19:00', created_at: '2026-09-01T10:00:00Z' },
    { ...acte('festa', '2026-09-10', 'Festa'), created_at: '2026-09-01T10:00:00Z', updated_at: '2026-10-06T10:00:00Z' }
  ];
  mocks.mur.sortedFeedPosts = [{ id: 'p', type: 'feed', title: 'Crònica', created_at: '2026-10-02T10:00:00.000Z' }];
  render(<MurSection />);
  expect(pastilla('Aplec de tardor')).toEqual(['18:00', '03/10/26']);
  expect(pastilla('Concert')).toEqual(['19:00', '05/10/26']);
  expect(pastilla('Festa')).toEqual(['10/09/26']);
  expect(titolsDeTargetes()).toEqual(['Concert', 'Aplec de tardor', 'Crònica', 'Festa']);
});

test('T5 · D5: una clau que no existix no troba cap acte (el 30 de febrer no desborda al 2 de març)', () => {
  mocks.mur.sortedEvents = [...ACTES, acte('marc', '2026-03-02', 'Mercat de març')];
  mocks.params = new URLSearchParams('date=2026-02-30');
  render(<MurSection />);
  expect(titolsDeTargetes()).toEqual([]);
});

test('calendari-1 · el mes seguix el ?date= que canvia amb l’Agenda oberta (la pastilla d’una targeta, o tornar arrere)', () => {
  const { rerender } = render(<MurSection />);
  agenda();
  expect(calendari().querySelector('caption').textContent).toBe(nomMes(2026, 10));

  mocks.params = new URLSearchParams('date=2027-03-01');
  rerender(<MurSection />);
  expect(calendari().querySelector('caption').textContent).toBe(nomMes(2027, 2));
  expect(within(calendari()).getByRole('button', { pressed: true }).getAttribute('aria-label')).toMatch(/Concert de primavera$/);
  expect(titolsDeTargetes()).toEqual(['Concert de primavera']);

  // Llevar el dia no mou el mes.
  mocks.params = new URLSearchParams();
  rerender(<MurSection />);
  expect(calendari().querySelector('caption').textContent).toBe(nomMes(2027, 2));
  expect(within(calendari()).queryByRole('button', { pressed: true })).toBeNull();
});

test('calendari-4 · amb només actes que el calendari no sap pintar, el mes no promet cap altre mes', () => {
  mocks.mur.sortedEvents = [{ ...acte('festes', '2026-12-05', 'Festes'), recurrencia: ['RRULE:FREQ=YEARLY'] }];
  render(<MurSection />);
  agenda();
  expect(calendari().querySelector('caption').textContent).toBe(nomMes(2026, 8));
  const avis = screen.getByText(/^Cap acte a l’agenda de/);
  expect(avis.textContent).toBe(`Cap acte a l’agenda de ${nomMes(2026, 8)}.`);
  expect(screen.getByText(/^Un acte es repetix d’una manera que el calendari encara no sap pintar/)).toBeTruthy();
});
