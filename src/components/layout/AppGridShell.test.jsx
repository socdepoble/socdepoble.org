import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AppGridShell, { useAppGrid } from './AppGridShell.jsx';

vi.mock('../../config/storage.js', () => ({
  getVal: () => ({ left: 420, middle: 340 }),
  setVal: vi.fn()
}));

afterEach(() => {
  cleanup();
  document.querySelectorAll('soc-de-poble').forEach((el) => el.remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('plegar i desplegar recalcula el layout sense esperar un canvi del contenidor', () => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(950);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  const { container, rerender } = render(<AppGridShell />);
  const shell = () => container.querySelector('.app-grid-shell');
  expect(shell().dataset.layout).toBe('mitja');

  rerender(<AppGridShell leftCollapsed />);
  expect(shell().dataset.layout).toBe('ample');
  expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
  expect(container.querySelector('#app-grid-sidebar').getAttribute('aria-hidden')).toBeNull();

  rerender(<AppGridShell />);
  expect(shell().dataset.layout).toBe('mitja');
  expect(shell().dataset.panell).toBe('left');
  expect(container.querySelector('#app-grid-sidebar').getAttribute('aria-hidden')).toBeNull();
});

/* ═══ T6 · La guarda del focus ═══════════════════════════════════════════
   Tancar una columna li posa aria-hidden i inert. Si el focus hi era dins,
   la closca l'ha de traure en el mateix commit: al botó a l'abast que la
   torna a obrir (data-obri-columna i aria-controls) o, si no n'hi ha cap, a
   <body>. Amb el mock de 420/340, minAmple és 1082: 800 és mitjà i 375,
   estret. */

/* Un botó que demana un panell a la closca; `controls`, la columna que
   torna a obrir: amb ell, és obridor de la closca (com BotoObriRail). */
function Panell({ nom, valor, controls }) {
  const { setPanellObert } = useAppGrid();
  return (
    <button type="button" aria-controls={controls} data-obri-columna={controls ? '' : undefined} onClick={() => setPanellObert(valor)}>
      {nom}
    </button>
  );
}

/* La capçalera del RailXat de mostra del catàleg (EspecimenXatRail): diu
   controlar #app-grid-sidebar, però no és cap obridor de la closca. */
const Alie = () => <button type="button" aria-expanded="true" aria-controls="app-grid-sidebar">Replegar Menú</button>;

/* Anota on és el focus en el primer efecte passiu de cada canvi de panell. */
function Sonda({ registre }) {
  const { panellObert } = useAppGrid();
  const ref = useRef(null);
  useEffect(() => {
    registre.push(ref.current?.getRootNode().activeElement ?? null);
  }, [panellObert, registre]);
  return <span ref={ref} />;
}

/* Com PanellInicialMobil.jsx:26-28: en estret, un null torna a ser
   'middle' en fase de layout, dins del mateix lot. */
function Rebot() {
  const { mida, panellObert, setPanellObert } = useAppGrid();
  useLayoutEffect(() => {
    if (mida === 'estret' && panellObert === null) setPanellObert('middle');
  }, [mida, panellObert, setPanellObert]);
  return null;
}

function Closca({ ambObridor = true, registre = null, ...props }) {
  return (
    <AppGridShell
      initialPane="left"
      leftColumn={<Panell nom="Xats" valor={null} />}
      middleColumn={(
        <>
          {ambObridor ? <Panell nom="Menú" valor="left" controls="app-grid-sidebar" /> : null}
          {registre ? <Sonda registre={registre} /> : null}
        </>
      )}
      rightColumn={<p>Detall</p>}
      {...props}
    />
  );
}

const ambAmplada = (amplada) => vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
const senseObservador = () => vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
/* Cap subarbre amb aria-hidden="true" conté l'element actiu. */
const retingut = (arrel, actiu) => [...arrel.querySelectorAll('[aria-hidden="true"]')].some((el) => el.contains(actiu));

/* El patró de Dialeg.test.jsx (muntaLocal): l'encastat munta l'app dins
   d'un Shadow DOM tancat, on document.activeElement és l'amfitrió. */
function muntaEnOmbra(element) {
  const host = document.createElement('soc-de-poble');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div');
  root.className = 'sdp-root';
  shadow.append(root);
  const muntatge = document.createElement('div');
  root.append(muntatge);
  return { host, shadow, root, ...render(element, { container: muntatge, baseElement: root }) };
}

test('T6 · en mitjà, tancar el panell esquerre amb el focus a dins el porta al botó que el torna a obrir, sense esperar cap fotograma', () => {
  ambAmplada(800);
  senseObservador();
  const registre = [];
  const { container } = render(<Closca registre={registre} />);
  const shell = container.querySelector('.app-grid-shell');
  expect([shell.dataset.layout, shell.dataset.panell]).toEqual(['mitja', 'left']);
  const sidebar = container.querySelector('#app-grid-sidebar');
  const xats = within(sidebar).getByRole('button', { name: 'Xats' });
  const menu = within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Menú' });
  xats.focus();
  expect(document.activeElement).toBe(xats);
  registre.length = 0;
  fireEvent.click(xats);
  expect(shell.dataset.panell).toBe('');
  /* El contracte de la closca continua: aria-hidden i inert. */
  expect(sidebar.getAttribute('aria-hidden')).toBe('true');
  expect(sidebar.getAttribute('inert')).toBe('true');
  expect(document.activeElement).toBe(menu);
  /* En el primer efecte passiu el focus ja hi és: l'ha mogut la fase de layout. */
  expect(registre[0]).toBe(menu);
});

test('T6 · sense cap botó que torne a obrir la columna, el focus s’allibera a <body> i cap aria-hidden el conté', () => {
  ambAmplada(800);
  senseObservador();
  const { container } = render(<Closca ambObridor={false} />);
  const sidebar = container.querySelector('#app-grid-sidebar');
  const xats = within(sidebar).getByRole('button', { name: 'Xats' });
  xats.focus();
  fireEvent.click(xats);
  expect(sidebar.getAttribute('aria-hidden')).toBe('true');
  expect(document.activeElement).toBe(document.body);
  expect(retingut(document, document.activeElement)).toBe(false);
});

/* Revisió del T6 · Disseny en mitjà amb l'espècimen «xat-rail» al detall: la
   seua capçalera porta aria-controls="app-grid-sidebar" dins de la columna
   dreta, oberta. La guarda no l'ha de prendre per l'obridor de la closca. */
test('T6 · un control aliè del detall amb aria-controls de la columna no rep el focus: sense obridor, va a <body>', () => {
  ambAmplada(800);
  senseObservador();
  const { container } = render(<Closca ambObridor={false} rightColumn={<Alie />} />);
  const sidebar = container.querySelector('#app-grid-sidebar');
  const alie = within(container.querySelector('#app-grid-main')).getByRole('button', { name: 'Replegar Menú' });
  const xats = within(sidebar).getByRole('button', { name: 'Xats' });
  xats.focus();
  fireEvent.click(xats);
  expect(sidebar.getAttribute('aria-hidden')).toBe('true');
  expect(document.activeElement).not.toBe(alie);
  expect(document.activeElement).toBe(document.body);
});

test('T6 · amb controls aliens abans i després en l’ordre del DOM, el focus va a l’obridor de la closca', () => {
  ambAmplada(800);
  senseObservador();
  const { container } = render(
    <Closca
      middleColumn={(
        <>
          <Alie />
          <Panell nom="Menú" valor="left" controls="app-grid-sidebar" />
        </>
      )}
      rightColumn={<Alie />}
    />
  );
  const sidebar = container.querySelector('#app-grid-sidebar');
  const menu = within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Menú' });
  const xats = within(sidebar).getByRole('button', { name: 'Xats' });
  xats.focus();
  fireEvent.click(xats);
  expect(sidebar.getAttribute('aria-hidden')).toBe('true');
  expect(document.activeElement).toBe(menu);
});

test('T6 · dins d’un Shadow DOM tancat la guarda llig el focus a l’arrel de la closca, no a document.activeElement', () => {
  ambAmplada(800);
  senseObservador();
  const { host, shadow, root } = muntaEnOmbra(<Closca />);
  const sidebar = root.querySelector('#app-grid-sidebar');
  const xats = within(sidebar).getByRole('button', { name: 'Xats' });
  const menu = within(root.querySelector('#app-grid-list')).getByRole('button', { name: 'Menú' });
  xats.focus();
  /* La premissa: fora de l'arrel només es veu l'amfitrió. */
  expect(document.activeElement).toBe(host);
  expect(shadow.activeElement).toBe(xats);
  fireEvent.click(xats);
  expect(sidebar.getAttribute('aria-hidden')).toBe('true');
  expect(shadow.activeElement).toBe(menu);
  expect(retingut(root, shadow.activeElement)).toBe(false);
});

test('T6 · en estret, cap transició deixa el focus dins d’una columna amagada', () => {
  ambAmplada(375);
  senseObservador();
  const { container } = render(
    <AppGridShell
      leftColumn={<Panell nom="Torna" valor="middle" controls="app-grid-list" />}
      middleColumn={(
        <>
          <Panell nom="Menú" valor="left" controls="app-grid-sidebar" />
          <Panell nom="Obri el detall" valor={null} controls="app-grid-main" />
        </>
      )}
      rightColumn={<Panell nom="Llista" valor="middle" controls="app-grid-list" />}
    />
  );
  const shell = container.querySelector('.app-grid-shell');
  expect([shell.dataset.layout, shell.dataset.panell]).toEqual(['estret', '']);
  const boto = (nom) => [...container.querySelectorAll('button')].find((b) => b.textContent === nom);
  const pas = (des, panell, desti) => {
    boto(des).focus();
    expect(document.activeElement).toBe(boto(des));
    fireEvent.click(boto(des));
    expect(shell.dataset.panell).toBe(panell);
    expect(retingut(container, document.activeElement), `${des} → ${panell || 'null'}`).toBe(false);
    expect(document.activeElement).toBe(boto(desti));
  };
  pas('Llista', 'middle', 'Obri el detall');
  pas('Menú', 'left', 'Torna');
  pas('Torna', 'middle', 'Menú');
  pas('Obri el detall', '', 'Llista');
});

test('T6 · passar d’ample a estret amb el focus a l’esquerra no el deixa retingut', () => {
  let avisa = null;
  vi.stubGlobal('ResizeObserver', class { constructor(cb) { avisa = cb; } observe() {} disconnect() {} });
  const amplada = ambAmplada(1200);
  const { container } = render(<Closca initialPane={null} />);
  const shell = container.querySelector('.app-grid-shell');
  expect(shell.dataset.layout).toBe('ample');
  const sidebar = container.querySelector('#app-grid-sidebar');
  const xats = within(sidebar).getByRole('button', { name: 'Xats' });
  xats.focus();
  amplada.mockReturnValue(375);
  act(() => avisa());
  expect(shell.dataset.layout).toBe('estret');
  expect(sidebar.getAttribute('aria-hidden')).toBe('true');
  /* «Menú» és a la central, també tancada en estret: no hi ha cap obridor a l'abast. */
  expect(retingut(container, document.activeElement)).toBe(false);
  expect(document.activeElement).toBe(document.body);
});

test('T6 · si un efecte de layout torna a obrir en el mateix lot la columna que es tanca, el focus es queda on era', () => {
  ambAmplada(375);
  senseObservador();
  const { container } = render(
    <AppGridShell
      leftColumn={<p>Menú</p>}
      middleColumn={(
        <>
          <Rebot />
          <Panell nom="Tanca" valor={null} />
        </>
      )}
      rightColumn={<p>Detall</p>}
    />
  );
  const shell = container.querySelector('.app-grid-shell');
  expect(shell.dataset.panell).toBe('middle');
  const tanca = within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Tanca' });
  tanca.focus();
  fireEvent.click(tanca);
  expect(shell.dataset.panell).toBe('middle');
  expect(document.activeElement).toBe(tanca);
});
