/* Revisió final R16a (carril FA) · El botó de publicar d'una nota del Bloc
   diu «Publicat» (verd) només si el Mur té la versió que s'edita. Una nota
   publicada s'edita com a esborrany i el Mur només canvia amb «Actualitzar al
   Mur» (publishNote): «desat al servidor» no vol dir «al Mur».
   Tot de veres (NotesProvider, NotesEditor, DocumentEditor i la cua de desat
   amb la memòria de proves); només la barra rica és un doble que guarda les
   props, com a DocumentEditor.botoPublicacio.test.jsx, i el servidor de
   notes i el Mur són dobles amb revisions de veres. */
import { act, cleanup, render } from '@testing-library/react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ barra: null, adapter: null, useDades: null, send: null }));
vi.mock('./NotesDataContext', () => ({ useNotesData: () => mocks.useDades() }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: (props) => { mocks.barra = props; return <div className="sdp-editor-tools" />; },
  UniversalRichTextContent: () => <div />
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentEditor', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, DocumentEditor: (props) => { mocks.adapter = props.adapter; return <real.DocumentEditor {...props} />; } };
});
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: (s) => s, t: (_clau, text) => text }),
  useUIStateOpcional: () => null
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(), Link: 'a', useSearchParams: () => [new URLSearchParams(''), vi.fn()]
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => ({ actor: { tipus: 'persona', id: 'U', nom: 'Pepa' }, actorId: 'U', memberships: [] })
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' }, estat: 'dins' }), ESTAT: { DINS: 'dins' } }));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({ status: 'ready', sendSectionSubmission: mocks.send, feedPosts: [], events: [], marketItems: [] })
}));
vi.mock('../../data/backendPort.js', () => ({ uploadToStorage: vi.fn(), promoteToPublic: vi.fn(), teCapacitat: () => false }));
vi.mock('./GlobalSaveManager.js', async (importOriginal) => {
  const real = await importOriginal();
  const registres = new Map();
  return { ...real, bgSaveManager: new real.GlobalSaveManager({ persist: async (clau, transforma) => {
    const seguent = transforma(registres.get(clau) || {}); registres.set(clau, seguent); return seguent;
  } }) };
});

import { NotesProvider, useNotes } from './NotesContext.jsx';
import NotesEditor from './NotesEditor.jsx';
import { bgSaveManager } from './GlobalSaveManager.js';

const AMBIT = 'ambit-fa';
const Dades = createContext(null);
mocks.useDades = function useDadesDeProva() { return useContext(Dades); };

/* El servidor de notes: CAS de revisió, i la llista viva torna la fila desada (NotesDataContext). */
function ProveidorDeDades({ servidor, children }) {
  const [notes, setNotes] = useState(() => [...servidor.values()]);
  const updateNote = useCallback(async (id, canvis, revisio) => {
    const actual = servidor.get(id);
    if (!actual || actual.revision !== revisio) throw Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 });
    const nova = { ...actual, ...canvis, revision: actual.revision + 1 };
    servidor.set(id, nova);
    setNotes([...servidor.values()]);
    return nova;
  }, [servidor]);
  const valor = useMemo(() => ({
    notes, noteFolders: [], scopeKey: AMBIT, workspaceKey: 'sessio-fa', notesComplete: true, status: 'ready',
    config: { dataMode: 'remote', tenantId: '00000000-0000-4000-8000-0000000000a1' }, updateNote
  }), [notes, updateNote]);
  return <Dades.Provider value={valor}>{children}</Dades.Provider>;
}

/* Com NotesSection: la nota oberta és la de la llista viva. */
function NotaOberta({ id }) {
  const { notes } = useNotes();
  const nota = notes.find((n) => n.id === id);
  return nota ? <NotesEditor activeNote={nota} /> : null;
}

let comptador = 0;
let id;
const munta = (nota) => {
  comptador += 1;
  id = `n-pub-fa-${comptador}`;
  const servidor = new Map([[id, { ...nota, id }]]);
  render(<ProveidorDeDades servidor={servidor}><NotesProvider><NotaOberta id={id} /></NotesProvider></ProveidorDeDades>);
  return servidor;
};
const boto = () => mocks.barra.publishState;
const desa = async (camp, valor) => {
  let promesa;
  act(() => { promesa = mocks.adapter.saveRemote(id, camp, valor); });
  const enCami = boto();
  await act(async () => { await bgSaveManager.flush(AMBIT, id); await promesa; });
  return enCami;
};
/* «Actualitzar al Mur»: el selector de visibilitat confirma «pública» (NotesEditor · onTria). */
const actualitzaAlMur = async () => {
  let resultat;
  await act(async () => {
    resultat = await mocks.adapter.visibilitat.onTria(true, mocks.adapter.document).then(() => 'fet', (error) => error);
  });
  return resultat;
};

beforeEach(() => {
  mocks.barra = null;
  mocks.adapter = null;
  mocks.send = vi.fn(async () => undefined);
});
afterEach(cleanup);

const PUBLICADA = { title: 'Festa', content: '<p>Cos</p>', folderId: 'f-mur', isPublished: true, revision: 3, contentLoaded: true };

test('publicada en una altra sessió: no se sap si el Mur la té, cap verd; editada i desada, «pendent»', async () => {
  const servidor = munta({ ...PUBLICADA, publishedSubmissionId: 'sub-7' });
  expect(mocks.adapter.publicacioAlDia).toBeNull();
  expect(boto()).toBeNull();

  expect(await desa('title', 'Festa canviada')).toBe('pendent');
  expect(servidor.get(id)).toMatchObject({ title: 'Festa canviada', revision: 4 });
  expect(mocks.adapter.estatDesament.estat).toBe('net');
  // El servidor té l'esborrany; el Mur, no (cap publishNote): mai «Publicat».
  expect(mocks.adapter.publicacioAlDia).toBe(false);
  expect(boto()).toBe('pendent');
  expect(mocks.send).not.toHaveBeenCalled();
});

test('«Actualitzar al Mur» que acaba bé: «Publicat»; el pròxim desat el torna «pendent», i publicar-lo, «Publicat»', async () => {
  const servidor = munta({ ...PUBLICADA, publishedSubmissionId: 'sub-8' });
  expect(await actualitzaAlMur()).toBe('fet');
  expect(mocks.send).toHaveBeenCalledTimes(1);
  expect(mocks.send.mock.calls[0][0]).toMatchObject({ id: 'sub-8', payload: { title: 'Festa' } });
  expect(boto()).toBe('publicat');

  expect(await desa('heroImage', '/assets/mur/festa.webp#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6')).toBe('pendent');
  expect(mocks.adapter.estatDesament.estat).toBe('net');
  expect(boto()).toBe('pendent');

  expect(await actualitzaAlMur()).toBe('fet');
  expect(mocks.send).toHaveBeenCalledTimes(2);
  expect(mocks.send.mock.calls[1][0].payload.image).toContain('#sdp-crop=');
  expect(servidor.get(id).revision).toBe(mocks.adapter.document.revision);
  expect(boto()).toBe('publicat');
});

test('una publicació que falla no posa el verd: el Mur continua amb la versió d’abans', async () => {
  munta({ ...PUBLICADA, publishedSubmissionId: 'sub-9' });
  await desa('title', 'Festa nova');
  mocks.send.mockRejectedValueOnce(new Error('xarxa'));
  expect(await actualitzaAlMur()).toBeInstanceOf(Error);
  expect(boto()).toBe('pendent');
});

test('una nota privada continua «pendent», també desada', async () => {
  munta({ title: 'Privada', content: '<p>Cos</p>', folderId: 'f-notes', isPublished: false, revision: 1, contentLoaded: true });
  expect('publicacioAlDia' in mocks.adapter).toBe(false);
  expect(boto()).toBe('pendent');
  await desa('title', 'Privada i desada');
  expect(boto()).toBe('pendent');
});
