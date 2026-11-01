/* P1-71 (marató nocturna 261101, T5.1) · La prop opcional `peuNavegacio`:
   un node de la secció a la columna de navegació desplegada, davall de les
   vistes (darrere de l'arbre, dins de la mateixa zona de desplaçament).
   /multimedia hi posa la Barra de volums. Sense la prop, el DOM és el de
   sempre; el rail plegat no el porta; les fletxes de l'arbre no hi entren. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, expect, onTestFinished, test, vi } from 'vitest';
import { NotebookPen } from 'lucide-react';
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
  navigationGroups: [{ id: 'folders', label: null, options: [{ id: 'f-mur', label: 'Mur' }, { id: 'f-xat', label: 'Xat' }] }],
  items: [{ id: 'n1', categoryIds: ['f-mur'], title: 'Bloc de notes', updatedAt: '2026-04-25T09:00:00Z' }]
});
const PEU = <section aria-label="Volums"><button type="button">Vincular</button></section>;
const espai = (props = {}) => render(
  <UniversalWorkspace
    model={MODEL}
    labels={{ categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA' }}
    icons={{ items: NotebookPen }}
    tagFilter={false}
    renderDetail={() => null}
    {...props}
  />
);
const senseIds = (html) => html.replace(/:r[0-9a-z]+:/g, ':id:').replace(/«r[0-9a-z]+»/g, '«id»');

test('sense la prop (o amb null), el DOM de sempre i cap peu', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 1, 4, 30));
  onTestFinished(() => vi.useRealTimers());
  const sense = espai();
  const html = senseIds(sense.container.innerHTML);
  expect(sense.container.querySelector('.sdp-workspace-column__peu')).toBeNull();
  sense.unmount();
  const nul = espai({ peuNavegacio: null });
  expect(senseIds(nul.container.innerHTML)).toBe(html);
});

/* Gauntlet 2 261101 (G2-09) · El peu porta accions (Vincular, Desconnectar…)
   i el seu h2: va FORA del landmark de navegació. La zona de desplaçament de
   la columna és un div amb el <nav> de l'arbre i, darrere, el peu. */
test('amb la prop: a la navegació desplegada, darrere de l’arbre, dins de la zona de desplaçament i fora del <nav>', () => {
  const { container } = espai({ peuNavegacio: PEU });
  const navegacio = container.querySelector('#app-grid-sidebar');
  const peu = navegacio.querySelector('.sdp-workspace-column__peu');
  expect(peu).not.toBeNull();
  expect(peu.closest('nav')).toBeNull();
  const cos = peu.parentElement;
  expect(cos.tagName).toBe('DIV');
  expect([...cos.classList]).toEqual(['sdp-workspace-column__body']);
  expect(cos.parentElement.classList.contains('sdp-workspace-column')).toBe(true);
  /* Davant, el <nav> de l'arbre, amb el nom de sempre i l'arbre sencer dins. */
  const arbre = peu.previousElementSibling;
  expect(arbre.tagName).toBe('NAV');
  expect(arbre.getAttribute('aria-label')).toBe('CARPETES');
  expect(arbre.className).toBe('');
  expect(arbre.querySelector(':scope > .sdp-workspace-groups > .sdp-workspace-group')).not.toBeNull();
  expect(peu.nextElementSibling).toBeNull();
  expect(peu.querySelector('button').textContent).toBe('Vincular');
  /* Un sol landmark de navegació a la columna, i el peu ni a la llista ni al detall. */
  expect(navegacio.querySelectorAll('nav')).toHaveLength(1);
  expect(container.querySelectorAll('.sdp-workspace-column__peu')).toHaveLength(1);
});

test('les fletxes de l’arbre no entren al peu ni ixen d’ell', () => {
  const { container } = espai({ peuNavegacio: PEU });
  const boto = screen.getByRole('button', { name: 'Vincular' });
  boto.focus();
  for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']) {
    fireEvent.keyDown(boto, { key });
    expect(container.ownerDocument.activeElement, key).toBe(boto);
  }
});

test('el rail de la navegació plegada no porta el peu; en tornar a desplegar, hi torna', () => {
  const { container } = espai({ peuNavegacio: PEU });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Replegar CARPETES' })); });
  expect(container.querySelector('#app-grid-sidebar .sdp-workspace-rail')).not.toBeNull();
  expect(container.querySelector('.sdp-workspace-column__peu')).toBeNull();
  act(() => { fireEvent.click(screen.getByRole('button', { name: /Desplegar CARPETES|Expandir CARPETES|CARPETES/ })); });
  expect(container.querySelector('#app-grid-sidebar .sdp-workspace-column__peu')).not.toBeNull();
});
