import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from '../../data/patrimoni/bancLlavors.js';
import { Fitxa } from './BancLlavorsSection.jsx';
import BancLlavorsWorkspaceSection from './BancLlavorsWorkspaceSection.jsx';

const ui = vi.hoisted(() => ({ language: 'ca', t: (_key, fallback) => fallback }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActions: () => ui, useUIActionsOpcional: () => ui }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('../text/TextSection', () => ({ default: ({ children }) => <article>{children}</article> }));

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

test('la fitxa autònoma conserva el focus inicial al títol', () => {
  const font = FONTS_BANC_LLAVORS[0];
  const totes = entradesDelCataleg(font.id);
  render(<Fitxa entrada={totes[0]} totes={totes} font={font} tr={ui.t} onTriaEntrada={() => {}} onTanca={() => {}} />);
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 4, name: totes[0].nom }));
});

test.each([768, 1440])('el Workspace a %ipx conserva les fletxes en la llista quan es munta una fitxa nova', width => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width);
  const { container } = render(<MemoryRouter rutaInicial="/page/banc-de-llavors"><BancLlavorsWorkspaceSection page={{}} /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Tots els catàlegs', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Rajola quadrada', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Llista', exact: true }));
  const overlays = () => [...container.querySelectorAll('#app-grid-list .sp-card-link-overlay')];
  expect(overlays()).toHaveLength(125);
  act(() => overlays()[0].focus());
  fireEvent.keyDown(overlays()[0], { key: 'ArrowDown' });
  expect(overlays()[1].getAttribute('aria-current')).toBe('true');
  expect(document.activeElement).toBe(overlays()[1]);
  fireEvent.keyDown(overlays()[1], { key: 'ArrowDown' });
  expect(overlays()[2].getAttribute('aria-current')).toBe('true');
  expect(document.activeElement).toBe(overlays()[2]);
  expect(container.querySelector('.sdp-fitxa-didactica__titol')).toBeTruthy();
});
