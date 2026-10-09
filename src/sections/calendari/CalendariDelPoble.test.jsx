/**
 * Onada 6 (prompt 261009_0230, punt 1: «El clic en un esdeveniment ha d'obrir
 * la targeta sencera, i el clic en el "dia" del quadre (fora de l'enllaç de
 * l'esdeveniment) ha de mostrar les targetes filtrades per eixe dia davall»;
 * pla de l'Onada 5, tasca 16: «portarà a la pàgina de la publicació») · El
 * calendari únic, el que munten /calendari i la pestanya Calendari del Mur.
 * El router és el de veres (MemoryRouter): el clic a l'esdeveniment navega
 * amb el Link de l'app i el clic al dia escriu el ?date= (useEstatCalendari).
 * Les proves de /calendari (CalendariSection.*.test.jsx) en fixen la resta i
 * no s'han tocat: l'extracció no canvia el seu DOM.
 */
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { horaDe } from '../../utils/calendari.js';

vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
import { CalendariDelPoble } from './CalendariDelPoble.jsx';
import { entradaDeLAgenda, entradesDelCalendari, rutaDeLEntrada } from './calendariGlobal.js';
import { useEstatCalendari } from './useEstatCalendari.js';

const AVUI = new Date(2026, 9, 1);
const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17' };
const CRONICA = { id: 'cronica', type: 'feed', title: 'Crònica', created_at: '2026-10-05T10:00:00.000Z' };
/* Un mainHref de fora (un payload escrit per PostgREST) no navega fora: el detall de la secció. */
const DE_FORA = { id: 'fora', type: 'feed', title: 'De fora', mainHref: 'https://fals-poble.example/entra', created_at: '2026-10-09T10:00:00.000Z' };
/* Un mainHref de l'app (una pàgina del sistema) es conserva, com a la targeta. */
const PROPIA = { id: 'propia', type: 'feed', title: 'Pròpia', mainHref: '/page/xat', created_at: '2026-10-13T10:00:00.000Z' };
const OLI = { id: 'oli', type: 'market', title: 'Oli', created_at: '2026-10-21T10:00:00.000Z' };
const CONCERT = entradaDeLAgenda({ id: 's1', titol: 'Concert de l’agenda', inici: '2026-10-10T17:00:00.000Z' });
const ENTRADES = [...entradesDelCalendari([FIRA], [CRONICA, DE_FORA, PROPIA], [OLI]), CONCERT];

function Calendari({ entrades }) {
  const { estat, navega, canviaVista, triaDia, obriDia } = useEstatCalendari({ obertura: null, avui: AVUI });
  return (
    <CalendariDelPoble estat={estat} navega={navega} canviaVista={canviaVista} triaDia={triaDia} obriDia={obriDia}
      entrades={entrades} avui={AVUI} />
  );
}
function Sonda() {
  const { pathname, search } = useLocation();
  return <span data-testid="on-soc">{`${pathname}${search ? `?${search}` : ''}`}</span>;
}
const onSoc = () => screen.getByTestId('on-soc').textContent;
const pinta = (consulta = 'vista=mes&mes=2026-10', entrades = ENTRADES) => render(
  <MemoryRouter rutaInicial={`/calendari?${consulta}`}><Calendari entrades={entrades} /><Sonda /></MemoryRouter>
);
const graella = () => document.querySelector('.sdp-cal-mes');
const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const enllacos = () => [...graella().querySelectorAll('a.sdp-cal-enllac')].map((a) => [a.textContent, a.getAttribute('href')])
  .sort(([, a], [, b]) => a.localeCompare(b));
const hora = (iso) => horaDe(new Date(iso));

let avis;
beforeEach(() => {
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  avis.mockRestore();
});

test('cada esdeveniment amb targeta porta a la pàgina de la seua publicació, la mateixa de la targeta; l’agenda de fora, cap', () => {
  pinta();
  expect(enllacos()).toEqual([
    ['Fira de tardor', '/events/fira'],
    [`${hora(OLI.created_at)} Oli`, '/mercat/oli'],
    [`${hora(CRONICA.created_at)} Crònica`, '/mur/cronica'],
    [`${hora(DE_FORA.created_at)} De fora`, '/mur/fora'],
    [`${hora(PROPIA.created_at)} Pròpia`, '/page/xat']
  ]);
  // L'acte de l'agenda de Sollutia és a la graella, però no té pàgina a Sóc de Poble.
  const concert = [...graella().querySelectorAll('.sdp-cal-barra')].find((peca) => peca.textContent.endsWith('Concert de l’agenda'));
  expect(concert.querySelector('a')).toBeNull();
  // Les targetes de davall hi porten al mateix lloc.
  expect(document.querySelector('.sdp-card-grid a.sp-card-link-overlay[href="/events/fira"]')).not.toBeNull();
});

test('clicar l’esdeveniment navega a la publicació amb el router; clicar el dia, fora de l’enllaç, en mostra les targetes davall', () => {
  pinta();
  // El dia: ?date= i davall, les seues targetes (la regla única, entradesDelDia).
  act(() => within(graella()).getByRole('button', { name: (nom) => nom.startsWith(`${dataLlarga(new Date(2026, 9, 17))} · `) }).click());
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-10-17');
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  expect(document.querySelector('h4[role="status"]').textContent).toBe('1 publicació');
  // L'esdeveniment: la pàgina de la publicació (el Link de l'app, no el botó del dia).
  act(() => graella().querySelector('a.sdp-cal-enllac[href="/events/fira"]').click());
  expect(onSoc()).toBe('/events/fira');
});

test('el títol del període és l’h3 de la barra, a la mateixa fila que «Hui ‹ ›» i el selector de vista', () => {
  pinta();
  const navegacio = document.querySelector('.sdp-cal-navegacio');
  const titol = screen.getByRole('heading', { level: 3, name: /^Octubre/ });
  expect(titol.parentElement).toBe(navegacio);
  expect(titol.className).toBe('sdp-cal-navegacio__titol');
  expect(titol.getAttribute('aria-live')).toBe('polite');
  // Cap altre títol del període davant de la barra.
  expect(navegacio.previousElementSibling).toBeNull();
});

test('Setmana i Agenda també porten l’enllaç de cada esdeveniment', () => {
  pinta('vista=setmana&date=2026-10-17');
  const setmana = document.querySelector('.sdp-cal-setmana');
  expect(within(setmana).getByRole('link', { name: 'Fira de tardor' }).getAttribute('href')).toBe('/events/fira');
  cleanup();
  pinta('vista=agenda&mes=2026-10');
  const agenda = document.querySelector('.sdp-cal-agenda');
  expect(within(agenda).getByRole('link', { name: 'Fira de tardor' }).getAttribute('href')).toBe('/events/fira');
  expect(within(agenda).queryByRole('link', { name: 'Concert de l’agenda' })).toBeNull();
});

test('avisos, avisAgenda i senseData van al seu lloc: l’error davant de la barra, l’agenda i les que no es poden situar davant de les targetes', () => {
  render(
    <MemoryRouter rutaInicial="/calendari?vista=mes&mes=2026-10">
      <CalendariAmbAvisos />
    </MemoryRouter>
  );
  const ordre = [...document.querySelectorAll('[data-prova], .sdp-cal-navegacio, .sdp-cal-mes, .sdp-card-grid')]
    .map((n) => n.dataset.prova ?? n.className);
  expect(ordre).toEqual(['error', 'sdp-cal-navegacio', 'sdp-cal-mes', 'agenda', 'sdp-card-grid']);
  expect(screen.getByText('2 publicacions no es poden situar al calendari perquè no porten cap data o no tenen identificador: les trobaràs al Mur.')).toBeTruthy();
});

function CalendariAmbAvisos() {
  const { estat, navega, canviaVista, triaDia, obriDia } = useEstatCalendari({ obertura: null, avui: AVUI });
  return (
    <CalendariDelPoble estat={estat} navega={navega} canviaVista={canviaVista} triaDia={triaDia} obriDia={obriDia}
      entrades={ENTRADES} avui={AVUI} senseData={2}
      avisos={<p data-prova="error">Error del Mur</p>} avisAgenda={<p data-prova="agenda">L’agenda no respon</p>} />
  );
}

describe('rutaDeLEntrada: on porta un esdeveniment de la graella', () => {
  const entrada = (item) => entradesDelCalendari([item])[0];

  test('la de la targeta: un mainHref de l’app o el detall de la seua secció', () => {
    expect([FIRA, CRONICA, DE_FORA, PROPIA, OLI].map((item) => rutaDeLEntrada(entrada(item))))
      .toEqual(['/events/fira', '/mur/cronica', '/mur/fora', '/page/xat', '/mercat/oli']);
  });

  test('sense targeta (l’agenda, les fonts de fora) o sense esdeveniment, cap', () => {
    expect(rutaDeLEntrada(CONCERT)).toBeNull();
    expect(rutaDeLEntrada({ item: null, esdeveniment: CONCERT.esdeveniment })).toBeNull();
    const senseData = entrada({ id: 'sense', type: 'feed', title: 'Sense data' });
    expect(senseData.esdeveniment).toBeNull();
    expect(rutaDeLEntrada(senseData)).toBeNull();
    expect(rutaDeLEntrada(null)).toBeNull();
    expect(rutaDeLEntrada(undefined)).toBeNull();
  });

  test('cap mainHref que no siga una ruta de l’app: «//», esquemes ni espais', () => {
    for (const mainHref of ['//fals-poble.example', 'javascript:alert(1)', '/amb espai', 'mur/relativa']) {
      expect(rutaDeLEntrada(entrada({ ...CRONICA, mainHref })), mainHref).toBe('/mur/cronica');
    }
  });
});
