/**
 * Ordre del Mestre (261007) · El Mur i les targetes que signa Sóc de Poble:
 *  · la targeta d'«El Xat» hi ix (SYSTEM_PAGES) amb el gran botó «Anar al
 *    xat» en lloc de les etiquetes;
 *  · «Comentaris = xat» · el Comentar de TOTES les targetes és el menú de dues
 *    vies, també el de les de sistema: cap gestor de llista. La via privada
 *    llig el xat de Sóc de Poble que l'app resol UNA vegada (el proveïdor de
 *    xatCorporatiu.js; ací, el seu context amb un valor fix): el Mur no en
 *    resol cap, ni per llista ni per targeta.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), core: {}, mur: {}, params: new URLSearchParams() }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));

import MurSection from './MurSection.jsx';
import { PAGE_COPY } from '../text/pageContent.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { TEXTOS_COMENTAR } from '../../components/universal/barres/BarraBlava.jsx';
import { XatSocDePobleContext } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import fontMur from './MurSection.jsx?raw';
import fontTargeta from './TargetaDelMur.jsx?raw';

const ambPagines = (claus) => ({
  status: 'ready', error: null, sortedTowns: [],
  pageCopy: Object.fromEntries(claus.map((clau) => [clau, PAGE_COPY[clau]]))
});
const REMOT = Object.freeze({ estat: 'remot', href: '/xat?amb=7d1f4c2e-9a3b-4c5d-8e6f-0a1b2c3d4e5f', avis: null });
const PRIVAT = TEXTOS_COMENTAR.privat[1];
const PUBLIC = TEXTOS_COMENTAR.public[1];
const comenta = (titol, via) => {
  fireEvent.click(screen.getByRole('button', { name: `Comentar ${titol}` }));
  fireEvent.click(screen.getByRole('menuitem', { name: via }));
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.params = new URLSearchParams();
  mocks.mur = { status: 'ready', error: null, sortedFeedPosts: [], sortedMarketItems: [], sortedEvents: [] };
});

test('261007 · la targeta d’El Xat ix al Mur amb «Anar al xat» en lloc de les etiquetes', () => {
  mocks.core = ambPagines(['xat']);
  const { container } = render(<MurSection />);
  const boto = screen.getByRole('link', { name: 'Anar al xat' });
  expect(boto.getAttribute('href')).toBe('/xat');
  const targeta = boto.closest('article');
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('El Xat');
  expect(targeta.querySelector('ul.sp-card-labels')).toBeNull();
  expect(targeta.querySelector('a.sp-card-link-overlay').getAttribute('href')).toBe('/page/xat');
  expect(container.querySelectorAll('article.sp-card')).toHaveLength(1);
});

test('261007 · totes les targetes de sistema, el mateix menú; la via privada, el xat resolt per l’app', () => {
  const totes = SYSTEM_PAGES.map((pagina) => pagina.key);
  mocks.core = ambPagines(totes);
  const { container } = render(
    <XatSocDePobleContext.Provider value={REMOT}>
      <MurSection />
    </XatSocDePobleContext.Provider>
  );
  expect(container.querySelectorAll('article.sp-card')).toHaveLength(totes.length);
  for (const boto of container.querySelectorAll('.sp-card-footer button[aria-label^="Comentar "]')) {
    expect([boto.getAttribute('aria-label'), boto.getAttribute('aria-haspopup')]).toEqual([boto.getAttribute('aria-label'), 'menu']);
  }
  comenta('El Xat', PRIVAT);
  comenta('Constitució', PRIVAT);
  expect(mocks.navigate.mock.calls).toEqual([[REMOT.href], [REMOT.href]]);
  comenta('Constitució', PUBLIC);
  expect(mocks.navigate).toHaveBeenLastCalledWith(expect.stringContaining('/xat?sobre=pagina:%2Fconstitucio&'));
});

/* Onada 10 (261010; revisió de l'Onada) · La Consola i el Cervell porten
   «Sistema» com a Categoria perquè el filtre ?category= del Mur compara el
   TEXT de les etiquetes (MurSection.jsx · perCategoria), sense mirar ni la
   classe ni la posició, i sense distingir majúscules. Ací es munta el Mur amb
   el paràmetre de veres: fins ara cap prova passava pel filtre. */
test('Onada 10 · ?category= filtra pel text de qualsevol etiqueta: «sistema» conserva la Consola i el Cervell', () => {
  const titols = () => [...document.querySelectorAll('article.sp-card .sp-card-title')].map((titol) => titol.textContent);
  mocks.core = ambPagines(['consola', 'cervell', 'disseny']);
  mocks.params = new URLSearchParams({ category: 'sistema' });
  render(<MurSection />);
  // De més nova a més vella: el Cervell (09-09) i la Consola (08-09). Disseny no porta «Sistema».
  expect(titols()).toEqual(['El Cervell', 'Consola Termodinàmica']);
  cleanup();

  // La segona etiqueta també casa: no és només la primera.
  mocks.params = new URLSearchParams({ category: 'Manteniment' });
  render(<MurSection />);
  expect(titols()).toEqual(['Consola Termodinàmica']);
  cleanup();

  mocks.params = new URLSearchParams({ category: 'Pedra Seca' });
  render(<MurSection />);
  expect(titols()).toEqual(['Disseny Pedra Seca']);
  cleanup();

  // Sense el paràmetre, les tres.
  mocks.params = new URLSearchParams();
  render(<MurSection />);
  expect(titols()).toHaveLength(3);
});

test('261007 · el Mur no resol cap xat ni passa cap gestor de Comentar propi a les targetes', () => {
  const codi = (font) => font.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  expect(codi(fontMur)).not.toMatch(/useComentaAlXatCorporatiu|useXatCorporatiu|onComentarSistema/);
  expect(codi(fontTargeta)).not.toMatch(/useComentaAlXatCorporatiu|useXatCorporatiu|onComentarSistema|onComment=/);
});
