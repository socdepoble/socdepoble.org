import React from 'react';
import { render, screen, cleanup, fireEvent, within, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  adapter: null, upload: vi.fn(), config: { tenantId: 'tenant-A' }, notes: [], setLocal: vi.fn(), session: {},
  mou: vi.fn(), esborra: vi.fn(), potEsborrar: false, publish: vi.fn(), compartir: vi.fn()
}));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_key, fallback) => fallback, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notes: mocks.notes, setLocalNoteField: mocks.setLocal, notesComplete: true,
    mouNota: mocks.mou, esborraNota: mocks.esborra, potEsborrar: mocks.potEsborrar,
    publishNote: mocks.publish, compartirNota: mocks.compartir
  }),
  etiquetesDeNota: () => []
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: mocks.upload, teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: 'user' }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import NotesEditor from './NotesEditor.jsx';

beforeEach(() => {
  mocks.notes = [];
  mocks.session = {};
  mocks.config = { tenantId: 'tenant-A' };
  mocks.potEsborrar = false;
  mocks.setLocal.mockReset();
  mocks.mou.mockReset().mockResolvedValue(true);
  mocks.esborra.mockReset().mockResolvedValue(true);
});
afterEach(cleanup);

/* La botonera viu dins de l'adaptador (la pinta el DocumentEditor, ací fals):
   es munta a part i els diàlegs els pinta el NotesEditor. */
function botonera() {
  const { container } = render(mocks.adapter.classificacio);
  return within(container).getAllByRole('button');
}
const escrits = () => mocks.setLocal.mock.calls.map(([id, camp, valor]) => [id, camp, valor]);

test('la pujada usa la configuració del workspace A i després la de B', async () => {
  mocks.upload.mockResolvedValue({ url: 'sdp-media://result' });
  const { rerender } = render(<NotesEditor />);
  const file = new Blob(['image'], { type: 'image/png' });
  await mocks.adapter.uploadMedia(file);
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: 'tenant-A' }, mocks.config);
  mocks.config = { tenantId: 'tenant-B' };
  rerender(<NotesEditor />);
  await mocks.adapter.uploadMedia(file);
  expect(mocks.upload).toHaveBeenLastCalledWith(file, { carpeta: 'notes', tenantId: 'tenant-B' }, mocks.config);
});


test('l’editor conserva la data i hora de la nota, també fora de la llavor', () => {
  const note = { id: 'personal', formattedDate: '02/01/26', formattedTime: '09:37', updatedAt: '2026-01-02T08:37:00Z' };
  render(<NotesEditor activeNote={note} />);
  expect(mocks.adapter.document).toBe(note);
  expect(mocks.adapter.document.formattedTime).toBe('09:37');
});

/* T5 · una nota connectada és d'altri: es compartix, no es publica, i l'editor ho diu. */
test('una nota connectada compartix en lloc de publicar i avisa de qui és el contingut', () => {
  const connectada = { id: 'c', folderId: 'f-connectats', categories: ['Sistema'], tags: [], origen: { tipus: 'connexio', itemId: 'x', autorNom: 'Sóc de Poble' } };
  mocks.session = { currentUser: { id: 'U' } };
  render(<NotesEditor activeNote={connectada} />);
  expect(mocks.adapter.publishLabel).toBe('Compartir');
  expect(mocks.adapter.publish).toBe(mocks.compartir);
  expect(screen.getByText(/Este contingut és de Sóc de Poble/)).toBeTruthy();
});

test('una nota pròpia publica com sempre, sense etiqueta especial ni avís', () => {
  mocks.session = { currentUser: { id: 'U' } };
  render(<NotesEditor activeNote={{ id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter.publishLabel).toBeNull();
  expect(mocks.adapter.publish).toBe(mocks.publish);
  expect(screen.queryByText(/Element connectat/)).toBeNull();
});

test('E8 · la barra grisa no té interfície morta: l’adaptador porta la botonera, no metaActions', () => {
  render(<NotesEditor activeNote={{ id: 'personal', folderId: 'f-mur', categories: ['Sistema'], tags: [] }} />);
  expect(mocks.adapter).not.toHaveProperty('metaActions');
  expect(botonera().map((b) => b.textContent)).toEqual(['CarpetesMur', 'Categories1', 'Etiquetes0']);
});

test('carpeta: se’n tria una i s’escriu el folderId de la nota', () => {
  const nota = { id: 'p', folderId: 'f-mur', categories: ['Sistema'], tags: [] };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  fireEvent.click(botonera()[0]);
  fireEvent.click(screen.getByRole('radio', { name: 'Altres notes' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(escrits()).toEqual([['p', 'folderId', 'f-notes']]);
});

test('E5 · el primer desat de la nota de benvinguda conserva totes les etiquetes antigues', () => {
  const n1 = { id: 'n1', folderId: 'f-mur', labels: ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble'], tags: ['Tutorial'] };
  mocks.notes = [n1];
  render(<NotesEditor activeNote={n1} />);
  expect(botonera().map((b) => b.textContent)).toEqual(['CarpetesMur', 'Categories0', 'Etiquetes4']);
  fireEvent.click(botonera()[2]);
  for (const nom of n1.labels) expect(screen.getByRole('checkbox', { name: nom }).checked).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
  expect(escrits()).toEqual([
    ['n1', 'categories', ['General']],
    ['n1', 'tags', ['Sistema', 'Productivitat', 'Tutorial', 'Sóc de Poble']]
  ]);
});

test('reanomenar una categoria la canvia a totes les notes que la porten', () => {
  mocks.notes = [
    { id: 'a', folderId: 'f-mur', categories: ['Receptes'], tags: [] },
    { id: 'b', folderId: 'f-mur', categories: ['Receptes', 'Hort'], tags: [] },
    { id: 'c', folderId: 'f-mur', categories: ['Agenda'], tags: [] }
  ];
  render(<NotesEditor activeNote={mocks.notes[0]} />);
  fireEvent.click(botonera()[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Reanomenar «Receptes»' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Nou nom per a «Receptes»' }), { target: { value: 'Cuina' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  expect(escrits()).toEqual([['a', 'categories', ['Cuina']], ['b', 'categories', ['Cuina', 'Hort']]]);
});

test('esborrar una categoria la lleva de totes les notes; qui es queda sense rep «General»', () => {
  mocks.notes = [
    { id: 'a', folderId: 'f-mur', categories: ['Receptes', 'Hort'], tags: [] },
    { id: 'b', folderId: 'f-mur', categories: ['Receptes'], tags: [] }
  ];
  render(<NotesEditor activeNote={mocks.notes[0]} />);
  fireEvent.click(botonera()[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Esborrar «Receptes»' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar: esborrar «Receptes»' }));
  expect(escrits()).toEqual([['a', 'categories', ['Hort']], ['b', 'categories', ['General']]]);
});

test('orfandat: la darrera categoria de la nota no es pot desmarcar', () => {
  const nota = { id: 'a', folderId: 'f-mur', categories: ['Receptes'], tags: [] };
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  fireEvent.click(botonera()[1]);
  expect(screen.getByRole('checkbox', { name: 'Receptes' }).disabled).toBe(true);
  expect(screen.getByText(/Cal almenys una categoria/)).toBeTruthy();
});

test('sense EDITAR: el Foraster sense nota escriu directament en una còpia local', () => {
  const { rerender } = render(<NotesEditor />);
  expect(mocks.adapter.identityActions ?? null).toBeNull();
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.saveRemote).toBeUndefined();
  mocks.adapter.updateLocal('prova-local', 'title', 'Prova meua');
  rerender(<NotesEditor />);
  expect(mocks.adapter.document.title).toBe('Prova meua');
});

/* ── Borrar: diàleg de paperera, arxiu o esborrat definitiu ─────────────── */
const nota = { id: 'p', title: '<p>Llista de la compra</p>', folderId: 'f-notes', categories: ['General'], tags: [], revision: 2 };
function obriBorrar() {
  mocks.session = { currentUser: { id: 'u' } };
  mocks.potEsborrar = true;
  mocks.notes = [nota];
  render(<NotesEditor activeNote={nota} />);
  act(() => mocks.adapter.deleteDocument(nota));
  return screen.getByRole('dialog');
}

test('sense la capacitat cicleNotes, o per al Foraster amb notes remotes, no hi ha «Borrar»', () => {
  mocks.session = { currentUser: { id: 'u' } };
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.deleteDocument).toBeUndefined();
  cleanup();
  mocks.session = {};
  mocks.potEsborrar = true;
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.deleteDocument).toBeUndefined();
  cleanup();
  // La còpia de prova del Foraster tampoc es borra.
  mocks.config = { tenantId: 'tenant-A', dataMode: 'seed' };
  render(<NotesEditor />);
  expect(mocks.adapter.document.id).toBe('prova-local');
  expect(mocks.adapter.deleteDocument).toBeUndefined();
});

test('en mode seed les notes són del dispositiu: el Foraster les pot borrar', () => {
  mocks.config = { tenantId: 'tenant-A', dataMode: 'seed' };
  mocks.potEsborrar = true;
  render(<NotesEditor activeNote={nota} />);
  expect(mocks.adapter.deleteDocument).toBeTypeOf('function');
});

test('el diàleg ofereix tres eixides, amb la definitiva al final', () => {
  const dialeg = obriBorrar();
  expect(within(dialeg).getByRole('heading').textContent).toBe('Què vols fer amb «Llista de la compra»?');
  const botons = within(dialeg).getAllByRole('button').map((b) => b.textContent);
  expect(botons).toEqual(['', 'Guardar durant 30 dies', 'Arxivar', 'Borrar definitivament']);
  expect(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }).className).toContain('sdp-boto--perill');
  expect(within(dialeg).getByText(/es guarda a la paperera 30 dies; després s’esborra per sempre/)).toBeTruthy();
});

test('«Guardar durant 30 dies» mou a la paperera i «Arxivar», a l’arxiu', async () => {
  let dialeg = obriBorrar();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Guardar durant 30 dies' })); });
  expect(mocks.mou).toHaveBeenLastCalledWith(nota, 'paperera');
  expect(screen.queryByRole('dialog')).toBeNull();
  cleanup();
  dialeg = obriBorrar();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Arxivar' })); });
  expect(mocks.mou).toHaveBeenLastCalledWith(nota, 'arxivada');
  expect(mocks.esborra).not.toHaveBeenCalled();
});

test('«Borrar definitivament» demana un segon pas dins del mateix diàleg', async () => {
  const dialeg = obriBorrar();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(within(dialeg).getByRole('heading').textContent).toBe('Borrar per sempre «Llista de la compra»?');
  expect(within(dialeg).getAllByRole('button').map((b) => b.textContent)).toEqual(['', 'Enrere', 'Borrar per sempre']);
  // Llei de la Por Orgànica: un Intro distret al segon pas torna arrere.
  expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: 'Enrere' }));
  expect(mocks.esborra).not.toHaveBeenCalled();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Enrere' }));
  expect(within(dialeg).getByRole('button', { name: 'Arxivar' })).toBeTruthy();
  // «Enrere» desmunta el botó que tenia el focus: torna a «Borrar definitivament», no al body.
  expect(document.activeElement).toBe(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar per sempre' })); });
  expect(mocks.esborra).toHaveBeenCalledWith(nota);
  expect(mocks.mou).not.toHaveBeenCalled();
});

test('Escape i «Tancar» tanquen sense tocar la nota; si falla, el diàleg es queda obert', async () => {
  let dialeg = obriBorrar();
  fireEvent(dialeg, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  cleanup();
  dialeg = obriBorrar();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(mocks.mou).not.toHaveBeenCalled();
  expect(mocks.esborra).not.toHaveBeenCalled();
  cleanup();
  mocks.mou.mockResolvedValueOnce(false);
  dialeg = obriBorrar();
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Arxivar' })); });
  expect(screen.getByRole('dialog')).toBeTruthy();
});

test('una persona connectada sense nota veu l’estat buit, sense cap botó', () => {
  mocks.session = { currentUser: { id: 'u' } };
  render(<NotesEditor />);
  expect(mocks.adapter.document).toBeNull();
  expect(mocks.adapter.identityActions ?? null).toBeNull();
});
