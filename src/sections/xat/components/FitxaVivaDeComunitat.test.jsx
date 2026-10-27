/**
 * Pla 261027_0845 (Guarda Nocturna), P1-55 · «Pàgina viva de comunitat»
 * (Llibre Mestre, Fita 19) · La pàgina que la columna dreta del Xat pinta
 * amb una comunitat oberta: la fitxa pública d'una entitat o la pàgina d'un
 * poble, amb les peces de veres (usePerfilPublic, FitxaPublica,
 * VistaDelPoble, fitxaDelSubjecte) i només les vores doblades (els
 * proveïdors, el port, el host i la UniversalPage, que pinta el títol i el
 * cos). El SEO passa pel seoHead de veres: `document.title` diu qui guanya.
 */
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: vi.fn(() => ({})),
  seo: vi.fn(),
  load: vi.fn(),
  pagines: [],
  t: (_, alternativa) => alternativa,
  /* Objectes estables: un `externalConfig` nou a cada pintat tornaria a
     llançar la càrrega de la fitxa (és dels deps del seu efecte). */
  ui: { externalConfig: { manageDocumentHead: true }, locale: 'ca-ES' },
  core: { towns: [], status: 'ready', pageCopy: {} },
  mur: { events: [], feedPosts: [], marketItems: [], status: 'ready' },
  media: { mediaItems: [], status: 'ready' },
  identitat: { memberships: [], actor: null, setActor: vi.fn() },
  xat: { senseSessio: false }
}));

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return {
    /* La pàgina viva no llig la ruta: si algú crida useParams, la prova ho veu. */
    useParams: () => mocks.params(),
    useNavigate: () => mocks.navigate,
    useLocation: () => ({ pathname: '/xat', search: '?comunitat=c-1', hash: '' }),
    useRouter: () => ({ basename: '', navigate: mocks.navigate, currentPath: '/xat' }),
    Link: ({ to, children, ...resta }) => createElement('a', { href: to, ...resta }, children),
    Navigate: () => null
  };
});
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: (valor) => valor }),
  useUIState: () => mocks.ui
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../../notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [], status: 'ready' }) }));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => capacitat === 'directori',
  loadPerfilPublic: (...args) => mocks.load(...args)
}));
vi.mock('../../../host.js', () => ({ quanLlest: async () => {} }));
/* Anota cada crida i passa pel seoHead real. */
vi.mock('../../../hooks/useSEO', async (importOriginal) => {
  const real = await importOriginal();
  return { useSEO: (opcions) => { mocks.seo(opcions); return real.useSEO(opcions); } };
});
vi.mock('../../../components/universal/UniversalPage', async () => {
  const { createElement } = await import('react');
  return {
    UniversalPage: (props) => {
      mocks.pagines.push(props);
      return createElement('article', { 'data-testid': 'pagina-viva', 'data-chrome': props.chrome },
        createElement('h1', null, props.title), props.children);
    }
  };
});
/* El panell de publicacions del poble (diferit) té les seues proves. */
vi.mock('../../pobles/PublicacionsDelPoble.jsx', async () => {
  const { createElement } = await import('react');
  return { default: () => createElement('p', null, 'Publicacions del poble') };
});

import { useSEO } from '../../../hooks/useSEO';
import { oblidaEntitatDelProjecte } from '../../../config/navigation.js';
import FitxaVivaDeComunitat from './FitxaVivaDeComunitat.jsx';

const UUID_DEL_POBLE = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const TORRE = {
  id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', author: 'Gent de la Torre',
  content: 'La Torre de les Maçanes és un municipi de l’Alacantí.', provincia: 'Alacant', comarca: 'l’Alacantí',
  image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg'
};
const SELLA = { id: 'sella', title: 'Sella', author: 'Gent de Sella', content: 'Sella és un municipi de la Marina Baixa.' };
const ENTITAT = {
  tipus: 'entitat', id: 'socdepoble', slug: 'socdepoble', nom: 'Sóc de Poble', avatar: '', hero: '', lema: 'Pobles connectats',
  bio: 'La xarxa dels pobles valencians', presentacioHtml: '<p>Som una xarxa de pobles.</p>', poble: 'La Torre de les Maçanes',
  esIA: false, publicat: true, propietari: false, copyright: '', correu: '', emoticona: ''
};

const comunitatDe = (subjecte, id = 'c-1') => ({ fil: { id, tipus: 'comunitat', name: subjecte.titol, subjecte }, fills: [] });
const entitat = (id = 'socdepoble') => comunitatDe({ tipus: 'entitat', id, ruta: '/socdepoble', titol: 'Sóc de Poble' });
const poble = (id, ruta) => comunitatDe({ tipus: 'poble', id, ruta, titol: 'Gent de la Torre' });
const BUIDA = <p data-testid="columna-buida">El Xat</p>;

/* La columna del Xat: el seu useSEO, com XatWorkspace, i la pàgina viva dins. */
function ColumnaDelXat({ children }) {
  useSEO({ title: 'Xat', description: 'Espai de xat' });
  return children;
}

afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.pagines = [];
  mocks.core = { towns: [TORRE, SELLA], status: 'ready', pageCopy: {} };
  mocks.load.mockImplementation(async (clau) => (clau === 'socdepoble' ? ENTITAT : null));
});

test('una comunitat d’entitat pinta la seua fitxa pública en context, sense cap botó de xat, i la pestanya continua sent la del Xat', async () => {
  render(<ColumnaDelXat><FitxaVivaDeComunitat comunitat={entitat()} senseFitxa={BUIDA} /></ColumnaDelXat>);
  const pagina = await screen.findByTestId('pagina-viva');
  expect(within(pagina).getByRole('heading', { level: 1, name: 'Sóc de Poble' })).toBeTruthy();
  expect(pagina.getAttribute('data-chrome')).toBe('context');
  expect(within(pagina).getByText('Som una xarxa de pobles.')).toBeTruthy();
  /* Ja s'és al Xat: cap «Escriu-li al xat». */
  expect(within(pagina).queryByRole('button', { name: 'Escriu-li al xat' })).toBeNull();
  /* Revisió adversarial P1-55 · Ni «Comentar» a la barra blava (tornava a
     la mateixa comunitat). I el scroll: layout 'contained', el seu
     contenidor ja en fa; cap .sdp-xat-buit al voltant. */
  const props = mocks.pagines.at(-1);
  expect(props.onComment).toBe(false);
  expect(props.layout).toBe('contained');
  expect(pagina.closest('.sdp-xat-buit')).toBeNull();
  expect(mocks.load).toHaveBeenCalledWith('socdepoble', expect.any(Object));
  expect(screen.queryByTestId('columna-buida')).toBeNull();
  /* Cap SEO de la fitxa: només el de la columna, i el títol, el del Xat. */
  expect(mocks.seo.mock.calls.every(([opcions]) => opcions.title === 'Xat')).toBe(true);
  expect(document.title).toBe('Xat | Sóc de Poble');
  expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  expect(mocks.params).not.toHaveBeenCalled();
});

test('una comunitat de poble pinta la pàgina del poble, amb les seues pestanyes i sense el botó blau del xat ni cap SEO propi', async () => {
  render(<ColumnaDelXat><FitxaVivaDeComunitat comunitat={poble(TORRE.id, `/pobles/${TORRE.id}`)} senseFitxa={BUIDA} /></ColumnaDelXat>);
  const pagina = await screen.findByTestId('pagina-viva');
  expect(within(pagina).getByRole('heading', { level: 1, name: 'Gent de la Torre' })).toBeTruthy();
  expect(pagina.getAttribute('data-chrome')).toBe('context');
  const props = mocks.pagines.at(-1);
  expect(props.lead).toBe(TORRE.content);
  expect(props.labels.map((label) => label.text)).toEqual(['Poble', 'Alacant', 'l’Alacantí']);
  expect(props.heroImage).toBe(TORRE.image_url);
  /* Les pestanyes del poble (publicacions i entitats), com a /pobles/<id>. */
  expect(within(pagina).getByRole('tab', { name: 'Gent de la Torre' })).toBeTruthy();
  expect(within(pagina).getByRole('tab', { name: 'Empreses i entitats' })).toBeTruthy();
  expect(await within(pagina).findByText('Publicacions del poble')).toBeTruthy();
  /* Ja s'és al Xat: cap «Parlar amb la Gent de la Torre». */
  expect(within(pagina).queryByText('Parlar amb la Gent de la Torre')).toBeNull();
  expect(within(pagina).queryByRole('link', { name: /Parlar amb/ })).toBeNull();
  /* Revisió adversarial P1-55 · Ni «Comentar» a la barra blava: el xat del
     poble és la mateixa comunitat. */
  expect(props.onComment).toBe(false);
  expect(mocks.seo.mock.calls.every(([opcions]) => opcions.title === 'Xat')).toBe(true);
  expect(document.title).toBe('Xat | Sóc de Poble');
  expect(mocks.params).not.toHaveBeenCalled();
});

/* Revisió adversarial P1-55 (bloquejant) · La pàgina del poble és de layout
   'page' (flex: none): no fa scroll per ella mateixa i la columna dreta
   (overflow: hidden) la tallava davall de la portada. Viu dins de
   .sdp-xat-buit, el contenidor amb scroll del document destacat; l'espera i
   la columna buida no s'hi embolquen (dos contenidors amb scroll l'un dins
   de l'altre deixarien les barres sticky de la columna buida sense pegar).
   Les regles dels fulls d'estil: FitxaVivaDeComunitat.capes.test.js. */
test('la pàgina del poble viu dins del contenidor amb scroll de la columna; l’espera i la columna buida, no', async () => {
  const view = render(<FitxaVivaDeComunitat comunitat={poble(TORRE.id, `/pobles/${TORRE.id}`)} senseFitxa={BUIDA} />);
  const pagina = await screen.findByTestId('pagina-viva');
  expect(pagina.parentElement.className).toBe('sdp-xat-buit');
  expect(mocks.pagines.at(-1).layout).toBeUndefined();
  expect(view.container.querySelectorAll('.sdp-xat-buit')).toHaveLength(1);
  view.unmount();

  const buit = render(<FitxaVivaDeComunitat comunitat={poble('benimantell', '/pobles/benimantell')} senseFitxa={BUIDA} />);
  expect(screen.getByTestId('columna-buida').closest('.sdp-xat-buit')).toBeNull();
  buit.unmount();

  mocks.core = { towns: [], status: 'loading', pageCopy: {} };
  const { container } = render(<FitxaVivaDeComunitat comunitat={poble(TORRE.id, `/pobles/${TORRE.id}`)} senseFitxa={BUIDA} />);
  expect(container.querySelectorAll('.sdp-xat-buit')).toHaveLength(1);
  expect(container.querySelector('.sdp-xat-buit .sdp-xat-buit')).toBeNull();
});

test('la comunitat d’un poble remot es troba per la ruta canònica (/pobles/<slug>) o per l’UUID del servidor', async () => {
  const view = render(<FitxaVivaDeComunitat comunitat={poble(UUID_DEL_POBLE, `/pobles/${TORRE.id}`)} senseFitxa={BUIDA} />);
  expect(within(await screen.findByTestId('pagina-viva')).getByRole('heading', { level: 1, name: 'Gent de la Torre' })).toBeTruthy();
  view.unmount();

  /* Les fitxes del node porten l'UUID com a id i el nom curt com a slug. */
  mocks.core = { towns: [{ ...TORRE, id: UUID_DEL_POBLE, slug: TORRE.id }, SELLA], status: 'ready', pageCopy: {} };
  render(<FitxaVivaDeComunitat comunitat={poble(UUID_DEL_POBLE, null)} senseFitxa={BUIDA} />);
  expect(within(await screen.findByTestId('pagina-viva')).getByRole('heading', { level: 1, name: 'Gent de la Torre' })).toBeTruthy();
  expect(screen.queryByTestId('columna-buida')).toBeNull();
});

test('un poble que no és a les fitxes deixa la columna buida, mai el poble pilot; mentre les fitxes carreguen, l’espera', async () => {
  const view = render(<FitxaVivaDeComunitat comunitat={poble('benimantell', '/pobles/benimantell')} senseFitxa={BUIDA} />);
  expect(screen.getByTestId('columna-buida')).toBeTruthy();
  expect(screen.queryByTestId('pagina-viva')).toBeNull();
  expect(mocks.pagines).toEqual([]);
  view.unmount();

  mocks.core = { towns: [], status: 'loading', pageCopy: {} };
  const { container } = render(<FitxaVivaDeComunitat comunitat={poble(TORRE.id, `/pobles/${TORRE.id}`)} senseFitxa={BUIDA} />);
  expect(container.querySelector('.sdp-xat-buit[aria-busy="true"]')).toBeTruthy();
  expect(screen.queryByTestId('columna-buida')).toBeNull();
});

test('una entitat que no es resol (privada o inexistent) deixa la columna buida; mentre carrega, l’espera', async () => {
  let resol;
  mocks.load.mockImplementation(() => new Promise((r) => { resol = r; }));
  const { container } = render(<FitxaVivaDeComunitat comunitat={entitat('entitat-privada')} senseFitxa={BUIDA} />);
  expect(container.querySelector('.sdp-xat-buit[aria-busy="true"]')).toBeTruthy();
  expect(screen.queryByTestId('columna-buida')).toBeNull();
  await vi.waitFor(() => expect(mocks.load).toHaveBeenCalled());
  await act(async () => { resol(null); });
  expect(await screen.findByTestId('columna-buida')).toBeTruthy();
  expect(screen.queryByTestId('pagina-viva')).toBeNull();
});

test('una clau d’entitat que resol una persona (un àlies de la persona pilot) no en pinta la fitxa: la columna buida', async () => {
  render(<FitxaVivaDeComunitat comunitat={entitat('0001')} senseFitxa={BUIDA} />);
  expect(await screen.findByTestId('columna-buida')).toBeTruthy();
  expect(screen.queryByTestId('pagina-viva')).toBeNull();
});

test('un subjecte que no és ni entitat ni poble, o cap subjecte, deixa la columna buida sense demanar res', () => {
  render(<FitxaVivaDeComunitat comunitat={comunitatDe({ tipus: 'publicacio', id: 'p-1', ruta: '/mur/p-1', titol: 'Festa' })} senseFitxa={BUIDA} />);
  expect(screen.getByTestId('columna-buida')).toBeTruthy();
  cleanup();
  render(<FitxaVivaDeComunitat comunitat={{ fil: { id: 'c-2', tipus: 'comunitat' }, fills: [] }} senseFitxa={BUIDA} />);
  expect(screen.getByTestId('columna-buida')).toBeTruthy();
  expect(mocks.load).not.toHaveBeenCalled();
  expect(mocks.pagines).toEqual([]);
});
