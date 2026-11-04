/* control-05 (261104) · El focus de teclat del Control del xat. En estret,
   triar una opció tanca la llista (inert) amb el focus a dins, i tornar amb
   la fletxa desmunta el botó que el tenia: cap dels dos camins no pot deixar
   el focus a <body>. En obrir, va a la fletxa «Torna a les opcions»; en
   tornar, a l'opció d'on es venia. En ample no es mou res en obrir.
   Closca real (AppGridShell) i PanellInicialMobil real; ClosCaXat, simulada
   com una closca nua. jsdom no aplica `inert`: un espia de focus() comprova
   que cap crida no cau dins d'una columna tancada (en un navegador no faria
   res i la prova quedaria en fals verd). */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../config/storage.js', () => ({ getVal: () => ({ left: 340, middle: 420 }), setVal: vi.fn() }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, reserva) => reserva }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/layout/AppGridColumn.jsx', () => ({ default: () => null }));
vi.mock('./components/ClosCaXat.jsx', async () => {
  const { default: AppGridShell } = await import('../../components/layout/AppGridShell.jsx');
  return {
    default: ({ middleColumn, rightColumn }) => <AppGridShell middleColumn={middleColumn} rightColumn={rightColumn} />,
    BotoObriRail: () => null
  };
});
import XatControlSection from './XatControlSection.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

/* L'amplària de la closca i un espia que anota cada focus() demanat dins
   d'un [inert]. */
function amb(amplada) {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  const dinsInert = [];
  const original = HTMLElement.prototype.focus;
  vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function focus(...args) {
    if (this.closest('[inert]')) dinsInert.push(this.getAttribute('aria-label') || this.textContent);
    return original.apply(this, args);
  });
  return dinsInert;
}

const opcio = () => screen.getByRole('button', { name: /^Privacitat i seguretat/ });
const fletxa = () => screen.getByRole('button', { name: 'Torna a les opcions' });

test('en estret, triar una opció porta el focus a la fletxa i tornar el porta a l’opció', () => {
  const dinsInert = amb(375);
  const { container } = render(<XatControlSection />);
  expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('estret');
  opcio().focus();
  act(() => { fireEvent.click(opcio()); });
  expect(document.activeElement).toBe(fletxa());
  expect(document.activeElement.closest('[inert]')).toBeNull();
  act(() => { fireEvent.click(fletxa()); });
  expect(document.activeElement).toBe(opcio());
  expect(document.activeElement.closest('[inert]')).toBeNull();
  expect(dinsInert).toEqual([]);
});

test('en estret, un toc que no enfoca el botó (iOS) també troba la fletxa', () => {
  const dinsInert = amb(375);
  render(<XatControlSection />);
  act(() => { fireEvent.click(opcio()); });
  expect(document.activeElement).toBe(fletxa());
  expect(dinsInert).toEqual([]);
});

test('en ample, triar una opció deixa el focus on era i tornar el porta a l’opció', () => {
  const dinsInert = amb(1440);
  const { container } = render(<XatControlSection />);
  expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('ample');
  opcio().focus();
  act(() => { fireEvent.click(opcio()); });
  expect(document.activeElement).toBe(opcio());
  fletxa().focus();
  act(() => { fireEvent.click(fletxa()); });
  expect(document.activeElement).toBe(opcio());
  expect(dinsInert).toEqual([]);
});

test('en ample, obrir amb el ratolí no roba el focus de cap altre lloc', () => {
  amb(1440);
  render(<XatControlSection />);
  act(() => { fireEvent.click(opcio()); });
  expect(document.activeElement).toBe(document.body);
});
