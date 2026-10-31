/* QA-A01b (Gauntlet 261029, cicle 1) · L'eixida de la sessió amb el Gestor
   d'arxius locals muntat a /multimedia, en l'ORDRE REAL de l'eixida de veres:
   currentUser passa a null dins de tanca() (auth.js: esborraSessio i
   emetCanvi(null)), tanca() encara espera la revocació, i només després
   DESPRES_DE_TANCAR crida oblidaTotesLesCarpetesLocals. La biblioteca de
   veres (bibliotecaCarpetesLocals.js) sobre l'IndexedDB fals estricte
   (tests/helpers/idbFalsEstructurat.js), la secció de veres i el doble únic
   de carpeta local.
     · amb la sessió a null i la biblioteca encara plena, una lectura no torna
       a posar el volum de qui ix a la Barra; amb l'avís de l'oblit, cap volum
       ni cap blob: viu, i la portada;
     · un volum que una altra pestanya ja ha oblidat (sense avís) no s'obri
       d'un clic: es lleva de la Barra;
     · la lectura del muntatge que arriba després de l'oblit no hi escriu;
     · una renovació fallida (abast 'pestanya': null sense oblit) no és eixir:
       el text sense desar i la carpeta oberta es queden;
     · una persona diferent (X → Y) sí que invalida el gestor. */
import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext.jsx';
import { arbreMultimedia, clonaAmbHandles } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
import { creaBibliotecaCarpetesLocals, oblidaTotesLesCarpetesLocals } from './bibliotecaCarpetesLocals.js';
import { agrupaPerMes } from './cronologia.js';
import { delEfimer } from '../../config/storage.js';

const mocks = vi.hoisted(() => ({ multimedia: null, cens: null, sessio: null }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => (
    <article data-pagina="">
      <header className="page-title"><h1>{props.title}</h1></header>
      {props.subtitle ? <h2>{props.subtitle}</h2> : null}
      {props.children}
    </article>
  )
}));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => mocks.cens }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../app/contexts/SessionContext', async (original) => ({ ...(await original()), useSessioOpcional: () => mocks.sessio }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
import MultimediaSection from './MultimediaSection.jsx';

const MITJANS = [{ id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', created_at: '2026-08-16T08:00:00.000Z' }];

let ubicacio = null;
function Sonda() {
  ubicacio = useLocation();
  return null;
}

let creades = [];
let revocades = [];
let errors = null;
beforeEach(() => {
  mocks.multimedia = { status: 'ready', mediaItems: MITJANS, mediaTimelineGroups: agrupaPerMes(MITJANS) };
  mocks.cens = { mitjans: [], cens: new Map(), llest: true };
  mocks.sessio = { currentUser: { id: 'u-1' } };
  creades = [];
  revocades = [];
  delEfimer('mestre-detall:multimedia');
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
    const url = `blob:prova/${creades.length + 1}`;
    creades.push(url);
    return url;
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => { revocades.push(url); });
  errors = vi.spyOn(console, 'error');
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const entorn = () => ({ showDirectoryPicker: vi.fn(), addEventListener: window.addEventListener.bind(window), removeEventListener: window.removeEventListener.bind(window) });
const arbre = () => within(document.querySelector('#app-grid-sidebar'));
const detall = () => within(document.querySelector('#app-grid-main'));
const llista = () => within(document.querySelector('#app-grid-list'));
/* Els botons de volum de la Barra «Volums i carpetes locals» (no els de les píndoles de filtres). */
const volumsALaBarra = () => {
  const titol = [...document.querySelectorAll('#app-grid-main h3')].find((h) => h.textContent === 'Volums i carpetes locals');
  return titol ? [...titol.closest('section').querySelectorAll('[role=group] button')].map((boto) => boto.textContent) : [];
};
const blobsVius = () => [...document.querySelectorAll('img')].map((img) => img.getAttribute('src')).filter((src) => src?.startsWith('blob:'));
const espera = (ms) => act(async () => { await new Promise((resol) => setTimeout(resol, ms)); });

/* La biblioteca de veres amb una carpeta recordada, sobre un IndexedDB fals estricte. */
async function bibliotecaAmb(dir) {
  const idb = creaIdbFalsEstructurat({ clona: clonaAmbHandles });
  const bib = creaBibliotecaCarpetesLocals({ idb });
  const desat = await bib.desa(dir);
  expect(desat.ok).toBe(true);
  return { idb, bib };
}

function munta(props) {
  const finestra = entorn();
  /* Un element nou a cada pintat: amb el mateix, React no tornaria a pintar res. */
  const arbreReact = () => (
    <MemoryRouter rutaInicial="/multimedia">
      <MultimediaSection entorn={finestra} {...props} />
      <Sonda />
    </MemoryRouter>
  );
  const vista = render(arbreReact());
  return {
    ...vista,
    /* La sessió canvia (SessionContext torna a pintar el que està muntat). */
    sessio: (currentUser) => {
      mocks.sessio = { currentUser };
      vista.rerender(arbreReact());
    }
  };
}

async function aInbox() {
  fireEvent.click(await arbre().findByRole('button', { name: 'Carpeta local · Volums muntats' }));
  fireEvent.click(await arbre().findByRole('button', { name: '00_inbox' }));
  await waitFor(() => expect(llista().getByRole('button', { name: (n) => n.startsWith('nota.md') })).toBeTruthy());
}

describe('QA-A01b · l’eixida de veres, en l’ordre real', () => {
  test('null amb la biblioteca encara plena, i després l’oblit: cap volum a la Barra, cap blob: viu, la portada', async () => {
    const dir = arbreMultimedia();
    const { idb, bib } = await bibliotecaAmb(dir);
    const vista = munta({ magatzemCarpetes: bib });
    await aInbox();
    await waitFor(() => expect(volumsALaBarra()).toEqual(['_multimedia_de_poble']));
    await waitFor(() => expect(blobsVius().length).toBeGreaterThan(0));

    /* 1. tanca(): la sessió passa a null; la revocació encara s'espera i la biblioteca és plena. */
    vista.sessio(null);
    await espera(40);
    /* 2. DESPRES_DE_TANCAR: l'oblit de veres (buida l'IndexedDB i avisa). */
    await act(async () => { await oblidaTotesLesCarpetesLocals({ idb }); });
    await espera(40);

    expect(await bib.llista()).toEqual([]);
    expect(volumsALaBarra()).toEqual([]);
    expect(blobsVius()).toEqual([]);
    expect(new Set(revocades)).toEqual(new Set(creades));
    expect(ubicacio.search).toBe('');
    expect(arbre().queryByRole('button', { name: '00_inbox' })).toBeNull();
    expect(detall().getByRole('heading', { level: 1, name: 'Arxiu visual' })).toBeTruthy();
    expect(errors).not.toHaveBeenCalled();
  });

  test('un volum que una altra pestanya ja ha oblidat (sense avís) no s’obri d’un clic: es lleva de la Barra', async () => {
    /* Permís 'prompt' en muntar (no s'obri sol) i 'granted' si es demana: el clic l'obriria. */
    const dir = arbreMultimedia({ permisos: { read: 'prompt', readwrite: 'prompt' } });
    const { bib } = await bibliotecaAmb(dir);
    munta({ magatzemCarpetes: bib });
    fireEvent.click(await arbre().findByRole('button', { name: 'Carpeta local · Volums muntats' }));
    await waitFor(() => expect(volumsALaBarra()).toEqual(['_multimedia_de_poble']));
    /* L'altra pestanya buida la mateixa base (sense BroadcastChannel ací: cap avís). */
    await bib.oblidaTotes();
    const pindola = detall().getByRole('button', { name: '_multimedia_de_poble' });
    await act(async () => { pindola.click(); });
    await espera(40);
    expect(volumsALaBarra()).toEqual([]);
    expect(arbre().queryByRole('button', { name: '00_inbox' })).toBeNull();
    expect(dir.registre.some(([op]) => op === 'entries')).toBe(false);
  });

  test('la lectura del muntatge que arriba després de l’oblit no torna a posar cap volum', async () => {
    const dir = arbreMultimedia({ permisos: { read: 'prompt', readwrite: 'prompt' } });
    const { idb, bib } = await bibliotecaAmb(dir);
    let deixaLlegir;
    const porta = new Promise((resol) => { deixaLlegir = resol; });
    const lenta = { ...bib, llista: async () => { const llista = await bib.llista(); await porta; return llista; } };
    munta({ magatzemCarpetes: lenta });
    fireEvent.click(await arbre().findByRole('button', { name: 'Carpeta local · Volums muntats' }));
    /* L'eixida acaba mentre la lectura del muntatge encara és en curs. */
    await act(async () => { await oblidaTotesLesCarpetesLocals({ idb }); });
    deixaLlegir();
    await espera(40);
    expect(volumsALaBarra()).toEqual([]);
  });
});

describe('una renovació fallida (abast «pestanya») no és eixir', () => {
  test('currentUser a null sense oblit: el text sense desar, l’editor i la carpeta oberta es queden', async () => {
    const dir = arbreMultimedia();
    const { bib } = await bibliotecaAmb(dir);
    const vista = munta({ magatzemCarpetes: bib });
    await aInbox();
    act(() => llista().getByRole('button', { name: (n) => n.startsWith('nota.md') }).click());
    const area = await waitFor(() => {
      const node = document.querySelector('#app-grid-main textarea');
      expect(node?.value).toContain('Hola, poble.');
      return node;
    });
    fireEvent.change(area, { target: { value: 'Canvi sense desar important' } });
    const abans = ubicacio.search;
    vista.sessio(null);
    await espera(60);
    expect(document.querySelector('#app-grid-main textarea')?.value).toBe('Canvi sense desar important');
    expect(ubicacio.search).toBe(abans);
    expect(detall().getByRole('heading', { level: 1, name: 'nota.md' })).toBeTruthy();
    /* La mateixa persona torna: res no canvia. */
    vista.sessio({ id: 'u-1' });
    await espera(20);
    expect(document.querySelector('#app-grid-main textarea')?.value).toBe('Canvi sense desar important');
  });

  test('una persona diferent (X → null → Y, sense eixida) sí que invalida el gestor', async () => {
    const dir = arbreMultimedia();
    const { bib } = await bibliotecaAmb(dir);
    const vista = munta({ magatzemCarpetes: bib });
    await aInbox();
    vista.sessio(null);
    await espera(20);
    expect(arbre().getByRole('button', { name: '00_inbox' })).toBeTruthy();
    vista.sessio({ id: 'u-2' });
    await waitFor(() => expect(ubicacio.search).toBe(''));
    expect(arbre().queryByRole('button', { name: '00_inbox' })).toBeNull();
    expect(blobsVius()).toEqual([]);
  });
});
