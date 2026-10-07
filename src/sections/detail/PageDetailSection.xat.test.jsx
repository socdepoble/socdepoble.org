/**
 * Ordre del Mestre (261007) · «El Xat» a /page/xat, de punta a punta, amb la
 * UniversalPage i el PageFrame de veres:
 *  · davall de l'H1, el gran botó «Anar al xat» (accioPrincipal), el MATEIX
 *    de la seua targeta del Mur: la porta gran i blava de Pedra Seca cap a
 *    /xat;
 *  · la capçalera és la il·lustració de la pàgina (la de la targeta);
 *  · Comentar, a la barra blava, obri el menú de dues vies: «En privat», el
 *    missatge directe amb Sóc de Poble (la pàgina la signa l'entitat).
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';

const estat = vi.hoisted(() => ({ toast: vi.fn() }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: estat.toast }) }));
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
import { TEXTOS_COMENTAR } from '../../components/universal/barres/BarraBlava.jsx';

function Ubicacio() {
  const { pathname, search } = useLocation();
  return <output data-testid="ubicacio">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const ubicacio = () => screen.getByTestId('ubicacio').textContent;
const visita = (clau) => render(
  <MemoryRouter rutaInicial={`/page/${clau}`}>
    <Routes>
      <Route path="/page/:slug" element={<PageDetailSection />} />
    </Routes>
    <Ubicacio />
  </MemoryRouter>
);
const capcalera = () => document.querySelector('header.page-title');
const CLASSE = 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple';

beforeEach(() => { estat.toast.mockReset(); });
afterEach(cleanup);

test('El Xat: «Anar al xat» davall de l’H1, la porta gran i blava cap a /xat; cap Publicar baix', () => {
  visita('xat');
  expect(capcalera().querySelector('h1').textContent).toBe('El Xat');
  const fills = [...capcalera().children].map((fill) => fill.tagName + (fill.className ? `.${fill.className.split(' ')[0]}` : ''));
  expect(fills.indexOf('DIV.page-title-accio')).toBeGreaterThan(fills.indexOf('H1'));
  const boto = capcalera().querySelector('.page-title-accio > a');
  expect([boto.className, boto.getAttribute('href'), boto.textContent]).toEqual([CLASSE, '/xat', 'Anar al xat']);
  expect(screen.getAllByRole('link', { name: 'Anar al xat' })).toHaveLength(1);
  expect(document.querySelector('.sdp-pagina-accio')).toBeNull();
  fireEvent.click(boto);
  expect(ubicacio()).toBe('/xat');
});

test('El Xat: la capçalera és la il·lustració de la pàgina, la mateixa de la targeta', () => {
  visita('xat');
  const hero = document.querySelector('.hero-image img');
  expect([hero.getAttribute('src'), hero.getAttribute('alt')]).toEqual([PAGE_COPY.xat.image, PAGE_COPY.xat.imageAlt]);
});

/* Ordre del Mestre (261007) · «Comentaris = xat»: Comentar obri el menú de
   dues vies. «En privat» és el missatge directe amb Sóc de Poble; «En
   públic» es queda desactivada, perquè /page/xat encara no té xat públic
   (el contracte no l'admet). */
test('El Xat: Comentar de la barra blava obri el menú; «En privat» porta al missatge directe amb Sóc de Poble', () => {
  visita('xat');
  const comentar = document.querySelector('header.bar-blue .sp-card-actions').children[1];
  expect(comentar.getAttribute('aria-label')).toMatch(/^Comentar/);
  expect(comentar.getAttribute('aria-haspopup')).toBe('menu');
  fireEvent.click(comentar);
  const menu = screen.getByRole('menu', { name: TEXTOS_COMENTAR.menu[1] });
  const publica = within(menu).getByRole('menuitem', { name: TEXTOS_COMENTAR.public[1] });
  expect(publica.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(within(menu).getByRole('menuitem', { name: TEXTOS_COMENTAR.privat[1] }));
  const url = new URL(ubicacio(), 'http://localhost');
  expect([url.pathname, url.searchParams.get('amb'), url.searchParams.get('sobre')]).toEqual(['/xat', 'socdepoble', null]);
  expect(estat.toast).not.toHaveBeenCalled();
});

test('una pàgina del sistema sense acció no porta cap div.page-title-accio', () => {
  visita('notes_shared');
  expect(capcalera()).not.toBeNull();
  expect(document.querySelector('.page-title-accio')).toBeNull();
});
