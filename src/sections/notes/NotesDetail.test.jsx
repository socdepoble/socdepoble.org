import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ resolve: vi.fn(), resol: vi.fn() }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ resolveNote: m.resolve, workspaceKey: 'A' }) }));
vi.mock('./NotesContext.jsx', () => ({ useNotes: () => ({ resolConflicteEsborrany: m.resol }) }));
vi.mock('./NotesEditor.jsx', () => ({ default: ({ activeNote }) => <div data-testid="editor">{activeNote?.content}</div> }));
import NotesDetail from './NotesDetail.jsx';
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
