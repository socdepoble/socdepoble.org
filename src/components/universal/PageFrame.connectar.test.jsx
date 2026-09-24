import { render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: uri => uri }));
// useAccions real: la barra passa per la mateixa porta de telemetria que la targeta.
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { PageFrame } from './PageFrame.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { CLAU_APAGADA, ESDEVENIMENT_DOM } from '../../data/telemetria.js';

/* `window.umami` d'amfitrió: l'event arriba al comptador sense backend ni xarxa. */
let vistos;
const escolta = (event) => vistos.push(event.detail);
const connectars = () => vistos.filter((intent) => intent.nom === 'connectar');
const botoBarra = (container) => container.querySelector('header.bar-blue .btn-connectar.sp-card-connect');
beforeEach(() => {
  vi.clearAllMocks();
  vistos = [];
  window.localStorage.removeItem(CLAU_APAGADA);
  window.umami = { track: vi.fn() };
  window.history.replaceState(null, '', '/mur');
  window.addEventListener(ESDEVENIMENT_DOM, escolta);
});
afterEach(() => {
  cleanup();
  window.removeEventListener(ESDEVENIMENT_DOM, escolta);
  delete window.umami;
});

test('U08: CONNECTAR de pàgina porta paraula i «+» com la targeta; la CSS en mostra només un', () => {
  const { container } = render(<PageFrame chrome="context" title="Pàgina" />);
  const boto = botoBarra(container);
  expect(boto.getAttribute('aria-label')).toBe('Connectar');
  expect(boto.querySelector('.sp-card-connect-text').textContent).toBe('Connectar');
  expect(boto.querySelector('.sp-card-connect-plus').getAttribute('aria-hidden')).toBe('true');
});

test('Connectar de la barra (UniversalPage → PageFrame): un clic, un event amb origen «pagina», i navega com sempre', () => {
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" />);
  fireEvent.click(botoBarra(container));
  expect(connectars()).toHaveLength(1);
  expect(connectars()[0].dades).toEqual({ seccio: 'mur', origen: 'pagina' });
  expect(window.umami.track).toHaveBeenCalledTimes(1);
  expect(window.umami.track).toHaveBeenCalledWith('connectar', { seccio: 'mur', origen: 'pagina' });
  expect(JSON.stringify(connectars()[0])).not.toContain('Pàgina');
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).toHaveBeenCalledWith('/connectar?item_id=P%C3%A0gina');
});

test('Connectar de la barra amb onConnect propi: un event i el handler una sola vegada', () => {
  const onConnect = vi.fn();
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" onConnect={onConnect} />);
  fireEvent.click(botoBarra(container));
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(connectars()).toHaveLength(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
});
