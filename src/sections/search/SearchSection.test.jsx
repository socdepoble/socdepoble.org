/** Proves d'integració de /cerca (T45) amb els contextos simulats. */
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SearchSection from './SearchSection';
import { extracteDeResultat, partsRessaltades } from './indexCerca.js';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../config/navigation.js';

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
/* La Pàgina Universal simulada pinta el títol i, davall, la ranura
   accioPrincipal dins del bloc del títol, com PageFrame (div.page-title-accio). */
vi.mock('../../components/universal/UniversalPage', async () => {
  const { createElement } = await import('react');
  return {
    UniversalPage: ({ title, accioPrincipal, children }) => createElement('main', null,
      createElement('header', { 'data-testid': 'capcalera' },
        createElement('p', { 'data-testid': 'titol' }, title),
        accioPrincipal ? createElement('div', { className: 'page-title-accio' }, accioPrincipal) : null),
      children)
  };
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
  /* Ordre del Mestre (261019 21:34, punt 9) · Actualitzada a posta: la pròpia
     portava a /el-meu-perfil (l'editor privat). Revisió adversarial: sense
     'directori' la seua fitxa pública no s'obriria («Perfil no trobat»), i la
     pròpia seguix la regla del padró: cap enllaç (amb la capacitat, /gent/jo:
     261002, més avall). El '0001' del catàleg, a la ruta canònica de la
     persona pilot. */
  expect(screen.getByRole('heading', { name: 'Javi Llinares' })).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'Javi Llinares' })).toBeNull();
  expect(screen.getByRole('link', { name: 'Mestre Javi' }).getAttribute('href')).toBe('/javillinares');
  expect(document.querySelector('a[href^="/el-meu-perfil"]')).toBeNull();
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

/* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: «Tria i deixa un sol perfil
   per a cadascuna») · En seed, qui té sessió declara els àlies de la persona
   pilot (aliesDeLActor): la seua fitxa del padró i del catàleg ('0001') es
   fusiona amb la pròpia, sense «Escriu-li». Mai pel nom: l'homònim del padró,
   amb un altre id, continua sent una altra fitxa, i en remot (D1) el '0001'
   continua apart. */
const JAVI_DEL_CATALEG = Object.freeze({ id: '0001', name: 'Javi Llinares', type: 'PERSON', town_name: 'La Torre de les Maçanes' });
const PADRO_AMB_HOMONIM = Object.freeze([
  Object.freeze({ usuari_id: '0001', nom: 'Javi Llinares', tipus: 'persona', avatar_url: null, fil_id: null }),
  Object.freeze({ usuari_id: 'u-pepa', nom: 'Javi Llinares', tipus: 'persona', avatar_url: null, fil_id: null })
]);
const enllacos = (nom) => screen.getAllByRole('link', { name: nom }).map((enllac) => enllac.getAttribute('href'));

test('Bloc 3.5.1 · en seed amb sessió, un sol «Javi Llinares» propi, i l’homònim del padró continua apart', async () => {
  mocks.mode = 'seed';
  mocks.core = { ...mocks.core, agents: [JAVI_DEL_CATALEG] };
  mocks.xat.cercaMembres = vi.fn(async () => PADRO_AMB_HOMONIM);
  mocks.url = '?q=javi%20llinares&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Persones 2' })).toBeTruthy());
  /* 261019 · Actualitzada a posta: la fitxa pròpia, a la pública canònica (abans /el-meu-perfil). */
  expect(enllacos('Javi Llinares')).toEqual(['/javillinares', '/gent/u-pepa']);
  expect(enllacos('Escriu-li a Javi Llinares')).toEqual(['/xat?amb=u-pepa']);
});

test('Bloc 3.5.1 · en remot el mateix nom no fusiona el compte amb el catàleg (D1)', async () => {
  mocks.core = { ...mocks.core, agents: [JAVI_DEL_CATALEG] };
  mocks.xat.cercaMembres = vi.fn(async () => PADRO_AMB_HOMONIM);
  mocks.url = '?q=javi%20llinares&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Persones 3' })).toBeTruthy());
  /* 261019 · Actualitzada a posta: la pròpia ja no porta a /el-meu-perfil i,
     en remot sense 'directori', no enllaça (revisió adversarial: la fitxa no
     s'obriria); el '0001', a /javillinares. Tres fitxes, cap fusionada pel nom. */
  expect(screen.getAllByRole('heading', { name: 'Javi Llinares' })).toHaveLength(3);
  expect(enllacos('Javi Llinares')).toEqual(['/javillinares']);
  expect(enllacos('Escriu-li a Javi Llinares')).toEqual(['/xat?amb=0001', '/xat?amb=u-pepa']);
});

/* Ordre del Mestre (261002) · En remot, amb la capacitat 'directori' (la RPC
   perfil_public al darrere de loadPerfilPublic), la persona del padró ix al
   cercador amb la seua fitxa, com en seed. */
test('261002 · en remot amb la capacitat directori, la persona del padró enllaça a /gent/:id', async () => {
  const teCapacitat = vi.fn((nom) => nom === 'directori');
  mocks.session = { ...mocks.session, teCapacitat };
  mocks.url = '?q=javi&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'Javi Ferrer' }).getAttribute('href')).toBe('/gent/u-pepa'));
  expect(screen.getByRole('link', { name: 'Escriu-li a Javi Ferrer' }).getAttribute('href')).toBe('/xat?amb=u-pepa');
  expect(teCapacitat).toHaveBeenCalledWith('directori');
  /* 261019 · La pròpia, a la seua fitxa pública, mai a l'editor privat. */
  expect(screen.getByRole('link', { name: 'Javi Llinares' }).getAttribute('href')).toBe('/gent/jo');
  expect(document.querySelector('a[href^="/el-meu-perfil"]')).toBeNull();
});

test('261002 · en remot, un port sense la capacitat (o que falla en preguntar-ho) no enllaça la fitxa', async () => {
  mocks.session = { ...mocks.session, teCapacitat: () => { throw new Error('port encara no llest'); } };
  mocks.url = '?q=javi&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'Escriu-li a Javi Ferrer' })).toBeTruthy());
  expect(screen.queryByRole('link', { name: 'Javi Ferrer' })).toBeNull();
  /* 261019 · Revisió adversarial: la pròpia tampoc (cap «Perfil no trobat», cap editor). */
  expect(screen.getByRole('heading', { name: 'Javi Llinares' })).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'Javi Llinares' })).toBeNull();
  expect(document.querySelector('a[href^="/el-meu-perfil"]')).toBeNull();
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
  /* 261019 · La pròpia es veu (sense 'directori' no enllaça: revisió adversarial). */
  expect(screen.getByRole('heading', { name: 'Javi Llinares' })).toBeTruthy();

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
  /* 261019 · La pròpia es veu (sense 'directori' no enllaça: revisió adversarial). */
  expect(screen.getByRole('heading', { name: 'Javi Llinares' })).toBeTruthy();
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

/* ── Ordre del Mestre (261019 21:34, punt 9) ─────────────────────────────── */

test('261019 · la caixa de cerca va davall de l’H1, al bloc del títol, davant dels filtres i dels resultats', async () => {
  mocks.url = '?q=benifallim';
  await pinta();
  const formulari = screen.getByRole('search', { name: 'Cerca a Sóc de Poble' });
  /* Dins de la ranura del bloc del títol (accioPrincipal), just després de
     l'H1, en la mesura de lectura de la columna (Centre, .sdp-centre: revisió
     adversarial, Llei del Píxel). */
  const ranura = formulari.closest('.page-title-accio');
  expect(formulari.parentElement.classList.contains('sdp-centre')).toBe(true);
  expect(formulari.parentElement.parentElement).toBe(ranura);
  expect(ranura.previousElementSibling).toBe(screen.getByTestId('titol'));
  expect(formulari.closest('[data-testid="capcalera"]')).not.toBeNull();
  expect(document.querySelector('.sdp-cerca').contains(formulari)).toBe(false);
  /* Una sola caixa, amb el seu nom, i davant dels filtres, del recompte i dels resultats. */
  expect(screen.getAllByRole('searchbox')).toHaveLength(1);
  expect(formulari.contains(screen.getByRole('searchbox', { name: 'Cerca persones, pobles, posts...' }))).toBe(true);
  const filtres = screen.getByRole('group', { name: 'Filtra per tipus' });
  const despres = (element) => Boolean(formulari.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
  expect([despres(filtres), despres(estat()), despres(screen.getByRole('link', { name: 'Benifallim' }))]).toEqual([true, true, true]);
});

test('261019 · doble vista: la llista per defecte i, amb «Targetes», les UniversalCard amb el mateix enllaç', async () => {
  mocks.url = '?q=benifallim&tipus=pobles';
  await pinta();
  const vista = screen.getByRole('group', { name: 'Vista dels resultats' });
  const boto = (nom) => [...vista.querySelectorAll('button')].find((b) => b.textContent === nom);
  expect([boto('Llista').getAttribute('aria-pressed'), boto('Targetes').getAttribute('aria-pressed')]).toEqual(['true', 'false']);
  /* Per defecte, la llista de sempre (Llei del Píxel). */
  expect(document.querySelectorAll('ol.sdp-cerca__llista > li')).toHaveLength(1);
  expect(document.querySelector('.sp-card')).toBeNull();

  await act(async () => { boto('Targetes').click(); });
  expect(mocks.setParams).toHaveBeenLastCalledWith({ vista: 'graella' }, { replace: false });
  expect(document.querySelector('ol.sdp-cerca__llista')).toBeNull();
  const targetes = document.querySelectorAll('.sdp-card-grid > article.sp-card');
  expect(targetes).toHaveLength(1);
  const enllac = targetes[0].querySelector('a.sp-card-link-overlay');
  expect([enllac.getAttribute('href'), enllac.getAttribute('aria-label'), enllac.getAttribute('data-element')])
    .toEqual(['/pobles/benifallim', 'Benifallim', 'pobles:benifallim']);
  expect(targetes[0].querySelector('h4.sp-card-title').textContent).toBe('Benifallim');
  /* La meta de la fila, en etiquetes; cap peu d'accions. */
  expect([...targetes[0].querySelectorAll('.sp-card-label')].map((li) => li.textContent)).toEqual(["L'Alcoià", '110 hab']);
  expect(targetes[0].querySelector('.sp-card-footer')).toBeNull();
  expect([boto('Llista').getAttribute('aria-pressed'), boto('Targetes').getAttribute('aria-pressed')]).toEqual(['false', 'true']);

  /* Tornar a la llista esborra ?vista= (la per defecte no s'escriu). */
  await act(async () => { boto('Llista').click(); });
  expect(mocks.setParams).toHaveBeenLastCalledWith({ vista: null }, { replace: false });
  expect(document.querySelectorAll('ol.sdp-cerca__llista > li')).toHaveLength(1);
});

/* Revisió adversarial · La boina de la targeta d'una persona és la del
   directori (boinaDelPoble): la cara i la meta, sense el nom ni un enllaç
   propi. El nom ix una vegada (el títol) i la targeta té un sol enllaç a la
   fitxa, més «Escriu-li» quan n'hi ha. */
test('261019 · les persones en targetes: el nom una vegada, un sol enllaç a la fitxa pública, «El teu perfil» a la boina i «Escriu-li»', async () => {
  mocks.session = { ...mocks.session, teCapacitat: (nom) => nom === 'directori' };
  mocks.url = '?q=javi&tipus=persones&vista=graella';
  await pinta();
  await waitFor(() => expect(screen.getByRole('link', { name: 'Escriu-li a Javi Ferrer' })).toBeTruthy());
  const targeta = (nom) => [...document.querySelectorAll('article.sp-card')].find((a) => a.querySelector('.sp-card-title')?.textContent === nom);
  const enllacosDe = (article) => [...article.querySelectorAll('a')].map((enllac) => enllac.getAttribute('href'));
  const propia = targeta('Javi Llinares');
  expect(enllacosDe(propia)).toEqual(['/gent/jo']);
  expect(propia.querySelector('a.sp-card-link-overlay').getAttribute('aria-label')).toBe('Javi Llinares');
  expect([propia.querySelector('a.sp-card-author-link'), propia.querySelector('.sp-card-author-name')]).toEqual([null, null]);
  expect(propia.textContent.split('Javi Llinares')).toHaveLength(2);
  expect(propia.querySelector('.sp-card-author-location').textContent).toBe('El teu perfil');
  /* Una persona no es categoritza: cap etiqueta. */
  expect(propia.querySelector('.sp-card-labels')).toBeNull();
  /* La persona del padró: la targeta a la seua fitxa i «Escriu-li»; el nom, una vegada. */
  const ferrer = targeta('Javi Ferrer');
  expect(enllacosDe(ferrer)).toEqual(['/gent/u-pepa', '/xat?amb=u-pepa']);
  expect(ferrer.querySelector('.sp-card-accio a').getAttribute('href')).toBe('/xat?amb=u-pepa');
  expect(ferrer.querySelector('.sp-card-author-name')).toBeNull();
  expect(targeta('Mestre Javi').querySelector('a.sp-card-link-overlay').getAttribute('href')).toBe('/javillinares');
  expect(document.querySelector('a[href^="/el-meu-perfil"]')).toBeNull();
});

test('261019 · la vista Tot i els tipus sense targetes no ofereixen el selector i pinten sempre la llista', async () => {
  mocks.notes = { ...mocks.notes, notes: [{ id: 'n1', title: 'Idees de Javi', plainText: 'Llista', updatedAt: '2026-09-01T10:00:00Z' }] };
  for (const url of ['?q=javi&vista=graella', '?q=javi&tipus=notes&vista=graella']) {
    cleanup();
    mocks.url = url;
    await pinta();
    await waitFor(() => expect(document.querySelectorAll('ol.sdp-cerca__llista > li').length).toBeGreaterThan(0));
    expect([url, screen.queryByRole('group', { name: 'Vista dels resultats' }), document.querySelector('.sp-card')]).toEqual([url, null, null]);
  }
});

test('261019 · a les targetes, «Mostra’n més» porta el focus a l’enllaç de la primera targeta nova', async () => {
  mocks.core = {
    ...mocks.core,
    towns: Array.from({ length: 23 }, (_, n) => ({ id: `vila-${String(n).padStart(2, '0')}`, title: `Vila ${String(n).padStart(2, '0')}` }))
  };
  mocks.url = '?q=vila&tipus=pobles&vista=graella';
  await pinta();
  expect(document.querySelectorAll('article.sp-card')).toHaveLength(20);
  await act(async () => { screen.getByRole('button', { name: "Mostra'n més" }).click(); });
  expect(document.querySelectorAll('article.sp-card')).toHaveLength(23);
  const focus = document.activeElement;
  expect([focus.className, focus.getAttribute('data-element')]).toEqual(['sp-card-link-overlay', 'pobles:vila-20']);
});

/* Ordre del Mestre (261019 21:34, punt 9: «una sola fitxa canònica») · Els
   duplicats que el Mestre veia en remot, amb la seua sessió. */
test('261019 · en remot, el compte acreditat de la persona pilot i el 0001 del catàleg ixen una sola vegada, a /javillinares', async () => {
  mocks.core = { ...mocks.core, agents: [JAVI_DEL_CATALEG] };
  mocks.xat.cercaMembres = vi.fn(async () => []);
  mocks.identitat = { identitats: [{ tipus: 'persona', id: 'u-javi', nom: 'Javi Llinares', avatar: null }] };
  mocks.session = {
    currentUser: { id: 'u-javi', email: 'socdepoblecom@gmail.com', email_confirmed_at: '2026-10-18T10:00:00Z' },
    estat: 'dins'
  };
  mocks.url = '?q=javi%20llinares&tipus=persones';
  await pinta();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Persones 1' })).toBeTruthy());
  expect(enllacos('Javi Llinares')).toEqual(['/javillinares']);
  expect(screen.getByText('El teu perfil')).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'Escriu-li a Javi Llinares' })).toBeNull();
  /* Un altre compte amb el mateix nom, sense el correu acreditat, continua apart (D1). */
  cleanup();
  mocks.session = { currentUser: { id: 'u-javi', email: 'socdepoblecom@gmail.com' }, estat: 'dins', teCapacitat: (nom) => nom === 'directori' };
  await pinta();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Persones 2' })).toBeTruthy());
  expect(enllacos('Javi Llinares')).toEqual(['/gent/u-javi', '/javillinares']);
});

test('261019 · en remot, l’entitat que gestiones i la del catàleg es fan una quan el backend reconeix l’entitat pilot', async () => {
  const UUID = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  mocks.core = { ...mocks.core, agents: [{ id: 'socdepoble', name: 'Sóc de Poble', type: 'COMPANY', role: 'Empresa' }] };
  mocks.identitat = {
    identitats: [
      { tipus: 'persona', id: 'jo', nom: 'Javi Llinares', avatar: null },
      { tipus: 'entitat', id: UUID, nom: 'Sóc de Poble', slug: 'socdepoble', kind: 'company', poble: 'La Torre de les Maçanes' }
    ]
  };
  mocks.url = '?q=s%C3%B3c%20de%20poble&tipus=entitats';
  try {
    await pinta();
    /* El slug no prova res: fins que el backend no la reconeix, dues fitxes. */
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entitats 2' })).toBeTruthy());
    expect(enllacos('Sóc de Poble')).toEqual([`/empresa/${UUID}`, '/socdepoble']);
    /* La resolució de l'app registra l'id remot (pel slug, dins del poble actiu): l'índex es refà. */
    await act(async () => { registraEntitatDelProjecte({ tipus: 'entitat', id: UUID, slug: 'socdepoble' }); });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entitats 1' })).toBeTruthy());
    expect(enllacos('Sóc de Poble')).toEqual(['/socdepoble']);
    expect(screen.getByText('La gestiones tu')).toBeTruthy();
  } finally {
    oblidaEntitatDelProjecte();
  }
});
