/**
 * T6 (ordre del Mestre, 260930) · El Calendari del Mur porta el seu mes damunt
 * de les targetes. S'obri al mes de l'acte més pròxim, diu quan el mes no té
 * actes i clicar un dia és el filtre ?date= de sempre. Les altres pestanyes
 * no pinten cap calendari.
 *
 * Ordre del Mestre, 261001 · La pestanya es deia «Agenda» i ara es diu
 * «Calendari».
 *
 * Onada 6 (prompt 261009_0230, punt 1: «El Mur i el Calendari gastaven
 * components diferents; s'han d'unificar absolutament sota l'estètica i
 * funcionalitat de Google Calendar») · La pestanya munta el MATEIX calendari
 * que /calendari (CalendariDelMur → CalendariDelPoble): «Hui ‹ ›» amb el títol
 * a la mateixa fila, les cinc vistes, l'estat a la URL (useEstatCalendari,
 * amb replace), l'enllaç de cada acte a la seua pàgina i, davall, les
 * targetes del dia triat o del període que es veu, amb la regla de
 * /calendari. Estes proves canvien amb ell: abans, la taula vella
 * (.sdp-calendari--gran, caption, píndoles) i un mes propi en un useState.
 * Les de T5 (les dades del Mur, a «Mostrar tot») no canvien.
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
/* P1-64 · La pestanya «Mapa» munta el Mapa Fotogràfic en diferit (Leaflet):
   ací només compta que no hi ha calendari. El mapa té les seues proves
   (MapaFotografic.test.jsx i MurSection.mapa.test.jsx). */
vi.mock('./MapaFotografic.jsx', () => ({ default: () => null }));
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
/* «de setembre de 2026», «d’octubre de 2026». */
const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);
const nomMesLlarg = (any, mes) => {
  const nom = nomMes(any, mes);
  return nom.charAt(0).toUpperCase() + nom.slice(1);
};
const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
/* La vista Mes del calendari únic (VistaMes): la regió amb el nom del mes. */
const calendari = () => document.querySelector('.sdp-cal-mes');
const regioMes = (any, mes) => screen.getByRole('region', { name: `Calendari ${ambDe(nomMes(any, mes))}` });
const dia = (data) => within(calendari()).getByRole('button', { name: (nom) => nom.startsWith(`${dataLlarga(data)} · `) });
const peces = () => [...calendari().querySelectorAll('.sdp-cal-barra')].map((peca) => peca.textContent);
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const agenda = () => act(() => screen.getByRole('button', { name: 'Calendari' }).click());
const filtre = (nom) => act(() => within(screen.getByRole('group', { name: 'Filtres del mur' })).getByRole('button', { name: nom }).click());
/* El que escriu el calendari a la URL (useEstatCalendari: paramsDeLEstat, amb replace). */
const URL_DEL_CALENDARI = (canvis) => [{ vista: 'mes', setmana: null, mes: null, any: null, date: null, ...canvis }, { replace: true }];
/* La targeta d'un títol: la pastilla (hora i dia) i la insígnia (dia, mes, any). */
const targeta = (titol) => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')]
  .find((t) => t.textContent === titol).closest('article');
const pastilla = (titol) => [...targeta(titol).querySelectorAll('.btn-date-time span')].map((s) => s.textContent);
const insignia = (titol) => {
  const badge = targeta(titol).querySelector('.sp-card-calendar-badge');
  return badge && ['dia', 'mes', 'any'].map((peca) => badge.querySelector(`.sp-card-calendar-badge__${peca}`)?.textContent ?? null);
};

let avis;
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  avis.mockRestore();
});
beforeEach(() => {
  vi.clearAllMocks();
  // Sense PAGE_COPY, el Mur avisa en desenvolupament de cada pàgina de sistema: no és d'esta prova.
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
  expect(document.querySelector('.sdp-cal-navegacio')).toBeNull();
  expect(titolsDeTargetes()).toContain('Crònica');
  act(() => screen.getByRole('button', { name: 'Mercat' }).click());
  expect(calendari()).toBeNull();
  act(() => screen.getByRole('button', { name: 'Mapa' }).click());
  expect(calendari()).toBeNull();
});

test('Onada 6 · la pestanya munta el calendari de /calendari: «Hui ‹ ›» i el títol a la mateixa fila, les cinc vistes i el mes de l’acte que ve més prompte', () => {
  render(<MurSection />);
  agenda();
  // El calendari vell (la taula de CalendariEsdeveniments) ja no es munta.
  expect(document.querySelector('.sdp-calendari--gran, .sdp-calendari__barra')).toBeNull();
  const regio = regioMes(2026, 10);
  expect(regio).toBe(calendari());
  const navegacio = document.querySelector('.sdp-cal-navegacio');
  expect([...navegacio.children].filter((n) => n.tagName === 'BUTTON').map((b) => b.getAttribute('aria-label') ?? b.textContent))
    .toEqual(['Hui', 'Mes anterior', 'Mes següent']);
  // El títol del període és l'h3 de la barra, entre les fletxes i el selector (com a Google Calendar).
  const titol = screen.getByRole('heading', { level: 3, name: nomMesLlarg(2026, 10) });
  expect(titol.parentElement).toBe(navegacio);
  expect(titol.previousElementSibling.getAttribute('aria-label')).toBe('Mes següent');
  expect(titol.nextElementSibling).toBe(screen.getByRole('group', { name: 'Vista' }));
  expect([...screen.getByRole('group', { name: 'Vista' }).querySelectorAll('button')].map((b) => b.textContent))
    .toEqual(['Setmana', 'Dues setmanes', 'Mes', 'Any', 'Agenda']);
  expect(screen.getByRole('button', { name: 'Mes', pressed: true })).toBeTruthy();
  // Davall del calendari, les targetes del mes que es veu (abans, tots els actes de tots els mesos).
  expect(regio.compareDocumentPosition(document.querySelector('.sdp-card-grid')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(peces()).toEqual(['Fira de tardor']);
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  expect(document.querySelector('h4[role="status"]').textContent).toBe('1 publicació');
  // Obrir la pestanya no escriu res a la URL.
  expect(mocks.setSearchParams).not.toHaveBeenCalled();
});

test('Onada 6 · clicar l’esdeveniment porta a la seua pàgina: un enllaç del router a /events/fira, fora del botó del dia', () => {
  render(<MurSection />);
  agenda();
  const enllac = calendari().querySelector('a.sdp-cal-enllac');
  expect(enllac.getAttribute('href')).toBe('/events/fira');
  expect(enllac.textContent).toBe('Fira de tardor');
  // La capa de les peces continua aria-hidden i la graella, un sol punt de tabulació.
  expect(enllac.tabIndex).toBe(-1);
  expect(enllac.closest('ol').getAttribute('aria-hidden')).toBe('true');
  expect(enllac.closest('button')).toBeNull();
  expect(enllac.closest('li').classList.contains('sdp-cal-barra--enllac')).toBe(true);
});

test('clicar un dia (fora de l’enllaç) posa ?date=; amb el dia a la URL, s’obri al seu mes amb les seues targetes i tornar-lo a clicar el lleva', () => {
  render(<MurSection />);
  agenda();
  const catorze = dia(new Date(2026, 10, 14));
  expect(catorze.getAttribute('aria-label')).toMatch(/ · 1 publicació: Fira de tardor$/);
  act(() => catorze.click());
  expect(mocks.setSearchParams).toHaveBeenLastCalledWith(...URL_DEL_CALENDARI({ date: '2026-11-14' }));
  cleanup();

  mocks.params = new URLSearchParams('date=2023-01-29');
  render(<MurSection />);
  agenda();
  expect(regioMes(2023, 0)).toBeTruthy();
  const triat = within(calendari()).getByRole('button', { pressed: true });
  expect(triat.getAttribute('aria-label')).toMatch(/2n Aplec pel Territori$/);
  // Les targetes de davall, les del mateix dia (entradesDelDia, la regla d'acteOcorreElDia).
  expect(titolsDeTargetes()).toEqual(['2n Aplec pel Territori']);
  act(() => triat.click());
  expect(mocks.setSearchParams).toHaveBeenLastCalledWith(...URL_DEL_CALENDARI({ mes: '2023-01' }));
});

test('sense cap acte per vindre, el mes del més recent; les fletxes escriuen ?mes= i un mes sense actes ho diu', () => {
  mocks.mur.sortedEvents = [ACTES[0]];
  render(<MurSection />);
  agenda();
  expect(regioMes(2023, 0)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['2n Aplec pel Territori']);
  act(() => screen.getByRole('button', { name: 'Mes següent' }).click());
  expect(mocks.setSearchParams).toHaveBeenLastCalledWith(...URL_DEL_CALENDARI({ mes: '2023-02' }));
  cleanup();

  mocks.params = new URLSearchParams('vista=mes&mes=2023-02');
  render(<MurSection />);
  agenda();
  expect(regioMes(2023, 1)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual([]);
  expect(screen.getByText('Cap publicació este mes.')).toBeTruthy();
});

test('un calendari buit ho diu, al mes de hui', () => {
  mocks.mur.sortedEvents = [];
  render(<MurSection />);
  agenda();
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(screen.getByText('Cap publicació este mes.')).toBeTruthy();
});

test('Onada 6 · les cinc vistes: l’Agenda del Mur, amb l’enllaç de cada acte a la seua pàgina', () => {
  mocks.params = new URLSearchParams('vista=agenda&mes=2026-11');
  render(<MurSection />);
  agenda();
  const regio = screen.getByRole('region', { name: `Agenda ${ambDe(nomMes(2026, 10))}` });
  const enllac = within(regio).getByRole('link', { name: 'Fira de tardor' });
  expect(enllac.getAttribute('href')).toBe('/events/fira');
  expect(screen.getByRole('button', { name: 'Agenda', pressed: true })).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
});

test('Onada 6 · en eixir de la pestanya es lleven la vista i el període; el ?date= es queda', () => {
  mocks.params = new URLSearchParams('vista=setmana&setmana=2026-W46&date=2026-11-14');
  render(<MurSection />);
  agenda();
  expect(document.querySelector('.sdp-cal-setmana')).not.toBeNull();
  filtre('Mostrar tot');
  expect(mocks.setSearchParams).toHaveBeenLastCalledWith({ vista: null, setmana: null, mes: null, any: null });
  expect(document.querySelector('.sdp-cal-navegacio')).toBeNull();
  // La graella general hi torna, filtrada pel ?date= de sempre.
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  cleanup();

  // Sense cap paràmetre del calendari, eixir no escriu res.
  mocks.setSearchParams.mockClear();
  mocks.params = new URLSearchParams('date=2026-11-14');
  render(<MurSection />);
  agenda();
  filtre('Mercat');
  filtre('Mapa');
  expect(mocks.setSearchParams).not.toHaveBeenCalled();
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

/* Onada 6 · Un sol calendari, una sola regla: la de /calendari
   (calendariGlobal.js), on un acte sense dia real va el dia de la seua
   pastilla, com el filtre ?date= del Mur (abans, el calendari del Mur no el
   pintava). */
test('T5 · un acte sense dia real no porta insígnia; el calendari i el filtre el troben el dia de la seua pastilla', () => {
  mocks.mur.sortedEvents = [...ACTES, SENSE_DIA];
  render(<MurSection />);
  expect(insignia('Ball sense dia')).toBeNull();
  expect(pastilla('Ball sense dia')).toEqual(['10:15', '20/09/26']);
  cleanup();

  mocks.params = new URLSearchParams('date=2026-09-20');
  render(<MurSection />);
  expect(titolsDeTargetes()).toEqual(['Ball sense dia']);
  agenda();
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(peces()).toEqual(['10:15 Ball sense dia']);
  expect(titolsDeTargetes()).toEqual(['Ball sense dia']);
});

test('T5 · el filtre ?date= troba un acte de diversos dies cada dia que el pinta el Calendari', () => {
  mocks.mur.sortedEvents = [...ACTES, { ...acte('festes', '2026-10-01', 'Festes'), fi: { data: '2026-10-04' } }];
  mocks.params = new URLSearchParams('date=2026-10-02');
  render(<MurSection />);
  expect(titolsDeTargetes()).toEqual(['Festes']);
  agenda();
  expect(titolsDeTargetes()).toEqual(['Festes']);
  const triat = within(calendari()).getByRole('button', { pressed: true });
  expect(triat.getAttribute('aria-label')).toMatch(/ · 1 publicació: Festes$/);
});

test('T5 · amb un inici al payload, el filtre el troba el dia de l’inici (el que pinta el Calendari), no el de date', () => {
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
  /* Ordre del Mestre, 261001 (tasca 4 i carril A) · la pastilla obri el
     Calendari en el seu mes, amb totes les targetes d'eixe mes (abans
     '/mur?date=…' i després '/calendari?date=…'); el filtre ?date= del Mur
     continua viu. */
  expect(mocks.navigate).toHaveBeenLastCalledWith('/calendari?mes=2026-10');
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

/* calendari-1 · Amb l'estat a la URL (Onada 6), el mes seguix el ?date= que
   canvia amb el Calendari obert (la pastilla d'una targeta, o tornar arrere),
   i el ?mes= que hi escriu llevar el dia el manté. */
test('calendari-1 · el mes seguix el ?date= que canvia amb el Calendari obert (la pastilla d’una targeta, o tornar arrere)', () => {
  const { rerender } = render(<MurSection />);
  agenda();
  expect(regioMes(2026, 10)).toBeTruthy();

  mocks.params = new URLSearchParams('date=2027-03-01');
  rerender(<MurSection />);
  expect(regioMes(2027, 2)).toBeTruthy();
  expect(within(calendari()).getByRole('button', { pressed: true }).getAttribute('aria-label')).toMatch(/Concert de primavera$/);
  expect(titolsDeTargetes()).toEqual(['Concert de primavera']);

  // Llevar el dia (la URL que escriu el calendari) no mou el mes.
  mocks.params = new URLSearchParams('vista=mes&mes=2027-03');
  rerender(<MurSection />);
  expect(regioMes(2027, 2)).toBeTruthy();
  expect(within(calendari()).queryByRole('button', { pressed: true })).toBeNull();
  expect(titolsDeTargetes()).toEqual(['Concert de primavera']);
});

test('calendari-4 · amb només actes que el calendari no sap pintar, s’obri al mes de hui i ho diu', () => {
  mocks.mur.sortedEvents = [{ ...acte('festes', '2026-12-05', 'Festes'), recurrencia: ['RRULE:FREQ=YEARLY'] }];
  render(<MurSection />);
  agenda();
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(peces()).toEqual([]);
  expect(screen.getByText('Cap publicació este mes.')).toBeTruthy();
  expect(screen.getByText(/^Un acte es repetix d’una manera que el calendari encara no sap pintar/)).toBeTruthy();
});
