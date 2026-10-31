/**
 * Onada 6 · El Xat operatiu per als beta testers i la identitat de la IAIA,
 * a la secció de veres (XatSection → XatWorkspace) amb useXat simulat:
 *   · prompt 261009_0230, punt 4 · «Informa d'un error» al peu de la llista
 *     obri el xat de feedback (en llavor, «Beta testers»; en remot, el xat
 *     privat amb Sóc de Poble) amb l'esborrany de l'informe;
 *   · tasca 12 · amb el nivell d'IA a 0, qui és dins d'un xat de la IAIA (o hi
 *     arriba pel seu descriptor) torna a la llista amb un avís, mai un 404.
 */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { buidaEsborranys, llegixEsborrany } from './esborranys.js';
import { mapejaFil } from './missatges.js';
import { PLANTILLA_INFORME } from './informeDError.js';
import { XAT_SEED_IDS } from '../../data/xatSeed.js';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import { XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  threads: [],
  createThread: vi.fn(),
  obriFilDePagina: vi.fn(),
  openThread: vi.fn(),
  joId: 'jo',
  senseSessio: false,
  iaiaApagada: false,
  amagats: new Set(),
  identitats: [],
  avis: null
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
vi.mock('../../pages/NotFoundPage', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('p', { 'data-testid': 'no-trobada' }, '404') };
});
vi.mock('../text/TextSection', async () => {
  const { createElement } = await import('react');
  return { default: ({ pageKey }) => createElement('div', { 'data-testid': 'document-per-defecte' }, pageKey) };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {}, towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: {} })
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useIdentitatOpcional: () => ({ identitats: mocks.identitats })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: 'A',
    ambitEstable: 'P',
    status: 'ready',
    avis: mocks.avis,
    llistaFresca: true,
    chatThreads: mocks.threads,
    getThreadMessages: () => [],
    sendChatMessage: vi.fn(async () => []),
    obriFil: mocks.openThread,
    creaFil: mocks.createThread,
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
    obriFilDePagina: mocks.obriFilDePagina,
    joId: mocks.joId,
    joNom: 'Javi',
    senseSessio: mocks.senseSessio,
    iaiaApagada: mocks.iaiaApagada,
    esFilAmagat: (id) => mocks.amagats.has(String(id))
  })
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

const ara = new Date().toISOString();
const fil = (id, extra = {}) => mapejaFil({ id, tipus: 'directe', titol: id, altresNoms: [], ultimAl: ara, ultimSeq: 1, llegitFinsSeq: 1, ...extra });
const BETA = XAT_SEED_IDS.filBetaTesters;
const filBeta = () => fil(BETA, { tipus: 'grup', titol: 'Beta testers', comunitatId: XAT_SEED_IDS.filComunitat });
const boto = () => screen.queryByRole('button', { name: "Informa d'un error" });
const REMOT_SDP = Object.freeze({ estat: 'remot', href: '/xat?amb=00000000-0000-4000-8000-0000000000aa', avis: null, resol: null });
const muntaRemot = (xat = REMOT_SDP) => render(<XatSocDePobleContext.Provider value={xat}><XatSection /></XatSocDePobleContext.Provider>);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.navigate.mockReset();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.threads = [fil('a')];
  mocks.joId = 'jo';
  mocks.senseSessio = false;
  mocks.iaiaApagada = false;
  mocks.amagats = new Set();
  mocks.identitats = [];
  mocks.avis = null;
  buidaEsborranys();
});
/* jsdom no porta navigator.clipboard: cada prova que el necessita el posa. */
const posaPortaRetalls = (valor) => Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: valor });
afterEach(() => {
  cleanup();
  delete window.navigator.clipboard;
});

describe('«Informa d’un error» (prompt 261009_0230, punt 4)', () => {
  /* Revisió 261009 · Fora de la <ul>: el lector de pantalla no el compta com
     una conversa més. */
  test('és al peu de la llista, darrere de l’última fila, i no és cap conversa', () => {
    render(<XatSection />);
    const llista = screen.getByRole('list', { name: 'Converses' });
    expect(within(llista).queryByRole('button', { name: "Informa d'un error" })).toBeNull();
    /* Gauntlet 261016 (Bloc 3.6) · Sense amfitrió, la fila de «Gent de la
       Torre» (POBLE_PER_DEFECTE) va al capdamunt: dues files, cap peu dins.
       P1-70 (261029) · Els actors permanents són sempre a la llista: Javi
       Llinares, Gent de la Torre i la IAIA i, darrere, la conversa.
       QA-R2-05 · Sense l'id remot de l'entitat pilot, la reserva pública de
       Sóc de Poble (només porta a /socdepoble) va la primera. */
    const files = within(llista).getAllByRole('listitem');
    expect(files.map((li) => li.getAttribute('data-clau'))).toEqual(['entitat:socdepoble', 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia', 'a']);
    const peu = boto();
    expect(peu.parentElement.classList.contains('sdp-xat-llista__peu')).toBe(true);
    expect(llista.nextElementSibling).toBe(peu.parentElement);
    expect(llista.classList.contains('sdp-xat-llista--amb-peu')).toBe(true);
    expect(peu.className).toContain('sdp-xat-pindola--secundaria');
  });

  /* Revisió 261009 (problema mitjà) · La fallada més probable del primer dia
     és una llista que no carrega (SDP-XAT-003 per una alta sense pertinença):
     el canal de feedback no pot desaparéixer just llavors.
     Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · Les
     mostres d'este fitxer porten el text nou de SDP-XAT-003 («Mode
     Foraster»), el que hi posa l'adaptador (MISSATGES_SDP_HUMANS). */
  test('també davall de l’avís d’una llista que no s’ha pogut carregar, i de la llista buida', () => {
    mocks.avis = 'Estàs en Mode Foraster: el xat és per a la gent d’este poble.';
    mocks.threads = [];
    render(<XatSection />);
    const alerta = screen.getByRole('alert');
    expect(alerta.textContent).toContain('Estàs en Mode Foraster');
    expect(boto()).not.toBeNull();
    expect(alerta.nextElementSibling).toBe(boto().parentElement);
    cleanup();
    mocks.avis = null;
    render(<XatSection />);
    /* Gauntlet 261016 (Bloc 3.6) · «El Xat de Poble mai no pot aparèixer
       desert»: amb cap conversa, la fila de «Gent de la Torre» hi és igual i
       l'estat buit ja no es pinta. S'actualitza a posta (abans, «Encara no
       tens cap conversa»). El peu continua davall. */
    expect(screen.queryByText('Encara no tens cap conversa')).toBeNull();
    expect(screen.getByRole('list', { name: 'Converses' }).textContent).toContain('Gent de la Torre');
    expect(boto()).not.toBeNull();
  });

  test('si el xat no s’obri (SDP-XAT-003), l’informe no es perd: copiar-lo o enviar-lo per correu', async () => {
    const writeText = vi.fn(async () => {});
    posaPortaRetalls({ writeText });
    mocks.createThread.mockRejectedValue(Object.assign(new Error('Estàs en Mode Foraster: el xat és per a la gent d’este poble.'), { code: 'SDP-XAT-003' }));
    muntaRemot();
    expect(screen.queryByRole('button', { name: "Copia l'informe" })).toBeNull();
    fireEvent.click(boto());
    const copia = await screen.findByRole('button', { name: "Copia l'informe" });
    expect(screen.getByText(/No s'ha pogut obrir el xat\. Copia l'informe o envia'l per correu a socdepoble@socdepoble\.org\./).getAttribute('role')).toBe('status');
    const correu = screen.getByRole('link', { name: "Envia'l per correu" });
    const href = correu.getAttribute('href');
    expect(href.startsWith('mailto:socdepoble@socdepoble.org?subject=')).toBe(true);
    const cos = new URLSearchParams(href.slice(href.indexOf('?') + 1)).get('body');
    expect(cos.startsWith('Què ha passat: \r\nOn: \r\nQuè esperaves: ')).toBe(true);
    expect(cos).toContain('Ruta: /xat');
    fireEvent.click(copia);
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0].startsWith('Què ha passat: \nOn: ')).toBe(true);
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith('Text copiat', 'success'));
    expect(mocks.navigate).not.toHaveBeenCalled();
    /* Un intent nou (que ara sí que obri) se l'emporta. */
    mocks.createThread.mockReset();
    mocks.createThread.mockResolvedValue('f-sdp');
    fireEvent.click(boto());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/f-sdp'));
    expect(screen.queryByRole('button', { name: "Copia l'informe" })).toBeNull();
  });

  test('també quan l’entitat no és al servidor; sense porta-retalls, ho diu', async () => {
    posaPortaRetalls(undefined);
    muntaRemot({ estat: 'absent', href: null, avis: 'Xat de Sóc de Poble: encara no disponible en este servidor.', resol: null });
    fireEvent.click(boto());
    fireEvent.click(await screen.findByRole('button', { name: "Copia l'informe" }));
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith("No s'ha pogut copiar el text", 'error'));
    expect(screen.getByRole('link', { name: "Envia'l per correu" }).getAttribute('href')).toMatch(/^mailto:socdepoble@socdepoble\.org\?/);
  });

  test('en llavor obri «Beta testers» amb l’esborrany de l’informe, sense enviar res', async () => {
    mocks.threads = [fil('a'), filBeta()];
    render(<XatSection />);
    fireEvent.click(boto());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith(`/xat/${encodeURIComponent(BETA)}`));
    const esborrany = llegixEsborrany(`P::${BETA}`);
    expect(esborrany.startsWith('Què ha passat: \nOn: \nQuè esperaves: ')).toBe(true);
    expect(esborrany).toContain('Ruta: ');
    expect(esborrany).toContain('Navegador: ');
    expect(esborrany).toContain('Pantalla: ');
    expect(mocks.createThread).not.toHaveBeenCalled();
  });

  test('en remot obri el xat privat amb Sóc de Poble (el mateix camí que la seua fila), amb l’esborrany', async () => {
    mocks.createThread.mockResolvedValue('f-sdp');
    muntaRemot();
    fireEvent.click(boto());
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/f-sdp'));
    expect(mocks.createThread).toHaveBeenCalledWith('00000000-0000-4000-8000-0000000000aa', null);
    expect(llegixEsborrany('P::f-sdp')).toContain('Què esperaves: ');
  });

  test('en remot, mentre l’entitat no s’ha resolt, la resol una vegada; si no n’hi ha, ho diu', async () => {
    const resol = vi.fn(async () => ({ estat: 'absent', href: null, avis: 'Xat de Sóc de Poble: encara no disponible en este servidor.' }));
    muntaRemot({ estat: 'pendent', href: null, avis: 'cercant', resol });
    fireEvent.click(boto());
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith('Xat de Sóc de Poble: encara no disponible en este servidor.', 'info'));
    expect(resol).toHaveBeenCalledTimes(1);
    expect(mocks.createThread).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  test('una fallada en obrir-lo es diu per a la persona (SDP-XAT-003), mai el codi cru', async () => {
    mocks.createThread.mockRejectedValue(Object.assign(new Error('Estàs en Mode Foraster: el xat és per a la gent d’este poble. Prova d’eixir i tornar a entrar.'), { code: 'SDP-XAT-003' }));
    muntaRemot();
    fireEvent.click(boto());
    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining('Estàs en Mode Foraster'), 'error'));
    expect(mocks.showToast.mock.calls.flat().join(' ')).not.toMatch(/SDP-XAT/);
  });

  test('si eixa conversa ja és oberta, el compositor mostra l’esborrany nou', async () => {
    mocks.threads = [fil('a'), filBeta()];
    mocks.threadId = BETA;
    render(<XatSection />);
    const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
    expect(camp.value).toBe('');
    fireEvent.click(boto());
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Escriu un missatge' }).value.startsWith('Què ha passat: ')).toBe(true));
  });

  test('sense sessió, o per a qui gestiona Sóc de Poble en remot, no hi és', () => {
    mocks.joId = null;
    render(<XatSection />);
    expect(boto()).toBeNull();
    cleanup();
    mocks.joId = 'jo';
    mocks.identitats = [{ tipus: 'entitat', id: '00000000-0000-4000-8000-0000000000aa', slug: 'socdepoble', rol: 'owner' }];
    muntaRemot();
    expect(boto()).toBeNull();
    cleanup();
    /* En llavor sí: «Beta testers» és un grup on pot escriure. */
    mocks.threads = [fil('a'), filBeta()];
    render(<XatSection />);
    expect(boto()).not.toBeNull();
  });

  test('la plantilla de reserva és la valenciana', () => {
    expect(PLANTILLA_INFORME.split('\n')[0]).toBe('Què ha passat: ');
  });
});

describe('tasca 12 · amb el nivell d’IA a 0 la IAIA no apareix', () => {
  const AVIS = "La IAIA està apagada (nivell d'IA 0). La pots tornar a encendre a «Realitat».";

  test('dins de la fila per defecte de la IAIA: a la llista amb replace i un avís, sense 404', () => {
    mocks.iaiaApagada = true;
    mocks.threads = ambXatsPerDefecte([]).slice(0, 1).map((f) => mapejaFil(f));
    mocks.threadId = 'sdp-per-defecte:iaia';
    render(<XatSection />);
    expect(mocks.navigate).toHaveBeenCalledWith('/xat', { replace: true });
    expect(mocks.showToast).toHaveBeenCalledWith(AVIS, 'info');
    expect(screen.queryByTestId('no-trobada')).toBeNull();
  });

  test('dins d’un xat seu que el context amaga: el mateix, i cap obriFil ni reobertura', () => {
    mocks.iaiaApagada = true;
    mocks.amagats = new Set(['p-iaia']);
    mocks.threadId = 'p-iaia';
    mocks.params = new URLSearchParams('sobre=pagina%3A%2Fiaia');
    render(<XatSection />);
    expect(mocks.navigate).toHaveBeenCalledWith('/xat', { replace: true });
    expect(screen.queryByTestId('no-trobada')).toBeNull();
    expect(mocks.obriFilDePagina).not.toHaveBeenCalled();
    expect(mocks.openThread).not.toHaveBeenCalledWith('p-iaia');
  });

  test('«Comentar → En públic» de /iaia no obri el seu xat: a la llista amb l’avís', () => {
    mocks.iaiaApagada = true;
    mocks.params = new URLSearchParams('sobre=pagina%3A%2Fiaia&titol=x&ruta=%2Fiaia');
    render(<XatSection />);
    expect(mocks.obriFilDePagina).not.toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith(AVIS, 'info');
    expect(mocks.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  });

  test('encesa, la mateixa ruta continua com sempre (cap avís)', async () => {
    mocks.params = new URLSearchParams('sobre=pagina%3A%2Fiaia&titol=x&ruta=%2Fiaia');
    mocks.obriFilDePagina.mockResolvedValue('p-iaia');
    render(<XatSection />);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/p-iaia?sobre=pagina%3A%2Fiaia', { replace: true }));
    expect(mocks.obriFilDePagina).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).not.toHaveBeenCalledWith(AVIS, 'info');
  });
});
