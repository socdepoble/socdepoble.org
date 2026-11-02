/* P1-73 (T3, prompt 261102_1532) · Amb `sortable` i dos fixats a «Tot», la
   tria automàtica (la selecció inicial sense element, la reserva d'un element
   que ja no hi és i tornar a «Tot» des d'una carpeta) obri la primera fila
   pintada: la que mana sortBy (per data o per nom), no la primera de
   l'entrada. Abans (T11-03, ARB-T11C-01) guanyava el primer fixat de
   l'entrada. L'entrada posa davant el fixat que l'ordenació per data deixa
   segon. ARB-T3-01 · Només entre els fixats de «Tot»: dins d'una carpeta la
   tria continua sent la primera de l'entrada (workspaceState.test.js, la
   prova [DEFECTE]), pendent de decisió de l'orquestrador. Dades sintètiques;
   jsdom no fa layout: l'amplària de la closca (clientWidth) es posa a mà.
   Patró d'UniversalWorkspace.fixatATot.test.jsx. */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const VELL = Object.freeze({ id: 'vell', title: 'Zona del pou vell', categoryIds: ['f-poble'], updatedAt: '2026-01-01T09:00:00Z', fixatATot: true });
const AVIS = Object.freeze({ id: 'avis', title: 'Avís fixat', categoryIds: ['f-poble'], updatedAt: '2025-12-01T09:00:00Z', fixatATot: true });
const NOVA = Object.freeze({ id: 'nova', title: 'Bancal del pou', categoryIds: ['f-poble'], updatedAt: '2026-10-31T09:00:00Z' });
const MITJANA = Object.freeze({ id: 'mitjana', title: 'Almàssera', categoryIds: ['f-poble'], updatedAt: '2026-10-20T09:00:00Z' });
/* El fixat més vell i alfabèticament primer (AVIS) va davant a l'entrada:
   per data la primera fila és VELL; per nom, AVIS; sense ordenar, AVIS. */
const ENTRADA = Object.freeze([AVIS, MITJANA, VELL, NOVA]);
const model = (items) => ({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [{ id: 'folders', label: null, options: [{ id: 'f-poble', label: 'Poble' }] }],
  items
});

function munta(items, { seleccio, sortable = true, ...props } = {}) {
  return render(<UniversalWorkspace sortable={sortable} model={model(items)} initialSelection={seleccio} {...props} />);
}
const columna = (id) => document.querySelector(`#${id}`);
const files = () => [...columna('app-grid-list').querySelectorAll('.sdp-gestor-fitxa')];
const titol = (fila) => fila.querySelector('.sdp-gestor-fitxa__titol').textContent;
const ultimaTria = (espia) => espia.mock.calls.at(-1)?.[0];
const ordenaPerNom = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Ordenar per data o nom' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nom (A-Z)' }));
};
/* La paritat: la primera fila pintada és l'única amb aria-current i és la
   que la tria automàtica ha emés a la secció. */
function esperaParitat(onSelectionChange, titolEsperat, idEsperat) {
  const [primera, ...resta] = files();
  expect(titol(primera)).toBe(titolEsperat);
  expect(primera.getAttribute('aria-current')).toBe('true');
  expect(resta.filter((fila) => fila.getAttribute('aria-current') === 'true')).toEqual([]);
  expect(ultimaTria(onSelectionChange)).toEqual({ categoryId: '__all__', itemId: idEsperat });
}

describe('P1-73 · amb sortable i dos fixats, la tria automàtica és la primera fila pintada', () => {
  test('la selecció inicial a «Tot» sense element, per data: el fixat més nou, no el primer de l’entrada', () => {
    const onSelectionChange = vi.fn();
    munta(ENTRADA, { seleccio: { categoryId: '__all__' }, onSelectionChange });
    expect(files().map(titol)).toEqual(['Zona del pou vell', 'Avís fixat', 'Bancal del pou', 'Almàssera']);
    esperaParitat(onSelectionChange, 'Zona del pou vell', 'vell');
  });

  test('la reserva d’un element que ja no hi és, per data: el fixat més nou', () => {
    const onSelectionChange = vi.fn();
    munta(ENTRADA, { seleccio: { categoryId: '__all__', itemId: 'esborrada' }, onSelectionChange });
    esperaParitat(onSelectionChange, 'Zona del pou vell', 'vell');
  });

  test('per data, tornar a «Tot» des d’una carpeta tria el fixat més nou (el segon fixat de l’entrada)', () => {
    const onSelectionChange = vi.fn();
    munta(ENTRADA, { seleccio: { categoryId: 'f-poble', itemId: 'nova' }, onSelectionChange });
    fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
    esperaParitat(onSelectionChange, 'Zona del pou vell', 'vell');
  });

  test('per nom (A-Z), tornar a «Tot» des d’una carpeta tria el fixat alfabèticament primer', () => {
    const onSelectionChange = vi.fn();
    munta(ENTRADA, { seleccio: { categoryId: 'f-poble', itemId: 'nova' }, onSelectionChange });
    ordenaPerNom();
    fireEvent.click(screen.getByRole('button', { name: 'Tot' }));
    expect(files().map(titol)).toEqual(['Avís fixat', 'Zona del pou vell', 'Almàssera', 'Bancal del pou']);
    esperaParitat(onSelectionChange, 'Avís fixat', 'avis');
  });

  test('sense sortable, l’ordre de l’entrada: el primer fixat, que també és la primera fila', () => {
    const onSelectionChange = vi.fn();
    munta(ENTRADA, { seleccio: { categoryId: '__all__' }, sortable: false, onSelectionChange });
    expect(files().map(titol)).toEqual(['Avís fixat', 'Zona del pou vell', 'Almàssera', 'Bancal del pou']);
    esperaParitat(onSelectionChange, 'Avís fixat', 'avis');
  });
});
