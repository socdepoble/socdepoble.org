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
import { EventCard } from '../../universal/EventCard.jsx';
import SectionItemCard from '../../SectionItemCard.jsx';
import { TEXTOS_COMENTAR } from '../../universal/barres/BarraBlava.jsx';
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
  /* T43 (ordre del Mestre, 260928, D7) · abans '/connectar?item_id=Fira%20del%20Porrat':
     ara porta un descriptor tipat ('pagina') amb la ruta d'on està la persona. */
  const desti = new URL(mocks.navigate.mock.calls[0][0], 'http://localhost');
  expect(desti.pathname).toBe('/connectar');
  expect(Object.fromEntries(desti.searchParams)).toEqual({ item_id: 'Fira del Porrat', title: 'Fira del Porrat', objecte: 'pagina', ruta: '/mur' });
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

/* ── T63.2 (doctrina del Mestre, 260928) · Comentar de la targeta obri el Xat
   comú de la Pàgina Universal de l'element. Abans navegava a '/xat', sense
   destí. El nom de la targeta no canvia: «Comentar {títol}».
   Ordre del Mestre (261007) · «Comentaris = xat» · Comentar obri el menú de
   les dues vies (el mateix de la barra blava): eixe xat comú és «En públic»,
   i «En privat» és el xat amb Sóc de Poble. */
const destiXat = () => {
  const url = new URL(mocks.navigate.mock.calls.at(-1)[0], 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};
const PRIVAT = TEXTOS_COMENTAR.privat[1];
const PUBLIC = TEXTOS_COMENTAR.public[1];
const obriComentar = (titol) => act(() => { troba(`[aria-label="Comentar ${titol}"]`).click(); });
const fila = (via) => [...arrel.querySelectorAll('[role="menu"] [role="menuitem"]')].find((element) => element.textContent.startsWith(via));
/* Obri el menú de Comentar de la targeta i hi tria una via. */
const comenta = (titol, via) => {
  obriComentar(titol);
  act(() => { fila(via).click(); });
};

test('261007 · Comentar de la targeta obri el menú de les dues vies, just després del botó', () => {
  pinta({ title: 'Fira', hasFooter: true, objecte: { tipus: 'esdeveniment', id: 'fira', titol: 'Fira', ruta: '/events/fira' } });
  const boto = troba('[aria-label="Comentar Fira"]');
  expect([boto.getAttribute('aria-haspopup'), boto.getAttribute('aria-expanded')]).toEqual(['menu', 'false']);
  expect(troba('[role="menu"]')).toBeNull();
  obriComentar('Fira');
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  expect(boto.nextElementSibling).toBe(troba('.sp-card-footer .sp-card-actions > [role="menu"].sdp-menu-comentar'));
  expect([...arrel.querySelectorAll('[role="menuitem"]')].map((element) => element.getAttribute('aria-disabled'))).toEqual([null, null]);
  expect(mocks.navigate).not.toHaveBeenCalled();
});

test('T63.2 · amb objecte tipat, «En públic» porta al xat comú de l’element; «En privat», al de Sóc de Poble', () => {
  pinta({ title: 'Fira', hasFooter: true, objecte: { tipus: 'esdeveniment', id: 'fira', titol: 'Fira', ruta: '/events/fira' } });
  comenta('Fira', PUBLIC);
  expect(destiXat()).toEqual({ cami: '/xat', sobre: 'esdeveniment:fira', titol: 'Fira', ruta: '/events/fira' });
  expect(troba('[role="menu"]')).toBeNull();
  comenta('Fira', PRIVAT);
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=socdepoble');
  expect(connectars()).toHaveLength(0);
});

test('T63.2 · sense objecte, «En públic» és el xat comú de la pàgina del detall (mainHref); mai /xat sense destí', () => {
  pinta({ title: 'Constitució', hasFooter: true, mainHref: '/constitucio' });
  comenta('Constitució', PUBLIC);
  expect(mocks.navigate).not.toHaveBeenCalledWith('/xat');
  expect(destiXat()).toEqual({ cami: '/xat', sobre: 'pagina:/constitucio', titol: 'Constitució', ruta: '/constitucio' });
});

/* Revisió de T63.2 · Una targeta sense objecte ni detall ja no pren el xat de
   la LLISTA on és: totes haurien compartit pagina:/mur amb títols diferents.
   261007 · La via pública es queda desactivada i diu per què; la privada hi és. */
test('T63.2 · sense objecte ni detall, «En públic» es queda desactivat, diu per què i no pren el de la llista', () => {
  window.history.replaceState(null, '', '/mur');
  pinta({ title: 'Pepa', hasFooter: true });
  obriComentar('Pepa');
  expect(fila(PUBLIC).getAttribute('aria-disabled')).toBe('true');
  expect(fila(PUBLIC).textContent).toBe(`${PUBLIC}${TEXTOS_COMENTAR.senseXatPublic[1]}`);
  act(() => { fila(PUBLIC).click(); });
  expect(mocks.navigate).not.toHaveBeenCalled();
  expect(mocks.toast).not.toHaveBeenCalled();
  act(() => { fila(PRIVAT).click(); });
  expect(mocks.navigate).toHaveBeenCalledWith('/xat?amb=socdepoble');
});

test('T63.2 · una nota (objecte sense xat) no porta Comentar a la targeta, encara que showComment el demane', () => {
  pinta({ title: 'Nota', hasFooter: true, showComment: true, objecte: { tipus: 'nota', id: 'n1', ruta: '/notes?nota=n1' } });
  expect(troba('[aria-label="Comentar Nota"]')).toBeNull();
  expect(troba('[aria-label="Compartir Nota"]')).not.toBeNull();
});

test('T63.2 · EventCard (els actes del Mur) passa l’objecte: «En públic» és el xat comú de l’acte', () => {
  const item = { id: 'aplec-2023', title: 'Aplec', date: '2026-08-14T09:00:00' };
  act(() => { render(<EventCard item={item} objecte={{ tipus: 'esdeveniment', id: 'aplec-2023', titol: 'Aplec', ruta: '/events/aplec-2023' }} />, { container: arrel }); });
  comenta('Aplec', PUBLIC);
  expect(destiXat()).toEqual({ cami: '/xat', sobre: 'esdeveniment:aplec-2023', titol: 'Aplec', ruta: '/events/aplec-2023' });
});

/* 261007 · El missatge directe d'una persona o una IA no és cap xat públic:
   a la seua targeta, «En públic» es queda desactivat i «En privat» és el xat
   amb Sóc de Poble (el directe amb la persona continua a la seua fitxa). */
test('T63.2 · 261007 · SectionItemCard passa l’objecte: una persona o una IA, sense xat públic; una entitat, el seu xat comú', () => {
  act(() => { render(<SectionItemCard to="/perfil/iaia" title="IAIA" objecte={{ tipus: 'ia', id: 'iaia', ruta: '/perfil/iaia' }} />, { container: arrel }); });
  obriComentar('IAIA');
  expect(fila(PUBLIC).getAttribute('aria-disabled')).toBe('true');
  act(() => { fila(PRIVAT).click(); });
  expect(mocks.navigate).toHaveBeenLastCalledWith('/xat?amb=socdepoble');
  cleanup();
  arrel = document.createElement('div');
  act(() => { render(<SectionItemCard to="/empresa/forn" title="Forn" objecte={{ tipus: 'entitat', id: 'forn', titol: 'Forn', ruta: '/empresa/forn' }} />, { container: arrel }); });
  comenta('Forn', PUBLIC);
  expect(destiXat().sobre).toBe('entitat:forn');
});

/* Revisió de T63.2 · El directori /perfil (ProfileSection) no passa l'objecte:
   cada targeta pren el de la fitxa a què porta `to` (rutaDePerfil), mai el de
   la llista. Abans totes anaven a pagina:/perfil amb el títol de cadascuna. */
test('T63.2 · SectionItemCard sense objecte: cada targeta, el xat públic de la seua fitxa (per `to`), no el de la llista', () => {
  window.history.replaceState(null, '', '/perfil');
  const publicaDe = (props) => {
    cleanup();
    arrel = document.createElement('div');
    act(() => { render(<SectionItemCard {...props} />, { container: arrel }); });
    obriComentar(props.title);
    return fila(PUBLIC);
  };
  // Una persona, una IA o un `to` que no és cap fitxa de perfil: cap xat públic.
  for (const props of [{ to: '/gent/pepa', title: 'Pepa' }, { to: '/perfil/iaia', title: 'IAIA' }, { to: '/mur/3', title: 'Coca' }]) {
    const publica = publicaDe(props);
    expect([props.title, publica.getAttribute('aria-disabled')]).toEqual([props.title, 'true']);
    act(() => { publica.click(); });
  }
  expect(mocks.navigate).not.toHaveBeenCalled();
  const deLEntitat = publicaDe({ to: '/empresa/forn', title: 'Forn' });
  act(() => { deLEntitat.click(); });
  expect(destiXat()).toEqual({ cami: '/xat', sobre: 'entitat:forn', titol: 'Forn', ruta: '/empresa/forn' });
  expect(mocks.navigate.mock.calls.map(([ruta]) => ruta).join(' ')).not.toContain('pagina');
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

/* T51 (ordre del Mestre, 260928) · la caputxa de la targeta és lectura: al
   centre, només l'emoticona triada (camp cru); mai la ploma. Sense emoticona,
   el DOM de sempre. */
test('T51 · amb una emoticona triada, la caputxa la porta al centre, entre l’autoria i la data', () => {
  pinta({ title: 'Hort', author: 'Pepa', date: '10/09/26', time: '09:00', emoticona: '🍅' });
  const capcal = troba('header.sp-card-header');
  expect(capcal.className).toBe('sp-card-header sp-card-header--amb-emoticona');
  expect([...capcal.children].map((e) => e.className)).toEqual([
    'sp-card-author-block', 'sdp-emoticona-barra sdp-emoticona-barra--glif', 'sp-card-meta'
  ]);
  const centre = capcal.children[1];
  expect(centre.getAttribute('role')).toBe('img');
  expect(centre.getAttribute('aria-label')).toBe('Emoticona del document: 🍅');
  expect(centre.textContent).toBe('🍅');
  expect(troba('button.sdp-emoticona-barra--boto')).toBeNull();
});

test('T51 · sense emoticona (o amb brossa, o el valor de reserva buit) la caputxa no canvia ni un node, i mai hi ha ploma', () => {
  for (const emoticona of [undefined, '', null, 'hola', '🍅 Tomaques']) {
    pinta({ title: 'Hort', author: 'Pepa', date: '10/09/26', emoticona });
    const capcal = troba('header.sp-card-header');
    expect(capcal.className).toBe('sp-card-header');
    expect([...capcal.children].map((e) => e.className)).toEqual(['sp-card-author-block', 'sp-card-meta']);
    expect(troba('.sdp-emoticona-barra')).toBeNull();
    expect(troba('svg.lucide-feather')).toBeNull();
    cleanup();
    arrel = document.createElement('div');
  }
});

test('T51 · l’emoticona sola també fa aparéixer la caputxa', () => {
  pinta({ title: 'Hort', emoticona: '🌿' });
  expect(troba('header.sp-card-header .sdp-emoticona-barra--glif').textContent).toBe('🌿');
});

/* Correcció D5 (revisió de T50) · La fitxa activa d'una llista exposa l'estat
   on va el focus: l'element principal de la targeta, com la fitxa compacta. */
test('D5 · `actual` posa aria-current="true" al botó principal, i sense la prop el DOM de sempre', () => {
  pinta({ title: 'Hort', onMainClick: () => {}, actual: true });
  expect(troba('button.sp-card-link-overlay').getAttribute('aria-current')).toBe('true');
  expect(troba('article.sp-card').hasAttribute('aria-current')).toBe(false);
  cleanup();
  pinta({ title: 'Hort', onMainClick: () => {} });
  expect(troba('button.sp-card-link-overlay').hasAttribute('aria-current')).toBe(false);
  expect(arrel.querySelectorAll('[aria-current]')).toHaveLength(0);
});

test('D5 · amb mainHref, l’estat va a l’enllaç principal; sense element principal, a l’article', () => {
  pinta({ title: 'Hort', mainHref: '/notes/hort', actual: true });
  expect(troba('a.sp-card-link-overlay').getAttribute('aria-current')).toBe('true');
  expect(arrel.querySelectorAll('[aria-current]')).toHaveLength(1);
  cleanup();
  pinta({ title: 'Hort', actual: true });
  expect(troba('article.sp-card').getAttribute('aria-current')).toBe('true');
});

/* Ordre del Mestre, 261001 (tasca 4 i carril A) · la pastilla ja no filtra
   el Mur: obri el Calendari global en el mes de la data, amb totes les
   targetes d'eixe mes (abans '/mur?date=2026-09-10' i després
   '/calendari?date=2026-09-10'). */
test('una data «dd/mm/aa» obri el Calendari en el seu mes', () => {
  pinta({ title: 'X', date: '10/09/26' });
  act(() => { troba('.btn-date-time').click(); });
  expect(mocks.navigate).toHaveBeenCalledWith('/calendari?mes=2026-09');
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
