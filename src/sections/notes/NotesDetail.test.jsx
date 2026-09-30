import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ resolve: vi.fn(), resol: vi.fn() }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ resolveNote: m.resolve, workspaceKey: 'A' }) }));
vi.mock('./NotesContext.jsx', () => ({ useNotes: () => ({ resolConflicteEsborrany: m.resol }) }));
vi.mock('./NotesEditor.jsx', () => ({ default: ({ activeNote }) => <div data-testid="editor">{activeNote?.content}</div> }));
vi.mock('./ConnexioDetall.jsx', () => ({ ConnexioDetall: ({ nota }) => <div data-testid="lector">{nota?.origen?.titol}</div> }));
import NotesDetail from './NotesDetail.jsx';
const ORIGEN = { tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta', titol: 'Samarreta', ruta: '/mercat/samarreta' };
afterEach(cleanup);
test('el resum no munta l’editor fins que arriba el cos complet', async () => {
  m.resolve.mockResolvedValue({ status: 'found' });
  const { rerender, unmount } = render(<NotesDetail activeNote={{ id: 'n', revision: 1, contentLoaded: false }} />);
  expect(screen.queryByTestId('editor')).toBeNull();
  await waitFor(() => expect(m.resolve).toHaveBeenCalled());
  const signal = m.resolve.mock.calls[0][1].signal;
  rerender(<NotesDetail activeNote={{ id: 'n', revision: 1, contentLoaded: true, content: 'cos complet' }} />);
  expect(screen.getByTestId('editor').textContent).toBe('cos complet');
  expect(signal.aborted).toBe(true); unmount();
});

test('D01: sense conflicte no hi ha cap pregunta; amb conflicte, la decisió és explícita', async () => {
  m.resol.mockResolvedValue(true);
  const { rerender } = render(<NotesDetail activeNote={{ id: 'n', revision: 3, content: 'al dia' }} />);
  expect(screen.queryByRole('button', { name: 'Conservar el meu i sobreescriure', hidden: true })).toBeNull();
  const nota = { id: 'n', revision: 3, content: 'meu', draftConflict: { baseRevision: 1, remoteRevision: 3 } };
  rerender(<NotesDetail activeNote={nota} />);
  expect(screen.getByTestId('editor').textContent).toBe('meu');
  fireEvent.click(screen.getByRole('button', { name: 'Conservar el meu i sobreescriure', hidden: true }));
  await waitFor(() => expect(m.resol).toHaveBeenCalledWith(nota, 'meu'));
});

/* D4 (excepció del Mestre, 260930; desfà T54) · Una connexió és una còpia
   editable: s'obri amb l'editor, com qualsevol nota, i ja no amb el lector
   (ConnexioDetall). Les proves T54 que fixaven «obri el lector i no munta
   l'editor» s'han actualitzat a l'ordre nova. */
test('D4: una connexió obri l’editor (còpia editable), no el lector', () => {
  render(<NotesDetail activeNote={{ id: 'c', revision: 1, content: 'cos', origen: ORIGEN }} />);
  expect(screen.getByTestId('editor').textContent).toBe('cos');
  expect(screen.queryByTestId('lector')).toBeNull();
});

test('D4: en remot el resum no porta origen; l’editor espera el cos complet i després obri la connexió', async () => {
  m.resolve.mockResolvedValue({ status: 'found' });
  const { rerender } = render(<NotesDetail activeNote={{ id: 'c', revision: 1, contentLoaded: false }} />);
  expect(screen.queryByTestId('editor')).toBeNull();
  expect(screen.queryByTestId('lector')).toBeNull();
  await waitFor(() => expect(m.resolve).toHaveBeenCalled());
  rerender(<NotesDetail activeNote={{ id: 'c', revision: 1, contentLoaded: true, content: 'cos', origen: ORIGEN }} />);
  expect(screen.getByTestId('editor').textContent).toBe('cos');
  expect(screen.queryByTestId('lector')).toBeNull();
});

/* La connexió també espera el resum pendent: amb l'origen ja al resum (seed,
   local) i el cos encara en camí, ni lector ni editor. */
test('T54: amb origen però sense el cos complet, «Carregant la nota…» i ni lector ni editor', async () => {
  m.resolve.mockReturnValue(new Promise(() => {}));
  render(<NotesDetail activeNote={{ id: 'c', revision: 1, contentLoaded: false, origen: ORIGEN }} />);
  expect(screen.getByRole('status').textContent).toBe('Carregant la nota…');
  expect(screen.queryByTestId('lector')).toBeNull();
  expect(screen.queryByTestId('editor')).toBeNull();
  await waitFor(() => expect(m.resolve).toHaveBeenCalled());
});

test('D4: la decisió D01 també hi és per a una connexió, oberta a l’editor', () => {
  const nota = { id: 'c', revision: 3, origen: ORIGEN, draftConflict: { baseRevision: 1, remoteRevision: 3 } };
  render(<NotesDetail activeNote={nota} />);
  expect(screen.getByTestId('editor')).toBeTruthy();
  expect(screen.queryByTestId('lector')).toBeNull();
  expect(screen.getByRole('button', { name: 'Conservar el meu i sobreescriure', hidden: true })).toBeTruthy();
});
