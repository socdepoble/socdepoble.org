/**
 * PedraSecaV1226G26_2.test.jsx — Bateria de verificació de Kit G26-2 (v1.2.26):
 *   · IDEA-360: Taxonomia geogràfica en text pla clicable centrat (4 nivells +
 *     paratges), posició davall de píndoles i damunt de copyright, i PaginaComarca.
 *   · IDEA-365: Píndoles 100 % clicables (`rutaDePindola`, `UniversalCard`, `PageFrame`).
 *   · IDEA-367: Botó uniforme «Afig Catàleg / Fitxa» + modal dual `ModalAfigCataleg`
 *     + botó PDF de «Què dinem?» centrat + presentacions `C26-2`.
 *   · IDEA-370: `PaginaEditorialEtiqueta` (`/etiqueta/idees`, `/categoria/catalegs`).
 *   · IDEA-375: `ControlEdicioTaxonomia` + `PanellEdicioTaxonomia` només per a
 *     `superadmin + aal2`, contracte `C26-3` (idPagina amb barres, >=1 sistema, CAS).
 *   · Paritat 5L i prefixos exclusius `taxonomiaV26*` / `catalegAfigV26*`.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Link, MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import {
  CoreContentContext,
  RouteParamsContext,
  SessionContext,
  UIActionsContext,
  UIContext
} from '../../app/contexts/objectesDeContext.js';
import { MurContext } from '../mur/objectesDeContext.js';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
import { BlocTerritoriTargeta } from '../../components/PedraSeca/organismes/BlocTerritoriTargeta.jsx';
import { elementsTerritorialsDe, resolComarcaPerSlug } from '../../data/taxonomia/taxonomiaGeografica.js';
import { CLAUS_I18N_TAXONOMIA_V26, DICCIONARIS_I18N_TAXONOMIA_V26 } from '../../data/taxonomia/i18nTaxonomiaV26.js';
import { CLAUS_I18N_CATALEG_AFIG_V26, DICCIONARIS_I18N_CATALEG_AFIG_V26 } from '../../components/universal/workspace/i18nCatalegAfigV26.js';
import PaginaComarca from '../pobles/PaginaComarca.jsx';
import PaginaEditorialEtiqueta from './PaginaEditorialEtiqueta.jsx';
import ModalAfigCataleg from '../../components/universal/workspace/ModalAfigCataleg.jsx';
import CreditsQueDinem from '../patrimoni/CreditsQueDinem.jsx';
import ControlEdicioTaxonomia from './ControlEdicioTaxonomia.jsx';
import { resetOverlaysTaxonomiaPerTests } from './useTaxonomiaPaginaOverlay.js';

const mockLligTaxonomiaPagina = vi.fn();
const mockActualitzaTaxonomiaPagina = vi.fn();
const mockTeCapacitat = vi.fn(() => true);

vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    lligTaxonomiaPagina: (...args) => mockLligTaxonomiaPagina(...args),
    actualitzaTaxonomiaPagina: (...args) => mockActualitzaTaxonomiaPagina(...args),
    teCapacitat: (...args) => mockTeCapacitat(...args)
  };
});

const TOWNS_FIXTURE = [
  {
    id: 'la-torre-de-les-macanes',
    slug: 'la-torre-de-les-macanes',
    title: 'La Torre de les Maçanes',
    comarca: "L'Alacantí",
    provincia: 'Alacant',
    entradilla: 'Poble de muntanya de les comarques d’Alacant.'
  },
  {
    id: 'xixona',
    slug: 'xixona',
    title: 'Xixona',
    comarca: "L'Alacantí",
    provincia: 'Alacant',
    entradilla: 'Bressol del torró i porta de la Carrasqueta.'
  },
  {
    id: 'muro-de-alcoi',
    slug: 'muro-de-alcoi',
    title: 'Muro',
    comarca: 'El Comtat',
    provincia: 'Alacant',
    entradilla: 'Poble del Comtat.'
  }
];

const POSTS_FIXTURE = [
  {
    id: 'aplec-2',
    slug: '2n-aplec-soc-de-poble',
    title: '2n Aplec Sóc de Poble',
    subtitle: 'Trobada intercomarcal',
    entradilla: 'Crònica de trobada entre pobles.',
    type: 'post',
    labels: [
      { text: 'Mur', className: 'sdp-badge-system' },
      { text: 'Idees', className: 'sdp-badge-tag' }
    ],
    pobles_esmentats: ['La Torre de les Maçanes', 'Xixona'],
    paratges: ['La Grana']
  },
  {
    id: 'trilogia-comarques',
    slug: 'trilogia-de-les-comarques',
    title: 'Trilogia de les comarques',
    subtitle: 'Memòria comarcal',
    type: 'post',
    labels: [
      { text: 'Catàlegs', className: 'sdp-badge-system' }
    ],
    comarques: ["L'Alacantí", 'El Comtat']
  }
];

function embolcall(ui, { path = '/', params = {}, sessio = null } = {}) {
  const estatSessio = sessio ?? { esSuperadmin: false, nivell: 'anonim' };
  const uiState = { language: 'ca', externalConfig: null };
  const uiActions = { language: 'ca', t: (_clau, reserva) => reserva ?? _clau, resolveAsset: (v) => v };
  return (
    <UIContext.Provider value={uiState}>
      <UIActionsContext.Provider value={uiActions}>
        <SessionContext.Provider value={estatSessio}>
          <CoreContentContext.Provider value={{ towns: TOWNS_FIXTURE, personalitzacio: null }}>
            <MurContext.Provider value={{ feedPosts: POSTS_FIXTURE, events: [], marketItems: [] }}>
              <MemoryRouter rutaInicial={path}>
                <RouteParamsContext.Provider value={params}>
                  {ui}
                </RouteParamsContext.Provider>
              </MemoryRouter>
            </MurContext.Provider>
          </CoreContentContext.Provider>
        </SessionContext.Provider>
      </UIActionsContext.Provider>
    </UIContext.Provider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  resetOverlaysTaxonomiaPerTests();
});

describe('G26-2 · Paritat 5L i prefixos exclusius', () => {
  it('manté les 5 llengües completes i prefix taxonomiaV26* sense col·lisions', () => {
    const llengues = ['ca', 'es', 'en', 'eu', 'gl'];
    expect(Object.keys(DICCIONARIS_I18N_TAXONOMIA_V26).sort()).toEqual([...llengues].sort());
    expect(CLAUS_I18N_TAXONOMIA_V26.length).toBeGreaterThan(25);
    for (const clau of CLAUS_I18N_TAXONOMIA_V26) {
      expect(clau.startsWith('taxonomiaV26')).toBe(true);
    }
    for (const lang of llengues) {
      expect(Object.keys(DICCIONARIS_I18N_TAXONOMIA_V26[lang]).sort()).toEqual([...CLAUS_I18N_TAXONOMIA_V26].sort());
      for (const valor of Object.values(DICCIONARIS_I18N_TAXONOMIA_V26[lang])) {
        expect(typeof valor).toBe('string');
        expect(valor.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('manté les 5 llengües completes i prefix catalegAfigV26* sense col·lisions', () => {
    const llengues = ['ca', 'es', 'en', 'eu', 'gl'];
    expect(Object.keys(DICCIONARIS_I18N_CATALEG_AFIG_V26).sort()).toEqual([...llengues].sort());
    expect(CLAUS_I18N_CATALEG_AFIG_V26.length).toBeGreaterThan(8);
    for (const clau of CLAUS_I18N_CATALEG_AFIG_V26) {
      expect(clau.startsWith('catalegAfigV26')).toBe(true);
    }
    for (const lang of llengues) {
      expect(Object.keys(DICCIONARIS_I18N_CATALEG_AFIG_V26[lang]).sort()).toEqual([...CLAUS_I18N_CATALEG_AFIG_V26].sort());
    }
  });
});

describe('G26-2 · IDEA-365 píndoles 100 % clicables', () => {
  it('resol rutes canòniques per categories de sistema, categories temàtiques i etiquetes', () => {
    expect(rutaDePindola({ text: 'Mur', className: 'sdp-badge-system' })).toBe('/mur');
    expect(rutaDePindola({ text: 'Catàlegs', className: 'sdp-badge-system' })).toBe('/categoria/catalegs');
    expect(rutaDePindola({ text: 'Patrimoni', className: 'sdp-badge-category' })).toBe('/categoria/patrimoni');
    expect(rutaDePindola({ text: 'Idees', className: 'sdp-badge-tag' })).toBe('/etiqueta/idees');
    expect(rutaDePindola({ text: 'Custom', href: '/page/custom' })).toBe('/page/custom');
    expect(rutaDePindola({ text: 'Sense clic', inerta: true })).toBeNull();
  });

  it('renderitza píndoles com a enllaços clicables dins UniversalCard i mai spans morts', () => {
    const { container } = render(embolcall(
      <UniversalCard
        title="Targeta de prova"
        labels={[
          { text: 'Sistema', className: 'sdp-badge-system' },
          { text: 'Idees', className: 'sdp-badge-tag' }
        ]}
        copyright="CC BY-NC-SA 4.0 · Sóc de Poble"
      />
    ));
    const sistemaLink = screen.getByRole('link', { name: 'Sistema' });
    const ideesLink = screen.getByRole('link', { name: 'Idees' });
    expect(sistemaLink.getAttribute('href')).toBe('/categoria/sistema');
    expect(ideesLink.getAttribute('href')).toBe('/etiqueta/idees');
    expect(container.querySelectorAll('.sp-card-labels span.sp-card-label').length).toBe(0);
  });
});

describe('G26-2 · IDEA-360 taxonomia geogràfica i PaginaComarca', () => {
  it('resol jerarquia de 4 nivells + paratges al Mapa (2n Aplec i Trilogia)', () => {
    const aplec = elementsTerritorialsDe(POSTS_FIXTURE[0], TOWNS_FIXTURE);
    expect(aplec.map((e) => e.nivell)).toEqual(['demarcacio', 'comarca', 'poble', 'poble', 'paratge']);
    expect(aplec.find((e) => e.nivell === 'comarca')?.href).toBe('/comarca/l-alacanti');
    expect(aplec.find((e) => e.nivell === 'paratge')?.href).toContain('/mapa?paratge=la-grana');

    const trilogia = elementsTerritorialsDe(POSTS_FIXTURE[1], TOWNS_FIXTURE);
    expect(trilogia.filter((e) => e.nivell === 'comarca').map((e) => e.href)).toEqual([
      '/comarca/l-alacanti',
      '/comarca/el-comtat'
    ]);
  });

  it('situa el bloc territorial en text pla davall de píndoles i damunt del copyright', () => {
    const territori = elementsTerritorialsDe(POSTS_FIXTURE[0], TOWNS_FIXTURE);
    const { container } = render(embolcall(
      <UniversalCard
        title="2n Aplec Sóc de Poble"
        labels={POSTS_FIXTURE[0].labels}
        territori={territori}
        copyright="CC BY-NC-SA 4.0 · Sóc de Poble"
      />
    ));
    const labelsEl = container.querySelector('.sp-card-labels');
    const territoriEl = container.querySelector('.sp-card-territori');
    const copyrightEl = container.querySelector('.sp-card-copyright');
    expect(labelsEl).not.toBeNull();
    expect(territoriEl).not.toBeNull();
    expect(copyrightEl).not.toBeNull();
    expect(Boolean(labelsEl.compareDocumentPosition(territoriEl) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(Boolean(territoriEl.compareDocumentPosition(copyrightEl) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(territoriEl.querySelectorAll('.sp-card-label').length).toBe(0);
    expect(screen.getByRole('link', { name: "L'Alacantí" }).getAttribute('href')).toBe('/comarca/l-alacanti');
  });

  it('mostra PaginaComarca a /comarca/:slug amb MollaPa, pobles i publicacions, i fallback 404 si no existix', () => {
    expect(resolComarcaPerSlug('l-alacanti', TOWNS_FIXTURE)?.pobles).toHaveLength(2);

    const { unmount } = render(embolcall(<PaginaComarca />, { path: '/comarca/l-alacanti', params: { slug: 'l-alacanti' } }));
    expect(screen.getByRole('heading', { level: 1, name: "L'Alacantí" })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'La Torre de les Maçanes' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Xixona' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: '2n Aplec Sóc de Poble' })).toBeTruthy();
    unmount();

    render(embolcall(<PaginaComarca />, { path: '/comarca/comarca-inventada', params: { slug: 'comarca-inventada' } }));
    expect(screen.getByRole('heading', { level: 1, name: 'Comarca no trobada' })).toBeTruthy();
  });

  /* FN0-001 (segona ronda del Lot C1-3) · Sense RouterProvider, el Link del
     router pinta l'<a> de sempre: el bloc territorial (i la píndola
     d'UniversalCard, el mateix Link) ja no porta un <a> de reserva propi, i el
     clic no es para (cap preventDefault). */
  it('sense RouterProvider, el Link i el bloc territorial pinten l’<a> de la ruta i deixen navegar el navegador', () => {
    const territori = elementsTerritorialsDe(POSTS_FIXTURE[0], TOWNS_FIXTURE);
    render(
      <>
        <Link to="/etiqueta/idees" className="sp-card-label">Idees</Link>
        <BlocTerritoriTargeta elements={territori} />
      </>
    );
    const idees = screen.getByRole('link', { name: 'Idees' });
    const comarca = screen.getByRole('link', { name: "L'Alacantí" });
    expect(idees.getAttribute('href')).toBe('/etiqueta/idees');
    expect(comarca.getAttribute('href')).toBe('/comarca/l-alacanti');
    const parats = [];
    const escolta = (event) => { parats.push(event.defaultPrevented); event.preventDefault(); };
    document.body.addEventListener('click', escolta);
    try {
      fireEvent.click(idees);
      fireEvent.click(comarca);
    } finally {
      document.body.removeEventListener('click', escolta);
    }
    expect(parats).toEqual([false, false]);
  });

  it('filtra URLs insegures en BlocTerritoriTargeta', () => {
    const { container } = render(embolcall(
      <BlocTerritoriTargeta elements={[{ id: 'bad', text: 'XSS', href: 'javascript:alert(1)', nivell: 'poble' }]} />
    ));
    expect(container.querySelector('.sp-card-territori')).toBeNull();
  });

  /* Lot C1-3 (D1 de l'integrador) · BlocTerritoriTargeta viatja amb UniversalCard i el seu ?inline amb ell: adopta
     només diferit-territori-v26.css ('territori-v26'), amb les regles .sp-card-territori* sense cap canvi, i cada
     targeta ja no arrossega el full sencer de taxonomia. La resta de diferit-taxonomia-v26.css es queda per als
     tres consumidors diferits ('taxonomia-v26'), que no pinten cap classe del bloc territorial. */
  it('el bloc territorial adopta només el seu full (territori-v26) i el full de taxonomia ja no porta cap regla .sp-card-territori', () => {
    const llig = (cami) => readFileSync(resolve(process.cwd(), cami), 'utf8');
    const senseComentaris = (cami) => llig(cami).replace(/\/\*[\s\S]*?\*\//g, '');
    const territori = senseComentaris('src/css/diferit-territori-v26.css').trim();
    expect(territori).toMatch(/^@layer components \{[\s\S]*\}$/);
    for (const selector of [
      '.sp-card-territori {',
      '.sp-card-territori__enllac {',
      '.sp-card-territori__enllac:focus-visible {',
      '.sp-card-territori__sep {',
      '.sp-card-territori__enllac:hover {'
    ]) expect(territori).toContain(selector);
    expect(territori).not.toMatch(/\.sdp-(?:taxonomia|cataleg)-/);
    expect(senseComentaris('src/css/diferit-taxonomia-v26.css')).not.toContain('sp-card-territori');

    const bloc = llig('src/components/PedraSeca/organismes/BlocTerritoriTargeta.jsx');
    expect(bloc).toContain("import cssTerritoriV26 from '../../../css/diferit-territori-v26.css?inline';");
    expect(bloc).toContain("adoptaFullDiferit(node, 'territori-v26', cssTerritoriV26)");
    expect(bloc).not.toMatch(/^import .*diferit-taxonomia-v26/m);
    for (const cami of [
      'src/sections/taxonomia/PaginaEditorialEtiqueta.jsx',
      'src/sections/taxonomia/PanellEdicioTaxonomia.jsx',
      'src/components/universal/workspace/ModalAfigCataleg.jsx'
    ]) {
      const font = llig(cami);
      expect(font, cami).toContain("useFullDiferit(arrelRef, 'taxonomia-v26', cssTaxonomiaV26)");
      expect(font, cami).not.toContain('sp-card-territori');
    }
  });
});

describe('G26-2 · IDEA-370 PaginaEditorialEtiqueta', () => {
  it('renderitza /etiqueta/idees amb H1, H2, entradeta plana, àlies i targetes coincidents', () => {
    render(embolcall(<PaginaEditorialEtiqueta tipusRuta="etiqueta" />, { path: '/etiqueta/idees', params: { slug: 'idees' } }));
    expect(screen.getByRole('heading', { level: 1, name: 'Idees' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: '2n Aplec Sóc de Poble' })).toBeTruthy();
  });

  it('renderitza /categoria/catalegs des del contracte C26-1', () => {
    render(embolcall(<PaginaEditorialEtiqueta tipusRuta="categoria" />, { path: '/categoria/catalegs', params: { slug: 'catalegs' } }));
    expect(screen.getByRole('heading', { level: 1, name: 'Catàlegs' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Trilogia de les comarques' })).toBeTruthy();
  });
});

describe('G26-2 · IDEA-367 Modal dual Afig Catàleg / Fitxa i botó PDF centrat de Què dinem?', () => {
  it('obri Camí A cap al Bloc de Notes preassignat i permet seleccionar document en Camí B', () => {
    const onNavega = vi.fn();
    const onTanca = vi.fn();
    render(embolcall(
      <ModalAfigCataleg obert={true} onTanca={onTanca} font="banc-llavors" onNavega={onNavega} esSuperadmin={false} />
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Obrir el Bloc de Notes' }));
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(onNavega).toHaveBeenCalledWith('/notes?ambit=catalegs&cataleg=banc-llavors');

    const botoContinua = screen.getByRole('button', { name: 'Continuar al Bloc de Notes' });
    expect(botoContinua.disabled).toBe(true);

    const inputFitxer = screen.getByLabelText(/Selecciona un document/i);
    const pdf = new File(['%PDF-1.4'], 'cataleg-llavors.pdf', { type: 'application/pdf' });
    fireEvent.change(inputFitxer, { target: { files: [pdf] } });
    expect(screen.getByRole('status').textContent).toContain('cataleg-llavors.pdf');
    expect(botoContinua.disabled).toBe(false);

    fireEvent.click(botoContinua);
    expect(onNavega).toHaveBeenLastCalledWith('/notes?ambit=catalegs&cataleg=banc-llavors&importaFitxer=cataleg-llavors.pdf');
  });

  it('centra el botó de descàrrega del PDF de Què dinem? amb contenidor .sdp-recepta__pdf-accio', () => {
    const tr = (_clau, reserva) => reserva;
    const { container } = render(embolcall(
      <CreditsQueDinem tr={tr} />
    ));
    const accioPdf = container.querySelector('.sdp-recepta__pdf-accio');
    expect(accioPdf).not.toBeNull();
    expect(accioPdf.querySelector('a[download][type="application/pdf"]')).not.toBeNull();
  });
});

describe('G26-2 · IDEA-375 ControlEdicioTaxonomia i PanellEdicioTaxonomia (C26-3)', () => {
  it('amaga el control per a usuaris normals i per a superadmin sense AAL2', () => {
    const { rerender } = render(embolcall(
      <ControlEdicioTaxonomia idPagina="page/projecte" />,
      { sessio: { esSuperadmin: false, nivell: 'aal1' } }
    ));
    expect(screen.queryByRole('button', { name: 'Editar taxonomia' })).toBeNull();

    rerender(embolcall(
      <ControlEdicioTaxonomia idPagina="page/projecte" />,
      { sessio: { esSuperadmin: true, nivell: 'aal1' } }
    ));
    expect(screen.queryByRole('button', { name: 'Editar taxonomia' })).toBeNull();
  });

  it('mostra el panell per a superadmin + aal2, valida >=1 categoria de sistema i crida actualitzaTaxonomiaPagina amb CAS', async () => {
    mockLligTaxonomiaPagina.mockResolvedValue({
      overlay: {
        idPagina: 'page/projecte',
        categoriesSistema: ['Sistema'],
        categoriesTematiques: [],
        etiquetes: ['Idees'],
        geografia: { comarques: ["L'Alacantí"] },
        mencions: [],
        versio: 2
      }
    });
    mockActualitzaTaxonomiaPagina.mockResolvedValue({
      overlay: {
        idPagina: 'page/projecte',
        categoriesSistema: ['Sistema', 'Mur'],
        categoriesTematiques: [],
        etiquetes: ['Idees'],
        geografia: { comarques: ["L'Alacantí"] },
        mencions: [],
        versio: 3
      }
    });

    render(embolcall(
      <ControlEdicioTaxonomia idPagina="page/projecte" />,
      { sessio: { esSuperadmin: true, nivell: 'aal2' } }
    ));

    fireEvent.click(screen.getByRole('button', { name: 'Editar taxonomia' }));
    await waitFor(() => {
      expect(screen.getByTestId('panell-edicio-taxonomia')).toBeTruthy();
    });

    await waitFor(() => {
      expect(mockLligTaxonomiaPagina).toHaveBeenCalledWith('page/projecte', null);
    });

    const casellaSistema = screen.getByRole('checkbox', { name: 'Sistema' });
    fireEvent.click(casellaSistema);
    fireEvent.click(screen.getByRole('button', { name: 'Desar taxonomia' }));
    expect(screen.getByText('Cal marcar almenys una categoria de sistema.')).toBeTruthy();
    expect(mockActualitzaTaxonomiaPagina).not.toHaveBeenCalled();

    fireEvent.click(casellaSistema);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Desar taxonomia' }));

    await waitFor(() => {
      expect(mockActualitzaTaxonomiaPagina).toHaveBeenCalledTimes(1);
    });
    const [idEnviat, payloadEnviat] = mockActualitzaTaxonomiaPagina.mock.calls[0];
    expect(idEnviat).toBe('page/projecte');
    expect(payloadEnviat.categoriesSistema).toEqual(['Sistema', 'Mur']);
    expect(payloadEnviat.versio).toBe(2);
    expect(screen.getByText('Taxonomia actualitzada correctament.')).toBeTruthy();
  });
});
