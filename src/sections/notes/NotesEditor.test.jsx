import React from 'react';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  adapter: null, upload: vi.fn(), config: { tenantId: 'tenant-A' }, notes: [], setLocal: vi.fn(), session: {}
}));
vi.mock('./NotesContext', () => ({
  useNotes: () => ({
    noteFolders: [], t: (_key, fallback) => fallback, config: mocks.config, workspaceKey: mocks.config.tenantId,
    notes: mocks.notes, setLocalNoteField: mocks.setLocal, notesComplete: true
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
  mocks.setLocal.mockReset();
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

test('una persona connectada sense nota veu l’estat buit, sense cap botó', () => {
  mocks.session = { currentUser: { id: 'u' } };
  render(<NotesEditor />);
  expect(mocks.adapter.document).toBeNull();
  expect(mocks.adapter.identityActions ?? null).toBeNull();
});
