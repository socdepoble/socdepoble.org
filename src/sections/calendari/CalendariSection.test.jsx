/**
 * Ordre del Mestre, 261001 · La pàgina /calendari és operativa: TOTES les
 * targetes del poble, cada una el dia de la seua data, i davall les del dia
 * triat (?date=) o les del mes que es veu, de la més nova a la més vella, amb
 * la targeta del Mur. L'agenda de Sollutia (capacitat 'agenda') s'hi afig si
 * hi és; sense ella o si falla, el calendari funciona igual i mai no ix
 * l'Alerta que tapava la pàgina.
 *
 * Carril A (ordre del Mestre, 261001) · El mes que es veu el governa la URL:
 * ?date=, ?mes=AAAA-MM (on porta la pastilla de les targetes) o el mes
 * d'obertura. Per això el router és el de veres (MemoryRouter), no un mock
 * quiet: les fletxes, «Hui» i els dies escriuen la URL, i una sonda llig on
 * és la pàgina després de cada clic.
 *
 * P6 (ordre del Mestre, 261003) · «La vista mensual actual és massa bàsica»:
 * sense ?vista=, la pàgina obri la vista Mes a l'estil Google Calendar
 * (VistaMes, NavegacioPeriode i el selector de vista), ja no el calendari de
 * la pestanya del Mur (.sdp-calendari--gran). Estes proves fixen la pàgina
 * SENSE ?vista=; les vistes triades, CalendariSection.vistes.test.jsx.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { horaDe } from '../../utils/calendari.js';

const mocks = vi.hoisted(() => ({
  t: (_, alternativa) => alternativa, core: {}, mur: {},
  teCapacitat: vi.fn(), loadActesAgenda: vi.fn()
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (...args) => mocks.teCapacitat(...args),
  loadActesAgenda: (...args) => mocks.loadActesAgenda(...args)
}));
import CalendariSection from './CalendariSection.jsx';

const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17', entradilla: 'Entradilla de la Fira', author_name: 'Sóc de Poble' };
/* Un acte sense dia real: va el dia de la seua pastilla, com al Mur. */
const BALL = { id: 'ball', type: 'event', title: 'Ball sense dia', created_at: '2026-10-05T08:15:00+00:00' };
const CRONICA = { id: 'cronica', type: 'feed', title: 'Crònica de la setmana', created_at: '2026-09-29T10:00:00.000Z' };
const VELLA = { id: 'vella', type: 'feed', title: 'Crònica vella', created_at: '2026-09-02T08:00:00.000Z' };
const SENSE_DATA = { id: 'sense', type: 'feed', title: 'Nota sense data' };
const OLI = { id: 'oli', type: 'market', title: 'Oli de la Torre', created_at: '2026-10-01T07:30:00.000Z', description: 'Oli verge extra' };
const CONCERT = { id: 's1', titol: 'Concert a la plaça', inici: '2026-10-10T17:00:00.000Z', lloc: 'Plaça Major' };
const MAGOSTA = { id: 's2', titol: 'Magosta', inici: '2026-11-07T16:00:00.000Z', lloc: 'Era del Molí' };
const PROJECTE = { title: 'El projecte', description: 'Qui som', date: '2026-08-20T00:00:00.000Z' };
/* Quatre publicacions el dimecres 21 d'octubre: en tres carrils no hi caben (dos i «+2 més»). */
const DIA_PLE = ['Assaig', 'Mercat', 'Truc', 'Sopar'].map((titol, i) => ({
  id: `ple-${i}`, type: 'feed', title: titol, created_at: `2026-10-21T${['08', '09', '10', '11'][i]}:00:00.000Z`
}));

const nomMes = (any, mes) => new Date(any, mes, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
/* «de setembre de 2026», «d’octubre de 2026». */
const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);
const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
/* La vista Mes (VistaMes): la regió amb el nom del mes i la graella. */
const regioMes = (any, mes) => screen.getByRole('region', { name: `Calendari ${ambDe(nomMes(any, mes))}` });
const graella = () => document.querySelector('.sdp-cal-mes');
/* Les peces de la graella (barres i «● HH:MM Títol»): el text acaba pel títol. */
const peces = () => [...graella().querySelectorAll('.sdp-cal-barra')].map((peca) => peca.textContent);
const tePeca = (titol) => peces().some((text) => text.endsWith(titol));
const dia = (data) => within(graella()).getByRole('button', { name: (nom) => nom.startsWith(`${dataLlarga(data)} · `) });
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const targeta = (titol) => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')]
  .find((t) => t.textContent === titol).closest('article');
const clica = (nom) => act(() => screen.getByRole('button', { name: nom }).click());
const ambAgenda = () => mocks.teCapacitat.mockImplementation((capacitat) => capacitat === 'agenda');
const nomMesLlarg = (any, mes) => {
  const nom = nomMes(any, mes);
  return nom.charAt(0).toUpperCase() + nom.slice(1);
};
const titolDelMes = (any, mes) => screen.getByRole('heading', { level: 3, name: nomMesLlarg(any, mes) });
const diaTriat = () => within(graella()).queryByRole('button', { pressed: true });

/* On és la pàgina ara mateix (camí i consulta), escrit en un node que la prova llig. */
function Sonda() {
  const { pathname, search } = useLocation();
  return <span data-testid="on-soc">{`${pathname}${search ? `?${search}` : ''}`}</span>;
}
const onSoc = () => screen.getByTestId('on-soc').textContent;
const arbre = (consulta) => (
  <MemoryRouter rutaInicial={`/calendari${consulta ? `?${consulta}` : ''}`}><CalendariSection /><Sonda /></MemoryRouter>
);
const pinta = (consulta = '') => render(arbre(consulta));

let avis;
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  avis.mockRestore();
});
beforeEach(() => {
  vi.clearAllMocks();
  avis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  mocks.teCapacitat.mockReturnValue(false);
  mocks.core = { status: 'ready', error: null, pageCopy: { projecte: PROJECTE } };
  mocks.mur = {
    status: 'ready', error: null, refresh: vi.fn(),
    sortedEvents: [FIRA, BALL], sortedFeedPosts: [CRONICA, VELLA, SENSE_DATA], sortedMarketItems: [OLI]
  };
});

/* Regressió de P6: abans, sense ?vista=, el calendari del Mur (cap dia veí,
   una píndola de títol per dia, «‹ Hui ›» i cap selector de vista). */
test('P6 · sense ?vista=, la vista Mes de Google Calendar (no el calendari del Mur): «Hui ‹ ›», el selector amb «Mes» premut i totes les targetes', () => {
  pinta();
  expect(screen.queryByText('El calendari no està disponible')).toBeNull();
  expect(mocks.loadActesAgenda).not.toHaveBeenCalled();
  expect(document.querySelector('.sdp-calendari--gran, .sdp-calendari__barra')).toBeNull();
  const regio = regioMes(2026, 9);
  expect(regio).toBe(graella());
  // La barra de Google: «Hui», les fletxes, la pantalla completa i les cinc vistes, amb «Mes» premut.
  const navegacio = document.querySelector('.sdp-cal-navegacio');
  expect([...navegacio.children].filter((n) => n.tagName === 'BUTTON').map((b) => b.getAttribute('aria-label') ?? b.textContent))
    .toEqual(['Hui', 'Mes anterior', 'Mes següent', 'Pantalla completa']);
  expect([...screen.getByRole('group', { name: 'Vista' }).querySelectorAll('button')].map((b) => b.textContent))
    .toEqual(['Setmana', 'Dues setmanes', 'Mes', 'Any', 'Agenda']);
  expect(screen.getByRole('button', { name: 'Mes', pressed: true })).toBeTruthy();
  // Actes, publicacions i productes: tots a la graella, al seu dia.
  for (const titol of ['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']) expect(tePeca(titol), titol).toBe(true);
  // Davall del calendari, les targetes del mes que es veu.
  expect(regio.compareDocumentPosition(document.querySelector('.sdp-card-grid')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(titolDelMes(2026, 9)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
  expect(screen.getByText('3 publicacions')).toBeTruthy();
  // La que no porta cap data no s'inventa cap dia, i ho diu.
  expect(screen.getByText('Una publicació no es pot situar al calendari perquè no porta cap data o no té identificador: la trobaràs al Mur.')).toBeTruthy();
  // Obrir la pàgina no escriu res a la URL.
  expect(onSoc()).toBe('/calendari');
});

test('P6 · la graella de Google Calendar: setmanes justes, hui en cercle, els dies veïns atenuats i «+N més» dins del dia', () => {
  mocks.mur = { ...mocks.mur, sortedFeedPosts: [CRONICA, VELLA, SENSE_DATA, ...DIA_PLE] };
  pinta();
  // Octubre de 2026 comença en dijous i té 31 dies: cinc setmanes, del 28-09 a l'1-11.
  expect(graella().querySelectorAll('.sdp-cal-mes__fila')).toHaveLength(5);
  expect([...graella().querySelectorAll('.sdp-cal-dia--fora')].map((d) => d.textContent)).toEqual(['28', '29', '30', '1 de nov.']);
  const hui = within(graella()).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'date');
  expect(hui).toHaveLength(1);
  expect(hui[0].querySelector('.sdp-cal-dia__numero').textContent).toBe('1');
  // El dimecres 21: dues peces i «+2 més»; el nom del dia ho diu tot.
  const ple = dia(new Date(2026, 9, 21));
  expect(ple.querySelector('.sdp-cal-mes__mes').textContent).toBe('+2 més');
  expect(ple.getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 21))} · 4 publicacions: Assaig, Mercat, Truc, Sopar · +2 més`);
  // El «+N més» és el botó del dia: davall, les quatre targetes.
  act(() => ple.click());
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-10-21');
  expect(titolsDeTargetes()).toEqual(['Sopar', 'Truc', 'Mercat', 'Assaig']);
  expect(screen.getByText('4 publicacions')).toBeTruthy();
});

test('P6 · la graella és un sol punt de tabulació (hui) i les fletxes es mouen pels dies sense tocar la URL', () => {
  pinta();
  // La graella porta el seu nom, distint del de la regió (el lector no el repetix).
  const graellaAria = screen.getByRole('grid', { name: `Dies ${ambDe(nomMes(2026, 9))}` });
  expect(regioMes(2026, 9).contains(graellaAria)).toBe(true);
  const actius = within(graellaAria).getAllByRole('button').filter((b) => b.tabIndex === 0);
  expect(actius).toHaveLength(1);
  expect(actius[0].getAttribute('aria-current')).toBe('date');
  act(() => actius[0].focus());
  fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
  expect(document.activeElement.getAttribute('aria-label').startsWith(`${dataLlarga(new Date(2026, 9, 8))} · `)).toBe(true);
  expect(onSoc()).toBe('/calendari');
  act(() => document.activeElement.click());
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-10-08');
});

/* Revisió del carril A, P3 · Una targeta amb data però sense id no té
   esdeveniment: no ix ni a la graella ni a la llista, i l'avís no diu que no
   porta data (sí que en porta). */
test('una targeta amb data però sense identificador no ix ni a la graella ni a la llista, i l’avís diu la veritat', () => {
  mocks.mur = { ...mocks.mur, sortedFeedPosts: [CRONICA, VELLA, SENSE_DATA, { type: 'feed', title: 'Nota sense id', created_at: '2026-10-01T09:00:00.000Z' }] };
  pinta();
  expect(tePeca('Nota sense id')).toBe(false);
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
  expect(screen.getByText('2 publicacions no es poden situar al calendari perquè no porten cap data o no tenen identificador: les trobaràs al Mur.')).toBeTruthy();
  expect(screen.queryByText(/no porta cap data i no ix al calendari/)).toBeNull();
});

test('si el mes de hui no té cap targeta, s’obri al de la targeta més recent, no en un mes buit', () => {
  mocks.mur = { ...mocks.mur, sortedEvents: [{ ...FIRA, date: '2026-12-05' }], sortedMarketItems: [] };
  pinta();
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Crònica de la setmana', 'Crònica vella']);
});

test('les targetes són les del Mur: l’acte amb la seua insígnia i el producte amb la seua etiqueta i el seu enllaç', () => {
  pinta();
  const fira = targeta('Fira de tardor');
  expect([...fira.querySelectorAll('.sp-card-calendar-badge span')].map((s) => s.textContent)).toEqual(['17', 'OCTUBRE', '2026']);
  const oli = targeta('Oli de la Torre');
  expect(within(oli).getByText('Mercat')).toBeTruthy();
  expect(oli.querySelector('.sp-card-link-overlay').getAttribute('href')).toBe('/mercat/oli');
});

test('el recompte de cada dia diu targetes; passar de mes escriu ?vista=mes&mes= i canvia les targetes de davall', () => {
  pinta();
  expect(dia(new Date(2026, 9, 1)).getAttribute('aria-label')).toMatch(/ · 1 publicació: Oli de la Torre$/);

  clica('Mes anterior');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-09');
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(titolDelMes(2026, 8)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Crònica de la setmana', 'Crònica vella']);

  // Les pàgines del sistema que el Mur barreja també hi són, el dia de la seua creació.
  clica('Mes anterior');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-08');
  expect(titolsDeTargetes()).toEqual(['El projecte']);
  expect(within(targeta('El projecte')).getByText('Sistema')).toBeTruthy();

  clica('Mes anterior');
  expect(titolsDeTargetes()).toEqual([]);
  expect(screen.getByText('Cap publicació este mes.')).toBeTruthy();
});

test('clicar un dia posa ?date= (i lleva el ?mes=) i davall ixen les seues targetes; tornar-lo a clicar el lleva i deixa el mes', () => {
  pinta('mes=2026-10');
  act(() => dia(new Date(2026, 9, 1)).click());
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-10-01');
  expect(diaTriat().getAttribute('aria-label')).toMatch(/Oli de la Torre$/);
  expect(titolsDeTargetes()).toEqual(['Oli de la Torre']);
  expect(screen.getByText('1 publicació')).toBeTruthy();

  act(() => diaTriat().click());
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
  expect(diaTriat()).toBeNull();
  expect(titolDelMes(2026, 9)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
});

test('amb un ?date= d’un altre mes, s’obri en eixe mes i en mostra les targetes del dia; una clau que no existix no tria cap dia', () => {
  pinta('date=2026-09-29');
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(diaTriat().getAttribute('aria-label').startsWith(`${dataLlarga(new Date(2026, 8, 29))} · `)).toBe(true);
  expect(titolsDeTargetes()).toEqual(['Crònica de la setmana']);
  cleanup();

  // D5 i P6 · El 30 de febrer no existix: cap dia triat (fallada tancada), el mes d'obertura i les seues targetes.
  pinta('date=2026-02-30');
  expect(regioMes(2026, 9)).toBeTruthy();
  expect(diaTriat()).toBeNull();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
});

/* Carril A · On porta la pastilla de les targetes: el mes de la targeta, amb
   TOTES les targetes d'eixe mes davall, sense cap dia triat. */
test('?mes=2026-09 obri setembre amb totes les targetes del mes, de la més nova a la més vella', () => {
  pinta('mes=2026-09');
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(diaTriat()).toBeNull();
  expect(titolDelMes(2026, 8)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Crònica de la setmana', 'Crònica vella']);
  expect(screen.getByText('2 publicacions')).toBeTruthy();
  cleanup();

  // Si la URL porta tots dos, mana el dia.
  pinta('date=2026-10-01&mes=2026-08');
  expect(regioMes(2026, 9)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Oli de la Torre']);
});

test('les fletxes i «Hui» escriuen el ?mes= i lleven el ?date=: la graella i la llista diuen el mateix mes', () => {
  pinta('date=2026-10-01');
  expect(titolsDeTargetes()).toEqual(['Oli de la Torre']);

  clica('Mes anterior');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-09');
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(diaTriat()).toBeNull();
  expect(titolDelMes(2026, 8)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Crònica de la setmana', 'Crònica vella']);

  clica('Hui');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
  expect(regioMes(2026, 9)).toBeTruthy();
  expect(titolDelMes(2026, 9)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);

  clica('Mes següent');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-11');
  expect(titolsDeTargetes()).toEqual([]);
});

test('un ?mes= que no és cap mes cau al mes d’obertura (mesDObertura)', () => {
  // Hui (octubre) sense cap targeta: el mes d'obertura és setembre, el de la més recent.
  mocks.mur = { ...mocks.mur, sortedEvents: [{ ...FIRA, date: '2026-12-05' }], sortedMarketItems: [] };
  for (const mes of ['2026-13', '2026-00', '0026-01', '2026-9', '2026-09-01', 'demà', '']) {
    pinta(`mes=${encodeURIComponent(mes)}`);
    expect(regioMes(2026, 8), mes).toBeTruthy();
    expect(titolsDeTargetes(), mes).toEqual(['Crònica de la setmana', 'Crònica vella']);
    cleanup();
  }
});

/* Revisió del carril A, P3 · Les pàgines del sistema (CoreContent) poden
   arribar després de les targetes del Mur: el mes d'obertura es recalcula
   amb elles, no es queda en el de la primera llista. */
test('les pàgines del sistema que arriben després recalculen el mes d’obertura', () => {
  mocks.core = { status: 'loading', error: null, pageCopy: {} };
  mocks.mur = { ...mocks.mur, sortedEvents: [], sortedFeedPosts: [VELLA], sortedMarketItems: [] };
  const { rerender } = pinta();
  expect(regioMes(2026, 8)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Crònica vella']);

  mocks.core = { status: 'ready', error: null, pageCopy: { projecte: { ...PROJECTE, date: '2026-10-01T00:00:00.000Z' } } };
  rerender(arbre(''));
  expect(regioMes(2026, 9)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['El projecte']);
  expect(onSoc()).toBe('/calendari');
});

/* P6 · La vista Mes demana a l'agenda de Sollutia les setmanes que pinta (de
   l'1 d'octubre al 31: del 28-09 al 01-11), no el mes natural. */
test('amb la capacitat agenda, els actes de Sollutia de la graella que es veu s’afigen al calendari i a les targetes', async () => {
  ambAgenda();
  mocks.loadActesAgenda.mockResolvedValue([CONCERT]);
  pinta();
  await waitFor(() => expect(tePeca('Concert a la plaça')).toBe(true));
  const [rang, opcions] = mocks.loadActesAgenda.mock.calls[0];
  expect(rang).toEqual({ desde: new Date(2026, 8, 28).toISOString(), fins: new Date(2026, 10, 2).toISOString() });
  expect(opcions.signal).toBeInstanceOf(AbortSignal);
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Concert a la plaça', 'Ball sense dia', 'Oli de la Torre']);
  const concert = targeta('Concert a la plaça');
  expect(within(concert).getByText('Plaça Major')).toBeTruthy();
  expect(concert.textContent).toContain(horaDe(new Date(CONCERT.inici)));
  expect(concert.querySelector('.sp-card-link-overlay')).toBeNull();

  // La crida viatja dins d'una promesa (captura també els errors síncrons): s'espera.
  // Novembre de 2026: sis setmanes, del 26-10 al 06-12.
  clica('Mes següent');
  await waitFor(() => expect(mocks.loadActesAgenda).toHaveBeenLastCalledWith(
    { desde: new Date(2026, 9, 26).toISOString(), fins: new Date(2026, 11, 7).toISOString() }, expect.anything()
  ));
});

/* Revisió del carril A, P2 · Amb un dia triat i l'agenda de Sollutia, passar
   de mes demanava els actes del mes nou mentre la llista seguia filtrada al
   dia vell: els actes es perdien. Ara el ?date= se'n va amb el canvi de mes. */
test('amb l’agenda, un ?date= i «Mes següent» no deixen cap llista incoherent: el mes nou i els seus actes', async () => {
  ambAgenda();
  mocks.loadActesAgenda.mockImplementation(({ desde }) => Promise.resolve(
    desde === new Date(2026, 9, 26).toISOString() ? [MAGOSTA] : [CONCERT]
  ));
  pinta('date=2026-10-10');
  await waitFor(() => expect(tePeca('Concert a la plaça')).toBe(true));
  expect(titolsDeTargetes()).toEqual(['Concert a la plaça']);

  clica('Mes següent');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-11');
  await waitFor(() => expect(tePeca('Magosta')).toBe(true));
  expect(regioMes(2026, 10)).toBeTruthy();
  expect(diaTriat()).toBeNull();
  expect(screen.queryByRole('heading', { level: 2, name: /^Targetes del dia/ })).toBeNull();
  expect(titolDelMes(2026, 10)).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Magosta']);
});

test('si l’agenda falla, ho diu en una línia, el calendari continua amb les targetes del poble i es pot tornar a provar', async () => {
  ambAgenda();
  mocks.loadActesAgenda.mockRejectedValueOnce(new Error('xarxa')).mockResolvedValueOnce([CONCERT]);
  pinta();
  const linia = await screen.findByText(/^Ara mateix no podem consultar els actes de l’agenda/);
  expect(screen.queryByText('El calendari no està disponible')).toBeNull();
  expect(graella()).not.toBeNull();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);

  act(() => within(linia).getByRole('button', { name: 'Torna a provar' }).click());
  await waitFor(() => expect(tePeca('Concert a la plaça')).toBe(true));
  expect(screen.queryByText(/^Ara mateix no podem consultar/)).toBeNull();
});

test('fallada tancada: un error síncron o un acte que no passa pel model és «no ha respost», mai mitja agenda', async () => {
  ambAgenda();
  mocks.loadActesAgenda.mockImplementationOnce(() => { throw new Error('sense backend'); });
  pinta();
  expect(await screen.findByText(/^Ara mateix no podem consultar els actes de l’agenda/)).toBeTruthy();
  cleanup();

  mocks.loadActesAgenda.mockResolvedValueOnce([CONCERT, { id: 's2', titol: 'Sense inici' }]);
  pinta();
  expect(await screen.findByText(/^Ara mateix no podem consultar els actes de l’agenda/)).toBeTruthy();
  expect(tePeca('Concert a la plaça')).toBe(false);
});

/* Ordre del Mestre, 261001 · Pantalla completa (on porta la barra lateral).
   P6 · Sense ?vista=, el botó és el de la navegació de les vistes: entre les
   fletxes i el selector, amb la pell de les fletxes (fantasma), i porta tot
   el bloc a un diàleg. L'estat viu a CalendariSection: un refresc del Mur no
   en trau ningú. */
const TITOL_PANTALLA = 'Calendari a pantalla completa';
const NOM_EIXIR = 'Eixir de la pantalla completa';

test('pantalla completa · sense ?vista: el botó va entre les fletxes i el selector i porta el mes i les targetes al diàleg', () => {
  pinta();
  const entrar = screen.getByRole('button', { name: 'Pantalla completa' });
  expect(entrar.parentElement.classList.contains('sdp-cal-navegacio')).toBe(true);
  expect(entrar.nextElementSibling).toBe(screen.getByRole('group', { name: 'Vista' }));
  expect(entrar.className).toBe('sdp-boto sdp-boto--fantasma sdp-pantalla-completa__entra');
  expect(entrar.getAttribute('aria-haspopup')).toBe('dialog');

  act(() => entrar.click());
  const dialeg = screen.getByRole('dialog', { name: TITOL_PANTALLA });
  expect(dialeg.contains(graella())).toBe(true);
  expect(dialeg.contains(document.querySelector('.sdp-card-grid'))).toBe(true);
  // Un sol mes i una sola llista: el bloc s'ha mogut, no s'ha duplicat. Dins, cap botó d'entrar.
  expect(document.querySelectorAll('.sdp-cal-mes, .sdp-card-grid')).toHaveLength(2);
  expect(screen.getAllByRole('button', { name: 'Hui' })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Pantalla completa' })).toBeNull();
  expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: NOM_EIXIR }));

  clica('Mes anterior');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-09');
  expect(screen.getByRole('dialog', { name: TITOL_PANTALLA })).toBe(dialeg);
  act(() => dia(new Date(2026, 8, 1)).click());
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-09-01');
  expect(screen.getByRole('dialog', { name: TITOL_PANTALLA })).toBe(dialeg);

  clica(NOM_EIXIR);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(graella().closest('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pantalla completa' }));
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-09-01');
});

test('pantalla completa · Escape en trau i el focus torna al botó; la URL no porta cap paràmetre de pantalla', () => {
  pinta('mes=2026-10');
  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  const cancel = new Event('cancel', { cancelable: true });
  act(() => { screen.getByRole('dialog', { name: TITOL_PANTALLA }).dispatchEvent(cancel); });
  expect(cancel.defaultPrevented).toBe(true);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pantalla completa' }));
  expect(document.querySelector('.sdp-cal-navegacio').contains(document.activeElement)).toBe(true);
  expect(onSoc()).toBe('/calendari?mes=2026-10');
});

test('pantalla completa · si el Mur torna a carregar, «Eixir» continua; quan arriba, el calendari torna dins del diàleg', () => {
  const { rerender } = pinta();
  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  mocks.mur = { ...mocks.mur, status: 'loading' };
  rerender(arbre(''));
  const carregant = screen.getByRole('dialog', { name: TITOL_PANTALLA });
  expect(within(carregant).getByRole('button', { name: NOM_EIXIR })).toBeTruthy();
  expect(within(carregant).getByText('Carregant contingut...')).toBeTruthy();
  expect(graella()).toBeNull();

  mocks.mur = { ...mocks.mur, status: 'ready' };
  rerender(arbre(''));
  const torna = screen.getByRole('dialog', { name: TITOL_PANTALLA });
  expect(torna.contains(graella())).toBe(true);
  expect(screen.queryByRole('button', { name: 'Pantalla completa' })).toBeNull();
  clica(NOM_EIXIR);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pantalla completa' }));
});

test('mentre el Mur carrega, el carregant; si falla, l’error dins de la pàgina i el calendari continua', () => {
  mocks.mur = { ...mocks.mur, status: 'loading', sortedEvents: [], sortedFeedPosts: [], sortedMarketItems: [] };
  pinta();
  expect(graella()).toBeNull();
  expect(screen.getByText('Carregant contingut...')).toBeTruthy();
  cleanup();

  mocks.mur = { ...mocks.mur, status: 'error', error: new Error('caiguda') };
  pinta();
  expect(screen.getByText('No s’han pogut carregar les targetes del calendari')).toBeTruthy();
  expect(graella()).not.toBeNull();
});

/* Revisió de la pantalla completa · L'error del Mur va dins del bloc: fora,
   el modal el deixaria inert i el calendari, buit, diria «Cap publicació»
   sense cap avís. Tancada, és el primer fill de la pàgina. */
test('pantalla completa · amb el Mur en error, l’Alerta i «Torna-ho a provar» van dins del diàleg; tancada, davant del calendari', () => {
  mocks.mur = { ...mocks.mur, status: 'error', error: new Error('caiguda'), sortedEvents: [], sortedFeedPosts: [], sortedMarketItems: [] };
  pinta();
  const alerta = screen.getByRole('alert');
  expect(alerta.closest('.content-wrapper').firstElementChild).toBe(alerta);
  expect(alerta.compareDocumentPosition(graella()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  const dialeg = screen.getByRole('dialog', { name: TITOL_PANTALLA });
  const dins = within(dialeg).getByRole('alert');
  expect(within(dins).getByText('No s’han pogut carregar les targetes del calendari')).toBeTruthy();
  // S'ha mogut, no s'ha duplicat; i va davant de la navegació, dins del visor.
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(dialeg.querySelector('.sdp-pantalla-completa__visor').firstElementChild).toBe(dins);
  act(() => within(dins).getByRole('button', { name: 'Torna-ho a provar' }).click());
  expect(mocks.mur.refresh).toHaveBeenCalledTimes(1);
});

/* Revisió de la pantalla completa · El carregant no porta el botó d'entrar:
   si s'ix mentre el Mur carrega, el focus hi torna quan el calendari arriba. */
test('pantalla completa · eixir mentre el Mur carrega: quan arriba el calendari, el focus va al botó «Pantalla completa»', () => {
  const { rerender } = pinta();
  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  mocks.mur = { ...mocks.mur, status: 'loading' };
  rerender(arbre(''));
  clica(NOM_EIXIR);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Pantalla completa' })).toBeNull();

  mocks.mur = { ...mocks.mur, status: 'ready' };
  rerender(arbre(''));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pantalla completa' }));
});
