/* Torn 260930 (T1) · El full «Ajustos» del Xat (captures de referència
   20.47–21.05) muntat de veres dins de ClosCaXat: s'obri des del peu del
   rail, cerca a tot l'arbre, empeny i torna pàgines dins del mateix marc,
   aplica el tema, la llengua i l'amplària a l'acte, diu «en construcció» on
   no hi ha dades, i la X i Escape el tanquen. El focus va al cercador, al ‹
   de cada subpàgina i torna a la fila que l'havia obert.
   jsdom no té showModal: el Dialeg hi posa `open`. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { PRESETS_COLUMNES } from '../../../components/layout/AppGridShell.jsx';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { PRESETS_AMPLARIA } from '../amplariaColumnes.js';
import ClosCaXat, { BotoObriRail, CLAU_RAIL, RUTA_PERFIL } from './ClosCaXat.jsx';
import PanellInicialMobil from './PanellInicialMobil.jsx';
import { RUTES_AJUSTOS } from '../ajustosXat.js';
import { LOGO_DE_SOC_DE_POBLE } from '../caraDeSocDePoble.js';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../../config/navigation.js';
import { ENTITAT_PILOT_SLUG } from '../../../data/identitatsSeed.js';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setTheme: vi.fn(),
  setLanguage: vi.fn(),
  tema: 'light',
  fils: [],
  sessio: null,
  amplada: 1280,
  externalConfig: undefined,
  towns: [],
  joAvatar: null
}));

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/xat' }),
  useSearchParams: () => [new URLSearchParams()],
  useParams: () => ({})
}));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, setTheme: mocks.setTheme, setLanguage: mocks.setLanguage }),
  useUIState: () => ({ themePreference: mocks.tema, language: 'ca', externalConfig: mocks.externalConfig })
}));
/* La fitxa del poble de l'amfitrió (Onada 3, AV): la cara dels Preferits. */
vi.mock('../../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', towns: mocks.towns })
}));
vi.mock('../XatContext', () => ({
  useXat: () => ({ comunitats: [], joId: 'jo', joNom: 'Javi Llinares', joAvatar: mocks.joAvatar, chatThreads: mocks.fils })
}));
/* La sessió, quan n'hi ha: useSessioOpcional (el full) i useSession
   (useEixidaSegura, la mateixa eixida que el Panell de Control). */
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => mocks.sessio,
  useSession: () => mocks.sessio
}));

/* AppGridShell mesura el contenidor: 1280 és ample, 375 estret. */
Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
  configurable: true,
  get() { return mocks.amplada; }
});

const CLAUS = [CLAU_RAIL, 'sdp-grid-widths'];
let abans = [];

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  abans = CLAUS.map((clau) => [clau, getVal(clau)]);
  CLAUS.forEach((clau) => delVal(clau));
  mocks.navigate.mockReset();
  mocks.setTheme.mockReset();
  mocks.setLanguage.mockReset();
  mocks.tema = 'light';
  mocks.fils = [];
  mocks.sessio = null;
  mocks.amplada = 1280;
  mocks.externalConfig = undefined;
  mocks.towns = [];
  mocks.joAvatar = null;
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  for (const [clau, valor] of abans) {
    if (valor == null) delVal(clau);
    else setVal(clau, valor);
  }
});

/* La closca del Xat amb una columna central mínima: el botó que obri el rail
   (estret i mitjà) i la llista primer en estret, com XatSection. */
function pinta({ railObert = true } = {}) {
  if (railObert) setVal(CLAU_RAIL, 'obert');
  const middle = (
    <aside className="sdp-workspace-column" aria-label="Xats">
      <PanellInicialMobil />
      <BotoObriRail etiqueta="Menú" />
    </aside>
  );
  return render(<ClosCaXat middleTitle="Xats" middleColumn={middle} rightColumn={<div />} />);
}

const rail = () => document.getElementById('app-grid-sidebar');
const full = () => screen.getByRole('dialog', { name: 'Ajustos' });
const titol = () => within(full()).getByRole('heading', { level: 2 }).textContent;
const fila = (nom) => within(full()).getByRole('button', { name: new RegExp(`^${nom}`) });

function obriDesDelPeu() {
  const boto = within(rail()).getByRole('button', { name: 'Tu: ajustos' });
  boto.focus();
  fireEvent.click(boto);
  return boto;
}

test('els presets de l’amplària són els d’AppGridShell (una sola llista per a les dos portes)', () => {
  expect(PRESETS_AMPLARIA.map(([id]) => id).sort()).toEqual(Object.keys(PRESETS_COLUMNES).sort());
  expect(RUTES_AJUSTOS.perfil).toBe(RUTA_PERFIL);
});

test('«Tu» al peu del rail obri el full amb el focus al cercador; la X el tanca i el focus hi torna', () => {
  pinta();
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();
  const peu = rail().querySelector('.sdp-xat-rail-peu');
  const tu = within(peu).getByRole('button', { name: 'Tu: ajustos' });
  expect(tu.getAttribute('aria-haspopup')).toBe('dialog');
  expect(within(tu).getByText('Tu')).toBeTruthy();
  /* El llapis continua portant al perfil. */
  expect(within(peu).getByRole('button', { name: 'Edita el perfil' })).toBeTruthy();

  obriDesDelPeu();
  expect(full().classList.contains('sdp-xat-ajustos')).toBe(true);
  expect(titol()).toBe('Ajustos');
  expect(document.activeElement).toBe(within(full()).getByRole('searchbox', { name: 'Cerca als ajustos' }));
  /* L'arrel: la targeta del perfil i les files de la captura, amb xebró. */
  expect(within(full()).getByRole('button', { name: 'Javi Llinares, El meu perfil' })).toBeTruthy();
  const files = [...full().querySelectorAll('.sdp-xat-ajustos__fila')].map((b) => b.textContent);
  expect(files).toEqual(['Preferits', 'Destacats', 'Historial del xat', 'Compte', 'Privacitat', 'Xats', 'Aparença', 'Notificacions', 'Dades i memòria local', 'Ajuda']);
  expect(full().querySelectorAll('.sdp-xat-ajustos__fila svg.lucide-chevron-right')).toHaveLength(10);

  fireEvent.click(within(full()).getByRole('button', { name: 'Tanca els ajustos' }));
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();
  expect(document.activeElement).toBe(within(rail()).getByRole('button', { name: 'Tu: ajustos' }));
});

test('amb el rail plegat, l’avatar del peu obri el full', () => {
  pinta({ railObert: false });
  const avatar = within(rail()).getByRole('button', { name: 'Tu: ajustos' });
  expect(avatar.classList.contains('sdp-workspace-rail__boto')).toBe(true);
  expect(within(rail()).queryByRole('button', { name: 'Edita el perfil' })).toBeNull();
  fireEvent.click(avatar);
  expect(titol()).toBe('Ajustos');
});

test('Escape tanca el full (onTanca «esc» del Dialeg); dins del cercador amb text, primer l’esborra', () => {
  pinta();
  obriDesDelPeu();
  const camp = within(full()).getByRole('searchbox');
  fireEvent.change(camp, { target: { value: 'tema' } });
  fireEvent.keyDown(camp, { key: 'Escape' });
  expect(camp.value).toBe('');
  expect(full()).toBeTruthy();
  const cancel = new Event('cancel', { cancelable: true });
  act(() => { full().dispatchEvent(cancel); });
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();
});

test('la cerca plega accents i travessa l’arbre; sense resultats, l’estat buit', () => {
  pinta();
  obriDesDelPeu();
  const camp = within(full()).getByRole('searchbox');
  fireEvent.change(camp, { target: { value: 'fosc' } });
  /* La fila trobada diu on viu. La targeta del perfil s'amaga. */
  expect(within(full()).queryByRole('button', { name: /El meu perfil/ })).toBeNull();
  const fosc = fila('Mode fosc');
  expect(fosc.textContent).toBe('Mode foscAparença');
  fosc.focus();
  fireEvent.click(fosc);
  expect(titol()).toBe('Aparença');
  expect(mocks.setTheme).not.toHaveBeenCalled();
  /* Torna: la cerca continua i el focus, al resultat premut. */
  fireEvent.click(within(full()).getByRole('button', { name: 'Torna a Ajustos' }));
  expect(within(full()).getByRole('searchbox').value).toBe('fosc');
  expect(document.activeElement).toBe(fila('Mode fosc'));

  fireEvent.change(within(full()).getByRole('searchbox'), { target: { value: 'aparenca' } });
  expect([...full().querySelectorAll('.sdp-xat-ajustos__fila')].map((b) => b.textContent)).toEqual(['Aparença']);

  fireEvent.change(within(full()).getByRole('searchbox'), { target: { value: 'zzz' } });
  const buit = within(full()).getByRole('status');
  expect(buit.textContent).toBe('Cap resultatCap ajust coincidix amb «zzz».');
});

test('Aparença: el focus va al ‹; triar «Mode fosc» crida setTheme a l’acte, i la llengua, setLanguage; en tornar, el focus a la fila', () => {
  pinta();
  obriDesDelPeu();
  const aparenca = fila('Aparença');
  aparenca.focus();
  fireEvent.click(aparenca);
  expect(titol()).toBe('Aparença');
  const torna = within(full()).getByRole('button', { name: 'Torna a Ajustos' });
  expect(document.activeElement).toBe(torna);
  expect(torna.querySelector('svg.lucide-chevron-left')).toBeTruthy();
  /* Sense cercador fora de l'arrel. */
  expect(within(full()).queryByRole('searchbox')).toBeNull();

  const tema = within(full()).getByRole('group', { name: 'Tema' });
  const opcions = within(tema).getAllByRole('button');
  expect(opcions.map((b) => [b.textContent, b.getAttribute('aria-pressed')])).toEqual([
    ['Igual que el sistema', 'false'], ['Mode clar', 'true'], ['Mode fosc', 'false']
  ]);
  expect(opcions[1].querySelector('svg.lucide-check')).toBeTruthy();
  fireEvent.click(opcions[2]);
  expect(mocks.setTheme).toHaveBeenCalledWith('dark');

  const llengua = within(full()).getByRole('group', { name: 'Llengua' });
  expect(within(llengua).getAllByRole('button').map((b) => b.textContent)).toEqual(['Valencià', 'Castellà', 'English', 'Euskara', 'Galego']);
  fireEvent.click(within(llengua).getByRole('button', { name: 'Galego' }));
  expect(mocks.setLanguage).toHaveBeenCalledWith('gl');
  /* Cap botó de desar. */
  expect(within(full()).queryByRole('button', { name: /Desa|Guardar/ })).toBeNull();

  fireEvent.click(torna);
  expect(titol()).toBe('Ajustos');
  expect(document.activeElement).toBe(fila('Aparença'));
});

test('Xats: l’Aparença porta el tema com a valor; l’amplària aplica el preset a l’acte i el ✓ el seguix', () => {
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Xats'));
  expect(titol()).toBe('Xats');
  expect(fila('Aparença').textContent).toBe('AparençaMode clar');
  fireEvent.click(fila('Amplària de les columnes'));
  expect(titol()).toBe('Amplària de les columnes');
  const opcions = () => within(full()).getAllByRole('button', { name: /Compacta|Per defecte|Ampla/ });
  expect(opcions().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
  expect(within(full()).getByText('Ara: navegació 260 px · llista 280 px')).toBeTruthy();
  fireEvent.click(within(full()).getByRole('button', { name: 'Ampla' }));
  expect(opcions().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true']);
  expect(within(full()).getByText('Ara: navegació 300 px · llista 340 px')).toBeTruthy();
  /* Dos nivells: el ‹ torna a Xats, a la fila que l'havia obert. */
  fireEvent.click(within(full()).getByRole('button', { name: 'Torna a Xats' }));
  expect(document.activeElement).toBe(fila('Amplària de les columnes'));
  expect(fila('Amplària de les columnes').textContent).toBe('Amplària de les columnesAmpla');
});

test('Preferits: les converses preferides (no arxivades) obrin la seua conversa i tanquen el full', () => {
  mocks.fils = [
    { id: 'a', name: 'Conversa', preferit: false },
    { id: 'b', name: 'Comissió de Festes', preferit: true },
    { id: 'c', name: 'Arxivada', preferit: true, arxivat: true }
  ];
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Preferits'));
  expect(titol()).toBe('Preferits');
  const conversa = within(full()).getByRole('button', { name: 'Comissió de Festes' });
  expect(within(full()).queryByRole('button', { name: 'Arxivada' })).toBeNull();
  expect(within(full()).queryByRole('button', { name: 'Conversa' })).toBeNull();
  fireEvent.click(conversa);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat/b');
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();
});

/* Onada 3 (AV, revisió) · Amb sessió, el servidor no dona cap imatge a la
   comunitat d'un poble: la preferida porta la cara del poble, com a la llista. */
test('Preferits: la comunitat del poble de l’amfitrió porta la cara del poble; la resta, la seua', () => {
  const CARA = '/assets/towns/la-torre-de-les-macanes/2.jpg';
  mocks.externalConfig = { poble: 'la-torre-de-les-macanes', nomPoble: 'La Torre' };
  mocks.towns = [{ id: 'la-torre-de-les-macanes', avatar_url: CARA }];
  const subjecte = { tipus: 'poble', id: '44444444-4444-4444-8444-444444444444', ruta: '/pobles/la-torre-de-les-macanes' };
  mocks.fils = [
    { id: 'c-torre', name: 'La Torre de les Maçanes', tipus: 'comunitat', esComunitat: true, subjecte, avatar_url: null, preferit: true },
    { id: 'b', name: 'Comissió de Festes', tipus: 'grup', preferit: true }
  ];
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Preferits'));
  const cares = Object.fromEntries([...full().querySelectorAll('.sdp-avatar')]
    .map((avatar) => [avatar.getAttribute('title'), avatar.querySelector('img')?.getAttribute('src') ?? null]));
  expect(cares['La Torre de les Maçanes']).toBe(CARA);
  expect(cares['Comissió de Festes']).toBeNull();
});

/* Gauntlet 261022_0225 (XAT-3) · En remot, la comunitat de Sóc de Poble
   arriba amb l'id del servidor i el logo pujat de l'organització: amb l'id ja
   registrat, porta el logo oficial, com a la llista. Un homònim, la seua. */
test('Preferits: la comunitat de Sóc de Poble porta el logo oficial; un homònim, la seua cara', () => {
  const UUID = '58325860-a199-4056-b160-94c19b124277';
  registraEntitatDelProjecte({ tipus: 'entitat', id: UUID, slug: ENTITAT_PILOT_SLUG });
  try {
    mocks.fils = [
      { id: 'c-sdp', name: 'Sóc de Poble', tipus: 'comunitat', esComunitat: true, subjecte: { tipus: 'entitat', id: UUID }, avatar_url: '/assets/pujat.webp', preferit: true },
      { id: 'c-homonim', name: 'Sóc de Poble (homònim)', tipus: 'comunitat', esComunitat: true, subjecte: { tipus: 'entitat', id: 'altra-entitat' }, avatar_url: '/assets/pujat.webp', preferit: true }
    ];
    pinta();
    obriDesDelPeu();
    fireEvent.click(fila('Preferits'));
    const cares = Object.fromEntries([...full().querySelectorAll('.sdp-avatar')]
      .map((avatar) => [avatar.getAttribute('title'), avatar.querySelector('img')?.getAttribute('src') ?? null]));
    expect(cares['Sóc de Poble']).toBe(LOGO_DE_SOC_DE_POBLE);
    expect(cares['Sóc de Poble (homònim)']).toBe('/assets/pujat.webp');
  } finally {
    oblidaEntitatDelProjecte();
  }
});

test('Preferits sense cap: el títol i la frase honesta, sense cap fila', () => {
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Preferits'));
  const buit = within(full()).getByRole('status');
  expect(buit.textContent).toContain('Cap preferit');
  expect(buit.textContent).toContain('filtre «Preferits»');
  expect(full().querySelectorAll('.sdp-xat-ajustos__fila')).toHaveLength(0);
});

test('Compte sense sessió: el perfil, sense correu ni eixida', () => {
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Compte'));
  expect(titol()).toBe('Compte');
  expect(fila('El meu perfil').textContent).toBe('El meu perfil');
  expect(within(full()).queryByRole('button', { name: 'Tanca la sessió' })).toBeNull();
  fireEvent.click(fila('El meu perfil'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil');
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();
});

test('Compte amb sessió: el correu com a valor i «Tanca la sessió» en roig, que avisa ací dins del que queda pendent', async () => {
  mocks.sessio = {
    currentUser: { id: 'jo', email: 'javi@exemple.org' },
    logout: vi.fn(async () => {}),
    preparaEixida: vi.fn(async () => [{ entitat: 'nota', camps: ['content'] }])
  };
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Compte'));
  expect(fila('El meu perfil').textContent).toBe('El meu perfiljavi@exemple.org');
  const eixida = within(full()).getByRole('button', { name: 'Tanca la sessió' });
  expect(eixida.classList.contains('sdp-xat-ajustos__fila--perill')).toBe(true);
  expect(eixida.querySelector('svg.lucide-chevron-right')).toBeNull();
  fireEvent.click(eixida);
  expect(await within(full()).findByText('Encara hi ha canvis sense desar')).toBeTruthy();
  expect(mocks.sessio.preparaEixida).toHaveBeenCalled();
  expect(mocks.sessio.logout).not.toHaveBeenCalled();
  fireEvent.click(within(full()).getByRole('button', { name: 'No eixir encara' }));
  await waitFor(() => expect(within(full()).queryByText('Encara hi ha canvis sense desar')).toBeNull());
});

test('una pàgina sense dades diu «En construcció» i què hi haurà; Destacats, el mateix text que la vista del rail', () => {
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Notificacions'));
  const seccio = within(full()).getByRole('region', { name: 'En construcció' });
  expect(seccio.textContent).toContain('missatges nous');
  expect(seccio.textContent).toContain('Encara no està disponible');
  fireEvent.click(within(full()).getByRole('button', { name: 'Torna a Ajustos' }));
  fireEvent.click(fila('Destacats'));
  expect(within(full()).getByRole('region', { name: 'En construcció' }).textContent)
    .toContain("Ací hi haurà els missatges que marques amb l'estrela");
});

/* Ordre del Mestre del 261004 (prompt 261004_0515, T5) · «Multimèdia,
   enllaços i documents» ja no és una pàgina en construcció: porta a la vista
   operativa del rail i tanca el full. Derogat el «en construcció» d'esta fila. */
test('Xats › «Multimèdia, enllaços i documents» porta a /xat?vista=multimedia i tanca el full', () => {
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Xats'));
  const multimedia = fila('Multimèdia, enllaços i documents');
  /* Una fila 'ruta': el mateix xebró que abans, cap «En construcció». */
  expect(multimedia.querySelector('svg.lucide-chevron-right')).toBeTruthy();
  fireEvent.click(multimedia);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?vista=multimedia');
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();
});

test('Ajuda porta a les pàgines pròpies i Privacitat, al Perfil: obrir una ruta tanca el full', () => {
  pinta();
  obriDesDelPeu();
  fireEvent.click(fila('Ajuda'));
  expect([...full().querySelectorAll('.sdp-xat-ajustos__fila')].map((b) => b.textContent)).toEqual(['Wiki de Poble', 'Legal i privacitat', 'Versions']);
  fireEvent.click(fila('Wiki de Poble'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/wikidepoble');
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();

  obriDesDelPeu();
  fireEvent.click(fila('Privacitat'));
  expect(mocks.navigate).toHaveBeenLastCalledWith('/el-meu-perfil');
});

test('en estret, «Tu» tanca abans el panell del rail; en tancar el full, el focus va al botó que obri el rail', async () => {
  mocks.amplada = 375;
  pinta();
  const closca = document.querySelector('.app-grid-shell');
  await waitFor(() => expect(closca.getAttribute('data-panell')).toBe('middle'));
  fireEvent.click(document.querySelector('.sdp-xat-obri-rail'));
  expect(closca.getAttribute('data-panell')).toBe('left');
  obriDesDelPeu();
  expect(closca.getAttribute('data-panell')).toBe('middle');
  expect(document.activeElement).toBe(within(full()).getByRole('searchbox'));
  fireEvent.click(within(full()).getByRole('button', { name: 'Tanca els ajustos' }));
  expect(screen.queryByRole('dialog', { name: 'Ajustos' })).toBeNull();
  expect(document.activeElement).toBe(document.querySelector('.sdp-xat-obri-rail'));
});

/* Marató 2230 · La foto de la persona arriba al full i es resol pel port.
   La mateixa targeta continua accessible pel nom escrit, sense duplicar alt. */
test('els Ajustos mostren la foto pròpia i la descarten quan la persona ja no en té', async () => {
  mocks.joAvatar = '/assets/profile-javi.jpg';
  const vista = pinta();
  obriDesDelPeu();
  const perfil = () => within(full()).getByRole('button', { name: 'Javi Llinares, El meu perfil' });
  await waitFor(() => expect(perfil().querySelector('img')?.getAttribute('src')).toBe('/assets/profile-javi.jpg'));
  expect(perfil().querySelector('img').getAttribute('alt')).toBe('');
  mocks.joAvatar = null;
  vista.rerender(<ClosCaXat middleTitle="Xats" middleColumn={<div />} rightColumn={<div />} />);
  expect(perfil().querySelector('img')).toBeNull();
  expect(perfil().textContent).toContain('JL');
});
