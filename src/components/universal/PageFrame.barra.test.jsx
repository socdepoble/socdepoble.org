import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../config/assetResolver', () => ({ resolveAsset: uri => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { PageFrame } from './PageFrame.jsx';
import EspecimenControlsBarra from '../../sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx';

/* T53 (ordre del Mestre, 260928) · cada fletxa de la barra blava porta la
   classe del seu costat, i la CSS acosta el glif al llibre sense tocar la
   cel·la tàctil. jsdom no pinta: es comprova el DOM que la CSS necessita. */
afterEach(cleanup);

const res = () => {};
const esquerra = (barra) => Array.from(barra.querySelector('.bar-blue-left').children);
const classes = (barra) => esquerra(barra).map((boto) => boto.className);
const noms = (barra) => esquerra(barra).map((boto) => boto.getAttribute('aria-label'));
const spansConnectar = (barra) => Array.from(barra.querySelector('.btn-connectar.sp-card-connect').children)
  .map((span) => [span.className, span.getAttribute('aria-hidden'), span.textContent]);
const barraDe = (container) => container.querySelector('header.bar-blue');

const AMB_FLETXES = ['sp-card-action bar-blue-left__arrere', 'sp-card-action', 'sp-card-action bar-blue-left__endavant'];

test('T53 · Arrere · Índex · Endavant: les fletxes porten la classe del seu costat i el llibre cap', () => {
  const { container } = render(<PageFrame chrome="context" title="Pàgina" onBack={res} onForward={res} />);
  expect(classes(barraDe(container))).toEqual(AMB_FLETXES);
  expect(noms(barraDe(container))).toEqual(['Tornar arrere', 'Índex de secció', 'Tornar endavant']);
});

test('T53 · sense destins només hi ha el llibre, sense classe de fletxa', () => {
  const { container } = render(<PageFrame chrome="context" title="Pàgina" />);
  expect(classes(barraDe(container))).toEqual(['sp-card-action']);
});

test('T53 · amb una sola fletxa, la classe no passa al llibre', () => {
  const arrere = render(<PageFrame chrome="context" title="Pàgina" onBack={res} />);
  expect(classes(barraDe(arrere.container))).toEqual(['sp-card-action bar-blue-left__arrere', 'sp-card-action']);
  cleanup();
  const endavant = render(<PageFrame chrome="context" title="Pàgina" onForward={res} />);
  expect(classes(barraDe(endavant.container))).toEqual(['sp-card-action', 'sp-card-action bar-blue-left__endavant']);
});

test('T53 · l’espècimen del catàleg pinta la barra blava com PageFrame, ampla i estreta', () => {
  const pagina = render(<PageFrame chrome="context" title="Pàgina" onBack={res} onForward={res} />);
  const connectarDePagina = spansConnectar(barraDe(pagina.container));
  cleanup();
  const { container } = render(<EspecimenControlsBarra />);
  const barres = Array.from(container.querySelectorAll('header.bar-blue'));
  expect(barres).toHaveLength(2);
  for (const barra of barres) {
    expect(classes(barra)).toEqual(AMB_FLETXES);
    expect(spansConnectar(barra)).toEqual(connectarDePagina);
  }
  expect(connectarDePagina).toEqual([['sp-card-connect-text', null, 'Connectar'], ['sp-card-connect-plus', 'true', '+']]);
  expect(barres.map((barra) => barra.parentElement.className)).toEqual([
    'sdp-especimen__barres sdp-especimen__barres--contenidor',
    'sdp-especimen__barres sdp-especimen__barres--contenidor sdp-especimen__barres--estreta'
  ]);
});
