/**
 * Proves de UniversalCard amb `render` de Preact directe: no passen per
 * @testing-library/react, que pinta amb el react-dom real i fa petar les
 * suites de src/ (vegeu el dictamen 260910).
 */
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { h } = await import('preact');
  return {
    useNavigate: () => mocks.navigate,
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('../../universal/AvisadorEfimer', () => ({ showToast: mocks.toast }));

import { UniversalCard } from './UniversalCard.jsx';

let arrel;
beforeEach(() => {
  arrel = document.createElement('div'); // arrel separada: no penja del document
  vi.clearAllMocks();
});
afterEach(() => {
  arrel.innerHTML = '';
});
const pinta = (props) => act(() => { render(<UniversalCard {...props} />, arrel); });
const troba = (selector) => arrel.querySelector(selector);

test('Connectar porta el títol en el nom accessible', () => {
  pinta({ title: 'Fira del Porrat', hasFooter: true });
  expect(troba('.sp-card-connect').getAttribute('aria-label')).toBe('Connectar amb Fira del Porrat');
  expect(troba('.sp-card-connect').textContent).toBe('Connectar');
});

test('showTranslate pinta el botó que abans es perdia, i cada acció porta el títol', () => {
  pinta({ title: 'Fira', hasFooter: true, showTranslate: true });
  const noms = [...arrel.querySelectorAll('.sp-card-action')].map((b) => b.getAttribute('aria-label'));
  expect(noms).toEqual(['Traduir Fira', 'Comentar Fira', 'Compartir Fira']);
});

test('cap contenidor buit: avatar insegur i onDateTime sense data', () => {
  pinta({ title: 'X', avatarUrl: 'javascript:alert(1)', onDateTime: () => {} });
  expect(troba('.sp-card-header')).toBeNull();
  expect(troba('.sp-card-meta')).toBeNull();
  expect(troba('.sp-card-footer')).toBeNull();
});

test('headingLevel fora de llista cau a h3, i labels nul no tomba la targeta', () => {
  pinta({ title: 'X', headingLevel: 'script', labels: null });
  expect(troba('h3.sp-card-title').textContent).toBe('X');
  expect(troba('script')).toBeNull();
  expect(troba('.sp-card-labels')).toBeNull();
});

test('una data «dd/mm/aa» filtra el Mur pel mateix dia', () => {
  pinta({ title: 'X', date: '10/09/26' });
  act(() => { troba('.btn-date-time').click(); });
  expect(mocks.navigate).toHaveBeenCalledWith('/mur?date=2026-09-10');
});

test('compartir sense porta-retalls avisa amb l\'enllaç en lloc de petar', async () => {
  pinta({ title: 'X', hasFooter: true });
  await act(async () => { troba('[aria-label="Compartir X"]').click(); });
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining("No s'ha pogut copiar"), 6000);
});
