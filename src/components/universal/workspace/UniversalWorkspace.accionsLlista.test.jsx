/* Bloc 3.8 del Gauntlet (261016) · La prop opcional `accionsLlista`: les
   accions d'una secció a la capçalera de la llista oberta, entre el títol i
   el [|<] de replegar. Sense la prop (Wiki, Disseny, Perfil, Admin, Lector),
   el DOM és el de sempre; el rail plegat no canvia. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, onTestFinished, test, vi } from 'vitest';
import { NotebookPen, SmilePlus } from 'lucide-react';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const MODEL = Object.freeze({
  status: 'ready',
  navigationGroups: [{ id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }] }],
  items: [{ id: 'n1', categoryIds: ['f-mur'], title: 'Bloc de notes', updatedAt: '2026-04-25T09:00:00Z' }]
});
const espai = (props = {}) => render(
  <UniversalWorkspace
    model={MODEL}
    labels={{ categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA' }}
    icons={{ items: NotebookPen }}
    tagFilter={false}
    sortable
    renderDetail={() => null}
    {...props}
  />
);
const capcalera = (container) => container.querySelector('#app-grid-list .app-grid-col-header');
/* Els id de useId canvien d'un muntatge a l'altre: no són part del DOM que es compara. */
const senseIds = (html) => html.replace(/:r[0-9a-z]+:/g, ':id:').replace(/«r[0-9a-z]+»/g, '«id»');

test('sense la prop (o amb una llista buida), el DOM de sempre', () => {
  /* Rellotge fix: res de l'espai depén de l'hora, però així els dos DOM són comparables. */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 16, 16, 30));
  onTestFinished(() => vi.useRealTimers());
  const sense = espai();
  const html = senseIds(sense.container.innerHTML);
  /* Ordre d'usabilitat (30-10-2026) · La icona de l'esquerra és el botó
     germà del [|<]. */
  expect(within(capcalera(sense.container)).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Plegar la columna NOTES', 'Replegar NOTES']);
  sense.unmount();
  const buida = espai({ accionsLlista: [] });
  expect(senseIds(buida.container.innerHTML)).toBe(html);
  buida.unmount();
  const nul = espai({ accionsLlista: null });
  expect(senseIds(nul.container.innerHTML)).toBe(html);
});

test('amb accions: botons d’icona entre el títol i el [|<], amb nom i title, i criden onAcciona', () => {
  const onAcciona = vi.fn();
  const { container } = espai({ accionsLlista: [{ id: 'emojis', etiqueta: 'Emojis', icona: SmilePlus, onAcciona }] });
  const cap = capcalera(container);
  const titol = cap.querySelector('.app-grid-col-header__plec--fix');
  const accions = cap.querySelector('.app-grid-col-header__accions');
  expect([...accions.children].map((b) => b.getAttribute('aria-label'))).toEqual(['Emojis', 'Replegar NOTES']);
  const boto = within(cap).getByRole('button', { name: 'Emojis' });
  expect(boto.className).toBe('app-grid-col-header__accio-icon');
  expect(boto.getAttribute('title')).toBe('Emojis');
  expect(boto.querySelector('svg').getAttribute('width')).toBe('24');
  expect(titol.compareDocumentPosition(boto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(boto);
  expect(onAcciona).toHaveBeenCalledTimes(1);
  // La segona fila (cerca, ordenar i CREAR) no canvia.
  const segona = container.querySelectorAll('#app-grid-list .app-grid-col-header')[1];
  expect(within(segona).queryByRole('button', { name: 'Emojis' })).toBeNull();
});

test('el rail de la llista plegada no porta les accions de la capçalera', () => {
  const { container } = espai({ accionsLlista: [{ id: 'emojis', etiqueta: 'Emojis', icona: SmilePlus, onAcciona: vi.fn() }] });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Replegar NOTES' })); });
  const rail = container.querySelector('#app-grid-list .app-grid-col-header--collapsed');
  expect(rail).not.toBeNull();
  expect(within(rail).queryByRole('button', { name: 'Emojis' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Emojis' })).toBeNull();
});
