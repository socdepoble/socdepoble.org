import { render, cleanup, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn() }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: uri => uri }));
// useAccions real: la barra passa per la mateixa porta de telemetria que la targeta.
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
import { PageFrame } from './PageFrame.jsx';
import { UniversalPage } from './UniversalPage.jsx';
import { TEXTOS_COMENTAR } from '../PedraSeca/organismes/textosComentar.js';
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

/* T43 (ordre del Mestre, 260928, D7) · la pàgina sense handler propi es
   connecta com a objecte 'pagina' amb la ruta d'on està la persona. Abans
   esperava '/connectar?item_id=P%C3%A0gina', l'URL que no sabia d'on venia. */
test('Connectar de la barra (UniversalPage → PageFrame): un clic, un event amb origen «pagina», i navega amb el descriptor de pàgina', () => {
  window.history.replaceState(null, '', '/mur?date=2026-09-28');
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" />);
  fireEvent.click(botoBarra(container));
  expect(connectars()).toHaveLength(1);
  expect(connectars()[0].dades).toEqual({ seccio: 'mur', origen: 'pagina' });
  expect(window.umami.track).toHaveBeenCalledTimes(1);
  expect(window.umami.track).toHaveBeenCalledWith('connectar', { seccio: 'mur', origen: 'pagina' });
  expect(JSON.stringify(connectars()[0])).not.toContain('Pàgina');
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  const desti = new URL(mocks.navigate.mock.calls[0][0], 'http://localhost');
  expect(desti.pathname).toBe('/connectar');
  expect(Object.fromEntries(desti.searchParams)).toEqual({
    item_id: '/mur?date=2026-09-28', title: 'Pàgina', objecte: 'pagina', ruta: '/mur?date=2026-09-28'
  });
});

/* T43 · D1: onConnect={false} vol dir «sense CONNECTAR». Abans UniversalPage
   el convertia en null i useAccions el tornava a pintar amb el valor genèric. */
test('onConnect={false} amaga el botó de la barra; la resta de la barra continua', () => {
  const { container } = render(<UniversalPage chrome="context" title="La meua publicació" onConnect={false} />);
  expect(botoBarra(container)).toBeNull();
  expect(container.querySelector('header.bar-blue [aria-label="Compartir"]')).not.toBeNull();
  cleanup();
  const sistema = render(<UniversalPage chrome="system" title="Catàleg" onConnect={false} />);
  expect(botoBarra(sistema.container)).toBeNull();
  cleanup();
  const perDefecte = render(<UniversalPage chrome="system" title="Mur" />);
  expect(botoBarra(perDefecte.container)).not.toBeNull();
  cleanup();
  const directe = render(<PageFrame chrome="context" title="Fitxa" showConnect={false} />);
  expect(botoBarra(directe.container)).toBeNull();
});

/* ── T63.2 (doctrina del Mestre, 260928) · Comentar de la barra obri el Xat
   comú de la Pàgina Universal. Abans UniversalPage navegava a '/xat', sense
   destí, i el botó es deia «Comentar (Xat Privat)».
   Ordre del Mestre (261007) · «COMENTARIS = XAT» · Comentar sempre es diu
   «Comentar» i obri un menú amb dues vies: «En públic», el xat comú de
   T63.2, i «En privat», el xat amb Sóc de Poble (sense proveïdor, el de la
   llavor). Sense xat públic, «En públic» es queda desactivada i el clic no
   fa res. */
const comentar = (container) => container.querySelector('header.bar-blue .sp-card-actions').children[1];
const destiXat = (crida) => {
  const url = new URL(crida, 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};
const XAT_DE_SOCDEPOBLE = '/xat?amb=socdepoble';
/* Obri el menú de Comentar de la barra i en torna la fila de la via. */
function via(container, nom) {
  const boto = comentar(container);
  expect(boto.getAttribute('aria-label')).toBe('Comentar');
  expect(boto.getAttribute('aria-haspopup')).toBe('menu');
  fireEvent.click(boto);
  return within(container.querySelector('header.bar-blue [role="menu"]')).getByRole('menuitem', { name: nom });
}
const PUBLIC = TEXTOS_COMENTAR.public[1];
const PRIVAT = TEXTOS_COMENTAR.privat[1];

test('T63.2 · sense handler ni objecte, «En públic» obri el xat comú de la pàgina (la ruta d’on està, en el clic)', () => {
  const { container } = render(<UniversalPage chrome="system" title="Constitució" />);
  window.history.replaceState(null, '', '/constitucio');
  fireEvent.click(via(container, PUBLIC));
  expect(mocks.navigate).toHaveBeenCalledTimes(1);
  expect(destiXat(mocks.navigate.mock.calls[0][0])).toEqual({ cami: '/xat', sobre: 'pagina:/constitucio', titol: 'Constitució', ruta: '/constitucio' });
  // Comentar no és cap Connectar.
  expect(connectars()).toHaveLength(0);
});

/* Una persona no té xat públic (el seu directe no ho és): «En públic» es
   queda desactivada i «En privat» porta hui al xat amb Sóc de Poble, no al
   directe amb la persona (abans, /xat?amb=u1). PREGUNTA OBERTA al Mestre:
   per a una persona (o la IAIA), «En privat» ha de ser el directe amb ella? */
test('T63.2 · amb objecte tipat, «En públic» porta al xat de l’element; una persona, sense xat públic, «En privat» a Sóc de Poble', () => {
  const { container, unmount } = render(<UniversalPage chrome="full" title="Samarreta"
    objecte={{ tipus: 'producte', id: 'samarreta', titol: 'Samarreta', ruta: '/mercat/samarreta' }} />);
  fireEvent.click(via(container, PUBLIC));
  expect(destiXat(mocks.navigate.mock.calls[0][0]).sobre).toBe('producte:samarreta');
  unmount();
  mocks.navigate.mockClear();
  const persona = render(<UniversalPage chrome="full" title="Pepa" objecte={{ tipus: 'persona', id: 'u1' }} />);
  const publica = via(persona.container, PUBLIC);
  expect(publica.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(publica);
  expect(mocks.navigate).not.toHaveBeenCalled();
  fireEvent.click(within(persona.container.querySelector('header.bar-blue [role="menu"]')).getByRole('menuitem', { name: PRIVAT }));
  expect(mocks.navigate.mock.calls).toEqual([[XAT_DE_SOCDEPOBLE]]);
  expect(mocks.toast).not.toHaveBeenCalled();
});

test('T63.2 · una nota no ofereix Comentar; onComment={false} tampoc: la resta de la barra continua', () => {
  const nota = render(<UniversalPage chrome="context" title="Llista" objecte={{ tipus: 'nota', id: 'n1', ruta: '/notes/n1' }} />);
  expect(nota.container.querySelector('header.bar-blue [aria-label^="Comentar"]')).toBeNull();
  expect(nota.container.querySelector('header.bar-blue [aria-label="Compartir"]')).not.toBeNull();
  expect(nota.container.querySelector('header.bar-blue [aria-label="Traduir"]')).not.toBeNull();
  nota.unmount();
  const sense = render(<UniversalPage chrome="context" title="Pàgina" onComment={false} />);
  expect(sense.container.querySelector('header.bar-blue [aria-label^="Comentar"]')).toBeNull();
  expect(botoBarra(sense.container)).not.toBeNull();
  sense.unmount();
  const directe = render(<PageFrame chrome="context" title="Fitxa" showComment={false} />);
  expect(directe.container.querySelector('header.bar-blue [aria-label^="Comentar"]')).toBeNull();
});

/* Revisió de T63.2 · Sense xat on anar, el botó es queda on era (Llei del
   Píxel), amb el nom neutre: ni navega ni crea cap xat.
   Ordre del Mestre (261007) · El menú es queda sencer: «En públic»,
   desactivada i amb la raó (aria-disabled); el seu clic no navega ni avisa.
   «En privat» continua portant al xat amb Sóc de Poble. */
test('T63.2 · objecte={null} o una pàgina sense xat comú (privada, amb consulta): el botó es queda, «En públic» desactivada, i el clic no fa res', () => {
  const carregant = render(<UniversalPage chrome="system" title="Carregant el perfil…" objecte={null} />);
  const publica = via(carregant.container, PUBLIC);
  expect(publica.getAttribute('aria-disabled')).toBe('true');
  expect(publica.textContent).toBe(`${PUBLIC}${TEXTOS_COMENTAR.senseXatPublic[1]}`);
  fireEvent.click(publica);
  expect(mocks.navigate).not.toHaveBeenCalled();
  carregant.unmount();
  for (const ruta of ['/notes', '/el-meu-perfil', '/wikidepoble?item=genoma']) {
    window.history.replaceState(null, '', ruta);
    const pagina = render(<UniversalPage chrome="system" title="Pàgina" />);
    const fila = via(pagina.container, PUBLIC);
    expect(fila.getAttribute('aria-disabled'), ruta).toBe('true');
    fireEvent.click(fila);
    pagina.unmount();
  }
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  /* «En privat» sí que hi porta, també sense xat públic. */
  const privada = render(<UniversalPage chrome="system" title="Pàgina" />);
  fireEvent.click(via(privada.container, PRIVAT));
  expect(mocks.navigate.mock.calls).toEqual([[XAT_DE_SOCDEPOBLE]]);
});

test('T63.2 · un onComment propi mana: es crida, no navega, i el nom no promet cap xat', () => {
  const onComment = vi.fn();
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" onComment={onComment} />);
  expect(comentar(container).getAttribute('aria-label')).toBe('Comentar');
  // 261007 · Amb un handler propi no hi ha menú.
  expect(comentar(container).hasAttribute('aria-haspopup')).toBe(false);
  fireEvent.click(comentar(container));
  expect(container.querySelector('header.bar-blue [role="menu"]')).toBeNull();
  expect(onComment).toHaveBeenCalledTimes(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('Connectar de la barra amb onConnect propi: un event i el handler una sola vegada', () => {
  const onConnect = vi.fn();
  const { container } = render(<UniversalPage chrome="context" title="Pàgina" onConnect={onConnect} />);
  fireEvent.click(botoBarra(container));
  expect(onConnect).toHaveBeenCalledTimes(1);
  expect(connectars()).toHaveLength(1);
  expect(mocks.navigate).not.toHaveBeenCalled();
});
