import { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { MemoryRouter, useLocation, useNavigate, useRouter } from '../app/contexts/RouterContext.jsx';
import { useScrollDeNavegacio } from './useScrollDeNavegacio.js';

const api = {};
afterEach(cleanup);
function mesura(node) {
  if (!node || node.dataset.mesurat) return;
  node.dataset.mesurat = 'si'; let top = 0;
  Object.defineProperties(node, {
    clientHeight: { configurable: true, get: () => 600 },
    scrollHeight: { configurable: true, get: () => node.classList.contains('app-main__content')
      ? node.firstElementChild?.classList.contains('sdp-universal-page-container--contained') ? 600 : Number(node.firstElementChild?.dataset.alt || 600)
      : Number(node.dataset.alt || 600) },
    scrollTop: { configurable: true, get: () => top, set: value => { top = Math.min(Math.max(0, value), Math.max(0, node.scrollHeight - node.clientHeight)); } },
  });
}
function Shell({ id = 'a', contained = true }) {
  const contentRef = useRef(null), location = useLocation(), router = useRouter(), navigate = useNavigate();
  const [ready, setReady] = useState(true);
  api[id] = { navigate, setReady, location, router };
  useScrollDeNavegacio({ contentRef, ...location, navegacio: router.navegacio, subscriuAbansDeNavegar: router.subscriuAbansDeNavegar });
  const list = location.pathname === '/mur';
  return <main data-testid={`${id}-main`}>
    <div className="app-main__content" data-testid={`${id}-content`} ref={node => { contentRef.current = node; mesura(node); }}>
      <div key={location.pathname} className={`sdp-universal-page-container sdp-universal-page-container--${list && contained ? 'contained' : 'page'}`}
        data-testid={`${id}-view`} data-alt={list && !ready ? '600' : '6000'} ref={mesura}>
        <h2>{location.pathname}</h2>
        <p>{ready ? 'Contingut CONTROL' : 'Carregant CONTROL'}</p>
        <div data-testid={`${id}-inner`}>Scroll intern</div>
      </div>
    </div>
  </main>;
}
const mount = props => render(<MemoryRouter rutaInicial="/mur"><Shell {...props} /></MemoryRouter>);
const content = id => screen.getByTestId(`${id}-content`);
const view = id => screen.getByTestId(`${id}-view`);
const scroll = (node, top) => { fireEvent.wheel(node); node.scrollTop = top; fireEvent.scroll(node); };
const go = (path, options, id = 'a') => act(() => api[id].navigate(path, options));

test('R56 · Mur contained → pàgina a zero → POP exacte i avant al detall desat', () => {
  mount(); scroll(view('a'), 2150); go('/page/control');
  expect(content('a').scrollTop).toBe(0);
  scroll(content('a'), 820); go(-1);
  expect(view('a').scrollTop).toBe(2150); expect(content('a').scrollTop).toBe(0);
  go(1); expect(content('a').scrollTop).toBe(820);
});

test('R56 · llista page: captura exacta abans de navigate, fins i tot sense event scroll previ', () => {
  mount({ contained: false }); content('a').scrollTop = 1480;
  go('/pobles/control'); expect(content('a').scrollTop).toBe(0);
  go(-1); expect(content('a').scrollTop).toBe(1480);
});

test('R56 · dues entrades de la mateixa URL tenen posicions independents', () => {
  mount(); scroll(view('a'), 2140); go('/mur'); expect(view('a').scrollTop).toBe(0);
  scroll(view('a'), 600); go('/page/control'); go(-1); expect(view('a').scrollTop).toBe(600);
  go(-1); expect(view('a').scrollTop).toBe(2140);
  go(1); expect(view('a').scrollTop).toBe(600);
});

test('R56 · REPLACE sense fragment reinicia a zero i navegacions ràpides no gasten la posició inicial', () => {
  mount(); scroll(view('a'), 1600); go('/mur?filtre=1', { replace: true }); expect(view('a').scrollTop).toBe(0);
  scroll(view('a'), 900);
  act(() => { api.a.navigate('/page/primera'); api.a.navigate('/page/segona'); });
  expect(content('a').scrollTop).toBe(0); go(-1); expect(content('a').scrollTop).toBe(0);
  go(-1); expect(view('a').scrollTop).toBe(900);
});

test('R56 · contingut que arriba després de 350 ms restaura quan la geometria real ho permet', async () => {
  mount(); scroll(view('a'), 2150); go('/page/control');
  act(() => api.a.setReady(false)); go(-1); expect(view('a').scrollTop).toBe(0);
  await new Promise(resolve => setTimeout(resolve, 350));
  act(() => api.a.setReady(true));
  await waitFor(() => expect(view('a').scrollTop).toBe(2150));
});

test.each(['wheel', 'touchstart', 'pointerdown', 'keydown'])('R56 · %s cancel·la la restauració lazy i no arrossega la persona després', async gesture => {
  mount(); scroll(view('a'), 2150); go('/page/control'); act(() => api.a.setReady(false)); go(-1);
  fireEvent(view('a'), new Event(gesture, { bubbles: true }));
  act(() => api.a.setReady(true));
  await new Promise(resolve => setTimeout(resolve, 30));
  expect(view('a').scrollTop).toBe(0);
});

test('R56 · fragment i seccio deixen el scroll a l’àncora existent; conserven consulta/hash', () => {
  mount(); scroll(view('a'), 500); go('/mur?filtre=1#part');
  expect(view('a').scrollTop).toBe(500); expect(api.a.location.hash).toBe('#part');
  go('/mur?seccio=part', { replace: true }); expect(view('a').scrollTop).toBe(500);
});

test('R56 · scroll intern de taula/xat/diàleg no substituïx la posició de ruta', () => {
  mount(); scroll(view('a'), 1800);
  const inner = screen.getByTestId('a-inner'); inner.scrollTop = 88; fireEvent.scroll(inner);
  go('/page/control'); go(-1); expect(view('a').scrollTop).toBe(1800);
});

test('R56 · dues instàncies MemoryRouter tenen mapes i contenidors independents', () => {
  render(<><MemoryRouter rutaInicial="/mur"><Shell id="a" /></MemoryRouter><MemoryRouter rutaInicial="/mur"><Shell id="b" /></MemoryRouter></>);
  scroll(view('a'), 1111); scroll(view('b'), 2222);
  go('/page/a', undefined, 'a'); go('/page/b', undefined, 'b');
  go(-1, undefined, 'a'); expect(view('a').scrollTop).toBe(1111); expect(content('b').scrollTop).toBe(0);
  go(-1, undefined, 'b'); expect(view('b').scrollTop).toBe(2222);
});
