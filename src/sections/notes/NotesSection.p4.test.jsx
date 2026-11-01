/* P4 (ordre del Mestre, 261003) · Regressió UX del Bloc de Notes, amb
   l'espai de treball de veres i el router en memòria de veres:
     · «CREAR NOTA» a la columna NOTES, visible i actiu amb sessió, i
       desactivat (no desaparegut) mentre les dades carreguen;
     · la «Nota sense títol» sempre preparada, oberta sense crear-se al
       servidor, i creada amb la primera cosa que s'hi escriu;
     · «Connecta per veure les teues notes.» només sense sessió i amb dades
       remotes; amb sessió, mai.
   El panell dret (l'editor de veres) té la seua prova a NotesEditor.p4.test.jsx.
   Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({
  notes: [], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, notesComplete: true,
  creaNota: null, setLocalNoteField: null, preparada: null, buit: []
}));

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.buit, status: dades.status, canCreate: dades.canCreate, teSessio: dades.teSessio,
    notesComplete: dades.notesComplete, config: dades.config, obriConfiguracioNotes: () => {}, informaError: () => {},
    creaNota: (...args) => dades.creaNota(...args), setLocalNoteField: (...args) => dades.setLocalNoteField(...args)
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
/* El detall diu quina nota té oberta i si és la preparada; llig el canal que rep l'editor de veres. */
vi.mock('./NotesDetail.jsx', async () => {
  const { useNotaPreparadaDelBloc } = await import('./notaPreparada.js');
  function DetallFals({ activeNote }) {
    dades.preparada = useNotaPreparadaDelBloc();
    return <p data-testid="detall" data-preparada={activeNote?.preparada ? 'si' : 'no'}>{activeNote?.id ?? 'cap'}</p>;
  }
  return { default: DetallFals };
});
vi.mock('./NotaFitxa.jsx', () => ({
  NotaFitxa: ({ item, active, onSelect }) => (
    <button type="button" className="fitxa-de-prova" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
  )
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import NotesSection from './NotesSection.jsx';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CONNECTA = 'Connecta per veure les teues notes.';
const NOTA_A = Object.freeze({ id: 'a1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' });

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  Object.assign(dades, { notes: [NOTA_A], status: 'ready', teSessio: true, canCreate: true, config: { dataMode: 'remote' }, notesComplete: true, preparada: null });
  dades.creaNota = vi.fn(async (entrada) => ({ ...entrada, revision: 1 }));
  dades.setLocalNoteField = vi.fn();
});
afterEach(() => cleanup());

function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>;
}
const arbre = (ruta) => (
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
    <Sonda />
  </MemoryRouter>
);
const munta = (ruta = '/notes') => {
  const vista = render(arbre(ruta));
  // Les dades han canviat (una pàgina nova, la nota creada): el mateix arbre, el mateix router.
  return { ...vista, torna: () => vista.rerender(arbre(ruta)) };
};
const columnaNotes = () => screen.getByRole('complementary', { name: 'NOTES' });
const detall = () => screen.getByTestId('detall');
/* IDEA-59 / P1-72 (ordre del Mestre, 261101, punt 0) · L'entrada nua de /notes
   obri «Tot» amb la Card tutorial «Bloc de notes» triada (una fitxa de lectura:
   el detall és l'estat buit de l'editor, sense nota). Abans s'obria la primera
   nota de «Mur» o, sense cap, la nota preparada. */
const cardTutorial = () => within(columnaNotes()).getByRole('button', { name: 'Bloc de notes' });

test('amb sessió, «CREAR NOTA» és a la columna NOTES i obri la «Nota sense títol» sense crear-la al servidor', async () => {
  munta();
  // IDEA-59 · L'entrada és la Card tutorial; CREAR NOTA, un sol clic.
  expect(detall().textContent).toBe('cap');
  expect(cardTutorial().getAttribute('aria-current')).toBe('true');
  const crear = within(columnaNotes()).getByRole('button', { name: 'CREAR NOTA' });
  expect(crear.disabled).toBe(false);
  await act(async () => { fireEvent.click(crear); });
  const id = detall().textContent;
  expect(id).toMatch(UUID_V4);
  expect(detall().dataset.preparada).toBe('si');
  expect(within(columnaNotes()).getByRole('button', { name: 'Nota sense títol' }).getAttribute('aria-current')).toBe('true');
  expect(screen.getByTestId('url').textContent).toContain(`nota=${id}`);
  expect(dades.creaNota).not.toHaveBeenCalled();
  // La primera cosa que s'hi escriu la crea, una vegada i amb el mateix id.
  await act(async () => { dades.preparada.escriu(id, 'content', '<p>Comprar planter</p>'); });
  expect(dades.creaNota).toHaveBeenCalledTimes(1);
  /* IDEA-59 · Creada des de «Tot» (l'entrada nua): sense carpeta, com des del
     botó «Tot» (abans l'entrada era «Mur» i la nota naixia a la carpeta Mur). */
  expect(dades.creaNota.mock.lastCall[0]).toMatchObject({ id, content: '<p>Comprar planter</p>' });
  expect(dades.creaNota.mock.lastCall[0]).not.toHaveProperty('folderId');
});

/* IDEA-59 · Amb sessió i cap nota: la Card tutorial a «Tot» (abans de P1-72 hi
   havia la nota preparada oberta); la «Nota sense títol» és a la llista i a un
   clic, sense crear-se. */
test('amb sessió i cap nota, cap «Connecta…»: la Card tutorial és oberta i la nota preparada, a un clic', async () => {
  dades.notes = [];
  munta();
  expect(screen.queryByText(CONNECTA)).toBeNull();
  expect(detall().textContent).toBe('cap');
  expect(cardTutorial().getAttribute('aria-current')).toBe('true');
  const preparada = within(columnaNotes()).getByRole('button', { name: 'Nota sense títol' });
  await act(async () => { fireEvent.click(preparada); });
  expect(detall().textContent).toMatch(UUID_V4);
  expect(detall().dataset.preparada).toBe('si');
  expect(dades.creaNota).not.toHaveBeenCalled();
});

test('amb sessió però les dades encara carregant: «CREAR NOTA» es pinta desactivat, no desapareix, i cap «Connecta…»', () => {
  Object.assign(dades, { status: 'loading', canCreate: false });
  munta();
  expect(within(columnaNotes()).getByRole('button', { name: 'CREAR NOTA' }).disabled).toBe(true);
  expect(screen.queryByText(CONNECTA)).toBeNull();
});

/* IDEA-59 / P1-72 · «La Card sempre dins de NOTES (Tot)»: també sense sessió.
   La llista ja no és buida (hi ha la Card), i el text «Connecta…» de la
   llista buida no es veu; la Card i la barra porten «CONNECTAR». Continua
   sense CREAR NOTA ni nota preparada, i el detall és la còpia de prova. */
test('sense sessió amb dades remotes: la Card tutorial a «Tot», sense CREAR NOTA ni nota preparada', () => {
  Object.assign(dades, { notes: [], teSessio: false, canCreate: false });
  munta();
  expect(cardTutorial().getAttribute('aria-current')).toBe('true');
  expect(within(columnaNotes()).queryByText(CONNECTA)).toBeNull();
  expect(screen.queryByRole('button', { name: 'CREAR NOTA' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Nota sense títol' })).toBeNull();
  expect(detall().textContent).toBe('cap');
});

test('en mode seed sense sessió les notes són del dispositiu: cap «Connecta…» i es pot crear', () => {
  Object.assign(dades, { notes: [], teSessio: false, canCreate: true, config: { dataMode: 'seed' } });
  munta();
  expect(screen.queryByText(CONNECTA)).toBeNull();
  expect(within(columnaNotes()).getByRole('button', { name: 'CREAR NOTA' }).disabled).toBe(false);
});

/* ── Revisió de P4 (261003) ──────────────────────────────────────────── */
const NOTA_POBLES = Object.freeze({ id: 'p1', title: 'Festes', folderId: 'f-pobles', updatedAt: '2026-01-02T09:00:00Z' });

test('revisió · amb la llista a mitges, un enllaç a una carpeta espera la seua nota: la preparada no guanya la selecció', () => {
  // Més de 50 notes: la primera pàgina no en porta cap de la carpeta de l'enllaç.
  Object.assign(dades, { notes: [NOTA_A], notesComplete: false });
  const { torna } = munta('/notes?carpeta=f-pobles');
  expect(detall().textContent).toBe('cap');
  expect(screen.getByTestId('url').textContent).toBe('/notes?carpeta=f-pobles');
  expect(within(columnaNotes()).queryByRole('button', { name: 'Nota sense títol' })).toBeNull();
  // Arriba la pàgina que la porta i la llista ja és completa: s'obri la nota de la carpeta.
  Object.assign(dades, { notes: [NOTA_A, NOTA_POBLES], notesComplete: true });
  act(() => { torna(); });
  expect(detall().textContent).toBe('p1');
  expect(screen.getByTestId('url').textContent).toContain('nota=p1');
  expect(dades.creaNota).not.toHaveBeenCalled();
});

test('revisió · amb la llista a mitges, CREAR NOTA obri igualment la «Nota sense títol»', async () => {
  Object.assign(dades, { notesComplete: false });
  munta();
  // IDEA-59 · L'entrada nua és la Card tutorial, també amb la llista a mitges.
  expect(detall().textContent).toBe('cap');
  await act(async () => { fireEvent.click(within(columnaNotes()).getByRole('button', { name: 'CREAR NOTA' })); });
  const id = detall().textContent;
  expect(id).toMatch(UUID_V4);
  expect(detall().dataset.preparada).toBe('si');
  expect(screen.getByTestId('url').textContent).toContain(`nota=${id}`);
  expect(dades.creaNota).not.toHaveBeenCalled();
});

test('revisió · un endoll que crea la nota amb un altre id: la selecció i la URL passen a la nota creada, amb el text', async () => {
  const ID_SERVIDOR = '0f0e0d0c-0b0a-4000-8000-0000000000ff';
  dades.creaNota = vi.fn(async (entrada) => ({ ...entrada, id: ID_SERVIDOR, revision: 1 }));
  const { torna } = munta();
  await act(async () => { fireEvent.click(within(columnaNotes()).getByRole('button', { name: 'CREAR NOTA' })); });
  const id = detall().textContent;
  await act(async () => { dades.preparada.escriu(id, 'content', '<p>Comprar planter</p>'); });
  await act(async () => { dades.preparada.escriu(id, 'content', '<p>Comprar planter i reg</p>'); });
  expect(dades.creaNota).toHaveBeenCalledTimes(1);
  // creaNota l'ha posada a la llista amb l'id del servidor.
  dades.notes = [{ id: ID_SERVIDOR, title: '', content: '<p>Comprar planter</p>', folderId: 'f-mur', revision: 1, updatedAt: '2026-10-03T16:00:00Z' }, NOTA_A];
  act(() => { torna(); });
  expect(dades.setLocalNoteField).toHaveBeenCalledWith(ID_SERVIDOR, 'content', '<p>Comprar planter i reg</p>');
  expect(detall().textContent).toBe(ID_SERVIDOR);
  expect(screen.getByTestId('url').textContent).toContain(`nota=${ID_SERVIDOR}`);
  expect(screen.getByTestId('url').textContent).not.toContain(id);
});
