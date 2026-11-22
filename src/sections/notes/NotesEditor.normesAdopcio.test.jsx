/* v1.2.20 · Gauntlet R1 (L2-03) · La guarda d'identitat de DOL-54 dins del reintent de les normes
   (SDP-MOD-428, publicaAmbMotiu):
   · el motiu de la cancel·lació arriba al panell, no el genèric «Torna-ho a provar»;
   · un desmuntatge que provoca la mateixa publicació (PublicacioEditable adopta la fila i la
     selecció passa a la nota: un altre NotesEditor amb la mateixa identitat) no anul·la el
     reintent que la persona ha acceptat;
   · tancar l'editor o canviar d'identitat durant el reintent continua cancel·lant.
   Els mateixos dobles que NotesEditor.normes.test.jsx; la porta de les normes és la de veres. */
import { act, cleanup, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => {
  const NET = Object.freeze({ estat: 'net', problema: null, quarantena: Object.freeze([]) });
  const m = {
    adapter: null, config: { tenantId: '00000000-0000-4000-8000-0000000000a1' }, session: { currentUser: { id: 'U' } },
    identitat: { actorId: 'user' }, core: { agents: [] }, publish: vi.fn(), showToast: vi.fn(), desament: vi.fn(() => NET)
  };
  m.toast = { showToast: m.showToast };
  m.notes = {
    noteFolders: [], t: (_clau, reserva) => reserva, config: m.config, workspaceKey: m.config.tenantId,
    notes: [], setLocalNoteField: vi.fn(), notesComplete: true, mouNota: vi.fn(), esborraNota: vi.fn(), potEsborrar: false,
    publishNote: (...a) => m.publish(...a), compartirNota: vi.fn(), scopeKey: 'A'
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
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';

const NOTA = Object.freeze({ id: 'n-adopcio', folderId: 'f-1', categories: [], tags: [], title: 'Festa', isPublished: false });
const REBUIG_NORMES = () => new Error('Supabase 403: {"code":"42501","message":"SDP-MOD-428: cal acceptar les normes de convivència."}');
const CANCELADA = 'La identitat ha canviat. No s’ha enviat esta publicació; torna a revisar-la amb la identitat actual.';

/* La pantalla del Bloc: `clau` remunta l'editor (la selecció passa a una altra peça) i `muntat`
   el tanca. La porta de les normes és estable, com la de ModeracioContext. */
const control = { posa: null, normes: null };
function Arnes() {
  const [estat, setEstat] = useState({ clau: 'publicacio', muntat: true, pintada: 0 });
  control.posa = (canvi) => setEstat((previ) => ({ ...previ, ...canvi, pintada: previ.pintada + 1 }));
  return estat.muntat ? (
    <ModeracioContext.Provider value={{ asseguraNormes: control.normes }}>
      <NotesEditor key={estat.clau} activeNote={NOTA} />
    </ModeracioContext.Provider>
  ) : null;
}
const canvia = (canvi) => act(async () => { control.posa(canvi); });

beforeEach(() => {
  mocks.adapter = null;
  mocks.notes.scopeKey = 'A';
  mocks.publish.mockReset();
  control.normes = vi.fn().mockResolvedValue(true);
});
afterEach(cleanup);

test('L2-03 · l’adopció desmunta l’editor amb el 428 en vol: acceptades les normes, es publica una sola vegada més', async () => {
  mocks.publish
    .mockImplementationOnce(async () => { await canvia({ clau: 'nota-adoptada' }); throw REBUIG_NORMES(); })
    .mockResolvedValueOnce(true);
  render(<Arnes />);
  await expect(mocks.adapter.visibilitat.onTria(true, NOTA)).resolves.toBe(true);
  expect(control.normes.mock.calls).toEqual([[], [{ rebutjades: true }]]);
  expect(mocks.publish).toHaveBeenCalledTimes(2);
});

test('L2-03 · tancar l’editor durant la publicació (cap altre editor amb la identitat) cancel·la el reintent amb el seu motiu', async () => {
  mocks.publish.mockImplementationOnce(async () => { await canvia({ muntat: false }); throw REBUIG_NORMES(); });
  render(<Arnes />);
  await expect(mocks.adapter.visibilitat.onTria(true, NOTA)).rejects.toThrow(CANCELADA);
  expect(mocks.publish).toHaveBeenCalledTimes(1);
});

test('L2-03 · la peça nova amb una altra identitat no hereta el reintent: es cancel·la amb el motiu', async () => {
  mocks.publish.mockImplementationOnce(async () => {
    mocks.notes.scopeKey = 'B';
    await canvia({ clau: 'nota-adoptada' });
    throw REBUIG_NORMES();
  });
  render(<Arnes />);
  await expect(mocks.adapter.visibilitat.onTria(true, NOTA)).rejects.toThrow(CANCELADA);
  expect(mocks.publish).toHaveBeenCalledTimes(1);
});

test('L2-03 · si la identitat canvia amb el segon diàleg obert, el panell diu «La identitat ha canviat», no «Torna-ho a provar»', async () => {
  mocks.publish.mockRejectedValueOnce(REBUIG_NORMES());
  control.normes = vi.fn()
    .mockResolvedValueOnce(true)
    .mockImplementationOnce(async () => { mocks.notes.scopeKey = 'B'; await canvia({}); return true; });
  render(<Arnes />);
  await expect(mocks.adapter.visibilitat.onTria(true, NOTA)).rejects.toThrow(CANCELADA);
  expect(mocks.publish).toHaveBeenCalledTimes(1);
});
