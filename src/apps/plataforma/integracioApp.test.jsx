/* Plataforma d'Apps Enxufables · les dues incisions a App.jsx, amb la closca
   real (PedraSecaEmbed): la ruta /app/* abans de "/*" i el relleu de la barra
   lateral (més el títol del calaix en compacte). Les apps són les del paquet:
   la prova tria la primera interna que s'obri en desenvolupament sense
   backend especial, de manera que continue valent quan els lots BAR i SALUT
   substituïsquen els manifests provisionals. */
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PedraSecaEmbed from '../../PedraSecaEmbed';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { getSessionState } from '../../data/sessionService.js';
import { DEFAULT_SECTION_PATH } from '../../config/sections';
import { manifestExternDeProva } from './__fixtures__/manifests.js';
import { APPS_INTERNES, registraAppExterna, retiraAppExterna } from './registreApps.js';
import { titolDe } from './manifestApp.js';

vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../../sections/notes/GlobalSaveManager.js', async (importOriginal) => ({
  ...await importOriginal(),
  getDraftsForScope: async () => ({})
}));

const APP = APPS_INTERNES.find((app) => app.dadesPersonals !== 'salut' && app.capacitats.length === 0 && typeof app.carrega === 'function');

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function munta(ruta, cos, ample = 1024) {
  vi.stubGlobal('innerWidth', ample);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })));
  vi.stubGlobal('fetch', vi.fn(async (url) => { throw new Error('Xarxa inesperada: ' + url); }));
  const anterior = { ...getBackendImplementation() };
  setBackendImplementation({
    ...Object.fromEntries(CONTRACTE_NUCLI.map((name) => [name, async () => null])),
    getCurrentUser: () => null,
    getRuntimeDataMode: () => 'local',
    getBackendConfigurat: () => true,
    getDefaultUserId: () => null,
    recullTornadaOAuth: async () => null,
    loadCoreContent: async () => ({ towns: [], pages: [], agents: [] }),
    loadMur: async () => ({ feedPosts: [], events: [], marketItems: [] }),
    loadNotes: async () => ({ notes: [], noteFolders: [] }),
    loadMultimedia: async () => ({ mediaItems: [], mediaTimelineGroups: [] }),
    loadFils: async () => []
  });
  window.history.replaceState(null, '', ruta);
  try {
    render(<PedraSecaEmbed config={{ routerType: 'browser' }} />);
    await waitFor(() => expect(getSessionState().estat).toBe('fora'));
    await cos();
  } finally {
    cleanup();
    if (Object.keys(anterior).length) setBackendImplementation(anterior);
  }
}

const principal = () => screen.findByRole('navigation', { name: 'Navegació principal' });
const actius = (nav) => [...nav.querySelectorAll('[aria-current]')].map((el) => el.getAttribute('href') ?? el.getAttribute('aria-label'));

test('hi ha una app interna que es pot provar sencera', () => {
  expect(APP, 'cap app interna s’obri sense capacitats en desenvolupament').toBeTruthy();
});

test('/app/<id> es canonitza, munta l’app i relleva la barra lateral (un sol aria-current)', async () => {
  const entrada = `/app/${APP.id}/${APP.entradaPerDefecte}`;
  await munta(`/app/${APP.id}`, async () => {
    await waitFor(() => expect(window.location.pathname).toBe(entrada));
    const nav = await principal();
    await waitFor(() => expect(within(nav).getByRole('button', { name: 'Torna a Sóc de Poble' })).toBeTruthy());
    expect(within(nav).queryByRole('button', { name: 'Panell de control' })).toBeNull();
    expect(actius(nav)).toEqual([entrada]);
    await waitFor(() => expect(document.querySelector(`.sdp-app-contenidor[data-sdp-app="${APP.id}"]`)).not.toBeNull());
    expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();

    /* La fletxa: entrada directa, cap ruta de Sóc de Poble recordada. */
    fireEvent.click(within(nav).getByRole('button', { name: 'Torna a Sóc de Poble' }));
    await waitFor(() => expect(window.location.pathname).toBe(DEFAULT_SECTION_PATH));
    await waitFor(() => expect(within(nav).getByRole('button', { name: 'Panell de control' })).toBeTruthy());
    expect(within(nav).queryByRole('button', { name: 'Torna a Sóc de Poble' })).toBeNull();
  });
});

test('fora de /app la barra de Sóc de Poble és la de sempre', async () => {
  await munta('/mur', async () => {
    const nav = await principal();
    expect(within(nav).getByRole('button', { name: 'Panell de control' })).toBeTruthy();
    expect(within(nav).queryByRole('button', { name: 'Torna a Sóc de Poble' })).toBeNull();
    expect(nav.querySelector('.sdp-app-barra__titol')).toBeNull();
    expect(actius(nav)).toEqual(['/mur']);
    expect([...nav.querySelectorAll('a.nav-item')].slice(0, 4).map((a) => a.getAttribute('href'))).toEqual(['/xat', '/mur', '/mercat', '/pobles']);
  });
});

/* P1-R5 · La forma d'un node del crom de la barra: etiqueta, atributs i fills.
   No compten els noms accessibles (cada barra diu el seu), l'estat actiu ni la
   icona concreta: el dibuix de dins de l'svg i les classes de la llibreria
   (lucide, lucide-*). La roda de CONTROL ve d'icons.jsx i la fletxa, de
   lucide-react; cap full de src/css dona regla a .lucide. */
const esClasseDIcona = (classe) => classe === 'lucide' || classe.startsWith('lucide-');
function forma(el) {
  const atributs = [...el.attributes]
    .filter((a) => a.name !== 'aria-label' && a.name !== 'aria-current')
    .map((a) => [a.name, a.name === 'class' ? a.value.split(/\s+/).filter((c) => c && !esClasseDIcona(c)).join(' ') : a.value])
    .sort(([a], [b]) => a.localeCompare(b));
  const fills = el.tagName.toLowerCase() === 'svg' ? [] : [...el.children].map(forma);
  return { etiqueta: el.tagName.toLowerCase(), atributs, fills };
}

/* El crom de dalt de la barra lateral (marca i fila de control), desplegada i plegada. */
async function cromDeLaBarra(nav) {
  const crom = () => [nav.querySelector('button.brand'), nav.querySelector('.sidebar-control-row')].map(forma);
  const desplegada = crom();
  fireEvent.click(within(nav).getByRole('button', { name: 'Plegar barra lateral' }));
  await waitFor(() => expect(within(nav).getByRole('button', { name: 'Desplegar barra lateral' })).toBeTruthy());
  const plegada = crom();
  fireEvent.click(within(nav).getByRole('button', { name: 'Desplegar barra lateral' }));
  return { desplegada, plegada };
}

test('paritat: la barra d’una app porta el mateix crom que la de Sóc de Poble (SidebarContent real)', async () => {
  let sdp = null;
  await munta('/mur', async () => {
    sdp = await cromDeLaBarra(await principal());
  });
  await munta(`/app/${APP.id}/${APP.entradaPerDefecte}`, async () => {
    const nav = await principal();
    await waitFor(() => expect(within(nav).getByRole('button', { name: 'Torna a Sóc de Poble' })).toBeTruthy());
    const app = await cromDeLaBarra(nav);
    expect(app.desplegada).toEqual(sdp.desplegada);
    expect(app.plegada).toEqual(sdp.plegada);
  });
});

test('el portal /app es pinta dins de la closca amb la barra de Sóc de Poble', async () => {
  await munta('/app', async () => {
    expect(await screen.findByRole('heading', { level: 1, name: 'Apps' })).toBeTruthy();
    const nav = await principal();
    expect(within(nav).getByRole('button', { name: 'Panell de control' })).toBeTruthy();
    for (const app of APPS_INTERNES) expect(screen.getByRole('heading', { level: 2, name: titolDe(app.titol) })).toBeTruthy();
  });
});

test('en compacte, el títol del calaix passa a ser el de l’app', async () => {
  await munta(`/app/${APP.id}/${APP.entradaPerDefecte}`, async () => {
    await waitFor(() => expect(document.querySelector('dialog.sdp-dialeg-sidebar')?.getAttribute('aria-label'))
      .toBe(`Menú ${titolDe(APP.titol)}`));
  }, 800);
  await munta('/mur', async () => {
    await waitFor(() => expect(document.querySelector('dialog.sdp-dialeg-sidebar')?.getAttribute('aria-label')).toBe('Menú Sóc de Poble'));
  }, 800);
});

test('una app externa es registra sense tocar el nucli; una entrada amb sessió porta a /registre', async () => {
  const manifest = manifestExternDeProva({
    id: 'reserves-integracio',
    entrades: [
      { slug: 'inici', titol: { ca: 'Inici' }, icona: 'LayoutGrid' },
      { slug: 'caixa', titol: { ca: 'Caixa' }, icona: 'Receipt', permis: 'sessio' }
    ]
  });
  expect(registraAppExterna(manifest).ok).toBe(true);
  try {
    await munta('/app/reserves-integracio/inici', async () => {
      const nav = await principal();
      await waitFor(() => expect(document.querySelector('sollutia-reserves')).not.toBeNull());
      expect(actius(nav)).toEqual(['/app/reserves-integracio/inici']);
      fireEvent.click(within(nav).getByRole('link', { name: 'Caixa' }));
      await waitFor(() => expect(window.location.pathname).toBe('/registre'));
      expect(new URLSearchParams(window.location.search).get('tornar')).toBe('/app/reserves-integracio/caixa');
    });
  } finally {
    retiraAppExterna('reserves-integracio');
  }
});
