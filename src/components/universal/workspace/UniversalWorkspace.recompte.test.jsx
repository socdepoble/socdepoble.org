import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

/*
 * El recompte opcional de la navegació (`count` a cada opció, per al Lector,
 * model Feedly: les no llegides de cada carpeta i de cada font).
 *   · Llei del Píxel: sense el camp, o amb 0 o un valor que no siga un enter
 *     > 0, l'arbre i el rail són node a node els d'abans del camp (la
 *     captura de davall es va fer amb el component sense el recompte).
 *   · Amb recompte, la fila porta UNA peça més, al final del nom: la
 *     Insignia neutra de Pedra Seca, amb la xifra (aria-hidden; més de 99,
 *     «99+») i el text sencer per al lector de pantalla (labels.count).
 *   · El rail plegat el suma al nom accessible i al title, sense pintar res.
 * Dades sintètiques.
 */

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria (inert) la navegació.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const OPCIONS = Object.freeze([
  Object.freeze({ id: 'f-tec', label: 'Tecnologia' }),
  Object.freeze({ id: 'f-ia', parentId: 'f-tec', label: 'IA' }),
  Object.freeze({ id: 'f-poble', label: 'Poble' })
]);
const ambRecomptes = (recomptes) => OPCIONS.map((opcio) => (
  Object.hasOwn(recomptes, opcio.id) ? { ...opcio, count: recomptes[opcio.id] } : opcio
));
const model = (opcions = OPCIONS) => ({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [{ id: 'fonts', label: null, options: opcions }],
  items: [{ id: 'a', title: 'Article', categoryIds: ['f-ia'] }]
});
const SELECCIO = Object.freeze({ categoryId: 'f-ia', itemId: 'a' });

/* Les icones de Lucide no són del recompte: es reduïxen a la seua classe. */
const net = (html) => html.replace(/<svg\b[^>]*\bclass="([^"]*)"[^>]*>[\s\S]*?<\/svg>/g, '<svg class="$1"/>');
const FOLDER = '<svg class="lucide lucide-folder"/>';
const fila = (atributs, nom) => `<button type="button"${atributs} class="sdp-workspace-nav-item"><span class="sdp-workspace-nav-item__icon" aria-hidden="true">${FOLDER}</span><span class="sdp-workspace-nav-item__label">${nom}</span></button>`;
const BUIT = '<div class="sdp-workspace-folder-toggle-spacer" aria-hidden="true"></div>';
/* La captura del component sense recompte (16-10-2026, abans del camp). */
const ARBRE_DABANS = [
  '<nav class="sdp-workspace-column__body" aria-label="CATEGORIES"><div class="sdp-workspace-groups">',
  '<div class="sdp-workspace-group" data-group="fonts" data-obert="true"><ul class="sdp-workspace-categories" aria-label="CATEGORIES">',
  `<li><div class="sdp-workspace-folder-row">${fila(' aria-expanded="true"', 'Tecnologia')}`,
  '<button type="button" class="sdp-workspace-nav-item sdp-workspace-folder-toggle" aria-label="Plegar Tecnologia" aria-expanded="true"><svg class="lucide lucide-chevron-down"/></button></div>',
  `<ul class="sdp-workspace-categories" aria-label="Tecnologia"><li><div class="sdp-workspace-folder-row">${fila(' aria-current="page"', 'IA')}${BUIT}</div></li></ul></li>`,
  `<li><div class="sdp-workspace-folder-row">${fila('', 'Poble')}${BUIT}</div></li>`,
  '</ul></div></div></nav>'
].join('');
const RAIL_DABANS = [
  '<nav class="sdp-workspace-rail" aria-label="CATEGORIES"><ul class="sdp-workspace-rail__grup" aria-label="CATEGORIES">',
  `<li><button type="button" class="sdp-workspace-rail__boto" aria-label="Tecnologia" title="Tecnologia" aria-current="true">${FOLDER}</button></li>`,
  `<li><button type="button" class="sdp-workspace-rail__boto" aria-label="Poble" title="Poble">${FOLDER}</button></li>`,
  '</ul></nav>'
].join('');

const arbre = (opcions, props = {}) => {
  const { container } = render(<UniversalWorkspace model={model(opcions)} initialSelection={SELECCIO} {...props} />);
  return container.querySelector('nav.sdp-workspace-column__body');
};
const rail = (opcions, props = {}) => {
  const { container } = render(<UniversalWorkspace model={model(opcions)} initialSelection={SELECCIO} columnesInicials={{ left: true }} {...props} />);
  return container.querySelector('nav.sdp-workspace-rail');
};

describe('Llei del Píxel: sense recompte, cap node canvia', () => {
  test('sense el camp, l’arbre i el rail són els de la captura d’abans del camp', () => {
    expect(net(arbre(OPCIONS).outerHTML)).toBe(ARBRE_DABANS);
    cleanup();
    expect(net(rail(OPCIONS).outerHTML)).toBe(RAIL_DABANS);
  });

  test.each([
    ['0', 0],
    ['undefined', undefined],
    ['null', null],
    ['un negatiu', -3],
    ['un decimal', 2.5],
    ['un text', '6'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY]
  ])('count = %s: cap número, el mateix DOM', (_que, valor) => {
    const recomptes = { 'f-tec': valor, 'f-ia': valor, 'f-poble': valor };
    expect(net(arbre(ambRecomptes(recomptes)).outerHTML)).toBe(ARBRE_DABANS);
    cleanup();
    expect(net(rail(ambRecomptes(recomptes)).outerHTML)).toBe(RAIL_DABANS);
  });
});

describe('amb recompte', () => {
  test('la fila porta una sola peça més, al final del nom: la Insignia neutra amb la xifra i el text', () => {
    const nav = arbre(ambRecomptes({ 'f-tec': 6 }));
    const boto = within(nav).getByRole('button', { name: 'Tecnologia 6 sense llegir' });
    const insignia = boto.lastElementChild;
    expect(insignia.className).toBe('sdp-insignia sdp-insignia--neutre');
    expect(insignia.previousElementSibling.className).toBe('sdp-workspace-nav-item__label');
    expect(insignia.querySelector('[aria-hidden="true"]').textContent).toBe('6');
    expect(insignia.querySelector('.sdp-sr-only').textContent).toBe('6 sense llegir');
    expect(nav.querySelectorAll('.sdp-insignia')).toHaveLength(1);
    /* L'espai que separa el nom del text al nom accessible: un text només
       d'espais entre fills d'un flex, que no es pinta. */
    const espai = insignia.previousSibling;
    expect([espai.nodeType, espai.textContent]).toEqual([Node.TEXT_NODE, ' ']);
    /* Llevats l'espai i la insígnia, la resta és node a node la d'abans. */
    espai.remove();
    insignia.remove();
    expect(net(nav.outerHTML)).toBe(ARBRE_DABANS);
  });

  test('la subcarpeta també el porta (la branca niada rep el text), i més de 99 es veu «99+» amb el número sencer al nom', () => {
    const nav = arbre(ambRecomptes({ 'f-ia': 120, 'f-poble': 1 }));
    const ia = within(nav).getByRole('button', { name: 'IA 120 sense llegir' });
    expect(ia.querySelector('.sdp-insignia [aria-hidden="true"]').textContent).toBe('99+');
    expect(ia.getAttribute('aria-current')).toBe('page');
    expect(within(nav).getByRole('button', { name: 'Poble 1 sense llegir' }).querySelector('.sdp-insignia').textContent).toBe('11 sense llegir');
    /* Tecnologia, sense recompte, és com sempre. */
    expect(within(nav).getByRole('button', { name: 'Tecnologia' }).querySelector('.sdp-insignia')).toBeNull();
  });

  test('labels.count canvia el text per al lector de pantalla, no la xifra', () => {
    const nav = arbre(ambRecomptes({ 'f-poble': 3 }), { labels: { count: '{n} noves' } });
    const poble = within(nav).getByRole('button', { name: 'Poble 3 noves' });
    expect(poble.querySelector('.sdp-insignia [aria-hidden="true"]').textContent).toBe('3');
  });

  test('triar la fila amb recompte fa el mateix que sense', () => {
    const onSelectionChange = vi.fn();
    const nav = arbre(ambRecomptes({ 'f-poble': 4 }), { onSelectionChange });
    fireEvent.click(within(nav).getByRole('button', { name: 'Poble 4 sense llegir' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: 'f-poble', itemId: null }, { reason: 'user' });
    expect(within(nav).getByRole('button', { name: 'Poble 4 sense llegir' }).getAttribute('aria-current')).toBe('page');
  });

  test('el rail plegat el suma al nom accessible i al title, sense pintar cap insígnia', () => {
    const nav = rail(ambRecomptes({ 'f-tec': 6, 'f-ia': 2 }));
    const tecnologia = within(nav).getByRole('button', { name: 'Tecnologia 6 sense llegir' });
    expect(tecnologia.getAttribute('title')).toBe('Tecnologia 6 sense llegir');
    expect(tecnologia.getAttribute('aria-current')).toBe('true');
    expect(nav.querySelector('.sdp-insignia')).toBeNull();
    /* Poble no en porta: el seu botó és el de sempre. */
    const poble = within(nav).getByRole('button', { name: 'Poble' });
    expect(poble.getAttribute('title')).toBe('Poble');
  });

  test('també amb model.categories (sense grups), com Wiki i Disseny', () => {
    render(
      <UniversalWorkspace
        model={{ status: 'ready', itemsComplete: true, categories: [{ id: 'c1', label: 'Fonaments', count: 2 }, { id: 'c2', label: 'Estructura' }], items: [] }}
      />
    );
    const nav = screen.getByRole('navigation', { name: 'CATEGORIES' });
    expect(within(nav).getByRole('button', { name: 'Fonaments 2 sense llegir' }).lastElementChild.className).toBe('sdp-insignia sdp-insignia--neutre');
    expect(within(nav).getByRole('button', { name: 'Estructura' }).querySelector('.sdp-insignia')).toBeNull();
  });
});
