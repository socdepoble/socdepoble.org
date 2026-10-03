/**
 * T10 (ordre del Mestre, 261001) · Les vistes de /calendari a l'estil Google
 * Calendar, triades amb un ?vista= de la llista (fase visual, prompt
 * 261001_0445: Setmana, Dues setmanes, Mes, Any i Agenda). P6 (ordre del
 * Mestre, 261003) · Sense ?vista=, o amb un valor que no és cap vista, la
 * vista Mes (CalendariSection.test.jsx en fixa el comportament). El router és
 * el de veres (MemoryRouter) i una sonda llig on és la pàgina després de cada
 * clic; un botó «Enrere» de prova comprova que moure's pel calendari
 * reemplaça l'entrada de l'historial.
 */
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { ACCIO_PASTILLA_CALENDARI } from '../../components/universal/editorial.js';

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

const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17', author_name: 'Sóc de Poble' };
const BALL = { id: 'ball', type: 'event', title: 'Ball sense dia', created_at: '2026-10-05T08:15:00+00:00' };
const CRONICA = { id: 'cronica', type: 'feed', title: 'Crònica de la setmana', created_at: '2026-09-29T10:00:00.000Z' };
const VELLA = { id: 'vella', type: 'feed', title: 'Crònica vella', created_at: '2026-09-02T08:00:00.000Z' };
const SENSE_DATA = { id: 'sense', type: 'feed', title: 'Nota sense data' };
const OLI = { id: 'oli', type: 'market', title: 'Oli de la Torre', created_at: '2026-10-01T07:30:00.000Z' };
const CONCERT = { id: 's1', titol: 'Concert a la plaça', inici: '2026-10-02T17:00:00.000Z', lloc: 'Plaça Major' };

const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dataCurta = (d) => d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
const setmanaDe = (dilluns, diumenge) => `${dataCurta(dilluns)} – ${dataCurta(diumenge)}`;
const nomMes = (any, mes) => new Date(any, mes, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
/* «de setembre de 2026», «d’octubre de 2026». */
const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);
const titolsDeTargetes = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
const clica = (nom) => act(() => screen.getByRole('button', { name: nom }).click());
/* El títol de la llista de davall (el subtítol de la pàgina també és un h2). */

function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <span data-testid="on-soc">{`${pathname}${search ? `?${search}` : ''}`}</span>
      <button type="button" onClick={() => navigate(-1)}>Enrere de prova</button>
    </>
  );
}
const onSoc = () => screen.getByTestId('on-soc').textContent;
const pinta = (consulta = '') => render(
  <MemoryRouter rutaInicial={`/calendari${consulta ? `?${consulta}` : ''}`}><CalendariSection /><Sonda /></MemoryRouter>
);

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
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  mocks.mur = {
    status: 'ready', error: null, refresh: vi.fn(),
    sortedEvents: [FIRA, BALL], sortedFeedPosts: [CRONICA, VELLA, SENSE_DATA], sortedMarketItems: [OLI]
  };
});

test('?vista=setmana munta la vista Setmana (no el calendari d’ara) i davall, les targetes de la setmana', () => {
  pinta('vista=setmana');
  expect(document.querySelector('.sdp-calendari--gran')).toBeNull();
  const periode = setmanaDe(new Date(2026, 8, 28), new Date(2026, 9, 4));
  expect(screen.getByRole('region', { name: `Calendari de la setmana del ${periode}` }).classList.contains('sdp-cal-setmana')).toBe(true);
  expect(titolsDeTargetes()).toEqual(['Oli de la Torre', 'Crònica de la setmana']);
  expect(screen.getByText('2 publicacions')).toBeTruthy();
  expect(screen.getByText('Una publicació no es pot situar al calendari perquè no porta cap data o no té identificador: la trobaràs al Mur.')).toBeTruthy();
  // Obrir la vista no escriu res a la URL.
  expect(onSoc()).toBe('/calendari?vista=setmana');
});

test('les fletxes escriuen ?setmana= amb replace, i «Hui» torna a la setmana de hui', () => {
  pinta('vista=setmana');
  clica('Setmana següent');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W41');
  expect(titolsDeTargetes()).toEqual(['Ball sense dia']);
  // replace: tornar arrere no torna a la setmana d'abans, que no és a l'historial.
  clica('Enrere de prova');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W41');

  clica('Setmana anterior');
  clica('Setmana anterior');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W39');
  expect(titolsDeTargetes()).toEqual([]);
  expect(screen.getByText('Cap publicació esta setmana.')).toBeTruthy();

  clica('Hui');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W40');
});

test('clicar un dia escriu ?date= i conserva la vista; tornar-lo a clicar el lleva i deixa la setmana', () => {
  pinta('vista=setmana');
  const dijous = dataLlarga(new Date(2026, 9, 1));
  act(() => screen.getByRole('button', { name: `${dijous} · 1 publicació: Oli de la Torre` }).click());
  expect(onSoc()).toBe('/calendari?vista=setmana&date=2026-10-01');
  expect(screen.getByRole('button', { name: `${dijous} · 1 publicació: Oli de la Torre` }).getAttribute('aria-pressed')).toBe('true');
  expect(titolsDeTargetes()).toEqual(['Oli de la Torre']);
  expect(document.querySelector('.sdp-cal-setmana')).not.toBeNull();

  act(() => screen.getByRole('button', { name: `${dijous} · 1 publicació: Oli de la Torre` }).click());
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W40');
  expect(titolsDeTargetes()).toEqual(['Oli de la Torre', 'Crònica de la setmana']);
});

test('el selector passa al mes de hui i torna a la setmana de hui', () => {
  pinta('vista=setmana');
  expect(screen.getByRole('button', { name: 'Setmana', pressed: true })).toBeTruthy();
  clica('Mes');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
  expect(screen.getByRole('region', { name: `Calendari ${ambDe(nomMes(2026, 9))}` }).classList.contains('sdp-cal-mes')).toBe(true);
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
  clica('Setmana');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W40');
});

test('?vista=mes&mes=2026-09: les setmanes justes del mes, amb les targetes del mes; les fletxes escriuen el ?mes=', () => {
  pinta('vista=mes&mes=2026-09');
  expect(screen.getByRole('region', { name: `Calendari ${ambDe(nomMes(2026, 8))}` })).toBeTruthy();
  // Setembre de 2026 comença en dimarts i té 30 dies: cinc setmanes justes (fase visual).
  expect(document.querySelectorAll('.sdp-cal-mes__fila')).toHaveLength(5);
  expect(titolsDeTargetes()).toEqual(['Crònica de la setmana', 'Crònica vella']);
  clica('Mes següent');
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
  // El dia, al mes: el mateix ?date= del Mur.
  act(() => screen.getByRole('button', { name: `${dataLlarga(new Date(2026, 9, 17))} · 1 publicació: Fira de tardor` }).click());
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-10-17');
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
});

test('?vista=dues-setmanes: dos files des del dilluns; un dia de la segona fila no mou la graella', () => {
  pinta('vista=dues-setmanes');
  const periode = setmanaDe(new Date(2026, 8, 28), new Date(2026, 9, 11));
  const regio = screen.getByRole('region', { name: `Calendari de les dues setmanes del ${periode}` });
  expect(regio.classList.contains('sdp-cal-mes')).toBe(true);
  expect(regio.querySelectorAll('.sdp-cal-mes__fila')).toHaveLength(2);
  expect(screen.getByRole('heading', { level: 3, name: periode })).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Ball sense dia', 'Oli de la Torre', 'Crònica de la setmana']);

  act(() => within(regio).getByRole('button', { name: (nom) => nom.startsWith(`${dataLlarga(new Date(2026, 9, 8))} · `) }).click());
  expect(onSoc()).toBe('/calendari?vista=dues-setmanes&setmana=2026-W40&date=2026-10-08');
  expect(screen.getByRole('region', { name: `Calendari de les dues setmanes del ${periode}` })).toBeTruthy();

  clica('Dues setmanes següents');
  expect(onSoc()).toBe('/calendari?vista=dues-setmanes&setmana=2026-W42');
  expect(titolsDeTargetes()).toEqual(['Fira de tardor']);
  clica('Dues setmanes anteriors');
  clica('Dues setmanes anteriors');
  expect(onSoc()).toBe('/calendari?vista=dues-setmanes&setmana=2026-W38');
  expect(screen.getByText('Cap publicació estes dues setmanes.')).toBeTruthy();
});

test('?vista=agenda: el mes des de hui, només els dies amb targetes; davall, les del mateix rang', () => {
  pinta('vista=agenda');
  const regio = screen.getByRole('region', { name: `Agenda ${ambDe(nomMes(2026, 9))}` });
  expect(regio.classList.contains('sdp-cal-agenda')).toBe(true);
  expect(within(regio).getAllByRole('heading', { level: 3 }).map((h) => h.querySelector('.sdp-sr-only').textContent)).toEqual([
    `${dataLlarga(new Date(2026, 9, 1))} (hui)`, dataLlarga(new Date(2026, 9, 5)), dataLlarga(new Date(2026, 9, 17))
  ]);
  expect(within(regio).getByRole('list', { name: dataLlarga(new Date(2026, 9, 17)) }).textContent).toBe('Tot el dia Fira de tardor');
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
  expect(screen.getByRole('button', { name: 'Agenda', pressed: true })).toBeTruthy();

  clica('Mes següent');
  expect(onSoc()).toBe('/calendari?vista=agenda&mes=2026-11');
  expect(within(screen.getByRole('region', { name: `Agenda ${ambDe(nomMes(2026, 10))}` })).getByText('Cap publicació en este període.')).toBeTruthy();
});

/* Correcció de la revisió · Abans, el ?date= que l'Agenda heretava de Mes
   filtrava la llista de davall a un dia que l'Agenda no marca ni deixa llevar. */
test('l’Agenda hereta el dia triat de Mes sense filtrar la llista; tornar a Mes el conserva', () => {
  pinta('vista=mes&mes=2026-10');
  act(() => screen.getByRole('button', { name: `${dataLlarga(new Date(2026, 9, 17))} · 1 publicació: Fira de tardor` }).click());
  clica('Agenda');
  expect(onSoc()).toBe('/calendari?vista=agenda&date=2026-10-17');
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre']);
  clica('Mes');
  expect(onSoc()).toBe('/calendari?vista=mes&date=2026-10-17');
});

/* Correcció de la revisió · Un dia triat del mes en curs anterior a hui
   quedava fora de l'Agenda i de l'agenda de Sollutia que es demana. */
test('amb un dia triat anterior a hui, l’Agenda comença al dia triat i demana a Sollutia des d’eixe dia', async () => {
  vi.setSystemTime(new Date(2026, 9, 15, 12, 0));
  mocks.teCapacitat.mockImplementation((capacitat) => capacitat === 'agenda');
  mocks.loadActesAgenda.mockResolvedValue([]);
  pinta('vista=mes&mes=2026-10');
  act(() => screen.getByRole('button', { name: (nom) => nom.startsWith(`${dataLlarga(new Date(2026, 9, 3))} · `) }).click());
  clica('Agenda');
  expect(onSoc()).toBe('/calendari?vista=agenda&date=2026-10-03');
  await waitFor(() => expect(mocks.loadActesAgenda).toHaveBeenLastCalledWith(
    { desde: new Date(2026, 9, 3).toISOString(), fins: new Date(2026, 10, 1).toISOString() }, expect.anything()
  ));
  const regio = screen.getByRole('region', { name: `Agenda ${ambDe(nomMes(2026, 9))}` });
  expect(within(regio).getAllByRole('heading', { level: 3 }).map((h) => h.querySelector('.sdp-sr-only').textContent))
    .toEqual([dataLlarga(new Date(2026, 9, 5)), dataLlarga(new Date(2026, 9, 17))]);
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia']);
});

/* Correcció de la revisió · La cel·la «1 de nov.» de la graella d'octubre
   feia saltar la graella a novembre, i tornar-la a clicar no la tornava. */
test('Mes: un dia d’un mes veí no fa saltar la graella; tornat a clicar, torna al mateix ?mes=', () => {
  pinta('vista=mes&mes=2026-10');
  const regio = () => screen.getByRole('region', { name: `Calendari ${ambDe(nomMes(2026, 9))}` });
  const primerDeNovembre = dataLlarga(new Date(2026, 10, 1));
  const cella = () => within(regio()).getByRole('button', { name: (nom) => nom.startsWith(`${primerDeNovembre} · `) });
  act(() => cella().click());
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10&date=2026-11-01');
  expect(cella().getAttribute('aria-pressed')).toBe('true');
  act(() => cella().click());
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
});

test('?vista=any: dotze mesos; un dia obri la seua setmana amb el dia triat; les fletxes canvien d’any', () => {
  pinta('vista=any');
  const regio = screen.getByRole('region', { name: 'Calendari de l’any 2026' });
  expect(regio.querySelectorAll('button.sdp-cal-any__dia')).toHaveLength(365);
  expect(screen.getByRole('heading', { level: 3, name: '2026' })).toBeTruthy();
  expect(titolsDeTargetes()).toEqual(['Fira de tardor', 'Ball sense dia', 'Oli de la Torre', 'Crònica de la setmana', 'Crònica vella']);

  clica('Any següent');
  expect(onSoc()).toBe('/calendari?vista=any&any=2027');
  expect(screen.getByRole('region', { name: 'Calendari de l’any 2027' })).toBeTruthy();
  expect(screen.getByText('Cap publicació este any.')).toBeTruthy();
  clica('Hui');
  expect(onSoc()).toBe('/calendari?vista=any&any=2026');

  act(() => screen.getByRole('button', { name: `${dataLlarga(new Date(2026, 9, 17))} · 1 publicació` }).click());
  expect(onSoc()).toBe('/calendari?vista=setmana&date=2026-10-17');
  expect(document.querySelector('.sdp-cal-setmana')).not.toBeNull();
});

test('el selector recorre les cinc vistes conservant el període i lleva els paràmetres de l’anterior', () => {
  pinta('vista=setmana');
  const opcions = [...screen.getByRole('group', { name: 'Vista' }).querySelectorAll('button')].map((b) => b.textContent);
  expect(opcions).toEqual(['Setmana', 'Dues setmanes', 'Mes', 'Any', 'Agenda']);
  clica('Agenda');
  expect(onSoc()).toBe('/calendari?vista=agenda&mes=2026-10');
  clica('Any');
  expect(onSoc()).toBe('/calendari?vista=any&any=2026');
  clica('Dues setmanes');
  expect(onSoc()).toBe('/calendari?vista=dues-setmanes&setmana=2026-W40');
  clica('Setmana');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W40');
});

/* P6 (ordre del Mestre, 261003) · Abans, el calendari del Mur; ara, la vista
   Mes, amb el selector. La URL no es toca fins que la persona es mou. */
test('qualsevol altre ?vista= és la vista Mes, amb «Mes» premut', () => {
  for (const vista of ['dia', 'SETMANA', '', 'Agenda', 'dues_setmanes']) {
    pinta(`vista=${encodeURIComponent(vista)}`);
    expect(document.querySelector('.sdp-calendari--gran'), vista).toBeNull();
    expect(screen.getByRole('region', { name: `Calendari ${ambDe(nomMes(2026, 9))}` }).classList.contains('sdp-cal-mes'), vista).toBe(true);
    expect(screen.getByRole('button', { name: 'Mes', pressed: true }), vista).toBeTruthy();
    expect(document.querySelector('.sdp-cal-setmana, .sdp-cal-agenda, .sdp-cal-any'), vista).toBeNull();
    expect(onSoc(), vista).toBe(`/calendari?vista=${encodeURIComponent(vista)}`);
    clica('Mes següent');
    expect(onSoc(), vista).toBe('/calendari?vista=mes&mes=2026-11');
    cleanup();
  }
});

/* Revisió de T10 · Un acte amb una recurrència que el calendari no sap pintar
   (FALLA) no ix a la graella, però sí a la llista de davall el dia que
   comença: les vistes noves ho diuen amb el paràgraf del calendari d'ara. */
test('un acte amb una recurrència que no es pinta: fora de la graella, a la llista, i les vistes noves ho diuen', () => {
  const ANIVERSARI = { id: 'aniversari', type: 'event', title: 'Aniversari de la banda', date: '2026-10-07', recurrencia: ['RRULE:FREQ=YEARLY'] };
  const text = 'Un acte es repetix d’una manera que el calendari encara no sap pintar: el trobaràs a les targetes del dia i del mes que comença.';
  mocks.mur = { ...mocks.mur, sortedEvents: [FIRA, BALL, ANIVERSARI] };

  pinta('vista=setmana&setmana=2026-W41');
  const dimecres = dataLlarga(new Date(2026, 9, 7));
  expect(screen.getByRole('button', { name: `${dimecres} · 0 publicacions` })).toBeTruthy();
  expect(document.querySelector('.sdp-cal-setmana').textContent).not.toContain('Aniversari de la banda');
  expect(titolsDeTargetes()).toContain('Aniversari de la banda');
  expect(screen.getAllByText(text)).toHaveLength(1);
  cleanup();

  pinta('vista=mes&mes=2026-10');
  expect(document.querySelector('.sdp-cal-mes').textContent).not.toContain('Aniversari de la banda');
  expect(titolsDeTargetes()).toContain('Aniversari de la banda');
  expect(screen.getAllByText(text)).toHaveLength(1);
  cleanup();

  // L'agenda tampoc no el pinta, i també ho diu.
  pinta('vista=agenda&mes=2026-10');
  expect(document.querySelector('.sdp-cal-agenda').textContent).not.toContain('Aniversari de la banda');
  expect(titolsDeTargetes()).toContain('Aniversari de la banda');
  expect(screen.getAllByText(text)).toHaveLength(1);
  cleanup();

  // Sense ?vista= (P6: la vista Mes), el mateix paràgraf, un de sol.
  pinta('mes=2026-10');
  expect(document.querySelector('.sdp-cal-mes').textContent).not.toContain('Aniversari de la banda');
  expect(screen.getAllByText(text)).toHaveLength(1);
  cleanup();

  // Sense cap acte d'eixos, cap paràgraf.
  mocks.mur = { ...mocks.mur, sortedEvents: [FIRA, BALL] };
  pinta('vista=mes&mes=2026-10');
  expect(screen.queryByText(text)).toBeNull();
});

/* Fase visual (prompt 261001_0445) · Abans (DEFECTE CONEGUT de la revisió de
   T10) la pastilla de les targetes de davall tornava al calendari d'ara des
   de les vistes noves. Ara la pàgina posa al context la ruta de la vista Mes:
   la pastilla porta al mes de la targeta sense eixir de les vistes, amb
   replace. P6 (261003) · Sense ?vista= (la vista Mes), també. */
test('la pastilla d’una targeta de davall porta a la vista Mes del seu mes, també des de l’agenda i sense ?vista=', () => {
  const pastilla = () => screen.getAllByRole('button', { name: (nom) => nom.endsWith(ACCIO_PASTILLA_CALENDARI) })[0];
  pinta('vista=mes&mes=2026-10');
  act(() => pastilla().click());
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
  expect(document.querySelector('.sdp-cal-mes')).not.toBeNull();
  expect(document.querySelector('.sdp-calendari--gran')).toBeNull();
  cleanup();

  pinta('vista=agenda&mes=2026-10');
  act(() => pastilla().click());
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
  expect(document.querySelector('.sdp-cal-mes')).not.toBeNull();
  cleanup();

  pinta('mes=2026-10');
  act(() => pastilla().click());
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');
  expect(document.querySelector('.sdp-cal-mes')).not.toBeNull();
  expect(document.querySelector('.sdp-calendari--gran')).toBeNull();
});

/* Ordre del Mestre, 261001 · Pantalla completa. Dins de .sdp-root, com a
   l'App. El botó va a la navegació, darrere de «Hui ‹ ›» i del títol (si n'hi
   ha) i davant del selector; obert, tot el bloc (navegació, vista, avisos i
   targetes) viu dins del diàleg, i moure's pel calendari no en trau ningú.
   L'estat no va mai a la URL. Les comprovacions són d'estructura i de URL,
   no dels textos de la llista de davall (els governen les seues proves). */
const pintaEnArrel = (consulta) => render(
  <div className="sdp-root"><MemoryRouter rutaInicial={`/calendari?${consulta}`}><CalendariSection /><Sonda /></MemoryRouter></div>
);
const TITOL_PANTALLA = 'Calendari a pantalla completa';
const NOM_EIXIR = 'Eixir de la pantalla completa';
const dialegDeLaPantalla = () => screen.getByRole('dialog', { name: TITOL_PANTALLA });

test('pantalla completa · ?vista=setmana: el botó obri el diàleg amb tot el bloc; fletxes, dies i vistes no en trauen', () => {
  pintaEnArrel('vista=setmana');
  const entrar = screen.getByRole('button', { name: 'Pantalla completa' });
  expect(entrar.className).toBe('sdp-boto sdp-boto--fantasma sdp-pantalla-completa__entra');
  const navegacio = entrar.parentElement;
  expect(navegacio.classList.contains('sdp-cal-navegacio')).toBe(true);
  expect([...navegacio.children].filter((n) => n.tagName === 'BUTTON').map((b) => b.getAttribute('aria-label') ?? b.textContent))
    .toEqual(['Hui', 'Setmana anterior', 'Setmana següent', 'Pantalla completa']);
  expect(entrar.nextElementSibling).toBe(screen.getByRole('group', { name: 'Vista' }));
  expect(screen.queryByRole('dialog')).toBeNull();

  act(() => entrar.click());
  const dialeg = dialegDeLaPantalla();
  for (const nom of ['Hui', 'Setmana anterior', 'Setmana següent']) expect(within(dialeg).getByRole('button', { name: nom })).toBeTruthy();
  expect(within(dialeg).getByRole('group', { name: 'Vista' })).toBeTruthy();
  // Un sol bloc a tot el document, dins del diàleg: s'ha mogut, no s'ha duplicat. Dins, cap botó d'entrar.
  for (const peca of ['.sdp-cal-navegacio', '.sdp-cal-setmana', '.sdp-card-grid']) {
    const nodes = [...document.querySelectorAll(peca)];
    expect(nodes, peca).toHaveLength(1);
    expect(dialeg.contains(nodes[0]), peca).toBe(true);
  }
  expect(screen.getAllByRole('button', { name: 'Hui' })).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Pantalla completa' })).toBeNull();
  expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: NOM_EIXIR }));
  expect(onSoc()).toBe('/calendari?vista=setmana');

  clica('Setmana següent');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W41');
  expect(dialegDeLaPantalla()).toBe(dialeg);
  // replace: tornar arrere no torna a la setmana d'abans.
  clica('Enrere de prova');
  expect(onSoc()).toBe('/calendari?vista=setmana&setmana=2026-W41');
  clica('Hui');
  const dijous = dataLlarga(new Date(2026, 9, 1));
  act(() => within(dialeg).getByRole('button', { name: (nom) => nom.startsWith(`${dijous} · `) }).click());
  expect(onSoc()).toBe('/calendari?vista=setmana&date=2026-10-01');
  expect(within(dialeg).getByRole('button', { name: (nom) => nom.startsWith(`${dijous} · `) }).getAttribute('aria-pressed')).toBe('true');
  expect(dialegDeLaPantalla()).toBe(dialeg);

  for (const vista of ['Mes', 'Any', 'Agenda', 'Dues setmanes', 'Setmana']) {
    clica(vista);
    expect(dialegDeLaPantalla(), vista).toBe(dialeg);
    expect(within(dialeg).getByRole('button', { name: vista, pressed: true }), vista).toBeTruthy();
  }
  expect(onSoc()).not.toMatch(/pantalla|completa/);
});

test('pantalla completa · Escape i «Eixir» en trauen: la barra en línia torna i el focus, al botó d’entrar', () => {
  pintaEnArrel('vista=mes&mes=2026-10');
  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  act(() => { dialegDeLaPantalla().dispatchEvent(new Event('cancel', { cancelable: true })); });
  expect(screen.queryByRole('dialog')).toBeNull();
  const navegacio = document.querySelector('.sdp-cal-navegacio');
  expect(navegacio.closest('dialog')).toBeNull();
  const entrar = screen.getByRole('button', { name: 'Pantalla completa' });
  expect(navegacio.contains(entrar)).toBe(true);
  expect(document.activeElement).toBe(entrar);
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-10');

  act(() => entrar.click());
  clica('Mes següent');
  clica(NOM_EIXIR);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pantalla completa' }));
  // El mes que s'ha triat dins es queda; cap paràmetre de pantalla.
  expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-11');
  expect(document.querySelector('.sdp-cal-mes').closest('dialog')).toBeNull();
});

test('pantalla completa · amb el Mur en error, l’Alerta entra al diàleg davant de la navegació', () => {
  mocks.mur = { ...mocks.mur, status: 'error', error: new Error('caiguda'), sortedEvents: [], sortedFeedPosts: [], sortedMarketItems: [] };
  pintaEnArrel('vista=setmana');
  const alerta = screen.getByRole('alert');
  expect(alerta.closest('.content-wrapper').firstElementChild).toBe(alerta);
  act(() => screen.getByRole('button', { name: 'Pantalla completa' }).click());
  const dialeg = dialegDeLaPantalla();
  const dins = within(dialeg).getByRole('alert');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(dins.compareDocumentPosition(dialeg.querySelector('.sdp-cal-navegacio')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(dins).getByRole('button', { name: 'Torna-ho a provar' })).toBeTruthy();
});

test('amb la capacitat agenda, les vistes noves demanen el període que es veu', async () => {
  mocks.teCapacitat.mockImplementation((capacitat) => capacitat === 'agenda');
  mocks.loadActesAgenda.mockResolvedValue([CONCERT]);
  pinta('vista=setmana');
  expect(await screen.findByText('Concert a la plaça', { selector: '.sp-card-title' })).toBeTruthy();
  expect(mocks.loadActesAgenda.mock.calls[0][0]).toEqual({ desde: new Date(2026, 8, 28).toISOString(), fins: new Date(2026, 9, 5).toISOString() });
  const divendres = screen.getByRole('list', { name: dataLlarga(new Date(2026, 9, 2)) });
  expect(within(divendres).getByRole('listitem').textContent).toContain('Concert a la plaça');

  // Mes: les setmanes justes que pinta (de l'1 al 31 d'octubre, del 28-09 al 01-11).
  clica('Mes');
  await waitFor(() => expect(mocks.loadActesAgenda).toHaveBeenLastCalledWith(
    { desde: new Date(2026, 8, 28).toISOString(), fins: new Date(2026, 10, 2).toISOString() }, expect.anything()
  ));
  // Agenda: des de hui fins a final de mes; Any: tot l'any.
  clica('Agenda');
  await waitFor(() => expect(mocks.loadActesAgenda).toHaveBeenLastCalledWith(
    { desde: new Date(2026, 9, 1).toISOString(), fins: new Date(2026, 10, 1).toISOString() }, expect.anything()
  ));
  clica('Any');
  await waitFor(() => expect(mocks.loadActesAgenda).toHaveBeenLastCalledWith(
    { desde: new Date(2026, 0, 1).toISOString(), fins: new Date(2027, 0, 1).toISOString() }, expect.anything()
  ));
});
