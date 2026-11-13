/**
 * Onada R20 (Bucle 1 · Cas Real de Damià Llorens Jordà) · UX Pedra Seca 10/10
 * a /notes per publicar al Mur sense cap modal flotant (<dialog>):
 *   1. Dues notes atrapades com a «🔒 Esborrany privat (només per a tu)» es
 *      poden publicar al Mur en línia, triant entre els pobles vinculats al
 *      perfil (multi-poble 'La Torre de les Maçanes · Xixona').
 *   2. El botó principal passa semànticament de Blau («Publicar al Mur») a
 *      Verd («Publicat» / «Publicado» / «Published» / «Argitaratua» / «Publicado»)
 *      amb enllaç directe «Veure al Mur» (/mur/<id>) i, si s'edita o es canvia
 *      de poble, torna a Blau («Actualitzar al Mur»).
 *   3. Paritat completa en les 5 llengües oficials (ca, es, en, eu, gl).
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import '../../../tests/helpers/diccionaris.js';
import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';

const mocks = vi.hoisted(() => ({
  t: null,
  actor: {
    tipus: 'persona',
    id: 'damia-uuid',
    nom: 'Damià Llorens Jordà',
    poble: 'La Torre de les Maçanes · Xixona',
  },
  navega: vi.fn(),
  send: vi.fn(),
  feedPosts: [],
  marketItems: [],
  potPaginar: false,
  loadSeccioPage: vi.fn(),
  useDades: null,
  servidor: null,
}));
mocks.t = createTranslator('ca');

vi.mock('./NotesDataContext', () => ({ useNotesData: () => mocks.useDades() }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: ({ onPublish, publishState, publishPopup, t }) => (
    <div className="sdp-editor-tools">
      <button
        type="button"
        data-testid="barra-publicar"
        data-publish-state={publishState || ''}
        aria-haspopup={publishPopup || undefined}
        onClick={onPublish}
      >
        {publishState === 'publicat' ? t('section.notes.published', 'Publicat') : t('section.notes.publish', 'Publicar')}
      </button>
    </div>
  ),
  UniversalRichTextContent: () => <div />,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUIActions: () => ({ normalizeSearchText: (s) => s, t: mocks.t }),
  useUIStateOpcional: () => null,
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navega,
  Link: 'a',
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
  useRouter: () => null,
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => ({ actor: mocks.actor, actorId: mocks.actor.id, memberships: [] }),
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: { id: 'damia-uuid' }, estat: 'dins' }),
  ESTAT: { DINS: 'dins' },
}));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({
    status: 'ready',
    sendSectionSubmission: mocks.send,
    feedPosts: mocks.feedPosts,
    events: [],
    marketItems: mocks.marketItems,
  }),
}));
vi.mock('../../data/backendPort.js', () => ({
  uploadToStorage: vi.fn(),
  promoteToPublic: vi.fn(),
  teCapacitat: (cap) => cap === 'paginacioSeccions' && mocks.potPaginar,
  loadSeccioPage: (...args) => mocks.loadSeccioPage(...args),
}));
vi.mock('./GlobalSaveManager.js', async (importOriginal) => {
  const real = await importOriginal();
  const registres = new Map();
  return {
    ...real,
    bgSaveManager: new real.GlobalSaveManager({
      persist: async (clau, transforma) => {
        const seguent = transforma(registres.get(clau) || {});
        registres.set(clau, seguent);
        return seguent;
      },
    }),
  };
});

import { NotesProvider, useNotes } from './NotesContext.jsx';
import NotesEditor from './NotesEditor.jsx';
import { bgSaveManager } from './GlobalSaveManager.js';
import { ErrorPublicacio, motiuPobleNoDeterminat, textosEnLiniaDeNota } from './visibilitatNota.js';

const AMBIT = 'ambit-damia-r20';
const UUID_ACTE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const Dades = createContext(null);
mocks.useDades = function useDadesDamia() {
  return useContext(Dades);
};

function ProveidorDamia({ servidor, children }) {
  mocks.servidor = servidor;
  const [notes, setNotes] = useState(() => [...servidor.values()]);
  const updateNote = useCallback(async (id, canvis, revisio) => {
    const actual = servidor.get(id);
    if (!actual || actual.revision !== revisio) throw Object.assign(new Error('Conflicte CAS'), { status: 409 });
    const nova = { ...actual, ...canvis, revision: actual.revision + 1 };
    servidor.set(id, nova);
    setNotes([...servidor.values()]);
    return nova;
  }, [servidor]);
  /* R21.1 v2 · NotesDataContext · confirmaPublicacioNota: la llista adopta l'estat que el rebut atòmic confirma. */
  const confirmaPublicacioNota = useCallback(async (id, rebut) => {
    const actual = servidor.get(id);
    const canvis = { revision: rebut.revision, isPublished: Boolean(rebut.isPublished), publishedSubmissionId: rebut.publishedSubmissionId ?? null };
    servidor.set(id, { ...actual, ...canvis });
    setNotes([...servidor.values()]);
    return canvis;
  }, [servidor]);
  const valor = useMemo(() => ({
    notes,
    noteFolders: [],
    scopeKey: AMBIT,
    workspaceKey: 'sessio-damia-r20',
    notesComplete: true,
    status: 'ready',
    config: { dataMode: 'remote', tenantId: '00000000-0000-4000-8000-0000000000a1' },
    updateNote,
    confirmaPublicacioNota,
  }), [notes, updateNote, confirmaPublicacioNota]);
  return <Dades.Provider value={valor}>{children}</Dades.Provider>;
}

function NotaVivaDamia({ id, onCtx = null }) {
  const ctx = useNotes();
  if (typeof onCtx === 'function') onCtx(ctx);
  const nota = ctx.notes.find((n) => n.id === id);
  return nota ? <NotesEditor activeNote={nota} /> : null;
}

describe('Onada R20 · Bucle 1 · Cas Damià Llorens Jordà (UX en línia 0 modals + multi-poble + 5 llengües)', () => {
  beforeEach(() => {
    /* R21.1 v2 · La publicació atòmica conserva l'intent (actId i operationId) a IndexedDB i falla tancada
       sense persistència (actesPublicacio.js): la prova li dona un IndexedDB fals estructurat, com les de Codex. */
    vi.stubGlobal('indexedDB', creaIdbFalsEstructurat());
    window.localStorage.clear();
    bgSaveManager.revisionsAlMur.clear();
    bgSaveManager.knownRevisions.clear();
    mocks.t = createTranslator('ca');
    mocks.actor = {
      tipus: 'persona',
      id: 'damia-uuid',
      nom: 'Damià Llorens Jordà',
      poble: 'La Torre de les Maçanes · Xixona',
    };
    mocks.navega.mockReset();
    mocks.feedPosts = [];
    mocks.marketItems = [];
    mocks.potPaginar = false;
    mocks.loadSeccioPage = vi.fn();
    /* R21.1 v2 · Un doble fidel de publica_nota_al_mur (2611122200): la consulta d'una operació desconeguda torna
       null; l'enviament comprova la revisió (CAS), vincula la nota a l'acte (UUID propi, mai l'id de la nota),
       avança la revisió i torna el rebut atòmic. */
    mocks.send = vi.fn(async ({ id, noteId, sectionId, payload, expectedNoteRevision, consulta }) => {
      if (consulta) return null;
      const nota = mocks.servidor.get(noteId);
      if (nota.revision !== expectedNoteRevision) throw Object.assign(new Error('SDP-MUR-REVISION: la nota ha canviat'), { codi: 'SDP-MUR-REVISION' });
      const revision = nota.revision + 1;
      mocks.servidor.set(noteId, { ...nota, revision, isPublished: true, publishedSubmissionId: id });
      if (sectionId === 'mur') {
        mocks.feedPosts = [
          ...mocks.feedPosts.filter((p) => p.id !== id),
          { id, ...payload },
        ];
      }
      return { publicacio: { id }, nota_revision: revision, publicada_revision: revision, replay: false };
    });
  });

  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  test('Damià pot traure les seues 2 notes privades al Mur triant el poble de destinació, sense cap modal flotant, passant de Blau «Publicar al Mur» a Verd «Publicat» amb enllaç al Mur', async () => {
    const servidor = new Map([
      ['nota-damia-1', { id: 'nota-damia-1', title: 'Crònica del pou vell', content: '<p>Memòria viva.</p>', folderId: 'f-notes', isPublished: false, revision: 1, contentLoaded: true }],
      ['nota-damia-2', { id: 'nota-damia-2', title: 'Collita d’ametla', content: '<p>A Xixona enguany.</p>', folderId: 'f-notes', isPublished: false, revision: 1, contentLoaded: true }],
    ]);

    const { rerender } = render(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="nota-damia-2" />
        </NotesProvider>
      </ProveidorDamia>,
    );

    // Zero modals al DOM i la barra no anuncia cap popup de diàleg.
    expect(screen.queryByRole('dialog')).toBeNull();
    const botoBarra = screen.getByTestId('barra-publicar');
    expect(botoBarra.hasAttribute('aria-haspopup')).toBe(false);
    expect(botoBarra.getAttribute('data-publish-state')).toBe('pendent');

    const panell = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    expect(within(panell).getByText('Publicaràs com a Damià Llorens Jordà.')).toBeTruthy();

    const radioPrivat = within(panell).getByRole('radio', { name: /🔒 Esborrany privat \(només per a tu\)/ });
    const radioPublic = within(panell).getByRole('radio', { name: /📣 Públic al Mur de poble/ });
    expect(radioPrivat.checked).toBe(true);
    expect(radioPublic.checked).toBe(false);

    // Guarda P1: amb «Esborrany privat» marcat, el botó «Publicar al Mur» està desactivat (cap clic irreversible a cegues!).
    const botoPublicar = within(panell).getByRole('button', { name: 'Publicar al Mur' });
    expect(botoPublicar.disabled).toBe(true);
    fireEvent.click(botoPublicar);
    expect(mocks.send).not.toHaveBeenCalled();

    // Selector multi-poble amb els 2 pobles de Damià: tria publicar a Xixona → marca «Públic al Mur», mostra l'avís d'irreversibilitat i habilita el botó Blau!
    const selectPoble = within(panell).getByLabelText('Poble on es publica');
    expect([...selectPoble.options].map((o) => o.value)).toEqual(['La Torre de les Maçanes', 'Xixona']);
    fireEvent.change(selectPoble, { target: { value: 'Xixona' } });
    expect(radioPublic.checked).toBe(true);
    expect(within(panell).getByText(/Una vegada al Mur, encara no es pot retirar/)).toBeTruthy();
    expect(botoPublicar.disabled).toBe(false);
    expect(botoPublicar.className).toContain('sdp-visibilitat-linia__boto--publicar');

    await act(async () => {
      fireEvent.click(botoPublicar);
    });

    // S'ha enviat al Mur amb poble_id 'xixona' i author_location 'Xixona', i zero modals!
    await waitFor(() => {
      expect(mocks.send).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    /* R21.1 v2 · L'acte de publicació té un UUID propi (diari d'actes), mai l'id de la nota; la nota hi viatja a part. */
    const acte2 = mocks.send.mock.calls[0][0].id;
    expect(acte2).toMatch(UUID_ACTE);
    expect(mocks.send.mock.calls[0][0]).toMatchObject({
      noteId: 'nota-damia-2',
      sectionId: 'mur',
      payload: {
        title: 'Collita d’ametla',
        author_name: 'Damià Llorens Jordà',
        author_location: 'Xixona',
        poble_id: 'xixona',
      },
    });

    // Rerender per reflectir feedPosts actualitzat: ara el panell i la barra mostren Verd «Publicat» + enllaç directe!
    await waitFor(() => {
      expect(servidor.get('nota-damia-2')).toMatchObject({ isPublished: true, publishedSubmissionId: acte2 });
    });
    rerender(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="nota-damia-2" />
        </NotesProvider>
      </ProveidorDamia>,
    );

    expect(screen.getByTestId('barra-publicar').getAttribute('data-publish-state')).toBe('publicat');
    expect(screen.getByTestId('barra-publicar').textContent).toBe('Publicat');
    const estatVerd = panell.querySelector('.sdp-visibilitat-linia__boto--publicat');
    expect(estatVerd).not.toBeNull();
    expect(estatVerd.getAttribute('role')).toBe('status');
    expect(estatVerd.textContent).toContain('Publicat');

    const enllacMur = within(panell).getByRole('link', { name: /Veure al Mur/ });
    expect(enllacMur.getAttribute('href')).toBe(`/mur/${acte2}`);
    fireEvent.click(enllacMur);
    expect(mocks.navega).toHaveBeenCalledWith(`/mur/${acte2}`);

    // Si Damià canvia el poble de destinació a La Torre de les Maçanes, torna a aparèixer el botó Blau «Actualitzar al Mur»!
    fireEvent.change(within(panell).getByLabelText('Poble on es publica'), {
      target: { value: 'La Torre de les Maçanes' },
    });
    const botoActualitzar = within(panell).getByRole('button', { name: 'Actualitzar al Mur' });
    expect(botoActualitzar.className).toContain('sdp-visibilitat-linia__boto--publicar');

    // Segona nota privada atrapada ('nota-damia-1'): amb «Esborrany privat» marcat no dispara res; en marcar «📣 Públic al Mur de poble» (o «Publicar» a la barra), mostra l'avís d'irreversibilitat i publica al seu poble principal!
    rerender(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="nota-damia-1" />
        </NotesProvider>
      </ProveidorDamia>,
    );
    const panellNota1 = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    expect(within(panellNota1).getByRole('button', { name: 'Publicar al Mur' }).disabled).toBe(true);
    fireEvent.click(screen.getByTestId('barra-publicar'));
    expect(within(panellNota1).getByRole('radio', { name: /📣 Públic al Mur de poble/ }).checked).toBe(true);
    expect(within(panellNota1).getByText(/Una vegada al Mur, encara no es pot retirar/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(within(panellNota1).getByRole('button', { name: 'Publicar al Mur' }));
    });
    await waitFor(() => {
      expect(mocks.send).toHaveBeenCalledTimes(2);
    });
    expect(mocks.send.mock.calls[1][0].id).toMatch(UUID_ACTE);
    expect(mocks.send.mock.calls[1][0].id).not.toBe(acte2);
    expect(mocks.send.mock.calls[1][0]).toMatchObject({
      noteId: 'nota-damia-1',
      sectionId: 'mur',
      payload: {
        title: 'Crònica del pou vell',
        author_name: 'Damià Llorens Jordà',
        author_location: 'La Torre de les Maçanes',
        poble_id: 'la-torre-de-les-macanes',
      },
    });
  });

  test('Frontera P1 multi-poble (1/3): en reobrir una nota publicada a Xixona quan la fila ha eixit de feedPosts ([]), el marcador persistent conserva Xixona i «Actualitzar al Mur» no xafa mai amb La Torre', async () => {
    const servidor = new Map([
      ['nota-xixona', { id: 'nota-xixona', title: 'Torrons vells', content: '<p>Versió 1.</p>', folderId: 'f-notes', isPublished: false, revision: 1, contentLoaded: true }],
    ]);

    const primera = render(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="nota-xixona" />
        </NotesProvider>
      </ProveidorDamia>,
    );

    const panell1 = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    fireEvent.change(within(panell1).getByLabelText('Poble on es publica'), { target: { value: 'Xixona' } });
    await act(async () => {
      fireEvent.click(within(panell1).getByRole('button', { name: 'Publicar al Mur' }));
    });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(mocks.send.mock.calls[0][0].payload).toMatchObject({ poble_id: 'xixona', author_location: 'Xixona' });
    /* R21.1 v2 · El servidor vincula la nota a l'acte (UUID propi): el marcador persistent del poble és d'eixe acte. */
    const acte = mocks.send.mock.calls[0][0].id;
    expect(acte).toMatch(UUID_ACTE);
    await waitFor(() => expect(servidor.get('nota-xixona')).toMatchObject({ isPublished: true, publishedSubmissionId: acte }));

    primera.unmount();

    // Recàrrega real de pestanya (memòria buida) mentre la publicació cau fora de la finestra carregada (feedPosts = []).
    bgSaveManager.revisionsAlMur.clear();
    bgSaveManager.knownRevisions.clear();
    mocks.feedPosts = [];
    mocks.send.mockClear();
    const actual = servidor.get('nota-xixona');
    servidor.set('nota-xixona', {
      ...actual,
      content: '<p>Versió 2 editada.</p>',
      revision: actual.revision + 1,
    });

    render(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="nota-xixona" />
        </NotesProvider>
      </ProveidorDamia>,
    );

    const panell2 = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    const select2 = within(panell2).getByLabelText('Poble on es publica');
    expect(select2.value).toBe('Xixona');

    const botoActualitzar = within(panell2).getByRole('button', { name: 'Actualitzar al Mur' });
    expect(botoActualitzar.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(botoActualitzar);
    });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(mocks.send.mock.calls[0][0]).toMatchObject({
      id: acte,
      noteId: 'nota-xixona',
      sectionId: 'mur',
      payload: {
        poble_id: 'xixona',
        author_location: 'Xixona',
      },
    });
  });

  test('Frontera P1 multi-poble (2/3): si una nota ja publicada s’obri sense fila al Mur, sense marcador local ni paginació, bloqueja «Actualitzar al Mur» amb estat explícit fins que es tria poble i publishNote rebutja sense poble', async () => {
    const servidor = new Map([
      ['nota-altre-aparell', {
        id: 'nota-altre-aparell',
        title: 'Crònica des d’un altre aparell',
        content: '<p>Text actualitzat.</p>',
        folderId: 'f-notes',
        isPublished: true,
        publishedSubmissionId: 'nota-altre-aparell',
        revision: 4,
        contentLoaded: true,
      }],
    ]);
    mocks.feedPosts = [];

    let apiNotes = null;
    function CapturaContext() {
      apiNotes = useNotes();
      return null;
    }

    render(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <CapturaContext />
          <NotaVivaDamia id="nota-altre-aparell" />
        </NotesProvider>
      </ProveidorDamia>,
    );

    const panell = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    const selectPoble = within(panell).getByLabelText('Poble on es publica');
    expect(selectPoble.value).toBe('');
    expect(within(panell).getByText(/No s’ha pogut verificar en quin poble/)).toBeTruthy();

    const botoActualitzar = within(panell).getByRole('button', { name: 'Actualitzar al Mur' });
    expect(botoActualitzar.disabled).toBe(true);
    fireEvent.click(botoActualitzar);
    expect(mocks.send).not.toHaveBeenCalled();

    // Defensa en profunditat al context: cridar publishNote sense poble explícit rebutja i no envia La Torre per defecte.
    await expect(apiNotes.publishNote(servidor.get('nota-altre-aparell'))).rejects.toBeInstanceOf(ErrorPublicacio);
    expect(mocks.send).not.toHaveBeenCalled();

    // Acció explícita de l'usuari triant Xixona → desbloqueja i actualitza amb poble_id 'xixona'.
    fireEvent.change(selectPoble, { target: { value: 'Xixona' } });
    expect(botoActualitzar.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(botoActualitzar);
    });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(mocks.send.mock.calls[0][0].payload).toMatchObject({
      poble_id: 'xixona',
      author_location: 'Xixona',
    });
  });

  test('Frontera P1 multi-poble (3/3): amb paginacioSeccions activa, recupera el poble autoritzat fora de la primera finestra via loadSeccioPage', async () => {
    mocks.potPaginar = true;
    mocks.feedPosts = [];
    mocks.loadSeccioPage = vi.fn()
      .mockResolvedValueOnce({ elements: [{ id: 'altra-1', poble_id: 'la-torre-de-les-macanes' }], nextCursor: 'c2', complete: false })
      .mockResolvedValueOnce({ elements: [{ id: 'nota-paginada', poble_id: 'xixona', author_location: 'Xixona' }], nextCursor: null, complete: true });

    const servidor = new Map([
      ['nota-paginada', {
        id: 'nota-paginada',
        title: 'Publicada fa mesos a Xixona',
        content: '<p> Esborrany editat.</p>',
        folderId: 'f-notes',
        isPublished: true,
        publishedSubmissionId: 'nota-paginada',
        revision: 5,
        contentLoaded: true,
      }],
    ]);

    render(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="nota-paginada" />
        </NotesProvider>
      </ProveidorDamia>,
    );

    const panell = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    const selectPoble = within(panell).getByLabelText('Poble on es publica');
    await waitFor(() => {
      expect(selectPoble.value).toBe('Xixona');
    });

    const botoActualitzar = within(panell).getByRole('button', { name: 'Actualitzar al Mur' });
    expect(botoActualitzar.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(botoActualitzar);
    });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(mocks.send.mock.calls[0][0].payload).toMatchObject({
      poble_id: 'xixona',
      author_location: 'Xixona',
    });
  });

  test.each(SUPPORTED_LANGUAGES.map(({ code }) => code))(
    'paritat i18n en «%s»: tots els textos en línia, frontera d’indeterminació i estats Blau/Verd ixen traduïts',
    (codi) => {
      const t = createTranslator(codi);
      const textos = textosEnLiniaDeNota({ t });
      const motiuIndet = motiuPobleNoDeterminat(t);
      expect(textos.privada.etiqueta).toMatch(/^🔒 /);
      expect(textos.publica.etiqueta).toMatch(/^📣 /);
      expect(textos.estatPublicat.length).toBeGreaterThan(3);
      expect(textos.veurePublicacio.length).toBeGreaterThan(5);
      expect(textos.poble.tria.length).toBeGreaterThan(8);
      expect(textos.poble.indeterminat.length).toBeGreaterThan(20);
      expect(motiuIndet.length).toBeGreaterThan(20);
      if (codi === 'gl') {
        expect(textos.publica.etiqueta).toContain('pobo');
        expect(textos.poble.etiqueta).toContain('Pobo');
        expect(textos.poble.tria).toContain('pobo');
        expect(textos.poble.indeterminat).toContain('pobo');
        expect(textos.publica.etiqueta).not.toContain('vila');
      }
      if (codi !== 'ca') {
        const ca = textosEnLiniaDeNota();
        expect(textos.llegenda).not.toBe(ca.llegenda);
        expect(textos.privada.etiqueta).not.toBe(ca.privada.etiqueta);
        expect(textos.publica.etiqueta).not.toBe(ca.publica.etiqueta);
        expect(textos.poble.etiqueta).not.toBe(ca.poble.etiqueta);
        expect(textos.poble.tria).not.toBe(ca.poble.tria);
        expect(textos.poble.indeterminat).not.toBe(ca.poble.indeterminat);
        expect(motiuIndet).not.toBe(motiuPobleNoDeterminat());
      }
    },
  );

  test('poble antic desvinculat: si una nota es va publicar a Alcoi i hui el perfil és «La Torre · Xixona», conserva Alcoi sense bloqueig ni caiguda a La Torre', async () => {
    mocks.feedPosts = [
      { id: 'damia-alcoi', poble_id: 'alcoi', author_location: 'Alcoi', sectionId: 'mur' },
    ];
    const servidor = new Map([
      ['damia-alcoi', {
        id: 'damia-alcoi',
        title: 'Crònica d’Alcoi',
        content: '<p>Text publicat quan vivia a Alcoi.</p>',
        folderId: 'f-notes',
        isPublished: true,
        publishedSubmissionId: 'damia-alcoi',
        revision: 3,
        contentLoaded: true,
      }],
    ]);
    render(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="damia-alcoi" />
        </NotesProvider>
      </ProveidorDamia>,
    );

    const panell = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    const selectPoble = within(panell).getByLabelText('Poble on es publica');
    expect(selectPoble.value).toBe('Alcoi');

    const botoActualitzar = within(panell).getByRole('button', { name: 'Actualitzar al Mur' });
    expect(botoActualitzar.disabled).toBe(false);
    await act(async () => {
      fireEvent.click(botoActualitzar);
    });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(mocks.send.mock.calls[0][0].payload).toMatchObject({
      poble_id: 'alcoi',
      author_location: 'Alcoi',
    });
  });

  test('nota externa compartida (citaOrigen): després de compartir al Mur, editar el títol reactiva el botó d’actualització i no es congela en «Publicat»', async () => {
    let notesCtx = null;
    const servidor = new Map([
      ['damia-externa', {
        id: 'damia-externa',
        title: 'Retall extern',
        content: '<p>Contingut capturat</p>',
        folderId: 'f-notes',
        isPublished: false,
        revision: 1,
        contentLoaded: true,
        origen: { tipus: 'extern', url: 'https://example.org/article', titol: 'Article original' },
      }],
    ]);
    render(
      <ProveidorDamia servidor={servidor}>
        <NotesProvider>
          <NotaVivaDamia id="damia-externa" onCtx={(c) => { notesCtx = c; }} />
        </NotesProvider>
      </ProveidorDamia>,
    );

    const panell = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    const radioPublic = within(panell).getByRole('radio', { name: /Públic|Compartit/i });
    fireEvent.click(radioPublic);

    const botoCompartir = within(panell).getByRole('button', { name: /Compartir al Mur/i });
    await act(async () => {
      fireEvent.click(botoCompartir);
    });
    await waitFor(() => expect(mocks.send).toHaveBeenCalledTimes(1));
    expect(panell.querySelector('.sdp-visibilitat-linia__boto--publicat')?.textContent).toContain('Publicat');

    await act(async () => {
      notesCtx.setLocalNoteField('damia-externa', 'title', 'Retall extern revisat');
    });

    await waitFor(() => {
      expect(within(panell).getByRole('button', { name: /Compartir al Mur|Actualitzar al Mur/i })).toBeTruthy();
    });
  });

  test('espècimen de /disseny (EspecimenSelectorVisibilitat): mostra el selector multipoble, passa a verd amb «Veure al Mur» i plega/obri el panell', async () => {
    const { default: EspecimenSelectorVisibilitat } = await import('../disseny/cataleg/detalls/EspecimenSelectorVisibilitat.jsx');
    render(<EspecimenSelectorVisibilitat />);

    const panell = screen.getByRole('region', { name: 'Visibilitat i publicació de la nota' });
    const selectPoble = within(panell).getByLabelText('Poble on es publica');
    expect(selectPoble.options).toHaveLength(2);
    fireEvent.change(selectPoble, { target: { value: 'Xixona' } });

    const radioPublic = within(panell).getByRole('radio', { name: /Públic al Mur de poble/i });
    fireEvent.click(radioPublic);

    const botoPublicar = within(panell).getByRole('button', { name: 'Publicar al Mur' });
    await act(async () => {
      fireEvent.click(botoPublicar);
    });

    expect(panell.querySelector('.sdp-visibilitat-linia__boto--publicat')?.textContent).toContain('Publicat');
    expect(within(panell).getByRole('link', { name: 'Veure al Mur' }).getAttribute('href')).toBe('/mur');

    const botoPlegar = screen.getByRole('button', { name: 'Plegar panell en línia' });
    expect(botoPlegar.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(botoPlegar);
    expect(screen.queryByRole('region', { name: 'Visibilitat i publicació de la nota' })).toBeNull();
    const botoObrir = screen.getByRole('button', { name: 'Obrir panell en línia' });
    expect(botoObrir.getAttribute('aria-expanded')).toBe('false');
  });
});
