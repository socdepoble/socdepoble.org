/**
 * v1.2.26 · Lot C1-3, paquet D2 · Les cards de pàgina que el Mur barreja (targetesDeSistema), creuades amb les
 * Categories de Sistema d'IDEA-365..367:
 *  · C26-2 #8 · Totes les cards que es mostren al /mur porten la categoria Mur (Llibre Mestre, línia 3803; regla 1
 *    del 21:40), en les 5 llengües i amb les mateixes etiquetes que la seua UniversalPage (21:58, punt 1).
 *  · C26-2 #5 · Les 5 biblioteques i «Què dinem?» són FORA Sistema (22:16, punt 3): ni `isSystem` ni la pestanya
 *    «Sóc de Poble» del /mur; continuen a «Mostrar tot».
 *  · C26-2 #4 · La card de «Què dinem?» porta l'autoria, la llicència i la portada del llibre i obri el seu lector; no
 *    hi ha cap /page/que-dinem pública.
 */
import React from 'react';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), core: {}, mur: {}, params: new URLSearchParams() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params, vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(), useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));

import MurSection from './MurSection.jsx';
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { PAGINES_PATRIMONI_MUR, esDeLaPestanyaSistema, esTargetaDelMur, targetesDeSistema } from './targetesMur.js';
import { LA_VEU_DE_SOC_DE_POBLE_POST } from './articles/laVeuDeSocDePobleContent.js';
import { COPIES_SEGURETAT_SOC_DE_POBLE_POST } from './articles/copiesSeguretatSocDePobleContent.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST } from './articles/novesTecnologiesCulturaRuralContent.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { localitzaPagina } from '../text/pageContent.r10.js';
import { OBRA_TARGETA_QUE_DINEM } from '../text/pageContent.catalegsV1226.js';
import { DRETS_QUE_DINEM } from '../text/pageContent.dretsPatrimoni.js';
import { OBRA_QUE_DINEM } from '../../data/patrimoni/queDinem.js';
import { PORTADA_LLIBRE_QUE_DINEM } from '../patrimoni/ReceptesWorkspaceSection.jsx';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { resolvePageSlugPath } from '../../config/navigation.js';
import { IDIOMES_TAXONOMIA, nomEstructural } from '../../data/taxonomia/taxonomiaCanonica.js';
import { categoriesSistemaDePagina } from '../../data/taxonomia/classificacioPaginesPubliques.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, aliesDeLActor } from '../../data/identitatsSeed.js';
import { pertanyALActor } from '../notes/pertinencaDeLActor.js';

const CLAUS_PATRIMONI = PAGINES_PATRIMONI_MUR.map((pagina) => pagina.key);
const textos = (labels) => labels.map((label) => label.text);

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = new URLSearchParams();
  mocks.mur = { status: 'ready', error: null, sortedFeedPosts: [], sortedMarketItems: [], sortedEvents: [] };
  mocks.core = { status: 'ready', error: null, sortedTowns: [], pageCopy: PAGE_COPY };
});

describe('C26-2 #8 · Mur a totes les cards del /mur', () => {
  test.each(IDIOMES_TAXONOMIA)('%s · cada card porta Mur a categoriesSistema i a les etiquetes, com la seua pàgina', (language) => {
    const cards = targetesDeSistema(PAGE_COPY, { nativa: false, language });
    expect(cards.map((card) => card.id)).toEqual([...SYSTEM_PAGES.map((p) => p.key).filter(esTargetaDelMur), ...CLAUS_PATRIMONI]);
    for (const card of cards) {
      expect([card.id, card.categoriesSistema.includes('Mur')]).toEqual([card.id, true]);
      expect(card.categoriesSistema).toEqual(categoriesSistemaDePagina(card.id));
      const sistema = card.labels.filter((label) => label.className === 'sdp-badge-system' && !/^v\d/.test(label.text));
      expect([card.id, textos(sistema)]).toEqual([card.id, card.categoriesSistema.map((nom) => nomEstructural(nom, language))]);
      // IDEA-365 (21:58, punt 1) · Paritat Card ↔ UniversalPage: les mateixes etiquetes.
      if (Object.hasOwn(PAGE_COPY, card.id)) expect([card.id, card.labels]).toEqual([card.id, localitzaPagina(PAGE_COPY[card.id], language).labels]);
    }
  });

  test('les pàgines que no són del Mur només porten Sistema (notes_shared: cap Mur per llevar)', () => {
    for (const clau of ['notes_shared', 'anima', 'fedivers', 'node-zero', 'dispositius', 'tot-el-que-pots-fer', 'anatomia-rural']) {
      expect([clau, categoriesSistemaDePagina(clau)]).toEqual([clau, ['Sistema']]);
    }
  });
});

describe('C26-2 #5 · biblioteques i «Què dinem?» FORA Sistema', () => {
  test('type i categoriesSistema sense Sistema; isSystem diu de qui és: Sóc de Poble, menys el llibre de l’associació', () => {
    const cards = targetesDeSistema(PAGE_COPY, { nativa: false });
    for (const card of cards) {
      const esPatrimoni = CLAUS_PATRIMONI.includes(card.id);
      expect([card.id, card.type, card.categoriesSistema.includes('Sistema'), esDeLaPestanyaSistema(card)]).toEqual([card.id, esPatrimoni ? 'cataleg' : 'sistema', !esPatrimoni, !esPatrimoni]);
      expect([card.id, card.isSystem]).toEqual([card.id, card.id !== 'que-dinem']);
    }
  });

  test('la pestanya és la categoria Sistema, només per a peces de Sóc de Poble (cap veí s’hi cola posant-se «Sistema»)', () => {
    expect(esDeLaPestanyaSistema(LA_VEU_DE_SOC_DE_POBLE_POST)).toBe(true);
    expect(esDeLaPestanyaSistema(COPIES_SEGURETAT_SOC_DE_POBLE_POST)).toBe(true);
    // IDEA-365 (22:16, punt 2) · El Pou de Neu és publicació normal: Mur, sense Sistema.
    expect(esDeLaPestanyaSistema(NOVES_TECNOLOGIES_CULTURA_RURAL_POST)).toBe(false);
    expect(esDeLaPestanyaSistema({ id: 'p1', title: 'Veí', categoriesSistema: ['Sistema', 'Mur'], ownerUserId: 'u-1' })).toBe(false);
    expect(esDeLaPestanyaSistema({ id: 'p2', title: 'Veí', categoriesSistema: ['Mur'], author_org_id: ENTITAT_PILOT_ID })).toBe(false);
    expect(esDeLaPestanyaSistema({ id: 'p3', title: 'Sóc de Poble', categoriesSistema: ['Sistema', 'Mur'], author_org_id: ENTITAT_PILOT_ID })).toBe(true);
    // Sense categories declarades, la regla de sempre.
    expect(esDeLaPestanyaSistema({ id: 'p4', author: { nom: 'Sóc de Poble' } })).toBe(true);
    expect(esDeLaPestanyaSistema({ id: 'p5', author: { nom: 'Una veïna' } })).toBe(false);
  });

  test('la pestanya «Sóc de Poble» (?filtre=sistema) no conté cap clau de PAGINES_PATRIMONI_MUR; «Mostrar tot», sí', () => {
    mocks.params = new URLSearchParams({ filtre: 'sistema' });
    const { container, unmount } = render(<MurSection />);
    const hrefs = () => [...container.querySelectorAll('article.sp-card a.sp-card-link-overlay')].map((a) => a.getAttribute('href'));
    const deSistema = SYSTEM_PAGES.filter((p) => esTargetaDelMur(p.key)).map((p) => p.href);
    expect(hrefs()).toEqual(expect.arrayContaining(deSistema));
    for (const { href } of PAGINES_PATRIMONI_MUR) expect(hrefs()).not.toContain(href);
    unmount();
    mocks.params = new URLSearchParams();
    const tot = render(<MurSection />);
    const hrefsTot = [...tot.container.querySelectorAll('article.sp-card a.sp-card-link-overlay')].map((a) => a.getAttribute('href'));
    for (const { href } of PAGINES_PATRIMONI_MUR) expect(hrefsTot).toContain(href);
  });

  /* P0-115 (Llei d'Autoria de Dos Nivells) i IDEA-368 («Publicacions pròpies»: el que signa l'entitat) · Les 5
     biblioteques les signa Sóc de Poble i continuen al Mur de l'entitat; el llibre «Què dinem?» el signa l'associació. */
  test('el Mur de l’entitat Sóc de Poble: les seues pàgines i biblioteques, no el llibre de l’associació', () => {
    const cards = targetesDeSistema(PAGE_COPY, { nativa: false });
    for (const alies of [aliesDeLActor({ tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG }, { dataMode: 'seed' }), aliesDeLActor({ tipus: 'entitat', id: 'uuid-org', slug: ENTITAT_PILOT_SLUG })]) {
      expect(cards.filter((card) => pertanyALActor(card, alies)).map((card) => card.id)).toEqual(cards.filter((card) => card.id !== 'que-dinem').map((card) => card.id));
    }
  });
});

describe('C26-2 #4 · la card de «Què dinem?»', () => {
  const card = (language = 'ca') => targetesDeSistema(PAGE_COPY, { nativa: false, language }).find((c) => c.id === 'que-dinem');

  test('autoria, lloc, any, llicència i portada del llibre; obri el lector del llibre', () => {
    expect(OBRA_TARGETA_QUE_DINEM).toMatchObject({ titol: OBRA_QUE_DINEM.titol, associacio: OBRA_QUE_DINEM.associacio, lloc: OBRA_QUE_DINEM.lloc, any: OBRA_QUE_DINEM.any, portada: PORTADA_LLIBRE_QUE_DINEM });
    expect(card()).toMatchObject({
      title: OBRA_QUE_DINEM.titol,
      author_name: OBRA_QUE_DINEM.associacio,
      author_location: OBRA_QUE_DINEM.lloc,
      copyright: DRETS_QUE_DINEM,
      image: PORTADA_LLIBRE_QUE_DINEM,
      mainHref: '/page/receptes/que-dinem',
      created_at: PAGE_COPY.receptes.date,
      isSystem: false
    });
    expect(card().subtitle).toContain(String(OBRA_QUE_DINEM.any));
    expect(card().lead).toContain(OBRA_QUE_DINEM.associacio);
    expect(card().copyright).not.toContain('IAIA');
  });

  test.each(IDIOMES_TAXONOMIA)('%s · Mur + Catàlegs + PDF i textos propis en la llengua', (language) => {
    expect(textos(card(language).labels)).toEqual(['Mur', 'Catàlegs', 'PDF'].map((nom) => nomEstructural(nom, language)));
    if (language !== 'ca') {
      const traduccio = card().translations[language];
      expect(traduccio).toMatchObject({ title: OBRA_QUE_DINEM.titol, contentLanguage: language });
      for (const camp of ['subtitle', 'lead', 'imageAlt']) expect([language, camp, traduccio[camp] !== card()[camp] && traduccio[camp].length > 10]).toEqual([language, camp, true]);
    }
  });

  /* C26-2 #4 · P1 confirmat (Gauntlet c13) · La card pintada: la signa l'associació (P0-115, Llei d'Autoria de
     Dos Nivells), sense el logotip de Sóc de Poble a l'avatar (la silueta), i és la pàgina del seu lector:
     Connectar porta /page/receptes/que-dinem com a pàgina, no una publicació /mur/que-dinem que no existix. */
  test('la card pintada: silueta en lloc del logotip, i Connectar porta la pàgina del lector', () => {
    const { container } = render(<TargetaDelMur item={card()} />);
    const article = container.querySelector('article.sp-card');
    expect(within(article).getByText(OBRA_QUE_DINEM.associacio)).toBeTruthy();
    expect(article.querySelector('.sp-card-avatar--fallback')).toBeTruthy();
    expect(article.querySelector('img.sp-card-avatar')).toBeNull();
    expect([...article.querySelectorAll('img')].map((img) => img.getAttribute('src'))).not.toContain(DEFAULT_AUTHOR.avatarUrl);
    expect(article.querySelector('a.sp-card-link-overlay').getAttribute('href')).toBe('/page/receptes/que-dinem');
    fireEvent.click(within(article).getByRole('button', { name: `Connectar amb ${OBRA_QUE_DINEM.titol}` }));
    const desti = new URL(mocks.navigate.mock.calls.at(-1)[0], 'https://poble.invalid');
    expect(desti.pathname).toBe('/connectar');
    expect(desti.searchParams.get('ruta')).toBe('/page/receptes/que-dinem');
    expect(desti.searchParams.get('objecte')).toBe('pagina');
    expect(desti.searchParams.get('item_id')).toBe('que-dinem');
    expect(desti.searchParams.has('sectionId')).toBe(false);
  });

  test('cap pàgina pública duplicada: no és de PAGE_COPY ni cap àlies', () => {
    expect(Object.hasOwn(PAGE_COPY, 'que-dinem')).toBe(false);
    expect(resolvePageSlugPath('que-dinem')).toBeNull();
    expect(card()).toBeDefined();
  });
});
