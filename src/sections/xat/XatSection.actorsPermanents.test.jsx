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
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { agrupaComunitats, mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import useObriXatPerDefecte, { RUTA_XAT_DE_LA_IAIA, RUTA_XAT_DE_SERVEI_TECNIC_DE_JAVI, rutaDelXatDeJavi } from './useObriXatPerDefecte.js';
import { POBLE_PER_DEFECTE, pobleDelXat } from './pobleAmfitrio.js';
import { CLAU_FILA_DE_SOC_DE_POBLE, RUTA_SOBRE_DE_SOC_DE_POBLE } from './actorsDelXat.js';
import Compositor from './components/Compositor.jsx';
import CapcaleraConversa from './components/CapcaleraConversa.jsx';
import { AppGridContext } from '../../components/layout/AppGridShell.jsx';
import { ambXatsPerDefecte, filDeMostraDeJavi, missatgesDeMostraDeJavi } from '../../data/xatsPerDefecte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { arrenca } from '../../host.js';
import { getBackendImplementation, setBackendImplementation } from '../../data/backendPort.js';
import { CONTRACTE_NUCLI } from '../../data/contracte.js';
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
  filServeiTecnic: null,
  /* P1-70 (261029) · Amb cert, la secció llig el context de veres que hi haja
     (el del xat de mostra, FakeChatOnboarding) i només sense, el doble. */
  ambContextDeVeres: false,
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
vi.mock('./XatContext', async (importOriginal) => {
  const original = await importOriginal();
  const { useContext } = await import('react');
  return {
    ...original,
    useXat: () => {
      const deVeres = useContext(original.XatContext);
      if (mocks.ambContextDeVeres && deVeres) return deVeres;
      return {
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
        filServeiTecnic: mocks.filServeiTecnic,
        consumixEntrada: undefined
      };
    }
  };
});
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.showToast })
}));
/* Gauntlet 261025_0545 (DF-03) · L'adaptador de veres ja no s'importa ací: el
   compon l'arrencada de l'host, l'única porta cap a src/data/supabase
   (tractor-enxufe E1). <soc-de-poble> no hi pinta res, i a Vitest l'espai de
   noms del mòdul porta getters que el port no admet: el mock en fa la còpia
   plana, sense canviar cap mètode. */
vi.mock('../../PedraSecaEmbed.jsx', () => ({ defineCustomElement: vi.fn() }));
vi.mock('../../data/supabase/index.js', async (importOriginal) => ({ ...await importOriginal() }));

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
/* Gauntlet 261025_0545 (DF-03) · El loadFils de l'adaptador, tal com el deixa
   al port host.arrenca(). Després el port torna a quedar com el veien estes
   proves, sense cap capacitat (cap control d'adjunts no consulta res): el nucli
   és «fora d'àmbit» i, en desenvolupament (Vitest ho és), `force` passa el segell. */
let loadFils;
beforeAll(async () => {
  await arrenca();
  ({ loadFils } = getBackendImplementation());
  const foraDAmbit = Object.fromEntries(CONTRACTE_NUCLI.map((nom) => [nom, () => { throw new Error(`Fora d’àmbit: ${nom}`); }]));
  setBackendImplementation(foraDAmbit, true);
});
const ambLaLlistaDe = async (dataMode) => {
  mocks.threads = (await loadFils({ dataMode, tenantId: TENANT })).map((f) => mapejaFil(f));
  mocks.comunitats = agrupaComunitats(mocks.threads);
};
const llista = () => screen.getByRole('list', { name: 'Converses' });
const navegacions = () => mocks.navigate.mock.calls;
const clausDeLaLlista = () => [...llista().querySelectorAll(':scope > li')].map((li) => li.getAttribute('data-clau'));
/* Un id remot qualsevol de l'entitat pilot, com el que torna loadPerfilPublic('socdepoble'). */
const UUID_SDP = '7d1e5c2a-0000-4000-8000-0000000000aa';

test.each([
  { id: 'fake-iaia', tipus: 'ia', senseSessio: true },
  { id: 'iaia-real', tipus: 'iaia', senseSessio: false }
])('consulta Wiki en el fil $id, retirada quan la IAIA s’apaga', ({ id, tipus, senseSessio }) => {
  mocks.senseSessio = senseSessio;
  mocks.threadId = id;
  mocks.threads = [{ id, tipus, name: 'IAIA MarIA', title: 'IAIA MarIA', potEscriure: true }];
  const vista = render(<XatSection />);
  expect(screen.getByRole('button', { name: 'Pregunta a la IAIA' })).toBeTruthy();
  mocks.iaiaApagada = true;
  vista.rerender(<XatSection />);
  expect(screen.queryByRole('button', { name: 'Pregunta a la IAIA' })).toBeNull();
});

test('el mateix nom en un altre directe no activa l’ajuda oficial', () => {
  mocks.threadId = 'un-altre';
  mocks.threads = [{ id: 'un-altre', tipus: 'directe', name: 'IAIA MarIA', title: 'IAIA MarIA', potEscriure: true }];
  render(<XatSection />);
  expect(screen.queryByRole('button', { name: 'Pregunta a la IAIA' })).toBeNull();
});

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
  mocks.filServeiTecnic = null;
  mocks.ambContextDeVeres = false;
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

  /* QA-R2-05 (Codex, Ronda 2) · Derogat «sense l'id remot de l'entitat, cap
     fila de Sóc de Poble»: el primer actor de l'ordre del Mestre no
     desapareix mentre el backend encara no ha donat l'UUID. La reserva hi és
     amb la mateixa clau, però només és l'enllaç públic a /socdepoble (cap
     acció pel slug: ni ?sobre= ni cap fil). Quan arriba l'UUID, la mateixa
     fila porta a la comunitat, i la comunitat de veres, reconeguda per
     l'UUID, la substituïx: mai dos «Sóc de Poble» de Sóc de Poble. */
  test('en remot, sense l’id de l’entitat pilot (remot buit, sense registre): la reserva hi és, una sola, i només porta a /socdepoble', () => {
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
    const files = [...llista().querySelectorAll(':scope > li')];
    expect(files.filter((li) => li.textContent.includes('Sóc de Poble'))).toEqual([files[0]]);
    expect(llista().querySelector('li[data-clau="sdp-per-defecte:socdepoble"]')).toBeNull();
    fireEvent.click(llista().querySelector(`li[data-clau="${CLAU_FILA_DE_SOC_DE_POBLE}"] button`));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/socdepoble');
    expect(navegacions().flat().some((ruta) => String(ruta).includes('sobre='))).toBe(false);
  });

  test('en remot, l’UUID arriba després: la mateixa fila (clau estable) porta a la comunitat, i la comunitat de veres la substituïx sense duplicar', () => {
    const vista = render(<XatSection />);
    expect(clausDeLaLlista()[0]).toBe(CLAU_FILA_DE_SOC_DE_POBLE);
    act(() => { registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_SDP, slug: 'socdepoble' }); });
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
    fireEvent.click(llista().querySelector(`li[data-clau="${CLAU_FILA_DE_SOC_DE_POBLE}"] button`));
    expect(mocks.navigate).toHaveBeenLastCalledWith(RUTA_SOBRE_DE_SOC_DE_POBLE);
    /* La comunitat de veres arriba a la llista amb el seu UUID. */
    const deVeres = mapejaFil({ id: 'c-sdp-remota', tipus: 'comunitat', titol: 'Sóc de Poble', subjecte: { tipus: 'entitat', id: UUID_SDP, ruta: `/empresa/${UUID_SDP}`, titol: 'Sóc de Poble' } });
    mocks.threads = [...mocks.threads, deVeres];
    mocks.comunitats = agrupaComunitats(mocks.threads);
    vista.rerender(<XatSection />);
    const claus = clausDeLaLlista();
    expect(claus.slice(0, 4)).toEqual(['comunitat:c-sdp-remota', 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
    expect(claus).not.toContain(CLAU_FILA_DE_SOC_DE_POBLE);
    const files = [...llista().querySelectorAll(':scope > li')];
    expect(files.filter((li) => li.textContent.includes('Sóc de Poble'))).toEqual([files[0]]);
  });

  test('en remot, un homònim alié (una altra entitat que es diu «Sóc de Poble») no ocupa el lloc de la reserva: mai pel nom', () => {
    const UUID_ALIE = '7d1e5c2a-0000-4000-8000-0000000000bb';
    const alie = mapejaFil({ id: 'c-alie', tipus: 'comunitat', titol: 'Sóc de Poble', subjecte: { tipus: 'entitat', id: UUID_ALIE, ruta: `/empresa/${UUID_ALIE}`, titol: 'Sóc de Poble' } });
    mocks.threads = [...mocks.threads, alie];
    mocks.comunitats = agrupaComunitats(mocks.threads);
    const vista = render(<XatSection />);
    expect(clausDeLaLlista().slice(0, 4)).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
    expect(clausDeLaLlista()).toContain('comunitat:c-alie');
    /* Amb l'UUID de Sóc de Poble registrat, l'alié continua sense ser-ho. */
    act(() => { registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_SDP, slug: 'socdepoble' }); });
    vista.rerender(<XatSection />);
    expect(clausDeLaLlista()[0]).toBe(CLAU_FILA_DE_SOC_DE_POBLE);
    expect(clausDeLaLlista().indexOf('comunitat:c-alie')).toBeGreaterThan(3);
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
    /* Ordre del Mestre (261026_2126, P1-36) · Sense el «…»: la pulsació
       llarga (ací, Maj+F10 i el menú contextual). Cap dels quatre actors la
       pot obrir: ni la comunitat, ni Javi, ni el poble, ni la IAIA. */
    const botoDe = (clau) => llista().querySelector(`li[data-clau="${clau}"] > button`);
    for (const clau of [CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']) {
      expect(botoDe(clau).hasAttribute('aria-keyshortcuts'), clau).toBe(false);
      expect(fireEvent.contextMenu(botoDe(clau)), clau).toBe(true);
      fireEvent.keyDown(botoDe(clau), { key: 'F10', shiftKey: true });
    }
    expect(clausDeLaLlista()).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Eixir de la selecció de xats' })).toBeNull();
    fireEvent.keyDown(botoDe('f-pepa'), { key: 'F10', shiftKey: true });
    expect(clausDeLaLlista()).toEqual(['f-pepa']);
    expect(botoDe('f-pepa').getAttribute('aria-checked')).toBe('true');
  });

  test('un amfitrió que declara un altre poble el substituïx: la fila és la seua, no la de la Torre', () => {
    mocks.externalConfig = { poble: 'sella', nomPoble: 'Gent de Sella' };
    render(<XatSection />);
    expect(llista().querySelector('li[data-clau="poble:sella"]')).not.toBeNull();
    expect(llista().querySelector('li[data-clau="poble:la-torre-de-les-macanes"]')).toBeNull();
  });

  test('pobleDelXat: el declarat mana; sense, el poble de la llavor amb el nom de l’ordre', () => {
    expect(POBLE_PER_DEFECTE).toEqual({ id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre', avatar: '/assets/towns/la-torre-de-les-macanes/2.jpg' });
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

  /* P1-70 (261029) · Derogat «Javi torna a la llista»: la seua fila obri la
     conversa d'atenció personal i servei tècnic (fake-javi), mai cap directe
     amb ell mateix (SDP-XAT-002). */
  test('Javi a /xat/sdp-per-defecte:javi (la seua pròpia fila) obri la conversa de servei tècnic, sense directe amb ell mateix ni avís', () => {
    mocks.modeDades = 'seed';
    mocks.joId = '0001';
    mocks.threads = ambXatsPerDefecte([]).map((f) => mapejaFil(f));
    mocks.filServeiTecnic = filDeMostraDeJavi({ avis: 'tu mateix', ambMissatge: false });
    mocks.threadId = 'sdp-per-defecte:javi';
    render(<XatSection />);
    expect(navegacions()).toEqual([['/xat/fake-javi', { replace: true }]]);
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

  /* P1-70 (261029; decisió de l'orquestrador, a ratificar pel Mestre) · En
     remot, el directe de veres NOMÉS amb l'UUID del compte de Javi declarat a
     IDS_REMOTS_FUNDACIONALS: mai pel slug ni per un àlies de la llavor. Hui
     no n'hi ha cap de declarat (és decisió del Mestre) i la ruta és null. */
  test('P1-70 · rutaDelXatDeJavi en remot: el directe amb l’UUID declarat de Javi; sense, cap; mai pel slug', () => {
    const UUID = '5a5a5a5a-0000-4000-8000-0000000000bb';
    expect(rutaDelXatDeJavi('remote', { idsRemots: { javillinares: [UUID] } })).toBe(`/xat?amb=${UUID}`);
    expect(rutaDelXatDeJavi('remote', { idsRemots: { javillinares: [] } })).toBeNull();
    expect(rutaDelXatDeJavi('remote', { idsRemots: { javillinares: ['  '] } })).toBeNull();
    expect(rutaDelXatDeJavi('remote', { idsRemots: { socdepoble: [UUID] } })).toBeNull();
    expect(rutaDelXatDeJavi('remote', { idsRemots: {} })).toBeNull();
    /* La llavor no canvia: el seu id del padró, encara que n'hi haja un de remot. */
    expect(rutaDelXatDeJavi('seed', { idsRemots: { javillinares: [UUID] } })).toBe('/xat?amb=0001');
    expect(RUTA_XAT_DE_SERVEI_TECNIC_DE_JAVI).toBe('/xat/fake-javi');
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
  /* P1-70 (261029) · Derogat el toast «Este contacte encara no està connectat
     al xat del poble»: la fila obri SEMPRE la conversa d'atenció personal i
     servei tècnic. Cap xat amb qualsevol que es diga igual (mai pel nom): el
     compte remot de Javi no està declarat i la conversa ho diu, de només lectura. */
  test('en remot amb sessió, la fila de Javi obri sempre la conversa de servei tècnic: cap avís que bloqueja, cap directe amb qualsevol que es diga igual', () => {
    const avis = 'El compte de Javi Llinares encara no està connectat al xat d’este poble. Mentrestant, per a atenció personal i servei tècnic, escriu al grup General de la comunitat Sóc de Poble.';
    mocks.filServeiTecnic = filDeMostraDeJavi({ avis, ambMissatge: false });
    mocks.threadId = 'sdp-per-defecte:javi';
    const vista = render(<XatSection />);
    expect(navegacions()).toEqual([['/xat/fake-javi', { replace: true }]]);
    expect(mocks.showToast).not.toHaveBeenCalled();
    mocks.threadId = 'fake-javi';
    vista.rerender(<XatSection />);
    expect(screen.queryByTestId('pagina-no-trobada')).toBeNull();
    expect(screen.getAllByRole('status').some((node) => node.textContent === avis)).toBe(true);
    expect(screen.queryByRole('textbox', { name: /Escriu un missatge/ })).toBeNull();
    expect(navegacions().some(([ruta]) => String(ruta).startsWith('/xat?amb='))).toBe(false);
    /* fake-javi no es llig mai al port. */
    expect(mocks.openThread.mock.calls.every(([filId]) => filId === null || filId === 'fake-javi')).toBe(true);
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

  /* Gauntlet 261022_0225 (XAT-4) · El compositor d'un fil de mostra no hi
     afig cap enllaç cru a /registre. Pla 261027_0845 (Guarda Nocturna),
     P1-54 · Tampoc no hi ha cap parella d'accés al peu de la conversa:
     l'accés (AccesAlXat) viu només a l'aterratge del Xat
     (XatSection.avatars.test.jsx). */
  test('un fil de mostra no porta cap enllaç propi a la pàgina de registre', () => {
    const { container } = pinta({ id: 'fake-javi', tipus: 'persona', potEscriure: false, avisNomesLectura: "Si t'agrada el que veus, registra't per a entrar al xat de veritat!" });
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('a[href^="/registre"]')).toBeNull();
  });
});

/* P1-70 (ordre del Mestre, 261029 18:20, amb captura de /xat: «No me veo a
   mí como Javi Llinares […] falta la IAIA MarIA […] a Gent de la Torre le
   falta la imagen») · Els quatre actors permanents en TOTS els modes: sense
   sessió (el xat de mostra de veres, FakeChatOnboarding), amb sessió local,
   amb sessió remota encara que chatThreads siga [] i quan qui mira és Javi.
   La fila de Javi obri SEMPRE una conversa, sense cap avís que la bloquege. */
describe('P1-70 · els quatre actors permanents en tots els modes', () => {
  const AVIS_TU = 'Esta és la teua fila d’atenció personal i servei tècnic, tal com la veu la gent del poble. Les converses que t’escriguen arribaran a la llista com a directes.';
  const AVIS_SENSE = 'El compte de Javi Llinares encara no està connectat al xat d’este poble. Mentrestant, per a atenció personal i servei tècnic, escriu al grup General de la comunitat Sóc de Poble.';
  const ACTORS = ['sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia'];
  const filaDe = (clau) => llista().querySelector(`li[data-clau="${clau}"]`);
  const caraDe = (fila) => fila?.querySelector('img.sdp-avatar__imatge')?.getAttribute('src') ?? null;
  const nomsDeDalt = (n) => [...llista().querySelectorAll(':scope > li .sdp-xat-fila__nom')].slice(0, n).map((nom) => nom.firstChild.textContent);

  test('sense sessió (remot, el xat de mostra de veres): els quatre, tots amb la seua imatge (cap «GD») i Javi obri el seu xat sense cap avís', () => {
    mocks.senseSessio = true;
    mocks.joId = null;
    mocks.ambContextDeVeres = true;
    render(<XatSection />);
    expect(nomsDeDalt(4)).toEqual(['Sóc de Poble', 'Javi Llinares', 'Gent de la Torre', 'IAIA MarIA']);
    const files = [...llista().querySelectorAll(':scope > li')].slice(0, 4);
    expect(files.map(caraDe).every(Boolean)).toBe(true);
    expect(caraDe(files[2])).toBe(POBLE_PER_DEFECTE.avatar);
    expect(files[2].querySelector('.sdp-avatar').textContent).not.toContain('GD');
    fireEvent.click(files[1].querySelector('button'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/fake-javi');
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  test('sessió local, amb la llista real de l’adaptador: els quatre, la Torre amb la seua foto (towns buit) i Javi amb el seu subtítol', async () => {
    mocks.modeDades = 'local';
    await ambLaLlistaDe('local');
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, ...ACTORS]);
    expect(caraDe(filaDe('poble:la-torre-de-les-macanes'))).toBe(POBLE_PER_DEFECTE.avatar);
    expect(filaDe('sdp-per-defecte:javi').textContent).toContain('Atenció personal i servei tècnic');
  });

  test('sessió remota amb chatThreads [] (node sense poble, llista encara buida o un adaptador que no les sintetitza): els quatre', () => {
    mocks.threads = [];
    registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_SDP, slug: 'socdepoble' });
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, ...ACTORS]);
    expect(nomsDeDalt(4)).toEqual(['Sóc de Poble', 'Javi Llinares', 'Gent de la Torre', 'IAIA MarIA']);
    expect(caraDe(filaDe('poble:la-torre-de-les-macanes'))).toBe(POBLE_PER_DEFECTE.avatar);
    expect(screen.queryByText('Encara no tens cap conversa')).toBeNull();
  });

  /* QA-R2-05 · Sense l'UUID remot de l'entitat, la reserva pública de Sóc de Poble també hi és. */
  test('sessió remota amb chatThreads [] i la IAIA apagada (nivell d’IA 0): la reserva no la torna', () => {
    mocks.threads = [];
    mocks.iaiaApagada = true;
    render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes']);
  });

  test('mentre la sessió es comprova (remot, joId null): els quatre hi són i prémer Javi espera la sessió (cap 404) i després obri el servei tècnic', () => {
    mocks.threads = [];
    mocks.joId = null;
    const vista = render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, ...ACTORS]);
    mocks.threadId = 'sdp-per-defecte:javi';
    vista.rerender(<XatSection />);
    expect(navegacions()).toEqual([]);
    expect(screen.queryByTestId('pagina-no-trobada')).toBeNull();
    mocks.joId = 'jo';
    mocks.filServeiTecnic = filDeMostraDeJavi({ avis: AVIS_SENSE, ambMissatge: false });
    vista.rerender(<XatSection />);
    expect(navegacions()).toEqual([['/xat/fake-javi', { replace: true }]]);
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  test('qui mira és Javi (0001, llavor): la seua fila hi és i obri la conversa de servei tècnic, sense directe amb ell mateix', () => {
    mocks.modeDades = 'seed';
    mocks.joId = '0001';
    mocks.threads = ambXatsPerDefecte([]).map((f) => mapejaFil(f));
    mocks.filServeiTecnic = filDeMostraDeJavi({ avis: AVIS_TU, ambMissatge: false });
    const vista = render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, ...ACTORS]);
    fireEvent.click(filaDe('sdp-per-defecte:javi').querySelector('button'));
    expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/sdp-per-defecte%3Ajavi');
    mocks.threadId = 'sdp-per-defecte:javi';
    vista.rerender(<XatSection />);
    expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/fake-javi', { replace: true });
    expect(navegacions().some(([ruta]) => String(ruta).startsWith('/xat?amb='))).toBe(false);
    mocks.threadId = 'fake-javi';
    vista.rerender(<XatSection />);
    expect(screen.queryByTestId('pagina-no-trobada')).toBeNull();
    expect(screen.getAllByRole('status').some((node) => node.textContent === AVIS_TU)).toBe(true);
    expect(screen.queryByRole('textbox', { name: /Escriu un missatge/ })).toBeNull();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  test('qui mira és Javi en remot amb chatThreads []: la fila de reserva hi és i obri la seua conversa de servei tècnic', () => {
    mocks.threads = [];
    mocks.joId = '5a5a5a5a-0000-4000-8000-0000000000aa';
    mocks.filServeiTecnic = filDeMostraDeJavi({ avis: AVIS_TU, ambMissatge: false });
    const vista = render(<XatSection />);
    expect(clausDeLaLlista()).toEqual([CLAU_FILA_DE_SOC_DE_POBLE, ...ACTORS]);
    mocks.threadId = 'sdp-per-defecte:javi';
    vista.rerender(<XatSection />);
    expect(navegacions()).toEqual([['/xat/fake-javi', { replace: true }]]);
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  test('useObriXatPerDefecte · Javi mai no mostra cap avís: el directe on es pot; si no, la conversa de servei tècnic', () => {
    const { result } = renderHook(() => useObriXatPerDefecte());
    result.current('javi', { modeDades: 'seed' });
    result.current('javi', { modeDades: 'seed', serveiTecnic: true });
    result.current('javi', { modeDades: 'remote' });
    result.current('javi', { modeDades: 'remote', senseSessio: true });
    expect(navegacions()).toEqual([
      ['/xat?amb=0001', { replace: true }], ['/xat/fake-javi', { replace: true }],
      ['/xat/fake-javi', { replace: true }], ['/xat/fake-javi', { replace: true }]
    ]);
    expect(mocks.showToast).not.toHaveBeenCalled();
  });
});
