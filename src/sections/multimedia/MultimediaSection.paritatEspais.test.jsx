/* P1-71 (directiva del Mestre 2026-10-29 18:35; B10, marató 261101_2143) ·
   /multimedia és un UniversalWorkspace de tres columnes «exactament igual que
   /disseny i /wikidepoble». Esta prova d'estructura fixa el contracte de props
   que les tres seccions passen a l'espai de treball (el mateix component pinta
   la mateixa closca: la paritat de geometria ve d'ací). Les divergències
   d'hui, escrites a mà:
     · la Wiki no ordena (sense `sortable`) i porta la seua classe. NO és una
       ordre del Mestre: esta prova no la dona per bona, només obliga a decidir
       a posta qualsevol canvi (si la Wiki ha d'ordenar, s'actualitza PROPIES);
     · Multimèdia porta la Barra de volums al peu de la Columna 1 (peuNavegacio).
   Ja ho fixen altres proves, i ací no es repetix: les props retirades
   (`replegaTotaCapcalera`…) a UniversalWorkspace.propsRetirades.test.js, i el
   peu fora del <nav>, amb el seu h2, a MultimediaSection.espai.test.jsx.
   Si una prova cau perquè una secció ha guanyat o perdut una prop, és un canvi
   d'estructura: decidiu-lo a posta i actualitzeu el contracte d'ací. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext.jsx';
import { creaBibliotecaFalsa } from '../../../tests/helpers/carpetaLocalFalsa.js';

const captures = vi.hoisted(() => []);

vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: (props) => {
    captures.push(props);
    return null;
  }
}));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: () => null }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, text) => text, resolveAsset: (uri) => uri }),
  useUIActionsOpcional: () => ({ t: (_clau, text) => text, resolveAsset: (uri) => uri }),
  useUIState: () => ({ externalConfig: {}, locale: 'ca-ES', language: 'ca' }),
  useUIStateOpcional: () => null
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: {}, towns: [] }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: () => ({ url: null, status: 'idle', isLoading: false, error: null, retry: () => {}, cancel: () => {} })
}));
vi.mock('../../data/wikiManifest.js', () => ({
  wikiManifest: {
    categories: [{ id: 'folder:ser', label: 'SER', parentId: null }],
    items: [{ id: 'identitat', title: 'Identitat', categoryId: 'folder:ser', tags: [], content: '# Identitat' }]
  }
}));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../disseny/cataleg/detailRegistry', () => ({
  CATALOG_DETAIL_LOADERS: new Proxy({}, { get: () => function Mostra() { return null; } })
}));
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [], mediaTimelineGroups: [] }) }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => ({ mitjans: [], cens: null, alies: null, llest: true }) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({ creaNota: vi.fn(), canCreate: false }) }));

import DesignSection from '../disseny/DesignSection.jsx';
import WikiDePobleSection from '../wiki-de-poble/WikiDePobleSection.jsx';
import MultimediaSection from './MultimediaSection.jsx';

beforeEach(() => {
  captures.length = 0;
  sessionStorage.clear();
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

/* Les props de l'última pintada de l'espai de treball d'una secció, muntada
   en la seua ruta (el MemoryRouter de casa pren `rutaInicial`). Dues guardes:
     · la sonda exigix que el router siga de veres en eixa ruta: si el router
       deixara de llegir-la, les tres es pintarien a '/' i cap altra asserció
       no ho veuria;
     · la secció ha de pintar l'espai ella mateixa: una captura d'una secció
       anterior del mateix test no val (si no, una secció que deixa de
       pintar-lo passaria amb les props d'una altra). */
function propsDe(element, ruta) {
  const abans = captures.length;
  let cami = null;
  function SondaRuta() {
    cami = useLocation().pathname;
    return null;
  }
  render(<MemoryRouter rutaInicial={ruta}><SondaRuta />{element}</MemoryRouter>);
  expect(cami).toBe(ruta);
  expect(captures.length).toBeGreaterThan(abans);
  return captures.at(-1);
}

const SECCIONS = {
  disseny: () => propsDe(<DesignSection />, '/disseny'),
  wiki: () => propsDe(<WikiDePobleSection />, '/wikidepoble'),
  multimedia: () => propsDe(<MultimediaSection magatzemCarpetes={creaBibliotecaFalsa()} entorn={{}} />, '/multimedia')
};

/* El contracte comú i les divergències conegudes (vegeu la capçalera). */
const COMUNES = ['collapsibleNavigation', 'icons', 'initialSelection', 'labels', 'mestreDetall', 'model', 'onSelectionChange', 'renderDetail', 'selection'];
const PROPIES = { disseny: ['sortable'], wiki: ['className'], multimedia: ['peuNavegacio', 'sortable'] };
const props = (p) => Object.keys(p).filter((k) => p[k] !== undefined).sort();

describe('P1-71 · paritat de les tres closques (Disseny, Wiki de Poble, Multimèdia)', () => {
  for (const [nom, munta] of Object.entries(SECCIONS)) {
    test(`${nom}: passa exactament el contracte comú i les seues props pròpies`, () => {
      expect(props(munta())).toEqual([...COMUNES, ...PROPIES[nom]].sort());
    });
  }

  test('les tres: arbre sense grups plegables (collapsibleNavigation={false}) i mestre-detall amb la seua clau', () => {
    const claus = {};
    for (const [nom, munta] of Object.entries(SECCIONS)) {
      cleanup();
      const p = munta();
      expect(p.collapsibleNavigation).toBe(false);
      expect(Object.keys(p.mestreDetall).sort()).toEqual(['clau', 'element']);
      claus[nom] = p.mestreDetall.clau;
    }
    expect(claus).toEqual({ disseny: 'disseny', wiki: 'wiki', multimedia: 'multimedia' });
  });

  test('Multimèdia ordena com Disseny (sortable)', () => {
    expect(SECCIONS.disseny().sortable).toBe(true);
    cleanup();
    expect(SECCIONS.multimedia().sortable).toBe(true);
  });

  test('les tres nomenen les dues columnes (categories i elements), amb la seua icona, i la tria buida', () => {
    for (const munta of Object.values(SECCIONS)) {
      cleanup();
      const p = munta();
      expect(typeof p.labels.categories).toBe('string');
      expect(typeof p.labels.items).toBe('string');
      expect(typeof p.labels.select).toBe('string');
      expect(p.icons.categories).toBeTruthy();
      expect(p.icons.items).toBeTruthy();
      expect(typeof p.renderDetail).toBe('function');
    }
  });
});
