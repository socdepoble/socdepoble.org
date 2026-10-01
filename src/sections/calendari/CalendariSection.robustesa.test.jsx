/**
 * Robustesa de /calendari (T1 del prompt 261001_1140, revisió adversarial).
 *
 * El Mestre va vore «El calendari no està disponible». Eixe text no existix
 * enlloc de src/: és l'Alerta de l'antiga AgendaSection (sections/agenda/,
 * ja retirada de src/), que ix sempre que el backend no declara la capacitat 'agenda'
 * (cap backend no la declara). Encara viu en tres artefactes de build del
 * repo, tots d'abans del treball de T1: el build web dist/ (build:web, chunk
 * AgendaSection del 01-10 a les 00:21, el que servix `vite preview`), el
 * bundle de l'amfitrió wordpress-plugin/dist (build:wp, 00:21) i la seua còpia
 * empaquetada a release/socdepoble-enxufe (08:51). El WordPress local de
 * Studio no la pot pintar: servix una còpia física del connector del 30-09
 * sense la ruta /calendari. On la va vore el Mestre (URL i amfitrió) no està
 * verificat. Esta prova fixa que el codi
 * ACTUAL no la pinta mai, ni cap error de render, ni diu res a console.error,
 * en tots els estats que pot rebre la pàgina de veres:
 *   · sense ?vista i amb les cinc vistes (setmana, dues-setmanes, mes, any,
 *     agenda), recorrent la navegació, els dies, la pastilla de les targetes i
 *     el selector de vista;
 *   · dades buides, absents o brossa (dates que no són dates, anys de dos o de
 *     tres xifres, la fi dels temps, targetes sense id ni títol, pàgines del
 *     sistema mal formades) i actes amb recurrències que no es pinten, que es
 *     repetixen cada segon, que acaben abans de començar o amb una zona que no
 *     existix;
 *   · l'agenda de Sollutia (capacitat 'agenda') malformada, caiguda, síncrona,
 *     penjada, amb el mateix acte dos vegades o amb un acte repetit expandit
 *     (el mateix id en dies diferents);
 *   · URL brossa (?setmana=2026-W99, ?any=abc, ?mes=2026-13, ?date=demà…) i
 *     als extrems dels anys que el model admet (1000 i 9999);
 *   · router en memòria (incrustat, amb base) i de navegador amb base;
 *   · contenidor estret (la tira del mòbil i el mes compacte), tema fosc,
 *     StrictMode (el de l'App) i el Mur que es recarrega en iniciar sessió.
 *
 * La barrera de la prova (Barrera) recull qualsevol error de render, i
 * console.error s'espia sencer: React hi diu també les claus repetides, els
 * niuaments de DOM invàlids i els errors capturats per una barrera.
 */
import { Component, StrictMode } from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { BrowserRouter, MemoryRouter } from '../../app/contexts/RouterContext';
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

/* Cada cas recorre la pàgina sencera (fins a una dotzena de clics, amb
   StrictMode). Amb la màquina carregada (altres suites en paral·lel), la vista
   Any va passar dels 5 s per defecte, i el cas tallat deixava un act() viu que
   feia caure els següents («overlapping act() calls»). */
vi.setConfig({ testTimeout: 30_000 });

const VISTES =['', 'setmana', 'dues-setmanes', 'mes', 'any', 'agenda'];
const nomDeLaVista = (vista) => vista || 'sense ?vista';
const consultaDe = (vista, resta = '') => [vista ? `vista=${vista}` : '', resta].filter(Boolean).join('&');

/* ── Dades ─────────────────────────────────────────────────────────────── */

const FIRA = { id: 'fira', type: 'event', title: 'Fira de tardor', date: '2026-10-17', author_name: 'Sóc de Poble' };
const BALL = { id: 'ball', type: 'event', title: 'Ball sense dia', created_at: '2026-10-05T08:15:00+00:00' };
const CRONICA = { id: 'cronica', type: 'feed', title: 'Crònica de la setmana', created_at: '2026-09-29T10:00:00.000Z' };
const OLI = { id: 'oli', type: 'market', title: 'Oli de la Torre', created_at: '2026-10-01T07:30:00.000Z', description: 'Oli verge extra' };
const PROJECTE = { title: 'El projecte', description: 'Qui som', date: '2026-08-20T00:00:00.000Z' };
const CONCERT = { id: 's1', titol: 'Concert a la plaça', inici: '2026-10-02T17:00:00.000Z', lloc: 'Plaça Major' };
/* Un acte que es repetix, expandit pel backend (l'ActeDTO no porta
   recurrència): el mateix id, una instància per dia, dins de la setmana, de
   les dues setmanes, del mes i de l'agenda de hui. */
const MERCAT_DIVENDRES = { id: 'mercat', titol: 'Mercat', inici: '2026-10-02T08:00:00.000Z', lloc: 'Plaça Major' };
const MERCAT_DISSABTE = { ...MERCAT_DIVENDRES, inici: '2026-10-03T08:00:00.000Z' };

const LLAVOR = Object.freeze({
  core: { status: 'ready', error: null, pageCopy: { projecte: PROJECTE } },
  mur: { sortedEvents: [FIRA, BALL], sortedFeedPosts: [CRONICA], sortedMarketItems: [OLI] }
});

const BUIDES = Object.freeze({
  core: { status: 'ready', error: null, pageCopy: {} },
  mur: { sortedEvents: [], sortedFeedPosts: [], sortedMarketItems: [] }
});

/* Un Mur que encara no porta les llistes (undefined) i un CoreContent sense copy. */
const ABSENTS = Object.freeze({
  core: { status: 'ready', error: null },
  mur: { sortedEvents: undefined, sortedFeedPosts: undefined, sortedMarketItems: undefined }
});

const PUBLICACIONS_BROSSA = [
  null, undefined, 0, '', 'text solt', 42, [],
  { id: 'dema', type: 'feed', title: 'Data en lletres', created_at: 'demà' },
  { id: 'feb30', type: 'feed', title: 'Trenta de febrer', created_at: '2026-02-30' },
  { id: 'any26', type: 'feed', title: 'Any de dos xifres', created_at: '0026-01-01' },
  { id: 'any500', type: 'feed', title: 'Any de tres xifres', created_at: '0500-06-01T10:00:00Z' },
  { id: 'fi-dels-temps', type: 'feed', title: 'Fi dels temps', created_at: '9999-12-31T23:59:59Z' },
  { id: 'numerica', type: 'feed', title: 'Data numèrica', created_at: 1790000000000 },
  { id: 'objecte', type: 'feed', title: 'Data objecte', created_at: { any: 2026 } },
  { id: 'llista', type: 'feed', title: 'Data en llista', created_at: ['demà', '2026-10-02T09:00:00Z'] },
  { id: 'invalida', type: 'feed', title: 'Date invàlid', created_at: new Date('x') },
  { id: 'edicio', type: 'feed', title: 'Edició brossa', created_at: '2026-10-01T09:00:00Z', updated_at: 'ahir', publish_date: '2026-13-45' },
  { id: 'hora', type: 'feed', title: 'Hora brossa', date: '2026-10-03', time: '25:99' },
  { id: 'zona', type: 'feed', title: 'Desplaçament brossa', created_at: '2026-10-04T10:00:00+99:99' },
  { type: 'feed', title: 'Sense id', created_at: '2026-10-01T09:00:00Z' },
  { id: 'sense-titol', type: 'feed', created_at: '2026-10-02T09:00:00Z' },
  { id: 7, type: 'feed', title: 'Id numèric', created_at: '2026-10-06T09:00:00Z', labels: 'no és una llista' }
];

const ACTES_BROSSA = [
  { id: 'sense-dia', type: 'event', title: 'Acte sense dia' },
  { id: 'dia-brossa', type: 'event', title: 'Dia brossa', date: '2026-02-30', time: '10:00' },
  { id: 'anual', type: 'event', title: 'Aniversari de la banda', date: '2026-10-07', recurrencia: ['RRULE:FREQ=YEARLY'] },
  { id: 'rrule-text', type: 'event', title: 'Recurrència en text', date: '2026-10-08', recurrencia: 'RRULE:FREQ=DAILY' },
  { id: 'exdate', type: 'event', title: 'EXDATE brossa', date: '2026-10-09', recurrencia: ['RRULE:FREQ=DAILY', 'EXDATE:dema'] },
  { id: 'segons', type: 'event', title: 'Cada segon', inici: '2026-10-01T10:00:00Z', recurrencia: ['RRULE:FREQ=SECONDLY'] },
  { id: 'campanes', type: 'event', title: 'Campanes', inici: '2026-10-01T08:00', recurrencia: ['RRULE:FREQ=HOURLY;COUNT=5000'] },
  { id: 'dissabtes', type: 'event', title: 'Mercat dels dissabtes', date: '2026-10-03', recurrencia: ['RRULE:FREQ=WEEKLY;BYDAY=SA'] },
  { id: 'fi-abans', type: 'event', title: 'Fi abans de l’inici', inici: '2026-10-10T10:00', fi: '2026-10-10T09:00' },
  { id: 'zona', type: 'event', title: 'Zona inexistent', inici: '2026-10-11T10:00', zona: 'Mart/Olimp' },
  { id: 'tardor', type: 'event', title: 'Tota la tardor', inici: '2026-09-23', fi: '2026-12-21' },
  { id: 'nit', type: 'event', title: 'Ball de nit', inici: '2026-10-03T22:00', fi: '2026-10-04T02:00' },
  { id: 'mitjanit', type: 'event', title: 'A les 23:55', inici: '2026-10-01T23:55' },
  { id: 'canvi-hora', type: 'event', title: 'Canvi d’hora', inici: '2026-10-25T02:30', fi: '2026-10-25T03:30' },
  { id: 'any-1000', type: 'event', title: 'Any 1000', date: '1000-01-01' },
  { id: 'any-9998', type: 'event', title: 'Any 9998', date: '9998-12-31' }
];

const BROSSA = Object.freeze({
  core: {
    status: 'ready', error: null,
    pageCopy: { projecte: { ...PROJECTE, date: 'demà' }, legal: null, constitucio: 'un text en lloc d’un objecte' }
  },
  mur: {
    sortedEvents: [FIRA, ...ACTES_BROSSA],
    sortedFeedPosts: [CRONICA, ...PUBLICACIONS_BROSSA],
    sortedMarketItems: [OLI, { id: 'preu', type: 'market', title: 'Preu brossa', created_at: 'x', variations: 'cap', price: 3 }]
  }
});

const DADES = Object.freeze({ llavor: LLAVOR, buides: BUIDES, absents: ABSENTS, brossa: BROSSA });

function posaDades({ core, mur }, estat = {}) {
  mocks.core = core;
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), ...mur, ...estat };
}

/* ── El muntatge i la comprovació ──────────────────────────────────────── */

/* Recull qualsevol error de render de l'arbre: la prova falla dient-lo. */
class Barrera extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    return this.state.error
      ? <p data-testid="barrera">{String(this.state.error?.stack || this.state.error)}</p>
      : this.props.children;
  }
}

/* `estricte`: StrictMode, el de l'App (dues pintades i dos efectes). Les
   matrius llargues (URL, agenda) el lleven per temps: no canvia cap camí. */
function arbre(consulta, { router = 'memoria', basename = '', estricte = true } = {}) {
  const ruta = `/calendari${consulta ? `?${consulta}` : ''}`;
  const enrutat = router === 'navegador'
    ? <BrowserRouter basename={basename}><CalendariSection /></BrowserRouter>
    : <MemoryRouter basename={basename} rutaInicial={ruta}><CalendariSection /></MemoryRouter>;
  const barrera = <Barrera>{enrutat}</Barrera>;
  return estricte ? <StrictMode>{barrera}</StrictMode> : barrera;
}

function pinta(consulta = '', opcions = {}) {
  if (opcions.router === 'navegador') window.history.replaceState(null, '', `${opcions.basename ?? ''}/calendari${consulta ? `?${consulta}` : ''}`);
  return render(arbre(consulta, opcions));
}

/* Deixa córrer les promeses de l'agenda (cap temporitzador fals: només Date). */
const espera = () => act(async () => {
  await new Promise((resolve) => { setTimeout(resolve, 0); });
});

let espiaError;
let espiaAvis;

function comprovaSenseErrors(context, { ambCalendari = true } = {}) {
  expect(screen.queryByTestId('barrera')?.textContent ?? null, `${context}: error de render`).toBeNull();
  expect(espiaError.mock.calls.map((args) => args.map(String).join(' ')), `${context}: console.error`).toEqual([]);
  expect(screen.queryByText(/El calendari no està disponible/), `${context}: l’Alerta vella`).toBeNull();
  if (ambCalendari) {
    expect(document.querySelector('.sdp-calendari--gran, .sdp-cal-navegacio'), `${context}: cap calendari`).not.toBeNull();
  }
}

async function clica(boto, context) {
  if (!boto) return;
  await act(async () => { boto.click(); });
  await espera();
  comprovaSenseErrors(context);
}

const navegacio = () => document.querySelector('.sdp-cal-navegacio, .sdp-calendari__barra');
const primerDia = () => document.querySelector('button.sdp-calendari__cella, button.sdp-cal-dia, button.sdp-cal-any__dia');

/* Les fletxes i «Hui» de la forma que es veja (es tornen a buscar a cada clic). */
async function recorreNavegacio(context) {
  const quants = navegacio() ? within(navegacio()).getAllByRole('button').length : 0;
  for (let i = 0; i < Math.min(quants, 3); i++) {
    await clica(within(navegacio()).getAllByRole('button')[i], `${context} · navegació ${i}`);
  }
}

/* Tot el que es pot clicar a la pàgina: la navegació, un dia (dos vegades:
   triar-lo i llevar-lo), la pastilla de la primera targeta, «Torna a provar»
   i, amb `vistes`, cada opció del selector de vista. */
async function recorre(context, { vistes = true } = {}) {
  await recorreNavegacio(context);
  await clica(primerDia(), `${context} · un dia`);
  await clica(primerDia(), `${context} · el dia de nou`);
  await clica(screen.queryAllByRole('button', { name: (nom) => nom.endsWith(ACCIO_PASTILLA_CALENDARI) })[0], `${context} · pastilla`);
  await clica(screen.queryByRole('button', { name: 'Torna a provar' }), `${context} · torna a provar`);
  const selector = vistes ? screen.queryByRole('group', { name: 'Vista' }) : null;
  const opcions = selector ? within(selector).getAllByRole('button').map((boto) => boto.textContent) : [];
  for (const opcio of opcions) {
    await clica(within(screen.getByRole('group', { name: 'Vista' })).getByRole('button', { name: opcio }), `${context} · vista ${opcio}`);
  }
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  espiaError.mockRestore();
  espiaAvis.mockRestore();
  delete document.documentElement.dataset.theme;
});
beforeEach(() => {
  vi.clearAllMocks();
  espiaError = vi.spyOn(console, 'error').mockImplementation(() => {});
  // L'agenda caiguda ho diu amb un console.warn: és el comportament previst.
  espiaAvis = vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  mocks.teCapacitat.mockReturnValue(false);
  posaDades(LLAVOR);
});

/* ── Les vistes amb cada joc de dades ─────────────────────────────────── */

const CASOS_DADES = Object.keys(DADES).flatMap((dades) => VISTES.map((vista) => [dades, vista]));

test.each(CASOS_DADES)('dades %s · %s: es pinta i es recorre sense cap error', async (dades, vista) => {
  posaDades(DADES[dades]);
  pinta(consultaDe(vista));
  await espera();
  const context = `${dades} · ${nomDeLaVista(vista)}`;
  comprovaSenseErrors(context);
  await recorre(context);
});

test('les dades brossa no inventen cap dia: les que no es poden situar ho diuen i la resta ix', async () => {
  posaDades(BROSSA);
  pinta('vista=mes&mes=2026-10');
  await espera();
  comprovaSenseErrors('brossa · mes');
  expect(screen.getByText(/publicacions no es poden situar al calendari/)).toBeTruthy();
  const titols = [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
  expect(titols).toEqual(expect.arrayContaining(['Fira de tardor', 'Oli de la Torre', 'Data en llista', 'Id numèric']));
  for (const titol of ['Data en lletres', 'Trenta de febrer', 'Any de dos xifres', 'Any de tres xifres', 'Sense id']) {
    expect(titols, titol).not.toContain(titol);
  }
  // L'acte que es repetix cada segon es pinta retallat i ho diu.
  expect(screen.getAllByText(/Algun acte es repetix massa sovint/).length).toBeGreaterThan(0);
});

/* ── L'estat del Mur ───────────────────────────────────────────────────── */

test.each(VISTES)('Mur carregant, amb error i recarregat en iniciar sessió · %s', async (vista) => {
  const context = nomDeLaVista(vista);
  posaDades(BUIDES, { status: 'loading' });
  const { rerender } = pinta(consultaDe(vista));
  await espera();
  comprovaSenseErrors(`${context} · carregant`, { ambCalendari: false });
  expect(screen.getByText('Carregant contingut del poble...')).toBeTruthy();

  posaDades(LLAVOR);
  rerender(arbre(consultaDe(vista)));
  await espera();
  comprovaSenseErrors(`${context} · llest`);

  // Iniciar sessió canvia l'actor del Mur: torna a carregar i arriben més targetes.
  posaDades(LLAVOR, { status: 'loading', sortedEvents: [], sortedFeedPosts: [], sortedMarketItems: [] });
  rerender(arbre(consultaDe(vista)));
  await espera();
  comprovaSenseErrors(`${context} · recàrrega`, { ambCalendari: false });
  posaDades(BROSSA);
  rerender(arbre(consultaDe(vista)));
  await espera();
  comprovaSenseErrors(`${context} · amb sessió`);

  posaDades(LLAVOR, { status: 'error', error: new Error('caiguda') });
  rerender(arbre(consultaDe(vista)));
  await espera();
  comprovaSenseErrors(`${context} · error del Mur`);
  expect(screen.getByText('No s’han pogut carregar les targetes del calendari')).toBeTruthy();
});

/* ── L'agenda de Sollutia ──────────────────────────────────────────────── */

const AGENDES = [
  ['vàlida', () => Promise.resolve([CONCERT])],
  ['buida', () => Promise.resolve([])],
  ['un objecte', () => Promise.resolve({ actes: [CONCERT] })],
  ['null', () => Promise.resolve(null)],
  ['un text', () => Promise.resolve('[]')],
  ['un acte nul', () => Promise.resolve([CONCERT, null])],
  ['un acte sense inici', () => Promise.resolve([{ id: 'x', titol: 'Sense inici' }])],
  ['un inici numèric', () => Promise.resolve([{ id: 'n', titol: 'Número', inici: 1790000000000 }])],
  ['la fi abans de l’inici', () => Promise.resolve([{ ...CONCERT, fi: '2026-10-02T16:00:00.000Z' }])],
  ['un rebuig', () => Promise.reject(new Error('xarxa'))],
  ['un rebuig sense Error', () => Promise.reject('caiguda')],
  ['un error síncron', () => { throw new Error('sense backend'); }],
  ['una promesa que no acaba', () => new Promise(() => {})],
  ['el mateix acte dos vegades', () => Promise.resolve([CONCERT, { ...CONCERT }])],
  ['un acte repetit expandit', () => Promise.resolve([MERCAT_DIVENDRES, MERCAT_DISSABTE])]
];
/* Cada resposta, a les dues formes del calendari (el d'ara, amb el mes
   natural, i les vistes noves, amb el rang de la setmana); el rang de cada
   vista ja el fixa CalendariSection.vistes.test.jsx. La vàlida, la repetida i
   la caiguda, també a la resta de vistes (l'expandida, al seu test de davall). */
const CASOS_AGENDA = [
  ...AGENDES.flatMap(([nom, resposta]) => ['', 'setmana'].map((vista) => [nom, vista, resposta])),
  ...AGENDES.filter(([nom]) => ['vàlida', 'un rebuig', 'el mateix acte dos vegades'].includes(nom))
    .flatMap(([nom, resposta]) => ['dues-setmanes', 'mes', 'any', 'agenda'].map((vista) => [nom, vista, resposta]))
];

test.each(CASOS_AGENDA)('agenda de Sollutia %s · %s: el calendari continua sense cap error', async (nom, vista, resposta) => {
  mocks.teCapacitat.mockImplementation((capacitat) => capacitat === 'agenda');
  mocks.loadActesAgenda.mockImplementation(resposta);
  pinta(consultaDe(vista), { estricte: false });
  await espera();
  const context = `agenda ${nom} · ${nomDeLaVista(vista)}`;
  comprovaSenseErrors(context);
  await recorre(context, { vistes: false });
});

/* Correcció de la revisió adversarial · El mateix acte dos vegades (el
   mateix identificador i el mateix inici) era la mateixa clau a les vistes i
   a les targetes de davall (React els duplicava o se'n menjava un, i ho deia a
   console.error). Ara és «no ha respost», com qualsevol altra resposta que no
   es pot pintar sencera. */
test('el mateix acte de l’agenda dos vegades (mateix id i mateix inici) és «no ha respost»: cap acte pintat a mitges', async () => {
  mocks.teCapacitat.mockImplementation((capacitat) => capacitat === 'agenda');
  mocks.loadActesAgenda.mockResolvedValue([CONCERT, { ...CONCERT, titol: 'Un altre acte amb el mateix id' }]);
  for (const vista of ['', 'setmana']) {
    pinta(consultaDe(vista));
    await espera();
    comprovaSenseErrors(`repetits · ${nomDeLaVista(vista)}`);
    expect(screen.getByText(/^Ara mateix no podem consultar els actes de l’agenda/)).toBeTruthy();
    expect(screen.queryByText('Concert a la plaça')).toBeNull();
    expect(screen.queryByText('Un altre acte amb el mateix id')).toBeNull();
    expect(espiaAvis).toHaveBeenCalledWith('[calendari] L’agenda de Sollutia no ha respost:', 'Dos actes de l’agenda porten el mateix identificador i el mateix inici.');
    cleanup();
  }
});

/* Correcció de la segona revisió · Un acte que es repetix arriba expandit, i
   les instàncies poden compartir id: són actes distints (claus distintes a
   les vistes i a les targetes) i es pinten tots, sense cap avís. Abans de la
   correcció, la comprovació per id tombava tota l'agenda. */
test.each(VISTES)('un acte de l’agenda repetit i expandit (el mateix id en dies diferents) es pinta sencer · %s', async (vista) => {
  mocks.teCapacitat.mockImplementation((capacitat) => capacitat === 'agenda');
  mocks.loadActesAgenda.mockResolvedValue([MERCAT_DIVENDRES, MERCAT_DISSABTE]);
  pinta(consultaDe(vista));
  await espera();
  const context = `expandit · ${nomDeLaVista(vista)}`;
  comprovaSenseErrors(context);
  expect(screen.queryByText(/^Ara mateix no podem consultar els actes de l’agenda/), context).toBeNull();
  expect(espiaAvis, context).not.toHaveBeenCalled();
  const titols = [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((t) => t.textContent);
  expect(titols.filter((titol) => titol === 'Mercat'), context).toHaveLength(2);
});

/* ── URL brossa i extrems ──────────────────────────────────────────────── */

/* Cada consulta barreja paràmetres brossa de totes les vistes: cada vista
   llig els seus (estatCalendari.js · estatDeLaUrl; el calendari d'ara,
   calendariGlobal.js · mesDeLaUrl). Els extrems són els anys que el model
   admet (1000 i 9998-9999). Els ?vista= brossa ja els fixa
   CalendariSection.vistes.test.jsx. */
const URLS_BROSSA = [
  'setmana=2026-W99&any=abc&mes=2026-13&date=dem%C3%A0',
  'setmana=2026-W00&any=0999&mes=0999-01&date=2026-02-30',
  'setmana=2027-W53&mes=&date=2026-10-00',
  'date=0026-01-01&any=',
  'date=2026-10-01T10%3A00',
  'date=%&mes=%3Cscript%3E',
  'setmana=1000-W01', 'mes=1000-01', 'any=1000', 'date=1000-01-01',
  'setmana=9999-W52', 'mes=9999-12', 'any=9999', 'date=9999-12-31'
];
const CASOS_URL = URLS_BROSSA.flatMap((resta) => VISTES.map((vista) => [resta, vista]));

test.each(CASOS_URL)('URL brossa %s · %s: es pinta i es navega sense cap error', async (resta, vista) => {
  const extrems = ACTES_BROSSA.filter((acte) => ['anual', 'any-1000', 'any-9998'].includes(acte.id));
  posaDades(LLAVOR, { sortedEvents: [FIRA, BALL, ...extrems] });
  pinta(consultaDe(vista, resta), { estricte: false });
  await espera();
  const context = `${resta} · ${nomDeLaVista(vista)}`;
  comprovaSenseErrors(context);
  await recorreNavegacio(context);
  await clica(primerDia(), `${context} · un dia`);
});

/* ── Routers, contenidor estret i tema fosc ────────────────────────────── */

test.each(VISTES)('router en memòria amb base (incrustat) · %s', async (vista) => {
  pinta(consultaDe(vista), { basename: '/wp/la-torre' });
  await espera();
  comprovaSenseErrors(`memòria amb base · ${nomDeLaVista(vista)}`);
  await recorre(`memòria amb base · ${nomDeLaVista(vista)}`);
});

describe('router de navegador amb base', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  test.each(VISTES)('· %s: la URL no ix mai de la base', async (vista) => {
    pinta(consultaDe(vista), { router: 'navegador', basename: '/poble' });
    await espera();
    const context = `navegador amb base · ${nomDeLaVista(vista)}`;
    comprovaSenseErrors(context);
    await recorre(context);
    expect(window.location.pathname).toBe('/poble/calendari');
  });
});

describe('contenidor estret (mòbil)', () => {
  let mida;
  beforeEach(() => {
    mida = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      width: 320, height: 640, top: 0, left: 0, right: 320, bottom: 640, x: 0, y: 0, toJSON: () => ({})
    }));
  });
  afterEach(() => mida.mockRestore());

  test.each(VISTES)('· %s: la tira i el mes compacte es pinten i es recorren sense cap error', async (vista) => {
    posaDades(BROSSA);
    pinta(consultaDe(vista));
    await espera();
    const context = `estret · ${nomDeLaVista(vista)}`;
    comprovaSenseErrors(context);
    if (vista === 'setmana') expect(document.querySelector('.sdp-cal-setmana--tira')).not.toBeNull();
    if (vista === 'mes' || vista === 'dues-setmanes') expect(document.querySelector('.sdp-cal-mes--compacte')).not.toBeNull();
    await recorre(context);
  });
});

/* Cap peça del calendari llig el tema (és només CSS, amb tokens): esta prova
   fixa que l'atribut del tema fosc no obri cap camí nou. */
test.each(VISTES)('tema fosc · %s', async (vista) => {
  document.documentElement.dataset.theme = 'dark';
  pinta(consultaDe(vista), { estricte: false });
  await espera();
  comprovaSenseErrors(`fosc · ${nomDeLaVista(vista)}`);
  await recorreNavegacio(`fosc · ${nomDeLaVista(vista)}`);
});
