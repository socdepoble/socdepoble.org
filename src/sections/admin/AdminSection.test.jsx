/* AdminSection · el Tauler amb el bloc «Indicadors» (decisió del Mestre
   261003, «Graphfy»). Llei del Píxel: el benvingut i el menú d'abans es
   pinten igual i la columna del mig no porta res més; el bloc ocupa la
   columna del detall, que abans era buida. El benvingut de referència és el
   JSX d'abans del canvi, copiat tal qual: si algú el toca, esta prova ho
   diu. Dades sintètiques. */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import AppGridColumn from '../../components/layout/AppGridColumn';

const m = vi.hoisted(() => ({ usuaris: vi.fn(), entitats: vi.fn() }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => cap === 'admin',
  adminListUsers: (...args) => m.usuaris(...args),
  adminListOrganizations: (...args) => m.entitats(...args)
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <main>{children}</main>
}));
import AdminSection from './AdminSection.jsx';

/* El JSX d'AdminDashboard abans dels Indicadors (commit b22b168b9). */
function BenvingutAbans() {
  return (
    <div className="sdp-buit">
      <AppGridColumn titol="Tauler" />
      <div className="sdp-buit__text">
        <p>Benvingut a l'administració de Sóc de Poble.</p>
        <div className="sdp-alerta sdp-alerta--info" role="status">
          <p>Nota: Aquesta àrea està restringida a Superadmins. Si no tens permisos a la base de dades, les crides fallaran amb 42501.</p>
        </div>
      </div>
    </div>
  );
}

const ampladaOriginal = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret».
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterAll(() => {
  if (ampladaOriginal) Object.defineProperty(HTMLElement.prototype, 'clientWidth', ampladaOriginal);
  vi.unstubAllGlobals();
});
beforeEach(() => {
  m.usuaris.mockReset().mockResolvedValue([]);
  m.entitats.mockReset().mockResolvedValue([]);
});
afterEach(cleanup);

test('la columna del mig: només el benvingut d’abans, idèntic', () => {
  const { container } = render(<AdminSection />);
  const mig = container.querySelector('.app-grid-column--middle');
  expect(mig.children).toHaveLength(1);
  const referencia = render(<BenvingutAbans />).container.firstElementChild;
  expect(mig.firstElementChild.outerHTML).toBe(referencia.outerHTML);
});

test('la columna del detall: el bloc Indicadors, amb la seua capçalera, sense cridar el port', () => {
  const { container } = render(<AdminSection />);
  const detall = container.querySelector('.app-grid-column--right');
  expect(detall.children).toHaveLength(1);
  expect(detall.firstElementChild.className).toBe('sdp-marc-columna');
  expect(detall.querySelector('.sdp-marc-columna__cap .app-grid-col-header__titol').textContent).toBe('Indicadors');
  const indicadors = within(detall).getByRole('region', { name: 'Indicadors' });
  expect(within(indicadors).getByRole('button', { name: 'Calcula els indicadors' })).toBeTruthy();
  // Minimització: obrir el Tauler no baixa cap llista de persones.
  expect(m.usuaris).not.toHaveBeenCalled();
  expect(m.entitats).not.toHaveBeenCalled();
});

test('el menú d’administració no canvia', () => {
  render(<AdminSection />);
  const menu = screen.getByRole('navigation', { name: 'Menú d\'administració' });
  expect(within(menu).getAllByRole('button').map((b) => b.textContent)).toEqual(['Panell General', 'Usuaris', 'Entitats']);
  expect(within(menu).getByRole('button', { name: 'Panell General' }).className).toBe('univ-manager-facet-item univ-manager-facet-item--active');
});
