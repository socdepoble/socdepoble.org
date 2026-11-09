import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { RouterContext } from '../../app/contexts/objectesDeContext.js';
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
vi.mock('../PedraSeca/hooks/useTraduccioPagina.js', () => ({ useTraduccioPagina: () => ({ llengua: null, lang: null, carregant: null, titol: null, blocs: null, original: () => {} }) }));
import { PageFrame } from './PageFrame.jsx';

let queue, jumps;
const oldScroll = Element.prototype.scrollIntoView;
beforeEach(() => {
  queue = []; jumps = [];
  window.history.replaceState({ host: 'CONTROL' }, '', '/host#host-r56');
  vi.stubGlobal('requestAnimationFrame', fn => { queue.push(fn); return queue.length; });
  vi.stubGlobal('cancelAnimationFrame', () => {});
  Element.prototype.scrollIntoView = function () { jumps.push(this.dataset.sdpAncora); };
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); Element.prototype.scrollIntoView = oldScroll; });
const page = slug => <PageFrame chrome="system" title="CONTROL"><h3 data-sdp-ancora={slug}>Secció pròpia</h3><h3 data-sdp-ancora="host-r56">Secció host</h3></PageFrame>;
const frame = () => act(() => { const current = queue.splice(0); current.forEach(fn => fn()); });

test('R56 · MemoryRouter salta al fragment de l’entrada pròpia, conservant el hash host', () => {
  const host = window.location.href, state = window.history.state;
  render(<MemoryRouter rutaInicial="/page/control#local-r56">{page('local-r56')}</MemoryRouter>);
  frame(); expect(jumps).toEqual(['local-r56']);
  expect(window.location.href).toBe(host); expect(window.history.state).toEqual(state);
});

test('R56 · sense fragment propi mai interpreta el hash de l’amfitrió', () => {
  render(<MemoryRouter rutaInicial="/page/control">{page('sense-r56')}</MemoryRouter>);
  frame(); expect(jumps).toEqual([]);
});

test('R56 · un context Memory antic sense fragment conserva el valor buit', () => {
  render(<RouterContext.Provider value={{ memoria: true, currentPath: '/page/control', searchParams: new URLSearchParams(), navigate: () => {} }}>{page('vell-r56')}</RouterContext.Provider>);
  frame(); expect(jumps).toEqual([]);
});
