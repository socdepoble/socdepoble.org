/**
 * Enxufe universal · el router no segresta mai la URL de l'amfitrió.
 * Navegador amb base: l'app és ama només dins de la base; fora d'ella queda
 * inert (no pinta rutes, no encén enllaços, no escriu a l'historial).
 * Memòria: cap crida a window.history i window.location no es mou.
 * L'historial es vigila amb espies sobre pushState i replaceState.
 */
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  BrowserRouter, Link, MemoryRouter, NavLink, Navigate, Route, Routes,
  useLocation, useNavigate, useParams, useSearchParams
} from './RouterContext.jsx';

let push;
let replace;

/** Posa l'amfitrió en una URL i, a partir d'ací, compta les escriptures a l'historial. */
function situa(url, state = null) {
  window.history.replaceState(state, '', url);
  push = vi.spyOn(window.history, 'pushState');
  replace = vi.spyOn(window.history, 'replaceState');
}
const escriptures = () => push.mock.calls.length + replace.mock.calls.length;
const urlsEscrites = () => [...push.mock.calls, ...replace.mock.calls].map(([, , url]) => url);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, '', '/');
});

function OnSoc() {
  const { pathname, search } = useLocation();
  return <output data-testid="on">{pathname + (search ? `?${search}` : '')}</output>;
}
const on = () => screen.getByTestId('on').textContent;

function Parametres() {
  const [params] = useSearchParams();
  return <output data-testid="params">{params.toString()}</output>;
}

function Poble() {
  const { pobleId } = useParams();
  return <p>{`Poble ${pobleId}`}</p>;
}

const estat = (enllac) => ({ ariaCurrent: enllac.getAttribute('aria-current'), active: enllac.classList.contains('active') });
const APAGAT = { ariaCurrent: null, active: false };
const ENCES = { ariaCurrent: 'page', active: true };

test('(1) a la base amb barra final, el Navigate de l’arrel acaba dins de la base', () => {
  situa('/comunitat/');
  render(
    <BrowserRouter basename="/comunitat">
      <OnSoc />
      <Routes>
        <Route path="/" element={<Navigate to="/xat" replace />} />
        <Route path="/xat" element={<p>Pantalla del xat</p>} />
      </Routes>
    </BrowserRouter>
  );
  expect(window.location.pathname).toBe('/comunitat/xat');
  expect(screen.getByText('Pantalla del xat')).toBeTruthy();
  expect(on()).toBe('/xat');
  expect(push).not.toHaveBeenCalled();
  expect(urlsEscrites()).toEqual(['/comunitat/xat']);
});

test('(2) un veí de nom de la base (/comunitats) no pinta res ni toca l’historial', () => {
  situa('/comunitats/xat?pagina=2');
  render(
    <BrowserRouter basename="/comunitat">
      <OnSoc />
      <Parametres />
      <NavLink to="/xat">Xat</NavLink>
      <Routes>
        <Route path="/" element={<Navigate to="/xat" replace />} />
        <Route path="/xat" element={<p>Pantalla del xat</p>} />
        <Route path="*" element={<p>Comodí de l’app</p>} />
      </Routes>
    </BrowserRouter>
  );
  expect(screen.queryByText('Pantalla del xat')).toBeNull();
  expect(screen.queryByText('Comodí de l’app')).toBeNull();
  expect(on()).toBe('');
  // La consulta de l'amfitrió tampoc no arriba a l'app.
  expect(screen.getByTestId('params').textContent).toBe('');
  expect(estat(screen.getByRole('link', { name: 'Xat' }))).toEqual(APAGAT);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/comunitats/xat');
});

test('(3) a l’arrel de l’amfitrió amb base declarada no hi ha segrest', () => {
  situa('/');
  render(
    <BrowserRouter basename="/comunitat">
      <OnSoc />
      {/* Ni el de dins de <Routes> ni un de solt fora */}
      <Navigate to="/mur" />
      <Routes>
        <Route path="/" element={<Navigate to="/xat" replace />} />
      </Routes>
    </BrowserRouter>
  );
  expect(window.location.pathname).toBe('/');
  expect(on()).toBe('');
  expect(escriptures()).toBe(0);
});

test('(4) Link absolut: l’href porta la base i el clic hi acaba', () => {
  situa('/comunitat/xat');
  render(
    <BrowserRouter basename="/comunitat">
      <OnSoc />
      <Link to="/mur">Mur</Link>
    </BrowserRouter>
  );
  const mur = screen.getByRole('link', { name: 'Mur' });
  expect(mur.getAttribute('href')).toBe('/comunitat/mur');
  fireEvent.click(mur);
  expect(window.location.pathname).toBe('/comunitat/mur');
  expect(on()).toBe('/mur');
  expect(replace).not.toHaveBeenCalled();
  expect(urlsEscrites()).toEqual(['/comunitat/mur']);
});

test('Link relatiu: l’href i el clic es resolen sobre la ruta de l’app', () => {
  situa('/comunitat/xat/12');
  render(
    <BrowserRouter basename="/comunitat">
      <OnSoc />
      <Link to="../pobles">Pobles</Link>
      <Link to="fil">Fil</Link>
    </BrowserRouter>
  );
  expect(screen.getByRole('link', { name: 'Pobles' }).getAttribute('href')).toBe('/comunitat/pobles');
  expect(screen.getByRole('link', { name: 'Fil' }).getAttribute('href')).toBe('/comunitat/xat/fil');
  fireEvent.click(screen.getByRole('link', { name: 'Pobles' }));
  expect(window.location.pathname).toBe('/comunitat/pobles');
  expect(on()).toBe('/pobles');
});

/* Com a App.jsx: <Route path="skills" element={<Navigate to="../wikidepoble" replace />} />
   dins de les rutes d'actor. Abans la URL relativa anava crua a replaceState i
   el navegador la resolia sobre la URL de l'amfitrió: eixia de la base. */
test('(5) el Navigate relatiu de /skills acaba a la Wiki de Poble dins de la base', () => {
  situa('/comunitat/skills');
  function RutesActor() {
    return (
      <Routes>
        <Route path="skills" element={<Navigate to="../wikidepoble" replace />} />
        <Route path="wikidepoble" element={<p>Wiki de Poble</p>} />
      </Routes>
    );
  }
  render(
    <BrowserRouter basename="/comunitat">
      <Routes>
        <Route path="/*" element={<RutesActor />} />
      </Routes>
    </BrowserRouter>
  );
  expect(window.location.pathname).toBe('/comunitat/wikidepoble');
  expect(screen.getByText('Wiki de Poble')).toBeTruthy();
  expect(urlsEscrites()).toEqual(['/comunitat/wikidepoble']);
});

test('Llei del Píxel: sense base, el mateix Navigate relatiu acaba on acabava', () => {
  situa('/skills');
  render(
    <BrowserRouter>
      <Routes>
        <Route path="/skills" element={<Navigate to="../wikidepoble" replace />} />
        <Route path="/wikidepoble" element={<p>Wiki de Poble</p>} />
      </Routes>
    </BrowserRouter>
  );
  expect(window.location.pathname).toBe('/wikidepoble');
  expect(screen.getByText('Wiki de Poble')).toBeTruthy();
});

test('(6) un popstate cap a una pàgina de l’amfitrió deixa el router inert, i en tornar reviu', () => {
  situa('/comunitat/xat');
  render(
    <BrowserRouter basename="/comunitat">
      <OnSoc />
      <NavLink to="/xat">Xat</NavLink>
      <Routes>
        <Route path="/xat" element={<p>Pantalla del xat</p>} />
        <Route path="*" element={<Navigate to="/xat" />} />
      </Routes>
    </BrowserRouter>
  );
  expect(screen.getByText('Pantalla del xat')).toBeTruthy();
  expect(estat(screen.getByRole('link', { name: 'Xat' }))).toEqual(ENCES);

  // L'amfitrió torna arrere a una pàgina seua.
  window.history.replaceState(null, '', '/blog/entrada');
  push.mockClear();
  replace.mockClear();
  act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(screen.queryByText('Pantalla del xat')).toBeNull();
  expect(on()).toBe('');
  expect(estat(screen.getByRole('link', { name: 'Xat' }))).toEqual(APAGAT);
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/blog/entrada');

  // I avant, de nou dins de la base.
  window.history.replaceState(null, '', '/comunitat/xat');
  act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(screen.getByText('Pantalla del xat')).toBeTruthy();
  expect(on()).toBe('/xat');
});

test('fora de base, useSearchParams no peta i el primer clic de l’usuari entra a l’app', () => {
  situa('/');
  let setParams;
  function Sonda() { [, setParams] = useSearchParams(); return null; }
  render(
    <BrowserRouter basename="/comunitat">
      <OnSoc />
      <Sonda />
      <Link to="/xat">Xat</Link>
    </BrowserRouter>
  );
  expect(typeof setParams).toBe('function');
  expect(screen.getByRole('link', { name: 'Xat' }).getAttribute('href')).toBe('/comunitat/xat');
  expect(escriptures()).toBe(0);
  fireEvent.click(screen.getByRole('link', { name: 'Xat' }));
  expect(window.location.pathname).toBe('/comunitat/xat');
  expect(on()).toBe('/xat');
});

test('(8) MemoryRouter: navigate, Navigate, arrere i paràmetres sense tocar l’historial ni la URL', () => {
  situa('/pagina-de-l-amfitrio?p=12');
  let navega;
  let setParams;
  function Sonda() { navega = useNavigate(); [, setParams] = useSearchParams(); return null; }
  render(
    <MemoryRouter>
      <OnSoc />
      <Sonda />
      <Link to="/pobles">Pobles</Link>
      <Routes>
        <Route path="/" element={<Navigate to="/xat" />} />
        <Route path="/xat" element={<p>Pantalla del xat</p>} />
        <Route path="/mur" element={<p>Mur</p>} />
        <Route path="/pobles" element={<p>Pobles</p>} />
        <Route path="/wikidepoble" element={<p>Wiki de Poble</p>} />
      </Routes>
    </MemoryRouter>
  );
  expect(on()).toBe('/xat');
  act(() => navega('/mur'));
  expect(on()).toBe('/mur');
  act(() => setParams({ data: '2026-09-29' }));
  expect(on()).toBe('/mur?data=2026-09-29');
  act(() => navega('../wikidepoble'));
  expect(on()).toBe('/wikidepoble');
  act(() => navega(-1));
  expect(on()).toBe('/mur?data=2026-09-29');
  act(() => navega(-1));
  expect(on()).toBe('/xat');
  // Un destí de fora de l'app no mou res.
  act(() => navega('https://amfitrio.test/'));
  expect(on()).toBe('/xat');
  const pobles = screen.getByRole('link', { name: 'Pobles' });
  expect(pobles.getAttribute('href')).toBe('/pobles');
  fireEvent.click(pobles);
  expect(on()).toBe('/pobles');

  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
  expect(window.location.search).toBe('?p=12');
});

test.each([
  ['/pobles/la-torre-de-les-macanes', '/pobles/la-torre-de-les-macanes', 'Poble la-torre-de-les-macanes'],
  ['/pobles/sella?vista=mapa', '/pobles/sella?vista=mapa', 'Poble sella'],
  ['//x', '/', 'Arrel'],
  ['https://x', '/', 'Arrel'],
  ['/\\amfitrio.test', '/', 'Arrel'],
  ['pobles/sella', '/', 'Arrel'],
  [undefined, '/', 'Arrel'],
])('(9) MemoryRouter rutaInicial %j aterra a %j', (rutaInicial, esperat, text) => {
  situa('/pagina-de-l-amfitrio');
  render(
    <MemoryRouter rutaInicial={rutaInicial}>
      <OnSoc />
      <Routes>
        <Route path="/" element={<p>Arrel</p>} />
        <Route path="/pobles/:pobleId" element={<Poble />} />
      </Routes>
    </MemoryRouter>
  );
  expect(on()).toBe(esperat);
  expect(screen.getByText(text)).toBeTruthy();
  expect(escriptures()).toBe(0);
  expect(window.location.pathname).toBe('/pagina-de-l-amfitrio');
});

test('(10) en memòria, l’state ve de l’entrada del router i no de window.history.state', () => {
  situa('/pagina-de-l-amfitrio', { host: 1 });
  let navega;
  let estatActual;
  function Sonda() { navega = useNavigate(); estatActual = useLocation().state; return null; }
  render(<MemoryRouter><Sonda /></MemoryRouter>);
  expect(window.history.state).toEqual({ host: 1 });
  expect(estatActual).toBeNull();

  const preloadedItem = { id: 'la-torre-de-les-macanes' };
  act(() => navega('/pobles/la-torre-de-les-macanes', { state: { preloadedItem } }));
  expect(estatActual).toEqual({ preloadedItem });
  act(() => navega('/mur'));
  expect(estatActual).toBeNull();
  act(() => navega(-1));
  expect(estatActual).toEqual({ preloadedItem });
  expect(window.history.state).toEqual({ host: 1 });
  expect(escriptures()).toBe(0);
});

test('al navegador l’app és ama de l’historial: l’state continua sent el de window.history', () => {
  situa('/comunitat/mur');
  let navega;
  let estatActual;
  function Sonda() { navega = useNavigate(); estatActual = useLocation().state; return null; }
  render(<BrowserRouter basename="/comunitat"><Sonda /></BrowserRouter>);
  act(() => navega('/pobles/sella', { state: { preloadedItem: { id: 'sella' } } }));
  expect(window.location.pathname).toBe('/comunitat/pobles/sella');
  expect(estatActual).toEqual({ preloadedItem: { id: 'sella' } });
});
