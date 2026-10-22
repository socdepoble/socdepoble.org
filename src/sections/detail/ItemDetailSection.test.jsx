/**
 * Poliment T39/T40 · El detall d'una publicació diu el mateix que la seua
 * targeta del Mur: els drets que porta (payload.copyright) i la data triada al
 * calendari (publish_date); el text de sèrie i created_at, només si no en porta.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ pagina: null, item: null, itemId: null, sectionId: 'mur', navigate: vi.fn(), t: (_, alternativa) => alternativa,
  sessio: { currentUser: null, estat: 'fora', rol: null, esSuperadmin: false }, status: undefined, seo: vi.fn(), search: '', redireccio: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ sectionId: mocks.sectionId, itemId: mocks.itemId ?? mocks.item?.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/${mocks.sectionId}/${mocks.item?.id}`, search: mocks.search, state: { preloadedItem: mocks.item } }),
  /* Onada 0.3 (Gauntlet 261016) · /multimedia/:id redirigix: el doble anota on. */
  Navigate: ({ to, replace }) => { mocks.redireccio = { to, replace }; return null; }
}));
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: (props) => { mocks.pagina = props; return null; } }));
/* Onada 5 (F1, hidratació) · Els quatre proveïdors porten el mateix `status`
   (mocks.status). Per defecte undefined, com els dobles d'abans: un estat
   absent no és cap càrrega i les proves de sempre no canvien. */
vi.mock('../../sections/mur/MurContext', () => ({ useMur: () => ({ events: [], feedPosts: [], marketItems: [], status: mocks.status }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [], status: mocks.status }) }));
vi.mock('../../sections/notes/NotesDataContext', () => ({ useNotesData: () => ({ notes: [], status: mocks.status }) }));
vi.mock('../../sections/multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ mediaItems: [], status: mocks.status }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
/* Marató 2230 · P4 (petició de Codex, 261004_2240_auditoria_codex.md:134) · El
   detall viu dins del SessionProvider de PedraSecaEmbed i en llig el rol
   (ItemDetailSection.jsx:20): la Sessió és obligatòria i no es fa opcional.
   Muntat sol, porta el doble de les altres proves de seccions, amb el valor que
   el proveïdor real dona a qui visita sense entrar (SessionContext.jsx:157,
   sessionService.js:114-115) i sempre el mateix objecte, com el seu useMemo.
   Poliment P4 · El doble porta les exportacions de SessionContext.jsx que una
   peça muntada pot importar: ESTAT (:59), tal qual; useSession (:167) i
   useSessioOpcional (:174), que dins del proveïdor tornen el mateix valor.
   Amb només useSession, el dia que UniversalPage o PageFrame llegiren la
   sessió opcional, Vitest petaria amb «No export is defined on the mock».
   SessionProvider es queda fora: el posa PedraSecaEmbed, no cap peça del detall. */
vi.mock('../../app/contexts/SessionContext', () => ({
  ESTAT: Object.freeze({ COMPROVANT: 'comprovant', DINS: 'dins', FORA: 'fora' }),
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
import ItemDetailSection from './ItemDetailSection.jsx';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { rutaXatDePagina } from '../../config/objecteConnectable.js';
import { objecteDe } from '../../config/navigation.js';
import { objecteDelPobleXat } from '../pobles/xatDelPoble.js';

beforeEach(() => {
  mocks.pagina = null; mocks.itemId = null; mocks.sectionId = 'mur'; mocks.status = undefined;
  mocks.search = ''; mocks.redireccio = null;
  mocks.navigate.mockReset(); mocks.seo.mockReset(); window.scrollTo = vi.fn();
});
afterEach(cleanup);

test('el detall porta els drets de la publicació i la data triada al calendari', () => {
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', copyright: 'CC BY 4.0',
    created_at: '2026-09-01T10:00:00.000Z', publish_date: '2026-10-05T08:30:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.copyright).toBe('CC BY 4.0');
  /* T51 · el format únic de la pastilla (dd/mm/aa i hh:mm), no el d/m/aaaa d'abans. */
  expect(mocks.pagina).toMatchObject(dataHoraDeBarra({ publicat: '2026-10-05T08:30:00.000Z' }));
});

test('sense drets ni data triada: el text de sèrie i la data de creació', () => {
  mocks.item = { id: 'vella', type: 'feed', title: 'Crònica vella', created_at: '2026-08-15T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.copyright).toBe(COPYRIGHT_SDP);
  expect(mocks.pagina).toMatchObject(dataHoraDeBarra({ creat: '2026-08-15T10:00:00.000Z' }));
});

/* T63.2 (doctrina del Mestre, 260928) · La Pàgina Universal d'un element porta
   el seu descriptor tipat: Comentar obri el seu xat comú (useAccions). Abans
   no en passava cap i el botó anava a /xat sense destí. */
test('T63.2 · el detall passa l’objecte tipat: el xat comú de la publicació, i Connectar amb el mateix descriptor', () => {
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.objecte).toMatchObject({ tipus: 'publicacio', id: 'cc', titol: 'Recepta de coca', ruta: '/mur/cc' });
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBe('/xat?sobre=publicacio:cc&titol=Recepta%20de%20coca&ruta=%2Fmur%2Fcc');
  mocks.pagina.onConnect();
  const connectar = new URL(mocks.navigate.mock.calls[0][0], 'http://localhost');
  expect(Object.fromEntries(connectar.searchParams)).toMatchObject({ item_id: 'cc', objecte: 'publicacio', ruta: '/mur/cc' });
});

test('T63.2 · cada secció, el seu tipus: producte, esdeveniment, poble', () => {
  for (const [seccio, tipus] of [['mercat', 'producte'], ['events', 'esdeveniment'], ['pobles', 'poble']]) {
    mocks.sectionId = seccio;
    mocks.item = { id: 'x1', title: 'X', created_at: '2026-09-01T10:00:00.000Z' };
    render(<ItemDetailSection />);
    expect(mocks.pagina.objecte.tipus).toBe(tipus);
    expect(new URL(rutaXatDePagina(mocks.pagina.objecte), 'http://localhost').searchParams.get('sobre')).toBe(`${tipus}:x1`);
    cleanup();
  }
});

test('T63.2 · una nota personal (/notes/:id) no té xat comú: el seu objecte no porta enlloc', () => {
  mocks.sectionId = 'notes';
  mocks.item = { id: 'n1', title: 'Llista de la compra', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.objecte.tipus).toBe('nota');
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBeNull();
});

/* Revisió de T63.2 · «Element no trobat» (quan la font ja ha acabat: mentre
   carrega, el detall espera; vegeu les proves de l'Onada 5) no té cap
   element: ni el xat de la ruta, que s'enduria el títol «Element no trobat».
   objecte null deixa el botó on era i el clic avisa. Una nota, ni es pinta. */
test('T63.2 · «Element no trobat»: objecte null (cap xat); a /notes/:id, l’objecte és una nota, sense xat', () => {
  mocks.item = null;
  mocks.itemId = 'x9';
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Element no trobat');
  expect(mocks.pagina.objecte).toBeNull();
  cleanup();
  mocks.sectionId = 'notes';
  mocks.itemId = 'n1';
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Element no trobat');
  expect(mocks.pagina.objecte).toMatchObject({ tipus: 'nota', id: 'n1' });
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBeNull();
});

/* Enxufe universal (260929) · Dins d'un amfitrió, window.scrollTo mou la
   pàgina de l'amfitrió, no la columna de Sóc de Poble: el detall no la crida
   mai, ni en muntar, ni en canviar d'element, ni quan no el troba. */
test('el detall no mou mai la finestra de l’amfitrió', () => {
  mocks.item = { id: 'a', type: 'feed', title: 'A', created_at: '2026-09-01T10:00:00.000Z' };
  const { rerender } = render(<ItemDetailSection />);
  mocks.item = { id: 'b', type: 'feed', title: 'B', created_at: '2026-09-02T10:00:00.000Z' };
  rerender(<ItemDetailSection />);
  mocks.sectionId = 'mercat';
  rerender(<ItemDetailSection />);
  mocks.item = null;
  mocks.itemId = 'x9';
  rerender(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Element no trobat');
  expect(window.scrollTo).not.toHaveBeenCalled();
});

/* Onada 6 (pla 261009_0245, ítem 4: «El fil de xat específic també es dirà
   'Gent de la Torre'») · Esta prova fixava el contrari (T63.2: el xat d'un
   poble era «Sella», no «Gent de Sella»). L'ordre del Mestre la inverteix:
   el xat del poble porta el nom de la seua gent, el de l'H1, entre per on
   s'entre (objecteDelPobleXat, el mateix de la targeta de /pobles). El
   subjecte no canvia (poble:sella): és el mateix fil. */
test('Onada 6 · el xat del poble es diu com la seua gent: «Gent de Sella», com l’H1 i la targeta de /pobles', () => {
  mocks.sectionId = 'pobles';
  mocks.item = { id: 'sella', title: 'Sella', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Gent de Sella');
  expect(mocks.pagina.objecte.titol).toBe('Gent de Sella');
  expect(mocks.pagina.objecte).toMatchObject({ tipus: 'poble', id: 'sella', ruta: '/pobles/sella' });
  // La targeta de Pobles (objecteDelPobleXat(town)) i el detall obrin el mateix xat, amb el mateix nom.
  expect(rutaXatDePagina(mocks.pagina.objecte)).toBe(rutaXatDePagina(objecteDelPobleXat(mocks.item)));
  expect(new URL(rutaXatDePagina(mocks.pagina.objecte), 'http://localhost').searchParams.get('sobre')).toBe('poble:sella');
  // Connectar no canvia: el títol de la pàgina, com abans.
  mocks.pagina.onConnect();
  expect(new URL(mocks.navigate.mock.calls[0][0], 'http://localhost').searchParams.get('title')).toBe('Gent de Sella');
});

test('Onada 6 · amb l’author de la fitxa, el xat porta el nom curt: «Gent de la Torre»', () => {
  mocks.sectionId = 'pobles';
  mocks.item = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', author: 'Gent de la Torre', created_at: '2026-08-20T08:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.objecte.titol).toBe('Gent de la Torre');
  expect(new URL(rutaXatDePagina(mocks.pagina.objecte), 'http://localhost').searchParams.get('titol')).toBe('Gent de la Torre');
});

test('Onada 6 · fora de Pobles, el xat continua portant el nom propi de l’element', () => {
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.objecte.titol).toBe(objecteDe(mocks.item, 'mur').titol);
});

/* Onada 5 (F1, hidratació) · Una URL directa en fred (/pobles/<slug>,
   /mur/<id>…) arriba sense preloadedItem i amb el proveïdor encara en
   'loading' i la llista buida. El detall espera amb l'àtom Carregant de Pedra
   Seca (role=status): cap «Element no trobat», cap píndola Error i, a useSEO,
   cap títol (el de sèrie) en lloc de «No trobat». */
/* Onada 0.3 (Gauntlet 261016) · Multimèdia ja no és a la llista: /multimedia/:id
   no espera cap càrrega, redirigix (proves de baix). */
test('Onada 5 · en fred, mentre la font carrega: Carregant (role=status), sense «Element no trobat» ni el títol «No trobat»', () => {
  for (const seccio of ['pobles', 'mur', 'mercat', 'events', 'notes']) {
    mocks.sectionId = seccio;
    mocks.item = null;
    mocks.itemId = 'la-torre-de-les-macanes';
    mocks.status = 'loading';
    mocks.pagina = null;
    mocks.seo.mockReset();
    render(<ItemDetailSection />);
    expect(mocks.pagina, seccio).toBeNull();
    expect(screen.queryByText('Element no trobat'), seccio).toBeNull();
    expect(screen.getByRole('status').textContent, seccio).toContain('Carregant contingut...');
    expect(mocks.seo, seccio).toHaveBeenLastCalledWith(expect.objectContaining({ title: null, description: '' }));
    cleanup();
  }
});

/* El límit: acabada la font ('ready' o 'error'), si l'element no hi és, el no
   trobat de sempre (amb el títol SEO «No trobat»). Error no és carregar. */
test('Onada 5 · acabada la font (ready o error) i sense l’element: «Element no trobat», com abans', () => {
  for (const status of ['ready', 'error']) {
    for (const seccio of ['pobles', 'notes']) {
      mocks.sectionId = seccio;
      mocks.item = null;
      mocks.itemId = 'x9';
      mocks.status = status;
      mocks.pagina = null;
      mocks.seo.mockReset();
      render(<ItemDetailSection />);
      expect(mocks.pagina?.title, `${seccio} · ${status}`).toBe('Element no trobat');
      expect(screen.queryByRole('status'), `${seccio} · ${status}`).toBeNull();
      expect(mocks.seo, `${seccio} · ${status}`).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'No trobat' }));
      cleanup();
    }
  }
});

/* Amb l'element a la mà (el clic des d'una targeta, preloadedItem), el detall
   no espera ningú: es pinta encara que la font carregue. */
test('Onada 5 · amb preloadedItem, el detall es pinta encara que la font carregue', () => {
  mocks.status = 'loading';
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.title).toBe('Recepta de coca');
  expect(screen.queryByRole('status')).toBeNull();
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Recepta de coca' }));
});

/* Onada 5 (F4) · La meta description és l'entradilla que pinta la pàgina
   (pagina.lead): la de Viquipèdia d'un poble, no el seu nom (el getSubtitle de
   Pobles ara és el títol, l'H2). Una publicació, la seua entradilla, com
   abans; sense entradilla ni lead, el subtítol. */
test('Onada 5 · la meta description és l’entradilla de la pàgina; sense, el subtítol', () => {
  const VIQUIPEDIA = 'Sella és un municipi del País Valencià a la comarca de la Marina Baixa.';
  mocks.sectionId = 'pobles';
  mocks.item = { id: 'sella', title: 'Sella', author: 'Gent de Sella', content: VIQUIPEDIA };
  render(<ItemDetailSection />);
  expect(mocks.pagina.lead).toBe(VIQUIPEDIA);
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ description: VIQUIPEDIA }));
  cleanup();
  mocks.sectionId = 'mur';
  mocks.item = { id: 'cc', type: 'feed', title: 'Recepta de coca', entradilla: 'La de la iaia, pas a pas.', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ description: 'La de la iaia, pas a pas.' }));
  cleanup();
  mocks.item = { id: 'dd', type: 'feed', title: 'Coca de llanda', description: 'Per a berenar.', created_at: '2026-09-01T10:00:00.000Z' };
  render(<ItemDetailSection />);
  expect(mocks.pagina.lead).toBeFalsy();
  expect(mocks.seo).toHaveBeenLastCalledWith(expect.objectContaining({ description: 'Per a berenar.' }));
});

/* Onada 0.3 (Gauntlet 261016, M07 i M04; pla 261016_1530: «Eliminar la
   duplicitat de pàgines com /multimedia/town-benifallim […] ha de redirigir a
   /pobles/[slug]») · /multimedia/:id ja no pinta cap pàgina: redirigix, amb
   replace i conservant la consulta, també en fred (sense esperar cap font). */
test('Onada 0.3 · /multimedia/town-<slug> porta a /pobles/<slug> amb replace, i conserva la consulta', () => {
  mocks.sectionId = 'multimedia';
  mocks.item = null;
  mocks.itemId = 'town-benifallim';
  mocks.status = 'loading';
  render(<ItemDetailSection />);
  expect(mocks.redireccio).toEqual({ to: '/pobles/benifallim', replace: true });
  expect(mocks.pagina).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
  cleanup();
  mocks.search = '?xat=obert&ruta=%2Fx';
  mocks.itemId = 'town-la-torre-de-les-macanes';
  render(<ItemDetailSection />);
  expect(mocks.redireccio).toEqual({ to: '/pobles/la-torre-de-les-macanes?xat=obert&ruta=%2Fx', replace: true });
});

test('Onada 0.3 · /multimedia/<id> obri l’Arxiu amb el visor en eixa foto (?foto=<id>); cap altra secció redirigix', () => {
  mocks.sectionId = 'multimedia';
  mocks.item = null;
  mocks.itemId = 'nano-mur';
  mocks.search = '?origen=xat';
  render(<ItemDetailSection />);
  expect(mocks.redireccio).toEqual({ to: '/multimedia?origen=xat&foto=nano-mur', replace: true });
  expect(mocks.seo).not.toHaveBeenCalled();
  cleanup();
  mocks.redireccio = null;
  mocks.sectionId = 'pobles';
  mocks.itemId = 'town-tibi';
  mocks.status = 'ready';
  render(<ItemDetailSection />);
  expect(mocks.redireccio).toBeNull();
  expect(mocks.pagina.title).toBe('Element no trobat');
});
