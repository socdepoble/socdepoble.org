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

afterEach(() => { cleanup(); ruta.comodi = ''; fonts.mapa = null; fonts.consola = null; });

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

/** La targeta de resum és la del Panell de Control: «action», 40 px i dins de .sdp-card-grid. */
function targetesDeControl(contenidor = document) {
  const targetes = [...contenidor.querySelectorAll('article.sp-card')];
  for (const t of targetes) {
    expect(t.className).toBe('sp-card sp-card--action');
    expect(t.parentElement.classList.contains('sdp-card-grid')).toBe(true);
    expect(t.querySelector('.sp-card-title-icon svg').getAttribute('width')).toBe('40');
  }
  expect(document.querySelector('.sdp-consola__tauler, .sdp-consola__resum, .sdp-consola__xifra')).toBeNull();
  return targetes;
}

test('/consola: el tauler són nou targetes del Panell de Control, sense pestanyes', async () => {
  render(<ConsolaSection />);
  await screen.findByText('Dades no disponibles en este entorn');

  expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual(['Consola Termodinàmica']);
  expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Manteniment de la IAIA']);
  expect(document.querySelector('.page-intro h2 + p.lead')).not.toBeNull();
  expect(screen.queryByRole('tablist')).toBeNull();

  expect(targetesDeControl()).toHaveLength(9);
  const nav = screen.getByRole('navigation', { name: 'Pàgines de la Consola' });
  expect(nav.className).toBe('sdp-card-grid');
  expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(PAGINES.map((id) => `/consola/${id}`));
  // El resum de dades va de subtítol, com la descripció del Control; si falta, diu per què.
  expect(screen.getAllByText('Mapa no disponible en este entorn').map((h) => h.tagName)).toEqual(Array(8).fill('H4'));
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

  // Tota la pàgina usa la targeta del Control; la primera graella són els cinc resums.
  targetesDeControl();
  const resums = targetesDeControl(document.querySelector('.sdp-card-grid'));
  expect(resums.map((t) => t.querySelector('h3').textContent)).toEqual(['Càrrega documental', 'Consums', 'Crèdits', 'Rebuts', 'Skills']);
  const detall = document.getElementById('pols-consums');
  expect(detall.tagName).toBe('DETAILS');
  expect(detall.open).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Consums' }));
  expect(detall.open).toBe(true);
});

test.each([
  ['fluxos', 'Fluxos de treball', 'Cap cadena declarada'],
  ['agents', 'Agents atòmics', 'Agents atòmics al Mas: cap'],
  ['actors', 'Actors del Mas', 'Els que conversen']
])('/consola/%s: vista nova del Mapa', async (id, titol, text) => {
  ruta.comodi = id;
  fonts.mapa = MAPA;
  render(<ConsolaSection />);
  await screen.findByText('Instantània encara no disponible.');
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(titol);
  expect(screen.getByText(text)).toBeTruthy();
  targetesDeControl();
});

test('una subruta desconeguda torna al tauler', () => {
  ruta.comodi = 'pestanyes';
  render(<ConsolaSection />);
  expect(screen.getByTestId('redirigix').textContent).toBe('/consola');
});
