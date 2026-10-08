/** Proves d'integració de /cerca (T45) amb els contextos simulats. */
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SearchSection from './SearchSection';
import { extracteDeResultat, partsRessaltades } from './indexCerca.js';

const mocks = vi.hoisted(() => ({
  url: '',
  setParams: vi.fn(),
  mode: 'remote',
  t: (_, fallback) => fallback,
  ui: { locale: 'ca-ES', externalConfig: {} },
  core: null,
  mur: null,
  media: null,
  notes: null,
  xat: null,
  identitat: null,
  session: null
}));

vi.mock('../../app/contexts/RouterContext', async () => {
  const React = await import('react');
  const Link = ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children);
  return {
    /* Un useSearchParams amb estat: l'URL canvia com al router de veres. */
    useSearchParams: () => {
      const [params, setParams] = React.useState(() => new URLSearchParams(mocks.url));
      const aplica = React.useCallback((nous, opcions) => {
        mocks.setParams(nous, opcions);
        setParams((previs) => {
          const seguents = new URLSearchParams(previs);
          Object.entries(nous).forEach(([clau, valor]) => (valor == null ? seguents.delete(clau) : seguents.set(clau, valor)));
          return seguents;
        });
      }, []);
      return [params, aplica];
    },
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/cerca', search: '' }),
    useRouter: () => ({ navigate: vi.fn(), currentPath: '/cerca', basename: '' }),
    Link,
    NavLink: Link
  };
});
vi.mock('../../components/universal/UniversalPage', async () => {
  const { createElement } = await import('react');
  return { UniversalPage: ({ title, children }) => createElement('main', null, createElement('p', { 'data-testid': 'titol' }, title), children) };
});
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => mocks.ui
}));
vi.mock('../../config/backendConfig.js', () => ({ normalizeBackendConfig: () => ({ dataMode: mocks.mode }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
vi.mock('../notes/NotesContext', () => ({ useNotes: () => mocks.notes }));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/SessionContext', () => ({ useSession: () => mocks.session }));
/* Les funcions reals, espiades: per a saber quan es torna a calcular el ressaltat. */
vi.mock('./indexCerca.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, partsRessaltades: vi.fn(real.partsRessaltades), extracteDeResultat: vi.fn(real.extracteDeResultat) };
});

const BUIT = Object.freeze([]);

beforeEach(() => {
  mocks.url = '';
  mocks.mode = 'remote';
  mocks.setParams = vi.fn();
  mocks.core = {
    status: 'ready', error: null, refresh: vi.fn(),
    agents: [{ id: '0001', name: 'Mestre Javi', type: 'PERSON', town_name: 'La Torre de les Maçanes' }],
    towns: [{ id: 'benifallim', title: 'Benifallim', comarca: "L'Alcoià", population: '110 hab' }],
    pages: BUIT
  };
  mocks.mur = { status: 'ready', error: null, refresh: vi.fn(), feedPosts: BUIT, events: BUIT, marketItems: BUIT };
  mocks.media = { status: 'ready', error: null, refresh: vi.fn(), mediaItems: BUIT };
  mocks.notes = { status: 'ready', error: null, refresh: vi.fn(), notes: BUIT };
  mocks.xat = {
    status: 'ready', scopeKey: 'A#1', ambitEstable: 'A', chatThreads: BUIT, recarrega: vi.fn(),
    cercaMembres: vi.fn(async () => [{ usuari_id: 'u-pepa', nom: 'Javi Ferrer', tipus: 'persona', avatar_url: null, fil_id: null }])
  };
  mocks.identitat = { identitats: [{ tipus: 'persona', id: 'jo', nom: 'Javi Llinares', avatar: null }] };
  mocks.session = { currentUser: { id: 'jo', email: 'jo@exemple.org', user_metadata: { full_name: 'Javi Llinares' } }, estat: 'dins' };
});
afterEach(cleanup);

const pinta = async () => { await act(async () => { render(<SearchSection />); }); };
const estat = () => document.querySelector('p[role="status"].sdp-cerca__estat');

test('sense consulta mostra l’estat inicial i cap recompte', async () => {
  await pinta();
  expect(screen.getByText('Què vols buscar?')).toBeTruthy();
  expect(estat().textContent).toBe('');
  expect(mocks.xat.cercaMembres).not.toHaveBeenCalled();
  /* El text no promet el cos de les notes: només s'indexa el que arriba en el resum. */
  expect(screen.getByText(/el títol, el subtítol, l'entradilla i les etiquetes \(el text de dins, només de les que ja has obert\)/)).toBeTruthy();
});

test('?q=javi&tipus=persones inicia la caixa i el filtre, i troba el padró i la persona pròpia', async () => {
  mocks.url = '?q=javi&tipus=persones';
  await pinta();
  expect(screen.getByRole('searchbox').value).toBe('javi');
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Javi Ferrer' })).toBeTruthy());
  const filtre = screen.getByRole('button', { name: 'Persones 3' });
  expect(filtre.getAttribute('aria-pressed')).toBe('true');
  expect(mocks.xat.cercaMembres).toHaveBeenCalledWith(null);
  /* Poliment T45 · en remot, sense la capacitat 'directori' (esta sessió simulada
     no porta teCapacitat; l'adaptador de Supabase sí que la té sempre), la fitxa
     d'una altra persona no s'obri: el títol no hi enllaça i l'acció és «Escriu-li».
     Amb la capacitat, vegeu 261002 més avall. */
  expect(screen.queryByRole('link', { name: 'Javi Ferrer' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Escriu-li a Javi Ferrer' }).getAttribute('href')).toBe('/xat?amb=u-pepa');
  expect(screen.getByRole('link', { name: 'Javi Llinares' }).getAttribute('href')).toBe('/el-meu-perfil');
  expect(screen.getByRole('link', { name: 'Mestre Javi' }).getAttribute('href')).toBe('/gent/0001');
  expect(document.body.textContent).not.toContain('jo@exemple.org');
});

/* Decisió 1 del Mestre (261007) · El padró es demana per àmbit de DADES del
   xat (ambitEstable: backend, persona i actor), no per la clau d'operació
   (scopeKey, que porta la generació i canvia a cada renovació del JWT). */
test('Decisió 1 · una renovació de la sessió no torna a demanar el padró ni passa «Persones» per carregant; un canvi d’actor sí', async () => {
  mocks.url = '?q=javi&tipus=persones';
  let pintat;
  await act(async () => { pintat = render(<SearchSection />); });
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Javi Ferrer' })).toBeTruthy());
  expect(mocks.xat.cercaMembres).toHaveBeenCalledTimes(1);

  // Renovació del JWT: la clau d'operació canvia, l'àmbit de dades no.
  mocks.xat = { ...mocks.xat, scopeKey: 'A#2' };
  await act(async () => { pintat.rerender(<SearchSection />); });
  expect(mocks.xat.cercaMembres).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('heading', { name: 'Javi Ferrer' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Persones 3' })).toBeTruthy();
  expect(screen.queryByText("Encara arriben resultats d'algunes fonts…")).toBeNull();
  expect(estat().textContent).not.toBe('Buscant…');

  // Un altre actor (o una altra persona): l'àmbit de dades és un altre i el padró es torna a demanar.
  mocks.xat = { ...mocks.xat, scopeKey: 'B#2', ambitEstable: 'B' };
  await act(async () => { pintat.rerender(<SearchSection />); });
  await waitFor(() => expect(mocks.xat.cercaMembres).toHaveBeenCalledTimes(2));
  expect(mocks.xat.cercaMembres).toHaveBeenLastCalledWith(null);
});

test('en seed (o local), que sí que obri les fitxes, la persona del padró enllaça a /gent/:id', async () => {
  mocks.mode = 'seed';
  mocks.url = '?q=ferrer&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'Javi Ferrer' }).getAttribute('href')).toBe('/gent/u-pepa'));
  expect(screen.getByRole('link', { name: 'Escriu-li a Javi Ferrer' }).getAttribute('href')).toBe('/xat?amb=u-pepa');
});

/* Ordre del Mestre (261002) · En remot, amb la capacitat 'directori' (la RPC
   perfil_public al darrere de loadPerfilPublic), la persona del padró ix al
   cercador amb la seua fitxa, com en seed. */
test('261002 · en remot amb la capacitat directori, la persona del padró enllaça a /gent/:id', async () => {
  const teCapacitat = vi.fn((nom) => nom === 'directori');
  mocks.session = { ...mocks.session, teCapacitat };
  mocks.url = '?q=ferrer&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'Javi Ferrer' }).getAttribute('href')).toBe('/gent/u-pepa'));
  expect(screen.getByRole('link', { name: 'Escriu-li a Javi Ferrer' }).getAttribute('href')).toBe('/xat?amb=u-pepa');
  expect(teCapacitat).toHaveBeenCalledWith('directori');
});

test('261002 · en remot, un port sense la capacitat (o que falla en preguntar-ho) no enllaça la fitxa', async () => {
  mocks.session = { ...mocks.session, teCapacitat: () => { throw new Error('port encara no llest'); } };
  mocks.url = '?q=ferrer&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'Escriu-li a Javi Ferrer' })).toBeTruthy());
  expect(screen.queryByRole('link', { name: 'Javi Ferrer' })).toBeNull();
});

test('el recompte va en role=status i el form és role=search', async () => {
  mocks.url = '?q=benifallim';
  await pinta();
  await waitFor(() => expect(estat().textContent).toBe("S'ha trobat 1 resultat per a «benifallim»"));
  expect(screen.getByRole('search')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Benifallim' }).getAttribute('href')).toBe('/pobles/benifallim');
});

test('canviar de filtre fa push (replace false); escriure fa replace després d’una pausa', async () => {
  mocks.url = '?q=javi';
  await pinta();
  await act(async () => { screen.getByRole('button', { name: /^Pobles/ }).click(); });
  expect(mocks.setParams).toHaveBeenLastCalledWith({ q: 'javi', tipus: 'pobles' }, { replace: false });

  mocks.setParams.mockClear();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'benifallim' } });
  expect(mocks.setParams).not.toHaveBeenCalled();
  await waitFor(() => expect(mocks.setParams).toHaveBeenCalledWith({ q: 'benifallim' }, { replace: true }));
});

test('si el padró rebutja amb SDP-XAT-003 es pinta una Alerta i la resta de resultats continua', async () => {
  mocks.xat.cercaMembres = vi.fn(async () => { throw new Error("SDP-XAT-003: no eres membre d'aquest poble"); });
  mocks.url = '?q=javi';
  await pinta();
  await waitFor(() => expect(screen.getByText("SDP-XAT-003: no eres membre d'aquest poble")).toBeTruthy());
  expect(screen.getByText("No s'ha pogut buscar en el padró del poble")).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Mestre Javi' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Javi Llinares' })).toBeTruthy();

  mocks.xat.cercaMembres.mockImplementation(async () => [{ usuari_id: 'u2', nom: 'Javi Soler', tipus: 'persona' }]);
  await act(async () => { screen.getByRole('button', { name: 'Torna-ho a provar' }).click(); });
  /* El botó desapareix amb l'Alerta: el focus va al recompte, no al <body>. */
  expect(document.activeElement).toBe(estat());
  /* En remot la persona del padró es troba amb «Escriu-li» (la fitxa encara no s'obri). */
  await waitFor(() => expect(screen.getByRole('link', { name: 'Escriu-li a Javi Soler' })).toBeTruthy());
  expect(screen.queryByText("No s'ha pogut buscar en el padró del poble")).toBeNull();
});

test('mentre el contingut carrega es veu l’esquelet, mai «Cap resultat»', async () => {
  mocks.core = { ...mocks.core, status: 'loading', agents: BUIT, towns: BUIT };
  mocks.url = '?q=benifallim';
  await pinta();
  expect(document.querySelector('.sdp-esquelet')).not.toBeNull();
  expect(screen.queryByText(/Cap resultat/)).toBeNull();
  expect(mocks.xat.cercaMembres).not.toHaveBeenCalled();
});

test('si ja hi ha resultats mentre una font carrega, es mostren amb un avís xicotet', async () => {
  mocks.core = { ...mocks.core, status: 'loading', agents: BUIT, towns: BUIT };
  mocks.url = '?q=javi';
  await pinta();
  expect(screen.getByRole('link', { name: 'Javi Llinares' })).toBeTruthy();
  expect(document.querySelector('.sdp-esquelet')).toBeNull();
  expect(screen.getByText("Encara arriben resultats d'algunes fonts…")).toBeTruthy();
});

test('sense resultats es veu l’estat buit i «Busca a tot arreu» torna al filtre Tot', async () => {
  mocks.url = '?q=zzz&tipus=pobles';
  await pinta();
  expect(screen.getByText('Cap resultat per a «zzz»')).toBeTruthy();
  await act(async () => { screen.getByRole('button', { name: 'Busca a tot arreu' }).click(); });
  expect(mocks.setParams).toHaveBeenLastCalledWith({ q: 'zzz', tipus: null }, { replace: false });
  /* El botó ja no hi és (el filtre Tot no l'ofereix): el focus va al recompte. */
  expect(screen.queryByRole('button', { name: 'Busca a tot arreu' })).toBeNull();
  expect(document.activeElement).toBe(estat());
  expect(estat().getAttribute('tabindex')).toBe('-1');
});

test('mentre la sessió es comprova no avisa d’entrar ni diu «Cap resultat»: el padró compta com a font que carrega', async () => {
  mocks.session = { currentUser: null, estat: 'comprovant' };
  mocks.identitat = { identitats: BUIT };
  mocks.url = '?q=zzz&tipus=persones';
  let pintat;
  await act(async () => { pintat = render(<SearchSection />); });
  expect(screen.queryByText('Sense entrar, la cerca no veu la gent registrada al poble.')).toBeNull();
  expect(screen.queryByRole('link', { name: 'Entra per a buscar gent del poble' })).toBeNull();
  expect(screen.queryByText(/Cap resultat/)).toBeNull();
  expect(document.querySelector('.sdp-esquelet')).not.toBeNull();
  expect(estat().textContent).toBe('Buscant…');
  expect(mocks.xat.cercaMembres).not.toHaveBeenCalled();

  /* Resolta la sessió, el padró es demana i la cerca acaba. */
  mocks.session = { currentUser: { id: 'jo', email: 'jo@exemple.org' }, estat: 'dins' };
  await act(async () => { pintat.rerender(<SearchSection />); });
  expect(mocks.xat.cercaMembres).toHaveBeenCalledWith(null);
  await waitFor(() => expect(screen.getByText('Cap resultat per a «zzz»')).toBeTruthy());
});

test('escriure a la caixa no torna a calcular l’extracte ni el ressaltat: depenen de la consulta, no del text', async () => {
  mocks.url = '?q=benifallim';
  await pinta();
  await waitFor(() => expect(estat().textContent).toBe("S'ha trobat 1 resultat per a «benifallim»"));
  expect(partsRessaltades).toHaveBeenCalled();
  vi.mocked(partsRessaltades).mockClear();
  vi.mocked(extracteDeResultat).mockClear();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'benifallim d' } });
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'benifallim de' } });
  expect(screen.getByRole('searchbox').value).toBe('benifallim de');
  expect(partsRessaltades).not.toHaveBeenCalled();
  expect(extracteDeResultat).not.toHaveBeenCalled();
});

test('sense sessió en remot avisa d’entrar i no crida el padró', async () => {
  mocks.session = { currentUser: null, estat: 'fora' };
  mocks.identitat = { identitats: BUIT };
  mocks.url = '?q=javi';
  await pinta();
  const enllac = screen.getByRole('link', { name: 'Entra per a buscar gent del poble' });
  /* Auditoria 261007 (B) · El botó diu «Entra»: /registre en el mode d'entrar,
     per rutaDEntrada (mode i després tornar). Abans no portava mode i
     OnboardingSection obria «Crear compte». */
  expect(enllac.getAttribute('href')).toBe('/registre?mode=entrar&tornar=%2Fcerca%3Fq%3Djavi');
  expect(screen.getByText('Sense entrar, la cerca no veu la gent registrada al poble.')).toBeTruthy();
  expect(mocks.xat.cercaMembres).not.toHaveBeenCalled();
});

test('Auditoria 261007 (B) · sense sessió i sense consulta, «Entra» de l’estat inicial també obri l’entrada en mode entrar', async () => {
  mocks.session = { currentUser: null, estat: 'fora' };
  mocks.identitat = { identitats: BUIT };
  await pinta();
  const enllac = screen.getByRole('link', { name: 'Entra per a buscar gent del poble' });
  expect(enllac.getAttribute('href')).toBe('/registre?mode=entrar&tornar=%2Fcerca');
  // La consulta viatja codificada dins de la tornada, sense cap espai cru.
  cleanup();
  mocks.url = '?q=pepa%20ferrer';
  await pinta();
  const ambEspai = screen.getByRole('link', { name: 'Entra per a buscar gent del poble' }).getAttribute('href');
  expect(new URLSearchParams(ambEspai.split('?')[1]).get('tornar')).toBe('/cerca?q=pepa%20ferrer');
  expect(new URLSearchParams(ambEspai.split('?')[1]).get('mode')).toBe('entrar');
});

test('les notes pròpies surten marcades com a privades', async () => {
  mocks.notes = { ...mocks.notes, notes: [{ id: 'n1', title: 'Idees de festa', plainText: 'Llista', updatedAt: '2026-09-01T10:00:00Z' }] };
  mocks.url = '?q=festa&tipus=notes';
  await pinta();
  expect(screen.getByRole('link', { name: 'Idees de festa' }).getAttribute('href')).toBe('/notes?nota=n1');
  expect(screen.getByText('Privada: només la veus tu')).toBeTruthy();
});
