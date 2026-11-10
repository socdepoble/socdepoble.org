/* USA-03 (R15b) · Al Banc de llavors, «Tancar» torna el focus a l'element de
   la llista que havia obert la fitxa, i una varietat germana el porta al títol
   de la fitxa nova: mai al body (Q7 de DISSENY_P069, WCAG 2.4.3). */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import BancLlavorsWorkspaceSection from './BancLlavorsWorkspaceSection.jsx';

const ui = vi.hoisted(() => ({ language: 'ca', t: (_key, fallback) => fallback }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActions: () => ui, useUIActionsOpcional: () => ui }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
/* R16b (tercera ronda) · La TextSection de veres (amagaCos és seu): només se substituïxen la
   UniversalPage (la seua maquinària no entra en joc) i el <head> (useSEO), com a TextSection.test.jsx.
   Abans, la TextSection sencera era un embolcall buit. */
vi.mock('../../components/universal/UniversalPage', () => ({ UniversalPage: ({ children }) => <article>{children}</article> }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const marcs = () => act(() => new Promise(resolve => setTimeout(resolve, 80)));
/* Dues varietats germanes del Catàleg valencià (la mateixa espècie). */
const valencianes = entradesDelCataleg('cataleg-valencia');
const [primera, germana] = valencianes.filter((entrada, _i, totes) => totes.filter(x => x.nomCientific === entrada.nomCientific).length > 1)
  .reduce((parell, entrada) => (parell.length === 2 ? parell
    : parell.length === 1 ? (parell[0].nomCientific === entrada.nomCientific ? [...parell, entrada] : parell) : [entrada]), []);

test('Tancar torna el focus a l’element de la llista i una germana el porta al títol nou', async () => {
  expect(primera && germana).toBeTruthy();
  const { container } = render(<MemoryRouter rutaInicial="/page/banc-de-llavors"><BancLlavorsWorkspaceSection page={{}} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Tots els catàlegs', exact: true }));
  const element = id => container.querySelector(`#app-grid-list .sp-card-link-overlay[data-element="${id}"]`);
  const titol = () => container.querySelector('.sdp-fitxa-didactica__titol');
  fireEvent.click(element(primera.id));
  await marcs();
  expect(titol().textContent).toBe(primera.nom);
  expect(document.activeElement).toBe(titol());

  fireEvent.click(within(container.querySelector('.sdp-fitxa-didactica__variants')).getByRole('button', { name: germana.nom }));
  await marcs();
  expect(titol().textContent).toBe(germana.nom);
  expect(document.activeElement).toBe(titol());
  expect(element(germana.id).getAttribute('aria-current')).toBe('true');

  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  await marcs();
  expect(titol()).toBeNull();
  expect(document.activeElement).not.toBe(document.body);
  expect(document.activeElement).toBe(element(germana.id));
});

/* R16b (tercera ronda) · amagaCos: amb la pàgina, el cos (page.html) es pinta sense fitxa, desapareix
   amb una fitxa oberta (també en passar a una varietat germana) i torna en tancar-la. */
test('el cos de la pàgina es pinta sense fitxa, desapareix amb una fitxa oberta i torna en tancar-la', async () => {
  const { container } = render(<MemoryRouter rutaInicial="/page/banc-de-llavors"><BancLlavorsWorkspaceSection page={{ html: '<p>COS</p>' }} /></MemoryRouter>);
  const detall = () => container.querySelector('#app-grid-main');
  const cos = () => within(detall()).queryByText('COS');
  const element = id => container.querySelector(`#app-grid-list .sp-card-link-overlay[data-element="${id}"]`);
  const titol = () => container.querySelector('.sdp-fitxa-didactica__titol');
  expect(cos()).toBeTruthy();
  expect(cos().closest('article.cms-preview')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tots els catàlegs', exact: true }));
  expect(cos()).toBeTruthy();

  fireEvent.click(element(primera.id));
  await marcs();
  expect(titol().textContent).toBe(primera.nom);
  expect(cos()).toBeNull();
  expect(detall().querySelector('article.cms-preview')).toBeNull();

  fireEvent.click(within(container.querySelector('.sdp-fitxa-didactica__variants')).getByRole('button', { name: germana.nom }));
  await marcs();
  expect(titol().textContent).toBe(germana.nom);
  expect(cos()).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  await marcs();
  expect(titol()).toBeNull();
  expect(cos()).toBeTruthy();
});
