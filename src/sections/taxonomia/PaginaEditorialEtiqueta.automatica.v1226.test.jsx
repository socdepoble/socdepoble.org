/**
 * PaginaEditorialEtiqueta.automatica.v1226.test.jsx — D3 de la segona ronda de
 * correctors del Lot C1-3 (v1.2.26), IDEA-365 al Llibre Mestre (línia 3820:
 * «existir com a Categoria de Publicació ja crea automàticament la seua pàgina
 * viva»; línia 3825: les píndoles obrin «la pàgina automàtica d'eixa categoria»).
 *
 *   · Una etiqueta o categoria fora del catàleg editorial, amb publicacions que
 *     la porten, té pàgina automàtica: H1 amb el text de la primera coincidència,
 *     H2 i entradeta genèriques en la llengua de la interfície, cap àlies, cap
 *     ruta dedicada, fora de l'índex (useSEO index:false) i sense el panell
 *     d'edició IDEA-375, que no té cap editorial desat a editar.
 *   · Sense cap publicació coincident continua «Classificació no trobada».
 *   · Les pàgines del catàleg no canvien: indexables i amb el panell per a
 *     superadmin AAL2.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import {
  CoreContentContext,
  RouteParamsContext,
  SessionContext,
  UIActionsContext,
  UIContext
} from '../../app/contexts/objectesDeContext.js';
import { MurContext } from '../mur/objectesDeContext.js';
import { resolPaginaEditorialTaxonomia } from '../../data/taxonomia/taxonomiaCanonica.js';
import { DICCIONARIS_I18N_TAXONOMIA_V26 } from '../../data/taxonomia/i18nTaxonomiaV26.js';
import PaginaEditorialEtiqueta from './PaginaEditorialEtiqueta.jsx';
import { resetOverlaysTaxonomiaPerTests } from './useTaxonomiaPaginaOverlay.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
import { propsDeTargetaDeProducte } from '../mercat/targetaDeProducte.js';

const mockUseSEO = vi.fn();

vi.mock('../../hooks/useSEO.js', async (importOriginal) => ({
  ...(await importOriginal()),
  useSEO: (opcions) => mockUseSEO(opcions)
}));

vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  lligTaxonomiaPagina: () => Promise.resolve(null),
  teCapacitat: () => false
}));

const PUBLICACIONS = [
  {
    id: 'oli-1l',
    slug: 'oli-de-la-torre-1-litre',
    title: 'Oli de La Torre · 1 litre',
    type: 'post',
    labels: [
      { text: 'Mur', className: 'sdp-badge-system' },
      { text: 'Oli verge', className: 'sdp-badge-tag' }
    ]
  },
  {
    id: 'oli-5l',
    slug: 'oli-de-la-torre-5-litres',
    title: 'Oli de La Torre · 5 litres',
    type: 'post',
    tags: ['oli verge']
  },
  {
    id: 'aplec-2',
    slug: '2n-aplec-soc-de-poble',
    title: '2n Aplec Sóc de Poble',
    type: 'post',
    labels: [
      { text: 'Mur', className: 'sdp-badge-system' },
      { text: 'Idees', className: 'sdp-badge-tag' }
    ]
  }
];

const ACTES = [
  {
    id: 'assemblea-coop',
    slug: 'assemblea-de-la-cooperativa',
    title: 'Assemblea de la cooperativa',
    type: 'event',
    categoriesSistema: ['Calendari', 'Cooperatives']
  }
];

function embolcall(ui, { path = '/', params = {}, sessio = null, idioma = 'ca', marketItems = [], pageCopy = null } = {}) {
  const estatSessio = sessio ?? { esSuperadmin: false, nivell: 'anonim' };
  const uiState = { language: idioma, externalConfig: null };
  const uiActions = { language: idioma, t: (_clau, reserva) => reserva ?? _clau, resolveAsset: (v) => v };
  return (
    <UIContext.Provider value={uiState}>
      <UIActionsContext.Provider value={uiActions}>
        <SessionContext.Provider value={estatSessio}>
          <CoreContentContext.Provider value={{ towns: [], personalitzacio: null, pageCopy }}>
            <MurContext.Provider value={{ feedPosts: PUBLICACIONS, events: ACTES, marketItems }}>
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

const SUPERADMIN_AAL2 = { esSuperadmin: true, nivell: 'aal2' };
const darreraCridaSEO = () => mockUseSEO.mock.calls.at(-1)?.[0];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  resetOverlaysTaxonomiaPerTests();
});

describe('D3 · pàgina automàtica d’una classificació fora del catàleg (IDEA-365, línia 3820)', () => {
  it('les classificacions de la prova no són del catàleg editorial', () => {
    for (const ruta of ['/etiqueta/oli-verge', 'oli-verge', '/categoria/cooperatives', 'cooperatives', '/etiqueta/sense-cap-targeta', 'sense-cap-targeta']) {
      expect(resolPaginaEditorialTaxonomia(ruta), ruta).toBeNull();
    }
  });

  it('/etiqueta/oli-verge: H1 de la primera etiqueta coincident, H2 i entradeta genèriques i les targetes que la porten', () => {
    const { container } = render(embolcall(
      <PaginaEditorialEtiqueta tipusRuta="etiqueta" />,
      { path: '/etiqueta/oli-verge', params: { slug: 'oli-verge' }, sessio: SUPERADMIN_AAL2 }
    ));
    const tx = DICCIONARIS_I18N_TAXONOMIA_V26.ca;
    expect(screen.getByRole('heading', { level: 1, name: 'Oli verge' })).toBeTruthy();
    expect(screen.getByText(tx.taxonomiaV26EditorialAutomaticaSubtitol)).toBeTruthy();
    expect(container.textContent).toContain('Pàgina automàtica amb les publicacions que porten «Oli verge».');
    expect(screen.getByRole('heading', { level: 4, name: 'Oli de La Torre · 1 litre' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Oli de La Torre · 5 litres' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 4, name: '2n Aplec Sóc de Poble' })).toBeNull();
    expect(container.querySelector('.sdp-taxonomia-alies')).toBeNull();
    expect(screen.queryByRole('link', { name: tx.taxonomiaV26EditorialRutaDedicada })).toBeNull();
    expect(screen.queryByRole('button', { name: tx.taxonomiaV26EditorBotoObrir })).toBeNull();
    expect(darreraCridaSEO()).toMatchObject({ index: false, title: `Oli verge · ${tx.taxonomiaV26EditorialAutomaticaSubtitol}` });
  });

  it('la capçalera de cada targeta ve de la font editorial: sense data, el marcador honest, mai una data inventada', () => {
    const { container } = render(embolcall(
      <PaginaEditorialEtiqueta tipusRuta="etiqueta" />,
      { path: '/etiqueta/oli-verge', params: { slug: 'oli-verge' } }
    ));
    expect(container.textContent).toContain('Data no indicada');
    expect(container.querySelector('.sp-card time[datetime]')).toBeNull();
  });

  it('/categoria/cooperatives: la categoria de sistema d’un acte també crea la pàgina, en la llengua de la interfície', () => {
    render(embolcall(
      <PaginaEditorialEtiqueta tipusRuta="categoria" />,
      { path: '/categoria/cooperatives', params: { slug: 'cooperatives' }, idioma: 'en' }
    ));
    expect(screen.getByRole('heading', { level: 1, name: 'Cooperatives' })).toBeTruthy();
    expect(screen.getByText(DICCIONARIS_I18N_TAXONOMIA_V26.en.taxonomiaV26EditorialAutomaticaSubtitol)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: 'Assemblea de la cooperativa' })).toBeTruthy();
    expect(darreraCridaSEO()?.index).toBe(false);
  });

  it('/etiqueta/sense-cap-targeta: sense cap publicació coincident continua «Classificació no trobada»', () => {
    const tx = DICCIONARIS_I18N_TAXONOMIA_V26.ca;
    render(embolcall(
      <PaginaEditorialEtiqueta tipusRuta="etiqueta" />,
      { path: '/etiqueta/sense-cap-targeta', params: { slug: 'sense-cap-targeta' } }
    ));
    expect(screen.getByRole('heading', { level: 1, name: tx.taxonomiaV26EditorialNoTrobada })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
    expect(darreraCridaSEO()).toMatchObject({ index: false, title: tx.taxonomiaV26EditorialNoTrobada });
  });

  /* Integrador C1-3 (verificador R2-3/R2-4, P1) · Els productes porten la classificació a
     category_slug i tag, sense labels: les seues píndoles no poden portar a «no trobada». */
  it.each([
    ['ca', 'categoria', 'roba', 'Roba'],
    ['es', 'categoria', 'roba', 'Ropa'],
    ['ca', 'etiqueta', 'samarreta', 'Samarreta'],
    ['en', 'etiqueta', 'samarreta', 'T-shirt'],
    ['ca', 'categoria', 'tecnologia', 'Tecnologia'],
    ['ca', 'etiqueta', 'ordinador', 'Ordinador']
  ])('[%s] /%s/%s d’un producte del Mercat: pàgina automàtica «%s» amb la card del producte', (idioma, tipus, slug, h1) => {
    const producte = MARKET_ITEMS.find((item) => item.category_slug === slug || item.tag === slug);
    expect(producte, slug).toBeTruthy();
    render(embolcall(
      <PaginaEditorialEtiqueta tipusRuta={tipus} />,
      { path: `/${tipus}/${slug}`, params: { slug }, idioma, marketItems: MARKET_ITEMS }
    ));
    expect(screen.getByRole('heading', { level: 1, name: h1 })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 4, name: producte.title })).toBeTruthy();
    expect(darreraCridaSEO()?.index).toBe(false);
  });

  it('cada píndola d’un producte del Mercat porta a una pàgina que el llista, mai a «no trobada»', () => {
    const tx = DICCIONARIS_I18N_TAXONOMIA_V26.ca;
    const rutes = MARKET_ITEMS.flatMap((item) => (propsDeTargetaDeProducte(item, undefined, { idioma: 'ca' })?.labels ?? [])
      .map((label) => [item, rutaDePindola(label)]))
      .filter(([, ruta]) => typeof ruta === 'string' && /^\/(categoria|etiqueta)\//.test(ruta));
    expect(rutes.length).toBeGreaterThan(0);
    for (const [item, ruta] of rutes) {
      const [, tipus, slug] = ruta.split('/');
      cleanup();
      render(embolcall(<PaginaEditorialEtiqueta tipusRuta={tipus} />, { path: ruta, params: { slug }, marketItems: MARKET_ITEMS }));
      expect([ruta, screen.queryByRole('heading', { level: 1, name: tx.taxonomiaV26EditorialNoTrobada })]).toEqual([ruta, null]);
      expect([ruta, Boolean(screen.queryByRole('heading', { level: 4, name: item.title }))]).toEqual([ruta, true]);
    }
  });

  /* Integrador C1-3 (verificador R2-3/R2-4, P4) · IDEA-365, línia 3820: la pàgina mostra totes
     les cards categoritzades així, també les biblioteques i «Què dinem?» que es pinten al /mur. */
  it('/categoria/catalegs llista les cards de catàleg del /mur, cadascuna cap a la seua pàgina', () => {
    const esperades = targetesDeSistema(PAGE_COPY, { language: 'ca' })
      .filter((card) => Array.isArray(card.categoriesSistema) && card.categoriesSistema.includes('Catàlegs'));
    expect(esperades.length).toBeGreaterThan(0);
    const { container } = render(embolcall(
      <PaginaEditorialEtiqueta tipusRuta="categoria" />,
      { path: '/categoria/catalegs', params: { slug: 'catalegs' }, pageCopy: PAGE_COPY }
    ));
    for (const card of esperades) {
      expect([card.id, Boolean(screen.queryByRole('heading', { level: 4, name: card.title }))]).toEqual([card.id, true]);
      expect([card.id, Boolean(container.querySelector(`a[href="${card.mainHref}"]`))]).toEqual([card.id, true]);
    }
  });

  it('una pàgina del catàleg (/etiqueta/idees) continua indexable i amb el panell IDEA-375 per a superadmin AAL2', () => {
    const tx = DICCIONARIS_I18N_TAXONOMIA_V26.ca;
    render(embolcall(
      <PaginaEditorialEtiqueta tipusRuta="etiqueta" />,
      { path: '/etiqueta/idees', params: { slug: 'idees' }, sessio: SUPERADMIN_AAL2 }
    ));
    expect(screen.getByRole('heading', { level: 1, name: 'Idees' })).toBeTruthy();
    expect(screen.queryByText(tx.taxonomiaV26EditorialAutomaticaSubtitol)).toBeNull();
    expect(screen.getByRole('button', { name: tx.taxonomiaV26EditorBotoObrir })).toBeTruthy();
    expect(darreraCridaSEO()?.index).toBe(true);
  });
});
