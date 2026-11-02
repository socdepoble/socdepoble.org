/* O2-T5 / P1-73 · Router i Workspace reals; només els ports de dades i les
   fitxes/detalls són sondes. La reserva preparada continua visible i manual;
   l'autotria seguix l'ordre de les files elegibles. jsdom no prova layout. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({ buit: [] }));
vi.mock('./NotesContext', async importOriginal => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.folders, status: dades.status,
    notesComplete: dades.notesComplete, canCreate: true, teSessio: true,
    config: dades.config, creaNota: dades.creaNota, setLocalNoteField: vi.fn(),
    obriConfiguracioNotes: () => {}, informaError: () => {}
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: dades.config }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: dades.murStatus, sortedFeedPosts: dades.feed, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('../multimedia/MultimediaContext.jsx', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: dades.buit }) }));
vi.mock('./NotesDetail.jsx', () => ({ default: ({ activeNote }) => <p data-testid="detall" data-preparada={Boolean(activeNote?.preparada)}>{activeNote?.id ?? 'cap'}</p> }));
vi.mock('./SnippetCurador.jsx', () => ({ SnippetCurador: () => <p data-testid="curador">Snippet privat</p> }));
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: ({ item, active, onSelect }) => <button className="fitxa-prova" data-id={item.id} data-preparada={Boolean(item.data?.preparada)} aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button> }));
vi.mock('./PublicacioDetall.jsx', () => ({
  PublicacioDetall: ({ item }) => <p data-testid="detall">{item.id}</p>,
  PublicacioFitxa: ({ item, active, onSelect }) => <button className="fitxa-prova" data-id={item.id} aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
}));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: ref => ref,
  useResolvedAssetState: ref => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
import NotesSection from './NotesSection.jsx';

const VELLA = Object.freeze({ id: 'vella', title: 'Zel del poble', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' });
const NOVA = Object.freeze({ id: 'nova', title: 'Bancal', folderId: 'f-mur', updatedAt: '2026-10-30T09:00:00Z' });
const ALFA = Object.freeze({ id: 'alfa', title: 'Almàssera', folderId: 'f-mur', updatedAt: '2026-08-03T09:00:00Z' });
const ALTRES = Object.freeze({ id: 'altres', title: 'Compra', folderId: 'f-notes', updatedAt: '2026-10-01T09:00:00Z' });
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => Object.assign(dades, {
  notes: [VELLA, ALFA, NOVA, ALTRES], folders: dades.buit, status: 'ready',
  notesComplete: true, config: { dataMode: 'remote' }, murStatus: 'ready', feed: dades.buit,
  creaNota: vi.fn(async entrada => ({ ...entrada, revision: 1 }))
}));
afterEach(cleanup);
function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="url">{pathname}?{search}</output><button onClick={() => navigate(-1)}>Arrere de prova</button></>;
}
const arbre = ruta => <MemoryRouter rutaInicial={ruta}><NotesSection /><Sonda /></MemoryRouter>;
const munta = (ruta = '/notes?carpeta=f-mur') => {
  const vista = render(arbre(ruta));
  return () => vista.rerender(arbre(ruta));
};
const columna = () => screen.getByRole('complementary', { name: 'NOTES' });
const files = () => [...columna().querySelectorAll('.fitxa-prova')];
const detall = () => screen.queryByTestId('detall')?.textContent ?? null;
const notaUrl = () => new URL(screen.getByTestId('url').textContent, 'http://localhost').searchParams.get('nota');
const carpeta = nom => fireEvent.click(within(screen.getByRole('navigation', { name: 'CARPETES' })).getByRole('button', { name: nom, exact: true }));
const preparada = () => within(columna()).getByRole('button', { name: 'Nota sense títol', exact: true });
const perNom = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Ordenar per data o nom' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nom (A-Z)' }));
};
function primeraElegible(id) {
  const elegibles = files().filter(fila => fila.dataset.preparada !== 'true');
  expect(elegibles[0].dataset.id).toBe(id);
  expect(elegibles[0].getAttribute('aria-current')).toBe('true');
  expect(files().filter(fila => fila.getAttribute('aria-current') === 'true')).toHaveLength(1);
  expect(detall()).toBe(id);
  expect(notaUrl()).toBe(id);
}

test('data inicial: la reserva més recent no tapa la primera nota ordenada, encara que arribe última', () => {
  munta();
  expect(files()[0]).toBe(preparada()); // visible i manual; no candidata automàtica.
  primeraElegible('nova');
  expect(dades.creaNota).not.toHaveBeenCalled();
});

test('nom: canviar carpeta tria la primera fila elegible, no la primera de l’entrada', () => {
  munta('/notes?carpeta=f-notes&nota=altres');
  perNom();
  carpeta('Mur');
  primeraElegible('alfa');
});

test('un recordat ordinari elegible preval sobre l’ordre en tornar a la carpeta', () => {
  munta();
  fireEvent.click(within(columna()).getByRole('button', { name: VELLA.title }));
  carpeta('Altres notes');
  carpeta('Mur');
  expect(detall()).toBe('vella');
});

test('una preparada triada automàticament i recordada no desplaça una nota que arriba després', () => {
  dades.notes = [ALTRES];
  const repinta = munta();
  expect(screen.getByTestId('detall').dataset.preparada).toBe('true');
  carpeta('Altres notes');
  dades.notes = [ALTRES, NOVA];
  repinta();
  carpeta('Mur');
  primeraElegible('nova');
});

test('CREAR NOTA i clic en preparada són tries explícites, també amb altres notes elegibles', async () => {
  munta();
  await act(async () => { fireEvent.click(within(columna()).getByRole('button', { name: 'CREAR NOTA' })); });
  const id = notaUrl();
  expect(screen.getByTestId('detall').dataset.preparada).toBe('true');
  expect(id).toBe(preparada().dataset.id);
  fireEvent.click(within(columna()).getByRole('button', { name: NOVA.title }));
  fireEvent.click(preparada());
  expect(detall()).toBe(id);
  expect(dades.creaNota).not.toHaveBeenCalled();
});

test('una preparada explícita actual es conserva quan arriben més notes', () => {
  const repinta = munta();
  fireEvent.click(preparada());
  const id = notaUrl();
  dades.notes = [...dades.notes, { ...NOVA, id: 'posterior', updatedAt: '2026-11-03' }];
  repinta();
  expect(notaUrl()).toBe(id);
  expect(detall()).toBe(id);
});

test('la URL explícita de la preparada continua elegible en tornar Arrere', () => {
  munta();
  fireEvent.click(preparada());
  const id = notaUrl();
  fireEvent.click(within(columna()).getByRole('button', { name: NOVA.title }));
  expect(notaUrl()).toBe('nova');
  fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' }));
  expect(notaUrl()).toBe(id);
  expect(detall()).toBe(id);
  expect(screen.getByTestId('detall').dataset.preparada).toBe('true');
});

test('carpeta buida definitiva: obri la preparada sense crear cap registre', () => {
  dades.notes = [ALTRES];
  munta();
  expect(screen.getByTestId('detall').dataset.preparada).toBe('true');
  expect(notaUrl()).toBe(preparada().dataset.id);
  expect(dades.creaNota).not.toHaveBeenCalled();
});

test('font pendent: espera i quan arriben notes reals les ordena abans de triar', () => {
  Object.assign(dades, { notes: [ALTRES], murStatus: 'loading' });
  const repinta = munta();
  expect(notaUrl()).toBeNull();
  expect(screen.queryByTestId('detall')?.dataset.preparada).not.toBe('true');
  Object.assign(dades, { murStatus: 'ready', notes: [ALTRES, VELLA, NOVA] });
  repinta();
  primeraElegible('nova');
});

test('llista parcial sense candidata: conserva reserva ajornada fins primera pàgina real', () => {
  Object.assign(dades, { notes: [], notesComplete: false });
  const repinta = munta();
  expect(notaUrl()).toBeNull();
  expect(screen.queryByRole('button', { name: 'Nota sense títol' })).toBeNull();
  dades.notes = [VELLA, NOVA];
  repinta();
  primeraElegible('nova');
});

test('font pendent amb nota disponible: no la bloqueja mentre espera publicacions', () => {
  dades.murStatus = 'loading';
  munta();
  primeraElegible('nova');
});

test('les publicacions de la carpeta també impedixen l’autotria de la preparada', () => {
  Object.assign(dades, { notes: [ALTRES], feed: [{ id: 'post', title: 'Poble', ownerUserId: 'uuid-prova', updatedAt: '2026-10-30' }] });
  munta();
  primeraElegible('publicacio:mur:post');
});

test('descendents: una nota de subcarpeta és candidata de la carpeta mare', () => {
  dades.folders = [{ id: 'mare', nom: 'Mare' }, { id: 'filla', nom: 'Filla', parentId: 'mare' }];
  dades.notes = [{ ...NOVA, folderId: 'filla' }];
  munta('/notes?carpeta=mare');
  primeraElegible('nova');
});

test('la consulta exclou les altres notes: la preparada és l’única candidata visible', () => {
  munta('/notes?carpeta=f-notes&nota=altres');
  fireEvent.click(screen.getByRole('button', { name: 'Cercar notes' }));
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Nota sense títol' } });
  carpeta('Mur');
  expect(files()).toHaveLength(1);
  expect(files()[0]).toBe(preparada());
  expect(screen.getByTestId('detall').dataset.preparada).toBe('true');
});

test('l’entrada nua conserva la Card tutorial fixada a Tot', () => {
  munta('/notes');
  expect(files()[0].textContent).toBe('Bloc de notes');
  expect(files()[0].getAttribute('aria-current')).toBe('true');
  expect(detall()).toBe('cap');
});

test('Snippet Curador: cap autotria ni reserva preparada', () => {
  munta('/notes?mode=desa&url=https%3A%2F%2Fexample.org&carpeta=f-mur');
  expect(screen.getByTestId('curador').textContent).toBe('Snippet privat');
  expect(notaUrl()).toBeNull();
  expect(screen.queryByRole('button', { name: 'Nota sense títol' })).toBeNull();
});
