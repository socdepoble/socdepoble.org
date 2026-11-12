import { targetesDeSistema } from '../mur/targetesMur.js';
/* Onada R9 (carril C5; IDEA-112, IDEA-113 i IDEA-115) · /page/banc-de-llavors, /page/rutes-de-poble i
   /page/arbres-monumentals amb el PAGE_COPY real i la maquinària de sempre (PageDetailSection → TextSection →
   UniversalPage): un sol H1, el text breu i, davall, la consulta carregada com a chunk lazy. Les xifres del text
   són les de les dades. R18 mostra primer la presentació i la llibreria d'arbres; el catàleg s'obri en triar
   el llibre del poble. Les altres pàgines no porten cap d'estes consultes. */
import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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
import { localitzaPagina } from '../text/pageContent.r10.js';
import { ESPECIES_ATLES_CATALUNYA, VARIETATS_AVL_MALLORCA, VARIETATS_CATALEG_VALENCIA } from '../../data/patrimoni/bancLlavors.js';
import { RUTES_LA_TORRE } from '../../data/patrimoni/rutesDePoble.js';
import { ARBRES_MONUMENTALS_LA_TORRE, FONT_ARBRES_MONUMENTALS } from '../../data/patrimoni/arbresMonumentals.js';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { DRETS_CATALEG_ARBRES } from '../text/pageContent.dretsPatrimoni.js';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { LLIBRES_ARBRES_MONUMENTALS } from '../../data/patrimoni/llibresArbresMonumentals.js';

beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400); });
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

const PAGINES = [
  ['banc-de-llavors', 'Banc de llavors', 'Consulta els tres catàlegs'],
  ['rutes-de-poble', 'Rutes de poble', 'Els itineraris de La Torre de les Maçanes'],
  ['arbres-monumentals', 'Arbres emblemàtics i monumentals', 'Catàlegs']
];

describe('les tres pàgines de patrimoni de l’Onada R9', () => {
  for (const [clau, titol, consulta] of PAGINES) {
    test(`/page/${clau}: un sol H1, el text de PAGE_COPY i la consulta davall`, async () => {
      expect(PAGE_COPY[clau].title).toBe(titol);
      visita(`/page/${clau}`);
      await screen.findByRole('heading', { level: 1 }, { timeout: 5000 });
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(titol);
      if (clau === 'banc-de-llavors') {
        expect(document.querySelector('.sdp-workspace').closest('.cms-preview')).toBeNull();
        expect(document.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')).toHaveLength(125);
        expect(document.getElementById('app-grid-main').textContent).toContain('Discrepància');
        return;
      }
      if (clau === 'arbres-monumentals') {
        expect(PAGE_COPY[clau].copyright).toBe(COPYRIGHT_SDP);
        expect(screen.getByRole('link', { name: COPYRIGHT_SDP })).toBeTruthy();
        expect(screen.getByRole('complementary', { name: consulta })).toBeTruthy();
        const llista = within(document.getElementById('app-grid-list'));
        expect(llista.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
        const presentacio = new DOMParser().parseFromString(PAGE_COPY[clau].html, 'text/html').body.textContent;
        const normalitza = text => text.replace(/\s+/g, ' ').trim();
        expect(normalitza(document.querySelector('.cms-preview').textContent)).toContain(normalitza(presentacio));
        const llibre = LLIBRES_ARBRES_MONUMENTALS[0];
        fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${llibre.etiquetaNavegacio}`) }));
        await screen.findByRole('heading', { name: FONT_ARBRES_MONUMENTALS.titol, level: 1 });
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        expect([...document.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')]).toHaveLength(ARBRES_MONUMENTALS_2020.length);
        expect([...document.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')][0].querySelector('.sdp-gestor-fitxa__titol').textContent).toBe(`#1 · ${ARBRES_MONUMENTALS_2020[0].nom}`);
        for (const arbre of ARBRES_MONUMENTALS_2020) {
          expect(llista.getByRole('button', { name: `#${arbre.ordre} · ${arbre.nom}`, exact: true })).toBeTruthy();
        }
        const cos = document.querySelector('.cms-preview');
        expect(cos.textContent).toContain('WP #619');
        expect(cos.querySelector(`a[href="${FONT_ARBRES_MONUMENTALS.enllac}"]`)).toBeTruthy();
        fireEvent.click(llista.getByRole('button', { name: `#1 · ${ARBRES_MONUMENTALS_2020[0].nom}` }));
        expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
        expect(screen.getByRole('heading', { name: `#1 · ${ARBRES_MONUMENTALS_2020[0].nom}`, level: 1 })).toBeTruthy();
        expect(screen.getByRole('link', { name: DRETS_CATALEG_ARBRES })).toBeTruthy();
        expect(document.body.textContent).not.toMatch(/mas[ií]a/i);
        return;
      }
      const seccio = await screen.findByRole('region', { name: consulta });
      const cos = document.querySelector('.cms-preview');
      expect(cos.compareDocumentPosition(seccio) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(document.body.textContent).not.toMatch(/mas[ií]a/i);
    });
  }

  test('les xifres del text breu són les de les dades', () => {
    const banc = PAGE_COPY['banc-de-llavors'];
    expect(banc.lead).toContain(`${VARIETATS_CATALEG_VALENCIA.length} varietats del Catàleg valencià`);
    expect(banc.lead).toContain(`${VARIETATS_AVL_MALLORCA.length} del Catàleg de llavors 2020 de l’Associació de Varietats Locals de Mallorca`);
    expect(banc.lead).toContain(`${ESPECIES_ATLES_CATALUNYA.length} fitxes d’espècie de l’Atles de la Fundació Miquel Agustí`);
    expect(banc.html).toContain('no s’intercanvien llavors');
    const rutes = PAGE_COPY['rutes-de-poble'];
    const km = RUTES_LA_TORRE.rutes.map((r) => r.distancia);
    expect(rutes.subtitle).toBe(`Els ${RUTES_LA_TORRE.rutes.length} itineraris de La Torre de les Maçanes, d’${km[0].replace(' km', '')} a ${km.at(-1)}`);
    expect(rutes.lead).toContain('revisió del 28 d’abril de 2021');
    expect(PAGE_COPY['arbres-monumentals'].lead).toContain(`${ARBRES_MONUMENTALS_2020.length} registres d’arbres i conjunts arboris`);
    expect(ARBRES_MONUMENTALS_LA_TORRE).toHaveLength(19);
    expect(ARBRES_MONUMENTALS_2020.map(arbre => arbre.id)).toEqual(ARBRES_MONUMENTALS_LA_TORRE.map(arbre => arbre.id));
    expect(ARBRES_MONUMENTALS_LA_TORRE.filter((a) => a.monumental)).toHaveLength(2);
    expect(FONT_ARBRES_MONUMENTALS.data.slice(0, 10)).toBe('2017-04-10');
    expect(ARBRES_MONUMENTALS_LA_TORRE.every(arbre => Object.keys(arbre).every(camp =>
      ['ordre', 'id', 'nom', 'monumental', 'enllac', 'liniaText'].includes(camp)))).toBe(true);
    // R9V-C5-09 · el títol de la pàgina és el de la font: «Catàleg d’Arbres Emblemàtics i Monumentals …».
    expect(FONT_ARBRES_MONUMENTALS.titol).toContain('Arbres Emblemàtics i Monumentals');
    expect(FONT_ARBRES_MONUMENTALS.titol.toLowerCase()).toContain(PAGE_COPY['arbres-monumentals'].title.toLowerCase());
    /* 9c1e6e333 (261107_0455) · Cada pàgina porta la seua portada Ibáñez a
       `image`; el cos continua sense cap imatge, marc ni estil en línia. */
    for (const [clau] of PAGINES) {
      expect(PAGE_COPY[clau].image, clau).toBe(`/assets/uploads/patrimoni/${clau}-ibanez.webp`);
      expect(PAGE_COPY[clau].imageAlt, clau).toMatch(/Ibáñez/);
      expect(PAGE_COPY[clau].html, clau).not.toMatch(/<img\b|<iframe\b|style=/i);
    }
  });

  test('cada pàgina té les 4 traduccions, amb els mateixos enllaços que el valencià', () => {
    for (const [clau] of PAGINES) {
      const pagina = PAGE_COPY[clau];
      const enllacos = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      for (const llengua of ['es', 'en', 'eu', 'gl']) {
        const t = localitzaPagina(pagina, llengua);
        expect(t.contentLanguage, `${clau} ${llengua}`).toBe(llengua);
        for (const camp of ['title', 'subtitle', 'lead', 'html']) expect(t[camp], `${clau} ${llengua} ${camp}`).not.toBe(pagina[camp]);
        expect(enllacos(t.html), `${clau} ${llengua}`).toEqual(enllacos(pagina.html));
      }
      expect(localitzaPagina(pagina, 'ca')).toBe(pagina);
    }
  });

  test('les altres pàgines no porten cap d’estes consultes', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    visita('/page/herbari');
    await screen.findByRole('button', { name: 'Acacia robínia', exact: true });
    for (const [, , consulta] of PAGINES) {
      expect(screen.queryByRole('region', { name: consulta })).toBeNull();
      expect(screen.queryByRole('complementary', { name: consulta })).toBeNull();
    }
  });
});


test('P115 · la targeta del Mur conserva la signatura i els drets de la pàgina marc', () => {
  const targeta = targetesDeSistema(PAGE_COPY, { nativa: false }).find(item => item.id === 'arbres-monumentals');
  expect(targeta).toBeTruthy();
  expect(targeta.copyright).toBe(COPYRIGHT_SDP);
  expect(targeta.mainHref).toBe('/page/arbres-monumentals');
});
