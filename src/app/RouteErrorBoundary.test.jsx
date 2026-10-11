import { Suspense } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { RouteErrorBoundary } from './RouteErrorBoundary.jsx';
import { lazyRoute } from '../apps/plataforma/lazyRoute.js';
import { SlotErrorBoundary } from '../components/universal/workspace/SlotErrorBoundary.jsx';
import { ErrorBoundary } from '../components/ErrorBoundary.jsx';
import { _reiniciaAutocuracio, incidents } from '../utils/autocuracio.js';

beforeEach(() => { vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.unstubAllGlobals(); cleanup(); vi.restoreAllMocks(); });
const domWindow = window;
const config = { manageDocumentHead: true };
const unavailable = () => { throw new TypeError('Failed to fetch dynamically imported module'); };
const view = (Child, props = {}) => <RouteErrorBoundary resetKey="/disseny" externalConfig={config} mostraDetall={false} {...props}>
  <Suspense fallback={<p>Carregant…</p>}><SlotErrorBoundary><Child /></SlotErrorBoundary></Suspense>
</RouteErrorBoundary>;
const reloadWindow = () => {
  const reload = vi.fn();
  const host = { location: { reload }, self: domWindow, top: domWindow };
  // Keep the actual DOM constructors and event target used by React.
  vi.stubGlobal('window', new Proxy(domWindow, {
    get(target, key) {
      if (Object.hasOwn(host, key)) return host[key];
      const value = Reflect.get(target, key, target);
      return ['addEventListener', 'removeEventListener', 'dispatchEvent'].includes(key)
        ? value.bind(target) : value;
    },
  }));
  return { host, reload };
};

test('un import fallat profund arriba a l’únic propietari i no recarrega ni reintenta automàticament', async () => {
  const importa = vi.fn(unavailable), Child = lazyRoute(importa);
  render(view(Child));
  await screen.findByRole('alert');
  expect(importa).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Reintenta')).toBeNull();
  expect(screen.queryByText('Intentar de nou')).toBeNull();
  expect(screen.queryByText('Failed to fetch dynamically imported module')).toBeNull();
  expect(screen.getByText(/descarta les dades que només viuen a la memòria/)).toBeTruthy();
  const { reload } = reloadWindow();
  expect(reload).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Recarrega l’aplicació' }));
  expect(reload).toHaveBeenCalledTimes(1);
});

test.each([false, undefined])('un document alié amb manageDocumentHead=%s no oferix recàrrega operativa', async (manageDocumentHead) => {
  render(view(lazyRoute(unavailable), { externalConfig: { manageDocumentHead } }));
  await screen.findByRole('alert');
  expect(screen.queryByRole('button', { name: 'Recarrega l’aplicació' })).toBeNull();
  expect(screen.getByText(/pàgina que l’allotja/)).toBeTruthy();
});

test.each(['embedded', 'iframe', 'offline'])('revalida %s en el clic encara que la vista s’haguera pintat habilitada', async (mode) => {
  render(view(lazyRoute(unavailable)));
  await screen.findByRole('alert');
  const boto = screen.getByRole('button', { name: 'Recarrega l’aplicació' });
  expect(boto.disabled).toBe(false);
  const { host, reload } = reloadWindow();
  if (mode === 'embedded') host.__SDP_EMBEDDED__ = true;
  if (mode === 'iframe') host.top = {};
  if (mode === 'offline') vi.stubGlobal('navigator', { onLine: false });
  fireEvent.click(boto);
  expect(reload).not.toHaveBeenCalled();
});

test('fora de línia ho diu i tornar a estar en línia habilita el clic explícit', async () => {
  const Child = lazyRoute(unavailable);
  const vista = render(view(Child, { enLinia: false }));
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Recarrega l’aplicació' }).disabled).toBe(true);
  expect(screen.getByText(/Recupera la connexió/)).toBeTruthy();
  vista.rerender(view(Child, { enLinia: true }));
  expect(screen.getByRole('button', { name: 'Recarrega l’aplicació' }).disabled).toBe(false);
});

test('el reintent d’un render transitori funciona; el mateix render persistent queda acotat', () => {
  let falla = true;
  function Vista() { if (falla) throw Error('render'); return <p>Vista recuperada</p>; }
  // A render failure belongs to the route here (slots retain their own domain recovery).
  const tree = (key = '/a') => <RouteErrorBoundary resetKey={key}><Vista /></RouteErrorBoundary>;
  const vista = render(tree());
  fireEvent.click(screen.getByRole('button', { name: 'Intentar de nou' }));
  expect(screen.getByRole('button', { name: 'Intentar de nou' }).disabled).toBe(true);
  falla = false; vista.rerender(tree('/b'));
  expect(screen.getByText('Vista recuperada')).toBeTruthy();
  falla = true; vista.rerender(tree('/c')); falla = false;
  fireEvent.click(screen.getByRole('button', { name: 'Intentar de nou' }));
  expect(screen.getByText('Vista recuperada')).toBeTruthy();
});

test('canviar de ruta conserva el rebuig lazy de React: cap falso reintent del mateix import', async () => {
  const importa = vi.fn(() => Promise.reject(Error('chunk absent'))), Child = lazyRoute(importa);
  const vista = render(view(Child));
  await screen.findByRole('alert');
  vista.rerender(view(Child, { resetKey: '/altre' }));
  await screen.findByRole('alert');
  expect(importa).toHaveBeenCalledTimes(1);
});

test('un segon render fallat conserva el focus al títol del problema', () => {
  const mateixError = new Error('render persistent');
  function Trencada() { throw mateixError; }
  render(<RouteErrorBoundary resetKey="/a" mostraDetall={false}><Trencada /></RouteErrorBoundary>);
  const boto = screen.getByRole('button', { name: 'Intentar de nou' });
  boto.focus();
  fireEvent.click(boto);
  expect(screen.getByRole('button', { name: 'Intentar de nou' }).disabled).toBe(true);
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Hi ha hagut un problema' }));
});

test('passar fora de línia amb focus a recarregar enfoca el problema i conserva el control desactivat', async () => {
  const Child = lazyRoute(unavailable);
  const vista = render(view(Child, { enLinia: true }));
  await screen.findByRole('alert');
  screen.getByRole('button', { name: 'Recarrega l’aplicació' }).focus();
  vista.rerender(view(Child, { enLinia: false }));
  expect(screen.getByRole('button', { name: 'Recarrega l’aplicació' }).disabled).toBe(true);
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }));
});

test('perdre autoritat amb focus a recarregar no deixa el focus al body', async () => {
  const Child = lazyRoute(unavailable);
  const vista = render(view(Child));
  await screen.findByRole('alert');
  screen.getByRole('button', { name: 'Recarrega l’aplicació' }).focus();
  vista.rerender(view(Child, { externalConfig: { manageDocumentHead: false } }));
  expect(screen.queryByRole('button', { name: 'Recarrega l’aplicació' })).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2 }));
});

/* Onada 12 (261011; ordres 261011_0130, punt 7) · Els tres límits d'error
   deixen rastre al registre local (utils/autocuracio.js): el tipus i una
   etiqueta del codi, mai el missatge de l'error. */
const rastre = () => incidents().map(({ tipus, on, accio }) => [tipus, on, accio]);
const SECRET = 'text privat de la persona';
function Trencada() { throw new Error(SECRET); }

test('Onada 12 · un import fallat queda anotat una vegada, com a «tros» de la secció, i no com a panell', async () => {
  _reiniciaAutocuracio();
  render(view(lazyRoute(unavailable), { resetKey: '/disseny/fitxa-123' }));
  await screen.findByRole('alert');
  expect(rastre()).toEqual([['tros', 'disseny', 'fallback']]);
});

test('Onada 12 · una vista que peta queda anotada com a «ruta», amb la secció i sense el missatge', () => {
  _reiniciaAutocuracio();
  render(<RouteErrorBoundary resetKey="/notes/abc-123" mostraDetall={false}><Trencada /></RouteErrorBoundary>);
  expect(rastre()).toEqual([['ruta', 'notes', 'fallback']]);
  expect(JSON.stringify(incidents())).not.toContain(SECRET);
  expect(JSON.stringify(incidents())).not.toContain('abc-123');
});

test('Onada 12 · un panell que peta queda anotat amb el seu domini i la ruta no cau', () => {
  _reiniciaAutocuracio();
  render(<RouteErrorBoundary resetKey="/mur" mostraDetall={false}>
    <SlotErrorBoundary domini="detall"><Trencada /></SlotErrorBoundary>
  </RouteErrorBoundary>);
  expect(screen.getByText(/El detall s'ha esfondrat/)).toBeTruthy();
  expect(screen.queryByText('Hi ha hagut un problema')).toBeNull();
  expect(rastre()).toEqual([['panell', 'detall', 'fallback']]);
  expect(JSON.stringify(incidents())).not.toContain(SECRET);
});

test('Onada 12 · el límit de l’arrel anota la caiguda sencera', () => {
  _reiniciaAutocuracio();
  render(<ErrorBoundary><Trencada /></ErrorBoundary>);
  expect(screen.getByText("No s'ha pogut carregar Sóc de Poble")).toBeTruthy();
  expect(rastre()).toEqual([['panell', 'arrel', 'fallback']]);
});

test('un canvi de connexió no pren el focus d’un control fora del panell', async () => {
  const Child = lazyRoute(unavailable);
  const tree = (enLinia) => <><button type="button">Menú exterior</button>{view(Child, { enLinia })}</>;
  const vista = render(tree(true));
  await screen.findByRole('alert');
  const exterior = screen.getByRole('button', { name: 'Menú exterior' });
  exterior.focus();
  vista.rerender(tree(false));
  expect(document.activeElement).toBe(exterior);
});
