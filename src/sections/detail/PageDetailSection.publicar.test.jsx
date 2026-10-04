/**
 * T8 (ordre del Mestre, 261004, prompt 261004_0515 §6) · De punta a punta,
 * amb la UniversalPage i el PageFrame de veres: a /page/<clau> d'una targeta
 * del Panell, el botonaco Publicar és dins del bloc del títol (header
 * .page-title), davall de l'H1 i abans del copyright, i el de baix continua al
 * final del text. Una pàgina sense destí no porta cap div.page-title-accio
 * (Llei del Píxel). I la capçalera (hero) de la pàgina és la imatge de la seua
 * targeta del Panell: una sola font.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from '../../app/contexts/RouterContext';

const estat = vi.hoisted(() => ({ toast: vi.fn(), pageCopy: {} }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: estat.toast }) }));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_, reserva) => reserva })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', pages: [], pageCopy: estat.pageCopy })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

import PageDetailSection from './PageDetailSection.jsx';
import { contingutDe, destiDePagina } from '../control/destinsControl.js';

function Ubicacio() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacio">{pathname}</output>;
}
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

beforeEach(() => {
  estat.toast.mockReset();
  estat.pageCopy = {};
});
afterEach(cleanup);

test('Publicar al Mur: el botó és dins del bloc del títol, davall de l’H1 i abans del copyright; el de baix es conserva', () => {
  visita('publicar_mur');
  const fills = [...capcalera().children].map((fill) => fill.tagName + (fill.className ? `.${fill.className.split(' ')[0]}` : ''));
  const h1 = fills.indexOf('H1');
  const accio = fills.indexOf('DIV.page-title-accio');
  const copyright = fills.indexOf('P.sp-card-copyright');
  expect([h1 >= 0, accio > h1, copyright > accio]).toEqual([true, true, true]);
  const dalt = capcalera().querySelector('.page-title-accio > a');
  expect([dalt.className, dalt.getAttribute('href')]).toEqual([CLASSE, '/notes']);
  const baix = document.querySelector('article.content-wrapper .sdp-pagina-accio > a');
  expect([baix.className, baix.getAttribute('href')]).toEqual([CLASSE, '/notes']);
  expect(screen.getAllByRole('link', { name: 'Publicar al Mur' })).toHaveLength(2);
  fireEvent.click(dalt);
  expect(screen.getByTestId('ubicacio').textContent).toBe('/notes');
});

test('Vehicle Compartit: dalt i baix, el mateix botó inert que avisa; la capçalera és la imatge de la seua targeta', () => {
  visita('vehicle_compartit');
  const inerts = screen.getAllByRole('button', { name: 'Publicar: Vehicle Compartit (en obres)' });
  expect(inerts).toHaveLength(2);
  expect(inerts[0].closest('.page-title-accio')).not.toBeNull();
  expect(inerts[1].closest('.sdp-pagina-accio')).not.toBeNull();
  fireEvent.click(inerts[0]);
  expect(estat.toast).toHaveBeenLastCalledWith('“Publicar: Vehicle Compartit” encara està en obres.');
  /* T8 · El hero de la pàgina és el SEAT 600, el mateix que la targeta del Panell. */
  const hero = document.querySelector('.hero-image img');
  const targeta = contingutDe(destiDePagina('vehicle_compartit'));
  expect([hero.getAttribute('src'), hero.getAttribute('alt')]).toEqual([targeta.imatge, targeta.imatgeAlt]);
  expect(targeta.imatge).toBe('/assets/nano_cards/vehicle_nano_card.jpg');
});

test('una pàgina sense destí no porta cap div.page-title-accio ni cap botó', () => {
  estat.pageCopy = { guia: { title: 'Guia del poble', html: '<p>Text</p>' } };
  visita('guia');
  expect(capcalera()).not.toBeNull();
  expect(document.querySelector('.page-title-accio')).toBeNull();
  expect(document.querySelector('.sdp-boto')).toBeNull();
});
