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
   honest ho diu, sense obrir el xat amb qualsevol que es diga igual.

   Gauntlet 261016_1530 (prompt, Bloc 3.6; relleu F21, F57-F61 i F63) ·
   ORDRE VIGENT, que mana sobre la del 261007: els quatre actors dalt de tot i
   en este ordre: 1r la Comunitat Sóc de Poble, 2n Javi Llinares, 3r Gent de
   la Torre i 4t la IAIA. «PROHIBIT duplicar Sóc de Poble»: fora la fila
   directa sintètica. La capçalera de cada actor porta a la seua pàgina
   canònica. I /xat/sdp-per-defecte:<clau> s'encamina per la clau encara que
   la fila no siga a la llista: la prova [DEFECTE] d'abans s'ha girat. Les
   proves munten la llista REAL que torna l'adaptador (llavor i local), amb
   les comunitats agrupades com al context. */
import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { agrupaComunitats, mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import useObriXatPerDefecte, { AVIS_JAVI_NO_DISPONIBLE, RUTA_XAT_DE_LA_IAIA, rutaDelXatDeJavi } from './useObriXatPerDefecte.js';
import { POBLE_PER_DEFECTE, pobleDelXat } from './pobleAmfitrio.js';
import { CLAU_FILA_DE_SOC_DE_POBLE, RUTA_SOBRE_DE_SOC_DE_POBLE } from './actorsDelXat.js';
import Compositor from './components/Compositor.jsx';
import CapcaleraConversa from './components/CapcaleraConversa.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { ambXatsPerDefecte, filDeMostraDeJavi, missatgesDeMostraDeJavi } from '../../data/xatsPerDefecte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { loadFils } from '../../data/supabase/xat.js';
import { reiniciaLocalXat } from '../../data/localXat.js';
import { XAT_SEED_IDS } from '../../data/xatSeed.js';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../config/navigation.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  externalConfig: {},
  threads: [],
  comunitats: [],
  missatges: {},
  modeDades: 'remote',
  joId: 'jo',
  iaiaApagada: false,
  senseSessio: false,
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
/* Gauntlet 261016_1530 · Una marca, no null: les proves veuen si el 404 es pinta (el parpelleig de l'MCR). */
vi.mock('../../pages/NotFoundPage', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('div', { 'data-testid': 'pagina-no-trobada' }) };
});
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
    comunitats: mocks.comunitats,
    contactesFrequents: [],
    marcaLlegides: () => 0,
    obriFilDePagina: vi.fn(async () => null),
    joId: mocks.joId,
    joNom: 'Pepa',
    senseSessio: mocks.senseSessio,
    iaiaApagada: mocks.iaiaApagada,
    esFilAmagat: () => false,
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

/* La llista com la torna el port en remot: cap conversa real, les dues files
   directes a la cua (Gauntlet 261016_1530: abans tres, amb Sóc de Poble). */
const ambLesFilesDelPort = () => { mocks.threads = ambXatsPerDefecte([]).map((f) => mapejaFil(f)); mocks.comunitats = []; };
/* Auditoria adversarial 261016 · La llista que torna l'adaptador de veres en
   `dataMode` (llavor o local, sense cap servidor), tal com la mapeja el context.
   Gauntlet 261016_1530 · I les comunitats agrupades com les agrupa el context
   (agrupaComunitats): la de Sóc de Poble de la llavor és UNA fila. */
const TENANT = '00000000-0000-4000-8000-000000000000';
const ambLaLlistaDe = async (dataMode) => {
  mocks.threads = (await loadFils({ dataMode, tenantId: TENANT })).map((f) => mapejaFil(f));
  mocks.comunitats = agrupaComunitats(mocks.threads);
};
const llista = () => screen.getByRole('list', { name: 'Converses' });
const navegacions = () => mocks.navigate.mock.calls;
const clausDeLaLlista = () => [...llista().querySelectorAll(':scope > li')].map((li) => li.getAttribute('data-clau'));
/* Un id remot qualsevol de l'entitat pilot, com el que torna loadPerfilPublic('socdepoble'). */
const UUID_SDP = '7d1e5c2a-0000-4000-8000-0000000000aa';

afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
});
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
  mocks.joId = 'jo';
  mocks.iaiaApagada = false;
  mocks.senseSessio = false;
  oblidaEntitatDelProjecte();
  reiniciaLocalXat();
  ambLesFilesDelPort();
  buidaEsborranys();
});

describe('les quatre converses de l’ordre', () => {
  /* Gauntlet 261016_1530 · Derogat «Gent de la Torre al capdamunt i, a la
     cua, Sóc de Poble, Javi Llinares i la IAIA»: l'ordre vigent és la
     comunitat de Sóc de Poble, Javi, Gent de la Torre i la IAIA, dalt de tot.
     En remot, la comunitat que encara no és a la llista té una fila que hi
     porta quan el backend ja ha donat l'id de l'entitat pilot. */
  test('en remot, els quatre actors dalt de tot i en l’ordre del Mestre: la comunitat de Sóc de Poble, Javi, Gent de la Torre i la IAIA', () => {
    registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_SDP, slug: 'socdepoble' });
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
    const noms = [...llista().querySelectorAll(':scope > li .sdp-xat-fila__nom')].map((nom) => nom.firstChild.textContent);
    expect(noms).toEqual(['Sóc de Poble', 'Javi Llinares', 'Gent de la Torre', 'IAIA MarIA']);
    /* La de Sóc de Poble és una comunitat (avatar quadrat), no cap directe. */
    expect(llista().querySelector(`li[data-clau="${CLAU_FILA_DE_SOC_DE_POBLE}"] .sdp-xat-fila--comunitat`)).not.toBeNull();
    expect(llista().querySelector('li[data-clau="sdp-per-defecte:socdepoble"]')).toBeNull();
  });

  /* Sense l'id remot de l'entitat la comunitat de veres no es podria
     reconéixer: cap fila que hi porte, per no pintar dos «Sóc de Poble». */
  test('en remot, sense l’id de l’entitat pilot, cap fila de Sóc de Poble: ni directa ni la que porta a la comunitat', () => {
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual(['sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
    expect(llista().textContent).not.toContain('Sóc de Poble');
  });

  /* L'encàrrec: una prova que munta la llista REAL de la llavor, no una
     sintètica. Era on l'MCR va trobar dos «Sóc de Poble» (la comunitat i el
     directe sintètic) i l'ordre poble, comunitat, IAIA, Sóc de Poble, Javi. */
  test('en llavor, amb la llista real de l’adaptador: els quatre en ordre i un sol «Sóc de Poble», la comunitat', async () => {
    mocks.modeDades = 'seed';
    await ambLaLlistaDe('seed');
    render(<XatSection />);
    const claus = clausDeLaLlista();
    expect(claus.slice(0, 4)).toEqual([`comunitat:${XAT_SEED_IDS.filComunitat}`, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', XAT_SEED_IDS.filIaia]);
    const files = [...llista().querySelectorAll(':scope > li')];
    expect(files.filter((li) => li.textContent.includes('Sóc de Poble'))).toEqual([files[0]]);
    expect(files.filter((li) => li.textContent.includes('Javi Llinares'))).toEqual([files[1]]);
    expect(files.filter((li) => li.textContent.includes('IAIA MarIA'))).toEqual([files[3]]);
    /* La comunitat porta els seus canals; cap directe sintètic de l'entitat. */
    expect(files[0].textContent).toContain('Avisos');
    expect(claus).not.toContain('sdp-per-defecte:socdepoble');
    expect(claus).not.toContain(CLAU_FILA_DE_SOC_DE_POBLE);
  });

  test('en local (el magatzem naix buit), la fila que porta a la comunitat de Sóc de Poble va la primera; prémer-la fa el camí del «Comentar» de /socdepoble', async () => {
    mocks.modeDades = 'local';
    await ambLaLlistaDe('local');
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
    fireEvent.click(llista().querySelector(`li[data-clau="${CLAU_FILA_DE_SOC_DE_POBLE}"] button`));
    expect(mocks.navigate).toHaveBeenLastCalledWith(RUTA_SOBRE_DE_SOC_DE_POBLE);
    expect(Object.fromEntries(new URL(RUTA_SOBRE_DE_SOC_DE_POBLE, 'http://localhost').searchParams))
      .toEqual({ sobre: 'entitat:socdepoble', titol: 'Sóc de Poble', ruta: '/socdepoble' });
  });

  test('una conversa fixada o amb activitat va darrere dels quatre; en «Seleccionar xats» la fila de la comunitat no es pot triar', async () => {
    mocks.modeDades = 'local';
    await ambLaLlistaDe('local');
    mocks.threads = [mapejaFil({ id: 'f-pepa', tipus: 'directe', titol: 'Pepa', fixatAl: '2026-10-16T09:00:00Z', ultimAl: '2026-10-16T10:00:00Z', ultimSeq: 1 }), ...mocks.threads];
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia', 'f-pepa']);
    fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
    expect(clausDeLaLlista()).toEqual(['f-pepa']);
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

  /* Gauntlet 261016_1530 (MCR b36_xat, proposta 1) · Girada la prova
     [DEFECTE] d'abans («en mode seed, l'URL directa /xat/sdp-per-defecte:iaia
     no porta enlloc»): XatSection encamina ara l'id sintètic per la seua clau
     (clauPerDefecteDe) encara que la fila no siga a la llista, i en llavor va
     al directe de la IAIA, on contesta. Sense el 404, ni un sol commit. */
  test('en mode seed, l’URL directa /xat/sdp-per-defecte:iaia va al directe amb la IAIA, amb replace i sense 404', async () => {
    mocks.modeDades = 'seed';
    await ambLaLlistaDe('seed');
    mocks.threadId = 'sdp-per-defecte:iaia';
    render(<XatSection />);
    expect(navegacions()).toEqual([[`/xat?amb=${encodeURIComponent(IAIA_ID)}`, { replace: true }]]);
    expect(navegacions().some(([ruta]) => ruta === RUTA_XAT_DE_LA_IAIA)).toBe(false);
    expect(screen.queryByTestId('pagina-no-trobada')).toBeNull();
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:iaia');
  });

  test('en mode seed, l’URL directa /xat/sdp-per-defecte:javi també s’encamina per la clau: el directe amb Javi', async () => {
    mocks.modeDades = 'seed';
    await ambLaLlistaDe('seed');
    mocks.threads = mocks.threads.filter((f) => f.perDefecte !== 'javi');
    mocks.threadId = 'sdp-per-defecte:javi';
    render(<XatSection />);
    expect(navegacions()).toEqual([['/xat?amb=0001', { replace: true }]]);
    expect(screen.queryByTestId('pagina-no-trobada')).toBeNull();
  });

  /* Les dues guardes de l'MCR (verdict, risc 2): amb la IAIA apagada mana la
     seua sortida (cap segona navegació al directe), i Javi no s'obri un xat
     amb ell mateix. */
  test('amb la IAIA apagada, /xat/sdp-per-defecte:iaia torna a la llista amb l’avís: una sola navegació, cap directe', async () => {
    mocks.modeDades = 'seed';
    mocks.iaiaApagada = true;
    await ambLaLlistaDe('seed');
    mocks.threadId = 'sdp-per-defecte:iaia';
    render(<XatSection />);
    expect(navegacions()).toEqual([['/xat', { replace: true }]]);
    expect(mocks.showToast).toHaveBeenCalledWith("La IAIA està apagada (nivell d'IA 0). La pots tornar a encendre a «Realitat».", 'info');
    expect(screen.queryByTestId('pagina-no-trobada')).toBeNull();
  });

  test('Javi a /xat/sdp-per-defecte:javi (la seua pròpia fila) torna a la llista, sense directe amb ell mateix ni avís', () => {
    mocks.modeDades = 'seed';
    mocks.joId = '0001';
    mocks.threads = ambXatsPerDefecte([]).map((f) => mapejaFil(f)).filter((f) => f.perDefecte !== 'javi');
    mocks.threadId = 'sdp-per-defecte:javi';
    render(<XatSection />);
    expect(navegacions()).toEqual([['/xat', { replace: true }]]);
    expect(mocks.showToast).not.toHaveBeenCalled();
    expect(screen.queryByTestId('pagina-no-trobada')).toBeNull();
  });

  test('la clau derogada (sdp-per-defecte:socdepoble) ja no obri cap directe amb l’entitat: és un id que no existix', () => {
    mocks.threadId = 'sdp-per-defecte:socdepoble';
    render(<XatSection />);
    expect(navegacions()).toEqual([]);
    expect(screen.getByTestId('pagina-no-trobada')).toBeTruthy();
    expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:socdepoble');
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

  /* Gauntlet 261016_1530 · Des que la ruta s'encamina per la clau, un enllaç
     vell hi pot portar qui no té sessió en remot: el seu xat de només lectura,
     com la fila del xat de mostra (FakeChatOnboarding), mai l'avís del compte. */
  test('en remot sense sessió, la clau de Javi porta al seu xat de només lectura (fake-javi), amb replace i sense avís', () => {
    const { result } = renderHook(() => useObriXatPerDefecte());
    result.current('javi', { modeDades: 'remote', senseSessio: true });
    expect(navegacions()).toEqual([['/xat/fake-javi', { replace: true }]]);
    expect(mocks.showToast).not.toHaveBeenCalled();
    /* La clau derogada no fa res. */
    result.current('socdepoble', { modeDades: 'remote' });
    expect(navegacions()).toHaveLength(1);
  });
});

/* Gauntlet 261016_1530 (Bloc 3.6.2; relleu F60, F61 i F63) · «Punxar a la
   capçalera de cada conversa oberta ha de portar directament a la seua
   pàgina/perfil canònic». Abans: Javi a /gent/0001 (i el seu xat de mostra,
   enlloc), un fil de la comunitat de Sóc de Poble a /empresa/socdepoble i la
   IAIA a /perfil/<id> (i la seua conversa de mostra, enlloc). */
describe('les capçaleres dels quatre actors (Bloc 3.6.2)', () => {
  const t = (_, alternativa) => alternativa;
  const rutaDe = (fil) => {
    const { container } = render(<CapcaleraConversa fil={fil} onTorna={() => {}} onSeleccionar={() => {}} t={t} />);
    const enllac = container.querySelector('a.sdp-xat-capcalera__enllac');
    const ruta = enllac ? enllac.getAttribute('href') : null;
    cleanup();
    return ruta;
  };

  test('Javi Llinares porta a /javillinares: el directe amb ell (per id o àlies) i el seu xat de només lectura', () => {
    expect(rutaDe(mapejaFil({ id: 'd-javi', tipus: 'directe', titol: 'Javi Llinares', altres: [{ id: '0001', tipus: 'persona', nom: 'Javi Llinares' }] }))).toBe('/javillinares');
    expect(rutaDe(mapejaFil({ id: 'd-javi2', tipus: 'directe', altres: [{ id: 'javillinares', tipus: 'persona', nom: 'Javi' }] }))).toBe('/javillinares');
    expect(rutaDe(filDeMostraDeJavi())).toBe('/javillinares');
  });

  test('la comunitat de Sóc de Poble (els seus Avisos, General i Beta testers) porta a /socdepoble; en remot, amb l’id que ha donat el backend', async () => {
    await ambLaLlistaDe('seed');
    for (const id of [XAT_SEED_IDS.filAvisos, XAT_SEED_IDS.filGeneral, XAT_SEED_IDS.filBetaTesters]) {
      expect(rutaDe(mocks.threads.find((f) => f.id === id))).toBe('/socdepoble');
    }
    const remot = mapejaFil({ id: 'g-r', tipus: 'grup', titol: 'General', subjecte: { tipus: 'entitat', id: UUID_SDP, ruta: `/empresa/${UUID_SDP}`, titol: 'Sóc de Poble' } });
    /* Sense l'id remot registrat, la ruta del servidor de sempre (cap reconeixement pel nom). */
    expect(rutaDe(remot)).toBe(`/empresa/${UUID_SDP}`);
    registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_SDP, slug: 'socdepoble' });
    expect(rutaDe(remot)).toBe('/socdepoble');
  });

  test('la IAIA porta a /iaia: el seu fil de la llavor i la seua conversa de mostra', async () => {
    await ambLaLlistaDe('seed');
    expect(rutaDe(mocks.threads.find((f) => f.id === XAT_SEED_IDS.filIaia))).toBe('/iaia');
    expect(rutaDe({ id: 'fake-iaia', name: 'IAIA MarIA', title: 'IAIA MarIA', tipus: 'ia' })).toBe('/iaia');
  });

  test('Gent de la Torre continua a la pàgina del poble, i la resta de converses, com sempre', () => {
    const subjecte = { tipus: 'poble', id: 'la-torre-de-les-macanes', ruta: '/pobles/la-torre-de-les-macanes', titol: 'Gent de la Torre' };
    expect(rutaDe(mapejaFil({ id: 'g-p', tipus: 'grup', titol: 'General', subjecte }))).toBe('/pobles/la-torre-de-les-macanes');
    expect(rutaDe(mapejaFil({ id: 'd-p', tipus: 'directe', titol: 'Pepa', altres: [{ id: 'pepa', tipus: 'persona', nom: 'Pepa' }] }))).toBe('/gent/pepa');
    expect(rutaDe(mapejaFil({ id: 'd-e', tipus: 'directe', titol: 'Forn', altres: [{ id: 'forn', tipus: 'entitat', nom: 'Sóc de Poble' }] }))).toBe('/empresa/forn');
    expect(rutaDe(mapejaFil({ id: 'g-c', tipus: 'grup', titol: 'Colla', altres: [{ id: 'a', tipus: 'persona' }, { id: 'b', tipus: 'persona' }] }))).toBeNull();
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

  test('un fil de mostra porta el botó blau Registra’t cap a la pàgina de registre', () => {
    pinta({ id: 'fake-javi', tipus: 'persona', potEscriure: false, avisNomesLectura: "Si t'agrada el que veus, registra't per a entrar al xat de veritat!" });
    const boto = screen.getByRole('link', { name: "Registra't" });
    expect(boto).not.toBeNull();
    expect(boto.getAttribute('href')).toBe('/registre?mode=entrar&tornar=%2Fxat');
    expect(boto.className).toContain('sdp-boto--primari');
  });
});
