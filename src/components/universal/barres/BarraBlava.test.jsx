import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { BarraBlava } from './BarraBlava.jsx';
import { UniversalPage } from '../UniversalPage.jsx';

/* T51 (fase B1 de T52) · La barra blava extreta de PageFrame amb el MATEIX
   DOM, T53 inclòs. Presentacional: qui la munta decidix què es veu. */
afterEach(cleanup);

const res = () => {};
const TOTES = {
  onBack: res, onForward: res, onIndex: res,
  traduirVisible: true, comentarVisible: true, compartirVisible: true, connectarVisible: true,
  onTranslate: res, onComment: res, onShare: res, onConnect: res,
};
const blava = (props) => render(<BarraBlava {...props} />).container.querySelector('header.bar-blue');

/* Correcció D4 (revisió de T51a) · El marcatge LITERAL d'abans de l'extracció
   (fills, classes, noms i ordre), no la barra comparada amb si mateixa: la
   pàgina (UniversalPage → PageFrame) ja pinta este mateix component. */
const marques = (el) => [...el.children].map((e) => `${e.tagName.toLowerCase()}.${e.getAttribute('class')}`);
const noms = (el) => [...el.children].map((e) => e.getAttribute('aria-label'));
/* Ordre del Mestre (261007) · Comentar es diu sempre «Comentar» (aria-label i
   title): on porta ho diu el seu menú (BarraBlava.comentar.test.jsx). El
   marcatge és el de sempre. */
const comprovaMarcatge = (barra, nomComentar = 'Comentar') => {
  expect(marques(barra)).toEqual(['div.bar-blue-left', 'div.sp-card-actions', 'button.btn-connectar sp-card-connect']);
  const [esquerra, accions, connectar] = barra.children;
  expect(marques(esquerra)).toEqual([
    'button.sp-card-action bar-blue-left__arrere', 'button.sp-card-action', 'button.sp-card-action bar-blue-left__endavant',
  ]);
  expect(noms(esquerra)).toEqual(['Tornar arrere', 'Índex de secció', 'Tornar endavant']);
  expect(marques(accions)).toEqual(['button.sp-card-action', 'button.sp-card-action', 'button.sp-card-action']);
  expect(noms(accions)).toEqual(['Traduir', nomComentar, 'Compartir']);
  expect(accions.children[1].getAttribute('title')).toBe(nomComentar);
  expect(connectar.getAttribute('aria-label')).toBe('Connectar');
  expect(marques(connectar)).toEqual(['span.sp-card-connect-text', 'span.sp-card-connect-plus']);
  expect(connectar.textContent).toBe('Connectar+');
  // Cada botó d'icona porta una sola icona, i res més.
  for (const boto of barra.querySelectorAll('button.sp-card-action')) {
    expect(marques(boto)).toEqual(['svg.icon']);
    expect(boto.getAttribute('type')).toBe('button');
  }
};

test('D4 · amb totes les accions, el marcatge literal (T53 inclòs), també el que pinta la pàgina', () => {
  comprovaMarcatge(blava(TOTES));
  cleanup();
  window.history.replaceState(null, '', '/constitucio');
  comprovaMarcatge(render(<UniversalPage chrome="context" title="Pàgina" />).container.querySelector('header.bar-blue'));
  cleanup();
  // Una pàgina sense xat comú (una consulta, l'arrel): el mateix marcatge.
  window.history.replaceState(null, '', '/wikidepoble?item=genoma');
  comprovaMarcatge(render(<UniversalPage chrome="context" title="Genoma" />).container.querySelector('header.bar-blue'));
});

/* Ordre del Mestre (261007) · «Comentaris = xat» · Derogat el nom que deia on
   portava Comentar (T63.2: «Comentar al xat comú», «Comentar per missatge
   directe»): Comentar obri un menú amb les dues vies, i el botó ho diu
   (aria-haspopup). Sense menú (un handler propi o un valor desconegut), el
   botó de sempre, sense cap atribut nou. */
test('261007 · Comentar es diu «Comentar» i diu si obri el menú de les dues vies', () => {
  const comentarDe = (props) => {
    const boto = blava({ ...TOTES, ...props }).querySelector('.sp-card-actions').children[1];
    const dades = [boto.getAttribute('aria-label'), boto.getAttribute('title'), boto.getAttribute('aria-haspopup')];
    cleanup();
    return dades;
  };
  expect(comentarDe({ comentarXat: 'comu' })).toEqual(['Comentar', 'Comentar', 'menu']);
  expect(comentarDe({ comentarXat: 'privat' })).toEqual(['Comentar', 'Comentar', 'menu']);
  expect(comentarDe({ comentarXat: null })).toEqual(['Comentar', 'Comentar', null]);
  expect(comentarDe({ comentarXat: 'directe' })).toEqual(['Comentar', 'Comentar', null]);
});

test('tres fills per a la graella (T37) i les classes de les fletxes (T53)', () => {
  const barra = blava(TOTES);
  expect([...barra.children].map((e) => e.className)).toEqual(['bar-blue-left', 'sp-card-actions', 'btn-connectar sp-card-connect']);
  expect([...barra.querySelector('.bar-blue-left').children].map((e) => e.className))
    .toEqual(['sp-card-action bar-blue-left__arrere', 'sp-card-action', 'sp-card-action bar-blue-left__endavant']);
});

test('sense destins ni accions visibles: només el llibre', () => {
  const barra = blava({ onIndex: res });
  expect([...barra.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual(['Índex de secció']);
  expect(barra.querySelector('.sp-card-actions').children).toHaveLength(0);
});

test('T36 · amb accionsInoperatives, Comentar, Compartir i Connectar van a onClickInoperatiu; la resta, a la seua acció', () => {
  const onClickInoperatiu = vi.fn();
  const onComment = vi.fn();
  const onTranslate = vi.fn();
  const barra = blava({ ...TOTES, onComment, onTranslate, accionsInoperatives: true, onClickInoperatiu });
  for (const nom of ['Comentar', 'Compartir', 'Connectar']) {
    const boto = barra.querySelector(`button[aria-label="${nom}"]`);
    expect(boto.classList.contains('accio-inoperativa')).toBe(true);
    act(() => { fireEvent.click(boto); });
  }
  expect(onClickInoperatiu).toHaveBeenCalledTimes(3);
  expect(onComment).not.toHaveBeenCalled();
  act(() => { fireEvent.click(barra.querySelector('button[aria-label="Traduir"]')); });
  expect(onTranslate).toHaveBeenCalledTimes(1);
  expect(barra.querySelector('button[aria-label="Traduir"]').classList.contains('accio-inoperativa')).toBe(false);
});

/* Gauntlet 261016 (Bloc 3.9) · traduirInoperatiu (l'editor): amb
   accionsInoperatives, Traduir també porta aria-disabled i el clic diu
   'traduir'; sense accionsInoperatives no fa res, i sense la prop (la
   Gestoria) Traduir com sempre (la prova de dalt). */
test('Bloc 3.9 · amb traduirInoperatiu i accionsInoperatives, Traduir és inoperatiu, sense menú, i el clic diu «traduir»', () => {
  const onClickInoperatiu = vi.fn();
  const onTranslate = vi.fn();
  const menu = { obert: true, opcions: [], actual: null, onTria: vi.fn(), onTanca: vi.fn() };
  const barra = blava({ ...TOTES, onTranslate, accionsInoperatives: true, onClickInoperatiu, traduirInoperatiu: true, menuTraduir: menu });
  const traduir = barra.querySelector('button[aria-label="Traduir"]');
  expect(traduir.classList.contains('accio-inoperativa')).toBe(true);
  expect(traduir.getAttribute('aria-disabled')).toBe('true');
  expect(traduir.disabled).toBe(false);
  expect(traduir.hasAttribute('aria-haspopup')).toBe(false);
  expect(barra.querySelector('[role="menu"]')).toBeNull();
  act(() => { fireEvent.click(traduir); });
  expect(onClickInoperatiu).toHaveBeenCalledWith('traduir');
  expect(onTranslate).not.toHaveBeenCalled();
  cleanup();
  // Sense accionsInoperatives, la prop sola no apaga res.
  const viva = blava({ ...TOTES, onTranslate, traduirInoperatiu: true });
  expect(viva.querySelector('button[aria-label="Traduir"]').hasAttribute('aria-disabled')).toBe(false);
  act(() => { fireEvent.click(viva.querySelector('button[aria-label="Traduir"]')); });
  expect(onTranslate).toHaveBeenCalledTimes(1);
});

/* T7 (P7) · Inoperatius però enfocables: aria-disabled="true", mai `disabled`,
   i el clic diu quin botó és perquè cada un tinga el seu missatge. */
test('T7 · amb accionsInoperatives, els tres porten aria-disabled i el clic diu quin botó és', () => {
  const onClickInoperatiu = vi.fn();
  const barra = blava({ ...TOTES, accionsInoperatives: true, onClickInoperatiu });
  for (const nom of ['Comentar', 'Compartir', 'Connectar']) {
    const boto = barra.querySelector(`button[aria-label="${nom}"]`);
    expect(boto.getAttribute('aria-disabled')).toBe('true');
    expect(boto.disabled).toBe(false);
    act(() => { fireEvent.click(boto); });
  }
  expect(onClickInoperatiu.mock.calls).toEqual([['comentar'], ['compartir'], ['connectar']]);
  for (const nom of ['Tornar arrere', 'Índex de secció', 'Tornar endavant', 'Traduir']) {
    expect(barra.querySelector(`button[aria-label="${nom}"]`).hasAttribute('aria-disabled')).toBe(false);
  }
});

test('T7 · sense accionsInoperatives cap botó porta aria-disabled (el marcatge de sempre)', () => {
  const barra = blava(TOTES);
  expect(barra.querySelectorAll('[aria-disabled]')).toHaveLength(0);
});

test('T7 · inoperatius sense onClickInoperatiu: com abans, el botó no té cap acció i queda desactivat', () => {
  const barra = blava({ ...TOTES, accionsInoperatives: true });
  for (const nom of ['Comentar', 'Compartir', 'Connectar']) {
    expect(barra.querySelector(`button[aria-label="${nom}"]`).disabled).toBe(true);
  }
});
