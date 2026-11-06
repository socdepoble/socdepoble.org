/* Onada R9 (carril C5; IDEA-112, IDEA-113 i IDEA-115) · /page/banc-de-llavors, /page/rutes-de-poble i
   /page/arbres-monumentals amb el PAGE_COPY real i la maquinària de sempre (PageDetailSection → TextSection →
   UniversalPage): un sol H1, el text breu i, davall, la consulta carregada com a chunk lazy. Les xifres del text
   són les de les dades. Les altres pàgines no porten cap d'estes consultes. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
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

afterEach(cleanup);

const visita = (ruta) => render(
  <MemoryRouter rutaInicial={ruta}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
      <Route path="/" element={<p data-testid="inici">Inici</p>} />
    </Routes>
  </MemoryRouter>
);

const PAGINES = [
  ['banc-de-llavors', 'Banc de llavors', 'Consulta els tres catàlegs'],
  ['rutes-de-poble', 'Rutes de poble', 'Els itineraris de La Torre de les Maçanes'],
  ['arbres-monumentals', 'Arbres emblemàtics i monumentals', 'Els 19 arbres del catàleg']
];

describe('les tres pàgines de patrimoni de l’Onada R9', () => {
  for (const [clau, titol, consulta] of PAGINES) {
    test(`/page/${clau}: un sol H1, el text de PAGE_COPY i la consulta davall`, async () => {
      expect(PAGE_COPY[clau].title).toBe(titol);
      visita(`/page/${clau}`);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(titol);
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
    const arbres = PAGE_COPY['arbres-monumentals'];
    expect(arbres.subtitle).toContain(`Els ${ARBRES_MONUMENTALS_LA_TORRE.length} arbres`);
    expect(ARBRES_MONUMENTALS_LA_TORRE.filter((a) => a.monumental)).toHaveLength(2);
    expect(arbres.lead).toContain('10 d’abril de 2017');
    expect(arbres.html).toContain('no dona mesures');
    // R9V-C5-09 · el títol de la pàgina és el de la font: «Catàleg d’Arbres Emblemàtics i Monumentals …».
    expect(FONT_ARBRES_MONUMENTALS.titol).toContain('Arbres Emblemàtics i Monumentals');
    expect(FONT_ARBRES_MONUMENTALS.titol.toLowerCase()).toContain(arbres.title.toLowerCase());
    for (const [clau] of PAGINES) {
      expect(PAGE_COPY[clau].image, clau).toBeUndefined();
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
    visita('/page/herbari');
    await screen.findByText('117 / 117 fitxes');
    for (const [, , consulta] of PAGINES) expect(screen.queryByRole('region', { name: consulta })).toBeNull();
  });
});
