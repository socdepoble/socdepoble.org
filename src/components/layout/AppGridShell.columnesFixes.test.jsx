/* Ordre del Mestre (30-10-2026 ~12:45) · «Fora de mòbil, l'UniversalWorkspace
   ha de mantindre sempre les 3 columnes fixes en la graella, mai superposades
   com a calaix flotant amb fons fosc»: AppGridShell columnesFixes. Per damunt
   d'«estret», la closca és «ample» amb els dos separadors; si les amplades
   desades no hi caben, es pinten repartides (graella.js, pistesAjustades) i
   arrossegar un separador fa cedir l'altra columna. Els panells i el vel
   queden per a «estret». Sense l'opció (el Xat), la closca d'abans.
   jsdom no fa layout: l'amplària de la closca i l'observador, a mà. */
import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AppGridShell, { useAppGrid } from './AppGridShell.jsx';

const desat = vi.hoisted(() => ({ amplades: { left: 260, middle: 280 }, setVal: null }));
vi.mock('../../config/storage.js', () => {
  desat.setVal = vi.fn();
  return { getVal: () => desat.amplades, setVal: (...args) => desat.setVal(...args) };
});

let avisos = new Set();
let amplada = 800;
beforeEach(() => {
  avisos = new Set();
  amplada = 800;
  desat.amplades = { left: 260, middle: 280 };
  desat.setVal.mockClear();
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => amplada);
  vi.stubGlobal('ResizeObserver', class {
    constructor(cb) { this.cb = cb; }
    observe() { avisos.add(this.cb); }
    unobserve() {}
    disconnect() { avisos.delete(this.cb); }
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const redimensiona = (nova) => {
  amplada = nova;
  act(() => { [...avisos].forEach((cb) => cb([{ contentRect: { width: nova } }])); });
};

/* Un botó que demana un panell, com l'obridor d'un consumidor. */
function Panell({ valor }) {
  const { setPanellObert } = useAppGrid();
  return <button type="button" onClick={() => setPanellObert(valor)}>Obri {valor}</button>;
}

const closca = (c) => c.querySelector('.app-grid-shell');
const pagina = (c) => c.querySelector('.app-grid-page');
const pistes = (c) => [
  pagina(c).style.getPropertyValue('--app-grid-col-sidebar'),
  pagina(c).style.getPropertyValue('--app-grid-col-list')
];
const separador = (c, costat) => c.querySelector(`.app-grid-resizer--${costat}`);
const tancada = (el) => [el.hasAttribute('inert'), el.getAttribute('aria-hidden')];

test('a 800 amb columnesFixes: «ample», les tres columnes obertes i els dos separadors; sense, «mitja» com abans', () => {
  const sense = render(<AppGridShell />);
  expect(closca(sense.container).dataset.layout).toBe('mitja');
  expect(separador(sense.container, 'left')).toBeNull();
  expect(tancada(sense.container.querySelector('#app-grid-sidebar'))).toEqual([true, 'true']);
  cleanup();

  const { container } = render(<AppGridShell columnesFixes />);
  expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['ample', '']);
  for (const id of ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']) {
    expect([id, ...tancada(container.querySelector(id))]).toEqual([id, false, null]);
  }
  expect(separador(container, 'left')).not.toBeNull();
  expect(separador(container, 'middle')).not.toBeNull();
  /* 260 + 280 no hi caben amb els 320 del detall: es pinten repartides i els
     separadors parteixen de la que es veu. Les desades no canvien. */
  expect(pistes(container)).toEqual(['222px', '256px']);
  expect(separador(container, 'left').getAttribute('aria-valuenow')).toBe('222');
  expect(separador(container, 'middle').getAttribute('aria-valuenow')).toBe('256');
  expect(desat.setVal).not.toHaveBeenCalledWith('sdp-grid-widths', expect.objectContaining({ left: 222 }));
});

test('desplegar la navegació a 800 l’obri dins de la graella amb el seu separador, mai com a panell', () => {
  const { container, rerender } = render(<AppGridShell columnesFixes leftCollapsed />);
  expect(container.querySelector('.has-left-collapsed')).not.toBeNull();
  expect(separador(container, 'left')).toBeNull();
  /* Plegada, la llista hi cap amb la desada. */
  expect(pistes(container)[1]).toBe('280px');
  rerender(<AppGridShell columnesFixes />);
  expect([closca(container).dataset.layout, closca(container).dataset.panell]).toEqual(['ample', '']);
  expect(container.querySelector('.has-left-collapsed')).toBeNull();
  expect(separador(container, 'left')).not.toBeNull();
  expect(separador(container, 'middle')).not.toBeNull();
  /* Sense columnesFixes, la mateixa expansió obri el panell de «mitja». */
  cleanup();
  const vell = render(<AppGridShell leftCollapsed />);
  vell.rerender(<AppGridShell />);
  expect([closca(vell.container).dataset.layout, closca(vell.container).dataset.panell]).toEqual(['mitja', 'left']);
});

test('estrényer la closca reparteix les pistes i eixamplar-la torna les desades; per davall d’«estret», els panells de sempre', () => {
  amplada = 1180;
  const { container } = render(<AppGridShell columnesFixes><Panell valor="left" /></AppGridShell>);
  expect(pistes(container)).toEqual(['260px', '280px']);
  redimensiona(820);
  expect(closca(container).dataset.layout).toBe('ample');
  expect(pistes(container)).toEqual(['234px', '264px']);
  /* Gauntlet 261030 (cicle 4) · Per davall de 762 els mínims (200 + 240) no
     hi caben amb el detall: cedixen fins als sòls i el detall conserva els
     seus 320 (721 − 183 − 216 − 2). */
  redimensiona(721);
  expect(pistes(container)).toEqual(['183px', '216px']);
  redimensiona(1180);
  expect(pistes(container)).toEqual(['260px', '280px']);
  redimensiona(375);
  expect(closca(container).dataset.layout).toBe('estret');
  expect(separador(container, 'left')).toBeNull();
  fireEvent.click(container.querySelector('button'));
  expect(closca(container).dataset.panell).toBe('left');
  expect(tancada(container.querySelector('#app-grid-sidebar'))).toEqual([false, null]);
});

test('el separador de la navegació la fa créixer i la llista li cedix espai fins al seu mínim; el detall conserva el seu', () => {
  const { container } = render(<AppGridShell columnesFixes />);
  const esquerre = separador(container, 'left');
  /* Fletxa dreta: +16 sobre la que es veu (222). */
  fireEvent.keyDown(esquerre, { key: 'ArrowRight' });
  expect(desat.setVal).toHaveBeenLastCalledWith('sdp-grid-widths', { left: 238, middle: 240 });
  expect(pistes(container)).toEqual(['238px', '240px']);
  /* Fins al topall: la llista al mínim (240) i el detall amb els seus 320. */
  fireEvent.keyDown(separador(container, 'left'), { key: 'End' });
  expect(pistes(container)).toEqual(['238px', '240px']);
  /* La llista també es mou: creix i la navegació cedix. */
  fireEvent.keyDown(separador(container, 'middle'), { key: 'ArrowRight' });
  expect(desat.setVal).toHaveBeenLastCalledWith('sdp-grid-widths', { left: 222, middle: 256 });
  expect(pistes(container)).toEqual(['222px', '256px']);
  fireEvent.keyDown(separador(container, 'middle'), { key: 'Home' });
  expect(pistes(container)[1]).toBe('240px');
});

test('amb la llista plegada, la navegació creix fins on deixa el rail i el detall', () => {
  const { container } = render(<AppGridShell columnesFixes middleCollapsed />);
  expect(separador(container, 'middle')).toBeNull();
  fireEvent.keyDown(separador(container, 'left'), { key: 'End' });
  /* 340 és el màxim de la navegació; 800 − 56 − 322 = 422 ho permet. */
  expect(desat.setVal).toHaveBeenLastCalledWith('sdp-grid-widths', { left: 340, middle: 280 });
  expect(pistes(container)[0]).toBe('340px');
});

/* Gauntlet 261030 (cicle 4) · Amb les pistes ajustades (800, desades 260/280,
   pintades 222/256), operar un separador mou NOMÉS eixe separador: l'altra
   columna conserva la seua amplada pintada i el detall absorbix la diferència.
   Abans, l'altra tornava cap a la desada i l'espai alliberat se l'enduia ella. */
const valor = (c, costat) => separador(c, costat).getAttribute('aria-valuenow');
const minim = (c, costat) => separador(c, costat).getAttribute('aria-valuemin');

test('a 800 acabat de muntar, la fletxa ← del separador del mig estreny la llista i la navegació no es mou', () => {
  const { container } = render(<AppGridShell columnesFixes />);
  expect([minim(container, 'left'), minim(container, 'middle')]).toEqual(['200', '240']);
  fireEvent.keyDown(separador(container, 'middle'), { key: 'ArrowLeft' });
  expect(pistes(container)).toEqual(['222px', '240px']);
  expect(valor(container, 'left')).toBe('222');
  expect(desat.setVal).toHaveBeenLastCalledWith('sdp-grid-widths', { left: 222, middle: 240 });
});

test('a 800 acabat de muntar, la fletxa ← del separador esquerre estreny la navegació i la llista no es mou', () => {
  const { container } = render(<AppGridShell columnesFixes />);
  fireEvent.keyDown(separador(container, 'left'), { key: 'ArrowLeft' });
  expect(pistes(container)).toEqual(['206px', '256px']);
  expect(valor(container, 'middle')).toBe('256');
});

test('a 800 acabat de muntar, arrossegar el separador del mig el mou amb el punter i deixa quiet l’esquerre', () => {
  const { container } = render(<AppGridShell columnesFixes />);
  const mig = separador(container, 'middle');
  fireEvent.pointerDown(mig, { button: 0, pointerId: 1, clientX: 478 });
  fireEvent.pointerMove(mig, { pointerId: 1, clientX: 468 });
  expect(pistes(container)).toEqual(['222px', '246px']);
  /* Més enllà del mínim de la llista, el separador s'hi atura. */
  fireEvent.pointerMove(mig, { pointerId: 1, clientX: 438 });
  expect(pistes(container)).toEqual(['222px', '240px']);
  fireEvent.pointerUp(mig, { pointerId: 1, clientX: 438 });
  expect(valor(container, 'left')).toBe('222');
});

/* Gauntlet 261030 (cicle 4) · De 720 a 761 els mínims (200 + 240 + 320 + 2 =
   762) no hi caben: valen els sòls (160/180), el detall conserva els 320 i
   els dos separadors es mouen en totes dues direccions. */
test('a 740, el detall conserva els 320 i els dos separadors es mouen cap a tots dos costats', () => {
  amplada = 740;
  const { container } = render(<AppGridShell columnesFixes />);
  expect(pistes(container)).toEqual(['191px', '227px']);
  expect([minim(container, 'left'), minim(container, 'middle')]).toEqual(['160', '180']);
  fireEvent.keyDown(separador(container, 'left'), { key: 'ArrowLeft' });
  expect(pistes(container)).toEqual(['175px', '227px']);
  fireEvent.keyDown(separador(container, 'left'), { key: 'ArrowRight' });
  fireEvent.keyDown(separador(container, 'left'), { key: 'ArrowRight' });
  /* La navegació creix i la llista li cedix: 740 − 207 − 322 = 211. */
  expect(pistes(container)).toEqual(['207px', '211px']);
  fireEvent.keyDown(separador(container, 'middle'), { key: 'ArrowRight' });
  expect(pistes(container)).toEqual(['191px', '227px']);
  fireEvent.keyDown(separador(container, 'middle'), { key: 'ArrowLeft' });
  expect(pistes(container)).toEqual(['191px', '211px']);
});

/* Corrector del Gauntlet f4 (30-10-2026, separadors-aria-valuemax-fals) · Cada
   separador declara el seu màxim real (el que deixa l'altra columna al seu
   mínim, el detall i els dos separadors: la regla de resizeColumn), no els
   340/520 fixos: Fi hi porta, el lector anuncia «N de N» on ja no es pot
   créixer, i ArrowRight no hi és mut amb un màxim que no es pot assolir. I
   nomena la columna que redimensiona (aria-controls, patró «Window
   Splitter» de l'APG). */
const maxim = (c, costat) => separador(c, costat).getAttribute('aria-valuemax');

test('a 800, 721, 761 i 1440 els separadors declaren el màxim real, i Fi hi porta', () => {
  for (const [ample, esquerre, mig] of [[800, '238', '278'], [721, '219', '239'], [761, '259', '279'], [1440, '340', '520']]) {
    amplada = ample;
    const { container } = render(<AppGridShell columnesFixes />);
    expect([ample, maxim(container, 'left'), maxim(container, 'middle')]).toEqual([ample, esquerre, mig]);
    fireEvent.keyDown(separador(container, 'middle'), { key: 'End' });
    expect([ample, valor(container, 'middle')]).toEqual([ample, mig]);
    /* Al màxim, ArrowRight no hi afig res que el lector no sàpia. */
    fireEvent.keyDown(separador(container, 'middle'), { key: 'ArrowRight' });
    expect([ample, valor(container, 'middle'), maxim(container, 'middle')]).toEqual([ample, mig, mig]);
    cleanup();
  }
});

test('amb la llista plegada, el separador de la navegació declara fins on deixa el rail; i cada separador nomena la seua columna', () => {
  const { container } = render(<AppGridShell columnesFixes middleCollapsed />);
  /* 800 − 56 − 320 − 2 = 422, més que el 340 de la navegació. */
  expect(maxim(container, 'left')).toBe('340');
  expect(separador(container, 'middle')).toBeNull();
  cleanup();
  const obertes = render(<AppGridShell columnesFixes />);
  expect(separador(obertes.container, 'left').getAttribute('aria-controls')).toBe('app-grid-sidebar');
  expect(separador(obertes.container, 'middle').getAttribute('aria-controls')).toBe('app-grid-list');
  expect(obertes.container.querySelector('#app-grid-sidebar')).not.toBeNull();
  expect(obertes.container.querySelector('#app-grid-list')).not.toBeNull();
});

test('sense columnesFixes (el Xat, les apps), el separador del mig de «mitja» declara fins on deixa el detall', () => {
  const { container } = render(<AppGridShell />);
  expect(closca(container).dataset.layout).toBe('mitja');
  expect(maxim(container, 'middle')).toBe(String(800 - 320));
  fireEvent.keyDown(separador(container, 'middle'), { key: 'End' });
  expect(valor(container, 'middle')).toBe(String(800 - 320));
});

test('una amplada feta per davall del mínim en una closca estreta es pinta al mínim quan la closca s’eixampla', () => {
  amplada = 740;
  const { container } = render(<AppGridShell columnesFixes />);
  fireEvent.keyDown(separador(container, 'left'), { key: 'Home' });
  expect(pistes(container)).toEqual(['160px', '227px']);
  /* Desades 160/227: totes dues per davall dels mínims de sempre (200/240). */
  redimensiona(1180);
  expect(pistes(container)).toEqual(['200px', '240px']);
  expect([minim(container, 'left'), valor(container, 'left')]).toEqual(['200', '200']);
});

/* Decisió 1 del Mestre (30-10-2026 ~15:00: «> 720 px per a 3 columnes fixes
   i <= 720 px per a vista mòbil») · Una closca de 720 justos és «estret», amb
   columnesFixes (el Workspace) i sense (el Xat, les apps): sense separadors i
   amb els panells del mòbil, com la CSS (max-width: 720px). A 721, les tres
   columnes fixes (o «mitja» sense l'opció). */
test('a 720 justos la closca és «estret» amb i sense columnesFixes; a 721, ja no', () => {
  for (const [opcions, a721] of [[{ columnesFixes: true }, 'ample'], [{}, 'mitja']]) {
    amplada = 720;
    const { container } = render(<AppGridShell {...opcions}><Panell valor="left" /></AppGridShell>);
    expect([opcions, closca(container).dataset.layout]).toEqual([opcions, 'estret']);
    expect(container.querySelector('.app-grid-resizer')).toBeNull();
    fireEvent.click(container.querySelector('button'));
    expect(closca(container).dataset.panell).toBe('left');
    redimensiona(721);
    expect([opcions, closca(container).dataset.layout]).toEqual([opcions, a721]);
    cleanup();
  }
});
