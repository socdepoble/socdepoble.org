/**
 * Onada 3 · AV (integració final) · Les cares del Xat, traçades des de cada
 * font fins al DOM de la secció de veres (XatSection → XatWorkspace), amb la
 * base del paquet fixada com ho fa l'element <soc-de-poble> en un amfitrió
 * (PedraSecaEmbed.jsx, _aplicaBaseRecursos: fixaBaseRecursos i, d'un altre
 * origen, permetOrigenMitjans).
 *
 * El context NO es burla: es dona per XatContext.Provider. Així, sense sessió,
 * la llista és la del FakeChatOnboarding de veres. A gentdelatorre.net (llegit
 * en només lectura, revisió AV) l'element porta poble="la-torre-de-les-macanes"
 * i els Ajustos de WordPress, nomPoble «La Torre»: la fila del poble es diu
 * «La Torre» i, sense avatar_url (paquet 1.0.1), fa «LT». Amb sessió, el
 * servidor titula la comunitat «La Torre de les Maçanes», que també fa «LT».
 * Les dues formes hi són (PRODUCCIO, TITOL_DEL_SERVIDOR).
 *
 * Fonts: la mostra sense sessió (la IAIA, Sóc de Poble, la comunitat del
 * poble), i amb sessió les dades amb la forma del node (missatges.mapejaFil):
 * un recurs propi '/assets/…', una URL d'un origen permés, una data:image, un
 * grup amb imatge pròpia, la comunitat del poble sense imatge (la cara del
 * poble) i una foto PUJADA, que el node desa com a 'sdp-media://…' i només el
 * port pot resoldre (CaraXat → AvatarResolt).
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { XatContext } from './XatContext';
import { agrupaComunitats, mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { BENVINGUDA_IAIA } from '../../data/identitatsSeed.js';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { CARA_DE_LA_IAIA } from '../../data/xatsPerDefecte.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  threadId: null,
  params: new URLSearchParams(),
  externalConfig: {},
  towns: [],
  mitjans: true,
  resol: vi.fn()
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
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: {}, towns: mocks.towns }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (v) => v }),
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: mocks.externalConfig })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn() }) }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() })
}));
/* El port: la capacitat 'mitjans' i la seua resolució, com la del node
   (storage.js: getPublicUrl del bucket públic). La resta, el mòdul de veres. */
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => cap === 'mitjans' && mocks.mitjans,
  resolveAsset: (ref, opcions) => mocks.resol(ref, opcions)
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return 1280; }
});

const PAQUET = 'https://amfitrio.example/wp-content/plugins/socdepoble-enxufe/dist';
const NODE = 'https://node.example';
const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };
const CARA = '/assets/towns/la-torre-de-les-macanes/2.jpg';
const TORRE = { id: POBLE.id, title: 'La Torre de les Maçanes', image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg', avatar_url: CARA };
/* Onada 6 (tasca 12) · La IAIA arriba amb l'avatar del padró i el xat pinta la
   seua cara: la il·lustració «Festa del Poble», retallada per l'enquadrament
   'iaia' d'Avatar (CaraXat). */
const IAIA_PADRO = AGENTS_MAP.IAIA.avatar_url;
const IAIA = CARA_DE_LA_IAIA.src;
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
/* Onada 8 (261009) · El logo de la llavor (AJUDA, sense sessió) és el PNG.
   LOGO, l'SVG d'abans, continua sent la dada que porta una fila del servidor. */
const LOGO_PNG = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const COLLA = '/assets/uploads/avatars/mixa-comic.png';
const GOOGLE = 'https://lh3.googleusercontent.com/a/pepa=s96-c';
const DADA = 'data:image/png;base64,iVBORw0KGgo=';
const PUJADA = 'sdp-media://mitjans/11111111-2222-3333-4444-555555555555/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/avatars/foto.webp';
const PUJADA_RESOLTA = `${NODE}/storage/v1/object/public/${PUJADA.slice('sdp-media://'.length)}`;

/* El context del Xat amb els camps que llig XatWorkspace. */
function context(extra = {}) {
  return {
    scopeKey: 'A',
    ambitEstable: 'P',
    status: 'ready',
    avis: null,
    chatThreads: [],
    getThreadMessages: () => [],
    sendChatMessage: vi.fn(async () => []),
    obriFil: () => {},
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
    joNom: 'Javi',
    senseSessio: false,
    modeDades: 'remote',
    consumixEntrada: undefined,
    ...extra
  };
}

/* La configuració efectiva de gentdelatorre.net: l'atribut poble de l'element
   guanya al global (PedraSecaEmbed, composaCapes) i el nom ve dels Ajustos. */
const PRODUCCIO = { poble: POBLE.id, nomPoble: 'La Torre' };
/* Amb sessió, el títol de la comunitat el posa el servidor (towns.name). */
const TITOL_DEL_SERVIDOR = 'La Torre de les Maçanes';

/* Sense sessió en remot, com a gentdelatorre.net (XatContext: joId null). */
const senseSessio = () => context({ joId: null, joNom: null, senseSessio: true });

/* Amb sessió: les converses amb la forma del node (Conversa → mapejaFil). */
function ambSessio({ titolComunitat = POBLE.nom } = {}) {
  const ara = new Date().toISOString();
  const subjecte = { tipus: 'poble', id: '44444444-4444-4444-8444-444444444444', ruta: `/pobles/${POBLE.id}`, titol: titolComunitat };
  const fils = [
    { id: 'c-torre', tipus: 'comunitat', titol: titolComunitat, subjecte, imatgeUrl: null },
    { id: 'a-torre', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-torre', subjecte, rol: 'membre', ultimAl: ara },
    { id: 'g-torre', tipus: 'grup', titol: 'General', comunitatId: 'c-torre', subjecte, rol: 'membre', ultimAl: ara },
    { id: 'f-iaia', tipus: 'directe', titol: 'IAIA MarIA', imatgeUrl: IAIA_PADRO, ultimAl: ara },
    { id: 'f-sdp', tipus: 'directe', titol: 'Sóc de Poble', imatgeUrl: LOGO, ultimAl: ara },
    { id: 'g-colla', tipus: 'grup', titol: 'Colla de la Font', imatgeUrl: COLLA, ultimAl: ara },
    { id: 'f-pepa', tipus: 'directe', titol: 'Pepa', imatgeUrl: GOOGLE, ultimAl: ara },
    { id: 'f-dada', tipus: 'directe', titol: 'Dada', imatgeUrl: DADA, ultimAl: ara },
    { id: 'f-maria', tipus: 'directe', titol: 'Maria Pujada', imatgeUrl: PUJADA, ultimAl: ara }
  ].map((f) => mapejaFil(f));
  return context({ chatThreads: fils, comunitats: agrupaComunitats(fils) });
}

const munta = (valor) => render(<XatContext.Provider value={valor}><XatSection /></XatContext.Provider>);
const llista = () => screen.getByRole('list', { name: 'Converses' });
/* { nom: src | null } de cada avatar d'un element (null: les inicials). */
const caresDe = (element) => Object.fromEntries([...element.querySelectorAll('.sdp-avatar')]
  .map((avatar) => [avatar.getAttribute('title'), avatar.querySelector('img')?.getAttribute('src') ?? null]));
/* El rail de la closca (RailXat: <aside aria-label="Menú">), plegat o desplegat. */
const rail = () => document.querySelector('aside.sdp-workspace-column[aria-label="Menú"]');
/* Totes les imatges d'avatar del document: la llista, el rail, la fitxa i la vista. */
const totesLesImatges = () => [...document.querySelectorAll('img.sdp-avatar__imatge')].map((img) => img.getAttribute('src'));

/* Cap <img> d'avatar demana un recurs propi a l'arrel de l'amfitrió ni porta
   una referència que el navegador no sap carregar. */
function capImatgeTrencada() {
  const srcs = totesLesImatges();
  expect(srcs.length).toBeGreaterThan(0);
  expect(srcs.filter((src) => src.startsWith('/assets/'))).toEqual([]);
  expect(srcs.filter((src) => src.startsWith('sdp-media:'))).toEqual([]);
  expect(srcs.filter((src) => src.includes('/assets/') && !src.startsWith(`${PAQUET}/assets/`))).toEqual([]);
}

const ambLaBaseDelPaquet = () => {
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
};

beforeAll(() => {
  /* runtime.js:41 · l'origen del node és un origen de mitjans permés. */
  permetOrigenMitjans(NODE);
});
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.navigate.mockReset();
  mocks.threadId = null;
  mocks.params = new URLSearchParams();
  mocks.externalConfig = { poble: POBLE.id, nomPoble: POBLE.nom };
  mocks.towns = [TORRE];
  mocks.mitjans = true;
  mocks.resol.mockReset();
  mocks.resol.mockImplementation(async (ref) => `${NODE}/storage/v1/object/public/${ref.slice('sdp-media://'.length)}`);
  buidaEsborranys();
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

/* Gauntlet 261016 (Bloc 3.6) · Quatre files des d'ara: Javi Llinares, amb la
   seua foto del padró pilot (mai el logo de l'entitat), també a la mostra. */
const FOTO_JAVI = AGENTS_MAP.JAVI.avatar_url;

test('sense sessió a un amfitrió (el cas del Mestre): les quatre files porten la seua cara i pengen del paquet', () => {
  ambLaBaseDelPaquet();
  munta(senseSessio());
  expect(caresDe(llista())).toEqual({
    [POBLE.nom]: `${PAQUET}${CARA}`,
    'IAIA MarIA': `${PAQUET}${IAIA}`,
    'Sóc de Poble': `${PAQUET}${LOGO_PNG}`,
    'Javi Llinares': `${PAQUET}${FOTO_JAVI}`
  });
  capImatgeTrencada();
});

/* Gauntlet 261016_1530 (Bloc 3.6.1; revisió adversarial de B1) · El xat de
   mostra sense sessió pinta els mateixos 4 actors en el mateix ordre que el
   de veres: la comunitat de Sóc de Poble, Javi Llinares, la comunitat del
   poble i la IAIA. Ho fixa la llista PINTADA amb el FakeChatOnboarding de
   veres (no l'ordre dels fils del context, que no és el de la pantalla). I
   cap fila directa «Sóc de Poble»: només la de la comunitat. */
test('Bloc 3.6.1 · sense sessió, la mostra de veres pinta els quatre actors en l’ordre de l’ordre, sense cap directe «Sóc de Poble»', () => {
  munta(senseSessio());
  const files = [...llista().querySelectorAll(':scope > li[data-clau]')];
  const nomDe = (li) => li.querySelector('.sdp-avatar')?.getAttribute('title') ?? null;
  expect(files.length).toBeGreaterThanOrEqual(4);
  expect(files.slice(0, 4).map((li) => [li.getAttribute('data-clau'), nomDe(li)])).toEqual([
    ['comunitat:fake-sdp', 'Sóc de Poble'],
    ['fake-javi', 'Javi Llinares'],
    ['comunitat:fake-poble', POBLE.nom],
    ['fake-iaia', 'IAIA MarIA']
  ]);
  expect(files.filter((li) => nomDe(li) === 'Sóc de Poble').map((li) => li.getAttribute('data-clau'))).toEqual(['comunitat:fake-sdp']);
  expect(files.some((li) => li.getAttribute('data-clau') === 'fake-sdp')).toBe(false);
});

test('sense sessió i sense base (dev): les mateixes cares, amb la ruta de sempre', () => {
  munta(senseSessio());
  expect(caresDe(llista())).toEqual({ [POBLE.nom]: CARA, 'IAIA MarIA': IAIA, 'Sóc de Poble': LOGO_PNG, 'Javi Llinares': FOTO_JAVI });
  expect(totesLesImatges().every((src) => src.startsWith('/assets/'))).toBe(true);
});

/* Onada 6 (tasca 12) · Només la IAIA porta l'enquadrament de la cara. */
test('la cara de la IAIA porta l’enquadrament «iaia», a la llista amb sessió i sense; cap altra cara', () => {
  for (const valor of [senseSessio(), ambSessio()]) {
    munta(valor);
    const enquadrats = [...llista().querySelectorAll('.sdp-avatar--enquadrat')].map((a) => a.getAttribute('title'));
    expect(enquadrats).toEqual(['IAIA MarIA']);
    expect(llista().querySelector('.sdp-avatar[title="IAIA MarIA"]').classList.contains('sdp-avatar--enquadrat-iaia')).toBe(true);
    cleanup();
  }
});

test('amb sessió a un amfitrió: cada font porta la seua cara; els recursos propis, amb la base; la resta, intacta', async () => {
  ambLaBaseDelPaquet();
  munta(ambSessio());
  await waitFor(() => expect(caresDe(llista())['Maria Pujada']).toBe(PUJADA_RESOLTA));
  expect(caresDe(llista())).toEqual({
    [POBLE.nom]: `${PAQUET}${CARA}`,
    'IAIA MarIA': `${PAQUET}${IAIA}`,
    'Sóc de Poble': `${PAQUET}${LOGO}`,
    'Colla de la Font': `${PAQUET}${COLLA}`,
    Pepa: GOOGLE,
    Dada: DADA,
    'Maria Pujada': PUJADA_RESOLTA
  });
  expect(mocks.resol).toHaveBeenCalledWith(PUJADA, expect.anything());
  /* Revisió AV · El rail llig les comunitats de useXat(): també hi va la cara. */
  expect(caresDe(rail())[POBLE.nom]).toBe(`${PAQUET}${CARA}`);
  capImatgeTrencada();
});

/* Revisió AV · Les dades exactes de producció: «LT» era la fila «La Torre»
   (sense sessió) o la comunitat «La Torre de les Maçanes» (amb sessió). */
test('gentdelatorre.net sense sessió (nomPoble «La Torre»): la fila del poble porta la cara, a la llista i al rail', () => {
  ambLaBaseDelPaquet();
  mocks.externalConfig = PRODUCCIO;
  munta(senseSessio());
  expect(caresDe(llista())['La Torre']).toBe(`${PAQUET}${CARA}`);
  expect(caresDe(rail())['La Torre']).toBe(`${PAQUET}${CARA}`);
  expect(llista().textContent).not.toContain('LT');
  capImatgeTrencada();
});

test('gentdelatorre.net amb sessió (títol del servidor): la comunitat porta la cara a la llista i al rail; sense fitxa del poble, «LT»', () => {
  ambLaBaseDelPaquet();
  mocks.externalConfig = PRODUCCIO;
  munta(ambSessio({ titolComunitat: TITOL_DEL_SERVIDOR }));
  expect(caresDe(llista())[TITOL_DEL_SERVIDOR]).toBe(`${PAQUET}${CARA}`);
  expect(caresDe(rail())[TITOL_DEL_SERVIDOR]).toBe(`${PAQUET}${CARA}`);
  cleanup();

  /* Si app_content 'towns' del node no porta la fitxa del poble amb imatge,
     les inicials són la resposta correcta: cap cara inventada. */
  mocks.towns = [];
  munta(ambSessio({ titolComunitat: TITOL_DEL_SERVIDOR }));
  expect(caresDe(llista())[TITOL_DEL_SERVIDOR]).toBeNull();
  expect(caresDe(rail())[TITOL_DEL_SERVIDOR]).toBeNull();
  expect(rail().querySelector(`.sdp-avatar[title="${TITOL_DEL_SERVIDOR}"]`).textContent).toBe('LT');
});

test('amb sessió i sense base (dev): els recursos propis, com ara', async () => {
  munta(ambSessio());
  await waitFor(() => expect(caresDe(llista())['Maria Pujada']).toBe(PUJADA_RESOLTA));
  const cares = caresDe(llista());
  expect([cares[POBLE.nom], cares['IAIA MarIA'], cares['Sóc de Poble'], cares['Colla de la Font']]).toEqual([CARA, IAIA, LOGO, COLLA]);
});

test('la fitxa de la comunitat i la vista Comunitats porten la cara del poble amb la base', () => {
  ambLaBaseDelPaquet();
  mocks.params = new URLSearchParams('comunitat=c-torre');
  munta(ambSessio());
  const fitxa = screen.getByRole('region', { name: POBLE.nom });
  expect(fitxa.querySelector('.sdp-xat-fitxa-comunitat__cap img')?.getAttribute('src')).toBe(`${PAQUET}${CARA}`);
  cleanup();

  mocks.params = new URLSearchParams('vista=comunitats');
  munta(ambSessio());
  const bloc = document.querySelector('.sdp-xat-vista-comunitats__bloc[data-comunitat="c-torre"]');
  expect(bloc?.querySelector('.sdp-xat-vista-comunitats__avatar img')?.getAttribute('src')).toBe(`${PAQUET}${CARA}`);
});

/* Pla 261014_1450 (front A) · El peu del rail porta la foto de la persona
   (joAvatar, la mateixa font que la TopBar en mode persona). Una foto pujada
   ('sdp-media://…') la resol el port, com les files de la llista: abans el peu
   pintava sempre les inicials. */
const PUJADA_JO = 'sdp-media://mitjans/11111111-2222-3333-4444-555555555555/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/avatars/jo.webp';
const PUJADA_JO_RESOLTA = `${NODE}/storage/v1/object/public/${PUJADA_JO.slice('sdp-media://'.length)}`;
const SDP_ACTIVA = { id: 'socdepoble', nom: 'Sóc de Poble', avatar: LOGO_PNG };

test('front A · la foto pujada de la persona es resol pel port i va al peu del rail', async () => {
  ambLaBaseDelPaquet();
  munta({ ...ambSessio(), joAvatar: PUJADA_JO });
  await waitFor(() => expect(caresDe(rail()).Javi).toBe(PUJADA_JO_RESOLTA));
  expect(mocks.resol).toHaveBeenCalledWith(PUJADA_JO, expect.anything());
  expect(screen.getByRole('button', { name: 'Tu: ajustos' }).querySelector('img.sdp-avatar__imatge').getAttribute('src')).toBe(PUJADA_JO_RESOLTA);
  capImatgeTrencada();
});

test('front A · la foto pujada de la persona en un node sense «mitjans»: inicials al peu, i el port no es crida', async () => {
  mocks.mitjans = false;
  ambLaBaseDelPaquet();
  munta({ ...context(), joAvatar: PUJADA_JO });
  expect(caresDe(rail()).Javi).toBeNull();
  expect(rail().querySelector('.sdp-avatar[title="Javi"]').textContent).toBe('J');
  expect(mocks.resol).not.toHaveBeenCalled();
});

/* Pla 261014_1450 (front C) · Amb una entitat activa a la barra negra, el peu
   del rail porta el SEU logo (amb la base del paquet), mai la foto de la
   persona, i el nom accessible ho diu. La conversa oberta diu qui signa: en
   un xat personal, la persona. */
test('front C · amb entitatActiva, el peu porta el logo de l’entitat i la conversa diu que hi signes com a tu', async () => {
  ambLaBaseDelPaquet();
  mocks.threadId = 'f-pepa';
  munta({ ...ambSessio(), joAvatar: PUJADA_JO, entitatActiva: SDP_ACTIVA });
  const boto = screen.getByRole('button', { name: 'Tu: ajustos (actues com a Sóc de Poble)' });
  const avatar = boto.querySelector('.sdp-avatar');
  expect(avatar.getAttribute('title')).toBe('Sóc de Poble');
  expect(avatar.classList.contains('sdp-xat-avatar--quadrat')).toBe(true);
  expect(avatar.querySelector('img').getAttribute('src')).toBe(`${PAQUET}${LOGO_PNG}`);
  expect(caresDe(rail()).Javi).toBeUndefined();
  expect(screen.getByText('Escrius com a tu: en esta conversa no parles en nom de Sóc de Poble.')).toBeTruthy();
});

test('una foto pujada (sdp-media) en un node sense la capacitat «mitjans»: inicials, mai una imatge trencada', async () => {
  mocks.mitjans = false;
  ambLaBaseDelPaquet();
  munta(ambSessio());
  await waitFor(() => expect(caresDe(llista())['IAIA MarIA']).toBe(`${PAQUET}${IAIA}`));
  expect(caresDe(llista())['Maria Pujada']).toBeNull();
  expect(llista().querySelector('[title="Maria Pujada"]').textContent).toContain('MP');
  expect(mocks.resol).not.toHaveBeenCalled();
  capImatgeTrencada();
});


test.each([null, 'fake-javi', 'fake-iaia'])('sense sessió els botons d’accés són visibles també al peu del fil %s', (filId) => {
  mocks.threadId = filId;
  munta(senseSessio());
  const tornar = filId ? `/xat/${filId}` : '/xat';
  fireEvent.click(screen.getByRole('button', { name: 'Connectar-se' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(rutaDEntrada({ tornar }));
  fireEvent.click(screen.getByRole('button', { name: 'Registrar-se' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(rutaDEntrada({ mode: 'crear', tornar }));
  /* Gauntlet 261022_0225 (XAT-4) · Una sola parella a la pantalla: cap
     «Registra't» del compositor ni cap enllaç cru a /registre. */
  expect(screen.getAllByRole('button', { name: /^(Connectar-se|Registrar-se)$/ })).toHaveLength(2);
  expect(screen.queryByRole('link', { name: "Registra't" })).toBeNull();
  expect(document.querySelector('a[href^="/registre"]')).toBeNull();
  /* XAT-1 · Al DOM: a la llista, l'accés és l'últim fill del cos amb scroll,
     darrere de la llista; a la conversa, el seu peu. La cascada que el deixa
     baixar al fons i compactar-se en una pantalla baixa, jsdom no la resol:
     la comprova XatSection.acces.capes.test.js. */
  const acces = document.querySelector('.sdp-xat-acces');
  if (filId) expect(acces.parentElement.classList.contains('sdp-xat-conversa')).toBe(true);
  else {
    expect(peuDAccesAlCos()).toBe(acces.parentElement);
    expect(acces.parentElement.previousElementSibling).toBe(llista());
  }
});

/* Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1; P1-38) · Damunt
   de la parella, «Descarrega l'App»: la píndola de sèrie, entre la frase i la
   parella, una sola a la pantalla (també al peu d'un fil), porta a
   /descarregues, l'adreça curta de la pàgina (App.jsx). */
test.each([null, 'fake-iaia'])('sense sessió, «Descarrega l’App» va damunt de la parella i porta a /descarregues (fil %s)', (filId) => {
  mocks.threadId = filId;
  munta(senseSessio());
  expect(screen.getAllByRole('button', { name: "Descarrega l'App" })).toHaveLength(1);
  const boto = screen.getByRole('button', { name: "Descarrega l'App" });
  expect([...boto.classList]).toEqual(['sdp-xat-pindola', 'sdp-xat-acces__descarrega']);
  expect(boto.getAttribute('type')).toBe('button');
  const acces = document.querySelector('.sdp-xat-acces');
  expect(boto.parentElement).toBe(acces);
  expect(boto.previousElementSibling.tagName).toBe('P');
  expect(boto.nextElementSibling.classList.contains('sdp-alerta__accions')).toBe(true);
  expect([...acces.querySelectorAll('button')].map((b) => b.textContent)).toEqual(["Descarrega l'App", 'Connectar-se', 'Registrar-se']);
  fireEvent.click(boto);
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/descarregues');
});

/* Dins de l'app nativa (el pont de Capacitor que el WebView injecta, el que
   llig esAppNativa), oferir-ne la descàrrega no té sentit: només la parella. */
test('dins de l’app nativa, l’accés no oferix «Descarrega l’App»: només la parella', () => {
  window.Capacitor = { isNativePlatform: () => true };
  try {
    munta(senseSessio());
    expect(screen.queryByRole('button', { name: "Descarrega l'App" })).toBeNull();
    expect(document.querySelector('.sdp-xat-acces__descarrega')).toBeNull();
    const acces = document.querySelector('.sdp-xat-acces');
    expect([...acces.querySelectorAll('button')].map((b) => b.textContent)).toEqual(['Connectar-se', 'Registrar-se']);
  } finally {
    delete window.Capacitor;
  }
});

/* El peu de l'accés (l'únic de la pantalla) si és l'últim fill del cos amb
   scroll de la columna central; si no, falla. */
function peuDAccesAlCos() {
  const totes = document.querySelectorAll('.sdp-xat-acces');
  expect(totes).toHaveLength(1);
  const peu = totes[0].parentElement;
  expect([...peu.classList]).toEqual(['sdp-xat-llista__peu', 'sdp-xat-llista__peu--acces']);
  expect([...peu.parentElement.classList]).toEqual(['sdp-workspace-column__body', 'sdp-xat-cos--amb-peu']);
  expect(peu.parentElement.lastElementChild).toBe(peu);
  return peu;
}

/* Gauntlet 261022_0225 (XATR-1) · Sense sessió, la parella d'accés no és
   només de la llista: com quan vivia davall del cos, també la porten la fitxa
   d'una comunitat i «Comunitats», dins del seu cos amb scroll. */
test.each([
  ['la fitxa d’una comunitat', 'comunitat=fake-poble', '.sdp-xat-fitxa-comunitat'],
  ['la vista Comunitats', 'vista=comunitats', '.sdp-xat-vista-comunitats']
])('sense sessió, %s porta l’accés al peu del seu cos', (_, consulta, contingut) => {
  mocks.params = new URLSearchParams(consulta);
  munta(senseSessio());
  const peu = peuDAccesAlCos();
  expect(peu.previousElementSibling.matches(contingut)).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Connectar-se' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(rutaDEntrada({ tornar: `/xat?${consulta}` }));
});

/* XATR-1 · La cerca: la llista de filtres en obrir el camp i els resultats
   amb un terme. El peu és el mateix node que davall de la llista (obrir o
   tancar la cerca no el torna a muntar davall del dit). */
test('sense sessió, la cerca conserva l’accés al peu del cos, sense tornar-lo a muntar', () => {
  munta(senseSessio());
  const peu = peuDAccesAlCos();
  const camp = document.querySelector('input[name="xatSearch"]');
  fireEvent.focus(camp);
  expect(document.querySelector('.sdp-xat-filtres-cerca')).toBeTruthy();
  expect(peuDAccesAlCos()).toBe(peu);
  fireEvent.change(camp, { target: { value: 'Torre' } });
  expect(screen.getByRole('region', { name: 'Resultats de la cerca' })).toBeTruthy();
  expect(peuDAccesAlCos()).toBe(peu);
});

/* XATR-1 · Multimèdia pinta el seu cos (VistaMultimedia, fora d'esta
   secció): l'accés hi va darrere, a la columna, com abans. */
test('sense sessió, la vista Multimèdia porta l’accés darrere del seu cos', () => {
  mocks.params = new URLSearchParams('vista=multimedia');
  munta(senseSessio());
  const totes = document.querySelectorAll('.sdp-xat-acces');
  expect(totes).toHaveLength(1);
  const peu = totes[0].parentElement;
  expect([...peu.classList]).toEqual(['sdp-xat-llista__peu', 'sdp-xat-llista__peu--acces']);
  expect(peu.previousElementSibling.classList.contains('sdp-workspace-column__body')).toBe(true);
});

/* Gauntlet 261022_0225 (XAT-6) · Sense sessió, un filtre sense cap conversa
   diu el seu text, i la crida a entrar només ix una vegada: la del peu. */
test('sense sessió, el filtre buit no repetix la crida a entrar', () => {
  munta(senseSessio());
  fireEvent.click(screen.getByRole('button', { name: 'Filtra les converses' }));
  fireEvent.click(screen.getByRole('menuitemradio', { name: /Preferits/ }));
  const cos = document.querySelector('input[name="xatSearch"]').closest('aside').querySelector(':scope > .sdp-workspace-column__body');
  expect(cos.querySelector('.sdp-workspace-state').textContent).toBe('Cap conversa amb este filtre.');
  // Ordre del Mestre (261026, prompt 261026_1615, tasca 4) · La benvinguda substituïx la crida a entrar.
  expect([...cos.querySelectorAll('p')].filter((p) => p.textContent === 'Benvinguda a Sóc de Poble')).toHaveLength(1);
  // Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) · «Descarrega l'App», damunt de la parella.
  expect([...cos.querySelectorAll('button')].map((b) => b.textContent)).toEqual(["Descarrega l'App", 'Connectar-se', 'Registrar-se']);
});

test('el fil remot de la IAIA porta la benvinguda oficial, sense afegir missatges al servidor', () => {
  const fil = mapejaFil({ id: 'iaia-remota', tipus: 'grup', titol: 'IAIA MarIA', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia' } });
  mocks.threadId = fil.id;
  const xat = context({ chatThreads: [fil] });
  munta(xat);
  expect(screen.getByText(BENVINGUDA_IAIA)).toBeTruthy();
  expect(screen.getByText(/Benvinguda automàtica/)).toBeTruthy();
  expect(xat.sendChatMessage).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'Registrar-se' })).toBeNull();
});
