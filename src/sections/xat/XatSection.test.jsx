import { StrictMode, useState } from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection, { objecteDeSobre, rutaAmbConsulta } from './XatSection';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import XatControlSection from './XatControlSection';
import { construeixRetall } from './retall';
import { agrupaComunitats, mapejaFil } from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { getVal, setVal, delVal } from '../../config/storage.js';
import { PAGINA_DESTACADA_DEL_XAT } from './paginaDestacada.js';
import { paginaDeRuta } from '../text/paginaDeText.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { ambXatsPerDefecte } from '../../data/xatsPerDefecte.js';
import { RUTA_XAT_DE_LA_IAIA } from './useObriXatPerDefecte.js';
import { RUTA_SOBRE_DE_SOC_DE_POBLE } from './actorsDelXat.js';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../config/navigation.js';

const mocks = vi.hoisted(() => ({
  creaNota: vi.fn(),
  navigate: vi.fn(),
  threadId: 'a',
  scope: 'A',
  /* Decisió 1 del Mestre (261007) · La clau de XatWorkspace. Buida per
     defecte: sense esborranys, com fins ara en este fitxer. */
  ambit: '',
  params: new URLSearchParams(),
  members: vi.fn(),
  createThread: vi.fn(),
  openThread: vi.fn(),
  send: vi.fn(),
  reintenta: vi.fn(),
  descarta: vi.fn(),
  carregaMes: vi.fn(),
  hiHaMes: vi.fn(),
  marcaVist: vi.fn(),
  marcaLlegides: vi.fn(),
  obriFilDePagina: vi.fn(),
  seo: vi.fn(),
  showToast: vi.fn(),
  threads: [],
  messages: [],
  comunitats: [],
  contactesFrequents: [],
  joId: 'jo',
  joNom: 'Javi',
  senseSessio: false,
  totalNoLlegits: 0,
  amplada: 1280
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: mocks.threadId ? `/xat/${mocks.threadId}` : '/xat' }),
    useSearchParams: () => [mocks.params],
    useParams: () => ({ threadId: mocks.threadId }),
    useRouter: () => ({ navigate: mocks.navigate, currentPath: '/xat' }),
    /* Els enllaços al perfil (T4) es pinten com a <a href>: prou per a llegir-ne la ruta. */
    Link: ({ to, children, className, ...rest }) => createElement('a', { href: to, className, ...rest }, children)
  };
});
vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
/* El document per defecte de la columna dreta: una marca que les proves
   poden buscar sense muntar tota la UniversalPage. Registra el seu SEO com
   el TextSection de veres, que és el que competix pel títol de la pestanya. */
vi.mock('../text/TextSection', async () => {
  const { createElement, Fragment } = await import('react');
  const { useSEO } = await import('../../hooks/useSEO');
  /* Ordre del Mestre (261007) · El Connectar propi del document (proposta
     P4), com un botó germà: el text de la marca continua sent la clau. */
  function DocumentPerDefecte({ page, pageKey, onConnect, accioPrincipal, objecte }) {
    useSEO({ title: page.title, description: page.subtitle || page.lead || 'Sóc de Poble' });
    /* Revisió del 261007 (M3-10) · el descriptor que rep, per a Comentar. */
    return createElement(Fragment, null,
      createElement('div', {
        'data-testid': 'document-per-defecte', 'data-accio': accioPrincipal ? 'si' : 'no', 'data-objecte': objecte ? JSON.stringify(objecte) : ''
      }, pageKey),
      onConnect ? createElement('button', { type: 'button', 'data-testid': 'connectar-del-document', onClick: onConnect }, 'Connectar') : null);
  }
  return { default: DocumentPerDefecte };
});
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ pageCopy: {} }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, fallback) => fallback, resolveAsset: (v) => v }),
  /* La capçalera del document és opt-in (manageDocumentHead === true): sense
     ell el títol de la pestanya no s'escriu i les proves de títol no provarien res. */
  useUIState: () => ({ language: 'ca', locale: 'ca-ES', externalConfig: { manageDocumentHead: true } })
}));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: mocks.creaNota }) }));
/* Anota cada crida i passa pel seoHead real: `document.title` diu qui guanya. */
vi.mock('../../hooks/useSEO', async (importOriginal) => {
  const real = await importOriginal();
  return { useSEO: (opcions) => { mocks.seo(opcions); return real.useSEO(opcions); } };
});
/* Correcció de la revisió (260930) · El mòdul original, amb només useXat
   substituït: FakeChatOnboarding (el Xat sense sessió) pinta el seu
   proveïdor amb l'objecte XatContext de veres, i sense ell la prova T63.2 de
   remot sense sessió petava abans d'arribar a les asercions. */
vi.mock('./XatContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useXat: () => ({
    scopeKey: mocks.scope,
    ambitEstable: mocks.ambit,
    status: 'ready',
    avis: null,
    chatThreads: mocks.threads,
    getThreadMessages: () => mocks.messages,
    sendChatMessage: mocks.send,
    obriFil: mocks.openThread,
    creaFil: mocks.createThread,
    cercaMembres: mocks.members,
    totalNoLlegits: mocks.totalNoLlegits,
    hiHaMesAntics: mocks.hiHaMes,
    carregantAntics: () => false,
    carregaMesAntics: mocks.carregaMes,
    reintenta: mocks.reintenta,
    descartaFallit: mocks.descarta,
    marcaVist: mocks.marcaVist,
    /* Onada 2 (contracte): comunitats, contactes, marcaLlegides i el xat de pàgina. */
    comunitats: mocks.comunitats,
    contactesFrequents: mocks.contactesFrequents,
    marcaLlegides: mocks.marcaLlegides,
    obriFilDePagina: mocks.obriFilDePagina,
    joId: mocks.joId,
    joNom: mocks.joNom,
    senseSessio: mocks.senseSessio
  })
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.showToast })
}));

/* AppGridShell mesura el contenidor: jsdom dona 0 (estret). Ací decidim
   l'amplària per prova: 1280 és escriptori, 375 és mòbil. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return mocks.amplada; }
});

const ARA = Date.now();
const fa = (dies) => new Date(ARA - dies * 86400000).toISOString();

function filsDeMostra() {
  return [
    { id: 'a', title: 'Conversa', name: 'Conversa', tipus: 'directe', ultimText: 'Hola', ultimAl: fa(0), noLlegits: 3, altresNoms: ['Veí'] },
    { id: 'b', title: 'Altra', name: 'Altra', tipus: 'grup', ultimText: 'Adeu', ultimAl: fa(1), noLlegits: 0, preferit: true, altresNoms: ['Pep', 'Maria'] }
  ];
}

function missatgesDeMostra() {
  return [
    { id: '1', seq: 1, text: 'Primer', sender: 'me', creatAl: fa(2), estatEnviament: 'llegit' },
    { id: '2', seq: 2, text: 'Segon', sender: 'other', author: 'Veí', usuariId: 'x', creatAl: fa(0), estatEnviament: 'enviat' }
  ];
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  /* clearAllMocks no lleva les implementacions: les proves de l'encaminador
     (onada 3B) en posen una a navigate. */
  mocks.navigate.mockReset();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  mocks.threadId = 'a';
  mocks.scope = 'A';
  mocks.ambit = '';
  mocks.params = new URLSearchParams();
  mocks.amplada = 1280;
  mocks.threads = filsDeMostra();
  mocks.messages = missatgesDeMostra();
  mocks.comunitats = [];
  mocks.contactesFrequents = [];
  mocks.joId = 'jo';
  mocks.joNom = 'Javi';
  mocks.senseSessio = false;
  mocks.totalNoLlegits = 0;
  mocks.members.mockResolvedValue([]);
  mocks.createThread.mockResolvedValue('thread-new');
  mocks.send.mockResolvedValue([]);
  mocks.hiHaMes.mockReturnValue(false);
  mocks.marcaLlegides.mockReturnValue(0);
  mocks.obriFilDePagina.mockResolvedValue(null);
  /* Torn 260930 (T1) · Els esborranys viuen en un Map del mòdul i la clau
     (àmbit::fil) es repetix entre proves: cada prova comença sense cap. */
  buidaEsborranys();
});

/* La comunitat de la llavor, passada per mapejaFil com ho fa el context:
   «Sóc de Poble» amb «Avisos» (canal) i «General» (grup). Com a la llavor
   (localXat.conversaDe), el canal hereta la imatge del primer participant. */
function ambComunitat() {
  const subjecte = { tipus: 'entitat', id: 'socdepoble', ruta: '/empresa/socdepoble', titol: 'Sóc de Poble' };
  const comunitat = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Sóc de Poble', comunitatId: null, subjecte },
    { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', subjecte, rol: 'membre', ultimText: 'Benvinguts', ultimAl: fa(0.5), noLlegits: 1, participants: 3,
      imatgeUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' },
    { id: 'g-1', tipus: 'grup', titol: 'General', comunitatId: 'c-1', subjecte, rol: 'membre', ultimText: 'Hola a tots', ultimAl: fa(0.2), noLlegits: 2, participants: 3,
      ultimAutorId: 'pep', altres: [{ id: 'pep', nom: 'Pep', tipus: 'persona' }] }
  ].map((f) => mapejaFil(f));
  mocks.threads = [...filsDeMostra(), ...comunitat];
  mocks.comunitats = agrupaComunitats(mocks.threads);
}


test('selecció en ordre i navegació després de confirmar', async () => {
  let resolve;
  mocks.creaNota.mockReturnValue(new Promise((r) => { resolve = r; }));
  render(<XatSection />);

  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar missatges' }));

  const send = screen.getByRole('button', { name: /Enviar al Bloc de Notes/ });
  expect(send.disabled).toBe(true);

  const caselles = screen.getAllByRole('checkbox');
  expect(caselles).toHaveLength(2);
  fireEvent.click(caselles[1]);
  fireEvent.click(caselles[0]);
  expect(caselles[0].getAttribute('aria-checked')).toBe('true');

  fireEvent.click(send);

  expect(mocks.creaNota).toHaveBeenCalledTimes(1);
  const retall = mocks.creaNota.mock.calls[0][0];
  expect(retall.content).toContain('Primer');
  expect(retall.content).toContain('Segon');
  expect(retall.content.indexOf('Primer')).toBeLessThan(retall.content.indexOf('Segon'));
  expect(mocks.navigate).not.toHaveBeenCalled();

  resolve({ id: 'new-note' });
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=new-note'));
});

/* Higiene d'amfitrió (ordre del Mestre, 261004) · Guardar el retall navega a
   la nota i prou: cap CustomEvent a window amb la nota al detail (ningú no
   l'escoltava, i dins de WordPress el rebia la pàgina de l'amfitrió). */
test('guardar el retall no llança cap esdeveniment amb la nota a window', async () => {
  const nota = { id: 'new-note', content: 'Contingut del retall' };
  mocks.creaNota.mockResolvedValue(nota);
  const aWindow = vi.spyOn(window, 'dispatchEvent');
  try {
    render(<XatSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar missatges' }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: /Enviar al Bloc de Notes/ }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/notes?nota=new-note'));
    const ambLaNota = aWindow.mock.calls.map(([ev]) => ev)
      .filter((ev) => ev?.type === 'sdp:note-created' || ev?.detail?.note === nota);
    expect(ambLaNota).toEqual([]);
  } finally {
    aWindow.mockRestore();
  }
});

test('retall.js saneja i escapa correctament', () => {
  const fil = { title: '<img>' };
  const missatges = [{ author: '<b>', text: '<script>alert(1)</script>\n&' }];
  const retall = construeixRetall({ fil, missatges, locale: 'ca-ES' });

  expect(retall.title).toBe('Retall de «&lt;img&gt;»');
  expect(retall.content).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>&amp;');
  expect(retall.content).not.toContain('<script>');
});

test('context de Connectar acompanya la tria de destinatari i no envia missatges', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ context: 'Una peça' });
  mocks.members.mockResolvedValue([{ usuari_id: 'B', nom: 'Veí' }]);
  render(<XatSection />);
  fireEvent.change(within(screen.getByRole('dialog')).getByRole('searchbox'), { target: { value: 'vei' } });
  fireEvent.click(await screen.findByRole('button', { name: /Veí/ }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/thread-new?context=Una%20pe%C3%A7a'));
  expect(mocks.send).not.toHaveBeenCalled();
});

/* Decisió 1 del Mestre (261007) · L'àmbit de XatWorkspace és `ambitEstable`
   (backend + persona + actor), ja no `scopeKey`: la prova canviava només
   scopeKey i ara canvia l'àmbit, que és el que torna a muntar l'espai. */
test('canviar àmbit (ambitEstable) purga el padró i ignora una obertura tardana de conversa', async () => {
  mocks.threadId = null;
  mocks.ambit = 'P';
  mocks.members.mockResolvedValue([{ usuari_id: 'B', nom: 'Privat d A' }]);
  let resolve;
  mocks.createThread.mockImplementation(() => new Promise((done) => { resolve = done; }));
  const view = render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
  fireEvent.change(within(screen.getByRole('dialog')).getByRole('searchbox'), { target: { value: 'Privat' } });
  fireEvent.click(await screen.findByRole('button', { name: /Privat d A/ }));
  mocks.scope = 'B';
  mocks.ambit = 'Q';
  view.rerender(<XatSection />);
  expect(screen.queryByText('Privat d A')).toBeNull();
  await act(async () => resolve('old-thread'));
  expect(mocks.navigate).not.toHaveBeenCalled();
});

/* Decisió 1 del Mestre (261007) · «L'estat local ha de mantenir la
   continuïtat de la conversa malgrat la renovació del token (JWT).» Una
   renovació canvia `scopeKey` i no `ambitEstable`: la clau de XatWorkspace no
   canvia, res no es torna a muntar, i l'obertura que estava en curs arriba. */
test('Decisió 1 · una renovació del JWT (scopeKey nou, mateix ambitEstable) no torna a muntar l’espai: el padró es queda i l’obertura en curs arriba', async () => {
  mocks.threadId = null;
  mocks.ambit = 'P';
  mocks.members.mockResolvedValue([{ usuari_id: 'B', nom: 'Veïna del poble' }]);
  let resolve;
  mocks.createThread.mockImplementation(() => new Promise((done) => { resolve = done; }));
  const view = render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
  fireEvent.change(within(screen.getByRole('dialog')).getByRole('searchbox'), { target: { value: 'Veïna' } });
  fireEvent.click(await screen.findByRole('button', { name: /Veïna del poble/ }));
  mocks.scope = 'A-renovat';
  view.rerender(<XatSection />);
  expect(screen.getByText('Veïna del poble')).toBeTruthy();
  expect(within(screen.getByRole('dialog')).getByRole('searchbox').value).toBe('Veïna');
  await act(async () => resolve('fil-nou'));
  expect(mocks.navigate).toHaveBeenCalledWith('/xat/fil-nou');
});

/* T12 (ordre del Mestre, 260927): els quatre filtres ja no són una fila de
   píndoles sinó un desplegable darrere de la icona de filtre, a la línia de
   la cerca; filtren igual que abans i la icona diu quin filtre hi ha. */
test('T12 · els filtres Tot · No llegits · Preferits · Grups viuen en un desplegable i filtren de veres', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.getByText('Adeu')).toBeTruthy();
  expect(document.querySelector('.sdp-xat-filtres')).toBeNull();
  expect(screen.queryByRole('menu')).toBeNull();
  const tria = (nom) => {
    fireEvent.click(screen.getByRole('button', { name: /^Filtra les converses/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: nom }));
  };

  tria('No llegits');
  expect(screen.queryByRole('menu')).toBeNull();
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.queryByText('Adeu')).toBeNull();
  expect(screen.getByRole('button', { name: 'Filtra les converses (No llegits)' }).classList.contains('sdp-xat-filtre__boto--actiu')).toBe(true);

  tria('Grups');
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByText('Adeu')).toBeTruthy();

  tria('Preferits');
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByText('Adeu')).toBeTruthy();

  tria('Tot');
  expect(screen.getByText('Hola')).toBeTruthy();
  expect(screen.getByText('Adeu')).toBeTruthy();
  const boto = screen.getByRole('button', { name: 'Filtra les converses' });
  expect(boto.classList.contains('sdp-xat-filtre__boto--actiu')).toBe(false);
  fireEvent.click(boto);
  expect(screen.getByRole('menuitemradio', { name: 'Tot' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getAllByRole('menuitemradio').map((o) => o.textContent)).toEqual(['Tot', 'No llegits', 'Preferits', 'Grups']);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
});

test('el comptador de no llegits es pinta amb número i text accessible', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(screen.getByText('3')).toBeTruthy();
  expect(screen.getByText('3 missatges no llegits')).toBeTruthy();
  fireEvent.click(screen.getByText('Hola').closest('button'));
  expect(mocks.navigate).toHaveBeenCalledWith('/xat/a');
});

test('el compositor envia amb Retorn i fa salt de línia amb Maj+Retorn a l\'escriptori', async () => {
  render(<XatSection />);
  const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
  expect(camp.tagName).toBe('TEXTAREA');
  const envia = screen.getByRole('button', { name: 'Envia' });
  expect(envia.disabled).toBe(true);

  fireEvent.change(camp, { target: { value: 'Bon dia' } });
  expect(envia.disabled).toBe(false);
  fireEvent.keyDown(camp, { key: 'Enter', shiftKey: true });
  expect(mocks.send).not.toHaveBeenCalled();

  fireEvent.keyDown(camp, { key: 'Enter' });
  await waitFor(() => expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'Bon dia'));
  expect(camp.value).toBe('');
});

test('una bombolla en error es queda amb «Torna-ho a provar» i «Descarta»', () => {
  mocks.messages = [
    ...missatgesDeMostra(),
    { id: '3', seq: null, text: 'Fallit', sender: 'me', creatAl: fa(0), estatEnviament: 'error' }
  ];
  render(<XatSection />);
  expect(screen.getByText("No s'ha enviat")).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
  expect(mocks.reintenta).toHaveBeenCalledWith('3');
  fireEvent.click(screen.getByRole('button', { name: 'Descarta' }));
  expect(mocks.descarta).toHaveBeenCalledWith('3');
});

test('els enllaços són segurs i avisen dels dominis enganyosos', () => {
  mocks.messages = [
    { id: '9', seq: 9, text: 'Mira http://xn--pple-43d.com/entra ara', sender: 'other', author: 'Veí', creatAl: fa(0) }
  ];
  render(<XatSection />);
  const enllac = screen.getByRole('link', { name: 'http://xn--pple-43d.com/entra' });
  expect(enllac.getAttribute('rel')).toBe('noopener noreferrer');
  expect(enllac.getAttribute('target')).toBe('_blank');
  expect(screen.getByText(/caràcters enganyosos \(xn--pple-43d\.com\)/)).toBeTruthy();
});

test('el títol de la pestanya porta el comptador de no llegits', () => {
  mocks.totalNoLlegits = 5;
  render(<XatSection />);
  expect(mocks.seo).toHaveBeenCalledWith(expect.objectContaining({ title: '(5) Xat' }));
  cleanup();
  mocks.totalNoLlegits = 0;
  render(<XatSection />);
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Xat' }));
});

test('«Carrega\'n més» demana l\'historial anterior', () => {
  mocks.hiHaMes.mockReturnValue(true);
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: "Carrega'n més" }));
  expect(mocks.carregaMes).toHaveBeenCalledWith('a');
});

test('la capçalera no promet trucades i la línia secundària només ix als grups', () => {
  render(<XatSection />);
  expect(screen.queryByRole('button', { name: /trucada/i })).toBeNull();
  expect(screen.queryByText('Veí', { selector: '.sdp-xat-capcalera__sub' })).toBeNull();
  cleanup();
  mocks.threadId = 'b';
  render(<XatSection />);
  expect(screen.getByText('Pep, Maria')).toBeTruthy();
});

/* Ordre del Mestre (260927): la columna dreta que les apps de missatgeria
   deixen buida mostra el document per defecte només sense conversa; amb
   conversa, només
   el xat, i en tornar a /xat torna el document.
   Ordre del Mestre (261007) · El document és la pàgina destacada que tria
   l'administrador a paginaDestacada.js: «El Xat» ('xat'). */
test('sense conversa la dreta mostra el document per defecte; amb conversa, només el xat', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const dreta = () => document.getElementById('app-grid-main');
  expect(PAGINA_DESTACADA_DEL_XAT).toBe('xat');
  expect(dreta().querySelector('[data-testid="document-per-defecte"]').textContent).toBe(PAGINA_DESTACADA_DEL_XAT);
  expect(dreta().querySelector('.sdp-xat-conversa')).toBeNull();
  cleanup();

  mocks.threadId = 'a';
  render(<XatSection />);
  expect(dreta().querySelector('[data-testid="document-per-defecte"]')).toBeNull();
  expect(dreta().querySelector('.sdp-xat-buit')).toBeNull();
  expect(dreta().querySelector('.sdp-xat-conversa')).toBeTruthy();
  /* Tornar a les converses (entrada «Xats» del rail) deselecciona. */
  fireEvent.click(screen.getByRole('button', { name: 'Xats' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
});

/* Ordre del Mestre (261007) · Al document destacat de /xat:
    · cap acció gran «Anar al xat» (ja s'és al Xat);
    · Connectar desa la ruta de la pàgina que el lector de connexions sap
      resoldre (/page/xat), mai /xat, que no és cap pàgina (proposta P4). */
test('261007 · el document destacat: sense «Anar al xat», i Connectar porta la ruta /page/xat', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const dreta = document.getElementById('app-grid-main');
  expect(dreta.querySelector('[data-testid="document-per-defecte"]').getAttribute('data-accio')).toBe('no');
  mocks.navigate.mockClear();
  fireEvent.click(dreta.querySelector('[data-testid="connectar-del-document"]'));
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  const [ruta] = mocks.navigate.mock.calls[0];
  const url = new URL(ruta, 'http://localhost');
  expect(url.pathname).toBe('/connectar');
  expect(Object.fromEntries(url.searchParams)).toMatchObject({ objecte: 'pagina', ruta: '/page/xat', title: 'El Xat', item_id: '/page/xat' });
  /* La ruta desada és una pàgina que el lector sap llegir: la mateixa «El Xat». */
  expect(paginaDeRuta(url.searchParams.get('ruta'))).toEqual({ pageKey: 'xat', page: PAGE_COPY.xat });
});

/* Revisió del 261007 (M3-10) · El Comentar públic de la mateixa barra porta
   al xat de la mateixa pàgina que Connectar: el document rep el descriptor de
   la pàgina destacada (/page/xat), no es queda amb la ruta on està la
   persona (/xat, que no té cap xat públic). */
test('M3-10 · el document destacat rep el descriptor de la seua pàgina: Comentar i Connectar, el mateix destí', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const dreta = document.getElementById('app-grid-main');
  const objecte = JSON.parse(dreta.querySelector('[data-testid="document-per-defecte"]').getAttribute('data-objecte'));
  expect(objecte).toMatchObject({ tipus: 'pagina', ruta: '/page/xat', titol: 'El Xat' });
  mocks.navigate.mockClear();
  fireEvent.click(dreta.querySelector('[data-testid="connectar-del-document"]'));
  const url = new URL(mocks.navigate.mock.calls[0][0], 'http://localhost');
  expect([url.searchParams.get('ruta'), url.searchParams.get('title')]).toEqual([objecte.ruta, objecte.titol]);
});

test('en mode estret, sense conversa, la dreta no carrega cap document', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  await waitFor(() => expect(document.querySelector('.app-grid-shell').getAttribute('data-layout')).toBe('estret'));
  const dreta = document.getElementById('app-grid-main');
  expect(dreta.querySelector('[data-testid="document-per-defecte"]')).toBeNull();
  expect(dreta.querySelector('.sdp-xat-buit--avis').textContent).toContain('Selecciona una conversa');
});

/* El document per defecte no roba la pestanya: ni muntat alhora que el Xat
   ni muntat després (tornar d'una conversa, passar d'estret a ample). */
test('amb el document per defecte muntat, la pestanya continua sent la del Xat', () => {
  mocks.totalNoLlegits = 5;
  mocks.threadId = null;
  render(<XatSection />);
  expect(document.getElementById('app-grid-main').querySelector('[data-testid="document-per-defecte"]')).toBeTruthy();
  expect(document.title).toBe('(5) Xat | Sóc de Poble');
  cleanup();

  mocks.threadId = 'a';
  const view = render(<XatSection />);
  expect(document.title).toBe('(5) Xat | Sóc de Poble');
  mocks.seo.mockClear();
  mocks.threadId = null;
  view.rerender(<XatSection />);
  expect(document.getElementById('app-grid-main').querySelector('[data-testid="document-per-defecte"]')).toBeTruthy();
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: '(5) Xat' }));
  expect(document.title).toBe('(5) Xat | Sóc de Poble');
});

/* Ordre innegociable del Mestre (260927 vesprada): el rail seguix el menú del
   patró estàndard de missatgeria. «Novetats» era l'entrada del Control del
   xat, com a commutador (excepció de l'onada 3B). D16 (ordre del Mestre, 260930): s'amaga
   del rail, al Xat i al Control del xat; el Control continua a /control-xat i
   s'hi arriba des de la targeta «Ajustos del xat» del Panell de Control
   (ControlSection.test.jsx). La resta obrin una vista (?vista=<id>). */
test('D16 · «Novetats» no és al rail del Xat ni al del Control del xat, i /control-xat continua muntant-se', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(within(document.getElementById('app-grid-sidebar')).queryByRole('button', { name: 'Novetats' })).toBeNull();
  expect(document.getElementById('app-grid-sidebar').querySelector('svg.lucide-circle-dashed')).toBeNull();
  cleanup();

  render(<XatControlSection />);
  expect(screen.getByRole('complementary', { name: 'Control del xat' })).toBeTruthy();
  const rail = document.getElementById('app-grid-sidebar');
  expect(within(rail).queryByRole('button', { name: 'Novetats' })).toBeNull();
  expect(within(rail).getAllByRole('button').filter((b) => b.hasAttribute('aria-pressed'))).toEqual([]);
});

test('el rail seguix el patró de missatgeria: les entrades en el seu ordre (sense Novetats, D16), capçalera «Menú», les comunitats i l’avatar propi al peu', () => {
  mocks.threadId = null;
  ambComunitat();
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const noms = within(sidebar).getAllByRole('button').map((b) => b.getAttribute('aria-label'));
  /* Torn 260930 (T1): plegat, l'avatar del peu obri el full «Ajustos»
     («Tu: ajustos»); abans portava al perfil («Edita el perfil»). */
  expect(noms).toEqual(['Expandir Menú', 'Xats', 'Comunitats', 'Telefonades', 'Contingut multimèdia', 'Destacats', 'Sóc de Poble', 'Tu: ajustos']);
  expect(screen.queryByRole('button', { name: /Configuració/ })).toBeNull();
  /* Plegat: la comunitat és una icona d'avatar QUADRAT; el peu, l'avatar propi. */
  const comunitat = within(sidebar).getByRole('button', { name: 'Sóc de Poble' });
  expect(comunitat.classList.contains('sdp-workspace-rail__boto')).toBe(true);
  expect(comunitat.querySelector('.sdp-avatar.sdp-avatar--xs.sdp-xat-avatar--quadrat')).toBeTruthy();
  const peu = sidebar.querySelector('.sdp-xat-rail-peu');
  expect(peu.querySelector('.sdp-avatar--xs').getAttribute('title')).toBe('Javi');
  expect(peu.closest('.sdp-workspace-rail')).toBeNull();
});

/* Onada 3B (decisió del Mestre, 260928): cap entrada avisa de «pendent».
   Cada una porta a la seua vista; la de la vista oberta marca la pàgina. */
test.each([
  ['Comunitats', '/xat?vista=comunitats'],
  ['Telefonades', '/xat?vista=telefonades'],
  ['Contingut multimèdia', '/xat?vista=multimedia'],
  ['Destacats', '/xat?vista=destacats']
])('3B · «%s» del rail porta a %s, sense cap toast', (nom, ruta) => {
  mocks.threadId = null;
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const entrada = within(sidebar).getByRole('button', { name: nom });
  expect(entrada.hasAttribute('aria-current')).toBe(false);
  fireEvent.click(entrada);
  expect(mocks.navigate).toHaveBeenLastCalledWith(ruta);
  expect(mocks.showToast).not.toHaveBeenCalled();
});

test('3B · la vista oberta marca la seua entrada del rail i «Xats» la deixa', () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ vista: 'destacats' });
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const actius = () => within(sidebar).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.getAttribute('aria-label'));
  expect(actius()).toEqual(['Destacats']);
  /* Ja sent a la vista, tornar-la a prémer no afig historial. */
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Destacats' }));
  expect(mocks.navigate).not.toHaveBeenCalled();
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Xats' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
});

/* Graella del rail (ordre del Mestre, 260927 nit: «una graella ben
   quadrada»). jsdom no calcula geometria, però sí que conserva els atributs
   del svg: les sis icones del rail fan 24, com la roda de «Menú», en els dos
   estats, i la llista desplegada conserva la classe que ancora la CSS de la
   graella (modules.css, .sdp-xat-rail-llista) i el focus de BotoObriRail. */
test('el rail porta icones de 24 com la roda de Menú, plegat i desplegat', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const mides = (arrel) => [...arrel.querySelectorAll('svg')].map((s) => `${s.getAttribute('width')}x${s.getAttribute('height')}`);
  expect(mides(sidebar.querySelector('.app-grid-col-header__rail-top'))).toEqual(['24x24']);
  /* D16: cinc icones plegat (Novetats és amagada). */
  expect(mides(sidebar.querySelector('.sdp-workspace-rail'))).toEqual(Array(5).fill('24x24'));

  fireEvent.click(screen.getByRole('button', { name: 'Expandir Menú' }));
  expect(mides(sidebar.querySelector('.app-grid-col-header__plec'))).toEqual(['24x24']);
  /* Onada 3B · Les files de la llista principal (quatre des de D16, sense
     Novetats) i Destacats dins de «Més», amb la mateixa graella. El xebró de
     la secció també fa 24. */
  const [llista, mes] = sidebar.querySelectorAll('.sdp-xat-rail-llista');
  expect(llista.querySelectorAll('li > .sdp-workspace-nav-item')).toHaveLength(4);
  expect(mides(llista)).toEqual(Array(4).fill('24x24'));
  expect(mes.querySelectorAll('li > .sdp-workspace-nav-item')).toHaveLength(1);
  expect(mides(mes)).toEqual(['24x24']);
  expect(mides(sidebar.querySelector('.sdp-xat-rail-seccio__cap'))).toEqual(['24x24']);
  /* L'estat del rail es recorda (setVal): es deixa plegat per a la prova següent. */
  fireEvent.click(screen.getByRole('button', { name: 'Replegar Menú' }));
  expect(screen.getByRole('button', { name: 'Expandir Menú' })).toBeTruthy();
});

test.each([[950, 'ample'], [800, 'mitja']])('el divisor de Converses s’arrossega i recorda l’amplària a %ipx (%s)', async (amplada, layout) => {
  const ampladesAnteriors = getVal('sdp-grid-widths');
  const railAnterior = getVal('sdp-xat-rail');
  // AppGridShell conserva un menú vàlid (200–340px); 420 era sanejat a 260.
  setVal('sdp-grid-widths', { left: 340, middle: 280 });
  setVal('sdp-xat-rail', 'plegat');
  mocks.amplada = amplada;
  try {
    const { unmount } = render(<XatSection />);
    const shell = document.querySelector('.app-grid-shell');
    expect(shell.dataset.layout).toBe(layout);
    expect(screen.queryByRole('separator', { name: 'Redimensionar Menú' })).toBeNull();
    const divisor = screen.getByRole('separator', { name: 'Redimensionar Converses' });
    const captura = vi.fn();
    const allibera = vi.fn();
    divisor.setPointerCapture = captura;
    divisor.releasePointerCapture = allibera;
    // Conserva les coordenades i el pointerId també amb jsdom sense PointerEvent.
    const pointer = (tipus, x) => {
      const event = new MouseEvent(tipus, { bubbles: true, button: 0, clientX: x });
      Object.defineProperties(event, { pointerId: { value: 7 }, pointerType: { value: 'mouse' } });
      fireEvent(divisor, event);
    };
    pointer('pointerdown', 280);
    pointer('pointermove', 450);
    pointer('pointerup', 450);
    expect(captura).toHaveBeenCalledWith(7);
    expect(allibera).toHaveBeenCalledWith(7);
    expect(divisor.getAttribute('aria-valuenow')).toBe('450');
    expect(document.querySelector('.app-grid-page').style.getPropertyValue('--app-grid-col-list')).toBe('450px');
    expect(getVal('sdp-grid-widths')).toEqual({ left: 340, middle: 450 });
    expect(shell.dataset.layout).toBe(layout);
    expect(document.getElementById('app-grid-main').getAttribute('aria-hidden')).toBeNull();

    unmount();
    render(<XatSection />);
    expect(screen.getByRole('separator', { name: 'Redimensionar Converses' }).getAttribute('aria-valuenow')).toBe('450');
    expect(document.querySelector('.app-grid-page').style.getPropertyValue('--app-grid-col-list')).toBe('450px');
    // El mateix separador universal també es governa amb el teclat.
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Redimensionar Converses' }), { key: 'ArrowLeft' });
    expect(getVal('sdp-grid-widths').middle).toBe(434);
    // El límit preserva espai per a la conversa: menú plegat en ample,
    // menú superposat en mitjà, sense restar l'amplària desplegada desada.
    fireEvent.keyDown(screen.getByRole('separator', { name: 'Redimensionar Converses' }), { key: 'End' });
    expect(getVal('sdp-grid-widths').middle).toBe(layout === 'ample' ? 520 : 480);
    expect(document.querySelector('.app-grid-shell').dataset.layout).toBe(layout);
  } finally {
    cleanup();
    if (ampladesAnteriors == null) delVal('sdp-grid-widths');
    else setVal('sdp-grid-widths', ampladesAnteriors);
    if (railAnterior == null) delVal('sdp-xat-rail');
    else setVal('sdp-xat-rail', railAnterior);
  }
});

test('en mòbil no hi ha divisor entre panells que s’alternen', () => {
  mocks.amplada = 375;
  render(<XatSection />);
  expect(document.querySelector('.app-grid-shell').dataset.layout).toBe('estret');
  expect(screen.queryByRole('separator', { name: /Redimensionar/ })).toBeNull();
});

test('expandir el menú el manté obert quan l’amplària de Converses força el mode mitjà', () => {
  const ampladesAnteriors = getVal('sdp-grid-widths');
  const railAnterior = getVal('sdp-xat-rail');
  setVal('sdp-grid-widths', { left: 260, middle: 450 });
  setVal('sdp-xat-rail', 'plegat');
  mocks.amplada = 950;
  try {
    render(<XatSection />);
    const shell = document.querySelector('.app-grid-shell');
    expect(shell.dataset.layout).toBe('ample');
    fireEvent.click(screen.getByRole('button', { name: 'Expandir Menú' }));
    expect(shell.dataset.layout).toBe('mitja');
    expect(shell.dataset.panell).toBe('left');
    expect(document.getElementById('app-grid-sidebar').getAttribute('aria-hidden')).toBeNull();
    expect(screen.getByRole('button', { name: 'Xats' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Tanca el menú' }));
    expect(document.getElementById('app-grid-sidebar').getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('separator', { name: 'Redimensionar Converses' })).toBeTruthy();
  } finally {
    cleanup();
    if (ampladesAnteriors == null) delVal('sdp-grid-widths');
    else setVal('sdp-grid-widths', ampladesAnteriors);
    if (railAnterior == null) delVal('sdp-xat-rail');
    else setVal('sdp-xat-rail', railAnterior);
  }
});

test('el drag parteix de l’amplària visible quan la desada supera l’espai de tauleta', () => {
  const ampladesAnteriors = getVal('sdp-grid-widths');
  setVal('sdp-grid-widths', { left: 260, middle: 520 });
  mocks.amplada = 800;
  try {
    render(<XatSection />);
    expect(document.querySelector('.app-grid-shell').dataset.layout).toBe('mitja');
    const divisor = screen.getByRole('separator', { name: 'Redimensionar Converses' });
    expect(divisor.getAttribute('aria-valuenow')).toBe('480');
    expect(getVal('sdp-grid-widths').middle).toBe(520);
    const pointer = (tipus, x) => {
      const event = new MouseEvent(tipus, { bubbles: true, button: 0, clientX: x });
      Object.defineProperties(event, { pointerId: { value: 7 }, pointerType: { value: 'mouse' } });
      fireEvent(divisor, event);
    };
    pointer('pointerdown', 480);
    pointer('pointermove', 479);
    expect(divisor.getAttribute('aria-valuenow')).toBe('479');
    pointer('pointermove', 470);
    expect(divisor.getAttribute('aria-valuenow')).toBe('470');
    pointer('pointermove', 460);
    pointer('pointerup', 460);
    expect(divisor.getAttribute('aria-valuenow')).toBe('460');
    expect(getVal('sdp-grid-widths').middle).toBe(460);
    fireEvent.keyDown(divisor, { key: 'ArrowLeft' });
    expect(getVal('sdp-grid-widths').middle).toBe(444);
  } finally {
    cleanup();
    if (ampladesAnteriors == null) delVal('sdp-grid-widths');
    else setVal('sdp-grid-widths', ampladesAnteriors);
  }
});

/* D5 (ordre del Mestre, 260927) i onada 3 (260928, captures 19.11.50 i
   19.12.18): la columna de la llista seguix el patró de missatgeria. De dalt
   a baix, una sola fila de títol amb el «…» rodó a l'esquerra del títol i el «+» rodó a la
   dreta, la cerca en píndola sempre a la vista (amb la icona de filtre a la
   mateixa línia, T12) i la llista; el diàleg «Nova conversa» viu al final de
   la columna i no ocupa cap fila (és un <dialog> tancat). */
test('la llista seguix el patró de missatgeria: «…» i títol a l’esquerra, «+» a la dreta, cerca en píndola amb filtre i llista', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const columna = document.getElementById('app-grid-list').querySelector('.sdp-workspace-column');
  expect([...columna.children].map((n) => n.classList[0])).toEqual([
    'app-grid-col-header', 'sdp-xat-cerca', 'sdp-workspace-column__body', 'sdp-dialeg'
  ]);
  expect(columna.querySelector('dialog.sdp-dialeg').hasAttribute('open')).toBe(false);
  expect(columna.querySelector('.sdp-xat-cerca .sdp-xat-filtre__boto')).toBeTruthy();
  const fila = columna.firstElementChild;
  const nova = screen.getByRole('button', { name: 'Nova conversa' });
  expect(nova.classList.contains('sdp-xat-nova')).toBe(true);
  expect(nova.getAttribute('aria-haspopup')).toBe('dialog');
  const mes = within(fila).getByRole('button', { name: 'Més opcions' });
  expect(mes.getAttribute('aria-haspopup')).toBe('menu');
  /* Ordre del DOM = ordre visual: «…», títol i «+». */
  const titol = within(fila).getByText('Converses');
  const abans = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  expect(abans(mes, titol)).toBe(true);
  expect(abans(titol, nova)).toBe(true);
  expect(fila.contains(nova)).toBe(true);
  /* El «⋯» de la conversa oberta és un altre menú: ací no n'hi ha. */
  expect(screen.queryByRole('button', { name: 'Opcions de la conversa' })).toBeNull();
});

/* T69 (captura 19.13.56): escriure busca a tot arreu amb cercaXat i pinta els
   resultats per grups; la creu buida el camp i el focus hi torna, i amb el
   camp buit i el focus apareix la llista vertical de filtres. Perdre el
   focus torna la llista de converses. */
test('T69 · escriure mostra els resultats; ⊗ buida, torna el focus i, sense text, la llista vertical de filtres', async () => {
  mocks.threadId = null;
  render(<XatSection />);
  const cerca = screen.getByRole('searchbox', { name: 'Cerca converses' });
  expect(cerca.getAttribute('autocomplete')).toBe('off');
  fireEvent.change(cerca, { target: { value: 'adeu' } });
  expect(screen.queryByText('Hola')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Converses' })).toBeTruthy();
  expect(screen.getByText('Adeu').tagName).toBe('MARK');
  expect(screen.getByText('Només es busca en les converses obertes en esta sessió.')).toBeTruthy();
  /* El padró també es consulta amb el terme (grup «Persones»). */
  await waitFor(() => expect(mocks.members).toHaveBeenCalledWith('adeu'));

  fireEvent.click(screen.getByRole('button', { name: 'Tanca la cerca' }));
  expect(cerca.value).toBe('');
  expect(screen.queryByRole('button', { name: 'Tanca la cerca' })).toBeNull();
  /* La creu s'ha desmuntat: el focus torna al camp, no cau a <body>. */
  expect(document.activeElement).toBe(cerca);
  const filtres = screen.getByRole('list', { name: 'Filtres de cerca' });
  expect(within(filtres).getAllByRole('button').map((b) => b.textContent)).toEqual([
    'Fotos', 'GIF', 'Enllaços', 'Vídeos', 'Documents', 'Àudio', 'Enquestes', 'Esdeveniments'
  ]);
  /* Cap capçalera nova: la fila de títol és la de sempre. */
  expect(document.querySelectorAll('#app-grid-list .app-grid-col-header')).toHaveLength(1);
  expect(screen.queryByText('Hola')).toBeNull();

  fireEvent.blur(cerca);
  expect(screen.queryByRole('list', { name: 'Filtres de cerca' })).toBeNull();
  expect(screen.getByText('Hola')).toBeTruthy();
});

test('T69 · un filtre es posa com una fitxa dins del camp; sense dades, un estat buit honest; Escape ho neteja tot', () => {
  mocks.threadId = null;
  mocks.messages = [
    { id: '1', seq: 1, text: 'Mira https://socdepoble.org/mur', sender: 'other', author: 'Veí', creatAl: fa(1) },
    { id: '2', seq: 2, text: 'Sense enllaç', sender: 'me', creatAl: fa(0) }
  ];
  render(<XatSection />);
  const cerca = screen.getByRole('searchbox', { name: 'Cerca converses' });
  fireEvent.focus(cerca);
  const fotos = within(screen.getByRole('list', { name: 'Filtres de cerca' })).getByRole('button', { name: 'Fotos' });
  /* Triar-lo no ha de fer perdre el focus al camp. */
  expect(fireEvent.mouseDown(fotos)).toBe(false);
  fireEvent.click(fotos);
  expect(screen.getByRole('button', { name: 'Lleva el filtre Fotos' })).toBeTruthy();
  expect(screen.getByText("Encara no hi ha cap missatge d'este tipus en les converses obertes.")).toBeTruthy();
  expect(document.activeElement).toBe(cerca);

  /* La fitxa es lleva amb la seua creu i es pot triar un altre filtre. */
  fireEvent.click(screen.getByRole('button', { name: 'Lleva el filtre Fotos' }));
  fireEvent.click(within(screen.getByRole('list', { name: 'Filtres de cerca' })).getByRole('button', { name: 'Enllaços' }));
  const missatges = screen.getByRole('heading', { name: 'Missatges' }).closest('section');
  /* Els dos fils de mostra comparteixen missatges al mock: un enllaç per fil. */
  expect(within(missatges).getAllByRole('button')).toHaveLength(2);
  expect(within(missatges).getAllByText(/^Veí:/)).toHaveLength(2);

  fireEvent.keyDown(cerca, { key: 'Escape' });
  expect(screen.queryByRole('button', { name: /Lleva el filtre/ })).toBeNull();
  expect(screen.getByRole('list', { name: 'Filtres de cerca' })).toBeTruthy();
  fireEvent.keyDown(cerca, { key: 'Escape' });
  expect(screen.queryByRole('list', { name: 'Filtres de cerca' })).toBeNull();
  expect(screen.getByText('Hola')).toBeTruthy();
});

/* Captura 19.12.49: el «+» obri el diàleg «Nova conversa», que substituïx el
   padró en línia (ja no hi ha «Cerca una persona» ni «Torna a les converses»). */
test('el «+» obri el diàleg «Nova conversa» amb el cercador enfocat, i un contacte obri la conversa i el tanca', async () => {
  mocks.threadId = null;
  mocks.members.mockResolvedValue([{ usuari_id: 'B', nom: 'Àngels Puig', tipus: 'persona' }]);
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
  const dialeg = screen.getByRole('dialog', { name: 'Nova conversa' });
  const camp = within(dialeg).getByRole('searchbox', { name: 'Nom del contacte' });
  expect(document.activeElement).toBe(camp);
  expect(screen.queryByRole('searchbox', { name: 'Cerca una persona' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Torna a les converses' })).toBeNull();
  await waitFor(() => expect(mocks.members).toHaveBeenCalledWith(null));
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'angels' } });
  fireEvent.click(await within(dialeg).findByRole('button', { name: /Àngels Puig/ }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/thread-new'));
  expect(mocks.createThread).toHaveBeenCalledWith('B', null);
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* T68 (captura 19.12.18): el «…» obri un menú amb una sola opció. En triar
   «Seleccionar xats», cada fila és una casella i la fila de títol, la barra de
   selecció; «Marcar com a llegides» crida marcaLlegides (una comunitat, amb
   els ids dels seus fills). Escape ix. */
test('T68 · «Seleccionar xats»: caselles, recompte i «Marcar com a llegides» amb els fills de la comunitat', () => {
  mocks.threadId = null;
  ambComunitat();
  mocks.marcaLlegides.mockReturnValue(3);
  render(<XatSection />);
  const mes = screen.getByRole('button', { name: 'Més opcions' });
  fireEvent.click(mes);
  const menu = screen.getByRole('menu', { name: 'Més opcions' });
  expect(within(menu).getAllByRole('menuitem').map((o) => o.textContent)).toEqual(['Seleccionar xats']);
  expect(document.activeElement).toBe(within(menu).getByRole('menuitem'));
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(mes);

  fireEvent.click(mes);
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
  expect(screen.queryByRole('button', { name: 'Nova conversa' })).toBeNull();
  /* El menuitem s'ha desmuntat: el focus va a la creu de la barra, no a <body>. */
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Eixir de la selecció de xats' }));
  /* Mentre se selecciona, la cerca no hi és: els resultats no es poden triar. */
  expect(screen.queryByRole('searchbox', { name: 'Cerca converses' })).toBeNull();
  const marca = screen.getByRole('button', { name: 'Marcar com a llegides' });
  expect(marca.disabled).toBe(true);
  expect(screen.getByText('Tria els xats')).toBeTruthy();
  const caselles = within(screen.getByRole('list', { name: 'Converses' })).getAllByRole('checkbox');
  expect(caselles).toHaveLength(3);
  expect(caselles.every((c) => c.getAttribute('aria-checked') === 'false')).toBe(true);

  const comunitat = caselles.find((c) => c.textContent.includes('Sóc de Poble'));
  fireEvent.click(comunitat);
  fireEvent.click(caselles.find((c) => c.textContent.includes('Hola')));
  expect(comunitat.getAttribute('aria-checked')).toBe('true');
  expect(screen.getByText('2 seleccionades')).toBeTruthy();
  fireEvent.click(marca);
  expect(mocks.marcaLlegides).toHaveBeenCalledTimes(1);
  expect([...mocks.marcaLlegides.mock.calls[0][0]].sort()).toEqual(['a', 'a-1', 'g-1']);
  expect(mocks.showToast).toHaveBeenCalledWith('3 converses marcades com a llegides.', 'info');
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  expect(screen.getByRole('button', { name: 'Nova conversa' })).toBeTruthy();
  /* «Marcar com a llegides» s'ha desmuntat: el focus torna al «…». */
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Més opcions' }));
  expect(screen.getByRole('searchbox', { name: 'Cerca converses' })).toBeTruthy();

  /* Escape també ix, sense marcar res. */
  fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
  expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  expect(mocks.marcaLlegides).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Més opcions' }));

  /* I la creu, també amb el focus de tornada al «…». */
  fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de la selecció de xats' }));
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Més opcions' }));
});

/* Un sol Escape tanca UNA cosa: amb el «⋯» de la conversa obert enmig d'una
   selecció de xats, tanca el menú i la selecció continua amb les seues marques. */
test('T68 · Escape amb el menú de la conversa obert tanca el menú i no la selecció', () => {
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
  const llista = screen.getByRole('list', { name: 'Converses' });
  fireEvent.click(within(llista).getAllByRole('checkbox')[0]);
  expect(screen.getByText('1 seleccionada')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  expect(screen.getByRole('menuitem', { name: 'Seleccionar missatges' })).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('menuitem', { name: 'Seleccionar missatges' })).toBeNull();
  expect(screen.getByText('1 seleccionada')).toBeTruthy();
  expect(within(llista).getAllByRole('checkbox')[0].getAttribute('aria-checked')).toBe('true');

  /* El segon Escape, ja sense menú, sí que ix de la selecció. */
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
});

/* Entrar a la selecció buida la cerca: cap resultat clicable enmig de la tria. */
test('T68 · entrar a «Seleccionar xats» buida la cerca i en tornar la llista és la de converses', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const cerca = screen.getByRole('searchbox', { name: 'Cerca converses' });
  fireEvent.change(cerca, { target: { value: 'adeu' } });
  expect(screen.getByRole('region', { name: 'Resultats de la cerca' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
  expect(screen.queryByRole('region', { name: 'Resultats de la cerca' })).toBeNull();
  expect(within(screen.getByRole('list', { name: 'Converses' })).getAllByRole('checkbox')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Eixir de la selecció de xats' }));
  expect(screen.getByRole('searchbox', { name: 'Cerca converses' }).value).toBe('');
  expect(screen.getByText('Hola')).toBeTruthy();
});

/* T67 (captura 19.11.50): una comunitat és UNA fila (avatar quadrat apilat,
   nom, «›» en lloc de l'hora, els grups de dins a la segona línia i la suma
   dels no llegits); els seus fills no es pinten sols. */
test('T67 · la comunitat és una sola fila, amb els grups de dins i la suma de no llegits; obri la seua fitxa', () => {
  mocks.threadId = null;
  ambComunitat();
  render(<XatSection />);
  const llista = screen.getByRole('list', { name: 'Converses' });
  /* Onada 6 · Les files de conversa; el peu («Informa d'un error») no n'és cap.
     Gauntlet 261016 (Bloc 3.6) · Sense amfitrió, la fila de «Gent de la
     Torre» (POBLE_PER_DEFECTE) va primera: una fila més, i la comunitat baixa
     un lloc. S'actualitza a posta.
     Gauntlet 261016_1530 (Bloc 3.6, ordre vigent) · La comunitat de Sóc de
     Poble (el subjecte és l'entitat pilot) és el PRIMER actor: va la primera,
     per damunt de «Gent de la Torre». S'actualitza a posta. */
  const files = within(llista).getAllByRole('button').filter((b) => !b.closest('.sdp-xat-llista__peu'));
  expect(files).toHaveLength(4);
  expect(files[1].textContent).toContain('Gent de la Torre');
  const fila = files.find((b) => b.textContent.includes('Sóc de Poble'));
  expect(files.indexOf(fila)).toBe(0);
  expect(within(fila).getByText(', Comunitat')).toBeTruthy();
  expect(within(fila).getByText('Avisos, General')).toBeTruthy();
  expect(within(fila).getByText('3 missatges no llegits')).toBeTruthy();
  expect(fila.querySelector('.sdp-xat-apilat .sdp-xat-avatar--quadrat')).toBeTruthy();
  expect(fila.querySelector('.sdp-xat-fila__xebro')).toBeTruthy();
  expect(fila.querySelector('time')).toBeNull();
  /* Avisos i General no tenen fila pròpia a la llista. */
  expect(within(llista).queryByText('Benvinguts')).toBeNull();
  /* El grup solt porta la icona de grup i ho diu en text. */
  const grup = files.find((b) => b.textContent.includes('Adeu'));
  expect(within(grup).getByText(', Grup')).toBeTruthy();
  expect(grup.querySelector('.sdp-xat-avatar-icona')).toBeTruthy();

  fireEvent.click(fila);
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?comunitat=c-1');

  /* «Grups» inclou les comunitats. Gauntlet 261016 (Bloc 3.6) · I la fila
     virtual de «Gent de la Torre», que és un grup (pobleAmfitrio.js). */
  fireEvent.click(screen.getByRole('button', { name: /^Filtra les converses/ }));
  fireEvent.click(screen.getByRole('menuitemradio', { name: 'Grups' }));
  expect(within(screen.getByRole('list', { name: 'Converses' })).getAllByRole('button')
    .filter((b) => !b.closest('.sdp-xat-llista__peu'))
    .map((b) => (b.textContent.includes('Gent de la Torre') ? 'poble' : b.textContent.includes('Sóc de Poble') || b.textContent.includes('Adeu'))))
    .toEqual([true, 'poble', true]);
});

/* Captures 19.42.54 i 19.43.00: la fitxa de la comunitat viu a la columna de
   llista (?comunitat=), amb el botó de tornar; Avisos i els grups obrin la
   conversa sense perdre la fitxa; «+ Afegir grup» avisa amb honestedat. */
test('T67 · /xat?comunitat=<id> mostra la fitxa a la columna de llista; Avisos obri la conversa i tornar torna la llista', () => {
  mocks.threadId = null;
  ambComunitat();
  mocks.params = new URLSearchParams({ comunitat: 'c-1' });
  render(<XatSection />);
  const columna = document.getElementById('app-grid-list');
  const fitxa = within(columna).getByRole('region', { name: 'Sóc de Poble' });
  expect(within(fitxa).getByText('Comunitat')).toBeTruthy();
  expect(within(fitxa).getByRole('heading', { name: 'Grups als quals pertanys' })).toBeTruthy();
  expect(within(fitxa).getByText("Els grups que s'afegisquen a la comunitat apareixeran ací. Els membres de la comunitat s'hi podran unir.")).toBeTruthy();
  expect(within(columna).queryByRole('searchbox')).toBeNull();
  expect(within(columna).getByText('Comunitats')).toBeTruthy();
  /* Avisos primer, amb el megàfon i el seu nom per a lectors de pantalla. */
  const [avisos, general] = within(fitxa).getAllByRole('button').filter((b) => b.classList.contains('sdp-xat-fila'));
  expect(within(avisos).getByText(", Canal d'avisos")).toBeTruthy();
  /* El megàfon, encara que el canal haja heretat una imatge (captura 19.42.54). */
  expect(avisos.querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(avisos.querySelector('img')).toBeNull();
  expect(within(general).getByText('Pep:', { exact: false })).toBeTruthy();

  fireEvent.click(within(fitxa).getByRole('button', { name: 'Afegir grup' }));
  expect(mocks.showToast).toHaveBeenCalledWith(expect.stringContaining("naixen d'una Pàgina Universal"), 'info');
  fireEvent.click(avisos);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/a-1?comunitat=c-1');
  fireEvent.click(within(columna).getByRole('button', { name: 'Torna a les converses' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
});

/* Focus coherent: obrir la fitxa desmunta la fila (el focus va a la fletxa
   de tornar) i tornar-ne desmunta la fletxa (el focus va a la fila). */
test('T67 · en obrir la fitxa el focus va a la fletxa i en tornar, a la fila de la comunitat', () => {
  mocks.threadId = null;
  ambComunitat();
  const view = render(<XatSection />);
  const fila = () => within(screen.getByRole('list', { name: 'Converses' })).getAllByRole('button')
    .find((b) => b.textContent.includes('Sóc de Poble'));
  act(() => fila().focus());
  fireEvent.click(fila());
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?comunitat=c-1');
  mocks.params = new URLSearchParams({ comunitat: 'c-1' });
  view.rerender(<XatSection />);
  const torna = within(document.getElementById('app-grid-list')).getByRole('button', { name: 'Torna a les converses' });
  expect(document.activeElement).toBe(torna);

  fireEvent.click(torna);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
  mocks.params = new URLSearchParams();
  view.rerender(<XatSection />);
  expect(document.activeElement).toBe(fila());
});

test('T67 · una comunitat no s’obri mai com a conversa: /xat/<comunitat> porta a la seua fitxa', () => {
  ambComunitat();
  mocks.threadId = 'c-1';
  render(<XatSection />);
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?comunitat=c-1', { replace: true });
  expect(document.querySelector('.sdp-xat-conversa')).toBeNull();
  expect(mocks.openThread).not.toHaveBeenCalledWith('c-1');
});

/* T63.2 · Conversa de pàgina: «Sobre: <títol>» enllaçat a la pàgina i el
   recompte de participants; l'avís del xat públic damunt del compositor; als
   Avisos, qui no n'és administrador no hi escriu. */
test('T63.2 · la conversa de pàgina diu sobre què és, quants hi participen i que el xat és públic', () => {
  mocks.threads = [mapejaFil({
    id: 'g-9', tipus: 'grup', titol: 'Festa', altresNoms: ['Pep', 'Maria'], participants: 12,
    subjecte: { tipus: 'publicacio', id: 'p-1', ruta: '/mur/p-1', titol: 'Festa major' }
  })];
  mocks.threadId = 'g-9';
  render(<XatSection />);
  const capcalera = document.querySelector('.sdp-xat-capcalera');
  /* Avatar, nom i «Sobre: …» fan un sol enllaç de --sdp-touch d'alt (Pedra
     Seca §6), no un text de 14px; «Sobre:» i els participants en són la
     descripció accessible. */
  const enllac = within(capcalera).getByRole('link', { name: 'Obri la pàgina Festa major' });
  expect(enllac.getAttribute('href')).toBe('/mur/p-1');
  expect(enllac.classList.contains('sdp-xat-capcalera__enllac')).toBe(true);
  expect(within(enllac).getByText('Sobre: Festa major')).toBeTruthy();
  expect(document.getElementById(enllac.getAttribute('aria-describedby')).textContent).toBe('Sobre: Festa major · 12 participants');
  expect(within(capcalera).getByText('12 participants', { exact: false })).toBeTruthy();
  expect(within(capcalera).queryByText('Pep, Maria')).toBeNull();
  expect(screen.getByText('Escrius al xat públic de «Festa major».')).toBeTruthy();
  expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
});

test('T67 · als Avisos, qui no n’és administrador llig l’avís en lloc del compositor', () => {
  ambComunitat();
  mocks.threadId = 'a-1';
  render(<XatSection />);
  expect(screen.queryByRole('textbox', { name: 'Escriu un missatge' })).toBeNull();
  expect(screen.getByText('En Avisos només escriuen els administradors.')).toBeTruthy();
  /* La capçalera dels Avisos també porta el megàfon, no la imatge heretada. */
  const capcalera = document.querySelector('.sdp-xat-capcalera');
  expect(capcalera.querySelector('.sdp-xat-avatar-icona--sm svg.lucide-megaphone')).toBeTruthy();
  expect(capcalera.querySelector('img')).toBeNull();
});

/* D7 (ordre del Mestre, 260930) · Avisos estrictament unidireccionals: un
   canal sense potEscriure (el camp no arriba) és de només lectura; només amb
   potEscriure: true (administració) s'hi escriu. Un grup sense el camp no
   canvia: continua mostrant el formulari. */
test.each([
  ['un canal sense potEscriure', false, { tipus: 'canal' }],
  ['un canal amb potEscriure: false', false, { tipus: 'canal', potEscriure: false }],
  ['un canal amb potEscriure: true', true, { tipus: 'canal', potEscriure: true }],
  ['un grup sense potEscriure', true, { tipus: 'grup' }]
])('D7 · %s: s’hi pot escriure = %s', (_, escriu, camps) => {
  mocks.threads = [{ id: 'k-1', title: 'Avisos del poble', name: 'Avisos del poble', ultimText: '', ultimAl: fa(0), noLlegits: 0, ...camps }];
  mocks.threadId = 'k-1';
  render(<XatSection />);
  if (escriu) {
    expect(screen.getByRole('textbox', { name: 'Escriu un missatge' })).toBeTruthy();
    expect(screen.queryByText('En Avisos només escriuen els administradors.')).toBeNull();
  } else {
    expect(screen.queryByRole('textbox', { name: 'Escriu un missatge' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Envia' })).toBeNull();
    expect(screen.getByText('En Avisos només escriuen els administradors.').closest('[role="status"]')).toBeTruthy();
  }
});

/* T63.2 · ?sobre=<tipus>:<id>&titol=…&ruta=…: es talla pel PRIMER «:», es
   valida amb subjecteDeXat i s'obri el xat comú, una sola vegada. */
test('objecteDeSobre talla pel primer «:» i, en una pàgina, l’id és la ruta', () => {
  expect(objecteDeSobre('publicacio:p-1', 'Festa', '/mur/p-1')).toEqual({ tipus: 'publicacio', id: 'p-1', titol: 'Festa', ruta: '/mur/p-1' });
  expect(objecteDeSobre('pagina:/mur')).toEqual({ tipus: 'pagina', id: '/mur', titol: '', ruta: '/mur' });
  expect(objecteDeSobre('entitat:a:b')).toMatchObject({ tipus: 'entitat', id: 'a:b' });
  expect(objecteDeSobre('sense-dos-punts')).toBeNull();
  expect(objecteDeSobre(':x')).toBeNull();
});

test('T63.2 · ?sobre= obri el xat comú amb obriFilDePagina i hi navega una sola vegada', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ sobre: 'publicacio:p-1', titol: 'Festa', ruta: '/mur/p-1' });
  mocks.obriFilDePagina.mockResolvedValue('g-9');
  const view = render(<XatSection />);
  view.rerender(<XatSection />);
  /* Auditoria 261008 (B05) · La conversa conserva el descriptor del subjecte.
     Revisió 261008 · Només ?sobre=: ni el títol ni la ruta queden a la URL. */
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/g-9?sobre=publicacio%3Ap-1', { replace: true }));
  expect(mocks.obriFilDePagina).toHaveBeenCalledTimes(1);
  expect(mocks.obriFilDePagina).toHaveBeenCalledWith({ tipus: 'publicacio', id: 'p-1', titol: 'Festa', ruta: '/mur/p-1' });
});

/* Revisió 261008 · El xat comú d'una organització de membres el llig una
   membre: el seu nom no ha de quedar a l'historial ni a la URL de l'amfitrió. */
test('B05 · la URL de la conversa d’una organització porta només el descriptor, mai el nom ni la ruta', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ sobre: 'entitat:org-m', titol: 'Associació de Membres', ruta: '/empresa/assoc-membres' });
  mocks.obriFilDePagina.mockResolvedValue('g-9');
  render(<XatSection />);
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
  const [ruta, opcions] = mocks.navigate.mock.calls.at(-1);
  expect(opcions).toEqual({ replace: true });
  expect(ruta).toBe('/xat/g-9?sobre=entitat%3Aorg-m');
  expect(decodeURIComponent(ruta)).not.toMatch(/Associació|assoc-membres/);
});

/* StrictMode munta, desmunta i torna a muntar els efectes: la guarda d'una
   sola obertura no pot deixar la primera passada sense navegar. */
test('T63.2 · amb StrictMode, ?sobre= i ?amb= s’obrin una sola vegada i hi naveguen igualment', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ sobre: 'publicacio:p-1', titol: 'Festa' });
  mocks.obriFilDePagina.mockResolvedValue('g-9');
  render(<StrictMode><XatSection /></StrictMode>);
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/g-9?sobre=publicacio%3Ap-1', { replace: true }));
  expect(mocks.obriFilDePagina).toHaveBeenCalledTimes(1);
  cleanup();

  mocks.navigate.mockClear();
  mocks.params = new URLSearchParams({ amb: 'socdepoble' });
  render(<StrictMode><XatSection /></StrictMode>);
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/thread-new', { replace: true }));
  expect(mocks.createThread).toHaveBeenCalledTimes(1);
});

/* Un ?sobre= (el «Comentar» d'una pàgina amb xat comú) torna a obrir-se amb
   la mateixa instància del Xat (/xat i /xat/ID la conserven).
   Ordre del Mestre (261007) · «COMENTARIS = XAT» · Comentar de qualsevol
   pàgina, el document destacat inclòs, obri el menú de dues vies: «En
   públic» porta ací (?sobre=, el xat comú de la pàgina) i «En privat», al
   xat amb Sóc de Poble (?amb=). TextSection.test.jsx prova el menú de les
   pàgines de text. */
test('T63.2 · la mateixa instància torna a obrir el mateix ?sobre= després d’haver-ne eixit', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ sobre: 'pagina:/iaia' });
  mocks.obriFilDePagina.mockResolvedValue('g-ia');
  const view = render(<XatSection />);
  await waitFor(() => expect(mocks.obriFilDePagina).toHaveBeenCalledTimes(1));
  mocks.params = new URLSearchParams();
  view.rerender(<XatSection />);
  mocks.params = new URLSearchParams({ sobre: 'pagina:/iaia' });
  view.rerender(<XatSection />);
  await waitFor(() => expect(mocks.obriFilDePagina).toHaveBeenCalledTimes(2));
});

test.each([
  ['null (cap xat comú)', () => mocks.obriFilDePagina.mockResolvedValue(null), 'Ací no hi ha cap xat comú on comentar.'],
  ['sense la capacitat', () => mocks.obriFilDePagina.mockRejectedValue(Object.assign(new Error('x'), { codi: 'sense-capacitat' })), 'Este poble encara no té el xat de les pàgines.']
])('T63.2 · ?sobre= %s: avís honest i la llista', async (_, prepara, avis) => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ sobre: 'pagina:/mur' });
  prepara();
  render(<XatSection />);
  await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith(avis, 'info'));
  expect(mocks.obriFilDePagina).toHaveBeenCalledWith({ tipus: 'pagina', id: '/mur', titol: '', ruta: '/mur' });
  expect(mocks.navigate).toHaveBeenCalledWith('/xat', { replace: true });
});

test('T63.2 · ?sobre= d’una pàgina sense xat no crida el backend; en remot sense sessió porta a /registre', () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ sobre: 'pagina:/notes' });
  render(<XatSection />);
  expect(mocks.obriFilDePagina).not.toHaveBeenCalled();
  expect(mocks.showToast).toHaveBeenCalledWith('Ací no hi ha cap xat comú on comentar.', 'info');
  cleanup();

  mocks.navigate.mockClear();
  mocks.senseSessio = true;
  mocks.joId = null;
  mocks.params = new URLSearchParams({ sobre: 'publicacio:p-1', titol: 'Festa' });
  render(<XatSection />);
  /* T4: la forma única de l'entrada (rutaDEntrada) porta el mode i la tornada. */
  expect(mocks.navigate).toHaveBeenCalledWith(
    `/registre?${new URLSearchParams({ mode: 'entrar', tornar: '/xat?sobre=publicacio%3Ap-1&titol=Festa' })}`, { replace: true }
  );
  expect(mocks.obriFilDePagina).not.toHaveBeenCalled();
});

/* T4 · La tornada que el Xat passa a rutaDEntrada: la ruta amb la consulta.
   (Des de la correcció de la revisió, el mock de XatContext conserva el mòdul
   real amb importOriginal i FakeChatOnboarding es pot pintar: la prova T63.2
   de dalt ja cobrix la redirecció sencera.) */
test('T4 · rutaAmbConsulta conserva la ruta i la consulta del Xat per a tornar després d’entrar', () => {
  expect(rutaAmbConsulta('/xat', new URLSearchParams())).toBe('/xat');
  expect(rutaAmbConsulta('/xat/a', new URLSearchParams({ context: 'hola' }))).toBe('/xat/a?context=hola');
  expect(rutaAmbConsulta('', new URLSearchParams({ vista: 'telefonades' }))).toBe('/xat?vista=telefonades');
  const sobre = new URLSearchParams({ sobre: 'publicacio:p-1', titol: 'Festa' });
  const desti = rutaDEntrada({ tornar: rutaAmbConsulta('/xat', sobre) });
  expect(desti.startsWith('/registre?mode=entrar&tornar=')).toBe(true);
  expect(new URLSearchParams(desti.split('?')[1]).get('tornar')).toBe('/xat?sobre=publicacio%3Ap-1&titol=Festa');
});

/* En remot, mentre la sessió es comprova, joId és null i encara no és
   senseSessio (XatContext): ?sobre= espera, sense cap avís fals ni perdre la
   URL, i s'obri quan arriba la sessió. */
test('T63.2 · mentre la sessió es comprova, ?sobre= espera i s’obri quan arriba joId', async () => {
  mocks.threadId = null;
  mocks.joId = null;
  mocks.senseSessio = false;
  mocks.params = new URLSearchParams({ sobre: 'publicacio:p-1', titol: 'Festa' });
  mocks.obriFilDePagina.mockResolvedValue('g-9');
  const view = render(<XatSection />);
  await act(async () => {});
  expect(mocks.obriFilDePagina).not.toHaveBeenCalled();
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.showToast).not.toHaveBeenCalled();

  mocks.joId = 'jo';
  view.rerender(<XatSection />);
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/g-9?sobre=publicacio%3Ap-1', { replace: true }));
  expect(mocks.obriFilDePagina).toHaveBeenCalledTimes(1);
  expect(mocks.showToast).not.toHaveBeenCalled();
});

/* Una resolució tardana no trepitja la conversa que la persona ja ha obert. */
test('T63.2 · si la persona obri una altra conversa abans que resolga ?sobre= o ?amb=, no s’hi navega', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ sobre: 'publicacio:p-1' });
  let resolSobre;
  mocks.obriFilDePagina.mockImplementation(() => new Promise((r) => { resolSobre = r; }));
  const view = render(<XatSection />);
  await waitFor(() => expect(mocks.obriFilDePagina).toHaveBeenCalledTimes(1));
  mocks.params = new URLSearchParams();
  mocks.threadId = 'b';
  view.rerender(<XatSection />);
  await act(async () => resolSobre('g-9'));
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.showToast).not.toHaveBeenCalled();
  cleanup();

  mocks.threadId = null;
  mocks.params = new URLSearchParams({ amb: 'socdepoble' });
  let resolAmb;
  mocks.createThread.mockImplementation(() => new Promise((r) => { resolAmb = r; }));
  const segona = render(<XatSection />);
  await waitFor(() => expect(mocks.createThread).toHaveBeenCalledTimes(1));
  mocks.params = new URLSearchParams();
  mocks.threadId = 'b';
  segona.rerender(<XatSection />);
  await act(async () => resolAmb('thread-vell'));
  expect(mocks.navigate).not.toHaveBeenCalled();
});

/* T69 amb el teclat: els filtres són al DOM darrere del botó de filtre, i un
   Tab normal els tancaria. Fletxa avall o Tab hi entren; dins, les fletxes,
   Inici i Fi es mouen; Fletxa amunt a la primera i Escape tornen al camp. */
test('T69 · els filtres de la cerca es trien amb el teclat', () => {
  mocks.threadId = null;
  render(<XatSection />);
  const cerca = screen.getByRole('searchbox', { name: 'Cerca converses' });
  act(() => cerca.focus());
  const llista = screen.getByRole('list', { name: 'Filtres de cerca' });
  const fila = (nom) => within(llista).getByRole('button', { name: nom });

  fireEvent.keyDown(cerca, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(fila('Fotos'));
  expect(screen.getByRole('list', { name: 'Filtres de cerca' })).toBe(llista);
  fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(fila('GIF'));
  fireEvent.keyDown(document.activeElement, { key: 'End' });
  expect(document.activeElement).toBe(fila('Esdeveniments'));
  fireEvent.keyDown(document.activeElement, { key: 'Home' });
  expect(document.activeElement).toBe(fila('Fotos'));
  fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' });
  expect(document.activeElement).toBe(cerca);
  expect(screen.getByRole('list', { name: 'Filtres de cerca' })).toBe(llista);

  /* Tab des del camp buit entra a la llista; Escape hi torna. */
  fireEvent.keyDown(cerca, { key: 'Tab' });
  expect(document.activeElement).toBe(fila('Fotos'));
  fireEvent.keyDown(document.activeElement, { key: 'Escape' });
  expect(document.activeElement).toBe(cerca);

  /* Triar-ne un (Retorn = clic del botó) posa la fitxa i el focus torna al camp. */
  fireEvent.keyDown(cerca, { key: 'ArrowDown' });
  fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
  fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
  fireEvent.click(document.activeElement);
  expect(screen.getByRole('button', { name: 'Lleva el filtre Enllaços' })).toBeTruthy();
  expect(document.activeElement).toBe(cerca);

  /* Escape buida; amb el camp buit, Escape amaga els filtres SENSE traure el
     focus del camp (no cau a <body>) i Fletxa avall els torna a obrir. */
  fireEvent.keyDown(cerca, { key: 'Escape' });
  fireEvent.keyDown(cerca, { key: 'Escape' });
  expect(screen.queryByRole('list', { name: 'Filtres de cerca' })).toBeNull();
  expect(document.activeElement).toBe(cerca);
  expect(screen.getByText('Hola')).toBeTruthy();
  fireEvent.keyDown(cerca, { key: 'ArrowDown' });
  expect(screen.getByRole('list', { name: 'Filtres de cerca' })).toBeTruthy();
});

/* Un toast quedaria davall del <dialog> modal, inert: l'error d'obrir la
   conversa des de «Nova conversa» es diu dins del diàleg. */
test('si obrir la conversa falla des del diàleg «Nova conversa», l’avís es pinta dins del diàleg', async () => {
  mocks.threadId = null;
  mocks.members.mockResolvedValue([{ usuari_id: 'B', nom: 'Àngels Puig', tipus: 'persona' }]);
  mocks.createThread.mockRejectedValue(new Error('Sense xarxa'));
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
  const dialeg = screen.getByRole('dialog', { name: 'Nova conversa' });
  fireEvent.change(within(dialeg).getByRole('searchbox'), { target: { value: 'angels' } });
  fireEvent.click(await within(dialeg).findByRole('button', { name: /Àngels Puig/ }));
  await waitFor(() => expect(within(dialeg).getByRole('alert').textContent).toBe('Sense xarxa'));
  expect(mocks.showToast).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: 'Nova conversa' })).toBeTruthy();
  expect(mocks.navigate).not.toHaveBeenCalled();

  /* Tancar i tornar a obrir el diàleg no arrossega l'avís vell. */
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Tancar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nova conversa' }));
  expect(within(screen.getByRole('dialog', { name: 'Nova conversa' })).queryByRole('alert')).toBeNull();
});

/* En estret i en mitjà la closca del Xat no pinta pestanyes (la regla viu a
   modules.css; jsdom no carrega CSS): la fila de títol obri el rail, el rail
   va sempre desplegat amb etiquetes (mai el de 56px d'icones, que quedava
   perdut dins del panell) i la seua creu el tanca. */
test('en mode estret la fila de títol obri el rail desplegat i la creu del rail el tanca', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  const rail = document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail');
  /* El botó es diu com el panell que obri. */
  expect(rail.getAttribute('aria-label')).toBe('Menú');
  expect(rail.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('left');
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(sidebar.getAttribute('data-obert')).toBe('true');
  expect(sidebar.querySelector('.app-grid-col-header--collapsed')).toBeNull();
  expect(sidebar.querySelector('.sdp-xat-rail-llista')).toBeTruthy();
  /* La llista passa a `inert`: el focus entra a la primera entrada del rail. */
  expect(document.activeElement).toBe(within(sidebar).getByRole('button', { name: 'Xats' }));

  /* Tota la pastilla del rail el tanca: també el text i amb retorn de focus. */
  const tanca = within(sidebar).getByRole('button', { name: 'Tanca el menú' });
  expect(tanca.querySelector('button')).toBeNull();
  fireEvent.click(within(tanca).getByText('Menú'));
  expect(closca.getAttribute('data-panell')).toBe('middle');
  expect(document.activeElement).toBe(rail);
});

/* D16: «Novetats» és amagada; la segona tria és una vista («Comunitats»). */
test('en mode estret, triar una entrada del rail el tanca: «Xats» torna la llista i «Comunitats» obri la seua vista', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  const rail = document.querySelector('.sdp-xat-obri-rail');
  const sidebar = document.getElementById('app-grid-sidebar');
  fireEvent.click(rail);
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Xats' }));
  expect(closca.getAttribute('data-panell')).toBe('middle');
  /* Ja sent a /xat, «Xats» no afig cap entrada a l'historial. */
  expect(mocks.navigate).not.toHaveBeenCalled();

  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('left');
  expect(within(sidebar).queryByRole('button', { name: 'Novetats' })).toBeNull();
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Comunitats' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=comunitats');
  expect(closca.getAttribute('data-panell')).toBe('middle');
});

/* El Control del xat seguix el mateix calc: fila de títol amb el botó del
   rail, cap fila 2 buida fora d'ample, i l'opció oberta amb la fletxa que
   torna a la llista d'opcions. */
test('en mode estret el Control del xat porta el botó del rail, cap fila buida i la fletxa d\'arrere a l\'opció', async () => {
  mocks.amplada = 375;
  render(<XatControlSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  const llista = document.getElementById('app-grid-list');
  expect(llista.querySelector('.sdp-xat-obri-rail')).toBeTruthy();
  expect(llista.querySelector('.app-grid-col-header--dark-intens')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Torna a les opcions' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: /Missatges temporals/ }));
  const dreta = document.getElementById('app-grid-main');
  expect(closca.getAttribute('data-panell')).toBe('');
  expect(dreta.getAttribute('data-obert')).toBe('true');
  expect(dreta.querySelector('.sdp-xat-capcalera--opcio').textContent).toContain('Missatges temporals');
  fireEvent.click(screen.getByRole('button', { name: 'Torna a les opcions' }));
  expect(closca.getAttribute('data-panell')).toBe('middle');
  expect(dreta.querySelector('.sdp-xat-capcalera--opcio')).toBeNull();
});

test('en ample el Control del xat conserva la fila 2 i el rail plegat d\'icones, sense controls de mòbil', () => {
  render(<XatControlSection />);
  const llista = document.getElementById('app-grid-list');
  expect(llista.querySelector('.app-grid-col-header--dark-intens')).toBeTruthy();
  expect(llista.querySelector('.sdp-xat-obri-rail')).toBeNull();
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(sidebar.querySelector('.app-grid-col-header--collapsed')).toBeTruthy();
  expect(sidebar.querySelector('.sdp-xat-rail-llista')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Tanca el menú' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Expandir Menú' })).toBeTruthy();
});

/* Mòbil: la closca del Xat ja no pinta pestanyes en estret (cada columna
   porta el seu control). Amb una conversa oberta, la fletxa «Torna a la
   llista» de la capçalera hi torna (/xat, la llista a pantalla) i triar-hi
   la mateixa conversa la torna a portar a pantalla. */
test('en mode estret, la fletxa torna a la llista i des d\'ella es torna a la conversa', async () => {
  mocks.amplada = 375;
  mocks.threadId = 'a';
  const { rerender } = render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  const dreta = document.getElementById('app-grid-main');
  await waitFor(() => expect(dreta.getAttribute('data-obert')).toBe('true'));
  fireEvent.click(screen.getByRole('button', { name: 'Torna a la llista' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');

  mocks.threadId = null;
  rerender(<XatSection />);
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  expect(dreta.getAttribute('data-obert')).toBe('false');

  fireEvent.click(screen.getByText('Hola').closest('button'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/a');
  mocks.threadId = 'a';
  rerender(<XatSection />);
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe(''));
  expect(dreta.getAttribute('data-obert')).toBe('true');
});

/* Tauleta (mitjà): la mateixa fila de títol que en mòbil; el botó obri el
   rail desplegat, la creu del rail el tanca, i el focus torna al botó. */
test('en mode mitjà la fila de títol obri el rail desplegat, la creu el tanca i el focus torna al botó', async () => {
  mocks.amplada = 820;
  mocks.threadId = null;
  render(<XatSection />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-layout')).toBe('mitja'));
  const rail = document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail');
  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('left');
  expect(rail.getAttribute('aria-expanded')).toBe('true');
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(sidebar.querySelector('.app-grid-col-header--collapsed')).toBeNull();
  expect(sidebar.contains(document.activeElement)).toBe(true);

  fireEvent.click(within(sidebar).getByRole('button', { name: 'Tanca el menú' }));
  expect(closca.getAttribute('data-panell')).toBe('');
  expect(document.activeElement).toBe(rail);

  fireEvent.click(rail);
  fireEvent.click(rail);
  expect(closca.getAttribute('data-panell')).toBe('');
});

/* T6 · L'encastat de WordPress munta l'app en un Shadow DOM tancat
   (PedraSecaEmbed.jsx), on document.activeElement és l'amfitrió. Tancar el
   rail amb el focus a dins l'ha de portar al botó del rail, no deixar-lo
   retingut dins de #app-grid-sidebar, que passa a aria-hidden i inert.
   Muntatge com el de Dialeg.test.jsx (muntaLocal). */
function muntaXatEnOmbra(element) {
  const host = document.createElement('soc-de-poble');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div');
  root.className = 'sdp-root';
  shadow.append(root);
  const muntatge = document.createElement('div');
  root.append(muntatge);
  return { host, shadow, root, ...render(element, { container: muntatge, baseElement: root }) };
}

test.each([
  ['mitjà', 820, 'Tanca el menú'],
  ['mitjà', 820, 'Xats'],
  ['estret', 375, 'Tanca el menú'],
  ['estret', 375, 'Xats']
])('T6 · en %s (%i px) dins d’un Shadow DOM tancat, «%s» tanca el rail i el focus torna al botó del rail', async (_, amplada, nom) => {
  mocks.amplada = amplada;
  mocks.threadId = null;
  const { host, shadow, root } = muntaXatEnOmbra(<XatSection />);
  try {
    const closca = root.querySelector('.app-grid-shell');
    await waitFor(() => expect(closca.getAttribute('data-layout')).toBe(amplada === 375 ? 'estret' : 'mitja'));
    if (amplada === 375) await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
    const boto = root.querySelector('#app-grid-list .sdp-xat-obri-rail');
    expect(boto.getAttribute('aria-controls')).toBe('app-grid-sidebar');
    fireEvent.click(boto);
    expect(closca.getAttribute('data-panell')).toBe('left');
    const sidebar = root.querySelector('#app-grid-sidebar');
    const entrada = within(sidebar).getByRole('button', { name: nom });
    entrada.focus();
    /* La premissa: fora de l'arrel només es veu l'amfitrió. */
    expect(document.activeElement).toBe(host);
    expect(shadow.activeElement).toBe(entrada);
    fireEvent.click(entrada);
    expect(sidebar.getAttribute('aria-hidden')).toBe('true');
    expect(sidebar.contains(shadow.activeElement)).toBe(false);
    expect(shadow.activeElement).toBe(boto);
  } finally {
    cleanup();
    host.remove();
  }
});

/* Lògica d'Usuari (T3, T4): l'altra part de la conversa té perfil i, si és la
   IAIA, es diu. Als grups, el nom de l'autor també enllaça al seu perfil.
   Gauntlet 261016_1530 (Bloc 3.6.2; relleu F63) · Ordre del Mestre: la
   capçalera del xat de la IAIA (el fil 'iaia') porta a la seua fitxa, /iaia
   (actorsDelXat.js · rutaCanonicaDelXat), no a /perfil/<id>. S'actualitza a
   posta; la bombolla continua enllaçant al perfil de qui la signa. */
test('la capçalera enllaça al perfil de l’altra part i diu quan és la IAIA', () => {
  mocks.threads = [{
    id: 'ia', tipus: 'iaia', name: 'IAIA MarIA', esIA: true, ultimText: 'Hola', ultimAl: fa(0), noLlegits: 0,
    altresNoms: ['IAIA MarIA'], altres: [{ id: 'iaia-1', nom: 'IAIA MarIA', tipus: 'ia', avatarUrl: null }]
  }];
  mocks.messages = [{ id: '7', seq: 7, text: 'Ara estic en proves', sender: 'other', author: 'IAIA MarIA', usuariId: 'iaia-1', is_ai: true, creatAl: fa(0) }];
  mocks.threadId = 'ia';
  render(<XatSection />);
  const capcalera = document.querySelector('.sdp-xat-capcalera');
  const enllac = within(capcalera).getByRole('link', { name: 'Obri el perfil de IAIA MarIA' });
  expect(enllac.getAttribute('href')).toBe('/iaia');
  expect(within(capcalera).getByText('Intel·ligència artificial en proves')).toBeTruthy();
  /* La bombolla de la IAIA es signa com a IA i també enllaça al perfil. */
  const autor = within(document.querySelector('.sdp-xat-missatges')).getByRole('link', { name: 'Obri el perfil de IAIA MarIA' });
  expect(autor.textContent).toBe('IAIA MarIA · IA');
});

test('als grups, el nom de l’autor enllaça al seu perfil; a les converses directes no s’escriu', () => {
  render(<XatSection />);
  expect(document.querySelector('.sdp-xat-bombolla__autor')).toBeNull();
  cleanup();
  mocks.threadId = 'b';
  render(<XatSection />);
  const autor = screen.getByRole('link', { name: 'Obri el perfil de Veí' });
  expect(autor.getAttribute('href')).toBe('/gent/x');
  expect(autor.classList.contains('sdp-xat-bombolla__autor')).toBe(true);
});

test('el canal d’una entitat diu en nom de qui es parla i la capçalera enllaça al client', () => {
  mocks.threads = [{
    id: 'canal', tipus: 'entitat', name: 'Toni Pastor', comEntitat: true, entitatId: 'socdepoble', entitatNom: 'Sóc de Poble',
    ultimText: 'Queden samarretes?', ultimAl: fa(0), noLlegits: 1, altresNoms: ['Toni Pastor'],
    altres: [{ id: 'toni', nom: 'Toni Pastor', tipus: 'persona', avatarUrl: null }]
  }];
  mocks.threadId = 'canal';
  render(<XatSection />);
  const capcalera = document.querySelector('.sdp-xat-capcalera');
  expect(within(capcalera).getByText('Canal de Sóc de Poble')).toBeTruthy();
  expect(within(capcalera).getByRole('link', { name: 'Obri el perfil de Toni Pastor' }).getAttribute('href')).toBe('/gent/toni');
});

test('?amb=<id> obri o crea la conversa amb eixa identitat i hi navega', async () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ amb: 'socdepoble' });
  render(<XatSection />);
  await waitFor(() => expect(mocks.createThread).toHaveBeenCalledWith('socdepoble', null));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/xat/thread-new', { replace: true }));
  expect(mocks.createThread).toHaveBeenCalledTimes(1);
});

test('en ample la fila de títol no porta el botó del rail', () => {
  mocks.threadId = null;
  render(<XatSection />);
  expect(document.querySelector('.sdp-xat-obri-rail')).toBeNull();
});

test('en ample el text de Menú replega tot el rail i conserva el focus entre els controls', () => {
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Expandir Menú' }));
  const replega = screen.getByRole('button', { name: 'Replegar Menú' });
  expect(document.activeElement).toBe(replega);
  expect(replega.getAttribute('aria-expanded')).toBe('true');
  expect(replega.querySelector('button')).toBeNull();
  fireEvent.click(within(replega).getByText('Menú'));
  const expandir = screen.getByRole('button', { name: 'Expandir Menú' });
  expect(expandir.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(expandir);
});

test('en mode estret primer es veu la llista i, amb conversa, la conversa', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  render(<XatSection />);
  await waitFor(() => expect(document.getElementById('app-grid-list').getAttribute('data-obert')).toBe('true'));
  cleanup();
  mocks.threadId = 'a';
  render(<XatSection />);
  await waitFor(() => expect(document.getElementById('app-grid-main').getAttribute('data-obert')).toBe('true'));
  expect(document.getElementById('app-grid-list').getAttribute('data-obert')).toBe('false');
  expect(screen.getByRole('button', { name: 'Torna a la llista' })).toBeTruthy();
});

/* El que toques és el que s'obri (ordre del Mestre, 260927): la capçalera de
   la columna central del Control porta el mateix dibuix que l'entrada que hi
   duia, i no la roda de configuració. D16: «Novetats» ja no és al rail (la
   targeta «Ajustos del xat» del Panell de Control porta el mateix dibuix); la
   capçalera conserva la icona de l'entrada, que ENTRADES_RAIL conserva amagada. */
test('la capçalera del Control del xat porta la icona de «Novetats» (CircleDashed), que ja no és al rail', () => {
  mocks.threadId = null;
  render(<XatControlSection />);
  const rail = document.getElementById('app-grid-sidebar');
  expect(within(rail).queryByRole('button', { name: 'Novetats' })).toBeNull();
  const columna = screen.getByRole('complementary', { name: 'Control del xat' });
  const capcalera = columna.querySelector('.app-grid-col-header__plec svg');
  expect(capcalera).toBeTruthy();
  expect(capcalera.getAttribute('class')).toMatch(/circle-dashed/);
  expect(columna.querySelector('.app-grid-col-header .lucide-settings')).toBeNull();
});

/* ═══ Onada 3B · rail desplegat, vistes de la columna central ═══════════ */

/* Les preferències del rail (plegat, «Més» i «Comunitats») es recorden amb
   getVal/setVal: cada prova les deixa com les ha trobades. */
const CLAUS_RAIL = ['sdp-xat-rail', 'sdp-xat-rail-mes', 'sdp-xat-rail-comunitats'];
function ambRailObert(prova) {
  const abans = CLAUS_RAIL.map((clau) => [clau, getVal(clau)]);
  setVal('sdp-xat-rail', 'obert');
  delVal('sdp-xat-rail-mes');
  delVal('sdp-xat-rail-comunitats');
  try {
    return prova();
  } finally {
    cleanup();
    for (const [clau, valor] of abans) {
      if (valor == null) delVal(clau);
      else setVal(clau, valor);
    }
  }
}

test('3B · rail desplegat: «Més» amb Destacats i «Comunitats» amb les comunitats, plegables i recordades', () => ambRailObert(() => {
  mocks.threadId = null;
  ambComunitat();
  const view = render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const mes = within(sidebar).getByRole('button', { name: 'Secció Més' });
  const comunitats = within(sidebar).getByRole('button', { name: 'Secció Comunitats' });
  expect(mes.getAttribute('aria-expanded')).toBe('true');
  expect(comunitats.getAttribute('aria-expanded')).toBe('true');
  expect(document.getElementById(mes.getAttribute('aria-controls')).contains(within(sidebar).getByRole('button', { name: 'Destacats' }))).toBe(true);

  /* La comunitat: avatar QUADRAT i nom, i porta a la seua fitxa. */
  const soc = within(sidebar).getByRole('button', { name: 'Sóc de Poble' });
  expect(soc.classList.contains('sdp-workspace-nav-item')).toBe(true);
  expect(soc.querySelector('.sdp-workspace-nav-item__icon .sdp-avatar--xs.sdp-xat-avatar--quadrat')).toBeTruthy();
  fireEvent.click(soc);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?comunitat=c-1');

  /* Plegar «Més» amaga Destacats (fora del lector i del focus) i es recorda. */
  fireEvent.click(mes);
  expect(mes.getAttribute('aria-expanded')).toBe('false');
  expect(within(sidebar).queryByRole('button', { name: 'Destacats' })).toBeNull();
  expect(getVal('sdp-xat-rail-mes')).toBe('plegat');
  fireEvent.click(comunitats);
  expect(within(sidebar).queryByRole('button', { name: 'Sóc de Poble' })).toBeNull();
  expect(getVal('sdp-xat-rail-comunitats')).toBe('plegat');

  view.unmount();
  render(<XatSection />);
  const sidebar2 = document.getElementById('app-grid-sidebar');
  expect(within(sidebar2).getByRole('button', { name: 'Secció Més' }).getAttribute('aria-expanded')).toBe('false');
  expect(within(sidebar2).getByRole('button', { name: 'Secció Comunitats' }).getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(within(sidebar2).getByRole('button', { name: 'Secció Més' }));
  expect(within(sidebar2).getByRole('button', { name: 'Destacats' })).toBeTruthy();
  expect(getVal('sdp-xat-rail-mes')).toBe('obert');
}));

test('3B · rail desplegat: el peu fix porta l’avatar propi, «Tu» i el llapis «Edita el perfil»', () => ambRailObert(() => {
  mocks.threadId = null;
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const peu = sidebar.querySelector('.sdp-xat-rail-peu');
  expect(peu.closest('nav')).toBeNull();
  expect(peu.querySelector('.sdp-avatar--xs').getAttribute('title')).toBe('Javi');
  expect(within(peu).getByText('Tu')).toBeTruthy();
  const llapis = within(peu).getByRole('button', { name: 'Edita el perfil' });
  expect(llapis.querySelector('svg.lucide-pencil')).toBeTruthy();
  fireEvent.click(llapis);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil');
}));

test('3B · amb la fitxa oberta, la comunitat del rail marca la pàgina i «Xats» no', () => ambRailObert(() => {
  mocks.threadId = null;
  ambComunitat();
  mocks.params = new URLSearchParams({ comunitat: 'c-1' });
  render(<XatSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  const actius = within(sidebar).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
  expect(actius).toEqual([within(sidebar).getByRole('button', { name: 'Sóc de Poble' })]);
  /* Ja oberta, tornar-la a prémer no afig historial. */
  fireEvent.click(actius[0]);
  expect(mocks.navigate).not.toHaveBeenCalled();
}));

test('3B · ?vista=comunitats: títol amb «+» honest, cada comunitat amb Avisos primer, els grups i «Veure-ho tot»', () => {
  mocks.threadId = null;
  ambComunitat();
  mocks.params = new URLSearchParams({ vista: 'comunitats' });
  render(<XatSection />);
  const columna = document.getElementById('app-grid-list');
  expect(screen.getByRole('complementary', { name: 'Comunitats' })).toBeTruthy();
  /* Ni la cerca de la llista ni la llista de converses. */
  expect(within(columna).queryByRole('searchbox')).toBeNull();
  expect(within(columna).queryByRole('list', { name: 'Converses' })).toBeNull();

  const bloc = within(columna).getByRole('region', { name: 'Sóc de Poble' });
  /* L'avatar de la capçalera és quadrat i net: sense les targetes apilades
     de la fila de la llista de Xats (captura 19.41.43). */
  const capBloc = within(bloc).getByRole('heading', { name: 'Sóc de Poble' });
  expect(capBloc.querySelector('.sdp-xat-avatar--quadrat')).toBeTruthy();
  expect(capBloc.querySelector('.sdp-xat-apilat')).toBeNull();
  const files = within(bloc).getAllByRole('button').filter((b) => b.classList.contains('sdp-xat-fila'));
  expect(files.map((b) => b.querySelector('.sdp-xat-fila__nom').firstChild.textContent)).toEqual(['Avisos', 'General']);
  expect(files[0].querySelector('svg.lucide-megaphone')).toBeTruthy();
  expect(within(files[1]).getByText('Pep: Hola a tots')).toBeTruthy();
  expect(files[1].querySelector('time')).toBeTruthy();

  fireEvent.click(files[0]);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/a-1?vista=comunitats');
  fireEvent.click(within(bloc).getByRole('button', { name: 'Veure-ho tot de Sóc de Poble' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?comunitat=c-1&vista=comunitats');
  fireEvent.click(within(columna).getByRole('button', { name: 'Nova comunitat' }));
  expect(mocks.showToast).toHaveBeenLastCalledWith(expect.stringContaining("naixen de la Pàgina Universal d'una entitat o d'un poble"), 'info');

  /* La dreta, l'estat buit de sempre. */
  expect(document.getElementById('app-grid-main').querySelector('[data-testid="document-per-defecte"]')).toBeTruthy();
  /* I el rail marca «Comunitats». */
  expect(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Comunitats' }).getAttribute('aria-current')).toBe('page');
});

test('3B · ?vista=comunitats sense cap comunitat diu d’on naixen', () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ vista: 'comunitats' });
  render(<XatSection />);
  const estat = within(document.getElementById('app-grid-list')).getByRole('status');
  expect(estat.textContent).toContain('Encara no formes part de cap comunitat');
  expect(estat.textContent).toContain('Pàgina Universal');
});

test('3B · una conversa oberta des de la vista de comunitats la conserva i la fletxa hi torna', async () => {
  ambComunitat();
  mocks.amplada = 375;
  mocks.threadId = 'g-1';
  mocks.params = new URLSearchParams({ vista: 'comunitats' });
  render(<XatSection />);
  await waitFor(() => expect(document.getElementById('app-grid-main').getAttribute('data-obert')).toBe('true'));
  fireEvent.click(screen.getByRole('button', { name: 'Torna a la llista' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=comunitats');
});

/* D17 (ordre del Mestre, 260930): Telefonades porta el seu avís propi, al cos
   i al toast dels controls inerts; Destacats, el genèric i el toast «En
   construcció». Contingut multimèdia ja no és a esta llista: derogat per
   l'ordre del Mestre del 261004 (prompt 261004_0515); és operativa i les
   seues proves són les de «T5 · ?vista=multimedia» de baix. */
const AVIS_D17 = 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.';
test.each([
  ['telefonades', 'Telefonades', 'lucide-phone', AVIS_D17, AVIS_D17],
  ['destacats', 'Destacats', 'lucide-star', 'Encara no està disponible', 'En construcció']
])('3B · ?vista=%s: fila de títol de la captura, controls inerts que avisen i la dreta buida', (vista, titol, icona, avis, toast) => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ vista });
  render(<XatSection />);
  const columna = screen.getByRole('complementary', { name: titol });
  const capcalera = columna.querySelector('.app-grid-col-header');
  expect(within(capcalera).getByText(titol)).toBeTruthy();
  expect(capcalera.querySelector(`svg.${icona}`)).toBeTruthy();
  const cos = within(columna).getByRole('region', { name: 'En construcció' });
  expect(cos.textContent).toContain(avis);
  /* Cap control fa res: aria-disabled i, en prémer-los, el toast. */
  const inerts = [...columna.querySelectorAll('[aria-disabled="true"]')];
  expect(inerts.length).toBeGreaterThan(0);
  for (const control of inerts) {
    mocks.showToast.mockClear();
    fireEvent.click(control);
    expect(mocks.showToast).toHaveBeenCalledWith(toast, 'info');
  }
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(document.getElementById('app-grid-main').querySelector('[data-testid="document-per-defecte"]')).toBeTruthy();
  expect(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: titol }).getAttribute('aria-current')).toBe('page');
});

test('D17 · ?vista=telefonades: el «+», el cercador i la targeta diuen el text del projecte lliure CC, no l’avís genèric', () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ vista: 'telefonades' });
  render(<XatSection />);
  const columna = screen.getByRole('complementary', { name: 'Telefonades' });
  const targeta = within(columna).getByRole('region', { name: 'En construcció' });
  expect(targeta.querySelector('.sdp-xat-construccio__avis').textContent).toBe(AVIS_D17);
  expect(targeta.textContent).not.toContain('Encara no està disponible');
  fireEvent.click(within(columna).getByRole('button', { name: 'Nova telefonada' }));
  expect(mocks.showToast).toHaveBeenLastCalledWith(AVIS_D17, 'info');
  fireEvent.click(within(columna).getByRole('searchbox', { name: "Nom, número o @nom d'usuari" }));
  expect(mocks.showToast).toHaveBeenLastCalledWith(AVIS_D17, 'info');
  expect(mocks.showToast).not.toHaveBeenCalledWith('En construcció', 'info');
});

test('3B · cada vista porta els controls de la seua captura', () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ vista: 'telefonades' });
  const view = render(<XatSection />);
  const tel = () => screen.getByRole('complementary', { name: 'Telefonades' });
  expect(within(tel()).getByRole('button', { name: 'Nova telefonada' }).classList.contains('sdp-xat-nova')).toBe(true);
  expect(within(tel()).getByRole('searchbox', { name: "Nom, número o @nom d'usuari" }).readOnly).toBe(true);

  mocks.params = new URLSearchParams({ vista: 'multimedia' });
  view.rerender(<XatSection />);
  const mm = screen.getByRole('complementary', { name: 'Contingut multimèdia' });
  /* Captura 19.41.58: la cerca és una lupa a la fila de títol, amb ordenar i
     seleccionar; cap cercador en píndola. */
  expect(within(mm).queryByRole('searchbox')).toBeNull();
  expect(within(mm.querySelector('.app-grid-col-header')).getAllByRole('button').map((b) => b.getAttribute('aria-label')))
    .toEqual(['Cerca', 'Ordena', 'Selecciona']);
  expect(within(mm).getByText('Contingut multimèdia de totes les converses')).toBeTruthy();
  const segments = within(mm).getByRole('group', { name: 'Tipus de contingut' });
  expect(within(segments).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')]))
    .toEqual([['Fitxers', 'true'], ['Enllaços', 'false'], ['Documents', 'false']]);
  /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515): els
     segments ja no són inerts. Un clic canvia la pestanya, sense toast. */
  expect(within(segments).getAllByRole('button').some((b) => b.hasAttribute('aria-disabled'))).toBe(false);
  fireEvent.click(within(segments).getByRole('button', { name: 'Enllaços' }));
  expect(within(segments).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')]))
    .toEqual([['Fitxers', 'false'], ['Enllaços', 'true'], ['Documents', 'false']]);
  expect(mocks.showToast).not.toHaveBeenCalled();

  mocks.params = new URLSearchParams({ vista: 'destacats' });
  view.rerender(<XatSection />);
  const dest = screen.getByRole('complementary', { name: 'Destacats' });
  expect(within(dest).getByRole('button', { name: 'Editar' }).classList.contains('sdp-xat-vista__pindola')).toBe(true);
  expect(within(dest).getByRole('searchbox', { name: 'Cerca' }).getAttribute('aria-disabled')).toBe('true');
});

/* Ordre del Mestre del 261004 (prompt 261004_0515, T5) · Contingut multimèdia
   operativa: els enllaços dels missatges carregats (getThreadMessages), el
   botó germà obri la conversa i conserva la vista, la fletxa hi torna, i
   Fitxers diu que els adjunts arriben amb F1. La lupa, Ordena i Selecciona
   continuen dient «En construcció». */
test('T5 · ?vista=multimedia: Enllaços amb dades reals, i el botó de la conversa conserva la vista', () => {
  mocks.threadId = null;
  mocks.params = new URLSearchParams({ vista: 'multimedia' });
  mocks.threads = [filsDeMostra()[0]];
  mocks.messages = [
    { id: '1', seq: 1, text: 'El programa: https://socdepoble.org/festes', sender: 'other', author: 'Veí', creatAl: fa(1) },
    { id: '2', seq: 2, text: 'Compte: http://xn--pple-43d.com/entra', sender: 'other', author: 'Veí', creatAl: fa(0) }
  ];
  render(<XatSection />);
  const columna = screen.getByRole('complementary', { name: 'Contingut multimèdia' });
  /* Verificació «xat» (261004) · La fila de títol que munta XatSection, com feia la fila
     `multimedia` del test.each de 3B abans de T5: el títol i la seua icona (Image de lucide,
     l'entrada del rail a ClosCaXat), dins del plec del títol i no entre les accions. */
  const capcalera = columna.querySelector('.app-grid-col-header');
  expect(capcalera.querySelector('.app-grid-col-header__titol').textContent).toBe('Contingut multimèdia');
  expect(capcalera.querySelectorAll('.app-grid-col-header__plec svg.lucide-image')).toHaveLength(1);
  expect(capcalera.querySelector('.app-grid-col-header__accions svg.lucide-image')).toBeNull();
  /* Fitxers, per defecte: F0 només envia text. */
  expect(within(columna).getByRole('region', { name: 'En construcció' }).textContent).toContain('Els adjunts arriben amb la fase F1 del xat');
  expect(within(columna).getByText('Només es veu el contingut de les converses obertes en esta sessió.')).toBeTruthy();

  fireEvent.click(within(columna).getByRole('button', { name: 'Enllaços' }));
  const enllacos = within(columna).getAllByRole('link');
  expect(enllacos.map((a) => [a.getAttribute('href'), a.getAttribute('rel'), a.getAttribute('target')])).toEqual([
    ['http://xn--pple-43d.com/entra', 'noopener noreferrer', '_blank'],
    ['https://socdepoble.org/festes', 'noopener noreferrer', '_blank']
  ]);
  expect(enllacos.every((a) => a.closest('button') === null)).toBe(true);
  expect(within(columna).getByRole('note').textContent).toContain('xn--pple-43d.com');

  /* Revisió 261004 (Relleus 4-12) · El nom accessible conté el que es veu:
     la conversa, qui l'ha compartit i l'hora (WCAG 2.5.3). */
  const [obri] = within(columna).getAllByRole('button', { name: /^Obri la conversa de Conversa · Veí \S/ });
  fireEvent.click(obri);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/a?vista=multimedia');
  expect(mocks.showToast).not.toHaveBeenCalled();

  /* La lupa encara no fa res, i ho diu. */
  fireEvent.click(within(columna.querySelector('.app-grid-col-header')).getByRole('button', { name: 'Cerca' }));
  expect(mocks.showToast).toHaveBeenLastCalledWith('En construcció', 'info');
  /* La dreta, el document per defecte; el rail marca la vista. */
  expect(document.getElementById('app-grid-main').querySelector('[data-testid="document-per-defecte"]')).toBeTruthy();
  expect(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Contingut multimèdia' }).getAttribute('aria-current')).toBe('page');
});

test('T5 · en estret, la conversa oberta des de Contingut multimèdia ve a pantalla i la fletxa torna a la vista', async () => {
  mocks.amplada = 375;
  mocks.threadId = 'a';
  mocks.params = new URLSearchParams({ vista: 'multimedia' });
  render(<XatSection />);
  await waitFor(() => expect(document.getElementById('app-grid-main').getAttribute('data-obert')).toBe('true'));
  fireEvent.click(screen.getByRole('button', { name: 'Torna a la llista' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=multimedia');
});

test('T5 · al Control del xat, «Multimèdia, enllaços i documents» porta a la vista nova', () => {
  render(<XatControlSection />);
  fireEvent.click(screen.getByRole('button', { name: /Multimèdia, enllaços i documents/ }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=multimedia');
  /* No s'obri cap panell «pendent» a la dreta. */
  expect(screen.queryByText(/Esta opció encara no està disponible/)).toBeNull();
  /* Les altres opcions continuen obrint-se a la dreta. */
  fireEvent.click(screen.getByRole('button', { name: /Missatges temporals/ }));
  expect(screen.getByRole('heading', { level: 2, name: 'Missatges temporals' })).toBeTruthy();
});

test('3B · entrar en una vista deixa la cerca; una vista desconeguda és la llista de sempre', () => {
  mocks.threadId = null;
  const view = render(<XatSection />);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Cerca converses' }), { target: { value: 'Hola' } });
  mocks.params = new URLSearchParams({ vista: 'telefonades' });
  view.rerender(<XatSection />);
  mocks.params = new URLSearchParams({ vista: 'no-existix' });
  view.rerender(<XatSection />);
  expect(screen.getByRole('searchbox', { name: 'Cerca converses' }).value).toBe('');
  expect(screen.getByRole('list', { name: 'Converses' })).toBeTruthy();
  expect(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Xats' }).getAttribute('aria-current')).toBe('page');
});

/* D16: «Novetats» (el commutador) és amagada; al Control del xat cap entrada
   visible del rail marca la pàgina, i el rail continua portant a les vistes. */
test('3B · des del Control del xat, el rail porta a les vistes i cap entrada no marca la pàgina (Novetats amagada)', () => {
  render(<XatControlSection />);
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(within(sidebar).queryByRole('button', { name: 'Novetats' })).toBeNull();
  expect(within(sidebar).getAllByRole('button').filter((b) => b.hasAttribute('aria-current'))).toEqual([]);
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Comunitats' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=comunitats');
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Xats' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
});

/* ═══ Onada 3B · segona passada (revisió adversarial) ═══════════════════ */

/* Un encaminador mínim per a les proves de focus: navigate (el mock) canvia
   la consulta i la ruta dins del MATEIX lot que el clic, com el router de
   l'app (un setState en el gestor del clic). Així el tancament del panell i
   el canvi de vista arriben en un sol render, que és quan el BotoObriRail
   vell es desmunta sense poder tornar el focus. /control-xat munta el
   Control del xat; /xat, el Xat; qualsevol altra (el perfil), res. */
const encaminador = { ves: null };
function Encaminador({ inicial }) {
  const [ruta, setRuta] = useState(inicial);
  encaminador.ves = setRuta;
  if (ruta.startsWith('/control-xat')) return <XatControlSection />;
  return ruta.startsWith('/xat') ? <XatSection /> : null;
}
function ambEncaminador() {
  mocks.navigate.mockImplementation((ruta) => {
    const [cami, consulta = ''] = String(ruta).split('?');
    mocks.params = new URLSearchParams(consulta);
    mocks.threadId = cami.startsWith('/xat/') ? decodeURIComponent(cami.slice('/xat/'.length)) : null;
    encaminador.ves?.(String(ruta));
  });
}

/* Fora d'ample, triar al rail una vista o una comunitat canvia la fila de
   títol de la columna central (un altre component): el BotoObriRail vell es
   desmunta i el nou naix amb el panell ja tancat. El focus no es pot quedar
   al rail, que passa a `inert` (en un navegador cauria a <body>): torna al
   botó nou. Sense la marca de retorn, es quedava a l'entrada del rail. */
test.each([
  ['estret', 375, 'Telefonades'],
  ['estret', 375, 'Sóc de Poble'],
  ['mitjà', 820, 'Comunitats'],
  ['mitjà', 820, 'Sóc de Poble']
])('3B · en %s (%i px), triar «%s» al rail torna el focus al botó del rail de la fila de títol nova', async (_, amplada, nom) => {
  mocks.amplada = amplada;
  mocks.threadId = null;
  ambComunitat();
  ambEncaminador();
  render(<Encaminador inicial="/xat" />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-layout')).toBe(amplada === 375 ? 'estret' : 'mitja'));
  if (amplada === 375) await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  const botoVell = document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail');
  fireEvent.click(botoVell);
  expect(closca.getAttribute('data-panell')).toBe('left');
  const entrada = within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: nom });
  entrada.focus();
  fireEvent.click(entrada);
  const botoNou = document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail');
  /* La fila de títol és una altra (la vista o la fitxa): el botó és nou. */
  expect(botoVell.isConnected).toBe(false);
  expect(botoNou).toBeTruthy();
  expect(document.activeElement).toBe(botoNou);
  expect(botoNou.getAttribute('aria-expanded')).toBe('false');
});

/* Passar del Control del xat al Xat (o a l'inrevés) munta una closca nova:
   el botó del rail de la closca nova també recull el focus. */
test.each([[375], [820]])('3B · amplada %i: des del Control del xat, una vista del rail munta el Xat i el focus torna al botó del rail', async (amplada) => {
  mocks.amplada = amplada;
  mocks.threadId = null;
  ambComunitat();
  ambEncaminador();
  render(<Encaminador inicial="/control-xat" />);
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-layout')).toBe(amplada === 375 ? 'estret' : 'mitja'));
  if (amplada === 375) await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  fireEvent.click(document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail'));
  const entrada = within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Comunitats' });
  entrada.focus();
  fireEvent.click(entrada);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=comunitats');
  expect(screen.getByRole('complementary', { name: 'Comunitats' })).toBeTruthy();
  await waitFor(() => expect(document.activeElement).toBe(document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail')));
});

/* El perfil ix del Xat: no deixa cap marca de retorn, que robaria el focus
   al botó del rail en tornar a muntar el Xat. */
test('3B · en estret, «Edita el perfil» ix del Xat sense deixar cap retorn de focus pendent', async () => {
  mocks.amplada = 375;
  mocks.threadId = null;
  ambEncaminador();
  render(<Encaminador inicial="/xat" />);
  await waitFor(() => expect(document.querySelector('.app-grid-shell').getAttribute('data-panell')).toBe('middle'));
  fireEvent.click(document.getElementById('app-grid-list').querySelector('.sdp-xat-obri-rail'));
  fireEvent.click(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Edita el perfil' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil');
  expect(document.querySelector('.app-grid-shell')).toBeNull();
  expect(document.activeElement).toBe(document.body);
  act(() => encaminador.ves('/xat'));
  await waitFor(() => expect(document.querySelector('.app-grid-shell').getAttribute('data-panell')).toBe('middle'));
  expect(document.activeElement).toBe(document.body);
});

test('3B · «Veure-ho tot» obri la fitxa conservant la vista; la fitxa i la seua fletxa hi tornen, i el focus també', () => {
  mocks.threadId = null;
  ambComunitat();
  mocks.params = new URLSearchParams({ vista: 'comunitats' });
  const view = render(<XatSection />);
  const tot = screen.getByRole('button', { name: 'Veure-ho tot de Sóc de Poble' });
  tot.focus();
  fireEvent.click(tot);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?comunitat=c-1&vista=comunitats');

  /* La fitxa mana sobre la vista; el focus passa a la seua fletxa i el rail
     marca la comunitat. */
  mocks.params = new URLSearchParams({ comunitat: 'c-1', vista: 'comunitats' });
  view.rerender(<XatSection />);
  const torna = screen.getByRole('button', { name: 'Torna a les converses' });
  expect(document.activeElement).toBe(torna);
  const sidebar = document.getElementById('app-grid-sidebar');
  expect(within(sidebar).getByRole('button', { name: 'Sóc de Poble' }).getAttribute('aria-current')).toBe('page');

  /* Un grup obert des de la fitxa conserva la fitxa i la vista d'origen. */
  fireEvent.click(screen.getByText('Pep: Hola a tots').closest('button'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/g-1?comunitat=c-1&vista=comunitats');

  /* La fletxa de la fitxa torna a la vista, amb el focus al seu «Veure-ho tot». */
  fireEvent.click(torna);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=comunitats');
  mocks.params = new URLSearchParams({ vista: 'comunitats' });
  view.rerender(<XatSection />);
  expect(screen.getByRole('complementary', { name: 'Comunitats' })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Veure-ho tot de Sóc de Poble' }));
  expect(within(sidebar).getByRole('button', { name: 'Comunitats' }).getAttribute('aria-current')).toBe('page');
});

test('3B · sense vista d’origen, la fletxa de la fitxa continua tornant a la llista de converses', () => {
  mocks.threadId = null;
  ambComunitat();
  mocks.params = new URLSearchParams({ comunitat: 'c-1' });
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Torna a les converses' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat');
});

test('3B · en estret, la fletxa d’una conversa oberta des de la fitxa torna a la fitxa i conserva la vista', async () => {
  ambComunitat();
  mocks.amplada = 375;
  mocks.threadId = 'g-1';
  mocks.params = new URLSearchParams({ comunitat: 'c-1', vista: 'comunitats' });
  render(<XatSection />);
  await waitFor(() => expect(document.getElementById('app-grid-main').getAttribute('data-obert')).toBe('true'));
  fireEvent.click(screen.getByRole('button', { name: 'Torna a la llista' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?comunitat=c-1&vista=comunitats');
});

/* Torn 260930 (T1 · la conversa amb el patró de missatgeria) · De punta a
   punta pel Xat: «Respon» al menú d'una bombolla, la barra damunt del camp i
   sendChatMessage del context amb { respostaA }. La resta del detall (grups,
   no llegits, scroll, cites, esborranys) es prova a Conversa.test.jsx. */
test('T1 · respondre a un missatge envia amb respostaA pel context i buida la barra', async () => {
  render(<XatSection />);
  const segon = document.querySelector('[data-missatge="2"]');
  fireEvent.click(within(segon).getByRole('button', { name: 'Opcions del missatge' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Respon' }));
  expect(screen.getByRole('group', { name: 'Resposta a Veí' })).toBeTruthy();
  const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
  expect(document.activeElement).toBe(camp);
  fireEvent.change(camp, { target: { value: 'D’acord' } });
  fireEvent.keyDown(camp, { key: 'Enter' });
  await waitFor(() => expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), 'D’acord', { respostaA: '2' }));
  expect(screen.queryByRole('group', { name: 'Resposta a Veí' })).toBeNull();
});

/* Ordre del Mestre (261007) · Les files d'ajuda per defecte (perDefecte,
   data/xatsPerDefecte.js): en remot, «Sóc de Poble» i la «IAIA MarIA» són a
   la cua de la llista de tothom. No són converses: ni obriFil ni Conversa;
   /xat/sdp-per-defecte:<clau> porta al xat real, una sola vegada. */
function ambFilesPerDefecte() {
  mocks.threads = [...filsDeMostra(), ...ambXatsPerDefecte([]).map((f) => mapejaFil(f))];
}
/* Onada 6 · Només les files: el peu («Informa d'un error») no és cap conversa. */
const textosDeLaLlista = () => within(screen.getByRole('list', { name: 'Converses' }))
  .getAllByRole('button').filter((b) => !b.closest('.sdp-xat-llista__peu')).map((b) => b.textContent);

/* Gauntlet 261016 (Bloc 3.6) · Les quatre converses de l'ordre del Mestre:
   «Gent de la Torre» al capdamunt (sense amfitrió, el poble de la llavor) i,
   a la cua, Sóc de Poble, Javi Llinares i la IAIA. Abans eren dues files a la
   cua i cap fila de poble: s'actualitza a posta.
   Gauntlet 261016_1530 (Bloc 3.6, ordre vigent) · Els quatre actors DALT DE
   TOT i en este ordre: la comunitat de Sóc de Poble, Javi, Gent de la Torre i
   la IAIA; la resta, darrere. Fora la fila directa sintètica de Sóc de Poble.
   En remot la comunitat té una fila que hi porta quan el backend ja ha donat
   l'id de l'entitat pilot (actorsDelXat.js); sense, cap. S'actualitza a posta. */
test('261007 · les files d’ajuda (Javi i la IAIA) van amb els actors, al capdamunt, amb «Cap missatge.» i sense marca de fixades', () => {
  mocks.threadId = null;
  ambFilesPerDefecte();
  render(<XatSection />);
  const files = textosDeLaLlista();
  expect(files).toHaveLength(5);
  expect(files[0]).toContain('Javi Llinares');
  expect(files[1]).toContain('Gent de la Torre');
  expect(files[2]).toContain('IAIA MarIA');
  expect(files[3]).toContain('Hola');
  expect(files[4]).toContain('Adeu');
  expect(files.some((text) => text.includes('Sóc de Poble'))).toBe(false);
  for (const text of [files[0], files[2]]) {
    expect(text).toContain('Cap missatge.');
    expect(text).not.toContain('Fixada');
  }
});

test('261016_1530 · amb l’id remot de l’entitat pilot, la fila que porta a la comunitat de Sóc de Poble va la primera i fa el camí del «Comentar», mai «En privat»', () => {
  registraEntitatDelProjecte({ tipus: 'entitat', id: '7d1e5c2a-0000-4000-8000-0000000000aa', slug: 'socdepoble' });
  try {
    mocks.threadId = null;
    ambFilesPerDefecte();
    render(<XatSection />);
    const files = textosDeLaLlista();
    expect(files).toHaveLength(6);
    expect(files[0]).toContain('Sóc de Poble, Comunitat');
    expect(files[0]).toContain('Avisos, General');
    expect(files[1]).toContain('Javi Llinares');
    expect(files[2]).toContain('Gent de la Torre');
    expect(files[3]).toContain('IAIA MarIA');
    fireEvent.click(screen.getByText('Sóc de Poble').closest('button'));
    expect(mocks.navigate).toHaveBeenLastCalledWith(RUTA_SOBRE_DE_SOC_DE_POBLE);
    expect(mocks.navigate.mock.calls.some(([ruta]) => String(ruta).startsWith('/xat?amb='))).toBe(false);
    expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:socdepoble');
  } finally {
    oblidaEntitatDelProjecte();
  }
});

test('261007 · /xat/sdp-per-defecte:iaia porta al xat públic de /iaia una sola vegada, també en StrictMode', () => {
  mocks.threadId = 'sdp-per-defecte:iaia';
  ambFilesPerDefecte();
  const view = render(<StrictMode><XatSection /></StrictMode>);
  const cap = mocks.navigate.mock.calls.filter(([ruta]) => ruta === RUTA_XAT_DE_LA_IAIA);
  expect(cap).toEqual([[RUTA_XAT_DE_LA_IAIA, { replace: true }]]);
  const url = new URL(RUTA_XAT_DE_LA_IAIA, 'http://localhost');
  expect(RUTA_XAT_DE_LA_IAIA.startsWith('/xat?sobre=pagina:%2Fiaia&titol=')).toBe(true);
  expect(RUTA_XAT_DE_LA_IAIA.endsWith('&ruta=%2Fiaia')).toBe(true);
  expect(Object.fromEntries(url.searchParams)).toEqual({ sobre: 'pagina:/iaia', titol: "L'ànima de la iaia", ruta: '/iaia' });
  expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:iaia');
  expect(screen.queryByRole('textbox', { name: 'Escriu un missatge' })).toBeNull();
  /* Un altre pintat sense navegar no hi torna; una navegació nova (la
     persona torna a prémer la fila), sí. */
  view.rerender(<StrictMode><XatSection /></StrictMode>);
  expect(mocks.navigate.mock.calls.filter(([ruta]) => ruta === RUTA_XAT_DE_LA_IAIA)).toHaveLength(1);
  mocks.params = new URLSearchParams();
  view.rerender(<StrictMode><XatSection /></StrictMode>);
  expect(mocks.navigate.mock.calls.filter(([ruta]) => ruta === RUTA_XAT_DE_LA_IAIA)).toHaveLength(2);
});

test('261007 · un id sintètic no s’obri mai com a fil, ni abans que arribe la llista', () => {
  mocks.threadId = 'sdp-per-defecte:socdepoble';
  mocks.threads = filsDeMostra();
  render(<XatSection />);
  expect(mocks.openThread).not.toHaveBeenCalledWith('sdp-per-defecte:socdepoble');
  expect(mocks.openThread).toHaveBeenCalledWith(null);
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('261007 · en «Seleccionar xats» les files d’ajuda no es poden triar', () => {
  mocks.threadId = null;
  ambFilesPerDefecte();
  render(<XatSection />);
  fireEvent.click(screen.getByRole('button', { name: 'Més opcions' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Seleccionar xats' }));
  const caselles = within(screen.getByRole('list', { name: 'Converses' })).getAllByRole('checkbox');
  expect(caselles).toHaveLength(2);
  expect(caselles.some((c) => /Sóc de Poble|IAIA MarIA/.test(c.textContent))).toBe(false);
});

/* Auditoria 261007 (B) · En eixir del Xat el fil es tanca: el canal i el
   sondeig del fil no continuen a la resta de l'app. Entre dos fils, l'últim
   que es demana és el nou, mai el null de la neteja. */
test('261007 (B) · eixir del Xat tanca el fil obert; canviar de fil obri el nou en últim lloc', () => {
  const view = render(<StrictMode><XatSection /></StrictMode>);
  expect(mocks.openThread).toHaveBeenLastCalledWith('a');
  mocks.threadId = 'b';
  view.rerender(<StrictMode><XatSection /></StrictMode>);
  expect(mocks.openThread).toHaveBeenLastCalledWith('b');
  view.unmount();
  expect(mocks.openThread).toHaveBeenLastCalledWith(null);
});
