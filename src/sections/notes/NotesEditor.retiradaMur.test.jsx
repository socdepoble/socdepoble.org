import { creaIdbFalsEstructurat } from '../../../tests/helpers/idbFalsEstructurat.js';
/**
 * F03-UI (Onada R21, carril UI) · Retirar una nota del Mur des del panell en
 * línia de /notes, amb el NotesProvider de veres i el DocumentEditor de veres
 * (només TipTap es dobla, com a NotesEditor.damiaPublicacioEnLinia.test.jsx).
 *   · Sense la capacitat 'revocacioPublicacions' (adaptador local, llavor):
 *     «privada» continua bloquejada i el text diu que encara no es pot.
 *   · Amb la capacitat: triar «privada» només mostra la confirmació en línia
 *     (cap <dialog>); «Retirar del Mur» crida updateNote({ isPublished: false,
 *     publishedSubmissionId: null }) amb la revisió vigent; la nota passa a
 *     privada i, si es torna a publicar, ix amb un UUID NOU.
 *   · Pendent (revocacioPendent del port), 403 i 409: missatges certs, i la
 *     nota no es dona per retirada.
 *   · Republicar quan l'UUID de la nota ja és retirat al servidor
 *     (SDP-MUR-REVOKED): UUID nou, una sola vegada; «Actualitzar» d'una
 *     publicació ja retirada no en crea cap d'amagat.
 *   · Esborrar o enviar a la paperera una nota publicada: el diàleg diu, amb
 *     la capacitat, que també la retira del Mur (i que arxivar no).
 *   · Verificació R21 (P1) · La retirada pendent viu al NotesContext per nota
 *     (sobreviu a canviar de nota i a recarregar), bloqueja publicar, arxivar
 *     i la tria, i es reprén amb la revisió VIGENT encara que la nota s'haja
 *     editat; si el servidor la rebutja, es diu. Amb la llavor (capacitat del
 *     port però res al servidor), el text de sempre. Una nota mai publicada
 *     no promet cap retirada pendent. Una publicació oberta sense nota
 *     (PublicacioEditable) no oferix retirar-la.
 */
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTranslator } from '../../config/i18n.js';
import '../../../tests/helpers/diccionaris.js';

const mocks = vi.hoisted(() => ({
  t: null,
  actor: { tipus: 'persona', id: 'persona-ret', nom: 'Rosa Ferrer Mira', poble: 'La Torre de les Maçanes' },
  send: vi.fn(),
  toast: vi.fn(),
  feedPosts: [],
  revocacio: false,
  cicle: false,
  useDades: null,
  drena: vi.fn(async () => ({pendents:1})),
}));
mocks.t = createTranslator('ca');

vi.mock('./NotesDataContext', () => ({ useNotesData: () => mocks.useDades() }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: ({ onPublish, onDelete }) => (
    <div className="sdp-editor-tools">
      <button type="button" data-testid="barra-publicar" onClick={onPublish}>Publicar</button>
      {onDelete ? <button type="button" data-testid="barra-borrar" onClick={onDelete}>Borrar</button> : null}
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
  useUIActionsOpcional: () => ({ t: mocks.t }),
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: 'a',
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
  useRouter: () => null,
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/useIdentitatOReserva.js', () => ({
  useIdentitatOReserva: () => ({ actor: mocks.actor, actorId: mocks.actor.id, memberships: [] }),
}));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [], pages: [] }) }));
vi.mock('../../hooks/useSuperadminEstable.js', () => ({ useSuperadminEstable: () => ({ esSuperadmin: false, rolPendent: false }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: { id: 'persona-ret' }, estat: 'dins' }),
  ESTAT: { DINS: 'dins' },
}));
vi.mock('../mur/MurContext', () => ({
  useMur: () => ({ status: 'ready', sendSectionSubmission: mocks.send, feedPosts: mocks.feedPosts, events: [], marketItems: [] }),
}));
vi.mock('../../data/backendPort.js', () => ({
  uploadToStorage: vi.fn(),
  promoteToPublic: vi.fn(),
  teCapacitat: (cap) => (cap === 'revocacioPublicacions' && mocks.revocacio) || (cap === 'cicleNotes' && mocks.cicle),
  loadSeccioPage: vi.fn(),
  drenaRevocacionsMur: (...args) => mocks.drena(...args),
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
import { PublicacioEditable } from './PublicacioEditable.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { bgSaveManager } from './GlobalSaveManager.js';
import { MOTIU_LOCAL, MOTIU_PUBLICADA, TEXTOS_RETIRADA, TEXTOS_VISIBILITAT_NOTA } from './visibilitatNota.js';
import { TEXTOS_ESBORRAR_PUBLICADA } from './DialegEsborrarNota.jsx';

const AMBIT = 'ambit-retirada-f03';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const R = Object.fromEntries(Object.entries(TEXTOS_RETIRADA).map(([nom, [, reserva]]) => [nom, reserva]));
const NOM_PANELL = 'Visibilitat i publicació de la nota';
const Dades = createContext(null);
mocks.useDades = function useDadesRetirada() {
  return useContext(Dades);
};

/* El «servidor» de notes: CAS de revisió com notes.js; `falla` simula el rebuig del port.
   `ctl.escriu` és una escriptura que no passa per l'editor (l'autodesament
   d'una altra pestanya, o la cua del port drenada): puja la revisió.
   Gauntlet R22 (ronda 3) · resolveNote torna, com NotesDataContext, la fila del
   servidor d'esta resposta (i la posa a la llista); `ctl.esperaResolucio`, si
   és una promesa, la fa esperar. `pagina` fa la recàrrega com una primera
   pàgina parcial: (previes, servidor) → llista nova. */
function Proveidor({ servidor, falla = null, children, refresh = vi.fn(), mou = null, esborra = null, ctl = null, dataMode = 'remote', pagina = null }) {
  const [notes, setNotes] = useState(() => [...servidor.values()]);
  useLayoutEffect(() => {
    if (!ctl) return;
    ctl.escriu = (id, canvis) => {
      const actual = servidor.get(id);
      servidor.set(id, { ...actual, ...canvis, revision: actual.revision + 1 });
      setNotes([...servidor.values()]);
    };
  });
  const updateNote = useCallback(async (id, canvis, revisio) => {
    const error = canvis.isPublished === false && typeof falla === 'function' ? falla(id, canvis, revisio) : null;
    if (error) throw error;
    const actual = servidor.get(id);
    if (!actual || actual.revision !== revisio) throw Object.assign(new Error('Conflicte de concurrència de revisió.'), { status: 409 });
    const nova = { ...actual, ...canvis, revision: actual.revision + 1 };
    servidor.set(id, nova);
    setNotes([...servidor.values()]);
    return nova;
  }, [servidor, falla]);
  const refreshNotes = useCallback(() => {
    setNotes((previes) => (pagina ? pagina(previes, servidor) : [...servidor.values()]));
    refresh();
  }, [servidor, refresh, pagina]);
  const resolveNote = useCallback(async (id) => {
    if (ctl?.esperaResolucio) await ctl.esperaResolucio;
    const fila = servidor.get(id);
    if (!fila) return { status: 'not-found' };
    const note = { ...fila };
    setNotes((previes) => previes.map((n) => (n.id === id ? note : n)));
    return { status: 'found', note };
  }, [servidor, ctl]);
  const valor = useMemo(() => ({
    notes,
    noteFolders: [],
    scopeKey: AMBIT,
    workspaceKey: 'sessio-retirada-f03',
    notesComplete: true,
    status: 'ready',
    config: { dataMode, tenantId: '00000000-0000-4000-8000-0000000000f3' },
    updateNote,
    confirmaPublicacioNota: (id, receipt) => {
      const nova = { ...servidor.get(id), ...receipt }; servidor.set(id,nova); setNotes([...servidor.values()]); return nova;
    },
    refresh: refreshNotes,
    mouNota: mou || vi.fn(async () => ({})),
    esborraNota: esborra || vi.fn(async () => ({})),
    resolveNote,
  }), [notes, updateNote, refreshNotes, mou, esborra, dataMode, servidor, resolveNote]);
  return <Dades.Provider value={valor}>{children}</Dades.Provider>;
}

function NotaViva({ id, ctl = null }) {
  const ctx = useNotes();
  if (ctl) ctl.ctx = ctx;
  const nota = ctx.notes.find((n) => n.id === id);
  return nota ? <NotesEditor activeNote={nota} /> : null;
}

/* Canviar de nota i tornar: el panell es remunta (notaId nou). */
function DuesNotes({ ids, ctl }) {
  const [actiu, setActiu] = useState(0);
  ctl.canvia = (index) => setActiu(index);
  return <NotaViva id={ids[actiu]} ctl={ctl} />;
}

const notaPublicada = (extra = {}) => ({
  id: 'nota-ret-1', title: 'Bancal de tomaques', content: '<p>La collita d’enguany.</p>', folderId: 'f-notes',
  isPublished: true, publishedSubmissionId: 'nota-ret-1', revision: 3, contentLoaded: true, ...extra,
});

const panell = () => screen.getByRole('region', { name: NOM_PANELL });
const radioPrivada = () => within(panell()).getByRole('radio', { name: /Esborrany privat/ });
const radioPublica = () => within(panell()).getByRole('radio', { name: /Públic al Mur de poble/ });

describe('F03-UI · Retirar del Mur des de /notes', () => {
  beforeEach(async () => {
    await bgSaveManager.serial(`${AMBIT}:nota-ret-1`, () => bgSaveManager.oblida(AMBIT, 'nota-ret-1'));
    globalThis.indexedDB = creaIdbFalsEstructurat();
    window.localStorage.clear();
    bgSaveManager.revisionsAlMur.clear();
    bgSaveManager.knownRevisions.clear();
    mocks.t = createTranslator('ca');
    mocks.feedPosts = [];
    mocks.revocacio = false;
    mocks.cicle = false;
    mocks.toast.mockReset();
    mocks.drena.mockReset().mockResolvedValue({pendents:1});
    mocks.send = vi.fn(async ({ id, payload, expectedNoteRevision }) => {
      mocks.feedPosts = [...mocks.feedPosts.filter((p) => p.id !== id), { id, ...payload }];
      return {publicacio:{id},nota_revision:expectedNoteRevision+1,publicada_revision:expectedNoteRevision+1,replay:false};
    });
  });
  afterEach(cleanup);

  test('sense la capacitat (adaptador local o llavor): «privada» continua bloquejada, amb el motiu de sempre', () => {
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    render(<Proveidor servidor={servidor}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    expect(radioPrivada().disabled).toBe(true);
    expect(within(panell()).getByText(MOTIU_PUBLICADA)).toBeTruthy();
    expect(within(panell()).queryByRole('button', { name: R.accio })).toBeNull();
    fireEvent.click(radioPrivada());
    expect(within(panell()).queryByText(R.avis)).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('sense la capacitat, abans de publicar: «encara no es pot retirar»', () => {
    const servidor = new Map([['nota-ret-2', notaPublicada({ id: 'nota-ret-2', isPublished: false, publishedSubmissionId: null })]]);
    render(<Proveidor servidor={servidor}><NotesProvider><NotaViva id="nota-ret-2" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPublica());
    expect(within(panell()).getByText(/Una vegada al Mur, encara no es pot retirar/)).toBeTruthy();
    expect(within(panell()).queryByText(/la podràs retirar/)).toBeNull();
  });

  test('amb la capacitat: confirmació en línia, retirada i republicació amb un UUID nou', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    const actualitza = vi.fn();
    let fallaElVincle = false;
    const falla = (...args) => {
      actualitza(...args);
      if (fallaElVincle && args[1]?.isPublished === true) {
        fallaElVincle = false;
        return Object.assign(new Error('Supabase 503: {}'), { status: 503 });
      }
      return null;
    };
    render(
      <Proveidor servidor={servidor} falla={falla}>
        <NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider>
      </Proveidor>,
    );
    expect(radioPublica().checked).toBe(true);
    expect(radioPrivada().disabled).toBe(false);
    expect(within(panell()).queryByText(MOTIU_PUBLICADA)).toBeNull();
    expect(within(panell()).queryByRole('button', { name: R.accio })).toBeNull();

    // Triar «privada» no envia res: només mostra la confirmació, en línia (cap <dialog>).
    fireEvent.click(radioPrivada());
    expect(radioPrivada().checked).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(within(panell()).getByText(R.avis)).toBeTruthy();
    expect(R.avis).toContain('Desapareixerà del Mur públic per a tothom.');
    expect(R.avis).toContain('La nota continua privada al teu Bloc.');
    expect(R.avis).toContain('ixirà com una publicació nova, amb un enllaç nou.');
    expect(actualitza).not.toHaveBeenCalled();
    const boto = within(panell()).getByRole('button', { name: R.accio });
    expect(boto.className).toContain('sdp-boto--perill');

    await act(async () => { fireEvent.click(boto); });
    await waitFor(() => expect(servidor.get('nota-ret-1').isPublished).toBe(false));
    // El contracte de mutacioDeNota: updateNote amb isPublished:false i la revisió vigent.
    expect(actualitza).toHaveBeenCalledTimes(1);
    expect(actualitza).toHaveBeenCalledWith('nota-ret-1', { isPublished: false, publishedSubmissionId: null, revocaPublicacioId:'nota-ret-1' }, 3);
    expect(servidor.get('nota-ret-1').publishedSubmissionId).toBeNull();
    expect(radioPrivada().checked).toBe(true);
    expect(await within(panell()).findByText(R.feta)).toBeTruthy();
    expect(mocks.toast).toHaveBeenCalledWith(R.feta, 'success');
    await waitFor(() => expect(document.activeElement).toBe(radioPrivada()));
    expect(mocks.send).not.toHaveBeenCalled();

    // Abans de tornar a publicar, el text diu la veritat: es pot retirar, i no «encara no».
    fireEvent.click(radioPublica());
    expect(within(panell()).getByText(/Quan vulgues, la podràs retirar i tornarà a ser privada/)).toBeTruthy();
    expect(within(panell()).queryByText(/encara no es pot retirar/)).toBeNull();
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: 'Publicar al Mur' })); });
    await waitFor(() => expect(servidor.get('nota-ret-1').isPublished).toBe(true));
    expect(mocks.send).toHaveBeenCalledTimes(1);
    const idNou = mocks.send.mock.calls[0][0].id;
    expect(idNou).toMatch(UUID); expect(idNou).not.toBe('nota-ret-1');
    expect(servidor.get('nota-ret-1').publishedSubmissionId).toBe(idNou);
    // L’única PATCH era la retirada: la publicació adopta el rebut atòmic.
    expect(actualitza.mock.calls.filter(([, canvis])=>canvis.isPublished===true)).toEqual([]);

  });

  test('pendent (revocacioPendent): la retirada queda encuada i la nota NO es dona per retirada', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    const falla = () => Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', status: 0, revocacioPendent: true });
    render(<Proveidor servidor={servidor} falla={falla}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    const avis = await within(panell()).findByText(R.pendent);
    expect(avis.closest('[role="status"]')).not.toBeNull();
    expect(servidor.get('nota-ret-1')).toMatchObject({ isPublished: true, publishedSubmissionId: 'nota-ret-1', revision: 3 });
    expect(within(panell()).queryByText(R.feta)).toBeNull();
    expect(within(panell()).queryByRole('button', { name: R.accio })).toBeNull();
    expect(mocks.toast).toHaveBeenCalledWith(R.pendent, 'info');
    expect(mocks.toast).not.toHaveBeenCalledWith(R.feta, 'success');
    expect(R.pendent).toMatch(/es tornarà a provar/);
    expect(R.pendent).not.toMatch(/es farà/);
    // Mentre és pendent, cap tria ni actualització al Mur que hi xoque.
    expect(radioPrivada().checked).toBe(true);
    expect(radioPublica().closest('fieldset').disabled).toBe(true);
    expect(within(panell()).getByRole('button', { name: 'Actualitzar al Mur' }).disabled).toBe(true);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  /* Verificació R21 (P1) · El cas de l'adversari: pendent amb la revisió 3, la
     nota s'edita (revisió 4) i la cua del port ja no casaria. El Bloc la
     reprén en tornar la connexió amb la revisió VIGENT. */
  test('pendent i després una edició: en tornar la connexió es reprén amb la revisió vigent i es retira', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    const actualitza = vi.fn();
    let caigut = true;
    const falla = (...args) => {
      actualitza(...args);
      return caigut ? Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', revocacioPendent: true }) : null;
    };
    const ctl = {};
    render(<Proveidor servidor={servidor} falla={falla} ctl={ctl}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    await within(panell()).findByText(R.pendent);
    expect(actualitza).toHaveBeenLastCalledWith('nota-ret-1', { isPublished: false, publishedSubmissionId: null, revocaPublicacioId:'nota-ret-1' }, 3);
    // Una escriptura posterior (l'autodesament): la revisió puja a 4 i la nota continua publicada.
    await act(async () => { ctl.escriu('nota-ret-1', { title: 'Bancal de tomaques (editat)' }); });
    expect(servidor.get('nota-ret-1')).toMatchObject({ isPublished: true, revision: 4 });
    expect(within(panell()).getByText(R.pendent)).toBeTruthy();
    // Torna la connexió: el Bloc la torna a demanar, amb la revisió 4.
    caigut = false;
    mocks.drena.mockImplementationOnce(async () => { ctl.escriu('nota-ret-1',{isPublished:false,publishedSubmissionId:null}); return {pendents:0}; });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(servidor.get('nota-ret-1').isPublished).toBe(false));
    expect(actualitza).toHaveBeenCalledTimes(1); expect(mocks.drena).toHaveBeenCalled();
    expect(servidor.get('nota-ret-1').publishedSubmissionId).toBeNull();
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(R.feta, 'success'));
    expect(within(panell()).queryByText(R.pendent)).toBeNull();
    expect(radioPrivada().checked).toBe(true);
    expect(radioPrivada().closest('fieldset').disabled).toBe(false);
  });

  test('pendent: sobreviu a canviar de nota i bloqueja publicar i arxivar d’eixa nota', async () => {
    mocks.revocacio = true;
    mocks.cicle = true;
    const servidor = new Map([
      ['nota-ret-1', notaPublicada()],
      ['nota-ret-5', notaPublicada({ id: 'nota-ret-5', title: 'Una altra', isPublished: false, publishedSubmissionId: null })],
    ]);
    const falla = () => Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', revocacioPendent: true });
    const mou = vi.fn(async () => ({}));
    const ctl = {};
    render(<Proveidor servidor={servidor} falla={falla} mou={mou}><NotesProvider><DuesNotes ids={['nota-ret-1', 'nota-ret-5']} ctl={ctl} /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    await within(panell()).findByText(R.pendent);
    // Una altra nota i tornar: l'avís continua (abans es perdia amb el panell).
    act(() => ctl.canvia(1));
    expect(within(panell()).queryByText(R.pendent)).toBeNull();
    act(() => ctl.canvia(0));
    expect(within(panell()).getByText(R.pendent)).toBeTruthy();
    expect(radioPrivada().checked).toBe(true);
    expect(within(panell()).queryByRole('button', { name: R.accio })).toBeNull();
    expect(within(panell()).getByRole('button', { name: 'Actualitzar al Mur' }).disabled).toBe(true);
    // publishNote (també des d'una altra vista) no la torna a pujar.
    const nota = ctl.ctx.notes.find((n) => n.id === 'nota-ret-1');
    await expect(ctl.ctx.publishNote(nota)).rejects.toMatchObject({ name: 'ErrorPublicacio', message: R.pendentBloqueja });
    expect(mocks.send).not.toHaveBeenCalled();
    // Arxivar no la retira i la trauria del Bloc: tampoc.
    await act(async () => { expect(await ctl.ctx.mouNota(nota, 'arxivada')).toBe(true); });
    expect(mou).toHaveBeenCalledWith(nota.id, 'arxivada', expect.any(Number), nota.publishedSubmissionId);
    expect(mocks.toast).not.toHaveBeenCalledWith(R.pendentArxiu, 'info');
  });

  test('pendent i recàrrega: el Bloc la recorda i la reprén en carregar', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    let caigut = true;
    const actualitza = vi.fn();
    const falla = (...args) => {
      actualitza(...args);
      return caigut ? Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', revocacioPendent: true }) : null;
    };
    const primer = render(<Proveidor servidor={servidor} falla={falla}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    await within(panell()).findByText(R.pendent);
    primer.unmount();
    // El marcador només porta l'id de la nota, cap dada seua.
    expect(JSON.stringify(window.localStorage)).not.toMatch(/Bancal|collita/);
    caigut = false;
    mocks.drena.mockImplementationOnce(async () => { const n=servidor.get('nota-ret-1'); servidor.set(n.id,{...n,isPublished:false,publishedSubmissionId:null,revision:n.revision+1}); return {pendents:0}; });
    render(<Proveidor servidor={servidor} falla={falla}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    await waitFor(() => expect(servidor.get('nota-ret-1').isPublished).toBe(false));
    expect(actualitza).toHaveBeenLastCalledWith('nota-ret-1', { isPublished: false, publishedSubmissionId: null, revocaPublicacioId:'nota-ret-1' }, 3);
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(R.feta, 'success'));
  });

  test('pendent i la cua del port arriba primer: la llista diu que ja és retirada i deixa de ser pendent', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    const falla = () => Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', revocacioPendent: true });
    const ctl = {};
    render(<Proveidor servidor={servidor} falla={falla} ctl={ctl}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    await within(panell()).findByText(R.pendent);
    // revoca_publicacio_de_nota ja l'ha despublicada al servidor.
    await act(async () => { ctl.escriu('nota-ret-1', { isPublished: false, publishedSubmissionId: null }); });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(R.feta, 'success'));
    expect(within(panell()).queryByText(R.pendent)).toBeNull();
    expect(radioPrivada().checked).toBe(true);
  });

  test('pendent i 403 posterior: conserva la voluntat i mai anuncia retirada', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-1',notaPublicada()]]);
    const falla = () => Object.assign(new Error('403'),{status:403,revocacioPendent:true});
    render(<Proveidor servidor={servidor} falla={falla}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada()); await act(async()=>{fireEvent.click(within(panell()).getByRole('button',{name:R.accio}));});
    await within(panell()).findByText(R.pendent);
    mocks.drena.mockRejectedValueOnce(Object.assign(new Error('403'),{status:403,revocacioPendent:true}));
    await act(async()=>{window.dispatchEvent(new Event('online'));});
    expect(within(panell()).getByText(R.pendent)).toBeTruthy(); expect(servidor.get('nota-ret-1').isPublished).toBe(true);
    expect(mocks.toast).not.toHaveBeenCalledWith(R.feta,'success');
  });

  test.each([
    ['403', { status: 403 }, 'permis'],
    ['409 (CAS)', { status: 409 }, 'conflicte'],
    ['altres', { status: 500 }, 'error'],
  ])('%s: missatge honest i la publicació es queda on era', async (_nom, forma, clau) => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    const falla = () => Object.assign(new Error(`Supabase ${forma.status}: {}`), forma);
    render(<Proveidor servidor={servidor} falla={falla}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    const error = await within(panell()).findByText(R[clau]);
    expect(error.closest('[role="alert"]')).not.toBeNull();
    expect(servidor.get('nota-ret-1').isPublished).toBe(true);
    expect(within(panell()).queryByText(R.feta)).toBeNull();
    expect(mocks.toast).not.toHaveBeenCalledWith(R.feta, 'success');
    // Es pot tornar a provar des del mateix lloc, i el focus hi torna.
    const boto = within(panell()).getByRole('button', { name: R.accio });
    expect(boto.disabled).toBe(false);
    await waitFor(() => expect(document.activeElement).toBe(boto));
  });

  test('republicar des d’un altre dispositiu: l’UUID de la nota ja és retirat (SDP-MUR-REVOKED) i ix amb un UUID nou, una sola vegada', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-3', notaPublicada({ id: 'nota-ret-3', isPublished: false, publishedSubmissionId: null })]]);
    mocks.send = vi.fn(async ({ id, payload, expectedNoteRevision }) => {
      if (id === 'nota-ret-3') throw new Error('Supabase 400: {"code":"23514","message":"SDP-MUR-REVOKED: UUID retirat definitivament; publica amb un UUID nou."}');
      mocks.feedPosts = [...mocks.feedPosts, { id, ...payload }];
      return {publicacio:{id},nota_revision:expectedNoteRevision+1,publicada_revision:expectedNoteRevision+1,replay:false};
    });
    render(<Proveidor servidor={servidor}><NotesProvider><NotaViva id="nota-ret-3" /></NotesProvider></Proveidor>);
    fireEvent.click(radioPublica());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: 'Publicar al Mur' })); });
    await waitFor(() => expect(servidor.get('nota-ret-3').isPublished).toBe(true));
    expect(mocks.send).toHaveBeenCalledTimes(1);
    const idNou = mocks.send.mock.calls[0][0].id;
    expect(idNou).toMatch(UUID);
    expect(servidor.get('nota-ret-3').publishedSubmissionId).toBe(idNou);
  });

  test('«Actualitzar» d’una publicació que ja s’ha retirat (pendent drenat o un altre dispositiu): no en crea cap d’amagat', async () => {
    mocks.revocacio = true;
    const servidor = new Map([['nota-ret-4', notaPublicada({ id: 'nota-ret-4', publishedSubmissionId: 'nota-ret-4' })]]);
    mocks.send = vi.fn(async () => { throw Object.assign(new Error('Esta publicació està retirada.'), { codi: 'MUR_PUBLICACIO_RETIRADA' }); });
    const refresh = vi.fn();
    render(<Proveidor servidor={servidor} refresh={refresh}><NotesProvider><NotaViva id="nota-ret-4" /></NotesProvider></Proveidor>);
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: 'Actualitzar al Mur' })); });
    expect(await within(panell()).findByText(R.jaRetirada)).toBeTruthy();
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalled();
    expect(servidor.get('nota-ret-4').publishedSubmissionId).toBe('nota-ret-4');
  });

  test('esborrar amb la capacitat: el diàleg diu que la paperera i l’esborrat també la retiren del Mur, i que arxivar no', () => {
    mocks.revocacio = true;
    mocks.cicle = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    render(<Proveidor servidor={servidor}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(screen.getByTestId('barra-borrar'));
    const dialeg = screen.getByRole('dialog');
    expect(within(dialeg).getByText(TEXTOS_ESBORRAR_PUBLICADA.publicada[1])).toBeTruthy();
    expect(TEXTOS_ESBORRAR_PUBLICADA.publicada[1]).toMatch(/arxivar-la.*també la retira del Mur públic per a tothom/);
    expect(TEXTOS_ESBORRAR_PUBLICADA.publicada[1]).toContain('Recuperar la nota no recupera la publicació');
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
    expect(within(dialeg).getByText(TEXTOS_ESBORRAR_PUBLICADA.definitiu[1])).toBeTruthy();
    expect(within(dialeg).queryByText('La publicació al Mur es queda on és.')).toBeNull();
  });

  test('esborrar sense la capacitat: el text de sempre', () => {
    mocks.cicle = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    render(<Proveidor servidor={servidor}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(screen.getByTestId('barra-borrar'));
    const dialeg = screen.getByRole('dialog');
    expect(within(dialeg).queryByText(TEXTOS_ESBORRAR_PUBLICADA.publicada[1])).toBeNull();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
    expect(within(dialeg).getByText('La publicació al Mur es queda on és.')).toBeTruthy();
  });

  test('paperera amb el transport caigut i la retirada encuada: el toast ho diu, sense disfressar res', async () => {
    mocks.revocacio = true;
    mocks.cicle = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    const mou = vi.fn(async () => { throw Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', revocacioPendent: true }); });
    render(<Proveidor servidor={servidor} mou={mou}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(screen.getByTestId('barra-borrar'));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar durant 30 dies' })); });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(R.pendentMoure, 'error'));
    expect(mou).toHaveBeenCalledWith('nota-ret-1', 'paperera', 3, 'nota-ret-1');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  /* Verificació R21 (P1) · El port encua una retirada per a TOTA paperera i
     tot esborrat amb el transport caigut; d'una nota que mai s'ha publicat no
     hi ha res a retirar i el toast no ho promet. */
  test('nota mai publicada a la paperera o esborrada amb el transport caigut: el text de sempre', async () => {
    mocks.revocacio = true;
    mocks.cicle = true;
    const servidor = new Map([['nota-ret-6', notaPublicada({ id: 'nota-ret-6', isPublished: false, publishedSubmissionId: null })]]);
    const caiguda = () => Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', revocacioPendent: true });
    const mou = vi.fn(async () => { throw caiguda(); });
    const esborra = vi.fn(async () => { throw caiguda(); });
    render(<Proveidor servidor={servidor} mou={mou} esborra={esborra}><NotesProvider><NotaViva id="nota-ret-6" /></NotesProvider></Proveidor>);
    fireEvent.click(screen.getByTestId('barra-borrar'));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Guardar durant 30 dies' })); });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith('No s’ha pogut moure la nota. Continua on estava.', 'error'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar definitivament' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar per sempre' })); });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith('No s’ha pogut borrar la nota. Continua on estava.', 'error'));
    expect(mocks.toast).not.toHaveBeenCalledWith(R.pendentMoure, 'error');
    expect(mocks.toast).not.toHaveBeenCalledWith(R.pendentBorrar, 'error');
    expect(JSON.stringify(window.localStorage)).not.toMatch(/nota-ret-6/);
  });

  test('esborrar una nota publicada amb el transport caigut: pendent, i el Bloc la reprén', async () => {
    mocks.revocacio = true;
    mocks.cicle = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    const esborra = vi.fn(async () => { throw Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', revocacioPendent: true }); });
    render(<Proveidor servidor={servidor} esborra={esborra}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    fireEvent.click(screen.getByTestId('barra-borrar'));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar definitivament' }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Borrar per sempre' })); });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(R.pendentBorrar, 'error'));
    // El diàleg es queda obert (la nota continua on era) i el panell ja diu que és pendent.
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(within(panell()).getByText(R.pendent)).toBeTruthy();
    await act(async () => { window.dispatchEvent(new Event('online')); });
    expect(mocks.drena).toHaveBeenCalled();
    expect(servidor.get('nota-ret-1').isPublished).toBe(true);
    expect(within(panell()).getByText(R.pendent)).toBeTruthy();
  });

  /* Verificació R21 (P1) · Amb la llavor, el port pot tindre els mètodes de
     la capacitat (host.js instal·la l'adaptador Supabase), però res no arriba
     a cap servidor: cap promesa de retirar. */
  test('llavor amb la capacitat del port: cap retirada, i el diàleg d’esborrar diu el text de sempre', () => {
    mocks.revocacio = true;
    mocks.cicle = true;
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    render(<Proveidor servidor={servidor} dataMode="seed"><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    expect(within(panell()).getByText(MOTIU_LOCAL)).toBeTruthy();
    expect(within(panell()).queryByRole('button', { name: R.accio })).toBeNull();
    expect(within(panell()).queryByText(R.avis)).toBeNull();
    fireEvent.click(screen.getByTestId('barra-borrar'));
    const dialeg = screen.getByRole('dialog');
    expect(within(dialeg).queryByText(TEXTOS_ESBORRAR_PUBLICADA.publicada[1])).toBeNull();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Borrar definitivament' }));
    expect(within(dialeg).getByText('La publicació al Mur es queda on és.')).toBeTruthy();
    expect(within(dialeg).queryByText(TEXTOS_ESBORRAR_PUBLICADA.definitiu[1])).toBeNull();
  });

  /* Verificació R21 (P1) · Una fila del Mur oberta al Bloc sense cap nota
     (nota en memòria, `publicacio:mur:<uuid>`, revisió 0): updateNote no la
     pot despublicar. Ni s'oferix ni es crida. */
  test.each([
    ['amb la capacitat', true, TEXTOS_VISIBILITAT_NOTA.motiuRetiraSenseNota[1]],
    ['sense la capacitat', false, MOTIU_PUBLICADA],
  ])('publicació oberta sense nota (%s): «privada» bloquejada, amb el motiu cert', (_nom, capacitat, motiu) => {
    mocks.revocacio = capacitat;
    const fila = { id: '3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b', title: 'Festes de Sant Roc', content: '<p>Programa.</p>', author_user_id: 'persona-ret' };
    const actualitza = vi.fn();
    render(
      <Proveidor servidor={new Map()} falla={(...args) => { actualitza(...args); return null; }}>
        <NotesProvider><PublicacioEditable item={publicacioComANota(fila, 'mur')} /></NotesProvider>
      </Proveidor>,
    );
    expect(radioPrivada().disabled).toBe(true);
    expect(within(panell()).getByText(motiu)).toBeTruthy();
    expect(within(panell()).queryByRole('button', { name: R.accio })).toBeNull();
    fireEvent.click(radioPrivada());
    expect(within(panell()).queryByText(R.avis)).toBeNull();
    expect(within(panell()).queryByText(/continua privada al teu Bloc/)).toBeNull();
    expect(actualitza).not.toHaveBeenCalled();
  });

  /* Gauntlet R22 (notes-03) · Una retirada pendent no pot deixar la nota bloquejada per sempre. */
  test('R22 · A retira X sense connexió; un altre dispositiu retira X i republica Y: la marca se’n va i el panell es desbloqueja', async () => {
    mocks.revocacio = true;
    const X = '11111111-1111-4111-8111-111111111111', Y = '22222222-2222-4222-8222-222222222222';
    const servidor = new Map([['nota-ret-1', notaPublicada({ publishedSubmissionId: X })]]);
    let caigut = true;
    const falla = () => (caigut ? Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', status: 0, revocacioPendent: true }) : null);
    const ctl = {};
    render(<Proveidor servidor={servidor} falla={falla} ctl={ctl}><NotesProvider><NotaViva id="nota-ret-1" ctl={ctl} /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    await within(panell()).findByText(R.pendent);
    expect(ctl.ctx.retiradaPendentDeNota('nota-ret-1')).toBe(true);
    // Mentre A és fora de línia, B retira X i republica amb Y.
    const n = servidor.get('nota-ret-1');
    servidor.set('nota-ret-1', { ...n, isPublished: true, publishedSubmissionId: Y, revision: n.revision + 2 });
    // Torna la connexió: el servidor troba X ja retirat i fa ACK (pendents 0); la llista porta Y.
    caigut = false;
    mocks.drena.mockResolvedValue({ pendents: 0 });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(ctl.ctx.retiradaPendentDeNota('nota-ret-1')).toBe(false));
    expect(within(panell()).queryByText(R.pendent)).toBeNull();
    expect(radioPublica().closest('fieldset').disabled).toBe(false);
    fireEvent.click(radioPublica());
    expect(within(panell()).getByRole('button', { name: 'Actualitzar al Mur' }).disabled).toBe(false);
    const nota = ctl.ctx.notes.find((x) => x.id === 'nota-ret-1');
    await act(async () => { expect(await ctl.ctx.publishNote(nota)).toBe(true); });
    expect(mocks.send.mock.calls.at(-1)[0]).toMatchObject({ id: Y, noteId: 'nota-ret-1' });
    // Y és una decisió posterior i legítima: ni «feta» ni «fallida».
    expect(mocks.toast).not.toHaveBeenCalledWith(R.pendentFallida, expect.anything());
    expect(mocks.toast).not.toHaveBeenCalledWith(R.feta, 'success');
    // La marca tampoc no sobreviu a la recàrrega.
    expect(Object.keys(window.localStorage).filter((k) => /retiradesPendents/.test(k))
      .map((k) => window.localStorage.getItem(k)).join()).not.toMatch(/nota-ret-1/);
  });

  test('R22 · la cua diu que no queda res pendent i la llista recarregada encara la porta publicada: pendentFallida i es pot tornar a retirar', async () => {
    mocks.revocacio = true;
    const X = '33333333-3333-4333-8333-333333333333';
    const servidor = new Map([['nota-ret-1', notaPublicada({ publishedSubmissionId: X })]]);
    let caigut = true;
    const falla = () => (caigut ? Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', status: 0, revocacioPendent: true }) : null);
    const ctl = {};
    render(<Proveidor servidor={servidor} falla={falla} ctl={ctl}><NotesProvider><NotaViva id="nota-ret-1" ctl={ctl} /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    await within(panell()).findByText(R.pendent);
    // La cua s'ha buidat sense retirar-la (fila descartada o diari perdut); la llista recarregada la porta amb X.
    caigut = false;
    mocks.drena.mockResolvedValue({ pendents: 0 });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(R.pendentFallida, 'error'));
    expect(ctl.ctx.retiradaPendentDeNota('nota-ret-1')).toBe(false);
    expect(within(panell()).queryByText(R.pendent)).toBeNull();
    expect(servidor.get('nota-ret-1').isPublished).toBe(true);
    // Es pot tornar a retirar des del mateix lloc.
    fireEvent.click(radioPrivada());
    expect(within(panell()).getByRole('button', { name: R.accio }).disabled).toBe(false);
  });

  /* Gauntlet R22 (ronda 3, notes-03) · Amb més de 50 notes, la recàrrega arriba pàgina a pàgina: la primera pàgina
     fa una llista nova però conserva la fila vella de la nota (encara publicada). Això no és cap resposta sobre la
     nota: ni «fallida» ni marca esborrada. Decidix la resposta que porta la nota. */
  test('R22 (ronda 3) · la primera pàgina de la recàrrega no porta la nota: cap fallida falsa, i la resposta que la porta diu «feta»', async () => {
    mocks.revocacio = true;
    const X = '44444444-4444-4444-8444-444444444444';
    const servidor = new Map([
      ['nota-ret-1', notaPublicada({ publishedSubmissionId: X })],
      ['nota-altra', notaPublicada({ id: 'nota-altra', title: 'Una altra', isPublished: false, publishedSubmissionId: null })],
    ]);
    let caigut = true;
    const falla = () => (caigut ? Object.assign(new Error('Error de xarxa'), { codi: 'backend-inabastable', status: 0, revocacioPendent: true }) : null);
    // La pàgina 1: les altres files són noves; la de nota-ret-1 (de la pàgina 2) és l'objecte vell, com fa mergeNotes.
    const pagina = (previes, srv) => previes.map((n) => (n.id === 'nota-ret-1' ? n : { ...srv.get(n.id) }));
    let obri;
    const ctl = { esperaResolucio: new Promise((resol) => { obri = resol; }) };
    render(<Proveidor servidor={servidor} falla={falla} ctl={ctl} pagina={pagina}><NotesProvider><NotaViva id="nota-ret-1" ctl={ctl} /></NotesProvider></Proveidor>);
    fireEvent.click(radioPrivada());
    await act(async () => { fireEvent.click(within(panell()).getByRole('button', { name: R.accio })); });
    await within(panell()).findByText(R.pendent);
    const notesAbans = ctl.ctx.notes;
    // Torna la connexió: el drenatge retira X al servidor (ACK) i la cua queda buida.
    caigut = false;
    mocks.drena.mockImplementation(async () => {
      const n = servidor.get('nota-ret-1');
      servidor.set('nota-ret-1', { ...n, isPublished: false, publishedSubmissionId: null, revision: n.revision + 1 });
      return { pendents: 0 };
    });
    await act(async () => { window.dispatchEvent(new Event('online')); });
    await waitFor(() => expect(ctl.ctx.notes).not.toBe(notesAbans));
    await act(async () => { await new Promise((resol) => { setTimeout(resol, 20); }); });
    // La llista és nova, però la fila de la nota és la vella: res no s'ha decidit.
    expect(ctl.ctx.notes.find((n) => n.id === 'nota-ret-1').isPublished).toBe(true);
    expect(mocks.toast).not.toHaveBeenCalledWith(R.pendentFallida, expect.anything());
    expect(ctl.ctx.retiradaPendentDeNota('nota-ret-1')).toBe(true);
    // Arriba la resposta que porta la nota: no és publicada.
    await act(async () => { obri(); });
    await waitFor(() => expect(mocks.toast).toHaveBeenCalledWith(R.feta, 'success'));
    expect(ctl.ctx.retiradaPendentDeNota('nota-ret-1')).toBe(false);
    expect(mocks.toast).not.toHaveBeenCalledWith(R.pendentFallida, expect.anything());
  });

  test('en castellà: la confirmació i el resultat en la llengua de l’app', async () => {
    mocks.revocacio = true;
    mocks.t = createTranslator('es');
    const servidor = new Map([['nota-ret-1', notaPublicada()]]);
    render(<Proveidor servidor={servidor}><NotesProvider><NotaViva id="nota-ret-1" /></NotesProvider></Proveidor>);
    const regio = screen.getByRole('region', { name: mocks.t('section.notes.visibilitat.enLinia.llegenda') });
    fireEvent.click(within(regio).getAllByRole('radio')[0]);
    expect(within(regio).getByText(mocks.t('section.notes.visibilitat.retirada.avis'))).toBeTruthy();
    await act(async () => { fireEvent.click(within(regio).getByRole('button', { name: 'Retirar del Muro' })); });
    expect(await within(regio).findByText(mocks.t('section.notes.visibilitat.retirada.feta'))).toBeTruthy();
    expect(mocks.t('section.notes.visibilitat.retirada.feta')).not.toBe(R.feta);
  });
});
