/* T1b (ordre directa del Mestre, 12-11-2026 21:26) · /page/fediversity és una UniversalPage normal: la
   maquinària de sempre (PageDetailSection → TextSection → UniversalPage), ampla i seguida, sense cap
   Workspace ni les columnes «Documents» i «Fediversity» que estrenyien el títol fins a partir-lo lletra a
   lletra. Un sol H1 amb el títol sencer de PAGE_COPY i, al final de l'article, l'aparador amb els cinc rols
   i la portabilitat de l'arquitectura. Cap fitxa davall de /page/fediversity: la subruta dona 404. */
import { webcrypto } from 'node:crypto';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from '../../app/contexts/RouterContext';

vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import PageDetailSection from './PageDetailSection.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import { APARADOR_R20_TEXTS } from '../text/pageContent.fediversityR20.js';
import { FEDIVERSITY_ACTORS, FEDIVERSITY_ARCHITECTURE_TEXTS } from '../text/fediversityArchitectureR11.js';

beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/page/:slug/:itemSlug" element={<PageDetailSection />} />
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/" element={<p data-testid="inici">Inici</p>} />
    </Routes>
  </MemoryRouter>
);

const SENSE_WORKSPACE = '.sdp-workspace, .sdp-workspace-column, .sdp-cataleg-workspace, #app-grid-list, #app-grid-main';

test('/page/fediversity: un sol H1 sencer, cap Workspace i l’aparador amb els cinc rols al final de l’article', async () => {
  visita('/page/fediversity');
  const h1 = await screen.findByRole('heading', { level: 1 }, { timeout: 5000 });
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  // El títol sencer en un sol node de text, dins del bloc de l'H1 de la UniversalPage.
  expect(h1.textContent).toBe(PAGE_COPY.fediversity.title);
  expect(h1.children).toHaveLength(0);
  expect(h1.closest('header.page-title')).not.toBeNull();
  expect(document.querySelector(SENSE_WORKSPACE)).toBeNull();
  expect(screen.queryByRole('complementary', { name: 'Documents' })).toBeNull();
  expect(screen.queryByRole('complementary', { name: 'Fediversity' })).toBeNull();

  const arquitectura = FEDIVERSITY_ARCHITECTURE_TEXTS.ca;
  const seccio = await screen.findByRole('region', { name: arquitectura.title }, { timeout: 5000 });
  expect(screen.getAllByRole('region', { name: arquitectura.title })).toHaveLength(1);
  expect(seccio.querySelector('h3').textContent).toBe(arquitectura.title);
  expect([...seccio.querySelectorAll(':scope > dl > dt')].map((dt) => dt.textContent)).toEqual(Object.values(FEDIVERSITY_ACTORS));
  expect([...seccio.querySelectorAll(':scope > dl > dd')].map((dd) => dd.textContent))
    .toEqual(Object.keys(FEDIVERSITY_ACTORS).map((rol) => arquitectura.actors[rol]));
  expect(within(seccio).getByRole('heading', { level: 4 }).textContent).toBe(arquitectura.portability);
  expect([...seccio.querySelectorAll('ol > li')].map((li) => li.textContent)).toEqual(arquitectura.steps);

  /* Una sola pàgina seguida: la capçalera de l'H1 (PageFrame, fora de l'article) i l'article són germans
     del mateix marc; l'aparador va dins de l'article, després del cos de PAGE_COPY. */
  const capcalera = h1.closest('header.page-title');
  const article = seccio.closest('article');
  expect(article).not.toBeNull();
  expect(article.parentElement).toBe(capcalera.parentElement);
  expect(capcalera.compareDocumentPosition(article) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const cos = article.querySelector('.cms-preview');
  expect(cos.compareDocumentPosition(seccio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(article).getByRole('region', { name: APARADOR_R20_TEXTS.ca.compiler })).toBeTruthy();
});

test('/page/fediversity/<fitxa> no obri cap Workspace: 404 amb un sol H1', async () => {
  visita('/page/fediversity/maintainers');
  const h1 = await screen.findByRole('heading', { level: 1 }, { timeout: 5000 });
  expect(h1.textContent).toBe('Ací no hi ha res');
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(document.querySelector(SENSE_WORKSPACE)).toBeNull();
});
