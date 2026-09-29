/**
 * T61 (260928) · La regla d'encesa de NavLink amb `matchPaths` (T27): una
 * entrada s'encén a la seua ruta, a les seues subrutes i a qualsevol cosa que
 * hi penge amb '/'. La frontera és de segment ('/perfil' no és '/perfilx') i
 * la query no forma part de la ruta. Router de navegador sobre la URL de jsdom.
 */
import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrowserRouter, Link, NavLink } from './RouterContext.jsx';

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

function munta(url, { basename } = {}) {
  window.history.replaceState(null, '', url);
  render(
    <BrowserRouter basename={basename}>
      <NavLink to="/pobles" matchPaths={['/perfil']} className="nav-item">Pobles</NavLink>
      <Link to="/perfilx">Veí de nom</Link>
      <Link to="/perfil/pepa">Fitxa</Link>
    </BrowserRouter>
  );
  return screen.getByRole('link', { name: 'Pobles' });
}

function estat(enllac) {
  return { ariaCurrent: enllac.getAttribute('aria-current'), active: enllac.classList.contains('active') };
}

const ENCES = { ariaCurrent: 'page', active: true };
const APAGAT = { ariaCurrent: null, active: false };

test.each([
  ['/pobles', true, 'la ruta pròpia'],
  ['/pobles/sella', true, 'una filla de la ruta pròpia'],
  ['/poblesx', false, 'un veí de nom de la ruta pròpia'],
  ['/perfil', true, 'la subruta exacta'],
  ['/perfil/pepa', true, 'una filla de la subruta'],
  ['/perfilx', false, 'un veí de nom de la subruta'],
  ['/perfil?organitzacio=o-1', true, 'la subruta amb query'],
  ['/perfilx?tornar=/perfil', false, 'una query que nomena la subruta'],
  ['/el-meu-perfil', false, 'una ruta que només la conté pel mig'],
  ['/', false, 'l’arrel'],
])('%s · encesa: %s (%s)', (url, encesa) => {
  expect(estat(munta(url))).toEqual(encesa ? ENCES : APAGAT);
});

test('la classe del consumidor es conserva i .active s’hi afig només quan s’encén', () => {
  expect(munta('/perfil/pepa').className).toBe('nav-item active');
  cleanup();
  expect(munta('/perfilx').className).toBe('nav-item');
});

test('la frontera també val després de navegar amb Link, no només en carregar', () => {
  const pobles = munta('/');
  fireEvent.click(screen.getByRole('link', { name: 'Veí de nom' }));
  expect(window.location.pathname).toBe('/perfilx');
  expect(estat(pobles)).toEqual(APAGAT);
  fireEvent.click(screen.getByRole('link', { name: 'Fitxa' }));
  expect(window.location.pathname).toBe('/perfil/pepa');
  expect(estat(pobles)).toEqual(ENCES);
});

/* L'app es pot muntar sota un prefix (basename de PedraSecaEmbed): la regla
   s'aplica a la ruta ja sense el prefix. */
test('amb basename, la frontera es mira sobre la ruta sense el prefix', () => {
  expect(estat(munta('/sdp/perfil/pepa', { basename: '/sdp' }))).toEqual(ENCES);
  cleanup();
  expect(estat(munta('/sdp/perfilx', { basename: '/sdp' }))).toEqual(APAGAT);
});
