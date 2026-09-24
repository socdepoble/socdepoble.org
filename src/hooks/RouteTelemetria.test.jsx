import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { MemoryRouter, useRouter } from '../app/contexts/RouterContext';
import { RouteTelemetria } from './RouteTelemetria';

const estat = vi.hoisted(() => ({ config: {}, registraVisita: vi.fn(), declaraEncastada: vi.fn() }));
vi.mock('../app/contexts/UIContext', () => ({ useUIState: () => ({ externalConfig: estat.config }) }));
vi.mock('../data/telemetria.js', () => ({ registraVisita: estat.registraVisita, declaraEncastada: estat.declaraEncastada }));

let navigate;
function Pagina() {
  navigate = useRouter().navigate;
  return <RouteTelemetria />;
}
const arbre = () => <MemoryRouter><Pagina /></MemoryRouter>;
const rutes = () => estat.registraVisita.mock.calls.map(([ruta]) => ruta);

beforeEach(() => {
  estat.config = {};
  estat.registraVisita.mockReset();
  estat.declaraEncastada.mockReset();
  delete window.__SDP_EMBEDDED__;
});
afterEach(() => { cleanup(); delete window.__SDP_EMBEDDED__; });

test('una visita per canvi de ruta, sense query', () => {
  render(arbre());
  act(() => navigate('/notes?item_id=Nota%20secreta'));
  act(() => navigate('/notes?item_id=Una%20altra'));
  act(() => navigate('/mur'));
  expect(rutes()).toEqual(['/', '/notes', '/mur']);
  expect(JSON.stringify(rutes())).not.toContain('secreta');
});

test('passa la ruta crua: el contracte decidix si és repetida i la tapa', () => {
  render(arbre());
  act(() => navigate('/notes/n1'));
  act(() => navigate('/notes/n2'));
  expect(rutes()).toEqual(['/', '/notes/n1', '/notes/n2']);
  expect(estat.declaraEncastada).toHaveBeenLastCalledWith(false);
});

test('encastada en una pàgina d’un altre no compta res i ho declara al contracte', () => {
  estat.config = { manageDocumentHead: false };
  render(arbre());
  act(() => navigate('/mur'));
  expect(estat.declaraEncastada).toHaveBeenLastCalledWith(true);
  cleanup();
  estat.config = {};
  window.__SDP_EMBEDDED__ = true;
  render(arbre());
  act(() => navigate('/notes'));
  expect(estat.registraVisita).not.toHaveBeenCalled();
  expect(estat.declaraEncastada).toHaveBeenLastCalledWith(true);
});

test('si la telemetria peta, la ruta continua', () => {
  estat.registraVisita.mockImplementation(() => { throw new Error('xarxa'); });
  render(arbre());
  expect(() => act(() => navigate('/mur'))).not.toThrow();
  expect(rutes()).toEqual(['/', '/mur']);
});
