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
/* Onada 8 (261009) · La boina de Sóc de Poble porta al seu perfil
   (RUTA_PERFIL_PROJECTE), ja no a /projecte. */
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

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

/* Una sola recepta de targeta, cap d'inventada: TargetaConsola (tauler, pols,
   les xifres del Mas, les de dins de les pàgines i les peces del Mapa), la
   UniversalCard sencera del Mur, amb la boina de Sóc de Poble (l'autor porta
   al seu perfil; Onada 8, 261009: abans, a /projecte) i la data a la seua
   pastilla, icona a la insígnia lateral,
   entradilla i el peu de la barra blava; tota la targeta porta a la seua
   pàgina pròpia.
   Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): la
   segona recepta, TargetaResum (la del Panell de Control, «action», icona de
   40 px, sense boina ni pàgina), que conservaven «les xifres dels detalls».
   Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
   pàgina pròpia): la targeta de sistema sense boina, amb la data a
   l'última línia del cos (prompt 261004_0515, §6/T8). Continua derogada la
   boina inventada «Consola Termodinàmica» i la «Font: …». Cap targeta de la
   Consola és ja `sdp-consola__quieta`. */
const esClicable = (t) => [...t.children].some((c) => c.classList.contains('sp-card-link-overlay'));
/** Cap targeta del Control ni cap targeta sense boina: cap xifra solta. */
function capXifraSolta(contenidor = document) {
  expect([...contenidor.querySelectorAll('article.sp-card--action, article.sdp-consola__quieta')]).toEqual([]);
  expect([...contenidor.querySelectorAll('article.sp-card')].filter((t) => !t.querySelector(':scope > .sp-card-header'))).toEqual([]);
  expect(document.querySelector('.sdp-consola__tauler, .sdp-consola__resum, .sdp-consola__xifra')).toBeNull();
}
/** La boina de Sóc de Poble: l'autor enllaçat al seu perfil (Onada 8, 261009), amb logo (el PNG, Onada 8) i poble. */
function teBoinaDeSocDePoble(t) {
  const capcal = t.firstElementChild;
  expect(capcal.className).toBe('sp-card-header');
  const autor = capcal.querySelector('a.sp-card-author-link');
  expect(autor.getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
  expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  expect(autor.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  expect(autor.querySelector('img.sp-card-avatar').getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png');
}
function targetesExplicatives(contenidor = document, { perA = true } = {}) {
  const targetes = [...contenidor.querySelectorAll('article.sp-card.sdp-consola__targeta')];
  for (const t of targetes) {
    expect(t.className).toBe(esClicable(t) ? 'sp-card sdp-consola__targeta' : 'sp-card sdp-consola__targeta sdp-consola__quieta');
    expect(t.parentElement.classList.contains('sdp-card-grid')).toBe(true);
    // La boina de l'autor real; mai una autoria inventada ni la font. La icona ocupa el lloc de la foto.
    teBoinaDeSocDePoble(t);
    expect(t.textContent).not.toMatch(/Consola Termodinàmica|Font: /);
    expect(t.querySelector('.sp-card-media-container')).toBeNull();
    expect(t.querySelector('.sp-card-calendar-badge svg').getAttribute('width')).toBe('48');
    // Títol, subtítol («per a…» al tauler i al pols) i entradilla.
    expect(t.querySelector('h3.sp-card-title')).not.toBeNull();
    if (perA) expect(t.querySelector('h4.sp-card-subtitle').textContent).toMatch(/^Per a /);
    else expect(t.querySelector('h4.sp-card-subtitle').textContent.length).toBeGreaterThan(5);
    expect(t.querySelector('.sp-card-text > p').textContent.length).toBeGreaterThan(20);
    // Peu blau només quan hi ha acció: cap peu buit. I és el de la barra blava, amb el verb canònic.
    expect(Boolean(t.querySelector('.sp-card-footer .sp-card-connect'))).toBe(esClicable(t));
    if (esClicable(t)) {
      const titol = t.querySelector('h3').textContent;
      expect([...t.querySelectorAll('.sp-card-footer button')].map((b) => b.getAttribute('aria-label')))
        .toEqual([`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`, `Connectar amb ${titol}`]);
    }
  }
  return targetes;
}

/* T51 · La data de cada targeta explicativa, a la pastilla de la boina: un
   <time> sense clic (ordre del Mestre, 261004: tota targeta amb boina). */
const datesDeLaBoina = (contenidor) => [...contenidor.querySelectorAll('.sp-card-header .sp-card-meta > time.btn-date-time')];
const textDeLaPastilla = (pastilla) => [...pastilla.querySelectorAll('span')].map((s) => s.textContent).join(' · ');

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
  /* Correcció 261004 (verificador, punt 9) · sense Mapa, «El Mas en xifres»
     també es pinta (cap pàgina sense targeta): el seu h2 ve darrere del de
     la introducció. */
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Manteniment de la IAIA', 'El Mas en xifres']);
  expect(document.querySelector('.page-intro h2 + p.lead')).not.toBeNull();
  expect(screen.queryByRole('tablist')).toBeNull();

  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect(targetesExplicatives(nav)).toHaveLength(9);
  expect(nav.className).toBe('sdp-card-grid sdp-consola__graella');
  // Tota la targeta porta a la seua pàgina; l'autor de la boina, al seu perfil (Onada 8; abans, /projecte).
  expect([...nav.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href'))).toEqual(PAGINES.map((id) => `/consola/${id}`));
  expect([...nav.querySelectorAll('a.sp-card-author-link')].map((a) => a.getAttribute('href'))).toEqual(Array(9).fill(RUTA_PERFIL_PROJECTE));
  // Ordre del Mestre, 261004 · el peu de la barra blava, amb el títol al nom
  // accessible. Derogat per l'ordre del Mestre del 261004 (prompt
  // 261004_0515): «Compartir + Obrir».
  for (const verb of ['Traduir ', 'Comentar ', 'Compartir ', 'Connectar amb ']) {
    expect(within(nav).getAllByRole('button', { name: new RegExp(`^${verb}`) }), verb).toHaveLength(9);
  }
  expect(within(nav).queryAllByRole('button', { name: /^(Obrir|Veure detall)/ })).toEqual([]);
  // La dada viva va a part de l'entradilla; si falta la font, diu per què.
  expect(screen.getAllByText('Mapa no disponible en este entorn').map((p) => p.className)).toEqual(Array(8).fill('sdp-consola__dada'));
  // T51 · cap targeta sense data: sense instantània, la del copy de la
  // Consola (PAGE_COPY), mai la d'ara; a la pastilla de la boina, mai al cos.
  const copia = dataHoraDeBarra({ creat: PAGE_COPY.consola.date });
  const dates = datesDeLaBoina(nav);
  expect(dates).toHaveLength(9);
  expect(dates.every((d) => d.getAttribute('datetime') === copia.dateTime
    && textDeLaPastilla(d) === [copia.time, copia.date].filter(Boolean).join(' · '))).toBe(true);
  expect(nav.querySelector('.sp-card-text time, .sdp-consola__data')).toBeNull();
  // Sense cap font, cada targeta ho diu també d'un colp d'ull.
  expect(Object.values(etiquetesPerTargeta(nav))).toEqual(Array(9).fill(['Sense font:neutre']));
  // T3 · sense font no hi ha res de dins que desglossar.
  expect(nav.querySelector('.sdp-consola__estats')).toBeNull();
  // Correcció 261004 (verificador, punt 9) · sense Mapa, les deu xifres del
  // Mas continuen sent targetes, amb el seu nom i cap número inventat.
  const xifres = screen.getByRole('region', { name: 'El Mas en xifres' });
  expect(targetesExplicatives(xifres, { perA: false })).toHaveLength(10);
  expect([...xifres.querySelectorAll('h3')].map((h) => h.textContent).join(' ')).not.toMatch(/\d/);
  expect([...xifres.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href'))).toEqual(SLUGS.map((s) => `/consola/xifres/${s}`));
  capXifraSolta();
});

/* Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   La data torna a la pastilla de la boina: un <time> de només lectura, que
   no porta al Calendari (una instantània de dades no és cap publicació).
   Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
   pàgina pròpia): la data a l'última línia del cos. */
test('/consola amb Mapa: la pastilla de la boina porta l’hora local de la instantània, que no navega', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  // Les huit del Mapa porten la instantània (més recent que el copy); el pols,
  // sense consola.json, la data del copy.
  const instantania = dataHoraDeBarra({ modificat: MAPA.generat }).dateTime;
  const hores = datesDeLaBoina(nav).filter((h) => h.getAttribute('datetime') === instantania);
  expect(hores).toHaveLength(8);
  expect(hores.every((h) => h.tagName === 'TIME' && !h.closest('a, button'))).toBe(true);
  expect(nav.querySelector('.sp-card-header button')).toBeNull();
  expect(new Date(instantania).getTime()).toBe(Date.parse('2026-09-25T13:12:23Z'));
  // Hora i data locals: la prova no depén de la zona horària de qui l'executa.
  const d = new Date(MAPA.generat);
  const dos = (n) => String(n).padStart(2, '0');
  expect(textDeLaPastilla(hores[0])).toBe(`${dos(d.getHours())}:${dos(d.getMinutes())} · ${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`);
});

test('/consola amb Mapa: etiquetes d’un colp d’ull calculades amb les dades, mai inventades', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });

  // L'únic avís del Mapa és un orfe (mitjana): Important on es veu.
  // Onada 6 (semàfor) · on no hi ha res greu, el verd («En ordre»); Agents
  // atòmics pren el color de les seues peces (FALTA és taronja). Correcció de
  // l'Onada 6 (revisió adversarial) · també a l'Explorador: l'orfe és mitjà,
  // taronja a totes les targetes. Derogat: «per a l'explorador és una fallada».
  expect(etiquetesPerTargeta(nav)).toEqual({
    'El pols del cervell': ['Sense font:neutre'],
    'Explorador del cervell': ['Important:avis'],
    'Fluxos de treball': ['En ordre:exit'],
    'Calendari de processos': ['En ordre:exit'],
    'Inventari de skills': ['Important:avis'],
    'Entrades i eixides': ['Important:avis'],
    'Agents atòmics': ['Important:avis'],
    'Actors del Mas': ['En ordre:exit'],
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
    // Correcció de l'Onada 6 (revisió adversarial) · el color de la severitat de l'avís (mitjana, taronja).
    'Explorador del cervell': ['1 peça òrfena:avis'],
    'Fluxos de treball': null,
    'Calendari de processos': null,
    'Inventari de skills': ['1 skill amb semàfor ambre:avis', '1 skill òrfena:avis'],
    'Entrades i eixides': ['2 skills opaques:avis'],
    // Onada 6 · FALTA, taronja com l'etiqueta de la peça; SENSE MESURA, neutre.
    'Agents atòmics': ['Fluxos de treball: falta:avis', 'Tauler: falta:avis', 'Qui avisa quan algo es trenca: sense mesura:neutre'],
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

/* Onada 6 (requisit 9: informació en superfície) · Cada targeta del tauler
   diu quins són els seus problemes, no només quants, sense entrar; i continua
   portant a la seua pàgina (ordre del Mestre, 261004). */
const problemesPerTargeta = (contenidor) => Object.fromEntries([...contenidor.querySelectorAll('article.sp-card')].map((t) => {
  const llista = t.querySelector('.sdp-consola__problemes');
  return [t.querySelector('h3').textContent, llista ? [...llista.children].map((li) => li.textContent) : null];
}));

test('Onada 6 · /consola amb Mapa: cada targeta diu quins problemes té, a la vista i sense deixar de ser clicable', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  /* Correcció de l'Onada 6 (revisió adversarial) · cada problema porta davant
     la seua marca, una Insignia amb el color del semàfor: la severitat de
     l'avís, el color de la skill a l'Inventari o el que li passa. */
  expect(problemesPerTargeta(nav)).toEqual({
    'El pols del cervell': null,
    'Explorador del cervell': ['mitjana core-identitat · orfe'],
    'Fluxos de treball': null,
    'Calendari de processos': null,
    'Inventari de skills': ['ambre core-identitat · orfe'],
    'Entrades i eixides': ['opaca core-identitat', 'opaca sdp-workflow'],
    'Agents atòmics': null,
    'Actors del Mas': null,
    'Avisos i salut': ['mitjana core-identitat · orfe']
  });
  const marques = (contenidor) => [...contenidor.querySelectorAll('.sdp-consola__problemes li > .sdp-insignia')]
    .map((i) => `${i.textContent}:${[...i.classList].find((c) => c.startsWith('sdp-insignia--')).slice(14)}`);
  expect(marques(nav)).toEqual(['mitjana:avis', 'ambre:avis', 'opaca:avis', 'opaca:avis', 'mitjana:avis']);
  for (const llista of nav.querySelectorAll('.sdp-consola__problemes')) {
    expect(llista.tagName).toBe('UL');
    expect(llista.closest('.sp-card-text')).not.toBeNull();
    expect(llista.getAttribute('aria-label')).toBe('Quins problemes hi ha');
    // Darrere dels estats de la coberta.
    expect(llista.previousElementSibling.className).toBe('sdp-consola__estats');
  }
  // Totes continuen portant a la seua pàgina.
  expect([...nav.querySelectorAll('article.sp-card')].every(esClicable)).toBe(true);
  // I «El Mas en xifres» també: la xifra de les òrfenes diu quina.
  const xifres = screen.getByRole('heading', { level: 2, name: 'El Mas en xifres' }).closest('section');
  expect(problemesPerTargeta(xifres)['1 skill òrfena']).toEqual(['mitjana core-identitat · orfe']);
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

/* Correcció 261004 (verificador de la segona passada, punt 3) · les
   signatures concorden («1 tasca · 1 viva», «1 arnés que conversa»): amb un 1
   canvien una sola vegada. */
test('T3 · /consola: la coberta no fa saltar «Canvis nous», perquè la signatura no en sap res', async () => {
  fonts.mapa = MAPA;
  localStorage.setItem(CLAU_VISTES, JSON.stringify({
    explorador: '3 nodes · 0 arestes',
    fluxos: '0 cadenes declarades · 0 suggeriments de la prosa',
    calendari: '1 tasca · 1 viva · 0 mortes',
    inventari: '2 skills al Mapa',
    entrades: '2 skills · 0 rutes documentals',
    agents: '0 agents atòmics · 1 arnés que conversa',
    actors: '1 arnés · 0 candats · 1 tasca programada',
    /* Correcció 261004 (verificador de la tercera passada, punt 5) · la mètrica
       és la xifra de la targeta «metriques-amb-mesura». Derogat «0 mètriques». */
    salut: '1 avís (0 alts) · 0 mètriques de salut amb mesura'
  }));
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect(nav.querySelectorAll('.sdp-consola__estats').length).toBeGreaterThan(0);
  expect(Object.values(etiquetesPerTargeta(nav)).flat()).not.toContain('Canvis nous:neutre');
});

test('/consola: «Canvis nous» quan el resum ha canviat des de l’última visita d’este visitant', async () => {
  fonts.mapa = MAPA;
  localStorage.setItem(CLAU_VISTES, JSON.stringify({ explorador: '2 nodes · 0 arestes', calendari: '1 tasca · 1 viva · 0 mortes' }));
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const etiquetes = etiquetesPerTargeta(screen.getByRole('navigation', { name: 'Pàgines de la Consola' }));
  // Onada 6 · «Canvis nous» no és cap gravetat: neutre, darrere del nivell del semàfor.
  expect(etiquetes['Explorador del cervell']).toEqual(['Important:avis', 'Canvis nous:neutre']);
  expect(etiquetes['Calendari de processos']).toEqual(['En ordre:exit']);   // el mateix resum que va vore
  expect(etiquetes['Fluxos de treball']).toEqual(['En ordre:exit']);        // mai vista: no hi ha base per al «nou»
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

/* Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   Cap xifra solta: cada una és una UniversalCard sencera, amb la boina de
   Sóc de Poble (autor al seu perfil, Onada 8; abans, /projecte; la data de
   la mesura a la pastilla),
   títol amb la xifra, subtítol, entradeta que explica què compta, d'on ix i
   per què importa, la icona a la insígnia lateral i el peu canònic. Tota la
   targeta porta a la seua pàgina pròpia, /consola/xifres/<slug>.
   Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
   pàgina pròpia): les xifres com a targetes compactes del Control, sense
   boina ni peu, que portaven a una pàgina de la Consola (prompt
   261004_0515, §6/T8; la T11 del 260930 ja estava derogada). */
const SLUGS = ['skills', 'agents', 'skills-opaques', 'coses-que-corren-soles', 'skills-amb-avisos', 'avisos-alts',
  'linies-ledger', 'torns-caducats', 'skills-fora-del-segell', 'skills-orfenes'];

test('/consola amb Mapa: cada xifra del Mas és una targeta pura amb boina, cos i peu, que porta a la seua pàgina', async () => {
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');

  const xifres = screen.getByRole('region', { name: 'El Mas en xifres' });
  // Cap targeta compacta del Control: les deu són explicatives, amb boina.
  capXifraSolta(xifres);
  const targetes = targetesExplicatives(xifres, { perA: false });
  expect(targetes).toHaveLength(10);
  expect(xifres.querySelector('.sdp-card-grid').className).toBe('sdp-card-grid sdp-consola__graella');
  // El títol porta la xifra i el que compta; una mesura absent (el Mapa de la
  // prova no porta salut) ho diu, mai és un zero.
  expect(targetes.map((t) => [t.querySelector('h3').textContent, t.querySelector('h4').textContent])).toEqual([
    ['2 skills', 'Al cens del Mapa del Mas'],
    ['1 agent', 'Arnesos que conversen amb el Mestre'],
    ['2 skills opaques', 'Sense entrades ni eixides declarades'],
    ['1 cosa que corre sola', 'Tasques que llança launchd · 1 viva'],
    // Correcció 261004 (verificador de la tercera passada, punt 5) · derogat «Semàfor ambre o roig a l’Inventari».
    ['1 skill amb avisos', '0 en roig · 1 en ambre a l’Inventari'],
    ['0 avisos alts', 'Severitat alta: cal actuar'],
    // Correcció 261004 (verificador de la segona passada, punt 3) · derogat «— segells fòssils · — línies mal formades».
    ['LEDGER sense mesura', 'Segells fòssils i línies mal formades'],
    ['Torns sense mesura', 'Oberts i sense tancar'],
    ['Segell sense mesura', 'O divergents (només els SKILL.md)'],
    ['1 skill òrfena', '0 skills fantasma: nomenades i sense carpeta al disc']
  ]);
  for (const t of targetes) {
    const titol = t.querySelector('h3').textContent;
    // L'entradeta diu què compta, d'on ix (el fitxer o el generador) i per què importa: tres frases.
    const entradeta = t.querySelector('.sp-card-text > p').textContent;
    expect(entradeta.split(/(?<=\.) /).length, titol).toBeGreaterThanOrEqual(3);
    expect(entradeta, titol).toMatch(/mapa\.json|LEDGER\.md|SKILLS_SEAL\.json|runtime\/turns/);
    // Sense imatge, la icona de la mètrica a la insígnia lateral.
    expect(t.querySelector('.sp-card-body.has-aside .sp-card-calendar-badge svg'), titol).not.toBeNull();
    // La data de la mesura (la instantània del Mapa) a la pastilla de la boina.
    expect(datesDeLaBoina(t)[0].getAttribute('datetime')).toBe(dataHoraDeBarra({ modificat: MAPA.generat }).dateTime);
    // El peu canònic: quatre accions.
    expect([...t.querySelectorAll('.sp-card-footer button')].map((b) => b.getAttribute('aria-label')), titol)
      .toEqual([`Traduir ${titol}`, `Comentar ${titol}`, `Compartir ${titol}`, `Connectar amb ${titol}`]);
  }
  // Tota la targeta porta a la pàgina pròpia de la xifra; l'autor, al seu perfil (Onada 8; abans, /projecte).
  expect([...xifres.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href')))
    .toEqual(SLUGS.map((slug) => `/consola/xifres/${slug}`));
  expect([...xifres.querySelectorAll('a.sp-card-author-link')].map((a) => a.getAttribute('href'))).toEqual(Array(10).fill(RUTA_PERFIL_PROJECTE));
  expect(targetes.some((t) => t.classList.contains('sdp-consola__quieta'))).toBe(false);
  // Cap peça del tauler sense boina.
  expect([...document.querySelectorAll('main article.sp-card')].filter((t) => !t.querySelector(':scope > .sp-card-header'))).toEqual([]);
});

test('261004 · El Mas en xifres: les anomalies del Mapa amb mesura (LEDGER, torns, segell, alts, fantasmes)', async () => {
  const metrica = (nom, extra) => ({ metrica: nom, unitat: 'fraccio', numerador: null, denominador: null, font: 'x', prova: 'p', ...extra });
  fonts.mapa = {
    ...MAPA,
    nodes: [...MAPA.nodes, { id: 'skill:perduda', tipus: 'skill', font: null, atributs: {} }],
    avisos: [...MAPA.avisos,
      { node: 'skill:perduda', codi: 'skill-fantasma', severitat: 'alta', evidencia: 'disc' },
      { node: 'skill:sdp-workflow', codi: 'segell-divergent', severitat: 'alta', evidencia: '.agents/SKILLS_SEAL.json' }],
    salut: [
      metrica('ledger-fossils', { valor: 8, unitat: 'segells fòssils' }),
      metrica('ledger-mal-formades', { valor: 2, unitat: 'línies mal formades' }),
      metrica('torns-caducats-oberts', { valor: 0.878, numerador: 166, denominador: 189 }),
      metrica('segell-skills-coherent', { valor: 0.833, numerador: 25, denominador: 30 })
    ]
  };
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');
  const xifres = screen.getByRole('region', { name: 'El Mas en xifres' });
  const perTitol = Object.fromEntries([...xifres.querySelectorAll('article')].map((t) => [
    t.querySelector('h3').textContent, t.querySelector('h4').textContent]));
  expect(perTitol).toMatchObject({
    '2 avisos alts': 'Severitat alta: cal actuar',
    '10 línies del LEDGER per revisar': '8 segells fòssils · 2 línies mal formades',
    '166 torns caducats': 'Oberts i sense tancar',
    '5 skills fora del segell': 'O divergents (només els SKILL.md)',
    // Correcció 261004 (verificador de la tercera passada, punt 2) · derogat «1 skill fantasma: nomenades».
    '1 skill òrfena': '1 skill fantasma: nomenada i sense carpeta al disc'
  });
  // Cada una porta a la seua pàgina pròpia, amb un slug que no depén de la xifra.
  expect(Object.fromEntries([...xifres.querySelectorAll('article')].map((t) => [
    t.querySelector('h3').textContent, t.querySelector('a.sp-card-link-overlay').getAttribute('href')]))).toMatchObject({
    '166 torns caducats': '/consola/xifres/torns-caducats',
    '10 línies del LEDGER per revisar': '/consola/xifres/linies-ledger',
    '5 skills fora del segell': '/consola/xifres/skills-fora-del-segell'
  });
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
  // Correcció 261004 (verificador de la segona passada, punt 3) · cada mètrica concorda.
  expect(perTargeta['Calendari de processos']).toEqual(['1 tasca', '1 viva', '0 mortes']);
  // Correcció 261004 (verificador de la tercera passada, punt 5) · derogat «0 mètriques», sense targeta.
  expect(perTargeta['Avisos i salut']).toEqual(['1 avís (0 alts)', '0 mètriques de salut amb mesura']);
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

/* Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada panell del pols és
   una targeta sencera que porta a la seua pàgina pròpia, /consola/pols/<id>
   (ConsolaSection.pols.test.jsx), també sense font: mai una targeta quieta
   sense peu. Derogat per l'ordre del Mestre del 261004 (xat: cap xifra
   solta): el detall en un <details> davall de la graella que la targeta
   obria, i la Càrrega documental quieta (sense botó, peu ni aparença de
   clicable) quan no hi havia termometria. */
test('/consola/pols: tres targetes amb boina, cada una porta a la pàgina del seu panell; cap desplegable', async () => {
  ruta.comodi = 'pols';
  fonts.consola = {
    generat: '2026-09-25T13:00:00.000Z',
    rebuts: [], consums: [{ agent: 'claude', entrada: 10, eixida: 5 }],
    skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
    segell: null, immunitari: { operacions: 3 }
  };
  render(<ConsolaSection />);
  await screen.findByText('0 rebuts de lectura');

  capXifraSolta();
  const graella = document.querySelector('.sdp-card-grid');
  const resums = targetesExplicatives(graella);
  expect(resums.map((t) => t.querySelector('h3').textContent)).toEqual(['Càrrega documental', 'Rebuts', 'Skills']);
  // T51 · la instantània (més recent que el copy), en ISO local, a la pastilla de la boina.
  expect(datesDeLaBoina(resums[1])[0].getAttribute('datetime'))
    .toBe(dataHoraDeBarra({ modificat: '2026-09-25T13:00:00.000Z' }).dateTime);
  // Totes porten a la seua pàgina, també la Càrrega sense font, amb el peu canònic.
  expect([...graella.querySelectorAll('a.sp-card-link-overlay')].map((a) => a.getAttribute('href')))
    .toEqual(['carrega', 'rebuts', 'skills'].map((id) => `/consola/pols/${id}`));
  expect(resums.every((t) => t.querySelector('.sp-card-footer .sp-card-connect'))).toBe(true);
  expect(resums[0].querySelector('.sdp-consola__dada').textContent).toMatch(/^Recompte d’artefactes actius encara no disponible/);
  // Onada 6 · les skills de consola.json es poden jutjar (verd); els rebuts sense cap rebut datat, no.
  expect(etiquetesPerTargeta(graella)).toEqual({
    'Càrrega documental': ['Sense font:neutre'], Rebuts: [], Skills: ['En ordre:exit']
  });
  // Cap desplegable ni cap botó que n'obriga: el detall és la pàgina del panell.
  expect(document.querySelector('details, [aria-controls^="pols-"]')).toBeNull();
});

test('/consola/pols sense consola.json: les tres targetes continuen completes, amb peu, i porten a la seua pàgina', async () => {
  ruta.comodi = 'pols';
  render(<ConsolaSection />);
  await screen.findByText('Consola no disponible');
  const graella = document.querySelector('.sdp-card-grid');
  const resums = targetesExplicatives(graella);
  expect(resums).toHaveLength(3);
  expect(resums.every((t) => esClicable(t) && t.querySelector('.sp-card-footer .sp-card-connect'))).toBe(true);
  capXifraSolta();
});

test('/consola/pols: una skill fora del manifest pinta «Cal reparar» a la seua targeta', async () => {
  ruta.comodi = 'pols';
  fonts.consola = {
    generat: null, rebuts: [], consums: [],
    skills: [{ nom: 'nova', estat: null, descripcio: '', core: false, alDisc: true, alManifest: false }],
    segell: null, immunitari: { operacions: 0 }
  };
  render(<ConsolaSection />);
  // T2 · la targeta Skills porta tres mètriques en h5. Ordre del Mestre,
  // 261004 · sense «orfes» ni «fantasmes», que són paraules del Mapa.
  await screen.findByText('1 fora del manifest');
  const skills = [...document.querySelectorAll('.sdp-card-grid article.sp-card')]
    .find((t) => t.querySelector('h3').textContent === 'Skills');
  expect([...skills.querySelectorAll('h5.sdp-consola__metrica')].map((h) => h.textContent))
    .toEqual(['1 skill', '1 fora del manifest', '0 sense disc']);
  expect(etiquetesPerTargeta(document.querySelector('.sdp-card-grid'))).toEqual({
    'Càrrega documental': ['Sense font:neutre'], Rebuts: [], Skills: ['Cal reparar:error']
  });
});

test('/consola/pols: les mètriques dels tres panells són h5; sense mesura, el paràgraf diu per què', async () => {
  ruta.comodi = 'pols';
  fonts.consola = AMB_REBUT();
  render(<ConsolaSection />);
  await screen.findByText('1 rebut de lectura');
  const graella = document.querySelector('.sdp-card-grid');
  const perTargeta = Object.fromEntries([...graella.querySelectorAll('article.sp-card')].map((t) => [
    t.querySelector('h3').textContent,
    [...t.querySelectorAll('h5.sdp-consola__metrica')].map((h) => h.textContent)
  ]));
  // Correcció 261004 (verificador de la segona passada, punt 3) · cada mètrica concorda.
  expect(perTargeta).toEqual({
    'Càrrega documental': ['162 artefactes actius', 'avís per damunt de 150'],
    Rebuts: ['1 rebut de lectura'],
    Skills: ['1 skill', '0 fora del manifest', '0 sense disc']
  });
  // Sense el diari de sessió, Rebuts no té cap mesura: cap h5, i el paràgraf diu per què.
  cleanup();
  fonts.consola = { ...AMB_REBUT(), fonts: { diari: { estat: 'absent' } } };
  render(<ConsolaSection />);
  const dada = await screen.findByText('Sense mesura: el diari de sessió no es pot llegir');
  expect(dada.className).toBe('sdp-consola__dada');
  const rebuts = [...document.querySelector('.sdp-card-grid').querySelectorAll('article.sp-card')]
    .find((t) => t.querySelector('h3').textContent === 'Rebuts');
  expect(rebuts.contains(dada)).toBe(true);
  expect(rebuts.querySelector('h5')).toBeNull();
});

const AMB_REBUT = () => ({
  generat: '2026-09-25T13:00:00.000Z',
  rebuts: [{ t: '2026-09-20T01:03:39.000Z', peticio: 'ced19fcaab00ffff', protocols: ['_wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md'],
    fonts: [{ ruta: '.agents/BOOTSTRAP.md', sha256: 'eb1c1b03a1400000' }] }],
  consums: [],
  skills: [{ nom: 'sdp-workflow', estat: 'canonic', descripcio: 'x', core: true, alDisc: true, alManifest: true }],
  segell: null, immunitari: { operacions: 3 },
  termometria: { artefactesActius: 162, abast: 'Escriptori i actes vives' }
});

/* Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): Crèdits,
   Rebuts amb «Veure fonts» i la Càrrega obrint el seu desplegable des del peu
   blau, i la privacitat del peu dins del desplegable de Rebuts. Ara cada
   panell té pàgina pròpia: les mateixes comprovacions viuen, amb el router
   de veres, a ConsolaSection.pols.test.jsx. */

test('/consola/pols: la privacitat del peu es recorda en la visita següent', async () => {
  ruta.comodi = 'pols';
  fonts.consola = AMB_REBUT();
  const { unmount } = render(<ConsolaSection />);
  await screen.findByText('1 rebut de lectura');
  fireEvent.click(within(document.querySelector('.sdp-consola__peu')).getByRole('switch'));
  // Una altra visita arrenca amb la privacitat activa.
  unmount();
  render(<ConsolaSection />);
  await screen.findByText('1 rebut de lectura');
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

/* El detall de Rebuts (quan va entrar l'últim) és ara a la pàgina del
   panell: ConsolaSection.pols.test.jsx. */

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
  // Onada 6 (semàfor) · amb un rebut datat i fresc, el verd.
  expect(etiquetaRebuts()).toEqual(['En ordre:exit']);
});

/* Correcció 261004 (verificador de la segona passada, punt 2) · El recompte
   d'operacions immunitàries (T12: amb la data de l'última si consola.json la
   porta) és una targeta del pols amb pàgina pròpia. Derogat per l'ordre del
   Mestre del 261004 (xat: cap xifra solta): «el peu data l'última operació
   immunitària» (el recompte, solt, al peu de totes les pàgines del pols). */
const xifraDelPols = (slug) => document.querySelector(`a.sp-card-link-overlay[href="/consola/xifres/${slug}"]`)?.closest('article') ?? null;
const titolISubtitol = (targeta) => [targeta.querySelector('h3').textContent, targeta.querySelector('h4').textContent];

test('/consola/pols: les operacions immunitàries són una targeta amb la data de l’última; si no la porta, no n’inventa', async () => {
  ruta.comodi = 'pols';
  const data = '2026-08-03T13:43:04.716Z';
  fonts.consola = { ...AMB_REBUT(), immunitari: { operacions: 15, ultima: { op: 'OP-015', tipus: 'DESTRUEIX', data } } };
  const { unmount } = render(<ConsolaSection />);
  await screen.findByText('1 rebut de lectura');
  const estat = () => document.querySelector('.sdp-consola__peu [role="status"]').textContent;
  expect(estat()).toBe(`Instantània: ${new Date(AMB_REBUT().generat).toLocaleString('ca-ES')}`);
  expect(titolISubtitol(xifraDelPols('operacions-immunitaries')))
    .toEqual(['15 operacions immunitàries', `L’última, el ${new Date(data).toLocaleString('ca-ES')}`]);
  unmount();
  fonts.consola = { ...AMB_REBUT(), immunitari: { operacions: 1, ultima: null } };
  render(<ConsolaSection />);
  await screen.findByText('1 rebut de lectura');
  expect(estat()).toBe(`Instantània: ${new Date(AMB_REBUT().generat).toLocaleString('ca-ES')}`);
  expect(titolISubtitol(xifraDelPols('operacions-immunitaries'))).toEqual(['1 operació immunitària', 'Sense data de l’última']);
});

/* Ordre del Mestre, 261004 (cap anomalia sense mostrar) · consola.json porta
   les línies que el middleware no ha pogut llegir: el pols les diu sempre i,
   si n'hi ha, avisa. Correcció 261004 (verificador de la segona passada,
   punt 2) · el recompte és una targeta, i l'avís hi enllaça. Derogat per
   l'ordre del Mestre del 261004 (xat: cap xifra solta): la línia «Línies
   descartades: …» (sdp-consola__segell). */
test('261004 · /consola/pols: les línies descartades del diari i del journal són una targeta, també a zero', async () => {
  ruta.comodi = 'pols';
  const ambFonts = (diari, immunitari) => ({ ...AMB_REBUT(), fonts: {
    diari: { estat: 'ok', 'línies_descartades': diari, h: 1 }, immunitari: { estat: 'ok', 'línies_descartades': immunitari, h: 1 }
  } });
  fonts.consola = ambFonts(0, 0);
  const { unmount } = render(<ConsolaSection />);
  await screen.findByText('1 rebut de lectura');
  expect(titolISubtitol(xifraDelPols('linies-descartades'))).toEqual(['0 línies descartades', 'Diari de sessió: 0 · journal immunitari: 0']);
  expect(screen.queryByText('Hi ha línies que no es poden llegir')).toBeNull();
  expect(document.querySelector('.sdp-consola__segell')).toBeNull();
  unmount();
  fonts.consola = ambFonts(3, 1);
  render(<ConsolaSection />);
  await screen.findByText('1 rebut de lectura');
  expect(titolISubtitol(xifraDelPols('linies-descartades'))).toEqual(['4 línies descartades', 'Diari de sessió: 3 · journal immunitari: 1']);
  const avis = screen.getByText('Hi ha línies que no es poden llegir').closest('.sdp-alerta');
  expect(avis.className).toBe('sdp-alerta sdp-alerta--avis');
  expect(avis.textContent).toContain('4 línies del diari o del journal no són JSON vàlid');
  expect([...avis.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href')]))
    .toEqual([['4 línies descartades', '/consola/xifres/linies-descartades']]);
  // El peu de dades continua sent l'últim element de la pàgina.
  expect([...document.querySelector('main').children].filter((el) => el.tagName !== 'DIALOG').at(-1).className).toBe('sdp-consola__peu');
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
  /* Correcció 261004 (verificador de la segona passada, punt 2) · l'evidència
     porta recomptes que resumixen una xifra amb targeta: cada avís enllaça amb
     la seua (el segell, amb «skills fora del segell»; el LEDGER, amb «línies
     del LEDGER»), pel títol de la targeta. Derogat per l'ordre del Mestre del
     261004 (xat: cap xifra solta): «sense porta pròpia: a Avisos i salut
     s'entra per la seua targeta». */
  /* Onada 6 (contradiccions) · La frase del LEDGER ja no en fa la causa els
     fòssils ni les línies mal formades (es compten a part i poden ser zero), i
     la seua xifra ho diu: «LEDGER amb la signatura trencada», no «0 línies
     del LEDGER per revisar». Derogat: «té segells fòssils o línies mal formades».
     Correcció de l'Onada 6 (revisió adversarial) · i diu les dues causes de
     l'evidència: editat sense tornar-lo a segellar, o sense segell. */
  const FRASE_LEDGER = 'La signatura del LEDGER no és vàlida: el cos del Llibre d’Obra no quadra amb el seu segell (s’ha editat sense tornar-lo a segellar) o li falta el segell. Els segells fòssils i les línies mal formades es compten a part.';
  expect([...alerta.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
    `El segell no quadra amb el disc: hi ha skills fora del segell o divergents, i cal reconciliar-lo abans de confiar en cap empremta. On: .agents/SKILLS_SEAL.json · Evidència: ${EVIDENCIA_SEGELL} · La seua xifra: Segell sense mesura`,
    `${FRASE_LEDGER} On: .agents/LEDGER.md · Evidència: ${EVIDENCIA_LEDGER} · La seua xifra: LEDGER amb la signatura trencada`,
    `${FRASE_LEDGER} On: .agents/LEDGER.md · La seua xifra: LEDGER amb la signatura trencada`
  ]);
  // La ruta va en tipografia de màquina.
  expect([...alerta.querySelectorAll('li > code.sdp-consola__mono')].map((c) => c.textContent))
    .toEqual(['.agents/SKILLS_SEAL.json', '.agents/LEDGER.md', '.agents/LEDGER.md']);
  expect(alerta.textContent).toContain('El detall i què cal reparar són a la pàgina Avisos i salut.');
  expect([...alerta.querySelectorAll('li > a')].map((a) => a.getAttribute('href'))).toEqual([
    '/consola/xifres/skills-fora-del-segell', '/consola/xifres/linies-ledger', '/consola/xifres/linies-ledger'
  ]);
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

/* T9 (260930) · les taules del pols no porten límit d'alçada propi: ara són
   a les pàgines dels panells (ConsolaSection.pols.test.jsx). */

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
  // Ordre del Mestre, 261004 (xat: cap xifra solta) · cada targeta, amb boina i pàgina pròpia.
  capXifraSolta();
  const targetes = targetesExplicatives(document, { perA: false });
  expect(targetes.length).toBeGreaterThan(0);
  expect(targetes.every((t) => /^\/consola\/xifres\/[a-z0-9-]+$/.test(t.querySelector('a.sp-card-link-overlay').getAttribute('href')))).toBe(true);
});

/* Correcció 261004 (verificador, punt 1) · sense Mapa, les pàgines que
   compten xifres fixes les pinten igual, amb el seu nom: cap pàgina de xifra
   sense la seua targeta. Correcció 261004 (verificador de la segona passada,
   punt 1) · també l'Explorador, el Calendari i Actors, amb les xifres que es
   pinten sempre; les condicionals i les peces no es poden saber sense Mapa, i
   no tenen ni targeta ni pàgina (ConsolaSection.viceversa.test.jsx).
   Correcció 261004 (verificador de la tercera passada, punt 5) · i els
   recomptes que la coberta destaca: skills sense disparador, enllaços
   trencats, rutes documentals, agents atòmics, candats i llocs del sòl. */
test.each([
  ['inventari', ['Skills del cens', 'Skills sense cap avís', 'Skills amb avisos', 'Skills òrfenes', 'Skills fora d’algun cens',
    'Skills sense disparador útil']],
  ['fluxos', ['Cadenes declarades', 'Suggeriments de la prosa', 'Punts de trobada', 'Llocs sense lector']],
  ['entrades', ['Skills del cens', 'Skills opaques', 'Rutes documentals']],
  ['agents', ['Agents atòmics', 'Fluxos de treball', 'Tauler', 'Agents que treballen sols', 'Qui avisa quan algo es trenca']],
  ['salut', ['Avisos del Mapa', 'Avisos alts', 'Mètriques de salut amb mesura', 'Línies del LEDGER', 'Torns caducats',
    'Skills fora del segell', 'Tasques del Mapa']],
  ['explorador', ['Nodes del Mapa', 'Arestes del Mapa', 'Enllaços trencats i peces òrfenes']],
  ['calendari', ['Coses que corren soles']],
  ['actors', ['Agents', 'Candats', 'Llocs del sòl']]
])('/consola/%s sense Mapa: les seues xifres continuen sent targetes, amb el nom', async (id, titols) => {
  ruta.comodi = id;
  render(<ConsolaSection />);
  await screen.findByText('Instantània encara no disponible.');
  expect(screen.getAllByText('Mapa no disponible')).toHaveLength(1);
  const targetes = targetesExplicatives(document, { perA: false });
  expect(targetes.map((t) => t.querySelector('h3').textContent)).toEqual(titols);
  capXifraSolta();
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
  // Onada 6 (requisit 10) · un desplegable més, el primer: els avisos agrupats per causa arrel.
  expect(detalls.map((d) => d.className)).toEqual(Array(6).fill('sdp-consola__detall'));
  /* Correcció 261004 (verificador de la segona passada, punt 2) · cap
     recompte al títol del desplegable: la xifra és a la seua targeta.
     Derogat per l'ordre del Mestre del 261004 (xat: cap xifra solta): «Veure
     els 1 avisos». */
  expect(detalls[0].querySelector('summary').textContent).toBe('Veure els avisos agrupats per causa arrel');
  expect(detalls[1].querySelector('summary').textContent).toBe('Veure els avisos, el més greu primer');
  expect(detalls.every((d) => d.querySelector('summary > svg[aria-hidden="true"]'))).toBe(true);
});

test('una subruta desconeguda torna al tauler', () => {
  ruta.comodi = 'pestanyes';
  render(<ConsolaSection />);
  expect(screen.getByTestId('redirigix').textContent).toBe('/consola');
});
