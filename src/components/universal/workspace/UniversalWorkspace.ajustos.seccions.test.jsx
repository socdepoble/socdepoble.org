/* Llei de la Roda Dentada (ordre del Mestre, 261007) · La Wiki i Disseny amb
   l'espai de treball de veres i el router en memòria de veres (com les seues
   proves de mestre-detall): la roda dentada de la navegació obri «Amplada de
   les columnes» i «Carpetes a la vista», i la preferència es desa a l'espai
   de la secció (la clau del seu mestre-detall: 'wiki' i 'disseny'). Els
   documents i els espècimens pesats, simulats. Dades sintètiques per a la
   Wiki; el catàleg de Disseny, el de veres. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { CLAU_CARPETES_VISIBLES, _reiniciaCarpetesVisibles } from './carpetesVisibles.js';

vi.mock('../../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [
      { id: 'folder:ser', label: 'SER', parentId: null },
      { id: 'folder:saber', label: 'SABER', parentId: null },
      { id: 'folder:saber/arq', label: 'ARQUITECTURA', parentId: 'folder:saber' }
    ],
    items: [
      { id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' },
      { id: 'coneixement', title: 'Coneixement', categoryId: 'folder:saber', tags: [], content: '# Coneixement' },
      { id: 'pedra', title: 'Pedra seca', categoryId: 'folder:saber/arq', tags: [], content: '# Pedra seca' }
    ]
  }
}));
/* Onada 11 (261010; prompt 261010_1730, tasca 3) · el doble embolcalla l'h1 en
   una capçalera page-title, com la UniversalPage de veres. */
vi.mock('../UniversalPage.jsx', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
}));
vi.mock('../graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../../../sections/consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, resolveAsset: (uri) => uri }),
  useUIState: () => ({ externalConfig: {}, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: {} }) }));
vi.mock('../../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));
vi.mock('../../../sections/disseny/cataleg/detailRegistry', () => ({
  CATALOG_DETAIL_LOADERS: new Proxy({}, { get: () => function Mostra() { return <p>Espècimen de mostra</p>; } })
}));

import WikiDePobleSection from '../../../sections/wiki-de-poble/WikiDePobleSection.jsx';
import DesignSection from '../../../sections/disseny/DesignSection.jsx';
import { CATALOG_CATEGORIES } from '../../../sections/disseny/cataleg/manifest';

/* Seccions de veres i el diàleg obert: amb la màquina carregada passaven
   dels 5 s per defecte. */
vi.setConfig({ testTimeout: 30000 });

beforeEach(() => {
  sessionStorage.clear();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delVal(CLAU_CARPETES_VISIBLES);
  _reiniciaCarpetesVisibles();
});

const RODA = 'Configuració de l’espai de treball';
const navegacio = (c) => c.querySelector('#app-grid-sidebar');
const enNavegacio = (c, nom) => within(navegacio(c)).queryByRole('button', { name: nom });
const obriRoda = (c) => {
  const roda = within(navegacio(c)).getByRole('button', { name: RODA });
  roda.focus();
  fireEvent.click(roda);
  return { roda, dialeg: within(screen.getByRole('dialog', { name: RODA })) };
};
const amagades = () => getVal(CLAU_CARPETES_VISIBLES, null)?.espais ?? null;

test('Wiki · la roda obri l’amplada i les carpetes a la vista; amagar SER la lleva de l’arbre i es desa a l’espai «wiki»', () => {
  const { container } = render(<MemoryRouter rutaInicial="/wikidepoble"><WikiDePobleSection /></MemoryRouter>);
  expect(container.querySelector('.app-grid-shell').dataset.layout).toBe('ample');
  expect(enNavegacio(container, 'SER')).toBeTruthy();
  const { roda, dialeg } = obriRoda(container);
  expect(dialeg.getByRole('heading', { level: 3, name: 'Amplada de les columnes' })).toBeTruthy();
  expect(dialeg.getByRole('button', { name: 'Restablir l’amplada de les columnes' })).toBeTruthy();
  /* Les carpetes de primer nivell, també les de sistema de la Wiki (la
     portada i la Maquinària); ARQUITECTURA viu dins de SABER. */
  expect(dialeg.getAllByRole('switch').map((s) => s.closest('.sdp-interruptor').querySelector('.sdp-sr-only').textContent))
    .toEqual(['Vull vore Wiki de Poble', 'Vull vore Maquinària de la IAIA', 'Vull vore SER', 'Vull vore SABER']);
  fireEvent.click(dialeg.getByRole('switch', { name: 'Vull vore SER' }));
  expect(enNavegacio(container, 'SER')).toBeNull();
  expect(enNavegacio(container, 'SABER')).toBeTruthy();
  expect(amagades()).toEqual({ wiki: { 'folder:ser': false } });
  fireEvent.click(dialeg.getByRole('button', { name: 'Fet' }));
  expect(document.activeElement).toBe(roda);
  /* El document de SER continua a «Tot». */
  fireEvent.click(within(navegacio(container)).getByRole('button', { name: 'Tot' }));
  expect(within(container.querySelector('#app-grid-list')).getByRole('button', { name: /Identitat/ })).toBeTruthy();
});

test('Disseny · la roda obri les carpetes a la vista (una per família del catàleg) i la preferència es desa a l’espai «disseny»', () => {
  const { container } = render(<MemoryRouter rutaInicial="/disseny"><DesignSection /></MemoryRouter>);
  const inventari = CATALOG_CATEGORIES.find((categoria) => categoria.label === 'Inventari');
  expect(inventari).toBeTruthy();
  expect(enNavegacio(container, 'Inventari')).toBeTruthy();
  const { dialeg } = obriRoda(container);
  expect(dialeg.getByRole('heading', { level: 3, name: 'Carpetes a la vista' })).toBeTruthy();
  expect(dialeg.getAllByRole('switch').length).toBeGreaterThan(1);
  fireEvent.click(dialeg.getByRole('switch', { name: 'Vull vore Inventari' }));
  expect(enNavegacio(container, 'Inventari')).toBeNull();
  expect(amagades()).toEqual({ disseny: { [String(inventari.id)]: false } });
});

/* Correcció R1 del verificador · La Wiki entra a «Wiki de Poble»
   ('__intro_cat') i Disseny a «Fonaments»; un enllaç porta la seua
   ?categoria=. Si la persona ha amagat eixa carpeta, s'entra a «Tot» amb el
   MATEIX document i la URL no es toca. */
const amaga = (espais) => {
  setVal(CLAU_CARPETES_VISIBLES, { v: 1, espais });
  _reiniciaCarpetesVisibles();
};
const totPremut = (c) => within(navegacio(c)).getByRole('button', { name: 'Tot' }).getAttribute('aria-pressed');
const marcades = (c) => within(navegacio(c)).queryAllByRole('button').filter((boto) => boto.hasAttribute('aria-current'));
const fitxaOberta = (c) => within(c.querySelector('#app-grid-list')).getAllByRole('button')
  .filter((boto) => boto.getAttribute('aria-current') === 'true')
  .map((boto) => boto.textContent);

test('Wiki · amb «Wiki de Poble» (la carpeta d’entrada) amagada, s’entra a «Tot» amb la portada oberta i la URL intacta', () => {
  const visible = render(<MemoryRouter rutaInicial="/wikidepoble"><WikiDePobleSection /></MemoryRouter>);
  const portada = fitxaOberta(visible.container);
  expect(portada).toHaveLength(1);
  expect(totPremut(visible.container)).toBe('false');
  cleanup();

  amaga({ wiki: { __intro_cat: false } });
  const rutes = vi.fn();
  const { container } = render(<MemoryRouter rutaInicial="/wikidepoble" onCanvi={rutes}><WikiDePobleSection /></MemoryRouter>);
  expect(enNavegacio(container, 'Wiki de Poble')).toBeNull();
  expect(totPremut(container)).toBe('true');
  expect(marcades(container)).toEqual([]);
  expect(fitxaOberta(container)).toEqual(portada);
  /* La llista és la de «Tot»: els documents de totes les carpetes. */
  const llista = within(container.querySelector('#app-grid-list'));
  for (const titol of [/Identitat/, /Coneixement/, /Pedra seca/]) expect(llista.getByRole('button', { name: titol })).toBeTruthy();
  expect(rutes.mock.calls.map(([ruta]) => ruta)).toEqual(['/wikidepoble']);
});

test('Wiki · un enllaç a un document d’una carpeta amagada: «Tot» i el mateix document', () => {
  amaga({ wiki: { 'folder:saber': false } });
  const rutes = vi.fn();
  const entrada = '/wikidepoble?categoria=folder%3Asaber%2Farq&item=pedra';
  const { container } = render(<MemoryRouter rutaInicial={entrada} onCanvi={rutes}><WikiDePobleSection /></MemoryRouter>);
  expect(enNavegacio(container, 'SABER')).toBeNull();
  expect(totPremut(container)).toBe('true');
  expect(marcades(container)).toEqual([]);
  expect(fitxaOberta(container).join(' ')).toMatch(/Pedra seca/);
  expect(rutes.mock.calls.map(([ruta]) => ruta)).toEqual([entrada]);
});

test('Disseny · amb «Fonaments» (la carpeta d’entrada) amagada, s’entra a «Tot» i la URL no es toca', () => {
  amaga({ disseny: { fonaments: false } });
  const rutes = vi.fn();
  const { container } = render(<MemoryRouter rutaInicial="/disseny" onCanvi={rutes}><DesignSection /></MemoryRouter>);
  expect(enNavegacio(container, 'Fonaments')).toBeNull();
  expect(totPremut(container)).toBe('true');
  expect(marcades(container)).toEqual([]);
  expect(rutes.mock.calls.map(([ruta]) => ruta)).toEqual(['/disseny']);
});
