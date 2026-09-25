import React, { useState } from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { UniversalWorkspace } from './UniversalWorkspace.jsx';

/*
 * Arbre de carpetes de la columna de navegació (punt 10 del Mestre):
 * clicar qualsevol part del botó d'una carpeta amb fills la desplega.
 *   · plegada i no activa   → es desplega i se selecciona;
 *   · desplegada i no activa → només se selecciona;
 *   · activa                 → el clic plega o desplega, sense tornar-la a triar.
 * Les carpetes sense fills i el chevron es comporten com abans.
 */

vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i amagaria (inert) la columna esquerra.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
afterEach(() => cleanup());

const arbre = Object.freeze({
  status: 'ready',
  itemsComplete: true,
  navigationGroups: [{ id: 'folders', options: [
    { id: 1, label: 'Wiki' },
    { id: 2, parentId: 1, label: 'Saber' },
    { id: 3, parentId: 2, label: 'Protocols' },
    { id: 4, label: 'Mur' }
  ] }],
  items: [
    { id: 'portada', title: 'Portada de la Wiki', categoryIds: [1] },
    { id: 'saber', title: 'Com sabem', categoryIds: [2] },
    { id: 'doc', title: 'Protocol viu', categoryIds: [3] },
    { id: 'cronica', title: 'Crònica del Mur', categoryIds: [4] }
  ]
});

const nom = (label) => screen.getByRole('button', { name: label });
const visible = (label) => screen.queryByRole('button', { name: label }) !== null;

function renderArbre(props = {}) {
  const onSelectionChange = vi.fn();
  const utils = render(
    <UniversalWorkspace
      model={arbre}
      initialSelection={{ categoryId: '__all__', itemId: null }}
      onSelectionChange={onSelectionChange}
      {...props}
    />
  );
  return { ...utils, onSelectionChange };
}

test('clicar el nom d’una carpeta plegada amb fills la desplega i la selecciona', () => {
  const { onSelectionChange } = renderArbre();
  expect(visible('Saber')).toBe(false);
  expect(nom('Wiki').getAttribute('aria-expanded')).toBe('false');

  fireEvent.click(nom('Wiki'));

  expect(visible('Saber')).toBe(true);
  expect(nom('Wiki').getAttribute('aria-expanded')).toBe('true');
  expect(nom('Wiki').getAttribute('aria-current')).toBe('page');
  expect(onSelectionChange).toHaveBeenCalledWith({ categoryId: '1', itemId: 'portada' }, { reason: 'user' });
  expect(screen.getByRole('button', { name: 'Portada de la Wiki' })).toBeTruthy();
  // El chevron diu el mateix que el nom: una sola veritat d'expansió.
  expect(screen.getByRole('button', { name: 'Plegar Wiki' }).getAttribute('aria-expanded')).toBe('true');
});

test('un segon clic sobre la carpeta activa la plega, i un tercer la torna a desplegar, sense tornar-la a triar', () => {
  const { onSelectionChange } = renderArbre();
  fireEvent.click(nom('Wiki'));
  onSelectionChange.mockClear();

  fireEvent.click(nom('Wiki'));
  expect(visible('Saber')).toBe(false);
  expect(nom('Wiki').getAttribute('aria-expanded')).toBe('false');
  expect(nom('Wiki').getAttribute('aria-current')).toBe('page');

  fireEvent.click(nom('Wiki'));
  expect(visible('Saber')).toBe(true);
  expect(nom('Wiki').getAttribute('aria-expanded')).toBe('true');

  // Plegar o desplegar l'activa no canvia la selecció ni el document obert.
  expect(onSelectionChange).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Portada de la Wiki' }).getAttribute('aria-current')).toBe('true');
});

test('desplegada però no activa: el clic al nom només la selecciona', () => {
  const { onSelectionChange } = renderArbre();
  fireEvent.click(screen.getByRole('button', { name: 'Desplegar Wiki' }));
  expect(onSelectionChange).not.toHaveBeenCalled();
  expect(visible('Saber')).toBe(true);

  fireEvent.click(nom('Wiki'));
  expect(visible('Saber')).toBe(true);
  expect(nom('Wiki').getAttribute('aria-current')).toBe('page');
  expect(onSelectionChange).toHaveBeenCalledTimes(1);
});

test('una carpeta sense fills no canvia: selecciona sempre, no plega res i no declara aria-expanded', () => {
  const { container, onSelectionChange } = renderArbre();
  const mur = nom('Mur');
  expect(mur.hasAttribute('aria-expanded')).toBe(false);
  expect(mur.closest('.sdp-workspace-folder-row').querySelector('.sdp-workspace-folder-toggle-spacer')).toBeTruthy();

  fireEvent.click(mur);
  fireEvent.click(mur);
  expect(mur.getAttribute('aria-current')).toBe('page');
  expect(mur.hasAttribute('aria-expanded')).toBe(false);
  expect(onSelectionChange).toHaveBeenCalledTimes(2);
  expect(onSelectionChange).toHaveBeenLastCalledWith({ categoryId: '4', itemId: 'cronica' }, { reason: 'user' });
  // Els germans amb fills continuen plegats.
  expect(visible('Saber')).toBe(false);
  expect(container.querySelectorAll('.sdp-workspace-categories .sdp-workspace-categories')).toHaveLength(0);
});

test('Llei del Píxel: una navegació plana (Notes, Disseny) no guanya cap aria-expanded a les files', () => {
  const { container } = render(
    <UniversalWorkspace
      model={{ status: 'ready', categories: [{ id: 'fonaments', label: 'Fonaments' }, { id: 'estructura', label: 'Estructura' }], items: [] }}
    />
  );
  expect(container.querySelectorAll('.sdp-workspace-categories [aria-expanded]')).toHaveLength(0);
  expect(container.querySelectorAll('.sdp-workspace-folder-toggle')).toHaveLength(0);
  expect(container.querySelectorAll('.sdp-workspace-folder-toggle-spacer')).toHaveLength(2);
});

test('teclat: el nom és un botó natiu amb aria-expanded i conserva el focus en plegar i desplegar', () => {
  renderArbre();
  const wiki = nom('Wiki');
  // Enter i Espai els convertix en clic el navegador mateix: cap onKeyDown propi
  // que puga divergir del clic. jsdom no sintetitza eixa activació, per això
  // la prova dispara el clic que el navegador generaria.
  expect(wiki.tagName).toBe('BUTTON');
  expect(wiki.getAttribute('type')).toBe('button');
  wiki.focus();
  expect(document.activeElement).toBe(wiki);

  fireEvent.click(wiki);
  expect(document.activeElement).toBe(wiki);
  expect(wiki.getAttribute('aria-expanded')).toBe('true');

  fireEvent.click(wiki);
  expect(document.activeElement).toBe(wiki);
  expect(wiki.getAttribute('aria-expanded')).toBe('false');
});

test('l’auto-expansió dels pares de l’activa es manté i el nom del pare només selecciona', () => {
  const { rerender, onSelectionChange } = renderArbre();
  rerender(
    <UniversalWorkspace model={arbre} selection={{ categoryId: '3', itemId: 'doc' }} onSelectionChange={onSelectionChange} />
  );
  expect(visible('Protocols')).toBe(true);
  expect(nom('Wiki').getAttribute('aria-expanded')).toBe('true');
  expect(nom('Saber').getAttribute('aria-expanded')).toBe('true');
  expect(nom('Protocols').getAttribute('aria-current')).toBe('page');

  fireEvent.click(nom('Saber'));
  expect(nom('Saber').getAttribute('aria-current')).toBe('page');
  expect(visible('Protocols')).toBe(true);
});

test('en mode controlat (com la Wiki) el clic al nom desplega, selecciona i un segon clic plega', () => {
  function Controlada() {
    const [seleccio, setSeleccio] = useState({ categoryId: '4', itemId: 'cronica' });
    return (
      <UniversalWorkspace
        model={arbre}
        initialSelection={seleccio}
        selection={seleccio}
        onSelectionChange={(next) => setSeleccio(next)}
      />
    );
  }
  render(<Controlada />);
  const nav = screen.getByRole('navigation', { name: 'CATEGORIES' });

  fireEvent.click(within(nav).getByRole('button', { name: 'Wiki' }));
  expect(within(nav).getByRole('button', { name: 'Saber' })).toBeTruthy();
  expect(nom('Wiki').getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('button', { name: 'Portada de la Wiki' })).toBeTruthy();

  fireEvent.click(nom('Wiki'));
  expect(within(nav).queryByRole('button', { name: 'Saber' })).toBeNull();
  expect(nom('Wiki').getAttribute('aria-current')).toBe('page');
});
