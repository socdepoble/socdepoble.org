import React from 'react';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';

/* Gauntlet 261030 (cicle 4, lang-ca-nomes-a-textsection) · Decisió del Mestre
   (261030): «lang="ca" al contingut original en valencià quan la interfície
   està en una altra llengua». El títol, el subtítol i l'entradilla de les
   pàgines de /consola són PAGE_COPY (copyConsola, paginaConsola,
   paginaEmpaquetats, paginaGovern), sempre en valencià: amb la interfície en
   anglés, l'H1 i la .page-intro porten lang="ca" (WCAG 3.1.2), com a
   /page/consola. Les dades i els botons de dins, no (cicle 3). Amb la
   interfície en valencià, cap lang (el DOM de sempre). Ruta real: el router,
   la UniversalPage i el PageFrame de veres; només es falsegen les fonts (sense
   xarxa), els avisos, el SEO i el llenç del graf. */
const mocks = vi.hoisted(() => ({ ui: null }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => mocks.ui,
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte }),
  useUIActionsOpcional: () => null
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('./mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('./consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(null)
}));
vi.mock('./govern/governContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaGovern: () => Promise.resolve(null)
}));
vi.mock('./empaquetats.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaEmpaquetats: () => Promise.resolve(null)
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import ConsolaSection from './ConsolaSection.jsx';
import { copyConsola, paginaConsola } from './consolaPagines.js';
import { RUTA_EMPAQUETATS, paginaEmpaquetats } from './empaquetats.js';
import { paginaGovern, rutaGovern } from './govern/governConsola.js';

if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);

let errors;
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => null })));
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  vi.unstubAllGlobals();
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
  localStorage.clear();
});

function Aplicacio() {
  return (
    <RouterProvider>
      <Routes>
        <Route path="/consola/*" element={<ConsolaSection />} />
      </Routes>
    </RouterProvider>
  );
}
async function obri(ruta) {
  window.history.replaceState(null, '', ruta);
  const pintada = render(<Aplicacio />);
  await act(async () => {});
  await waitFor(() => expect(document.body.textContent).not.toMatch(/Llegint/));
  return pintada;
}

const PAGINES = Object.freeze([
  { ruta: '/consola', copy: () => copyConsola() },
  { ruta: '/consola/inventari', copy: () => paginaConsola('inventari') },
  { ruta: RUTA_EMPAQUETATS, copy: () => paginaEmpaquetats() },
  { ruta: rutaGovern('requeriments'), copy: () => paginaGovern('requeriments') },
]);

test('amb la interfície en anglés, el títol i l’entradilla de PAGE_COPY porten lang="ca"; el cos, no', async () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'en' };
  for (const { ruta, copy } of PAGINES) {
    const { container, unmount } = await obri(ruta);
    const h1 = container.querySelector('h1');
    const intro = container.querySelector('article.content-wrapper .page-intro');
    expect([ruta, h1?.textContent, h1?.getAttribute('lang')]).toEqual([ruta, copy().title, 'ca']);
    expect([ruta, intro?.getAttribute('lang'), intro?.querySelector('h2')?.textContent]).toEqual([ruta, 'ca', copy().subtitle]);
    // L'article original no es marca sencer: dins hi ha dades i botons de la interfície.
    expect([ruta, container.querySelector('article.content-wrapper').hasAttribute('lang')]).toEqual([ruta, false]);
    unmount();
  }
});

test('amb la interfície en valencià, cap lang (el DOM de sempre)', async () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'ca' };
  for (const { ruta } of PAGINES) {
    const { container, unmount } = await obri(ruta);
    expect([ruta, container.querySelectorAll('[lang]').length]).toEqual([ruta, 0]);
    unmount();
  }
});
