import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ resolve: vi.fn() }));
vi.mock('./NotesDataContext.jsx', () => ({ useNotesData: () => ({ resolveNote: m.resolve, workspaceKey: 'A' }) }));
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
