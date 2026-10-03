/* MD (ordre del Mestre, 261003) · El Bloc de Notes en mòbil: patró
   mestre-detall, com WhatsApp. Amb l'espai de treball de veres, el router en
   memòria de veres i una Pàgina Universal de veres al detall (la barra blava
   i la seua fletxa ←):
     · /notes a 375 px: primer les CARPETES, mai l'editor d'entrada;
     · carpeta → NOTES → editor, una sola capa cada vegada;
     · la fletxa blava torna a NOTES (no a l'historial), amb el focus a la
       fitxa d'on es venia;
     · /notes?nota=… (un enllaç) obri l'editor directament;
     · a 1400 px, res no canvia.
   El treball de P4 (Nota sense títol, CREAR NOTA) té les seues proves.
   Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { NOTE_FOLDERS_SEED } from '../../data/appSeed.js';

const dades = vi.hoisted(() => ({ notes: [], buit: [] }));

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.buit, status: 'ready', canCreate: true, teSessio: true,
    notesComplete: true, config: { dataMode: 'remote' }, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: async (entrada) => entrada, setLocalNoteField: () => {}
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'remote' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
/* El detall: una Pàgina Universal de veres, amb la barra blava. */
vi.mock('./NotesDetail.jsx', async () => {
  const { UniversalPage } = await import('../../components/universal/UniversalPage.jsx');
  return { default: ({ activeNote }) => <UniversalPage chrome="context" title={activeNote?.title || 'cap'} /> };
});
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';

const NOTA = Object.freeze({ id: 'a1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' });
const MUR = NOTE_FOLDERS_SEED.find((carpeta) => carpeta.id === 'f-mur').name;

/* L'amplària de la closca i els fotogrames, a mà (jsdom no fa layout). */
let restaura = () => {};
function ambAmplada(amplada) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
  const rafAbans = globalThis.requestAnimationFrame;
  const observadorAbans = globalThis.ResizeObserver;
  const cua = [];
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => amplada });
  globalThis.requestAnimationFrame = (cb) => { cua.push(cb); return cua.length; };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  restaura = () => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, 'clientWidth', descriptor);
    else delete HTMLElement.prototype.clientWidth;
    globalThis.requestAnimationFrame = rafAbans;
    globalThis.ResizeObserver = observadorAbans;
  };
  return () => act(() => { while (cua.length) cua.shift()(0); });
}

/* La memòria del nivell (nivellMestreDetall.js) viu a la capa efímera: cada
   prova comença com una pestanya nova. */
beforeEach(() => { dades.notes = [NOTA]; sessionStorage.clear(); });
afterEach(() => {
  cleanup();
  restaura();
  restaura = () => {};
});

function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>;
}
const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
    <Sonda />
  </MemoryRouter>
);
const closca = (c) => c.querySelector('.app-grid-shell');
const panell = (c) => closca(c).dataset.panell;
const obertes = (c) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => c.querySelector(id).getAttribute('aria-hidden') !== 'true');
const columna = (c, id) => c.querySelector(`#${id}`);
const url = () => screen.getByTestId('url').textContent;

test('MD · /notes a 375 px: primer les CARPETES; carpeta → NOTES → editor; la fletxa blava torna a NOTES', () => {
  const buida = ambAmplada(375);
  const { container } = munta('/notes');
  expect([closca(container).dataset.layout, panell(container)]).toEqual(['estret', 'left']);
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);
  expect(within(columna(container, 'app-grid-sidebar')).getByRole('navigation', { name: 'CARPETES' })).toBeTruthy();

  fireEvent.click(within(columna(container, 'app-grid-sidebar')).getByRole('button', { name: MUR }));
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  buida();

  fireEvent.click(within(columna(container, 'app-grid-list')).getByRole('button', { name: 'Primera' }));
  expect(panell(container)).toBe('');
  expect(obertes(container)).toEqual(['#app-grid-main']);
  buida();
  const detall = columna(container, 'app-grid-main');
  expect(within(detall).getByRole('heading', { level: 1 }).textContent).toBe('Primera');
  const abans = url();
  expect(abans).toContain('nota=a1');

  fireEvent.click(within(detall).getByRole('button', { name: 'Tornar arrere' }));
  expect(panell(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  // La fletxa no ha tirat de l'historial: la nota continua a la URL.
  expect(url()).toBe(abans);
  expect(document.activeElement).toBe(within(columna(container, 'app-grid-list')).getByRole('button', { name: 'Primera' }));
});

test('MD · un enllaç amb nota (/notes?nota=a1) obri l’editor, i la fletxa blava porta a NOTES', () => {
  ambAmplada(375);
  const { container } = munta('/notes?nota=a1');
  expect(panell(container)).toBe('');
  expect(within(columna(container, 'app-grid-main')).getByRole('heading', { level: 1 }).textContent).toBe('Primera');
  fireEvent.click(within(columna(container, 'app-grid-main')).getByRole('button', { name: 'Tornar arrere' }));
  expect(panell(container)).toBe('middle');
  expect(url()).toContain('nota=a1');
});

test('MD · a 1400 px res no canvia: tres columnes, cap panell i l’editor de la nota', () => {
  ambAmplada(1400);
  const { container } = munta('/notes?nota=a1');
  expect([closca(container).dataset.layout, panell(container)]).toEqual(['ample', '']);
  expect(obertes(container)).toEqual(['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']);
});

/* ═══ Revisió de MD · La URL que el Bloc escriu sol no és cap enllaç ══════
   Amb el «Bloc de notes» (n1) a les dades, l'efecte d'entrada reescriu
   /notes en /notes?nota=n1. Eixir del Bloc i tornar-hi amb l'Arrere (o
   recarregar) dona eixa URL: la persona ha de trobar-se on era, no un editor
   que no ha obert mai. L'app de veres: rutes, un altre mòdul i l'Arrere. */
const BLOC = Object.freeze({ id: 'n1', title: 'Bloc de notes', folderId: 'f-mur', updatedAt: '2026-01-02T09:00:00Z' });

function Navegacio() {
  const navigate = useNavigate();
  return (
    <nav aria-label="App">
      <button type="button" onClick={() => navigate('/mur')}>Ves al Mur</button>
      <button type="button" onClick={() => navigate(-1)}>Arrere</button>
    </nav>
  );
}
const muntaApp = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/notes" element={<NotesSection />} />
      <Route path="/mur" element={<p>Mur</p>} />
    </Routes>
    <Navegacio />
    <Sonda />
  </MemoryRouter>
);
const app = (nom) => within(screen.getByRole('navigation', { name: 'App' })).getByRole('button', { name: nom });

test('MD · /notes amb n1: les CARPETES; eixir i tornar amb l’Arrere a /notes?nota=n1 torna a les CARPETES, no a l’editor', () => {
  dades.notes = [BLOC, NOTA];
  ambAmplada(375);
  const { container } = muntaApp('/notes');
  expect(url()).toBe('/notes?nota=n1');
  expect(panell(container)).toBe('left');

  fireEvent.click(app('Ves al Mur'));
  expect(url()).toBe('/mur');
  expect(container.querySelector('.app-grid-shell')).toBeNull();
  fireEvent.click(app('Arrere'));
  expect(url()).toBe('/notes?nota=n1');
  expect(panell(container)).toBe('left');
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);
});

test('MD · recarregar /notes?nota=n1 que el Bloc havia escrit sol torna a les CARPETES', () => {
  dades.notes = [BLOC, NOTA];
  ambAmplada(375);
  muntaApp('/notes');
  expect(url()).toBe('/notes?nota=n1');
  cleanup();
  const { container } = muntaApp('/notes?nota=n1');
  expect(panell(container)).toBe('left');
});

test('MD · si la persona era a l’editor quan va eixir, l’Arrere hi torna; i un enllaç a una altra nota obri el seu editor', () => {
  dades.notes = [BLOC, NOTA];
  const buida = ambAmplada(375);
  const { container } = muntaApp('/notes');
  fireEvent.click(within(columna(container, 'app-grid-sidebar')).getByRole('button', { name: MUR }));
  buida();
  fireEvent.click(within(columna(container, 'app-grid-list')).getByRole('button', { name: 'Primera' }));
  buida();
  expect(panell(container)).toBe('');
  const alEditor = url();
  expect(alEditor).toContain('nota=a1');

  fireEvent.click(app('Ves al Mur'));
  fireEvent.click(app('Arrere'));
  expect(url()).toBe(alEditor);
  expect(panell(container)).toBe('');
  expect(within(columna(container, 'app-grid-main')).getByRole('heading', { level: 1 }).textContent).toBe('Primera');
  cleanup();

  // «Envia al Bloc» o la Cerca porten a una nota que no era l'oberta: el seu editor.
  const enllac = muntaApp('/notes?nota=n1');
  expect(panell(enllac.container)).toBe('');
  expect(within(columna(enllac.container, 'app-grid-main')).getByRole('heading', { level: 1 }).textContent).toBe('Bloc de notes');
});
