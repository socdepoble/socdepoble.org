/* T7 (P9) · El Bloc de Notes a la URL, amb el router en memòria de veres
   (MemoryRouter) i l'espai de treball de veres: anada i tornada
   URL → estat → URL. Un enllaç copiat obri la mateixa carpeta amb la mateixa
   nota; un enllaç amb carpeta i sense nota no salta a n1; canviar de nota
   oblida la secció. Dades sintètiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({
  notes: [
    { id: 'n1', title: 'Primera', folderId: 'f-mur', updatedAt: '2026-01-03T09:00:00Z' },
    { id: 'n2', title: 'Segona', folderId: 'f-mur', updatedAt: '2026-01-02T09:00:00Z' },
    { id: 'm1', title: 'Samarreta', folderId: 'f-mercat', updatedAt: '2026-01-01T09:00:00Z' }
  ],
  noteFolders: [],
  buit: []
}));

vi.mock('./NotesContext', async (importOriginal) => ({
  ...await importOriginal(),
  useNotes: () => ({
    notes: dades.notes, noteFolders: dades.noteFolders, status: 'ready', canCreate: true, notesComplete: true,
    obriConfiguracioNotes: () => {}, creaNota: async () => ({ id: 'nova' })
  })
}));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: () => () => {}, config: { dataMode: 'seed' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sortedFeedPosts: dades.buit, sortedEvents: dades.buit, sortedMarketItems: dades.buit }) }));
vi.mock('./NotesDetail.jsx', () => ({ default: ({ activeNote }) => <p data-testid="detall">{activeNote?.id ?? 'cap'}</p> }));
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

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

/* La URL de l'entrada actual del router, un Arrere i un Avant. */
function Sonda() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>
      <button type="button" onClick={() => navigate(-1)}>Arrere de prova</button>
      <button type="button" onClick={() => navigate(1)}>Avant de prova</button>
    </>
  );
}

const munta = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <NotesSection />
    <Sonda />
  </MemoryRouter>
);
const url = () => screen.getByTestId('url').textContent;
const detall = () => screen.getByTestId('detall').textContent;
/* Ordre del Mestre (30-10-2026) · A 1400 CARPETES ja arrenca oberta: és
   l'arbre, no el rail. El nom de la carpeta activa és el de la fila de
   l'arbre (en el rail, l'aria-label). */
const rail = () => screen.getByRole('navigation', { name: 'CARPETES' });
const carpetaActiva = () => {
  const activa = within(rail()).getAllByRole('button').find((b) => b.getAttribute('aria-current') === 'page');
  return activa ? (activa.getAttribute('aria-label') ?? activa.querySelector('.sdp-workspace-nav-item__label')?.textContent ?? null) : undefined;
};
const fitxa = (titol) => screen.getByRole('button', { name: titol });
/* IDEA-59 / P1-72 · «Tot» és l'acció de la capçalera de CARPETES (premuda quan és la vista). */
const totPremut = () => screen.getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed') === 'true';

/* IDEA-59 / P1-72 (ordre del Mestre, 261101, punt 0) · L'entrada nua obri
   «Tot» amb la Card tutorial n1 triada (abans, la carpeta Mur i ?nota=n1
   escrit a la URL, i només si la n1 era a la llista). La selecció es deriva:
   la URL es queda nua i no es reescriu. */
test('IDEA-59 · entrar a /notes sense res obri «Tot» amb n1 triada i no reescriu la URL', () => {
  munta('/notes');
  expect(url()).toBe('/notes');
  expect(detall()).toBe('n1');
  expect(totPremut()).toBe(true);
  expect(carpetaActiva()).toBeUndefined();
  expect(fitxa('Primera').getAttribute('aria-current')).toBe('true');
});

test('triar carpeta i nota les escriu a la URL (push): Arrere torna a la nota d’abans', () => {
  munta('/notes');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mercat' }));
  // IDEA-59 · Des de l'entrada nua, la URL naix amb la carpeta davant (abans ja hi havia ?nota=n1).
  expect(url()).toBe('/notes?carpeta=f-mercat&nota=m1');
  expect(detall()).toBe('m1');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mur' }));
  fireEvent.click(fitxa('Segona'));
  expect(url()).toBe('/notes?carpeta=f-mur&nota=n2');
  expect(detall()).toBe('n2');
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
  expect(detall()).toBe('n1');
  expect(carpetaActiva()).toBe('Mur');
});

/* Correcció T1 · Tornar Arrere a l'entrada de /notes (que no porta carpeta)
   no ha de reescriure-la: el MemoryRouter talla l'historial per davant en
   cada replace, i l'Avant es perdria.
   IDEA-59 / P1-72 · L'entrada nua ja no porta ?nota=n1: l'Arrere hi torna nua,
   a «Tot» amb la Card tutorial, i tampoc no es reescriu. */
test('Arrere a l’entrada sense carpeta no esborra l’Avant (router en memòria)', () => {
  munta('/notes');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mercat' }));
  expect(url()).toBe('/notes?carpeta=f-mercat&nota=m1');
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Arrere de prova' })); });
  expect(url()).toBe('/notes');
  expect(detall()).toBe('n1');
  expect(totPremut()).toBe(true);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Avant de prova' })); });
  expect(url()).toBe('/notes?carpeta=f-mercat&nota=m1');
  expect(detall()).toBe('m1');
  expect(carpetaActiva()).toBe('Mercat');
});

test('un enllaç amb nota i sense carpeta obri la carpeta de la nota i no es reescriu', () => {
  munta('/notes?nota=m1');
  expect(detall()).toBe('m1');
  expect(carpetaActiva()).toBe('Mercat');
  expect(url()).toBe('/notes?nota=m1');
});

test('anada i tornada: la URL copiada obri la mateixa carpeta i la mateixa nota, i no es reescriu', () => {
  munta('/notes');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mercat' }));
  fireEvent.click(within(rail()).getByRole('button', { name: 'Mur' }));
  fireEvent.click(fitxa('Segona'));
  const copiada = url();
  cleanup();

  munta(copiada);
  expect(url()).toBe(copiada);
  expect(detall()).toBe('n2');
  expect(carpetaActiva()).toBe('Mur');
  expect(fitxa('Segona').getAttribute('aria-current')).toBe('true');
});

test('un enllaç amb carpeta i sense nota obri la primera nota d’eixa carpeta: no salta a n1', () => {
  munta('/notes?carpeta=f-mercat');
  expect(url()).toBe('/notes?carpeta=f-mercat&nota=m1');
  expect(detall()).toBe('m1');
  expect(carpetaActiva()).toBe('Mercat');
});

/* Abans del T7, triar una carpeta sense notes esborrava ?nota=, la redirecció
   hi tornava a posar n1 i la reconciliació tornava a Mur: la carpeta buida no
   es podia obrir. Ara la carpeta queda a la URL i la redirecció no salta.
   P4 (ordre del Mestre, 261003) · Ja no queda buida: hi espera la «Nota sense
   títol», oberta i llesta per a escriure (encara sense crear al servidor). */
test('triar una carpeta sense notes la deixa oberta, no rebota a n1 i hi obri la nota preparada', () => {
  munta('/notes');
  fireEvent.click(within(rail()).getByRole('button', { name: 'Pobles' }));
  expect(carpetaActiva()).toBe('Pobles');
  const preparada = detall();
  expect(preparada).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(url()).toBe(`/notes?carpeta=f-pobles&nota=${preparada}`);
  expect(fitxa('Nota sense títol').getAttribute('aria-current')).toBe('true');
});

test('una carpeta que no casa amb la nota es corregix a la de la nota', () => {
  munta('/notes?carpeta=f-mercat&nota=n2');
  expect(detall()).toBe('n2');
  expect(carpetaActiva()).toBe('Mur');
  expect(url()).toBe('/notes?carpeta=f-mur&nota=n2');
});

test('canviar de nota oblida la secció de l’anterior; la mateixa nota la conserva', () => {
  munta('/notes?carpeta=f-mur&nota=n1&seccio=intro');
  expect(url()).toBe('/notes?carpeta=f-mur&nota=n1&seccio=intro');
  fireEvent.click(fitxa('Primera'));
  expect(url()).toBe('/notes?carpeta=f-mur&nota=n1&seccio=intro');
  fireEvent.click(fitxa('Segona'));
  expect(url()).toBe('/notes?carpeta=f-mur&nota=n2');
});
