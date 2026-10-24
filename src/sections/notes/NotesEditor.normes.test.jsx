/* Fase D (261020, tasca 2; pla 261020_1300 · Google Play UGC) · Abans de la
   primera publicació, les normes de convivència: onTria del selector de
   visibilitat demana asseguraNormes (ModeracioContext). Declinar no publica
   res, deixa el selector obert i diu per què, en línia (crítica 261020, 10);
   acceptar publica una vegada. Sense proveïdor, com sempre. Els mateixos
   dobles que NotesEditor.test.jsx; el selector és el de veres. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
/* Valors estables (hoisted): un objecte nou a cada pintat refaria l'adaptador. */
const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  const m = {
    adapter: null, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' }, session: { currentUser: { id: 'U' } },
    identitat: { actorId: 'user' }, core: { agents: [] }, toast: null,
    publish: vi.fn(), compartir: vi.fn(), showToast: vi.fn(), desament: vi.fn(() => NET)
  };
  m.toast = { showToast: m.showToast };
  m.notes = {
    noteFolders: [], t: (_clau, reserva) => reserva, config: m.config, workspaceKey: m.config.tenantId,
    notes: [], setLocalNoteField: vi.fn(), notesComplete: true, mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: false,
    publishNote: (...a) => m.publish(...a), compartirNota: (...a) => m.compartir(...a), scopeKey: undefined
  };
  return m;
});
vi.mock('./NotesContext', () => ({ useNotes: () => mocks.notes, etiquetesDeNota: () => [] }));
vi.mock('./useEstatDesamentNota.js', async (importOriginal) => ({
  ...await importOriginal(),
  useEstatDesamentNota: (scope, id) => mocks.desament(scope, id)
}));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { mocks.adapter = adapter; return null; } }));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), teCapacitat: () => true }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.session, ESTAT: { DINS: 'dins' } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => mocks.toast }));
import NotesEditor from './NotesEditor.jsx';
import { SelectorVisibilitat } from '../../components/universal/SelectorVisibilitat.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';

const NOTA = Object.freeze({ id: 'n1', folderId: 'f-1', categories: [], tags: [], title: 'Fira' });
const ambModeracio = (asseguraNormes) => (
  <ModeracioContext.Provider value={{ asseguraNormes }}><NotesEditor activeNote={NOTA} /></ModeracioContext.Provider>
);

beforeEach(() => {
  mocks.adapter = null;
  mocks.publish.mockReset().mockResolvedValue(true);
  mocks.compartir.mockReset();
});
afterEach(cleanup);

test('declinar les normes no publica res i torna el motiu, que el selector diu en línia sense tancar-se', async () => {
  const asseguraNormes = vi.fn().mockResolvedValue(false);
  render(ambModeracio(asseguraNormes));
  await expect(mocks.adapter.visibilitat.onTria(true, NOTA)).rejects.toThrow('Per a publicar, cal acceptar les normes de convivència.');
  expect(asseguraNormes).toHaveBeenCalledTimes(1);
  expect(mocks.publish).not.toHaveBeenCalled();

  const onTanca = vi.fn();
  render(
    <SelectorVisibilitat obert esPublica={false} onTanca={onTanca}
      onTria={(publica) => mocks.adapter.visibilitat.onTria(publica, NOTA)} />
  );
  const selector = screen.getByRole('dialog', { name: 'Qui ho pot vore?' });
  act(() => { fireEvent.click(within(selector).getByRole('radio', { name: /Públic/ })); });
  await act(async () => { fireEvent.click(within(selector).getByRole('button', { name: 'Fer-lo públic' })); });
  expect(within(selector).getByRole('alert').textContent).toBe('Per a publicar, cal acceptar les normes de convivència.');
  expect(onTanca).not.toHaveBeenCalled();
  expect(mocks.publish).not.toHaveBeenCalled();
});

test('acceptar-les publica una sola vegada; triar «privada» no les demana', async () => {
  const asseguraNormes = vi.fn().mockResolvedValue(true);
  render(ambModeracio(asseguraNormes));
  expect(await mocks.adapter.visibilitat.onTria(true, NOTA)).toBe(true);
  expect(mocks.publish).toHaveBeenCalledTimes(1);
  expect(mocks.publish).toHaveBeenCalledWith(NOTA);
  asseguraNormes.mockClear();
  expect(await mocks.adapter.visibilitat.onTria(false, NOTA)).toBe(true);
  expect(asseguraNormes).not.toHaveBeenCalled();
});

/* Integració 261024 (Codex C-02) · Si el servidor la rebutja igualment per les
   normes (SDP-MOD-428: el record d'este dispositiu ja no valia), la porta es
   torna a obrir amb { rebutjades: true } i, acceptades, es publica UNA vegada
   més; declinades, el motiu en línia. Mai en bucle. */
const REBUIG_NORMES = () => new Error('Supabase 403: {"code":"42501","message":"SDP-MOD-428: cal acceptar les normes de convivència."}');

test('C-02 · el rebuig del servidor torna a obrir la porta i, acceptades, publica una sola vegada més', async () => {
  const asseguraNormes = vi.fn().mockResolvedValue(true);
  mocks.publish.mockReset().mockRejectedValueOnce(REBUIG_NORMES()).mockResolvedValueOnce(true);
  render(ambModeracio(asseguraNormes));
  expect(await mocks.adapter.visibilitat.onTria(true, NOTA)).toBe(true);
  expect(asseguraNormes.mock.calls).toEqual([[], [{ rebutjades: true }]]);
  expect(mocks.publish).toHaveBeenCalledTimes(2);
});

test('C-02 · declinades en tornar a preguntar, o rebutjada de nou, el motiu en línia i cap tercer intent', async () => {
  const declina = vi.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  mocks.publish.mockReset().mockRejectedValue(REBUIG_NORMES());
  render(ambModeracio(declina));
  await expect(mocks.adapter.visibilitat.onTria(true, NOTA)).rejects.toThrow('Per a publicar, cal acceptar les normes de convivència.');
  expect(declina).toHaveBeenCalledTimes(2);
  expect(mocks.publish).toHaveBeenCalledTimes(1);
  cleanup();

  const accepta = vi.fn().mockResolvedValue(true);
  render(ambModeracio(accepta));
  await expect(mocks.adapter.visibilitat.onTria(true, NOTA)).rejects.toThrow('Per a publicar, cal acceptar les normes de convivència.');
  expect(accepta).toHaveBeenCalledTimes(2);
  expect(mocks.publish).toHaveBeenCalledTimes(3);
});

test('sense proveïdor de moderació, publicar és el de sempre', async () => {
  render(<NotesEditor activeNote={NOTA} />);
  expect(await mocks.adapter.visibilitat.onTria(true, NOTA)).toBe(true);
  expect(mocks.publish).toHaveBeenCalledTimes(1);
});

test('asseguraNormes és estable: el mateix valor no refà l’adaptador', () => {
  const asseguraNormes = vi.fn().mockResolvedValue(true);
  const vista = render(ambModeracio(asseguraNormes));
  const abans = mocks.adapter;
  vista.rerender(ambModeracio(asseguraNormes));
  expect(mocks.adapter).toBe(abans);
});
