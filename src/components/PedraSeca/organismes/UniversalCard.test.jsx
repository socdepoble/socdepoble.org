/**
 * Proves de UniversalCard amb @testing-library/react sobre react-dom 18.
 * (El dictamen 260910 sobre Preact queda superat per la migració a React
 * del 260920.)
 */
import { render, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));

vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement: h } = await import('react');
  return {
    useNavigate: () => mocks.navigate,
    Link: ({ to, children, ...resta }) => h('a', { href: to, ...resta }, children)
  };
});
vi.mock('../../universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: mocks.toast })
}));

import { UniversalCard } from './UniversalCard.jsx';
import { CLAU_APAGADA, ESDEVENIMENT_DOM } from '../../../data/telemetria.js';

/* Telemetria real amb `window.umami` d'amfitrió: el comptador rep l'event
   sense backend i cap prova toca la xarxa. */
let arrel;
let vistos;
const escolta = (event) => vistos.push(event.detail);
const connectars = () => vistos.filter((intent) => intent.nom === 'connectar');
beforeEach(() => {
  arrel = document.createElement('div'); // arrel separada: no penja del document
  vi.clearAllMocks();
  vistos = [];
  window.localStorage.removeItem(CLAU_APAGADA);
  window.umami = { track: vi.fn() };
  window.addEventListener(ESDEVENIMENT_DOM, escolta);
});
afterEach(() => {
  cleanup();
  window.removeEventListener(ESDEVENIMENT_DOM, escolta);
  delete window.umami;
});
const pinta = (props) => act(() => { render(<UniversalCard {...props} />, { container: arrel }); });
const troba = (selector) => arrel.querySelector(selector);

test('Connectar porta el títol en el nom accessible', () => {
  pinta({ title: 'Fira del Porrat', hasFooter: true });
  expect(troba('.sp-card-connect').getAttribute('aria-label')).toBe('Connectar amb Fira del Porrat');
  expect(troba('.sp-card-connect').textContent).toBe('Connectar+');
});

test('Connectar de la targeta compta un event d’Umami amb secció i origen, i després navega', () => {
  window.history.replaceState(null, '', '/mur');
  pinta({ title: 'Fira del Porrat', hasFooter: true });
  act(() => { troba('.sp-card-connect').click(); });
  expect(connectars()).toHaveLength(1);
  expect(connectars()[0].dades).toEqual({ seccio: 'mur', origen: 'targeta' });
  expect(window.umami.track).toHaveBeenCalledTimes(1);
  expect(window.umami.track).toHaveBeenCalledWith('connectar', { seccio: 'mur', origen: 'targeta' });
  expect(JSON.stringify(connectars()[0])).not.toContain('Porrat');
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).toHaveBeenCalledWith('/connectar?item_id=Fira%20del%20Porrat');
});

test('amb onConnect propi: un clic, un event i un handler; la prop telemetria no canvia l’origen', () => {
  window.history.replaceState(null, '', '/notes');
  const onConnect = vi.fn();
  pinta({ title: 'X', onConnect, telemetria: { mode: 'previsualitzacio', origen: 'pagina' } });
  act(() => { troba('.sp-card-connect').click(); });
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(connectars()).toHaveLength(1);
  expect(connectars()[0].dades).toEqual({ seccio: 'notes', origen: 'targeta', mode: 'previsualitzacio' });
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('Traduir, Comentar i Compartir no compten com a Connectar', () => {
  pinta({ title: 'X', hasFooter: true, showTranslate: true, onShare: () => {} });
  act(() => {
    troba('[aria-label="Traduir X"]').click();
    troba('[aria-label="Comentar X"]').click();
    troba('[aria-label="Compartir X"]').click();
  });
  expect(connectars()).toHaveLength(0);
  expect(window.umami.track).not.toHaveBeenCalled();
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

test('títol i subtítol visibles sense punt final; els noms accessibles no canvien', () => {
  pinta({ title: 'Fira.', subtitle: 'Dissabte a la plaça.', hasFooter: true });
  expect(troba('h3.sp-card-title').textContent).toBe('Fira');
  expect(troba('h4.sp-card-subtitle').textContent).toBe('Dissabte a la plaça');
  expect(troba('.sp-card-connect').getAttribute('aria-label')).toBe('Connectar amb Fira.');
});

test('un verb que no és Connectar porta el títol darrere de dos punts', () => {
  pinta({ title: 'Calendari de processos', connectLabel: 'Obrir', onConnect: () => {} });
  expect(troba('.sp-card-connect').getAttribute('aria-label')).toBe('Obrir: Calendari de processos');
  expect(troba('.sp-card-connect-text').textContent).toBe('Obrir');
});

test('un títol que no és text no es cola al nom accessible del botó principal', () => {
  pinta({ title: <span>Node</span>, connectLabel: 'Obrir', onConnect: () => {} });
  expect(troba('.sp-card-connect').getAttribute('aria-label')).toBe('Obrir');
});

test('telemetria.comptar=false: el botó principal fa la seua acció però no compta cap Connectar', () => {
  const onConnect = vi.fn();
  pinta({ title: 'Consums', connectLabel: 'Veure detall', onConnect, telemetria: { comptar: false } });
  act(() => { troba('.sp-card-connect').click(); });
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(connectars()).toHaveLength(0);
  expect(window.umami.track).not.toHaveBeenCalled();
});

test('els suspensius del títol es queden, i un títol que no és text passa tal qual', () => {
  pinta({ title: 'Continuarà...' });
  expect(troba('h3.sp-card-title').textContent).toBe('Continuarà...');
  cleanup();
  arrel = document.createElement('div');
  pinta({ title: <span>Node.</span>, icon: <svg /> });
  expect(troba('.sp-card-heading-with-icon h3.sp-card-title > span').textContent).toBe('Node.');
});

test('una data «dd/mm/aa» filtra el Mur pel mateix dia', () => {
  pinta({ title: 'X', date: '10/09/26' });
  act(() => { troba('.btn-date-time').click(); });
  expect(mocks.navigate).toHaveBeenCalledWith('/mur?date=2026-09-10');
});

test('compartir sense porta-retalls avisa amb l\'enllaç en lloc de petar', async () => {
  const shareOriginal = Object.getOwnPropertyDescriptor(navigator, 'share');
  const clipboardOriginal = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperties(navigator, {
    share: { configurable: true, value: undefined },
    clipboard: { configurable: true, value: undefined }
  });
  try {
    pinta({ title: 'X', hasFooter: true });
    await act(async () => { troba('[aria-label="Compartir X"]').click(); });
    expect(mocks.toast).toHaveBeenCalledWith(
      expect.stringContaining("No s'ha pogut copiar"), 6000
    );
  } finally {
    if (shareOriginal) Object.defineProperty(navigator, 'share', shareOriginal);
    else delete navigator.share;
    if (clipboardOriginal) Object.defineProperty(navigator, 'clipboard', clipboardOriginal);
    else delete navigator.clipboard;
  }
});
