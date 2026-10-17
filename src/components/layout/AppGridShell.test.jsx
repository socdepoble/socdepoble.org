import React, { StrictMode, useEffect, useLayoutEffect, useRef } from 'react';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import AppGridShell, { useAppGrid } from './AppGridShell.jsx';

/* Barres (ordre del Mestre, 261004) · El mock era { left: 420, middle: 340 }
   i SANEJA_AMPLADA (AppGridShell.jsx) rebutja amb raó el left de 420, fora
   de COLUMN_LIMITS.left (200-340): el canviava pel de per defecte (260) i el
   mínim d'ample baixava a 922, de manera que 950 ja era «ample» i la prova
   de plegar es tornava roja. Les dues amplàries, ara dins dels límits i
   intercanviades: la suma és la mateixa (760) i el mínim d'ample continua
   sent 1082 (340 + 420 + 320 + 2). Tots els talls dels comentaris valen. */
vi.mock('../../config/storage.js', () => ({
  getVal: () => ({ left: 340, middle: 420 }),
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
   <body>. Amb el mock de 340/420, minAmple és 1082: 800 és mitjà i 375,
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

/* ═══ MD (ordre del Mestre, 261003) · Mestre-detall en estret ═════════════
   panellEstret: el panell d'eixida en muntar en estret (el primer
   mesurament). tornaEstret: amb ell, el context oferix tornaDelDetall, que torna
   al panell d'on es venia i hi porta el focus. Sense les propietats, la
   closca d'abans. Amb el mock de 340/420: 1400 és ample, 820 mitjà, 375
   estret. */

/* La fletxa ← d'un detall: diu si la closca oferix la tornada i la crida. */
function Torna() {
  const { tornaDelDetall } = useAppGrid();
  return (
    <button type="button" data-tornada={tornaDelDetall ? 'si' : 'no'} onClick={() => tornaDelDetall?.()}>
      Torna
    </button>
  );
}

const Fitxa = ({ nom, actual = false }) => (
  <button type="button" aria-current={actual ? 'true' : undefined}>{nom}</button>
);

const panellDe = (container) => container.querySelector('.app-grid-shell').dataset.panell;
const tornada = (container) => within(container.querySelector('#app-grid-main')).getByText('Torna');
/* Mai dos panells oberts: en estret, una sola columna sense aria-hidden. */
const obertes = (container) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => container.querySelector(id).getAttribute('aria-hidden') !== 'true');

test('MD · a 375, amb panellEstret la primera vista és la navegació; sense, el detall com sempre', () => {
  ambAmplada(375);
  senseObservador();
  const columnes = { leftColumn: <p>Carpetes</p>, middleColumn: <p>Llista</p>, rightColumn: <p>Detall</p> };
  const amb = render(<AppGridShell panellEstret="left" {...columnes} />);
  const shell = amb.container.querySelector('.app-grid-shell');
  expect([shell.dataset.layout, shell.dataset.panell]).toEqual(['estret', 'left']);
  const detall = amb.container.querySelector('#app-grid-main');
  expect(detall.getAttribute('aria-hidden')).toBe('true');
  expect(detall.getAttribute('inert')).toBe('true');
  expect(obertes(amb.container)).toEqual(['#app-grid-sidebar']);
  cleanup();
  const sense = render(<AppGridShell {...columnes} />);
  expect(panellDe(sense.container)).toBe('');
  expect(obertes(sense.container)).toEqual(['#app-grid-main']);
});

/* Revisió de MD · panellEstret només en muntar. Una closca ja muntada que
   passa d'ample a estret d'un salt (finestra encaixada, Split View,
   l'amfitrió que s'estreny) es queda amb el detall, com abans de MD: qui hi
   escrivia no perd l'editor ni el focus (la guarda T6 no li fa blur()). */
test('MD · d’ample a estret amb la closca muntada el detall es queda, amb el focus; de mitjà a estret el panell es conserva, com ara', () => {
  let avisa = null;
  vi.stubGlobal('ResizeObserver', class { constructor(cb) { avisa = cb; } observe() {} disconnect() {} });
  const amplada = ambAmplada(1400);
  const onPanell = vi.fn();
  const columnes = { leftColumn: <p>Carpetes</p>, middleColumn: <p>Llista</p>, rightColumn: <input aria-label="Cos de la nota" /> };
  const ample = render(<AppGridShell panellEstret="left" onPanell={onPanell} {...columnes} />);
  expect(panellDe(ample.container)).toBe('');
  const editor = within(ample.container.querySelector('#app-grid-main')).getByRole('textbox', { name: 'Cos de la nota' });
  editor.focus();
  amplada.mockReturnValue(375);
  act(() => avisa());
  expect(ample.container.querySelector('.app-grid-shell').dataset.layout).toBe('estret');
  expect(panellDe(ample.container)).toBe('');
  expect(obertes(ample.container)).toEqual(['#app-grid-main']);
  expect(document.activeElement).toBe(editor);
  expect(onPanell).toHaveBeenLastCalledWith(null);
  cleanup();
  amplada.mockReturnValue(820);
  const mitja = render(<AppGridShell panellEstret="left" {...columnes} />);
  expect(mitja.container.querySelector('.app-grid-shell').dataset.layout).toBe('mitja');
  amplada.mockReturnValue(375);
  act(() => avisa());
  expect(mitja.container.querySelector('.app-grid-shell').dataset.layout).toBe('estret');
  expect(panellDe(mitja.container)).toBe('');
});

/* Revisió de MD · StrictMode (el de l'App) torna a córrer els efectes de
   muntatge abans del render següent: el segon mesurament també és «el
   primer», i el panell d'eixida no es perd. */
test('MD · en StrictMode, a 375 el panell d’eixida és panellEstret', () => {
  ambAmplada(375);
  senseObservador();
  const { container } = render(
    <StrictMode>
      <AppGridShell panellEstret="left" leftColumn={<p>Carpetes</p>} middleColumn={<p>Llista</p>} rightColumn={<p>Detall</p>} />
    </StrictMode>
  );
  expect(panellDe(container)).toBe('left');
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);
});

test('MD · panellEstret com a funció es llig en entrar a estret, i onPanell avisa de cada nivell (només en estret)', () => {
  ambAmplada(375);
  senseObservador();
  const nivell = { actual: 'middle' };
  const onPanell = vi.fn();
  const { container } = render(
    <AppGridShell
      panellEstret={() => nivell.actual}
      onPanell={onPanell}
      leftColumn={<p>Carpetes</p>}
      middleColumn={<Panell nom="Obri" valor={null} />}
      rightColumn={<Panell nom="Llista" valor="middle" />}
    />
  );
  expect(panellDe(container)).toBe('middle');
  expect(onPanell).toHaveBeenLastCalledWith('middle');
  fireEvent.click(within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Obri' }));
  expect(panellDe(container)).toBe('');
  expect(onPanell).toHaveBeenLastCalledWith(null);
  cleanup();
  onPanell.mockClear();
  ambAmplada(1400);
  const ample = render(<AppGridShell panellEstret="left" onPanell={onPanell} rightColumn={<p>Detall</p>} />);
  expect(panellDe(ample.container)).toBe('');
  expect(onPanell).not.toHaveBeenCalled();
});

test('MD · tornaDelDetall només existix en estret, amb el detall a la vista i tornaEstret', () => {
  senseObservador();
  const closca = (props) => (
    <AppGridShell
      leftColumn={<p>Carpetes</p>}
      middleColumn={<Panell nom="Obri" valor={null} />}
      rightColumn={<Torna />}
      {...props}
    />
  );
  for (const amplada of [1400, 820]) {
    ambAmplada(amplada);
    const { container } = render(closca({ tornaEstret: 'middle' }));
    expect(tornada(container).dataset.tornada, `${amplada}`).toBe('no');
    cleanup();
  }
  ambAmplada(375);
  const sense = render(closca({}));
  expect(panellDe(sense.container)).toBe('');
  expect(tornada(sense.container).dataset.tornada).toBe('no');
  cleanup();
  const ambPanell = render(closca({ tornaEstret: 'middle', panellEstret: 'middle' }));
  expect(panellDe(ambPanell.container)).toBe('middle');
  expect(tornada(ambPanell.container).dataset.tornada).toBe('no');
  fireEvent.click(within(ambPanell.container.querySelector('#app-grid-list')).getByRole('button', { name: 'Obri' }));
  expect(tornada(ambPanell.container).dataset.tornada).toBe('si');
});

test('MD · la tornada obri el panell d’on es venia i porta el focus a l’element actual, sense retindre’l al detall', () => {
  ambAmplada(375);
  senseObservador();
  const { container } = render(
    <AppGridShell
      panellEstret="middle"
      tornaEstret="middle"
      leftColumn={<p>Carpetes</p>}
      middleColumn={(
        <>
          <Fitxa nom="Primera" />
          <Fitxa nom="Segona" actual />
          <Panell nom="Obri" valor={null} />
        </>
      )}
      rightColumn={<Torna />}
    />
  );
  const llista = container.querySelector('#app-grid-list');
  fireEvent.click(within(llista).getByRole('button', { name: 'Obri' }));
  expect(panellDe(container)).toBe('');
  const torna = tornada(container);
  torna.focus();
  fireEvent.click(torna);
  expect(panellDe(container)).toBe('middle');
  expect(obertes(container)).toEqual(['#app-grid-list']);
  expect(container.querySelector('#app-grid-main').contains(document.activeElement)).toBe(false);
  expect(retingut(container, document.activeElement)).toBe(false);
  expect(document.activeElement).toBe(within(llista).getByRole('button', { name: 'Segona' }));
});

test('MD · sense panell anterior (un enllaç profund) torna a tornaEstret i, sense element actual, enfoca el contenidor del panell', () => {
  ambAmplada(375);
  senseObservador();
  const { container } = render(
    <AppGridShell
      tornaEstret="middle"
      leftColumn={<p>Carpetes</p>}
      middleColumn={<aside tabIndex={-1} aria-label="NOTES"><button type="button">Una</button></aside>}
      rightColumn={<Torna />}
    />
  );
  expect(panellDe(container)).toBe('');
  const torna = tornada(container);
  torna.focus();
  fireEvent.click(torna);
  expect(panellDe(container)).toBe('middle');
  expect(document.activeElement).toBe(container.querySelector('#app-grid-list aside'));
});

test('MD · si es va al detall des de la navegació, la tornada hi torna (el panell d’on es venia)', () => {
  ambAmplada(375);
  senseObservador();
  const { container } = render(
    <AppGridShell
      panellEstret="left"
      tornaEstret="middle"
      leftColumn={(
        <>
          <Fitxa nom="Mur" actual />
          <Panell nom="Directe" valor={null} />
        </>
      )}
      middleColumn={<p>Llista</p>}
      rightColumn={<Torna />}
    />
  );
  fireEvent.click(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'Directe' }));
  expect(panellDe(container)).toBe('');
  fireEvent.click(tornada(container));
  expect(panellDe(container)).toBe('left');
  expect(document.activeElement).toBe(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'Mur' }));
});

/* ═══ Gauntlet 261016 (MCR b4_proves.2, proposta 2) · cap fuita de la closca ═══
   L'únic recurs viu de la closca és el ResizeObserver d'AppGridShell.jsx:244-247, i es desconnecta en la
   neteja de l'efecte. Fins ara només ho veia el Workspace (tests/gauntlet-codex-lifecycle.test.jsx); el Xat,
   les apps i la Consola munten la closca sense ell, i les seues proves fan servir un observador inert. Ací,
   un observador comptador (el patró de lifecycle:14-18): observe l'afig al conjunt dels vius i disconnect
   el lleva. En StrictMode l'efecte es munta, es desmunta i es torna a muntar: en queda un de viu, que mesura
   de veres la pàgina (ambAmplada per al clientWidth), i cap després de desmuntar. */
test('el ResizeObserver de la closca es desconnecta en desmuntar-la: 50 muntatges en StrictMode, sense Workspace', () => {
  const vius = new Set();
  const creats = [];
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) {
      this.callback = callback;
      this.observats = [];
      creats.push(this);
    }
    observe(element) {
      this.observats.push(element);
      vius.add(this);
    }
    disconnect() {
      vius.delete(this);
    }
  });
  for (let cicle = 0; cicle < 50; cicle++) {
    const amplada = ambAmplada(1400);
    const { container, unmount } = render(<StrictMode><Closca /></StrictMode>);
    const shell = container.querySelector('.app-grid-shell');
    expect(vius.size, `cicle ${cicle}: muntada`).toBe(1);
    const [viu] = vius;
    expect(viu.observats).toEqual([container.querySelector('.app-grid-page')]);
    expect(shell.dataset.layout).toBe('ample');
    /* L'observador viu és el que mesura: la pàgina es fa estreta i la closca ho nota sense cap altre canvi. */
    amplada.mockReturnValue(375);
    act(() => viu.callback([]));
    expect(shell.dataset.layout, `cicle ${cicle}: estreta`).toBe('estret');
    unmount();
    expect(vius.size, `cicle ${cicle}: desmuntada`).toBe(0);
  }
  /* StrictMode: dos efectes per muntatge, cap més (la dependència, demanaPanell, és estable), i cap viu. */
  expect(creats).toHaveLength(100);
  expect(creats.filter((observador) => vius.has(observador))).toEqual([]);
});
