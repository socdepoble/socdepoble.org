/* R24 · Gauntlet Loop, ronda 2 (G-client-5) · Prova de regressió permanent · la insígnia de l'app en un document alié.
   ComptadorGlobalXat es munta sempre dins d'AppContent (App.jsx:1019), també
   quan el Mas viu incrustat (PedraSecaEmbed.jsx:391 pinta el mateix <App>,
   amb __SDP_EMBEDDED__ o dins d'un amfitrió WordPress/React). La insígnia
   (navigator.setAppBadge / clearAppBadge) és de l'ORIGEN del document: dins
   d'un amfitrió, escriu i esborra la insígnia de l'app instal·lada de
   l'amfitrió. El títol sí que respecta l'amo del <head> (fixaPrefixDelTitol);
   la insígnia no té cap guarda. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const mock = vi.hoisted(() => ({ total: 0 }));
vi.mock('./XatContext.jsx', () => ({ useXat: () => ({ totalNoLlegits: mock.total }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useLocation: () => ({ pathname: '/mur' }) }));
const { ComptadorGlobalXat } = await import('./ComptadorGlobalXat.jsx');

let setAppBadge;
let clearAppBadge;
beforeEach(() => {
  setAppBadge = vi.fn(async () => {});
  clearAppBadge = vi.fn(async () => {});
  Object.defineProperty(navigator, 'setAppBadge', { configurable: true, value: setAppBadge });
  Object.defineProperty(navigator, 'clearAppBadge', { configurable: true, value: clearAppBadge });
  window.__SDP_EMBEDDED__ = true;
});
afterEach(() => {
  cleanup();
  delete navigator.setAppBadge;
  delete navigator.clearAppBadge;
  delete window.__SDP_EMBEDDED__;
});

it('G-client-5 · incrustat en un amfitrió, el Mas no escriu la insígnia de l’app de l’amfitrió', () => {
  mock.total = 4;
  render(<ComptadorGlobalXat />);
  expect(setAppBadge, 'setAppBadge(4) sobre l’origen de l’amfitrió').not.toHaveBeenCalled();
});

it('G-client-5 · incrustat, en muntar amb 0 no esborra la insígnia que l’amfitrió ja tenia', () => {
  mock.total = 0;
  render(<ComptadorGlobalXat />);
  expect(clearAppBadge, 'clearAppBadge() de l’amfitrió en cada muntatge').not.toHaveBeenCalled();
});
