import { Component, StrictMode, Suspense, useMemo } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { esErrorLazy, LazyRouteError, lazyRouteRenovable } from './lazyRoute.js';

/* Pla 261028_1526 (P1-55, GN-R01) · lazyRouteRenovable: el propietari d'una
   vista diferida (la columna dreta d'una comunitat al Xat) la torna a demanar
   en una intenció nova (una clau diferent), mai en bucle. Les proves pinten
   el mateix patró que XatSection: una barrera amb `key={clau}` que només
   recull els errors lazy i un useMemo sobre la clau. lazyRoute no canvia: el
   seu «cap falso reintent» és a RouteErrorBoundary.test.jsx. */

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const noArriba = () => new TypeError('Failed to fetch dynamically imported module');
const Viva = ({ clau }) => <p>viva {clau}</p>;

/* Cada crida consumix un pas del pla ('falla' o 'ok'); acabat el pla, arriba. */
function carregador(pla, modul = { default: Viva }) {
  const passos = [...pla];
  return vi.fn(() => (passos.shift() === 'falla' ? Promise.reject(noArriba()) : Promise.resolve(modul)));
}

class Barrera extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { this.props.onError?.(error); }
  render() {
    if (!this.state.error) return this.props.children;
    if (!esErrorLazy(this.state.error)) throw this.state.error;
    return this.props.fallback;
  }
}

class BarreraDeFora extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() { return this.state.error ? <p>de fora: {this.state.error.message}</p> : this.props.children; }
}

function Columna({ fitxa, clau, onError }) {
  const Vista = useMemo(() => fitxa.vigent(clau), [fitxa, clau]);
  return (
    <Barrera key={clau} fallback={<p>buida {clau}</p>} onError={onError}>
      <Suspense fallback={<p>espera</p>}><Vista clau={clau} /></Suspense>
    </Barrera>
  );
}

test('(a) el carregador rebutja una volta: la clau A mostra la columna buida i la B la torna a demanar i pinta', async () => {
  const importa = carregador(['falla', 'ok']), fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('buida A')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(1);

  vista.rerender(<Columna fitxa={fitxa} clau="B" />);
  expect(await screen.findByText('viva B')).toBeTruthy();
  expect(screen.queryByText('buida B')).toBeNull();
  expect(importa).toHaveBeenCalledTimes(2);
});

/* Revisió adversarial · Recuperat en B, el rebuig de A ja no compta: la C
   reutilitza el tros que ha arribat, sense baixar-lo ni suspendre. */
test('(a) recuperat en B, la clau C no torna a baixar el tros ni suspén', async () => {
  const importa = carregador(['falla', 'ok']), fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('buida A')).toBeTruthy();
  vista.rerender(<Columna fitxa={fitxa} clau="B" />);
  expect(await screen.findByText('viva B')).toBeTruthy();

  vista.rerender(<Columna fitxa={fitxa} clau="C" />);
  expect(screen.queryByText('espera')).toBeNull();
  expect(screen.getByText('viva C')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(2);
});

test('(b) remuntar la mateixa clau després d’un rebuig no torna a demanar el tros: cap bucle', async () => {
  const importa = carregador(['falla', 'ok']), fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('buida A')).toBeTruthy();

  vista.rerender(<p>fora</p>);
  vista.rerender(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('buida A')).toBeTruthy();
  vista.rerender(<Columna fitxa={fitxa} clau="A" />);
  await Promise.resolve();
  expect(screen.getByText('buida A')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(1);

  /* La intenció nova sí: una altra clau el torna a demanar. */
  vista.rerender(<Columna fitxa={fitxa} clau="B" />);
  expect(await screen.findByText('viva B')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(2);
});

test('(c) sense fallades, un sol import per a tres claus', async () => {
  const importa = carregador([]), fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('viva A')).toBeTruthy();
  vista.rerender(<Columna fitxa={fitxa} clau="B" />);
  expect(await screen.findByText('viva B')).toBeTruthy();
  vista.rerender(<Columna fitxa={fitxa} clau="C" />);
  expect(await screen.findByText('viva C')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(1);
});

test('(d) un rebuig anterior es torna a provar en la clau diferent següent, també la que ja havia fallat', async () => {
  const importa = carregador(['falla', 'falla', 'ok']), fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('buida A')).toBeTruthy();
  vista.rerender(<Columna fitxa={fitxa} clau="B" />);
  expect(await screen.findByText('buida B')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(2);

  vista.rerender(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('viva A')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(3);
});

test('(d) un rebuig que arriba després del canvi és de la clau que hi ha en pantalla: la següent el torna a demanar', async () => {
  let rebutja;
  const primera = new Promise((_, no) => { rebutja = no; });
  const importa = vi.fn().mockReturnValueOnce(primera).mockResolvedValue({ default: Viva });
  const fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('espera')).toBeTruthy();

  /* Una càrrega pendent es compartix: la B no en demana una altra. */
  vista.rerender(<Columna fitxa={fitxa} clau="B" />);
  rebutja(noArriba());
  expect(await screen.findByText('buida B')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(1);

  vista.rerender(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('viva A')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(2);
});

test('(e) el rebuig puja com a LazyRouteError amb la causa; un error que no és lazy el barrera el rellança', async () => {
  const errors = [];
  const fitxa = lazyRouteRenovable(carregador(['falla']));
  render(<Columna fitxa={fitxa} clau="A" onError={(e) => errors.push(e)} />);
  expect(await screen.findByText('buida A')).toBeTruthy();
  expect(errors).toHaveLength(1);
  expect(esErrorLazy(errors[0])).toBe(true);
  expect(errors[0].cause).toBeInstanceOf(TypeError);
  cleanup();

  /* Un LazyRouteError que ja ve fet no s'embolica dues voltes. */
  const propi = new LazyRouteError(noArriba());
  const deFet = lazyRouteRenovable(() => Promise.reject(propi));
  const capturats = [];
  render(<Columna fitxa={deFet} clau="A" onError={(e) => capturats.push(e)} />);
  expect(await screen.findByText('buida A')).toBeTruthy();
  expect(capturats[0]).toBe(propi);
  cleanup();

  /* El mòdul arriba però el render peta: no és un tros que no arriba, puja. */
  const Trencada = () => { throw new Error('render trencat'); };
  const trencada = lazyRouteRenovable(carregador([], { default: Trencada }));
  render(<BarreraDeFora><Columna fitxa={trencada} clau="A" /></BarreraDeFora>);
  expect(await screen.findByText('de fora: render trencat')).toBeTruthy();
  expect(screen.queryByText('buida A')).toBeNull();
});

test('en StrictMode, A falla i B el torna a demanar una sola volta', async () => {
  const importa = carregador(['falla', 'ok']), fitxa = lazyRouteRenovable(importa);
  const vista = render(<StrictMode><Columna fitxa={fitxa} clau="A" /></StrictMode>);
  expect(await screen.findByText('buida A')).toBeTruthy();
  vista.rerender(<StrictMode><Columna fitxa={fitxa} clau="B" /></StrictMode>);
  expect(await screen.findByText('viva B')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(2);
});

test('reinicia oblida el lazy: la mateixa clau el torna a demanar', async () => {
  const importa = carregador(['falla', 'ok']), fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('buida A')).toBeTruthy();
  vista.unmount();
  fitxa.reinicia();
  render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('viva A')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(2);
});

/* Revisió adversarial · Un lazy oblidat per reinicia que rebutja tard no
   culpa la generació nova: la C no en demana cap altre. */
test('reinicia · un rebuig que arriba després no es compta a la generació nova', async () => {
  let rebutja;
  const primera = new Promise((_, no) => { rebutja = no; });
  const importa = vi.fn().mockReturnValueOnce(primera).mockResolvedValue({ default: Viva });
  const fitxa = lazyRouteRenovable(importa);
  const vista = render(<Columna fitxa={fitxa} clau="A" />);
  expect(await screen.findByText('espera')).toBeTruthy();
  vista.unmount();
  fitxa.reinicia();

  const nova = render(<Columna fitxa={fitxa} clau="B" />);
  expect(await screen.findByText('viva B')).toBeTruthy();
  rebutja(noArriba());
  await new Promise((resol) => { setTimeout(resol, 0); });
  nova.rerender(<Columna fitxa={fitxa} clau="C" />);
  expect(await screen.findByText('viva C')).toBeTruthy();
  expect(importa).toHaveBeenCalledTimes(2);
});
