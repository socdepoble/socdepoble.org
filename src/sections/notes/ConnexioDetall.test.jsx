/**
 * T54 · Una connexió del MAS es llig, no s'edita: la pàgina de l'original
 * (o una caiguda amb «Obri l'original»), sense cap editor, sense Connectar i
 * amb Compartir de l'original. Davall, la tira de recopilació.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Objectes i funcions estables (hoisted): cap valor nou a cada render. */
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), pagina: null, user: { id: 'U' }, t: (_, alternativa) => alternativa,
  mur: null, core: { status: 'ready', towns: [] }, media: { status: 'ready', mediaItems: [] },
  identitat: { actor: { tipus: 'persona', id: 'U', nom: 'Pep' } },
  notes: {
    noteFolders: [], setLocalNoteField: vi.fn(), mouNota: vi.fn(), esborraNota: vi.fn(), compartirNota: vi.fn(),
    potEsborrar: true, config: {}
  }
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: mocks.user }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('./NotesContext.jsx', () => ({ useNotes: () => mocks.notes }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
/* La pàgina de veres, però amb les props a la vista (onConnect, onShare, layout). */
vi.mock('../../components/universal/UniversalPage', async (importOriginal) => {
  const real = await importOriginal();
  return { UniversalPage: (props) => { mocks.pagina = props; return React.createElement(real.UniversalPage, props); } };
});
import { ConnexioDetall } from './ConnexioDetall.jsx';
import { PublicacioDetall } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { ERROR_PUBLICAR, ErrorPublicacio } from './visibilitatNota.js';
import { TEXTOS_COMENTAR } from '../../components/PedraSeca/organismes/textosComentar.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';

const SAMARRETA = { id: 'samarreta-socdepoble', title: 'Samarreta', image_url: '/assets/x.png', author_name: 'Sóc de Poble' };
const ORIGEN_MERCAT = {
  tipus: 'connexio', sectionId: 'mercat', itemId: 'samarreta-socdepoble', titol: 'Samarreta', autorNom: 'Sóc de Poble',
  ruta: '/mercat/samarreta-socdepoble', objecte: 'producte'
};
const ORIGEN_PERFIL = {
  tipus: 'connexio', sectionId: 'perfil', itemId: 'u1', titol: 'Pepa Soler', autorTipus: 'persona', ruta: '/gent/u1', objecte: 'persona'
};
const nota = (origen) => ({ id: 'n-9', title: origen.titol, folderId: 'f-connectats', content: '<p>Element connectat.</p>', origen });
const escriu = vi.fn();

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.pagina = null;
  mocks.user = { id: 'U' };
  mocks.mur = { status: 'ready', feedPosts: [], events: [], marketItems: [SAMARRETA] };
  mocks.notes.potEsborrar = true;
  mocks.notes.config = {};
  mocks.notes.compartirNota = vi.fn().mockResolvedValue(true);
  mocks.notes.mouNota.mockResolvedValue(true);
  escriu.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: escriu }, configurable: true });
});

function senseEditor(container) {
  expect(container.querySelector('.sdp-editor-shell-atomic')).toBeNull();
  expect(container.querySelector('[contenteditable]')).toBeNull();
  expect(screen.queryByRole('button', { name: /Emoticona/i })).toBeNull();
  expect(container.querySelector('header.bar-blue .btn-connectar')).toBeNull();
}

test('trobat: la pàgina de l’original (títol i foto), sense editor ni Connectar', () => {
  const { container } = render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  expect(container.querySelector('header.page-title h1').textContent).toBe('Samarreta');
  expect(container.querySelector('.hero-image img').getAttribute('src')).toBe('/assets/x.png');
  expect(mocks.pagina).toMatchObject({ onConnect: false, layout: 'contained', chrome: 'context', heroImage: '/assets/x.png' });
  expect(container.querySelector('.sdp-universal-page-container--contained')).toBeTruthy();
  senseEditor(container);
  // La tira va davall del contingut, dins de la pàgina.
  const tira = screen.getByRole('group', { name: 'Recopilació de la connexió' });
  expect(container.querySelector('article.content-wrapper').lastElementChild).toBe(tira);
  fireEvent.click(screen.getByRole('button', { name: 'Obri l’original' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/mercat/samarreta-socdepoble');
});

/* T63.2 (doctrina del Mestre, 260928) · Comentar una connexió és comentar
   l'ORIGINAL: el seu xat comú (o el directe d'una persona), mai la nota.
   Ordre del Mestre (261007) · «COMENTARIS = XAT» · Comentar obri el menú de
   dues vies: «En públic» és el xat comú de l'original; «En privat», el xat
   amb Sóc de Poble (sense proveïdor, el de la llavor). Sense xat públic,
   «En públic» es queda desactivada i el clic no fa res. */
const destiXat = () => {
  const url = new URL(mocks.navigate.mock.calls.at(-1)[0], 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};
const comentarBarra = (container) => container.querySelector('header.bar-blue .sp-card-actions').children[1];
const PUBLIC = TEXTOS_COMENTAR.public[1];
const PRIVAT = TEXTOS_COMENTAR.privat[1];
/* Obri el menú de Comentar de la barra i en torna la fila de la via. */
function via(container, nom) {
  const boto = comentarBarra(container);
  expect(boto.getAttribute('aria-label')).toBe('Comentar');
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  if (boto.getAttribute('aria-expanded') !== 'true') fireEvent.click(boto);
  return within(container.querySelector('header.bar-blue [role="menu"]')).getByRole('menuitem', { name: nom });
}

test('T63.2 · trobat: «En públic» obri el xat comú de l’original (el producte), no el de la nota', () => {
  window.history.replaceState(null, '', '/notes?nota=n-9');
  const { container } = render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  fireEvent.click(via(container, PUBLIC));
  expect(destiXat()).toEqual({ cami: '/xat', sobre: 'producte:samarreta-socdepoble', titol: 'Samarreta', ruta: '/mercat/samarreta-socdepoble' });
  expect(mocks.navigate.mock.calls.at(-1)[0]).not.toMatch(/nota|n-9/);
  window.history.replaceState(null, '', '/');
});

/* Una persona no té xat públic: «En públic» es queda desactivada.
   Onada 8 (261009; requeriments, punt 3) · Resposta a la pregunta oberta
   («per a una persona, “En privat” ha de ser el directe amb ella?»): sí.
   «En privat» obri el xat amb la persona (/xat?amb=u1), encara que no la
   conegues; abans, el xat amb Sóc de Poble. */
test('T63.2 · caiguda d’un perfil: sense xat públic, «En privat» amb la persona; una pàgina de text, «En públic» al xat de la seua ruta', () => {
  const { container, unmount } = render(<ConnexioDetall nota={nota(ORIGEN_PERFIL)} />);
  const publica = via(container, PUBLIC);
  expect(publica.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(publica);
  expect(mocks.navigate).not.toHaveBeenCalled();
  fireEvent.click(via(container, PRIVAT));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=u1');
  unmount();
  const anima = render(<ConnexioDetall nota={nota(ORIGEN_ANIMA)} />);
  fireEvent.click(via(anima.container, PUBLIC));
  expect(destiXat()).toMatchObject({ cami: '/xat', sobre: 'pagina:/iaia', ruta: '/iaia' });
});

test('T63.2 · una connexió a una nota no té xat comú: cap Comentar a la barra', () => {
  const aNota = { tipus: 'connexio', sectionId: 'notes', itemId: 'n-1', titol: 'Una nota', ruta: '/notes/n-1', objecte: 'nota' };
  const { container } = render(<ConnexioDetall nota={nota(aNota)} />);
  expect(container.querySelector('header.bar-blue [aria-label^="Comentar"]')).toBeNull();
  expect(container.querySelector('header.bar-blue [aria-label="Compartir"]')).not.toBeNull();
});

/* Revisió de T63.2 · Un original sense xat comú (una fitxa de la Wiki, amb
   ?item=, que el contracte no admet): el botó es queda, amb el nom neutre.
   Mai el xat de la nota ni el de la ruta d'on està.
   Ordre del Mestre (261007) · «En públic» es queda desactivada, amb la raó,
   i el clic no navega ni avisa. */
test('T63.2 · un original sense xat comú (la Wiki): Comentar es queda, «En públic» desactivada, i el clic no fa res', () => {
  window.history.replaceState(null, '', '/notes?nota=n-9');
  const wiki = { tipus: 'connexio', sectionId: '', itemId: '/wikidepoble?item=x', ruta: '/wikidepoble?item=x', objecte: 'pagina', titol: 'Una fitxa' };
  const { container } = render(<ConnexioDetall nota={nota(wiki)} />);
  const publica = via(container, PUBLIC);
  expect(publica.getAttribute('aria-disabled')).toBe('true');
  expect(publica.textContent).toBe(`${PUBLIC}${TEXTOS_COMENTAR.senseXatPublic[1]}`);
  fireEvent.click(publica);
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  window.history.replaceState(null, '', '/');
});

/* L'altre lector del MAS: una publicació pròpia (PublicacioDetall). El seu
   Comentar és el de la publicació de veres (Mur, Mercat o agenda), no el de
   la vista del MAS (/notes?nota=publicacio:…). */
test('T63.2 · PublicacioDetall: «En públic» obri el xat comú de la publicació amb el seu tipus', () => {
  window.history.replaceState(null, '', '/notes?nota=publicacio:mercat:samarreta-socdepoble');
  const { container, unmount } = render(<PublicacioDetall item={publicacioComANota({ ...SAMARRETA, created_at: '2026-09-02T10:00:00.000Z' }, 'mercat')} />);
  fireEvent.click(via(container, PUBLIC));
  expect(destiXat()).toEqual({ cami: '/xat', sobre: 'producte:samarreta-socdepoble', titol: 'Samarreta', ruta: '/mercat/samarreta-socdepoble' });
  unmount();
  const coca = { id: 'coca', title: 'Recepta de coca', created_at: '2026-09-01T10:00:00.000Z' };
  const mur = render(<PublicacioDetall item={publicacioComANota(coca, 'mur')} />);
  fireEvent.click(via(mur.container, PUBLIC));
  expect(destiXat().sobre).toBe('publicacio:coca');
  window.history.replaceState(null, '', '/');
});

test('Compartir envia l’enllaç de l’original, no el de la nota', async () => {
  render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  expect(typeof mocks.pagina.onShare).toBe('function');
  fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
  await waitFor(() => expect(escriu).toHaveBeenCalledWith(new URL('/mercat/samarreta-socdepoble', window.location.origin).href));
  expect(escriu.mock.calls[0][0]).not.toContain('nota=');
});

test('absent (un perfil): caiguda amb el títol de l’origen, avís i «Obri l’original»', async () => {
  const { container } = render(<ConnexioDetall nota={nota(ORIGEN_PERFIL)} />);
  expect(container.querySelector('header.page-title h1').textContent).toBe('Pepa Soler');
  expect(screen.getByText('L’original no es pot mostrar ací')).toBeTruthy();
  /* Gauntlet 261016 (Bloc 3; Directiva de Dignitat Humana) · DEROGADA la
     píndola «Persona»: una connexió a una persona no la categoritza. */
  expect(screen.queryByText('Persona')).toBeNull();
  expect(container.querySelector('header.page-title .page-title-labels')).toBeNull();
  expect(mocks.pagina.labels).toEqual([]);
  expect(mocks.pagina.onConnect).toBe(false);
  senseEditor(container);
  fireEvent.click(screen.getByRole('button', { name: 'Obri l’original' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/gent/u1');
  fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
  await waitFor(() => expect(escriu).toHaveBeenCalledWith(new URL('/gent/u1', window.location.origin).href));
});

/* Gauntlet 261016 (Bloc 3) · La regla és de la persona i només d'ella: mana
   el tipus de l'objecte representat (origen.objecte). Una entitat, un grup,
   una IA o una obra que no es resol conserven la píndola del seu tipus, i un
   objecte desconegut, «Element», com abans. */
test.each([
  ['entitat', 'Entitat'], ['grup', 'Grup'], ['ia', 'Intel·ligència artificial'], ['pagina', 'Pàgina'], [undefined, 'Element']
])('caiguda d’una connexió a «%s»: la píndola del seu tipus es queda', (objecte, etiqueta) => {
  const origen = { ...ORIGEN_PERFIL, objecte, autorTipus: objecte, itemId: 'x-1', ruta: '/perfil/x-1', titol: 'Un original' };
  const { container } = render(<ConnexioDetall nota={nota(origen)} />);
  expect(screen.getByText('L’original no es pot mostrar ací')).toBeTruthy();
  expect([...container.querySelectorAll('header.page-title .page-title-labels > li')].map((li) => li.textContent)).toEqual([etiqueta]);
});

/* ── T71 · l'intern és un accés directe de lectura a l'original ── */
const ORIGEN_ANIMA = {
  tipus: 'connexio', sectionId: '', itemId: '/iaia', ruta: '/iaia', objecte: 'pagina',
  // El que l'URL de Connectar podia portar: no mana quan l'original es resol.
  titol: 'Títol de l’URL', autorNom: 'Foraster'
};
const autorDeLaBarra = (container) => container.querySelector('.bar-orange .sp-card-author-name').textContent;

test('T71 · una connexió a /ia es llig com /ia: títol, foto, autor i cos de l’Ànima de la IAIA', () => {
  const connexio = { ...nota(ORIGEN_ANIMA), title: 'Títol de l’URL', content: '<p>Element connectat des de Sóc de Poble.</p>' };
  const { container } = render(<ConnexioDetall nota={connexio} />);
  expect(container.querySelector('header.page-title h1').textContent).toBe("L'Ànima de la IAIA");
  expect(container.querySelector('.hero-image img').getAttribute('src'))
    .toBe('/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp');
  expect(container.querySelector('article.cms-preview h3').textContent).toBe('El Despertar de la Nina de Silici');
  // L'autor de /ia (el de sèrie de la barra), mai el de l'URL ni el Foraster.
  expect(autorDeLaBarra(container)).toBe('Sóc de Poble');
  expect(container.textContent).not.toMatch(/Foraster|Títol de l’URL|Element connectat/);
  expect(screen.queryByText('L’original no es pot mostrar ací')).toBeNull();
  expect(mocks.pagina).toMatchObject({ onConnect: false, layout: 'contained', chrome: 'context', title: "L'Ànima de la IAIA" });
  senseEditor(container);
  // La tira de recopilació va davall del cos de la pàgina.
  const tira = screen.getByRole('group', { name: 'Recopilació de la connexió' });
  expect(container.querySelector('article.content-wrapper').lastElementChild).toBe(tira);
  /* Gauntlet 261016_1530 (Bloc 3.6.3) · Ordre nova: el manifest viu a /anima
     i /iaia és la fitxa de la IAIA. «Obri l'original» porta a la pàgina que
     es llig (/anima), no a la ruta vella desada. Abans: '/iaia'. */
  fireEvent.click(screen.getByRole('button', { name: 'Obri l’original' }));
  expect(mocks.navigate).toHaveBeenCalledWith('/anima');
  expect(mocks.navigate).not.toHaveBeenCalledWith('/iaia');
});

/* Bloc 3.6.3 · Les connexions desades a les rutes velles del manifest (/iaia,
   /ia) obrin i compartixen /anima, amb la consulta i el fragment. Comentar
   continua al xat públic de '/iaia' (provat més amunt), i un perfil continua a
   la seua ruta. */
test.each([
  ['/iaia', '/anima'],
  ['/ia', '/anima'],
  ['/iaia#reflexions', '/anima#reflexions'],
  ['/ia?origen=prova', '/anima?origen=prova']
])('Bloc 3.6.3 · una connexió a la pàgina %s obri i compartix %s, mai la fitxa', async (desada, vigent) => {
  const origen = { ...ORIGEN_ANIMA, itemId: desada, ruta: desada };
  const { container } = render(<ConnexioDetall nota={nota(origen)} />);
  expect(container.querySelector('header.page-title h1').textContent).toBe("L'Ànima de la IAIA");
  fireEvent.click(screen.getByRole('button', { name: 'Obri l’original' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith(vigent);
  fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
  await waitFor(() => expect(escriu).toHaveBeenCalledWith(new URL(vigent, window.location.origin).href));
});

test('Bloc 3.6.3 · una connexió sense tipus d’objecte (d’abans de T43) a /iaia també obri /anima', () => {
  const senseObjecte = { ...ORIGEN_ANIMA, objecte: undefined };
  render(<ConnexioDetall nota={nota(senseObjecte)} />);
  fireEvent.click(screen.getByRole('button', { name: 'Obri l’original' }));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/anima');
});

test('T71 · el cos d’una pàgina del core passa pel sanejador', () => {
  mocks.core = { status: 'ready', towns: [], pageCopy: { anima: { title: 'Ànima', html: '<p>Bo</p><script>alert(1)</script><img src="x" onerror="alert(2)">' } } };
  try {
    const { container } = render(<ConnexioDetall nota={nota(ORIGEN_ANIMA)} />);
    const cos = container.querySelector('article.cms-preview');
    expect(cos.querySelector('script')).toBeNull();
    expect(cos.querySelector('[onerror]')).toBeNull();
    expect(cos.textContent).toBe('Bo');
  } finally {
    mocks.core = { status: 'ready', towns: [] };
  }
});

test('T71 · a la caiguda ningú s’inventa l’autor: un perfil es signa ell mateix, i sense autor no hi ha «Sóc de Poble»', () => {
  const { container, unmount } = render(<ConnexioDetall nota={nota(ORIGEN_PERFIL)} />);
  expect(autorDeLaBarra(container)).toBe('Pepa Soler');
  expect(container.querySelector('.bar-orange a.sp-card-author-link').getAttribute('href')).toBe('/gent/u1');
  unmount();
  // Una pàgina amb query (la Wiki) no es resol: caiguda, sense autor inventat.
  const wiki = { tipus: 'connexio', sectionId: '', itemId: '/wikidepoble?item=x', ruta: '/wikidepoble?item=x', objecte: 'pagina', titol: 'Una fitxa de la Wiki' };
  const { container: caiguda } = render(<ConnexioDetall nota={nota(wiki)} />);
  expect(screen.getByText('L’original no es pot mostrar ací')).toBeTruthy();
  expect(autorDeLaBarra(caiguda)).toBe('');
  expect(caiguda.querySelector('.bar-orange').textContent).not.toMatch(/Sóc de Poble|Foraster/);
});

/* Onada 8 (261009, revisió adversarial) · Una connexió al perfil de Sóc de
   Poble que no es resol: la caiguda la signa l'entitat (el perfil es signa ell
   mateix) i la boina porta al seu perfil (RUTA_PERFIL_PROJECTE). Des de
   l'Onada 8 eixa és la ruta del projecte (esRutaDelProjecte de PageFrame) i la
   pàgina porta el logotip de Sóc de Poble dalt de l'H1, com tota pàgina que
   signa l'entitat (norma del Mestre, 261004). Abans la ruta no casava amb
   /projecte i la caiguda en quedava sense: és un canvi visible fora de
   l'ordre, PENDENT de confirmar per MarIA. Si no s'accepta, esta prova és la
   que canvia. Una persona continua sense logotip. */
test('Onada 8 · la caiguda del perfil de Sóc de Poble signa l’entitat, porta al seu perfil i en pinta el logotip; la d’una persona, cap', () => {
  const ORIGEN_PILOT = {
    tipus: 'connexio', sectionId: 'perfil', itemId: 'socdepoble', titol: 'Sóc de Poble', autorTipus: 'entitat', ruta: RUTA_PERFIL_PROJECTE, objecte: 'entitat'
  };
  const logos = (container) => [...container.querySelectorAll('header.page-title img.page-title-logo')].map((img) => img.getAttribute('alt'));
  const { container, unmount } = render(<ConnexioDetall nota={nota(ORIGEN_PILOT)} />);
  expect(screen.getByText('L’original no es pot mostrar ací')).toBeTruthy();
  expect(autorDeLaBarra(container)).toBe('Sóc de Poble');
  expect(container.querySelector('.bar-orange a.sp-card-author-link').getAttribute('href')).toBe(RUTA_PERFIL_PROJECTE);
  expect(logos(container)).toEqual([DEFAULT_AUTHOR.logo.alt, DEFAULT_AUTHOR.logo.alt]);
  unmount();
  const persona = render(<ConnexioDetall nota={nota(ORIGEN_PERFIL)} />);
  expect(logos(persona.container)).toEqual([]);
});

test('mentre el Mur carrega diu que l’original carrega; sense ruta, cap «Obri l’original» i Compartir ho explica', () => {
  mocks.mur = { status: 'loading', feedPosts: [], events: [], marketItems: [] };
  const { unmount } = render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  expect(screen.getByText('Carregant l’original…')).toBeTruthy();
  unmount();
  render(<ConnexioDetall nota={nota({ ...ORIGEN_PERFIL, ruta: '//mal.example' })} />);
  expect(screen.queryByRole('button', { name: 'Obri l’original' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
  expect(escriu).not.toHaveBeenCalled();
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('no porta cap enllaç'), 'info');
});

/* D1 (ordre del Mestre, 260930) · la carpeta 'f-connectats' es diu «Safata d’Entrada». */
test('Carpeta: el diàleg de sempre, i desar la mou pel canal de la nota', () => {
  render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  fireEvent.click(screen.getByRole('button', { name: 'Carpeta: Safata d’Entrada' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Mur', hidden: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar', hidden: true }));
  expect(mocks.notes.setLocalNoteField).toHaveBeenCalledWith('n-9', 'folderId', 'f-mur');
});

test('Borrar: el diàleg de la nota i la mateixa acció del context; sense capacitat, cap botó', async () => {
  const connexio = nota(ORIGEN_MERCAT);
  const { unmount } = render(<ConnexioDetall nota={connexio} />);
  fireEvent.click(screen.getByRole('button', { name: 'Borrar' }));
  fireEvent.click(screen.getByRole('button', { name: 'Arxivar', hidden: true }));
  await waitFor(() => expect(mocks.notes.mouNota).toHaveBeenCalledWith(connexio, 'arxivada'));
  unmount();
  mocks.notes.potEsborrar = false;
  render(<ConnexioDetall nota={connexio} />);
  expect(screen.queryByRole('button', { name: 'Borrar' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Obri l’original' })).toBeTruthy();
});

test('la font de la secció ha fallat: «No s’ha pogut carregar l’original», no que no hi siga', () => {
  mocks.mur = { status: 'error', error: new Error('Failed to fetch'), feedPosts: [], events: [], marketItems: [] };
  render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  expect(screen.getByText('No s’ha pogut carregar l’original')).toBeTruthy();
  expect(screen.queryByText('L’original no es pot mostrar ací')).toBeNull();
  expect(screen.queryByText('Carregant l’original…')).toBeNull();
  expect(screen.getByRole('button', { name: 'Obri l’original' })).toBeTruthy();
});

/* Una connexió d'abans de T54 porta el segon paràgraf fix que prometia etiquetar i compartir des de l'editor.
   La funció pura (senseParagrafHeretat) té les seues proves a connexions.test.js; ací, el que pinta el lector. */
const COS_HERETAT = '<p>Element connectat des del Mercat de Sóc de Poble: <a href="/mercat/samarreta-socdepoble">Samarreta</a>.</p>'
  + '<p>Ordena\'l a les teues carpetes, etiqueta\'l i, si vols, compartix-lo al teu mur.</p>';

test('en la caiguda no es pinta el paràgraf fix antic; la resta del cos, sí', () => {
  const { container } = render(<ConnexioDetall nota={{ ...nota(ORIGEN_PERFIL), content: COS_HERETAT }} />);
  expect(container.textContent).toContain('Element connectat des del Mercat');
  expect(container.textContent).not.toMatch(/etiqueta'l|compartix-lo/);
});

const selector = () => screen.getByRole('dialog', { name: 'Qui pot vore este contingut?' });

test('Compartir al Mur: el selector de visibilitat i compartirNota del context, citant qui signa', async () => {
  const connexio = nota(ORIGEN_MERCAT);
  render(<ConnexioDetall nota={connexio} />);
  const tira = screen.getByRole('group', { name: 'Recopilació de la connexió' });
  fireEvent.click(within(tira).getByRole('button', { name: 'Compartir al Mur' }));
  expect(within(selector()).getByText('Pep')).toBeTruthy();
  act(() => { fireEvent.click(within(selector()).getByRole('radio', { name: /Compartit al teu Mur/ })); });
  await act(async () => { fireEvent.click(within(selector()).getByRole('button', { name: 'Compartir al Mur' })); });
  expect(mocks.notes.compartirNota).toHaveBeenCalledWith(connexio);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Compartir al Mur: deixar-la al MAS no crida res; una fallada de xarxa es diu en línia', async () => {
  render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  const obri = () => fireEvent.click(within(screen.getByRole('group', { name: 'Recopilació de la connexió' })).getByRole('button', { name: 'Compartir al Mur' }));
  obri();
  await act(async () => { fireEvent.click(within(selector()).getByRole('button', { name: 'Deixar-lo al MAS' })); });
  expect(mocks.notes.compartirNota).not.toHaveBeenCalled();
  mocks.notes.compartirNota.mockResolvedValue(false);
  obri();
  act(() => { fireEvent.click(within(selector()).getByRole('radio', { name: /Compartit al teu Mur/ })); });
  await act(async () => { fireEvent.click(within(selector()).getByRole('button', { name: 'Compartir al Mur' })); });
  expect(within(selector()).getByRole('alert').textContent).toContain(ERROR_PUBLICAR);
});

/* D3 · La traducció dels errors és la de l'editor (publicaAmbMotiu): el motiu de
   veres no es tapa amb «torna-ho a provar». */
test('Compartir al Mur: un ErrorPublicacio diu el seu motiu en línia, no ERROR_PUBLICAR', async () => {
  const motiu = 'No es pot publicar fins que es desen els canvis. Hi ha un conflicte.';
  mocks.notes.compartirNota.mockRejectedValue(new ErrorPublicacio(motiu));
  render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
  fireEvent.click(within(screen.getByRole('group', { name: 'Recopilació de la connexió' })).getByRole('button', { name: 'Compartir al Mur' }));
  act(() => { fireEvent.click(within(selector()).getByRole('radio', { name: /Compartit al teu Mur/ })); });
  await act(async () => { fireEvent.click(within(selector()).getByRole('button', { name: 'Compartir al Mur' })); });
  const alerta = within(selector()).getByRole('alert').textContent;
  expect(alerta).toContain(motiu);
  expect(alerta).not.toContain(ERROR_PUBLICAR);
});

test('una connexió ja compartida: la tira diu «Actualitzar al Mur», com el selector, i torna a compartir', async () => {
  const connexio = { ...nota(ORIGEN_MERCAT), isPublished: true, publishedSubmissionId: 'n-9' };
  render(<ConnexioDetall nota={connexio} />);
  const tira = screen.getByRole('group', { name: 'Recopilació de la connexió' });
  expect(within(tira).queryByRole('button', { name: 'Compartir al Mur' })).toBeNull();
  fireEvent.click(within(tira).getByRole('button', { name: 'Actualitzar al Mur' }));
  // Retirar-la no té contracte: «privada» està bloquejada, amb el motiu.
  expect(within(selector()).getByRole('radio', { name: /Només al teu MAS/ }).disabled).toBe(true);
  await act(async () => { fireEvent.click(within(selector()).getByRole('button', { name: 'Actualitzar al Mur' })); });
  expect(mocks.notes.compartirNota).toHaveBeenCalledWith(connexio);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('Compartir al Mur només amb sessió, amb servidor i amb l’acció del context', () => {
  const cap = () => screen.queryByRole('button', { name: 'Compartir al Mur' });
  const casos = [
    () => { mocks.user = null; },
    () => { mocks.notes.config = { dataMode: 'seed' }; },
    () => { mocks.notes.config = { dataMode: 'local' }; },
    () => { mocks.notes.compartirNota = undefined; }
  ];
  for (const prepara of casos) {
    mocks.user = { id: 'U' }; mocks.notes.config = {}; mocks.notes.compartirNota = vi.fn();
    prepara();
    const { unmount } = render(<ConnexioDetall nota={nota(ORIGEN_MERCAT)} />);
    expect(cap()).toBeNull();
    expect(screen.getByRole('button', { name: 'Obri l’original' })).toBeTruthy();
    unmount();
  }
});
