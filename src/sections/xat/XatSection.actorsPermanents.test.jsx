/* Gauntlet 261016 (prompt, Bloc 3.6; pla, Onada 1.2) · Ordre del Mestre:
   «Hi ha d'haver permanentment 4 converses visibles»: Sóc de Poble, Javi
   Llinares, Gent de la Torre i la IAIA MarIA. I «a localhost la IAIA falla en
   punxar-hi»: la fila per defecte de la IAIA anava SEMPRE al xat públic de
   /iaia, on en llavor i en local ningú no contesta (localXat només fa
   respondre el fil 'iaia'). Ara la via depén del mode de dades
   (useObriXatPerDefecte · rutaDelXatDeLaIAIA), la mateixa del botó «Anar al
   xat» de /iaia.
   Auditoria adversarial 261016 (P3, cobertura) · Derogat «/xat/sdp-per-
   defecte:iaia acabava en un 404 perquè la llavor no rebia la fila»: la
   llavor de veres porta sempre el fil 'iaia' (xatSeed.js) i la fila sintètica
   de la IAIA no hi arriba mai (supabase/xat.test.js). Les proves de cada mode
   munten ara la llista que torna l'adaptador de veres, no ambXatsPerDefecte([]):
   en llavor la fila «IAIA MarIA» és el fil 'iaia' i s'obri sola; en local (el
   magatzem naix buit) és la sintètica i va a ?amb=IAIA_ID. L'URL directa
   /xat/sdp-per-defecte:iaia en llavor no troba cap fila: és el [DEFECTE] de
   baix, que viu a XatSection.jsx.
   La fila de Javi obri el seu directe on el padró el coneix (llavor i local,
   amb sessió); qui no té sessió hi veu el xat de només lectura amb el
   missatge automàtic (XatContext en llavor i en local, FakeChatOnboarding en
   remot); en remot amb sessió el servidor no en declara el compte i un avís
   honest ho diu, sense obrir el xat amb qualsevol que es diga igual. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { AVIS_JAVI_NO_DISPONIBLE, RUTA_XAT_DE_LA_IAIA, rutaDelXatDeJavi } from './useObriXatPerDefecte.js';
import { POBLE_PER_DEFECTE, pobleDelXat } from './pobleAmfitrio.js';
import Compositor from './components/Compositor.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { ambXatsPerDefecte, filDeMostraDeJavi, missatgesDeMostraDeJavi } from '../../data/xatsPerDefecte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { loadFils } from '../../data/supabase/xat.js';
import { reiniciaLocalXat } from '../../data/localXat.js';
import { XAT_SEED_IDS } from '../../data/xatSeed.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  externalConfig: {},
  threads: [],
  missatges: {},
  modeDades: 'remote',
  openThread: vi.fn()
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: mocks.threadId }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../text/TextSection', async () => {
  const { createElement } = await import('react');
  return { default: ({ pageKey }) => createElement('div', { 'data-testid': 'document-per-defecte' }, pageKey) };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {}, towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: mocks.externalConfig })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: 'A',
    ambitEstable: 'P',
    status: 'ready',
    avis: null,
    chatThreads: mocks.threads,
    getThreadMessages: (filId) => mocks.missatges[filId] || [],
    sendChatMessage: vi.fn(async () => []),
    obriFil: mocks.openThread,
    creaFil: vi.fn(),
    cercaMembres: vi.fn(async () => []),
    totalNoLlegits: 0,
    hiHaMesAntics: () => false,
    carregantAntics: () => false,
    carregaMesAntics: () => {},
    reintenta: () => {},
    descartaFallit: () => {},
    marcaVist: () => {},
    comunitats: [],
    contactesFrequents: [],
    marcaLlegides: () => 0,
    obriFilDePagina: vi.fn(async () => null),
    joId: 'jo',
    joNom: 'Pepa',
    senseSessio: false,
    modeDades: mocks.modeDades,
    consumixEntrada: undefined
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.showToast })
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return 1280; }
});

/* La llista com la torna el port: cap conversa real, les tres files directes a la cua. */
const ambLesTresFiles = () => { mocks.threads = ambXatsPerDefecte([]).map((f) => mapejaFil(f)); };
/* Auditoria adversarial 261016 · La llista que torna l'adaptador de veres en
   `dataMode` (llavor o local, sense cap servidor), tal com la mapeja el context. */
const TENANT = '00000000-0000-4000-8000-000000000000';
const ambLaLlistaDe = async (dataMode) => {
  mocks.threads = (await loadFils({ dataMode, tenantId: TENANT })).map((f) => mapejaFil(f));
};
const llista = () => screen.getByRole('list', { name: 'Converses' });
const navegacions = () => mocks.navigate.mock.calls;

afterEach(cleanup);
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.navigate.mockReset();
  mocks.showToast.mockReset();
  mocks.openThread.mockReset();
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.externalConfig = {};
  mocks.missatges = {};
  mocks.modeDades = 'remote';
  reiniciaLocalXat();
  ambLesTresFiles();
  buidaEsborranys();
});

describe('les quatre converses de l’ordre', () => {
  test('sense amfitrió, la llista porta «Gent de la Torre» al capdamunt i, a la cua, Sóc de Poble, Javi Llinares i la IAIA', () => {
    render(<XatSection />);
    const files = [...llista().querySelectorAll(':scope > li')].map((li) => li.getAttribute('data-clau'));
    expect(files).toEqual(['poble:la-torre-de-les-macanes', 'sdp-per-defecte:socdepoble', 'sdp-per-defecte:javi', 'sdp-per-defecte:iaia']);
    const text = llista().textContent;
    for (const nom of ['Gent de la Torre', 'Sóc de Poble', 'Javi Llinares', 'IAIA MarIA']) expect(text).toContain(nom);
  });

  test('un amfitrió que declara un altre poble el substituïx: la fila és la seua, no la de la Torre', () => {
    mocks.externalConfig = { poble: 'sella', nomPoble: 'Gent de Sella' };
    render(<XatSection />);
    expect(llista().querySelector('li[data-clau="poble:sella"]')).not.toBeNull();
    expect(llista().querySelector('li[data-clau="poble:la-torre-de-les-macanes"]')).toBeNull();
  });

  test('pobleDelXat: el declarat mana; sense, el poble de la llavor amb el nom de l’ordre', () => {
    expect(POBLE_PER_DEFECTE).toEqual({ id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' });
    expect(Object.isFrozen(POBLE_PER_DEFECTE)).toBe(true);
    expect(pobleDelXat(null)).toBe(POBLE_PER_DEFECTE);
    const sella = { id: 'sella', nom: '' };
    expect(pobleDelXat(sella)).toBe(sella);
  });
});

describe('la IAIA a localhost (Bloc 3.6.2)', () => {
  /* Auditoria adversarial 261016 (P3) · Amb la llista de veres del mode local:
     el magatzem naix buit i la fila «IAIA MarIA» és la sintètica. */
  test('en mode local, /xat/sdp-per-defecte:iaia va al directe amb la IAIA (?amb=), on contesta, no al xat públic de /iaia', async () => {
    mocks.modeDades = 'local';
    await ambLaLlistaDe('local');
    expect(mocks.threads.some((f) => f.perDefecte === 'iaia')).toBe(true);
    mocks.threadId = 'sdp-per-defecte:iaia';
    render(<XatSection />);
    expect(navegacions()).toContainEqual([`/xat?amb=${encodeURIComponent(IAIA_ID)}`, { replace: true }]);
    expect(navegacions().some(([ruta]) => ruta === RUTA_XAT_DE_LA_IAIA)).toBe(false);
    expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:iaia');
  });

  test('en remot, com sempre: el xat públic de /iaia, una sola vegada', () => {
    mocks.threadId = 'sdp-per-defecte:iaia';
    render(<XatSection />);
    expect(navegacions().filter(([ruta]) => ruta === RUTA_XAT_DE_LA_IAIA)).toEqual([[RUTA_XAT_DE_LA_IAIA, { replace: true }]]);
  });

  test('en mode local, prémer la fila de la IAIA passa per la ruta de pas i acaba al directe', async () => {
    mocks.modeDades = 'local';
    await ambLaLlistaDe('local');
    const vista = render(<XatSection />);
    fireEvent.click(llista().querySelector('li[data-clau="sdp-per-defecte:iaia"] button'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/sdp-per-defecte%3Aiaia');
    mocks.threadId = 'sdp-per-defecte:iaia';
    mocks.params = new URLSearchParams();
    vista.rerender(<XatSection />);
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat?amb=${encodeURIComponent(IAIA_ID)}`, { replace: true });
  });

  /* Auditoria adversarial 261016 (P3) · En llavor la fila «IAIA MarIA» és el
     fil 'iaia' de la llavor (on contesta) i s'obri sol, sense ruta de pas: la
     sintètica no hi és. */
  test('en mode seed, la fila de la IAIA és el fil de la llavor i prémer-la l’obri directament', async () => {
    mocks.modeDades = 'seed';
    await ambLaLlistaDe('seed');
    expect(mocks.threads.some((f) => f.perDefecte === 'iaia')).toBe(false);
    expect(mocks.threads.find((f) => f.id === XAT_SEED_IDS.filIaia)).toMatchObject({ tipus: 'iaia', name: 'IAIA MarIA' });
    render(<XatSection />);
    expect(llista().querySelector('li[data-clau="sdp-per-defecte:iaia"]')).toBeNull();
    fireEvent.click(llista().querySelector(`li[data-clau="${XAT_SEED_IDS.filIaia}"] button`));
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/xat/${encodeURIComponent(XAT_SEED_IDS.filIaia)}`);
  });

  /* [DEFECTE] (pendent, fora de l'abast d'esta correcció: XatSection.jsx:423)
     · En llavor, l'URL directa /xat/sdp-per-defecte:iaia (un enllaç vell,
     l'historial) no troba cap fila: XatSection només encamina un id
     sintètic si la fila és a la llista, i ací la IAIA és el fil de la llavor.
     Ni ruta de pas ni avís: acaba en NotFoundPage. Quan XatSection encamine
     l'id per la seua clau (esIdPerDefecte), esta prova s'ha de girar. */
  test('[DEFECTE] en mode seed, l’URL directa /xat/sdp-per-defecte:iaia no porta enlloc', async () => {
    mocks.modeDades = 'seed';
    await ambLaLlistaDe('seed');
    mocks.threadId = 'sdp-per-defecte:iaia';
    render(<XatSection />);
    expect(navegacions().some(([ruta]) => String(ruta).startsWith('/xat?amb='))).toBe(false);
    expect(navegacions().some(([ruta]) => ruta === RUTA_XAT_DE_LA_IAIA)).toBe(false);
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:iaia');
  });
});

describe('la fila de Javi Llinares (Bloc 3.6.1)', () => {
  test('rutaDelXatDeJavi: en llavor i en local, el directe amb el seu id del padró; en remot (o un mode desconegut), cap', () => {
    expect(rutaDelXatDeJavi('seed')).toBe('/xat?amb=0001');
    expect(rutaDelXatDeJavi('local')).toBe('/xat?amb=0001');
    expect(rutaDelXatDeJavi('remote')).toBeNull();
    expect(rutaDelXatDeJavi(undefined)).toBeNull();
  });

  /* Amb sessió en llavor (el context d'esta prova porta joId i nom): la fila
     sintètica de sempre. Sense sessió, el context la canvia pel xat de només
     lectura (XatContext.test.jsx, i la prova de baix). */
  test('en mode seed i amb sessió, /xat/sdp-per-defecte:javi obri el directe amb Javi, amb replace i sense cap avís', () => {
    mocks.modeDades = 'seed';
    mocks.threadId = 'sdp-per-defecte:javi';
    render(<XatSection />);
    expect(navegacions()).toContainEqual(['/xat?amb=0001', { replace: true }]);
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:javi');
  });

  /* Auditoria adversarial 261016 (P2) · Derogat el text de SDP-XAT-016 («Esta
     persona no està disponible al xat.»), que el servidor reserva per a qui no
     ha donat el consentiment (supabase/xat.js): deia de Javi una cosa que no
     és la causa. L'avís és ara el del contacte que encara no està connectat
     al xat del poble, que ja és a les cinc llengües (FilaPersona). Com es
     declara el compte remot de Javi és decisió del Mestre: no s'obri res. */
  test('en remot amb sessió, cap xat amb qualsevol que es diga igual: l’avís honest (mai el del consentiment) i la llista, amb replace', () => {
    mocks.threadId = 'sdp-per-defecte:javi';
    render(<XatSection />);
    expect(AVIS_JAVI_NO_DISPONIBLE).toEqual(['section.xat.padro.ajudaPendent', 'Este contacte encara no està connectat al xat del poble.']);
    expect(mocks.showToast).toHaveBeenCalledWith('Este contacte encara no està connectat al xat del poble.', 'info');
    expect(mocks.showToast).not.toHaveBeenCalledWith('Esta persona no està disponible al xat.', expect.anything());
    expect(navegacions()).toContainEqual(['/xat', { replace: true }]);
    expect(navegacions().some(([ruta]) => String(ruta).startsWith('/xat?amb='))).toBe(false);
  });

  /* Auditoria adversarial 261016 (P3) · Qui no té sessió en llavor o en local
     (el convidat) té a la fila de Javi el seu xat de només lectura
     (filDeMostraDeJavi, posat pel context). Obrir-lo pinta el literal de
     l'ordre i cap camp d'escriure: només l'avís de registrar-se. */
  test('sense sessió en llavor, la fila de Javi obri el seu xat de només lectura: el literal i cap compositor', () => {
    mocks.modeDades = 'seed';
    const avis = "Si t'agrada el que veus, registra't per a entrar al xat de veritat!";
    mocks.threads = ambXatsPerDefecte([]).map((f) => mapejaFil(f)).map((f) => (f.perDefecte === 'javi' ? filDeMostraDeJavi({ avis }) : f));
    mocks.missatges = { 'fake-javi': missatgesDeMostraDeJavi('2026-10-16T03:00:00.000Z') };
    const vista = render(<XatSection />);
    fireEvent.click(llista().querySelector('li[data-clau="fake-javi"] button'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/fake-javi');
    mocks.threadId = 'fake-javi';
    vista.rerender(<XatSection />);
    expect(screen.getAllByText('«Este missatge és automàtic: per a poder parlar amb mi has de registrar-te.»').length).toBeGreaterThan(0);
    expect(screen.queryByRole('textbox', { name: /Escriu un missatge/ })).toBeNull();
    expect(screen.getAllByRole('status').some((node) => node.textContent === avis)).toBe(true);
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(navegacions().some(([ruta]) => String(ruta).startsWith('/xat?amb='))).toBe(false);
  });
});

describe('el compositor d’un fil de només lectura que no és uns Avisos', () => {
  const t = (_, alternativa) => alternativa;
  const pinta = (fil) => render(
    <AppGridContext.Provider value={{ mida: 'ample' }}>
      <Compositor valor="" onCanvia={() => {}} onEnvia={() => {}} t={t} fil={fil} />
    </AppGridContext.Provider>
  );

  test('porta el seu avís propi en lloc del dels Avisos, i cap camp d’escriure', () => {
    pinta({ id: 'fake-javi', tipus: 'persona', potEscriure: false, avisNomesLectura: "Si t'agrada el que veus, registra't per a entrar al xat de veritat!" });
    const avis = screen.getByRole('status');
    expect(avis.textContent).toBe("Si t'agrada el que veus, registra't per a entrar al xat de veritat!");
    expect(avis.className).toBe('sdp-xat-compositor sdp-xat-compositor--avis');
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  test('uns Avisos sense avís propi continuen dient el de sempre', () => {
    pinta({ id: 'avisos', tipus: 'canal', potEscriure: false });
    expect(screen.getByRole('status').textContent).toBe('En Avisos només escriuen els administradors.');
  });
});
