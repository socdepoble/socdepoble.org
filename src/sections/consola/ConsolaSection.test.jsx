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
import ConsolaSection, { ConsolaIncrustada } from './ConsolaSection.jsx';
import { CLAU_PRIVACITAT, CLAU_VISTES } from './consolaPagines.js';
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
  // T3 · sense font no hi ha res de dins que desglossar.
  expect(nav.querySelector('.sdp-consola__estats')).toBeNull();
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

/* T3 (ordre del Mestre, 260930) · la coberta de cada targeta desglossa els
   estats de dins de la seua pàgina, el que falla primer al capdavant. */
const estatsPerTargeta = (nav) => Object.fromEntries([...nav.querySelectorAll('article.sp-card')].map((t) => {
  const llista = t.querySelector('.sdp-consola__estats');
  return [t.querySelector('h3').textContent, llista
    ? [...llista.querySelectorAll('.sdp-insignia')].map((i) => `${i.textContent}:${[...i.classList].find((c) => c.startsWith('sdp-insignia--')).slice(14)}`)
    : null];
}));

test('T3 · /consola amb Mapa: cada coberta desglossa la seua pàgina, el més greu primer', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect(estatsPerTargeta(nav)).toEqual({
    'El pols del cervell': null,
    'Explorador del cervell': ['1 peça òrfena:error'],
    'Fluxos de treball': null,
    'Calendari de processos': null,
    'Inventari de skills': ['1 skill amb semàfor ambre:avis', '1 skill òrfena:avis'],
    'Entrades i eixides': ['2 skills opaques:avis'],
    'Agents atòmics': ['Fluxos de treball: falta:info', 'Tauler: falta:info', 'Qui avisa quan algo es trenca: sense mesura:info'],
    'Actors del Mas': null,
    'Avisos i salut': ['1 avís mitjà:avis']
  });
  // Darrere de les mètriques, dins del cos; mai com a capçalera ni com a etiqueta de la targeta.
  for (const llista of nav.querySelectorAll('.sdp-consola__estats')) {
    expect(llista.tagName).toBe('UL');
    expect(llista.previousElementSibling.className).toBe('sdp-consola__metriques');
    expect(llista.closest('.sp-card-text')).not.toBeNull();
    expect(llista.querySelector('h1, h2, h3, h4, h5, h6, .sp-card-label')).toBeNull();
  }
});

test('T3 · /consola amb Mapa: el to del primer estat és el de l’etiqueta de nivell', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  const estats = estatsPerTargeta(nav);
  const etiquetes = etiquetesPerTargeta(nav);
  const NIVELL = { error: 'Cal reparar:error', avis: 'Important:avis' };
  expect(Object.keys(estats)).toHaveLength(9);
  for (const [titol, llista] of Object.entries(estats)) {
    const primer = llista?.[0]?.split(':').at(-1);
    const nivell = etiquetes[titol].find((e) => e === NIVELL.error || e === NIVELL.avis) ?? null;
    expect(nivell, titol).toBe(NIVELL[primer] ?? null);
  }
});

test('T3 · /consola: la coberta no fa saltar «Canvis nous», perquè la signatura no en sap res', async () => {
  fonts.mapa = MAPA;
  localStorage.setItem(CLAU_VISTES, JSON.stringify({
    explorador: '3 nodes · 0 arestes',
    fluxos: '0 cadenes declarades · 0 suggeriments de la prosa',
    calendari: '1 tasques · 1 vives · 0 mortes',
    inventari: '2 skills al Mapa',
    entrades: '2 skills · 0 rutes documentals',
    agents: '0 agents atòmics · 1 arnesos que conversen',
    actors: '1 arnesos · 0 candats · 1 tasques programades',
    salut: '1 avisos (0 alts) · 0 mètriques'
  }));
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect(nav.querySelectorAll('.sdp-consola__estats').length).toBeGreaterThan(0);
  expect(Object.values(etiquetesPerTargeta(nav)).flat()).not.toContain('Canvis nous:info');
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
  // El títol porta la xifra i el nom.
  expect(targetes.map((t) => t.querySelector('h3').textContent)).toEqual(
    ['2 skills', '1 agent', '2 skills opaques', '1 cosa que corre sola', '1 skill amb avisos']
  );
  // T11 (ordre del Mestre, 260930) · són dades, no portes: cap enllaç ni
  // botó, i totes quietes (sense l'aparença de clicable).
  expect(within(xifres).queryAllByRole('link')).toEqual([]);
  expect(within(xifres).queryAllByRole('button')).toEqual([]);
  expect(targetes.every((t) => t.classList.contains('sdp-consola__quieta'))).toBe(true);
  targetesDeControl();
});

/* T2 (ordre del Mestre, 260930) · efecte tauler: cada mètrica de les
   targetes del tauler és un h5; els missatges d'estat, un paràgraf. */
test('/consola amb Mapa: les mètriques del tauler són h5, en l’ordre del resum', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  const perTargeta = Object.fromEntries([...nav.querySelectorAll('article.sp-card')].map((t) => [
    t.querySelector('h3').textContent,
    [...t.querySelectorAll('.sdp-consola__metriques > h5.sdp-consola__metrica')].map((h) => h.textContent)
  ]));
  expect(perTargeta['Explorador del cervell']).toEqual(['3 nodes', '0 arestes']);
  expect(perTargeta['Calendari de processos']).toEqual(['1 tasques', '1 vives', '0 mortes']);
  expect(perTargeta['Avisos i salut']).toEqual(['1 avisos (0 alts)', '0 mètriques']);
  // Sense consola.json, el pols no té mètriques: diu per què en paràgraf.
  expect(perTargeta['El pols del cervell']).toEqual([]);
  expect(screen.getByText('Dades no disponibles en este entorn').tagName).toBe('P');
  // Huit targetes del Mapa amb mètriques, cap en paràgraf de dada.
  expect(nav.querySelectorAll('.sdp-consola__metriques')).toHaveLength(8);
  expect([...nav.querySelectorAll('.sdp-consola__dada')].map((p) => p.textContent)).toEqual(['Dades no disponibles en este entorn']);
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
  // T2 · la targeta Skills porta tres mètriques en h5.
  await screen.findByText('1 orfes');
  const skills = [...document.querySelectorAll('.sdp-card-grid article.sp-card')]
    .find((t) => t.querySelector('h3').textContent === 'Skills');
  expect([...skills.querySelectorAll('h5.sdp-consola__metrica')].map((h) => h.textContent))
    .toEqual(['1 skills', '1 orfes', '0 fantasmes']);
  expect(etiquetesPerTargeta(document.querySelector('.sdp-card-grid'))).toEqual({
    'Càrrega documental': ['Sense font:neutre'], Consums: [], Crèdits: [], Rebuts: [], Skills: ['Cal reparar:error']
  });
});

test('/consola/pols: les mètriques dels cinc panells són h5; sense mesura, el paràgraf diu per què', async () => {
  ruta.comodi = 'pols';
  fonts.consola = AMB_REBUT();
  render(<ConsolaSection />);
  await screen.findByText('1 rebuts de lectura');
  const graella = document.querySelector('.sdp-card-grid');
  const perTargeta = Object.fromEntries([...graella.querySelectorAll('article.sp-card')].map((t) => [
    t.querySelector('h3').textContent,
    [...t.querySelectorAll('h5.sdp-consola__metrica')].map((h) => h.textContent)
  ]));
  expect(perTargeta).toEqual({
    'Càrrega documental': ['162 artefactes actius', 'avís per damunt de 150'],
    Consums: [],
    Crèdits: ['1 proveïdors'],
    Rebuts: ['1 rebuts de lectura'],
    Skills: ['1 skills', '0 orfes', '0 fantasmes']
  });
  expect(screen.getByText('Sense mesura de tòkens').className).toBe('sdp-consola__dada');
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

/* ── T12 (ordre del Mestre, 260930) · vigilància constant ──────────────── */

const DIA = 24 * 60 * 60 * 1000;
/* Dates relatives al rellotge de la prova, amb un marge (per defecte un
   minut més) perquè ni els dies sencers ni el llindar depenguen de l'execució. */
const isoDeFaDies = (n, marge = 60 * 1000) => new Date(Date.now() - n * DIA - marge).toISOString();
const ambRebutDe = (dies, marge) => ({
  ...AMB_REBUT(),
  rebuts: [
    { t: isoDeFaDies(dies + 5, marge), peticio: 'aaaa', protocols: [], fonts: [] },
    { t: isoDeFaDies(dies, marge), peticio: 'bbbb', protocols: [], fonts: [] }
  ]
});
const etiquetaRebuts = () => etiquetesPerTargeta(document.querySelector('.sdp-card-grid')).Rebuts;

test('/consola/pols: el detall de Rebuts diu quan va entrar l’últim, i fa quants dies', async () => {
  ruta.comodi = 'pols';
  fonts.consola = ambRebutDe(10);
  render(<ConsolaSection />);
  await screen.findByText('2 rebuts de lectura');
  const detall = document.getElementById('pols-rebuts');
  const linia = detall.querySelector('p.sdp-consola__segell');
  // El més recent, no el primer de la llista.
  expect(linia.textContent).toBe(`Últim rebut: ${new Date(fonts.consola.rebuts[1].t).toLocaleString('ca-ES')} (fa 10 dies)`);
  // Va abans de la taula, dins del mateix desplegable.
  expect(linia.nextElementSibling.getAttribute('role')).toBe('region');
});

test('/consola/pols: rebuts de més de 7 dies porten «Important»; de 7 o menys, res', async () => {
  ruta.comodi = 'pols';
  // 7 dies i un minut ja en són més de 7, encara que el text diga «fa 7 dies».
  fonts.consola = ambRebutDe(7);
  const { unmount } = render(<ConsolaSection />);
  await screen.findByText('2 rebuts de lectura');
  expect(etiquetaRebuts()).toEqual(['Important:avis']);
  unmount();
  fonts.consola = ambRebutDe(7, -60 * 1000);       // un minut abans del llindar
  render(<ConsolaSection />);
  await screen.findByText('2 rebuts de lectura');
  expect(etiquetaRebuts()).toEqual([]);
});

test('/consola/pols: el peu data l’última operació immunitària si consola.json la porta; si no, no n’inventa', async () => {
  ruta.comodi = 'pols';
  const data = '2026-08-03T13:43:04.716Z';
  fonts.consola = { ...AMB_REBUT(), immunitari: { operacions: 15, ultima: { op: 'OP-015', tipus: 'DESTRUEIX', data } } };
  const { unmount } = render(<ConsolaSection />);
  await screen.findByText('1 rebuts de lectura');
  const estat = () => document.querySelector('.sdp-consola__peu [role="status"]').textContent;
  expect(estat()).toBe(`Instantània: ${new Date(AMB_REBUT().generat).toLocaleString('ca-ES')} · 15 operacions immunitàries, l’última el ${new Date(data).toLocaleString('ca-ES')}`);
  unmount();
  fonts.consola = { ...AMB_REBUT(), immunitari: { operacions: 3, ultima: null } };
  render(<ConsolaSection />);
  await screen.findByText('1 rebuts de lectura');
  expect(estat()).toBe(`Instantània: ${new Date(AMB_REBUT().generat).toLocaleString('ca-ES')} · 3 operacions immunitàries`);
});

/* Les evidències tenen la forma que escriu el compilador (construeixMapa.js):
   la del segell porta un parèntesi propi, i totes dues, ordres. */
const EVIDENCIA_SEGELL = '1 de 18 skills fora del segell o divergents (només SKILL.md; el segell sencer, amb 00_INDEX_SKILLS.md: node tooling/gates/segella.mjs)';
const EVIDENCIA_LEDGER = 'signatura del LEDGER no vàlida · 2 segells fòssils · node tooling/verify-ledger.mjs';
const MAPA_VIGILANCIA_TRENCADA = () => ({
  ...MAPA,
  nodes: [...MAPA.nodes,
    { id: 'document:.agents/SKILLS_SEAL.json', tipus: 'document', font: null, atributs: {} },
    { id: 'document:.agents/LEDGER.md', tipus: 'document', font: null, atributs: {} }],
  avisos: [...MAPA.avisos,
    { node: 'document:.agents/SKILLS_SEAL.json', codi: 'segell-trencat', severitat: 'alta', evidencia: EVIDENCIA_SEGELL },
    { node: 'document:.agents/LEDGER.md', codi: 'ledger-invalid', severitat: 'alta', evidencia: EVIDENCIA_LEDGER },
    { node: 'document:.agents/LEDGER.md', codi: 'ledger-invalid', severitat: 'alta', evidencia: null }]
});
const alertaDeVigilancia = () => screen.queryByText('La vigilància del cervell està trencada')?.closest('.sdp-alerta') ?? null;

test('/consola: una alerta al cim quan el Mapa porta un codi de vigilància, amb què està trencat i on mirar', async () => {
  fonts.mapa = MAPA_VIGILANCIA_TRENCADA();
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  // <Alerta to="error"> amb el rol per defecte: cal actuar ja.
  const alerta = screen.getByRole('alert');
  expect(alerta).toBe(alertaDeVigilancia());
  expect(alerta.className).toBe('sdp-alerta sdp-alerta--error');
  // La frase humana (la del detall de l'Explorador) i, separat, on mirar: sense parèntesis afegits.
  expect([...alerta.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
    `El segell no quadra amb el disc: hi ha skills fora del segell o divergents, i cal reconciliar-lo abans de confiar en cap empremta. On: .agents/SKILLS_SEAL.json · Evidència: ${EVIDENCIA_SEGELL}`,
    `La signatura del LEDGER no és vàlida: el Llibre d’Obra té segells fòssils o línies mal formades. On: .agents/LEDGER.md · Evidència: ${EVIDENCIA_LEDGER}`,
    'La signatura del LEDGER no és vàlida: el Llibre d’Obra té segells fòssils o línies mal formades. On: .agents/LEDGER.md'
  ]);
  // La ruta va en tipografia de màquina.
  expect([...alerta.querySelectorAll('li > code.sdp-consola__mono')].map((c) => c.textContent))
    .toEqual(['.agents/SKILLS_SEAL.json', '.agents/LEDGER.md', '.agents/LEDGER.md']);
  expect(alerta.textContent).toContain('El detall i què cal reparar són a la pàgina Avisos i salut.');
  // Sense porta pròpia: a Avisos i salut s'entra per la seua targeta.
  expect(within(alerta).queryAllByRole('link')).toEqual([]);
  // Va abans del tauler.
  expect(alerta.nextElementSibling).toBe(screen.getByRole('navigation', { name: 'Pàgines de la Consola' }));
});

test('/consola: sense codis de vigilància (o sense Mapa) no hi ha cap alerta', async () => {
  fonts.mapa = MAPA;                               // només un orfe: no és vigilància
  const { unmount } = render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  expect(alertaDeVigilancia()).toBeNull();
  expect(document.querySelector('.sdp-alerta')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
  unmount();
  fonts.mapa = null;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  expect(alertaDeVigilancia()).toBeNull();
  expect(document.querySelector('.sdp-alerta')).toBeNull();
});

test('/consola: amb la privacitat recordada, l’alerta de vigilància amaga rutes i evidències', async () => {
  localStorage.setItem(CLAU_PRIVACITAT, '1');
  fonts.mapa = MAPA_VIGILANCIA_TRENCADA();
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const alerta = alertaDeVigilancia();
  expect(alerta.textContent).not.toContain('.agents/SKILLS_SEAL.json');
  expect(alerta.textContent).not.toContain('.agents/LEDGER.md');
  expect(alerta.textContent).not.toContain('node tooling/');
  expect([...alerta.querySelectorAll('code.sdp-consola__mono')].map((c) => c.textContent))
    .toEqual(Array(3).fill('••••••dada amagada pel mode privacitat'));
  // La frase humana no és cap dada privada: es continua llegint.
  expect(alerta.textContent).toContain('El segell no quadra amb el disc');
});

test('Consola incrustada (Wiki): també respecta la privacitat recordada', async () => {
  localStorage.setItem(CLAU_PRIVACITAT, '1');
  fonts.mapa = MAPA_VIGILANCIA_TRENCADA();
  render(<ConsolaIncrustada />);
  await screen.findByText('Dades no disponibles en este entorn');
  const alerta = alertaDeVigilancia();
  expect(alerta.textContent).toContain('El segell no quadra amb el disc');
  expect(alerta.textContent).not.toContain('.agents/SKILLS_SEAL.json');
  expect(alerta.textContent).not.toContain('node tooling/');
  cleanup();
  // Sense privacitat recordada, la ruta es veu.
  localStorage.clear();
  render(<ConsolaIncrustada />);
  await screen.findByText('Dades no disponibles en este entorn');
  expect(alertaDeVigilancia().textContent).toContain('.agents/SKILLS_SEAL.json');
});

/* T9 (260930) · les taules del pols no porten límit d'alçada propi. */
test('/consola/pols: les taules de Rebuts i d’Inventari no porten sdp-taula--llarga', async () => {
  ruta.comodi = 'pols';
  fonts.consola = AMB_REBUT();
  render(<ConsolaSection />);
  await screen.findByText('1 rebuts de lectura');
  for (const nom of ['Rebuts de lectura Matrix', 'Inventari de skills']) {
    expect(screen.getByRole('region', { name: nom }).className, nom).toBe('sdp-taula sdp-taula--densa');
  }
  expect(document.querySelector('.sdp-taula--llarga')).toBeNull();
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
