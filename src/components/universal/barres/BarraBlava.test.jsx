import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { BarraBlava, NOMS_COMENTAR } from './BarraBlava.jsx';
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
/* T63.2 · Només canvia el nom de Comentar (aria-label i title): el marcatge és
   el de sempre. Sense saber on porta, «Comentar»; la pàgina, el xat comú. */
const comprovaMarcatge = (barra, nomComentar) => {
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
  comprovaMarcatge(blava(TOTES), 'Comentar');
  cleanup();
  window.history.replaceState(null, '', '/constitucio');
  comprovaMarcatge(render(<UniversalPage chrome="context" title="Pàgina" />).container.querySelector('header.bar-blue'), 'Comentar al xat comú');
  cleanup();
  // Una pàgina sense xat comú (una consulta, l'arrel): el mateix marcatge i el nom neutre.
  window.history.replaceState(null, '', '/wikidepoble?item=genoma');
  comprovaMarcatge(render(<UniversalPage chrome="context" title="Genoma" />).container.querySelector('header.bar-blue'), 'Comentar');
});

/* T63.2 (doctrina del Mestre, 260928) · El rètol «Comentar (Xat Privat)» era
   fals: Comentar obri el xat comú de la Pàgina Universal, i només per a una
   persona o una IA el missatge directe. */
test('T63.2 · el nom de Comentar diu on porta: xat comú, missatge directe o, sense saber-ho, «Comentar»', () => {
  const nomDe = (props) => {
    const barra = blava({ ...TOTES, ...props });
    const nom = barra.querySelector('.sp-card-actions').children[1].getAttribute('aria-label');
    cleanup();
    return nom;
  };
  expect(nomDe({ comentarXat: 'comu' })).toBe('Comentar al xat comú');
  expect(nomDe({ comentarXat: 'directe' })).toBe('Comentar per missatge directe');
  expect(nomDe({ comentarXat: null })).toBe('Comentar');
  expect(nomDe({ comentarXat: 'inventat' })).toBe('Comentar');
  expect(NOMS_COMENTAR).toEqual({ comu: 'Comentar al xat comú', directe: 'Comentar per missatge directe' });
  expect(Object.values(NOMS_COMENTAR).join(' ')).not.toMatch(/Privat/);
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
