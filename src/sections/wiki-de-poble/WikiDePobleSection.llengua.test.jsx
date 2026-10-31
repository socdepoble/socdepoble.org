import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';

/* Gauntlet 261030 (cicle 4, lang-ca-nomes-a-textsection) · Decisió del Mestre
   (261030): «lang="ca" al contingut original en valencià quan la interfície
   està en una altra llengua». Mesura en viu: amb la interfície en anglés,
   /wikidepoble?item=01_identitat llegia l'H1, l'entradilla i el cos amb la
   veu anglesa (WCAG 3.1.2). Ara cada pàgina de la Wiki ho declara
   (llenguaDelContingut="ca") i el cos el demana (useLlenguaDelContingut).
   L'article sencer no: dins hi ha peces de la interfície (cicle 3). Amb la
   interfície en valencià, cap lang (el DOM de sempre).
   Ruta real: el router, la Wiki amb el seu workspace, la UniversalPage i el
   PageFrame de veres. Només es falsegen el manifest (un document inventat),
   les fonts de la Consola (sense xarxa), els avisos, el SEO i el graf. */
const mocks = vi.hoisted(() => ({ ui: null }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIState: () => mocks.ui,
  useUIStateOpcional: () => mocks.ui,
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte }),
  useUIActionsOpcional: () => null
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:01_ser', parentId: null, label: 'SER' }],
    items: [{
      id: 'document_inventat', title: 'Document inventat', subtitle: 'Un text de la Wiki',
      categoryId: 'folder:01_ser', tags: [], attributes: { version: '1.0.0', date: '2026-10-30' },
      content: '# Ens Híbrid inventat\n\nPensant en global, treballant en local.\n\n## Una secció\n\nEl cos del document, en valencià.'
    }]
  }
}));
vi.mock('../consola/mapa/useMapa.js', () => ({
  useMapa: () => ({ estat: 'absent', mapa: null, error: null, carrega: () => {} })
}));
vi.mock('../consola/consolaContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaConsola: () => Promise.resolve(null)
}));
vi.mock('../consola/govern/governContent.js', async (importOriginal) => ({
  ...(await importOriginal()),
  carregaGovern: () => Promise.resolve(null)
}));
import { RouterProvider, Route, Routes } from '../../app/contexts/RouterContext';
import WikiDePobleSection from './WikiDePobleSection.jsx';
import DocumentacioMaquinaria from './DocumentacioMaquinaria.jsx';
import { LlenguaDelContingut } from '../../components/universal/traduccio/llenguaDelContingut.js';
import { ID_BIOS } from './documentacioMaquinaria.js';
import { PAGE_COPY } from '../text/pageContent';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => null })));
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

async function obri(item) {
  window.history.replaceState(null, '', item ? `/wikidepoble?item=${item}` : '/wikidepoble');
  const pintada = render(
    <RouterProvider>
      <Routes>
        <Route path="/wikidepoble" element={<WikiDePobleSection />} />
      </Routes>
    </RouterProvider>
  );
  await act(async () => {});
  await waitFor(() => expect(pintada.container.querySelector('header.page-title h1')).not.toBeNull());
  return pintada;
}
const original = (container) => container.querySelector('article.content-wrapper:not(.sdp-traduccio-cos)');

test('un document de la Wiki: l’H1, l’entradilla, el Quadre ISO i el cos porten lang="ca"; l’article sencer, no', async () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'en' };
  const { container } = await obri('document_inventat');
  const h1 = container.querySelector('header.page-title h1');
  expect([h1.textContent, h1.getAttribute('lang')]).toEqual(['Ens Híbrid inventat', 'ca']);
  const intro = original(container).querySelector('.page-intro');
  expect([intro.getAttribute('lang'), intro.querySelector('p.lead').textContent]).toEqual(['ca', 'Pensant en global, treballant en local.']);
  expect(original(container).querySelector('.sdp-article').getAttribute('lang')).toBe('ca');
  const prosa = original(container).querySelector('.sdp-prose');
  expect([prosa.getAttribute('lang'), prosa.textContent]).toEqual(['ca', expect.stringContaining('El cos del document, en valencià.')]);
  expect(original(container).hasAttribute('lang')).toBe(false);
});

test('la portada i la Consola dins de la Wiki: el copy de PAGE_COPY porta lang="ca"', async () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'en' };
  const portada = await obri(null);
  expect(portada.container.querySelector('header.page-title h1').getAttribute('lang')).toBe('ca');
  expect(original(portada.container).querySelector('.sdp-prose.sdp-prose--encoixinada').getAttribute('lang')).toBe('ca');
  portada.unmount();
  const consola = await obri('consola_termodinamica');
  const h1 = consola.container.querySelector('header.page-title h1');
  expect([h1.textContent, h1.getAttribute('lang')]).toEqual([PAGE_COPY.consola.title, 'ca']);
  expect(original(consola.container).querySelector('.page-intro').getAttribute('lang')).toBe('ca');
});

test('amb la interfície en valencià, cap lang (el DOM de sempre)', async () => {
  mocks.ui = { locale: 'ca-ES', externalConfig: {}, llenguaDelText: 'ca' };
  for (const item of ['document_inventat', null, 'consola_termodinamica']) {
    const { container, unmount } = await obri(item);
    expect([item, container.querySelectorAll('[lang]').length]).toEqual([item, 0]);
    unmount();
  }
});

test('la documentació de la Maquinària demana el lang de la pàgina; sense, cap atribut', () => {
  const amb = render(
    <LlenguaDelContingut.Provider value="ca"><DocumentacioMaquinaria id={ID_BIOS} /></LlenguaDelContingut.Provider>
  );
  expect(amb.container.querySelector('.sdp-tractors-panell').getAttribute('lang')).toBe('ca');
  amb.unmount();
  const sense = render(<DocumentacioMaquinaria id={ID_BIOS} />);
  expect(sense.container.querySelector('.sdp-tractors-panell').hasAttribute('lang')).toBe(false);
});
