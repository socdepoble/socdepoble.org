/* Sonda del revisor adversarial independent (ronda 2) de la correcció de F4.
   Còpia literal de les proves de la proposta de Codex (relleu 23 de
   l'auditoria 261004_2240; _wiki_de_poble/04_escriptori/
   261005_0101_produccio_proposta_f4_seleccio_font.patch, fitxer
   NotesSection.publicacions.url.test.jsx, NO aplicat), executades contra la
   correcció de Claude perquè el contracte de Codex es comprove sobre els
   bytes vius. El nom és un altre per no trepitjar el de la proposta.
   Dades sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';

const dades = vi.hoisted(() => ({
  notes: [], noteFolders: [], notesStatus: 'ready', notesComplete: true, notesError: null,
  media: [], mediaStatus: 'ready', mediaError: null,
  feed: [], mercat: [], events: [], murStatus: 'ready', murError: null,
  resolveNote: vi.fn(), refreshNotes: vi.fn(), refreshMur: vi.fn(), refreshMedia: vi.fn(),
  activate: () => () => {}
}));
vi.mock('./NotesContext', async (importOriginal) => ({ ...await importOriginal(), useNotes: () => ({
  notes: dades.notes, noteFolders: dades.noteFolders, status: dades.notesStatus, error: dades.notesError,
  notesComplete: dades.notesComplete, canCreate: true, teSessio: true,
  resolveNote: dades.resolveNote, refresh: dades.refreshNotes,
  obriConfiguracioNotes: () => {}, creaNota: async () => ({ id: 'nova' })
}) }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ activate: dades.activate, config: { dataMode: 'remote' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: { tipus: 'persona', id: 'uuid-prova', rol: 'persona' }, memberships: [] }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({
  status: dades.murStatus, error: dades.murError, refresh: dades.refreshMur,
  sortedFeedPosts: dades.feed, sortedMarketItems: dades.mercat, sortedEvents: dades.events
}) }));
vi.mock('../multimedia/MultimediaContext.jsx', () => ({ useMultimedia: () => ({
  status: dades.mediaStatus, error: dades.mediaError, refresh: dades.refreshMedia, mediaItems: dades.media
}) }));
vi.mock('./SnippetCurador.jsx', () => ({ SnippetCurador: () => <p data-testid="curador">Snippet privat</p> }));
vi.mock('./NotesDetail.jsx', () => ({ default: ({ activeNote }) => <p data-testid="detall-nota">{activeNote?.id ?? 'cap'}</p> }));
vi.mock('./NotaFitxa.jsx', () => ({ NotaFitxa: ({ item, active, onSelect }) => (
  <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
) }));
vi.mock('./ConnexioFitxa.jsx', () => ({ ConnexioFitxa: () => null }));
vi.mock('./PublicacioDetall.jsx', () => ({
  PublicacioDetall: ({ item }) => <p data-testid="detall-publicacio">{item?.id ?? 'cap'}</p>,
  PublicacioFitxa: ({ item, active, onSelect }) => <button type="button" aria-current={active ? 'true' : undefined} onClick={onSelect}>{item.title}</button>
}));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
import NotesSection from './NotesSection.jsx';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  Object.assign(dades, {
    notes: [], noteFolders: [], notesStatus: 'ready', notesComplete: true, notesError: null,
    media: [], mediaStatus: 'ready', mediaError: null,
    feed: [], mercat: [], events: [], murStatus: 'ready', murError: null
  });
  vi.clearAllMocks();
  dades.resolveNote.mockResolvedValue({ status: 'not-found' });
});
afterEach(() => cleanup());

function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="url">{search ? `${pathname}?${search}` : pathname}</output>;
}
const vista = (ruta) => <MemoryRouter rutaInicial={ruta}><NotesSection /><Sonda /></MemoryRouter>;
const tria = () => new URL(screen.getByTestId('url').textContent, 'http://localhost').searchParams.get('nota');
const carpeta = { multimedia: 'f-media', mur: 'f-mur', mercat: 'f-mercat', events: 'f-events' };
const coleccio = { multimedia: 'media', mur: 'feed', mercat: 'mercat', events: 'events' };
const font = (seccio) => seccio === 'multimedia' ? 'media' : 'mur';
const rutaDe = (seccio, id) => `/notes?carpeta=${carpeta[seccio]}&nota=${encodeURIComponent(id)}`;

for (const seccio of ['multimedia', 'mur', 'mercat', 'events']) {
  for (const estat of ['loading', 'revalidating', 'error']) {
    test(`F4 · ${seccio}: ${estat} → ready conserva la URL copiada i obri la publicació`, async () => {
      const id = `publicacio:${seccio}:element-prova`;
      const ruta = rutaDe(seccio, id);
      dades[`${font(seccio)}Status`] = estat;
      if (estat === 'error') dades[`${font(seccio)}Error`] = new Error('Font temporalment indisponible');
      const view = render(vista(ruta));
      expect(tria()).toBe(id);
      expect(dades.resolveNote).not.toHaveBeenCalled();
      if (estat === 'error') expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      dades[coleccio[seccio]] = [{ id: 'element-prova', title: 'Peça pròpia', ownerUserId: 'uuid-prova', kind: 'image', src: '/a.jpg' }];
      dades[`${font(seccio)}Status`] = 'ready';
      dades[`${font(seccio)}Error`] = null;
      view.rerender(vista(ruta));
      expect(tria()).toBe(id);
      expect(screen.getByTestId('detall-publicacio').textContent).toBe(id);
      expect(dades.resolveNote).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    });
  }
}

test('F4 · revalidar una publicació que ja estava oberta no la substituïx per una nota preparada', () => {
  const id = 'publicacio:multimedia:element-prova';
  const ruta = rutaDe('multimedia', id);
  dades.media = [{ id: 'element-prova', title: 'Peça pròpia', ownerUserId: 'uuid-prova', kind: 'image', src: '/a.jpg' }];
  const view = render(vista(ruta));
  expect(screen.getByTestId('detall-publicacio').textContent).toBe(id);
  dades.mediaStatus = 'revalidating';
  dades.media = [];
  view.rerender(vista(ruta));
  expect(tria()).toBe(id);
  expect(dades.resolveNote).not.toHaveBeenCalled();
  dades.mediaStatus = 'ready';
  dades.media = [{ id: 'element-prova', title: 'Peça pròpia', ownerUserId: 'uuid-prova' }];
  view.rerender(vista(ruta));
  expect(tria()).toBe(id);
  expect(screen.getByTestId('detall-publicacio').textContent).toBe(id);
});

for (const completa of [true, false]) {
  test(`F4 · una publicació fora de la finestra amb notesComplete=${completa} no consulta el port privat ni acredita absència`, async () => {
    const id = 'publicacio:multimedia:fora-finestra';
    dades.notesComplete = completa;
    render(vista(rutaDe('multimedia', id)));
    await waitFor(() => expect(screen.getByText('No s’ha pogut obrir l’element.')).toBeTruthy());
    expect(tria()).toBe(id);
    expect(dades.resolveNote).not.toHaveBeenCalled();
    expect(screen.queryByText('L’element no és accessible o ja no existix.')).toBeNull();
  });
}

test('F4 · una nota ordinària ready no queda bloquejada per Mur loading ni Multimèdia error', () => {
  dades.notes = [{ id: 'n1', title: 'Primera', folderId: 'f-mur' }];
  dades.murStatus = 'loading';
  dades.mediaStatus = 'error';
  dades.mediaError = new Error('Font aliena caiguda');
  render(vista('/notes?nota=n1'));
  expect(tria()).toBe('n1');
  expect(screen.getByTestId('detall-nota').textContent).toBe('n1');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('F4 · una nota ordinària absent en una llista parcial continua delegant la resolució per ID', async () => {
  dades.notesComplete = false;
  dades.mediaStatus = 'error';
  dades.resolveNote.mockRejectedValue(new Error('Resolució privada temporalment indisponible'));
  render(vista('/notes?nota=uuid-nota-pendent'));
  await waitFor(() => expect(dades.resolveNote).toHaveBeenCalledTimes(1));
  expect(dades.resolveNote.mock.calls[0][0]).toBe('uuid-nota-pendent');
  expect(dades.resolveNote.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  await waitFor(() => expect(screen.getByText('No s’ha pogut obrir l’element.')).toBeTruthy());
  expect(tria()).toBe('uuid-nota-pendent');
});

test('F4 · Reintentar una font seleccionada en error refresca eixa font', () => {
  dades.mediaStatus = 'error';
  dades.mediaError = new Error('Font caiguda');
  render(vista(rutaDe('multimedia', 'publicacio:multimedia:element-prova')));
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(dades.refreshMedia).toHaveBeenCalledTimes(1);
  expect(dades.refreshNotes).not.toHaveBeenCalled();
  expect(dades.refreshMur).not.toHaveBeenCalled();
});

test('F4 · si falla Notes, Reintentar continua refrescant Notes encara que la URL siga d’una publicació', () => {
  dades.notesStatus = 'error';
  dades.notesError = new Error('Notes temporalment indisponible');
  render(vista(rutaDe('multimedia', 'publicacio:multimedia:element-prova')));
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
  expect(dades.refreshNotes).toHaveBeenCalledTimes(1);
  expect(dades.refreshMedia).not.toHaveBeenCalled();
});

for (const seccio of ['multimedia', 'mur', 'mercat', 'events']) {
  for (const estat of ['loading', 'revalidating', 'error']) {
    test(`F4 · carpeta ${seccio} sense item espera ${estat} abans de triar la primera publicació`, () => {
      const ruta = `/notes?carpeta=${carpeta[seccio]}`;
      dades[`${font(seccio)}Status`] = estat;
      if (estat === 'error') dades[`${font(seccio)}Error`] = new Error('Font temporalment indisponible');
      const view = render(vista(ruta));
      expect(tria()).toBeNull();
      dades[coleccio[seccio]] = [{ id: 'element-prova', title: 'Peça pròpia', ownerUserId: 'uuid-prova' }];
      dades[`${font(seccio)}Status`] = 'ready';
      dades[`${font(seccio)}Error`] = null;
      view.rerender(vista(ruta));
      const id = `publicacio:${seccio}:element-prova`;
      expect(tria()).toBe(id);
      expect(screen.getByTestId('detall-publicacio').textContent).toBe(id);
      expect(dades.resolveNote).not.toHaveBeenCalled();
    });
  }
  test(`F4 · la carpeta ${seccio} amb una nota ordinària no espera la font pública en error`, () => {
    dades.notes = [{ id: 'nota-prova', title: 'Nota privada', folderId: carpeta[seccio] }];
    dades[`${font(seccio)}Status`] = 'error';
    dades[`${font(seccio)}Error`] = new Error('Font aliena caiguda');
    render(vista(`/notes?carpeta=${carpeta[seccio]}`));
    expect(tria()).toBe('nota-prova');
    expect(screen.getByTestId('detall-nota').textContent).toBe('nota-prova');
    expect(screen.queryByRole('alert')).toBeNull();
  });
}

test('F4 · les notes ordinàries d’una subcarpeta continuen visibles abans que arribe la font pública', () => {
  dades.noteFolders = [{ id: 'f-media', name: 'Multimèdia' }, { id: 'sub-media', name: 'Bancals', parentId: 'f-media' }];
  dades.notes = [{ id: 'nota-subcarpeta', title: 'Nota privada', folderId: 'sub-media' }];
  dades.mediaStatus = 'loading';
  render(vista('/notes?carpeta=f-media'));
  expect(tria()).toBe('nota-subcarpeta');
  expect(screen.getByTestId('detall-nota').textContent).toBe('nota-subcarpeta');
});

test('F4 · la nota editable publicada també al Mur no queda bloquejada per la font pública', () => {
  dades.notes = [{ id: 'nota-publicada', title: 'Nota pròpia', folderId: 'f-notes', isPublished: true, publishedSubmissionId: 'publicada' }];
  dades.murStatus = 'loading';
  render(vista('/notes?carpeta=f-mur'));
  expect(tria()).toBe('nota-publicada');
  expect(screen.getByTestId('detall-nota').textContent).toBe('nota-publicada');
});

for (const idCarpeta of ['f-media', 'f-mur']) {
  test(`F4 · el snippet privat en ${idCarpeta} no espera cap font pública`, () => {
    dades.mediaStatus = 'error';
    dades.mediaError = new Error('Font aliena caiguda');
    dades.murStatus = 'loading';
    render(vista(`/notes?mode=desa&carpeta=${idCarpeta}`));
    expect(screen.getByTestId('curador').textContent).toBe('Snippet privat');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(tria()).toBeNull();
    expect(dades.resolveNote).not.toHaveBeenCalled();
  });
}

test('F4 · el snippet continua governat per l’error propi de Notes', () => {
  dades.notesStatus = 'error';
  dades.notesError = new Error('Notes caigudes');
  render(vista('/notes?mode=desa&carpeta=f-media'));
  expect(screen.queryByTestId('curador')).toBeNull();
  expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
});
