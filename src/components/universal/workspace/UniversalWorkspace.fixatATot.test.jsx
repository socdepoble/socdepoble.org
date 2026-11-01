/* D-4 (decisió del Mestre, pla 261101_1246) · El camp opcional `fixatATot` de
   cada element del model (la Card «Bloc de notes» del Bloc):
     · amb `true`, a «Tot» l'element és la primera fila amb qualsevol
       ordenació (data o nom), també dins d'una cerca que el troba;
     · la llista, el rail de la llista plegada i les fletxes del teclat
       seguixen el mateix ordre;
     · en una carpeta, l'ordre de sempre; una cadena 'true' no fixa res;
     · sense el camp, la llista és la de sempre (Llei del Píxel).
   L'element fixat és el més vell i el seu títol va l'últim per nom: sense la
   fixació, per data i per nom seria l'última fila. Dades sintètiques. jsdom no
   fa layout: l'amplària de la closca (clientWidth) es posa a mà. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

const CARD = Object.freeze({ id: 'card', title: 'Zona del pou vell', categoryIds: ['f-poble'], updatedAt: '2026-01-01T09:00:00Z', fixatATot: true });
const NOVA = Object.freeze({ id: 'nova', title: 'Bancal del pou', categoryIds: ['f-poble'], updatedAt: '2026-10-31T09:00:00Z' });
const MITJANA = Object.freeze({ id: 'mitjana', title: 'Almàssera', categoryIds: ['f-poble'], updatedAt: '2026-10-20T09:00:00Z' });
const model = (items) => ({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [{ id: 'folders', label: null, options: [{ id: 'f-poble', label: 'Poble' }] }],
  items
});
const TOT = Object.freeze({ categoryId: '__all__', itemId: 'nova' });

function munta(items, { seleccio = TOT, ...props } = {}) {
  return render(<UniversalWorkspace sortable model={model(items)} initialSelection={seleccio} {...props} />);
}
const columna = (id) => document.querySelector(`#${id}`);
const titols = () => [...columna('app-grid-list').querySelectorAll('.sdp-gestor-fitxa__titol')].map((el) => el.textContent);
const ordenaPerNom = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Ordenar per data o nom' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nom (A-Z)' }));
};

describe('a «Tot»', () => {
  test('per data, el fixat és la primera fila i la resta va per data', () => {
    munta([MITJANA, CARD, NOVA]);
    expect(titols()).toEqual(['Zona del pou vell', 'Bancal del pou', 'Almàssera']);
  });

  test('per nom (A-Z), el fixat també és la primera fila i la resta va per nom', () => {
    munta([MITJANA, CARD, NOVA]);
    ordenaPerNom();
    expect(titols()).toEqual(['Zona del pou vell', 'Almàssera', 'Bancal del pou']);
  });

  test('amb una cerca que el troba, el fixat continua el primer; si no el troba, no hi és', () => {
    munta([MITJANA, CARD, NOVA]);
    fireEvent.click(within(columna('app-grid-list')).getByRole('button', { name: 'Cercar elements' }));
    fireEvent.change(columna('app-grid-list').querySelector('input[type="search"]'), { target: { value: 'pou' } });
    expect(titols()).toEqual(['Zona del pou vell', 'Bancal del pou']);
    fireEvent.change(columna('app-grid-list').querySelector('input[type="search"]'), { target: { value: 'almàssera' } });
    expect(titols()).toEqual(['Almàssera']);
  });

  test('entre dos fixats mana l’ordenació, i tots dos van davant', () => {
    const altra = { ...MITJANA, id: 'altra', title: 'Avís fixat', updatedAt: '2025-12-01T09:00:00Z', fixatATot: true };
    munta([MITJANA, CARD, NOVA, altra]);
    expect(titols()).toEqual(['Zona del pou vell', 'Avís fixat', 'Bancal del pou', 'Almàssera']);
    ordenaPerNom();
    expect(titols()).toEqual(['Avís fixat', 'Zona del pou vell', 'Almàssera', 'Bancal del pou']);
  });

  test('sense `sortable`, el fixat també va davant de l’ordre del model', () => {
    render(<UniversalWorkspace model={model([MITJANA, NOVA, CARD])} initialSelection={TOT} />);
    expect(titols()).toEqual(['Zona del pou vell', 'Almàssera', 'Bancal del pou']);
  });
});

describe('fora de «Tot» i sense el camp, l’ordre de sempre', () => {
  test('en una carpeta, el fixat va on li toca per data', () => {
    munta([MITJANA, CARD, NOVA], { seleccio: { categoryId: 'f-poble', itemId: 'nova' } });
    expect(titols()).toEqual(['Bancal del pou', 'Almàssera', 'Zona del pou vell']);
  });

  test('fixatATot: \'true\' (una cadena) no fixa res', () => {
    munta([MITJANA, { ...CARD, fixatATot: 'true' }, NOVA]);
    expect(titols()).toEqual(['Bancal del pou', 'Almàssera', 'Zona del pou vell']);
  });

  test('sense el camp, per data i per nom, la llista de sempre', () => {
    const senseCamp = Object.fromEntries(Object.entries(CARD).filter(([clau]) => clau !== 'fixatATot'));
    expect(Object.hasOwn(senseCamp, 'fixatATot')).toBe(false);
    munta([MITJANA, senseCamp, NOVA]);
    expect(titols()).toEqual(['Bancal del pou', 'Almàssera', 'Zona del pou vell']);
    ordenaPerNom();
    expect(titols()).toEqual(['Almàssera', 'Bancal del pou', 'Zona del pou vell']);
  });
});

describe('el rail i el teclat seguixen el mateix ordre', () => {
  test('el rail de la llista plegada pinta primer el fixat', () => {
    munta([MITJANA, CARD, NOVA], { columnesInicials: { middle: true } });
    const rail = document.querySelector('nav.sdp-workspace-rail--documents');
    const noms = [...rail.querySelectorAll('button[aria-label]')].map((boto) => boto.getAttribute('aria-label'));
    expect(noms).toEqual(['Zona del pou vell', 'Bancal del pou', 'Almàssera']);
  });

  test('Inici tria el fixat i ↓ hi baixa a la fila següent de la llista ordenada', () => {
    const onSelectionChange = vi.fn();
    munta([MITJANA, CARD, NOVA], { onSelectionChange });
    const fitxa = (titol) => within(columna('app-grid-list')).getByRole('button', { name: titol });
    act(() => fitxa('Bancal del pou').focus());
    fireEvent.keyDown(document.activeElement, { key: 'Home' });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '__all__', itemId: 'card' }, expect.anything());
    expect(document.activeElement).toBe(fitxa('Zona del pou vell'));
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' });
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '__all__', itemId: 'nova' }, expect.anything());
  });
});
