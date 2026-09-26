import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const m = vi.hoisted(() => ({ params: new URLSearchParams(), navigate: vi.fn(), creaNota: vi.fn(), creaFil: vi.fn(), submission: vi.fn(), toast: vi.fn(), refresh: vi.fn(), user: { id: 'A' }, generation: 1, workspace: 'A', actor: null }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, useSearchParams: () => [m.params] }));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <div>{children}</div> }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_key, fallback) => fallback }) }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user, generacio: m.generation }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actor: m.actor }) }));
vi.mock('../mur/MurContext', () => ({ useMur: () => ({ sendSectionSubmission: m.submission }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: m.creaNota, workspaceKey: m.workspace }) }));
vi.mock('../xat/XatContext', () => ({ useXat: () => ({ creaFil: m.creaFil }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ refresh: m.refresh }) }));
import ConnectarSection from './ConnectarSection';
import { CLAU_APAGADA, ESDEVENIMENT_DOM } from '../../data/telemetria.js';
/* Telemetria real amb `window.umami` d'amfitrió: cap prova depén del backend ni toca la xarxa. */
let vistos;
const escolta = (event) => vistos.push(event.detail);
const desaments = () => vistos.filter((intent) => intent.nom === 'connectar-desa');
afterEach(() => { cleanup(); window.removeEventListener(ESDEVENIMENT_DOM, escolta); delete window.umami; });
beforeEach(() => { vi.clearAllMocks(); m.params = new URLSearchParams(); m.workspace = 'A'; m.generation = 1; m.user = { id: 'A' }; m.actor = { tipus: 'persona', id: 'A', nom: 'a@poble.test', avatar: null }; m.creaNota.mockResolvedValue({ id: 'new-note' }); m.creaFil.mockResolvedValue('new-thread'); m.submission.mockResolvedValue({});
  vistos = []; window.localStorage.removeItem(CLAU_APAGADA); window.umami = { track: vi.fn() }; window.addEventListener(ESDEVENIMENT_DOM, escolta); });
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
test('confirmar «Connectar a Xat» compta connectar-desa amb destí i privacitat, sense el context', () => {
  m.params = new URLSearchParams({ item_id: 'Títol heretat' }); render(<ConnectarSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Connectar a Xat' }));
  expect(desaments()).toHaveLength(1);
  expect(desaments()[0].dades).toEqual({ desti: 'xat', privacitat: 'privada' });
  expect(window.umami.track).toHaveBeenCalledWith('connectar-desa', { desti: 'xat', privacitat: 'privada' });
  expect(JSON.stringify(desaments()[0])).not.toContain('heretat');
});
test('confirmar un desament compta una vegada i no porta títol, text ni etiquetes de la persona', async () => {
  let resolve; m.creaNota.mockImplementation(() => new Promise(done => { resolve = done; }));
  render(<ConnectarSection />); selectAndFill('Notes');
  fireEvent.change(screen.getByLabelText('Afig una etiqueta lliure...'), { target: { value: 'Etiqueta íntima' } });
  fireEvent.click(screen.getByRole('button', { name: 'Afegir' }));
  const boto = screen.getByRole('button', { name: 'Guardar i anar a Notes' });
  fireEvent.click(boto); fireEvent.click(boto); // el segon clic topa amb el desament en curs
  expect(desaments()).toHaveLength(1);
  expect(desaments()[0].dades).toEqual({ desti: 'notes', privacitat: 'privada' });
  const enviat = JSON.stringify([desaments()[0], window.umami.track.mock.calls]);
  for (const text of ['Títol', 'literal', 'Primer', 'Segon', 'íntima']) expect(enviat).not.toContain(text);
  await act(async () => resolve({ id: 'new-note' }));
  expect(m.navigate).toHaveBeenCalledWith('/notes?nota=new-note');
});
test('I2 · com a entitat, el Mur i el Mercat porten el nom i el logotip de l’entitat, no els de la persona', async () => {
  m.user = { id: 'A', user_metadata: { name: 'Pep', avatar_url: 'https://poble.test/pep.webp' } };
  m.actor = { tipus: 'entitat', id: 'O', nom: 'Forn de Dalt', avatar: 'https://poble.test/forn.webp' };
  render(<ConnectarSection />); selectAndFill('Mur');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i anar a Mur' }));
  await waitFor(() => expect(m.submission).toHaveBeenCalledTimes(1));
  const mur = m.submission.mock.calls[0][0].payload;
  expect(mur).toMatchObject({ author: 'Forn de Dalt', author_name: 'Forn de Dalt', author_avatar: 'https://poble.test/forn.webp' });
  cleanup(); m.submission.mockClear();
  render(<ConnectarSection />); selectAndFill('Mercat.*intercanvis');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i anar a Mercat' }));
  await waitFor(() => expect(m.submission).toHaveBeenCalledTimes(1));
  const mercat = m.submission.mock.calls[0][0].payload;
  expect(mercat).toMatchObject({ seller: 'Forn de Dalt', avatar_url: 'https://poble.test/forn.webp' });
  expect(JSON.stringify([mur, mercat])).not.toMatch(/Pep|pep\.webp/);
});
test('com a persona, el payload públic no agafa mai el nom de la identitat (pot ser el correu)', async () => {
  m.user = { id: 'A', user_metadata: { avatar_url: 'https://poble.test/pep.webp' } };
  render(<ConnectarSection />); selectAndFill('Mercat.*intercanvis');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar i anar a Mercat' }));
  await waitFor(() => expect(m.submission).toHaveBeenCalledTimes(1));
  const { payload } = m.submission.mock.calls[0][0];
  expect(payload).toMatchObject({ seller: 'Foraster', avatar_url: 'https://poble.test/pep.webp' });
  expect(JSON.stringify(payload)).not.toContain('a@poble.test');
});
