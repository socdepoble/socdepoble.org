/* Barres (ordre del Mestre, 261004: «La columna de la Wiki ha d'estar fixa
   i visible, almenys plegada, en tots els formats») · La Wiki de veres, amb
   les amplàries desades que es van mesurar al navegador ({260, 362}: el
   mínim d'«ample» és 944). Abans, de 720 a 943 la navegació «WIKI DE
   POBLE» desapareixia del tot (fora de pantalla, amagada i inert). Ara és
   un rail fix: la nav «WIKI DE POBLE» dins del rail i Expandir porta al
   panell amb el focus a la carpeta activa. 719 és estret i 944 és ample:
   cap dels dos porta el rail de mitjà. Dades sintètiques. */
import React from 'react';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [
      { id: 'folder:ser', label: 'SER', parentId: null },
      { id: 'folder:saber', label: 'SABER', parentId: null }
    ],
    items: [
      { id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' },
      { id: 'coneixement', title: 'Coneixement', categoryId: 'folder:saber', tags: [], content: '# Coneixement' }
    ]
  }
}));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({
  UniversalPage: ({ title }) => <header className="page-title"><h1>{title}</h1></header>
}));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: () => ({ url: null, status: 'idle', isLoading: false })
}));

import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';
import { setVal } from '../../config/storage.js';
import WikiDePobleSection from './WikiDePobleSection.jsx';

/* Les amplàries desades del navegador de la diagnosi: llista de 362. */
beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  setVal('sdp-grid-widths', { left: 260, middle: 362 });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const munta = (amplada, ruta = '/wikidepoble') => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(amplada);
  return render(
    <MemoryRouter rutaInicial={ruta}>
      <Routes>
        <Route path="/wikidepoble" element={<WikiDePobleSection />} />
      </Routes>
    </MemoryRouter>
  );
};

const closca = (c) => c.querySelector('.app-grid-shell');
const navegacio = (c) => c.querySelector('#app-grid-sidebar');

test.each([720, 820, 943])('Barres · a %i la nav «WIKI DE POBLE» és al rail fix i Expandir obri el panell amb el focus a la carpeta activa', (amplada) => {
  const { container } = munta(amplada);
  expect([closca(container).dataset.layout, closca(container).dataset.panell, closca(container).dataset.esquerra]).toEqual(['mitja', '', 'rail']);
  const nav = navegacio(container);
  expect(nav.hasAttribute('inert')).toBe(false);
  expect(nav.getAttribute('aria-hidden')).toBeNull();
  expect(nav.dataset.obert).toBe('true');
  const rail = within(nav).getByRole('navigation', { name: 'WIKI DE POBLE' });
  expect(rail.classList.contains('sdp-workspace-rail')).toBe(true);
  expect(within(rail).getByRole('button', { name: 'Wiki de Poble' }).getAttribute('aria-current')).toBe('page');

  const expandir = within(nav).getByRole('button', { name: 'Expandir WIKI DE POBLE' });
  expect(expandir.getAttribute('aria-controls')).toBe('app-grid-sidebar');
  expandir.focus();
  fireEvent.click(expandir);
  expect(closca(container).dataset.panell).toBe('left');
  expect(document.activeElement.closest('#app-grid-sidebar')).toBe(nav);
  expect(document.activeElement.getAttribute('aria-current')).toBe('page');
  expect(document.activeElement.textContent).toContain('Wiki de Poble');
});

test('Barres · a 719 (estret) i a 944 (ample) no hi ha el rail de mitjà; a 944, les dues columnes desplegades', () => {
  const estret = munta(719);
  expect(closca(estret.container).dataset.layout).toBe('estret');
  expect(closca(estret.container).hasAttribute('data-esquerra')).toBe(false);
  cleanup();
  vi.restoreAllMocks();
  const { container } = munta(944);
  expect(closca(container).dataset.layout).toBe('ample');
  expect(closca(container).hasAttribute('data-esquerra')).toBe(false);
  expect(within(navegacio(container)).getByRole('button', { name: 'Replegar WIKI DE POBLE' })).toBeTruthy();
  expect(navegacio(container).querySelector('.sdp-workspace-rail')).toBeNull();
});
