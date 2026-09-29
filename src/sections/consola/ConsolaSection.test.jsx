import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

const ruta = vi.hoisted(() => ({ comodi: '' }));
const fonts = vi.hoisted(() => ({ mapa: null, consola: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ '*': ruta.comodi }),
  useNavigate: () => vi.fn(),
  Navigate: ({ to }) => <p data-testid="redirigix">{to}</p>,
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, subtitle, lead, children }) => (
    <main>
      <header className="page-title"><h1>{title}</h1></header>
      {(subtitle || lead) && <div className="page-intro">{subtitle && <h2>{subtitle}</h2>}{lead && <p className="lead">{lead}</p>}</div>}
      {children}
    </main>
  )
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIState: () => ({ locale: 'ca-ES' }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => (fonts.mapa
    ? { estat: 'ready', mapa: fonts.mapa, error: null, carrega: () => {} }
    : { estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(fonts.consola)
}));
import ConsolaSection from './ConsolaSection.jsx';
import { CLAU_VISTES } from './consolaPagines.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';

afterEach(() => {
  cleanup();
  ruta.comodi = ''; fonts.mapa = null; fonts.consola = null;
  localStorage.clear();
});

const PAGINES = ['pols', 'explorador', 'fluxos', 'calendari', 'inventari', 'entrades', 'agents', 'actors', 'salut'];

const MAPA = {
  schema: 'sdp.mapa.v1', generat: '2026-09-25T13:12:23.715Z', tall: null,
  nodes: [
    { id: 'agent:claude-code', tipus: 'agent', font: 'CLAUDE.md', atributs: { arnes: 'Claude Code' } },
    { id: 'skill:sdp-workflow', tipus: 'skill', font: null, atributs: {} },
    { id: 'skill:core-identitat', tipus: 'skill', font: null, atributs: {} }
  ],
  arestes: [],
  tasques: [{ id: 'plaquetes', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'x' }, cadencia: { cada_segons: 3600 }, script: null, font: null }],
  avisos: [{ node: 'skill:core-identitat', codi: 'orfe', severitat: 'mitjana', evidencia: 'mapa' }],
  salut: []
};

/* Dues receptes de targeta, cap d'inventada:
   - TargetaResum (xifres i vistes del Mapa): la del Panell de Control,
     «action», icona de 40 px dins de .sdp-card-grid;
   - TargetaConsola (tauler i pols): la UniversalCard sencera del Mur, amb
     boina taronja, icona a la insígnia lateral, entradilla i peu blau.
   La que no obri res du a més `sdp-consola__quieta`, que li lleva
   l'aparença de clicable (i, sense acció, no té peu). */
const esClicable = (t) => [...t.children].some((c) => c.classList.contains('sp-card-link-overlay'));
const esExplicativa = (t) => t.classList.contains('sdp-consola__targeta');
function targetesDeControl(contenidor = document) {
  const targetes = [...contenidor.querySelectorAll('article.sp-card')].filter((t) => !esExplicativa(t));
  for (const t of targetes) {
    expect(t.className).toBe(esClicable(t) ? 'sp-card sp-card--action' : 'sp-card sp-card--action sdp-consola__quieta');
    expect(t.parentElement.classList.contains('sdp-card-grid')).toBe(true);
    expect(t.querySelector('.sp-card-title-icon svg').getAttribute('width')).toBe('40');
  }
  expect(document.querySelector('.sdp-consola__tauler, .sdp-consola__resum, .sdp-consola__xifra')).toBeNull();
  return targetes;
}
function targetesExplicatives(contenidor = document) {
  const targetes = [...contenidor.querySelectorAll('article.sp-card.sdp-consola__targeta')];
  for (const t of targetes) {
    expect(t.className).toBe(esClicable(t) ? 'sp-card sdp-consola__targeta' : 'sp-card sdp-consola__targeta sdp-consola__quieta');
    expect(t.parentElement.classList.contains('sdp-card-grid')).toBe(true);
    // Boina taronja d'autoria i font; la icona ocupa el lloc de la foto.
    expect(t.querySelector('.sp-card-header .sp-card-author-name').textContent).toBe('Consola Termodinàmica');
    expect(t.querySelector('.sp-card-header .sp-card-author-location').textContent).toMatch(/^Font: /);
    expect(t.querySelector('.sp-card-media-container')).toBeNull();
    expect(t.querySelector('.sp-card-calendar-badge svg').getAttribute('width')).toBe('48');
    // Títol, subtítol «per a…» i entradilla.
    expect(t.querySelector('h3.sp-card-title')).not.toBeNull();
    expect(t.querySelector('h4.sp-card-subtitle').textContent).toMatch(/^Per a /);
    expect(t.querySelector('.sp-card-text > p').textContent.length).toBeGreaterThan(20);
    // Peu blau només quan hi ha acció: cap peu buit.
    expect(Boolean(t.querySelector('.sp-card-footer .sp-card-connect'))).toBe(esClicable(t));
  }
  return targetes;
}

/** Les etiquetes de cada targeta d'un contenidor, pel títol de la targeta. */
function etiquetesPerTargeta(contenidor) {
  return Object.fromEntries([...contenidor.querySelectorAll('article.sp-card')].map((t) => [
    t.querySelector('h3').textContent,
    [...t.querySelectorAll('.sp-card-label')].map((l) => `${l.textContent}:${[...l.classList].find((c) => c.startsWith('sdp-insignia--'))?.slice(14) ?? '?'}`)
  ]));
}

test('/consola: el tauler són nou targetes universals que expliquen cada pàgina, sense pestanyes', async () => {
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');

  expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Consola Termodinàmica']);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Manteniment de la IAIA']);
  expect(document.querySelector('.page-intro h2 + p.lead')).not.toBeNull();
  expect(screen.queryByRole('tablist')).toBeNull();

  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect(targetesExplicatives(nav)).toHaveLength(9);
  expect(nav.className).toBe('sdp-card-grid sdp-consola__graella');
  expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(PAGINES.map((id) => `/consola/${id}`));
  // El peu blau porta Compartir i «Obrir» amb el títol al nom accessible.
  expect(within(nav).getAllByRole('button', { name: /^Obrir: / })).toHaveLength(9);
  expect(within(nav).getAllByRole('button', { name: /^Compartir / })).toHaveLength(9);
  // La dada viva va a part de l'entradilla; si falta la font, diu per què.
  expect(screen.getAllByText('Mapa no disponible en este entorn').map((p) => p.className)).toEqual(Array(8).fill('sdp-consola__dada'));
  // T51 · cap targeta sense data: sense instantània, la del copy de la
  // Consola (PAGE_COPY), mai la d'ara.
  const copia = dataHoraDeBarra({ creat: PAGE_COPY.consola.date });
  const dates = [...nav.querySelectorAll('.sp-card-header .btn-date-time')];
  expect(dates).toHaveLength(9);
  expect(dates.every((d) => d.getAttribute('datetime') === copia.dateTime && d.textContent === `${copia.time}${copia.date}`)).toBe(true);
  // Sense cap font, cada targeta ho diu també d'un colp d'ull.
  expect(Object.values(etiquetesPerTargeta(nav))).toEqual(Array(9).fill(['Sense font:neutre']));
});

test('/consola amb Mapa: la boina porta l’hora local de la instantània, que no navega', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  // Les huit del Mapa porten la instantània (més recent que el copy); el pols,
  // sense consola.json, la data del copy.
  const instantania = dataHoraDeBarra({ modificat: MAPA.generat }).dateTime;
  const hores = [...nav.querySelectorAll('.sp-card-header .btn-date-time')]
    .filter((h) => h.getAttribute('datetime') === instantania);
  expect(hores).toHaveLength(8);
  expect(hores.every((h) => h.tagName === 'TIME')).toBe(true);
  expect(new Date(instantania).getTime()).toBe(Date.parse('2026-09-25T13:12:23Z'));
  // Hora i data locals: la prova no depén de la zona horària de qui l'executa.
  const d = new Date(MAPA.generat);
  const dos = (n) => String(n).padStart(2, '0');
  expect(hores[0].textContent).toBe(`${dos(d.getHours())}:${dos(d.getMinutes())}${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`);
});

test('/consola amb Mapa: etiquetes d’un colp d’ull calculades amb les dades, mai inventades', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });

  // L'únic avís del Mapa és un orfe (mitjana): per a l'explorador és una
  // fallada (enllaços trencats o orfes); per a la resta, Important on es veu.
  expect(etiquetesPerTargeta(nav)).toEqual({
    'El pols del cervell': ['Sense font:neutre'],
    'Explorador del cervell': ['Cal reparar:error'],
    'Fluxos de treball': [],
    'Calendari de processos': [],
    'Inventari de skills': ['Important:avis'],
    'Entrades i eixides': ['Important:avis'],
    'Agents atòmics': [],
    'Actors del Mas': [],
    'Avisos i salut': ['Important:avis']
  });
});

test('/consola: «Canvis nous» quan el resum ha canviat des de l’última visita d’este visitant', async () => {
  fonts.mapa = MAPA;
  localStorage.setItem(CLAU_VISTES, JSON.stringify({ explorador: '2 nodes · 0 arestes', calendari: '1 tasques · 1 vives · 0 mortes' }));
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const etiquetes = etiquetesPerTargeta(screen.getByRole('navigation', { name: 'Pàgines de la Consola' }));
  expect(etiquetes['Explorador del cervell']).toEqual(['Cal reparar:error', 'Canvis nous:info']);
  expect(etiquetes['Calendari de processos']).toEqual([]);           // el mateix resum que va vore
  expect(etiquetes['Fluxos de treball']).toEqual([]);                // mai vista: no hi ha base
});

test('obrir una subpàgina amb la font carregada la marca com a vista', async () => {
  fonts.mapa = MAPA;
  ruta.comodi = 'explorador';
  render(<ConsolaSection />);
  await screen.findByText(/^Instantània del Mapa: /);
  expect(JSON.parse(localStorage.getItem(CLAU_VISTES))).toEqual({ explorador: '3 nodes · 0 arestes' });
});

test('sense Mapa, obrir una subpàgina no marca res: un «no disponible» no és cap estat vist', async () => {
  ruta.comodi = 'calendari';
  render(<ConsolaSection />);
  await screen.findByText('Instantània encara no disponible.');
  expect(localStorage.getItem(CLAU_VISTES)).toBeNull();
});

test.each(PAGINES)('/consola/%s: H1, H2 d’introducció sense punt final i entradeta', async (id) => {
  ruta.comodi = id;
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findAllByText(/^Instantània/);
  const intro = document.querySelector('.page-intro');
  const h2 = intro.querySelector('h2');
  expect(h2.textContent.length).toBeGreaterThan(10);
  expect(h2.textContent).not.toMatch(/\.$/);
  expect(intro.querySelector('h2 + p.lead').textContent.length).toBeGreaterThan(20);
  // L'H2 de la introducció és l'únic: el cos de la pàgina parla en H3.
  expect(screen.getAllByRole('heading', { level: 2 })).toEqual([h2]);
});

test('/consola amb Mapa: les xifres de la capçalera d’Emowe, també com a targetes del Control', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');

  const xifres = screen.getByRole('region', { name: 'El Mas en xifres' });
  const targetes = targetesDeControl(xifres);
  // El títol porta la xifra i el nom: és també el nom accessible de l'enllaç.
  expect(targetes.map((t) => t.querySelector('h3').textContent)).toEqual(
    ['2 skills', '1 agent', '2 skills opaques', '1 cosa que corre sola', '1 skill amb avisos']
  );
  expect(within(xifres).getByRole('link', { name: '2 skills opaques' }).getAttribute('href')).toBe('/consola/entrades');
  expect(within(xifres).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(
    ['inventari', 'actors', 'entrades', 'calendari', 'inventari'].map((id) => `/consola/${id}`)
  );
  targetesDeControl();
});

test('/consola/calendari: pàgina pròpia amb molla de pa, controls i avís de Mapa absent', async () => {
  ruta.comodi = 'calendari';
  render(<ConsolaSection />);
  await screen.findByText('Instantània encara no disponible.');

  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Calendari de processos');
  expect(screen.getByRole('link', { name: 'Consola Termodinàmica' }).getAttribute('href')).toBe('/consola');
  expect(screen.getByRole('button', { name: /Refrescar/ })).toBeTruthy();
  expect(screen.getByText('Mapa no disponible')).toBeTruthy();
  expect(screen.queryByRole('tablist')).toBeNull();
});

test.each(PAGINES)('/consola/%s: la molla de pa és un panell propi al cim i les dades de la pàgina van al peu', async (id) => {
  ruta.comodi = id;
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findAllByText(/^Instantània/);
  const molla = screen.getByRole('navigation', { name: 'Molla de pa' });
  expect(molla.className).toBe('sdp-molla sdp-molla--panell');
  const main = document.querySelector('main');
  // Després de la introducció, el primer que es veu és la molla; l'últim, el peu de dades.
  expect(main.querySelector('.page-intro').nextElementSibling).toBe(molla);
  const peu = document.querySelector('.sdp-consola__peu');
  // Cada pàgina data la seua font: el pols, consola.json (absent ací); la resta, el Mapa.
  const estat = peu.querySelector('[role="status"]').textContent;
  if (id === 'pols') expect(estat).toBe('Instantània encara no disponible.');
  else expect(estat).toBe(`Instantània del Mapa: ${new Date(MAPA.generat).toLocaleString('ca-ES')}`);
  expect(within(peu).getByRole('button', { name: /Refrescar/ })).toBeTruthy();
  expect(within(peu).getByRole('switch')).toBeTruthy();
  const germans = [...main.children].filter((el) => el.tagName !== 'DIALOG');
  expect(germans.at(-1)).toBe(peu);
  // La molla i el peu no queden dins de cap barra de vista (__capcal és de les vistes).
  expect(peu.closest('.sdp-consola__capcal')).toBeNull();
  expect(molla.closest('.sdp-consola__capcal')).toBeNull();
});

test('/consola/pols: targetes de resum del Control i el detall a part, que la targeta obri', async () => {
  ruta.comodi = 'pols';
  fonts.consola = {
    generat: '2026-09-25T13:00:00.000Z',
    rebuts: [], consums: [{ agent: 'claude', entrada: 10, eixida: 5 }], credits: null,
    skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
    segell: null, immunitari: { operacions: 3 }
  };
  render(<ConsolaSection />);
  await screen.findByText('1 registres');

  // La primera graella són els cinc panells explicats; les xifres dels
  // detalls conserven la targeta del Control.
  targetesDeControl();
  const graella = document.querySelector('.sdp-card-grid');
  const resums = targetesExplicatives(graella);
  expect(resums.map((t) => t.querySelector('h3').textContent)).toEqual(['Càrrega documental', 'Consums', 'Crèdits', 'Rebuts', 'Skills']);
  // T51 · la instantània (més recent que el copy), en ISO local.
  expect(resums[1].querySelector('.sp-card-header .btn-date-time').getAttribute('datetime'))
    .toBe(dataHoraDeBarra({ modificat: '2026-09-25T13:00:00.000Z' }).dateTime);
  // La càrrega documental no té font: ni botó, ni peu, ni aparença de clicable, i ho diu.
  expect(resums[0].className).toBe('sp-card sdp-consola__targeta sdp-consola__quieta');
  expect(resums[0].querySelector('.sp-card-footer')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Càrrega documental' })).toBeNull();
  expect(document.getElementById('pols-carrega')).toBeNull();
  // El «Veure detall» del peu blau diu el mateix que la targeta.
  const peu = screen.getByRole('button', { name: 'Veure detall: Consums' });
  expect(peu.getAttribute('aria-controls')).toBe('pols-consums');
  expect(peu.getAttribute('aria-expanded')).toBe('false');
  expect(etiquetesPerTargeta(graella)).toEqual({
    'Càrrega documental': ['Sense font:neutre'], Consums: [], Crèdits: ['Sense font:neutre'], Rebuts: [], Skills: []
  });

  const detall = document.getElementById('pols-consums');
  expect(detall.tagName).toBe('DETAILS');
  expect(detall.className).toBe('sdp-consola__detall');
  expect(detall.querySelector('summary').textContent).toBe('Veure detall de consums');
  expect(detall.open).toBe(false);
  const boto = screen.getByRole('button', { name: 'Consums' });
  expect(boto.getAttribute('aria-controls')).toBe('pols-consums');
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(boto);
  expect(detall.open).toBe(true);
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement).toBe(detall.querySelector('summary'));
  // Tancar-lo des del seu summary també ho diu la targeta.
  detall.open = false;
  fireEvent(detall, new Event('toggle'));
  expect(boto.getAttribute('aria-expanded')).toBe('false');
});

test('/consola/pols: una skill fora del manifest pinta «Cal reparar» a la seua targeta', async () => {
  ruta.comodi = 'pols';
  fonts.consola = {
    generat: null, rebuts: [], consums: [], credits: [{ proveidor: 'x', consumit: 1, limit: 2 }],
    skills: [{ nom: 'nova', estat: null, descripcio: '', core: false, alDisc: true, alManifest: false }],
    segell: null, immunitari: { operacions: 0 }
  };
  render(<ConsolaSection />);
  await screen.findByText('1 skills · 1 orfes · 0 fantasmes');
  expect(etiquetesPerTargeta(document.querySelector('.sdp-card-grid'))).toEqual({
    'Càrrega documental': ['Sense font:neutre'], Consums: [], Crèdits: [], Rebuts: [], Skills: ['Cal reparar:error']
  });
});

const AMB_REBUT = () => ({
  generat: '2026-09-25T13:00:00.000Z',
  rebuts: [{ t: '2026-09-20T01:03:39.000Z', peticio: 'ced19fcaab00ffff', protocols: ['_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md'],
    fonts: [{ ruta: '.agents/BOOTSTRAP.md', sha256: 'eb1c1b03a1400000' }] }],
  consums: [], credits: [{ proveidor: 'Claude', consumit: 6, limit: 100 }],
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
  segell: null, immunitari: { operacions: 3 },
  termometria: { artefactesActius: 162, abast: 'Escriptori i actes vives' }
});

test('/consola/pols: Crèdits, Rebuts amb «Veure fonts» i Càrrega amb termometria s’obrin des del peu blau', async () => {
  ruta.comodi = 'pols';
  fonts.consola = AMB_REBUT();
  render(<ConsolaSection />);
  await screen.findByText('1 rebuts de lectura');

  // Amb termometria la Càrrega ja no és quieta: obri el seu detall i avisa de saturació.
  fireEvent.click(screen.getByRole('button', { name: 'Veure detall: Càrrega documental' }));
  expect(document.getElementById('pols-carrega').open).toBe(true);
  expect(screen.getByText('Escriptori i actes vives')).toBeTruthy();
  expect(screen.getByText('Revisem la saturació')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Veure detall: Crèdits' }));
  expect(document.getElementById('pols-credits').open).toBe(true);

  fireEvent.click(screen.getByRole('button', { name: 'Veure detall: Rebuts' }));
  expect(document.getElementById('pols-rebuts').open).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /^Veure les 1 fonts del rebut/ }));
  expect(screen.getByText('.agents/BOOTSTRAP.md')).toBeTruthy();
  expect(screen.getByText('Petició ced19fcaab00 · ' + new Date('2026-09-20T01:03:39.000Z').toLocaleString('ca-ES'))).toBeTruthy();
});

test('/consola/pols: la privacitat del peu amaga rutes, protocols i la petició del diàleg, i es recorda', async () => {
  ruta.comodi = 'pols';
  fonts.consola = AMB_REBUT();
  const { unmount } = render(<ConsolaSection />);
  await screen.findByText('1 rebuts de lectura');
  fireEvent.click(within(document.querySelector('.sdp-consola__peu')).getByRole('switch'));
  fireEvent.click(screen.getByRole('button', { name: 'Veure detall: Rebuts' }));
  expect(within(document.getElementById('pols-rebuts')).queryByText('auditoria_canonica.md')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^Veure les 1 fonts del rebut/ }));
  expect(screen.queryByText('.agents/BOOTSTRAP.md')).toBeNull();
  expect(screen.queryByText(/^Petició ced19fcaab00/)).toBeNull();
  // Una altra visita arrenca amb la privacitat activa.
  unmount();
  render(<ConsolaSection />);
  await screen.findByText('1 rebuts de lectura');
  expect(within(document.querySelector('.sdp-consola__peu')).getByRole('switch').getAttribute('aria-checked')).toBe('true');
});

test.each([
  ['fluxos', 'Fluxos de treball', 'Cap cadena declarada', ['Cadenes declarades', 'Suggeriments de la prosa', 'Punts de trobada']],
  ['agents', 'Agents atòmics', 'Agents atòmics al Mas: cap', ['Les quatre peces que ho fan possible']],
  ['actors', 'Actors del Mas', 'Els que conversen', ['Els que conversen', 'La memòria d’arrencada', 'Els candats', 'El que corre sol', 'El sòl']]
])('/consola/%s: vista nova del Mapa, amb el cos en H3', async (id, titol, text, seccions) => {
  ruta.comodi = id;
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText(/^Instantània del Mapa: /);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(titol);
  expect(screen.getByText(text)).toBeTruthy();
  expect([...document.querySelectorAll('section > h3')].map((h) => h.textContent)).toEqual(seccions);
  targetesDeControl();
});

test('/consola/salut: un sol Refrescar i un sol missatge quan el Mapa no hi és', async () => {
  ruta.comodi = 'salut';
  render(<ConsolaSection />);
  await screen.findByText('Instantània encara no disponible.');
  expect(screen.getAllByRole('button', { name: /Refrescar/ })).toHaveLength(1);
  expect(screen.getAllByText('Mapa no disponible')).toHaveLength(1);
  expect(screen.queryByText('No disponible en este entorn')).toBeNull();
});

test('/consola/salut amb Mapa: els detalls són desplegables de la Consola', async () => {
  ruta.comodi = 'salut';
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findAllByText(/^Instantània del Mapa: /);
  const detalls = [...document.querySelectorAll('details')];
  expect(detalls.map((d) => d.className)).toEqual(Array(5).fill('sdp-consola__detall'));
  expect(detalls[0].querySelector('summary').textContent).toBe('Veure els 1 avisos');
  expect(detalls.every((d) => d.querySelector('summary > svg[aria-hidden="true"]'))).toBe(true);
});

test('una subruta desconeguda torna al tauler', () => {
  ruta.comodi = 'pestanyes';
  render(<ConsolaSection />);
  expect(screen.getByTestId('redirigix').textContent).toBe('/consola');
});
