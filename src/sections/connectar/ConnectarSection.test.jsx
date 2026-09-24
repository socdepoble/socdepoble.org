import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ params: new URLSearchParams(), navigate: vi.fn(), creaNota: vi.fn(), creaFil: vi.fn(), submission: vi.fn(), toast: vi.fn(), refresh: vi.fn(), user: { id: 'A' }, generation: 1, workspace: 'A' }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, useSearchParams: () => [m.params] }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <div>{children}</div> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_key, fallback) => fallback }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user, generacio: m.generation }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: m.submission }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: m.creaNota, workspaceKey: m.workspace }) }));
vi.mock('../xat/XatContext', () => ({ useXat: () => ({ creaFil: m.creaFil }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ refresh: m.refresh }) }));
import ConnectarSection from './ConnectarSection';
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); m.params = new URLSearchParams(); m.workspace = 'A'; m.generation = 1; m.user = { id: 'A' }; m.creaNota.mockResolvedValue({ id: 'new-note' }); m.creaFil.mockResolvedValue('new-thread'); m.submission.mockResolvedValue({}); });
function selectAndFill(area) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${area}`) }));
  fireEvent.change(screen.getByLabelText("Títol de l'element"), { target: { value: 'Títol <literal>' } });
  fireEvent.change(screen.getByLabelText('Descripció o contingut'), { target: { value: 'Primer\nSegon <literal>' } });
}
test('Notes crea en el port Notes i obri l’ID creat, sense section_submissions', async () => {
  render(<ConnectarSection />); selectAndFill('Notes');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i anar a Notes' }));
  await waitFor(() => expect(m.navigate).toHaveBeenCalledWith('/notes?nota=new-note'));
  expect(m.creaNota).toHaveBeenCalledWith({ title: 'Títol &lt;literal&gt;', content: 'Primer<br>Segon &lt;literal&gt;', tags: [] });
  expect(m.submission).not.toHaveBeenCalled();
});
test('destinatari explícit obri el fil amb el context de l’element', async () => {
  m.params = new URLSearchParams({ targetUserId: 'B', item_id: 'item-1', title: 'Una peça' });
  render(<ConnectarSection />); fireEvent.click(screen.getByRole('button', { name: 'Connectar a Xat' }));
  await waitFor(() => expect(m.navigate).toHaveBeenCalledWith('/xat/new-thread'));
  expect(m.creaFil).toHaveBeenCalledWith('B', 'Una peça');
});
test('sense destinatari conserva context per triar persona sense crear un fil arbitrari', () => {
  m.params = new URLSearchParams({ item_id: 'Títol heretat' }); render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Connectar a Xat' }));
  expect(m.navigate).toHaveBeenCalledWith('/xat?context=T%C3%ADtol%20heretat');
  expect(m.creaFil).not.toHaveBeenCalled();
});
test('resposta tardana de Notes després de canviar sessió no navega ni mostra dades anteriors', async () => {
  let resolve; m.creaNota.mockImplementation(() => new Promise(done => { resolve = done; }));
  const view = render(<ConnectarSection />); selectAndFill('Notes');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i anar a Notes' }));
  m.user = { id: 'B' }; m.generation++; m.workspace = 'B'; view.rerender(<ConnectarSection />);
  await act(async () => resolve({ id: 'note-A' }));
  expect(m.navigate).not.toHaveBeenCalled(); expect(m.toast).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Títol de l'element").value).toBe('');
});
test('Events torna a Mur, la ruta de llista existent', async () => {
  render(<ConnectarSection />); selectAndFill('Events');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i anar a Events' }));
  await waitFor(() => expect(m.navigate).toHaveBeenCalledWith('/mur'));
});
